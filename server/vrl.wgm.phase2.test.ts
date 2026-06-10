/**
 * ══════════════════════════════════════════════════════════════════════════════
 * VRL WGM TEST SUITE — PHASE 2: MRL Sub-Formula Tests
 * Spec reference: BEBUS-MRL-SCORE-001
 * Engine under test: server/mrlScoring.ts
 *
 * NOTE ON PROMPT MAPPING:
 *   The prompt specifies a 7-sub MRL formula with subs PD/EA/QM/SCR/WC/CM/PS
 *   and weights .20/.15/.20/.15/.10/.10/.10.  This formula IS NOT IMPLEMENTED.
 *   The live engine (mrlScoring.ts / BEBUS-MRL-SCORE-001) uses 5 categories:
 *   process(0.28) / supply_chain(0.22) / cost(0.20) / quality(0.18) /
 *   sustainability(0.12), each with 6 sub-indicators (p1–p6, s1–s6, etc.).
 *   Tests below are written against the live implementation.
 *
 * DEFECT D6: Two MRL→VRL contribution functions with INCOMPATIBLE scales:
 *   mrl.engine.ts computeVrlContribution(level): returns 0–30 (normalised×30)
 *   mrlScoring.ts vrl_feed.vrl_mrl_contribution: returns 0–0.30 (score/100×0.30)
 *   At level 5, mrl.engine.ts → 15.0 ; mrlScoring.ts → ~0.165
 *   These are 100× different — no single canonical mapping exists.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from "vitest";
import {
  computeMRLScore,
  checkGateLock,
  getMRLLevel,
  WEIGHTS,
  CRITICAL_INDICATORS,
  MRL_THRESHOLDS,
  type ScoringInput,
  type CategoryInput,
} from "./mrlScoring";
import {
  computeVrlContribution,
} from "./mrl.engine";
import { computeSync, runDecisionTree } from "./sync.engine";

// ── Helpers ───────────────────────────────────────────────────────────────────

type RawCat = CategoryInput & Record<string, number>;

/** Build one category with all 6 sub-indicators set to `score`. */
function catAt(score: number, maturity: 0 | 1 | 2 | 3 | 4 = 2): RawCat {
  return { maturity, p1: score, p2: score, p3: score, p4: score, p5: score, p6: score,
                     s1: score, s2: score, s3: score, s4: score, s5: score, s6: score,
                     c1: score, c2: score, c3: score, c4: score, c5: score, c6: score,
                     q1: score, q2: score, q3: score, q4: score, q5: score, q6: score,
                     e1: score, e2: score, e3: score, e4: score, e5: score, e6: score,
  } as RawCat;
}

/** Build a full ScoringInput where all categories are at `base`, then apply
 *  per-category and per-indicator overrides. */
function buildInput(base: number, overrides: Partial<Record<keyof ScoringInput, Partial<RawCat>>> = {}): ScoringInput {
  const cat = (ids: string[], score: number, ovr: Partial<RawCat> = {}): RawCat =>
    Object.fromEntries([
      ["maturity", ovr.maturity ?? 2],
      ...ids.map(id => [id, (ovr as Record<string, number>)[id] ?? score]),
    ]) as RawCat;

  return {
    process:        cat(["p1","p2","p3","p4","p5","p6"], base, overrides.process),
    supply_chain:   cat(["s1","s2","s3","s4","s5","s6"], base, overrides.supply_chain),
    cost:           cat(["c1","c2","c3","c4","c5","c6"], base, overrides.cost),
    quality:        cat(["q1","q2","q3","q4","q5","q6"], base, overrides.quality),
    sustainability: cat(["e1","e2","e3","e4","e5","e6"], base, overrides.sustainability),
  };
}

// ── T9: Gate lock — for each category, one critical indicator below floor ──────
// "For each sub-formula, six subs at 8.0 and one at floor-0.01 → MRL level
//  advancement blocked."  Mapped to: per category, one critical indicator at
//  floor−0.01, all others at 8.0.
//
// Critical indicator floors (from CRITICAL_INDICATORS):
//   process:        p1≥3.0, p2≥2.0, p4≥2.0
//   supply_chain:   s1≥2.0, s4≥2.0
//   cost:           c1≥3.0, c3≥2.0, c5≥2.5
//   quality:        q1≥2.0, q2≥3.0, q5≥2.0
//   sustainability: NO critical indicators (gate cannot be triggered by this
//                   category alone — this is INTENTIONAL per spec §8)

