// ============================================================================
// PROPOSITION & MODEL SCORING UTILITIES
// All scoring is deterministic and client-side for instant feedback.
// Server-side readiness.score query uses the same formulas.
// ============================================================================

// ── Value Proposition Quality Score (0-100) ───────────────────────────────────
export function calcVPQualityScore(vp: {
  customerJob?: string | null;
  painsRelieved?: string | null;
  gainsCreated?: string | null;
  measurableOutcome?: string | null;
  evidenceRequired?: string | null;
  differentiationClaim?: string | null;
}): number {
  let score = 0;
  if (vp.customerJob?.trim())       score += 20;
  if (vp.painsRelieved?.trim())     score += 20;
  if (vp.gainsCreated?.trim())      score += 20;
  if (vp.measurableOutcome?.trim()) score += 25;
  if (vp.evidenceRequired?.trim())  score += 15;
  return score;
}

export function vpWarnings(vp: {
  measurableOutcome?: string | null;
  differentiationClaim?: string | null;
}): string[] {
  const warns: string[] = [];
  if (!vp.measurableOutcome?.trim())
    warns.push("Value proposition is not measurable.");
  const generic = ["ai-powered", "ai powered", "sustainable", "innovative", "data-driven", "data driven"];
  const dc = (vp.differentiationClaim ?? "").toLowerCase();
  if (dc && generic.some(g => dc.includes(g)) && !dc.includes("because") && !dc.includes("resulting"))
    warns.push("Differentiation is not specific enough. Avoid vague claims unless linked to measurable customer value.");
  return warns;
}

// ── JTBD Opportunity Score (0-100) ────────────────────────────────────────────
export function calcJTBDOpportunityScore(imp: number, sat: number): number {
  const raw = imp + (imp - sat);    // range: -3 to 9
  const normalised = (raw + 3) / 12;  // 0 to 1
  return Math.min(100, Math.max(0, Math.round(normalised * 100)));
}

export function jtbdOpportunityLabel(score: number): string {
  if (score >= 80) return "Strong unmet need";
  if (score >= 60) return "Promising opportunity";
  if (score >= 40) return "Needs more evidence";
  return "Weak opportunity";
}

// ── Business Model Readiness Score (0-100) ────────────────────────────────────
export function calcBMReadinessScore(bm: {
  revenueModel?: string | null;
  pricingAssumption?: string | null;
  deliveryModel?: string | null;
  salesChannel?: string | null;
  costDrivers?: string | null;
  scalabilityAssumption?: string | null;
  evidenceRequired?: string | null;
}): number {
  let score = 0;
  if (bm.revenueModel?.trim())          score += 15;
  if (bm.pricingAssumption?.trim())     score += 15;
  if (bm.deliveryModel?.trim())         score += 15;
  if (bm.salesChannel?.trim())          score += 15;
  if (bm.costDrivers?.trim())           score += 10;
  if (bm.scalabilityAssumption?.trim()) score += 10;
  if (bm.evidenceRequired?.trim())      score += 20;
  return score;
}

// ── Revenue Model Evidence Score (0-100) ──────────────────────────────────────
export function calcRevenueEvidenceScore(test: {
  conversionRate?: number | null;  // 0-100
  sampleSize?: number | null;
  revenueSignalScore?: number | null;
}): number {
  if (!test.conversionRate && !test.revenueSignalScore) return 0;
  const cr = test.conversionRate ?? 0;
  const rss = test.revenueSignalScore ?? 0;
  let score = cr * 0.4 + rss * 0.6;
  if ((test.sampleSize ?? 0) < 5) score = Math.min(score, 50);
  return Math.round(Math.min(100, score));
}

// ── Unit Economics Confidence Score (0-100) ──────────────────────────────────
const CONFIDENCE_MAP: Record<string, number> = {
  assumption_only:       1,
  early_estimate:        2,
  partially_validated:   3,
  validated:             4,
  high_confidence:       5,
};

export function calcUnitEconomicsScore(ue: {
  customerAcquisitionCost?: number | null;
  lifetimeValue?: number | null;
  grossMarginPct?: number | null;
  deliveryCost?: number | null;
  expectedPaybackMonths?: number | null;
  confidenceLevel?: string | null;
}): number {
  let score = 0;
  if (ue.customerAcquisitionCost != null) score += 15;
  if (ue.lifetimeValue != null)           score += 15;
  if (ue.grossMarginPct != null)          score += 20;
  if (ue.deliveryCost != null)            score += 15;
  if (ue.expectedPaybackMonths != null)   score += 15;
  const confMult = (CONFIDENCE_MAP[ue.confidenceLevel ?? "assumption_only"] ?? 1) / 5;
  score += confMult * 20;
  return Math.round(Math.min(100, score));
}

