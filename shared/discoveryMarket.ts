// ============================================================================
// DISCOVERY & MARKET — Shared scoring engine + enum option sets
// Pure functions reused by both the tRPC server (stored scores / auto-risk)
// and the React client (live preview). No DB or React imports here.
// ============================================================================

// ─── Enum / option sets ───────────────────────────────────────────────────────
export const PROBLEM_HYPOTHESIS_STATUSES = [
  "untested",
  "testing",
  "validated",
  "invalidated",
  "pivot_required",
  "paused",
] as const;

export const WTP_SIGNAL_OPTIONS = ["none", "weak", "moderate", "strong"] as const;

export const COMPETITOR_TYPES = [
  "direct",
  "indirect",
  "substitute",
  "status_quo",
  "future_competitor",
] as const;

export const SIGNAL_TYPES = [
  "customer_pull",
  "search_demand",
  "procurement",
  "regulation",
  "investment",
  "hiring",
  "media",
  "academic",
  "partner",
  "industry_report",
] as const;

export const PRICING_MODELS = [
  "Paid pilot",
  "Consultancy + platform",
  "Subscription",
  "Licence",
  "Success fee",
  "Data partnership",
  "Co-development agreement",
  "Venture studio equity model",
] as const;

export const RISK_CATEGORIES = [
  "segment_risk",
  "problem_risk",
  "timing_risk",
  "budget_risk",
  "adoption_risk",
  "procurement_risk",
  "data_access_risk",
  "competitive_risk",
  "regulatory_risk",
  "trust_risk",
  "channel_risk",
] as const;

export const RISK_STATUSES = [
  "open",
  "monitoring",
  "mitigated",
  "escalated",
  "closed",
] as const;

export const EXPERIMENT_TYPES = [
  "interview",
  "survey",
  "landing_page",
  "concierge_mvp",
  "prototype_test",
  "paid_pilot",
  "loi_test",
  "pricing_test",
  "data_access_test",
  "procurement_test",
] as const;

export const INTERVIEW_TYPES = [
  "discovery",
  "problem_validation",
  "solution_validation",
  "buyer",
  "user",
  "expert",
] as const;

