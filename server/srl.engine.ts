/**
 * SRL Scoring Engine — BEBUS-SRL-SE-001
 * Pure computation module: no DB or tRPC dependencies.
 * All functions are deterministic and stateless.
 *
 * Implements:
 *   - 5 KPI normalisation methods (MIN_MAX, TARGET_BASED, THRESHOLD, BINARY, ORDINAL)
 *   - Stage-aware dimension weighting with sector overlay
 *   - Coverage Adjustment Factor (§3.4: mandatory 80% / optional 20%)
 *   - Trajectory Bonus (§3.5: capped at +3.0 points)
 *   - SRL level derivation (0–5)
 *   - Gate evaluation (G1–G5) with composite + per-dimension floors
 *   - MASRL / Sustainability Watch detection
 *   - Risk condition classification (SRL-R01 through SRL-R08)
 *   - Improvement Rate Index (IRI) per dimension
 *   - VRL integration payload builder
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type SrlDimCode = "ENV" | "LCA" | "SMF" | "SOC" | "ESG";
export type SrlStage = "S0" | "S1" | "S2" | "S3" | "S4";
export type SrlNormMethod = "MIN_MAX" | "TARGET_BASED" | "THRESHOLD" | "BINARY" | "ORDINAL";
export type SrlGateCode = "G1" | "G2" | "G3" | "G4" | "G5";
export type SrlGateStatus = "PASS" | "FAIL" | "PENDING" | "NA";
export type SrlRiskCode = "SRL-R01" | "SRL-R02" | "SRL-R03" | "SRL-R04" | "SRL-R05" | "SRL-R06" | "SRL-R07" | "SRL-R08";
export type SrlRiskSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface KpiDefinition {
  kpiCode: string;
  srlNormMethod: SrlNormMethod;
  normMin: number | null;
  normMax: number | null;
  normTarget: number | null;
  thresholdValue: number | null;
  higherIsBetter: boolean;
  isMandatory: boolean;
}

export interface KpiInput {
  kpiCode: string;
  rawValue: number | null;
  submittedAt?: Date | null;
}

export interface DimensionWeightConfig {
  dimensionCode: SrlDimCode;
  weight: number; // effective weight after sector overlay, sums to 1.00 across all dims
  intraKpiWeights: Record<string, number>; // kpiCode → intra-dim weight (sums to 1.00)
}

export interface NormalisedKpiResult {
  kpiCode: string;
  rawValue: number | null;
  normalisedValue: number | null; // null = optional, not submitted
  isMandatory: boolean;
  normMethod: SrlNormMethod;
}

export interface DimensionScoreResult {
  dimensionCode: SrlDimCode;
  rawScore: number;          // weighted mean of submitted KPIs, 0–100
  coverageFactor: number;    // 0.10–1.00
  coveredScore: number;      // rawScore * coverageFactor
  weightApplied: number;     // effective dimension weight
  contribution: number;      // coveredScore * weightApplied (contribution to composite)
  mandatorySubmitted: number;
  mandatoryTotal: number;
  optionalSubmitted: number;
  optionalTotal: number;
  kpiResults: NormalisedKpiResult[];
  gatePass: boolean;         // set after gate evaluation
  gateFloorValue: number;    // the floor that was checked
  gapFlags: string[];        // diagnostic flags
}

export interface GateFailure {
  type: "COMPOSITE" | "DIMENSION";
  dimension?: SrlDimCode;
  required: number;
  actual: number;
  gap: number;
}

export interface GateResult {
  gateRef: SrlGateCode;
  status: SrlGateStatus;
  failures: GateFailure[];
  gapReport: string;
  blockType: "soft" | "hard" | "advisory";
  remediationWindowDays: number;
}

export interface RiskCondition {
  code: SrlRiskCode;
  severity: SrlRiskSeverity;
  message: string;
  dimension?: SrlDimCode;
  kpiCode?: string;
}

export interface SrlCompositeResult {
  compositeRaw: number;       // before trajectory bonus
  trajectoryBonus: number;    // 0–3.0
  compositeFinal: number;     // after trajectory bonus, capped at 100
  srlLevel: number;           // 0–5
  srlLevelLabel: string;
  dimensionScores: Record<SrlDimCode, DimensionScoreResult>;
  gateResult: GateResult | null;
  sustainabilityWatch: boolean;
  watchReasons: string[];
  riskConditions: RiskCondition[];
  improvementRateIndex: Record<SrlDimCode, number | null>; // IRI per dim
}

export interface VrlSrlPayload {
  venture_id: string;
  assessment_id: string;
  assessment_date: string;
  stage_at_assessment: SrlStage;
  srl_composite_final: number;
  srl_level: number;
  score_delta: number | null;
  dimension_scores: Record<SrlDimCode, {
    raw_score: number;
    covered_score: number;
    coverage_factor: number;
    gate_pass: boolean;
  }>;
  gate_ref: string | null;
  gate_status: SrlGateStatus;
  gate_failures: GateFailure[];
  sustainability_watch: boolean;
  watch_reasons: string[];
  trajectory_bonus: number;
  weight_config_ref: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Default stage-aware dimension weights (§4.1 — Stage-Aware Weighting) */
