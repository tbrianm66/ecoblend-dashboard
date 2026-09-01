import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  auditLog,
  ccDecisions,
  ccEvidence,
  ccExperiments,
  ccHypotheses,
  validationLifecycles,
} from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { assertVentureAccess } from "./discoveryMarket.router";

const STAGE1_LIFECYCLE_STATES = [
  "DISCOVERY",
  "VALIDATION",
  "ITERATION",
  "REVIEW",
  "HOLD",
  "TERMINATED",
] as const;
const EVIDENCE_RELATIONSHIPS = ["supports", "contradicts", "neutral"] as const;
const HUMAN_DECISIONS = ["PROCEED", "ITERATE", "HOLD", "STOP", "ESCALATE"] as const;
const HYPOTHESIS_STATUSES = ["untested", "testing", "validated", "invalidated", "inconclusive"] as const;

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;

async function database(): Promise<Database> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return db;
}

const stage1Procedure = protectedProcedure.use(async ({ ctx, next, getRawInput }) => {
  const raw = await getRawInput();
  const ventureId = (raw as { ventureId?: unknown } | null)?.ventureId;
  if (typeof ventureId !== "string" || !ventureId.trim()) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "ventureId is required" });
  }
  await assertVentureAccess(await database(), ctx.user, ventureId, { allowClaim: false });
  return next();
});

async function requireLifecycle(db: Database, ventureId: string, lifecycleId: number) {
  const [lifecycle] = await db
    .select()
    .from(validationLifecycles)
    .where(and(eq(validationLifecycles.id, lifecycleId), eq(validationLifecycles.ventureId, ventureId)))
    .limit(1);
  if (!lifecycle) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Validation lifecycle not found for this venture" });
  }
  return lifecycle;
}

async function requireHypothesis(
  db: Database,
  ventureId: string,
  lifecycleId: number,
  hypothesisId: number,
) {
  const [hypothesis] = await db
    .select()
    .from(ccHypotheses)
    .where(
      and(
        eq(ccHypotheses.id, hypothesisId),
        eq(ccHypotheses.ventureId, ventureId),
        eq(ccHypotheses.validationLifecycleId, lifecycleId),
      ),
    )
    .limit(1);
  if (!hypothesis) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Hypothesis not linked to this lifecycle" });
  }
  return hypothesis;
}

function actorName(user: { name?: string | null; email?: string | null; openId: string }) {
  return user.name?.trim() || user.email?.trim() || user.openId;
}

async function writeAudit(
  db: { insert: Database["insert"] },
  actor: { id: number; name?: string | null; email?: string | null; openId: string },
  input: {
    ventureId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    before?: unknown;
    after?: unknown;
  },
) {
  await db.insert(auditLog).values({
    userId: String(actor.id),
    userName: actorName(actor),
    action: input.action,
    module: "validation_spine",
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    ventureId: input.ventureId,
    before: input.before === undefined ? null : JSON.stringify(input.before),
    after: input.after === undefined ? null : JSON.stringify(input.after),
    status: "success",
  });
}

const lifecycleInput = z.object({
  ventureId: z.string().min(1),
  lifecycleId: z.number().int().positive(),
});

const evidenceFields = {
  evidenceTitle: z.string().min(1),
  evidenceSummary: z.string().optional(),
  evidenceType: z.string().min(1).default("validation_observation"),
  relationship: z.enum(EVIDENCE_RELATIONSHIPS),
  sourceReference: z.string().optional(),
  provenance: z.string().min(1),
  collectedAt: z.coerce.date().optional(),
  reliability: z.number().int().min(1).max(5).optional(),
  independence: z.enum(["independent", "related", "unknown"]).default("unknown"),
  confidenceScore: z.number().int().min(0).max(100).default(0),
};

