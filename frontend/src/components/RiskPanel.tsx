import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ShieldAlert, TrendingUp, TrendingDown, Minus, Share2 } from "lucide-react";
import { useStore } from "../store/scamStore";
import clsx from "clsx";

const LEVEL_CONFIG = {
  LOW:      { bg: "from-green-950/60 to-slate-900/80", border: "border-green-700/50", bar: "bg-green-500", text: "text-green-400", ring: "ring-green-500/30" },
  MEDIUM:   { bg: "from-yellow-950/60 to-slate-900/80", border: "border-yellow-700/50", bar: "bg-yellow-500", text: "text-yellow-400", ring: "ring-yellow-500/30" },
  HIGH:     { bg: "from-orange-950/60 to-slate-900/80", border: "border-orange-700/50", bar: "bg-orange-500", text: "text-orange-400", ring: "ring-orange-500/30" },
  CRITICAL: { bg: "from-red-950/60 to-slate-900/80", border: "border-red-700/50", bar: "bg-red-500", text: "text-red-400", ring: "ring-red-500/30" },
};

export default function RiskPanel() {
  const { t, i18n } = useTranslation();
  const { risk, language, setShowShareModal } = useStore();

  if (!risk) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 text-slate-500 text-sm">
        {t("risk.detecting")}
      </div>
    );
  }

  const cfg = LEVEL_CONFIG[risk.level];
  const isJa = language === "ja";
  const levelLabel = t(`risk.levels.${risk.level}`);
  const threats = isJa ? risk.top_threats_ja : risk.top_threats;
  const explanation = isJa ? risk.explanation_ja : risk.explanation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "bg-gradient-to-br border rounded-3xl p-6 space-y-4",
        cfg.bg, cfg.border
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{t("risk.title")}</p>
          <p className="text-slate-500 text-xs">{risk.region}</p>
        </div>
        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Share2 size={12} />
          {t("risk.share")}
        </button>
      </div>

      {/* Score display */}
      <div className="flex items-center gap-4">
        <div className={clsx("text-6xl font-black font-mono", cfg.text)}>
          {risk.score}
        </div>
        <div className="flex-1">
          <div className={clsx(
            "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ring-2 mb-2",
            cfg.text, cfg.ring
          )}>
            <ShieldAlert size={14} />
            {levelLabel}
          </div>
          <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${risk.score}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={clsx("h-full rounded-full", cfg.bar)}
            />
          </div>
        </div>
      </div>

      {/* Explanation */}
      <p className="text-sm text-slate-300 leading-relaxed">{explanation}</p>

      {/* Trend */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {t("risk.trend")}:&nbsp;
        {risk.trend === "rising" ? (
          <span className="flex items-center gap-1 text-red-400 font-semibold">
            <TrendingUp size={12} /> Rising
          </span>
        ) : (
          <span className="flex items-center gap-1 text-green-400 font-semibold">
            <Minus size={12} /> Stable
          </span>
        )}
      </div>

      {/* Threats */}
      <div>
        <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">
          {t("risk.threats")}
        </p>
        <ul className="space-y-1.5">
          {threats.map((th, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className={clsx("mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.bar)} />
              {th}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
