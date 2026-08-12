// ============================================================================
// PROPOSITION & MODEL ROUTER — Lean evidence layer (Module 4)
// Tables: pm_value_propositions, pm_jtbd, pm_bm_hypotheses,
//         pm_revenue_tests, pm_unit_economics, pm_risks
// Reuses: pivot_log, cc_hypotheses, lean_canvases
// ============================================================================
import { z } from "zod";
import { eq, desc, and, avg, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  pmValuePropositions, pmJtbd, pmBmHypotheses, pmRevenueTests,
  pmUnitEconomics, pmRisks, pivotLog, ventures, leanCanvases,
} from "../drizzle/schema";
import { ccHypotheses } from "../drizzle/schema_cc";

const vid = z.object({ ventureId: z.string() });
const idInput = z.object({ id: z.number() });

// ─── Helper: Risk score ──────────────────────────────────────────────────────
function riskScore(p: number, s: number, e: number) { return p * s * e; }

// ─── VP Scoring ──────────────────────────────────────────────────────────────
function vpQualityScore(vp: any): number {
  let s = 0;
  if (vp.customerJob?.trim())       s += 20;
  if (vp.painsRelieved?.trim())     s += 20;
  if (vp.gainsCreated?.trim())      s += 20;
  if (vp.measurableOutcome?.trim()) s += 25;
  if (vp.evidenceRequired?.trim())  s += 15;
  return s;
}

// ─── BM Readiness Score ───────────────────────────────────────────────────────
function bmReadinessScore(bm: any): number {
  let s = 0;
  if (bm.revenueModel?.trim())          s += 15;
  if (bm.pricingAssumption?.trim())     s += 15;
  if (bm.deliveryModel?.trim())         s += 15;
  if (bm.salesChannel?.trim())          s += 15;
  if (bm.costDrivers?.trim())           s += 10;
  if (bm.scalabilityAssumption?.trim()) s += 10;
  if (bm.evidenceRequired?.trim())      s += 20;
  return s;
}

// ─── Unit Econ Score ─────────────────────────────────────────────────────────
const CONF_MAP: Record<string, number> = {
  assumption_only: 1, early_estimate: 2, partially_validated: 3, validated: 4, high_confidence: 5,
};
function ueScore(ue: any): number {
  let s = 0;
  if (ue.customerAcquisitionCost != null) s += 15;
  if (ue.lifetimeValue != null)           s += 15;
  if (ue.grossMarginPct != null)          s += 20;
  if (ue.deliveryCost != null)            s += 15;
  if (ue.expectedPaybackMonths != null)   s += 15;
  const cm = (CONF_MAP[ue.confidenceLevel ?? "assumption_only"] ?? 1) / 5;
  s += cm * 20;
  return Math.round(Math.min(100, s));
}

// ─── JTBD Opportunity Score ──────────────────────────────────────────────────
function jtbdOppScore(imp: number, sat: number): number {
  const raw = imp + (imp - sat);
  return Math.min(100, Math.max(0, Math.round((raw + 3) / 12 * 100)));
}

