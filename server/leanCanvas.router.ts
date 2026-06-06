/**
 * Lean Canvas Router
 * Append-only versioning: every save inserts a new row (version = max+1 for
 * that venture) and updates ventures.canvasVersion. Old rows are never deleted.
 */
import { z } from "zod";
import { eq, desc, max, sql } from "drizzle-orm";
import { router, publicProcedure } from "./_core/trpc";
import { assertVentureAccess } from "./discoveryMarket.router";
import { getDb } from "./db";
import { leanCanvases, ventures } from "../drizzle/schema";
import type { TRPCError } from "@trpc/server";

const ventureInput = z.object({ ventureId: z.string() });

const canvasBody = z.object({
  problem:          z.string().optional(),
  solution:         z.string().optional(),
  uniqueValueProp:  z.string().optional(),
  customerSegments: z.string().optional(),
  channels:         z.string().optional(),
  revenueStreams:   z.string().optional(),
  costStructure:    z.string().optional(),
  keyMetrics:       z.string().optional(),
  unfairAdvantage:  z.string().optional(),
  mvpFormat:        z.string().optional(),
  hypothesisTested: z.string().optional(),
  successCriteria:  z.string().optional(),
  notes:            z.string().optional(),
  createdBy:        z.string().optional(),
});

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

      // Compute next version number atomically
      const maxRow = await db
        .select({ m: max(leanCanvases.version) })
        .from(leanCanvases)
        .where(eq(leanCanvases.ventureId, input.ventureId));
      const nextVersion = (maxRow[0]?.m ?? 0) + 1;

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

      return inserted[0];
    }),
});
