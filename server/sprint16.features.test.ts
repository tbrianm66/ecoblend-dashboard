/**
 * Sprint 16 — Literature Audit Feature Tests
 * Tests for:
 *  1. Pivot Decision Log (Lean Startup — Ries pivot types)
 *  2. Innovation Accounting KPIs (leanMetrics.portfolioSummary)
 *  3. Disruption Radar (Innovator's Dilemma — 5-dimension scoring)
 */

import { describe, it, expect } from "vitest";

// ─── 1. Pivot Decision Log ────────────────────────────────────────────────────

const PIVOT_TYPES = [
  "Zoom-In", "Zoom-Out", "Customer-Segment", "Customer-Need", "Platform",
  "Business-Architecture", "Value-Capture", "Engine-of-Growth", "Channel", "Technology",
] as const;

type PivotType = typeof PIVOT_TYPES[number];

interface PivotDecision {
  ventureId: string;
  decision: "Pivot" | "Persevere" | "Pause";
  pivotType?: PivotType;
  hypothesisTested: string;
  experimentsPassed: number;
  experimentsFailed: number;
  interviewsReviewed: number;
  vrlScoreAtDecision?: number;
  newHypothesis?: string;
  decisionDate: Date;
}

function validatePivotDecision(d: PivotDecision): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!d.ventureId) errors.push("ventureId is required");
  if (!d.hypothesisTested || d.hypothesisTested.trim().length === 0)
    errors.push("hypothesisTested is required");
  if (!["Pivot", "Persevere", "Pause"].includes(d.decision))
    errors.push("decision must be Pivot, Persevere, or Pause");
  if (d.decision === "Pivot" && !d.pivotType)
    errors.push("pivotType is required when decision is Pivot");
  if (d.pivotType && !PIVOT_TYPES.includes(d.pivotType))
    errors.push(`pivotType must be one of: ${PIVOT_TYPES.join(", ")}`);
  if (d.experimentsPassed < 0) errors.push("experimentsPassed must be >= 0");
  if (d.experimentsFailed < 0) errors.push("experimentsFailed must be >= 0");
  if (d.vrlScoreAtDecision !== undefined && (d.vrlScoreAtDecision < 0 || d.vrlScoreAtDecision > 9))
    errors.push("vrlScoreAtDecision must be between 0 and 9");
  return { valid: errors.length === 0, errors };
}

describe("Pivot Decision Log — validation", () => {
  it("accepts a valid Persevere decision", () => {
    const d: PivotDecision = {
      ventureId: "ecoblend-core",
      decision: "Persevere",
      hypothesisTested: "Customers will pay $50/month for automated blending",
      experimentsPassed: 3,
      experimentsFailed: 1,
      interviewsReviewed: 8,
      decisionDate: new Date(),
    };
    const { valid } = validatePivotDecision(d);
    expect(valid).toBe(true);
  });

  it("accepts a valid Pivot decision with pivot type", () => {
    const d: PivotDecision = {
      ventureId: "ecoblend-core",
      decision: "Pivot",
      pivotType: "Customer-Segment",
      hypothesisTested: "SMEs are the right customer segment",
      experimentsPassed: 0,
      experimentsFailed: 4,
      interviewsReviewed: 12,
      newHypothesis: "Enterprise customers have higher willingness to pay",
      vrlScoreAtDecision: 3.5,
      decisionDate: new Date(),
    };
    const { valid } = validatePivotDecision(d);
    expect(valid).toBe(true);
  });

  it("rejects a Pivot decision without pivot type", () => {
    const d: PivotDecision = {
      ventureId: "ecoblend-core",
      decision: "Pivot",
      hypothesisTested: "Some hypothesis",
      experimentsPassed: 0,
      experimentsFailed: 2,
      interviewsReviewed: 0,
      decisionDate: new Date(),
    };
    const { valid, errors } = validatePivotDecision(d);
    expect(valid).toBe(false);
    expect(errors).toContain("pivotType is required when decision is Pivot");
  });

  it("rejects a decision with missing hypothesis", () => {
    const d: PivotDecision = {
      ventureId: "ecoblend-core",
      decision: "Persevere",
      hypothesisTested: "   ",
      experimentsPassed: 0,
      experimentsFailed: 0,
      interviewsReviewed: 0,
      decisionDate: new Date(),
    };
    const { valid, errors } = validatePivotDecision(d);
    expect(valid).toBe(false);
    expect(errors.some(e => e.includes("hypothesisTested"))).toBe(true);
  });

  it("rejects VRL score out of 0-9 range", () => {
    const d: PivotDecision = {
      ventureId: "ecoblend-core",
      decision: "Persevere",
      hypothesisTested: "Valid hypothesis",
      experimentsPassed: 1,
      experimentsFailed: 0,
      interviewsReviewed: 0,
      vrlScoreAtDecision: 10.5,
      decisionDate: new Date(),
    };
    const { valid, errors } = validatePivotDecision(d);
    expect(valid).toBe(false);
    expect(errors.some(e => e.includes("vrlScoreAtDecision"))).toBe(true);
  });

  it("covers all 10 Ries pivot types", () => {
    expect(PIVOT_TYPES).toHaveLength(10);
    const expected = [
      "Zoom-In", "Zoom-Out", "Customer-Segment", "Customer-Need", "Platform",
      "Business-Architecture", "Value-Capture", "Engine-of-Growth", "Channel", "Technology",
    ];
    expected.forEach(pt => expect(PIVOT_TYPES).toContain(pt));
  });
});

