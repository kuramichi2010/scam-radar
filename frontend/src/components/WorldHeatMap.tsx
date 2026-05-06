import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { useStore } from "../store/scamStore";
import type { HeatmapPoint } from "../types";

const LEVEL_COLORS = {
  LOW:      "#22c55e",
  MEDIUM:   "#eab308",
  HIGH:     "#f97316",
  CRITICAL: "#ef4444",
};

export default function WorldHeatMap() {
  const { t } = useTranslation();
  const { heatmap, setSelectedCountry } = useStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const [tooltip, setTooltip] = useState<HeatmapPoint | null>(null);

  useEffect(() => {
    if (!mapRef.current || heatmap.length === 0) return;

    import("leaflet").then((L) => {
      if (leafletRef.current) leafletRef.current.remove();

      const map = L.map(mapRef.current!, {
        center: [20, 10],
        zoom: 2,
        zoomControl: false,
        scrollWheelZoom: true,
        attributionControl: false,
      });

      // Dark tile layer
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { maxZoom: 6, minZoom: 1 }
      ).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Draw circles for each country
      heatmap.forEach((pt) => {
        const color = LEVEL_COLORS[pt.risk_level as keyof typeof LEVEL_COLORS] ?? "#64748b";
        const radius = 30000 + pt.intensity * 500000;

        // Outer glow ring
        L.circle([pt.lat, pt.lng], {
          radius: radius * 1.5,
          color,
          fillColor: color,
          fillOpacity: 0.04,
          weight: 0,
        }).addTo(map);

        // Main circle
        const circle = L.circle([pt.lat, pt.lng], {
          radius,
          color,
          fillColor: color,
          fillOpacity: 0.25,
          weight: 1.5,
        }).addTo(map);

        circle.on("mouseover", () => setTooltip(pt));
        circle.on("mouseout", () => setTooltip(null));
        circle.on("click", () => setSelectedCountry(pt));
      });

      leafletRef.current = map;
    });

    return () => {
      leafletRef.current?.remove();
      leafletRef.current = null;
    };
  }, [heatmap]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">{t("map.title")}</h2>
          <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
            <MapPin size={10} /> {t("map.subtitle")}
          </p>
        </div>
        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-xs">
          {Object.entries(LEVEL_COLORS).map(([level, color]) => (
            <div key={level} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-slate-400">{level}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950" style={{ height: 400 }}>
        <div ref={mapRef} className="absolute inset-0" />

        {/* Tooltip overlay */}
        {tooltip && (
          <div className="absolute bottom-4 left-4 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl p-3 text-xs z-[1000] pointer-events-none">
            <p className="font-bold text-white">{tooltip.country_name}</p>
            <p style={{ color: LEVEL_COLORS[tooltip.risk_level as keyof typeof LEVEL_COLORS] }} className="font-semibold mt-0.5">
              Risk: {tooltip.risk_level}
            </p>
            <p className="text-slate-400">{tooltip.scam_count.toLocaleString()} attempts/day</p>
            <p className="text-slate-500 capitalize">Top: {tooltip.top_type}</p>
          </div>
        )}

        <p className="absolute top-3 right-3 text-xs text-slate-600 bg-slate-900/80 px-2 py-1 rounded-lg z-[1000]">
          {t("map.click")}
        </p>
      </div>
    </div>
  );
}
