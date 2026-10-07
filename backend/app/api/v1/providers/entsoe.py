import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException

from app.config.settings import settings
from app.utils.freshness import freshness_status


ENTSOE_ZONE_CODES = {
    "IE": "10YIE-1001A00010",
    "GB": "10YGB----------A",
    "DE_LU": "10Y1001A1001A63L",
    "SE3": "10Y1001A1001A46L",
    "IT_NORTH": "10Y1001A1001A73I",
    "PL": "10YPL-AREA-----S",
    "DK1": "10YDK-1--------W",
    "FR": "10YFR-RTE------C",
    "NL": "10YNL----------L",
    "CH": "10YCH-SWISSGRIDZ",
}

ENTSOE_ZONES = {
    "eu-north-1": "10YFI-1--------U",
    "eu-central-1": "10YDE-1--------W",
    "eu-west-1": "10YFR-RTE------C",
    "europe-west1": "10YBE----------2",
    "europe-north1": "10YFI-1--------U",
    "norwayeast": "10YNO-1--------2",
    "northeurope": "10Y1001A1001A59C",
    "westeurope": "10YNL----------L",
}

ENTSOE_FUEL_MAP = {
    "B01": "biomass",
    "B02": "fossil_brown_coal",
    "B03": "fossil_coal_gas",
    "B04": "fossil_gas",
    "B05": "fossil_hard_coal",
    "B06": "fossil_oil",
    "B07": "fossil_oil_shale",
    "B08": "fossil_peat",
    "B09": "geothermal",
    "B10": "hydro_pumped_storage",
    "B11": "hydro_run_of_river",
    "B12": "hydro_reservoir",
    "B13": "marine",
    "B14": "nuclear",
    "B15": "other",
    "B16": "solar",
    "B17": "waste",
    "B18": "wind_offshore",
    "B19": "wind_onshore",
    "B20": "other_renewable",
}

EMISSION_FACTORS = {
    "nuclear": 12,
    "wind_offshore": 8,
    "wind_onshore": 11,
    "solar": 45,
    "hydro_run_of_river": 24,
    "hydro_reservoir": 24,
    "hydro_pumped_storage": 24,
    "biomass": 230,
    "waste": 350,
    "geothermal": 38,
    "fossil_gas": 490,
    "fossil_hard_coal": 820,
    "fossil_brown_coal": 1050,
    "fossil_oil": 650,
}


def _element_text(element: ET.Element, name: str) -> str | None:
    for child in element.iter():
        if child.tag.rsplit("}", 1)[-1] == name:
            return child.text
    return None


def _period_points(xml_text: str) -> list[tuple[datetime, str, float]]:
    try:
        root = ET.fromstring(xml_text)
        result: list[tuple[datetime, str, float]] = []
        for time_series in root.iter():
            if time_series.tag.rsplit("}", 1)[-1] != "TimeSeries":
                continue
            fuel_code = _element_text(time_series, "psrType")
            if fuel_code not in ENTSOE_FUEL_MAP:
                continue

            for period in time_series.iter():
                if period.tag.rsplit("}", 1)[-1] != "Period":
                    continue
                start_text = _element_text(period, "start")
                resolution = _element_text(period, "resolution")
                if not start_text or not resolution or not resolution.startswith("PT"):
                    continue
                period_start = datetime.fromisoformat(
                    start_text.replace("Z", "+00:00")
                )
                interval_text = resolution[2:]
                hours = 0
                minutes = 0
                if "H" in interval_text:
                    hours_text, interval_text = interval_text.split("H", 1)
                    hours = int(hours_text)
                if "M" in interval_text:
                    minutes = int(interval_text.split("M", 1)[0])
                interval = timedelta(hours=hours, minutes=minutes)
                if interval.total_seconds() <= 0:
                    continue

                for point in period.iter():
                    if point.tag.rsplit("}", 1)[-1] != "Point":
                        continue
                    position = _element_text(point, "position")
                    quantity = _element_text(point, "quantity")
                    if not position or quantity is None:
                        continue
                    timestamp = period_start + interval * (int(position) - 1)
                    result.append((timestamp, fuel_code, float(quantity)))
        return result
    except (ET.ParseError, TypeError, ValueError, OverflowError) as error:
        raise HTTPException(
            status_code=502,
            detail="ENTSO-E returned invalid generation data",
        ) from error


def parse_entsoe_mix(xml_text: str) -> dict[str, float]:
    points = _period_points(xml_text)
    if not points:
        return {}
    latest_timestamp = max(timestamp for timestamp, _, _ in points)
    mix: dict[str, float] = {}
    for timestamp, fuel_code, value in points:
        if timestamp == latest_timestamp and value > 0:
            mix[fuel_code] = mix.get(fuel_code, 0.0) + value
    return mix