describe("T9 — Gate lock per category (critical indicator below floor)", () => {
  // MRL level advancement is "blocked" when gate_locked=true → mrl_score ≤ 44

  // NOTE on mrl_level bound: GATE_LOCK_CAP = 44.0 (described as "top of MRL 4 band").
  // However getMRLLevel uses score >= min && score < max with thresholds:
  //   Level 4: min=33, max=44  → 44 < 44 is false → NOT level 4
  //   Level 5: min=44, max=55  → 44 >= 44 is true  → level 5
  // So a gate-locked score capped at exactly 44.0 maps to mrl_level = 5.
  // All T9 tests assert mrl_level ≤ 5 (the actual live behaviour).
  // The GATE_LOCK_CAP comment "top of MRL 4" is misleading — the arithmetic gives level 5.

  it("process p1 = 2.99 (floor 3.0 − 0.01) → gate_locked=true, mrl_score ≤ 44, mrl_level ≤ 5", () => {
    const input = buildInput(8.0, { process: { maturity: 2, p1: 2.99 } });
    const r = computeMRLScore(input);
    expect(r.gate_locked).toBe(true);
    expect(r.mrl_score).toBeLessThanOrEqual(44.0);
    expect(r.mrl_level).toBeLessThanOrEqual(5);
  });

  it("process p2 = 1.99 (floor 2.0 − 0.01) → gate_locked=true, mrl_score ≤ 44, mrl_level ≤ 5", () => {
    const input = buildInput(8.0, { process: { maturity: 2, p2: 1.99 } });
    const r = computeMRLScore(input);
    expect(r.gate_locked).toBe(true);
    expect(r.mrl_score).toBeLessThanOrEqual(44.0);
    expect(r.mrl_level).toBeLessThanOrEqual(5);
  });

  it("process p4 = 1.99 (floor 2.0 − 0.01) → gate_locked=true, mrl_score ≤ 44, mrl_level ≤ 5", () => {
    const input = buildInput(8.0, { process: { maturity: 2, p4: 1.99 } });
    const r = computeMRLScore(input);
    expect(r.gate_locked).toBe(true);
    expect(r.mrl_score).toBeLessThanOrEqual(44.0);
    expect(r.mrl_level).toBeLessThanOrEqual(5);
  });

  it("supply_chain s1 = 1.99 (floor 2.0 − 0.01) → gate_locked=true, mrl_score ≤ 44, mrl_level ≤ 5", () => {
    const input = buildInput(8.0, { supply_chain: { maturity: 2, s1: 1.99 } });
    const r = computeMRLScore(input);
    expect(r.gate_locked).toBe(true);
    expect(r.mrl_score).toBeLessThanOrEqual(44.0);
    expect(r.mrl_level).toBeLessThanOrEqual(5);
  });

  it("supply_chain s4 = 1.99 (floor 2.0 − 0.01) → gate_locked=true, mrl_score ≤ 44, mrl_level ≤ 5", () => {
    const input = buildInput(8.0, { supply_chain: { maturity: 2, s4: 1.99 } });
    const r = computeMRLScore(input);
    expect(r.gate_locked).toBe(true);
    expect(r.mrl_score).toBeLessThanOrEqual(44.0);
    expect(r.mrl_level).toBeLessThanOrEqual(5);
  });

  it("cost c1 = 2.99 (floor 3.0 − 0.01) → gate_locked=true, mrl_score ≤ 44, mrl_level ≤ 5", () => {
    const input = buildInput(8.0, { cost: { maturity: 2, c1: 2.99 } });
    const r = computeMRLScore(input);
    expect(r.gate_locked).toBe(true);
    expect(r.mrl_score).toBeLessThanOrEqual(44.0);
    expect(r.mrl_level).toBeLessThanOrEqual(5);
  });

  it("cost c3 = 1.99 (floor 2.0 − 0.01) → gate_locked=true, mrl_score ≤ 44, mrl_level ≤ 5", () => {
    const input = buildInput(8.0, { cost: { maturity: 2, c3: 1.99 } });
    const r = computeMRLScore(input);
    expect(r.gate_locked).toBe(true);
    expect(r.mrl_score).toBeLessThanOrEqual(44.0);
    expect(r.mrl_level).toBeLessThanOrEqual(5);
  });

  it("cost c5 = 2.49 (floor 2.5 − 0.01) → gate_locked=true, mrl_score ≤ 44, mrl_level ≤ 5", () => {
    const input = buildInput(8.0, { cost: { maturity: 2, c5: 2.49 } });
    const r = computeMRLScore(input);
    expect(r.gate_locked).toBe(true);
    expect(r.mrl_score).toBeLessThanOrEqual(44.0);
    expect(r.mrl_level).toBeLessThanOrEqual(5);
  });

  it("quality q1 = 1.99 (floor 2.0 − 0.01) → gate_locked=true, mrl_score ≤ 44, mrl_level ≤ 5", () => {
    const input = buildInput(8.0, { quality: { maturity: 2, q1: 1.99 } });
    const r = computeMRLScore(input);
    expect(r.gate_locked).toBe(true);
    expect(r.mrl_score).toBeLessThanOrEqual(44.0);
    expect(r.mrl_level).toBeLessThanOrEqual(5);
  });

  it("quality q2 = 2.99 (floor 3.0 − 0.01) → gate_locked=true, mrl_score ≤ 44, mrl_level ≤ 5", () => {
    const input = buildInput(8.0, { quality: { maturity: 2, q2: 2.99 } });
    const r = computeMRLScore(input);
    expect(r.gate_locked).toBe(true);
    expect(r.mrl_score).toBeLessThanOrEqual(44.0);
    expect(r.mrl_level).toBeLessThanOrEqual(5);
  });

  it("quality q5 = 1.99 (floor 2.0 − 0.01) → gate_locked=true, mrl_score ≤ 44, mrl_level ≤ 5", () => {
    const input = buildInput(8.0, { quality: { maturity: 2, q5: 1.99 } });
    const r = computeMRLScore(input);
    expect(r.gate_locked).toBe(true);
    expect(r.mrl_score).toBeLessThanOrEqual(44.0);
    expect(r.mrl_level).toBeLessThanOrEqual(5);
  });

  it("sustainability (all e1-e6 = 0) → gate_locked=FALSE (no critical indicators in this category)", () => {
    // Per spec §8: sustainability has ZERO critical indicators.
    // Even with all sub-indicators at 0 this category cannot trigger gate lock alone.
    const input = buildInput(8.0, {
      sustainability: { maturity: 2, e1: 0, e2: 0, e3: 0, e4: 0, e5: 0, e6: 0 },
    });
    const r = computeMRLScore(input);
    expect(r.gate_locked).toBe(false);
  });

  // Critical indicators at exactly their floor → gate PASSES
  it("process p1 = 3.0 (exactly at floor) → gate_locked=false", () => {
    const input = buildInput(3.0, { process: { maturity: 2, p1: 3.0 } });
    const r = computeMRLScore(input);
    // p1 at 3.0 passes; but p2 (floor 2.0) at 3.0 also passes → no lock
    expect(r.gate_locked).toBe(false);
  });
});

