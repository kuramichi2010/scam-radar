import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Share2, TrendingUp, Minus, ExternalLink } from "lucide-react";
import { useStore } from "../store/scamStore";

const LEVEL: Record<string, { color: string; code: string; bar: string }> = {
  LOW:      { color: "var(--sf-green)",  code: "01", bar: "25%" },
  MEDIUM:   { color: "#ffd860",          code: "02", bar: "50%" },
  HIGH:     { color: "var(--sf-amber)",  code: "03", bar: "75%" },
  CRITICAL: { color: "var(--sf-red)",    code: "04", bar: "100%" },
};

// Awareness links per country
const AWARENESS_LINKS: Record<string, string> = {
  US: "https://consumer.ftc.gov/scams",
  JP: "https://www.ipa.go.jp/security/anshin/",
  GB: "https://www.ncsc.gov.uk/guidance/suspicious-email-actions",
  AU: "https://www.scamwatch.gov.au/",
  DE: "https://www.bsi.bund.de/EN/Topics/Consumer/consumer_node.html",
  DEFAULT: "https://apwg.org/",
};

export default function RiskPanel() {
  const { t, i18n } = useTranslation();
  const { risk, language, setShowShareModal } = useStore();
  const isJa = language === "ja";

  if (!risk) return (
    <div className="flex items-center gap-2 py-8 justify-center">
      <div className="w-4 h-4 border border-sf-cyan/30 border-t-sf-cyan rounded-full animate-spin" />
      <span className="sf-label animate-pulse">{t("risk.detecting")}</span>
    </div>
  );

  const lvl = LEVEL[risk.level] ?? LEVEL.MEDIUM;
  const threats = isJa ? risk.top_threats_ja : risk.top_threats;
  const expl   = isJa ? risk.explanation_ja   : risk.explanation;
  const awareUrl = AWARENESS_LINKS[risk.country_code] ?? AWARENESS_LINKS.DEFAULT;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="sf-label text-[9px]">{t("risk.title").toUpperCase()}</p>
        <div className="flex items-center gap-2">
          <a
            href={awareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sf-btn text-[9px]"
          >
            <ExternalLink size={10} />
            {isJa ? "啓発サイト" : "AWARENESS"}
          </a>
          <button onClick={() => setShowShareModal(true)} className="sf-btn-red text-[9px] sf-btn">
            <Share2 size={10} />
            {t("risk.share")}
          </button>
        </div>
      </div>

      {/* Main display */}
      <div className="sf-panel p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs" style={{ color: "rgba(0,212,255,0.4)" }}>{risk.region.toUpperCase()}</p>
            <div
              className="text-4xl font-black tracking-widest mt-0.5 animate-sf-flicker"
              style={{ color: lvl.color, textShadow: `0 0 25px ${lvl.color}` }}
            >
              {risk.level}
            </div>
          </div>
          <div className="text-right">
            <p className="sf-label text-[9px]">THREAT CODE</p>
            <p className="text-2xl font-black" style={{ color: lvl.color }}>T-{lvl.code}</p>
          </div>
        </div>

        {/* Score bar */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="sf-label text-[9px]">RISK INDEX</span>
            <span className="text-xs font-bold" style={{ color: lvl.color }}>{risk.score} / 100</span>
          </div>
          <div className="h-2 bg-black border border-sf-border/20 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${risk.score}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full"
              style={{ background: lvl.color, boxShadow: `0 0 10px ${lvl.color}` }}
            />
          </div>
        </div>

        {/* Trend */}
        <div className="flex items-center gap-2 text-xs">
          <span className="sf-label text-[9px]">{t("risk.trend").toUpperCase()}:</span>
          {risk.trend === "rising" ? (
            <span className="flex items-center gap-1 font-bold sf-red">
              <TrendingUp size={11} /> RISING ▲
            </span>
          ) : (
            <span className="flex items-center gap-1 font-bold sf-green">
              <Minus size={11} /> STABLE
            </span>
          )}
        </div>
      </div>

      {/* Explanation */}
      <p className="text-xs leading-relaxed" style={{ color: "rgba(200,232,240,0.7)" }}>
        {expl}
      </p>

      {/* Active threats */}
      <div className="space-y-2">
        <p className="sf-label text-[9px]">{t("risk.threats").toUpperCase()}</p>
        {threats.map((th, i) => (
          <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "rgba(200,232,240,0.8)" }}>
            <span className="font-bold mt-0.5" style={{ color: lvl.color }}>▸</span>
            {th}
          </div>
        ))}
      </div>
    </div>
  );
}
