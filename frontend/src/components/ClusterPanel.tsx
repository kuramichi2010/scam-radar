import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import { useStore } from "../store/scamStore";

const SEV_COLOR: Record<string, string> = {
  critical: "var(--sf-red)",
  high:     "var(--sf-amber)",
  medium:   "#ffd860",
  low:      "var(--sf-green)",
};

const TYPE_SEARCH: Record<string, string> = {
  banking:      "https://www.bleepingcomputer.com/search/?q=banking+phishing+campaign",
  crypto:       "https://www.bleepingcomputer.com/search/?q=crypto+scam+cluster",
  delivery:     "https://www.bleepingcomputer.com/search/?q=fake+delivery+campaign",
  phone:        "https://www.bleepingcomputer.com/search/?q=SMS+phishing+campaign",
  tech_support: "https://www.bleepingcomputer.com/search/?q=tech+support+fraud",
  other:        "https://www.bleepingcomputer.com/news/security/",
};

const TYPE_SIG: Record<string, string> = {
  banking: "BANKING", crypto: "CRYPTO", delivery: "DELIVERY",
  phone: "PHONE", tech_support: "TECH-SUPP", other: "GENERAL",
};

function timeAgo(ts: string): string {
  const h = Math.floor((Date.now() - new Date(ts).getTime()) / 3600000);
  return `T-${h}H`;
}

export default function ClusterPanel() {
  const { t } = useTranslation();
  const { clusters, language } = useStore();
  const isJa = language === "ja";

  return (
    <div className="space-y-4">
      <div>
        <p className="sf-label text-[9px] mb-1">THREAT CLUSTER DETECTION</p>
        <h2 className="text-base font-bold sf-cyan">{t("clusters.title").toUpperCase()}</h2>
        <p className="text-xs mt-0.5" style={{ color: "rgba(0,212,255,0.4)" }}>{t("clusters.subtitle")}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {clusters.map((c, i) => {
          const color = SEV_COLOR[c.severity] ?? SEV_COLOR.medium;
          const url = TYPE_SEARCH[c.scam_type] ?? TYPE_SEARCH.other;

          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="sf-panel p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-1">
                <div>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 sf-label"
                    style={{ color, border: `1px solid ${color}40`, background: `${color}10` }}
                  >
                    {c.severity.toUpperCase()}
                  </span>
                </div>
                <span className="sf-label text-[9px]" style={{ color: "rgba(0,212,255,0.4)" }}>
                  {timeAgo(c.detected_at)}
                </span>
              </div>

              <div>
                <p className="text-[9px] sf-label mb-0.5">{TYPE_SIG[c.scam_type] ?? "UNKNOWN"}</p>
                <p className="text-sm font-bold" style={{ color: "#ddf0f8" }}>{c.name}</p>
              </div>

              <p className="text-[11px] leading-relaxed" style={{ color: "rgba(180,210,225,0.6)" }}>
                {c.description}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <p className="sf-label text-[8px]">{t("clusters.count").toUpperCase()}</p>
                  <p className="font-bold sf-amber">{c.count.toLocaleString()}</p>
                </div>
                <div>
                  <p className="sf-label text-[8px]">RADIUS</p>
                  <p className="font-bold" style={{ color }}>±{c.radius_km}km</p>
                </div>
              </div>

              {/* Activity bar */}
              <div className="h-1 bg-black/60 overflow-hidden">
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, ease: "linear" }}
                  className="h-full w-1/3"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
                />
              </div>

              {/* Link */}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="sf-btn text-[9px] w-full justify-center"
                style={{ color, borderColor: `${color}50` }}
              >
                <ExternalLink size={9} />
                {isJa ? "インテル情報を検索" : "SEARCH INTEL"}
              </a>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
