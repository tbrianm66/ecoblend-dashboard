/**
 * Lean Canvas Router — v3 (Hybrid Venture Model Canvas)
 * Append-only versioning: every save inserts a new row (version = max+1).
 * Supports both the legacy 11-block Lean Canvas fields and the new 10-block
 * Hybrid VMC fields. Both field sets are accepted and persisted; clients can
 * migrate incrementally without breaking existing canvas records.
 */
import { z } from "zod";
import { eq, desc, max, sql } from "drizzle-orm";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  leanCanvases,
  leanCanvasBlocks,
  leanCanvasBlockEvidenceLinks,
  ventures,
  pivotLog,
} from "../drizzle/schema";

const ventureInput = z.object({ ventureId: z.string() });

const blockMetaSchema = z.object({
  blockType:            z.string(),
  blockStatus:          z.string().optional(),
  evidenceStatus:       z.string().optional(),
  confidenceScore:      z.number().optional(),
  linkedHypothesisId:   z.string().nullable().optional(),
  contradictionSummary: z.string().nullable().optional(),
  blockNotes:           z.string().nullable().optional(),
});

// Pivot tracking — new hybrid fields + legacy fields for backward compat
const PIVOT_FIELDS: { key: string; pivotType: string }[] = [
  { key: "customerSegments",    pivotType: "customer_segment" },
  { key: "commercialValueProp", pivotType: "value_proposition" },
  { key: "missionValueProp",    pivotType: "mission_value_proposition" },
  { key: "revenueStreams",      pivotType: "revenue_streams" },
  { key: "channels",            pivotType: "channels" },
  { key: "keyResources",        pivotType: "key_resources" },
  { key: "missionGovernance",   pivotType: "mission_governance" },
  // Legacy field tracking (preserved for old canvas records)
  { key: "problem",             pivotType: "problem" },
  { key: "solution",            pivotType: "solution" },
  { key: "uniqueValueProp",     pivotType: "value_proposition_legacy" },
  { key: "unfairAdvantage",     pivotType: "business_architecture" },
];

