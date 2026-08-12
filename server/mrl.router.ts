// ============================================================
// ECOBLEND OS — MRL ROUTER
// Manufacturing Readiness Level Intelligence System v1.0
// ============================================================

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  mrlAssessments,
  mrlSuppliers,
  mrlCostModels,
  mrlComplianceRecords,
  mrlLcsaRecords,
  mrlRiskRegister,
  mrlLevelDefs,
} from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  MRL_LEVELS,
  MRL_SUBSYSTEMS,
  INTEGRATION_MODEL,
  computeRiskScore,
  classifyRiskRag,
  computeCompositeMrlScore,
  compositeScoreToMrlLevel,
  computeVrlContribution,
  recommendRegion,
  getMrlLevelDef,
  trlToMrlAlignment,
  isMrlTrlAligned,
  generateDefaultRisks,
} from "./mrl.engine";

// ── Input Schemas ─────────────────────────────────────────────────────────────

const SubsystemScoresSchema = z.object({
  pde:  z.number().min(0).max(100).refine(v => v >= 0 && v <= 100, { message: "PDE score must be in [0, 100]" }),
  scie: z.number().min(0).max(100).refine(v => v >= 0 && v <= 100, { message: "SCIE score must be in [0, 100]" }),
  csm:  z.number().min(0).max(100).refine(v => v >= 0 && v <= 100, { message: "CSM score must be in [0, 100]" }),
  qce:  z.number().min(0).max(100).refine(v => v >= 0 && v <= 100, { message: "QCE score must be in [0, 100]" }),
  sil:  z.number().min(0).max(100).refine(v => v >= 0 && v <= 100, { message: "SIL score must be in [0, 100]" }),
});

const CreateAssessmentSchema = z.object({
  ventureId: z.string(),
  trlLevel: z.number().min(1).max(9).optional(),
  scores: SubsystemScoresSchema,
  region: z.enum(["CN", "UK", "HYBRID"]).optional(),
  notes: z.string().optional(),
  assessedBy: z.string().optional(),
});

const CreateSupplierSchema = z.object({
  ventureId: z.string(),
  name: z.string().min(1),
  tier: z.enum(["T1", "T2", "T3"]).default("T1"),
  country: z.string(),
  region: z.enum(["CN", "UK", "EU", "US", "ROW"]).default("CN"),
  category: z.string().optional(),
  leadTimeWeeks: z.number().optional(),
  moqUnits: z.number().optional(),
  isSingleSource: z.boolean().default(false),
  hasDualSource: z.boolean().default(false),
  fxExposure: z.enum(["LOW", "MED", "HIGH"]).default("MED"),
  geopoliticalRisk: z.enum(["LOW", "MED", "HIGH"]).default("LOW"),
  notes: z.string().optional(),
});

const CreateCostModelSchema = z.object({
  ventureId: z.string(),
  assessmentId: z.string().optional(),
  modelName: z.string().min(1),
  region: z.enum(["CN", "UK", "HYBRID"]).default("HYBRID"),
  targetVolume: z.number().optional(),
  unitCostGbp: z.number().optional(),
  unitPriceGbp: z.number().optional(),
  capexGbp: z.number().optional(),
  opexAnnualGbp: z.number().optional(),
  volumeScenarios: z.array(z.object({
    volume: z.number(),
    unitCostGbp: z.number(),
    marginPct: z.number(),
    breakEvenVol: z.number().optional(),
  })).default([]),
  notes: z.string().optional(),
});

const CreateComplianceSchema = z.object({
  ventureId: z.string(),
  assessmentId: z.string().optional(),
  standard: z.string().min(1),
  market: z.string().min(1),
  category: z.enum([
    "Quality Management", "Product Safety", "Environmental",
    "Materials", "Process", "Social"
  ]).default("Quality Management"),
  status: z.enum([
    "Not Started", "Gap Analysis", "In Progress", "Submitted", "Certified", "Expired"
  ]).default("Not Started"),
  estimatedCostGbp: z.number().optional(),
  estimatedWeeks: z.number().optional(),
  isOnCriticalPath: z.boolean().default(false),
  gapSummary: z.string().optional(),
  certificationBody: z.string().optional(),
  notes: z.string().optional(),
});

