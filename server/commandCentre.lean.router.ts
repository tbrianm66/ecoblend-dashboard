/**
 * Module 1 — Command Centre (Lean Startup decision cockpit)
 * CRUD for hypotheses / experiments / evidence / decisions / pivot logs /
 * stage-gate reviews / alerts, plus aggregate decision queries and
 * idempotent auto-alert generation. Pure scoring lives in shared/commandCentre.
 */
import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { and, eq, desc, inArray } from "drizzle-orm";
import {
  ventures,
  ccHypotheses,
  ccExperiments,
  ccEvidence,
  ccDecisions,
  ccPivotLogs,
  ccStageGateReviews,
  ccAlerts,
  customerInterviews,
  dmCompetitors,
  demandSignals,
  wtpTests,
  marketRisks,
} from "../drizzle/schema";
import {
  calculateEvidenceConfidenceScore,
  calculateVentureEvidenceConfidence,
  calculatePortfolioHealthScore,
  calculateRiskAdjustedReadiness,
  calculateStageGateReadiness,
  generateLeanDecisionRecommendation,
  generateNextBestAction,
  generateCommandAlerts,
  generateStageGateChecklist,
  generateMissingEvidenceWarnings,
  recommendationFromReadiness,
  supportingRatio,
  avg,
  nextStage,
  clamp,
  HYPOTHESIS_TYPES,
  HYPOTHESIS_STATUSES,
  ASSUMPTION_RISK_LEVELS,
  EXPERIMENT_TYPES,
  EXPERIMENT_STATUSES,
  EVIDENCE_TYPES,
  DECISION_TYPES,
  DECISION_STATUSES,
  DECISION_RECOMMENDATIONS,
  PIVOT_TYPES,
  REVIEW_STATUSES,
  APPROVAL_DECISIONS,
  ALERT_TYPES,
  ALERT_SEVERITIES,
  ALERT_STATUSES,
  MODULE_SOURCES,
  VENTURE_STAGES,
  VENTURE_STATUSES,
  type StageGateContext,
  type VentureAlertContext,
} from "@shared/commandCentre";

function db() {
  return getDb().then((d) => {
    if (!d) throw new Error("DB unavailable");
    return d;
  });
}

type Db = Awaited<ReturnType<typeof db>>;

const ventureInput = z.object({ ventureId: z.string() });
const idInput = z.object({ id: z.number() });

// ─── Aggregate building blocks ────────────────────────────────────────────────
const PASS_RESULT = /pass|success|validated|positive|confirm/i;

interface VentureBundle {
  venture: typeof ventures.$inferSelect;
  hypotheses: (typeof ccHypotheses.$inferSelect)[];
  experiments: (typeof ccExperiments.$inferSelect)[];
  evidence: (typeof ccEvidence.$inferSelect)[];
  decisions: (typeof ccDecisions.$inferSelect)[];
  reviews: (typeof ccStageGateReviews.$inferSelect)[];
  // discovery cross-module rollups
  interviews: (typeof customerInterviews.$inferSelect)[];
  competitors: (typeof dmCompetitors.$inferSelect)[];
  signals: (typeof demandSignals.$inferSelect)[];
  wtps: (typeof wtpTests.$inferSelect)[];
  risks: (typeof marketRisks.$inferSelect)[];
}

function isOverdue(ex: typeof ccExperiments.$inferSelect): boolean {
  if (!ex.dueDate) return false;
  if (ex.experimentStatus === "completed" || ex.experimentStatus === "cancelled") return false;
  const due = new Date(ex.dueDate);
  if (isNaN(due.getTime())) return false;
  return due.getTime() < Date.now();
}

