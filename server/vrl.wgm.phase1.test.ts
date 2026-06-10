/**
 * ══════════════════════════════════════════════════════════════════════════════
 * VRL WGM TEST SUITE — PHASE 1: Formula Assertions
 * Spec reference: BEBUS-VRL-WGM-001 / BEBUS-VRL-UPDATE-001
 * Engine under test: server/vrl.engine.ts
 *
 * ── D3 SCALE AUDIT (Phase 0) ─────────────────────────────────────────────────
 *
 * (a) SCALE:
 *   vrl.engine.ts (BEBUS-VRL-UPDATE-001) computes the composite on a 0–100 scale.
 *   All 9 input dimensions (trlScore, mrlScore, brlScore, ecoScore, prlScore,
 *   ipScore, frlScore, regScore, srlScore) are 0–100.  The composite is the mean
 *   of 5 meta-domain scores, also 0–100.
 *   A legacy formula in db.ts (VRL = (α·TRL + β·BRL)×(1−Risk)×Confidence) uses
 *   a separate 0–9 scale.  That formula is tested in vrl.scoring.test.ts and is
 *   NOT the WGM model.
 *   The prompt's per-dimension floors (ENV 2.0, SMF 3.0, …) imply a 0–10 scale —
 *   this WGM formula IS NOT IMPLEMENTED in the codebase.
 *
 * (b) STAGE THRESHOLDS (live 0–100 band table in vrl.engine.ts):
 *   VRL-2 Developing : 40–54  → Stage 2 ≥ 40  ✓ matches prompt
 *   VRL-3 Established: 55–69  → Stage 3 ≥ 55  ✗ prompt says ≥ 60 (5-point gap)
 *   VRL-4 Advanced   : 70–84  → Stage 4 ≥ 70  ✓ matches prompt
 *   VRL-5 Exemplary  : 85–100 → Stage 5 ≥ 85  ✓ matches prompt
 *
 * (c) DISAGREEMENTS:
 *   • Prompt formula uses dims ENV/MRL/SMF/SOC/ESG/IP/CRL/BRL/FIN (9-weight vector).
 *     Live engine uses TRL/MRL/BRL/ECO/PRL/IP/FRL/REG/SRL via 5 meta-domain
 *     intermediates with no single 9-weight column vector.
 *   • "SMF" (Surface / Manufacturing Fitness?) has no live counterpart.
 *     TRL is present in the live engine but absent from the prompt's WGM formula.
 *   • Stage 3 threshold mismatch: prompt ≥60, live band starts at 55.
 *   • Tables vrl_wgm_scores, vrl_dimension_scores, vrl_gate_history DO NOT exist
 *     in the Drizzle schema.
 *   • Prompt per-dimension floor set (ENV 2.0, SMF 3.0, …) does not exist; live
 *     engine uses a single uniform veto threshold of <20 on the 0–100 scale.
 *   • MRL sub-formula (7 subs: PD/EA/QM/SCR/WC/CM/PS) is not implemented.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from "vitest";
import {
  computeVrl,
  computeMetaDomains,
  computeBaseAverage,
  findVetoedDimensions,
  scoreToBand,
  VRL_BANDS,
  type VrlInputs,
} from "./vrl.engine";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** All dimensions at `base`; optional overrides per key. */
function makeInputs(base: number, overrides: Partial<VrlInputs> = {}): VrlInputs {
  return {
    trlScore:  base,
    mrlScore:  base,
    brlScore:  base,
    ecoScore:  base,
    prlScore:  base,
    ipScore:   base,
    frlScore:  base,
    regScore:  base,
    srlScore:  base,
    ...overrides,
  };
}

const DIM_KEYS = [
  "trlScore", "mrlScore", "brlScore", "ecoScore",
  "prlScore", "ipScore",  "frlScore", "regScore", "srlScore",
] as const;

// Uniform veto threshold used by the live engine
const VETO_THRESHOLD = 20;

// ── T1: Meta-domain weight assertions ─────────────────────────────────────────
// The live engine has no single 9-weight vector; instead each meta-domain has its
// own set of constituent weights that sum to 1.0.  This is the closest analogue
// to the prompt's T1 "runtime assertion that dimension weights sum to exactly 1.0".

