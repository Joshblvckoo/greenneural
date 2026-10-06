AWS_ENTSOE_MAP = {
    "eu-west-1": "IE",
    "eu-west-2": "GB",
    "eu-west-3": "FR",
    "eu-central-1": "DE_LU",
    "eu-central-2": "CH",
    "eu-north-1": "SE3",
    "eu-south-1": "IT_NORTH",
}

AZURE_ENTSOE_MAP = {
    "uksouth": "GB",
    "ukwest": "GB",
    "westeurope": "NL",
    "northeurope": "DK1",
    "germanywestcentral": "DE_LU",
    "swedencentral": "SE3",
    "italynorth": "IT_NORTH",
    "francecentral": "FR",
    "polandcentral": "PL",
}

GCP_ENTSOE_MAP = {
    "europe-west1": "FR",
    "europe-west2": "GB",
    "europe-west3": "DE_LU",
    "europe-west4": "NL",
    "europe-west6": "CH",
    "europe-north1": "SE3",
}

_PROVIDER_MAPS = {
    "aws": AWS_ENTSOE_MAP,
    "azure": AZURE_ENTSOE_MAP,
    "gcp": GCP_ENTSOE_MAP,
}


def get_entsoe_zone(provider: str, region: str) -> str | None:
    provider_map = _PROVIDER_MAPS.get(provider.lower())
    if provider_map is None:
        return None
    return provider_map.get(region.lower())
