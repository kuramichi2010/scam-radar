import type { CapacitorConfig } from "@capacitor/cli";

// For live-reload over WiFi: CAPACITOR_SERVER_URL=http://<mac-ip>:5174 npx cap sync
const liveUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId:   "com.scamradar.app",
  appName: "ScamRadar",
  webDir:  "dist",

  ...(liveUrl ? { server: { url: liveUrl, cleartext: true } } : {}),

  ios: {
    contentInset:    "automatic",
    backgroundColor: "#00080f",
    scrollEnabled:   true,
  },
};

export default config;
