/**
 * VRL tRPC Router — BEBUS-VRL-UPDATE-001
 * EcoBlendVRLUpdateManusPrompt.pdf — Changes 3 & 4
 *
 * Procedures:
 *   vrl.submitAssessment   — accepts 9 scores, runs engine, persists to vrl_assessments
 *   vrl.getLatestAssessment — returns the most recent assessment for a venture
 *   vrl.getHistory          — returns all assessments for a venture (newest first)
 *   vrl.getPortfolioSummary — returns latest VRL score per venture
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { vrlAssessments } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { computeVrl, VRL_BANDS } from "./vrl.engine";
import { randomUUID } from "crypto";

// ── Shared input schema ───────────────────────────────────────────────────────
const scoreInt = z.number().int().min(0).max(100);

const assessmentInputSchema = z.object({
  ventureId: z.string().min(1),
  trlScore:  scoreInt,
  mrlScore:  scoreInt.describe("MRL score 0–100 from Engine A/B. Scores 0–19 trigger the veto gate (VRL capped regardless of other inputs)."),
  brlScore:  scoreInt,
  ecoScore:  scoreInt,
  prlScore:  scoreInt,
  ipScore:   scoreInt,
  frlScore:  scoreInt,
  regScore:  scoreInt,
  srlScore:  scoreInt,
  submittedBy: z.string().optional(),
});

// ── Helper: format a DB row as the canonical JSON response ───────────────────
function formatAssessment(row: typeof vrlAssessments.$inferSelect) {
  return {
    id:            row.id,
    ventureId:     row.ventureId,
    createdAt:     row.createdAt,
    // 9 raw input scores
    inputs: {
      trlScore:  row.trlScore,
      mrlScore:  row.mrlScore,
      brlScore:  row.brlScore,
      ecoScore:  row.ecoScore,
      prlScore:  row.prlScore,
      ipScore:   row.ipScore,
      frlScore:  row.frlScore,
      regScore:  row.regScore,
      srlScore:  row.srlScore,
    },
    // 5 meta-domain scores
    metaDomains: {
      productScore:        Number(row.productScore ?? 0),
      marketScore:         Number(row.marketScore ?? 0),
      executionScore:      Number(row.executionScore ?? 0),
      structuralScore:     Number(row.structuralScore ?? 0),
      sustainabilityScore: Number(row.sustainabilityScore ?? 0),
    },
    // VRL output
    baseAverage:     Number(row.baseAverage ?? 0),
    isVetoed:        row.isVetoed,
    globalVrlScore:  row.globalVrlScore ?? 0,
    bandLabel:       row.bandLabel ?? "Pre-Readiness",
    bandLevel:       VRL_BANDS.find(b => b.label === row.bandLabel)?.level ?? 0,
    submittedBy:     row.submittedBy ?? null,
  };
}

export const vrlRouter = router({
  // ── submitAssessment ────────────────────────────────────────────────────────
  submitAssessment: protectedProcedure
    .input(assessmentInputSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Run the engine
      const engineResult = computeVrl({
        trlScore: input.trlScore,
        mrlScore: input.mrlScore,
        brlScore: input.brlScore,
        ecoScore: input.ecoScore,
        prlScore: input.prlScore,
        ipScore:  input.ipScore,
        frlScore: input.frlScore,
        regScore: input.regScore,
        srlScore: input.srlScore,
      });

      const id = randomUUID();
      const submittedBy = input.submittedBy ?? ctx.user?.name ?? "system";

      await db.insert(vrlAssessments).values({
        id,
        ventureId:           input.ventureId,
        trlScore:            engineResult.inputs.trlScore,
        mrlScore:            engineResult.inputs.mrlScore,
        brlScore:            engineResult.inputs.brlScore,
        ecoScore:            engineResult.inputs.ecoScore,
        prlScore:            engineResult.inputs.prlScore,
        ipScore:             engineResult.inputs.ipScore,
        frlScore:            engineResult.inputs.frlScore,
        regScore:            engineResult.inputs.regScore,
        srlScore:            engineResult.inputs.srlScore,
        productScore:        engineResult.metaDomains.productScore.toFixed(2),
        marketScore:         engineResult.metaDomains.marketScore.toFixed(2),
        executionScore:      engineResult.metaDomains.executionScore.toFixed(2),
        structuralScore:     engineResult.metaDomains.structuralScore.toFixed(2),
        sustainabilityScore: engineResult.metaDomains.sustainabilityScore.toFixed(2),
        baseAverage:         engineResult.baseAverage.toFixed(2),
        isVetoed:            engineResult.isVetoed,
        globalVrlScore:      engineResult.globalVrlScore,
        bandLabel:           engineResult.bandLabel,
        submittedBy,
      });

      return {
        id,
        ventureId:      input.ventureId,
        createdAt:      new Date(),
        inputs:         engineResult.inputs,
        metaDomains:    engineResult.metaDomains,
        baseAverage:    engineResult.baseAverage,
        isVetoed:       engineResult.isVetoed,
        vetoedDimensions: engineResult.vetoedDimensions,
        globalVrlScore: engineResult.globalVrlScore,
        bandLabel:      engineResult.bandLabel,
        bandLevel:      engineResult.bandLevel,
        submittedBy,
      };
    }),

  // ── getLatestAssessment ─────────────────────────────────────────────────────
  getLatestAssessment: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [row] = await db
        .select()
        .from(vrlAssessments)
        .where(eq(vrlAssessments.ventureId, input.ventureId))
        .orderBy(desc(vrlAssessments.createdAt))
        .limit(1);

      if (!row) return null;
      return formatAssessment(row);
    }),

  // ── getHistory ──────────────────────────────────────────────────────────────
  getHistory: publicProcedure
    .input(z.object({
      ventureId: z.string(),
      limit: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const rows = await db
        .select()
        .from(vrlAssessments)
        .where(eq(vrlAssessments.ventureId, input.ventureId))
        .orderBy(desc(vrlAssessments.createdAt))
        .limit(input.limit);

      return rows.map(formatAssessment);
    }),

  // ── getPortfolioSummary ─────────────────────────────────────────────────────
  getPortfolioSummary: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];

      // Get all assessments, then pick the latest per venture in JS
      const rows = await db
        .select()
        .from(vrlAssessments)
        .orderBy(desc(vrlAssessments.createdAt));

      const seen = new Set<string>();
      const latest: typeof rows = [];
      for (const row of rows) {
        if (!seen.has(row.ventureId)) {
          seen.add(row.ventureId);
          latest.push(row);
        }
      }

      return latest.map(formatAssessment);
    }),

  // ── getBands ────────────────────────────────────────────────────────────────
  getBands: publicProcedure
    .query(() => VRL_BANDS),
});
