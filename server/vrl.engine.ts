/**
 * VRL Weighted Gating Model Engine — BEBUS-VRL-UPDATE-001
 * EcoBlendVRLUpdateManusPrompt.pdf — Change 2
 *
 * Formula:
 *   1. Compute 5 meta-domain scores (weighted averages of the 9 input vectors)
 *   2. Compute base average = mean of 5 meta-domain scores
 *   3. Apply veto gate: if any single input score < 20 → isVetoed = true, globalVrlScore = 0
 *   4. If not vetoed: globalVrlScore = round(baseAverage), bandLabel from band table
 *
 * Meta-domain weights (spec §3.1):
 *   Product:        TRL(0.40) + MRL(0.35) + BRL(0.25)
 *   Market:         BRL(0.50) + PRL(0.50)
 *   Execution:      FRL(0.60) + MRL(0.40)
 *   Structural:     IP(0.50)  + REG(0.50)
 *   Sustainability: ECO(0.60) + SRL(0.40)
 *
 * Band table (spec §3.2):
 *   0–19   → VRL-0: Pre-Readiness
 *   20–39  → VRL-1: Emerging
 *   40–54  → VRL-2: Developing
 *   55–69  → VRL-3: Established
 *   70–84  → VRL-4: Advanced
 *   85–100 → VRL-5: Exemplary
 */

/** Keys of the nine scoreable VRL dimensions — used for evidence-link typing. */
export type VrlDimensionKey =
  | "trlScore" | "mrlScore" | "brlScore" | "ecoScore" | "prlScore"
  | "ipScore"  | "frlScore" | "regScore" | "srlScore";

export interface VrlInputs {
  trlScore:  number; // 0–100
  mrlScore:  number; // 0–100
  brlScore:  number; // 0–100
  ecoScore:  number; // 0–100
  prlScore:  number; // 0–100
  ipScore:   number; // 0–100
  frlScore:  number; // 0–100
  regScore:  number; // 0–100
  srlScore:  number; // 0–100
  /**
   * B-03 / D7 fix: Optional evidence-record IDs keyed by dimension.
   * Omit a key, or supply an empty string, and the dimension is flagged
   * as self-assessed in the result. No hard rejection — the score still
   * computes; callers inspect selfAssessedDimensions for gate decisions.
   */
  evidenceLinks?: Partial<Record<VrlDimensionKey, string>>;
}

export interface VrlMetaDomains {
  productScore:        number;
  marketScore:         number;
  executionScore:      number;
  structuralScore:     number;
  sustainabilityScore: number;
}

export interface VrlResult {
  // Inputs (echoed back)
  inputs: VrlInputs;
  // Meta-domain scores
  metaDomains: VrlMetaDomains;
  // Base average (mean of 5 meta-domain scores)
  baseAverage: number;
  // Veto gate
  isVetoed: boolean;
  vetoedDimensions: string[]; // names of dimensions with score < 20
  // Final output
  globalVrlScore: number; // 0 if vetoed, else round(baseAverage)
  bandLabel: string;
  bandLevel: number; // 0–5
  // B-03 / D7 fix: Evidence-link enforcement
  selfAssessedDimensions: string[]; // dimension labels lacking an evidence link
  hasUnverifiedInputs: boolean;     // true when any dimension is self-assessed
}

// ── Band table ────────────────────────────────────────────────────────────────
export interface VrlBand {
  level: number;
  label: string;
  min: number;
  max: number;
  color: string;
}

export const VRL_BANDS: VrlBand[] = [
  { level: 0, label: "Pre-Readiness",  min: 0,   max: 19,  color: "#6b7280" },
  { level: 1, label: "Emerging",       min: 20,  max: 39,  color: "#f59e0b" },
  { level: 2, label: "Developing",     min: 40,  max: 54,  color: "#f97316" },
  { level: 3, label: "Established",    min: 55,  max: 69,  color: "#22c55e" },
  { level: 4, label: "Advanced",       min: 70,  max: 84,  color: "#3b82f6" },
  { level: 5, label: "Exemplary",      min: 85,  max: 100, color: "#7c3aed" },
];

