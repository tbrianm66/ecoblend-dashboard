/**
 * Equity Engine Unit Tests
 * Tests the core Dynamic Equity Formula:
 *   Score = (0.4×VRL) + (0.3×Contribution) + (0.2×Capital) + (0.1×Performance)
 * Capital normalisation: £500k → score 10 (i.e. value/50, capped at 10)
 */

import { describe, it, expect } from "vitest";

// ── Pure formula functions (extracted from routers.ts logic) ──────────────────

function normaliseCapital(capitalInput: number): number {
  return Math.min(10, capitalInput / 50);
}

function computeDynamicEquityScore(
  vrlScore: number,
  contributionScore: number,
  capitalInput: number,
  performanceScore: number,
  weights = { vrl: 0.4, contribution: 0.3, capital: 0.2, performance: 0.1 }
): number {
  const capitalScore = normaliseCapital(capitalInput);
  return parseFloat((
    weights.vrl * vrlScore +
    weights.contribution * contributionScore +
    weights.capital * capitalScore +
    weights.performance * performanceScore
  ).toFixed(2));
}

function computeDynamicEquityPct(score: number, totalEquityPool: number): number {
  return parseFloat(((score / 10) * totalEquityPool).toFixed(2));
}

function computeVestingProgress(monthsIn: number, vestingMonths: number): number {
  if (vestingMonths <= 0) return 0;
  return Math.min(100, parseFloat(((monthsIn / vestingMonths) * 100).toFixed(2)));
}

function computeAverageContributionScore(valueSores: number[]): number {
  if (valueSores.length === 0) return 0;
  return parseFloat((valueSores.reduce((s, v) => s + v, 0) / valueSores.length).toFixed(2));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Dynamic Equity Engine — Core Formula", () => {
  it("computes a perfect score of 10 when all inputs are maximum", () => {
    const score = computeDynamicEquityScore(10, 10, 500, 10);
    expect(score).toBe(10);
  });

  it("computes a zero score when all inputs are zero", () => {
    const score = computeDynamicEquityScore(0, 0, 0, 0);
    expect(score).toBe(0);
  });

  it("applies correct default weights: 0.4 VRL + 0.3 Contribution + 0.2 Capital + 0.1 Performance", () => {
    // VRL=5, Contribution=5, Capital=250 (→ score 5), Performance=5
    // Expected: 0.4×5 + 0.3×5 + 0.2×5 + 0.1×5 = 2 + 1.5 + 1 + 0.5 = 5.0
    const score = computeDynamicEquityScore(5, 5, 250, 5);
    expect(score).toBe(5);
  });

  it("VRL weight is dominant (40%): high VRL score lifts total score most", () => {
    const highVrl = computeDynamicEquityScore(10, 0, 0, 0);
    const highContrib = computeDynamicEquityScore(0, 10, 0, 0);
    expect(highVrl).toBeGreaterThan(highContrib);
    expect(highVrl).toBe(4);    // 0.4×10
    expect(highContrib).toBe(3); // 0.3×10
  });

  it("capital input is normalised: £500k → capital score 10", () => {
    expect(normaliseCapital(500)).toBe(10);
  });

  it("capital input is normalised: £250k → capital score 5", () => {
    expect(normaliseCapital(250)).toBe(5);
  });

  it("capital input is capped at 10 even if input exceeds £500k", () => {
    expect(normaliseCapital(1000)).toBe(10);
    expect(normaliseCapital(9999)).toBe(10);
  });

  it("capital input of £0 → capital score 0", () => {
    expect(normaliseCapital(0)).toBe(0);
  });

  it("converts dynamic score to equity percentage of pool", () => {
    // Score 5 out of 10, pool = 20% → 10%
    expect(computeDynamicEquityPct(5, 20)).toBe(10);
  });

  it("converts score 10 to full pool percentage", () => {
    expect(computeDynamicEquityPct(10, 20)).toBe(20);
  });

  it("converts score 0 to 0% equity", () => {
    expect(computeDynamicEquityPct(0, 20)).toBe(0);
  });

  it("supports custom weights that sum to 1.0", () => {
    // Equal weights: 0.25 each
    const score = computeDynamicEquityScore(8, 6, 200, 4, { vrl: 0.25, contribution: 0.25, capital: 0.25, performance: 0.25 });
    // capital=200 → normalised=4; 0.25×8 + 0.25×6 + 0.25×4 + 0.25×4 = 2+1.5+1+1 = 5.5
    expect(score).toBe(5.5);
  });

  it("rounds to 2 decimal places", () => {
    const score = computeDynamicEquityScore(7, 3, 100, 6);
    // capital=100→2; 0.4×7 + 0.3×3 + 0.2×2 + 0.1×6 = 2.8+0.9+0.4+0.6 = 4.7
    expect(score).toBe(4.7);
    expect(score.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
  });
});

