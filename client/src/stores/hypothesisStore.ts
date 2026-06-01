// ============================================================
// HYPOTHESIS STORE — Lean Startup Hypothesis Register
// Global state shared across /intake/hypotheses and the
// Portfolio Overview dashboard. Holds the hypothesis list and
// derives a live VRL (Venture Readiness Level) score per venture
// from the validation lifecycle.
// ============================================================
import { create } from "zustand";

export type CoreType = "value" | "growth";
export type Risk = "low" | "medium" | "high";
export type HypothesisStatus = "backlog" | "testing" | "validated" | "invalidated";

export interface Hypothesis {
  id: string;
  ventureId: string;
  type: CoreType;
  persona: string;
  behavior: string;
  experiment: string;
  metric: string;
  risk: Risk;
  status: HypothesisStatus;
  notes: string;
}

// ── Derived VRL score (0–9 scale) for a venture ──
export interface VentureVrl {
  vrl: number; // 0–9 computed score
  pivot: boolean; // true when an assumption was invalidated → pivot
  stageLabel: string; // human-readable lifecycle stage
}

export function vrlStageLabel(vrl: number): string {
  if (vrl >= 6) return "Go-To-Market";
  if (vrl >= 4) return "Problem-Solution Fit";
  if (vrl >= 2) return "Hypothesis Formulation";
  return "Ideation";
}

// ── Scoring engine ─────────────────────────────────────────
// Baseline 1.0 (Ideation). A Value hypothesis in testing → 2.0.
// A validated Value hypothesis → 4.0 (Problem-Solution Fit).
// Validated Value + validated Growth → 6.0 (Go-To-Market).
// Any invalidated assumption drops the venture to 2.0 and flags a pivot.
export function computeVentureVrl(hyps: Hypothesis[]): VentureVrl {
  let vrl = 1.0;

  const value = hyps.filter((h) => h.type === "value");
  const growth = hyps.filter((h) => h.type === "growth");

  const valueTesting = value.some((h) => h.status === "testing");
  const valueValidated = value.some((h) => h.status === "validated");
  const growthValidated = growth.some((h) => h.status === "validated");
  const anyInvalidated = hyps.some((h) => h.status === "invalidated");

  if (valueTesting) vrl = 2.0;
  if (valueValidated) vrl = 4.0;
  if (valueValidated && growthValidated) vrl = 6.0;

  let pivot = false;
  if (anyInvalidated) {
    vrl = 2.0;
    pivot = true;
  }

  return { vrl, pivot, stageLabel: vrlStageLabel(vrl) };
}

// Group hypotheses by venture and compute each venture's live VRL.
export function selectVrlByVenture(hyps: Hypothesis[]): Record<string, VentureVrl> {
  const byVenture: Record<string, Hypothesis[]> = {};
  for (const h of hyps) {
    (byVenture[h.ventureId] ??= []).push(h);
  }
  const out: Record<string, VentureVrl> = {};
  for (const [ventureId, list] of Object.entries(byVenture)) {
    out[ventureId] = computeVentureVrl(list);
  }
  return out;
}

// ── Seed data ──
const SEED: Hypothesis[] = [
  {
    id: "h-ecocomp-loi",
    ventureId: "ecoblend",
    type: "value",
    persona: "Enterprise Procurement Managers",
    behavior: "pay a 15% premium for bio-based materials",
    experiment: "direct interviews with 10 target buyers presenting a pricing tier sheet",
    metric: "5 out of 10 sign a non-binding Letter of Intent (LOI)",
    risk: "high",
    status: "testing",
    notes:
      "3 interviews completed so far. 2 buyers expressed strong interest but need to see ASTM safety certifications first.",
  },
  {
    id: "h-bebus-webinar",
    ventureId: "bebus",
    type: "growth",
    persona: "Municipal Transit Operators",
    behavior: "discover our electric transport retrofitting via regional green logistics webinars",
    experiment: "hosting a targeted 30-minute educational webinar with Q&A",
    metric: "40+ attendees and at least 8 follow-up discovery calls",
    risk: "medium",
    status: "validated",
    notes:
      "Webinar completed on June 1st. Had 52 attendees and locked in 11 follow-up discovery meetings. Growth channel validated.",
  },
];

interface HypothesisState {
  hypotheses: Hypothesis[];
  addHypothesis: (h: Hypothesis) => void;
  setStatus: (id: string, status: HypothesisStatus) => void;
  setNotes: (id: string, notes: string) => void;
}

export const useHypothesisStore = create<HypothesisState>((set) => ({
  hypotheses: SEED,
  addHypothesis: (h) => set((s) => ({ hypotheses: [h, ...s.hypotheses] })),
  setStatus: (id, status) =>
    set((s) => ({ hypotheses: s.hypotheses.map((h) => (h.id === id ? { ...h, status } : h)) })),
  setNotes: (id, notes) =>
    set((s) => ({ hypotheses: s.hypotheses.map((h) => (h.id === id ? { ...h, notes } : h)) })),
}));
