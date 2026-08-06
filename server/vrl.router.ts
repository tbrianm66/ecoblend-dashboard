/**
 * VRL tRPC Router — BEBUS-VRL-UPDATE-001 / D7 Evidence Enforcement
 *
 * Procedures:
 *   vrl.submitAssessment   — accepts 9 scores + optional evidenceLinks, runs engine, persists
 *   vrl.confirmEvidence    — human-in-the-loop: atomic tx writes confirmations, updates status
 *   vrl.getLatestAssessment — returns the most recent assessment for a venture (incl. evidence fields)
 *   vrl.getHistory          — returns all assessments for a venture (newest first)
 *   vrl.getPortfolioSummary — returns latest VRL score + evidence status per venture
 *   vrl.getBands            — static band table
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { vrlAssessments, vrlEvidenceConfirmations } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { computeVrl, VRL_BANDS, type VrlDimensionKey } from "./vrl.engine";
import { randomUUID } from "crypto";
import { assertVentureAccess } from "./discoveryMarket.router";
import {
  deriveEvidenceStatus,
  selfAssessedKeys,
  buildConfirmEvidenceGuard,
} from "./vrl.d7.helpers";

// ── Constants ─────────────────────────────────────────────────────────────────

/** All 10 VRL dimension keys — used for self-assessed computation and backfill. */
const ALL_DIM_KEYS: VrlDimensionKey[] = [
  "trlScore","mrlScore","brlScore","ecoScore",
  "prlScore","ipScore","frlScore","regScore","srlScore","mvlScore",
];

const TOTAL_DIMS = ALL_DIM_KEYS.length; // 10

// ── Shared input schema ───────────────────────────────────────────────────────

const scoreInt = z.number().int().min(0).max(100);

const assessmentInputSchema = z.object({
  ventureId:  z.string().min(1),
  trlScore:   scoreInt,
  mrlScore:   scoreInt.describe("MRL score 0–100 from Engine A/B. Scores 0–19 trigger the veto gate (unless Profile SV-01 with mrlIsUnscored=true)."),
  brlScore:   scoreInt,
  ecoScore:   scoreInt,
  prlScore:   scoreInt,
  ipScore:    scoreInt,
  frlScore:   scoreInt,
  regScore:   scoreInt,
  srlScore:   scoreInt,
  /** Gate 2: MVL — Market Validation Level (customer demand / discovery). Canonical 15% composite weight. */
  mvlScore:   scoreInt.default(50),
  submittedBy: z.string().optional(),
  /**
   * Gate 2 / Profile SV-01: Governed N/A path for MRL.
   * When profile="SV-01_SOCIAL_SOFTWARE" and mrlIsUnscored=true, MRL is excluded
   * from the veto gate and meta-domain formula. Adheres to B-03 three-state model.
   */
  profile:       z.enum(["STANDARD", "SV-01_SOCIAL_SOFTWARE"]).default("STANDARD"),
  mrlIsUnscored: z.boolean().default(false),
  /**
   * D7: Optional evidence links keyed by dimension.
   * Any dimension key absent or empty → flagged self-assessed.
   * Providing all 10 with non-empty URLs → evidenceStatus = 'fully_verified'.
   */
  evidenceLinks: z.record(z.string(), z.string()).optional(),
});

// ── formatAssessment — canonical JSON shape for a DB row ────────────────────

