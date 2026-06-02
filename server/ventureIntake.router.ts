/**
 * Venture Intake Module — tRPC Router
 * Sprint: Venture Intake Rebuild
 *
 * Implements the full Lean Startup hypothesis-capture workflow:
 *   Idea → Assumptions → Hypotheses → Riskiest Assumption → Lean Canvas → Intake Decision
 *
 * Scoring engines (all exported for testing):
 *   calculateAssumptionRiskScore()
 *   calculateSegmentClarityScore()
 *   calculateProblemDefinitionScore()
 *   calculateValuePropositionQualityScore()
 *   calculateBusinessModelReadinessScore()
 *   calculateRiskiestAssumptionPriorityScore()
 *   calculateLeanCanvasCompletenessScore()
 *   calculateIntakeReadinessScore()
 *   generateIntakeDecisionRecommendation()
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";

// ─── ID Generator ─────────────────────────────────────────────────────────────

export function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Scoring Engines ──────────────────────────────────────────────────────────

/**
 * Assumption Risk Score = Importance × Uncertainty (1–25 scale)
 * 1–5 = Low, 6–10 = Medium, 11–18 = High, 19–25 = Critical
 */
export function calculateAssumptionRiskScore(importance: number, uncertainty: number): number {
  return importance * uncertainty;
}

export function assumptionRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 19) return "critical";
  if (score >= 11) return "high";
  if (score >= 6) return "medium";
  return "low";
}

/**
 * Segment Clarity Score — 5 factors × 20% each → 0–100
 */
export function calculateSegmentClarityScore(params: {
  buyerRole: string | null;
  userRole: string | null;
  decisionMaker: string | null;
  useCase: string | null;
  currentAlternative: string | null;
}): number {
  const filled = [
    params.buyerRole,
    params.userRole,
    params.decisionMaker,
    params.useCase,
    params.currentAlternative,
  ].filter((v) => v && v.trim().length > 0).length;
  return Math.round((filled / 5) * 100);
}

/**
 * Problem Definition Score — 5 factors × 20% each → 0–100
 */
export function calculateProblemDefinitionScore(params: {
  problemStatement: string | null;
  customerSegmentLink: string | null;
  currentWorkaround: string | null;
  evidenceRequired: string | null;
  successMetric: string | null;
}): number {
  const filled = [
    params.problemStatement,
    params.customerSegmentLink,
    params.currentWorkaround,
    params.evidenceRequired,
    params.successMetric,
  ].filter((v) => v && v.trim().length > 0).length;
  return Math.round((filled / 5) * 100);
}

/**
 * Value Proposition Quality Score
 * Job 20%, Pain 20%, Gain 20%, Measurable Outcome 25%, Evidence Required 15%
 */
export function calculateValuePropositionQualityScore(params: {
  customerJob: string | null;
  painRelieved: string | null;
  gainCreated: string | null;
  measurableOutcome: string | null;
  evidenceRequired: string | null;
}): number {
  const weights = [
    { value: params.customerJob, weight: 0.20 },
    { value: params.painRelieved, weight: 0.20 },
    { value: params.gainCreated, weight: 0.20 },
    { value: params.measurableOutcome, weight: 0.25 },
    { value: params.evidenceRequired, weight: 0.15 },
  ];
  const score = weights.reduce((acc, w) => {
    return acc + (w.value && w.value.trim().length > 0 ? w.weight * 100 : 0);
  }, 0);
  return Math.round(score);
}

/**
 * Business Model Readiness Score — 5 factors × 20% each → 0–100
 */
export function calculateBusinessModelReadinessScore(params: {
  revenueModel: string | null;
  pricingAssumption: string | null;
  deliveryModel: string | null;
  salesChannel: string | null;
  evidenceRequired: string | null;
}): number {
  const filled = [
    params.revenueModel,
    params.pricingAssumption,
    params.deliveryModel,
    params.salesChannel,
    params.evidenceRequired,
  ].filter((v) => v && v.trim().length > 0).length;
  return Math.round((filled / 5) * 100);
}

/**
 * Riskiest Assumption Priority Score
 * Assumption Risk Score × 50% + Impact If False × 30% + Evidence Gap × 20%
 * All inputs on 1–5 scale, output 0–100
 */
export function calculateRiskiestAssumptionPriorityScore(params: {
  assumptionRiskScore: number; // 1–25 → normalise to 0–100
  impactIfFalseScore: number;  // 1–5
  evidenceGapScore: number;    // 1–5
}): number {
  const normalisedRisk = Math.min((params.assumptionRiskScore / 25) * 100, 100);
  const normalisedImpact = (params.impactIfFalseScore / 5) * 100;
  const normalisedGap = (params.evidenceGapScore / 5) * 100;
  return Math.round(
    normalisedRisk * 0.50 +
    normalisedImpact * 0.30 +
    normalisedGap * 0.20
  );
}

/**
 * Lean Canvas Completeness Score — % of 11 blocks filled → 0–100
 */
