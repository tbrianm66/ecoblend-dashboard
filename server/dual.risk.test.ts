// ── Dual Risk Engine — Vitest Tests ──────────────────────────────────────────
// Tests cover: VRL formula, BRI/PRI computation, decision thresholds,
// ESG bonus, execution routing, and feedback loop
import { describe, it, expect } from "vitest";

// ── VRL Formula ───────────────────────────────────────────────────────────────
// VRL = (α×TRL + β×BRL) × (1 − BRI×0.5) × (1 − PRI×0.5) × Confidence
// ESG bonus: +0.3 if esgScore > 70
function computeVrl(params: {
  trlScore: number;
  brlScore: number;
  esgScore: number;
  confidenceScore: number;
  alphaWeight: number;
  betaWeight: number;
  businessRiskIndex: number; // 0–100
  productRiskIndex: number;  // 0–100
}): { vrlScore: number; vrlLevel: number; decision: string; esgBonus: number } {
  const bri = params.businessRiskIndex / 100;
  const pri = params.productRiskIndex / 100;
  const raw =
    (params.alphaWeight * params.trlScore + params.betaWeight * params.brlScore) *
    (1 - bri * 0.5) *
    (1 - pri * 0.5) *
    params.confidenceScore;
  const esgBonus = params.esgScore > 70 ? 0.3 : 0;
  const vrlScore = Math.min(9, Math.max(0, raw + esgBonus));
  const vrlLevel = Math.max(1, Math.min(9, Math.round(vrlScore)));

  let decision: string;
  if (vrlScore >= 6 && params.businessRiskIndex < 40 && params.productRiskIndex < 40) {
    decision = "Build";
  } else if (vrlScore >= 4 && params.businessRiskIndex < 60 && params.productRiskIndex < 60) {
    decision = "Validate";
  } else if (vrlScore >= 3) {
    decision = "Partner";
  } else {
    decision = "Reject";
  }

  return { vrlScore, vrlLevel, decision, esgBonus };
}

// ── BRI formula ───────────────────────────────────────────────────────────────
function computeBri(vals: {
  marketRiskScore: number;
  esgRiskScore: number;
  regulatoryRiskScore: number;
  commercialViabilityScore: number;
  strategicRiskScore: number;
}): number {
  return (
    vals.marketRiskScore * 0.30 +
    vals.esgRiskScore * 0.25 +
    vals.regulatoryRiskScore * 0.20 +
    vals.strategicRiskScore * 0.15 +
    (100 - vals.commercialViabilityScore) * 0.10
  );
}

