/**
 * Sprint 73 — VRL Dashboard V4 Router
 * EcoBlend V4 Architecture Brief — Section 3.2
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  vrlStageGates,
  vrlSpinoutChecklist,
  vrlActionsLog,
} from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

const SPINOUT_GATES = [
  { gateKey: "problem_validated",         gateLabel: "Problem validated",           minThreshold: "10+ interview signals",      evidenceRequired: "Approved problem statement in 01_Problem_and_Insight",    approver: "Intelligence Lead" },
  { gateKey: "mvp_defined_tested",        gateLabel: "MVP defined and tested",      minThreshold: "Test results documented",    evidenceRequired: "Pilot-ready package in 02_Product_and_IP / 04_Build",      approver: "Product Lead" },
  { gateKey: "commercial_model_confirmed",gateLabel: "Commercial model confirmed",  minThreshold: "Revenue model + ICP defined",evidenceRequired: "Business model in 03_Market_and_Commercial",               approver: "Growth Lead" },
  { gateKey: "finance_model_complete",    gateLabel: "Finance model complete",      minThreshold: "3-year model + use-of-funds",evidenceRequired: "Approved model in 07_Finance_and_Investment",              approver: "Finance Lead" },
  { gateKey: "legal_entity_ready",        gateLabel: "Legal entity ready",          minThreshold: "Entity registered or in progress", evidenceRequired: "Entity docs in 08_Legal_and_Compliance",            approver: "Legal Lead" },
  { gateKey: "operator_handover_ready",   gateLabel: "Operator handover ready",     minThreshold: "Playbook + 90-day plan",     evidenceRequired: "Full pack in 09_Spin_Out_Pack",                           approver: "Venture Lead" },
];

export const vrlDashboardV4Router = router({
  getStageGates: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const gates = await db.select().from(vrlStageGates)
        .where(eq(vrlStageGates.ventureId, input.ventureId))
        .orderBy(vrlStageGates.stage);
      if (gates.length === 0) {
        return ["discover","define","build","launch","spinout"].map(stage => ({
          id: 0, ventureId: input.ventureId, stage, status: "not_started",
          evidenceDocUrl: null, evidenceDocName: null, leadName: null,
          score: "0", lastUpdated: new Date(), notes: null,
        }));
      }
      return gates;
    }),

  upsertStageGate: protectedProcedure
    .input(z.object({
      ventureId:       z.string(),
      stage:           z.enum(["discover","define","build","launch","spinout"]),
      status:          z.enum(["not_started","in_progress","complete","blocked"]),
      evidenceDocUrl:  z.string().optional(),
      evidenceDocName: z.string().optional(),
      leadName:        z.string().optional(),
      score:           z.number().min(0).max(100).optional(),
      notes:           z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const existing = await db.select().from(vrlStageGates)
        .where(and(eq(vrlStageGates.ventureId, input.ventureId), eq(vrlStageGates.stage, input.stage)));
      if (existing.length > 0) {
        await db.update(vrlStageGates).set({
          status: input.status, evidenceDocUrl: input.evidenceDocUrl,
          evidenceDocName: input.evidenceDocName, leadName: input.leadName,
          score: input.score?.toString(), notes: input.notes, lastUpdated: new Date(),
        }).where(and(eq(vrlStageGates.ventureId, input.ventureId), eq(vrlStageGates.stage, input.stage)));
      } else {
        await db.insert(vrlStageGates).values({
          ventureId: input.ventureId, stage: input.stage, status: input.status,
          evidenceDocUrl: input.evidenceDocUrl, evidenceDocName: input.evidenceDocName,
          leadName: input.leadName, score: input.score?.toString() ?? "0", notes: input.notes,
        });
      }
      return { success: true };
    }),

  getSpinoutChecklist: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const items = await db.select().from(vrlSpinoutChecklist)
        .where(eq(vrlSpinoutChecklist.ventureId, input.ventureId));
      if (items.length === 0) {
        for (const gate of SPINOUT_GATES) {
          await db.insert(vrlSpinoutChecklist).values({
            ventureId: input.ventureId, gateKey: gate.gateKey, gateLabel: gate.gateLabel,
            minThreshold: gate.minThreshold, evidenceRequired: gate.evidenceRequired,
            approver: gate.approver, met: false,
          });
        }
        return { items: SPINOUT_GATES.map(g => ({ ...g, met: false, evidenceUrl: null, metAt: null })), readinessScore: 0, overallStatus: "BLOCKED", metCount: 0, totalGates: SPINOUT_GATES.length };
      }
      const metCount = items.filter(i => i.met).length;
      const readinessScore = Math.round((metCount / SPINOUT_GATES.length) * 100);
      const overallStatus = readinessScore === 100 ? "GO" : readinessScore >= 50 ? "NOT_YET" : "BLOCKED";
      return { items, readinessScore, overallStatus, metCount, totalGates: SPINOUT_GATES.length };
    }),

  updateSpinoutGate: protectedProcedure
    .input(z.object({
      ventureId:   z.string(),
      gateKey:     z.string(),
      met:         z.boolean(),
      evidenceUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(vrlSpinoutChecklist).set({
        met: input.met, evidenceUrl: input.evidenceUrl,
        metAt: input.met ? new Date() : null, updatedAt: new Date(),
      }).where(and(eq(vrlSpinoutChecklist.ventureId, input.ventureId), eq(vrlSpinoutChecklist.gateKey, input.gateKey)));
      return { success: true };
    }),

  getActionsLog: protectedProcedure
    .input(z.object({ ventureId: z.string(), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      return db.select().from(vrlActionsLog)
        .where(eq(vrlActionsLog.ventureId, input.ventureId))
        .orderBy(desc(vrlActionsLog.createdAt))
        .limit(input.limit);
    }),

  addAction: protectedProcedure
    .input(z.object({
      ventureId:    z.string(),
      action:       z.string(),
      owner:        z.string().optional(),
      status:       z.enum(["pending","in_progress","complete","cancelled"]).default("pending"),
      linkedModule: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(vrlActionsLog).values({
        ventureId: input.ventureId, action: input.action, owner: input.owner,
        status: input.status, linkedModule: input.linkedModule,
      });
      return { success: true };
    }),

  updateActionStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(["pending","in_progress","complete","cancelled"]) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(vrlActionsLog).set({
        status: input.status, completedAt: input.status === "complete" ? new Date() : null,
      }).where(eq(vrlActionsLog.id, input.id));
      return { success: true };
    }),

  getDashboardSummary: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const gates   = await db.select().from(vrlStageGates).where(eq(vrlStageGates.ventureId, input.ventureId));
      const spinout = await db.select().from(vrlSpinoutChecklist).where(eq(vrlSpinoutChecklist.ventureId, input.ventureId));
      const actions = await db.select().from(vrlActionsLog).where(eq(vrlActionsLog.ventureId, input.ventureId)).orderBy(desc(vrlActionsLog.createdAt)).limit(10);
      const overallVrlScore = gates.length > 0
        ? Math.round(gates.reduce((sum, g) => sum + parseFloat(g.score as string || "0"), 0) / gates.length) : 0;
      const spinoutMet   = spinout.filter(s => s.met).length;
      const spinoutScore = spinout.length > 0 ? Math.round((spinoutMet / spinout.length) * 100) : 0;
      return {
        overallVrlScore, spinoutScore,
        spinoutStatus: spinoutScore === 100 ? "GO" : spinoutScore >= 50 ? "NOT_YET" : "BLOCKED",
        gatesSummary:  gates.map(g => ({ stage: g.stage, status: g.status, score: g.score })),
        recentActions: actions,
      };
    }),

  getSpinoutGateDefinitions: protectedProcedure
    .query(() => SPINOUT_GATES),
});
