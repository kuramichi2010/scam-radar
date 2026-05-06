import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Radio, Globe, ExternalLink } from "lucide-react";

import LiveCounter    from "./components/LiveCounter";
import WorldHeatMap   from "./components/WorldHeatMap";
import ScamTypeChart  from "./components/ScamTypeChart";
import RiskPanel      from "./components/RiskPanel";
import AwarenessFeed  from "./components/AwarenessFeed";
import ClusterPanel   from "./components/ClusterPanel";
import ShareModal     from "./components/ShareModal";
import CountryDrawer  from "./components/CountryDrawer";
import LanguageToggle from "./components/LanguageToggle";
import { useScamData } from "./hooks/useScamData";
import { useStore }    from "./store/scamStore";

function SfPanel({
  children,
  title,
  titleJa,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  title: string;
  titleJa?: string;
  className?: string;
  delay?: number;
}) {
  const { i18n } = useTranslation();
  const label = i18n.language === "ja" && titleJa ? titleJa : title;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`sf-panel ${className}`}
    >
      <div className="sf-scan-line" />
      <div className="sf-panel-header">
        <div className="sf-dot" />
        <span className="sf-label">{label}</span>
      </div>
      <div className="relative z-10 p-4 md:p-5">{children}</div>
    </motion.div>
  );
}

export default function App() {
  const { t } = useTranslation();
  useScamData();
  const { showShareModal, stats } = useStore();

  return (
    <div className="min-h-screen sf-grid" style={{ background: "var(--sf-bg)" }}>
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,34,68,0.04) 0%, transparent 70%)" }} />
      </div>

      {/* ── Header ──────────────────────────────────── */}
      <header className="sticky top-0 z-40" style={{ background: "rgba(0,8,18,0.96)", borderBottom: "1px solid rgba(0,212,255,0.15)", backdropFilter: "blur(10px)" }}>
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 flex items-center justify-center"
              style={{ border: "1px solid rgba(0,212,255,0.5)", background: "rgba(0,212,255,0.08)" }}>
              <Globe size={14} style={{ color: "var(--sf-cyan)" }} />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-sf-flicker"
                style={{ background: "var(--sf-red)", boxShadow: "0 0 6px var(--sf-red)" }} />
            </div>
            <div>
              <span className="font-black tracking-[0.2em] text-base sf-cyan">SCAM</span>
              <span className="font-black tracking-[0.2em] text-base" style={{ color: "rgba(0,212,255,0.45)" }}>RADAR</span>
            </div>
          </div>

          {/* System status */}
          <div className="hidden md:flex items-center gap-4 ml-4">
            {[
              { label: "NODES", val: "30", color: "var(--sf-green)" },
              { label: "THREATS", val: stats ? String(stats.per_second_rate) + "/s", color: "var(--sf-red)" },
              { label: "STATUS", val: "ACTIVE", color: "var(--sf-cyan)" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className="sf-label text-[8px]">{item.label}:</span>
                <span className="text-[10px] font-bold" style={{ color: item.color }}>{item.val}</span>
              </div>
            ))}
          </div>

          <div className="flex-1" />

          {/* Live badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1"
            style={{ border: "1px solid rgba(255,34,68,0.3)", background: "rgba(255,34,68,0.05)" }}>
            <Radio size={11} style={{ color: "var(--sf-red)" }} className="animate-sf-pulse" />
            <span className="text-[9px] font-bold sf-red tracking-widest">LIVE</span>
          </div>

          <LanguageToggle />
        </div>

        {/* Disclaimer bar */}
        <div className="px-4 py-1.5 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(0,212,255,0.08)", background: "rgba(0,212,255,0.02)" }}>
          <p className="text-[9px] sf-label">{t("disclaimer")}</p>
          <a
            href="https://apwg.org/trendsreports/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 text-[9px] sf-label hover:sf-cyan transition-colors"
          >
            <ExternalLink size={8} /> APWG REPORT
          </a>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 py-5 space-y-4 relative">

        {/* Row 1: Counter + Risk */}
        <div className="grid md:grid-cols-2 gap-4">
          <SfPanel title="LIVE THREAT COUNTER" titleJa="ライブ脅威カウンター" delay={0.05}>
            <LiveCounter />
          </SfPanel>
          <SfPanel title="REGIONAL RISK ASSESSMENT" titleJa="地域リスク評価" delay={0.1}>
            <RiskPanel />
          </SfPanel>
        </div>

        {/* Row 2: Heatmap */}
        <SfPanel title="GLOBAL THREAT HEATMAP" titleJa="グローバル脅威ヒートマップ" delay={0.15}>
          <WorldHeatMap />
        </SfPanel>

        {/* Row 3: Charts + Feed */}
        <div className="grid lg:grid-cols-5 gap-4">
          <SfPanel title="THREAT CLASSIFICATION" titleJa="脅威分類" className="lg:col-span-3" delay={0.2}>
            <ScamTypeChart />
          </SfPanel>
          <SfPanel title="INTEL FEED" titleJa="インテルフィード" className="lg:col-span-2" delay={0.25}>
            <AwarenessFeed />
          </SfPanel>
        </div>

        {/* Row 4: Clusters */}
        <SfPanel title="SCAM CLUSTER DETECTION" titleJa="詐欺クラスター検出" delay={0.3}>
          <ClusterPanel />
        </SfPanel>

        {/* Footer */}
        <div className="py-4 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(0,212,255,0.1)" }}>
          <p className="text-[9px] sf-label">
            SCAMRADAR v1.0 · DATA: APWG · FBI IC3 · NPA JP · SIMULATED ESTIMATES
          </p>
          <p className="text-[9px] sf-label">FOR EDUCATIONAL &amp; DEFENSIVE USE ONLY</p>
        </div>
      </main>

      {showShareModal && <ShareModal />}
      <CountryDrawer />
    </div>
  );
}