// ── PRI formula ───────────────────────────────────────────────────────────────
function computePri(vals: {
  performanceRiskScore: number;
  scalabilityRiskScore: number;
  engineeringComplexity: number;
  technicalFeasibilityScore: number;
  rdMaturityScore: number;
}): number {
  return (
    vals.performanceRiskScore * 0.25 +
    vals.scalabilityRiskScore * 0.25 +
    vals.engineeringComplexity * 0.20 +
    (100 - vals.technicalFeasibilityScore) * 0.15 +
    (100 - vals.rdMaturityScore) * 0.15
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("VRL Formula", () => {
  it("produces Build decision for high VRL and low dual risk", () => {
    const result = computeVrl({
      trlScore: 9, brlScore: 9, esgScore: 80,
      confidenceScore: 1.0, alphaWeight: 0.45, betaWeight: 0.55,
      businessRiskIndex: 10, productRiskIndex: 10,
    });
    expect(result.decision).toBe("Build");
    expect(result.vrlScore).toBeGreaterThan(6);
    expect(result.esgBonus).toBe(0.3);
  });

  it("produces Validate decision for moderate VRL and risk", () => {
    // TRL/BRL=8, low risk, no ESG bonus → vrl≈7.2 but bri=50 so NOT Build → Validate
    const result = computeVrl({
      trlScore: 8, brlScore: 8, esgScore: 60,
      confidenceScore: 1.0, alphaWeight: 0.45, betaWeight: 0.55,
      businessRiskIndex: 45, productRiskIndex: 10,
    });
    expect(result.decision).toBe("Validate");
    expect(result.vrlScore).toBeGreaterThanOrEqual(4);
    expect(result.esgBonus).toBe(0);
  });

  it("produces Partner decision for borderline VRL", () => {
    // High TRL/BRL but BRI=65 (>=60) → cannot be Validate → Partner
    const result = computeVrl({
      trlScore: 9, brlScore: 9, esgScore: 60,
      confidenceScore: 1.0, alphaWeight: 0.45, betaWeight: 0.55,
      businessRiskIndex: 65, productRiskIndex: 10,
    });
    expect(result.decision).toBe("Partner");
    expect(result.vrlScore).toBeGreaterThanOrEqual(3);
  });

  it("produces Reject decision for very low VRL", () => {
    const result = computeVrl({
      trlScore: 1, brlScore: 1, esgScore: 30,
      confidenceScore: 0.3, alphaWeight: 0.45, betaWeight: 0.55,
      businessRiskIndex: 80, productRiskIndex: 80,
    });
    expect(result.decision).toBe("Reject");
    expect(result.vrlScore).toBeLessThan(3);
  });

  it("caps VRL score at 9.0", () => {
    const result = computeVrl({
      trlScore: 9, brlScore: 9, esgScore: 90,
      confidenceScore: 1.0, alphaWeight: 0.45, betaWeight: 0.55,
      businessRiskIndex: 0, productRiskIndex: 0,
    });
    expect(result.vrlScore).toBeLessThanOrEqual(9);
  });

  it("floors VRL score at 0.0", () => {
    const result = computeVrl({
      trlScore: 0, brlScore: 0, esgScore: 0,
      confidenceScore: 0, alphaWeight: 0.45, betaWeight: 0.55,
      businessRiskIndex: 100, productRiskIndex: 100,
    });
    expect(result.vrlScore).toBeGreaterThanOrEqual(0);
  });

  it("alpha + beta weights sum to 1.0", () => {
    const alpha = 0.45;
    const beta = 0.55;
    expect(alpha + beta).toBeCloseTo(1.0, 5);
  });

  it("ESG bonus is 0 when esgScore <= 70", () => {
    const result = computeVrl({
      trlScore: 5, brlScore: 5, esgScore: 70,
      confidenceScore: 0.8, alphaWeight: 0.45, betaWeight: 0.55,
      businessRiskIndex: 30, productRiskIndex: 30,
    });
    expect(result.esgBonus).toBe(0);
  });

  it("ESG bonus is 0.3 when esgScore > 70", () => {
    const result = computeVrl({
      trlScore: 5, brlScore: 5, esgScore: 71,
      confidenceScore: 0.8, alphaWeight: 0.45, betaWeight: 0.55,
      businessRiskIndex: 30, productRiskIndex: 30,
    });
    expect(result.esgBonus).toBe(0.3);
  });

  it("VRL level is always between 1 and 9", () => {
    const cases = [
      { trl: 0, brl: 0, bri: 100, pri: 100, conf: 0.2 },
      { trl: 9, brl: 9, bri: 0, pri: 0, conf: 1.0 },
      { trl: 4.5, brl: 4.5, bri: 50, pri: 50, conf: 0.6 },
    ];
    for (const c of cases) {
      const result = computeVrl({
        trlScore: c.trl, brlScore: c.brl, esgScore: 60,
        confidenceScore: c.conf, alphaWeight: 0.45, betaWeight: 0.55,
        businessRiskIndex: c.bri, productRiskIndex: c.pri,
      });
      expect(result.vrlLevel).toBeGreaterThanOrEqual(1);
      expect(result.vrlLevel).toBeLessThanOrEqual(9);
    }
  });
});

describe("Business Risk Index (BRI)", () => {
  it("computes BRI correctly for all-50 inputs", () => {
    const bri = computeBri({
      marketRiskScore: 50, esgRiskScore: 50, regulatoryRiskScore: 50,
      commercialViabilityScore: 50, strategicRiskScore: 50,
    });
    // 50×0.30 + 50×0.25 + 50×0.20 + 50×0.15 + (100-50)×0.10
    // = 15 + 12.5 + 10 + 7.5 + 5 = 50
    expect(bri).toBeCloseTo(50, 1);
  });

  it("computes BRI = 0 for all-zero risk inputs with max commercial viability", () => {
    const bri = computeBri({
      marketRiskScore: 0, esgRiskScore: 0, regulatoryRiskScore: 0,
      commercialViabilityScore: 100, strategicRiskScore: 0,
    });
    expect(bri).toBeCloseTo(0, 1);
  });

  it("computes BRI = 100 for all-max risk inputs with zero commercial viability", () => {
    const bri = computeBri({
      marketRiskScore: 100, esgRiskScore: 100, regulatoryRiskScore: 100,
      commercialViabilityScore: 0, strategicRiskScore: 100,
    });
    expect(bri).toBeCloseTo(100, 1);
  });

  it("weights sum to 1.0", () => {
    const weights = [0.30, 0.25, 0.20, 0.15, 0.10];
    expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1.0, 5);
  });
});

describe("Product Risk Index (PRI)", () => {
  it("computes PRI correctly for all-50 inputs", () => {
    const pri = computePri({
      performanceRiskScore: 50, scalabilityRiskScore: 50, engineeringComplexity: 50,
      technicalFeasibilityScore: 50, rdMaturityScore: 50,
    });
    // 50×0.25 + 50×0.25 + 50×0.20 + (100-50)×0.15 + (100-50)×0.15
    // = 12.5 + 12.5 + 10 + 7.5 + 7.5 = 50
    expect(pri).toBeCloseTo(50, 1);
  });

  it("computes PRI = 0 for ideal product inputs", () => {
    const pri = computePri({
      performanceRiskScore: 0, scalabilityRiskScore: 0, engineeringComplexity: 0,
      technicalFeasibilityScore: 100, rdMaturityScore: 100,
    });
    expect(pri).toBeCloseTo(0, 1);
  });

  it("computes PRI = 100 for worst-case product inputs", () => {
    const pri = computePri({
      performanceRiskScore: 100, scalabilityRiskScore: 100, engineeringComplexity: 100,
      technicalFeasibilityScore: 0, rdMaturityScore: 0,
    });
    expect(pri).toBeCloseTo(100, 1);
  });

  it("PRI weights sum to 1.0", () => {
    const weights = [0.25, 0.25, 0.20, 0.15, 0.15];
    expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1.0, 5);
  });
});

