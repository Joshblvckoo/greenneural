"""Maps cloud-provider regions to Electricity Maps grid-zone codes."""

CLOUD_REGION_MAP: dict[str, dict[str, str]] = {
    "aws": {
        "us-west-2": "US-PNW",
        "us-west-1": "US-CAL-CISO",
        "us-east-1": "US-MIDA-PJM",
        "eu-west-1": "IE",
        "eu-west-2": "GB",
        "eu-central-1": "DE",
        "eu-north-1": "SE",
    },
    "azure": {
        "eastus": "US-SOUTHEAST",
        "westus": "US-CAL-CISO",
        "uksouth": "GB",
        "germanywestcentral": "DE",
    },
    "gcp": {
        "us-west1": "US-PNW",
        "us-central1": "US-MIDW-MISO",
        "europe-west1": "DE",
        "europe-west2": "GB",
    },
}
