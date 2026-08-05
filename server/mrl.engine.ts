// ============================================================
// ECOBLEND OS — MRL ENGINE
// Manufacturing Readiness Level Intelligence System v1.0
// Five-engine architecture: PDE · SCIE · CSM · QCE · SIL
// VRL weights: MRL → Product meta-domain × 0.35, Execution meta-domain × 0.40
//              (dual-pathway; authoritative source: vrl.engine.ts)
// Risk formula: RAG × Probability × Impact = Risk Score (0–100)
// ============================================================

// ── MRL Level Definitions ─────────────────────────────────────────────────────
export const MRL_LEVELS = [
  {
    level: 1,
    label: "Concept",
    trlAlignment: "1-2",
    description: "Manufacturing concepts identified. Basic manufacturing implications understood.",
    keyActivities: [
      "Identify manufacturing concepts",
      "Assess basic material availability",
      "Map initial process options",
    ],
    exitCriteria: [
      "Manufacturing feasibility confirmed at concept level",
      "No show-stopper material constraints identified",
    ],
  },
  {
    level: 2,
    label: "Feasibility",
    trlAlignment: "2-3",
    description: "Manufacturing concepts defined. Feasibility of manufacturing process established.",
    keyActivities: [
      "Define manufacturing process concept",
      "Identify key suppliers",
      "Estimate rough-order-of-magnitude costs",
    ],
    exitCriteria: [
      "Process concept documented",
      "Supplier landscape mapped",
      "ROM cost estimate produced",
    ],
  },
  {
    level: 3,
    label: "Process Dev",
    trlAlignment: "3-4",
    description: "Manufacturing process in development. Key process parameters identified.",
    keyActivities: [
      "Develop process route",
      "Identify critical process parameters",
      "Begin tooling design",
      "Engage T1 suppliers",
    ],
    exitCriteria: [
      "Process route documented",
      "Critical parameters identified and controlled",
      "T1 supplier shortlist confirmed",
    ],
  },
  {
    level: 4,
    label: "Pilot Ready",
    trlAlignment: "4-5",
    description: "Capability to produce prototype in laboratory environment demonstrated.",
    keyActivities: [
      "Produce prototype units in lab",
      "Validate process against spec",
      "Develop quality plan",
      "Confirm compliance requirements",
    ],
    exitCriteria: [
      "Prototype units produced to spec",
      "Process validated in lab",
      "Quality plan in place",
    ],
  },
  {
    level: 5,
    label: "Pilot Proven",
    trlAlignment: "5-6",
    description: "Capability demonstrated in pilot environment. Process validated at small scale.",
    keyActivities: [
      "Pilot production run completed",
      "Process capability (Cpk) measured",
      "Supply chain risk assessment completed",
      "Cost model validated against actuals",
    ],
    exitCriteria: [
      "Pilot run completed with yield ≥ 85%",
      "Cpk ≥ 1.33 on critical parameters",
      "Supply chain risk score < 60 (AMBER or better)",
    ],
  },
  {
    level: 6,
    label: "Pre-Series",
    trlAlignment: "6-7",
    description: "Pre-production units produced. Process demonstrated in production-representative environment.",
    keyActivities: [
      "Pre-series production run",
      "PPAP / FMEA completed",
      "Dual-source suppliers confirmed",
      "Compliance certifications initiated",
    ],
    exitCriteria: [
      "Pre-series units meet all specifications",
      "PPAP approved",
      "Dual-source strategy in place for T1 components",
    ],
  },
  {
    level: 7,
    label: "Low-Rate",
    trlAlignment: "7-8",
    description: "Low-rate initial production (LRIP) demonstrated. Process stable at low volume.",
    keyActivities: [
      "LRIP production line operational",
      "OEE measurement established",
      "Compliance certifications achieved",
      "Cost model aligned to LRIP actuals",
    ],
    exitCriteria: [
      "LRIP yield ≥ 92%",
      "OEE ≥ 65%",
      "All required certifications achieved",
    ],
  },
  {
    level: 8,
    label: "Scale-Up",
    trlAlignment: "8-9",
    description: "Pilot production line operating at target volume. Scale-up to full production underway.",
    keyActivities: [
      "Scale production line to target volume",
      "Continuous improvement programme active",
      "Full supply chain contracted",
      "LCSA baseline established",
    ],
    exitCriteria: [
      "Production at ≥ 70% of target volume",
      "OEE ≥ 75%",
      "LCSA baseline documented",
    ],
  },
  {
    level: 9,
    label: "Industrial",
    trlAlignment: "9",
    description: "Full industrial-scale production achieved. Process mature, stable, and continuously improving.",
    keyActivities: [
      "Full-rate production at target volume",
      "Lean/Six Sigma programme active",
      "Carbon intensity target achieved",
      "Supply chain fully resilient",
    ],
    exitCriteria: [
      "Production at 100% of target volume",
      "OEE ≥ 85%",
      "Carbon intensity target met",
      "Zero critical supply chain single-source dependencies",
    ],
  },
] as const;