export const EVIDENCE_LADDER: { level: number; label: string }[] = [
  { level: 1, label: 'Says "interesting"' },
  { level: 2, label: "Agrees to another meeting" },
  { level: 3, label: "Shares operational data" },
  { level: 4, label: "Introduces budget holder" },
  { level: 5, label: "Requests proposal" },
  { level: 6, label: "Signs LOI" },
  { level: 7, label: "Pays for pilot" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Clamp a 1–5 input and scale to 0–100 (so 1→20 ... 5→100). */
function scale5to100(v: number): number {
  const clamped = Math.max(0, Math.min(5, v || 0));
  return clamped * 20;
}

function clamp100(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export type Band = {
  label: string;
  /** semantic colour token */
  tone: "red" | "amber" | "green" | "grey";
};

export function bandFor0to100(score: number, kind: "positive" | "risk"): Band {
  // "positive": high is good (green). "risk": high is bad (red).
  if (kind === "positive") {
    if (score >= 80) return { label: "Strong", tone: "green" };
    if (score >= 60) return { label: "Promising", tone: "green" };
    if (score >= 40) return { label: "Needs more", tone: "amber" };
    return { label: "Weak", tone: "red" };
  }
  if (score >= 80) return { label: "Severe", tone: "red" };
  if (score >= 60) return { label: "High", tone: "red" };
  if (score >= 40) return { label: "Moderate", tone: "amber" };
  return { label: "Low", tone: "green" };
}

// ─── 1. Customer Discovery ──────────────────────────────────────────────────────
export interface DiscoveryScoreInput {
  painScore: number;
  urgencyScore: number;
  frequencyScore: number;
  budgetSignalScore: number;
  decisionMakerAccessScore: number;
}

export function calculateCustomerDiscoveryScore(i: DiscoveryScoreInput): number {
  const score =
    scale5to100(i.painScore) * 0.3 +
    scale5to100(i.urgencyScore) * 0.25 +
    scale5to100(i.frequencyScore) * 0.15 +
    scale5to100(i.budgetSignalScore) * 0.2 +
    scale5to100(i.decisionMakerAccessScore) * 0.1;
  return clamp100(score);
}

export function interpretDiscoveryScore(score: number): string {
  if (score >= 80) return "Strong validation candidate";
  if (score >= 60) return "Promising";
  if (score >= 40) return "Needs more discovery";
  return "Weak evidence";
}

// ─── 2. Competitor Mapping ───────────────────────────────────────────────────────
export interface CompetitiveRiskInput {
  customerSatisfactionScore: number;
  switchingDifficultyScore: number;
  threatScore: number;
  differentiationScore: number; // higher differentiation = lower risk (inverse)
}

export function calculateCompetitiveRiskScore(i: CompetitiveRiskInput): number {
  // inverse differentiation: a 1–5 of 5 (very differentiated) → low risk contribution
  const inverseDifferentiation = scale5to100(6 - Math.max(1, Math.min(5, i.differentiationScore || 1)));
  const score =
    scale5to100(i.customerSatisfactionScore) * 0.3 +
    scale5to100(i.switchingDifficultyScore) * 0.25 +
    scale5to100(i.threatScore) * 0.25 +
    inverseDifferentiation * 0.2;
  return clamp100(score);
}

export function interpretCompetitiveRisk(score: number): string {
  if (score >= 80) return "Severe competitive risk";
  if (score >= 60) return "High competitive risk";
  if (score >= 40) return "Moderate competitive risk";
  return "Low competitive risk";
}

// ─── 3. Demand Signals ───────────────────────────────────────────────────────────
export interface DemandSignalInput {
  relevanceScore: number;
  evidenceStrengthScore: number;
  recencyScore: number;
  commercialImpactScore: number;
  repeatabilityScore: number;
}

export function calculateDemandSignalScore(i: DemandSignalInput): number {
  const score =
    scale5to100(i.relevanceScore) * 0.25 +
    scale5to100(i.evidenceStrengthScore) * 0.25 +
    scale5to100(i.recencyScore) * 0.15 +
    scale5to100(i.commercialImpactScore) * 0.25 +
    scale5to100(i.repeatabilityScore) * 0.1;
  return clamp100(score);
}

export function interpretDemandSignal(score: number): string {
  if (score >= 80) return "High-confidence market pull";
  if (score >= 60) return "Strong signal";
  if (score >= 40) return "Emerging signal";
  return "Weak market signal";
}

// ─── 4. WTP Assessment ───────────────────────────────────────────────────────────
const EVIDENCE_LEVEL_TO_SCORE: Record<number, number> = {
  1: 10,
  2: 25,
  3: 40,
  4: 55,
  5: 70,
  6: 85,
  7: 100,
};

export interface WTPInput {
  evidenceLevel: number; // 1–7
  budgetOwnerConfirmed: boolean;
  procurementPathway?: string | null;
}

export function isProcurementPathwayClear(p?: string | null): boolean {
  return !!p && p.trim().length >= 3;
}

export function calculateWTPScore(i: WTPInput): number {
  const lvl = Math.max(1, Math.min(7, Math.round(i.evidenceLevel || 1)));
  let score = EVIDENCE_LEVEL_TO_SCORE[lvl] ?? 10;
  if (i.budgetOwnerConfirmed) score += 10;
  if (isProcurementPathwayClear(i.procurementPathway)) score += 10;
  return clamp100(score);
}

export function interpretWTP(score: number): string {
  if (score >= 80) return "High-confidence WTP";
  if (score >= 60) return "Strong commercial signal";
  if (score >= 40) return "Early commercial signal";
  return "Weak WTP";
}

// ─── 5. Market Risk ──────────────────────────────────────────────────────────────
export interface MarketRiskInput {
  probabilityScore: number; // 1–5
  severityScore: number; // 1–5
  evidenceConfidenceScore: number; // 1–5
}

export function calculateMarketRiskScore(i: MarketRiskInput): number {
  const p = Math.max(1, Math.min(5, i.probabilityScore || 1));
  const s = Math.max(1, Math.min(5, i.severityScore || 1));
  const e = Math.max(1, Math.min(5, i.evidenceConfidenceScore || 1));
  return p * s * e; // 1–125
}

export function interpretMarketRisk(score: number): Band {
  if (score >= 76) return { label: "Critical", tone: "red" };
  if (score >= 51) return { label: "High", tone: "red" };
  if (score >= 26) return { label: "Moderate", tone: "amber" };
  return { label: "Low", tone: "green" };
}

// ─── 6. Overall Discovery & Market Confidence ────────────────────────────────────
export interface OverallConfidenceInput {
  customerDiscoveryScore: number;
  demandSignalScore: number;
  wtpScore: number;
  competitiveRiskScore: number; // inverse
  openMarketRiskScore: number; // 0–100 normalised, inverse
}

export function calculateOverallDiscoveryMarketConfidence(i: OverallConfidenceInput): number {
  const score =
    i.customerDiscoveryScore * 0.3 +
    i.demandSignalScore * 0.2 +
    i.wtpScore * 0.3 +
    (100 - i.competitiveRiskScore) * 0.1 +
    (100 - i.openMarketRiskScore) * 0.1;
  return clamp100(score);
}

export function interpretOverallConfidence(score: number): string {
  if (score >= 80) return "Strong market validation";
  if (score >= 60) return "Promising validation";
  if (score >= 40) return "More discovery required";
  return "Weak validation";
}

// ─── Lean decision + next experiment (generic, score-driven) ─────────────────────
export type ModuleKind =
  | "customer_discovery"
  | "competitor"
  | "demand"
  | "wtp"
  | "overall";

export function generateLeanDecision(kind: ModuleKind, score: number): string[] {
  switch (kind) {
    case "customer_discovery":
      if (score >= 80) return ["Persevere", "Begin WTP testing", "Identify pilot candidate"];
      if (score >= 60) return ["Continue discovery", "Strengthen budget evidence", "Run more interviews"];
      if (score >= 40) return ["Refine customer segment", "Re-test problem hypothesis"];
      return ["Pivot problem or customer segment", "Pause further product build"];
    case "competitor":
      if (score >= 80) return ["Sharpen differentiation urgently", "Consider a niche beachhead", "Re-test problem fit vs. status quo"];
      if (score >= 60) return ["Define a clear differentiation wedge", "Target an underserved segment"];
      if (score >= 40) return ["Strengthen positioning", "Validate switching triggers"];
      return ["Competitive space is favourable", "Proceed with current positioning"];
    case "demand":
      if (score >= 80) return ["Convert pull into a paid experiment", "Move to WTP testing"];
      if (score >= 60) return ["Run a transactional demand experiment", "Seek buyer-level evidence"];
      if (score >= 40) return ["Strengthen evidence quality", "Test commercial urgency"];
      return ["Further market signal testing required", "Do not assume demand"];
    case "wtp":
      if (score >= 80) return ["Persevere — strong WTP", "Move to paid pilot / contract"];
      if (score >= 60) return ["Push for LOI or proposal", "Confirm budget owner"];
      if (score >= 40) return ["Escalate the buying conversation", "Validate procurement pathway"];
      return ["Commercial validation required before product build", "Do not treat interest as WTP"];
    case "overall":
      if (score >= 80) return ["Persevere — strong market validation", "Progress to build / pilot"];
      if (score >= 60) return ["Persevere with targeted experiments", "Close remaining evidence gaps"];
      if (score >= 40) return ["Run more experiments before committing capital", "Address weakest dimension"];
      return ["Pivot or pause", "Market evidence does not justify full build"];
  }
}

export function generateNextExperimentRecommendation(kind: ModuleKind, score: number): string {
  switch (kind) {
    case "customer_discovery":
      if (score >= 80) return "Run a WTP test with a confirmed budget owner to convert discovery into commercial evidence.";
      if (score >= 60) return "Run 5 more buyer interviews focused on budget ownership and decision-making.";
      if (score >= 40) return "Re-test the problem hypothesis with a sharper customer segment definition.";
      return "Run a problem-validation experiment with an alternative segment before building anything.";
    case "competitor":
      if (score >= 60) return "Run a switching-trigger interview set to test what would make customers leave the status quo.";
      return "Validate your differentiation claim with a head-to-head comparison test against the strongest alternative.";
    case "demand":
      if (score >= 60) return "Convert the strongest signal into a transactional experiment (LOI, pre-order, or paid pilot).";
      return "Run a concierge or landing-page experiment to test whether macro demand converts to buyer action.";
    case "wtp":
      if (score >= 60) return "Request a proposal or LOI from the most engaged buyer to lock in commercial commitment.";
      return "Run a pricing/LOI test with a confirmed budget owner to move beyond positive feedback.";
    case "overall":
      if (score >= 60) return "Run a paid-pilot experiment to convert validation into revenue evidence.";
      return "Prioritise the lowest-scoring dimension and design a single decisive experiment to resolve it.";
  }
}

// ─── Auto-risk rule engine ──────────────────────────────────────────────────────
export interface AutoRiskSpec {
  riskTitle: string;
  riskCategory: (typeof RISK_CATEGORIES)[number];
  probabilityScore: number;
  severityScore: number;
  evidenceConfidenceScore: number;
  requiredExperiment: string;
}

/** Customer interview → auto risks (spec §4). */
export function autoRisksForInterview(i: DiscoveryScoreInput): AutoRiskSpec[] {
  const risks: AutoRiskSpec[] = [];
  if ((i.budgetSignalScore || 0) <= 2) {
    risks.push({
      riskTitle: "Budget owner not validated",
      riskCategory: "budget_risk",
      probabilityScore: 4,
      severityScore: 4,
      evidenceConfidenceScore: 4,
      requiredExperiment: "Identify and interview the confirmed budget owner.",
    });
  }
  if ((i.decisionMakerAccessScore || 0) <= 2) {
    risks.push({
      riskTitle: "Decision-maker access weak",
      riskCategory: "procurement_risk",
      probabilityScore: 4,
      severityScore: 4,
      evidenceConfidenceScore: 3,
      requiredExperiment: "Map the buying unit and secure a meeting with the decision-maker.",
    });
  }
  if ((i.painScore || 0) <= 2) {
    risks.push({
      riskTitle: "Problem pain may be insufficient",
      riskCategory: "problem_risk",
      probabilityScore: 4,
      severityScore: 5,
      evidenceConfidenceScore: 3,
      requiredExperiment: "Re-test the problem with a sharper segment to confirm pain intensity.",
    });
  }
  return risks;
}

/** Competitor → auto risks (spec §5). */
export function autoRisksForCompetitor(c: {
  competitorType: string;
  customerSatisfactionScore: number;
  switchingDifficultyScore: number;
  competitiveRiskScore: number;
}): AutoRiskSpec[] {
  const risks: AutoRiskSpec[] = [];
  if ((c.competitiveRiskScore || 0) > 70) {
    risks.push({
      riskTitle: "Competitive intensity may block adoption",
      riskCategory: "competitive_risk",
      probabilityScore: 4,
      severityScore: 4,
      evidenceConfidenceScore: 4,
      requiredExperiment: "Run a differentiation test against the strongest competitor.",
    });
  }
  if ((c.switchingDifficultyScore || 0) >= 4) {
    risks.push({
      riskTitle: "Switching friction is high",
      riskCategory: "adoption_risk",
      probabilityScore: 4,
      severityScore: 3,
      evidenceConfidenceScore: 4,
      requiredExperiment: "Test a migration / onboarding offer to reduce switching cost.",
    });
  }
  if (c.competitorType === "status_quo" && (c.customerSatisfactionScore || 0) >= 4) {
    risks.push({
      riskTitle: "Status quo may be good enough",
      riskCategory: "adoption_risk",
      probabilityScore: 4,
      severityScore: 4,
      evidenceConfidenceScore: 3,
      requiredExperiment: "Test whether customers will actively replace the current workaround.",
    });
  }
  return risks;
}

/** Demand signal → auto risks (spec §6). */
export function autoRisksForDemandSignal(d: {
  signalType: string;
  evidenceStrengthScore: number;
  commercialImpactScore: number;
}): AutoRiskSpec[] {
  const risks: AutoRiskSpec[] = [];
  const macroTypes = ["regulation", "media", "industry_report", "investment", "academic"];
  if (macroTypes.includes(d.signalType) && (d.evidenceStrengthScore || 0) < 3) {
    risks.push({
      riskTitle: "Macro demand not yet converted into buyer evidence",
      riskCategory: "timing_risk",
      probabilityScore: 4,
      severityScore: 3,
      evidenceConfidenceScore: 3,
      requiredExperiment: "Run a buyer-level experiment (LOI / pilot) to convert macro demand.",
    });
  }
  if ((d.commercialImpactScore || 0) <= 2) {
    risks.push({
      riskTitle: "Demand signal may not create commercial urgency",
      riskCategory: "problem_risk",
      probabilityScore: 3,
      severityScore: 4,
      evidenceConfidenceScore: 3,
      requiredExperiment: "Test whether the signal drives a real purchasing decision.",
    });
  }
  return risks;
}

/** WTP test → auto risks (spec §7). */
export function autoRisksForWTP(w: {
  evidenceLevel: number;
  budgetOwnerConfirmed: boolean;
  procurementPathway?: string | null;
}): AutoRiskSpec[] {
  const risks: AutoRiskSpec[] = [];
  if ((w.evidenceLevel || 1) < 4) {
    risks.push({
      riskTitle: "Willingness to pay not yet validated",
      riskCategory: "budget_risk",
      probabilityScore: 4,
      severityScore: 4,
      evidenceConfidenceScore: 4,
      requiredExperiment: "Push the buyer up the evidence ladder (proposal / LOI / paid pilot).",
    });
  }
  if (!w.budgetOwnerConfirmed) {
    risks.push({
      riskTitle: "Budget owner unknown",
      riskCategory: "budget_risk",
      probabilityScore: 4,
      severityScore: 4,
      evidenceConfidenceScore: 3,
      requiredExperiment: "Identify and confirm the person who controls the budget.",
    });
  }
  if (!isProcurementPathwayClear(w.procurementPathway)) {
    risks.push({
      riskTitle: "Procurement pathway unclear",
      riskCategory: "procurement_risk",
      probabilityScore: 3,
      severityScore: 4,
      evidenceConfidenceScore: 3,
      requiredExperiment: "Map the procurement / purchasing process with the customer.",
    });
  }
  return risks;
}

/** Market Risk Log decision warnings (spec §8). */
export function marketRiskDecisionWarnings(
  risks: {
    riskCategory: string;
    marketRiskScore: number;
    status: string;
  }[],
): string[] {
  const warnings: string[] = [];
  const openish = (s: string) => s !== "closed" && s !== "mitigated";
  const open = risks.filter((r) => openish(r.status));
  const criticalCount = open.filter((r) => r.marketRiskScore >= 76).length;
  if (criticalCount >= 3) {
    warnings.push("Market validation is not strong enough to justify full product build.");
  }
  const hasBudget = open.some((r) => r.riskCategory === "budget_risk");
  const hasProcurement = open.some((r) => r.riskCategory === "procurement_risk");
  if (hasBudget && hasProcurement) {
    warnings.push("Commercial pathway is not validated.");
  }
  const dataAccessHigh = open.some(
    (r) => r.riskCategory === "data_access_risk" && r.marketRiskScore >= 51,
  );
  if (dataAccessHigh) {
    warnings.push("MVP feasibility may be blocked by customer data access.");
  }
  return warnings;
}

/** Normalise the open market-risk load (0–100, higher = more risk) for the overall formula. */
export function normaliseOpenMarketRisk(
  risks: { marketRiskScore: number; status: string }[],
): number {
  const open = risks.filter((r) => r.status !== "closed" && r.status !== "mitigated");
  if (open.length === 0) return 0;
  const top = Math.max(...open.map((r) => r.marketRiskScore));
  // 125 max → 100 scale
  return clamp100((top / 125) * 100);
}

// ─── Aggregation helpers (average of stored sub-scores) ──────────────────────────
export function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}
