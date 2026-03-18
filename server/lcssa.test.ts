import { describe, it, expect } from "vitest";

// ── LCSSA scoring formula tests ───────────────────────────────────────────────
// Formula: LCSSA = (env * 0.35) + (soc * 0.30) + (lcc * 0.20) + (gov * 0.15)

function computeLcssaScore(env: number, soc: number, lcc: number, gov: number): number {
  return Math.round(((env * 0.35) + (soc * 0.30) + (lcc * 0.20) + (gov * 0.15)) * 10) / 10;
}

function computeEnvScore(renewableEnergyPct: number, wasteRecycledPct: number, biodiversityScore: number, carbonReductionTarget: number): number {
  const score = (renewableEnergyPct * 0.30) + (wasteRecycledPct * 0.25) + (biodiversityScore * 10 * 0.25) + (carbonReductionTarget * 0.20);
  return Math.min(100, Math.round(score));
}

function computeSocialScore(livingWage: boolean, hrDueDiligence: boolean, healthSafetyScore: number, communityEngagement: number): number {
  const base = (livingWage ? 30 : 0) + (hrDueDiligence ? 25 : 0) + (healthSafetyScore * 10 * 0.25) + (communityEngagement * 10 * 0.20);
  return Math.min(100, Math.round(base));
}

function computeLccScore(prodCost: number, logCost: number, maintCost: number, eolCost: number): number {
  const total = prodCost + logCost + maintCost + eolCost;
  if (total === 0) return 100;
  const eolRatio = eolCost / total;
  return Math.min(100, Math.round((1 - eolRatio) * 100));
}

function computeOversightScore(iso14001: boolean, iso26000: boolean, griLevel: string, sdgCount: number, dataQuality: number): number {
  const certScore = (iso14001 ? 25 : 0) + (iso26000 ? 20 : 0);
  const griScore = griLevel === "Comprehensive" ? 25 : griLevel === "Core" ? 15 : 0;
  const sdgScore = Math.min(15, sdgCount);
  const dqScore = dataQuality * 1.5;
  return Math.min(100, Math.round(certScore + griScore + sdgScore + dqScore));
}

describe("LCSSA Scoring Engine", () => {
  describe("computeLcssaScore", () => {
    it("returns 100 when all pillars are perfect", () => {
      expect(computeLcssaScore(100, 100, 100, 100)).toBe(100);
    });

    it("returns 0 when all pillars are zero", () => {
      expect(computeLcssaScore(0, 0, 0, 0)).toBe(0);
    });

    it("applies correct weights: env=35%, soc=30%, lcc=20%, gov=15%", () => {
      expect(computeLcssaScore(100, 0, 0, 0)).toBe(35);
      expect(computeLcssaScore(0, 100, 0, 0)).toBe(30);
      expect(computeLcssaScore(0, 0, 100, 0)).toBe(20);
      expect(computeLcssaScore(0, 0, 0, 100)).toBe(15);
    });

    it("computes a balanced mid-range score correctly", () => {
      // 50*0.35 + 60*0.30 + 70*0.20 + 80*0.15 = 17.5+18+14+12 = 61.5
      expect(computeLcssaScore(50, 60, 70, 80)).toBe(61.5);
    });

    it("rounds to 1 decimal place", () => {
      const result = computeLcssaScore(33, 33, 33, 33);
      expect(result.toString()).toMatch(/^\d+(\.\d)?$/);
    });
  });

  describe("Environmental LCA score", () => {
    it("perfect renewable energy and recycling yields high score", () => {
      const score = computeEnvScore(100, 100, 10, 100);
      expect(score).toBe(100);
    });

    it("zero values yield zero score", () => {
      expect(computeEnvScore(0, 0, 0, 0)).toBe(0);
    });

    it("50% renewable energy contributes 15 points", () => {
      const score = computeEnvScore(50, 0, 0, 0);
      expect(score).toBe(15);
    });

    it("caps at 100", () => {
      const score = computeEnvScore(100, 100, 10, 100);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe("Social LCA score", () => {
    it("living wage + HR due diligence = 55 base points", () => {
      const score = computeSocialScore(true, true, 0, 0);
      expect(score).toBe(55);
    });

    it("no compliance = 0 base", () => {
      expect(computeSocialScore(false, false, 0, 0)).toBe(0);
    });

    it("full H&S score (10/10) adds 25 points", () => {
      const score = computeSocialScore(false, false, 10, 0);
      expect(score).toBe(25);
    });

    it("caps at 100", () => {
      const score = computeSocialScore(true, true, 10, 10);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe("Life Cycle Costing score", () => {
    it("returns 100 when total cost is zero", () => {
      expect(computeLccScore(0, 0, 0, 0)).toBe(100);
    });

    it("high end-of-life ratio lowers score", () => {
      const score = computeLccScore(0, 0, 0, 100);
      expect(score).toBe(0);
    });

    it("balanced costs yield intermediate score", () => {
      // eolRatio = 25/100 = 0.25 → score = 75
      const score = computeLccScore(25, 25, 25, 25);
      expect(score).toBe(75);
    });
  });

  describe("Oversight & Governance score", () => {
    it("ISO 14001 + ISO 26000 + Comprehensive GRI = 70 base", () => {
      const score = computeOversightScore(true, true, "Comprehensive", 0, 0);
      expect(score).toBe(70);
    });

    it("no certifications = 0", () => {
      expect(computeOversightScore(false, false, "None", 0, 0)).toBe(0);
    });

    it("17 SDGs addressed adds 15 points", () => {
      const score = computeOversightScore(false, false, "None", 17, 0);
      expect(score).toBe(15);
    });

    it("data quality 10/10 adds 15 points", () => {
      const score = computeOversightScore(false, false, "None", 0, 10);
      expect(score).toBe(15);
    });

    it("caps at 100", () => {
      const score = computeOversightScore(true, true, "Comprehensive", 17, 10);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe("Decision impact classification", () => {
    const impactWeight = (impact: "Positive" | "Neutral" | "Negative") =>
      impact === "Positive" ? 1 : impact === "Negative" ? -1 : 0;

    it("positive impact returns +1", () => {
      expect(impactWeight("Positive")).toBe(1);
    });

    it("negative impact returns -1", () => {
      expect(impactWeight("Negative")).toBe(-1);
    });

    it("neutral impact returns 0", () => {
      expect(impactWeight("Neutral")).toBe(0);
    });

    it("integrated decision with all positive impacts has max weight 3", () => {
      const total = impactWeight("Positive") + impactWeight("Positive") + impactWeight("Positive");
      expect(total).toBe(3);
    });
  });

  describe("LCSSA pillar weight validation", () => {
    it("all weights sum to 1.0", () => {
      const weights = [0.35, 0.30, 0.20, 0.15];
      const sum = weights.reduce((a, b) => a + b, 0);
      expect(Math.round(sum * 100) / 100).toBe(1.0);
    });

    it("environmental pillar has highest weight", () => {
      const weights = { env: 0.35, soc: 0.30, lcc: 0.20, gov: 0.15 };
      const max = Math.max(...Object.values(weights));
      expect(max).toBe(weights.env);
    });

    it("governance pillar has lowest weight", () => {
      const weights = { env: 0.35, soc: 0.30, lcc: 0.20, gov: 0.15 };
      const min = Math.min(...Object.values(weights));
      expect(min).toBe(weights.gov);
    });
  });
});
