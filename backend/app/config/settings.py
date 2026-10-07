import os


class Settings:
    @property
    def ENTSOE_SECURITY_TOKEN(self):
        return os.getenv("ENTSOE_SECURITY_TOKEN")

    @property
    def ELECTRICITYMAPS_API_TOKEN(self):
        return os.getenv("ELECTRICITYMAPS_API_TOKEN")

    @property
    def ELECTRICITYMAPS_BASE_URL(self):
        return os.getenv(
            "ELECTRICITYMAPS_BASE_URL",
            "https://api.electricitymap.org/v3",
        )

    @property
    def WATTTIME_USERNAME(self):
        return os.getenv("WATTTIME_USERNAME")

    @property
    def WATTTIME_PASSWORD(self):
        return os.getenv("WATTTIME_PASSWORD")


settings = Settings()
