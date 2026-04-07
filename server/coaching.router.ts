/**
 * COACHING MODULE V2 — Execution Discipline Engine
 * Architecture: EcoBlendCoachingV2ManusArchitecturePack.docx
 * Spec: BEBUS-COACH-V2-001
 *
 * PRL Formula: (0.4 × completion_rate) + (0.2 × focus_hours) - (0.2 × delay_time) - (0.2 × missed_commitments)
 * Risk Thresholds: HIGH < 40, MEDIUM 40-69, LOW >= 70
 * Trend Logic: current vs 3-week rolling average (±3 threshold)
 * VRL Link: execution_score = PRL.score × prl_weight; adjusted_vrl = base_vrl + execution_score (capped at 100)
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  coachingCoaches,
  coachingCommitments,
  coachingSessions,
  coachingBehaviourMetrics,
  coachingPrl,
  coachingVrlLink,
  coachingInsights,
  founders,
  ventures,
} from "../drizzle/schema";
import { eq, and, desc, asc, sql, lte, gte } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { randomUUID } from "crypto";

// ── PRL Scoring Engine ────────────────────────────────────────────────────────

/**
 * Calculates PRL score from behaviour metrics.
 * Formula: (0.4 × completion_rate) + (0.2 × focus_hours) - (0.2 × delay_time) - (0.2 × missed_commitments)
 * Normalised to 0-100 range.
 */
function calculatePrlScore(metrics: {
  completionRate: number;   // 0-100
  focusHours: number;       // hours per week (normalised: target = 40h → 100 points)
  delayTime: number;        // avg days delayed (0 = no delay, 7+ = max penalty)
  missedCommitments: number; // count of missed commitments this week
}): {
  score: number;
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  completionComponent: number;
  focusComponent: number;
  delayPenalty: number;
  missedPenalty: number;
} {
  // Normalise inputs to 0-100 scale
  const completionNorm = Math.min(100, Math.max(0, metrics.completionRate));
  const focusNorm = Math.min(100, Math.max(0, (metrics.focusHours / 40) * 100));
  const delayNorm = Math.min(100, Math.max(0, (metrics.delayTime / 7) * 100));
  const missedNorm = Math.min(100, Math.max(0, metrics.missedCommitments * 14.3)); // 7 missed = 100

  const completionComponent = 0.4 * completionNorm;
  const focusComponent = 0.2 * focusNorm;
  const delayPenalty = 0.2 * delayNorm;
  const missedPenalty = 0.2 * missedNorm;

  const rawScore = completionComponent + focusComponent - delayPenalty - missedPenalty;
  const score = Math.min(100, Math.max(0, rawScore));

  const riskLevel: "HIGH" | "MEDIUM" | "LOW" =
    score >= 70 ? "LOW" : score >= 40 ? "MEDIUM" : "HIGH";

  return {
    score: Math.round(score * 100) / 100,
    riskLevel,
    completionComponent: Math.round(completionComponent * 100) / 100,
    focusComponent: Math.round(focusComponent * 100) / 100,
    delayPenalty: Math.round(delayPenalty * 100) / 100,
    missedPenalty: Math.round(missedPenalty * 100) / 100,
  };
}

/**
 * Determines PRL trend by comparing current week score to 3-week rolling average.
 * improving: current > avg + 3
 * declining: current < avg - 3
 * stable: otherwise
 */
function calculateTrend(currentScore: number, priorScores: number[]): "improving" | "stable" | "declining" {
  if (priorScores.length === 0) return "stable";
  const avg = priorScores.reduce((a, b) => a + b, 0) / priorScores.length;
  if (currentScore > avg + 3) return "improving";
  if (currentScore < avg - 3) return "declining";
  return "stable";
}

/**
 * Recalculates behaviour metrics for a founder for the given week.
 * Called after any commitment status update.
 */