export const leanCanvasRouter = router({

  // ── Canvas CRUD ─────────────────────────────────────────────────────────────

  list: publicProcedure
    .input(ventureInput)
    .query(async ({ input }) => {
      const db = await getDb();
      return db
        .select()
        .from(leanCanvases)
        .where(eq(leanCanvases.ventureId, input.ventureId))
        .orderBy(desc(leanCanvases.version));
    }),

  getActive: publicProcedure
    .input(ventureInput)
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db
        .select()
        .from(leanCanvases)
        .where(eq(leanCanvases.ventureId, input.ventureId))
        .orderBy(desc(leanCanvases.version))
        .limit(1);
      return rows[0] ?? null;
    }),

  getVersion: publicProcedure
    .input(z.object({ ventureId: z.string(), version: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db
        .select()
        .from(leanCanvases)
        .where(
          sql`${leanCanvases.ventureId} = ${input.ventureId} AND ${leanCanvases.version} = ${input.version}`,
        )
        .limit(1);
      return rows[0] ?? null;
    }),

  /** Append-only save — always creates a new version row */
  save: publicProcedure
    .input(z.object({
      ventureId: z.string(),

      // ── Hybrid VMC fields (10-block schema) ────────────────────────────────
      keyPartners:          z.string().optional(),
      keyActivities:        z.string().optional(),
      keyResources:         z.string().optional(),
      commercialValueProp:  z.string().optional(),
      missionValueProp:     z.string().optional(),
      beneficiarySegments:  z.string().optional(),
      missionGovernance:    z.string().optional(),
      impactMetrics:        z.string().optional(),

      // ── Shared fields (present in both legacy and hybrid) ──────────────────
      customerSegments:     z.string().optional(),
      channels:             z.string().optional(),
      revenueStreams:       z.string().optional(),
      costStructure:        z.string().optional(),

      // ── Legacy Lean Canvas fields (backward compat — preserved on save) ────
      problem:              z.string().optional(),
      solution:             z.string().optional(),
      uniqueValueProp:      z.string().optional(),
      existingAlternatives: z.string().optional(),
      keyMetrics:           z.string().optional(),
      unfairAdvantage:      z.string().optional(),
      highLevelConcept:     z.string().optional(),
      mvpFormat:            z.string().optional(),
      hypothesisTested:     z.string().optional(),
      successCriteria:      z.string().optional(),
      notes:                z.string().optional(),

      // ── Canvas-level metadata ───────────────────────────────────────────────
      canvasTitle:          z.string().optional(),
      overallStatus:        z.string().optional(),
      versionLabel:         z.string().optional(),
      changeSummary:        z.string().optional(),
      reasonForChange:      z.string().optional(),
      evidenceTrigger:      z.string().optional(),
      createdBy:            z.string().optional(),
      loggedBy:             z.string().optional(),
      blocksMeta:           z.array(blockMetaSchema).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();

      const maxRow = await db
        .select({ m: max(leanCanvases.version) })
        .from(leanCanvases)
        .where(eq(leanCanvases.ventureId, input.ventureId));
      const nextVersion = (maxRow[0]?.m ?? 0) + 1;

      const prevRows = await db
        .select()
        .from(leanCanvases)
        .where(eq(leanCanvases.ventureId, input.ventureId))
        .orderBy(desc(leanCanvases.version))
        .limit(1);
      const prevRow = prevRows[0] ?? null;

      await db
        .update(leanCanvases)
        .set({ status: "archived", updatedAt: new Date() })
        .where(
          sql`${leanCanvases.ventureId} = ${input.ventureId} AND ${leanCanvases.status} = 'active'`,
        );

      const inserted = await db
        .insert(leanCanvases)
        .values({
          ventureId: input.ventureId,
          version:   nextVersion,

          // Hybrid VMC fields
          keyPartners:         input.keyPartners,
          keyActivities:       input.keyActivities,
          keyResources:        input.keyResources,
          commercialValueProp: input.commercialValueProp,
          missionValueProp:    input.missionValueProp,
          beneficiarySegments: input.beneficiarySegments,
          missionGovernance:   input.missionGovernance,
          impactMetrics:       input.impactMetrics,

          // Shared fields
          customerSegments: input.customerSegments,
          channels:         input.channels,
          revenueStreams:   input.revenueStreams,
          costStructure:    input.costStructure,

          // Legacy fields (preserved)
          problem:              input.problem,
          solution:             input.solution,
          uniqueValueProp:      input.uniqueValueProp,
          existingAlternatives: input.existingAlternatives,
          keyMetrics:           input.keyMetrics,
          unfairAdvantage:      input.unfairAdvantage,
          highLevelConcept:     input.highLevelConcept,
          mvpFormat:            input.mvpFormat,
          hypothesisTested:     input.hypothesisTested,
          successCriteria:      input.successCriteria,
          notes:                input.notes,

          // Metadata
          canvasTitle:    input.canvasTitle,
          overallStatus:  input.overallStatus ?? "draft",
          versionLabel:   input.versionLabel,
          changeSummary:  input.changeSummary,
          reasonForChange: input.reasonForChange,
          evidenceTrigger: input.evidenceTrigger,
          createdBy:      input.createdBy,
          status:         "active",
        })
        .returning();

      const newCanvas = inserted[0];

      await db
        .update(ventures)
        .set({ canvasVersion: nextVersion, updatedAt: new Date() })
        .where(eq(ventures.id, input.ventureId));

      if (input.blocksMeta && input.blocksMeta.length > 0) {
        for (const bm of input.blocksMeta) {
          await db
            .insert(leanCanvasBlocks)
            .values({
              canvasId:             newCanvas.id,
              ventureId:            input.ventureId,
              blockType:            bm.blockType,
              blockStatus:          bm.blockStatus ?? "assumption",
              evidenceStatus:       bm.evidenceStatus ?? "no_evidence",
              confidenceScore:      bm.confidenceScore ?? 0,
              linkedHypothesisId:   bm.linkedHypothesisId ?? null,
              contradictionSummary: bm.contradictionSummary ?? null,
              blockNotes:           bm.blockNotes ?? null,
            })
            .onConflictDoNothing();
        }
      }

      let pivotLogged = false;
      if (prevRow && nextVersion > 1) {
        for (const { key, pivotType } of PIVOT_FIELDS) {
          const prevVal = (prevRow as any)[key] ?? null;
          const newVal  = (input as any)[key]  ?? null;
          if (prevVal && newVal && prevVal.trim() !== newVal.trim()) {
            await db.insert(pivotLog).values({
              ventureId:          input.ventureId,
              pivotType,
              previousHypothesis: prevVal,
              newHypothesis:      newVal,
              triggerEvent:       `canvas_update_v${nextVersion}`,
              loggedBy:           input.loggedBy ?? input.createdBy ?? null,
              canvasVersion:      nextVersion,
            });
            pivotLogged = true;
          }
        }
      }

      if (pivotLogged) {
        await db
          .update(ventures)
          .set({ pivotRequired: false, updatedAt: new Date() })
          .where(eq(ventures.id, input.ventureId));
      }

      return newCanvas;
    }),

  // ── Block Metadata ──────────────────────────────────────────────────────────

  blocks: router({
    list: publicProcedure
      .input(z.object({ canvasId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        return db
          .select()
          .from(leanCanvasBlocks)
          .where(eq(leanCanvasBlocks.canvasId, input.canvasId));
      }),

    upsert: publicProcedure
      .input(z.object({
        canvasId:             z.number(),
        ventureId:            z.string(),
        blockType:            z.string(),
        blockStatus:          z.string().optional(),
        evidenceStatus:       z.string().optional(),
        confidenceScore:      z.number().optional(),
        linkedHypothesisId:   z.string().nullable().optional(),
        contradictionSummary: z.string().nullable().optional(),
        blockNotes:           z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const existing = await db
          .select()
          .from(leanCanvasBlocks)
          .where(
            sql`${leanCanvasBlocks.canvasId} = ${input.canvasId} AND ${leanCanvasBlocks.blockType} = ${input.blockType}`,
          )
          .limit(1);

        if (existing.length > 0) {
          const updated = await db
            .update(leanCanvasBlocks)
            .set({
              blockStatus:          input.blockStatus,
              evidenceStatus:       input.evidenceStatus,
              confidenceScore:      input.confidenceScore,
              linkedHypothesisId:   input.linkedHypothesisId,
              contradictionSummary: input.contradictionSummary,
              blockNotes:           input.blockNotes,
              updatedAt:            new Date(),
            })
            .where(eq(leanCanvasBlocks.id, existing[0].id))
            .returning();
          return updated[0];
        }

        const inserted = await db
          .insert(leanCanvasBlocks)
          .values({
            canvasId:             input.canvasId,
            ventureId:            input.ventureId,
            blockType:            input.blockType,
            blockStatus:          input.blockStatus ?? "assumption",
            evidenceStatus:       input.evidenceStatus ?? "no_evidence",
            confidenceScore:      input.confidenceScore ?? 0,
            linkedHypothesisId:   input.linkedHypothesisId ?? null,
            contradictionSummary: input.contradictionSummary ?? null,
            blockNotes:           input.blockNotes ?? null,
          })
          .returning();
        return inserted[0];
      }),
  }),

  // ── Block Evidence Links ────────────────────────────────────────────────────

  blockEvidence: router({
    list: publicProcedure
      .input(z.object({ canvasBlockId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        return db
          .select()
          .from(leanCanvasBlockEvidenceLinks)
          .where(eq(leanCanvasBlockEvidenceLinks.canvasBlockId, input.canvasBlockId));
      }),

    upsert: publicProcedure
      .input(z.object({
        id:                    z.number().optional(),
        canvasBlockId:         z.number(),
        ventureId:             z.string(),
        evidenceSourceType:    z.string(),
        evidenceSourceId:      z.number().nullable().optional(),
        evidenceSourceLabel:   z.string().optional(),
        evidenceRelationship:  z.string().default("supports"),
        evidenceStrengthScore: z.number().default(50),
        notes:                 z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (input.id) {
          const updated = await db
            .update(leanCanvasBlockEvidenceLinks)
            .set({
              evidenceSourceType:    input.evidenceSourceType,
              evidenceSourceId:      input.evidenceSourceId,
              evidenceSourceLabel:   input.evidenceSourceLabel,
              evidenceRelationship:  input.evidenceRelationship,
              evidenceStrengthScore: input.evidenceStrengthScore,
              notes:                 input.notes,
              updatedAt:             new Date(),
            })
            .where(eq(leanCanvasBlockEvidenceLinks.id, input.id))
            .returning();
          return updated[0];
        }
        const ins = await db
          .insert(leanCanvasBlockEvidenceLinks)
          .values({
            canvasBlockId:         input.canvasBlockId,
            ventureId:             input.ventureId,
            evidenceSourceType:    input.evidenceSourceType,
            evidenceSourceId:      input.evidenceSourceId ?? null,
            evidenceSourceLabel:   input.evidenceSourceLabel,
            evidenceRelationship:  input.evidenceRelationship,
            evidenceStrengthScore: input.evidenceStrengthScore,
            notes:                 input.notes,
          })
          .returning();
        return ins[0];
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        await db
          .delete(leanCanvasBlockEvidenceLinks)
          .where(eq(leanCanvasBlockEvidenceLinks.id, input.id));
        return { ok: true };
      }),
  }),
});
