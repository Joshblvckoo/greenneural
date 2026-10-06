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


def resolve_entsoe(provider: str, region: str) -> str | None:
    provider_map = _ENTSOE_MAPS.get(provider.lower())
    return provider_map.get(region.lower()) if provider_map else None


def resolve_watttime(provider: str, region: str) -> str | None:
    provider_map = _WATTTIME_MAPS.get(provider.lower())
    return provider_map.get(region.lower()) if provider_map else None
