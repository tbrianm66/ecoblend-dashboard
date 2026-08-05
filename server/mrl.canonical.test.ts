/**
 * MRL Canonical Engine Tests — D6 Remediation
 * ============================================
 * Boundary and correctness tests for Engine A canonicalization.
 * All tests are pure unit tests — no DB or tRPC calls.
 *
 * Coverage:
 *   1. compositeScoreToMrlLevel — all 9 level boundaries
 *   2. Input bounds — out-of-range clamping (no throw)
 *   3. VRL veto gate — mrlScore threshold at 19/20
 *   4. Engine B gate lock — floor boundary precision
 *   5. computeVrlContribution — all 9 levels, range [0, 1]
 *   6. Engine A / Engine B level divergence — documented at score 11.0
 */

import { describe, it, expect } from "vitest";
import { compositeScoreToMrlLevel, computeVrlContribution } from "./mrl.engine";
import { getMRLLevel, checkGateLock } from "./mrlScoring";
import { computeVrl } from "./vrl.engine";

// ── 1. compositeScoreToMrlLevel — All 9 Level Boundaries ─────────────────────
//
// Level mapping: level = ceil(score / 11.11), clamped to [1, 9].
// Transition points (lower bound of each level, exclusive of previous):
//   Level 1: [0,   11.11)   → ceil < 1  ⟹ clamped to 1
//   Level 2: [11.12, 22.22) → ceil = 2
//   Level 3: [22.23, 33.33) → ceil = 3
//   Level 4: [33.34, 44.44) → ceil = 4
//   Level 5: [44.45, 55.55) → ceil = 5
//   Level 6: [55.56, 66.66) → ceil = 6
//   Level 7: [66.67, 77.77) → ceil = 7
//   Level 8: [77.78, 88.88) → ceil = 8
//   Level 9: [88.89, 100]   → ceil = 9 (or 10, clamped to 9)

describe("compositeScoreToMrlLevel — level boundaries", () => {
  // ── Level 1 ──
  it("score 0   → MRL-1", () => expect(compositeScoreToMrlLevel(0)).toBe(1));
  it("score 5.5 → MRL-1", () => expect(compositeScoreToMrlLevel(5.5)).toBe(1));
  it("score 11.0 → MRL-1 (Engine A)", () => {
    // Engine A: ceil(11.0/11.11) = ceil(0.9901) = 1
    // NOTE: Engine B getMRLLevel(11.0) = 2 — documented divergence point
    expect(compositeScoreToMrlLevel(11.0)).toBe(1);
  });

  // ── Level 2 ──
  it("score 11.12 → MRL-2", () => expect(compositeScoreToMrlLevel(11.12)).toBe(2));
  it("score 22.0  → MRL-2", () => {
    // ceil(22.0/11.11) = ceil(1.9802) = 2
    expect(compositeScoreToMrlLevel(22.0)).toBe(2);
  });

  // ── Level 3 ──
  it("score 22.23 → MRL-3", () => expect(compositeScoreToMrlLevel(22.23)).toBe(3));
  it("score 33.0  → MRL-3", () => {
    // ceil(33.0/11.11) = ceil(2.9703) = 3
    expect(compositeScoreToMrlLevel(33.0)).toBe(3);
  });

  // ── Level 4 ──
  it("score 33.34 → MRL-4", () => expect(compositeScoreToMrlLevel(33.34)).toBe(4));
  it("score 44.0  → MRL-4", () => {
    // ceil(44.0/11.11) = ceil(3.9604) = 4
    expect(compositeScoreToMrlLevel(44.0)).toBe(4);
  });

  // ── Level 5 ──
  it("score 44.45 → MRL-5", () => expect(compositeScoreToMrlLevel(44.45)).toBe(5));
  it("score 55.0  → MRL-5", () => {
    // ceil(55.0/11.11) = ceil(4.9505) = 5
    expect(compositeScoreToMrlLevel(55.0)).toBe(5);
  });

  // ── Level 6 ──
  it("score 55.56 → MRL-6", () => expect(compositeScoreToMrlLevel(55.56)).toBe(6));
  it("score 66.0  → MRL-6", () => {
    // ceil(66.0/11.11) = ceil(5.9406) = 6
    expect(compositeScoreToMrlLevel(66.0)).toBe(6);
  });

  // ── Level 7 ──
  it("score 66.67 → MRL-7", () => expect(compositeScoreToMrlLevel(66.67)).toBe(7));
  it("score 77.0  → MRL-7", () => {
    // ceil(77.0/11.11) = ceil(6.9306) = 7
    expect(compositeScoreToMrlLevel(77.0)).toBe(7);
  });

  // ── Level 8 ──
  it("score 77.78 → MRL-8", () => expect(compositeScoreToMrlLevel(77.78)).toBe(8));
  it("score 88.0  → MRL-8", () => {
    // ceil(88.0/11.11) = ceil(7.9207) = 8
    expect(compositeScoreToMrlLevel(88.0)).toBe(8);
  });

  // ── Level 9 ──
  it("score 88.89 → MRL-9", () => expect(compositeScoreToMrlLevel(88.89)).toBe(9));
  it("score 100   → MRL-9 (clamped from ceil=10)", () => {
    // ceil(100/11.11) = 10, min(9, 10) = 9
    expect(compositeScoreToMrlLevel(100)).toBe(9);
  });

  // ── Always in [1, 9] ──
  it("level is always between 1 and 9 for any score in [0, 100]", () => {
    for (const s of [0, 0.001, 10, 11.11, 50, 99.999, 100]) {
      const level = compositeScoreToMrlLevel(s);
      expect(level).toBeGreaterThanOrEqual(1);
      expect(level).toBeLessThanOrEqual(9);
    }
  });
});

