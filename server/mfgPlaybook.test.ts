// ── China Manufacturing Playbook — Vitest Tests ───────────────────────────────
// Tests cover: phase progression logic, cost modelling, supplier risk scoring,
// QC pass-rate calculation, logistics cost aggregation, and IP protection status
import { describe, it, expect } from "vitest";

// ── Phase Progression ─────────────────────────────────────────────────────────
type Phase = "uk_prototype" | "china_feasibility" | "pilot_production" | "scale_manufacturing";

const PHASE_ORDER: Phase[] = [
  "uk_prototype",
  "china_feasibility",
  "pilot_production",
  "scale_manufacturing",
];

function advancePhase(current: Phase): { nextPhase: Phase | null; doneFlag: string } {
  const idx = PHASE_ORDER.indexOf(current);
  if (idx === -1) return { nextPhase: null, doneFlag: "" };
  const doneFlagMap: Record<Phase, string> = {
    uk_prototype: "ukPrototypeDone",
    china_feasibility: "chinaFeasibilityDone",
    pilot_production: "pilotProductionDone",
    scale_manufacturing: "scaleManufacturingDone",
  };
  const nextPhase = idx < PHASE_ORDER.length - 1 ? PHASE_ORDER[idx + 1] : null;
  return { nextPhase, doneFlag: doneFlagMap[current] };
}

describe("Phase Progression", () => {
  it("advances from uk_prototype to china_feasibility", () => {
    const { nextPhase, doneFlag } = advancePhase("uk_prototype");
    expect(nextPhase).toBe("china_feasibility");
    expect(doneFlag).toBe("ukPrototypeDone");
  });

  it("advances from china_feasibility to pilot_production", () => {
    const { nextPhase, doneFlag } = advancePhase("china_feasibility");
    expect(nextPhase).toBe("pilot_production");
    expect(doneFlag).toBe("chinaFeasibilityDone");
  });

  it("advances from pilot_production to scale_manufacturing", () => {
    const { nextPhase, doneFlag } = advancePhase("pilot_production");
    expect(nextPhase).toBe("scale_manufacturing");
    expect(doneFlag).toBe("pilotProductionDone");
  });

  it("returns null nextPhase when already at scale_manufacturing", () => {
    const { nextPhase, doneFlag } = advancePhase("scale_manufacturing");
    expect(nextPhase).toBeNull();
    expect(doneFlag).toBe("scaleManufacturingDone");
  });

  it("returns null for unknown phase", () => {
    const { nextPhase } = advancePhase("unknown" as Phase);
    expect(nextPhase).toBeNull();
  });
});

// ── Unit Cost Calculation ─────────────────────────────────────────────────────
function computeUnitCost(params: {
  materialCostGbp: number;
  labourCostGbp: number;
  overheadCostGbp: number;
  logisticsCostGbp: number;
}): number {
  return params.materialCostGbp + params.labourCostGbp + params.overheadCostGbp + params.logisticsCostGbp;
}

function computeSellingPrice(unitCost: number, marginPercent: number): number {
  return unitCost * (1 + marginPercent / 100);
}

function computeGrossProfit(revenue: number, cogs: number): number {
  return revenue - cogs;
}

describe("Cost Modelling", () => {
  it("computes unit cost as sum of all cost components", () => {
    const cost = computeUnitCost({ materialCostGbp: 10, labourCostGbp: 5, overheadCostGbp: 3, logisticsCostGbp: 2 });
    expect(cost).toBe(20);
  });

  it("computes selling price with 30% margin", () => {
    const price = computeSellingPrice(20, 30);
    expect(price).toBeCloseTo(26, 2);
  });

  it("computes selling price with 50% margin", () => {
    const price = computeSellingPrice(100, 50);
    expect(price).toBe(150);
  });

  it("computes gross profit correctly", () => {
    const profit = computeGrossProfit(26, 20);
    expect(profit).toBeCloseTo(6, 2);
  });

  it("handles zero cost components", () => {
    const cost = computeUnitCost({ materialCostGbp: 0, labourCostGbp: 0, overheadCostGbp: 0, logisticsCostGbp: 0 });
    expect(cost).toBe(0);
  });

  it("handles high-volume cost scaling", () => {
    const unitCost = computeUnitCost({ materialCostGbp: 5, labourCostGbp: 2, overheadCostGbp: 1, logisticsCostGbp: 0.5 });
    const totalCost1000 = unitCost * 1000;
    expect(totalCost1000).toBe(8500);
  });
});

// ── Supplier Risk Scoring ─────────────────────────────────────────────────────
type NnnStatus = "none" | "sent" | "signed";
type ContractStatus = "none" | "draft" | "signed";
type ToolingStatus = "none" | "partial" | "full";

