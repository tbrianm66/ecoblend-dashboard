import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";
import {
  insertContractDocument,
  getContractDocuments,
  deleteContractDocument,
  getAllVentures,
  getVentureById,
  upsertVenture,
  updateVenture,
  getMilestonesForVenture,
  insertMilestone,
  updateMilestone,
  deleteMilestone,
  getRisksForVenture,
  insertRisk,
  updateRisk,
  deleteRisk,
  getScoreHistoryForVenture,
  insertVentureScore,
  getFoundersForVenture,
  getAllFounders,
  insertFounder,
  updateFounder,
  deleteFounder,
  getAllOpportunities,
  getOpportunityById,
  insertOpportunity,
  updateOpportunity,
  getExperimentsForVenture,
  insertExperiment,
  updateExperiment,
  deleteExperiment,
  getInterviewsForVenture,
  getAllInterviews,
  insertInterview,
  updateInterview,
  deleteInterview,
  getFinancialSnapshotsForVenture,
  getLatestFinancialSnapshot,
  getAllLatestFinancialSnapshots,
  upsertFinancialSnapshot,
} from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Ventures ────────────────────────────────────────────────────────────────
  ventures: router({
    list: publicProcedure.query(async () => {
      return getAllVentures();
    }),

    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return getVentureById(input.id);
      }),

    upsert: publicProcedure
      .input(z.object({
        id: z.string(),
        name: z.string(),
        tagline: z.string().optional(),
        sector: z.string().optional(),
        channel: z.enum(["B2B", "D2C", "B2B2C"]).optional(),
        status: z.enum(["Active", "Pre-Launch", "Scaling", "Paused"]).optional(),
        vrl: z.number().min(1).max(4).optional(),
        vrlPercent: z.number().min(0).max(100).optional(),
        trl: z.number().min(1).max(9).optional(),
        trlPercent: z.number().min(0).max(100).optional(),
        nominatedCharity: z.string().optional(),
        charityFocus: z.string().optional(),
        founder: z.string().optional(),
        color: z.string().optional(),
        investmentReady: z.boolean().optional(),
        isInternalLab: z.boolean().optional(),
        description: z.string().optional(),
        bmc: z.string().optional(),
        mmc: z.string().optional(),
        lifecycleStage: z.enum(["Opportunity", "Validation", "Build", "Launch", "Scale"]).optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertVenture(input as any);
        return { success: true };
      }),

    updateScores: publicProcedure
      .input(z.object({
        id: z.string(),
        vrl: z.number().min(1).max(4),
        vrlPercent: z.number().min(0).max(100),
        trl: z.number().min(1).max(9),
        trlPercent: z.number().min(0).max(100),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, notes, ...scores } = input;
        await updateVenture(id, scores);
        // Record score history
        await insertVentureScore({ ventureId: id, ...scores, notes: notes ?? null });
        return { success: true };
      }),
  }),

  // ── Milestones ───────────────────────────────────────────────────────────────
  milestones: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => getMilestonesForVenture(input.ventureId)),

    add: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        label: z.string(),
        targetDate: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await insertMilestone(input as any);
        return { success: true };
      }),

    toggle: publicProcedure
      .input(z.object({ id: z.number(), completed: z.boolean() }))
      .mutation(async ({ input }) => {
        await updateMilestone(input.id, {
          completed: input.completed,
          completedAt: input.completed ? new Date() : null,
        });
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteMilestone(input.id);
        return { success: true };
      }),
  }),

  // ── Risks ────────────────────────────────────────────────────────────────────
  risks: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => getRisksForVenture(input.ventureId)),

    add: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        domain: z.string(),
        level: z.enum(["Low", "Medium", "High"]),
        mitigation: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await insertRisk(input as any);
        return { success: true };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        domain: z.string().optional(),
        level: z.enum(["Low", "Medium", "High"]).optional(),
        mitigation: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateRisk(id, data as any);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteRisk(input.id);
        return { success: true };
      }),
  }),

  // ── Score History ────────────────────────────────────────────────────────────
  scoreHistory: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => getScoreHistoryForVenture(input.ventureId)),
  }),

  // ── Founders ─────────────────────────────────────────────────────────────────
  founders: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => getFoundersForVenture(input.ventureId)),

    listAll: publicProcedure.query(async () => getAllFounders()),

    add: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        name: z.string(),
        role: z.string().optional(),
        background: z.string().optional(),
        domainExpertiseScore: z.number().min(0).max(10).optional(),
        experienceScore: z.number().min(0).max(10).optional(),
        commitmentScore: z.number().min(0).max(10).optional(),
        equityPct: z.number().min(0).max(100).optional(),
        esopAllocated: z.boolean().optional(),
        linkedIn: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await insertFounder(input as any);
        return { success: true };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        role: z.string().optional(),
        background: z.string().optional(),
        domainExpertiseScore: z.number().min(0).max(10).optional(),
        experienceScore: z.number().min(0).max(10).optional(),
        commitmentScore: z.number().min(0).max(10).optional(),
        equityPct: z.number().min(0).max(100).optional(),
        esopAllocated: z.boolean().optional(),
        linkedIn: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateFounder(id, data as any);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteFounder(input.id);
        return { success: true };
      }),
  }),

  // ── Opportunities ─────────────────────────────────────────────────────────────
  opportunities: router({
    list: publicProcedure.query(async () => getAllOpportunities()),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getOpportunityById(input.id)),

    add: publicProcedure
      .input(z.object({
        title: z.string(),
        problemStatement: z.string().optional(),
        sector: z.string().optional(),
        marketSizeScore: z.number().min(0).max(10).optional(),
        strategicFitScore: z.number().min(0).max(10).optional(),
        esgAlignmentScore: z.number().min(0).max(10).optional(),
        founderAvailScore: z.number().min(0).max(10).optional(),
        submittedBy: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const totalScore = (input.marketSizeScore ?? 0) + (input.strategicFitScore ?? 0) +
          (input.esgAlignmentScore ?? 0) + (input.founderAvailScore ?? 0);
        await insertOpportunity({ ...input, totalScore, status: "Identified" } as any);
        return { success: true };
      }),

    updateStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["Identified", "Scoring", "Approved", "Rejected", "Converted"]),
        convertedToVentureId: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateOpportunity(id, data as any);
        return { success: true };
      }),

    updateScores: publicProcedure
      .input(z.object({
        id: z.number(),
        marketSizeScore: z.number().min(0).max(10),
        strategicFitScore: z.number().min(0).max(10),
        esgAlignmentScore: z.number().min(0).max(10),
        founderAvailScore: z.number().min(0).max(10),
      }))
      .mutation(async ({ input }) => {
        const { id, ...scores } = input;
        const totalScore = scores.marketSizeScore + scores.strategicFitScore +
          scores.esgAlignmentScore + scores.founderAvailScore;
        await updateOpportunity(id, { ...scores, totalScore, status: "Scoring" });
        return { success: true };
      }),
  }),

  // ── Experiments ───────────────────────────────────────────────────────────────
  experiments: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => getExperimentsForVenture(input.ventureId)),

    add: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        title: z.string(),
        hypothesis: z.string().optional(),
        method: z.string().optional(),
        result: z.string().optional(),
        outcome: z.enum(["Pass", "Fail", "Inconclusive", "Pending"]).optional(),
        trlLevelJustified: z.number().min(1).max(9).optional(),
        conductedAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        await insertExperiment(input as any);
        return { success: true };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        hypothesis: z.string().optional(),
        method: z.string().optional(),
        result: z.string().optional(),
        outcome: z.enum(["Pass", "Fail", "Inconclusive", "Pending"]).optional(),
        trlLevelJustified: z.number().min(1).max(9).optional(),
        conductedAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateExperiment(id, data as any);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteExperiment(input.id);
        return { success: true };
      }),
  }),

  // ── Interviews ────────────────────────────────────────────────────────────────
  interviews: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => getInterviewsForVenture(input.ventureId)),

    listAll: publicProcedure.query(async () => getAllInterviews()),

    add: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        intervieweeName: z.string().optional(),
        intervieweeRole: z.string().optional(),
        intervieweeOrg: z.string().optional(),
        date: z.string().optional(),
        channel: z.enum(["In-Person", "Video", "Phone", "Survey"]).optional(),
        keyInsights: z.string().optional(),
        painPoints: z.string().optional(),
        validationSignals: z.string().optional(),
        rawTranscript: z.string().optional(),
        vrlStageRelevant: z.number().min(1).max(4).optional(),
      }))
      .mutation(async ({ input }) => {
        await insertInterview(input as any);
        return { success: true };
      }),

    // AI summarisation — takes raw transcript and returns structured summary
    summarise: publicProcedure
      .input(z.object({
        id: z.number(),
        rawTranscript: z.string(),
        ventureId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an expert venture analyst specialising in customer discovery interviews for early-stage ventures. 
Extract and structure the key information from this customer interview transcript into a concise, actionable summary for a venture builder studio.
Return a JSON object with exactly these fields:
- keyInsights: string (2-3 bullet points of the most important insights, separated by \\n)
- painPoints: string (the main problems or frustrations expressed, 2-3 points separated by \\n)
- validationSignals: string (evidence that supports or challenges the venture hypothesis, 2-3 points separated by \\n)
- aiSummary: string (a 3-4 sentence executive summary of the interview)`,
            },
            {
              role: "user",
              content: `Venture: ${input.ventureId}\n\nInterview transcript:\n${input.rawTranscript}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "interview_summary",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  keyInsights: { type: "string" },
                  painPoints: { type: "string" },
                  validationSignals: { type: "string" },
                  aiSummary: { type: "string" },
                },
                required: ["keyInsights", "painPoints", "validationSignals", "aiSummary"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : null;
        if (!content) throw new Error("LLM returned no content");

        const parsed = JSON.parse(content);
        await updateInterview(input.id, {
          keyInsights: parsed.keyInsights,
          painPoints: parsed.painPoints,
          validationSignals: parsed.validationSignals,
          aiSummary: parsed.aiSummary,
          rawTranscript: input.rawTranscript,
        });

        return { success: true, summary: parsed };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        intervieweeName: z.string().optional(),
        intervieweeRole: z.string().optional(),
        intervieweeOrg: z.string().optional(),
        date: z.string().optional(),
        channel: z.enum(["In-Person", "Video", "Phone", "Survey"]).optional(),
        keyInsights: z.string().optional(),
        painPoints: z.string().optional(),
        validationSignals: z.string().optional(),
        rawTranscript: z.string().optional(),
        vrlStageRelevant: z.number().min(1).max(4).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateInterview(id, data as any);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteInterview(input.id);
        return { success: true };
      }),
  }),

  // ── Financial Snapshots ───────────────────────────────────────────────────────
  financial: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => getFinancialSnapshotsForVenture(input.ventureId)),

    latest: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => getLatestFinancialSnapshot(input.ventureId)),

    latestAll: publicProcedure.query(async () => getAllLatestFinancialSnapshots()),

    upsert: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        month: z.string(), // "YYYY-MM"
        revenueActual: z.number().optional(),
        revenueTarget: z.number().optional(),
        monthlyBurn: z.number().optional(),
        cashRunway: z.number().optional(),
        investmentRaised: z.number().optional(),
        investmentTarget: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertFinancialSnapshot(input as any);
        return { success: true };
      }),
  }),

  // ── Contract Documents ────────────────────────────────────────────────────────
  contracts: router({
    getDocuments: publicProcedure
      .input(z.object({ contractId: z.string() }))
      .query(async ({ input }) => {
        return getContractDocuments(input.contractId);
      }),

    uploadDocument: publicProcedure
      .input(z.object({
        contractId: z.string(),
        contractTitle: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSizeBytes: z.number(),
        base64Data: z.string(),
        uploadedBy: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const suffix = nanoid(8);
        const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const fileKey = `contract-docs/${input.contractId}/${suffix}-${safeFileName}`;
        const buffer = Buffer.from(input.base64Data, "base64");
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        await insertContractDocument({
          contractId: input.contractId,
          contractTitle: input.contractTitle,
          fileName: input.fileName,
          fileKey,
          fileUrl: url,
          mimeType: input.mimeType,
          fileSizeBytes: input.fileSizeBytes,
          uploadedBy: input.uploadedBy ?? null,
        });
        return { success: true, url, fileKey };
      }),

    deleteDocument: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteContractDocument(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