export function calculateLeanCanvasCompletenessScore(canvas: {
  customer_segments?: string | null;
  problem?: string | null;
  existing_alternatives?: string | null;
  unique_value_proposition?: string | null;
  solution?: string | null;
  channels?: string | null;
  revenue_streams?: string | null;
  cost_structure?: string | null;
  key_metrics?: string | null;
  unfair_advantage?: string | null;
  high_level_concept?: string | null;
}): number {
  const blocks = [
    canvas.customer_segments,
    canvas.problem,
    canvas.existing_alternatives,
    canvas.unique_value_proposition,
    canvas.solution,
    canvas.channels,
    canvas.revenue_streams,
    canvas.cost_structure,
    canvas.key_metrics,
    canvas.unfair_advantage,
    canvas.high_level_concept,
  ];
  const filled = blocks.filter((b) => b && b.trim().length > 0).length;
  return Math.round((filled / 11) * 100);
}

/**
 * Intake Readiness Score
 * Idea 15% + Segment 15% + Problem 20% + VP 15% + BizModel 10% + Canvas 10% + Riskiest 15%
 */
export function calculateIntakeReadinessScore(params: {
  ideaCompleteness: number;       // 0–100
  segmentClarity: number;         // 0–100
  problemDefinition: number;      // 0–100
  valuePropQuality: number;       // 0–100
  bizModelReadiness: number;      // 0–100
  canvasCompleteness: number;     // 0–100
  riskiestAssumptionDefined: boolean;
}): number {
  const riskiestScore = params.riskiestAssumptionDefined ? 100 : 0;
  return Math.round(
    params.ideaCompleteness * 0.15 +
    params.segmentClarity * 0.15 +
    params.problemDefinition * 0.20 +
    params.valuePropQuality * 0.15 +
    params.bizModelReadiness * 0.10 +
    params.canvasCompleteness * 0.10 +
    riskiestScore * 0.15
  );
}

/**
 * Generate intake decision recommendation based on readiness score and critical assumptions
 */
export function generateIntakeDecisionRecommendation(params: {
  readinessScore: number;
  hasCriticalUndefinedAssumptions: boolean;
}): { decision: string; label: string; description: string } {
  if (params.hasCriticalUndefinedAssumptions) {
    return {
      decision: "create_experiment",
      label: "Define Riskiest Assumption First",
      description: "Critical assumptions exist with no test defined. Define and test the riskiest assumption before proceeding.",
    };
  }
  if (params.readinessScore >= 80) {
    return {
      decision: "proceed_to_discovery_and_market",
      label: "Proceed to Discovery & Market",
      description: "Strong intake package. Proceed to Discovery & Market and create the first experiment.",
    };
  }
  if (params.readinessScore >= 60) {
    return {
      decision: "begin_customer_discovery",
      label: "Begin Customer Discovery",
      description: "Ready for initial discovery. Start customer interviews to validate the core problem hypothesis.",
    };
  }
  if (params.readinessScore >= 40) {
    return {
      decision: "research_more",
      label: "Research More",
      description: "Needs more definition. Complete missing hypotheses and strengthen the evidence base.",
    };
  }
  return {
    decision: "archive",
    label: "Not Ready — Redefine Idea",
    description: "Intake package is too incomplete. Redefine the idea, assumptions, and hypotheses before proceeding.",
  };
}

/**
 * Calculate idea completeness score (0–100) based on filled fields
 */
