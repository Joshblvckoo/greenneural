REGION_MAP = {
    "aws": [
        "us-east-1", "us-east-2",
        "us-west-1", "us-west-2",
        "ca-central-1", "ca-west-1",
        "eu-west-1", "eu-west-2", "eu-west-3",
        "eu-central-1", "eu-central-2",
        "eu-north-1",
        "eu-south-1", "eu-south-2",
        "ap-south-1", "ap-south-2",
        "ap-southeast-1", "ap-southeast-2", "ap-southeast-3",
        "ap-northeast-1", "ap-northeast-2", "ap-northeast-3",
        "me-south-1", "me-central-1",
        "sa-east-1",
        "af-south-1",
        "il-central-1",
        "us-gov-west-1", "us-gov-east-1",
        "cn-north-1", "cn-northwest-1"
    ],

    "azure": [
        "eastus", "eastus2",
        "westus", "westus2", "westus3",
        "centralus", "northcentralus", "southcentralus", "westcentralus",
        "canadacentral", "canadaeast",
        "brazilsouth", "brazilsoutheast",
        "northeurope", "westeurope",
        "uksouth", "ukwest",
        "francecentral", "francesouth",
        "germanynorth", "germanywestcentral",
        "switzerlandnorth", "switzerlandwest",
        "norwayeast", "norwaywest",
        "swedencentral", "swedensouth",
        "italynorth", "spaincentral", "polandcentral",
        "southafricanorth", "southafricawest",
        "uaenorth", "uaecentral", "qatarcentral", "israelcentral",
        "indiacentral", "indiasouth", "indiawest",
        "southeastasia", "eastasia",
        "australiaeast", "australiasoutheast",
        "australiacentral", "australiacentral2",
        "japaneast", "japanwest",
        "koreacentral", "koreasouth"
    ],

    "gcp": [
        "us-central1",
        "us-east1", "us-east4",
        "us-west1", "us-west2", "us-west3", "us-west4",
        "northamerica-northeast1", "northamerica-northeast2",
        "southamerica-east1", "southamerica-west1",
        "europe-west1", "europe-west2", "europe-west3",
        "europe-west4", "europe-west6",
        "europe-central2", "europe-north1",
        "asia-east1", "asia-east2",
        "asia-northeast1", "asia-northeast2", "asia-northeast3",
        "asia-south1", "asia-south2",
        "asia-southeast1", "asia-southeast2",
        "australia-southeast1", "australia-southeast2",
        "me-central1", "me-west1"
    ]
}


def get_supported_regions(provider: str) -> list[str]:
    return REGION_MAP.get(provider.lower(), [])
