/**
 * Decision Gate Router
 * Provides the read side for the DecisionGate and VentureArchive UI:
 *  - list all cc_decisions for a venture
 *  - check whether an advance decision exists (required gate for workflowState.advance)
 *  - list / get / restore venture_archive records
 *
 * Write side (recordDecision) lives in workflowState.router.ts so it can be
 * called directly from the WorkflowStateService.
 */
import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { assertVentureAccess } from "./discoveryMarket.router";
import { getDb } from "./db";
import { ccDecisions, ventureArchive, ventures } from "../drizzle/schema";

export const decisionGateRouter = router({
  // ── decisions.list ────────────────────────────────────────────────────────
  // All cc_decisions for a venture, newest first
  listDecisions: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      await assertVentureAccess(db, ctx.user, input.ventureId, { allowClaim: false });
      return db
        .select()
        .from(ccDecisions)
        .where(eq(ccDecisions.ventureId, input.ventureId))
        .orderBy(desc(ccDecisions.createdAt));
    }),

  // ── decisions.checkGate ───────────────────────────────────────────────────
  // Returns whether a prior advance decision exists (gate check for UI)
  checkGate: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      await assertVentureAccess(db, ctx.user, input.ventureId, { allowClaim: false });

      // Fetch the venture's current stage
      const ventureRow = await db
        .select({ workflowStage: ventures.workflowStage, validationStatus: ventures.validationStatus, name: ventures.name })
        .from(ventures)
        .where(eq(ventures.id, input.ventureId))
        .limit(1);

      if (!ventureRow[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Venture not found" });
      }

      // Check for the most recent approved advance decision
      const advanceDecision = await db
        .select()
        .from(ccDecisions)
        .where(
          and(
            eq(ccDecisions.ventureId, input.ventureId),
            eq(ccDecisions.recommendedAction, "advance"),
            eq(ccDecisions.decisionStatus, "approved"),
          ),
        )
        .orderBy(desc(ccDecisions.createdAt))
        .limit(1);

      // Latest decision of any type
      const latestDecision = await db
        .select()
        .from(ccDecisions)
        .where(eq(ccDecisions.ventureId, input.ventureId))
        .orderBy(desc(ccDecisions.createdAt))
        .limit(1);

      return {
        hasAdvanceDecision:  advanceDecision.length > 0,
        latestAdvanceRecord: advanceDecision[0] ?? null,
        latestDecision:      latestDecision[0] ?? null,
        currentStage:        ventureRow[0].workflowStage ?? "venture_intake",
        validationStatus:    ventureRow[0].validationStatus ?? null,
        ventureName:         ventureRow[0].name,
      };
    }),

  // ── archive.get ───────────────────────────────────────────────────────────
  // Get the archive record for a specific venture (most recent)
  getArchive: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      await assertVentureAccess(db, ctx.user, input.ventureId, { allowClaim: false });
      const rows = await db
        .select()
        .from(ventureArchive)
        .where(eq(ventureArchive.ventureId, input.ventureId))
        .orderBy(desc(ventureArchive.createdAt))
        .limit(1);
      return rows[0] ?? null;
    }),

  // ── archive.listAll ───────────────────────────────────────────────────────
  // All archived ventures (for the global /ventures/archive view)
  listAllArchived: adminProcedure
    .query(async () => {
      const db = await getDb();
      return db
        .select({
          archive: ventureArchive,
          ventureName: ventures.name,
          ventureColor: ventures.color,
        })
        .from(ventureArchive)
        .leftJoin(ventures, eq(ventureArchive.ventureId, ventures.id))
        .where(eq(ventureArchive.status, "archived"))
        .orderBy(desc(ventureArchive.createdAt));
    }),

  // ── archive.restore ───────────────────────────────────────────────────────
  // Restore an archived venture back to active
  restore: protectedProcedure
    .input(z.object({ ventureId: z.string(), restoredBy: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      await assertVentureAccess(db, ctx.user, input.ventureId);

      // Mark archive records as restored
      await db
        .update(ventureArchive)
        .set({ status: "restored", restoredBy: input.restoredBy, restoredAt: new Date() })
        .where(
          and(
            eq(ventureArchive.ventureId, input.ventureId),
            eq(ventureArchive.status, "archived"),
          ),
        );

      // Restore venture to an active validation status and push back to decision_gate
      await db
        .update(ventures)
        .set({
          validationStatus: "validating",
          workflowStage:    "command_centre_review",
          pivotRequired:    false,
          pivotReason:      null,
          updatedAt:        new Date(),
        })
        .where(eq(ventures.id, input.ventureId));

      return { ok: true };
    }),
});