export const DEFAULT_STAGE_WEIGHTS: Record<SrlStage, Record<SrlDimCode, number>> = {
  S0: { ENV: 0.15, LCA: 0.10, SMF: 0.10, SOC: 0.30, ESG: 0.35 },
  S1: { ENV: 0.18, LCA: 0.12, SMF: 0.12, SOC: 0.28, ESG: 0.30 },
  S2: { ENV: 0.22, LCA: 0.18, SMF: 0.18, SOC: 0.22, ESG: 0.20 },
  S3: { ENV: 0.25, LCA: 0.20, SMF: 0.22, SOC: 0.18, ESG: 0.15 },
  S4: { ENV: 0.25, LCA: 0.22, SMF: 0.23, SOC: 0.18, ESG: 0.12 },
};

/** Sector overlay deltas (§4.2 — Sector Overlay) */
export const SECTOR_OVERLAYS: Record<string, Record<SrlDimCode, number>> = {
  CLEANTECH:  { ENV: +0.05, LCA: +0.02, SMF: +0.03, SOC: -0.05, ESG: -0.05 },
  AGRITECH:   { ENV: +0.03, LCA: +0.05, SMF:  0.00, SOC: -0.04, ESG: -0.04 },
  ADVANCED_MFG: { ENV: +0.02, LCA: +0.03, SMF: +0.08, SOC: -0.07, ESG: -0.06 },
  SOCIAL_ENT: { ENV: -0.05, LCA: -0.03, SMF: -0.02, SOC: +0.08, ESG: +0.02 },
  DIGITAL:    { ENV: -0.05, LCA: -0.05, SMF: -0.10, SOC: +0.10, ESG: +0.10 },
};

/** SRL level thresholds (§2.4 — Maturity Level Definitions) */
const SRL_LEVELS = [
  { level: 0, min: 0,  max: 19.99, label: "SRL-0: Unassessed / Baseline" },
  { level: 1, min: 20, max: 39.99, label: "SRL-1: Aware" },
  { level: 2, min: 40, max: 54.99, label: "SRL-2: Committed" },
  { level: 3, min: 55, max: 69.99, label: "SRL-3: Measured" },
  { level: 4, min: 70, max: 84.99, label: "SRL-4: Optimising" },
  { level: 5, min: 85, max: 100,   label: "SRL-5: Exemplary" },
];

