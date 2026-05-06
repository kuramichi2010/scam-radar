/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["JetBrains Mono", "Fira Code", "monospace"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        sf: {
          cyan:    "#00d4ff",
          green:   "#00ff6e",
          amber:   "#ffaa00",
          red:     "#ff2244",
          purple:  "#bf00ff",
          bg:      "#00080f",
          panel:   "#000f1e",
          border:  "rgba(0,212,255,0.2)",
        },
      },
      animation: {
        "sf-scan":    "sfScan 6s linear infinite",
        "sf-glow":    "sfGlow 3s ease-in-out infinite",
        "sf-flicker": "sfFlicker 5s ease-in-out infinite",
        "sf-glitch":  "sfGlitch 8s ease-in-out infinite",
        "sf-blink":   "sfBlink 1s step-end infinite",
        "sf-sweep":   "sfSweep 2s ease-out forwards",
        "sf-pulse":   "sfPulse 2s ease-in-out infinite",
      },
      keyframes: {
        sfScan: {
          "0%":   { top: "-40%" },
          "100%": { top: "140%" },
        },
        sfGlow: {
          "0%,100%": { boxShadow: "0 0 15px rgba(0,212,255,0.08), inset 0 0 30px rgba(0,212,255,0.03)" },
          "50%":     { boxShadow: "0 0 35px rgba(0,212,255,0.18), inset 0 0 60px rgba(0,212,255,0.06)" },
        },
        sfFlicker: {
          "0%,94%,100%": { opacity: "1" },
          "95%":  { opacity: "0.3" },
          "96%":  { opacity: "1" },
          "97%":  { opacity: "0.5" },
          "98%":  { opacity: "1" },
        },
        sfGlitch: {
          "0%,92%,100%": { transform: "none",          filter: "none" },
          "93%":          { transform: "skewX(-4deg)",  filter: "hue-rotate(80deg) brightness(1.4)" },
          "94%":          { transform: "skewX(4deg)",   filter: "hue-rotate(-80deg)" },
          "95%":          { transform: "none",          filter: "none" },
        },
        sfBlink: {
          "50%": { opacity: "0" },
        },
        sfSweep: {
          "0%":   { width: "0%" },
          "100%": { width: "100%" },
        },
        sfPulse: {
          "0%,100%": { opacity: "1",   transform: "scale(1)" },
          "50%":     { opacity: "0.6", transform: "scale(0.95)" },
        },
      },
    },
  },
  plugins: [],
};
