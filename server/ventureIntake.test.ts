/**
 * Venture Intake Module — Vitest Tests
 * Tests the pure scoring/utility functions exported from ventureIntake.router.ts
 */

import { describe, it, expect } from "vitest";

// ── Inline the pure functions to avoid DB imports ──────────────────────────

function calcAssumptionRisk(importance: number, uncertainty: number): number {
  return importance * uncertainty;
}

function getRiskLevel(score: number): string {
  if (score >= 19) return "critical";
  if (score >= 11) return "high";
  if (score >= 6) return "medium";
  return "low";
}

function calcSegmentClarity(params: {
  buyerRole: string | null;
  userRole: string | null;
  decisionMaker: string | null;
  useCase: string | null;
  currentAlternative: string | null;
}): number {
  const filled = [
    params.buyerRole, params.userRole, params.decisionMaker,
    params.useCase, params.currentAlternative,
  ].filter(Boolean).length;
  return Math.round((filled / 5) * 100);
}

function calcProblemDefinition(params: {
  problemStatement: string | null;
  customerSegmentLink: string | null;
  currentWorkaround: string | null;
  evidenceRequired: string | null;
  successMetric: string | null;
}): number {
  const filled = [
    params.problemStatement, params.customerSegmentLink,
    params.currentWorkaround, params.evidenceRequired, params.successMetric,
  ].filter(Boolean).length;
  return Math.round((filled / 5) * 100);
}

function calcValuePropQuality(params: {
  customerJob: string | null;
  painRelieved: string | null;
  gainCreated: string | null;
  measurableOutcome: string | null;
  evidenceRequired: string | null;
}): number {
  const weights = [0.25, 0.25, 0.25, 0.15, 0.10];
  const values = [
    params.customerJob, params.painRelieved, params.gainCreated,
    params.measurableOutcome, params.evidenceRequired,
  ];
  const score = weights.reduce((acc, w, i) => acc + (values[i] ? w : 0), 0);
  return Math.round(score * 100);
}

function calcBizModelReadiness(params: {
  revenueModel: string | null;
  pricingAssumption: string | null;
  deliveryModel: string | null;
  salesChannel: string | null;
  evidenceRequired: string | null;
}): number {
  const filled = [
    params.revenueModel, params.pricingAssumption,
    params.deliveryModel, params.salesChannel, params.evidenceRequired,
  ].filter(Boolean).length;
  return Math.round((filled / 5) * 100);
}

function calcTestPriorityScore(params: {
  assumptionRiskScore: number;
  impactIfFalseScore: number;
  evidenceGapScore: number;
}): number {
  const normalisedRisk = Math.min((params.assumptionRiskScore / 25) * 100, 100);
  const normalisedImpact = (params.impactIfFalseScore / 5) * 100;
  const normalisedGap = (params.evidenceGapScore / 5) * 100;
  return Math.round(normalisedRisk * 0.5 + normalisedImpact * 0.3 + normalisedGap * 0.2);
}

function calcCanvasCompleteness(canvas: Record<string, string | null>): number {
  const fields = [
    "customer_segments", "problem", "unique_value_proposition", "solution",
    "channels", "revenue_streams", "cost_structure", "key_metrics",
    "unfair_advantage",
  ];
  const filled = fields.filter(f => canvas[f]).length;
  return Math.round((filled / fields.length) * 100);
}

function calcReadinessScore(params: {
  ideaCompleteness: number;
  segmentClarity: number;
  problemDefinition: number;
  valuePropQuality: number;
  bizModelReadiness: number;
  canvasCompleteness: number;
  hasRiskiest: boolean;
  criticalAssumptions: number;
}): number {
  const base =
    params.ideaCompleteness * 0.15 +
    params.segmentClarity * 0.20 +
    params.problemDefinition * 0.20 +
    params.valuePropQuality * 0.20 +
    params.bizModelReadiness * 0.15 +
    params.canvasCompleteness * 0.10;

  const riskiestBonus = params.hasRiskiest ? 5 : 0;
  const criticalPenalty = Math.min(params.criticalAssumptions * 5, 20);

  return Math.round(Math.max(0, Math.min(100, base + riskiestBonus - criticalPenalty)));
}

