/**
 * Commercial CRM Router
 * Covers: pipelines, pipeline stages, contacts, leads, deals, activities, summary
 */
import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  crmPipelines, crmPipelineStages, crmContacts,
  crmLeads, crmDeals, crmActivities,
} from "../drizzle/schema";
import { eq, desc, and, isNull, sql } from "drizzle-orm";

// ─── Pipelines ────────────────────────────────────────────────────────────────
const pipelinesRouter = router({
  list: protectedProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const q = input.ventureId
        ? db.select().from(crmPipelines).where(eq(crmPipelines.ventureId, input.ventureId)).orderBy(desc(crmPipelines.createdAt))
        : db.select().from(crmPipelines).orderBy(desc(crmPipelines.createdAt));
      return q;
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      name: z.string().min(1),
      description: z.string().optional(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      if (input.id) {
        await db.update(crmPipelines).set({ ...input, updatedAt: new Date() }).where(eq(crmPipelines.id, input.id));
        return { id: input.id };
      }
      const result = await db.insert(crmPipelines).values({ ...input });
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(crmPipelines).where(eq(crmPipelines.id, input.id));
      return { success: true };
    }),
});

// ─── Pipeline Stages ──────────────────────────────────────────────────────────
const stagesRouter = router({
  list: protectedProcedure
    .input(z.object({ pipelineId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(crmPipelineStages)
        .where(eq(crmPipelineStages.pipelineId, String(input.pipelineId)))
        .orderBy(crmPipelineStages.order);
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      pipelineId: z.number(),
      name: z.string().min(1),
      order: z.number().default(0),
      probability: z.number().min(0).max(100).optional(),
      color: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const data = { ...input, pipelineId: String(input.pipelineId) };
      if (input.id) {
        await db.update(crmPipelineStages).set(data).where(eq(crmPipelineStages.id, input.id));
        return { id: input.id };
      }
      const result = await db.insert(crmPipelineStages).values(data);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(crmPipelineStages).where(eq(crmPipelineStages.id, input.id));
      return { success: true };
    }),
});

// ─── Contacts ─────────────────────────────────────────────────────────────────
const contactsRouter = router({
  list: protectedProcedure
    .input(z.object({ ventureId: z.string().optional(), contactType: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [];
      if (input.ventureId) conditions.push(eq(crmContacts.ventureId, input.ventureId));
      if (input.contactType) conditions.push(eq(crmContacts.contactType, input.contactType));
      return conditions.length
        ? db.select().from(crmContacts).where(and(...conditions)).orderBy(desc(crmContacts.createdAt))
        : db.select().from(crmContacts).orderBy(desc(crmContacts.createdAt));
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      company: z.string().optional(),
      jobTitle: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      linkedinUrl: z.string().optional(),
      contactType: z.string().optional(),
      status: z.string().optional(),
      source: z.string().optional(),
      tags: z.string().optional(),
      notes: z.string().optional(),
      lastContactedAt: z.number().optional(),
      nextFollowUpAt: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      if (input.id) {
        await db.update(crmContacts).set({ ...input, updatedAt: new Date() }).where(eq(crmContacts.id, input.id));
        return { id: input.id };
      }
      const result = await db.insert(crmContacts).values(input);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(crmContacts).where(eq(crmContacts.id, input.id));
      return { success: true };
    }),
});

// ─── Leads ────────────────────────────────────────────────────────────────────
const leadsRouter = router({
  list: protectedProcedure
    .input(z.object({ ventureId: z.string().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [];
      if (input.ventureId) conditions.push(eq(crmLeads.ventureId, input.ventureId));
      if (input.status) conditions.push(eq(crmLeads.status, input.status));
      return conditions.length
        ? db.select().from(crmLeads).where(and(...conditions)).orderBy(desc(crmLeads.createdAt))
        : db.select().from(crmLeads).orderBy(desc(crmLeads.createdAt));
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      contactId: z.string().optional(),
      title: z.string().min(1),
      company: z.string().optional(),
      source: z.string().optional(),
      status: z.string().optional(),
      score: z.number().min(0).max(100).optional(),
      estimatedValue: z.number().optional(),
      assignedTo: z.string().optional(),
      nextAction: z.string().optional(),
      nextActionDate: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      if (input.id) {
        await db.update(crmLeads).set({ ...input, updatedAt: new Date() }).where(eq(crmLeads.id, input.id));
        return { id: input.id };
      }
      const result = await db.insert(crmLeads).values(input);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(crmLeads).where(eq(crmLeads.id, input.id));
      return { success: true };
    }),
});

// ─── Deals ────────────────────────────────────────────────────────────────────
const dealsRouter = router({
  list: protectedProcedure
    .input(z.object({ ventureId: z.string().optional(), status: z.string().optional(), pipelineId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [];
      if (input.ventureId) conditions.push(eq(crmDeals.ventureId, input.ventureId));
      if (input.status) conditions.push(eq(crmDeals.status, input.status));
      if (input.pipelineId) conditions.push(eq(crmDeals.pipelineId, String(input.pipelineId)));
      return conditions.length
        ? db.select().from(crmDeals).where(and(...conditions)).orderBy(desc(crmDeals.createdAt))
        : db.select().from(crmDeals).orderBy(desc(crmDeals.createdAt));
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      pipelineId: z.number().optional(),
      stageId: z.number().optional(),
      contactId: z.number().optional(),
      title: z.string().min(1),
      company: z.string().optional(),
      value: z.number().optional(),
      currency: z.string().optional(),
      probability: z.number().min(0).max(100).optional(),
      expectedCloseAt: z.number().optional(),
      closedAt: z.number().optional(),
      status: z.string().optional(),
      lostReason: z.string().optional(),
      assignedTo: z.string().optional(),
      tags: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const data = {
        ...input,
        pipelineId: input.pipelineId ? String(input.pipelineId) : undefined,
        stageId: input.stageId ? String(input.stageId) : undefined,
        contactId: input.contactId ? String(input.contactId) : undefined,
      };
      if (input.id) {
        await db.update(crmDeals).set({ ...data, updatedAt: new Date() }).where(eq(crmDeals.id, input.id));
        return { id: input.id };
      }
      const result = await db.insert(crmDeals).values(data);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(crmDeals).where(eq(crmDeals.id, input.id));
      return { success: true };
    }),
});

// ─── Activities ───────────────────────────────────────────────────────────────
const activitiesRouter = router({
  list: protectedProcedure
    .input(z.object({
      ventureId: z.string().optional(),
      dealId: z.number().optional(),
      contactId: z.number().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [];
      if (input.ventureId) conditions.push(eq(crmActivities.ventureId, input.ventureId));
      if (input.dealId) conditions.push(eq(crmActivities.dealId, String(input.dealId)));
      if (input.contactId) conditions.push(eq(crmActivities.contactId, String(input.contactId)));
      if (input.status) conditions.push(eq(crmActivities.status, input.status));
      return conditions.length
        ? db.select().from(crmActivities).where(and(...conditions)).orderBy(desc(crmActivities.createdAt))
        : db.select().from(crmActivities).orderBy(desc(crmActivities.createdAt));
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      contactId: z.number().optional(),
      dealId: z.number().optional(),
      leadId: z.number().optional(),
      type: z.string().min(1),
      subject: z.string().min(1),
      description: z.string().optional(),
      outcome: z.string().optional(),
      dueAt: z.number().optional(),
      completedAt: z.number().optional(),
      status: z.string().optional(),
      assignedTo: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const data = {
        ...input,
        contactId: input.contactId ? String(input.contactId) : undefined,
        dealId: input.dealId ? String(input.dealId) : undefined,
        leadId: input.leadId ? String(input.leadId) : undefined,
      };
      if (input.id) {
        await db.update(crmActivities).set({ ...data, updatedAt: new Date() }).where(eq(crmActivities.id, input.id));
        return { id: input.id };
      }
      const result = await db.insert(crmActivities).values(data);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(crmActivities).where(eq(crmActivities.id, input.id));
      return { success: true };
    }),
});

// ─── Summary ──────────────────────────────────────────────────────────────────
const crmSummaryRouter = router({
  get: protectedProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const conditions = input.ventureId ? [eq(crmDeals.ventureId, input.ventureId)] : [];
      const deals = conditions.length
        ? await db.select().from(crmDeals).where(and(...conditions))
        : await db.select().from(crmDeals);

      const contacts = input.ventureId
        ? await db.select().from(crmContacts).where(eq(crmContacts.ventureId, input.ventureId))
        : await db.select().from(crmContacts);

      const leads = input.ventureId
        ? await db.select().from(crmLeads).where(eq(crmLeads.ventureId, input.ventureId))
        : await db.select().from(crmLeads);

      const openDeals = deals.filter(d => d.status === "open");
      const wonDeals = deals.filter(d => d.status === "won");
      const lostDeals = deals.filter(d => d.status === "lost");

      const totalPipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const totalWonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const winRate = deals.length > 0
        ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length || 1)) * 100)
        : 0;
      const avgDealSize = wonDeals.length > 0
        ? Math.round(totalWonValue / wonDeals.length)
        : 0;

      return {
        totalContacts: contacts.length,
        totalLeads: leads.length,
        qualifiedLeads: leads.filter(l => l.status === "qualified").length,
        totalDeals: deals.length,
        openDeals: openDeals.length,
        wonDeals: wonDeals.length,
        lostDeals: lostDeals.length,
        totalPipelineValue,
        totalWonValue,
        winRate,
        avgDealSize,
      };
    }),
});

export const commercialCrmRouter = router({
  pipelines: pipelinesRouter,
  stages: stagesRouter,
  contacts: contactsRouter,
  leads: leadsRouter,
  deals: dealsRouter,
  activities: activitiesRouter,
  summary: crmSummaryRouter,
});
