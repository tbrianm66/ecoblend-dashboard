/**
 * R&D Hub Router — Phase 3: Section 5
 * CRUD for ip_assets, rnd_projects, technical_kpis, prototype_tests
 * + VRL IP/TRL contribution computation
 */
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  ipAssets,       // existing table — uses camelCase column names (ventureId, ipType, etc.)
  rndProjects,
  technicalKpis,
  prototypeTests,
} from "../drizzle/schema";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const ventureInput = z.object({ ventureId: z.string().min(1) });

// ip_assets uses the pre-existing schema with camelCase DB columns
const ipAssetBody = z.object({
  ventureId:    z.string().min(1),
  title:        z.string().min(1),
  ipType:       z.string().default("Patent"),
  status:       z.string().default("Draft"),
  reference:    z.string().optional(),   // filing number / reference
  jurisdiction: z.string().optional(),
  filedDate:    z.string().optional(),   // stored as varchar date string
  grantedDate:  z.string().optional(),
  assignedTo:   z.string().optional(),
  notes:        z.string().optional(),
});

const rndProjectBody = z.object({
  ventureId:            z.string().min(1),
  projectName:          z.string().min(1),
  description:          z.string().optional(),
  classification:       z.enum(["iterative", "adjacent", "moonshot"]).default("iterative"),
  currentStage:         z.enum(["concept", "simulation", "prototype", "integration"]).default("concept"),
  stageStatus:          z.enum(["in_progress", "gate_pending", "gate_passed", "blocked"]).default("in_progress"),
  targetTrl:            z.number().int().min(1).max(9).default(4),
  completionPercentage: z.number().int().min(0).max(100).default(0),
  technicalLead:        z.string().optional(),
  domain:               z.string().optional(),
  budgetAllocated:      z.number().int().optional(),
  budgetSpent:          z.number().int().optional(),
  ipStatus:             z.string().optional(),
  gateChecklist:        z.record(z.boolean()).optional(),
});

const technicalKpiBody = z.object({
  ventureId:   z.string().min(1),
  projectId:   z.number().int().optional(),
  metricName:  z.string().min(1),
  targetValue: z.string().min(1),
  actualValue: z.string().optional(),
  unit:        z.string().optional(),
  status:      z.enum(["on_track", "at_risk", "failed"]).default("on_track"),
  notes:       z.string().optional(),
});

const prototypeTestBody = z.object({
  ventureId:        z.string().min(1),
  projectId:        z.number().int().optional(),
  prototypeVersion: z.string().min(1),
  testName:         z.string().min(1),
  passFailStatus:   z.enum(["pass", "fail", "pending"]).default("pending"),
  testDate:         z.string().optional(),
  testResultsNotes: z.string().optional(),
  evidenceId:       z.string().optional(),
  evidenceUrl:      z.string().optional(),
});

// ─── VRL IP Score Computation ─────────────────────────────────────────────────
// Compute a 0–100 ipScore from the venture's IP asset portfolio.
// Uses the existing ip_assets table's status vocabulary (capitalized).
// Status weights: Granted=100, PCT Filed=75, Filed=60, Provisional=50, Draft=15
// Diversity bonus: +5 per unique ipType beyond the first (capped at +15)
// Final score: weighted average of top-5 assets, clamped 0–100

const IP_STATUS_WEIGHT: Record<string, number> = {
  "Granted":        100,
  "PCT Filed":       75,
  "Filed":           60,
  "Provisional":     50,
  "Draft":           15,
  "Abandoned":        0,
};

function computeIpScore(assets: Array<{ ipType: string; status: string }>): number {
  if (assets.length === 0) return 0;
  const sorted = [...assets].sort(
    (a, b) => (IP_STATUS_WEIGHT[b.status] ?? 0) - (IP_STATUS_WEIGHT[a.status] ?? 0),
  );
  const top5 = sorted.slice(0, 5);
  const avgWeight = top5.reduce((s, a) => s + (IP_STATUS_WEIGHT[a.status] ?? 0), 0) / top5.length;
  const uniqueTypes = new Set(assets.map(a => a.ipType)).size;
  const diversityBonus = Math.min((uniqueTypes - 1) * 5, 15);
  return Math.min(100, Math.round(avgWeight + diversityBonus));
}

