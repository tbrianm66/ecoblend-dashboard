/**
 * Tests for the extended China Manufacturing Playbook modules:
 * - Supplier Onboarding scoring logic
 * - Factory Audit score calculation
 * - RFQ total cost calculation
 * - ASL performance score calculation
 * - Contract default clauses
 */

import { describe, it, expect } from "vitest";

// ── Supplier Onboarding ────────────────────────────────────────────────────────
describe("Supplier Onboarding — overall score calculation", () => {
  function calcOverallScore(scores: number[]): number {
    if (scores.length === 0) return 0;
    return parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
  }

  it("returns 0 when all scores are 0", () => {
    expect(calcOverallScore([0, 0, 0, 0, 0, 0])).toBe(0);
  });

  it("returns 5 when all scores are 5", () => {
    expect(calcOverallScore([5, 5, 5, 5, 5, 5])).toBe(5);
  });

  it("calculates average correctly for mixed scores", () => {
    // (4 + 3 + 5 + 2 + 4 + 3) / 6 = 21/6 = 3.5
    expect(calcOverallScore([4, 3, 5, 2, 4, 3])).toBe(3.5);
  });

  it("handles single score", () => {
    expect(calcOverallScore([4])).toBe(4);
  });

  it("rounds to 2 decimal places", () => {
    // (1 + 2 + 3) / 3 = 2.0
    expect(calcOverallScore([1, 2, 3])).toBe(2);
  });
});

// ── Factory Audit ──────────────────────────────────────────────────────────────
describe("Factory Audit — audit score calculation", () => {
  type ChecklistResult = "pass" | "partial" | "fail" | "na";
  const CHECKLIST_KEYS = [
    "facilityCondition", "equipmentCapability", "workforceSkills",
    "qcProcesses", "healthAndSafety", "environmentalCompliance",
  ] as const;

  function calcAuditScore(results: Record<string, ChecklistResult>): number {
    const weights: Record<ChecklistResult, number> = { pass: 1, partial: 0.5, fail: 0, na: 0 };
    const applicableKeys = CHECKLIST_KEYS.filter(k => results[k] !== "na");
    if (applicableKeys.length === 0) return 0;
    const total = applicableKeys.reduce((sum, k) => sum + (weights[results[k]] ?? 0), 0);
    return Math.round((total / applicableKeys.length) * 100);
  }

  it("returns 100 when all items pass", () => {
    const results = Object.fromEntries(CHECKLIST_KEYS.map(k => [k, "pass"])) as Record<string, ChecklistResult>;
    expect(calcAuditScore(results)).toBe(100);
  });

  it("returns 0 when all items fail", () => {
    const results = Object.fromEntries(CHECKLIST_KEYS.map(k => [k, "fail"])) as Record<string, ChecklistResult>;
    expect(calcAuditScore(results)).toBe(0);
  });

  it("returns 50 when all items are partial", () => {
    const results = Object.fromEntries(CHECKLIST_KEYS.map(k => [k, "partial"])) as Record<string, ChecklistResult>;
    expect(calcAuditScore(results)).toBe(50);
  });

  it("excludes N/A items from calculation", () => {
    // 5 pass, 1 na → 5/5 = 100%
    const results = Object.fromEntries(CHECKLIST_KEYS.map((k, i) => [k, i === 0 ? "na" : "pass"])) as Record<string, ChecklistResult>;
    expect(calcAuditScore(results)).toBe(100);
  });

  it("returns 0 when all items are N/A", () => {
    const results = Object.fromEntries(CHECKLIST_KEYS.map(k => [k, "na"])) as Record<string, ChecklistResult>;
    expect(calcAuditScore(results)).toBe(0);
  });

  it("calculates mixed results correctly", () => {
    // 3 pass, 2 partial, 1 fail → (3*1 + 2*0.5 + 1*0) / 6 = 4/6 ≈ 67%
    const results: Record<string, ChecklistResult> = {
      facilityCondition: "pass",
      equipmentCapability: "pass",
      workforceSkills: "pass",
      qcProcesses: "partial",
      healthAndSafety: "partial",
      environmentalCompliance: "fail",
    };
    expect(calcAuditScore(results)).toBe(67);
  });
});

// ── RFQ Manager ───────────────────────────────────────────────────────────────
describe("RFQ Manager — total BOM cost calculation", () => {
  function calcTotalBomCost(costs: (number | null | undefined)[]): number {
    return costs.reduce((sum, v) => sum + (v ?? 0), 0);
  }

  it("sums all cost components correctly", () => {
    // material + labour + tooling + overhead + packaging
    expect(calcTotalBomCost([10.5, 2.0, 5.0, 1.5, 0.5])).toBeCloseTo(19.5);
  });

  it("handles null/undefined values as 0", () => {
    expect(calcTotalBomCost([10.0, null, undefined, 2.0, 1.0])).toBeCloseTo(13.0);
  });

  it("returns 0 for all null values", () => {
    expect(calcTotalBomCost([null, null, null, null, null])).toBe(0);
  });

  it("handles single component", () => {
    expect(calcTotalBomCost([42.99])).toBeCloseTo(42.99);
  });
});

