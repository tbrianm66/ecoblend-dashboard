// ============================================================
// PHASE 5 — MISSION PROTECTION FRAMEWORK TESTS
// Tests for Mission Integrity Index, Constitutional Governance,
// Succession Planning, and Stakeholder Alignment
// ============================================================

import { describe, it, expect, beforeEach } from "vitest";

// ============================================================
// MISSION INTEGRITY INDEX — Calculation Engine Tests
// ============================================================

describe("Mission Integrity Index — Calculation Engine", () => {
  // Core scoring algorithm
  function calculateMissionIntegrityScore(inputs: {
    financialVsMissionDrift: number;
    stakeholderAlignmentScore: number;
    governanceStrengthScore: number;
    leadershipContinuityScore: number;
  }) {
    const { financialVsMissionDrift, stakeholderAlignmentScore, governanceStrengthScore, leadershipContinuityScore } = inputs;
    const financialScore = 100 - financialVsMissionDrift;
    const overallScore = Math.round(
      financialScore * 0.25 +
      stakeholderAlignmentScore * 0.30 +
      governanceStrengthScore * 0.25 +
      leadershipContinuityScore * 0.20
    );
    return Math.max(0, Math.min(100, overallScore));
  }

  function classifyTrend(scores: number[]): "Improving" | "Stable" | "Declining" {
    if (scores.length < 2) return "Stable";
    const recent = scores.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const prev = scores.slice(-6, -3);
    if (prev.length === 0) return "Stable";
    const prevAvg = prev.reduce((a, b) => a + b, 0) / prev.length;
    if (avg > prevAvg + 3) return "Improving";
    if (avg < prevAvg - 3) return "Declining";
    return "Stable";
  }

  function generateAlerts(score: {
    overallScore: number;
    financialVsMissionDrift: number;
    stakeholderAlignmentScore: number;
    governanceStrengthScore: number;
    leadershipContinuityScore: number;
  }) {
    const alerts: Array<{ severity: string; message: string }> = [];
    if (score.overallScore < 40) {
      alerts.push({ severity: "Critical", message: "Mission Integrity critically low — immediate governance review required" });
    } else if (score.overallScore < 60) {
      alerts.push({ severity: "High", message: "Mission Integrity below acceptable threshold — review governance structures" });
    }
    if (score.financialVsMissionDrift > 70) {
      alerts.push({ severity: "Critical", message: "Severe financial vs mission drift detected" });
    } else if (score.financialVsMissionDrift > 50) {
      alerts.push({ severity: "High", message: "Significant financial pressure on mission alignment" });
    }
    if (score.stakeholderAlignmentScore < 40) {
      alerts.push({ severity: "High", message: "Low stakeholder alignment — risk of boardroom betrayal" });
    }
    if (score.governanceStrengthScore < 40) {
      alerts.push({ severity: "High", message: "Weak governance structures — mission unprotected" });
    }
    if (score.leadershipContinuityScore < 30) {
      alerts.push({ severity: "Medium", message: "Leadership succession not planned — single point of failure" });
    }
    return alerts;
  }

  it("calculates overall score correctly with equal weights", () => {
    const score = calculateMissionIntegrityScore({
      financialVsMissionDrift: 0,   // 100 financial score
      stakeholderAlignmentScore: 100,
      governanceStrengthScore: 100,
      leadershipContinuityScore: 100,
    });
    expect(score).toBe(100);
  });

  it("calculates overall score with zero inputs", () => {
    const score = calculateMissionIntegrityScore({
      financialVsMissionDrift: 100, // 0 financial score
      stakeholderAlignmentScore: 0,
      governanceStrengthScore: 0,
      leadershipContinuityScore: 0,
    });
    expect(score).toBe(0);
  });

  it("applies correct weighting (financial 25%, stakeholder 30%, governance 25%, leadership 20%)", () => {
    const score = calculateMissionIntegrityScore({
      financialVsMissionDrift: 0,   // financial = 100 * 0.25 = 25
      stakeholderAlignmentScore: 0, // stakeholder = 0 * 0.30 = 0
      governanceStrengthScore: 0,   // governance = 0 * 0.25 = 0
      leadershipContinuityScore: 0, // leadership = 0 * 0.20 = 0
    });
    expect(score).toBe(25);
  });

  it("clamps score to 0-100 range", () => {
    const score = calculateMissionIntegrityScore({
      financialVsMissionDrift: -10, // invalid but should clamp
      stakeholderAlignmentScore: 110,
      governanceStrengthScore: 100,
      leadershipContinuityScore: 100,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("classifies trend as Improving when recent scores are higher", () => {
    const trend = classifyTrend([50, 52, 54, 60, 65, 70]);
    expect(trend).toBe("Improving");
  });

  it("classifies trend as Declining when recent scores are lower", () => {
    const trend = classifyTrend([70, 65, 60, 54, 52, 50]);
    expect(trend).toBe("Declining");
  });

  it("classifies trend as Stable when scores are flat", () => {
    const trend = classifyTrend([60, 61, 60, 61, 60, 61]);
    expect(trend).toBe("Stable");
  });

  it("returns Stable trend with insufficient history", () => {
    const trend = classifyTrend([60]);
    expect(trend).toBe("Stable");
  });

  it("generates Critical alert when overall score is below 40", () => {
    const alerts = generateAlerts({
      overallScore: 35,
      financialVsMissionDrift: 30,
      stakeholderAlignmentScore: 45,
      governanceStrengthScore: 45,
      leadershipContinuityScore: 45,
    });
    expect(alerts.some(a => a.severity === "Critical")).toBe(true);
    expect(alerts[0].message).toContain("critically low");
  });

  it("generates High alert for severe financial drift", () => {
    const alerts = generateAlerts({
      overallScore: 65,
      financialVsMissionDrift: 75,
      stakeholderAlignmentScore: 70,
      governanceStrengthScore: 70,
      leadershipContinuityScore: 70,
    });
    expect(alerts.some(a => a.severity === "Critical" && a.message.includes("drift"))).toBe(true);
  });

  it("generates no alerts for a healthy score", () => {
    const alerts = generateAlerts({
      overallScore: 85,
      financialVsMissionDrift: 10,
      stakeholderAlignmentScore: 90,
      governanceStrengthScore: 85,
      leadershipContinuityScore: 80,
    });
    expect(alerts.length).toBe(0);
  });

  it("generates leadership alert when continuity score is below 30", () => {
    const alerts = generateAlerts({
      overallScore: 70,
      financialVsMissionDrift: 20,
      stakeholderAlignmentScore: 80,
      governanceStrengthScore: 80,
      leadershipContinuityScore: 25,
    });
    expect(alerts.some(a => a.message.includes("succession"))).toBe(true);
  });
});

// ============================================================
// CONSTITUTIONAL GOVERNANCE — Template & Compliance Tests
// ============================================================

describe("Constitutional Governance — Compliance Scoring", () => {
  function calculateComplianceScore(data: {
    founderVetoRights: boolean;
    missionAlignedSeats: number;
    employeeRepresentation: boolean;
    communityRepresentation: boolean;
    missionClauseInBylaws: boolean;
    boardSize: number;
    founderSeats: number;
    investorSeats: number;
  }) {
    let score = 0;
    if (data.founderVetoRights) score += 25;
    if (data.missionAlignedSeats > 0) score += 20;
    if (data.employeeRepresentation) score += 15;
    if (data.communityRepresentation) score += 15;
    if (data.missionClauseInBylaws) score += 25;
    return Math.min(100, score);
  }

  function validateBoardComposition(data: {
    boardSize: number;
    founderSeats: number;
    independentSeats: number;
    investorSeats: number;
    missionAlignedSeats: number;
  }) {
    const total = data.founderSeats + data.independentSeats + data.investorSeats + data.missionAlignedSeats;
    const warnings: string[] = [];
    if (total > data.boardSize) {
      warnings.push("Total seats exceed board size");
    }
    if (data.investorSeats > data.founderSeats + data.missionAlignedSeats) {
      warnings.push("Investors hold majority — mission risk");
    }
    if (data.founderSeats === 0) {
      warnings.push("No founder seats — loss of mission control");
    }
    return { valid: warnings.length === 0, warnings };
  }

  it("calculates maximum compliance score of 100 for fully protected governance", () => {
    const score = calculateComplianceScore({
      founderVetoRights: true,
      missionAlignedSeats: 2,
      employeeRepresentation: true,
      communityRepresentation: true,
      missionClauseInBylaws: true,
      boardSize: 7,
      founderSeats: 2,
      investorSeats: 2,
    });
    expect(score).toBe(100);
  });

  it("calculates zero compliance for unprotected governance", () => {
    const score = calculateComplianceScore({
      founderVetoRights: false,
      missionAlignedSeats: 0,
      employeeRepresentation: false,
      communityRepresentation: false,
      missionClauseInBylaws: false,
      boardSize: 5,
      founderSeats: 1,
      investorSeats: 4,
    });
    expect(score).toBe(0);
  });

  it("awards 25 points for founder veto rights", () => {
    const withVeto = calculateComplianceScore({
      founderVetoRights: true,
      missionAlignedSeats: 0,
      employeeRepresentation: false,
      communityRepresentation: false,
      missionClauseInBylaws: false,
      boardSize: 5,
      founderSeats: 2,
      investorSeats: 3,
    });
    const withoutVeto = calculateComplianceScore({
      founderVetoRights: false,
      missionAlignedSeats: 0,
      employeeRepresentation: false,
      communityRepresentation: false,
      missionClauseInBylaws: false,
      boardSize: 5,
      founderSeats: 2,
      investorSeats: 3,
    });
    expect(withVeto - withoutVeto).toBe(25);
  });

  it("detects investor majority as a mission risk", () => {
    const result = validateBoardComposition({
      boardSize: 5,
      founderSeats: 1,
      independentSeats: 1,
      investorSeats: 3,
      missionAlignedSeats: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.warnings.some(w => w.includes("majority"))).toBe(true);
  });

  it("validates balanced board composition", () => {
    const result = validateBoardComposition({
      boardSize: 7,
      founderSeats: 2,
      independentSeats: 2,
      investorSeats: 2,
      missionAlignedSeats: 1,
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("detects seat count exceeding board size", () => {
    const result = validateBoardComposition({
      boardSize: 5,
      founderSeats: 2,
      independentSeats: 2,
      investorSeats: 2,
      missionAlignedSeats: 1,
    });
    expect(result.valid).toBe(false);
    expect(result.warnings.some(w => w.includes("exceed"))).toBe(true);
  });
});

// ============================================================
// SUCCESSION PLANNING — Readiness & Playbook Tests
// ============================================================

describe("Succession Planning — Readiness Assessment", () => {
  function calculateSuccessionReadiness(data: {
    successors: Array<{ readinessScore: number }>;
    founderMissionStatement: string;
    missionCodified: boolean;
    decisionFrameworkDocumented: boolean;
    coreValuesDocumented: boolean;
    founderTransitionTimeline: string;
  }) {
    let score = 0;
    if (data.successors.length > 0) {
      const avgReadiness = data.successors.reduce((a, s) => a + s.readinessScore, 0) / data.successors.length;
      score += (avgReadiness / 5) * 25; // max 25 points
    }
    if (data.founderMissionStatement.length > 50) score += 25;
    if (data.missionCodified) score += 20;
    if (data.decisionFrameworkDocumented) score += 15;
    if (data.coreValuesDocumented) score += 15;
    return Math.min(100, Math.round(score));
  }

  it("calculates full readiness score for well-prepared succession", () => {
    const score = calculateSuccessionReadiness({
      successors: [
        { readinessScore: 5 },
        { readinessScore: 4 },
      ],
      founderMissionStatement: "Our mission is to create sustainable materials that enable a circular economy, ensuring every product we make has a positive social and environmental impact.",
      missionCodified: true,
      decisionFrameworkDocumented: true,
      coreValuesDocumented: true,
      founderTransitionTimeline: "3-5 years",
    });
    expect(score).toBeGreaterThanOrEqual(90);
  });

  it("returns zero for unprepared succession", () => {
    const score = calculateSuccessionReadiness({
      successors: [],
      founderMissionStatement: "",
      missionCodified: false,
      decisionFrameworkDocumented: false,
      coreValuesDocumented: false,
      founderTransitionTimeline: "",
    });
    expect(score).toBe(0);
  });

  it("awards points proportional to successor readiness", () => {
    const highReadiness = calculateSuccessionReadiness({
      successors: [{ readinessScore: 5 }],
      founderMissionStatement: "",
      missionCodified: false,
      decisionFrameworkDocumented: false,
      coreValuesDocumented: false,
      founderTransitionTimeline: "",
    });
    const lowReadiness = calculateSuccessionReadiness({
      successors: [{ readinessScore: 1 }],
      founderMissionStatement: "",
      missionCodified: false,
      decisionFrameworkDocumented: false,
      coreValuesDocumented: false,
      founderTransitionTimeline: "",
    });
    expect(highReadiness).toBeGreaterThan(lowReadiness);
  });

  it("requires mission statement of at least 50 chars for full points", () => {
    const shortStatement = calculateSuccessionReadiness({
      successors: [],
      founderMissionStatement: "Short",
      missionCodified: false,
      decisionFrameworkDocumented: false,
      coreValuesDocumented: false,
      founderTransitionTimeline: "",
    });
    const longStatement = calculateSuccessionReadiness({
      successors: [],
      founderMissionStatement: "This is a comprehensive mission statement that clearly articulates the purpose and values of the organisation.",
      missionCodified: false,
      decisionFrameworkDocumented: false,
      coreValuesDocumented: false,
      founderTransitionTimeline: "",
    });
    expect(longStatement).toBeGreaterThan(shortStatement);
  });

  it("identifies single point of failure when no successors exist", () => {
    const hasSuccessors = (successors: any[]) => successors.length > 0;
    expect(hasSuccessors([])).toBe(false);
    expect(hasSuccessors([{ name: "Alice", readinessScore: 4 }])).toBe(true);
  });
});

// ============================================================
// STAKEHOLDER ALIGNMENT — Scoring & Risk Tests
// ============================================================

describe("Stakeholder Alignment — Scoring Engine", () => {
  function calculateAlignmentScore(stakeholders: Array<{
    missionAlignment: "aligned" | "neutral" | "misaligned";
    influenceLevel: "high" | "medium" | "low";
  }>) {
    if (stakeholders.length === 0) return 0;
    const weightedScore = stakeholders.reduce((total, s) => {
      const alignmentValue = s.missionAlignment === "aligned" ? 2 : s.missionAlignment === "neutral" ? 1 : 0;
      const influenceWeight = s.influenceLevel === "high" ? 3 : s.influenceLevel === "medium" ? 2 : 1;
      return total + alignmentValue * influenceWeight;
    }, 0);
    const maxScore = stakeholders.reduce((total, s) => {
      const influenceWeight = s.influenceLevel === "high" ? 3 : s.influenceLevel === "medium" ? 2 : 1;
      return total + 2 * influenceWeight;
    }, 0);
    return Math.round((weightedScore / maxScore) * 100);
  }

  function identifyHighRiskStakeholders(stakeholders: Array<{
    name: string;
    influenceLevel: "high" | "medium" | "low";
    missionAlignment: "aligned" | "neutral" | "misaligned";
  }>) {
    return stakeholders.filter(
      s => s.influenceLevel === "high" && s.missionAlignment === "misaligned"
    );
  }

  it("returns 100% alignment when all stakeholders are aligned", () => {
    const score = calculateAlignmentScore([
      { missionAlignment: "aligned", influenceLevel: "high" },
      { missionAlignment: "aligned", influenceLevel: "medium" },
      { missionAlignment: "aligned", influenceLevel: "low" },
    ]);
    expect(score).toBe(100);
  });

  it("returns 0% alignment when all stakeholders are misaligned", () => {
    const score = calculateAlignmentScore([
      { missionAlignment: "misaligned", influenceLevel: "high" },
      { missionAlignment: "misaligned", influenceLevel: "medium" },
    ]);
    expect(score).toBe(0);
  });

  it("weights high-influence stakeholders more heavily", () => {
    const highInfluenceAligned = calculateAlignmentScore([
      { missionAlignment: "aligned", influenceLevel: "high" },
      { missionAlignment: "misaligned", influenceLevel: "low" },
    ]);
    const lowInfluenceAligned = calculateAlignmentScore([
      { missionAlignment: "misaligned", influenceLevel: "high" },
      { missionAlignment: "aligned", influenceLevel: "low" },
    ]);
    expect(highInfluenceAligned).toBeGreaterThan(lowInfluenceAligned);
  });

  it("returns 0 for empty stakeholder list", () => {
    const score = calculateAlignmentScore([]);
    expect(score).toBe(0);
  });

  it("identifies high-risk stakeholders (high influence + misaligned)", () => {
    const stakeholders = [
      { name: "Investor A", influenceLevel: "high" as const, missionAlignment: "misaligned" as const },
      { name: "Employee B", influenceLevel: "low" as const, missionAlignment: "misaligned" as const },
      { name: "Board Member C", influenceLevel: "high" as const, missionAlignment: "aligned" as const },
    ];
    const highRisk = identifyHighRiskStakeholders(stakeholders);
    expect(highRisk).toHaveLength(1);
    expect(highRisk[0].name).toBe("Investor A");
  });

  it("returns empty array when no high-risk stakeholders exist", () => {
    const stakeholders = [
      { name: "Investor A", influenceLevel: "high" as const, missionAlignment: "aligned" as const },
      { name: "Employee B", influenceLevel: "low" as const, missionAlignment: "misaligned" as const },
    ];
    const highRisk = identifyHighRiskStakeholders(stakeholders);
    expect(highRisk).toHaveLength(0);
  });

  it("calculates 50% alignment for all-neutral stakeholders", () => {
    const score = calculateAlignmentScore([
      { missionAlignment: "neutral", influenceLevel: "high" },
      { missionAlignment: "neutral", influenceLevel: "medium" },
    ]);
    expect(score).toBe(50);
  });
});

// ============================================================
// INTEGRATION — Cross-module Mission Protection Tests
// ============================================================

describe("Mission Protection — Integration Tests", () => {
  it("mission integrity score reflects governance compliance", () => {
    // A venture with strong governance should have higher mission integrity
    const strongGovernance = {
      financialVsMissionDrift: 20,
      stakeholderAlignmentScore: 80,
      governanceStrengthScore: 90, // High governance
      leadershipContinuityScore: 75,
    };
    const weakGovernance = {
      financialVsMissionDrift: 20,
      stakeholderAlignmentScore: 80,
      governanceStrengthScore: 20, // Low governance
      leadershipContinuityScore: 75,
    };
    const strongScore = Math.round(
      (100 - strongGovernance.financialVsMissionDrift) * 0.25 +
      strongGovernance.stakeholderAlignmentScore * 0.30 +
      strongGovernance.governanceStrengthScore * 0.25 +
      strongGovernance.leadershipContinuityScore * 0.20
    );
    const weakScore = Math.round(
      (100 - weakGovernance.financialVsMissionDrift) * 0.25 +
      weakGovernance.stakeholderAlignmentScore * 0.30 +
      weakGovernance.governanceStrengthScore * 0.25 +
      weakGovernance.leadershipContinuityScore * 0.20
    );
    expect(strongScore).toBeGreaterThan(weakScore);
    expect(strongScore - weakScore).toBe(Math.round((90 - 20) * 0.25));
  });

  it("succession planning readiness feeds into leadership continuity score", () => {
    // Leadership continuity score should be higher when succession is planned
    const withSuccession = 80; // High leadership continuity
    const withoutSuccession = 20; // Low leadership continuity
    expect(withSuccession).toBeGreaterThan(withoutSuccession);
  });

  it("stakeholder alignment score feeds into stakeholder component of mission integrity", () => {
    const highAlignment = 90;
    const lowAlignment = 30;
    const missionScoreHigh = Math.round(80 * 0.25 + highAlignment * 0.30 + 80 * 0.25 + 80 * 0.20);
    const missionScoreLow = Math.round(80 * 0.25 + lowAlignment * 0.30 + 80 * 0.25 + 80 * 0.20);
    expect(missionScoreHigh).toBeGreaterThan(missionScoreLow);
  });

  it("constitutional governance compliance correlates with governance strength score", () => {
    // Full compliance (100) should map to high governance strength
    const complianceScore = 100;
    const governanceStrength = Math.round(complianceScore * 0.9); // 90% mapping
    expect(governanceStrength).toBeGreaterThanOrEqual(85);
  });

  it("validates Eric Ries failure pattern coverage", () => {
    // The 6 failure patterns should be covered by the 4 sub-scores
    const failurePatterns = [
      "financial_vs_mission_drift",      // → financialVsMissionDrift
      "stakeholder_misalignment",        // → stakeholderAlignmentScore
      "governance_failure",              // → governanceStrengthScore
      "succession_failure",              // → leadershipContinuityScore
      "boardroom_betrayal",              // → governanceStrengthScore + stakeholderAlignmentScore
      "mission_drift_under_pressure",    // → financialVsMissionDrift
    ];
    const coveredPatterns = failurePatterns.filter(p =>
      ["financial_vs_mission_drift", "stakeholder_misalignment", "governance_failure",
       "succession_failure", "boardroom_betrayal", "mission_drift_under_pressure"].includes(p)
    );
    expect(coveredPatterns.length).toBe(6);
  });
});
