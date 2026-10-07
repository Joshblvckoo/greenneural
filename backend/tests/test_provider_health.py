import unittest

from backend.app.utils.provider_health import provider_health


class ProviderHealthTests(unittest.TestCase):
    def test_averages_intensity_and_index_separately(self):
        health = provider_health(
            "aws",
            [
                {"intensity": 100.123, "status": "live"},
                {"intensity_index": 40, "status": "live"},
                {
                    "intensity": 200,
                    "intensity_index": 60,
                    "status": "live",
                },
            ],
        )

        self.assertEqual(health["average_intensity"], 150.06)
        self.assertEqual(health["average_index"], 50.0)
        self.assertEqual(health["status"], "live")
        self.assertEqual(health["regions_available"], 3)
        self.assertEqual(health["regions_checked"], 3)

    def test_ignores_missing_and_invalid_measurements(self):
        health = provider_health(
            "gcp",
            [
                {"intensity": None, "intensity_index": None},
                {"intensity": "not-a-number", "intensity_index": float("nan")},
                {"intensity_index": 0},
            ],
        )

        self.assertIsNone(health["average_intensity"])
        self.assertEqual(health["average_index"], 0.0)
        self.assertEqual(health["status"], "partial")
        self.assertEqual(health["regions_available"], 1)
        self.assertEqual(health["regions_checked"], 3)

    def test_returns_unavailable_when_no_region_has_a_measurement(self):
        health = provider_health(
            "azure",
            [{"intensity": None}, {"intensity_index": None}],
        )

        self.assertEqual(
            health,
            {
                "average_intensity": None,
                "average_index": None,
                "status": "unavailable",
                "regions_available": 0,
                "regions_checked": 2,
            },
        )
