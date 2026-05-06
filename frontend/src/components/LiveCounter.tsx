import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Wifi, WifiOff } from "lucide-react";
import { useStore } from "../store/scamStore";

// Digit roller — flips up on change
function Digit({ val }: { val: string }) {
  const [key, setKey] = useState(0);
  const prev = useRef(val);
  useEffect(() => {
    if (val !== prev.current) { prev.current = val; setKey(k => k + 1); }
  }, [val]);
  if (val === ",") return <span className="text-sf-border/60 mx-0.5">,</span>;
  return (
    <span className="inline-block overflow-hidden" style={{ width: "0.62em" }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={key}
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: 0,       opacity: 1 }}
          exit={{    y: "100%",  opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="block"
        >
          {val}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function RollingNumber({ value, className = "" }: { value: number; className?: string }) {
  const str = value.toLocaleString();
  return (
    <span className={`inline-flex ${className}`}>
      {str.split("").map((ch, i) => <Digit key={i} val={ch} />)}
    </span>
  );
}

function MiniStat({
  label, value, color, prefix = ""
}: { label: string; value: number; color: string; prefix?: string }) {
  return (
    <div className="sf-panel p-3 flex flex-col gap-1">
      <p className="sf-label text-[9px]">{label}</p>
      <p className="text-base font-bold tabular-nums" style={{ color }}>
        {prefix}<RollingNumber value={value} />
      </p>
    </div>
  );
}

export default function LiveCounter() {
  const { t } = useTranslation();
  const { stats, isConnected } = useStore();

  if (!stats) return (
    <div className="flex items-center justify-center h-44 gap-3">
      <div className="w-5 h-5 border border-sf-cyan/50 border-t-sf-cyan rounded-full animate-spin" />
      <span className="sf-label animate-pulse">INITIALIZING…</span>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full animate-sf-flicker"
            style={{ background: "var(--sf-red)", boxShadow: "0 0 8px var(--sf-red)" }}
          />
          <span className="sf-label">{t("counter.live")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isConnected
            ? <><Wifi size={11} style={{ color: "var(--sf-green)" }} /><span className="text-xs sf-green">CONNECTED</span></>
            : <><WifiOff size={11} className="text-gray-600" /><span className="text-xs text-gray-600">RECONNECTING</span></>
          }
        </div>
      </div>

      {/* Main counter */}
      <div className="space-y-1">
        <p className="sf-label text-[9px]">{t("counter.title")}</p>
        <div
          className="text-5xl md:text-6xl font-black sf-number"
          style={{ color: "var(--sf-cyan)", textShadow: "0 0 30px rgba(0,212,255,0.5)" }}
        >
          <RollingNumber value={stats.total_today} />
        </div>
        <p className="text-xs" style={{ color: "rgba(0,212,255,0.4)" }}>{t("counter.subtitle")}</p>
      </div>

      {/* Rate bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="sf-label text-[9px]">CURRENT RATE</span>
          <span className="text-xs font-bold sf-amber">
            {stats.per_second_rate} <span className="sf-label">{t("counter.rate")}</span>
          </span>
        </div>
        <div className="h-1.5 bg-black/60 border border-sf-border/20 overflow-hidden">
          <motion.div
            animate={{ width: `${Math.min(stats.per_second_rate * 10, 100)}%` }}
            transition={{ duration: 0.5 }}
            className="h-full"
            style={{ background: "var(--sf-amber)", boxShadow: "0 0 8px var(--sf-amber)" }}
          />
        </div>
      </div>

      {/* Sub-counters */}
      <div className="grid grid-cols-3 gap-2">
        <MiniStat label={t("counter.sms")}      value={stats.sms_scams}     color="var(--sf-amber)" />
        <MiniStat label={t("counter.phishing")} value={stats.phishing_urls} color="var(--sf-red)"   />
        <MiniStat label={t("counter.calls")}    value={stats.fake_calls}    color="var(--sf-purple)"/>
      </div>
    </div>
  );
}