describe("T1 — Meta-domain constituent weights each sum to 1.0", () => {
  it("Product meta-domain: TRL(0.40) + MRL(0.35) + BRL(0.25) = 1.0", () => {
    // Verify by isolating each input contribution
    const base = makeInputs(0);
    const trlOnly  = computeMetaDomains({ ...base, trlScore: 100 });
    const mrlOnly  = computeMetaDomains({ ...base, mrlScore: 100 });
    const brlOnly  = computeMetaDomains({ ...base, brlScore: 100 });
    // When all three at 100 simultaneously, productScore must equal 100
    const allThree = computeMetaDomains({ ...base, trlScore: 100, mrlScore: 100, brlScore: 100 });
    expect(allThree.productScore).toBeCloseTo(100, 5);
    // Individual weights
    expect(trlOnly.productScore).toBeCloseTo(40,   5);
    expect(mrlOnly.productScore).toBeCloseTo(35,   5);
    expect(brlOnly.productScore).toBeCloseTo(25,   5);
    // Sum of weights
    expect(0.40 + 0.35 + 0.25).toBeCloseTo(1.0, 10);
  });

  it("Market meta-domain: BRL(0.50) + PRL(0.50) = 1.0", () => {
    const base = makeInputs(0);
    const brlOnly = computeMetaDomains({ ...base, brlScore: 100 });
    const prlOnly = computeMetaDomains({ ...base, prlScore: 100 });
    const both    = computeMetaDomains({ ...base, brlScore: 100, prlScore: 100 });
    expect(both.marketScore).toBeCloseTo(100, 5);
    expect(brlOnly.marketScore).toBeCloseTo(50, 5);
    expect(prlOnly.marketScore).toBeCloseTo(50, 5);
    expect(0.50 + 0.50).toBeCloseTo(1.0, 10);
  });

  it("Execution meta-domain: FRL(0.60) + MRL(0.40) = 1.0", () => {
    const base = makeInputs(0);
    const frlOnly = computeMetaDomains({ ...base, frlScore: 100 });
    const mrlOnly = computeMetaDomains({ ...base, mrlScore: 100 });
    const both    = computeMetaDomains({ ...base, frlScore: 100, mrlScore: 100 });
    expect(both.executionScore).toBeCloseTo(100, 5);
    expect(frlOnly.executionScore).toBeCloseTo(60, 5);
    expect(mrlOnly.executionScore).toBeCloseTo(40, 5);
    expect(0.60 + 0.40).toBeCloseTo(1.0, 10);
  });

  it("Structural meta-domain: IP(0.50) + REG(0.50) = 1.0", () => {
    const base = makeInputs(0);
    const ipOnly  = computeMetaDomains({ ...base, ipScore:  100 });
    const regOnly = computeMetaDomains({ ...base, regScore: 100 });
    const both    = computeMetaDomains({ ...base, ipScore: 100, regScore: 100 });
    expect(both.structuralScore).toBeCloseTo(100, 5);
    expect(ipOnly.structuralScore).toBeCloseTo(50, 5);
    expect(regOnly.structuralScore).toBeCloseTo(50, 5);
    expect(0.50 + 0.50).toBeCloseTo(1.0, 10);
  });

  it("Sustainability meta-domain: ECO(0.60) + SRL(0.40) = 1.0", () => {
    const base   = makeInputs(0);
    const ecoOnly = computeMetaDomains({ ...base, ecoScore: 100 });
    const srlOnly = computeMetaDomains({ ...base, srlScore: 100 });
    const both    = computeMetaDomains({ ...base, ecoScore: 100, srlScore: 100 });
    expect(both.sustainabilityScore).toBeCloseTo(100, 5);
    expect(ecoOnly.sustainabilityScore).toBeCloseTo(60, 5);
    expect(srlOnly.sustainabilityScore).toBeCloseTo(40, 5);
    expect(0.60 + 0.40).toBeCloseTo(1.0, 10);
  });
});

// ── T4: All-maxima fixture → composite equals scale maximum (100) ─────────────

describe("T4 — All nine dimensions = 100 → globalVrlScore = 100 (scale maximum)", () => {
  const result = computeVrl(makeInputs(100));

  it("is not vetoed", () => {
    expect(result.isVetoed).toBe(false);
    expect(result.vetoedDimensions).toHaveLength(0);
  });

  it("all five meta-domain scores = 100", () => {
    expect(result.metaDomains.productScore).toBeCloseTo(100, 2);
    expect(result.metaDomains.marketScore).toBeCloseTo(100, 2);
    expect(result.metaDomains.executionScore).toBeCloseTo(100, 2);
    expect(result.metaDomains.structuralScore).toBeCloseTo(100, 2);
    expect(result.metaDomains.sustainabilityScore).toBeCloseTo(100, 2);
  });

  it("baseAverage = 100", () => {
    expect(result.baseAverage).toBeCloseTo(100, 2);
  });

  it("globalVrlScore = 100 (scale maximum)", () => {
    expect(result.globalVrlScore).toBe(100);
  });

  it("band is Exemplary (VRL-5)", () => {
    expect(result.bandLabel).toBe("Exemplary");
    expect(result.bandLevel).toBe(5);
  });
});

