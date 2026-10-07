from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from backend.app.api.v1.auth import get_current_user
from backend.app.api.v1.providers.forecast import build_time_to_clean_forecast

router = APIRouter(prefix="/home/pro", tags=["pro"])


@router.get("/forecast")
async def time_to_clean_forecast(user: dict = Depends(get_current_user)):
    forecast = await build_time_to_clean_forecast()
    return {
        "forecast": forecast,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
