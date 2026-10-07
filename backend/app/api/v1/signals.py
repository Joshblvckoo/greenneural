from typing import Any

from fastapi import APIRouter

from app.api.v1.providers.live_home import compute_live_home


router = APIRouter(prefix="/signals", tags=["signals"])


def _cleanest_payload(snapshot: dict[str, Any]) -> dict[str, Any]:
    top3 = [
        {
            "provider": region["provider"],
            "region": region["region"],
            "intensity": region["intensity"],
            "updated_at": region.get("updated_at"),
        }
        for region in snapshot.get("global_cleanest_top3", [])
    ]
    return {
        "cleanest": top3[0] if top3 else None,
        "top3": top3,
    }


@router.get("/cleanest")
async def cleanest_regions() -> dict[str, Any]:
    return _cleanest_payload(await compute_live_home())