/** Gate thresholds (§5.2 — Gate Threshold Matrix) */
export const GATE_THRESHOLDS: Record<SrlGateCode, {
  composite: number;
  floors: Record<SrlDimCode, number>;
  blockType: "advisory" | "soft" | "hard";
  remediationWindowDays: number;
}> = {
  G1: { composite: 30, floors: { ENV: 15, LCA: 10, SMF: 10, SOC: 25, ESG: 30 }, blockType: "advisory", remediationWindowDays: 30 },
  G2: { composite: 42, floors: { ENV: 25, LCA: 20, SMF: 15, SOC: 35, ESG: 40 }, blockType: "soft",     remediationWindowDays: 30 },
  G3: { composite: 55, floors: { ENV: 40, LCA: 35, SMF: 30, SOC: 45, ESG: 45 }, blockType: "hard",     remediationWindowDays: 30 },
  G4: { composite: 65, floors: { ENV: 50, LCA: 45, SMF: 45, SOC: 50, ESG: 50 }, blockType: "hard",     remediationWindowDays: 30 },
  G5: { composite: 75, floors: { ENV: 60, LCA: 55, SMF: 55, SOC: 55, ESG: 55 }, blockType: "hard",     remediationWindowDays: 30 },
};

const MASRL_DEFAULT = 25;
const CRITICAL_DIMENSION_FLOOR = 15;
const TRAJECTORY_BONUS_CAP = 3.0;
const COVERAGE_MANDATORY_WEIGHT = 0.80;
const COVERAGE_OPTIONAL_WEIGHT = 0.20;
const COVERAGE_FLOOR = 0.10;
const WEIGHT_MIN_FLOOR = 0.05;

// ── 1. Weight Resolution ──────────────────────────────────────────────────────

/**
 * Resolves effective dimension weights for a given stage and optional sector overlay.
 * Applies additive delta, enforces per-dimension floor of 0.05, then renormalises to 1.00.
 */
export function resolveWeights(stage: SrlStage, sectorCode?: string): Record<SrlDimCode, number> {
  const base = { ...DEFAULT_STAGE_WEIGHTS[stage] };
  const overlay = sectorCode ? SECTOR_OVERLAYS[sectorCode.toUpperCase()] : null;

  const dims: SrlDimCode[] = ["ENV", "LCA", "SMF", "SOC", "ESG"];
  const raw: Record<SrlDimCode, number> = {} as Record<SrlDimCode, number>;

  for (const d of dims) {
    const delta = overlay ? (overlay[d] ?? 0) : 0;
    raw[d] = Math.max(WEIGHT_MIN_FLOOR, base[d] + delta);
  }

  // Renormalise so weights sum exactly to 1.00
  const total = dims.reduce((s, d) => s + raw[d], 0);
  const normalised: Record<SrlDimCode, number> = {} as Record<SrlDimCode, number>;
  for (const d of dims) {
    normalised[d] = Math.round((raw[d] / total) * 10000) / 10000;
  }

  // Fix floating-point rounding on ESG (last dim)
  const sum = dims.slice(0, 4).reduce((s, d) => s + normalised[d], 0);
  normalised.ESG = Math.round((1.0 - sum) * 10000) / 10000;

  return normalised;
}

// ── 2. KPI Normalisation ──────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Normalises a single raw KPI value to [0, 100] using the method specified in the KPI definition.
 * Returns null if the value is null AND the KPI is optional (excluded from dimension sum).
 * Returns 0 if the value is null AND the KPI is mandatory.
 */
