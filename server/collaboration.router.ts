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

  getAdvisoryReviews: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const { eq, desc } = await import("drizzle-orm");
      const { advisoryReviews } = await import("../drizzle/schema");
      return db
        .select()
        .from(advisoryReviews)
        .where(eq(advisoryReviews.ventureId, input.ventureId))
        .orderBy(desc(advisoryReviews.createdAt));
    }),

  submitAdvisoryReview: publicProcedure
    .input(z.object({
      ventureId:        z.string(),
      advisorName:      z.string().min(1),
      advisorRole:      z.string().min(1),
      feedbackNotes:    z.string().min(1),
      validationRating: z.number().int().min(0).max(10),
      signOffStatus:    z.enum(["Approved", "Needs_Revision", "Pending"]).default("Pending"),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const { advisoryReviews } = await import("../drizzle/schema");
      const [row] = await db
        .insert(advisoryReviews)
        .values({
          ventureId:        input.ventureId,
          advisorName:      input.advisorName,
          advisorRole:      input.advisorRole,
          feedbackNotes:    input.feedbackNotes,
          validationRating: input.validationRating,
          signOffStatus:    input.signOffStatus,
        })
        .returning();
      return row;
    }),
});
