def map_aws_region(region):
    if region == "eu-west-2":
        return "UK"

    if region in ["us-east-1", "us-west-2"]:
        return "US"

    if region in ["eu-north-1", "eu-central-1"]:
        return "EU"

    return "STATIC"
