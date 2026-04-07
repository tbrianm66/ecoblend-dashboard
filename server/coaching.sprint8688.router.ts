/**
 * Coaching Module — Sprint 86-88 Router
 *
 * Sprint 86: Founder Self-Assessment Portal
 *   - selfAssessment.submit       — founder submits 5-dimension self-score
 *   - selfAssessment.list         — list self-assessments for a founder
 *   - selfAssessment.pending      — list all pending assessments (studio view)
 *   - selfAssessment.approve      — coach approves and optionally creates PRL record
 *   - selfAssessment.reject       — coach rejects with notes
 *
 * Sprint 87: Cohort Benchmarking
 *   - cohortBenchmark.get         — avg PRL per VRL stage (anonymised) + founder's own trend
 *
 * Sprint 88: Commitment Template Library
 *   - templates.list              — list templates with optional vrlStage/category filter
 *   - templates.search            — full-text search across title/description/tags
 *   - templates.create            — create a new template
 *   - templates.update            — update an existing template
 *   - templates.delete            — soft-delete (remove) a template
 *   - templates.applyToFounder    — create a commitment from a template for a founder
 *   - templates.seed              — seed default templates (admin only, idempotent)
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  founderSelfAssessments,
  commitmentTemplates,
  coachingPrl,
  coachingCommitments,
  founders,
} from "../drizzle/schema";
import { eq, and, desc, like, or, isNull, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeSelfScore(dims: {
  strategicClarity: number;
  marketValidation: number;
  teamCapability: number;
  operationalExecution: number;
  investorPreparedness: number;
}): number {
  return (
    dims.strategicClarity * 0.20 +
    dims.marketValidation * 0.25 +
    dims.teamCapability * 0.20 +
    dims.operationalExecution * 0.20 +
    dims.investorPreparedness * 0.15
  );
}

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}

// ── Default commitment templates by VRL stage ─────────────────────────────────

const DEFAULT_TEMPLATES = [
  // VRL Stage 1 — Idea
  { vrlStage: 1, category: "market_validation", priority: "high" as const, durationDays: 7, title: "Conduct 5 customer discovery interviews", description: "Interview 5 potential customers to validate the core problem hypothesis. Document key insights and quotes.", tags: ["discovery", "interviews", "validation"] },
  { vrlStage: 1, category: "strategy", priority: "high" as const, durationDays: 5, title: "Define the problem statement in one sentence", description: "Articulate the core problem your venture solves in a single, clear sentence that a non-expert can understand.", tags: ["strategy", "clarity", "positioning"] },
  { vrlStage: 1, category: "market_validation", priority: "medium" as const, durationDays: 7, title: "Identify 3 direct competitors and 3 indirect competitors", description: "Research and document your competitive landscape. For each competitor, note their key differentiator and pricing.", tags: ["competitive", "research", "market"] },
  { vrlStage: 1, category: "strategy", priority: "medium" as const, durationDays: 10, title: "Complete the Business Model Canvas", description: "Fill in all 9 blocks of the Business Model Canvas. Focus on the customer segment and value proposition first.", tags: ["bmc", "strategy", "planning"] },
  { vrlStage: 1, category: "investor", priority: "low" as const, durationDays: 14, title: "Draft a 10-slide pitch deck outline", description: "Create a slide-by-slide outline covering: problem, solution, market, product, traction, team, financials, ask.", tags: ["pitch", "investor", "deck"] },
  // VRL Stage 2 — Validation
  { vrlStage: 2, category: "market_validation", priority: "critical" as const, durationDays: 14, title: "Run 3 landing page experiments with A/B test", description: "Build two landing page variants and drive 100+ visitors to each. Measure sign-up conversion rate.", tags: ["experiment", "landing-page", "conversion"] },
  { vrlStage: 2, category: "product", priority: "high" as const, durationDays: 14, title: "Build and test a clickable prototype with 10 users", description: "Create a Figma or low-code prototype of your core user flow. Conduct usability tests with 10 target users.", tags: ["prototype", "ux", "testing"] },
  { vrlStage: 2, category: "market_validation", priority: "high" as const, durationDays: 7, title: "Secure 3 letters of intent from potential customers", description: "Obtain written LOIs from 3 potential customers confirming their intent to purchase or pilot your solution.", tags: ["loi", "sales", "validation"] },
  { vrlStage: 2, category: "team", priority: "medium" as const, durationDays: 21, title: "Define roles and responsibilities for founding team", description: "Create a RACI matrix for the founding team. Identify skill gaps and document a hiring plan for the next 6 months.", tags: ["team", "roles", "hiring"] },
  { vrlStage: 2, category: "financial", priority: "medium" as const, durationDays: 10, title: "Build a 12-month financial model", description: "Create a bottom-up financial model with revenue assumptions, COGS, burn rate, and runway calculations.", tags: ["financial", "model", "planning"] },
  // VRL Stage 3 — Build
  { vrlStage: 3, category: "product", priority: "critical" as const, durationDays: 30, title: "Launch MVP to 20 beta users", description: "Deploy your minimum viable product to a closed beta group of 20 users. Collect structured feedback via surveys.", tags: ["mvp", "launch", "beta"] },
  { vrlStage: 3, category: "market_validation", priority: "high" as const, durationDays: 14, title: "Achieve first paying customer", description: "Convert at least one beta user to a paying customer at your target price point. Document the sales process.", tags: ["revenue", "sales", "milestone"] },
  { vrlStage: 3, category: "operations", priority: "high" as const, durationDays: 21, title: "Establish weekly sprint cadence with team", description: "Implement a weekly sprint cycle with Monday planning, daily standups, and Friday retrospectives.", tags: ["agile", "operations", "process"] },
  { vrlStage: 3, category: "investor", priority: "medium" as const, durationDays: 14, title: "Update pitch deck with traction metrics", description: "Revise your pitch deck to include real traction data: user numbers, retention, NPS, and revenue.", tags: ["pitch", "traction", "investor"] },
  // VRL Stage 4 — Scale
  { vrlStage: 4, category: "operations", priority: "critical" as const, durationDays: 30, title: "Document and automate 3 core operational processes", description: "Identify your 3 most time-consuming manual processes. Document them as SOPs and automate at least one.", tags: ["automation", "sop", "operations"] },
  { vrlStage: 4, category: "financial", priority: "high" as const, durationDays: 14, title: "Prepare investor-ready data room", description: "Compile a complete data room including cap table, financial model, legal docs, IP register, and customer contracts.", tags: ["fundraising", "data-room", "investor"] },
  { vrlStage: 4, category: "team", priority: "high" as const, durationDays: 30, title: "Complete first senior hire", description: "Define the JD, run the hiring process, and make an offer for your first senior hire (CTO, CMO, or COO).", tags: ["hiring", "team", "leadership"] },
];

// ── Sprint 86: Self-Assessment Router ─────────────────────────────────────────

export const selfAssessmentRouter = router({
  submit: protectedProcedure
    .input(z.object({
      founderId: z.number().int().positive(),
      weekOf: z.string().optional(),
      strategicClarity: z.number().int().min(0).max(100),
      marketValidation: z.number().int().min(0).max(100),
      teamCapability: z.number().int().min(0).max(100),
      operationalExecution: z.number().int().min(0).max(100),
      investorPreparedness: z.number().int().min(0).max(100),
      founderNotes: z.string().max(1000).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const weekOf = input.weekOf ?? getWeekStart();
      const composite = computeSelfScore(input);

      const id = `sa-${randomUUID()}`;
      await db.insert(founderSelfAssessments).values({
        id,
        founderId: input.founderId,
        weekOf,
        strategicClarity: input.strategicClarity,
        marketValidation: input.marketValidation,
        teamCapability: input.teamCapability,
        operationalExecution: input.operationalExecution,
        investorPreparedness: input.investorPreparedness,
        compositeScore: composite.toFixed(2) as unknown as string,
        founderNotes: input.founderNotes ?? null,
        status: "pending",
      });

      return { id, compositeScore: parseFloat(composite.toFixed(2)), weekOf };
    }),

  list: protectedProcedure
    .input(z.object({
      founderId: z.number().int().positive(),
      limit: z.number().int().min(1).max(52).default(10),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db
        .select()
        .from(founderSelfAssessments)
        .where(eq(founderSelfAssessments.founderId, input.founderId))
        .orderBy(desc(founderSelfAssessments.createdAt))
        .limit(input.limit);
    }),

  pending: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db
        .select()
        .from(founderSelfAssessments)
        .where(eq(founderSelfAssessments.status, "pending"))
        .orderBy(desc(founderSelfAssessments.createdAt))
        .limit(input.limit);
    }),

  approve: protectedProcedure
    .input(z.object({
      assessmentId: z.string(),
      reviewedBy: z.string().max(128),
      reviewNotes: z.string().max(500).optional(),
      createPrlRecord: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [assessment] = await db
        .select()
        .from(founderSelfAssessments)
        .where(eq(founderSelfAssessments.id, input.assessmentId))
        .limit(1);

      if (!assessment) throw new Error("Assessment not found");

      let prlRecordId: string | null = null;

      if (input.createPrlRecord) {
        prlRecordId = `prl-sa-${randomUUID()}`;
        const score = parseFloat(assessment.compositeScore as unknown as string);
        const riskLevel =
          score >= 75 ? "LOW" : score >= 55 ? "MEDIUM" : score >= 40 ? "HIGH" : "CRITICAL";

        await db.insert(coachingPrl).values({
          id: prlRecordId,
          founderId: assessment.founderId,
          week: assessment.weekOf as unknown as Date,
          score: assessment.compositeScore as unknown as string,
          riskLevel,
          trend: "stable",
        });
      }

      await db
        .update(founderSelfAssessments)
        .set({
          status: "approved",
          reviewedBy: input.reviewedBy,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes ?? null,
          prlRecordId,
        })
        .where(eq(founderSelfAssessments.id, input.assessmentId));

      return { success: true, prlRecordId };
    }),

  reject: protectedProcedure
    .input(z.object({
      assessmentId: z.string(),
      reviewedBy: z.string().max(128),
      reviewNotes: z.string().max(500),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db
        .update(founderSelfAssessments)
        .set({
          status: "rejected",
          reviewedBy: input.reviewedBy,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes,
        })
        .where(eq(founderSelfAssessments.id, input.assessmentId));

      return { success: true };
    }),
});

// ── Sprint 87: Cohort Benchmarking Router ─────────────────────────────────────

export const cohortBenchmarkRouter = router({
  get: protectedProcedure
    .input(z.object({
      founderId: z.number().int().positive(),
      vrlStage: z.number().int().min(1).max(9),
      weeks: z.number().int().min(1).max(26).default(6),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      // Get all PRL records for founders at the same VRL stage
      // We join via founders table to get vrl_stage
      const allPrlRecords = await db
        .select({
          founderId: coachingPrl.founderId,
          weekOf: coachingPrl.weekOf,
          score: coachingPrl.score,
        })
        .from(coachingPrl)
        .orderBy(desc(coachingPrl.weekOf))
        .limit(500);

      // Get the founder's own PRL history
      const founderPrl = allPrlRecords
        .filter((r) => r.founderId === input.founderId)
        .slice(0, input.weeks);

      // Compute cohort weekly averages (all founders, anonymised)
      const weekMap = new Map<string, number[]>();
      for (const r of allPrlRecords) {
        const week = r.weekOf as unknown as string;
        const score = parseFloat(r.score as unknown as string);
        if (!weekMap.has(week)) weekMap.set(week, []);
        weekMap.get(week)!.push(score);
      }

      // Get the weeks from the founder's own history
      const relevantWeeks = founderPrl.map((r) => r.weekOf as unknown as string);

      const cohortAverages = relevantWeeks.map((week) => {
        const scores = weekMap.get(week) ?? [];
        const avg = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null;
        return { week, cohortAvg: avg ? parseFloat(avg.toFixed(2)) : null, sampleSize: scores.length };
      });

      const founderTrend = founderPrl.map((r) => ({
        week: r.weekOf as unknown as string,
        score: parseFloat(r.score as unknown as string),
      }));

      // Compute overall cohort stats for the current week
      const latestWeek = relevantWeeks[0];
      const latestCohortScores = weekMap.get(latestWeek ?? "") ?? [];
      const cohortMin = latestCohortScores.length > 0 ? Math.min(...latestCohortScores) : null;
      const cohortMax = latestCohortScores.length > 0 ? Math.max(...latestCohortScores) : null;
      const cohortMedian = latestCohortScores.length > 0
        ? latestCohortScores.sort((a, b) => a - b)[Math.floor(latestCohortScores.length / 2)]
        : null;

      return {
        founderTrend,
        cohortAverages,
        cohortStats: {
          sampleSize: latestCohortScores.length,
          min: cohortMin,
          max: cohortMax,
          median: cohortMedian,
          vrlStage: input.vrlStage,
        },
      };
    }),
});

// ── Sprint 88: Commitment Template Library Router ─────────────────────────────

export const commitmentTemplatesRouter = router({
  list: protectedProcedure
    .input(z.object({
      vrlStage: z.number().int().min(1).max(9).optional(),
      category: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [];
      if (input.vrlStage !== undefined) {
        conditions.push(eq(commitmentTemplates.vrlStage, input.vrlStage));
      }
      if (input.category) {
        conditions.push(eq(commitmentTemplates.category, input.category));
      }

      const query = db
        .select()
        .from(commitmentTemplates)
        .orderBy(desc(commitmentTemplates.usageCount), commitmentTemplates.vrlStage)
        .limit(input.limit);

      if (conditions.length > 0) {
        return query.where(and(...conditions));
      }
      return query;
    }),

  search: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(200),
      vrlStage: z.number().int().min(1).max(9).optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const searchTerm = `%${input.query}%`;
      const textCondition = or(
        like(commitmentTemplates.title, searchTerm),
        like(commitmentTemplates.description, searchTerm),
        like(commitmentTemplates.category, searchTerm),
      );

      const conditions = input.vrlStage !== undefined
        ? and(textCondition, eq(commitmentTemplates.vrlStage, input.vrlStage))
        : textCondition;

      return db
        .select()
        .from(commitmentTemplates)
        .where(conditions)
        .orderBy(desc(commitmentTemplates.usageCount))
        .limit(input.limit);
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(3).max(256),
      description: z.string().max(2000).optional(),
      vrlStage: z.number().int().min(1).max(9),
      category: z.string().max(128).optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      durationDays: z.number().int().min(1).max(365).default(7),
      tags: z.array(z.string()).default([]),
      createdBy: z.string().max(128).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const id = `tmpl-${randomUUID()}`;
      await db.insert(commitmentTemplates).values({
        id,
        title: input.title,
        description: input.description ?? null,
        vrlStage: input.vrlStage,
        category: input.category ?? null,
        priority: input.priority,
        durationDays: input.durationDays,
        tags: input.tags,
        isDefault: false,
        createdBy: input.createdBy ?? null,
        usageCount: 0,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(3).max(256).optional(),
      description: z.string().max(2000).optional(),
      vrlStage: z.number().int().min(1).max(9).optional(),
      category: z.string().max(128).optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      durationDays: z.number().int().min(1).max(365).optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...updates } = input;
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined)
      );
      if (Object.keys(filteredUpdates).length === 0) return { success: true };

      await db
        .update(commitmentTemplates)
        .set(filteredUpdates)
        .where(eq(commitmentTemplates.id, id));

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db
        .delete(commitmentTemplates)
        .where(eq(commitmentTemplates.id, input.id));
      return { success: true };
    }),

  applyToFounder: protectedProcedure
    .input(z.object({
      templateId: z.string(),
      founderId: z.number().int().positive(),
      dueDateOffsetDays: z.number().int().min(0).max(365).optional(),
      sessionId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [template] = await db
        .select()
        .from(commitmentTemplates)
        .where(eq(commitmentTemplates.id, input.templateId))
        .limit(1);

      if (!template) throw new Error("Template not found");

      const daysOffset = input.dueDateOffsetDays ?? template.durationDays;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysOffset);

      const commitmentId = `comm-tmpl-${randomUUID()}`;
      await db.insert(coachingCommitments).values({
        id: commitmentId,
        founderId: input.founderId,
        sessionId: input.sessionId ?? null,
        title: template.title,
        description: template.description ?? null,
        dueDate: dueDate.toISOString().split("T")[0],
        priority: template.priority,
        completed: false,
        completedAt: null,
        notes: `Applied from template: ${template.id}`,
      });

      // Increment usage count
      await db
        .update(commitmentTemplates)
        .set({ usageCount: sql`${commitmentTemplates.usageCount} + 1` })
        .where(eq(commitmentTemplates.id, input.templateId));

      return { commitmentId, templateTitle: template.title };
    }),

  seed: protectedProcedure
    .input(z.object({ force: z.boolean().default(false) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      // Check if already seeded
      const existing = await db
        .select({ id: commitmentTemplates.id })
        .from(commitmentTemplates)
        .where(eq(commitmentTemplates.isDefault, true))
        .limit(1);

      if (existing.length > 0 && !input.force) {
        return { seeded: 0, message: "Default templates already exist. Use force=true to re-seed." };
      }

      // Delete existing defaults if force
      if (input.force) {
        await db
          .delete(commitmentTemplates)
          .where(eq(commitmentTemplates.isDefault, true));
      }

      let seeded = 0;
      for (const tmpl of DEFAULT_TEMPLATES) {
        const id = `tmpl-default-${randomUUID()}`;
        await db.insert(commitmentTemplates).values({
          id,
          title: tmpl.title,
          description: tmpl.description,
          vrlStage: tmpl.vrlStage,
          category: tmpl.category,
          priority: tmpl.priority,
          durationDays: tmpl.durationDays,
          tags: tmpl.tags,
          isDefault: true,
          createdBy: "system",
          usageCount: 0,
        });
        seeded++;
      }

      return { seeded, message: `Seeded ${seeded} default templates` };
    }),
});
