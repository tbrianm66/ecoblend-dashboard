// ============================================================================
// VENTURE INTAKE ROUTER — Lean hypothesis-capture layer
// Tables: vi_ideas, vi_assumptions, vi_riskiest, vi_decisions
// Reuses cc_hypotheses + cc_experiments with moduleSource='venture_intake'
// ============================================================================
import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  viIdeas, viAssumptions, viRiskiest, viDecisions,
  ventures,
} from "../drizzle/schema";
import { ccHypotheses, ccExperiments } from "../drizzle/schema_cc";

const vid = z.object({ ventureId: z.string() });
const idInput = z.object({ id: z.number() });

// ── Idea fields ───────────────────────────────────────────────────────────────
const ideaFields = {
  ideaTitle:               z.string().min(1),
  ideaSummary:             z.string().optional().nullable(),
  originSource:            z.string().optional().nullable(),
  targetSector:            z.string().optional().nullable(),
  targetCustomer:          z.string().optional().nullable(),
  problemArea:             z.string().optional().nullable(),
  proposedSolution:        z.string().optional().nullable(),
  whyNow:                  z.string().optional().nullable(),
  strategicRelevance:      z.string().optional().nullable(),
  sustainabilityRelevance: z.string().optional().nullable(),
  dataMoatPotential:       z.string().optional().nullable(),
  founderNotes:            z.string().optional().nullable(),
};

// ── Assumption fields ─────────────────────────────────────────────────────────
const assumptionFields = {
  assumptionTitle:      z.string().min(1),
  assumptionStatement:  z.string().min(1),
  assumptionCategory:   z.string().optional().nullable(),
  importanceScore:      z.number().min(1).max(5).default(3),
  uncertaintyScore:     z.number().min(1).max(5).default(3),
  evidenceExists:       z.boolean().default(false),
  evidenceSummary:      z.string().optional().nullable(),
  riskLevel:            z.string().optional().nullable(),
};

// ── Riskiest fields ───────────────────────────────────────────────────────────
const riskiestFields = {
  assumptionStatement:        z.string().min(1),
  assumptionId:               z.number().optional().nullable(),
  hypothesisId:               z.number().optional().nullable(),
  reasonItIsRisky:            z.string().optional().nullable(),
  impactIfFalse:              z.string().optional().nullable(),
  evidenceRequired:           z.string().optional().nullable(),
  proposedTest:               z.string().optional().nullable(),
  testPriorityScore:          z.number().min(0).max(100).default(0),
  recommendedFirstExperiment: z.string().optional().nullable(),
};

// ── Decision fields ───────────────────────────────────────────────────────────
const decisionFields = {
  decisionType:               z.string().optional().nullable(),
  decisionSummary:            z.string().optional().nullable(),
  readinessScore:             z.number().min(0).max(100).default(0),
  assumptionRiskScore:        z.number().min(0).max(100).default(0),
  strategicFitScore:          z.number().min(0).max(100).default(0),
  evidenceGapSummary:         z.string().optional().nullable(),
  recommendedNextModule:      z.string().optional().nullable(),
  recommendedFirstExperiment: z.string().optional().nullable(),
  decisionStatus:             z.string().default("pending_review"),
  reviewerNotes:              z.string().optional().nullable(),
};

// ── Risk level calculator ─────────────────────────────────────────────────────
function deriveRiskLevel(importance: number, uncertainty: number): string {
  const score = importance * uncertainty;
  if (score >= 19) return "critical";
  if (score >= 11) return "high";
  if (score >= 6)  return "medium";
  return "low";
}

