import os


class Settings:
    ENTSOE_API_KEY = os.getenv("ENTSOE_API_KEY")
    WATTTIME_USERNAME = os.getenv("WATTTIME_USERNAME")
    WATTTIME_PASSWORD = os.getenv("WATTTIME_PASSWORD")


settings = Settings()
