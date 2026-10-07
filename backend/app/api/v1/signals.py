from typing import Any

from fastapi import APIRouter

from app.api.v1.providers.live_home import compute_live_home


router = APIRouter(prefix="/signals", tags=["signals"])


def _cleanest_payload(snapshot: dict[str, Any]) -> dict[str, Any]:
    return {
        "cleanest": snapshot.get("cleanest_global"),
    }


@router.get("/cleanest")
async def cleanest_region() -> dict[str, Any]:
    return _cleanest_payload(await compute_live_home())