export type MrlLevelDef = (typeof MRL_LEVELS)[number];

// ── Subsystem Definitions ─────────────────────────────────────────────────────
export const MRL_SUBSYSTEMS = [
  {
    id: "pde",
    name: "Process Design Engine",
    color: "#00E5C8",
    description: "Directed-graph process route analysis. Maps operations, bottlenecks, tooling, and cycle time.",
    inputs: ["Product BOM", "Material specs", "TRL stage", "Target volume"],
    outputs: ["Process route", "Bottleneck map", "Tooling requirements", "Cycle time model"],
    riskFactors: ["Process complexity", "Novel materials", "Tooling lead time"],
  },
  {
    id: "scie",
    name: "Supply Chain Intelligence Engine",
    color: "#FF6B35",
    description: "Supplier mapping, dual-source strategy, and risk-weighted supply chain scoring.",
    inputs: ["BOM tier breakdown", "Geolocation preferences", "Lead time targets", "MOQ constraints"],
    outputs: ["Supplier shortlist", "Dual-source map", "Risk-weighted SC score"],
    riskFactors: ["Single-source dependency", "Geopolitical exposure", "FX volatility"],
  },
  {
    id: "csm",
    name: "Cost & Scale Model",
    color: "#A855F7",
    description: "Parametric cost modelling with volume scenarios, unit economics, and sensitivity analysis.",
    inputs: ["Volume scenarios", "Process route", "Labour rates by region", "CapEx constraints"],
    outputs: ["Unit economics curve", "Break-even volume", "CapEx/OpEx split", "COGS breakdown"],
    riskFactors: ["Volume forecast accuracy", "FX exposure", "Raw material volatility"],
  },
  {
    id: "qce",
    name: "Quality & Compliance Engine",
    color: "#22D3EE",
    description: "Compliance gap analysis, certification roadmap, and quality KPI framework.",
    inputs: ["Target markets", "Product category", "Material declarations", "Process certifications"],
    outputs: ["Compliance gap analysis", "Certification roadmap", "Quality KPI framework"],
    riskFactors: ["Unknown certification timelines", "Market-specific standards drift"],
  },
  {
    id: "sil",
    name: "Sustainability Integration Layer",
    color: "#4ADE80",
    description: "LCSA scoring aligned to ISO 14040/44. Carbon intensity, social risk, and circularity index.",
    inputs: ["Process route", "BOM", "Energy mix by facility", "Transport modes"],
    outputs: ["LCSA score", "Carbon intensity (kgCO2e/unit)", "Social risk index"],
    riskFactors: ["Scope 3 data gaps", "Carbon border adjustment (CBAM)", "ESG reporting lag"],
  },
] as const;

export type SubsystemId = "pde" | "scie" | "csm" | "qce" | "sil";

// ── VRL Weights ───────────────────────────────────────────────────────────────
// MRL feeds VRL via TWO independent meta-domain pathways (see vrl.engine.ts):
//   Product meta-domain    mrlScore × 0.35
//   Execution meta-domain  mrlScore × 0.40
// Pass mrlScore (0–100) directly to computeVrl() in vrl.engine.ts.
/** MRL → Product meta-domain weight in the VRL dual-pathway composite. */
export const MRL_VRL_WEIGHT_PRODUCT = 0.35 as const;
/** MRL → Execution meta-domain weight in the VRL dual-pathway composite. */
export const MRL_VRL_WEIGHT_EXECUTION = 0.40 as const;

/** Other engine weights retained for reference (non-MRL). */
export const VRL_WEIGHTS = {
  trl: 0.25,
  market: 0.20,
  team: 0.15,
  esg: 0.10,
} as const;

// ── Risk Engine ───────────────────────────────────────────────────────────────
export const RISK_THRESHOLDS = { green: 30, amber: 60, red: 100 } as const;

export const DEFAULT_RISK_MITIGATIONS = [
  { risk: "Single-source CN supplier", action: "Dual-source + safety stock", priority: "HIGH" as const },
  { risk: "Novel process unvalidated", action: "Piloting milestone gate", priority: "HIGH" as const },
  { risk: "CBAM exposure", action: "Carbon accounting integration", priority: "MED" as const },
  { risk: "Certification timeline slip", action: "Pre-submission meetings with certifying body", priority: "MED" as const },
  { risk: "FX volatility", action: "Hedging strategy + local sourcing fallback", priority: "MED" as const },
];

