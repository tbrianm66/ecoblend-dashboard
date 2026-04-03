/**
 * TRL/MRL Sync Engine — tRPC Router
 * Spec: BEBUS-SYNC-SE-001
 *
 * Procedures:
 *   sync.compute          — run sync engine for a venture (saves assessment + history row)
 *   sync.getPortfolio     — all ventures with latest sync assessment
 *   sync.getVentureDetail — full assessment history for one venture
 *   sync.getScenarios     — list all seeded demo scenarios
 *   sync.runScenario      — compute sync for a scenario (no DB write)
 *   sync.getHistory       — raw sync_history rows for a venture
 */

import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { computeSync, runDecisionTree, roundSync } from "./sync.engine";
import { syncAssessments, syncHistory, syncScenarios, ventures } from "../drizzle/schema";
import { desc, eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

// ── Input schemas ─────────────────────────────────────────────────────────────

const DomainCriticalitySchema = z.object({
  supply:     z.number().min(0).max(1).default(0.5),
  cost:       z.number().min(0).max(1).default(0.5),
  compliance: z.number().min(0).max(1).default(0.5),
});

const HistoryPointSchema = z.object({
  trl: z.number().int().min(1).max(9),
  mrl: z.number().int().min(1).max(9),
});

// ── Router ────────────────────────────────────────────────────────────────────

export const syncRouter = router({

  /**
   * compute — run the sync engine for a venture.
   * Writes one row to sync_assessments and one row to sync_history.
   * Returns the full SyncResult + decision tree output.
   */
  compute: protectedProcedure
    .input(z.object({
      ventureId:          z.string().min(1),
      trl:                z.number().int().min(1).max(9),
      mrl:                z.number().int().min(1).max(9),
      domainCriticality:  DomainCriticalitySchema.optional(),
      baseVRL:            z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();

      // Fetch last 3 history rows for velocity calculation
      const historyRows = await db
        .select({ trl: syncHistory.trl, mrl: syncHistory.mrl })
        .from(syncHistory)
        .where(eq(syncHistory.ventureId, input.ventureId))
        .orderBy(desc(syncHistory.recordedAt))
        .limit(3);

      const history = historyRows.reverse(); // oldest first

      const syncInput = {
        trl:               input.trl,
        mrl:               input.mrl,
        domainCriticality: input.domainCriticality,
        history,
        baseVRL:           input.baseVRL,
      };

      const rawResult = computeSync(syncInput);
      const result    = roundSync(rawResult);
      const decision  = runDecisionTree({ trl: input.trl, mrl: input.mrl, sync: rawResult });

      const syncId = randomUUID();

      // Insert assessment row (insert-only)
      await db.insert(syncAssessments).values({
        syncId,
        ventureId:        input.ventureId,
        trl:              input.trl,
        mrl:              input.mrl,
        delta:            result.delta,
        psi:              String(result.psi),
        rho:              String(result.rho),
        eta:              String(result.eta),
        vrlPenalty:       String(result.vrlPenalty),
        adjustedVrl:      String(result.adjustedVRL),
        wStage:           String(result.wStage),
        wVelocity:        String(result.wVelocity),
        severity:         decision.severity,
        primaryPath:      decision.primaryPath,
        domainSupply:     String(input.domainCriticality?.supply     ?? 0.5),
        domainCost:       String(input.domainCriticality?.cost       ?? 0.5),
        domainCompliance: String(input.domainCriticality?.compliance ?? 0.5),
        actions:          decision.actions,
        historySnapshot:  history.slice(-3),
      });

      // Append history row
      await db.insert(syncHistory).values({
        historyId:  randomUUID(),
        ventureId:  input.ventureId,
        trl:        input.trl,
        mrl:        input.mrl,
        delta:      result.delta,
      });

      return {
        syncId,
        ventureId:   input.ventureId,
        trl:         input.trl,
        mrl:         input.mrl,
        delta:       result.delta,
        psi:         result.psi,
        rho:         result.rho,
        eta:         result.eta,
        vrlPenalty:  result.vrlPenalty,
        adjustedVRL: result.adjustedVRL,
        wStage:      result.wStage,
        wVelocity:   result.wVelocity,
        severity:    decision.severity,
        primaryPath: decision.primaryPath,
        actions:     decision.actions,
      };
    }),

  /**
   * getPortfolio — latest sync assessment per venture.
   * Returns all ventures with their most recent sync result.
   */
  getPortfolio: protectedProcedure
    .query(async () => {
      const db = await getDb();

      // Get all ventures
      const allVentures = await db
        .select({
          id:     ventures.id,
          name:   ventures.name,
          trl:    ventures.trl,
          color:  ventures.color,
          status: ventures.status,
        })
        .from(ventures)
        .orderBy(ventures.name);

      // Get latest assessment per venture
      const latestAssessments = await db
        .select()
        .from(syncAssessments)
        .orderBy(desc(syncAssessments.createdAt));

      // Build a map: ventureId → latest assessment
      const latestMap = new Map<string, typeof latestAssessments[0]>();
      for (const a of latestAssessments) {
        if (!latestMap.has(a.ventureId)) {
          latestMap.set(a.ventureId, a);
        }
      }

      return allVentures.map(v => ({
        ...v,
        latestSync: latestMap.get(v.id) ?? null,
      }));
    }),

  /**
   * getVentureDetail — full assessment history for one venture.
   */
  getVentureDetail: protectedProcedure
    .input(z.object({ ventureId: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();

      const [venture] = await db
        .select()
        .from(ventures)
        .where(eq(ventures.id, input.ventureId))
        .limit(1);

      if (!venture) throw new Error("Venture not found");

      const assessments = await db
        .select()
        .from(syncAssessments)
        .where(eq(syncAssessments.ventureId, input.ventureId))
        .orderBy(desc(syncAssessments.createdAt))
        .limit(20);

      const history = await db
        .select()
        .from(syncHistory)
        .where(eq(syncHistory.ventureId, input.ventureId))
        .orderBy(desc(syncHistory.recordedAt))
        .limit(30);

      return { venture, assessments, history };
    }),

  /**
   * getScenarios — list all seeded demo scenarios.
   */
  getScenarios: publicProcedure
    .query(async () => {
      const db = await getDb();
      return db
        .select()
        .from(syncScenarios)
        .orderBy(syncScenarios.name);
    }),

  /**
   * runScenario — compute sync for a named scenario (no DB write).
   * Used by the Scenario Explorer UI.
   */
  runScenario: publicProcedure
    .input(z.object({ scenarioId: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();

      const [scenario] = await db
        .select()
        .from(syncScenarios)
        .where(eq(syncScenarios.scenarioId, input.scenarioId))
        .limit(1);

      if (!scenario) throw new Error("Scenario not found");

      const history = (scenario.history as Array<{ trl: number; mrl: number }>) ?? [];

      const syncInput = {
        trl:  scenario.trl,
        mrl:  scenario.mrl,
        domainCriticality: {
          supply:     Number(scenario.domainSupply),
          cost:       Number(scenario.domainCost),
          compliance: Number(scenario.domainCompliance),
        },
        history,
      };

      const rawResult = computeSync(syncInput);
      const result    = roundSync(rawResult);
      const decision  = runDecisionTree({ trl: scenario.trl, mrl: scenario.mrl, sync: rawResult });

      return {
        scenario,
        trl:         scenario.trl,
        mrl:         scenario.mrl,
        delta:       result.delta,
        psi:         result.psi,
        rho:         result.rho,
        eta:         result.eta,
        vrlPenalty:  result.vrlPenalty,
        adjustedVRL: result.adjustedVRL,
        wStage:      result.wStage,
        wVelocity:   result.wVelocity,
        severity:    decision.severity,
        primaryPath: decision.primaryPath,
        actions:     decision.actions,
      };
    }),

  /**
   * getHistory — raw sync_history rows for a venture (for sparkline/chart).
   */
  getHistory: protectedProcedure
    .input(z.object({
      ventureId: z.string().min(1),
      limit:     z.number().int().min(1).max(100).default(30),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db
        .select()
        .from(syncHistory)
        .where(eq(syncHistory.ventureId, input.ventureId))
        .orderBy(desc(syncHistory.recordedAt))
        .limit(input.limit);
    }),

  /**
   * computeAdHoc — run sync engine without saving to DB.
   * Used by the live calculator UI.
   */
  computeAdHoc: publicProcedure
    .input(z.object({
      trl:               z.number().int().min(1).max(9),
      mrl:               z.number().int().min(1).max(9),
      domainCriticality: DomainCriticalitySchema.optional(),
      history:           z.array(HistoryPointSchema).optional(),
      baseVRL:           z.number().min(0).max(100).optional(),
    }))
    .query(({ input }) => {
      const rawResult = computeSync({
        trl:               input.trl,
        mrl:               input.mrl,
        domainCriticality: input.domainCriticality,
        history:           input.history,
        baseVRL:           input.baseVRL,
      });
      const result   = roundSync(rawResult);
      const decision = runDecisionTree({ trl: input.trl, mrl: input.mrl, sync: rawResult });

      return {
        trl:         input.trl,
        mrl:         input.mrl,
        delta:       result.delta,
        psi:         result.psi,
        rho:         result.rho,
        eta:         result.eta,
        vrlPenalty:  result.vrlPenalty,
        adjustedVRL: result.adjustedVRL,
        wStage:      result.wStage,
        wVelocity:   result.wVelocity,
        severity:    decision.severity,
        primaryPath: decision.primaryPath,
        actions:     decision.actions,
      };
    }),
});
