/**
 * Client-side simulation — ported from backend/app/services/simulation.py
 * Runs entirely in the browser / iOS WebView. No server needed.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

function gauss(mu: number, sigma: number): number {
  const u1 = Math.random(), u2 = Math.random();
  return mu + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uniform(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function timeMultiplier(): number {
  const hour = new Date().getUTCHours();
  const curve = Math.sin((hour - 2) * Math.PI / 12);
  return 0.7 + 0.6 * Math.max(0, curve);
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE_RATE = 5.8; // attempts per second

export const SCAM_TYPES_META = [
  { id: "banking",      label: "Banking / Financial Phishing", label_ja: "銀行・金融フィッシング",  weight: 0.32, color: "#ef4444", trend: "up" },
  { id: "crypto",       label: "Crypto / Investment Scams",    label_ja: "暗号通貨・投資詐欺",      weight: 0.25, color: "#f97316", trend: "up" },
  { id: "delivery",     label: "Delivery / Shipping Scams",    label_ja: "配送・荷物詐欺",          weight: 0.18, color: "#eab308", trend: "stable" },
  { id: "phone",        label: "Phone / Voice Scams",          label_ja: "電話・音声詐欺",          weight: 0.12, color: "#a855f7", trend: "stable" },
  { id: "tech_support", label: "Fake Tech Support",            label_ja: "偽テクニカルサポート",    weight: 0.08, color: "#06b6d4", trend: "down" },
  { id: "other",        label: "Other Scams",                  label_ja: "その他の詐欺",            weight: 0.05, color: "#64748b", trend: "stable" },
] as const;

export const COUNTRY_DATA: Record<string, { name: string; lat: number; lng: number; risk: number; scam_base: number; top: string }> = {
  // ── Americas ───────────────────────────────────────────────────
  US: { name: "United States",       lat: 37.1,  lng: -95.7,  risk: 82, scam_base: 0.28, top: "banking" },
  CA: { name: "Canada",              lat: 56.1,  lng: -106.3, risk: 56, scam_base: 0.06, top: "phone" },
  MX: { name: "Mexico",              lat: 23.6,  lng: -102.6, risk: 63, scam_base: 0.08, top: "phone" },
  BR: { name: "Brazil",              lat: -14.2, lng: -51.9,  risk: 66, scam_base: 0.10, top: "banking" },
  AR: { name: "Argentina",           lat: -38.4, lng: -63.6,  risk: 60, scam_base: 0.05, top: "banking" },
  CO: { name: "Colombia",            lat: 4.6,   lng: -74.3,  risk: 64, scam_base: 0.04, top: "phone" },
  CL: { name: "Chile",               lat: -35.7, lng: -71.5,  risk: 55, scam_base: 0.03, top: "banking" },
  PE: { name: "Peru",                lat: -9.2,  lng: -75.0,  risk: 61, scam_base: 0.03, top: "banking" },
  VE: { name: "Venezuela",           lat: 6.4,   lng: -66.6,  risk: 68, scam_base: 0.04, top: "other" },
  EC: { name: "Ecuador",             lat: -1.8,  lng: -78.2,  risk: 59, scam_base: 0.02, top: "banking" },
  BO: { name: "Bolivia",             lat: -16.3, lng: -63.6,  risk: 57, scam_base: 0.02, top: "phone" },
  PY: { name: "Paraguay",            lat: -23.4, lng: -58.4,  risk: 58, scam_base: 0.02, top: "banking" },
  UY: { name: "Uruguay",             lat: -32.5, lng: -55.8,  risk: 50, scam_base: 0.01, top: "banking" },
  GY: { name: "Guyana",              lat: 4.9,   lng: -59.0,  risk: 56, scam_base: 0.01, top: "other" },
  SR: { name: "Suriname",            lat: 3.9,   lng: -56.0,  risk: 54, scam_base: 0.01, top: "banking" },
  GT: { name: "Guatemala",           lat: 15.8,  lng: -90.2,  risk: 62, scam_base: 0.02, top: "phone" },
  HN: { name: "Honduras",            lat: 15.2,  lng: -86.2,  risk: 63, scam_base: 0.02, top: "phone" },
  SV: { name: "El Salvador",         lat: 13.8,  lng: -88.9,  risk: 61, scam_base: 0.01, top: "banking" },
  NI: { name: "Nicaragua",           lat: 12.9,  lng: -85.2,  risk: 60, scam_base: 0.01, top: "phone" },
  CR: { name: "Costa Rica",          lat: 9.7,   lng: -83.8,  risk: 54, scam_base: 0.01, top: "banking" },
  PA: { name: "Panama",              lat: 8.5,   lng: -80.8,  risk: 58, scam_base: 0.02, top: "banking" },
  CU: { name: "Cuba",                lat: 22.0,  lng: -80.0,  risk: 44, scam_base: 0.01, top: "phone" },
  DO: { name: "Dominican Republic",  lat: 19.0,  lng: -70.2,  risk: 60, scam_base: 0.02, top: "banking" },
  HT: { name: "Haiti",               lat: 19.1,  lng: -72.3,  risk: 62, scam_base: 0.01, top: "phone" },
  JM: { name: "Jamaica",             lat: 18.1,  lng: -77.3,  risk: 66, scam_base: 0.02, top: "other" },
  TT: { name: "Trinidad & Tobago",   lat: 10.7,  lng: -61.2,  risk: 58, scam_base: 0.01, top: "banking" },
  BB: { name: "Barbados",            lat: 13.2,  lng: -59.6,  risk: 48, scam_base: 0.01, top: "banking" },
  BS: { name: "Bahamas",             lat: 25.0,  lng: -77.4,  risk: 50, scam_base: 0.01, top: "banking" },
  BZ: { name: "Belize",              lat: 17.2,  lng: -88.5,  risk: 55, scam_base: 0.01, top: "phone" },

  // ── Europe ────────────────────────────────────────────────────
  GB: { name: "United Kingdom",      lat: 55.4,  lng: -3.4,   risk: 71, scam_base: 0.12, top: "banking" },
  DE: { name: "Germany",             lat: 51.2,  lng: 10.5,   risk: 44, scam_base: 0.05, top: "banking" },
  FR: { name: "France",              lat: 46.2,  lng: 2.2,    risk: 48, scam_base: 0.05, top: "banking" },
  IT: { name: "Italy",               lat: 41.9,  lng: 12.6,   risk: 52, scam_base: 0.05, top: "banking" },
  ES: { name: "Spain",               lat: 40.5,  lng: -3.7,   risk: 50, scam_base: 0.04, top: "banking" },
  NL: { name: "Netherlands",         lat: 52.1,  lng: 5.3,    risk: 46, scam_base: 0.04, top: "banking" },
  SE: { name: "Sweden",              lat: 60.1,  lng: 18.6,   risk: 40, scam_base: 0.03, top: "banking" },
  RU: { name: "Russia",              lat: 61.5,  lng: 105.3,  risk: 72, scam_base: 0.11, top: "crypto" },
  UA: { name: "Ukraine",             lat: 48.4,  lng: 31.2,   risk: 70, scam_base: 0.08, top: "crypto" },
  PL: { name: "Poland",              lat: 52.1,  lng: 19.1,   risk: 54, scam_base: 0.04, top: "banking" },
  BE: { name: "Belgium",             lat: 50.5,  lng: 4.5,    risk: 48, scam_base: 0.03, top: "banking" },
  AT: { name: "Austria",             lat: 47.5,  lng: 14.6,   risk: 43, scam_base: 0.02, top: "banking" },
  CH: { name: "Switzerland",         lat: 46.8,  lng: 8.2,    risk: 42, scam_base: 0.02, top: "banking" },
  NO: { name: "Norway",              lat: 60.5,  lng: 8.5,    risk: 39, scam_base: 0.02, top: "banking" },
  DK: { name: "Denmark",             lat: 56.3,  lng: 10.0,   risk: 40, scam_base: 0.02, top: "banking" },
  FI: { name: "Finland",             lat: 64.0,  lng: 26.0,   risk: 38, scam_base: 0.02, top: "banking" },
  PT: { name: "Portugal",            lat: 38.7,  lng: -9.1,   risk: 48, scam_base: 0.02, top: "banking" },
  GR: { name: "Greece",              lat: 39.1,  lng: 21.8,   risk: 52, scam_base: 0.02, top: "banking" },
  CZ: { name: "Czech Republic",      lat: 50.1,  lng: 15.5,   risk: 46, scam_base: 0.02, top: "banking" },
  RO: { name: "Romania",             lat: 45.9,  lng: 24.1,   risk: 60, scam_base: 0.03, top: "banking" },
  HU: { name: "Hungary",             lat: 47.2,  lng: 19.3,   risk: 50, scam_base: 0.02, top: "banking" },
  BG: { name: "Bulgaria",            lat: 42.7,  lng: 25.5,   risk: 56, scam_base: 0.02, top: "banking" },
  HR: { name: "Croatia",             lat: 45.1,  lng: 16.4,   risk: 48, scam_base: 0.02, top: "banking" },
  SK: { name: "Slovakia",            lat: 48.7,  lng: 19.7,   risk: 47, scam_base: 0.01, top: "banking" },
  IE: { name: "Ireland",             lat: 53.4,  lng: -8.2,   risk: 52, scam_base: 0.02, top: "banking" },
  BY: { name: "Belarus",             lat: 53.7,  lng: 28.0,   risk: 62, scam_base: 0.02, top: "crypto" },
  RS: { name: "Serbia",              lat: 44.0,  lng: 21.0,   risk: 56, scam_base: 0.02, top: "banking" },
  LT: { name: "Lithuania",           lat: 55.2,  lng: 24.0,   risk: 50, scam_base: 0.01, top: "banking" },
  LV: { name: "Latvia",              lat: 56.9,  lng: 24.9,   risk: 50, scam_base: 0.01, top: "banking" },
  EE: { name: "Estonia",             lat: 58.6,  lng: 25.0,   risk: 46, scam_base: 0.01, top: "banking" },
  BA: { name: "Bosnia & Herzegovina",lat: 44.2,  lng: 17.9,   risk: 54, scam_base: 0.01, top: "banking" },
  MD: { name: "Moldova",             lat: 47.4,  lng: 28.4,   risk: 60, scam_base: 0.01, top: "banking" },
  AL: { name: "Albania",             lat: 41.2,  lng: 20.2,   risk: 56, scam_base: 0.01, top: "banking" },
  MK: { name: "North Macedonia",     lat: 41.6,  lng: 21.7,   risk: 54, scam_base: 0.01, top: "banking" },
  ME: { name: "Montenegro",          lat: 42.5,  lng: 19.3,   risk: 52, scam_base: 0.01, top: "banking" },
  SI: { name: "Slovenia",            lat: 46.1,  lng: 15.0,   risk: 44, scam_base: 0.01, top: "banking" },
  CY: { name: "Cyprus",              lat: 35.1,  lng: 33.4,   risk: 56, scam_base: 0.01, top: "banking" },
  MT: { name: "Malta",               lat: 35.9,  lng: 14.5,   risk: 50, scam_base: 0.01, top: "banking" },
  LU: { name: "Luxembourg",          lat: 49.8,  lng: 6.1,    risk: 42, scam_base: 0.01, top: "banking" },
  IS: { name: "Iceland",             lat: 65.0,  lng: -18.0,  risk: 35, scam_base: 0.01, top: "banking" },
  GE: { name: "Georgia",             lat: 42.3,  lng: 43.4,   risk: 58, scam_base: 0.01, top: "crypto" },
  AM: { name: "Armenia",             lat: 40.1,  lng: 45.0,   risk: 55, scam_base: 0.01, top: "crypto" },
  AZ: { name: "Azerbaijan",          lat: 40.1,  lng: 47.6,   risk: 57, scam_base: 0.01, top: "banking" },

  // ── Middle East & North Africa ────────────────────────────────
  EG: { name: "Egypt",               lat: 26.8,  lng: 30.8,   risk: 64, scam_base: 0.05, top: "phone" },
  TR: { name: "Turkey",              lat: 38.9,  lng: 35.2,   risk: 58, scam_base: 0.05, top: "crypto" },
  SA: { name: "Saudi Arabia",        lat: 24.7,  lng: 46.7,   risk: 60, scam_base: 0.04, top: "banking" },
  AE: { name: "UAE",                 lat: 24.0,  lng: 54.0,   risk: 58, scam_base: 0.03, top: "crypto" },
  IR: { name: "Iran",                lat: 32.4,  lng: 53.7,   risk: 66, scam_base: 0.04, top: "crypto" },
  IQ: { name: "Iraq",                lat: 33.2,  lng: 43.7,   risk: 65, scam_base: 0.03, top: "phone" },
  IL: { name: "Israel",              lat: 31.0,  lng: 35.0,   risk: 60, scam_base: 0.03, top: "banking" },
  MA: { name: "Morocco",             lat: 31.8,  lng: -7.1,   risk: 60, scam_base: 0.03, top: "banking" },
  DZ: { name: "Algeria",             lat: 28.0,  lng: 1.7,    risk: 58, scam_base: 0.03, top: "banking" },
  LY: { name: "Libya",               lat: 26.3,  lng: 17.2,   risk: 68, scam_base: 0.02, top: "other" },
  TN: { name: "Tunisia",             lat: 34.0,  lng: 9.0,    risk: 58, scam_base: 0.02, top: "banking" },
  JO: { name: "Jordan",              lat: 31.2,  lng: 36.5,   risk: 56, scam_base: 0.02, top: "banking" },
  LB: { name: "Lebanon",             lat: 33.9,  lng: 35.9,   risk: 65, scam_base: 0.02, top: "banking" },
  SY: { name: "Syria",               lat: 34.8,  lng: 38.9,   risk: 68, scam_base: 0.02, top: "other" },
  YE: { name: "Yemen",               lat: 15.6,  lng: 48.5,   risk: 66, scam_base: 0.02, top: "phone" },
  QA: { name: "Qatar",               lat: 25.4,  lng: 51.2,   risk: 52, scam_base: 0.01, top: "crypto" },
  KW: { name: "Kuwait",              lat: 29.3,  lng: 47.7,   risk: 55, scam_base: 0.01, top: "banking" },
  OM: { name: "Oman",                lat: 21.5,  lng: 57.0,   risk: 52, scam_base: 0.01, top: "banking" },
  BH: { name: "Bahrain",             lat: 26.0,  lng: 50.6,   risk: 54, scam_base: 0.01, top: "banking" },
  PS: { name: "Palestine",           lat: 32.0,  lng: 35.3,   risk: 60, scam_base: 0.01, top: "banking" },
  SD: { name: "Sudan",               lat: 12.9,  lng: 30.2,   risk: 65, scam_base: 0.02, top: "other" },

  // ── Sub-Saharan Africa ────────────────────────────────────────
  NG: { name: "Nigeria",             lat: 9.1,   lng: 8.7,    risk: 78, scam_base: 0.09, top: "other" },
  ZA: { name: "South Africa",        lat: -30.6, lng: 22.9,   risk: 68, scam_base: 0.07, top: "banking" },
  KE: { name: "Kenya",               lat: -0.2,  lng: 37.9,   risk: 70, scam_base: 0.04, top: "banking" },
  GH: { name: "Ghana",               lat: 7.9,   lng: -1.0,   risk: 72, scam_base: 0.04, top: "other" },
  ET: { name: "Ethiopia",            lat: 8.6,   lng: 39.6,   risk: 62, scam_base: 0.03, top: "phone" },
  TZ: { name: "Tanzania",            lat: -6.4,  lng: 34.9,   risk: 62, scam_base: 0.02, top: "phone" },
  ZW: { name: "Zimbabwe",            lat: -20.0, lng: 29.2,   risk: 66, scam_base: 0.02, top: "banking" },
  CI: { name: "Ivory Coast",         lat: 6.5,   lng: -6.0,   risk: 70, scam_base: 0.03, top: "other" },
  CM: { name: "Cameroon",            lat: 3.8,   lng: 11.5,   risk: 68, scam_base: 0.03, top: "other" },
  SN: { name: "Senegal",             lat: 14.5,  lng: -14.5,  risk: 62, scam_base: 0.02, top: "banking" },
  UG: { name: "Uganda",              lat: 1.4,   lng: 32.3,   risk: 64, scam_base: 0.02, top: "phone" },
  AO: { name: "Angola",              lat: -11.2, lng: 17.9,   risk: 64, scam_base: 0.02, top: "banking" },
  MZ: { name: "Mozambique",          lat: -18.7, lng: 35.5,   risk: 60, scam_base: 0.02, top: "phone" },
  ZM: { name: "Zambia",              lat: -13.1, lng: 27.8,   risk: 60, scam_base: 0.01, top: "banking" },
  CD: { name: "DR Congo",            lat: -4.0,  lng: 21.8,   risk: 66, scam_base: 0.03, top: "other" },
  ML: { name: "Mali",                lat: 17.6,  lng: -2.0,   risk: 62, scam_base: 0.02, top: "phone" },
  BF: { name: "Burkina Faso",        lat: 12.4,  lng: -1.6,   risk: 60, scam_base: 0.01, top: "phone" },
  NE: { name: "Niger",               lat: 17.6,  lng: 8.1,    risk: 58, scam_base: 0.01, top: "phone" },
  TD: { name: "Chad",                lat: 15.5,  lng: 18.7,   risk: 60, scam_base: 0.01, top: "phone" },
  RW: { name: "Rwanda",              lat: -1.9,  lng: 29.9,   risk: 56, scam_base: 0.01, top: "banking" },
  MG: { name: "Madagascar",          lat: -20.2, lng: 44.5,   risk: 58, scam_base: 0.01, top: "phone" },
  MW: { name: "Malawi",              lat: -13.3, lng: 34.3,   risk: 58, scam_base: 0.01, top: "phone" },
  NA: { name: "Namibia",             lat: -22.0, lng: 17.1,   risk: 55, scam_base: 0.01, top: "banking" },
  BW: { name: "Botswana",            lat: -22.3, lng: 24.7,   risk: 52, scam_base: 0.01, top: "banking" },
  SO: { name: "Somalia",             lat: 6.0,   lng: 46.2,   risk: 72, scam_base: 0.02, top: "other" },
  LR: { name: "Liberia",             lat: 6.4,   lng: -9.4,   risk: 66, scam_base: 0.01, top: "other" },
  SL: { name: "Sierra Leone",        lat: 8.5,   lng: -11.8,  risk: 65, scam_base: 0.01, top: "other" },
  GN: { name: "Guinea",              lat: 11.0,  lng: -10.9,  risk: 64, scam_base: 0.01, top: "other" },
  BJ: { name: "Benin",               lat: 9.3,   lng: 2.3,    risk: 62, scam_base: 0.01, top: "banking" },
  TG: { name: "Togo",                lat: 8.6,   lng: 0.8,    risk: 62, scam_base: 0.01, top: "banking" },
  GA: { name: "Gabon",               lat: -0.8,  lng: 11.6,   risk: 58, scam_base: 0.01, top: "banking" },
  CG: { name: "Congo",               lat: -0.2,  lng: 15.8,   risk: 62, scam_base: 0.01, top: "other" },
  MR: { name: "Mauritania",          lat: 21.0,  lng: -10.9,  risk: 58, scam_base: 0.01, top: "phone" },
  GM: { name: "Gambia",              lat: 13.5,  lng: -15.3,  risk: 62, scam_base: 0.01, top: "other" },
  ER: { name: "Eritrea",             lat: 15.2,  lng: 39.8,   risk: 58, scam_base: 0.01, top: "phone" },
  BI: { name: "Burundi",             lat: -3.4,  lng: 30.0,   risk: 60, scam_base: 0.01, top: "phone" },
  SS: { name: "South Sudan",         lat: 7.9,   lng: 30.2,   risk: 64, scam_base: 0.01, top: "other" },
  DJ: { name: "Djibouti",            lat: 11.8,  lng: 42.6,   risk: 58, scam_base: 0.01, top: "phone" },
  SZ: { name: "Eswatini",            lat: -26.5, lng: 31.5,   risk: 56, scam_base: 0.01, top: "banking" },
  LS: { name: "Lesotho",             lat: -29.6, lng: 28.2,   risk: 54, scam_base: 0.01, top: "banking" },
  CF: { name: "Central African Rep.", lat: 6.6,  lng: 20.9,   risk: 62, scam_base: 0.01, top: "other" },
  GW: { name: "Guinea-Bissau",       lat: 11.8,  lng: -15.2,  risk: 62, scam_base: 0.01, top: "other" },
  MU: { name: "Mauritius",           lat: -20.3, lng: 57.6,   risk: 52, scam_base: 0.01, top: "banking" },
  CV: { name: "Cape Verde",          lat: 16.0,  lng: -24.0,  risk: 50, scam_base: 0.01, top: "banking" },

  // ── South & Central Asia ──────────────────────────────────────
  IN: { name: "India",               lat: 20.6,  lng: 79.0,   risk: 70, scam_base: 0.18, top: "phone" },
  PK: { name: "Pakistan",            lat: 30.4,  lng: 69.3,   risk: 67, scam_base: 0.06, top: "phone" },
  BD: { name: "Bangladesh",          lat: 23.7,  lng: 90.4,   risk: 64, scam_base: 0.04, top: "banking" },
  AF: { name: "Afghanistan",         lat: 33.9,  lng: 67.7,   risk: 65, scam_base: 0.02, top: "phone" },
  NP: { name: "Nepal",               lat: 28.4,  lng: 84.1,   risk: 60, scam_base: 0.02, top: "banking" },
  LK: { name: "Sri Lanka",           lat: 7.9,   lng: 80.7,   risk: 60, scam_base: 0.02, top: "banking" },
  KZ: { name: "Kazakhstan",          lat: 48.0,  lng: 66.9,   risk: 60, scam_base: 0.02, top: "crypto" },
  UZ: { name: "Uzbekistan",          lat: 41.4,  lng: 64.6,   risk: 58, scam_base: 0.02, top: "banking" },
  TJ: { name: "Tajikistan",          lat: 38.9,  lng: 71.3,   risk: 56, scam_base: 0.01, top: "banking" },
  KG: { name: "Kyrgyzstan",          lat: 41.2,  lng: 74.8,   risk: 56, scam_base: 0.01, top: "banking" },
  TM: { name: "Turkmenistan",        lat: 40.0,  lng: 59.0,   risk: 54, scam_base: 0.01, top: "banking" },
  BT: { name: "Bhutan",              lat: 27.5,  lng: 90.4,   risk: 42, scam_base: 0.01, top: "banking" },
  MV: { name: "Maldives",            lat: 3.2,   lng: 73.2,   risk: 48, scam_base: 0.01, top: "banking" },

  // ── East & Southeast Asia ─────────────────────────────────────
  CN: { name: "China",               lat: 35.9,  lng: 104.2,  risk: 74, scam_base: 0.22, top: "crypto" },
  JP: { name: "Japan",               lat: 36.2,  lng: 138.3,  risk: 55, scam_base: 0.08, top: "delivery" },
  KR: { name: "South Korea",         lat: 35.9,  lng: 127.8,  risk: 52, scam_base: 0.05, top: "delivery" },
  TW: { name: "Taiwan",              lat: 23.7,  lng: 121.0,  risk: 56, scam_base: 0.03, top: "delivery" },
  VN: { name: "Vietnam",             lat: 14.1,  lng: 108.3,  risk: 62, scam_base: 0.05, top: "banking" },
  TH: { name: "Thailand",            lat: 15.9,  lng: 100.9,  risk: 58, scam_base: 0.05, top: "crypto" },
  MY: { name: "Malaysia",            lat: 4.2,   lng: 108.0,  risk: 60, scam_base: 0.05, top: "delivery" },
  ID: { name: "Indonesia",           lat: -0.8,  lng: 113.9,  risk: 60, scam_base: 0.07, top: "delivery" },
  PH: { name: "Philippines",         lat: 12.9,  lng: 121.8,  risk: 65, scam_base: 0.06, top: "banking" },
  SG: { name: "Singapore",           lat: 1.4,   lng: 103.8,  risk: 62, scam_base: 0.04, top: "crypto" },
  MM: { name: "Myanmar",             lat: 19.2,  lng: 96.7,   risk: 66, scam_base: 0.03, top: "banking" },
  KH: { name: "Cambodia",            lat: 13.0,  lng: 105.0,  risk: 62, scam_base: 0.02, top: "banking" },
  LA: { name: "Laos",                lat: 18.2,  lng: 103.9,  risk: 56, scam_base: 0.01, top: "banking" },
  MN: { name: "Mongolia",            lat: 46.9,  lng: 103.8,  risk: 52, scam_base: 0.01, top: "crypto" },
  BN: { name: "Brunei",              lat: 4.5,   lng: 114.7,  risk: 48, scam_base: 0.01, top: "banking" },
  TL: { name: "Timor-Leste",         lat: -8.9,  lng: 125.7,  risk: 54, scam_base: 0.01, top: "phone" },
  KP: { name: "North Korea",         lat: 40.3,  lng: 127.5,  risk: 50, scam_base: 0.01, top: "crypto" },

  // ── Oceania ───────────────────────────────────────────────────
  AU: { name: "Australia",           lat: -25.3, lng: 133.8,  risk: 60, scam_base: 0.06, top: "crypto" },
  NZ: { name: "New Zealand",         lat: -40.9, lng: 174.9,  risk: 52, scam_base: 0.02, top: "banking" },
  PG: { name: "Papua New Guinea",    lat: -6.3,  lng: 143.9,  risk: 58, scam_base: 0.01, top: "phone" },
  FJ: { name: "Fiji",                lat: -17.7, lng: 178.1,  risk: 52, scam_base: 0.01, top: "banking" },
  SB: { name: "Solomon Islands",     lat: -9.6,  lng: 160.2,  risk: 48, scam_base: 0.01, top: "phone" },
  VU: { name: "Vanuatu",             lat: -15.4, lng: 166.9,  risk: 46, scam_base: 0.01, top: "banking" },
  TO: { name: "Tonga",               lat: -21.2, lng: -175.2, risk: 44, scam_base: 0.01, top: "banking" },
  WS: { name: "Samoa",               lat: -13.8, lng: -172.1, risk: 44, scam_base: 0.01, top: "banking" },
};

const FEED_TEMPLATES = [
  { title: "Fake bank SMS campaign detected",    title_ja: "偽銀行SMSキャンペーンを検出",          desc: "Mass SMS campaign impersonating major banks urging users to verify accounts.", desc_ja: "大手銀行を装った大量SMSキャンペーンが確認されました。", type: "banking",      severity: "high" },
  { title: "Crypto investment scam surge",       title_ja: "暗号通貨投資詐欺が急増",               desc: "Social media ads promoting fake celebrity-endorsed crypto platforms.",        desc_ja: "有名人を装った偽の暗号通貨プラットフォームのSNS広告が急増。",              type: "crypto",       severity: "high" },
  { title: "Delivery notification phishing",     title_ja: "配送通知フィッシング攻撃",             desc: "Phishing emails mimicking major couriers requesting customs fee payment.",    desc_ja: "大手配送業者を装い関税支払いを求めるフィッシングメール。",                  type: "delivery",     severity: "medium" },
  { title: "Tech support phone scam active",     title_ja: "偽テクニカルサポート電話詐欺",         desc: "Callers posing as Microsoft/Apple support demanding remote access.",          desc_ja: "Microsoft/Appleサポートを装いリモートアクセスを要求する詐欺。",            type: "tech_support", severity: "medium" },
  { title: "Government impersonation scam",      title_ja: "政府機関なりすまし詐欺",              desc: "Fraudsters claiming unpaid taxes requiring cryptocurrency payment.",          desc_ja: "未払い税金として暗号通貨での支払いを求める詐欺師を確認。",                 type: "phone",        severity: "high" },
  { title: "Romance/pig-butchering scheme",      title_ja: "ロマンス詐欺（豚の屠殺）を検出",      desc: "Long-term investment confidence scams via social apps.",                      desc_ja: "SNSで偽の関係を築き投資詐欺に誘導する長期型詐欺。",                        type: "crypto",       severity: "critical" },
  { title: "QR code phishing (quishing) surge",  title_ja: "QRコードフィッシング急増",            desc: "Malicious QR codes directing to credential-harvesting sites.",               desc_ja: "悪意あるQRコードが認証情報窃取サイトに誘導しています。",                   type: "banking",      severity: "high" },
  { title: "Job offer scam targeting job seekers", title_ja: "偽求人詐欺", desc: "Fake high-paying remote jobs requiring upfront 'equipment' payment.", desc_ja: "「機器代」として前払いを要求する偽の高収入リモートワーク求人。", type: "other", severity: "medium" },
];

// ── Public simulation functions ───────────────────────────────────────────────

export function getLiveIncrement() {
  const m = timeMultiplier();
  const base = BASE_RATE * m;
  const total = Math.max(1, Math.round(base + gauss(0, 1.2)));
  return {
    total,
    sms:         Math.max(0, Math.round(total * 0.35 + gauss(0, 0.3))),
    phishing_url: Math.max(0, Math.round(total * 0.40 + gauss(0, 0.3))),
    fake_calls:  Math.max(0, Math.round(total * 0.25 + gauss(0, 0.3))),
    timestamp:   new Date().toISOString(),
  };
}

export function getTodaysTotals() {
  const now = new Date();
  const seconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const total = Math.max(0, Math.round(BASE_RATE * seconds * 0.95 + randInt(-500, 500)));
  return {
    total_today:     total,
    sms_scams:       Math.round(total * 0.35),
    phishing_urls:   Math.round(total * 0.40),
    fake_calls:      Math.round(total * 0.25),
    per_second_rate: Math.round(BASE_RATE * timeMultiplier() * 10) / 10,
    last_updated:    now.toISOString(),
  };
}

export function getHeatmapData() {
  return Object.entries(COUNTRY_DATA).map(([code, d]) => {
    const noise = uniform(0.85, 1.15);
    const count = Math.round(BASE_RATE * 86400 * d.scam_base * noise);
    const risk  = d.risk;
    const level = risk >= 75 ? "CRITICAL" : risk >= 60 ? "HIGH" : risk >= 45 ? "MEDIUM" : "LOW";
    return {
      country_code: code,
      country_name: d.name,
      lat:          d.lat,
      lng:          d.lng,
      intensity:    Math.round(d.risk) / 100,
      risk_level:   level as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      scam_count:   count,
      top_type:     d.top,
    };
  });
}

function generateWeekly(): number[] {
  const base = 86400 * BASE_RATE * 0.95;
  const today = getTodaysTotals().total_today;
  return Array.from({ length: 7 }, (_, i) =>
    i === 6 ? today : Math.round(base * uniform(0.85, 1.15))
  );
}

export function getScamTypes() {
  const totals = getTodaysTotals();
  const base   = totals.total_today;
  const weekly = generateWeekly();
  return SCAM_TYPES_META.map(t => ({
    id:          t.id,
    label:       t.label,
    label_ja:    t.label_ja,
    count:       Math.round(base * t.weight * uniform(0.97, 1.03)),
    percentage:  Math.round(t.weight * 100 * 10) / 10,
    trend:       t.trend,
    color:       t.color,
    weekly_data: weekly.map(d => Math.round(d * t.weight)),
  }));
}

export function getTrendData() {
  const base = 86400 * BASE_RATE * 0.95;
  return Array.from({ length: 30 }, (_, i) => {
    const daysAgo = 29 - i;
    const date = new Date(Date.now() - daysAgo * 86400_000);
    const factor = 1 + i * 0.004;
    const total  = Math.round(base * factor * uniform(0.88, 1.12));
    return {
      date:     date.toISOString().slice(0, 10),
      total,
      banking:  Math.round(total * 0.32),
      delivery: Math.round(total * 0.18),
      crypto:   Math.round(total * 0.25),
      phone:    Math.round(total * 0.12),
    };
  });
}

export function getRiskForCountry(countryCode: string) {
  const cc = countryCode.toUpperCase();
  const d  = COUNTRY_DATA[cc] ?? COUNTRY_DATA["US"];
  const risk  = Math.min(100, Math.max(0, d.risk + randInt(-3, 3)));
  const level = risk >= 75 ? "CRITICAL" : risk >= 60 ? "HIGH" : risk >= 45 ? "MEDIUM" : "LOW";

  const threatMap: Record<string, [string, string]> = {
    banking:      ["Banking phishing is surging in this region", "この地域では銀行フィッシングが急増しています"],
    crypto:       ["Crypto investment scams are prevalent", "暗号通貨投資詐欺が多発しています"],
    delivery:     ["Fake delivery notifications are circulating", "偽の配送通知が拡散しています"],
    phone:        ["Phone scam calls are elevated", "電話詐欺が増加しています"],
    tech_support: ["Tech support fraud calls are active", "偽テクニカルサポート詐欺が活発です"],
  };
  const [tEn, tJa] = threatMap[d.top] ?? ["General scam activity detected", "一般的な詐欺活動が検出されています"];

  const expl: Record<string, [string, string]> = {
    CRITICAL: [`Scam activity in ${d.name} is at a critical level.`, `${d.name}での詐欺活動は危機的レベルです。`],
    HIGH:     [`High scam activity detected in ${d.name}. Stay alert.`, `${d.name}で高レベルの詐欺活動が検出されています。`],
    MEDIUM:   [`Moderate scam activity in ${d.name}.`, `${d.name}では中程度の詐欺活動があります。`],
    LOW:      [`Low scam activity in ${d.name}.`, `${d.name}では詐欺活動は低レベルです。`],
  };
  const [exEn, exJa] = expl[level];

  return {
    level:         level as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    score:         risk,
    region:        d.name,
    country_code:  cc,
    top_threats:   [tEn, "Verify all unsolicited contacts", "Never share OTP codes"],
    top_threats_ja:[tJa, "未確認の連絡は必ず確認する", "OTPコードを絶対に共有しない"],
    explanation:   exEn,
    explanation_ja: exJa,
    trend:         risk >= 60 ? "rising" : "stable",
  };
}

export function getFeed(limit = 10) {
  const now  = Date.now();
  const codes = Object.keys(COUNTRY_DATA);
  return sample(FEED_TEMPLATES, Math.min(limit, FEED_TEMPLATES.length)).map((t, i) => {
    const minsAgo = randInt(2, 180);
    const cc      = codes[Math.floor(Math.random() * codes.length)];
    return {
      id:             `feed-${i}-${now}`,
      timestamp:      new Date(now - minsAgo * 60_000).toISOString(),
      title:          t.title,
      title_ja:       t.title_ja,
      description:    t.desc,
      description_ja: t.desc_ja,
      scam_type:      t.type,
      severity:       t.severity as "low" | "medium" | "high" | "critical",
      region:         COUNTRY_DATA[cc].name,
      country_code:   cc,
      url:            null,
    };
  }).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function getClusters() {
  const now = Date.now();
  return [
    { id: "c1", name: "North America Banking Cluster", center_lat: 40.7,  center_lng: -74.0, radius_km: 800, severity: "critical", count: 12400, scam_type: "banking",  detected_at: new Date(now - 3 * 3600_000).toISOString(), description: "Coordinated bank impersonation campaign" },
    { id: "c2", name: "East Asia Crypto Cluster",       center_lat: 31.2,  center_lng: 121.5, radius_km: 600, severity: "high",     count: 8900,  scam_type: "crypto",   detected_at: new Date(now - 7 * 3600_000).toISOString(), description: "Fake exchange platform phishing" },
    { id: "c3", name: "West Africa Advance Fee",         center_lat: 6.5,   center_lng: 3.4,   radius_km: 900, severity: "high",     count: 6200,  scam_type: "other",    detected_at: new Date(now - 12 * 3600_000).toISOString(), description: "Business email compromise and advance fee fraud" },
    { id: "c4", name: "South Asia SMS Cluster",          center_lat: 19.1,  center_lng: 72.9,  radius_km: 700, severity: "high",     count: 9800,  scam_type: "phone",    detected_at: new Date(now - 5 * 3600_000).toISOString(), description: "Mass SMS phishing targeting banking customers" },
    { id: "c5", name: "Europe Delivery Scam Cluster",    center_lat: 51.5,  center_lng: -0.1,  radius_km: 500, severity: "medium",   count: 4100,  scam_type: "delivery", detected_at: new Date(now - 9 * 3600_000).toISOString(), description: "Fake parcel delivery notifications" },
  ];
}
