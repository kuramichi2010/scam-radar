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
    <div className="flex items-center gap-0.5 bg-slate-800 rounded-lg p-0.5">
      {(["en", "ja"] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => toggle(lang)}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
            language === lang
              ? "bg-white text-slate-900 shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          {lang === "en" ? "EN" : "日本語"}
        </button>
      ))}
    </div>
  );
}