export const validationSpineRouter = router({
  listLifecycles: stage1Procedure
    .input(z.object({ ventureId: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await database();
      return db
        .select()
        .from(validationLifecycles)
        .where(eq(validationLifecycles.ventureId, input.ventureId))
        .orderBy(desc(validationLifecycles.version));
    }),

  getLifecycle: stage1Procedure
    .input(lifecycleInput)
    .query(async ({ input }) => {
      const db = await database();
      const lifecycle = await requireLifecycle(db, input.ventureId, input.lifecycleId);
      const [hypotheses, evidence, experiments, decisions, audit] = await Promise.all([
        db.select().from(ccHypotheses).where(and(
          eq(ccHypotheses.ventureId, input.ventureId),
          eq(ccHypotheses.validationLifecycleId, input.lifecycleId),
        )).orderBy(desc(ccHypotheses.updatedAt)),
        db.select().from(ccEvidence).where(and(
          eq(ccEvidence.ventureId, input.ventureId),
          eq(ccEvidence.validationLifecycleId, input.lifecycleId),
        )).orderBy(desc(ccEvidence.updatedAt)),
        db.select().from(ccExperiments).where(and(
          eq(ccExperiments.ventureId, input.ventureId),
          eq(ccExperiments.validationLifecycleId, input.lifecycleId),
        )).orderBy(desc(ccExperiments.updatedAt)),
        db.select().from(ccDecisions).where(and(
          eq(ccDecisions.ventureId, input.ventureId),
          eq(ccDecisions.validationLifecycleId, input.lifecycleId),
        )).orderBy(desc(ccDecisions.updatedAt)),
        db.select().from(auditLog).where(and(
          eq(auditLog.ventureId, input.ventureId),
          eq(auditLog.module, "validation_spine"),
        )).orderBy(desc(auditLog.createdAt)),
      ]);
      return {
        lifecycle,
        hypotheses,
        evidence,
        experiments,
        decisions,
        audit,
        constraints: {
          executionReadyReserved: true,
          automaticProgression: false,
          phase2Handover: false,
        },
      };
    }),

  createLifecycle: stage1Procedure
    .input(z.object({
      ventureId: z.string().min(1),
      initialState: z.enum(STAGE1_LIFECYCLE_STATES).default("DISCOVERY"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await database();
      return db.transaction(async (tx) => {
        const [latest] = await tx
          .select({ version: validationLifecycles.version })
          .from(validationLifecycles)
          .where(eq(validationLifecycles.ventureId, input.ventureId))
          .orderBy(desc(validationLifecycles.version))
          .limit(1);
        const [lifecycle] = await tx
          .insert(validationLifecycles)
          .values({
            ventureId: input.ventureId,
            version: (latest?.version ?? 0) + 1,
            lifecycleState: input.initialState,
            ownerUserId: ctx.user.id,
            createdByUserId: ctx.user.id,
          })
          .returning();
        await writeAudit(tx, ctx.user, {
          ventureId: input.ventureId,
          action: "validation.lifecycle.created",
          resourceType: "validation_lifecycle",
          resourceId: String(lifecycle.id),
          after: lifecycle,
        });
        return lifecycle;
      });
    }),

  createHypothesis: stage1Procedure
    .input(lifecycleInput.extend({
      hypothesisStatement: z.string().min(1),
      hypothesisType: z.string().min(1).default("problem"),
      assumptionRiskLevel: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      validationCriteria: z.string().min(1),
      previousHypothesisId: z.number().int().positive().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await database();
      await requireLifecycle(db, input.ventureId, input.lifecycleId);
      const previousHypothesis = input.previousHypothesisId
        ? await requireHypothesis(db, input.ventureId, input.lifecycleId, input.previousHypothesisId)
        : undefined;
      const [hypothesis] = await db.insert(ccHypotheses).values({
        ventureId: input.ventureId,
        validationLifecycleId: input.lifecycleId,
        moduleSource: "validation_spine",
        hypothesisType: input.hypothesisType,
        hypothesisStatement: input.hypothesisStatement,
        assumptionRiskLevel: input.assumptionRiskLevel,
        status: "untested",
        validationCriteria: input.validationCriteria,
        previousHypothesisId: input.previousHypothesisId,
        hypothesisVersion: (previousHypothesis?.hypothesisVersion ?? 0) + 1,
      }).returning();
      await writeAudit(db, ctx.user, {
        ventureId: input.ventureId,
        action: "validation.hypothesis.created",
        resourceType: "cc_hypothesis",
        resourceId: String(hypothesis.id),
        after: hypothesis,
      });
      return hypothesis;
    }),

  linkExistingHypothesis: stage1Procedure
    .input(lifecycleInput.extend({
      hypothesisId: z.number().int().positive(),
      validationCriteria: z.string().min(1).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await database();
      await requireLifecycle(db, input.ventureId, input.lifecycleId);
      const [before] = await db.select().from(ccHypotheses).where(and(
        eq(ccHypotheses.id, input.hypothesisId),
        eq(ccHypotheses.ventureId, input.ventureId),
      )).limit(1);
      if (!before) throw new TRPCError({ code: "NOT_FOUND", message: "Hypothesis not found for this venture" });
      if (before.validationLifecycleId && before.validationLifecycleId !== input.lifecycleId) {
        throw new TRPCError({ code: "CONFLICT", message: "Hypothesis is already linked to another lifecycle" });
      }
      const [hypothesis] = await db.update(ccHypotheses).set({
        validationLifecycleId: input.lifecycleId,
        validationCriteria: input.validationCriteria ?? before.validationCriteria,
        updatedAt: new Date(),
      }).where(and(
        eq(ccHypotheses.id, input.hypothesisId),
        eq(ccHypotheses.ventureId, input.ventureId),
      )).returning();
      await writeAudit(db, ctx.user, {
        ventureId: input.ventureId,
        action: "validation.hypothesis.linked",
        resourceType: "cc_hypothesis",
        resourceId: String(hypothesis.id),
        before,
        after: hypothesis,
      });
      return hypothesis;
    }),

  addEvidence: stage1Procedure
    .input(lifecycleInput.extend({
      hypothesisId: z.number().int().positive(),
      experimentId: z.number().int().positive().optional(),
      ...evidenceFields,
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await database();
      await requireLifecycle(db, input.ventureId, input.lifecycleId);
      await requireHypothesis(db, input.ventureId, input.lifecycleId, input.hypothesisId);
      if (input.experimentId) {
        const [experiment] = await db.select({ id: ccExperiments.id }).from(ccExperiments).where(and(
          eq(ccExperiments.id, input.experimentId),
          eq(ccExperiments.ventureId, input.ventureId),
          eq(ccExperiments.validationLifecycleId, input.lifecycleId),
          eq(ccExperiments.hypothesisId, input.hypothesisId),
        )).limit(1);
        if (!experiment) throw new TRPCError({ code: "NOT_FOUND", message: "Experiment not linked to this hypothesis" });
      }
      const [evidence] = await db.insert(ccEvidence).values({
        ventureId: input.ventureId,
        validationLifecycleId: input.lifecycleId,
        hypothesisId: input.hypothesisId,
        experimentId: input.experimentId,
        moduleSource: "validation_spine",
        evidenceType: input.evidenceType,
        evidenceTitle: input.evidenceTitle,
        evidenceSummary: input.evidenceSummary,
        evidenceConfidenceScore: input.confidenceScore,
        contradictsHypothesis: input.relationship === "contradicts",
        evidenceRelationship: input.relationship,
        sourceReference: input.sourceReference,
        provenance: input.provenance,
        collectorUserId: ctx.user.id,
        collectedAt: input.collectedAt ?? new Date(),
        reliability: input.reliability,
        independence: input.independence,
      }).returning();
      await writeAudit(db, ctx.user, {
        ventureId: input.ventureId,
        action: "validation.evidence.created",
        resourceType: "cc_evidence",
        resourceId: String(evidence.id),
        after: evidence,
      });
      return evidence;
    }),

  createExperiment: stage1Procedure
    .input(lifecycleInput.extend({
      hypothesisId: z.number().int().positive(),
      experimentName: z.string().min(1),
      experimentType: z.string().min(1).default("customer_interview"),
      method: z.string().min(1),
      successThreshold: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await database();
      await requireLifecycle(db, input.ventureId, input.lifecycleId);
      const hypothesis = await requireHypothesis(db, input.ventureId, input.lifecycleId, input.hypothesisId);
      const [experiment] = await db.insert(ccExperiments).values({
        ventureId: input.ventureId,
        validationLifecycleId: input.lifecycleId,
        hypothesisId: input.hypothesisId,
        experimentName: input.experimentName,
        experimentType: input.experimentType,
        moduleSource: "validation_spine",
        experimentStatus: "proposed",
        method: input.method,
        successThreshold: input.successThreshold,
      }).returning();
      await writeAudit(db, ctx.user, {
        ventureId: input.ventureId,
        action: "validation.experiment.created",
        resourceType: "cc_experiment",
        resourceId: String(experiment.id),
        after: experiment,
      });
      return experiment;
    }),

  recordExperimentResult: stage1Procedure
    .input(lifecycleInput.extend({
      hypothesisId: z.number().int().positive(),
      experimentId: z.number().int().positive(),
      result: z.string().min(1),
      learningSummary: z.string().min(1),
      hypothesisStatus: z.enum(HYPOTHESIS_STATUSES),
      evidenceTitle: z.string().min(1),
      relationship: z.enum(EVIDENCE_RELATIONSHIPS),
      provenance: z.string().min(1),
      sourceReference: z.string().optional(),
      confidenceScore: z.number().int().min(0).max(100).default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await database();
      await requireLifecycle(db, input.ventureId, input.lifecycleId);
      await requireHypothesis(db, input.ventureId, input.lifecycleId, input.hypothesisId);
      return db.transaction(async (tx) => {
        const [beforeExperiment] = await tx.select().from(ccExperiments).where(and(
          eq(ccExperiments.id, input.experimentId),
          eq(ccExperiments.ventureId, input.ventureId),
          eq(ccExperiments.validationLifecycleId, input.lifecycleId),
          eq(ccExperiments.hypothesisId, input.hypothesisId),
        )).limit(1);
        if (!beforeExperiment) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Experiment not linked to this lifecycle hypothesis" });
        }
        const [experiment] = await tx.update(ccExperiments).set({
          result: input.result,
          learningSummary: input.learningSummary,
          experimentStatus: "completed",
          updatedAt: new Date(),
        }).where(and(
          eq(ccExperiments.id, input.experimentId),
          eq(ccExperiments.ventureId, input.ventureId),
        )).returning();
        const [evidence] = await tx.insert(ccEvidence).values({
          ventureId: input.ventureId,
          validationLifecycleId: input.lifecycleId,
          hypothesisId: input.hypothesisId,
          experimentId: input.experimentId,
          moduleSource: "validation_spine",
          evidenceType: "experiment_result",
          evidenceTitle: input.evidenceTitle,
          evidenceSummary: input.result,
          evidenceConfidenceScore: input.confidenceScore,
          contradictsHypothesis: input.relationship === "contradicts",
          evidenceRelationship: input.relationship,
          provenance: input.provenance,
          sourceReference: input.sourceReference,
          collectorUserId: ctx.user.id,
          collectedAt: new Date(),
          independence: "related",
        }).returning();
        const [hypothesis] = await tx.update(ccHypotheses).set({
          status: input.hypothesisStatus,
          evidenceSummary: input.learningSummary,
          updatedAt: new Date(),
        }).where(and(
          eq(ccHypotheses.id, input.hypothesisId),
          eq(ccHypotheses.ventureId, input.ventureId),
        )).returning();
        await writeAudit(tx, ctx.user, {
          ventureId: input.ventureId,
          action: "validation.experiment.result_recorded",
          resourceType: "cc_experiment",
          resourceId: String(input.experimentId),
          before: beforeExperiment,
          after: { experiment, evidenceId: evidence.id, hypothesisStatus: hypothesis.status },
        });
        return { experiment, evidence, hypothesis };
      });
    }),

  recordHumanDecision: stage1Procedure
    .input(lifecycleInput.extend({
      hypothesisId: z.number().int().positive(),
      decisionTitle: z.string().min(1),
      systemRecommendation: z.enum(HUMAN_DECISIONS),
      humanDecision: z.enum(HUMAN_DECISIONS),
      rationale: z.string().min(1),
      evidenceIds: z.array(z.number().int().positive()).min(1),
      overrideReason: z.string().min(1).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await database();
      await requireLifecycle(db, input.ventureId, input.lifecycleId);
      await requireHypothesis(db, input.ventureId, input.lifecycleId, input.hypothesisId);
      const evidence = await db.select({ id: ccEvidence.id }).from(ccEvidence).where(and(
        eq(ccEvidence.ventureId, input.ventureId),
        eq(ccEvidence.validationLifecycleId, input.lifecycleId),
        eq(ccEvidence.hypothesisId, input.hypothesisId),
        inArray(ccEvidence.id, input.evidenceIds),
      ));
      if (evidence.length !== new Set(input.evidenceIds).size) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Every evidence reference must belong to this lifecycle hypothesis" });
      }
      if (input.systemRecommendation !== input.humanDecision && !input.overrideReason) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "overrideReason is required when the human decision differs" });
      }
      const now = new Date();
      const [decision] = await db.insert(ccDecisions).values({
        ventureId: input.ventureId,
        validationLifecycleId: input.lifecycleId,
        hypothesisId: input.hypothesisId,
        decisionType: "validation_spine",
        decisionTitle: input.decisionTitle,
        decisionSummary: input.rationale,
        recommendedAction: input.systemRecommendation,
        humanDecision: input.humanDecision,
        decisionAuthorityUserId: ctx.user.id,
        decisionRationale: input.rationale,
        evidenceReferences: JSON.stringify(input.evidenceIds),
        overrideReason: input.overrideReason,
        decidedAt: now,
        decisionStatus: "recorded",
        approvedBy: actorName(ctx.user),
        decisionDate: now.toISOString().slice(0, 10),
      }).returning();
      await writeAudit(db, ctx.user, {
        ventureId: input.ventureId,
        action: "validation.human_decision.recorded",
        resourceType: "cc_decision",
        resourceId: String(decision.id),
        after: {
          systemRecommendation: decision.recommendedAction,
          humanDecision: decision.humanDecision,
          authorityUserId: decision.decisionAuthorityUserId,
          evidenceIds: input.evidenceIds,
        },
      });
      return decision;
    }),
});