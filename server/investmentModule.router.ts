/**
 * Investment Module Router — Sprint 66
 * Covers: Readiness Scoring, Pitch Deck Generation, Business Plan, Execution Plan,
 *         Investor Matching, KPIs, Fundraising Rounds
 */
import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import {
  invReadinessScores,
  invOutputs,
  invTargets,
  invKpis,
  invFundraisingRounds,
  ventures,
  experiments,
  interviews,
  financialSnapshots,
} from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

// ─── Scoring Engine ───────────────────────────────────────────────────────────

function computeCompositeScore(inputs: {
  trl: number;
  vrl: number;
  brlScore: number;
  crlScore: number;
  experimentPassRate: number;
  interviewCount: number;
  validatedInterviews: number;
  revenueActual: number;
  revenueTarget: number;
  riskIndex: number;
  irlScore?: number;
}): {
  commercialScore: number;
  technicalScore: number;
  validationScore: number;
  supplyChainScore: number;
  impactScore: number;
  investmentAttractiveness: number;
  compositeScore: number;
} {
  const {
    trl, vrl, brlScore, crlScore, experimentPassRate,
    interviewCount, validatedInterviews, revenueActual,
    revenueTarget, riskIndex, irlScore = 5,
  } = inputs;

  const revenueAttainment = revenueTarget > 0
    ? Math.min(100, (revenueActual / revenueTarget) * 100) : 0;
  const interviewTraction = interviewCount > 0
    ? Math.min(100, (validatedInterviews / interviewCount) * 100) : 0;
  const commercialScore = (revenueAttainment * 0.6 + interviewTraction * 0.4);
  const trlNorm = ((trl - 1) / 8) * 100;
  const technicalScore = (trlNorm * 0.6 + experimentPassRate * 0.4);
  const validationScore = (interviewTraction * 0.5 + brlScore * 0.5);
  const supplyChainScore = trl >= 4 ? Math.min(100, ((trl - 3) / 5) * 100) : 0;
  const impactScore = Math.min(100, (irlScore / 10) * 100);
  const vrlNorm = ((vrl - 1) / 8) * 100;
  const riskAdjustment = (1 - riskIndex);
  const investmentAttractiveness = Math.min(100,
    (vrlNorm * 0.4 + crlScore * 0.3 + brlScore * 0.3) * riskAdjustment
  );
  const compositeScore = Math.round(
    commercialScore * 0.20 + technicalScore * 0.20 + validationScore * 0.20 +
    supplyChainScore * 0.10 + impactScore * 0.15 + investmentAttractiveness * 0.15
  );

  return {
    commercialScore: Math.round(commercialScore),
    technicalScore: Math.round(technicalScore),
    validationScore: Math.round(validationScore),
    supplyChainScore: Math.round(supplyChainScore),
    impactScore: Math.round(impactScore),
    investmentAttractiveness: Math.round(investmentAttractiveness),
    compositeScore,
  };
}

// ─── Readiness Router ─────────────────────────────────────────────────────────

