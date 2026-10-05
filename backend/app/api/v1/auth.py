import os

import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_anon_key = os.getenv("SUPABASE_ANON_KEY") or os.getenv(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
    if not supabase_url or not supabase_anon_key:
        raise HTTPException(
            status_code=503,
            detail="Authentication service is not configured",
        )

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{supabase_url.rstrip('/')}/auth/v1/user",
                headers={
                    "apikey": supabase_anon_key,
                    "Authorization": f"Bearer {credentials.credentials}",
                },
            )
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=503,
            detail="Authentication service is unavailable",
        ) from error

    if response.status_code == 401:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if response.status_code != 200:
        raise HTTPException(
            status_code=503,
            detail="Unable to verify access token",
        )

    try:
        user = response.json()
    except ValueError as error:
        raise HTTPException(
            status_code=503,
            detail="Authentication service returned an invalid response",
        ) from error

    if not isinstance(user, dict) or not user.get("id"):
        raise HTTPException(
            status_code=503,
            detail="Authentication service returned an invalid user",
        )
    return user
