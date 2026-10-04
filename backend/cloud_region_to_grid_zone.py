"""Maps cloud-provider regions to Electricity Maps grid-zone codes."""

from app.api.v1.regions.aws import AWS_REGION_MAP

CLOUD_REGION_MAP: dict[str, dict[str, str]] = {
    "aws": AWS_REGION_MAP,
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
