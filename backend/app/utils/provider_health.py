from math import isfinite
from typing import Any


def _metric_value(value: Any) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    numeric_value = float(value)
    return numeric_value if isfinite(numeric_value) else None


def provider_health(
    provider: str,
    region_signals: list[dict[str, Any]],
) -> dict[str, Any]:
    available = []
    for signal in region_signals:
        intensity = _metric_value(signal.get("intensity"))
        intensity_index = _metric_value(signal.get("intensity_index"))
        if intensity is not None or intensity_index is not None:
            available.append((intensity, intensity_index))

    if not available:
        return {
            "average_intensity": None,
            "average_index": None,
            "status": "unavailable",
            "regions_available": 0,
            "regions_checked": len(region_signals),
        }

    intensities = [intensity for intensity, _ in available if intensity is not None]
    indexes = [index for _, index in available if index is not None]

    average_intensity = (
        sum(intensities) / len(intensities) if intensities else None
    )
    average_index = sum(indexes) / len(indexes) if indexes else None

    return {
        "average_intensity": (
            round(average_intensity, 2)
            if average_intensity is not None
            else None
        ),
        "average_index": (
            round(average_index, 2) if average_index is not None else None
        ),
        "status": "live" if len(available) == len(region_signals) else "partial",
        "regions_available": len(available),
        "regions_checked": len(region_signals),
    }