// ── CN/UK Integration Model ───────────────────────────────────────────────────
export const INTEGRATION_MODEL = {
  china: {
    label: "CN Manufacturing",
    hubs: ["Shenzhen (electronics + PCB)", "Dongguan (plastic injection)", "Guangzhou (general manufacturing)"],
    advantages: ["Cost 40–70% below UK", "Ecosystem depth", "Speed to scale", "Tooling expertise"],
    risks: ["Geopolitical exposure", "IP exposure", "Quality variability", "Lead time 8–16 weeks"],
    triggerMrlLevels: [6, 7, 8, 9],
  },
  uk: {
    label: "UK Prototyping",
    hubs: ["Midlands (automotive/precision)", "M4 corridor (tech/biotech)", "Scotland (advanced manufacturing)"],
    advantages: ["IP protection", "UKCA ready", "Proximity + agility", "ESG credentials"],
    risks: ["Cost 3–5× CN", "Capacity constraints", "Skills shortage", "MOQ inflexibility"],
    triggerMrlLevels: [3, 4, 5],
  },
  hybrid: {
    strategy: "CN scale + UK prototype/validate",
    triggerPoints: [
      { mrlRange: "3–5", action: "UK prototyping" },
      { mrlRange: "6–7", action: "CN tooling + pilot" },
      { mrlRange: "8–9", action: "CN full-rate production" },
    ],
    costOptimisation: "40–60% COGS reduction vs full-UK at MRL 9",
  },
} as const;

// ── Scoring Functions ─────────────────────────────────────────────────────────

/**
 * Compute RAG-weighted risk score.
 * Formula: (ragValue × probability × impact) / 300 → 0–100
 * RAG values: G=1, A=2, R=3
 */
export function computeRiskScore(
  rag: "G" | "A" | "R",
  probability: number,
  impact: number
): number {
  const ragValue = rag === "G" ? 1 : rag === "A" ? 2 : 3;
  return Math.min(100, Math.round((ragValue * probability * impact) / 300));
}

/**
 * Classify risk score into RAG band.
 */
export function classifyRiskRag(score: number): "GREEN" | "AMBER" | "RED" {
  if (score <= RISK_THRESHOLDS.green) return "GREEN";
  if (score <= RISK_THRESHOLDS.amber) return "AMBER";
  return "RED";
}

/**
 * Compute composite MRL score from five subsystem scores (0–100 each).
 * Equal weighting (0.20 each) across PDE, SCIE, CSM, QCE, SIL.
 */
export function computeCompositeMrlScore(scores: {
  pde: number;
  scie: number;
  csm: number;
  qce: number;
  sil: number;
}): number {
  const { pde, scie, csm, qce, sil } = scores;
  return Math.round((pde + scie + csm + qce + sil) / 5);
}

/**
 * Derive MRL level (1–9) from composite score (0–100).
 * Each level represents ~11 points of the 0–100 scale.
 *
 * Clamps gracefully: scores below 0 return level 1; scores above 100 return
 * level 9. No exception is thrown — subsystem score validation at the router
 * layer is the canonical bound enforcement mechanism. Engine B maturity
 * multipliers can push raw scores above 100; the call-site cap in mrlScoring.ts
 * handles that case before delegating here.
 */
export function compositeScoreToMrlLevel(compositeScore: number): number {
  const clamped = Math.max(0, Math.min(100, compositeScore));
  return Math.min(9, Math.max(1, Math.ceil(clamped / 11.11)));
}

/**
 * B-02 / D6 fix: Canonical MRL → VRL input.
 *
 * Returns the normalised MRL score (0–1) that feeds directly into vrl.engine.ts.
 * MRL enters the VRL composite via TWO pathways (both intentional by design):
 *   Product meta-domain    mrlScore × 0.35
 *   Execution meta-domain  mrlScore × 0.40
 *
 * This overload converts a level (1–9) to the equivalent normalised 0–1 score.
 * When a raw mrlScore (0–100) is available from computeMRLScore(), prefer using
 * it directly: mrlScore / 100.
 *
 * Previously returned a value on a 0–30 scale (normalised × 0.30) — that was
 * wrong; the 0.30 was a stale single-pathway weight.  Now returns 0–1. (D6 fix)
 */
export function computeVrlContribution(mrlLevel: number): number {
  const mrlScore = ((mrlLevel - 1) / 8) * 100; // level (1–9) → score (0–100)
  return Math.round((mrlScore / 100) * 10000) / 10000; // → normalised 0–1 (4 dp)
}

/**
 * Derive recommended manufacturing region from MRL level.
 */
export function recommendRegion(mrlLevel: number): "CN" | "UK" | "HYBRID" {
  if (mrlLevel <= 2) return "UK";
  if (mrlLevel <= 5) return "HYBRID";
  return "CN";
}

