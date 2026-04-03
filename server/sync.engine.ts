/**
 * TRL/MRL Synchronisation Engine — Pure Math Functions
 * Spec: BEBUS-SYNC-SE-001 / trlmrlsyncengine.pdf
 *
 * All formulas implemented exactly as specified.
 * No rounding before final output. Round only at DB/API boundary (4dp max).
 */

// ── Constants ─────────────────────────────────────────────────────────────────

/** W_stage: index = max(TRL, MRL), values 0–9 */
export const STAGE_WEIGHTS = [0, 0.5, 0.6, 0.7, 0.85, 1.0, 1.15, 1.30, 1.50, 1.70] as const;

/** Domain risk amplifier constants — hardcoded, never override */
export const DOMAIN_AMPLIFIERS = { supply: 0.35, cost: 0.25, compliance: 0.20 } as const;

/** Ψ_max — maximum possible misalignment score */
export const PSI_MAX = 8;

/** W_mrl in VRL penalty formula */
export const VRL_WEIGHT_MRL = 0.30;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SyncInput {
  trl: number;                         // 1–9
  mrl: number;                         // 1–9
  domainCriticality?: {
    supply: number;                    // 0–1
    cost: number;                      // 0–1
    compliance: number;                // 0–1
  };
  history?: Array<{ trl: number; mrl: number }>;
  baseVRL?: number;                    // 0–100, default 72
}

export interface SyncResult {
  delta: number;
  absDelta: number;
  psi: number;
  rho: number;
  eta: number;
  vrlPenalty: number;
  adjustedVRL: number;
  wStage: number;
  wVelocity: number;
}

export type ActionType =
  | "SCALE_MFG"
  | "REDESIGN"
  | "SUPPLIER"
  | "COST_MODEL"
  | "MONITOR"
  | "OPTIMISE";

export interface Action {
  type: ActionType;
  label: string;
  priority: "CRITICAL" | "HIGH" | "MED" | "LOW";
  icon: string;
}

export interface DecisionInput {
  trl: number;
  mrl: number;
  sync: SyncResult;
}

export interface DecisionResult {
  primaryPath: string;
  severity: "OK" | "WATCH" | "AMBER" | "RED";
  actions: Action[];
}

// ── Formula 1: Gap Delta ──────────────────────────────────────────────────────
// Δ = TRL − MRL
// Range: −8 to +8 (signed integer)
// Δ > 0 → Technology ahead of manufacturing (most common)
// Δ < 0 → Manufacturing ahead of technology (over-invest)
// Δ = 0 → Synchronised

// ── Formula 2: Misalignment Score (Ψ) ────────────────────────────────────────
// Ψ = |Δ| × W_stage × W_velocity
// W_stage: index = max(TRL, MRL)
// W_velocity: 1.0 if history < 2 entries; else 1.0 + max(0, trend) × 0.1
//   trend = |recent[1].delta| − |recent[0].delta|  (last 2 history entries)

// ── Formula 3: Risk Score (ρ) ─────────────────────────────────────────────────
// ρ = Ψ × (1 + α·C_supply + β·C_cost + γ·C_compliance)
// α=0.35, β=0.25, γ=0.20

// ── Formula 4: Sync Efficiency (η) ───────────────────────────────────────────
// η = max(0, min(1, 1 − (Ψ / Ψ_max)))

// ── Formula 5: VRL Sync Penalty (δ_VRL) ──────────────────────────────────────
// δ_VRL = (1 − η) × W_mrl_in_VRL   where W_mrl_in_VRL = 0.30
// Adjusted_VRL = Base_VRL × (1 − δ_VRL)

/**
 * computeSync — implements all 5 formulas exactly as specified.
 * Full floating-point precision throughout; rounding only at API/DB boundary.
 */
export function computeSync(input: SyncInput): SyncResult {
  const { trl, mrl, domainCriticality, history = [], baseVRL = 72 } = input;

  // Formula 1 — Gap Delta
  const delta = trl - mrl;
  const absDelta = Math.abs(delta);

  // Formula 2 — W_stage: index = max(TRL, MRL), clamped to [0,9]
  const stageIndex = Math.min(9, Math.max(0, Math.max(trl, mrl)));
  const wStage = STAGE_WEIGHTS[stageIndex];

  // Formula 2 — W_velocity
  let wVelocity = 1.0;
  if (history.length >= 2) {
    const recent = history.slice(-2);
    const trend = Math.abs(recent[1].trl - recent[1].mrl) - Math.abs(recent[0].trl - recent[0].mrl);
    wVelocity = 1.0 + Math.max(0, trend) * 0.1;
  }

  // Formula 2 — Misalignment Score (Ψ)
  const psi = absDelta * wStage * wVelocity;

  // Formula 3 — Domain criticality (default 0.5 if not provided)
  const supply     = domainCriticality?.supply     ?? 0.5;
  const cost       = domainCriticality?.cost       ?? 0.5;
  const compliance = domainCriticality?.compliance ?? 0.5;

  const domainTerm =
    DOMAIN_AMPLIFIERS.supply     * supply +
    DOMAIN_AMPLIFIERS.cost       * cost +
    DOMAIN_AMPLIFIERS.compliance * compliance;

  // Formula 3 — Risk Score (ρ)
  const rho = psi * (1 + domainTerm);

  // Formula 4 — Sync Efficiency (η)
  const eta = Math.max(0, Math.min(1, 1 - psi / PSI_MAX));

  // Formula 5 — VRL Sync Penalty
  const vrlPenalty = (1 - eta) * VRL_WEIGHT_MRL;
  const adjustedVRL = baseVRL * (1 - vrlPenalty);

  return {
    delta,
    absDelta,
    psi,
    rho,
    eta,
    vrlPenalty,
    adjustedVRL,
    wStage,
    wVelocity,
  };
}

