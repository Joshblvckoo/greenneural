from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from collections import Counter
import asyncio
import os
from dotenv import load_dotenv
from pydantic import BaseModel
import httpx
from app.config.regions import get_supported_regions
from app.config.cities import CITIES, CITY_COORDS
from cloud_region_to_grid_zone import CLOUD_REGION_MAP

load_dotenv()


app = FastAPI(title="GreenNeural API", version="1.0")

origins = [
    "https://greenneural-frontend.vercel.app",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



ELECTRICITY_MAPS_KEY = os.getenv("ELECTRICITY_MAPS_KEY")
OPENWEATHER_API_KEY = os.getenv("OWM_KEY")

GLOBAL_CITY_LIST = [
    "london", "manchester", "birmingham", "paris", "berlin", "frankfurt",
    "madrid", "barcelona", "rome", "milan", "warsaw", "stockholm", "oslo",
    "zurich", "vienna", "new-york", "los-angeles", "chicago", "houston",
    "toronto", "vancouver", "montreal", "mexico-city", "são-paulo",
    "rio-de-janeiro", "buenos-aires", "santiago", "tokyo", "osaka", "seoul",
    "singapore", "hong-kong", "shanghai", "beijing", "mumbai", "delhi",
    "jakarta", "bangkok", "dubai", "abu-dhabi", "riyadh", "doha", "tel-aviv",
    "lagos", "nairobi", "cairo", "johannesburg", "cape-town", "sydney",
    "melbourne", "brisbane", "auckland",
]

RISK_BASE_SCORES = {"heat": 62, "flood": 48, "airquality": 55}
last_sci_result: dict | None = None
telemetry_events: list[dict] = []


def estimated_risk_score(city: str, layer: str) -> int:
    """Stable baseline estimate until live risk-data providers are configured."""
    adjustment = sum(ord(character) for character in city.lower()) % 21 - 10
    return max(0, min(100, RISK_BASE_SCORES[layer] + adjustment))


def compute_heat_risk(temp_c: float, humidity: float) -> int:
    if temp_c < 20:
        score = 10
    elif temp_c < 30:
        score = 30 + (temp_c - 20) * 3
    elif temp_c < 40:
        score = 60 + (temp_c - 30) * 3
    else:
        score = 95
    if humidity > 0.7:
        score += 5
    return max(0, min(100, round(score)))


def compute_flood_risk(precip_mm: float) -> int:
    if precip_mm < 5:
        score = 10
    elif precip_mm < 20:
        score = 30 + (precip_mm - 5) * 2
    elif precip_mm < 50:
        score = 60 + (precip_mm - 20) * (25 / 30)
    else:
        score = 95
    return max(0, min(100, round(score)))


def compute_air_risk(pm25: float) -> int:
    if pm25 < 12:
        score = 10
    elif pm25 < 35:
        score = 30 + (pm25 - 12) * (30 / 23)
    elif pm25 < 55:
        score = 60 + (pm25 - 35)
    else:
        score = 90
    return max(0, min(100, round(score)))


def risk_level(score: int, risk_type: str) -> str:
    if score <= 20:
        return "low"
    if score <= 60:
        return "moderate" if risk_type == "airquality" else "medium"
    if score <= 85:
        return "high"
    return "very high"


def risk_color(score: float) -> str:
    return "red" if score >= 70 else "green" if score <= 30 else "yellow"


def build_risk_response(
    city: str,
    country: str | None,
    lat: float,
    lon: float,
    heat_score: int,
    flood_score: int,
    air_score: int,
    temperature_c: float | None,
    humidity: float | None,
    precip_mm: float | None,
    pm25: float | None,
    pm10: float | None,
    aqi: int | None,
    data_source: str,
) -> dict:
    average_score = round((heat_score + flood_score + air_score) / 3, 1)
    return {
        "city": city,
        "country": country,
        "lat": lat,
        "lon": lon,
        "lng": lon,
        "heat_risk": {
            "score": heat_score,
            "level": risk_level(heat_score, "heat"),
            "temperature_c": temperature_c,
            "humidity": humidity,
        },
        "flood_risk": {
            "score": flood_score,
            "level": risk_level(flood_score, "flood"),
            "precip_mm": precip_mm,
        },
        "airquality_risk": {
            "score": air_score,
            "level": risk_level(air_score, "airquality"),
            "pm25": pm25,
            "pm10": pm10,
            "aqi": aqi,
        },
        # Backwards-compatible fields consumed by the current map components.
        "heat": heat_score,
        "flood": flood_score,
        "air": air_score,
        "total_risk": average_score,
        "color": risk_color(average_score),
        "data_source": data_source,
        "updated_at": datetime.utcnow().isoformat() + "Z",
    }


async def get_live_realtime_risk(city: str) -> dict:
    if not OPENWEATHER_API_KEY:
        coordinates = CITY_COORDS.get(city.strip().lower())
        if not coordinates:
            raise HTTPException(
                status_code=503,
                detail="Live risk data is unavailable until OWM_KEY is configured.",
            )
        canonical_city = coordinates["city"]
        heat_score = estimated_risk_score(canonical_city, "heat")
        flood_score = estimated_risk_score(canonical_city, "flood")
        air_score = estimated_risk_score(canonical_city, "airquality")
        return build_risk_response(
            canonical_city, None, coordinates["lat"], coordinates["lng"],
            heat_score, flood_score, air_score, None, None, None, None, None, None,
            "baseline_estimate",
        )

    timeout = httpx.Timeout(10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        geo_response = await client.get(
            "https://api.openweathermap.org/geo/1.0/direct",
            params={"q": city, "limit": 1, "appid": OPENWEATHER_API_KEY},
        )
        geo_response.raise_for_status()
        locations = geo_response.json()
        if not locations:
            raise HTTPException(status_code=404, detail="City was not found by the weather provider")

        location = locations[0]
        lat, lon = float(location["lat"]), float(location["lon"])
        weather_response, air_response = await asyncio.gather(
            client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY, "units": "metric"},
            ),
            client.get(
                "https://api.openweathermap.org/data/2.5/air_pollution",
                params={"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY},
            ),
        )
        weather_response.raise_for_status()
        air_response.raise_for_status()

    weather = weather_response.json()
    air_data = air_response.json()
    try:
        temperature_c = float(weather["main"]["temp"])
        humidity = float(weather["main"]["humidity"]) / 100
        precip_mm = float(weather.get("rain", {}).get("1h", 0)) + float(weather.get("snow", {}).get("1h", 0))
        air_entry = air_data["list"][0]
        components = air_entry["components"]
        pm25 = float(components["pm2_5"])
        pm10 = float(components.get("pm10", 0))
        aqi = int(air_entry["main"].get("aqi", 0))
    except (KeyError, IndexError, TypeError, ValueError) as error:
        raise HTTPException(status_code=502, detail="Weather provider returned an unexpected response") from error

    return build_risk_response(
        location.get("name", city), location.get("country"), lat, lon,
        compute_heat_risk(temperature_c, humidity), compute_flood_risk(precip_mm), compute_air_risk(pm25),
        temperature_c, humidity, precip_mm, pm25, pm10, aqi, "openweather_live",
    )


async def fetch_heat_risk(city: str):
    return {"score": estimated_risk_score(city, "heat")}


async def fetch_flood_risk(city: str):
    return {"score": estimated_risk_score(city, "flood")}


async def fetch_air_quality(city: str):
    return {"score": estimated_risk_score(city, "airquality")}


async def get_realtime_risk(city: str):
    heat, flood, air = await fetch_heat_risk(city), await fetch_flood_risk(city), await fetch_air_quality(city)
    return {
        "city": city,
        "heat": heat["score"],
        "flood": flood["score"],
        "air": air["score"],
        "total_risk": heat["score"] + flood["score"] + air["score"],
        "data_source": "baseline_estimate",
    }

async def get_carbon_intensity(zone_code: str):
    url = f"https://api.electricitymap.org/v3/carbon-intensity/latest?zone={zone_code}"
    # httpx rejects None-valued headers when the API key is not configured.
    # Omit the optional header in that case rather than passing None.
    headers = {"auth-token": ELECTRICITY_MAPS_KEY} if ELECTRICITY_MAPS_KEY else {}

    async with httpx.AsyncClient() as client:
        r = await client.get(url, headers=headers)
        data = r.json()
        if r.status_code != 200:
            error_msg = data.get("message", data.get("error", "unknown error"))
            raise HTTPException(status_code=502, detail=f"Electricity Maps API error: {error_msg}")
        if "carbonIntensity" not in data:
            raise HTTPException(status_code=502, detail=f"Electricity Maps API returned unexpected response for zone {zone_code}")
        return data["carbonIntensity"]



class SciInput(BaseModel):
    energy_kwh: float
    intensity_gco2_per_kwh: float
    embodied_emissions_gco2e: float
    functional_unit: str

class TelemetryEvent(BaseModel):
    event_type: str
    region: str | None = None
    city: str | None = None
    sci_value: float | None = None

@app.post("/api/v1/telemetry/event")
async def telemetry_event(event: TelemetryEvent):
    telemetry_events.append({
        "event_type": event.event_type,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })
    return {"status": "ok"}


@app.post("/api/v1/sci/calc")
async def sci_calc(body: SciInput):
    global last_sci_result
    E = body.energy_kwh
    I = body.intensity_gco2_per_kwh
    M = body.embodied_emissions_gco2e
    # R is descriptive here
    sci = (E * I) + M
    timestamp = datetime.utcnow().isoformat() + "Z"
    last_sci_result = {"score": sci, "timestamp": timestamp}
    return {"sci": sci, "inputs": body, "timestamp": timestamp}


@app.get("/api/v1/sci/last")
async def last_sci():
    if last_sci_result is None:
        return {"score": None, "interpretation": "No SCI calculations yet"}

    score = last_sci_result["score"]
    interpretation = "Low impact" if score < 1000 else "Moderate impact" if score < 2000 else "High impact"
    return {"score": score, "interpretation": interpretation, "timestamp": last_sci_result["timestamp"]}


@app.get("/api/v1/telemetry/summary")
async def telemetry_summary():
    counts = Counter(event["event_type"] for event in telemetry_events)
    top_feature = counts.most_common(1)[0][0] if counts else "No activity yet"
    last_event = telemetry_events[-1]["timestamp"] if telemetry_events else None
    return {
        "top_feature": top_feature,
        "last_event": last_event,
        "sci_count": counts["sci_calc"],
        "risk_count": counts["risk_check"],
    }


@app.get("/api/v1/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/v1/risk/realtime")
async def realtime_risk(city: str, risk_type: str | None = None):
    if risk_type and risk_type not in RISK_BASE_SCORES:
        raise HTTPException(status_code=400, detail="Invalid risk type")

    try:
        return await get_live_realtime_risk(city)
    except httpx.HTTPStatusError as error:
        raise HTTPException(status_code=502, detail="Weather provider request failed") from error
    except httpx.HTTPError as error:
        raise HTTPException(status_code=502, detail="Weather provider is unavailable") from error


@app.get("/api/v1/risk/top")
async def top_risk():
    results = [await get_realtime_risk(city) for city in GLOBAL_CITY_LIST]
    sorted_results = sorted(results, key=lambda result: result["total_risk"], reverse=True)
    return {
        "highest": sorted_results[0],
        "lowest": sorted_results[-1],
        "top_5": sorted_results[:5],
        "bottom_5": sorted_results[-5:],
        "top_5_by_layer": {
            "heat": sorted(results, key=lambda result: result["heat"], reverse=True)[:5],
            "flood": sorted(results, key=lambda result: result["flood"], reverse=True)[:5],
            "airquality": sorted(results, key=lambda result: result["air"], reverse=True)[:5],
        },
        "data_source": "baseline_estimate",
    }


@app.get("/api/v1/risk/live-map")
async def live_map(type: str):
    risk_fetchers = {
        "heat": fetch_heat_risk,
        "flood": fetch_flood_risk,
        "airquality": fetch_air_quality,
    }
    fetch_risk = risk_fetchers.get(type)
    if not fetch_risk:
        raise HTTPException(status_code=400, detail="Invalid risk type")

    results = []
    if OPENWEATHER_API_KEY:
        live_risks = await asyncio.gather(
            *(get_live_realtime_risk(city["city"]) for city in CITIES),
            return_exceptions=True,
        )
        for city, live_risk in zip(CITIES, live_risks):
            if isinstance(live_risk, Exception):
                continue
            score = live_risk[f"{type}_risk"]["score"]
            results.append({
                "city": live_risk["city"],
                "lat": live_risk["lat"],
                "lng": live_risk["lng"],
                "risk": score,
                "color": risk_color(score),
                "data_source": live_risk["data_source"],
            })
    else:
        for city in CITIES:
            score = (await fetch_risk(city["city"]))["score"]
            results.append({
                "city": city["city"],
                "lat": city["lat"],
                "lng": city["lng"],
                "risk": score,
                "color": risk_color(score),
                "data_source": "baseline_estimate",
            })

    return results


@app.get("/api/v1/risk/{layer}")
async def climate_risk(layer: str, city: str):
    if layer not in RISK_BASE_SCORES:
        raise HTTPException(status_code=404, detail="Unknown climate-risk layer")

    return {
        "city": city,
        "layer_url": f"/tiles/{layer}/{city}/{{z}}/{{x}}/{{y}}.pbf",
        "summary_score": estimated_risk_score(city, layer),
        "data_source": "baseline_estimate",
    }

@app.get("/api/v1/carbon/intensity")
async def carbon_intensity(provider: str, region: str):
    provider = provider.lower()
    supported = get_supported_regions(provider)

    if region not in supported:
        return {
            "error": "Unsupported region",
            "provider": provider,
            "region": region,
            "supported_regions": supported
        }

    grid_zone = CLOUD_REGION_MAP.get(provider, {}).get(region)
    if not grid_zone:
        return {
            "provider": provider,
            "region": region,
            "intensity": None,
            "intensity_gco2_per_kwh": None,
            "status": "unsupported",
            "message": "Carbon intensity data not available for this region",
        }

    try:
        intensity = await get_carbon_intensity(grid_zone)
    except Exception:
        return {
            "provider": provider,
            "region": region,
            "intensity": None,
            "intensity_gco2_per_kwh": None,
            "status": "unavailable",
            "message": "Carbon intensity data not available for this region",
        }

    return {
        "region": region,
        "provider": provider,
        "intensity_gco2_per_kwh": intensity,
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.get("/api/v1/carbon/cleanest-region")
async def cleanest_region(provider: str = "aws"):
    provider = provider.lower()
    region_zones = CLOUD_REGION_MAP.get(provider)
    if not region_zones:
        raise HTTPException(status_code=404, detail=f"Unknown provider: {provider}")

    intensities = []
    for region_code, grid_zone in region_zones.items():
        try:
            intensity = await get_carbon_intensity(grid_zone)
            intensities.append((region_code, intensity))
        except Exception:
            continue

    if not intensities:
        return {
            "provider": provider,
            "intensity": None,
            "intensity_gco2_per_kwh": None,
            "status": "unavailable",
            "message": "Carbon intensity data not available for this provider",
        }

    intensities.sort(key=lambda x: x[1])

    cleanest_zone, cleanest_value = intensities[0]

    return {
        "region": cleanest_zone,
        "provider": provider,
        "intensity_gco2_per_kwh": cleanest_value,
        "ranked_regions": intensities
    }
