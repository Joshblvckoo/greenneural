from typing import Any

from fastapi import APIRouter

from app.api.v1.providers.live_home import compute_live_home
from app.config.grid_resolver import (
    resolve_electricitymaps,
    resolve_entsoe,
    resolve_watttime,
)
from app.config.regions import REGION_MAP
from app.config.uk_regions import resolve_uk_region_id
from app.services.live_signal_scheduler import scheduler_status

router = APIRouter()
def _eligible_sources(provider: str, region: str) -> list[str]:
    sources = []
    if resolve_electricitymaps(provider, region) is not None:
        sources.append("Electricity Maps")
    if resolve_watttime(provider, region) is not None:
        sources.append("WattTime")
    if resolve_entsoe(provider, region) is not None:
        sources.append("ENTSO-E")
    if resolve_uk_region_id(provider, region) is not None:
        sources.append("UK Carbon Intensity API")
    return sources


def build_region_diagnostics(
    snapshot: dict[str, Any],
) -> tuple[dict[str, dict[str, int]], list[dict[str, Any]]]:
    readings = {
        (signal["provider"], signal["region"]): signal
        for signal in snapshot.get("region_signals", [])
    }
    coverage: dict[str, dict[str, int]] = {}
    regions = []
    for provider, provider_regions in REGION_MAP.items():
        mapped_count = 0
        available_count = 0
        for region in provider_regions:
            eligible_sources = _eligible_sources(provider, region)
            reading = readings.get((provider, region), {})
            available = (
                reading.get("intensity") is not None
                and reading.get("status")
                in {"live", "delayed", "limited", "stale", "forecast"}
            )
            if eligible_sources:
                mapped_count += 1
            if available:
                available_count += 1
            regions.append(
                {
                    "provider": provider,
                    "region": region,
                    "mapping_status": "mapped" if eligible_sources else "unsupported",
                    "eligible_sources": eligible_sources,
                    "status": reading.get(
                        "status",
                        "unavailable" if eligible_sources else "unsupported",
                    ),
                    "intensity": reading.get("intensity"),
                    "source": reading.get("source"),
                    "updated_at": reading.get("updated_at"),
                    "latency_ms": reading.get("latency_ms"),
                    "error": reading.get("error"),
                }
            )
        coverage[provider] = {
            "regions_total": len(provider_regions),
            "regions_mapped": mapped_count,
            "regions_unsupported": len(provider_regions) - mapped_count,
            "regions_available": available_count,
        }
    return coverage, regions


@router.get("/diagnostics")
async def diagnostics() -> dict[str, Any]:
    snapshot = await compute_live_home()
    coverage, regions = build_region_diagnostics(snapshot)
    return {
        "generated_at": snapshot["generated_at"],
        "scheduler": scheduler_status(),
        "global_signal": snapshot["global_signal"],
        "source_health": snapshot["source_health"],
        "region_coverage": coverage,
        "regions": regions,
    }
