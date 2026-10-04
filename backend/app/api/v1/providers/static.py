STATIC_INTENSITY = {
    # Africa
    "af-south-1": 700,
    "southafrica-north": 690,
    "southafrica-west": 710,

    # Middle East
    "me-south-1": 550,
    "uae-central": 540,
    "uae-north": 560,

    # Asia
    "ap-south-1": 650,      # India
    "ap-south-2": 640,
    "ap-northeast-1": 420,  # Japan
    "ap-northeast-2": 430,
    "ap-southeast-1": 500,  # Singapore
    "ap-southeast-2": 480,  # Australia

    # South America
    "sa-east-1": 400,       # Brazil
    "southamerica-east1": 390,

    # Canada
    "ca-central-1": 120,    # Hydro-heavy
    "northamerica-northeast1": 130,

    # Default fallback
    "default": 450
}

def get_static_intensity(region):
    region = region.lower()
    return STATIC_INTENSITY.get(region, STATIC_INTENSITY["default"])
