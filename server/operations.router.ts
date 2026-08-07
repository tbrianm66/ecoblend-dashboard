// ============================================================
// ECOBLEND OS — OPERATIONS & MANUFACTURING ROUTER
// Phase 3: Section 6
// Covers: Operating Models, Suppliers, Manufacturing Plans,
//         Quality Compliance, MRL Evaluations
// ============================================================

import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  operatingModels,
  suppliers,
  manufacturingPlans,
  qualityCompliance,
  mrlEvaluations,
} from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { computeVrlContribution, getMrlLevelDef } from "./mrl.engine";

// ── Operating Models ─────────────────────────────────────────────────────────

const operatingModelRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(operatingModels)
        .where(eq(operatingModels.ventureId, input.ventureId))
        .orderBy(desc(operatingModels.createdAt));
    }),

  upsert: publicProcedure
    .input(
      z.object({
        id:                    z.number().optional(),
        ventureId:             z.string(),
        modelType:             z.enum(["in_house", "contract_cmo", "hybrid", "outsourced"]),
        capacityUnitsPerMonth: z.number().int().min(0).optional(),
        unitOpCost:            z.string().optional(), // stored as numeric/string
        facilityLocation:      z.string().optional(),
        status:                z.enum(["draft", "active", "archived"]).default("draft"),
        notes:                 z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ventureId, modelType, capacityUnitsPerMonth, unitOpCost, facilityLocation, status, notes } = input;
      const row = {
        ventureId,
        modelType,
        capacityUnitsPerMonth: capacityUnitsPerMonth ?? null,
        unitOpCost:            unitOpCost ?? null,
        facilityLocation:      facilityLocation ?? null,
        status,
        notes:                 notes ?? null,
        updatedAt:             new Date(),
      };
      if (id) {
        const [updated] = await db.update(operatingModels).set(row).where(eq(operatingModels.id, id)).returning();
        return updated;
      }
      const [inserted] = await db.insert(operatingModels).values({ ...row, createdAt: new Date() }).returning();
      return inserted;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(operatingModels).where(eq(operatingModels.id, input.id));
      return { ok: true };
    }),
});

// ── Suppliers ────────────────────────────────────────────────────────────────

const suppliersRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(suppliers)
        .where(eq(suppliers.ventureId, input.ventureId))
        .orderBy(desc(suppliers.createdAt));
    }),

  upsert: publicProcedure
    .input(
      z.object({
        id:                z.number().optional(),
        ventureId:         z.string(),
        supplierName:      z.string().min(1),
        componentSupplied: z.string().optional(),
        leadTimeDays:      z.number().int().min(0).optional(),
        moq:               z.number().int().min(0).optional(),
        unitCost:          z.string().optional(),
        riskLevel:         z.enum(["low", "medium", "high"]).default("medium"),
        singleSource:      z.boolean().default(false),
        auditStatus:       z.enum(["not_audited", "in_progress", "approved", "rejected"]).default("not_audited"),
        notes:             z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ventureId, supplierName, componentSupplied, leadTimeDays, moq, unitCost, riskLevel, singleSource, auditStatus, notes } = input;
      const row = {
        ventureId,
        supplierName,
        componentSupplied: componentSupplied ?? null,
        leadTimeDays:      leadTimeDays ?? null,
        moq:               moq ?? null,
        unitCost:          unitCost ?? null,
        riskLevel,
        singleSource,
        auditStatus,
        notes:             notes ?? null,
        updatedAt:         new Date(),
      };
      if (id) {
        const [updated] = await db.update(suppliers).set(row).where(eq(suppliers.id, id)).returning();
        return updated;
      }
      const [inserted] = await db.insert(suppliers).values({ ...row, createdAt: new Date() }).returning();
      return inserted;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(suppliers).where(eq(suppliers.id, input.id));
      return { ok: true };
    }),

  riskSummary: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.ventureId, input.ventureId));
      const singleSourceCount = rows.filter(r => r.singleSource).length;
      const highRiskCount     = rows.filter(r => r.riskLevel === "high").length;
      const avgLeadTime       = rows.length > 0
        ? Math.round(rows.reduce((s, r) => s + (r.leadTimeDays ?? 0), 0) / rows.length)
        : 0;
      return { total: rows.length, singleSourceCount, highRiskCount, avgLeadTime };
    }),
});

// ── Manufacturing Plans ───────────────────────────────────────────────────────

const manufacturingRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(manufacturingPlans)
        .where(eq(manufacturingPlans.ventureId, input.ventureId))
        .orderBy(desc(manufacturingPlans.createdAt));
    }),

  upsert: publicProcedure
    .input(
      z.object({
        id:                    z.number().optional(),
        ventureId:             z.string(),
        phaseName:             z.enum(["pilot", "scale_up", "commercial"]),
        targetYieldPercentage: z.string().optional(),
        actualYieldPercentage: z.string().optional(),
        scrapRate:             z.string().optional(),
        plannedStartDate:      z.string().optional(),
        completionDate:        z.string().optional(),
        notes:                 z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ventureId, phaseName, targetYieldPercentage, actualYieldPercentage, scrapRate, plannedStartDate, completionDate, notes } = input;
      const row = {
        ventureId,
        phaseName,
        targetYieldPercentage: targetYieldPercentage ?? null,
        actualYieldPercentage: actualYieldPercentage ?? null,
        scrapRate:             scrapRate ?? null,
        plannedStartDate:      plannedStartDate ?? null,
        completionDate:        completionDate ?? null,
        notes:                 notes ?? null,
        updatedAt:             new Date(),
      };
      if (id) {
        const [updated] = await db.update(manufacturingPlans).set(row).where(eq(manufacturingPlans.id, id)).returning();
        return updated;
      }
      const [inserted] = await db.insert(manufacturingPlans).values({ ...row, createdAt: new Date() }).returning();
      return inserted;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(manufacturingPlans).where(eq(manufacturingPlans.id, input.id));
      return { ok: true };
    }),

  yieldSummary: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(manufacturingPlans)
        .where(eq(manufacturingPlans.ventureId, input.ventureId));
      const withActual = rows.filter(r => r.actualYieldPercentage != null);
      const avgTarget  = rows.length > 0
        ? (rows.reduce((s, r) => s + parseFloat(r.targetYieldPercentage ?? "0"), 0) / rows.length).toFixed(1)
        : "0";
      const avgActual  = withActual.length > 0
        ? (withActual.reduce((s, r) => s + parseFloat(r.actualYieldPercentage ?? "0"), 0) / withActual.length).toFixed(1)
        : null;
      const avgScrap   = rows.length > 0
        ? (rows.reduce((s, r) => s + parseFloat(r.scrapRate ?? "0"), 0) / rows.length).toFixed(1)
        : "0";
      return { total: rows.length, avgTarget, avgActual, avgScrap };
    }),
});

// ── Quality Compliance ────────────────────────────────────────────────────────

const qualityRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(qualityCompliance)
        .where(eq(qualityCompliance.ventureId, input.ventureId))
        .orderBy(desc(qualityCompliance.createdAt));
    }),

  upsert: publicProcedure
    .input(
      z.object({
        id:                  z.number().optional(),
        ventureId:           z.string(),
        certificationName:   z.string().min(1),
        standardCode:        z.string().optional(),
        status:              z.enum(["not_started", "in_audit", "certified"]).default("not_started"),
        expiryDate:          z.string().optional(),
        documentEvidenceId:  z.string().optional(),
        notes:               z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ventureId, certificationName, standardCode, status, expiryDate, documentEvidenceId, notes } = input;
      const row = {
        ventureId,
        certificationName,
        standardCode:       standardCode ?? null,
        status,
        expiryDate:         expiryDate ?? null,
        documentEvidenceId: documentEvidenceId ?? null,
        notes:              notes ?? null,
        updatedAt:          new Date(),
      };
      if (id) {
        const [updated] = await db.update(qualityCompliance).set(row).where(eq(qualityCompliance.id, id)).returning();
        return updated;
      }
      const [inserted] = await db.insert(qualityCompliance).values({ ...row, createdAt: new Date() }).returning();
      return inserted;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(qualityCompliance).where(eq(qualityCompliance.id, input.id));
      return { ok: true };
    }),
});

// ── MRL Evaluations ───────────────────────────────────────────────────────────

const mrlEvalRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(mrlEvaluations)
        .where(eq(mrlEvaluations.ventureId, input.ventureId))
        .orderBy(desc(mrlEvaluations.createdAt));
      // Annotate each evaluation with MRL level definition
      return rows.map(r => ({
        ...r,
        levelDef: getMrlLevelDef(r.mrlLevel) ?? null,
        vrlContribution: computeVrlContribution(r.mrlLevel),
      }));
    }),

  upsert: publicProcedure
    .input(
      z.object({
        id:              z.number().optional(),
        ventureId:       z.string(),
        mrlLevel:        z.number().int().min(1).max(9),
        evaluationNotes: z.string().optional(),
        evidenceId:      z.string().optional(),
        status:          z.enum(["draft", "submitted", "confirmed"]).default("draft"),
        naJustification: z.string().optional(), // Profile SV-01: N/A state for software ventures
        isNa:            z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ventureId, mrlLevel, evaluationNotes, evidenceId, status } = input;
      const row = {
        ventureId,
        mrlLevel,
        evaluationNotes: evaluationNotes ?? null,
        evidenceId:      evidenceId ?? null,
        status,
        updatedAt:       new Date(),
      };
      if (id) {
        const [updated] = await db.update(mrlEvaluations).set(row).where(eq(mrlEvaluations.id, id)).returning();
        return updated;
      }
      const [inserted] = await db.insert(mrlEvaluations).values({ ...row, createdAt: new Date() }).returning();
      return inserted;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(mrlEvaluations).where(eq(mrlEvaluations.id, input.id));
      return { ok: true };
    }),

  // Summarises current MRL posture for the Operations module dashboard
  summary: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(mrlEvaluations)
        .where(eq(mrlEvaluations.ventureId, input.ventureId))
        .orderBy(desc(mrlEvaluations.createdAt));
      const confirmed = rows.filter(r => r.status === "confirmed");
      const highestConfirmed = confirmed.length > 0
        ? Math.max(...confirmed.map(r => r.mrlLevel))
        : null;
      const vrlContribution = highestConfirmed ? computeVrlContribution(highestConfirmed) : 0;
      const levelDef = highestConfirmed ? getMrlLevelDef(highestConfirmed) : null;
      return { total: rows.length, highestConfirmed, vrlContribution, levelDef };
    }),
});

// ── Root Operations Router ────────────────────────────────────────────────────

export const operationsRouter = router({
  model:       operatingModelRouter,
  suppliers:   suppliersRouter,
  manufacturing: manufacturingRouter,
  quality:     qualityRouter,
  mrlEval:     mrlEvalRouter,
});
