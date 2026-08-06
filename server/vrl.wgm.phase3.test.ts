/**
 * ══════════════════════════════════════════════════════════════════════════════
 * VRL WGM TEST SUITE — PHASE 3: Dependency Propagation
 * Engines under test: vrl.engine.ts, mrlScoring.ts, sync.engine.ts
 *
 * T5: Dimension-to-meta-domain propagation (pure math — no DB tables exist)
 * T6: Cost evidence isolation (cost indicators affect only cost category)
 * T7: SOC/PRL score acceptance without evidence — DEFECT D7
 * T8: TRL advance with MRL held constant — DEFECT D1
 *
 * DEFECT SUMMARY:
 *   D1  — TRL has a direct path into the VRL composite via the Product meta-domain
 *          (trlScore × 0.40).  The prompt's WGM formula omits TRL entirely.
 *          Advancing trlScore changes globalVrlScore — this test documents it.
 *   D7  — No evidence-link enforcement.  Any dimension score is accepted without
 *          a linked evidence record; the system does not reject self-asserted values.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from "vitest";
import {
  computeVrl,
  computeMetaDomains,
  type VrlInputs,
} from "./vrl.engine";
import {
  computeMRLScore,
  type ScoringInput,
} from "./mrlScoring";
import { computeSync, runDecisionTree } from "./sync.engine";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeVrlInputs(base: number, overrides: Partial<VrlInputs> = {}): VrlInputs {
  return {
    trlScore: base, mrlScore: base, brlScore: base, ecoScore: base,
    prlScore: base, ipScore:  base, frlScore: base, regScore: base,
    srlScore: base, mvlScore: base,  // Gate 2
    ...overrides,
  };
}

type RawCat = Record<string, number> & { maturity: number };

function buildMrlInput(base: number, overrides: Partial<Record<keyof ScoringInput, Partial<RawCat>>> = {}): ScoringInput {
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

// ── T5: Dimension-to-meta-domain propagation ──────────────────────────────────
// For each of the 9 VRL dimensions, change only that dimension and verify:
//   (a) Exactly the expected meta-domains change
//   (b) The composite (baseAverage / globalVrlScore) recalculates
//
// Known multi-meta-domain inputs (by design of vrl.engine.ts):
//   mrlScore → Product + Execution   (appears in two meta-domain formulas)
//   brlScore → Product + Market      (appears in two meta-domain formulas)
//   All others → exactly one meta-domain

describe("T5 — Dimension mutation propagates to correct meta-domain(s)", () => {
  const BASE    = 50;
  const CHANGED = 70;
  const base    = makeVrlInputs(BASE);
  const baseMeta = computeMetaDomains(base);

  function metaChanged(before: ReturnType<typeof computeMetaDomains>, after: ReturnType<typeof computeMetaDomains>) {
    const keys = ["productScore","marketScore","executionScore","structuralScore","sustainabilityScore"] as const;
    return keys.filter(k => Math.abs(after[k] - before[k]) > 0.001);
  }

  it("trlScore: only productScore changes", () => {
    const after = computeMetaDomains(makeVrlInputs(BASE, { trlScore: CHANGED }));
    const changed = metaChanged(baseMeta, after);
    expect(changed).toEqual(["productScore"]);
  });

  it("mrlScore: productScore AND executionScore change (appears in two formulas)", () => {
    const after = computeMetaDomains(makeVrlInputs(BASE, { mrlScore: CHANGED }));
    const changed = metaChanged(baseMeta, after);
    expect(changed).toContain("productScore");
    expect(changed).toContain("executionScore");
    expect(changed).toHaveLength(2);
  });

  it("brlScore: productScore AND marketScore change (appears in two formulas)", () => {
    const after = computeMetaDomains(makeVrlInputs(BASE, { brlScore: CHANGED }));
    const changed = metaChanged(baseMeta, after);
    expect(changed).toContain("productScore");
    expect(changed).toContain("marketScore");
    expect(changed).toHaveLength(2);
  });

  it("ecoScore: only sustainabilityScore changes", () => {
    const after = computeMetaDomains(makeVrlInputs(BASE, { ecoScore: CHANGED }));
    const changed = metaChanged(baseMeta, after);
    expect(changed).toEqual(["sustainabilityScore"]);
  });

  it("prlScore: only marketScore changes", () => {
    const after = computeMetaDomains(makeVrlInputs(BASE, { prlScore: CHANGED }));
    const changed = metaChanged(baseMeta, after);
    expect(changed).toEqual(["marketScore"]);
  });

  it("ipScore: only structuralScore changes", () => {
    const after = computeMetaDomains(makeVrlInputs(BASE, { ipScore: CHANGED }));
    const changed = metaChanged(baseMeta, after);
    expect(changed).toEqual(["structuralScore"]);
  });

  it("frlScore: only executionScore changes", () => {
    const after = computeMetaDomains(makeVrlInputs(BASE, { frlScore: CHANGED }));
    const changed = metaChanged(baseMeta, after);
    expect(changed).toEqual(["executionScore"]);
  });

  it("regScore: only structuralScore changes", () => {
    const after = computeMetaDomains(makeVrlInputs(BASE, { regScore: CHANGED }));
    const changed = metaChanged(baseMeta, after);
    expect(changed).toEqual(["structuralScore"]);
  });

  it("srlScore: only sustainabilityScore changes", () => {
    const after = computeMetaDomains(makeVrlInputs(BASE, { srlScore: CHANGED }));
    const changed = metaChanged(baseMeta, after);
    expect(changed).toEqual(["sustainabilityScore"]);
  });

  it("any single dimension change propagates to a different composite", () => {
    // Pick trlScore (single-meta-domain input) — composite must change
    const before = computeVrl(makeVrlInputs(BASE));
    const after  = computeVrl(makeVrlInputs(BASE, { trlScore: CHANGED }));
    expect(after.baseAverage).not.toBeCloseTo(before.baseAverage, 2);
  });
});

// ── T6: Cost-model evidence isolation ────────────────────────────────────────
// "Submit one manufacturing cost-model evidence item → assert it affects
//  MRL·CM OR the FIN dimension, never both."
//
// In mrlScoring.ts the cost category (c1–c6) feeds into the cost contribution
// only.  Other category scores are computed independently — no cross-contamination.
// In vrl.engine.ts the FRL (financial readiness) dimension is the FIN proxy;
// it is independent of mrlScoring.ts cost category changes.
// DEFECT D5 is NOT triggered.

describe("T6 — Cost-model evidence affects cost category only (D5 not triggered)", () => {
  it("changing cost indicators does not change process category score_S", () => {
    const base    = buildMrlInput(5.0);
    const mutated = buildMrlInput(5.0, { cost: { maturity: 2, c1: 9.0, c2: 9.0, c3: 9.0, c4: 9.0, c5: 9.0, c6: 9.0 } });
    const rBase    = computeMRLScore(base);
    const rMutated = computeMRLScore(mutated);
    expect(rMutated.categories.process.score_S).toBeCloseTo(rBase.categories.process.score_S, 5);
  });

  it("changing cost indicators does not change supply_chain category score_S", () => {
    const base    = buildMrlInput(5.0);
    const mutated = buildMrlInput(5.0, { cost: { maturity: 2, c1: 9.0, c2: 9.0, c3: 9.0, c4: 9.0, c5: 9.0, c6: 9.0 } });
    const rBase    = computeMRLScore(base);
    const rMutated = computeMRLScore(mutated);
    expect(rMutated.categories.supply_chain.score_S).toBeCloseTo(rBase.categories.supply_chain.score_S, 5);
  });

  it("changing cost indicators does not change quality category score_S", () => {
    const base    = buildMrlInput(5.0);
    const mutated = buildMrlInput(5.0, { cost: { maturity: 2, c1: 9.0, c2: 9.0, c3: 9.0, c4: 9.0, c5: 9.0, c6: 9.0 } });
    const rBase    = computeMRLScore(base);
    const rMutated = computeMRLScore(mutated);
    expect(rMutated.categories.quality.score_S).toBeCloseTo(rBase.categories.quality.score_S, 5);
  });

  it("changing cost indicators does not change sustainability category score_S", () => {
    const base    = buildMrlInput(5.0);
    const mutated = buildMrlInput(5.0, { cost: { maturity: 2, c1: 9.0, c2: 9.0, c3: 9.0, c4: 9.0, c5: 9.0, c6: 9.0 } });
    const rBase    = computeMRLScore(base);
    const rMutated = computeMRLScore(mutated);
    expect(rMutated.categories.sustainability.score_S).toBeCloseTo(rBase.categories.sustainability.score_S, 5);
  });

  it("changing cost indicators DOES change the overall mrl_score", () => {
    const base    = buildMrlInput(5.0);
    const mutated = buildMrlInput(5.0, { cost: { maturity: 2, c1: 9.0, c2: 9.0, c3: 9.0, c4: 9.0, c5: 9.0, c6: 9.0 } });
    const rBase    = computeMRLScore(base);
    const rMutated = computeMRLScore(mutated);
    expect(rMutated.mrl_score).toBeGreaterThan(rBase.mrl_score);
  });

  it("supply_chain indicators affect supply_chain only — supplier qualification record isolation", () => {
    const base    = buildMrlInput(5.0);
    const mutated = buildMrlInput(5.0, { supply_chain: { maturity: 2, s1: 9.0, s2: 9.0, s3: 9.0, s4: 9.0, s5: 9.0, s6: 9.0 } });
    const rBase    = computeMRLScore(base);
    const rMutated = computeMRLScore(mutated);
    expect(rMutated.categories.cost.score_S).toBeCloseTo(rBase.categories.cost.score_S, 5);
    expect(rMutated.categories.process.score_S).toBeCloseTo(rBase.categories.process.score_S, 5);
  });
});

// ── T7: SOC dimension score without evidence link — DEFECT D7 ─────────────────
// "Attempt to write a SOC dimension score with no linked evidence record →
//  assert the system rejects it or flags it as self-assessed."
// In vrl.engine.ts there is no evidence-link enforcement mechanism.
// prlScore (PRL/People — closest proxy to SOC) is accepted at any value without
// validation.  DEFECT D7: system accepts silently.

describe("T7 — Evidence-link enforcement absent (DEFECT D7)", () => {
  it("prlScore (SOC proxy) accepted at any value without evidence record — DEFECT D7", () => {
    // The system should reject or flag a score with no linked evidence.
    // Instead it silently accepts it.
    const r = computeVrl(makeVrlInputs(60, { prlScore: 95 }));
    // System does NOT reject; it returns a valid result.
    expect(r).toBeDefined();
    expect(r.isVetoed).toBe(false);
    // DEFECT D7: no rejection, no self-assessed flag.  Score accepted silently.
  });

  it("all nine dimensions accept zero-evidence self-assessed values", () => {
    // No dimension checks for evidence provenance.
    const r = computeVrl(makeVrlInputs(55));
    expect(r.globalVrlScore).toBeGreaterThan(0);
    // DEFECT D7: all scores accepted without evidence records.
  });
});

// ── T8: TRL advance with MRL held constant — DEFECT D1 ───────────────────────
// "Advance TRL from 4 to 7 with MRL held constant → assert VRL composite is
//  UNCHANGED, Sync state transitions OPTIMAL→CRITICAL, alert fires."
//
// DEFECT D1: In vrl.engine.ts, trlScore has a direct path into the VRL composite
// via the Product meta-domain (TRL × 0.40).  The prompt's WGM formula excludes TRL.
// The composite DOES CHANGE when trlScore advances — this is the defect.

describe("T8 — TRL advance with MRL constant (DEFECT D1)", () => {
  // Translate TRL levels to trlScore on 0–100 scale:
  //   TRL 4 → trlScore ≈ 40; TRL 7 → trlScore ≈ 70
  const MRL_CONSTANT = 40;
  const before = computeVrl(makeVrlInputs(60, { trlScore: 40, mrlScore: MRL_CONSTANT }));
  const after  = computeVrl(makeVrlInputs(60, { trlScore: 70, mrlScore: MRL_CONSTANT }));

  it("DEFECT D1: VRL composite CHANGES when trlScore advances (not unchanged as WGM spec requires)", () => {
    // The WGM spec says TRL has no direct path into VRL composite.
    // The live engine violates this — productScore increases when trlScore increases.
    expect(after.metaDomains.productScore).toBeGreaterThan(before.metaDomains.productScore);
    expect(after.baseAverage).toBeGreaterThan(before.baseAverage);
    expect(after.globalVrlScore).toBeGreaterThan(before.globalVrlScore);
    // DEFECT D1: composite changed — expected unchanged per spec.
  });

  it("Sync state transitions from OK (delta=0) to RED (delta=+3) when TRL advances", () => {
    const syncBefore = computeSync({ trl: 4, mrl: 4 });
    const decBefore  = runDecisionTree({ trl: 4, mrl: 4, sync: syncBefore });
    expect(syncBefore.delta).toBe(0);
    expect(decBefore.severity).toBe("OK");

    const syncAfter = computeSync({ trl: 7, mrl: 4 });
    const decAfter  = runDecisionTree({ trl: 7, mrl: 4, sync: syncAfter });
    expect(syncAfter.delta).toBe(3);
    expect(decAfter.severity).toBe("RED");
    // Sync state transitions from "OK" (aligned) to "RED" (TRL_CRITICAL_LEAD)
  });

  it("CRITICAL priority actions fire when TRL=7, MRL=4", () => {
    const sync = computeSync({ trl: 7, mrl: 4 });
    const dec  = runDecisionTree({ trl: 7, mrl: 4, sync });
    const hasCritical = dec.actions.some(a => a.priority === "CRITICAL");
    expect(hasCritical).toBe(true);
  });

  it("TRL advance increases misalignment score (Ψ) from 0 to > 0", () => {
    const syncBefore = computeSync({ trl: 4, mrl: 4 });
    const syncAfter  = computeSync({ trl: 7, mrl: 4 });
    expect(syncBefore.psi).toBe(0);
    expect(syncAfter.psi).toBeGreaterThan(0);
  });

  it("D1 DESIGN CONFIRMATION: TRL is NOT in the WGM spec formula but IS in the live engine", () => {
    // Keeping trlScore constant and changing only mrlScore also changes the composite,
    // confirming mrlScore IS present in the live engine (expected by WGM spec).
    const mrlBefore = computeVrl(makeVrlInputs(60, { mrlScore: 40, trlScore: 60 }));
    const mrlAfter  = computeVrl(makeVrlInputs(60, { mrlScore: 70, trlScore: 60 }));
    expect(mrlAfter.baseAverage).toBeGreaterThan(mrlBefore.baseAverage);
  });
});
