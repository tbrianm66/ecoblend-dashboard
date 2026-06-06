/**
 * MRL Scoring Router — BEBUS-MRL-SCORE-001
 * Procedures:
 *   mrlScoring.computeAdHoc       — compute without persisting
 *   mrlScoring.computeAndSave     — compute + persist session + category rows
 *   mrlScoring.getDatasets        — list all demo datasets
 *   mrlScoring.getDataset         — get one dataset by id
 *   mrlScoring.getSessions        — list sessions (optionally filtered by ventureId)
 *   mrlScoring.getSession         — get one session with category results
 *   mrlScoring.getPortfolioStats  — aggregate stats across all sessions
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { scoringSessions, scoringCategoryResults, scoringDatasets, ccAlerts } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { computeMRLScore, type ScoringInput, type CategoryKey } from "./mrlScoring";
import { createHash, randomUUID } from "crypto";

// ── INPUT SCHEMAS ─────────────────────────────────────────────────────────────

const CategoryInputSchema = z.object({
  maturity: z.number().int().min(0).max(4).default(2),
  p1: z.number().min(0).max(10).optional(),
  p2: z.number().min(0).max(10).optional(),
  p3: z.number().min(0).max(10).optional(),
  p4: z.number().min(0).max(10).optional(),
  p5: z.number().min(0).max(10).optional(),
  p6: z.number().min(0).max(10).optional(),
  s1: z.number().min(0).max(10).optional(),
  s2: z.number().min(0).max(10).optional(),
  s3: z.number().min(0).max(10).optional(),
  s4: z.number().min(0).max(10).optional(),
  s5: z.number().min(0).max(10).optional(),
  s6: z.number().min(0).max(10).optional(),
  c1: z.number().min(0).max(10).optional(),
  c2: z.number().min(0).max(10).optional(),
  c3: z.number().min(0).max(10).optional(),
  c4: z.number().min(0).max(10).optional(),
  c5: z.number().min(0).max(10).optional(),
  c6: z.number().min(0).max(10).optional(),
  q1: z.number().min(0).max(10).optional(),
  q2: z.number().min(0).max(10).optional(),
  q3: z.number().min(0).max(10).optional(),
  q4: z.number().min(0).max(10).optional(),
  q5: z.number().min(0).max(10).optional(),
  q6: z.number().min(0).max(10).optional(),
  e1: z.number().min(0).max(10).optional(),
  e2: z.number().min(0).max(10).optional(),
  e3: z.number().min(0).max(10).optional(),
  e4: z.number().min(0).max(10).optional(),
  e5: z.number().min(0).max(10).optional(),
  e6: z.number().min(0).max(10).optional(),
});

const ScoringInputSchema = z.object({
  venture_id:   z.string().optional(),
  venture_name: z.string().optional(),
  process:        CategoryInputSchema,
  supply_chain:   CategoryInputSchema,
  cost:           CategoryInputSchema,
  quality:        CategoryInputSchema,
  sustainability: CategoryInputSchema,
});

// ── HELPERS ───────────────────────────────────────────────────────────────────

function buildSnapshotHash(input: ScoringInput): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex").slice(0, 64);
}

// ── ROUTER ────────────────────────────────────────────────────────────────────

export const mrlScoringRouter = router({
  /**
   * Compute MRL score without persisting to DB.
   * Used by the live scorer UI for instant feedback.
   */
  computeAdHoc: publicProcedure
    .input(ScoringInputSchema)
    .query(({ input }) => {
      const result = computeMRLScore(input as ScoringInput);
      return result;
    }),

  /**
   * Compute MRL score AND persist to scoring_sessions + scoring_category_results.
   * Returns the full result plus the sessionId for audit trail.
   */
  computeAndSave: publicProcedure
    .input(ScoringInputSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      const result = computeMRLScore(input as ScoringInput);
      const sessionId = randomUUID();
      const snapshotHash = buildSnapshotHash(input as ScoringInput);

      // Insert session row
      await db.insert(scoringSessions).values({
        sessionId,
        ventureId:      input.venture_id ?? null,
        ventureName:    input.venture_name ?? null,
        mrlScore:       String(result.mrl_score),
        mrlScoreRaw:    String(result.mrl_score_raw),
        mrlLevel:       result.mrl_level,
        mrlLabel:       result.mrl_label,
        confidenceBand: String(result.confidence_band),
        gateLocked:     result.gate_locked,
        gateReason:     result.gate_reason ?? null,
        schemaVersion:  "1.0.0",
        assessmentType: "manual",
        snapshotHash,
      });

      // Insert one row per category (5 rows)
      const catKeys = Object.keys(result.categories) as CategoryKey[];
      for (const cat of catKeys) {
        const cr = result.categories[cat];
        await db.insert(scoringCategoryResults).values({
          resultId:       randomUUID(),
          sessionId,
          category:       cat,
          scoreS:         String(cr.score_S),
          maturityM:      String(cr.maturity_M),
          weightW:        String(cr.weight_w),
          contribution:   String(cr.contribution),
          maturityLabel:  cr.maturity_label,
          indicatorScores: cr.indicators,
        });
      }

      // Auto-alert: if gate is locked and a venture is associated, raise a
      // cc_alert so the Command Centre dashboard surfaces the floor breach
      // immediately without requiring a manual review step.
      if (result.gate_locked && input.venture_id) {
        await db
          .insert(ccAlerts)
          .values({
            ventureId:        input.venture_id,
            alertType:        "mrl_gate_locked",
            alertTitle:       "MRL Gate Locked — Critical Floor Breach",
            alertDescription: result.gate_reason ??
              "One or more MRL critical indicators are below their minimum floor score. " +
              "Advance to the next stage is blocked until the breach is resolved.",
            severity:         "critical",
            linkedModule:     "mrl_scoring",
            autoGenerated:    true,
            dedupeKey:        `mrl-gate-locked-${input.venture_id}-${snapshotHash}`,
            status:           "open",
          })
          .onConflictDoNothing();
      }

      return { sessionId, ...result };
    }),

  /**
   * List all demo datasets.
   */
  getDatasets: publicProcedure
    .query(async () => {
      const db = await getDb();
      const rows = await db
        .select()
        .from(scoringDatasets)
        .orderBy(scoringDatasets.createdAt);
      return rows;
    }),

  /**
   * Get one dataset by id.
   */
  getDataset: publicProcedure
    .input(z.object({ datasetId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [row] = await db
        .select()
        .from(scoringDatasets)
        .where(eq(scoringDatasets.datasetId, input.datasetId))
        .limit(1);
      return row ?? null;
    }),

  /**
   * List sessions, optionally filtered by ventureId.
   * Returns last 50 sessions ordered by createdAt desc.
   */
  getSessions: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const query = db
        .select()
        .from(scoringSessions)
        .orderBy(desc(scoringSessions.createdAt))
        .limit(50);

      if (input?.ventureId) {
        return db
          .select()
          .from(scoringSessions)
          .where(eq(scoringSessions.ventureId, input.ventureId))
          .orderBy(desc(scoringSessions.createdAt))
          .limit(50);
      }

      return query;
    }),

  /**
   * Get one session with its 5 category results.
   */
  getSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(scoringSessions)
        .where(eq(scoringSessions.sessionId, input.sessionId))
        .limit(1);

      if (!session) return null;

      const categories = await db
        .select()
        .from(scoringCategoryResults)
        .where(eq(scoringCategoryResults.sessionId, input.sessionId));

      return { ...session, categories };
    }),

  /**
   * Portfolio-level aggregate stats across all saved sessions.
   */
  getPortfolioStats: publicProcedure
    .query(async () => {
      const db = await getDb();
      const sessions = await db
        .select()
        .from(scoringSessions)
        .orderBy(desc(scoringSessions.createdAt));

      if (sessions.length === 0) {
        return {
          totalSessions: 0,
          avgMrlScore: 0,
          avgMrlLevel: 0,
          gateLockedCount: 0,
          levelDistribution: {} as Record<number, number>,
          latestSession: null,
        };
      }

      const scores = sessions.map(s => Number(s.mrlScore));
      const levels = sessions.map(s => s.mrlLevel);
      const avgMrlScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
      const avgMrlLevel = Math.round((levels.reduce((a, b) => a + b, 0) / levels.length) * 10) / 10;
      const gateLockedCount = sessions.filter(s => s.gateLocked).length;

      const levelDistribution: Record<number, number> = {};
      for (const l of levels) {
        levelDistribution[l] = (levelDistribution[l] ?? 0) + 1;
      }

      return {
        totalSessions: sessions.length,
        avgMrlScore,
        avgMrlLevel,
        gateLockedCount,
        levelDistribution,
        latestSession: sessions[0],
      };
    }),
});