// ── T2: 27 veto boundary cases (9 dims × 3 boundary values) ──────────────────
// The live engine uses a single uniform veto threshold < 20 for all dimensions.
// There are no per-dimension floors as described in the WGM spec.
//
// Boundary cases per dimension:
//   score = VETO_THRESHOLD - 1 = 19  → gate blocks (isVetoed = true)
//   score = VETO_THRESHOLD     = 20  → gate passes (isVetoed = false)
//   score = VETO_THRESHOLD + 1 = 21  → gate passes (isVetoed = false)

describe("T2 — 27 veto boundary cases (9 dimensions × 3 scores)", () => {
  for (const dim of DIM_KEYS) {
    describe(`Dimension: ${dim}`, () => {
      const base = makeInputs(50); // all others well above threshold

      it(`score = ${VETO_THRESHOLD - 1} → gate blocks`, () => {
        const r = computeVrl({ ...base, [dim]: VETO_THRESHOLD - 1 });
        expect(r.isVetoed).toBe(true);
        expect(r.globalVrlScore).toBe(0);
      });

      it(`score = ${VETO_THRESHOLD} → gate passes`, () => {
        const r = computeVrl({ ...base, [dim]: VETO_THRESHOLD });
        expect(r.isVetoed).toBe(false);
        expect(r.globalVrlScore).toBeGreaterThan(0);
      });

      it(`score = ${VETO_THRESHOLD + 1} → gate passes`, () => {
        const r = computeVrl({ ...base, [dim]: VETO_THRESHOLD + 1 });
        expect(r.isVetoed).toBe(false);
        expect(r.globalVrlScore).toBeGreaterThan(0);
      });
    });
  }
});

// ── T3: 9 veto cases — gate state blocked AND baseAverage is retrievable ───────
// NOTE: DEFECT D4 CHECK — the prompt asks whether the stored composite is zeroed
// by the gate multiplier.  In vrl.engine.ts: globalVrlScore is set to 0 when
// vetoed, but baseAverage (the pre-gate composite) is ALWAYS computed and returned
// in the VrlResult.  D4 is NOT triggered — baseAverage is retrievable even when
// the gate vetoes the venture.

describe("T3 — Per-dimension veto: gate = blocked, pre-gate baseAverage retrievable", () => {
  for (const dim of DIM_KEYS) {
    it(`${dim} = 19: isVetoed=true, globalVrlScore=0, baseAverage > 0`, () => {
      const inputs = makeInputs(90, { [dim]: 19 } as Partial<VrlInputs>);
      const result = computeVrl(inputs);

      expect(result.isVetoed).toBe(true);
      expect(result.globalVrlScore).toBe(0);

      // D4 check: baseAverage must be non-zero and positive
      // (the weighted composite is still computed and retrievable)
      expect(result.baseAverage).toBeGreaterThan(0);

      // Exactly one dimension vetoed
      expect(result.vetoedDimensions).toHaveLength(1);
    });
  }

  it("D4 VERDICT: baseAverage is stored/retrievable when gate blocks — NOT a defect", () => {
    const r = computeVrl(makeInputs(90, { trlScore: 19 }));
    expect(r.isVetoed).toBe(true);
    expect(r.baseAverage).toBeGreaterThan(0);   // pre-gate composite is non-zero
    expect(r.globalVrlScore).toBe(0);            // but output is zeroed
    // If baseAverage were 0 here it would be DEFECT D4; it is not.
  });
});

// ── Stage threshold correctness ───────────────────────────────────────────────

describe("Stage threshold verification against live band table", () => {
  it("Stage 2 ≥ 40 — band Developing starts at 40", () => {
    const b = VRL_BANDS.find(b => b.label === "Developing");
    expect(b?.min).toBe(40);
  });

  it("Stage 3 — live band Established starts at 55, NOT 60 as stated in prompt spec", () => {
    const b = VRL_BANDS.find(b => b.label === "Established");
    expect(b?.min).toBe(55);
    // DISAGREEMENT: prompt says Stage 3 ≥ 60; live engine is ≥ 55 (5-point gap)
  });

  it("Stage 4 ≥ 70 — band Advanced starts at 70", () => {
    const b = VRL_BANDS.find(b => b.label === "Advanced");
    expect(b?.min).toBe(70);
  });

  it("Stage 5 ≥ 85 — band Exemplary starts at 85", () => {
    const b = VRL_BANDS.find(b => b.label === "Exemplary");
    expect(b?.min).toBe(85);
  });

  it("Score 55 maps to Established (VRL-3)", () => {
    expect(scoreToBand(55).label).toBe("Established");
  });

  it("Score 59 maps to Established (VRL-3) — not yet Stage 3 by prompt definition", () => {
    expect(scoreToBand(59).label).toBe("Established");
  });
});
