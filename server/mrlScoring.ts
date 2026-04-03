/**
 * ECOBLEND OS — MRL Scoring Engine
 * Reference: BEBUS-MRL-SCORE-001 / mrl_scoring_system.jsx
 *
 * MASTER FORMULA:
 *   MRL_score = [ Σ(w_i × S_i × M_i) / Σ w_i ] × 10
 *
 * All functions are pure, side-effect-free exports.
 * Precision rules:
 *   - Never round intermediate values
 *   - Round final MRL_score to 1 decimal place only
 *   - Round category contributions to 3 decimal places
 */

// ── TYPES ─────────────────────────────────────────────────────────────────────

export type CategoryKey =
  | "process"
  | "supply_chain"
  | "cost"
  | "quality"
  | "sustainability";

export type MaturityLevel = 0 | 1 | 2 | 3 | 4;

export interface CategoryInput {
  maturity: MaturityLevel; // default 2
  // process
  p1?: number; p2?: number; p3?: number;
  p4?: number; p5?: number; p6?: number;
  // supply_chain
  s1?: number; s2?: number; s3?: number;
  s4?: number; s5?: number; s6?: number;
  // cost
  c1?: number; c2?: number; c3?: number;
  c4?: number; c5?: number; c6?: number;
  // quality
  q1?: number; q2?: number; q3?: number;
  q4?: number; q5?: number; q6?: number;
  // sustainability
  e1?: number; e2?: number; e3?: number;
  e4?: number; e5?: number; e6?: number;
}

export interface ScoringInput {
  venture_id?: string;
  venture_name?: string;
  process: CategoryInput;
  supply_chain: CategoryInput;
  cost: CategoryInput;
  quality: CategoryInput;
  sustainability: CategoryInput;
}

export interface CategoryResult {
  score_S: number;         // avg of sub-indicators [0–10]
  maturity_M: number;      // multiplier [0.60–1.20]
  weight_w: number;        // category weight
  contribution: number;    // w × S × M (3dp)
  maturity_label: string;  // "Assumed"|"Estimated"|"Measured"|"Validated"|"Certified"
  indicators: Record<string, number>; // raw scores
}

export interface ScoringResult {
  mrl_score: number;       // 0–100, 1dp (after gate lock)
  mrl_score_raw: number;   // before gate lock, 1dp
  mrl_level: number;       // 1–9
  mrl_label: string;       // "Concept" | "Feasibility" etc.
  confidence_band: number; // ± points, 2dp
  gate_locked: boolean;
  gate_reason: string | null;
  categories: Record<CategoryKey, CategoryResult>;
  vrl_feed: {
    mrl_score_normalised: number;   // mrl_score / 100
    mrl_weight_in_vrl: 0.30;
    vrl_mrl_contribution: number;   // normalised × 0.30
  };
}

// ── CONSTANTS (hardcoded, never in config or DB) ───────────────────────────────

/** Formula 2 — Category weights. Must sum to exactly 1.0. */
export const WEIGHTS: Record<CategoryKey, number> = {
  process:        0.28,
  supply_chain:   0.22,
  cost:           0.20,
  quality:        0.18,
  sustainability: 0.12,
};

/** Formula 4 — Maturity multipliers. */
export const MATURITY_MULTIPLIERS: Record<MaturityLevel, { label: string; M: number }> = {
  0: { label: "Assumed",   M: 0.60 },
  1: { label: "Estimated", M: 0.80 },
  2: { label: "Measured",  M: 1.00 },
  3: { label: "Validated", M: 1.10 },
  4: { label: "Certified", M: 1.20 },
};

