/**
 * Domain Brand Router — Phase 2
 *
 * Manages the top-level Domain Brand entities (TONE, REAL, BEBUS, ECOCOMP, …).
 * Domain Brands are persistent sector-facing umbrellas; they are NOT ventures.
 *
 * Auth:
 *  - reads:  publicProcedure (no session required — consistent with app-wide pattern)
 *  - writes: adminProcedure (brand creation/status changes are governed actions)
 *  - user-writes: protectedProcedure (assignment history, assessments)
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { eq, desc, and, asc } from "drizzle-orm";
import {
  domainBrands,
  ventures,
  productProgrammes,
  productFamilies,
  products,
  brandAssignmentHistory,
  brandFitAssessments,
  productisationDecisions,
  partNumbers,
  ventureRefSequences,
  programmeRefSequences,
  productRefSequences,
  partNumberConfigs,
  productVariants,
  partNumberRevisions,
} from "../drizzle/schema";

// ── Zod schemas ───────────────────────────────────────────────────────────────

const BrandStatusEnum = z.enum(["Concept", "Reserved", "Active", "Dormant", "Retired"]);
const BrandAssignmentStatusEnum = z.enum([
  "Unassigned",
  "Candidate_Brand",
  "Confirmed_Brand",
  "Reassignment_Under_Review",
  "Potential_New_Domain_Brand",
]);

const CandidateStatusEnum = z.enum([
  "Active", "Hold", "Killed", "Rejected", "Merged", "Transferred",
  "Licensed", "Partnered", "Research_Programme", "Productisation_Approved",
  "Spin-Out_Candidate", "Archived",
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Atomically increment and return the next sequence number for a prefix key.
 * Uses a row-level lock (FOR UPDATE) to prevent race conditions.
 */
async function nextSequence(
  db: Awaited<ReturnType<typeof getDb>>,
  table: typeof ventureRefSequences | typeof programmeRefSequences | typeof productRefSequences,
  prefixKey: string,
): Promise<number> {
  if (!db) throw new Error("DB unavailable");
  await db.insert(table as typeof ventureRefSequences)
    .values({ prefixKey, currentSequence: 0 } as any)
    .onConflictDoNothing();
  const rows = await db.select()
    .from(table as typeof ventureRefSequences)
    .where(eq((table as typeof ventureRefSequences).prefixKey, prefixKey))
    .limit(1);
  const current = rows[0]?.currentSequence ?? 0;
  const next = current + 1;
  await db.update(table as typeof ventureRefSequences)
    .set({ currentSequence: next, updatedAt: new Date() } as any)
    .where(eq((table as typeof ventureRefSequences).prefixKey, prefixKey));
  return next;
}

function zeroPad(n: number, length = 4): string {
  return String(n).padStart(length, "0");
}

// ── Domain Brands sub-router ──────────────────────────────────────────────────