async function recalculateBehaviourMetrics(
  db: ReturnType<typeof getDb>,
  founderId: number,
  ventureId: string | null,
  week: Date
): Promise<{
  completionRate: number;
  focusHours: number;
  delayTime: number;
  missedCommitments: number;
  totalCommitments: number;
  completedCommitments: number;
}> {
  const weekStr = week.toISOString().split("T")[0];

  // Get all commitments for this founder this week
  const commitments = await db
    .select()
    .from(coachingCommitments)
    .where(
      and(
        eq(coachingCommitments.founderId, founderId),
        eq(coachingCommitments.week, weekStr as unknown as Date)
      )
    );

  const total = commitments.length;
  const completed = commitments.filter((c) => c.status === "complete" && c.coachVerified).length;
  const missed = commitments.filter((c) => c.status === "missed").length;
  const delayed = commitments.filter((c) => c.status === "delayed").length;

  const completionRate = total > 0 ? (completed / total) * 100 : 0;
  const avgDelayDays = delayed > 0 ? delayed * 1.5 : 0; // estimate 1.5 days per delayed task

  // Focus hours: derive from session data for this week
  const sessions = await db
    .select()
    .from(coachingSessions)
    .where(
      and(
        eq(coachingSessions.founderId, founderId),
        eq(coachingSessions.sessionDate, weekStr as unknown as Date)
      )
    );
  const focusHours = sessions.reduce((sum, s) => sum + (s.durationMins || 60) / 60, 0);

  return {
    completionRate: Math.round(completionRate * 100) / 100,
    focusHours: Math.round(focusHours * 10) / 10,
    delayTime: Math.round(avgDelayDays * 10) / 10,
    missedCommitments: missed,
    totalCommitments: total,
    completedCommitments: completed,
  };
}

/**
 * Full PRL recalculation pipeline for a founder:
 * 1. Recalculate BehaviourMetrics
 * 2. Recalculate PRL score + trend
 * 3. Update VRL_Link
 */