/**
 * Get MRL level definition by level number.
 */
export function getMrlLevelDef(level: number): MrlLevelDef | undefined {
  return MRL_LEVELS.find((l) => l.level === level);
}

/**
 * Get TRL→MRL alignment: given a TRL level, return the expected MRL range.
 */
export function trlToMrlAlignment(trlLevel: number): { minMrl: number; maxMrl: number; label: string } {
  const map: Record<number, { minMrl: number; maxMrl: number; label: string }> = {
    1: { minMrl: 1, maxMrl: 1, label: "Concept" },
    2: { minMrl: 1, maxMrl: 2, label: "Concept–Feasibility" },
    3: { minMrl: 2, maxMrl: 3, label: "Feasibility–Process Dev" },
    4: { minMrl: 3, maxMrl: 4, label: "Process Dev–Pilot Ready" },
    5: { minMrl: 4, maxMrl: 5, label: "Pilot Ready–Pilot Proven" },
    6: { minMrl: 5, maxMrl: 6, label: "Pilot Proven–Pre-Series" },
    7: { minMrl: 6, maxMrl: 7, label: "Pre-Series–Low-Rate" },
    8: { minMrl: 7, maxMrl: 8, label: "Low-Rate–Scale-Up" },
    9: { minMrl: 8, maxMrl: 9, label: "Scale-Up–Industrial" },
  };
  return map[trlLevel] ?? { minMrl: 1, maxMrl: 9, label: "Unknown" };
}

/**
 * Check if MRL level is aligned with TRL level.
 * Returns true if MRL is within the expected range for the given TRL.
 */
export function isMrlTrlAligned(mrlLevel: number, trlLevel: number): boolean {
  const alignment = trlToMrlAlignment(trlLevel);
  return mrlLevel >= alignment.minMrl && mrlLevel <= alignment.maxMrl + 1;
}

/**
 * Generate a risk register pre-populated with default manufacturing risks
 * appropriate for the given MRL level.
 */
export function generateDefaultRisks(mrlLevel: number): Array<{
  category: "Technical" | "Supply Chain" | "Cost" | "Compliance" | "Sustainability";
  description: string;
  rag: "G" | "A" | "R";
  probability: number;
  impact: number;
  riskScore: number;
  priority: "LOW" | "MED" | "HIGH";
  mitigationAction: string;
}> {
  const risks = [];

  // Technical risk — higher at lower MRL levels
  if (mrlLevel <= 4) {
    risks.push({
      category: "Technical" as const,
      description: "Novel process unvalidated at production scale",
      rag: "R" as const,
      probability: 70,
      impact: 80,
      riskScore: computeRiskScore("R", 70, 80),
      priority: "HIGH" as const,
      mitigationAction: "Complete piloting milestone gate before committing to tooling",
    });
  }

  // Supply chain risk — single source
  risks.push({
    category: "Supply Chain" as const,
    description: "Single-source CN supplier dependency for critical BOM components",
    rag: mrlLevel <= 5 ? ("R" as const) : ("A" as const),
    probability: mrlLevel <= 5 ? 65 : 40,
    impact: 85,
    riskScore: computeRiskScore(mrlLevel <= 5 ? "R" : "A", mrlLevel <= 5 ? 65 : 40, 85),
    priority: "HIGH" as const,
    mitigationAction: "Identify and qualify dual-source supplier within 90 days",
  });

  // Cost risk
  risks.push({
    category: "Cost" as const,
    description: "FX volatility impacting CN-sourced component costs",
    rag: "A" as const,
    probability: 50,
    impact: 60,
    riskScore: computeRiskScore("A", 50, 60),
    priority: "MED" as const,
    mitigationAction: "Implement FX hedging strategy and evaluate local sourcing fallback",
  });

  // Compliance risk
  if (mrlLevel >= 4) {
    risks.push({
      category: "Compliance" as const,
      description: "Certification timeline slip for target market entry",
      rag: "A" as const,
      probability: 45,
      impact: 70,
      riskScore: computeRiskScore("A", 45, 70),
      priority: "MED" as const,
      mitigationAction: "Schedule pre-submission meetings with certifying body 6 months ahead",
    });
  }

  // Sustainability risk — CBAM
  if (mrlLevel >= 5) {
    risks.push({
      category: "Sustainability" as const,
      description: "CBAM exposure on CN-manufactured components imported to EU",
      rag: "A" as const,
      probability: 55,
      impact: 50,
      riskScore: computeRiskScore("A", 55, 50),
      priority: "MED" as const,
      mitigationAction: "Integrate carbon accounting and assess CBAM cost impact in cost model",
    });
  }

  return risks;
}