// ─── Pivot Runway Calculator ──────────────────────────────────────────────────

function computeRunway(
  cashBalance: number,
  monthlyBurn: number,
  avgPivotWeeks: number = 8,
  alertThreshold: number = 2,
): { runwayMonths: number | null; pivotsRemaining: number | null; alertActive: boolean } {
  if (monthlyBurn <= 0) return { runwayMonths: null, pivotsRemaining: null, alertActive: false };
  const runwayMonths = cashBalance / monthlyBurn;
  const pivotsRemaining = runwayMonths / (avgPivotWeeks / 4.33);
  const alertActive = pivotsRemaining < alertThreshold;
  return { runwayMonths, pivotsRemaining, alertActive };
}

describe("Pivot Runway Calculator", () => {
  it("calculates runway months correctly", () => {
    const { runwayMonths } = computeRunway(120_000, 10_000);
    expect(runwayMonths).toBeCloseTo(12, 1);
  });

  it("calculates pivots remaining correctly with 8-week pivot duration", () => {
    const { pivotsRemaining } = computeRunway(120_000, 10_000, 8);
    // 12 months / (8/4.33 months per pivot) ≈ 6.5 pivots
    expect(pivotsRemaining).toBeGreaterThan(6);
    expect(pivotsRemaining).toBeLessThan(7);
  });

  it("triggers alert when fewer than 2 pivots remain", () => {
    // 2 months runway / (8/4.33) = ~1.08 pivots — should alert
    const { alertActive } = computeRunway(20_000, 10_000, 8, 2);
    expect(alertActive).toBe(true);
  });

  it("does not alert when runway is comfortable", () => {
    const { alertActive } = computeRunway(500_000, 10_000, 8, 2);
    expect(alertActive).toBe(false);
  });

  it("returns null when burn rate is zero", () => {
    const { runwayMonths, pivotsRemaining } = computeRunway(100_000, 0);
    expect(runwayMonths).toBeNull();
    expect(pivotsRemaining).toBeNull();
  });
});

// ─── 2. Innovation Accounting KPIs ───────────────────────────────────────────

interface LeanMetricsEntry {
  id: string;
  name: string;
  experimentPassRate: number | null;
  learningVelocity: number | null;
  interviewInsightRate: number | null;
  engineOfGrowth: "Sticky" | "Viral" | "Paid" | null;
}

function computePortfolioPassRate(metrics: LeanMetricsEntry[]): number | null {
  const withRate = metrics.filter(m => m.experimentPassRate !== null);
  if (withRate.length === 0) return null;
  return Math.round(
    withRate.reduce((sum, m) => sum + (m.experimentPassRate as number), 0) / withRate.length
  );
}

function classifyEngineOfGrowth(
  churnRate: number | null,
  viralCoefficient: number | null,
  cac: number | null,
  ltv: number | null,
): "Sticky" | "Viral" | "Paid" | null {
  if (viralCoefficient !== null && viralCoefficient >= 1.0) return "Viral";
  if (churnRate !== null && churnRate <= 5) return "Sticky";
  if (cac !== null && ltv !== null && ltv / cac >= 3) return "Paid";
  return null;
}

describe("Innovation Accounting KPIs", () => {
  it("computes average experiment pass rate across portfolio", () => {
    const metrics: LeanMetricsEntry[] = [
      { id: "v1", name: "Venture A", experimentPassRate: 60, learningVelocity: 3, interviewInsightRate: 70, engineOfGrowth: "Sticky" },
      { id: "v2", name: "Venture B", experimentPassRate: 40, learningVelocity: 2, interviewInsightRate: 50, engineOfGrowth: null },
      { id: "v3", name: "Venture C", experimentPassRate: null, learningVelocity: 0, interviewInsightRate: null, engineOfGrowth: null },
    ];
    const rate = computePortfolioPassRate(metrics);
    expect(rate).toBe(50); // (60+40)/2
  });

  it("returns null when no experiments have been run", () => {
    const metrics: LeanMetricsEntry[] = [
      { id: "v1", name: "Venture A", experimentPassRate: null, learningVelocity: 0, interviewInsightRate: null, engineOfGrowth: null },
    ];
    expect(computePortfolioPassRate(metrics)).toBeNull();
  });

  it("classifies Viral engine when viral coefficient >= 1.0", () => {
    expect(classifyEngineOfGrowth(null, 1.2, null, null)).toBe("Viral");
  });

  it("classifies Sticky engine when churn <= 5%", () => {
    expect(classifyEngineOfGrowth(3, 0.5, null, null)).toBe("Sticky");
  });

  it("classifies Paid engine when LTV/CAC >= 3", () => {
    expect(classifyEngineOfGrowth(15, 0.3, 100, 400)).toBe("Paid");
  });

  it("returns null when no engine criteria are met", () => {
    expect(classifyEngineOfGrowth(20, 0.2, 100, 150)).toBeNull();
  });

  it("prioritises Viral over Sticky when both criteria are met", () => {
    // Viral coefficient >= 1 takes priority
    expect(classifyEngineOfGrowth(2, 1.5, null, null)).toBe("Viral");
  });
});

