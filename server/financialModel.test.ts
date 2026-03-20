// ============================================================
// Sprint 52 — Financial Model Builder: vitest tests
// Covers: P&L, Runway, Exit Waterfall, Investor Reports,
//         Unit Economics, Summary
// ============================================================

import { describe, it, expect } from "vitest";
import {
  finPlRouter,
  finRunwayRouter,
  finWaterfallRouter,
  finReportsRouter,
  finUnitEconRouter,
  finSummaryRouter,
} from "./financialModel.router";

// ── Minimal mock context ───────────────────────────────────────────────────────
const ctx = { user: { id: "test-user", role: "admin" as const, name: "Test", email: "test@test.com", openId: "oid" } };

// ── P&L Router ────────────────────────────────────────────────────────────────
describe("finPl router", () => {
  it("list returns an array", async () => {
    const caller = finPlRouter.createCaller(ctx);
    const result = await caller.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsert creates a new line item and returns id", async () => {
    const caller = finPlRouter.createCaller(ctx);
    const result = await caller.upsert({
      category: "revenue",
      lineItem: "Test Revenue Line",
      year1: 100000,
      year2: 150000,
      year3: 200000,
      year4: 250000,
      year5: 300000,
    });
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("number");
  });

  it("upsert updates an existing line item and returns id", async () => {
    const caller = finPlRouter.createCaller(ctx);
    const created = await caller.upsert({
      category: "opex",
      lineItem: "Salaries",
      year1: 50000,
      year2: 60000,
      year3: 70000,
      year4: 80000,
      year5: 90000,
    });
    const updated = await caller.upsert({
      id: created.id,
      category: "opex",
      lineItem: "Salaries Updated",
      year1: 55000,
      year2: 65000,
      year3: 75000,
      year4: 85000,
      year5: 95000,
    });
    // Update returns { id } — verify same id
    expect(updated.id).toBe(created.id);
  });

  it("list returns the newly created line item", async () => {
    const caller = finPlRouter.createCaller(ctx);
    await caller.upsert({
      category: "net_profit",
      lineItem: "Net Profit Check",
      year1: 10000,
      year2: 20000,
      year3: 30000,
      year4: 40000,
      year5: 50000,
    });
    const lines = await caller.list({});
    expect(lines.length).toBeGreaterThan(0);
    const found = lines.find(l => l.lineItem === "Net Profit Check");
    expect(found).toBeDefined();
    expect(found?.category).toBe("net_profit");
    expect(found?.year1).toBe(10000);
  });

  it("summary returns year-by-year aggregates", async () => {
    const caller = finPlRouter.createCaller(ctx);
    const summary = await caller.summary({});
    expect(Array.isArray(summary)).toBe(true);
    if (summary.length > 0) {
      expect(summary[0]).toHaveProperty("year");
      expect(summary[0]).toHaveProperty("revenue");
      expect(summary[0]).toHaveProperty("grossProfit");
      expect(summary[0]).toHaveProperty("ebitda");
      expect(summary[0]).toHaveProperty("netProfit");
    }
  });

  it("delete removes a line item", async () => {
    const caller = finPlRouter.createCaller(ctx);
    const created = await caller.upsert({
      category: "tax",
      lineItem: "Corp Tax",
      year1: 10000,
      year2: 12000,
      year3: 14000,
      year4: 16000,
      year5: 18000,
    });
    const result = await caller.delete({ id: created.id });
    expect(result.success).toBe(true);
    // Verify it's gone
    const lines = await caller.list({});
    const found = lines.find(l => l.id === created.id);
    expect(found).toBeUndefined();
  });
});

