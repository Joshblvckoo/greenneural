import os


class Settings:
    @property
    def ENTSOE_API_KEY(self):
        return os.getenv("ENTSOE_API_KEY")

    @property
    def WATTTIME_USERNAME(self):
        return os.getenv("WATTTIME_USERNAME")

    @property
    def WATTTIME_PASSWORD(self):
        return os.getenv("WATTTIME_PASSWORD")


settings = Settings()