// ── 2. Input Bounds — Out-of-Range Clamping ───────────────────────────────────

describe("compositeScoreToMrlLevel — input bounds (clamp, no throw)", () => {
  it("score -1 clamps to MRL-1 (no exception)", () => {
    expect(() => compositeScoreToMrlLevel(-1)).not.toThrow();
    expect(compositeScoreToMrlLevel(-1)).toBe(1);
  });

  it("score -50 clamps to MRL-1 (no exception)", () => {
    expect(() => compositeScoreToMrlLevel(-50)).not.toThrow();
    expect(compositeScoreToMrlLevel(-50)).toBe(1);
  });

  it("score 101 clamps to MRL-9 (no exception)", () => {
    expect(() => compositeScoreToMrlLevel(101)).not.toThrow();
    expect(compositeScoreToMrlLevel(101)).toBe(9);
  });

  it("score 200 clamps to MRL-9 (no exception)", () => {
    expect(() => compositeScoreToMrlLevel(200)).not.toThrow();
    expect(compositeScoreToMrlLevel(200)).toBe(9);
  });
});

// ── 3. VRL Veto Gate ──────────────────────────────────────────────────────────

const FULL_SCORES = {
  trlScore: 100, mrlScore: 100, brlScore: 100,
  ecoScore: 100, prlScore: 100, ipScore:  100,
  frlScore: 100, regScore: 100, srlScore: 100,
};

describe("VRL veto gate — mrlScore boundary", () => {
  it("mrlScore = 19 triggers isVetoed = true", () => {
    const result = computeVrl({ ...FULL_SCORES, mrlScore: 19 });
    expect(result.isVetoed).toBe(true);
    expect(result.globalVrlScore).toBe(0);
  });

  it("mrlScore = 20 does NOT trigger veto", () => {
    const result = computeVrl({ ...FULL_SCORES, mrlScore: 20 });
    expect(result.isVetoed).toBe(false);
    expect(result.globalVrlScore).toBeGreaterThan(0);
  });

  it("mrlScore = 0 is vetoed and score = 0", () => {
    const result = computeVrl({ ...FULL_SCORES, mrlScore: 0 });
    expect(result.isVetoed).toBe(true);
    expect(result.globalVrlScore).toBe(0);
  });

  it("mrlScore = 100 with all other max → not vetoed", () => {
    const result = computeVrl(FULL_SCORES);
    expect(result.isVetoed).toBe(false);
  });

  it("any single dimension at 19 vetoes regardless of mrl", () => {
    const result = computeVrl({ ...FULL_SCORES, trlScore: 19 });
    expect(result.isVetoed).toBe(true);
  });
});

// ── 4. Engine B Gate Lock — Floor Boundary Precision ─────────────────────────