/** Derive the full set of computed scores + signals for a venture. */
function deriveVentureMetrics(b: VentureBundle) {
  const { venture, hypotheses, experiments, evidence, decisions, interviews, competitors, signals, wtps, risks } = b;
  const stage = venture.currentStage ?? "intake";
  const status = venture.validationStatus ?? null;

  // Risk score (0-100): blend open market risk load + critical hypothesis risk.
  const openRisks = risks.filter((r) => r.status !== "closed" && r.status !== "mitigated");
  const marketRiskLoad = openRisks.length
    ? clamp(Math.round(avg(openRisks.map((r) => ((r.marketRiskScore ?? 0) / 125) * 100))))
    : 0;
  const criticalAssumptionRisk = hypotheses.some((h) => h.assumptionRiskLevel === "critical" && h.status !== "validated") ? 80 : 0;
  const riskScore = clamp(Math.max(marketRiskLoad, criticalAssumptionRisk));

  // Evidence confidence (venture-level, with penalties).
  const evidenceConfidence = calculateVentureEvidenceConfidence({
    evidence: evidence.map((e) => ({
      evidenceType: e.evidenceType,
      evidenceConfidenceScore: e.evidenceConfidenceScore,
      contradictsHypothesis: e.contradictsHypothesis,
    })),
    stage,
    riskScore,
  });

  // Cross-module validation scores (0-100), drawn from Discovery & Market.
  const marketValidation = avg([
    ...interviews.map((r) => r.discoveryScore ?? 0),
    ...signals.map((r) => r.demandSignalScore ?? 0),
  ]);
  const wtpScore = avg(wtps.map((r) => r.wtpScore ?? 0));
  const commercialValidation = wtpScore;
  const techEvidence = evidence.filter((e) =>
    ["prototype_result", "pilot_result", "manufacturing_result", "supplier_result"].includes(e.evidenceType ?? ""));
  const technicalValidation = techEvidence.length ? avg(techEvidence.map((e) => e.evidenceConfidenceScore ?? 0)) : 0;
  const opsEvidence = evidence.filter((e) =>
    ["supplier_result", "manufacturing_result", "gtm_result"].includes(e.evidenceType ?? ""));
  const operationalReadiness = opsEvidence.length ? avg(opsEvidence.map((e) => e.evidenceConfidenceScore ?? 0)) : 0;

  const portfolioHealth = calculatePortfolioHealthScore({
    evidenceConfidence, marketValidation, commercialValidation, technicalValidation, operationalReadiness, riskScore,
  });
  const riskAdjustedReadiness = calculateRiskAdjustedReadiness({
    evidenceConfidence, marketValidation, commercialValidation, technicalValidation, operationalReadiness, riskScore,
  });

  const hasInvalidatedHypothesis = hypotheses.some((h) => h.status === "invalidated" || h.status === "pivot_required");
  const hasInterviewEvidence = evidence.some((e) => ["interview", "survey"].includes(e.evidenceType ?? "")) || interviews.length > 0;
  const hasWtpEvidence = evidence.some((e) => ["customer_commitment", "budget_signal", "procurement_signal"].includes(e.evidenceType ?? "")) || wtps.length > 0;
  const hasActiveExperiment = experiments.some((e) => ["approved", "running"].includes(e.experimentStatus ?? ""));
  const hasPivotDecision = decisions.some((d) => d.decisionType === "pivot");
  const overdueExperiments = experiments.filter(isOverdue);
  const blockedExperiments = experiments.filter((e) => e.experimentStatus === "blocked");

  const decision = generateLeanDecisionRecommendation({
    evidenceConfidence, riskScore, wtpScore, hasInvalidatedHypothesis,
  });

  const missingEvidence = generateMissingEvidenceWarnings({
    hasInterviewEvidence, hasWtpEvidence, hasActiveExperiment,
    hasMarketEvidence: marketValidation >= 40, hasCommercialEvidence: commercialValidation >= 40, status,
  });

  // Stage-gate readiness for current stage. A venture cannot appear ready to
  // progress while it still has unresolved missing-evidence warnings (per spec).
  const ctx = buildStageGateContext(b, { customerDiscoveryScore: avg(interviews.map((r) => r.discoveryScore ?? 0)), demandSignalScore: avg(signals.map((r) => r.demandSignalScore ?? 0)), wtpScore, evidenceConfidence });
  const stageGateChecklist = generateStageGateChecklist(ctx);
  const stageGateReadiness = calculateStageGateReadiness(ctx);
  const stageGateReady = stageGateChecklist.length > 0 && stageGateChecklist.every((i) => i.complete) && !!nextStage(stage) && missingEvidence.length === 0;

  const nextBestAction = generateNextBestAction({
    evidenceConfidence, riskScore, wtpScore, hasInterviewEvidence, hasWtpEvidence,
    hasActiveExperiment, overdueExperiments: overdueExperiments.length, stage,
  });

  const passRate = (() => {
    const completed = experiments.filter((e) => e.experimentStatus === "completed");
    if (!completed.length) return null;
    const passed = completed.filter((e) => PASS_RESULT.test(`${e.result ?? ""} ${e.decisionRecommendation ?? ""}`)).length;
    return Math.round((passed / completed.length) * 100);
  })();

  return {
    stage, status, riskScore, evidenceConfidence, marketValidation, commercialValidation,
    technicalValidation, operationalReadiness, wtpScore, portfolioHealth, riskAdjustedReadiness,
    decision, nextBestAction, missingEvidence, stageGateChecklist, stageGateReadiness, stageGateReady,
    hasInvalidatedHypothesis, hasInterviewEvidence, hasWtpEvidence, hasActiveExperiment, hasPivotDecision,
    overdueExperiments, blockedExperiments, passRate,
    supportingRatio: supportingRatio(evidence),
    contradictingCount: evidence.filter((e) => e.contradictsHypothesis).length,
    supportingCount: evidence.filter((e) => !e.contradictsHypothesis).length,
  };
}

function buildStageGateContext(
  b: VentureBundle,
  scores: { customerDiscoveryScore: number; demandSignalScore: number; wtpScore: number; evidenceConfidence: number },
): StageGateContext {
  const { venture, hypotheses, experiments, evidence, interviews, competitors, risks, wtps } = b;
  const completedExp = experiments.filter((e) => e.experimentStatus === "completed");
  const hasType = (types: string[]) => evidence.some((e) => types.includes(e.evidenceType ?? ""));
  const criticalOpenRisk = risks.some((r) => (r.marketRiskScore ?? 0) >= 76 && r.status !== "closed" && r.status !== "mitigated");
  return {
    stage: venture.currentStage ?? "intake",
    problemHypotheses: hypotheses.filter((h) => h.hypothesisType === "problem").length,
    segmentHypotheses: hypotheses.filter((h) => h.hypothesisType === "customer_segment").length,
    riskiestAssumptionDefined: hypotheses.some((h) => h.assumptionRiskLevel === "high" || h.assumptionRiskLevel === "critical"),
    customerDiscoveryScore: scores.customerDiscoveryScore,
    customerInterviews: interviews.length,
    workaroundIdentified: interviews.some((i) => !!i.currentWorkaround?.trim()),
    competitorMappingComplete: competitors.length >= 2,
    demandSignalScore: scores.demandSignalScore,
    unresolvedCriticalMarketRisk: criticalOpenRisk,
    wtpScore: scores.wtpScore,
    budgetOwnerKnown: wtps.some((w) => w.budgetOwnerConfirmed) || evidence.some((e) => e.evidenceType === "budget_signal"),
    pricingHypothesisExists: hypotheses.some((h) => h.hypothesisType === "pricing"),
    mvpExperimentCompleted: completedExp.some((e) => ["prototype_test", "concierge_mvp", "paid_pilot"].includes(e.experimentType ?? "")),
    prototypeResultCaptured: hasType(["prototype_result", "pilot_result"]),
    solutionHypothesisUpdated: hypotheses.some((h) => h.hypothesisType === "solution" && (h.status === "validated" || h.status === "testing")),
    operationalReadinessAssessed: hasType(["supplier_result", "manufacturing_result"]),
    costToDeliverEstimated: hasType(["financial_model"]),
    operationalRisksMitigated: !risks.some((r) => r.riskCategory?.includes("operational") && r.status === "open"),
    gtmEvidenceExists: hasType(["gtm_result"]),
    channelHypothesisExists: hypotheses.some((h) => h.hypothesisType === "channel"),
    commercialModelValidated: scores.wtpScore >= 60,
    criticalRisksMitigated: !criticalOpenRisk,
    evidenceSummaryExportable: evidence.length >= 3,
  };
}