export const intakeRouter = router({
  // ── Ideas ──────────────────────────────────────────────────────────────────
  ideas: router({
    list: publicProcedure.input(vid).query(async ({ input }) => {
      const d = await getDb();
      if (!d) return [];
      return d.select().from(viIdeas).where(eq(viIdeas.ventureId, input.ventureId)).orderBy(desc(viIdeas.updatedAt));
    }),

    upsert: publicProcedure.input(z.object({ id: z.number().optional(), ventureId: z.string(), ...ideaFields })).mutation(async ({ input }) => {
      const d = await getDb();
      if (!d) throw new Error("DB unavailable");
      const { id, ventureId, ...fields } = input;
      const now = new Date();
      if (id) {
        await d.update(viIdeas).set({ ...fields, updatedAt: now }).where(eq(viIdeas.id, id));
        return { id };
      }
      const [row] = await d.insert(viIdeas).values({ ventureId, ...fields, createdAt: now, updatedAt: now }).returning({ id: viIdeas.id });
      return row;
    }),

    delete: publicProcedure.input(idInput).mutation(async ({ input }) => {
      const d = await getDb();
      if (!d) throw new Error("DB unavailable");
      await d.delete(viIdeas).where(eq(viIdeas.id, input.id));
    }),
  }),

  // ── Assumptions ────────────────────────────────────────────────────────────
  assumptions: router({
    list: publicProcedure.input(vid).query(async ({ input }) => {
      const d = await getDb();
      if (!d) return [];
      return d.select().from(viAssumptions).where(eq(viAssumptions.ventureId, input.ventureId)).orderBy(desc(viAssumptions.updatedAt));
    }),

    upsert: publicProcedure.input(z.object({ id: z.number().optional(), ventureId: z.string(), ...assumptionFields })).mutation(async ({ input }) => {
      const d = await getDb();
      if (!d) throw new Error("DB unavailable");
      const { id, ventureId, importanceScore = 3, uncertaintyScore = 3, ...rest } = input;
      const riskLevel = deriveRiskLevel(importanceScore, uncertaintyScore);
      const now = new Date();
      if (id) {
        await d.update(viAssumptions).set({ ...rest, importanceScore, uncertaintyScore, riskLevel, updatedAt: now }).where(eq(viAssumptions.id, id));
        return { id };
      }
      const [row] = await d.insert(viAssumptions).values({ ventureId, ...rest, importanceScore, uncertaintyScore, riskLevel, createdAt: now, updatedAt: now }).returning({ id: viAssumptions.id });
      return row;
    }),

    delete: publicProcedure.input(idInput).mutation(async ({ input }) => {
      const d = await getDb();
      if (!d) throw new Error("DB unavailable");
      await d.delete(viAssumptions).where(eq(viAssumptions.id, input.id));
    }),

    convertToHypothesis: publicProcedure.input(idInput).mutation(async ({ input }) => {
      const d = await getDb();
      if (!d) throw new Error("DB unavailable");
      const [a] = await d.select().from(viAssumptions).where(eq(viAssumptions.id, input.id));
      if (!a) throw new Error("Assumption not found");
      const typeMap: Record<string, string> = {
        customer: "customer_segment",
        problem: "problem",
        value_proposition: "value_proposition",
        solution: "solution",
        pricing: "pricing",
        channel: "channel",
        technical: "solution",
        manufacturing: "operational",
        supply_chain: "operational",
        sustainability: "sustainability",
        regulatory: "regulatory",
        data_access: "data_access",
        operations: "operational",
        investment: "business_model",
      };
      const hypothesisType = typeMap[a.assumptionCategory ?? ""] ?? "problem";
      const [row] = await d.insert(ccHypotheses).values({
        ventureId: a.ventureId,
        moduleSource: "venture_intake",
        hypothesisType,
        hypothesisStatement: `We believe that ${a.assumptionStatement}`,
        assumptionRiskLevel: a.riskLevel ?? "medium",
        status: "untested",
        confidenceScore: 0,
      }).returning({ id: ccHypotheses.id });
      return row;
    }),
  }),

  // ── Hypotheses (via cc_hypotheses with moduleSource filter) ─────────────────
  hypotheses: router({
    list: publicProcedure.input(vid).query(async ({ input }) => {
      const d = await getDb();
      if (!d) return [];
      return d.select().from(ccHypotheses)
        .where(and(eq(ccHypotheses.ventureId, input.ventureId), eq(ccHypotheses.moduleSource, "venture_intake")))
        .orderBy(desc(ccHypotheses.updatedAt));
    }),

    upsert: publicProcedure.input(z.object({
      id: z.number().optional(),
      ventureId: z.string(),
      hypothesisType: z.string(),
      hypothesisStatement: z.string().min(1),
      assumptionRiskLevel: z.string().optional().nullable(),
      status: z.string().default("untested"),
      evidenceSummary: z.string().optional().nullable(),
    })).mutation(async ({ input }) => {
      const d = await getDb();
      if (!d) throw new Error("DB unavailable");
      const { id, ventureId, ...fields } = input;
      const now = new Date();
      if (id) {
        await d.update(ccHypotheses).set({ ...fields, updatedAt: now }).where(eq(ccHypotheses.id, id));
        return { id };
      }
      const [row] = await d.insert(ccHypotheses).values({ ventureId, moduleSource: "venture_intake", ...fields, createdAt: now, updatedAt: now }).returning({ id: ccHypotheses.id });
      return row;
    }),

    delete: publicProcedure.input(idInput).mutation(async ({ input }) => {
      const d = await getDb();
      if (!d) throw new Error("DB unavailable");
      await d.delete(ccHypotheses).where(eq(ccHypotheses.id, input.id));
    }),
  }),

  // ── Riskiest Assumptions ────────────────────────────────────────────────────
  riskiest: router({
    list: publicProcedure.input(vid).query(async ({ input }) => {
      const d = await getDb();
      if (!d) return [];
      return d.select().from(viRiskiest).where(eq(viRiskiest.ventureId, input.ventureId)).orderBy(desc(viRiskiest.testPriorityScore));
    }),

    upsert: publicProcedure.input(z.object({ id: z.number().optional(), ventureId: z.string(), ...riskiestFields })).mutation(async ({ input }) => {
      const d = await getDb();
      if (!d) throw new Error("DB unavailable");
      const { id, ventureId, ...fields } = input;
      const now = new Date();
      if (id) {
        await d.update(viRiskiest).set({ ...fields, updatedAt: now }).where(eq(viRiskiest.id, id));
        return { id };
      }
      const [row] = await d.insert(viRiskiest).values({ ventureId, ...fields, createdAt: now, updatedAt: now }).returning({ id: viRiskiest.id });
      return row;
    }),

    delete: publicProcedure.input(idInput).mutation(async ({ input }) => {
      const d = await getDb();
      if (!d) throw new Error("DB unavailable");
      await d.delete(viRiskiest).where(eq(viRiskiest.id, input.id));
    }),

    createExperiment: publicProcedure.input(idInput).mutation(async ({ input }) => {
      const d = await getDb();
      if (!d) throw new Error("DB unavailable");
      const [r] = await d.select().from(viRiskiest).where(eq(viRiskiest.id, input.id));
      if (!r) throw new Error("Riskiest assumption not found");
      const [row] = await d.insert(ccExperiments).values({
        ventureId: r.ventureId,
        hypothesisId: r.hypothesisId ?? undefined,
        experimentName: r.recommendedFirstExperiment ?? `Riskiest Assumption Test — ${r.assumptionStatement.slice(0, 60)}`,
        experimentType: "customer_interview",
        moduleSource: "venture_intake",
        experimentStatus: "proposed",
        method: r.proposedTest ?? undefined,
        successThreshold: r.evidenceRequired ?? undefined,
      }).returning({ id: ccExperiments.id });
      return row;
    }),
  }),

  // ── Intake Decisions ────────────────────────────────────────────────────────
  decisions: router({
    get: publicProcedure.input(vid).query(async ({ input }) => {
      const d = await getDb();
      if (!d) return null;
      const rows = await d.select().from(viDecisions).where(eq(viDecisions.ventureId, input.ventureId)).orderBy(desc(viDecisions.updatedAt)).limit(1);
      return rows[0] ?? null;
    }),

    upsert: publicProcedure.input(z.object({ id: z.number().optional(), ventureId: z.string(), ...decisionFields })).mutation(async ({ input }) => {
      const d = await getDb();
      if (!d) throw new Error("DB unavailable");
      const { id, ventureId, ...fields } = input;
      const now = new Date();
      if (id) {
        await d.update(viDecisions).set({ ...fields, updatedAt: now }).where(eq(viDecisions.id, id));
        return { id };
      }
      const [row] = await d.insert(viDecisions).values({ ventureId, ...fields, createdAt: now, updatedAt: now }).returning({ id: viDecisions.id });
      return row;
    }),

    approve: publicProcedure.input(z.object({ id: z.number(), ventureId: z.string(), decisionType: z.string() })).mutation(async ({ input }) => {
      const d = await getDb();
      if (!d) throw new Error("DB unavailable");
      const stageMap: Record<string, { stage: string; status: string }> = {
        reject:                       { stage: "intake",              status: "killed" },
        archive:                      { stage: "intake",              status: "archived" },
        research_more:                { stage: "intake",              status: "idea" },
        begin_customer_discovery:     { stage: "problem_validation",  status: "validating" },
        begin_market_discovery:       { stage: "problem_validation",  status: "validating" },
        create_experiment:            { stage: "problem_validation",  status: "validating" },
        pivot_before_discovery:       { stage: "intake",              status: "pivoting" },
        proceed_to_discovery_and_market: { stage: "problem_validation", status: "validating" },
      };
      const mapped = stageMap[input.decisionType] ?? { stage: "intake", status: "idea" };
      const now = new Date();
      await d.update(viDecisions).set({ decisionStatus: "approved", updatedAt: now }).where(eq(viDecisions.id, input.id));
      await d.update(ventures).set({ currentStage: mapped.stage, validationStatus: mapped.status, updatedAt: now }).where(eq(ventures.id, input.ventureId));
    }),
  }),

  // ── Intake Readiness Score ──────────────────────────────────────────────────
  readiness: router({
    score: publicProcedure.input(vid).query(async ({ input }) => {
      const d = await getDb();
      if (!d) return { total: 0, breakdown: {}, label: "Not ready", readyForDiscovery: false };

      const [ideas, assumptions, hypotheses, riskiest, decision, venture] = await Promise.all([
        d.select().from(viIdeas).where(eq(viIdeas.ventureId, input.ventureId)),
        d.select().from(viAssumptions).where(eq(viAssumptions.ventureId, input.ventureId)),
        d.select().from(ccHypotheses).where(and(eq(ccHypotheses.ventureId, input.ventureId), eq(ccHypotheses.moduleSource, "venture_intake"))),
        d.select().from(viRiskiest).where(eq(viRiskiest.ventureId, input.ventureId)),
        d.select().from(viDecisions).where(eq(viDecisions.ventureId, input.ventureId)).orderBy(desc(viDecisions.updatedAt)).limit(1),
        d.select().from(ventures).where(eq(ventures.id, input.ventureId)).limit(1),
      ]);

      const topIdea = ideas[0];
      const ideaFields = topIdea ? [topIdea.ideaSummary, topIdea.targetCustomer, topIdea.problemArea, topIdea.proposedSolution, topIdea.whyNow, topIdea.strategicRelevance] : [];
      const ideaCompleteness = topIdea ? (ideaFields.filter(Boolean).length / ideaFields.length) * 100 : 0;

      const segmentHyps = hypotheses.filter(h => h.hypothesisType === "customer_segment");
      const segmentClarity = segmentHyps.length > 0 ? 80 : 0;

      const problemHyps = hypotheses.filter(h => h.hypothesisType === "problem");
      const problemDefinition = problemHyps.length > 0 ? 80 : assumptions.filter(a => a.assumptionCategory === "problem").length > 0 ? 40 : 0;

      const vpHyps = hypotheses.filter(h => h.hypothesisType === "value_proposition");
      const vpQuality = vpHyps.length > 0 ? 80 : assumptions.filter(a => a.assumptionCategory === "value_proposition").length > 0 ? 40 : 0;

      const bmHyps = hypotheses.filter(h => h.hypothesisType === "business_model");
      const bmReadiness = bmHyps.length > 0 ? 80 : assumptions.filter(a => a.assumptionCategory === "pricing" || a.assumptionCategory === "channel").length > 0 ? 40 : 0;

      const riskiestDefined = riskiest.length > 0 ? 100 : 0;

      const total = Math.round(
        ideaCompleteness    * 0.15 +
        segmentClarity      * 0.15 +
        problemDefinition   * 0.20 +
        vpQuality           * 0.15 +
        bmReadiness         * 0.10 +
        riskiestDefined     * 0.15 +
        (hypotheses.length > 0 ? 60 : 0) * 0.10
      );

      const criticalAssumptions = assumptions.filter(a => a.riskLevel === "critical" && !a.evidenceExists);
      const label = total >= 80 ? "Strong intake package"
        : total >= 60 ? "Ready for initial discovery"
        : total >= 40 ? "Needs more definition"
        : "Not ready";

      return {
        total,
        label,
        readyForDiscovery: total >= 60 && criticalAssumptions.length === 0,
        hasCriticalUntested: criticalAssumptions.length > 0,
        breakdown: {
          ideaCompleteness: Math.round(ideaCompleteness),
          segmentClarity:   Math.round(segmentClarity),
          problemDefinition: Math.round(problemDefinition),
          vpQuality:        Math.round(vpQuality),
          bmReadiness:      Math.round(bmReadiness),
          riskiestDefined:  Math.round(riskiestDefined),
        },
        counts: {
          ideas:       ideas.length,
          assumptions: assumptions.length,
          hypotheses:  hypotheses.length,
          riskiest:    riskiest.length,
          criticalUntested: criticalAssumptions.length,
          highRisk:    assumptions.filter(a => (a.importanceScore ?? 0) * (a.uncertaintyScore ?? 0) >= 11).length,
        },
        currentDecision: decision[0] ?? null,
        currentStage: venture[0]?.currentStage ?? null,
        currentStatus: venture[0]?.validationStatus ?? null,
      };
    }),
  }),
});
