export const TYPE_KEYS = ["banking", "crypto", "delivery", "phone", "tech_support"] as const;
export type ScamTypeKey = (typeof TYPE_KEYS)[number];

export interface MonthlyRecord {
  label: string;
  year: number;
  month: number;
  total: number;
  banking: number;
  crypto: number;
  delivery: number;
  phone: number;
  tech_support: number;
  other: number;
}

export interface TypeStat {
  type: ScamTypeKey;
  label: string;
  color: string;
  yoy: number;
  avgMon: number;
  share: number;
  trend: "up" | "down" | "stable";
}

export const TYPE_META: Record<ScamTypeKey, { label: string; labelJa: string; color: string }> = {
  banking:      { label: "Banking / Phishing",  labelJa: "銀行フィッシング",   color: "#00d4ff" },
  crypto:       { label: "Crypto / Investment", labelJa: "暗号資産詐欺",       color: "#ff2244" },
  delivery:     { label: "Delivery / SMS",      labelJa: "宅配SMS詐欺",        color: "#ffaa00" },
  phone:        { label: "Phone / Vishing",     labelJa: "電話詐欺",           color: "#00ff6e" },
  tech_support: { label: "Tech Support",        labelJa: "サポート詐欺",       color: "#ff6b35" },
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
// Seasonality index per calendar month
const SEASONAL = [1.05,0.90,0.86,0.88,0.93,0.89,0.84,0.86,0.91,0.98,1.20,1.28];

function seededRand(key: string) {
  let s = key.split("").reduce((a, c) => a + c.charCodeAt(0), 42) % 2_147_483_647;
  if (s <= 0) s += 2_147_483_646;
  return () => {
    s = (s * 16_807) % 2_147_483_647;
    return (s - 1) / 2_147_483_646;
  };
}

/** Deterministic 24-month history (Jan 2024 – Dec 2025) */
export function generateHistory(seedKey: string, baseIntensity: number): MonthlyRecord[] {
  const rand = seededRand(seedKey);
  const base = Math.max(400, Math.round(baseIntensity * 130_000));

  return Array.from({ length: 24 }, (_, i) => {
    const year  = i < 12 ? 2024 : 2025;
    const month = i % 12;
    const growth = 1 + i * 0.0095;
    const noise  = 0.78 + rand() * 0.44;
    const total  = Math.round(base * SEASONAL[month] * noise * growth);

    const banking      = Math.round(total * (0.30 + rand() * 0.10));
    const crypto       = Math.round(total * (0.16 + rand() * 0.09));
    const delivery     = Math.round(total * (0.17 + rand() * 0.07));
    const phone        = Math.round(total * (0.13 + rand() * 0.07));
    const tech_support = Math.round(total * (0.08 + rand() * 0.05));
    const other = Math.max(0, total - banking - crypto - delivery - phone - tech_support);

    return {
      label: `${MONTHS[month]} '${year - 2000}`,
      year, month, total,
      banking, crypto, delivery, phone, tech_support, other,
    };
  });
}

export function calcYoY(history: MonthlyRecord[]): number {
  if (history.length < 24) return 0;
  const prev = history.slice(0, 12).reduce((s, d) => s + d.total, 0);
  const curr = history.slice(12).reduce((s, d) => s + d.total, 0);
  return prev ? Math.round(((curr - prev) / prev) * 100) : 0;
}

export function peakMonth(history: MonthlyRecord[]): MonthlyRecord {
  return history.reduce((m, d) => d.total > m.total ? d : m, history[0]);
}

export function topGrowingType(history: MonthlyRecord[]): { type: ScamTypeKey; pct: number } {
  if (history.length < 24) return { type: "crypto", pct: 0 };
  let best: ScamTypeKey = "crypto";
  let bestPct = -Infinity;
  for (const t of TYPE_KEYS) {
    const prev = history.slice(0, 12).reduce((s, d) => s + d[t], 0);
    const curr = history.slice(12).reduce((s, d) => s + d[t], 0);
    const pct  = prev ? Math.round(((curr - prev) / prev) * 100) : 0;
    if (pct > bestPct) { bestPct = pct; best = t; }
  }
  return { type: best, pct: bestPct };
}

export function typeStats(history: MonthlyRecord[]): TypeStat[] {
  const curr12 = history.slice(12);
  const totalCurr = curr12.reduce((s, d) => s + d.total, 1);
  return TYPE_KEYS.map(t => {
    const prev = history.slice(0, 12).reduce((s, d) => s + d[t], 0);
    const curr = curr12.reduce((s, d) => s + d[t], 0);
    const yoy  = prev ? Math.round(((curr - prev) / prev) * 100) : 0;
    return {
      type: t,
      label: TYPE_META[t].label,
      color: TYPE_META[t].color,
      yoy,
      avgMon: Math.round(curr / 12),
      share:  Math.round((curr / totalCurr) * 100),
      trend:  yoy > 5 ? "up" : yoy < -5 ? "down" : "stable",
    };
  });
}
