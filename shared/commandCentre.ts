// ============================================================================
// COMMAND CENTRE — Shared Lean Startup scoring + decision engine
// Pure functions reused by the tRPC server (stored scores, auto-alerts) and the
// React client (live preview). No DB or React imports here.
// ============================================================================

// ─── Enum / option sets ───────────────────────────────────────────────────────
export const VENTURE_STATUSES = [
  "idea", "validating", "building", "piloting", "scaling", "paused", "pivoting", "killed", "archived",
] as const;

export const VENTURE_STAGES = [
  "intake", "problem_validation", "market_validation", "commercial_validation",
  "mvp_validation", "delivery_validation", "gtm_validation", "investment_ready",
] as const;

export const HYPOTHESIS_TYPES = [
  "customer_segment", "problem", "value_proposition", "solution", "business_model",
  "pricing", "channel", "operational", "manufacturing", "sustainability", "data_access", "regulatory",
] as const;

export const HYPOTHESIS_STATUSES = [
  "untested", "testing", "validated", "invalidated", "pivot_required", "paused",
] as const;

export const ASSUMPTION_RISK_LEVELS = ["low", "medium", "high", "critical"] as const;

export const EXPERIMENT_TYPES = [
  "customer_interview", "survey", "landing_page", "prototype_test", "concierge_mvp",
  "paid_pilot", "loi_test", "pricing_test", "supplier_test", "manufacturing_test",
  "channel_test", "data_access_test", "procurement_test",
] as const;

export const EXPERIMENT_STATUSES = [
  "proposed", "approved", "running", "completed", "blocked", "overdue", "cancelled",
] as const;

export const DECISION_RECOMMENDATIONS = [
  "persevere", "pivot", "run_more_experiments", "pause", "kill", "advance_stage",
] as const;

export const EVIDENCE_TYPES = [
  "interview", "survey", "customer_commitment", "budget_signal", "procurement_signal",
  "demand_signal", "competitor_signal", "prototype_result", "pilot_result", "supplier_result",
  "manufacturing_result", "gtm_result", "academic_research", "regulatory_evidence", "financial_model",
] as const;

export const DECISION_TYPES = [
  "pivot", "persevere", "pause", "kill", "advance_stage", "request_more_evidence",
] as const;

export const DECISION_STATUSES = [
  "recommended", "pending_approval", "approved", "rejected", "implemented", "archived",
] as const;

export const PIVOT_TYPES = [
  "customer_segment", "problem", "value_proposition", "solution",
  "business_model", "pricing", "channel", "operational", "manufacturing",
] as const;

export const REVIEW_STATUSES = [
  "not_started", "ready_for_review", "under_review", "approved", "rejected", "conditional_approval", "paused",
] as const;

export const APPROVAL_DECISIONS = [
  "approve_progression", "reject_progression", "request_more_evidence", "pivot_required", "pause_venture", "kill_venture",
] as const;

export const ALERT_TYPES = [
  "weak_evidence", "overdue_experiment", "high_market_risk", "high_technical_risk",
  "low_wtp", "procurement_blocker", "data_access_blocker", "stage_gate_required",
  "pivot_recommended", "kill_recommended", "approval_required",
] as const;

export const ALERT_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export const ALERT_STATUSES = ["open", "acknowledged", "in_progress", "resolved", "dismissed"] as const;

export const MODULE_SOURCES = [
  "venture_intake", "discovery_market", "proposition_model", "rd_hub",
  "operations_mfg", "brand_gtm", "market_risk_log", "command_centre",
] as const;

// ─── Display labels ───────────────────────────────────────────────────────────
export const STAGE_LABELS: Record<string, string> = {
  intake: "Intake",
  problem_validation: "Problem Validation",
  market_validation: "Market Validation",
  commercial_validation: "Commercial Validation",
  mvp_validation: "MVP Validation",
  delivery_validation: "Delivery Validation",
  gtm_validation: "GTM Validation",
  investment_ready: "Investment Ready",
};

