import "leaflet/dist/leaflet.css";
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

const TILES = {
  dark:      "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

type MapMode = "dark" | "satellite";

function injectMapCSS() {
  if (document.getElementById("sf-map-css")) return;
  const s = document.createElement("style");
  s.id = "sf-map-css";
  s.textContent = `
    .leaflet-container { background: #00040a !important; }
    /* Visual-only marker — never intercepts pointer events */
    .sf-icon-host {
      background: none !important;
      border: none !important;
      pointer-events: none !important;
    }
    .sf-ring {
      transform-origin: center center;
      animation: sfRingOut 2.6s ease-out infinite;
    }
    .sf-ring-b { animation-delay: 1.3s; }
    @keyframes sfRingOut {
      0%   { transform: scale(1);   opacity: 0.85; }
      100% { transform: scale(4.2); opacity: 0;    }
    }
  `;
  document.head.appendChild(s);
}

export default function WorldHeatMap() {
  const { t } = useTranslation();
  const { heatmap, setSelectedCountry, selectedCountry } = useStore();
  const mapDiv   = useRef<HTMLDivElement>(null);
  const mapInst  = useRef<any>(null);
  const tileRef  = useRef<any>(null);
  const mrkRefs  = useRef<any[]>([]);
  const hlRef    = useRef<any>(null);
  const [ready,   setReady]   = useState(false);
  const [mode,    setMode]    = useState<MapMode>("dark");
  const [hover,   setHover]   = useState<HeatmapPoint | null>(null);

  // ── Create map once ─────────────────────────────────────────
  useEffect(() => {
    if (!mapDiv.current || mapInst.current) return;
    injectMapCSS();

    import("leaflet").then(L => {
      if (!mapDiv.current || mapInst.current) return;

      const map = L.map(mapDiv.current, {
        center: [20, 10], zoom: 2,
        minZoom: 2, maxZoom: 10,
        zoomControl: false,
        scrollWheelZoom: true,
        attributionControl: false,
        worldCopyJump: true,          // seamless east-west looping
      });

      // Restrict latitude to prevent polar empty areas
      map.setMaxBounds([[-85, -Infinity as unknown as number], [85, Infinity as unknown as number]]);

      const tile = L.tileLayer(TILES.dark, { maxZoom: 19, minZoom: 1 }).addTo(map);
      tileRef.current = tile;
      mapInst.current = map;
      setReady(true);
    });

    return () => {
      mapInst.current?.remove();
      mapInst.current = null;
      tileRef.current = null;
      mrkRefs.current = [];
      hlRef.current   = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render threat markers when heatmap data arrives ──────────
  useEffect(() => {
    if (!mapInst.current || !heatmap.length) return;

    import("leaflet").then(L => {
      // Clear previous markers
      mrkRefs.current.forEach(m => m.remove());
      mrkRefs.current = [];

      heatmap.forEach(pt => {
        const color  = LEVEL_COLORS[pt.risk_level] ?? "#64748b";
        const dotPx  = Math.max(4, 3 + Math.round(pt.intensity * 8));  // 4-11px
        const r      = 15_000 + pt.intensity * 80_000;                // geo radius (15-95km)

        const onOver  = () => setHover(pt);
        const onOut   = () => setHover(null);
        const onClick = () => setSelectedCountry(pt);

        // ── 1. Outer glow halo (visual only, non-interactive) ──────
        const halo = L.circle([pt.lat, pt.lng], {
          radius: r * 1.8, color, fillColor: color,
          fillOpacity: 0.012, weight: 0, interactive: false,
        }).addTo(mapInst.current);

        // ── 2. Threat zone — CLICK TARGET (large, easy to tap) ─────
        const zone = L.circle([pt.lat, pt.lng], {
          radius: r, color, fillColor: color,
          fillOpacity: 0.05, weight: 0.8, opacity: 0.3, dashArray: "3 6",
          bubblingMouseEvents: false,
        }).addTo(mapInst.current);
        zone.on("mouseover", onOver);
        zone.on("mouseout",  onOut);
        zone.on("click",     onClick);

        // ── 3. Pulsing divIcon — VISUAL ONLY (pointer-events:none) ─
        const vPx  = dotPx * 8;
        const icon = L.divIcon({
          className: "sf-icon-host",
          iconSize:   [vPx, vPx],
          iconAnchor: [vPx / 2, vPx / 2],
          html: `<div style="position:relative;width:${vPx}px;height:${vPx}px;">
            <div style="position:absolute;top:calc(50% - ${dotPx/2}px);left:calc(50% - ${dotPx/2}px);
              width:${dotPx}px;height:${dotPx}px;border-radius:50%;
              background:${color};box-shadow:0 0 ${dotPx*2}px ${color}90;"></div>
            <div class="sf-ring" style="position:absolute;top:calc(50% - ${dotPx/2}px);left:calc(50% - ${dotPx/2}px);
              width:${dotPx}px;height:${dotPx}px;border-radius:50%;border:1.5px solid ${color};"></div>
            <div class="sf-ring sf-ring-b" style="position:absolute;top:calc(50% - ${dotPx/2}px);left:calc(50% - ${dotPx/2}px);
              width:${dotPx}px;height:${dotPx}px;border-radius:50%;border:1px solid ${color}55;"></div>
          </div>`,
        });
        L.marker([pt.lat, pt.lng], { icon, interactive: false, keyboard: false })
          .addTo(mapInst.current);

        // ── 4. Center dot — precise CLICK TARGET on top ────────────
        const dot = L.circleMarker([pt.lat, pt.lng], {
          radius: Math.max(7, dotPx / 2),
          color, fillColor: color, fillOpacity: 0.9, weight: 0,
          bubblingMouseEvents: false,
        }).addTo(mapInst.current);
        dot.on("mouseover", onOver);
        dot.on("mouseout",  onOut);
        dot.on("click",     onClick);

        mrkRefs.current.push(halo, zone, dot);
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heatmap, ready, setSelectedCountry]);

  // ── Highlight selected country ───────────────────────────────
  useEffect(() => {
    if (!mapInst.current) return;
    import("leaflet").then(L => {
      hlRef.current?.remove();
      hlRef.current = null;
      if (!selectedCountry) return;
      const r = 15_000 + selectedCountry.intensity * 80_000;
      hlRef.current = L.circle([selectedCountry.lat, selectedCountry.lng], {
        radius: r * 1.8,
        color: "#ffffff",
        fillColor: "transparent",
        fillOpacity: 0,
        weight: 1.5,
        opacity: 0.75,
        dashArray: "7 4",
      }).addTo(mapInst.current);
    });
  }, [selectedCountry]);

  // ── Switch tile layer ────────────────────────────────────────
  useEffect(() => {
    tileRef.current?.setUrl(TILES[mode]);
  }, [mode]);

  // ── Resize handler ───────────────────────────────────────────
  useEffect(() => {
    const fn = () => mapInst.current?.invalidateSize();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const zoomIn  = () => mapInst.current?.zoomIn();
  const zoomOut = () => mapInst.current?.zoomOut();

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="sf-label text-[9px] mb-1">GLOBAL THREAT VISUALIZATION · 2D INTERACTIVE</p>
          <h2 className="text-base font-bold sf-cyan">{t("map.title").toUpperCase()}</h2>
          <p className="text-xs mt-0.5" style={{ color: "rgba(0,212,255,0.4)" }}>{t("map.subtitle")}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Dark / Satellite toggle */}
          <div className="flex" style={{ border: "1px solid rgba(0,212,255,0.2)" }}>
            {(["dark", "satellite"] as MapMode[]).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all"
                style={mode === m
                  ? { background: "var(--sf-cyan)", color: "#000810", boxShadow: "0 0 10px rgba(0,212,255,0.4)" }
                  : { background: "transparent", color: "rgba(0,212,255,0.4)" }}
              >{m === "dark" ? "DARK" : "SAT"}</button>
            ))}
          </div>

          {/* Legend */}
          <div className="hidden sm:flex flex-col gap-1">
            {Object.entries(LEVEL_COLORS).map(([lvl, col]) => (
              <div key={lvl} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col, boxShadow: `0 0 5px ${col}` }} />
                <span className="text-[9px] font-bold" style={{ color: col }}>{lvl}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map container */}
      <div className="relative overflow-hidden border"
        style={{ height: 500, borderColor: "var(--sf-border)", background: "#00040a" }}>
        <div ref={mapDiv} className="absolute inset-0" />

        {/* SF scan line overlay */}
        <div className="sf-scan-line absolute inset-0 pointer-events-none z-[399]" />

        {/* Zoom controls (SF style) */}
        {ready && (
          <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-1">
            <button onClick={zoomIn} className="w-8 h-8 flex items-center justify-center text-base font-bold sf-btn">＋</button>
            <button onClick={zoomOut} className="w-8 h-8 flex items-center justify-center text-base font-bold sf-btn">−</button>
          </div>
        )}

        {/* Hints */}
        <div className="absolute top-3 right-3 z-[400] pointer-events-none flex flex-col items-end gap-1">
          <span className="sf-label text-[9px] bg-black/70 px-2 py-0.5 border border-sf-border/30">
            ▶ {t("map.click").toUpperCase()}
          </span>
          <span className="sf-label text-[9px] bg-black/70 px-2 py-0.5 border border-sf-border/30">
            ↔ DRAG · SCROLL ZOOM
          </span>
        </div>

        {/* Hover tooltip */}
        {hover && (
          <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none p-3 space-y-1"
            style={{ background: "rgba(0,8,18,0.97)", border: "1px solid var(--sf-border)" }}>
            <p className="text-xs font-bold sf-cyan">{hover.country_name.toUpperCase()}</p>
            <p className="text-xs font-bold" style={{ color: LEVEL_COLORS[hover.risk_level] }}>
              {hover.risk_level} THREAT
            </p>
            <p className="sf-label text-[9px]">{hover.scam_count.toLocaleString()} ATTEMPTS/DAY</p>
            <p className="sf-label text-[9px]">TOP: {hover.top_type.toUpperCase()}</p>
            <p className="text-[9px] mt-1" style={{ color: "rgba(0,212,255,0.5)" }}>
              ▶ CLICK FOR INTEL &amp; HISTORY
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
