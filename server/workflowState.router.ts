import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { workflowStateService } from "./workflowStateService";
import { LEAN_STAGES } from "../shared/workflowStages";
import { assertVentureAccess } from "./discoveryMarket.router";
import { getDb } from "./db";

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
  getStage: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const stage = await workflowStateService.getVentureStage(input.ventureId);
      return { ventureId: input.ventureId, workflowStage: stage };
    }),

  // ── canAdvance ────────────────────────────────────────────────────────────
  canAdvance: publicProcedure
    .input(z.object({
      ventureId:   z.string(),
      targetStage: leanStageEnum,
    }))
    .query(async ({ input }) => {
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
});
