import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

from app.api.v1.providers.live_home import compute_live_home
from app.services.signal_resolver import resolve_signal as resolve_grid_signal

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
    return await resolve_grid_signal(provider, region, sources)
