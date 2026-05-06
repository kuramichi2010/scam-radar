import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { AlertTriangle, AlertCircle, Info, Zap } from "lucide-react";
import { useStore } from "../store/scamStore";
import clsx from "clsx";

const SEVERITY_CONFIG = {
  low:      { icon: <Info size={13} />,          bg: "bg-blue-900/30",    border: "border-blue-800/50",    text: "text-blue-400" },
  medium:   { icon: <AlertCircle size={13} />,   bg: "bg-yellow-900/30",  border: "border-yellow-800/50",  text: "text-yellow-400" },
  high:     { icon: <AlertTriangle size={13} />, bg: "bg-orange-900/30",  border: "border-orange-800/50",  text: "text-orange-400" },
  critical: { icon: <Zap size={13} />,           bg: "bg-red-900/30",     border: "border-red-800/50",     text: "text-red-400" },
};

const TYPE_EMOJI: Record<string, string> = {
  banking: "🏦", crypto: "₿", delivery: "📦", phone: "📞", tech_support: "💻", other: "⚠️",
};

function timeAgo(ts: string, lang: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return lang === "ja" ? "たった今" : "Just now";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return lang === "ja" ? `${m}分前` : `${m}m ago`;
  }
  const h = Math.floor(diff / 3600);
  return lang === "ja" ? `${h}時間前` : `${h}h ago`;
}

export default function AwarenessFeed() {
  const { t } = useTranslation();
  const { feed, language } = useStore();
  const isJa = language === "ja";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">{t("feed.title")}</h2>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-green-400 text-xs font-semibold">LIVE</span>
        </div>
      </div>

      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {feed.map((item) => {
            const cfg = SEVERITY_CONFIG[item.severity] ?? SEVERITY_CONFIG.medium;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={clsx(
                  "border rounded-xl p-3.5 space-y-1.5",
                  cfg.bg, cfg.border
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="flex-shrink-0">{TYPE_EMOJI[item.scam_type] ?? "⚠️"}</span>
                    <span className="text-sm font-semibold text-white truncate">
                      {isJa ? item.title_ja : item.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={clsx("flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full", cfg.text, cfg.bg)}>
                      {cfg.icon}
                      {t(`feed.severity.${item.severity}` as any)}
                    </span>
                  </div>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {isJa ? item.description_ja : item.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  {item.region && <span>📍 {item.region}</span>}
                  <span className="ml-auto">{timeAgo(item.timestamp, language)}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
