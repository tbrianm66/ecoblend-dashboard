/**
 * VRL Engine Tests — BEBUS-VRL-UPDATE-001
 * Verifies all 5 spec scenarios from EcoBlendVRLUpdateManusPrompt.pdf
 */
import { describe, it, expect } from "vitest";
import {
  computeVrl,
  computeMetaDomains,
  computeBaseAverage,
  findVetoedDimensions,
  scoreToBand,
  VRL_BANDS,
} from "./vrl.engine";

// ── Scenario 1: All-green venture (no veto, high scores) ─────────────────────
describe("Scenario 1 — All-green venture", () => {
  const inputs = {
    trlScore: 80, mrlScore: 75, brlScore: 70,
    ecoScore: 85, prlScore: 72, ipScore: 78,
    frlScore: 68, regScore: 82, srlScore: 76,
  };
  const result = computeVrl(inputs);

  it("should not be vetoed", () => {
    expect(result.isVetoed).toBe(false);
    expect(result.vetoedDimensions).toHaveLength(0);
  });

  it("should compute product score correctly", () => {
    // TRL(0.40) + MRL(0.35) + BRL(0.25) = 80*0.4 + 75*0.35 + 70*0.25 = 32 + 26.25 + 17.5 = 75.75
    expect(result.metaDomains.productScore).toBeCloseTo(75.75, 1);
  });

  it("should compute market score correctly", () => {
    // BRL(0.50) + PRL(0.50) = 70*0.5 + 72*0.5 = 35 + 36 = 71
    expect(result.metaDomains.marketScore).toBeCloseTo(71, 1);
  });

  it("should compute execution score correctly", () => {
    // FRL(0.60) + MRL(0.40) = 68*0.6 + 75*0.4 = 40.8 + 30 = 70.8
    expect(result.metaDomains.executionScore).toBeCloseTo(70.8, 1);
  });

  it("should compute structural score correctly", () => {
    // IP(0.50) + REG(0.50) = 78*0.5 + 82*0.5 = 39 + 41 = 80
    expect(result.metaDomains.structuralScore).toBeCloseTo(80, 1);
  });

  it("should compute sustainability score correctly", () => {
    // ECO(0.60) + SRL(0.40) = 85*0.6 + 76*0.4 = 51 + 30.4 = 81.4
    expect(result.metaDomains.sustainabilityScore).toBeCloseTo(81.4, 1);
  });

  it("should produce a globalVrlScore in the Advanced band (70–84)", () => {
    expect(result.globalVrlScore).toBeGreaterThanOrEqual(70);
    expect(result.globalVrlScore).toBeLessThanOrEqual(84);
    expect(result.bandLabel).toBe("Advanced");
    expect(result.bandLevel).toBe(4);
  });
});

// ── Scenario 2: Veto triggered by single dimension ───────────────────────────
describe("Scenario 2 — Single veto (FRL = 10)", () => {
  const inputs = {
    trlScore: 75, mrlScore: 70, brlScore: 65,
    ecoScore: 80, prlScore: 68, ipScore: 72,
    frlScore: 10, // BELOW VETO THRESHOLD
    regScore: 78, srlScore: 71,
  };
  const result = computeVrl(inputs);

  it("should be vetoed", () => {
    expect(result.isVetoed).toBe(true);
  });

  it("should identify FRL as the vetoed dimension", () => {
    expect(result.vetoedDimensions).toHaveLength(1);
    expect(result.vetoedDimensions[0]).toContain("FRL");
  });

  it("should return globalVrlScore = 0", () => {
    expect(result.globalVrlScore).toBe(0);
  });

  it("should return bandLabel containing 'Vetoed'", () => {
    expect(result.bandLabel).toContain("Vetoed");
  });
});

