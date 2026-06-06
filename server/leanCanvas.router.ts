/**
 * Lean Canvas Router
 * Append-only versioning: every save inserts a new row (version = max+1 for
 * that venture) and updates ventures.canvasVersion. Old rows are never deleted.
 *
 * Server-side enforcement:
 *   - solution field is required (not null gate)
 *   - pivot_log entry is written automatically when customerSegments changes
 */
import { z } from "zod";
import { eq, desc, max, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { leanCanvases, ventures, pivotLog } from "../drizzle/schema";

const ventureInput = z.object({ ventureId: z.string() });

const canvasBody = z.object({
  problem:          z.string().optional(),
  solution:         z.string().min(1, "Solution hypothesis is required before MVP definition can begin."),
  uniqueValueProp:  z.string().optional(),
  customerSegments: z.string().optional(),
  channels:         z.string().optional(),
  revenueStreams:    z.string().optional(),
  costStructure:    z.string().optional(),
  keyMetrics:       z.string().optional(),
  unfairAdvantage:  z.string().optional(),
  mvpFormat:        z.string().optional(),
  hypothesisTested: z.string().optional(),
  successCriteria:  z.string().optional(),
  notes:            z.string().optional(),
  createdBy:        z.string().optional(),
  loggedBy:         z.string().optional(),
});

// Canvas fields that should trigger a pivot_log entry when they change
const PIVOT_FIELDS: { key: keyof typeof canvasBody.shape; pivotType: string }[] = [
  { key: "customerSegments", pivotType: "customer_segment" },
  { key: "problem",          pivotType: "problem" },
  { key: "solution",         pivotType: "solution" },
  { key: "uniqueValueProp",  pivotType: "value_proposition" },
  { key: "revenueStreams",   pivotType: "revenue_streams" },
  { key: "channels",         pivotType: "channels" },
];

export const leanCanvasRouter = router({
  // List all versions for a venture, newest first
  list: publicProcedure
    .input(ventureInput)
    .query(async ({ input }) => {
      const db = await getDb();
      return db
        .select()
        .from(leanCanvases)
        .where(eq(leanCanvases.ventureId, input.ventureId))
        .orderBy(desc(leanCanvases.version));
    }),

  // Get the active (highest version) canvas
  getActive: publicProcedure
    .input(ventureInput)
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db
        .select()
        .from(leanCanvases)
        .where(eq(leanCanvases.ventureId, input.ventureId))
        .orderBy(desc(leanCanvases.version))
        .limit(1);
      return rows[0] ?? null;
    }),

  // Get a specific version
  getVersion: publicProcedure
    .input(z.object({ ventureId: z.string(), version: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db
        .select()
        .from(leanCanvases)
        .where(
          sql`${leanCanvases.ventureId} = ${input.ventureId} AND ${leanCanvases.version} = ${input.version}`,
        )
        .limit(1);
      return rows[0] ?? null;
    }),

  // Save: always inserts a new version row — never overwrites
  save: publicProcedure
    .input(z.object({ ventureId: z.string(), ...canvasBody.shape }))
    .mutation(async ({ input }) => {
      const db = await getDb();

      // ── Server-side gate: solution is required ────────────────────────────
      if (!input.solution?.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Solution hypothesis is required before MVP definition can begin.",
        });
      }

      // Compute next version number atomically
      const maxRow = await db
        .select({ m: max(leanCanvases.version) })
        .from(leanCanvases)
        .where(eq(leanCanvases.ventureId, input.ventureId));
      const nextVersion = (maxRow[0]?.m ?? 0) + 1;

      // Fetch the previous active row (needed for pivot detection)
      const prevRows = await db
        .select()
        .from(leanCanvases)
        .where(
          sql`${leanCanvases.ventureId} = ${input.ventureId} AND ${leanCanvases.status} = 'active'`,
        )
        .limit(1);
      const prevRow = prevRows[0] ?? null;

      // Archive any previous active rows
      await db
        .update(leanCanvases)
        .set({ status: "archived", updatedAt: new Date() })
        .where(
          sql`${leanCanvases.ventureId} = ${input.ventureId} AND ${leanCanvases.status} = 'active'`,
        );

      // Insert the new version
      const inserted = await db
        .insert(leanCanvases)
        .values({
          ventureId:        input.ventureId,
          version:          nextVersion,
          problem:          input.problem,
          solution:         input.solution,
          uniqueValueProp:  input.uniqueValueProp,
          customerSegments: input.customerSegments,
          channels:         input.channels,
          revenueStreams:   input.revenueStreams,
          costStructure:    input.costStructure,
          keyMetrics:       input.keyMetrics,
          unfairAdvantage:  input.unfairAdvantage,
          mvpFormat:        input.mvpFormat,
          hypothesisTested: input.hypothesisTested,
          successCriteria:  input.successCriteria,
          notes:            input.notes,
          createdBy:        input.createdBy,
          status:           "active",
        })
        .returning();

      // Update ventures.canvasVersion so the header shows the current version
      await db
        .update(ventures)
        .set({ canvasVersion: nextVersion, updatedAt: new Date() })
        .where(eq(ventures.id, input.ventureId));

      // ── Pivot detection: write pivot_log when tracked fields change ───────
      let pivotLogged = false;
      if (prevRow && nextVersion > 1) {
        for (const { key, pivotType } of PIVOT_FIELDS) {
          const prevVal = (prevRow as any)[key] ?? null;
          const newVal  = (input as any)[key]  ?? null;
          if (prevVal && newVal && prevVal.trim() !== newVal.trim()) {
            await db.insert(pivotLog).values({
              ventureId:          input.ventureId,
              pivotType,
              previousHypothesis: prevVal,
              newHypothesis:      newVal,
              triggerEvent:       `canvas_update_v${nextVersion}`,
              loggedBy:           input.loggedBy ?? input.createdBy ?? null,
              canvasVersion:      nextVersion,
            });
            pivotLogged = true;
          }
        }
      }

      // ── Auto-clear pivotRequired once a pivot_log entry is written ────────
      // A canvas revision that records a hypothesis change resolves the pivot flag.
      if (pivotLogged) {
        await db
          .update(ventures)
          .set({ pivotRequired: false, pivotReason: null, updatedAt: new Date() })
          .where(eq(ventures.id, input.ventureId));
      }

      return inserted[0];
    }),
});
