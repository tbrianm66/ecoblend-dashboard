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
});
