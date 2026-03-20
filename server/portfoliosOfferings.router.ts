/**
 * Sprint 61 — Venture → Portfolio → Offering Architecture
 * tRPC router: portfolios + offerings CRUD + offering-level execution linkage
 */
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  portfolios,
  offerings,
  offeringKpiSnapshots,
  offeringFinancialModels,
  offeringWorkflowLinks,
  offeringRevenueLinks,
  offeringSupplyChainLinks,
  offeringExperimentLinks,
  offeringRiskLinks,
  offeringMilestoneLinks,
  offeringCrmLinks,
  offeringAnalyticsLinks,
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

// ── Portfolio sub-router ──────────────────────────────────────────────────────
const portfoliosRouter = router({
  list: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db!
        .select()
        .from(portfolios)
        .where(eq(portfolios.ventureId, input.ventureId))
        .orderBy(portfolios.sortOrder, portfolios.createdAt);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db!
        .select()
        .from(portfolios)
        .where(eq(portfolios.id, input.id));
      return rows[0] ?? null;
    }),

  upsert: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        ventureId: z.string(),
        name: z.string().min(1).max(128),
        description: z.string().optional(),
        portfolioType: z.enum(["Product", "Service", "Licensing", "Platform", "Mixed"]).optional(),
        status: z.enum(["Active", "Pre-Launch", "Archived"]).optional(),
        color: z.string().optional(),
        sortOrder: z.number().int().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const id = input.id ?? `portfolio-${nanoid(10)}`;
      await db!
        .insert(portfolios)
        .values({ ...input, id })
        .onDuplicateKeyUpdate({
          set: {
            name: input.name,
            description: input.description,
            portfolioType: input.portfolioType,
            status: input.status,
            color: input.color,
            sortOrder: input.sortOrder,
          },
        });
      return { id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.delete(portfolios).where(eq(portfolios.id, input.id));
      return { success: true };
    }),
});

