import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "../store/scamStore";
import type { HeatmapPoint } from "../types";

const LEVEL_COLORS: Record<string, string> = {
  LOW:      "#00ff6e",
  MEDIUM:   "#ffd860",
  HIGH:     "#ffaa00",
  CRITICAL: "#ff2244",
};

export default function WorldHeatMap() {
  const { t } = useTranslation();
  const { heatmap, setSelectedCountry } = useStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const [hover, setHover] = useState<HeatmapPoint | null>(null);

  useEffect(() => {
    if (!mapRef.current || !heatmap.length) return;

    import("leaflet").then((L) => {
      if (leafletRef.current) leafletRef.current.remove();

      const map = L.map(mapRef.current!, {
        center: [20, 10], zoom: 2,
        zoomControl: false, scrollWheelZoom: true, attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
        maxZoom: 6, minZoom: 1,
      }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);

      heatmap.forEach((pt) => {
        const color = LEVEL_COLORS[pt.risk_level] ?? "#64748b";
        const r = 30000 + pt.intensity * 460000;

        // Outer glow
        L.circle([pt.lat, pt.lng], { radius: r * 1.8, color, fillColor: color, fillOpacity: 0.04, weight: 0 }).addTo(map);
        // Mid ring
        L.circle([pt.lat, pt.lng], { radius: r * 1.1, color, fillColor: color, fillOpacity: 0, weight: 0.8, opacity: 0.3 }).addTo(map);
        // Core
        const core = L.circle([pt.lat, pt.lng], { radius: r, color, fillColor: color, fillOpacity: 0.2, weight: 1.5 }).addTo(map);

        core.on("mouseover", () => setHover(pt));
        core.on("mouseout",  () => setHover(null));
        core.on("click",     () => setSelectedCountry(pt));

        // Small center dot
        L.circleMarker([pt.lat, pt.lng], {
          radius: 3, color, fillColor: color, fillOpacity: 0.9, weight: 0
        }).addTo(map).on("click", () => setSelectedCountry(pt));
      });

      leafletRef.current = map;
    });

    return () => { leafletRef.current?.remove(); leafletRef.current = null; };
  }, [heatmap]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="sf-label text-[9px] mb-1">GLOBAL THREAT VISUALIZATION</p>
          <h2 className="text-base font-bold sf-cyan">{t("map.title").toUpperCase()}</h2>
          <p className="text-xs mt-0.5" style={{ color: "rgba(0,212,255,0.4)" }}>{t("map.subtitle")}</p>
        </div>
        {/* Legend */}
        <div className="hidden sm:flex flex-col gap-1 text-right">
          {Object.entries(LEVEL_COLORS).map(([level, color]) => (
            <div key={level} className="flex items-center gap-1.5 justify-end">
              <span className="text-[10px] font-bold" style={{ color }}>{level}</span>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="relative overflow-hidden border" style={{ height: 400, borderColor: "var(--sf-border)" }}>
        <div ref={mapRef} className="absolute inset-0" />

        {/* Scan overlay */}
        <div className="sf-scan-line absolute inset-0 pointer-events-none" />

        {/* Click hint */}
        <div className="absolute top-3 right-3 z-[500] pointer-events-none">
          <span className="sf-label text-[9px] bg-black/70 px-2 py-1 border border-sf-border/30">
            ▶ {t("map.click").toUpperCase()}
          </span>
        </div>

        {/* Hover tooltip */}
        {hover && (
          <div
            className="absolute bottom-4 left-4 z-[500] pointer-events-none p-3 space-y-1"
            style={{ background: "rgba(0,8,18,0.97)", border: "1px solid var(--sf-border)" }}
          >
            <p className="text-xs font-bold sf-cyan">{hover.country_name.toUpperCase()}</p>
            <p className="text-xs font-bold" style={{ color: LEVEL_COLORS[hover.risk_level] }}>
              {hover.risk_level} THREAT
            </p>
            <p className="sf-label text-[9px]">{hover.scam_count.toLocaleString()} ATTEMPTS/DAY</p>
            <p className="sf-label text-[9px]">TOP: {hover.top_type.toUpperCase()}</p>
            <p className="text-[9px] mt-1" style={{ color: "rgba(0,212,255,0.5)" }}>
              ▶ CLICK FOR INTEL & SOURCES
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
