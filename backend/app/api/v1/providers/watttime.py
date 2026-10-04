import httpx
import os

async def get_watttime_intensity(region):
    username = os.getenv("WATTTIME_USERNAME")
    password = os.getenv("WATTTIME_PASSWORD")

    async with httpx.AsyncClient() as client:
        token = await client.get(
            "https://api.watttime.org/v2/login",
            auth=(username, password)
        )
        headers = {"Authorization": f"Bearer {token.json()['token']}"}

        r = await client.get(
            "https://api.watttime.org/v2/index",
            params={"ba": "NYIS"},  # fallback BA
            headers=headers
        )
        return r.json()["marginal"]