export function ueWarnings(ue: {
  customerAcquisitionCost?: number | null;
  lifetimeValue?: number | null;
  grossMarginPct?: number | null;
  expectedPaybackMonths?: number | null;
}): string[] {
  const warns: string[] = [];
  if (ue.customerAcquisitionCost != null && ue.lifetimeValue != null && ue.lifetimeValue < ue.customerAcquisitionCost)
    warns.push("Unit economics are currently negative (LTV < CAC).");
  if (ue.expectedPaybackMonths != null && ue.expectedPaybackMonths > 18)
    warns.push("Payback period exceeds 18 months — high for early-stage B2B.");
  if (ue.grossMarginPct != null && ue.grossMarginPct < 40)
    warns.push("Gross margin below 40% — review delivery cost structure for platform/software model.");
  return warns;
}

// ── Risk Score (1-125) ────────────────────────────────────────────────────────
export function calcRiskScore(prob: number, sev: number, evidConf: number): number {
  return prob * sev * evidConf;
}

export function riskScoreLabel(score: number): string {
  if (score >= 76)  return "Critical risk";
  if (score >= 51)  return "High risk";
  if (score >= 26)  return "Moderate risk";
  return "Low risk";
}

export function riskScoreColor(score: number): { color: string; bg: string } {
  if (score >= 76)  return { color: "#dc2626", bg: "#fee2e2" };
  if (score >= 51)  return { color: "#f97316", bg: "#fff7ed" };
  if (score >= 26)  return { color: "#d97706", bg: "#fef3c7" };
  return { color: "#16a34a", bg: "#dcfce7" };
}

// ── Overall Proposition & Model Readiness Score (0-100) ───────────────────────
export interface PMReadinessInputs {
  vpQuality: number;        // 0-100
  jtbdClarity: number;      // 0-100 (best opportunity score across JTBDs)
  bmReadiness: number;      // 0-100
  revenueEvidence: number;  // 0-100
  unitEconConf: number;     // 0-100
  avgRiskScore: number;     // 0-125 (average pm_risk score)
}

export function calcPMReadiness(inputs: PMReadinessInputs): number {
  const inverseRisk = Math.max(0, (1 - inputs.avgRiskScore / 125)) * 100;
  return Math.round(
    inputs.vpQuality      * 0.20 +
    inputs.jtbdClarity    * 0.15 +
    inputs.bmReadiness    * 0.20 +
    inputs.revenueEvidence * 0.20 +
    inputs.unitEconConf   * 0.15 +
    inverseRisk           * 0.10
  );
}

export function pmReadinessLabel(score: number): string {
  if (score >= 80) return "Strong proposition/model readiness";
  if (score >= 60) return "Ready for limited MVP definition";
  if (score >= 40) return "Needs more model validation";
  return "Not ready";
}

export interface ModelDecision {
  label: string;
  recommendation: string;
  action: string;
  color: string;
  canProceed: boolean;
  overrides: string[];
}

export function generateModelDecision(
  score: number,
  overrides: { noJtbd?: boolean; noMeasurableOutcome?: boolean; wtpScoreLow?: boolean; hasCriticalRisks?: boolean }
): ModelDecision {
  const ov: string[] = [];
  if (overrides.noJtbd)             ov.push("No customer job defined — define Jobs-to-be-Done before MVP build.");
  if (overrides.noMeasurableOutcome)ov.push("Value proposition is not testable — add a measurable customer outcome.");
  if (overrides.wtpScoreLow)        ov.push("WTP evidence is below threshold — strengthen commercial validation before MVP.");
  if (overrides.hasCriticalRisks)   ov.push("Critical business model risks exist — mitigate before stage progression.");

  const canProceed = score >= 60 && ov.length === 0;

  if (score >= 80 && ov.length === 0) return { label: "Strong readiness", recommendation: "Proceed to R&D Hub and define MVP experiment.", action: "proceed_rnd", color: "#16a34a", canProceed: true, overrides: ov };
  if (score >= 60 && ov.length === 0) return { label: "Limited proceed", recommendation: "Proceed to limited MVP definition with unresolved assumptions listed.", action: "limited_proceed", color: "#0891b2", canProceed: true, overrides: ov };
  if (score >= 40) return { label: "More validation needed", recommendation: "Run more proposition, revenue, pricing, or unit economics tests.", action: "test_more", color: "#d97706", canProceed: false, overrides: ov };
  return { label: "Not ready", recommendation: "Do not proceed to MVP build. Revise proposition or business model.", action: "stop", color: "#dc2626", canProceed: false, overrides: ov };
}