export function normaliseKpi(kpiDef: KpiDefinition, rawValue: number | null): number | null {
  if (rawValue === null || rawValue === undefined) {
    return kpiDef.isMandatory ? 0 : null;
  }

  const { srlNormMethod: method, normMin, normMax, normTarget, thresholdValue, higherIsBetter } = kpiDef;

  switch (method) {
    case "MIN_MAX": {
      const lo = normMin ?? 0;
      const hi = normMax ?? 100;
      if (hi === lo) return 50;
      const score = higherIsBetter
        // higher is better: lo = worst (0), hi = best (100)
        ? (rawValue - lo) / (hi - lo) * 100
        // lower is better: normMin = worst (0), normMax = best (100)
        // formula: (normMin - x) / (normMin - normMax) * 100
        : (lo - rawValue) / (lo - hi) * 100;
      return clamp(score, 0, 100);
    }

    case "TARGET_BASED": {
      const target = normTarget ?? 0;
      const baseline = normMin ?? 0;
      if (higherIsBetter) {
        if (target === 0) return rawValue > 0 ? 100 : 0;
        return clamp(rawValue / target * 100, 0, 100);
      } else {
        // lower is better: baseline = worst case, target = best case
        const range = baseline - target;
        if (range === 0) return rawValue <= target ? 100 : 0;
        return clamp((baseline - rawValue) / range * 100, 0, 100);
      }
    }

    case "THRESHOLD": {
      const T = thresholdValue ?? normTarget ?? 50;
      if (higherIsBetter) {
        if (rawValue < T) {
          return T === 0 ? 0 : (rawValue / T) * 50;
        } else {
          const ceiling = 100 - T;
          return ceiling === 0 ? 100 : 50 + ((rawValue - T) / ceiling) * 50;
        }
      } else {
        // lower is better with threshold
        if (rawValue > T) {
          return T === 0 ? 0 : (T / rawValue) * 50;
        } else {
          return T === 0 ? 100 : 50 + ((T - rawValue) / T) * 50;
        }
      }
    }

    case "BINARY": {
      return rawValue ? 100 : 0;
    }

    case "ORDINAL": {
      const lo = normMin ?? 1;
      const hi = normMax ?? 5;
      if (hi === lo) return 50;
      return clamp((rawValue - lo) / (hi - lo) * 100, 0, 100);
    }

    default:
      return 0;
  }
}

// ── 3. Coverage Factor ────────────────────────────────────────────────────────

export function computeCoverage(
  mandatoryTotal: number,
  mandatorySubmitted: number,
  optionalTotal: number,
  optionalSubmitted: number,
): number {
  const mandCov = mandatoryTotal > 0 ? mandatorySubmitted / mandatoryTotal : 1.0;
  const optCov = optionalTotal > 0 ? optionalSubmitted / optionalTotal : 1.0;
  const raw = mandCov * COVERAGE_MANDATORY_WEIGHT + optCov * COVERAGE_OPTIONAL_WEIGHT;
  // Apply floor only if at least one mandatory KPI was submitted
  if (mandatorySubmitted > 0) {
    return Math.max(raw, COVERAGE_FLOOR);
  }
  return raw;
}

// ── 4. Dimension Scoring ──────────────────────────────────────────────────────

/**
 * Scores a single dimension using the spec's coverage-penalised weighted mean formula.
 * intraKpiWeights: { kpiCode: weight } — must sum to 1.00 across all KPIs in the dimension.
 * If no intra-KPI weights provided, equal weighting is applied.
 */
