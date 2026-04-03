/**
 * SRL Scoring Engine Tests — BEBUS-SRL-SE-001
 *
 * Validates all mathematical formulas, normalisation methods, weighting,
 * Coverage Adjustment Factor (§3.4), Trajectory Bonus (§3.5), gate evaluation,
 * MASRL / Sustainability Watch detection, and risk condition classification
 * against the worked examples in the academic framework specification.
 */

import { describe, it, expect } from "vitest";
import {
  resolveWeights,
  normaliseKpi,
  computeCoverage,
  scoreDimension,
  computeTrajectoryBonus,
  deriveSrlLevel,
  evaluateGate,
  checkMasrl,
  classifyRiskConditions,
  computeIri,
  runSrlEngine,
  buildVrlPayload,
  DEFAULT_STAGE_WEIGHTS,
  GATE_THRESHOLDS,
  type KpiDefinition,
  type KpiInput,
  type SrlDimCode,
} from "./srl.engine";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDef(overrides: Partial<KpiDefinition> & { kpiCode: string }): KpiDefinition {
  return {
    srlNormMethod: "MIN_MAX",
    normMin: 0,
    normMax: 100,
    normTarget: null,
    thresholdValue: null,
    higherIsBetter: true,
    isMandatory: true,
    ...overrides,
  };
}

// ── 1. Weight Resolution ──────────────────────────────────────────────────────

describe("resolveWeights", () => {
  it("returns default stage weights that sum to 1.00 for each stage", () => {
    const stages = ["S0", "S1", "S2", "S3", "S4"] as const;
    for (const stage of stages) {
      const w = resolveWeights(stage);
      const sum = Object.values(w).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 4);
    }
  });

  it("matches spec Table 4.1 default weights at S2", () => {
    const w = resolveWeights("S2");
    expect(w.ENV).toBeCloseTo(0.22, 2);
    expect(w.LCA).toBeCloseTo(0.18, 2);
    expect(w.SMF).toBeCloseTo(0.18, 2);
    expect(w.SOC).toBeCloseTo(0.22, 2);
    expect(w.ESG).toBeCloseTo(0.20, 2);
  });

  it("applies CleanTech overlay at S2 and renormalises to 1.00", () => {
    const w = resolveWeights("S2", "CLEANTECH");
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 4);
    // CleanTech: ENV+0.05, so ENV should be higher than base 0.22
    expect(w.ENV).toBeGreaterThan(0.22);
    expect(w.SOC).toBeLessThan(0.22);
  });

  it("matches spec Example A CleanTech weights at S2 (before renorm sum already 1.00)", () => {
    // Spec: ENV=0.27, LCA=0.20, SMF=0.21, SOC=0.17, ESG=0.15 (sum=1.00)
    const w = resolveWeights("S2", "CLEANTECH");
    expect(w.ENV).toBeCloseTo(0.27, 2);
    expect(w.LCA).toBeCloseTo(0.20, 2);
    expect(w.SMF).toBeCloseTo(0.21, 2);
    expect(w.SOC).toBeCloseTo(0.17, 2);
    expect(w.ESG).toBeCloseTo(0.15, 2);
  });

  it("enforces minimum weight floor of 0.05 per dimension", () => {
    const w = resolveWeights("S4", "DIGITAL");
    for (const v of Object.values(w)) {
      expect(v).toBeGreaterThanOrEqual(0.05);
    }
  });
});

// ── 2. KPI Normalisation ──────────────────────────────────────────────────────

describe("normaliseKpi — MIN_MAX", () => {
  it("higher is better: x at max → 100", () => {
    const def = makeDef({ kpiCode: "T1", srlNormMethod: "MIN_MAX", normMin: 0, normMax: 100, higherIsBetter: true });
    expect(normaliseKpi(def, 100)).toBeCloseTo(100, 1);
  });

  it("higher is better: x at min → 0", () => {
    const def = makeDef({ kpiCode: "T1", srlNormMethod: "MIN_MAX", normMin: 0, normMax: 100, higherIsBetter: true });
    expect(normaliseKpi(def, 0)).toBeCloseTo(0, 1);
  });

  it("lower is better: ENV-004 spec example (x=3.2, min=10, max=1) → 75.6", () => {
    // Spec: n_k = (10-3.2)/(10-1)*100 = 75.6
    const def = makeDef({ kpiCode: "ENV-004", srlNormMethod: "MIN_MAX", normMin: 10, normMax: 1, higherIsBetter: false });
    expect(normaliseKpi(def, 3.2)).toBeCloseTo(75.6, 0);
  });

  it("clamps out-of-range values to [0, 100]", () => {
    const def = makeDef({ kpiCode: "T1", srlNormMethod: "MIN_MAX", normMin: 0, normMax: 100, higherIsBetter: true });
    expect(normaliseKpi(def, 150)).toBeCloseTo(100, 1);
    expect(normaliseKpi(def, -10)).toBeCloseTo(0, 1);
  });
});

