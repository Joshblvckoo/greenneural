import unittest
from unittest.mock import AsyncMock, patch

from app.api.v1 import signals
from app.main import app


class CleanestSignalsTests(unittest.IsolatedAsyncioTestCase):
    async def test_endpoint_returns_only_cleanest_region_with_timestamp(self):
        snapshot = {
            "cleanest_global": {
                "provider": "aws",
                "region": "us-west-1",
                "intensity": 68.0,
                "updated_at": "2026-10-07T10:00:00Z",
            },
        }
        with patch.object(
            signals,
            "compute_live_home",
            new=AsyncMock(return_value=snapshot),
        ):
            result = await signals.cleanest_region()

        self.assertEqual(result, {"cleanest": snapshot["cleanest_global"]})
        self.assertNotIn("top3", result)
        self.assertIn("/api/v1/signals/cleanest", app.openapi()["paths"])

    async def test_endpoint_returns_null_cleanest_when_no_regions_are_available(self):
        with patch.object(
            signals,
            "compute_live_home",
            new=AsyncMock(return_value={"cleanest_global": None}),
        ):
            result = await signals.cleanest_region()

        self.assertEqual(result, {"cleanest": None})
