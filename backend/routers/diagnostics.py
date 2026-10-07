from fastapi import APIRouter
from app.utils.provider_health import provider_health

router = APIRouter(prefix="/diagnostics", tags=["diagnostics"])

@router.get("")
async def diagnostics():
    # assemble signals per provider from your cache/store
    # example:
    providers = {
        "aws": [...],   # list of region signal dicts
        "azure": [...],
        "gcp": [...],
    }

    health = {name: provider_health(name, signals) for name, signals in providers.items()}

    return {
        "providers": health,
        "missing_configuration": [],  # fill from env checks
    }
