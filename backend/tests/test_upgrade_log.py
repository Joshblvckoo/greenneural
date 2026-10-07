import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.api.v1 import upgrade_log
from app.main import app


class UpgradeLogTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="member-access-token",
        )
        self.user = {
            "id": "user-123",
            "app_metadata": {"role": "admin"},
        }

    @staticmethod
    def _mock_client(response):
        client = MagicMock()
        client.request = AsyncMock(return_value=response)
        context = MagicMock()
        context.__aenter__ = AsyncMock(return_value=client)
        context.__aexit__ = AsyncMock(return_value=None)
        return client, context

    async def test_members_read_log_and_admin_flag_comes_from_app_metadata(self):
        entries = [{"id": "entry-1", "entry": "Added live feed diagnostics"}]
        response = MagicMock(status_code=200)
        response.json.return_value = entries
        client, context = self._mock_client(response)
        environment = {
            "SUPABASE_URL": "https://example.supabase.co",
            "SUPABASE_ANON_KEY": "anon-key",
        }

        with (
            patch.dict("os.environ", environment),
            patch.object(upgrade_log.httpx, "AsyncClient", return_value=context),
        ):
            result = await upgrade_log.get_upgrade_log(
                credentials=self.credentials,
                user=self.user,
            )

        self.assertEqual(result, {"entries": entries, "is_admin": True})
        request = client.request.await_args
        self.assertEqual(request.args[0], "GET")
        self.assertEqual(
            request.kwargs["headers"]["Authorization"],
            "Bearer member-access-token",
        )
        self.assertEqual(request.kwargs["params"]["limit"], "100")

    async def test_only_admin_can_publish_entries(self):
        with self.assertRaises(HTTPException) as raised:
            await upgrade_log.add_upgrade_entry(
                upgrade_log.UpgradeEntryRequest(entry="New improvement"),
                credentials=self.credentials,
                user={"id": "user-123", "app_metadata": {}},
            )

        self.assertEqual(raised.exception.status_code, 403)

    async def test_admin_publish_associates_entry_with_verified_user(self):
        created_entry = {
            "id": "entry-2",
            "entry": "Shipped member-only updates",
        }
        response = MagicMock(status_code=201)
        response.json.return_value = [created_entry]
        client, context = self._mock_client(response)
        environment = {
            "SUPABASE_URL": "https://example.supabase.co",
            "SUPABASE_ANON_KEY": "anon-key",
        }

        with (
            patch.dict("os.environ", environment),
            patch.object(upgrade_log.httpx, "AsyncClient", return_value=context),
        ):
            result = await upgrade_log.add_upgrade_entry(
                upgrade_log.UpgradeEntryRequest(entry="  Shipped member-only updates  "),
                credentials=self.credentials,
                user=self.user,
            )

        self.assertEqual(result, {"entry": created_entry})
        self.assertEqual(
            client.request.await_args.kwargs["json"],
            {
                "entry": "Shipped member-only updates",
                "created_by": "user-123",
            },
        )

    def test_member_routes_are_registered(self):
        paths = app.openapi()["paths"]
        self.assertIn("/api/v1/upgrade-log", paths)
        self.assertIn("get", paths["/api/v1/upgrade-log"])
        self.assertIn("post", paths["/api/v1/upgrade-log"])
