/**
 * Sprint 56 — Marketing Strategy, Brand Readiness & PR/Newsletter Router
 * Covers: marketing campaigns, channel scores, brand readiness, brand checklist,
 *         press releases, newsletter campaigns, media coverage
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { eq, desc, and } from "drizzle-orm";
import {
  marketingCampaigns,
  marketingChannelScores,
  brandReadinessScores,
  brandChecklistItems,
  pressReleases,
  newsletterCampaigns,
  mediaCoverage,
} from "../drizzle/schema";

// ── Marketing Campaigns ───────────────────────────────────────────────────────
const campaignsRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [];
      if (input.ventureId) conditions.push(eq(marketingCampaigns.ventureId, input.ventureId));
      if (input.status) conditions.push(eq(marketingCampaigns.status, input.status));
      return db!.select().from(marketingCampaigns)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(marketingCampaigns.createdAt));
    }),

  upsert: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().min(1),
      name: z.string().min(1),
      channel: z.string().min(1),
      status: z.enum(["Planned", "Live", "Completed", "Paused"]).default("Planned"),
      budget: z.number().default(0),
      spent: z.number().default(0),
      leads: z.number().default(0),
      conversions: z.number().default(0),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      objective: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      if (id) {
        await db!.update(marketingCampaigns).set(data).where(eq(marketingCampaigns.id, id));
        return { id };
      }
      const [result] = await db!.insert(marketingCampaigns).values(data);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.delete(marketingCampaigns).where(eq(marketingCampaigns.id, input.id));
      return { success: true };
    }),

  getSummary: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = input.ventureId ? [eq(marketingCampaigns.ventureId, input.ventureId)] : [];
      const rows = await db!.select().from(marketingCampaigns)
        .where(conditions.length ? and(...conditions) : undefined);
      const total = rows.length;
      const live = rows.filter(r => r.status === "Live").length;
      const totalBudget = rows.reduce((s, r) => s + (r.budget ?? 0), 0);
      const totalSpent = rows.reduce((s, r) => s + (r.spent ?? 0), 0);
      const totalLeads = rows.reduce((s, r) => s + (r.leads ?? 0), 0);
      const totalConversions = rows.reduce((s, r) => s + (r.conversions ?? 0), 0);
      const conversionRate = totalLeads > 0 ? Math.round((totalConversions / totalLeads) * 100) : 0;
      return { total, live, totalBudget, totalSpent, totalLeads, totalConversions, conversionRate };
    }),
});

// ── Marketing Channel Scores ──────────────────────────────────────────────────
const channelScoresRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string().optional(), period: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [];
      if (input.ventureId) conditions.push(eq(marketingChannelScores.ventureId, input.ventureId));
      if (input.period) conditions.push(eq(marketingChannelScores.period, input.period));
      return db!.select().from(marketingChannelScores)
        .where(conditions.length ? and(...conditions) : undefined);
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().min(1),
      channel: z.string().min(1),
      score: z.number().min(0).max(100),
      period: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      if (id) {
        await db!.update(marketingChannelScores).set(data).where(eq(marketingChannelScores.id, id));
        return { id };
      }
      const [result] = await db!.insert(marketingChannelScores).values(data);
      return { id: (result as any).insertId };
    }),
});

// ── Brand Readiness ───────────────────────────────────────────────────────────
const brandReadinessRouter = router({
  getScores: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db!.select().from(brandReadinessScores)
        .where(eq(brandReadinessScores.ventureId, input.ventureId))
        .orderBy(desc(brandReadinessScores.assessedAt));
    }),

  upsertScore: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().min(1),
      dimension: z.string().min(1),
      score: z.number().min(0).max(100),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      if (id) {
        await db!.update(brandReadinessScores).set(data).where(eq(brandReadinessScores.id, id));
        return { id };
      }
      const [result] = await db!.insert(brandReadinessScores).values(data);
      return { id: (result as any).insertId };
    }),

  getChecklist: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db!.select().from(brandChecklistItems)
        .where(eq(brandChecklistItems.ventureId, input.ventureId))
        .orderBy(brandChecklistItems.category);
    }),

  toggleChecklistItem: protectedProcedure
    .input(z.object({ id: z.number(), completed: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.update(brandChecklistItems)
        .set({ completed: input.completed ? 1 : 0, completedAt: input.completed ? new Date() : null })
        .where(eq(brandChecklistItems.id, input.id));
      return { success: true };
    }),

  upsertChecklistItem: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().min(1),
      category: z.string().min(1),
      item: z.string().min(1),
      completed: z.boolean().default(false),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, completed, ...rest } = input;
      const data = { ...rest, completed: completed ? 1 : 0 };
      if (id) {
        await db!.update(brandChecklistItems).set(data).where(eq(brandChecklistItems.id, id));
        return { id };
      }
      const [result] = await db!.insert(brandChecklistItems).values(data);
      return { id: (result as any).insertId };
    }),

  deleteChecklistItem: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.delete(brandChecklistItems).where(eq(brandChecklistItems.id, input.id));
      return { success: true };
    }),

  getOverallScore: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const scores = await db!.select().from(brandReadinessScores)
        .where(eq(brandReadinessScores.ventureId, input.ventureId));
      const checklist = await db!.select().from(brandChecklistItems)
        .where(eq(brandChecklistItems.ventureId, input.ventureId));
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((s, r) => s + (r.score ?? 0), 0) / scores.length)
        : 0;
      const checklistTotal = checklist.length;
      const checklistDone = checklist.filter(c => c.completed === 1).length;
      const checklistPct = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;
      return { avgScore, checklistTotal, checklistDone, checklistPct, dimensions: scores };
    }),
});

// ── Press Releases ────────────────────────────────────────────────────────────
const pressReleasesRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [];
      if (input.ventureId) conditions.push(eq(pressReleases.ventureId, input.ventureId));
      if (input.status) conditions.push(eq(pressReleases.status, input.status));
      return db!.select().from(pressReleases)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(pressReleases.createdAt));
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().min(1),
      title: z.string().min(1),
      summary: z.string().optional(),
      status: z.enum(["Draft", "Scheduled", "Published", "Archived"]).default("Draft"),
      publishedAt: z.string().optional(),
      mediaOutlets: z.string().optional(),
      coverageLinks: z.string().optional(),
      reach: z.number().default(0),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, publishedAt, ...rest } = input;
      const data = { ...rest, publishedAt: publishedAt ? new Date(publishedAt) : undefined };
      if (id) {
        await db!.update(pressReleases).set(data).where(eq(pressReleases.id, id));
        return { id };
      }
      const [result] = await db!.insert(pressReleases).values(data);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.delete(pressReleases).where(eq(pressReleases.id, input.id));
      return { success: true };
    }),
});

// ── Newsletter Campaigns ──────────────────────────────────────────────────────
const newsletterRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [];
      if (input.ventureId) conditions.push(eq(newsletterCampaigns.ventureId, input.ventureId));
      if (input.status) conditions.push(eq(newsletterCampaigns.status, input.status));
      return db!.select().from(newsletterCampaigns)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(newsletterCampaigns.createdAt));
    }),

  upsert: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().min(1),
      subject: z.string().min(1),
      previewText: z.string().optional(),
      status: z.enum(["Draft", "Scheduled", "Sent"]).default("Draft"),
      scheduledAt: z.string().optional(),
      sentAt: z.string().optional(),
      recipients: z.number().default(0),
      openRate: z.number().default(0),
      clickRate: z.number().default(0),
      unsubscribes: z.number().default(0),
      contentUrl: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, scheduledAt, sentAt, ...rest } = input;
      const data = {
        ...rest,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        sentAt: sentAt ? new Date(sentAt) : undefined,
      };
      if (id) {
        await db!.update(newsletterCampaigns).set(data).where(eq(newsletterCampaigns.id, id));
        return { id };
      }
      const [result] = await db!.insert(newsletterCampaigns).values(data);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.delete(newsletterCampaigns).where(eq(newsletterCampaigns.id, input.id));
      return { success: true };
    }),

  getSummary: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = input.ventureId ? [eq(newsletterCampaigns.ventureId, input.ventureId)] : [];
      const rows = await db!.select().from(newsletterCampaigns)
        .where(conditions.length ? and(...conditions) : undefined);
      const total = rows.length;
      const sent = rows.filter(r => r.status === "Sent").length;
      const totalRecipients = rows.reduce((s, r) => s + (r.recipients ?? 0), 0);
      const avgOpenRate = sent > 0
        ? Math.round(rows.filter(r => r.status === "Sent").reduce((s, r) => s + (r.openRate ?? 0), 0) / sent)
        : 0;
      const avgClickRate = sent > 0
        ? Math.round(rows.filter(r => r.status === "Sent").reduce((s, r) => s + (r.clickRate ?? 0), 0) / sent)
        : 0;
      return { total, sent, totalRecipients, avgOpenRate, avgClickRate };
    }),
});

// ── Media Coverage ────────────────────────────────────────────────────────────
const mediaCoverageRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string().optional(), sentiment: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [];
      if (input.ventureId) conditions.push(eq(mediaCoverage.ventureId, input.ventureId));
      if (input.sentiment) conditions.push(eq(mediaCoverage.sentiment, input.sentiment));
      return db!.select().from(mediaCoverage)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(mediaCoverage.createdAt));
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().min(1),
      outlet: z.string().min(1),
      headline: z.string().min(1),
      url: z.string().optional(),
      sentiment: z.enum(["positive", "neutral", "negative"]).default("neutral"),
      reach: z.number().default(0),
      publishedAt: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, publishedAt, ...rest } = input;
      const data = { ...rest, publishedAt: publishedAt ? new Date(publishedAt) : undefined };
      if (id) {
        await db!.update(mediaCoverage).set(data).where(eq(mediaCoverage.id, id));
        return { id };
      }
      const [result] = await db!.insert(mediaCoverage).values(data);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.delete(mediaCoverage).where(eq(mediaCoverage.id, input.id));
      return { success: true };
    }),

  getSummary: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = input.ventureId ? [eq(mediaCoverage.ventureId, input.ventureId)] : [];
      const rows = await db!.select().from(mediaCoverage)
        .where(conditions.length ? and(...conditions) : undefined);
      const total = rows.length;
      const positive = rows.filter(r => r.sentiment === "positive").length;
      const negative = rows.filter(r => r.sentiment === "negative").length;
      const neutral = rows.filter(r => r.sentiment === "neutral").length;
      const totalReach = rows.reduce((s, r) => s + (r.reach ?? 0), 0);
      return { total, positive, negative, neutral, totalReach };
    }),
});

// ── Export ────────────────────────────────────────────────────────────────────
export const marketingBrandRouter = router({
  campaigns: campaignsRouter,
  channelScores: channelScoresRouter,
  brandReadiness: brandReadinessRouter,
  pressReleases: pressReleasesRouter,
  newsletter: newsletterRouter,
  mediaCoverage: mediaCoverageRouter,
});