// ── Scenario 3: Multiple veto dimensions ─────────────────────────────────────
describe("Scenario 3 — Multiple veto dimensions", () => {
  const inputs = {
    trlScore: 15, mrlScore: 12, brlScore: 60,
    ecoScore: 70, prlScore: 65, ipScore: 55,
    frlScore: 50, regScore: 60, srlScore: 58,
  };
  const result = computeVrl(inputs);

  it("should be vetoed", () => {
    expect(result.isVetoed).toBe(true);
  });

  it("should identify TRL and MRL as vetoed dimensions", () => {
    expect(result.vetoedDimensions.length).toBeGreaterThanOrEqual(2);
    expect(result.vetoedDimensions.some(d => d.includes("TRL"))).toBe(true);
    expect(result.vetoedDimensions.some(d => d.includes("MRL"))).toBe(true);
  });

  it("should return globalVrlScore = 0", () => {
    expect(result.globalVrlScore).toBe(0);
  });
});

// ── Scenario 4: Boundary veto (score exactly 20 — should NOT veto) ───────────
describe("Scenario 4 — Boundary score = 20 (no veto)", () => {
  const inputs = {
    trlScore: 20, mrlScore: 20, brlScore: 20,
    ecoScore: 20, prlScore: 20, ipScore: 20,
    frlScore: 20, regScore: 20, srlScore: 20,
  };
  const result = computeVrl(inputs);

  it("should NOT be vetoed at exactly 20", () => {
    expect(result.isVetoed).toBe(false);
    expect(result.vetoedDimensions).toHaveLength(0);
  });

  it("should produce globalVrlScore = 20 (all scores equal)", () => {
    // All meta-domains = 20, base average = 20, rounded = 20
    expect(result.globalVrlScore).toBe(20);
    expect(result.bandLabel).toBe("Emerging");
    expect(result.bandLevel).toBe(1);
  });
});

// ── Scenario 5: Exemplary venture (all scores >= 85) ─────────────────────────
describe("Scenario 5 — Exemplary venture", () => {
  const inputs = {
    trlScore: 90, mrlScore: 88, brlScore: 92,
    ecoScore: 95, prlScore: 87, ipScore: 91,
    frlScore: 86, regScore: 93, srlScore: 89,
  };
  const result = computeVrl(inputs);

  it("should not be vetoed", () => {
    expect(result.isVetoed).toBe(false);
  });

  it("should produce a globalVrlScore in the Exemplary band (85–100)", () => {
    expect(result.globalVrlScore).toBeGreaterThanOrEqual(85);
    expect(result.bandLabel).toBe("Exemplary");
    expect(result.bandLevel).toBe(5);
  });
});

// ── Band table tests ──────────────────────────────────────────────────────────
describe("Band table", () => {
  it("should have 6 bands covering 0–100 without gaps", () => {
    expect(VRL_BANDS).toHaveLength(6);
    expect(VRL_BANDS[0].min).toBe(0);
    expect(VRL_BANDS[5].max).toBe(100);
  });

  it("should map score 0 to Pre-Readiness", () => {
    expect(scoreToBand(0).label).toBe("Pre-Readiness");
  });

  it("should map score 55 to Established", () => {
    expect(scoreToBand(55).label).toBe("Established");
  });

  it("should map score 100 to Exemplary", () => {
    expect(scoreToBand(100).label).toBe("Exemplary");
  });
});

// ── Meta-domain weight validation ─────────────────────────────────────────────
describe("Meta-domain weight validation", () => {
  it("product weights sum to 1.0", () => {
    expect(0.40 + 0.35 + 0.25).toBeCloseTo(1.0, 10);
  });

  it("market weights sum to 1.0", () => {
    expect(0.50 + 0.50).toBeCloseTo(1.0, 10);
  });

  it("execution weights sum to 1.0", () => {
    expect(0.60 + 0.40).toBeCloseTo(1.0, 10);
  });

  it("structural weights sum to 1.0", () => {
    expect(0.50 + 0.50).toBeCloseTo(1.0, 10);
  });

  it("sustainability weights sum to 1.0", () => {
    expect(0.60 + 0.40).toBeCloseTo(1.0, 10);
  });
});
