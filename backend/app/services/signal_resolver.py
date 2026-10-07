import logging
from collections.abc import Awaitable, Callable
from typing import Any

import httpx
from fastapi import HTTPException

from backend.app.config.grid_resolver import (
    resolve_electricitymaps,
    resolve_entsoe,
    resolve_watttime,
)

logger = logging.getLogger(__name__)


async def _read_source(
    source_name: str,
    fetch: Callable[[], Awaitable[Any]],
) -> Any:
    try:
        return await fetch()
    except (HTTPException, httpx.HTTPError) as error:
        logger.warning("%s signal lookup failed: %s", source_name, type(error).__name__)
        return None


async def resolve_signal(provider: str, region: str, sources: dict) -> dict:
    # 1. Electricity Maps
    em_zone = resolve_electricitymaps(provider, region)
    if em_zone and sources.get("electricitymaps"):
        signal = await _read_source(
            "Electricity Maps",
            lambda: sources["electricitymaps"].get_signal_by_zone(em_zone),
        )
        if signal is not None:
            return {
                "intensity": signal["value"],
                "source": "Electricity Maps",
                "updated_at": signal.get("updated_at"),
                "status": signal.get("status", "live"),
            }

    # 2. ENTSO-E (EU)
    zone = resolve_entsoe(provider, region)
    if zone and sources.get("entsoe"):
        ci = await _read_source(
            "ENTSO-E",
            lambda: sources["entsoe"].get_intensity(zone),
        )
        if ci is not None:
            return {"intensity": ci, "source": "ENTSO-E", "status": "live"}

    # 3. WattTime (US)
    ba = resolve_watttime(provider, region)
    if ba and sources.get("wattime"):
        moer = await _read_source(
            "WattTime",
            lambda: sources["wattime"].get_moer(ba),
        )
        if moer is not None:
            return {"intensity_index": moer, "source": "WattTime", "status": "live"}

    # 4. UK CI (GB proxies)
    if (
        region.lower() in ("eu-west-2", "uksouth", "ukwest", "europe-west2")
        and sources.get("uk")
    ):
        uk_ci = await _read_source(
            "UK Carbon Intensity API",
            sources["uk"].get_intensity,
        )
        if uk_ci is not None:
            return {"intensity": uk_ci, "source": "UK Carbon Intensity API", "status": "live"}

    # 5. Unsupported
    return {"intensity": None, "source": None, "status": "unsupported"}