// ── Offerings sub-router ──────────────────────────────────────────────────────
const offeringsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        ventureId: z.string().optional(),
        portfolioId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (input.portfolioId) {
        return db!
          .select()
          .from(offerings)
          .where(eq(offerings.portfolioId, input.portfolioId))
          .orderBy(offerings.sortOrder, offerings.createdAt);
      }
      if (input.ventureId) {
        return db!
          .select()
          .from(offerings)
          .where(eq(offerings.ventureId, input.ventureId))
          .orderBy(offerings.sortOrder, offerings.createdAt);
      }
      return [];
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db!
        .select()
        .from(offerings)
        .where(eq(offerings.id, input.id));
      return rows[0] ?? null;
    }),

  upsert: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        portfolioId: z.string(),
        ventureId: z.string(),
        name: z.string().min(1).max(128),
        description: z.string().optional(),
        offeringType: z
          .enum(["Physical Product", "Digital Product", "Service", "SaaS", "Subscription", "Marketplace"])
          .optional(),
        offeringStatus: z
          .enum(["Concept", "Development", "Pilot", "Live", "Scaling", "Sunset"])
          .optional(),
        trl: z.number().int().min(1).max(9).optional(),
        brlScore: z.number().int().min(0).max(100).optional(),
        revenueModel: z.enum(["B2B", "D2C", "B2B2C", "Marketplace", "Licensing", "Freemium"]).optional(),
        targetSegment: z.string().optional(),
        pricePoint: z.string().optional(),
        currency: z.string().optional(),
        launchDate: z.string().optional(),
        color: z.string().optional(),
        logoUrl: z.string().optional(),
        tags: z.string().optional(),
        sortOrder: z.number().int().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const id = input.id ?? `offering-${nanoid(10)}`;
      const launchDate = input.launchDate ? new Date(input.launchDate) : undefined;
      await db!
        .insert(offerings)
        .values({
          id,
          portfolioId: input.portfolioId,
          ventureId: input.ventureId,
          name: input.name,
          description: input.description,
          offeringType: input.offeringType,
          offeringStatus: input.offeringStatus,
          trl: input.trl,
          brlScore: input.brlScore,
          revenueModel: input.revenueModel,
          targetSegment: input.targetSegment,
          pricePoint: input.pricePoint,
          currency: input.currency,
          launchDate,
          color: input.color,
          logoUrl: input.logoUrl,
          tags: input.tags,
          sortOrder: input.sortOrder,
        })
        .onDuplicateKeyUpdate({
          set: {
            name: input.name,
            description: input.description,
            offeringType: input.offeringType,
            offeringStatus: input.offeringStatus,
            trl: input.trl,
            brlScore: input.brlScore,
            revenueModel: input.revenueModel,
            targetSegment: input.targetSegment,
            pricePoint: input.pricePoint,
            currency: input.currency,
            launchDate,
            color: input.color,
            logoUrl: input.logoUrl,
            tags: input.tags,
            sortOrder: input.sortOrder,
          },
        });
      return { id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.delete(offerings).where(eq(offerings.id, input.id));
      return { success: true };
    }),

  // ── KPI Snapshots ───────────────────────────────────────────────────────────
  listKpiSnapshots: protectedProcedure
    .input(z.object({ offeringId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db!
        .select()
        .from(offeringKpiSnapshots)
        .where(eq(offeringKpiSnapshots.offeringId, input.offeringId))
        .orderBy(desc(offeringKpiSnapshots.snapshotDate));
    }),

  upsertKpiSnapshot: protectedProcedure
    .input(
      z.object({
        id: z.number().int().optional(),
        offeringId: z.string(),
        snapshotDate: z.string(),
        revenue: z.string().optional(),
        cogs: z.string().optional(),
        grossMargin: z.number().optional(),
        unitsSold: z.number().int().optional(),
        activeCustomers: z.number().int().optional(),
        cac: z.string().optional(),
        ltv: z.string().optional(),
        nps: z.number().int().min(-100).max(100).optional(),
        trlAtSnapshot: z.number().int().optional(),
        brlAtSnapshot: z.number().int().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const snapshotDate = new Date(input.snapshotDate);
      const { snapshotDate: _sd, id: _id, ...rest } = input;
      if (input.id) {
        await db!
          .update(offeringKpiSnapshots)
          .set({ ...rest, snapshotDate })
          .where(eq(offeringKpiSnapshots.id, input.id));
        return { id: input.id };
      }
      const result = await db!.insert(offeringKpiSnapshots).values({ ...rest, snapshotDate });
      return { id: Number(result[0].insertId) };
    }),

  deleteKpiSnapshot: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.delete(offeringKpiSnapshots).where(eq(offeringKpiSnapshots.id, input.id));
      return { success: true };
    }),

  // ── Financial Models ────────────────────────────────────────────────────────
  listFinancialModels: protectedProcedure
    .input(z.object({ offeringId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db!
        .select()
        .from(offeringFinancialModels)
        .where(eq(offeringFinancialModels.offeringId, input.offeringId))
        .orderBy(desc(offeringFinancialModels.createdAt));
    }),

  upsertFinancialModel: protectedProcedure
    .input(
      z.object({
        id: z.number().int().optional(),
        offeringId: z.string(),
        modelName: z.string().default("Base Case"),
        revenueYear1: z.string().optional(),
        revenueYear2: z.string().optional(),
        revenueYear3: z.string().optional(),
        cogsPercent: z.number().optional(),
        opexMonthly: z.string().optional(),
        breakEvenMonth: z.number().int().optional(),
        fundingRequired: z.string().optional(),
        assumptions: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (input.id) {
        await db!
          .update(offeringFinancialModels)
          .set({ ...input })
          .where(eq(offeringFinancialModels.id, input.id));
        return { id: input.id };
      }
      const result = await db!.insert(offeringFinancialModels).values(input);
      return { id: Number(result[0].insertId) };
    }),

  deleteFinancialModel: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.delete(offeringFinancialModels).where(eq(offeringFinancialModels.id, input.id));
      return { success: true };
    }),
});

