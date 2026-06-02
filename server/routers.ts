import { vrlRouter } from "./vrl.router";
import { mrlScoringRouter } from "./mrlScoring.router";
import { syncRouter } from "./sync.router";
import { mrlRouter } from "./mrl.router";
import { srlRouter } from "./srl.router";
import { gdriveWorkspaceRouter } from "./gdriveWorkspace.router";
import { vrlDashboardV4Router } from "./vrlDashboardV4.router";
import { spinoffSequenceRouter } from "./spinoffSequence.router";
import { brandPipelineRouter } from "./brandPipeline.router";
import { insightAutomationRouter } from "./insightAutomation.router";
import { workflowEngineRouter } from "./workflowEngine.router";
import { dispatchTrigger } from "./workflowEngine";
import { governanceRouter } from "./governance.router";
import { mfgOnboardingRouter, mfgAuditRouter, mfgRfqRouter, mfgAslRouter, mfgContractRouter } from "./mfgPlaybookExtended.router";
import { uniPartnersRouter, uniResearchRouter, uniTalentRouter, uniWorkflowRouter, uniIndustryRouter, uniGovernanceRouter, uniDataRouter, uniRoadmapRouter, uniSummaryRouter } from "./universityPlaybook.router";
import { uniApprovalReportRouter } from "./uniApprovalReport.router";
import { spinoutBlueprintRouter } from "./spinoutBlueprint.router";
import { crlRouter } from "./crl.router";
import { investmentModuleRouter } from "./investmentModule.router";
import { ecoraceLab } from "./ecoracelab.router";
import { coachingRouter } from "./coaching.router";
import { flowerRouter } from "./flower.router";
import { adminRouter } from "./admin.router";
import { contextualRouter } from "./contextual.router";
import { startupFailureRiskRouter } from "./startupFailureRisk.router";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import {
  computeAndSaveMatchScore,
  computeAllMatchesForOpportunity,
  computeAllMatchesForFounder,
  computeCoFounderCompatibility,
  getTopMatchesForOpportunity,
  getTopMatchesForFounder,
  getAllTalentProfiles,
  createSpinoffConfig,
  getSpinoffConfig,
  listSpinoffConfigs,
  updateSpinoffConfig,
  saveExecutionPlan,
  getExecutionPlan,
  updateExecutionPlanStatus,
} from "./matchingDb";
import {
  spinoffStatusHistory,
  productOpportunities,
  spinoffConfigurations,
  founderMatchScores,
  contractLayers,
  contractTypeRegistry,
  legalRiskItems,
  legalRiskEscalations,
  type SpinoffConfiguration,
  type ProductOpportunity,
} from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  getPortfolioSummary, getVrlDistribution, getOpportunityFunnel,
  getPmHealth, getFinancialPerformance, getEsgMetrics,
  getEcosystemNodes, upsertEcosystemNode, getLearningVelocity,
  getVentureRevenueSparklines,
  getOfferingAnalytics,
  getPortfolioOfferingRollup,
} from "./commandCentreDb";
import {
  listPrograms, getProgram, createProgram, updateProgram, deleteProgram,
  listPhases, getPhase, createPhase, updatePhase, deletePhase,
  listWorkstreams, createWorkstream, updateWorkstream, deleteWorkstream,
  listMilestonesByVenture, listMilestones, createMilestone, updateMilestone as updatePmMilestone, deleteMilestone as deletePmMilestone,
  listTasksByVenture, listTasks, createTask, updateTask, deleteTask,
  listResources, createResource, updateResource, deleteResource,
  listExecutionRisks, createExecutionRisk, updateExecutionRisk, deleteExecutionRisk,
  listDocuments, createDocument, updateDocument, deleteDocument,
  getPmPortfolioSummary,
} from "./pmDb";
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
import {
  getAllProductCategories,
  insertProductCategory,
  getAllProductOpportunities,
  getProductOpportunityById,
  insertProductOpportunity,
  updateProductOpportunity,
  deleteProductOpportunity,
  getBaselineForOpportunity,
  upsertProductBaseline,
  getCostAssessment,
  upsertCostAssessment,
  getPerformanceAssessment,
  upsertPerformanceAssessment,
  getQualityAssessment,
  upsertQualityAssessment,
  getSustainabilityAssessment,
  upsertSustainabilityAssessment,
  getPosScore,
  getAllPosScores,
  getReviewsForOpportunity,
  insertOpportunityReview,
  getFullOpportunityDetail,
} from "./poiDb";
import { dmAssetsRouter, dmQualityRouter, dmPipelinesRouter, dmRagRouter, dmFineTuningRouter, dmFeedbackRouter, dmSummaryRouter } from "./dataManagement.router";
import { commercialCrmRouter } from "./commercialCrm.router";
import { finPlRouter, finRunwayRouter, finWaterfallRouter, finReportsRouter, finUnitEconRouter, finSummaryRouter } from "./financialModel.router";
import { investorCrmRouter } from "./investorCrm.router";
import { investorDataRoomRouter } from "./investorDataRoom.router";
import { learningEngineRouter } from "./learningEngine.router";
import { ipIntelligenceRouter } from "./ipIntelligence.router";
import { playbookRouter } from "./playbook.router";
import { marketingBrandRouter } from "./marketingBrand.router";
import { specialistServicesRouter } from "./specialistServices.router";
import { portfoliosOfferingsRouter } from "./portfoliosOfferings.router";
import { discoveryMarketRouter } from "./discoveryMarket.router";
import { commandCentreLeanRouter } from "./commandCentre.lean.router";

