import { useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { X, Download, Twitter, Share2 } from "lucide-react";
import { useStore } from "../store/scamStore";

const LEVEL_COLORS = {
  LOW:      { bg: "#052e16", border: "#166534", text: "#4ade80" },
  MEDIUM:   { bg: "#422006", border: "#92400e", text: "#fbbf24" },
  HIGH:     { bg: "#431407", border: "#c2410c", text: "#fb923c" },
  CRITICAL: { bg: "#450a0a", border: "#991b1b", text: "#f87171" },
};

export default function ShareModal() {
  const { t, i18n } = useTranslation();
  const { risk, stats, showShareModal, setShowShareModal, language } = useStore();
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#0f172a",
      scale: 2,
    });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `scamradar-alert-${Date.now()}.png`;
    a.click();
  }, []);

  const shareText = risk
    ? t("share.message")
        .replace("{{region}}", risk.region)
        .replace("{{level}}", risk.level)
        .replace("{{count}}", (stats?.total_today ?? 0).toLocaleString())
    : "";

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + "\n#ScamRadar #CyberSecurity")}`, "_blank");
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const handleLine = () => {
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(shareText)}`, "_blank");
  };

  if (!risk || !stats) return null;

  const colors = LEVEL_COLORS[risk.level];

  return (
    <AnimatePresence>
      {showShareModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowShareModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="text-white font-bold">{t("share.title")}</h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Shareable card preview */}
            <div className="p-5">
              <div
                ref={cardRef}
                className="rounded-2xl p-5 space-y-3 font-sans"
                style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-lg">ScamRadar</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ color: colors.text, background: `${colors.border}66` }}>
                    {risk.level} RISK
                  </span>
                </div>
                <div style={{ color: colors.text }} className="text-3xl font-black">
                  ⚠️ {risk.region}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {language === "ja" ? risk.explanation_ja : risk.explanation}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-700/50">
                  <span>📊 {stats.total_today.toLocaleString()} attempts today</span>
                  <span className="ml-auto">scamradar.io</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 grid grid-cols-2 gap-2">
              <button onClick={handleDownload}
                className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm transition-colors">
                <Download size={14} />
                {t("share.download")}
              </button>
              <button onClick={handleTwitter}
                className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm transition-colors">
                <Twitter size={14} />
                {t("share.twitter")}
              </button>
              <button onClick={handleWhatsApp}
                className="flex items-center justify-center gap-2 py-2.5 bg-green-900/40 hover:bg-green-900/60 text-green-300 rounded-xl text-sm transition-colors">
                <Share2 size={14} />
                {t("share.whatsapp")}
              </button>
              <button onClick={handleLine}
                className="flex items-center justify-center gap-2 py-2.5 bg-green-900/40 hover:bg-green-900/60 text-green-300 rounded-xl text-sm transition-colors">
                <Share2 size={14} />
                {t("share.line")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
