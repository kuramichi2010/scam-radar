import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, BarChart2, Globe2, Calendar } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, ReferenceLine,
} from "recharts";
import { useStore } from "../store/scamStore";
import {
  generateHistory, calcYoY, peakMonth, topGrowingType,
  typeStats, TYPE_META, TYPE_KEYS, type MonthlyRecord,
} from "../utils/historyUtils";

const TOOLTIP_STYLE = {
  contentStyle: { background: "#000f1e", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 0, fontSize: 10, fontFamily: "JetBrains Mono, monospace" },
  itemStyle:    { color: "#c8e8f0" },
  labelStyle:   { color: "rgba(0,212,255,0.5)" },
};

function TrendBadge({ yoy }: { yoy: number }) {
  const color = yoy > 5 ? "var(--sf-red)" : yoy < -5 ? "var(--sf-green)" : "rgba(0,212,255,0.6)";
  const Icon  = yoy > 5 ? TrendingUp : yoy < -5 ? TrendingDown : Minus;
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color }}>
      <Icon size={10} />
      {yoy >= 0 ? "+" : ""}{yoy}%
    </span>
  );
}

function MetricCard({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="sf-panel p-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span style={{ color }}>{icon}</span>
        <span className="sf-label text-[9px]">{label}</span>
      </div>
      <p className="text-xl font-black tracking-wide" style={{ color, textShadow: `0 0 12px ${color}60` }}>{value}</p>
      {sub && <p className="text-[10px]" style={{ color: "rgba(0,212,255,0.45)" }}>{sub}</p>}
    </div>
  );
}

