import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";
import ja from "./ja";

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ja: { translation: ja } },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
