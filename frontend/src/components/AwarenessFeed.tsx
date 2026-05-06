import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import { useStore } from "../store/scamStore";

// External search links by scam type
const TYPE_SEARCH: Record<string, string> = {
  banking:      "https://www.bleepingcomputer.com/search/?q=banking+phishing",
  crypto:       "https://www.bleepingcomputer.com/search/?q=crypto+investment+scam",
  delivery:     "https://www.bleepingcomputer.com/search/?q=fake+delivery+scam",
  phone:        "https://www.bleepingcomputer.com/search/?q=phone+vishing+scam",
  tech_support: "https://www.bleepingcomputer.com/search/?q=tech+support+scam",
  other:        "https://www.bleepingcomputer.com/news/security/",
};

// Additional reference links per scam type
const TYPE_REF: Record<string, { name: string; url: string }> = {
  banking:      { name: "APWG Trends",    url: "https://apwg.org/trendsreports/" },
  crypto:       { name: "FTC Crypto",     url: "https://consumer.ftc.gov/articles/what-know-about-cryptocurrency-and-scams" },
  delivery:     { name: "NCSC Guidance",  url: "https://www.ncsc.gov.uk/guidance/suspicious-email-actions" },
  phone:        { name: "FTC Calls",      url: "https://consumer.ftc.gov/articles/how-recognize-and-report-spam-text-messages" },
  tech_support: { name: "MS Safety",     url: "https://support.microsoft.com/en-us/windows/protect-yourself-from-tech-support-scams" },
  other:        { name: "APWG Reports",   url: "https://apwg.org/trendsreports/" },
};

const SEV_STYLE: Record<string, { label: string; cls: string; prefix: string }> = {
  critical: { label: "CRITICAL", cls: "sf-pill-critical", prefix: "!!!" },
  high:     { label: "HIGH",     cls: "sf-pill-high",     prefix: "!!" },
  medium:   { label: "MED",      cls: "sf-pill-medium",   prefix: "!" },
  low:      { label: "LOW",      cls: "sf-pill-low",      prefix: "•" },
};

const TYPE_SIG: Record<string, string> = {
  banking: "BNK", crypto: "CRY", delivery: "DLV", phone: "PHN", tech_support: "TCH", other: "GEN",
};

function timeAgo(ts: string, lang: string): string {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60)   return lang === "ja" ? "今" : "now";
  if (s < 3600) return `${Math.floor(s / 60)}${lang === "ja" ? "分" : "m"}`;
  return `${Math.floor(s / 3600)}${lang === "ja" ? "時間" : "h"}`;
}

export default function AwarenessFeed() {
  const { t } = useTranslation();
  const { feed, language } = useStore();
  const isJa = language === "ja";

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="sf-label text-[9px]">{t("feed.title").toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full animate-sf-flicker"
            style={{ background: "var(--sf-green)", boxShadow: "0 0 6px var(--sf-green)" }}
          />
          <span className="text-[9px] sf-green font-bold">LIVE</span>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-0.5">
        <AnimatePresence initial={false}>
          {feed.map((item) => {
            const sev = SEV_STYLE[item.severity] ?? SEV_STYLE.medium;
            const searchUrl = TYPE_SEARCH[item.scam_type] ?? TYPE_SEARCH.other;
            const ref = TYPE_REF[item.scam_type] ?? TYPE_REF.other;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                className="sf-panel p-3 space-y-2 group cursor-default"
              >
                {/* Top row */}
                <div className="flex items-start gap-2">
                  {/* Severity code */}
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 flex-shrink-0 ${sev.cls}`}
                  >
                    {sev.prefix} {sev.label}
                  </span>
                  <span className="sf-label text-[9px] flex-shrink-0 mt-0.5">
                    [{TYPE_SIG[item.scam_type] ?? "---"}]
                  </span>
                  <span className="text-xs font-semibold flex-1 leading-tight" style={{ color: "#ddf0f8" }}>
                    {isJa ? item.title_ja : item.title}
                  </span>
                  <span className="sf-label text-[9px] flex-shrink-0 ml-1">
                    {timeAgo(item.timestamp, language)}
                  </span>
                </div>

                {/* Description */}
                <p className="text-[11px] leading-relaxed" style={{ color: "rgba(180,210,225,0.65)" }}>
                  {isJa ? item.description_ja : item.description}
                </p>

                {/* Region + links */}
                <div className="flex items-center gap-2 flex-wrap">
                  {item.region && (
                    <span className="sf-label text-[9px]">
                      ◆ {item.region.toUpperCase()}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 ml-auto">
                    {/* Search news */}
                    <a
                      href={searchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sf-btn text-[9px] py-0.5 px-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={9} />
                      {isJa ? "ニュース" : "NEWS"}
                    </a>
                    {/* Reference */}
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sf-btn text-[9px] py-0.5 px-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={9} />
                      {isJa ? "参考資料" : "REF"}
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