// ─── 3. Disruption Radar — Innovator's Dilemma ───────────────────────────────

interface DisruptionScore {
  initialMarketSmallness: number;
  nonConsumerTargeting: number;
  simplicityScore: number;
  lowMarginViability: number;
  incumbentIgnoreScore: number;
  requiresDifferentCostStructure?: boolean;
  requiresDifferentChannel?: boolean;
  requiresDifferentCustomerRelationship?: boolean;
}

function computeDisruptionPotential(s: DisruptionScore): {
  total: number;
  level: "High" | "Medium" | "Low";
  autonomousTeamFlagged: boolean;
} {
  const total = s.initialMarketSmallness + s.nonConsumerTargeting +
    s.simplicityScore + s.lowMarginViability + s.incumbentIgnoreScore;
  const level = total >= 40 ? "High" : total >= 25 ? "Medium" : "Low";
  const autonomousTeamFlagged = !!(
    s.requiresDifferentCostStructure ||
    s.requiresDifferentChannel ||
    s.requiresDifferentCustomerRelationship
  );
  return { total, level, autonomousTeamFlagged };
}

describe("Disruption Radar — Innovator's Dilemma scoring", () => {
  it("computes total disruption score as sum of 5 dimensions", () => {
    const { total } = computeDisruptionPotential({
      initialMarketSmallness: 8,
      nonConsumerTargeting: 7,
      simplicityScore: 9,
      lowMarginViability: 6,
      incumbentIgnoreScore: 8,
    });
    expect(total).toBe(38);
  });

  it("classifies High disruption potential when total >= 40", () => {
    const { level } = computeDisruptionPotential({
      initialMarketSmallness: 9,
      nonConsumerTargeting: 8,
      simplicityScore: 9,
      lowMarginViability: 8,
      incumbentIgnoreScore: 8,
    });
    expect(level).toBe("High");
  });

  it("classifies Medium disruption potential when total is 25-39", () => {
    const { level } = computeDisruptionPotential({
      initialMarketSmallness: 6,
      nonConsumerTargeting: 5,
      simplicityScore: 6,
      lowMarginViability: 5,
      incumbentIgnoreScore: 6,
    });
    expect(level).toBe("Medium");
  });

  it("classifies Low disruption potential when total < 25", () => {
    const { level } = computeDisruptionPotential({
      initialMarketSmallness: 2,
      nonConsumerTargeting: 3,
      simplicityScore: 4,
      lowMarginViability: 3,
      incumbentIgnoreScore: 2,
    });
    expect(level).toBe("Low");
  });

  it("flags autonomous team requirement when any structural flag is set", () => {
    const { autonomousTeamFlagged } = computeDisruptionPotential({
      initialMarketSmallness: 5,
      nonConsumerTargeting: 5,
      simplicityScore: 5,
      lowMarginViability: 5,
      incumbentIgnoreScore: 5,
      requiresDifferentCostStructure: true,
    });
    expect(autonomousTeamFlagged).toBe(true);
  });

  it("does not flag autonomous team when no structural flags are set", () => {
    const { autonomousTeamFlagged } = computeDisruptionPotential({
      initialMarketSmallness: 5,
      nonConsumerTargeting: 5,
      simplicityScore: 5,
      lowMarginViability: 5,
      incumbentIgnoreScore: 5,
    });
    expect(autonomousTeamFlagged).toBe(false);
  });

  it("scores are bounded 0-10 per dimension (max total = 50)", () => {
    const maxScore = computeDisruptionPotential({
      initialMarketSmallness: 10,
      nonConsumerTargeting: 10,
      simplicityScore: 10,
      lowMarginViability: 10,
      incumbentIgnoreScore: 10,
    });
    expect(maxScore.total).toBe(50);
    expect(maxScore.level).toBe("High");
  });

  it("zero scores produce Low level and no autonomous flag", () => {
    const { total, level, autonomousTeamFlagged } = computeDisruptionPotential({
      initialMarketSmallness: 0,
      nonConsumerTargeting: 0,
      simplicityScore: 0,
      lowMarginViability: 0,
      incumbentIgnoreScore: 0,
    });
    expect(total).toBe(0);
    expect(level).toBe("Low");
    expect(autonomousTeamFlagged).toBe(false);
  });
});
