import math
import time
from typing import Any

import httpx
from fastapi import HTTPException

from backend.app.config.settings import settings


class ElectricityMapsClient:
    async def get_signal_by_zone(self, zone: str) -> dict[str, Any] | None:
        token = settings.ELECTRICITYMAPS_API_TOKEN
        if not token:
            raise HTTPException(
                status_code=503,
                detail="Electricity Maps API token is not configured",
            )

        base_url = settings.ELECTRICITYMAPS_BASE_URL.rstrip("/")
        started = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    f"{base_url}/carbon-intensity/latest",
                    headers={"auth-token": token},
                    params={"zone": zone},
                )
        except httpx.HTTPError as error:
            raise HTTPException(
                status_code=502,
                detail="Electricity Maps request failed",
            ) from error

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=(
                    "Electricity Maps request failed "
                    f"(HTTP {response.status_code})"
                ),
            )

        try:
            data = response.json()
        except ValueError as error:
            raise HTTPException(
                status_code=502,
                detail="Electricity Maps returned invalid JSON",
            ) from error
        if not isinstance(data, dict):
            raise HTTPException(
                status_code=502,
                detail="Electricity Maps returned an invalid response",
            )

        try:
            intensity = float(data["carbonIntensity"])
        except (KeyError, TypeError, ValueError) as error:
            raise HTTPException(
                status_code=502,
                detail="Electricity Maps returned an invalid carbon intensity",
            ) from error
        if not math.isfinite(intensity) or intensity < 0:
            raise HTTPException(
                status_code=502,
                detail="Electricity Maps returned an invalid carbon intensity",
            )

        updated_at = data.get("datetime")
        if not isinstance(updated_at, str):
            updated_at = None
        return {
            "value": intensity,
            "source": "Electricity Maps",
            "updated_at": updated_at,
            "status": "live",
            "latency_ms": round((time.perf_counter() - started) * 1000, 2),
        }

    async def get_intensity_by_zone(self, zone: str) -> float | None:
        signal = await self.get_signal_by_zone(zone)
        return float(signal["value"]) if signal is not None else None