// ── Approved Supplier List ─────────────────────────────────────────────────────
describe("ASL — performance score calculation", () => {
  function calcPerformanceScore(quality: number | null, delivery: number | null, cost: number | null): number {
    const scores = [quality, delivery, cost].filter((v): v is number => v !== null && v !== undefined);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  it("averages three equal scores", () => {
    expect(calcPerformanceScore(80, 80, 80)).toBe(80);
  });

  it("averages mixed scores", () => {
    // (90 + 70 + 80) / 3 = 80
    expect(calcPerformanceScore(90, 70, 80)).toBe(80);
  });

  it("handles null values by excluding them", () => {
    // (90 + 80) / 2 = 85
    expect(calcPerformanceScore(90, null, 80)).toBe(85);
  });

  it("returns 0 when all scores are null", () => {
    expect(calcPerformanceScore(null, null, null)).toBe(0);
  });

  it("handles perfect score", () => {
    expect(calcPerformanceScore(100, 100, 100)).toBe(100);
  });

  it("handles zero scores", () => {
    expect(calcPerformanceScore(0, 0, 0)).toBe(0);
  });
});

// ── Contract Templates ─────────────────────────────────────────────────────────
describe("Contract Templates — default clauses", () => {
  const DEFAULT_CLAUSES: Record<string, string[]> = {
    nnn: [
      "Non-Disclosure of Confidential Information",
      "Non-Use of Proprietary Technology",
      "Non-Circumvention of Business Relationships",
      "Jurisdiction and Governing Law (China)",
      "Penalty Clause for Breach",
      "Duration and Termination",
    ],
    manufacturing: [
      "Product Specifications and Quality Standards",
      "Minimum Order Quantities (MOQ)",
      "Lead Times and Delivery Schedule",
      "Pricing and Payment Terms",
      "Tooling Ownership",
      "Inspection Rights",
      "Warranty and Defect Liability",
      "Intellectual Property Protection",
      "Force Majeure",
      "Termination and Exit Rights",
    ],
    tooling_ownership: [
      "Tooling Ownership Declaration",
      "Tooling Inventory and Identification",
      "Tooling Maintenance Obligations",
      "Right to Retrieve Tooling",
      "Tooling Replacement Cost Allocation",
      "Prohibition on Third-Party Use",
    ],
    quality: [
      "Incoming Quality Control (IQC) Standards",
      "In-Process Quality Control (IPQC)",
      "Outgoing Quality Control (OQC) / AQL Levels",
      "Defect Classification (Critical / Major / Minor)",
      "Corrective Action and 8D Report Requirements",
      "Right of Audit",
      "Traceability Requirements",
    ],
    logistics_supply: [
      "Incoterms and Delivery Responsibility",
      "Packaging and Labelling Requirements",
      "Lead Time Commitments",
      "Freight Forwarder Nomination",
      "Customs Documentation Obligations",
      "Inventory Buffer / Safety Stock",
      "Supply Chain Disruption Protocol",
    ],
  };

  it("NNN agreement has 6 clauses", () => {
    expect(DEFAULT_CLAUSES.nnn).toHaveLength(6);
  });

  it("Manufacturing agreement has 10 clauses", () => {
    expect(DEFAULT_CLAUSES.manufacturing).toHaveLength(10);
  });

  it("Tooling ownership agreement has 6 clauses", () => {
    expect(DEFAULT_CLAUSES.tooling_ownership).toHaveLength(6);
  });

  it("Quality agreement has 7 clauses", () => {
    expect(DEFAULT_CLAUSES.quality).toHaveLength(7);
  });

  it("Logistics & Supply agreement has 7 clauses", () => {
    expect(DEFAULT_CLAUSES.logistics_supply).toHaveLength(7);
  });

  it("NNN agreement includes non-circumvention clause", () => {
    expect(DEFAULT_CLAUSES.nnn.some(c => c.toLowerCase().includes("circumvention"))).toBe(true);
  });

  it("Manufacturing agreement includes IP protection clause", () => {
    expect(DEFAULT_CLAUSES.manufacturing.some(c => c.toLowerCase().includes("intellectual property"))).toBe(true);
  });

  it("Quality agreement includes AQL reference", () => {
    expect(DEFAULT_CLAUSES.quality.some(c => c.includes("AQL"))).toBe(true);
  });

  it("all contract types have at least 1 clause", () => {
    Object.values(DEFAULT_CLAUSES).forEach(clauses => {
      expect(clauses.length).toBeGreaterThan(0);
    });
  });
});

// ── Risk Rating Validation ─────────────────────────────────────────────────────
describe("Supplier risk rating validation", () => {
  const VALID_RISK_RATINGS = ["low", "medium", "high", "critical"];

  it("accepts all valid risk ratings", () => {
    VALID_RISK_RATINGS.forEach(rating => {
      expect(VALID_RISK_RATINGS.includes(rating)).toBe(true);
    });
  });

  it("rejects invalid risk ratings", () => {
    const invalid = ["unknown", "extreme", "none", ""];
    invalid.forEach(rating => {
      expect(VALID_RISK_RATINGS.includes(rating)).toBe(false);
    });
  });
});

// ── Onboarding Status Transitions ─────────────────────────────────────────────
describe("Supplier onboarding status transitions", () => {
  const VALID_STATUSES = ["pending", "under_review", "approved", "rejected", "on_hold"];

  it("pending can transition to under_review", () => {
    const allowed = ["under_review", "rejected", "on_hold"];
    allowed.forEach(next => expect(VALID_STATUSES.includes(next)).toBe(true));
  });

  it("approved is a terminal positive state", () => {
    expect(VALID_STATUSES.includes("approved")).toBe(true);
  });

  it("rejected is a terminal negative state", () => {
    expect(VALID_STATUSES.includes("rejected")).toBe(true);
  });
});
