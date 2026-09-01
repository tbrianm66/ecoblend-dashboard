import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./_core/trpc";
import { workflowStateService } from "./workflowStateService";
import { LEAN_STAGES } from "../shared/workflowStages";
import { assertVentureAccess } from "./discoveryMarket.router";
import { getDb } from "./db";
import { pivotLog, ventures } from "../drizzle/schema";

const leanStageEnum = z.enum(LEAN_STAGES as unknown as [string, ...string[]]);

const pivotTypeEnum = z.enum([
  "problem",
  "customer_segment",
  "solution",
  "pricing",
  "channel",
  "business_model",
]);

const decisionEnum = z.enum(["advance", "hold_pending_evidence", "kill"]);

export const workflowStateRouter = router({
  // ── getStage ──────────────────────────────────────────────────────────────
  getStage: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await assertVentureAccess(db, ctx.user, input.ventureId, { allowClaim: false });
      const stage = await workflowStateService.getVentureStage(input.ventureId);
      return { ventureId: input.ventureId, workflowStage: stage };
    }),

  // ── canAdvance ────────────────────────────────────────────────────────────
  canAdvance: protectedProcedure
    .input(z.object({
      ventureId:   z.string(),
      targetStage: leanStageEnum,
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await assertVentureAccess(db, ctx.user, input.ventureId, { allowClaim: false });
      return workflowStateService.canAdvanceStage(
        input.ventureId,
        input.targetStage as any,
      );
    }),

  // ── advance ───────────────────────────────────────────────────────────────
  advance: protectedProcedure
    .input(z.object({
      ventureId:   z.string(),
      targetStage: leanStageEnum,
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await assertVentureAccess(db, ctx.user, input.ventureId);

      const result = await workflowStateService.advance(
        input.ventureId,
        input.targetStage as any,
      );

      if (!result.success) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: result.blockers.join(" | "),
        });
      }

      return { success: true, workflowStage: input.targetStage };
    }),

  // ── triggerPivot ──────────────────────────────────────────────────────────
  triggerPivot: protectedProcedure
    .input(z.object({
      ventureId:           z.string(),
      pivotType:           pivotTypeEnum,
      rationale:           z.string().min(10, "Rationale must be at least 10 characters"),
      previousHypothesis:  z.string(),
      newHypothesis:       z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await assertVentureAccess(db, ctx.user, input.ventureId);

      await workflowStateService.triggerPivot(
        input.ventureId,
        input.pivotType,
        input.rationale,
        input.previousHypothesis,
        input.newHypothesis,
      );

      return { success: true };
    }),

  // ── recordDecision ────────────────────────────────────────────────────────
  recordDecision: protectedProcedure
    .input(z.object({
      ventureId:  z.string(),
      decision:   decisionEnum,
      rationale:  z.string().min(10, "Rationale must be at least 10 characters"),
      decidedBy:  z.string().min(1),
      nextStage:  leanStageEnum.optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await assertVentureAccess(db, ctx.user, input.ventureId);

      if (input.decision === "advance" && !input.nextStage) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "nextStage is required when decision is 'advance'",
        });
      }

      const result = await workflowStateService.recordDecision(
        input.ventureId,
        input.decision,
        input.rationale,
        input.decidedBy,
        input.nextStage as any,
      );

      return { success: true, decisionId: result.id };
    }),

  // ── clearPivotRequired ────────────────────────────────────────────────────
  // Clears the pivotRequired flag on a venture. BLOCKED unless a pivot_log
  // entry exists for that venture — prevents bypassing the pivot discipline.
  clearPivotRequired: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await assertVentureAccess(db, ctx.user, input.ventureId);

      // Gate: at least one pivot_log entry must exist
      const logRows = await db
        .select({ id: pivotLog.id })
        .from(pivotLog)
        .where(eq(pivotLog.ventureId, input.ventureId))
        .orderBy(desc(pivotLog.createdAt))
        .limit(1);

      if (logRows.length === 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "pivot_required cannot be cleared without a pivot_log entry. " +
            "Save a revised Lean Canvas with a changed hypothesis field first " +
            "— the system will auto-write the pivot_log and clear the flag.",
        });
      }

      await db
        .update(ventures)
        .set({ pivotRequired: false, pivotReason: null, updatedAt: new Date() })
        .where(eq(ventures.id, input.ventureId));

      return { success: true, clearedByLogId: logRows[0].id };
    }),
});
