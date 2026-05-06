import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Activity, MessageSquare, Link, Phone, Wifi, WifiOff } from "lucide-react";
import { useStore } from "../store/scamStore";

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const [key, setKey] = useState(0);
  const prev = useRef(value);

  useEffect(() => {
    if (value !== prev.current) {
      prev.current = value;
      setDisplay(value);
      setKey((k) => k + 1);
    }
  }, [value]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={key}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="tabular-nums"
      >
        {display.toLocaleString()}
      </motion.span>
    </AnimatePresence>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-2xl p-4 flex flex-col gap-2"
    >
      <div className={`flex items-center gap-2 ${color}`}>
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white font-mono">
        <AnimatedNumber value={value} />
      </div>
    </motion.div>
  );
}

export default function LiveCounter() {
  const { t, i18n } = useTranslation();
  const { stats, isConnected } = useStore();
  const lang = i18n.language;

  if (!stats) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main counter */}
      <div className="relative bg-gradient-to-br from-red-950/60 to-slate-900/80 border border-red-800/50 rounded-3xl p-6 md:p-8 overflow-hidden">
        {/* Animated background pulse */}
        <div className="absolute inset-0 bg-red-500/5 animate-pulse-slow rounded-3xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <span className="text-red-400 text-xs font-bold uppercase tracking-widest">
                {t("counter.live")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              {isConnected ? (
                <><Wifi size={12} className="text-green-400" /><span className="text-green-400">Connected</span></>
              ) : (
                <><WifiOff size={12} /><span>Reconnecting…</span></>
              )}
            </div>
          </div>

          <div className="text-5xl md:text-7xl font-black text-white font-mono tracking-tight my-4">
            <AnimatedNumber value={stats.total_today} />
          </div>

          <p className="text-slate-400 text-sm md:text-base">{t("counter.title")}</p>
          <p className="text-slate-600 text-xs mt-1">{t("counter.subtitle")}</p>

          <div className="mt-4 flex items-center gap-2">
            <Activity size={14} className="text-orange-400" />
            <span className="text-orange-400 font-mono text-sm font-semibold">
              {stats.per_second_rate} {t("counter.rate")}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-counters */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<MessageSquare size={14} />}
          label={t("counter.sms")}
          value={stats.sms_scams}
          color="text-yellow-400"
        />
        <StatCard
          icon={<Link size={14} />}
          label={t("counter.phishing")}
          value={stats.phishing_urls}
          color="text-red-400"
        />
        <StatCard
          icon={<Phone size={14} />}
          label={t("counter.calls")}
          value={stats.fake_calls}
          color="text-purple-400"
        />
      </div>
    </div>
  );
}