export function scoreDimension(
  dimensionCode: SrlDimCode,
  kpiDefs: KpiDefinition[],
  kpiInputs: KpiInput[],
  effectiveWeight: number,
  intraKpiWeights?: Record<string, number>,
  gateFloor?: number,
): DimensionScoreResult {
  const inputMap = new Map<string, number | null>(kpiInputs.map(k => [k.kpiCode, k.rawValue]));

  // Compute equal intra-KPI weights if not provided
  const weights = intraKpiWeights ?? Object.fromEntries(kpiDefs.map(k => [k.kpiCode, 1 / kpiDefs.length]));

  let weightedSum = 0;
  let weightSumUsed = 0;
  let mandatoryTotal = 0;
  let mandatorySubmitted = 0;
  let optionalTotal = 0;
  let optionalSubmitted = 0;
  const kpiResults: NormalisedKpiResult[] = [];

  for (const kpiDef of kpiDefs) {
    const rawValue = inputMap.has(kpiDef.kpiCode) ? inputMap.get(kpiDef.kpiCode)! : null;
    const normValue = normaliseKpi(kpiDef, rawValue);
    const w = weights[kpiDef.kpiCode] ?? (1 / kpiDefs.length);

    kpiResults.push({
      kpiCode: kpiDef.kpiCode,
      rawValue,
      normalisedValue: normValue,
      isMandatory: kpiDef.isMandatory,
      normMethod: kpiDef.srlNormMethod,
    });

    if (kpiDef.isMandatory) {
      mandatoryTotal++;
      if (rawValue !== null && rawValue !== undefined) mandatorySubmitted++;
    } else {
      optionalTotal++;
      if (rawValue !== null && rawValue !== undefined) optionalSubmitted++;
    }

    // null means optional and not submitted — skip from weighted sum
    if (normValue === null) continue;

    weightedSum += w * normValue;
    weightSumUsed += w;
  }

  // Raw dimension score: renormalise to full weight range
  const rawScore = weightSumUsed === 0 ? 0 : Math.round((weightedSum / weightSumUsed) * 100) / 100;

  const coverageFactor = computeCoverage(mandatoryTotal, mandatorySubmitted, optionalTotal, optionalSubmitted);
  const coveredScore = Math.round(rawScore * coverageFactor * 100) / 100;
  const contribution = Math.round(coveredScore * effectiveWeight * 100) / 100;

  const floor = gateFloor ?? 0;
  const gatePass = rawScore >= floor;

  const gapFlags: string[] = [];
  if (mandatorySubmitted < mandatoryTotal) {
    gapFlags.push(`${mandatoryTotal - mandatorySubmitted} mandatory KPI(s) missing`);
  }
  if (coverageFactor < 0.5) {
    gapFlags.push(`Low coverage (${Math.round(coverageFactor * 100)}%) — SRL-R07`);
  }
  if (!gatePass && floor > 0) {
    gapFlags.push(`Below gate floor ${floor} (raw: ${rawScore})`);
  }

  return {
    dimensionCode,
    rawScore,
    coverageFactor: Math.round(coverageFactor * 10000) / 10000,
    coveredScore,
    weightApplied: effectiveWeight,
    contribution,
    mandatorySubmitted,
    mandatoryTotal,
    optionalSubmitted,
    optionalTotal,
    kpiResults,
    gatePass,
    gateFloorValue: floor,
    gapFlags,
  };
}

// ── 5. Trajectory Bonus ───────────────────────────────────────────────────────

/**
 * Computes the trajectory bonus from the last two prior composite scores.
 * Only applies when both deltas are positive (two consecutive periods of improvement).
 * Capped at +3.0 points.
 */
export function computeTrajectoryBonus(
  currentComposite: number,
  prevComposite: number | null,    // composite(t-1)
  prevPrevComposite: number | null, // composite(t-2)
): number {
  if (prevComposite === null || prevPrevComposite === null) return 0;
  const delta1 = prevComposite - prevPrevComposite;
  const delta2 = currentComposite - prevComposite;
  if (delta1 <= 0 || delta2 <= 0) return 0;
  const bonus = Math.min((delta1 + delta2) / 2 * 0.10, TRAJECTORY_BONUS_CAP);
  return Math.round(bonus * 100) / 100;
}

// ── 6. SRL Level Derivation ───────────────────────────────────────────────────

export function deriveSrlLevel(composite: number): { level: number; label: string } {
  const entry = SRL_LEVELS.find(l => composite >= l.min && composite <= l.max);
  return entry ? { level: entry.level, label: entry.label } : { level: 0, label: "SRL-0: Unassessed / Baseline" };
}

// ── 7. Gate Evaluation ────────────────────────────────────────────────────────

export function evaluateGate(
  gateCode: SrlGateCode,
  compositeFinal: number,
  dimensionScores: Record<SrlDimCode, DimensionScoreResult>,
): GateResult {
  const thresholds = GATE_THRESHOLDS[gateCode];
  const failures: GateFailure[] = [];

  if (compositeFinal < thresholds.composite) {
    failures.push({
      type: "COMPOSITE",
      required: thresholds.composite,
      actual: Math.round(compositeFinal * 100) / 100,
      gap: Math.round((thresholds.composite - compositeFinal) * 100) / 100,
    });
  }

  const dims: SrlDimCode[] = ["ENV", "LCA", "SMF", "SOC", "ESG"];
  for (const dim of dims) {
    const floor = thresholds.floors[dim];
    const actual = dimensionScores[dim]?.rawScore ?? 0;
    if (actual < floor) {
      failures.push({
        type: "DIMENSION",
        dimension: dim,
        required: floor,
        actual: Math.round(actual * 100) / 100,
        gap: Math.round((floor - actual) * 100) / 100,
      });
    }
  }

  const status: SrlGateStatus = failures.length === 0 ? "PASS" : "FAIL";

  const gapLines = failures.map(f =>
    f.type === "COMPOSITE"
      ? `Composite: ${f.actual} < ${f.required} (gap: ${f.gap})`
      : `${f.dimension} dimension: ${f.actual} < ${f.required} (gap: ${f.gap})`
  );
  const gapReport = failures.length === 0
    ? `${gateCode} PASS — all thresholds met.`
    : `${gateCode} FAIL — ${failures.length} threshold(s) not met:\n${gapLines.join("\n")}`;

  return {
    gateRef: gateCode,
    status,
    failures,
    gapReport,
    blockType: thresholds.blockType,
    remediationWindowDays: thresholds.remediationWindowDays,
  };
}