const CreateRiskSchema = z.object({
  ventureId: z.string(),
  assessmentId: z.string().optional(),
  category: z.enum(["Technical", "Supply Chain", "Cost", "Compliance", "Sustainability"]),
  description: z.string().min(1),
  rag: z.enum(["G", "A", "R"]),
  probability: z.number().min(0).max(100),
  impact: z.number().min(0).max(100),
  mitigationAction: z.string().optional(),
  mitigationOwner: z.string().optional(),
  status: z.enum(["Open", "In Progress", "Mitigated", "Accepted", "Closed"]).default("Open"),
});

// ── Router ────────────────────────────────────────────────────────────────────

export const mrlRouter = router({

  // ── Framework Reference ──────────────────────────────────────────────────

  /** Get all MRL level definitions from the database (or engine fallback) */
  getLevelDefs: publicProcedure.query(async () => {
    try {
      const defs = await (await getDb()).select().from(mrlLevelDefs).orderBy(mrlLevelDefs.level);
      if (defs.length > 0) return defs;
    } catch (_) {}
    // Fallback to engine constants
    return MRL_LEVELS.map((l) => ({
      ...l,
      keyActivities: l.keyActivities as unknown as string[],
      exitCriteria: l.exitCriteria as unknown as string[],
    }));
  }),

  /** Get all subsystem definitions */
  getSubsystems: publicProcedure.query(() => {
    return MRL_SUBSYSTEMS;
  }),

  /** Get the CN/UK integration model */
  getIntegrationModel: publicProcedure.query(() => {
    return INTEGRATION_MODEL;
  }),

  /** Get TRL→MRL alignment for a given TRL level */
  getTrlAlignment: publicProcedure
    .input(z.object({ trlLevel: z.number().min(1).max(9) }))
    .query(({ input }) => {
      return trlToMrlAlignment(input.trlLevel);
    }),

  // ── Assessments ──────────────────────────────────────────────────────────

  /** Get the latest MRL assessment for a venture */
  getAssessment: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [assessment] = await db
        .select()
        .from(mrlAssessments)
        .where(eq(mrlAssessments.ventureId, input.ventureId))
        .orderBy(desc(mrlAssessments.assessedAt))
        .limit(1);
      if (!assessment) return null;

      const levelDef = getMrlLevelDef(assessment.mrlLevel);
      const alignment = trlToMrlAlignment(assessment.trlLevel ?? 1);
      const isAligned = isMrlTrlAligned(assessment.mrlLevel, assessment.trlLevel ?? 1);

      return { ...assessment, levelDef, trlAlignment: alignment, isTrlAligned: isAligned };
    }),

  /**
   * Get the latest Engine A MRL data for a single venture.
   * Lightweight alternative to getAssessment — returns only the fields
   * needed for PDF export and Home dashboard wiring.
   */
  getLatestByVenture: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [row] = await db
        .select({
          mrlLevel:      mrlAssessments.mrlLevel,
          mrlLabel:      mrlAssessments.mrlLabel,
          compositeScore: mrlAssessments.compositeScore,
          assessedAt:    mrlAssessments.assessedAt,
        })
        .from(mrlAssessments)
        .where(eq(mrlAssessments.ventureId, input.ventureId))
        .orderBy(desc(mrlAssessments.assessedAt))
        .limit(1);
      return row ?? null;
    }),

  /** Get all MRL assessments for a venture (history) */
  getAssessmentHistory: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db
        .select()
        .from(mrlAssessments)
        .where(eq(mrlAssessments.ventureId, input.ventureId))
        .orderBy(desc(mrlAssessments.assessedAt));
    }),

  /** Create a new MRL assessment */
  createAssessment: protectedProcedure
    .input(CreateAssessmentSchema)
    .mutation(async ({ input }) => {
      const compositeScore = computeCompositeMrlScore(input.scores);
      const mrlLevel = compositeScoreToMrlLevel(compositeScore);
      const levelDef = getMrlLevelDef(mrlLevel);
      const vrlContribution = computeVrlContribution(mrlLevel);
      const region = input.region ?? recommendRegion(mrlLevel);

      // Compute overall risk from subsystem scores (lower scores = higher risk)
      const avgScore = compositeScore;
      const riskScore = Math.max(0, 100 - avgScore);
      const riskRag = classifyRiskRag(riskScore);

      const id = randomUUID();
      await (await getDb()).insert(mrlAssessments).values({
        id,
        ventureId: input.ventureId,
        mrlLevel,
        mrlLabel: levelDef?.label ?? `MRL-${mrlLevel}`,
        trlLevel: input.trlLevel,
        pdeScore: input.scores.pde,
        scieScore: input.scores.scie,
        csmScore: input.scores.csm,
        qceScore: input.scores.qce,
        silScore: input.scores.sil,
        compositeScore,
        vrlContribution,
        riskScoreOverall: riskScore,
        riskRag,
        mrlRegion: region,
        notes: input.notes,
        assessedBy: input.assessedBy ?? "User",
        engineVersion: "engine-a",   // D6 provenance marker
      });

      // Auto-seed default risks for this assessment
      const defaultRisks = generateDefaultRisks(mrlLevel);
      for (const risk of defaultRisks) {
        await (await getDb()).insert(mrlRiskRegister).values({
          id: randomUUID(),
          ventureId: input.ventureId,
          assessmentId: id,
          mrlRiskCat: risk.category,
          description: risk.description,
          mrlRag: risk.rag,
          probability: risk.probability,
          impact: risk.impact,
          riskScore: risk.riskScore,
          mrlRiskPriority: risk.priority,
          mitigationAction: risk.mitigationAction,
          mrlRiskStatus: "Open",
        });
      }

      return { id, mrlLevel, mrlLabel: levelDef?.label, compositeScore, vrlContribution, riskRag };
    }),

  // ── Portfolio Overview ────────────────────────────────────────────────────

  /** Get MRL summary across all ventures */
  getPortfolioSummary: publicProcedure.query(async () => {
    const db = await getDb();
    const assessments = await db
      .select()
      .from(mrlAssessments)
      .orderBy(desc(mrlAssessments.assessedAt));

    // Deduplicate: keep only the latest assessment per venture
    const latestByVenture = new Map<string, typeof assessments[0]>();
    for (const a of assessments) {
      if (!latestByVenture.has(a.ventureId)) {
        latestByVenture.set(a.ventureId, a);
      }
    }
    const latest = Array.from(latestByVenture.values());

    const avgMrl = latest.length
      ? parseFloat((latest.reduce((s, a) => s + a.mrlLevel, 0) / latest.length).toFixed(1))
      : 0;
    const avgComposite = latest.length
      ? Math.round(latest.reduce((s, a) => s + (a.compositeScore ?? 0), 0) / latest.length)
      : 0;

    const byRegion = { CN: 0, UK: 0, HYBRID: 0 };
    const byRag = { GREEN: 0, AMBER: 0, RED: 0 };
    for (const a of latest) {
      if (a.mrlRegion) byRegion[a.mrlRegion]++;
      if (a.riskRag) byRag[a.riskRag]++;
    }

    return {
      ventureCount: latest.length,
      avgMrl,
      avgComposite,
      byRegion,
      byRag,
      ventures: latest.map((a) => ({
        ventureId: a.ventureId,
        mrlLevel: a.mrlLevel,
        mrlLabel: a.mrlLabel,
        compositeScore: a.compositeScore,
        riskRag: a.riskRag,
        mrlRegion: a.mrlRegion,
        assessedAt: a.assessedAt,
      })),
    };
  }),

  // ── Suppliers ────────────────────────────────────────────────────────────

  /** Get all suppliers for a venture */
  getSuppliers: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db
        .select()
        .from(mrlSuppliers)
        .where(eq(mrlSuppliers.ventureId, input.ventureId))
        .orderBy(mrlSuppliers.mrlSupplierTier);
    }),

  /** Create a supplier */
  createSupplier: protectedProcedure
    .input(CreateSupplierSchema)
    .mutation(async ({ input }) => {
      // Compute risk score
      const ragBase = input.isSingleSource && !input.hasDualSource ? "R" : input.geopoliticalRisk === "HIGH" ? "A" : "G";
      const prob = input.isSingleSource ? 65 : 35;
      const impact = 80;
      const riskScore = computeRiskScore(ragBase as "G" | "A" | "R", prob, impact);
      const riskRag = classifyRiskRag(riskScore);

      const id = randomUUID();
      await (await getDb()).insert(mrlSuppliers).values({
        id,
        ventureId: input.ventureId,
        name: input.name,
        mrlSupplierTier: input.tier,
        country: input.country,
        mrlSupplierRegion: input.region,
        category: input.category,
        riskScore,
        mrlScieRag: riskRag,
        isSingleSource: input.isSingleSource,
        hasDualSource: input.hasDualSource,
        leadTimeWeeks: input.leadTimeWeeks,
        moqUnits: input.moqUnits,
        mrlFxExposure: input.fxExposure,
        mrlGeoRisk: input.geopoliticalRisk,
        notes: input.notes,
      });
      return { id, riskScore, riskRag };
    }),

  /** Delete a supplier */
  deleteSupplier: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await (await getDb()).delete(mrlSuppliers).where(eq(mrlSuppliers.id, input.id));
      return { success: true };
    }),

  // ── Cost Models ──────────────────────────────────────────────────────────

  /** Get cost models for a venture */
  getCostModels: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db
        .select()
        .from(mrlCostModels)
        .where(eq(mrlCostModels.ventureId, input.ventureId))
        .orderBy(desc(mrlCostModels.createdAt));
    }),

  /** Create a cost model */
  createCostModel: protectedProcedure
    .input(CreateCostModelSchema)
    .mutation(async ({ input }) => {
      const grossMarginPct = input.unitPriceGbp && input.unitCostGbp
        ? parseFloat((((input.unitPriceGbp - input.unitCostGbp) / input.unitPriceGbp) * 100).toFixed(1))
        : undefined;
      const capexOpexRatio = input.capexGbp && input.opexAnnualGbp
        ? parseFloat((input.capexGbp / input.opexAnnualGbp).toFixed(2))
        : undefined;

      const id = randomUUID();
      await (await getDb()).insert(mrlCostModels).values({
        id,
        ventureId: input.ventureId,
        assessmentId: input.assessmentId,
        modelName: input.modelName,
        mrlCostRegion: input.region,
        volumeScenarios: input.volumeScenarios,
        targetVolume: input.targetVolume,
        unitCostGbp: input.unitCostGbp,
        unitPriceGbp: input.unitPriceGbp,
        grossMarginPct,
        capexGbp: input.capexGbp,
        opexAnnualGbp: input.opexAnnualGbp,
        capexOpexRatio,
        notes: input.notes,
      });
      return { id, grossMarginPct, capexOpexRatio };
    }),

  // ── Compliance ───────────────────────────────────────────────────────────

  /** Get compliance records for a venture */
  getCompliance: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db
        .select()
        .from(mrlComplianceRecords)
        .where(eq(mrlComplianceRecords.ventureId, input.ventureId))
        .orderBy(mrlComplianceRecords.isOnCriticalPath);
    }),

  /** Create a compliance record */
  createCompliance: protectedProcedure
    .input(CreateComplianceSchema)
    .mutation(async ({ input }) => {
      const id = randomUUID();
      await (await getDb()).insert(mrlComplianceRecords).values({
        id,
        ventureId: input.ventureId,
        assessmentId: input.assessmentId,
        standard: input.standard,
        market: input.market,
        mrlComplianceCat: input.category,
        mrlComplianceStatus: input.status,
        gapSummary: input.gapSummary,
        certificationBody: input.certificationBody,
        estimatedCostGbp: input.estimatedCostGbp,
        estimatedWeeks: input.estimatedWeeks,
        isOnCriticalPath: input.isOnCriticalPath,
        notes: input.notes,
      });
      return { id };
    }),

  /** Update compliance status */
  updateComplianceStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["Not Started", "Gap Analysis", "In Progress", "Submitted", "Certified", "Expired"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db
        .update(mrlComplianceRecords)
        .set({ mrlComplianceStatus: input.status })
        .where(eq(mrlComplianceRecords.id, input.id));
      return { success: true };
    }),

  // ── LCSA ─────────────────────────────────────────────────────────────────

  /** Get LCSA records for a venture */
  getLcsa: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db
        .select()
        .from(mrlLcsaRecords)
        .where(eq(mrlLcsaRecords.ventureId, input.ventureId))
        .orderBy(desc(mrlLcsaRecords.recordedAt))
        .limit(10);
    }),

  // ── Risk Register ────────────────────────────────────────────────────────

  /** Get risk register for a venture */
  getRisks: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db
        .select()
        .from(mrlRiskRegister)
        .where(eq(mrlRiskRegister.ventureId, input.ventureId))
        .orderBy(desc(mrlRiskRegister.riskScore));
    }),

  /** Create a risk item */
  createRisk: protectedProcedure
    .input(CreateRiskSchema)
    .mutation(async ({ input }) => {
      const riskScore = computeRiskScore(input.rag, input.probability, input.impact);
      const priority = riskScore > 60 ? "HIGH" : riskScore > 30 ? "MED" : "LOW";

      const id = randomUUID();
      await (await getDb()).insert(mrlRiskRegister).values({
        id,
        ventureId: input.ventureId,
        assessmentId: input.assessmentId,
        mrlRiskCat: input.category,
        description: input.description,
        mrlRag: input.rag,
        probability: input.probability,
        impact: input.impact,
        riskScore,
        mrlRiskPriority: priority,
        mitigationAction: input.mitigationAction,
        mitigationOwner: input.mitigationOwner,
        mrlRiskStatus: input.status,
      });
      return { id, riskScore, priority };
    }),

  /** Update risk status */
  updateRiskStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["Open", "In Progress", "Mitigated", "Accepted", "Closed"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db
        .update(mrlRiskRegister)
        .set({ mrlRiskStatus: input.status })
        .where(eq(mrlRiskRegister.id, input.id));
      return { success: true };
    }),

  // ── Simulation ───────────────────────────────────────────────────────────

  /** Simulate MRL level from TRL level (TRL→MRL bridge) */
  simulateFromTrl: publicProcedure
    .input(z.object({ trlLevel: z.number().min(1).max(9) }))
    .query(({ input }) => {
      const alignment = trlToMrlAlignment(input.trlLevel);
      const recommendedMrl = alignment.minMrl;
      const levelDef = getMrlLevelDef(recommendedMrl);
      const region = recommendRegion(recommendedMrl);
      const vrlContribution = computeVrlContribution(recommendedMrl);
      const defaultRisks = generateDefaultRisks(recommendedMrl);

      return {
        trlLevel: input.trlLevel,
        recommendedMrlLevel: recommendedMrl,
        mrlLabel: levelDef?.label,
        trlAlignment: alignment,
        recommendedRegion: region,
        vrlContribution,
        defaultRisks,
        levelDef,
      };
    }),
});