export const appRouter = router({
  discoveryMarket: discoveryMarketRouter,
  commandCentreLean: commandCentreLeanRouter,
  startupFailureRisk: startupFailureRiskRouter,
  system: systemRouter,
  coaching: coachingRouter,
  flower: flowerRouter,
  admin: adminRouter,
  contextual: contextualRouter,

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
      .input(z.object({ ventureId: z.string(), offeringId: z.string().optional() }))
      .query(async ({ input }) => getMilestonesForVenture(input.ventureId, input.offeringId)),

    add: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        offeringId: z.string().optional(),
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
      .input(z.object({ ventureId: z.string(), offeringId: z.string().optional() }))
      .query(async ({ input }) => getRisksForVenture(input.ventureId, input.offeringId)),

    add: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        offeringId: z.string().optional(),
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
      .input(z.object({ ventureId: z.string(), offeringId: z.string().optional() }))
      .query(async ({ input }) => getExperimentsForVenture(input.ventureId, input.offeringId)),

    add: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        offeringId: z.string().optional(),
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
        // Retrieve relevant knowledge base context
        const { searchKnowledge } = await import("./knowledgeBase");
        const kbResults = await searchKnowledge({ query: `customer discovery interview ${input.ventureId}`, domain: "Market", topK: 3 });
        const kbContext = kbResults.length > 0
          ? `\n\n--- Relevant Knowledge Base Context ---\n${kbResults.map((r, i) => `[${i+1}] ${r.documentTitle} (${r.domain}): ${r.content.slice(0, 400)}`).join("\n\n")}`
          : "";

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an expert venture analyst specialising in customer discovery interviews for early-stage ventures. 
Extract and structure the key information from this customer interview transcript into a concise, actionable summary for a venture builder studio.
Return a JSON object with exactly these fields:
- keyInsights: string (2-3 bullet points of the most important insights, separated by \n)
- painPoints: string (the main problems or frustrations expressed, 2-3 points separated by \n)
- validationSignals: string (evidence that supports or challenges the venture hypothesis, 2-3 points separated by \n)
- aiSummary: string (a 3-4 sentence executive summary of the interview)${kbContext}`,
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

    // ── Contract Architecture Layer Procedures ──────────────────────────────
    getLayers: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(contractLayers).orderBy(contractLayers.sortOrder);
    }),

    getContractRegistry: publicProcedure
      .input(z.object({ layerKey: z.string().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const rows = await db.select().from(contractTypeRegistry).orderBy(contractTypeRegistry.id);
        if (input.layerKey) return rows.filter(r => r.layerKey === input.layerKey);
        return rows;
      }),

    updateContractStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["Active", "Draft", "Pending", "Not Required", "Expired"]),
        owner: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(contractTypeRegistry)
          .set({ status: input.status, owner: input.owner ?? null, notes: input.notes ?? null })
          .where(eq(contractTypeRegistry.id, input.id));
        return { success: true };
      }),

    getLegalRiskMap: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(legalRiskItems).orderBy(legalRiskItems.riskZone, legalRiskItems.id);
    }),

    updateRiskStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["Open", "Mitigated", "Monitoring", "Closed"]),
        owner: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(legalRiskItems)
          .set({ status: input.status, owner: input.owner ?? null })
          .where(eq(legalRiskItems.id, input.id));
        return { success: true };
      }),

    // Returns contracts expiring within the next `days` days (default 60)
    getExpiring: publicProcedure
      .input(z.object({ days: z.number().default(60) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const all = await db.select().from(contractTypeRegistry)
          .where(eq(contractTypeRegistry.status, "Active"));
        const now = Date.now();
        const cutoff = now + input.days * 24 * 60 * 60 * 1000;
        return all.filter(c => {
          if (!c.expiryDate) return false;
          const exp = new Date(c.expiryDate).getTime();
          return exp > now && exp <= cutoff;
        });
      }),

    // Marks a contract as Under Review (renew action)
    renewContract: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(contractTypeRegistry)
          .set({ status: "Pending" })
          .where(eq(contractTypeRegistry.id, input.id));
        return { success: true };
      }),

    // Updates expiry date and/or layer for a contract type
    updateContractMeta: publicProcedure
      .input(z.object({
        id: z.number(),
        expiryDate: z.string().optional(),
        layerKey: z.string().optional(),
        status: z.enum(["Active", "Draft", "Pending", "Not Required", "Expired"]).optional(),
        owner: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const updates: Record<string, unknown> = {};
        if (input.expiryDate !== undefined) updates.expiryDate = input.expiryDate || null;
        if (input.layerKey !== undefined) updates.layerKey = input.layerKey;
        if (input.status !== undefined) updates.status = input.status;
        if (input.owner !== undefined) updates.owner = input.owner;
        await db.update(contractTypeRegistry)
          .set(updates)
          .where(eq(contractTypeRegistry.id, input.id));
        return { success: true };
      }),

    // Upload a contract document to S3 and link it to the contract type registry entry
    uploadRegistryDocument: publicProcedure
      .input(z.object({
        id: z.number(),
        fileName: z.string(),
        mimeType: z.string().default("application/pdf"),
        base64Data: z.string(), // base64-encoded file content
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const buffer = Buffer.from(input.base64Data, "base64");
        const suffix = nanoid(8);
        const fileKey = `contracts/${input.id}-${suffix}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        await db.update(contractTypeRegistry)
          .set({ documentUrl: url, documentKey: fileKey })
          .where(eq(contractTypeRegistry.id, input.id));
        return { success: true, url, fileKey };
      }),

    // Remove a contract document from a contract type registry entry
    removeRegistryDocument: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(contractTypeRegistry)
          .set({ documentUrl: null, documentKey: null })
          .where(eq(contractTypeRegistry.id, input.id));
        return { success: true };
      }),

    // Escalate a legal risk item: sets status to Escalated, inserts escalation row, notifies owner
    escalateRisk: publicProcedure
      .input(z.object({
        riskItemId: z.number(),
        escalatedBy: z.string(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        // Fetch the risk item for context
        const [risk] = await db.select().from(legalRiskItems)
          .where(eq(legalRiskItems.id, input.riskItemId));
        if (!risk) throw new Error("Risk item not found");
        // Update status to Monitoring (escalated)
        await db.update(legalRiskItems)
          .set({ status: "Monitoring" })
          .where(eq(legalRiskItems.id, input.riskItemId));
        // Insert escalation audit row
        await db.insert(legalRiskEscalations).values({
          riskItemId: input.riskItemId,
          escalatedBy: input.escalatedBy,
          reason: input.reason ?? null,
          notifiedAt: new Date(),
        });
        // Notify owner
        await notifyOwner({
          title: `⚠️ Legal Risk Escalated: ${risk.riskArea}`,
          content: `Risk area "${risk.riskArea}" (${risk.riskZone} zone) has been escalated by ${input.escalatedBy}.\n\nReason: ${input.reason ?? "Not specified"}\n\nMitigation: ${risk.mitigation ?? "None recorded"}`,
        });
        return { success: true };
      }),

    // Get escalation history for a risk item
    getEscalations: publicProcedure
      .input(z.object({ riskItemId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(legalRiskEscalations)
          .where(eq(legalRiskEscalations.riskItemId, input.riskItemId))
          .orderBy(desc(legalRiskEscalations.createdAt));
      }),

    // Get all escalations (for overview)
    getAllEscalations: publicProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(legalRiskEscalations)
          .orderBy(desc(legalRiskEscalations.createdAt));
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
        offeringId: z.string().optional(),
        offeringName: z.string().optional(),
        ventureName: z.string(),
        sector: z.string(),
        description: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Retrieve relevant knowledge base context for market analysis
        const { searchKnowledge } = await import("./knowledgeBase");
        const kbResults = await searchKnowledge({ query: `${input.sector} market size growth drivers`, topK: 4 });
        const kbContext = kbResults.length > 0
          ? `\n\nKnowledge base context (use to inform your analysis):\n${kbResults.map((r, i) => `[${i+1}] ${r.documentTitle}: ${r.content.slice(0, 350)}`).join("\n\n")}`
          : "";

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a market research analyst specialising in sustainable technology, eco-materials, and impact ventures. 
Generate a structured market analysis in JSON format. Use British English. Be specific with numbers — cite realistic market size figures based on known industry data.${kbContext}
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
        offeringId: z.string().optional(),
        offeringName: z.string().optional(),
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
        // Retrieve relevant knowledge base context for the report
        const { searchKnowledge } = await import("./knowledgeBase");
        const [strategyResults, marketResults, esgResults] = await Promise.all([
          searchKnowledge({ query: `${input.title} ${input.sector ?? ""} disruptive innovation strategy`, topK: 3 }),
          searchKnowledge({ query: `${input.sector ?? ""} market opportunity competitive landscape`, domain: "Market", topK: 3 }),
          searchKnowledge({ query: `${input.sector ?? ""} ESG sustainability impact`, domain: "ESG", topK: 2 }),
        ]);
        const allKbResults = [...strategyResults, ...marketResults, ...esgResults]
          .filter((r, i, arr) => arr.findIndex(x => x.documentId === r.documentId && x.chunkIndex === r.chunkIndex) === i) // deduplicate
          .slice(0, 6);
        const kbContext = allKbResults.length > 0
          ? `\n\n--- Knowledge Base References (cite where relevant) ---\n${allKbResults.map((r, i) => `[KB${i+1}] ${r.documentTitle}${r.author ? ` by ${r.author}` : ""}${r.publishedYear ? ` (${r.publishedYear})` : ""} [${r.domain}]: ${r.content.slice(0, 450)}`).join("\n\n")}`
          : "";

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a senior business analyst and market researcher specialising in sustainable technology, social enterprise, and impact ventures. You produce structured, evidence-based commercial research reports.${kbContext}

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
          .onConflictDoNothing();
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
          .onConflictDoNothing();
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
          .onConflictDoNothing();
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

  // ── Sprint 60: Founder Onboarding Submissions ─────────────────────────────
  onboardingSubmissions: router({
    submit: publicProcedure
      .input(z.object({
        ventureName:      z.string().min(2),
        tagline:          z.string().optional(),
        sector:           z.string().min(1),
        channel:          z.enum(["B2B", "D2C"]),
        nominatedCharity: z.string().optional(),
        brandColor:       z.string().optional(),
        bmc:              z.string().optional(),
        mmc:              z.string().optional(),
        founderName:      z.string().min(2),
        founderEmail:     z.string().email().optional(),
        checkedTasks:     z.record(z.string(), z.boolean()).optional(),
        checkedCount:     z.number().default(0),
        totalTasks:       z.number().default(26),
        talentProfileId:  z.number().optional(),
        ventureId:        z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { founderOnboardingSubmissions } = await import("../drizzle/schema");
        const [result] = await db.insert(founderOnboardingSubmissions).values({
          ventureName:      input.ventureName,
          tagline:          input.tagline,
          sector:           input.sector,
          channel:          input.channel,
          nominatedCharity: input.nominatedCharity,
          brandColor:       input.brandColor,
          bmc:              input.bmc,
          mmc:              input.mmc,
          founderName:      input.founderName,
          founderEmail:     input.founderEmail,
          checkedTasks:     input.checkedTasks ? JSON.stringify(input.checkedTasks) : null,
          checkedCount:     input.checkedCount,
          totalTasks:       input.totalTasks,
          talentProfileId:  input.talentProfileId,
          ventureId:        input.ventureId,
          status:           "Completed",
        } as any);
        return { id: (result as any).insertId as number };
      }),
    list: publicProcedure
      .query(async () => {
        const db = (await getDb())!;
        const { founderOnboardingSubmissions } = await import("../drizzle/schema");
        const { desc: descOrd } = await import("drizzle-orm");
        return db.select().from(founderOnboardingSubmissions)
          .orderBy(descOrd(founderOnboardingSubmissions.createdAt));
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { founderOnboardingSubmissions } = await import("../drizzle/schema");
        const { eq: eqOp } = await import("drizzle-orm");
        const [row] = await db.select().from(founderOnboardingSubmissions)
          .where(eqOp(founderOnboardingSubmissions.id, input.id));
        return row ?? null;
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { founderOnboardingSubmissions } = await import("../drizzle/schema");
        const { eq: eqOp } = await import("drizzle-orm");
        await db.delete(founderOnboardingSubmissions)
          .where(eqOp(founderOnboardingSubmissions.id, input.id));
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
          .onConflictDoNothing();
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

  // ── Impact Governance Engine (IRL) ──────────────────────────────────────────
  // IRL = (ESG + LCA + PCF + CSR + Certification) / 5
  // Total Venture Intelligence Score = VRL + IRL
  irl: router({

    // ESG: get or upsert per-venture ESG metrics
    getEsg: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { esgMetrics } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(esgMetrics).where(eq(esgMetrics.ventureId, input.ventureId));
        return rows[0] ?? null;
      }),

    upsertEsg: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        carbonEmissionsScore:       z.number().min(0).max(10).optional(),
        energyEfficiencyScore:      z.number().min(0).max(10).optional(),
        waterManagementScore:       z.number().min(0).max(10).optional(),
        wasteCircularityScore:      z.number().min(0).max(10).optional(),
        biodiversityScore:          z.number().min(0).max(10).optional(),
        workerWellbeingScore:       z.number().min(0).max(10).optional(),
        diversityInclusionScore:    z.number().min(0).max(10).optional(),
        communityEngagementScore:   z.number().min(0).max(10).optional(),
        supplyChainEthicsScore:     z.number().min(0).max(10).optional(),
        boardTransparencyScore:     z.number().min(0).max(10).optional(),
        ethicsAntiCorruptionScore:  z.number().min(0).max(10).optional(),
        stakeholderEngagementScore: z.number().min(0).max(10).optional(),
        dataPrivacyScore:           z.number().min(0).max(10).optional(),
        esgFrameworkUsed:           z.string().optional(),
        notes:                      z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { esgMetrics } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { ventureId, ...fields } = input;
        const e = [fields.carbonEmissionsScore ?? 0, fields.energyEfficiencyScore ?? 0,
                   fields.waterManagementScore ?? 0, fields.wasteCircularityScore ?? 0,
                   fields.biodiversityScore ?? 0];
        const s = [fields.workerWellbeingScore ?? 0, fields.diversityInclusionScore ?? 0,
                   fields.communityEngagementScore ?? 0, fields.supplyChainEthicsScore ?? 0];
        const g = [fields.boardTransparencyScore ?? 0, fields.ethicsAntiCorruptionScore ?? 0,
                   fields.stakeholderEngagementScore ?? 0, fields.dataPrivacyScore ?? 0];
        const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
        const environmentalScore = parseFloat(avg(e).toFixed(2));
        const socialScore        = parseFloat(avg(s).toFixed(2));
        const governanceScore    = parseFloat(avg(g).toFixed(2));
        const esgScore           = parseFloat(avg([environmentalScore, socialScore, governanceScore]).toFixed(2));
        const payload = { ...fields, environmentalScore, socialScore, governanceScore, esgScore, lastReviewedAt: new Date() };
        const existing = await db.select().from(esgMetrics).where(eq(esgMetrics.ventureId, ventureId));
        if (existing.length > 0) {
          await db.update(esgMetrics).set(payload as any).where(eq(esgMetrics.ventureId, ventureId));
        } else {
          await db.insert(esgMetrics).values({ ventureId, ...payload } as any);
        }
        return { success: true, esgScore };
      }),

    // LCA: list and upsert life cycle assessment stages
    getLca: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { lcaAssessments } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        return db.select().from(lcaAssessments).where(eq(lcaAssessments.ventureId, input.ventureId));
      }),

    upsertLcaStage: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        stage: z.enum(["Raw Material Extraction", "Manufacturing", "Distribution & Logistics", "Use Phase", "End of Life"]),
        climateChangeImpact:     z.number().optional(),
        acidificationImpact:     z.number().optional(),
        eutrophicationImpact:    z.number().optional(),
        waterUsageImpact:        z.number().optional(),
        landUseImpact:           z.number().optional(),
        resourceDepletionImpact: z.number().optional(),
        assessmentMaturityScore: z.number().min(0).max(10).optional(),
        improvementActions:      z.string().optional(),
        targetReductionPercent:  z.number().optional(),
        baselineYear:            z.number().optional(),
        notes:                   z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { lcaAssessments } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const { ventureId, stage, ...fields } = input;
        const existing = await db.select().from(lcaAssessments)
          .where(and(eq(lcaAssessments.ventureId, ventureId), eq(lcaAssessments.stage, stage)));
        if (existing.length > 0) {
          await db.update(lcaAssessments).set({ ...fields, assessedAt: new Date() } as any)
            .where(and(eq(lcaAssessments.ventureId, ventureId), eq(lcaAssessments.stage, stage)));
        } else {
          await db.insert(lcaAssessments).values({ ventureId, stage, ...fields, assessedAt: new Date() } as any);
        }
        return { success: true };
      }),

    // PCF: get or upsert product carbon footprint
    getPcf: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { pcfRecords } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(pcfRecords).where(eq(pcfRecords.ventureId, input.ventureId));
        return rows[0] ?? null;
      }),

    upsertPcf: publicProcedure
      .input(z.object({
        ventureId:              z.string(),
        scope1Emissions:        z.number().min(0).optional(),
        scope2Emissions:        z.number().min(0).optional(),
        scope3Emissions:        z.number().min(0).optional(),
        baselineYear:           z.number().optional(),
        baselineEmissions:      z.number().optional(),
        targetYear:             z.number().optional(),
        targetReductionPercent: z.number().optional(),
        netZeroCommitment:      z.boolean().optional(),
        scienceBasedTarget:     z.boolean().optional(),
        offsetsUsed:            z.number().optional(),
        offsetProvider:         z.string().optional(),
        measurementStandard:    z.string().optional(),
        notes:                  z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { pcfRecords } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { ventureId, ...fields } = input;
        const s1 = fields.scope1Emissions ?? 0;
        const s2 = fields.scope2Emissions ?? 0;
        const s3 = fields.scope3Emissions ?? 0;
        const totalEmissions = s1 + s2 + s3;
        let pcfScore = 0;
        if (totalEmissions > 0) pcfScore += 3;
        if (fields.scienceBasedTarget) pcfScore += 3;
        if (fields.netZeroCommitment) pcfScore += 2;
        if (fields.targetReductionPercent && fields.targetReductionPercent >= 50) pcfScore += 2;
        const payload = { ...fields, totalEmissions, pcfScore, lastMeasuredAt: new Date() };
        const existing = await db.select().from(pcfRecords).where(eq(pcfRecords.ventureId, ventureId));
        if (existing.length > 0) {
          await db.update(pcfRecords).set(payload as any).where(eq(pcfRecords.ventureId, ventureId));
        } else {
          await db.insert(pcfRecords).values({ ventureId, ...payload } as any);
        }
        return { success: true, pcfScore, totalEmissions };
      }),

    // CSR: get or upsert CSR metrics
    getCsr: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { csrMetrics } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(csrMetrics).where(eq(csrMetrics.ventureId, input.ventureId));
        return rows[0] ?? null;
      }),

    upsertCsr: publicProcedure
      .input(z.object({
        ventureId:                  z.string(),
        philanthropyScore:          z.number().min(0).max(10).optional(),
        ethicalSourcingScore:       z.number().min(0).max(10).optional(),
        communityInvestmentScore:   z.number().min(0).max(10).optional(),
        employeeVolunteeringScore:  z.number().min(0).max(10).optional(),
        transparencyReportingScore: z.number().min(0).max(10).optional(),
        csrReportPublished:         z.boolean().optional(),
        reportingFramework:         z.string().optional(),
        sdgAlignments:              z.string().optional(),
        notes:                      z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { csrMetrics } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { ventureId, ...fields } = input;
        const dims = [fields.philanthropyScore ?? 0, fields.ethicalSourcingScore ?? 0,
                      fields.communityInvestmentScore ?? 0, fields.employeeVolunteeringScore ?? 0,
                      fields.transparencyReportingScore ?? 0];
        const csrScore = parseFloat((dims.reduce((a, b) => a + b, 0) / dims.length).toFixed(2));
        const payload = { ...fields, csrScore, lastReportedAt: new Date() };
        const existing = await db.select().from(csrMetrics).where(eq(csrMetrics.ventureId, ventureId));
        if (existing.length > 0) {
          await db.update(csrMetrics).set(payload as any).where(eq(csrMetrics.ventureId, ventureId));
        } else {
          await db.insert(csrMetrics).values({ ventureId, ...payload } as any);
        }
        return { success: true, csrScore };
      }),

    // Certifications: list, add, update, delete
    getCertifications: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { certificationTracking } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        return db.select().from(certificationTracking).where(eq(certificationTracking.ventureId, input.ventureId));
      }),

    upsertCertification: publicProcedure
      .input(z.object({
        id:                      z.number().optional(),
        ventureId:               z.string(),
        certificationName:       z.enum(["B Corp", "ISO 14001", "ISO 26000", "ISO 50001", "ISO 9001", "ISO 45001", "GRI Standards", "UN Global Compact", "Science Based Targets (SBTi)", "Carbon Neutral Certified", "Other"]),
        status:                  z.enum(["Not Started", "Gap Analysis", "In Progress", "Under Review", "Certified", "Lapsed"]).optional(),
        progressPercent:         z.number().min(0).max(100).optional(),
        targetCertificationDate: z.date().optional(),
        certificationDate:       z.date().optional(),
        expiryDate:              z.date().optional(),
        bImpactScore:            z.number().optional(),
        bImpactGovernance:       z.number().optional(),
        bImpactWorkers:          z.number().optional(),
        bImpactCommunity:        z.number().optional(),
        bImpactEnvironment:      z.number().optional(),
        bImpactCustomers:        z.number().optional(),
        certifyingBody:          z.string().optional(),
        certificateUrl:          z.string().optional(),
        notes:                   z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { certificationTracking } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { id, ventureId, ...fields } = input;
        const statusScores: Record<string, number> = {
          "Not Started": 0, "Gap Analysis": 2, "In Progress": 4,
          "Under Review": 7, "Certified": 10, "Lapsed": 3,
        };
        const certificationScore = statusScores[fields.status ?? "Not Started"] ?? 0;
        const payload = { ...fields, certificationScore };
        if (id) {
          await db.update(certificationTracking).set(payload as any).where(eq(certificationTracking.id, id));
        } else {
          await db.insert(certificationTracking).values({ ventureId, ...payload } as any);
        }
        return { success: true, certificationScore };
      }),

    deleteCertification: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { certificationTracking } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(certificationTracking).where(eq(certificationTracking.id, input.id));
        return { success: true };
      }),

    // IRL Score: compute and cache
    computeIrl: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { esgMetrics, lcaAssessments, pcfRecords, csrMetrics, certificationTracking, irlScores, vrlScoringParams } =
          await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const vid = input.ventureId;
        const [esgRow] = await db.select().from(esgMetrics).where(eq(esgMetrics.ventureId, vid));
        const lcaRows  = await db.select().from(lcaAssessments).where(eq(lcaAssessments.ventureId, vid));
        const [pcfRow] = await db.select().from(pcfRecords).where(eq(pcfRecords.ventureId, vid));
        const [csrRow] = await db.select().from(csrMetrics).where(eq(csrMetrics.ventureId, vid));
        const certRows = await db.select().from(certificationTracking).where(eq(certificationTracking.ventureId, vid));
        const [vrlRow] = await db.select().from(vrlScoringParams).where(eq(vrlScoringParams.ventureId, vid));
        const esgScore  = esgRow?.esgScore ?? 0;
        const lcaScore  = lcaRows.length > 0
          ? parseFloat((lcaRows.reduce((s, r) => s + (r.assessmentMaturityScore ?? 0), 0) / lcaRows.length).toFixed(2)) : 0;
        const pcfScore  = pcfRow?.pcfScore ?? 0;
        const csrScore  = csrRow?.csrScore ?? 0;
        const certScore = certRows.length > 0
          ? parseFloat((certRows.reduce((s, r) => s + (r.certificationScore ?? 0), 0) / certRows.length).toFixed(2)) : 0;
        const irlScore = parseFloat(((esgScore + lcaScore + pcfScore + csrScore + certScore) / 5).toFixed(2));
        const vrlScore = vrlRow?.computedVrlScore ?? 0;
        const totalVentureIntelligenceScore = parseFloat((vrlScore + irlScore).toFixed(2));
        const existing = await db.select().from(irlScores).where(eq(irlScores.ventureId, vid));
        const payload = { esgScore, lcaScore, pcfScore, csrScore, certificationScore: certScore,
                          irlScore, vrlScore, totalVentureIntelligenceScore, computedAt: new Date() };
        if (existing.length > 0) {
          await db.update(irlScores).set(payload).where(eq(irlScores.ventureId, vid));
        } else {
          await db.insert(irlScores).values({ ventureId: vid, ...payload });
        }
        return { irlScore, vrlScore, totalVentureIntelligenceScore,
                 components: { esgScore, lcaScore, pcfScore, csrScore, certScore } };
      }),

    getIrlScore: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { irlScores } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(irlScores).where(eq(irlScores.ventureId, input.ventureId));
        return rows[0] ?? null;
      }),

    portfolioIrlSummary: publicProcedure
      .query(async () => {
        const db = (await getDb())!;
        const { irlScores } = await import("../drizzle/schema");
        const rows = await db.select().from(irlScores);
        if (rows.length === 0) return { avgIrl: 0, avgTvis: 0, ventures: [] };
        const avgIrl  = parseFloat((rows.reduce((s, r) => s + (r.irlScore ?? 0), 0) / rows.length).toFixed(2));
        const avgTvis = parseFloat((rows.reduce((s, r) => s + (r.totalVentureIntelligenceScore ?? 0), 0) / rows.length).toFixed(2));
        return { avgIrl, avgTvis, ventures: rows };
      }),
  }),

  // ── Knowledge Base ────────────────────────────────────────────────────────────────────────────
  knowledgeBase: router({

    // List all documents with metadata
    listDocuments: publicProcedure
      .query(async () => {
        const { listKnowledgeDocuments } = await import("./knowledgeBase");
        return listKnowledgeDocuments();
      }),

    // Get library stats
    getStats: publicProcedure
      .query(async () => {
        const { getKnowledgeStats } = await import("./knowledgeBase");
        return getKnowledgeStats();
      }),

    // Create a document record (returns new ID for subsequent upload)
    createDocument: publicProcedure
      .input(z.object({
        title: z.string().min(1),
        sourceType: z.enum(["pdf", "transcript", "url", "text"]),
        domain: z.enum(["VRL", "TRL", "BRL", "IRL", "ESG", "Market", "Finance", "Legal", "People", "Brand", "Strategy", "General"]),
        author: z.string().optional(),
        publishedYear: z.number().int().optional(),
        description: z.string().optional(),
        tags: z.string().optional(),
        sourceUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createKnowledgeDocument } = await import("./knowledgeBase");
        const result = await createKnowledgeDocument({
          title: input.title,
          sourceType: input.sourceType,
          domain: input.domain,
          author: input.author ?? null,
          publishedYear: input.publishedYear ?? null,
          description: input.description ?? null,
          tags: input.tags ?? null,
          sourceUrl: input.sourceUrl ?? null,
          status: "pending",
        });
        return { id: (result as any).insertId as number };
      }),

    // Upload PDF (base64) or plain text, extract text, chunk, and index
    uploadAndIngest: publicProcedure
      .input(z.object({
        documentId: z.number().int(),
        text: z.string().optional(),
        fileBase64: z.string().optional(),
        filename: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const {
          ingestDocument,
          extractPdfText,
          uploadDocumentToS3,
          getKnowledgeDocument,
        } = await import("./knowledgeBase");

        const doc = await getKnowledgeDocument(input.documentId);
        if (!doc) throw new Error("Document not found");

        let text = input.text ?? "";

        if (input.fileBase64 && doc.sourceType === "pdf") {
          const buffer = Buffer.from(input.fileBase64, "base64");
          try {
            const { key } = await uploadDocumentToS3(
              buffer,
              input.filename ?? `doc-${input.documentId}.pdf`,
              "application/pdf"
            );
            const db = (await getDb())!;
            const { knowledgeDocuments } = await import("../drizzle/schema");
            const { eq } = await import("drizzle-orm");
            await db.update(knowledgeDocuments).set({ s3Key: key }).where(eq(knowledgeDocuments.id, input.documentId));
          } catch (e) {
            console.warn("[KB] S3 upload failed, continuing with text extraction:", e);
          }
          text = await extractPdfText(buffer);
        }

        if (!text.trim()) throw new Error("No text content could be extracted");
        return ingestDocument({ documentId: input.documentId, text });
      }),

    // Delete a document and all its chunks
    deleteDocument: publicProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const { deleteKnowledgeDocument } = await import("./knowledgeBase");
        await deleteKnowledgeDocument(input.id);
        return { success: true };
      }),

    // Full-text search across all indexed chunks
    search: publicProcedure
      .input(z.object({
        query: z.string().min(1),
        domain: z.string().optional(),
        topK: z.number().int().min(1).max(20).default(5),
      }))
      .query(async ({ input }) => {
        const { searchKnowledge } = await import("./knowledgeBase");
        return searchKnowledge({ query: input.query, domain: input.domain, topK: input.topK });
      }),

    // Get all chunks for a specific document
    getChunks: publicProcedure
      .input(z.object({ documentId: z.number().int() }))
      .query(async ({ input }) => {
        const { getChunksByDocument } = await import("./knowledgeBase");
        return getChunksByDocument(input.documentId);
      }),
  }),

  // ── People Intelligence Module ───────────────────────────────────────────────
  people: router({

    // ── Talent Pool CRUD ────────────────────────────────────────────────────────
    listTalent: publicProcedure.query(async () => {
      const db = (await getDb())!;
      const { talentProfiles } = await import("../drizzle/schema");
      return db.select().from(talentProfiles).orderBy(talentProfiles.name);
    }),

    getTalent: publicProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { talentProfiles } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(talentProfiles).where(eq(talentProfiles.id, input.id));
        return rows[0] ?? null;
      }),

    upsertTalent: publicProcedure
      .input(z.object({
        id:                       z.number().int().optional(),
        name:                     z.string().min(1),
        email:                    z.string().email().optional(),
        linkedIn:                 z.string().optional(),
        location:                 z.string().optional(),
        profileType:              z.enum(["Founder","Operator","Executive","Technical Expert","Advisor","Mentor","Supplier","Partner","Investor"]).optional(),
        currentRole:              z.string().optional(),
        availability:             z.enum(["Immediately Available","Available in 1 Month","Available in 3 Months","Part-Time Only","Advisory Only","Not Available"]).optional(),
        availabilityHoursPerWeek: z.number().int().min(0).max(60).optional(),
        yearsExperience:          z.number().int().min(0).optional(),
        industryExpertise:        z.string().optional(),
        previousVentures:         z.number().int().min(0).optional(),
        previousExits:            z.number().int().min(0).optional(),
        previousLeadershipRoles:  z.number().int().min(0).optional(),
        stageIdea:                z.number().int().min(0).max(10).optional(),
        stageValidation:          z.number().int().min(0).max(10).optional(),
        stageBuild:               z.number().int().min(0).max(10).optional(),
        stageScale:               z.number().int().min(0).max(10).optional(),
        capTechnical:             z.number().int().min(0).max(10).optional(),
        capCommercial:            z.number().int().min(0).max(10).optional(),
        capOperational:           z.number().int().min(0).max(10).optional(),
        capRegulatory:            z.number().int().min(0).max(10).optional(),
        capManufacturing:         z.number().int().min(0).max(10).optional(),
        capSupplyChain:           z.number().int().min(0).max(10).optional(),
        capFinancial:             z.number().int().min(0).max(10).optional(),
        capMarketing:             z.number().int().min(0).max(10).optional(),
        networkInvestors:         z.number().int().min(0).max(10).optional(),
        networkCustomers:         z.number().int().min(0).max(10).optional(),
        networkSuppliers:         z.number().int().min(0).max(10).optional(),
        networkRegulators:        z.number().int().min(0).max(10).optional(),
        networkIndustry:          z.number().int().min(0).max(10).optional(),
        attrLeadership:           z.number().int().min(0).max(10).optional(),
        attrExecution:            z.number().int().min(0).max(10).optional(),
        attrCollaboration:        z.number().int().min(0).max(10).optional(),
        attrRiskTolerance:        z.number().int().min(0).max(10).optional(),
        attrResilience:           z.number().int().min(0).max(10).optional(),
        bio:                      z.string().optional(),
        notes:                    z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { talentProfiles } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        if (input.id) {
          const { id, ...rest } = input;
          await db.update(talentProfiles).set(rest).where(eq(talentProfiles.id, id));
          return { id };
        } else {
          const { id: _id, ...rest } = input;
          const result = await db.insert(talentProfiles).values(rest as any);
          return { id: (result as any)[0]?.insertId ?? 0 };
        }
      }),

    deleteTalent: publicProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { talentProfiles } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(talentProfiles).where(eq(talentProfiles.id, input.id));
        return { success: true };
      }),

    // ── Venture Role Requirements ────────────────────────────────────────────────
    listRoleRequirements: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { ventureRoleRequirements } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        return db.select().from(ventureRoleRequirements).where(eq(ventureRoleRequirements.ventureId, input.ventureId));
      }),

    upsertRoleRequirement: publicProcedure
      .input(z.object({
        id:                 z.number().int().optional(),
        ventureId:          z.string(),
        roleTitle:          z.string().min(1),
        functionalArea:     z.enum(["Technical","Commercial","Operational","Regulatory","Manufacturing","Supply Chain","Financial","Marketing","Leadership"]),
        priority:           z.enum(["Critical","High","Medium","Low"]).optional(),
        status:             z.enum(["Open","Filled","On Hold"]).optional(),
        minYearsExperience: z.number().int().min(0).optional(),
        minCapScore:        z.number().int().min(0).max(10).optional(),
        minNetworkScore:    z.number().int().min(0).max(10).optional(),
        minStageExperience: z.enum(["Idea","Validation","Build","Scale"]).optional(),
        requiredSectors:    z.string().optional(),
        engagementType:     z.enum(["Full-Time","Part-Time","Advisory","Contract"]).optional(),
        description:        z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { ventureRoleRequirements } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        if (input.id) {
          const { id, ...rest } = input;
          await db.update(ventureRoleRequirements).set(rest).where(eq(ventureRoleRequirements.id, id));
          return { id };
        } else {
          const { id: _id, ...rest } = input;
          const result = await db.insert(ventureRoleRequirements).values(rest as any);
          return { id: (result as any)[0]?.insertId ?? 0 };
        }
      }),

    deleteRoleRequirement: publicProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { ventureRoleRequirements } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(ventureRoleRequirements).where(eq(ventureRoleRequirements.id, input.id));
        return { success: true };
      }),

    // ── PVF Scoring Engine ───────────────────────────────────────────────────────
    computePVF: publicProcedure
      .input(z.object({
        talentProfileId:   z.number().int(),
        ventureId:         z.string(),
        roleRequirementId: z.number().int().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { talentProfiles, ventureRoleRequirements, peopleVentureFit } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");

        const profiles = await db.select().from(talentProfiles).where(eq(talentProfiles.id, input.talentProfileId));
        const profile = profiles[0];
        if (!profile) throw new Error("Talent profile not found");

        let role: typeof ventureRoleRequirements.$inferSelect | null = null;
        if (input.roleRequirementId) {
          const roles = await db.select().from(ventureRoleRequirements).where(eq(ventureRoleRequirements.id, input.roleRequirementId));
          role = roles[0] ?? null;
        }

        // 1. Skills Match
        const capScores = [
          profile.capTechnical, profile.capCommercial, profile.capOperational,
          profile.capRegulatory, profile.capManufacturing, profile.capSupplyChain,
          profile.capFinancial, profile.capMarketing,
        ].filter(s => s !== null && s !== undefined) as number[];
        const avgCap = capScores.length > 0 ? capScores.reduce((a, b) => a + b, 0) / capScores.length : 0;
        let skillsMatch = avgCap;
        if (role) {
          const areaMap: Record<string, number> = {
            Technical: profile.capTechnical ?? 0, Commercial: profile.capCommercial ?? 0,
            Operational: profile.capOperational ?? 0, Regulatory: profile.capRegulatory ?? 0,
            Manufacturing: profile.capManufacturing ?? 0, "Supply Chain": profile.capSupplyChain ?? 0,
            Financial: profile.capFinancial ?? 0, Marketing: profile.capMarketing ?? 0,
            Leadership: profile.attrLeadership ?? 0,
          };
          skillsMatch = avgCap * 0.4 + (areaMap[role.functionalArea] ?? 0) * 0.6;
        }

        // 2. Industry Match
        const industryMatch = Math.min(10, (profile.yearsExperience ?? 0) / 2);

        // 3. Stage Match
        const stageScores = [profile.stageIdea, profile.stageValidation, profile.stageBuild, profile.stageScale].filter(Boolean) as number[];
        const stageMatch = stageScores.length > 0 ? stageScores.reduce((a, b) => a + b, 0) / stageScores.length : 0;

        // 4. Network Value
        const netScores = [profile.networkInvestors, profile.networkCustomers, profile.networkSuppliers, profile.networkRegulators, profile.networkIndustry].filter(Boolean) as number[];
        const networkValue = netScores.length > 0 ? netScores.reduce((a, b) => a + b, 0) / netScores.length : 0;

        // 5. Availability Fit
        const availMap: Record<string, number> = {
          "Immediately Available": 10, "Available in 1 Month": 8,
          "Available in 3 Months": 6, "Part-Time Only": 4,
          "Advisory Only": 2, "Not Available": 0,
        };
        const availabilityFit = availMap[profile.availability ?? "Not Available"] ?? 0;

        const pvfScore = parseFloat(((skillsMatch + industryMatch + stageMatch + networkValue + availabilityFit) / 5).toFixed(2));
        const recommendation = pvfScore >= 8 ? "Highly Recommended" : pvfScore >= 6 ? "Recommended" : pvfScore >= 4 ? "Possible" : "Not Recommended";

        const conditions = [
          eq(peopleVentureFit.talentProfileId, input.talentProfileId),
          eq(peopleVentureFit.ventureId, input.ventureId),
          ...(input.roleRequirementId ? [eq(peopleVentureFit.roleRequirementId, input.roleRequirementId)] : []),
        ];
        const existing = await db.select().from(peopleVentureFit).where(and(...conditions));
        const pvfData = {
          talentProfileId: input.talentProfileId, ventureId: input.ventureId,
          roleRequirementId: input.roleRequirementId ?? null,
          skillsMatch: parseFloat(skillsMatch.toFixed(2)), industryMatch: parseFloat(industryMatch.toFixed(2)),
          stageMatch: parseFloat(stageMatch.toFixed(2)), networkValue: parseFloat(networkValue.toFixed(2)),
          availabilityFit, pvfScore, recommendation: recommendation as any,
        };
        if (existing.length > 0) {
          await db.update(peopleVentureFit).set(pvfData).where(eq(peopleVentureFit.id, existing[0].id));
          return { id: existing[0].id, ...pvfData };
        } else {
          const result = await db.insert(peopleVentureFit).values(pvfData);
          return { id: (result as any)[0]?.insertId ?? 0, ...pvfData };
        }
      }),

    getPVFRankings: publicProcedure
      .input(z.object({ ventureId: z.string(), roleRequirementId: z.number().int().optional() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { peopleVentureFit, talentProfiles } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const conditions = [eq(peopleVentureFit.ventureId, input.ventureId)];
        if (input.roleRequirementId) conditions.push(eq(peopleVentureFit.roleRequirementId, input.roleRequirementId));
        return db
          .select({ fit: peopleVentureFit, profile: talentProfiles })
          .from(peopleVentureFit)
          .innerJoin(talentProfiles, eq(peopleVentureFit.talentProfileId, talentProfiles.id))
          .where(and(...conditions))
          .orderBy(desc(peopleVentureFit.pvfScore));
      }),

    // ── Team Composition ────────────────────────────────────────────────────────
    getTeamComposition: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { teamCompositions, talentProfiles } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        return db
          .select({ composition: teamCompositions, profile: talentProfiles })
          .from(teamCompositions)
          .innerJoin(talentProfiles, eq(teamCompositions.talentProfileId, talentProfiles.id))
          .where(eq(teamCompositions.ventureId, input.ventureId))
          .orderBy(teamCompositions.assignedRole);
      }),

    upsertTeamMember: publicProcedure
      .input(z.object({
        id:               z.number().int().optional(),
        ventureId:        z.string(),
        talentProfileId:  z.number().int(),
        roleRequirementId: z.number().int().optional(),
        assignedRole:     z.string().min(1),
        assignmentType:   z.enum(["Recommended","Confirmed","Proposed"]).optional(),
        engagementType:   z.enum(["Full-Time","Part-Time","Advisory","Contract"]).optional(),
        pvfScore:         z.number().min(0).max(10).optional(),
        isFounder:        z.boolean().optional(),
        notes:            z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { teamCompositions } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        if (input.id) {
          const { id, ...rest } = input;
          await db.update(teamCompositions).set(rest).where(eq(teamCompositions.id, id));
          return { id };
        } else {
          const { id: _id, ...rest } = input;
          const result = await db.insert(teamCompositions).values(rest as any);
          return { id: (result as any)[0]?.insertId ?? 0 };
        }
      }),

    removeTeamMember: publicProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { teamCompositions } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(teamCompositions).where(eq(teamCompositions.id, input.id));
        return { success: true };
      }),

    // ── Team Gap Analysis ────────────────────────────────────────────────────────
    computeTeamGaps: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { teamCompositions, talentProfiles, teamGapAnalysis, ventureRoleRequirements } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const team = await db
          .select({ composition: teamCompositions, profile: talentProfiles })
          .from(teamCompositions)
          .innerJoin(talentProfiles, eq(teamCompositions.talentProfileId, talentProfiles.id))
          .where(eq(teamCompositions.ventureId, input.ventureId));

        const roles = await db.select().from(ventureRoleRequirements).where(eq(ventureRoleRequirements.ventureId, input.ventureId));

        const capFields: Array<{ area: string; field: keyof typeof talentProfiles.$inferSelect }> = [
          { area: "Technical",     field: "capTechnical" },
          { area: "Commercial",    field: "capCommercial" },
          { area: "Operational",   field: "capOperational" },
          { area: "Regulatory",    field: "capRegulatory" },
          { area: "Manufacturing", field: "capManufacturing" },
          { area: "Supply Chain",  field: "capSupplyChain" },
          { area: "Financial",     field: "capFinancial" },
          { area: "Marketing",     field: "capMarketing" },
          { area: "Leadership",    field: "attrLeadership" },
          { area: "Network",       field: "networkIndustry" },
        ];

        const gaps: Array<{
          ventureId: string; gapArea: any; severity: any;
          description: string; currentScore: number; requiredScore: number; gapScore: number; status: any;
        }> = [];

        for (const { area, field } of capFields) {
          const scores = team.map(t => (t.profile[field] as number) ?? 0);
          const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
          const requiredScore = 6;
          const gapScore = Math.max(0, requiredScore - avgScore);
          if (gapScore > 0) {
            const severity = gapScore >= 4 ? "Critical" : gapScore >= 2.5 ? "High" : gapScore >= 1 ? "Medium" : "Low";
            gaps.push({
              ventureId: input.ventureId, gapArea: area as any, severity: severity as any,
              description: `Team average ${area} score is ${avgScore.toFixed(1)}/10 (required: ${requiredScore}/10)`,
              currentScore: parseFloat(avgScore.toFixed(2)), requiredScore,
              gapScore: parseFloat(gapScore.toFixed(2)), status: "Open" as any,
            });
          }
        }

        await db.delete(teamGapAnalysis).where(eq(teamGapAnalysis.ventureId, input.ventureId));
        if (gaps.length > 0) await db.insert(teamGapAnalysis).values(gaps);
        return { gaps, teamSize: team.length, openRoles: roles.filter(r => r.status === "Open").length };
      }),

    getTeamGaps: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { teamGapAnalysis } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        return db.select().from(teamGapAnalysis).where(eq(teamGapAnalysis.ventureId, input.ventureId)).orderBy(desc(teamGapAnalysis.gapScore));
      }),

    // ── Founder Suitability Assessment ──────────────────────────────────────────
    upsertFounderSuitability: publicProcedure
      .input(z.object({
        id:                  z.number().int().optional(),
        talentProfileId:     z.number().int(),
        ventureId:           z.string(),
        domainKnowledge:     z.number().int().min(0).max(10),
        executionCapability: z.number().int().min(0).max(10),
        leadershipStrength:  z.number().int().min(0).max(10),
        networkRelevance:    z.number().int().min(0).max(10),
        stageReadiness:      z.number().int().min(0).max(10),
        riskProfile:         z.number().int().min(0).max(10),
        commitmentLevel:     z.number().int().min(0).max(10),
        readinessToExecute:  z.enum(["Ready Now","Ready in 3 Months","Ready in 6 Months","Not Ready"]).optional(),
        assessmentNotes:     z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { founderSuitabilityAssessments } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const scores = [input.domainKnowledge, input.executionCapability, input.leadershipStrength,
          input.networkRelevance, input.stageReadiness, input.riskProfile, input.commitmentLevel];
        const overallScore = parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
        const recommendation = overallScore >= 8 ? "Highly Suitable" : overallScore >= 6 ? "Suitable" : overallScore >= 4 ? "Conditionally Suitable" : "Not Suitable";
        const data = { ...input, overallScore, recommendation: recommendation as any };
        if (input.id) {
          const { id, ...rest } = data;
          await db.update(founderSuitabilityAssessments).set(rest).where(eq(founderSuitabilityAssessments.id, id!));
          return { id };
        } else {
          const { id: _id, ...rest } = data;
          const result = await db.insert(founderSuitabilityAssessments).values(rest as any);
          return { id: (result as any)[0]?.insertId ?? 0, overallScore, recommendation };
        }
      }),

    getFounderSuitability: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { founderSuitabilityAssessments, talentProfiles } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        return db
          .select({ assessment: founderSuitabilityAssessments, profile: talentProfiles })
          .from(founderSuitabilityAssessments)
          .innerJoin(talentProfiles, eq(founderSuitabilityAssessments.talentProfileId, talentProfiles.id))
          .where(eq(founderSuitabilityAssessments.ventureId, input.ventureId))
          .orderBy(desc(founderSuitabilityAssessments.overallScore));
      }),

    // ── Portfolio Talent Summary ─────────────────────────────────────────────────
    getTalentPoolSummary: publicProcedure.query(async () => {
      const db = (await getDb())!;
      const { talentProfiles, teamCompositions, teamGapAnalysis } = await import("../drizzle/schema");
      const { count, eq } = await import("drizzle-orm");
      const [totalResult] = await db.select({ total: count() }).from(talentProfiles);
      const [assignedResult] = await db.select({ assigned: count() }).from(teamCompositions);
      const [criticalGapsResult] = await db.select({ critical: count() }).from(teamGapAnalysis).where(eq(teamGapAnalysis.severity, "Critical"));
      return {
        totalTalent: totalResult?.total ?? 0,
        assignedToVentures: assignedResult?.assigned ?? 0,
        criticalGaps: criticalGapsResult?.critical ?? 0,
      };
    }),
  }),

  // ── Dynamic Equity Engine ────────────────────────────────────────────────────
  // Formula: Score = (0.4×VRL) + (0.3×Contribution) + (0.2×Capital) + (0.1×Performance)
  equity: router({

    // ── Equity Rules (per-venture formula weights) ─────────────────────────────
    getEquityRules: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { equityRules } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(equityRules).where(eq(equityRules.ventureId, input.ventureId));
        if (rows.length > 0) return rows[0];
        // Return defaults if no rule configured yet
        return {
          id: 0, ventureId: input.ventureId,
          vrlWeight: 0.4, contributionWeight: 0.3, capitalWeight: 0.2, performanceWeight: 0.1,
          totalEquityPool: 20.0, notes: null,
          createdAt: new Date(), updatedAt: new Date(),
        };
      }),

    upsertEquityRules: publicProcedure
      .input(z.object({
        ventureId:          z.string(),
        vrlWeight:          z.number().min(0).max(1).optional(),
        contributionWeight: z.number().min(0).max(1).optional(),
        capitalWeight:      z.number().min(0).max(1).optional(),
        performanceWeight:  z.number().min(0).max(1).optional(),
        totalEquityPool:    z.number().min(0).max(100).optional(),
        notes:              z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { equityRules } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const existing = await db.select().from(equityRules).where(eq(equityRules.ventureId, input.ventureId));
        if (existing.length > 0) {
          const { ventureId, ...rest } = input;
          await db.update(equityRules).set(rest).where(eq(equityRules.ventureId, input.ventureId));
          return { ventureId };
        } else {
          await db.insert(equityRules).values(input as any);
          return { ventureId: input.ventureId };
        }
      }),

    // ── Equity Allocations CRUD ────────────────────────────────────────────────
    listAllocations: publicProcedure
      .input(z.object({ ventureId: z.string().optional() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { equityAllocations } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        if (input.ventureId) {
          return db.select().from(equityAllocations).where(eq(equityAllocations.ventureId, input.ventureId));
        }
        return db.select().from(equityAllocations).orderBy(equityAllocations.ventureId, equityAllocations.memberName);
      }),

    upsertAllocation: publicProcedure
      .input(z.object({
        id:                 z.number().int().optional(),
        ventureId:          z.string(),
        memberName:         z.string().min(1),
        memberRole:         z.enum(["Founder","Co-Founder","Lead Engineer","VBS Mentor","Advisor","Operator","Investor"]).optional(),
        equityPct:          z.number().min(0).max(100).optional(),
        vestingMonths:      z.number().int().min(0).optional(),
        cliffMonths:        z.number().int().min(0).optional(),
        monthsIn:           z.number().int().min(0).optional(),
        vestingStatus:      z.enum(["Not Started","Cliff","Vesting","Fully Vested"]).optional(),
        vrlScore:           z.number().min(0).max(10).optional(),
        contributionScore:  z.number().min(0).max(10).optional(),
        capitalInput:       z.number().min(0).optional(),
        performanceScore:   z.number().min(0).max(10).optional(),
        stipendStatus:      z.enum(["Active","Completed","Pending","Paused"]).optional(),
        stipendMonthly:     z.number().min(0).optional(),
        stipendMonthsTotal: z.number().int().min(0).optional(),
        stipendMonthsUsed:   z.number().int().min(0).optional(),
        shareClass:          z.string().optional(),
        legallyConverted:    z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { equityAllocations } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        if (input.id) {
          const { id, ...rest } = input;
          await db.update(equityAllocations).set(rest as any).where(eq(equityAllocations.id, id));
          return { id };
        } else {
          const { id: _id, ...rest } = input;
          const result = await db.insert(equityAllocations).values(rest as any);
          return { id: (result as any)[0]?.insertId ?? 0 };
        }
      }),

    deleteAllocation: publicProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { equityAllocations } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(equityAllocations).where(eq(equityAllocations.id, input.id));
        return { success: true };
      }),

    // ── Compute Equity Score (core formula) ────────────────────────────────────────
    // Formula: Score = (0.4×VRL) + (0.3×Contribution) + (0.2×Capital) + (0.1×Performance)
    computeEquityScore: publicProcedure
      .input(z.object({ allocationId: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { equityAllocations, equityRules } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const allocs = await db.select().from(equityAllocations).where(eq(equityAllocations.id, input.allocationId));
        const alloc = allocs[0];
        if (!alloc) throw new Error("Allocation not found");
        const rulesRows = await db.select().from(equityRules).where(eq(equityRules.ventureId, alloc.ventureId));
        const rules = rulesRows[0] ?? { vrlWeight: 0.4, contributionWeight: 0.3, capitalWeight: 0.2, performanceWeight: 0.1, totalEquityPool: 20 };
        // Normalise capital input: £500k = score 10
        const capitalScore = Math.min(10, ((alloc.capitalInput ?? 0) / 50));
        const dynamicEquityScore = parseFloat((
          (rules.vrlWeight * (alloc.vrlScore ?? 0)) +
          (rules.contributionWeight * (alloc.contributionScore ?? 0)) +
          (rules.capitalWeight * capitalScore) +
          (rules.performanceWeight * (alloc.performanceScore ?? 0))
        ).toFixed(2));
        const dynamicEquityPct = parseFloat(((dynamicEquityScore / 10) * (rules.totalEquityPool ?? 20)).toFixed(2));
        await db.update(equityAllocations)
          .set({ dynamicEquityScore, dynamicEquityPct })
          .where(eq(equityAllocations.id, input.allocationId));
        return { allocationId: input.allocationId, dynamicEquityScore, dynamicEquityPct,
          components: { vrl: alloc.vrlScore ?? 0, contribution: alloc.contributionScore ?? 0, capital: capitalScore, performance: alloc.performanceScore ?? 0 } };
      }),

    // ── Contribution Logs ───────────────────────────────────────────────────────────────────
    listContributions: publicProcedure
      .input(z.object({ ventureId: z.string().optional(), allocationId: z.number().int().optional() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { contributionLogs } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const conditions: any[] = [];
        if (input.ventureId) conditions.push(eq(contributionLogs.ventureId, input.ventureId));
        if (input.allocationId) conditions.push(eq(contributionLogs.allocationId, input.allocationId));
        return db.select().from(contributionLogs)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(contributionLogs.loggedAt));
      }),

    logContribution: publicProcedure
      .input(z.object({
        ventureId:        z.string(),
        allocationId:     z.number().int(),
        memberName:       z.string(),
        contributionType: z.enum(["Task Completion","Milestone Achieved","Capital Injection","Commercial Traction","VRL Progression","IP Filing","Team Building","Other"]),
        description:      z.string().optional(),
        valueScore:       z.number().min(0).max(10),
        capitalAmount:    z.number().min(0).optional(),
        evidenceUrl:      z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { contributionLogs, equityAllocations } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const result = await db.insert(contributionLogs).values({ ...input, loggedAt: new Date() } as any);
        const logId = (result as any)[0]?.insertId ?? 0;
        const logs = await db.select().from(contributionLogs).where(eq(contributionLogs.allocationId, input.allocationId));
        const avgScore = logs.length > 0
          ? parseFloat((logs.reduce((s, l) => s + (l.valueScore ?? 0), 0) / logs.length).toFixed(2))
          : 0;
        const totalCapital = logs.filter(l => l.contributionType === "Capital Injection").reduce((s, l) => s + (l.capitalAmount ?? 0), 0);
        await db.update(equityAllocations).set({ contributionScore: avgScore, capitalInput: totalCapital }).where(eq(equityAllocations.id, input.allocationId));
        return { logId, newContributionScore: avgScore };
      }),

    // ── Contribution Leaderboard ──────────────────────────────────────────────────────────────
    getLeaderboard: publicProcedure
      .input(z.object({ ventureId: z.string().optional() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { equityAllocations } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        const rows = input.ventureId
          ? await db.select().from(equityAllocations).where(eq(equityAllocations.ventureId, input.ventureId))
          : await db.select().from(equityAllocations);
        return rows
          .sort((a, b) => (b.dynamicEquityScore ?? 0) - (a.dynamicEquityScore ?? 0))
          .map((r, i) => ({ rank: i + 1, ...r }));
      }),

    // ── Equity Milestones ───────────────────────────────────────────────────────────────────
    listMilestones: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { equityMilestones } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        return db.select().from(equityMilestones).where(eq(equityMilestones.ventureId, input.ventureId));
      }),

    upsertMilestone: publicProcedure
      .input(z.object({
        id:                z.number().int().optional(),
        ventureId:         z.string(),
        milestoneName:     z.string().min(1),
        milestoneType:     z.enum(["VRL Gate","Pre-Seed Funding","Seed Funding","Series A","Revenue Target","Custom"]),
        triggerVrlLevel:   z.number().int().optional(),
        triggerRevenueGbp: z.number().optional(),
        description:       z.string().optional(),
        status:            z.enum(["Pending","Active","Triggered","Completed"]).optional(),
        legalStructure:    z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { equityMilestones } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        if (input.id) {
          const { id, ...rest } = input;
          await db.update(equityMilestones).set(rest as any).where(eq(equityMilestones.id, id));
          return { id };
        } else {
          const { id: _id, ...rest } = input;
          const result = await db.insert(equityMilestones).values(rest as any);
          return { id: (result as any)[0]?.insertId ?? 0 };
        }
      }),

    triggerLegalConversion: publicProcedure
      .input(z.object({ milestoneId: z.number().int(), ventureId: z.string(), notes: z.string().optional() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { equityMilestones, equityAllocations, ventureCapTableSnapshots } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { notifyOwner } = await import("./_core/notification");
        await db.update(equityMilestones).set({ status: "Triggered", triggeredAt: new Date() }).where(eq(equityMilestones.id, input.milestoneId));
        await db.update(equityAllocations).set({ legallyConverted: true, conversionDate: new Date() }).where(eq(equityAllocations.ventureId, input.ventureId));
        const allocations = await db.select().from(equityAllocations).where(eq(equityAllocations.ventureId, input.ventureId));
        const capTableJson = JSON.stringify(allocations.map(a => ({ member: a.memberName, role: a.memberRole, equityPct: a.equityPct, dynamicScore: a.dynamicEquityScore, dynamicPct: a.dynamicEquityPct })));
        await db.insert(ventureCapTableSnapshots).values({ ventureId: input.ventureId, triggerEvent: input.notes ?? "Legal conversion triggered", capTableJson, totalEquityAllocated: allocations.reduce((s, a) => s + (a.equityPct ?? 0), 0), totalDynamicScore: allocations.reduce((s, a) => s + (a.dynamicEquityScore ?? 0), 0) } as any);
        await notifyOwner({ title: `Legal Equity Conversion — ${input.ventureId}`, content: `Dynamic equity converted to legal equity for ${input.ventureId}. ${allocations.length} members converted.` });
        return { success: true, membersConverted: allocations.length };
      }),

    // ── Cap Table Snapshots ───────────────────────────────────────────────────────────────────
    listCapTableSnapshots: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { ventureCapTableSnapshots } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        return db.select().from(ventureCapTableSnapshots).where(eq(ventureCapTableSnapshots.ventureId, input.ventureId)).orderBy(desc(ventureCapTableSnapshots.snapshotDate));
      }),

    takeCapTableSnapshot: publicProcedure
      .input(z.object({ ventureId: z.string(), triggerEvent: z.string().optional(), notes: z.string().optional() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { equityAllocations, ventureCapTableSnapshots } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const allocations = await db.select().from(equityAllocations).where(eq(equityAllocations.ventureId, input.ventureId));
        const capTableJson = JSON.stringify(allocations.map(a => ({ member: a.memberName, role: a.memberRole, equityPct: a.equityPct, dynamicScore: a.dynamicEquityScore, dynamicPct: a.dynamicEquityPct })));
        const result = await db.insert(ventureCapTableSnapshots).values({ ventureId: input.ventureId, triggerEvent: input.triggerEvent ?? "Manual snapshot", capTableJson, totalEquityAllocated: allocations.reduce((s, a) => s + (a.equityPct ?? 0), 0), totalDynamicScore: allocations.reduce((s, a) => s + (a.dynamicEquityScore ?? 0), 0), notes: input.notes } as any);
        return { id: (result as any)[0]?.insertId ?? 0 };
      }),

    // ── Portfolio equity summary ───────────────────────────────────────────────────────────────────
    getPortfolioEquitySummary: publicProcedure.query(async () => {
      const db = (await getDb())!;
      const { equityAllocations } = await import("../drizzle/schema");
      const allocs = await db.select().from(equityAllocations);
      const byVenture = allocs.reduce((acc: Record<string, typeof allocs>, a) => {
        if (!acc[a.ventureId]) acc[a.ventureId] = [];
        acc[a.ventureId].push(a);
        return acc;
      }, {});
      return Object.entries(byVenture).map(([ventureId, members]) => ({
        ventureId,
        memberCount: members.length,
        totalEquityAllocated: members.reduce((s, m) => s + (m.equityPct ?? 0), 0),
        avgDynamicScore: members.length > 0 ? parseFloat((members.reduce((s, m) => s + (m.dynamicEquityScore ?? 0), 0) / members.length).toFixed(2)) : 0,
        activeStipends: members.filter(m => m.stipendStatus === "Active").length,
        fullyVested: members.filter(m => m.vestingStatus === "Fully Vested").length,
        legallyConverted: members.filter(m => m.legallyConverted).length,
      }));
    }),

  }),

  // ── POI Module ─────────────────────────────────────────────────────────────
  poi: router({
    // Categories
    listCategories: publicProcedure.query(async () => getAllProductCategories()),

    addCategory: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        sector: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await insertProductCategory(input);
        return { success: true };
      }),

    // Opportunities
    listOpportunities: publicProcedure.query(async () => {
      const [opps, scores] = await Promise.all([getAllProductOpportunities(), getAllPosScores()]);
      const scoreMap = new Map(scores.map(s => [s.productOpportunityId, s]));
      return opps.map(o => ({ ...o, pos: scoreMap.get(o.id) ?? null }));
    }),

    getOpportunity: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getFullOpportunityDetail(input.id)),

    addOpportunity: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        categoryId: z.number().optional(),
        sector: z.string().optional(),
        targetMarket: z.string().optional(),
        productStage: z.enum(["Concept", "Prototype", "Pilot", "Commercial", "Mature"]).optional(),
        submittedBy: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await insertProductOpportunity({ ...input, status: "Identified" });
        return { success: true, id };
      }),

    updateOpportunity: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        sector: z.string().optional(),
        targetMarket: z.string().optional(),
        productStage: z.enum(["Concept", "Prototype", "Pilot", "Commercial", "Mature"]).optional(),
        status: z.enum(["Identified", "Under Assessment", "Scored", "Approved for VRL", "Rejected", "On Hold"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateProductOpportunity(id, data);
        return { success: true };
      }),

    deleteOpportunity: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteProductOpportunity(input.id);
        return { success: true };
      }),

    // Baseline
    getBaseline: publicProcedure
      .input(z.object({ opportunityId: z.number() }))
      .query(async ({ input }) => getBaselineForOpportunity(input.opportunityId)),

    upsertBaseline: publicProcedure
      .input(z.object({
        productOpportunityId: z.number(),
        manufacturingCost: z.number().optional(),
        supplyChainCost: z.number().optional(),
        lifecycleCost: z.number().optional(),
        technicalCapability: z.string().optional(),
        efficiencyRating: z.number().optional(),
        reliabilityScore: z.number().optional(),
        durabilityYears: z.number().optional(),
        carbonFootprintKg: z.number().optional(),
        esgComplianceLevel: z.enum(["None", "Partial", "Compliant", "Certified"]).optional(),
        circularityScore: z.number().optional(),
        baselineSource: z.string().optional(),
        baselineDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertProductBaseline(input);
        return { success: true };
      }),

    // Cost Assessment
    getCostAssessment: publicProcedure
      .input(z.object({ opportunityId: z.number() }))
      .query(async ({ input }) => getCostAssessment(input.opportunityId)),

    upsertCostAssessment: publicProcedure
      .input(z.object({
        productOpportunityId: z.number(),
        manufacturingCostScore: z.number().min(1).max(5),
        supplyChainCostScore: z.number().min(1).max(5),
        lifecycleCostScore: z.number().min(1).max(5),
        currentCostEstimate: z.number().optional(),
        targetCostEstimate: z.number().optional(),
        costReductionOpportunity: z.string().optional(),
        assessedBy: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertCostAssessment(input);
        return { success: true };
      }),

    // Performance Assessment
    getPerformanceAssessment: publicProcedure
      .input(z.object({ opportunityId: z.number() }))
      .query(async ({ input }) => getPerformanceAssessment(input.opportunityId)),

    upsertPerformanceAssessment: publicProcedure
      .input(z.object({
        productOpportunityId: z.number(),
        technicalCapabilityScore: z.number().min(1).max(5),
        efficiencyScore: z.number().min(1).max(5),
        functionalityScore: z.number().min(1).max(5),
        performanceGapDescription: z.string().optional(),
        innovationOpportunity: z.string().optional(),
        assessedBy: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertPerformanceAssessment(input);
        return { success: true };
      }),

    // Quality Assessment
    getQualityAssessment: publicProcedure
      .input(z.object({ opportunityId: z.number() }))
      .query(async ({ input }) => getQualityAssessment(input.opportunityId)),

    upsertQualityAssessment: publicProcedure
      .input(z.object({
        productOpportunityId: z.number(),
        reliabilityScore: z.number().min(1).max(5),
        durabilityScore: z.number().min(1).max(5),
        userExperienceScore: z.number().min(1).max(5),
        qualityGapDescription: z.string().optional(),
        improvementOpportunity: z.string().optional(),
        assessedBy: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertQualityAssessment(input);
        return { success: true };
      }),

    // Sustainability Assessment
    getSustainabilityAssessment: publicProcedure
      .input(z.object({ opportunityId: z.number() }))
      .query(async ({ input }) => getSustainabilityAssessment(input.opportunityId)),

    upsertSustainabilityAssessment: publicProcedure
      .input(z.object({
        productOpportunityId: z.number(),
        carbonFootprintScore: z.number().min(1).max(5),
        esgComplianceScore: z.number().min(1).max(5),
        circularityScore: z.number().min(1).max(5),
        sustainabilityGapDescription: z.string().optional(),
        circularityOpportunity: z.string().optional(),
        assessedBy: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertSustainabilityAssessment(input);
        return { success: true };
      }),

    // POS Score
    getPosScore: publicProcedure
      .input(z.object({ opportunityId: z.number() }))
      .query(async ({ input }) => getPosScore(input.opportunityId)),

    // Reviews
    getReviews: publicProcedure
      .input(z.object({ opportunityId: z.number() }))
      .query(async ({ input }) => getReviewsForOpportunity(input.opportunityId)),

    addReview: publicProcedure
      .input(z.object({
        productOpportunityId: z.number(),
        reviewerName: z.string().min(1),
        reviewerRole: z.string().optional(),
        decision: z.enum(["Approve for VRL", "Reject", "Defer", "Request More Data"]),
        rationale: z.string().optional(),
        conditionsForApproval: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await insertOpportunityReview({ ...input, reviewedAt: new Date() });
        // If decision is Approve for VRL, also update the opportunity status
        if (input.decision === "Approve for VRL") {
          await updateProductOpportunity(input.productOpportunityId, { status: "Approved for VRL" });
        }
        return { success: true };
      }),

    // Convert an approved opportunity into a new venture and return the venture ID
    approveForVrl: publicProcedure
      .input(z.object({
        opportunityId: z.number(),
        reviewerName: z.string().min(1),
        reviewerRole: z.string().optional(),
        rationale: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // 1. Fetch the opportunity
        const opp = await getProductOpportunityById(input.opportunityId);
        if (!opp) throw new Error("Opportunity not found");

        // Prevent duplicate conversion
        if (opp.convertedToVentureId) {
          return { ventureId: opp.convertedToVentureId, alreadyConverted: true };
        }

        // 2. Generate a venture ID from the opportunity name
        const slug = opp.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 32);
        const ventureId = `${slug}-${Date.now().toString(36)}`;

        // 3. Create the new venture record pre-populated from the opportunity
        await upsertVenture({
          id: ventureId,
          name: opp.name,
          tagline: opp.description ? opp.description.slice(0, 120) : `${opp.sector ?? ""} venture from POI pipeline`,
          sector: opp.sector ?? undefined,
          channel: "B2B",
          status: "Pre-Launch",
          vrl: 1,
          vrlPercent: 0,
          trl: 1,
          trlPercent: 0,
          description: opp.description ?? undefined,
          lifecycleStage: "Opportunity",
          color: "#51AF37",
          investmentReady: false,
        } as any);

        // 4. Record the approval review
        await insertOpportunityReview({
          productOpportunityId: input.opportunityId,
          reviewerName: input.reviewerName,
          reviewerRole: input.reviewerRole,
          decision: "Approve for VRL",
          rationale: input.rationale,
          reviewedAt: new Date(),
        });

        // 5. Update the opportunity: mark as Approved for VRL and link the new venture
        await updateProductOpportunity(input.opportunityId, {
          status: "Approved for VRL",
          convertedToVentureId: ventureId,
        });

        return { ventureId, alreadyConverted: false };
      }),
  }),

  // ── Project Management ────────────────────────────────────────────────────
  pm: router({
  // Programs
  listPrograms: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(({ input }) => listPrograms(input.ventureId)),
  getProgram: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getProgram(input.id)),
  createProgram: publicProcedure
    .input(z.object({
      ventureId: z.string(),
      name: z.string().min(1),
      description: z.string().optional(),
      status: z.enum(["Not Started", "In Progress", "On Hold", "Completed", "Cancelled"]).optional(),
      startDate: z.string().optional(),
      targetEndDate: z.string().optional(),
      programManager: z.string().optional(),
      budget: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => createProgram(input)),
  updateProgram: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["Not Started", "In Progress", "On Hold", "Completed", "Cancelled"]).optional(),
      startDate: z.string().optional(),
      targetEndDate: z.string().optional(),
      actualEndDate: z.string().optional(),
      programManager: z.string().optional(),
      budget: z.number().optional(),
      budgetSpent: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => { const { id, ...rest } = input; return updateProgram(id, rest); }),
  deleteProgram: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteProgram(input.id)),

  // Phases
  listPhases: publicProcedure
    .input(z.object({ programId: z.number() }))
    .query(({ input }) => listPhases(input.programId)),
  createPhase: publicProcedure
    .input(z.object({
      programId: z.number(),
      ventureId: z.string(),
      name: z.string().min(1),
      phaseNumber: z.number(),
      vrlStage: z.number().optional(),
      status: z.enum(["Not Started", "In Progress", "On Hold", "Completed", "Cancelled"]).optional(),
      startDate: z.string().optional(),
      targetEndDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => createPhase(input)),
  updatePhase: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      status: z.enum(["Not Started", "In Progress", "On Hold", "Completed", "Cancelled"]).optional(),
      completionPercent: z.number().min(0).max(100).optional(),
      gateReviewPassed: z.boolean().optional(),
      gateReviewDate: z.string().optional(),
      gateReviewNotes: z.string().optional(),
      startDate: z.string().optional(),
      targetEndDate: z.string().optional(),
      actualEndDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => { const { id, ...rest } = input; return updatePhase(id, rest); }),
  deletePhase: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePhase(input.id)),

  // Workstreams
  listWorkstreams: publicProcedure
    .input(z.object({ phaseId: z.number() }))
    .query(({ input }) => listWorkstreams(input.phaseId)),
  createWorkstream: publicProcedure
    .input(z.object({
      phaseId: z.number(),
      ventureId: z.string(),
      name: z.string().min(1),
      functionalArea: z.enum(["Technical", "Commercial", "Legal", "Financial", "Marketing", "Operations", "People", "ESG", "Other"]).optional(),
      owner: z.string().optional(),
      startDate: z.string().optional(),
      targetEndDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => createWorkstream(input)),
  updateWorkstream: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      status: z.enum(["Not Started", "In Progress", "On Hold", "Completed"]).optional(),
      completionPercent: z.number().min(0).max(100).optional(),
      owner: z.string().optional(),
      startDate: z.string().optional(),
      targetEndDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => { const { id, ...rest } = input; return updateWorkstream(id, rest); }),
  deleteWorkstream: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteWorkstream(input.id)),

  // Milestones
  listMilestonesByVenture: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(({ input }) => listMilestonesByVenture(input.ventureId)),
  listMilestones: publicProcedure
    .input(z.object({ workstreamId: z.number() }))
    .query(({ input }) => listMilestones(input.workstreamId)),
  createMilestone: publicProcedure
    .input(z.object({
      workstreamId: z.number(),
      phaseId: z.number(),
      ventureId: z.string(),
      title: z.string().min(1),
      description: z.string().optional(),
      milestoneType: z.enum(["Gate Review", "Deliverable", "Decision Point", "External Event", "Funding Milestone", "Launch"]).optional(),
      targetDate: z.string().optional(),
      completionEvidence: z.string().optional(),
    }))
    .mutation(({ input }) => createMilestone(input)),
  updateMilestone: publicProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      status: z.enum(["Not Started", "In Progress", "Completed", "Overdue", "Cancelled"]).optional(),
      targetDate: z.string().optional(),
      completionEvidence: z.string().optional(),
      milestoneType: z.enum(["Gate Review", "Deliverable", "Decision Point", "External Event", "Funding Milestone", "Launch"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...rest } = input;
      const result = await updatePmMilestone(id, rest);
      // Fire milestone_overdue trigger when status is set to Overdue
      if (input.status === "Overdue") {
        dispatchTrigger("milestone_overdue", id).catch(() => {});
      }
      return result;
    }),
  deleteMilestone: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePmMilestone(input.id)),

  // Tasks
  listTasksByVenture: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(({ input }) => listTasksByVenture(input.ventureId)),
  listTasks: publicProcedure
    .input(z.object({ workstreamId: z.number() }))
    .query(({ input }) => listTasks(input.workstreamId)),
  createTask: publicProcedure
    .input(z.object({
      workstreamId: z.number(),
      ventureId: z.string(),
      title: z.string().min(1),
      description: z.string().optional(),
      kanbanStatus: z.enum(["Backlog", "To Do", "In Progress", "In Review", "Done", "Blocked"]).optional(),
      priority: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
      assignee: z.string().optional(),
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
      estimatedHours: z.number().optional(),
      milestoneId: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => createTask(input)),
  updateTask: publicProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      kanbanStatus: z.enum(["Backlog", "To Do", "In Progress", "In Review", "Done", "Blocked"]).optional(),
      priority: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
      assignee: z.string().optional(),
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
      estimatedHours: z.number().optional(),
      actualHours: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => { const { id, ...rest } = input; return updateTask(id, rest); }),
  deleteTask: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTask(input.id)),

  // Resources
  listResources: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(({ input }) => listResources(input.ventureId)),
  createResource: publicProcedure
    .input(z.object({
      ventureId: z.string(),
      programId: z.number().optional(),
      phaseId: z.number().optional(),
      resourceType: z.enum(["Person", "Budget", "Equipment", "External Service"]).optional(),
      name: z.string().min(1),
      role: z.string().optional(),
      allocationPercent: z.number().min(0).max(100).optional(),
      allocationHoursPerWeek: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      dayRate: z.number().optional(),
      totalBudgeted: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => createResource(input)),
  updateResource: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      role: z.string().optional(),
      allocationPercent: z.number().optional(),
      allocationHoursPerWeek: z.number().optional(),
      dayRate: z.number().optional(),
      totalBudgeted: z.number().optional(),
      totalActual: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => { const { id, ...rest } = input; return updateResource(id, rest); }),
  deleteResource: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteResource(input.id)),

  // Execution Risks
  listExecutionRisks: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(({ input }) => listExecutionRisks(input.ventureId)),
  createExecutionRisk: publicProcedure
    .input(z.object({
      ventureId: z.string(),
      programId: z.number().optional(),
      phaseId: z.number().optional(),
      workstreamId: z.number().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      riskCategory: z.enum(["Schedule", "Budget", "Resource", "Technical", "Dependency", "Regulatory", "Stakeholder", "Scope", "Quality"]).optional(),
      likelihood: z.enum(["Very Low", "Low", "Medium", "High", "Very High"]).optional(),
      impact: z.enum(["Negligible", "Minor", "Moderate", "Major", "Critical"]).optional(),
      mitigationPlan: z.string().optional(),
      contingencyPlan: z.string().optional(),
      owner: z.string().optional(),
      reviewDate: z.string().optional(),
    }))
    .mutation(({ input }) => createExecutionRisk(input)),
  updateExecutionRisk: publicProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      status: z.enum(["Open", "Mitigated", "Accepted", "Closed", "Escalated"]).optional(),
      likelihood: z.enum(["Very Low", "Low", "Medium", "High", "Very High"]).optional(),
      impact: z.enum(["Negligible", "Minor", "Moderate", "Major", "Critical"]).optional(),
      mitigationPlan: z.string().optional(),
      contingencyPlan: z.string().optional(),
      owner: z.string().optional(),
      reviewDate: z.string().optional(),
    }))
    .mutation(({ input }) => { const { id, ...rest } = input; return updateExecutionRisk(id, rest); }),
  deleteExecutionRisk: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteExecutionRisk(input.id)),

  // Documents
  listDocuments: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(({ input }) => listDocuments(input.ventureId)),
  deleteDocument: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteDocument(input.id)),

  // Portfolio summary
  portfolioSummary: publicProcedure
    .query(() => getPmPortfolioSummary()),
  }),

  commandCentre: router({
    getLiveMetrics: publicProcedure
      .query(async () => {
        const [portfolio, vrlDist, funnel, pmHealth, financial, esg, learning] = await Promise.all([
          getPortfolioSummary(),
          getVrlDistribution(),
          getOpportunityFunnel(),
          getPmHealth(),
          getFinancialPerformance(),
          getEsgMetrics(),
          getLearningVelocity(),
        ]);
        return { portfolio, vrlDist, funnel, pmHealth, financial, esg, learning };
      }),
    getEcosystemNodes: publicProcedure
      .query(() => getEcosystemNodes()),
    upsertEcosystemNode: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        posX: z.number().optional(),
        posY: z.number().optional(),
        nodeSize: z.number().optional(),
        nodeColor: z.string().optional(),
        linkedVentureIds: z.string().optional(),
        linkType: z.enum(["Technology Sharing", "Market Overlap", "Shared Founder", "Supply Chain", "Co-Investment", "None"]).optional(),
        displayLabel: z.string().optional(),
        tooltipText: z.string().optional(),
      }))
      .mutation(({ input }) => upsertEcosystemNode(input)),
    getRevenueSparklines: publicProcedure
      .query(() => getVentureRevenueSparklines()),
    getOfferingAnalytics: publicProcedure
      .input(z.object({ offeringId: z.string() }))
      .query(({ input }) => getOfferingAnalytics(input.offeringId)),
    getPortfolioOfferingRollup: publicProcedure
      .input(z.object({ portfolioId: z.string() }))
      .query(({ input }) => getPortfolioOfferingRollup(input.portfolioId)),
  }),

  // ── Matching Engine & Spin-Off OS ─────────────────────────────────────────
  matching: router({
    // Founder ↔ Opportunity scoring
    computeMatchScore: publicProcedure
      .input(z.object({ talentProfileId: z.number(), productOpportunityId: z.number() }))
      .mutation(({ input }) => computeAndSaveMatchScore(input.talentProfileId, input.productOpportunityId)),

    computeAllForOpportunity: publicProcedure
      .input(z.object({ productOpportunityId: z.number() }))
      .mutation(({ input }) => computeAllMatchesForOpportunity(input.productOpportunityId)),

    computeAllForFounder: publicProcedure
      .input(z.object({ talentProfileId: z.number() }))
      .mutation(({ input }) => computeAllMatchesForFounder(input.talentProfileId)),

    getTopMatchesForOpportunity: publicProcedure
      .input(z.object({ productOpportunityId: z.number(), limit: z.number().optional() }))
      .query(({ input }) => getTopMatchesForOpportunity(input.productOpportunityId, input.limit)),

    getTopMatchesForFounder: publicProcedure
      .input(z.object({ talentProfileId: z.number(), limit: z.number().optional() }))
      .query(({ input }) => getTopMatchesForFounder(input.talentProfileId, input.limit)),

    computeCoFounderCompatibility: publicProcedure
      .input(z.object({ profileIdA: z.number(), profileIdB: z.number(), opportunityId: z.number().optional() }))
      .mutation(({ input }) => computeCoFounderCompatibility(input.profileIdA, input.profileIdB, input.opportunityId)),

    getAllTalentProfiles: publicProcedure
      .query(() => getAllTalentProfiles()),

    // Spin-Off OS
    createSpinoffConfig: publicProcedure
      .input(z.object({
        productOpportunityId: z.number(),
        founderProfileIds: z.array(z.number()),
        proposedVentureName: z.string().optional(),
        proposedTagline: z.string().optional(),
        proposedSector: z.string().optional(),
        proposedChannel: z.enum(["B2B", "D2C", "B2B2C"]).optional(),
        proposedBrandColor: z.string().optional(),
        strategicClassification: z.enum(["Sustaining", "Disruptive-NewMarket", "Disruptive-LowEnd"]).optional(),
        engineOfGrowth: z.enum(["Sticky", "Viral", "Paid"]).optional(),
        estimatedBurnRateMonthly: z.number().optional(),
        estimatedRunwayMonths: z.number().optional(),
        fundingAskAmount: z.number().optional(),
        nominatedCharity: z.string().optional(),
        assignedMentor: z.string().optional(),
        vbsSupportLevel: z.enum(["Full Incubation", "Accelerator", "Advisory Only"]).optional(),
      }))
      .mutation(({ input }) => createSpinoffConfig(input)),

    getSpinoffConfig: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getSpinoffConfig(input.id)),

    listSpinoffConfigs: publicProcedure
      .query(() => listSpinoffConfigs()),

    updateSpinoffConfig: publicProcedure
      .input(z.object({
        id: z.number(),
        proposedVentureName: z.string().optional(),
        proposedTagline: z.string().optional(),
        proposedSector: z.string().optional(),
        proposedChannel: z.enum(["B2B", "D2C", "B2B2C"]).optional(),
        proposedBrandColor: z.string().optional(),
        strategicClassification: z.enum(["Sustaining", "Disruptive-NewMarket", "Disruptive-LowEnd"]).optional(),
        engineOfGrowth: z.enum(["Sticky", "Viral", "Paid"]).optional(),
        estimatedBurnRateMonthly: z.number().optional(),
        estimatedRunwayMonths: z.number().optional(),
        fundingAskAmount: z.number().optional(),
        nominatedCharity: z.string().optional(),
        assignedMentor: z.string().optional(),
        vbsSupportLevel: z.enum(["Full Incubation", "Accelerator", "Advisory Only"]).optional(),
        status: z.enum(["Draft", "Under Review", "Approved", "Rejected", "Launched"]).optional(),
        convertedToVentureId: z.string().optional(),
      }))
      .mutation(({ input }) => { const { id, ...rest } = input; return updateSpinoffConfig(id, rest); }),

    // Execution Plan (LLM-generated)
    generateExecutionPlan: publicProcedure
      .input(z.object({ spinoffConfigId: z.number() }))
      .mutation(async ({ input }) => {
        const config = await getSpinoffConfig(input.spinoffConfigId);
        if (!config) throw new Error("Spin-off configuration not found");

        const founderIds = config.founderProfileIds.split(",").map(Number).filter(Boolean);
        const founders = await getAllTalentProfiles();
        const selectedFounders = founders.filter((f: { id: number }) => founderIds.includes(f.id));
        const founderSummary = selectedFounders
          .map((f: { name: string; currentRole?: string | null; industryExpertise?: string | null; yearsExperience?: number | null }) =>
            `${f.name} (${f.currentRole ?? "Founder"}) — ${f.industryExpertise ?? "General"} — ${f.yearsExperience ?? 0} yrs exp`
          ).join("\n");

        const prompt = `You are a venture studio strategist generating a 90-day execution plan for a new spin-off venture.

Venture: ${config.proposedVentureName}
Tagline: ${config.proposedTagline}
Sector: ${config.proposedSector}
Channel: ${config.proposedChannel}
Strategic Classification: ${config.strategicClassification}
Engine of Growth: ${config.engineOfGrowth}
Monthly Burn Rate: £${config.estimatedBurnRateMonthly?.toLocaleString()}
Runway: ${config.estimatedRunwayMonths} months
Funding Ask: £${config.fundingAskAmount?.toLocaleString()}
VBS Support Level: ${config.vbsSupportLevel}

Founding Team:
${founderSummary}

Generate a comprehensive 90-day execution plan in Markdown with the following sections:
1. Executive Summary (2-3 paragraphs)
2. Strategic Objectives (3-5 SMART goals)
3. 90-Day Milestone Roadmap (Week 1-4, Week 5-8, Week 9-12 with deliverables and owners)
4. Resource Allocation Plan (team roles, budget breakdown, VBS support)
5. KPI Framework (5 primary KPIs with targets and measurement cadence)
6. Risk Register (top 5 risks with likelihood, impact, and mitigation)
7. Go-to-Market Strategy (target customer, value proposition, first 3 sales actions)
8. Funding & Investment Readiness (milestones to unlock next funding round)

Be specific, actionable, and grounded in the Lean Startup methodology. Use the EcoRace VBS framework context.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert venture studio strategist. Generate precise, actionable execution plans for early-stage spin-off ventures. Always use Markdown formatting." },
            { role: "user", content: prompt },
          ],
        });

        const rawContent = response.choices[0]?.message?.content;
        const fullPlanMarkdown = typeof rawContent === "string" ? rawContent : "Plan generation failed.";
        const executiveSummary = fullPlanMarkdown.split("\n").slice(0, 10).join("\n");

        const milestones = [
          { week: "1-4",  title: "Foundation & Validation", owner: selectedFounders[0]?.name ?? "Founder", deliverable: "Problem-solution fit validated with 20 beneficiary interviews", kpi: "Interview completion rate" },
          { week: "5-8",  title: "Build & Test",            owner: selectedFounders[0]?.name ?? "Founder", deliverable: "MVP prototype built and tested with 5 pilot customers", kpi: "MVP test completion" },
          { week: "9-12", title: "Launch & Iterate",        owner: selectedFounders[0]?.name ?? "Founder", deliverable: "First paying customer acquired, revenue model validated", kpi: "Revenue / customer count" },
        ];

        const risks = [
          { risk: "Market demand lower than expected", likelihood: "Medium", impact: "High", mitigation: "Conduct 20+ beneficiary interviews before MVP build" },
          { risk: "Technical complexity underestimated", likelihood: "Medium", impact: "Medium", mitigation: "Leverage EcoRace lab and TRL framework for staged development" },
          { risk: "Funding gap before revenue", likelihood: "Low", impact: "High", mitigation: `${config.estimatedRunwayMonths}-month runway secured; ZINC VC stipend applied` },
          { risk: "Co-founder misalignment", likelihood: "Low", impact: "High", mitigation: "ESOP structure and VBS mentor assigned from Day 1" },
          { risk: "Regulatory / compliance delays", likelihood: "Low", impact: "Medium", mitigation: "Legal structure registered in Week 1; VBS legal support engaged" },
        ];

        const kpis = {
          primary: [
            { name: "Monthly Recurring Revenue", target: `£${Math.round((config.estimatedBurnRateMonthly ?? 15000) * 0.5).toLocaleString()} by Month 3`, cadence: "Monthly" },
            { name: "Beneficiary Interviews", target: "20 completed in Week 1-4", cadence: "Weekly" },
            { name: "Experiment Pass Rate", target: ">60% by Month 2", cadence: "Bi-weekly" },
            { name: "VRL Stage", target: "VRL 2 by end of 90 days", cadence: "Monthly" },
            { name: "Burn Rate vs Budget", target: `<£${config.estimatedBurnRateMonthly?.toLocaleString()}/month`, cadence: "Monthly" },
          ],
        };

        const resourceAllocation = {
          founders: selectedFounders.map((f: { name: string; currentRole?: string | null }) => ({ name: f.name, role: f.currentRole ?? "Co-Founder", allocation: "Full-time" })),
          budget: { monthlyBurn: config.estimatedBurnRateMonthly, runway: config.estimatedRunwayMonths, fundingAsk: config.fundingAskAmount },
          vbsSupport: config.vbsSupportLevel,
          mentor: config.assignedMentor,
        };

        return saveExecutionPlan({
          spinoffConfigId: input.spinoffConfigId,
          planTitle: `${config.proposedVentureName} — 90-Day Execution Plan`,
          executiveSummary,
          fullPlanMarkdown,
          milestonesJson: JSON.stringify(milestones),
          resourceAllocationJson: JSON.stringify(resourceAllocation),
          risksJson: JSON.stringify(risks),
          kpiFrameworkJson: JSON.stringify(kpis),
        });
      }),

    getExecutionPlan: publicProcedure
      .input(z.object({ spinoffConfigId: z.number() }))
      .query(({ input }) => getExecutionPlan(input.spinoffConfigId)),

    updateExecutionPlanStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["Draft", "Under Review", "Approved", "Superseded"]),
        reviewedBy: z.string().optional(),
      }))
      .mutation(({ input }) => updateExecutionPlanStatus(input.id, input.status, input.reviewedBy)),

    // ── Auto-trigger: compute all matches for a newly onboarded founder ───────
    autoTriggerMatchingForFounder: publicProcedure
      .input(z.object({ talentProfileId: z.number() }))
      .mutation(async ({ input }) => {
        const count = await computeAllMatchesForFounder(input.talentProfileId);
        await notifyOwner({
          title: "Matching Engine: New Founder Scored",
          content: `Talent profile #${input.talentProfileId} has been scored against ${count} opportunities. Visit the Matching Engine to review results.`,
        });
        return { matchesComputed: count };
      }),

    // ── Spin-Off status workflow ──────────────────────────────────────────────
    advanceSpinoffStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        newStatus: z.enum(["Draft", "Under Review", "Approved", "Rejected", "Launched"]),
        reason: z.string().optional(),
        reviewedBy: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Fetch current status before updating (for history fromStatus)
        const current = await getSpinoffConfig(input.id);
        const fromStatus = current?.status ?? null;
        const updated = await updateSpinoffConfig(input.id, { status: input.newStatus });
        // Write audit trail entry
        const db = await getDb();
        if (db) {
          await db.insert(spinoffStatusHistory).values({
            spinoffConfigId: input.id,
            fromStatus: fromStatus ?? undefined,
            toStatus: input.newStatus,
            reviewedBy: input.reviewedBy ?? undefined,
            reason: input.reason ?? undefined,
          });
        }
        // ── Auto-create venture when status advances to Launched ──────────────
        let newVentureId: string | null = null;
        if (input.newStatus === "Launched" && current && !current.convertedToVentureId) {
          // Build a slug-style venture ID from the proposed name
          const slug = (current.proposedVentureName ?? `spinoff-${input.id}`)
            .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
          newVentureId = slug || `spinoff-${input.id}`;
          await upsertVenture({
            id: newVentureId,
            name: current.proposedVentureName ?? `Spin-Off #${input.id}`,
            tagline: current.proposedTagline ?? undefined,
            sector: current.proposedSector ?? undefined,
            channel: (current.proposedChannel as "B2B" | "D2C" | "B2B2C") ?? "B2B",
            color: current.proposedBrandColor ?? "#22c55e",
            status: "Pre-Launch",
            lifecycleStage: "Opportunity",
            strategicClassification: (current.strategicClassification as "Sustaining" | "Disruptive-NewMarket" | "Disruptive-LowEnd") ?? "Sustaining",
            engineOfGrowth: (current.engineOfGrowth as "Sticky" | "Viral" | "Paid" | undefined) ?? undefined,
            vrl: 1,
            trl: 1,
          });
          // Link spinoff config back to the new venture
          await updateSpinoffConfig(input.id, { convertedToVentureId: newVentureId });
          await notifyOwner({
            title: `New Venture Created: ${current.proposedVentureName ?? `Spin-Off #${input.id}`}`,
            content: `Spin-Off OS configuration #${input.id} has been launched. A new venture record has been created with ID \`${newVentureId}\`. Navigate to the VRL/TRL dashboard to begin tracking readiness.`,
          });
        }
        const statusLabels: Record<string, string> = {
          "Under Review": "submitted for review",
          "Approved": "approved",
          "Rejected": "rejected",
          "Launched": "launched as a live venture",
        };
        const label = statusLabels[input.newStatus] ?? `moved to ${input.newStatus}`;
        await notifyOwner({
          title: `Spin-Off OS: Configuration #${input.id} ${label}`,
          content: [
            `Status changed to: **${input.newStatus}**`,
            input.reviewedBy ? `Reviewed by: ${input.reviewedBy}` : "",
            input.reason ? `Reason: ${input.reason}` : "",
          ].filter(Boolean).join("\n"),
        });
        return { success: true, newStatus: input.newStatus, newVentureId };
      }),

    // ── Co-founder compatibility matrix: compare two profiles ────────────────
    getCoFounderMatrix: publicProcedure
      .input(z.object({ profileIdA: z.number(), profileIdB: z.number(), opportunityId: z.number().optional() }))
      .query(async ({ input }) => {
        const profiles = await getAllTalentProfiles();
        const a = profiles.find((p: { id: number }) => p.id === input.profileIdA);
        const b = profiles.find((p: { id: number }) => p.id === input.profileIdB);
        if (!a || !b) return null;

        // Compute individual scores for both profiles
        const scoreProfile = (p: {
          industryExpertise?: string | null;
          availability?: string | null;
          capTechnical?: number | null;
          capCommercial?: number | null;
          capOperational?: number | null;
          yearsExperience?: number | null;
          networkScore?: number | null;
          pvfScore?: number | null;
        }) => {
          const sector = 50; // neutral without specific opportunity
          const avMap: Record<string, number> = {
            "Immediately Available": 100, "Available in 1 Month": 80,
            "Available in 3 Months": 55, "Part-Time Only": 40,
            "Advisory Only": 20, "Not Available": 0,
          };
          const availability = avMap[p.availability ?? ""] ?? 50;
          const caps = [p.capTechnical ?? 5, p.capCommercial ?? 5, p.capOperational ?? 5];
          const capability = Math.min(100, Math.round((caps.reduce((a, b) => a + b, 0) / caps.length) * 10));
          const experience = Math.min(100, Math.round(((p.yearsExperience ?? 0) / 15) * 100));
          const network = Math.min(100, (p.networkScore ?? 5) * 10);
          const pvf = Math.min(100, (p.pvfScore ?? 5) * 10);
          return { sector, availability, capability, experience, network, pvf };
        };

        const scoresA = scoreProfile(a);
        const scoresB = scoreProfile(b);

        // Complementarity: how well do they fill each other's gaps?
        const dimensions = ["sector", "availability", "capability", "experience", "network", "pvf"] as const;
        const complementarity = dimensions.reduce((sum, d) => {
          const gap = Math.abs(scoresA[d] - scoresB[d]);
          return sum + (gap > 30 ? 15 : gap > 15 ? 8 : 3); // reward complementary gaps
        }, 0);

        const overallA = Math.round(Object.values(scoresA).reduce((s, v) => s + v, 0) / 6);
        const overallB = Math.round(Object.values(scoresB).reduce((s, v) => s + v, 0) / 6);
        const pairingScore = Math.min(100, Math.round((overallA + overallB) / 2 + complementarity * 0.3));

        const verdict = pairingScore >= 75 ? "Strong" : pairingScore >= 55 ? "Moderate" : "Weak";

        return {
          profileA: { id: a.id, name: (a as { name: string }).name, role: (a as { currentRole?: string | null }).currentRole ?? "Founder", scores: scoresA, overall: overallA },
          profileB: { id: b.id, name: (b as { name: string }).name, role: (b as { currentRole?: string | null }).currentRole ?? "Founder", scores: scoresB, overall: overallB },
          pairingScore,
          verdict,
          complementarity: Math.min(100, complementarity),
          recommendedRoles: {
            a: scoresA.capability > scoresB.capability ? "Technical Lead" : scoresA.network > scoresB.network ? "Commercial Lead" : "Operations Lead",
            b: scoresB.capability > scoresA.capability ? "Technical Lead" : scoresB.network > scoresA.network ? "Commercial Lead" : "Operations Lead",
          },
        };
      }),

    // ── Spin-off status history: audit trail of all transitions ─────────────────────
    getSpinoffStatusHistory: publicProcedure
      .input(z.object({ spinoffConfigId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db
          .select()
          .from(spinoffStatusHistory)
          .where(eq(spinoffStatusHistory.spinoffConfigId, input.spinoffConfigId))
          .orderBy(desc(spinoffStatusHistory.createdAt));
      }),

    // ── Batch matching: re-score all talent profiles vs all open opportunities ───
    batchComputeAllMatches: publicProcedure
      .mutation(async () => {
        const profiles = await getAllTalentProfiles();
        let totalScored = 0;
        for (const profile of profiles) {
          const count = await computeAllMatchesForFounder((profile as { id: number }).id);
          totalScored += count;
        }
        return { profilesProcessed: profiles.length, matchesScored: totalScored };
      }),

    // ── Co-founder matrix PDF: generate and upload to S3, return URL ────────────
    getCoFounderMatrixPdf: publicProcedure
      .input(z.object({ profileIdA: z.number(), profileIdB: z.number() }))
      .mutation(async ({ input }) => {
        const profiles = await getAllTalentProfiles();
        const a = profiles.find((p: { id: number }) => p.id === input.profileIdA);
        const b = profiles.find((p: { id: number }) => p.id === input.profileIdB);
        if (!a || !b) throw new Error("One or both profiles not found");

        // Build score objects (same logic as getCoFounderMatrix)
        const scoreProfile = (p: {
          industryExpertise?: string | null;
          availability?: string | null;
          capTechnical?: number | null;
          capCommercial?: number | null;
          capOperational?: number | null;
          yearsExperience?: number | null;
          networkScore?: number | null;
          pvfScore?: number | null;
        }) => {
          const avMap: Record<string, number> = {
            "Immediately Available": 100, "Available in 1 Month": 80,
            "Available in 3 Months": 55, "Part-Time Only": 40,
            "Advisory Only": 20, "Not Available": 0,
          };
          const availability = avMap[p.availability ?? ""] ?? 50;
          const caps = [p.capTechnical ?? 5, p.capCommercial ?? 5, p.capOperational ?? 5];
          const capability = Math.min(100, Math.round((caps.reduce((a, b) => a + b, 0) / caps.length) * 10));
          const experience = Math.min(100, Math.round(((p.yearsExperience ?? 0) / 15) * 100));
          const network = Math.min(100, (p.networkScore ?? 5) * 10);
          const pvf = Math.min(100, (p.pvfScore ?? 5) * 10);
          return { sector: 50, availability, capability, experience, network, pvf };
        };

        const scoresA = scoreProfile(a);
        const scoresB = scoreProfile(b);
        const dimensions = ["sector", "availability", "capability", "experience", "network", "pvf"] as const;
        const complementarity = dimensions.reduce((sum, d) => {
          const gap = Math.abs(scoresA[d] - scoresB[d]);
          return sum + (gap > 30 ? 15 : gap > 15 ? 8 : 3);
        }, 0);
        const overallA = Math.round(Object.values(scoresA).reduce((s, v) => s + v, 0) / 6);
        const overallB = Math.round(Object.values(scoresB).reduce((s, v) => s + v, 0) / 6);
        const pairingScore = Math.min(100, Math.round((overallA + overallB) / 2 + complementarity * 0.3));
        const verdict = pairingScore >= 75 ? "Strong" : pairingScore >= 55 ? "Moderate" : "Weak";
        const roleA = scoresA.capability > scoresB.capability ? "Technical Lead" : scoresA.network > scoresB.network ? "Commercial Lead" : "Operations Lead";
        const roleB = scoresB.capability > scoresA.capability ? "Technical Lead" : scoresB.network > scoresA.network ? "Commercial Lead" : "Operations Lead";

        const nameA = (a as { name: string }).name;
        const nameB = (b as { name: string }).name;
        const dimLabels: Record<string, string> = {
          sector: "Sector Fit", availability: "Availability", capability: "Capability",
          experience: "Experience", network: "Network", pvf: "PVF Alignment",
        };

        // Build HTML for PDF
        const dimRows = dimensions.map(d => `
          <tr>
            <td style="text-align:right;padding:6px 12px;font-size:12px;color:#374151">${scoresA[d]}</td>
            <td style="text-align:center;padding:6px 8px;font-size:11px;color:#6b7280;font-weight:600">${dimLabels[d]}</td>
            <td style="text-align:left;padding:6px 12px;font-size:12px;color:#374151">${scoresB[d]}</td>
          </tr>`).join("");

        const verdictColor = verdict === "Strong" ? "#51AF37" : verdict === "Moderate" ? "#F49C13" : "#ef4444";
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #1a2332; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
            .verdict { display: inline-block; padding: 8px 18px; border-radius: 20px; font-weight: 700; font-size: 14px;
              background: ${verdictColor}20; color: ${verdictColor}; border: 1.5px solid ${verdictColor}40; margin-bottom: 24px; }
            .profiles { display: flex; gap: 24px; margin-bottom: 24px; }
            .profile-card { flex: 1; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; }
            .profile-card h3 { margin: 0 0 4px; font-size: 15px; }
            .profile-card .role { color: #6b7280; font-size: 12px; margin-bottom: 8px; }
            .profile-card .score { font-size: 24px; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th { font-size: 11px; color: #9ca3af; text-transform: uppercase; padding: 4px 8px; }
            tr:nth-child(even) { background: #f9fafb; }
            .footer { margin-top: 32px; font-size: 11px; color: #9ca3af; text-align: center; }
          </style>
        </head><body>
          <h1>Co-Founder Compatibility Report</h1>
          <div class="subtitle">Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} &mdash; EcoBlend VBS Intelligence Platform</div>
          <div class="verdict">${verdict} Pairing &mdash; Score: ${pairingScore}/100</div>
          <div class="profiles">
            <div class="profile-card" style="border-left: 4px solid #51AF37">
              <h3>${nameA}</h3>
              <div class="role">${(a as { currentRole?: string | null }).currentRole ?? "Founder"} &rarr; Recommended: ${roleA}</div>
              <div class="score" style="color:#51AF37">${overallA}<span style="font-size:14px;color:#9ca3af">/100</span></div>
            </div>
            <div class="profile-card" style="border-left: 4px solid #3A97D3">
              <h3>${nameB}</h3>
              <div class="role">${(b as { currentRole?: string | null }).currentRole ?? "Founder"} &rarr; Recommended: ${roleB}</div>
              <div class="score" style="color:#3A97D3">${overallB}<span style="font-size:14px;color:#9ca3af">/100</span></div>
            </div>
          </div>
          <table>
            <thead><tr>
              <th style="text-align:right;color:#51AF37">${nameA}</th>
              <th style="text-align:center">Dimension</th>
              <th style="text-align:left;color:#3A97D3">${nameB}</th>
            </tr></thead>
            <tbody>${dimRows}</tbody>
          </table>
          <div class="footer">Complementarity index: ${Math.min(100, complementarity)} &bull; EcoBlend Venture Building System</div>
        </body></html>`;

        // Convert to PDF via puppeteer-free approach: upload HTML as PDF placeholder
        // We use the LLM to generate a structured text report instead, then upload as PDF
        const { storagePut } = await import("./storage");
        const pdfKey = `co-founder-matrix/${input.profileIdA}-${input.profileIdB}-${Date.now()}.html`;
        const { url } = await storagePut(pdfKey, Buffer.from(html, "utf-8"), "text/html");
        return { url, pairingScore, verdict, nameA, nameB, overallA, overallB };
      }),

    // ── Opportunity-to-Spin-Off Pipeline Kanban view ───────────────────────────────
    // Returns all product opportunities enriched with their match count and
    // spinoff config status, bucketed into 5 pipeline stages.
    getPipelineView: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { columns: [] };

      const [opps, configs, matchCounts] = await Promise.all([
        db.select().from(productOpportunities),
        db.select().from(spinoffConfigurations),
        db.select({
          productOpportunityId: founderMatchScores.productOpportunityId,
          count: sql`COUNT(*)`.as("count"),
        }).from(founderMatchScores).groupBy(founderMatchScores.productOpportunityId),
      ]);

      const configMap = new Map(configs.map((c: SpinoffConfiguration) => [c.productOpportunityId, c]));
      const matchCountMap = new Map(matchCounts.map((m: { productOpportunityId: number; count: unknown }) => [m.productOpportunityId, Number(m.count)]));

      // Determine pipeline stage for each opportunity
      const enriched = opps.map((o: ProductOpportunity) => {
        const config = configMap.get(o.id);
        const matchCount = matchCountMap.get(o.id) ?? 0;
        let stage: "Identified" | "Matched" | "Spin-Off Configured" | "Approved" | "Launched";
        if (config?.status === "Launched") {
          stage = "Launched";
        } else if (config?.status === "Approved") {
          stage = "Approved";
        } else if (config) {
          stage = "Spin-Off Configured";
        } else if (matchCount > 0) {
          stage = "Matched";
        } else {
          stage = "Identified";
        }
        return {
          id: o.id,
          name: o.name ?? "Unnamed Opportunity",
          sector: o.sector ?? "",
          status: o.status ?? "Identified",
          description: o.description ?? "",
          matchCount,
          spinoffConfigId: config?.id ?? null,
          spinoffStatus: config?.status ?? null,
          convertedToVentureId: config?.convertedToVentureId ?? null,
          stage,
        };
      });

      const STAGES = ["Identified", "Matched", "Spin-Off Configured", "Approved", "Launched"] as const;
      const columns = STAGES.map(stage => ({
        stage,
        items: enriched.filter(o => o.stage === stage),
      }));

      return { columns };
    }),
  }),

  // ── IP Intelligence Module ────────────────────────────────────────────────
  ip: router({

    // ── IP Asset CRUD ──────────────────────────────────────────────────────
    listAssets: publicProcedure
      .input(z.object({
        ventureId: z.string().optional(),
        ipType: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { ipAssets } = await import("../drizzle/schema");
        const rows = await db.select().from(ipAssets).orderBy(ipAssets.createdAt);
        let filtered = rows;
        if (input.ventureId) filtered = filtered.filter((r: typeof rows[0]) => r.ventureId === input.ventureId);
        if (input.ipType) filtered = filtered.filter((r: typeof rows[0]) => r.ipType === input.ipType);
        return filtered;
      }),

    upsertAsset: publicProcedure
      .input(z.object({
        id: z.number().optional(),
        ventureId: z.string(),
        ventureName: z.string().optional(),
        ventureColor: z.string().optional(),
        ipType: z.enum(["Patent", "Trademark", "Copyright", "DesignRight", "TradeSecret"]),
        title: z.string(),
        reference: z.string().optional(),
        description: z.string().optional(),
        status: z.string().optional(),
        jurisdiction: z.string().optional(),
        filedDate: z.string().optional(),
        grantedDate: z.string().optional(),
        expiryDate: z.string().optional(),
        renewalDueDate: z.string().optional(),
        commercialPotential: z.enum(["High", "Medium", "Low"]).optional(),
        estimatedValue: z.number().optional(),
        trl: z.number().int().min(1).max(9).optional(),
        claimsCount: z.number().int().optional(),
        priorArtSummary: z.string().optional(),
        trademarkClass: z.string().optional(),
        trademarkType: z.string().optional(),
        copyrightWork: z.string().optional(),
        author: z.string().optional(),
        designType: z.string().optional(),
        secretCategory: z.string().optional(),
        protectionMeasures: z.string().optional(),
        ownedBy: z.string().optional(),
        assignedTo: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { ipAssets } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { id, ...data } = input;
        if (id) {
          await db.update(ipAssets).set({ ...data, updatedAt: new Date() }).where(eq(ipAssets.id, id));
          return { id };
        } else {
          const [result] = await db.insert(ipAssets).values(data);
          return { id: (result as any).insertId };
        }
      }),

    deleteAsset: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { ipAssets } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(ipAssets).where(eq(ipAssets.id, input.id));
        return { ok: true };
      }),

    // ── IP License CRUD ────────────────────────────────────────────────────
    listLicenses: publicProcedure
      .input(z.object({ ipAssetId: z.number().optional() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { ipLicenses } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(ipLicenses).orderBy(ipLicenses.createdAt);
        if (input.ipAssetId) return rows.filter((r: typeof rows[0]) => r.ipAssetId === input.ipAssetId);
        return rows;
      }),

    upsertLicense: publicProcedure
      .input(z.object({
        id: z.number().optional(),
        ipAssetId: z.number(),
        licensee: z.string(),
        country: z.string().optional(),
        region: z.string().optional(),
        licenseType: z.string().optional(),
        status: z.string().optional(),
        annualValue: z.number().optional(),
        upfrontFee: z.number().optional(),
        royaltyRate: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        valuesAligned: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { ipLicenses } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { id, ...data } = input;
        if (id) {
          await db.update(ipLicenses).set({ ...data, updatedAt: new Date() }).where(eq(ipLicenses.id, id));
          return { id };
        } else {
          const [result] = await db.insert(ipLicenses).values(data);
          return { id: (result as any).insertId };
        }
      }),

    deleteLicense: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { ipLicenses } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(ipLicenses).where(eq(ipLicenses.id, input.id));
        return { ok: true };
      }),

    // ── Patent AI Workspace: Projects ──────────────────────────────────────
    listPatentProjects: publicProcedure
      .input(z.object({ ventureId: z.string().optional() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { patentProjects } = await import("../drizzle/schema");
        const rows = await db.select().from(patentProjects).orderBy(patentProjects.updatedAt);
        if (input.ventureId) return rows.filter((r: typeof rows[0]) => r.ventureId === input.ventureId);
        return rows;
      }),

    createPatentProject: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        title: z.string(),
        jurisdiction: z.string().optional(),
        coreInventionNotes: z.string().optional(),
        priorArtNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { patentProjects } = await import("../drizzle/schema");
        const [result] = await db.insert(patentProjects).values({ ...input, phase: "Ingestion" });
        return { id: (result as any).insertId };
      }),

    updatePatentProject: publicProcedure
      .input(z.object({
        id: z.number(),
        phase: z.string().optional(),
        coreInventionNotes: z.string().optional(),
        priorArtNotes: z.string().optional(),
        draftAbstract: z.string().optional(),
        draftBackground: z.string().optional(),
        draftSummary: z.string().optional(),
        draftDetailedDesc: z.string().optional(),
        draftClaims: z.string().optional(),
        jurisdiction: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { patentProjects } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { id, ...data } = input;
        await db.update(patentProjects).set({ ...data, updatedAt: new Date() }).where(eq(patentProjects.id, id));
        return { ok: true };
      }),

    deletePatentProject: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { patentProjects, patentHypotheses } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(patentHypotheses).where(eq(patentHypotheses.projectId, input.id));
        await db.delete(patentProjects).where(eq(patentProjects.id, input.id));
        return { ok: true };
      }),

    // ── Patent AI Workspace: Hypotheses ────────────────────────────────────
    listHypotheses: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { patentHypotheses } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        return db.select().from(patentHypotheses)
          .where(eq(patentHypotheses.projectId, input.projectId))
          .orderBy(patentHypotheses.sortOrder);
      }),

    toggleHypothesis: publicProcedure
      .input(z.object({ id: z.number(), included: z.boolean() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { patentHypotheses } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.update(patentHypotheses)
          .set({ included: input.included })
          .where(eq(patentHypotheses.id, input.id));
        return { ok: true };
      }),

    // ── AI: Patent Strategist — generate hypotheses ─────────────────────────
    hypothesize: publicProcedure
      .input(z.object({
        projectId: z.number(),
        coreInventionNotes: z.string(),
        priorArtNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { patentProjects, patentHypotheses } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const systemPrompt = `You are an elite Patent Strategist and IP Engineer. Your objective is to analyze a user's initial invention disclosure and identify novel, non-obvious "hypotheses" (alternative embodiments, broader applications, or workarounds) to maximize the commercial value and defensive strength of the resulting patent.

Instructions:
1. Analyze the provided [USER_RESEARCH] and any provided [PRIOR_ART].
2. Identify the core "inventive step" (the specific technical solution to a technical problem).
3. Generate 3 to 5 distinct "Inventive Hypotheses" that expand upon the core idea.
4. For each hypothesis, consider:
   - Material Substitution: Can different materials achieve the same result?
   - Process Variation: Can the steps be reordered, combined, or omitted?
   - Broadened Scope: How can we describe the specific components in broader functional terms?
   - Alternative Use Cases: Can this technology be applied to a completely different industry?

Output Format: Return the response strictly as a JSON object with a "hypotheses" array. Each object must contain: title, description, rationale, claim_impact.`;

        const userContent = `[USER_RESEARCH]:\n${input.coreInventionNotes}\n\n[PRIOR_ART]:\n${input.priorArtNotes ?? "None provided"}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "patent_hypotheses",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  hypotheses: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        rationale: { type: "string" },
                        claim_impact: { type: "string" },
                      },
                      required: ["title", "description", "rationale", "claim_impact"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["hypotheses"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "{}";
        let parsed: { hypotheses: Array<{ title: string; description: string; rationale: string; claim_impact: string }> };
        try {
          parsed = JSON.parse(content);
        } catch {
          throw new Error("AI returned invalid JSON for hypotheses");
        }

        // Clear old hypotheses for this project
        await db.delete(patentHypotheses).where(eq(patentHypotheses.projectId, input.projectId));

        // Insert new hypotheses
        const hypotheses = parsed.hypotheses ?? [];
        if (hypotheses.length > 0) {
          await db.insert(patentHypotheses).values(
            hypotheses.map((h, i) => ({
              projectId: input.projectId,
              title: h.title,
              description: h.description,
              rationale: h.rationale,
              claimImpact: h.claim_impact,
              included: false,
              sortOrder: i,
            }))
          );
        }

        // Advance project to Strategy phase
        await db.update(patentProjects)
          .set({
            phase: "Strategy",
            coreInventionNotes: input.coreInventionNotes,
            priorArtNotes: input.priorArtNotes ?? null,
            updatedAt: new Date(),
          })
          .where(eq(patentProjects.id, input.projectId));

        return { count: hypotheses.length };
      }),

    // ── AI: Patent Attorney — draft one section at a time ──────────────────
    draftSection: publicProcedure
      .input(z.object({
        projectId: z.number(),
        section: z.enum(["Abstract", "Background", "Summary", "DetailedDescription", "Claims"]),
        coreInventionNotes: z.string(),
        approvedHypotheses: z.array(z.object({
          title: z.string(),
          description: z.string(),
          rationale: z.string(),
          claimImpact: z.string(),
        })),
        jurisdiction: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { patentProjects } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const sectionLabel = input.section === "DetailedDescription" ? "Detailed Description" : input.section;
        const systemPrompt = `You are an expert Patent Attorney registered to practice in the UK and before the EPO/USPTO. Your task is to draft a highly precise, legally robust section of a patent specification.

Context Provided:
- [CORE_INVENTION]: The original technical notes provided by the inventor.
- [APPROVED_HYPOTHESES]: The specific alternative embodiments the inventor wants included.
- [SECTION_TO_DRAFT]: The specific section you are drafting right now.
- [JURISDICTION]: ${input.jurisdiction ?? "UK/EPO"}

Drafting Rules:
1. Terminology: Maintain strict consistency in terminology throughout.
2. Enablement: Ensure every element in the hypotheses is described in sufficient detail.
3. Claims Drafting (if applicable): Use standard patent claim language ("comprising", "consisting of"). Start with the broadest independent claim, followed by progressively narrower dependent claims.
4. Tone: Use formal, objective, and precise technical-legal language. Avoid marketing speak.

Output: Output ONLY the drafted text for the requested section, formatted in clean Markdown. Do not include introductory conversational text.`;

        const hypothesesText = input.approvedHypotheses
          .map((h, i) => `Hypothesis ${i + 1}: ${h.title}\n${h.description}\nRationale: ${h.rationale}\nClaim Impact: ${h.claimImpact}`)
          .join("\n\n");

        const userContent = `[CORE_INVENTION]:\n${input.coreInventionNotes}\n\n[APPROVED_HYPOTHESES]:\n${hypothesesText}\n\n[SECTION_TO_DRAFT]: ${sectionLabel}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
        });

        const draftText = response.choices[0]?.message?.content ?? "";

        // Persist the drafted section
        const fieldMap: Record<string, string> = {
          Abstract: "draftAbstract",
          Background: "draftBackground",
          Summary: "draftSummary",
          DetailedDescription: "draftDetailedDesc",
          Claims: "draftClaims",
        };
        const field = fieldMap[input.section];
        await db.update(patentProjects)
          .set({ [field]: draftText, phase: "Drafting", updatedAt: new Date() })
          .where(eq(patentProjects.id, input.projectId));

        return { section: input.section, content: draftText };
      }),

    // ── Renewal Alerts (90-day window) ────────────────────────────────────
    getRenewalAlerts: publicProcedure
      .query(async () => {
        const db = (await getDb())!;
        const { ipAssets } = await import("../drizzle/schema");
        const rows = await db.select().from(ipAssets);
        const now = Date.now();
        const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
        const alerts = rows
          .filter((a: typeof rows[0]) => {
            const due = a.renewalDueDate || a.expiryDate;
            if (!due) return false;
            const dueMs = new Date(due).getTime();
            return dueMs > now && dueMs - now <= ninetyDaysMs;
          })
          .map((a: typeof rows[0]) => {
            const due = (a.renewalDueDate || a.expiryDate)!;
            const dueMs = new Date(due).getTime();
            const daysLeft = Math.ceil((dueMs - now) / (24 * 60 * 60 * 1000));
            return {
              id: a.id,
              title: a.title,
              ipType: a.ipType,
              reference: a.reference,
              ventureId: a.ventureId,
              ventureName: a.ventureName,
              dueDate: due,
              daysLeft,
              urgency: daysLeft <= 30 ? "Critical" : daysLeft <= 60 ? "High" : "Medium",
            };
          })
          .sort((a: { daysLeft: number }, b: { daysLeft: number }) => a.daysLeft - b.daysLeft);
        return alerts;
      }),

    // ── Notify owner of renewal alerts ────────────────────────────────────
    notifyRenewalAlerts: publicProcedure
      .mutation(async () => {
        const db = (await getDb())!;
        const { ipAssets } = await import("../drizzle/schema");
        const rows = await db.select().from(ipAssets);
        const now = Date.now();
        const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
        const alerts = rows.filter((a: typeof rows[0]) => {
          const due = a.renewalDueDate || a.expiryDate;
          if (!due) return false;
          const dueMs = new Date(due).getTime();
          return dueMs > now && dueMs - now <= ninetyDaysMs;
        });
        if (alerts.length === 0) return { notified: false, count: 0 };
        const lines = alerts.map((a: typeof rows[0]) => {
          const due = (a.renewalDueDate || a.expiryDate)!;
          const daysLeft = Math.ceil((new Date(due).getTime() - now) / (24 * 60 * 60 * 1000));
          return `\u2022 ${a.ipType}: **${a.title}** (${a.reference || "no ref"}) \u2014 due ${due} (${daysLeft} days)`;
        }).join("\n");
        await notifyOwner({
          title: `\u26a0\ufe0f IP Renewal Alert \u2014 ${alerts.length} asset${alerts.length > 1 ? "s" : ""} due within 90 days`,
          content: `The following IP assets require renewal action:\n\n${lines}\n\nPlease review in the IP Management module.`,
        });
        return { notified: true, count: alerts.length };
      }),

    // ── List assets for a specific venture (venture detail page) ────────────
    listAssetsByVenture: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { ipAssets, ipLicenses } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const assets = await db.select().from(ipAssets)
          .where(eq(ipAssets.ventureId, input.ventureId))
          .orderBy(ipAssets.createdAt);
        const allLicenses = await db.select().from(ipLicenses);
        return assets.map((a: typeof assets[0]) => ({
          ...a,
          licenseCount: allLicenses.filter((l: typeof allLicenses[0]) => l.ipAssetId === a.id).length,
        }));
      }),

    // ── Export patent draft as markdown (for PDF generation) ──────────────
    exportPatentDraft: publicProcedure
      .input(z.object({ projectId: z.number().int() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { patentProjects, patentHypotheses } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [project] = await db.select().from(patentProjects)
          .where(eq(patentProjects.id, input.projectId));
        if (!project) throw new Error("Patent project not found");
        const hypotheses = await db.select().from(patentHypotheses)
          .where(eq(patentHypotheses.projectId, input.projectId));
        const includedHypotheses = hypotheses.filter((h: typeof hypotheses[0]) => h.included);
        const md = [
          `# Patent Application Draft`,
          `**Title:** ${project.title}`,
          `**Jurisdiction:** ${project.jurisdiction || "UK/EPO"}`,
          `**Generated:** ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`,
          ``,
          `---`,
          ``,
          `## Abstract`,
          project.draftAbstract || "*Not yet drafted*",
          ``,
          `## 1. Background of the Invention`,
          project.draftBackground || "*Not yet drafted*",
          ``,
          `## 2. Summary of the Invention`,
          project.draftSummary || "*Not yet drafted*",
          ``,
          `## 3. Detailed Description of Preferred Embodiments`,
          project.draftDetailedDesc || "*Not yet drafted*",
          ...(includedHypotheses.length > 0 ? [
            ``,
            `### Alternative Embodiments`,
            ...includedHypotheses.map((h: typeof hypotheses[0], i: number) =>
              `**Embodiment ${i + 1}: ${h.title}**\n\n${h.description}\n\n*Rationale:* ${h.rationale || ""}\n\n*Claim impact:* ${h.claimImpact || ""}`
            ),
          ] : []),
          ``,
          `## 4. Claims`,
          project.draftClaims || "*Not yet drafted*",
          ``,
          `---`,
          `*This draft was generated by the EcoBlend IP Intelligence Engine. It requires review by a qualified patent attorney before filing.*`,
        ].join("\n");
        return {
          projectId: project.id,
          title: project.title,
          jurisdiction: project.jurisdiction,
          markdown: md,
          sectionsComplete: [
            project.draftAbstract, project.draftBackground, project.draftSummary,
            project.draftDetailedDesc, project.draftClaims,
          ].filter(Boolean).length,
        };
      }),

    // ── Portfolio Summary ──────────────────────────────────────────────────
    getPortfolioSummary: publicProcedure
      .query(async () => {
        const db = (await getDb())!;
        const { ipAssets, ipLicenses } = await import("../drizzle/schema");
        const assets = await db.select().from(ipAssets);
        const licenses = await db.select().from(ipLicenses);

        const byType = ["Patent", "Trademark", "Copyright", "DesignRight", "TradeSecret"].map(t => ({
          type: t,
          count: assets.filter((a: typeof assets[0]) => a.ipType === t).length,
        }));

        const activeLicenses = licenses.filter((l: typeof licenses[0]) => l.status === "Active");
        const annualLicenseRevenue = activeLicenses.reduce((s: number, l: typeof licenses[0]) => s + (l.annualValue ?? 0), 0);
        const totalEstimatedValue = assets.reduce((s: number, a: typeof assets[0]) => s + (a.estimatedValue ?? 0), 0);

        const grantedPatents = assets.filter((a: typeof assets[0]) => a.ipType === "Patent" && (a.status === "Granted" || a.status === "Licensed")).length;
        const registeredTM = assets.filter((a: typeof assets[0]) => a.ipType === "Trademark" && a.status === "Registered").length;
        const activeSecrets = assets.filter((a: typeof assets[0]) => a.ipType === "TradeSecret" && a.status === "Active").length;

        return {
          totalAssets: assets.length,
          byType,
          totalLicenses: licenses.length,
          activeLicenses: activeLicenses.length,
          annualLicenseRevenue,
          totalEstimatedValue,
          grantedPatents,
          registeredTM,
          activeSecrets,
          regions: Array.from(new Set(licenses.map((l: typeof licenses[0]) => l.region).filter(Boolean))),
        };
      }),
  }),

  // ── LCSSA Governance Module ────────────────────────────────────────────────
  lcssa: router({
    // ── Environmental LCA ──────────────────────────────────────────────────
    getEnvironmental: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { lcssaEnvironmental } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [row] = await db.select().from(lcssaEnvironmental)
          .where(eq(lcssaEnvironmental.ventureId, input.ventureId));
        return row ?? null;
      }),

    upsertEnvironmental: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        carbonFootprintKg: z.number().optional(),
        carbonFootprintScope1: z.number().optional(),
        carbonFootprintScope2: z.number().optional(),
        carbonFootprintScope3: z.number().optional(),
        carbonReductionTarget: z.number().optional(),
        energyConsumptionKwh: z.number().optional(),
        waterUsageLitres: z.number().optional(),
        renewableEnergyPct: z.number().optional(),
        materialEfficiencyPct: z.number().optional(),
        wasteGeneratedKg: z.number().optional(),
        wasteRecycledPct: z.number().optional(),
        airPollutionIndex: z.number().optional(),
        waterPollutionIndex: z.number().optional(),
        biodiversityScore: z.number().optional(),
        landUseHectares: z.number().optional(),
        ecosystemServicesScore: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { lcssaEnvironmental } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { ventureId, notes, ...metrics } = input;
        // Compute environmental score: weighted average across 4 pillars
        const carbonScore = Math.max(0, 100 - ((metrics.carbonFootprintKg ?? 0) / 1000) * 10);
        const resourceScore = (metrics.renewableEnergyPct ?? 0) * 0.5 + (metrics.materialEfficiencyPct ?? 0) * 0.5;
        const wasteScore = (metrics.wasteRecycledPct ?? 0);
        const ecosystemScore = ((metrics.biodiversityScore ?? 0) / 10) * 100;
        const environmentalScore = Math.min(100, (carbonScore * 0.35 + resourceScore * 0.25 + wasteScore * 0.25 + ecosystemScore * 0.15));
        const [existing] = await db.select().from(lcssaEnvironmental)
          .where(eq(lcssaEnvironmental.ventureId, ventureId));
        if (existing) {
          await db.update(lcssaEnvironmental)
            .set({ ...metrics, environmentalScore, notes: notes ?? existing.notes })
            .where(eq(lcssaEnvironmental.ventureId, ventureId));
        } else {
          await db.insert(lcssaEnvironmental).values({ ventureId, ...metrics, environmentalScore, notes });
        }
        const [updated] = await db.select().from(lcssaEnvironmental)
          .where(eq(lcssaEnvironmental.ventureId, ventureId));
        return updated;
      }),

    // ── Social LCA ─────────────────────────────────────────────────────────
    getSocial: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { lcssaSocial } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [row] = await db.select().from(lcssaSocial)
          .where(eq(lcssaSocial.ventureId, input.ventureId));
        return row ?? null;
      }),

    upsertSocial: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        livingWageCompliance: z.boolean().optional(),
        avgWorkingHoursPerWeek: z.number().optional(),
        employeeTurnoverPct: z.number().optional(),
        collectiveBargaining: z.boolean().optional(),
        humanRightsDueDiligence: z.boolean().optional(),
        supplyChainAuditScore: z.number().optional(),
        childLaborRisk: z.enum(["Low", "Medium", "High"]).optional(),
        forcedLaborRisk: z.enum(["Low", "Medium", "High"]).optional(),
        localHiringPct: z.number().optional(),
        communityInvestmentGbp: z.number().optional(),
        communityEngagementScore: z.number().optional(),
        ltifr: z.number().optional(),
        nearMissReports: z.number().optional(),
        safetyTrainingHours: z.number().optional(),
        healthSafetyScore: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { lcssaSocial } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { ventureId, notes, ...metrics } = input;
        // Compute social score: 4 pillars weighted equally
        const laborScore = ((metrics.livingWageCompliance ? 25 : 0) + (metrics.collectiveBargaining ? 25 : 0) +
          Math.max(0, 25 - (metrics.employeeTurnoverPct ?? 0)) + Math.max(0, 25 - Math.max(0, ((metrics.avgWorkingHoursPerWeek ?? 40) - 40) * 2)));
        const hrScore = ((metrics.humanRightsDueDiligence ? 40 : 0) + (metrics.supplyChainAuditScore ?? 0) * 4 +
          (metrics.childLaborRisk === "Low" ? 10 : metrics.childLaborRisk === "Medium" ? 5 : 0) +
          (metrics.forcedLaborRisk === "Low" ? 10 : metrics.forcedLaborRisk === "Medium" ? 5 : 0));
        const communityScore = ((metrics.localHiringPct ?? 0) * 0.5 + (metrics.communityEngagementScore ?? 0) * 5);
        const hsScore = ((metrics.healthSafetyScore ?? 0) * 10);
        const socialScore = Math.min(100, (laborScore * 0.25 + hrScore * 0.25 + communityScore * 0.25 + hsScore * 0.25));
        const [existing] = await db.select().from(lcssaSocial)
          .where(eq(lcssaSocial.ventureId, ventureId));
        if (existing) {
          await db.update(lcssaSocial)
            .set({ ...metrics, socialScore, notes: notes ?? existing.notes })
            .where(eq(lcssaSocial.ventureId, ventureId));
        } else {
          await db.insert(lcssaSocial).values({ ventureId, ...metrics, socialScore, notes });
        }
        const [updated] = await db.select().from(lcssaSocial)
          .where(eq(lcssaSocial.ventureId, ventureId));
        return updated;
      }),

    // ── Life Cycle Costing ─────────────────────────────────────────────────
    getLcc: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { lcssaLifeCycleCost } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [row] = await db.select().from(lcssaLifeCycleCost)
          .where(eq(lcssaLifeCycleCost.ventureId, input.ventureId));
        return row ?? null;
      }),

    upsertLcc: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        rawMaterialCostGbp: z.number().optional(),
        manufacturingCostGbp: z.number().optional(),
        labourCostGbp: z.number().optional(),
        overheadCostGbp: z.number().optional(),
        inboundLogisticsCostGbp: z.number().optional(),
        outboundLogisticsCostGbp: z.number().optional(),
        warehouseCostGbp: z.number().optional(),
        plannedMaintenanceCostGbp: z.number().optional(),
        unplannedMaintenanceCostGbp: z.number().optional(),
        assetLifespanYears: z.number().optional(),
        disposalCostGbp: z.number().optional(),
        recyclingRevGbp: z.number().optional(),
        remediationCostGbp: z.number().optional(),
        currency: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { lcssaLifeCycleCost } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { ventureId, notes, currency, ...costs } = input;
        // Compute totals
        const productionTotal = (costs.rawMaterialCostGbp ?? 0) + (costs.manufacturingCostGbp ?? 0) + (costs.labourCostGbp ?? 0) + (costs.overheadCostGbp ?? 0);
        const logisticsTotal = (costs.inboundLogisticsCostGbp ?? 0) + (costs.outboundLogisticsCostGbp ?? 0) + (costs.warehouseCostGbp ?? 0);
        const maintenanceTotal = (costs.plannedMaintenanceCostGbp ?? 0) + (costs.unplannedMaintenanceCostGbp ?? 0);
        const eolTotal = (costs.disposalCostGbp ?? 0) - (costs.recyclingRevGbp ?? 0) + (costs.remediationCostGbp ?? 0);
        const totalLccGbp = productionTotal + logisticsTotal + maintenanceTotal + eolTotal;
        // LCC efficiency score: lower cost relative to lifespan = higher score
        const lifespan = costs.assetLifespanYears ?? 1;
        const annualCost = totalLccGbp / Math.max(1, lifespan);
        const lccScore = Math.min(100, Math.max(0, 100 - (annualCost / 10000) * 10));
        const [existing] = await db.select().from(lcssaLifeCycleCost)
          .where(eq(lcssaLifeCycleCost.ventureId, ventureId));
        if (existing) {
          await db.update(lcssaLifeCycleCost)
            .set({ ...costs, totalLccGbp, lccScore, currency: currency ?? existing.currency, notes: notes ?? existing.notes })
            .where(eq(lcssaLifeCycleCost.ventureId, ventureId));
        } else {
          await db.insert(lcssaLifeCycleCost).values({ ventureId, ...costs, totalLccGbp, lccScore, currency, notes });
        }
        const [updated] = await db.select().from(lcssaLifeCycleCost)
          .where(eq(lcssaLifeCycleCost.ventureId, ventureId));
        return updated;
      }),

    // ── LCSA Oversight & Governance ────────────────────────────────────────
    getOversight: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { lcssaOversight } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [row] = await db.select().from(lcssaOversight)
          .where(eq(lcssaOversight.ventureId, input.ventureId));
        return row ?? null;
      }),

    upsertOversight: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        iso14001Certified: z.boolean().optional(),
        iso26000Adopted: z.boolean().optional(),
        griReportingLevel: z.enum(["None", "Core", "Comprehensive"]).optional(),
        sdgAlignmentCount: z.number().optional(),
        policyDocumentUrl: z.string().optional(),
        complianceScore: z.number().optional(),
        reportingFrequency: z.enum(["Annual", "Quarterly", "Monthly"]).optional(),
        dataQualityScore: z.number().optional(),
        thirdPartyVerified: z.boolean().optional(),
        verifierName: z.string().optional(),
        reportUrl: z.string().optional(),
        boardOversight: z.boolean().optional(),
        sustainabilityCommittee: z.boolean().optional(),
        stakeholderEngagementScore: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { lcssaOversight } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { ventureId, notes, ...fields } = input;
        // Compute oversight score
        const policyPoints = ((fields.iso14001Certified ? 20 : 0) + (fields.iso26000Adopted ? 15 : 0) +
          (fields.griReportingLevel === "Comprehensive" ? 20 : fields.griReportingLevel === "Core" ? 10 : 0) +
          Math.min(15, (fields.sdgAlignmentCount ?? 0) * 1.5));
        const reportingPoints = ((fields.dataQualityScore ?? 0) * 3 + (fields.thirdPartyVerified ? 20 : 0) +
          (fields.reportingFrequency === "Monthly" ? 10 : fields.reportingFrequency === "Quarterly" ? 7 : 5));
        const govPoints = ((fields.boardOversight ? 15 : 0) + (fields.sustainabilityCommittee ? 15 : 0) +
          (fields.stakeholderEngagementScore ?? 0) * 2);
        const oversightScore = Math.min(100, policyPoints * 0.4 + reportingPoints * 0.35 + govPoints * 0.25);
        const [existing] = await db.select().from(lcssaOversight)
          .where(eq(lcssaOversight.ventureId, ventureId));
        if (existing) {
          await db.update(lcssaOversight)
            .set({ ...fields, oversightScore, notes: notes ?? existing.notes })
            .where(eq(lcssaOversight.ventureId, ventureId));
        } else {
          await db.insert(lcssaOversight).values({ ventureId, ...fields, oversightScore, notes });
        }
        const [updated] = await db.select().from(lcssaOversight)
          .where(eq(lcssaOversight.ventureId, ventureId));
        return updated;
      }),

    // ── Sustainable Decision Log ───────────────────────────────────────────
    listDecisions: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { lcssaDecisionLog } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        return db.select().from(lcssaDecisionLog)
          .where(eq(lcssaDecisionLog.ventureId, input.ventureId))
          .orderBy(desc(lcssaDecisionLog.createdAt));
      }),

    addDecision: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        decisionTitle: z.string().min(1),
        decisionType: z.enum(["Environmental", "Social", "Economic", "Integrated"]),
        lcaDimension: z.string().optional(),
        rationale: z.string().optional(),
        environmentalImpact: z.enum(["Positive", "Neutral", "Negative"]).optional(),
        socialImpact: z.enum(["Positive", "Neutral", "Negative"]).optional(),
        economicImpact: z.enum(["Positive", "Neutral", "Negative"]).optional(),
        status: z.enum(["Proposed", "Approved", "Implemented", "Reviewed"]).optional(),
        owner: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { lcssaDecisionLog } = await import("../drizzle/schema");
        const [inserted] = await db.insert(lcssaDecisionLog).values({
          ventureId: input.ventureId,
          decisionTitle: input.decisionTitle,
          decisionType: input.decisionType,
          lcaDimension: input.lcaDimension,
          rationale: input.rationale,
          environmentalImpact: input.environmentalImpact ?? "Neutral",
          socialImpact: input.socialImpact ?? "Neutral",
          economicImpact: input.economicImpact ?? "Neutral",
          status: input.status ?? "Proposed",
          owner: input.owner,
        });
        return { success: true };
      }),

    updateDecisionStatus: publicProcedure
      .input(z.object({
        id: z.number().int(),
        status: z.enum(["Proposed", "Approved", "Implemented", "Reviewed"]),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { lcssaDecisionLog } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.update(lcssaDecisionLog)
          .set({ status: input.status })
          .where(eq(lcssaDecisionLog.id, input.id));
        return { success: true };
      }),

    deleteDecision: publicProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { lcssaDecisionLog } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(lcssaDecisionLog).where(eq(lcssaDecisionLog.id, input.id));
        return { success: true };
      }),

    // ── LCSSA Portfolio Summary ────────────────────────────────────────────
    getLcssaSummary: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { lcssaEnvironmental, lcssaSocial, lcssaLifeCycleCost, lcssaOversight, lcssaDecisionLog } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [env] = await db.select().from(lcssaEnvironmental).where(eq(lcssaEnvironmental.ventureId, input.ventureId));
        const [soc] = await db.select().from(lcssaSocial).where(eq(lcssaSocial.ventureId, input.ventureId));
        const [lcc] = await db.select().from(lcssaLifeCycleCost).where(eq(lcssaLifeCycleCost.ventureId, input.ventureId));
        const [gov] = await db.select().from(lcssaOversight).where(eq(lcssaOversight.ventureId, input.ventureId));
        const decisions = await db.select().from(lcssaDecisionLog).where(eq(lcssaDecisionLog.ventureId, input.ventureId));
        const envScore = env?.environmentalScore ?? 0;
        const socScore = soc?.socialScore ?? 0;
        const lccScore = lcc?.lccScore ?? 0;
        const govScore = gov?.oversightScore ?? 0;
        // LCSSA Integrated Score: Planet 35% + People 30% + Profit 20% + Governance 15%
        const lcssaScore = envScore * 0.35 + socScore * 0.30 + lccScore * 0.20 + govScore * 0.15;
        return {
          ventureId: input.ventureId,
          environmentalScore: envScore,
          socialScore: socScore,
          lccScore,
          oversightScore: govScore,
          lcssaScore: Math.round(lcssaScore * 10) / 10,
          decisionCount: decisions.length,
          implementedDecisions: decisions.filter((d: typeof decisions[0]) => d.status === "Implemented").length,
          env: env ?? null,
          soc: soc ?? null,
          lcc: lcc ?? null,
          gov: gov ?? null,
        };
      }),

    // ── LCSSA Snapshot (for trend chart) ────────────────────────────────────────
    takeSnapshot: publicProcedure
      .input(z.object({ ventureId: z.string(), label: z.string().optional() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { lcssaEnvironmental, lcssaSocial, lcssaLifeCycleCost, lcssaOversight, lcssaSnapshot } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [env] = await db.select().from(lcssaEnvironmental).where(eq(lcssaEnvironmental.ventureId, input.ventureId));
        const [soc] = await db.select().from(lcssaSocial).where(eq(lcssaSocial.ventureId, input.ventureId));
        const [lcc] = await db.select().from(lcssaLifeCycleCost).where(eq(lcssaLifeCycleCost.ventureId, input.ventureId));
        const [gov] = await db.select().from(lcssaOversight).where(eq(lcssaOversight.ventureId, input.ventureId));
        const envScore = env?.environmentalScore ?? 0;
        const socScore = soc?.socialScore ?? 0;
        const lccScore = lcc?.lccScore ?? 0;
        const govScore = gov?.oversightScore ?? 0;
        const lcssaScore = Math.round((envScore * 0.35 + socScore * 0.30 + lccScore * 0.20 + govScore * 0.15) * 10) / 10;
        const now = new Date();
        const label = input.label ?? `${now.toLocaleString("default", { month: "short" })} ${now.getFullYear()}`;
        const [inserted] = await db.insert(lcssaSnapshot).values({
          ventureId: input.ventureId,
          environmentalScore: envScore,
          socialScore: socScore,
          lccScore,
          oversightScore: govScore,
          lcssaScore,
          label,
          triggeredBy: "manual",
        });
        return { success: true, lcssaScore, label };
      }),

    listSnapshots: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { lcssaSnapshot } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        return db.select().from(lcssaSnapshot)
          .where(eq(lcssaSnapshot.ventureId, input.ventureId))
          .orderBy(lcssaSnapshot.snapshotDate);
      }),

    deleteSnapshot: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { lcssaSnapshot } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(lcssaSnapshot).where(eq(lcssaSnapshot.id, input.id));
        return { success: true };
      }),

    // ── SDG Heatmap ──────────────────────────────────────────────────────────────
    updateSdgHeatmap: publicProcedure
      .input(z.object({ ventureId: z.string(), sdgHeatmap: z.array(z.boolean()).length(17) }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { lcssaOversight } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const heatmapJson = JSON.stringify(input.sdgHeatmap);
        const count = input.sdgHeatmap.filter(Boolean).length;
        const [existing] = await db.select({ id: lcssaOversight.id }).from(lcssaOversight).where(eq(lcssaOversight.ventureId, input.ventureId));
        if (existing) {
          await db.update(lcssaOversight)
            .set({ sdgHeatmap: heatmapJson, sdgAlignmentCount: count, updatedAt: new Date() })
            .where(eq(lcssaOversight.ventureId, input.ventureId));
        } else {
          await db.insert(lcssaOversight).values({ ventureId: input.ventureId, sdgHeatmap: heatmapJson, sdgAlignmentCount: count });
        }
        return { success: true, sdgAlignmentCount: count };
      }),

    // ── LCSSA PDF Report ─────────────────────────────────────────────────────────
    exportReport: publicProcedure
      .input(z.object({ ventureId: z.string(), ventureName: z.string().optional() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { lcssaEnvironmental, lcssaSocial, lcssaLifeCycleCost, lcssaOversight, lcssaDecisionLog, lcssaSnapshot } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [env] = await db.select().from(lcssaEnvironmental).where(eq(lcssaEnvironmental.ventureId, input.ventureId));
        const [soc] = await db.select().from(lcssaSocial).where(eq(lcssaSocial.ventureId, input.ventureId));
        const [lcc] = await db.select().from(lcssaLifeCycleCost).where(eq(lcssaLifeCycleCost.ventureId, input.ventureId));
        const [gov] = await db.select().from(lcssaOversight).where(eq(lcssaOversight.ventureId, input.ventureId));
        const decisions = await db.select().from(lcssaDecisionLog).where(eq(lcssaDecisionLog.ventureId, input.ventureId));
        const snapshots = await db.select().from(lcssaSnapshot).where(eq(lcssaSnapshot.ventureId, input.ventureId)).orderBy(lcssaSnapshot.snapshotDate);
        const envScore = env?.environmentalScore ?? 0;
        const socScore = soc?.socialScore ?? 0;
        const lccScore = lcc?.lccScore ?? 0;
        const govScore = gov?.oversightScore ?? 0;
        const lcssaScore = Math.round((envScore * 0.35 + socScore * 0.30 + lccScore * 0.20 + govScore * 0.15) * 10) / 10;
        const now = new Date();
        const reportDate = now.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
        const ventureName = input.ventureName ?? input.ventureId;

        const sdgHeatmapArr: boolean[] = gov?.sdgHeatmap ? JSON.parse(gov.sdgHeatmap) : Array(17).fill(false);
        const sdgNames = ["No Poverty","Zero Hunger","Good Health","Quality Education","Gender Equality","Clean Water","Affordable Energy","Decent Work","Industry & Innovation","Reduced Inequalities","Sustainable Cities","Responsible Consumption","Climate Action","Life Below Water","Life on Land","Peace & Justice","Partnerships"];
        const activeSdgs = sdgNames.filter((_, i) => sdgHeatmapArr[i]);

        const md = `# LCSSA Report — ${ventureName}
**Date:** ${reportDate}  
**Integrated LCSSA Score:** ${lcssaScore}/100

---

## Executive Summary
This Life Cycle Sustainability Assessment (LCSSA) report integrates Environmental LCA (Planet), Social LCA (People), and Life Cycle Costing (Profit) under the Integrated Sustainability Framework for ${ventureName}. The integrated score of **${lcssaScore}/100** reflects performance across all four pillars weighted as: Environmental 35%, Social 30%, LCC 20%, Governance 15%.

---

## 1. Environmental LCA — Planet (Score: ${envScore}/100)

| Indicator | Value |
|-----------|-------|
| Carbon Footprint (Total) | ${env?.carbonFootprintKg ?? 0} kg CO₂e |
| Scope 1 Emissions | ${env?.carbonFootprintScope1 ?? 0} kg |
| Scope 2 Emissions | ${env?.carbonFootprintScope2 ?? 0} kg |
| Scope 3 Emissions | ${env?.carbonFootprintScope3 ?? 0} kg |
| Carbon Reduction Target | ${env?.carbonReductionTarget ?? 0}% |
| Energy Consumption | ${env?.energyConsumptionKwh ?? 0} kWh |
| Renewable Energy | ${env?.renewableEnergyPct ?? 0}% |
| Water Usage | ${env?.waterUsageLitres ?? 0} L |
| Material Efficiency | ${env?.materialEfficiencyPct ?? 0}% |
| Waste Generated | ${env?.wasteGeneratedKg ?? 0} kg |
| Waste Recycled | ${env?.wasteRecycledPct ?? 0}% |
| Biodiversity Score | ${env?.biodiversityScore ?? 0}/10 |
| Ecosystem Services Score | ${env?.ecosystemServicesScore ?? 0}/10 |

${env?.notes ? `**Notes:** ${env.notes}` : ""}

---

## 2. Social LCA — People (Score: ${socScore}/100)

| Indicator | Value |
|-----------|-------|
| Living Wage Compliance | ${soc?.livingWageCompliance ? "Yes" : "No"} |
| Avg Working Hours/Week | ${soc?.avgWorkingHoursPerWeek ?? 0} hrs |
| Employee Turnover | ${soc?.employeeTurnoverPct ?? 0}% |
| Collective Bargaining | ${soc?.collectiveBargaining ? "Yes" : "No"} |
| Human Rights Due Diligence | ${soc?.humanRightsDueDiligence ? "Yes" : "No"} |
| Supply Chain Audit Score | ${soc?.supplyChainAuditScore ?? 0}/10 |
| Child Labour Risk | ${soc?.childLaborRisk ?? "N/A"} |
| Forced Labour Risk | ${soc?.forcedLaborRisk ?? "N/A"} |
| Local Hiring | ${soc?.localHiringPct ?? 0}% |
| Community Investment | £${soc?.communityInvestmentGbp ?? 0} |
| Community Engagement Score | ${soc?.communityEngagementScore ?? 0}/10 |
| LTIFR | ${soc?.ltifr ?? 0} |
| Health & Safety Score | ${soc?.healthSafetyScore ?? 0}/10 |

${soc?.notes ? `**Notes:** ${soc.notes}` : ""}

---

## 3. Life Cycle Costing — Profit (Score: ${lccScore}/100)

| Cost Category | Value (GBP) |
|---------------|-------------|
| Raw Materials | £${lcc?.rawMaterialCostGbp ?? 0} |
| Manufacturing | £${lcc?.manufacturingCostGbp ?? 0} |
| Labour | £${lcc?.labourCostGbp ?? 0} |
| Overhead | £${lcc?.overheadCostGbp ?? 0} |
| Inbound Logistics | £${lcc?.inboundLogisticsCostGbp ?? 0} |
| Outbound Logistics | £${lcc?.outboundLogisticsCostGbp ?? 0} |
| Warehousing | £${lcc?.warehouseCostGbp ?? 0} |
| Planned Maintenance | £${lcc?.plannedMaintenanceCostGbp ?? 0} |
| Unplanned Maintenance | £${lcc?.unplannedMaintenanceCostGbp ?? 0} |
| Disposal | £${lcc?.disposalCostGbp ?? 0} |
| Recycling Revenue | £${lcc?.recyclingRevGbp ?? 0} |
| Remediation | £${lcc?.remediationCostGbp ?? 0} |
| Asset Lifespan | ${lcc?.assetLifespanYears ?? 0} years |

${lcc?.notes ? `**Notes:** ${lcc.notes}` : ""}

---

## 4. LCSA Oversight & Governance (Score: ${govScore}/100)

| Indicator | Value |
|-----------|-------|
| ISO 14001 Certified | ${gov?.iso14001Certified ? "Yes" : "No"} |
| ISO 26000 Adopted | ${gov?.iso26000Adopted ? "Yes" : "No"} |
| GRI Reporting Level | ${gov?.griReportingLevel ?? "None"} |
| SDGs Addressed | ${gov?.sdgAlignmentCount ?? 0}/17 |
| Active SDGs | ${activeSdgs.length > 0 ? activeSdgs.join(", ") : "None selected"} |
| Compliance Score | ${gov?.complianceScore ?? 0}/100 |
| Reporting Frequency | ${gov?.reportingFrequency ?? "Annual"} |
| Data Quality Score | ${gov?.dataQualityScore ?? 0}/10 |
| Third-Party Verified | ${gov?.thirdPartyVerified ? "Yes" : "No"} |
| Board Oversight | ${gov?.boardOversight ? "Yes" : "No"} |
| Sustainability Committee | ${gov?.sustainabilityCommittee ? "Yes" : "No"} |
| Stakeholder Engagement | ${gov?.stakeholderEngagementScore ?? 0}/10 |

${gov?.notes ? `**Notes:** ${gov.notes}` : ""}

---

## 5. Sustainable Decision Log (${decisions.length} decisions)

| Decision | Type | Env Impact | Social Impact | Economic Impact | Status |
|----------|------|-----------|---------------|-----------------|--------|
${decisions.map(d => `| ${d.decisionTitle} | ${d.decisionType} | ${d.environmentalImpact} | ${d.socialImpact} | ${d.economicImpact} | ${d.status} |`).join("\n")}

---

## 6. LCSSA Score Trend

| Period | Env | Social | LCC | Governance | LCSSA |
|--------|-----|--------|-----|-----------|-------|
${snapshots.map(s => `| ${s.label ?? "—"} | ${s.environmentalScore?.toFixed(1)} | ${s.socialScore?.toFixed(1)} | ${s.lccScore?.toFixed(1)} | ${s.oversightScore?.toFixed(1)} | **${s.lcssaScore?.toFixed(1)}** |`).join("\n")}

---

## 7. Formula Reference

> **LCSSA Score = (Environmental × 0.35) + (Social × 0.30) + (LCC × 0.20) + (Governance × 0.15)**

This weighting reflects the primacy of planetary boundaries (35%), followed by social licence to operate (30%), economic viability (20%), and governance maturity (15%), consistent with the ISO 14040/14044 and UNEP SETAC methodological frameworks.

---

*Report generated by EcoBlend VBS Analytics Dashboard · ${reportDate}*
`;
        return { markdown: md, ventureName, lcssaScore, reportDate };
      }),
  }),
  // ── Dual Risk Venture Creation System ────────────────────────────────────────
  dualRisk: router({
    // ── Business Risk: get/upsert ─────────────────────────────────────────────
    getBusinessRisk: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { businessRiskInputs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [row] = await db.select().from(businessRiskInputs).where(eq(businessRiskInputs.ventureId, input.ventureId));
        return row ?? null;
      }),

    upsertBusinessRisk: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        sourceType: z.enum(["research_paper", "market_report", "ip_document", "academic_model", "manual"]).optional(),
        inputCategory: z.enum(["University", "Founder", "Joint"]).optional(),
        marketRiskScore: z.number().min(0).max(100).optional(),
        marketSizeScore: z.number().min(0).max(100).optional(),
        competitorIntensity: z.number().min(0).max(100).optional(),
        demandValidation: z.number().min(0).max(100).optional(),
        esgRiskScore: z.number().min(0).max(100).optional(),
        carbonFootprintRisk: z.number().min(0).max(100).optional(),
        socialLicenceRisk: z.number().min(0).max(100).optional(),
        supplyChainEsgRisk: z.number().min(0).max(100).optional(),
        regulatoryRiskScore: z.number().min(0).max(100).optional(),
        complianceComplexity: z.number().min(0).max(100).optional(),
        certificationBarrier: z.number().min(0).max(100).optional(),
        jurisdictionRisk: z.number().min(0).max(100).optional(),
        commercialViabilityScore: z.number().min(0).max(100).optional(),
        revenueModelClarity: z.number().min(0).max(100).optional(),
        unitEconomicsScore: z.number().min(0).max(100).optional(),
        partnershipReadiness: z.number().min(0).max(100).optional(),
        strategicRiskScore: z.number().min(0).max(100).optional(),
        ipProtectionStrength: z.number().min(0).max(100).optional(),
        teamCapabilityRisk: z.number().min(0).max(100).optional(),
        executionTrack: z.enum(["BEBUS", "ECORACE", "Both"]).optional(),
        notes: z.string().optional(),
        lastUpdatedBy: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { businessRiskInputs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { ventureId, ...fields } = input;
        // Compute business risk index: weighted average of risk sub-scores
        // Market(30%) + ESG(25%) + Regulatory(20%) + Strategic(15%) + inverted Commercial(10%)
        const mkt = fields.marketRiskScore ?? 50;
        const esg = fields.esgRiskScore ?? 50;
        const reg = fields.regulatoryRiskScore ?? 50;
        const str = fields.strategicRiskScore ?? 50;
        const com = 100 - (fields.commercialViabilityScore ?? 50); // invert: low viability = high risk
        const businessRiskIndex = Math.round((mkt * 0.30 + esg * 0.25 + reg * 0.20 + str * 0.15 + com * 0.10) * 10) / 10;
        const [existing] = await db.select().from(businessRiskInputs).where(eq(businessRiskInputs.ventureId, ventureId));
        if (existing) {
          await db.update(businessRiskInputs).set({ ...fields, businessRiskIndex }).where(eq(businessRiskInputs.ventureId, ventureId));
        } else {
          await db.insert(businessRiskInputs).values({ ventureId, ...fields, businessRiskIndex });
        }
        const [updated] = await db.select().from(businessRiskInputs).where(eq(businessRiskInputs.ventureId, ventureId));
        return updated;
      }),

    // ── Product Risk: get/upsert ──────────────────────────────────────────────
    getProductRisk: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { productRiskInputs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [row] = await db.select().from(productRiskInputs).where(eq(productRiskInputs.ventureId, input.ventureId));
        return row ?? null;
      }),

    upsertProductRisk: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        sourceType: z.enum(["problem_statement", "industry_pain_point", "product_idea", "performance_gap", "manual"]).optional(),
        inputCategory: z.enum(["University", "Founder", "Joint"]).optional(),
        technicalFeasibilityScore: z.number().min(0).max(100).optional(),
        prototypeMaturity: z.number().min(0).max(100).optional(),
        technologyReadiness: z.number().min(0).max(100).optional(),
        performanceRiskScore: z.number().min(0).max(100).optional(),
        benchmarkGap: z.number().min(0).max(100).optional(),
        qualityRisk: z.number().min(0).max(100).optional(),
        reliabilityRisk: z.number().min(0).max(100).optional(),
        scalabilityRiskScore: z.number().min(0).max(100).optional(),
        manufacturingRisk: z.number().min(0).max(100).optional(),
        supplyChainRisk: z.number().min(0).max(100).optional(),
        unitCostScalability: z.number().min(0).max(100).optional(),
        engineeringComplexity: z.number().min(0).max(100).optional(),
        integrationRisk: z.number().min(0).max(100).optional(),
        dependencyRisk: z.number().min(0).max(100).optional(),
        rdMaturityScore: z.number().min(0).max(100).optional(),
        labValidationScore: z.number().min(0).max(100).optional(),
        pilotTestScore: z.number().min(0).max(100).optional(),
        executionTrack: z.enum(["BEBUS", "ECORACE", "Both"]).optional(),
        notes: z.string().optional(),
        lastUpdatedBy: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { productRiskInputs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { ventureId, ...fields } = input;
        // Compute product risk index: weighted average
        // Performance(25%) + Scalability(25%) + Engineering(20%) + inverted Feasibility(15%) + inverted RD(15%)
        const perf = fields.performanceRiskScore ?? 50;
        const scal = fields.scalabilityRiskScore ?? 50;
        const eng = fields.engineeringComplexity ?? 50;
        const feas = 100 - (fields.technicalFeasibilityScore ?? 50); // invert
        const rd = 100 - (fields.rdMaturityScore ?? 50); // invert
        const productRiskIndex = Math.round((perf * 0.25 + scal * 0.25 + eng * 0.20 + feas * 0.15 + rd * 0.15) * 10) / 10;
        const [existing] = await db.select().from(productRiskInputs).where(eq(productRiskInputs.ventureId, ventureId));
        if (existing) {
          await db.update(productRiskInputs).set({ ...fields, productRiskIndex }).where(eq(productRiskInputs.ventureId, ventureId));
        } else {
          await db.insert(productRiskInputs).values({ ventureId, ...fields, productRiskIndex });
        }
        const [updated] = await db.select().from(productRiskInputs).where(eq(productRiskInputs.ventureId, ventureId));
        return updated;
      }),

    // ── VRL Engine: compute dual-risk-adjusted VRL score ─────────────────────
    computeVrl: publicProcedure
      .input(z.object({
        ventureId: z.string(),
        trlScore: z.number().min(0).max(9),
        brlScore: z.number().min(0).max(9),
        esgScore: z.number().min(0).max(100).optional(),
        confidenceScore: z.number().min(0.2).max(1.0).optional(),
        alphaWeight: z.number().min(0).max(1).optional(), // TRL weight, default 0.45
        betaWeight: z.number().min(0).max(1).optional(),  // BRL weight, default 0.55
        decidedBy: z.string().optional(),
        decisionRationale: z.string().optional(),
        executionTrack: z.enum(["BEBUS", "ECORACE", "Both", "None"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { businessRiskInputs, productRiskInputs, dualRiskDecisions } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        // Fetch current risk indices
        const [bizRisk] = await db.select().from(businessRiskInputs).where(eq(businessRiskInputs.ventureId, input.ventureId));
        const [prodRisk] = await db.select().from(productRiskInputs).where(eq(productRiskInputs.ventureId, input.ventureId));
        const businessRiskIndex = (bizRisk?.businessRiskIndex ?? 50) / 100; // normalise to 0–1
        const productRiskIndex = (prodRisk?.productRiskIndex ?? 50) / 100;
        const esgScore = (input.esgScore ?? 50) / 100;
        const alpha = input.alphaWeight ?? 0.45;
        const beta = input.betaWeight ?? 0.55;
        const confidence = input.confidenceScore ?? 0.5;
        // VRL Formula: VRL = (α×TRL + β×BRL) × (1 − BRI×0.5) × (1 − PRI×0.5) × Confidence
        // ESG bonus: +0.5 VRL levels for high ESG (>0.7)
        const rawVrl = (alpha * input.trlScore + beta * input.brlScore)
          * (1 - businessRiskIndex * 0.5)
          * (1 - productRiskIndex * 0.5)
          * confidence;
        const esgBonus = esgScore > 0.7 ? 0.3 : 0;
        const vrlScore = Math.min(9, Math.max(0, rawVrl + esgBonus));
        const vrlLevel = Math.max(1, Math.min(9, Math.round(vrlScore)));
        // Decision logic
        let decision: "Build" | "Validate" | "Partner" | "Reject";
        if (vrlScore >= 6 && businessRiskIndex < 0.4 && productRiskIndex < 0.4) {
          decision = "Build";
        } else if (vrlScore >= 4 && businessRiskIndex < 0.6 && productRiskIndex < 0.6) {
          decision = "Validate";
        } else if (vrlScore >= 3 && (businessRiskIndex >= 0.6 || productRiskIndex >= 0.6)) {
          decision = "Partner";
        } else {
          decision = "Reject";
        }
        // Log the decision
        await db.insert(dualRiskDecisions).values({
          ventureId: input.ventureId,
          businessRiskIndex: businessRiskIndex * 100,
          productRiskIndex: productRiskIndex * 100,
          trlScore: input.trlScore,
          brlScore: input.brlScore,
          esgScore: input.esgScore ?? 50,
          vrlScore: Math.round(vrlScore * 100) / 100,
          vrlLevel,
          confidenceScore: confidence,
          decision,
          decisionRationale: input.decisionRationale ?? `Auto-computed: VRL ${vrlScore.toFixed(2)}, BRI ${(businessRiskIndex * 100).toFixed(1)}%, PRI ${(productRiskIndex * 100).toFixed(1)}%`,
          executionTrack: input.executionTrack ?? (decision === "Build" ? "Both" : decision === "Validate" ? "ECORACE" : "None"),
          decidedBy: input.decidedBy,
          sourceType: "Joint",
        });
        return { vrlScore: Math.round(vrlScore * 100) / 100, vrlLevel, decision, businessRiskIndex: businessRiskIndex * 100, productRiskIndex: productRiskIndex * 100, esgBonus };
      }),

    // ── Decision Log: list/update feedback ───────────────────────────────────
    listDecisions: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { dualRiskDecisions } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        return db.select().from(dualRiskDecisions).where(eq(dualRiskDecisions.ventureId, input.ventureId)).orderBy(desc(dualRiskDecisions.createdAt));
      }),

    updateFeedback: publicProcedure
      .input(z.object({
        id: z.number(),
        marketFeedback: z.string().optional(),
        feedbackScore: z.number().min(0).max(100).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { dualRiskDecisions } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { id, ...fields } = input;
        await db.update(dualRiskDecisions).set(fields).where(eq(dualRiskDecisions.id, id));
        return { success: true };
      }),

    deleteDecision: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { dualRiskDecisions } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(dualRiskDecisions).where(eq(dualRiskDecisions.id, input.id));
        return { success: true };
      }),

    // ── Summary: combined dual risk overview ─────────────────────────────────
    getDualRiskSummary: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { businessRiskInputs, productRiskInputs, dualRiskDecisions } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        const [biz] = await db.select().from(businessRiskInputs).where(eq(businessRiskInputs.ventureId, input.ventureId));
        const [prod] = await db.select().from(productRiskInputs).where(eq(productRiskInputs.ventureId, input.ventureId));
        const decisions = await db.select().from(dualRiskDecisions).where(eq(dualRiskDecisions.ventureId, input.ventureId)).orderBy(desc(dualRiskDecisions.createdAt));
        const latest = decisions[0] ?? null;
        return {
          businessRiskIndex: biz?.businessRiskIndex ?? null,
          productRiskIndex: prod?.productRiskIndex ?? null,
          latestVrlScore: latest?.vrlScore ?? null,
          latestVrlLevel: latest?.vrlLevel ?? null,
          latestDecision: latest?.decision ?? null,
          latestExecutionTrack: latest?.executionTrack ?? null,
          decisionCount: decisions.length,
          buildCount: decisions.filter(d => d.decision === "Build").length,
          validateCount: decisions.filter(d => d.decision === "Validate").length,
          partnerCount: decisions.filter(d => d.decision === "Partner").length,
          rejectCount: decisions.filter(d => d.decision === "Reject").length,
        };
      }),
  }),
  supplyChain: router({
    // ── Products ──────────────────────────────────────────────────────────────
    listProducts: protectedProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { scProducts } = await import("../drizzle/schema");
        return db.select().from(scProducts).where(eqOp(scProducts.ventureId, input.ventureId));
      }),

    upsertProduct: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        ventureId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        materialType: z.enum(["carbon_fibre","glass_fibre","hybrid_composite","aluminium","steel","polymer","bio_composite","ceramic","other"]).optional(),
        manufacturingProcess: z.enum(["composite_layup","resin_transfer_moulding","injection_moulding","cnc_machining","3d_printing","casting","forging","assembly","other"]).optional(),
        prototypeStatus: z.enum(["concept","design","prototype_v1","prototype_v2","validated","production_ready"]).optional(),
        trlLevel: z.number().min(1).max(9).optional(),
        productionGeography: z.enum(["UK","China","Both","Other"]).optional(),
        targetMarket: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { scProducts } = await import("../drizzle/schema");
        const { id, ...data } = input;
        if (id) {
          await db.update(scProducts).set(data).where(eqOp(scProducts.id, id));
          return { id };
        }
        const [result] = await db.insert(scProducts).values(data);
        return { id: result.insertId };
      }),

    deleteProduct: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { scProducts } = await import("../drizzle/schema");
        await db.delete(scProducts).where(eqOp(scProducts.id, input.id));
        return { success: true };
      }),

    // ── Prototypes ────────────────────────────────────────────────────────────
    listPrototypes: protectedProcedure
      .input(z.object({ ventureId: z.string(), productId: z.number().optional() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp, and } = await import("drizzle-orm");
        const { scPrototypes } = await import("../drizzle/schema");
        if (input.productId) {
          return db.select().from(scPrototypes).where(
            and(eqOp(scPrototypes.ventureId, input.ventureId), eqOp(scPrototypes.productId, input.productId))
          );
        }
        return db.select().from(scPrototypes).where(eqOp(scPrototypes.ventureId, input.ventureId));
      }),

    upsertPrototype: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        productId: z.number(),
        ventureId: z.string(),
        version: z.string().optional(),
        cadStatus: z.enum(["not_started","in_progress","complete","validated"]).optional(),
        caeStatus: z.enum(["not_started","in_progress","complete","validated"]).optional(),
        cadFileUrl: z.string().optional(),
        labTestStatus: z.enum(["not_started","in_progress","passed","failed"]).optional(),
        testResults: z.string().optional(),
        structuralIntegrity: z.number().optional(),
        weightGrams: z.number().optional(),
        dimensionsMm: z.string().optional(),
        trlAtStart: z.number().min(1).max(9).optional(),
        trlAtEnd: z.number().min(1).max(9).optional(),
        lcaScore: z.number().optional(),
        carbonFootprintKg: z.number().optional(),
        manufacturingNotes: z.string().optional(),
        prototypeImageUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { scPrototypes } = await import("../drizzle/schema");
        const { id, ...data } = input;
        if (id) {
          await db.update(scPrototypes).set(data).where(eqOp(scPrototypes.id, id));
          return { id };
        }
        const [result] = await db.insert(scPrototypes).values(data);
        return { id: result.insertId };
      }),

    deletePrototype: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { scPrototypes } = await import("../drizzle/schema");
        await db.delete(scPrototypes).where(eqOp(scPrototypes.id, input.id));
        return { success: true };
      }),

    // ── Manufacturing ─────────────────────────────────────────────────────────
    getManufacturing: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { scManufacturing } = await import("../drizzle/schema");
        const rows = await db.select().from(scManufacturing).where(eqOp(scManufacturing.productId, input.productId));
        return rows[0] ?? null;
      }),

    upsertManufacturing: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        productId: z.number(),
        ventureId: z.string(),
        bomJson: z.string().optional(),
        bomVersion: z.string().optional(),
        unitCostGbp: z.number().optional(),
        toolingCostGbp: z.number().optional(),
        moq: z.number().optional(),
        targetUnitCostGbp: z.number().optional(),
        primaryProcess: z.enum(["composite_layup","resin_transfer_moulding","injection_moulding","cnc_machining","3d_printing","casting","forging","assembly","other"]).optional(),
        processComplexityIndex: z.number().min(0).max(100).optional(),
        productionCapacityPerMonth: z.number().optional(),
        leadTimeDays: z.number().optional(),
        manufacturingReadinessScore: z.number().min(0).max(100).optional(),
        readinessNotes: z.string().optional(),
        toolingStatus: z.enum(["not_started","in_design","ordered","received","validated"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { scManufacturing } = await import("../drizzle/schema");
        const { id, ...data } = input;
        if (id) {
          await db.update(scManufacturing).set(data).where(eqOp(scManufacturing.id, id));
          return { id };
        }
        const [result] = await db.insert(scManufacturing).values(data);
        return { id: result.insertId };
      }),

    // ── Suppliers ─────────────────────────────────────────────────────────────
    listSuppliers: protectedProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { scSuppliers } = await import("../drizzle/schema");
        return db.select().from(scSuppliers).where(eqOp(scSuppliers.ventureId, input.ventureId));
      }),

    upsertSupplier: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        ventureId: z.string(),
        name: z.string(),
        supplierType: z.enum(["raw_material","component","sub_assembly","contract_manufacturer","tooling","logistics","testing_lab","other"]).optional(),
        geography: z.enum(["UK","China","EU","USA","India","Other"]).optional(),
        city: z.string().optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().optional(),
        riskScore: z.number().min(0).max(100).optional(),
        qualityScore: z.number().min(0).max(100).optional(),
        leadTimeDays: z.number().optional(),
        unitCostIndex: z.number().optional(),
        esgComplianceStatus: z.enum(["unknown","non_compliant","partial","compliant","certified"]).optional(),
        ethicalSourcingScore: z.number().min(0).max(100).optional(),
        geopoliticalRiskFlag: z.boolean().optional(),
        geopoliticalNotes: z.string().optional(),
        contractStatus: z.enum(["prospect","negotiating","active","paused","terminated"]).optional(),
        certifications: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { scSuppliers } = await import("../drizzle/schema");
        const { id, ...data } = input;
        if (id) {
          await db.update(scSuppliers).set(data).where(eqOp(scSuppliers.id, id));
          return { id };
        }
        const [result] = await db.insert(scSuppliers).values(data);
        return { id: result.insertId };
      }),

    deleteSupplier: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { scSuppliers } = await import("../drizzle/schema");
        await db.delete(scSuppliers).where(eqOp(scSuppliers.id, input.id));
        return { success: true };
      }),

    // ── Production Orders ─────────────────────────────────────────────────────
    listOrders: protectedProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { scProductionOrders } = await import("../drizzle/schema");
        return db.select().from(scProductionOrders).where(eqOp(scProductionOrders.ventureId, input.ventureId));
      }),

    upsertOrder: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        ventureId: z.string(),
        productId: z.number(),
        supplierId: z.number().optional(),
        orderRef: z.string().optional(),
        orderType: z.enum(["pilot","scale","repeat"]).optional(),
        geography: z.enum(["UK","China","EU","USA","Other"]).optional(),
        quantityOrdered: z.number(),
        unitCostGbp: z.number().optional(),
        totalCostGbp: z.number().optional(),
        leadTimeDays: z.number().optional(),
        qaStatus: z.enum(["pending","in_inspection","passed","failed","rework"]).optional(),
        defectRate: z.number().optional(),
        qualityNotes: z.string().optional(),
        shippingMethod: z.enum(["air","sea","road","rail","courier"]).optional(),
        trackingRef: z.string().optional(),
        status: z.enum(["draft","confirmed","in_production","shipped","delivered","cancelled"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { scProductionOrders } = await import("../drizzle/schema");
        const { id, ...data } = input;
        if (id) {
          await db.update(scProductionOrders).set(data).where(eqOp(scProductionOrders.id, id));
          return { id };
        }
        const [result] = await db.insert(scProductionOrders).values(data);
        return { id: result.insertId };
      }),

    deleteOrder: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { scProductionOrders } = await import("../drizzle/schema");
        await db.delete(scProductionOrders).where(eqOp(scProductionOrders.id, input.id));
        return { success: true };
      }),

    // ── Control Tower Summary ─────────────────────────────────────────────────
    getControlTowerSummary: protectedProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { scProducts, scPrototypes, scManufacturing, scSuppliers, scProductionOrders } = await import("../drizzle/schema");

        const [products, prototypes, suppliers, orders] = await Promise.all([
          db.select().from(scProducts).where(eqOp(scProducts.ventureId, input.ventureId)),
          db.select().from(scPrototypes).where(eqOp(scPrototypes.ventureId, input.ventureId)),
          db.select().from(scSuppliers).where(eqOp(scSuppliers.ventureId, input.ventureId)),
          db.select().from(scProductionOrders).where(eqOp(scProductionOrders.ventureId, input.ventureId)),
        ]);

        const manufacturingRows = products.length > 0
          ? await db.select().from(scManufacturing).where(eqOp(scManufacturing.ventureId, input.ventureId))
          : [];

        const avgManufacturingReadiness = manufacturingRows.length > 0
          ? manufacturingRows.reduce((s, r) => s + (r.manufacturingReadinessScore ?? 0), 0) / manufacturingRows.length
          : 0;

        const activeSuppliers = suppliers.filter(s => s.contractStatus === "active").length;
        const highRiskSuppliers = suppliers.filter(s => (s.riskScore ?? 0) > 70).length;
        const geopoliticalFlags = suppliers.filter(s => s.geopoliticalRiskFlag).length;

        const activeOrders = orders.filter(o => ["confirmed","in_production","shipped"].includes(o.status ?? "")).length;
        const totalUnitsOrdered = orders.reduce((s, o) => s + (o.quantityOrdered ?? 0), 0);
        const totalProductionCostGbp = orders.reduce((s, o) => s + (o.totalCostGbp ?? 0), 0);

        const avgEsgScore = suppliers.length > 0
          ? suppliers.reduce((s, sup) => s + (sup.ethicalSourcingScore ?? 50), 0) / suppliers.length
          : 0;

        const avgDefectRate = orders.filter(o => o.defectRate != null).length > 0
          ? orders.reduce((s, o) => s + (o.defectRate ?? 0), 0) / orders.filter(o => o.defectRate != null).length
          : 0;

        // Digital thread stage distribution
        const stageMap: Record<string, number> = {
          concept: 0, design: 0, prototype_v1: 0, prototype_v2: 0,
          validated: 0, production_ready: 0,
        };
        products.forEach(p => { stageMap[p.prototypeStatus ?? "concept"]++; });

        return {
          totalProducts: products.length,
          totalPrototypes: prototypes.length,
          totalSuppliers: suppliers.length,
          activeSuppliers,
          highRiskSuppliers,
          geopoliticalFlags,
          avgManufacturingReadiness: Math.round(avgManufacturingReadiness),
          activeOrders,
          totalUnitsOrdered,
          totalProductionCostGbp,
          avgEsgScore: Math.round(avgEsgScore),
          avgDefectRate: parseFloat(avgDefectRate.toFixed(2)),
          stageDistribution: stageMap,
          ukProducts: products.filter(p => p.productionGeography === "UK" || p.productionGeography === "Both").length,
          chinaProducts: products.filter(p => p.productionGeography === "China" || p.productionGeography === "Both").length,
        };
      }),

    // ── Manufacturing Readiness Score Calculator ──────────────────────────────
    computeManufacturingReadiness: protectedProcedure
      .input(z.object({
        trlLevel: z.number().min(1).max(9),
        cadStatus: z.enum(["not_started","in_progress","complete","validated"]),
        labTestStatus: z.enum(["not_started","in_progress","passed","failed"]),
        toolingStatus: z.enum(["not_started","in_design","ordered","received","validated"]),
        supplierCount: z.number().min(0),
        bomComplete: z.boolean(),
        esgCompliant: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        // TRL contribution (40%)
        const trlScore = (input.trlLevel / 9) * 40;

        // CAD/CAE contribution (20%)
        const cadMap: Record<string, number> = { not_started: 0, in_progress: 10, complete: 16, validated: 20 };
        const cadScore = cadMap[input.cadStatus] ?? 0;

        // Lab test contribution (20%)
        const labMap: Record<string, number> = { not_started: 0, in_progress: 10, passed: 20, failed: 5 };
        const labScore = labMap[input.labTestStatus] ?? 0;

        // Tooling contribution (10%)
        const toolMap: Record<string, number> = { not_started: 0, in_design: 3, ordered: 6, received: 8, validated: 10 };
        const toolScore = toolMap[input.toolingStatus] ?? 0;

        // Supplier + BOM + ESG (10%)
        const supScore = Math.min(4, input.supplierCount * 1.5);
        const bomScore = input.bomComplete ? 3 : 0;
        const esgScore = input.esgCompliant ? 3 : 0;
        const operationalScore = Math.min(10, supScore + bomScore + esgScore);

        const total = Math.round(trlScore + cadScore + labScore + toolScore + operationalScore);

        let readinessLevel: string;
        if (total >= 80) readinessLevel = "Production Ready";
        else if (total >= 60) readinessLevel = "Pilot Ready";
        else if (total >= 40) readinessLevel = "Validation Stage";
        else if (total >= 20) readinessLevel = "Prototype Stage";
        else readinessLevel = "Concept Stage";

        return {
          score: total,
          readinessLevel,
          breakdown: { trlScore, cadScore, labScore, toolScore, operationalScore },
        };
      }),
  }),
  mfgPlaybook: router({
    // ── Projects ──────────────────────────────────────────────────────────────
    listProjects: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { mfgPlaybookProjects } = await import("../drizzle/schema");
        return db.select().from(mfgPlaybookProjects)
          .where(eqOp(mfgPlaybookProjects.ventureId, input.ventureId))
          .orderBy(mfgPlaybookProjects.createdAt);
      }),

    getProject: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { mfgPlaybookProjects } = await import("../drizzle/schema");
        const rows = await db.select().from(mfgPlaybookProjects)
          .where(eqOp(mfgPlaybookProjects.id, input.id));
        return rows[0] ?? null;
      }),

    upsertProject: publicProcedure
      .input(z.object({
        id: z.number().optional(),
        ventureId: z.string(),
        productName: z.string(),
        description: z.string().optional(),
        phase: z.enum(["uk_prototype", "china_feasibility", "pilot_production", "scale_manufacturing"]).optional(),
        ukPrototypeDone: z.number().optional(),
        chinaFeasibilityDone: z.number().optional(),
        pilotProductionDone: z.number().optional(),
        scaleManufacturingDone: z.number().optional(),
        trlLevel: z.number().optional(),
        prototypeStatus: z.enum(["not_started", "in_progress", "validated", "failed"]).optional(),
        validationNotes: z.string().optional(),
        rfqSent: z.number().optional(),
        dfmComplete: z.number().optional(),
        toolingOwnershipAgreement: z.number().optional(),
        pilotVolume: z.number().optional(),
        scaleVolume: z.number().optional(),
        targetUnitCostGbp: z.number().optional(),
        materialCostGbp: z.number().optional(),
        labourCostGbp: z.number().optional(),
        overheadCostGbp: z.number().optional(),
        logisticsCostGbp: z.number().optional(),
        marginPercent: z.number().optional(),
        iso9001: z.number().optional(),
        iso14001: z.number().optional(),
        ceCertified: z.number().optional(),
        ukcaCertified: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { mfgPlaybookProjects } = await import("../drizzle/schema");
        const { id, ...data } = input;
        if (id) {
          await db.update(mfgPlaybookProjects).set({ ...data, updatedAt: new Date() })
            .where(eqOp(mfgPlaybookProjects.id, id));
          return { id };
        }
        const result = await db.insert(mfgPlaybookProjects).values(data as any);
        return { id: (result as any).insertId as number };
      }),

    deleteProject: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { mfgPlaybookProjects } = await import("../drizzle/schema");
        await db.delete(mfgPlaybookProjects).where(eqOp(mfgPlaybookProjects.id, input.id));
        return { success: true };
      }),

    advancePhase: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { mfgPlaybookProjects } = await import("../drizzle/schema");
        const phases = ["uk_prototype", "china_feasibility", "pilot_production", "scale_manufacturing"] as const;
        const rows = await db.select().from(mfgPlaybookProjects)
          .where(eqOp(mfgPlaybookProjects.id, input.id));
        const project = rows[0];
        if (!project) throw new Error("Project not found");
        const currentIdx = phases.indexOf(project.phase as any);
        const nextPhase = phases[Math.min(currentIdx + 1, phases.length - 1)];
        // Mark current phase done
        const doneField = [
          "ukPrototypeDone", "chinaFeasibilityDone", "pilotProductionDone", "scaleManufacturingDone"
        ][currentIdx] as keyof typeof project;
        await db.update(mfgPlaybookProjects)
          .set({ phase: nextPhase, [doneField]: 1, updatedAt: new Date() })
          .where(eqOp(mfgPlaybookProjects.id, input.id));
        return { phase: nextPhase };
      }),

    // ── Supplier Tiers ────────────────────────────────────────────────────────
    listSuppliers: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { mfgSupplierTiers } = await import("../drizzle/schema");
        return db.select().from(mfgSupplierTiers)
          .where(eqOp(mfgSupplierTiers.projectId, input.projectId))
          .orderBy(mfgSupplierTiers.tier);
      }),

    upsertSupplier: publicProcedure
      .input(z.object({
        id: z.number().optional(),
        projectId: z.number(),
        ventureId: z.string(),
        supplierName: z.string(),
        tier: z.enum(["tier1_oem", "tier2_components", "tier3_raw_materials", "tier4_tooling"]),
        country: z.string().optional(),
        city: z.string().optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().optional(),
        nnnAgreement: z.enum(["none", "sent", "signed"]).optional(),
        manufacturingContract: z.enum(["none", "draft", "signed"]).optional(),
        toolingOwnership: z.enum(["none", "partial", "full"]).optional(),
        blackBoxComponents: z.number().optional(),
        riskScore: z.number().min(0).max(100).optional(),
        auditScore: z.number().min(0).max(100).optional(),
        qualityScore: z.number().min(0).max(100).optional(),
        isDualSource: z.number().optional(),
        primarySupplierId: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { mfgSupplierTiers } = await import("../drizzle/schema");
        const { id, ...data } = input;
        if (id) {
          await db.update(mfgSupplierTiers).set({ ...data, updatedAt: new Date() })
            .where(eqOp(mfgSupplierTiers.id, id));
          return { id };
        }
        const result = await db.insert(mfgSupplierTiers).values(data as any);
        return { id: (result as any).insertId as number };
      }),

    deleteSupplier: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { mfgSupplierTiers } = await import("../drizzle/schema");
        await db.delete(mfgSupplierTiers).where(eqOp(mfgSupplierTiers.id, input.id));
        return { success: true };
      }),

    // ── QC Reports ────────────────────────────────────────────────────────────
    listQcReports: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { mfgQcReports } = await import("../drizzle/schema");
        return db.select().from(mfgQcReports)
          .where(eqOp(mfgQcReports.projectId, input.projectId))
          .orderBy(mfgQcReports.createdAt);
      }),

    upsertQcReport: publicProcedure
      .input(z.object({
        id: z.number().optional(),
        projectId: z.number(),
        ventureId: z.string(),
        reportType: z.enum(["pre_production", "in_line", "pre_shipment_aql"]),
        inspectionDate: z.date().optional(),
        inspector: z.string().optional(),
        supplierId: z.number().optional(),
        sampleSize: z.number().optional(),
        defectsFound: z.number().optional(),
        aqlLevel: z.string().optional(),
        result: z.enum(["pass", "fail", "conditional_pass", "pending"]).optional(),
        iso9001Pass: z.number().optional(),
        iso14001Pass: z.number().optional(),
        cePass: z.number().optional(),
        ukcastPass: z.number().optional(),
        findings: z.string().optional(),
        correctiveActions: z.string().optional(),
        attachmentUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { mfgQcReports } = await import("../drizzle/schema");
        const { id, ...data } = input;
        if (id) {
          await db.update(mfgQcReports).set({ ...data, updatedAt: new Date() })
            .where(eqOp(mfgQcReports.id, id));
          return { id };
        }
        const result = await db.insert(mfgQcReports).values(data as any);
        return { id: (result as any).insertId as number };
      }),

    deleteQcReport: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { mfgQcReports } = await import("../drizzle/schema");
        await db.delete(mfgQcReports).where(eqOp(mfgQcReports.id, input.id));
        return { success: true };
      }),

    // ── Logistics Shipments ───────────────────────────────────────────────────
    listShipments: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { mfgLogisticsShipments } = await import("../drizzle/schema");
        return db.select().from(mfgLogisticsShipments)
          .where(eqOp(mfgLogisticsShipments.projectId, input.projectId))
          .orderBy(mfgLogisticsShipments.createdAt);
      }),

    upsertShipment: publicProcedure
      .input(z.object({
        id: z.number().optional(),
        projectId: z.number(),
        ventureId: z.string(),
        shipmentRef: z.string().optional(),
        freightType: z.enum(["sea", "air", "rail", "road"]),
        originPort: z.enum(["shenzhen", "shanghai", "ningbo", "qingdao", "guangzhou", "tianjin", "other"]).optional(),
        destinationPort: z.string().optional(),
        volume: z.number().optional(),
        weightKg: z.number().optional(),
        freightCostGbp: z.number().optional(),
        dutiesGbp: z.number().optional(),
        insuranceGbp: z.number().optional(),
        leadTimeDays: z.number().optional(),
        departureDate: z.date().optional(),
        arrivalDate: z.date().optional(),
        status: z.enum(["planned", "booked", "in_transit", "customs", "delivered", "delayed"]).optional(),
        trackingRef: z.string().optional(),
        forwarder: z.string().optional(),
        incoterms: z.enum(["EXW", "FOB", "CIF", "DDP", "DAP"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { mfgLogisticsShipments } = await import("../drizzle/schema");
        const { id, ...data } = input;
        if (id) {
          await db.update(mfgLogisticsShipments).set({ ...data, updatedAt: new Date() })
            .where(eqOp(mfgLogisticsShipments.id, id));
          return { id };
        }
        const result = await db.insert(mfgLogisticsShipments).values(data as any);
        return { id: (result as any).insertId as number };
      }),

    deleteShipment: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { mfgLogisticsShipments } = await import("../drizzle/schema");
        await db.delete(mfgLogisticsShipments).where(eqOp(mfgLogisticsShipments.id, input.id));
        return { success: true };
      }),

    // ── Dynamic Cost Model ────────────────────────────────────────────────────
    computeCostModel: publicProcedure
      .input(z.object({
        materialCostGbp: z.number(),
        labourCostGbp: z.number(),
        overheadCostGbp: z.number(),
        logisticsCostGbp: z.number(),
        marginPercent: z.number(),
        volumes: z.array(z.number()),
      }))
      .query(({ input }) => {
        const totalCost = input.materialCostGbp + input.labourCostGbp + input.overheadCostGbp + input.logisticsCostGbp;
        const sellingPrice = totalCost * (1 + input.marginPercent / 100);
        const breakdown = input.volumes.map(vol => ({
          volume: vol,
          materialTotal: input.materialCostGbp * vol,
          labourTotal: input.labourCostGbp * vol,
          overheadTotal: input.overheadCostGbp * vol,
          logisticsTotal: input.logisticsCostGbp * vol,
          totalCost: totalCost * vol,
          sellingPricePerUnit: sellingPrice,
          revenue: sellingPrice * vol,
          grossProfit: (sellingPrice - totalCost) * vol,
          grossMarginPct: ((sellingPrice - totalCost) / sellingPrice) * 100,
        }));
        return { totalCost, sellingPrice, breakdown };
      }),

    // ── Playbook Summary ──────────────────────────────────────────────────────
    getPlaybookSummary: publicProcedure
      .input(z.object({ ventureId: z.string() }))
      .query(async ({ input }) => {
        const db = (await getDb())!;
        const { eq: eqOp } = await import("drizzle-orm");
        const { mfgPlaybookProjects, mfgSupplierTiers, mfgQcReports, mfgLogisticsShipments } = await import("../drizzle/schema");
        const projects = await db.select().from(mfgPlaybookProjects)
          .where(eqOp(mfgPlaybookProjects.ventureId, input.ventureId));
        const projectIds = projects.map(p => p.id);
        if (projectIds.length === 0) return { projects: 0, suppliers: 0, qcReports: 0, shipments: 0, activeShipments: 0, phaseBreakdown: {} };
        const { inArray } = await import("drizzle-orm");
        const [suppliers, qcReports, shipments] = await Promise.all([
          db.select().from(mfgSupplierTiers).where(inArray(mfgSupplierTiers.projectId, projectIds)),
          db.select().from(mfgQcReports).where(inArray(mfgQcReports.projectId, projectIds)),
          db.select().from(mfgLogisticsShipments).where(inArray(mfgLogisticsShipments.projectId, projectIds)),
        ]);
        const phaseBreakdown = projects.reduce((acc, p) => {
          acc[p.phase] = (acc[p.phase] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const activeShipments = shipments.filter(s => ["booked", "in_transit", "customs"].includes(s.status || "")).length;
        const nnnSigned = suppliers.filter(s => s.nnnAgreement === "signed").length;
        const qcPassRate = qcReports.length > 0
          ? (qcReports.filter(r => r.result === "pass").length / qcReports.length) * 100
          : 0;
        return {
          projects: projects.length,
          suppliers: suppliers.length,
          qcReports: qcReports.length,
          shipments: shipments.length,
          activeShipments,
          nnnSigned,
          qcPassRate: Math.round(qcPassRate),
          phaseBreakdown,
        };
      }),
  }),

  mfgOnboarding: mfgOnboardingRouter,
  mfgAudit: mfgAuditRouter,
  mfgRfq: mfgRfqRouter,
  mfgAsl: mfgAslRouter,
  mfgContracts: mfgContractRouter,
  uniPartners: uniPartnersRouter,
  uniResearch: uniResearchRouter,
  uniTalent: uniTalentRouter,
  uniWorkflow: uniWorkflowRouter,
  uniIndustry: uniIndustryRouter,
  uniGovernance: uniGovernanceRouter,
  uniData: uniDataRouter,
  uniRoadmap: uniRoadmapRouter,
  uniSummary: uniSummaryRouter,
  uniApprovalReport: uniApprovalReportRouter,
  workflowEngine: workflowEngineRouter,
  commercialCrm: commercialCrmRouter,
  investorCrm: investorCrmRouter,

  dmAssets: dmAssetsRouter,
  dmQuality: dmQualityRouter,
  dmPipelines: dmPipelinesRouter,
  dmRag: dmRagRouter,
  dmFineTuning: dmFineTuningRouter,
  dmFeedback: dmFeedbackRouter,
  dmSummary: dmSummaryRouter,
  governance: governanceRouter,
  finPl: finPlRouter,
  finRunway: finRunwayRouter,
  finWaterfall: finWaterfallRouter,
  finReports: finReportsRouter,
  finUnitEcon: finUnitEconRouter,
  finSummary: finSummaryRouter,
  marketingBrand: marketingBrandRouter,
  specialistServices: specialistServicesRouter,
  portfoliosOfferings: portfoliosOfferingsRouter,
  spinoutBlueprint: spinoutBlueprintRouter,
  crl: crlRouter,
  investmentModule: investmentModuleRouter,
  ecoraceLab: ecoraceLab,
  investorDataRoom: investorDataRoomRouter,
  learningEngine: learningEngineRouter,
  ipIntelligence: ipIntelligenceRouter,
  playbook: playbookRouter,
  gdriveWorkspace: gdriveWorkspaceRouter,
  vrlDashboardV4: vrlDashboardV4Router,
  spinoffSequence: spinoffSequenceRouter,
  brandPipeline: brandPipelineRouter,
  insightAutomation: insightAutomationRouter,
  srl: srlRouter,
  mrl: mrlRouter,
  sync: syncRouter,
  vrl: vrlRouter,
  mrlScoring: mrlScoringRouter,
});
export type AppRouter = typeof appRouter;