// ── Decision Tree ─────────────────────────────────────────────────────────────

/** Icon mapping for action types */
const ACTION_ICONS: Record<ActionType, string> = {
  SCALE_MFG:  "⚙️",
  REDESIGN:   "🔧",
  SUPPLIER:   "🏭",
  COST_MODEL: "💰",
  MONITOR:    "📊",
  OPTIMISE:   "🎯",
};

function makeAction(type: ActionType, priority: Action["priority"], label: string): Action {
  return { type, priority, label, icon: ACTION_ICONS[type] };
}

/**
 * runDecisionTree — implements the full decision tree exactly as specified.
 * No deviation from the spec's delta thresholds and action lists.
 */
export function runDecisionTree(input: DecisionInput): DecisionResult {
  const { sync } = input;
  const { delta } = sync;

  // delta === 0: ALIGNED
  if (delta === 0) {
    return {
      severity: "OK",
      primaryPath: "ALIGNED",
      actions: [
        makeAction("MONITOR",  "LOW", "Maintain sync cadence"),
        makeAction("OPTIMISE", "LOW", "Optimise process yield"),
      ],
    };
  }

  // TRL ahead of manufacturing (delta > 0)
  if (delta > 0) {
    if (delta === 1) {
      return {
        severity: "WATCH",
        primaryPath: "TRL_MINOR_LEAD",
        actions: [
          makeAction("SCALE_MFG", "MED", "Initiate manufacturing readiness sprint"),
          makeAction("SUPPLIER",  "MED", "Pre-qualify tier-1 suppliers"),
        ],
      };
    }
    if (delta === 2) {
      return {
        severity: "AMBER",
        primaryPath: "TRL_MODERATE_LEAD",
        actions: [
          makeAction("SCALE_MFG",  "HIGH", "Accelerate process design — assign MFG lead"),
          makeAction("SUPPLIER",   "HIGH", "Dual-source critical components now"),
          makeAction("COST_MODEL", "MED",  "Rerun unit economics at target MRL+2"),
        ],
      };
    }
    // delta >= 3
    return {
      severity: "RED",
      primaryPath: "TRL_CRITICAL_LEAD",
      actions: [
        makeAction("SCALE_MFG",  "CRITICAL", "CRITICAL: Manufacturing gate block — halt TRL advance"),
        makeAction("REDESIGN",   "CRITICAL", "Design-for-manufacture review mandatory"),
        makeAction("SUPPLIER",   "HIGH",     "Emergency supplier qualification programme"),
        makeAction("COST_MODEL", "HIGH",     "Full CapEx replan required"),
      ],
    };
  }

  // Manufacturing ahead of technology (delta < 0)
  if (delta === -1) {
    return {
      severity: "WATCH",
      primaryPath: "MRL_MINOR_LEAD",
      actions: [
        makeAction("MONITOR",  "LOW", "Hold manufacturing capacity — TRL sprint recommended"),
        makeAction("OPTIMISE", "LOW", "Use surplus MRL capacity for process optimisation"),
      ],
    };
  }
  if (delta === -2) {
    return {
      severity: "AMBER",
      primaryPath: "MRL_MODERATE_LEAD",
      actions: [
        makeAction("REDESIGN",   "MED", "Review product spec — over-engineering risk"),
        makeAction("COST_MODEL", "MED", "Assess idle MFG cost burn — consider partial mothball"),
      ],
    };
  }
  // delta <= -3
  return {
    severity: "RED",
    primaryPath: "MRL_CRITICAL_LEAD",
    actions: [
      makeAction("REDESIGN",   "CRITICAL", "CRITICAL: Product redesign — technology not ready for MFG scale"),
      makeAction("COST_MODEL", "CRITICAL", "Immediate CapEx freeze on MFG investment"),
      makeAction("SUPPLIER",   "HIGH",     "Suspend supplier contracts — renegotiate terms"),
    ],
  };
}

// ── Utility: round to 4dp for DB/API output ───────────────────────────────────
export function roundSync(result: SyncResult): SyncResult {
  const r = (n: number) => Math.round(n * 10000) / 10000;
  return {
    delta:       result.delta,
    absDelta:    result.absDelta,
    psi:         r(result.psi),
    rho:         r(result.rho),
    eta:         r(result.eta),
    vrlPenalty:  r(result.vrlPenalty),
    adjustedVRL: Math.round(result.adjustedVRL * 100) / 100,
    wStage:      result.wStage,
    wVelocity:   r(result.wVelocity),
  };
}