async function runPrlPipeline(
  db: ReturnType<typeof getDb>,
  founderId: number,
  ventureId: string | null,
  week: Date
): Promise<{ prlScore: number; riskLevel: string; trend: string }> {
  const weekStr = week.toISOString().split("T")[0];

  // Step 1: Recalculate behaviour metrics
  const metrics = await recalculateBehaviourMetrics(db, founderId, ventureId, week);

  // Upsert behaviour metrics
  const existingMetric = await db
    .select()
    .from(coachingBehaviourMetrics)
    .where(
      and(
        eq(coachingBehaviourMetrics.founderId, founderId),
        eq(coachingBehaviourMetrics.week, weekStr as unknown as Date)
      )
    )
    .limit(1);

  const metricId = existingMetric[0]?.id || randomUUID();
  if (existingMetric.length > 0) {
    await db
      .update(coachingBehaviourMetrics)
      .set({
        completionRate: metrics.completionRate.toString(),
        focusHours: metrics.focusHours.toString(),
        delayTime: metrics.delayTime.toString(),
        missedCommitments: metrics.missedCommitments,
        totalCommitments: metrics.totalCommitments,
        completedCommitments: metrics.completedCommitments,
        calculatedAt: new Date(),
      })
      .where(eq(coachingBehaviourMetrics.id, existingMetric[0].id));
  } else {
    await db.insert(coachingBehaviourMetrics).values({
      id: metricId,
      founderId,
      ventureId,
      week: weekStr as unknown as Date,
      completionRate: metrics.completionRate.toString(),
      focusHours: metrics.focusHours.toString(),
      delayTime: metrics.delayTime.toString(),
      missedCommitments: metrics.missedCommitments,
      totalCommitments: metrics.totalCommitments,
      completedCommitments: metrics.completedCommitments,
      calculatedAt: new Date(),
    });
  }

  // Step 2: Calculate PRL score
  const prlResult = calculatePrlScore(metrics);

  // Get prior 3 weeks of PRL scores for trend calculation
  const priorPrls = await db
    .select({ score: coachingPrl.score })
    .from(coachingPrl)
    .where(eq(coachingPrl.founderId, founderId))
    .orderBy(desc(coachingPrl.week))
    .limit(3);

  const priorScores = priorPrls.map((p) => parseFloat(p.score as unknown as string));
  const trend = calculateTrend(prlResult.score, priorScores);

  // Upsert PRL record
  const existingPrl = await db
    .select()
    .from(coachingPrl)
    .where(
      and(
        eq(coachingPrl.founderId, founderId),
        eq(coachingPrl.week, weekStr as unknown as Date)
      )
    )
    .limit(1);

  const prlId = existingPrl[0]?.id || randomUUID();
  if (existingPrl.length > 0) {
    await db
      .update(coachingPrl)
      .set({
        score: prlResult.score.toString(),
        trend,
        riskLevel: prlResult.riskLevel,
        completionComponent: prlResult.completionComponent.toString(),
        focusComponent: prlResult.focusComponent.toString(),
        delayPenalty: prlResult.delayPenalty.toString(),
        missedPenalty: prlResult.missedPenalty.toString(),
        calculatedAt: new Date(),
      })
      .where(eq(coachingPrl.id, existingPrl[0].id));
  } else {
    await db.insert(coachingPrl).values({
      id: prlId,
      founderId,
      ventureId,
      week: weekStr as unknown as Date,
      score: prlResult.score.toString(),
      trend,
      riskLevel: prlResult.riskLevel,
      completionComponent: prlResult.completionComponent.toString(),
      focusComponent: prlResult.focusComponent.toString(),
      delayPenalty: prlResult.delayPenalty.toString(),
      missedPenalty: prlResult.missedPenalty.toString(),
      calculatedAt: new Date(),
    });
  }

  // Step 3: Update VRL_Link if ventureId is set
  if (ventureId) {
    const existingLink = await db
      .select()
      .from(coachingVrlLink)
      .where(eq(coachingVrlLink.ventureId, ventureId))
      .limit(1);

    const prlWeight = existingLink[0]?.prlWeight
      ? parseFloat(existingLink[0].prlWeight as unknown as string)
      : 0.25;

    const executionScore = prlResult.score * prlWeight;
    const baseVrl = existingLink[0]?.baseVrl
      ? parseFloat(existingLink[0].baseVrl as unknown as string)
      : 50;
    const adjustedVrl = Math.min(100, baseVrl + executionScore);
    const riskFlagged = prlResult.riskLevel === "HIGH";

    if (existingLink.length > 0) {
      await db
        .update(coachingVrlLink)
        .set({
          executionScore: executionScore.toString(),
          adjustedVrl: adjustedVrl.toString(),
          riskFlagged,
          updatedAt: new Date(),
        })
        .where(eq(coachingVrlLink.ventureId, ventureId));
    } else {
      await db.insert(coachingVrlLink).values({
        id: randomUUID(),
        ventureId,
        prlWeight: prlWeight.toString(),
        executionScore: executionScore.toString(),
        baseVrl: baseVrl.toString(),
        adjustedVrl: adjustedVrl.toString(),
        riskFlagged,
        updatedAt: new Date(),
      });
    }
  }

  return { prlScore: prlResult.score, riskLevel: prlResult.riskLevel, trend };
}

// ── AI Coaching Insights ──────────────────────────────────────────────────────

