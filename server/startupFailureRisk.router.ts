import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";

import {
  startupFailureRiskScores,
  burnRateMetrics,
  customerValidationEvidence,
  revenueModelAssessments,
  executionVelocityMetrics,
  teamCompetencyAssessments,
  flexibilityPivotLogs,
  fundingProgressionMetrics,
  marketTimingSignals,
  strategicRoadmapAssessments,
  failureRiskAlerts,
  contingencyPlaybooks,
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// ============================================================================
// FAILURE RISK SCORING ENGINE
// ============================================================================

/**
 * Calculate a single risk sub-score (0-100) from available metrics
 */
function calculateCashRunwayRisk(burnMetric: any): number {
  if (!burnMetric) return 50; // Default medium risk if no data
  const runway = burnMetric.runwayMonths || 0;
  if (runway < 3) return 100; // Critical
  if (runway < 6) return 80;  // High
  if (runway < 12) return 50; // Medium
  return 20; // Low
}

function calculateCustomerValidationRisk(evidence: any): number {
  if (!evidence) return 60; // Default medium-high risk if no data
  const fitScore = evidence.problemSolutionFitScore || 0;
  const painScore = evidence.painIntensityScore || 0;
  const avgScore = (fitScore + painScore) / 2;
  return Math.max(0, 100 - avgScore); // Inverse: higher evidence = lower risk
}

function calculateRevenueModelRisk(revenue: any): number {
  if (!revenue) return 70; // Default high risk if no data
  const confidenceScore = revenue.revenueConfidenceScore || 0;
  return Math.max(0, 100 - confidenceScore);
}

function calculateExecutionVelocityRisk(execution: any): number {
  if (!execution) return 60; // Default medium-high risk if no data
  const deliveryConfidence = execution.deliveryConfidenceScore || 0;
  const completionRate = execution.completedMilestones / Math.max(execution.plannedMilestones, 1);
  const avgScore = (deliveryConfidence + (completionRate * 100)) / 2;
  return Math.max(0, 100 - avgScore);
}

function calculateTeamCompetencyRisk(team: any): number {
  if (!team) return 70; // Default high risk if no data
  const aggregateScore = team.aggregateTeamScore || 0;
  return Math.max(0, 100 - aggregateScore);
}

function calculateFlexibilityRisk(flexibility: any): number {
  if (!flexibility) return 50; // Default medium risk if no data
  const adaptabilityScore = flexibility.adaptabilityScore || 0;
  const overridesCount = flexibility.recommendationsOverridden || 0;
  // Higher overrides = higher risk
  const overrideRisk = Math.min(overridesCount * 10, 50);
  return Math.max(0, (100 - adaptabilityScore) / 2 + overrideRisk);
}

function calculateFundingProgressionRisk(funding: any): number {
  if (!funding) return 65; // Default medium-high risk if no data
  const investorReadiness = funding.investorReadinessScore || 0;
  const fundingGap = funding.fundingGap || 0;
  const capitalRequired = funding.capitalRequired || 1;
  const gapRatio = fundingGap / capitalRequired;
  const gapRisk = Math.min(gapRatio * 100, 100);
  return (100 - investorReadiness) / 2 + gapRisk / 2;
}

function calculateMarketTimingRisk(market: any): number {
  if (!market) return 55; // Default medium risk if no data
  const growthScore = market.marketGrowthScore || 0;
  const adoptionScore = market.adoptionReadinessScore || 0;
  const regulatoryScore = market.regulatoryRiskScore || 0;
  const avgScore = (growthScore + adoptionScore) / 2;
  return Math.max(0, (100 - avgScore) / 2 + regulatoryScore / 2);
}

function calculateStrategicRoadmapRisk(roadmap: any): number {
  if (!roadmap) return 80; // Default high risk if no roadmap
  if (!roadmap.roadmapExistsBoolean) return 100; // Critical if no roadmap
  const qualityScore = roadmap.milestoneQualityScore || 0;
  const clarityScore = roadmap.stageGateClarityScore || 0;
  const completenessScore = roadmap.executionPlanCompletenessScore || 0;
  const avgScore = (qualityScore + clarityScore + completenessScore) / 3;
  return Math.max(0, 100 - avgScore);
}

/**
 * Calculate overall failure risk score using 9-factor weighted model
 * Weights: Cash 15%, Customer 15%, Revenue 12%, Execution 12%, Team 12%, Flexibility 10%, Funding 10%, Market 8%, Roadmap 6%
 */
function calculateOverallFailureRiskScore(
  cashRisk: number,
  customerRisk: number,
  revenueRisk: number,
  executionRisk: number,
  teamRisk: number,
  flexibilityRisk: number,
  fundingRisk: number,
  marketRisk: number,
  roadmapRisk: number
): number {
  const overall =
    (cashRisk * 0.15) +
    (customerRisk * 0.15) +
    (revenueRisk * 0.12) +
    (executionRisk * 0.12) +
    (teamRisk * 0.12) +
    (flexibilityRisk * 0.10) +
    (fundingRisk * 0.10) +
    (marketRisk * 0.08) +
    (roadmapRisk * 0.06);
  return Math.round(overall);
}

function getRiskBand(score: number): "Green" | "Amber" | "Red" {
  if (score <= 34) return "Green";
  if (score <= 69) return "Amber";
  return "Red";
}

// ============================================================================
// tRPC PROCEDURES
// ============================================================================

export const startupFailureRiskRouter = router({
  /**
   * Calculate and store failure risk score for a venture
   */
  calculateFailureRiskScore: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { ventureId } = input;

      // Fetch latest metrics from each table
      const [burnMetric] = await db
        .select()
        .from(burnRateMetrics)
        .where(eq(burnRateMetrics.ventureId, ventureId))
        .orderBy((t) => t.createdAt)
        .limit(1);

      const [evidence] = await db
        .select()
        .from(customerValidationEvidence)
        .where(eq(customerValidationEvidence.ventureId, ventureId))
        .orderBy((t) => t.createdAt)
        .limit(1);

      const [revenue] = await db
        .select()
        .from(revenueModelAssessments)
        .where(eq(revenueModelAssessments.ventureId, ventureId))
        .orderBy((t) => t.createdAt)
        .limit(1);

      const [execution] = await db
        .select()
        .from(executionVelocityMetrics)
        .where(eq(executionVelocityMetrics.ventureId, ventureId))
        .orderBy((t) => t.createdAt)
        .limit(1);

      const [team] = await db
        .select()
        .from(teamCompetencyAssessments)
        .where(eq(teamCompetencyAssessments.ventureId, ventureId))
        .orderBy((t) => t.createdAt)
        .limit(1);

      const [flexibility] = await db
        .select()
        .from(flexibilityPivotLogs)
        .where(eq(flexibilityPivotLogs.ventureId, ventureId))
        .orderBy((t) => t.loggedAt)
        .limit(1);

      const [funding] = await db
        .select()
        .from(fundingProgressionMetrics)
        .where(eq(fundingProgressionMetrics.ventureId, ventureId))
        .orderBy((t) => t.createdAt)
        .limit(1);

      const [market] = await db
        .select()
        .from(marketTimingSignals)
        .where(eq(marketTimingSignals.ventureId, ventureId))
        .orderBy((t) => t.collectedAt)
        .limit(1);

      const [roadmap] = await db
        .select()
        .from(strategicRoadmapAssessments)
        .where(eq(strategicRoadmapAssessments.ventureId, ventureId))
        .orderBy((t) => t.createdAt)
        .limit(1);

      // Calculate all sub-scores
      const cashRunwayRisk = calculateCashRunwayRisk(burnMetric);
      const customerValidationRisk = calculateCustomerValidationRisk(evidence);
      const revenueModelRisk = calculateRevenueModelRisk(revenue);
      const executionVelocityRisk = calculateExecutionVelocityRisk(execution);
      const teamCompetencyRisk = calculateTeamCompetencyRisk(team);
      const flexibilityRisk = calculateFlexibilityRisk(flexibility);
      const fundingProgressionRisk = calculateFundingProgressionRisk(funding);
      const marketTimingRisk = calculateMarketTimingRisk(market);
      const strategicRoadmapRisk = calculateStrategicRoadmapRisk(roadmap);

      // Calculate overall score
      const overallFailureRiskScore = calculateOverallFailureRiskScore(
        cashRunwayRisk,
        customerValidationRisk,
        revenueModelRisk,
        executionVelocityRisk,
        teamCompetencyRisk,
        flexibilityRisk,
        fundingProgressionRisk,
        marketTimingRisk,
        strategicRoadmapRisk
      );

      const riskBand = getRiskBand(overallFailureRiskScore);

      // Upsert the score record
      const id = `risk-${ventureId}-${Date.now()}`;
      const existing = await db
        .select()
        .from(startupFailureRiskScores)
        .where(eq(startupFailureRiskScores.ventureId, ventureId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(startupFailureRiskScores)
          .set({
            overallFailureRiskScore,
            cashRunwayRisk,
            customerValidationRisk,
            revenueModelRisk,
            executionVelocityRisk,
            teamCompetencyRisk,
            flexibilityRisk,
            fundingProgressionRisk,
            marketTimingRisk,
            strategicRoadmapRisk,
            riskBand,
            calculatedAt: new Date(),
          })
          .where(eq(startupFailureRiskScores.ventureId, ventureId));
      } else {
        await db.insert(startupFailureRiskScores).values({
          id,
          ventureId,
          overallFailureRiskScore,
          cashRunwayRisk,
          customerValidationRisk,
          revenueModelRisk,
          executionVelocityRisk,
          teamCompetencyRisk,
          flexibilityRisk,
          fundingProgressionRisk,
          marketTimingRisk,
          strategicRoadmapRisk,
          riskBand,
        });
      }

      return {
        ventureId,
        overallFailureRiskScore,
        cashRunwayRisk,
        customerValidationRisk,
        revenueModelRisk,
        executionVelocityRisk,
        teamCompetencyRisk,
        flexibilityRisk,
        fundingProgressionRisk,
        marketTimingRisk,
        strategicRoadmapRisk,
        riskBand,
      };
    }),

  /**
   * Get failure risk score for a venture
   */
  getFailureRiskScore: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [score] = await db
        .select()
        .from(startupFailureRiskScores)
        .where(eq(startupFailureRiskScores.ventureId, input.ventureId))
        .limit(1);

      return score || null;
    }),

  /**
   * Get all failure risk scores for portfolio view
   */
  getPortfolioFailureRiskScores: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return db.select().from(startupFailureRiskScores);
  }),

  /**
   * Store burn rate metrics
   */
  recordBurnRateMetrics: protectedProcedure
    .input(
      z.object({
        ventureId: z.string(),
        monthlyBurnRate: z.number(),
        cashBalance: z.number(),
        monthlyRevenue: z.number().optional(),
        runwayMonths: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const netBurn = input.monthlyBurnRate - (input.monthlyRevenue || 0);
      const id = `risk-${input.ventureId}-${Date.now()}`;

      await db.insert(burnRateMetrics).values({
        id,
        ventureId: input.ventureId,
        monthlyBurnRate: input.monthlyBurnRate,
        cashBalance: input.cashBalance,
        monthlyRevenue: input.monthlyRevenue || 0,
        netBurn,
        runwayMonths: input.runwayMonths,
        alertStatus: input.runwayMonths < 3 ? "Red" : input.runwayMonths < 6 ? "Amber" : "Green",
      });

      return { id, success: true };
    }),

  /**
   * Record customer validation evidence
   */
  recordCustomerValidationEvidence: protectedProcedure
    .input(
      z.object({
        ventureId: z.string(),
        customerSegment: z.string(),
        interviewCount: z.number(),
        painIntensityScore: z.number(),
        problemSolutionFitScore: z.number(),
        evidenceQualityScore: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const id = `risk-${input.ventureId}-${Date.now()}`;
      await db.insert(customerValidationEvidence).values({
        id,
        ventureId: input.ventureId,
        customerSegment: input.customerSegment,
        interviewCount: input.interviewCount,
        painIntensityScore: input.painIntensityScore,
        problemSolutionFitScore: input.problemSolutionFitScore,
        evidenceQualityScore: input.evidenceQualityScore,
        validatedProblem: input.problemSolutionFitScore >= 50,
      });

      return { id, success: true };
    }),

  /**
   * Get active failure risk alerts for a venture
   */
  getActiveAlerts: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(failureRiskAlerts)
        .where(
          and(
            eq(failureRiskAlerts.ventureId, input.ventureId),
            eq(failureRiskAlerts.status, "Active")
          )
        );
    }),

  /**
   * Get contingency playbooks by risk type
   */
  getContingencyPlaybooks: protectedProcedure
    .input(z.object({ riskType: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(contingencyPlaybooks)
        .where(eq(contingencyPlaybooks.riskType, input.riskType));
    }),
});
