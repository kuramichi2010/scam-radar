import { useTranslation } from "react-i18next";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { useStore } from "../store/scamStore";

const TREND_LINKS: Record<string, string> = {
  banking:      "https://apwg.org/trendsreports/",
  crypto:       "https://consumer.ftc.gov/articles/what-know-about-cryptocurrency-and-scams",
  delivery:     "https://www.bleepingcomputer.com/search/?q=delivery+scam",
  phone:        "https://consumer.ftc.gov/articles/how-recognize-and-report-spam-text-messages",
  tech_support: "https://support.microsoft.com/en-us/windows/protect-yourself-from-tech-support-scams",
  other:        "https://www.bleepingcomputer.com/news/security/",
};

const TREND_ICON = {
  up:     <TrendingUp  size={10} style={{ color: "var(--sf-red)" }} />,
  down:   <TrendingDown size={10} style={{ color: "var(--sf-green)" }} />,
  stable: <Minus       size={10} style={{ color: "rgba(0,212,255,0.5)" }} />,
};

const TOOLTIP_STYLE = {
  contentStyle: { background: "#000f1e", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 0, fontSize: 11, fontFamily: "JetBrains Mono, monospace" },
  itemStyle: { color: "#c8e8f0" },
  labelStyle: { color: "rgba(0,212,255,0.6)" },
};

export default function ScamTypeChart() {
  const { t } = useTranslation();
  const { scamTypes, trend, language } = useStore();
  const isJa = language === "ja";

  if (!scamTypes.length) return null;

  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const barData = scamTypes[0]?.weekly_data.map((_, i) => {
    const obj: Record<string, any> = { day: days[i] ?? `D${i + 1}` };
    scamTypes.forEach(s => { obj[s.id] = s.weekly_data[i]; });
    return obj;
  }) ?? [];

  const trendData = trend.slice(-14).map(p => ({
    date: p.date.slice(5),
    total: p.total,
  }));

  const avg = trendData.length
    ? Math.round(trendData.reduce((s, p) => s + p.total, 0) / trendData.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Pie + legend */}
      <div>
        <p className="sf-label text-[9px] mb-2">THREAT CLASSIFICATION MATRIX</p>
        <div className="grid md:grid-cols-2 gap-4 items-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={scamTypes.map(s => ({ name: isJa ? s.label_ja : s.label, value: s.count, color: s.color }))}
                cx="50%" cy="50%" innerRadius={50} outerRadius={88}
                paddingAngle={2} dataKey="value" stroke="none">
                {scamTypes.map((s, i) => (
                  <Cell key={i} fill={s.color} style={{ filter: `drop-shadow(0 0 6px ${s.color}80)` }} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => v.toLocaleString()} {...TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-2">
            {scamTypes.map(s => (
              <a
                key={s.id}
                href={TREND_LINKS[s.id] ?? TREND_LINKS.other}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 group hover:bg-sf-cyan/5 px-1 py-0.5 transition-colors"
              >
                <span className="w-2 h-2 flex-shrink-0" style={{ backgroundColor: s.color, boxShadow: `0 0 5px ${s.color}` }} />
                <span className="text-[11px] flex-1 truncate" style={{ color: "#c8e8f0" }}>{isJa ? s.label_ja : s.label}</span>
                <span className="text-[10px] font-bold" style={{ color: s.color }}>{s.percentage}%</span>
                {TREND_ICON[s.trend as keyof typeof TREND_ICON]}
                <ExternalLink size={8} className="opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" style={{ color: "var(--sf-cyan)" }} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly bar */}
      <div>
        <p className="sf-label text-[9px] mb-2">{t("charts.weekly").toUpperCase()}</p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={barData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,212,255,0.06)" />
            <XAxis dataKey="day" tick={{ fill: "rgba(0,212,255,0.4)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(0,212,255,0.4)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => v.toLocaleString()} {...TOOLTIP_STYLE} />
            {scamTypes.map(s => (
              <Bar key={s.id} dataKey={s.id} stackId="a" fill={s.color} fillOpacity={0.85} radius={[0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 30-day trend */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="sf-label text-[9px]">{t("charts.trend").toUpperCase()}</p>
          <a
            href="https://apwg.org/trendsreports/"
            target="_blank"
            rel="noopener noreferrer"
            className="sf-btn text-[9px] py-0.5 px-2"
          >
            <ExternalLink size={8} />
            APWG DATA
          </a>
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={trendData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,212,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: "rgba(0,212,255,0.4)", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} interval={2} />
            <YAxis tick={{ fill: "rgba(0,212,255,0.4)", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => v.toLocaleString()} {...TOOLTIP_STYLE} />
            <ReferenceLine y={avg} stroke="rgba(0,212,255,0.2)" strokeDasharray="4 4"
              label={{ value: "AVG", fill: "rgba(0,212,255,0.4)", fontSize: 8, fontFamily: "JetBrains Mono" }} />
            <Line type="monotone" dataKey="total" stroke="var(--sf-red)" strokeWidth={1.5}
              dot={false} activeDot={{ r: 3, fill: "var(--sf-red)", strokeWidth: 0 }}
              style={{ filter: "drop-shadow(0 0 4px var(--sf-red))" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
