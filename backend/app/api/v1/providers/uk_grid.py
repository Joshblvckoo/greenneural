import httpx
from fastapi import HTTPException


async def get_uk_intensity() -> float:
    url = "https://api.carbonintensity.org.uk/intensity"
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=15)
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="UK carbon intensity request failed")
    try:
        return float(response.json()["data"][0]["intensity"]["actual"])
    except (ValueError, KeyError, IndexError, TypeError) as error:
        raise HTTPException(
            status_code=502,
            detail="UK carbon intensity response was invalid",
        ) from error


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
