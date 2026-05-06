from fastapi import APIRouter, Request, Query
from app.services import simulation
from app.utils.rate_limiter import limiter

router = APIRouter()


@router.get("/feed")
@limiter.limit("30/minute")
async def get_feed(request: Request, limit: int = Query(10, ge=1, le=20)):
    return simulation.get_feed(limit)


@router.get("/scam-types")
@limiter.limit("30/minute")
async def get_scam_types(request: Request):
    return simulation.get_scam_types()
