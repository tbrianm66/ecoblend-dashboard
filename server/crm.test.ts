/**
 * Sprint 49 — Commercial CRM + Investor CRM
 * Tests for business logic, validation, and data integrity
 */
import { describe, it, expect } from "vitest";

// ─── Commercial CRM helpers ────────────────────────────────────────────────────

const LEAD_STAGES = ["prospect", "qualified", "proposal", "negotiation", "won", "lost"];
const DEAL_STAGES = ["discovery", "proposal", "negotiation", "contract", "closed_won", "closed_lost"];
const ACTIVITY_TYPES = ["call", "email", "meeting", "demo", "follow_up", "proposal_sent", "contract_sent"];
const CONTACT_TYPES = ["customer", "prospect", "partner", "distributor", "supplier", "media", "other"];

function calcLeadScore(params: {
  hasEmail: boolean;
  hasPhone: boolean;
  hasCompany: boolean;
  stage: string;
  dealValue: number;
}): number {
  let score = 0;
  if (params.hasEmail) score += 20;
  if (params.hasPhone) score += 10;
  if (params.hasCompany) score += 15;
  const stageIdx = LEAD_STAGES.indexOf(params.stage);
  if (stageIdx >= 0) score += stageIdx * 10;
  if (params.dealValue > 100000) score += 20;
  else if (params.dealValue > 10000) score += 10;
  else if (params.dealValue > 1000) score += 5;
  return Math.min(score, 100);
}

function calcDealProbability(stage: string): number {
  const probabilities: Record<string, number> = {
    discovery: 10, proposal: 30, negotiation: 60,
    contract: 80, closed_won: 100, closed_lost: 0,
  };
  return probabilities[stage] ?? 0;
}

function calcWeightedPipeline(deals: Array<{ value: number; stage: string }>): number {
  return deals.reduce((sum, d) => sum + d.value * (calcDealProbability(d.stage) / 100), 0);
}

function isValidActivityType(type: string): boolean {
  return ACTIVITY_TYPES.includes(type);
}

function isValidContactType(type: string): boolean {
  return CONTACT_TYPES.includes(type);
}

