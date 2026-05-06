import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Shield, Newspaper, AlertTriangle } from "lucide-react";
import { useStore } from "../store/scamStore";
import { useTranslation } from "react-i18next";

// Official cybersecurity agency URLs per country
const COUNTRY_LINKS: Record<string, { agency: string; agencyUrl: string; newsUrl: string; newsName: string }> = {
  US: { agency: "CISA",            agencyUrl: "https://www.cisa.gov/",                        newsUrl: "https://www.bleepingcomputer.com/tag/united-states/", newsName: "BleepingComputer" },
  JP: { agency: "NPA Cyber",       agencyUrl: "https://www.npa.go.jp/cyber/",                 newsUrl: "https://www.ipa.go.jp/security/",                     newsName: "IPA Japan" },
  GB: { agency: "NCSC UK",         agencyUrl: "https://www.ncsc.gov.uk/",                     newsUrl: "https://www.actionfraud.police.uk/news",              newsName: "Action Fraud" },
  AU: { agency: "ACSC",            agencyUrl: "https://www.cyber.gov.au/",                    newsUrl: "https://www.scamwatch.gov.au/news",                   newsName: "Scamwatch AU" },
  DE: { agency: "BSI",             agencyUrl: "https://www.bsi.bund.de/EN/",                  newsUrl: "https://www.bsi.bund.de/EN/Topics/Consumer/consumer_node.html", newsName: "BSI Consumer" },
  FR: { agency: "Cybermalveillance",agencyUrl:"https://www.cybermalveillance.gouv.fr/",       newsUrl: "https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites", newsName: "Cybermal. News" },
  CA: { agency: "CCCS",            agencyUrl: "https://www.cyber.gc.ca/en/",                  newsUrl: "https://www.antifraudcentre-centreantifraude.ca/",    newsName: "Anti-Fraud Centre" },
  KR: { agency: "KrCERT",          agencyUrl: "https://www.krcert.or.kr/",                    newsUrl: "https://www.krcert.or.kr/eng/main.do",                newsName: "KrCERT/CC" },
  SG: { agency: "CSA Singapore",   agencyUrl: "https://www.csa.gov.sg/",                      newsUrl: "https://www.scamalert.sg/",                           newsName: "ScamAlert SG" },
  IN: { agency: "CERT-In",         agencyUrl: "https://www.cert-in.org.in/",                  newsUrl: "https://www.cybercrime.gov.in/",                      newsName: "Cybercrime.gov.in" },
  CN: { agency: "CNCERT",          agencyUrl: "https://www.cert.org.cn/",                     newsUrl: "https://www.bleepingcomputer.com/tag/china/",         newsName: "BleepingComputer" },
  RU: { agency: "NCSC Threat",     agencyUrl: "https://www.ncsc.gov.uk/collection/russia",    newsUrl: "https://www.bleepingcomputer.com/tag/russia/",        newsName: "BleepingComputer" },
  BR: { agency: "CERT.br",         agencyUrl: "https://www.cert.br/",                         newsUrl: "https://www.cert.br/docs/whitepapers/",               newsName: "CERT.br Docs" },
  NG: { agency: "EFCC",            agencyUrl: "https://www.efcc.gov.ng/",                     newsUrl: "https://www.bleepingcomputer.com/search/?q=nigeria+scam", newsName: "BleepingComputer" },
  NL: { agency: "NCSC-NL",         agencyUrl: "https://www.ncsc.nl/english",                  newsUrl: "https://www.ncsc.nl/english",                         newsName: "NCSC-NL" },
  SE: { agency: "NCSC-SE",         agencyUrl: "https://www.ncsc.se/en/",                      newsUrl: "https://www.ncsc.se/en/",                             newsName: "NCSC Sweden" },
  DEFAULT: { agency: "APWG",       agencyUrl: "https://apwg.org/trendsreports/",              newsUrl: "https://www.bleepingcomputer.com/news/security/",     newsName: "BleepingComputer" },
};

const LEVEL_STYLE: Record<string, { color: string; label: string; bar: string }> = {
  LOW:      { color: "var(--sf-green)",  label: "LOW",      bar: "bg-sf-green" },
  MEDIUM:   { color: "#ffd860",          label: "MEDIUM",   bar: "bg-yellow-300" },
  HIGH:     { color: "var(--sf-amber)",  label: "HIGH",     bar: "bg-sf-amber" },
  CRITICAL: { color: "var(--sf-red)",    label: "CRITICAL", bar: "bg-sf-red" },
};

const TYPE_LABEL: Record<string, string> = {
  banking: "BANKING / PHISHING",
  crypto: "CRYPTO / INVESTMENT",
  delivery: "DELIVERY / SMS",
  phone: "PHONE / VISHING",
  tech_support: "TECH SUPPORT",
  other: "GENERAL FRAUD",
};

