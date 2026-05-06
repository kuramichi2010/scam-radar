import { useEffect, useRef } from "react";
import { useStore } from "../store/scamStore";

const BASE = "/api";
const WS_URL = `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws/counter`;

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

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
  const { setStats, incrementStats, setHeatmap, setScamTypes, setTrend,
          setRisk, setFeed, setClusters, setConnected } = useStore();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initial data load
    Promise.all([
      apiFetch<any>("/stats/live").then(setStats).catch(() => {}),
      apiFetch<any[]>("/heatmap").then(setHeatmap).catch(() => {}),
      apiFetch<any[]>("/scam-types").then(setScamTypes).catch(() => {}),
      apiFetch<any[]>("/stats/trend").then(setTrend).catch(() => {}),
      apiFetch<any[]>("/feed?limit=12").then(setFeed).catch(() => {}),
      apiFetch<any[]>("/clusters").then(setClusters).catch(() => {}),
      apiFetch<any>(`/risk/${detectCountry()}`).then(setRisk).catch(() => {}),
    ]);

    // Refresh feed every 30s
    const feedInterval = setInterval(() => {
      apiFetch<any[]>("/feed?limit=12").then(setFeed).catch(() => {});
    }, 30_000);

    // WebSocket live counter
    function connectWS() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onmessage = (e) => {
        try { incrementStats(JSON.parse(e.data)); } catch {}
      };
      ws.onclose = () => {
        setConnected(false);
        setTimeout(connectWS, 3000);
      };
      ws.onerror = () => ws.close();
    }
    connectWS();

    return () => {
      clearInterval(feedInterval);
      wsRef.current?.close();
    };
  }, []);
}
