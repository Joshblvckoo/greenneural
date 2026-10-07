import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

from app.api.v1.providers.live_home import compute_live_home
from app.config.grid_resolver import resolve_entsoe, resolve_watttime

logger = logging.getLogger(__name__)
REFRESH_INTERVAL_SECONDS = 300

_state: dict[str, Any] = {
    "interval_seconds": REFRESH_INTERVAL_SECONDS,
    "last_attempt_at": None,
    "last_success_at": None,
    "last_error": None,
    "running": False,
}


def scheduler_status() -> dict[str, Any]:
    return dict(_state)


async def refresh_live_signals() -> None:
    _state["running"] = True
    _state["last_attempt_at"] = datetime.now(timezone.utc).isoformat()
    try:
        await compute_live_home(force_refresh=True)
    except Exception as error:
        _state["last_error"] = type(error).__name__
        logger.exception("Scheduled live signal refresh failed")
    else:
        _state["last_success_at"] = datetime.now(timezone.utc).isoformat()
        _state["last_error"] = None
    finally:
        _state["running"] = False


async def live_signal_refresh_loop() -> None:
    while True:
        await refresh_live_signals()
        await asyncio.sleep(REFRESH_INTERVAL_SECONDS)


async def resolve_signal(provider: str, region: str, sources: dict) -> dict:
    # 1. WattTime (US)
    ba = resolve_watttime(provider, region)
    if ba:
        moer = await sources["wattime"].get_moer(ba)
        if moer is not None:
            return {"intensity_index": moer, "source": "WattTime", "status": "live"}

    # 2. ENTSO-E (EU)
    zone = resolve_entsoe(provider, region)
    if zone:
        ci = await sources["entsoe"].get_intensity(zone)
        if ci is not None:
            return {"intensity": ci, "source": "ENTSO-E", "status": "live"}

    # 3. UK CI (GB proxies)
    if region in ("eu-west-2", "uksouth", "ukwest", "europe-west2"):
        uk_ci = await sources["uk"].get_intensity()
        if uk_ci is not None:
            return {"intensity": uk_ci, "source": "UK Carbon Intensity API", "status": "live"}

    # 4. Unsupported
    return {"intensity": None, "source": None, "status": "unsupported"}
