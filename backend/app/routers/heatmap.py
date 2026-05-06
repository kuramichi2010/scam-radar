from fastapi import APIRouter, Request
from app.services import simulation
from app.utils.rate_limiter import limiter

router = APIRouter()


@router.get("/heatmap")
@limiter.limit("30/minute")
async def get_heatmap(request: Request):
    return simulation.get_heatmap_data()


@router.get("/clusters")
@limiter.limit("30/minute")
async def get_clusters(request: Request):
    return simulation.get_clusters()


@router.get("/timeline")
@limiter.limit("10/minute")
async def get_timeline(request: Request):
    return simulation.get_timeline_frames()