async function loadVentureBundle(d: Db, ventureId: string): Promise<VentureBundle | null> {
  try {
    const [venture] = await d.select().from(ventures).where(eq(ventures.id, ventureId));
    if (!venture) {
      console.log(`[loadVentureBundle] venture not found for id="${ventureId}"`);
      return null;
    }
    const [hyp, exp, ev, dec, rev, iv, cp, sg, wt, rk] = await Promise.all([
      d.select().from(ccHypotheses).where(eq(ccHypotheses.ventureId, ventureId)),
      d.select().from(ccExperiments).where(eq(ccExperiments.ventureId, ventureId)),
      d.select().from(ccEvidence).where(eq(ccEvidence.ventureId, ventureId)),
      d.select().from(ccDecisions).where(eq(ccDecisions.ventureId, ventureId)),
      d.select().from(ccStageGateReviews).where(eq(ccStageGateReviews.ventureId, ventureId)),
      d.select().from(customerInterviews).where(eq(customerInterviews.ventureId, ventureId)),
      d.select().from(dmCompetitors).where(eq(dmCompetitors.ventureId, ventureId)),
      d.select().from(demandSignals).where(eq(demandSignals.ventureId, ventureId)),
      d.select().from(wtpTests).where(eq(wtpTests.ventureId, ventureId)),
      d.select().from(marketRisks).where(eq(marketRisks.ventureId, ventureId)),
    ]);
    return { venture, hypotheses: hyp, experiments: exp, evidence: ev, decisions: dec, reviews: rev, interviews: iv, competitors: cp, signals: sg, wtps: wt, risks: rk };
  } catch (err) {
    console.error(`[loadVentureBundle] ERROR for ventureId="${ventureId}":`, err);
    return null;
  }
}

async function loadAllBundles(d: Db): Promise<VentureBundle[]> {
  const vs = await d.select().from(ventures);
  console.log(`[loadAllBundles] raw ventures from DB: ${vs.length}`, vs.map(v => ({ id: v.id, name: v.name, isInternalLab: v.isInternalLab })));
  const portfolio = vs.filter((v) => !v.isInternalLab);
  console.log(`[loadAllBundles] after isInternalLab filter: ${portfolio.length}`);
  const bundles = await Promise.all(portfolio.map((v) => loadVentureBundle(d, v.id)));
  const valid = bundles.filter((b): b is VentureBundle => b !== null);
  console.log(`[loadAllBundles] valid bundles returned: ${valid.length}`);
  return valid;
}

/** Idempotently sync auto-generated alerts for a venture (upsert by dedupeKey). */
async function syncAlerts(d: Db, b: VentureBundle, m: ReturnType<typeof deriveVentureMetrics>) {
  const ctx: VentureAlertContext = {
    ventureId: b.venture.id, ventureName: b.venture.name,
    status: b.venture.validationStatus, stage: b.venture.currentStage,
    evidenceConfidence: m.evidenceConfidence, riskScore: m.riskScore, wtpScore: m.wtpScore,
    hasInterviewEvidence: m.hasInterviewEvidence, hasWtpEvidence: m.hasWtpEvidence,
    hasActiveExperiment: m.hasActiveExperiment, hasInvalidatedHypothesis: m.hasInvalidatedHypothesis,
    hasPivotDecision: m.hasPivotDecision,
    overdueExperiments: m.overdueExperiments.map((e) => ({ id: e.id, experimentName: e.experimentName })),
    blockedExperiments: m.blockedExperiments.map((e) => ({ id: e.id, experimentName: e.experimentName })),
    stageGateReady: m.stageGateReady,
    decisionRecommendation: m.decision.recommendation,
  };
  const wanted = generateCommandAlerts(ctx);
  const existing = await d.select().from(ccAlerts).where(and(eq(ccAlerts.ventureId, b.venture.id), eq(ccAlerts.autoGenerated, true)));
  const existingByKey = new Map(existing.map((a) => [a.dedupeKey ?? "", a]));
  const wantedKeys = new Set(wanted.map((w) => w.dedupeKey));

  for (const w of wanted) {
    const prev = existingByKey.get(w.dedupeKey);
    if (prev) {
      // refresh description/severity but never override user lifecycle status
      await d.update(ccAlerts).set({
        alertTitle: w.alertTitle, alertDescription: w.alertDescription, severity: w.severity,
        recommendedAction: w.recommendedAction, alertType: w.alertType, linkedModule: w.linkedModule, updatedAt: new Date(),
      }).where(eq(ccAlerts.id, prev.id));
    } else {
      await d.insert(ccAlerts).values({
        ventureId: b.venture.id, alertType: w.alertType, alertTitle: w.alertTitle,
        alertDescription: w.alertDescription, severity: w.severity, linkedModule: w.linkedModule,
        recommendedAction: w.recommendedAction, status: "open", autoGenerated: true, dedupeKey: w.dedupeKey,
      });
    }
  }
  // Auto-resolve stale auto-alerts that are no longer applicable (and not already user-touched).
  const stale = existing.filter((a) => !wantedKeys.has(a.dedupeKey ?? "") && (a.status === "open"));
  if (stale.length) {
    await d.update(ccAlerts).set({ status: "resolved", updatedAt: new Date() })
      .where(inArray(ccAlerts.id, stale.map((a) => a.id)));
  }
}