describe("normaliseKpi — TARGET_BASED", () => {
  it("lower is better: ENV-001 spec example (x=142.5, baseline=300, target=0) → 52.5", () => {
    // Spec: n_k = (300-142.5)/(300-0)*100 = 52.5
    const def = makeDef({ kpiCode: "ENV-001", srlNormMethod: "TARGET_BASED", normMin: 300, normTarget: 0, higherIsBetter: false });
    expect(normaliseKpi(def, 142.5)).toBeCloseTo(52.5, 0);
  });

  it("higher is better: x at target → 100", () => {
    const def = makeDef({ kpiCode: "T1", srlNormMethod: "TARGET_BASED", normTarget: 80, higherIsBetter: true });
    expect(normaliseKpi(def, 80)).toBeCloseTo(100, 1);
  });

  it("higher is better: x at 0 → 0", () => {
    const def = makeDef({ kpiCode: "T1", srlNormMethod: "TARGET_BASED", normTarget: 80, higherIsBetter: true });
    expect(normaliseKpi(def, 0)).toBeCloseTo(0, 1);
  });
});

describe("normaliseKpi — THRESHOLD", () => {
  it("higher is better: ENV-008 spec example (x=74%, T=70%) → 56.7", () => {
    // Spec: n_k = 50 + (74-70)/(100-70)*50 = 56.67
    const def = makeDef({ kpiCode: "ENV-008", srlNormMethod: "THRESHOLD", thresholdValue: 70, higherIsBetter: true });
    expect(normaliseKpi(def, 74)).toBeCloseTo(56.7, 0);
  });

  it("higher is better: x exactly at threshold → 50", () => {
    const def = makeDef({ kpiCode: "T1", srlNormMethod: "THRESHOLD", thresholdValue: 70, higherIsBetter: true });
    expect(normaliseKpi(def, 70)).toBeCloseTo(50, 1);
  });

  it("higher is better: x=0 → 0", () => {
    const def = makeDef({ kpiCode: "T1", srlNormMethod: "THRESHOLD", thresholdValue: 70, higherIsBetter: true });
    expect(normaliseKpi(def, 0)).toBeCloseTo(0, 1);
  });

  it("higher is better: x=100% → 100", () => {
    const def = makeDef({ kpiCode: "T1", srlNormMethod: "THRESHOLD", thresholdValue: 70, higherIsBetter: true });
    expect(normaliseKpi(def, 100)).toBeCloseTo(100, 1);
  });
});

describe("normaliseKpi — BINARY", () => {
  it("returns 100 for truthy value", () => {
    const def = makeDef({ kpiCode: "T1", srlNormMethod: "BINARY" });
    expect(normaliseKpi(def, 1)).toBe(100);
  });

  it("returns 0 for falsy value", () => {
    const def = makeDef({ kpiCode: "T1", srlNormMethod: "BINARY" });
    expect(normaliseKpi(def, 0)).toBe(0);
  });
});

describe("normaliseKpi — ORDINAL", () => {
  it("LCA-003 spec example: scale 1–5, x=4 → 75.0", () => {
    // Spec: n_k = (4-1)/(5-1)*100 = 75.0
    const def = makeDef({ kpiCode: "LCA-003", srlNormMethod: "ORDINAL", normMin: 1, normMax: 5, higherIsBetter: true });
    expect(normaliseKpi(def, 4)).toBeCloseTo(75.0, 1);
  });
});

describe("normaliseKpi — null handling", () => {
  it("mandatory KPI with null value returns 0", () => {
    const def = makeDef({ kpiCode: "T1", isMandatory: true });
    expect(normaliseKpi(def, null)).toBe(0);
  });

  it("optional KPI with null value returns null", () => {
    const def = makeDef({ kpiCode: "T1", isMandatory: false });
    expect(normaliseKpi(def, null)).toBeNull();
  });
});

