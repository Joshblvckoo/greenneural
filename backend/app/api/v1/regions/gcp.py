US_REGION_MAP = {
    "us-central1": "MISO",
    "us-east1": "PJM_WEST",
    "us-west1": "CAISO_NORTH",
}


def map_gcp_region(region):
    region = region.lower()
    uk_regions = ["europe-west2"]
    us_regions = ["us-central1", "us-east1", "us-west1"]
    eu_regions = ["europe-west1", "europe-north1"]

    if region.lower() in uk_regions:
        return "UK"

    if region in US_REGION_MAP:
        return US_REGION_MAP[region]

    if region.lower() in us_regions:
        return "US"

    if region.lower() in eu_regions:
        return "EU"

    return "STATIC"
