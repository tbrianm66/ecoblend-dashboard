/**
 * MRL Scoring Engine — Unit Tests
 * Reference: BEBUS-MRL-SCORE-001
 *
 * Validates all 7 formulas:
 *   1. Master formula: MRL_score = [Σ(w_i × S_i × M_i) / Σw_i] × 10
 *   2. Category weights sum to 1.0
 *   3. S_i = average of 6 sub-indicators
 *   4. Maturity multipliers M_i ∈ {0.60, 0.80, 1.00, 1.10, 1.20}
 *   5. Gate lock: critical indicator < floor → cap at 44
 *   6. Confidence band: CB = ±(σ × 100) / (√n × 10)
 *   7. MRL level lookup from score
 */

import { describe, it, expect } from "vitest";
import {
  computeMRLScore,
  checkGateLock,
  computeConfidenceBand,
  getMRLLevel,
  WEIGHTS,
  MATURITY_MULTIPLIERS,
  MRL_THRESHOLDS,
  type ScoringInput,
} from "./mrlScoring";

// ── HELPERS ───────────────────────────────────────────────────────────────────

/** Build a ScoringInput with all indicators set to a uniform value. */
function uniformInput(score: number, maturity: 0 | 1 | 2 | 3 | 4 = 2): ScoringInput {
  const cat = (ids: string[]) =>
    Object.fromEntries([["maturity", maturity], ...ids.map(id => [id, score])]) as any;
  return {
    process:        cat(["p1","p2","p3","p4","p5","p6"]),
    supply_chain:   cat(["s1","s2","s3","s4","s5","s6"]),
    cost:           cat(["c1","c2","c3","c4","c5","c6"]),
    quality:        cat(["q1","q2","q3","q4","q5","q6"]),
    sustainability: cat(["e1","e2","e3","e4","e5","e6"]),
  };
}

// ── FORMULA 2 — Weights ───────────────────────────────────────────────────────

describe("Formula 2 — Category weights", () => {
  it("weights sum to exactly 1.0", () => {
    const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0, 10);
  });

  it("process weight is 0.28", () => expect(WEIGHTS.process).toBe(0.28));
  it("supply_chain weight is 0.22", () => expect(WEIGHTS.supply_chain).toBe(0.22));
  it("cost weight is 0.20", () => expect(WEIGHTS.cost).toBe(0.20));
  it("quality weight is 0.18", () => expect(WEIGHTS.quality).toBe(0.18));
  it("sustainability weight is 0.12", () => expect(WEIGHTS.sustainability).toBe(0.12));
});

// ── FORMULA 4 — Maturity multipliers ─────────────────────────────────────────

describe("Formula 4 — Maturity multipliers", () => {
  it("level 0 (Assumed) = 0.60",   () => expect(MATURITY_MULTIPLIERS[0].M).toBe(0.60));
  it("level 1 (Estimated) = 0.80", () => expect(MATURITY_MULTIPLIERS[1].M).toBe(0.80));
  it("level 2 (Measured) = 1.00",  () => expect(MATURITY_MULTIPLIERS[2].M).toBe(1.00));
  it("level 3 (Validated) = 1.10", () => expect(MATURITY_MULTIPLIERS[3].M).toBe(1.10));
  it("level 4 (Certified) = 1.20", () => expect(MATURITY_MULTIPLIERS[4].M).toBe(1.20));
});

// ── FORMULA 7 — MRL level thresholds ─────────────────────────────────────────

describe("Formula 7 — MRL level lookup", () => {
  it("score 0 → MRL 1 (Concept)",        () => expect(getMRLLevel(0).level).toBe(1));
  it("score 10.9 → MRL 1",               () => expect(getMRLLevel(10.9).level).toBe(1));
  it("score 11 → MRL 2 (Feasibility)",   () => expect(getMRLLevel(11).level).toBe(2));
  it("score 22 → MRL 3 (Process Dev)",   () => expect(getMRLLevel(22).level).toBe(3));
  it("score 33 → MRL 4 (Pilot Ready)",   () => expect(getMRLLevel(33).level).toBe(4));
  it("score 44 → MRL 5 (Pilot Proven)",  () => expect(getMRLLevel(44).level).toBe(5));
  it("score 55 → MRL 6 (Pre-Series)",    () => expect(getMRLLevel(55).level).toBe(6));
  it("score 66 → MRL 7 (Low-Rate)",      () => expect(getMRLLevel(66).level).toBe(7));
  it("score 77 → MRL 8 (Scale-Up)",      () => expect(getMRLLevel(77).level).toBe(8));
  it("score 88 → MRL 9 (Industrial)",    () => expect(getMRLLevel(88).level).toBe(9));
  it("score 100 → MRL 9 (Industrial)",   () => expect(getMRLLevel(100).level).toBe(9));
  it("9 thresholds defined",             () => expect(MRL_THRESHOLDS).toHaveLength(9));
});

