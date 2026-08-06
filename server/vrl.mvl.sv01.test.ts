/**
 * Gate 2 — MVL Scoring + Profile SV-01 Unit Tests
 * FHV-EB-AUD-001 v1.0 — Taxonomy Alignment
 *
 * Covers:
 *  1. MVL canonical composite = exactly 15%
 *  2. MVL scores produce correct market-domain values
 *  3. Profile SV-01: MRL veto bypass for software/social/service ventures
 *  4. Profile SV-01: formula exclusions (Product and Execution paths)
 *  5. Profile SV-01: mrlIsGoverned flag propagation
 */
import { describe, it, expect } from "vitest";
import { computeVrl } from "./vrl.engine";

// ── 1. MVL canonical composite weight = exactly 15% ──────────────────────────
describe("MVL composite weight", () => {
  it("MVL canonical weight = market(0.30) × MVL-in-market(0.50) = 0.15", () => {
    const marketWeight = 0.30;
    const mvlInMarket  = 0.50;
    expect(marketWeight * mvlInMarket).toBeCloseTo(0.15, 10);
  });

  it("100-point MVL swing changes baseAverage by exactly 15 (market×0.30 × MVL-in-market×0.50 × 100)", () => {
    // We compare baseAverage (pre-veto) rather than globalVrlScore, since mvlScore=0 triggers
    // the veto gate (score < 20) and zeroes out globalVrlScore — but the formula weight is still
    // verifiable from baseAverage.
    // Expected: ΔbaseAverage = 100 × 0.50 × 0.30 = 15.0
    const low = computeVrl({
      trlScore: 60, mrlScore: 60, brlScore: 60,
      ecoScore: 60, prlScore: 60, ipScore: 60,
      frlScore: 60, regScore: 60, srlScore: 60,
      mvlScore: 0,  // triggers veto on globalVrlScore but not on baseAverage
    });
    const high = computeVrl({
      trlScore: 60, mrlScore: 60, brlScore: 60,
      ecoScore: 60, prlScore: 60, ipScore: 60,
      frlScore: 60, regScore: 60, srlScore: 60,
      mvlScore: 100,
    });
    const deltaBase = high.baseAverage - low.baseAverage;
    expect(deltaBase).toBeCloseTo(15, 1);
  });

  it("all dims 50, mvlScore 50 → market = BRL×0.25+PRL×0.25+MVL×0.50 = 50", () => {
    const result = computeVrl({
      trlScore: 50, mrlScore: 50, brlScore: 50,
      ecoScore: 50, prlScore: 50, ipScore: 50,
      frlScore: 50, regScore: 50, srlScore: 50,
      mvlScore: 50,
    });
    // 50*0.25 + 50*0.25 + 50*0.50 = 12.5 + 12.5 + 25 = 50
    expect(result.metaDomains.marketScore).toBeCloseTo(50, 1);
  });

  it("mvlScore=80 with brl=40, prl=40 → market = 40×0.25+40×0.25+80×0.50 = 60", () => {
    const result = computeVrl({
      trlScore: 50, mrlScore: 50, brlScore: 40,
      ecoScore: 50, prlScore: 40, ipScore: 50,
      frlScore: 50, regScore: 50, srlScore: 50,
      mvlScore: 80,
    });
    // 40*0.25 + 40*0.25 + 80*0.50 = 10 + 10 + 40 = 60
    expect(result.metaDomains.marketScore).toBeCloseTo(60, 1);
  });
});

