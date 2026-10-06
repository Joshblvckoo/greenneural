AWS_WATTIME_MAP = {
    "us-east-1": "PJM_ROANOKE",
    "us-east-2": "PJM_WEST",
    "us-west-1": "CAISO_NORTH",
    "us-west-2": "BPA",
}

AZURE_WATTIME_MAP = {
    "eastus": "PJM_ROANOKE",
    "eastus2": "PJM_WEST",
    "westus": "CAISO_NORTH",
    "westus2": "BPA",
    "centralus": "MISO",
    "southcentralus": "ERCOT_NORTH",
}

GCP_WATTIME_MAP = {
    "us-east1": "PJM_ROANOKE",
    "us-east4": "PJM_WEST",
    "us-west1": "CAISO_NORTH",
    "us-west2": "BPA",
    "us-central1": "MISO",
}

_PROVIDER_MAPS = {
    "aws": AWS_WATTIME_MAP,
    "azure": AZURE_WATTIME_MAP,
    "gcp": GCP_WATTIME_MAP,
}


def get_wattime_ba(provider: str, region: str) -> str | None:
    provider_map = _PROVIDER_MAPS.get(provider.lower())
    if provider_map is None:
        return None
    return provider_map.get(region.lower())