// ── FORMULA 5 — Gate lock ─────────────────────────────────────────────────────

describe("Formula 5 — Gate lock", () => {
  it("all indicators at floor → NOT locked", () => {
    const { locked } = checkGateLock({
      p1: 3.0, p2: 2.0, p4: 2.0,
      s1: 2.0, s4: 2.0,
      c1: 3.0, c3: 2.0, c5: 2.5,
      q1: 2.0, q2: 3.0, q5: 2.0,
    });
    expect(locked).toBe(false);
  });

  it("p1=2.9 (< floor 3.0) → locked", () => {
    const { locked, reason } = checkGateLock({
      p1: 2.9, p2: 2.0, p4: 2.0,
      s1: 2.0, s4: 2.0,
      c1: 3.0, c3: 2.0, c5: 2.5,
      q1: 2.0, q2: 3.0, q5: 2.0,
    });
    expect(locked).toBe(true);
    expect(reason).toContain("Process route defined");
    expect(reason).toContain("2.9 < 3");
  });

  it("c5=2.4 (< floor 2.5) → locked", () => {
    const { locked } = checkGateLock({
      p1: 3.0, p2: 2.0, p4: 2.0,
      s1: 2.0, s4: 2.0,
      c1: 3.0, c3: 2.0, c5: 2.4,
      q1: 2.0, q2: 3.0, q5: 2.0,
    });
    expect(locked).toBe(true);
  });

  it("gate lock caps mrl_score at 44", () => {
    // All indicators at 10 except p1=0 → gate locked
    const input = uniformInput(10, 4);
    input.process.p1 = 0;
    const result = computeMRLScore(input);
    expect(result.gate_locked).toBe(true);
    expect(result.mrl_score).toBeLessThanOrEqual(44);
  });

  it("gate lock does NOT affect mrl_score_raw", () => {
    const input = uniformInput(10, 4);
    input.process.p1 = 0;
    const result = computeMRLScore(input);
    expect(result.mrl_score_raw).toBeGreaterThan(44);
  });
});

// ── FORMULA 6 — Confidence band ───────────────────────────────────────────────

describe("Formula 6 — Confidence band", () => {
  it("uniform scores → CB = 0.00", () => {
    const cb = computeConfidenceBand(Array(30).fill(5));
    expect(cb).toBe(0.00);
  });

  it("CB is non-negative", () => {
    const cb = computeConfidenceBand([1, 3, 5, 7, 9, 2, 4, 6, 8, 10]);
    expect(cb).toBeGreaterThanOrEqual(0);
  });

  it("higher variance → higher CB", () => {
    const low  = computeConfidenceBand(Array(30).fill(5).map((v, i) => v + (i % 2 === 0 ? 0.5 : -0.5)));
    const high = computeConfidenceBand(Array(30).fill(5).map((v, i) => v + (i % 2 === 0 ? 4 : -4)));
    expect(high).toBeGreaterThan(low);
  });
});

// ── FORMULA 1 — Master formula: uniform inputs ────────────────────────────────

