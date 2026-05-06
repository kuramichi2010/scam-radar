"""
Realistic scam statistics simulation.
All numbers are estimates based on publicly available cybersecurity reports
(APWG, FBI IC3, NPA Japan, Action Fraud UK).
~500,000 scam attempts/day globally across all channels.
"""
import random
import math
from datetime import datetime, timezone, timedelta
from typing import List

BASE_RATE_PER_SECOND = 5.8  # ~500k/day

SCAM_TYPES = [
    {
        "id": "banking",
        "label": "Banking / Financial Phishing",
        "label_ja": "銀行・金融フィッシング",
        "weight": 0.32,
        "color": "#ef4444",
        "trend": "up",
    },
    {
        "id": "crypto",
        "label": "Crypto / Investment Scams",
        "label_ja": "暗号通貨・投資詐欺",
        "weight": 0.25,
        "color": "#f97316",
        "trend": "up",
    },
    {
        "id": "delivery",
        "label": "Delivery / Shipping Scams",
        "label_ja": "配送・荷物詐欺",
        "weight": 0.18,
        "color": "#eab308",
        "trend": "stable",
    },
    {
        "id": "phone",
        "label": "Phone / Voice Scams",
        "label_ja": "電話・音声詐欺",
        "weight": 0.12,
        "color": "#a855f7",
        "trend": "stable",
    },
    {
        "id": "tech_support",
        "label": "Fake Tech Support",
        "label_ja": "偽テクニカルサポート",
        "weight": 0.08,
        "color": "#06b6d4",
        "trend": "down",
    },
    {
        "id": "other",
        "label": "Other Scams",
        "label_ja": "その他の詐欺",
        "weight": 0.05,
        "color": "#64748b",
        "trend": "stable",
    },
]

COUNTRY_DATA = {
    "US": {"name": "United States",      "lat": 37.1, "lng": -95.7,  "risk": 82, "scam_base": 0.28, "top": "banking"},
    "CN": {"name": "China",              "lat": 35.9, "lng": 104.2,  "risk": 74, "scam_base": 0.22, "top": "crypto"},
    "IN": {"name": "India",              "lat": 20.6, "lng": 79.0,   "risk": 70, "scam_base": 0.18, "top": "phone"},
    "GB": {"name": "United Kingdom",     "lat": 55.4, "lng": -3.4,   "risk": 71, "scam_base": 0.12, "top": "banking"},
    "JP": {"name": "Japan",              "lat": 36.2, "lng": 138.3,  "risk": 55, "scam_base": 0.08, "top": "delivery"},
    "AU": {"name": "Australia",          "lat": -25.3,"lng": 133.8,  "risk": 60, "scam_base": 0.06, "top": "crypto"},
    "DE": {"name": "Germany",            "lat": 51.2, "lng": 10.5,   "risk": 44, "scam_base": 0.05, "top": "banking"},
    "BR": {"name": "Brazil",             "lat": -14.2,"lng": -51.9,  "risk": 66, "scam_base": 0.10, "top": "banking"},
    "NG": {"name": "Nigeria",            "lat": 9.1,  "lng": 8.7,    "risk": 78, "scam_base": 0.09, "top": "other"},
    "RU": {"name": "Russia",             "lat": 61.5, "lng": 105.3,  "risk": 72, "scam_base": 0.11, "top": "crypto"},
    "KR": {"name": "South Korea",        "lat": 35.9, "lng": 127.8,  "risk": 52, "scam_base": 0.05, "top": "delivery"},
    "FR": {"name": "France",             "lat": 46.2, "lng": 2.2,    "risk": 48, "scam_base": 0.05, "top": "banking"},
    "CA": {"name": "Canada",             "lat": 56.1, "lng": -106.3, "risk": 56, "scam_base": 0.06, "top": "phone"},
    "IT": {"name": "Italy",              "lat": 41.9, "lng": 12.6,   "risk": 52, "scam_base": 0.05, "top": "banking"},
    "SG": {"name": "Singapore",          "lat": 1.4,  "lng": 103.8,  "risk": 62, "scam_base": 0.04, "top": "crypto"},
    "ZA": {"name": "South Africa",       "lat": -30.6,"lng": 22.9,   "risk": 68, "scam_base": 0.07, "top": "banking"},
    "MX": {"name": "Mexico",             "lat": 23.6, "lng": -102.6, "risk": 63, "scam_base": 0.08, "top": "phone"},
    "PH": {"name": "Philippines",        "lat": 12.9, "lng": 121.8,  "risk": 65, "scam_base": 0.06, "top": "banking"},
    "ID": {"name": "Indonesia",          "lat": -0.8, "lng": 113.9,  "risk": 60, "scam_base": 0.07, "top": "delivery"},
    "TH": {"name": "Thailand",           "lat": 15.9, "lng": 100.9,  "risk": 58, "scam_base": 0.05, "top": "crypto"},
    "ES": {"name": "Spain",              "lat": 40.5, "lng": -3.7,   "risk": 50, "scam_base": 0.04, "top": "banking"},
    "NL": {"name": "Netherlands",        "lat": 52.1, "lng": 5.3,    "risk": 46, "scam_base": 0.04, "top": "banking"},
    "SE": {"name": "Sweden",             "lat": 60.1, "lng": 18.6,   "risk": 40, "scam_base": 0.03, "top": "banking"},
    "UA": {"name": "Ukraine",            "lat": 48.4, "lng": 31.2,   "risk": 70, "scam_base": 0.08, "top": "crypto"},
    "PK": {"name": "Pakistan",           "lat": 30.4, "lng": 69.3,   "risk": 67, "scam_base": 0.06, "top": "phone"},
    "VN": {"name": "Vietnam",            "lat": 14.1, "lng": 108.3,  "risk": 62, "scam_base": 0.05, "top": "banking"},
    "MY": {"name": "Malaysia",           "lat": 4.2,  "lng": 108.0,  "risk": 60, "scam_base": 0.05, "top": "delivery"},
    "TR": {"name": "Turkey",             "lat": 38.9, "lng": 35.2,   "risk": 58, "scam_base": 0.05, "top": "crypto"},
    "AR": {"name": "Argentina",          "lat": -38.4,"lng": -63.6,  "risk": 60, "scam_base": 0.05, "top": "banking"},
    "EG": {"name": "Egypt",              "lat": 26.8, "lng": 30.8,   "risk": 64, "scam_base": 0.05, "top": "phone"},
}

