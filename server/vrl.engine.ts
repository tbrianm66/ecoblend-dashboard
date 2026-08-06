/**
 * VRL Weighted Gating Model Engine — BEBUS-VRL-UPDATE-001 / Gate 2 MVL+SV-01
 *
 * Formula (Gate 2 — 10 dimensions):
 *   1. Compute 5 meta-domain scores from 10 input vectors
 *   2. Compute base average = weighted sum of 5 meta-domain scores
 *   3. Apply veto gate: if any scored dimension < 20 → isVetoed = true, globalVrlScore = 0
 *      (Profile SV-01: MRL excluded from veto check when mrlIsUnscored = true)
 *   4. If not vetoed: globalVrlScore = round(baseAverage), bandLabel from band table
 *
 * Meta-domain weights (Gate 2 §3.1):
 *   Product:          TRL(0.40) + MRL(0.35) + BRL(0.25)          → weight 0.175 of composite
 *   Market:           BRL(0.25) + PRL(0.25) + MVL(0.50)          → weight 0.30  of composite
 *   Execution:        FRL(0.60) + MRL(0.40)                       → weight 0.175 of composite
 *   Structural:       IP(0.50)  + REG(0.50)                       → weight 0.175 of composite
 *   Sustainability:   ECO(0.60) + SRL(0.40)                       → weight 0.175 of composite
 *
 *   baseAverage = product×0.175 + market×0.30 + execution×0.175 + structural×0.175 + sustainability×0.175
 *   MVL composite contribution = 0.30 × 0.50 = 0.15 (canonical 15% weighting per FHV-EB-AUD-001)
 *
 * Profile SV-01 (SOCIAL_SOFTWARE) — MRL Governed N/A path:
 *   Product (SV-01):  TRL(0.6154) + BRL(0.3846)  (MRL excluded; weights renormalised from 0.40/0.25)
 *   Execution (SV-01): FRL(1.00)                 (MRL excluded; weight renormalised from 0.60)
 *   MRL is excluded from the veto gate check when mrlIsUnscored = true under SV-01.
 *   UNSCORED treatment adheres to B-03 three-state model (EVIDENCED / SELF-ASSESSED / UNSCORED).
 *   MRL = UNSCORED is NOT treated as a numerical zero.
 *
 * Band table (spec §3.2):
 *   0–19   → VRL-0: Pre-Readiness
 *   20–39  → VRL-1: Emerging
 *   40–54  → VRL-2: Developing
 *   55–69  → VRL-3: Established
 *   70–84  → VRL-4: Advanced
 *   85–100 → VRL-5: Exemplary
 */

/** Scoring profile — governs which dimensions are active and gate-checked. */
export type VrlScoringProfile = "STANDARD" | "SV-01_SOCIAL_SOFTWARE";

/** Keys of the ten scoreable VRL dimensions — used for evidence-link typing. */
export type VrlDimensionKey =
  | "trlScore" | "mrlScore" | "brlScore" | "ecoScore" | "prlScore"
  | "ipScore"  | "frlScore" | "regScore" | "srlScore" | "mvlScore";