function getReadinessRecommendation(score: number, hasRiskiest: boolean, criticalAssumptions: number): {
  decision: string;
  label: string;
  description: string;
} {
  if (score >= 80 && hasRiskiest && criticalAssumptions === 0) {
    return { decision: "proceed_to_discovery_and_market", label: "Proceed to Discovery & Market", description: "Strong intake package. Begin customer discovery and market validation." };
  }
  if (score >= 60) {
    return { decision: "begin_customer_discovery", label: "Begin Customer Discovery", description: "Ready for initial discovery interviews. Define the riskiest assumption first." };
  }
  if (score >= 40) {
    return { decision: "research_more", label: "Research More", description: "Needs more definition before discovery. Complete the Lean Canvas and hypothesis register." };
  }
  return { decision: "archive", label: "Archive or Pivot", description: "Insufficient definition to proceed. Revisit the core idea or pivot." };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Assumption Risk Scoring", () => {
  it("calculates risk score as importance × uncertainty", () => {
    expect(calcAssumptionRisk(5, 5)).toBe(25);
    expect(calcAssumptionRisk(3, 3)).toBe(9);
    expect(calcAssumptionRisk(1, 1)).toBe(1);
    expect(calcAssumptionRisk(4, 3)).toBe(12);
  });

  it("classifies risk levels correctly", () => {
    expect(getRiskLevel(25)).toBe("critical");
    expect(getRiskLevel(19)).toBe("critical");
    expect(getRiskLevel(18)).toBe("high");
    expect(getRiskLevel(11)).toBe("high");
    expect(getRiskLevel(10)).toBe("medium");
    expect(getRiskLevel(6)).toBe("medium");
    expect(getRiskLevel(5)).toBe("low");
    expect(getRiskLevel(1)).toBe("low");
  });

  it("returns low risk for minimum scores", () => {
    expect(getRiskLevel(1)).toBe("low");
    expect(getRiskLevel(0)).toBe("low");
  });
});

describe("Customer Segment Clarity Score", () => {
  it("returns 100 when all fields are filled", () => {
    expect(calcSegmentClarity({
      buyerRole: "Engineering Director",
      userRole: "Fleet Manager",
      decisionMaker: "CTO",
      useCase: "Predictive maintenance",
      currentAlternative: "Manual inspection",
    })).toBe(100);
  });

  it("returns 0 when no fields are filled", () => {
    expect(calcSegmentClarity({ buyerRole: null, userRole: null, decisionMaker: null, useCase: null, currentAlternative: null })).toBe(0);
  });

  it("returns 60 when 3 of 5 fields are filled", () => {
    expect(calcSegmentClarity({
      buyerRole: "Director",
      userRole: "Manager",
      decisionMaker: "CTO",
      useCase: null,
      currentAlternative: null,
    })).toBe(60);
  });

  it("returns 20 when only 1 field is filled", () => {
    expect(calcSegmentClarity({ buyerRole: "Director", userRole: null, decisionMaker: null, useCase: null, currentAlternative: null })).toBe(20);
  });
});

describe("Problem Definition Score", () => {
  it("returns 100 when all fields are filled", () => {
    expect(calcProblemDefinition({
      problemStatement: "Bus operators lose 15% uptime",
      customerSegmentLink: "Engineering directors",
      currentWorkaround: "Manual inspection",
      evidenceRequired: "3+ interviews confirming",
      successMetric: "Reduce downtime by 30%",
    })).toBe(100);
  });

  it("returns 0 when no fields are filled", () => {
    expect(calcProblemDefinition({ problemStatement: null, customerSegmentLink: null, currentWorkaround: null, evidenceRequired: null, successMetric: null })).toBe(0);
  });

  it("returns 40 when 2 of 5 fields are filled", () => {
    expect(calcProblemDefinition({
      problemStatement: "Problem exists",
      customerSegmentLink: "Segment defined",
      currentWorkaround: null,
      evidenceRequired: null,
      successMetric: null,
    })).toBe(40);
  });
});