FEED_TEMPLATES = [
    {
        "title": "Fake bank SMS campaign detected",
        "title_ja": "偽銀行SMSキャンペーンを検出",
        "desc": "Mass SMS campaign impersonating major banks urging users to verify accounts.",
        "desc_ja": "大手銀行を装った大量SMSキャンペーンが確認されました。アカウント確認を促す内容です。",
        "type": "banking", "severity": "high",
    },
    {
        "title": "Crypto investment scam surge",
        "title_ja": "暗号通貨投資詐欺が急増",
        "desc": "Social media ads promoting fake celebrity-endorsed crypto platforms.",
        "desc_ja": "有名人を装った偽の暗号通貨プラットフォームのSNS広告が急増しています。",
        "type": "crypto", "severity": "high",
    },
    {
        "title": "Delivery notification phishing wave",
        "title_ja": "配送通知フィッシング攻撃",
        "desc": "Phishing emails mimicking major couriers requesting customs fee payment.",
        "desc_ja": "大手配送業者を装い、関税支払いを求めるフィッシングメールが確認されました。",
        "type": "delivery", "severity": "medium",
    },
    {
        "title": "Tech support phone scam active",
        "title_ja": "偽テクニカルサポート電話詐欺",
        "desc": "Callers posing as Microsoft/Apple support demanding remote access.",
        "desc_ja": "Microsoft/Appleサポートを装い、リモートアクセスを要求する電話詐欺が活発です。",
        "type": "tech_support", "severity": "medium",
    },
    {
        "title": "Government impersonation scam",
        "title_ja": "政府機関なりすまし詐欺",
        "desc": "Fraudsters claiming unpaid taxes requiring immediate cryptocurrency payment.",
        "desc_ja": "未払い税金として暗号通貨での即時支払いを求める詐欺師の活動を確認。",
        "type": "phone", "severity": "high",
    },
    {
        "title": "Romance/pig-butchering scheme detected",
        "title_ja": "ロマンス詐欺（豚の屠殺）を検出",
        "desc": "Long-term investment confidence scams building fake relationships via social apps.",
        "desc_ja": "SNSで偽の関係を築き、投資詐欺に誘導する長期型詐欺が確認されました。",
        "type": "crypto", "severity": "critical",
    },
    {
        "title": "QR code phishing (quishing) surge",
        "title_ja": "QRコードフィッシング急増",
        "desc": "Malicious QR codes in physical mail and email directing to credential-harvesting sites.",
        "desc_ja": "郵便物やメールの悪意あるQRコードが認証情報窃取サイトに誘導しています。",
        "type": "banking", "severity": "high",
    },
    {
        "title": "Job offer scam targeting job seekers",
        "title_ja": "求職者をターゲットにした偽求人詐欺",
        "desc": "Fake high-paying remote job offers requiring upfront payment for 'equipment'.",
        "desc_ja": "「機器代」として前払いを要求する偽の高収入リモートワーク求人が拡散中。",
        "type": "other", "severity": "medium",
    },
]


def _time_multiplier() -> float:
    hour = datetime.now(timezone.utc).hour
    curve = math.sin((hour - 2) * math.pi / 12)
    return 0.7 + 0.6 * max(0, curve)


