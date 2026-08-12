/**
 * Sprint 57 — Specialist Services Router
 * Manages the specialist directory, service task assignments, and commissions.
 */
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import {
  specialists,
  specialistCommissions,
  specialistServiceTasks,
} from "../drizzle/schema";

// ── Specialist Directory ──────────────────────────────────────────────────────
const specialistsRouter = router({
  list: publicProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (input?.category) {
        return db!.select().from(specialists)
          .where(eq(specialists.category, input.category))
          .orderBy(desc(specialists.rating));
      }
      return db!.select().from(specialists).orderBy(desc(specialists.rating));
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db!.select().from(specialists)
        .where(eq(specialists.id, input.id));
      return rows[0] ?? null;
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string().min(1),
      role: z.string().min(1),
      category: z.string().min(1),
      rate: z.string().optional(),
      availability: z.enum(["Available", "Limited", "Busy"]).optional(),
      rating: z.number().min(0).max(5).optional(),
      completedJobs: z.number().optional(),
      bio: z.string().optional(),
      skills: z.string().optional(),       // JSON array string
      portfolioUrl: z.string().optional(),
      linkedinUrl: z.string().optional(),
      isVerified: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      if (id) {
        const updateData: any = { ...data, updatedAt: new Date() };
        if (updateData.rating !== undefined) updateData.rating = String(updateData.rating);
        await db!.update(specialists).set(updateData)
          .where(eq(specialists.id, id));
        return { id };
      }
      const result = await db!.insert(specialists).values(data as any);
      return { id: (result as any)[0]?.insertId ?? null };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.delete(specialists).where(eq(specialists.id, input.id));
      return { success: true };
    }),

  getSummary: publicProcedure
    .query(async () => {
      const db = await getDb();
      const rows = await db!.select().from(specialists);
      const total = rows.length;
      const available = rows.filter(r => r.availability === "Available").length;
      const verified = rows.filter(r => r.isVerified).length;
      const avgRating = total > 0
        ? Math.round((rows.reduce((s, r) => s + parseFloat(String(r.rating ?? 0)), 0) / total) * 10) / 10
        : 0;
      const byCategory = rows.reduce((acc, r) => {
        acc[r.category] = (acc[r.category] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return { total, available, verified, avgRating, byCategory };
    }),
});

// ── Service Tasks ─────────────────────────────────────────────────────────────
const serviceTasksRouter = router({
  list: publicProcedure
    .input(z.object({
      ventureId: z.string().optional(),
      status: z.string().optional(),
      category: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [];
      if (input?.ventureId) conditions.push(eq(specialistServiceTasks.ventureId, input.ventureId));
      if (input?.status) conditions.push(eq(specialistServiceTasks.status, input.status));
      if (input?.category) conditions.push(eq(specialistServiceTasks.category, input.category));
      return db!.select().from(specialistServiceTasks)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(specialistServiceTasks.createdAt));
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().min(1),
      title: z.string().min(1),
      description: z.string().optional(),
      category: z.string().min(1),
      priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
      status: z.enum(["Open", "Assigned", "In Progress", "Review", "Complete", "Cancelled"]).optional(),
      brlStage: z.number().optional(),
      estimatedHrs: z.number().optional(),
      assignedTo: z.number().optional(),
      dueDate: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      if (id) {
        const updateData: any = { ...data, updatedAt: new Date() };
        if (updateData.estimatedHrs !== undefined) updateData.estimatedHrs = String(updateData.estimatedHrs);
        await db!.update(specialistServiceTasks).set(updateData)
          .where(eq(specialistServiceTasks.id, id));
        return { id };
      }
      const result = await db!.insert(specialistServiceTasks).values(data as any);
      return { id: (result as any)[0]?.insertId ?? null };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.delete(specialistServiceTasks).where(eq(specialistServiceTasks.id, input.id));
      return { success: true };
    }),

  assign: protectedProcedure
    .input(z.object({ id: z.number(), specialistId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.update(specialistServiceTasks)
        .set({ assignedTo: input.specialistId, status: "Assigned", updatedAt: new Date() })
        .where(eq(specialistServiceTasks.id, input.id));
      return { success: true };
    }),
});

// ── Commissions ───────────────────────────────────────────────────────────────
const commissionsRouter = router({
  list: publicProcedure
    .input(z.object({
      ventureId: z.string().optional(),
      status: z.string().optional(),
      specialistId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [];
      if (input?.ventureId) conditions.push(eq(specialistCommissions.ventureId, input.ventureId));
      if (input?.status) conditions.push(eq(specialistCommissions.status, input.status));
      if (input?.specialistId) conditions.push(eq(specialistCommissions.specialistId, input.specialistId));
      return db!.select().from(specialistCommissions)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(specialistCommissions.createdAt));
    }),

  create: protectedProcedure
    .input(z.object({
      ventureId: z.string().min(1),
      specialistId: z.number(),
      serviceTaskId: z.number().optional(),
      title: z.string().min(1),
      brief: z.string().optional(),
      budget: z.number().optional(),
      agreedFee: z.number().optional(),
      dueDate: z.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      // Compute platform fee as 10% of agreed fee
      const platformFee = input.agreedFee ? input.agreedFee * 0.1 : undefined;
      const result = await db!.insert(specialistCommissions).values({
        ...input,
        platformFee: platformFee as any,
        status: "Open",
      } as any);
      return { id: (result as any)[0]?.insertId ?? null };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["Open", "Commissioned", "In Review", "Complete", "Cancelled"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const update: Record<string, any> = { status: input.status, updatedAt: new Date() };
      if (input.status === "Complete") update.completedAt = new Date();
      await db!.update(specialistCommissions).set(update)
        .where(eq(specialistCommissions.id, input.id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.delete(specialistCommissions).where(eq(specialistCommissions.id, input.id));
      return { success: true };
    }),

  getSummary: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db!.select().from(specialistCommissions)
        .where(input?.ventureId ? eq(specialistCommissions.ventureId, input.ventureId) : undefined);
      const total = rows.length;
      const open = rows.filter(r => r.status === "Open").length;
      const active = rows.filter(r => r.status === "Commissioned" || r.status === "In Review").length;
      const complete = rows.filter(r => r.status === "Complete").length;
      const totalFees = rows.reduce((s, r) => s + parseFloat(String(r.agreedFee ?? 0)), 0);
      const totalPlatformFees = rows.reduce((s, r) => s + parseFloat(String(r.platformFee ?? 0)), 0);
      return { total, open, active, complete, totalFees, totalPlatformFees };
    }),
});

// ── Combined Router ───────────────────────────────────────────────────────────
export const specialistServicesRouter = router({
  specialists: specialistsRouter,
  serviceTasks: serviceTasksRouter,
  commissions: commissionsRouter,
});
