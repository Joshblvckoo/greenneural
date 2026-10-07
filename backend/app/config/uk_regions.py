UK_CARBON_INTENSITY_MAP = {
    "aws": {
        "eu-west-2": "london",
    },
    "azure": {
        "uksouth": "south_england",
        "ukwest": "wales",
    },
    "gcp": {
        "europe-west2": "london",
    },
}

UK_CARBON_INTENSITY_REGION_IDS = {
    "london": 13,
    "south_england": 12,
    "wales": 7,
}


def resolve_uk_region(provider: str, region: str) -> str | None:
    return UK_CARBON_INTENSITY_MAP.get(provider.lower(), {}).get(region.lower())


def resolve_uk_region_id(provider: str, region: str) -> int | None:
    uk_region = resolve_uk_region(provider, region)
    if uk_region is None:
        return None
    return UK_CARBON_INTENSITY_REGION_IDS[uk_region]
