/**
 * IRL Scoring Engine Tests
 * Tests for the Impact Readiness Level computation:
 *   IRL = (ESG + LCA + PCF + CSR + Certification) / 5
 *   Total Venture Intelligence Score = VRL + IRL
 */

import { describe, it, expect } from "vitest";

// ── IRL formula helpers (mirrored from routers.ts) ────────────────────────────

function computeEsgScore(data: {
  carbonEmissionsScore: number;
  energyEfficiencyScore: number;
  waterManagementScore: number;
  wasteCircularityScore: number;
  biodiversityScore: number;
  workerWellbeingScore: number;
  diversityInclusionScore: number;
  communityEngagementScore: number;
  supplyChainEthicsScore: number;
  boardTransparencyScore: number;
  ethicsAntiCorruptionScore: number;
  stakeholderEngagementScore: number;
  dataPrivacyScore: number;
}): number {
  const envAvg = (
    data.carbonEmissionsScore +
    data.energyEfficiencyScore +
    data.waterManagementScore +
    data.wasteCircularityScore +
    data.biodiversityScore
  ) / 5;
  const socAvg = (
    data.workerWellbeingScore +
    data.diversityInclusionScore +
    data.communityEngagementScore +
    data.supplyChainEthicsScore
  ) / 4;
  const govAvg = (
    data.boardTransparencyScore +
    data.ethicsAntiCorruptionScore +
    data.stakeholderEngagementScore +
    data.dataPrivacyScore
  ) / 4;
  return (envAvg + socAvg + govAvg) / 3;
}

function computeLcaScore(stages: Array<{ assessmentMaturityScore: number }>): number {
  if (stages.length === 0) return 0;
  return stages.reduce((s, st) => s + st.assessmentMaturityScore, 0) / stages.length;
}

function computePcfScore(data: {
  scope1Emissions: number;
  scope2Emissions: number;
  scope3Emissions: number;
  netZeroCommitment: boolean;
  scienceBasedTarget: boolean;
  targetReductionPercent: number;
}): number {
  let score = 0;
  const total = data.scope1Emissions + data.scope2Emissions + data.scope3Emissions;
  if (total > 0) score += 3;        // emissions measured
  if (data.scienceBasedTarget) score += 3;
  if (data.netZeroCommitment) score += 2;
  if (data.targetReductionPercent >= 50) score += 2;
  return score;
}

function computeCsrScore(data: {
  philanthropyScore: number;
  ethicalSourcingScore: number;
  communityInvestmentScore: number;
  employeeVolunteeringScore: number;
  transparencyReportingScore: number;
}): number {
  return (
    data.philanthropyScore +
    data.ethicalSourcingScore +
    data.communityInvestmentScore +
    data.employeeVolunteeringScore +
    data.transparencyReportingScore
  ) / 5;
}

function computeCertScore(certs: Array<{ status: string; progressPercent: number; bImpactScore?: number | null }>): number {
  if (certs.length === 0) return 0;
  const statusWeights: Record<string, number> = {
    "Certified":     10,
    "Under Review":  7,
    "In Progress":   5,
    "Gap Analysis":  3,
    "Not Started":   1,
    "Lapsed":        2,
  };
  const avg = certs.reduce((s, c) => s + (statusWeights[c.status] ?? 1), 0) / certs.length;
  return avg;
}

function computeIrl(
  esgScore: number,
  lcaScore: number,
  pcfScore: number,
  csrScore: number,
  certScore: number,
): number {
  return (esgScore + lcaScore + pcfScore + csrScore + certScore) / 5;
}

