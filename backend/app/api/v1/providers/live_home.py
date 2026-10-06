import asyncio
import math
import os
import time
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from fastapi import HTTPException

from app.api.v1.providers.entsoe import ENTSOE_ZONES, entsoe_live_signal
from app.api.v1.providers.uk_grid import uk_generation_mix, uk_signal
from app.api.v1.providers.watttime import watttime_signal
from app.api.v1.regions.aws import US_REGION_MAP as AWS_US_REGION_MAP
from app.api.v1.regions.azure import US_REGION_MAP as AZURE_US_REGION_MAP
from app.api.v1.regions.gcp import US_REGION_MAP as GCP_US_REGION_MAP

US_REGION_MAP = {
    "aws": AWS_US_REGION_MAP,
    "azure": AZURE_US_REGION_MAP,
    "gcp": GCP_US_REGION_MAP,
}

REGIONS = {
    "aws": [
        "us-east-1", "us-west-2", "eu-north-1", "eu-west-1", "eu-west-2",
        "ap-south-1", "af-south-1",
    ],
    "azure": [
        "eastus", "westus2", "norwayeast", "uksouth", "westeurope",
        "indiacentral", "southafricanorth",
    ],
    "gcp": [
        "us-central1", "us-east1", "europe-west1", "europe-west2",
        "asia-south1", "me-west1",
    ],
}

_CACHE_TTL_SECONDS = 30
_TREND_WINDOW = timedelta(minutes=10)
_TREND_MAX_AGE = timedelta(minutes=20)
_cache: dict[str, Any] | None = None
_cache_expires_at = 0.0
_cache_lock = asyncio.Lock()
_history: dict[str, list[tuple[datetime, float]]] = {}


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
    timestamp = _parse_timestamp(updated_at)
    if timestamp is None:
        return "unavailable"
    current_time = now or datetime.now(timezone.utc)
    age_seconds = (current_time - timestamp).total_seconds()
    if forecast or age_seconds < 0:
        return "forecast"
    if age_seconds < 60:
        return "live"
    if age_seconds < 300:
        return "delayed"
    return "stale"


def _combined_status(signals: list[dict[str, Any]]) -> str:
    statuses = {signal["status"] for signal in signals}
    for status in ("stale", "delayed", "forecast", "live"):
        if status in statuses:
            return status
    return "unavailable"