async function generateCoachingInsights(
  db: ReturnType<typeof getDb>,
  founderId: number,
  ventureId: string | null,
  week: Date
): Promise<void> {
  const weekStr = week.toISOString().split("T")[0];

  // Build input payload
  const commitments = await db
    .select()
    .from(coachingCommitments)
    .where(
      and(
        eq(coachingCommitments.founderId, founderId),
        eq(coachingCommitments.week, weekStr as unknown as Date)
      )
    );

  const metrics = await db
    .select()
    .from(coachingBehaviourMetrics)
    .where(
      and(
        eq(coachingBehaviourMetrics.founderId, founderId),
        eq(coachingBehaviourMetrics.week, weekStr as unknown as Date)
      )
    )
    .limit(1);

  const currentPrl = await db
    .select()
    .from(coachingPrl)
    .where(
      and(
        eq(coachingPrl.founderId, founderId),
        eq(coachingPrl.week, weekStr as unknown as Date)
      )
    )
    .limit(1);

  const prlHistory = await db
    .select({ week: coachingPrl.week, score: coachingPrl.score })
    .from(coachingPrl)
    .where(eq(coachingPrl.founderId, founderId))
    .orderBy(desc(coachingPrl.week))
    .limit(12);

  const insightId = randomUUID();

  const payload = {
    founderId,
    week: weekStr,
    commitments: commitments.map((c) => ({
      task: c.task,
      metric: c.metric,
      status: c.status,
    })),
    metrics: metrics[0]
      ? {
          completion_rate: parseFloat(metrics[0].completionRate as unknown as string),
          focus_hours: parseFloat(metrics[0].focusHours as unknown as string),
          delay_time: parseFloat(metrics[0].delayTime as unknown as string),
          missed_commitments: metrics[0].missedCommitments,
        }
      : { completion_rate: 0, focus_hours: 0, delay_time: 0, missed_commitments: 0 },
    prl_score: currentPrl[0] ? parseFloat(currentPrl[0].score as unknown as string) : 0,
    prl_trend: currentPrl[0]?.trend || "stable",
    history: prlHistory.map((p) => ({
      week: p.week,
      prl_score: parseFloat(p.score as unknown as string),
    })),
  };

  // Insert pending record first
  await db.insert(coachingInsights).values({
    id: insightId,
    founderId,
    ventureId,
    week: weekStr as unknown as Date,
    prlScoreAtTime: payload.prl_score.toString(),
    prlTrendAtTime: payload.prl_trend,
    rawPayload: payload,
    status: "pending",
    generatedAt: new Date(),
  });

  try {
    // Call LLM with structured output
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an execution discipline analyst for EcoBlend OS, a venture builder platform. You analyse founder behaviour data and return structured risk, pattern, and recommendation signals. Always respond in valid JSON only. Never add commentary outside the JSON structure. Prioritise founder wellbeing and sustainable performance over raw output metrics.",
        },
        {
          role: "user",
          content: `Analyse this founder's weekly execution data and return a JSON object with exactly three keys: "risks" (array of strings), "patterns" (array of strings), "recommendations" (array of strings). Data: ${JSON.stringify(payload)}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "coaching_insights",
          strict: true,
          schema: {
            type: "object",
            properties: {
              risks: {
                type: "array",
                items: { type: "string" },
                description: "Key execution risks identified from the data",
              },
              patterns: {
                type: "array",
                items: { type: "string" },
                description: "Behavioural patterns observed in the commitment and metric data",
              },
              recommendations: {
                type: "array",
                items: { type: "string" },
                description: "Actionable coaching recommendations for the founder",
              },
            },
            required: ["risks", "patterns", "recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response?.choices?.[0]?.message?.content;
    const parsed = typeof content === "string" ? JSON.parse(content) : content;

    await db
      .update(coachingInsights)
      .set({
        risks: parsed.risks || [],
        patterns: parsed.patterns || [],
        recommendations: parsed.recommendations || [],
        rawResponse: parsed,
        status: "generated",
      })
      .where(eq(coachingInsights.id, insightId));
  } catch (err) {
    await db
      .update(coachingInsights)
      .set({ status: "failed", retryCount: 1 })
      .where(eq(coachingInsights.id, insightId));
  }
}

// ── tRPC Router ───────────────────────────────────────────────────────────────

const coachesRouter = router({
  list: protectedProcedure.query(async () => {
    const db = getDb();
    return db.select().from(coachingCoaches).orderBy(asc(coachingCoaches.name));
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [coach] = await db
        .select()
        .from(coachingCoaches)
        .where(eq(coachingCoaches.id, input.id))
        .limit(1);
      return coach || null;
    }),

  upsert: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        email: z.string().email().optional(),
        type: z.enum(["execution", "strategy", "wellbeing"]).default("execution"),
        rating: z.number().min(0).max(5).optional(),
        availability: z.any().optional(),
        bio: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const id = input.id || randomUUID();
      const existing = await db
        .select()
        .from(coachingCoaches)
        .where(eq(coachingCoaches.id, id))
        .limit(1);

      if (existing.length > 0) {
        await db.update(coachingCoaches).set({ ...input, updatedAt: new Date() }).where(eq(coachingCoaches.id, id));
      } else {
        await db.insert(coachingCoaches).values({ ...input, id, createdAt: new Date(), updatedAt: new Date() });
      }
      return { id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(coachingCoaches).where(eq(coachingCoaches.id, input.id));
      return { success: true };
    }),
});

const commitmentsRouter = router({
  list: protectedProcedure
    .input(z.object({ founderId: z.number(), week: z.string().optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [eq(coachingCommitments.founderId, input.founderId)];
      if (input.week) {
        conditions.push(eq(coachingCommitments.week, input.week as unknown as Date));
      }
      return db
        .select()
        .from(coachingCommitments)
        .where(and(...conditions))
        .orderBy(desc(coachingCommitments.week), asc(coachingCommitments.createdAt));
    }),

  create: protectedProcedure
    .input(
      z.object({
        founderId: z.number(),
        ventureId: z.string().optional(),
        week: z.string(), // ISO date string YYYY-MM-DD
        task: z.string().min(1),
        metric: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const id = randomUUID();
      await db.insert(coachingCommitments).values({
        id,
        founderId: input.founderId,
        ventureId: input.ventureId || null,
        week: input.week as unknown as Date,
        task: input.task,
        metric: input.metric || null,
        status: "pending",
        coachVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { id };
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["pending", "complete", "missed", "delayed"]),
        coachVerified: z.boolean().optional(),
        evidenceNote: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(coachingCommitments)
        .set({
          status: input.status,
          coachVerified: input.coachVerified,
          evidenceNote: input.evidenceNote,
          updatedAt: new Date(),
        })
        .where(eq(coachingCommitments.id, input.id));

      // Trigger PRL recalculation pipeline
      const [commitment] = await db
        .select()
        .from(coachingCommitments)
        .where(eq(coachingCommitments.id, input.id))
        .limit(1);

      if (commitment) {
        await runPrlPipeline(
          db,
          commitment.founderId,
          commitment.ventureId,
          new Date(commitment.week as unknown as string)
        );
      }

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(coachingCommitments).where(eq(coachingCommitments.id, input.id));
      return { success: true };
    }),
});

const sessionsRouter = router({
  list: protectedProcedure
    .input(z.object({ founderId: z.number().optional(), coachId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input.founderId) conditions.push(eq(coachingSessions.founderId, input.founderId));
      if (input.coachId) conditions.push(eq(coachingSessions.coachId, input.coachId));
      return db
        .select()
        .from(coachingSessions)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(coachingSessions.sessionDate));
    }),

  create: protectedProcedure
    .input(
      z.object({
        coachId: z.string(),
        founderId: z.number(),
        ventureId: z.string().optional(),
        sessionDate: z.string(),
        notes: z.string().min(1, "Session notes are required (min 200 chars recommended)"),
        actions: z.array(z.object({ action: z.string(), owner: z.string().optional(), dueDate: z.string().optional() })).optional(),
        sessionType: z.enum(["check_in", "deep_dive", "crisis", "review"]).default("check_in"),
        durationMins: z.number().default(60),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const id = randomUUID();
      await db.insert(coachingSessions).values({
        id,
        coachId: input.coachId,
        founderId: input.founderId,
        ventureId: input.ventureId || null,
        sessionDate: input.sessionDate as unknown as Date,
        notes: input.notes,
        actions: input.actions || [],
        sessionType: input.sessionType,
        durationMins: input.durationMins,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Trigger PRL recalculation after session logged
      const sessionWeek = new Date(input.sessionDate);
      const dayOfWeek = sessionWeek.getDay();
      const diff = sessionWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      sessionWeek.setDate(diff);

      await runPrlPipeline(db, input.founderId, input.ventureId || null, sessionWeek);

      return { id };
    }),

  updateActions: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        actions: z.array(z.object({ action: z.string(), owner: z.string().optional(), dueDate: z.string().optional(), completed: z.boolean().optional() })),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(coachingSessions)
        .set({ actions: input.actions, updatedAt: new Date() })
        .where(eq(coachingSessions.id, input.id));
      return { success: true };
    }),
});

const prlRouter = router({
  getCurrent: protectedProcedure
    .input(z.object({ founderId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [latest] = await db
        .select()
        .from(coachingPrl)
        .where(eq(coachingPrl.founderId, input.founderId))
        .orderBy(desc(coachingPrl.week))
        .limit(1);
      return latest || null;
    }),

  getHistory: protectedProcedure
    .input(z.object({ founderId: z.number(), weeks: z.number().default(12) }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(coachingPrl)
        .where(eq(coachingPrl.founderId, input.founderId))
        .orderBy(desc(coachingPrl.week))
        .limit(input.weeks);
    }),

  forceRecalculate: protectedProcedure
    .input(z.object({ founderId: z.number(), ventureId: z.string().optional(), week: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await runPrlPipeline(
        db,
        input.founderId,
        input.ventureId || null,
        new Date(input.week)
      );
      return result;
    }),

  portfolioSummary: protectedProcedure.query(async () => {
    const db = getDb();
    // Get latest PRL per founder
    const allFounders = await db.select().from(founders);
    const results = await Promise.all(
      allFounders.map(async (f) => {
        const [latest] = await db
          .select()
          .from(coachingPrl)
          .where(eq(coachingPrl.founderId, f.id))
          .orderBy(desc(coachingPrl.week))
          .limit(1);
        return {
          founderId: f.id,
          founderName: f.name,
          ventureId: f.ventureId,
          prlScore: latest ? parseFloat(latest.score as unknown as string) : null,
          riskLevel: latest?.riskLevel || null,
          trend: latest?.trend || null,
        };
      })
    );
    const scored = results.filter((r) => r.prlScore !== null);
    const avgPrl = scored.length > 0 ? scored.reduce((a, b) => a + (b.prlScore || 0), 0) / scored.length : 0;
    const highRisk = scored.filter((r) => r.riskLevel === "HIGH").length;
    const mediumRisk = scored.filter((r) => r.riskLevel === "MEDIUM").length;
    const lowRisk = scored.filter((r) => r.riskLevel === "LOW").length;
    return { founders: results, avgPrl: Math.round(avgPrl * 100) / 100, highRisk, mediumRisk, lowRisk };
  }),
});

const vrlLinkRouter = router({
  get: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [link] = await db
        .select()
        .from(coachingVrlLink)
        .where(eq(coachingVrlLink.ventureId, input.ventureId))
        .limit(1);
      return link || null;
    }),

  updateWeight: protectedProcedure
    .input(z.object({ ventureId: z.string(), prlWeight: z.number().min(0).max(1) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db
        .select()
        .from(coachingVrlLink)
        .where(eq(coachingVrlLink.ventureId, input.ventureId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(coachingVrlLink)
          .set({ prlWeight: input.prlWeight.toString(), updatedAt: new Date() })
          .where(eq(coachingVrlLink.ventureId, input.ventureId));
      } else {
        await db.insert(coachingVrlLink).values({
          id: randomUUID(),
          ventureId: input.ventureId,
          prlWeight: input.prlWeight.toString(),
          executionScore: "0",
          baseVrl: "50",
          adjustedVrl: "50",
          riskFlagged: false,
          updatedAt: new Date(),
        });
      }
      return { success: true };
    }),

  portfolioTable: protectedProcedure.query(async () => {
    const db = getDb();
    const allVentures = await db.select().from(ventures);
    const links = await db.select().from(coachingVrlLink);
    const linkMap = new Map(links.map((l) => [l.ventureId, l]));
    return allVentures.map((v) => {
      const link = linkMap.get(v.id);
      return {
        ventureId: v.id,
        ventureName: v.name,
        adjustedVrl: link ? parseFloat(link.adjustedVrl as unknown as string) : null,
        executionScore: link ? parseFloat(link.executionScore as unknown as string) : null,
        riskFlagged: link?.riskFlagged || false,
        prlWeight: link ? parseFloat(link.prlWeight as unknown as string) : 0.25,
      };
    });
  }),
});

const insightsRouter = router({
  getLatest: protectedProcedure
    .input(z.object({ founderId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [latest] = await db
        .select()
        .from(coachingInsights)
        .where(eq(coachingInsights.founderId, input.founderId))
        .orderBy(desc(coachingInsights.week))
        .limit(1);
      return latest || null;
    }),

  generate: protectedProcedure
    .input(z.object({ founderId: z.number(), ventureId: z.string().optional(), week: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await generateCoachingInsights(db, input.founderId, input.ventureId || null, new Date(input.week));
      return { success: true };
    }),
});

const dashboardRouter = router({
  founderDashboard: protectedProcedure
    .input(z.object({ founderId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      // Current week Monday
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekStart = new Date(now.setDate(diff));
      const weekStr = weekStart.toISOString().split("T")[0];

      const [currentPrl] = await db
        .select()
        .from(coachingPrl)
        .where(eq(coachingPrl.founderId, input.founderId))
        .orderBy(desc(coachingPrl.week))
        .limit(1);

      const weekCommitments = await db
        .select()
        .from(coachingCommitments)
        .where(
          and(
            eq(coachingCommitments.founderId, input.founderId),
            eq(coachingCommitments.week, weekStr as unknown as Date)
          )
        )
        .orderBy(asc(coachingCommitments.createdAt));

      const recentSessions = await db
        .select()
        .from(coachingSessions)
        .where(eq(coachingSessions.founderId, input.founderId))
        .orderBy(desc(coachingSessions.sessionDate))
        .limit(3);

      const prlHistory = await db
        .select()
        .from(coachingPrl)
        .where(eq(coachingPrl.founderId, input.founderId))
        .orderBy(asc(coachingPrl.week))
        .limit(12);

      const latestInsight = await db
        .select()
        .from(coachingInsights)
        .where(eq(coachingInsights.founderId, input.founderId))
        .orderBy(desc(coachingInsights.week))
        .limit(1);

      return {
        currentPrl: currentPrl || null,
        weekCommitments,
        recentSessions,
        prlHistory,
        latestInsight: latestInsight[0] || null,
        currentWeek: weekStr,
      };
    }),

  coachDashboard: protectedProcedure
    .input(z.object({ coachId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();

      // Get sessions for this coach to find assigned founders
      const sessions = await db
        .select()
        .from(coachingSessions)
        .where(eq(coachingSessions.coachId, input.coachId))
        .orderBy(desc(coachingSessions.sessionDate));

      const founderIds = [...new Set(sessions.map((s) => s.founderId))];

      const assignedFounders = await Promise.all(
        founderIds.map(async (founderId) => {
          const [founder] = await db
            .select()
            .from(founders)
            .where(eq(founders.id, founderId))
            .limit(1);

          const [latestPrl] = await db
            .select()
            .from(coachingPrl)
            .where(eq(coachingPrl.founderId, founderId))
            .orderBy(desc(coachingPrl.week))
            .limit(1);

          return {
            founder: founder || null,
            latestPrl: latestPrl || null,
          };
        })
      );

      const highRiskFounders = assignedFounders.filter(
        (f) => f.latestPrl?.riskLevel === "HIGH"
      );

      const upcomingSessions = await db
        .select()
        .from(coachingSessions)
        .where(eq(coachingSessions.coachId, input.coachId))
        .orderBy(asc(coachingSessions.sessionDate))
        .limit(5);

      return {
        assignedFounders,
        highRiskFounders,
        upcomingSessions,
        recentSessions: sessions.slice(0, 10),
      };
    }),

  studioDashboard: protectedProcedure.query(async () => {
    const db = getDb();

    const allVentures = await db.select().from(ventures);
    const allFounders = await db.select().from(founders);
    const allCoaches = await db.select().from(coachingCoaches);

    // Portfolio PRL summary
    const prlSummary = await Promise.all(
      allFounders.map(async (f) => {
        const [latest] = await db
          .select()
          .from(coachingPrl)
          .where(eq(coachingPrl.founderId, f.id))
          .orderBy(desc(coachingPrl.week))
          .limit(1);
        return { founder: f, prl: latest || null };
      })
    );

    const scored = prlSummary.filter((p) => p.prl !== null);
    const avgPrl =
      scored.length > 0
        ? scored.reduce((a, b) => a + parseFloat((b.prl?.score as unknown as string) || "0"), 0) / scored.length
        : 0;

    // VRL link table
    const vrlLinks = await db.select().from(coachingVrlLink);
    const ventureHealth = allVentures.map((v) => {
      const link = vrlLinks.find((l) => l.ventureId === v.id);
      const founderPrls = prlSummary.filter((p) => p.founder.ventureId === v.id);
      const avgFounderPrl =
        founderPrls.length > 0
          ? founderPrls.reduce((a, b) => a + parseFloat((b.prl?.score as unknown as string) || "0"), 0) / founderPrls.length
          : null;
      return {
        ventureId: v.id,
        ventureName: v.name,
        adjustedVrl: link ? parseFloat(link.adjustedVrl as unknown as string) : null,
        avgFounderPrl,
        riskFlagged: link?.riskFlagged || false,
        founderCount: founderPrls.length,
      };
    });

    // 12-week portfolio completion trend
    const weeklyMetrics = await db
      .select()
      .from(coachingBehaviourMetrics)
      .orderBy(asc(coachingBehaviourMetrics.week))
      .limit(120); // up to 12 weeks × 10 founders

    // Group by week
    const weekMap = new Map<string, number[]>();
    for (const m of weeklyMetrics) {
      const w = (m.week as unknown as string).split("T")[0];
      if (!weekMap.has(w)) weekMap.set(w, []);
      weekMap.get(w)!.push(parseFloat(m.completionRate as unknown as string));
    }
    const completionTrend = Array.from(weekMap.entries())
      .slice(-12)
      .map(([week, rates]) => ({
        week,
        avgCompletionRate: Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 100) / 100,
      }));

    // Coach performance (avg PRL improvement per coach over 30 days)
    const coachPerformance = await Promise.all(
      allCoaches.map(async (coach) => {
        const sessions = await db
          .select()
          .from(coachingSessions)
          .where(eq(coachingSessions.coachId, coach.id));
        const founderIds = [...new Set(sessions.map((s) => s.founderId))];
        return {
          coachId: coach.id,
          coachName: coach.name,
          coachType: coach.type,
          rating: coach.rating,
          assignedFounders: founderIds.length,
          sessionCount: sessions.length,
        };
      })
    );

    return {
      ventureHealth,
      avgPortfolioPrl: Math.round(avgPrl * 100) / 100,
      highRiskCount: scored.filter((p) => p.prl?.riskLevel === "HIGH").length,
      completionTrend,
      coachPerformance,
      totalFounders: allFounders.length,
      scoredFounders: scored.length,
    };
  }),
});

export const coachingRouter = router({
  coaches: coachesRouter,
  commitments: commitmentsRouter,
  sessions: sessionsRouter,
  prl: prlRouter,
  vrlLink: vrlLinkRouter,
  insights: insightsRouter,
  dashboard: dashboardRouter,
});