// ── Runway Router ─────────────────────────────────────────────────────────────
describe("finRunway router", () => {
  it("list returns an array", async () => {
    const caller = finRunwayRouter.createCaller(ctx);
    const result = await caller.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsert creates a base scenario and returns id", async () => {
    const caller = finRunwayRouter.createCaller(ctx);
    const result = await caller.upsert({
      name: "Base Case Q1 2026",
      cashBalance: 500000,
      monthlyBurn: 40000,
      monthlyRevenue: 10000,
      growthRate: 5,
      scenario: "base",
      assumptions: "Conservative growth assumption",
    });
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("number");
  });

  it("list includes the created scenario with calculated runway", async () => {
    const caller = finRunwayRouter.createCaller(ctx);
    await caller.upsert({
      name: "Runway Calc Test",
      cashBalance: 300000,
      monthlyBurn: 30000,
      monthlyRevenue: 0,
      growthRate: 0,
      scenario: "pessimistic",
    });
    const scenarios = await caller.list({});
    const found = scenarios.find(s => s.name === "Runway Calc Test");
    expect(found).toBeDefined();
    // Net burn = 30000, runway = 300000/30000 = 10 months
    expect(found?.runwayMonths).toBe(10);
  });

  it("upsert creates an optimistic scenario", async () => {
    const caller = finRunwayRouter.createCaller(ctx);
    const result = await caller.upsert({
      name: "Optimistic Case",
      cashBalance: 500000,
      monthlyBurn: 30000,
      monthlyRevenue: 25000,
      growthRate: 15,
      scenario: "optimistic",
    });
    expect(result.id).toBeDefined();
    const scenarios = await caller.list({});
    const found = scenarios.find(s => s.id === result.id);
    expect(found?.scenario).toBe("optimistic");
  });

  it("delete removes a scenario", async () => {
    const caller = finRunwayRouter.createCaller(ctx);
    const created = await caller.upsert({
      name: "Temp Scenario",
      cashBalance: 100000,
      monthlyBurn: 10000,
      monthlyRevenue: 5000,
      growthRate: 0,
      scenario: "pessimistic",
    });
    const result = await caller.delete({ id: created.id });
    expect(result.success).toBe(true);
  });
});

// ── Exit Waterfall Router ─────────────────────────────────────────────────────
describe("finWaterfall router", () => {
  it("list returns an array", async () => {
    const caller = finWaterfallRouter.createCaller(ctx);
    const result = await caller.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsert creates a waterfall and returns id", async () => {
    const caller = finWaterfallRouter.createCaller(ctx);
    const result = await caller.upsert({
      exitValuation: 5000000,
      exitType: "acquisition",
      preMoneyValuation: 3000000,
      totalInvested: 500000,
      liquidationPref: "1x_non_participating",
      antiDilution: "none",
    });
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("number");
  });

  it("list includes the created waterfall with correct fields", async () => {
    const caller = finWaterfallRouter.createCaller(ctx);
    const created = await caller.upsert({
      exitValuation: 8000000,
      exitType: "ipo",
      preMoneyValuation: 6000000,
      totalInvested: 1000000,
      liquidationPref: "1x_non_participating",
      antiDilution: "none",
    });
    const waterfalls = await caller.list({});
    const found = waterfalls.find(w => w.id === created.id);
    expect(found).toBeDefined();
    expect(found?.exitValuation).toBe(8000000);
    expect(found?.exitType).toBe("ipo");
  });

  it("upsertTranche adds an investor tranche and returns id", async () => {
    const caller = finWaterfallRouter.createCaller(ctx);
    const wf = await caller.upsert({
      exitValuation: 10000000,
      exitType: "acquisition",
      preMoneyValuation: 8000000,
      totalInvested: 1000000,
      liquidationPref: "1x_non_participating",
      antiDilution: "none",
    });
    const tranche = await caller.upsertTranche({
      waterfallId: wf.id,
      investorName: "Seed Fund A",
      investorType: "seed",
      shares: 100000,
      ownershipPct: 20,
      invested: 500000,
      pref: "preferred",
      sortOrder: 1,
    });
    expect(tranche.id).toBeDefined();
    expect(typeof tranche.id).toBe("number");
  });

  it("getTranches returns tranches for a waterfall", async () => {
    const caller = finWaterfallRouter.createCaller(ctx);
    const wf = await caller.upsert({
      exitValuation: 2000000,
      exitType: "secondary",
      preMoneyValuation: 1500000,
      totalInvested: 200000,
      liquidationPref: "none",
      antiDilution: "none",
    });
    await caller.upsertTranche({
      waterfallId: wf.id,
      investorName: "Founder",
      investorType: "founder",
      shares: 700000,
      ownershipPct: 70,
      invested: 0,
      pref: "common",
      sortOrder: 1,
    });
    const tranches = await caller.getTranches({ waterfallId: wf.id });
    expect(Array.isArray(tranches)).toBe(true);
    expect(tranches.length).toBe(1);
    expect(tranches[0].investorName).toBe("Founder");
  });

  it("calculate returns distribution for a waterfall with tranches", async () => {
    const caller = finWaterfallRouter.createCaller(ctx);
    const wf = await caller.upsert({
      exitValuation: 5000000,
      exitType: "acquisition",
      preMoneyValuation: 3000000,
      totalInvested: 500000,
      liquidationPref: "1x_non_participating",
      antiDilution: "none",
    });
    await caller.upsertTranche({
      waterfallId: wf.id,
      investorName: "Founder",
      investorType: "founder",
      shares: 700000,
      ownershipPct: 70,
      invested: 0,
      pref: "common",
      sortOrder: 1,
    });
    await caller.upsertTranche({
      waterfallId: wf.id,
      investorName: "Angel",
      investorType: "angel",
      shares: 300000,
      ownershipPct: 30,
      invested: 500000,
      pref: "preferred",
      sortOrder: 2,
    });
    const calc = await caller.calculate({ waterfallId: wf.id });
    expect(calc).not.toBeNull();
    expect(calc!.exitValuation).toBe(5000000);
    expect(Array.isArray(calc!.tranches)).toBe(true);
    expect(calc!.tranches.length).toBe(2);
    // All tranches should have totalPayout defined
    for (const t of calc!.tranches) {
      expect(typeof t.totalPayout).toBe("number");
    }
  });

  it("delete removes a waterfall", async () => {
    const caller = finWaterfallRouter.createCaller(ctx);
    const wf = await caller.upsert({
      exitValuation: 1000000,
      exitType: "liquidation",
      preMoneyValuation: 800000,
      totalInvested: 100000,
      liquidationPref: "none",
      antiDilution: "none",
    });
    const result = await caller.delete({ id: wf.id });
    expect(result.success).toBe(true);
  });
});