export function calculateIdeaCompleteness(idea: {
  idea_title?: string | null;
  idea_summary?: string | null;
  target_sector?: string | null;
  target_customer?: string | null;
  problem_area?: string | null;
  proposed_solution?: string | null;
  why_now?: string | null;
}): number {
  const fields = [
    idea.idea_title,
    idea.idea_summary,
    idea.target_sector,
    idea.target_customer,
    idea.problem_area,
    idea.proposed_solution,
    idea.why_now,
  ];
  const filled = fields.filter((f) => f && f.trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const ventureIntakeRouter = router({

  // ── Venture Ideas ────────────────────────────────────────────────────────────

  "ideas.list": protectedProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = input.ventureId
        ? await db.execute(sql`SELECT * FROM venture_ideas WHERE venture_id = ${input.ventureId} ORDER BY created_at DESC`)
        : await db.execute(sql`SELECT * FROM venture_ideas ORDER BY created_at DESC`);
      return (rows as any)[0] as any[];
    }),

  "ideas.get": protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db.execute(sql`SELECT * FROM venture_ideas WHERE id = ${input.id} LIMIT 1`);
      return ((rows as any)[0] as any[])[0] ?? null;
    }),

  "ideas.create": protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      ideaTitle: z.string().min(1),
      ideaSummary: z.string().optional(),
      originSource: z.string().optional(),
      targetSector: z.string().optional(),
      targetCustomer: z.string().optional(),
      problemArea: z.string().optional(),
      proposedSolution: z.string().optional(),
      whyNow: z.string().optional(),
      strategicRelevance: z.string().optional(),
      sustainabilityRelevance: z.string().optional(),
      dataMoatPotential: z.string().optional(),
      founderNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const id = genId("idea");
      await db.execute(sql`INSERT INTO venture_ideas (
        id, venture_id, idea_title, idea_summary, origin_source, target_sector,
        target_customer, problem_area, proposed_solution, why_now, strategic_relevance,
        sustainability_relevance, data_moat_potential, founder_notes
      ) VALUES (
        ${id}, ${input.ventureId}, ${input.ideaTitle}, ${input.ideaSummary ?? null},
        ${input.originSource ?? "founder_idea"}, ${input.targetSector ?? null},
        ${input.targetCustomer ?? null}, ${input.problemArea ?? null},
        ${input.proposedSolution ?? null}, ${input.whyNow ?? null},
        ${input.strategicRelevance ?? null}, ${input.sustainabilityRelevance ?? null},
        ${input.dataMoatPotential ?? null}, ${input.founderNotes ?? null}
      )`);
      return { id };
    }),

  "ideas.update": protectedProcedure
    .input(z.object({
      id: z.string(),
      ideaTitle: z.string().optional(),
      ideaSummary: z.string().optional(),
      originSource: z.string().optional(),
      targetSector: z.string().optional(),
      targetCustomer: z.string().optional(),
      problemArea: z.string().optional(),
      proposedSolution: z.string().optional(),
      whyNow: z.string().optional(),
      strategicRelevance: z.string().optional(),
      sustainabilityRelevance: z.string().optional(),
      dataMoatPotential: z.string().optional(),
      founderNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...fields } = input;
      if (fields.ideaTitle !== undefined)
        await db.execute(sql`UPDATE venture_ideas SET idea_title = ${fields.ideaTitle} WHERE id = ${id}`);
      if (fields.ideaSummary !== undefined)
        await db.execute(sql`UPDATE venture_ideas SET idea_summary = ${fields.ideaSummary} WHERE id = ${id}`);
      if (fields.originSource !== undefined)
        await db.execute(sql`UPDATE venture_ideas SET origin_source = ${fields.originSource} WHERE id = ${id}`);
      if (fields.targetSector !== undefined)
        await db.execute(sql`UPDATE venture_ideas SET target_sector = ${fields.targetSector} WHERE id = ${id}`);
      if (fields.targetCustomer !== undefined)
        await db.execute(sql`UPDATE venture_ideas SET target_customer = ${fields.targetCustomer} WHERE id = ${id}`);
      if (fields.problemArea !== undefined)
        await db.execute(sql`UPDATE venture_ideas SET problem_area = ${fields.problemArea} WHERE id = ${id}`);
      if (fields.proposedSolution !== undefined)
        await db.execute(sql`UPDATE venture_ideas SET proposed_solution = ${fields.proposedSolution} WHERE id = ${id}`);
      if (fields.whyNow !== undefined)
        await db.execute(sql`UPDATE venture_ideas SET why_now = ${fields.whyNow} WHERE id = ${id}`);
      if (fields.strategicRelevance !== undefined)
        await db.execute(sql`UPDATE venture_ideas SET strategic_relevance = ${fields.strategicRelevance} WHERE id = ${id}`);
      if (fields.sustainabilityRelevance !== undefined)
        await db.execute(sql`UPDATE venture_ideas SET sustainability_relevance = ${fields.sustainabilityRelevance} WHERE id = ${id}`);
      if (fields.dataMoatPotential !== undefined)
        await db.execute(sql`UPDATE venture_ideas SET data_moat_potential = ${fields.dataMoatPotential} WHERE id = ${id}`);
      if (fields.founderNotes !== undefined)
        await db.execute(sql`UPDATE venture_ideas SET founder_notes = ${fields.founderNotes} WHERE id = ${id}`);
      return { success: true };
    }),

  "ideas.delete": protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.execute(sql`DELETE FROM venture_ideas WHERE id = ${input.id}`);
      return { success: true };
    }),

  // ── Founder Assumptions ───────────────────────────────────────────────────────

  "assumptions.list": protectedProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = input.ventureId
        ? await db.execute(sql`SELECT * FROM founder_assumptions WHERE venture_id = ${input.ventureId} ORDER BY importance_score DESC, uncertainty_score DESC`)
        : await db.execute(sql`SELECT * FROM founder_assumptions ORDER BY created_at DESC`);
      return (rows as any)[0] as any[];
    }),

  "assumptions.create": protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      assumptionTitle: z.string().min(1),
      assumptionStatement: z.string().min(1),
      assumptionCategory: z.string().default("customer"),
      importanceScore: z.number().min(1).max(5).default(3),
      uncertaintyScore: z.number().min(1).max(5).default(3),
      evidenceExists: z.boolean().default(false),
      evidenceSummary: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const id = genId("asmp");
      const riskScore = calculateAssumptionRiskScore(input.importanceScore, input.uncertaintyScore);
      const riskLevel = assumptionRiskLevel(riskScore);
      await db.execute(sql`INSERT INTO founder_assumptions (
        id, venture_id, assumption_title, assumption_statement, assumption_category,
        importance_score, uncertainty_score, evidence_exists, evidence_summary, risk_level
      ) VALUES (
        ${id}, ${input.ventureId}, ${input.assumptionTitle}, ${input.assumptionStatement},
        ${input.assumptionCategory}, ${input.importanceScore}, ${input.uncertaintyScore},
        ${input.evidenceExists ? 1 : 0}, ${input.evidenceSummary ?? null}, ${riskLevel}
      )`);
      return { id, riskScore, riskLevel };
    }),

  "assumptions.update": protectedProcedure
    .input(z.object({
      id: z.string(),
      assumptionTitle: z.string().optional(),
      assumptionStatement: z.string().optional(),
      assumptionCategory: z.string().optional(),
      importanceScore: z.number().min(1).max(5).optional(),
      uncertaintyScore: z.number().min(1).max(5).optional(),
      evidenceExists: z.boolean().optional(),
      evidenceSummary: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...fields } = input;
      if (fields.assumptionTitle !== undefined)
        await db.execute(sql`UPDATE founder_assumptions SET assumption_title = ${fields.assumptionTitle} WHERE id = ${id}`);
      if (fields.assumptionStatement !== undefined)
        await db.execute(sql`UPDATE founder_assumptions SET assumption_statement = ${fields.assumptionStatement} WHERE id = ${id}`);
      if (fields.assumptionCategory !== undefined)
        await db.execute(sql`UPDATE founder_assumptions SET assumption_category = ${fields.assumptionCategory} WHERE id = ${id}`);
      if (fields.evidenceExists !== undefined)
        await db.execute(sql`UPDATE founder_assumptions SET evidence_exists = ${fields.evidenceExists ? 1 : 0} WHERE id = ${id}`);
      if (fields.evidenceSummary !== undefined)
        await db.execute(sql`UPDATE founder_assumptions SET evidence_summary = ${fields.evidenceSummary} WHERE id = ${id}`);
      // Recalculate risk if scores changed
      if (fields.importanceScore !== undefined || fields.uncertaintyScore !== undefined) {
        const rows = await db.execute(sql`SELECT importance_score, uncertainty_score FROM founder_assumptions WHERE id = ${id}`);
        const row = ((rows as any)[0] as any[])[0];
        const imp = fields.importanceScore ?? row.importance_score;
        const unc = fields.uncertaintyScore ?? row.uncertainty_score;
        if (fields.importanceScore !== undefined)
          await db.execute(sql`UPDATE founder_assumptions SET importance_score = ${imp} WHERE id = ${id}`);
        if (fields.uncertaintyScore !== undefined)
          await db.execute(sql`UPDATE founder_assumptions SET uncertainty_score = ${unc} WHERE id = ${id}`);
        const riskScore = calculateAssumptionRiskScore(imp, unc);
        const riskLevel = assumptionRiskLevel(riskScore);
        await db.execute(sql`UPDATE founder_assumptions SET risk_level = ${riskLevel} WHERE id = ${id}`);
      }
      return { success: true };
    }),

  "assumptions.delete": protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.execute(sql`DELETE FROM founder_assumptions WHERE id = ${input.id}`);
      return { success: true };
    }),

  "assumptions.summary": protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db.execute(sql`SELECT * FROM founder_assumptions WHERE venture_id = ${input.ventureId}`);
      const assumptions = (rows as any)[0] as any[];
      const total = assumptions.length;
      const high = assumptions.filter((a) => a.risk_level === "high").length;
      const critical = assumptions.filter((a) => a.risk_level === "critical").length;
      const noEvidence = assumptions.filter((a) => !a.evidence_exists).length;
      const top5 = assumptions
        .map((a) => ({ ...a, riskScore: calculateAssumptionRiskScore(a.importance_score, a.uncertainty_score) }))
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 5);
      return { total, high, critical, noEvidence, top5 };
    }),

  "assumptions.convertToHypothesis": protectedProcedure
    .input(z.object({
      assumptionId: z.string(),
      hypothesisType: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const rows = await db.execute(sql`SELECT * FROM founder_assumptions WHERE id = ${input.assumptionId} LIMIT 1`);
      const assumption = ((rows as any)[0] as any[])[0];
      if (!assumption) throw new Error("Assumption not found");
      const id = genId("hyp");
      await db.execute(sql`INSERT INTO venture_hypotheses (
        id, venture_id, module_source, hypothesis_type, hypothesis_statement,
        assumption_risk_level, status, linked_assumption_id
      ) VALUES (
        ${id}, ${assumption.venture_id}, 'venture_intake', ${input.hypothesisType},
        ${assumption.assumption_statement}, ${assumption.risk_level}, 'untested', ${input.assumptionId}
      )`);
      return { id };
    }),

  // ── Venture Hypotheses ────────────────────────────────────────────────────────

  "hypotheses.list": protectedProcedure
    .input(z.object({
      ventureId: z.string().optional(),
      hypothesisType: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      let rows;
      if (input.ventureId && input.hypothesisType) {
        rows = await db.execute(sql`SELECT * FROM venture_hypotheses WHERE venture_id = ${input.ventureId} AND hypothesis_type = ${input.hypothesisType} ORDER BY created_at DESC`);
      } else if (input.ventureId) {
        rows = await db.execute(sql`SELECT * FROM venture_hypotheses WHERE venture_id = ${input.ventureId} ORDER BY created_at DESC`);
      } else {
        rows = await db.execute(sql`SELECT * FROM venture_hypotheses ORDER BY created_at DESC`);
      }
      return (rows as any)[0] as any[];
    }),

  "hypotheses.create": protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      hypothesisType: z.string().default("problem"),
      hypothesisStatement: z.string().min(1),
      targetCustomer: z.string().optional(),
      expectedBehaviour: z.string().optional(),
      successMetric: z.string().optional(),
      testMethod: z.string().optional(),
      assumptionRiskLevel: z.string().default("medium"),
      linkedAssumptionId: z.string().optional(),
      moduleSource: z.string().default("venture_intake"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const id = genId("hyp");
      await db.execute(sql`INSERT INTO venture_hypotheses (
        id, venture_id, module_source, hypothesis_type, hypothesis_statement,
        target_customer, expected_behaviour, success_metric, test_method,
        assumption_risk_level, status, linked_assumption_id
      ) VALUES (
        ${id}, ${input.ventureId}, ${input.moduleSource}, ${input.hypothesisType},
        ${input.hypothesisStatement}, ${input.targetCustomer ?? null},
        ${input.expectedBehaviour ?? null}, ${input.successMetric ?? null},
        ${input.testMethod ?? null}, ${input.assumptionRiskLevel}, 'untested',
        ${input.linkedAssumptionId ?? null}
      )`);
      return { id };
    }),

  "hypotheses.update": protectedProcedure
    .input(z.object({
      id: z.string(),
      hypothesisStatement: z.string().optional(),
      targetCustomer: z.string().optional(),
      expectedBehaviour: z.string().optional(),
      successMetric: z.string().optional(),
      testMethod: z.string().optional(),
      status: z.string().optional(),
      confidenceScore: z.number().optional(),
      evidenceSummary: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...fields } = input;
      if (fields.hypothesisStatement !== undefined)
        await db.execute(sql`UPDATE venture_hypotheses SET hypothesis_statement = ${fields.hypothesisStatement} WHERE id = ${id}`);
      if (fields.targetCustomer !== undefined)
        await db.execute(sql`UPDATE venture_hypotheses SET target_customer = ${fields.targetCustomer} WHERE id = ${id}`);
      if (fields.expectedBehaviour !== undefined)
        await db.execute(sql`UPDATE venture_hypotheses SET expected_behaviour = ${fields.expectedBehaviour} WHERE id = ${id}`);
      if (fields.successMetric !== undefined)
        await db.execute(sql`UPDATE venture_hypotheses SET success_metric = ${fields.successMetric} WHERE id = ${id}`);
      if (fields.testMethod !== undefined)
        await db.execute(sql`UPDATE venture_hypotheses SET test_method = ${fields.testMethod} WHERE id = ${id}`);
      if (fields.status !== undefined)
        await db.execute(sql`UPDATE venture_hypotheses SET status = ${fields.status} WHERE id = ${id}`);
      if (fields.confidenceScore !== undefined)
        await db.execute(sql`UPDATE venture_hypotheses SET confidence_score = ${fields.confidenceScore} WHERE id = ${id}`);
      if (fields.evidenceSummary !== undefined)
        await db.execute(sql`UPDATE venture_hypotheses SET evidence_summary = ${fields.evidenceSummary} WHERE id = ${id}`);
      return { success: true };
    }),

  "hypotheses.delete": protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.execute(sql`DELETE FROM venture_hypotheses WHERE id = ${input.id}`);
      return { success: true };
    }),

  // ── Riskiest Assumptions ──────────────────────────────────────────────────────

  "riskiest.list": protectedProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = input.ventureId
        ? await db.execute(sql`SELECT * FROM riskiest_assumptions WHERE venture_id = ${input.ventureId} ORDER BY test_priority_score DESC`)
        : await db.execute(sql`SELECT * FROM riskiest_assumptions ORDER BY test_priority_score DESC`);
      return (rows as any)[0] as any[];
    }),

  "riskiest.create": protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      assumptionId: z.string().optional(),
      hypothesisId: z.string().optional(),
      assumptionStatement: z.string().min(1),
      reasonItIsRisky: z.string().optional(),
      impactIfFalse: z.string().optional(),
      evidenceRequired: z.string().optional(),
      proposedTest: z.string().optional(),
      recommendedFirstExperiment: z.string().optional(),
      impactIfFalseScore: z.number().min(1).max(5).default(3),
      evidenceGapScore: z.number().min(1).max(5).default(3),
      assumptionRiskScore: z.number().default(9),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const id = genId("risk");
      const priorityScore = calculateRiskiestAssumptionPriorityScore({
        assumptionRiskScore: input.assumptionRiskScore,
        impactIfFalseScore: input.impactIfFalseScore,
        evidenceGapScore: input.evidenceGapScore,
      });
      await db.execute(sql`INSERT INTO riskiest_assumptions (
        id, venture_id, assumption_id, hypothesis_id, assumption_statement,
        reason_it_is_risky, impact_if_false, evidence_required, proposed_test,
        test_priority_score, recommended_first_experiment, impact_if_false_score, evidence_gap_score
      ) VALUES (
        ${id}, ${input.ventureId}, ${input.assumptionId ?? null}, ${input.hypothesisId ?? null},
        ${input.assumptionStatement}, ${input.reasonItIsRisky ?? null},
        ${input.impactIfFalse ?? null}, ${input.evidenceRequired ?? null},
        ${input.proposedTest ?? null}, ${priorityScore},
        ${input.recommendedFirstExperiment ?? null}, ${input.impactIfFalseScore}, ${input.evidenceGapScore}
      )`);
      return { id, priorityScore };
    }),

  "riskiest.update": protectedProcedure
    .input(z.object({
      id: z.string(),
      assumptionStatement: z.string().optional(),
      reasonItIsRisky: z.string().optional(),
      impactIfFalse: z.string().optional(),
      evidenceRequired: z.string().optional(),
      proposedTest: z.string().optional(),
      recommendedFirstExperiment: z.string().optional(),
      impactIfFalseScore: z.number().min(1).max(5).optional(),
      evidenceGapScore: z.number().min(1).max(5).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...fields } = input;
      if (fields.assumptionStatement !== undefined)
        await db.execute(sql`UPDATE riskiest_assumptions SET assumption_statement = ${fields.assumptionStatement} WHERE id = ${id}`);
      if (fields.reasonItIsRisky !== undefined)
        await db.execute(sql`UPDATE riskiest_assumptions SET reason_it_is_risky = ${fields.reasonItIsRisky} WHERE id = ${id}`);
      if (fields.impactIfFalse !== undefined)
        await db.execute(sql`UPDATE riskiest_assumptions SET impact_if_false = ${fields.impactIfFalse} WHERE id = ${id}`);
      if (fields.evidenceRequired !== undefined)
        await db.execute(sql`UPDATE riskiest_assumptions SET evidence_required = ${fields.evidenceRequired} WHERE id = ${id}`);
      if (fields.proposedTest !== undefined)
        await db.execute(sql`UPDATE riskiest_assumptions SET proposed_test = ${fields.proposedTest} WHERE id = ${id}`);
      if (fields.recommendedFirstExperiment !== undefined)
        await db.execute(sql`UPDATE riskiest_assumptions SET recommended_first_experiment = ${fields.recommendedFirstExperiment} WHERE id = ${id}`);
      return { success: true };
    }),

  "riskiest.delete": protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.execute(sql`DELETE FROM riskiest_assumptions WHERE id = ${input.id}`);
      return { success: true };
    }),

  "riskiest.createExperiment": protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      riskiestAssumptionId: z.string(),
      experimentName: z.string(),
      experimentType: z.string().default("interview"),
      method: z.string().optional(),
      successThreshold: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const id = genId("exp");
      await db.execute(sql`INSERT INTO lean_experiments (
        id, venture_id, riskiest_assumption_id, experiment_name, experiment_type,
        method, success_threshold, status, module_source
      ) VALUES (
        ${id}, ${input.ventureId}, ${input.riskiestAssumptionId}, ${input.experimentName},
        ${input.experimentType}, ${input.method ?? null}, ${input.successThreshold ?? null},
        'proposed', 'venture_intake'
      )`);
      return { id };
    }),

  // ── Lean Canvas ───────────────────────────────────────────────────────────────

  "canvas.get": protectedProcedure
    .input(z.object({ ventureId: z.string(), version: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = input.version
        ? await db.execute(sql`SELECT * FROM lean_canvas_records WHERE venture_id = ${input.ventureId} AND version_number = ${input.version} LIMIT 1`)
        : await db.execute(sql`SELECT * FROM lean_canvas_records WHERE venture_id = ${input.ventureId} ORDER BY version_number DESC LIMIT 1`);
      const canvas = ((rows as any)[0] as any[])[0] ?? null;
      if (!canvas) return null;
      return {
        ...canvas,
        completenessScore: calculateLeanCanvasCompletenessScore(canvas),
      };
    }),

  "canvas.listVersions": protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db.execute(sql`SELECT id, venture_id, version_number, created_at, updated_at FROM lean_canvas_records WHERE venture_id = ${input.ventureId} ORDER BY version_number DESC`);
      return (rows as any)[0] as any[];
    }),

  "canvas.save": protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      customerSegments: z.string().optional(),
      problem: z.string().optional(),
      existingAlternatives: z.string().optional(),
      uniqueValueProposition: z.string().optional(),
      solution: z.string().optional(),
      channels: z.string().optional(),
      revenueStreams: z.string().optional(),
      costStructure: z.string().optional(),
      keyMetrics: z.string().optional(),
      unfairAdvantage: z.string().optional(),
      highLevelConcept: z.string().optional(),
      createNewVersion: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      // Get current max version
      const vRows = await db.execute(sql`SELECT MAX(version_number) as maxV FROM lean_canvas_records WHERE venture_id = ${input.ventureId}`);
      const maxV = ((vRows as any)[0] as any[])[0]?.maxV ?? 0;

      if (input.createNewVersion || maxV === 0) {
        const id = genId("canvas");
        const version = maxV + 1;
        await db.execute(sql`INSERT INTO lean_canvas_records (
          id, venture_id, customer_segments, problem, existing_alternatives,
          unique_value_proposition, solution, channels, revenue_streams, cost_structure,
          key_metrics, unfair_advantage, high_level_concept, version_number
        ) VALUES (
          ${id}, ${input.ventureId}, ${input.customerSegments ?? null},
          ${input.problem ?? null}, ${input.existingAlternatives ?? null},
          ${input.uniqueValueProposition ?? null}, ${input.solution ?? null},
          ${input.channels ?? null}, ${input.revenueStreams ?? null},
          ${input.costStructure ?? null}, ${input.keyMetrics ?? null},
          ${input.unfairAdvantage ?? null}, ${input.highLevelConcept ?? null}, ${version}
        )`);
        return { id, version };
      } else {
        // Update latest version
        const latest = await db.execute(sql`SELECT id FROM lean_canvas_records WHERE venture_id = ${input.ventureId} ORDER BY version_number DESC LIMIT 1`);
        const latestId = ((latest as any)[0] as any[])[0]?.id;
        await db.execute(sql`UPDATE lean_canvas_records SET
          customer_segments = ${input.customerSegments ?? null},
          problem = ${input.problem ?? null},
          existing_alternatives = ${input.existingAlternatives ?? null},
          unique_value_proposition = ${input.uniqueValueProposition ?? null},
          solution = ${input.solution ?? null},
          channels = ${input.channels ?? null},
          revenue_streams = ${input.revenueStreams ?? null},
          cost_structure = ${input.costStructure ?? null},
          key_metrics = ${input.keyMetrics ?? null},
          unfair_advantage = ${input.unfairAdvantage ?? null},
          high_level_concept = ${input.highLevelConcept ?? null}
        WHERE id = ${latestId}`);
        return { id: latestId, version: maxV };
      }
    }),

  // ── Intake Decisions ──────────────────────────────────────────────────────────

  "decision.get": protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db.execute(sql`SELECT * FROM intake_decisions WHERE venture_id = ${input.ventureId} ORDER BY created_at DESC LIMIT 1`);
      return ((rows as any)[0] as any[])[0] ?? null;
    }),

  "decision.compute": protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();

      // Gather all data for scoring
      const [ideasR, assumptionsR, hypothesesR, riskiestR, canvasR] = await Promise.all([
        db.execute(sql`SELECT * FROM venture_ideas WHERE venture_id = ${input.ventureId} ORDER BY created_at DESC LIMIT 1`),
        db.execute(sql`SELECT * FROM founder_assumptions WHERE venture_id = ${input.ventureId}`),
        db.execute(sql`SELECT * FROM venture_hypotheses WHERE venture_id = ${input.ventureId}`),
        db.execute(sql`SELECT * FROM riskiest_assumptions WHERE venture_id = ${input.ventureId} ORDER BY test_priority_score DESC LIMIT 1`),
        db.execute(sql`SELECT * FROM lean_canvas_records WHERE venture_id = ${input.ventureId} ORDER BY version_number DESC LIMIT 1`),
      ]);

      const idea = ((ideasR as any)[0] as any[])[0] ?? null;
      const assumptions = (assumptionsR as any)[0] as any[];
      const hypotheses = (hypothesesR as any)[0] as any[];
      const riskiest = ((riskiestR as any)[0] as any[])[0] ?? null;
      const canvas = ((canvasR as any)[0] as any[])[0] ?? null;

      // Compute sub-scores
      const ideaCompleteness = idea ? calculateIdeaCompleteness(idea) : 0;

      const customerHyp = hypotheses.find((h: any) => h.hypothesis_type === "customer_segment");
      const segmentClarity = customerHyp ? calculateSegmentClarityScore({
        buyerRole: customerHyp.target_customer,
        userRole: customerHyp.expected_behaviour,
        decisionMaker: customerHyp.test_method,
        useCase: customerHyp.hypothesis_statement,
        currentAlternative: customerHyp.evidence_summary,
      }) : 0;

      const problemHyp = hypotheses.find((h: any) => h.hypothesis_type === "problem");
      const problemDefinition = problemHyp ? calculateProblemDefinitionScore({
        problemStatement: problemHyp.hypothesis_statement,
        customerSegmentLink: problemHyp.target_customer,
        currentWorkaround: problemHyp.expected_behaviour,
        evidenceRequired: problemHyp.evidence_summary,
        successMetric: problemHyp.success_metric,
      }) : 0;

      const vpHyp = hypotheses.find((h: any) => h.hypothesis_type === "value_proposition");
      const valuePropQuality = vpHyp ? calculateValuePropositionQualityScore({
        customerJob: vpHyp.target_customer,
        painRelieved: vpHyp.expected_behaviour,
        gainCreated: vpHyp.hypothesis_statement,
        measurableOutcome: vpHyp.success_metric,
        evidenceRequired: vpHyp.evidence_summary,
      }) : 0;

      const bmHyp = hypotheses.find((h: any) => h.hypothesis_type === "business_model");
      const bizModelReadiness = bmHyp ? calculateBusinessModelReadinessScore({
        revenueModel: bmHyp.hypothesis_statement,
        pricingAssumption: bmHyp.expected_behaviour,
        deliveryModel: bmHyp.test_method,
        salesChannel: bmHyp.target_customer,
        evidenceRequired: bmHyp.evidence_summary,
      }) : 0;

      const canvasCompleteness = canvas ? calculateLeanCanvasCompletenessScore(canvas) : 0;
      const riskiestDefined = !!riskiest;

      const readinessScore = calculateIntakeReadinessScore({
        ideaCompleteness,
        segmentClarity,
        problemDefinition,
        valuePropQuality,
        bizModelReadiness,
        canvasCompleteness,
        riskiestAssumptionDefined: riskiestDefined,
      });

      const hasCriticalUndefined = assumptions.some(
        (a: any) => a.risk_level === "critical" && !a.evidence_exists
      );

      const recommendation = generateIntakeDecisionRecommendation({
        readinessScore,
        hasCriticalUndefinedAssumptions: hasCriticalUndefined,
      });

      return {
        readinessScore,
        ideaCompleteness,
        segmentClarity,
        problemDefinition,
        valuePropQuality,
        bizModelReadiness,
        canvasCompleteness,
        riskiestDefined,
        hasCriticalUndefined,
        recommendation,
        totalAssumptions: assumptions.length,
        criticalAssumptions: assumptions.filter((a: any) => a.risk_level === "critical").length,
        totalHypotheses: hypotheses.length,
        topRiskiestAssumption: riskiest,
      };
    }),

  "decision.save": protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      decisionType: z.string(),
      decisionSummary: z.string().optional(),
      readinessScore: z.number(),
      assumptionRiskScore: z.number().optional(),
      strategicFitScore: z.number().optional(),
      evidenceGapSummary: z.string().optional(),
      recommendedNextModule: z.string().optional(),
      recommendedFirstExperiment: z.string().optional(),
      decisionStatus: z.string().default("pending_review"),
      reviewerNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const id = genId("dec");
      await db.execute(sql`INSERT INTO intake_decisions (
        id, venture_id, decision_type, decision_summary, readiness_score,
        assumption_risk_score, strategic_fit_score, evidence_gap_summary,
        recommended_next_module, recommended_first_experiment, decision_status, reviewer_notes
      ) VALUES (
        ${id}, ${input.ventureId}, ${input.decisionType}, ${input.decisionSummary ?? null},
        ${input.readinessScore}, ${input.assumptionRiskScore ?? 0}, ${input.strategicFitScore ?? 0},
        ${input.evidenceGapSummary ?? null}, ${input.recommendedNextModule ?? null},
        ${input.recommendedFirstExperiment ?? null}, ${input.decisionStatus}, ${input.reviewerNotes ?? null}
      )`);
      return { id };
    }),

  "decision.approve": protectedProcedure
    .input(z.object({
      decisionId: z.string(),
      ventureId: z.string(),
      newStage: z.string().optional(),
      newStatus: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      // Update decision status
      await db.execute(sql`UPDATE intake_decisions SET decision_status = 'approved' WHERE id = ${input.decisionId}`);
      // Update venture stage/status if provided
      if (input.newStage) {
        await db.execute(sql`UPDATE ventures SET lifecycleStage = ${input.newStage} WHERE id = ${input.ventureId}`);
      }
      if (input.newStatus) {
        await db.execute(sql`UPDATE ventures SET status = ${input.newStatus} WHERE id = ${input.ventureId}`);
      }
      return { success: true };
    }),

  // ── Lean Experiments ──────────────────────────────────────────────────────────

  "experiments.list": protectedProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = input.ventureId
        ? await db.execute(sql`SELECT * FROM lean_experiments WHERE venture_id = ${input.ventureId} ORDER BY created_at DESC`)
        : await db.execute(sql`SELECT * FROM lean_experiments ORDER BY created_at DESC`);
      return (rows as any)[0] as any[];
    }),

  // ── Dashboard Summary ─────────────────────────────────────────────────────────

  "dashboard.summary": protectedProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [ideasR, assumptionsR, hypothesesR, riskiestR, experimentsR] = await Promise.all([
        input.ventureId
          ? db.execute(sql`SELECT COUNT(*) as count FROM venture_ideas WHERE venture_id = ${input.ventureId}`)
          : db.execute(sql`SELECT COUNT(*) as count FROM venture_ideas`),
        input.ventureId
          ? db.execute(sql`SELECT COUNT(*) as count, SUM(CASE WHEN risk_level = 'critical' THEN 1 ELSE 0 END) as critical FROM founder_assumptions WHERE venture_id = ${input.ventureId}`)
          : db.execute(sql`SELECT COUNT(*) as count, SUM(CASE WHEN risk_level = 'critical' THEN 1 ELSE 0 END) as critical FROM founder_assumptions`),
        input.ventureId
          ? db.execute(sql`SELECT COUNT(*) as count FROM venture_hypotheses WHERE venture_id = ${input.ventureId}`)
          : db.execute(sql`SELECT COUNT(*) as count FROM venture_hypotheses`),
        input.ventureId
          ? db.execute(sql`SELECT COUNT(*) as count FROM riskiest_assumptions WHERE venture_id = ${input.ventureId}`)
          : db.execute(sql`SELECT COUNT(*) as count FROM riskiest_assumptions`),
        input.ventureId
          ? db.execute(sql`SELECT COUNT(*) as count FROM lean_experiments WHERE venture_id = ${input.ventureId}`)
          : db.execute(sql`SELECT COUNT(*) as count FROM lean_experiments`),
      ]);
      return {
        totalIdeas: Number(((ideasR as any)[0] as any[])[0]?.count ?? 0),
        totalAssumptions: Number(((assumptionsR as any)[0] as any[])[0]?.count ?? 0),
        criticalAssumptions: Number(((assumptionsR as any)[0] as any[])[0]?.critical ?? 0),
        totalHypotheses: Number(((hypothesesR as any)[0] as any[])[0]?.count ?? 0),
        riskiestDefined: Number(((riskiestR as any)[0] as any[])[0]?.count ?? 0) > 0,
        totalExperiments: Number(((experimentsR as any)[0] as any[])[0]?.count ?? 0),
      };
    }),
});