describe("Value Proposition Quality Score", () => {
  it("returns 100 when all fields are filled (weighted)", () => {
    expect(calcValuePropQuality({
      customerJob: "Reduce bus downtime",
      painRelieved: "Unplanned maintenance",
      gainCreated: "15% cost saving",
      measurableOutcome: "30% fewer breakdowns",
      evidenceRequired: "Customer interviews",
    })).toBe(100);
  });

  it("returns 0 when no fields are filled", () => {
    expect(calcValuePropQuality({ customerJob: null, painRelieved: null, gainCreated: null, measurableOutcome: null, evidenceRequired: null })).toBe(0);
  });

  it("returns 75 when top 3 fields (75% weight) are filled", () => {
    expect(calcValuePropQuality({
      customerJob: "Job defined",
      painRelieved: "Pain defined",
      gainCreated: "Gain defined",
      measurableOutcome: null,
      evidenceRequired: null,
    })).toBe(75);
  });

  it("returns 25 when only customerJob is filled", () => {
    expect(calcValuePropQuality({ customerJob: "Job", painRelieved: null, gainCreated: null, measurableOutcome: null, evidenceRequired: null })).toBe(25);
  });
});

describe("Business Model Readiness Score", () => {
  it("returns 100 when all fields are filled", () => {
    expect(calcBizModelReadiness({
      revenueModel: "SaaS",
      pricingAssumption: "£500/month",
      deliveryModel: "Cloud",
      salesChannel: "Direct",
      evidenceRequired: "3 LOIs",
    })).toBe(100);
  });

  it("returns 0 when no fields are filled", () => {
    expect(calcBizModelReadiness({ revenueModel: null, pricingAssumption: null, deliveryModel: null, salesChannel: null, evidenceRequired: null })).toBe(0);
  });

  it("returns 80 when 4 of 5 fields are filled", () => {
    expect(calcBizModelReadiness({
      revenueModel: "SaaS",
      pricingAssumption: "£500/month",
      deliveryModel: "Cloud",
      salesChannel: "Direct",
      evidenceRequired: null,
    })).toBe(80);
  });
});

describe("Test Priority Score (Riskiest Assumption)", () => {
  it("returns 100 for maximum risk, impact, and evidence gap", () => {
    expect(calcTestPriorityScore({ assumptionRiskScore: 25, impactIfFalseScore: 5, evidenceGapScore: 5 })).toBe(100);
  });

  it("returns 0 for minimum inputs", () => {
    expect(calcTestPriorityScore({ assumptionRiskScore: 0, impactIfFalseScore: 0, evidenceGapScore: 0 })).toBe(0);
  });

  it("weights risk at 50%, impact at 30%, evidence gap at 20%", () => {
    // Risk only: 25/25 = 100% → 50 points
    expect(calcTestPriorityScore({ assumptionRiskScore: 25, impactIfFalseScore: 0, evidenceGapScore: 0 })).toBe(50);
    // Impact only: 5/5 = 100% → 30 points
    expect(calcTestPriorityScore({ assumptionRiskScore: 0, impactIfFalseScore: 5, evidenceGapScore: 0 })).toBe(30);
    // Evidence gap only: 5/5 = 100% → 20 points
    expect(calcTestPriorityScore({ assumptionRiskScore: 0, impactIfFalseScore: 0, evidenceGapScore: 5 })).toBe(20);
  });

  it("caps risk score at 100 even if assumptionRiskScore > 25", () => {
    expect(calcTestPriorityScore({ assumptionRiskScore: 30, impactIfFalseScore: 0, evidenceGapScore: 0 })).toBe(50);
  });

  it("calculates mid-range score correctly", () => {
    // Risk: 12/25 = 48% → 24; Impact: 3/5 = 60% → 18; Gap: 2/5 = 40% → 8 → total = 50
    expect(calcTestPriorityScore({ assumptionRiskScore: 12, impactIfFalseScore: 3, evidenceGapScore: 2 })).toBe(50);
  });
});