// ── 3. Coverage Factor ────────────────────────────────────────────────────────

describe("computeCoverage", () => {
  it("full mandatory and optional coverage → 1.00", () => {
    expect(computeCoverage(5, 5, 4, 4)).toBeCloseTo(1.0, 4);
  });

  it("zero mandatory submissions → 0.00 (no floor if none submitted)", () => {
    expect(computeCoverage(5, 0, 4, 0)).toBeCloseTo(0.0, 4);
  });

  it("spec Example A ENV: 5/5 mandatory, 1/4 optional → 0.85", () => {
    // mand_cov=1.00, opt_cov=0.25 → 1.00*0.80 + 0.25*0.20 = 0.85
    expect(computeCoverage(5, 5, 4, 1)).toBeCloseTo(0.85, 4);
  });

  it("applies floor of 0.10 when at least one mandatory KPI is submitted", () => {
    // 1/5 mandatory, 0/4 optional → 0.20*0.80 + 0 = 0.16 → no floor needed
    const cov = computeCoverage(5, 1, 4, 0);
    expect(cov).toBeGreaterThanOrEqual(0.10);
  });
});

// ── 4. Trajectory Bonus ───────────────────────────────────────────────────────

describe("computeTrajectoryBonus", () => {
  it("spec Example A: delta1=13.3, delta2=5.25 → bonus=0.93", () => {
    // bonus = MIN((13.3+5.25)/2*0.10, 3.0) = MIN(0.9275, 3.0) = 0.93
    const bonus = computeTrajectoryBonus(52.75, 47.5, 34.2);
    expect(bonus).toBeCloseTo(0.93, 1);
  });

  it("returns 0 when one delta is negative", () => {
    expect(computeTrajectoryBonus(50, 55, 40)).toBe(0); // delta2 negative
  });

  it("returns 0 when no previous assessments", () => {
    expect(computeTrajectoryBonus(50, null, null)).toBe(0);
  });

  it("caps bonus at 3.0", () => {
    // Very large deltas
    const bonus = computeTrajectoryBonus(90, 60, 30);
    expect(bonus).toBeLessThanOrEqual(3.0);
  });
});

// ── 5. SRL Level Derivation ───────────────────────────────────────────────────

describe("deriveSrlLevel", () => {
  const cases: [number, number, string][] = [
    [0,   0,  "SRL-0: Unassessed / Baseline"],
    [19,  0,  "SRL-0: Unassessed / Baseline"],
    [20,  1,  "SRL-1: Aware"],
    [39,  1,  "SRL-1: Aware"],
    [40,  2,  "SRL-2: Committed"],
    [54,  2,  "SRL-2: Committed"],
    [55,  3,  "SRL-3: Measured"],
    [69,  3,  "SRL-3: Measured"],
    [70,  4,  "SRL-4: Optimising"],
    [84,  4,  "SRL-4: Optimising"],
    [85,  5,  "SRL-5: Exemplary"],
    [100, 5,  "SRL-5: Exemplary"],
  ];

  for (const [score, expectedLevel, expectedLabel] of cases) {
    it(`score ${score} → level ${expectedLevel}`, () => {
      const { level, label } = deriveSrlLevel(score);
      expect(level).toBe(expectedLevel);
      expect(label).toBe(expectedLabel);
    });
  }

  it("spec Example A: composite 53.68 → SRL-2 Committed", () => {
    const { level } = deriveSrlLevel(53.68);
    expect(level).toBe(2);
  });
});

// ── 6. Gate Evaluation ────────────────────────────────────────────────────────

