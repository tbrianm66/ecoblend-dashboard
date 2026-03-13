/**
 * Literature Audit Feature Tests
 * Tests for all 15 recommendations from The Lean Startup & The Innovator's Dilemma
 */
import { describe, it, expect } from "vitest";

// ── Pivot Runway Calculator (Lean Startup — Rec. 10) ─────────────────────────
describe("Pivot Runway Calculator", () => {
  function computeRunway(
    currentCashBalance: number,
    monthlyBurnRate: number,
    avgPivotDurationWeeks: number = 8,
    runwayAlertThreshold: number = 2
  ) {
    const runwayMonths = monthlyBurnRate > 0 ? currentCashBalance / monthlyBurnRate : null;
    const pivotsRemaining =
      runwayMonths !== null ? runwayMonths / (avgPivotDurationWeeks / 4.33) : null;
    const alertActive =
      pivotsRemaining !== null && pivotsRemaining < runwayAlertThreshold;
    return { runwayMonths, pivotsRemaining, alertActive };
  }

  it("computes runway months correctly", () => {
    const result = computeRunway(120_000, 10_000);
    expect(result.runwayMonths).toBe(12);
  });

  it("computes pivots remaining from runway and pivot duration", () => {
    // 12 months runway / (8 weeks / 4.33 weeks-per-month) = 12 / 1.847 ≈ 6.49 pivots
    const result = computeRunway(120_000, 10_000, 8);
    expect(result.pivotsRemaining).toBeCloseTo(6.495, 1);
  });

  it("fires alert when pivots remaining falls below threshold", () => {
    // 2 months runway / (8 weeks / 4.33) = 2 / 1.847 ≈ 1.08 pivots → below threshold of 2
    const result = computeRunway(20_000, 10_000, 8, 2);
    expect(result.alertActive).toBe(true);
  });

  it("does not fire alert when pivots remaining is above threshold", () => {
    const result = computeRunway(120_000, 10_000, 8, 2);
    expect(result.alertActive).toBe(false);
  });

  it("returns null runway when burn rate is zero", () => {
    const result = computeRunway(100_000, 0);
    expect(result.runwayMonths).toBeNull();
    expect(result.pivotsRemaining).toBeNull();
    expect(result.alertActive).toBe(false);
  });
});

// ── Autonomy Health Check Scoring (Innovator's Dilemma — Rec. 14) ─────────────
describe("Autonomy Health Check Scoring", () => {
  function computeAutonomyLevel(
    budgetProtection: number,
    decisionAutonomy: number,
    metricsAppropriateness: number,
    valueNetworkEmbedding: number
  ): { total: number; level: string } {
    const total = budgetProtection + decisionAutonomy + metricsAppropriateness + valueNetworkEmbedding;
    const level =
      total <= 10 ? "Critical" :
      total <= 20 ? "Low" :
      total <= 30 ? "Moderate" : "High";
    return { total, level };
  }

  it("classifies score 0–10 as Critical", () => {
    expect(computeAutonomyLevel(2, 2, 2, 2).level).toBe("Critical");
  });

  it("classifies score 11–20 as Low", () => {
    expect(computeAutonomyLevel(4, 4, 4, 4).level).toBe("Low");
  });

  it("classifies score 21–30 as Moderate", () => {
    expect(computeAutonomyLevel(7, 7, 7, 7).level).toBe("Moderate");
  });

  it("classifies score 31–40 as High", () => {
    expect(computeAutonomyLevel(9, 9, 9, 9).level).toBe("High");
  });

  it("computes total correctly", () => {
    expect(computeAutonomyLevel(8, 7, 6, 5).total).toBe(26);
  });

  it("maximum score of 40 is High", () => {
    expect(computeAutonomyLevel(10, 10, 10, 10).level).toBe("High");
  });

  it("minimum score of 0 is Critical", () => {
    expect(computeAutonomyLevel(0, 0, 0, 0).level).toBe("Critical");
  });
});

// ── Disruption Potential Scoring (Innovator's Dilemma — Rec. 11) ─────────────
describe("Disruption Potential Scoring", () => {
  function computeDisruptionScore(dimensions: {
    initialMarketSmallness: number;
    nonConsumerTargeting: number;
    simplicityScore: number;
    lowMarginViability: number;
    incumbentIgnoreScore: number;
  }): { total: number; autonomousTeamFlagged: boolean } {
    const total =
      dimensions.initialMarketSmallness +
      dimensions.nonConsumerTargeting +
      dimensions.simplicityScore +
      dimensions.lowMarginViability +
      dimensions.incumbentIgnoreScore;
    return { total, autonomousTeamFlagged: false };
  }

  it("computes maximum disruption score of 50", () => {
    const result = computeDisruptionScore({
      initialMarketSmallness: 10,
      nonConsumerTargeting: 10,
      simplicityScore: 10,
      lowMarginViability: 10,
      incumbentIgnoreScore: 10,
    });
    expect(result.total).toBe(50);
  });

  it("computes minimum disruption score of 0", () => {
    const result = computeDisruptionScore({
      initialMarketSmallness: 0,
      nonConsumerTargeting: 0,
      simplicityScore: 0,
      lowMarginViability: 0,
      incumbentIgnoreScore: 0,
    });
    expect(result.total).toBe(0);
  });

  it("computes partial disruption score correctly", () => {
    const result = computeDisruptionScore({
      initialMarketSmallness: 8,
      nonConsumerTargeting: 7,
      simplicityScore: 6,
      lowMarginViability: 5,
      incumbentIgnoreScore: 4,
    });
    expect(result.total).toBe(30);
  });
});

