import os


class Settings:
    @property
    def ENTSOE_SECURITY_TOKEN(self):
        return os.getenv("ENTSOE_SECURITY_TOKEN")

    @property
    def WATTTIME_USERNAME(self):
        return os.getenv("WATTTIME_USERNAME")

    @property
    def WATTTIME_PASSWORD(self):
        return os.getenv("WATTTIME_PASSWORD")


settings = Settings()