// ── Offering Execution Linkage sub-router ─────────────────────────────────────
const offeringLinksRouter = router({
  // Workflows
  linkWorkflow: protectedProcedure
    .input(z.object({ offeringId: z.string(), triggerLogId: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.insert(offeringWorkflowLinks).values(input);
      return { success: true };
    }),
  listWorkflowLinks: protectedProcedure
    .input(z.object({ offeringId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db!.select().from(offeringWorkflowLinks).where(eq(offeringWorkflowLinks.offeringId, input.offeringId));
    }),

  // Revenue
  linkRevenue: protectedProcedure
    .input(z.object({ offeringId: z.string(), snapshotId: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.insert(offeringRevenueLinks).values(input);
      return { success: true };
    }),
  listRevenueLinks: protectedProcedure
    .input(z.object({ offeringId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db!.select().from(offeringRevenueLinks).where(eq(offeringRevenueLinks.offeringId, input.offeringId));
    }),

  // Supply Chain
  linkSupplyChain: protectedProcedure
    .input(z.object({ offeringId: z.string(), projectId: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.insert(offeringSupplyChainLinks).values(input);
      return { success: true };
    }),
  listSupplyChainLinks: protectedProcedure
    .input(z.object({ offeringId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db!.select().from(offeringSupplyChainLinks).where(eq(offeringSupplyChainLinks.offeringId, input.offeringId));
    }),

  // Experiments
  linkExperiment: protectedProcedure
    .input(z.object({ offeringId: z.string(), experimentId: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.insert(offeringExperimentLinks).values(input);
      return { success: true };
    }),
  listExperimentLinks: protectedProcedure
    .input(z.object({ offeringId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db!.select().from(offeringExperimentLinks).where(eq(offeringExperimentLinks.offeringId, input.offeringId));
    }),

  // Risks
  linkRisk: protectedProcedure
    .input(
      z.object({
        offeringId: z.string(),
        riskId: z.number().int(),
        riskType: z.enum(["venture", "engineering", "execution"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.insert(offeringRiskLinks).values(input);
      return { success: true };
    }),
  listRiskLinks: protectedProcedure
    .input(z.object({ offeringId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db!.select().from(offeringRiskLinks).where(eq(offeringRiskLinks.offeringId, input.offeringId));
    }),

  // Milestones
  linkMilestone: protectedProcedure
    .input(z.object({ offeringId: z.string(), milestoneId: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.insert(offeringMilestoneLinks).values(input);
      return { success: true };
    }),
  listMilestoneLinks: protectedProcedure
    .input(z.object({ offeringId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db!.select().from(offeringMilestoneLinks).where(eq(offeringMilestoneLinks.offeringId, input.offeringId));
    }),

  // CRM
  linkCrm: protectedProcedure
    .input(
      z.object({
        offeringId: z.string(),
        pipelineId: z.number().int().optional(),
        dealId: z.number().int().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.insert(offeringCrmLinks).values(input);
      return { success: true };
    }),
  listCrmLinks: protectedProcedure
    .input(z.object({ offeringId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db!.select().from(offeringCrmLinks).where(eq(offeringCrmLinks.offeringId, input.offeringId));
    }),

  // Analytics
  linkAnalytics: protectedProcedure
    .input(
      z.object({
        offeringId: z.string(),
        marketAnalysisId: z.number().int().optional(),
        reportId: z.number().int().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.insert(offeringAnalyticsLinks).values(input);
      return { success: true };
    }),
  listAnalyticsLinks: protectedProcedure
    .input(z.object({ offeringId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db!.select().from(offeringAnalyticsLinks).where(eq(offeringAnalyticsLinks.offeringId, input.offeringId));
    }),
});

// ── Combined router ───────────────────────────────────────────────────────────
export const portfoliosOfferingsRouter = router({
  portfolios: portfoliosRouter,
  offerings: offeringsRouter,
  links: offeringLinksRouter,
});
