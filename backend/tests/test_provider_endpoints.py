import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException

from backend.app.api.v1.providers import entsoe, uk_grid, watttime
from backend.app.config.settings import settings


class ProviderEndpointTests(unittest.IsolatedAsyncioTestCase):
    async def test_uk_signal_reads_configured_regional_forecast(self):
        response = MagicMock(status_code=200)
        response.json.return_value = {
            "data": [
                {
                    "regionid": 13,
                    "data": [
                        {
                            "from": "2026-10-07T09:00Z",
                            "to": "2026-10-07T09:30Z",
                            "intensity": {"forecast": 81, "index": "low"},
                        }
                    ],
                }
            ]
        }
        client = MagicMock()
        client.get = AsyncMock(return_value=response)
        context = MagicMock()
        context.__aenter__ = AsyncMock(return_value=client)
        context.__aexit__ = AsyncMock(return_value=None)

        with patch(
            "backend.app.api.v1.providers.uk_grid.httpx.AsyncClient",
            return_value=context,
        ):
            result = await uk_grid.uk_signal(region_id=13)

        self.assertEqual(result["value"], 81.0)
        self.assertEqual(result["region_id"], 13)
        self.assertEqual(result["status"], "forecast")
        self.assertEqual(
            client.get.await_args.args[0],
            "https://api.carbonintensity.org.uk/regional/regionid/13",
        )

    async def test_entsoe_uses_configured_web_api_endpoint(self):
        response = MagicMock(status_code=200, text="<Acknowledgement/>")
        client = MagicMock()
        client.get = AsyncMock(return_value=response)
        context = MagicMock()
        context.__aenter__ = AsyncMock(return_value=client)
        context.__aexit__ = AsyncMock(return_value=None)
        start = datetime(2026, 10, 7, 9, tzinfo=timezone.utc)

        with (
            patch.dict(
                "os.environ",
                {
                    "ENTSOE_SECURITY_TOKEN": "test-token",
                    "ENTSOE_ENDPOINT_URL": "",
                },
            ),
            patch(
                "backend.app.api.v1.providers.entsoe.httpx.AsyncClient",
                return_value=context,
            ),
        ):
            result = await entsoe._fetch_generation_xml(
                "10YFR-RTE------C",
                "A75",
                start,
                start + timedelta(hours=1),
            )

        self.assertEqual(result, "<Acknowledgement/>")
        self.assertEqual(
            client.get.await_args.args[0],
            "https://web-api.tp.entsoe.eu/api",
        )
        self.assertEqual(
            client.get.await_args.kwargs["params"]["in_Domain"],
            "10YFR-RTE------C",
        )
        self.assertEqual(
            settings.ENTSOE_ENDPOINT_URL,
            "https://web-api.tp.entsoe.eu/api",
        )

    def test_watttime_access_parser_limits_regions_to_co2_moer(self):
        regions = watttime._parse_access_regions(
            {
                "signal_types": [
                    {
                        "signal_type": "co2_moer",
                        "regions": [
                            {"region": "CAISO_NORTH"},
                            {"region": "PJM_ROANOKE"},
                        ],
                    },
                    {
                        "signal_type": "health_damage",
                        "regions": [{"region": "NOT_MOER"}],
                    },
                ]
            }
        )

        self.assertEqual(regions, frozenset({"CAISO_NORTH", "PJM_ROANOKE"}))

    async def test_watttime_access_is_fetched_from_my_access_and_cached(self):
        response = MagicMock(status_code=200)
        response.json.return_value = {
            "signal_types": [
                {
                    "signal_type": "co2_moer",
                    "regions": [{"region": "CAISO_NORTH"}],
                }
            ]
        }
        client = MagicMock()
        client.get = AsyncMock(return_value=response)
        context = MagicMock()
        context.__aenter__ = AsyncMock(return_value=client)
        context.__aexit__ = AsyncMock(return_value=None)

        with (
            patch.object(
                watttime,
                "watttime_get_token",
                new=AsyncMock(return_value="test-token"),
            ),
            patch.object(watttime.httpx, "AsyncClient", return_value=context),
            patch.object(watttime, "_cached_access_regions", None),
            patch.object(watttime, "_cached_access_expires_at", 0.0),
        ):
            allowed = await watttime.watttime_get_access_regions()
            cached = await watttime.watttime_get_access_regions()

        self.assertEqual(allowed, frozenset({"CAISO_NORTH"}))
        self.assertEqual(cached, allowed)
        client.get.assert_awaited_once_with(
            "https://api.watttime.org/v3/my-access",
            headers={"Authorization": "Bearer test-token"},
        )

    async def test_watttime_rejects_regions_not_in_account_access(self):
        with (
            patch.object(
                watttime,
                "watttime_get_access_regions",
                new=AsyncMock(return_value=frozenset({"CAISO_NORTH"})),
            ),
        ):
            with self.assertRaises(HTTPException) as raised:
                await watttime._ensure_watttime_region_access("PJM_ROANOKE")

        self.assertEqual(raised.exception.status_code, 403)
