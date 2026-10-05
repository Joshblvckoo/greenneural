US_REGION_MAP = {
    "eastus": "PJM_ROANOKE",
    "westus": "CAISO_NORTH",
    "westus2": "BPA",
}


def map_azure_region(region):
    region = region.lower()
    uk_regions = ["uksouth", "ukwest"]
    us_regions = ["eastus", "westus", "centralus"]
    eu_regions = ["northeurope", "westeurope", "norwayeast"]

    if region.lower() in uk_regions:
        return "UK"

    if region in US_REGION_MAP:
        return US_REGION_MAP[region]

    if region.lower() in us_regions:
        return "US"

    if region.lower() in eu_regions:
        return "EU"

    return "STATIC"