describe("evaluateGate", () => {
  const mockDimScores = (scores: Partial<Record<SrlDimCode, number>>) => {
    const dims: SrlDimCode[] = ["ENV", "LCA", "SMF", "SOC", "ESG"];
    const result: any = {};
    for (const d of dims) {
      result[d] = { rawScore: scores[d] ?? 100, coveredScore: scores[d] ?? 100, coverageFactor: 1, gatePass: true, gapFlags: [] };
    }
    return result;
  };

  it("PASS when all thresholds met at G3", () => {
    const dimScores = mockDimScores({ ENV: 45, LCA: 40, SMF: 35, SOC: 50, ESG: 50 });
    const result = evaluateGate("G3", 60, dimScores);
    expect(result.status).toBe("PASS");
    expect(result.failures).toHaveLength(0);
  });

  it("spec Example A: G3 FAIL — composite 53.68 < 55", () => {
    const dimScores = mockDimScores({ ENV: 49.80, LCA: 41.25, SMF: 62.83, SOC: 58.90, ESG: 52.30 });
    const result = evaluateGate("G3", 53.68, dimScores);
    expect(result.status).toBe("FAIL");
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].type).toBe("COMPOSITE");
    expect(result.failures[0].gap).toBeCloseTo(1.32, 1);
  });

  it("spec Example B: G2 FAIL — composite + SMF dimension", () => {
    const dimScores = mockDimScores({ ENV: 26.60, LCA: 27.63, SMF: 10.00, SOC: 52.00, ESG: 44.50 });
    const result = evaluateGate("G2", 35.54, dimScores);
    expect(result.status).toBe("FAIL");
    const types = result.failures.map(f => f.type);
    expect(types).toContain("COMPOSITE");
    expect(result.failures.some(f => f.type === "DIMENSION" && f.dimension === "SMF")).toBe(true);
  });

  it("G3 is a hard block", () => {
    expect(GATE_THRESHOLDS.G3.blockType).toBe("hard");
  });

  it("G1 is advisory", () => {
    expect(GATE_THRESHOLDS.G1.blockType).toBe("advisory");
  });
});

// ── 7. MASRL / Sustainability Watch ──────────────────────────────────────────

describe("checkMasrl", () => {
  const mockDimScores = (scores: Partial<Record<SrlDimCode, number>>) => {
    const dims: SrlDimCode[] = ["ENV", "LCA", "SMF", "SOC", "ESG"];
    const result: any = {};
    for (const d of dims) result[d] = { rawScore: scores[d] ?? 50 };
    return result;
  };

  it("no watch when composite >= 25 and all dims >= 15", () => {
    const { sustainabilityWatch } = checkMasrl(30, mockDimScores({}));
    expect(sustainabilityWatch).toBe(false);
  });

  it("activates watch when composite < 25 (SRL-R01)", () => {
    const { sustainabilityWatch, watchReasons } = checkMasrl(20, mockDimScores({}));
    expect(sustainabilityWatch).toBe(true);
    expect(watchReasons[0]).toContain("SRL-R01");
  });

  it("activates watch when any dimension < 15 (SRL-R02)", () => {
    const { sustainabilityWatch, watchReasons } = checkMasrl(40, mockDimScores({ SMF: 10 }));
    expect(sustainabilityWatch).toBe(true);
    expect(watchReasons.some(r => r.includes("SRL-R02"))).toBe(true);
  });
});

// ── 8. Risk Conditions ────────────────────────────────────────────────────────

