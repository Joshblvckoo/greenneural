from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, HTTPException

from app.api.v1.providers.uk_grid import get_uk_intensity
from app.api.v1.providers.watttime import watttime_get_moer
from app.api.v1.providers.entsoe import get_entsoe_intensity
from app.api.v1.providers.static import get_static_intensity

from app.api.v1.regions.aws import US_REGION_MAP as AWS_US_REGION_MAP, map_aws_region
from app.api.v1.regions.azure import US_REGION_MAP as AZURE_US_REGION_MAP, map_azure_region
from app.api.v1.regions.gcp import US_REGION_MAP as GCP_US_REGION_MAP, map_gcp_region

router = APIRouter(prefix="/carbon")

US_REGION_MAP = {
    "aws": AWS_US_REGION_MAP,
    "azure": AZURE_US_REGION_MAP,
    "gcp": GCP_US_REGION_MAP,
}

EU_REGION_MAP = {
    "aws": {"eu-north-1", "eu-central-1", "eu-west-1"},
    "azure": {"northeurope", "westeurope", "norwayeast"},
    "gcp": {"europe-west1", "europe-north1"},
}


def resolve_grid(provider: str, region: str):
    provider = provider.lower()

    if provider == "aws":
        return map_aws_region(region)
    if provider == "azure":
        return map_azure_region(region)
    if provider == "gcp":
        return map_gcp_region(region)

    raise HTTPException(400, "Unsupported provider")


async def get_carbon_intensity(provider: str, region: str) -> float | None:
    provider = provider.lower()
    normalized_region = region.lower()
    grid_zone = resolve_grid(provider, normalized_region)

    try:
        if provider in US_REGION_MAP and normalized_region in US_REGION_MAP[provider]:
            ba = US_REGION_MAP[provider][normalized_region]
            intensity = await watttime_get_moer(ba)
        elif grid_zone == "UK":
            intensity = await get_uk_intensity()
        elif (
            provider in EU_REGION_MAP
            and normalized_region in EU_REGION_MAP[provider]
        ):
            intensity = await get_entsoe_intensity(normalized_region)
        else:
            intensity = get_static_intensity(normalized_region)

    except HTTPException:
        raise
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=502,
            detail="Carbon intensity provider request failed",
        ) from error
    return intensity


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
