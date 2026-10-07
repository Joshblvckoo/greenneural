from app.config.entsoe_regions import (
    AWS_ENTSOE_MAP,
    AZURE_ENTSOE_MAP,
    GCP_ENTSOE_MAP,
)
from app.config.watttime_regions import (
    AWS_WATTIME_MAP,
    AZURE_WATTIME_MAP,
    GCP_WATTIME_MAP,
)

_ENTSOE_MAPS = {
    "aws": AWS_ENTSOE_MAP,
    "azure": AZURE_ENTSOE_MAP,
    "gcp": GCP_ENTSOE_MAP,
}
_WATTTIME_MAPS = {
    "aws": AWS_WATTIME_MAP,
    "azure": AZURE_WATTIME_MAP,
    "gcp": GCP_WATTIME_MAP,
}


def resolve_entsoe(provider: str, region: str):
    if provider == "aws":
        return AWS_ENTSOE_MAP.get(region)
    if provider == "azure":
        return AZURE_ENTSOE_MAP.get(region)
    if provider == "gcp":
        return GCP_ENTSOE_MAP.get(region)
    return None


def resolve_watttime(provider: str, region: str):
    if provider == "aws":
        return AWS_WATTIME_MAP.get(region)
    if provider == "azure":
        return AZURE_WATTIME_MAP.get(region)
    if provider == "gcp":
        return GCP_WATTIME_MAP.get(region)
    return None
