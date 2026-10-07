from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, HTTPException

from app.api.v1.providers.uk_grid import get_uk_intensity
from app.api.v1.providers.watttime import watttime_get_moer
from app.api.v1.providers.entsoe import ENTSOE_ZONE_CODES, entsoe_intensity
from app.config.grid_resolver import (
    resolve_electricitymaps,
    resolve_entsoe,
    resolve_watttime,
)
from app.config.uk_regions import UK_CARBON_INTENSITY_MAP, resolve_uk_region_id
from app.services.electricitymaps_client import ElectricityMapsClient

router = APIRouter(prefix="/carbon")
_electricitymaps_client = ElectricityMapsClient()

UK_REGION_MAP = {
    provider: set(regions)
    for provider, regions in UK_CARBON_INTENSITY_MAP.items()
}


async def get_carbon_intensity(provider: str, region: str) -> float | None:
    provider = provider.lower()
    normalized_region = region.lower()
    candidates = []

    if (ba := resolve_watttime(provider, normalized_region)) is not None:
        candidates.append(("WattTime", lambda: watttime_get_moer(ba)))
    if (zone_code := resolve_entsoe(provider, normalized_region)) is not None:
        candidates.append(
            (
                "ENTSO-E",
                lambda: entsoe_intensity(ENTSOE_ZONE_CODES[zone_code]),
            )
        )
    if normalized_region in UK_REGION_MAP.get(provider, set()):
        uk_region_id = resolve_uk_region_id(provider, normalized_region)
        candidates.append(
            (
                "UK Carbon Intensity API",
                lambda: get_uk_intensity(uk_region_id),
            )
        )
    if (em_zone := resolve_electricitymaps(provider, normalized_region)) is not None:
        candidates.append(
            (
                "Electricity Maps",
                lambda: _electricitymaps_client.get_intensity_by_zone(em_zone),
            )
        )

    if not candidates:
        raise HTTPException(
            status_code=503,
            detail=(
                "No live carbon intensity source is configured for "
                f"{provider}/{normalized_region}."
            ),
        )

    errors = []
    for source_name, fetch_intensity in candidates:
        try:
            intensity = await fetch_intensity()
        except HTTPException as error:
            errors.append(f"{source_name}: {error.detail}")
            continue
        except httpx.HTTPError as error:
            errors.append(f"{source_name}: {type(error).__name__}")
            continue
        if intensity is not None:
            return float(intensity)
        errors.append(f"{source_name}: no intensity reading returned")

    raise HTTPException(
        status_code=502,
        detail="All configured carbon intensity sources failed: " + "; ".join(errors),
    )


@router.get("/intensity")
async def carbon_intensity(provider: str, region: str):
    intensity = await get_carbon_intensity(provider, region)
    return {
        "region": region,
        "provider": provider,
        "intensity_gco2_per_kwh": intensity,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/cleanest-region")
async def cleanest_region(provider: str):
    test_regions = {
        "aws": ["eu-west-2", "eu-north-1", "us-east-1", "us-west-2"],
        "azure": ["uksouth", "northeurope", "eastus"],
        "gcp": ["europe-west2", "us-central1", "europe-west1"]
    }

    if provider.lower() not in test_regions:
        raise HTTPException(400, "Unsupported provider")

    results = []
    for region in test_regions[provider.lower()]:
        try:
            intensity = await carbon_intensity(provider, region)
            if intensity["intensity_gco2_per_kwh"] is not None:
                results.append(intensity)
        except HTTPException:
            continue

    if not results:
        raise HTTPException(
            status_code=502,
            detail="Carbon intensity data is unavailable for this provider",
        )

    cleanest = min(results, key=lambda result: result["intensity_gco2_per_kwh"])
    return cleanest
