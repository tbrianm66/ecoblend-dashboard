// ============================================================
// MISSION PROTECTION FRAMEWORK ROUTER
// Phase 5 — Mission Integrity Index, Constitutional Governance,
//            Succession Planning, Stakeholder Alignment
// ============================================================

import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import {
  missionIntegrityScores,
  governanceStructures,
  successionPlans,
  missionDriftAlerts,
  stakeholderProfiles,
  type MissionIntegrityScore,
} from "../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Mission Integrity Index Calculation Engine
 *
 * Composite score (0-100) measuring mission alignment and protection.
 * Formula: 0.30 × FinancialAlignment + 0.25 × StakeholderAlignment +
 *          0.25 × GovernanceStrength + 0.20 × LeadershipContinuity
 *
 * Weighted to emphasise financial discipline and stakeholder alignment
 * as the primary drivers of mission drift (per Eric Ries' failure patterns).
 */
function calculateMissionIntegrityScore(inputs: {
  financialVsMissionDrift: number;    // 0-100: divergence (lower = more drift)
  stakeholderAlignmentScore: number;  // 0-100: alignment
  governanceStrengthScore: number;    // 0-100: governance
  leadershipContinuityScore: number;  // 0-100: succession readiness
}): number {
  // financialVsMissionDrift is a divergence score — invert it for the composite
  const financialAlignmentScore = 100 - inputs.financialVsMissionDrift;
  const composite =
    0.30 * financialAlignmentScore +
    0.25 * inputs.stakeholderAlignmentScore +
    0.25 * inputs.governanceStrengthScore +
    0.20 * inputs.leadershipContinuityScore;
  return Math.round(Math.min(100, Math.max(0, composite)));
}

/**
 * Determine mission drift trend by comparing current score to previous.
 */
function determineTrend(current: number, previous: number | null): "Improving" | "Stable" | "Declining" {
  if (previous === null) return "Stable";
  const delta = current - previous;
  if (delta >= 5) return "Improving";
  if (delta <= -5) return "Declining";
  return "Stable";
}

/**
 * Auto-generate mission drift alerts based on score thresholds.
 */
function generateDriftAlerts(
  ventureId: string,
  scores: {
    overallScore: number;
    financialVsMissionDrift: number;
    stakeholderAlignmentScore: number;
    governanceStrengthScore: number;
    leadershipContinuityScore: number;
  }
): Array<{
  id: string;
  ventureId: string;
  alertType: string;
  severity: string;
  description: string;
  evidence: string;
  recommendedAction: string;
  status: string;
}> {
  const alerts = [];

  if (scores.financialVsMissionDrift >= 60) {
    alerts.push({
      id: generateId("alert"),
      ventureId,
      alertType: "FinancialVsMissionDivergence",
      severity: scores.financialVsMissionDrift >= 80 ? "Critical" : "High",
      description: "Financial metrics are diverging significantly from mission impact metrics",
      evidence: `Financial vs Mission Drift score: ${scores.financialVsMissionDrift}/100 (divergence)`,
      recommendedAction: "Conduct mission alignment review. Revisit revenue model to ensure financial goals reinforce rather than undermine mission.",
      status: "Active",
    });
  }

  if (scores.stakeholderAlignmentScore < 50) {
    alerts.push({
      id: generateId("alert"),
      ventureId,
      alertType: "StakeholderMisalignment",
      severity: scores.stakeholderAlignmentScore < 30 ? "Critical" : "High",
      description: "Key stakeholders show low alignment with venture mission",
      evidence: `Stakeholder Alignment score: ${scores.stakeholderAlignmentScore}/100`,
      recommendedAction: "Map stakeholder incentives. Identify misaligned stakeholders and develop re-alignment strategy or consider governance changes.",
      status: "Active",
    });
  }

  if (scores.governanceStrengthScore < 50) {
    alerts.push({
      id: generateId("alert"),
      ventureId,
      alertType: "GovernanceWeakness",
      severity: scores.governanceStrengthScore < 30 ? "Critical" : "Medium",
      description: "Governance structures are insufficient to protect mission integrity",
      evidence: `Governance Strength score: ${scores.governanceStrengthScore}/100`,
      recommendedAction: "Implement Constitutional Governance framework. Add founder veto rights, mission-aligned board seats, and mission protection clauses to bylaws.",
      status: "Active",
    });
  }

  if (scores.leadershipContinuityScore < 40) {
    alerts.push({
      id: generateId("alert"),
      ventureId,
      alertType: "SuccessionVulnerability",
      severity: scores.leadershipContinuityScore < 20 ? "High" : "Medium",
      description: "Leadership succession planning is inadequate — mission continuity at risk",
      evidence: `Leadership Continuity score: ${scores.leadershipContinuityScore}/100`,
      recommendedAction: "Complete Succession Planning questionnaire. Document founder intent, identify successors, and create institutional memory system.",
      status: "Active",
    });
  }

  return alerts;
}

// ── Mission Integrity Index Router ───────────────────────────────────────────

export const missionIntegrityRouter = router({
  /**
   * Calculate and save a Mission Integrity Index score for a venture.
   * Runs the calculation engine and auto-generates drift alerts.
   */
  calculate: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      financialVsMissionDrift: z.number().min(0).max(100),
      stakeholderAlignmentScore: z.number().min(0).max(100),
      governanceStrengthScore: z.number().min(0).max(100),
      leadershipContinuityScore: z.number().min(0).max(100),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { ventureId, financialVsMissionDrift, stakeholderAlignmentScore, governanceStrengthScore, leadershipContinuityScore } = input;

      // Get previous score for trend calculation
      const [previous] = await db
        .select()
        .from(missionIntegrityScores)
        .where(eq(missionIntegrityScores.ventureId, ventureId))
        .orderBy(desc(missionIntegrityScores.createdAt))
        .limit(1);

      const overallScore = calculateMissionIntegrityScore({
        financialVsMissionDrift,
        stakeholderAlignmentScore,
        governanceStrengthScore,
        leadershipContinuityScore,
      });

      const trend = determineTrend(overallScore, previous?.overallScore ?? null);

      const id = generateId("mis");
      await db.insert(missionIntegrityScores).values({
        id,
        ventureId,
        overallScore,
        financialVsMissionDrift,
        stakeholderAlignmentScore,
        governanceStrengthScore,
        leadershipContinuityScore,
        missionDriftTrend: trend,
        lastAssessmentAt: new Date(),
      });

      // Auto-generate drift alerts
      const alerts = generateDriftAlerts(ventureId, {
        overallScore,
        financialVsMissionDrift,
        stakeholderAlignmentScore,
        governanceStrengthScore,
        leadershipContinuityScore,
      });

      if (alerts.length > 0) {
        await db.insert(missionDriftAlerts).values(alerts.map(a => ({
          ...a,
          createdAt: new Date(),
          updatedAt: new Date(),
        })));
      }

      return {
        id,
        overallScore,
        trend,
        alertsGenerated: alerts.length,
        breakdown: {
          financialAlignment: 100 - financialVsMissionDrift,
          stakeholderAlignment: stakeholderAlignmentScore,
          governanceStrength: governanceStrengthScore,
          leadershipContinuity: leadershipContinuityScore,
        },
      };
    }),

  /**
   * Get the latest Mission Integrity Score for a venture.
   */
  getLatest: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [score] = await db
        .select()
        .from(missionIntegrityScores)
        .where(eq(missionIntegrityScores.ventureId, input.ventureId))
        .orderBy(desc(missionIntegrityScores.createdAt))
        .limit(1);
      return score ?? null;
    }),

  /**
   * Get Mission Integrity Score history for trend charts.
   */
  getHistory: publicProcedure
    .input(z.object({ ventureId: z.string(), limit: z.number().default(12) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      return db
        .select()
        .from(missionIntegrityScores)
        .where(eq(missionIntegrityScores.ventureId, input.ventureId))
        .orderBy(desc(missionIntegrityScores.createdAt))
        .limit(input.limit);
    }),

  /**
   * Get all active drift alerts for a venture.
   */
  getAlerts: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      return db
        .select()
        .from(missionDriftAlerts)
        .where(
          and(
            eq(missionDriftAlerts.ventureId, input.ventureId),
            eq(missionDriftAlerts.status, "Active")
          )
        )
        .orderBy(desc(missionDriftAlerts.createdAt));
    }),

  /**
   * Acknowledge a drift alert.
   */
  acknowledgeAlert: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .update(missionDriftAlerts)
        .set({ status: "Acknowledged", acknowledgedAt: new Date(), updatedAt: new Date() })
        .where(eq(missionDriftAlerts.id, input.alertId));
      return { success: true };
    }),
  /**
   * Resolve (close) a drift alert.
   */
  resolveAlert: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .update(missionDriftAlerts)
        .set({ status: "Resolved", updatedAt: new Date() })
        .where(eq(missionDriftAlerts.id, input.alertId));
      return { success: true };
    }),
  /**
   * Get all active alerts across all ventures (portfolio-wide).
   */
  getAllAlerts: publicProcedure
    .input(z.object({
      status: z.enum(["Active", "Acknowledged", "Resolved", "All"]).optional().default("Active"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const query = db
        .select()
        .from(missionDriftAlerts)
        .orderBy(desc(missionDriftAlerts.createdAt));
      const all = await query;
      if (input.status === "All") return all;
      return all.filter((a: any) => a.status === input.status);
    }),
  /**
   * Bulk acknowledge all active alerts for a venture.
   */
  acknowledgeAllForVenture: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .update(missionDriftAlerts)
        .set({ status: "Acknowledged", acknowledgedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(missionDriftAlerts.ventureId, input.ventureId),
            eq(missionDriftAlerts.status, "Active")
          )
        );
      return { success: true };
    }),

  /**
   * Get portfolio-level Mission Integrity summary.
   */
  getPortfolioSummary: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
    const latestScores = await db
      .select()
      .from(missionIntegrityScores)
      .orderBy(desc(missionIntegrityScores.createdAt));

    // Deduplicate — keep only the latest per venture
    const seen = new Set<string>();
    const unique: MissionIntegrityScore[] = [];
    for (const score of latestScores) {
      if (!seen.has(score.ventureId)) {
        seen.add(score.ventureId);
        unique.push(score);
      }
    }

    const avgScore = unique.length > 0
      ? Math.round(unique.reduce((s, r) => s + r.overallScore, 0) / unique.length)
      : 0;

    const atRisk = unique.filter(s => s.overallScore < 60).length;
    const declining = unique.filter(s => s.missionDriftTrend === "Declining").length;

    return { ventures: unique, avgScore, atRisk, declining };
  }),
});