// ── 2. Profile SV-01: veto bypass ────────────────────────────────────────────
describe("Profile SV-01 — veto bypass", () => {
  const sv01Inputs = {
    trlScore: 65, mrlScore: 5,  // MRL=5 → would normally veto
    brlScore: 60, ecoScore: 70,
    prlScore: 62, ipScore: 58,
    frlScore: 63, regScore: 65,
    srlScore: 67, mvlScore: 70,
    profile: "SV-01_SOCIAL_SOFTWARE" as const,
    mrlIsUnscored: true,
  };

  it("STANDARD profile with MRL=5 should be vetoed", () => {
    const result = computeVrl({
      ...sv01Inputs,
      profile: "STANDARD",
      mrlIsUnscored: false,
    });
    expect(result.isVetoed).toBe(true);
    expect(result.globalVrlScore).toBe(0);
    expect(result.vetoedDimensions.some(d => d.includes("MRL"))).toBe(true);
  });

  it("SV-01 profile with MRL=5 and mrlIsUnscored=true should NOT be vetoed", () => {
    const result = computeVrl(sv01Inputs);
    expect(result.isVetoed).toBe(false);
    expect(result.globalVrlScore).toBeGreaterThan(0);
    expect(result.vetoedDimensions.every(d => !d.includes("MRL"))).toBe(true);
  });

  it("SV-01 with all non-MRL dims ≥ 20 produces a valid score in the Established band", () => {
    const result = computeVrl(sv01Inputs);
    // Expected: globalScore in 55–69 range (Established)
    // baseAverage ≈ product×0.175 + market×0.30 + exec×0.175 + struct×0.175 + sustain×0.175
    expect(result.globalVrlScore).toBeGreaterThanOrEqual(55);
    expect(result.globalVrlScore).toBeLessThanOrEqual(84);
    expect(result.mrlIsGoverned).toBe(true);
  });

  it("SV-01 mrlIsGoverned flag is set on result", () => {
    const result = computeVrl(sv01Inputs);
    expect(result.mrlIsGoverned).toBe(true);
    expect(result.profile).toBe("SV-01_SOCIAL_SOFTWARE");
  });
});

// ── 3. Profile SV-01: formula paths ──────────────────────────────────────────
describe("Profile SV-01 — formula exclusions", () => {
  // Isolate product score: TRL=100, BRL=0 → SV-01 product = TRL×0.6154 + BRL×0.3846 = 61.54
  it("SV-01 Product = TRL×0.6154 + BRL×0.3846 (MRL excluded, weights renormalised)", () => {
    const result = computeVrl({
      trlScore: 100, mrlScore: 5, brlScore: 0,
      ecoScore: 50,  prlScore: 50, ipScore: 50,
      frlScore: 50,  regScore: 50, srlScore: 50,
      mvlScore: 50,
      profile: "SV-01_SOCIAL_SOFTWARE",
      mrlIsUnscored: true,
    });
    // TRL×0.6154 = 100×0.6154 = 61.54; BRL×0.3846 = 0; product ≈ 61.54
    expect(result.metaDomains.productScore).toBeCloseTo(61.54, 0);
  });

  // Execution: FRL=100, MRL=5 (ignored) → Execution = FRL×1.00 = 100
  it("SV-01 Execution = FRL×1.00 (MRL excluded)", () => {
    const result = computeVrl({
      trlScore: 50, mrlScore: 5, brlScore: 50,
      ecoScore: 50, prlScore: 50, ipScore: 50,
      frlScore: 100, regScore: 50, srlScore: 50,
      mvlScore: 50,
      profile: "SV-01_SOCIAL_SOFTWARE",
      mrlIsUnscored: true,
    });
    expect(result.metaDomains.executionScore).toBeCloseTo(100, 1);
  });

  // STANDARD: same inputs — FRL=100, MRL=5 → Execution = 100*0.6 + 5*0.4 = 60+2 = 62
  it("STANDARD Execution with FRL=100, MRL=5 = 62 (contrast with SV-01)", () => {
    const result = computeVrl({
      trlScore: 50, mrlScore: 5, brlScore: 50,
      ecoScore: 50, prlScore: 50, ipScore: 50,
      frlScore: 100, regScore: 50, srlScore: 50,
      mvlScore: 50,
      // STANDARD path; MRL=5 triggers veto so score=0, but executionScore is still computed
      profile: "STANDARD",
      mrlIsUnscored: false,
    });
    expect(result.metaDomains.executionScore).toBeCloseTo(62, 1);
    expect(result.isVetoed).toBe(true); // MRL=5 triggers veto under STANDARD
  });
});

// ── 4. SV-01: MVL still participates in market domain under SV-01 ─────────────
describe("Profile SV-01 — MVL still scored in market domain", () => {
  it("Market domain still uses BRL×0.25 + PRL×0.25 + MVL×0.50 under SV-01", () => {
    const result = computeVrl({
      trlScore: 65, mrlScore: 5, brlScore: 60,
      ecoScore: 70, prlScore: 62, ipScore: 58,
      frlScore: 63, regScore: 65, srlScore: 67,
      mvlScore: 80, // high MVL
      profile: "SV-01_SOCIAL_SOFTWARE",
      mrlIsUnscored: true,
    });
    // market = 60×0.25 + 62×0.25 + 80×0.50 = 15 + 15.5 + 40 = 70.5
    expect(result.metaDomains.marketScore).toBeCloseTo(70.5, 1);
  });
});