def get_live_increment() -> dict:
    m = _time_multiplier()
    base = BASE_RATE_PER_SECOND * m
    total = max(1, int(base + random.gauss(0, 1.2)))
    return {
        "total": total,
        "sms": max(0, int(total * 0.35 + random.gauss(0, 0.3))),
        "phishing_url": max(0, int(total * 0.40 + random.gauss(0, 0.3))),
        "fake_calls": max(0, int(total * 0.25 + random.gauss(0, 0.3))),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def get_todays_totals() -> dict:
    now = datetime.now(timezone.utc)
    seconds = now.hour * 3600 + now.minute * 60 + now.second
    total = int(BASE_RATE_PER_SECOND * seconds * 0.95 + random.randint(-500, 500))
    total = max(0, total)
    return {
        "total_today": total,
        "sms_scams": int(total * 0.35),
        "phishing_urls": int(total * 0.40),
        "fake_calls": int(total * 0.25),
        "per_second_rate": round(BASE_RATE_PER_SECOND * _time_multiplier(), 1),
        "last_updated": now.isoformat(),
    }


def get_heatmap_data() -> list:
    points = []
    for code, d in COUNTRY_DATA.items():
        noise = random.uniform(0.85, 1.15)
        count = int(BASE_RATE_PER_SECOND * 86400 * d["scam_base"] * noise)
        risk = d["risk"]
        level = "CRITICAL" if risk >= 75 else "HIGH" if risk >= 60 else "MEDIUM" if risk >= 45 else "LOW"
        points.append({
            "country_code": code,
            "country_name": d["name"],
            "lat": d["lat"],
            "lng": d["lng"],
            "intensity": round(d["risk"] / 100, 3),
            "risk_level": level,
            "scam_count": count,
            "top_type": d["top"],
        })
    return points


def get_scam_types() -> list:
    totals = get_todays_totals()
    base_total = totals["total_today"]
    weekly = _generate_weekly()
    result = []
    for t in SCAM_TYPES:
        count = int(base_total * t["weight"] * random.uniform(0.97, 1.03))
        weekly_slice = [int(d * t["weight"]) for d in weekly]
        result.append({
            "id": t["id"],
            "label": t["label"],
            "label_ja": t["label_ja"],
            "count": count,
            "percentage": round(t["weight"] * 100, 1),
            "trend": t["trend"],
            "color": t["color"],
            "weekly_data": weekly_slice,
        })
    return result


def _generate_weekly() -> list:
    today_total = get_todays_totals()["total_today"]
    base = 86400 * BASE_RATE_PER_SECOND * 0.95
    week = []
    for i in range(6, -1, -1):
        day_base = base * random.uniform(0.85, 1.15)
        if i == 0:
            day_base = today_total
        week.append(int(day_base))
    return week


def get_trend_data() -> list:
    points = []
    now = datetime.now(timezone.utc)
    base = 86400 * BASE_RATE_PER_SECOND * 0.95
    for i in range(29, -1, -1):
        dt = now - timedelta(days=i)
        trend_factor = 1.0 + (29 - i) * 0.004  # slight upward trend
        total = int(base * trend_factor * random.uniform(0.88, 1.12))
        points.append({
            "date": dt.strftime("%Y-%m-%d"),
            "total": total,
            "banking": int(total * 0.32),
            "delivery": int(total * 0.18),
            "crypto": int(total * 0.25),
            "phone": int(total * 0.12),
        })
    return points


def get_risk_for_country(country_code: str) -> dict:
    cc = country_code.upper()
    d = COUNTRY_DATA.get(cc, COUNTRY_DATA["US"])
    risk = d["risk"] + random.randint(-3, 3)
    risk = min(100, max(0, risk))
    level = "CRITICAL" if risk >= 75 else "HIGH" if risk >= 60 else "MEDIUM" if risk >= 45 else "LOW"

    threat_map = {
        "banking": ("Banking phishing is surging in this region", "この地域では銀行フィッシングが急増しています"),
        "crypto": ("Crypto investment scams are prevalent", "暗号通貨投資詐欺が多発しています"),
        "delivery": ("Fake delivery notifications are circulating", "偽の配送通知が拡散しています"),
        "phone": ("Phone scam calls are elevated", "電話詐欺が増加しています"),
        "tech_support": ("Tech support fraud calls are active", "偽テクニカルサポート詐欺が活発です"),
    }

    top = d["top"]
    threat_en, threat_ja = threat_map.get(top, ("General scam activity detected", "一般的な詐欺活動が検出されています"))

    explanations = {
        "CRITICAL": (
            f"Scam activity in {d['name']} is at a critical level. Exercise extreme caution.",
            f"{d['name']}での詐欺活動は危機的レベルです。十分な注意が必要です。",
        ),
        "HIGH": (
            f"High scam activity detected in {d['name']}. Stay alert.",
            f"{d['name']}で高レベルの詐欺活動が検出されています。警戒してください。",
        ),
        "MEDIUM": (
            f"Moderate scam activity in {d['name']}. Be cautious with unknown contacts.",
            f"{d['name']}では中程度の詐欺活動があります。不審な連絡に注意してください。",
        ),
        "LOW": (
            f"Low scam activity in {d['name']}. Stay informed about common scam patterns.",
            f"{d['name']}では詐欺活動は低レベルです。一般的な手口を把握しておきましょう。",
        ),
    }

    expl_en, expl_ja = explanations[level]
    trend_word = "rising" if risk >= 60 else "stable"

    return {
        "level": level,
        "score": risk,
        "region": d["name"],
        "country_code": cc,
        "top_threats": [threat_en, "Verify all unsolicited contacts", "Never share OTP codes"],
        "top_threats_ja": [threat_ja, "未確認の連絡は必ず確認する", "OTPコードを絶対に共有しない"],
        "explanation": expl_en,
        "explanation_ja": expl_ja,
        "trend": trend_word,
    }


def get_feed(limit: int = 10) -> list:
    items = []
    now = datetime.now(timezone.utc)
    shuffled = random.sample(FEED_TEMPLATES, min(limit, len(FEED_TEMPLATES)))
    countries = list(COUNTRY_DATA.keys())
    for i, t in enumerate(shuffled):
        minutes_ago = random.randint(2, 180)
        ts = (now - timedelta(minutes=minutes_ago)).isoformat()
        cc = random.choice(countries)
        items.append({
            "id": f"feed-{i}-{int(now.timestamp())}",
            "timestamp": ts,
            "title": t["title"],
            "title_ja": t["title_ja"],
            "description": t["desc"],
            "description_ja": t["desc_ja"],
            "scam_type": t["type"],
            "severity": t["severity"],
            "region": COUNTRY_DATA[cc]["name"],
            "country_code": cc,
            "url": None,
        })
    items.sort(key=lambda x: x["timestamp"], reverse=True)
    return items


def get_clusters() -> list:
    clusters = [
        {"id": "c1", "name": "North America Banking Cluster", "center_lat": 40.7, "center_lng": -74.0,
         "radius_km": 800, "severity": "critical", "count": 12400, "scam_type": "banking",
         "detected_at": (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat(),
         "description": "Coordinated bank impersonation campaign"},
        {"id": "c2", "name": "East Asia Crypto Cluster", "center_lat": 31.2, "center_lng": 121.5,
         "radius_km": 600, "severity": "high", "count": 8900, "scam_type": "crypto",
         "detected_at": (datetime.now(timezone.utc) - timedelta(hours=7)).isoformat(),
         "description": "Fake exchange platform phishing"},
        {"id": "c3", "name": "West Africa Advance Fee Cluster", "center_lat": 6.5, "center_lng": 3.4,
         "radius_km": 900, "severity": "high", "count": 6200, "scam_type": "other",
         "detected_at": (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat(),
         "description": "Business email compromise and advance fee fraud"},
        {"id": "c4", "name": "South Asia SMS Cluster", "center_lat": 19.1, "center_lng": 72.9,
         "radius_km": 700, "severity": "high", "count": 9800, "scam_type": "phone",
         "detected_at": (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat(),
         "description": "Mass SMS phishing targeting banking customers"},
        {"id": "c5", "name": "Europe Delivery Scam Cluster", "center_lat": 51.5, "center_lng": -0.1,
         "radius_km": 500, "severity": "medium", "count": 4100, "scam_type": "delivery",
         "detected_at": (datetime.now(timezone.utc) - timedelta(hours=9)).isoformat(),
         "description": "Fake parcel delivery notifications"},
    ]
    return clusters


def get_timeline_frames() -> list:
    frames = []
    now = datetime.now(timezone.utc)
    countries = list(COUNTRY_DATA.keys())
    for h in range(24):
        ts = now.replace(hour=h, minute=0, second=0, microsecond=0)
        m = 0.7 + 0.6 * max(0, math.sin((h - 2) * math.pi / 12))
        delta = {}
        for cc in countries:
            base_i = COUNTRY_DATA[cc]["risk"] / 100
            delta[cc] = round(base_i * m * random.uniform(0.8, 1.2), 3)
        event = None
        if h == 9:
            event = "Morning phishing campaign surge"
        elif h == 14:
            event = "Delivery scam peak (post-lunch)"
        elif h == 20:
            event = "Evening banking fraud spike"
        frames.append({
            "timestamp": ts.isoformat(),
            "label": f"{h:02d}:00 UTC",
            "heatmap_delta": delta,
            "event": event,
        })
    return frames