export const propositionRouter = router({
  // ── Value Propositions ─────────────────────────────────────────────────────
  vp: router({
    list: publicProcedure.input(vid).query(async ({ input }) => {
      const d = await getDb(); if (!d) return [];
      return d.select().from(pmValuePropositions).where(eq(pmValuePropositions.ventureId, input.ventureId)).orderBy(desc(pmValuePropositions.updatedAt));
    }),
    upsert: publicProcedure.input(z.object({
      id: z.number().optional(), ventureId: z.string(),
      title: z.string().min(1), statement: z.string().min(1),
      customerJob: z.string().optional().nullable(), painsRelieved: z.string().optional().nullable(),
      gainsCreated: z.string().optional().nullable(), measurableOutcome: z.string().optional().nullable(),
      differentiationClaim: z.string().optional().nullable(), evidenceRequired: z.string().optional().nullable(),
      productsServices: z.string().optional().nullable(), currentAlternatives: z.string().optional().nullable(),
      buyingTriggers: z.string().optional().nullable(), adoptionBarriers: z.string().optional().nullable(),
      status: z.string().default("draft"),
      segmentHypothesisId: z.number().optional().nullable(),
      problemHypothesisId: z.number().optional().nullable(),
    })).mutation(async ({ input }) => {
      const d = await getDb(); if (!d) throw new Error("DB unavailable");
      const { id, ventureId, ...fields } = input;
      const confidenceScore = vpQualityScore(fields);
      const now = new Date();
      if (id) { await d.update(pmValuePropositions).set({ ...fields, confidenceScore, updatedAt: now }).where(eq(pmValuePropositions.id, id)); return { id }; }
      const [row] = await d.insert(pmValuePropositions).values({ ventureId, ...fields, confidenceScore, createdAt: now, updatedAt: now }).returning({ id: pmValuePropositions.id });
      return row;
    }),
    delete: protectedProcedure.input(idInput).mutation(async ({ input }) => {
      const d = await getDb(); if (!d) throw new Error("DB unavailable");
      await d.delete(pmValuePropositions).where(eq(pmValuePropositions.id, input.id));
    }),
  }),

  // ── Jobs-to-be-Done ────────────────────────────────────────────────────────
  jtbd: router({
    list: publicProcedure.input(vid).query(async ({ input }) => {
      const d = await getDb(); if (!d) return [];
      return d.select().from(pmJtbd).where(eq(pmJtbd.ventureId, input.ventureId)).orderBy(desc(pmJtbd.opportunityScore));
    }),
    upsert: publicProcedure.input(z.object({
      id: z.number().optional(), ventureId: z.string(),
      jobTitle: z.string().min(1), jobStatement: z.string().min(1),
      functionalJob: z.string().optional().nullable(), emotionalJob: z.string().optional().nullable(),
      socialJob: z.string().optional().nullable(), currentSolution: z.string().optional().nullable(),
      desiredOutcome: z.string().optional().nullable(), outcomeMetric: z.string().optional().nullable(),
      importanceScore: z.number().min(1).max(5).default(3),
      satisfactionScore: z.number().min(1).max(5).default(3),
      evidenceSummary: z.string().optional().nullable(), status: z.string().default("untested"),
    })).mutation(async ({ input }) => {
      const d = await getDb(); if (!d) throw new Error("DB unavailable");
      const { id, ventureId, importanceScore = 3, satisfactionScore = 3, ...fields } = input;
      const opportunityScore = jtbdOppScore(importanceScore, satisfactionScore);
      const now = new Date();
      if (id) { await d.update(pmJtbd).set({ ...fields, importanceScore, satisfactionScore, opportunityScore, updatedAt: now }).where(eq(pmJtbd.id, id)); return { id }; }
      const [row] = await d.insert(pmJtbd).values({ ventureId, ...fields, importanceScore, satisfactionScore, opportunityScore, createdAt: now, updatedAt: now }).returning({ id: pmJtbd.id });
      return row;
    }),
    delete: protectedProcedure.input(idInput).mutation(async ({ input }) => {
      const d = await getDb(); if (!d) throw new Error("DB unavailable");
      await d.delete(pmJtbd).where(eq(pmJtbd.id, input.id));
    }),
  }),

  // ── Business Model Hypotheses ──────────────────────────────────────────────
  bm: router({
    list: publicProcedure.input(vid).query(async ({ input }) => {
      const d = await getDb(); if (!d) return [];
      return d.select().from(pmBmHypotheses).where(eq(pmBmHypotheses.ventureId, input.ventureId)).orderBy(desc(pmBmHypotheses.updatedAt));
    }),
    upsert: publicProcedure.input(z.object({
      id: z.number().optional(), ventureId: z.string(), valuePropositionId: z.number().optional().nullable(),
      revenueModel: z.string().optional().nullable(), pricingAssumption: z.string().optional().nullable(),
      deliveryModel: z.string().optional().nullable(), salesChannel: z.string().optional().nullable(),
      costDrivers: z.string().optional().nullable(), keyPartners: z.string().optional().nullable(),
      scalabilityAssumption: z.string().optional().nullable(), unfairAdvantage: z.string().optional().nullable(),
      dataMoatAssumption: z.string().optional().nullable(), sustainabilityAssumption: z.string().optional().nullable(),
      evidenceRequired: z.string().optional().nullable(), testMethod: z.string().optional().nullable(),
      successMetric: z.string().optional().nullable(), status: z.string().default("draft"),
    })).mutation(async ({ input }) => {
      const d = await getDb(); if (!d) throw new Error("DB unavailable");
      const { id, ventureId, ...fields } = input;
      const confidenceScore = bmReadinessScore(fields);
      const now = new Date();
      if (id) { await d.update(pmBmHypotheses).set({ ...fields, confidenceScore, updatedAt: now }).where(eq(pmBmHypotheses.id, id)); return { id }; }
      const [row] = await d.insert(pmBmHypotheses).values({ ventureId, ...fields, confidenceScore, createdAt: now, updatedAt: now }).returning({ id: pmBmHypotheses.id });
      return row;
    }),
    delete: protectedProcedure.input(idInput).mutation(async ({ input }) => {
      const d = await getDb(); if (!d) throw new Error("DB unavailable");
      await d.delete(pmBmHypotheses).where(eq(pmBmHypotheses.id, input.id));
    }),
  }),

  // ── Revenue Model Tests ────────────────────────────────────────────────────
  revenue: router({
    list: publicProcedure.input(vid).query(async ({ input }) => {
      const d = await getDb(); if (!d) return [];
      return d.select().from(pmRevenueTests).where(eq(pmRevenueTests.ventureId, input.ventureId)).orderBy(desc(pmRevenueTests.updatedAt));
    }),
    upsert: publicProcedure.input(z.object({
      id: z.number().optional(), ventureId: z.string(), bmHypothesisId: z.number().optional().nullable(),
      revenueModelTested: z.string().optional().nullable(), testMethod: z.string().optional().nullable(),
      targetSegment: z.string().optional().nullable(), pricePointTested: z.string().optional().nullable(),
      valueMetric: z.string().optional().nullable(), expectedBehaviour: z.string().optional().nullable(),
      sampleSize: z.number().default(0), positiveResponses: z.number().default(0),
      negativeResponses: z.number().default(0), conversionRate: z.number().default(0),
      revenueSignalScore: z.number().default(0), learningSummary: z.string().optional().nullable(),
      recommendedNextTest: z.string().optional().nullable(), status: z.string().default("planned"),
    })).mutation(async ({ input }) => {
      const d = await getDb(); if (!d) throw new Error("DB unavailable");
      const { id, ventureId, ...fields } = input;
      const now = new Date();
      if (id) { await d.update(pmRevenueTests).set({ ...fields, updatedAt: now }).where(eq(pmRevenueTests.id, id)); return { id }; }
      const [row] = await d.insert(pmRevenueTests).values({ ventureId, ...fields, createdAt: now, updatedAt: now }).returning({ id: pmRevenueTests.id });
      return row;
    }),
    delete: protectedProcedure.input(idInput).mutation(async ({ input }) => {
      const d = await getDb(); if (!d) throw new Error("DB unavailable");
      await d.delete(pmRevenueTests).where(eq(pmRevenueTests.id, input.id));
    }),
  }),

  // ── Unit Economics ─────────────────────────────────────────────────────────
  unitEcon: router({
    list: publicProcedure.input(vid).query(async ({ input }) => {
      const d = await getDb(); if (!d) return [];
      return d.select().from(pmUnitEconomics).where(eq(pmUnitEconomics.ventureId, input.ventureId)).orderBy(desc(pmUnitEconomics.updatedAt));
    }),
    upsert: publicProcedure.input(z.object({
      id: z.number().optional(), ventureId: z.string(), bmHypothesisId: z.number().optional().nullable(),
      modelName: z.string().min(1),
      customerAcquisitionCost: z.number().optional().nullable(), lifetimeValue: z.number().optional().nullable(),
      grossMarginPct: z.number().optional().nullable(), contributionMargin: z.number().optional().nullable(),
      deliveryCost: z.number().optional().nullable(), supportCost: z.number().optional().nullable(),
      setupCost: z.number().optional().nullable(), expectedPaybackMonths: z.number().optional().nullable(),
      averageContractValue: z.number().optional().nullable(), expectedChurnRate: z.number().optional().nullable(),
      repeatPurchaseRate: z.number().optional().nullable(),
      assumptionsSummary: z.string().optional().nullable(),
      confidenceLevel: z.string().default("assumption_only"),
    })).mutation(async ({ input }) => {
      const d = await getDb(); if (!d) throw new Error("DB unavailable");
      const { id, ventureId, ...fields } = input;
      const now = new Date();
      if (id) { await d.update(pmUnitEconomics).set({ ...fields, updatedAt: now }).where(eq(pmUnitEconomics.id, id)); return { id }; }
      const [row] = await d.insert(pmUnitEconomics).values({ ventureId, ...fields, createdAt: now, updatedAt: now }).returning({ id: pmUnitEconomics.id });
      return row;
    }),
    delete: protectedProcedure.input(idInput).mutation(async ({ input }) => {
      const d = await getDb(); if (!d) throw new Error("DB unavailable");
      await d.delete(pmUnitEconomics).where(eq(pmUnitEconomics.id, input.id));
    }),
  }),

  // ── Proposition Risks ──────────────────────────────────────────────────────
  risks: router({
    list: publicProcedure.input(vid).query(async ({ input }) => {
      const d = await getDb(); if (!d) return [];
      return d.select().from(pmRisks).where(eq(pmRisks.ventureId, input.ventureId)).orderBy(desc(pmRisks.riskScore));
    }),
    upsert: publicProcedure.input(z.object({
      id: z.number().optional(), ventureId: z.string(),
      riskTitle: z.string().min(1), riskCategory: z.string().optional().nullable(),
      riskDescription: z.string().optional().nullable(),
      probabilityScore: z.number().min(1).max(5).default(3),
      severityScore: z.number().min(1).max(5).default(3),
      evidenceConfidenceScore: z.number().min(1).max(5).default(3),
      mitigationPlan: z.string().optional().nullable(), requiredExperiment: z.string().optional().nullable(),
      owner: z.string().optional().nullable(), reviewDate: z.string().optional().nullable(),
      status: z.string().default("open"),
      linkedRecordType: z.string().optional().nullable(), linkedRecordId: z.number().optional().nullable(),
    })).mutation(async ({ input }) => {
      const d = await getDb(); if (!d) throw new Error("DB unavailable");
      const { id, ventureId, probabilityScore = 3, severityScore = 3, evidenceConfidenceScore = 3, ...fields } = input;
      const rs = riskScore(probabilityScore, severityScore, evidenceConfidenceScore);
      const now = new Date();
      if (id) { await d.update(pmRisks).set({ ...fields, probabilityScore, severityScore, evidenceConfidenceScore, riskScore: rs, updatedAt: now }).where(eq(pmRisks.id, id)); return { id }; }
      const [row] = await d.insert(pmRisks).values({ ventureId, ...fields, probabilityScore, severityScore, evidenceConfidenceScore, riskScore: rs, createdAt: now, updatedAt: now }).returning({ id: pmRisks.id });
      return row;
    }),
    delete: protectedProcedure.input(idInput).mutation(async ({ input }) => {
      const d = await getDb(); if (!d) throw new Error("DB unavailable");
      await d.delete(pmRisks).where(eq(pmRisks.id, input.id));
    }),
  }),

  // ── Pivot History (reuses pivot_log table) ─────────────────────────────────
  pivots: router({
    list: publicProcedure.input(vid).query(async ({ input }) => {
      const d = await getDb(); if (!d) return [];
      return d.select().from(pivotLog).where(eq(pivotLog.ventureId, input.ventureId)).orderBy(desc(pivotLog.createdAt));
    }),
    create: publicProcedure.input(z.object({
      ventureId: z.string(), pivotType: z.string(),
      previousHypothesis: z.string().optional().nullable(),
      newHypothesis: z.string().optional().nullable(),
      triggerEvent: z.string().optional().nullable(),
      loggedBy: z.string().optional().nullable(),
      canvasVersion: z.number().optional().nullable(),
    })).mutation(async ({ input }) => {
      const d = await getDb(); if (!d) throw new Error("DB unavailable");
      const [row] = await d.insert(pivotLog).values({ ...input }).returning({ id: pivotLog.id });
      return row;
    }),
  }),

  // ── Proposition Readiness Score ─────────────────────────────────────────────
  readiness: router({
    score: publicProcedure.input(vid).query(async ({ input }) => {
      const d = await getDb();
      if (!d) return { total: 0, label: "Not ready", breakdown: {}, counts: {} };

      const [vps, jtbds, bms, revTests, ues, risks, canvas] = await Promise.all([
        d.select().from(pmValuePropositions).where(eq(pmValuePropositions.ventureId, input.ventureId)),
        d.select().from(pmJtbd).where(eq(pmJtbd.ventureId, input.ventureId)),
        d.select().from(pmBmHypotheses).where(eq(pmBmHypotheses.ventureId, input.ventureId)),
        d.select().from(pmRevenueTests).where(eq(pmRevenueTests.ventureId, input.ventureId)),
        d.select().from(pmUnitEconomics).where(eq(pmUnitEconomics.ventureId, input.ventureId)),
        d.select().from(pmRisks).where(eq(pmRisks.ventureId, input.ventureId)),
        d.select().from(leanCanvases).where(eq(leanCanvases.ventureId, input.ventureId)).orderBy(desc(leanCanvases.version)).limit(1),
      ]);

      const bestVP = vps.length > 0 ? Math.max(...vps.map(vpQualityScore)) : 0;
      const bestJTBD = jtbds.length > 0 ? Math.max(...jtbds.map((j: any) => j.opportunityScore ?? 0)) : 0;
      const bestBM = bms.length > 0 ? Math.max(...bms.map(bmReadinessScore)) : 0;
      const bestRevTest = revTests.length > 0 ? Math.max(...revTests.map((r: any) => {
        let s = (r.conversionRate ?? 0) * 0.4 + (r.revenueSignalScore ?? 0) * 0.6;
        if ((r.sampleSize ?? 0) < 5) s = Math.min(s, 50);
        return Math.round(s);
      })) : 0;
      const bestUE = ues.length > 0 ? Math.max(...ues.map(ueScore)) : 0;
      const avgRisk = risks.length > 0 ? Math.round(risks.reduce((s: number, r: any) => s + (r.riskScore ?? 27), 0) / risks.length) : 27;
      const inverseRisk = Math.max(0, (1 - avgRisk / 125)) * 100;

      const total = Math.round(
        bestVP         * 0.20 +
        bestJTBD       * 0.15 +
        bestBM         * 0.20 +
        bestRevTest    * 0.20 +
        bestUE         * 0.15 +
        inverseRisk    * 0.10
      );

      const label = total >= 80 ? "Strong proposition/model readiness"
        : total >= 60 ? "Ready for limited MVP definition"
        : total >= 40 ? "Needs more model validation"
        : "Not ready";

      const criticalRisks = risks.filter((r: any) => (r.riskScore ?? 0) >= 76);
      const noMeasurableOutcome = !vps.some((v: any) => v.measurableOutcome?.trim());

      return {
        total, label,
        canProceedToRnd: total >= 60 && criticalRisks.length === 0 && jtbds.length > 0 && !noMeasurableOutcome,
        breakdown: {
          vpQuality:       Math.round(bestVP),
          jtbdClarity:     Math.round(bestJTBD),
          bmReadiness:     Math.round(bestBM),
          revenueEvidence: Math.round(bestRevTest),
          unitEconConf:    Math.round(bestUE),
          riskScore:       Math.round(avgRisk),
          canvasVersion:   canvas[0]?.version ?? 0,
        },
        overrides: {
          noJtbd:              jtbds.length === 0,
          noMeasurableOutcome,
          hasCriticalRisks:    criticalRisks.length > 0,
        },
        counts: {
          vps:         vps.length,
          jtbds:       jtbds.length,
          bms:         bms.length,
          revTests:    revTests.length,
          ues:         ues.length,
          risks:       risks.length,
          criticalRisks: criticalRisks.length,
          pivots:      0,
          canvasVersion: canvas[0]?.version ?? 0,
        },
      };
    }),
  }),
});