// ── 8. MASRL / Sustainability Watch ──────────────────────────────────────────

export function checkMasrl(
  compositeFinal: number,
  dimensionScores: Record<SrlDimCode, DimensionScoreResult>,
  masrl = MASRL_DEFAULT,
): { sustainabilityWatch: boolean; watchReasons: string[] } {
  const reasons: string[] = [];

  if (compositeFinal < masrl) {
    reasons.push(`Composite score ${Math.round(compositeFinal * 100) / 100} below MASRL floor of ${masrl} (SRL-R01)`);
  }

  const dims: SrlDimCode[] = ["ENV", "LCA", "SMF", "SOC", "ESG"];
  for (const dim of dims) {
    const raw = dimensionScores[dim]?.rawScore ?? 0;
    if (raw < CRITICAL_DIMENSION_FLOOR) {
      reasons.push(`${dim} dimension score ${Math.round(raw * 100) / 100} below critical floor of ${CRITICAL_DIMENSION_FLOOR} (SRL-R02)`);
    }
  }

  return { sustainabilityWatch: reasons.length > 0, watchReasons: reasons };
}

// ── 9. Risk Condition Classification ─────────────────────────────────────────

export interface RiskInput {
  compositeFinal: number;
  dimensionScores: Record<SrlDimCode, DimensionScoreResult>;
  gateResult: GateResult | null;
  scoreDelta: number | null;
  staleMandatoryKpiCodes?: string[];
  masrl?: number;
}

export function classifyRiskConditions(input: RiskInput): RiskCondition[] {
  const risks: RiskCondition[] = [];
  const { compositeFinal, dimensionScores, gateResult, scoreDelta, staleMandatoryKpiCodes, masrl = MASRL_DEFAULT } = input;
  const dims: SrlDimCode[] = ["ENV", "LCA", "SMF", "SOC", "ESG"];

  // SRL-R01: Composite below MASRL
  if (compositeFinal < masrl) {
    risks.push({ code: "SRL-R01", severity: "CRITICAL", message: `Composite score ${Math.round(compositeFinal * 100) / 100} below MASRL (${masrl}). Sustainability Watch activated. Disbursement hold raised.` });
  }

  // SRL-R02: Critical dimension floor breach
  for (const dim of dims) {
    const raw = dimensionScores[dim]?.rawScore ?? 0;
    if (raw < CRITICAL_DIMENSION_FLOOR) {
      risks.push({ code: "SRL-R02", severity: "CRITICAL", dimension: dim, message: `${dim} dimension raw score ${Math.round(raw * 100) / 100} below critical floor of ${CRITICAL_DIMENSION_FLOOR}. Dimension-specific improvement plan required.` });
    }
  }

  // SRL-R03: Hard gate block (G3/G4/G5)
  if (gateResult?.status === "FAIL" && ["G3", "G4", "G5"].includes(gateResult.gateRef)) {
    risks.push({ code: "SRL-R03", severity: "HIGH", message: `Hard gate ${gateResult.gateRef} FAIL. Investment progression halted. VRL block flag raised. 30-day remediation sprint required.` });
  }

  // SRL-R04: Soft gate block (G1/G2)
  if (gateResult?.status === "FAIL" && ["G1", "G2"].includes(gateResult.gateRef)) {
    risks.push({ code: "SRL-R04", severity: "MEDIUM", message: `Soft gate ${gateResult.gateRef} FAIL. 30-day remediation window opened. Advisory alert to Portfolio Manager.` });
  }

  // SRL-R05: Score regression
  if (scoreDelta !== null && scoreDelta < -5) {
    risks.push({ code: "SRL-R05", severity: "MEDIUM", message: `Score regression of ${Math.round(scoreDelta * 100) / 100} points detected. Root-cause analysis required within 14 days.` });
  }

  // SRL-R06: Stale KPI data
  if (staleMandatoryKpiCodes && staleMandatoryKpiCodes.length > 0) {
    for (const kpiCode of staleMandatoryKpiCodes) {
      risks.push({ code: "SRL-R06", severity: "MEDIUM", kpiCode, message: `KPI ${kpiCode} data is stale (>90 days). Submission reminder sent to venture operator.` });
    }
  }

  // SRL-R07: Low KPI coverage per dimension
  for (const dim of dims) {
    const cov = dimensionScores[dim]?.coverageFactor ?? 0;
    if (cov < 0.5) {
      risks.push({ code: "SRL-R07", severity: "LOW", dimension: dim, message: `${dim} dimension KPI coverage is ${Math.round(cov * 100)}% (<50%). Advisory flag raised. No gate impact if composite passes.` });
    }
  }

  return risks;
}