// ── T10: MRL level → VRL MRL dimension score mapping ─────────────────────────
// DEFECT D6: Two incompatible mapping functions exist in the codebase:
//   (1) mrl.engine.ts computeVrlContribution(level): normalised=(level-1)/8×100,
//       returns normalised×0.30 → scale 0–30 (intended % contribution)
//   (2) mrlScoring.ts vrl_feed.vrl_mrl_contribution: mrl_score/100×0.30
//       → scale 0–0.30 (fractional weight)
//   At MRL level 5: (1) returns 15.0 ; (2) returns ~0.15 — 100× difference.
//   No single canonical mapping from MRL level → VRL dimension score on 0–10.

describe("T10 — MRL level → VRL contribution (document DEFECT D6)", () => {
  it("mrl.engine.ts computeVrlContribution: level 1 → 0", () => {
    expect(computeVrlContribution(1)).toBeCloseTo(0, 2);
  });

  it("mrl.engine.ts computeVrlContribution: level 5 → 15 (on 0–30 scale)", () => {
    expect(computeVrlContribution(5)).toBeCloseTo(15, 1);
  });

  it("mrl.engine.ts computeVrlContribution: level 9 → 30 (scale maximum)", () => {
    expect(computeVrlContribution(9)).toBeCloseTo(30, 1);
  });

  it("mrlScoring.ts vrl_feed: mrl_score≈50 → vrl_mrl_contribution≈0.15 (on 0–0.30 scale)", () => {
    // Build input that produces mrl_score ≈ 50 (no gate lock; uniform scores)
    const input = buildInput(5.0); // score_S=5, M=1.0 → weighted sum = 5; ×10 = 50
    const r = computeMRLScore(input);
    expect(r.mrl_score).toBeCloseTo(50, 0);
    expect(r.vrl_feed.vrl_mrl_contribution).toBeCloseTo(0.15, 2);
  });

  it("DEFECT D6: computeVrlContribution(5)=15.0 ≠ vrl_feed at level 5 (~0.15) — 100× scale mismatch", () => {
    // This test documents the defect by asserting the actual values are different.
    const engineContribution   = computeVrlContribution(5);  // 15.0
    const scoringContribution  = 0.15;                        // ~vrl_feed at score≈50
    // They should be the same canonical contribution — they are not.
    expect(engineContribution).not.toBeCloseTo(scoringContribution, 0);
    // The ratio is ~100×
    expect(engineContribution / scoringContribution).toBeCloseTo(100, -1);
  });
});

