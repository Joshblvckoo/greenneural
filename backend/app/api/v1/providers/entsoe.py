import httpx
import os
from datetime import datetime, timedelta
import xml.etree.ElementTree as ET

API_KEY = os.getenv("ENTSOE_API_KEY")

# Emission factors (gCO2/kWh)
EMISSION_FACTORS = {
    "Fossil Gas": 490,
    "Fossil Hard coal": 820,
    "Fossil Brown coal/Lignite": 1050,
    "Fossil Oil": 650,
    "Biomass": 230,
    "Waste": 350,
    "Nuclear": 12,
    "Hydro Run-of-river": 24,
    "Hydro Water Reservoir": 24,
    "Hydro Pumped Storage": 24,
    "Solar": 45,
    "Wind Onshore": 11,
    "Wind Offshore": 8,
    "Geothermal": 38,
}

# Map AWS/Azure/GCP EU regions → ENTSO-E bidding zones
ENTSOE_ZONES = {
    "eu-north-1": "10YFI-1--------U",      # Finland
    "eu-central-1": "10YDE-1--------W",    # Germany
    "eu-west-1": "10YFR-RTE------C",       # France
    "europe-west1": "10YBE----------2",    # Belgium
    "europe-north1": "10YFI-1--------U",   # Finland
}


async def get_entsoe_intensity(region):
    if region not in ENTSOE_ZONES:
        return 200  # fallback

    zone = ENTSOE_ZONES[region]

    now = datetime.utcnow()
    start = now.strftime("%Y%m%d%H00")
    end = (now + timedelta(hours=1)).strftime("%Y%m%d%H00")

    url = "https://transparency.entsoe.eu/api"
    params = {
        "securityToken": API_KEY,
        "documentType": "A75",  # Actual generation per type
        "processType": "A16",   # Real-time
        "in_Domain": zone,
        "periodStart": start,
        "periodEnd": end,
    }

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(url, params=params)

    if response.status_code != 200:
        return 200  # fallback

    root = ET.fromstring(response.text)

    total_generation = 0
    weighted_emissions = 0

    for time_series in root.findall(".//TimeSeries"):
        fuel_type = time_series.find("MktPSRType/psrType").text

        factor = EMISSION_FACTORS.get(fuel_type, None)
        if factor is None:
            continue

        for period in time_series.findall(".//Period"):
            for point in period.findall("Point"):
                mw = float(point.find("quantity").text)
                total_generation += mw
                weighted_emissions += mw * factor

    if total_generation == 0:
        return 200  # fallback

    intensity = weighted_emissions / total_generation
    return round(intensity)
