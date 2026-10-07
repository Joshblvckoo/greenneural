import asyncio
import math
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import HTTPException

from backend.app.config.grid_resolver import resolve_entsoe, resolve_watttime
from backend.app.api.v1.providers.entsoe import (
    entsoe_forecast as fetch_entsoe_forecast,
    entsoe_intensity,
)
from backend.app.api.v1.providers.uk_grid import get_uk_intensity, uk_forecast
from backend.app.api.v1.providers.watttime import watttime_forecast, watttime_get_moer

UK_REGION_MAP = {
    "aws": {"eu-west-2"},
    "azure": {"uksouth", "ukwest"},
    "gcp": {"europe-west2"},
}

TARGETS = [
    ("aws", "us-east-1"),
    ("azure", "eastus"),
    ("gcp", "us-central1"),
    ("aws", "eu-north-1"),
    ("azure", "norwayeast"),
    ("gcp", "europe-west1"),
    ("aws", "eu-west-2"),
]


def compute_time_to_clean(
    current: float,
    series: list[dict[str, Any]],
) -> tuple[str | None, float | None]:
    for point in series:
        if point["value"] < current:
            return point["timestamp"], point["value"]
    return None, None


def _future_forecast_points(series: list[dict[str, Any]]) -> list[dict[str, Any]]:
    now = datetime.now(timezone.utc)
    future_points = []
    try:
        for point in series:
            timestamp = datetime.fromisoformat(
                point["timestamp"].replace("Z", "+00:00")
            )
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=timezone.utc)
            value = float(point["value"])
            if math.isfinite(value) and timestamp > now:
                future_points.append(
                    {"timestamp": timestamp.isoformat(), "value": value}
                )
    except (AttributeError, KeyError, TypeError, ValueError) as error:
        raise HTTPException(
            status_code=502,
            detail="A forecast provider returned an invalid forecast point.",
        ) from error
    return sorted(future_points, key=lambda point: point["timestamp"])


async def entsoe_forecast(provider: str, region: str) -> list[dict[str, Any]]:
    zone = resolve_entsoe(provider, region)
    if not zone:
        raise HTTPException(
            status_code=400,
            detail=(
                "No ENTSO-E bidding zone is configured for "
                f"{provider}/{region}"
            ),
        )
    return await fetch_entsoe_forecast(zone)


async def _forecast_target(provider: str, region: str) -> dict[str, Any]:
    try:
        if (ba := resolve_watttime(provider, region)) is not None:
            current, series = await asyncio.gather(
                watttime_get_moer(ba),
                watttime_forecast(ba),
            )
        elif region in UK_REGION_MAP.get(provider, set()):
            current, series = await asyncio.gather(
                get_uk_intensity(),
                uk_forecast(),
            )
        elif (zone := resolve_entsoe(provider, region)) is not None:
            current, series = await asyncio.gather(
                entsoe_intensity(zone),
                fetch_entsoe_forecast(zone),
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"No forecast provider is configured for {provider}/{region}.",
            )

        if current is None or not series:
            return {
                "provider": provider,
                "region": region,
                "status": "unavailable",
                "message": "Current intensity or forecast data is unavailable.",
            }

        future_series = _future_forecast_points(series)
        cleaner_at, cleaner_value = compute_time_to_clean(current, future_series)
        return {
            "provider": provider,
            "region": region,
            "status": "available",
            "current": current,
            "cleaner_at": cleaner_at,
            "cleaner_value": cleaner_value,
        }
    except HTTPException as error:
        return {
            "provider": provider,
            "region": region,
            "status": "unavailable",
            "message": error.detail,
        }
    except httpx.HTTPError:
        return {
            "provider": provider,
            "region": region,
            "status": "unavailable",
            "message": "Forecast provider is unavailable.",
        }


async def build_time_to_clean_forecast() -> list[dict[str, Any]]:
    return list(await asyncio.gather(*(_forecast_target(*target) for target in TARGETS)))
