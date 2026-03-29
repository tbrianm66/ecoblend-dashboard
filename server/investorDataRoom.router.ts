/**
 * Investor Data Room Module Router
 * 9 sub-routers: rooms, assets, readiness, investors, permissions, engagement, qa, assetFactory, approvals
 * Implements all 5 architecture layers from the Investor Data Room Manus Pack
 */

import { z } from "zod";
import { eq, and, desc, asc } from "drizzle-orm";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import {
  drRooms, drAssets, drReadinessChecks, drInvestors,
  drPermissions, drEngagementEvents, drQaRequests,
  drApprovals, drAiGenerations,
} from "../drizzle/schema";

// ─── ROOMS ROUTER ────────────────────────────────────────────
const roomsRouter = router({
  list: protectedProcedure
    .input(z.object({ ventureId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null as any;
      if (input.ventureId) {
        return db.select().from(drRooms)
          .where(eq(drRooms.ventureId, input.ventureId))
          .orderBy(desc(drRooms.updatedAt));
      }
      return db.select().from(drRooms).orderBy(desc(drRooms.updatedAt));
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null as any;
      const [room] = await db.select().from(drRooms).where(eq(drRooms.id, input.id));
      return room ?? null;
    }),

  create: protectedProcedure
    .input(z.object({
      ventureId:        z.number(),
      name:             z.string().min(1).max(256),
      description:      z.string().optional(),
      roomType:         z.enum(["teaser","full","due_diligence","custom"]).default("teaser"),
      visibilityTier:   z.enum(["teaser","full","due_diligence"]).default("teaser"),
      fundingRound:     z.string().optional(),
      fundingTarget:    z.string().optional(),
      ndaRequired:      z.boolean().default(false),
      watermarkEnabled: z.boolean().default(true),
      downloadEnabled:  z.boolean().default(false),
      expiresAt:        z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [result] = await db.insert(drRooms).values({
        ...input,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        accessCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
      });
      return { id: (result as any).insertId };
    }),

  update: protectedProcedure
    .input(z.object({
      id:               z.number(),
      name:             z.string().min(1).max(256).optional(),
      description:      z.string().optional(),
      status:           z.enum(["draft","internal_review","approved","published","expired","archived"]).optional(),
      roomType:         z.enum(["teaser","full","due_diligence","custom"]).optional(),
      visibilityTier:   z.enum(["teaser","full","due_diligence"]).optional(),
      fundingRound:     z.string().optional(),
      fundingTarget:    z.string().optional(),
      ndaRequired:      z.boolean().optional(),
      watermarkEnabled: z.boolean().optional(),
      downloadEnabled:  z.boolean().optional(),
      expiresAt:        z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, expiresAt, ...rest } = input;
      await db.update(drRooms).set({
        ...rest,
        ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
      }).where(eq(drRooms.id, id));
      return { success: true };
    }),

  publish: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const blockers = await db.select().from(drReadinessChecks)
        .where(and(
          eq(drReadinessChecks.roomId, input.id),
          eq(drReadinessChecks.blocksPublish, true),
          eq(drReadinessChecks.status, "pending"),
        ));
      if (blockers.length > 0) {
        throw new Error(`Cannot publish: ${blockers.length} critical readiness issue(s) must be resolved first.`);
      }
      await db.update(drRooms).set({
        status: "published",
        publishedAt: new Date(),
      }).where(eq(drRooms.id, input.id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(drRooms).set({ status: "archived" }).where(eq(drRooms.id, input.id));
      return { success: true };
    }),

  summary: protectedProcedure
    .input(z.object({ ventureId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null as any;
      const rooms = input.ventureId
        ? await db.select().from(drRooms).where(eq(drRooms.ventureId, input.ventureId))
        : await db.select().from(drRooms);
      type RoomRow = typeof rooms[0];
      const total     = rooms.length;
      const published = rooms.filter((r: RoomRow) => r.status === "published").length;
      const draft     = rooms.filter((r: RoomRow) => r.status === "draft").length;
      const expired   = rooms.filter((r: RoomRow) => r.status === "expired").length;
      return { total, published, draft, expired };
    }),
});

// ─── ASSETS ROUTER ───────────────────────────────────────────
const assetsRouter = router({
  list: protectedProcedure
    .input(z.object({
      roomId:    z.number().optional(),
      ventureId: z.number().optional(),
      folder:    z.string().optional(),
      status:    z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null as any;
      const conditions = [];
      if (input.roomId)    conditions.push(eq(drAssets.roomId, input.roomId));
      if (input.ventureId) conditions.push(eq(drAssets.ventureId, input.ventureId));
      if (input.folder)    conditions.push(eq(drAssets.folder, input.folder as any));
      if (input.status)    conditions.push(eq(drAssets.status, input.status as any));
      return conditions.length > 0
        ? db.select().from(drAssets).where(and(...conditions)).orderBy(desc(drAssets.updatedAt))
        : db.select().from(drAssets).orderBy(desc(drAssets.updatedAt));
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null as any;
      const [asset] = await db.select().from(drAssets).where(eq(drAssets.id, input.id));
      return asset ?? null;
    }),

  create: protectedProcedure
    .input(z.object({
      roomId:          z.number(),
      ventureId:       z.number(),
      folder:          z.enum(["01_Overview","02_Problem_Market","03_Product_Technology","04_Business_Model_Financials","05_Execution_Operations","06_Impact_Compliance","07_Legal_Corporate","08_Due_Diligence_QA","09_Access_Logs_Archive"]),
      name:            z.string().min(1).max(256),
      description:     z.string().optional(),
      fileUrl:         z.string().optional(),
      fileKey:         z.string().optional(),
      mimeType:        z.string().optional(),
      fileSizeBytes:   z.number().optional(),
      assetType:       z.enum(["pitch_deck","one_pager","financial_summary","technical_dossier","impact_summary","seis_eis_pack","business_plan","exec_plan","legal_doc","cap_table","market_research","product_demo","dd_index","qa_log","other"]),
      visibilityTier:  z.enum(["teaser","full","due_diligence"]).default("teaser"),
      downloadAllowed: z.boolean().default(false),
      isAiGenerated:   z.boolean().default(false),
      sourceDataRef:   z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [result] = await db.insert(drAssets).values(input);
      return { id: (result as any).insertId };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id:     z.number(),
      status: z.enum(["draft","internal_review","approved","superseded","archived"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(drAssets).set({ status: input.status }).where(eq(drAssets.id, input.id));
      return { success: true };
    }),

  approve: protectedProcedure
    .input(z.object({ id: z.number(), approverId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(drAssets).set({
        status: "approved",
        approvedById: input.approverId,
        approvedAt: new Date(),
      }).where(eq(drAssets.id, input.id));
      return { success: true };
    }),

  folderSummary: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null as any;
      const assets = await db.select().from(drAssets).where(eq(drAssets.roomId, input.roomId));
      type AssetRow = typeof assets[0];
      const folders = [
        "01_Overview","02_Problem_Market","03_Product_Technology",
        "04_Business_Model_Financials","05_Execution_Operations",
        "06_Impact_Compliance","07_Legal_Corporate",
        "08_Due_Diligence_QA","09_Access_Logs_Archive",
      ];
      return folders.map(folder => ({
        folder,
        total:    assets.filter((a: AssetRow) => a.folder === folder).length,
        approved: assets.filter((a: AssetRow) => a.folder === folder && a.status === "approved").length,
        draft:    assets.filter((a: AssetRow) => a.folder === folder && a.status === "draft").length,
      }));
    }),
});

// ─── READINESS ROUTER ────────────────────────────────────────
const readinessRouter = router({
  list: protectedProcedure
    .input(z.object({ roomId: z.number().optional(), ventureId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null as any;
      if (input.roomId) {
        return db.select().from(drReadinessChecks)
          .where(eq(drReadinessChecks.roomId, input.roomId))
          .orderBy(asc(drReadinessChecks.severity));
      }
      if (input.ventureId) {
        return db.select().from(drReadinessChecks)
          .where(eq(drReadinessChecks.ventureId, input.ventureId))
          .orderBy(asc(drReadinessChecks.severity));
      }
      return db.select().from(drReadinessChecks).orderBy(asc(drReadinessChecks.severity));
    }),

  create: protectedProcedure
    .input(z.object({
      roomId:        z.number(),
      ventureId:     z.number(),
      category:      z.enum(["overview","market","product","financials","legal","compliance","team","ip","governance"]),
      title:         z.string().min(1).max(256),
      description:   z.string().optional(),
      severity:      z.enum(["critical","high","medium","low"]).default("medium"),
      blocksPublish: z.boolean().default(false),
      ownerId:       z.number().optional(),
      dueDate:       z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [result] = await db.insert(drReadinessChecks).values({
        ...input,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      });
      return { id: (result as any).insertId };
    }),

  resolve: protectedProcedure
    .input(z.object({ id: z.number(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(drReadinessChecks).set({
        status: "resolved",
        resolvedAt: new Date(),
        notes: input.notes,
      }).where(eq(drReadinessChecks.id, input.id));
      return { success: true };
    }),

  score: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null as any;
      const checks = await db.select().from(drReadinessChecks)
        .where(eq(drReadinessChecks.roomId, input.roomId));
      type CheckRow = typeof checks[0];
      const total = checks.length;
      if (total === 0) return { score: 100, readyToPublish: true, criticalBlocking: 0, summary: {} };
      const resolved = checks.filter((c: CheckRow) => c.status === "resolved" || c.status === "waived").length;
      const criticalBlocking = checks.filter((c: CheckRow) => c.severity === "critical" && c.blocksPublish && c.status === "pending").length;
      const score = Math.round((resolved / total) * 100);
      const byCategory = checks.reduce((acc: Record<string, { total: number; resolved: number }>, c: CheckRow) => {
        if (!acc[c.category]) acc[c.category] = { total: 0, resolved: 0 };
        acc[c.category]!.total++;
        if (c.status === "resolved" || c.status === "waived") acc[c.category]!.resolved++;
        return acc;
      }, {});
      return { score, readyToPublish: criticalBlocking === 0, criticalBlocking, summary: byCategory };
    }),

  generateChecklist: protectedProcedure
    .input(z.object({ roomId: z.number(), ventureId: z.number(), ventureName: z.string(), stage: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const standardChecks = [
        { category: "overview" as const,   title: "Executive summary complete and approved",       severity: "critical" as const, blocksPublish: true },
        { category: "overview" as const,   title: "One-pager reviewed by venture lead",            severity: "high" as const,     blocksPublish: true },
        { category: "market" as const,     title: "Market sizing validated with primary research", severity: "high" as const,     blocksPublish: false },
        { category: "market" as const,     title: "Competitor map up to date",                     severity: "medium" as const,   blocksPublish: false },
        { category: "product" as const,    title: "Product demo or prototype evidence uploaded",   severity: "high" as const,     blocksPublish: false },
        { category: "financials" as const, title: "Financial model reviewed by finance reviewer",  severity: "critical" as const, blocksPublish: true },
        { category: "financials" as const, title: "Use of funds clearly documented",               severity: "high" as const,     blocksPublish: true },
        { category: "legal" as const,      title: "Cap table current and accurate",                severity: "critical" as const, blocksPublish: true },
        { category: "legal" as const,      title: "Incorporation documents uploaded",              severity: "high" as const,     blocksPublish: false },
        { category: "compliance" as const, title: "SEIS/EIS advance assurance obtained",          severity: "medium" as const,   blocksPublish: false },
        { category: "team" as const,       title: "Founder bios and LinkedIn profiles included",   severity: "medium" as const,   blocksPublish: false },
        { category: "ip" as const,         title: "IP position documented and reviewed",           severity: "high" as const,     blocksPublish: false },
        { category: "governance" as const, title: "Board structure and advisors documented",       severity: "low" as const,      blocksPublish: false },
      ];
      const inserts = standardChecks.map(c => ({ roomId: input.roomId, ventureId: input.ventureId, ...c }));
      await db.insert(drReadinessChecks).values(inserts);
      return { created: inserts.length };
    }),
});

// ─── INVESTORS ROUTER ────────────────────────────────────────
const investorsRouter = router({
  list: protectedProcedure
    .input(z.object({ ventureId: z.number().optional(), stage: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null as any;
      const conditions = [];
      if (input.ventureId) conditions.push(eq(drInvestors.ventureId, input.ventureId));
      if (input.stage)     conditions.push(eq(drInvestors.stage, input.stage as any));
      return conditions.length > 0
        ? db.select().from(drInvestors).where(and(...conditions)).orderBy(desc(drInvestors.updatedAt))
        : db.select().from(drInvestors).orderBy(desc(drInvestors.updatedAt));
    }),

  create: protectedProcedure
    .input(z.object({
      ventureId:    z.number(),
      name:         z.string().min(1).max(256),
      organisation: z.string().optional(),
      email:        z.string().email().optional(),
      phone:        z.string().optional(),
      investorType: z.enum(["angel","vc","family_office","corporate","accelerator","grant","other"]).default("vc"),
      thesisFit:    z.enum(["strong","moderate","weak","unknown"]).default("unknown"),
      notes:        z.string().optional(),
      linkedinUrl:  z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [result] = await db.insert(drInvestors).values(input);
      return { id: (result as any).insertId };
    }),

  updateStage: protectedProcedure
    .input(z.object({
      id:    z.number(),
      stage: z.enum(["identified","contacted","nda_signed","room_invited","active_review","meeting_booked","term_sheet","closed","passed"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(drInvestors).set({ stage: input.stage }).where(eq(drInvestors.id, input.id));
      return { success: true };
    }),

  signNda: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(drInvestors).set({
        ndaSigned: true,
        ndaSignedAt: new Date(),
        stage: "nda_signed",
      }).where(eq(drInvestors.id, input.id));
      return { success: true };
    }),

  pipeline: protectedProcedure
    .input(z.object({ ventureId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null as any;
      const investors = input.ventureId
        ? await db.select().from(drInvestors).where(eq(drInvestors.ventureId, input.ventureId))
        : await db.select().from(drInvestors);
      type InvestorRow = typeof investors[0];
      const stages = ["identified","contacted","nda_signed","room_invited","active_review","meeting_booked","term_sheet","closed","passed"];
      return stages.map(stage => ({
        stage,
        count:     investors.filter((i: InvestorRow) => i.stage === stage).length,
        investors: investors.filter((i: InvestorRow) => i.stage === stage),
      }));
    }),
});

// ─── PERMISSIONS ROUTER ──────────────────────────────────────
const permissionsRouter = router({
  list: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null as any;
      return db.select().from(drPermissions)
        .where(eq(drPermissions.roomId, input.roomId))
        .orderBy(desc(drPermissions.invitedAt));
    }),

  invite: protectedProcedure
    .input(z.object({
      roomId:      z.number(),
      investorId:  z.number(),
      accessLevel: z.enum(["teaser","full","due_diligence"]).default("teaser"),
      expiresAt:   z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const token = Math.random().toString(36).substring(2, 18).toUpperCase();
      const [result] = await db.insert(drPermissions).values({
        roomId:      input.roomId,
        investorId:  input.investorId,
        accessLevel: input.accessLevel,
        expiresAt:   input.expiresAt ? new Date(input.expiresAt) : undefined,
        inviteToken: token,
        isActive:    true,
      });
      await db.update(drInvestors).set({ stage: "room_invited" }).where(eq(drInvestors.id, input.investorId));
      return { id: (result as any).insertId, token };
    }),

  revoke: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(drPermissions).set({
        isActive: false,
        revokedAt: new Date(),
      }).where(eq(drPermissions.id, input.id));
      return { success: true };
    }),

  accept: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [perm] = await db.select().from(drPermissions)
        .where(eq(drPermissions.inviteToken, input.token));
      if (!perm) throw new Error("Invalid or expired invite token");
      await db.update(drPermissions).set({ acceptedAt: new Date() })
        .where(eq(drPermissions.id, perm.id));
      await db.update(drInvestors).set({ stage: "active_review" })
        .where(eq(drInvestors.id, perm.investorId));
      return { success: true, roomId: perm.roomId };
    }),
});

// ─── ENGAGEMENT ROUTER ───────────────────────────────────────
const engagementRouter = router({
  log: protectedProcedure
    .input(z.object({
      roomId:          z.number(),
      assetId:         z.number().optional(),
      investorId:      z.number().optional(),
      eventType:       z.enum(["room_opened","room_viewed","asset_opened","asset_viewed","asset_downloaded","question_submitted","nda_signed","meeting_requested","room_shared","access_revoked"]),
      durationSeconds: z.number().optional(),
      metadata:        z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(drEngagementEvents).values(input);
      return { success: true };
    }),

  roomAnalytics: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null as any;
      const events = await db.select().from(drEngagementEvents)
        .where(eq(drEngagementEvents.roomId, input.roomId))
        .orderBy(desc(drEngagementEvents.createdAt));
      type EventRow = typeof events[0];
      const totalViews      = events.filter((e: EventRow) => e.eventType === "room_viewed").length;
      const uniqueInvestors = new Set(events.filter((e: EventRow) => e.investorId).map((e: EventRow) => e.investorId)).size;
      const downloads       = events.filter((e: EventRow) => e.eventType === "asset_downloaded").length;
      const questions       = events.filter((e: EventRow) => e.eventType === "question_submitted").length;
      const meetings        = events.filter((e: EventRow) => e.eventType === "meeting_requested").length;
      const assetViews = events
        .filter((e: EventRow) => e.assetId && e.eventType === "asset_viewed")
        .reduce((acc: Record<number, number>, e: EventRow) => {
          const key = e.assetId!;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
      const hotDocuments = Object.entries(assetViews)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([assetId, views]) => ({ assetId: Number(assetId), views }));
      return { totalViews, uniqueInvestors, downloads, questions, meetings, hotDocuments, recentEvents: events.slice(0, 20) };
    }),

  portfolioAnalytics: protectedProcedure
    .input(z.object({ ventureId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null as any;
      const rooms = input.ventureId
        ? await db.select().from(drRooms).where(eq(drRooms.ventureId, input.ventureId))
        : await db.select().from(drRooms);
      const roomIds = rooms.map((r: typeof rooms[0]) => r.id);
      if (roomIds.length === 0) return { totalRooms: 0, totalInvestors: 0, totalViews: 0, conversionRate: 0 };
      const allEvents = await db.select().from(drEngagementEvents);
      type EventRow = typeof allEvents[0];
      const relevantEvents = allEvents.filter((e: EventRow) => roomIds.includes(e.roomId));
      const totalViews      = relevantEvents.filter((e: EventRow) => e.eventType === "room_viewed").length;
      const meetings        = relevantEvents.filter((e: EventRow) => e.eventType === "meeting_requested").length;
      const conversionRate  = totalViews > 0 ? Math.round((meetings / totalViews) * 100) : 0;
      const uniqueInvestors = new Set(relevantEvents.filter((e: EventRow) => e.investorId).map((e: EventRow) => e.investorId)).size;
      return { totalRooms: rooms.length, totalInvestors: uniqueInvestors, totalViews, conversionRate };
    }),
});

// ─── Q&A ROUTER ──────────────────────────────────────────────
const qaRouter = router({
  list: protectedProcedure
    .input(z.object({ roomId: z.number().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null as any;
      const conditions = [];
      if (input.roomId) conditions.push(eq(drQaRequests.roomId, input.roomId));
      if (input.status) conditions.push(eq(drQaRequests.status, input.status as any));
      return conditions.length > 0
        ? db.select().from(drQaRequests).where(and(...conditions)).orderBy(desc(drQaRequests.createdAt))
        : db.select().from(drQaRequests).orderBy(desc(drQaRequests.createdAt));
    }),

  submit: protectedProcedure
    .input(z.object({
      roomId:     z.number(),
      investorId: z.number(),
      assetId:    z.number().optional(),
      question:   z.string().min(1),
      category:   z.enum(["financial","legal","technical","market","team","product","compliance","other"]).default("other"),
      priority:   z.enum(["urgent","high","normal","low"]).default("normal"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [result] = await db.insert(drQaRequests).values(input);
      await db.insert(drEngagementEvents).values({
        roomId: input.roomId,
        investorId: input.investorId,
        assetId: input.assetId,
        eventType: "question_submitted",
      });
      return { id: (result as any).insertId };
    }),

  respond: protectedProcedure
    .input(z.object({
      id:              z.number(),
      response:        z.string().min(1),
      responseOwnerId: z.number(),
      isPublic:        z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(drQaRequests).set({
        response:        input.response,
        responseOwnerId: input.responseOwnerId,
        respondedAt:     new Date(),
        status:          "answered",
        isPublic:        input.isPublic,
      }).where(eq(drQaRequests.id, input.id));
      return { success: true };
    }),

  generateAiResponse: protectedProcedure
    .input(z.object({
      questionId:   z.number(),
      ventureName:  z.string(),
      ventureStage: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [qa] = await db.select().from(drQaRequests).where(eq(drQaRequests.id, input.questionId));
      if (!qa) throw new Error("Q&A request not found");
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a professional investor relations advisor for ${input.ventureName}, a ${input.ventureStage} stage venture. 
Provide a clear, professional, and factual response to investor due diligence questions. 
Be specific, honest about uncertainties, and highlight evidence where available. 
Keep responses concise (150-250 words) and investor-appropriate.`,
          },
          {
            role: "user",
            content: `Investor question (${qa.category}): ${qa.question}\n\nPlease provide a professional response.`,
          },
        ],
      });
      const content = String(response.choices[0]?.message?.content ?? "");
      return { suggestedResponse: content };
    }),
});

// ─── ASSET FACTORY ROUTER ────────────────────────────────────
const assetFactoryRouter = router({
  generateOnePager: protectedProcedure
    .input(z.object({
      roomId:      z.number(),
      ventureId:   z.number(),
      ventureName: z.string(),
      problem:     z.string(),
      solution:    z.string(),
      market:      z.string(),
      traction:    z.string().optional(),
      ask:         z.string(),
      teamSummary: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [gen] = await db.insert(drAiGenerations).values({
        roomId: input.roomId, ventureId: input.ventureId,
        outputType: "one_pager", status: "generating",
        inputSummary: JSON.stringify({ ventureName: input.ventureName, ask: input.ask }),
      });
      const genId = (gen as any).insertId;
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an expert venture capital analyst creating a concise investor one-pager. 
Structure the output as a professional one-page document with clear sections: 
The Opportunity, Problem, Solution, Market Size, Traction, Team, and The Ask. 
Use compelling, investor-appropriate language. Be specific and evidence-based.`,
            },
            {
              role: "user",
              content: `Create a professional investor one-pager for ${input.ventureName}:
Problem: ${input.problem}
Solution: ${input.solution}
Market: ${input.market}
Traction: ${input.traction ?? "Early stage — pre-revenue"}
The Ask: ${input.ask}
Team: ${input.teamSummary ?? "Experienced founding team"}`,
            },
          ],
        });
        const content = String(response.choices[0]?.message?.content ?? "");
        await db.update(drAiGenerations).set({ generatedContent: content, status: "completed" })
          .where(eq(drAiGenerations.id, genId));
        const [asset] = await db.insert(drAssets).values({
          roomId: input.roomId, ventureId: input.ventureId,
          folder: "01_Overview", name: `${input.ventureName} — Investor One-Pager`,
          assetType: "one_pager", status: "draft",
          isAiGenerated: true, visibilityTier: "teaser",
        });
        return { content, assetId: (asset as any).insertId };
      } catch (err) {
        await db.update(drAiGenerations).set({ status: "failed" }).where(eq(drAiGenerations.id, genId));
        throw err;
      }
    }),

  generatePitchDeck: protectedProcedure
    .input(z.object({
      roomId:        z.number(),
      ventureId:     z.number(),
      ventureName:   z.string(),
      sector:        z.string(),
      stage:         z.string(),
      problem:       z.string(),
      solution:      z.string(),
      marketSize:    z.string(),
      businessModel: z.string(),
      traction:      z.string().optional(),
      competition:   z.string().optional(),
      team:          z.string().optional(),
      financials:    z.string().optional(),
      ask:           z.string(),
      useOfFunds:    z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [gen] = await db.insert(drAiGenerations).values({
        roomId: input.roomId, ventureId: input.ventureId,
        outputType: "pitch_deck", status: "generating",
        inputSummary: JSON.stringify({ ventureName: input.ventureName, stage: input.stage }),
      });
      const genId = (gen as any).insertId;
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a world-class pitch deck writer for venture-backed startups. 
Create a structured 10-slide pitch deck narrative. Format as: SLIDE 1: [Title] followed by content, etc.
Slides: 1-Cover, 2-Problem, 3-Solution, 4-Market Opportunity, 5-Business Model, 
6-Traction & Validation, 7-Competitive Landscape, 8-Team, 9-Financials & Roadmap, 10-The Ask.`,
            },
            {
              role: "user",
              content: `Create a 10-slide pitch deck for ${input.ventureName} (${input.sector}, ${input.stage}):
Problem: ${input.problem}
Solution: ${input.solution}
Market Size: ${input.marketSize}
Business Model: ${input.businessModel}
Traction: ${input.traction ?? "Early stage"}
Competition: ${input.competition ?? "Fragmented market"}
Team: ${input.team ?? "Experienced founders"}
Financials: ${input.financials ?? "Pre-revenue"}
The Ask: ${input.ask}
Use of Funds: ${input.useOfFunds ?? "Product development and market entry"}`,
            },
          ],
        });
        const content = String(response.choices[0]?.message?.content ?? "");
        await db.update(drAiGenerations).set({ generatedContent: content, status: "completed" })
          .where(eq(drAiGenerations.id, genId));
        const [asset] = await db.insert(drAssets).values({
          roomId: input.roomId, ventureId: input.ventureId,
          folder: "01_Overview", name: `${input.ventureName} — Pitch Deck`,
          assetType: "pitch_deck", status: "draft",
          isAiGenerated: true, visibilityTier: "full",
        });
        return { content, assetId: (asset as any).insertId };
      } catch (err) {
        await db.update(drAiGenerations).set({ status: "failed" }).where(eq(drAiGenerations.id, genId));
        throw err;
      }
    }),

  generateFinancialSummary: protectedProcedure
    .input(z.object({
      roomId:       z.number(),
      ventureId:    z.number(),
      ventureName:  z.string(),
      revenueModel: z.string(),
      forecast:     z.string(),
      assumptions:  z.string(),
      useOfFunds:   z.string(),
      runway:       z.string().optional(),
      keyMetrics:   z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [gen] = await db.insert(drAiGenerations).values({
        roomId: input.roomId, ventureId: input.ventureId,
        outputType: "financial_summary", status: "generating",
        inputSummary: JSON.stringify({ ventureName: input.ventureName }),
      });
      const genId = (gen as any).insertId;
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a financial analyst preparing an investor-ready financial summary. 
Structure with: Revenue Model, 3-Year Forecast Summary, Key Assumptions, Use of Funds breakdown, Key Metrics, and Sensitivity Analysis.`,
            },
            {
              role: "user",
              content: `Create a financial summary for ${input.ventureName}:
Revenue Model: ${input.revenueModel}
Forecast: ${input.forecast}
Key Assumptions: ${input.assumptions}
Use of Funds: ${input.useOfFunds}
Runway: ${input.runway ?? "12 months post-raise"}
Key Metrics: ${input.keyMetrics ?? "ARR, MRR, CAC, LTV"}`,
            },
          ],
        });
        const content = String(response.choices[0]?.message?.content ?? "");
        await db.update(drAiGenerations).set({ generatedContent: content, status: "completed" })
          .where(eq(drAiGenerations.id, genId));
        const [asset] = await db.insert(drAssets).values({
          roomId: input.roomId, ventureId: input.ventureId,
          folder: "04_Business_Model_Financials", name: `${input.ventureName} — Financial Summary`,
          assetType: "financial_summary", status: "draft",
          isAiGenerated: true, visibilityTier: "full",
        });
        return { content, assetId: (asset as any).insertId };
      } catch (err) {
        await db.update(drAiGenerations).set({ status: "failed" }).where(eq(drAiGenerations.id, genId));
        throw err;
      }
    }),

  generateDdIndex: protectedProcedure
    .input(z.object({
      roomId:      z.number(),
      ventureId:   z.number(),
      ventureName: z.string(),
      stage:       z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const assets = await db.select().from(drAssets)
        .where(and(eq(drAssets.roomId, input.roomId), eq(drAssets.ventureId, input.ventureId)));
      type AssetRow = typeof assets[0];
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a due diligence coordinator preparing a structured DD index document. 
Create a comprehensive due diligence checklist for a ${input.stage} stage venture. 
Include all standard DD categories: Corporate, Financial, Legal, Technical, Commercial, Team, IP, and Compliance. 
For each item, indicate whether it is provided, missing, or not applicable.`,
          },
          {
            role: "user",
            content: `Create a DD index for ${input.ventureName} (${input.stage} stage).
Currently uploaded documents: ${assets.map((a: AssetRow) => `${a.name} (${a.assetType})`).join(", ") || "None yet"}
Generate a complete DD checklist identifying gaps and priorities.`,
          },
        ],
      });
      const content = String(response.choices[0]?.message?.content ?? "");
      const [asset] = await db.insert(drAssets).values({
        roomId: input.roomId, ventureId: input.ventureId,
        folder: "08_Due_Diligence_QA", name: `${input.ventureName} — DD Index`,
        assetType: "dd_index", status: "draft",
        isAiGenerated: true, visibilityTier: "due_diligence",
      });
      return { content, assetId: (asset as any).insertId };
    }),

  generationLog: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null as any;
      return db.select().from(drAiGenerations)
        .where(eq(drAiGenerations.roomId, input.roomId))
        .orderBy(desc(drAiGenerations.createdAt));
    }),
});

// ─── APPROVALS ROUTER ────────────────────────────────────────
const approvalsRouter = router({
  list: protectedProcedure
    .input(z.object({ roomId: z.number().optional(), assetId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null as any;
      if (input.assetId) {
        return db.select().from(drApprovals).where(eq(drApprovals.assetId, input.assetId))
          .orderBy(desc(drApprovals.createdAt));
      }
      if (input.roomId) {
        return db.select().from(drApprovals).where(eq(drApprovals.roomId, input.roomId))
          .orderBy(desc(drApprovals.createdAt));
      }
      return db.select().from(drApprovals).orderBy(desc(drApprovals.createdAt));
    }),

  request: protectedProcedure
    .input(z.object({
      assetId:      z.number(),
      roomId:       z.number(),
      reviewerRole: z.enum(["venture_lead","finance_reviewer","legal_reviewer","technical_reviewer","impact_reviewer","platform_admin"]),
      dueDate:      z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [result] = await db.insert(drApprovals).values({
        ...input,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      });
      await db.update(drAssets).set({ status: "internal_review" }).where(eq(drAssets.id, input.assetId));
      return { id: (result as any).insertId };
    }),

  review: protectedProcedure
    .input(z.object({
      id:         z.number(),
      status:     z.enum(["approved","rejected","changes_requested"]),
      reviewerId: z.number(),
      comments:   z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(drApprovals).set({
        status:     input.status,
        reviewerId: input.reviewerId,
        comments:   input.comments,
        reviewedAt: new Date(),
      }).where(eq(drApprovals.id, input.id));
      if (input.status === "approved") {
        const [approval] = await db.select().from(drApprovals).where(eq(drApprovals.id, input.id));
        if (approval) {
          await db.update(drAssets).set({ status: "approved" }).where(eq(drAssets.id, approval.assetId));
        }
      }
      return { success: true };
    }),
});

// ─── MAIN ROUTER ─────────────────────────────────────────────
export const investorDataRoomRouter = router({
  rooms:        roomsRouter,
  assets:       assetsRouter,
  readiness:    readinessRouter,
  investors:    investorsRouter,
  permissions:  permissionsRouter,
  engagement:   engagementRouter,
  qa:           qaRouter,
  assetFactory: assetFactoryRouter,
  approvals:    approvalsRouter,
});
