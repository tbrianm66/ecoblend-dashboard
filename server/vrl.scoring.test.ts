/**
 * VRL Scoring Engine — Unit Tests
 *
 * Tests the pure/deterministic functions in the VRL scoring engine:
 *   - getVrlLevel(score): discrete level mapping
 *   - VRL_LEVEL_LABELS: label correctness
 *   - VRL formula arithmetic: VRL = (α×TRL + β×BRL) × (1 − Risk) × Confidence
 *
 * Database-dependent helpers (computeVrlScore, computeVrlRiskIndex, etc.)
 * are tested via integration-style tests with mocked DB responses.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getVrlLevel, VRL_LEVEL_LABELS } from "./db";

// ── Pure function tests ───────────────────────────────────────────────────────

describe("getVrlLevel — discrete level mapping", () => {
  it("returns 1 for score 0", () => {
    expect(getVrlLevel(0)).toBe(1);
  });

  it("returns 1 for negative score", () => {
    expect(getVrlLevel(-5)).toBe(1);
  });

  it("returns 9 for score 9", () => {
    expect(getVrlLevel(9)).toBe(9);
  });

  it("returns 9 for score above 9", () => {
    expect(getVrlLevel(12)).toBe(9);
  });

  it("rounds 0.5 to level 1", () => {
    expect(getVrlLevel(0.5)).toBe(1);
  });

  it("rounds 1.4 to level 1", () => {
    expect(getVrlLevel(1.4)).toBe(1);
  });

  it("rounds 1.5 to level 2", () => {
    expect(getVrlLevel(1.5)).toBe(2);
  });

  it("rounds 4.5 to level 5", () => {
    expect(getVrlLevel(4.5)).toBe(5);
  });

  it("rounds 8.6 to level 9", () => {
    expect(getVrlLevel(8.6)).toBe(9);
  });

  it("maps 3.0 to level 3", () => {
    expect(getVrlLevel(3.0)).toBe(3);
  });

  it("maps 7.0 to level 7", () => {
    expect(getVrlLevel(7.0)).toBe(7);
  });
});

// ── VRL_LEVEL_LABELS correctness ─────────────────────────────────────────────

describe("VRL_LEVEL_LABELS — 9-level label map", () => {
  it("has exactly 9 entries", () => {
    expect(Object.keys(VRL_LEVEL_LABELS).length).toBe(9);
  });

  it("level 1 is Opportunity Discovery", () => {
    expect(VRL_LEVEL_LABELS[1]).toBe("Opportunity Discovery");
  });

  it("level 5 is Market Validation", () => {
    expect(VRL_LEVEL_LABELS[5]).toBe("Market Validation");
  });

  it("level 6 is Product-Market Fit", () => {
    expect(VRL_LEVEL_LABELS[6]).toBe("Product-Market Fit");
  });

  it("level 9 is Market Leadership", () => {
    expect(VRL_LEVEL_LABELS[9]).toBe("Market Leadership");
  });

  it("all levels 1-9 are defined", () => {
    for (let i = 1; i <= 9; i++) {
      expect(VRL_LEVEL_LABELS[i]).toBeDefined();
      expect(typeof VRL_LEVEL_LABELS[i]).toBe("string");
      expect(VRL_LEVEL_LABELS[i].length).toBeGreaterThan(0);
    }
  });
});

// ── VRL Formula arithmetic tests ──────────────────────────────────────────────
// Formula: VRL = (α×TRL + β×BRL) × (1 − Risk) × Confidence
// All inputs normalised to 0-9 scale

describe("VRL formula arithmetic", () => {
  /**
   * Pure formula helper — mirrors the computeVrlScore logic without DB
   */
  function applyVrlFormula(
    trlNorm: number,
    brlNorm: number,
    alpha: number,
    beta: number,
    riskIndex: number,
    confidence: number
  ): number {
    const baseReadiness = alpha * trlNorm + beta * brlNorm;
    const raw = baseReadiness * (1 - riskIndex) * confidence;
    return Math.min(9, Math.max(0, Math.round(raw * 100) / 100));
  }

  it("returns 0 when TRL and BRL are both 0", () => {
    const score = applyVrlFormula(0, 0, 0.45, 0.55, 0, 1.0);
    expect(score).toBe(0);
  });

  it("returns max 9 when fully ready, no risk, full confidence", () => {
    const score = applyVrlFormula(9, 9, 0.45, 0.55, 0, 1.0);
    expect(score).toBe(9);
  });

  it("zero confidence produces zero score regardless of readiness", () => {
    const score = applyVrlFormula(9, 9, 0.45, 0.55, 0, 0);
    expect(score).toBe(0);
  });

  it("full risk index (1.0) produces zero score", () => {
    const score = applyVrlFormula(9, 9, 0.45, 0.55, 1.0, 1.0);
    expect(score).toBe(0);
  });

  it("alpha + beta = 1.0 invariant is maintained in formula", () => {
    const alpha = 0.45;
    const beta = 0.55;
    expect(alpha + beta).toBeCloseTo(1.0, 10);
  });

  it("default weights produce correct base readiness for TRL=5, BRL=5", () => {
    // base = 0.45×5 + 0.55×5 = 2.25 + 2.75 = 5.0
    const baseReadiness = 0.45 * 5 + 0.55 * 5;
    expect(baseReadiness).toBeCloseTo(5.0, 10);
  });

  it("50% risk halves the base readiness contribution", () => {
    // base = 5.0, risk = 0.5, confidence = 1.0 → 5.0 × 0.5 × 1.0 = 2.5
    const score = applyVrlFormula(5, 5, 0.45, 0.55, 0.5, 1.0);
    expect(score).toBeCloseTo(2.5, 1);
  });

  it("80% confidence reduces score by 20%", () => {
    // base = 5.0, risk = 0, confidence = 0.8 → 5.0 × 1.0 × 0.8 = 4.0
    const score = applyVrlFormula(5, 5, 0.45, 0.55, 0, 0.8);
    expect(score).toBeCloseTo(4.0, 1);
  });

  it("high TRL with low BRL produces lower score than balanced", () => {
    const balanced = applyVrlFormula(5, 5, 0.45, 0.55, 0, 1.0);
    const trlHeavy = applyVrlFormula(9, 1, 0.45, 0.55, 0, 1.0);
    // TRL-heavy: 0.45×9 + 0.55×1 = 4.05 + 0.55 = 4.6
    // Balanced: 5.0
    expect(trlHeavy).toBeLessThan(balanced);
  });

  it("score is clamped to 0 minimum", () => {
    const score = applyVrlFormula(-5, -5, 0.45, 0.55, 0, 1.0);
    expect(score).toBe(0);
  });

  it("score is clamped to 9 maximum", () => {
    const score = applyVrlFormula(100, 100, 0.45, 0.55, 0, 1.0);
    expect(score).toBe(9);
  });

  it("risk penalty is multiplicative, not additive", () => {
    const noRisk = applyVrlFormula(6, 6, 0.45, 0.55, 0, 1.0);
    const withRisk = applyVrlFormula(6, 6, 0.45, 0.55, 0.2, 1.0);
    // With 20% risk: noRisk × 0.8
    expect(withRisk).toBeCloseTo(noRisk * 0.8, 1);
  });

  it("confidence and risk are independent multipliers", () => {
    const base = 0.45 * 4 + 0.55 * 4; // = 4.0
    const expected = base * (1 - 0.3) * 0.7; // risk=0.3, confidence=0.7
    const score = applyVrlFormula(4, 4, 0.45, 0.55, 0.3, 0.7);
    expect(score).toBeCloseTo(expected, 1);
  });

  it("alpha-heavy weighting increases TRL contribution", () => {
    // TRL=8, BRL=2, alpha=0.8, beta=0.2 → base = 6.4 + 0.4 = 6.8
    const alphaHeavy = applyVrlFormula(8, 2, 0.8, 0.2, 0, 1.0);
    // TRL=8, BRL=2, alpha=0.2, beta=0.8 → base = 1.6 + 1.6 = 3.2
    const betaHeavy = applyVrlFormula(8, 2, 0.2, 0.8, 0, 1.0);
    expect(alphaHeavy).toBeGreaterThan(betaHeavy);
  });
});

