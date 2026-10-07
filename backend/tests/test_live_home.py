import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException

from backend.app.config.grid_resolver import resolve_entsoe, resolve_watttime
from backend.app.config.uk_regions import resolve_uk_region, resolve_uk_region_id
from backend.app.api.v1.providers import live_home
from backend.app.api.v1.providers import forecast
from backend.app.api.v1.carbon import routes as carbon_routes
from backend.app.api.v1 import diagnostics as diagnostics_routes
from backend.app.api.v1.providers.entsoe import _fetch_generation_xml
from backend.app.api.v1.providers.watttime import watttime_get_token
from backend.app.api.v1.regions.aws import map_aws_region
from backend.app.api.v1.regions.azure import map_azure_region
from backend.app.api.v1.regions.gcp import map_gcp_region
from backend.app.config.regions import REGION_MAP
from backend.app.services import live_signal_scheduler
from backend.app.main import app, debug_env


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

    def test_global_cleanest_region_compares_all_providers(self):
        cleanest = live_home.global_cleanest_region(
            [
                {
                    "provider": "aws",
                    "region": "us-east-1",
                    "intensity": 90.0,
                    "status": "live",
                },
                {
                    "provider": "azure",
                    "region": "westeurope",
                    "intensity": 42.0,
                    "status": "limited",
                },
                {
                    "provider": "gcp",
                    "region": "europe-west1",
                    "intensity": 61.0,
                    "status": "live",
                },
            ]
        )
        self.assertEqual(
            cleanest,
            {
                "provider": "azure",
                "region": "westeurope",
                "intensity": 42.0,
                "updated_at": None,
            },
        )

    def test_global_cleanest_region_excludes_stale_and_unavailable_readings(self):
        cleanest = live_home.global_cleanest_region(
            [
                {
                    "provider": "aws",
                    "region": "us-east-1",
                    "intensity": 10.0,
                    "status": "stale",
                },
                {
                    "provider": "gcp",
                    "region": "europe-west1",
                    "intensity": None,
                    "status": "unavailable",
                },
            ]
        )

        self.assertIsNone(cleanest)

    def test_provider_health_summarizes_regions_and_history_trend(self):
        health = live_home.build_provider_health(
            "aws",
            [
                {
                    "provider": "aws",
                    "region": "us-east-1",
                    "intensity": 110.0,
                    "status": "live",
                    "delta_10m": -10.0,
                    "source": "WattTime",
                    "updated_at": "2026-10-06T11:50:00+00:00",
                    "latency_ms": 10.0,
                },
                {
                    "provider": "aws",
                    "region": "eu-west-2",
                    "intensity": 90.0,
                    "status": "delayed",
                    "delta_10m": -6.0,
                    "source": "UK Carbon Intensity API",
                    "updated_at": "2026-10-06T11:49:00+00:00",
                    "latency_ms": 20.0,
                },
                {
                    "provider": "aws",
                    "region": "ap-south-1",
                    "intensity": None,
                    "status": "unavailable",
                },
                {
                    "provider": "gcp",
                    "region": "us-central1",
                    "intensity": 1.0,
                    "status": "live",
                },
            ],
        )

        self.assertEqual(health["average_intensity"], 100)
        self.assertEqual(health["trend"], "down")
        self.assertEqual(health["delta_10m"], -8.0)
        self.assertEqual(health["status"], "delayed")
        self.assertEqual(health["regions_available"], 2)
        self.assertEqual(health["regions_checked"], 3)
        self.assertEqual(health["cleanest_region"]["region"], "eu-west-2")
        self.assertEqual(health["latency_ms"], 15.0)

    def test_provider_health_is_unavailable_without_valid_region_readings(self):
        health = live_home.build_provider_health(
            "gcp",
            [
                {
                    "provider": "gcp",
                    "region": "asia-south1",
                    "intensity": None,
                    "status": "unavailable",
                }
            ],
        )

        self.assertEqual(health["average_intensity"], None)
        self.assertEqual(health["trend"], "unknown")
        self.assertIsNone(health["delta_10m"])
        self.assertEqual(health["status"], "unavailable")
        self.assertEqual(health["regions_available"], 0)
        self.assertEqual(health["regions_checked"], 1)
        self.assertIsNone(health["cleanest_region"])

    def test_global_signal_deduplicates_grid_aliases_and_counts_expected_grids(self):
        signal = live_home.build_global_signal(
            [
                {
                    "provider": "aws",
                    "region": "eu-west-2",
                    "intensity": 100.0,
                    "source": "ENTSO-E",
                    "updated_at": "2026-10-06T11:00:00+00:00",
                    "status": "live",
                    "_grid_key": "entsoe:10YGB----------A",
                    "_grid_keys_expected": [
                        "entsoe:10YGB----------A",
                        "uk-grid:GB",
                    ],
                },
                {
                    "provider": "gcp",
                    "region": "europe-west2",
                    "intensity": 130.0,
                    "source": "UK Carbon Intensity API",
                    "updated_at": "2026-10-06T11:01:00+00:00",
                    "status": "live",
                    "_grid_key": "uk-grid:GB",
                    "_grid_keys_expected": ["uk-grid:GB"],
                },
                {
                    "provider": "aws",
                    "region": "us-east-1",
                    "intensity": None,
                    "status": "unavailable",
                    "_grid_keys_expected": ["watttime:PJM_ROANOKE"],
                },
            ]
        )

        self.assertEqual(signal["intensity"], 130.0)
        self.assertEqual(signal["regions_included"], 1)
        self.assertEqual(signal["regions_expected"], 2)
        self.assertTrue(signal["partial"])
        self.assertEqual(signal["sources"], ["UK Carbon Intensity API"])

    def test_diagnostics_enumerates_full_inventory_with_electricity_maps_fallback(self):
        coverage, regions = diagnostics_routes.build_region_diagnostics(
            {
                "region_signals": [
                    {
                        "provider": "aws",
                        "region": "us-east-1",
                        "intensity": 123.0,
                        "status": "live",
                        "source": "WattTime",
                    }
                ]
            }
        )

        self.assertEqual(
            len(regions),
            sum(len(provider_regions) for provider_regions in REGION_MAP.values()),
        )
        self.assertEqual(coverage["aws"]["regions_total"], len(REGION_MAP["aws"]))
        self.assertEqual(coverage["aws"]["regions_available"], 1)
        unsupported = next(
            entry for entry in regions
            if entry["provider"] == "aws" and entry["region"] == "ap-south-1"
        )
        self.assertEqual(unsupported["mapping_status"], "mapped")
        self.assertIn("Electricity Maps", unsupported["eligible_sources"])
        self.assertEqual(unsupported["status"], "unavailable")

    async def test_scheduler_forces_live_home_refresh_and_reports_success(self):
        with patch.object(
            live_signal_scheduler,
            "compute_live_home",
            new=AsyncMock(return_value={}),
        ) as refresh:
            await live_signal_scheduler.refresh_live_signals()

        refresh.assert_awaited_once_with(force_refresh=True)
        status = live_signal_scheduler.scheduler_status()
        self.assertEqual(status["interval_seconds"], 300)
        self.assertIsNotNone(status["last_attempt_at"])
        self.assertIsNotNone(status["last_success_at"])
        self.assertIsNone(status["last_error"])
        self.assertFalse(status["running"])

    async def test_diagnostics_endpoint_reports_scheduler_and_region_coverage(self):
        api_paths = app.openapi()["paths"]
        self.assertIn("/api/v1/home/live", api_paths)
        self.assertIn("/api/v1/diagnostics", api_paths)
        snapshot = {
            "generated_at": "2026-10-06T12:00:00+00:00",
            "global_signal": {"status": "partial"},
            "source_health": {"WattTime": {"status": "live"}},
            "region_signals": [],
        }
        with patch.object(
            diagnostics_routes,
            "compute_live_home",
            new=AsyncMock(return_value=snapshot),
        ):
            result = await diagnostics_routes.diagnostics()

        self.assertEqual(result["generated_at"], snapshot["generated_at"])
        self.assertEqual(result["source_health"], snapshot["source_health"])
        self.assertEqual(
            len(result["regions"]),
            sum(len(provider_regions) for provider_regions in REGION_MAP.values()),
        )
        self.assertIn("interval_seconds", result["scheduler"])

    def test_entsoe_region_mappings_are_provider_specific_and_case_insensitive(self):
        self.assertEqual(resolve_entsoe("aws", "eu-west-1"), "10YFR-RTE------C")
        self.assertEqual(resolve_entsoe("aws", "eu-west-3"), "10YFR-RTE------C")
        self.assertEqual(resolve_entsoe("aws", "eu-central-1"), "10YDE-ENBW-----N")
        self.assertEqual(resolve_entsoe("aws", "eu-central-2"), "10YDE-ENBW-----N")
        self.assertEqual(
            resolve_entsoe("azure", "germanywestcentral"),
            "10Y1001A1001A63L",
        )
        self.assertEqual(resolve_entsoe("gcp", "europe-west6"), "10YCH-SWISSGRIDZ")
        self.assertEqual(
            resolve_entsoe("gcp", "europe-central2"),
            "10YDE-ENBW-----N",
        )
        self.assertEqual(resolve_entsoe("gcp", "europe-west1"), "10YBE----------2")
        self.assertEqual(resolve_entsoe("azure", "northeurope"), "10YDK-1--------W")
        self.assertEqual(resolve_entsoe("azure", "polandcentral"), "10YPL-AREA-----S")
        self.assertIsNone(resolve_entsoe("aws", "us-east-1"))
        self.assertIsNone(resolve_entsoe("unknown", "europe-west1"))

    def test_watttime_region_mappings_are_provider_specific_and_case_insensitive(self):
        self.assertEqual(map_aws_region("us-east-1"), "PJM_COMED")
        self.assertEqual(map_aws_region("us-east-2"), "PJM_AEP")
        self.assertEqual(map_aws_region("us-west-1"), "CAISO_NORTH")
        self.assertEqual(map_aws_region("us-west-2"), "CAISO_SOUTH")
        self.assertEqual(map_azure_region("eastus2"), "PJM_COMED")
        self.assertEqual(map_azure_region("centralus"), "SPP_WEST")
        self.assertEqual(map_azure_region("southcentralus"), "ERCOT_HOUSTON")
        self.assertEqual(map_gcp_region("us-east4"), "PJM_COMED")
        self.assertEqual(map_gcp_region("us-central1"), "MISO_WUMS")
        self.assertEqual(map_gcp_region("us-west2"), "CAISO_SOUTH")
        self.assertEqual(resolve_watttime("aws", "us-east-1"), "PJM_COMED")
        self.assertEqual(resolve_watttime("aws", "us-east-2"), "PJM_AEP")
        self.assertEqual(resolve_watttime("aws", "us-west-1"), "CAISO_NORTH")
        self.assertEqual(resolve_watttime("aws", "us-west-2"), "CAISO_SOUTH")
        self.assertEqual(resolve_watttime("azure", "eastus2"), "PJM_COMED")
        self.assertEqual(resolve_watttime("azure", "centralus"), "SPP_WEST")
        self.assertEqual(resolve_watttime("azure", "southcentralus"), "ERCOT_HOUSTON")
        self.assertEqual(resolve_watttime("gcp", "us-east4"), "PJM_COMED")
        self.assertEqual(resolve_watttime("gcp", "us-central1"), "MISO_WUMS")
        self.assertEqual(resolve_uk_region("aws", "eu-west-2"), "london")
        self.assertEqual(resolve_uk_region_id("azure", "uksouth"), 12)
        self.assertEqual(resolve_uk_region_id("azure", "ukwest"), 7)
        self.assertEqual(resolve_uk_region_id("gcp", "europe-west2"), 13)
        self.assertIsNone(resolve_watttime("aws", "us-central-1"))
        self.assertIsNone(resolve_watttime("aws", "us-west-2-alt"))
        self.assertIsNone(resolve_watttime("unknown", "us-east-1"))

    def test_signal_status_uses_relaxed_freshness_and_forecast_thresholds(self):
        now = datetime(2026, 10, 6, 8, 0, tzinfo=timezone.utc)
        self.assertEqual(
            live_home.compute_status(now.isoformat(), now=now),
            "live",
        )
        self.assertEqual(
            live_home.compute_status(
                (now - timedelta(hours=2)).isoformat(),
                now=now,
            ),
            "live",
        )
        self.assertEqual(
            live_home.compute_status(
                (now - timedelta(hours=2, seconds=1)).isoformat(),
                now=now,
            ),
            "limited",
        )
        self.assertEqual(
            live_home.compute_status(
                (now - timedelta(hours=4)).isoformat(),
                now=now,
            ),
            "limited",
        )
        self.assertEqual(
            live_home.compute_status(
                (now - timedelta(hours=4, seconds=1)).isoformat(),
                now=now,
            ),
            "stale",
        )
        self.assertEqual(
            live_home.compute_status(
                (now - timedelta(minutes=54)).isoformat(),
                now=now,
            ),
            "live",
        )
        self.assertEqual(
            live_home.compute_status(
                (now + timedelta(seconds=1)).isoformat(),
                now=now,
            ),
            "forecast",
        )
        self.assertEqual(live_home.compute_status(None, fallback=True), "fallback")

    async def test_watttime_reads_missing_credentials_from_current_environment(self):
        with patch.dict(
            "os.environ",
            {"WATTTIME_USERNAME": "", "WATTTIME_PASSWORD": ""},
        ):
            with self.assertRaises(HTTPException) as raised:
                await watttime_get_token()

        self.assertEqual(raised.exception.status_code, 500)
        self.assertEqual(raised.exception.detail, "WattTime credentials missing")

    async def test_entsoe_reads_security_token_from_current_environment(self):
        with patch.dict("os.environ", {"ENTSOE_SECURITY_TOKEN": ""}):
            with self.assertRaises(HTTPException) as raised:
                await _fetch_generation_xml(
                    "10YFI-1--------U",
                    "A75",
                    datetime.now(timezone.utc),
                    datetime.now(timezone.utc) + timedelta(hours=1),
                )

        self.assertEqual(raised.exception.status_code, 503)
        self.assertEqual(
            raised.exception.detail,
            "ENTSO-E security token is not configured",
        )

    async def test_entsoe_request_uses_security_token_and_domain_parameter(self):
        response = MagicMock(status_code=200, text="<Acknowledgement/>")
        client = MagicMock()
        client.get = AsyncMock(return_value=response)
        client_context = MagicMock()
        client_context.__aenter__ = AsyncMock(return_value=client)
        client_context.__aexit__ = AsyncMock(return_value=None)
        period_start = datetime(2026, 10, 6, 12, tzinfo=timezone.utc)
        period_end = period_start + timedelta(hours=1)

        with (
            patch.dict("os.environ", {"ENTSOE_SECURITY_TOKEN": "test-token"}),
            patch(
                "backend.app.api.v1.providers.entsoe.httpx.AsyncClient",
                return_value=client_context,
            ),
        ):
            result = await _fetch_generation_xml(
                "10YFR-RTE------C",
                "A75",
                period_start,
                period_end,
            )

        self.assertEqual(result, "<Acknowledgement/>")
        request_params = client.get.await_args.kwargs["params"]
        self.assertEqual(request_params["securityToken"], "test-token")
        self.assertEqual(request_params["documentType"], "A75")
        self.assertEqual(request_params["in_Domain"], "10YFR-RTE------C")
        self.assertNotIn("biddingZone", request_params)

    async def test_live_home_uses_provider_specific_entsoe_mapping(self):
        timestamp = datetime.now(timezone.utc).isoformat()
        signal = {
            "value": 123.0,
            "source": "ENTSO-E",
            "updated_at": timestamp,
            "status": "live",
        }
        with patch.object(
            live_home,
            "entsoe_live_signal",
            new=AsyncMock(return_value=signal),
        ) as entsoe_fetch:
            result = await live_home._get_region_signal("aws", "eu-west-3")

        entsoe_fetch.assert_awaited_once_with("10YFR-RTE------C")
        self.assertEqual(result["source"], "ENTSO-E")
        self.assertEqual(result["_grid_key"], "entsoe:10YFR-RTE------C")

    async def test_live_home_uses_mapped_uk_region(self):
        timestamp = datetime.now(timezone.utc).isoformat()
        uk_signal = {
            "value": 87.0,
            "source": "UK Carbon Intensity API",
            "updated_at": timestamp,
            "status": "live",
        }
        with (
            patch.object(
                live_home,
                "uk_signal",
                new=AsyncMock(return_value=uk_signal),
            ) as uk_fetch,
        ):
            result = await live_home._get_region_signal("aws", "eu-west-2")

        uk_fetch.assert_awaited_once_with(13)
        self.assertEqual(result["source"], "UK Carbon Intensity API")
        self.assertEqual(result["intensity"], 87.0)
        self.assertEqual(result["_grid_key"], "uk-grid:13")

    async def test_live_home_uses_provider_specific_watttime_mapping(self):
        timestamp = datetime.now(timezone.utc).isoformat()
        signal = {
            "value": 123.0,
            "source": "WattTime",
            "updated_at": timestamp,
            "status": "live",
        }
        with patch.object(
            live_home,
            "watttime_signal",
            new=AsyncMock(return_value=signal),
        ) as watttime_fetch:
            result = await live_home._get_region_signal("aws", "us-west-1")

        watttime_fetch.assert_awaited_once_with("CAISO_NORTH")
        self.assertEqual(result["source"], "WattTime")
        self.assertEqual(result["_grid_key"], "watttime:CAISO_NORTH")

    async def test_entsoe_forecast_uses_provider_specific_mapping(self):
        with patch.object(
            forecast,
            "fetch_entsoe_forecast",
            new=AsyncMock(return_value=[]),
        ) as entsoe_fetch:
            await forecast.entsoe_forecast("gcp", "europe-west6")

        entsoe_fetch.assert_awaited_once_with("10YCH-SWISSGRIDZ")

    async def test_forecast_does_not_call_watttime_for_unmapped_region(self):
        with patch.object(
            forecast,
            "watttime_get_moer",
            new=AsyncMock(),
        ) as watttime_fetch:
            result = await forecast._forecast_target("aws", "us-east4")

        watttime_fetch.assert_not_awaited()
        self.assertEqual(result["status"], "unavailable")
        self.assertIn("No forecast provider is configured", result["message"])

    async def test_carbon_endpoint_rejects_unmapped_region_without_static_fallback(self):
        with patch.object(
            carbon_routes,
            "watttime_get_moer",
            new=AsyncMock(),
        ) as watttime_fetch:
            with self.assertRaises(HTTPException) as raised:
                await carbon_routes.get_carbon_intensity("aws", "us-east4")

        watttime_fetch.assert_not_awaited()
        self.assertEqual(raised.exception.status_code, 503)
        self.assertIn("No live carbon intensity source", raised.exception.detail)

    async def test_carbon_endpoint_uses_mapped_uk_region(self):
        with (
            patch.object(
                carbon_routes,
                "get_uk_intensity",
                new=AsyncMock(return_value=0.0),
            ) as uk_fetch,
        ):
            intensity = await carbon_routes.get_carbon_intensity("aws", "eu-west-2")

        uk_fetch.assert_awaited_once_with(13)
        self.assertEqual(intensity, 0.0)

    async def test_carbon_endpoint_uses_entsoe_zone_identifier(self):
        with patch.object(
            carbon_routes,
            "entsoe_intensity",
            new=AsyncMock(return_value=42.0),
        ) as entsoe_fetch:
            intensity = await carbon_routes.get_carbon_intensity("aws", "eu-west-1")

        entsoe_fetch.assert_awaited_once_with("10YFR-RTE------C")
        self.assertEqual(intensity, 42.0)

    async def test_carbon_endpoint_falls_back_to_electricity_maps(self):
        with (
            patch.object(
                carbon_routes,
                "watttime_get_moer",
                new=AsyncMock(side_effect=HTTPException(502, "WattTime unavailable")),
            ),
            patch.object(
                carbon_routes._electricitymaps_client,
                "get_intensity_by_zone",
                new=AsyncMock(return_value=88.0),
            ) as electricitymaps_fetch,
        ):
            intensity = await carbon_routes.get_carbon_intensity("aws", "us-west-1")

        electricitymaps_fetch.assert_awaited_once_with("US-CAL-CISO")
        self.assertEqual(intensity, 88.0)

    def test_debug_environment_endpoint_reports_presence_without_values(self):
        with patch.dict(
            "os.environ",
            {
                "ENTSOE_SECURITY_TOKEN": "test-entsoe-secret",
                "ELECTRICITYMAPS_API_TOKEN": "test-electricitymaps-secret",
                "WATTTIME_USERNAME": "test-user",
                "WATTTIME_PASSWORD": "test-watttime-secret",
            },
        ):
            result = debug_env()

        self.assertEqual(
            result,
            {
                "configured": {
                    "ENTSOE_SECURITY_TOKEN": True,
                    "ELECTRICITYMAPS_API_TOKEN": True,
                    "WATTTIME_USERNAME": True,
                    "WATTTIME_PASSWORD": True,
                }
            },
        )
        self.assertNotIn("test-entsoe-secret", str(result))
        self.assertNotIn("test-electricitymaps-secret", str(result))
        self.assertNotIn("test-watttime-secret", str(result))

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
        self.assertEqual(
            result["cleanest_global"],
            {
                "provider": "gcp",
                "region": "europe-west1",
                "intensity": 100.0,
                "updated_at": now,
            },
        )
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
        self.assertIsNone(result["cleanest_global"])
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
                patch.dict(
                    "os.environ",
                    {
                        "WATTTIME_USERNAME": "",
                        "WATTTIME_PASSWORD": "",
                        "ENTSOE_SECURITY_TOKEN": "",
                    },
                ),
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
        self.assertFalse(result["source_health"]["WattTime"]["configured"])
        self.assertEqual(
            result["source_health"]["WattTime"]["missing_configuration"],
            ["WATTTIME_USERNAME", "WATTTIME_PASSWORD"],
        )


if __name__ == "__main__":
    unittest.main()