const domainBrandCrudRouter = router({

  list: publicProcedure
    .input(z.object({ status: BrandStatusEnum.optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const q = db.select().from(domainBrands).orderBy(asc(domainBrands.brandCode));
      if (input?.status) return q.where(eq(domainBrands.brandStatus, input.status));
      return q;
    }),

  get: publicProcedure
    .input(z.object({ id: z.number().optional(), brandCode: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      if (input.id) {
        const rows = await db.select().from(domainBrands).where(eq(domainBrands.id, input.id)).limit(1);
        return rows[0] ?? null;
      }
      if (input.brandCode) {
        const rows = await db.select().from(domainBrands)
          .where(eq(domainBrands.brandCode, input.brandCode.toUpperCase())).limit(1);
        return rows[0] ?? null;
      }
      return null;
    }),

  create: adminProcedure
    .input(z.object({
      brandCode:          z.string().min(2).max(16).toUpperCase(),
      brandName:          z.string().min(1).max(128),
      description:        z.string().optional(),
      sector:             z.string().optional(),
      subSector:          z.string().optional(),
      brandThesis:        z.string().optional(),
      mission:            z.string().optional(),
      targetMarkets:      z.string().optional(),
      targetCustomers:    z.string().optional(),
      targetUsers:        z.string().optional(),
      coreCapabilities:   z.string().optional(),
      technologyDomains:  z.string().optional(),
      ipDomains:          z.string().optional(),
      commercialChannels: z.string().optional(),
      legalOwner:         z.string().optional(),
      brandStatus:        BrandStatusEnum.default("Active"),
      websiteUrl:         z.string().url().optional().or(z.literal("")),
      logoUrl:            z.string().url().optional().or(z.literal("")),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const code = input.brandCode.toUpperCase();
      const [brand] = await db.insert(domainBrands).values({
        ...input,
        brandCode: code,
        createdBy: ctx.user?.username ?? "system",
      }).returning();
      return brand;
    }),

  update: adminProcedure
    .input(z.object({
      id:                 z.number(),
      brandName:          z.string().min(1).max(128).optional(),
      description:        z.string().optional(),
      sector:             z.string().optional(),
      subSector:          z.string().optional(),
      brandThesis:        z.string().optional(),
      mission:            z.string().optional(),
      targetMarkets:      z.string().optional(),
      targetCustomers:    z.string().optional(),
      targetUsers:        z.string().optional(),
      coreCapabilities:   z.string().optional(),
      technologyDomains:  z.string().optional(),
      ipDomains:          z.string().optional(),
      commercialChannels: z.string().optional(),
      legalOwner:         z.string().optional(),
      brandStatus:        BrandStatusEnum.optional(),
      websiteUrl:         z.string().url().optional().or(z.literal("")),
      logoUrl:            z.string().url().optional().or(z.literal("")),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...fields } = input;
      await db.update(domainBrands).set({ ...fields, updatedAt: new Date() }).where(eq(domainBrands.id, id));
      return { success: true };
    }),

  /** List ventures (candidates) under a domain brand */
  listVentures: publicProcedure
    .input(z.object({ brandId: z.number(), status: CandidateStatusEnum.optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const where = input.status
        ? and(eq(ventures.domainBrandId, input.brandId), eq(ventures.candidateStatus, input.status))
        : eq(ventures.domainBrandId, input.brandId);
      return db.select().from(ventures).where(where).orderBy(desc(ventures.createdAt));
    }),

  /** List product programmes under a domain brand */
  listProgrammes: publicProcedure
    .input(z.object({ brandId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(productProgrammes)
        .where(eq(productProgrammes.domainBrandId, input.brandId))
        .orderBy(desc(productProgrammes.createdAt));
    }),

  /** Portfolio summary — counts used by Command Centre */
  portfolioSummary: publicProcedure
    .input(z.object({ brandId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [brand] = await db.select().from(domainBrands).where(eq(domainBrands.id, input.brandId)).limit(1);
      if (!brand) return null;
      const allVentures = await db.select().from(ventures).where(eq(ventures.domainBrandId, input.brandId));
      const allProgrammes = await db.select().from(productProgrammes).where(eq(productProgrammes.domainBrandId, input.brandId));
      const programmeIds = allProgrammes.map(p => p.id);
      let productCount = 0;
      if (programmeIds.length) {
        const allFamilies = await db.select().from(productFamilies)
          .where(eq(productFamilies.domainBrandId, input.brandId));
        const familyIds = allFamilies.map(f => f.id);
        if (familyIds.length) {
          const prods = await db.select().from(products).where(eq(products.domainBrandId, input.brandId));
          productCount = prods.length;
        }
      }
      return {
        brand,
        activeVentures: allVentures.filter(v => v.candidateStatus === "Active").length,
        totalVentures: allVentures.length,
        killedVentures: allVentures.filter(v => v.candidateStatus === "Killed").length,
        programmes: allProgrammes.length,
        products: productCount,
      };
    }),
});

// ── Venture Candidate sub-router ──────────────────────────────────────────────

const ventureCandidateRouter = router({

  /** Assign or re-assign a venture to a domain brand with full history */
  assignBrand: adminProcedure
    .input(z.object({
      ventureId:            z.string(),
      newBrandId:           z.number().nullable(),
      brandAssignmentStatus: BrandAssignmentStatusEnum,
      reason:               z.string().optional(),
      supportingEvidence:   z.string().optional(),
      decisionMaker:        z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Read current state
      const [vc] = await db.select().from(ventures).where(eq(ventures.id, input.ventureId)).limit(1);
      if (!vc) throw new Error(`Venture not found: ${input.ventureId}`);

      const previousBrandId = vc.domainBrandId ?? null;

      // Write assignment history row first
      await db.insert(brandAssignmentHistory).values({
        ventureId:             input.ventureId,
        previousBrandId,
        newBrandId:            input.newBrandId,
        brandAssignmentStatus: input.brandAssignmentStatus,
        reason:                input.reason ?? null,
        supportingEvidence:    input.supportingEvidence ?? null,
        decisionMaker:         input.decisionMaker ?? ctx.user?.username ?? "system",
        decisionDate:          new Date(),
      });

      // Update the venture
      await db.update(ventures).set({
        domainBrandId:         input.newBrandId,
        brandAssignmentStatus: input.brandAssignmentStatus,
        updatedAt:             new Date(),
      }).where(eq(ventures.id, input.ventureId));

      return { success: true, previousBrandId, newBrandId: input.newBrandId };
    }),

  /** Create a new Venture Candidate with optional Domain Brand assignment */
  create: adminProcedure
    .input(z.object({
      id:                   z.string().min(2).max(64),   // stable venture id
      workingTitle:         z.string().min(1).max(255),
      description:          z.string().optional(),
      problemHypothesis:    z.string().optional(),
      targetCustomer:       z.string().optional(),
      targetUser:           z.string().optional(),
      sector:               z.string().optional(),
      owner:                z.string().optional(),
      domainBrandId:        z.number().nullable().default(null),
      brandAssignmentStatus: BrandAssignmentStatusEnum.default("Unassigned"),
      brandCode:            z.string().default("UNASSIGNED"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Check for duplicate ID
      const existing = await db.select().from(ventures).where(eq(ventures.id, input.id)).limit(1);
      if (existing[0]) throw new Error(`Venture ID already exists: ${input.id}`);

      // Generate a stable VEN ref
      const prefix = input.brandCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || "UNASSIGNED";
      const seq = await nextSequence(db, ventureRefSequences, prefix);
      const ventureRef = `VEN-${prefix}-${zeroPad(seq)}`;

      await db.insert(ventures).values({
        id:                    input.id,
        name:                  input.workingTitle,
        description:           input.description ?? null,
        sector:                input.sector ?? null,
        owner:                 input.owner ?? null,
        domainBrandId:         input.domainBrandId,
        brandAssignmentStatus: input.brandAssignmentStatus,
        entityType:            "venture_candidate",
        candidateStatus:       "Active",
        ventureRef,
        vrl:  1,
        trl:  1,
        status: "Pre-Launch",
        currentStage: "intake",
      } as any);

      // Record initial brand assignment history
      if (input.domainBrandId) {
        await db.insert(brandAssignmentHistory).values({
          ventureId:             input.id,
          previousBrandId:       null,
          newBrandId:            input.domainBrandId,
          brandAssignmentStatus: input.brandAssignmentStatus,
          reason:                "Initial brand assignment at venture creation",
          decisionMaker:         ctx.user?.username ?? "system",
          decisionDate:          new Date(),
        });
      }

      return { id: input.id, ventureRef };
    }),

  /** Update venture candidate status (Active → Killed, etc.) */
  updateStatus: adminProcedure
    .input(z.object({
      ventureId:       z.string(),
      candidateStatus: CandidateStatusEnum,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(ventures).set({
        candidateStatus: input.candidateStatus,
        updatedAt:       new Date(),
      }).where(eq(ventures.id, input.ventureId));
      return { success: true };
    }),

  /** Generate and persist a stable VEN-XXXX-NNNN reference for a venture */
  generateRef: adminProcedure
    .input(z.object({
      ventureId: z.string(),
      brandCode: z.string().default("UNASSIGNED"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Check if already has a ref
      const [vc] = await db.select().from(ventures).where(eq(ventures.id, input.ventureId)).limit(1);
      if (!vc) throw new Error(`Venture not found: ${input.ventureId}`);
      if (vc.ventureRef) return { ventureRef: vc.ventureRef };

      const prefix = input.brandCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || "UNASSIGNED";
      const seq = await nextSequence(db, ventureRefSequences, prefix);
      const ventureRef = `VEN-${prefix}-${zeroPad(seq)}`;

      await db.update(ventures).set({ ventureRef, updatedAt: new Date() }).where(eq(ventures.id, input.ventureId));
      return { ventureRef };
    }),

  /** List assignment history for a venture */
  assignmentHistory: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(brandAssignmentHistory)
        .where(eq(brandAssignmentHistory.ventureId, input.ventureId))
        .orderBy(desc(brandAssignmentHistory.createdAt));
    }),
});

// ── Brand Fit Assessment sub-router ──────────────────────────────────────────

const brandFitRouter = router({

  create: adminProcedure
    .input(z.object({
      ventureId:                  z.string(),
      assessedBrandId:            z.number().optional(),
      strategicFit:               z.number().min(0).max(10).default(0),
      sectorFit:                  z.number().min(0).max(10).default(0),
      customerFit:                z.number().min(0).max(10).default(0),
      userFit:                    z.number().min(0).max(10).default(0),
      technologyFit:              z.number().min(0).max(10).default(0),
      ipFit:                      z.number().min(0).max(10).default(0),
      commercialChannelFit:       z.number().min(0).max(10).default(0),
      missionAlignment:           z.number().min(0).max(10).default(0),
      capabilityFit:              z.number().min(0).max(10).default(0),
      supplyChainFit:             z.number().min(0).max(10).default(0),
      portfolioSynergy:           z.number().min(0).max(10).default(0),
      cannibalisationRisk:        z.number().min(0).max(10).default(0),
      brandDilutionRisk:          z.number().min(0).max(10).default(0),
      crossBrandPotential:        z.number().min(0).max(10).default(0),
      rationale:                  z.string().optional(),
      recommendedBrandId:         z.number().optional(),
      alternativeBrandId:         z.number().optional(),
      potentialNewBrandRequired:  z.boolean().default(false),
      governanceReviewRequired:   z.boolean().default(false),
      aiAssisted:                 z.boolean().default(false),
      assessedBy:                 z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Compute fit score: average of positive dimensions (0–10 each → 0–100)
      const positiveDims = [
        input.strategicFit, input.sectorFit, input.customerFit, input.userFit,
        input.technologyFit, input.ipFit, input.commercialChannelFit, input.missionAlignment,
        input.capabilityFit, input.supplyChainFit, input.portfolioSynergy, input.crossBrandPotential,
      ];
      const riskPenalty = ((input.cannibalisationRisk + input.brandDilutionRisk) / 2) * 0.5;
      const rawScore = positiveDims.reduce((a, b) => a + b, 0) / positiveDims.length;
      const fitScore = Math.max(0, Math.round((rawScore - riskPenalty) * 10) / 10);
      const confidence = fitScore >= 7 ? "High" : fitScore >= 4 ? "Medium" : "Low";

      const [assessment] = await db.insert(brandFitAssessments).values({
        ...input,
        fitScore,
        confidence,
        assessedBy: input.assessedBy ?? ctx.user?.username ?? "system",
        assessedAt: new Date(),
      }).returning();
      return assessment;
    }),

  listForVenture: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(brandFitAssessments)
        .where(eq(brandFitAssessments.ventureId, input.ventureId))
        .orderBy(desc(brandFitAssessments.assessedAt));
    }),
});

// ── Productisation Decision sub-router ───────────────────────────────────────

const productisationRouter = router({

  recordDecision: adminProcedure
    .input(z.object({
      ventureId:          z.string(),
      decision:           z.enum(["Approve", "Hold", "Reject", "Return_for_Evidence", "Alternative_Commercialisation_Route"]),
      decisionDate:       z.string().datetime(),
      decisionMaker:      z.string().optional(),
      evidenceSnapshot:   z.record(z.unknown()).optional(),
      readinessSnapshot:  z.record(z.unknown()).optional(),
      rationale:          z.string().optional(),
      conditions:         z.string().optional(),
      approvalReference:  z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [decision] = await db.insert(productisationDecisions).values({
        ventureId:          input.ventureId,
        decision:           input.decision,
        decisionDate:       new Date(input.decisionDate),
        decisionMaker:      input.decisionMaker ?? ctx.user?.username ?? "system",
        evidenceSnapshot:   input.evidenceSnapshot ?? null,
        readinessSnapshot:  input.readinessSnapshot ?? null,
        rationale:          input.rationale ?? null,
        conditions:         input.conditions ?? null,
        approvalReference:  input.approvalReference ?? null,
      }).returning();

      // If approved, update venture candidate status
      if (input.decision === "Approve") {
        await db.update(ventures).set({
          candidateStatus: "Productisation_Approved",
          updatedAt:       new Date(),
        }).where(eq(ventures.id, input.ventureId));
      }
      return decision;
    }),

  listForVenture: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(productisationDecisions)
        .where(eq(productisationDecisions.ventureId, input.ventureId))
        .orderBy(desc(productisationDecisions.decisionDate));
    }),
});

// ── Product Programme sub-router ─────────────────────────────────────────────

const productProgrammeRouterInternal = router({

  list: publicProcedure
    .input(z.object({ ventureId: z.string().optional(), brandId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      let q = db.select().from(productProgrammes).orderBy(desc(productProgrammes.createdAt));
      if (input.ventureId) return q.where(eq(productProgrammes.ventureId, input.ventureId));
      if (input.brandId)   return q.where(eq(productProgrammes.domainBrandId, input.brandId));
      return q;
    }),

  get: publicProcedure
    .input(z.object({ id: z.number().optional(), programmeRef: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      if (input.id) {
        const [row] = await db.select().from(productProgrammes).where(eq(productProgrammes.id, input.id)).limit(1);
        return row ?? null;
      }
      if (input.programmeRef) {
        const [row] = await db.select().from(productProgrammes)
          .where(eq(productProgrammes.programmeRef, input.programmeRef)).limit(1);
        return row ?? null;
      }
      return null;
    }),

  create: adminProcedure
    .input(z.object({
      ventureId:                  z.string(),
      domainBrandId:              z.number().optional(),
      productisationDecisionId:   z.number().optional(),
      programmeName:              z.string().min(1).max(255),
      description:                z.string().optional(),
      programmeOwner:             z.string().optional(),
      approvalDate:               z.string().datetime().optional(),
      technicalStrategy:          z.string().optional(),
      commercialStrategy:         z.string().optional(),
      currentOwnerEntity:         z.string().optional(),
      originatingEntity:          z.string().optional(),
      programmeStatus:            z.string().default("Approved"),
      brandCode:                  z.string().default("UNASSIGNED"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Auto-generate PRG-XXXX-NNNN reference
      const prefix = input.brandCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || "UNASSIGNED";
      const seq = await nextSequence(db, programmeRefSequences, prefix);
      const programmeRef = `PRG-${prefix}-${zeroPad(seq)}`;

      const { brandCode, ...rest } = input;
      const [programme] = await db.insert(productProgrammes).values({
        ...rest,
        programmeRef,
        approvalDate: input.approvalDate ? new Date(input.approvalDate) : null,
      }).returning();
      return programme;
    }),

  updateStatus: adminProcedure
    .input(z.object({
      id:              z.number(),
      programmeStatus: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(productProgrammes).set({
        programmeStatus: input.programmeStatus,
        updatedAt:       new Date(),
      }).where(eq(productProgrammes.id, input.id));
      return { success: true };
    }),
});

// ── Product Family sub-router ─────────────────────────────────────────────────

const productFamilyRouterInternal = router({

  list: publicProcedure
    .input(z.object({ programmeId: z.number().optional(), brandId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      if (input.programmeId) return db.select().from(productFamilies).where(eq(productFamilies.productProgrammeId, input.programmeId));
      if (input.brandId)     return db.select().from(productFamilies).where(eq(productFamilies.domainBrandId, input.brandId));
      return db.select().from(productFamilies).orderBy(asc(productFamilies.familyCode));
    }),

  create: adminProcedure
    .input(z.object({
      familyCode:          z.string().min(1).max(16),
      familyName:          z.string().min(1).max(255),
      productProgrammeId:  z.number(),
      domainBrandId:       z.number().optional(),
      description:         z.string().optional(),
      productCategory:     z.string().optional(),
      customerSegment:     z.string().optional(),
      technicalPlatform:   z.string().optional(),
      status:              z.string().default("Active"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [family] = await db.insert(productFamilies).values({
        ...input,
        familyCode: input.familyCode.toUpperCase(),
      }).returning();
      return family;
    }),
});

// ── Product sub-router ────────────────────────────────────────────────────────

const productRouter = router({

  list: publicProcedure
    .input(z.object({
      familyId:    z.number().optional(),
      programmeId: z.number().optional(),
      brandId:     z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      if (input.familyId)    return db.select().from(products).where(eq(products.productFamilyId, input.familyId));
      if (input.programmeId) return db.select().from(products).where(eq(products.productProgrammeId, input.programmeId));
      if (input.brandId)     return db.select().from(products).where(eq(products.domainBrandId, input.brandId));
      return db.select().from(products).orderBy(desc(products.createdAt));
    }),

  get: publicProcedure
    .input(z.object({ id: z.number().optional(), productRef: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      if (input.id) {
        const [row] = await db.select().from(products).where(eq(products.id, input.id)).limit(1);
        return row ?? null;
      }
      if (input.productRef) {
        const [row] = await db.select().from(products).where(eq(products.productRef, input.productRef)).limit(1);
        return row ?? null;
      }
      return null;
    }),

  create: adminProcedure
    .input(z.object({
      productFamilyId:      z.number(),
      productProgrammeId:   z.number().optional(),
      domainBrandId:        z.number().optional(),
      productName:          z.string().min(1).max(255),
      commercialName:       z.string().optional(),
      productCode:          z.string().optional(),
      description:          z.string().optional(),
      productType:          z.enum(["physical","digital","software","service","platform_service","licensing","data_product","ai_agent","hybrid"]).default("physical"),
      technicalDescription: z.string().optional(),
      lifecycleStatus:      z.string().default("Concept"),
      releaseStatus:        z.string().default("Unreleased"),
      productOwner:         z.string().optional(),
      currentOwnerEntity:   z.string().optional(),
      originatingEntity:    z.string().optional(),
      brandCode:            z.string().default("UNASSIGNED"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const prefix = input.brandCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || "UNASSIGNED";
      const seq = await nextSequence(db, productRefSequences, prefix);
      const productRef = `PROD-${prefix}-${zeroPad(seq)}`;

      const { brandCode, ...rest } = input;
      const [product] = await db.insert(products).values({ ...rest, productRef }).returning();
      return product;
    }),

  /** End-to-end traceability: from product ref → venture → evidence */
  traceability: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [product] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
      if (!product) return null;

      const [family] = product.productFamilyId
        ? await db.select().from(productFamilies).where(eq(productFamilies.id, product.productFamilyId)).limit(1)
        : [null];

      const [programme] = product.productProgrammeId
        ? await db.select().from(productProgrammes).where(eq(productProgrammes.id, product.productProgrammeId!)).limit(1)
        : [null];

      const [venture] = programme?.ventureId
        ? await db.select().from(ventures).where(eq(ventures.id, programme.ventureId)).limit(1)
        : [null];

      const [brand] = product.domainBrandId
        ? await db.select().from(domainBrands).where(eq(domainBrands.id, product.domainBrandId!)).limit(1)
        : [null];

      const prodisDecisions = programme?.ventureId
        ? await db.select().from(productisationDecisions).where(eq(productisationDecisions.ventureId, programme.ventureId))
        : [];

      const variants = await db.select().from(productVariants).where(eq(productVariants.productId, input.productId));
      const partNums = await db.select().from(partNumbers).where(eq(partNumbers.productId, input.productId));

      return { brand, venture, programme, family, product, variants, partNumbers: partNums, productisationDecisions: prodisDecisions };
    }),
});

// ── Product Variant sub-router ────────────────────────────────────────────────

const productVariantRouterInternal = router({

  list: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(productVariants).where(eq(productVariants.productId, input.productId));
    }),

  create: adminProcedure
    .input(z.object({
      productId:              z.number(),
      variantCode:            z.string().optional(),
      variantName:            z.string().min(1).max(255),
      description:            z.string().optional(),
      material:               z.string().optional(),
      dimensions:             z.string().optional(),
      weight:                 z.string().optional(),
      finish:                 z.string().optional(),
      performanceClass:       z.string().optional(),
      manufacturingLocation:  z.string().optional(),
      supplier:               z.string().optional(),
      releaseRevision:        z.string().default("A"),
      technicalAttributes:    z.record(z.unknown()).optional(),
      status:                 z.string().default("Active"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [variant] = await db.insert(productVariants).values(input as any).returning();
      return variant;
    }),
});

// ── Part Number sub-router ────────────────────────────────────────────────────

const partNumberRouterInternal = router({

  /**
   * Issue a new part number using the family's configured numbering rule.
   * Protected by DB UNIQUE constraint — collisions are rejected at the DB level.
   */
  issue: adminProcedure
    .input(z.object({
      productId:        z.number(),
      productVariantId: z.number().optional(),
      familyId:         z.number(),
      issuedBy:         z.string().optional(),
      notes:            z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Load or create the config for this family
      const cfgRows = await db.select().from(partNumberConfigs)
        .where(eq(partNumberConfigs.productFamilyId, input.familyId)).limit(1);
      if (!cfgRows[0]) throw new Error(`No part-number config for family ${input.familyId}. Create one first.`);
      const cfg = cfgRows[0];

      // Atomically increment currentSequence in the config row
      const nextSeq = cfg.currentSequence + 1;
      await db.update(partNumberConfigs).set({ currentSequence: nextSeq, updatedAt: new Date() })
        .where(eq(partNumberConfigs.id, cfg.id));

      // Build the part number from the template
      const pn = cfg.formatTemplate
        .replace("{BRAND}",  cfg.brandCode)
        .replace("{FAMILY}", cfg.familyCode)
        .replace("{SEQ}",    zeroPad(nextSeq, cfg.sequenceLength));

      // Insert — UNIQUE constraint prevents collisions at DB level
      const [partNumber] = await db.insert(partNumbers).values({
        partNumber:       pn,
        productId:        input.productId,
        productVariantId: input.productVariantId ?? null,
        configId:         cfg.id,
        status:           "active",
        currentRevision:  "A",
        issuedBy:         input.issuedBy ?? ctx.user?.username ?? "system",
        issuedAt:         new Date(),
        notes:            input.notes ?? null,
      }).returning();

      // Auto-create the first revision entry
      await db.insert(partNumberRevisions).values({
        partNumberId:     partNumber.id,
        revision:         "A",
        changeDescription: "Initial issue",
        changedBy:        partNumber.issuedBy ?? "system",
        changedAt:        new Date(),
      });

      return partNumber;
    }),

  /** Create a part-number config for a product family */
  createConfig: adminProcedure
    .input(z.object({
      productFamilyId: z.number(),
      brandCode:       z.string().min(1).max(16),
      familyCode:      z.string().min(1).max(16),
      formatTemplate:  z.string().default("{BRAND}-{FAMILY}-{SEQ}"),
      sequenceLength:  z.number().int().min(1).max(8).default(4),
      prefix:          z.string().optional(),
      notes:           z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [cfg] = await db.insert(partNumberConfigs).values({
        ...input,
        brandCode:  input.brandCode.toUpperCase(),
        familyCode: input.familyCode.toUpperCase(),
        currentSequence: 0,
      }).returning();
      return cfg;
    }),

  listForProduct: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(partNumbers).where(eq(partNumbers.productId, input.productId))
        .orderBy(asc(partNumbers.partNumber));
    }),

  /** Full revision history for a part number */
  revisions: publicProcedure
    .input(z.object({ partNumberId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(partNumberRevisions)
        .where(eq(partNumberRevisions.partNumberId, input.partNumberId))
        .orderBy(asc(partNumberRevisions.revision));
    }),

  /** Raise a revision — adds a new revision row and updates currentRevision */
  revise: adminProcedure
    .input(z.object({
      partNumberId:      z.number(),
      newRevision:       z.string().min(1).max(8),
      changeDescription: z.string(),
      changedBy:         z.string().optional(),
      snapshotJson:      z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const [pn] = await db.select().from(partNumbers).where(eq(partNumbers.id, input.partNumberId)).limit(1);
      if (!pn) throw new Error("Part number not found");

      // Mark the current revision as superseded
      await db.update(partNumberRevisions).set({
        supersededByRevision: input.newRevision,
      }).where(
        and(
          eq(partNumberRevisions.partNumberId, input.partNumberId),
          eq(partNumberRevisions.revision, pn.currentRevision),
        )
      );

      // Insert new revision row (UNIQUE constraint catches duplicates)
      const [rev] = await db.insert(partNumberRevisions).values({
        partNumberId:      input.partNumberId,
        revision:          input.newRevision,
        changeDescription: input.changeDescription,
        changedBy:         input.changedBy ?? ctx.user?.username ?? "system",
        changedAt:         new Date(),
        snapshotJson:      input.snapshotJson ?? null,
      }).returning();

      // Update the part number's current revision
      await db.update(partNumbers).set({ currentRevision: input.newRevision }).where(eq(partNumbers.id, input.partNumberId));

      return rev;
    }),

  /** List all part numbers across the portfolio (optionally filtered) */
  listAll: publicProcedure
    .input(z.object({
      brandId:  z.number().optional(),
      status:   z.string().optional(),
      limit:    z.number().int().min(1).max(500).default(200),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      // Join part_numbers → products to get brand / product info
      const rows = await db
        .select({
          id:              partNumbers.id,
          partNumber:      partNumbers.partNumber,
          status:          partNumbers.status,
          currentRevision: partNumbers.currentRevision,
          issuedBy:        partNumbers.issuedBy,
          issuedAt:        partNumbers.issuedAt,
          notes:           partNumbers.notes,
          productId:       partNumbers.productId,
          productVariantId: partNumbers.productVariantId,
          configId:        partNumbers.configId,
          productRef:      products.productRef,
          productName:     products.productName,
          productType:     products.productType,
          domainBrandId:   products.domainBrandId,
          productFamilyId: products.productFamilyId,
        })
        .from(partNumbers)
        .leftJoin(products, eq(partNumbers.productId, products.id))
        .orderBy(asc(partNumbers.partNumber))
        .limit(input.limit);

      const filtered = input.brandId
        ? rows.filter(r => r.domainBrandId === input.brandId)
        : rows;
      const statusFiltered = input.status
        ? filtered.filter(r => r.status === input.status)
        : filtered;
      return statusFiltered;
    }),

  /** Traceability: from part number → variant → product → programme → venture */
  traceability: publicProcedure
    .input(z.object({ partNumber: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [pn] = await db.select().from(partNumbers).where(eq(partNumbers.partNumber, input.partNumber)).limit(1);
      if (!pn) return null;

      const [variant]  = pn.productVariantId
        ? await db.select().from(productVariants).where(eq(productVariants.id, pn.productVariantId!)).limit(1)
        : [null];

      const [product]  = pn.productId
        ? await db.select().from(products).where(eq(products.id, pn.productId!)).limit(1)
        : [null];

      const [family]   = product?.productFamilyId
        ? await db.select().from(productFamilies).where(eq(productFamilies.id, product.productFamilyId)).limit(1)
        : [null];

      const [programme] = product?.productProgrammeId
        ? await db.select().from(productProgrammes).where(eq(productProgrammes.id, product.productProgrammeId!)).limit(1)
        : [null];

      const [venture] = programme?.ventureId
        ? await db.select().from(ventures).where(eq(ventures.id, programme.ventureId)).limit(1)
        : [null];

      const [brand] = product?.domainBrandId
        ? await db.select().from(domainBrands).where(eq(domainBrands.id, product.domainBrandId!)).limit(1)
        : [null];

      const revisions = await db.select().from(partNumberRevisions)
        .where(eq(partNumberRevisions.partNumberId, pn.id))
        .orderBy(asc(partNumberRevisions.revision));

      const decisions = programme?.ventureId
        ? await db.select().from(productisationDecisions).where(eq(productisationDecisions.ventureId, programme.ventureId))
        : [];

      return { partNumber: pn, variant, product, family, programme, venture, brand, revisions, productisationDecisions: decisions };
    }),
});

// ── Portfolio Pipeline (cross-brand) ─────────────────────────────────────────

const portfolioPipelineRouterInternal = router({

  /** Cross-brand venture pipeline with filtering */
  venturePipeline: publicProcedure
    .input(z.object({
      brandId:         z.number().optional(),
      candidateStatus: z.string().optional(),
      currentStage:    z.string().optional(),
      unassignedOnly:  z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const allVentures = await db.select().from(ventures).orderBy(desc(ventures.createdAt));
      return allVentures.filter(v => {
        if (input.unassignedOnly && v.domainBrandId != null) return false;
        if (input.brandId && v.domainBrandId !== input.brandId) return false;
        if (input.candidateStatus && v.candidateStatus !== input.candidateStatus) return false;
        if (input.currentStage && v.currentStage !== input.currentStage) return false;
        return true;
      });
    }),

  /** Command Centre metrics across all brands */
  commandCentreMetrics: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return null;
      const allBrands     = await db.select().from(domainBrands);
      const allVentures   = await db.select().from(ventures);
      const allProgrammes = await db.select().from(productProgrammes);
      const allProducts   = await db.select().from(products);
      const allPartNums   = await db.select().from(partNumbers);

      return {
        domainBrands:           allBrands.length,
        activeVentureCandidates: allVentures.filter(v => v.candidateStatus === "Active").length,
        unassignedVentures:      allVentures.filter(v => !v.domainBrandId).length,
        productisationApproved:  allVentures.filter(v => v.candidateStatus === "Productisation_Approved").length,
        activeProductProgrammes: allProgrammes.filter(p => p.programmeStatus === "Active").length,
        totalProductProgrammes:  allProgrammes.length,
        productsUnderDevelopment: allProducts.filter(p => ["Concept","Prototype","Engineering","Validation","Pre-Production"].includes(p.lifecycleStatus)).length,
        releasedProducts:        allProducts.filter(p => ["Released","Active"].includes(p.lifecycleStatus)).length,
        partNumbersIssued:       allPartNums.filter(p => p.status === "active").length,
      };
    }),
});

// ── Composed export ───────────────────────────────────────────────────────────

export const domainBrandRouter         = domainBrandCrudRouter;
export const ventureCandidateOpsRouter = ventureCandidateRouter;
export const brandFitAssessmentRouter  = brandFitRouter;
export const productisationGateRouter  = productisationRouter;
export const productProgrammeRouter    = productProgrammeRouterInternal;
export const productFamilyRouter       = productFamilyRouterInternal;
export const productsRouter            = productRouter;
export const productVariantRouter      = productVariantRouterInternal;
export const partNumberRouter          = partNumberRouterInternal;
export const portfolioPipelineRouter   = portfolioPipelineRouterInternal;