/** Formula 7 — MRL level thresholds. */
export const MRL_THRESHOLDS: Array<{ level: number; min: number; max: number; label: string; trl_alignment: string }> = [
  { level: 1, min:  0.0, max: 11.0, label: "Concept",      trl_alignment: "TRL 1–2" },
  { level: 2, min: 11.0, max: 22.0, label: "Feasibility",  trl_alignment: "TRL 2–3" },
  { level: 3, min: 22.0, max: 33.0, label: "Process Dev",  trl_alignment: "TRL 3–4" },
  { level: 4, min: 33.0, max: 44.0, label: "Pilot Ready",  trl_alignment: "TRL 4–5" },
  { level: 5, min: 44.0, max: 55.0, label: "Pilot Proven", trl_alignment: "TRL 5–6" },
  { level: 6, min: 55.0, max: 66.0, label: "Pre-Series",   trl_alignment: "TRL 6–7" },
  { level: 7, min: 66.0, max: 77.0, label: "Low-Rate",     trl_alignment: "TRL 7–8" },
  { level: 8, min: 77.0, max: 88.0, label: "Scale-Up",     trl_alignment: "TRL 8–9" },
  { level: 9, min: 88.0, max: 100.001, label: "Industrial", trl_alignment: "TRL 9" },
];

/** Formula 5 — Critical indicators and floor thresholds for gate lock.
 *  Sustainability has ZERO critical indicators (intentional per spec §8). */
export const CRITICAL_INDICATORS: Array<{ id: string; label: string; floor: number }> = [
  { id: "p1", label: "Process route defined",       floor: 3.0 },
  { id: "p2", label: "Equipment identified",        floor: 2.0 },
  { id: "p4", label: "Yield rate measured",         floor: 2.0 },
  { id: "s1", label: "Tier-1 suppliers identified", floor: 2.0 },
  { id: "s4", label: "Lead time < target",          floor: 2.0 },
  { id: "c1", label: "BOM costed",                  floor: 3.0 },
  { id: "c3", label: "Unit cost at target volume",  floor: 2.0 },
  { id: "c5", label: "GM% ≥ threshold",             floor: 2.5 },
  { id: "q1", label: "QMS defined",                 floor: 2.0 },
  { id: "q2", label: "Key specs documented",        floor: 3.0 },
  { id: "q5", label: "Compliance standards mapped", floor: 2.0 },
];

/** Sub-indicator IDs per category (authoritative order). */
const CATEGORY_INDICATORS: Record<CategoryKey, string[]> = {
  process:        ["p1", "p2", "p3", "p4", "p5", "p6"],
  supply_chain:   ["s1", "s2", "s3", "s4", "s5", "s6"],
  cost:           ["c1", "c2", "c3", "c4", "c5", "c6"],
  quality:        ["q1", "q2", "q3", "q4", "q5", "q6"],
  sustainability: ["e1", "e2", "e3", "e4", "e5", "e6"],
};

const GATE_LOCK_CAP = 44.0; // top of MRL 4 band

// ── FORMULA 5 — Gate Lock Check ───────────────────────────────────────────────

/**
 * Evaluates ALL critical indicators.
 * Returns locked=true and reason=first failing indicator if any score < floor.
 * Uses strict < comparison: score=floor is OK, score<floor triggers.
 */
export function checkGateLock(indicators: Record<string, number>): {
  locked: boolean;
  reason: string | null;
} {
  let locked = false;
  let reason: string | null = null;

  for (const ci of CRITICAL_INDICATORS) {
    const score = indicators[ci.id] ?? 0;
    if (score < ci.floor) {
      locked = true;
      if (reason === null) {
        reason = `"${ci.label}" below critical floor (${score.toFixed(1)} < ${ci.floor})`;
      }
      // Continue evaluating all — spec says evaluate ALL, return FIRST reason only
    }
  }

  return { locked, reason };
}

// ── FORMULA 6 — Confidence Band ───────────────────────────────────────────────

/**
 * CB = ± ( σ_evidence × 100 ) / ( √n_indicators × 10 )
 * Uses POPULATION std dev (÷ n), NOT sample (÷ n-1).
 */
export function computeConfidenceBand(allScores: number[]): number {
  const n = allScores.length;
  const mean = allScores.reduce((a, b) => a + b, 0) / n;
  const variance = allScores.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const sigma = Math.sqrt(variance);
  const cb = (sigma * 100) / (Math.sqrt(n) * 10);
  return Math.round(cb * 100) / 100; // 2dp
}

