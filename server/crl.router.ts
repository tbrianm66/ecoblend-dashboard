/**
 * Cultural Readiness Level (CRL) Router
 * ======================================
 * Based on Wasserman (2012) — 65% of high-potential startups fail due to
 * co-founder conflict. CRL provides systematic, AI-powered cultural alignment
 * assessment integrated into the VRL formula.
 *
 * Four AI Conversation Modes:
 *   Mode 1 — Assessment Facilitation: guided 10-question scorecard
 *   Mode 2 — Results Review: pattern analysis and action planning
 *   Mode 3 — Conflict Mediation: structured resolution conversations
 *   Mode 4 — Continuous Monitoring: drift detection and health reports
 *
 * VRL Formula (with CRL) — UPDATED to use PRL composite:
 *   VRL = (α × PRL_norm + β × BRL_norm + γ × CRL_norm) × (1 - RI) × CS
 *   PRL (Product Readiness Level) = (0.5 × TRL_norm) + (0.5 × MRL_norm)
 *   Stage weights (H4.1): α=0.225, β=0.325, γ=0.450
 *   Stage weights (H4.2): α=0.300, β=0.350, γ=0.350
 *   Stage weights (H4.3): α=0.400, β=0.350, γ=0.250
 *   Stage weights (H4.4): α=0.450, β=0.400, γ=0.150
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  crlAssessments,
  crlFounderResponses,
  crlInterventions,
  crlMonitoringRecords,
  vrlDynamicWeights,
  founders,
  ventures,
  mrlAssessments,
} from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

// ── CRL Question Bank ─────────────────────────────────────────────────────────
export const CRL_QUESTIONS = {
  vision: [
    {
      id: "Q1",
      phase: "vision" as const,
      text: "What is the primary mission of our venture?",
      subtext: "Describe in 2–3 sentences what success looks like in 5 years.",
      options: [
        { key: "A", label: "Financial returns and market dominance" },
        { key: "B", label: "Social/environmental impact with sustainable revenue" },
        { key: "C", label: "Technological innovation and IP creation" },
        { key: "D", label: "Community building and ecosystem development" },
      ],
    },
    {
      id: "Q2",
      phase: "vision" as const,
      text: "How do you define success for this venture in 3 years?",
      subtext: "What metrics or outcomes would confirm we are on the right path?",
      options: [
        { key: "A", label: "Revenue targets and profitability milestones" },
        { key: "B", label: "Impact metrics (lives changed, carbon reduced, etc.)" },
        { key: "C", label: "Market share and customer acquisition" },
        { key: "D", label: "Team growth and organisational capability" },
      ],
    },
    {
      id: "Q3",
      phase: "vision" as const,
      text: "What is your personal motivation for founding this venture?",
      subtext: "Be honest — what drives you personally beyond the business case?",
      options: [
        { key: "A", label: "Financial independence and wealth creation" },
        { key: "B", label: "Solving a problem I personally experienced" },
        { key: "C", label: "Building something that outlasts me" },
        { key: "D", label: "Proving a concept or hypothesis I believe in" },
      ],
    },
  ],
  operational: [
    {
      id: "Q4",
      phase: "operational" as const,
      text: "How should major decisions be made in the founding team?",
      subtext: "Describe your preferred decision-making process for significant pivots or investments.",
      options: [
        { key: "A", label: "CEO has final say after consulting the team" },
        { key: "B", label: "Consensus required from all co-founders" },
        { key: "C", label: "Domain owner decides within their area" },
        { key: "D", label: "Data and evidence drive all decisions" },
      ],
    },
    {
      id: "Q5",
      phase: "operational" as const,
      text: "How do you expect equity and rewards to be distributed?",
      subtext: "What principles should guide how value is shared among founders?",
      options: [
        { key: "A", label: "Equal split regardless of contribution" },
        { key: "B", label: "Based on initial idea and IP contribution" },
        { key: "C", label: "Vesting schedule tied to milestones and time" },
        { key: "D", label: "Dynamic equity based on ongoing contribution" },
      ],
    },
    {
      id: "Q6",
      phase: "operational" as const,
      text: "What is your expected time commitment to this venture?",
      subtext: "Be specific about hours per week and any competing commitments.",
      options: [
        { key: "A", label: "Full-time (40+ hours/week), no other commitments" },
        { key: "B", label: "Part-time (20–30 hours/week) while maintaining other work" },
        { key: "C", label: "Advisory level (5–10 hours/week)" },
        { key: "D", label: "Flexible — scales with venture needs" },
      ],
    },
  ],
  conflict: [
    {
      id: "Q7",
      phase: "conflict" as const,
      text: "How do you typically respond when you disagree with a co-founder?",
      subtext: "Describe a past experience or your default approach to disagreement.",
      options: [
        { key: "A", label: "Direct confrontation — I state my position clearly" },
        { key: "B", label: "Seek data and evidence to resolve the disagreement" },
        { key: "C", label: "Defer to the person with more domain expertise" },
        { key: "D", label: "Bring in a neutral third party to mediate" },
      ],
    },
    {
      id: "Q8",
      phase: "conflict" as const,
      text: "What would cause you to consider leaving the venture?",
      subtext: "What are your non-negotiable boundaries or deal-breakers?",
      options: [
        { key: "A", label: "Ethical violations or mission drift" },
        { key: "B", label: "Persistent co-founder conflict without resolution" },
        { key: "C", label: "Failure to reach agreed financial milestones" },
        { key: "D", label: "Loss of my decision-making authority" },
      ],
    },
    {
      id: "Q9",
      phase: "conflict" as const,
      text: "How do you handle underperformance from a co-founder?",
      subtext: "What process would you follow if a co-founder was not meeting expectations?",
      options: [
        { key: "A", label: "Direct conversation with clear expectations set" },
        { key: "B", label: "Formal performance review with documented outcomes" },
        { key: "C", label: "Restructure their role to better fit their strengths" },
        { key: "D", label: "Involve the board or advisors to mediate" },
      ],
    },
    {
      id: "Q10",
      phase: "conflict" as const,
      text: "What does a healthy co-founder relationship look like to you?",
      subtext: "Describe the behaviours and norms you expect from your co-founders.",
      options: [
        { key: "A", label: "Radical transparency — no hidden agendas" },
        { key: "B", label: "Complementary skills with clear role boundaries" },
        { key: "C", label: "Shared values but diverse perspectives" },
        { key: "D", label: "Regular structured check-ins and retrospectives" },
      ],
    },
  ],
};

// ── Stage-specific VRL weight tables ─────────────────────────────────────────
const STAGE_WEIGHTS = {
  "H4.1_ideation":     { alpha: 0.225, beta: 0.325, gamma: 0.450 },
  "H4.2_build_launch": { alpha: 0.300, beta: 0.350, gamma: 0.350 },
  "H4.3_validation":   { alpha: 0.400, beta: 0.350, gamma: 0.250 },
  "H4.4_grow_scale":   { alpha: 0.450, beta: 0.400, gamma: 0.150 },
};

// ── CRL Scoring Engine ────────────────────────────────────────────────────────
function computeCrlScore(
  responses: Array<{ questionId: string; questionPhase: string; confidenceLevel: number | null }>
): {
  visionScore: number;
  operationalScore: number;
  conflictScore: number;
  overallAlignmentScore: number;
  crlScore: number;
  crlLevel: number;
  readinessLevel: "high" | "moderate" | "low";
  confidenceScore: number;
} {
  const visionResponses = responses.filter(r => r.questionPhase === "vision");
  const operationalResponses = responses.filter(r => r.questionPhase === "operational");
  const conflictResponses = responses.filter(r => r.questionPhase === "conflict");

  const avgConfidence = (arr: typeof responses) =>
    arr.length > 0
      ? arr.reduce((sum, r) => sum + (r.confidenceLevel ?? 3), 0) / arr.length / 5
      : 0.5;

  const visionScore = avgConfidence(visionResponses);
  const operationalScore = avgConfidence(operationalResponses);
  const conflictScore = avgConfidence(conflictResponses);

  // Weighted: conflict resolution is most predictive of venture survival
  const overallAlignmentScore =
    visionScore * 0.30 + operationalScore * 0.30 + conflictScore * 0.40;

  // Map 0–1 alignment to 1–9 CRL scale
  const crlScore = overallAlignmentScore;
  const crlLevel = Math.max(1, Math.min(9, Math.round(overallAlignmentScore * 9)));

  const readinessLevel: "high" | "moderate" | "low" =
    overallAlignmentScore >= 0.7 ? "high" :
    overallAlignmentScore >= 0.4 ? "moderate" : "low";

  const confidenceScore = responses.length > 0
    ? responses.reduce((sum, r) => sum + (r.confidenceLevel ?? 3), 0) / responses.length / 5
    : 0.5;

  return {
    visionScore,
    operationalScore,
    conflictScore,
    overallAlignmentScore,
    crlScore,
    crlLevel,
    readinessLevel,
    confidenceScore,
  };
}

// ── VRL Dynamic Recalculation (updated to use PRL composite) ─────────────────
function computeVrlWithCrl(params: {
  trl: number;
  mrlLevel?: number | null; // MRL level (1–9), optional — falls back to TRL if absent
  brlScore: number;  // 0–1 normalised BRL
  crlScore: number;  // 0–1 normalised CRL
  h4Stage: keyof typeof STAGE_WEIGHTS;
  riskIndex: number;
  confidenceScore: number;
}) {
  const weights = STAGE_WEIGHTS[params.h4Stage];
  const trlNorm = params.trl / 9;
  // PRL (Product Readiness Level) = (0.5 × TRL_norm) + (0.5 × MRL_norm)
  // Falls back to pure TRL when no MRL assessment exists
  const mrlNorm = params.mrlLevel != null
    ? Math.min(9, Math.max(0, params.mrlLevel)) / 9
    : trlNorm;
  const prlNorm = params.mrlLevel != null
    ? (0.5 * trlNorm) + (0.5 * mrlNorm)
    : trlNorm;
  const brlNorm = Math.max(0, Math.min(1, params.brlScore));
  const crlNorm = Math.max(0, Math.min(1, params.crlScore));

  const prlContrib = weights.alpha * prlNorm;  // α now weights PRL composite
  const brlContrib = weights.beta * brlNorm;
  const crlContrib = weights.gamma * crlNorm;

  const rawVrl = (prlContrib + brlContrib + crlContrib)
    * (1 - params.riskIndex)
    * params.confidenceScore;

  return {
    computedVrl: Math.max(0, Math.min(1, rawVrl)),
    trlContribution: prlContrib,  // kept for backward compat (now represents PRL contrib)
    brlContribution: brlContrib,
    crlContribution: crlContrib,
    trlNormalized: trlNorm,
    prlNormalized: prlNorm,
    mrlNormalized: mrlNorm,
    brlNormalized: brlNorm,
    crlNormalized: crlNorm,
  };
}

// ── Router ────────────────────────────────────────────────────────────────────
export const crlRouter = router({
  // ── Get question bank ──────────────────────────────────────────────────────
  getQuestions: protectedProcedure.query(() => {
    return CRL_QUESTIONS;
  }),

  // ── List assessments for a venture ────────────────────────────────────────
  listAssessments: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db
        .select()
        .from(crlAssessments)
        .where(eq(crlAssessments.ventureId, input.ventureId))
        .orderBy(desc(crlAssessments.createdAt));
    }),

  // ── Get a single assessment ────────────────────────────────────────────────
  getAssessment: protectedProcedure
    .input(z.object({ assessmentId: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const [assessment] = await db
        .select()
        .from(crlAssessments)
        .where(eq(crlAssessments.id, input.assessmentId));
      if (!assessment) throw new Error("Assessment not found");

      const responses = await db
        .select()
        .from(crlFounderResponses)
        .where(eq(crlFounderResponses.assessmentId, input.assessmentId))
        .orderBy(crlFounderResponses.founderId, crlFounderResponses.questionId);

      return { assessment, responses };
    }),

  // ── Create a new assessment ────────────────────────────────────────────────
  createAssessment: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      assessmentType: z.enum(["initial", "periodic", "triggered"]).default("initial"),
      h4Stage: z.enum(["H4.1_ideation", "H4.2_build_launch", "H4.3_validation", "H4.4_grow_scale"]).default("H4.1_ideation"),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(crlAssessments).values({
        ventureId: input.ventureId,
        assessmentType: input.assessmentType,
        h4Stage: input.h4Stage,
        status: "initiated",
      });
      return { assessmentId: result.insertId };
    }),

  // ── Submit a founder's responses ───────────────────────────────────────────
  submitFounderResponses: protectedProcedure
    .input(z.object({
      assessmentId: z.number(),
      founderId: z.number(),
      founderName: z.string(),
      responses: z.array(z.object({
        questionId: z.string(),
        questionPhase: z.enum(["vision", "operational", "conflict"]),
        responseText: z.string(),
        responseOption: z.string().optional(),
        confidenceLevel: z.number().min(1).max(5).default(3),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;

      // Delete any existing responses for this founder/assessment
      await db
        .delete(crlFounderResponses)
        .where(
          and(
            eq(crlFounderResponses.assessmentId, input.assessmentId),
            eq(crlFounderResponses.founderId, input.founderId)
          )
        );

      // Insert new responses
      for (const r of input.responses) {
        await db.insert(crlFounderResponses).values({
          assessmentId: input.assessmentId,
          founderId: input.founderId,
          founderName: input.founderName,
          questionId: r.questionId,
          questionPhase: r.questionPhase,
          responseText: r.responseText,
          responseOption: r.responseOption,
          confidenceLevel: r.confidenceLevel,
        });
      }

      // Update assessment status
      await db
        .update(crlAssessments)
        .set({ status: "in_progress", updatedAt: new Date() })
        .where(eq(crlAssessments.id, input.assessmentId));

      return { success: true };
    }),

  // ── Compute CRL score from all responses ──────────────────────────────────
  computeScore: protectedProcedure
    .input(z.object({ assessmentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;

      const responses = await db
        .select()
        .from(crlFounderResponses)
        .where(eq(crlFounderResponses.assessmentId, input.assessmentId));

      if (responses.length === 0) throw new Error("No responses found for this assessment");

      const scores = computeCrlScore(responses);

      await db
        .update(crlAssessments)
        .set({
          ...scores,
          status: "completed",
          updatedAt: new Date(),
        })
        .where(eq(crlAssessments.id, input.assessmentId));

      return scores;
    }),

  // ── Mode 1: AI Assessment Facilitation ────────────────────────────────────
  aiAssessmentChat: protectedProcedure
    .input(z.object({
      assessmentId: z.number(),
      ventureId: z.string(),
      founderName: z.string(),
      currentQuestion: z.string(),
      founderResponse: z.string(),
      conversationHistory: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).default([]),
    }))
    .mutation(async ({ input }) => {
      const messages = [
        {
          role: "system" as const,
          content: `You are a Cultural Readiness Level (CRL) assessment facilitator for EcoBlend VBS. 
Your role is to guide founders through the 10-question CRL assessment using the Socratic method.
Current question: ${input.currentQuestion}
Founder: ${input.founderName}
Venture ID: ${input.ventureId}

Guidelines:
- Ask one clarifying follow-up question to deepen the founder's response
- Be empathetic but probe for specificity — vague answers reduce CRL confidence
- If the response reveals a potential misalignment risk, gently surface it
- Keep responses concise (2–3 sentences max)
- End with a clear transition to the next question if the current one is complete`,
        },
        ...input.conversationHistory.map(m => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: input.founderResponse },
      ];

      const response = await invokeLLM({ messages });
      return { reply: response.choices[0].message.content };
    }),

  // ── Mode 2: AI Results Review ──────────────────────────────────────────────
  generateResultsReview: protectedProcedure
    .input(z.object({
      assessmentId: z.number(),
      ventureId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;

      const [assessment] = await db
        .select()
        .from(crlAssessments)
        .where(eq(crlAssessments.id, input.assessmentId));

      if (!assessment) throw new Error("Assessment not found");

      const responses = await db
        .select()
        .from(crlFounderResponses)
        .where(eq(crlFounderResponses.assessmentId, input.assessmentId));

      const [venture] = await db
        .select()
        .from(ventures)
        .where(eq(ventures.id, input.ventureId));

      // Group responses by founder
      const byFounder: Record<string, typeof responses> = {};
      for (const r of responses) {
        if (!byFounder[r.founderName]) byFounder[r.founderName] = [];
        byFounder[r.founderName].push(r);
      }

      const founderSummaries = Object.entries(byFounder).map(([name, resps]) => ({
        name,
        responses: resps.map(r => `${r.questionId}: ${r.responseText} (confidence: ${r.confidenceLevel}/5)`).join("\n"),
      }));

      const messages = [
        {
          role: "system" as const,
          content: `You are a Cultural Readiness Level (CRL) analyst for EcoBlend VBS.
Analyse the following founder assessment responses and produce a structured results review.

Venture: ${venture?.name ?? input.ventureId}
H4 Stage: ${assessment.h4Stage}
CRL Score: ${assessment.crlScore?.toFixed(2) ?? "not computed"}
CRL Level: ${assessment.crlLevel ?? "not computed"}/9
Readiness: ${assessment.readinessLevel ?? "not computed"}

Your output must be valid JSON with this exact structure:
{
  "executiveSummary": "2-3 sentence overview of cultural alignment",
  "visionAlignment": { "score": 0.0-1.0, "strengths": ["..."], "gaps": ["..."] },
  "operationalAlignment": { "score": 0.0-1.0, "strengths": ["..."], "gaps": ["..."] },
  "conflictResolution": { "score": 0.0-1.0, "strengths": ["..."], "gaps": ["..."] },
  "criticalMisalignments": ["specific misalignment 1", "specific misalignment 2"],
  "actionPlan": [
    { "priority": "immediate|short_term|long_term", "action": "...", "owner": "...", "timeline": "..." }
  ],
  "interventionRequired": true|false,
  "interventionType": "mediation|founders_agreement|coaching|null"
}`,
        },
        {
          role: "user" as const,
          content: founderSummaries.map(f => `## ${f.name}\n${f.responses}`).join("\n\n"),
        },
      ];

      const response = await invokeLLM({ messages });
      const content = (response.choices[0].message.content as string) ?? "{}";

      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = { executiveSummary: content };
      }

      // Save to assessment record
      await db
        .update(crlAssessments)
        .set({
          aiSummary: parsed.executiveSummary as string,
          criticalMisalignments: JSON.stringify(parsed.criticalMisalignments ?? []),
          actionPlan: JSON.stringify(parsed.actionPlan ?? []),
          updatedAt: new Date(),
        })
        .where(eq(crlAssessments.id, input.assessmentId));

      return parsed;
    }),

  // ── Mode 3: AI Conflict Mediation ─────────────────────────────────────────
  createIntervention: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      assessmentId: z.number().optional(),
      triggeredBy: z.enum(["low_crl", "misalignment_detected", "founder_request", "scheduled_review", "drift_detected"]),
      interventionType: z.enum(["mediation", "founders_agreement", "coaching", "conflict_resolution", "check_in"]),
      participatingFounderIds: z.array(z.number()).default([]),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(crlInterventions).values({
        ventureId: input.ventureId,
        assessmentId: input.assessmentId,
        triggeredBy: input.triggeredBy,
        interventionType: input.interventionType,
        participatingFounderIds: JSON.stringify(input.participatingFounderIds),
        status: "in_progress",
      });
      return { interventionId: result.insertId };
    }),

  aiMediationChat: protectedProcedure
    .input(z.object({
      interventionId: z.number(),
      ventureId: z.string(),
      interventionType: z.enum(["mediation", "founders_agreement", "coaching", "conflict_resolution", "check_in"]),
      userMessage: z.string(),
      conversationHistory: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).default([]),
      conflictContext: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const systemPrompts: Record<string, string> = {
        mediation: `You are a neutral mediator facilitating a co-founder conflict resolution session for EcoBlend VBS.
Your role is to help both parties articulate their positions, find common ground, and reach documented agreements.
Use the Interest-Based Relational (IBR) approach: separate people from problems, focus on interests not positions.
Keep responses concise, neutral, and solution-focused.`,
        founders_agreement: `You are a Founders' Agreement facilitator for EcoBlend VBS.
Your role is to help co-founders document their agreements on equity, roles, decision-making, and exit clauses.
Ask structured questions to surface assumptions and document clear, binding agreements.
Output should be suitable for legal review.`,
        coaching: `You are an executive coach for EcoBlend VBS founders.
Your role is to help founders develop self-awareness, communication skills, and leadership capability.
Use the GROW model (Goal, Reality, Options, Will) to structure coaching conversations.`,
        conflict_resolution: `You are a conflict resolution specialist for EcoBlend VBS.
A serious co-founder conflict has been escalated. Your role is to de-escalate, identify root causes, and propose resolution pathways.
Be direct but empathetic. Reference the venture's shared mission to re-anchor both parties.`,
        check_in: `You are conducting a routine cultural health check-in for EcoBlend VBS.
Your role is to assess current team dynamics, surface any emerging tensions, and reinforce positive cultural norms.
Keep the tone positive and forward-looking.`,
      };

      const messages = [
        {
          role: "system" as const,
          content: systemPrompts[input.interventionType] + (input.conflictContext ? `\n\nContext: ${input.conflictContext}` : ""),
        },
        ...input.conversationHistory.map(m => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: input.userMessage },
      ];

      const response = await invokeLLM({ messages });
      const reply = (response.choices[0].message.content as string) ?? "";

      // Append to conversation log
      const db = (await getDb())!;
      const [existing] = await db
        .select({ conversationLog: crlInterventions.conversationLog })
        .from(crlInterventions)
        .where(eq(crlInterventions.id, input.interventionId));

      const log: Array<{ role: string; content: string; timestamp: string }> =
        existing?.conversationLog ? JSON.parse(existing.conversationLog) : [];
      log.push({ role: "user", content: input.userMessage, timestamp: new Date().toISOString() });
      log.push({ role: "assistant", content: reply, timestamp: new Date().toISOString() });

      await db
        .update(crlInterventions)
        .set({ conversationLog: JSON.stringify(log), updatedAt: new Date() })
        .where(eq(crlInterventions.id, input.interventionId));

      return { reply };
    }),

  resolveIntervention: protectedProcedure
    .input(z.object({
      interventionId: z.number(),
      resolutionAchieved: z.boolean(),
      agreementsDocumented: z.string().optional(),
      followUpRequired: z.boolean().default(false),
      followUpDate: z.date().optional(),
      founderSatisfactionScore: z.number().min(1).max(10).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db
        .update(crlInterventions)
        .set({
          status: "completed",
          resolutionAchieved: input.resolutionAchieved,
          agreementsDocumented: input.agreementsDocumented,
          followUpRequired: input.followUpRequired,
          followUpDate: input.followUpDate,
          founderSatisfactionScore: input.founderSatisfactionScore,
          updatedAt: new Date(),
        })
        .where(eq(crlInterventions.id, input.interventionId));
      return { success: true };
    }),

  listInterventions: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db
        .select()
        .from(crlInterventions)
        .where(eq(crlInterventions.ventureId, input.ventureId))
        .orderBy(desc(crlInterventions.createdAt));
    }),

  // ── Mode 4: Continuous Monitoring ─────────────────────────────────────────
  createMonitoringRecord: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      assessmentId: z.number().optional(),
      frequency: z.enum(["biweekly", "monthly", "quarterly"]).default("monthly"),
      crlScoreCurrent: z.number().min(0).max(1),
      crlScorePrevious: z.number().min(0).max(1).optional(),
      questionsChecked: z.array(z.string()).default([]),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;

      const driftScore = input.crlScorePrevious !== undefined
        ? Math.abs(input.crlScoreCurrent - input.crlScorePrevious)
        : 0;

      const driftLevel =
        driftScore >= 0.3 ? "critical" :
        driftScore >= 0.2 ? "moderate" :
        driftScore >= 0.1 ? "minor" : "none";

      const driftDetected = driftScore >= 0.1;
      const escalationTriggered = driftScore >= 0.3 || input.crlScoreCurrent < 0.3;

      const [result] = await db.insert(crlMonitoringRecords).values({
        ventureId: input.ventureId,
        assessmentId: input.assessmentId,
        frequency: input.frequency,
        crlScoreCurrent: input.crlScoreCurrent,
        crlScorePrevious: input.crlScorePrevious,
        driftScore,
        driftLevel: driftLevel as "none" | "minor" | "moderate" | "critical",
        questionsChecked: JSON.stringify(input.questionsChecked),
        driftDetected,
        escalationTriggered,
      });

      return { monitoringId: result.insertId, driftLevel, driftDetected, escalationTriggered };
    }),

  generateCulturalHealthReport: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      monitoringId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;

      const [record] = await db
        .select()
        .from(crlMonitoringRecords)
        .where(eq(crlMonitoringRecords.id, input.monitoringId));

      if (!record) throw new Error("Monitoring record not found");

      const [venture] = await db
        .select()
        .from(ventures)
        .where(eq(ventures.id, input.ventureId));

      const recentInterventions = await db
        .select()
        .from(crlInterventions)
        .where(eq(crlInterventions.ventureId, input.ventureId))
        .orderBy(desc(crlInterventions.createdAt))
        .limit(3);

      const messages = [
        {
          role: "system" as const,
          content: `You are generating a Cultural Health Report for EcoBlend VBS.
Produce a concise, actionable report in JSON format:
{
  "overallHealth": "healthy|watch|critical",
  "headline": "One-sentence cultural health summary",
  "driftAnalysis": "2-3 sentences on what the drift score means",
  "keyRisks": ["risk 1", "risk 2"],
  "recommendations": ["action 1", "action 2", "action 3"],
  "nextCheckIn": "biweekly|monthly|quarterly"
}`,
        },
        {
          role: "user" as const,
          content: `Venture: ${venture?.name ?? input.ventureId}
CRL Current: ${record.crlScoreCurrent?.toFixed(3)}
CRL Previous: ${record.crlScorePrevious?.toFixed(3) ?? "N/A"}
Drift Score: ${record.driftScore?.toFixed(3)}
Drift Level: ${record.driftLevel}
Escalation Triggered: ${record.escalationTriggered}
Recent Interventions: ${recentInterventions.length} in history`,
        },
      ];

      const response = await invokeLLM({ messages });
      const content = (response.choices[0].message.content as string) ?? "{}";

      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = { headline: content };
      }

      await db
        .update(crlMonitoringRecords)
        .set({ aiReport: JSON.stringify(parsed) })
        .where(eq(crlMonitoringRecords.id, input.monitoringId));

      return parsed;
    }),

  listMonitoringRecords: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db
        .select()
        .from(crlMonitoringRecords)
        .where(eq(crlMonitoringRecords.ventureId, input.ventureId))
        .orderBy(desc(crlMonitoringRecords.checkInDate));
    }),

  // ── VRL Dynamic Recalculation with CRL ────────────────────────────────────
  computeVrlWithCrl: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      h4Stage: z.enum(["H4.1_ideation", "H4.2_build_launch", "H4.3_validation", "H4.4_grow_scale"]),
      trl: z.number().min(1).max(9),
      brlScore: z.number().min(0).max(1).default(0.5),
      crlScore: z.number().min(0).max(1),
      riskIndex: z.number().min(0).max(1).default(0.3),
      confidenceScore: z.number().min(0).max(1).default(0.7),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      // Look up latest MRL assessment for PRL composite
      const mrlRows = await db.select().from(mrlAssessments)
        .where(eq(mrlAssessments.ventureId, input.ventureId))
        .orderBy(desc(mrlAssessments.assessedAt)).limit(1);
      const mrlLevel = mrlRows[0]?.mrlLevel ?? null;
      const result = computeVrlWithCrl({
        trl: input.trl,
        mrlLevel,
        brlScore: input.brlScore,
        crlScore: input.crlScore,
        h4Stage: input.h4Stage,
        riskIndex: input.riskIndex,
        confidenceScore: input.confidenceScore,
      });

      const weights = STAGE_WEIGHTS[input.h4Stage];
      // Upsert VRL dynamic weights record
      const existing = await db
        .select()
        .from(vrlDynamicWeights)
        .where(eq(vrlDynamicWeights.ventureId, input.ventureId));

      if (existing.length > 0) {
        await db
          .update(vrlDynamicWeights)
          .set({
            h4Stage: input.h4Stage,
            alphaWeight: weights.alpha,
            betaWeight: weights.beta,
            gammaWeight: weights.gamma,
            trlNormalized: result.trlNormalized,
            brlNormalized: result.brlNormalized,
            crlNormalized: result.crlNormalized,
            riskIndex: input.riskIndex,
            confidenceScore: input.confidenceScore,
            computedVrl: result.computedVrl,
            trlContribution: result.trlContribution,
            brlContribution: result.brlContribution,
            crlContribution: result.crlContribution,
            lastCalculatedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(vrlDynamicWeights.ventureId, input.ventureId));
      } else {
        await db.insert(vrlDynamicWeights).values({
          ventureId: input.ventureId,
          h4Stage: input.h4Stage,
          alphaWeight: weights.alpha,
          betaWeight: weights.beta,
          gammaWeight: weights.gamma,
          trlNormalized: result.trlNormalized,
          brlNormalized: result.brlNormalized,
          crlNormalized: result.crlNormalized,
          riskIndex: input.riskIndex,
          confidenceScore: input.confidenceScore,
          computedVrl: result.computedVrl,
          trlContribution: result.trlContribution,
          brlContribution: result.brlContribution,
          crlContribution: result.crlContribution,
          lastCalculatedAt: new Date(),
        });
      }

      return {
        ...result,
        weights,
        h4Stage: input.h4Stage,
        vrlLevel: Math.max(1, Math.min(4, Math.round(result.computedVrl * 4))),
      };
    }),

  getVrlDynamicWeights: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const [record] = await db
        .select()
        .from(vrlDynamicWeights)
        .where(eq(vrlDynamicWeights.ventureId, input.ventureId));
      return record ?? null;
    }),

  getStageWeights: protectedProcedure.query(() => {
    return STAGE_WEIGHTS;
  }),

  // ── Get founders for a venture ─────────────────────────────────────────────
  getVentureFounders: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db
        .select()
        .from(founders)
        .where(eq(founders.ventureId, input.ventureId));
    }),
});
