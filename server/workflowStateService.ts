import { and, desc, eq, sql } from "drizzle-orm";
import {
  ventures,
  ccPivotLogs,
  ccAlerts,
  ccDecisions,
  ccStageGateReviews,
  customerInterviews,
  wtpTests,
  experiments,
  ventureArchive,
} from "../drizzle/schema";
import { getDb } from "./db";
import {
  LEAN_STAGES,
  LeanStage,
  GATE_TYPE_FOR_STAGE,
  GATE_STAGES,
  PIVOT_REVERT_MAP,
  STAGE_EXIT_CRITERIA,
} from "../shared/workflowStages";

export type { LeanStage };
export { LEAN_STAGES };

export interface AdvanceCheck {
  allowed: boolean;
  blockers: string[];
  currentStage: LeanStage;
  targetStage: LeanStage;
}

export class WorkflowStateService {
  // ── getVentureStage ──────────────────────────────────────────────────────
  async getVentureStage(ventureId: string): Promise<LeanStage> {
    const db = await getDb();
    if (!db) return "venture_intake";
    const row = await db
      .select({ workflowStage: ventures.workflowStage })
      .from(ventures)
      .where(eq(ventures.id, ventureId))
      .limit(1);
    const stage = row[0]?.workflowStage;
    if (stage && (LEAN_STAGES as readonly string[]).includes(stage)) {
      return stage as LeanStage;
    }
    return "venture_intake";
  }

  // ── canAdvanceStage ──────────────────────────────────────────────────────
  async canAdvanceStage(ventureId: string, targetStage: LeanStage): Promise<AdvanceCheck> {
    const db = await getDb();
    const currentStage = await this.getVentureStage(ventureId);
    const currentIdx = LEAN_STAGES.indexOf(currentStage);
    const targetIdx  = LEAN_STAGES.indexOf(targetStage);
    const blockers: string[] = [];

    if (targetIdx !== currentIdx + 1) {
      return {
        allowed: false,
        blockers: [`Stages must advance one step at a time. Current: "${currentStage}", requested: "${targetStage}".`],
        currentStage,
        targetStage,
      };
    }

    if (!db) {
      return { allowed: false, blockers: ["Database unavailable"], currentStage, targetStage };
    }

    const criteria = STAGE_EXIT_CRITERIA[currentStage];

    // Exit criterion: minimum completed interviews
    if (criteria.minInterviews !== undefined) {
      const rows = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(customerInterviews)
        .where(
          and(
            eq(customerInterviews.ventureId, ventureId),
            eq(customerInterviews.status, "completed"),
          ),
        );
      const count = rows[0]?.count ?? 0;
      if (count < criteria.minInterviews) {
        blockers.push(
          `Need at least ${criteria.minInterviews} completed interview(s) to exit "${currentStage}". ` +
          `Currently have ${count}.`,
        );
      }
    }

    // Exit criterion: minimum average WTP score
    if (criteria.minWtpScore !== undefined) {
      const rows = await db
        .select({ score: wtpTests.wtpScore })
        .from(wtpTests)
        .where(eq(wtpTests.ventureId, ventureId));
      const avg = rows.length > 0
        ? rows.reduce((s, r) => s + (r.score ?? 0), 0) / rows.length
        : 0;
      if (avg < criteria.minWtpScore) {
        blockers.push(
          `Average WTP score ${avg.toFixed(0)} is below the required ${criteria.minWtpScore} to exit "${currentStage}".`,
        );
      }
    }

    // Exit criterion: minimum solution validation rate
    if (criteria.minValidationRate !== undefined) {
      const rows = await db
        .select({ outcome: experiments.outcome })
        .from(experiments)
        .where(
          and(
            eq(experiments.ventureId, ventureId),
            sql`${experiments.outcome} IS NOT NULL`,
          ),
        );
      const validated = rows.filter(r => r.outcome?.toLowerCase() === "pass").length;
      const rate = rows.length > 0 ? validated / rows.length : 0;
      if (rate < criteria.minValidationRate) {
        blockers.push(
          `Experiment validation rate ${(rate * 100).toFixed(0)}% is below the required ` +
          `${(criteria.minValidationRate * 100).toFixed(0)}% to exit "${currentStage}".`,
        );
      }
    }

    // Exit criterion: approved & human-reviewed gate
    if (criteria.requiresApprovedGate) {
      const gateType = GATE_TYPE_FOR_STAGE[currentStage];
      if (gateType) {
        const rows = await db
          .select({
            approvalDecision: ccStageGateReviews.approvalDecision,
            humanReviewedAt:  ccStageGateReviews.humanReviewedAt,
            humanReviewedBy:  ccStageGateReviews.humanReviewedBy,
          })
          .from(ccStageGateReviews)
          .where(
            and(
              eq(ccStageGateReviews.ventureId, ventureId),
              eq(ccStageGateReviews.gateType, gateType),
            ),
          )
          .orderBy(sql`${ccStageGateReviews.createdAt} DESC`)
          .limit(1);

        const gate = rows[0];
        if (!gate) {
          blockers.push(
            `No gate review found for "${gateType}". A reviewer must create and approve this ` +
            `gate review before advancing past "${currentStage}".`,
          );
        } else if (gate.approvalDecision !== "approved") {
          blockers.push(
            `Gate "${gateType}" has not been approved (current status: "${gate.approvalDecision ?? "pending"}").`,
          );
        } else if (!gate.humanReviewedAt || !gate.humanReviewedBy) {
          blockers.push(
            `Gate "${gateType}" is approved but missing a human reviewer signature ` +
            `(humanReviewedBy / humanReviewedAt). A named reviewer must sign off before advancing.`,
          );
        }
      }
    }

    return {
      allowed: blockers.length === 0,
      blockers,
      currentStage,
      targetStage,
    };
  }

