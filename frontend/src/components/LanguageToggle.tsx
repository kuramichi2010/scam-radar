import { useTranslation } from "react-i18next";
import { useStore } from "../store/scamStore";

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useStore();

  const toggle = (lang: "en" | "ja") => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <div className="flex" style={{ border: "1px solid rgba(0,212,255,0.2)" }}>
      {(["en", "ja"] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => toggle(lang)}
          className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all"
          style={
            language === lang
              ? { background: "var(--sf-cyan)", color: "#000810", boxShadow: "0 0 12px rgba(0,212,255,0.4)" }
              : { background: "transparent", color: "rgba(0,212,255,0.4)" }
          }
        >
          {lang === "en" ? "EN" : "日本語"}
        </button>
      ))}
    </div>
  );
}
