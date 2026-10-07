from datetime import datetime, timezone


def freshness_status(
    updated_at: object,
    *,
    now: datetime | None = None,
) -> str:
    if updated_at is None:
        return "unavailable"

    if isinstance(updated_at, str):
        try:
            timestamp = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
        except ValueError:
            return "unavailable"
    elif isinstance(updated_at, datetime):
        timestamp = updated_at
    else:
        return "unavailable"

    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    timestamp = timestamp.astimezone(timezone.utc)
    current_time = now or datetime.now(timezone.utc)
    age_seconds = (current_time - timestamp).total_seconds()

    if age_seconds < 0:
        return "forecast"
    if age_seconds <= 60 * 60:
        return "live"
    if age_seconds <= 3 * 60 * 60:
        return "delayed"
    return "stale"