// ── Constitutional Governance Router ─────────────────────────────────────────

export const constitutionalGovernanceRouter = router({
  /**
   * Save or update governance structure for a venture.
   */
  upsert: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      founderVetoRights: z.boolean().optional(),
      founderVetoScope: z.string().optional(),
      boardSize: z.number().optional(),
      founderSeats: z.number().optional(),
      independentSeats: z.number().optional(),
      investorSeats: z.number().optional(),
      missionAlignedSeats: z.number().optional(),
      employeeRepresentation: z.boolean().optional(),
      communityRepresentation: z.boolean().optional(),
      customerAdvisoryBoard: z.boolean().optional(),
      missionClauseInBylaws: z.boolean().optional(),
      missionClauseText: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { ventureId, ...fields } = input;

      // Calculate governance compliance score
      let score = 0;
      if (fields.founderVetoRights) score += 25;
      if (fields.missionAlignedSeats && fields.missionAlignedSeats > 0) score += 20;
      if (fields.employeeRepresentation) score += 15;
      if (fields.communityRepresentation) score += 15;
      if (fields.missionClauseInBylaws) score += 25;

      // Check if record exists
      const [existing] = await db
        .select()
        .from(governanceStructures)
        .where(eq(governanceStructures.ventureId, ventureId))
        .limit(1);

      if (existing) {
        await db
          .update(governanceStructures)
          .set({ ...fields, complianceScore: score, lastReviewAt: new Date(), updatedAt: new Date() })
          .where(eq(governanceStructures.ventureId, ventureId));
        return { id: existing.id, complianceScore: score, action: "updated" };
      } else {
        const id = generateId("gov");
        await db.insert(governanceStructures).values({
          id,
          ventureId,
          ...fields,
          complianceScore: score,
          lastReviewAt: new Date(),
        });
        return { id, complianceScore: score, action: "created" };
      }
    }),

  /**
   * Get governance structure for a venture.
   */
  get: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [record] = await db
        .select()
        .from(governanceStructures)
        .where(eq(governanceStructures.ventureId, input.ventureId))
        .limit(1);
      return record ?? null;
    }),

  /**
   * Get governance compliance audit for all ventures.
   */
  getComplianceAudit: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
    const records = await db.select().from(governanceStructures);

    return records.map(r => ({
      ventureId: r.ventureId,
      complianceScore: r.complianceScore ?? 0,
      founderProtection: r.founderVetoRights ? "Protected" : "Unprotected",
      boardBalance: r.boardSize
        ? `${r.founderSeats ?? 0}F / ${r.independentSeats ?? 0}I / ${r.investorSeats ?? 0}V / ${r.missionAlignedSeats ?? 0}M`
        : "Not configured",
      stakeholderVoice: [
        r.employeeRepresentation ? "Employee" : null,
        r.communityRepresentation ? "Community" : null,
        r.customerAdvisoryBoard ? "Customer" : null,
      ].filter(Boolean).join(", ") || "None",
      missionProtection: r.missionClauseInBylaws ? "Clause in bylaws" : "No formal protection",
      lastReview: r.lastReviewAt,
    }));
  }),

  /**
   * Get governance templates (pre-built governance structures).
   */
  getTemplates: publicProcedure.query(async () => {
    return [
      {
        id: "founder-protected",
        name: "Founder-Protected Mission",
        description: "Strong founder control with mission veto rights and mission-aligned board majority",
        suitableFor: "Early-stage social ventures where founder vision is central",
        structure: {
          founderVetoRights: true,
          founderVetoScope: "Any decision that materially changes the mission, values, or social impact model",
          boardSize: 5,
          founderSeats: 2,
          independentSeats: 1,
          investorSeats: 1,
          missionAlignedSeats: 1,
          employeeRepresentation: false,
          communityRepresentation: false,
          customerAdvisoryBoard: true,
          missionClauseInBylaws: true,
          missionClauseText: "The company shall not take any action that materially undermines its social mission without a supermajority (75%) board vote and founder consent.",
        },
        complianceScore: 85,
      },
      {
        id: "stakeholder-democracy",
        name: "Stakeholder Democracy",
        description: "Broad stakeholder representation with employee and community voice in governance",
        suitableFor: "Mature social ventures with established stakeholder relationships",
        structure: {
          founderVetoRights: true,
          founderVetoScope: "Mission-critical decisions only",
          boardSize: 7,
          founderSeats: 2,
          independentSeats: 2,
          investorSeats: 1,
          missionAlignedSeats: 2,
          employeeRepresentation: true,
          communityRepresentation: true,
          customerAdvisoryBoard: true,
          missionClauseInBylaws: true,
          missionClauseText: "The company is constitutionally committed to its social mission. Any amendment to the mission requires unanimous board approval and a stakeholder referendum.",
        },
        complianceScore: 100,
      },
      {
        id: "investor-balanced",
        name: "Investor-Balanced Mission",
        description: "Balanced governance that accommodates investor interests while protecting mission",
        suitableFor: "Ventures seeking institutional investment while maintaining mission integrity",
        structure: {
          founderVetoRights: true,
          founderVetoScope: "Mission changes and social impact model modifications",
          boardSize: 6,
          founderSeats: 2,
          independentSeats: 2,
          investorSeats: 2,
          missionAlignedSeats: 0,
          employeeRepresentation: false,
          communityRepresentation: false,
          customerAdvisoryBoard: true,
          missionClauseInBylaws: true,
          missionClauseText: "Investor rights do not extend to changing the company's social mission or impact model. Financial returns shall not be prioritised over mission delivery.",
        },
        complianceScore: 70,
      },
    ];
  }),
});

