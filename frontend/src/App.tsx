import { useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ShieldAlert, Radio } from "lucide-react";

import LiveCounter from "./components/LiveCounter";
import WorldHeatMap from "./components/WorldHeatMap";
import ScamTypeChart from "./components/ScamTypeChart";
import RiskPanel from "./components/RiskPanel";
import AwarenessFeed from "./components/AwarenessFeed";
import ClusterPanel from "./components/ClusterPanel";
import ShareModal from "./components/ShareModal";
import LanguageToggle from "./components/LanguageToggle";
import { useScamData } from "./hooks/useScamData";
import { useStore } from "./store/scamStore";

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-900/80 border border-slate-800 rounded-3xl p-5 md:p-6 ${className}`}>
      {children}
    </div>
  );
}

export default function App() {
  const { t } = useTranslation();
  useScamData();
  const { showShareModal } = useStore();

  return (
    <div className="min-h-full bg-[#020617]">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-orange-900/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <ShieldAlert size={24} className="text-red-500" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full" />
            </div>
            <div>
              <span className="text-white font-black text-lg tracking-tight">{t("appName")}</span>
              <span className="hidden sm:inline text-slate-500 text-xs ml-2">{t("tagline")}</span>
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-red-400 animate-pulse" />
            <span className="text-red-400 text-xs font-semibold hidden sm:block">LIVE</span>
          </div>
          <LanguageToggle />
        </div>
      </header>

      {/* Disclaimer */}
      <div className="bg-slate-800/40 border-b border-slate-800/60 px-4 py-2 text-center">
        <p className="text-xs text-slate-500">{t("disclaimer")}</p>
      </div>

      {/* Main layout */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6">

        {/* Top row: Counter + Risk */}
        <div className="grid md:grid-cols-2 gap-6">
          <Section delay={0.05}>
            <Card><LiveCounter /></Card>
          </Section>
          <Section delay={0.1}>
            <Card><RiskPanel /></Card>
          </Section>
        </div>

        {/* Heatmap full-width */}
        <Section delay={0.15}>
          <Card><WorldHeatMap /></Card>
        </Section>

        {/* Charts + Feed */}
        <div className="grid lg:grid-cols-5 gap-6">
          <Section delay={0.2} >
            <Card className="lg:col-span-3">
              <ScamTypeChart />
            </Card>
          </Section>
          <Section delay={0.25}>
            <Card className="lg:col-span-2">
              <AwarenessFeed />
            </Card>
          </Section>
        </div>

        {/* Clusters */}
        <Section delay={0.3}>
          <Card><ClusterPanel /></Card>
        </Section>

        {/* Footer */}
        <footer className="text-center py-4 space-y-1">
          <p className="text-xs text-slate-600">
            Data sources: Simulated estimates based on APWG, FBI IC3, NPA Japan public reports.
            No personal data collected. Country/region level only.
          </p>
          <p className="text-xs text-slate-700">
            ScamRadar — Public Awareness Tool · For educational & defensive use only
          </p>
        </footer>
      </main>

      {showShareModal && <ShareModal />}
    </div>
  );
}
