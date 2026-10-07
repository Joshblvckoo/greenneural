import asyncio
import math
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Awaitable, Callable

import httpx
from fastapi import HTTPException

from app.config.grid_resolver import (
    resolve_electricitymaps,
    resolve_entsoe,
    resolve_watttime,
)
from app.config.regions import REGION_MAP
from app.config.settings import settings
from app.api.v1.providers.entsoe import ENTSOE_ZONE_CODES, entsoe_live_signal
from app.services.electricitymaps_client import ElectricityMapsClient
from app.api.v1.providers.uk_grid import uk_generation_mix, uk_signal
from app.api.v1.providers.watttime import watttime_signal
from app.utils.freshness import freshness_status

REGIONS = REGION_MAP

_CACHE_TTL_SECONDS = 300
_TREND_WINDOW = timedelta(minutes=10)
_TREND_MAX_AGE = timedelta(minutes=20)
_cache: dict[str, Any] | None = None
_cache_expires_at = 0.0
_cache_lock = asyncio.Lock()
_history: dict[str, list[tuple[datetime, float]]] = {}
_electricitymaps_client = ElectricityMapsClient()


def _parse_timestamp(value: object) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        timestamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    return timestamp.astimezone(timezone.utc)


def _record_and_compare(key: str, value: float, now: datetime) -> float | None:
    readings = _history.setdefault(key, [])
    readings.append((now, value))
    cutoff = now - _TREND_MAX_AGE
    readings[:] = [
        (timestamp, reading)
        for timestamp, reading in readings
        if timestamp >= cutoff
    ]
    target_time = now - _TREND_WINDOW
    prior = [
        (timestamp, reading)
        for timestamp, reading in readings[:-1]
        if now - _TREND_MAX_AGE <= timestamp <= now - timedelta(minutes=8)
    ]
    if not prior:
        return None
    _, prior_value = min(prior, key=lambda reading: abs(reading[0] - target_time))
    return round(value - prior_value, 2)


def _trend(delta: float | None) -> str:
    if delta is None:
        return "unknown"
    if delta < -0.5:
        return "down"
    if delta > 0.5:
        return "up"
    return "steady"


def compute_status(
    updated_at: object,
    *,
    fallback: bool = False,
    forecast: bool = False,
    now: datetime | None = None,
) -> str:
    if fallback:
        return "fallback"
    if forecast:
        return "forecast"
    return freshness_status(updated_at, now=now)


def _combined_status(signals: list[dict[str, Any]]) -> str:
    statuses = {signal["status"] for signal in signals}
    for status in ("stale", "limited", "delayed", "forecast", "live"):
        if status in statuses:
            return status
    return "unavailable"


def global_cleanest_region(
    all_regions: list[dict[str, Any]],
) -> dict[str, Any] | None:
    usable = [
        region
        for region in all_regions
        if region.get("intensity") is not None
        and region.get("status") in {"live", "delayed", "limited"}
    ]
    if not usable:
        return None

    cleanest = min(usable, key=lambda region: float(region["intensity"]))
    return {
        "provider": cleanest["provider"],
        "region": cleanest["region"],
        "intensity": cleanest["intensity"],
    }


