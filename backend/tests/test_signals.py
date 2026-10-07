import unittest
from unittest.mock import AsyncMock, patch

from app.api.v1 import signals
from app.main import app


class CleanestSignalsTests(unittest.IsolatedAsyncioTestCase):
    async def test_endpoint_returns_cleanest_and_top_three_with_timestamps(self):
        snapshot = {
            "global_cleanest_top3": [
                {
                    "provider": "aws",
                    "region": "us-west-1",
                    "intensity": 68.0,
                    "updated_at": "2026-10-07T10:00:00Z",
                    "status": "live",
                },
                {
                    "provider": "azure",
                    "region": "westus",
                    "intensity": 70.0,
                    "updated_at": "2026-10-07T10:01:00Z",
                    "status": "live",
                },
                {
                    "provider": "gcp",
                    "region": "us-west1",
                    "intensity": 72.0,
                    "updated_at": "2026-10-07T10:02:00Z",
                    "status": "limited",
                },
            ]
        }
        with patch.object(
            signals,
            "compute_live_home",
            new=AsyncMock(return_value=snapshot),
        ):
            result = await signals.cleanest_regions()

        self.assertEqual(
            result["cleanest"],
            {
                "provider": "aws",
                "region": "us-west-1",
                "intensity": 68.0,
                "updated_at": "2026-10-07T10:00:00Z",
            },
        )
        self.assertEqual(len(result["top3"]), 3)
        self.assertEqual(result["top3"][2]["updated_at"], "2026-10-07T10:02:00Z")
        self.assertNotIn("status", result["top3"][0])
        self.assertIn("/api/v1/signals/cleanest", app.openapi()["paths"])

    async def test_endpoint_returns_empty_result_when_no_regions_are_available(self):
        with patch.object(
            signals,
            "compute_live_home",
            new=AsyncMock(return_value={"global_cleanest_top3": []}),
        ):
            result = await signals.cleanest_regions()

        self.assertEqual(result, {"cleanest": None, "top3": []})