// ── Succession Planning Router ────────────────────────────────────────────────

export const successionPlanningRouter = router({
  /**
   * Save or update succession plan for a venture.
   */
  upsert: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      currentCeo: z.string().optional(),
      ceoPlanningHorizon: z.number().optional(),
      potentialSuccessors: z.array(z.object({
        name: z.string(),
        role: z.string(),
        readinessScore: z.number().min(0).max(100),
      })).optional(),
      founderIntentDocumented: z.boolean().optional(),
      founderIntentSummary: z.string().optional(),
      institutionalMemorySystem: z.boolean().optional(),
      missionCodexDocument: z.string().optional(),
      keyDecisionFrameworks: z.string().optional(),
      coreValuesDocumented: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { ventureId, ...fields } = input;

      // Calculate succession readiness score
      let score = 0;
      if (fields.potentialSuccessors && fields.potentialSuccessors.length > 0) score += 25;
      if (fields.founderIntentDocumented) score += 25;
      if (fields.institutionalMemorySystem) score += 20;
      if (fields.missionCodexDocument && fields.missionCodexDocument.length > 50) score += 15;
      if (fields.coreValuesDocumented && fields.coreValuesDocumented.length > 50) score += 15;

      const [existing] = await db
        .select()
        .from(successionPlans)
        .where(eq(successionPlans.ventureId, ventureId))
        .limit(1);

      if (existing) {
        await db
          .update(successionPlans)
          .set({
            ...fields,
            keyDecisionFrameworks: fields.keyDecisionFrameworks ? JSON.parse(JSON.stringify(fields.keyDecisionFrameworks)) : existing.keyDecisionFrameworks,
            coreValuesDocumented: fields.coreValuesDocumented ? JSON.parse(JSON.stringify(fields.coreValuesDocumented)) : existing.coreValuesDocumented,
            successionReadinessScore: score,
            lastUpdatedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(successionPlans.ventureId, ventureId));
        return { id: existing.id, successionReadinessScore: score, action: "updated" };
      } else {
        const id = generateId("suc");
        await db.insert(successionPlans).values({
          id,
          ventureId,
          ...fields,
          successionReadinessScore: score,
          lastUpdatedAt: new Date(),
        });
        return { id, successionReadinessScore: score, action: "created" };
      }
    }),

  /**
   * Get succession plan for a venture.
   */
  get: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [record] = await db
        .select()
        .from(successionPlans)
        .where(eq(successionPlans.ventureId, input.ventureId))
        .limit(1);
      return record ?? null;
    }),

  /**
   * Get succession playbook — structured guidance for succession planning.
   * Returns a comprehensive playbook with phases, actions, and resources.
   */
  getPlaybook: publicProcedure.query(async () => {
    return {
      title: "Succession Planning Playbook",
      subtitle: "Protecting Mission Continuity Through Leadership Transitions",
      lastUpdated: "2026-06-01",
      phases: [
        {
          id: "phase-1",
          phase: 1,
          title: "Foundation: Document Founder Intent",
          timeframe: "Months 1-2",
          priority: "Critical",
          description: "Create the 'invisible leader' — a documented record of founder vision, values, and decision-making principles that will guide future leaders.",
          actions: [
            {
              id: "a1-1",
              title: "Write the Founder's Mission Manifesto",
              description: "Document the founding story, core mission, and non-negotiable principles in 2-5 pages",
              template: "1. Why we exist (mission)\n2. What we will never compromise (non-negotiables)\n3. How we make decisions (principles)\n4. What success looks like in 10 years\n5. What failure looks like (red lines)",
              effort: "4-8 hours",
              owner: "Founder",
            },
            {
              id: "a1-2",
              title: "Record Video Mission Statement",
              description: "Create a 15-30 minute video of the founder explaining the mission, values, and vision",
              template: "Cover: founding story, key pivots, mission evolution, advice to future leaders",
              effort: "2-4 hours",
              owner: "Founder",
            },
            {
              id: "a1-3",
              title: "Document Decision-Making Frameworks",
              description: "Write down how key decisions are made — what criteria matter, what trade-offs are acceptable",
              template: "For each major decision type: 1. What data we look at, 2. What values guide us, 3. Who has input, 4. What we would never do",
              effort: "3-6 hours",
              owner: "Founder + Leadership Team",
            },
          ],
          successCriteria: [
            "Mission manifesto reviewed and approved by board",
            "Video recorded and stored in secure location",
            "Decision frameworks documented for top 5 decision types",
          ],
        },
        {
          id: "phase-2",
          phase: 2,
          title: "Pipeline: Identify and Develop Successors",
          timeframe: "Months 3-6",
          priority: "High",
          description: "Build a leadership pipeline by identifying potential successors and creating development plans.",
          actions: [
            {
              id: "a2-1",
              title: "Map Leadership Competencies",
              description: "Define the competencies required for each senior leadership role",
              template: "For CEO: 1. Mission alignment (must have), 2. Stakeholder management, 3. Strategic thinking, 4. Operational excellence, 5. Fundraising capability",
              effort: "4-6 hours",
              owner: "Founder + Board",
            },
            {
              id: "a2-2",
              title: "Identify Internal Successor Candidates",
              description: "Assess current team members against leadership competency framework",
              template: "For each candidate: 1. Current role, 2. Readiness score (0-100), 3. Development gaps, 4. Timeline to readiness, 5. Mission alignment assessment",
              effort: "8-12 hours",
              owner: "Founder + HR",
            },
            {
              id: "a2-3",
              title: "Create Individual Development Plans",
              description: "Build 12-24 month development plans for top successor candidates",
              template: "1. Stretch assignments, 2. Mentoring/coaching, 3. External training, 4. Board exposure, 5. Stakeholder relationship building",
              effort: "2-4 hours per candidate",
              owner: "Founder + Candidate",
            },
          ],
          successCriteria: [
            "At least 2 internal successor candidates identified",
            "Each candidate has a development plan",
            "Readiness scores tracked quarterly",
          ],
        },
        {
          id: "phase-3",
          phase: 3,
          title: "Memory: Build Institutional Knowledge System",
          timeframe: "Months 4-8",
          priority: "High",
          description: "Create systems to preserve mission knowledge, culture, and decision-making wisdom beyond any individual.",
          actions: [
            {
              id: "a3-1",
              title: "Create the Mission Codex",
              description: "A living document that codifies mission, values, culture, and operating principles",
              template: "1. Mission statement (with history), 2. Core values (with definitions and examples), 3. Cultural norms, 4. Operating principles, 5. Strategic priorities, 6. Stakeholder commitments",
              effort: "8-16 hours",
              owner: "Leadership Team",
            },
            {
              id: "a3-2",
              title: "Document Key Relationships",
              description: "Map and document critical stakeholder relationships — who they are, history, commitments made",
              template: "For each key stakeholder: 1. Relationship history, 2. Commitments made, 3. Communication preferences, 4. Risk factors, 5. Transition notes",
              effort: "4-8 hours",
              owner: "Founder + Team",
            },
            {
              id: "a3-3",
              title: "Archive Decision History",
              description: "Document the rationale behind major strategic decisions",
              template: "For each major decision: 1. Context, 2. Options considered, 3. Decision made, 4. Rationale, 5. Outcome, 6. Lessons learned",
              effort: "Ongoing (1-2 hours/month)",
              owner: "Leadership Team",
            },
          ],
          successCriteria: [
            "Mission Codex v1.0 published and accessible to leadership team",
            "Top 20 stakeholder relationships documented",
            "Decision archive system established",
          ],
        },
        {
          id: "phase-4",
          phase: 4,
          title: "Governance: Embed Mission in Structure",
          timeframe: "Months 6-12",
          priority: "High",
          description: "Formalise mission protection through governance structures that survive leadership transitions.",
          actions: [
            {
              id: "a4-1",
              title: "Add Mission Protection Clause to Bylaws",
              description: "Legally embed mission protection in company constitution",
              template: "Clause: 'The company's social mission [insert mission] is a constitutional commitment. No action that materially undermines this mission may be taken without [supermajority vote + founder/mission guardian consent].'",
              effort: "Legal review: 4-8 hours",
              owner: "Founder + Legal Counsel",
            },
            {
              id: "a4-2",
              title: "Appoint Mission Guardian",
              description: "Designate a board member or advisor as Mission Guardian with specific responsibilities",
              template: "Mission Guardian responsibilities: 1. Annual mission alignment review, 2. Flag potential mission drift, 3. Approve major strategic pivots, 4. Steward succession process",
              effort: "2-4 hours",
              owner: "Founder + Board",
            },
            {
              id: "a4-3",
              title: "Establish Succession Committee",
              description: "Create a board committee responsible for succession planning and execution",
              template: "Committee charter: 1. Composition (2-3 board members + founder), 2. Responsibilities, 3. Meeting cadence, 4. Reporting requirements, 5. Emergency succession protocol",
              effort: "4-6 hours",
              owner: "Board Chair",
            },
          ],
          successCriteria: [
            "Mission protection clause in bylaws",
            "Mission Guardian appointed",
            "Succession Committee established with charter",
          ],
        },
        {
          id: "phase-5",
          phase: 5,
          title: "Transition: Execute Succession",
          timeframe: "When triggered",
          priority: "Critical when triggered",
          description: "Execute a planned or emergency leadership transition while protecting mission continuity.",
          actions: [
            {
              id: "a5-1",
              title: "Activate Succession Committee",
              description: "Convene committee, review succession plan, confirm successor readiness",
              template: "Agenda: 1. Trigger assessment, 2. Successor readiness review, 3. Timeline agreement, 4. Communication plan, 5. Handover protocol",
              effort: "Full-day workshop",
              owner: "Board Chair + Succession Committee",
            },
            {
              id: "a5-2",
              title: "Execute Structured Handover",
              description: "90-day structured handover process with shadow period and gradual transfer",
              template: "Days 1-30: Shadow, Days 31-60: Co-lead, Days 61-90: Lead with support, Day 90+: Full transition",
              effort: "90 days",
              owner: "Outgoing + Incoming Leader",
            },
            {
              id: "a5-3",
              title: "Mission Continuity Review",
              description: "90-day post-transition review to assess mission alignment under new leadership",
              template: "Review: 1. Mission Integrity Index score, 2. Stakeholder feedback, 3. Strategic alignment, 4. Cultural health, 5. Corrective actions if needed",
              effort: "4-8 hours",
              owner: "Mission Guardian + Board",
            },
          ],
          successCriteria: [
            "Transition completed within planned timeline",
            "Mission Integrity Index score maintained or improved",
            "Stakeholder confidence maintained",
          ],
        },
      ],
      resources: [
        { title: "Founder Intent Template", type: "template", description: "Structured template for documenting founder mission and values" },
        { title: "Successor Assessment Framework", type: "framework", description: "Competency-based assessment tool for evaluating successor readiness" },
        { title: "Mission Codex Template", type: "template", description: "Living document template for institutional knowledge preservation" },
        { title: "Governance Structure Checklist", type: "checklist", description: "Checklist for mission-protecting governance structures" },
        { title: "Transition Protocol", type: "protocol", description: "Step-by-step protocol for executing leadership transitions" },
      ],
    };
  }),
});

