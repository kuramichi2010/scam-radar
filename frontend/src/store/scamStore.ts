import { create } from "zustand";
import type { LiveStats, HeatmapPoint, ScamType, TrendPoint, RiskAssessment, FeedItem, ScamCluster, Language } from "../types";

interface ScamStore {
  stats: LiveStats | null;
  heatmap: HeatmapPoint[];
  scamTypes: ScamType[];
  trend: TrendPoint[];
  risk: RiskAssessment | null;
  feed: FeedItem[];
  clusters: ScamCluster[];
  language: Language;
  showShareModal: boolean;
  selectedCountry: HeatmapPoint | null;
  isConnected: boolean;
  timelineFrame: number;

  setStats: (s: LiveStats) => void;
  incrementStats: (delta: { total: number; sms: number; phishing_url: number; fake_calls: number }) => void;
  setHeatmap: (h: HeatmapPoint[]) => void;
  setScamTypes: (t: ScamType[]) => void;
  setTrend: (t: TrendPoint[]) => void;
  setRisk: (r: RiskAssessment) => void;
  setFeed: (f: FeedItem[]) => void;
  setClusters: (c: ScamCluster[]) => void;
  setLanguage: (l: Language) => void;
  setShowShareModal: (v: boolean) => void;
  setSelectedCountry: (c: HeatmapPoint | null) => void;
  setConnected: (v: boolean) => void;
  setTimelineFrame: (n: number) => void;
}

export const useStore = create<ScamStore>((set) => ({
  stats: null,
  heatmap: [],
  scamTypes: [],
  trend: [],
  risk: null,
  feed: [],
  clusters: [],
  language: "en",
  showShareModal: false,
  selectedCountry: null,
  isConnected: false,
  timelineFrame: 23,

  setStats: (s) => set({ stats: s }),
  incrementStats: (delta) =>
    set((state) => {
      if (!state.stats) return {};
      return {
        stats: {
          ...state.stats,
          total_today: state.stats.total_today + delta.total,
          sms_scams: state.stats.sms_scams + delta.sms,
          phishing_urls: state.stats.phishing_urls + delta.phishing_url,
          fake_calls: state.stats.fake_calls + delta.fake_calls,
        },
      };
    }),
  setHeatmap: (h) => set({ heatmap: h }),
  setScamTypes: (t) => set({ scamTypes: t }),
  setTrend: (t) => set({ trend: t }),
  setRisk: (r) => set({ risk: r }),
  setFeed: (f) => set({ feed: f }),
  setClusters: (c) => set({ clusters: c }),
  setLanguage: (l) => set({ language: l }),
  setShowShareModal: (v) => set({ showShareModal: v }),
  setSelectedCountry: (c) => set({ selectedCountry: c }),
  setConnected: (v) => set({ isConnected: v }),
  setTimelineFrame: (n) => set({ timelineFrame: n }),
}));
