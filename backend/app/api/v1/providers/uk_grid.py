import httpx

async def get_uk_intensity():
    url = "https://api.carbonintensity.org.uk/intensity"
    async with httpx.AsyncClient() as client:
        r = await client.get(url)
        data = r.json()
        return data["data"][0]["intensity"]["actual"]