// TRL score from verified KPIs: (on_track KPIs / total KPIs) * 100, minimum 10 if any KPI exists
function computeTrlScore(kpis: Array<{ status: string }>): number {
  if (kpis.length === 0) return 0;
  const onTrack = kpis.filter(k => k.status === "on_track").length;
  return Math.max(10, Math.round((onTrack / kpis.length) * 100));
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const rndRouter = router({

  // ── IP Assets ─────────────────────────────────────────────────────────────
  // Reuses the existing ip_assets table (also used by IpManagement.tsx).
  ipAssets: router({
    list: publicProcedure
      .input(ventureInput)
      .query(async ({ input }) => {
        const db = await getDb();
        return db
          .select()
          .from(ipAssets)
          .where(eq(ipAssets.ventureId, input.ventureId))
          .orderBy(desc(ipAssets.createdAt));
      }),

    upsert: protectedProcedure
      .input(z.object({ id: z.number().int().optional(), ...ipAssetBody.shape }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const { id, ...rest } = input;
        const body = { ...rest, updatedAt: new Date() };
        if (id) {
          const [updated] = await db
            .update(ipAssets)
            .set(body)
            .where(eq(ipAssets.id, id))
            .returning();
          return updated;
        }
        const [inserted] = await db.insert(ipAssets).values(body).returning();
        return inserted;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        await db.delete(ipAssets).where(eq(ipAssets.id, input.id));
        return { ok: true };
      }),
  }),

  // ── R&D Projects ──────────────────────────────────────────────────────────
  projects: router({
    list: publicProcedure
      .input(ventureInput)
      .query(async ({ input }) => {
        const db = await getDb();
        return db
          .select()
          .from(rndProjects)
          .where(eq(rndProjects.ventureId, input.ventureId))
          .orderBy(desc(rndProjects.createdAt));
      }),

    upsert: protectedProcedure
      .input(z.object({ id: z.number().int().optional(), ...rndProjectBody.shape }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const { id, ...rest } = input;
        const body = { ...rest, updatedAt: new Date() };
        if (id) {
          const [updated] = await db
            .update(rndProjects)
            .set(body)
            .where(eq(rndProjects.id, id))
            .returning();
          return updated;
        }
        const [inserted] = await db.insert(rndProjects).values(body).returning();
        return inserted;
      }),

    advanceStage: protectedProcedure
      .input(z.object({
        id:          z.number().int(),
        currentStage: z.enum(["concept", "simulation", "prototype", "integration"]),
        checklist:   z.record(z.boolean()),
      }))
      .mutation(async ({ input }) => {
        const stageOrder = ["concept", "simulation", "prototype", "integration"] as const;
        const idx = stageOrder.indexOf(input.currentStage);
        if (idx === stageOrder.length - 1) {
          throw new Error("Already at final stage (integration).");
        }
        // All checklist items must be checked
        const allPassed = Object.values(input.checklist).every(Boolean);
        if (!allPassed) {
          throw new Error("All gate checklist items must be completed before advancing.");
        }
        const nextStage = stageOrder[idx + 1];
        const db = await getDb();
        const [updated] = await db
          .update(rndProjects)
          .set({ currentStage: nextStage, stageStatus: "in_progress", gateChecklist: {}, updatedAt: new Date() })
          .where(eq(rndProjects.id, input.id))
          .returning();
        return updated;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        await db.delete(rndProjects).where(eq(rndProjects.id, input.id));
        return { ok: true };
      }),
  }),

  // ── Technical KPIs ────────────────────────────────────────────────────────
  kpis: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string().min(1), projectId: z.number().int().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        const conditions = [eq(technicalKpis.ventureId, input.ventureId)];
        if (input.projectId != null) {
          conditions.push(eq(technicalKpis.projectId, input.projectId));
        }
        return db
          .select()
          .from(technicalKpis)
          .where(and(...conditions))
          .orderBy(desc(technicalKpis.createdAt));
      }),

    upsert: protectedProcedure
      .input(z.object({ id: z.number().int().optional(), ...technicalKpiBody.shape }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const { id, ...rest } = input;
        const body = { ...rest, updatedAt: new Date() };
        if (id) {
          const [updated] = await db
            .update(technicalKpis)
            .set(body)
            .where(eq(technicalKpis.id, id))
            .returning();
          return updated;
        }
        const [inserted] = await db.insert(technicalKpis).values(body).returning();
        return inserted;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        await db.delete(technicalKpis).where(eq(technicalKpis.id, input.id));
        return { ok: true };
      }),
  }),

  // ── Prototype Tests ───────────────────────────────────────────────────────
  tests: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string().min(1), projectId: z.number().int().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        const conditions = [eq(prototypeTests.ventureId, input.ventureId)];
        if (input.projectId != null) {
          conditions.push(eq(prototypeTests.projectId, input.projectId));
        }
        return db
          .select()
          .from(prototypeTests)
          .where(and(...conditions))
          .orderBy(desc(prototypeTests.createdAt));
      }),

    upsert: protectedProcedure
      .input(z.object({ id: z.number().int().optional(), ...prototypeTestBody.shape }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const { id, testDate, ...rest } = input;
        const body = {
          ...rest,
          testDate:  testDate ? new Date(testDate) : null,
          updatedAt: new Date(),
        };
        if (id) {
          const [updated] = await db
            .update(prototypeTests)
            .set(body)
            .where(eq(prototypeTests.id, id))
            .returning();
          return updated;
        }
        const [inserted] = await db.insert(prototypeTests).values(body).returning();
        return inserted;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        await db.delete(prototypeTests).where(eq(prototypeTests.id, input.id));
        return { ok: true };
      }),
  }),

  // ── VRL Contribution Feed ─────────────────────────────────────────────────
  // Returns computed ipScore and trlScore for a venture based on saved assets and KPIs.
  // Intended to pre-populate the VRL assessment form's IP and TRL dimensions.
  vrlContribution: router({
    get: publicProcedure
      .input(ventureInput)
      .query(async ({ input }) => {
        const db = await getDb();
        const [assets, kpis] = await Promise.all([
          db.select({ ipType: ipAssets.ipType, status: ipAssets.status })
            .from(ipAssets)
            .where(eq(ipAssets.ventureId, input.ventureId as any)),
          db.select({ status: technicalKpis.status })
            .from(technicalKpis)
            .where(eq(technicalKpis.ventureId, input.ventureId)),
        ]);
        const ipScore  = computeIpScore(assets);
        const trlScore = computeTrlScore(kpis);
        return {
          ipScore,
          trlScore,
          assetCount: assets.length,
          kpiCount:   kpis.length,
          breakdown: {
            grantedCount:    assets.filter(a => a.status === "granted").length,
            provisionalCount: assets.filter(a => a.status === "provisional").length,
            pctFiledCount:   assets.filter(a => a.status === "pct_filed").length,
            onTrackKpis:     kpis.filter(k => k.status === "on_track").length,
          },
        };
      }),
  }),
});
