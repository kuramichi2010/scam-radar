import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request
from app.services import simulation
from app.utils.rate_limiter import limiter

router = APIRouter()


@router.get("/stats/live")
@limiter.limit("60/minute")
async def get_live_stats(request: Request):
    return simulation.get_todays_totals()


@router.get("/stats/trend")
@limiter.limit("30/minute")
async def get_trend(request: Request):
    return simulation.get_trend_data()


@router.websocket("/ws/counter")
async def counter_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = simulation.get_live_increment()
            await websocket.send_json(data)
            await asyncio.sleep(1)
    except (WebSocketDisconnect, Exception):
        pass
