// ─────────────────────────────────────────────────────────────────────────────
// POI MODULE — Vitest Unit Tests
// Tests POS formula computation and classification logic
// POS = (Cost + Performance + Quality + Sustainability) / 4
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";

// ── POS Score computation (pure function extracted for testing) ───────────────
function computePosScore(
  costScore: number,
  performanceScore: number,
  qualityScore: number,
  sustainabilityScore: number
): number {
  return (costScore + performanceScore + qualityScore + sustainabilityScore) / 4;
}

function classifyPos(posScore: number): string {
  if (posScore >= 4.1) return "Exceptional Opportunity";
  if (posScore >= 3.1) return "High Opportunity";
  if (posScore >= 2.1) return "Moderate Opportunity";
  return "Low Opportunity";
}

function computeDimensionScore(a: number, b: number, c: number): number {
  return (a + b + c) / 3;
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("POI — POS Formula", () => {
  it("computes POS as average of four dimension scores", () => {
    const pos = computePosScore(3, 4, 3, 4);
    expect(pos).toBeCloseTo(3.5, 5);
  });

  it("returns 1.0 when all dimensions are at minimum", () => {
    const pos = computePosScore(1, 1, 1, 1);
    expect(pos).toBeCloseTo(1.0, 5);
  });

  it("returns 5.0 when all dimensions are at maximum", () => {
    const pos = computePosScore(5, 5, 5, 5);
    expect(pos).toBeCloseTo(5.0, 5);
  });

  it("handles uneven dimension scores correctly", () => {
    const pos = computePosScore(1, 5, 1, 5);
    expect(pos).toBeCloseTo(3.0, 5);
  });
});

describe("POI — POS Classification", () => {
  it("classifies score >= 4.1 as Exceptional Opportunity", () => {
    expect(classifyPos(4.1)).toBe("Exceptional Opportunity");
    expect(classifyPos(5.0)).toBe("Exceptional Opportunity");
    expect(classifyPos(4.5)).toBe("Exceptional Opportunity");
  });

  it("classifies score >= 3.1 and < 4.1 as High Opportunity", () => {
    expect(classifyPos(3.1)).toBe("High Opportunity");
    expect(classifyPos(4.0)).toBe("High Opportunity");
    expect(classifyPos(3.5)).toBe("High Opportunity");
  });

  it("classifies score >= 2.1 and < 3.1 as Moderate Opportunity", () => {
    expect(classifyPos(2.1)).toBe("Moderate Opportunity");
    expect(classifyPos(3.0)).toBe("Moderate Opportunity");
    expect(classifyPos(2.5)).toBe("Moderate Opportunity");
  });

  it("classifies score < 2.1 as Low Opportunity", () => {
    expect(classifyPos(1.0)).toBe("Low Opportunity");
    expect(classifyPos(2.0)).toBe("Low Opportunity");
    expect(classifyPos(1.5)).toBe("Low Opportunity");
  });

  it("handles boundary value 4.1 as Exceptional (not High)", () => {
    expect(classifyPos(4.1)).toBe("Exceptional Opportunity");
  });

  it("handles boundary value 3.1 as High (not Moderate)", () => {
    expect(classifyPos(3.1)).toBe("High Opportunity");
  });
});

describe("POI — Dimension Score Computation", () => {
  it("averages three sub-scores correctly", () => {
    expect(computeDimensionScore(3, 4, 5)).toBeCloseTo(4.0, 5);
    expect(computeDimensionScore(1, 1, 1)).toBeCloseTo(1.0, 5);
    expect(computeDimensionScore(5, 5, 5)).toBeCloseTo(5.0, 5);
  });

  it("handles mixed scores", () => {
    expect(computeDimensionScore(2, 3, 4)).toBeCloseTo(3.0, 5);
    expect(computeDimensionScore(1, 5, 3)).toBeCloseTo(3.0, 5);
  });
});

describe("POI — Full Pipeline Scenario", () => {
  it("correctly scores a high-performing eco-packaging opportunity", () => {
    // Cost: manufacturing 4, supply chain 3, lifecycle 4 → 3.67
    const costScore = computeDimensionScore(4, 3, 4);
    // Performance: technical 4, efficiency 5, functionality 4 → 4.33
    const performanceScore = computeDimensionScore(4, 5, 4);
    // Quality: reliability 4, durability 4, UX 3 → 3.67
    const qualityScore = computeDimensionScore(4, 4, 3);
    // Sustainability: carbon 5, ESG 5, circularity 4 → 4.67
    const sustainabilityScore = computeDimensionScore(5, 5, 4);

    const posScore = computePosScore(costScore, performanceScore, qualityScore, sustainabilityScore);
    const classification = classifyPos(posScore);

    expect(posScore).toBeGreaterThan(3.1);
    expect(["High Opportunity", "Exceptional Opportunity"]).toContain(classification);
  });

  it("correctly identifies a low-scoring opportunity", () => {
    const costScore = computeDimensionScore(1, 2, 1);
    const performanceScore = computeDimensionScore(2, 1, 2);
    const qualityScore = computeDimensionScore(1, 1, 2);
    const sustainabilityScore = computeDimensionScore(1, 2, 1);

    const posScore = computePosScore(costScore, performanceScore, qualityScore, sustainabilityScore);
    const classification = classifyPos(posScore);

    expect(posScore).toBeLessThan(2.1);
    expect(classification).toBe("Low Opportunity");
  });
});