// ── T11: TRL/MRL Sync Engine state classification ─────────────────────────────
// Spec pairs from BEBUS-SYNC-SE-001 vs live runDecisionTree severity labels.
//
// DEFECT D_SYNC: Live engine severity labels don't match prompt state names:
//   Live "OK"    ≠ prompt "OPTIMAL"   (equivalent but different string)
//   Live "AMBER" ≠ prompt "MONITOR"   (AMBER is more severe than MONITOR)
//   Live "RED"   ≠ prompt "WARNING"   (RED is more severe than WARNING)
//   Live "RED"   ≈ prompt "CRITICAL"  (acceptable — both are worst state)
//   Live "AMBER" ≠ prompt "BLOCKED"   (BLOCKED implies a hard stop; AMBER does not)
// No trl_mrl_sync_log or sync_alerts tables exist — alert record assertions skipped.

describe("T11 — TRL/MRL Sync Engine state classification", () => {
  it("(TRL=5, MRL=5) → delta=0, severity='OK' [prompt says OPTIMAL — string mismatch]", () => {
    const sync = computeSync({ trl: 5, mrl: 5 });
    const d    = runDecisionTree({ trl: 5, mrl: 5, sync });
    expect(sync.delta).toBe(0);
    expect(d.severity).toBe("OK");
    // DEFECT D_SYNC: prompt expects "OPTIMAL"
  });

  it("(TRL=5, MRL=3) → delta=+2, severity='AMBER' [prompt says MONITOR — severity mismatch]", () => {
    const sync = computeSync({ trl: 5, mrl: 3 });
    const d    = runDecisionTree({ trl: 5, mrl: 3, sync });
    expect(sync.delta).toBe(2);
    expect(d.severity).toBe("AMBER");
    // DEFECT D_SYNC: prompt expects "MONITOR"; live engine returns AMBER
  });

  it("(TRL=7, MRL=4) → delta=+3, severity='RED' [prompt says WARNING — severity over-escalation]", () => {
    const sync = computeSync({ trl: 7, mrl: 4 });
    const d    = runDecisionTree({ trl: 7, mrl: 4, sync });
    expect(sync.delta).toBe(3);
    expect(d.severity).toBe("RED");
    // DEFECT D_SYNC: prompt expects "WARNING"; live engine returns RED (Δ≥3 always RED)
  });

  it("(TRL=7, MRL=2) → delta=+5, severity='RED' [prompt says CRITICAL — both indicate worst state]", () => {
    const sync = computeSync({ trl: 7, mrl: 2 });
    const d    = runDecisionTree({ trl: 7, mrl: 2, sync });
    expect(sync.delta).toBe(5);
    expect(d.severity).toBe("RED");
    // Acceptable match: prompt "CRITICAL" ≈ live "RED" (worst state in both systems)
  });

  it("(TRL=3, MRL=5) → delta=-2, severity='AMBER' [prompt says BLOCKED — AMBER vs hard-stop mismatch]", () => {
    const sync = computeSync({ trl: 3, mrl: 5 });
    const d    = runDecisionTree({ trl: 3, mrl: 5, sync });
    expect(sync.delta).toBe(-2);
    expect(d.severity).toBe("AMBER");
    // DEFECT D_SYNC: prompt expects "BLOCKED" (hard stop); live engine returns AMBER
    // (primary path = MRL_MODERATE_LEAD, not a gate block)
  });

  it("(TRL=5, MRL=5) alert: 'MONITOR' + 'OPTIMISE' actions present", () => {
    const sync = computeSync({ trl: 5, mrl: 5 });
    const d    = runDecisionTree({ trl: 5, mrl: 5, sync });
    const actionTypes = d.actions.map(a => a.type);
    expect(actionTypes).toContain("MONITOR");
    expect(actionTypes).toContain("OPTIMISE");
  });

  it("(TRL=7, MRL=4) alert: at least one CRITICAL priority action", () => {
    const sync = computeSync({ trl: 7, mrl: 4 });
    const d    = runDecisionTree({ trl: 7, mrl: 4, sync });
    const critical = d.actions.filter(a => a.priority === "CRITICAL");
    expect(critical.length).toBeGreaterThanOrEqual(1);
  });
});
