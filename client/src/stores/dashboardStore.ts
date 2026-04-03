import { create } from "zustand";
import type {
  MRLStatusData,
  RiskItem,
  SupplierSummary,
  CostPoint,
  SustainabilityData,
  VentureSummary,
  LiveFeedMessage,
  ViewName,
} from "@/types/dashboard.types";

interface DashboardState {
  // venture selection
  activeVentureId:  string | null;
  ventureData:      VentureSummary | null;

  // panel data (hydrated by React Query)
  mrlStatus:        MRLStatusData | null;
  riskItems:        RiskItem[];
  suppliers:        SupplierSummary[];
  costCurve:        CostPoint[];
  sustainability:   SustainabilityData | null;

  // derived values (computed from mrlStatus)
  trl:              number;
  mrl:              number;
  mrlScore:         number;
  vrl:              number;
  delta:            number;
  eta:              number;
  riskScore:        number;

  // live feed
  isLive:           boolean;
  lastUpdated:      Date | null;
  tickerItems:      string[];

  // view state
  activeView:       ViewName;
  hoveredSupplier:  string | null;

  // actions
  setVenture:          (id: string) => void;
  setView:             (v: ViewName) => void;
  setLive:             (on: boolean) => void;
  setHoveredSupplier:  (id: string | null) => void;
  ingestLiveFeed:      (msg: LiveFeedMessage) => void;
  setMrlStatus:        (data: MRLStatusData) => void;
  setRiskItems:        (items: RiskItem[]) => void;
  setSuppliers:        (items: SupplierSummary[]) => void;
  setCostCurve:        (points: CostPoint[]) => void;
  setSustainability:   (data: SustainabilityData) => void;
  setVentureData:      (data: VentureSummary) => void;
  setLastUpdated:      (d: Date) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  activeVentureId:  null,
  ventureData:      null,
  mrlStatus:        null,
  riskItems:        [],
  suppliers:        [],
  costCurve:        [],
  sustainability:   null,
  trl:              0,
  mrl:              0,
  mrlScore:         0,
  vrl:              0,
  delta:            0,
  eta:              0,
  riskScore:        0,
  isLive:           false,
  lastUpdated:      null,
  tickerItems:      [],
  activeView:       "overview",
  hoveredSupplier:  null,

  setVenture: (id) => set({ activeVentureId: id }),
  setView:    (v)  => set({ activeView: v }),
  setLive:    (on) => set({ isLive: on }),
  setHoveredSupplier: (id) => set({ hoveredSupplier: id }),
  setLastUpdated: (d) => set({ lastUpdated: d }),

  setMrlStatus: (data) => set({
    mrlStatus:  data,
    trl:        data.trl,
    mrl:        data.mrl,
    mrlScore:   data.mrl_score,
    vrl:        data.vrl,
    delta:      data.delta,
    eta:        data.eta,
  }),

  setRiskItems:      (items) => set({ riskItems: items }),
  setSuppliers:      (items) => set({ suppliers: items }),
  setCostCurve:      (points) => set({ costCurve: points }),
  setSustainability: (data) => set({ sustainability: data }),
  setVentureData:    (data) => set({ ventureData: data }),

  ingestLiveFeed: (msg) => {
    const state = get();
    // Update derived values if present in message
    const updates: Partial<DashboardState> = { lastUpdated: new Date(msg.timestamp) };
    if (msg.mrl_score !== undefined) updates.mrlScore = msg.mrl_score;
    if (msg.mrl_level !== undefined) updates.mrl = msg.mrl_level;
    if (msg.vrl_score !== undefined) updates.vrl = msg.vrl_score;
    if (msg.delta !== undefined)     updates.delta = msg.delta;

    // Build ticker item
    const tickerText = `◆ ${msg.event.toUpperCase()} · ${msg.venture_id} · ${msg.severity || "UPDATE"} · ${new Date(msg.timestamp).toLocaleTimeString()}`;
    const newTicker = [tickerText, ...state.tickerItems].slice(0, 20);
    updates.tickerItems = newTicker;

    set(updates as DashboardState);
  },
}));
