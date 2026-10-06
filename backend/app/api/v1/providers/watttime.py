import asyncio
from datetime import datetime, timezone
import time

import httpx
from fastapi import HTTPException

from app.config.settings import settings


_TOKEN_CACHE_TTL_SECONDS = 25 * 60
_cached_token: str | None = None
_cached_token_expires_at = 0.0
_token_lock = asyncio.Lock()


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


async def watttime_signal(region: str) -> dict[str, str | float | None]:
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

    status = "delayed"
    if isinstance(updated_at, str):
        try:
            timestamp = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=timezone.utc)
            age_seconds = (datetime.now(timezone.utc) - timestamp).total_seconds()
            status = "live" if 0 <= age_seconds <= 1800 else "delayed"
        except ValueError:
            updated_at = None

    return {
        "value": value,
        "source": "WattTime",
        "updated_at": updated_at,
        "status": status,
    }


async def watttime_get_moer(region: str) -> float | None:
    """Fetch marginal emissions (MOER) from WattTime."""
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