const readinessRouter = router({
  calculate: protectedProcedure
    .input(z.object({ ventureId: z.string(), offeringId: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [venture] = await db.select().from(ventures).where(eq(ventures.id, input.ventureId)).limit(1);
      if (!venture) throw new Error("Venture not found");
      const exps = await db.select().from(experiments).where(eq(experiments.ventureId, input.ventureId));
      const passedExps = exps.filter(e => e.outcome === "Pass").length;
      const completedExps = exps.filter(e => e.outcome !== "Pending").length;
      const experimentPassRate = completedExps > 0 ? (passedExps / completedExps) * 100 : 0;
      const ivws = await db.select().from(interviews).where(eq(interviews.ventureId, input.ventureId));
      const validatedIvws = ivws.filter(i => i.validationSignals && i.validationSignals.length > 0).length;
      const [latestFin] = await db.select().from(financialSnapshots)
        .where(eq(financialSnapshots.ventureId, input.ventureId))
        .orderBy(desc(financialSnapshots.createdAt)).limit(1);
      const scores = computeCompositeScore({
        trl: venture.trl ?? 1, vrl: venture.vrl ?? 1,
        brlScore: 0, crlScore: 0, experimentPassRate,
        interviewCount: ivws.length, validatedInterviews: validatedIvws,
        revenueActual: latestFin?.revenueActual ?? 0,
        revenueTarget: latestFin?.revenueTarget ?? 1,
        riskIndex: 0.3,
      });
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      const gaps: string[] = [];
      if (scores.technicalScore >= 60) strengths.push(`Strong technical validation (TRL ${venture.trl})`);
      else weaknesses.push(`Technical readiness below investment threshold (TRL ${venture.trl})`);
      if (scores.commercialScore >= 60) strengths.push("Commercial traction demonstrated");
      else gaps.push("Commercial traction needs strengthening");
      if (scores.validationScore >= 60) strengths.push("Customer validation evidence strong");
      else weaknesses.push("Insufficient customer validation data");
      if (scores.impactScore >= 60) strengths.push("Strong impact credentials");
      else gaps.push("Impact measurement framework needs formalising");
      const existing = await db.select().from(invReadinessScores)
        .where(and(
          eq(invReadinessScores.ventureId, input.ventureId),
          ...(input.offeringId ? [eq(invReadinessScores.offeringId, input.offeringId)] : [])
        )).limit(1);
      const scoreData = {
        ventureId: input.ventureId,
        offeringId: input.offeringId ?? null,
        ...scores,
        vrlScore: venture.vrl,
        trlScore: venture.trl,
        strengthsJson: JSON.stringify(strengths),
        weaknessesJson: JSON.stringify(weaknesses),
        gapsJson: JSON.stringify(gaps),
        calculatedBy: ctx.user.openId,
        updatedAt: new Date(),
      };
      if (existing.length > 0) {
        await db.update(invReadinessScores).set(scoreData).where(eq(invReadinessScores.id, existing[0].id));
        return { id: existing[0].id, ...scores, strengths, weaknesses, gaps };
      } else {
        const [result] = await db.insert(invReadinessScores).values({ ...scoreData, createdAt: new Date() }).$returningId();
        return { id: result.id, ...scores, strengths, weaknesses, gaps };
      }
    }),

  get: protectedProcedure
    .input(z.object({ ventureId: z.string(), offeringId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const conditions = [eq(invReadinessScores.ventureId, input.ventureId)];
      if (input.offeringId) conditions.push(eq(invReadinessScores.offeringId, input.offeringId));
      const [score] = await db.select().from(invReadinessScores)
        .where(and(...conditions)).orderBy(desc(invReadinessScores.updatedAt)).limit(1);
      return score ?? null;
    }),

  list: protectedProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return input.ventureId
        ? db.select().from(invReadinessScores).where(eq(invReadinessScores.ventureId, input.ventureId)).orderBy(desc(invReadinessScores.updatedAt))
        : db.select().from(invReadinessScores).orderBy(desc(invReadinessScores.updatedAt));
    }),

  portfolioSummary: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { avgComposite: 0, readyCount: 0, total: 0, byVenture: [] };
    const scores = await db.select().from(invReadinessScores).orderBy(desc(invReadinessScores.updatedAt));
    const byVenture = new Map<string, typeof scores[0]>();
    for (const s of scores) {
      if (s.ventureId && !byVenture.has(s.ventureId)) byVenture.set(s.ventureId, s);
    }
    const latest = Array.from(byVenture.values());
    const avgComposite = latest.length > 0
      ? Math.round(latest.reduce((sum, s) => sum + (s.compositeScore ?? 0), 0) / latest.length) : 0;
    const readyCount = latest.filter(s => (s.compositeScore ?? 0) >= 60).length;
    return { avgComposite, readyCount, total: latest.length, byVenture: latest };
  }),
});

// ─── Outputs Router ───────────────────────────────────────────────────────────

