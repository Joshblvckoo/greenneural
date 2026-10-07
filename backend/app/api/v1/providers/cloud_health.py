import asyncio
import time
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException

from backend.app.api.v1.carbon.routes import get_carbon_intensity

CLOUD_REGIONS = {
    "aws": [
        "us-east-1",
        "us-west-2",
        "eu-north-1",
        "eu-west-1",
        "eu-west-2",
    ],
    "azure": [
        "eastus",
        "westus2",
        "norwayeast",
        "uksouth",
        "westeurope",
    ],
    "gcp": [
        "us-central1",
        "us-east1",
        "europe-west1",
        "europe-west2",
    ],
}

_CACHE_TTL_SECONDS = 60
_cached_health: dict[str, Any] | None = None
_cache_generated_at: str | None = None
_cache_expires_at = 0.0
_cache_lock = asyncio.Lock()


async def _get_region_intensity(provider: str, region: str) -> dict[str, Any] | None:
    try:
        intensity = await get_carbon_intensity(provider, region)
    except HTTPException:
        return None
    if intensity is None:
        return None
    return {"region": region, "intensity": intensity}


async def _fetch_provider_health() -> dict[str, Any]:
    health: dict[str, Any] = {}
    for provider, regions in CLOUD_REGIONS.items():
        samples = await asyncio.gather(
            *(_get_region_intensity(provider, region) for region in regions)
        )
        available = [sample for sample in samples if sample is not None]
        if not available:
            continue

        health[provider] = {
            "average_intensity": round(
                sum(sample["intensity"] for sample in available) / len(available)
            ),
            "cleanest_region": min(
                available,
                key=lambda sample: sample["intensity"],
            ),
            "regions_available": len(available),
            "regions_checked": len(regions),
        }
    return health


async def compute_provider_health() -> dict[str, Any]:
    global _cached_health, _cache_generated_at, _cache_expires_at

    if _cached_health is not None and time.monotonic() < _cache_expires_at:
        return {
            "provider_health": _cached_health,
            "generated_at": _cache_generated_at,
        }

    async with _cache_lock:
        if _cached_health is None or time.monotonic() >= _cache_expires_at:
            _cached_health = await _fetch_provider_health()
            _cache_generated_at = datetime.now(timezone.utc).isoformat()
            _cache_expires_at = time.monotonic() + _CACHE_TTL_SECONDS

    return {
        "provider_health": _cached_health,
        "generated_at": _cache_generated_at,
    }