export default function CountryDrawer() {
  const { selectedCountry, setSelectedCountry } = useStore();
  const { i18n } = useTranslation();
  const isJa = i18n.language === "ja";

  const links = selectedCountry
    ? COUNTRY_LINKS[selectedCountry.country_code] ?? COUNTRY_LINKS.DEFAULT
    : null;

  const lvl = selectedCountry
    ? LEVEL_STYLE[selectedCountry.risk_level] ?? LEVEL_STYLE.MEDIUM
    : null;

  return (
    <AnimatePresence>
      {selectedCountry && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[190] bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedCountry(null)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28 }}
            className="sf-drawer flex flex-col"
          >
            <div className="sf-scan-line" />

            {/* Header */}
            <div className="sf-panel-header px-5 py-4 flex-shrink-0">
              <div className="sf-dot" />
              <span className="sf-label flex-1">
                {isJa ? "国家脅威情報" : "COUNTRY THREAT INTEL"}
              </span>
              <button
                onClick={() => setSelectedCountry(null)}
                className="sf-btn p-1.5"
                style={{ padding: "4px" }}
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 relative z-10">
              {/* Country name */}
              <div>
                <p className="text-xs sf-label mb-1">{isJa ? "対象国" : "TARGET"}</p>
                <p className="text-2xl font-bold sf-cyan tracking-wider">
                  {selectedCountry.country_name.toUpperCase()}
                </p>
                <p className="text-xs" style={{ color: "rgba(0,212,255,0.4)" }}>
                  {selectedCountry.country_code} / {selectedCountry.lat.toFixed(1)}, {selectedCountry.lng.toFixed(1)}
                </p>
              </div>

              {/* Risk level */}
              <div className="sf-panel p-4">
                <p className="sf-label mb-3">{isJa ? "リスクレベル" : "THREAT LEVEL"}</p>
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="text-3xl font-black tracking-widest"
                    style={{ color: lvl!.color, textShadow: `0 0 20px ${lvl!.color}` }}
                  >
                    {lvl!.label}
                  </span>
                  <span className="text-xl font-bold" style={{ color: lvl!.color }}>
                    {selectedCountry.risk_level === "CRITICAL" ? "⚠" : selectedCountry.risk_level === "HIGH" ? "▲" : selectedCountry.risk_level === "MEDIUM" ? "◆" : "●"}
                  </span>
                </div>
                {/* Score bar */}
                <div className="h-2 bg-black/60 rounded-none border border-sf-border/30 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(selectedCountry.intensity * 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full"
                    style={{ background: lvl!.color, boxShadow: `0 0 10px ${lvl!.color}` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs" style={{ color: "rgba(0,212,255,0.35)" }}>
                  <span>0</span>
                  <span style={{ color: lvl!.color }}>{Math.round(selectedCountry.intensity * 100)} / 100</span>
                  <span>100</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="sf-panel p-3">
                  <p className="sf-label mb-1">{isJa ? "日次推定" : "DAILY EST."}</p>
                  <p className="text-lg font-bold sf-amber">
                    {selectedCountry.scam_count.toLocaleString()}
                  </p>
                </div>
                <div className="sf-panel p-3">
                  <p className="sf-label mb-1">{isJa ? "主要脅威" : "TOP THREAT"}</p>
                  <p className="text-xs font-bold sf-red">
                    {TYPE_LABEL[selectedCountry.top_type] ?? selectedCountry.top_type.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* External links */}
              <div className="space-y-2">
                <p className="sf-label">{isJa ? "外部情報源" : "EXTERNAL INTEL SOURCES"}</p>

                <a
                  href={links!.agencyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full sf-btn py-3 px-4 group"
                >
                  <div className="flex items-center gap-2">
                    <Shield size={13} />
                    <span>{isJa ? "公式セキュリティ機関" : "OFFICIAL SECURITY AGENCY"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs opacity-50">{links!.agency}</span>
                    <ExternalLink size={11} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>

                <a
                  href={links!.newsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full sf-btn py-3 px-4 group"
                >
                  <div className="flex items-center gap-2">
                    <Newspaper size={13} />
                    <span>{isJa ? "最新ニュース・レポート" : "LATEST THREAT NEWS"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs opacity-50">{links!.newsName}</span>
                    <ExternalLink size={11} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>

                <a
                  href={`https://www.bleepingcomputer.com/search/?q=${encodeURIComponent(selectedCountry.country_name + " scam fraud 2024")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full sf-btn py-3 px-4 group"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={13} />
                    <span>{isJa ? "詐欺事例を検索" : "SEARCH SCAM INCIDENTS"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs opacity-50">BleepingComputer</span>
                    <ExternalLink size={11} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>

                <a
                  href={`https://apwg.org/trendsreports/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full sf-btn py-3 px-4 group"
                >
                  <div className="flex items-center gap-2">
                    <ExternalLink size={13} />
                    <span>{isJa ? "APWGフィッシングレポート" : "APWG PHISHING REPORT"}</span>
                  </div>
                  <ExternalLink size={11} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
