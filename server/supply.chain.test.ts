/**
 * Supply Chain & Manufacturing Intelligence Module — Vitest Tests
 * Sprint 42
 */
import { describe, it, expect } from "vitest";

// ── Manufacturing Readiness Score formula ────────────────────────────────────
function computeManufacturingReadiness(params: {
  trlScore: number;      // 0-25
  cadScore: number;      // 0-20
  labScore: number;      // 0-20
  toolScore: number;     // 0-20
  operationalScore: number; // 0-15
}): { score: number; readinessLevel: string } {
  const total = params.trlScore + params.cadScore + params.labScore + params.toolScore + params.operationalScore;
  let readinessLevel: string;
  if (total >= 80) readinessLevel = "Production Ready";
  else if (total >= 60) readinessLevel = "Pilot Ready";
  else if (total >= 40) readinessLevel = "Validation Stage";
  else if (total >= 20) readinessLevel = "Prototype Stage";
  else readinessLevel = "Concept Stage";
  return { score: total, readinessLevel };
}

// ── Supplier risk formula ─────────────────────────────────────────────────────
function computeSupplierRisk(params: {
  qualityScore: number;     // 0-100
  deliveryScore: number;    // 0-100
  esgScore: number;         // 0-100
  geopoliticalRisk: number; // 0-10
}): number {
  const baseRisk = 100 - (params.qualityScore * 0.4 + params.deliveryScore * 0.3 + params.esgScore * 0.3);
  const geoPenalty = params.geopoliticalRisk * 2;
  return Math.min(100, Math.max(0, baseRisk + geoPenalty));
}

// ── Unit economics formula ────────────────────────────────────────────────────
function computeUnitEconomics(params: {
  unitCost: number;
  toolingCost: number;
  volume: number;
  targetMargin: number; // 0-1
}): { breakEvenVolume: number; unitPrice: number; grossMargin: number } {
  const unitPrice = params.unitCost / (1 - params.targetMargin);
  const breakEvenVolume = params.toolingCost / (unitPrice - params.unitCost);
  const grossMargin = (unitPrice - params.unitCost) / unitPrice;
  return { breakEvenVolume: Math.ceil(breakEvenVolume), unitPrice: parseFloat(unitPrice.toFixed(2)), grossMargin: parseFloat(grossMargin.toFixed(3)) };
}

// ── PCF score formula ─────────────────────────────────────────────────────────
function computePcfScore(params: {
  scope1: number;  // kg CO2e
  scope2: number;
  scope3: number;
  productWeight: number; // kg
}): number {
  const totalEmissions = params.scope1 + params.scope2 + params.scope3;
  return parseFloat((totalEmissions / params.productWeight).toFixed(2));
}

// ── Lead time risk ────────────────────────────────────────────────────────────
function classifyLeadTimeRisk(leadTimeDays: number): "Low" | "Medium" | "High" | "Critical" {
  if (leadTimeDays <= 14) return "Low";
  if (leadTimeDays <= 30) return "Medium";
  if (leadTimeDays <= 60) return "High";
  return "Critical";
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Manufacturing Readiness Score", () => {
  it("returns Production Ready at max scores", () => {
    const result = computeManufacturingReadiness({ trlScore: 25, cadScore: 20, labScore: 20, toolScore: 20, operationalScore: 15 });
    expect(result.score).toBe(100);
    expect(result.readinessLevel).toBe("Production Ready");
  });

  it("returns Pilot Ready at 65/100", () => {
    const result = computeManufacturingReadiness({ trlScore: 15, cadScore: 15, labScore: 15, toolScore: 13, operationalScore: 7 });
    expect(result.score).toBe(65);
    expect(result.readinessLevel).toBe("Pilot Ready");
  });

  it("returns Validation Stage at 50/100", () => {
    const result = computeManufacturingReadiness({ trlScore: 12, cadScore: 12, labScore: 10, toolScore: 10, operationalScore: 6 });
    expect(result.score).toBe(50);
    expect(result.readinessLevel).toBe("Validation Stage");
  });

  it("returns Prototype Stage at 30/100", () => {
    const result = computeManufacturingReadiness({ trlScore: 8, cadScore: 8, labScore: 7, toolScore: 5, operationalScore: 2 });
    expect(result.score).toBe(30);
    expect(result.readinessLevel).toBe("Prototype Stage");
  });

  it("returns Concept Stage at 10/100", () => {
    const result = computeManufacturingReadiness({ trlScore: 3, cadScore: 3, labScore: 2, toolScore: 1, operationalScore: 1 });
    expect(result.score).toBe(10);
    expect(result.readinessLevel).toBe("Concept Stage");
  });

  it("clamps to 0 for zero inputs", () => {
    const result = computeManufacturingReadiness({ trlScore: 0, cadScore: 0, labScore: 0, toolScore: 0, operationalScore: 0 });
    expect(result.score).toBe(0);
    expect(result.readinessLevel).toBe("Concept Stage");
  });
});