export default function TrendAnalysisPanel() {
  const { t } = useTranslation();
  const { heatmap, language } = useStore();
  const isJa = language === "ja";

  const [mode,       setMode]       = useState<"global" | "country">("global");
  const [selCode,    setSelCode]    = useState("US");
  const [timeRange,  setTimeRange]  = useState<12 | 24>(24);
  const [chartType,  setChartType]  = useState<"area" | "bar" | "line">("area");

  // Global: average over all heatmap points
  const globalIntensity = useMemo(
    () => heatmap.length ? heatmap.reduce((s, p) => s + p.intensity, 0) / heatmap.length : 0.5,
    [heatmap],
  );

  const selectedPoint = useMemo(
    () => heatmap.find(p => p.country_code === selCode),
    [heatmap, selCode],
  );

  const seedKey   = mode === "global" ? "GLOBAL_AVG" : selCode;
  const intensity = mode === "global" ? globalIntensity : (selectedPoint?.intensity ?? 0.5);

  const history    = useMemo(() => generateHistory(seedKey, intensity), [seedKey, intensity]);
  const chartData  = timeRange === 12 ? history.slice(12) : history;
  const yoy        = useMemo(() => calcYoY(history), [history]);
  const peak       = useMemo(() => peakMonth(history), [history]);
  const topGrowing = useMemo(() => topGrowingType(history), [history]);
  const tStats     = useMemo(() => typeStats(history), [history]);
  const total2025  = useMemo(
    () => history.slice(12).reduce((s, d) => s + d.total, 0),
    [history],
  );

  // Country comparison data (top 8 by scam_count)
  const countryComparison = useMemo(() => {
    const top8 = [...heatmap].sort((a, b) => b.scam_count - a.scam_count).slice(0, 8);
    return top8.map(p => ({
      name: p.country_code,
      daily: p.scam_count,
      intensity: Math.round(p.intensity * 100),
    }));
  }, [heatmap]);

  // Radar data for current country/global threat profile
  const radarData = useMemo(() => {
    const last6 = history.slice(18);
    const totals = TYPE_KEYS.reduce((acc, t) => ({ ...acc, [t]: last6.reduce((s, d) => s + d[t], 0) }), {} as Record<string, number>);
    const max = Math.max(...Object.values(totals));
    return TYPE_KEYS.map(t => ({
      type: isJa ? TYPE_META[t].labelJa : t.charAt(0).toUpperCase() + t.slice(1).replace("_", " "),
      value: max ? Math.round((totals[t as keyof typeof totals] / max) * 100) : 0,
    }));
  }, [history, isJa]);

  // Month-over-month delta for the last 12 months
  const momData = useMemo(() =>
    history.slice(12).map((d, i, arr) => {
      const prev = i > 0 ? arr[i - 1].total : d.total;
      return { label: d.label, delta: Math.round(((d.total - prev) / Math.max(prev, 1)) * 100) };
    }), [history]);

  const renderMainChart = (data: MonthlyRecord[]) => {
    if (chartType === "bar") {
      return (
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,212,255,0.06)" />
          <XAxis dataKey="label" tick={{ fill: "rgba(0,212,255,0.4)", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} interval={timeRange === 24 ? 3 : 1} />
          <YAxis tick={{ fill: "rgba(0,212,255,0.4)", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
          <Tooltip formatter={(v: number) => v.toLocaleString()} {...TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 9, fontFamily: "JetBrains Mono", color: "rgba(0,212,255,0.5)" }} />
          {TYPE_KEYS.map(t => (
            <Bar key={t} dataKey={t} stackId="a" fill={TYPE_META[t].color} fillOpacity={0.8} />
          ))}
        </BarChart>
      );
    }
    if (chartType === "line") {
      return (
        <LineChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,212,255,0.06)" />
          <XAxis dataKey="label" tick={{ fill: "rgba(0,212,255,0.4)", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} interval={timeRange === 24 ? 3 : 1} />
          <YAxis tick={{ fill: "rgba(0,212,255,0.4)", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
          <Tooltip formatter={(v: number) => v.toLocaleString()} {...TOOLTIP_STYLE} />
          <ReferenceLine y={data.reduce((s, d) => s + d.total, 0) / Math.max(data.length, 1)}
            stroke="rgba(0,212,255,0.2)" strokeDasharray="4 4"
            label={{ value: "AVG", fill: "rgba(0,212,255,0.4)", fontSize: 8 }} />
          <Line type="monotone" dataKey="total" stroke="var(--sf-red)" strokeWidth={2}
            dot={false} activeDot={{ r: 3, fill: "var(--sf-red)", strokeWidth: 0 }}
            style={{ filter: "drop-shadow(0 0 4px var(--sf-red))" }} />
        </LineChart>
      );
    }
    // Default: stacked area
    return (
      <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <defs>
          {TYPE_KEYS.map(t => (
            <linearGradient key={t} id={`grad-${t}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={TYPE_META[t].color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={TYPE_META[t].color} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,212,255,0.06)" />
        <XAxis dataKey="label" tick={{ fill: "rgba(0,212,255,0.4)", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} interval={timeRange === 24 ? 3 : 1} />
        <YAxis tick={{ fill: "rgba(0,212,255,0.4)", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
        <Tooltip formatter={(v: number) => v.toLocaleString()} {...TOOLTIP_STYLE} />
        <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 9, fontFamily: "JetBrains Mono", color: "rgba(0,212,255,0.5)", paddingTop: 8 }} />
        {TYPE_KEYS.map(t => (
          <Area key={t} type="monotone" dataKey={t} stackId="1"
            stroke={TYPE_META[t].color} strokeWidth={1}
            fill={`url(#grad-${t})`}
            dot={false} activeDot={{ r: 2, fill: TYPE_META[t].color, strokeWidth: 0 }} />
        ))}
      </AreaChart>
    );
  };

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div>
        <p className="sf-label text-[9px] mb-1">PATTERN ANALYSIS ENGINE · HISTORICAL INTELLIGENCE</p>
        <h2 className="text-base font-bold sf-cyan">
          {isJa ? "詐欺トレンド歴史分析" : "SCAM TREND HISTORICAL ANALYSIS"}
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "rgba(0,212,255,0.4)" }}>
          {isJa
            ? "2024–2025年の詐欺活動パターンを分析 · 教育目的シミュレーションデータ"
            : "Analysing scam activity patterns 2024–2025 · Simulated data for educational purposes"}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Global / Country */}
        <div className="flex" style={{ border: "1px solid rgba(0,212,255,0.2)" }}>
          {([["global", <Globe2 size={9} />, isJa ? "グローバル" : "GLOBAL"] as const,
             ["country", <BarChart2 size={9} />, isJa ? "国別" : "COUNTRY"] as const,
          ] as [string, React.ReactNode, string][]).map(([m, icon, lbl]) => (
            <button key={m} onClick={() => setMode(m as "global" | "country")}
              className="px-3 py-1.5 text-[9px] font-bold flex items-center gap-1 tracking-widest transition-all"
              style={mode === m
                ? { background: "var(--sf-cyan)", color: "#000810" }
                : { background: "transparent", color: "rgba(0,212,255,0.4)" }}
            >{icon} {lbl}</button>
          ))}
        </div>

        {/* Country selector */}
        {mode === "country" && heatmap.length > 0 && (
          <select
            value={selCode}
            onChange={e => setSelCode(e.target.value)}
            className="text-[9px] font-bold tracking-wider px-2 py-1.5 font-mono"
            style={{ background: "rgba(0,12,24,0.9)", border: "1px solid rgba(0,212,255,0.2)", color: "var(--sf-cyan)", outline: "none" }}
          >
            {[...heatmap].sort((a, b) => a.country_name.localeCompare(b.country_name)).map(p => (
              <option key={p.country_code} value={p.country_code}>{p.country_code}: {p.country_name}</option>
            ))}
          </select>
        )}

        <div className="flex-1" />

        {/* Time range */}
        <div className="flex" style={{ border: "1px solid rgba(0,212,255,0.2)" }}>
          {([12, 24] as const).map(n => (
            <button key={n} onClick={() => setTimeRange(n)}
              className="px-3 py-1.5 text-[9px] font-bold tracking-widest flex items-center gap-1 transition-all"
              style={timeRange === n
                ? { background: "var(--sf-cyan)", color: "#000810" }
                : { background: "transparent", color: "rgba(0,212,255,0.4)" }}
            ><Calendar size={9} />{n}M</button>
          ))}
        </div>

        {/* Chart type */}
        <div className="flex" style={{ border: "1px solid rgba(0,212,255,0.2)" }}>
          {(["area", "bar", "line"] as const).map(ct => (
            <button key={ct} onClick={() => setChartType(ct)}
              className="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all"
              style={chartType === ct
                ? { background: "rgba(0,212,255,0.15)", color: "var(--sf-cyan)" }
                : { background: "transparent", color: "rgba(0,212,255,0.35)" }}
            >{ct}</button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="YoY CHANGE" value={`${yoy >= 0 ? "+" : ""}${yoy}%`}
          sub={yoy >= 0 ? "vs prior year ▲" : "vs prior year ▼"}
          color={yoy >= 0 ? "var(--sf-red)" : "var(--sf-green)"}
          icon={yoy >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} />
        <MetricCard label="PEAK MONTH" value={peak.label}
          sub={`${peak.total.toLocaleString()} attempts`}
          color="var(--sf-amber)"
          icon={<AlertTriangle size={12} />} />
        <MetricCard label="TOP GROWING"
          value={isJa ? TYPE_META[topGrowing.type].labelJa.split("詐")[0] : TYPE_META[topGrowing.type].label.split(" ")[0]}
          sub={`+${topGrowing.pct}% YoY`}
          color="var(--sf-red)"
          icon={<TrendingUp size={12} />} />
        <MetricCard label="TOTAL 2025"
          value={`${(total2025 / 1_000_000).toFixed(1)}M`}
          sub="estimated attempts"
          color="var(--sf-cyan)"
          icon={<BarChart2 size={12} />} />
      </div>

      {/* Main chart */}
      <div className="sf-panel p-4">
        <p className="sf-label text-[9px] mb-3">
          {timeRange}M THREAT TIMELINE ·
          {mode === "global" ? " GLOBAL AGGREGATE" : ` ${selectedPoint?.country_name.toUpperCase() ?? selCode}`}
        </p>
        <ResponsiveContainer width="100%" height={280}>
          {renderMainChart(chartData) as React.ReactElement}
        </ResponsiveContainer>
      </div>

      {/* Secondary charts row */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Month-over-month delta */}
        <div className="sf-panel p-4">
          <p className="sf-label text-[9px] mb-3">MONTH-OVER-MONTH CHANGE (%) · 2025</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={momData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,212,255,0.06)" />
              <XAxis dataKey="label" tick={{ fill: "rgba(0,212,255,0.4)", fontSize: 8, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} interval={1} />
              <YAxis tick={{ fill: "rgba(0,212,255,0.4)", fontSize: 8, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: number) => `${v}%`} {...TOOLTIP_STYLE} />
              <ReferenceLine y={0} stroke="rgba(0,212,255,0.2)" />
              <Bar dataKey="delta" radius={[2, 2, 0, 0]} fill="var(--sf-cyan)" isAnimationActive={true} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Threat type radar */}
        <div className="sf-panel p-4">
          <p className="sf-label text-[9px] mb-3">THREAT PROFILE RADAR · LAST 6 MONTHS</p>
          <ResponsiveContainer width="100%" height={160}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(0,212,255,0.12)" />
              <PolarAngleAxis dataKey="type" tick={{ fill: "rgba(0,212,255,0.5)", fontSize: 8, fontFamily: "JetBrains Mono" }} />
              <Radar dataKey="value" stroke="var(--sf-cyan)" fill="var(--sf-cyan)" fillOpacity={0.2} strokeWidth={1.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top countries comparison */}
      {countryComparison.length > 0 && (
        <div className="sf-panel p-4">
          <p className="sf-label text-[9px] mb-3">TOP-8 COUNTRIES BY DAILY SCAM VOLUME</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={countryComparison} layout="vertical"
              margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,212,255,0.06)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "rgba(0,212,255,0.4)", fontSize: 8, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fill: "rgba(0,212,255,0.6)", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip formatter={(v: number) => [`${v.toLocaleString()} /day`, "Daily Volume"]} {...TOOLTIP_STYLE} />
              <Bar dataKey="daily" fill="var(--sf-red)" fillOpacity={0.75} radius={[0, 2, 2, 0]}
                style={{ filter: "drop-shadow(0 0 4px rgba(255,34,68,0.4))" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Threat type analysis table */}
      <div className="sf-panel p-4">
        <p className="sf-label text-[9px] mb-3">THREAT TYPE ANALYSIS · YoY COMPARISON</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,212,255,0.1)" }}>
                {["TYPE", "TREND", "YoY ΔCHANGE", "AVG/MONTH", "SHARE", "ACTIVITY"].map(h => (
                  <th key={h} className="text-left pb-2 pr-4 sf-label text-[8px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tStats.map((st, i) => (
                <tr key={st.type} style={{ borderBottom: "1px solid rgba(0,212,255,0.05)" }}>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: st.color, boxShadow: `0 0 5px ${st.color}` }} />
                      <span style={{ color: "#c8e8f0" }}>{isJa ? TYPE_META[st.type].labelJa : st.label}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-4">
                    {st.trend === "up"
                      ? <span style={{ color: "var(--sf-red)" }}><TrendingUp size={10} style={{ display: "inline" }} /> UP</span>
                      : st.trend === "down"
                        ? <span style={{ color: "var(--sf-green)" }}><TrendingDown size={10} style={{ display: "inline" }} /> DOWN</span>
                        : <span style={{ color: "rgba(0,212,255,0.5)" }}><Minus size={10} style={{ display: "inline" }} /> STABLE</span>}
                  </td>
                  <td className="py-2 pr-4"><TrendBadge yoy={st.yoy} /></td>
                  <td className="py-2 pr-4" style={{ color: "var(--sf-amber)" }}>
                    {st.avgMon.toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-black/60 overflow-hidden">
                        <div className="h-full" style={{ width: `${st.share}%`, background: st.color }} />
                      </div>
                      <span style={{ color: st.color }}>{st.share}%</span>
                    </div>
                  </td>
                  <td className="py-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 12 }, (_, j) => {
                        const val = history[12 + j]?.[st.type as keyof MonthlyRecord] as number ?? 0;
                        const max = Math.max(...history.slice(12).map(d => d[st.type as keyof MonthlyRecord] as number));
                        const h   = max ? Math.max(1, Math.round((val / max) * 12)) : 1;
                        return (
                          <div key={j} className="w-1 flex items-end" style={{ height: "12px" }}>
                            <div style={{ width: "4px", height: `${h}px`, background: st.color, opacity: 0.7 }} />
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          {
            icon: <AlertTriangle size={11} />,
            color: "var(--sf-red)",
            title: isJa ? "最大脅威タイプ" : "DOMINANT THREAT",
            body: isJa
              ? `${TYPE_META[tStats.sort((a,b)=>b.share-a.share)[0]?.type ?? "banking"].labelJa}が全詐欺の${tStats.sort((a,b)=>b.share-a.share)[0]?.share ?? 0}%を占める`
              : `${tStats.sort((a,b)=>b.share-a.share)[0]?.label ?? "Banking"} accounts for ${tStats.sort((a,b)=>b.share-a.share)[0]?.share ?? 0}% of all incidents`,
          },
          {
            icon: <TrendingUp size={11} />,
            color: "var(--sf-amber)",
            title: isJa ? "急成長脅威" : "FASTEST GROWING",
            body: isJa
              ? `${TYPE_META[topGrowing.type].labelJa}が前年比+${topGrowing.pct}%の急増。特に11〜12月に集中`
              : `${TYPE_META[topGrowing.type].label} surged +${topGrowing.pct}% YoY, concentrated in Q4`,
          },
          {
            icon: <Calendar size={11} />,
            color: "var(--sf-cyan)",
            title: isJa ? "季節性ピーク" : "SEASONAL PATTERN",
            body: isJa
              ? `11月〜12月にかけてホリデーシーズン詐欺が急増。ピーク月は${peak.label}`
              : `Holiday season drives +25–30% surge. Peak recorded in ${peak.label}`,
          },
        ].map(ins => (
          <div key={ins.title} className="sf-panel p-4 space-y-2">
            <div className="flex items-center gap-2" style={{ color: ins.color }}>
              {ins.icon}
              <span className="sf-label text-[9px]">{ins.title}</span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: "rgba(180,210,225,0.7)" }}>{ins.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