function computeTvis(vrlScore: number, irlScore: number): number {
  return vrlScore + irlScore;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ESG Score Computation", () => {
  it("returns 5.0 for all-5 inputs", () => {
    const score = computeEsgScore({
      carbonEmissionsScore: 5, energyEfficiencyScore: 5, waterManagementScore: 5,
      wasteCircularityScore: 5, biodiversityScore: 5,
      workerWellbeingScore: 5, diversityInclusionScore: 5,
      communityEngagementScore: 5, supplyChainEthicsScore: 5,
      boardTransparencyScore: 5, ethicsAntiCorruptionScore: 5,
      stakeholderEngagementScore: 5, dataPrivacyScore: 5,
    });
    expect(score).toBeCloseTo(5.0, 2);
  });

  it("returns 10.0 for all-10 inputs", () => {
    const score = computeEsgScore({
      carbonEmissionsScore: 10, energyEfficiencyScore: 10, waterManagementScore: 10,
      wasteCircularityScore: 10, biodiversityScore: 10,
      workerWellbeingScore: 10, diversityInclusionScore: 10,
      communityEngagementScore: 10, supplyChainEthicsScore: 10,
      boardTransparencyScore: 10, ethicsAntiCorruptionScore: 10,
      stakeholderEngagementScore: 10, dataPrivacyScore: 10,
    });
    expect(score).toBeCloseTo(10.0, 2);
  });

  it("returns 0.0 for all-0 inputs", () => {
    const score = computeEsgScore({
      carbonEmissionsScore: 0, energyEfficiencyScore: 0, waterManagementScore: 0,
      wasteCircularityScore: 0, biodiversityScore: 0,
      workerWellbeingScore: 0, diversityInclusionScore: 0,
      communityEngagementScore: 0, supplyChainEthicsScore: 0,
      boardTransparencyScore: 0, ethicsAntiCorruptionScore: 0,
      stakeholderEngagementScore: 0, dataPrivacyScore: 0,
    });
    expect(score).toBeCloseTo(0.0, 2);
  });

  it("weights Environmental, Social, Governance equally", () => {
    // Env=10, Soc=0, Gov=0 → (10+0+0)/3 ≈ 3.33
    const score = computeEsgScore({
      carbonEmissionsScore: 10, energyEfficiencyScore: 10, waterManagementScore: 10,
      wasteCircularityScore: 10, biodiversityScore: 10,
      workerWellbeingScore: 0, diversityInclusionScore: 0,
      communityEngagementScore: 0, supplyChainEthicsScore: 0,
      boardTransparencyScore: 0, ethicsAntiCorruptionScore: 0,
      stakeholderEngagementScore: 0, dataPrivacyScore: 0,
    });
    expect(score).toBeCloseTo(10 / 3, 2);
  });
});

describe("LCA Score Computation", () => {
  it("returns 0 for empty stages array", () => {
    expect(computeLcaScore([])).toBe(0);
  });

  it("averages all stage maturity scores", () => {
    const stages = [
      { assessmentMaturityScore: 8 },
      { assessmentMaturityScore: 6 },
      { assessmentMaturityScore: 4 },
      { assessmentMaturityScore: 2 },
      { assessmentMaturityScore: 0 },
    ];
    expect(computeLcaScore(stages)).toBeCloseTo(4.0, 2);
  });

  it("returns perfect 10 when all stages are fully assessed", () => {
    const stages = Array(5).fill({ assessmentMaturityScore: 10 });
    expect(computeLcaScore(stages)).toBeCloseTo(10.0, 2);
  });
});

describe("PCF Score Computation", () => {
  it("returns 0 for no emissions data and no commitments", () => {
    const score = computePcfScore({
      scope1Emissions: 0, scope2Emissions: 0, scope3Emissions: 0,
      netZeroCommitment: false, scienceBasedTarget: false, targetReductionPercent: 0,
    });
    expect(score).toBe(0);
  });

  it("awards 3 points for measuring emissions (total > 0)", () => {
    const score = computePcfScore({
      scope1Emissions: 100, scope2Emissions: 0, scope3Emissions: 0,
      netZeroCommitment: false, scienceBasedTarget: false, targetReductionPercent: 0,
    });
    expect(score).toBe(3);
  });

  it("awards maximum 10 for full commitment set", () => {
    const score = computePcfScore({
      scope1Emissions: 100, scope2Emissions: 50, scope3Emissions: 200,
      netZeroCommitment: true, scienceBasedTarget: true, targetReductionPercent: 75,
    });
    expect(score).toBe(10);
  });

  it("does not award target bonus below 50%", () => {
    const score = computePcfScore({
      scope1Emissions: 100, scope2Emissions: 0, scope3Emissions: 0,
      netZeroCommitment: false, scienceBasedTarget: false, targetReductionPercent: 49,
    });
    expect(score).toBe(3); // only measurement points
  });
});

describe("CSR Score Computation", () => {
  it("returns average of 5 dimensions", () => {
    const score = computeCsrScore({
      philanthropyScore: 8, ethicalSourcingScore: 6,
      communityInvestmentScore: 7, employeeVolunteeringScore: 5,
      transparencyReportingScore: 4,
    });
    expect(score).toBeCloseTo(6.0, 2);
  });

  it("returns 0 for all-zero inputs", () => {
    const score = computeCsrScore({
      philanthropyScore: 0, ethicalSourcingScore: 0,
      communityInvestmentScore: 0, employeeVolunteeringScore: 0,
      transparencyReportingScore: 0,
    });
    expect(score).toBe(0);
  });
});