// ── Investor Reports Router ───────────────────────────────────────────────────
describe("finReports router", () => {
  it("list returns an array", async () => {
    const caller = finReportsRouter.createCaller(ctx);
    const result = await caller.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("generate creates an AI investor report and returns id + content", async () => {
    const caller = finReportsRouter.createCaller(ctx);
    const report = await caller.generate({
      ventureName: "EcoBlend",
      period: "Q1 2026",
      reportType: "quarterly",
      kpiData: "Revenue: £50K, MRR: £8K, Customers: 12, Burn: £15K/mo",
    });
    expect(report.id).toBeDefined();
    expect(typeof report.id).toBe("number");
    // Content fields returned directly
    expect(typeof report.highlights).toBe("string");
    expect(typeof report.challenges).toBe("string");
    expect(typeof report.nextSteps).toBe("string");
  }, 30000);

  it("list includes the generated report with correct fields", async () => {
    const caller = finReportsRouter.createCaller(ctx);
    const report = await caller.generate({
      ventureName: "ListCheck",
      period: "Mar 2026",
      reportType: "monthly",
    });
    const reports = await caller.list({});
    const found = reports.find(r => r.id === report.id);
    expect(found).toBeDefined();
    expect(found?.status).toBe("draft");
    expect(found?.reportType).toBe("monthly");
    expect(found?.period).toBe("Mar 2026");
  }, 30000);

  it("markSent updates report status and returns success", async () => {
    const caller = finReportsRouter.createCaller(ctx);
    const report = await caller.generate({
      ventureName: "TestVenture",
      period: "Jan 2026",
      reportType: "monthly",
    });
    const result = await caller.markSent({ id: report.id });
    expect(result.success).toBe(true);
    // Verify status in list
    const reports = await caller.list({});
    const updated = reports.find(r => r.id === report.id);
    expect(updated?.status).toBe("sent");
  }, 30000);

  it("delete removes a report", async () => {
    const caller = finReportsRouter.createCaller(ctx);
    const report = await caller.generate({
      ventureName: "DeleteTest",
      period: "Feb 2026",
      reportType: "monthly",
    });
    const result = await caller.delete({ id: report.id });
    expect(result.success).toBe(true);
  }, 30000);
});

// ── Unit Economics Router ─────────────────────────────────────────────────────
describe("finUnitEcon router", () => {
  it("list returns an array", async () => {
    const caller = finUnitEconRouter.createCaller(ctx);
    const result = await caller.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsert creates a unit economics entry and returns id", async () => {
    const caller = finUnitEconRouter.createCaller(ctx);
    const result = await caller.upsert({
      period: "Q1 2026",
      cac: 500,
      ltv: 2000,
      arpu: 100,
      churnRate: 5,
      grossMargin: 60,
    });
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("number");
  });

  it("list includes the entry with correct derived metrics", async () => {
    const caller = finUnitEconRouter.createCaller(ctx);
    const created = await caller.upsert({
      period: "Q2 2026 Metrics",
      cac: 500,
      ltv: 2000,
      arpu: 100,
      churnRate: 5,
      grossMargin: 60,
    });
    const entries = await caller.list({});
    const found = entries.find(e => e.id === created.id);
    expect(found).toBeDefined();
    expect(found?.cac).toBe(500);
    expect(found?.ltv).toBe(2000);
    // LTV:CAC = 2000/500 = 4.0
    expect(found?.ltvCacRatio).toBeCloseTo(4.0, 1);
    // Payback = 500 / (100 * 0.6) = 8.33 → ceil = 9
    expect(found?.paybackMonths).toBe(9);
  });

  it("upsert updates an existing entry and returns same id", async () => {
    const caller = finUnitEconRouter.createCaller(ctx);
    const created = await caller.upsert({
      period: "Q3 2026",
      cac: 400,
      ltv: 1800,
      arpu: 90,
      churnRate: 4,
      grossMargin: 65,
    });
    const updated = await caller.upsert({
      id: created.id,
      period: "Q3 2026",
      cac: 350,
      ltv: 2100,
      arpu: 90,
      churnRate: 3,
      grossMargin: 65,
    });
    expect(updated.id).toBe(created.id);
    // Verify updated values in list
    const entries = await caller.list({});
    const found = entries.find(e => e.id === created.id);
    expect(found?.cac).toBe(350);
    expect(found?.ltv).toBe(2100);
    // New LTV:CAC = 2100/350 = 6.0
    expect(found?.ltvCacRatio).toBeCloseTo(6.0, 1);
  });

  it("delete removes a unit economics entry", async () => {
    const caller = finUnitEconRouter.createCaller(ctx);
    const created = await caller.upsert({
      period: "Q4 2026",
      cac: 600,
      ltv: 2400,
      arpu: 120,
      churnRate: 6,
      grossMargin: 55,
    });
    const result = await caller.delete({ id: created.id });
    expect(result.success).toBe(true);
    const entries = await caller.list({});
    expect(entries.find(e => e.id === created.id)).toBeUndefined();
  });
});

// ── Summary Router ────────────────────────────────────────────────────────────
describe("finSummary router", () => {
  it("overview returns counts for all financial model tables", async () => {
    const caller = finSummaryRouter.createCaller(ctx);
    const overview = await caller.overview();
    expect(overview).not.toBeNull();
    expect(overview).toHaveProperty("plLines");
    expect(overview).toHaveProperty("runwayScenarios");
    expect(overview).toHaveProperty("exitWaterfalls");
    expect(overview).toHaveProperty("investorReports");
    expect(overview).toHaveProperty("unitEconEntries");
    expect(typeof overview!.plLines).toBe("number");
    expect(typeof overview!.runwayScenarios).toBe("number");
    expect(typeof overview!.exitWaterfalls).toBe("number");
    expect(typeof overview!.investorReports).toBe("number");
    expect(typeof overview!.unitEconEntries).toBe("number");
    // After all the above tests, counts should be > 0
    expect(overview!.plLines).toBeGreaterThan(0);
    expect(overview!.runwayScenarios).toBeGreaterThan(0);
  });
});
