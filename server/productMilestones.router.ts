/**
 * Product Milestones Router — R&D prototype & MVP build tracking
 *
 * Server-side enforcement:
 *   - successCriteria is required for mvp_definition milestone type
 */
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { productMilestones } from "../drizzle/schema";

const ventureInput = z.object({ ventureId: z.string() });

const milestoneBody = z.object({
  ventureId:               z.string(),
  milestoneTitle:          z.string().min(1),
  milestoneType:           z.string().optional(),
  mvpFormat:               z.string().optional(),
  stage:                   z.string().optional(),
  description:             z.string().optional(),
  hypothesisTested:        z.string().optional(),
  successCriteria:         z.string().optional(),
  failureCriteria:         z.string().optional(),
  leanCanvasVersionAtMvp:  z.number().int().optional(),
  linkedMvpDefinitionId:   z.number().int().optional(),
  userTestCount:           z.number().int().default(0),
  userResponseCaptured:    z.boolean().default(false),
  participants:            z.number().int().default(0),
  validated:               z.number().int().default(0),
  invalidated:             z.number().int().default(0),
  validationRate:          z.number().optional(),
  outcome:                 z.string().optional(),
  keyLearning:             z.string().optional(),
  targetDate:              z.string().optional(),
  completedDate:           z.string().optional(),
  status:                  z.string().default("planned"),
  evidenceUrl:             z.string().optional(),
  assignedTo:              z.string().optional(),
});

export const productMilestonesRouter = router({
  list: publicProcedure
    .input(ventureInput)
    .query(async ({ input }) => {
      const db = await getDb();
      return db
        .select()
        .from(productMilestones)
        .where(eq(productMilestones.ventureId, input.ventureId))
        .orderBy(desc(productMilestones.createdAt));
    }),

  upsert: publicProcedure
    .input(z.object({ id: z.number().optional(), ...milestoneBody.shape }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...body } = input;

      // ── Server-side gate: successCriteria required for testable MVPs ──────
      if (!body.successCriteria?.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Success criteria are required to define a testable MVP. Without them, the MVP evidence gate cannot function.",
        });
      }

      // Auto-compute validationRate if participants > 0
      const participants  = body.participants ?? 0;
      const validated     = body.validated    ?? 0;
      const validationRate = participants > 0 ? validated / participants : undefined;

      if (id) {
        const updated = await db
          .update(productMilestones)
          .set({ ...body, validationRate, updatedAt: new Date() })
          .where(eq(productMilestones.id, id))
          .returning();
        return updated[0];
      }

      const inserted = await db
        .insert(productMilestones)
        .values({ ...body, validationRate })
        .returning();
      return inserted[0];
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(productMilestones).where(eq(productMilestones.id, input.id));
      return { ok: true };
    }),
});