// ── FORMULA 7 — MRL Level Lookup ──────────────────────────────────────────────

/**
 * Looks up MRL level from score_effective (after gate lock).
 * Never look up from raw score if gate_locked=true.
 */
export function getMRLLevel(score: number): { level: number; label: string } {
  const threshold = MRL_THRESHOLDS.find(t => score >= t.min && score < t.max);
  if (threshold) return { level: threshold.level, label: threshold.label };
  // Edge case: score exactly 100
  return { level: 9, label: "Industrial" };
}

// ── FORMULA 1+2+3+4 — Master Scoring Function ─────────────────────────────────

/**
 * computeMRLScore — implements the full BEBUS-MRL-SCORE-001 formula chain.
 *
 * Formula order (FIXED, do not reorder):
 *   S_i first → × M_i → × w_i → sum → ÷ Σw_i → × 10
 */
export function computeMRLScore(input: ScoringInput): ScoringResult {
  const catKeys = Object.keys(WEIGHTS) as CategoryKey[];
  const categories: Partial<Record<CategoryKey, CategoryResult>> = {};
  let weightedSum = 0;
  const weightTotal = Object.values(WEIGHTS).reduce((a, b) => a + b, 0); // always 1.0
  const allRawScores: number[] = [];
  const allIndicators: Record<string, number> = {};

  for (const cat of catKeys) {
    const catInput = input[cat];
    const maturityLevel = (catInput.maturity ?? 2) as MaturityLevel;
    const { M, label: maturity_label } = MATURITY_MULTIPLIERS[maturityLevel];
    const w = WEIGHTS[cat];
    const ids = CATEGORY_INDICATORS[cat];

    // Formula 3 — S_i = average of 6 sub-indicators
    const rawScores: Record<string, number> = {};
    let rawSum = 0;
    for (const id of ids) {
      const score = (catInput as unknown as Record<string, number>)[id] ?? 0;
      rawScores[id] = score;
      rawSum += score;
      allRawScores.push(score);
      allIndicators[id] = score;
    }
    const score_S = rawSum / ids.length; // exact, no rounding

    // Formula 4 — contribution = w × S × M (no intermediate rounding)
    const contribution_exact = w * score_S * M;

    weightedSum += contribution_exact;

    categories[cat] = {
      score_S,
      maturity_M: M,
      weight_w: w,
      contribution: Math.round(contribution_exact * 1000) / 1000, // 3dp per spec
      maturity_label,
      indicators: rawScores,
    };
  }

  // Formula 1 — MRL_score = (weightedSum / weightTotal) × 10
  const mrl_score_raw_exact = (weightedSum / weightTotal) * 10;
  const mrl_score_raw = Math.round(mrl_score_raw_exact * 10) / 10; // 1dp

  // Formula 5 — Gate lock
  const { locked: gate_locked, reason: gate_reason } = checkGateLock(allIndicators);
  const mrl_score_effective_exact = gate_locked
    ? Math.min(mrl_score_raw_exact, GATE_LOCK_CAP)
    : mrl_score_raw_exact;
  const mrl_score = Math.round(mrl_score_effective_exact * 10) / 10; // 1dp

  // Formula 7 — Level lookup from score_effective
  const { level: mrl_level, label: mrl_label } = getMRLLevel(mrl_score_effective_exact);

  // Formula 6 — Confidence band
  const confidence_band = computeConfidenceBand(allRawScores);

  // VRL feed
  const mrl_score_normalised = mrl_score / 100;
  const vrl_mrl_contribution = Math.round(mrl_score_normalised * 0.30 * 10000) / 10000;

  return {
    mrl_score,
    mrl_score_raw,
    mrl_level,
    mrl_label,
    confidence_band,
    gate_locked,
    gate_reason,
    categories: categories as Record<CategoryKey, CategoryResult>,
    vrl_feed: {
      mrl_score_normalised,
      mrl_weight_in_vrl: 0.30,
      vrl_mrl_contribution,
    },
  };
}
