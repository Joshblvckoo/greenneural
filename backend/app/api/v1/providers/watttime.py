import os

import httpx
from fastapi import HTTPException


WATTTIME_USERNAME = os.getenv("WATTTIME_USERNAME")
WATTTIME_PASSWORD = os.getenv("WATTTIME_PASSWORD")


async def watttime_get_token() -> str:
    """Log in to WattTime and return a fresh token."""
    if not WATTTIME_USERNAME or not WATTTIME_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="WattTime credentials missing",
        )

    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.watttime.org/v2/login",
            auth=(WATTTIME_USERNAME, WATTTIME_PASSWORD),
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="WattTime login failed")

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

    return token


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