async def _get_region_signal(provider: str, region: str) -> dict[str, Any]:
    request_started = time.perf_counter()
    grid_key: str | None = None
    source_name: str | None = None
    try:
        if region in US_REGION_MAP[provider]:
            grid = US_REGION_MAP[provider][region]
            grid_key = f"watttime:{grid}"
            source_name = "WattTime"
            signal = await watttime_signal(grid)
        elif region in {"eu-west-2", "uksouth", "ukwest", "europe-west2"}:
            grid_key = "uk-grid:GB"
            source_name = "UK Carbon Intensity API"
            signal = await uk_signal()
        elif region in ENTSOE_ZONES:
            zone = ENTSOE_ZONES[region]
            grid_key = f"entsoe:{zone}"
            source_name = "ENTSO-E"
            signal = await entsoe_live_signal(zone)
        else:
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
    except HTTPException as error:
        return {
            "provider": provider,
            "region": region,
            "intensity": None,
            "source": source_name,
            "_source_name": source_name,
            "updated_at": None,
            "status": "unavailable",
            "latency_ms": round((time.perf_counter() - request_started) * 1000, 2),
            "_grid_key": grid_key,
            "error": str(error.detail),
        }
    except httpx.HTTPError as error:
        return {
            "provider": provider,
            "region": region,
            "intensity": None,
            "source": source_name,
            "_source_name": source_name,
            "updated_at": None,
            "status": "unavailable",
            "latency_ms": round((time.perf_counter() - request_started) * 1000, 2),
            "_grid_key": grid_key,
            "error": type(error).__name__,
        }

    updated_at = signal.get("updated_at")
    latency_ms = round((time.perf_counter() - request_started) * 1000, 2)
    source_status = signal.get("status")
    result = {
        "provider": provider,
        "region": region,
        "intensity": float(signal["value"]),
        "source": signal["source"],
        "updated_at": updated_at,
        "status": compute_status(
            updated_at,
            forecast=source_status == "forecast",
        ),
        "latency_ms": latency_ms,
        "_grid_key": grid_key,
        "_source_name": source_name,
    }
    if not math.isfinite(result["intensity"]):
        return {
            "provider": provider,
            "region": region,
            "intensity": None,
            "source": None,
            "updated_at": None,
            "status": "unavailable",
            "latency_ms": latency_ms,
            "_grid_key": grid_key,
            "_source_name": source_name,
            "error": "The live source returned an invalid intensity value.",
        }
    if "mix" in signal:
        result["mix"] = signal["mix"]
    return result


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
    signals = await asyncio.gather(
        *(_get_region_signal(provider, region) for provider, region in targets)
    )
    generation_mix = await _get_generation_mix(signals)
    now = datetime.now(timezone.utc)
    source_health: dict[str, dict[str, Any]] = {}
    source_config = {
        "WattTime": [
            name for name in ("WATTTIME_USERNAME", "WATTTIME_PASSWORD")
            if not os.getenv(name)
        ],
        "ENTSO-E": [
            name for name in ("ENTSOE_API_KEY",)
            if not os.getenv(name)
        ],
        "UK Carbon Intensity API": [],
    }
    for source_name, missing_variables in source_config.items():
        source_signals = [
            signal for signal in signals
            if signal.get("_source_name") == source_name
        ]
        source_readings = [
            signal for signal in source_signals
            if signal["intensity"] is not None
            and signal["status"] in {"live", "delayed", "stale", "forecast"}
        ]
        timestamps = [
            timestamp for signal in source_readings
            if (timestamp := _parse_timestamp(signal["updated_at"])) is not None
        ]
        errors = sorted({
            signal["error"] for signal in source_signals
            if signal.get("error")
        })
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
            "regions_checked": len(source_signals),
            "updated_at": latest_timestamp.isoformat() if latest_timestamp else None,
            "latency_ms": (
                round(sum(source_latencies) / len(source_latencies), 2)
                if source_latencies
                else None
            ),
            "errors": errors,
        }

    unconfigured_regions = [
        signal for signal in signals if not signal.get("_source_name")
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
        if signal["status"] in {"live", "delayed", "stale", "forecast"}
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

    unique_grids: dict[str, dict[str, Any]] = {}
    for signal in observed:
        grid_key = signal.get("_grid_key", f'{signal["provider"]}/{signal["region"]}')
        existing = unique_grids.get(grid_key)
        current_timestamp = _parse_timestamp(signal["updated_at"])
        existing_timestamp = _parse_timestamp(existing["updated_at"]) if existing else None
        if existing is None or (
            current_timestamp is not None
            and (existing_timestamp is None or current_timestamp > existing_timestamp)
        ):
            unique_grids[grid_key] = signal
    global_observed = list(unique_grids.values())
    expected_grids = {
        signal["_grid_key"]
        for signal in signals
        if signal.get("_grid_key")
    }

    if global_observed:
        global_intensity = round(
            sum(signal["intensity"] for signal in global_observed)
            / len(global_observed),
            2,
        )
        deltas = [
            signal["delta_10m"]
            for signal in global_observed
            if signal["delta_10m"] is not None
        ]
        global_delta = round(sum(deltas) / len(deltas), 2) if deltas else None
        source_names = sorted({
            signal["source"] for signal in global_observed if signal["source"]
        })
        source_latencies = [
            signal["latency_ms"]
            for signal in global_observed
            if signal.get("latency_ms") is not None
        ]
        global_latency = max(source_latencies) if source_latencies else None
        timestamps = [
            timestamp for signal in global_observed
            if (timestamp := _parse_timestamp(signal["updated_at"])) is not None
        ]
        signal_status = _combined_status(global_observed)
        updated_at = min(timestamps).isoformat() if timestamps else None
    else:
        global_intensity = None
        global_delta = None
        source_names = []
        global_latency = None
        updated_at = None
        signal_status = "unavailable"

    cleanest_regions = sorted(
        (signal for signal in global_observed if signal["status"] in {"live", "delayed"}),
        key=lambda signal: signal["intensity"],
    )[:10]
    cleanest_regions = [
        {key: value for key, value in signal.items() if not key.startswith("_")}
        for signal in cleanest_regions
    ]

    provider_health: dict[str, Any] = {}
    for provider in REGIONS:
        provider_observed = [
            signal for signal in signals
            if signal["provider"] == provider
            and signal["status"] in {"live", "delayed", "stale", "forecast"}
            and signal["intensity"] is not None
        ]
        if provider_observed:
            average = round(
                sum(signal["intensity"] for signal in provider_observed)
                / len(provider_observed)
            )
            best = min(provider_observed, key=lambda signal: signal["intensity"])
            deltas = [
                signal["delta_10m"] for signal in provider_observed
                if signal.get("delta_10m") is not None
            ]
            provider_delta = round(sum(deltas) / len(deltas), 2) if deltas else None
            provider_status = _combined_status(provider_observed)
            provider_sources = sorted({
                signal["source"]
                for signal in provider_observed
                if signal.get("source")
            })
            provider_latencies = [
                signal["latency_ms"]
                for signal in provider_observed
                if signal.get("latency_ms") is not None
            ]
            provider_latency = (
                round(sum(provider_latencies) / len(provider_latencies), 2)
                if provider_latencies
                else None
            )
            updated_times = [
                timestamp for signal in provider_observed
                if (timestamp := _parse_timestamp(signal["updated_at"])) is not None
            ]
            provider_updated_at = min(updated_times).isoformat() if updated_times else None
            cleanest = {
                "region": best["region"],
                "intensity": best["intensity"],
                "source": best["source"],
                "updated_at": best["updated_at"],
                "status": best["status"],
                "latency_ms": best.get("latency_ms"),
            }
        else:
            provider_health[provider] = {
                "average_intensity": None,
                "trend": "unknown",
                "delta_10m": None,
                "cleanest_region": None,
                "updated_at": None,
                "status": "unavailable",
                "sources": [],
                "latency_ms": None,
                "regions_available": 0,
                "regions_checked": len(REGIONS[provider]),
            }
            continue

        provider_health[provider] = {
            "average_intensity": average,
            "trend": _trend(provider_delta),
            "delta_10m": provider_delta,
            "cleanest_region": cleanest,
            "updated_at": provider_updated_at,
            "status": provider_status,
            "sources": provider_sources,
            "latency_ms": provider_latency,
            "regions_available": len(provider_observed),
            "regions_checked": len(REGIONS[provider]),
        }

    return {
        "global_signal": {
            "intensity": global_intensity,
            "delta_10m": global_delta,
            "trend": _trend(global_delta),
            "sources": source_names,
            "latency_ms": global_latency,
            "updated_at": updated_at,
            "status": signal_status,
            "regions_included": len(global_observed),
            "regions_expected": len(expected_grids),
            "partial": len(global_observed) < len(expected_grids),
            "methodology": (
                "No live grid readings are currently available."
                if signal_status == "unavailable"
                else (
                    f"Partial snapshot: {len(global_observed)} of "
                    f"{len(expected_grids)} mapped grid signals are available. "
                    "Provider methodologies vary."
                    if len(global_observed) < len(expected_grids)
                    else "Mean of unique mapped grid signals; provider methodologies vary."
                )
            ),
        },
        "cleanest_regions": cleanest_regions,
        "provider_health": provider_health,
        "source_health": source_health,
        "generation_mix": generation_mix,
        "generated_at": now.isoformat(),
    }


async def compute_live_home() -> dict[str, Any]:
    global _cache, _cache_expires_at
    if _cache is not None and time.monotonic() < _cache_expires_at:
        return _cache
    async with _cache_lock:
        if _cache is None or time.monotonic() >= _cache_expires_at:
            _cache = await _build_live_home()
            _cache_expires_at = time.monotonic() + _CACHE_TTL_SECONDS
    return _cache