export const STAGE_ORDER = VENTURE_STAGES;

export function nextStage(stage: string): string | null {
  const idx = STAGE_ORDER.indexOf(stage as (typeof STAGE_ORDER)[number]);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

export function humanise(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Bands / tone ─────────────────────────────────────────────────────────────
export type Tone = "green" | "amber" | "red" | "grey" | "blue";
export interface Band { label: string; tone: Tone; }

/** Health-style band: higher is better (0-100). */
export function healthBand(score: number): Band {
  if (score >= 80) return { label: "Strong", tone: "green" };
  if (score >= 60) return { label: "Promising", tone: "blue" };
  if (score >= 40) return { label: "Needs validation", tone: "amber" };
  return { label: "Weak", tone: "red" };
}

/** Risk-style band: higher is worse (0-100). */
export function riskBand(score: number): Band {
  if (score >= 75) return { label: "Critical", tone: "red" };
  if (score >= 50) return { label: "High", tone: "amber" };
  if (score >= 25) return { label: "Moderate", tone: "blue" };
  return { label: "Low", tone: "green" };
}

export function riskLevelFromScore(score: number): (typeof ASSUMPTION_RISK_LEVELS)[number] {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

export function severityBand(severity: string): Band {
  switch (severity) {
    case "critical": return { label: "Critical", tone: "red" };
    case "high": return { label: "High", tone: "amber" };
    case "medium": return { label: "Medium", tone: "blue" };
    default: return { label: "Low", tone: "grey" };
  }
}

// ─── Generic helpers ──────────────────────────────────────────────────────────
export function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

export function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

/** Map a 1-5 score onto 0-100. (1→0, 5→100) */
export function scale5to100(score: number): number {
  return clamp(((clamp(score, 0, 5) - 1) / 4) * 100);
}

// ─── 1. Evidence Confidence Score (single record) ─────────────────────────────
export interface EvidenceScoreInput {
  evidenceStrengthScore: number;   // 1-5
  evidenceRelevanceScore: number;  // 1-5
  evidenceRecencyScore: number;    // 1-5
}

export function calculateEvidenceConfidenceScore(e: EvidenceScoreInput): number {
  const strength = scale5to100(e.evidenceStrengthScore ?? 1);
  const relevance = scale5to100(e.evidenceRelevanceScore ?? 1);
  const recency = scale5to100(e.evidenceRecencyScore ?? 1);
  return clamp(Math.round(strength * 0.4 + relevance * 0.35 + recency * 0.25));
}

// ─── 2. Venture-level Evidence Confidence (with penalties) ─────────────────────
export interface VentureEvidenceInput {
  evidence: Array<{
    evidenceType?: string | null;
    evidenceConfidenceScore?: number | null;
    contradictsHypothesis?: boolean | null;
  }>;
  stage?: string | null;     // current venture stage
  riskScore?: number;        // 0-100, venture risk
}

const INTERVIEW_EVIDENCE = new Set(["interview", "survey"]);
const WTP_EVIDENCE = new Set(["customer_commitment", "budget_signal", "procurement_signal"]);
const TECHNICAL_EVIDENCE = new Set(["prototype_result", "pilot_result", "manufacturing_result", "supplier_result"]);
const RISK_MITIGATION_EVIDENCE = new Set(["regulatory_evidence", "supplier_result", "financial_model", "manufacturing_result"]);
const POST_MVP_STAGES = new Set(["mvp_validation", "delivery_validation", "gtm_validation", "investment_ready"]);

export function calculateVentureEvidenceConfidence(input: VentureEvidenceInput): number {
  const { evidence, stage, riskScore = 0 } = input;
  if (!evidence.length) return 0;
  const base = avg(evidence.map((e) => e.evidenceConfidenceScore ?? 0));
  let score = base;
  const has = (set: Set<string>) => evidence.some((e) => e.evidenceType && set.has(e.evidenceType));
  if (!has(INTERVIEW_EVIDENCE)) score -= 10;
  if (!has(WTP_EVIDENCE)) score -= 10;
  if (POST_MVP_STAGES.has(stage ?? "") && !has(TECHNICAL_EVIDENCE)) score -= 10;
  if (riskScore >= 75 && !has(RISK_MITIGATION_EVIDENCE)) score -= 10;
  return clamp(score);
}

/** Supporting vs contradicting evidence ratio (0-100, % supporting). */
export function supportingRatio(
  evidence: Array<{ contradictsHypothesis?: boolean | null }>,
): number {
  if (!evidence.length) return 0;
  const supporting = evidence.filter((e) => !e.contradictsHypothesis).length;
  return Math.round((supporting / evidence.length) * 100);
}

// ─── 3. Portfolio Health Score ────────────────────────────────────────────────
export interface PortfolioHealthInput {
  evidenceConfidence: number;      // 0-100
  marketValidation: number;        // 0-100
  commercialValidation: number;    // 0-100
  technicalValidation: number;     // 0-100
  operationalReadiness: number;    // 0-100
  riskScore: number;               // 0-100 (higher = worse)
}

export function calculatePortfolioHealthScore(i: PortfolioHealthInput): number {
  const inverseRisk = 100 - clamp(i.riskScore);
  return clamp(Math.round(
    clamp(i.evidenceConfidence) * 0.25 +
    clamp(i.marketValidation) * 0.20 +
    clamp(i.commercialValidation) * 0.20 +
    clamp(i.technicalValidation) * 0.15 +
    clamp(i.operationalReadiness) * 0.10 +
    inverseRisk * 0.10,
  ));
}

// ─── 4. Risk-Adjusted Readiness ───────────────────────────────────────────────
export interface RiskAdjustedInput {
  evidenceConfidence: number;
  marketValidation: number;
  commercialValidation: number;
  technicalValidation: number;
  operationalReadiness: number;
  riskScore: number;   // 0-100
}

export function calculateRiskAdjustedReadiness(i: RiskAdjustedInput): number {
  const base =
    clamp(i.evidenceConfidence) * 0.4 +
    clamp(i.marketValidation) * 0.2 +
    clamp(i.commercialValidation) * 0.2 +
    clamp(i.technicalValidation) * 0.1 +
    clamp(i.operationalReadiness) * 0.1;
  const level = riskLevelFromScore(i.riskScore);
  const penalty = level === "critical" ? 30 : level === "high" ? 20 : level === "medium" ? 10 : 0;
  return clamp(Math.round(base - penalty));
}

// ─── 5. Lean Decision Recommendation ──────────────────────────────────────────
export interface LeanDecisionInput {
  evidenceConfidence: number;      // 0-100
  riskScore: number;               // 0-100
  wtpScore?: number;               // 0-100 (commercial validation proxy)
  hasInvalidatedHypothesis?: boolean;
}

export interface LeanDecisionResult {
  recommendation: (typeof DECISION_RECOMMENDATIONS)[number];
  /** Decision Board column key. */
  column: "evidence_needed" | "continue_testing" | "pivot_recommended" | "pause_recommended" | "kill_recommended" | "ready_to_advance";
  label: string;
  rationale: string;
  tone: Tone;
}

/**
 * Lean Decision Board recommendation per §5. Most-severe rules first.
 */
export function generateLeanDecisionRecommendation(i: LeanDecisionInput): LeanDecisionResult {
  const ec = clamp(i.evidenceConfidence);
  const risk = clamp(i.riskScore);
  const wtp = i.wtpScore == null ? null : clamp(i.wtpScore);

  if (i.hasInvalidatedHypothesis) {
    return {
      recommendation: "pivot", column: "pivot_recommended", label: "Pivot recommended", tone: "red",
      rationale: "A core hypothesis has been invalidated — change a key assumption before investing further.",
    };
  }
  if (ec < 30 && risk > 75) {
    return {
      recommendation: "kill", column: "kill_recommended", label: "Kill or major pivot", tone: "red",
      rationale: "Very weak evidence combined with critical risk. Kill or pursue a major pivot.",
    };
  }
  if (ec < 40) {
    return {
      recommendation: "run_more_experiments", column: "evidence_needed", label: "Evidence needed", tone: "amber",
      rationale: "Evidence confidence is below 40 — gather decisive evidence before any progression call.",
    };
  }
  if (ec >= 40 && ec < 60) {
    return {
      recommendation: "run_more_experiments", column: "continue_testing", label: "Continue testing", tone: "blue",
      rationale: "Evidence is forming (40–59). Continue testing the riskiest assumptions.",
    };
  }
  // ec >= 60 below
  if (risk > 75) {
    return {
      recommendation: "pause", column: "pause_recommended", label: "Pause until risk mitigated", tone: "amber",
      rationale: "Evidence is solid but risk is critical (>75). Pause until the risk is mitigated.",
    };
  }
  if (wtp != null && wtp < 40) {
    return {
      recommendation: "pivot", column: "pivot_recommended", label: "Pivot value prop / pricing", tone: "red",
      rationale: "Evidence is solid but willingness-to-pay is weak (<40). Pivot the value proposition or pricing.",
    };
  }
  if (ec > 75 && risk < 50) {
    return {
      recommendation: "advance_stage", column: "ready_to_advance", label: "Ready to advance", tone: "green",
      rationale: "Strong evidence (>75) and contained risk (<50). Ready for a stage-gate review.",
    };
  }
  return {
    recommendation: "persevere", column: "continue_testing", label: "Persevere", tone: "blue",
    rationale: "Evidence supports persevering — run the next validation experiment.",
  };
}

/** Risk-Adjusted readiness → recommendation per §13. */
export function recommendationFromReadiness(readiness: number): { recommendation: (typeof DECISION_RECOMMENDATIONS)[number]; text: string } {
  if (readiness >= 80) return { recommendation: "advance_stage", text: "Advance to the next validation stage." };
  if (readiness >= 60) return { recommendation: "persevere", text: "Persevere and run the next validation experiment." };
  if (readiness >= 40) return { recommendation: "run_more_experiments", text: "Run more experiments to strengthen the evidence base." };
  if (readiness >= 20) return { recommendation: "pivot", text: "Pivot or pause — current trajectory is weak." };
  return { recommendation: "kill", text: "Kill or pursue a major pivot — readiness is critically low." };
}

// ─── 6. Next Best Action ──────────────────────────────────────────────────────
export interface NextBestActionInput {
  evidenceConfidence: number;
  riskScore: number;
  wtpScore?: number;
  hasInterviewEvidence: boolean;
  hasWtpEvidence: boolean;
  hasActiveExperiment: boolean;
  overdueExperiments: number;
  stage?: string | null;
}

export function generateNextBestAction(i: NextBestActionInput): string {
  if (i.overdueExperiments > 0) return `Resolve ${i.overdueExperiments} overdue experiment${i.overdueExperiments > 1 ? "s" : ""} — review owner and update status.`;
  if (!i.hasInterviewEvidence) return "Run customer discovery interviews — there is no qualitative evidence yet.";
  if (!i.hasActiveExperiment) return "Design and launch the next experiment against the riskiest assumption.";
  if (!i.hasWtpEvidence) return "Test willingness-to-pay — secure a budget or procurement signal.";
  if (i.riskScore >= 75) return "Mitigate the critical risk before progressing the venture.";
  if (i.wtpScore != null && i.wtpScore < 40 && i.evidenceConfidence >= 60) return "Pivot pricing or value proposition — WTP is too weak to advance.";
  if (i.evidenceConfidence > 75 && i.riskScore < 50) return "Request a stage-gate review — the venture is ready to advance.";
  if (i.evidenceConfidence < 40) return "Gather stronger evidence — confidence is below the validation threshold.";
  return "Run the next validation experiment to raise evidence confidence.";
}

// ─── 7. Stage-Gate Readiness + checklist ──────────────────────────────────────
export interface StageGateChecklistItem {
  label: string;
  complete: boolean;
  requiredAction: string;
}

export interface StageGateContext {
  stage: string;                    // current stage
  problemHypotheses: number;
  segmentHypotheses: number;
  riskiestAssumptionDefined: boolean;
  customerDiscoveryScore: number;   // 0-100
  customerInterviews: number;
  workaroundIdentified: boolean;
  competitorMappingComplete: boolean;
  demandSignalScore: number;        // 0-100
  unresolvedCriticalMarketRisk: boolean;
  wtpScore: number;                 // 0-100
  budgetOwnerKnown: boolean;
  pricingHypothesisExists: boolean;
  mvpExperimentCompleted: boolean;
  prototypeResultCaptured: boolean;
  solutionHypothesisUpdated: boolean;
  operationalReadinessAssessed: boolean;
  costToDeliverEstimated: boolean;
  operationalRisksMitigated: boolean;
  gtmEvidenceExists: boolean;
  channelHypothesisExists: boolean;
  commercialModelValidated: boolean;
  criticalRisksMitigated: boolean;
  evidenceSummaryExportable: boolean;
}

/** Returns the checklist items governing progression OUT of the given stage. */
export function generateStageGateChecklist(ctx: StageGateContext): StageGateChecklistItem[] {
  const I = (label: string, complete: boolean, requiredAction: string): StageGateChecklistItem => ({ label, complete, requiredAction });
  switch (ctx.stage) {
    case "intake":
      return [
        I("At least one problem hypothesis", ctx.problemHypotheses >= 1, "Capture a problem hypothesis."),
        I("At least one customer segment hypothesis", ctx.segmentHypotheses >= 1, "Capture a customer segment hypothesis."),
        I("Riskiest assumption defined", ctx.riskiestAssumptionDefined, "Mark a hypothesis as high/critical risk."),
      ];
    case "problem_validation":
      return [
        I("Customer Discovery Score ≥ 60", ctx.customerDiscoveryScore >= 60, "Strengthen discovery evidence to reach 60."),
        I("At least five customer interviews", ctx.customerInterviews >= 5, "Log more customer interviews."),
        I("A current workaround identified", ctx.workaroundIdentified, "Capture how customers solve this today."),
      ];
    case "market_validation":
      return [
        I("Competitor mapping completed", ctx.competitorMappingComplete, "Complete competitor mapping."),
        I("Demand Signal Score ≥ 60", ctx.demandSignalScore >= 60, "Gather stronger demand signals."),
        I("No unresolved critical market risk", !ctx.unresolvedCriticalMarketRisk, "Mitigate or close critical market risks."),
      ];
    case "commercial_validation":
      return [
        I("WTP Score ≥ 60", ctx.wtpScore >= 60, "Run willingness-to-pay experiments."),
        I("Budget owner status known", ctx.budgetOwnerKnown, "Identify and confirm the budget owner."),
        I("Pricing model hypothesis exists", ctx.pricingHypothesisExists, "Define a pricing model hypothesis."),
      ];
    case "mvp_validation":
      return [
        I("MVP experiment completed", ctx.mvpExperimentCompleted, "Complete an MVP / concierge experiment."),
        I("Prototype or concierge MVP result captured", ctx.prototypeResultCaptured, "Capture the prototype result as evidence."),
        I("Solution hypothesis updated with learning", ctx.solutionHypothesisUpdated, "Update the solution hypothesis."),
      ];
    case "delivery_validation":
      return [
        I("Supplier / operational readiness assessed", ctx.operationalReadinessAssessed, "Assess operational readiness."),
        I("Cost-to-deliver estimated", ctx.costToDeliverEstimated, "Estimate the cost-to-deliver."),
        I("Major operational risks have mitigation plans", ctx.operationalRisksMitigated, "Add mitigation plans for operational risks."),
      ];
    case "gtm_validation":
      return [
        I("GTM experiment evidence exists", ctx.gtmEvidenceExists, "Capture GTM experiment evidence."),
        I("Repeatable channel hypothesis exists", ctx.channelHypothesisExists, "Define a repeatable channel hypothesis."),
        I("Commercial model validated", ctx.commercialModelValidated, "Validate the commercial model."),
        I("Critical risks mitigated", ctx.criticalRisksMitigated, "Mitigate remaining critical risks."),
        I("Evidence summary exportable", ctx.evidenceSummaryExportable, "Produce an exportable evidence summary."),
      ];
    default:
      return [];
  }
}

export function calculateStageGateReadiness(ctx: StageGateContext): number {
  const items = generateStageGateChecklist(ctx);
  if (!items.length) return 100;
  const done = items.filter((i) => i.complete).length;
  return Math.round((done / items.length) * 100);
}

// ─── 8. Missing-evidence warnings ─────────────────────────────────────────────
export interface MissingEvidenceInput {
  hasInterviewEvidence: boolean;
  hasWtpEvidence: boolean;
  hasActiveExperiment: boolean;
  hasMarketEvidence: boolean;
  hasCommercialEvidence: boolean;
  status?: string | null;
}

export function generateMissingEvidenceWarnings(i: MissingEvidenceInput): string[] {
  const out: string[] = [];
  if (!i.hasInterviewEvidence) out.push("No customer discovery evidence captured.");
  if (!i.hasWtpEvidence) out.push("No willingness-to-pay evidence captured.");
  if (!i.hasActiveExperiment) out.push("No active experiment running.");
  if (i.status === "building" && !i.hasMarketEvidence) out.push("Marked as building but market evidence is weak.");
  if (i.status === "piloting" && !i.hasCommercialEvidence) out.push("Marked as piloting but has no commercial validation evidence.");
  return out;
}

// ─── 9. Auto-alert generation ─────────────────────────────────────────────────
export interface GeneratedAlert {
  dedupeKey: string;
  alertType: (typeof ALERT_TYPES)[number];
  alertTitle: string;
  alertDescription: string;
  severity: (typeof ALERT_SEVERITIES)[number];
  linkedModule: string;
  recommendedAction: string;
}

export interface VentureAlertContext {
  ventureId: string;
  ventureName: string;
  status?: string | null;
  stage?: string | null;
  evidenceConfidence: number;
  riskScore: number;
  wtpScore: number;
  hasInterviewEvidence: boolean;
  hasWtpEvidence: boolean;
  hasActiveExperiment: boolean;
  hasInvalidatedHypothesis: boolean;
  hasPivotDecision: boolean;
  overdueExperiments: Array<{ id: number; experimentName: string }>;
  blockedExperiments: Array<{ id: number; experimentName: string }>;
  stageGateReady: boolean;
}

const POST_MVP = new Set(["mvp_validation", "delivery_validation", "gtm_validation", "investment_ready"]);

/**
 * Generate the set of alerts a venture should currently have. The server
 * upserts these by dedupeKey so re-running is idempotent.
 */
export function generateCommandAlerts(c: VentureAlertContext): GeneratedAlert[] {
  const alerts: GeneratedAlert[] = [];
  const push = (a: GeneratedAlert) => alerts.push(a);

  // Critical: WTP weak but in MVP validation or later
  if (c.wtpScore < 40 && POST_MVP.has(c.stage ?? "")) {
    push({
      dedupeKey: `low_wtp_late:${c.ventureId}`, alertType: "low_wtp",
      alertTitle: "Weak WTP at MVP+ stage", severity: "critical", linkedModule: "command_centre",
      alertDescription: `${c.ventureName} is in ${STAGE_LABELS[c.stage ?? ""] ?? c.stage} but willingness-to-pay is below 40.`,
      recommendedAction: "Re-test pricing / value proposition before progressing further.",
    });
  }
  // Critical: no active experiment but validating
  if (!c.hasActiveExperiment && c.status === "validating") {
    push({
      dedupeKey: `no_experiment_validating:${c.ventureId}`, alertType: "weak_evidence",
      alertTitle: "Validating with no active experiment", severity: "critical", linkedModule: "command_centre",
      alertDescription: `${c.ventureName} is in validating status but has no active experiment.`,
      recommendedAction: "Design and launch an experiment against the riskiest assumption.",
    });
  }
  // Critical: invalidated hypothesis with no pivot decision
  if (c.hasInvalidatedHypothesis && !c.hasPivotDecision) {
    push({
      dedupeKey: `invalidated_no_pivot:${c.ventureId}`, alertType: "pivot_recommended",
      alertTitle: "Invalidated hypothesis, no pivot logged", severity: "critical", linkedModule: "command_centre",
      alertDescription: `${c.ventureName} has an invalidated core hypothesis but no pivot decision.`,
      recommendedAction: "Create a pivot decision and log the pivot rationale.",
    });
  }
  // High: overdue experiments
  for (const ex of c.overdueExperiments) {
    push({
      dedupeKey: `overdue_experiment:${ex.id}`, alertType: "overdue_experiment",
      alertTitle: `Overdue experiment: ${ex.experimentName}`, severity: "high", linkedModule: "command_centre",
      alertDescription: `${c.ventureName}'s experiment "${ex.experimentName}" is past its due date and not completed.`,
      recommendedAction: "Review experiment owner and update status.",
    });
  }
  // Medium: blocked experiments
  for (const ex of c.blockedExperiments) {
    push({
      dedupeKey: `blocked_experiment:${ex.id}`, alertType: "approval_required",
      alertTitle: `Blocked experiment: ${ex.experimentName}`, severity: "medium", linkedModule: "command_centre",
      alertDescription: `${c.ventureName}'s experiment "${ex.experimentName}" is blocked and needs unblocking.`,
      recommendedAction: "Resolve the blocker or escalate for approval.",
    });
  }
  // High: weak evidence
  if (c.evidenceConfidence < 40) {
    push({
      dedupeKey: `weak_evidence:${c.ventureId}`, alertType: "weak_evidence",
      alertTitle: "Evidence confidence below 40", severity: "high", linkedModule: "command_centre",
      alertDescription: `${c.ventureName} has an evidence confidence score of ${c.evidenceConfidence}.`,
      recommendedAction: "Gather decisive evidence before progressing.",
    });
  }
  // High: no customer interviews
  if (!c.hasInterviewEvidence) {
    push({
      dedupeKey: `no_interviews:${c.ventureId}`, alertType: "weak_evidence",
      alertTitle: "No customer interviews", severity: "high", linkedModule: "discovery_market",
      alertDescription: `${c.ventureName} has no customer discovery evidence.`,
      recommendedAction: "Run customer discovery interviews.",
    });
  }
  // High: no WTP test
  if (!c.hasWtpEvidence) {
    push({
      dedupeKey: `no_wtp:${c.ventureId}`, alertType: "low_wtp",
      alertTitle: "No WTP evidence", severity: "high", linkedModule: "discovery_market",
      alertDescription: `${c.ventureName} has no willingness-to-pay evidence.`,
      recommendedAction: "Run a willingness-to-pay experiment.",
    });
  }
  // High: high market risk
  if (c.riskScore >= 75) {
    push({
      dedupeKey: `high_risk:${c.ventureId}`, alertType: "high_market_risk",
      alertTitle: "Critical risk exposure", severity: "high", linkedModule: "market_risk_log",
      alertDescription: `${c.ventureName} has a risk score of ${c.riskScore}.`,
      recommendedAction: "Mitigate the critical risk before progressing.",
    });
  }
  // Medium: stage-gate ready
  if (c.stageGateReady) {
    push({
      dedupeKey: `stage_gate_ready:${c.ventureId}:${c.stage}`, alertType: "stage_gate_required",
      alertTitle: "Ready for stage-gate review", severity: "medium", linkedModule: "command_centre",
      alertDescription: `${c.ventureName} meets the criteria to progress from ${STAGE_LABELS[c.stage ?? ""] ?? c.stage}.`,
      recommendedAction: "Review venture for progression.",
    });
  }
  return alerts;
}
