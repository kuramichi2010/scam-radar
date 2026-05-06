import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

from app.routers import stats, heatmap, feed, risk
from app.utils.rate_limiter import limiter

load_dotenv()

app = FastAPI(
    title="ScamRadar API",
    description="Public scam awareness intelligence platform. All data is aggregated and anonymized.",
    version="1.0.0",
    docs_url="/api/docs",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(stats.router, prefix="/api")
app.include_router(heatmap.router, prefix="/api")
app.include_router(feed.router, prefix="/api")
app.include_router(risk.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "ScamRadar"}