def build_provider_health(
    provider: str,
    region_signals: list[dict[str, Any]],
) -> dict[str, Any]:
    checked_signals = [
        signal for signal in region_signals
        if signal.get("provider") == provider
    ]
    available = [
        signal
        for signal in checked_signals
        if signal.get("intensity") is not None
        and signal.get("status") in {"live", "delayed", "limited", "stale", "forecast"}
    ]
    checked = len(checked_signals)
    if not available:
        return {
            "average_intensity": None,
            "trend": "unknown",
            "delta_10m": None,
            "cleanest_region": None,
            "updated_at": None,
            "status": "unavailable",
            "sources": [],
            "latency_ms": None,
            "regions_available": 0,
            "regions_checked": checked,
        }

    average = round(
        sum(float(signal["intensity"]) for signal in available) / len(available)
    )
    deltas = [
        float(signal["delta_10m"])
        for signal in available
        if signal.get("delta_10m") is not None
    ]
    delta_10m = round(sum(deltas) / len(deltas), 2) if deltas else None
    best = min(available, key=lambda signal: float(signal["intensity"]))
    updated_times = [
        timestamp
        for signal in available
        if (timestamp := _parse_timestamp(signal.get("updated_at"))) is not None
    ]
    latencies = [
        float(signal["latency_ms"])
        for signal in available
        if signal.get("latency_ms") is not None
    ]

    return {
        "average_intensity": average,
        "trend": _trend(delta_10m),
        "delta_10m": delta_10m,
        "cleanest_region": {
            "region": best["region"],
            "intensity": best["intensity"],
            "source": best.get("source"),
            "updated_at": best.get("updated_at"),
            "status": best["status"],
            "latency_ms": best.get("latency_ms"),
        },
        "updated_at": min(updated_times).isoformat() if updated_times else None,
        "status": _combined_status(available),
        "sources": sorted({
            signal["source"]
            for signal in available
            if signal.get("source")
        }),
        "latency_ms": (
            round(sum(latencies) / len(latencies), 2) if latencies else None
        ),
        "regions_available": len(available),
        "regions_checked": checked,
    }


