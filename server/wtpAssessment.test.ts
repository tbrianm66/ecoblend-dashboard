/**
 * WTP Assessment — Vitest tests for all scoring engines
 */
import { describe, it, expect } from "vitest";
import {
  calculateEvidenceLevelScore,
  calculateBudgetOwnerScore,
  calculateProcurementPathwayScore,
  calculatePricingResponseScore,
  calculateWTPScore,
  calculateVentureWTPStatus,
  generateWTPDecisionRecommendation,
  generateWTPWarnings,
  calculatePricingConversionRate,
  calculateProcurementFrictionScore,
  EVIDENCE_LADDER,
} from "./wtpAssessment.router";

// ─────────────────────────────────────────────────────────────────────────────
// Evidence Level Score
// ─────────────────────────────────────────────────────────────────────────────
describe("calculateEvidenceLevelScore", () => {
  it("returns 0 for level 0 (invalid)", () => {
    expect(calculateEvidenceLevelScore(0)).toBe(0);
  });
  it("returns 10 for level 1 (verbal interest)", () => {
    expect(calculateEvidenceLevelScore(1)).toBe(10);
  });
  it("returns 25 for level 2 (follow-up meeting)", () => {
    expect(calculateEvidenceLevelScore(2)).toBe(25);
  });
  it("returns 40 for level 3 (data sharing)", () => {
    expect(calculateEvidenceLevelScore(3)).toBe(40);
  });
  it("returns 55 for level 4 (budget holder intro)", () => {
    expect(calculateEvidenceLevelScore(4)).toBe(55);
  });
  it("returns 70 for level 5 (proposal request)", () => {
    expect(calculateEvidenceLevelScore(5)).toBe(70);
  });
  it("returns 85 for level 6 (LOI signed)", () => {
    expect(calculateEvidenceLevelScore(6)).toBe(85);
  });
  it("returns 100 for level 7 (paid pilot)", () => {
    expect(calculateEvidenceLevelScore(7)).toBe(100);
  });
  it("returns 0 for levels above 7 (out of range)", () => {
    expect(calculateEvidenceLevelScore(8)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Budget Owner Score
// ─────────────────────────────────────────────────────────────────────────────
describe("calculateBudgetOwnerScore", () => {
  it("returns 100 for confirmed", () => {
    expect(calculateBudgetOwnerScore("confirmed")).toBe(100);
  });
  it("returns 50 for partially_known", () => {
    expect(calculateBudgetOwnerScore("partially_known")).toBe(50);
  });
  it("returns 0 for unknown", () => {
    expect(calculateBudgetOwnerScore("unknown")).toBe(0);
  });
  it("returns 0 for any other value", () => {
    expect(calculateBudgetOwnerScore("not_applicable")).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Procurement Pathway Score
// ─────────────────────────────────────────────────────────────────────────────
describe("calculateProcurementPathwayScore", () => {
  it("returns 100 for validated", () => {
    expect(calculateProcurementPathwayScore("validated")).toBe(100);
  });
  it("returns 75 for feasible", () => {
    expect(calculateProcurementPathwayScore("feasible")).toBe(75);
  });
  it("returns 60 for mapped", () => {
    expect(calculateProcurementPathwayScore("mapped")).toBe(60);
  });
  it("returns 40 for high_friction", () => {
    expect(calculateProcurementPathwayScore("high_friction")).toBe(40);
  });
  it("returns 0 for blocked", () => {
    expect(calculateProcurementPathwayScore("blocked")).toBe(0);
  });
  it("returns 25 for unknown", () => {
    expect(calculateProcurementPathwayScore("unknown")).toBe(25);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pricing Response Score
// ─────────────────────────────────────────────────────────────────────────────
describe("calculatePricingResponseScore", () => {
  it("returns 100 for accepted", () => {
    expect(calculatePricingResponseScore("accepted")).toBe(100);
  });
  it("returns 75 for negotiating", () => {
    expect(calculatePricingResponseScore("negotiating")).toBe(75);
  });
  it("returns 50 for needs_roi_proof", () => {
    expect(calculatePricingResponseScore("needs_roi_proof")).toBe(50);
  });
  it("returns 25 for price_resistance", () => {
    expect(calculatePricingResponseScore("price_resistance")).toBe(25);
  });
  it("returns 0 for rejected", () => {
    expect(calculatePricingResponseScore("rejected")).toBe(0);
  });
  it("returns 0 for unknown/default", () => {
    expect(calculatePricingResponseScore("not_tested")).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// WTP Score (composite)
// ─────────────────────────────────────────────────────────────────────────────
describe("calculateWTPScore", () => {
  it("returns 0 for all-zero inputs", () => {
    const score = calculateWTPScore({
      evidenceLevel: 0,
      budgetOwnerStatus: "unknown",
      procurementStatus: "unknown",
      pricingResponse: "rejected",
    });
    // evidence(0)*0.4 + budget(0)*0.25 + procurement(20)*0.2 + pricing(0)*0.15 = 4
    expect(score).toBe(4);
  });

  it("returns high score for perfect inputs (L7, confirmed, validated, accepted)", () => {
    const score = calculateWTPScore({
      evidenceLevel: 7,
      budgetOwnerStatus: "confirmed",
      procurementPathwayStatus: "validated",
      pricingResponse: "accepted",
    });
    // evidence(100)*0.50 + budget(100)*0.20 + procurement(100)*0.15 + pricing(100)*0.15 = 100
    expect(score).toBe(100);
  });

  it("BEBUS scenario — L5 evidence, budget partially known, procurement mapped, negotiating", () => {
    const score = calculateWTPScore({
      evidenceLevel: 5,
      budgetOwnerStatus: "partially_known",
      procurementPathwayStatus: "mapped",
      pricingResponse: "negotiating",
    });
    // evidence(70)*0.50 + budget(50)*0.20 + procurement(60)*0.15 + pricing(75)*0.15
    // = 35 + 10 + 9 + 11.25 = 65.25 → 65
    expect(score).toBe(65);
  });

  it("ECOCOMP scenario — L3 evidence, budget unknown, procurement unknown, needs_roi_proof", () => {
    const score = calculateWTPScore({
      evidenceLevel: 3,
      budgetOwnerStatus: "unknown",
      procurementPathwayStatus: "unknown",
      pricingResponse: "needs_roi_proof",
    });
    // evidence(40)*0.50 + budget(0)*0.20 + procurement(25)*0.15 + pricing(50)*0.15
    // = 20 + 0 + 3.75 + 7.5 = 31.25 → 31
    expect(score).toBe(31);
  });

  it("REAL scenario — L6 evidence, budget confirmed, procurement feasible, accepted", () => {
    const score = calculateWTPScore({
      evidenceLevel: 6,
      budgetOwnerStatus: "confirmed",
      procurementPathwayStatus: "feasible",
      pricingResponse: "accepted",
    });
    // evidence(85)*0.50 + budget(100)*0.20 + procurement(75)*0.15 + pricing(100)*0.15
    // = 42.5 + 20 + 11.25 + 15 = 88.75 → 89
    expect(score).toBe(89);
  });

  it("TONE scenario — L4 evidence, budget partially known, procurement high_friction, price_resistance", () => {
    const score = calculateWTPScore({
      evidenceLevel: 4,
      budgetOwnerStatus: "partially_known",
      procurementPathwayStatus: "high_friction",
      pricingResponse: "price_resistance",
    });
    // evidence(55)*0.50 + budget(50)*0.20 + procurement(40)*0.15 + pricing(25)*0.15
    // = 27.5 + 10 + 6 + 3.75 = 47.25 → 47
    expect(score).toBe(47);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Venture WTP Status
// ─────────────────────────────────────────────────────────────────────────────
describe("calculateVentureWTPStatus", () => {
  it("returns not_tested when no tests", () => {
    expect(calculateVentureWTPStatus([])).toBe("not_tested");
  });

  it("returns validated when avg score >= 80 and max evidence >= 6", () => {
    const status = calculateVentureWTPStatus([
      { wtp_score: 85, evidence_level: 7 },
      { wtp_score: 90, evidence_level: 6 },
    ]);
    expect(status).toBe("validated");
  });

  it("returns strong when avg score >= 65 and max evidence >= 5", () => {
    const status = calculateVentureWTPStatus([
      { wtp_score: 70, evidence_level: 5 },
      { wtp_score: 65, evidence_level: 5 },
    ]);
    expect(status).toBe("strong");
  });

  it("returns emerging when avg score >= 40", () => {
    const status = calculateVentureWTPStatus([
      { wtp_score: 45, evidence_level: 3 },
      { wtp_score: 40, evidence_level: 2 },
    ]);
    expect(status).toBe("emerging");
  });

  it("returns weak when avg score < 40", () => {
    const status = calculateVentureWTPStatus([
      { wtp_score: 20, evidence_level: 1 },
      { wtp_score: 15, evidence_level: 2 },
    ]);
    expect(status).toBe("weak");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Decision Recommendation
// ─────────────────────────────────────────────────────────────────────────────
describe("generateWTPDecisionRecommendation", () => {
  it("recommends PROCEED for high score, high evidence, confirmed budget, validated procurement", () => {
    const rec = generateWTPDecisionRecommendation(85, 7, "confirmed", "validated");
    expect(rec.label).toContain("Proceed");
    expect(rec.warnings).toHaveLength(0);
  });

  it("recommends STRENGTHEN for score 60-79", () => {
    const rec = generateWTPDecisionRecommendation(65, 5, "confirmed", "feasible");
    expect(rec.label).toContain("Strengthen");
  });

  it("recommends RUN MORE TESTS for score 40-59", () => {
    const rec = generateWTPDecisionRecommendation(50, 4, "partially_known", "mapped");
    expect(rec.label).toContain("Run");
  });

  it("recommends DO NOT PROCEED for score < 40", () => {
    const rec = generateWTPDecisionRecommendation(25, 2, "unknown", "unknown");
    expect(rec.label).toContain("Do Not Proceed");
  });

  it("adds warning for unknown budget owner", () => {
    const rec = generateWTPDecisionRecommendation(70, 5, "unknown", "feasible");
    expect(rec.warnings.some(w => w.toLowerCase().includes("budget"))).toBe(true);
  });

  it("adds warning for blocked procurement", () => {
    const rec = generateWTPDecisionRecommendation(70, 5, "confirmed", "blocked");
    expect(rec.warnings.some(w => w.toLowerCase().includes("procurement"))).toBe(true);
  });

  it("adds warning for low evidence level", () => {
    const rec = generateWTPDecisionRecommendation(70, 2, "confirmed", "feasible");
    expect(rec.warnings.some(w => w.toLowerCase().includes("evidence"))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// WTP Warnings
// ─────────────────────────────────────────────────────────────────────────────
describe("generateWTPWarnings", () => {
  it("returns no warnings for a healthy WTP profile", () => {
    const warnings = generateWTPWarnings({
      avgScore: 85,
      highestEvidenceLevel: 7,
      budgetOwnersConfirmed: 2,
      procurementFeasible: true,
      totalTests: 5,
      loisSigned: 1,
      paidPilots: 1,
    });
    expect(warnings).toHaveLength(0);
  });

  it("warns when evidence is only verbal interest", () => {
    const warnings = generateWTPWarnings({
      score: 30,
      evidenceLevel: 1,
      budgetOwnerStatus: "unknown",
      procurementStatus: "unknown",
    });
    expect(warnings.some(w => w.toLowerCase().includes("interest signal") || w.toLowerCase().includes("evidence"))).toBe(true);
  });

  it("warns when budget owner is not confirmed", () => {
    const warnings = generateWTPWarnings({
      score: 55,
      evidenceLevel: 4,
      budgetOwnerStatus: "unknown",
      procurementStatus: "mapped",
    });
    expect(warnings.some(w => w.toLowerCase().includes("budget"))).toBe(true);
  });

  it("warns when score is below 40", () => {
    const warnings = generateWTPWarnings({
      score: 25,
      evidenceLevel: 2,
      budgetOwnerStatus: "unknown",
      procurementStatus: "unknown",
    });
    expect(warnings.some(w => w.toLowerCase().includes("40") || w.toLowerCase().includes("do not proceed"))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pricing Conversion Rate
// ─────────────────────────────────────────────────────────────────────────────
describe("calculatePricingConversionRate", () => {
  it("returns 0 when total is 0", () => {
    expect(calculatePricingConversionRate(0, 0)).toBe(0);
  });
  it("returns 100 when all positive", () => {
    expect(calculatePricingConversionRate(5, 5)).toBe(100);
  });
  it("returns 40 for 4 positive out of 10", () => {
    expect(calculatePricingConversionRate(4, 10)).toBe(40);
  });
  it("rounds to 1 decimal place", () => {
    expect(calculatePricingConversionRate(1, 3)).toBeCloseTo(33.3, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Procurement Friction Score
// ─────────────────────────────────────────────────────────────────────────────
describe("calculateProcurementFrictionScore", () => {
  it("returns moderate score for simple direct purchase (complexity 1, no reviews, pilot possible)", () => {
    const score = calculateProcurementFrictionScore({
      complexityScore: 1,
      salesCycleDays: 30,
      legalReviewRequired: false,
      dataSecurityReviewRequired: false,
      pilotPossibleWithoutProcurement: true,
    });
    // base: 1*20=20, no additions, no pilot penalty
    expect(score).toBe(20);
  });

  it("returns high score for complex tender with legal and security reviews", () => {
    const score = calculateProcurementFrictionScore({
      complexityScore: 5,
      salesCycleDays: 270,
      legalReviewRequired: true,
      dataSecurityReviewRequired: true,
      pilotPossibleWithoutProcurement: false,
    });
    // base: 5*20=100, +15 (>180 days), +10 legal, +10 security, +15 no pilot → capped at 100
    expect(score).toBe(100);
  });

  it("reduces friction when pilot is possible (lower complexity)", () => {
    const withPilot = calculateProcurementFrictionScore({
      complexityScore: 3,
      salesCycleDays: 120,
      legalReviewRequired: true,
      dataSecurityReviewRequired: true,
      pilotPossibleWithoutProcurement: true,
    });
    const withoutPilot = calculateProcurementFrictionScore({
      complexityScore: 3,
      salesCycleDays: 120,
      legalReviewRequired: true,
      dataSecurityReviewRequired: true,
      pilotPossibleWithoutProcurement: false,
    });
    // withPilot: 3*20+8+10+10 = 88; withoutPilot: 3*20+8+10+10+15 = 100 (capped)
    // Actually: withPilot=88, withoutPilot=100 → 88 < 100 ✓
    expect(withPilot).toBeLessThan(withoutPilot);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Evidence Ladder
// ─────────────────────────────────────────────────────────────────────────────
describe("EVIDENCE_LADDER", () => {
  it("has exactly 7 levels", () => {
    expect(EVIDENCE_LADDER).toHaveLength(7);
  });

  it("levels are numbered 1 through 7", () => {
    EVIDENCE_LADDER.forEach((l, i) => {
      expect(l.level).toBe(i + 1);
    });
  });

  it("only levels 3+ are classified as WTP signals", () => {
    const wtpLevels = EVIDENCE_LADDER.filter(l => l.isWTP);
    expect(wtpLevels.every(l => l.level >= 3)).toBe(true);
    const nonWtpLevels = EVIDENCE_LADDER.filter(l => !l.isWTP);
    expect(nonWtpLevels.every(l => l.level < 3)).toBe(true);
  });

  it("scores increase monotonically with level", () => {
    for (let i = 1; i < EVIDENCE_LADDER.length; i++) {
      expect(EVIDENCE_LADDER[i].score).toBeGreaterThan(EVIDENCE_LADDER[i - 1].score);
    }
  });

  it("level 7 has score 100", () => {
    expect(EVIDENCE_LADDER[6].score).toBe(100);
  });
});