export interface VrlInputs {
  trlScore:  number; // 0–100
  mrlScore:  number; // 0–100 (ignored in formula when mrlIsUnscored = true under SV-01)
  brlScore:  number; // 0–100
  ecoScore:  number; // 0–100
  prlScore:  number; // 0–100
  ipScore:   number; // 0–100
  frlScore:  number; // 0–100
  regScore:  number; // 0–100
  srlScore:  number; // 0–100
  mvlScore:  number; // 0–100 · Gate 2 · Market Validation Level (customer demand / discovery)
  /**
   * Gate 2 / Profile SV-01: when true, MRL is treated as UNSCORED (N/A, Governed).
   * MRL is excluded from the veto gate and meta-domain formula.
   * Only valid when profile = "SV-01_SOCIAL_SOFTWARE".
   */
  mrlIsUnscored?: boolean;
  /**
   * Scoring profile. Defaults to "STANDARD".
   * "SV-01_SOCIAL_SOFTWARE" enables the governed N/A path for MRL.
   */
  profile?: VrlScoringProfile;
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
  // Base average (weighted sum of 5 meta-domain scores)
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
  // Gate 2 / Profile SV-01
  profile: VrlScoringProfile;
  mrlIsGoverned: boolean; // true when SV-01 profile + mrlIsUnscored=true
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
// Keyed by VrlDimensionKey so the optional fields don't create spurious entries.
const DIM_LABELS: Record<VrlDimensionKey, string> = {
  trlScore:  "TRL (Technology Readiness)",
  mrlScore:  "MRL (Manufacturing Readiness)",
  brlScore:  "BRL (Business Readiness)",
  ecoScore:  "ECO (Environmental Impact)",
  prlScore:  "PRL (People & Org Readiness)",
  ipScore:   "IP (Intellectual Property)",
  frlScore:  "FRL (Financial Readiness)",
  regScore:  "REG (Regulatory Readiness)",
  srlScore:  "SRL (Sustainability Readiness)",
  mvlScore:  "MVL (Market Validation)",
};

// ── MVL microcopy ─────────────────────────────────────────────────────────────
/**
 * Tooltip / microcopy for MVL displayed in the UI and PDF exports.
 * Clarifies that ecological/environmental substance is assessed under SRL
 * (via its ENV, LCA, SMF, SOC, ESG sub-dimensions) and ESG governance — NOT MVL.
 * MVL exclusively measures market demand evidence and customer discovery readiness.
 */
export const MVL_TOOLTIP =
  "Market Validation Level (MVL) measures customer demand evidence, discovery interviews, " +
  "pilot traction, and TAM/SAM/SOM validation. " +
  "Environmental and ecological substance is assessed separately under the " +
  "Sustainability Readiness Level (SRL) system and the ESG dimension — not here.";

// ── Veto threshold ────────────────────────────────────────────────────────────
const VETO_THRESHOLD = 20;

// ── Meta-domain weights ───────────────────────────────────────────────────────
// Gate 2 composite formula weights — must sum to 1.00.
// MVL canonical 15% = MARKET_WEIGHT(0.30) × MVL_IN_MARKET(0.50).
const META_WEIGHTS = {
  product:        0.175,
  market:         0.30,
  execution:      0.175,
  structural:     0.175,
  sustainability: 0.175,
} as const;

// ── Pure math functions ───────────────────────────────────────────────────────

/**
 * Compute the 5 meta-domain scores from 10 raw inputs.
 * Respects Profile SV-01 (mrlIsUnscored): when active, MRL is excluded from
 * Product and Execution formulas and the remaining weights are renormalised.
 */
export function computeMetaDomains(inputs: VrlInputs): VrlMetaDomains {
  const { trlScore, mrlScore, brlScore, ecoScore, prlScore,
          ipScore, frlScore, regScore, srlScore, mvlScore } = inputs;

  const sv01 = inputs.profile === "SV-01_SOCIAL_SOFTWARE" && inputs.mrlIsUnscored === true;

  // Product meta-domain
  const productScore = sv01
    // SV-01: MRL excluded — renormalise TRL(0.40) and BRL(0.25) over their 0.65 total
    ? round2(trlScore * (0.40 / 0.65) + brlScore * (0.25 / 0.65))
    : round2(trlScore * 0.40 + mrlScore * 0.35 + brlScore * 0.25);

  // Market meta-domain — MVL gets 50% = 15% composite (Gate 2)
  const marketScore = round2(brlScore * 0.25 + prlScore * 0.25 + mvlScore * 0.50);

  // Execution meta-domain
  const executionScore = sv01
    // SV-01: MRL excluded — FRL renormalised to 1.00
    ? round2(frlScore * 1.00)
    : round2(frlScore * 0.60 + mrlScore * 0.40);

  const structuralScore     = round2(ipScore  * 0.50 + regScore * 0.50);
  const sustainabilityScore = round2(ecoScore * 0.60 + srlScore * 0.40);

  return { productScore, marketScore, executionScore, structuralScore, sustainabilityScore };
}

/**
 * Compute the base average (weighted sum of 5 meta-domain scores).
 * product×0.175 + market×0.30 + execution×0.175 + structural×0.175 + sustainability×0.175
 */
export function computeBaseAverage(meta: VrlMetaDomains): number {
  return round2(
    meta.productScore        * META_WEIGHTS.product +
    meta.marketScore         * META_WEIGHTS.market +
    meta.executionScore      * META_WEIGHTS.execution +
    meta.structuralScore     * META_WEIGHTS.structural +
    meta.sustainabilityScore * META_WEIGHTS.sustainability
  );
}

/**
 * Identify which dimensions trigger the veto gate (score < 20).
 * Profile SV-01: MRL is excluded when mrlIsUnscored = true.
 */
export function findVetoedDimensions(inputs: VrlInputs): string[] {
  const sv01 = inputs.profile === "SV-01_SOCIAL_SOFTWARE" && inputs.mrlIsUnscored === true;

  // All 10 scored dimension keys
  const ALL_SCORE_KEYS: VrlDimensionKey[] = [
    "trlScore","mrlScore","brlScore","ecoScore",
    "prlScore","ipScore","frlScore","regScore","srlScore","mvlScore",
  ];

  // Under SV-01, skip MRL from veto gate — it is UNSCORED (N/A, Governed), not zero.
  const checkedKeys = sv01
    ? ALL_SCORE_KEYS.filter(k => k !== "mrlScore")
    : ALL_SCORE_KEYS;

  return checkedKeys
    .filter(k => inputs[k] < VETO_THRESHOLD)
    .map(k => DIM_LABELS[k]);
}

/** Map a score to a band */
export function scoreToBand(score: number): VrlBand {
  return VRL_BANDS.find(b => score >= b.min && score <= b.max) ?? VRL_BANDS[0];
}

/** Full engine — takes 10 raw inputs, returns complete VrlResult */
export function computeVrl(inputs: VrlInputs): VrlResult {
  // Clamp all inputs to 0–100
  const clamped = clampInputs(inputs);

  const profile: VrlScoringProfile = clamped.profile ?? "STANDARD";
  const mrlIsGoverned = profile === "SV-01_SOCIAL_SOFTWARE" && clamped.mrlIsUnscored === true;

  const metaDomains    = computeMetaDomains(clamped);
  const baseAverage    = computeBaseAverage(metaDomains);
  const vetoedDims     = findVetoedDimensions(clamped);
  const isVetoed       = vetoedDims.length > 0;
  const globalVrlScore = isVetoed ? 0 : Math.round(baseAverage);
  const band           = scoreToBand(globalVrlScore);

  // B-03 / D7 fix: Evidence-link enforcement
  // A dimension is self-assessed when its evidence key is absent or empty.
  // MRL is excluded from the self-assessed list when it is governed (SV-01).
  const evidence = clamped.evidenceLinks ?? {};
  const dimKeys = (Object.keys(DIM_LABELS) as VrlDimensionKey[])
    .filter(k => !(mrlIsGoverned && k === "mrlScore"));
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
    profile,
    mrlIsGoverned,
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
    mvlScore:  clamp(inputs.mvlScore),
    mrlIsUnscored: inputs.mrlIsUnscored,
    profile:       inputs.profile,
    // B-03 / D7 fix: preserve evidenceLinks so computeVrl can detect self-assessed dims
    evidenceLinks: inputs.evidenceLinks,
  };
}