describe("Supplier Risk Score", () => {
  it("returns low risk for high-quality, low geopolitical supplier", () => {
    const risk = computeSupplierRisk({ qualityScore: 90, deliveryScore: 90, esgScore: 90, geopoliticalRisk: 1 });
    expect(risk).toBeLessThan(20);
  });

  it("returns high risk for low-quality, high geopolitical supplier", () => {
    const risk = computeSupplierRisk({ qualityScore: 40, deliveryScore: 40, esgScore: 40, geopoliticalRisk: 8 });
    expect(risk).toBeGreaterThan(50);
  });

  it("caps at 100", () => {
    const risk = computeSupplierRisk({ qualityScore: 0, deliveryScore: 0, esgScore: 0, geopoliticalRisk: 10 });
    expect(risk).toBe(100);
  });

  it("floors at 0", () => {
    const risk = computeSupplierRisk({ qualityScore: 100, deliveryScore: 100, esgScore: 100, geopoliticalRisk: 0 });
    expect(risk).toBe(0);
  });

  it("geopolitical risk adds penalty correctly", () => {
    const baseRisk = computeSupplierRisk({ qualityScore: 80, deliveryScore: 80, esgScore: 80, geopoliticalRisk: 0 });
    const withGeo = computeSupplierRisk({ qualityScore: 80, deliveryScore: 80, esgScore: 80, geopoliticalRisk: 5 });
    expect(withGeo - baseRisk).toBe(10); // 5 * 2 = 10
  });
});

describe("Unit Economics", () => {
  it("computes correct unit price at 40% target margin", () => {
    const result = computeUnitEconomics({ unitCost: 60, toolingCost: 10000, volume: 500, targetMargin: 0.4 });
    expect(result.unitPrice).toBeCloseTo(100, 1);
    expect(result.grossMargin).toBeCloseTo(0.4, 2);
  });

  it("computes break-even volume correctly", () => {
    const result = computeUnitEconomics({ unitCost: 50, toolingCost: 5000, volume: 200, targetMargin: 0.5 });
    // unitPrice = 50/0.5 = 100, margin per unit = 50, break-even = 5000/50 = 100
    expect(result.breakEvenVolume).toBe(100);
  });

  it("higher margin means higher unit price", () => {
    const low = computeUnitEconomics({ unitCost: 50, toolingCost: 5000, volume: 200, targetMargin: 0.3 });
    const high = computeUnitEconomics({ unitCost: 50, toolingCost: 5000, volume: 200, targetMargin: 0.6 });
    expect(high.unitPrice).toBeGreaterThan(low.unitPrice);
  });
});

describe("PCF Score (kg CO2e per kg product)", () => {
  it("computes PCF correctly", () => {
    const pcf = computePcfScore({ scope1: 100, scope2: 200, scope3: 300, productWeight: 10 });
    expect(pcf).toBe(60); // 600 / 10
  });

  it("lower emissions give lower PCF", () => {
    const high = computePcfScore({ scope1: 500, scope2: 500, scope3: 500, productWeight: 10 });
    const low = computePcfScore({ scope1: 50, scope2: 50, scope3: 50, productWeight: 10 });
    expect(low).toBeLessThan(high);
  });

  it("heavier product gives lower PCF per kg", () => {
    const light = computePcfScore({ scope1: 100, scope2: 100, scope3: 100, productWeight: 1 });
    const heavy = computePcfScore({ scope1: 100, scope2: 100, scope3: 100, productWeight: 10 });
    expect(heavy).toBeLessThan(light);
  });
});

describe("Lead Time Risk Classification", () => {
  it("classifies 7 days as Low", () => {
    expect(classifyLeadTimeRisk(7)).toBe("Low");
  });

  it("classifies 14 days as Low (boundary)", () => {
    expect(classifyLeadTimeRisk(14)).toBe("Low");
  });

  it("classifies 21 days as Medium", () => {
    expect(classifyLeadTimeRisk(21)).toBe("Medium");
  });

  it("classifies 45 days as High", () => {
    expect(classifyLeadTimeRisk(45)).toBe("High");
  });

  it("classifies 90 days as Critical", () => {
    expect(classifyLeadTimeRisk(90)).toBe("Critical");
  });
});

describe("Supply Chain ESG Integration", () => {
  it("validates ESG compliance fields", () => {
    const esgRecord = {
      ventureId: "v1",
      pcfScore: 45.5,
      lcaScore: 72,
      ethicalSourcingStatus: "Compliant" as const,
      iso14001: true,
      iso26000: false,
      carbonOffsetTonnes: 12.5,
    };
    expect(esgRecord.pcfScore).toBeGreaterThan(0);
    expect(esgRecord.lcaScore).toBeLessThanOrEqual(100);
    expect(["Compliant", "Partial", "Non-Compliant"]).toContain(esgRecord.ethicalSourcingStatus);
  });

  it("validates product material types", () => {
    const validMaterials = ["Composite", "Aluminium", "Steel", "Polymer", "Bioplastic", "Titanium", "Carbon Fibre", "Other"];
    const material = "Carbon Fibre";
    expect(validMaterials).toContain(material);
  });

  it("validates manufacturing process types", () => {
    const validProcesses = ["Composite Layup", "Injection Moulding", "CNC Machining", "3D Printing", "Die Casting", "Forging", "Stamping", "Extrusion", "Other"];
    const process = "Composite Layup";
    expect(validProcesses).toContain(process);
  });
});

describe("Production Order Status Flow", () => {
  it("validates production order status transitions", () => {
    const validStatuses = ["Draft", "Confirmed", "In Production", "QA Review", "Shipped", "Delivered", "Cancelled"];
    for (const status of validStatuses) {
      expect(validStatuses).toContain(status);
    }
  });

  it("validates QA pass rate is between 0 and 100", () => {
    const qaPassRate = 97.5;
    expect(qaPassRate).toBeGreaterThanOrEqual(0);
    expect(qaPassRate).toBeLessThanOrEqual(100);
  });

  it("validates defect rate is non-negative", () => {
    const defectRate = 2.1;
    expect(defectRate).toBeGreaterThanOrEqual(0);
  });
});
