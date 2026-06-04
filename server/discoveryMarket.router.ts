/**
 * Module 3 — Discovery & Market (Lean Startup Evidence Engine)
 * CRUD + scoring + server-side auto-risk creation + module summary.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { and, eq, desc } from "drizzle-orm";
import type { User } from "../drizzle/schema";
import {
  ventures,
  ventureMembers,
  customerSegments,
  problemHypotheses,
  customerInterviews,
  dmCompetitors,
  demandSignals,
  wtpTests,
  marketRisks,
  leanExperiments,
} from "../drizzle/schema";
import {
  calculateCustomerDiscoveryScore,
  calculateCompetitiveRiskScore,
  calculateDemandSignalScore,
  calculateWTPScore,
  calculateMarketRiskScore,
  calculateOverallDiscoveryMarketConfidence,
  generateLeanDecision,
  generateNextExperimentRecommendation,
  autoRisksForInterview,
  autoRisksForCompetitor,
  autoRisksForDemandSignal,
  autoRisksForWTP,
  marketRiskDecisionWarnings,
  normaliseOpenMarketRisk,
  avg,
  PROBLEM_HYPOTHESIS_STATUSES,
  WTP_SIGNAL_OPTIONS,
  COMPETITOR_TYPES,
  SIGNAL_TYPES,
  RISK_CATEGORIES,
  RISK_STATUSES,
  EXPERIMENT_TYPES,
  INTERVIEW_TYPES,
  type AutoRiskSpec,
} from "@shared/discoveryMarket";

function db() {
  return getDb().then((d) => {
    if (!d) throw new Error("DB unavailable");
    return d;
  });
}

// ─── Auth / venture access ──────────────────────────────────────────────────────
// App auth model: read paths stay public (anyone may view evidence), but every
// create/update/delete on venture evidence and risks requires an authenticated
// user who is authorised for the target venture.
//
// Authorisation rules (see `assertVentureAccess`):
//   1. The target venture must exist (else NOT_FOUND).
//   2. Admins (user.role === "admin") may edit any venture.
//   3. A user listed in `venture_members` for that venture may edit it.
//   4. An "unclaimed" venture (no members yet) is claimed by the first
//      authenticated editor on first write; everyone else is then FORBIDDEN.
//      This keeps legacy ventures (created before access control existed) usable
//      without locking everyone out, while still scoping access per user.
//
// Writes are additionally scoped with a combined `id + ventureId` predicate so a
// caller cannot reach another venture's records by guessing internal ids
// (cross-venture IDOR). `assertVentureAccess` is the single seam to extend this
// model across the rest of the app (see follow-up tasks).
const recordInput = z.object({ id: z.number(), ventureId: z.string() });

async function assertVentureExists(
  d: Awaited<ReturnType<typeof db>>,
  ventureId: string,
) {
  const [row] = await d
    .select({ id: ventures.id })
    .from(ventures)
    .where(eq(ventures.id, ventureId))
    .limit(1);
  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Venture not found" });
  }
}

export async function assertVentureAccess(
  d: Awaited<ReturnType<typeof db>>,
  user: Pick<User, "id" | "role">,
  ventureId: string,
) {
  await assertVentureExists(d, ventureId);

  if (user.role === "admin") return;

  const [membership] = await d
    .select({ id: ventureMembers.id })
    .from(ventureMembers)
    .where(and(eq(ventureMembers.ventureId, ventureId), eq(ventureMembers.userId, user.id)))
    .limit(1);
  if (membership) return;

  // Unclaimed venture: the first authenticated editor claims ownership.
  const [anyMember] = await d
    .select({ id: ventureMembers.id })
    .from(ventureMembers)
    .where(eq(ventureMembers.ventureId, ventureId))
    .limit(1);
  if (!anyMember) {
    await d
      .insert(ventureMembers)
      .values({ ventureId, userId: user.id, role: "owner" })
      .onConflictDoNothing();
    return;
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: "You do not have access to this venture",
  });
}

// Authenticated procedure that verifies the caller is authorised for the target
// venture (from the mutation input's `ventureId`) before the handler runs.
const ventureProcedure = protectedProcedure.use(async ({ ctx, next, getRawInput }) => {
  const raw = await getRawInput();
  const ventureId = (raw as { ventureId?: unknown } | null)?.ventureId;
  if (typeof ventureId !== "string" || ventureId.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "ventureId is required",
    });
  }
  await assertVentureAccess(await db(), ctx.user, ventureId);
  return next();
});

// ─── Auto-risk helper ──────────────────────────────────────────────────────────
async function syncAutoRisks(
  d: Awaited<ReturnType<typeof db>>,
  ventureId: string,
  linkedModule: string,
  linkedRecordId: number,
  specs: AutoRiskSpec[],
) {
  const existing = await d
    .select()
    .from(marketRisks)
    .where(
      and(
        eq(marketRisks.ventureId, ventureId),
        eq(marketRisks.linkedModule, linkedModule),
        eq(marketRisks.linkedRecordId, linkedRecordId),
      ),
    );
  // Only ever touch auto-generated rows — manual risks (even with a matching
  // title) are never updated or deleted by the sync engine.
  const autoExisting = existing.filter((e) => e.autoGenerated);
  const wantedTitles = new Set(specs.map((s) => s.riskTitle));

  // Remove stale auto-risks that no longer apply.
  for (const e of autoExisting) {
    if (!wantedTitles.has(e.riskTitle)) {
      await d.delete(marketRisks).where(eq(marketRisks.id, e.id));
    }
  }

  for (const spec of specs) {
    const match = autoExisting.find((e) => e.riskTitle === spec.riskTitle);
    const marketRiskScore = calculateMarketRiskScore(spec);
    if (match) {
      // Refresh all rule-derived fields so stored risk stays in sync with the
      // evidence; human-managed fields (status, mitigationPlan, owner,
      // reviewDate) are intentionally left untouched.
      await d
        .update(marketRisks)
        .set({
          riskCategory: spec.riskCategory,
          probabilityScore: spec.probabilityScore,
          severityScore: spec.severityScore,
          evidenceConfidenceScore: spec.evidenceConfidenceScore,
          requiredExperiment: spec.requiredExperiment,
          marketRiskScore,
          updatedAt: new Date(),
        })
        .where(eq(marketRisks.id, match.id));
    } else {
      await d.insert(marketRisks).values({
        ventureId,
        linkedModule,
        linkedRecordId,
        riskTitle: spec.riskTitle,
        riskCategory: spec.riskCategory,
        riskDescription: `Auto-generated from ${linkedModule}.`,
        probabilityScore: spec.probabilityScore,
        severityScore: spec.severityScore,
        evidenceConfidenceScore: spec.evidenceConfidenceScore,
        marketRiskScore,
        requiredExperiment: spec.requiredExperiment,
        status: "open",
        autoGenerated: true,
      });
    }
  }
}

const ventureInput = z.object({ ventureId: z.string() });

export const discoveryMarketRouter = router({
  // ── Customer Segments ───────────────────────────────────────────────────────
  segments: router({
    list: publicProcedure.input(ventureInput).query(async ({ input }) => {
      const d = await db();
      return d.select().from(customerSegments).where(eq(customerSegments.ventureId, input.ventureId)).orderBy(desc(customerSegments.createdAt));
    }),
    upsert: ventureProcedure
      .input(
        z.object({
          id: z.number().optional(),
          ventureId: z.string(),
          segmentName: z.string().min(1),
          buyerRole: z.string().optional(),
          userRole: z.string().optional(),
          influencerRole: z.string().optional(),
          decisionMakerRole: z.string().optional(),
          problemArea: z.string().optional(),
          currentAlternative: z.string().optional(),
          segmentNotes: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const d = await db();
        const { id, ...vals } = input;
        if (id) {
          const [updated] = await d.update(customerSegments).set({ ...vals, updatedAt: new Date() }).where(and(eq(customerSegments.id, id), eq(customerSegments.ventureId, input.ventureId))).returning({ id: customerSegments.id });
          if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
          return { id };
        }
        const [row] = await d.insert(customerSegments).values(vals).returning();
        return { id: row.id };
      }),
    delete: ventureProcedure.input(recordInput).mutation(async ({ input }) => {
      const d = await db();
      const [row] = await d.delete(customerSegments).where(and(eq(customerSegments.id, input.id), eq(customerSegments.ventureId, input.ventureId))).returning({ id: customerSegments.id });
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
      return { success: true };
    }),
  }),

  // ── Problem Hypotheses ──────────────────────────────────────────────────────
  hypotheses: router({
    list: publicProcedure.input(ventureInput).query(async ({ input }) => {
      const d = await db();
      return d.select().from(problemHypotheses).where(eq(problemHypotheses.ventureId, input.ventureId)).orderBy(desc(problemHypotheses.createdAt));
    }),
    upsert: ventureProcedure
      .input(
        z.object({
          id: z.number().optional(),
          ventureId: z.string(),
          customerSegmentId: z.number().nullable().optional(),
          hypothesisStatement: z.string().min(1),
          problemType: z.string().optional(),
          targetCustomer: z.string().optional(),
          assumedPain: z.string().optional(),
          assumedFrequency: z.string().optional(),
          assumedUrgency: z.string().optional(),
          assumedBudgetOwner: z.string().optional(),
          status: z.enum(PROBLEM_HYPOTHESIS_STATUSES).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const d = await db();
        const { id, ...vals } = input;
        if (id) {
          const [updated] = await d.update(problemHypotheses).set({ ...vals, updatedAt: new Date() }).where(and(eq(problemHypotheses.id, id), eq(problemHypotheses.ventureId, input.ventureId))).returning({ id: problemHypotheses.id });
          if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
          return { id };
        }
        const [row] = await d.insert(problemHypotheses).values(vals).returning();
        return { id: row.id };
      }),
    delete: ventureProcedure.input(recordInput).mutation(async ({ input }) => {
      const d = await db();
      const [row] = await d.delete(problemHypotheses).where(and(eq(problemHypotheses.id, input.id), eq(problemHypotheses.ventureId, input.ventureId))).returning({ id: problemHypotheses.id });
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
      return { success: true };
    }),
  }),

  // ── Customer Interviews ─────────────────────────────────────────────────────
  interviews: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string(), problemHypothesisId: z.number().optional() }))
      .query(async ({ input }) => {
        const d = await db();
        const rows = await d.select().from(customerInterviews).where(eq(customerInterviews.ventureId, input.ventureId)).orderBy(desc(customerInterviews.createdAt));
        return input.problemHypothesisId ? rows.filter((r) => r.problemHypothesisId === input.problemHypothesisId) : rows;
      }),
    upsert: ventureProcedure
      .input(
        z.object({
          id: z.number().optional(),
          ventureId: z.string(),
          customerSegmentId: z.number().nullable().optional(),
          problemHypothesisId: z.number().nullable().optional(),
          contactName: z.string().optional(),
          organisation: z.string().optional(),
          roleTitle: z.string().optional(),
          interviewDate: z.string().optional(),
          interviewType: z.enum(INTERVIEW_TYPES).optional(),
          problemMentionedUnprompted: z.boolean().optional(),
          currentWorkaround: z.string().optional(),
          painScore: z.number().min(0).max(5).optional(),
          urgencyScore: z.number().min(0).max(5).optional(),
          frequencyScore: z.number().min(0).max(5).optional(),
          budgetSignalScore: z.number().min(0).max(5).optional(),
          decisionMakerAccessScore: z.number().min(0).max(5).optional(),
          willingnessToTrial: z.boolean().optional(),
          willingnessToPaySignal: z.enum(WTP_SIGNAL_OPTIONS).optional(),
          keyQuote: z.string().optional(),
          evidenceNotes: z.string().optional(),
          contradictionNotes: z.string().optional(),
          nextAction: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const d = await db();
        const { id, ...vals } = input;
        const scoreInput = {
          painScore: vals.painScore ?? 0,
          urgencyScore: vals.urgencyScore ?? 0,
          frequencyScore: vals.frequencyScore ?? 0,
          budgetSignalScore: vals.budgetSignalScore ?? 0,
          decisionMakerAccessScore: vals.decisionMakerAccessScore ?? 0,
        };
        const discoveryScore = calculateCustomerDiscoveryScore(scoreInput);
        const recommendedDecision = generateLeanDecision("customer_discovery", discoveryScore).join("; ");
        let recordId: number;
        if (id) {
          const [updated] = await d.update(customerInterviews).set({ ...vals, discoveryScore, recommendedDecision, updatedAt: new Date() }).where(and(eq(customerInterviews.id, id), eq(customerInterviews.ventureId, input.ventureId))).returning({ id: customerInterviews.id });
          if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
          recordId = id;
        } else {
          const [row] = await d.insert(customerInterviews).values({ ...vals, discoveryScore, recommendedDecision }).returning();
          recordId = row.id;
        }
        await syncAutoRisks(d, input.ventureId, "customer_discovery", recordId, autoRisksForInterview(scoreInput));
        return { id: recordId, discoveryScore };
      }),
    delete: ventureProcedure.input(recordInput).mutation(async ({ input }) => {
      const d = await db();
      const [row] = await d.delete(customerInterviews).where(and(eq(customerInterviews.id, input.id), eq(customerInterviews.ventureId, input.ventureId))).returning({ id: customerInterviews.id });
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
      await d.delete(marketRisks).where(and(eq(marketRisks.ventureId, input.ventureId), eq(marketRisks.linkedModule, "customer_discovery"), eq(marketRisks.linkedRecordId, input.id), eq(marketRisks.autoGenerated, true)));
      return { success: true };
    }),
  }),

  // ── Competitors ─────────────────────────────────────────────────────────────
  competitors: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string(), problemHypothesisId: z.number().optional() }))
      .query(async ({ input }) => {
        const d = await db();
        const rows = await d.select().from(dmCompetitors).where(eq(dmCompetitors.ventureId, input.ventureId)).orderBy(desc(dmCompetitors.createdAt));
        return input.problemHypothesisId ? rows.filter((r) => r.problemHypothesisId === input.problemHypothesisId) : rows;
      }),
    upsert: ventureProcedure
      .input(
        z.object({
          id: z.number().optional(),
          ventureId: z.string(),
          problemHypothesisId: z.number().nullable().optional(),
          competitorName: z.string().min(1),
          competitorType: z.enum(COMPETITOR_TYPES).optional(),
          customerSegment: z.string().optional(),
          problemSolved: z.string().optional(),
          strengths: z.string().optional(),
          weaknesses: z.string().optional(),
          pricingModel: z.string().optional(),
          customerSatisfactionScore: z.number().min(0).max(5).optional(),
          switchingDifficultyScore: z.number().min(0).max(5).optional(),
          differentiationScore: z.number().min(0).max(5).optional(),
          threatScore: z.number().min(0).max(5).optional(),
          notes: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const d = await db();
        const { id, ...vals } = input;
        const competitiveRiskScore = calculateCompetitiveRiskScore({
          customerSatisfactionScore: vals.customerSatisfactionScore ?? 0,
          switchingDifficultyScore: vals.switchingDifficultyScore ?? 0,
          threatScore: vals.threatScore ?? 0,
          differentiationScore: vals.differentiationScore ?? 1,
        });
        let recordId: number;
        if (id) {
          const [updated] = await d.update(dmCompetitors).set({ ...vals, competitiveRiskScore, updatedAt: new Date() }).where(and(eq(dmCompetitors.id, id), eq(dmCompetitors.ventureId, input.ventureId))).returning({ id: dmCompetitors.id });
          if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
          recordId = id;
        } else {
          const [row] = await d.insert(dmCompetitors).values({ ...vals, competitiveRiskScore }).returning();
          recordId = row.id;
        }
        await syncAutoRisks(d, input.ventureId, "competitor", recordId, autoRisksForCompetitor({
          competitorType: vals.competitorType ?? "direct",
          customerSatisfactionScore: vals.customerSatisfactionScore ?? 0,
          switchingDifficultyScore: vals.switchingDifficultyScore ?? 0,
          competitiveRiskScore,
        }));
        return { id: recordId, competitiveRiskScore };
      }),
    delete: ventureProcedure.input(recordInput).mutation(async ({ input }) => {
      const d = await db();
      const [row] = await d.delete(dmCompetitors).where(and(eq(dmCompetitors.id, input.id), eq(dmCompetitors.ventureId, input.ventureId))).returning({ id: dmCompetitors.id });
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
      await d.delete(marketRisks).where(and(eq(marketRisks.ventureId, input.ventureId), eq(marketRisks.linkedModule, "competitor"), eq(marketRisks.linkedRecordId, input.id), eq(marketRisks.autoGenerated, true)));
      return { success: true };
    }),
  }),

  // ── Demand Signals ──────────────────────────────────────────────────────────
  demandSignals: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string(), problemHypothesisId: z.number().optional() }))
      .query(async ({ input }) => {
        const d = await db();
        const rows = await d.select().from(demandSignals).where(eq(demandSignals.ventureId, input.ventureId)).orderBy(desc(demandSignals.createdAt));
        return input.problemHypothesisId ? rows.filter((r) => r.problemHypothesisId === input.problemHypothesisId) : rows;
      }),
    upsert: ventureProcedure
      .input(
        z.object({
          id: z.number().optional(),
          ventureId: z.string(),
          problemHypothesisId: z.number().nullable().optional(),
          signalName: z.string().min(1),
          signalType: z.enum(SIGNAL_TYPES).optional(),
          sourceName: z.string().optional(),
          sourceUrl: z.string().optional(),
          signalDate: z.string().optional(),
          relevanceScore: z.number().min(0).max(5).optional(),
          evidenceStrengthScore: z.number().min(0).max(5).optional(),
          recencyScore: z.number().min(0).max(5).optional(),
          commercialImpactScore: z.number().min(0).max(5).optional(),
          repeatabilityScore: z.number().min(0).max(5).optional(),
          evidenceSummary: z.string().optional(),
          linkedExperiment: z.string().optional(),
          successThreshold: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const d = await db();
        const { id, ...vals } = input;
        const demandSignalScore = calculateDemandSignalScore({
          relevanceScore: vals.relevanceScore ?? 0,
          evidenceStrengthScore: vals.evidenceStrengthScore ?? 0,
          recencyScore: vals.recencyScore ?? 0,
          commercialImpactScore: vals.commercialImpactScore ?? 0,
          repeatabilityScore: vals.repeatabilityScore ?? 0,
        });
        let recordId: number;
        if (id) {
          const [updated] = await d.update(demandSignals).set({ ...vals, demandSignalScore, updatedAt: new Date() }).where(and(eq(demandSignals.id, id), eq(demandSignals.ventureId, input.ventureId))).returning({ id: demandSignals.id });
          if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
          recordId = id;
        } else {
          const [row] = await d.insert(demandSignals).values({ ...vals, demandSignalScore }).returning();
          recordId = row.id;
        }
        await syncAutoRisks(d, input.ventureId, "demand", recordId, autoRisksForDemandSignal({
          signalType: vals.signalType ?? "customer_pull",
          evidenceStrengthScore: vals.evidenceStrengthScore ?? 0,
          commercialImpactScore: vals.commercialImpactScore ?? 0,
        }));
        return { id: recordId, demandSignalScore };
      }),
    delete: ventureProcedure.input(recordInput).mutation(async ({ input }) => {
      const d = await db();
      const [row] = await d.delete(demandSignals).where(and(eq(demandSignals.id, input.id), eq(demandSignals.ventureId, input.ventureId))).returning({ id: demandSignals.id });
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
      await d.delete(marketRisks).where(and(eq(marketRisks.ventureId, input.ventureId), eq(marketRisks.linkedModule, "demand"), eq(marketRisks.linkedRecordId, input.id), eq(marketRisks.autoGenerated, true)));
      return { success: true };
    }),
  }),

  // ── WTP Tests ───────────────────────────────────────────────────────────────
  wtpTests: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string(), problemHypothesisId: z.number().optional() }))
      .query(async ({ input }) => {
        const d = await db();
        const rows = await d.select().from(wtpTests).where(eq(wtpTests.ventureId, input.ventureId)).orderBy(desc(wtpTests.createdAt));
        return input.problemHypothesisId ? rows.filter((r) => r.problemHypothesisId === input.problemHypothesisId) : rows;
      }),
    upsert: ventureProcedure
      .input(
        z.object({
          id: z.number().optional(),
          ventureId: z.string(),
          problemHypothesisId: z.number().nullable().optional(),
          customerName: z.string().optional(),
          buyerRole: z.string().optional(),
          budgetOwnerConfirmed: z.boolean().optional(),
          currentSpend: z.string().optional(),
          valueDriver: z.string().optional(),
          pricingModelTested: z.string().optional(),
          priceTested: z.string().optional(),
          responseSummary: z.string().optional(),
          evidenceLevel: z.number().min(1).max(7).optional(),
          procurementPathway: z.string().optional(),
          objections: z.string().optional(),
          recommendedPricingModel: z.string().optional(),
          nextCommercialAction: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const d = await db();
        const { id, ...vals } = input;
        const wtpScore = calculateWTPScore({
          evidenceLevel: vals.evidenceLevel ?? 1,
          budgetOwnerConfirmed: vals.budgetOwnerConfirmed ?? false,
          procurementPathway: vals.procurementPathway,
        });
        let recordId: number;
        if (id) {
          const [updated] = await d.update(wtpTests).set({ ...vals, wtpScore, updatedAt: new Date() }).where(and(eq(wtpTests.id, id), eq(wtpTests.ventureId, input.ventureId))).returning({ id: wtpTests.id });
          if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
          recordId = id;
        } else {
          const [row] = await d.insert(wtpTests).values({ ...vals, wtpScore }).returning();
          recordId = row.id;
        }
        await syncAutoRisks(d, input.ventureId, "wtp", recordId, autoRisksForWTP({
          evidenceLevel: vals.evidenceLevel ?? 1,
          budgetOwnerConfirmed: vals.budgetOwnerConfirmed ?? false,
          procurementPathway: vals.procurementPathway,
        }));
        return { id: recordId, wtpScore };
      }),
    delete: ventureProcedure.input(recordInput).mutation(async ({ input }) => {
      const d = await db();
      const [row] = await d.delete(wtpTests).where(and(eq(wtpTests.id, input.id), eq(wtpTests.ventureId, input.ventureId))).returning({ id: wtpTests.id });
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
      await d.delete(marketRisks).where(and(eq(marketRisks.ventureId, input.ventureId), eq(marketRisks.linkedModule, "wtp"), eq(marketRisks.linkedRecordId, input.id), eq(marketRisks.autoGenerated, true)));
      return { success: true };
    }),
  }),

  // ── Market Risks ────────────────────────────────────────────────────────────
  risks: router({
    list: publicProcedure.input(ventureInput).query(async ({ input }) => {
      const d = await db();
      return d.select().from(marketRisks).where(eq(marketRisks.ventureId, input.ventureId)).orderBy(desc(marketRisks.marketRiskScore));
    }),
    upsert: ventureProcedure
      .input(
        z.object({
          id: z.number().optional(),
          ventureId: z.string(),
          linkedModule: z.string().optional(),
          linkedRecordId: z.number().nullable().optional(),
          riskTitle: z.string().min(1),
          riskCategory: z.enum(RISK_CATEGORIES).optional(),
          riskDescription: z.string().optional(),
          probabilityScore: z.number().min(1).max(5).optional(),
          severityScore: z.number().min(1).max(5).optional(),
          evidenceConfidenceScore: z.number().min(1).max(5).optional(),
          evidenceSummary: z.string().optional(),
          mitigationPlan: z.string().optional(),
          requiredExperiment: z.string().optional(),
          owner: z.string().optional(),
          reviewDate: z.string().optional(),
          status: z.enum(RISK_STATUSES).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const d = await db();
        const { id, ...vals } = input;
        const marketRiskScore = calculateMarketRiskScore({
          probabilityScore: vals.probabilityScore ?? 1,
          severityScore: vals.severityScore ?? 1,
          evidenceConfidenceScore: vals.evidenceConfidenceScore ?? 1,
        });
        if (id) {
          const [updated] = await d.update(marketRisks).set({ ...vals, marketRiskScore, updatedAt: new Date() }).where(and(eq(marketRisks.id, id), eq(marketRisks.ventureId, input.ventureId))).returning({ id: marketRisks.id });
          if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
          return { id, marketRiskScore };
        }
        const [row] = await d.insert(marketRisks).values({ ...vals, marketRiskScore, autoGenerated: false }).returning();
        return { id: row.id, marketRiskScore };
      }),
    delete: ventureProcedure.input(recordInput).mutation(async ({ input }) => {
      const d = await db();
      const [row] = await d.delete(marketRisks).where(and(eq(marketRisks.id, input.id), eq(marketRisks.ventureId, input.ventureId))).returning({ id: marketRisks.id });
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
      return { success: true };
    }),
  }),

  // ── Lean Experiments ────────────────────────────────────────────────────────
  experiments: router({
    list: publicProcedure.input(ventureInput).query(async ({ input }) => {
      const d = await db();
      return d.select().from(leanExperiments).where(eq(leanExperiments.ventureId, input.ventureId)).orderBy(desc(leanExperiments.createdAt));
    }),
    upsert: ventureProcedure
      .input(
        z.object({
          id: z.number().optional(),
          ventureId: z.string(),
          problemHypothesisId: z.number().nullable().optional(),
          experimentName: z.string().min(1),
          experimentType: z.enum(EXPERIMENT_TYPES).optional(),
          hypothesisTested: z.string().optional(),
          method: z.string().optional(),
          successThreshold: z.string().optional(),
          result: z.string().optional(),
          learningSummary: z.string().optional(),
          decision: z.string().optional(),
          nextStep: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const d = await db();
        const { id, ...vals } = input;
        if (id) {
          const [updated] = await d.update(leanExperiments).set({ ...vals, updatedAt: new Date() }).where(and(eq(leanExperiments.id, id), eq(leanExperiments.ventureId, input.ventureId))).returning({ id: leanExperiments.id });
          if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
          return { id };
        }
        const [row] = await d.insert(leanExperiments).values(vals).returning();
        return { id: row.id };
      }),
    delete: ventureProcedure.input(recordInput).mutation(async ({ input }) => {
      const d = await db();
      const [row] = await d.delete(leanExperiments).where(and(eq(leanExperiments.id, input.id), eq(leanExperiments.ventureId, input.ventureId))).returning({ id: leanExperiments.id });
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
      return { success: true };
    }),
  }),

  // ── Combined Module Summary ───────────────────────────────────────────────────
  summary: publicProcedure.input(ventureInput).query(async ({ input }) => {
    const d = await db();
    const [interviews, comps, signals, wtps, risks] = await Promise.all([
      d.select().from(customerInterviews).where(eq(customerInterviews.ventureId, input.ventureId)),
      d.select().from(dmCompetitors).where(eq(dmCompetitors.ventureId, input.ventureId)),
      d.select().from(demandSignals).where(eq(demandSignals.ventureId, input.ventureId)),
      d.select().from(wtpTests).where(eq(wtpTests.ventureId, input.ventureId)),
      d.select().from(marketRisks).where(eq(marketRisks.ventureId, input.ventureId)),
    ]);

    const customerDiscoveryScore = avg(interviews.map((r) => r.discoveryScore ?? 0));
    const competitiveRiskScore = avg(comps.map((r) => r.competitiveRiskScore ?? 0));
    const demandSignalScore = avg(signals.map((r) => r.demandSignalScore ?? 0));
    const wtpScore = avg(wtps.map((r) => r.wtpScore ?? 0));
    const openMarketRiskScore = normaliseOpenMarketRisk(
      risks.map((r) => ({ marketRiskScore: r.marketRiskScore ?? 0, status: r.status ?? "open" })),
    );

    const overall = calculateOverallDiscoveryMarketConfidence({
      customerDiscoveryScore,
      demandSignalScore,
      wtpScore,
      competitiveRiskScore,
      openMarketRiskScore,
    });

    const warnings = marketRiskDecisionWarnings(
      risks.map((r) => ({ riskCategory: r.riskCategory ?? "", marketRiskScore: r.marketRiskScore ?? 0, status: r.status ?? "open" })),
    );

    // Find weakest dimension to recommend the next best experiment.
    const dims = [
      { kind: "customer_discovery" as const, score: customerDiscoveryScore, n: interviews.length },
      { kind: "demand" as const, score: demandSignalScore, n: signals.length },
      { kind: "wtp" as const, score: wtpScore, n: wtps.length },
    ].filter((x) => x.n > 0);
    const weakest = dims.sort((a, b) => a.score - b.score)[0];
    const nextBestExperiment = weakest
      ? generateNextExperimentRecommendation(weakest.kind, weakest.score)
      : generateNextExperimentRecommendation("overall", overall);

    const hasAnyData = interviews.length + comps.length + signals.length + wtps.length + risks.length > 0;

    return {
      hasAnyData,
      counts: {
        interviews: interviews.length,
        competitors: comps.length,
        demandSignals: signals.length,
        wtpTests: wtps.length,
        risks: risks.length,
        openRisks: risks.filter((r) => r.status !== "closed" && r.status !== "mitigated").length,
        criticalRisks: risks.filter((r) => (r.marketRiskScore ?? 0) >= 76 && r.status !== "closed" && r.status !== "mitigated").length,
      },
      scores: {
        customerDiscoveryScore,
        competitiveRiskScore,
        demandSignalScore,
        wtpScore,
        openMarketRiskScore,
        overall,
      },
      decision: generateLeanDecision("overall", overall),
      nextBestExperiment,
      warnings,
    };
  }),
});
