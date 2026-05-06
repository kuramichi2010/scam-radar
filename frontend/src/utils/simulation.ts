/**
 * ScamRadar — Real-world data simulation
 *
 * Data sources:
 *  - FBI IC3 2024 Annual Report ($16.6B losses, 859K complaints)
 *  - GASA Global State of Scams 2024 ($1.03 trillion globally)
 *  - ACCC Scamwatch 2024 (AU: $2.03B AUD)
 *  - UK Finance Annual Fraud Report 2025 (UK: £1.17B in 2024)
 *  - Japan NPA / GASA 2024 State of Scams Japan ($22B, ¥71.88B special fraud)
 *  - India MHA Cybercrime Report 2024 (₹22,845 crore / $2.7B)
 *  - UN OHCHR — Southeast Asia scam compounds (220K+ trafficking victims)
 *  - TRM Labs / Chainalysis Crypto Crime 2025 ($17B crypto losses)
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

// ── Constants (grounded in real 2024 data) ────────────────────────────────────
//
// GASA 2024: $1.03T stolen / ~$700 avg loss = ~1.47B events/year ÷ 86400s ≈ 47/s
// FBI IC3 2024: 859,532 US complaints (~1% reporting rate) → ~860K/1% = 86M US events/yr
// Extrapolated globally: ~47 scam events per second

const BASE_RATE = 47; // attempts per second (global, all types)

// ── Scam type breakdown — FBI IC3 2024 + GASA 2024 ───────────────────────────
// Investment/Crypto: $6.57B (39% of losses), rising fast (+29% YoY cases)
// BEC/Banking phishing: $2.77B (17%), mapped to "banking"
// Tech support: $1.46B (9%), up from $924M in 2023
// Phone/voice: $1.1B (AI voice cloning surging)
// Delivery: high in Asia; Japan delivery scams dominant
// Weights below are by complaint volume (not loss value)

export const SCAM_TYPES_META = [
  { id: "crypto",       label: "Investment / Crypto Scams",       label_ja: "投資・暗号通貨詐欺",          weight: 0.30, color: "#f97316", trend: "up"     },
  { id: "banking",      label: "Banking / Phishing (BEC)",        label_ja: "銀行フィッシング・BEC",        weight: 0.25, color: "#ef4444", trend: "stable" },
  { id: "phone",        label: "Phone / AI Voice Scams",          label_ja: "電話・AIボイス詐欺",           weight: 0.15, color: "#a855f7", trend: "up"     },
  { id: "delivery",     label: "Delivery / Parcel Scams",         label_ja: "配送・荷物詐欺",               weight: 0.15, color: "#eab308", trend: "stable" },
  { id: "tech_support", label: "Fake Tech Support",               label_ja: "偽テクニカルサポート",          weight: 0.09, color: "#06b6d4", trend: "up"     },
  { id: "other",        label: "Romance / Other Scams",           label_ja: "ロマンス・その他の詐欺",        weight: 0.06, color: "#64748b", trend: "up"     },
] as const;

// ── Country risk data — anchored to real 2024 reports ────────────────────────
//
// risk: 0–100 composite score
//   (loss per capita × volume × prevalence × underreporting factor)
// scam_base: relative daily activity multiplier vs BASE_RATE
// top: dominant scam type per country (source: IC3, NPA, ACCC, GASA country reports)

export const COUNTRY_DATA: Record<string, { name: string; lat: number; lng: number; risk: number; scam_base: number; top: string }> = {

  // ── Americas ──────────────────────────────────────────────────
  // US: FBI IC3 2024 — $16.6B losses, 859K complaints, avg loss $19,372
  US: { name: "United States",       lat: 37.1,  lng: -95.7,  risk: 82, scam_base: 0.28, top: "crypto"   },
  // Canada: avg loss CAD $503M/yr; phone/investment scams dominant
  CA: { name: "Canada",              lat: 56.1,  lng: -106.3, risk: 60, scam_base: 0.07, top: "phone"    },
  // Brazil: GASA — near-daily scam exposure; 25% victim rate
  BR: { name: "Brazil",              lat: -14.2, lng: -51.9,  risk: 76, scam_base: 0.11, top: "banking"  },
  // Mexico: banking fraud surging; cartels use digital fraud
  MX: { name: "Mexico",              lat: 23.6,  lng: -102.6, risk: 67, scam_base: 0.08, top: "phone"    },
  AR: { name: "Argentina",           lat: -38.4, lng: -63.6,  risk: 63, scam_base: 0.05, top: "banking"  },
  CO: { name: "Colombia",            lat: 4.6,   lng: -74.3,  risk: 66, scam_base: 0.04, top: "phone"    },
  CL: { name: "Chile",               lat: -35.7, lng: -71.5,  risk: 58, scam_base: 0.03, top: "banking"  },
  PE: { name: "Peru",                lat: -9.2,  lng: -75.0,  risk: 63, scam_base: 0.03, top: "banking"  },
  VE: { name: "Venezuela",           lat: 6.4,   lng: -66.6,  risk: 70, scam_base: 0.04, top: "other"    },
  EC: { name: "Ecuador",             lat: -1.8,  lng: -78.2,  risk: 61, scam_base: 0.02, top: "banking"  },
  BO: { name: "Bolivia",             lat: -16.3, lng: -63.6,  risk: 58, scam_base: 0.02, top: "phone"    },
  PY: { name: "Paraguay",            lat: -23.4, lng: -58.4,  risk: 60, scam_base: 0.02, top: "banking"  },
  UY: { name: "Uruguay",             lat: -32.5, lng: -55.8,  risk: 52, scam_base: 0.01, top: "banking"  },
  GY: { name: "Guyana",              lat: 4.9,   lng: -59.0,  risk: 58, scam_base: 0.01, top: "other"    },
  SR: { name: "Suriname",            lat: 3.9,   lng: -56.0,  risk: 55, scam_base: 0.01, top: "banking"  },
  GT: { name: "Guatemala",           lat: 15.8,  lng: -90.2,  risk: 64, scam_base: 0.02, top: "phone"    },
  HN: { name: "Honduras",            lat: 15.2,  lng: -86.2,  risk: 65, scam_base: 0.02, top: "phone"    },
  SV: { name: "El Salvador",         lat: 13.8,  lng: -88.9,  risk: 62, scam_base: 0.01, top: "banking"  },
  NI: { name: "Nicaragua",           lat: 12.9,  lng: -85.2,  risk: 61, scam_base: 0.01, top: "phone"    },
  CR: { name: "Costa Rica",          lat: 9.7,   lng: -83.8,  risk: 56, scam_base: 0.01, top: "banking"  },
  PA: { name: "Panama",              lat: 8.5,   lng: -80.8,  risk: 60, scam_base: 0.02, top: "banking"  },
  CU: { name: "Cuba",                lat: 22.0,  lng: -80.0,  risk: 45, scam_base: 0.01, top: "phone"    },
  DO: { name: "Dominican Republic",  lat: 19.0,  lng: -70.2,  risk: 62, scam_base: 0.02, top: "banking"  },
  HT: { name: "Haiti",               lat: 19.1,  lng: -72.3,  risk: 64, scam_base: 0.01, top: "phone"    },
  // Jamaica: "Lotto scam" capital; GASA ranks high
  JM: { name: "Jamaica",             lat: 18.1,  lng: -77.3,  risk: 71, scam_base: 0.02, top: "other"    },
  TT: { name: "Trinidad & Tobago",   lat: 10.7,  lng: -61.2,  risk: 60, scam_base: 0.01, top: "banking"  },
  BB: { name: "Barbados",            lat: 13.2,  lng: -59.6,  risk: 50, scam_base: 0.01, top: "banking"  },
  BS: { name: "Bahamas",             lat: 25.0,  lng: -77.4,  risk: 52, scam_base: 0.01, top: "banking"  },
  BZ: { name: "Belize",              lat: 17.2,  lng: -88.5,  risk: 57, scam_base: 0.01, top: "phone"    },

  // ── Europe ────────────────────────────────────────────────────
  // UK: UK Finance 2025 — £1.17B in 2024; APP fraud £450.7M
  GB: { name: "United Kingdom",      lat: 55.4,  lng: -3.4,   risk: 77, scam_base: 0.14, top: "banking"  },
  // Germany: BEC and banking phishing dominant
  DE: { name: "Germany",             lat: 51.2,  lng: 10.5,   risk: 52, scam_base: 0.06, top: "banking"  },
  FR: { name: "France",              lat: 46.2,  lng: 2.2,    risk: 54, scam_base: 0.05, top: "banking"  },
  IT: { name: "Italy",               lat: 41.9,  lng: 12.6,   risk: 57, scam_base: 0.05, top: "banking"  },
  ES: { name: "Spain",               lat: 40.5,  lng: -3.7,   risk: 55, scam_base: 0.04, top: "banking"  },
  NL: { name: "Netherlands",         lat: 52.1,  lng: 5.3,    risk: 54, scam_base: 0.04, top: "banking"  },
  SE: { name: "Sweden",              lat: 60.1,  lng: 18.6,   risk: 46, scam_base: 0.03, top: "banking"  },
  // Russia: Major cybercrime origin; state-affiliated groups
  RU: { name: "Russia",              lat: 61.5,  lng: 105.3,  risk: 83, scam_base: 0.12, top: "crypto"   },
  // Ukraine: Conflict-zone cybercrime surge
  UA: { name: "Ukraine",             lat: 48.4,  lng: 31.2,   risk: 72, scam_base: 0.08, top: "crypto"   },
  PL: { name: "Poland",              lat: 52.1,  lng: 19.1,   risk: 57, scam_base: 0.04, top: "banking"  },
  BE: { name: "Belgium",             lat: 50.5,  lng: 4.5,    risk: 52, scam_base: 0.03, top: "banking"  },
  AT: { name: "Austria",             lat: 47.5,  lng: 14.6,   risk: 48, scam_base: 0.02, top: "banking"  },
  CH: { name: "Switzerland",         lat: 46.8,  lng: 8.2,    risk: 50, scam_base: 0.02, top: "crypto"   },
  NO: { name: "Norway",              lat: 60.5,  lng: 8.5,    risk: 44, scam_base: 0.02, top: "banking"  },
  DK: { name: "Denmark",             lat: 56.3,  lng: 10.0,   risk: 45, scam_base: 0.02, top: "banking"  },
  FI: { name: "Finland",             lat: 64.0,  lng: 26.0,   risk: 42, scam_base: 0.02, top: "banking"  },
  PT: { name: "Portugal",            lat: 38.7,  lng: -9.1,   risk: 52, scam_base: 0.02, top: "banking"  },
  GR: { name: "Greece",              lat: 39.1,  lng: 21.8,   risk: 56, scam_base: 0.02, top: "banking"  },
  CZ: { name: "Czech Republic",      lat: 50.1,  lng: 15.5,   risk: 50, scam_base: 0.02, top: "banking"  },
  RO: { name: "Romania",             lat: 45.9,  lng: 24.1,   risk: 63, scam_base: 0.03, top: "banking"  },
  HU: { name: "Hungary",             lat: 47.2,  lng: 19.3,   risk: 54, scam_base: 0.02, top: "banking"  },
  BG: { name: "Bulgaria",            lat: 42.7,  lng: 25.5,   risk: 59, scam_base: 0.02, top: "banking"  },
  HR: { name: "Croatia",             lat: 45.1,  lng: 16.4,   risk: 51, scam_base: 0.02, top: "banking"  },
  SK: { name: "Slovakia",            lat: 48.7,  lng: 19.7,   risk: 50, scam_base: 0.01, top: "banking"  },
  IE: { name: "Ireland",             lat: 53.4,  lng: -8.2,   risk: 56, scam_base: 0.02, top: "banking"  },
  BY: { name: "Belarus",             lat: 53.7,  lng: 28.0,   risk: 65, scam_base: 0.02, top: "crypto"   },
  RS: { name: "Serbia",              lat: 44.0,  lng: 21.0,   risk: 59, scam_base: 0.02, top: "banking"  },
  LT: { name: "Lithuania",           lat: 55.2,  lng: 24.0,   risk: 53, scam_base: 0.01, top: "banking"  },
  LV: { name: "Latvia",              lat: 56.9,  lng: 24.9,   risk: 53, scam_base: 0.01, top: "banking"  },
  EE: { name: "Estonia",             lat: 58.6,  lng: 25.0,   risk: 49, scam_base: 0.01, top: "banking"  },
  BA: { name: "Bosnia & Herzegovina",lat: 44.2,  lng: 17.9,   risk: 57, scam_base: 0.01, top: "banking"  },
  MD: { name: "Moldova",             lat: 47.4,  lng: 28.4,   risk: 63, scam_base: 0.01, top: "banking"  },
  AL: { name: "Albania",             lat: 41.2,  lng: 20.2,   risk: 59, scam_base: 0.01, top: "banking"  },
  MK: { name: "North Macedonia",     lat: 41.6,  lng: 21.7,   risk: 57, scam_base: 0.01, top: "banking"  },
  ME: { name: "Montenegro",          lat: 42.5,  lng: 19.3,   risk: 55, scam_base: 0.01, top: "banking"  },
  SI: { name: "Slovenia",            lat: 46.1,  lng: 15.0,   risk: 47, scam_base: 0.01, top: "banking"  },
  CY: { name: "Cyprus",              lat: 35.1,  lng: 33.4,   risk: 59, scam_base: 0.01, top: "banking"  },
  MT: { name: "Malta",               lat: 35.9,  lng: 14.5,   risk: 53, scam_base: 0.01, top: "banking"  },
  LU: { name: "Luxembourg",          lat: 49.8,  lng: 6.1,    risk: 45, scam_base: 0.01, top: "banking"  },
  IS: { name: "Iceland",             lat: 65.0,  lng: -18.0,  risk: 38, scam_base: 0.01, top: "banking"  },
  GE: { name: "Georgia",             lat: 42.3,  lng: 43.4,   risk: 61, scam_base: 0.01, top: "crypto"   },
  AM: { name: "Armenia",             lat: 40.1,  lng: 45.0,   risk: 58, scam_base: 0.01, top: "crypto"   },
  AZ: { name: "Azerbaijan",          lat: 40.1,  lng: 47.6,   risk: 60, scam_base: 0.01, top: "banking"  },

  // ── Middle East & North Africa ────────────────────────────────
  // Egypt: phone impersonation scams dominant; low reporting
  EG: { name: "Egypt",               lat: 26.8,  lng: 30.8,   risk: 67, scam_base: 0.05, top: "phone"    },
  TR: { name: "Turkey",              lat: 38.9,  lng: 35.2,   risk: 62, scam_base: 0.05, top: "crypto"   },
  SA: { name: "Saudi Arabia",        lat: 24.7,  lng: 46.7,   risk: 64, scam_base: 0.04, top: "banking"  },
  AE: { name: "UAE",                 lat: 24.0,  lng: 54.0,   risk: 62, scam_base: 0.03, top: "crypto"   },
  IR: { name: "Iran",                lat: 32.4,  lng: 53.7,   risk: 68, scam_base: 0.04, top: "crypto"   },
  IQ: { name: "Iraq",                lat: 33.2,  lng: 43.7,   risk: 67, scam_base: 0.03, top: "phone"    },
  IL: { name: "Israel",              lat: 31.0,  lng: 35.0,   risk: 63, scam_base: 0.03, top: "banking"  },
  MA: { name: "Morocco",             lat: 31.8,  lng: -7.1,   risk: 63, scam_base: 0.03, top: "banking"  },
  DZ: { name: "Algeria",             lat: 28.0,  lng: 1.7,    risk: 61, scam_base: 0.03, top: "banking"  },
  LY: { name: "Libya",               lat: 26.3,  lng: 17.2,   risk: 70, scam_base: 0.02, top: "other"    },
  TN: { name: "Tunisia",             lat: 34.0,  lng: 9.0,    risk: 61, scam_base: 0.02, top: "banking"  },
  JO: { name: "Jordan",              lat: 31.2,  lng: 36.5,   risk: 59, scam_base: 0.02, top: "banking"  },
  LB: { name: "Lebanon",             lat: 33.9,  lng: 35.9,   risk: 68, scam_base: 0.02, top: "banking"  },
  SY: { name: "Syria",               lat: 34.8,  lng: 38.9,   risk: 70, scam_base: 0.02, top: "other"    },
  YE: { name: "Yemen",               lat: 15.6,  lng: 48.5,   risk: 68, scam_base: 0.02, top: "phone"    },
  QA: { name: "Qatar",               lat: 25.4,  lng: 51.2,   risk: 56, scam_base: 0.01, top: "crypto"   },
  KW: { name: "Kuwait",              lat: 29.3,  lng: 47.7,   risk: 59, scam_base: 0.01, top: "banking"  },
  OM: { name: "Oman",                lat: 21.5,  lng: 57.0,   risk: 55, scam_base: 0.01, top: "banking"  },
  BH: { name: "Bahrain",             lat: 26.0,  lng: 50.6,   risk: 57, scam_base: 0.01, top: "banking"  },
  PS: { name: "Palestine",           lat: 32.0,  lng: 35.3,   risk: 63, scam_base: 0.01, top: "banking"  },
  SD: { name: "Sudan",               lat: 12.9,  lng: 30.2,   risk: 67, scam_base: 0.02, top: "other"    },

  // ── Sub-Saharan Africa ────────────────────────────────────────
  // Nigeria: GASA #1 in Africa; advance fee, romance, BEC; FBI IC3 major origin country
  NG: { name: "Nigeria",             lat: 9.1,   lng: 8.7,    risk: 88, scam_base: 0.10, top: "other"    },
  // South Africa: banking fraud $500M+/yr; phishing surge
  ZA: { name: "South Africa",        lat: -30.6, lng: 22.9,   risk: 72, scam_base: 0.07, top: "banking"  },
  // Kenya: mobile money (M-Pesa) scams dominant; GASA shopping scams #1
  KE: { name: "Kenya",               lat: -0.2,  lng: 37.9,   risk: 74, scam_base: 0.04, top: "banking"  },
  // Ghana: GASA #2 in Africa for scam origin; 419/romance scams
  GH: { name: "Ghana",               lat: 7.9,   lng: -1.0,   risk: 76, scam_base: 0.04, top: "other"    },
  ET: { name: "Ethiopia",            lat: 8.6,   lng: 39.6,   risk: 64, scam_base: 0.03, top: "phone"    },
  TZ: { name: "Tanzania",            lat: -6.4,  lng: 34.9,   risk: 64, scam_base: 0.02, top: "phone"    },
  ZW: { name: "Zimbabwe",            lat: -20.0, lng: 29.2,   risk: 68, scam_base: 0.02, top: "banking"  },
  CI: { name: "Ivory Coast",         lat: 6.5,   lng: -6.0,   risk: 72, scam_base: 0.03, top: "other"    },
  CM: { name: "Cameroon",            lat: 3.8,   lng: 11.5,   risk: 70, scam_base: 0.03, top: "other"    },
  SN: { name: "Senegal",             lat: 14.5,  lng: -14.5,  risk: 65, scam_base: 0.02, top: "banking"  },
  UG: { name: "Uganda",              lat: 1.4,   lng: 32.3,   risk: 66, scam_base: 0.02, top: "phone"    },
  AO: { name: "Angola",              lat: -11.2, lng: 17.9,   risk: 66, scam_base: 0.02, top: "banking"  },
  MZ: { name: "Mozambique",          lat: -18.7, lng: 35.5,   risk: 62, scam_base: 0.02, top: "phone"    },
  ZM: { name: "Zambia",              lat: -13.1, lng: 27.8,   risk: 62, scam_base: 0.01, top: "banking"  },
  CD: { name: "DR Congo",            lat: -4.0,  lng: 21.8,   risk: 68, scam_base: 0.03, top: "other"    },
  ML: { name: "Mali",                lat: 17.6,  lng: -2.0,   risk: 64, scam_base: 0.02, top: "phone"    },
  BF: { name: "Burkina Faso",        lat: 12.4,  lng: -1.6,   risk: 62, scam_base: 0.01, top: "phone"    },
  NE: { name: "Niger",               lat: 17.6,  lng: 8.1,    risk: 60, scam_base: 0.01, top: "phone"    },
  TD: { name: "Chad",                lat: 15.5,  lng: 18.7,   risk: 62, scam_base: 0.01, top: "phone"    },
  RW: { name: "Rwanda",              lat: -1.9,  lng: 29.9,   risk: 58, scam_base: 0.01, top: "banking"  },
  MG: { name: "Madagascar",          lat: -20.2, lng: 44.5,   risk: 60, scam_base: 0.01, top: "phone"    },
  MW: { name: "Malawi",              lat: -13.3, lng: 34.3,   risk: 60, scam_base: 0.01, top: "phone"    },
  NA: { name: "Namibia",             lat: -22.0, lng: 17.1,   risk: 57, scam_base: 0.01, top: "banking"  },
  BW: { name: "Botswana",            lat: -22.3, lng: 24.7,   risk: 55, scam_base: 0.01, top: "banking"  },
  SO: { name: "Somalia",             lat: 6.0,   lng: 46.2,   risk: 74, scam_base: 0.02, top: "other"    },
  LR: { name: "Liberia",             lat: 6.4,   lng: -9.4,   risk: 68, scam_base: 0.01, top: "other"    },
  SL: { name: "Sierra Leone",        lat: 8.5,   lng: -11.8,  risk: 67, scam_base: 0.01, top: "other"    },
  GN: { name: "Guinea",              lat: 11.0,  lng: -10.9,  risk: 66, scam_base: 0.01, top: "other"    },
  BJ: { name: "Benin",               lat: 9.3,   lng: 2.3,    risk: 64, scam_base: 0.01, top: "banking"  },
  TG: { name: "Togo",                lat: 8.6,   lng: 0.8,    risk: 64, scam_base: 0.01, top: "banking"  },
  GA: { name: "Gabon",               lat: -0.8,  lng: 11.6,   risk: 60, scam_base: 0.01, top: "banking"  },
  CG: { name: "Congo",               lat: -0.2,  lng: 15.8,   risk: 64, scam_base: 0.01, top: "other"    },
  MR: { name: "Mauritania",          lat: 21.0,  lng: -10.9,  risk: 60, scam_base: 0.01, top: "phone"    },
  GM: { name: "Gambia",              lat: 13.5,  lng: -15.3,  risk: 64, scam_base: 0.01, top: "other"    },
  ER: { name: "Eritrea",             lat: 15.2,  lng: 39.8,   risk: 60, scam_base: 0.01, top: "phone"    },
  BI: { name: "Burundi",             lat: -3.4,  lng: 30.0,   risk: 62, scam_base: 0.01, top: "phone"    },
  SS: { name: "South Sudan",         lat: 7.9,   lng: 30.2,   risk: 66, scam_base: 0.01, top: "other"    },
  DJ: { name: "Djibouti",            lat: 11.8,  lng: 42.6,   risk: 60, scam_base: 0.01, top: "phone"    },
  SZ: { name: "Eswatini",            lat: -26.5, lng: 31.5,   risk: 58, scam_base: 0.01, top: "banking"  },
  LS: { name: "Lesotho",             lat: -29.6, lng: 28.2,   risk: 56, scam_base: 0.01, top: "banking"  },
  CF: { name: "Central African Rep.",lat: 6.6,   lng: 20.9,   risk: 64, scam_base: 0.01, top: "other"    },
  GW: { name: "Guinea-Bissau",       lat: 11.8,  lng: -15.2,  risk: 64, scam_base: 0.01, top: "other"    },
  MU: { name: "Mauritius",           lat: -20.3, lng: 57.6,   risk: 55, scam_base: 0.01, top: "banking"  },
  CV: { name: "Cape Verde",          lat: 16.0,  lng: -24.0,  risk: 52, scam_base: 0.01, top: "banking"  },

  // ── South & Central Asia ──────────────────────────────────────
  // India: MHA 2024 — ₹22,845 crore ($2.7B), +206% YoY; digital arrest scams, UPI fraud
  IN: { name: "India",               lat: 20.6,  lng: 79.0,   risk: 80, scam_base: 0.22, top: "phone"    },
  // Pakistan: phone/SIM swap scams dominant
  PK: { name: "Pakistan",            lat: 30.4,  lng: 69.3,   risk: 69, scam_base: 0.06, top: "phone"    },
  BD: { name: "Bangladesh",          lat: 23.7,  lng: 90.4,   risk: 66, scam_base: 0.04, top: "banking"  },
  AF: { name: "Afghanistan",         lat: 33.9,  lng: 67.7,   risk: 67, scam_base: 0.02, top: "phone"    },
  NP: { name: "Nepal",               lat: 28.4,  lng: 84.1,   risk: 62, scam_base: 0.02, top: "banking"  },
  LK: { name: "Sri Lanka",           lat: 7.9,   lng: 80.7,   risk: 62, scam_base: 0.02, top: "banking"  },
  KZ: { name: "Kazakhstan",          lat: 48.0,  lng: 66.9,   risk: 63, scam_base: 0.02, top: "crypto"   },
  UZ: { name: "Uzbekistan",          lat: 41.4,  lng: 64.6,   risk: 61, scam_base: 0.02, top: "banking"  },
  TJ: { name: "Tajikistan",          lat: 38.9,  lng: 71.3,   risk: 58, scam_base: 0.01, top: "banking"  },
  KG: { name: "Kyrgyzstan",          lat: 41.2,  lng: 74.8,   risk: 58, scam_base: 0.01, top: "banking"  },
  TM: { name: "Turkmenistan",        lat: 40.0,  lng: 59.0,   risk: 56, scam_base: 0.01, top: "banking"  },
  BT: { name: "Bhutan",              lat: 27.5,  lng: 90.4,   risk: 44, scam_base: 0.01, top: "banking"  },
  MV: { name: "Maldives",            lat: 3.2,   lng: 73.2,   risk: 50, scam_base: 0.01, top: "banking"  },

  // ── East & Southeast Asia ─────────────────────────────────────
  // China: massive pig butchering origin; crypto fraud hub; IC3 major complaint origin
  CN: { name: "China",               lat: 35.9,  lng: 104.2,  risk: 78, scam_base: 0.22, top: "crypto"   },
  // Japan: GASA 2024 — $22B / 39% of citizens victimized; NPA ¥71.88B special fraud (record)
  JP: { name: "Japan",               lat: 36.2,  lng: 138.3,  risk: 75, scam_base: 0.11, top: "delivery" },
  // South Korea: GASA near-daily; 보이스피싱 (voice phishing) epidemic; 역대 최고
  KR: { name: "South Korea",         lat: 35.9,  lng: 127.8,  risk: 74, scam_base: 0.06, top: "delivery" },
  TW: { name: "Taiwan",              lat: 23.7,  lng: 121.0,  risk: 60, scam_base: 0.03, top: "delivery" },
  VN: { name: "Vietnam",             lat: 14.1,  lng: 108.3,  risk: 72, scam_base: 0.05, top: "banking"  },
  TH: { name: "Thailand",            lat: 15.9,  lng: 100.9,  risk: 68, scam_base: 0.05, top: "crypto"   },
  MY: { name: "Malaysia",            lat: 4.2,   lng: 108.0,  risk: 66, scam_base: 0.05, top: "delivery" },
  ID: { name: "Indonesia",           lat: -0.8,  lng: 113.9,  risk: 64, scam_base: 0.07, top: "delivery" },
  PH: { name: "Philippines",         lat: 12.9,  lng: 121.8,  risk: 70, scam_base: 0.06, top: "banking"  },
  // Singapore: high-value crypto targets; GASA shows rising victim rates
  SG: { name: "Singapore",           lat: 1.4,   lng: 103.8,  risk: 70, scam_base: 0.04, top: "crypto"   },
  // Myanmar: UN — 120,000 trafficked into scam compounds; pig butchering hub (40% GDP)
  MM: { name: "Myanmar",             lat: 19.2,  lng: 96.7,   risk: 95, scam_base: 0.06, top: "crypto"   },
  // Cambodia: 100,000 trafficked; DOJ seized $15B Bitcoin Oct 2025 from pig butchering ops
  KH: { name: "Cambodia",            lat: 13.0,  lng: 105.0,  risk: 90, scam_base: 0.05, top: "crypto"   },
  // Laos: scam compounds along Mekong; Golden Triangle SEZ
  LA: { name: "Laos",                lat: 18.2,  lng: 103.9,  risk: 78, scam_base: 0.03, top: "crypto"   },
  MN: { name: "Mongolia",            lat: 46.9,  lng: 103.8,  risk: 54, scam_base: 0.01, top: "crypto"   },
  BN: { name: "Brunei",              lat: 4.5,   lng: 114.7,  risk: 50, scam_base: 0.01, top: "banking"  },
  TL: { name: "Timor-Leste",         lat: -8.9,  lng: 125.7,  risk: 56, scam_base: 0.01, top: "phone"    },
  // North Korea: Lazarus Group — $1.5B Bybit hack (Feb 2025); $2B total crypto in 2025
  KP: { name: "North Korea",         lat: 40.3,  lng: 127.5,  risk: 87, scam_base: 0.03, top: "crypto"   },

  // ── Oceania ───────────────────────────────────────────────────
  // Australia: ACCC/Scamwatch 2024 — $2.03B AUD; investment scams $945M
  AU: { name: "Australia",           lat: -25.3, lng: 133.8,  risk: 71, scam_base: 0.07, top: "crypto"   },
  NZ: { name: "New Zealand",         lat: -40.9, lng: 174.9,  risk: 58, scam_base: 0.02, top: "banking"  },
  PG: { name: "Papua New Guinea",    lat: -6.3,  lng: 143.9,  risk: 60, scam_base: 0.01, top: "phone"    },
  FJ: { name: "Fiji",                lat: -17.7, lng: 178.1,  risk: 54, scam_base: 0.01, top: "banking"  },
  SB: { name: "Solomon Islands",     lat: -9.6,  lng: 160.2,  risk: 50, scam_base: 0.01, top: "phone"    },
  VU: { name: "Vanuatu",             lat: -15.4, lng: 166.9,  risk: 48, scam_base: 0.01, top: "banking"  },
  TO: { name: "Tonga",               lat: -21.2, lng: -175.2, risk: 46, scam_base: 0.01, top: "banking"  },
  WS: { name: "Samoa",               lat: -13.8, lng: -172.1, risk: 46, scam_base: 0.01, top: "banking"  },
};

// ── Real incident feed templates ──────────────────────────────────────────────
// Sourced from publicly reported events through mid-2025

const FEED_TEMPLATES = [
  {
    title:    "North Korea Lazarus steals $1.5B from Bybit",
    title_ja: "北朝鮮ラザルス、Bybitから$15億窃取",
    desc:     "Lazarus Group (DPRK) exploited Bybit's Safe multisig infrastructure in the largest crypto heist in history. ETH laundered through THORChain mixer. (Feb 2025)",
    desc_ja:  "北朝鮮ラザルスグループがBybitのSafe署名インフラを悪用し、史上最大の暗号通貨窃盗を実行。ETHはTHORChainで洗浄。（2025年2月）",
    type: "crypto", severity: "critical",
  },
  {
    title:    "AI deepfake Zoom calls target crypto executives",
    title_ja: "AIディープフェイクZoom通話で暗号資産幹部を標的に",
    desc:     "UNC1069 (North Korea-linked) uses AI-generated deepfake video of known industry figures in Zoom meetings to deploy malware and steal credentials from fintech firms. (2025)",
    desc_ja:  "北朝鮮系UNC1069グループが業界著名人のAIディープフェイク動画を使ったZoom会議でマルウェアを展開し、Fintech企業から認証情報を窃取。（2025年）",
    type: "crypto", severity: "critical",
  },
  {
    title:    "India 'Digital Arrest' scam — $2.7B lost in 2024",
    title_ja: "インド「デジタル逮捕」詐欺 — 2024年に$27億の被害",
    desc:     "India MHA 2024: ₹22,845 crore ($2.7B) lost to cybercrime, +206% YoY. 'Digital arrest' scam has police/CBI impersonators threaten victims over video calls, extorting large sums.",
    desc_ja:  "インド内務省2024年報告：サイバー犯罪被害₹22,845億円（前年比+206%）。「デジタル逮捕」詐欺は警察・CBI職員を装いビデオ通話で恐喝。",
    type: "phone", severity: "critical",
  },
  {
    title:    "Japan special fraud hits record ¥71.88B in 2024",
    title_ja: "日本の特殊詐欺、2024年に過去最高の718億円",
    desc:     "Japan NPA: Special fraud losses reached ¥71.88 billion in 2024 — the worst annual total ever. GASA 2024 estimates total scam losses at $22B; 39% of Japanese have been victimized.",
    desc_ja:  "警察庁発表：2024年の特殊詐欺被害額が718億円に達し過去最悪を更新。GASA推計では日本の詐欺総被害額は$220億、国民の39%が被害経験。",
    type: "banking", severity: "critical",
  },
  {
    title:    "DOJ seizes ~$15B in pig-butchering Bitcoin",
    title_ja: "米司法省、豚の屠殺詐欺関連ビットコインを$150億押収",
    desc:     "Oct 2025: DOJ filed its largest-ever forfeiture action, seizing ~$15B in BTC allegedly from pig-butchering scam compounds in Cambodia and Myanmar operating with trafficked labor.",
    desc_ja:  "2025年10月：司法省が史上最大規模の没収手続きを申請。カンボジア・ミャンマーの人身売買被害者を使った豚の屠殺詐欺拠点に関連するBTCを$150億押収。",
    type: "crypto", severity: "critical",
  },
  {
    title:    "Southeast Asia scam compounds: 220K+ trafficking victims",
    title_ja: "東南アジア詐欺拠点：22万人超が人身売買被害",
    desc:     "UN OHCHR: 120,000 people trafficked into Myanmar scam compounds + 100,000 in Cambodia. Online scam industry represents ~40% of combined GDP of Myanmar, Laos, Cambodia. (2025)",
    desc_ja:  "国連人権高等弁務官：ミャンマーに12万人、カンボジアに10万人が詐欺拠点に強制連行。オンライン詐欺産業はミャンマー・ラオス・カンボジアの合計GDPの約40%相当。",
    type: "other", severity: "critical",
  },
  {
    title:    "Coinbase insider breach: up to $400M extortion attempt",
    title_ja: "Coinbase内部者情報漏洩 — 最大$4億の恐喝未遂",
    desc:     "May 2025: Coinbase insiders bribed to leak customer data. Attackers demanded $20M ransom; Coinbase refused. Estimated remediation cost $180–400M. Affected ~1% of monthly active users.",
    desc_ja:  "2025年5月：Coinbase内部者が顧客データ漏洩の対価に賄賂。攻撃者は$2000万の身代金を要求するも拒否。対応費用$1.8〜4億。月間アクティブユーザーの約1%に影響。",
    type: "crypto", severity: "high",
  },
  {
    title:    "Global fraud losses hit $1 trillion — GASA 2024",
    title_ja: "世界詐欺被害が1兆ドル超 — GASA 2024年報告",
    desc:     "GASA Global State of Scams 2024: $1.03 trillion stolen in 12 months from 58,329 respondents across multiple countries. Brazil, Hong Kong, South Korea face near-daily scam exposure.",
    desc_ja:  "GASA 2024年報告：12ヶ月で$1.03兆が詐欺で失われた。ブラジル、香港、韓国では毎日のように詐欺被害が発生している。",
    type: "other", severity: "critical",
  },
  {
    title:    "UK banking fraud holds at £1.17B in 2024",
    title_ja: "英国銀行詐欺被害が2024年に11.7億ポンドを記録",
    desc:     "UK Finance 2025: £1.17B stolen in 2024; APP fraud £450.7M. Investment fraud up 34% to £144.4M. 70% of APP cases originated online. Banks prevented £1.45B in unauthorised fraud.",
    desc_ja:  "UK Finance 2025：2024年の英国詐欺被害は11.7億ポンド。APP詐欺は4.5億ポンド、投資詐欺は34%増で1.4億ポンド。APP被害の70%がオンライン発端。",
    type: "banking", severity: "high",
  },
  {
    title:    "FBI IC3 2024: record $16.6B in US cybercrime losses",
    title_ja: "FBI IC3 2024：米国サイバー犯罪被害が過去最高$166億",
    desc:     "FBI Internet Crime Complaint Center 2024 annual report: 859,532 complaints (+33% YoY); $16.6B in losses. Investment fraud $6.57B; BEC $2.77B; Tech support $1.46B. Crypto involved in $9.32B.",
    desc_ja:  "FBI IC3 2024年次報告：被害届859,532件（前年比+33%）、被害総額$166億。投資詐欺$65.7億、BEC$27.7億、偽テクサポ$14.6億。暗号通貨絡みが$93.2億。",
    type: "crypto", severity: "critical",
  },
  {
    title:    "Australia investment scams: $945M lost in 2024",
    title_ja: "オーストラリアの投資詐欺被害額、2024年に$9.45億",
    desc:     "ACCC Scamwatch 2024: $2.03B AUD total losses, down 26% thanks to improved banking protections. Investment scams dominated at $945M AUD (46% of total losses).",
    desc_ja:  "ACCC Scamwatch 2024：詐欺被害総額は$20.3億豪ドル（銀行保護強化で26%減）。投資詐欺が$9.45億で全体の46%を占める。",
    type: "crypto", severity: "high",
  },
  {
    title:    "AI-powered fraud surges 700% in 2025",
    title_ja: "AI悪用詐欺が2025年に700%急増",
    desc:     "Deepfake fraud incidents rose ~700% in 2025 per multiple security reports. Voice cloning scams targeting elderly, fake CEO video messages for BEC, and AI-generated phishing at scale.",
    desc_ja:  "複数のセキュリティ報告によるとディープフェイク詐欺が2025年に約700%急増。高齢者を標的にした音声クローン詐欺、BEC向け偽CEO動画、AI生成フィッシングが横行。",
    type: "tech_support", severity: "critical",
  },
  {
    title:    "Pig-butchering losses may reach $143B globally by end-2025",
    title_ja: "豚の屠殺詐欺の世界的被害、2025年末までに$1430億に達する可能性",
    desc:     "Stanford Internet Observatory study: $75B moved to crypto exchanges 2020–2024 via pig-butchering. Americans lost $10B in 2024 alone (US Treasury). 2025 projections up to $142.83B globally.",
    desc_ja:  "スタンフォード大Internet Observatory：2020〜2024年に$750億超が豚の屠殺詐欺で仮想通貨取引所に送金。米国人だけで2024年に$100億の被害（米財務省）。2025年の世界推計は$1430億。",
    type: "crypto", severity: "critical",
  },
  {
    title:    "QR code phishing (quishing) surging in 2024–2025",
    title_ja: "QRコードフィッシング（クイッシング）が急増",
    desc:     "Malicious QR codes in parking meters, restaurant menus, package slips, and email attachments redirect victims to credential-harvesting sites. Up 587% since 2023 per security vendors.",
    desc_ja:  "駐車場メーター、レストランのメニュー、荷物伝票、メール添付でのQRコードが認証情報窃取サイトへ誘導。2023年比で587%増とセキュリティ各社が報告。",
    type: "banking", severity: "high",
  },
  {
    title:    "Crypto ATM scams up 99% — FBI 2024",
    title_ja: "暗号通貨ATM詐欺が99%増 — FBI 2024年報告",
    desc:     "FBI IC3 2024: 10,956 complaints about crypto ATM scams (+99% YoY). Victims — primarily elderly — are instructed to deposit cash at ATMs and send QR code receipts to fraudsters.",
    desc_ja:  "FBI IC3 2024：暗号通貨ATM詐欺の被害届が10,956件（前年比+99%増）。主に高齢者がATMで現金を入金してQRコードを詐欺師に送るよう指示される。",
    type: "other", severity: "high",
  },
];

// ── Public simulation functions ───────────────────────────────────────────────

export function getLiveIncrement() {
  const m = timeMultiplier();
  const base = BASE_RATE * m;
  const total = Math.max(1, Math.round(base + gauss(0, 3)));
  return {
    total,
    sms:          Math.max(0, Math.round(total * 0.30 + gauss(0, 1))),
    phishing_url: Math.max(0, Math.round(total * 0.38 + gauss(0, 1))),
    fake_calls:   Math.max(0, Math.round(total * 0.32 + gauss(0, 1))),
    timestamp:    new Date().toISOString(),
  };
}

export function getTodaysTotals() {
  const now = new Date();
  const seconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  // BASE_RATE 47/s × seconds elapsed today; variance ±2000
  const total = Math.max(0, Math.round(BASE_RATE * seconds * 0.95 + randInt(-2000, 2000)));
  return {
    total_today:     total,
    sms_scams:       Math.round(total * 0.30),
    phishing_urls:   Math.round(total * 0.38),
    fake_calls:      Math.round(total * 0.32),
    per_second_rate: Math.round(BASE_RATE * timeMultiplier() * 10) / 10,
    last_updated:    now.toISOString(),
  };
}

export function getHeatmapData() {
  return Object.entries(COUNTRY_DATA).map(([code, d]) => {
    const noise = uniform(0.88, 1.12);
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
    i === 6 ? today : Math.round(base * uniform(0.88, 1.12))
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

// Real annual growth trajectory — FBI IC3 data + GASA projections
// 2020: $4.2B  2021: $6.9B  2022: $10.3B  2023: $12.5B  2024: $16.6B  (+33% YoY)
// Daily global attempts grew proportionally
const ANNUAL_GROWTH: Record<number, number> = {
  2020: 0.45, 2021: 0.60, 2022: 0.75, 2023: 0.88, 2024: 1.00, 2025: 1.18,
};

function dailyFactorForDate(date: Date): number {
  const year  = date.getFullYear();
  const month = date.getMonth(); // 0-based
  const base  = ANNUAL_GROWTH[year] ?? 1.0;
  const next  = ANNUAL_GROWTH[year + 1] ?? base * 1.18;
  return base + (next - base) * (month / 12);
}

export function getTrendData() {
  const baseDaily = 86400 * BASE_RATE * 0.95;
  return Array.from({ length: 30 }, (_, i) => {
    const daysAgo = 29 - i;
    const date    = new Date(Date.now() - daysAgo * 86400_000);
    const factor  = dailyFactorForDate(date);
    const total   = Math.round(baseDaily * factor * uniform(0.90, 1.10));
    return {
      date:     date.toISOString().slice(0, 10),
      total,
      // FBI IC3 2024 type proportions applied
      crypto:       Math.round(total * 0.30),
      banking:      Math.round(total * 0.25),
      phone:        Math.round(total * 0.15),
      delivery:     Math.round(total * 0.15),
      tech_support: Math.round(total * 0.09),
      other:        Math.round(total * 0.06),
    };
  });
}

export function getRiskForCountry(countryCode: string) {
  const cc = countryCode.toUpperCase();
  const d  = COUNTRY_DATA[cc] ?? COUNTRY_DATA["US"];
  const risk  = Math.min(100, Math.max(0, d.risk + randInt(-2, 2)));
  const level = risk >= 75 ? "CRITICAL" : risk >= 60 ? "HIGH" : risk >= 45 ? "MEDIUM" : "LOW";

  // Top threat messaging per type (source-backed)
  const threatMap: Record<string, [string, string]> = {
    crypto:       ["Investment/crypto scams account for $6.57B in US losses (FBI 2024)", "投資・暗号資産詐欺は米国だけで$65.7億の被害（FBI 2024）"],
    banking:      ["Banking phishing & BEC cause $2.77B annually in the US alone", "銀行フィッシング・BECは米国だけで年間$27.7億の被害"],
    delivery:     ["Fake parcel notifications are the #1 scam type in Japan/Korea", "偽配送通知は日本・韓国でNo.1の詐欺手口"],
    phone:        ["AI voice cloning scams up 700% in 2025 — verify all calls", "AIボイスクローン詐欺が2025年に700%急増 — 全ての電話を確認"],
    tech_support: ["Tech support fraud losses reached $1.46B in 2024 (FBI IC3)", "偽テクサポ詐欺の被害は2024年に$14.6億（FBI IC3）"],
    other:        ["Romance/pig-butchering scams: $75B+ moved 2020–2024", "ロマンス・豚の屠殺詐欺：2020〜2024年で$750億超が送金"],
  };
  const [tEn, tJa] = threatMap[d.top] ?? ["Stay alert for unsolicited contact", "不審な連絡に注意してください"];

  const expl: Record<string, [string, string]> = {
    CRITICAL: [`${d.name} is a critical-level scam hotspot based on UN/FBI/GASA reports.`, `${d.name}はUN・FBI・GASAの報告で最高レベルの詐欺危険地域です。`],
    HIGH:     [`High scam activity in ${d.name} — ranked high in 2024 global reports.`, `${d.name}は2024年グローバル報告で高リスクにランク。`],
    MEDIUM:   [`Moderate scam risk in ${d.name} per regional reports.`, `${d.name}は地域報告で中程度のリスク。`],
    LOW:      [`Relatively lower scam risk in ${d.name}.`, `${d.name}は比較的詐欺リスクが低い地域です。`],
  };
  const [exEn, exJa] = expl[level];

  return {
    level:          level as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    score:          risk,
    region:         d.name,
    country_code:   cc,
    top_threats:    [tEn, "Never send crypto/gift cards to resolve 'legal issues'", "Enable 2-step verification on all financial accounts"],
    top_threats_ja: [tJa, "「法的問題」解決のため暗号通貨・ギフトカードを送らない", "全金融口座で2段階認証を有効にする"],
    explanation:    exEn,
    explanation_ja: exJa,
    trend:          risk >= 70 ? "rising" : risk >= 55 ? "stable" : "declining",
  };
}

export function getFeed(limit = 10) {
  const now  = Date.now();
  const codes = Object.keys(COUNTRY_DATA);
  return sample(FEED_TEMPLATES, Math.min(limit, FEED_TEMPLATES.length)).map((t, i) => {
    const minsAgo = randInt(5, 240);
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
    {
      id: "c1", name: "North America Investment Fraud Cluster",
      center_lat: 37.1, center_lng: -95.7, radius_km: 1200,
      severity: "critical", count: 487_000, scam_type: "crypto",
      detected_at: new Date(now - 2 * 3600_000).toISOString(),
      description: "FBI IC3 2024: Investment fraud caused $6.57B in US losses. Pig-butchering and fake platforms dominate.",
    },
    {
      id: "c2", name: "Southeast Asia Pig-Butchering Hub",
      center_lat: 16.0, center_lng: 102.0, radius_km: 900,
      severity: "critical", count: 220_000, scam_type: "crypto",
      detected_at: new Date(now - 5 * 3600_000).toISOString(),
      description: "UN: 220K+ trafficking victims in Myanmar & Cambodia scam compounds. $75B+ crypto moved 2020–2024.",
    },
    {
      id: "c3", name: "West Africa BEC / Romance Cluster",
      center_lat: 7.4, center_lng: 3.9, radius_km: 1100,
      severity: "high", count: 94_000, scam_type: "other",
      detected_at: new Date(now - 8 * 3600_000).toISOString(),
      description: "Nigeria & Ghana: leading sources of BEC, advance-fee, and romance scams per FBI IC3 origin data.",
    },
    {
      id: "c4", name: "South Asia Phone / UPI Fraud Cluster",
      center_lat: 20.6, center_lng: 79.0, radius_km: 900,
      severity: "high", count: 632_000, scam_type: "phone",
      detected_at: new Date(now - 3 * 3600_000).toISOString(),
      description: "India MHA 2024: ₹22,845 crore ($2.7B) lost; 632K UPI fraud incidents in H1 FY25. Digital-arrest scams surging.",
    },
    {
      id: "c5", name: "East Asia Delivery / Voice-Phishing Cluster",
      center_lat: 36.0, center_lng: 128.0, radius_km: 700,
      severity: "high", count: 298_000, scam_type: "delivery",
      detected_at: new Date(now - 6 * 3600_000).toISOString(),
      description: "Japan NPA 2024: ¥71.88B special fraud (record). South Korea voice-phishing epidemic. Delivery scams dominate.",
    },
  ];
}
