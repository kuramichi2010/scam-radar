/**
 * Fully client-side data hook — no backend/server required.
 * All simulation runs in the browser / Capacitor WebView.
 */
import { useEffect } from "react";
import { useStore } from "../store/scamStore";
import {
  getTodaysTotals, getHeatmapData, getScamTypes,
  getTrendData, getRiskForCountry, getFeed, getClusters,
  getLiveIncrement,
} from "../utils/simulation";

function detectCountry(): string {
  const lang = navigator.language || "en-US";
  const map: Record<string, string> = {
    ja: "JP", ko: "KR", zh: "CN", de: "DE", fr: "FR", es: "ES",
    pt: "BR", ru: "RU", it: "IT", nl: "NL", sv: "SE", tr: "TR",
    th: "TH", vi: "VN", id: "ID", ms: "MY", ar: "EG", hi: "IN",
  };
  const prefix = lang.split("-")[0].toLowerCase();
  const region = lang.split("-")[1]?.toUpperCase();
  if (region && Object.values(map).includes(region)) return region;
  return map[prefix] ?? "US";
}

export function useScamData() {
  const {
    setStats, incrementStats, setHeatmap, setScamTypes,
    setTrend, setRisk, setFeed, setClusters, setConnected,
  } = useStore();

  useEffect(() => {
    // ── Load initial data (synchronous simulation) ────────────────
    setStats(getTodaysTotals());
    setHeatmap(getHeatmapData());
    setScamTypes(getScamTypes());
    setTrend(getTrendData());
    setFeed(getFeed(12));
    setClusters(getClusters());
    setRisk(getRiskForCountry(detectCountry()));
    setConnected(true);

    // ── Live counter — tick every second ──────────────────────────
    const ticker = setInterval(() => {
      const inc = getLiveIncrement();
      incrementStats({
        total:        inc.total,
        sms:          inc.sms,
        phishing_url: inc.phishing_url,
        fake_calls:   inc.fake_calls,
      });
      // Refresh today's totals every minute to keep per_second_rate accurate
      if (new Date().getSeconds() === 0) {
        setStats(getTodaysTotals());
      }
    }, 1000);

    // ── Refresh feed every 30s ────────────────────────────────────
    const feedInterval = setInterval(() => {
      setFeed(getFeed(12));
    }, 30_000);

    return () => {
      clearInterval(ticker);
      clearInterval(feedInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
