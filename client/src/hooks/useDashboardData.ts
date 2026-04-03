/**
 * useDashboardData — React Query orchestrator for MRL Command Dashboard
 * Bridges tRPC procedures to the Zustand dashboard store.
 * Falls back to rich mock data when venture has no live records.
 */
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useDashboardStore } from "@/stores/dashboardStore";
import type {
  MRLStatusData,
  RiskItem,
  SupplierSummary,
  CostPoint,
  SustainabilityData,
} from "@/types/dashboard.types";

// ── Mock data (NovaBattery defaults) ──────────────────────────────

export const MOCK_MRL_STATUS: MRLStatusData = {
  venture_id:      "nova-battery",
  mrl_score:       54.2,
  mrl_level:       4,
  mrl_label:       "MRL 4 — Production Feasibility",
  trl:             6,
  mrl:             4,
  delta:           2,
  eta:             0.58,
  rho:             7.4,
  vrl:             61,
  gate_locked:     false,
  confidence_band: 8.5,
  last_updated:    new Date().toISOString(),
  categories: [
    { key: "process",        score_S: 5.8, maturity_label: "Measured",  weight: 0.28, contribution: 1.624 },
    { key: "supply_chain",   score_S: 4.2, maturity_label: "Estimated", weight: 0.22, contribution: 0.924 },
    { key: "cost",           score_S: 5.5, maturity_label: "Measured",  weight: 0.20, contribution: 1.100 },
    { key: "quality",        score_S: 5.1, maturity_label: "Measured",  weight: 0.18, contribution: 0.918 },
    { key: "sustainability", score_S: 4.8, maturity_label: "Estimated", weight: 0.12, contribution: 0.576 },
  ],
  history: [
    { period: "Q1 '25", trl: 3, mrl: 3 },
    { period: "Q2 '25", trl: 4, mrl: 3 },
    { period: "Q3 '25", trl: 5, mrl: 4 },
    { period: "Q4 '25", trl: 5, mrl: 4 },
    { period: "Q1 '26", trl: 6, mrl: 4 },
    { period: "NOW",    trl: 6, mrl: 4 },
  ],
};

export const MOCK_RISKS: RiskItem[] = [
  { id: "R1", category: "Supply Chain", title: "Single-source MEMS component", probability: 0.72, impact: 9, risk_score: 6.48, rag: "red",   mitigation: "Dual-source qualification" },
  { id: "R2", category: "Process",      title: "Yield below 87% target",       probability: 0.55, impact: 7, risk_score: 3.85, rag: "red",   mitigation: "Process optimisation sprint" },
  { id: "R3", category: "Compliance",   title: "UKCA cert timeline 9+ months", probability: 0.60, impact: 8, risk_score: 4.80, rag: "amber", mitigation: "Pre-submission meeting booked" },
  { id: "R4", category: "Cost",         title: "BOM cost 18% over target",     probability: 0.48, impact: 6, risk_score: 2.88, rag: "amber", mitigation: "Value engineering review" },
  { id: "R5", category: "Process",      title: "Tooling lead time 16 weeks",   probability: 0.40, impact: 5, risk_score: 2.00, rag: "amber", mitigation: "Order tooling immediately" },
  { id: "R6", category: "Sustainability","title": "Scope 3 data gaps",         probability: 0.30, impact: 4, risk_score: 1.20, rag: "green", mitigation: "Supplier data requests" },
];