function computeSupplierIpRisk(params: {
  nnnAgreement: NnnStatus;
  manufacturingContract: ContractStatus;
  toolingOwnership: ToolingStatus;
  isDualSource: boolean;
  blackBoxComponents: boolean;
  riskScore: number;
}): { ipRiskLevel: "low" | "medium" | "high"; ipScore: number } {
  let ipScore = 100;

  // NNN agreement deductions
  if (params.nnnAgreement === "none") ipScore -= 30;
  else if (params.nnnAgreement === "sent") ipScore -= 10;

  // Manufacturing contract deductions
  if (params.manufacturingContract === "none") ipScore -= 25;
  else if (params.manufacturingContract === "draft") ipScore -= 10;

  // Tooling ownership deductions
  if (params.toolingOwnership === "none") ipScore -= 20;
  else if (params.toolingOwnership === "partial") ipScore -= 8;

  // Bonuses
  if (params.isDualSource) ipScore += 5;
  if (params.blackBoxComponents) ipScore += 10;

  // Incorporate supplier risk score
  ipScore -= (params.riskScore / 100) * 20;

  ipScore = Math.max(0, Math.min(100, ipScore));

  const ipRiskLevel: "low" | "medium" | "high" =
    ipScore >= 70 ? "low" : ipScore >= 40 ? "medium" : "high";

  return { ipRiskLevel, ipScore };
}

describe("Supplier IP Risk Scoring", () => {
  it("returns low risk for fully protected supplier", () => {
    const { ipRiskLevel, ipScore } = computeSupplierIpRisk({
      nnnAgreement: "signed",
      manufacturingContract: "signed",
      toolingOwnership: "full",
      isDualSource: true,
      blackBoxComponents: true,
      riskScore: 10,
    });
    expect(ipRiskLevel).toBe("low");
    expect(ipScore).toBeGreaterThanOrEqual(70);
  });

  it("returns high risk for unprotected supplier", () => {
    const { ipRiskLevel, ipScore } = computeSupplierIpRisk({
      nnnAgreement: "none",
      manufacturingContract: "none",
      toolingOwnership: "none",
      isDualSource: false,
      blackBoxComponents: false,
      riskScore: 90,
    });
    expect(ipRiskLevel).toBe("high");
    expect(ipScore).toBeLessThan(40);
  });

  it("returns medium risk for partially protected supplier", () => {
    // NNN none (-30), contract draft (-10), tooling partial (-8), risk 80 (-16) = 36 → high
    // Use NNN sent (-10), contract none (-25), tooling none (-20), risk 50 (-10) = 35 → high
    // Use NNN none (-30), contract draft (-10), tooling partial (-8), risk 50 (-10) = 42 → medium
    const { ipRiskLevel } = computeSupplierIpRisk({
      nnnAgreement: "none",
      manufacturingContract: "draft",
      toolingOwnership: "partial",
      isDualSource: false,
      blackBoxComponents: false,
      riskScore: 50,
    });
    expect(ipRiskLevel).toBe("medium");
  });

  it("NNN signed gives better score than NNN sent", () => {
    const signedResult = computeSupplierIpRisk({
      nnnAgreement: "signed",
      manufacturingContract: "none",
      toolingOwnership: "none",
      isDualSource: false,
      blackBoxComponents: false,
      riskScore: 50,
    });
    const sentResult = computeSupplierIpRisk({
      nnnAgreement: "sent",
      manufacturingContract: "none",
      toolingOwnership: "none",
      isDualSource: false,
      blackBoxComponents: false,
      riskScore: 50,
    });
    expect(signedResult.ipScore).toBeGreaterThan(sentResult.ipScore);
  });
});

// ── QC Pass Rate Calculation ──────────────────────────────────────────────────
function computeQcPassRate(reports: Array<{ result: string }>): number {
  if (reports.length === 0) return 0;
  const passed = reports.filter(r => r.result === "pass").length;
  return Math.round((passed / reports.length) * 100);
}

describe("QC Pass Rate", () => {
  it("returns 0 for empty reports", () => {
    expect(computeQcPassRate([])).toBe(0);
  });

  it("returns 100 for all passing reports", () => {
    const reports = [{ result: "pass" }, { result: "pass" }, { result: "pass" }];
    expect(computeQcPassRate(reports)).toBe(100);
  });

  it("returns 0 for all failing reports", () => {
    const reports = [{ result: "fail" }, { result: "fail" }];
    expect(computeQcPassRate(reports)).toBe(0);
  });

  it("computes 67% pass rate for 2 of 3 passing", () => {
    const reports = [{ result: "pass" }, { result: "pass" }, { result: "fail" }];
    expect(computeQcPassRate(reports)).toBe(67);
  });

  it("excludes conditional_pass from pass count", () => {
    const reports = [{ result: "pass" }, { result: "conditional_pass" }, { result: "fail" }];
    expect(computeQcPassRate(reports)).toBe(33);
  });
});