describe("Certification Score Computation", () => {
  it("returns 0 for no certifications", () => {
    expect(computeCertScore([])).toBe(0);
  });

  it("returns 10 for a single Certified entry", () => {
    expect(computeCertScore([{ status: "Certified", progressPercent: 100 }])).toBe(10);
  });

  it("averages across multiple certifications with different statuses", () => {
    const certs = [
      { status: "Certified",    progressPercent: 100 }, // 10
      { status: "In Progress",  progressPercent: 50  }, // 5
      { status: "Not Started",  progressPercent: 0   }, // 1
    ];
    const score = computeCertScore(certs);
    expect(score).toBeCloseTo((10 + 5 + 1) / 3, 2);
  });
});

describe("IRL Score Computation", () => {
  it("returns average of all 5 component scores", () => {
    const irl = computeIrl(8, 6, 7, 5, 4);
    expect(irl).toBeCloseTo(6.0, 2);
  });

  it("returns 10 when all components are 10", () => {
    expect(computeIrl(10, 10, 10, 10, 10)).toBeCloseTo(10.0, 2);
  });

  it("returns 0 when all components are 0", () => {
    expect(computeIrl(0, 0, 0, 0, 0)).toBe(0);
  });
});

describe("Total Venture Intelligence Score (TVIS)", () => {
  it("sums VRL and IRL correctly", () => {
    expect(computeTvis(7.5, 6.0)).toBeCloseTo(13.5, 2);
  });

  it("maximum TVIS is 19 (VRL 9 + IRL 10)", () => {
    expect(computeTvis(9, 10)).toBe(19);
  });

  it("minimum TVIS is 0", () => {
    expect(computeTvis(0, 0)).toBe(0);
  });

  it("TVIS is additive — VRL improvement raises TVIS", () => {
    const base = computeTvis(3, 5);
    const improved = computeTvis(6, 5);
    expect(improved - base).toBeCloseTo(3, 2);
  });

  it("TVIS is additive — IRL improvement raises TVIS", () => {
    const base = computeTvis(5, 2);
    const improved = computeTvis(5, 8);
    expect(improved - base).toBeCloseTo(6, 2);
  });
});

describe("IRL Formula Integration", () => {
  it("computes a realistic venture IRL from component inputs", () => {
    // EcoBlend R&D: early-stage ESG, partial LCA, no PCF, basic CSR, B Corp in progress
    const esg = computeEsgScore({
      carbonEmissionsScore: 6, energyEfficiencyScore: 5, waterManagementScore: 4,
      wasteCircularityScore: 7, biodiversityScore: 5,
      workerWellbeingScore: 7, diversityInclusionScore: 6,
      communityEngagementScore: 4, supplyChainEthicsScore: 5,
      boardTransparencyScore: 6, ethicsAntiCorruptionScore: 7,
      stakeholderEngagementScore: 5, dataPrivacyScore: 6,
    });
    const lca = computeLcaScore([
      { assessmentMaturityScore: 3 },
      { assessmentMaturityScore: 5 },
      { assessmentMaturityScore: 2 },
      { assessmentMaturityScore: 1 },
      { assessmentMaturityScore: 0 },
    ]);
    const pcf = computePcfScore({
      scope1Emissions: 45, scope2Emissions: 20, scope3Emissions: 0,
      netZeroCommitment: false, scienceBasedTarget: false, targetReductionPercent: 30,
    });
    const csr = computeCsrScore({
      philanthropyScore: 4, ethicalSourcingScore: 6,
      communityInvestmentScore: 3, employeeVolunteeringScore: 5,
      transparencyReportingScore: 4,
    });
    const cert = computeCertScore([
      { status: "In Progress", progressPercent: 40 },  // B Corp
    ]);
    const irl = computeIrl(esg, lca, pcf, csr, cert);
    // ESG ≈ 5.7, LCA = 2.2, PCF = 3, CSR = 4.4, Cert = 5 → IRL ≈ 4.06
    expect(irl).toBeGreaterThan(3);
    expect(irl).toBeLessThan(6);
  });
});
