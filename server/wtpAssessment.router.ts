/**
 * WTP Assessment Router — Commercial Validation Layer
 * Implements: WTP scoring, evidence ladder, auto-risk creation, Command Centre integration
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { sql } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// PURE SCORING UTILITIES (exported for testing)
// ─────────────────────────────────────────────────────────────────────────────

export function calculateEvidenceLevelScore(level: number): number {
  const map: Record<number, number> = { 1: 10, 2: 25, 3: 40, 4: 55, 5: 70, 6: 85, 7: 100 };
  return map[level] ?? 0;
}

export function calculateBudgetOwnerScore(status: string): number {
  if (status === "confirmed") return 100;
  if (status === "partially_known") return 50;
  return 0; // unknown
}

export function calculateProcurementPathwayScore(status: string): number {
  const map: Record<string, number> = {
    validated: 100, feasible: 75, mapped: 60,
    high_friction: 40, unknown: 25, blocked: 0,
  };
  return map[status] ?? 25;
}

export function calculatePricingResponseScore(response: string): number {
  const map: Record<string, number> = {
    accepted: 100, negotiating: 75, needs_roi_proof: 50,
    price_resistance: 25, rejected: 0,
  };
  return map[response] ?? 0;
}

export function calculateWTPScore(params: {
  evidenceLevel: number;
  budgetOwnerStatus: string;
  procurementPathwayStatus: string;
  pricingResponse: string;
}): number {
  const evidenceScore = calculateEvidenceLevelScore(params.evidenceLevel);
  const budgetScore = calculateBudgetOwnerScore(params.budgetOwnerStatus);
  const procurementScore = calculateProcurementPathwayScore(params.procurementPathwayStatus);
  const pricingScore = calculatePricingResponseScore(params.pricingResponse);

  const raw =
    evidenceScore * 0.50 +
    budgetScore * 0.20 +
    procurementScore * 0.15 +
    pricingScore * 0.15;

  return Math.round(Math.max(0, Math.min(100, raw)));
}

export function calculateVentureWTPStatus(tests: { wtp_score: number; evidence_level: number }[]): string {
  if (!tests || tests.length === 0) return "not_tested";
  const hasLevel7 = tests.some(t => t.evidence_level >= 7);
  const avgScore = tests.reduce((s, t) => s + (t.wtp_score ?? 0), 0) / tests.length;
  if (hasLevel7 || avgScore >= 80) return "validated";
  if (avgScore >= 60) return "strong";
  if (avgScore >= 40) return "emerging";
  return "weak";
}

export function generateWTPDecisionRecommendation(score: number, evidenceLevel: number, budgetOwnerStatus: string, procurementStatus: string): {
  decision: string;
  label: string;
  description: string;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (evidenceLevel <= 2) {
    warnings.push("Positive interest is not commercial validation. Evidence Level 1–2 only indicates weak interest signals.");
  }
  if (budgetOwnerStatus === "unknown") {
    warnings.push("WTP is not validated until the economic buyer or budget owner is identified.");
  }
  if (procurementStatus === "blocked") {
    warnings.push("Adoption may be blocked even if buyer interest exists. Procurement pathway is blocked.");
  }

  if (score >= 80) {
    return {
      decision: "proceed_to_paid_pilot",
      label: "Proceed to Paid Pilot / LOI / MVP Validation",
      description: "High-confidence WTP. Strong commercial evidence supports proceeding to paid pilot, LOI, or MVP validation.",
      warnings,
    };
  }
  if (score >= 60) {
    return {
      decision: "strengthen_evidence",
      label: "Strengthen Commercial Evidence",
      description: "Strong commercial signal. Clarify procurement pathway and strengthen budget-owner evidence before MVP build.",
      warnings,
    };
  }
  if (score >= 40) {
    return {
      decision: "run_another_test",
      label: "Run Another Pricing or Budget-Owner Test",
      description: "Early commercial signal. Run another pricing interview or budget-holder meeting to validate commitment.",
      warnings,
    };
  }
  return {
    decision: "do_not_proceed",
    label: "Do Not Proceed to MVP Build",
    description: "Weak WTP. Pivot value proposition, customer segment, or pricing model before investing in MVP development.",
    warnings,
  };
}

export function generateWTPWarnings(params: {
  score: number;
  evidenceLevel: number;
  budgetOwnerStatus: string;
  procurementStatus: string;
  objectionCategory?: string | null;
}): string[] {
  const warnings: string[] = [];
  if (params.evidenceLevel <= 2) warnings.push("Interest signal only — not commercial validation");
  if (params.budgetOwnerStatus === "unknown") warnings.push("Budget owner unknown — identify economic buyer");
  if (params.procurementStatus === "blocked") warnings.push("Procurement pathway blocked — adoption risk");
  if (params.procurementStatus === "unknown") warnings.push("Procurement pathway not mapped");
  if (params.objectionCategory === "data_sharing_concern") warnings.push("Data sharing concern — consider data partnership or anonymised pilot");
  if (params.objectionCategory === "trust_barrier") warnings.push("Trust barrier — build credibility before commercial conversation");
  if (params.score < 40) warnings.push("WTP score below 40 — do not proceed to MVP build");
  return warnings;
}

export function calculatePricingConversionRate(positive: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((positive / total) * 100 * 100) / 100;
}

export function calculateProcurementFrictionScore(params: {
  complexityScore: number;
  salesCycleDays: number;
  legalReviewRequired: boolean;
  dataSecurityReviewRequired: boolean;
  pilotPossibleWithoutProcurement: boolean;
}): number {
  let score = params.complexityScore * 20; // 20-100 base
  if (params.salesCycleDays > 180) score += 15;
  else if (params.salesCycleDays > 90) score += 8;
  if (params.legalReviewRequired) score += 10;
  if (params.dataSecurityReviewRequired) score += 10;
  if (!params.pilotPossibleWithoutProcurement) score += 15;
  return Math.min(100, Math.round(score));
}

// ─────────────────────────────────────────────────────────────────────────────
// EVIDENCE LADDER DEFINITION
// ─────────────────────────────────────────────────────────────────────────────

export const EVIDENCE_LADDER = [
  {
    level: 1, score: 10, label: "Customer says 'interesting'",
    strength: "Very Weak", proves: "Awareness and curiosity",
    doesNotProve: "Any buying intent, budget, or commitment",
    isWTP: false,
  },
  {
    level: 2, score: 25, label: "Customer agrees to another meeting",
    strength: "Weak", proves: "Continued interest",
    doesNotProve: "Budget access, procurement intent, or willingness to pay",
    isWTP: false,
  },
  {
    level: 3, score: 40, label: "Customer shares internal or operational data",
    strength: "Moderate", proves: "Operational commitment and trust",
    doesNotProve: "Budget authority or purchase decision",
    isWTP: true,
  },
  {
    level: 4, score: 55, label: "Customer introduces a budget holder",
    strength: "Moderate-Strong", proves: "Access to budget authority",
    doesNotProve: "Budget availability or procurement approval",
    isWTP: true,
  },
  {
    level: 5, score: 70, label: "Customer requests a proposal",
    strength: "Strong", proves: "Buying-process movement and serious intent",
    doesNotProve: "Budget approval or final purchase decision",
    isWTP: true,
  },
  {
    level: 6, score: 85, label: "Customer signs an LOI or formal pilot agreement",
    strength: "Very Strong", proves: "Formal intent and procurement engagement",
    doesNotProve: "Final payment or full commercial deployment",
    isWTP: true,
  },
  {
    level: 7, score: 100, label: "Customer pays for a pilot or purchase order",
    strength: "Confirmed", proves: "Real willingness to pay — commercial validation",
    doesNotProve: "Scale or repeat purchase (yet)",
    isWTP: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: raw SQL query wrapper
// ─────────────────────────────────────────────────────────────────────────────
async function rawQuery<T = Record<string, unknown>>(query: string, params: unknown[] = []): Promise<T[]> {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await (db as any).execute(query, params);
  return rows as T[];
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────────────────────────────────────

export const wtpAssessmentRouter = router({

  // ── Evidence Ladder (static) ──────────────────────────────────────────────
  getEvidenceLadder: publicProcedure.query(() => EVIDENCE_LADDER),

  // ── WTP Tests CRUD ────────────────────────────────────────────────────────
  listWTPTests: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const where = input.ventureId ? `WHERE venture_id = ?` : "";
      const params = input.ventureId ? [input.ventureId] : [];
      return rawQuery(`SELECT * FROM wtp_tests ${where} ORDER BY created_at DESC`, params);
    }),

  getWTPTest: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const rows = await rawQuery(`SELECT * FROM wtp_tests WHERE id = ?`, [input.id]);
      return rows[0] ?? null;
    }),

  createWTPTest: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      hypothesisId: z.string().optional(),
      customerSegmentId: z.string().optional(),
      customerName: z.string().optional(),
      organisation: z.string().optional(),
      contactRole: z.string().optional(),
      buyerRole: z.string().optional(),
      economicBuyer: z.string().optional(),
      budgetOwnerConfirmed: z.enum(["confirmed", "partially_known", "unknown"]).default("unknown"),
      budgetOwnerName: z.string().optional(),
      budgetOwnerRole: z.string().optional(),
      currentSpend: z.number().optional(),
      currentSpendCurrency: z.string().default("GBP"),
      currentSpendPeriod: z.enum(["monthly", "quarterly", "annually", "one_off"]).default("annually"),
      valueDriver: z.string().optional(),
      pricingModelTested: z.string().optional(),
      priceTested: z.number().optional(),
      priceCurrency: z.string().default("GBP"),
      pricePeriod: z.string().optional(),
      testMethod: z.string().optional(),
      responseSummary: z.string().optional(),
      evidenceLevel: z.number().min(1).max(7).default(1),
      evidenceStrengthScore: z.number().min(0).max(100).default(0),
      pricingResponse: z.enum(["accepted", "negotiating", "needs_roi_proof", "price_resistance", "rejected"]).default("needs_roi_proof"),
      procurementPathwayStatus: z.string().default("unknown"),
      procurementPathwayNotes: z.string().optional(),
      decisionProcessNotes: z.string().optional(),
      objections: z.string().optional(),
      objectionCategory: z.string().optional(),
      recommendedPricingModel: z.string().optional(),
      nextCommercialAction: z.string().optional(),
      nextActionDueDate: z.string().optional(),
      status: z.string().default("planned"),
    }))
    .mutation(async ({ input }) => {
      const wtpScore = calculateWTPScore({
        evidenceLevel: input.evidenceLevel,
        budgetOwnerStatus: input.budgetOwnerConfirmed,
        procurementPathwayStatus: input.procurementPathwayStatus,
        pricingResponse: input.pricingResponse,
      });

      const id = crypto.randomUUID();
      await rawQuery(`
        INSERT INTO wtp_tests (
          id, venture_id, hypothesis_id, customer_segment_id, customer_name, organisation,
          contact_role, buyer_role, economic_buyer, budget_owner_confirmed, budget_owner_name,
          budget_owner_role, current_spend, current_spend_currency, current_spend_period,
          value_driver, pricing_model_tested, price_tested, price_currency, price_period,
          test_method, response_summary, evidence_level, evidence_strength_score, pricing_response,
          procurement_pathway_status, procurement_pathway_notes, decision_process_notes,
          objections, objection_category, recommended_pricing_model, next_commercial_action,
          next_action_due_date, status, wtp_score
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `, [
        id, input.ventureId, input.hypothesisId ?? null, input.customerSegmentId ?? null,
        input.customerName ?? null, input.organisation ?? null, input.contactRole ?? null,
        input.buyerRole ?? null, input.economicBuyer ?? null, input.budgetOwnerConfirmed,
        input.budgetOwnerName ?? null, input.budgetOwnerRole ?? null,
        input.currentSpend ?? null, input.currentSpendCurrency, input.currentSpendPeriod,
        input.valueDriver ?? null, input.pricingModelTested ?? null, input.priceTested ?? null,
        input.priceCurrency, input.pricePeriod ?? null, input.testMethod ?? null,
        input.responseSummary ?? null, input.evidenceLevel, input.evidenceStrengthScore,
        input.pricingResponse, input.procurementPathwayStatus,
        input.procurementPathwayNotes ?? null, input.decisionProcessNotes ?? null,
        input.objections ?? null, input.objectionCategory ?? null,
        input.recommendedPricingModel ?? null, input.nextCommercialAction ?? null,
        input.nextActionDueDate ?? null, input.status, wtpScore,
      ]);

      // Auto-create market risks if needed
      await autoCreateMarketRisks(input.ventureId, wtpScore, input.evidenceLevel, input.budgetOwnerConfirmed, input.procurementPathwayStatus, input.objectionCategory ?? null);

      return { id, wtpScore };
    }),

  updateWTPTest: protectedProcedure
    .input(z.object({
      id: z.string(),
      ventureId: z.string(),
      customerName: z.string().optional(),
      organisation: z.string().optional(),
      contactRole: z.string().optional(),
      buyerRole: z.string().optional(),
      economicBuyer: z.string().optional(),
      budgetOwnerConfirmed: z.enum(["confirmed", "partially_known", "unknown"]).optional(),
      budgetOwnerName: z.string().optional(),
      budgetOwnerRole: z.string().optional(),
      currentSpend: z.number().optional(),
      valueDriver: z.string().optional(),
      pricingModelTested: z.string().optional(),
      priceTested: z.number().optional(),
      testMethod: z.string().optional(),
      responseSummary: z.string().optional(),
      evidenceLevel: z.number().min(1).max(7).optional(),
      pricingResponse: z.enum(["accepted", "negotiating", "needs_roi_proof", "price_resistance", "rejected"]).optional(),
      procurementPathwayStatus: z.string().optional(),
      procurementPathwayNotes: z.string().optional(),
      decisionProcessNotes: z.string().optional(),
      objections: z.string().optional(),
      objectionCategory: z.string().optional(),
      recommendedPricingModel: z.string().optional(),
      nextCommercialAction: z.string().optional(),
      nextActionDueDate: z.string().optional(),
      status: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Get current record to recalculate score
      const current = await rawQuery<any>(`SELECT * FROM wtp_tests WHERE id = ?`, [input.id]);
      if (!current[0]) throw new Error("WTP test not found");
      const c = current[0];

      const evidenceLevel = input.evidenceLevel ?? c.evidence_level;
      const budgetOwnerConfirmed = input.budgetOwnerConfirmed ?? c.budget_owner_confirmed;
      const procurementPathwayStatus = input.procurementPathwayStatus ?? c.procurement_pathway_status;
      const pricingResponse = input.pricingResponse ?? c.pricing_response;

      const wtpScore = calculateWTPScore({ evidenceLevel, budgetOwnerStatus: budgetOwnerConfirmed, procurementPathwayStatus, pricingResponse });

      await rawQuery(`
        UPDATE wtp_tests SET
          customer_name = COALESCE(?, customer_name),
          organisation = COALESCE(?, organisation),
          contact_role = COALESCE(?, contact_role),
          buyer_role = COALESCE(?, buyer_role),
          economic_buyer = COALESCE(?, economic_buyer),
          budget_owner_confirmed = COALESCE(?, budget_owner_confirmed),
          budget_owner_name = COALESCE(?, budget_owner_name),
          budget_owner_role = COALESCE(?, budget_owner_role),
          current_spend = COALESCE(?, current_spend),
          value_driver = COALESCE(?, value_driver),
          pricing_model_tested = COALESCE(?, pricing_model_tested),
          price_tested = COALESCE(?, price_tested),
          test_method = COALESCE(?, test_method),
          response_summary = COALESCE(?, response_summary),
          evidence_level = COALESCE(?, evidence_level),
          pricing_response = COALESCE(?, pricing_response),
          procurement_pathway_status = COALESCE(?, procurement_pathway_status),
          procurement_pathway_notes = COALESCE(?, procurement_pathway_notes),
          decision_process_notes = COALESCE(?, decision_process_notes),
          objections = COALESCE(?, objections),
          objection_category = COALESCE(?, objection_category),
          recommended_pricing_model = COALESCE(?, recommended_pricing_model),
          next_commercial_action = COALESCE(?, next_commercial_action),
          next_action_due_date = COALESCE(?, next_action_due_date),
          status = COALESCE(?, status),
          wtp_score = ?
        WHERE id = ?
      `, [
        input.customerName ?? null, input.organisation ?? null, input.contactRole ?? null,
        input.buyerRole ?? null, input.economicBuyer ?? null, input.budgetOwnerConfirmed ?? null,
        input.budgetOwnerName ?? null, input.budgetOwnerRole ?? null, input.currentSpend ?? null,
        input.valueDriver ?? null, input.pricingModelTested ?? null, input.priceTested ?? null,
        input.testMethod ?? null, input.responseSummary ?? null, input.evidenceLevel ?? null,
        input.pricingResponse ?? null, input.procurementPathwayStatus ?? null,
        input.procurementPathwayNotes ?? null, input.decisionProcessNotes ?? null,
        input.objections ?? null, input.objectionCategory ?? null,
        input.recommendedPricingModel ?? null, input.nextCommercialAction ?? null,
        input.nextActionDueDate ?? null, input.status ?? null,
        wtpScore, input.id,
      ]);

      return { id: input.id, wtpScore };
    }),

  deleteWTPTest: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await rawQuery(`DELETE FROM wtp_tests WHERE id = ?`, [input.id]);
      return { success: true };
    }),

  // ── WTP Overview (venture-level summary) ──────────────────────────────────
  getVentureWTPOverview: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const tests = await rawQuery<any>(`SELECT * FROM wtp_tests WHERE venture_id = ?`, [input.ventureId]);
      const commitments = await rawQuery<any>(`SELECT * FROM wtp_commitments WHERE venture_id = ?`, [input.ventureId]);
      const pricingExps = await rawQuery<any>(`SELECT * FROM pricing_experiments WHERE venture_id = ?`, [input.ventureId]);

      const totalTests = tests.length;
      const avgScore = totalTests > 0 ? tests.reduce((s: number, t: any) => s + (Number(t.wtp_score) || 0), 0) / totalTests : 0;
      const highestEvidenceLevel = totalTests > 0 ? Math.max(...tests.map((t: any) => t.evidence_level ?? 1)) : 0;
      const budgetOwnersConfirmed = tests.filter((t: any) => t.budget_owner_confirmed === "confirmed").length;
      const proposalsRequested = tests.filter((t: any) => (t.evidence_level ?? 0) >= 5).length;
      const loisSigned = commitments.filter((c: any) => c.commitment_type === "loi_signed").length;
      const paidPilots = commitments.filter((c: any) => c.commitment_type === "paid_pilot" || c.commitment_type === "purchase_order").length;

      // Most common objection
      const objectionCounts: Record<string, number> = {};
      tests.forEach((t: any) => {
        if (t.objection_category) {
          objectionCounts[t.objection_category] = (objectionCounts[t.objection_category] ?? 0) + 1;
        }
      });
      const mainObjection = Object.entries(objectionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      const wtpStatus = calculateVentureWTPStatus(tests.map((t: any) => ({ wtp_score: Number(t.wtp_score), evidence_level: t.evidence_level ?? 1 })));

      const recommendation = generateWTPDecisionRecommendation(
        Math.round(avgScore),
        highestEvidenceLevel || 1,
        tests[0]?.budget_owner_confirmed ?? "unknown",
        tests[0]?.procurement_pathway_status ?? "unknown",
      );

      return {
        totalTests, avgScore: Math.round(avgScore), highestEvidenceLevel,
        budgetOwnersConfirmed, proposalsRequested, loisSigned, paidPilots,
        mainObjection, wtpStatus, recommendation,
        totalCommitments: commitments.length, totalPricingExperiments: pricingExps.length,
      };
    }),

  // ── Portfolio WTP Summary ─────────────────────────────────────────────────
  getPortfolioWTPSummary: publicProcedure.query(async () => {
    const tests = await rawQuery<any>(`SELECT venture_id, wtp_score, evidence_level, budget_owner_confirmed, procurement_pathway_status FROM wtp_tests`);
    const ventures = [...new Set(tests.map((t: any) => t.venture_id))];

    return ventures.map(vid => {
      const vTests = tests.filter((t: any) => t.venture_id === vid);
      const avgScore = vTests.length > 0 ? vTests.reduce((s: number, t: any) => s + (Number(t.wtp_score) || 0), 0) / vTests.length : 0;
      const status = calculateVentureWTPStatus(vTests.map((t: any) => ({ wtp_score: Number(t.wtp_score), evidence_level: t.evidence_level ?? 1 })));
      return { ventureId: vid, avgScore: Math.round(avgScore), testCount: vTests.length, status };
    });
  }),

  // ── Commitments CRUD ──────────────────────────────────────────────────────
  listCommitments: publicProcedure
    .input(z.object({ ventureId: z.string().optional(), wtpTestId: z.string().optional() }))
    .query(async ({ input }) => {
      if (input.wtpTestId) {
        return rawQuery(`SELECT * FROM wtp_commitments WHERE wtp_test_id = ? ORDER BY created_at DESC`, [input.wtpTestId]);
      }
      if (input.ventureId) {
        return rawQuery(`SELECT * FROM wtp_commitments WHERE venture_id = ? ORDER BY created_at DESC`, [input.ventureId]);
      }
      return rawQuery(`SELECT * FROM wtp_commitments ORDER BY created_at DESC`);
    }),

  createCommitment: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      wtpTestId: z.string().optional(),
      commitmentType: z.string(),
      commitmentDescription: z.string().optional(),
      commitmentValue: z.number().optional(),
      commitmentCurrency: z.string().default("GBP"),
      commitmentDate: z.string().optional(),
      evidenceReference: z.string().optional(),
      status: z.enum(["weak", "moderate", "strong", "confirmed", "withdrawn"]).default("weak"),
    }))
    .mutation(async ({ input }) => {
      const id = crypto.randomUUID();
      await rawQuery(`
        INSERT INTO wtp_commitments (id, venture_id, wtp_test_id, commitment_type, commitment_description, commitment_value, commitment_currency, commitment_date, evidence_reference, status)
        VALUES (?,?,?,?,?,?,?,?,?,?)
      `, [id, input.ventureId, input.wtpTestId ?? null, input.commitmentType, input.commitmentDescription ?? null, input.commitmentValue ?? null, input.commitmentCurrency, input.commitmentDate ?? null, input.evidenceReference ?? null, input.status]);
      return { id };
    }),

  updateCommitment: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["weak", "moderate", "strong", "confirmed", "withdrawn"]).optional(),
      commitmentDescription: z.string().optional(),
      commitmentValue: z.number().optional(),
      evidenceReference: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await rawQuery(`
        UPDATE wtp_commitments SET
          status = COALESCE(?, status),
          commitment_description = COALESCE(?, commitment_description),
          commitment_value = COALESCE(?, commitment_value),
          evidence_reference = COALESCE(?, evidence_reference)
        WHERE id = ?
      `, [input.status ?? null, input.commitmentDescription ?? null, input.commitmentValue ?? null, input.evidenceReference ?? null, input.id]);
      return { success: true };
    }),

  deleteCommitment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await rawQuery(`DELETE FROM wtp_commitments WHERE id = ?`, [input.id]);
      return { success: true };
    }),

  // ── Pricing Experiments CRUD ──────────────────────────────────────────────
  listPricingExperiments: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const where = input.ventureId ? `WHERE venture_id = ?` : "";
      const params = input.ventureId ? [input.ventureId] : [];
      return rawQuery(`SELECT * FROM pricing_experiments ${where} ORDER BY created_at DESC`, params);
    }),

  createPricingExperiment: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      hypothesisId: z.string().optional(),
      pricingModel: z.string(),
      pricePoint: z.number().optional(),
      currency: z.string().default("GBP"),
      billingPeriod: z.string().default("annually"),
      targetCustomerSegment: z.string().optional(),
      valueMetric: z.string().optional(),
      buyingTrigger: z.string().optional(),
      currentSpendReplaced: z.string().optional(),
      costReduced: z.string().optional(),
      riskRemoved: z.string().optional(),
      outcomeImproved: z.string().optional(),
      testMethod: z.string().default("pricing_interview"),
      testSampleSize: z.number().default(0),
      positiveResponses: z.number().default(0),
      negativeResponses: z.number().default(0),
      learningSummary: z.string().optional(),
      recommendedPriceRange: z.string().optional(),
      recommendedNextTest: z.string().optional(),
      status: z.enum(["proposed", "running", "completed", "inconclusive", "invalidated"]).default("proposed"),
    }))
    .mutation(async ({ input }) => {
      const total = input.positiveResponses + input.negativeResponses;
      const conversionRate = calculatePricingConversionRate(input.positiveResponses, total);
      const id = crypto.randomUUID();
      await rawQuery(`
        INSERT INTO pricing_experiments (
          id, venture_id, hypothesis_id, pricing_model, price_point, currency, billing_period,
          target_customer_segment, value_metric, buying_trigger, current_spend_replaced,
          cost_reduced, risk_removed, outcome_improved, test_method, test_sample_size,
          positive_responses, negative_responses, conversion_rate, learning_summary,
          recommended_price_range, recommended_next_test, status
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `, [
        id, input.ventureId, input.hypothesisId ?? null, input.pricingModel,
        input.pricePoint ?? null, input.currency, input.billingPeriod,
        input.targetCustomerSegment ?? null, input.valueMetric ?? null,
        input.buyingTrigger ?? null, input.currentSpendReplaced ?? null,
        input.costReduced ?? null, input.riskRemoved ?? null, input.outcomeImproved ?? null,
        input.testMethod, input.testSampleSize, input.positiveResponses,
        input.negativeResponses, conversionRate, input.learningSummary ?? null,
        input.recommendedPriceRange ?? null, input.recommendedNextTest ?? null, input.status,
      ]);
      return { id, conversionRate };
    }),

  updatePricingExperiment: protectedProcedure
    .input(z.object({
      id: z.string(),
      positiveResponses: z.number().optional(),
      negativeResponses: z.number().optional(),
      testSampleSize: z.number().optional(),
      learningSummary: z.string().optional(),
      recommendedPriceRange: z.string().optional(),
      recommendedNextTest: z.string().optional(),
      status: z.enum(["proposed", "running", "completed", "inconclusive", "invalidated"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const current = await rawQuery<any>(`SELECT * FROM pricing_experiments WHERE id = ?`, [input.id]);
      if (!current[0]) throw new Error("Pricing experiment not found");
      const c = current[0];
      const pos = input.positiveResponses ?? c.positive_responses;
      const neg = input.negativeResponses ?? c.negative_responses;
      const total = pos + neg;
      const conversionRate = calculatePricingConversionRate(pos, total);

      await rawQuery(`
        UPDATE pricing_experiments SET
          positive_responses = COALESCE(?, positive_responses),
          negative_responses = COALESCE(?, negative_responses),
          test_sample_size = COALESCE(?, test_sample_size),
          conversion_rate = ?,
          learning_summary = COALESCE(?, learning_summary),
          recommended_price_range = COALESCE(?, recommended_price_range),
          recommended_next_test = COALESCE(?, recommended_next_test),
          status = COALESCE(?, status)
        WHERE id = ?
      `, [
        input.positiveResponses ?? null, input.negativeResponses ?? null,
        input.testSampleSize ?? null, conversionRate,
        input.learningSummary ?? null, input.recommendedPriceRange ?? null,
        input.recommendedNextTest ?? null, input.status ?? null, input.id,
      ]);
      return { id: input.id, conversionRate };
    }),

  deletePricingExperiment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await rawQuery(`DELETE FROM pricing_experiments WHERE id = ?`, [input.id]);
      return { success: true };
    }),

  // ── Budget Validations CRUD ───────────────────────────────────────────────
  listBudgetValidations: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const where = input.ventureId ? `WHERE venture_id = ?` : "";
      const params = input.ventureId ? [input.ventureId] : [];
      return rawQuery(`SELECT * FROM budget_validations ${where} ORDER BY created_at DESC`, params);
    }),

  createBudgetValidation: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      wtpTestId: z.string().optional(),
      organisation: z.string().optional(),
      budgetOwnerKnown: z.boolean().default(false),
      budgetOwnerRole: z.string().optional(),
      budgetCategory: z.string().default("innovation"),
      budgetCycle: z.string().default("annually"),
      currentBudgetAvailable: z.number().optional(),
      estimatedBudgetRange: z.string().optional(),
      approvalRequired: z.boolean().default(true),
      approvalStakeholders: z.string().optional(),
      financialDecisionCriteria: z.string().optional(),
      notes: z.string().optional(),
      validationStatus: z.enum(["unknown", "partially_validated", "validated", "blocked", "invalidated"]).default("unknown"),
    }))
    .mutation(async ({ input }) => {
      const id = crypto.randomUUID();
      await rawQuery(`
        INSERT INTO budget_validations (
          id, venture_id, wtp_test_id, organisation, budget_owner_known, budget_owner_role,
          budget_category, budget_cycle, current_budget_available, estimated_budget_range,
          approval_required, approval_stakeholders, financial_decision_criteria, notes, validation_status
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `, [
        id, input.ventureId, input.wtpTestId ?? null, input.organisation ?? null,
        input.budgetOwnerKnown, input.budgetOwnerRole ?? null, input.budgetCategory,
        input.budgetCycle, input.currentBudgetAvailable ?? null, input.estimatedBudgetRange ?? null,
        input.approvalRequired, input.approvalStakeholders ?? null,
        input.financialDecisionCriteria ?? null, input.notes ?? null, input.validationStatus,
      ]);
      return { id };
    }),

  updateBudgetValidation: protectedProcedure
    .input(z.object({
      id: z.string(),
      budgetOwnerKnown: z.boolean().optional(),
      budgetOwnerRole: z.string().optional(),
      approvalStakeholders: z.string().optional(),
      financialDecisionCriteria: z.string().optional(),
      notes: z.string().optional(),
      validationStatus: z.enum(["unknown", "partially_validated", "validated", "blocked", "invalidated"]).optional(),
    }))
    .mutation(async ({ input }) => {
      await rawQuery(`
        UPDATE budget_validations SET
          budget_owner_known = COALESCE(?, budget_owner_known),
          budget_owner_role = COALESCE(?, budget_owner_role),
          approval_stakeholders = COALESCE(?, approval_stakeholders),
          financial_decision_criteria = COALESCE(?, financial_decision_criteria),
          notes = COALESCE(?, notes),
          validation_status = COALESCE(?, validation_status)
        WHERE id = ?
      `, [
        input.budgetOwnerKnown ?? null, input.budgetOwnerRole ?? null,
        input.approvalStakeholders ?? null, input.financialDecisionCriteria ?? null,
        input.notes ?? null, input.validationStatus ?? null, input.id,
      ]);
      return { success: true };
    }),

  deleteBudgetValidation: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await rawQuery(`DELETE FROM budget_validations WHERE id = ?`, [input.id]);
      return { success: true };
    }),

  // ── Procurement Pathways CRUD ─────────────────────────────────────────────
  listProcurementPathways: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const where = input.ventureId ? `WHERE venture_id = ?` : "";
      const params = input.ventureId ? [input.ventureId] : [];
      return rawQuery(`SELECT * FROM procurement_pathways ${where} ORDER BY created_at DESC`, params);
    }),

  createProcurementPathway: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      wtpTestId: z.string().optional(),
      organisation: z.string().optional(),
      procurementRoute: z.string().default("unknown"),
      procurementComplexityScore: z.number().min(1).max(5).default(3),
      expectedSalesCycleDays: z.number().default(90),
      requiredDocuments: z.string().optional(),
      complianceRequirements: z.string().optional(),
      legalReviewRequired: z.boolean().default(false),
      dataSecurityReviewRequired: z.boolean().default(false),
      pilotPossibleWithoutFullProcurement: z.boolean().default(true),
      procurementRisks: z.string().optional(),
      nextProcurementStep: z.string().optional(),
      status: z.enum(["unknown", "mapped", "blocked", "feasible", "high_friction", "validated"]).default("unknown"),
    }))
    .mutation(async ({ input }) => {
      const id = crypto.randomUUID();
      const frictionScore = calculateProcurementFrictionScore({
        complexityScore: input.procurementComplexityScore,
        salesCycleDays: input.expectedSalesCycleDays,
        legalReviewRequired: input.legalReviewRequired,
        dataSecurityReviewRequired: input.dataSecurityReviewRequired,
        pilotPossibleWithoutProcurement: input.pilotPossibleWithoutFullProcurement,
      });

      await rawQuery(`
        INSERT INTO procurement_pathways (
          id, venture_id, wtp_test_id, organisation, procurement_route,
          procurement_complexity_score, expected_sales_cycle_days, required_documents,
          compliance_requirements, legal_review_required, data_security_review_required,
          pilot_possible_without_full_procurement, procurement_risks, next_procurement_step, status
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `, [
        id, input.ventureId, input.wtpTestId ?? null, input.organisation ?? null,
        input.procurementRoute, input.procurementComplexityScore, input.expectedSalesCycleDays,
        input.requiredDocuments ?? null, input.complianceRequirements ?? null,
        input.legalReviewRequired, input.dataSecurityReviewRequired,
        input.pilotPossibleWithoutFullProcurement, input.procurementRisks ?? null,
        input.nextProcurementStep ?? null, input.status,
      ]);

      // Auto-create market risk if procurement is blocked
      if (input.status === "blocked" || input.status === "unknown") {
        await autoCreateProcurementRisk(input.ventureId, input.status);
      }

      return { id, frictionScore };
    }),

  updateProcurementPathway: protectedProcedure
    .input(z.object({
      id: z.string(),
      procurementRoute: z.string().optional(),
      procurementComplexityScore: z.number().min(1).max(5).optional(),
      expectedSalesCycleDays: z.number().optional(),
      procurementRisks: z.string().optional(),
      nextProcurementStep: z.string().optional(),
      status: z.enum(["unknown", "mapped", "blocked", "feasible", "high_friction", "validated"]).optional(),
    }))
    .mutation(async ({ input }) => {
      await rawQuery(`
        UPDATE procurement_pathways SET
          procurement_route = COALESCE(?, procurement_route),
          procurement_complexity_score = COALESCE(?, procurement_complexity_score),
          expected_sales_cycle_days = COALESCE(?, expected_sales_cycle_days),
          procurement_risks = COALESCE(?, procurement_risks),
          next_procurement_step = COALESCE(?, next_procurement_step),
          status = COALESCE(?, status)
        WHERE id = ?
      `, [
        input.procurementRoute ?? null, input.procurementComplexityScore ?? null,
        input.expectedSalesCycleDays ?? null, input.procurementRisks ?? null,
        input.nextProcurementStep ?? null, input.status ?? null, input.id,
      ]);
      return { success: true };
    }),

  deleteProcurementPathway: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await rawQuery(`DELETE FROM procurement_pathways WHERE id = ?`, [input.id]);
      return { success: true };
    }),

  // ── WTP Scorecard (per venture) ───────────────────────────────────────────
  getWTPScorecard: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const tests = await rawQuery<any>(`SELECT * FROM wtp_tests WHERE venture_id = ? ORDER BY wtp_score DESC`, [input.ventureId]);
      const commitments = await rawQuery<any>(`SELECT * FROM wtp_commitments WHERE venture_id = ?`, [input.ventureId]);
      const budgets = await rawQuery<any>(`SELECT * FROM budget_validations WHERE venture_id = ?`, [input.ventureId]);
      const procurement = await rawQuery<any>(`SELECT * FROM procurement_pathways WHERE venture_id = ?`, [input.ventureId]);
      const pricing = await rawQuery<any>(`SELECT * FROM pricing_experiments WHERE venture_id = ?`, [input.ventureId]);

      const bestTest = tests[0] ?? null;
      const avgScore = tests.length > 0 ? tests.reduce((s: number, t: any) => s + (Number(t.wtp_score) || 0), 0) / tests.length : 0;
      const wtpStatus = calculateVentureWTPStatus(tests.map((t: any) => ({ wtp_score: Number(t.wtp_score), evidence_level: t.evidence_level ?? 1 })));

      const recommendation = bestTest
        ? generateWTPDecisionRecommendation(
            Math.round(avgScore),
            bestTest.evidence_level ?? 1,
            bestTest.budget_owner_confirmed ?? "unknown",
            bestTest.procurement_pathway_status ?? "unknown",
          )
        : null;

      const warnings = bestTest
        ? generateWTPWarnings({
            score: Math.round(avgScore),
            evidenceLevel: bestTest.evidence_level ?? 1,
            budgetOwnerStatus: bestTest.budget_owner_confirmed ?? "unknown",
            procurementStatus: bestTest.procurement_pathway_status ?? "unknown",
            objectionCategory: bestTest.objection_category,
          })
        : [];

      // Stage-gate check
      const stageGateReady = avgScore >= 60
        && tests.some((t: any) => t.budget_owner_confirmed !== "unknown")
        && tests.some((t: any) => t.pricing_model_tested)
        && tests.some((t: any) => t.procurement_pathway_status !== "unknown")
        && tests.every((t: any) => (t.wtp_score ?? 0) >= 40);

      return {
        tests, commitments, budgets, procurement, pricing,
        avgScore: Math.round(avgScore), wtpStatus, recommendation, warnings, stageGateReady,
        testCount: tests.length, commitmentCount: commitments.length,
        budgetValidationCount: budgets.length, procurementCount: procurement.length,
        pricingExperimentCount: pricing.length,
      };
    }),

  // ── Objections (derived from wtp_tests) ──────────────────────────────────
  getObjectionSummary: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const where = input.ventureId ? `WHERE venture_id = ? AND objection_category IS NOT NULL` : `WHERE objection_category IS NOT NULL`;
      const params = input.ventureId ? [input.ventureId] : [];
      const tests = await rawQuery<any>(`SELECT venture_id, objection_category, objections, status FROM wtp_tests ${where}`, params);

      const counts: Record<string, number> = {};
      tests.forEach((t: any) => {
        if (t.objection_category) {
          counts[t.objection_category] = (counts[t.objection_category] ?? 0) + 1;
        }
      });

      const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => ({ category, count }));

      const unresolved = tests.filter((t: any) => t.status !== "completed" && t.status !== "converted_to_paid_customer" && t.objection_category);

      return { objectionCounts: sorted, unresolvedCount: unresolved.length, tests };
    }),

  // ── Scoring utilities (exposed as procedures) ─────────────────────────────
  calculateScore: publicProcedure
    .input(z.object({
      evidenceLevel: z.number().min(1).max(7),
      budgetOwnerStatus: z.enum(["confirmed", "partially_known", "unknown"]),
      procurementPathwayStatus: z.string(),
      pricingResponse: z.enum(["accepted", "negotiating", "needs_roi_proof", "price_resistance", "rejected"]),
    }))
    .query(({ input }) => {
      const score = calculateWTPScore(input);
      const rec = generateWTPDecisionRecommendation(score, input.evidenceLevel, input.budgetOwnerStatus, input.procurementPathwayStatus);
      const warnings = generateWTPWarnings({ score, evidenceLevel: input.evidenceLevel, budgetOwnerStatus: input.budgetOwnerStatus, procurementStatus: input.procurementPathwayStatus });
      return { score, recommendation: rec, warnings };
    }),
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-RISK HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function autoCreateMarketRisks(
  ventureId: string,
  wtpScore: number,
  evidenceLevel: number,
  budgetOwnerStatus: string,
  procurementStatus: string,
  objectionCategory: string | null,
) {
  const db = await getDb();
  if (!db) return;

  const risks: Array<{ title: string; category: string; severity: string; description: string }> = [];

  if (wtpScore < 40) {
    risks.push({
      title: "Willingness to pay not validated",
      category: "budget_risk",
      severity: "high",
      description: `WTP Score is ${wtpScore}/100 — below the 40-point threshold for commercial validation. Do not proceed to MVP build.`,
    });
  }
  if (evidenceLevel <= 2) {
    risks.push({
      title: "Positive interest mistaken for WTP",
      category: "budget_risk",
      severity: "medium",
      description: "Evidence Level 1–2 indicates only weak interest signals. This is not commercial validation.",
    });
  }
  if (budgetOwnerStatus === "unknown") {
    risks.push({
      title: "Budget owner unknown",
      category: "budget_risk",
      severity: "high",
      description: "WTP cannot be validated until the economic buyer or budget owner is identified.",
    });
  }
  if (objectionCategory === "data_sharing_concern") {
    risks.push({
      title: "Data sharing may block commercial validation",
      category: "data_access_risk",
      severity: "high",
      description: "Customer data sharing concern is a recurring objection. Consider anonymised pilot or data partnership structure.",
    });
  }
  if (objectionCategory === "trust_barrier") {
    risks.push({
      title: "Customer trust barrier may block purchase",
      category: "trust_risk",
      severity: "medium",
      description: "Trust barrier identified. Build credibility through case studies, references, or co-development before commercial conversation.",
    });
  }

  for (const risk of risks) {
    try {
      const id = crypto.randomUUID();
      await (db as any).execute(`
        INSERT IGNORE INTO venture_risks (id, venture_id, title, category, likelihood, impact, risk_score, status, description, source)
        VALUES (?, ?, ?, ?, 3, 4, 12, 'open', ?, 'wtp_assessment')
      `, [id, ventureId, risk.title, risk.category, risk.description]);
    } catch (_) {
      // venture_risks table may not have source column — silent fail
    }
  }
}

async function autoCreateProcurementRisk(ventureId: string, status: string) {
  const db = await getDb();
  if (!db) return;
  try {
    const id = crypto.randomUUID();
    const severity = status === "blocked" ? "high" : "medium";
    await (db as any).execute(`
      INSERT IGNORE INTO venture_risks (id, venture_id, title, category, likelihood, impact, risk_score, status, description)
      VALUES (?, ?, 'Procurement pathway unclear or blocked', 'procurement_risk', 3, 4, 12, 'open', ?)
    `, [id, ventureId, `Procurement pathway status: ${status}. Adoption may be blocked even if buyer interest exists.`]);
  } catch (_) {
    // silent fail
  }
}

export type WTPAssessmentRouter = typeof wtpAssessmentRouter;
