from datetime import datetime, timezone

import httpx
from fastapi import HTTPException


def _uk_status(updated_at: str | None) -> str:
    if updated_at is None:
        return "delayed"
    try:
        timestamp = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
    except ValueError:
        return "delayed"
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    age_seconds = (datetime.now(timezone.utc) - timestamp).total_seconds()
    return "live" if 0 <= age_seconds <= 1800 else "delayed"


async def uk_signal() -> dict[str, str | float]:
    url = "https://api.carbonintensity.org.uk/intensity"
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(url)
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="UK carbon intensity request failed")
    try:
        interval = response.json()["data"][0]
        intensity = interval["intensity"]
        actual = intensity.get("actual")
        value = float(actual if actual is not None else intensity["forecast"])
        updated_at = interval.get("from") or interval.get("to")
    except (ValueError, KeyError, IndexError, TypeError) as error:
        raise HTTPException(
            status_code=502,
            detail="UK carbon intensity response was invalid",
        ) from error
    status = _uk_status(updated_at)
    if actual is None:
        status = "forecast"
    return {
        "value": value,
        "source": "UK Carbon Intensity API",
        "updated_at": updated_at,
        "status": status,
    }


async def get_uk_intensity() -> float:
    signal = await uk_signal()
    if signal["status"] == "forecast":
        raise HTTPException(
            status_code=502,
            detail="UK carbon intensity has no actual reading",
        )
    return float(signal["value"])


async def uk_generation_mix() -> dict[str, str | dict[str, float]]:
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get("https://api.carbonintensity.org.uk/generation")
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="UK generation mix request failed")
    try:
        interval = response.json()["data"][0]
        mix = {
            str(item["fuel"]): float(item["perc"])
            for item in interval["generationmix"]
        }
        updated_at = interval.get("from") or interval.get("to")
    except (ValueError, KeyError, IndexError, TypeError) as error:
        raise HTTPException(
            status_code=502,
            detail="UK generation mix response was invalid",
        ) from error
    return {
        "region": "uk",
        "mix": mix,
        "source": "UK Carbon Intensity API",
        "updated_at": updated_at or "",
        "status": _uk_status(updated_at),
    }


async def uk_forecast() -> list[dict[str, str | float]]:
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(
            "https://api.carbonintensity.org.uk/intensity/fw24h"
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="UK carbon forecast request failed")

    try:
        intervals = response.json()["data"]
        forecast = [
            {
                "timestamp": interval["from"],
                "value": float(interval["intensity"]["forecast"]),
            }
            for interval in intervals
        ]
    except (ValueError, KeyError, IndexError, TypeError) as error:
        raise HTTPException(
            status_code=502,
            detail="UK carbon forecast response was invalid",
        ) from error

    return sorted(forecast, key=lambda point: point["timestamp"])