// ── Stakeholder Alignment Router ──────────────────────────────────────────────

export const stakeholderAlignmentRouter = router({
  /**
   * Create or update a stakeholder profile.
   */
  upsertProfile: protectedProcedure
    .input(z.object({
      id: z.string().optional(),
      ventureId: z.string(),
      stakeholderType: z.enum(["Founder", "Employee", "Investor", "Customer", "Community", "Board", "Advisor"]),
      name: z.string(),
      role: z.string().optional(),
      primaryIncentive: z.string().optional(),
      missionAlignment: z.number().min(0).max(100).optional(),
      financialAlignment: z.number().min(0).max(100).optional(),
      feedbackScore: z.number().min(0).max(100).optional(),
      conflictRisk: z.enum(["Low", "Medium", "High"]).optional(),
      conflictDescription: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...fields } = input;

      if (id) {
        await db
          .update(stakeholderProfiles)
          .set({ ...fields, updatedAt: new Date() })
          .where(eq(stakeholderProfiles.id, id));
        return { id, action: "updated" };
      } else {
        const newId = generateId("stk");
        await db.insert(stakeholderProfiles).values({ id: newId, ...fields });
        return { id: newId, action: "created" };
      }
    }),

  /**
   * Get all stakeholder profiles for a venture.
   */
  getProfiles: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      return db
        .select()
        .from(stakeholderProfiles)
        .where(eq(stakeholderProfiles.ventureId, input.ventureId))
        .orderBy(stakeholderProfiles.stakeholderType);
    }),

  /**
   * Delete a stakeholder profile.
   */
  deleteProfile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(stakeholderProfiles).where(eq(stakeholderProfiles.id, input.id));
      return { success: true };
    }),

  /**
   * Get stakeholder alignment analysis for a venture.
   * Returns alignment scores, conflict risks, and recommendations.
   */
  getAlignmentAnalysis: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const profiles = await db
        .select()
        .from(stakeholderProfiles)
        .where(eq(stakeholderProfiles.ventureId, input.ventureId));

      if (profiles.length === 0) {
        return {
          overallAlignment: 0,
          missionAlignmentAvg: 0,
          financialAlignmentAvg: 0,
          highConflictCount: 0,
          byType: {},
          recommendations: ["Add stakeholder profiles to generate alignment analysis"],
        };
      }

      const withScores = profiles.filter(p => p.missionAlignment !== null);
      const missionAlignmentAvg = withScores.length > 0
        ? Math.round(withScores.reduce((s, p) => s + (p.missionAlignment ?? 0), 0) / withScores.length)
        : 0;

      const withFinancial = profiles.filter(p => p.financialAlignment !== null);
      const financialAlignmentAvg = withFinancial.length > 0
        ? Math.round(withFinancial.reduce((s, p) => s + (p.financialAlignment ?? 0), 0) / withFinancial.length)
        : 0;

      const overallAlignment = Math.round((missionAlignmentAvg * 0.6) + (financialAlignmentAvg * 0.4));
      const highConflictCount = profiles.filter(p => p.conflictRisk === "High").length;

      // Group by type
      const byType: Record<string, { count: number; avgMissionAlignment: number; avgFinancialAlignment: number }> = {};
      for (const profile of profiles) {
        if (!byType[profile.stakeholderType]) {
          byType[profile.stakeholderType] = { count: 0, avgMissionAlignment: 0, avgFinancialAlignment: 0 };
        }
        byType[profile.stakeholderType].count++;
        byType[profile.stakeholderType].avgMissionAlignment += (profile.missionAlignment ?? 0);
        byType[profile.stakeholderType].avgFinancialAlignment += (profile.financialAlignment ?? 0);
      }
      for (const type of Object.keys(byType)) {
        byType[type].avgMissionAlignment = Math.round(byType[type].avgMissionAlignment / byType[type].count);
        byType[type].avgFinancialAlignment = Math.round(byType[type].avgFinancialAlignment / byType[type].count);
      }

      // Generate recommendations
      const recommendations: string[] = [];
      if (missionAlignmentAvg < 60) {
        recommendations.push("Overall mission alignment is below threshold. Conduct stakeholder alignment workshops.");
      }
      if (highConflictCount > 0) {
        recommendations.push(`${highConflictCount} high-conflict stakeholder(s) identified. Develop conflict resolution plans.`);
      }
      if (!profiles.some(p => p.stakeholderType === "Employee")) {
        recommendations.push("No employee stakeholders mapped. Add employee profiles to assess internal mission alignment.");
      }
      if (!profiles.some(p => p.stakeholderType === "Community")) {
        recommendations.push("No community stakeholders mapped. Consider community impact assessment.");
      }
      if (recommendations.length === 0) {
        recommendations.push("Stakeholder alignment is healthy. Continue regular engagement and monitoring.");
      }

      return {
        overallAlignment,
        missionAlignmentAvg,
        financialAlignmentAvg,
        highConflictCount,
        byType,
        recommendations,
        profiles,
      };
    }),

  /**
   * Get the Stakeholder Alignment Framework — structured methodology.
   */
  getFramework: publicProcedure.query(async () => {
    return {
      title: "Stakeholder Alignment Framework",
      subtitle: "Mapping, Scoring, and Managing Stakeholder Incentives",
      description: "A systematic approach to understanding and managing stakeholder alignment with mission and financial goals, preventing 'Stakeholder Misalignment' failure pattern.",
      principles: [
        {
          id: "p1",
          title: "Incentive Transparency",
          description: "Understand what each stakeholder truly wants — not just what they say they want",
          guidance: "Map primary incentives (financial return, impact, status, learning, network) for each stakeholder type. Misalignment often stems from unstated incentives.",
        },
        {
          id: "p2",
          title: "Mission Alignment Scoring",
          description: "Quantify alignment to enable monitoring and early warning",
          guidance: "Score each stakeholder 0-100 on mission alignment. Scores below 50 require active management. Scores below 30 represent existential risk.",
        },
        {
          id: "p3",
          title: "Conflict Risk Assessment",
          description: "Identify potential conflicts before they become crises",
          guidance: "Assess conflict risk (Low/Medium/High) for each stakeholder. High-risk stakeholders need proactive engagement and governance protections.",
        },
        {
          id: "p4",
          title: "Regular Re-assessment",
          description: "Stakeholder alignment changes over time — monitor continuously",
          guidance: "Re-assess alignment quarterly. Trigger re-assessment after major events (funding rounds, leadership changes, strategic pivots).",
        },
      ],
      stakeholderTypes: [
        {
          type: "Founder",
          primaryIncentives: ["Mission impact", "Legacy", "Learning", "Financial security"],
          alignmentRisks: ["Founder fatigue", "Lifestyle creep", "Exit pressure from investors"],
          managementStrategies: ["Regular mission reconnection rituals", "Founder peer networks", "Clear personal financial planning"],
        },
        {
          type: "Investor",
          primaryIncentives: ["Financial return", "Portfolio impact", "Reputation", "Learning"],
          alignmentRisks: ["Return pressure", "Timeline misalignment", "Mission drift pressure"],
          managementStrategies: ["Impact-first term sheets", "Mission-aligned investor selection", "Regular impact reporting"],
        },
        {
          type: "Employee",
          primaryIncentives: ["Purpose", "Learning", "Financial security", "Community"],
          alignmentRisks: ["Burnout", "Compensation gap vs commercial sector", "Mission fatigue"],
          managementStrategies: ["Mission storytelling", "Competitive compensation", "Employee ownership (ESOP)", "Wellbeing programmes"],
        },
        {
          type: "Customer",
          primaryIncentives: ["Product value", "Impact participation", "Community", "Status"],
          alignmentRisks: ["Price sensitivity", "Greenwashing backlash", "Competitor alternatives"],
          managementStrategies: ["Transparent impact reporting", "Community building", "Co-creation programmes"],
        },
        {
          type: "Community",
          primaryIncentives: ["Local benefit", "Environmental protection", "Economic development", "Voice"],
          alignmentRisks: ["Broken promises", "Gentrification effects", "Environmental harm"],
          managementStrategies: ["Community advisory board", "Local hiring commitments", "Regular community reporting"],
        },
        {
          type: "Board",
          primaryIncentives: ["Governance quality", "Reputation", "Impact", "Network"],
          alignmentRisks: ["Fiduciary vs mission tension", "Groupthink", "Passive oversight"],
          managementStrategies: ["Mission-first board charter", "Regular mission alignment reviews", "Board diversity"],
        },
      ],
      assessmentProcess: [
        { step: 1, title: "Identify All Stakeholders", description: "Map every stakeholder group that influences or is influenced by the venture" },
        { step: 2, title: "Profile Primary Incentives", description: "For each stakeholder, document their primary incentive (what they truly want)" },
        { step: 3, title: "Score Mission Alignment", description: "Rate 0-100: how well does their incentive align with the venture mission?" },
        { step: 4, title: "Score Financial Alignment", description: "Rate 0-100: how well does their incentive align with financial sustainability?" },
        { step: 5, title: "Assess Conflict Risk", description: "Identify potential conflicts between stakeholder incentives and mission" },
        { step: 6, title: "Develop Engagement Plans", description: "Create specific strategies to maintain or improve alignment for each stakeholder" },
        { step: 7, title: "Monitor and Re-assess", description: "Track alignment scores quarterly and update after major events" },
      ],
    };
  }),
});

