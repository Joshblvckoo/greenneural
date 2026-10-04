from fastapi import APIRouter
from app.api.v1.coverage import COVERAGE

router = APIRouter(prefix="/home")


@router.get("/")
async def home_summary():
    return {
        "hero": {
            "title": "GreenNeural — Sustainable Tech Intelligence for the Modern Cloud",
            "subtitle": "Real-time carbon insights across AWS, Azure, and GCP.",
            "metrics": {
                "regions": COVERAGE["regions_supported"],
                "countries": COVERAGE["countries"],
                "cities": COVERAGE["cities"],
            },
        },
        "coverage": {
            "providers": COVERAGE["providers"],
            "real_time_grids": COVERAGE["real_time_grids"],
            "expanding_grids": COVERAGE["expanding_grids"],
            "data_sources": COVERAGE["data_sources"],
        },
        "coming_soon": [
            "Real-time Asia grid coverage",
            "Africa regional carbon signals",
            "Global cleanest-region leaderboard",
            "Carbon-aware routing for Kubernetes",
            "Historical carbon trends",
        ],
    }