function formatAssessment(row: typeof vrlAssessments.$inferSelect) {
  return {
    id:           row.id,
    ventureId:    row.ventureId,
    createdAt:    row.createdAt,
    updatedAt:    row.updatedAt,
    // 10 raw input scores (Gate 2 adds mvlScore)
    inputs: {
      trlScore: row.trlScore,
      mrlScore: row.mrlScore,
      brlScore: row.brlScore,
      ecoScore: row.ecoScore,
      prlScore: row.prlScore,
      ipScore:  row.ipScore,
      frlScore: row.frlScore,
      regScore: row.regScore,
      srlScore: row.srlScore,
      mvlScore: row.mvlScore ?? 50,       // Gate 2 — default 50 for pre-Gate-2 rows
    },
    // Gate 2 / Profile SV-01
    profile:      (row.scoringProfile ?? "STANDARD") as "STANDARD" | "SV-01_SOCIAL_SOFTWARE",
    mrlIsGoverned: row.mrlIsUnscored ?? false,
    // 5 meta-domain scores
    metaDomains: {
      productScore:        Number(row.productScore        ?? 0),
      marketScore:         Number(row.marketScore         ?? 0),
      executionScore:      Number(row.executionScore      ?? 0),
      structuralScore:     Number(row.structuralScore     ?? 0),
      sustainabilityScore: Number(row.sustainabilityScore ?? 0),
    },
    // VRL output
    baseAverage:    Number(row.baseAverage ?? 0),
    isVetoed:       row.isVetoed,
    globalVrlScore: row.globalVrlScore ?? 0,
    bandLabel:      row.bandLabel ?? "Pre-Readiness",
    bandLevel:      VRL_BANDS.find(b => b.label === row.bandLabel)?.level ?? 0,
    submittedBy:    row.submittedBy ?? null,
    // D7 evidence fields
    evidenceStatus:              row.evidenceStatus              ?? "unverified",
    selfAssessedDimensions:      (row.selfAssessedDimensions     ?? ALL_DIM_KEYS) as string[],
    hasUnverifiedInputs:         row.hasUnverifiedInputs         ?? true,
    evidenceConfirmedAt:         row.evidenceConfirmedAt         ?? null,
    evidenceConfirmedBy:         row.evidenceConfirmedBy         ?? null,
    // submittedEvidenceLinks: URLs the submitter provided — shown to reviewers in the panel
    submittedEvidenceLinks:      (row.submittedEvidenceLinks as Partial<Record<string, string>> | null) ?? null,
  };
}

// ── Router ────────────────────────────────────────────────────────────────────

