from fastapi import APIRouter, Request
from app.services import simulation
from app.utils.rate_limiter import limiter

router = APIRouter()


@router.get("/risk/{country_code}")
@limiter.limit("30/minute")
async def get_risk(request: Request, country_code: str):
    return simulation.get_risk_for_country(country_code)


@router.get("/risk")
@limiter.limit("30/minute")
async def get_risk_default(request: Request):
    # Default to global average
    return simulation.get_risk_for_country("US")
