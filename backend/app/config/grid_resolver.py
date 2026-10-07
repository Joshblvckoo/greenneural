from app.config.entsoe_regions import (
    AWS_ENTSOE_MAP,
    AZURE_ENTSOE_MAP,
    GCP_ENTSOE_MAP,
)
from app.config.electricitymaps_regions import (
    AWS_ELECTRICITYMAPS_MAP,
    AZURE_ELECTRICITYMAPS_MAP,
    GCP_ELECTRICITYMAPS_MAP,
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
_ELECTRICITYMAPS_MAPS = {
    "aws": AWS_ELECTRICITYMAPS_MAP,
    "azure": AZURE_ELECTRICITYMAPS_MAP,
    "gcp": GCP_ELECTRICITYMAPS_MAP,
}


def _resolve(maps: dict[str, dict[str, str]], provider: str, region: str):
    provider_map = maps.get(provider.lower())
    if provider_map is None:
        return None
    return provider_map.get(region.lower())


def resolve_entsoe(provider: str, region: str):
    return _resolve(_ENTSOE_MAPS, provider, region)


def resolve_watttime(provider: str, region: str):
    return _resolve(_WATTTIME_MAPS, provider, region)


def resolve_electricitymaps(provider: str, region: str):
    return _resolve(_ELECTRICITYMAPS_MAPS, provider, region)