const outputsRouter = router({
  list: protectedProcedure
    .input(z.object({ ventureId: z.string().optional(), offeringId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [];
      if (input.ventureId) conditions.push(eq(invOutputs.ventureId, input.ventureId));
      if (input.offeringId) conditions.push(eq(invOutputs.offeringId, input.offeringId));
      return conditions.length
        ? db.select().from(invOutputs).where(and(...conditions)).orderBy(desc(invOutputs.createdAt))
        : db.select().from(invOutputs).orderBy(desc(invOutputs.createdAt));
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [output] = await db.select().from(invOutputs).where(eq(invOutputs.id, input.id)).limit(1);
      return output ?? null;
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(["draft", "in_review", "approved", "sent", "archived"]) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(invOutputs).set({ status: input.status, updatedAt: new Date() }).where(eq(invOutputs.id, input.id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(invOutputs).where(eq(invOutputs.id, input.id));
      return { success: true };
    }),

  generatePitchDeck: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      offeringId: z.number().optional(),
      scoreId: z.number().optional(),
      title: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [venture] = await db.select().from(ventures).where(eq(ventures.id, input.ventureId)).limit(1);
      if (!venture) throw new Error("Venture not found");
      const exps = await db.select().from(experiments).where(eq(experiments.ventureId, input.ventureId));
      const ivws = await db.select().from(interviews).where(eq(interviews.ventureId, input.ventureId));
      const [latestFin] = await db.select().from(financialSnapshots)
        .where(eq(financialSnapshots.ventureId, input.ventureId)).orderBy(desc(financialSnapshots.createdAt)).limit(1);
      const context = [
        `Venture: ${venture.name}`,
        `Tagline: ${venture.tagline ?? "Social impact venture"}`,
        `Sector: ${venture.sector ?? "Sustainability"}`,
        `Stage: VRL ${venture.vrl}, TRL ${venture.trl}`,
        `Status: ${venture.status}`,
        `Revenue: £${latestFin?.revenueActual ?? 0} actual vs £${latestFin?.revenueTarget ?? 0} target`,
        `Experiments: ${exps.length} total, ${exps.filter(e => e.outcome === "Pass").length} passed`,
        `Customer Interviews: ${ivws.length} conducted`,
        `Investment Raised: £${latestFin?.investmentRaised ?? 0} of £${latestFin?.investmentTarget ?? 0} target`,
      ].join("\n");
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are an expert investment pitch writer for social impact ventures. Generate a compelling, investor-ready pitch deck narrative. Return structured JSON with exactly these keys: problem, opportunity, solution, market, traction, businessModel, supplyChain, team, financials, ask. Each section should be 2-4 sentences of compelling narrative.",
          },
          { role: "user", content: `Generate a pitch deck for this venture:\n${context}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "pitch_deck",
            strict: true,
            schema: {
              type: "object",
              properties: {
                problem: { type: "string" }, opportunity: { type: "string" },
                solution: { type: "string" }, market: { type: "string" },
                traction: { type: "string" }, businessModel: { type: "string" },
                supplyChain: { type: "string" }, team: { type: "string" },
                financials: { type: "string" }, ask: { type: "string" },
              },
              required: ["problem", "opportunity", "solution", "market", "traction", "businessModel", "supplyChain", "team", "financials", "ask"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = JSON.parse(response.choices[0].message.content as string);
      const [result] = await db.insert(invOutputs).values({
        ventureId: input.ventureId, offeringId: input.offeringId ?? null,
        scoreId: input.scoreId ?? null, outputType: "pitch_deck",
        title: input.title ?? `${venture.name} — Pitch Deck`, status: "draft",
        problemSection: content.problem, opportunitySection: content.opportunity,
        solutionSection: content.solution, marketSection: content.market,
        tractionSection: content.traction, businessModelSection: content.businessModel,
        supplyChainSection: content.supplyChain, teamSection: content.team,
        financialsSection: content.financials, askSection: content.ask,
        contentJson: JSON.stringify(content), generatedAt: new Date(),
        createdAt: new Date(), updatedAt: new Date(),
      }).$returningId();
      return { id: result.id, content, title: input.title ?? `${venture.name} — Pitch Deck` };
    }),

  generateBusinessPlan: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      offeringId: z.number().optional(),
      scoreId: z.number().optional(),
      title: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [venture] = await db.select().from(ventures).where(eq(ventures.id, input.ventureId)).limit(1);
      if (!venture) throw new Error("Venture not found");
      const exps = await db.select().from(experiments).where(eq(experiments.ventureId, input.ventureId));
      const ivws = await db.select().from(interviews).where(eq(interviews.ventureId, input.ventureId));
      const [latestFin] = await db.select().from(financialSnapshots)
        .where(eq(financialSnapshots.ventureId, input.ventureId)).orderBy(desc(financialSnapshots.createdAt)).limit(1);
      const context = [
        `Venture: ${venture.name} | Sector: ${venture.sector ?? "Sustainability"} | Stage: VRL ${venture.vrl}, TRL ${venture.trl}`,
        `Revenue: £${latestFin?.revenueActual ?? 0} actual | Burn: £${latestFin?.monthlyBurn ?? 0}/month | Runway: ${latestFin?.cashRunway ?? 0} months`,
        `Experiments: ${exps.filter(e => e.outcome === "Pass").length}/${exps.length} passed`,
        `Customer Interviews: ${ivws.length}`,
      ].join("\n");
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a business plan writer for social impact ventures. Generate a comprehensive business plan. Return structured JSON with keys: executiveSummary, marketAnalysis, productService, commercialStrategy, financialProjections, riskAnalysis. Each section should be 3-5 sentences of detailed, investor-grade content.",
          },
          { role: "user", content: `Generate a business plan for:\n${context}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "business_plan",
            strict: true,
            schema: {
              type: "object",
              properties: {
                executiveSummary: { type: "string" }, marketAnalysis: { type: "string" },
                productService: { type: "string" }, commercialStrategy: { type: "string" },
                financialProjections: { type: "string" }, riskAnalysis: { type: "string" },
              },
              required: ["executiveSummary", "marketAnalysis", "productService", "commercialStrategy", "financialProjections", "riskAnalysis"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = JSON.parse(response.choices[0].message.content as string);
      const [result] = await db.insert(invOutputs).values({
        ventureId: input.ventureId, offeringId: input.offeringId ?? null,
        scoreId: input.scoreId ?? null, outputType: "business_plan",
        title: input.title ?? `${venture.name} — Business Plan`, status: "draft",
        executiveSummarySection: content.executiveSummary, marketAnalysisSection: content.marketAnalysis,
        productServiceSection: content.productService, commercialStrategySection: content.commercialStrategy,
        financialProjectionsSection: content.financialProjections, riskAnalysisSection: content.riskAnalysis,
        contentJson: JSON.stringify(content), generatedAt: new Date(),
        createdAt: new Date(), updatedAt: new Date(),
      }).$returningId();
      return { id: result.id, content, title: input.title ?? `${venture.name} — Business Plan` };
    }),

  generateExecutionPlan: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      offeringId: z.number().optional(),
      scoreId: z.number().optional(),
      title: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [venture] = await db.select().from(ventures).where(eq(ventures.id, input.ventureId)).limit(1);
      if (!venture) throw new Error("Venture not found");
      const [latestFin] = await db.select().from(financialSnapshots)
        .where(eq(financialSnapshots.ventureId, input.ventureId)).orderBy(desc(financialSnapshots.createdAt)).limit(1);
      const context = [
        `Venture: ${venture.name} | Stage: VRL ${venture.vrl}, TRL ${venture.trl}`,
        `Monthly Burn: £${latestFin?.monthlyBurn ?? 0} | Runway: ${latestFin?.cashRunway ?? 0} months`,
        `Investment Raised: £${latestFin?.investmentRaised ?? 0}`,
      ].join("\n");
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are an execution planning expert for social impact ventures. Generate a 90-day execution plan. Return structured JSON with keys: roadmap90Day, productDev, supplyChain, team, budget, milestones. Each section should be 3-5 sentences with specific, actionable content.",
          },
          { role: "user", content: `Generate a 90-day execution plan for:\n${context}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "execution_plan",
            strict: true,
            schema: {
              type: "object",
              properties: {
                roadmap90Day: { type: "string" }, productDev: { type: "string" },
                supplyChain: { type: "string" }, team: { type: "string" },
                budget: { type: "string" }, milestones: { type: "string" },
              },
              required: ["roadmap90Day", "productDev", "supplyChain", "team", "budget", "milestones"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = JSON.parse(response.choices[0].message.content as string);
      const [result] = await db.insert(invOutputs).values({
        ventureId: input.ventureId, offeringId: input.offeringId ?? null,
        scoreId: input.scoreId ?? null, outputType: "execution_plan",
        title: input.title ?? `${venture.name} — 90-Day Execution Plan`, status: "draft",
        roadmap90DaySection: content.roadmap90Day, productDevSection: content.productDev,
        supplyChainPlanSection: content.supplyChain, teamPlanSection: content.team,
        budgetSection: content.budget, milestonesSection: content.milestones,
        contentJson: JSON.stringify(content), generatedAt: new Date(),
        createdAt: new Date(), updatedAt: new Date(),
      }).$returningId();
      return { id: result.id, content, title: input.title ?? `${venture.name} — 90-Day Execution Plan` };
    }),

  generateInvestorSummary: protectedProcedure
    .input(z.object({ ventureId: z.string(), offeringId: z.number().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [venture] = await db.select().from(ventures).where(eq(ventures.id, input.ventureId)).limit(1);
      if (!venture) throw new Error("Venture not found");
      const [score] = await db.select().from(invReadinessScores)
        .where(eq(invReadinessScores.ventureId, input.ventureId)).orderBy(desc(invReadinessScores.updatedAt)).limit(1);
      const context = [
        `Venture: ${venture.name} | ${venture.tagline ?? ""}`,
        `Stage: VRL ${venture.vrl}, TRL ${venture.trl}`,
        `Composite Readiness: ${score?.compositeScore ?? "Not calculated"}%`,
        `Commercial: ${score?.commercialScore ?? "?"}% | Technical: ${score?.technicalScore ?? "?"}%`,
      ].join("\n");
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are an investment analyst. Write a concise 1-page investor summary. Return JSON with keys: headline, investmentCase, keyMetrics, riskFactors, recommendation.",
          },
          { role: "user", content: `Write investor summary for:\n${context}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "investor_summary",
            strict: true,
            schema: {
              type: "object",
              properties: {
                headline: { type: "string" }, investmentCase: { type: "string" },
                keyMetrics: { type: "string" }, riskFactors: { type: "string" },
                recommendation: { type: "string" },
              },
              required: ["headline", "investmentCase", "keyMetrics", "riskFactors", "recommendation"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = JSON.parse(response.choices[0].message.content as string);
      const [result] = await db.insert(invOutputs).values({
        ventureId: input.ventureId, offeringId: input.offeringId ?? null,
        outputType: "investor_summary", title: `${venture.name} — Investor Summary`,
        status: "draft", aiNarrative: JSON.stringify(content),
        contentJson: JSON.stringify(content), generatedAt: new Date(),
        createdAt: new Date(), updatedAt: new Date(),
      }).$returningId();
      return { id: result.id, content };
    }),
});

// ─── Targets Router ───────────────────────────────────────────────────────────

const targetsRouter = router({
  list: protectedProcedure
    .input(z.object({ ventureId: z.string().optional(), offeringId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [];
      if (input.ventureId) conditions.push(eq(invTargets.ventureId, input.ventureId));
      if (input.offeringId) conditions.push(eq(invTargets.offeringId, input.offeringId));
      return conditions.length
        ? db.select().from(invTargets).where(and(...conditions)).orderBy(desc(invTargets.matchScore))
        : db.select().from(invTargets).orderBy(desc(invTargets.matchScore));
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      offeringId: z.number().optional(),
      investorName: z.string().min(1),
      fund: z.string().optional(),
      investorType: z.enum(["angel", "vc", "family_office", "corporate_vc", "impact_fund", "grant", "crowdfunding", "debt"]).optional(),
      geographicFocus: z.string().optional(),
      stageFocus: z.string().optional(),
      sectorFocus: z.string().optional(),
      minCheque: z.number().optional(),
      maxCheque: z.number().optional(),
      impactFocused: z.boolean().optional(),
      matchScore: z.number().min(0).max(100).optional(),
      matchRationale: z.string().optional(),
      outreachStatus: z.enum(["identified", "researching", "warm_intro", "contacted", "meeting_booked", "dd_requested", "term_sheet", "closed", "passed"]).optional(),
      contactEmail: z.string().optional(),
      linkedinUrl: z.string().optional(),
      warmIntroSource: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      if (input.id) {
        await db.update(invTargets).set({ ...input, updatedAt: new Date() }).where(eq(invTargets.id, input.id));
        return { id: input.id };
      }
      const [result] = await db.insert(invTargets).values({ ...input, createdAt: new Date(), updatedAt: new Date() }).$returningId();
      return { id: result.id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(invTargets).where(eq(invTargets.id, input.id));
      return { success: true };
    }),

  aiMatch: protectedProcedure
    .input(z.object({ ventureId: z.string(), offeringId: z.number().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [venture] = await db.select().from(ventures).where(eq(ventures.id, input.ventureId)).limit(1);
      if (!venture) throw new Error("Venture not found");
      const [score] = await db.select().from(invReadinessScores)
        .where(eq(invReadinessScores.ventureId, input.ventureId)).orderBy(desc(invReadinessScores.updatedAt)).limit(1);
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an investor matching expert. Identify 5 ideal investor profiles for this venture. Return JSON with key "investors" containing an array of 5 objects, each with: investorName, fund, investorType, matchScore (0-100), matchRationale, sectorFocus, stageFocus, impactFocused (boolean).`,
          },
          {
            role: "user",
            content: `Find investor matches for: ${venture.name} (${venture.sector ?? "sustainability"}, VRL ${venture.vrl}, TRL ${venture.trl}, composite readiness ${score?.compositeScore ?? 0}%)`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "investor_matches",
            strict: true,
            schema: {
              type: "object",
              properties: {
                investors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      investorName: { type: "string" }, fund: { type: "string" },
                      investorType: { type: "string" }, matchScore: { type: "number" },
                      matchRationale: { type: "string" }, sectorFocus: { type: "string" },
                      stageFocus: { type: "string" }, impactFocused: { type: "boolean" },
                    },
                    required: ["investorName", "fund", "investorType", "matchScore", "matchRationale", "sectorFocus", "stageFocus", "impactFocused"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["investors"],
              additionalProperties: false,
            },
          },
        },
      });
      const { investors } = JSON.parse(response.choices[0].message.content as string) as {
        investors: Array<{
          investorName: string; fund: string; investorType: string;
          matchScore: number; matchRationale: string;
          sectorFocus: string; stageFocus: string; impactFocused: boolean;
        }>;
      };
      const inserted = [];
      for (const inv of investors) {
        const [result] = await db.insert(invTargets).values({
          ventureId: input.ventureId, offeringId: input.offeringId ?? null,
          investorName: inv.investorName, fund: inv.fund,
          investorType: (inv.investorType as "angel" | "vc" | "family_office" | "corporate_vc" | "impact_fund" | "grant" | "crowdfunding" | "debt") ?? "vc",
          matchScore: inv.matchScore, matchRationale: inv.matchRationale,
          sectorFocus: inv.sectorFocus, stageFocus: inv.stageFocus,
          impactFocused: inv.impactFocused, outreachStatus: "identified",
          createdAt: new Date(), updatedAt: new Date(),
        }).$returningId();
        inserted.push({ id: result.id, ...inv });
      }
      return { investors: inserted };
    }),
});

// ─── KPIs Router ──────────────────────────────────────────────────────────────

const kpisRouter = router({
  get: protectedProcedure
    .input(z.object({ ventureId: z.string(), offeringId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const conditions = [eq(invKpis.ventureId, input.ventureId)];
      if (input.offeringId) conditions.push(eq(invKpis.offeringId, input.offeringId));
      const [kpi] = await db.select().from(invKpis).where(and(...conditions)).orderBy(desc(invKpis.updatedAt)).limit(1);
      return kpi ?? null;
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      offeringId: z.number().optional(),
      askAmount: z.number().optional(),
      preMoneyVal: z.number().optional(),
      useOfFunds: z.string().optional(),
      revenueYear1: z.number().optional(),
      revenueYear3: z.number().optional(),
      revenueYear5: z.number().optional(),
      ebitdaYear3: z.number().optional(),
      ebitdaYear5: z.number().optional(),
      burnRate: z.number().optional(),
      runway: z.number().optional(),
      customersCount: z.number().optional(),
      revenueActual: z.number().optional(),
      growthRate: z.number().optional(),
      nps: z.number().optional(),
      cac: z.number().optional(),
      ltv: z.number().optional(),
      socialImpactMetric: z.string().optional(),
      impactValue: z.string().optional(),
      sdgAlignment: z.string().optional(),
      periodLabel: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      if (input.id) {
        await db.update(invKpis).set({ ...input, updatedAt: new Date() }).where(eq(invKpis.id, input.id));
        return { id: input.id };
      }
      const [result] = await db.insert(invKpis).values({ ...input, createdAt: new Date(), updatedAt: new Date() }).$returningId();
      return { id: result.id };
    }),
});

// ─── Fundraising Router ───────────────────────────────────────────────────────

const fundraisingRouter = router({
  list: protectedProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return input.ventureId
        ? db.select().from(invFundraisingRounds).where(eq(invFundraisingRounds.ventureId, input.ventureId)).orderBy(desc(invFundraisingRounds.createdAt))
        : db.select().from(invFundraisingRounds).orderBy(desc(invFundraisingRounds.createdAt));
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      offeringId: z.number().optional(),
      roundName: z.string().min(1),
      roundType: z.enum(["pre_seed", "seed", "series_a", "series_b", "bridge", "grant", "convertible_note"]).optional(),
      targetAmount: z.number().optional(),
      raisedAmount: z.number().optional(),
      status: z.enum(["planning", "open", "closing", "closed", "cancelled"]).optional(),
      leadInvestor: z.string().optional(),
      pitchDeckId: z.number().optional(),
      businessPlanId: z.number().optional(),
      executionPlanId: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      if (input.id) {
        await db.update(invFundraisingRounds).set({ ...input, updatedAt: new Date() }).where(eq(invFundraisingRounds.id, input.id));
        return { id: input.id };
      }
      const [result] = await db.insert(invFundraisingRounds).values({ ...input, createdAt: new Date(), updatedAt: new Date() }).$returningId();
      return { id: result.id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(invFundraisingRounds).where(eq(invFundraisingRounds.id, input.id));
      return { success: true };
    }),
});

// ─── Summary Router ───────────────────────────────────────────────────────────

const summaryRouter = router({
  getDashboard: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [score] = await db.select().from(invReadinessScores)
        .where(eq(invReadinessScores.ventureId, input.ventureId)).orderBy(desc(invReadinessScores.updatedAt)).limit(1);
      const outputs = await db.select().from(invOutputs)
        .where(eq(invOutputs.ventureId, input.ventureId)).orderBy(desc(invOutputs.createdAt));
      const targets = await db.select().from(invTargets)
        .where(eq(invTargets.ventureId, input.ventureId)).orderBy(desc(invTargets.matchScore));
      const [kpi] = await db.select().from(invKpis)
        .where(eq(invKpis.ventureId, input.ventureId)).orderBy(desc(invKpis.updatedAt)).limit(1);
      const rounds = await db.select().from(invFundraisingRounds)
        .where(eq(invFundraisingRounds.ventureId, input.ventureId)).orderBy(desc(invFundraisingRounds.createdAt));
      const pitchDecks = outputs.filter(o => o.outputType === "pitch_deck");
      const businessPlans = outputs.filter(o => o.outputType === "business_plan");
      const executionPlans = outputs.filter(o => o.outputType === "execution_plan");
      const investorSummaries = outputs.filter(o => o.outputType === "investor_summary");
      const activeRound = rounds.find(r => r.status === "open" || r.status === "closing");
      const totalRaised = rounds.reduce((sum, r) => sum + (r.raisedAmount ?? 0), 0);
      return {
        score,
        outputs: { pitchDecks, businessPlans, executionPlans, investorSummaries },
        targets: targets.slice(0, 10),
        kpi,
        rounds,
        activeRound,
        totalRaised,
        topTargets: targets.filter(t => t.matchScore && t.matchScore >= 70).slice(0, 5),
      };
    }),
});

// ─── Main Export ──────────────────────────────────────────────────────────────

export const investmentModuleRouter = router({
  readiness: readinessRouter,
  outputs: outputsRouter,
  targets: targetsRouter,
  kpis: kpisRouter,
  fundraising: fundraisingRouter,
  summary: summaryRouter,
});
