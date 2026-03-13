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
  getAllResearchPapers,
  getResearchPaperById,
  insertResearchPaper,
  updateResearchPaper,
  deleteResearchPaper,
  getAllFellowResearchers,
  insertFellowResearcher,
  updateFellowResearcher,
  deleteFellowResearcher,
  getAllUniversityPartnerships,
  insertUniversityPartnership,
  updateUniversityPartnership,
  deleteUniversityPartnership,
  getAllEvidenceClaims,
  getEvidenceClaimsForVenture,
  insertEvidenceClaim,
  updateEvidenceClaim,
  deleteEvidenceClaim,
  getAllMarketAnalysis,
  getMarketAnalysisForVenture,
  insertMarketAnalysis,
  updateMarketAnalysis,
  deleteMarketAnalysis,
  getAllCompetitors,
  getCompetitorsForVenture,
  insertCompetitor,
  updateCompetitor,
  deleteCompetitor,
  getReportsForOpportunity,
  insertOpportunityReport,
  deleteOpportunityReport,
  getEngineeringRisksByVenture,
  insertEngineeringRisk,
  updateEngineeringRisk,
  deleteEngineeringRisk,
  getVentureTrlBlockers,
  getMitigationsByRisk,
  insertMitigationAction,
  updateMitigationAction,
  deleteMitigationAction,
  upsertAcademicPaper,
  getAcademicPaperById,
  linkPaperToTask,
  getPapersForTask,
  unlinkPaperFromTask,
  getValidatedTaskIds,
  listVentureRisks,
  addVentureRisk,
  updateVentureRisk,
  deleteVentureRisk,
  getVrlBlockers,
  computeAdjustedVri,
  getPortfolioRiskSummary,
  getRiskLevel,
  getAllBrlTasks,
  getBrlCompletionsForVenture,
  upsertBrlCompletion,
  getBrlScoreForVenture,
  getPortfolioBrlSummary,
  getVrlScoringParams,
  upsertVrlScoringParams,
  getAllVrlScoringParams,
  computeVrlScore,
  computePortfolioVrlScores,
  VRL_LEVEL_LABELS,
  getDb,
} from "./db";
import { searchSemanticScholar, extractKeywords } from "./semanticScholar";

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

  // ── Academic Research ─────────────────────────────────────────────────────────
  academic: router({
    // Research Papers
    listPapers: publicProcedure.query(async () => getAllResearchPapers()),

    getPaper: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getResearchPaperById(input.id)),

    addPaper: publicProcedure
      .input(z.object({
        title: z.string().min(1),
        authors: z.string().min(1),
        journal: z.string().optional(),
        year: z.number().optional(),
        doi: z.string().optional(),
        url: z.string().optional(),
        abstract: z.string().optional(),
        keywords: z.string().optional(),
        category: z.enum([
          "VRL Framework", "TRL Framework", "Lean Methodology", "Social Enterprise",
          "Impact Investing", "Circular Economy", "Sports Technology", "Eco Materials",
          "Venture Building", "University Spin-out", "Other"
        ]).optional(),
        evidenceType: z.enum([
          "Peer Reviewed", "Conference Paper", "Thesis", "Industry Report",
          "Government Report", "Book Chapter", "Working Paper"
        ]).optional(),
        relevanceScore: z.number().min(1).max(10).optional(),
        ventureIds: z.string().optional(),
        trlLevelsSupported: z.string().optional(),
        vrlStagesSupported: z.string().optional(),
        notes: z.string().optional(),
        addedBy: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await insertResearchPaper(input as any);
        return { success: true };
      }),

    updatePaper: publicProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        authors: z.string().optional(),
        journal: z.string().optional(),
        year: z.number().optional(),
        doi: z.string().optional(),
        url: z.string().optional(),
        abstract: z.string().optional(),
        keywords: z.string().optional(),
        category: z.enum([
          "VRL Framework", "TRL Framework", "Lean Methodology", "Social Enterprise",
          "Impact Investing", "Circular Economy", "Sports Technology", "Eco Materials",
          "Venture Building", "University Spin-out", "Other"
        ]).optional(),
        evidenceType: z.enum([
          "Peer Reviewed", "Conference Paper", "Thesis", "Industry Report",
          "Government Report", "Book Chapter", "Working Paper"
        ]).optional(),
        relevanceScore: z.number().min(1).max(10).optional(),
        ventureIds: z.string().optional(),
        trlLevelsSupported: z.string().optional(),
        vrlStagesSupported: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateResearchPaper(id, data as any);
        return { success: true };
      }),

    deletePaper: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteResearchPaper(input.id);
        return { success: true };
      }),

    // Fellow Researchers
    listFellows: publicProcedure.query(async () => getAllFellowResearchers()),

    addFellow: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        title: z.string().optional(),
        institution: z.string().optional(),
        department: z.string().optional(),
        specialisation: z.string().optional(),
        email: z.string().optional(),
        linkedIn: z.string().optional(),
        orcid: z.string().optional(),
        collaborationType: z.enum([
          "Academic Advisor", "Co-Researcher", "Industry Fellow",
          "Visiting Scholar", "PhD Supervisor", "Peer Reviewer", "Consultant"
        ]).optional(),
        status: z.enum(["Active", "Prospective", "Past"]).optional(),
        ventureIds: z.string().optional(),
        bio: z.string().optional(),
        publications: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await insertFellowResearcher(input as any);
        return { success: true };
      }),

    updateFellow: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        title: z.string().optional(),
        institution: z.string().optional(),
        department: z.string().optional(),
        specialisation: z.string().optional(),
        email: z.string().optional(),
        linkedIn: z.string().optional(),
        orcid: z.string().optional(),
        collaborationType: z.enum([
          "Academic Advisor", "Co-Researcher", "Industry Fellow",
          "Visiting Scholar", "PhD Supervisor", "Peer Reviewer", "Consultant"
        ]).optional(),
        status: z.enum(["Active", "Prospective", "Past"]).optional(),
        ventureIds: z.string().optional(),
        bio: z.string().optional(),
        publications: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateFellowResearcher(id, data as any);
        return { success: true };
      }),

    deleteFellow: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteFellowResearcher(input.id);
        return { success: true };
      }),

    // University Partnerships
    listPartnerships: publicProcedure.query(async () => getAllUniversityPartnerships()),

    addPartnership: publicProcedure
      .input(z.object({
        universityName: z.string().min(1),
        country: z.string().optional(),
        department: z.string().optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().optional(),
        partnershipType: z.enum([
          "Research Collaboration", "Spin-out Support", "Knowledge Transfer",
          "Student Placement", "Grant Co-applicant", "Advisory Board", "MoU"
        ]).optional(),
        status: z.enum(["Active", "Prospective", "Completed", "Paused"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        description: z.string().optional(),
        ventureIds: z.string().optional(),
        fundingLinked: z.boolean().optional(),
        fundingAmount: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await insertUniversityPartnership(input as any);
        return { success: true };
      }),

    updatePartnership: publicProcedure
      .input(z.object({
        id: z.number(),
        universityName: z.string().optional(),
        country: z.string().optional(),
        department: z.string().optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().optional(),
        partnershipType: z.enum([
          "Research Collaboration", "Spin-out Support", "Knowledge Transfer",
          "Student Placement", "Grant Co-applicant", "Advisory Board", "MoU"
        ]).optional(),
        status: z.enum(["Active", "Prospective", "Completed", "Paused"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        description: z.string().optional(),
        ventureIds: z.string().optional(),
        fundingLinked: z.boolean().optional(),
        fundingAmount: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateUniversityPartnership(id, data as any);
        return { success: true };
      }),

    deletePartnership: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteUniversityPartnership(input.id);
        return { success: true };
      }),

    // Evidence Claims
    listClaims: publicProcedure.query(async () => getAllEvidenceClaims()),

    listClaimsForVenture: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => getEvidenceClaimsForVenture(input.ventureId)),

    addClaim: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        paperId: z.number().optional(),
        claimText: z.string().min(1),
        claimType: z.enum([
          "Market Validation", "Technology Feasibility", "Social Impact",
          "Competitive Advantage", "Regulatory Compliance", "Financial Model",
          "Team Capability", "Methodology Support"
        ]).optional(),
        trlLevel: z.number().min(1).max(9).optional(),
        vrlStage: z.number().min(1).max(4).optional(),
        strength: z.enum(["Strong", "Moderate", "Weak"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await insertEvidenceClaim(input as any);
        return { success: true };
      }),

     deleteClaim: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteEvidenceClaim(input.id);
        return { success: true };
      }),
  }),

  // ── Market Analysis ─────────────────────────────────────────────────────────
  market: router({
    listAll: publicProcedure.query(async () => getAllMarketAnalysis()),
    listForVenture: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => getMarketAnalysisForVenture(input.ventureId)),
    add: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        marketName: z.string().min(1),
        geography: z.string().optional(),
        tamValue: z.number().optional(),
        samValue: z.number().optional(),
        somValue: z.number().optional(),
        tamUnit: z.string().optional(),
        cagr: z.number().optional(),
        marketYear: z.number().optional(),
        forecastYear: z.number().optional(),
        sourceUrl: z.string().optional(),
        sourceName: z.string().optional(),
        keyDrivers: z.string().optional(),
        keyBarriers: z.string().optional(),
        notes: z.string().optional(),
        aiGenerated: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        await insertMarketAnalysis(input as any);
        return { success: true };
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          marketName: z.string().optional(),
          geography: z.string().optional(),
          tamValue: z.number().optional(),
          samValue: z.number().optional(),
          somValue: z.number().optional(),
          cagr: z.number().optional(),
          marketYear: z.number().optional(),
          forecastYear: z.number().optional(),
          sourceUrl: z.string().optional(),
          sourceName: z.string().optional(),
          keyDrivers: z.string().optional(),
          keyBarriers: z.string().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await updateMarketAnalysis(input.id, input.data);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteMarketAnalysis(input.id);
        return { success: true };
      }),
    // AI-generate market analysis from a venture description
    generateAI: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        ventureName: z.string(),
        sector: z.string(),
        description: z.string(),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a market research analyst specialising in sustainable technology, eco-materials, and impact ventures. 
