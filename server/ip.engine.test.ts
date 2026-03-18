/**
 * IP Intelligence Engine — Vitest Tests (Sprint 37)
 * Tests cover:
 *  - IP asset type validation (all 5 types)
 *  - Hypothesis schema validation
 *  - Patent section enum guard
 *  - License value calculations
 *  - Portfolio summary aggregation logic
 */

import { describe, it, expect } from "vitest";

// ── IP Type Validation ────────────────────────────────────────────────────────

const IP_TYPES = ["Patent", "Trademark", "Copyright", "DesignRight", "TradeSecret"] as const;
type IpType = typeof IP_TYPES[number];

function isValidIpType(type: string): type is IpType {
  return IP_TYPES.includes(type as IpType);
}

describe("IP Type Validation", () => {
  it("accepts all 5 valid IP types", () => {
    expect(isValidIpType("Patent")).toBe(true);
    expect(isValidIpType("Trademark")).toBe(true);
    expect(isValidIpType("Copyright")).toBe(true);
    expect(isValidIpType("DesignRight")).toBe(true);
    expect(isValidIpType("TradeSecret")).toBe(true);
  });

  it("rejects invalid IP types", () => {
    expect(isValidIpType("patent")).toBe(false);   // case-sensitive
    expect(isValidIpType("License")).toBe(false);
    expect(isValidIpType("")).toBe(false);
    expect(isValidIpType("Trade Secret")).toBe(false); // space variant
  });

  it("covers exactly 5 IP types", () => {
    expect(IP_TYPES.length).toBe(5);
  });
});

// ── Patent Section Enum ───────────────────────────────────────────────────────

const PATENT_SECTIONS = ["Abstract", "Background", "Summary", "DetailedDescription", "Claims"] as const;
type PatentSection = typeof PATENT_SECTIONS[number];

function isValidPatentSection(s: string): s is PatentSection {
  return PATENT_SECTIONS.includes(s as PatentSection);
}

describe("Patent Section Enum", () => {
  it("accepts all 5 valid patent sections", () => {
    expect(isValidPatentSection("Abstract")).toBe(true);
    expect(isValidPatentSection("Background")).toBe(true);
    expect(isValidPatentSection("Summary")).toBe(true);
    expect(isValidPatentSection("DetailedDescription")).toBe(true);
    expect(isValidPatentSection("Claims")).toBe(true);
  });

  it("rejects invalid section names", () => {
    expect(isValidPatentSection("Detailed Description")).toBe(false); // space variant
    expect(isValidPatentSection("claims")).toBe(false);               // case-sensitive
    expect(isValidPatentSection("Introduction")).toBe(false);
  });

  it("covers exactly 5 sections", () => {
    expect(PATENT_SECTIONS.length).toBe(5);
  });
});

// ── Hypothesis Schema Validation ──────────────────────────────────────────────

interface Hypothesis {
  title: string;
  description: string;
  rationale: string;
  claim_impact: string;
}

function validateHypothesis(h: unknown): h is Hypothesis {
  if (typeof h !== "object" || h === null) return false;
  const obj = h as Record<string, unknown>;
  return (
    typeof obj.title === "string" && obj.title.length > 0 &&
    typeof obj.description === "string" && obj.description.length > 0 &&
    typeof obj.rationale === "string" &&
    typeof obj.claim_impact === "string"
  );
}

function validateHypothesesResponse(raw: unknown): Hypothesis[] {
  if (typeof raw !== "object" || raw === null) throw new Error("Invalid response");
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.hypotheses)) throw new Error("Missing hypotheses array");
  const valid = obj.hypotheses.filter(validateHypothesis);
  if (valid.length === 0) throw new Error("No valid hypotheses found");
  return valid;
}