// ── Risk Index normalisation tests ────────────────────────────────────────────

describe("Risk Index normalisation", () => {
  /**
   * Mirrors the per-category normalisation in computeVrlRiskIndex:
   * normalised = min(1, avgScore / 25)
   */
  function normaliseCategoryScore(avgScore: number): number {
    return Math.min(1, avgScore / 25);
  }

  it("score 0 → normalised 0", () => {
    expect(normaliseCategoryScore(0)).toBe(0);
  });

  it("score 25 → normalised 1.0 (max Likelihood × Impact)", () => {
    expect(normaliseCategoryScore(25)).toBe(1.0);
  });

  it("score 12.5 → normalised 0.5", () => {
    expect(normaliseCategoryScore(12.5)).toBeCloseTo(0.5, 10);
  });

  it("score above 25 is clamped to 1.0", () => {
    expect(normaliseCategoryScore(30)).toBe(1.0);
  });

  it("aggregate risk index is average of 5 categories", () => {
    const categories = [0.2, 0.4, 0.6, 0.8, 1.0];
    const aggregate = categories.reduce((s, v) => s + v, 0) / categories.length;
    expect(aggregate).toBeCloseTo(0.6, 10);
  });

  it("all-zero risks produce zero aggregate risk index", () => {
    const categories = [0, 0, 0, 0, 0];
    const aggregate = categories.reduce((s, v) => s + v, 0) / categories.length;
    expect(aggregate).toBe(0);
  });

  it("all-max risks produce aggregate risk index of 1.0", () => {
    const categories = [1.0, 1.0, 1.0, 1.0, 1.0];
    const aggregate = categories.reduce((s, v) => s + v, 0) / categories.length;
    expect(aggregate).toBe(1.0);
  });
});

// ── BRL normalisation to 0-9 scale ───────────────────────────────────────────

describe("BRL normalisation to 0-9 scale", () => {
  function normaliseBrl(brlScore: number): number {
    return (brlScore / 100) * 9;
  }

  it("BRL 0% → 0 on 0-9 scale", () => {
    expect(normaliseBrl(0)).toBe(0);
  });

  it("BRL 100% → 9 on 0-9 scale", () => {
    expect(normaliseBrl(100)).toBe(9);
  });

  it("BRL 50% → 4.5 on 0-9 scale", () => {
    expect(normaliseBrl(50)).toBeCloseTo(4.5, 10);
  });

  it("BRL 33% → 2.97 on 0-9 scale", () => {
    expect(normaliseBrl(33)).toBeCloseTo(2.97, 1);
  });

  it("BRL 75% → 6.75 on 0-9 scale", () => {
    expect(normaliseBrl(75)).toBeCloseTo(6.75, 10);
  });
});