def normalize_mix(mix: dict[str, float]) -> dict[str, float]:
    normalized: dict[str, float] = {}
    for code, value in mix.items():
        fuel = ENTSOE_FUEL_MAP.get(code, code)
        normalized[fuel] = normalized.get(fuel, 0.0) + value
    return normalized


def _carbon_intensity(mix: dict[str, float]) -> float | None:
    total_generation = sum(value for value in mix.values() if value > 0)
    if total_generation <= 0:
        return None
    weighted_emissions = sum(
        max(value, 0) * EMISSION_FACTORS.get(fuel, 500)
        for fuel, value in mix.items()
    )
    return round(weighted_emissions / total_generation)


async def entsoe_live_signal(zone: str) -> dict[str, object]:
    xml_text = await entsoe_generation_mix(zone)
    points = _period_points(xml_text)
    if not points:
        raise HTTPException(
            status_code=502,
            detail="ENTSO-E returned no usable generation mix",
        )

    latest_timestamp = max(timestamp for timestamp, _, _ in points)
    raw_mix: dict[str, float] = {}
    for timestamp, fuel_code, value in points:
        if timestamp == latest_timestamp and value > 0:
            fuel = ENTSOE_FUEL_MAP[fuel_code]
            raw_mix[fuel] = raw_mix.get(fuel, 0.0) + value

    intensity = _carbon_intensity(raw_mix)
    total_generation = sum(raw_mix.values())
    if intensity is None or total_generation <= 0:
        raise HTTPException(
            status_code=502,
            detail="ENTSO-E returned no usable generation mix",
        )

    mix_percent = {
        fuel: round(value / total_generation * 100, 2)
        for fuel, value in raw_mix.items()
    }
    if latest_timestamp.tzinfo is None:
        latest_timestamp = latest_timestamp.replace(tzinfo=timezone.utc)
    status = freshness_status(latest_timestamp)
    return {
        "value": intensity,
        "source": "ENTSO-E",
        "updated_at": latest_timestamp.isoformat(),
        "status": status,
        "mix": mix_percent,
    }


def _intensity_series(xml_text: str) -> list[dict[str, str | float]]:
    by_timestamp: dict[datetime, dict[str, float]] = {}
    for timestamp, fuel_code, value in _period_points(xml_text):
        if value > 0:
            by_timestamp.setdefault(timestamp, {})
            by_timestamp[timestamp][fuel_code] = (
                by_timestamp[timestamp].get(fuel_code, 0.0) + value
            )

    series = []
    for timestamp, raw_mix in sorted(by_timestamp.items()):
        intensity = _carbon_intensity(normalize_mix(raw_mix))
        if intensity is not None:
            series.append({"timestamp": timestamp.isoformat(), "value": intensity})
    return series


async def _fetch_generation_xml(
    zone: str,
    document_type: str,
    period_start: datetime,
    period_end: datetime,
) -> str:
    token = settings.ENTSOE_SECURITY_TOKEN
    if not token:
        raise HTTPException(
            status_code=503,
            detail="ENTSO-E security token is not configured",
        )

    params = {
        "securityToken": token,
        "documentType": document_type,
        "in_Domain": zone,
        "periodStart": period_start.strftime("%Y%m%d%H%M"),
        "periodEnd": period_end.strftime("%Y%m%d%H%M"),
    }
    params["processType"] = "A16" if document_type == "A75" else "A01"

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                settings.ENTSOE_ENDPOINT_URL,
                params=params,
            )
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=502,
            detail="ENTSO-E request failed",
        ) from error

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"ENTSO-E request failed (HTTP {response.status_code})",
        )
    return response.text


async def entsoe_generation_mix(zone: str) -> str:
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    return await _fetch_generation_xml(
        zone,
        "A75",
        now - timedelta(hours=2),
        now + timedelta(hours=1),
    )


async def entsoe_intensity(zone: str) -> float | None:
    xml_text = await entsoe_generation_mix(zone)
    intensity = _carbon_intensity(normalize_mix(parse_entsoe_mix(xml_text)))
    if intensity is None:
        raise HTTPException(
            status_code=502,
            detail="ENTSO-E returned no usable generation mix",
        )
    return intensity


async def entsoe_forecast(zone: str) -> list[dict[str, str | float]]:
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    xml_text = await _fetch_generation_xml(
        zone,
        "A69",
        now,
        now + timedelta(hours=48),
    )
    return _intensity_series(xml_text)


async def get_entsoe_intensity(region: str) -> float | None:
    zone = ENTSOE_ZONES.get(region.lower())
    if not zone:
        raise HTTPException(
            status_code=400,
            detail=f"No ENTSO-E bidding zone is configured for region '{region}'",
        )
    return await entsoe_intensity(zone)