export const MOCK_SUPPLIERS: SupplierSummary[] = [
  { id: "S1", name: "Honsun Electronics",  country: "CN", city: "Shenzhen",   tier: 1, component: "BMS Chip",       risk: "red",   audit: "pending",     spend: 340000, lead: 12 },
  { id: "S2", name: "Dongguan Precision",  country: "CN", city: "Dongguan",   tier: 1, component: "Cell Casing",    risk: "amber", audit: "passed",      spend: 180000, lead: 8  },
  { id: "S3", name: "Midlands Components", country: "GB", city: "Birmingham", tier: 1, component: "PCB Assembly",   risk: "green", audit: "passed",      spend: 220000, lead: 4  },
  { id: "S4", name: "ShenZhen Plastics",   country: "CN", city: "Shenzhen",   tier: 2, component: "Housing",        risk: "amber", audit: "passed",      spend: 95000,  lead: 10 },
  { id: "S5", name: "Cambridge Materials", country: "GB", city: "Cambridge",  tier: 2, component: "Electrolyte",    risk: "green", audit: "passed",      spend: 155000, lead: 3  },
  { id: "S6", name: "Yiwu Hardware",       country: "CN", city: "Yiwu",       tier: 3, component: "Fasteners",      risk: "green", audit: "passed",      spend: 28000,  lead: 6  },
  { id: "S7", name: "Seoul Anode Co",      country: "KR", city: "Seoul",      tier: 1, component: "Anode Material", risk: "amber", audit: "conditional", spend: 290000, lead: 14 },
];

export const MOCK_COST_CURVE: CostPoint[] = [
  { volume: 500,    cogs: 142.40, target: 95 },
  { volume: 1000,   cogs: 118.20, target: 95 },
  { volume: 2500,   cogs: 98.60,  target: 95 },
  { volume: 5000,   cogs: 84.10,  target: 95 },
  { volume: 10000,  cogs: 72.30,  target: 95 },
  { volume: 25000,  cogs: 61.80,  target: 95 },
  { volume: 50000,  cogs: 54.20,  target: 95 },
  { volume: 100000, cogs: 48.90,  target: 95 },
];

export const MOCK_SUSTAINABILITY: SustainabilityData = {
  carbonIntensity: 4.82,
  carbonTarget:    3.50,
  scope1:          0.48,
  scope2:          1.24,
  scope3:          3.10,
  socialRisk:      38,
  circularity:     52,
  waterIntensity:  2.3,
  lcaStatus:       "cradle_to_gate",
  esgGrade:        "B",
};

// ── Hook ──────────────────────────────────────────────────────────

export function useDashboardData(ventureId: string | null) {
  const store = useDashboardStore();

  // Attempt to fetch live MRL status from tRPC
  const mrlQuery = trpc.mrl.getPortfolio.useQuery(undefined, {
    staleTime: 30_000,
    gcTime:    300_000,
    retry:     2,
    enabled:   true,
  });

  // Hydrate store with mock data on mount (live data overlays when available)
  useEffect(() => {
    // Always seed mock data so dashboard renders immediately
    store.setMrlStatus(MOCK_MRL_STATUS);
    store.setRiskItems([...MOCK_RISKS].sort((a, b) => b.risk_score - a.risk_score));
    store.setSuppliers(MOCK_SUPPLIERS);
    store.setCostCurve(MOCK_COST_CURVE);
    store.setSustainability(MOCK_SUSTAINABILITY);
    store.setVentureData({
      venture_id:  ventureId || "nova-battery",
      name:        "NovaBattery",
      sector:      "CleanTech · Energy Storage",
      stage:       "MRL 4",
      trl_current: 6,
      mrl_current: 4,
      vrl_score:   61,
    });
    store.setLastUpdated(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventureId]);

  // If live tRPC data arrives, overlay it on top of mock
  useEffect(() => {
    if (!mrlQuery.data) return;
    // mrlQuery.data is the portfolio list — find the active venture
    const ventures = mrlQuery.data as Array<{ id: string; name: string; trl?: number; mrl?: number }>;
    const active = ventureId ? ventures.find(v => v.id === ventureId) : ventures[0];
    if (!active) return;

    // Partial overlay — update TRL/MRL from live data if available
    const overlay: Partial<MRLStatusData> = {
      ...MOCK_MRL_STATUS,
      venture_id:  active.id,
      trl:         (active.trl as number) ?? MOCK_MRL_STATUS.trl,
      mrl:         (active.mrl as number) ?? MOCK_MRL_STATUS.mrl,
      last_updated: new Date().toISOString(),
    };
    store.setMrlStatus(overlay as MRLStatusData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mrlQuery.data, ventureId]);

  return {
    isLoading: mrlQuery.isLoading,
    isError:   mrlQuery.isError,
  };
}
