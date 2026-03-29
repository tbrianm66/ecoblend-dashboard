/**
 * Learning Engine Router
 * Sprint 69 — EcoBlend VBS Platform
 *
 * 5-layer intelligence system:
 *   1. Structuring Engine  — AI-powered input processing (interviews, research, experiments)
 *   2. VRL Scoring Engine  — Formula: VRL = (α×TRL + β×BRL) × (1−Risk) × Confidence
 *   3. Pattern Detection   — Cluster problems, detect success/failure signals
 *   4. Recommendation Engine — Priority-ranked actionable intelligence
 *   5. Knowledge Graph     — Node/edge graph of problems, solutions, technologies
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import {
  leProblems,
  leInsights,
  leInputWeights,
  leVrlMetrics,
  leLearningPatterns,
  leRecommendations,
  leKnowledgeGraphNodes,
  leKnowledgeGraphEdges,
  ventures,
  interviews,
  experiments,
  ventureRisks,
} from "../drizzle/schema";
import { eq, desc, and, sql, asc } from "drizzle-orm";

// ─── STRUCTURING ENGINE ROUTER ───────────────────────────────────────────────

const structuringRouter = router({
  /**
   * Process raw input (interview transcript, research note, expert input)
   * through the AI Structuring Agent to produce a CanonicalInput and
   * store as a structured insight.
   */
  processInput: protectedProcedure
    .input(
      z.object({
        rawInput: z.string().min(10),
        sourceType: z.enum(["interview", "research", "experiment", "market_data", "book", "expert_input"]),
        ventureId: z.string(),
        sourceId: z.number().optional(),
        metadata: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Build structuring prompt
      const systemPrompt = `You are the EcoBlend Structuring Agent — the intelligence core of the EcoBlend VBS Analytics Platform.
Your role is to process raw venture data and extract structured intelligence.

TASK: Analyse the provided raw input and return a JSON object with this exact schema:
{
  "problemStatement": "string — clear, specific problem being addressed",
  "customerSegment": "string — target customer persona",
  "context": "string — situational context",
  "keyInsight": "string — the single most important takeaway",
  "evidenceStrength": 1-5,
  "sector": "string — industry sector",
  "tags": ["array", "of", "relevant", "tags"],
  "entities": {
    "technologies": ["array"],
    "organizations": ["array"],
    "locations": ["array"]
  },
  "frequencyIndicator": "low|medium|high",
  "severityScore": 1-5,
  "ipSensitive": true|false,
  "recommendations": ["array of 2-3 next action strings"]
}

Rules:
- Be specific and factual — extract only what is stated or strongly implied
- Tag risk signals with prefix "risk-" (e.g., "risk-market", "risk-technology")
- Tag validation signals: "problem-validated", "WTP-validated", "LOI-secured", "revenue-generated"
- evidenceStrength: 1=anecdotal, 2=qualitative, 3=quantitative, 4=validated, 5=independently verified
- Return ONLY valid JSON, no markdown or explanation`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `SOURCE TYPE: ${input.sourceType}\nVENTURE ID: ${input.ventureId}\n\nRAW INPUT:\n${input.rawInput}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "structured_insight",
            strict: true,
            schema: {
              type: "object",
              properties: {
                problemStatement: { type: "string" },
                customerSegment: { type: "string" },
                context: { type: "string" },
                keyInsight: { type: "string" },
                evidenceStrength: { type: "number" },
                sector: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
                entities: {
                  type: "object",
                  properties: {
                    technologies: { type: "array", items: { type: "string" } },
                    organizations: { type: "array", items: { type: "string" } },
                    locations: { type: "array", items: { type: "string" } },
                  },
                  required: ["technologies", "organizations", "locations"],
                  additionalProperties: false,
                },
                frequencyIndicator: { type: "string" },
                severityScore: { type: "number" },
                ipSensitive: { type: "boolean" },
                recommendations: { type: "array", items: { type: "string" } },
              },
              required: [
                "problemStatement", "customerSegment", "context", "keyInsight",
                "evidenceStrength", "sector", "tags", "entities",
                "frequencyIndicator", "severityScore", "ipSensitive", "recommendations",
              ],
              additionalProperties: false,
            },
          },
        },
      } as any);

      const raw = String(response.choices[0]?.message?.content ?? "{}");
      let structured: any = {};
      try {
        structured = JSON.parse(raw);
      } catch {
        structured = { keyInsight: raw, problemStatement: "Parse error", sector: "Unknown", tags: [], evidenceStrength: 1, ipSensitive: false };
      }

      // Upsert problem record
      const ventureIdNum = Number(input.ventureId) || 0;
      let problemId: number | undefined;
      if (structured.problemStatement && structured.sector) {
        const [prob] = await db.insert(leProblems).values({
          description: structured.problemStatement,
          sector: structured.sector,
          frequencyScore: structured.frequencyIndicator === "high" ? 5 : structured.frequencyIndicator === "medium" ? 3 : 1,
          severityScore: structured.severityScore ?? 3,
          customerSegment: structured.customerSegment,
          context: structured.context,
          ventureId: ventureIdNum,
          tags: JSON.stringify(structured.tags ?? []),
          status: "active",
        });
        problemId = (prob as any).insertId;
      }

      // Store structured insight
      const [ins] = await db.insert(leInsights).values({
        problemId: problemId ?? null,
        ventureId: ventureIdNum,
        sourceType: input.sourceType,
        sourceId: input.sourceId ?? null,
        content: structured.keyInsight ?? input.rawInput.slice(0, 500),
        evidenceStrength: Math.min(5, Math.max(1, Math.round(structured.evidenceStrength ?? 3))),
        confidenceScore: String(Math.min(1, (structured.evidenceStrength ?? 3) / 5)),
        tags: JSON.stringify(structured.tags ?? []),
        ipSensitive: structured.ipSensitive ?? false,
      });

      return {
        insightId: (ins as any).insertId,
        problemId,
        structured,
        recommendations: structured.recommendations ?? [],
      };
    }),

  /**
   * List all structured insights for a venture
   */
  listInsights: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      sourceType: z.enum(["interview", "research", "experiment", "market_data", "book", "expert_input"]).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const ventureIdNum = Number(input.ventureId) || 0;
      const conditions = [eq(leInsights.ventureId, ventureIdNum)];
      if (input.sourceType) conditions.push(eq(leInsights.sourceType, input.sourceType));
      return db.select().from(leInsights)
        .where(and(...conditions))
        .orderBy(desc(leInsights.createdAt))
        .limit(input.limit);
    }),

  /**
   * List all problems (optionally filtered by venture or sector)
   */
  listProblems: protectedProcedure
    .input(z.object({
      ventureId: z.string().optional(),
      sector: z.string().optional(),
      status: z.enum(["active", "validated", "invalidated", "archived"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions: any[] = [];
      if (input.ventureId) conditions.push(eq(leProblems.ventureId, Number(input.ventureId) || 0));
      if (input.sector) conditions.push(eq(leProblems.sector, input.sector));
      if (input.status) conditions.push(eq(leProblems.status, input.status));
      return db.select().from(leProblems)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(leProblems.severityScore));
    }),

  /**
   * Update problem status (validate / invalidate / archive)
   */
  updateProblemStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["active", "validated", "invalidated", "archived"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(leProblems).set({ status: input.status }).where(eq(leProblems.id, input.id));
      return { success: true };
    }),

  /**
   * Get input source weights
   */
  getInputWeights: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(leInputWeights);
    }),
});

// ─── VRL SCORING ENGINE ROUTER ───────────────────────────────────────────────

const vrlEngineRouter = router({
  /**
   * Calculate VRL for a venture using the formula:
   * VRL = (α×TRL + β×BRL) × (1 − Risk Index) × Confidence Score
   */
  calculate: protectedProcedure
    .input(
      z.object({
        ventureId: z.string(),
        alpha: z.number().min(0).max(1).default(0.5),
        beta: z.number().min(0).max(1).default(0.5),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Fetch venture data
      const [venture] = await db.select().from(ventures).where(eq(ventures.id, input.ventureId));
      if (!venture) throw new Error("Venture not found");

      // Fetch supporting data
      const insights = await db.select().from(leInsights).where(eq(leInsights.ventureId, Number(input.ventureId) || 0));
      const interviewRows = await db.select().from(interviews).where(eq(interviews.ventureId, input.ventureId));
      const experimentRows = await db.select().from(experiments).where(eq(experiments.ventureId, input.ventureId));
      const risks = await db.select().from(ventureRisks).where(eq(ventureRisks.ventureId, input.ventureId));

      // ── TRL Calculation ──
      const trlBase = Number(venture.trl ?? 1);
      const successfulExperiments = experimentRows.filter((e: any) => e.outcome === "Pass");
      const trlConfidence = successfulExperiments.length > 0
        ? Math.min(1, successfulExperiments.length / Math.max(experimentRows.length, 1))
        : 0.5;
      const trlScore = trlBase;

      // ── BRL Calculation ──
      const brlBase = Number(venture.vrl ?? 1);
      const hasCustomerDiscovery = interviewRows.length >= 10;
      const hasValidatedProblem = insights.filter((i: any) => {
        const tags: string[] = JSON.parse(i.tags ?? "[]");
        return Number(i.evidenceStrength) >= 4 && tags.includes("problem-validated");
      }).length >= 3;
      const hasWTP = insights.some((i: any) => {
        const tags: string[] = JSON.parse(i.tags ?? "[]");
        return tags.includes("WTP-validated");
      });
      const hasLOI = insights.some((i: any) => {
        const tags: string[] = JSON.parse(i.tags ?? "[]");
        return tags.includes("LOI-secured");
      });
      const hasRevenue = insights.some((i: any) => {
        const tags: string[] = JSON.parse(i.tags ?? "[]");
        return tags.includes("revenue-generated");
      });

      let brlScore = brlBase;
      if (hasCustomerDiscovery) brlScore = Math.max(brlScore, 3);
      if (hasValidatedProblem) brlScore = Math.max(brlScore, 4);
      if (hasWTP) brlScore = Math.max(brlScore, 5);
      if (hasLOI) brlScore = Math.max(brlScore, 6);
      if (hasRevenue) brlScore = Math.max(brlScore, 7);

      const brlConfidence = insights.length > 0
        ? Math.min(1, insights.reduce((s: number, i: any) => s + (Number(i.evidenceStrength) / 5), 0) / insights.length)
        : 0.5;

      // ── Supporting data counts ──
      const interviewsCount = interviewRows.length;
      const experimentsCount = experimentRows.length;

      // ── Risk Index Calculation ──
      const criticalRisks = risks.filter((r: any) => r.riskLevel === "Critical" || r.riskScore >= 15);
      const highRisks = risks.filter((r: any) => r.riskLevel === "High" || (r.riskScore >= 9 && r.riskScore < 15));
      const riskMarket = Math.min(1, criticalRisks.filter((r: any) => r.riskCategory === "Market").length * 0.2);
      const riskTech = Math.min(1, criticalRisks.filter((r: any) => r.riskCategory === "Technical").length * 0.2);
      const riskTeam = Math.min(1, highRisks.filter((r: any) => r.riskCategory === "Operational").length * 0.15);
      const riskRegulatory = Math.min(1, criticalRisks.filter((r: any) => r.riskCategory === "Strategic").length * 0.2);
      const riskFinancial = Math.min(1, criticalRisks.filter((r: any) => r.riskCategory === "Financial").length * 0.2);

      const riskBreakdown = { market: riskMarket, technology: riskTech, team: riskTeam, regulatory: riskRegulatory, financial: riskFinancial };
      const riskIndex = Math.min(0.9,
        riskMarket * 0.25 + riskTech * 0.25 + riskTeam * 0.20 + riskRegulatory * 0.15 + riskFinancial * 0.15
      );

      // ── Confidence Score ──
      const confidenceScore = Math.min(1, (trlConfidence + brlConfidence) / 2);

      // ── VRL Formula ──
      const weightedReadiness = (input.alpha * trlScore) + (input.beta * brlScore);
      const vrlScore = weightedReadiness * (1 - riskIndex) * confidenceScore;

      // ── Stage Classification ──
      const stage =
        vrlScore < 1.5 ? "idea" :
        vrlScore < 3.0 ? "validation" :
        vrlScore < 4.5 ? "mvp" :
        vrlScore < 5.5 ? "scale_ready" : "investment_ready";

      // ── Store result ──
      const ventureIdNumForInsert = Number(input.ventureId) || 0;
      const [result] = await db.insert(leVrlMetrics).values({
        ventureId: ventureIdNumForInsert,
        trlScore: String(trlScore.toFixed(2)),
        brlScore: String(brlScore.toFixed(2)),
        alpha: String(input.alpha.toFixed(2)),
        beta: String(input.beta.toFixed(2)),
        riskIndex: String(riskIndex.toFixed(2)),
        confidenceScore: String(confidenceScore.toFixed(2)),
        vrlScore: String(vrlScore.toFixed(2)),
        stage,
        riskBreakdown: JSON.stringify(riskBreakdown),
        calculationMethod: "multiplicative_dual_risk",
        notes: input.notes,
      });

      return {
        id: (result as any).insertId,
        ventureId: input.ventureId,
        trl: { score: trlScore, confidence: trlConfidence },
        brl: { score: brlScore, confidence: brlConfidence },
        alpha: input.alpha,
        beta: input.beta,
        riskIndex,
        riskBreakdown,
        confidenceScore,
        vrlScore: parseFloat(vrlScore.toFixed(2)),
        stage,
        supportingData: {
          insightsCount: insights.length,
          interviewsCount,
          experimentsCount,
          risksCount: risks.length,
          criticalRisksCount: criticalRisks.length,
        },
      };
    }),

  /**
   * Get VRL calculation history for a venture
   */
  history: protectedProcedure
    .input(z.object({ ventureId: z.string(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const history = await db.select().from(leVrlMetrics)
        .where(eq(leVrlMetrics.ventureId, Number(input.ventureId) || 0))
        .orderBy(desc(leVrlMetrics.calculatedAt))
        .limit(input.limit);

      // Determine trend
      let trend: "improving" | "stable" | "declining" = "stable";
      if (history.length >= 2) {
        const latest = Number(history[0].vrlScore ?? 0);
        const previous = Number(history[1].vrlScore ?? 0);
        if (latest > previous + 0.1) trend = "improving";
        else if (latest < previous - 0.1) trend = "declining";
      }

      return { history, trend };
    }),

  /**
   * Run scenario analysis — compare multiple alpha/beta configurations
   */
  scenarioAnalysis: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      scenarios: z.array(z.object({
        name: z.string(),
        alpha: z.number().min(0).max(1),
        beta: z.number().min(0).max(1),
      })).max(5),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const history = await db.select().from(leVrlMetrics)
        .where(eq(leVrlMetrics.ventureId, Number(input.ventureId) || 0))
        .orderBy(desc(leVrlMetrics.calculatedAt))
        .limit(1);

      if (!history.length) return [];

      const latest = history[0];
      const trl = Number(latest.trlScore ?? 1);
      const brl = Number(latest.brlScore ?? 1);
      const risk = Number(latest.riskIndex ?? 0.3);
      const conf = Number(latest.confidenceScore ?? 0.6);

      return input.scenarios.map((s) => {
        const vrl = ((s.alpha * trl) + (s.beta * brl)) * (1 - risk) * conf;
        const stage =
          vrl < 1.5 ? "idea" :
          vrl < 3.0 ? "validation" :
          vrl < 4.5 ? "mvp" :
          vrl < 5.5 ? "scale_ready" : "investment_ready";
        return { name: s.name, alpha: s.alpha, beta: s.beta, vrlScore: parseFloat(vrl.toFixed(2)), stage };
      });
    }),

  /**
   * Portfolio VRL summary — latest score per venture
   */
  portfolioSummary: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      const allVentures = await db.select().from(ventures);
      const results = await Promise.all(
        allVentures.map(async (v: any) => {
          const [latest] = await db.select().from(leVrlMetrics)
            .where(eq(leVrlMetrics.ventureId, Number(v.id) || 0))
            .orderBy(desc(leVrlMetrics.calculatedAt))
            .limit(1);
          return {
            ventureId: v.id,
            ventureName: v.name,
            vrlScore: latest ? Number(latest.vrlScore) : null,
            stage: latest?.stage ?? null,
            calculatedAt: latest?.calculatedAt ?? null,
          };
        })
      );
      return results;
    }),
});

// ─── PATTERN DETECTION ROUTER ────────────────────────────────────────────────

const patternRouter = router({
  /**
   * Run AI-powered pattern detection across all insights for a sector
   */
  detect: protectedProcedure
    .input(z.object({
      sector: z.string().optional(),
      patternType: z.enum(["problem_cluster", "success_indicator", "failure_signal", "pivot_trigger", "sector_trend"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Fetch recent insights
      const recentInsights = await db.select().from(leInsights)
        .orderBy(desc(leInsights.createdAt))
        .limit(100);

      if (recentInsights.length === 0) return { patterns: [], message: "No insights to analyse" };

      const insightSummary = recentInsights.slice(0, 30).map((i: any) => ({
        content: i.content?.slice(0, 200),
        source: i.sourceType,
        evidence: i.evidenceStrength,
        tags: JSON.parse(i.tags ?? "[]"),
      }));

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are the EcoBlend Pattern Detection Agent. Analyse the provided venture insights and identify recurring patterns.
Return a JSON array of up to 5 patterns with this schema:
[{
  "patternType": "problem_cluster|success_indicator|failure_signal|pivot_trigger|sector_trend",
  "title": "string",
  "description": "string",
  "frequency": number (1-10),
  "confidenceScore": 0.0-1.0,
  "sector": "string",
  "supportingEvidence": ["string array of key evidence points"]
}]
Focus on: repeated problems, validation signals, risk patterns, and pivot triggers.`,
          },
          {
            role: "user",
            content: `INSIGHTS TO ANALYSE (${recentInsights.length} total, showing 30):\n${JSON.stringify(insightSummary, null, 2)}`,
          },
        ],
      });

      const raw = String(response.choices[0]?.message?.content ?? "[]");
      let patterns: any[] = [];
      try {
        const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());
        patterns = Array.isArray(parsed) ? parsed : [];
      } catch {
        patterns = [];
      }

      // Store detected patterns
      const stored = await Promise.all(
        patterns.map(async (p: any) => {
          const [r] = await db.insert(leLearningPatterns).values({
            patternType: p.patternType ?? "sector_trend",
            sector: p.sector ?? input.sector ?? "General",
            title: p.title ?? "Detected Pattern",
            description: p.description,
            frequency: Math.min(10, Math.max(1, Math.round(p.frequency ?? 1))),
            confidenceScore: String(Math.min(1, Math.max(0, p.confidenceScore ?? 0.5))),
            supportingData: JSON.stringify(p.supportingEvidence ?? []),
            isActive: true,
          });
          return { id: (r as any).insertId, ...p };
        })
      );

      return { patterns: stored, analysedInsights: recentInsights.length };
    }),

  /**
   * List stored patterns
   */
  list: protectedProcedure
    .input(z.object({
      patternType: z.enum(["problem_cluster", "success_indicator", "failure_signal", "pivot_trigger", "sector_trend"]).optional(),
      sector: z.string().optional(),
      activeOnly: z.boolean().default(true),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions: any[] = [];
      if (input.patternType) conditions.push(eq(leLearningPatterns.patternType, input.patternType));
      if (input.sector) conditions.push(eq(leLearningPatterns.sector, input.sector));
      if (input.activeOnly) conditions.push(eq(leLearningPatterns.isActive, true));
      return db.select().from(leLearningPatterns)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(leLearningPatterns.confidenceScore));
    }),

  /**
   * Predict success probability for a venture based on patterns
   */
  predictSuccess: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [venture] = await db.select().from(ventures).where(eq(ventures.id, input.ventureId));
      if (!venture) return null;

      const ventureIdNum = Number(input.ventureId) || 0;
      const insights = await db.select().from(leInsights).where(eq(leInsights.ventureId, ventureIdNum));
      const [latestVrl] = await db.select().from(leVrlMetrics)
        .where(eq(leVrlMetrics.ventureId, ventureIdNum))
        .orderBy(desc(leVrlMetrics.calculatedAt))
        .limit(1);

      // Heuristic success probability model
      const vrlScore = latestVrl ? Number(latestVrl.vrlScore ?? 0) : 0;
      const evidenceQuality = insights.length > 0
        ? insights.reduce((s: number, i: any) => s + Number(i.evidenceStrength ?? 1), 0) / (insights.length * 5)
        : 0;
      const riskPenalty = latestVrl ? Number(latestVrl.riskIndex ?? 0.3) : 0.3;

      const successProbability = Math.min(0.95, Math.max(0.05,
        (vrlScore / 9) * 0.5 + evidenceQuality * 0.3 + (1 - riskPenalty) * 0.2
      ));

      const timeToMarketMonths = Math.round(
        (9 - vrlScore) * 3 + (1 - evidenceQuality) * 6
      );

      return {
        ventureId: input.ventureId,
        ventureName: venture.name,
        successProbability: parseFloat(successProbability.toFixed(2)),
        timeToMarketMonths,
        vrlScore: parseFloat(vrlScore.toFixed(2)),
        evidenceQuality: parseFloat(evidenceQuality.toFixed(2)),
        riskPenalty: parseFloat(riskPenalty.toFixed(2)),
        stage: latestVrl?.stage ?? "idea",
      };
    }),
});