Generate a structured market analysis in JSON format. Use British English. Be specific with numbers — cite realistic market size figures based on known industry data.
Return ONLY valid JSON matching this schema exactly:
{
  "marketName": string,
  "geography": string,
  "tamValue": number (in £M),
  "samValue": number (in £M),
  "somValue": number (in £M),
  "tamUnit": "£M",
  "cagr": number (percentage, e.g. 8.5),
  "marketYear": number,
  "forecastYear": number,
  "sourceName": string,
  "keyDrivers": string (comma-separated list of 3-5 drivers),
  "keyBarriers": string (comma-separated list of 3-5 barriers),
  "notes": string (2-3 sentence summary)
}`,
            },
            {
              role: "user",
              content: `Generate a market analysis for the following venture:\n\nVenture: ${input.ventureName}\nSector: ${input.sector}\nDescription: ${input.description}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "market_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  marketName: { type: "string" },
                  geography: { type: "string" },
                  tamValue: { type: "number" },
                  samValue: { type: "number" },
                  somValue: { type: "number" },
                  tamUnit: { type: "string" },
                  cagr: { type: "number" },
                  marketYear: { type: "number" },
                  forecastYear: { type: "number" },
                  sourceName: { type: "string" },
                  keyDrivers: { type: "string" },
                  keyBarriers: { type: "string" },
                  notes: { type: "string" },
                },
                required: ["marketName","geography","tamValue","samValue","somValue","tamUnit","cagr","marketYear","forecastYear","sourceName","keyDrivers","keyBarriers","notes"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = String(response.choices[0]?.message?.content ?? "{}");
        const parsed = JSON.parse(content);
        const record = { ...parsed, ventureId: input.ventureId, aiGenerated: true };
        await insertMarketAnalysis(record);
        return { success: true, data: record };
      }),
  }),

  // ── Competitor Analysis ──────────────────────────────────────────────────────
  competitors: router({
    listAll: publicProcedure.query(async () => getAllCompetitors()),
    listForVenture: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => getCompetitorsForVenture(input.ventureId)),
    add: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        name: z.string().min(1),
        website: z.string().optional(),
        hq: z.string().optional(),
        founded: z.number().optional(),
        stage: z.enum(["Startup","Scale-up","Established","Enterprise","Unknown"]).optional(),
        competitorType: z.enum(["Direct","Indirect","Substitute","Potential"]).optional(),
        productDescription: z.string().optional(),
        strengths: z.string().optional(),
        weaknesses: z.string().optional(),
        differentiator: z.string().optional(),
        revenueEstimate: z.string().optional(),
        fundingRaised: z.string().optional(),
        threatLevel: z.enum(["Low","Medium","High"]).optional(),
        notes: z.string().optional(),
        aiGenerated: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        await insertCompetitor(input as any);
        return { success: true };
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          website: z.string().optional(),
          hq: z.string().optional(),
          stage: z.enum(["Startup","Scale-up","Established","Enterprise","Unknown"]).optional(),
          competitorType: z.enum(["Direct","Indirect","Substitute","Potential"]).optional(),
          productDescription: z.string().optional(),
          strengths: z.string().optional(),
          weaknesses: z.string().optional(),
          differentiator: z.string().optional(),
          revenueEstimate: z.string().optional(),
          fundingRaised: z.string().optional(),
          threatLevel: z.enum(["Low","Medium","High"]).optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await updateCompetitor(input.id, input.data);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCompetitor(input.id);
        return { success: true };
      }),
    // AI-generate competitor analysis
    generateAI: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        ventureName: z.string(),
        sector: z.string(),
        description: z.string(),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a competitive intelligence analyst specialising in sustainable technology and eco-materials ventures.
