import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Shield, Newspaper, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { useStore } from "../store/scamStore";
import { useTranslation } from "react-i18next";
import { generateHistory, calcYoY, peakMonth, topGrowingType, typeStats, TYPE_META } from "../utils/historyUtils";

const COUNTRY_LINKS: Record<string, { agency: string; agencyUrl: string; newsUrl: string; newsName: string }> = {
  US: { agency: "CISA",              agencyUrl: "https://www.cisa.gov/",                         newsUrl: "https://www.bleepingcomputer.com/tag/united-states/", newsName: "BleepingComputer" },
  JP: { agency: "NPA Cyber",         agencyUrl: "https://www.npa.go.jp/cyber/",                  newsUrl: "https://www.ipa.go.jp/security/",                     newsName: "IPA Japan" },
  GB: { agency: "NCSC UK",           agencyUrl: "https://www.ncsc.gov.uk/",                      newsUrl: "https://www.actionfraud.police.uk/news",              newsName: "Action Fraud" },
  AU: { agency: "ACSC",              agencyUrl: "https://www.cyber.gov.au/",                     newsUrl: "https://www.scamwatch.gov.au/news",                   newsName: "Scamwatch AU" },
  DE: { agency: "BSI",               agencyUrl: "https://www.bsi.bund.de/EN/",                   newsUrl: "https://www.bsi.bund.de/EN/Topics/Consumer/consumer_node.html", newsName: "BSI Consumer" },
  FR: { agency: "Cybermalveillance", agencyUrl: "https://www.cybermalveillance.gouv.fr/",        newsUrl: "https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites", newsName: "Cybermal. News" },
  CA: { agency: "CCCS",              agencyUrl: "https://www.cyber.gc.ca/en/",                   newsUrl: "https://www.antifraudcentre-centreantifraude.ca/",    newsName: "Anti-Fraud Centre" },
  KR: { agency: "KrCERT",            agencyUrl: "https://www.krcert.or.kr/",                     newsUrl: "https://www.krcert.or.kr/eng/main.do",                newsName: "KrCERT/CC" },
  SG: { agency: "CSA Singapore",     agencyUrl: "https://www.csa.gov.sg/",                       newsUrl: "https://www.scamalert.sg/",                           newsName: "ScamAlert SG" },
  IN: { agency: "CERT-In",           agencyUrl: "https://www.cert-in.org.in/",                   newsUrl: "https://www.cybercrime.gov.in/",                      newsName: "Cybercrime.gov.in" },
  CN: { agency: "CNCERT",            agencyUrl: "https://www.cert.org.cn/",                      newsUrl: "https://www.bleepingcomputer.com/tag/china/",         newsName: "BleepingComputer" },
  RU: { agency: "NCSC Threat Intel", agencyUrl: "https://www.ncsc.gov.uk/collection/russia",     newsUrl: "https://www.bleepingcomputer.com/tag/russia/",        newsName: "BleepingComputer" },
  BR: { agency: "CERT.br",           agencyUrl: "https://www.cert.br/",                          newsUrl: "https://www.cert.br/docs/whitepapers/",               newsName: "CERT.br Docs" },
  NG: { agency: "EFCC",              agencyUrl: "https://www.efcc.gov.ng/",                      newsUrl: "https://www.bleepingcomputer.com/search/?q=nigeria+scam", newsName: "BleepingComputer" },
  NL: { agency: "NCSC-NL",           agencyUrl: "https://www.ncsc.nl/english",                   newsUrl: "https://www.ncsc.nl/english",                         newsName: "NCSC-NL" },
  DEFAULT: { agency: "APWG",         agencyUrl: "https://apwg.org/trendsreports/",               newsUrl: "https://www.bleepingcomputer.com/news/security/",     newsName: "BleepingComputer" },
};

const LEVEL_STYLE: Record<string, { color: string }> = {
  LOW:      { color: "var(--sf-green)" },
  MEDIUM:   { color: "#ffd860" },
  HIGH:     { color: "var(--sf-amber)" },
  CRITICAL: { color: "var(--sf-red)" },
};

