import unittest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException

from app.api.v1 import diagnostics
from app.config.regions import REGION_MAP
from app.api.v1.providers import live_home
from app.config.grid_resolver import resolve_electricitymaps
from app.services.electricitymaps_client import ElectricityMapsClient
from app.services.signal_resolver import resolve_signal


class ElectricityMapsTests(unittest.IsolatedAsyncioTestCase):
    def test_electricity_maps_fallback_covers_the_cloud_region_inventory(self):
        for provider, regions in REGION_MAP.items():
            for region in regions:
                with self.subTest(provider=provider, region=region):
                    self.assertIsNotNone(resolve_electricitymaps(provider, region))

    def test_region_resolver_uses_provider_specific_maps_case_insensitively(self):
        self.assertEqual(
            resolve_electricitymaps("AWS", "US-WEST-1"),
            "US-CAL-CISO",
        )
        self.assertEqual(
            resolve_electricitymaps("azure", "NorthEurope"),
            "IE",
        )
        self.assertEqual(
            resolve_electricitymaps("gcp", "europe-west1"),
            "BE",
        )
        self.assertIsNone(resolve_electricitymaps("unknown", "us-west-1"))
        self.assertIn("Electricity Maps", diagnostics._eligible_sources("aws", "us-west-1"))

    async def test_client_reads_credentials_dynamically_and_returns_upstream_time(self):
        timestamp = "2026-10-07T09:30:00Z"
        response = MagicMock(status_code=200)
        response.json.return_value = {
            "carbonIntensity": 123.45,
            "datetime": timestamp,
        }
        client = MagicMock()
        client.get = AsyncMock(return_value=response)
        context = MagicMock()
        context.__aenter__ = AsyncMock(return_value=client)
        context.__aexit__ = AsyncMock(return_value=None)

        with (
            patch.dict(
                "os.environ",
                {
                    "ELECTRICITYMAPS_API_TOKEN": "test-token",
                    "ELECTRICITYMAPS_BASE_URL": "https://em.example/v3/",
                },
            ),
            patch(
                "app.services.electricitymaps_client.httpx.AsyncClient",
                return_value=context,
            ),
        ):
            signal = await ElectricityMapsClient().get_signal_by_zone("GB")

        self.assertEqual(signal["value"], 123.45)
        self.assertEqual(signal["updated_at"], timestamp)
        self.assertEqual(signal["source"], "Electricity Maps")
        request = client.get.await_args
        self.assertEqual(request.args[0], "https://em.example/v3/carbon-intensity/latest")
        self.assertEqual(request.kwargs["params"], {"zone": "GB"})
        self.assertEqual(
            request.kwargs["headers"]["auth-token"],
            "test-token",
        )

    async def test_client_defaults_to_electricity_maps_com_base_url(self):
        response = MagicMock(status_code=200)
        response.json.return_value = {
            "carbonIntensity": 123.45,
            "datetime": "2026-10-07T09:30:00Z",
        }
        client = MagicMock()
        client.get = AsyncMock(return_value=response)
        context = MagicMock()
        context.__aenter__ = AsyncMock(return_value=client)
        context.__aexit__ = AsyncMock(return_value=None)

        with (
            patch.dict(
                "os.environ",
                {
                    "ELECTRICITYMAPS_API_TOKEN": "test-token",
                    "ELECTRICITYMAPS_BASE_URL": "",
                },
            ),
            patch(
                "app.services.electricitymaps_client.httpx.AsyncClient",
                return_value=context,
            ),
        ):
            await ElectricityMapsClient().get_signal_by_zone("GB")

        self.assertEqual(
            client.get.await_args.args[0],
            "https://api.electricitymaps.com/v3/carbon-intensity/latest",
        )

    async def test_client_reports_missing_credentials(self):
        with patch.dict("os.environ", {"ELECTRICITYMAPS_API_TOKEN": ""}):
            with self.assertRaises(HTTPException) as raised:
                await ElectricityMapsClient().get_signal_by_zone("GB")

        self.assertEqual(raised.exception.status_code, 503)
        self.assertEqual(
            raised.exception.detail,
            "Electricity Maps API token is not configured",
        )

    async def test_live_signal_uses_watttime_before_electricity_maps_fallback(self):
        timestamp = datetime.now(timezone.utc).isoformat()
        watt_time = AsyncMock(
            return_value={
                "value": 101.0,
                "source": "WattTime",
                "updated_at": timestamp,
                "status": "live",
            }
        )
        electricity_maps = AsyncMock(
            return_value={
                "value": 88.0,
                "source": "Electricity Maps",
                "updated_at": timestamp,
                "status": "live",
            }
        )

        with (
            patch.object(live_home, "watttime_signal", watt_time),
            patch.object(
                live_home._electricitymaps_client,
                "get_signal_by_zone",
                electricity_maps,
            ),
        ):
            signal = await live_home._get_region_signal("aws", "us-west-1")

        watt_time.assert_awaited_once_with("CAISO_NORTH")
        electricity_maps.assert_not_awaited()
        self.assertEqual(signal["intensity"], 101.0)
        self.assertEqual(signal["source"], "WattTime")
        self.assertEqual(signal["_sources_attempted"], ["WattTime"])
        self.assertEqual(signal["_grid_key"], "watttime:CAISO_NORTH")

    async def test_live_signal_falls_back_to_electricity_maps_after_primary_error(self):
        timestamp = datetime.now(timezone.utc).isoformat()
        watt_time = AsyncMock(
            side_effect=HTTPException(status_code=502, detail="WattTime failed")
        )
        electricity_maps = AsyncMock(
            return_value={
                "value": 88.0,
                "source": "Electricity Maps",
                "updated_at": timestamp,
                "status": "live",
            }
        )

        with (
            patch.object(
                live_home._electricitymaps_client,
                "get_signal_by_zone",
                electricity_maps,
            ),
            patch.object(live_home, "watttime_signal", watt_time),
        ):
            signal = await live_home._get_region_signal("aws", "us-west-1")

        self.assertEqual(signal["source"], "Electricity Maps")
        self.assertEqual(signal["_sources_attempted"], ["WattTime", "Electricity Maps"])
        self.assertIn("WattTime", signal["_source_errors"])

    async def test_live_signal_tries_primary_providers_before_electricity_maps(self):
        timestamp = datetime.now(timezone.utc).isoformat()
        entsoe = AsyncMock(
            return_value={
                "value": 91.0,
                "source": "ENTSO-E",
                "updated_at": timestamp,
                "status": "live",
            }
        )
        watt_time = AsyncMock(
            side_effect=HTTPException(status_code=502, detail="WattTime failed")
        )
        electricity_maps = AsyncMock()

        with (
            patch.object(
                live_home,
                "resolve_electricitymaps",
                return_value="GB",
            ),
            patch.object(live_home, "resolve_entsoe", return_value="GB"),
            patch.object(
                live_home,
                "resolve_watttime",
                return_value="CAISO_NORTH",
            ),
            patch.object(
                live_home._electricitymaps_client,
                "get_signal_by_zone",
                electricity_maps,
            ),
            patch.object(live_home, "entsoe_live_signal", entsoe),
            patch.object(live_home, "watttime_signal", watt_time),
        ):
            signal = await live_home._get_region_signal("aws", "eu-west-1")

        self.assertEqual(signal["source"], "ENTSO-E")
        self.assertEqual(
            signal["_sources_attempted"],
            ["WattTime", "ENTSO-E"],
        )
        watt_time.assert_awaited_once()
        electricity_maps.assert_not_awaited()

    async def test_shared_resolver_falls_back_to_watttime_on_electricitymaps_error(self):
        electricity_maps = MagicMock()
        electricity_maps.get_signal_by_zone = AsyncMock(
            side_effect=HTTPException(
                status_code=502,
                detail="Electricity Maps request failed",
            )
        )
        watt_time = MagicMock()
        watt_time.get_moer = AsyncMock(return_value=117.0)

        signal = await resolve_signal(
            "aws",
            "us-west-1",
            {
                "electricitymaps": electricity_maps,
                "wattime": watt_time,
            },
        )

        self.assertEqual(signal["intensity_index"], 117.0)
        self.assertEqual(signal["source"], "WattTime")
        electricity_maps.get_signal_by_zone.assert_awaited_once_with("US-CAL-CISO")