/** Recompute + sync auto-alerts for a single venture (called after mutations). */
async function resyncVentureAlerts(d: Db, ventureId: string) {
  const b = await loadVentureBundle(d, ventureId);
  if (b) await syncAlerts(d, b, deriveVentureMetrics(b));
}

/**
 * Auto-pivot prompt: when a `pivot` decision is approved/implemented, ensure a
 * pivot-log entry exists for it (idempotent on decisionId).
 */
async function autoPivotFromDecision(d: Db, decisionId: number) {
  const [dec] = await d.select().from(ccDecisions).where(eq(ccDecisions.id, decisionId));
  if (!dec || dec.decisionType !== "pivot") return;
  if (dec.decisionStatus !== "approved" && dec.decisionStatus !== "implemented") return;
  const existing = await d.select().from(ccPivotLogs)
    .where(and(eq(ccPivotLogs.ventureId, dec.ventureId), eq(ccPivotLogs.decisionId, decisionId)));
  if (existing.length) return;
  await d.insert(ccPivotLogs).values({
    ventureId: dec.ventureId,
    decisionId,
    pivotType: "business_model",
    reasonForPivot: dec.decisionSummary ?? dec.decisionTitle,
    evidenceTrigger: `Approved pivot decision: ${dec.decisionTitle}`,
    dateLogged: new Date().toISOString().slice(0, 10),
  });
}

/**
 * Auto-pivot prompt: when a hypothesis is invalidated / flagged pivot_required,
 * ensure a pivot-log entry exists for it (idempotent on hypothesisId).
 */
async function autoPivotFromHypothesis(d: Db, hypothesisId: number) {
  const [h] = await d.select().from(ccHypotheses).where(eq(ccHypotheses.id, hypothesisId));
  if (!h || (h.status !== "invalidated" && h.status !== "pivot_required")) return;
  const existing = await d.select().from(ccPivotLogs)
    .where(and(eq(ccPivotLogs.ventureId, h.ventureId), eq(ccPivotLogs.hypothesisId, hypothesisId)));
  if (existing.length) return;
  const pivotType = (PIVOT_TYPES as readonly string[]).includes(h.hypothesisType ?? "")
    ? (h.hypothesisType as (typeof PIVOT_TYPES)[number]) : "problem";
  await d.insert(ccPivotLogs).values({
    ventureId: h.ventureId,
    hypothesisId,
    pivotType,
    previousHypothesis: h.hypothesisStatement,
    reasonForPivot: h.status === "invalidated" ? "Hypothesis invalidated by evidence" : "Hypothesis flagged for pivot",
    evidenceTrigger: h.evidenceSummary ?? null,
    dateLogged: new Date().toISOString().slice(0, 10),
  });
}

// ─── CRUD helper builders ─────────────────────────────────────────────────────
const hypothesisFields = {
  ventureId: z.string(),
  moduleSource: z.enum(MODULE_SOURCES).nullable().optional(),
  hypothesisType: z.enum(HYPOTHESIS_TYPES).optional(),
  hypothesisStatement: z.string().min(1),
  assumptionRiskLevel: z.enum(ASSUMPTION_RISK_LEVELS).optional(),
  status: z.enum(HYPOTHESIS_STATUSES).optional(),
  confidenceScore: z.number().optional(),
  evidenceSummary: z.string().nullable().optional(),
};

const experimentFields = {
  ventureId: z.string(),
  hypothesisId: z.number().nullable().optional(),
  experimentName: z.string().min(1),
  experimentType: z.enum(EXPERIMENT_TYPES).optional(),
  moduleSource: z.enum(MODULE_SOURCES).nullable().optional(),
  experimentOwner: z.string().nullable().optional(),
  experimentStatus: z.enum(EXPERIMENT_STATUSES).optional(),
  method: z.string().nullable().optional(),
  successThreshold: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  result: z.string().nullable().optional(),
  learningSummary: z.string().nullable().optional(),
  decisionRecommendation: z.enum(DECISION_RECOMMENDATIONS).nullable().optional(),
  nextStep: z.string().nullable().optional(),
};

const evidenceFields = {
  ventureId: z.string(),
  hypothesisId: z.number().nullable().optional(),
  experimentId: z.number().nullable().optional(),
  moduleSource: z.enum(MODULE_SOURCES).nullable().optional(),
  evidenceType: z.enum(EVIDENCE_TYPES).optional(),
  evidenceTitle: z.string().min(1),
  evidenceSummary: z.string().nullable().optional(),
  evidenceStrengthScore: z.number().min(1).max(5).optional(),
  evidenceRelevanceScore: z.number().min(1).max(5).optional(),
  evidenceRecencyScore: z.number().min(1).max(5).optional(),
  contradictsHypothesis: z.boolean().optional(),
  sourceReference: z.string().nullable().optional(),
};

const decisionFields = {
  ventureId: z.string(),
  decisionType: z.enum(DECISION_TYPES).optional(),
  decisionTitle: z.string().min(1),
  decisionSummary: z.string().nullable().optional(),
  evidenceConfidenceScore: z.number().optional(),
  riskScore: z.number().optional(),
  recommendedAction: z.string().nullable().optional(),
  decisionStatus: z.enum(DECISION_STATUSES).optional(),
  reviewerNotes: z.string().nullable().optional(),
  approvedBy: z.string().nullable().optional(),
  decisionDate: z.string().nullable().optional(),
  nextReviewDate: z.string().nullable().optional(),
};

