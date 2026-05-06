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

// Annual growth multipliers derived from FBI IC3 actual data:
// 2023: $12.5B  2024: $16.6B (+33%)  2025: ~$19.6B projected (+18%)
const YEAR_GROWTH: Record<number, number> = { 2024: 1.00, 2025: 1.33 };

// Crypto/investment share rose from 25% in 2023 → 30% in 2024 → 35% in 2025 (FBI IC3)
// Banking/phishing share fell slightly as protections improve
// Phone scams rising due to AI voice cloning (+700% deepfake fraud in 2025)
function typeWeightsForYear(year: number): Record<string, number> {
  if (year >= 2025) return { banking: 0.22, crypto: 0.33, delivery: 0.14, phone: 0.17, tech_support: 0.09 };
  return                { banking: 0.26, crypto: 0.28, delivery: 0.16, phone: 0.14, tech_support: 0.10 };
}

/** Deterministic 24-month history (Jan 2024 – Dec 2025), growth grounded in FBI IC3 / GASA data */
export function generateHistory(seedKey: string, baseIntensity: number): MonthlyRecord[] {
  const rand = seededRand(seedKey);
  const base = Math.max(400, Math.round(baseIntensity * 130_000));

  return Array.from({ length: 24 }, (_, i) => {
    const year  = i < 12 ? 2024 : 2025;
    const month = i % 12;
    const yearFactor = YEAR_GROWTH[year] ?? 1.0;
    // Within-year: linear ramp to reflect actual YoY trajectory
    const withinYear = year === 2024 ? (1 + (i / 12) * 0.18) : (1 + ((i - 12) / 12) * 0.15);
    const noise  = 0.82 + rand() * 0.36;
    const total  = Math.round(base * SEASONAL[month] * noise * yearFactor * withinYear);

    const w = typeWeightsForYear(year);
    const banking      = Math.round(total * (w.banking      + (rand() - 0.5) * 0.06));
    const crypto       = Math.round(total * (w.crypto       + (rand() - 0.5) * 0.08));
    const delivery     = Math.round(total * (w.delivery     + (rand() - 0.5) * 0.05));
    const phone        = Math.round(total * (w.phone        + (rand() - 0.5) * 0.05));
    const tech_support = Math.round(total * (w.tech_support + (rand() - 0.5) * 0.04));
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
