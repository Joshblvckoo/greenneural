from fastapi import APIRouter, HTTPException

from app.api.v1.providers.uk_grid import get_uk_intensity
from app.api.v1.providers.watttime import get_watttime_intensity
from app.api.v1.providers.entsoe import get_entsoe_intensity
from app.api.v1.providers.static import get_static_intensity

from app.api.v1.regions.aws import map_aws_region
from app.api.v1.regions.azure import map_azure_region
from app.api.v1.regions.gcp import map_gcp_region

router = APIRouter(prefix="/carbon")


def resolve_grid(provider: str, region: str):
    provider = provider.lower()

    if provider == "aws":
        return map_aws_region(region)
    if provider == "azure":
        return map_azure_region(region)
    if provider == "gcp":
        return map_gcp_region(region)

    raise HTTPException(400, "Unsupported provider")


@router.get("/intensity")
async def carbon_intensity(provider: str, region: str):
    grid = resolve_grid(provider, region)

    try:
        if grid == "UK":
            return {"provider": provider, "region": region, "gCO2_kWh": await get_uk_intensity()}

        if grid == "US":
            return {"provider": provider, "region": region, "gCO2_kWh": await get_watttime_intensity(region)}

        if grid == "EU":
            return {"provider": provider, "region": region, "gCO2_kWh": await get_entsoe_intensity(region)}

        return {"provider": provider, "region": region, "gCO2_kWh": get_static_intensity(region)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
            results.append(intensity)
        except:
            continue

    cleanest = min(results, key=lambda x: x["gCO2_kWh"])
    return cleanest
