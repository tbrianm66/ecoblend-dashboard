/**
 * Investor CRM Router
 * Covers: investor contacts, funding rounds, term sheets, cap table, due diligence, investor updates, summary
 */
import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  invContacts, invFundingRounds, invTermSheets,
  invCapTable, invDueDiligence, invUpdates,
} from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

// ─── Investor Contacts ────────────────────────────────────────────────────────
const invContactsRouter = router({
  list: protectedProcedure
    .input(z.object({ ventureId: z.string().optional(), investorType: z.string().optional(), relationshipStatus: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [];
      if (input.ventureId) conditions.push(eq(invContacts.ventureId, input.ventureId));
      if (input.investorType) conditions.push(eq(invContacts.investorType, input.investorType));
      if (input.relationshipStatus) conditions.push(eq(invContacts.relationshipStatus, input.relationshipStatus));
      return conditions.length
        ? db.select().from(invContacts).where(and(...conditions)).orderBy(desc(invContacts.createdAt))
        : db.select().from(invContacts).orderBy(desc(invContacts.createdAt));
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      name: z.string().min(1),
      fund: z.string().optional(),
      role: z.string().optional(),
      investorType: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      linkedinUrl: z.string().optional(),
      websiteUrl: z.string().optional(),
      portfolioFocus: z.string().optional(),
      geographicFocus: z.string().optional(),
      minChequeSize: z.number().optional(),
      maxChequeSize: z.number().optional(),
      preferredStage: z.string().optional(),
      relationshipStatus: z.string().optional(),
      warmIntro: z.boolean().optional(),
      introSource: z.string().optional(),
      lastContactedAt: z.number().optional(),
      nextFollowUpAt: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      if (input.id) {
        await db.update(invContacts).set({ ...input, updatedAt: new Date() }).where(eq(invContacts.id, input.id));
        return { id: input.id };
      }
      const result = await db.insert(invContacts).values(input);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(invContacts).where(eq(invContacts.id, input.id));
      return { success: true };
    }),
});

// ─── Funding Rounds ───────────────────────────────────────────────────────────
const roundsRouter = router({
  list: protectedProcedure
    .input(z.object({ ventureId: z.string().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [];
      if (input.ventureId) conditions.push(eq(invFundingRounds.ventureId, input.ventureId));
      if (input.status) conditions.push(eq(invFundingRounds.status, input.status));
      return conditions.length
        ? db.select().from(invFundingRounds).where(and(...conditions)).orderBy(desc(invFundingRounds.createdAt))
        : db.select().from(invFundingRounds).orderBy(desc(invFundingRounds.createdAt));
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().min(1),
      name: z.string().min(1),
      roundType: z.string().min(1),
      targetAmount: z.number().optional(),
      raisedAmount: z.number().optional(),
      preMoneyVal: z.number().optional(),
      postMoneyVal: z.number().optional(),
      equityOffered: z.number().min(0).max(100).optional(),
      status: z.string().optional(),
      openedAt: z.number().optional(),
      targetCloseAt: z.number().optional(),
      closedAt: z.number().optional(),
      leadInvestor: z.string().optional(),
      useOfFunds: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      if (input.id) {
        await db.update(invFundingRounds).set({ ...input, updatedAt: new Date() }).where(eq(invFundingRounds.id, input.id));
        return { id: input.id };
      }
      const result = await db.insert(invFundingRounds).values(input);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(invFundingRounds).where(eq(invFundingRounds.id, input.id));
      return { success: true };
    }),
});

// ─── Term Sheets ──────────────────────────────────────────────────────────────
const termSheetsRouter = router({
  list: protectedProcedure
    .input(z.object({ ventureId: z.string().optional(), roundId: z.number().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [];
      if (input.ventureId) conditions.push(eq(invTermSheets.ventureId, input.ventureId));
      if (input.roundId) conditions.push(eq(invTermSheets.roundId, String(input.roundId)));
      if (input.status) conditions.push(eq(invTermSheets.status, input.status));
      return conditions.length
        ? db.select().from(invTermSheets).where(and(...conditions)).orderBy(desc(invTermSheets.createdAt))
        : db.select().from(invTermSheets).orderBy(desc(invTermSheets.createdAt));
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      roundId: z.number(),
      ventureId: z.string().min(1),
      investorContactId: z.number().optional(),
      investorName: z.string().min(1),
      investmentAmount: z.number().optional(),
      preMoneyVal: z.number().optional(),
      equityPercent: z.number().min(0).max(100).optional(),
      instrumentType: z.string().optional(),
      liquidationPref: z.string().optional(),
      antiDilution: z.string().optional(),
      boardSeat: z.boolean().optional(),
      proRataRights: z.boolean().optional(),
      informationRights: z.boolean().optional(),
      dragAlong: z.boolean().optional(),
      tagAlong: z.boolean().optional(),
      vestingSchedule: z.string().optional(),
      status: z.string().optional(),
      receivedAt: z.number().optional(),
      expiresAt: z.number().optional(),
      signedAt: z.number().optional(),
      documentUrl: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const data = {
        ...input,
        roundId: String(input.roundId),
        investorContactId: input.investorContactId ? String(input.investorContactId) : undefined,
      };
      if (input.id) {
        await db.update(invTermSheets).set({ ...data, updatedAt: new Date() }).where(eq(invTermSheets.id, input.id));
        return { id: input.id };
      }
      const result = await db.insert(invTermSheets).values(data);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(invTermSheets).where(eq(invTermSheets.id, input.id));
      return { success: true };
    }),
});

// ─── Cap Table ────────────────────────────────────────────────────────────────
const capTableRouter = router({
  list: protectedProcedure
    .input(z.object({ ventureId: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(invCapTable)
        .where(eq(invCapTable.ventureId, input.ventureId))
        .orderBy(desc(invCapTable.createdAt));
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().min(1),
      roundId: z.number().optional(),
      shareholderName: z.string().min(1),
      shareholderType: z.string().optional(),
      shareClass: z.string().optional(),
      numberOfShares: z.number().optional(),
      ownershipPercent: z.number().optional(),
      pricePerShare: z.number().optional(),
      investmentAmount: z.number().optional(),
      vestingStart: z.number().optional(),
      vestingCliff: z.number().optional(),
      vestingPeriod: z.number().optional(),
      fullyDiluted: z.boolean().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const data = { ...input, roundId: input.roundId ? String(input.roundId) : undefined };
      if (input.id) {
        await db.update(invCapTable).set({ ...data, updatedAt: new Date() }).where(eq(invCapTable.id, input.id));
        return { id: input.id };
      }
      const result = await db.insert(invCapTable).values(data);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(invCapTable).where(eq(invCapTable.id, input.id));
      return { success: true };
    }),
});

// ─── Due Diligence ────────────────────────────────────────────────────────────
const dueDiligenceRouter = router({
  list: protectedProcedure
    .input(z.object({ ventureId: z.string().optional(), roundId: z.number().optional(), category: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [];
      if (input.ventureId) conditions.push(eq(invDueDiligence.ventureId, input.ventureId));
      if (input.roundId) conditions.push(eq(invDueDiligence.roundId, String(input.roundId)));
      if (input.category) conditions.push(eq(invDueDiligence.category, input.category));
      return conditions.length
        ? db.select().from(invDueDiligence).where(and(...conditions)).orderBy(invDueDiligence.category, invDueDiligence.priority)
        : db.select().from(invDueDiligence).orderBy(invDueDiligence.category, invDueDiligence.priority);
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      roundId: z.number(),
      ventureId: z.string().min(1),
      category: z.string().min(1),
      itemName: z.string().min(1),
      description: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      assignedTo: z.string().optional(),
      documentUrl: z.string().optional(),
      dueAt: z.number().optional(),
      completedAt: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const data = { ...input, roundId: String(input.roundId) };
      if (input.id) {
        await db.update(invDueDiligence).set({ ...data, updatedAt: new Date() }).where(eq(invDueDiligence.id, input.id));
        return { id: input.id };
      }
      const result = await db.insert(invDueDiligence).values(data);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(invDueDiligence).where(eq(invDueDiligence.id, input.id));
      return { success: true };
    }),
});

// ─── Investor Updates ─────────────────────────────────────────────────────────
const updatesRouter = router({
  list: protectedProcedure
    .input(z.object({ ventureId: z.string().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [];
      if (input.ventureId) conditions.push(eq(invUpdates.ventureId, input.ventureId));
      if (input.status) conditions.push(eq(invUpdates.status, input.status));
      return conditions.length
        ? db.select().from(invUpdates).where(and(...conditions)).orderBy(desc(invUpdates.createdAt))
        : db.select().from(invUpdates).orderBy(desc(invUpdates.createdAt));
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().min(1),
      roundId: z.number().optional(),
      title: z.string().min(1),
      updateType: z.string().optional(),
      content: z.string().min(1),
      keyMetrics: z.string().optional(),
      sentAt: z.number().optional(),
      recipients: z.string().optional(),
      status: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const data = { ...input, roundId: input.roundId ? String(input.roundId) : undefined };
      if (input.id) {
        await db.update(invUpdates).set({ ...data, updatedAt: new Date() }).where(eq(invUpdates.id, input.id));
        return { id: input.id };
      }
      const result = await db.insert(invUpdates).values(data);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(invUpdates).where(eq(invUpdates.id, input.id));
      return { success: true };
    }),
});

// ─── Investor Summary ─────────────────────────────────────────────────────────
const invSummaryRouter = router({
  get: protectedProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const rounds = input.ventureId
        ? await db.select().from(invFundingRounds).where(eq(invFundingRounds.ventureId, input.ventureId))
        : await db.select().from(invFundingRounds);

      const investors = input.ventureId
        ? await db.select().from(invContacts).where(eq(invContacts.ventureId, input.ventureId))
        : await db.select().from(invContacts);

      const termSheets = input.ventureId
        ? await db.select().from(invTermSheets).where(eq(invTermSheets.ventureId, input.ventureId))
        : await db.select().from(invTermSheets);

      const capEntries = input.ventureId
        ? await db.select().from(invCapTable).where(eq(invCapTable.ventureId, input.ventureId))
        : await db.select().from(invCapTable);

      const totalRaised = rounds.reduce((sum, r) => sum + (r.raisedAmount || 0), 0);
      const totalTarget = rounds.reduce((sum, r) => sum + (r.targetAmount || 0), 0);
      const openRounds = rounds.filter(r => r.status === "open" || r.status === "closing");
      const closedRounds = rounds.filter(r => r.status === "closed");

      const activeInvestors = investors.filter(i => i.relationshipStatus === "invested").length;
      const prospectInvestors = investors.filter(i => i.relationshipStatus === "prospect" || i.relationshipStatus === "contacted").length;

      const signedTermSheets = termSheets.filter(t => t.status === "signed").length;
      const pendingTermSheets = termSheets.filter(t => t.status === "under_negotiation" || t.status === "sent").length;

      const founderEquity = capEntries
        .filter(e => e.shareholderType === "founder")
        .reduce((sum, e) => sum + (e.ownershipPercent || 0), 0);
      const investorEquity = capEntries
        .filter(e => e.shareholderType === "investor")
        .reduce((sum, e) => sum + (e.ownershipPercent || 0), 0);

      return {
        totalRaised,
        totalTarget,
        openRounds: openRounds.length,
        closedRounds: closedRounds.length,
        totalInvestors: investors.length,
        activeInvestors,
        prospectInvestors,
        signedTermSheets,
        pendingTermSheets,
        capTableEntries: capEntries.length,
        founderEquityBps: founderEquity, // basis points
        investorEquityBps: investorEquity,
      };
    }),
});

export const investorCrmRouter = router({
  contacts: invContactsRouter,
  rounds: roundsRouter,
  termSheets: termSheetsRouter,
  capTable: capTableRouter,
  dueDiligence: dueDiligenceRouter,
  updates: updatesRouter,
  summary: invSummaryRouter,
});