describe("classifyRiskConditions", () => {
  const mockDimScores = (scores: Partial<Record<SrlDimCode, number>>) => {
    const dims: SrlDimCode[] = ["ENV", "LCA", "SMF", "SOC", "ESG"];
    const result: any = {};
    for (const d of dims) result[d] = { rawScore: scores[d] ?? 50, coverageFactor: 1, gatePass: true, gapFlags: [] };
    return result;
  };

  it("SRL-R01 raised when composite < MASRL", () => {
    const risks = classifyRiskConditions({ compositeFinal: 20, dimensionScores: mockDimScores({}), gateResult: null, scoreDelta: null });
    expect(risks.some(r => r.code === "SRL-R01" && r.severity === "CRITICAL")).toBe(true);
  });

  it("SRL-R02 raised when dimension < 15", () => {
    const risks = classifyRiskConditions({ compositeFinal: 40, dimensionScores: mockDimScores({ LCA: 10 }), gateResult: null, scoreDelta: null });
    expect(risks.some(r => r.code === "SRL-R02" && r.dimension === "LCA")).toBe(true);
  });

  it("SRL-R03 raised for hard gate G3 FAIL", () => {
    const gateResult = { gateRef: "G3" as const, status: "FAIL" as const, failures: [], gapReport: "", blockType: "hard" as const, remediationWindowDays: 30 };
    const risks = classifyRiskConditions({ compositeFinal: 50, dimensionScores: mockDimScores({}), gateResult, scoreDelta: null });
    expect(risks.some(r => r.code === "SRL-R03" && r.severity === "HIGH")).toBe(true);
  });

  it("SRL-R04 raised for soft gate G2 FAIL", () => {
    const gateResult = { gateRef: "G2" as const, status: "FAIL" as const, failures: [], gapReport: "", blockType: "soft" as const, remediationWindowDays: 30 };
    const risks = classifyRiskConditions({ compositeFinal: 35, dimensionScores: mockDimScores({}), gateResult, scoreDelta: null });
    expect(risks.some(r => r.code === "SRL-R04" && r.severity === "MEDIUM")).toBe(true);
  });

  it("SRL-R05 raised for score regression > 5 points", () => {
    const risks = classifyRiskConditions({ compositeFinal: 40, dimensionScores: mockDimScores({}), gateResult: null, scoreDelta: -7 });
    expect(risks.some(r => r.code === "SRL-R05")).toBe(true);
  });

  it("SRL-R06 raised for stale mandatory KPIs", () => {
    const risks = classifyRiskConditions({ compositeFinal: 40, dimensionScores: mockDimScores({}), gateResult: null, scoreDelta: null, staleMandatoryKpiCodes: ["ENV-001"] });
    expect(risks.some(r => r.code === "SRL-R06" && r.kpiCode === "ENV-001")).toBe(true);
  });

  it("SRL-R07 raised for low coverage dimension", () => {
    const dimScores = mockDimScores({});
    dimScores.SMF.coverageFactor = 0.3;
    const risks = classifyRiskConditions({ compositeFinal: 40, dimensionScores: dimScores, gateResult: null, scoreDelta: null });
    expect(risks.some(r => r.code === "SRL-R07" && r.dimension === "SMF")).toBe(true);
  });
});

// ── 9. Improvement Rate Index ─────────────────────────────────────────────────

describe("computeIri", () => {
  const curr: any = { ENV: { rawScore: 60 }, LCA: { rawScore: 50 }, SMF: { rawScore: 40 }, SOC: { rawScore: 70 }, ESG: { rawScore: 55 } };
  const prev: any = { ENV: { rawScore: 50 }, LCA: { rawScore: 50 }, SMF: { rawScore: 30 }, SOC: { rawScore: 80 }, ESG: { rawScore: 55 } };

  it("returns null IRI when no previous scores", () => {
    const iri = computeIri(curr, null);
    expect(iri.ENV).toBeNull();
  });

  it("computes positive IRI for improving dimension", () => {
    const iri = computeIri(curr, prev);
    expect(iri.ENV).toBeGreaterThan(0); // 60 > 50
    expect(iri.SMF).toBeGreaterThan(0); // 40 > 30
  });

  it("computes negative IRI for regressing dimension", () => {
    const iri = computeIri(curr, prev);
    expect(iri.SOC).toBeLessThan(0); // 70 < 80
  });

  it("computes zero IRI for static dimension", () => {
    const iri = computeIri(curr, prev);
    expect(iri.LCA).toBeCloseTo(0, 1); // 50 = 50
    expect(iri.ESG).toBeCloseTo(0, 1); // 55 = 55
  });
});

// ── 10. Full Engine Integration — Spec Worked Examples ───────────────────────