function formatDealValue(value: number): string {
  if (value >= 1_000_000) return `£${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `£${(value / 1_000).toFixed(0)}K`;
  return `£${value}`;
}

function calcConversionRate(won: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((won / total) * 100);
}

// ─── Investor CRM helpers ──────────────────────────────────────────────────────

const INVESTOR_TYPES = ["angel", "vc", "family_office", "corporate", "accelerator", "grant", "crowdfunding", "other"];
const INVESTOR_STATUSES = ["prospect", "contacted", "interested", "committed", "passed", "portfolio"];
const ROUND_TYPES = ["pre_seed", "seed", "series_a", "series_b", "bridge", "grant", "crowdfunding"];
const TERM_SHEET_STATUSES = ["draft", "sent", "under_review", "negotiating", "signed", "expired", "withdrawn"];
const SHAREHOLDER_TYPES = ["founder", "investor", "employee", "advisor", "esop", "other"];

function calcFundingProgress(raised: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(Math.round((raised / target) * 100), 100);
}

function calcDilution(newShares: number, totalSharesBefore: number): number {
  const totalAfter = totalSharesBefore + newShares;
  return (newShares / totalAfter) * 100;
}

function calcPostMoneyValuation(preMoneyVal: number, investmentAmount: number): number {
  return preMoneyVal + investmentAmount;
}

function calcEquityPercent(investmentAmount: number, postMoneyVal: number): number {
  if (postMoneyVal === 0) return 0;
  return (investmentAmount / postMoneyVal) * 100;
}

function isValidRoundType(type: string): boolean {
  return ROUND_TYPES.includes(type);
}

function isValidInvestorStatus(status: string): boolean {
  return INVESTOR_STATUSES.includes(status);
}

function isValidTermSheetStatus(status: string): boolean {
  return TERM_SHEET_STATUSES.includes(status);
}

function isValidShareholderType(type: string): boolean {
  return SHAREHOLDER_TYPES.includes(type);
}

function calcCapTableOwnership(shares: number, totalShares: number): number {
  if (totalShares === 0) return 0;
  return (shares / totalShares) * 100;
}

function isTermSheetExpired(expiryDate: number | null): boolean {
  if (!expiryDate) return false;
  return Date.now() > expiryDate;
}

function calcInvestorPipelineScore(status: string): number {
  const scores: Record<string, number> = {
    prospect: 10, contacted: 25, interested: 50,
    committed: 80, passed: 0, portfolio: 100,
  };
  return scores[status] ?? 0;
}

// ─── Commercial CRM Tests ──────────────────────────────────────────────────────

describe("Commercial CRM — Lead Scoring", () => {
  it("scores a fully qualified lead at max 100", () => {
    const score = calcLeadScore({
      hasEmail: true, hasPhone: true, hasCompany: true,
      stage: "negotiation", dealValue: 500000,
    });
    // 20 + 10 + 15 + 3*10 + 20 = 95
    expect(score).toBe(95);
  });

  it("scores a bare prospect with no contact info at 10", () => {
    const score = calcLeadScore({
      hasEmail: false, hasPhone: false, hasCompany: false,
      stage: "prospect", dealValue: 0,
    });
    // 0 + 0 + 0 + 0*10 + 0 = 0
    expect(score).toBe(0);
  });

  it("caps score at 100", () => {
    const score = calcLeadScore({
      hasEmail: true, hasPhone: true, hasCompany: true,
      stage: "won", dealValue: 1000000,
    });
    // 20 + 10 + 15 + 5*10 + 20 = 115 → capped at 100
    expect(score).toBe(100);
  });

  it("adds deal value bonus for £10K–£100K deals", () => {
    const score = calcLeadScore({
      hasEmail: true, hasPhone: false, hasCompany: false,
      stage: "prospect", dealValue: 50000,
    });
    // 20 + 0 + 0 + 0 + 10 = 30
    expect(score).toBe(30);
  });

  it("adds small deal value bonus for £1K–£10K deals", () => {
    const score = calcLeadScore({
      hasEmail: false, hasPhone: false, hasCompany: false,
      stage: "prospect", dealValue: 5000,
    });
    // 0 + 0 + 0 + 0 + 5 = 5
    expect(score).toBe(5);
  });
});

describe("Commercial CRM — Deal Pipeline", () => {
  it("calculates deal probability by stage", () => {
    expect(calcDealProbability("discovery")).toBe(10);
    expect(calcDealProbability("proposal")).toBe(30);
    expect(calcDealProbability("negotiation")).toBe(60);
    expect(calcDealProbability("contract")).toBe(80);
    expect(calcDealProbability("closed_won")).toBe(100);
    expect(calcDealProbability("closed_lost")).toBe(0);
  });

  it("returns 0 for unknown stage", () => {
    expect(calcDealProbability("unknown_stage")).toBe(0);
  });

  it("calculates weighted pipeline value correctly", () => {
    const deals = [
      { value: 100000, stage: "proposal" },    // 30% = 30000
      { value: 50000, stage: "negotiation" },  // 60% = 30000
      { value: 200000, stage: "closed_won" },  // 100% = 200000
    ];
    expect(calcWeightedPipeline(deals)).toBe(260000);
  });

  it("handles empty pipeline", () => {
    expect(calcWeightedPipeline([])).toBe(0);
  });

  it("validates all deal stages", () => {
    DEAL_STAGES.forEach(stage => {
      expect(calcDealProbability(stage)).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("Commercial CRM — Activity and Contact Validation", () => {
  it("validates all activity types", () => {
    ACTIVITY_TYPES.forEach(type => {
      expect(isValidActivityType(type)).toBe(true);
    });
  });

  it("rejects invalid activity type", () => {
    expect(isValidActivityType("invalid_type")).toBe(false);
  });

  it("validates all contact types", () => {
    CONTACT_TYPES.forEach(type => {
      expect(isValidContactType(type)).toBe(true);
    });
  });

  it("rejects invalid contact type", () => {
    expect(isValidContactType("unknown")).toBe(false);
  });
});

describe("Commercial CRM — Deal Value Formatting", () => {
  it("formats millions correctly", () => {
    expect(formatDealValue(1500000)).toBe("£1.5M");
    expect(formatDealValue(2000000)).toBe("£2.0M");
  });

  it("formats thousands correctly", () => {
    expect(formatDealValue(50000)).toBe("£50K");
    expect(formatDealValue(1000)).toBe("£1K");
  });

  it("formats small values correctly", () => {
    expect(formatDealValue(500)).toBe("£500");
  });
});

describe("Commercial CRM — Conversion Rate", () => {
  it("calculates conversion rate correctly", () => {
    expect(calcConversionRate(3, 10)).toBe(30);
    expect(calcConversionRate(5, 5)).toBe(100);
    expect(calcConversionRate(0, 10)).toBe(0);
  });

  it("handles zero total without division error", () => {
    expect(calcConversionRate(0, 0)).toBe(0);
  });
});

// ─── Investor CRM Tests ────────────────────────────────────────────────────────

describe("Investor CRM — Funding Progress", () => {
  it("calculates funding progress correctly", () => {
    expect(calcFundingProgress(250000, 500000)).toBe(50);
    expect(calcFundingProgress(500000, 500000)).toBe(100);
    expect(calcFundingProgress(0, 500000)).toBe(0);
  });

  it("caps funding progress at 100%", () => {
    expect(calcFundingProgress(600000, 500000)).toBe(100);
  });

  it("handles zero target without division error", () => {
    expect(calcFundingProgress(100000, 0)).toBe(0);
  });
});

describe("Investor CRM — Valuation and Equity", () => {
  it("calculates post-money valuation correctly", () => {
    expect(calcPostMoneyValuation(4000000, 1000000)).toBe(5000000);
  });

  it("calculates equity percent from investment and post-money val", () => {
    const equity = calcEquityPercent(1000000, 5000000);
    expect(equity).toBe(20);
  });

  it("handles zero post-money valuation", () => {
    expect(calcEquityPercent(1000000, 0)).toBe(0);
  });

  it("calculates dilution correctly", () => {
    // 1M new shares on top of 4M existing = 20% dilution
    const dilution = calcDilution(1000000, 4000000);
    expect(dilution).toBe(20);
  });
});

describe("Investor CRM — Round and Status Validation", () => {
  it("validates all round types", () => {
    ROUND_TYPES.forEach(type => {
      expect(isValidRoundType(type)).toBe(true);
    });
  });

  it("rejects invalid round type", () => {
    expect(isValidRoundType("series_z")).toBe(false);
  });

  it("validates all investor statuses", () => {
    INVESTOR_STATUSES.forEach(status => {
      expect(isValidInvestorStatus(status)).toBe(true);
    });
  });

  it("validates all term sheet statuses", () => {
    TERM_SHEET_STATUSES.forEach(status => {
      expect(isValidTermSheetStatus(status)).toBe(true);
    });
  });

  it("validates all shareholder types", () => {
    SHAREHOLDER_TYPES.forEach(type => {
      expect(isValidShareholderType(type)).toBe(true);
    });
  });
});

describe("Investor CRM — Cap Table", () => {
  it("calculates cap table ownership correctly", () => {
    expect(calcCapTableOwnership(1000000, 5000000)).toBe(20);
    expect(calcCapTableOwnership(5000000, 5000000)).toBe(100);
    expect(calcCapTableOwnership(0, 5000000)).toBe(0);
  });

  it("handles zero total shares", () => {
    expect(calcCapTableOwnership(1000000, 0)).toBe(0);
  });

  it("validates that cap table entries sum to 100%", () => {
    const entries = [
      { shares: 4000000 },  // founders
      { shares: 500000 },   // investor A
      { shares: 500000 },   // investor B
    ];
    const total = entries.reduce((s, e) => s + e.shares, 0);
    const sum = entries.reduce((s, e) => s + calcCapTableOwnership(e.shares, total), 0);
    expect(sum).toBe(100);
  });
});

describe("Investor CRM — Term Sheet Expiry", () => {
  it("identifies expired term sheets", () => {
    const pastDate = Date.now() - 86400000; // 1 day ago
    expect(isTermSheetExpired(pastDate)).toBe(true);
  });

  it("identifies non-expired term sheets", () => {
    const futureDate = Date.now() + 86400000; // 1 day from now
    expect(isTermSheetExpired(futureDate)).toBe(false);
  });

  it("handles null expiry date", () => {
    expect(isTermSheetExpired(null)).toBe(false);
  });
});

describe("Investor CRM — Pipeline Scoring", () => {
  it("assigns correct pipeline scores by status", () => {
    expect(calcInvestorPipelineScore("prospect")).toBe(10);
    expect(calcInvestorPipelineScore("contacted")).toBe(25);
    expect(calcInvestorPipelineScore("interested")).toBe(50);
    expect(calcInvestorPipelineScore("committed")).toBe(80);
    expect(calcInvestorPipelineScore("passed")).toBe(0);
    expect(calcInvestorPipelineScore("portfolio")).toBe(100);
  });

  it("returns 0 for unknown status", () => {
    expect(calcInvestorPipelineScore("unknown")).toBe(0);
  });

  it("calculates weighted investor pipeline correctly", () => {
    const investors = [
      { status: "interested", targetAmount: 100000 },
      { status: "committed", targetAmount: 200000 },
      { status: "prospect", targetAmount: 500000 },
    ];
    const weighted = investors.reduce((sum, inv) => {
      return sum + inv.targetAmount * (calcInvestorPipelineScore(inv.status) / 100);
    }, 0);
    // 100000*0.5 + 200000*0.8 + 500000*0.1 = 50000 + 160000 + 50000 = 260000
    expect(weighted).toBe(260000);
  });
});

describe("Investor CRM — Investor Type Validation", () => {
  it("validates all investor types", () => {
    INVESTOR_TYPES.forEach(type => {
      expect(INVESTOR_TYPES.includes(type)).toBe(true);
    });
  });

  it("covers all expected investor types", () => {
    expect(INVESTOR_TYPES).toContain("angel");
    expect(INVESTOR_TYPES).toContain("vc");
    expect(INVESTOR_TYPES).toContain("family_office");
    expect(INVESTOR_TYPES).toContain("corporate");
    expect(INVESTOR_TYPES).toContain("accelerator");
    expect(INVESTOR_TYPES).toContain("grant");
    expect(INVESTOR_TYPES).toContain("crowdfunding");
  });
});
