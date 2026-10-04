def map_azure_region(region):
    uk_regions = ["uksouth", "ukwest"]
    us_regions = ["eastus", "westus", "centralus"]
    eu_regions = ["northeurope", "westeurope"]

    if region.lower() in uk_regions:
        return "UK"

    if region.lower() in us_regions:
        return "US"

    if region.lower() in eu_regions:
        return "EU"

    return "STATIC"
