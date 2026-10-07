import asyncio

import time

import httpx
from fastapi import HTTPException

from app.config.settings import settings
from app.utils.freshness import freshness_status


_TOKEN_CACHE_TTL_SECONDS = 25 * 60
_ACCESS_CACHE_TTL_SECONDS = 5 * 60
_cached_token: str | None = None
_cached_token_expires_at = 0.0
_token_lock = asyncio.Lock()
_cached_access_regions: frozenset[str] | None = None
_cached_access_expires_at = 0.0
_access_lock = asyncio.Lock()


async def watttime_get_token() -> str:
    """Return a cached WattTime token, refreshing it before expiration."""
    global _cached_token, _cached_token_expires_at
    username = settings.WATTTIME_USERNAME
    password = settings.WATTTIME_PASSWORD
    if not username or not password:
        raise HTTPException(
            status_code=500,
            detail="WattTime credentials missing",
        )

    if _cached_token and time.monotonic() < _cached_token_expires_at:
        return _cached_token

    async with _token_lock:
        if _cached_token and time.monotonic() < _cached_token_expires_at:
            return _cached_token

        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                "https://api.watttime.org/v2/login",
                auth=(username, password),
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"WattTime login failed (HTTP {response.status_code})",
            )

        try:
            token = response.json()["token"]
        except (ValueError, KeyError, TypeError) as error:
            raise HTTPException(
                status_code=502,
                detail="WattTime login returned an unexpected response",
            ) from error

        if not isinstance(token, str) or not token:
            raise HTTPException(
                status_code=502,
                detail="WattTime login returned an unexpected response",
            )

        _cached_token = token
        _cached_token_expires_at = time.monotonic() + _TOKEN_CACHE_TTL_SECONDS

    return token


def _parse_access_regions(data: object) -> frozenset[str]:
    if not isinstance(data, dict):
        raise HTTPException(
            status_code=502,
            detail="WattTime access response had an invalid shape",
        )

    signal_types = data.get("signal_types")
    if not isinstance(signal_types, list):
        raise HTTPException(
            status_code=502,
            detail="WattTime access response had an invalid shape",
        )

    names: set[str] = set()
    for signal_type in signal_types:
        if not isinstance(signal_type, dict):
            raise HTTPException(
                status_code=502,
                detail="WattTime access response had an invalid signal type",
            )
        if signal_type.get("signal_type") != "co2_moer":
            continue
        regions = signal_type.get("regions")
        if not isinstance(regions, list):
            raise HTTPException(
                status_code=502,
                detail="WattTime access response had an invalid region list",
            )
        for region in regions:
            if not isinstance(region, dict) or not isinstance(
                region.get("region"), str
            ):
                raise HTTPException(
                    status_code=502,
                    detail="WattTime access response had an invalid region",
                )
            names.add(region["region"])

    return frozenset(names)


async def watttime_get_access_regions() -> frozenset[str]:
    """Return the cached set of regions enabled for the current WattTime account."""
    global _cached_access_regions, _cached_access_expires_at
    if (
        _cached_access_regions is not None
        and time.monotonic() < _cached_access_expires_at
    ):
        return _cached_access_regions

    async with _access_lock:
        if (
            _cached_access_regions is not None
            and time.monotonic() < _cached_access_expires_at
        ):
            return _cached_access_regions

        token = await watttime_get_token()
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                "https://api.watttime.org/v3/my-access",
                headers={"Authorization": f"Bearer {token}"},
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=(
                    "WattTime access lookup failed "
                    f"(HTTP {response.status_code})"
                ),
            )
        try:
            regions = _parse_access_regions(response.json())
        except ValueError as error:
            raise HTTPException(
                status_code=502,
                detail="WattTime access response was not valid JSON",
            ) from error

        _cached_access_regions = regions
        _cached_access_expires_at = (
            time.monotonic() + _ACCESS_CACHE_TTL_SECONDS
        )
        return regions


async def _ensure_watttime_region_access(region: str) -> None:
    allowed_regions = await watttime_get_access_regions()
    if region not in allowed_regions:
        raise HTTPException(
            status_code=403,
            detail="WattTime account does not have access to this region",
        )


async def watttime_signal(region: str) -> dict[str, str | float | None]:
    await _ensure_watttime_region_access(region)
    token = await watttime_get_token()
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(
            "https://api.watttime.org/v3/signal-index",
            headers={"Authorization": f"Bearer {token}"},
            params={"region": region, "signal_type": "co2_moer"},
        )
    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"WattTime MOER fetch failed (HTTP {response.status_code})",
        )

    try:
        readings = response.json()["data"]
        if not isinstance(readings, list) or not readings:
            raise ValueError("WattTime returned no signal readings")
        reading = readings[0]
        value = float(reading["value"])
        updated_at = reading.get("timestamp") or reading.get("point_time")
    except (ValueError, KeyError, TypeError) as error:
        raise HTTPException(
            status_code=502,
            detail="WattTime MOER response contained an invalid reading",
        ) from error

    status = freshness_status(updated_at)
    if status == "unavailable":
        updated_at = None
        status = "delayed"

    return {
        "value": value,
        "source": "WattTime",
        "updated_at": updated_at,
        "status": status,
    }


async def watttime_get_moer(region: str) -> float | None:
    """Fetch marginal emissions (MOER) from WattTime."""
    await _ensure_watttime_region_access(region)
    token = await watttime_get_token()
    headers = {"Authorization": f"Bearer {token}"}

    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.watttime.org/v3/signal-index",
            headers=headers,
            params={"region": region, "signal_type": "co2_moer"},
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="WattTime MOER fetch failed")

    try:
        data = response.json()
    except ValueError as error:
        raise HTTPException(
            status_code=502,
            detail="WattTime MOER response was not valid JSON",
        ) from error

    if not isinstance(data, dict):
        raise HTTPException(
            status_code=502,
            detail="WattTime MOER response had an invalid shape",
        )

    readings = data.get("data")
    if not isinstance(readings, list) or not readings:
        return None

    try:
        return float(readings[0]["value"])
    except (KeyError, TypeError, ValueError) as error:
        raise HTTPException(
            status_code=502,
            detail="WattTime MOER response contained an invalid reading",
        ) from error


async def watttime_forecast(region: str) -> list[dict[str, str | float]]:
    await _ensure_watttime_region_access(region)
    token = await watttime_get_token()

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(
            "https://api.watttime.org/v3/signal-index",
            headers={"Authorization": f"Bearer {token}"},
            params={
                "region": region,
                "signal_type": "co2_moer",
                "forecast": "true",
            },
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="WattTime forecast request failed")

    try:
        readings = response.json()["data"]
        if not isinstance(readings, list):
            raise TypeError("Forecast data must be a list")
        forecast = [
            {
                "timestamp": reading["timestamp"]
                if "timestamp" in reading
                else reading["point_time"],
                "value": float(reading["value"]),
            }
            for reading in readings
        ]
    except (ValueError, KeyError, TypeError) as error:
        raise HTTPException(
            status_code=502,
            detail="WattTime returned an invalid forecast response",
        ) from error

    return sorted(forecast, key=lambda point: point["timestamp"])


async def get_watttime_intensity(region: str) -> float:
    token = await watttime_get_token()

    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.watttime.org/v2/index",
            params={"ba": "NYIS"},
            headers={"Authorization": f"Bearer {token}"},
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail="WattTime intensity request failed",
        )

    try:
        return float(response.json()["marginal"])
    except (ValueError, KeyError, TypeError) as error:
        raise HTTPException(
            status_code=502,
            detail="WattTime returned an unexpected intensity response",
        ) from error