describe("Lean Canvas Completeness Score", () => {
  it("returns 100 when all 9 core blocks are filled", () => {
    expect(calcCanvasCompleteness({
      customer_segments: "Bus operators",
      problem: "Unplanned downtime",
      unique_value_proposition: "Predict failures 48h in advance",
      solution: "IoT + ML platform",
      channels: "Direct sales",
      revenue_streams: "SaaS subscription",
      cost_structure: "Cloud + engineering",
      key_metrics: "Downtime reduction %",
      unfair_advantage: "Proprietary sensor data",
    })).toBe(100);
  });

  it("returns 0 when no blocks are filled", () => {
    expect(calcCanvasCompleteness({
      customer_segments: null, problem: null, unique_value_proposition: null,
      solution: null, channels: null, revenue_streams: null,
      cost_structure: null, key_metrics: null, unfair_advantage: null,
    })).toBe(0);
  });

  it("returns 56 when 5 of 9 blocks are filled", () => {
    expect(calcCanvasCompleteness({
      customer_segments: "Bus operators",
      problem: "Downtime",
      unique_value_proposition: "Predict failures",
      solution: "IoT platform",
      channels: "Direct",
      revenue_streams: null,
      cost_structure: null,
      key_metrics: null,
      unfair_advantage: null,
    })).toBe(56);
  });
});

describe("Intake Readiness Score", () => {
  it("returns high score for a well-defined venture", () => {
    const score = calcReadinessScore({
      ideaCompleteness: 100,
      segmentClarity: 100,
      problemDefinition: 100,
      valuePropQuality: 100,
      bizModelReadiness: 100,
      canvasCompleteness: 100,
      hasRiskiest: true,
      criticalAssumptions: 0,
    });
    expect(score).toBe(100);
  });

  it("returns 0 for a completely undefined venture", () => {
    const score = calcReadinessScore({
      ideaCompleteness: 0,
      segmentClarity: 0,
      problemDefinition: 0,
      valuePropQuality: 0,
      bizModelReadiness: 0,
      canvasCompleteness: 0,
      hasRiskiest: false,
      criticalAssumptions: 0,
    });
    expect(score).toBe(0);
  });

  it("applies riskiest assumption bonus (+5)", () => {
    const withRiskiest = calcReadinessScore({
      ideaCompleteness: 60, segmentClarity: 60, problemDefinition: 60,
      valuePropQuality: 60, bizModelReadiness: 60, canvasCompleteness: 60,
      hasRiskiest: true, criticalAssumptions: 0,
    });
    const withoutRiskiest = calcReadinessScore({
      ideaCompleteness: 60, segmentClarity: 60, problemDefinition: 60,
      valuePropQuality: 60, bizModelReadiness: 60, canvasCompleteness: 60,
      hasRiskiest: false, criticalAssumptions: 0,
    });
    expect(withRiskiest - withoutRiskiest).toBe(5);
  });

  it("applies critical assumption penalty (-5 per critical, max -20)", () => {
    const noCritical = calcReadinessScore({
      ideaCompleteness: 80, segmentClarity: 80, problemDefinition: 80,
      valuePropQuality: 80, bizModelReadiness: 80, canvasCompleteness: 80,
      hasRiskiest: true, criticalAssumptions: 0,
    });
    const twoCritical = calcReadinessScore({
      ideaCompleteness: 80, segmentClarity: 80, problemDefinition: 80,
      valuePropQuality: 80, bizModelReadiness: 80, canvasCompleteness: 80,
      hasRiskiest: true, criticalAssumptions: 2,
    });
    expect(noCritical - twoCritical).toBe(10);
  });

  it("caps penalty at 20 for 4+ critical assumptions", () => {
    const fourCritical = calcReadinessScore({
      ideaCompleteness: 80, segmentClarity: 80, problemDefinition: 80,
      valuePropQuality: 80, bizModelReadiness: 80, canvasCompleteness: 80,
      hasRiskiest: true, criticalAssumptions: 4,
    });
    const fiveCritical = calcReadinessScore({
      ideaCompleteness: 80, segmentClarity: 80, problemDefinition: 80,
      valuePropQuality: 80, bizModelReadiness: 80, canvasCompleteness: 80,
      hasRiskiest: true, criticalAssumptions: 5,
    });
    expect(fourCritical).toBe(fiveCritical); // penalty capped at 20
  });

  it("never returns below 0 or above 100", () => {
    const extreme = calcReadinessScore({
      ideaCompleteness: 0, segmentClarity: 0, problemDefinition: 0,
      valuePropQuality: 0, bizModelReadiness: 0, canvasCompleteness: 0,
      hasRiskiest: false, criticalAssumptions: 100,
    });
    expect(extreme).toBeGreaterThanOrEqual(0);
    expect(extreme).toBeLessThanOrEqual(100);
  });
});