// ─── RECOMMENDATION ENGINE ROUTER ────────────────────────────────────────────

const recommendationRouter = router({
  /**
   * Generate AI-powered recommendations for a venture
   */
  generate: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const [venture] = await db.select().from(ventures).where(eq(ventures.id, input.ventureId));
      if (!venture) throw new Error("Venture not found");

      const ventureIdNum = Number(input.ventureId) || 0;
      const insights = await db.select().from(leInsights).where(eq(leInsights.ventureId, ventureIdNum));
      const [latestVrl] = await db.select().from(leVrlMetrics)
        .where(eq(leVrlMetrics.ventureId, ventureIdNum))
        .orderBy(desc(leVrlMetrics.calculatedAt))
        .limit(1);
      const risks = await db.select().from(ventureRisks).where(eq(ventureRisks.ventureId, input.ventureId));

      const context = {
        ventureName: venture.name,
        vrlScore: latestVrl ? Number(latestVrl.vrlScore) : 0,
        trlScore: latestVrl ? Number(latestVrl.trlScore) : 1,
        brlScore: latestVrl ? Number(latestVrl.brlScore) : 1,
        riskIndex: latestVrl ? Number(latestVrl.riskIndex) : 0.3,
        confidenceScore: latestVrl ? Number(latestVrl.confidenceScore) : 0.5,
        stage: latestVrl?.stage ?? "idea",
        insightsCount: insights.length,
        criticalRisksCount: risks.filter((r: any) => r.riskLevel === "Critical").length,
        riskBreakdown: latestVrl?.riskBreakdown ? JSON.parse(latestVrl.riskBreakdown) : {},
      };

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are the EcoBlend Recommendation Agent. Generate prioritised, actionable recommendations for venture founders.

Return a JSON array of up to 6 recommendations:
[{
  "type": "next_interview|missing_validation|technical_risk|pivot_signal|go_no_go",
  "priority": "low|medium|high|critical",
  "title": "string (max 80 chars)",
  "description": "string (2-3 sentences)",
  "actionItems": ["string", "string", "string"],
  "confidence": 0.0-1.0
}]

Prioritisation rules:
- CRITICAL: riskIndex > 0.5, or confidenceScore < 0.4
- HIGH: TRL-BRL gap > 3, or < 10 interviews for BRL stage
- MEDIUM: Missing validation steps for current stage
- LOW: Optimisation opportunities`,
          },
          {
            role: "user",
            content: `VENTURE CONTEXT:\n${JSON.stringify(context, null, 2)}`,
          },
        ],
      });

      const raw = String(response.choices[0]?.message?.content ?? "[]");
      let recs: any[] = [];
      try {
        const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());
        recs = Array.isArray(parsed) ? parsed : [];
      } catch {
        recs = [];
      }

      // Archive old active recommendations
      const recVentureIdNum = Number(input.ventureId) || 0;
      await db.update(leRecommendations)
        .set({ status: "dismissed" })
        .where(and(eq(leRecommendations.ventureId, recVentureIdNum), eq(leRecommendations.status, "active")));

      // Store new recommendations
      const stored = await Promise.all(
        recs.map(async (r: any) => {
          const [result] = await db.insert(leRecommendations).values({
            ventureId: recVentureIdNum,
            type: r.type ?? "missing_validation",
            priority: r.priority ?? "medium",
            title: (r.title ?? "Recommendation").slice(0, 255),
            description: r.description,
            actionItems: JSON.stringify(r.actionItems ?? []),
            confidence: String(Math.min(1, Math.max(0, r.confidence ?? 0.7))),
            status: "active",
          });
          return { id: (result as any).insertId, ...r };
        })
      );

      return { recommendations: stored, ventureId: input.ventureId };
    }),

  /**
   * List active recommendations for a venture
   */
  list: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      status: z.enum(["active", "dismissed", "completed"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const ventureIdNum = Number(input.ventureId) || 0;
      const conditions = [eq(leRecommendations.ventureId, ventureIdNum)];
      if (input.status) conditions.push(eq(leRecommendations.status, input.status));
      return db.select().from(leRecommendations)
        .where(and(...conditions))
        .orderBy(asc(leRecommendations.priority), desc(leRecommendations.createdAt));
    }),

  /**
   * Update recommendation status (dismiss or complete)
   */
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["active", "dismissed", "completed"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(leRecommendations).set({ status: input.status }).where(eq(leRecommendations.id, input.id));
      return { success: true };
    }),
});

// ─── KNOWLEDGE GRAPH ROUTER ──────────────────────────────────────────────────

const knowledgeGraphRouter = router({
  /**
   * Build / refresh knowledge graph for a venture
   */
  build: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const [venture] = await db.select().from(ventures).where(eq(ventures.id, input.ventureId));
      if (!venture) throw new Error("Venture not found");

      const ventureIdNum = Number(input.ventureId) || 0;
      const problems = await db.select().from(leProblems).where(eq(leProblems.ventureId, ventureIdNum));
      const insights = await db.select().from(leInsights).where(eq(leInsights.ventureId, ventureIdNum));

      // Create solution node for the venture
      const [ventureNode] = await db.insert(leKnowledgeGraphNodes).values({
        nodeType: "solution",
        label: venture.name,
        ventureId: ventureIdNum,
        properties: JSON.stringify({ stage: venture.status, sector: venture.channel }),
      });
      const ventureNodeId = (ventureNode as any).insertId;

      // Create problem nodes and link to venture
      const problemNodeIds: number[] = [];
      for (const p of problems) {
        const [pNode] = await db.insert(leKnowledgeGraphNodes).values({
          nodeType: "problem",
          label: p.description.slice(0, 100),
          ventureId: ventureIdNum,
          properties: JSON.stringify({ sector: p.sector, severity: p.severityScore, frequency: p.frequencyScore }),
        });
        const pNodeId = (pNode as any).insertId;
        problemNodeIds.push(pNodeId);

        // Edge: solution → solves → problem
        await db.insert(leKnowledgeGraphEdges).values({
          fromNodeId: ventureNodeId,
          toNodeId: pNodeId,
          relationship: "solves",
          weight: "0.70",
          metadata: JSON.stringify({ inferredFrom: "venture_problem_link" }),
        });
      }

      // Extract technology nodes from insights
      const techSet = new Set<string>();
      for (const ins of insights) {
        const tags: string[] = JSON.parse(ins.tags ?? "[]");
        tags.filter((t: string) => t.startsWith("tech-")).forEach((t: string) => techSet.add(t.replace("tech-", "")));
      }

      for (const tech of Array.from(techSet).slice(0, 10)) {
        const [techNode] = await db.insert(leKnowledgeGraphNodes).values({
          nodeType: "technology",
          label: tech,
          ventureId: ventureIdNum,
          properties: JSON.stringify({ source: "insight_tags" }),
        });
        const techNodeId = (techNode as any).insertId;

        // Edge: solution → requires → technology
        await db.insert(leKnowledgeGraphEdges).values({
          fromNodeId: ventureNodeId,
          toNodeId: techNodeId,
          relationship: "requires",
          weight: "0.60",
          metadata: JSON.stringify({ inferredFrom: "insight_tags" }),
        });
      }

      return {
        ventureNodeId,
        problemNodes: problemNodeIds.length,
        techNodes: techSet.size,
        totalNodes: 1 + problemNodeIds.length + techSet.size,
      };
    }),

  /**
   * Get graph data for a venture
   */
  getGraph: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { nodes: [], edges: [] };
      const ventureIdNum = Number(input.ventureId) || 0;
      const nodes = await db.select().from(leKnowledgeGraphNodes)
        .where(eq(leKnowledgeGraphNodes.ventureId, ventureIdNum));
      const edges = nodes.length > 0
        ? await db.select().from(leKnowledgeGraphEdges)
            .where(sql`${leKnowledgeGraphEdges.fromNodeId} IN (${nodes.map((n: any) => n.id).join(",")})`)
        : [];
      return { nodes, edges };
    }),

  /**
   * Portfolio-level graph stats
   */
  portfolioStats: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return null;
      const nodeCount = await db.select({ count: sql<number>`count(*)` }).from(leKnowledgeGraphNodes);
      const edgeCount = await db.select({ count: sql<number>`count(*)` }).from(leKnowledgeGraphEdges);
      const problemCount = await db.select({ count: sql<number>`count(*)` }).from(leProblems);
      const insightCount = await db.select({ count: sql<number>`count(*)` }).from(leInsights);
      return {
        totalNodes: Number(nodeCount[0]?.count ?? 0),
        totalEdges: Number(edgeCount[0]?.count ?? 0),
        totalProblems: Number(problemCount[0]?.count ?? 0),
        totalInsights: Number(insightCount[0]?.count ?? 0),
      };
    }),
});

// ─── MAIN LEARNING ENGINE ROUTER ─────────────────────────────────────────────

export const learningEngineRouter = router({
  structuring: structuringRouter,
  vrlEngine: vrlEngineRouter,
  patterns: patternRouter,
  recommendations: recommendationRouter,
  knowledgeGraph: knowledgeGraphRouter,
});
