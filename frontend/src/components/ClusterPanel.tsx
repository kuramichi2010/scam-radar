import { useTranslation } from "react-i18next";
import { useStore } from "../store/scamStore";
import { motion } from "framer-motion";
import clsx from "clsx";

const SEVERITY_COLORS = {
  critical: "border-red-700/50 bg-red-950/40 text-red-400",
  high:     "border-orange-700/50 bg-orange-950/40 text-orange-400",
  medium:   "border-yellow-700/50 bg-yellow-950/40 text-yellow-400",
  low:      "border-green-700/50 bg-green-950/40 text-green-400",
};

const TYPE_EMOJI: Record<string, string> = {
  banking: "🏦", crypto: "₿", delivery: "📦", phone: "📞", tech_support: "💻", other: "⚠️",
};

function timeAgo(ts: string): string {
  const h = Math.floor((Date.now() - new Date(ts).getTime()) / 3600000);
  return `${h}h ago`;
}

export default function ClusterPanel() {
  const { t } = useTranslation();
  const { clusters } = useStore();

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-white font-bold text-lg">{t("clusters.title")}</h2>
        <p className="text-slate-500 text-xs mt-0.5">{t("clusters.subtitle")}</p>
      </div>

      <div className="space-y-3">
        {clusters.map((c, i) => {
          const colorClass = SEVERITY_COLORS[c.severity as keyof typeof SEVERITY_COLORS] ?? SEVERITY_COLORS.medium;
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={clsx("border rounded-xl p-4 space-y-2", colorClass.split(" ").slice(0, 2).join(" "), "border")}
              style={{ borderColor: "inherit" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span>{TYPE_EMOJI[c.scam_type] ?? "⚠️"}</span>
                  <span className="text-white font-semibold text-sm">{c.name}</span>
                </div>
                <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full uppercase", colorClass.split(" ").slice(-1))}>
                  {c.severity}
                </span>
              </div>
              <p className="text-xs text-slate-400">{c.description}</p>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>🎯 {c.count.toLocaleString()} {t("clusters.count")}</span>
                <span>📍 r={c.radius_km}km</span>
                <span className="ml-auto">{t("clusters.detected")}: {timeAgo(c.detected_at)}</span>
              </div>

              {/* Pulse indicator */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ x: ["0%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className={clsx("h-full w-1/3 rounded-full", colorClass.split(" ")[2]?.replace("text-", "bg-") ?? "bg-red-500")}
                    style={{ opacity: 0.7 }}
                  />
                </div>
                <span className="text-xs text-slate-600">active</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
