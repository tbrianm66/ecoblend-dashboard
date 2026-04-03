/**
 * SRL tRPC Router — BEBUS-SRL-SE-001
 *
 * Procedures:
 *   srl.submitKpiValues         — submit raw KPI values for a venture/period
 *   srl.runAssessment           — execute the scoring engine and persist results
 *   srl.getVentureProfile       — current SRL profile for a venture
 *   srl.getAssessmentHistory    — list of past assessments for a venture
 *   srl.getAssessmentDetail     — full assessment with dimension scores + KPI values
 *   srl.getPortfolioSummary     — portfolio-level SRL summary
 *   srl.getKpiDefinitions       — KPI definitions for a dimension
 *   srl.getGateStatus           — current gate holding status for a venture
 *   srl.getVrlPayload           — VRL integration payload for latest locked assessment
 *   srl.generateReport          — create a reporting output record
 *   srl.listRiskConditions      — active risk conditions for a venture
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { nanoid } from "nanoid";
import { createHash } from "crypto";
import { eq, desc, and, isNull, or, sql, inArray } from "drizzle-orm";
import {
  srlDimensionDefinitions,
  srlKpiDefinitions,
  srlWeightConfigs,
  srlGateConfigs,
  srlGateDimensionFloors,
  srlAssessments,
  srlDimensionScores,
  srlKpiValues,
  srlVentureProfiles,
  srlGateHoldingStatus,
  srlReportingOutputs,
  srlAuditLog,
  ventures,
} from "../drizzle/schema";
import {
  runSrlEngine,
  buildVrlPayload,
  resolveWeights,
  scoreDimension,
  GATE_THRESHOLDS,
  type SrlDimCode,
  type SrlStage,
  type SrlGateCode,
  type KpiDefinition,
  type KpiInput,
} from "./srl.engine";

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const SrlDimCodeZ = z.enum(["ENV", "LCA", "SMF", "SOC", "ESG"]);
const SrlStageZ = z.enum(["S0", "S1", "S2", "S3", "S4"]);
const SrlGateCodeZ = z.enum(["G1", "G2", "G3", "G4", "G5"]);

const KpiValueInputZ = z.object({
  kpiCode: z.string(),
  rawValue: z.number().nullable(),
  unit: z.string().optional(),
  evidenceRef: z.string().optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

async function getVentureStage(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, ventureId: string): Promise<SrlStage> {
  const profiles = await db.select({ stage: srlVentureProfiles.currentStage })

    .from(srlVentureProfiles)
        .where(eq(srlVentureProfiles.ventureId, ventureId))
        .limit(1);
  if (profiles.length > 0 && profiles[0].stage) return profiles[0].stage as SrlStage;


  const vs = await db.select({ vrl: ventures.vrl })
    .from(ventures)
    .where(eq(ventures.id, ventureId))
    .limit(1);
  if (vs.length > 0 && vs[0].vrl) {
    const stageMap: Record<number, SrlStage> = { 1: "S0", 2: "S1", 3: "S2", 4: "S3", 5: "S4" };
    return stageMap[vs[0].vrl] ?? "S0";
  }
  return "S0";
}

async function getKpiDefsForDimension(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  dimCode: SrlDimCode
): Promise<KpiDefinition[]> {
  const dimRows = await db.select({ id: srlDimensionDefinitions.id })
    .from(srlDimensionDefinitions)
    .where(eq(srlDimensionDefinitions.dimensionCode, dimCode as any))
    .limit(1);
  if (!dimRows.length) return [];
  const dimId = dimRows[0].id;

  const rows = await db.select()
    .from(srlKpiDefinitions)
    .where(
      and(
        eq(srlKpiDefinitions.dimensionId, dimId),
        or(isNull(srlKpiDefinitions.effectiveTo), sql`${srlKpiDefinitions.effectiveTo} >= CURDATE()`)
      )
    );

  return rows.map(r => ({
    kpiCode: r.kpiCode,
       srlNormMethod: r.normalisationMethod as any,
    normMin: r.normMin !== null ? Number(r.normMin) : null,
    normMax: r.normMax !== null ? Number(r.normMax) : null,
    normTarget: r.normTarget !== null ? Number(r.normTarget) : null,
    thresholdValue: r.thresholdValue !== null ? Number(r.thresholdValue) : null,
    higherIsBetter: Boolean(r.higherIsBetter),
    isMandatory: Boolean(r.isMandatory),
  }));
}

async function writeAuditLog(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  eventType: "assessment" | "config_change" | "data_submission" | "gate_change" | "watch_flag" | "report_generated",
  ventureId: string | null,
  actorId: string,
  actorRole: string,
  referenceId: string | null,
  payload: object,
  notes?: string
): Promise<void> {
  const hash = sha256(JSON.stringify(payload));
  await db.insert(srlAuditLog).values({
    eventType,
    ventureId,
    actorId,
    actorRole,
    payloadHash: hash,
    referenceId,
    notes: notes ?? null,
  });
}

// ── IRL Modulation ────────────────────────────────────────────────────────────

async function applyIrlModulation(
  gateStatus: string,
  gateRef: string | null,
  sustainabilityWatch: boolean
): Promise<{ irlBlocked: boolean; vrlGateBlock: boolean; appliedRules: string[] }> {
  const appliedRules: string[] = [];
  let irlBlocked = false;
  let vrlGateBlock = false;

  if (gateStatus === "FAIL" && gateRef && ["G3", "G4", "G5"].includes(gateRef)) {
    vrlGateBlock = true;
    irlBlocked = true;
    appliedRules.push("SIM-R01");
  }
  if (sustainabilityWatch) {
    irlBlocked = true;
    appliedRules.push("SIM-R02");
  }
  return { irlBlocked, vrlGateBlock, appliedRules };
}

// ── Router ────────────────────────────────────────────────────────────────────

export const srlRouter = router({

  /**
   * Submit raw KPI values for a venture and dimension.
   * Stores values in staging (assessmentId = 'STAGING') ready for runAssessment.
   */
  submitKpiValues: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      dimensionCode: SrlDimCodeZ,
      periodStart: z.string(),
      periodEnd: z.string(),
      kpiValues: z.array(KpiValueInputZ),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const { ventureId, dimensionCode, periodStart, periodEnd, kpiValues } = input;
      const actorId = String(ctx.user.id);

      // Resolve dimension
      const dimRows = await db.select({ id: srlDimensionDefinitions.id })
        .from(srlDimensionDefinitions)
        .where(eq(srlDimensionDefinitions.dimensionCode, dimensionCode as any))
        .limit(1);
      if (!dimRows.length) throw new TRPCError({ code: "NOT_FOUND", message: `Dimension ${dimensionCode} not found` });
      const dimensionId = dimRows[0].id;

      // Resolve KPI def IDs
      const kpiDefRows = await db.select({ id: srlKpiDefinitions.id, kpiCode: srlKpiDefinitions.kpiCode })
        .from(srlKpiDefinitions)
        .where(eq(srlKpiDefinitions.dimensionId, dimensionId));
      const kpiDefMap = new Map<string, string>(kpiDefRows.map(r => [r.kpiCode, r.id]));

      // Create or reuse staging dim score record
      const existingStaging = await db.select({ id: srlDimensionScores.id })
        .from(srlDimensionScores)
        .where(
          and(
            eq(srlDimensionScores.assessmentId, "STAGING"),
            eq(srlDimensionScores.dimensionId, dimensionId)
          )
        )
        .limit(1);

      let dimScoreId: string;
      if (existingStaging.length > 0) {
        dimScoreId = existingStaging[0].id;
      } else {
        dimScoreId = nanoid();
        await db.insert(srlDimensionScores).values({
          id: dimScoreId,
          assessmentId: "STAGING",
          dimensionId,
          dimensionCode: dimensionCode as any,
          rawScore: "0",
          weightedScore: "0",
          weightApplied: "0",
          kpiCoveragePct: "0",
          gatePass: false,
          gateFloorValue: "0",
          gapFlags: [],
        });
      }

      // Upsert KPI values
      let submitted = 0;
      for (const kv of kpiValues) {
        const kpiDefId = kpiDefMap.get(kv.kpiCode);
        if (!kpiDefId) continue;

        const existingKv = await db.select({ id: srlKpiValues.id })
          .from(srlKpiValues)
          .where(and(eq(srlKpiValues.dimScoreId, dimScoreId), eq(srlKpiValues.kpiCode, kv.kpiCode)))
          .limit(1);

        if (existingKv.length > 0) {
          await db.update(srlKpiValues)
            .set({
              rawValue: kv.rawValue !== null ? String(kv.rawValue) : null,
              unit: kv.unit ?? "",
              evidenceRef: kv.evidenceRef ?? null,
              submittedBy: actorId,
            } as any)
            .where(eq(srlKpiValues.id, existingKv[0].id));
        } else {
          await (db.insert(srlKpiValues) as any).values({
            id: nanoid(),
            dimScoreId,
            kpiDefId,
            kpiCode: kv.kpiCode,
            sourceId: "manual",
            rawValue: kv.rawValue !== null ? String(kv.rawValue) : undefined,
            unit: kv.unit ?? "",
            periodStart: kv.periodStart ? new Date(kv.periodStart) : null,
            periodEnd: kv.periodEnd ? new Date(kv.periodEnd) : null,
            submittedBy: actorId,
            evidenceRef: kv.evidenceRef ?? null,
          });
        }
        submitted++;
      }

      await writeAuditLog(db, "data_submission", ventureId, actorId, ctx.user.role ?? "user", dimScoreId, { dimensionCode, submitted }, `${submitted} KPI values submitted`);

      return { success: true, dimScoreId, submitted };
    }),

  /**
   * Execute the SRL scoring engine for a venture and persist results.
   */
  runAssessment: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      assessmentDate: z.string().optional(),
      gateRef: SrlGateCodeZ.optional(),
      notes: z.string().optional(),
      lockAssessment: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const { ventureId, gateRef, notes, lockAssessment } = input;
      const assessmentDate = input.assessmentDate ?? new Date().toISOString().split("T")[0];
      const actorId = String(ctx.user.id);

      // 1. Resolve venture stage and sector
      const stage = await getVentureStage(db, ventureId);
      const profRows = await db.select({ sectorCode: srlVentureProfiles.sectorCode })
        .from(srlVentureProfiles)
        .where(eq(srlVentureProfiles.ventureId, ventureId))
        .limit(1);
      const sectorCode = profRows.length > 0 ? profRows[0].sectorCode : null;

      // 2. Fetch KPI definitions and submitted values for all 5 dimensions
      const dims: SrlDimCode[] = ["ENV", "LCA", "SMF", "SOC", "ESG"];
      const dimensionInputs: Array<{ dimensionCode: SrlDimCode; kpiDefs: KpiDefinition[]; kpiInputs: KpiInput[] }> = [];

      for (const dimCode of dims) {
        const kpiDefs = await getKpiDefsForDimension(db, dimCode);

        // Fetch latest submitted KPI values (staging first, then last locked assessment)
        const dimDefRows = await db.select({ id: srlDimensionDefinitions.id })
          .from(srlDimensionDefinitions)
          .where(eq(srlDimensionDefinitions.dimensionCode, dimCode as any))
          .limit(1);
        const dimId = dimDefRows[0]?.id;

        const kpiInputs: KpiInput[] = [];
        if (dimId) {
          const stagingRows = await db.select({
            kpiCode: srlKpiValues.kpiCode,
            rawValue: srlKpiValues.rawValue,
            submittedAt: srlKpiValues.submittedAt,
          })
            .from(srlKpiValues)
            .innerJoin(srlDimensionScores, eq(srlKpiValues.dimScoreId, srlDimensionScores.id))
            .where(
              and(
                eq(srlDimensionScores.assessmentId, "STAGING"),
                eq(srlDimensionScores.dimensionId, dimId)
              )
            );

          const seen = new Set<string>();
          for (const row of stagingRows) {
            if (!seen.has(row.kpiCode)) {
              seen.add(row.kpiCode);
              kpiInputs.push({
                kpiCode: row.kpiCode,
                rawValue: row.rawValue !== null ? Number(row.rawValue) : null,
                submittedAt: row.submittedAt,
              });
            }
          }
        }

        dimensionInputs.push({ dimensionCode: dimCode, kpiDefs, kpiInputs });
      }

      // 3. Fetch previous assessments for trajectory bonus
      const prevAssessments = await db.select({
        compositeScore: srlAssessments.compositeScore,
        id: srlAssessments.id,
      })
        .from(srlAssessments)
        .where(and(eq(srlAssessments.ventureId, ventureId), eq(srlAssessments.isLocked, true)))
        .orderBy(desc(srlAssessments.assessmentDate), desc(srlAssessments.createdAt))
        .limit(2);

      const prevComposite = prevAssessments[0] ? Number(prevAssessments[0].compositeScore) : null;
      const prevPrevComposite = prevAssessments[1] ? Number(prevAssessments[1].compositeScore) : null;

      // 4. Detect stale mandatory KPIs
      const staleMandatoryKpiCodes: string[] = [];
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      for (const dimInput of dimensionInputs) {
        for (const kpi of dimInput.kpiInputs) {
          const def = dimInput.kpiDefs.find(d => d.kpiCode === kpi.kpiCode);
          if (def?.isMandatory && kpi.submittedAt && new Date(kpi.submittedAt) < ninetyDaysAgo) {
            staleMandatoryKpiCodes.push(kpi.kpiCode);
          }
        }
      }

      // 5. Run the engine
      const engineResult = runSrlEngine({
        stage,
        sectorCode: sectorCode ?? undefined,
        gateRef: gateRef as SrlGateCode | undefined,
        dimensionInputs,
        prevComposite,
        prevPrevComposite,
        staleMandatoryKpiCodes,
      });

      const computedDelta = prevComposite !== null
        ? Math.round((engineResult.compositeFinal - prevComposite) * 100) / 100
        : null;

      // 6. Resolve weight config ref
      const wcRows = await db.select({ id: srlWeightConfigs.id })
        .from(srlWeightConfigs)
        .where(
          and(
            eq(srlWeightConfigs.lifecycleStage, stage as any),
            eq(srlWeightConfigs.sectorCode, sectorCode ?? "DEFAULT"),
            or(isNull(srlWeightConfigs.effectiveTo), sql`${srlWeightConfigs.effectiveTo} >= CURDATE()`)
          )
        )
        .orderBy(desc(srlWeightConfigs.effectiveFrom))
        .limit(1);
      const weightConfigRef = wcRows.length > 0 ? wcRows[0].id : "DEFAULT";

      // 7. Persist assessment
      const assessmentId = nanoid();
      const weightSnapshot = resolveWeights(stage, sectorCode ?? undefined);

      await (db.insert(srlAssessments) as any).values({
        id: assessmentId,
        ventureId,
        assessmentDate: new Date(assessmentDate),
        stageAtAssessment: stage as any,
        compositeScore: String(engineResult.compositeFinal),
        srlLevel: engineResult.srlLevel,
        scoreDelta: computedDelta !== null ? String(computedDelta) : null,
        gateRef: gateRef ?? null,
        gateStatus: (engineResult.gateResult?.status ?? "NA") as any,
        sustainabilityWatch: engineResult.sustainabilityWatch,
        trajectoryBonus: String(engineResult.trajectoryBonus),
        weightConfigSnapshot: weightSnapshot,
        assessedBy: actorId,
        isLocked: lockAssessment,
        versionNo: 1,
        notes: notes ?? null,
      });

      // 8. Persist dimension scores
      for (const dimCode of dims) {
        const ds = engineResult.dimensionScores[dimCode];
        if (!ds) continue;

        const dimDefRows = await db.select({ id: srlDimensionDefinitions.id })
          .from(srlDimensionDefinitions)
          .where(eq(srlDimensionDefinitions.dimensionCode, dimCode as any))
          .limit(1);
        const dimensionId = dimDefRows[0]?.id;
        if (!dimensionId) continue;

        const dimScoreId = nanoid();
        await db.insert(srlDimensionScores).values({
          id: dimScoreId,
          assessmentId,
          dimensionId,
          dimensionCode: dimCode as any,
          rawScore: String(Math.round(ds.rawScore * 100) / 100),
          weightedScore: String(Math.round(ds.coveredScore * 100) / 100),
          weightApplied: String(ds.weightApplied),
          kpiCoveragePct: String(Math.round(ds.coverageFactor * 100 * 100) / 100),
          gatePass: ds.gatePass,
          gateFloorValue: String(ds.gateFloorValue),
          gapFlags: ds.gapFlags,
        });

        // Persist KPI values
        for (const kpiResult of ds.kpiResults) {
          if (kpiResult.rawValue === null && kpiResult.normalisedValue === null) continue;
          const kpiDefRows = await db.select({ id: srlKpiDefinitions.id })
            .from(srlKpiDefinitions)
            .where(and(eq(srlKpiDefinitions.kpiCode, kpiResult.kpiCode), eq(srlKpiDefinitions.dimensionId, dimensionId)))
            .limit(1);
          const kpiDefId = kpiDefRows[0]?.id;
          if (!kpiDefId) continue;

          await (db.insert(srlKpiValues) as any).values({
            id: nanoid(),
            dimScoreId,
            kpiDefId,
            kpiCode: kpiResult.kpiCode,
            sourceId: "engine",
            rawValue: kpiResult.rawValue !== null ? String(kpiResult.rawValue) : null,
            unit: "",
            normalisedValue: kpiResult.normalisedValue !== null ? String(Math.round(kpiResult.normalisedValue * 100) / 100) : null,
            submittedBy: actorId,
          });
        }

        // Promote staging records to this assessment
        await db.update(srlDimensionScores)
          .set({ assessmentId })
          .where(
            and(
              eq(srlDimensionScores.assessmentId, "STAGING"),
              eq(srlDimensionScores.dimensionId, dimensionId)
            )
          );
      }

      // 9. Upsert venture profile
      await db.insert(srlVentureProfiles).values({
        ventureId,
        currentStage: stage as any,
        srlCurrentLevel: engineResult.srlLevel,
        srlCurrentScore: String(engineResult.compositeFinal),
        sustainabilityWatch: engineResult.sustainabilityWatch,
        watchActivatedAt: engineResult.sustainabilityWatch ? new Date() : null,
        isActive: true,
      }).onDuplicateKeyUpdate({
        set: {
          currentStage: stage as any,
          srlCurrentLevel: engineResult.srlLevel,
          srlCurrentScore: String(engineResult.compositeFinal),
          sustainabilityWatch: engineResult.sustainabilityWatch,
          updatedAt: new Date(),
        },
      });

      // 10. Update gate holding status
      if (gateRef && engineResult.gateResult) {
        const gateStatus = engineResult.gateResult.status;
        const existingGhs = await db.select({ id: srlGateHoldingStatus.id, status: srlGateHoldingStatus.status })
          .from(srlGateHoldingStatus)
          .where(and(eq(srlGateHoldingStatus.ventureId, ventureId), eq(srlGateHoldingStatus.gateCode, gateRef as any)))
          .limit(1);

        if (existingGhs.length === 0) {
          await (db.insert(srlGateHoldingStatus) as any).values({
            id: nanoid(),
            ventureId,
            gateCode: gateRef as any,
            status: gateStatus === "PASS" ? "CLEARED" : "REMEDIATION",
            firstFailAssessmentId: gateStatus === "FAIL" ? assessmentId : null,
            remediationStartDate: gateStatus === "FAIL" ? new Date(assessmentDate) : null,
          });
        } else {
          const newStatus = gateStatus === "PASS" ? "CLEARED" : "REMEDIATION";
          await db.update(srlGateHoldingStatus)
            .set({
              status: newStatus as any,
              clearanceAssessmentId: gateStatus === "PASS" ? assessmentId : null,
              clearanceDate: gateStatus === "PASS" ? new Date(assessmentDate) : null,
              updatedAt: new Date(),
            })
            .where(eq(srlGateHoldingStatus.id, existingGhs[0].id));
        }
      }

      // 11. IRL Modulation
      const { irlBlocked, vrlGateBlock, appliedRules } = await applyIrlModulation(
        engineResult.gateResult?.status ?? "NA",
        gateRef ?? null,
        engineResult.sustainabilityWatch
      );

      // 12. Audit log
      const vrlPayload = buildVrlPayload(ventureId, assessmentId, new Date(assessmentDate), stage, engineResult, computedDelta, weightConfigRef);
      await writeAuditLog(db, "assessment", ventureId, actorId, ctx.user.role ?? "user", assessmentId, vrlPayload, `SRL assessment run. Level: ${engineResult.srlLevel}. Gate: ${gateRef ?? "none"}`);

      return {
        assessmentId,
        compositeFinal: engineResult.compositeFinal,
        compositeRaw: engineResult.compositeRaw,
        trajectoryBonus: engineResult.trajectoryBonus,
        srlLevel: engineResult.srlLevel,
        srlLevelLabel: engineResult.srlLevelLabel,
        scoreDelta: computedDelta,
        dimensionScores: Object.fromEntries(
          dims.map(d => [d, {
            rawScore: engineResult.dimensionScores[d]?.rawScore ?? 0,
            coveredScore: engineResult.dimensionScores[d]?.coveredScore ?? 0,
            coverageFactor: engineResult.dimensionScores[d]?.coverageFactor ?? 0,
            gatePass: engineResult.dimensionScores[d]?.gatePass ?? false,
            gapFlags: engineResult.dimensionScores[d]?.gapFlags ?? [],
          }])
        ),
        gateResult: engineResult.gateResult,
        sustainabilityWatch: engineResult.sustainabilityWatch,
        watchReasons: engineResult.watchReasons,
        riskConditions: engineResult.riskConditions,
        improvementRateIndex: engineResult.improvementRateIndex,
        irlBlocked,
        vrlGateBlock,
        irlModulationRules: appliedRules,
        vrlPayload,
      };
    }),

  /**
   * Get the current SRL profile for a venture.
   */
  getVentureProfile: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const rows = await db.select()
        .from(srlVentureProfiles)
        .where(eq(srlVentureProfiles.ventureId, input.ventureId))
        .limit(1);

      return rows[0] ?? null;
    }),

  /**
   * List assessment history for a venture.
   */
  getAssessmentHistory: protectedProcedure
    .input(z.object({
      ventureId: z.string().optional(),
      limit: z.number().int().min(1).max(50).default(10),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      return db.select({
        id: srlAssessments.id,
        assessmentDate: srlAssessments.assessmentDate,
        stageAtAssessment: srlAssessments.stageAtAssessment,
        compositeScore: srlAssessments.compositeScore,
        srlLevel: srlAssessments.srlLevel,
        scoreDelta: srlAssessments.scoreDelta,
        gateRef: srlAssessments.gateRef,
        gateStatus: srlAssessments.gateStatus,
        sustainabilityWatch: srlAssessments.sustainabilityWatch,
        trajectoryBonus: srlAssessments.trajectoryBonus,
        isLocked: srlAssessments.isLocked,
        notes: srlAssessments.notes,
        createdAt: srlAssessments.createdAt,
      })
        .from(srlAssessments)
        .where(input.ventureId ? eq(srlAssessments.ventureId, input.ventureId) : undefined)
        .orderBy(desc(srlAssessments.assessmentDate), desc(srlAssessments.createdAt))
        .limit(input.limit).offset(input.offset);
    }),

  /**
   * Get full assessment detail including dimension scores and KPI values.
   */
  getAssessmentDetail: protectedProcedure
    .input(z.object({ assessmentId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const assessmentRows = await db.select()
        .from(srlAssessments)
        .where(eq(srlAssessments.id, input.assessmentId))
        .limit(1);
      if (!assessmentRows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Assessment not found" });

      const dimensionScoreRows = await db.select()
        .from(srlDimensionScores)
        .innerJoin(srlDimensionDefinitions, eq(srlDimensionScores.dimensionId, srlDimensionDefinitions.id))
        .where(eq(srlDimensionScores.assessmentId, input.assessmentId));

      const kpiValueRows = await db.select()
        .from(srlKpiValues)
        .innerJoin(srlDimensionScores, eq(srlKpiValues.dimScoreId, srlDimensionScores.id))
        .innerJoin(srlKpiDefinitions, eq(srlKpiValues.kpiDefId, srlKpiDefinitions.id))
        .where(eq(srlDimensionScores.assessmentId, input.assessmentId));

      return {
        assessment: assessmentRows[0],
        dimensionScores: dimensionScoreRows,
        kpiValues: kpiValueRows,
      };
    }),

  /**
   * Portfolio-level SRL summary.
   */
  getPortfolioSummary: protectedProcedure
    .input(z.object({ portfolioId: z.string().optional() }))
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const rows = await db.select({
        ventureId: srlVentureProfiles.ventureId,
        currentStage: srlVentureProfiles.currentStage,
        currentLevel: srlVentureProfiles.srlCurrentLevel,
        currentScore: srlVentureProfiles.srlCurrentScore,
        sustainabilityWatch: srlVentureProfiles.sustainabilityWatch,
        sectorCode: srlVentureProfiles.sectorCode,
      })
        .from(srlVentureProfiles)
        .where(eq(srlVentureProfiles.isActive, true));

      const avgScore = rows.length > 0
        ? Math.round(rows.reduce((s, v) => s + Number(v.currentScore ?? 0), 0) / rows.length * 100) / 100
        : 0;
      const watchCount = rows.filter(v => v.sustainabilityWatch).length;
      const levelDist = [0, 1, 2, 3, 4, 5].map(l => ({
        level: l,
        count: rows.filter(v => v.currentLevel === l).length,
      }));

      return { ventures: rows, avgScore, watchCount, levelDist, total: rows.length };
    }),

  /**
   * Get KPI definitions for a dimension (for building the submission form).
   */
  getKpiDefinitions: protectedProcedure
    .input(z.object({ dimensionCode: SrlDimCodeZ }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const dimRows = await db.select({ id: srlDimensionDefinitions.id, dimName: srlDimensionDefinitions.dimensionName })
        .from(srlDimensionDefinitions)
        .where(eq(srlDimensionDefinitions.dimensionCode, input.dimensionCode as any))
        .limit(1);
      if (!dimRows.length) return [];

      const rows = await db.select()
        .from(srlKpiDefinitions)
        .where(
          and(
            eq(srlKpiDefinitions.dimensionId, dimRows[0].id),
            or(isNull(srlKpiDefinitions.effectiveTo), sql`${srlKpiDefinitions.effectiveTo} >= CURDATE()`)
          )
        )
        .orderBy(desc(srlKpiDefinitions.isMandatory), srlKpiDefinitions.kpiCode);

      return rows.map(r => ({ ...r, dimName: dimRows[0].dimName }));
    }),

  /**
   * Get gate holding status for a venture.
   */
  getGateStatus: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      return db.select({
        id: srlGateHoldingStatus.id,
        ventureId: srlGateHoldingStatus.ventureId,
        gateCode: srlGateHoldingStatus.gateCode,
        status: srlGateHoldingStatus.status,
        firstFailAssessmentId: srlGateHoldingStatus.firstFailAssessmentId,
        clearanceAssessmentId: srlGateHoldingStatus.clearanceAssessmentId,
        remediationStartDate: srlGateHoldingStatus.remediationStartDate,
        clearanceDate: srlGateHoldingStatus.clearanceDate,
        restartCount: srlGateHoldingStatus.restartCount,
        updatedAt: srlGateHoldingStatus.updatedAt,
        compositeFloor: srlGateConfigs.compositeFloor,
        blockType: srlGateConfigs.blockType,
        remediationWindowDays: srlGateConfigs.remediationWindowDays,
      })
        .from(srlGateHoldingStatus)
        .innerJoin(
          srlGateConfigs,
          and(
            eq(srlGateConfigs.gateCode, srlGateHoldingStatus.gateCode),
            or(isNull(srlGateConfigs.effectiveTo), sql`${srlGateConfigs.effectiveTo} >= CURDATE()`)
          )
        )
        .where(eq(srlGateHoldingStatus.ventureId, input.ventureId))
        .orderBy(srlGateHoldingStatus.gateCode);
    }),

  /**
   * Get the VRL integration payload for the latest locked assessment.
   */
  getVrlPayload: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const aRows = await db.select()
        .from(srlAssessments)
        .where(and(eq(srlAssessments.ventureId, input.ventureId), eq(srlAssessments.isLocked, true)))
        .orderBy(desc(srlAssessments.assessmentDate), desc(srlAssessments.createdAt))
        .limit(1);
      if (!aRows.length) return null;
      const a = aRows[0];

      const dsRows = await db.select({
        dimensionCode: srlDimensionScores.dimensionCode,
        rawScore: srlDimensionScores.rawScore,
        weightedScore: srlDimensionScores.weightedScore,
        kpiCoveragePct: srlDimensionScores.kpiCoveragePct,
        gatePass: srlDimensionScores.gatePass,
      })
        .from(srlDimensionScores)
        .where(eq(srlDimensionScores.assessmentId, a.id));

      const dimScores: Record<string, object> = {};
      for (const row of dsRows) {
        if (row.dimensionCode) {
          dimScores[row.dimensionCode] = {
            raw_score: Number(row.rawScore),
            covered_score: Number(row.weightedScore),
            coverage_factor: Number(row.kpiCoveragePct ?? 0) / 100,
            gate_pass: Boolean(row.gatePass),
          };
        }
      }

      return {
        venture_id: a.ventureId,
        assessment_id: a.id,
        assessment_date: a.assessmentDate,
        stage_at_assessment: a.stageAtAssessment,
        srl_composite_final: Number(a.compositeScore),
        srl_level: a.srlLevel,
        score_delta: a.scoreDelta !== null ? Number(a.scoreDelta) : null,
        dimension_scores: dimScores,
        gate_ref: a.gateRef,
        gate_status: a.gateStatus,
        sustainability_watch: a.sustainabilityWatch,
        trajectory_bonus: Number(a.trajectoryBonus ?? 0),
        weight_config_snapshot: a.weightConfigSnapshot,
      };
    }),

  /**
   * Generate a reporting output record.
   */
  generateReport: protectedProcedure
    .input(z.object({
      assessmentId: z.string(),
      ventureId: z.string(),
      reportType: z.enum(["SCORECARD", "GATE_PACK", "ESG_SUMMARY", "EVIDENCE_BUNDLE", "VRL_CONTRIBUTION", "SDG_MAP"]),
      reportFormat: z.enum(["PDF", "DOCX", "XLSX", "JSON", "HTML"]),
      reportStandard: z.enum(["GRI", "TCFD", "SASB", "SDG", "INTERNAL"]).optional(),
      periodStart: z.string().optional(),
      periodEnd: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const reportId = nanoid();
      await (db.insert(srlReportingOutputs) as any).values({
        id: reportId,
        assessmentId: input.assessmentId,
        ventureId: input.ventureId,
        reportType: input.reportType as any,
        reportFormat: input.reportFormat as any,
        reportStandard: (input.reportStandard ?? null) as any,
        generatedBy: String(ctx.user.id),
        periodStart: input.periodStart ? new Date(input.periodStart) : null,
        periodEnd: input.periodEnd ? new Date(input.periodEnd) : null,
      });

      await writeAuditLog(db, "report_generated", input.ventureId, String(ctx.user.id), ctx.user.role ?? "user", reportId, { reportType: input.reportType, format: input.reportFormat });

      return { reportId, status: "generated" };
    }),

  /**
   * List active risk conditions for a venture based on latest assessment.
   */
  listRiskConditions: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const aRows = await db.select()
        .from(srlAssessments)
        .where(eq(srlAssessments.ventureId, input.ventureId))
        .orderBy(desc(srlAssessments.assessmentDate), desc(srlAssessments.createdAt))
        .limit(1);
      if (!aRows.length) return [];
      const a = aRows[0];

      const dsRows = await db.select({
        dimensionCode: srlDimensionScores.dimensionCode,
        rawScore: srlDimensionScores.rawScore,
        kpiCoveragePct: srlDimensionScores.kpiCoveragePct,
        gatePass: srlDimensionScores.gatePass,
      })
        .from(srlDimensionScores)
        .where(eq(srlDimensionScores.assessmentId, a.id));

      const risks: Array<{ code: string; severity: string; message: string; dimension?: string; kpiCode?: string }> = [];
      const composite = Number(a.compositeScore);

      // SRL-R01: MASRL (composite < 25)
      if (composite < 25) {
        risks.push({ code: "SRL-R01", severity: "CRITICAL", message: `Composite score ${composite.toFixed(1)} below MASRL threshold (25). Sustainability Watch activated.` });
      }

      for (const row of dsRows) {
        const dimCode = row.dimensionCode ?? "";
        const rawScore = Number(row.rawScore);
        const coverage = Number(row.kpiCoveragePct ?? 0) / 100;

        // SRL-R02: Dimension < 15
        if (rawScore < 15) {
          risks.push({ code: "SRL-R02", severity: "HIGH", message: `${dimCode} dimension score ${rawScore.toFixed(1)} below minimum floor (15).`, dimension: dimCode });
        }
        // SRL-R07: Low coverage
        if (coverage < 0.5) {
          risks.push({ code: "SRL-R07", severity: "MEDIUM", message: `${dimCode} dimension KPI coverage ${(coverage * 100).toFixed(0)}% below 50% threshold.`, dimension: dimCode });
        }
      }

      // SRL-R03/R04: Gate failures
      const gateRef = a.gateRef;
      const gateStatus = a.gateStatus;
      if (gateStatus === "FAIL" && gateRef) {
        const isHard = ["G3", "G4", "G5"].includes(gateRef);
        risks.push({
          code: isHard ? "SRL-R03" : "SRL-R04",
          severity: isHard ? "HIGH" : "MEDIUM",
          message: `${isHard ? "Hard" : "Soft"} gate ${gateRef} FAIL — ${isHard ? "VRL block active." : "30-day remediation window."}`,
        });
      }

      // SRL-R05: Score regression
      if (a.scoreDelta !== null && Number(a.scoreDelta) < -5) {
        risks.push({ code: "SRL-R05", severity: "MEDIUM", message: `Score regression of ${Math.abs(Number(a.scoreDelta)).toFixed(1)} points detected.` });
      }

      // SRL-R01 watch flag
      if (a.sustainabilityWatch) {
        if (!risks.find(r => r.code === "SRL-R01")) {
          risks.push({ code: "SRL-R01", severity: "CRITICAL", message: "Sustainability Watch active — disbursement hold raised." });
        }
      }

      return risks;
    }),

  /**
   * Historical SRL score time series for trend charts.
   */
  getTrends: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      limit: z.number().int().min(1).max(24).default(8),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const rows = await db.select({
        id: srlAssessments.id,
        assessmentDate: srlAssessments.assessmentDate,
        compositeScore: srlAssessments.compositeScore,
        srlLevel: srlAssessments.srlLevel,
        scoreDelta: srlAssessments.scoreDelta,
        trajectoryBonus: srlAssessments.trajectoryBonus,
        gateStatus: srlAssessments.gateStatus,
        gateRef: srlAssessments.gateRef,
        stageAtAssessment: srlAssessments.stageAtAssessment,
        sustainabilityWatch: srlAssessments.sustainabilityWatch,
      })
        .from(srlAssessments)
        .where(and(
          eq(srlAssessments.ventureId, input.ventureId),
          eq(srlAssessments.isLocked, true)
        ))
        .orderBy(desc(srlAssessments.assessmentDate))
        .limit(input.limit);

      // Fetch dimension scores for each assessment
      const assessmentIds = rows.map(r => r.id);
      const dimScoreMap: Record<string, Array<{ dimensionCode: string | null; rawScore: string | null; coveredScore: string | null; kpiCoveragePct: string | null }>> = {};
      if (assessmentIds.length > 0) {
        const dimRows = await db.select({
          assessmentId: srlDimensionScores.assessmentId,
          dimensionCode: srlDimensionScores.dimensionCode,
          rawScore: srlDimensionScores.rawScore,
          coveredScore: srlDimensionScores.weightedScore,
          kpiCoveragePct: srlDimensionScores.kpiCoveragePct,
        })
          .from(srlDimensionScores)
          .where(inArray(srlDimensionScores.assessmentId, assessmentIds));
        for (const dr of dimRows) {
          if (!dr.assessmentId) continue;
          if (!dimScoreMap[dr.assessmentId]) dimScoreMap[dr.assessmentId] = [];
          dimScoreMap[dr.assessmentId].push(dr);
        }
      }

      const series = rows.reverse().map(r => ({
        ...r,
        compositeScore: Number(r.compositeScore),
        scoreDelta: r.scoreDelta !== null ? Number(r.scoreDelta) : null,
        trajectoryBonus: r.trajectoryBonus !== null ? Number(r.trajectoryBonus) : null,
        dimensionScores: (dimScoreMap[r.id] ?? []).reduce((acc, d) => {
          if (d.dimensionCode) acc[d.dimensionCode] = {
            rawScore: Number(d.rawScore ?? 0),
            coveredScore: Number(d.coveredScore ?? 0),
            coveragePct: Number(d.kpiCoveragePct ?? 0),
          };
          return acc;
        }, {} as Record<string, { rawScore: number; coveredScore: number; coveragePct: number }>),
      }));

      const scores = series.map(s => s.compositeScore);
      const avgGain = scores.length > 1
        ? Math.round((scores[scores.length - 1] - scores[0]) / (scores.length - 1) * 100) / 100
        : 0;
      const projected = scores.length > 0 ? Math.min(100, Math.round((scores[scores.length - 1] + avgGain) * 100) / 100) : null;

      return {
        series,
        trajectory: {
          direction: avgGain > 0 ? "improving" : avgGain < 0 ? "declining" : "stable",
          avgGain,
          projected,
        },
      };
    }),

  /**
   * Get latest KPI values for a venture (from latest locked assessment).
   */
  getLatestKpiValues: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      dimensionCode: SrlDimCodeZ.optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const assessmentRows = await db.select({ id: srlAssessments.id })
        .from(srlAssessments)
        .where(and(
          eq(srlAssessments.ventureId, input.ventureId),
          eq(srlAssessments.isLocked, true)
        ))
        .orderBy(desc(srlAssessments.assessmentDate))
        .limit(1);

      if (!assessmentRows.length) return [];
      const assessmentId = assessmentRows[0].id;

      const dimRows = await db.select({ id: srlDimensionScores.id, dimensionCode: srlDimensionScores.dimensionCode })
        .from(srlDimensionScores)
        .where(
          input.dimensionCode
            ? and(eq(srlDimensionScores.assessmentId, assessmentId), eq(srlDimensionScores.dimensionCode, input.dimensionCode as any))
            : eq(srlDimensionScores.assessmentId, assessmentId)
        );

      if (!dimRows.length) return [];
      const dimScoreIds = dimRows.map(d => d.id);

      const kpiRows = await db.select({
        kpiCode: srlKpiDefinitions.kpiCode,
        kpiName: srlKpiDefinitions.kpiName,
        rawValue: srlKpiValues.rawValue,
        normalisedValue: srlKpiValues.normalisedValue,
        unit: srlKpiValues.unit,
        periodStart: srlKpiValues.periodStart,
        periodEnd: srlKpiValues.periodEnd,
        evidenceRef: srlKpiValues.evidenceRef,
        isMandatory: srlKpiDefinitions.isMandatory,
        dimensionCode: srlDimensionScores.dimensionCode,
      })
        .from(srlKpiValues)
        .innerJoin(srlKpiDefinitions, eq(srlKpiValues.kpiDefId, srlKpiDefinitions.id))
        .innerJoin(srlDimensionScores, eq(srlKpiValues.dimScoreId, srlDimensionScores.id))
        .where(inArray(srlKpiValues.dimScoreId, dimScoreIds));

      return kpiRows.map(r => ({
        ...r,
        rawValue: r.rawValue !== null ? Number(r.rawValue) : null,
        normalisedValue: r.normalisedValue !== null ? Number(r.normalisedValue) : null,
      }));
    }),

  getAuditLog: protectedProcedure
    .input(z.object({
      ventureId: z.string().optional(),
      limit: z.number().min(1).max(100).default(21),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const conditions = [];
      if (input.ventureId) conditions.push(eq(srlAuditLog.ventureId, input.ventureId));
      const rows = await db.select().from(srlAuditLog)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(srlAuditLog.eventTimestamp))
        .limit(input.limit)
        .offset(input.offset);
      return rows;
    }),
});