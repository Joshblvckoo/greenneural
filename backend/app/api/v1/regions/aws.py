US_REGION_MAP = {
    "us-east-1": "PJM_COMED",
    "us-east-2": "PJM_AEP",
    "us-west-1": "CAISO_NORTH",
    "us-west-2": "CAISO_SOUTH",
}


def map_aws_region(region):
    region = region.lower()

    if region == "eu-west-2":
        return "UK"

    if region in US_REGION_MAP:
        return US_REGION_MAP[region]

    if region in ["eu-north-1", "eu-central-1", "eu-west-1"]:
        return "EU"

    return "STATIC"
