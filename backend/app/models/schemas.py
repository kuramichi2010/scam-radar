from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class LiveStats(BaseModel):
    total_today: int
    sms_scams: int
    phishing_urls: int
    fake_calls: int
    per_second_rate: float
    last_updated: str


class CounterIncrement(BaseModel):
    total: int
    sms: int
    phishing_url: int
    fake_calls: int
    timestamp: str


class HeatmapPoint(BaseModel):
    country_code: str
    country_name: str
    lat: float
    lng: float
    intensity: float
    risk_level: str
    scam_count: int
    top_type: str


class ScamTypeBreakdown(BaseModel):
    id: str
    label: str
    label_ja: str
    count: int
    percentage: float
    trend: str
    color: str
    weekly_data: List[int]


class TrendPoint(BaseModel):
    date: str
    total: int
    banking: int
    delivery: int
    crypto: int
    phone: int


class RiskAssessment(BaseModel):
    level: str
    score: int
    region: str
    country_code: str
    top_threats: List[str]
    top_threats_ja: List[str]
    explanation: str
    explanation_ja: str
    trend: str


class FeedItem(BaseModel):
    id: str
    timestamp: str
    title: str
    title_ja: str
    description: str
    description_ja: str
    scam_type: str
    severity: str
    region: Optional[str]
    country_code: Optional[str]
    url: Optional[str]


class ScamCluster(BaseModel):
    id: str
    name: str
    center_lat: float
    center_lng: float
    radius_km: int
    severity: str
    count: int
    scam_type: str
    detected_at: str
    description: str


class TimelineFrame(BaseModel):
    timestamp: str
    label: str
    heatmap_delta: Dict[str, float]
    event: Optional[str]