describe("Engine B gate lock — critical indicator floor boundaries", () => {
  const AT_FLOOR = {
    p1: 3.0, p2: 2.0, p4: 2.0,
    s1: 2.0, s4: 2.0,
    c1: 3.0, c3: 2.0, c5: 2.5,
    q1: 2.0, q2: 3.0, q5: 2.0,
  };

  it("all critical indicators exactly at floor → NOT locked", () => {
    const { locked } = checkGateLock(AT_FLOOR);
    expect(locked).toBe(false);
  });

  it("p1 at floor − 0.001 (2.999) → locked", () => {
    const { locked, reason } = checkGateLock({ ...AT_FLOOR, p1: 2.999 });
    expect(locked).toBe(true);
    expect(reason).toContain("Process route defined");
  });

  it("c5 at floor − 0.001 (2.499) → locked", () => {
    const { locked } = checkGateLock({ ...AT_FLOOR, c5: 2.499 });
    expect(locked).toBe(true);
  });

  it("c5 exactly at floor (2.5) → NOT locked", () => {
    const { locked } = checkGateLock({ ...AT_FLOOR, c5: 2.5 });
    expect(locked).toBe(false);
  });

  it("q2 at floor − 0.001 (2.999) → locked (floor=3.0)", () => {
    const { locked } = checkGateLock({ ...AT_FLOOR, q2: 2.999 });
    expect(locked).toBe(true);
  });

  it("q2 exactly at floor (3.0) → NOT locked", () => {
    const { locked } = checkGateLock({ ...AT_FLOOR, q2: 3.0 });
    expect(locked).toBe(false);
  });
});

// ── 5. computeVrlContribution — All 9 Levels ─────────────────────────────────

describe("computeVrlContribution — all 9 MRL levels", () => {
  it("level 1 → 0.0000 (minimum)", () => {
    expect(computeVrlContribution(1)).toBe(0.0);
  });

  it("level 9 → 1.0000 (maximum)", () => {
    expect(computeVrlContribution(9)).toBe(1.0);
  });

  it("level 5 → 0.5000 (midpoint)", () => {
    // (5−1)/8 = 0.5
    expect(computeVrlContribution(5)).toBeCloseTo(0.5, 4);
  });

  it("all levels return values in [0, 1]", () => {
    for (let level = 1; level <= 9; level++) {
      const contrib = computeVrlContribution(level);
      expect(contrib).toBeGreaterThanOrEqual(0);
      expect(contrib).toBeLessThanOrEqual(1);
    }
  });

  it("contributions are strictly increasing across levels 1–9", () => {
    let prev = computeVrlContribution(1);
    for (let level = 2; level <= 9; level++) {
      const curr = computeVrlContribution(level);
      expect(curr).toBeGreaterThan(prev);
      prev = curr;
    }
  });

  it("level 2 → 0.1250", () => expect(computeVrlContribution(2)).toBeCloseTo(0.125, 4));
  it("level 3 → 0.2500", () => expect(computeVrlContribution(3)).toBeCloseTo(0.25, 4));
  it("level 4 → 0.3750", () => expect(computeVrlContribution(4)).toBeCloseTo(0.375, 4));
  it("level 6 → 0.6250", () => expect(computeVrlContribution(6)).toBeCloseTo(0.625, 4));
  it("level 7 → 0.7500", () => expect(computeVrlContribution(7)).toBeCloseTo(0.75, 4));
  it("level 8 → 0.8750", () => expect(computeVrlContribution(8)).toBeCloseTo(0.875, 4));
});

// ── 6. Engine A / Engine B Level Divergence ───────────────────────────────────
//
// At score exactly 11.0, the two engines disagree.
//
// Engine A (compositeScoreToMrlLevel):
//   ceil(11.0 / 11.11) = ceil(0.99009...) = 1  → MRL-1
//
// Engine B (getMRLLevel / MRL_THRESHOLDS):
//   threshold { level: 2, min: 11.0, max: 22.0 }
//   11.0 >= 11.0 && 11.0 < 22.0 → true  → MRL-2
//
// This is the only confirmed boundary divergence between the two engines.
// All other integer-level boundary scores in the task spec agree across engines.

describe("Engine A / Engine B divergence — documented boundary", () => {
  it("score 11.0: Engine A → MRL-1, Engine B → MRL-2 (known divergence)", () => {
    const engineALevel = compositeScoreToMrlLevel(11.0);
    const engineBLevel = getMRLLevel(11.0).level;
    expect(engineALevel).toBe(1);  // Engine A canonical
    expect(engineBLevel).toBe(2);  // Engine B legacy
    expect(engineALevel).not.toBe(engineBLevel); // divergence confirmed
  });

  it("score 11.12: both engines agree on MRL-2", () => {
    const engineALevel = compositeScoreToMrlLevel(11.12);
    const engineBLevel = getMRLLevel(11.12).level;
    expect(engineALevel).toBe(2);
    expect(engineBLevel).toBe(2);
  });

  it("score 0: both engines agree on MRL-1", () => {
    expect(compositeScoreToMrlLevel(0)).toBe(1);
    expect(getMRLLevel(0).level).toBe(1);
  });

  it("score 100: both engines agree on MRL-9", () => {
    expect(compositeScoreToMrlLevel(100)).toBe(9);
    expect(getMRLLevel(100).level).toBe(9);
  });
});
