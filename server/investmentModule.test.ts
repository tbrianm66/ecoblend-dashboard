/**
 * Investment Module Router — Vitest Tests (Sprint 66)
 * Covers: readiness scoring, output generation, investor targets,
 *         KPIs, fundraising rounds, and portfolio summary
 */
import { describe, it, expect } from "vitest";
import { investmentModuleRouter } from "./investmentModule.router";

// Mock authenticated context
const mockCtx = {
  user: {
    openId: "test-user-001",
    name: "Test User",
    email: "test@ecoblend.studio",
    role: "admin" as const,
  },
};

// Caller is directly on the investmentModuleRouter, so paths are:
//   caller.readiness.list(), caller.outputs.list(), etc.
const caller = investmentModuleRouter.createCaller(mockCtx as any);

// ─── Readiness Scoring ────────────────────────────────────────────────────────

describe("investmentModule.readiness", () => {
  it("portfolioSummary returns expected shape", async () => {
    const result = await caller.readiness.portfolioSummary();
    expect(result).toHaveProperty("avgComposite");
    expect(result).toHaveProperty("readyCount");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("byVenture");
    expect(Array.isArray(result.byVenture)).toBe(true);
    expect(typeof result.avgComposite).toBe("number");
    expect(result.avgComposite).toBeGreaterThanOrEqual(0);
    expect(result.avgComposite).toBeLessThanOrEqual(100);
  });

  it("list returns an array", async () => {
    const result = await caller.readiness.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("list with ventureId filter returns array", async () => {
    const result = await caller.readiness.list({ ventureId: "nonexistent-venture" });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("get returns null for nonexistent venture", async () => {
    const result = await caller.readiness.get({ ventureId: "nonexistent-venture-xyz" });
    expect(result).toBeNull();
  });
});

// ─── Outputs ──────────────────────────────────────────────────────────────────

describe("investmentModule.outputs", () => {
  it("list returns an array", async () => {
    const result = await caller.outputs.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("list with ventureId filter returns array", async () => {
    const result = await caller.outputs.list({ ventureId: "nonexistent-venture" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("get returns null for nonexistent id", async () => {
    const result = await caller.outputs.get({ id: 999999 });
    expect(result).toBeNull();
  });
});

// ─── Investor Targets ─────────────────────────────────────────────────────────

describe("investmentModule.targets", () => {
  let createdId: number;

  it("list returns an array", async () => {
    const result = await caller.targets.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsert creates a new investor target", async () => {
    const result = await caller.targets.upsert({
      investorName: "Test Impact Fund",
      fund: "Green Ventures Capital",
      investorType: "impact_fund",
      matchScore: 85,
      matchRationale: "Strong alignment with sustainability mission",
      sectorFocus: "CleanTech",
      stageFocus: "Seed",
      impactFocused: true,
      outreachStatus: "identified",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
    createdId = result.id;
  });

  it("list includes the created investor", async () => {
    const result = await caller.targets.list({});
    const found = result.find(t => t.id === createdId);
    expect(found).toBeDefined();
    expect(found?.investorName).toBe("Test Impact Fund");
    expect(found?.matchScore).toBe(85);
  });

  it("upsert updates an existing investor target", async () => {
    const result = await caller.targets.upsert({
      id: createdId,
      investorName: "Test Impact Fund",
      outreachStatus: "contacted",
      matchScore: 90,
    });
    expect(result).toHaveProperty("id");
    expect(result.id).toBe(createdId);
  });

  it("updated investor has new status", async () => {
    const result = await caller.targets.list({});
    const found = result.find(t => t.id === createdId);
    expect(found?.outreachStatus).toBe("contacted");
    expect(found?.matchScore).toBe(90);
  });

  it("delete removes the investor target", async () => {
    await caller.targets.delete({ id: createdId });
    const result = await caller.targets.list({});
    const found = result.find(t => t.id === createdId);
    expect(found).toBeUndefined();
  });
});

// ─── KPIs ─────────────────────────────────────────────────────────────────────

describe("investmentModule.kpis", () => {
  let createdId: number;

  it("get returns null for nonexistent venture", async () => {
    const result = await caller.kpis.get({ ventureId: "nonexistent-venture-xyz" });
    expect(result).toBeNull();
  });

  it("upsert creates KPIs", async () => {
    const result = await caller.kpis.upsert({
      ventureId: "test-kpi-venture",
      askAmount: 500000,
      preMoneyVal: 2000000,
      burnRate: 25000,
      runway: 18,
      revenueYear1: 120000,
      revenueYear3: 800000,
      revenueYear5: 3000000,
      useOfFunds: "Product development 40%, Sales 30%, Operations 30%",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
    createdId = result.id;
  });

  it("get returns the created KPIs", async () => {
    const result = await caller.kpis.get({ ventureId: "test-kpi-venture" });
    expect(result).not.toBeNull();
    expect(result?.askAmount).toBe(500000);
    expect(result?.preMoneyVal).toBe(2000000);
    expect(result?.runway).toBe(18);
  });

  it("upsert updates existing KPIs", async () => {
    await caller.kpis.upsert({
      id: createdId,
      ventureId: "test-kpi-venture",
      askAmount: 750000,
      runway: 24,
    });
    const result = await caller.kpis.get({ ventureId: "test-kpi-venture" });
    expect(result?.askAmount).toBe(750000);
    expect(result?.runway).toBe(24);
  });
});

// ─── Fundraising Rounds ───────────────────────────────────────────────────────

describe("investmentModule.fundraising", () => {
  let createdId: number;

  it("list returns an array", async () => {
    const result = await caller.fundraising.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsert creates a new fundraising round", async () => {
    const result = await caller.fundraising.upsert({
      ventureId: "test-fundraising-venture",
      roundName: "Seed Round A",
      roundType: "seed",
      targetAmount: 500000,
      raisedAmount: 150000,
      status: "open",
      leadInvestor: "Green Ventures Capital",
      notes: "Initial seed round for product development",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
    createdId = result.id;
  });

  it("list includes the created round", async () => {
    const result = await caller.fundraising.list({ ventureId: "test-fundraising-venture" });
    const found = result.find(r => r.id === createdId);
    expect(found).toBeDefined();
    expect(found?.roundName).toBe("Seed Round A");
    expect(found?.targetAmount).toBe(500000);
    expect(found?.raisedAmount).toBe(150000);
    expect(found?.status).toBe("open");
  });

  it("upsert updates an existing round", async () => {
    await caller.fundraising.upsert({
      id: createdId,
      roundName: "Seed Round A",
      raisedAmount: 300000,
      status: "closing",
    });
    const result = await caller.fundraising.list({ ventureId: "test-fundraising-venture" });
    const found = result.find(r => r.id === createdId);
    expect(found?.raisedAmount).toBe(300000);
    expect(found?.status).toBe("closing");
  });

  it("delete removes the round", async () => {
    await caller.fundraising.delete({ id: createdId });
    const result = await caller.fundraising.list({ ventureId: "test-fundraising-venture" });
    const found = result.find(r => r.id === createdId);
    expect(found).toBeUndefined();
  });
});

// ─── Summary Dashboard ────────────────────────────────────────────────────────

describe("investmentModule.summary", () => {
  it("getDashboard returns null or valid shape for nonexistent venture", async () => {
    const result = await caller.summary.getDashboard({ ventureId: "nonexistent-venture-xyz-999" });
    if (result !== null) {
      expect(result).toHaveProperty("outputs");
      expect(result).toHaveProperty("targets");
      expect(result).toHaveProperty("rounds");
    }
  });

  it("getDashboard returns expected shape for any venture", async () => {
    const result = await caller.summary.getDashboard({ ventureId: "test-kpi-venture" });
    if (result !== null) {
      expect(result).toHaveProperty("outputs");
      expect(result).toHaveProperty("targets");
      expect(result).toHaveProperty("rounds");
      expect(result).toHaveProperty("kpi");
      expect(result).toHaveProperty("totalRaised");
      expect(result).toHaveProperty("topTargets");
      expect(Array.isArray(result.targets)).toBe(true);
      expect(Array.isArray(result.rounds)).toBe(true);
      expect(Array.isArray(result.topTargets)).toBe(true);
    }
  });
});

// ─── Router Structure ─────────────────────────────────────────────────────────

describe("investmentModuleRouter registration", () => {
  it("should export a valid tRPC router", () => {
    expect(typeof investmentModuleRouter.createCaller).toBe("function");
    const def = investmentModuleRouter._def as any;
    expect(def).toBeDefined();
    expect(def.router).toBe(true);
  });

  it("caller exposes all expected sub-router procedures", () => {
    const testCaller = investmentModuleRouter.createCaller(mockCtx as any);
    expect(typeof testCaller.readiness.list).toBe("function");
    expect(typeof testCaller.readiness.get).toBe("function");
    expect(typeof testCaller.readiness.calculate).toBe("function");
    expect(typeof testCaller.readiness.portfolioSummary).toBe("function");
    expect(typeof testCaller.outputs.list).toBe("function");
    expect(typeof testCaller.outputs.generatePitchDeck).toBe("function");
    expect(typeof testCaller.outputs.generateBusinessPlan).toBe("function");
    expect(typeof testCaller.outputs.generateExecutionPlan).toBe("function");
    expect(typeof testCaller.outputs.generateInvestorSummary).toBe("function");
    expect(typeof testCaller.targets.list).toBe("function");
    expect(typeof testCaller.targets.upsert).toBe("function");
    expect(typeof testCaller.targets.aiMatch).toBe("function");
    expect(typeof testCaller.kpis.get).toBe("function");
    expect(typeof testCaller.kpis.upsert).toBe("function");
    expect(typeof testCaller.fundraising.list).toBe("function");
    expect(typeof testCaller.fundraising.upsert).toBe("function");
    expect(typeof testCaller.fundraising.delete).toBe("function");
    expect(typeof testCaller.summary.getDashboard).toBe("function");
  });
});