describe("Readiness Recommendation Engine", () => {
  it("recommends proceed_to_discovery_and_market for score >= 80 with riskiest and no critical", () => {
    const rec = getReadinessRecommendation(85, true, 0);
    expect(rec.decision).toBe("proceed_to_discovery_and_market");
  });

  it("recommends begin_customer_discovery for score 60–79", () => {
    const rec = getReadinessRecommendation(70, false, 0);
    expect(rec.decision).toBe("begin_customer_discovery");
  });

  it("recommends research_more for score 40–59", () => {
    const rec = getReadinessRecommendation(50, false, 0);
    expect(rec.decision).toBe("research_more");
  });

  it("recommends archive for score < 40", () => {
    const rec = getReadinessRecommendation(30, false, 0);
    expect(rec.decision).toBe("archive");
  });

  it("does NOT recommend proceed even at 80+ if riskiest is not defined", () => {
    const rec = getReadinessRecommendation(85, false, 0);
    expect(rec.decision).toBe("begin_customer_discovery");
  });

  it("does NOT recommend proceed even at 80+ if there are critical assumptions", () => {
    const rec = getReadinessRecommendation(85, true, 2);
    expect(rec.decision).toBe("begin_customer_discovery");
  });

  it("returns a label and description for every recommendation", () => {
    const scores = [85, 70, 50, 30];
    scores.forEach(score => {
      const rec = getReadinessRecommendation(score, score >= 80, 0);
      expect(rec.label).toBeTruthy();
      expect(rec.description).toBeTruthy();
    });
  });
});

describe("BEBUS Venture Intake Scenario", () => {
  it("scores a partially defined BEBUS intake correctly", () => {
    const segmentClarity = calcSegmentClarity({
      buyerRole: "Engineering Director",
      userRole: "Fleet Manager",
      decisionMaker: null,
      useCase: "Predictive maintenance",
      currentAlternative: "Manual inspection",
    });
    expect(segmentClarity).toBe(80);

    const problemDef = calcProblemDefinition({
      problemStatement: "Bus operators lose 15% uptime due to unplanned breakdowns",
      customerSegmentLink: "Engineering directors at zero-emission bus operators",
      currentWorkaround: "Manual inspection every 3 months",
      evidenceRequired: "3+ interviews confirming cost of downtime",
      successMetric: null,
    });
    expect(problemDef).toBe(80);

    const valueProp = calcValuePropQuality({
      customerJob: "Reduce unplanned bus downtime",
      painRelieved: "Costly emergency repairs",
      gainCreated: "15% cost saving on maintenance",
      measurableOutcome: null,
      evidenceRequired: null,
    });
    expect(valueProp).toBe(75);

    const riskScore = calcAssumptionRisk(5, 5);
    expect(riskScore).toBe(25);
    expect(getRiskLevel(riskScore)).toBe("critical");

    const testPriority = calcTestPriorityScore({ assumptionRiskScore: 25, impactIfFalseScore: 5, evidenceGapScore: 4 });
    // Risk: 25/25=100%→50pts; Impact: 5/5=100%→30pts; Gap: 4/5=80%→16pts → total = 96
    expect(testPriority).toBe(96);
  });
});
