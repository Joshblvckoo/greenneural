import os
from datetime import datetime

import httpx
from fastapi import HTTPException

from app.config.regions import get_supported_regions
from cloud_region_to_grid_zone import CLOUD_REGION_MAP


async def _get_zone_carbon_intensity(zone_code: str) -> float:
    url = f"https://api.electricitymap.org/v3/carbon-intensity/latest?zone={zone_code}"
    api_key = os.getenv("ELECTRICITY_MAPS_KEY") or os.getenv(
        "ELECTRICITYMAPS_API_KEY"
    )
    headers = {"auth-token": api_key} if api_key else {}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        data = response.json()

    if response.status_code != 200:
        error_msg = data.get("message", data.get("error", "unknown error"))
        raise HTTPException(
            status_code=502,
            detail=f"Electricity Maps API error: {error_msg}",
        )
    if "carbonIntensity" not in data:
        raise HTTPException(
            status_code=502,
            detail=(
                "Electricity Maps API returned unexpected response "
                f"for zone {zone_code}"
            ),
        )
    return data["carbonIntensity"]


async def get_carbon_intensity(provider: str, region: str) -> dict:
    provider = provider.lower()
    supported_regions = get_supported_regions(provider)

    if region not in supported_regions:
        return {
            "error": "Unsupported region",
            "provider": provider,
            "region": region,
            "supported_regions": supported_regions,
        }

    grid_zone = CLOUD_REGION_MAP.get(provider, {}).get(region)
    if not grid_zone:
        return {
            "provider": provider,
            "region": region,
            "intensity": None,
            "intensity_gco2_per_kwh": None,
            "status": "unsupported",
            "message": "Carbon intensity data not available for this region",
        }

    try:
        intensity = await _get_zone_carbon_intensity(grid_zone)
    except (HTTPException, httpx.HTTPError):
        return {
            "provider": provider,
            "region": region,
            "intensity": None,
            "intensity_gco2_per_kwh": None,
            "status": "unavailable",
            "message": "Carbon intensity data not available for this region",
        }

    return {
        "region": region,
        "provider": provider,
        "intensity_gco2_per_kwh": intensity,
        "timestamp": datetime.utcnow().isoformat(),
    }


async def get_cleanest_region(provider: str) -> dict:
    provider = provider.lower()
    region_zones = CLOUD_REGION_MAP.get(provider)
    if not region_zones:
        raise HTTPException(status_code=404, detail=f"Unknown provider: {provider}")

    intensities = []
    for region_code, grid_zone in region_zones.items():
        try:
            intensity = await _get_zone_carbon_intensity(grid_zone)
            intensities.append((region_code, intensity))
        except (HTTPException, httpx.HTTPError):
            continue

    if not intensities:
        return {
            "provider": provider,
            "intensity": None,
            "intensity_gco2_per_kwh": None,
            "status": "unavailable",
            "message": "Carbon intensity data not available for this provider",
        }

    intensities.sort(key=lambda item: item[1])
    cleanest_region, cleanest_value = intensities[0]

    return {
        "region": cleanest_region,
        "provider": provider,
        "intensity_gco2_per_kwh": cleanest_value,
        "ranked_regions": intensities,
    }