export const vrlRouter = router({

  // ── submitAssessment ───────────────────────────────────────────────────────
  submitAssessment: protectedProcedure
    .input(assessmentInputSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Authorization: caller must have access to the target venture (admin or venture member).
      // This prevents cross-venture IDOR — any authenticated user cannot submit for arbitrary ventures.
      await assertVentureAccess(db, ctx.user, input.ventureId, { allowClaim: true });

      // Normalise evidenceLinks: only keep recognised dimension keys
      const rawEvidence = input.evidenceLinks as Partial<Record<VrlDimensionKey, string>> | undefined;

      // Run the engine (evidenceLinks now preserved through clampInputs)
      const engineResult = computeVrl({
        trlScore:  input.trlScore,
        mrlScore:  input.mrlScore,
        brlScore:  input.brlScore,
        ecoScore:  input.ecoScore,
        prlScore:  input.prlScore,
        ipScore:   input.ipScore,
        frlScore:  input.frlScore,
        regScore:  input.regScore,
        srlScore:  input.srlScore,
        mvlScore:  input.mvlScore,         // Gate 2
        profile:   input.profile,          // Gate 2 / SV-01
        mrlIsUnscored: input.mrlIsUnscored, // Gate 2 / SV-01
        evidenceLinks: rawEvidence,
      });

      // D7: compute dimension-key-based evidence status
      const unverifiedKeys = selfAssessedKeys(rawEvidence);
      // Cap at partially_verified on submission; fully_verified requires confirmEvidence
      const evidenceStatus = deriveEvidenceStatus(unverifiedKeys.length, "submission");

      const id = randomUUID();
      const now = new Date();
      // submittedBy stores display name; submittedById stores the stable user ID for self-confirmation checks.
      const submittedBy   = input.submittedBy ?? ctx.user?.name ?? "system";
      const submittedById = ctx.user?.id ?? null;

      // D7: All assessments start as 'unverified' regardless of submitted URLs.
      // Submitted URLs are stored for reviewer inspection; confirmation requires an admin
      // to call confirmEvidence separately (two-party model).
      const allDimKeys = ALL_DIM_KEYS as unknown as string[];

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
        mvlScore:            engineResult.inputs.mvlScore,  // Gate 2
        scoringProfile:      engineResult.profile,          // Gate 2
        mrlIsUnscored:       engineResult.mrlIsGoverned,    // Gate 2 / SV-01
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
        submittedById,
        // D7 evidence — always unverified at submission; URLs stored for reviewer inspection
        evidenceStatus:          "unverified",
        selfAssessedDimensions:  allDimKeys,
        hasUnverifiedInputs:     true,
        submittedEvidenceLinks:  (rawEvidence && Object.keys(rawEvidence).length > 0) ? rawEvidence : null,
        updatedAt:               now,
      });

      return {
        id,
        ventureId:        input.ventureId,
        createdAt:        now,
        updatedAt:        now,
        inputs:           engineResult.inputs,
        metaDomains:      engineResult.metaDomains,
        baseAverage:      engineResult.baseAverage,
        isVetoed:         engineResult.isVetoed,
        vetoedDimensions: engineResult.vetoedDimensions,
        globalVrlScore:   engineResult.globalVrlScore,
        bandLabel:        engineResult.bandLabel,
        bandLevel:        engineResult.bandLevel,
        submittedBy,
        // D7 evidence — always unverified at submission
        evidenceStatus:              "unverified" as const,
        selfAssessedDimensions:      allDimKeys,
        hasUnverifiedInputs:         true,
        submittedEvidenceLinks:      rawEvidence ?? null,
        selfAssessedLabels:          engineResult.selfAssessedDimensions,
      };
    }),

  // ── confirmEvidence (D7 human-in-the-loop) ─────────────────────────────────
  /**
   * Atomic write: inserts/updates per-dimension evidence confirmations and
   * recomputes evidenceStatus on the parent assessment row in a single
   * DB transaction. An optimistic-lock guard on `updatedAt` rejects
   * concurrent conflicting writes.
   */
  /**
   * confirmEvidence — admin-only, two-party model.
   *
   * SECURITY REQUIREMENTS:
   *   1. Caller must have admin role (adminProcedure enforces this).
   *   2. Caller must NOT be the user who originally submitted the assessment
   *      (self-confirmation is rejected via submittedById comparison).
   *   3. confirmedBy is derived exclusively from the session — caller cannot supply it.
   *   4. Runs in a single DB transaction; optimistic-lock guard on updatedAt.
   */
  confirmEvidence: adminProcedure
    .input(z.object({
      assessmentId: z.string().min(1),
      /** updatedAt from the assessment row the caller last read — optimistic lock. */
      knownUpdatedAt: z.string().datetime().optional(),
      dimensionConfirmations: z.array(z.object({
        dimensionKey: z.enum([
          "trlScore","mrlScore","brlScore","ecoScore",
          "prlScore","ipScore","frlScore","regScore","srlScore","mvlScore",
        ]),
        evidenceUrl: z.string().min(1),
      })).min(1),
      // confirmedBy is NOT accepted from the caller — derived from session only.
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const now = new Date();

      // Load assessment to get ventureId AND submittedById for the authorization guard
      const [preCheck] = await db
        .select({
          ventureId:     vrlAssessments.ventureId,
          submittedById: vrlAssessments.submittedById,
        })
        .from(vrlAssessments)
        .where(eq(vrlAssessments.id, input.assessmentId))
        .limit(1);
      if (!preCheck) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Assessment ${input.assessmentId} not found` });
      }

      // Role + self-confirmation guard (throws FORBIDDEN on violation).
      // confirmedBy is session-derived here — callers cannot supply their own identity.
      let confirmedBy: string;
      try {
        ({ confirmedBy } = buildConfirmEvidenceGuard({
          callerRole:    ctx.user.role,
          callerId:      ctx.user.id,
          callerName:    ctx.user.name ?? undefined,
          submittedById: preCheck.submittedById,
        }));
      } catch (err) {
        throw new TRPCError({ code: "FORBIDDEN", message: (err as Error).message });
      }

      // Run inside a transaction for atomicity
      const result = await db.transaction(async (tx) => {
        // 1. Load current assessment — verify it exists and check optimistic lock
        const [current] = await tx
          .select({ id: vrlAssessments.id, updatedAt: vrlAssessments.updatedAt })
          .from(vrlAssessments)
          .where(eq(vrlAssessments.id, input.assessmentId))
          .limit(1);

        if (!current) {
          throw new Error(`Assessment ${input.assessmentId} not found`);
        }

        // Optimistic lock: reject if caller's snapshot is stale
        if (input.knownUpdatedAt) {
          const knownTs = new Date(input.knownUpdatedAt).getTime();
          const currentTs = new Date(current.updatedAt).getTime();
          if (Math.abs(currentTs - knownTs) > 1000) {
            throw new Error(
              "Conflict: assessment was updated by another operation. Reload and retry."
            );
          }
        }

        // 2. Upsert confirmation rows (delete+insert for the submitted dimensions)
        for (const conf of input.dimensionConfirmations) {
          // Delete existing confirmation for this dimension (if any) then insert fresh
          await tx
            .delete(vrlEvidenceConfirmations)
            .where(
              and(
                eq(vrlEvidenceConfirmations.assessmentId, input.assessmentId),
                eq(vrlEvidenceConfirmations.dimensionKey, conf.dimensionKey),
              )
            );
          await tx.insert(vrlEvidenceConfirmations).values({
            id:           randomUUID(),
            assessmentId: input.assessmentId,
            dimensionKey: conf.dimensionKey,
            evidenceUrl:  conf.evidenceUrl,
            confirmedBy,
            confirmedAt:  now,
          });
        }

        // 3. Count total confirmed dimensions across all prior + new confirmations
        const allConfirmations = await tx
          .select({ dimensionKey: vrlEvidenceConfirmations.dimensionKey })
          .from(vrlEvidenceConfirmations)
          .where(eq(vrlEvidenceConfirmations.assessmentId, input.assessmentId));

        const confirmedKeys = new Set(allConfirmations.map(r => r.dimensionKey));
        const unverifiedCount = TOTAL_DIMS - confirmedKeys.size;
        const newStatus = deriveEvidenceStatus(unverifiedCount);
        const remainingUnverified = ALL_DIM_KEYS.filter(k => !confirmedKeys.has(k)) as string[];

        // 4. Update parent assessment row atomically
        await tx
          .update(vrlAssessments)
          .set({
            evidenceStatus:          newStatus,
            selfAssessedDimensions:  remainingUnverified,
            hasUnverifiedInputs:     remainingUnverified.length > 0,
            evidenceConfirmedAt:     newStatus === "fully_verified" ? now : undefined,
            evidenceConfirmedBy:     newStatus === "fully_verified" ? confirmedBy : undefined,
            updatedAt:               now,
          })
          .where(eq(vrlAssessments.id, input.assessmentId));

        return {
          assessmentId:     input.assessmentId,
          evidenceStatus:   newStatus,
          confirmedDims:    Array.from(confirmedKeys),
          remainingUnverified,
          fullyVerifiedAt:  newStatus === "fully_verified" ? now : null,
        };
      });

      return result;
    }),

  // ── getLatestAssessment ────────────────────────────────────────────────────
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

  // ── getHistory ─────────────────────────────────────────────────────────────
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

  // ── getPortfolioSummary ────────────────────────────────────────────────────
  getPortfolioSummary: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];

      // Latest row per venture (JS-side dedup — portfolio is small)
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

  // ── getEvidenceConfirmations ───────────────────────────────────────────────
  /** Return all dimension confirmations for a given assessment. */
  getEvidenceConfirmations: publicProcedure
    .input(z.object({ assessmentId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(vrlEvidenceConfirmations)
        .where(eq(vrlEvidenceConfirmations.assessmentId, input.assessmentId))
        .orderBy(vrlEvidenceConfirmations.confirmedAt);
    }),

  // ── getBands ───────────────────────────────────────────────────────────────
  getBands: publicProcedure
    .query(() => VRL_BANDS),
});
