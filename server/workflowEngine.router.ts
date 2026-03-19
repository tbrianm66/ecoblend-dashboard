// ── Workflow Engine tRPC Router ───────────────────────────────────────────────
// Exposes the trigger log, manual re-run, and summary stats to the frontend.

import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { desc, eq, and, count, sql } from "drizzle-orm";
import { workflowTriggerLog } from "../drizzle/schema";
import { dispatchTrigger, TriggerType } from "./workflowEngine";

export const workflowEngineRouter = router({
  // List all trigger log entries, newest first
  listTriggerLog: publicProcedure
    .input(
      z.object({
        ventureId: z.string().optional(),
        triggerType: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const conditions = [];
      if (input.ventureId) conditions.push(eq(workflowTriggerLog.ventureId, input.ventureId));
      if (input.triggerType) conditions.push(eq(workflowTriggerLog.triggerType, input.triggerType));
      if (input.status) conditions.push(eq(workflowTriggerLog.status, input.status));

      const rows = await db
        .select()
        .from(workflowTriggerLog)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(workflowTriggerLog.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [{ total }] = await db
        .select({ total: count() })
        .from(workflowTriggerLog)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return { rows, total };
    }),

  // Get a single trigger log entry
  getTriggerLog: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const [row] = await db
        .select()
        .from(workflowTriggerLog)
        .where(eq(workflowTriggerLog.id, input.id))
        .limit(1);
      return row ?? null;
    }),

  // Manual re-run of a trigger (creates a new log entry with retriedFrom set)
  rerunTrigger: publicProcedure
    .input(
      z.object({
        triggerType: z.enum(["research_completed", "audit_failed", "supplier_approved"]),
        sourceRecordId: z.number(),
        originalLogId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await dispatchTrigger(
        input.triggerType as TriggerType,
        input.sourceRecordId,
        { retriedFrom: input.originalLogId }
      );
      return result;
    }),

  // Summary stats for the dashboard cards
  getTriggerStats: publicProcedure.query(async () => {
    const db = (await getDb())!;

    const rows = await db
      .select({
        triggerType: workflowTriggerLog.triggerType,
        status: workflowTriggerLog.status,
        cnt: count(),
      })
      .from(workflowTriggerLog)
      .groupBy(workflowTriggerLog.triggerType, workflowTriggerLog.status);

    // Aggregate into a summary object
    const summary: Record<string, { success: number; failed: number; skipped: number; total: number }> = {};
    for (const row of rows) {
      const t = row.triggerType;
      if (!summary[t]) summary[t] = { success: 0, failed: 0, skipped: 0, total: 0 };
      if (row.status === "success") summary[t].success += row.cnt;
      else if (row.status === "failed") summary[t].failed += row.cnt;
      else if (row.status === "skipped") summary[t].skipped += row.cnt;
      summary[t].total += row.cnt;
    }

    const totalFired = rows.reduce((a, r) => a + r.cnt, 0);
    const totalSuccess = rows.filter((r) => r.status === "success").reduce((a, r) => a + r.cnt, 0);
    const totalFailed = rows.filter((r) => r.status === "failed").reduce((a, r) => a + r.cnt, 0);

    // Recent activity (last 10 entries)
    const recent = await db
      .select()
      .from(workflowTriggerLog)
      .orderBy(desc(workflowTriggerLog.createdAt))
      .limit(10);

    return { summary, totalFired, totalSuccess, totalFailed, recent };
  }),

  // Fire a trigger manually from the UI (for testing / admin use)
  fireTrigger: publicProcedure
    .input(
      z.object({
        triggerType: z.enum(["research_completed", "audit_failed", "supplier_approved"]),
        sourceRecordId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return dispatchTrigger(input.triggerType as TriggerType, input.sourceRecordId);
    }),
});
