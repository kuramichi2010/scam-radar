import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useStore } from "../store/scamStore";
import clsx from "clsx";

const TREND_ICONS = {
  up:     <TrendingUp size={12} className="text-red-400" />,
  down:   <TrendingDown size={12} className="text-green-400" />,
  stable: <Minus size={12} className="text-slate-400" />,
};

export default function ScamTypeChart() {
  const { t, i18n } = useTranslation();
  const { scamTypes, trend, language } = useStore();
  const isJa = language === "ja";

  if (!scamTypes.length) return null;

  const pieData = scamTypes.map((s) => ({
    name: isJa ? s.label_ja : s.label,
    value: s.count,
    color: s.color,
  }));

  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const barData = scamTypes[0]?.weekly_data.map((_, i) => {
    const obj: Record<string, any> = { day: days[i] ?? `D${i+1}` };
    scamTypes.forEach((s) => { obj[s.id] = s.weekly_data[i]; });
    return obj;
  }) ?? [];

  // 30-day trend chart
  const trendData = trend.slice(-14).map((p) => ({
    date: p.date.slice(5),
    total: p.total,
  }));

  return (
    <div className="space-y-6">
      {/* Pie + legend */}
      <div>
        <h2 className="text-white font-bold text-lg mb-4">{t("charts.breakdown")}</h2>
        <div className="grid md:grid-cols-2 gap-4 items-center">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                paddingAngle={3} dataKey="value" stroke="none">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => v.toLocaleString()}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-2">
            {scamTypes.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-slate-300 text-sm flex-1 truncate">{isJa ? s.label_ja : s.label}</span>
                <span className="text-slate-400 text-xs font-mono">{s.percentage}%</span>
                {TREND_ICONS[s.trend as keyof typeof TREND_ICONS]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stacked bar */}
      <div>
        <h3 className="text-slate-300 font-semibold text-sm mb-3">{t("charts.weekly")}</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }}
              formatter={(v: number) => v.toLocaleString()}
            />
            {scamTypes.map((s) => (
              <Bar key={s.id} dataKey={s.id} stackId="a" fill={s.color} radius={[0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 30-day trend line */}
      <div>
        <h3 className="text-slate-300 font-semibold text-sm mb-3">{t("charts.trend")}</h3>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false}
              interval={2} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }}
              formatter={(v: number) => v.toLocaleString()}
            />
            <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={2}
              dot={false} activeDot={{ r: 4, fill: "#ef4444" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
