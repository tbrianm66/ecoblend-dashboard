import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import {
  auditLog,
  ccDecisions,
  ccEvidence,
  ccExperiments,
  ccHypotheses,
  validationLifecycles,
  ventures,
} from "../drizzle/schema";
import { getDb } from "./db";
import { validationSpineRouter } from "./validationSpine.router";

const ventureId = `stage1-spine-${Date.now()}`;
const admin = {
  id: 1,
  role: "admin",
  openId: "stage1-test-admin",
  email: "stage1@example.test",
  name: "Stage 1 Test Admin",
};
const caller = validationSpineRouter.createCaller({ user: admin } as any);

let lifecycleId = 0;
let hypothesisId = 0;
let experimentId = 0;
const evidenceIds: number[] = [];

describe.sequential("Stage 1 canonical validation spine", () => {
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Development database unavailable");
    await db.insert(ventures).values({
      id: ventureId,
      name: "Stage 1 Compatibility Venture",
      status: "Pre-Launch",
      lifecycleStage: "Opportunity",
      currentStage: "intake",
      validationStatus: "idea",
      workflowStage: "venture_intake",
    });
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;
    await db.delete(auditLog).where(and(eq(auditLog.ventureId, ventureId), eq(auditLog.module, "validation_spine")));
    await db.delete(ccDecisions).where(eq(ccDecisions.ventureId, ventureId));
    await db.delete(ccEvidence).where(eq(ccEvidence.ventureId, ventureId));
    await db.delete(ccExperiments).where(eq(ccExperiments.ventureId, ventureId));
    await db.delete(ccHypotheses).where(eq(ccHypotheses.ventureId, ventureId));
    await db.delete(validationLifecycles).where(eq(validationLifecycles.ventureId, ventureId));
    await db.delete(ventures).where(eq(ventures.id, ventureId));
  });

  it("rejects unauthenticated lifecycle creation", async () => {
    const anonymous = validationSpineRouter.createCaller({ user: null } as any);
    await expect(anonymous.createLifecycle({ ventureId, initialState: "DISCOVERY" }))
      .rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("creates an additive lifecycle without changing historical venture state", async () => {
    const db = (await getDb())!;
    const [before] = await db.select().from(ventures).where(eq(ventures.id, ventureId));
    const lifecycle = await caller.createLifecycle({ ventureId, initialState: "DISCOVERY" });
    lifecycleId = lifecycle.id;
    const [after] = await db.select().from(ventures).where(eq(ventures.id, ventureId));

    expect(lifecycle).toMatchObject({ ventureId, version: 1, lifecycleState: "DISCOVERY" });
    expect(after.id).toBe(before.id);
    expect(after.currentStage).toBe(before.currentStage);
    expect(after.validationStatus).toBe(before.validationStatus);
    expect(after.workflowStage).toBe(before.workflowStage);
  });

  it("allows only explicit allowlisted human lifecycle transitions and audits them", async () => {
    const transitioned = await caller.transitionLifecycle({
      ventureId,
      lifecycleId,
      priorState: "DISCOVERY",
      newState: "VALIDATION",
      rationale: "The operator has approved the start of controlled validation",
    });
    expect(transitioned.lifecycleState).toBe("VALIDATION");

    await expect(caller.transitionLifecycle({
      ventureId,
      lifecycleId,
      priorState: "DISCOVERY",
      newState: "REVIEW",
      rationale: "A stale client must not overwrite the current lifecycle state",
    })).rejects.toMatchObject({ code: "CONFLICT" });

    const db = (await getDb())!;
    const rows = await db.select().from(auditLog).where(and(
      eq(auditLog.ventureId, ventureId),
      eq(auditLog.action, "validation.lifecycle.transitioned_by_human"),
    ));
    expect(rows).toHaveLength(1);
    expect(rows[0].after).toContain("explicit_human_action");
  });

  it("links a canonical hypothesis to the lifecycle", async () => {
    const hypothesis = await caller.createHypothesis({
      ventureId,
      lifecycleId,
      hypothesisStatement: "Target customers experience a recurring validation problem",
      hypothesisType: "problem",
      validationCriteria: "At least three independent observations support the statement",
    });
    hypothesisId = hypothesis.id;
    expect(hypothesis).toMatchObject({
      ventureId,
      validationLifecycleId: lifecycleId,
      hypothesisVersion: 1,
      status: "untested",
    });
  });

  it("stores supporting and contradicting evidence in existing cc_evidence", async () => {
    const supporting = await caller.addEvidence({
      ventureId,
      lifecycleId,
      hypothesisId,
      evidenceTitle: "Supporting interview observation",
      relationship: "supports",
      provenance: "Authenticated Stage 1 test entry",
      confidenceScore: 60,
    });
    const contradicting = await caller.addEvidence({
      ventureId,
      lifecycleId,
      hypothesisId,
      evidenceTitle: "Contradicting interview observation",
      relationship: "contradicts",
      provenance: "Authenticated Stage 1 test entry",
      confidenceScore: 55,
    });
    evidenceIds.push(supporting.id, contradicting.id);
    expect(supporting.contradictsHypothesis).toBe(false);
    expect(contradicting.contradictsHypothesis).toBe(true);
  });

  it("links an experiment and converts its result into canonical evidence", async () => {
    const experiment = await caller.createExperiment({
      ventureId,
      lifecycleId,
      hypothesisId,
      experimentName: "Controlled Stage 1 interview test",
      method: "Conduct three structured interviews",
      successThreshold: "Two of three independently confirm the problem",
    });
    experimentId = experiment.id;
    const recorded = await caller.recordExperimentResult({
      ventureId,
      lifecycleId,
      hypothesisId,
      experimentId,
      result: "Two of three participants independently confirmed the problem",
      learningSummary: "The hypothesis has initial qualitative support",
      hypothesisStatus: "validated",
      evidenceTitle: "Stage 1 experiment result",
      relationship: "supports",
      provenance: "Result recorded by authenticated human operator",
      confidenceScore: 70,
    });
    evidenceIds.push(recorded.evidence.id);
    expect(recorded.experiment.experimentStatus).toBe("completed");
    expect(recorded.evidence.experimentId).toBe(experimentId);
    expect(recorded.hypothesis.status).toBe("validated");
  });

  it("persists the system recommendation separately from the human decision", async () => {
    const decision = await caller.recordHumanDecision({
      ventureId,
      lifecycleId,
      hypothesisId,
      decisionTitle: "Controlled Stage 1 validation decision",
      systemRecommendation: "PROCEED",
      humanDecision: "ITERATE",
      rationale: "The evidence is promising but one contradiction remains",
      evidenceIds,
      overrideReason: "Human reviewer requires another interview cycle",
    });
    expect(decision.recommendedAction).toBe("PROCEED");
    expect(decision.humanDecision).toBe("ITERATE");
    expect(decision.decisionAuthorityUserId).toBe(admin.id);
  });

  it("returns the complete vertical slice with audit provenance and no progression", async () => {
    const projection = await caller.getLifecycle({ ventureId, lifecycleId });
    expect(projection.hypotheses).toHaveLength(1);
    expect(projection.experiments).toHaveLength(1);
    expect(projection.evidence.length).toBeGreaterThanOrEqual(3);
    expect(projection.decisions).toHaveLength(1);
    expect(projection.audit.length).toBeGreaterThanOrEqual(6);
    expect(projection.constraints).toEqual({
      executionReadyReserved: true,
      automaticProgression: false,
      phase2Handover: false,
    });
  });
});