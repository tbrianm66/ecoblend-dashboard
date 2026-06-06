import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  purposeCharters,
  missionLocks,
  governanceStructures,
  governanceDirectors,
  boardPledges,
  reservedMatters,
  investorAlignment,
  capitalDecisionLog,
  governanceReviewCycles,
  purposeMetrics,
  purposeDriftDetections,
  correctiveGovernanceActions,
  governanceDocuments,
  governanceMaturityScores,
} from "../drizzle/schema";
import { computeGovernanceMaturityScore } from "./governanceMaturityService";

// ── Investor risk assessment engine ──────────────────────────────────────────
function assessInvestorRisk(input: {
  missionAlignmentScore?: number | null;
  boardSeatRequested: boolean;
  controlRightsRequested?: string | null;
  exitExpectation?: string | null;
  liquidationPreference?: string | null;
  timeHorizon?: string | null;
}) {
  const risks: string[] = [];
  const actions: string[] = [];
  let pressureLevel: "green" | "amber" | "red" = "green";
  let driftRisk: "low" | "medium" | "high" | "critical" = "low";

  const score = input.missionAlignmentScore ?? 100;
  const rights = input.controlRightsRequested ? JSON.parse(input.controlRightsRequested) as string[] : [];

  if (score < 50) { risks.push("Low mission alignment score"); pressureLevel = "red"; driftRisk = "high"; }
  else if (score < 70) { risks.push("Below-average mission alignment"); pressureLevel = "amber"; driftRisk = "medium"; }

  if (input.boardSeatRequested) {
    risks.push("Board seat requested — governance control risk");
    actions.push("Define mission covenant obligations for board seat holder");
    if (pressureLevel !== "red") pressureLevel = "amber";
  }

  const exitHorizon = parseInt(input.timeHorizon ?? "10");
  if (exitHorizon <= 3) {
    risks.push(`Short exit horizon (${input.timeHorizon}) creates extraction pressure`);
    actions.push("Remove forced-sale right");
    pressureLevel = "red"; driftRisk = "high";
  }

  if (input.exitExpectation === "trade_sale" || (input.exitExpectation ?? "").includes("trade")) {
    risks.push("Trade sale exit expectation conflicts with long-term purpose protection");
    actions.push("Negotiate mission-aligned exit clause");
    pressureLevel = "red";
  }

  const ipRisk = rights.some(r => r.toLowerCase().includes("ip") || r.toLowerCase().includes("licens"));
  if (ipRisk) {
    risks.push("Investor requests IP licensing veto — breaches reserved matters");
    actions.push("Remove investor IP licensing veto");
    pressureLevel = "red"; driftRisk = "critical";
  }

  const budgetVeto = rights.some(r => r.toLowerCase().includes("budget") || r.toLowerCase().includes("veto"));
  if (budgetVeto) {
    risks.push("Budget veto right creates operational control risk");
    actions.push("Replace budget veto with quarterly reporting covenant");
  }

  const forcedSale = rights.some(r => r.toLowerCase().includes("force") || r.toLowerCase().includes("sale"));
  if (forcedSale) {
    risks.push("Forced-sale right overrides founder's long-term purpose protection");
    actions.push("Remove forced-sale right");
    pressureLevel = "red"; driftRisk = "critical";
  }

  const liqPref = input.liquidationPreference ?? "";
  if (liqPref.includes("2x") || liqPref.includes("participating")) {
    risks.push("2x participating liquidation preference creates capital extraction pressure");
    actions.push("Reduce liquidation preference to 1x non-participating");
  }

  actions.push("Add mission covenant to investment agreement");
  actions.push("Require investor acceptance of reserved matters schedule");
  actions.push("Complete mission lock before accepting capital");

  const recommended: "approve" | "reject" | "renegotiate" | "pending" =
    pressureLevel === "red" && driftRisk === "critical" ? "reject" :
    pressureLevel === "red" ? "renegotiate" :
    pressureLevel === "amber" ? "renegotiate" : "approve";

  return {
    capitalPressureIndicator: pressureLevel,
    missionDriftRisk: driftRisk,
    recommendedDecision: recommended,
    requiredActions: actions,
    riskFlags: risks,
    controlRiskRating: driftRisk === "critical" ? "critical" : driftRisk === "high" ? "high" :
      pressureLevel === "amber" ? "medium" : "low" as "low" | "medium" | "high" | "critical",
  };
}

