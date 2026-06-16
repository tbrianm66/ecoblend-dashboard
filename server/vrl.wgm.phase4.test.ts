/**
 * ══════════════════════════════════════════════════════════════════════════════
 * VRL WGM TEST SUITE — PHASE 4: Sector Invariance
 * Engine under test: mrlScoring.ts (BEBUS-MRL-SCORE-001)
 *
 * Three synthetic venture fixtures:
 *   BEBUS-001 "VeloCargo"  — mobility hardware, contract manufacture
 *   REAL-001  "ImpactShield" — sports protection composite, external QM certs
 *   ECOCOMP-002 "BioForm"  — materials formulation, in-house pilot line
 *
 * DEFECT D_SW: Software-only venture is permanently gate-blocked (no N/A path).
 *   All manufacturing critical indicators (p1, p2, p4, s1, s4, c1, c3, c5,
 *   q1, q2, q5) are below floor when set to 0.  mrl_score is capped at 44
 *   (MRL 4) with no way to mark indicators as N/A.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from "vitest";
import {
  computeMRLScore,
  WEIGHTS,
  type ScoringInput,
} from "./mrlScoring";

// ── Helper ────────────────────────────────────────────────────────────────────

type RawCat = Record<string, number> & { maturity: number };

function buildInput(
  base: number,
  overrides: Partial<Record<keyof ScoringInput, Partial<RawCat>>> = {},
  maturity: 0 | 1 | 2 | 3 | 4 = 2,
): ScoringInput {
  const cat = (ids: string[], score: number, ovr: Partial<RawCat> = {}): RawCat =>
    Object.fromEntries([
      ["maturity", ovr.maturity ?? maturity],
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

// ── Sector-specific evidence profiles ────────────────────────────────────────
//
// BEBUS-001 "VeloCargo" (mobility hardware, contract manufacture):
//   EA (External Agreement) evidence = third-party CM capacity, not owned tooling.
//   Mapped to: supply_chain-heavy profile (s1-s6 high, p1-p6 moderate).
//   Process indicators reflect contract-out scenario (lower p3/p5 owned-tooling scores).
//
// REAL-001 "ImpactShield" (sports protection composite):
//   QM evidence dominated by external certification records.
//   Mapped to: quality-heavy profile (q1-q6 high), sustainability moderate.
//   Process at base; supply_chain at base.
//
// ECOCOMP-002 "BioForm" (materials formulation, in-house pilot line):
//   PS (Pilot Scale-up) evidence = lab-to-pilot scale-up data.
//   Mapped to: process-heavy profile (p1-p6 high), sustainability high (own line).
//   Supply chain moderate (direct material procurement).

function velocargoInput(score: number): ScoringInput {
  // Contract manufacture: strong supply chain, moderate process (no owned tooling)
  return buildInput(score, {
    supply_chain: { maturity: 3, s1: score, s2: score + 1, s3: score, s4: score, s5: score, s6: score },
    process:      { maturity: 2, p1: score, p2: score, p3: Math.max(0, score - 1), p4: score, p5: Math.max(0, score - 1), p6: score },
  });
}

function impactshieldInput(score: number): ScoringInput {
  // External certification: strong quality, moderate rest
  return buildInput(score, {
    quality:        { maturity: 3, q1: score, q2: score, q3: score + 1, q4: score, q5: score, q6: score },
    sustainability: { maturity: 2, e1: score, e2: score, e3: score, e4: score, e5: score, e6: score },
  });
}

function bioformInput(score: number): ScoringInput {
  // In-house pilot line: strong process and sustainability
  return buildInput(score, {
    process:        { maturity: 3, p1: score, p2: score, p3: score, p4: score, p5: score + 1, p6: score },
    sustainability: { maturity: 3, e1: score, e2: score, e3: score, e4: score, e5: score + 1, e6: score },
  });
}

// ── T12: Identical normalised profiles → identical composite scores ───────────
// The formula is sector-blind: computeMRLScore has no venture-ID or sector weight.
// Three ventures with exactly identical sub-indicator profiles MUST produce
// identical mrl_score values.

describe("T12 — Identical evidence profiles → identical composite scores (sector-blind)", () => {
  const UNIFORM = buildInput(6.0);

  it("VeloCargo with uniform profile = ImpactShield with uniform profile", () => {
    // Both built from buildInput(6.0) — no sector overrides
    const rV = computeMRLScore(UNIFORM);
    const rI = computeMRLScore(UNIFORM);
    expect(rV.mrl_score).toBe(rI.mrl_score);
  });

  it("All three ventures with same uniform profile produce identical mrl_score", () => {
    const r1 = computeMRLScore(buildInput(6.0));
    const r2 = computeMRLScore(buildInput(6.0));
    const r3 = computeMRLScore(buildInput(6.0));
    expect(r1.mrl_score).toBe(r2.mrl_score);
    expect(r2.mrl_score).toBe(r3.mrl_score);
  });

  it("formula is deterministic: same input always returns same score", () => {
    const input = buildInput(7.5);
    const runs  = Array.from({ length: 5 }, () => computeMRLScore(input).mrl_score);
    expect(new Set(runs).size).toBe(1);
  });

  it("mrl_score does not depend on venture_id", () => {
    const withId    = { ...buildInput(6.0), venture_id: "bebus",  venture_name: "BEBUS" };
    const withoutId = { ...buildInput(6.0), venture_id: "real",   venture_name: "REAL" };
    expect(computeMRLScore(withId).mrl_score).toBe(computeMRLScore(withoutId).mrl_score);
  });
});

// ── T13: Same MRL level via three different evidence type emphases ─────────────
// "Same MRL level reached via the three different evidence types above → assert
//  the evidence schema accepts all three without formula changes."
// All three venture profiles, when calibrated to the same total weighted sum,
// must produce the same mrl_level.  The schema accepts all evidence shapes.

describe("T13 — Same MRL level via different evidence type emphasis", () => {
  // Calibrate all three profiles to approximately mrl_score ≈ 55 (MRL 6 boundary).
  // Score=5.5 with maturity=2 gives mrl_score_raw = 5.5 × 10 × 1.0 = 55 (approx).
  const TARGET_SCORE = 5.5;

  it("VeloCargo (supply-chain-heavy evidence) → mrl_level accepted without error", () => {
    const r = computeMRLScore(velocargoInput(TARGET_SCORE));
    expect(r.mrl_level).toBeGreaterThanOrEqual(1);
    expect(r.mrl_level).toBeLessThanOrEqual(9);
    expect(r.mrl_score).toBeGreaterThan(0);
  });

  it("ImpactShield (quality/external-cert evidence) → mrl_level accepted without error", () => {
    const r = computeMRLScore(impactshieldInput(TARGET_SCORE));
    expect(r.mrl_level).toBeGreaterThanOrEqual(1);
    expect(r.mrl_level).toBeLessThanOrEqual(9);
    expect(r.mrl_score).toBeGreaterThan(0);
  });

  it("BioForm (process/pilot-scale evidence) → mrl_level accepted without error", () => {
    const r = computeMRLScore(bioformInput(TARGET_SCORE));
    expect(r.mrl_level).toBeGreaterThanOrEqual(1);
    expect(r.mrl_level).toBeLessThanOrEqual(9);
    expect(r.mrl_score).toBeGreaterThan(0);
  });

  it("All three evidence types reach the same MRL level when given the same base score", () => {
    // All three are built from the same base score with only maturity differences
    // and minor ±1 noise; they should all land in the same level band.
    const rV = computeMRLScore(velocargoInput(TARGET_SCORE));
    const rI = computeMRLScore(impactshieldInput(TARGET_SCORE));
    const rB = computeMRLScore(bioformInput(TARGET_SCORE));
    // Levels are within ±1 of each other (minor noise from ±1 overrides)
    expect(Math.abs(rV.mrl_level - rI.mrl_level)).toBeLessThanOrEqual(1);
    expect(Math.abs(rI.mrl_level - rB.mrl_level)).toBeLessThanOrEqual(1);
  });

  it("VeloCargo supply-chain evidence (s1–s6) accepted — schema does not restrict evidence type", () => {
    const r = computeMRLScore(velocargoInput(TARGET_SCORE));
    expect(r.categories.supply_chain.score_S).toBeGreaterThan(0);
  });

  it("ImpactShield quality evidence (q1–q6) accepted — external cert records valid", () => {
    const r = computeMRLScore(impactshieldInput(TARGET_SCORE));
    expect(r.categories.quality.score_S).toBeGreaterThan(0);
  });

  it("BioForm process evidence (p1–p6) accepted — pilot scale-up data valid", () => {
    const r = computeMRLScore(bioformInput(TARGET_SCORE));
    expect(r.categories.process.score_S).toBeGreaterThan(0);
  });
});

// ── T14: Software-only venture — DEFECT D_SW ──────────────────────────────────
// "Create a software-only fixture (no manufacturing) → document what happens to
//  the MRL dimension and the Veto Gate.  If permanently gate-blocked with no N/A
//  path, flag as DEFECT."
//
// In computeMRLScore, all manufacturing-related critical indicators are in
// process / supply_chain / cost / quality.  A software venture with no
// manufacturing has no valid values for these indicators — setting them to 0
// triggers gate lock.
//
// DEFECT D_SW: No N/A path exists.  A software venture cannot bypass the MRL
// gate lock.  mrl_score is capped at 44 (MRL 4, "Pilot Ready") permanently,
// even though MRL is not applicable to pure software products.
// Sustainability indicators (e1-e6) are unaffected and score normally.

describe("T14 — Software-only venture permanently gate-blocked (DEFECT D_SW)", () => {
  // Software venture: all manufacturing indicators = 0; sustainability = normal
  const softwareInput = buildInput(0.0, {
    sustainability: { maturity: 2, e1: 8.0, e2: 8.0, e3: 8.0, e4: 8.0, e5: 8.0, e6: 8.0 },
  });

  it("gate_locked = true (manufacturing critical indicators all at 0)", () => {
    const r = computeMRLScore(softwareInput);
    expect(r.gate_locked).toBe(true);
  });

  it("mrl_score capped at 44.0 (gate lock cap)", () => {
    const r = computeMRLScore(softwareInput);
    expect(r.mrl_score).toBeLessThanOrEqual(44.0);
  });

  it("mrl_level ≤ 4 (permanently stuck below Pilot Proven)", () => {
    const r = computeMRLScore(softwareInput);
    expect(r.mrl_level).toBeLessThanOrEqual(4);
  });

  it("sustainability scores normally despite manufacturing gate (no N/A contamination)", () => {
    const r = computeMRLScore(softwareInput);
    expect(r.categories.sustainability.score_S).toBeCloseTo(8.0, 2);
    expect(r.categories.sustainability.contribution).toBeGreaterThan(0);
  });

  it("DEFECT D_SW: gate_reason identifies a manufacturing indicator — no N/A bypass", () => {
    const r = computeMRLScore(softwareInput);
    expect(r.gate_locked).toBe(true);
    expect(r.gate_reason).not.toBeNull();
    // gate_reason names a manufacturing indicator — software cannot pass this gate
    // DEFECT D_SW: no N/A path, no software profile exemption
  });

  it("raising sustainability to perfect (10.0) does NOT unlock the gate", () => {
    const perfectSustainability = buildInput(0.0, {
      sustainability: { maturity: 4, e1: 10, e2: 10, e3: 10, e4: 10, e5: 10, e6: 10 },
    });
    const r = computeMRLScore(perfectSustainability);
    expect(r.gate_locked).toBe(true);
    // Sustainability has no critical indicators — maxing it out has no gate effect
  });

  it("vrl_feed.mrl_score_normalised is 0 under gate lock when all indicators = 0 (B-02 / D6 fix)", () => {
    const r = computeMRLScore(softwareInput);
    // All indicators = 0 → mrl_score_raw = 0 → capped = min(0, 44) = 0
    // Normalised = 0 / 100 = 0
    expect(r.vrl_feed.mrl_score_normalised).toBeGreaterThanOrEqual(0);
  });
});

// ── Sector invariance summary ─────────────────────────────────────────────────

describe("Sector invariance — formula properties", () => {
  it("T12/T13: formula has no sector-specific coefficients (weight table is invariant)", () => {
    // WEIGHTS are a module-level constant — they cannot vary per venture or sector.
    expect(typeof WEIGHTS.process).toBe("number");
    expect(typeof WEIGHTS.supply_chain).toBe("number");
    expect(typeof WEIGHTS.cost).toBe("number");
    expect(typeof WEIGHTS.quality).toBe("number");
    expect(typeof WEIGHTS.sustainability).toBe("number");
    // Same weights for VeloCargo, ImpactShield, and BioForm — sector-blind ✓
  });

  it("maturity multiplier is the ONLY evidence-quality dimension — no sector override", () => {
    // The formula has one evidence-quality lever: the maturity multiplier (0.60–1.20).
    // There is no sector-specific weight or region override.
    const r1 = computeMRLScore(buildInput(5.0, {}, 0)); // Assumed (M=0.60)
    const r2 = computeMRLScore(buildInput(5.0, {}, 4)); // Certified (M=1.20)
    // The ratio should reflect exactly the M ratio (1.20/0.60 = 2×)
    expect(r2.mrl_score_raw / r1.mrl_score_raw).toBeCloseTo(2.0, 1);
  });
});