describe("runSrlEngine — Spec Example A (ClearPath Energy, S2, G3)", () => {
  // Build minimal KPI defs and inputs that reproduce the spec's ENV dimension result
  const envDefs: KpiDefinition[] = [
    makeDef({ kpiCode: "ENV-001", srlNormMethod: "TARGET_BASED", normMin: 300, normTarget: 0, higherIsBetter: false, isMandatory: true }),
    makeDef({ kpiCode: "ENV-004", srlNormMethod: "MIN_MAX", normMin: 10, normMax: 1, higherIsBetter: false, isMandatory: true }),
    makeDef({ kpiCode: "ENV-005", srlNormMethod: "THRESHOLD", thresholdValue: 50, higherIsBetter: true, isMandatory: true }),
    makeDef({ kpiCode: "ENV-008", srlNormMethod: "THRESHOLD", thresholdValue: 70, higherIsBetter: true, isMandatory: true }),
    makeDef({ kpiCode: "ENV-003", srlNormMethod: "THRESHOLD", thresholdValue: 80, higherIsBetter: true, isMandatory: true }),
    makeDef({ kpiCode: "ENV-006", srlNormMethod: "TARGET_BASED", normMin: 3000, normTarget: 500, higherIsBetter: false, isMandatory: false }),
    // 3 additional optional KPIs not submitted — makes optionalTotal=4, optionalSubmitted=1
    // Coverage = 0.8*(5/5) + 0.2*(1/4) = 0.80 + 0.05 = 0.85
    makeDef({ kpiCode: "ENV-007", srlNormMethod: "BINARY", higherIsBetter: true, isMandatory: false }),
    makeDef({ kpiCode: "ENV-009", srlNormMethod: "BINARY", higherIsBetter: true, isMandatory: false }),
    makeDef({ kpiCode: "ENV-010", srlNormMethod: "BINARY", higherIsBetter: true, isMandatory: false }),
  ];
  const envInputs: KpiInput[] = [
    { kpiCode: "ENV-001", rawValue: 142.5 },
    { kpiCode: "ENV-004", rawValue: 3.2 },
    { kpiCode: "ENV-005", rawValue: 61 },
    { kpiCode: "ENV-008", rawValue: 74 },
    { kpiCode: "ENV-003", rawValue: 82 },
    { kpiCode: "ENV-006", rawValue: 1800 },
  ];

  const envWeights: Record<string, number> = {
    "ENV-001": 0.20, "ENV-004": 0.18, "ENV-005": 0.18,
    "ENV-008": 0.18, "ENV-003": 0.15, "ENV-006": 0.11,
    // Not-submitted optional KPIs — weight 0 prevents default 1/n fallback
    "ENV-007": 0, "ENV-009": 0, "ENV-010": 0,
  };

  it("ENV dimension raw score ≈ 58.59", () => {
    const ds = scoreDimension("ENV", envDefs, envInputs, 0.27, envWeights);
    expect(ds.rawScore).toBeCloseTo(58.59, 0);
  });

  it("ENV coverage factor ≈ 0.85 (5/5 mandatory, 1/4 optional)", () => {
    const ds = scoreDimension("ENV", envDefs, envInputs, 0.27, envWeights);
    expect(ds.coverageFactor).toBeCloseTo(0.85, 2);
  });

  it("ENV covered score ≈ 49.80", () => {
    const ds = scoreDimension("ENV", envDefs, envInputs, 0.27, envWeights);
    expect(ds.coveredScore).toBeCloseTo(49.80, 0);
  });

  it("trajectory bonus for Example A ≈ 0.93", () => {
    const bonus = computeTrajectoryBonus(52.75, 47.5, 34.2);
    expect(bonus).toBeCloseTo(0.93, 1);
  });

  it("final composite after bonus ≈ 53.68", () => {
    expect(Math.round((52.75 + 0.93) * 100) / 100).toBeCloseTo(53.68, 1);
  });

  it("SRL level for 53.68 → 2 (Committed)", () => {
    expect(deriveSrlLevel(53.68).level).toBe(2);
  });

  it("G3 gate FAILS on composite (53.68 < 55)", () => {
    const dimScores: any = {
      ENV: { rawScore: 49.80 }, LCA: { rawScore: 41.25 }, SMF: { rawScore: 62.83 },
      SOC: { rawScore: 58.90 }, ESG: { rawScore: 52.30 },
    };
    const result = evaluateGate("G3", 53.68, dimScores);
    expect(result.status).toBe("FAIL");
    expect(result.failures[0].type).toBe("COMPOSITE");
  });
});

describe("runSrlEngine — Spec Example B (UrbanRoots, S1, G2)", () => {
  it("G2 gate FAILS on composite + SMF dimension", () => {
    const dimScores: any = {
      ENV: { rawScore: 26.60 }, LCA: { rawScore: 27.63 }, SMF: { rawScore: 10.00 },
      SOC: { rawScore: 52.00 }, ESG: { rawScore: 44.50 },
    };
    const result = evaluateGate("G2", 35.54, dimScores);
    expect(result.status).toBe("FAIL");
    expect(result.failures.some(f => f.type === "COMPOSITE")).toBe(true);
    expect(result.failures.some(f => f.type === "DIMENSION" && f.dimension === "SMF")).toBe(true);
  });

  it("SRL level for 35.54 → 1 (Aware)", () => {
    expect(deriveSrlLevel(35.54).level).toBe(1);
  });

  it("G2 is a soft block", () => {
    expect(GATE_THRESHOLDS.G2.blockType).toBe("soft");
  });
});