describe("Formula 1 — Master formula (uniform inputs)", () => {
  it("all indicators=5, maturity=2 → score=50.0", () => {
    // S=5, M=1.00, Σ(w×S×M)/Σw = 5, ×10 = 50
    const result = computeMRLScore(uniformInput(5, 2));
    expect(result.mrl_score).toBe(50.0);
    expect(result.mrl_score_raw).toBe(50.0);
    expect(result.gate_locked).toBe(false);
  });

  it("all indicators=10, maturity=4 → score=120 capped to 100 (or gate-locked)", () => {
    // S=10, M=1.20, score_raw = 10×1.20×10 = 120 → but range is 0–100
    // Actually: Σ(w×S×M)/Σw × 10 = 10 × 1.20 × 10 = 120 (uncapped)
    // Gate lock: all critical indicators = 10 ≥ floors → NOT locked
    const result = computeMRLScore(uniformInput(10, 4));
    expect(result.gate_locked).toBe(false);
    expect(result.mrl_score_raw).toBeCloseTo(120.0, 1);
    expect(result.mrl_level).toBe(9); // lookup on raw (no gate lock)
  });

  it("all indicators=0, maturity=0 → score=0.0 and gate locked", () => {
    const result = computeMRLScore(uniformInput(0, 0));
    expect(result.mrl_score).toBe(0.0);
    expect(result.gate_locked).toBe(true);
    expect(result.mrl_level).toBe(1);
  });

  it("maturity=0 (M=0.60) gives 60% of maturity=2 score", () => {
    const r2 = computeMRLScore(uniformInput(5, 2));
    const r0 = computeMRLScore(uniformInput(5, 0));
    expect(r0.mrl_score_raw).toBeCloseTo(r2.mrl_score_raw * 0.60, 1);
  });
});

// ── EXAMPLE DATASETS — from mrl_scoring_system.jsx ───────────────────────────

describe("Example datasets (from spec)", () => {
  // NovaBattery — CleanTech (maturity mix: process=2, supply=1, cost=2, quality=2, sustainability=1)
  const novaBattery: ScoringInput = {
    process:        { maturity: 2, p1:7, p2:6, p3:5, p4:6, p5:4, p6:3 },
    supply_chain:   { maturity: 1, s1:5, s2:3, s3:6, s4:4, s5:2, s6:3 },
    cost:           { maturity: 2, c1:7, c2:5, c3:5, c4:6, c5:4, c6:2 },
    quality:        { maturity: 2, q1:6, q2:7, q3:5, q4:4, q5:5, q6:3 },
    sustainability: { maturity: 1, e1:6, e2:5, e3:3, e4:4, e5:3, e6:2 },
  };

  // AgroBot X3 — AgriTech (low scores, gate lock expected)
  const agroBot: ScoringInput = {
    process:        { maturity: 1, p1:4, p2:4, p3:2, p4:3, p5:3, p6:2 },
    supply_chain:   { maturity: 1, s1:3, s2:2, s3:4, s4:3, s5:1, s6:2 },
    cost:           { maturity: 0, c1:4, c2:2, c3:3, c4:3, c5:2, c6:1 },
    quality:        { maturity: 1, q1:3, q2:4, q3:2, q4:2, q5:3, q6:2 },
    sustainability: { maturity: 0, e1:3, e2:2, e3:1, e4:2, e5:2, e6:1 },
  };

  // MedPatch Pro — MedTech (high scores, maturity 3–4)
  const medPatch: ScoringInput = {
    process:        { maturity: 3, p1:8, p2:8, p3:7, p4:7, p5:6, p6:7 },
    supply_chain:   { maturity: 3, s1:8, s2:7, s3:7, s4:8, s5:7, s6:8 },
    cost:           { maturity: 3, c1:7, c2:7, c3:8, c4:7, c5:7, c6:6 },
    quality:        { maturity: 4, q1:9, q2:9, q3:8, q4:7, q5:9, q6:8 },
    sustainability: { maturity: 2, e1:6, e2:7, e3:5, e4:5, e5:7, e6:6 },
  };

  // OceanPlastic — CircularEcon (near-perfect scores)
  const oceanPlastic: ScoringInput = {
    process:        { maturity: 4, p1:9, p2:9, p3:8, p4:9, p5:8, p6:9 },
    supply_chain:   { maturity: 4, s1:9, s2:9, s3:8, s4:9, s5:8, s6:9 },
    cost:           { maturity: 3, c1:9, c2:8, c3:9, c4:8, c5:8, c6:7 },
    quality:        { maturity: 4, q1:8, q2:9, q3:9, q4:8, q5:9, q6:8 },
    sustainability: { maturity: 4, e1:9, e2:9, e3:8, e4:9, e5:8, e6:9 },
  };

  it("NovaBattery — NOT gate locked (all critical indicators ≥ floors)", () => {
    const r = computeMRLScore(novaBattery);
    expect(r.gate_locked).toBe(false);
  });

  it("NovaBattery — MRL score in MRL 4–5 range (30–55)", () => {
    const r = computeMRLScore(novaBattery);
    expect(r.mrl_score).toBeGreaterThanOrEqual(30);
    expect(r.mrl_score).toBeLessThanOrEqual(55);
  });

  it("AgroBot — gate locked (c5=2 < floor 2.5)", () => {
    const r = computeMRLScore(agroBot);
    expect(r.gate_locked).toBe(true);
    expect(r.mrl_score).toBeLessThanOrEqual(44);
  });

  it("AgroBot — MRL level ≤ 4 (gate locked)", () => {
    const r = computeMRLScore(agroBot);
    expect(r.mrl_level).toBeLessThanOrEqual(4);
  });

  it("MedPatch Pro — NOT gate locked (all critical ≥ floors)", () => {
    const r = computeMRLScore(medPatch);
    expect(r.gate_locked).toBe(false);
  });

  it("MedPatch Pro — MRL level ≥ 7 (high scores + validated maturity)", () => {
    const r = computeMRLScore(medPatch);
    expect(r.mrl_level).toBeGreaterThanOrEqual(7);
  });

  it("OceanPlastic — MRL level = 9 (Industrial)", () => {
    const r = computeMRLScore(oceanPlastic);
    expect(r.mrl_level).toBe(9);
    expect(r.mrl_label).toBe("Industrial");
  });

  it("OceanPlastic — NOT gate locked", () => {
    const r = computeMRLScore(oceanPlastic);
    expect(r.gate_locked).toBe(false);
  });

  it("OceanPlastic > MedPatch > NovaBattery > AgroBot (score ordering)", () => {
    const rOP = computeMRLScore(oceanPlastic);
    const rMP = computeMRLScore(medPatch);
    const rNB = computeMRLScore(novaBattery);
    const rAB = computeMRLScore(agroBot);
    expect(rOP.mrl_score_raw).toBeGreaterThan(rMP.mrl_score_raw);
    expect(rMP.mrl_score_raw).toBeGreaterThan(rNB.mrl_score_raw);
    expect(rNB.mrl_score_raw).toBeGreaterThan(rAB.mrl_score_raw);
  });
});