// ── 10. Improvement Rate Index ────────────────────────────────────────────────

/**
 * IRI_d = (D_d(t) - D_d(t-1)) / MAX(D_d(t-1), 1) * 100
 * Diagnostic only — does not adjust composite score.
 */
export function computeIri(
  currentDimScores: Record<SrlDimCode, DimensionScoreResult>,
  prevDimScores: Record<SrlDimCode, { rawScore: number }> | null,
): Record<SrlDimCode, number | null> {
  const dims: SrlDimCode[] = ["ENV", "LCA", "SMF", "SOC", "ESG"];
  const iri: Record<SrlDimCode, number | null> = {} as Record<SrlDimCode, number | null>;
  for (const dim of dims) {
    if (!prevDimScores) { iri[dim] = null; continue; }
    const curr = currentDimScores[dim]?.rawScore ?? 0;
    const prev = prevDimScores[dim]?.rawScore ?? 0;
    iri[dim] = Math.round((curr - prev) / Math.max(prev, 1) * 100 * 100) / 100;
  }
  return iri;
}

// ── 11. Master Composite Computation ─────────────────────────────────────────

export interface CompositeInput {
  stage: SrlStage;
  sectorCode?: string;
  gateRef?: SrlGateCode;
  dimensionInputs: {
    dimensionCode: SrlDimCode;
    kpiDefs: KpiDefinition[];
    kpiInputs: KpiInput[];
    intraKpiWeights?: Record<string, number>;
  }[];
  prevComposite?: number | null;
  prevPrevComposite?: number | null;
  prevDimScores?: Record<SrlDimCode, { rawScore: number }> | null;
  scoreDelta?: number | null;
  staleMandatoryKpiCodes?: string[];
  masrl?: number;
}

