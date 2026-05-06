export interface LiveStats {
  total_today: number;
  sms_scams: number;
  phishing_urls: number;
  fake_calls: number;
  per_second_rate: number;
  last_updated: string;
}

export interface CounterIncrement {
  total: number;
  sms: number;
  phishing_url: number;
  fake_calls: number;
  timestamp: string;
}

export interface HeatmapPoint {
  country_code: string;
  country_name: string;
  lat: number;
  lng: number;
  intensity: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  scam_count: number;
  top_type: string;
}

export interface ScamType {
  id: string;
  label: string;
  label_ja: string;
  count: number;
  percentage: number;
  trend: "up" | "down" | "stable";
  color: string;
  weekly_data: number[];
}

export interface TrendPoint {
  date: string;
  total: number;
  banking: number;
  delivery: number;
  crypto: number;
  phone: number;
}

export interface RiskAssessment {
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  score: number;
  region: string;
  country_code: string;
  top_threats: string[];
  top_threats_ja: string[];
  explanation: string;
  explanation_ja: string;
  trend: string;
}

export interface FeedItem {
  id: string;
  timestamp: string;
  title: string;
  title_ja: string;
  description: string;
  description_ja: string;
  scam_type: string;
  severity: "low" | "medium" | "high" | "critical";
  region: string | null;
  country_code: string | null;
  url: string | null;
}

export interface ScamCluster {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  severity: string;
  count: number;
  scam_type: string;
  detected_at: string;
  description: string;
}

export type Language = "en" | "ja";