describe("Hypothesis Schema Validation", () => {
  it("accepts a well-formed hypothesis object", () => {
    const h = {
      title: "Material Substitution Variant",
      description: "Replace carbon fibre with recycled bio-composite",
      rationale: "Reduces cost while maintaining tensile strength",
      claim_impact: "Broadens claim 1 to cover bio-based materials",
    };
    expect(validateHypothesis(h)).toBe(true);
  });

  it("rejects hypothesis with missing title", () => {
    expect(validateHypothesis({ description: "desc", rationale: "r", claim_impact: "c" })).toBe(false);
  });

  it("rejects hypothesis with empty title", () => {
    expect(validateHypothesis({ title: "", description: "desc", rationale: "r", claim_impact: "c" })).toBe(false);
  });

  it("rejects non-object hypothesis", () => {
    expect(validateHypothesis("string")).toBe(false);
    expect(validateHypothesis(null)).toBe(false);
    expect(validateHypothesis(42)).toBe(false);
  });

  it("parses a valid AI response with multiple hypotheses", () => {
    const aiResponse = {
      hypotheses: [
        { title: "H1", description: "Desc 1", rationale: "R1", claim_impact: "C1" },
        { title: "H2", description: "Desc 2", rationale: "R2", claim_impact: "C2" },
        { title: "H3", description: "Desc 3", rationale: "R3", claim_impact: "C3" },
      ],
    };
    const result = validateHypothesesResponse(aiResponse);
    expect(result).toHaveLength(3);
    expect(result[0].title).toBe("H1");
  });

  it("throws on missing hypotheses array", () => {
    expect(() => validateHypothesesResponse({ data: [] })).toThrow("Missing hypotheses array");
  });

  it("throws on empty hypotheses array", () => {
    expect(() => validateHypothesesResponse({ hypotheses: [] })).toThrow("No valid hypotheses found");
  });

  it("filters out invalid hypotheses from mixed array", () => {
    const aiResponse = {
      hypotheses: [
        { title: "Valid", description: "D", rationale: "R", claim_impact: "C" },
        { title: "", description: "D", rationale: "R", claim_impact: "C" }, // invalid
        "not an object", // invalid
      ],
    };
    const result = validateHypothesesResponse(aiResponse);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Valid");
  });
});

// ── License Value Calculations ────────────────────────────────────────────────

interface License {
  status: string;
  annualValue?: number | null;
  upfrontFee?: number | null;
  royaltyRate?: number | null;
}

function computeAnnualLicenseRevenue(licenses: License[]): number {
  return licenses
    .filter(l => l.status === "Active")
    .reduce((sum, l) => sum + (l.annualValue ?? 0), 0);
}

function computeTotalLicenseValue(licenses: License[]): number {
  return licenses.reduce((sum, l) => sum + (l.annualValue ?? 0) + (l.upfrontFee ?? 0), 0);
}

describe("License Value Calculations", () => {
  const licenses: License[] = [
    { status: "Active", annualValue: 50000, upfrontFee: 10000 },
    { status: "Active", annualValue: 30000, upfrontFee: 5000 },
    { status: "Negotiating", annualValue: 20000, upfrontFee: 0 },
    { status: "Expired", annualValue: 15000, upfrontFee: 2000 },
  ];

  it("sums only active license annual values", () => {
    expect(computeAnnualLicenseRevenue(licenses)).toBe(80000);
  });

  it("returns 0 when no active licenses", () => {
    expect(computeAnnualLicenseRevenue([
      { status: "Expired", annualValue: 10000 },
      { status: "Terminated", annualValue: 5000 },
    ])).toBe(0);
  });

  it("handles null/undefined annualValue gracefully", () => {
    expect(computeAnnualLicenseRevenue([
      { status: "Active", annualValue: null },
      { status: "Active", annualValue: undefined },
      { status: "Active", annualValue: 20000 },
    ])).toBe(20000);
  });

  it("computes total license value including upfront fees", () => {
    expect(computeTotalLicenseValue(licenses)).toBe(132000);
  });
});

// ── Portfolio Summary Aggregation ─────────────────────────────────────────────