const TOOLTIP_STYLE = {
  contentStyle: { background: "#000f1e", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 0, fontSize: 10, fontFamily: "JetBrains Mono, monospace" },
  itemStyle: { color: "#c8e8f0" },
  labelStyle: { color: "rgba(0,212,255,0.5)" },
};

const TREND_ICON = {
  up:     <TrendingUp  size={10} style={{ color: "var(--sf-red)" }} />,
  down:   <TrendingDown size={10} style={{ color: "var(--sf-green)" }} />,
  stable: <Minus size={10} style={{ color: "rgba(0,212,255,0.5)" }} />,
};

export default function CountryDrawer() {
  const { selectedCountry, setSelectedCountry } = useStore();
  const { i18n } = useTranslation();
  const isJa = i18n.language === "ja";

  const history = useMemo(
    () => selectedCountry
      ? generateHistory(selectedCountry.country_code, selectedCountry.intensity)
      : [],
    [selectedCountry?.country_code, selectedCountry?.intensity],
  );

  const yoy        = useMemo(() => calcYoY(history),         [history]);
  const peak       = useMemo(() => history.length ? peakMonth(history) : null,  [history]);
  const topGrowing = useMemo(() => topGrowingType(history),  [history]);
  const tStats     = useMemo(() => typeStats(history),       [history]);

  // Last 6 months for mini chart
  const miniData = history.slice(18);

  const links = selectedCountry
    ? COUNTRY_LINKS[selectedCountry.country_code] ?? COUNTRY_LINKS.DEFAULT
    : null;
  const lvl = selectedCountry
    ? LEVEL_STYLE[selectedCountry.risk_level] ?? LEVEL_STYLE.MEDIUM
    : null;

  return (
    <AnimatePresence>
      {selectedCountry && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[190] bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedCountry(null)}
          />

          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.26 }}
            className="sf-drawer flex flex-col"
          >
            <div className="sf-scan-line" />

            {/* Header */}
            <div className="sf-panel-header px-5 py-4 flex-shrink-0">
              <div className="sf-dot" />
              <span className="sf-label flex-1">
                {isJa ? "国家脅威インテル" : "COUNTRY THREAT INTEL"}
              </span>
              <button onClick={() => setSelectedCountry(null)} className="sf-btn p-1.5">
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 relative z-10">

              {/* Country + risk badge */}
              <div>
                <p className="sf-label text-[9px] mb-1">TARGET NATION</p>
                <p className="text-2xl font-bold sf-cyan tracking-wider">
                  {selectedCountry.country_name.toUpperCase()}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(0,212,255,0.4)" }}>
                  {selectedCountry.country_code} · {selectedCountry.lat.toFixed(1)}, {selectedCountry.lng.toFixed(1)}
                </p>
              </div>

              {/* Risk level */}
              <div className="sf-panel p-4">
                <p className="sf-label text-[9px] mb-2">THREAT LEVEL</p>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-black tracking-widest"
                    style={{ color: lvl!.color, textShadow: `0 0 18px ${lvl!.color}` }}>
                    {selectedCountry.risk_level}
                  </span>
                  <div className="flex flex-col text-right ml-auto">
                    <span className="text-[9px] sf-label">YoY CHANGE</span>
                    <span className="text-sm font-bold"
                      style={{ color: yoy >= 0 ? "var(--sf-red)" : "var(--sf-green)" }}>
                      {yoy >= 0 ? "▲" : "▼"} {Math.abs(yoy)}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-black/60 overflow-hidden border border-sf-border/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(selectedCountry.intensity * 100)}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="h-full"
                    style={{ background: lvl!.color, boxShadow: `0 0 8px ${lvl!.color}` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[9px]" style={{ color: "rgba(0,212,255,0.35)" }}>
                  <span>0</span>
                  <span style={{ color: lvl!.color }}>{Math.round(selectedCountry.intensity * 100)} / 100</span>
                  <span>100</span>
                </div>
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "DAILY EST.", value: selectedCountry.scam_count.toLocaleString(), color: "var(--sf-amber)" },
                  { label: "PEAK MONTH", value: peak?.label ?? "—", color: "var(--sf-cyan)" },
                  { label: "TOP GROWING", value: TYPE_META[topGrowing.type]?.label.split(" ")[0] ?? "—", color: "var(--sf-red)" },
                ].map(stat => (
                  <div key={stat.label} className="sf-panel p-2.5">
                    <p className="sf-label text-[8px] mb-1">{stat.label}</p>
                    <p className="text-xs font-bold leading-tight" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* 6-month mini trend chart */}
              <div className="sf-panel p-3">
                <p className="sf-label text-[9px] mb-2">6-MONTH TREND</p>
                {miniData.length > 0 && (
                  <ResponsiveContainer width="100%" height={100}>
                    <AreaChart data={miniData} margin={{ top: 4, right: 0, left: -30, bottom: 0 }}>
                      <defs>
                        <linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="var(--sf-cyan)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--sf-cyan)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" tick={{ fill: "rgba(0,212,255,0.4)", fontSize: 8, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "rgba(0,212,255,0.3)", fontSize: 8, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => v.toLocaleString()} {...TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="total" stroke="var(--sf-cyan)" strokeWidth={1.5}
                        fill="url(#miniGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Scam type breakdown */}
              <div className="sf-panel p-3 space-y-2">
                <p className="sf-label text-[9px] mb-2">THREAT TYPE BREAKDOWN</p>
                {tStats.map(st => (
                  <div key={st.type} className="space-y-0.5">
                    <div className="flex items-center gap-1.5 justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: st.color }} />
                        <span className="text-[10px]" style={{ color: "#c8e8f0" }}>
                          {isJa ? TYPE_META[st.type].labelJa : st.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {TREND_ICON[st.trend]}
                        <span className="text-[9px] font-bold"
                          style={{ color: st.yoy >= 0 ? "var(--sf-red)" : "var(--sf-green)" }}>
                          {st.yoy >= 0 ? "+" : ""}{st.yoy}%
                        </span>
                        <span className="sf-label text-[9px]">{st.share}%</span>
                      </div>
                    </div>
                    <div className="h-1 bg-black/50 overflow-hidden">
                      <div className="h-full transition-all" style={{ width: `${st.share}%`, background: st.color, boxShadow: `0 0 6px ${st.color}60` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* External links */}
              <div className="space-y-2">
                <p className="sf-label text-[9px]">EXTERNAL INTEL SOURCES</p>
                {[
                  { icon: <Shield size={12} />, label: isJa ? "公式セキュリティ機関" : "OFFICIAL SECURITY AGENCY", href: links!.agencyUrl, sub: links!.agency },
                  { icon: <Newspaper size={12} />, label: isJa ? "最新脅威ニュース" : "LATEST THREAT NEWS", href: links!.newsUrl, sub: links!.newsName },
                  { icon: <AlertTriangle size={12} />, label: isJa ? "詐欺事例を検索" : "SEARCH SCAM INCIDENTS", href: `https://www.bleepingcomputer.com/search/?q=${encodeURIComponent(selectedCountry.country_name + " scam fraud 2025")}`, sub: "BleepingComputer" },
                  { icon: <ExternalLink size={12} />, label: isJa ? "APWGフィッシングレポート" : "APWG PHISHING REPORT", href: "https://apwg.org/trendsreports/", sub: "APWG" },
                ].map(item => (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between w-full sf-btn py-2.5 px-3 group">
                    <div className="flex items-center gap-2">{item.icon}<span className="text-[10px]">{item.label}</span></div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] opacity-40">{item.sub}</span>
                      <ExternalLink size={10} className="opacity-30 group-hover:opacity-80 transition-opacity" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
