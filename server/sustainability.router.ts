import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";

export const sustainabilityRouter = router({
  getHubData: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const { eq } = await import("drizzle-orm");
      const { sustainabilityHub } = await import("../drizzle/schema");
      const [row] = await db
        .select()
        .from(sustainabilityHub)
        .where(eq(sustainabilityHub.ventureId, input.ventureId));
      return row ?? null;
    }),

  getImpactMetrics: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const { eq, asc } = await import("drizzle-orm");
      const { impactMetrics } = await import("../drizzle/schema");
      return db
        .select()
        .from(impactMetrics)
        .where(eq(impactMetrics.ventureId, input.ventureId))
        .orderBy(asc(impactMetrics.category), asc(impactMetrics.metricName));
    }),

  getLcaCarbon: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const { eq } = await import("drizzle-orm");
      const { lcaCarbon } = await import("../drizzle/schema");
      const [row] = await db
        .select()
        .from(lcaCarbon)
        .where(eq(lcaCarbon.ventureId, input.ventureId));
      return row ?? null;
    }),

  getCircularityData: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const { eq } = await import("drizzle-orm");
      const { circularityMetrics } = await import("../drizzle/schema");
      const [row] = await db
        .select()
        .from(circularityMetrics)
        .where(eq(circularityMetrics.ventureId, input.ventureId));
      return row ?? null;
    }),

  getEsgBcorpData: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const { eq } = await import("drizzle-orm");
      const { esgBcorpMetrics } = await import("../drizzle/schema");
      const [row] = await db
        .select()
        .from(esgBcorpMetrics)
        .where(eq(esgBcorpMetrics.ventureId, input.ventureId));
      return row ?? null;
    }),
});