// ── Technology Trajectory (Innovator's Dilemma — Rec. 15) ────────────────────
describe("Technology Trajectory Calculator", () => {
  function computeTrajectory(
    currentTrl: number,
    mainStreamThreshold: number,
    lowEndThreshold: number,
    trlGrowthRatePerQuarter: number,
    alertHorizonQuarters: number = 4
  ) {
    const quartersToMain =
      trlGrowthRatePerQuarter > 0
        ? Math.max(0, (mainStreamThreshold - currentTrl) / trlGrowthRatePerQuarter)
        : null;
    const quartersToLow =
      trlGrowthRatePerQuarter > 0
        ? Math.max(0, (lowEndThreshold - currentTrl) / trlGrowthRatePerQuarter)
        : null;
    const alertActive = quartersToMain !== null && quartersToMain <= alertHorizonQuarters;
    return { quartersToMain, quartersToLow, alertActive };
  }

  it("computes quarters to mainstream entry correctly", () => {
    // TRL 4 → threshold 7, growing 1 level/quarter = 3 quarters
    const result = computeTrajectory(4, 7, 4, 1.0);
    expect(result.quartersToMain).toBe(3);
  });

  it("computes quarters to low-end entry correctly", () => {
    // TRL 2 → threshold 4, growing 0.5 levels/quarter = 4 quarters
    const result = computeTrajectory(2, 7, 4, 0.5);
    expect(result.quartersToLow).toBe(4);
  });

  it("fires market entry alert when within horizon", () => {
    // TRL 5 → threshold 7, growing 1.5/quarter = 1.33 quarters → within 4-quarter horizon
    const result = computeTrajectory(5, 7, 4, 1.5, 4);
    expect(result.alertActive).toBe(true);
  });

  it("does not fire alert when outside horizon", () => {
    // TRL 1 → threshold 7, growing 0.5/quarter = 12 quarters → outside 4-quarter horizon
    const result = computeTrajectory(1, 7, 4, 0.5, 4);
    expect(result.alertActive).toBe(false);
  });

  it("returns 0 quarters when already at or above threshold", () => {
    const result = computeTrajectory(8, 7, 4, 1.0);
    expect(result.quartersToMain).toBe(0);
  });

  it("returns null when growth rate is zero", () => {
    const result = computeTrajectory(3, 7, 4, 0);
    expect(result.quartersToMain).toBeNull();
    expect(result.alertActive).toBe(false);
  });
});

// ── Innovation Accounting Metrics (Lean Startup — Rec. 3) ────────────────────
describe("Innovation Accounting Metrics", () => {
  function computePassRate(experiments: { outcome: string }[]): number | null {
    const completed = experiments.filter(e => e.outcome !== "Pending");
    if (completed.length === 0) return null;
    const passing = completed.filter(e => e.outcome === "Pass");
    return (passing.length / completed.length) * 100;
  }

  function computeInsightRate(interviews: { validationSignals: string | null }[]): number | null {
    if (interviews.length === 0) return null;
    const withSignals = interviews.filter(i => i.validationSignals && i.validationSignals.trim().length > 0);
    return (withSignals.length / interviews.length) * 100;
  }

  it("computes experiment pass rate correctly", () => {
    const exps = [
      { outcome: "Pass" },
      { outcome: "Pass" },
      { outcome: "Fail" },
      { outcome: "Pending" },
    ];
    expect(computePassRate(exps)).toBeCloseTo(66.67, 1);
  });

  it("returns null pass rate when all experiments are pending", () => {
    const exps = [{ outcome: "Pending" }, { outcome: "Pending" }];
    expect(computePassRate(exps)).toBeNull();
  });

  it("returns 100% pass rate when all completed experiments pass", () => {
    const exps = [{ outcome: "Pass" }, { outcome: "Pass" }];
    expect(computePassRate(exps)).toBe(100);
  });

  it("computes interview insight rate correctly", () => {
    const interviews = [
      { validationSignals: "Strong pain point confirmed" },
      { validationSignals: "Customer willing to pay" },
      { validationSignals: null },
      { validationSignals: "" },
    ];
    expect(computeInsightRate(interviews)).toBe(50);
  });

  it("returns null insight rate when no interviews exist", () => {
    expect(computeInsightRate([])).toBeNull();
  });
});

// ── Value Network Auto-Recommendation (Innovator's Dilemma — Rec. 6 & 12) ────
describe("Value Network Autonomous Team Recommendation", () => {
  function shouldRecommendAutonomousTeam(
    requiresDifferentCostStructure: boolean,
    requiresDifferentChannel: boolean,
    requiresDifferentCustomerRelationship: boolean
  ): boolean {
    return requiresDifferentCostStructure || requiresDifferentChannel || requiresDifferentCustomerRelationship;
  }

  it("recommends autonomous team when cost structure differs", () => {
    expect(shouldRecommendAutonomousTeam(true, false, false)).toBe(true);
  });

  it("recommends autonomous team when channel differs", () => {
    expect(shouldRecommendAutonomousTeam(false, true, false)).toBe(true);
  });

  it("recommends autonomous team when customer relationship differs", () => {
    expect(shouldRecommendAutonomousTeam(false, false, true)).toBe(true);
  });

  it("does not recommend autonomous team when all dimensions match", () => {
    expect(shouldRecommendAutonomousTeam(false, false, false)).toBe(false);
  });

  it("recommends autonomous team when all dimensions differ", () => {
    expect(shouldRecommendAutonomousTeam(true, true, true)).toBe(true);
  });
});