Identify 4-6 real or representative competitors for the venture described. Use British English.
Return ONLY a valid JSON array of competitor objects matching this schema exactly:
[{
  "name": string,
  "website": string,
  "hq": string,
  "founded": number or null,
  "stage": "Startup" | "Scale-up" | "Established" | "Enterprise" | "Unknown",
  "competitorType": "Direct" | "Indirect" | "Substitute" | "Potential",
  "productDescription": string,
  "strengths": string,
  "weaknesses": string,
  "differentiator": string,
  "revenueEstimate": string,
  "fundingRaised": string,
  "threatLevel": "Low" | "Medium" | "High"
}]`,
            },
            {
              role: "user",
              content: `Identify competitors for:\n\nVenture: ${input.ventureName}\nSector: ${input.sector}\nDescription: ${input.description}`,
            },
          ],
        });
        const content = String(response.choices[0]?.message?.content ?? "[]");
        let parsed: any[] = [];
        try { parsed = JSON.parse(content); } catch { parsed = []; }
        const records = parsed.map((c: any) => ({ ...c, ventureId: input.ventureId, aiGenerated: true }));
        for (const record of records) {
          await insertCompetitor(record);
        }
        return { success: true, count: records.length, data: records };
      }),
  }),

  // ── Opportunity Research Reports ─────────────────────────────────────────────
  opportunityReports: router({
    listForOpportunity: publicProcedure
      .input(z.object({ opportunityId: z.number() }))
      .query(async ({ input }) => getReportsForOpportunity(input.opportunityId)),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteOpportunityReport(input.id);
        return { success: true };
      }),
    // Core AI research report generation from problem statement
    generate: publicProcedure
      .input(z.object({
        opportunityId: z.number(),
        title: z.string(),
        problemStatement: z.string().min(20),
        sector: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a senior business analyst and market researcher specialising in sustainable technology, social enterprise, and impact ventures. You produce structured, evidence-based commercial research reports.

Your reports are written in British English, use a professional academic tone, and are structured to support venture investment decisions.

Generate a comprehensive research report in Markdown format covering:
1. **Executive Summary** — 3-4 sentences summarising the opportunity
2. **Problem Analysis** — depth analysis of the problem, who it affects, and why it matters now
3. **Market Size & Opportunity** — TAM/SAM/SOM estimates with sources, CAGR, key growth drivers
4. **Competitive Landscape** — 4-6 key competitors or analogues, their positioning, strengths and weaknesses
5. **Regulatory & ESG Context** — relevant regulations, sustainability frameworks, B Corp alignment
6. **Technology Readiness** — current TRL landscape for relevant technologies
7. **Commercial Business Case** — revenue model options, pricing benchmarks, unit economics
8. **Key Risks & Mitigations** — top 4-5 risks with mitigation strategies
9. **Recommended Next Steps** — 3-5 concrete validation actions
10. **Conclusion & Recommendation** — Pursue / Investigate Further / Park / Reject with rationale

Be specific with numbers. Cite real market data where possible. Use British English throughout.`,
            },
            {
              role: "user",
              content: `Generate a commercial research report for the following opportunity:\n\nTitle: ${input.title}\nSector: ${input.sector ?? "Not specified"}\n\nProblem Statement:\n${input.problemStatement}`,
            },
          ],
        });
        const reportContent = String(response.choices[0]?.message?.content ?? "Report generation failed.");

        // Extract key sections for structured fields
        const summaryMatch = reportContent.match(/## Executive Summary[\s\S]*?(?=##|$)/i);
        const marketMatch = reportContent.match(/## Market Size[\s\S]*?(?=##|$)/i);
        const competitorMatch = reportContent.match(/## Competitive Landscape[\s\S]*?(?=##|$)/i);
        const conclusionMatch = reportContent.match(/## Conclusion[\s\S]*?(?=##|$)/i);

        // Determine recommended action from conclusion
        let recommendedAction: "Pursue" | "Investigate Further" | "Park" | "Reject" = "Investigate Further";
        const conclusionText = (conclusionMatch?.[0] ?? "").toLowerCase();
        if (conclusionText.includes("pursue")) recommendedAction = "Pursue";
        else if (conclusionText.includes("reject")) recommendedAction = "Reject";
        else if (conclusionText.includes("park")) recommendedAction = "Park";

        const record = {
          opportunityId: input.opportunityId,
          title: `Research Report: ${input.title}`,
          problemStatement: input.problemStatement,
          reportContent,
          marketSizeSummary: marketMatch?.[0]?.slice(0, 1000) ?? null,
          competitorSummary: competitorMatch?.[0]?.slice(0, 1000) ?? null,
          keyInsights: summaryMatch?.[0]?.slice(0, 500) ?? null,
          recommendedAction,
          confidenceScore: 7,
        };
        await insertOpportunityReport(record as any);
        return { success: true, report: record };
      }),
  }),

  // ── FMEA Engineering Risk Register ─────────────────────────────────────────
  fmea: router({
    // Get all risks for a venture
    listRisks: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        return getEngineeringRisksByVenture(input.ventureId);
      }),

    // Get mitigations for a specific risk
    listMitigations: publicProcedure
      .input(z.object({ riskId: z.number() }))
      .query(async ({ input }) => {
        return getMitigationsByRisk(input.riskId);
      }),

    // TRL blocker check for a venture
    trlBlockerCheck: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        return getVentureTrlBlockers(input.ventureId);
      }),

    // Add a new engineering risk
    addRisk: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        relatedTrlStage: z.number().min(1).max(9).optional(),
        componentName: z.string().min(1),
        failureMode: z.string().min(1),
        failureEffect: z.string().min(1),
        severity: z.number().min(1).max(10),
        occurrence: z.number().min(1).max(10),
        detection: z.number().min(1).max(10),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const rpn = input.severity * input.occurrence * input.detection;
        await insertEngineeringRisk({ ...input, initialRpn: rpn });
        return { success: true };
      }),

    // Update an engineering risk
    updateRisk: publicProcedure
      .input(z.object({
        id: z.number(),
        relatedTrlStage: z.number().min(1).max(9).optional().nullable(),
        componentName: z.string().min(1).optional(),
        failureMode: z.string().min(1).optional(),
        failureEffect: z.string().min(1).optional(),
        severity: z.number().min(1).max(10).optional(),
        occurrence: z.number().min(1).max(10).optional(),
        detection: z.number().min(1).max(10).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateEngineeringRisk(id, data as any);
        return { success: true };
      }),

    // Delete an engineering risk (cascades to mitigations)
    deleteRisk: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteEngineeringRisk(input.id);
        return { success: true };
      }),

    // Add a mitigation action to a risk
    addMitigation: publicProcedure
      .input(z.object({
        riskId: z.number(),
        actionDescription: z.string().min(1),
        owner: z.string().optional(),
        status: z.enum(["Identified", "In Progress", "Implemented", "Verified"]).optional(),
        revisedSeverity: z.number().min(1).max(10).optional(),
        revisedOccurrence: z.number().min(1).max(10).optional(),
        revisedDetection: z.number().min(1).max(10).optional(),
      }))
      .mutation(async ({ input }) => {
        const rS = input.revisedSeverity ?? 5;
        const rO = input.revisedOccurrence ?? 5;
        const rD = input.revisedDetection ?? 5;
        await insertMitigationAction({ ...input, revisedRpn: rS * rO * rD });
        return { success: true };
      }),

    // Update a mitigation action
    updateMitigation: publicProcedure
      .input(z.object({
        id: z.number(),
        actionDescription: z.string().min(1).optional(),
        owner: z.string().optional(),
        status: z.enum(["Identified", "In Progress", "Implemented", "Verified"]).optional(),
        revisedSeverity: z.number().min(1).max(10).optional(),
        revisedOccurrence: z.number().min(1).max(10).optional(),
        revisedDetection: z.number().min(1).max(10).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateMitigationAction(id, data as any);
        return { success: true };
      }),

    // Delete a mitigation action
    deleteMitigation: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteMitigationAction(input.id);
        return { success: true };
      }),
  }),

  // ── Academic Research Validation ────────────────────────────────────────────
  // Semantic Scholar integration for linking peer-reviewed papers to engineering tasks
  academicValidation: router({
    // Search Semantic Scholar using keywords extracted from a task description
    searchPapers: publicProcedure
      .input(z.object({
        taskId: z.number(),
        taskTitle: z.string(),
        taskDescription: z.string().optional(),
        limit: z.number().min(1).max(10).default(5),
      }))
      .query(async ({ input }) => {
        const text = `${input.taskTitle} ${input.taskDescription ?? ""}`;
        const keywords = extractKeywords(text);
        if (!keywords) return { keywords: "", papers: [] };
        const papers = await searchSemanticScholar(keywords, input.limit);
        return { keywords, papers };
      }),

    // Attach a paper to a task (upsert paper, create link)
    attachPaper: publicProcedure
      .input(z.object({
        taskId: z.number(),
        ventureId: z.string(),
        externalId: z.string(),
        title: z.string(),
        authors: z.array(z.string()),
        abstract: z.string().optional(),
        url: z.string().optional(),
        citationCount: z.number().default(0),
        publishedYear: z.number().nullable().optional(),
        relevanceScore: z.number().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { taskId, ventureId, relevanceScore, ...paperData } = input;
        // Upsert the paper record
        const paper = await upsertAcademicPaper({
          externalId: paperData.externalId,
          title: paperData.title,
          authors: JSON.stringify(paperData.authors),
          abstract: paperData.abstract ?? "",
          url: paperData.url ?? "",
          citationCount: paperData.citationCount,
          publishedYear: paperData.publishedYear ?? null,
          source: "semantic_scholar",
        });
        if (!paper) throw new Error("Failed to save paper");
        // Create the task-paper link
        const link = await linkPaperToTask({
          taskId,
          paperId: paper.id,
          ventureId,
          relevanceScore: relevanceScore ?? null,
        });
        return { paper, link, success: true };
      }),

    // Get all papers linked to a task
    getTaskPapers: publicProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        const papers = await getPapersForTask(input.taskId);
        return papers.map(p => ({
          ...p,
          authors: (() => { try { return JSON.parse(p.authors as string); } catch { return []; } })(),
        }));
      }),

    // Detach a paper from a task (delete the link, not the paper)
    detachPaper: publicProcedure
      .input(z.object({ linkId: z.number() }))
      .mutation(async ({ input }) => {
        await unlinkPaperFromTask(input.linkId);
        return { success: true };
      }),

    // Get validated task IDs for a venture (tasks with ≥1 paper with citationCount > 10)
    getValidatedTasks: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const taskIds = await getValidatedTaskIds(input.ventureId);
        return { validatedTaskIds: taskIds };
      }),
  }),

  // ── Venture Risk Register ────────────────────────────────────────────────────
  ventureRisk: router({
    // List all risks for a venture, sorted by risk score descending
    list: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => listVentureRisks(input.ventureId)),

    // Add a new risk — auto-calculates riskScore and riskLevel
    add: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        riskCategory: z.enum(["Technical", "Market", "Commercial", "Financial", "Operational", "Strategic"]),
        riskTitle: z.string(),
        riskDescription: z.string().optional(),
        likelihood: z.number().min(1).max(5),
        impact: z.number().min(1).max(5),
        vrlStageImpacted: z.number().min(1).max(6).optional(),
        mitigationPlan: z.string().optional(),
        riskOwner: z.string().optional(),
        status: z.enum(["Open", "In Progress", "Mitigated", "Accepted", "Closed"]).optional(),
        reviewDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const riskScore = input.likelihood * input.impact;
        const riskLevel = getRiskLevel(riskScore);
        await addVentureRisk({
          ...input,
          riskScore,
          riskLevel,
          reviewDate: input.reviewDate ? new Date(input.reviewDate) : null,
        } as any);
        return { success: true };
      }),

    // Update an existing risk — recalculates riskScore and riskLevel
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        riskCategory: z.enum(["Technical", "Market", "Commercial", "Financial", "Operational", "Strategic"]).optional(),
        riskTitle: z.string().optional(),
        riskDescription: z.string().optional(),
        likelihood: z.number().min(1).max(5).optional(),
        impact: z.number().min(1).max(5).optional(),
        vrlStageImpacted: z.number().min(1).max(6).nullable().optional(),
        mitigationPlan: z.string().optional(),
        riskOwner: z.string().optional(),
        status: z.enum(["Open", "In Progress", "Mitigated", "Accepted", "Closed"]).optional(),
        reviewDate: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, likelihood, impact, reviewDate, ...rest } = input;
        const updates: Record<string, any> = { ...rest };
        if (likelihood !== undefined) updates.likelihood = likelihood;
        if (impact !== undefined) updates.impact = impact;
        if (likelihood !== undefined || impact !== undefined) {
          // Need current values to recalculate if only one is provided
          // For simplicity, require both when recalculating
          if (likelihood !== undefined && impact !== undefined) {
            updates.riskScore = likelihood * impact;
            updates.riskLevel = getRiskLevel(likelihood * impact);
          }
        }
        if (reviewDate !== undefined) {
          updates.reviewDate = reviewDate ? new Date(reviewDate) : null;
        }
        await updateVentureRisk(id, updates);
        return { success: true };
      }),

    // Delete a risk
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteVentureRisk(input.id);
        return { success: true };
      }),

    // Get VRL stage blockers (High/Critical open risks) for a venture
    vrlBlockers: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const blockers = await getVrlBlockers(input.ventureId);
        return {
          hasBlockers: blockers.length > 0,
          blockerCount: blockers.length,
          blockers,
        };
      }),

    // Compute adjusted VRI for a venture
    adjustedVri: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        baseVrl: z.number(),
        baseVrlPercent: z.number(),
      }))
      .query(async ({ input }) => {
        return computeAdjustedVri(input.ventureId, input.baseVrl, input.baseVrlPercent);
      }),

    // Portfolio-wide risk summary
    portfolioSummary: publicProcedure
      .query(async () => getPortfolioRiskSummary()),
  }),

  // ── BRL — Business Readiness Level (100 Tasks) ──────────────────────────────
  brl: router({
    // List all 100 BRL tasks (global, not per-venture)
    listTasks: publicProcedure.query(async () => getAllBrlTasks()),

    // Get completions for a specific venture
    getCompletions: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => getBrlCompletionsForVenture(input.ventureId)),

    // Toggle a task completion for a venture
    toggleTask: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        taskId: z.number(),
        completed: z.boolean(),
        notes: z.string().optional(),
        evidenceUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertBrlCompletion({
          ventureId: input.ventureId,
          taskId: input.taskId,
          completed: input.completed,
          completedAt: input.completed ? new Date() : null,
          completedBy: null,
          notes: input.notes ?? null,
          evidenceUrl: input.evidenceUrl ?? null,
        });
        return { success: true };
      }),

    // Get BRL score for a venture
    getScore: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => getBrlScoreForVenture(input.ventureId)),

    // Portfolio-wide BRL summary
    portfolioSummary: publicProcedure
      .query(async () => getPortfolioBrlSummary()),
  }),

  // ── VRL Scoring Engine ───────────────────────────────────────────────────────
  vrlScoring: router({
    // Compute full VRL score for a venture using the formula:
    // VRL = (α×TRL + β×BRL) × (1 − Risk Index) × Confidence
    getScore: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => computeVrlScore(input.ventureId)),

    // Portfolio-wide computed VRL scores
    portfolioScores: publicProcedure
      .query(async () => computePortfolioVrlScores()),

    // Get scoring parameters for a venture
    getParams: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => getVrlScoringParams(input.ventureId)),

    // Update scoring parameters (weights, confidence)
    updateParams: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        alphaWeight: z.number().min(0).max(1).optional(),
        betaWeight: z.number().min(0).max(1).optional(),
        confidenceScore: z.number().min(0.2).max(1.0).optional(),
        confidenceRationale: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const existing = await getVrlScoringParams(input.ventureId);
        const alpha = input.alphaWeight ?? existing?.alphaWeight ?? 0.45;
        const beta = input.betaWeight ?? existing?.betaWeight ?? 0.55;
        // Ensure weights sum to 1.0
        const total = alpha + beta;
        const normAlpha = total > 0 ? alpha / total : 0.45;
        const normBeta = total > 0 ? beta / total : 0.55;
        await upsertVrlScoringParams({
          ventureId: input.ventureId,
          alphaWeight: normAlpha,
          betaWeight: normBeta,
          confidenceScore: input.confidenceScore ?? existing?.confidenceScore ?? 0.5,
          confidenceRationale: input.confidenceRationale ?? existing?.confidenceRationale ?? null,
        });
        return { success: true };
      }),

    // Get the VRL level label map
    getLevelLabels: publicProcedure
      .query(() => VRL_LEVEL_LABELS),
  }),

  // ── Literature Audit: Pivot Decision Log (Lean Startup — Rec. 1 & 2) ─────────
  pivots: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { pivotDecisions } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        return db.select().from(pivotDecisions)
          .where(eq(pivotDecisions.ventureId, input.ventureId))
          .orderBy(desc(pivotDecisions.decisionDate));
      }),

    add: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        decisionDate: z.date().or(z.string().transform(s => new Date(s))),
        decision: z.enum(["Pivot", "Persevere", "Pause"]),
        pivotType: z.enum(["Zoom-In","Zoom-Out","Customer-Segment","Customer-Need","Platform","Business-Architecture","Value-Capture","Engine-of-Growth","Channel","Technology"]).optional(),
        hypothesisTested: z.string(),
        evidenceSummary: z.string().optional(),
        experimentsPassed: z.number().default(0),
        experimentsFailed: z.number().default(0),
        interviewsReviewed: z.number().default(0),
        vrlScoreAtDecision: z.number().optional(),
        newHypothesis: z.string().optional(),
        rationale: z.string().optional(),
        decidedBy: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { pivotDecisions } = await import("../drizzle/schema");
        await db.insert(pivotDecisions).values(input as any);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { pivotDecisions } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(pivotDecisions).where(eq(pivotDecisions.id, input.id));
        return { success: true };
      }),

    // Pivot Trigger Config (Rec. 2)
    getTriggerConfig: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { pivotTriggerConfig } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [row] = await db.select().from(pivotTriggerConfig)
          .where(eq(pivotTriggerConfig.ventureId, input.ventureId));
        return row ?? null;
      }),

    upsertTriggerConfig: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        minExperimentPassRatePct: z.number().min(0).max(100).optional(),
        maxRiskIndexPct: z.number().min(0).max(100).optional(),
        minVrlScore: z.number().min(0).max(9).optional(),
        stagnationPeriodDays: z.number().min(1).optional(),
        alertActive: z.boolean().optional(),
        alertDismissedAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { pivotTriggerConfig } = await import("../drizzle/schema");
        await db.insert(pivotTriggerConfig).values(input as any)
          .onDuplicateKeyUpdate({ set: input as any });
        return { success: true };
      }),

    // Pivot Runway Calculator (Rec. 10)
    getRunwayInputs: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { pivotRunwayInputs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [row] = await db.select().from(pivotRunwayInputs)
          .where(eq(pivotRunwayInputs.ventureId, input.ventureId));
        return row ?? null;
      }),

    upsertRunwayInputs: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        currentCashBalance: z.number().min(0),
        monthlyBurnRate: z.number().min(0),
        avgPivotCostEstimate: z.number().min(0).optional(),
        avgPivotDurationWeeks: z.number().min(1).optional(),
        runwayAlertThreshold: z.number().min(0).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { pivotRunwayInputs } = await import("../drizzle/schema");
        // Compute derived fields
        const runwayMonths = input.monthlyBurnRate > 0
          ? input.currentCashBalance / input.monthlyBurnRate
          : null;
        const pivotWeeks = input.avgPivotDurationWeeks ?? 8;
        const pivotsRemaining = runwayMonths !== null
          ? runwayMonths / (pivotWeeks / 4.33)
          : null;
        const alertActive = pivotsRemaining !== null && pivotsRemaining < (input.runwayAlertThreshold ?? 2);
        const values = {
          ...input,
          estimatedRunwayMonths: runwayMonths,
          estimatedPivotsRemaining: pivotsRemaining,
          runwayAlertActive: alertActive,
          lastCalculatedAt: new Date(),
        };
        await db.insert(pivotRunwayInputs).values(values as any)
          .onDuplicateKeyUpdate({ set: values as any });
        return { success: true, runwayMonths, pivotsRemaining, alertActive };
      }),
  }),

  // ── Literature Audit: Value Network Mapping (Innovator's Dilemma — Rec. 6) ───
  valueNetworks: router({
    get: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { valueNetworks } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [row] = await db.select().from(valueNetworks)
          .where(eq(valueNetworks.ventureId, input.ventureId));
        return row ?? null;
      }),

    upsert: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        primaryCustomerSegment: z.string().optional(),
        customerPerformanceMetrics: z.string().optional(),
        targetGrossMarginPct: z.number().min(0).max(100).optional(),
        costStructureNotes: z.string().optional(),
        primaryChannel: z.string().optional(),
        channelNotes: z.string().optional(),
        competitiveAlternatives: z.string().optional(),
        requiresDifferentCostStructure: z.boolean().optional(),
        requiresDifferentChannel: z.boolean().optional(),
        requiresDifferentCustomerRelationship: z.boolean().optional(),
        autonomousTeamRecommended: z.boolean().optional(),
        autonomousTeamNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { valueNetworks } = await import("../drizzle/schema");
        // Auto-compute autonomousTeamRecommended
        const autoRecommend = !!(input.requiresDifferentCostStructure ||
          input.requiresDifferentChannel ||
          input.requiresDifferentCustomerRelationship);
        const values = { ...input, autonomousTeamRecommended: input.autonomousTeamRecommended ?? autoRecommend };
        await db.insert(valueNetworks).values(values as any)
          .onDuplicateKeyUpdate({ set: values as any });
        return { success: true };
      }),
  }),

  // ── Literature Audit: Strategic Classification + Innovation Accounting (Rec. 3, 5, 7, 8) ──
  leanMetrics: router({
    // Update venture's strategic classification, engine of growth, PMF signal
    updateClassification: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        strategicClassification: z.enum(["Sustaining","Disruptive-NewMarket","Disruptive-LowEnd"]).optional(),
        engineOfGrowth: z.enum(["Sticky","Viral","Paid"]).optional(),
        productMarketFitSignal: z.enum(["Not Yet","Emerging","Achieved"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { ventures } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { ventureId, ...fields } = input;
        await db.update(ventures).set(fields as any).where(eq(ventures.id, ventureId));
        return { success: true };
      }),

    // Recompute and cache innovation accounting metrics for a venture (Rec. 3)
    recomputeMetrics: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { experiments, interviews, ventures } = await import("../drizzle/schema");
        const { eq, and, gte, ne } = await import("drizzle-orm");
        // Experiment pass rate: passing / (passing + failing + inconclusive)
        const allExps = await db.select().from(experiments)
          .where(eq(experiments.ventureId, input.ventureId));
        const completed = allExps.filter(e => e.outcome !== "Pending");
        const passing = completed.filter(e => e.outcome === "Pass");
        const passRate = completed.length > 0 ? (passing.length / completed.length) * 100 : null;
        // Learning velocity: experiments completed in last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentCompleted = completed.filter(e =>
          e.updatedAt && new Date(e.updatedAt) >= thirtyDaysAgo
        );
        const velocity = recentCompleted.length;
        // Interview insight rate: interviews with validationSignals / total interviews
        const allInterviews = await db.select().from(interviews)
          .where(eq(interviews.ventureId, input.ventureId));
        const withSignals = allInterviews.filter(i => i.validationSignals && i.validationSignals.trim().length > 0);
        const insightRate = allInterviews.length > 0
          ? (withSignals.length / allInterviews.length) * 100
          : null;
        await db.update(ventures).set({
          experimentPassRate: passRate,
          learningVelocity: velocity,
          interviewInsightRate: insightRate,
        } as any).where(eq(ventures.id, input.ventureId));
        return { passRate, velocity, insightRate };
      }),

    // Get portfolio-level innovation accounting summary (Rec. 3)
    portfolioSummary: publicProcedure
      .query(async () => {
        const db = (await getDb())!;
        const { ventures } = await import("../drizzle/schema");
        const rows = await db.select({
          id: ventures.id,
          name: ventures.name,
          color: ventures.color,
          strategicClassification: ventures.strategicClassification,
          engineOfGrowth: ventures.engineOfGrowth,
          productMarketFitSignal: ventures.productMarketFitSignal,
          experimentPassRate: ventures.experimentPassRate,
          learningVelocity: ventures.learningVelocity,
          interviewInsightRate: ventures.interviewInsightRate,
        }).from(ventures);
        return rows;
      }),
  }),

  // ── Literature Audit: Onboarding Hypotheses (Lean Startup — Rec. 13) ─────────
  onboardingHypotheses: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { onboardingHypotheses } = await import("../drizzle/schema");
        const { eq, asc } = await import("drizzle-orm");
        return db.select().from(onboardingHypotheses)
          .where(eq(onboardingHypotheses.ventureId, input.ventureId))
          .orderBy(asc(onboardingHypotheses.onboardingStep));
      }),

    upsert: publicProcedure
      .input(z.object({
        id: z.number().optional(),
        ventureId: z.string(),
        onboardingStep: z.number().min(1).max(4),
        taskLabel: z.string(),
        hypothesis: z.string(),
        validationCriterion: z.string(),
        minimumSampleSize: z.number().optional(),
        outcome: z.enum(["Validated","Invalidated","Inconclusive","Pending"]).optional(),
        evidenceSummary: z.string().optional(),
        linkedExperimentIds: z.string().optional(),
        linkedInterviewIds: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { onboardingHypotheses } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        if (input.id) {
          const { id, ...fields } = input;
          await db.update(onboardingHypotheses).set({
            ...fields,
            validatedAt: fields.outcome === "Validated" ? new Date() : undefined,
          } as any).where(eq(onboardingHypotheses.id, id));
        } else {
          await db.insert(onboardingHypotheses).values(input as any);
        }
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { onboardingHypotheses } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(onboardingHypotheses).where(eq(onboardingHypotheses.id, input.id));
        return { success: true };
      }),
  }),

  // ── Literature Audit: Disruption Scoring (Innovator's Dilemma — Rec. 11 & 12) ─
  disruptionScoring: router({
    get: publicProcedure
      .input(z.object({ opportunityId: z.number() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { opportunityDisruptionScores } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [row] = await db.select().from(opportunityDisruptionScores)
          .where(eq(opportunityDisruptionScores.opportunityId, input.opportunityId));
        return row ?? null;
      }),

    upsert: publicProcedure
      .input(z.object({
        opportunityId: z.number(),
        initialMarketSmallness: z.number().min(0).max(10).optional(),
        nonConsumerTargeting: z.number().min(0).max(10).optional(),
        simplicityScore: z.number().min(0).max(10).optional(),
        lowMarginViability: z.number().min(0).max(10).optional(),
        incumbentIgnoreScore: z.number().min(0).max(10).optional(),
        requiresDifferentCostStructure: z.boolean().optional(),
        requiresDifferentChannel: z.boolean().optional(),
        requiresDifferentCustomerRelationship: z.boolean().optional(),
        assessmentNotes: z.string().optional(),
        assessedBy: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { opportunityDisruptionScores } = await import("../drizzle/schema");
        const total = (input.initialMarketSmallness ?? 0) +
          (input.nonConsumerTargeting ?? 0) +
          (input.simplicityScore ?? 0) +
          (input.lowMarginViability ?? 0) +
          (input.incumbentIgnoreScore ?? 0);
        const autonomousFlagged = !!(input.requiresDifferentCostStructure ||
          input.requiresDifferentChannel ||
          input.requiresDifferentCustomerRelationship);
        const values = {
          ...input,
          disruptionPotentialScore: total,
          autonomousTeamFlagged: autonomousFlagged,
        };
        await db.insert(opportunityDisruptionScores).values(values as any)
          .onDuplicateKeyUpdate({ set: values as any });
        return { success: true, disruptionPotentialScore: total };
      }),

    listAll: publicProcedure
      .query(async () => {
        const db = (await getDb())!;
        const { opportunityDisruptionScores, opportunities } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        return db.select({
          id: opportunityDisruptionScores.id,
          opportunityId: opportunityDisruptionScores.opportunityId,
          title: opportunities.title,
          disruptionPotentialScore: opportunityDisruptionScores.disruptionPotentialScore,
          autonomousTeamFlagged: opportunityDisruptionScores.autonomousTeamFlagged,
          strategicFitScore: opportunities.strategicFitScore,
        }).from(opportunityDisruptionScores)
          .innerJoin(opportunities, eq(opportunityDisruptionScores.opportunityId, opportunities.id));
      }),
  }),

  // ── Literature Audit: Autonomy Health Check (Innovator's Dilemma — Rec. 14) ──
  autonomyChecks: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { autonomyHealthChecks } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        return db.select().from(autonomyHealthChecks)
          .where(eq(autonomyHealthChecks.ventureId, input.ventureId))
          .orderBy(desc(autonomyHealthChecks.assessmentDate));
      }),

    add: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        assessmentDate: z.date().or(z.string().transform(s => new Date(s))),
        budgetProtectionScore: z.number().min(0).max(10),
        decisionAutonomyScore: z.number().min(0).max(10),
        metricsAppropriatenessScore: z.number().min(0).max(10),
        valueNetworkEmbeddingScore: z.number().min(0).max(10),
        budgetNotes: z.string().optional(),
        decisionNotes: z.string().optional(),
        metricsNotes: z.string().optional(),
        valueNetworkNotes: z.string().optional(),
        recommendedActions: z.string().optional(),
        assessedBy: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { autonomyHealthChecks } = await import("../drizzle/schema");
        const total = input.budgetProtectionScore + input.decisionAutonomyScore +
          input.metricsAppropriatenessScore + input.valueNetworkEmbeddingScore;
        const level = total <= 10 ? "Critical" : total <= 20 ? "Low" : total <= 30 ? "Moderate" : "High";
        await db.insert(autonomyHealthChecks).values({
          ...input,
          totalAutonomyScore: total,
          autonomyLevel: level,
        } as any);
        return { success: true, totalAutonomyScore: total, autonomyLevel: level };
      }),
  }),

  // ── Literature Audit: Technology Trajectory (Innovator's Dilemma — Rec. 15) ──
  technologyTrajectory: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { technologyTrajectories } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        return db.select().from(technologyTrajectories)
          .where(eq(technologyTrajectories.ventureId, input.ventureId))
          .orderBy(desc(technologyTrajectories.snapshotDate));
      }),

    addSnapshot: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        currentTrl: z.number().min(1).max(9),
        mainStreamMarketTrlThreshold: z.number().min(1).max(9).optional(),
        lowEndMarketTrlThreshold: z.number().min(1).max(9).optional(),
        trlGrowthRatePerQuarter: z.number().min(0).optional(),
        alertHorizonQuarters: z.number().min(1).optional(),
        snapshotDate: z.date().or(z.string().transform(s => new Date(s))),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { technologyTrajectories } = await import("../drizzle/schema");
        const mainThreshold = input.mainStreamMarketTrlThreshold ?? 7;
        const lowThreshold = input.lowEndMarketTrlThreshold ?? 4;
        const rate = input.trlGrowthRatePerQuarter ?? null;
        const horizon = input.alertHorizonQuarters ?? 4;
        const quartersToMain = rate && rate > 0
          ? Math.max(0, (mainThreshold - input.currentTrl) / rate)
          : null;
        const quartersToLow = rate && rate > 0
          ? Math.max(0, (lowThreshold - input.currentTrl) / rate)
          : null;
        const alertActive = quartersToMain !== null && quartersToMain <= horizon;
        await db.insert(technologyTrajectories).values({
          ...input,
          mainStreamMarketTrlThreshold: mainThreshold,
          lowEndMarketTrlThreshold: lowThreshold,
          quartersToMainstreamEntry: quartersToMain,
          quartersToLowEndEntry: quartersToLow,
          marketEntryAlertActive: alertActive,
        } as any);
        return { success: true, quartersToMain, quartersToLow, alertActive };
      }),
  }),

  // ── Literature Audit: Cohort Analysis (Lean Startup — Rec. 4) ────────────────
  cohortAnalysis: router({
    list: publicProcedure
      .query(async () => {
        const db = (await getDb())!;
        const { cohortSnapshots } = await import("../drizzle/schema");
        const { asc } = await import("drizzle-orm");
        return db.select().from(cohortSnapshots)
          .orderBy(asc(cohortSnapshots.foundingCohort), asc(cohortSnapshots.quartersElapsed));
      }),

    addSnapshot: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        foundingCohort: z.string(),
        snapshotQuarter: z.string(),
        quartersElapsed: z.number().min(0),
        vrlScore: z.number().optional(),
        trlLevel: z.number().optional(),
        experimentPassRate: z.number().optional(),
        pivotCount: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { cohortSnapshots } = await import("../drizzle/schema");
        await db.insert(cohortSnapshots).values(input as any);
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