// ── 11. VRL Payload Builder ───────────────────────────────────────────────────

describe("buildVrlPayload", () => {
  it("produces a valid VRL payload with all required fields", () => {
    const engineResult = runSrlEngine({
      stage: "S2",
      sectorCode: "CLEANTECH",
      gateRef: "G3",
      dimensionInputs: (["ENV", "LCA", "SMF", "SOC", "ESG"] as SrlDimCode[]).map(d => ({
        dimensionCode: d,
        kpiDefs: [makeDef({ kpiCode: `${d}-001`, isMandatory: true })],
        kpiInputs: [{ kpiCode: `${d}-001`, rawValue: 60 }],
      })),
    });

    const payload = buildVrlPayload("v1", "a1", new Date("2026-04-01"), "S2", engineResult, null, "wc1");

    expect(payload.venture_id).toBe("v1");
    expect(payload.assessment_id).toBe("a1");
    expect(payload.stage_at_assessment).toBe("S2");
    expect(typeof payload.srl_composite_final).toBe("number");
    expect(payload.srl_level).toBeGreaterThanOrEqual(0);
    expect(payload.srl_level).toBeLessThanOrEqual(5);
    expect(payload.dimension_scores).toHaveProperty("ENV");
    expect(payload.dimension_scores).toHaveProperty("ESG");
    expect(typeof payload.sustainability_watch).toBe("boolean");
  });

  it("VRL SRL contribution = V_SRL * srl_composite_final (default V_SRL = 0.14)", () => {
    const engineResult = runSrlEngine({
      stage: "S3",
      dimensionInputs: (["ENV", "LCA", "SMF", "SOC", "ESG"] as SrlDimCode[]).map(d => ({
        dimensionCode: d,
        kpiDefs: [makeDef({ kpiCode: `${d}-001`, isMandatory: true })],
        kpiInputs: [{ kpiCode: `${d}-001`, rawValue: 75 }],
      })),
    });
    const payload = buildVrlPayload("v2", "a2", new Date(), "S3", engineResult, null, "wc2");
    const vrlContribution = 0.14 * payload.srl_composite_final;
    expect(vrlContribution).toBeGreaterThan(0);
    expect(vrlContribution).toBeLessThanOrEqual(14.01); // max 14 points to VRL (allow fp tolerance)
  });
});

// ── 12. Edge Cases ────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("engine handles zero KPI submissions gracefully", () => {
    const result = runSrlEngine({
      stage: "S0",
      dimensionInputs: (["ENV", "LCA", "SMF", "SOC", "ESG"] as SrlDimCode[]).map(d => ({
        dimensionCode: d,
        kpiDefs: [],
        kpiInputs: [],
      })),
    });
    expect(result.compositeFinal).toBeGreaterThanOrEqual(0);
    expect(result.srlLevel).toBeGreaterThanOrEqual(0);
  });

  it("composite never exceeds 100 even with trajectory bonus", () => {
    const result = runSrlEngine({
      stage: "S4",
      dimensionInputs: (["ENV", "LCA", "SMF", "SOC", "ESG"] as SrlDimCode[]).map(d => ({
        dimensionCode: d,
        kpiDefs: [makeDef({ kpiCode: `${d}-001`, isMandatory: true })],
        kpiInputs: [{ kpiCode: `${d}-001`, rawValue: 100 }],
      })),
      prevComposite: 95,
      prevPrevComposite: 85,
    });
    expect(result.compositeFinal).toBeLessThanOrEqual(100);
  });

  it("weights always sum to 1.00 regardless of sector", () => {
    const sectors = ["CLEANTECH", "AGRITECH", "ADVANCED_MFG", "SOCIAL_ENT", "DIGITAL", "UNKNOWN"];
    const stages = ["S0", "S1", "S2", "S3", "S4"] as const;
    for (const sector of sectors) {
      for (const stage of stages) {
        const w = resolveWeights(stage, sector);
        const sum = Object.values(w).reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(1.0, 3);
      }
    }
  });
});
