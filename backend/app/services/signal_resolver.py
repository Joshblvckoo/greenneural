from app.config.grid_resolver import resolve_entsoe, resolve_watttime

async def resolve_signal(provider: str, region: str, sources: dict) -> dict:
    # 1. WattTime (US)
    ba = resolve_watttime(provider, region)
    if ba:
        moer = await sources["wattime"].get_moer(ba)
        if moer is not None:
            return {"intensity_index": moer, "source": "WattTime", "status": "live"}

    # 2. ENTSO-E (EU)
    zone = resolve_entsoe(provider, region)
    if zone:
        ci = await sources["entsoe"].get_intensity(zone)
        if ci is not None:
            return {"intensity": ci, "source": "ENTSO-E", "status": "live"}

    # 3. UK CI (GB proxies)
    if region in ("eu-west-2", "uksouth", "ukwest", "europe-west2"):
        uk_ci = await sources["uk"].get_intensity()
        if uk_ci is not None:
            return {"intensity": uk_ci, "source": "UK Carbon Intensity API", "status": "live"}

    # 4. Unsupported
    return {"intensity": None, "source": None, "status": "unsupported"}