export function runSrlEngine(input: CompositeInput): SrlCompositeResult {
  const { stage, sectorCode, gateRef, dimensionInputs, prevComposite, prevPrevComposite, prevDimScores, scoreDelta, staleMandatoryKpiCodes, masrl } = input;

  // 1. Resolve weights
  const weights = resolveWeights(stage, sectorCode);

  // 2. Resolve gate floors (if a gate is being evaluated)
  const gateFloors = gateRef ? GATE_THRESHOLDS[gateRef].floors : null;

  // 3. Score each dimension
  const dimensionScores: Record<SrlDimCode, DimensionScoreResult> = {} as Record<SrlDimCode, DimensionScoreResult>;
  for (const dimInput of dimensionInputs) {
    const { dimensionCode, kpiDefs, kpiInputs, intraKpiWeights } = dimInput;
    const effectiveWeight = weights[dimensionCode];
    const floor = gateFloors ? gateFloors[dimensionCode] : undefined;
    dimensionScores[dimensionCode] = scoreDimension(dimensionCode, kpiDefs, kpiInputs, effectiveWeight, intraKpiWeights, floor);
  }

  // 4. Composite raw = sum of (coveredScore × effectiveWeight)
  const dims: SrlDimCode[] = ["ENV", "LCA", "SMF", "SOC", "ESG"];
  const compositeRaw = Math.round(
    dims.reduce((sum, d) => sum + (dimensionScores[d]?.contribution ?? 0), 0) * 100
  ) / 100;

  // 5. Trajectory bonus
  const trajectoryBonus = computeTrajectoryBonus(compositeRaw, prevComposite ?? null, prevPrevComposite ?? null);
  const compositeFinal = Math.min(100, Math.round((compositeRaw + trajectoryBonus) * 100) / 100);

  // 6. SRL level
  const { level: srlLevel, label: srlLevelLabel } = deriveSrlLevel(compositeFinal);

  // 7. Gate evaluation
  let gateResult: GateResult | null = null;
  if (gateRef) {
    gateResult = evaluateGate(gateRef, compositeFinal, dimensionScores);
    // Update gatePass on dimension scores based on gate evaluation
    for (const f of gateResult.failures) {
      if (f.type === "DIMENSION" && f.dimension) {
        dimensionScores[f.dimension].gatePass = false;
      }
    }
  }

  // 8. MASRL / Sustainability Watch
  const { sustainabilityWatch, watchReasons } = checkMasrl(compositeFinal, dimensionScores, masrl);

  // 9. Risk conditions
  const riskConditions = classifyRiskConditions({
    compositeFinal,
    dimensionScores,
    gateResult,
    scoreDelta: scoreDelta ?? null,
    staleMandatoryKpiCodes,
    masrl,
  });

  // 10. IRI
  const improvementRateIndex = computeIri(dimensionScores, prevDimScores ?? null);

  return {
    compositeRaw,
    trajectoryBonus,
    compositeFinal,
    srlLevel,
    srlLevelLabel,
    dimensionScores,
    gateResult,
    sustainabilityWatch,
    watchReasons,
    riskConditions,
    improvementRateIndex,
  };
}

// ── 12. VRL Integration Payload Builder ──────────────────────────────────────

export function buildVrlPayload(
  ventureId: string,
  assessmentId: string,
  assessmentDate: Date,
  stage: SrlStage,
  result: SrlCompositeResult,
  scoreDelta: number | null,
  weightConfigRef: string,
): VrlSrlPayload {
  const dims: SrlDimCode[] = ["ENV", "LCA", "SMF", "SOC", "ESG"];
  const dimensionScores: VrlSrlPayload["dimension_scores"] = {} as VrlSrlPayload["dimension_scores"];

  for (const dim of dims) {
    const ds = result.dimensionScores[dim];
    dimensionScores[dim] = {
      raw_score: ds?.rawScore ?? 0,
      covered_score: ds?.coveredScore ?? 0,
      coverage_factor: ds?.coverageFactor ?? 0,
      gate_pass: ds?.gatePass ?? false,
    };
  }

  return {
    venture_id: ventureId,
    assessment_id: assessmentId,
    assessment_date: assessmentDate.toISOString().split("T")[0],
    stage_at_assessment: stage,
    srl_composite_final: result.compositeFinal,
    srl_level: result.srlLevel,
    score_delta: scoreDelta !== null ? Math.round(scoreDelta * 100) / 100 : null,
    dimension_scores: dimensionScores,
    gate_ref: result.gateResult?.gateRef ?? null,
    gate_status: result.gateResult?.status ?? "NA",
    gate_failures: result.gateResult?.failures ?? [],
    sustainability_watch: result.sustainabilityWatch,
    watch_reasons: result.watchReasons,
    trajectory_bonus: result.trajectoryBonus,
    weight_config_ref: weightConfigRef,
  };
}