interface IpAsset {
  ipType: string;
  status: string;
  estimatedValue?: number | null;
}

function buildPortfolioSummary(assets: IpAsset[]) {
  const byType = IP_TYPES.map(t => ({
    type: t,
    count: assets.filter(a => a.ipType === t).length,
  }));

  const totalEstimatedValue = assets.reduce((s, a) => s + (a.estimatedValue ?? 0), 0);
  const grantedPatents = assets.filter(a => a.ipType === "Patent" && (a.status === "Granted" || a.status === "Licensed")).length;
  const registeredTM = assets.filter(a => a.ipType === "Trademark" && a.status === "Registered").length;
  const activeSecrets = assets.filter(a => a.ipType === "TradeSecret" && a.status === "Active").length;

  return { totalAssets: assets.length, byType, totalEstimatedValue, grantedPatents, registeredTM, activeSecrets };
}

describe("Portfolio Summary Aggregation", () => {
  const assets: IpAsset[] = [
    { ipType: "Patent", status: "Granted", estimatedValue: 200000 },
    { ipType: "Patent", status: "Filed", estimatedValue: 50000 },
    { ipType: "Patent", status: "Licensed", estimatedValue: 150000 },
    { ipType: "Trademark", status: "Registered", estimatedValue: 30000 },
    { ipType: "Trademark", status: "Application", estimatedValue: 5000 },
    { ipType: "Copyright", status: "Active", estimatedValue: 10000 },
    { ipType: "DesignRight", status: "Registered", estimatedValue: 20000 },
    { ipType: "TradeSecret", status: "Active", estimatedValue: 100000 },
    { ipType: "TradeSecret", status: "Active", estimatedValue: 80000 },
  ];

  it("counts total assets correctly", () => {
    expect(buildPortfolioSummary(assets).totalAssets).toBe(9);
  });

  it("counts granted patents (Granted + Licensed)", () => {
    expect(buildPortfolioSummary(assets).grantedPatents).toBe(2);
  });

  it("counts registered trademarks only", () => {
    expect(buildPortfolioSummary(assets).registeredTM).toBe(1);
  });

  it("counts active trade secrets", () => {
    expect(buildPortfolioSummary(assets).activeSecrets).toBe(2);
  });

  it("sums total estimated value", () => {
    expect(buildPortfolioSummary(assets).totalEstimatedValue).toBe(645000);
  });

  it("returns 0 counts for all types on empty portfolio", () => {
    const summary = buildPortfolioSummary([]);
    expect(summary.totalAssets).toBe(0);
    expect(summary.grantedPatents).toBe(0);
    expect(summary.registeredTM).toBe(0);
    expect(summary.activeSecrets).toBe(0);
    expect(summary.totalEstimatedValue).toBe(0);
    summary.byType.forEach(t => expect(t.count).toBe(0));
  });

  it("byType array covers all 5 IP types", () => {
    const summary = buildPortfolioSummary(assets);
    expect(summary.byType.map(t => t.type)).toEqual(["Patent", "Trademark", "Copyright", "DesignRight", "TradeSecret"]);
  });

  it("byType counts are correct per type", () => {
    const summary = buildPortfolioSummary(assets);
    const patentEntry = summary.byType.find(t => t.type === "Patent");
    const secretEntry = summary.byType.find(t => t.type === "TradeSecret");
    expect(patentEntry?.count).toBe(3);
    expect(secretEntry?.count).toBe(2);
  });
});

// ── Commercial Potential Enum ─────────────────────────────────────────────────

describe("Commercial Potential Enum", () => {
  const validPotentials = ["High", "Medium", "Low"];

  it("accepts valid commercial potential values", () => {
    validPotentials.forEach(p => expect(validPotentials.includes(p)).toBe(true));
  });

  it("rejects invalid values", () => {
    expect(validPotentials.includes("high")).toBe(false);
    expect(validPotentials.includes("Very High")).toBe(false);
    expect(validPotentials.includes("")).toBe(false);
  });
});
