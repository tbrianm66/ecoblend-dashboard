import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

export const collaborationRouter = router({
  getTeamTasks: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const { eq, asc } = await import("drizzle-orm");
      const { collaborationTasks } = await import("../drizzle/schema");
      return db
        .select()
        .from(collaborationTasks)
        .where(eq(collaborationTasks.ventureId, input.ventureId))
        .orderBy(asc(collaborationTasks.createdAt));
    }),

  createTeamTask: publicProcedure
    .input(z.object({
      ventureId:      z.string(),
      taskTitle:      z.string().min(1),
      pillarCategory: z.string().min(1),
      assignedRole:   z.string().min(1),
      priority:       z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
      status:         z.enum(["Todo", "In_Progress", "Completed"]).default("Todo"),
      dueDate:        z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const { collaborationTasks } = await import("../drizzle/schema");
      const [row] = await db
        .insert(collaborationTasks)
        .values({
          ventureId:      input.ventureId,
          taskTitle:      input.taskTitle,
          pillarCategory: input.pillarCategory,
          assignedRole:   input.assignedRole,
          priority:       input.priority,
          status:         input.status,
          dueDate:        input.dueDate ? new Date(input.dueDate) : undefined,
        })
        .returning();
      return row;
    }),
});