const pivotFields = {
  ventureId: z.string(),
  previousHypothesis: z.string().nullable().optional(),
  newHypothesis: z.string().nullable().optional(),
  pivotType: z.enum(PIVOT_TYPES).optional(),
  reasonForPivot: z.string().nullable().optional(),
  evidenceTrigger: z.string().nullable().optional(),
  decisionId: z.number().nullable().optional(),
  hypothesisId: z.number().nullable().optional(),
  dateLogged: z.string().nullable().optional(),
};

const reviewFields = {
  ventureId: z.string(),
  fromStage: z.enum(VENTURE_STAGES).nullable().optional(),
  toStage: z.enum(VENTURE_STAGES).nullable().optional(),
  reviewStatus: z.enum(REVIEW_STATUSES).optional(),
  evidenceScore: z.number().optional(),
  marketScore: z.number().optional(),
  commercialScore: z.number().optional(),
  technicalScore: z.number().optional(),
  operationalScore: z.number().optional(),
  riskScore: z.number().optional(),
  investmentReadinessScore: z.number().optional(),
  reviewerNotes: z.string().nullable().optional(),
  approvalDecision: z.enum(APPROVAL_DECISIONS).nullable().optional(),
  requiredActions: z.string().nullable().optional(),
  reviewDate: z.string().nullable().optional(),
  nextReviewDate: z.string().nullable().optional(),
};

const alertFields = {
  ventureId: z.string(),
  alertType: z.enum(ALERT_TYPES).optional(),
  alertTitle: z.string().min(1),
  alertDescription: z.string().nullable().optional(),
  severity: z.enum(ALERT_SEVERITIES).optional(),
  linkedModule: z.enum(MODULE_SOURCES).nullable().optional(),
  linkedRecordId: z.number().nullable().optional(),
  recommendedAction: z.string().nullable().optional(),
  status: z.enum(ALERT_STATUSES).optional(),
  owner: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
};