def _unique_grid_signals(
    region_signals: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    observed = [
        signal
        for signal in region_signals
        if signal.get("intensity") is not None
        and signal.get("status") in {"live", "delayed", "limited", "stale", "forecast"}
    ]
    unique_grids: dict[str, dict[str, Any]] = {}
    for signal in observed:
        grid_key = signal.get(
            "_grid_key",
            f'{signal["provider"]}/{signal["region"]}',
        )
        if grid_key == "uk-grid:GB":
            grid_key = f'entsoe:{ENTSOE_ZONE_CODES["GB"]}'
        existing = unique_grids.get(grid_key)
        current_timestamp = _parse_timestamp(signal.get("updated_at"))
        existing_timestamp = (
            _parse_timestamp(existing.get("updated_at")) if existing else None
        )
        if existing is None or (
            current_timestamp is not None
            and (existing_timestamp is None or current_timestamp > existing_timestamp)
        ):
            unique_grids[grid_key] = signal
    return list(unique_grids.values())


def build_global_signal(region_signals: list[dict[str, Any]]) -> dict[str, Any]:
    global_observed = _unique_grid_signals(region_signals)
    expected_grids = {
        (
            f'entsoe:{ENTSOE_ZONE_CODES["GB"]}'
            if grid_key == "uk-grid:GB"
            else grid_key
        )
        for signal in region_signals
        for grid_key in signal.get(
            "_grid_keys_expected",
            [signal["_grid_key"]] if signal.get("_grid_key") else [],
        )
    }
    if global_observed:
        intensity = round(
            sum(float(signal["intensity"]) for signal in global_observed)
            / len(global_observed),
            2,
        )
        deltas = [
            float(signal["delta_10m"])
            for signal in global_observed
            if signal.get("delta_10m") is not None
        ]
        delta_10m = round(sum(deltas) / len(deltas), 2) if deltas else None
        sources = sorted({
            signal["source"]
            for signal in global_observed
            if signal.get("source")
        })
        latencies = [
            float(signal["latency_ms"])
            for signal in global_observed
            if signal.get("latency_ms") is not None
        ]
        timestamps = [
            timestamp
            for signal in global_observed
            if (timestamp := _parse_timestamp(signal.get("updated_at"))) is not None
        ]
        status = _combined_status(global_observed)
        updated_at = min(timestamps).isoformat() if timestamps else None
    else:
        intensity = None
        delta_10m = None
        sources = []
        latencies = []
        status = "unavailable"
        updated_at = None

    regions_included = len(global_observed)
    regions_expected = len(expected_grids)
    partial = regions_included < regions_expected
    return {
        "intensity": intensity,
        "delta_10m": delta_10m,
        "trend": _trend(delta_10m),
        "sources": sources,
        "latency_ms": max(latencies) if latencies else None,
        "updated_at": updated_at,
        "status": status,
        "regions_included": regions_included,
        "regions_expected": regions_expected,
        "partial": partial,
        "methodology": (
            "No live grid readings are currently available."
            if status == "unavailable"
            else (
                f"Partial snapshot: {regions_included} of "
                f"{regions_expected} mapped grid signals are available. "
                "Each unique grid signal is weighted equally; provider "
                "methodologies vary."
                if partial
                else "Mean of unique mapped grid signals with equal weight; "
                "provider methodologies vary."
            )
        ),
    }


async def _get_region_signal(
    provider: str,
    region: str,
    *,
    source_tasks: dict[
        tuple[str, str],
        asyncio.Task[dict[str, Any] | None],
    ] | None = None,
    source_semaphore: asyncio.Semaphore | None = None,
) -> dict[str, Any]:
    request_started = time.perf_counter()
    provider_key = provider.lower()
    region_key = region.lower()
    candidates: list[
        tuple[str, str, Callable[[], Awaitable[dict[str, Any] | None]]]
    ] = []

    if (em_zone := resolve_electricitymaps(provider_key, region_key)) is not None:
        candidates.append(
            (
                "Electricity Maps",
                f"electricitymaps:{em_zone}",
                lambda: _electricitymaps_client.get_signal_by_zone(em_zone),
            )
        )
    if (ba := resolve_watttime(provider_key, region_key)) is not None:
        candidates.append(
            ("WattTime", f"watttime:{ba}", lambda: watttime_signal(ba))
        )
    if (zone_code := resolve_entsoe(provider_key, region_key)) is not None:
        zone = ENTSOE_ZONE_CODES[zone_code]
        candidates.append(
            ("ENTSO-E", f"entsoe:{zone}", lambda: entsoe_live_signal(zone))
        )
    if region_key in {"eu-west-2", "uksouth", "ukwest", "europe-west2"}:
        candidates.append(
            ("UK Carbon Intensity API", "uk-grid:GB", uk_signal)
        )

    if not candidates:
        return {
            "provider": provider,
            "region": region,
            "intensity": None,
            "source": None,
            "_source_name": None,
            "updated_at": None,
            "status": "unavailable",
            "latency_ms": None,
            "error": "No live grid source is configured for this region.",
        }

    expected_grid_keys = [candidate[1] for candidate in candidates]
    attempts: list[str] = []
    source_errors: dict[str, str] = {}
    source_latencies: dict[str, float] = {}
    for source_name, grid_key, fetch_signal in candidates:
        attempts.append(source_name)
        attempt_started = time.perf_counter()
        try:
            if source_tasks is None or source_semaphore is None:
                signal = await fetch_signal()
            else:
                task_key = (source_name, grid_key)
                task = source_tasks.get(task_key)
                if task is None:
                    async def fetch_limited(
                        fetcher: Callable[
                            [], Awaitable[dict[str, Any] | None]
                        ] = fetch_signal,
                    ) -> dict[str, Any] | None:
                        async with source_semaphore:
                            return await fetcher()

                    task = asyncio.create_task(fetch_limited())
                    source_tasks[task_key] = task
                signal = await task
        except HTTPException as error:
            source_errors[source_name] = str(error.detail)
            signal = None
        except httpx.HTTPError as error:
            source_errors[source_name] = type(error).__name__
            signal = None
        finally:
            source_latencies[source_name] = round(
                (time.perf_counter() - attempt_started) * 1000, 2
            )

        if signal is None:
            source_errors.setdefault(
                source_name,
                f"{source_name} returned no intensity reading.",
            )
            continue

        try:
            intensity = float(signal["value"])
        except (KeyError, TypeError, ValueError):
            source_errors[source_name] = (
                f"{source_name} returned an invalid intensity reading."
            )
            continue
        if not math.isfinite(intensity):
            source_errors[source_name] = (
                f"{source_name} returned an invalid intensity reading."
            )
            continue

        updated_at = signal.get("updated_at")
        return {
            "provider": provider,
            "region": region,
            "intensity": intensity,
            "source": signal.get("source", source_name),
            "updated_at": updated_at,
            "status": compute_status(
                updated_at,
                forecast=signal.get("status") == "forecast",
            ),
            "latency_ms": round(
                (time.perf_counter() - request_started) * 1000, 2
            ),
            "_grid_key": grid_key,
            "_source_name": source_name,
            "_sources_attempted": attempts,
            "_source_errors": source_errors,
            "_source_latencies": source_latencies,
            "_grid_keys_expected": expected_grid_keys,
            **({"mix": signal["mix"]} if "mix" in signal else {}),
        }

    return {
        "provider": provider,
        "region": region,
        "intensity": None,
        "source": None,
        "updated_at": None,
        "status": "unavailable",
        "latency_ms": round((time.perf_counter() - request_started) * 1000, 2),
        "_sources_attempted": attempts,
        "_source_errors": source_errors,
        "_source_latencies": source_latencies,
        "_grid_keys_expected": expected_grid_keys,
        "error": "; ".join(
            f"{source}: {message}" for source, message in source_errors.items()
        ),
    }


async def _get_generation_mix(regions: list[dict[str, Any]]) -> dict[str, Any]:
    request_started = time.perf_counter()
    try:
        mix = await uk_generation_mix()
        if mix["mix"]:
            return {
                **mix,
                "status": compute_status(
                    mix.get("updated_at"),
                    forecast=mix.get("status") == "forecast",
                ),
                "latency_ms": round(
                    (time.perf_counter() - request_started) * 1000, 2
                ),
            }
    except (HTTPException, httpx.HTTPError):
        pass

    for signal in regions:
        if signal.get("mix"):
            return {
                "region": signal["region"],
                "mix": signal["mix"],
                "source": signal["source"],
                "updated_at": signal["updated_at"],
                "status": signal["status"],
                "latency_ms": signal.get("latency_ms"),
            }
    return {
        "region": None,
        "mix": {},
        "source": None,
        "updated_at": None,
        "status": "unavailable",
        "latency_ms": round((time.perf_counter() - request_started) * 1000, 2),
    }


async def _build_live_home() -> dict[str, Any]:
    targets = [
        (provider, region)
        for provider, regions in REGIONS.items()
        for region in regions
    ]
    source_tasks: dict[
        tuple[str, str],
        asyncio.Task[dict[str, Any] | None],
    ] = {}
    source_semaphore = asyncio.Semaphore(8)
    signals = await asyncio.gather(
        *(
            _get_region_signal(
                provider,
                region,
                source_tasks=source_tasks,
                source_semaphore=source_semaphore,
            )
            for provider, region in targets
        )
    )
    generation_mix = await _get_generation_mix(signals)
    now = datetime.now(timezone.utc)
    source_health: dict[str, dict[str, Any]] = {}
    source_config = {
        "WattTime": [
            name for name, value in (
                ("WATTTIME_USERNAME", settings.WATTTIME_USERNAME),
                ("WATTTIME_PASSWORD", settings.WATTTIME_PASSWORD),
            )
            if not value
        ],
        "Electricity Maps": [
            name for name, value in (
                ("ELECTRICITYMAPS_API_TOKEN", settings.ELECTRICITYMAPS_API_TOKEN),
            )
            if not value
        ],
        "ENTSO-E": [
            name for name, value in (
                ("ENTSOE_SECURITY_TOKEN", settings.ENTSOE_SECURITY_TOKEN),
            )
            if not value
        ],
        "UK Carbon Intensity API": [],
    }
    for source_name, missing_variables in source_config.items():
        source_signals = [
            signal for signal in signals
            if signal.get("_source_name") == source_name
        ]
        attempted_signals = [
            signal for signal in signals
            if source_name in signal.get(
                "_sources_attempted",
                [signal.get("_source_name")],
            )
        ]
        source_readings = [
            signal for signal in source_signals
            if signal["intensity"] is not None
            and signal["status"] in {"live", "delayed", "limited", "stale", "forecast"}
        ]
        timestamps = [
            timestamp for signal in source_readings
            if (timestamp := _parse_timestamp(signal["updated_at"])) is not None
        ]
        errors = sorted({
            signal["error"] for signal in source_signals
            if signal.get("error")
        } | {
            error
            for signal in signals
            if (error := signal.get("_source_errors", {}).get(source_name))
        })
        source_latencies = [
            latency
            for signal in attempted_signals
            if (
                latency := signal.get("_source_latencies", {}).get(source_name)
            ) is not None
        ]
        if not source_latencies:
            source_latencies = [
                signal["latency_ms"] for signal in source_signals
                if signal.get("latency_ms") is not None
            ]
        latest_timestamp = max(timestamps) if timestamps else None
        source_health[source_name] = {
            "status": (
                compute_status(latest_timestamp.isoformat())
                if latest_timestamp
                else "unavailable"
            ),
            "configured": not missing_variables,
            "missing_configuration": missing_variables,
            "regions_available": len(source_readings),
            "regions_checked": len(attempted_signals or source_signals),
            "updated_at": latest_timestamp.isoformat() if latest_timestamp else None,
            "latency_ms": (
                round(sum(source_latencies) / len(source_latencies), 2)
                if source_latencies
                else None
            ),
            "errors": errors,
        }

    unconfigured_regions = [
        signal for signal in signals
        if not signal.get("_source_name")
        and not signal.get("_sources_attempted")
    ]
    if unconfigured_regions:
        source_health["Unconfigured regions"] = {
            "status": "unavailable",
            "configured": False,
            "missing_configuration": [],
            "regions_available": 0,
            "regions_checked": len(unconfigured_regions),
            "updated_at": None,
            "latency_ms": None,
            "errors": ["No live grid source is configured for these regions."],
        }

    observed = [
        signal for signal in signals
        if signal["status"] in {"live", "delayed", "limited", "stale", "forecast"}
        and signal["intensity"] is not None
    ]
    for signal in observed:
        delta = _record_and_compare(
            f'{signal["provider"]}/{signal["region"]}',
            signal["intensity"],
            now,
        )
        signal["delta_10m"] = delta
        signal["trend"] = _trend(delta)

    global_signal = build_global_signal(signals)
    global_observed = _unique_grid_signals(signals)
    cleanest_global = global_cleanest_region(signals)

    cleanest_regions = sorted(
        (
            signal
            for signal in global_observed
            if signal["status"] in {"live", "delayed", "limited"}
        ),
        key=lambda signal: signal["intensity"],
    )[:10]
    cleanest_regions = [
        {key: value for key, value in signal.items() if not key.startswith("_")}
        for signal in cleanest_regions
    ]

    provider_health: dict[str, Any] = {}
    for provider in REGIONS:
        provider_signals = [
            signal for signal in signals
            if signal["provider"] == provider
        ]
        provider_health[provider] = build_provider_health(
            provider,
            provider_signals,
        )

    return {
        "global_signal": global_signal,
        "region_signals": [
            {
                key: value
                for key, value in signal.items()
                if not key.startswith("_")
            }
            for signal in signals
        ],
        "cleanest_regions": cleanest_regions,
        "cleanest_global": cleanest_global,
        "provider_health": provider_health,
        "source_health": source_health,
        "generation_mix": generation_mix,
        "generated_at": now.isoformat(),
    }


async def compute_live_home(*, force_refresh: bool = False) -> dict[str, Any]:
    global _cache, _cache_expires_at
    if (
        not force_refresh
        and _cache is not None
        and time.monotonic() < _cache_expires_at
    ):
        return _cache
    async with _cache_lock:
        if (
            force_refresh
            or _cache is None
            or time.monotonic() >= _cache_expires_at
        ):
            _cache = await _build_live_home()
            _cache_expires_at = time.monotonic() + _CACHE_TTL_SECONDS
    return _cache