// ── Dimension labels (for veto messages) ─────────────────────────────────────
const DIM_LABELS: Record<keyof VrlInputs, string> = {
  trlScore:  "TRL (Technology Readiness)",
  mrlScore:  "MRL (Manufacturing Readiness)",
  brlScore:  "BRL (Business Readiness)",
  ecoScore:  "ECO (Environmental Impact)",
  prlScore:  "PRL (People & Org Readiness)",
  ipScore:   "IP (Intellectual Property)",
  frlScore:  "FRL (Financial Readiness)",
  regScore:  "REG (Regulatory Readiness)",
  srlScore:  "SRL (Sustainability Readiness)",
};

// ── Veto threshold ────────────────────────────────────────────────────────────
const VETO_THRESHOLD = 20;

// ── Pure math functions ───────────────────────────────────────────────────────

/** Compute the 5 meta-domain scores from the 9 raw inputs */
export function computeMetaDomains(inputs: VrlInputs): VrlMetaDomains {
  const { trlScore, mrlScore, brlScore, ecoScore, prlScore, ipScore, frlScore, regScore, srlScore } = inputs;
  return {
    productScore:        round2(trlScore * 0.40 + mrlScore * 0.35 + brlScore * 0.25),
    marketScore:         round2(brlScore * 0.50 + prlScore * 0.50),
    executionScore:      round2(frlScore * 0.60 + mrlScore * 0.40),
    structuralScore:     round2(ipScore  * 0.50 + regScore * 0.50),
    sustainabilityScore: round2(ecoScore * 0.60 + srlScore * 0.40),
  };
}

/** Compute the base average (mean of 5 meta-domain scores) */
export function computeBaseAverage(meta: VrlMetaDomains): number {
  const vals = [meta.productScore, meta.marketScore, meta.executionScore, meta.structuralScore, meta.sustainabilityScore];
  return round2(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/** Identify which dimensions trigger the veto gate (score < 20) */
export function findVetoedDimensions(inputs: VrlInputs): string[] {
  return (Object.keys(inputs) as (keyof VrlInputs)[])
    .filter(k => inputs[k] < VETO_THRESHOLD)
    .map(k => DIM_LABELS[k]);
}

/** Map a score to a band */
export function scoreToBand(score: number): VrlBand {
  return VRL_BANDS.find(b => score >= b.min && score <= b.max) ?? VRL_BANDS[0];
}

/** Full engine — takes 9 raw inputs, returns complete VrlResult */
export function computeVrl(inputs: VrlInputs): VrlResult {
  // Clamp all inputs to 0–100
  const clamped = clampInputs(inputs);

  const metaDomains  = computeMetaDomains(clamped);
  const baseAverage  = computeBaseAverage(metaDomains);
  const vetoedDims   = findVetoedDimensions(clamped);
  const isVetoed     = vetoedDims.length > 0;
  const globalVrlScore = isVetoed ? 0 : Math.round(baseAverage);
  const band         = scoreToBand(globalVrlScore);

  // B-03 / D7 fix: Evidence-link enforcement
  // A dimension is self-assessed when its evidence key is absent or empty.
  // This does NOT veto the gate — callers read selfAssessedDimensions to decide
  // whether to surface a warning or block a governance gate downstream.
  const evidence = inputs.evidenceLinks ?? {};
  const dimKeys = Object.keys(DIM_LABELS) as VrlDimensionKey[];
  const selfAssessedDimensions = dimKeys
    .filter(k => !evidence[k] || evidence[k]!.trim() === "")
    .map(k => DIM_LABELS[k]);

  return {
    inputs: clamped,
    metaDomains,
    baseAverage,
    isVetoed,
    vetoedDimensions: vetoedDims,
    globalVrlScore,
    bandLabel: isVetoed ? "Vetoed — Pre-Readiness" : band.label,
    bandLevel: isVetoed ? 0 : band.level,
    selfAssessedDimensions,
    hasUnverifiedInputs: selfAssessedDimensions.length > 0,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function clampInputs(inputs: VrlInputs): VrlInputs {
  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
  return {
    trlScore:  clamp(inputs.trlScore),
    mrlScore:  clamp(inputs.mrlScore),
    brlScore:  clamp(inputs.brlScore),
    ecoScore:  clamp(inputs.ecoScore),
    prlScore:  clamp(inputs.prlScore),
    ipScore:   clamp(inputs.ipScore),
    frlScore:  clamp(inputs.frlScore),
    regScore:  clamp(inputs.regScore),
    srlScore:  clamp(inputs.srlScore),
  };
}
