US_REGION_MAP = {
    "us-east-1": "PJM_ROANOKE",
    "us-east-2": "PJM_WEST",
    "us-west-1": "CAISO_SOUTH",
    "us-west-2": "BPA",
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