// ── Logistics Cost Aggregation ────────────────────────────────────────────────
function computeTotalLogisticsCost(shipments: Array<{
  freightCostGbp?: number | null;
  dutiesGbp?: number | null;
  insuranceGbp?: number | null;
}>): number {
  return shipments.reduce((sum, s) => {
    return sum + (s.freightCostGbp ?? 0) + (s.dutiesGbp ?? 0) + (s.insuranceGbp ?? 0);
  }, 0);
}

describe("Logistics Cost Aggregation", () => {
  it("returns 0 for empty shipments", () => {
    expect(computeTotalLogisticsCost([])).toBe(0);
  });

  it("sums all cost components across shipments", () => {
    const shipments = [
      { freightCostGbp: 1000, dutiesGbp: 200, insuranceGbp: 50 },
      { freightCostGbp: 800, dutiesGbp: 150, insuranceGbp: 30 },
    ];
    expect(computeTotalLogisticsCost(shipments)).toBe(2230);
  });

  it("handles null/undefined cost fields", () => {
    const shipments = [
      { freightCostGbp: 500, dutiesGbp: null, insuranceGbp: undefined },
    ];
    expect(computeTotalLogisticsCost(shipments)).toBe(500);
  });

  it("handles single shipment with all costs", () => {
    const shipments = [{ freightCostGbp: 1200, dutiesGbp: 300, insuranceGbp: 75 }];
    expect(computeTotalLogisticsCost(shipments)).toBe(1575);
  });
});

// ── Active Shipments Count ────────────────────────────────────────────────────
const ACTIVE_STATUSES = ["booked", "in_transit", "customs"];

function countActiveShipments(shipments: Array<{ status?: string | null }>): number {
  return shipments.filter(s => ACTIVE_STATUSES.includes(s.status ?? "")).length;
}

describe("Active Shipments Count", () => {
  it("counts booked, in_transit, and customs as active", () => {
    const shipments = [
      { status: "booked" },
      { status: "in_transit" },
      { status: "customs" },
      { status: "delivered" },
      { status: "planned" },
      { status: "delayed" },
    ];
    expect(countActiveShipments(shipments)).toBe(3);
  });

  it("returns 0 when no active shipments", () => {
    const shipments = [{ status: "delivered" }, { status: "planned" }];
    expect(countActiveShipments(shipments)).toBe(0);
  });

  it("handles null status", () => {
    const shipments = [{ status: null }, { status: "in_transit" }];
    expect(countActiveShipments(shipments)).toBe(1);
  });
});

// ── Phase Breakdown Summary ───────────────────────────────────────────────────
function computePhaseBreakdown(projects: Array<{ phase: string }>): Record<string, number> {
  return projects.reduce((acc, p) => {
    acc[p.phase] = (acc[p.phase] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

describe("Phase Breakdown Summary", () => {
  it("groups projects by phase", () => {
    const projects = [
      { phase: "uk_prototype" },
      { phase: "uk_prototype" },
      { phase: "china_feasibility" },
      { phase: "scale_manufacturing" },
    ];
    const breakdown = computePhaseBreakdown(projects);
    expect(breakdown.uk_prototype).toBe(2);
    expect(breakdown.china_feasibility).toBe(1);
    expect(breakdown.scale_manufacturing).toBe(1);
    expect(breakdown.pilot_production).toBeUndefined();
  });

  it("returns empty object for no projects", () => {
    expect(computePhaseBreakdown([])).toEqual({});
  });
});

// ── TRL Progression ───────────────────────────────────────────────────────────
function trlProgressPercent(trlLevel: number): number {
  return Math.round((Math.max(1, Math.min(9, trlLevel)) / 9) * 100);
}

describe("TRL Progression", () => {
  it("returns ~11% for TRL 1", () => {
    expect(trlProgressPercent(1)).toBe(11);
  });

  it("returns 100% for TRL 9", () => {
    expect(trlProgressPercent(9)).toBe(100);
  });

  it("returns ~56% for TRL 5", () => {
    expect(trlProgressPercent(5)).toBe(56);
  });

  it("clamps values below 1 to TRL 1", () => {
    expect(trlProgressPercent(0)).toBe(11);
  });

  it("clamps values above 9 to TRL 9", () => {
    expect(trlProgressPercent(10)).toBe(100);
  });
});