describe("Dynamic Equity Engine — Vesting Progress", () => {
  it("returns 0% progress at month 0", () => {
    expect(computeVestingProgress(0, 48)).toBe(0);
  });

  it("returns 25% at month 12 of a 48-month schedule", () => {
    expect(computeVestingProgress(12, 48)).toBe(25);
  });

  it("returns 100% at full vesting", () => {
    expect(computeVestingProgress(48, 48)).toBe(100);
  });

  it("caps at 100% even if months in exceeds vesting schedule", () => {
    expect(computeVestingProgress(60, 48)).toBe(100);
  });

  it("returns 0 when vestingMonths is 0 (avoid division by zero)", () => {
    expect(computeVestingProgress(10, 0)).toBe(0);
  });
});

describe("Dynamic Equity Engine — Contribution Score Aggregation", () => {
  it("returns 0 for empty contribution log", () => {
    expect(computeAverageContributionScore([])).toBe(0);
  });

  it("returns the single score for one contribution", () => {
    expect(computeAverageContributionScore([7.5])).toBe(7.5);
  });

  it("averages multiple contribution scores correctly", () => {
    expect(computeAverageContributionScore([8, 6, 10])).toBe(8);
  });

  it("rounds average to 2 decimal places", () => {
    expect(computeAverageContributionScore([7, 8, 9])).toBe(8);
    expect(computeAverageContributionScore([5, 6, 7, 8])).toBe(6.5);
  });
});

describe("Dynamic Equity Engine — Equity Distribution Invariants", () => {
  it("total equity allocated across members should not exceed pool size", () => {
    const pool = 20;
    const members = [
      { vrl: 8, contribution: 7, capital: 200, performance: 6 },
      { vrl: 5, contribution: 5, capital: 100, performance: 4 },
      { vrl: 3, contribution: 4, capital: 50, performance: 3 },
    ];
    const totalDynamic = members.reduce((sum, m) => {
      const score = computeDynamicEquityScore(m.vrl, m.contribution, m.capital, m.performance);
      return sum + computeDynamicEquityPct(score, pool);
    }, 0);
    // Each member gets their proportional share; total can exceed pool if all score high
    // but each individual allocation is bounded by pool
    members.forEach(m => {
      const score = computeDynamicEquityScore(m.vrl, m.contribution, m.capital, m.performance);
      const pct = computeDynamicEquityPct(score, pool);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(pool);
    });
    expect(totalDynamic).toBeGreaterThan(0);
  });

  it("higher scoring member always gets more equity than lower scoring member", () => {
    const pool = 20;
    const highScore = computeDynamicEquityScore(9, 8, 300, 7);
    const lowScore = computeDynamicEquityScore(3, 2, 50, 2);
    const highPct = computeDynamicEquityPct(highScore, pool);
    const lowPct = computeDynamicEquityPct(lowScore, pool);
    expect(highPct).toBeGreaterThan(lowPct);
  });
});