export const commandCentreLeanRouter = router({
  // ── Hypotheses ──────────────────────────────────────────────────────────────
  hypotheses: router({
    list: publicProcedure.input(ventureInput).query(async ({ input }) => {
      const d = await db();
      return d.select().from(ccHypotheses).where(eq(ccHypotheses.ventureId, input.ventureId)).orderBy(desc(ccHypotheses.updatedAt));
    }),
    upsert: publicProcedure.input(z.object({ id: z.number().optional(), ...hypothesisFields })).mutation(async ({ input }) => {
      const d = await db();
      const { id, ...vals } = input;
      let hid = id;
      if (id) {
        await d.update(ccHypotheses).set({ ...vals, updatedAt: new Date() }).where(eq(ccHypotheses.id, id));
      } else {
        const [row] = await d.insert(ccHypotheses).values(vals).returning();
        hid = row.id;
      }
      if (hid) await autoPivotFromHypothesis(d, hid);
      await resyncVentureAlerts(d, vals.ventureId);
      return { id: hid };
    }),
    delete: publicProcedure.input(idInput).mutation(async ({ input }) => {
      const d = await db();
      const [row] = await d.select().from(ccHypotheses).where(eq(ccHypotheses.id, input.id));
      await d.delete(ccHypotheses).where(eq(ccHypotheses.id, input.id));
      if (row) await resyncVentureAlerts(d, row.ventureId);
      return { success: true };
    }),
  }),

  // ── Experiments ─────────────────────────────────────────────────────────────
  experiments: router({
    list: publicProcedure.input(ventureInput).query(async ({ input }) => {
      const d = await db();
      return d.select().from(ccExperiments).where(eq(ccExperiments.ventureId, input.ventureId)).orderBy(desc(ccExperiments.updatedAt));
    }),
    upsert: publicProcedure.input(z.object({ id: z.number().optional(), ...experimentFields })).mutation(async ({ input }) => {
      const d = await db();
      const { id, ...vals } = input;
      let eid = id;
      if (id) {
        await d.update(ccExperiments).set({ ...vals, updatedAt: new Date() }).where(eq(ccExperiments.id, id));
      } else {
        const [row] = await d.insert(ccExperiments).values(vals).returning();
        eid = row.id;
      }
      await resyncVentureAlerts(d, vals.ventureId);
      return { id: eid };
    }),
    setStatus: publicProcedure.input(z.object({ id: z.number(), experimentStatus: z.enum(EXPERIMENT_STATUSES) })).mutation(async ({ input }) => {
      const d = await db();
      await d.update(ccExperiments).set({ experimentStatus: input.experimentStatus, updatedAt: new Date() }).where(eq(ccExperiments.id, input.id));
      const [row] = await d.select().from(ccExperiments).where(eq(ccExperiments.id, input.id));
      if (row) await resyncVentureAlerts(d, row.ventureId);
      return { success: true };
    }),
    delete: publicProcedure.input(idInput).mutation(async ({ input }) => {
      const d = await db();
      const [row] = await d.select().from(ccExperiments).where(eq(ccExperiments.id, input.id));
      await d.delete(ccExperiments).where(eq(ccExperiments.id, input.id));
      if (row) await resyncVentureAlerts(d, row.ventureId);
      return { success: true };
    }),
  }),

  // ── Evidence ────────────────────────────────────────────────────────────────
  evidence: router({
    list: publicProcedure.input(ventureInput).query(async ({ input }) => {
      const d = await db();
      return d.select().from(ccEvidence).where(eq(ccEvidence.ventureId, input.ventureId)).orderBy(desc(ccEvidence.updatedAt));
    }),
    upsert: publicProcedure.input(z.object({ id: z.number().optional(), ...evidenceFields })).mutation(async ({ input }) => {
      const d = await db();
      const { id, ...vals } = input;
      const evidenceConfidenceScore = calculateEvidenceConfidenceScore({
        evidenceStrengthScore: vals.evidenceStrengthScore ?? 1,
        evidenceRelevanceScore: vals.evidenceRelevanceScore ?? 1,
        evidenceRecencyScore: vals.evidenceRecencyScore ?? 1,
      });
      let evid = id;
      if (id) {
        await d.update(ccEvidence).set({ ...vals, evidenceConfidenceScore, updatedAt: new Date() }).where(eq(ccEvidence.id, id));
      } else {
        const [row] = await d.insert(ccEvidence).values({ ...vals, evidenceConfidenceScore }).returning();
        evid = row.id;
      }
      await resyncVentureAlerts(d, vals.ventureId);
      return { id: evid, evidenceConfidenceScore };
    }),
    delete: publicProcedure.input(idInput).mutation(async ({ input }) => {
      const d = await db();
      const [row] = await d.select().from(ccEvidence).where(eq(ccEvidence.id, input.id));
      await d.delete(ccEvidence).where(eq(ccEvidence.id, input.id));
      if (row) await resyncVentureAlerts(d, row.ventureId);
      return { success: true };
    }),
  }),

  // ── Decisions ───────────────────────────────────────────────────────────────
  decisions: router({
    list: publicProcedure.input(ventureInput).query(async ({ input }) => {
      const d = await db();
      return d.select().from(ccDecisions).where(eq(ccDecisions.ventureId, input.ventureId)).orderBy(desc(ccDecisions.updatedAt));
    }),
    upsert: publicProcedure.input(z.object({ id: z.number().optional(), ...decisionFields })).mutation(async ({ input }) => {
      const d = await db();
      const { id, ...vals } = input;
      let did = id;
      if (id) {
        await d.update(ccDecisions).set({ ...vals, updatedAt: new Date() }).where(eq(ccDecisions.id, id));
      } else {
        const [row] = await d.insert(ccDecisions).values(vals).returning();
        did = row.id;
      }
      if (did) await autoPivotFromDecision(d, did);
      await resyncVentureAlerts(d, vals.ventureId);
      return { id: did };
    }),
    setStatus: publicProcedure.input(z.object({ id: z.number(), decisionStatus: z.enum(DECISION_STATUSES), reviewerNotes: z.string().nullable().optional(), approvedBy: z.string().nullable().optional() })).mutation(async ({ input }) => {
      const d = await db();
      const { id, ...vals } = input;
      await d.update(ccDecisions).set({ ...vals, updatedAt: new Date() }).where(eq(ccDecisions.id, id));
      await autoPivotFromDecision(d, id);
      const [row] = await d.select().from(ccDecisions).where(eq(ccDecisions.id, id));
      if (row) await resyncVentureAlerts(d, row.ventureId);
      return { success: true };
    }),
    delete: publicProcedure.input(idInput).mutation(async ({ input }) => {
      const d = await db();
      const [row] = await d.select().from(ccDecisions).where(eq(ccDecisions.id, input.id));
      await d.delete(ccDecisions).where(eq(ccDecisions.id, input.id));
      if (row) await resyncVentureAlerts(d, row.ventureId);
      return { success: true };
    }),
  }),

  // ── Pivot logs ──────────────────────────────────────────────────────────────
  pivots: router({
    list: publicProcedure.input(ventureInput).query(async ({ input }) => {
      const d = await db();
      return d.select().from(ccPivotLogs).where(eq(ccPivotLogs.ventureId, input.ventureId)).orderBy(desc(ccPivotLogs.createdAt));
    }),
    upsert: publicProcedure.input(z.object({ id: z.number().optional(), ...pivotFields })).mutation(async ({ input }) => {
      const d = await db();
      const { id, ...vals } = input;
      if (id) {
        await d.update(ccPivotLogs).set({ ...vals, updatedAt: new Date() }).where(eq(ccPivotLogs.id, id));
        return { id };
      }
      const [row] = await d.insert(ccPivotLogs).values({ ...vals, dateLogged: vals.dateLogged ?? new Date().toISOString().slice(0, 10) }).returning();
      return { id: row.id };
    }),
    delete: publicProcedure.input(idInput).mutation(async ({ input }) => {
      const d = await db();
      await d.delete(ccPivotLogs).where(eq(ccPivotLogs.id, input.id));
      return { success: true };
    }),
  }),

  // ── Stage-gate reviews ──────────────────────────────────────────────────────
  reviews: router({
    list: publicProcedure.input(ventureInput).query(async ({ input }) => {
      const d = await db();
      return d.select().from(ccStageGateReviews).where(eq(ccStageGateReviews.ventureId, input.ventureId)).orderBy(desc(ccStageGateReviews.updatedAt));
    }),
    upsert: publicProcedure.input(z.object({ id: z.number().optional(), ...reviewFields })).mutation(async ({ input }) => {
      const d = await db();
      const { id, ...vals } = input;
      let rid = id;
      if (id) {
        await d.update(ccStageGateReviews).set({ ...vals, updatedAt: new Date() }).where(eq(ccStageGateReviews.id, id));
      } else {
        const [row] = await d.insert(ccStageGateReviews).values(vals).returning();
        rid = row.id;
      }
      await resyncVentureAlerts(d, vals.ventureId);
      return { id: rid };
    }),
    delete: publicProcedure.input(idInput).mutation(async ({ input }) => {
      const d = await db();
      const [row] = await d.select().from(ccStageGateReviews).where(eq(ccStageGateReviews.id, input.id));
      await d.delete(ccStageGateReviews).where(eq(ccStageGateReviews.id, input.id));
      if (row) await resyncVentureAlerts(d, row.ventureId);
      return { success: true };
    }),
  }),

  // ── Alerts ──────────────────────────────────────────────────────────────────
  alerts: router({
    list: publicProcedure.input(z.object({ ventureId: z.string().optional() }).optional()).query(async ({ input }) => {
      const d = await db();
      const rows = input?.ventureId
        ? await d.select().from(ccAlerts).where(eq(ccAlerts.ventureId, input.ventureId)).orderBy(desc(ccAlerts.createdAt))
        : await d.select().from(ccAlerts).orderBy(desc(ccAlerts.createdAt));
      return rows;
    }),
    upsert: publicProcedure.input(z.object({ id: z.number().optional(), ...alertFields })).mutation(async ({ input }) => {
      const d = await db();
      const { id, ...vals } = input;
      if (id) {
        await d.update(ccAlerts).set({ ...vals, updatedAt: new Date() }).where(eq(ccAlerts.id, id));
        return { id };
      }
      const [row] = await d.insert(ccAlerts).values({ ...vals, autoGenerated: false }).returning();
      return { id: row.id };
    }),
    setStatus: publicProcedure.input(z.object({ id: z.number(), status: z.enum(ALERT_STATUSES), owner: z.string().nullable().optional() })).mutation(async ({ input }) => {
      const d = await db();
      const { id, ...vals } = input;
      await d.update(ccAlerts).set({ ...vals, updatedAt: new Date() }).where(eq(ccAlerts.id, id));
      return { success: true };
    }),
    delete: publicProcedure.input(idInput).mutation(async ({ input }) => {
      const d = await db();
      await d.delete(ccAlerts).where(eq(ccAlerts.id, input.id));
      return { success: true };
    }),
    /** Regenerate auto-alerts across the whole portfolio. */
    regenerate: publicProcedure.mutation(async () => {
      const d = await db();
      const bundles = await loadAllBundles(d);
      for (const b of bundles) await syncAlerts(d, b, deriveVentureMetrics(b));
      return { success: true, ventures: bundles.length };
    }),
  }),

  // ── Aggregate: Portfolio overview ─────────────────────────────────────────────
  portfolioSummary: publicProcedure.query(async () => {
    const d = await db();
    const bundles = await loadAllBundles(d);
    const rows = bundles.map((b) => {
      const m = deriveVentureMetrics(b);
      const latestDecision = b.decisions.slice().sort((a, z2) => +new Date(z2.updatedAt) - +new Date(a.updatedAt))[0] ?? null;
      return {
        ventureId: b.venture.id, name: b.venture.name, color: b.venture.color ?? "#56A837",
        stage: m.stage, status: m.status, ventureType: b.venture.ventureType,
        evidenceConfidence: m.evidenceConfidence, marketValidation: m.marketValidation,
        commercialValidation: m.commercialValidation, technicalValidation: m.technicalValidation,
        operationalReadiness: m.operationalReadiness, riskScore: m.riskScore,
        portfolioHealth: m.portfolioHealth, riskAdjustedReadiness: m.riskAdjustedReadiness,
        recommendation: m.decision.recommendation, decisionLabel: m.decision.label,
        decisionColumn: m.decision.column, decisionTone: m.decision.tone,
        nextBestAction: m.nextBestAction, stageGateReady: m.stageGateReady,
        overdueExperiments: m.overdueExperiments.length, hasInvalidatedHypothesis: m.hasInvalidatedHypothesis,
        latestDecisionTitle: latestDecision?.decisionTitle ?? null,
        counts: {
          hypotheses: b.hypotheses.length, experiments: b.experiments.length,
          evidence: b.evidence.length, decisions: b.decisions.length,
        },
      };
    });

    const allAlerts = await d.select().from(ccAlerts);
    const activeAlerts = allAlerts.filter((a) => a.status !== "resolved" && a.status !== "dismissed");
    const stats = {
      total: rows.length,
      validating: rows.filter((r) => r.status === "validating").length,
      building: rows.filter((r) => r.status === "building").length,
      piloting: rows.filter((r) => r.status === "piloting").length,
      paused: rows.filter((r) => r.status === "paused").length,
      pivotDecision: rows.filter((r) => r.recommendation === "pivot" || r.hasInvalidatedHypothesis).length,
      criticalAlerts: activeAlerts.filter((a) => a.severity === "critical").length,
      overdueExperiments: rows.reduce((s, r) => s + r.overdueExperiments, 0),
      readyForStageGate: rows.filter((r) => r.stageGateReady).length,
      avgHealth: avg(rows.map((r) => r.portfolioHealth)),
    };
    return { rows, stats };
  }),

  // ── Aggregate: Decision board (grouped by recommendation column) ──────────────
  decisionBoard: publicProcedure.query(async () => {
    const d = await db();
    const bundles = await loadAllBundles(d);
    return bundles.map((b) => {
      const m = deriveVentureMetrics(b);
      const topHyp = b.hypotheses.slice().sort((a, z2) => (z2.confidenceScore ?? 0) - (a.confidenceScore ?? 0))[0] ?? null;
      const supporting = b.evidence.filter((e) => !e.contradictsHypothesis).sort((a, z2) => (z2.evidenceConfidenceScore ?? 0) - (a.evidenceConfidenceScore ?? 0))[0] ?? null;
      const contradicting = b.evidence.filter((e) => e.contradictsHypothesis).sort((a, z2) => (z2.evidenceConfidenceScore ?? 0) - (a.evidenceConfidenceScore ?? 0))[0] ?? null;
      return {
        ventureId: b.venture.id, name: b.venture.name, color: b.venture.color ?? "#56A837",
        column: m.decision.column, decisionLabel: m.decision.label, rationale: m.decision.rationale,
        recommendation: m.decision.recommendation, tone: m.decision.tone,
        currentHypothesis: topHyp?.hypothesisStatement ?? null, hypothesisId: topHyp?.id ?? null,
        stage: m.stage, nextStage: nextStage(m.stage), stageGateReady: m.stageGateReady,
        evidenceConfidence: m.evidenceConfidence, riskScore: m.riskScore, wtpScore: m.wtpScore,
        marketValidation: m.marketValidation, commercialValidation: m.commercialValidation,
        technicalValidation: m.technicalValidation, operationalReadiness: m.operationalReadiness,
        topSupporting: supporting?.evidenceTitle ?? null,
        topContradicting: contradicting?.evidenceTitle ?? null,
        nextBestAction: m.nextBestAction,
      };
    });
  }),

  // ── Aggregate: Experiment queue (whole portfolio) ─────────────────────────────
  experimentQueue: publicProcedure.query(async () => {
    const d = await db();
    const bundles = await loadAllBundles(d);
    const out: Array<Record<string, unknown>> = [];
    for (const b of bundles) {
      const hypById = new Map(b.hypotheses.map((h) => [h.id, h]));
      for (const ex of b.experiments) {
        const overdue = isOverdue(ex);
        out.push({
          ...ex,
          ventureName: b.venture.name, ventureColor: b.venture.color ?? "#56A837",
          hypothesisStatement: ex.hypothesisId ? hypById.get(ex.hypothesisId)?.hypothesisStatement ?? null : null,
          effectiveStatus: overdue ? "overdue" : ex.experimentStatus,
        });
      }
    }
    return out;
  }),

  // ── Aggregate: Evidence dashboard ─────────────────────────────────────────────
  evidenceDashboard: publicProcedure.input(z.object({ ventureId: z.string().optional() }).optional()).query(async ({ input }) => {
    const d = await db();
    const bundles = await loadAllBundles(d);
    const filtered = input?.ventureId ? bundles.filter((b) => b.venture.id === input.ventureId) : bundles;
    const perVenture = filtered.map((b) => {
      const m = deriveVentureMetrics(b);
      const byModule: Record<string, number[]> = {};
      for (const e of b.evidence) {
        const k = e.moduleSource ?? "command_centre";
        (byModule[k] ??= []).push(e.evidenceConfidenceScore ?? 0);
      }
      return {
        ventureId: b.venture.id, name: b.venture.name, color: b.venture.color ?? "#56A837",
        evidenceConfidence: m.evidenceConfidence, supportingCount: m.supportingCount,
        contradictingCount: m.contradictingCount, supportingRatio: m.supportingRatio,
        missingEvidence: m.missingEvidence, evidenceCount: b.evidence.length,
        byModule: Object.entries(byModule).map(([module, scores]) => ({ module, score: avg(scores), count: scores.length })),
      };
    });
    return perVenture;
  }),

  // ── Aggregate: Stage-gate board ───────────────────────────────────────────────
  stageGateBoard: publicProcedure.query(async () => {
    const d = await db();
    const bundles = await loadAllBundles(d);
    return bundles.map((b) => {
      const m = deriveVentureMetrics(b);
      const ng = nextStage(m.stage);
      const latestReview = b.reviews.slice().sort((a, z2) => +new Date(z2.updatedAt) - +new Date(a.updatedAt))[0] ?? null;
      return {
        ventureId: b.venture.id, name: b.venture.name, color: b.venture.color ?? "#56A837",
        fromStage: m.stage, toStage: ng,
        evidenceScore: m.evidenceConfidence, marketScore: m.marketValidation,
        commercialScore: m.commercialValidation, technicalScore: m.technicalValidation,
        operationalScore: m.operationalReadiness, riskScore: m.riskScore,
        investmentReadinessScore: m.riskAdjustedReadiness,
        readiness: m.stageGateReadiness, ready: m.stageGateReady,
        checklist: m.stageGateChecklist,
        reviewStatus: latestReview?.reviewStatus ?? "not_started",
        latestReviewId: latestReview?.id ?? null,
      };
    });
  }),

  // ── Single venture status (stage-gate readiness detail) ───────────────────────
  ventureStatus: publicProcedure.input(z.object({ ventureId: z.string().optional() }).optional()).query(async ({ input }) => {
    const d = await db();
    const bundles = await loadAllBundles(d);
    const filtered = input?.ventureId ? bundles.filter((b) => b.venture.id === input.ventureId) : bundles;
    return filtered.map((b) => {
      const m = deriveVentureMetrics(b);
      const latestDecision = b.decisions.slice().sort((a, z2) => +new Date(z2.updatedAt) - +new Date(a.updatedAt))[0] ?? null;
      const gtmEvidence = b.evidence.filter((e) => e.evidenceType === "gtm_result");
      return {
        ventureId: b.venture.id, name: b.venture.name, color: b.venture.color ?? "#56A837",
        stage: m.stage, status: m.status, nextStage: nextStage(m.stage),
        latestDecision: latestDecision?.decisionTitle ?? null,
        evidenceConfidence: m.evidenceConfidence, marketValidation: m.marketValidation,
        commercialValidation: m.commercialValidation, technicalValidation: m.technicalValidation,
        operationalReadiness: m.operationalReadiness,
        gtmValidation: gtmEvidence.length ? avg(gtmEvidence.map((e) => e.evidenceConfidenceScore ?? 0)) : 0,
        riskScore: m.riskScore, readiness: m.stageGateReadiness, ready: m.stageGateReady,
        riskAdjustedReadiness: m.riskAdjustedReadiness,
        requiredActions: m.stageGateChecklist.filter((c) => !c.complete).map((c) => c.requiredAction),
        checklist: m.stageGateChecklist,
        recommendation: m.decision.recommendation, decisionLabel: m.decision.label,
        readinessRecommendation: recommendationFromReadiness(m.riskAdjustedReadiness),
      };
    });
  }),
});