// ── Router ────────────────────────────────────────────────────────────────────
export const purposeGovernanceRouter = router({

  // ── Purpose Charter ─────────────────────────────────────────────────────
  purposeCharter: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        return db!.select().from(purposeCharters)
          .where(eq(purposeCharters.ventureId, input.ventureId))
          .orderBy(desc(purposeCharters.versionNumber));
      }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        const rows = await db!.select().from(purposeCharters).where(eq(purposeCharters.id, input.id));
        if (!rows.length) throw new TRPCError({ code: "NOT_FOUND" });
        return rows[0];
      }),

    create: protectedProcedure
      .input(z.object({
        ventureId:                 z.string(),
        protectedPurposeStatement: z.string().min(20),
        founderIntentStatement:    z.string().optional(),
        beneficialPurpose:         z.string().optional(),
        stakeholderCommitments:    z.array(z.string()).optional(),
        nonNegotiablePrinciples:   z.array(z.string()).optional(),
        approvalStatus:            z.enum(["draft","under_review","approved"]).default("draft"),
        reviewDueDate:             z.string().optional(),
        createdBy:                 z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        // Get next version number
        const existing = await db!.select({ v: purposeCharters.versionNumber })
          .from(purposeCharters).where(eq(purposeCharters.ventureId, input.ventureId))
          .orderBy(desc(purposeCharters.versionNumber)).limit(1);
        const nextVersion = existing.length ? (existing[0].v + 1) : 1;

        const [row] = await db!.insert(purposeCharters).values({
          ...input,
          stakeholderCommitments:  input.stakeholderCommitments ? JSON.stringify(input.stakeholderCommitments) : null,
          nonNegotiablePrinciples: input.nonNegotiablePrinciples ? JSON.stringify(input.nonNegotiablePrinciples) : null,
          versionNumber: nextVersion,
        }).returning();
        return row;
      }),

    approve: protectedProcedure
      .input(z.object({ id: z.number(), approvedBy: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const [row] = await db!.update(purposeCharters)
          .set({ approvalStatus: "approved", approvedBy: input.approvedBy, approvedAt: new Date(), updatedAt: new Date() })
          .where(eq(purposeCharters.id, input.id)).returning();
        return row;
      }),
  }),

  // ── Mission Lock ─────────────────────────────────────────────────────────
  missionLock: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        return db!.select().from(missionLocks).where(eq(missionLocks.ventureId, input.ventureId));
      }),

    upsert: protectedProcedure
      .input(z.object({
        id:                   z.number().optional(),
        ventureId:            z.string(),
        lockType:             z.string(),
        lockDescription:      z.string(),
        legalStatus:          z.enum(["proposed","in_progress","legally_binding","lapsed"]).optional(),
        implementationStatus: z.enum(["not_started","in_progress","complete","at_risk"]).default("not_started"),
        responsibleOwner:     z.string().optional(),
        evidenceDocumentUrl:  z.string().optional(),
        reviewDate:           z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const { id, ...data } = input;
        if (id) {
          const [row] = await db!.update(missionLocks).set({ ...data, updatedAt: new Date() })
            .where(eq(missionLocks.id, id)).returning();
          return row;
        }
        const [row] = await db!.insert(missionLocks).values(data).returning();
        return row;
      }),
  }),

  // ── Governance Directors ─────────────────────────────────────────────────
  governanceDirector: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        return db!.select().from(governanceDirectors).where(eq(governanceDirectors.ventureId, input.ventureId));
      }),

    upsert: protectedProcedure
      .input(z.object({
        id:                       z.number().optional(),
        ventureId:                z.string(),
        fullName:                 z.string(),
        role:                     z.string().default("non_executive_director"),
        appointmentDate:          z.string().optional(),
        missionAlignmentScore:    z.number().min(1).max(10).optional(),
        conflictOfInterestStatus: z.enum(["none","declared","unresolved"]).default("none"),
        votingRights:             z.boolean().default(true),
        removalProtection:        z.boolean().default(false),
        notes:                    z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const { id, ...data } = input;
        if (id) {
          const [row] = await db!.update(governanceDirectors).set({ ...data, updatedAt: new Date() })
            .where(eq(governanceDirectors.id, id)).returning();
          return row;
        }
        const [row] = await db!.insert(governanceDirectors).values(data).returning();
        return row;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        await db!.delete(governanceDirectors).where(eq(governanceDirectors.id, input.id));
        return { success: true };
      }),
  }),

  // ── Board Pledges ────────────────────────────────────────────────────────
  boardPledge: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        return db!.select().from(boardPledges).where(eq(boardPledges.ventureId, input.ventureId));
      }),

    create: protectedProcedure
      .input(z.object({
        ventureId:          z.string(),
        directorId:         z.number().optional(),
        pledgeText:         z.string().min(10),
        expiryOrReviewDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const [row] = await db!.insert(boardPledges).values(input).returning();
        return row;
      }),

    sign: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const [row] = await db!.update(boardPledges)
          .set({ signedStatus: "signed", signedAt: new Date(), updatedAt: new Date() })
          .where(eq(boardPledges.id, input.id)).returning();
        // Also update directorId's pledgeSigned flag
        if (row.directorId) {
          await db!.update(governanceDirectors)
            .set({ pledgeSigned: true, updatedAt: new Date() })
            .where(eq(governanceDirectors.id, row.directorId));
        }
        return row;
      }),

    flagBreach: protectedProcedure
      .input(z.object({ id: z.number(), reason: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const [row] = await db!.update(boardPledges)
          .set({ breachStatus: "suspected", updatedAt: new Date() })
          .where(eq(boardPledges.id, input.id)).returning();
        return row;
      }),

    getUnsignedCount: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        const rows = await db!.select().from(boardPledges)
          .where(and(eq(boardPledges.ventureId, input.ventureId), eq(boardPledges.signedStatus, "pending")));
        return { count: rows.length };
      }),
  }),

  // ── Reserved Matters ─────────────────────────────────────────────────────
  reservedMatter: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        return db!.select().from(reservedMatters).where(eq(reservedMatters.ventureId, input.ventureId));
      }),

    create: protectedProcedure
      .input(z.object({
        ventureId:         z.string(),
        matterCategory:    z.string(),
        matterTitle:       z.string(),
        matterDescription: z.string().optional(),
        approvalThreshold: z.string().optional(),
        requiredApprovers: z.array(z.string()).optional(),
        escalationPath:    z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const [row] = await db!.insert(reservedMatters).values({
          ...input,
          requiredApprovers: input.requiredApprovers ? JSON.stringify(input.requiredApprovers) : null,
        }).returning();
        return row;
      }),

    trigger: protectedProcedure
      .input(z.object({ id: z.number(), decisionSummary: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const matter = await db!.select().from(reservedMatters).where(eq(reservedMatters.id, input.id));
        if (!matter.length) throw new TRPCError({ code: "NOT_FOUND" });
        const [updated] = await db!.update(reservedMatters)
          .set({ status: "triggered", updatedAt: new Date() }).where(eq(reservedMatters.id, input.id)).returning();
        return updated;
      }),
  }),

  // ── Investor Alignment ───────────────────────────────────────────────────
  investorAlignment: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        return db!.select().from(investorAlignment).where(eq(investorAlignment.ventureId, input.ventureId))
          .orderBy(desc(investorAlignment.createdAt));
      }),

    add: protectedProcedure
      .input(z.object({
        ventureId:              z.string(),
        investorName:           z.string(),
        investorType:           z.string().optional(),
        capitalAmount:          z.number().optional(),
        timeHorizon:            z.string().optional(),
        exitExpectation:        z.string().optional(),
        controlRightsRequested: z.array(z.string()).optional(),
        liquidationPreference:  z.string().optional(),
        boardSeatRequested:     z.boolean().default(false),
        missionAlignmentScore:  z.number().min(0).max(100).optional(),
        approvalStatus:         z.enum(["under_review","approved","rejected","renegotiating","withdrawn"]).default("under_review"),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();

        const controlRightsStr = input.controlRightsRequested ? JSON.stringify(input.controlRightsRequested) : null;

        // Auto-assess risk
        const risk = assessInvestorRisk({
          missionAlignmentScore:  input.missionAlignmentScore,
          boardSeatRequested:     input.boardSeatRequested,
          controlRightsRequested: controlRightsStr,
          exitExpectation:        input.exitExpectation,
          liquidationPreference:  input.liquidationPreference,
          timeHorizon:            input.timeHorizon,
        });

        const [row] = await db!.insert(investorAlignment).values({
          ...input,
          controlRightsRequested:   controlRightsStr,
          capitalPressureIndicator: risk.capitalPressureIndicator,
          missionDriftRisk:         risk.missionDriftRisk,
          controlRiskRating:        risk.controlRiskRating,
          recommendedDecision:      risk.recommendedDecision,
          requiredActions:          JSON.stringify(risk.requiredActions),
        }).returning();

        // Auto-create a purpose_drift_detection if risk is high/critical
        if (["high","critical"].includes(risk.missionDriftRisk)) {
          await db!.insert(purposeDriftDetections).values({
            ventureId:     input.ventureId,
            triggerSource: "investor_pressure",
            driftCategory: "capital_pressure",
            severity:      risk.missionDriftRisk === "critical" ? "critical" : "high",
            evidence:      `Investor "${input.investorName}" has mission alignment score ${input.missionAlignmentScore ?? "unknown"}/100. Risk flags: ${risk.riskFlags.join("; ")}`,
            assignedTo:    "Board Governance Review",
            status:        "open",
          });
        }

        return {
          ...row,
          riskAssessment: {
            capitalPressureIndicator: risk.capitalPressureIndicator,
            missionDriftRisk:         risk.missionDriftRisk,
            controlRiskRating:        risk.controlRiskRating,
            recommendedDecision:      risk.recommendedDecision,
            requiredActions:          risk.requiredActions,
            riskFlags:                risk.riskFlags,
          },
        };
      }),

    setApprovalStatus: protectedProcedure
      .input(z.object({
        id:               z.number(),
        approvalStatus:   z.enum(["under_review","approved","rejected","renegotiating","withdrawn"]),
        rejectionReason:  z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const [row] = await db!.update(investorAlignment)
          .set({ approvalStatus: input.approvalStatus, rejectionReason: input.rejectionReason, updatedAt: new Date() })
          .where(eq(investorAlignment.id, input.id)).returning();
        return row;
      }),
  }),

  // ── Capital Decision Log ──────────────────────────────────────────────────
  capitalDecisionLog: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        return db!.select().from(capitalDecisionLog).where(eq(capitalDecisionLog.ventureId, input.ventureId))
          .orderBy(desc(capitalDecisionLog.createdAt));
      }),

    add: protectedProcedure
      .input(z.object({
        ventureId:                   z.string(),
        investorAlignmentId:         z.number().optional(),
        decisionType:                z.string(),
        decisionSummary:             z.string(),
        purposeAlignmentAssessment:  z.string().optional(),
        financialImpact:             z.string().optional(),
        governanceImpact:            z.string().optional(),
        approvedBy:                  z.string().optional(),
        conditionsAttached:          z.array(z.string()).optional(),
        decisionStatus:              z.enum(["pending","approved","rejected","deferred"]).default("pending"),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const [row] = await db!.insert(capitalDecisionLog).values({
          ...input,
          decisionDate:       new Date().toISOString().split("T")[0],
          conditionsAttached: input.conditionsAttached ? JSON.stringify(input.conditionsAttached) : null,
        }).returning();
        return row;
      }),
  }),

  // ── Purpose Drift Detection ───────────────────────────────────────────────
  purposeDrift: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string(), status: z.string().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        const conditions = [eq(purposeDriftDetections.ventureId, input.ventureId)];
        if (input.status) conditions.push(eq(purposeDriftDetections.status, input.status));
        return db!.select().from(purposeDriftDetections).where(and(...conditions))
          .orderBy(desc(purposeDriftDetections.detectedAt));
      }),

    create: protectedProcedure
      .input(z.object({
        ventureId:     z.string(),
        triggerSource: z.string(),
        driftCategory: z.string(),
        severity:      z.enum(["low","medium","high","critical"]),
        evidence:      z.string().optional(),
        assignedTo:    z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const [row] = await db!.insert(purposeDriftDetections).values(input).returning();
        return row;
      }),

    escalate: protectedProcedure
      .input(z.object({ id: z.number(), assignedTo: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const [row] = await db!.update(purposeDriftDetections)
          .set({ status: "escalated", assignedTo: input.assignedTo, updatedAt: new Date() })
          .where(eq(purposeDriftDetections.id, input.id)).returning();
        return row;
      }),

    resolve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const [row] = await db!.update(purposeDriftDetections)
          .set({ status: "resolved", resolvedAt: new Date(), updatedAt: new Date() })
          .where(eq(purposeDriftDetections.id, input.id)).returning();
        return row;
      }),

    getOpenCount: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        const rows = await db!.select({ cnt: sql<number>`count(*)` })
          .from(purposeDriftDetections)
          .where(and(eq(purposeDriftDetections.ventureId, input.ventureId), eq(purposeDriftDetections.status, "open")));
        return { count: Number(rows[0].cnt) };
      }),
  }),

  // ── Corrective Governance Actions ─────────────────────────────────────────
  correctiveAction: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string(), status: z.string().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        const conditions = [eq(correctiveGovernanceActions.ventureId, input.ventureId)];
        if (input.status) conditions.push(eq(correctiveGovernanceActions.status, input.status));
        return db!.select().from(correctiveGovernanceActions).where(and(...conditions))
          .orderBy(desc(correctiveGovernanceActions.createdAt));
      }),

    create: protectedProcedure
      .input(z.object({
        ventureId:            z.string(),
        driftId:              z.number().optional(),
        actionType:           z.string(),
        actionDescription:    z.string(),
        owner:                z.string(),
        deadline:             z.string().optional(),
        boardApprovalRequired: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const [row] = await db!.insert(correctiveGovernanceActions).values(input).returning();
        return row;
      }),

    complete: protectedProcedure
      .input(z.object({ id: z.number(), evidence: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const [row] = await db!.update(correctiveGovernanceActions)
          .set({ status: "complete", completionEvidence: input.evidence, completedAt: new Date(), updatedAt: new Date() })
          .where(eq(correctiveGovernanceActions.id, input.id)).returning();
        return row;
      }),
  }),

  // ── Governance Documents ─────────────────────────────────────────────────
  governanceDocument: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string(), documentType: z.string().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        const conditions = [eq(governanceDocuments.ventureId, input.ventureId)];
        if (input.documentType) conditions.push(eq(governanceDocuments.documentType, input.documentType));
        return db!.select().from(governanceDocuments).where(and(...conditions))
          .orderBy(desc(governanceDocuments.createdAt));
      }),

    upload: protectedProcedure
      .input(z.object({
        ventureId:          z.string(),
        documentType:       z.string(),
        documentTitle:      z.string(),
        fileUrl:            z.string().optional(),
        expiryOrReviewDate: z.string().optional(),
        uploadedBy:         z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        // Get next version
        const existing = await db!.select({ v: governanceDocuments.version })
          .from(governanceDocuments)
          .where(and(eq(governanceDocuments.ventureId, input.ventureId), eq(governanceDocuments.documentType, input.documentType)))
          .orderBy(desc(governanceDocuments.version)).limit(1);
        const version = existing.length ? existing[0].v + 1 : 1;
        const [row] = await db!.insert(governanceDocuments).values({ ...input, version }).returning();
        return row;
      }),

    approve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const [row] = await db!.update(governanceDocuments)
          .set({ status: "approved", approvalDate: new Date().toISOString().split("T")[0], updatedAt: new Date() })
          .where(eq(governanceDocuments.id, input.id)).returning();
        return row;
      }),
  }),

  // ── Purpose Metrics ──────────────────────────────────────────────────────
  purposeMetric: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        return db!.select().from(purposeMetrics).where(eq(purposeMetrics.ventureId, input.ventureId));
      }),

    upsert: protectedProcedure
      .input(z.object({
        id:                 z.number().optional(),
        ventureId:          z.string(),
        metricName:         z.string(),
        metricCategory:     z.string(),
        targetValue:        z.number().optional(),
        currentValue:       z.number().optional(),
        unit:               z.string().optional(),
        trend:              z.enum(["improving","stable","declining","unknown"]).optional(),
        riskThreshold:      z.number().optional(),
        dataSource:         z.string().optional(),
        reportingFrequency: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const { id, ...data } = input;
        if (id) {
          const [row] = await db!.update(purposeMetrics)
            .set({ ...data, lastUpdatedAt: new Date(), updatedAt: new Date() })
            .where(eq(purposeMetrics.id, id)).returning();
          return row;
        }
        const [row] = await db!.insert(purposeMetrics).values({ ...data, lastUpdatedAt: new Date() }).returning();
        return row;
      }),
  }),

  // ── Governance Review Cycles ─────────────────────────────────────────────
  governanceReviewCycle: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string(), reviewType: z.string().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        const conditions = [eq(governanceReviewCycles.ventureId, input.ventureId)];
        if (input.reviewType) conditions.push(eq(governanceReviewCycles.reviewType, input.reviewType));
        return db!.select().from(governanceReviewCycles).where(and(...conditions))
          .orderBy(desc(governanceReviewCycles.createdAt));
      }),

    create: protectedProcedure
      .input(z.object({
        ventureId:      z.string(),
        reviewType:     z.enum(["monthly_management","quarterly_purpose","annual_constitutional"]),
        reviewPeriod:   z.string(),
        reviewer:       z.string().optional(),
        nextReviewDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const [row] = await db!.insert(governanceReviewCycles).values(input).returning();
        return row;
      }),

    complete: protectedProcedure
      .input(z.object({
        id:                        z.number(),
        findings:                  z.string(),
        redFlags:                  z.array(z.string()).optional(),
        correctiveActionsRequired: z.array(z.string()).optional(),
        nextReviewDate:            z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const [row] = await db!.update(governanceReviewCycles).set({
          findings:                  input.findings,
          redFlags:                  input.redFlags ? JSON.stringify(input.redFlags) : null,
          correctiveActionsRequired: input.correctiveActionsRequired ? JSON.stringify(input.correctiveActionsRequired) : null,
          reviewStatus:              "complete",
          nextReviewDate:            input.nextReviewDate ?? null,
          completedAt:               new Date(),
          updatedAt:                 new Date(),
        }).where(eq(governanceReviewCycles.id, input.id)).returning();
        return row;
      }),
  }),

  // ── Maturity Score ───────────────────────────────────────────────────────
  maturityScore: router({
    get: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        const rows = await db!.select().from(governanceMaturityScores)
          .where(eq(governanceMaturityScores.ventureId, input.ventureId))
          .orderBy(desc(governanceMaturityScores.createdAt)).limit(1);
        return rows[0] ?? null;
      }),

    compute: protectedProcedure
      .input(z.object({ ventureId: z.string() }))
      .mutation(async ({ input }) => {
        return computeGovernanceMaturityScore(input.ventureId);
      }),

    history: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        return db!.select().from(governanceMaturityScores)
          .where(eq(governanceMaturityScores.ventureId, input.ventureId))
          .orderBy(desc(governanceMaturityScores.createdAt));
      }),
  }),

  // ── Dashboard aggregate ───────────────────────────────────────────────────
  dashboard: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const vid = input.ventureId;

      const [charters, locks, directors, pledges, matters, invAligns,
             drift, actions, docs, reviews, metrics, latestScore] = await Promise.all([
        db!.select().from(purposeCharters).where(eq(purposeCharters.ventureId, vid)),
        db!.select().from(missionLocks).where(eq(missionLocks.ventureId, vid)),
        db!.select().from(governanceDirectors).where(eq(governanceDirectors.ventureId, vid)),
        db!.select().from(boardPledges).where(eq(boardPledges.ventureId, vid)),
        db!.select().from(reservedMatters).where(eq(reservedMatters.ventureId, vid)),
        db!.select().from(investorAlignment).where(eq(investorAlignment.ventureId, vid)),
        db!.select().from(purposeDriftDetections).where(and(eq(purposeDriftDetections.ventureId, vid), eq(purposeDriftDetections.status, "open"))),
        db!.select().from(correctiveGovernanceActions).where(and(eq(correctiveGovernanceActions.ventureId, vid), eq(correctiveGovernanceActions.status, "open"))),
        db!.select().from(governanceDocuments).where(eq(governanceDocuments.ventureId, vid)),
        db!.select().from(governanceReviewCycles).where(eq(governanceReviewCycles.ventureId, vid)),
        db!.select().from(purposeMetrics).where(eq(purposeMetrics.ventureId, vid)),
        db!.select().from(governanceMaturityScores).where(eq(governanceMaturityScores.ventureId, vid))
          .orderBy(desc(governanceMaturityScores.createdAt)).limit(1),
      ]);

      const approvedCharter   = charters.find(c => c.approvalStatus === "approved");
      const signedPledges     = pledges.filter(p => p.signedStatus === "signed");
      const highDrift         = drift.filter(d => ["high","critical"].includes(d.severity));
      const critInvestors     = invAligns.filter(i => i.controlRiskRating === "critical" || i.capitalPressureIndicator === "red");
      const overdueActions    = actions.filter(a => a.deadline && new Date(a.deadline) < new Date());
      const expiringDocs      = docs.filter(d => d.expiryOrReviewDate &&
        new Date(d.expiryOrReviewDate) < new Date(Date.now() + 90 * 86400000));

      return {
        maturityScore:          latestScore[0]?.totalScore ?? 0,
        maturityBand:           latestScore[0]?.maturityBand ?? "foundation",
        maturityStatus:         latestScore[0]?.status ?? "Not computed",
        purposeAligned:         !!approvedCharter,
        charterStatus:          charters.length ? (approvedCharter ? "approved" : charters[0].approvalStatus) : "missing",
        missionDriftRiskLevel:  highDrift.length > 0 ? "high" : drift.length > 0 ? "medium" : "low",
        openDriftCount:         drift.length,
        highSeverityDriftCount: highDrift.length,
        investorAlignmentRisk:  critInvestors.length > 0 ? "critical" : invAligns.length > 0 ? "review" : "none",
        boardPledgeCompletion:  directors.length > 0 ? `${signedPledges.length}/${directors.length}` : "0/0",
        reservedMattersActive:  matters.filter(m => m.status === "active").length,
        overdueActionsCount:    overdueActions.length,
        expiringDocsCount:      expiringDocs.length,
        investorCount:          invAligns.length,
        purposeMetricsCount:    metrics.length,
        reviewCycleActive:      reviews.some(r => r.reviewStatus === "in_progress"),
        recommendation:         latestScore[0]?.recommendation ?? "Run maturity score computation to get recommendations.",
      };
    }),
});
