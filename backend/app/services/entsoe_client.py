import os
import httpx
from datetime import datetime
from typing import Optional

from app.config.settings import settings


class EntsoeClient:
    def __init__(self) -> None:
        self.token = os.getenv("ENTSOE_SECURITY_TOKEN")
        if not self.token:
            raise RuntimeError("ENTSOE_SECURITY_TOKEN is not set")

    async def get_intensity(self, bidding_zone: str) -> Optional[float]:
        """
        Returns gCO2/kWh for a bidding zone based on generation mix.
        Uses documentType A75 (Actual generation per production type).
        """
        now = datetime.utcnow()
        start = now.replace(minute=0, second=0, microsecond=0)
        end = start

        params = {
            "securityToken": self.token,
            "documentType": "A75",
            "in_Domain": bidding_zone,
            "periodStart": start.strftime("%Y%m%d%H%M"),
            "periodEnd": end.strftime("%Y%m%d%H%M"),
        }

        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(settings.ENTSOE_ENDPOINT_URL, params=params)
            resp.raise_for_status()
            xml = resp.text

        # TODO: parse XML properly; placeholder:
        # if parsing fails, return None so diagnostics can mark invalid
        try:
            # parse XML, compute intensity
            # intensity = ...
            intensity = None
        except Exception:
            return None

        return intensity
