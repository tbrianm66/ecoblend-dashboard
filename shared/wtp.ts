// ============================================================================
// WTP ASSESSMENT — Commercial validation scoring engine + enum option sets
// Pure functions reused by both the tRPC server (stored scores / auto-risk /
// auto-alert) and the React client (live preview). No DB or React imports.
//
// Core principle: this module measures real buying commitment (money, budget,
// procurement, LOIs, paid pilots) — NOT whether a customer "likes the idea".
// ============================================================================

// ─── Enum / option sets ───────────────────────────────────────────────────────
export const WTP_TEST_STATUSES = [
  "planned",
  "in_progress",
  "completed",
  "blocked",
  "invalidated",
  "converted_to_pilot",
  "converted_to_loi",
  "converted_to_paid_customer",
] as const;

export const WTP_PRICING_MODELS = [
  "paid_pilot",
  "subscription",
  "licence",
  "consultancy_plus_platform",
  "product_sales",
  "service_fee",
  "success_fee",
  "data_partnership",
  "co_development",
  "venture_studio_equity",
  "transaction_fee",
] as const;

export const WTP_TEST_METHODS = [
  "pricing_interview",
  "proposal_sent",
  "paid_pilot_offer",
  "loi_request",
  "procurement_conversation",
  "budget_holder_meeting",
  "landing_page_pricing_test",
  "concierge_offer",
  "sales_call",
  "tender_response",
] as const;

export const WTP_OBJECTION_CATEGORIES = [
  "price_too_high",
  "unclear_roi",
  "no_budget",
  "wrong_budget_cycle",
  "procurement_barrier",
  "trust_barrier",
  "insufficient_proof",
  "switching_cost",
  "data_sharing_concern",
  "not_priority",
  "competitor_preferred",
  "timing_issue",
] as const;

export const BUDGET_OWNER_STATUSES = ["unknown", "partial", "confirmed"] as const;

export const PRICING_RESPONSES = [
  "none",
  "accepted",
  "negotiating",
  "needs_roi_proof",
  "price_resistance",
  "rejected",
] as const;

export const COMMITMENT_TYPES = [
  "verbal_interest",
  "follow_up_meeting",
  "data_sharing",
  "budget_holder_intro",
  "proposal_request",
  "loi_signed",
  "pilot_agreed",
  "paid_pilot",
  "purchase_order",
  "co_development_agreement",
  "partnership_mou",
] as const;

export const COMMITMENT_STATUSES = [
  "weak",
  "moderate",
  "strong",
  "confirmed",
  "withdrawn",
] as const;

export const PRICING_EXPERIMENT_STATUSES = [
  "proposed",
  "running",
  "completed",
  "inconclusive",
  "invalidated",
] as const;

export const BUDGET_VALIDATION_STATUSES = [
  "unknown",
  "partially_validated",
  "validated",
  "blocked",
  "invalidated",
] as const;

export const BUDGET_CATEGORIES = [
  "innovation",
  "operations",
  "engineering",
  "sustainability",
  "procurement",
  "digital_transformation",
  "compliance",
  "training",
  "capex",
  "opex",
  "research_and_development",
] as const;

export const PROCUREMENT_ROUTES = [
  "direct_purchase",
  "innovation_pilot",
  "framework_agreement",
  "tender",
  "supplier_onboarding",
  "partner_channel",
  "university_or_research_route",
  "internal_sponsor",
  "unknown",
] as const;

export const PROCUREMENT_STATUSES = [
  "unknown",
  "mapped",
  "blocked",
  "feasible",
  "high_friction",
  "validated",
] as const;

// ─── WTP Evidence Ladder (spec §5) ─────────────────────────────────────────────
// Level 1-2 are weak interest, NOT WTP validation. Level 7 is real WTP.
export interface EvidenceLadderRung {
  level: number;
  label: string;
  strength: "weak" | "moderate" | "strong" | "very_strong";
  proves: string;
  doesNotProve: string;
}

