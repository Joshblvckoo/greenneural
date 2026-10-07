import logging
import os
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

from app.api.v1.auth import bearer_scheme, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upgrade-log", tags=["upgrade-log"])


class UpgradeEntryRequest(BaseModel):
    entry: str = Field(min_length=1, max_length=1000)


def _supabase_config() -> tuple[str, str]:
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY") or os.getenv(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
    if not supabase_url or not anon_key:
        raise HTTPException(
            status_code=503,
            detail="Upgrade log service is not configured",
        )
    return supabase_url.rstrip("/"), anon_key


def _is_admin(user: dict[str, Any]) -> bool:
    app_metadata = user.get("app_metadata")
    return isinstance(app_metadata, dict) and app_metadata.get("role") == "admin"


async def _supabase_request(
    method: str,
    access_token: str,
    *,
    payload: dict[str, Any] | None = None,
) -> Any:
    supabase_url, anon_key = _supabase_config()
    headers = {
        "apikey": anon_key,
        "Authorization": "Bearer " + access_token,
    }
    if method == "POST":
        headers["Prefer"] = "return=representation"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.request(
                method,
                f"{supabase_url}/rest/v1/daily_upgrade_log",
                params=(
                    {
                        "select": "id,entry,created_at",
                        "order": "created_at.desc",
                        "limit": "100",
                    }
                    if method == "GET"
                    else {"select": "id,entry,created_at"}
                ),
                headers=headers,
                json=payload,
            )
    except httpx.HTTPError as error:
        logger.warning("Supabase upgrade log request failed: %s", type(error).__name__)
        raise HTTPException(
            status_code=503,
            detail="Upgrade log service is temporarily unavailable",
        ) from error

    if response.status_code not in ({200} if method == "GET" else {200, 201}):
        logger.warning(
            "Supabase upgrade log request returned HTTP %s",
            response.status_code,
        )
        raise HTTPException(
            status_code=502,
            detail="Upgrade log service is temporarily unavailable",
        )
    try:
        return response.json()
    except ValueError as error:
        raise HTTPException(
            status_code=502,
            detail="Upgrade log service returned an invalid response",
        ) from error


@router.get("")
async def get_upgrade_log(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    entries = await _supabase_request(
        "GET",
        credentials.credentials,
    )
    if not isinstance(entries, list):
        raise HTTPException(
            status_code=502,
            detail="Upgrade log service returned an invalid response",
        )
    return {"entries": entries, "is_admin": _is_admin(user)}


@router.post("")
async def add_upgrade_entry(
    request: UpgradeEntryRequest,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    if not _is_admin(user):
        raise HTTPException(status_code=403, detail="Not authorized")
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    entry = request.entry.strip()
    if not entry:
        raise HTTPException(status_code=422, detail="Entry must not be blank")

    result = await _supabase_request(
        "POST",
        credentials.credentials,
        payload={"entry": entry, "created_by": user["id"]},
    )
    if not isinstance(result, list) or not result:
        raise HTTPException(
            status_code=502,
            detail="Upgrade log service returned an invalid response",
        )
    return {"entry": result[0]}