  // ── advance ──────────────────────────────────────────────────────────────
  // Requires a prior "advance" decision record before permitting the transition.
  // Use workflowState.recordDecision({ decision: "advance", nextStage }) from
  // the Decision Gate UI — it records the decision AND advances in one transaction.
  // This method is the fallback for direct callers and enforces the gate.
  async advance(
    ventureId: string,
    targetStage: LeanStage,
  ): Promise<{ success: boolean; blockers: string[] }> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // ── Decision Gate: a prior approved "advance" decision is required ────
    const decisionRows = await db
      .select({ id: ccDecisions.id, createdAt: ccDecisions.createdAt })
      .from(ccDecisions)
      .where(
        and(
          eq(ccDecisions.ventureId, ventureId),
          eq(ccDecisions.recommendedAction, "advance"),
          eq(ccDecisions.decisionStatus, "approved"),
        ),
      )
      .orderBy(desc(ccDecisions.createdAt))
      .limit(1);

    if (decisionRows.length === 0) {
      return {
        success: false,
        blockers: [
          "A decision record is required before advancing. Record an 'Advance' decision " +
          "via the Decision Gate (/ventures/<id>/decision) for this venture first.",
        ],
      };
    }

    const check = await this.canAdvanceStage(ventureId, targetStage);
    if (!check.allowed) {
      return { success: false, blockers: check.blockers };
    }

    await db
      .update(ventures)
      .set({
        workflowStage: targetStage,
        pivotRequired: false,
        pivotReason: null,
        updatedAt: new Date(),
      })
      .where(eq(ventures.id, ventureId));

    return { success: true, blockers: [] };
  }

  // ── triggerPivot ─────────────────────────────────────────────────────────
  async triggerPivot(
    ventureId: string,
    pivotType: string,
    rationale: string,
    previousHypothesis: string,
    newHypothesis: string,
  ): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const revertStage: LeanStage = PIVOT_REVERT_MAP[pivotType] ?? "customer_discovery";

    await db.transaction(async tx => {
      await tx.insert(ccPivotLogs).values({
        ventureId,
        pivotType,
        reasonForPivot: rationale,
        previousHypothesis,
        newHypothesis,
        dateLogged: new Date().toISOString().slice(0, 10),
      });

      await tx
        .update(ventures)
        .set({
          workflowStage: revertStage,
          pivotRequired: true,
          pivotReason: rationale,
          validationStatus: "pivoting",
          updatedAt: new Date(),
        })
        .where(eq(ventures.id, ventureId));

      const dedupeKey = `pivot-${ventureId}-${pivotType}-${Date.now()}`;
      await tx.insert(ccAlerts).values({
        ventureId,
        alertType:          "pivot_triggered",
        alertTitle:         `Pivot Required — ${pivotType}`,
        alertDescription:   rationale,
        severity:           "warning",
        linkedModule:       "workflow",
        autoGenerated:      true,
        dedupeKey,
        status:             "open",
      });
    });
  }

  // ── recordDecision ───────────────────────────────────────────────────────
  async recordDecision(
    ventureId: string,
    decision: "advance" | "hold_pending_evidence" | "kill",
    rationale: string,
    decidedBy: string,
    nextStage?: LeanStage,
  ): Promise<{ id: number }> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const rows = await db.transaction(async tx => {
      const inserted = await tx
        .insert(ccDecisions)
        .values({
          ventureId,
          decisionType:    "stage_gate",
          decisionTitle:   `${decision.charAt(0).toUpperCase() + decision.slice(1).replace(/_/g, " ")}`,
          decisionSummary: rationale,
          recommendedAction: decision,
          decisionStatus:  "approved",
          approvedBy:      decidedBy,
          decisionDate:    new Date().toISOString().slice(0, 10),
        })
        .returning({ id: ccDecisions.id });

      if (decision === "kill") {
        // Capture current stage before kill sets it to "decision_gate"
        const stageRow = await tx
          .select({ workflowStage: ventures.workflowStage })
          .from(ventures)
          .where(eq(ventures.id, ventureId))
          .limit(1);
        const finalStage = stageRow[0]?.workflowStage ?? "decision_gate";

        await tx
          .update(ventures)
          .set({
            validationStatus: "killed",
            workflowStage:    "decision_gate",
            pivotRequired:    false,
            updatedAt:        new Date(),
          })
          .where(eq(ventures.id, ventureId));

        // Write venture_archive record for kill decision
        await tx.insert(ventureArchive).values({
          ventureId,
          decisionId:    inserted[0].id,
          archiveReason: rationale,
          finalStage,
          archivedBy:    decidedBy,
          status:        "archived",
        });

        await tx.insert(ccAlerts).values({
          ventureId,
          alertType:        "venture_killed",
          alertTitle:       "Venture Killed",
          alertDescription: rationale,
          severity:         "critical",
          linkedModule:     "workflow",
          autoGenerated:    true,
          dedupeKey:        `kill-${ventureId}-${Date.now()}`,
          status:           "open",
        });
      } else if (decision === "advance" && nextStage) {
        await tx
          .update(ventures)
          .set({
            workflowStage: nextStage,
            pivotRequired: false,
            pivotReason:   null,
            updatedAt:     new Date(),
          })
          .where(eq(ventures.id, ventureId));
      } else if (decision === "hold_pending_evidence") {
        await tx
          .update(ventures)
          .set({
            validationStatus: "paused",
            updatedAt: new Date(),
          })
          .where(eq(ventures.id, ventureId));
      }

      return inserted;
    });

    return { id: rows[0].id };
  }
}

export const workflowStateService = new WorkflowStateService();