// ── Board Decision Audit Trail Router ────────────────────────────────────────
export const boardDecisionsRouter = router({
  /**
   * List all board decisions (optionally filtered by ventureId).
   */
  list: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const rows = await db.execute(
        input.ventureId
          ? sql`SELECT * FROM board_decisions WHERE venture_id = ${input.ventureId} ORDER BY decision_date DESC`
          : sql`SELECT * FROM board_decisions ORDER BY decision_date DESC`
      );
      return (rows as any).rows ?? rows ?? [];
    }),

  /**
   * Create or update a board decision.
   */
  upsert: protectedProcedure
    .input(z.object({
      id: z.string().optional(),
      ventureId: z.string(),
      ventureName: z.string(),
      decisionTitle: z.string(),
      decisionType: z.string().optional().default("General"),
      description: z.string().optional(),
      rationale: z.string().optional(),
      missionAlignmentScore: z.number().min(0).max(100).optional().default(50),
      financialImpact: z.string().optional().default("None"),
      strategicImpact: z.string().optional().default("None"),
      decisionDate: z.string(),
      decisionStatus: z.string().optional().default("Pending"),
      votesFor: z.number().optional().default(0),
      votesAgainst: z.number().optional().default(0),
      votesAbstain: z.number().optional().default(0),
      totalBoardMembers: z.number().optional().default(5),
      proposedBy: z.string().optional(),
      approvedBy: z.string().optional(),
      implementationDeadline: z.string().optional(),
      implementationStatus: z.string().optional().default("Not Started"),
      notes: z.string().optional(),
      tags: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const id = input.id || generateId("bd");
      const quorumMet = input.totalBoardMembers
        ? (input.votesFor! + input.votesAgainst! + input.votesAbstain!) >= Math.ceil(input.totalBoardMembers / 2)
        : false;
      await db.execute(sql`
        INSERT INTO board_decisions (
          id, venture_id, venture_name, decision_title, decision_type,
          description, rationale, mission_alignment_score, financial_impact,
          strategic_impact, decision_date, decision_status,
          votes_for, votes_against, votes_abstain, total_board_members, quorum_met,
          proposed_by, approved_by, implementation_deadline, implementation_status,
          notes, tags
        ) VALUES (
          ${id}, ${input.ventureId}, ${input.ventureName}, ${input.decisionTitle},
          ${input.decisionType}, ${input.description ?? null}, ${input.rationale ?? null},
          ${input.missionAlignmentScore}, ${input.financialImpact}, ${input.strategicImpact},
          ${input.decisionDate}, ${input.decisionStatus},
          ${input.votesFor}, ${input.votesAgainst}, ${input.votesAbstain},
          ${input.totalBoardMembers}, ${quorumMet},
          ${input.proposedBy ?? null}, ${input.approvedBy ?? null},
          ${input.implementationDeadline ?? null}, ${input.implementationStatus},
          ${input.notes ?? null}, ${input.tags ?? null}
        )
        ON DUPLICATE KEY UPDATE
          decision_title = VALUES(decision_title),
          decision_type = VALUES(decision_type),
          description = VALUES(description),
          rationale = VALUES(rationale),
          mission_alignment_score = VALUES(mission_alignment_score),
          financial_impact = VALUES(financial_impact),
          strategic_impact = VALUES(strategic_impact),
          decision_date = VALUES(decision_date),
          decision_status = VALUES(decision_status),
          votes_for = VALUES(votes_for),
          votes_against = VALUES(votes_against),
          votes_abstain = VALUES(votes_abstain),
          total_board_members = VALUES(total_board_members),
          quorum_met = VALUES(quorum_met),
          proposed_by = VALUES(proposed_by),
          approved_by = VALUES(approved_by),
          implementation_deadline = VALUES(implementation_deadline),
          implementation_status = VALUES(implementation_status),
          notes = VALUES(notes),
          tags = VALUES(tags),
          updated_at = CURRENT_TIMESTAMP
      `);
      return { id, success: true };
    }),

  /**
   * Delete a board decision by ID.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.execute(sql`DELETE FROM board_decisions WHERE id = ${input.id}`);
      return { success: true };
    }),
});

// ── Acquisition Readiness Alerts Router ──────────────────────────────────────
export const acquisitionReadinessRouter = router({
  /**
   * Get all acquisition readiness alerts, optionally filtered by venture.
   */
  getAlerts: publicProcedure
    .input(z.object({
      ventureId: z.string().optional(),
      status: z.string().optional().default("Active"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const rows = await db.execute(
        input.ventureId
          ? sql`SELECT * FROM acquisition_readiness_alerts WHERE venture_id = ${input.ventureId} AND status = ${input.status} ORDER BY created_at DESC`
          : sql`SELECT * FROM acquisition_readiness_alerts WHERE status = ${input.status} ORDER BY created_at DESC`
      );
      return (rows as any).rows ?? rows ?? [];
    }),

  /**
   * Get acquisition readiness score for a venture.
   */
  getScore: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const rows = await db.execute(
        sql`SELECT * FROM acquisition_readiness_scores WHERE venture_id = ${input.ventureId} ORDER BY recorded_at DESC LIMIT 1`
      );
      const data = (rows as any).rows ?? rows ?? [];
      return data[0] ?? null;
    }),

  /**
   * Record an acquisition readiness score and auto-generate alerts.
   */
  recordScore: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      ventureName: z.string(),
      financialAttractiveness: z.number().min(0).max(100),
      ipValue: z.number().min(0).max(100),
      marketPosition: z.number().min(0).max(100),
      teamQuality: z.number().min(0).max(100),
      missionProtectionStrength: z.number().min(0).max(100),
      governanceMaturity: z.number().min(0).max(100),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Calculate overall score (weighted)
      const overall = Math.round(
        input.financialAttractiveness * 0.20 +
        input.ipValue * 0.20 +
        input.marketPosition * 0.15 +
        input.teamQuality * 0.15 +
        input.missionProtectionStrength * 0.20 +
        input.governanceMaturity * 0.10
      );

      // Determine acquisition risk level
      // High financial attractiveness + low mission protection = high risk
      const riskScore = input.financialAttractiveness * 0.4 + input.ipValue * 0.3 + input.marketPosition * 0.3;
      const protectionScore = input.missionProtectionStrength * 0.5 + input.governanceMaturity * 0.5;
      const netRisk = riskScore - protectionScore;
      const riskLevel = netRisk > 30 ? "Critical" : netRisk > 10 ? "High" : netRisk > -10 ? "Medium" : "Low";

      const scoreId = generateId("ars");
      await db.execute(sql`
        INSERT INTO acquisition_readiness_scores (
          id, venture_id, overall_score, financial_attractiveness, ip_value,
          market_position, team_quality, mission_protection_strength,
          governance_maturity, acquisition_risk_level, notes
        ) VALUES (
          ${scoreId}, ${input.ventureId}, ${overall},
          ${input.financialAttractiveness}, ${input.ipValue},
          ${input.marketPosition}, ${input.teamQuality},
          ${input.missionProtectionStrength}, ${input.governanceMaturity},
          ${riskLevel}, ${input.notes ?? null}
        )
      `);

      // Auto-generate alerts based on trigger conditions
      const alerts: { type: string; severity: string; title: string; description: string; action: string; trigger: number; threshold: number }[] = [];

      if (input.financialAttractiveness > 75 && input.missionProtectionStrength < 50) {
        alerts.push({
          type: "HighValueLowProtection",
          severity: "Critical",
          title: "High-Value Target with Weak Mission Protection",
          description: `${input.ventureName} scores ${input.financialAttractiveness}/100 on financial attractiveness but only ${input.missionProtectionStrength}/100 on mission protection. This combination makes the venture highly vulnerable to predatory acquisition.`,
          action: "Immediately strengthen constitutional governance: add founder veto rights, mission lock clauses, and poison pill provisions before the next funding round.",
          trigger: input.financialAttractiveness,
          threshold: 75,
        });
      }

      if (input.ipValue > 70 && input.governanceMaturity < 40) {
        alerts.push({
          type: "HighIpLowGovernance",
          severity: "High",
          title: "High IP Value with Immature Governance",
          description: `${input.ventureName} has significant IP value (${input.ipValue}/100) but weak governance structures (${input.governanceMaturity}/100). IP-rich ventures with governance gaps are prime acquisition targets.`,
          action: "Establish IP holding structure, file defensive patents, and implement board governance protocols before IP portfolio grows further.",
          trigger: input.ipValue,
          threshold: 70,
        });
      }

      if (input.marketPosition > 65 && input.missionProtectionStrength < 60) {
        alerts.push({
          type: "MarketLeaderVulnerable",
          severity: "High",
          title: "Market Leadership Without Mission Protection",
          description: `${input.ventureName} is achieving strong market position (${input.marketPosition}/100) but lacks proportional mission protection (${input.missionProtectionStrength}/100). Market leaders attract strategic acquirers.`,
          action: "Implement stakeholder governance model and community ownership structure to make mission-hostile acquisition structurally difficult.",
          trigger: input.marketPosition,
          threshold: 65,
        });
      }

      if (overall > 70 && protectionScore < 50) {
        alerts.push({
          type: "OverallAcquisitionRisk",
          severity: riskLevel as any,
          title: `Overall Acquisition Risk: ${riskLevel}`,
          description: `${input.ventureName} has an overall readiness score of ${overall}/100 with a ${riskLevel.toLowerCase()} acquisition risk profile. The venture is becoming increasingly attractive to potential acquirers.`,
          action: "Conduct a full mission protection audit and implement the Constitutional Governance framework before the next major milestone.",
          trigger: overall,
          threshold: 70,
        });
      }

      // Insert auto-generated alerts
      for (const alert of alerts) {
        const alertId = generateId("ara");
        await db.execute(sql`
          INSERT INTO acquisition_readiness_alerts (
            id, venture_id, venture_name, alert_type, severity, title,
            description, trigger_value, threshold_value, recommended_action, status
          ) VALUES (
            ${alertId}, ${input.ventureId}, ${input.ventureName},
            ${alert.type}, ${alert.severity}, ${alert.title},
            ${alert.description}, ${alert.trigger}, ${alert.threshold},
            ${alert.action}, 'Active'
          )
        `);
      }

      return { scoreId, overall, riskLevel, alertsGenerated: alerts.length };
    }),

  /**
   * Acknowledge an acquisition readiness alert.
   */
  acknowledgeAlert: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.execute(sql`
        UPDATE acquisition_readiness_alerts
        SET status = 'Acknowledged', acknowledged_at = CURRENT_TIMESTAMP
        WHERE id = ${input.alertId}
      `);
      return { success: true };
    }),

  /**
   * Resolve an acquisition readiness alert.
   */
  resolveAlert: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.execute(sql`
        UPDATE acquisition_readiness_alerts
        SET status = 'Resolved', resolved_at = CURRENT_TIMESTAMP
        WHERE id = ${input.alertId}
      `);
      return { success: true };
    }),

  /**
   * Get portfolio-wide acquisition risk summary.
   */
  getPortfolioRisk: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const alertRows = await db.execute(sql`
      SELECT venture_id, venture_name, severity, COUNT(*) as alert_count
      FROM acquisition_readiness_alerts
      WHERE status = 'Active'
      GROUP BY venture_id, venture_name, severity
      ORDER BY CASE severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END, venture_name
    `);
    const scoreRows = await db.execute(sql`
      SELECT venture_id, overall_score, acquisition_risk_level, recorded_at
      FROM acquisition_readiness_scores
      ORDER BY recorded_at DESC
    `);
    // De-duplicate to get latest per venture in JS
    const allScores = (scoreRows as any).rows ?? scoreRows ?? [];
    const latestByVenture = new Map<string, any>();
    for (const row of allScores) {
      if (!latestByVenture.has(row.venture_id)) {
        latestByVenture.set(row.venture_id, row);
      }
    }
    return {
      alerts: (alertRows as any).rows ?? alertRows ?? [],
      scores: Array.from(latestByVenture.values()),
    };
  }),

  /**
   * Return the acquisition readiness assessment framework.
   */
  getFramework: publicProcedure.query(() => {
    return {
      dimensions: [
        {
          key: "financialAttractiveness",
          label: "Financial Attractiveness",
          weight: 0.20,
          description: "Revenue growth, margins, runway, and financial health make the venture attractive to acquirers.",
          highRiskThreshold: 75,
          protectiveActions: ["Avoid premature revenue disclosure", "Structure revenue as mission-tied contracts", "Implement revenue sharing with community stakeholders"],
        },
        {
          key: "ipValue",
          label: "IP & Technology Value",
          weight: 0.20,
          description: "Patents, trade secrets, proprietary technology, and data assets that acquirers covet.",
          highRiskThreshold: 70,
          protectiveActions: ["Establish IP holding entity separate from operating company", "License IP to mission-aligned organisations", "File defensive patents to create IP moat"],
        },
        {
          key: "marketPosition",
          label: "Market Position",
          weight: 0.15,
          description: "Market share, brand recognition, and competitive positioning that strategic acquirers value.",
          highRiskThreshold: 65,
          protectiveActions: ["Build community ownership model", "Establish cooperative or stewardship structure", "Create stakeholder governance to complicate hostile takeover"],
        },
        {
          key: "teamQuality",
          label: "Team Quality",
          weight: 0.15,
          description: "Talent density and expertise that acquirers seek through acqui-hire strategies.",
          highRiskThreshold: 80,
          protectiveActions: ["Implement long-term mission-aligned equity vesting", "Create team ownership stake in mission outcomes", "Establish team governance rights in constitutional documents"],
        },
        {
          key: "missionProtectionStrength",
          label: "Mission Protection Strength",
          weight: 0.20,
          description: "Constitutional governance, founder veto rights, and structural protections against mission-hostile acquisition.",
          highRiskThreshold: 40, // Low score = high risk
          protectiveActions: ["Implement founder veto rights on mission-critical decisions", "Add mission lock clause to articles of association", "Establish poison pill provisions for hostile acquisition attempts"],
        },
        {
          key: "governanceMaturity",
          label: "Governance Maturity",
          weight: 0.10,
          description: "Board composition, decision-making processes, and governance structures that protect or expose the mission.",
          highRiskThreshold: 40, // Low score = high risk
          protectiveActions: ["Establish mission-aligned board majority", "Implement stakeholder advisory council with governance rights", "Create independent mission guardian role"],
        },
      ],
      riskLevels: {
        Critical: { color: "#dc2626", description: "Immediate action required — venture is highly vulnerable to mission-hostile acquisition" },
        High: { color: "#ea580c", description: "Significant risk — strengthen mission protection before next funding milestone" },
        Medium: { color: "#d97706", description: "Moderate risk — implement protective measures within 6 months" },
        Low: { color: "#16a34a", description: "Well-protected — continue monitoring and maintain governance standards" },
      },
    };
  }),
});