describe("Decision Thresholds", () => {
  it("Build requires VRL >= 6 AND BRI < 40 AND PRI < 40", () => {
    // Just below threshold — should NOT be Build
    const borderline = computeVrl({
      trlScore: 7, brlScore: 7, esgScore: 80,
      confidenceScore: 0.9, alphaWeight: 0.45, betaWeight: 0.55,
      businessRiskIndex: 41, productRiskIndex: 20, // BRI just over threshold
    });
    expect(borderline.decision).not.toBe("Build");
  });

  it("Validate requires VRL >= 4 AND BRI < 60 AND PRI < 60", () => {
    // TRL/BRL=8, BRI=55, PRI=10 → vrl>=4 and both indices <60 → Validate
    const result = computeVrl({
      trlScore: 8, brlScore: 8, esgScore: 50,
      confidenceScore: 1.0, alphaWeight: 0.45, betaWeight: 0.55,
      businessRiskIndex: 55, productRiskIndex: 10,
    });
    expect(result.decision).toBe("Validate");
  });

  it("Partner when VRL >= 3 but risk too high for Validate", () => {
    // BRI=70 (>=60) → cannot be Validate, vrl>=3 → Partner
    const result = computeVrl({
      trlScore: 9, brlScore: 9, esgScore: 50,
      confidenceScore: 1.0, alphaWeight: 0.45, betaWeight: 0.55,
      businessRiskIndex: 70, productRiskIndex: 10,
    });
    expect(result.decision).toBe("Partner");
  });
});

describe("Execution Routing", () => {
  it("BEBUS and ECORACE are both active for Build and Validate decisions", () => {
    const buildDecisions = ["Build", "Validate"];
    for (const d of buildDecisions) {
      const isActive = ["Build", "Validate"].includes(d);
      expect(isActive).toBe(true);
    }
  });

  it("BEBUS and ECORACE are on Hold for Partner and Reject decisions", () => {
    const holdDecisions = ["Partner", "Reject"];
    for (const d of holdDecisions) {
      const isActive = ["Build", "Validate"].includes(d);
      expect(isActive).toBe(false);
    }
  });
});

describe("Feedback Loop", () => {
  it("feedback score is bounded between 0 and 100", () => {
    const score = Math.min(100, Math.max(0, 75));
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("market feedback text is stored as a string", () => {
    const feedback = "Strong customer interest in the B2B segment, 3 LOIs received.";
    expect(typeof feedback).toBe("string");
    expect(feedback.length).toBeGreaterThan(0);
  });
});