// ── VRL FEED ──────────────────────────────────────────────────────────────────

describe("VRL feed", () => {
  it("mrl_weight_product is 0.35 (B-02 / D6 fix — dual-pathway)", () => {
    const r = computeMRLScore(uniformInput(5, 2));
    expect(r.vrl_feed.mrl_weight_product).toBe(0.35);
  });

  it("mrl_weight_execution is 0.40 (B-02 / D6 fix — dual-pathway)", () => {
    const r = computeMRLScore(uniformInput(5, 2));
    expect(r.vrl_feed.mrl_weight_execution).toBe(0.40);
  });

  it("mrl_score_normalised = mrl_score / 100", () => {
    const r = computeMRLScore(uniformInput(5, 2));
    expect(r.vrl_feed.mrl_score_normalised).toBeCloseTo(r.mrl_score / 100, 4);
  });
});

// ── CATEGORY RESULT STRUCTURE ─────────────────────────────────────────────────

describe("Category result structure", () => {
  it("returns 5 category results", () => {
    const r = computeMRLScore(uniformInput(5, 2));
    expect(Object.keys(r.categories)).toHaveLength(5);
  });

  it("each category has score_S, maturity_M, weight_w, contribution, maturity_label, indicators", () => {
    const r = computeMRLScore(uniformInput(5, 2));
    for (const cat of Object.values(r.categories)) {
      expect(cat).toHaveProperty("score_S");
      expect(cat).toHaveProperty("maturity_M");
      expect(cat).toHaveProperty("weight_w");
      expect(cat).toHaveProperty("contribution");
      expect(cat).toHaveProperty("maturity_label");
      expect(cat).toHaveProperty("indicators");
    }
  });

  it("process category has 6 indicator scores", () => {
    const r = computeMRLScore(uniformInput(5, 2));
    expect(Object.keys(r.categories.process.indicators)).toHaveLength(6);
  });

  it("contribution = weight × score_S × maturity_M (to 3dp)", () => {
    const r = computeMRLScore(uniformInput(7, 3));
    const cat = r.categories.process;
    const expected = Math.round(cat.weight_w * cat.score_S * cat.maturity_M * 1000) / 1000;
    expect(cat.contribution).toBeCloseTo(expected, 3);
  });
});
