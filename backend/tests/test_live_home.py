import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

from app.api.v1.providers import live_home


class LiveHomeTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        live_home._history.clear()

    def test_ten_minute_delta_uses_historical_sample(self):
        start = datetime(2026, 10, 6, 8, 0, tzinfo=timezone.utc)
        self.assertIsNone(live_home._record_and_compare("aws/us-east-1", 100, start))

        delta = live_home._record_and_compare(
            "aws/us-east-1",
            92,
            start + timedelta(minutes=10),
        )

        self.assertEqual(delta, -8)
        self.assertEqual(live_home._trend(delta), "down")

    def test_trend_is_unknown_without_enough_history(self):
        self.assertEqual(live_home._trend(None), "unknown")

    def test_signal_status_uses_freshness_and_forecast_thresholds(self):
        now = datetime(2026, 10, 6, 8, 0, tzinfo=timezone.utc)
        self.assertEqual(
            live_home.compute_status(now.isoformat(), now=now),
            "live",
        )
        self.assertEqual(
            live_home.compute_status(
                (now - timedelta(seconds=60)).isoformat(),
                now=now,
            ),
            "delayed",
        )
        self.assertEqual(
            live_home.compute_status(
                (now - timedelta(seconds=300)).isoformat(),
                now=now,
            ),
            "stale",
        )
        self.assertEqual(
            live_home.compute_status(
                (now + timedelta(seconds=1)).isoformat(),
                now=now,
            ),
            "forecast",
        )
        self.assertEqual(live_home.compute_status(None, fallback=True), "fallback")

    async def test_live_response_includes_provenance_status_and_mix(self):
        original_regions = live_home.REGIONS
        live_home.REGIONS = {"aws": ["us-east-1"], "gcp": ["europe-west1"]}
        now = datetime.now(timezone.utc).isoformat()
        readings = [
            {
                "provider": "aws",
                "region": "us-east-1",
                "intensity": 200.0,
                "source": "WattTime",
                "_source_name": "WattTime",
                "_grid_key": "watttime:PJM_ROANOKE",
                "updated_at": now,
                "status": "live",
                "latency_ms": 12.5,
            },
            {
                "provider": "gcp",
                "region": "europe-west1",
                "intensity": 100.0,
                "source": "ENTSO-E",
                "_source_name": "ENTSO-E",
                "_grid_key": "entsoe:10YBE----------2",
                "updated_at": now,
                "status": "live",
                "latency_ms": 18.0,
                "mix": {"wind": 60.0, "gas": 40.0},
            },
        ]
        try:
            with (
                patch.object(
                    live_home,
                    "_get_region_signal",
                    new=AsyncMock(side_effect=readings),
                ),
                patch.object(
                    live_home,
                    "_get_generation_mix",
                    new=AsyncMock(
                        return_value={
                            "region": "europe-west1",
                            "mix": {"wind": 60.0, "gas": 40.0},
                            "source": "ENTSO-E",
                            "updated_at": now,
                            "status": "live",
                            "latency_ms": 22.0,
                        }
                    ),
                ),
            ):
                result = await live_home._build_live_home()
        finally:
            live_home.REGIONS = original_regions

        self.assertEqual(result["global_signal"]["intensity"], 150.0)
        self.assertEqual(result["global_signal"]["sources"], ["ENTSO-E", "WattTime"])
        self.assertEqual(result["global_signal"]["status"], "live")
        self.assertEqual(result["global_signal"]["latency_ms"], 18.0)
        self.assertEqual(result["cleanest_regions"][0]["region"], "europe-west1")
        self.assertEqual(result["generation_mix"]["mix"]["wind"], 60.0)
        self.assertEqual(result["generation_mix"]["latency_ms"], 22.0)
        self.assertEqual(result["provider_health"]["aws"]["cleanest_region"]["source"], "WattTime")
        self.assertEqual(result["provider_health"]["aws"]["latency_ms"], 12.5)

    async def test_unavailable_feeds_never_become_static_homepage_values(self):
        original_regions = live_home.REGIONS
        live_home.REGIONS = {"aws": ["ap-south-1"]}
        try:
            with (
                patch.object(
                    live_home,
                    "_get_region_signal",
                    new=AsyncMock(
                        return_value={
                            "provider": "aws",
                            "region": "ap-south-1",
                            "intensity": None,
                            "source": None,
                            "updated_at": None,
                            "status": "unavailable",
                            "error": "No live grid source is configured for this region.",
                        }
                    ),
                ),
                patch.object(
                    live_home,
                    "_get_generation_mix",
                    new=AsyncMock(
                        return_value={
                            "region": None,
                            "mix": {},
                            "source": None,
                            "updated_at": None,
                            "status": "unavailable",
                        }
                    ),
                ),
            ):
                result = await live_home._build_live_home()
        finally:
            live_home.REGIONS = original_regions

        self.assertEqual(result["global_signal"]["status"], "unavailable")
        self.assertIsNone(result["global_signal"]["intensity"])
        self.assertEqual(result["global_signal"]["sources"], [])
        self.assertEqual(result["global_signal"]["regions_included"], 0)
        self.assertEqual(result["cleanest_regions"], [])
        self.assertEqual(result["provider_health"]["aws"]["status"], "unavailable")

    async def test_partial_global_signal_reports_source_outages(self):
        original_regions = live_home.REGIONS
        live_home.REGIONS = {
            "aws": ["us-east-1"],
            "gcp": ["europe-west2"],
        }
        now = datetime.now(timezone.utc).isoformat()
        readings = [
            {
                "provider": "aws",
                "region": "us-east-1",
                "intensity": None,
                "source": "WattTime",
                "_source_name": "WattTime",
                "_grid_key": "watttime:PJM_ROANOKE",
                "updated_at": None,
                "status": "unavailable",
                "latency_ms": 25.0,
                "error": "WattTime credentials missing",
            },
            {
                "provider": "gcp",
                "region": "europe-west2",
                "intensity": 217.0,
                "source": "UK Carbon Intensity API",
                "_source_name": "UK Carbon Intensity API",
                "_grid_key": "uk-grid:GB",
                "updated_at": now,
                "status": "live",
                "latency_ms": 40.0,
            },
        ]
        try:
            with (
                patch.object(
                    live_home,
                    "_get_region_signal",
                    new=AsyncMock(side_effect=readings),
                ),
                patch.object(
                    live_home,
                    "_get_generation_mix",
                    new=AsyncMock(
                        return_value={
                            "region": None,
                            "mix": {},
                            "source": None,
                            "updated_at": None,
                            "status": "unavailable",
                            "latency_ms": None,
                        }
                    ),
                ),
            ):
                result = await live_home._build_live_home()
        finally:
            live_home.REGIONS = original_regions

        self.assertEqual(result["global_signal"]["intensity"], 217.0)
        self.assertTrue(result["global_signal"]["partial"])
        self.assertEqual(result["global_signal"]["regions_included"], 1)
        self.assertEqual(result["global_signal"]["regions_expected"], 2)
        self.assertEqual(
            result["source_health"]["WattTime"]["errors"],
            ["WattTime credentials missing"],
        )
        self.assertEqual(
            result["source_health"]["WattTime"]["regions_available"],
            0,
        )


if __name__ == "__main__":
    unittest.main()