export const WTP_EVIDENCE_LADDER: EvidenceLadderRung[] = [
  {
    level: 1,
    label: 'Customer says "interesting"',
    strength: "weak",
    proves: "Surface-level curiosity about the idea.",
    doesNotProve: "Any willingness to pay, budget, or buying intent.",
  },
  {
    level: 2,
    label: "Customer agrees to another meeting",
    strength: "weak",
    proves: "Mild ongoing interest worth a follow-up.",
    doesNotProve: "Commercial commitment — politeness is not WTP.",
  },
  {
    level: 3,
    label: "Customer shares internal or operational data",
    strength: "moderate",
    proves: "Operational commitment and a real problem worth their time.",
    doesNotProve: "That they will pay, or that budget exists.",
  },
  {
    level: 4,
    label: "Customer introduces a budget holder",
    strength: "moderate",
    proves: "Access to budget authority and an internal champion.",
    doesNotProve: "That the budget owner will approve spend.",
  },
  {
    level: 5,
    label: "Customer requests a proposal",
    strength: "strong",
    proves: "Movement inside the buying process.",
    doesNotProve: "Final commitment — proposals can still stall.",
  },
  {
    level: 6,
    label: "Customer signs an LOI or formal pilot agreement",
    strength: "strong",
    proves: "Formal intent to proceed.",
    doesNotProve: "Realised revenue until money actually moves.",
  },
  {
    level: 7,
    label: "Customer pays for a pilot or purchase order",
    strength: "very_strong",
    proves: "Real, validated willingness to pay.",
    doesNotProve: "Long-term retention or scale (a separate question).",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clamp100(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export type WtpTone = "red" | "amber" | "green" | "grey" | "blue";
export interface WtpBand {
  label: string;
  tone: WtpTone;
}

// ─── 1. Evidence Level Score (spec §7) ──────────────────────────────────────────
const EVIDENCE_LEVEL_TO_SCORE: Record<number, number> = {
  1: 10,
  2: 25,
  3: 40,
  4: 55,
  5: 70,
  6: 85,
  7: 100,
};

export function calculateEvidenceLevelScore(level: number): number {
  const lvl = Math.max(1, Math.min(7, Math.round(level || 1)));
  return EVIDENCE_LEVEL_TO_SCORE[lvl] ?? 10;
}

// ─── 2. Component sub-scores (spec §7) ──────────────────────────────────────────
export function budgetOwnerScore(status: string | null | undefined): number {
  switch (status) {
    case "confirmed":
      return 100;
    case "partial":
      return 50;
    default:
      return 0; // unknown
  }
}

export function procurementPathwayScore(status: string | null | undefined): number {
  switch (status) {
    case "validated":
      return 100;
    case "feasible":
      return 75;
    case "mapped":
      return 60;
    case "high_friction":
      return 40;
    case "blocked":
      return 0;
    default:
      return 25; // unknown
  }
}

export function pricingResponseScore(response: string | null | undefined): number {
  switch (response) {
    case "accepted":
      return 100;
    case "negotiating":
      return 75;
    case "needs_roi_proof":
      return 50;
    case "price_resistance":
      return 25;
    case "rejected":
      return 0;
    default:
      return 0; // none / untested
  }
}

// ─── 3. WTP Score (spec §7) ─────────────────────────────────────────────────────
export interface WTPScoreInput {
  evidenceLevel: number; // 1-7
  budgetOwnerStatus?: string | null;
  budgetOwnerConfirmed?: boolean | null; // legacy fallback
  procurementPathwayStatus?: string | null;
  pricingResponse?: string | null;
}

export function calculateWTPScore(i: WTPScoreInput): number {
  // Derive budget-owner status from the legacy boolean if a tri-state is absent.
  const budgetStatus =
    i.budgetOwnerStatus ??
    (i.budgetOwnerConfirmed ? "confirmed" : "unknown");

  const score =
    calculateEvidenceLevelScore(i.evidenceLevel) * 0.5 +
    budgetOwnerScore(budgetStatus) * 0.2 +
    procurementPathwayScore(i.procurementPathwayStatus) * 0.15 +
    pricingResponseScore(i.pricingResponse) * 0.15;
  return clamp100(score);
}

// ─── 4. Interpretation bands (spec §7) ──────────────────────────────────────────
export function interpretWTPScore(score: number): WtpBand {
  if (score >= 80) return { label: "High-confidence WTP", tone: "green" };
  if (score >= 60) return { label: "Strong commercial signal", tone: "green" };
  if (score >= 40) return { label: "Early commercial signal", tone: "amber" };
  return { label: "Weak WTP", tone: "red" };
}

// ─── 5. Venture-level WTP status (spec §9) ──────────────────────────────────────
export type VentureWTPStatus =
  | "not_tested"
  | "weak"
  | "emerging"
  | "strong"
  | "validated";

export interface VentureWTPStatusInput {
  testCount: number;
  averageScore: number;
  highestEvidenceLevel: number;
}

export function calculateVentureWTPStatus(i: VentureWTPStatusInput): VentureWTPStatus {
  if (i.testCount === 0) return "not_tested";
  if (i.highestEvidenceLevel >= 7 || i.averageScore >= 80) return "validated";
  if (i.averageScore >= 60) return "strong";
  if (i.averageScore >= 40) return "emerging";
  return "weak";
}

export function ventureWTPStatusBand(status: VentureWTPStatus): WtpBand {
  switch (status) {
    case "validated":
      return { label: "Validated", tone: "green" };
    case "strong":
      return { label: "Strong", tone: "green" };
    case "emerging":
      return { label: "Emerging", tone: "amber" };
    case "weak":
      return { label: "Weak", tone: "red" };
    default:
      return { label: "Not tested", tone: "grey" };
  }
}

// ─── 6. WTP Decision Logic (spec §8) ────────────────────────────────────────────
export function generateWTPDecisionRecommendation(score: number): string[] {
  if (score >= 80)
    return [
      "Proceed to paid pilot, LOI, or MVP validation",
      "Lock in commercial commitment with the strongest buyer",
    ];
  if (score >= 60)
    return [
      "Strengthen commercial evidence",
      "Clarify the procurement pathway before scaling",
    ];
  if (score >= 40)
    return [
      "Run another pricing or budget-owner test",
      "Move at least one buyer up the evidence ladder",
    ];
  return [
    "Do not proceed to MVP build",
    "Pivot value proposition, customer segment, or pricing model",
  ];
}

// ─── 7. WTP Warnings (spec §8) ──────────────────────────────────────────────────
export interface WTPWarningInput {
  evidenceLevel: number;
  budgetOwnerStatus?: string | null;
  budgetOwnerConfirmed?: boolean | null;
  procurementPathwayStatus?: string | null;
  pricingResponse?: string | null;
  objectionCategory?: string | null;
}

export function generateWTPWarnings(i: WTPWarningInput): string[] {
  const warnings: string[] = [];
  const budgetStatus =
    i.budgetOwnerStatus ?? (i.budgetOwnerConfirmed ? "confirmed" : "unknown");

  if ((i.evidenceLevel || 1) <= 2) {
    warnings.push("Positive interest is not commercial validation.");
  }
  if (budgetStatus === "unknown") {
    warnings.push(
      "WTP is not validated until the economic buyer or budget owner is identified.",
    );
  }
  if (i.procurementPathwayStatus === "blocked") {
    warnings.push("Adoption may be blocked even if buyer interest exists.");
  }
  if (i.objectionCategory === "data_sharing_concern") {
    warnings.push(
      "Customer will share data but may not pay — test a data partnership, co-development, or paid pilot structure.",
    );
  }
  return warnings;
}

// ─── 8. Auto Market Risks (spec §15) ────────────────────────────────────────────
export interface WtpRiskSpec {
  riskTitle: string;
  riskCategory: string;
  probabilityScore: number;
  severityScore: number;
  evidenceConfidenceScore: number;
  requiredExperiment: string;
}

export interface WtpRiskInput {
  wtpScore: number;
  evidenceLevel: number;
  budgetOwnerStatus?: string | null;
  budgetOwnerConfirmed?: boolean | null;
  procurementPathwayStatus?: string | null;
  objectionCategory?: string | null;
}

export function wtpMarketRiskSpecs(i: WtpRiskInput): WtpRiskSpec[] {
  const risks: WtpRiskSpec[] = [];
  const budgetStatus =
    i.budgetOwnerStatus ?? (i.budgetOwnerConfirmed ? "confirmed" : "unknown");

  if (i.wtpScore < 40) {
    risks.push({
      riskTitle: "Willingness to pay not validated",
      riskCategory: "budget_risk",
      probabilityScore: 4,
      severityScore: 4,
      evidenceConfidenceScore: 4,
      requiredExperiment:
        "Run a pricing/LOI test with a confirmed budget owner to move beyond interest.",
    });
  }
  if ((i.evidenceLevel || 1) <= 2) {
    risks.push({
      riskTitle: "Positive interest mistaken for WTP",
      riskCategory: "budget_risk",
      probabilityScore: 4,
      severityScore: 3,
      evidenceConfidenceScore: 3,
      requiredExperiment:
        "Push the buyer up the evidence ladder (data share, budget intro, proposal).",
    });
  }
  if (budgetStatus === "unknown") {
    risks.push({
      riskTitle: "Budget owner unknown",
      riskCategory: "budget_risk",
      probabilityScore: 4,
      severityScore: 4,
      evidenceConfidenceScore: 3,
      requiredExperiment: "Identify and confirm the person who controls the budget.",
    });
  }
  if (
    i.procurementPathwayStatus === "blocked" ||
    i.procurementPathwayStatus === "unknown" ||
    !i.procurementPathwayStatus
  ) {
    risks.push({
      riskTitle: "Procurement pathway unclear or blocked",
      riskCategory: "procurement_risk",
      probabilityScore: 4,
      severityScore: 4,
      evidenceConfidenceScore: 3,
      requiredExperiment: "Map the procurement / purchasing process with the customer.",
    });
  }
  if (i.objectionCategory === "data_sharing_concern") {
    risks.push({
      riskTitle: "Data sharing may block commercial validation",
      riskCategory: "data_access_risk",
      probabilityScore: 4,
      severityScore: 4,
      evidenceConfidenceScore: 3,
      requiredExperiment: "Define an anonymised / governed data-sharing protocol.",
    });
  }
  if (i.objectionCategory === "trust_barrier") {
    risks.push({
      riskTitle: "Customer trust barrier may block purchase",
      riskCategory: "trust_risk",
      probabilityScore: 3,
      severityScore: 4,
      evidenceConfidenceScore: 3,
      requiredExperiment: "Provide proof points / references to overcome the trust barrier.",
    });
  }
  return risks;
}

// ─── 9. Auto Command Alerts (spec §15) ──────────────────────────────────────────
export interface WtpAlertSpec {
  alertType: string;
  alertTitle: string;
  alertDescription: string;
  severity: "low" | "medium" | "high" | "critical";
  recommendedAction: string;
  dedupeKey: string;
}

export interface WtpAlertInput {
  ventureId: string;
  wtpTestId: number;
  wtpScore: number;
  ventureStage?: string | null;
  testStatus?: string | null;
  evidenceLevel: number;
  nextCommercialAction?: string | null;
  nextActionDueDate?: string | null;
  /** today as YYYY-MM-DD for overdue comparison */
  today?: string;
}

export function wtpCommandAlertSpecs(i: WtpAlertInput): WtpAlertSpec[] {
  const alerts: WtpAlertSpec[] = [];

  // Venture in MVP Validation but WTP < 60 → critical.
  const inMvp =
    (i.ventureStage || "").toLowerCase().includes("mvp") ||
    (i.ventureStage || "").toLowerCase().includes("build");
  if (inMvp && i.wtpScore < 60) {
    alerts.push({
      alertType: "low_wtp",
      alertTitle: "Low WTP for MVP-stage venture",
      alertDescription: `WTP score ${i.wtpScore} is below 60 while the venture is in MVP/Build validation.`,
      severity: "critical",
      recommendedAction:
        "Do not proceed to MVP build until commercial validation is strengthened.",
      dedupeKey: `wtp:low_wtp:${i.wtpTestId}`,
    });
  }

  // Overdue next commercial action → high.
  if (i.nextActionDueDate && i.today && i.nextActionDueDate < i.today) {
    alerts.push({
      alertType: "overdue_commercial_action",
      alertTitle: "Overdue commercial action",
      alertDescription: `Next commercial action was due ${i.nextActionDueDate}: ${i.nextCommercialAction ?? "(unspecified)"}.`,
      severity: "high",
      recommendedAction: i.nextCommercialAction ?? "Complete the overdue commercial action.",
      dedupeKey: `wtp:overdue:${i.wtpTestId}`,
    });
  }

  // Proposal requested (evidence level 5) but no next action recorded → medium.
  if (
    (i.evidenceLevel || 1) >= 5 &&
    !(i.nextCommercialAction && i.nextCommercialAction.trim().length > 0)
  ) {
    alerts.push({
      alertType: "approval_required",
      alertTitle: "Proposal requested with no follow-up action",
      alertDescription:
        "A proposal/LOI was requested but no next commercial action is recorded.",
      severity: "medium",
      recommendedAction: "Define and schedule the next commercial action for this buyer.",
      dedupeKey: `wtp:no_followup:${i.wtpTestId}`,
    });
  }

  return alerts;
}

// ─── 10. Pricing conversion + procurement friction (spec §18) ──────────────────
export function calculatePricingConversionRate(
  positiveResponses: number,
  negativeResponses: number,
  sampleSize?: number,
): number {
  const denom =
    sampleSize && sampleSize > 0
      ? sampleSize
      : (positiveResponses || 0) + (negativeResponses || 0);
  if (denom <= 0) return 0;
  return clamp100(((positiveResponses || 0) / denom) * 100);
}

export interface ProcurementFrictionInput {
  complexityScore: number; // 1-5
  expectedSalesCycleDays: number;
  legalReviewRequired?: boolean;
  dataSecurityReviewRequired?: boolean;
  pilotPossibleWithoutFullProcurement?: boolean;
  route?: string | null;
}

/** Returns 0-100 where higher = MORE friction (worse). */
export function calculateProcurementFrictionScore(i: ProcurementFrictionInput): number {
  let score = 0;
  // Complexity 1-5 → 0-40
  score += Math.max(0, Math.min(5, i.complexityScore || 1)) * 8;
  // Sales cycle: 0 days → 0, 365+ days → 30
  score += Math.min(30, ((i.expectedSalesCycleDays || 0) / 365) * 30);
  if (i.legalReviewRequired) score += 10;
  if (i.dataSecurityReviewRequired) score += 10;
  if (i.route === "tender" || i.route === "unknown") score += 10;
  // A pilot route reduces friction.
  if (i.pilotPossibleWithoutFullProcurement) score -= 10;
  return clamp100(score);
}

export function interpretProcurementFriction(score: number): WtpBand {
  if (score >= 70) return { label: "Severe friction", tone: "red" };
  if (score >= 45) return { label: "High friction", tone: "amber" };
  if (score >= 20) return { label: "Moderate friction", tone: "blue" };
  return { label: "Low friction", tone: "green" };
}

// ─── 11. Commitment strength helpers ────────────────────────────────────────────
export function commitmentStatusBand(status: string): WtpBand {
  switch (status) {
    case "confirmed":
      return { label: "Confirmed", tone: "green" };
    case "strong":
      return { label: "Strong", tone: "green" };
    case "moderate":
      return { label: "Moderate", tone: "amber" };
    case "withdrawn":
      return { label: "Withdrawn", tone: "red" };
    default:
      return { label: "Weak", tone: "grey" };
  }
}

// ─── 12. Stage-Gate WTP gate (spec §16) ─────────────────────────────────────────
export interface WtpStageGateInput {
  averageWtpScore: number;
  budgetOwnerIdentified: boolean;
  pricingModelTested: boolean;
  procurementPathwayMapped: boolean;
  unresolvedCriticalRiskCount: number;
}

export interface WtpStageGateCheck {
  label: string;
  passed: boolean;
}

/** Commercial Validation → MVP Validation gate. */
export function wtpStageGateChecklist(i: WtpStageGateInput): WtpStageGateCheck[] {
  return [
    { label: "WTP score of 60 or above", passed: i.averageWtpScore >= 60 },
    { label: "Budget owner identified", passed: i.budgetOwnerIdentified },
    { label: "Pricing model tested", passed: i.pricingModelTested },
    { label: "Procurement pathway mapped", passed: i.procurementPathwayMapped },
    {
      label: "No unresolved critical WTP risk",
      passed: i.unresolvedCriticalRiskCount === 0,
    },
  ];
}

export function wtpStageGateReady(i: WtpStageGateInput): boolean {
  return wtpStageGateChecklist(i).every((c) => c.passed);
}

// ─── Aggregation helper ─────────────────────────────────────────────────────────
export function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

// ─── Label helpers (snake_case → Title Case) ────────────────────────────────────
export function humanise(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
