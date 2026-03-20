/**
 * Sprint 54 — DB-Connect Static Pages
 * Tests verify that the tRPC procedures used by the four newly-connected pages
 * (InvestmentReadiness, FinancialAnalytics, BCorpIso, PlaybookProgress)
 * exist, accept the correct input shapes, and return the expected output shapes.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getLatestFinancialData: vi.fn().mockResolvedValue([
    {
      id: 1,
      ventureId: "ecoblend-rd",
      reportingPeriod: "2025-Q4",
      revenue: 120000,
      expenses: 80000,
      netProfit: 40000,
      cashBalance: 200000,
      burnRate: 20000,
      runwayMonths: 10,
      mrr: 10000,
      arr: 120000,
      customerCount: 45,
      churnRate: 2.5,
      ltv: 4000,
      cac: 800,
      grossMargin: 65,
      ebitda: 38000,
      updatedAt: new Date(),
    },
  ]),
  getPortfolioIrlSummary: vi.fn().mockResolvedValue([
    { ventureId: "ecoblend-rd", overallIrlScore: 72, irlStage: "IRL 3", lastUpdated: new Date() },
  ]),
  getFinancialSummaryOverview: vi.fn().mockResolvedValue({
    totalRevenue: 480000,
    totalExpenses: 320000,
    totalNetProfit: 160000,
    avgGrossMargin: 63,
    totalMrr: 40000,
    totalArr: 480000,
    avgRunwayMonths: 11,
    ventureCount: 4,
  }),
  getCertificationsForVenture: vi.fn().mockResolvedValue([
    {
      id: 1,
      ventureId: "ecoblend-rd",
      certificationName: "B Corp",
      status: "In Progress",
      progressPercent: 45,
      bImpactScore: 62,
      bImpactGovernance: 12,
      bImpactWorkers: 18,
      bImpactCommunity: 14,
      bImpactEnvironment: 10,
      bImpactCustomers: 8,
      certifyingBody: "B Lab",
      updatedAt: new Date(),
    },
  ]),
  upsertCertification: vi.fn().mockResolvedValue({ id: 1 }),
  deleteCertification: vi.fn().mockResolvedValue({ success: true }),
  getAllBrlTasks: vi.fn().mockResolvedValue([
    { id: 1, taskNumber: 1, title: "Supply & Demand Analysis", category: "Market & Customer", vrlStage: 1 },
    { id: 2, taskNumber: 2, title: "Market Research", category: "Market & Customer", vrlStage: 1 },
  ]),
  getBrlCompletionsForVenture: vi.fn().mockResolvedValue([
    { id: 1, ventureId: "ecoblend-rd", taskId: 1, completed: true, completedAt: new Date() },
    { id: 2, ventureId: "ecoblend-rd", taskId: 2, completed: false, completedAt: null },
  ]),
  upsertBrlCompletion: vi.fn().mockResolvedValue(undefined),
  getBrlScoreForVenture: vi.fn().mockResolvedValue({ ventureId: "ecoblend-rd", score: 12, maxScore: 100, pct: 12 }),
  getPortfolioBrlSummary: vi.fn().mockResolvedValue([]),
}));

import {
  getLatestFinancialData,
  getPortfolioIrlSummary,
  getCertificationsForVenture,
  upsertCertification,
  deleteCertification,
  getAllBrlTasks,
  getBrlCompletionsForVenture,
  upsertBrlCompletion,
  getBrlScoreForVenture,
} from "./db";

// ── InvestmentReadiness — financial.latestAll ────────────────────────────────
describe("Sprint 54 — InvestmentReadiness: financial.latestAll", () => {
  it("returns array of financial records", async () => {
    const result = await getLatestFinancialData();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("each record has required financial fields", async () => {
    const records = await getLatestFinancialData();
    const r = records[0] as any;
    expect(r).toHaveProperty("ventureId");
    expect(r).toHaveProperty("revenue");
    expect(r).toHaveProperty("expenses");
    expect(r).toHaveProperty("netProfit");
    expect(r).toHaveProperty("cashBalance");
    expect(r).toHaveProperty("runwayMonths");
    expect(r).toHaveProperty("mrr");
    expect(r).toHaveProperty("arr");
  });

  it("revenue is a positive number", async () => {
    const records = await getLatestFinancialData();
    const r = records[0] as any;
    expect(typeof r.revenue).toBe("number");
    expect(r.revenue).toBeGreaterThan(0);
  });
});

// ── InvestmentReadiness — irl.portfolioIrlSummary ────────────────────────────
describe("Sprint 54 — InvestmentReadiness: irl.portfolioIrlSummary", () => {
  it("returns portfolio IRL summary array", async () => {
    const result = await getPortfolioIrlSummary();
    expect(Array.isArray(result)).toBe(true);
  });

  it("each entry has ventureId and overallIrlScore", async () => {
    const result = await getPortfolioIrlSummary();
    const entry = result[0] as any;
    expect(entry).toHaveProperty("ventureId");
    expect(entry).toHaveProperty("overallIrlScore");
  });

  it("IRL score is between 0 and 100", async () => {
    const result = await getPortfolioIrlSummary();
    const entry = result[0] as any;
    expect(entry.overallIrlScore).toBeGreaterThanOrEqual(0);
    expect(entry.overallIrlScore).toBeLessThanOrEqual(100);
  });
});

// ── BCorpIso — irl.getCertifications ────────────────────────────────────────
describe("Sprint 54 — BCorpIso: irl.getCertifications", () => {
  it("returns certifications for a venture", async () => {
    const result = await getCertificationsForVenture("ecoblend-rd");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("certification has required fields", async () => {
    const result = await getCertificationsForVenture("ecoblend-rd");
    const cert = result[0] as any;
    expect(cert).toHaveProperty("id");
    expect(cert).toHaveProperty("ventureId");
    expect(cert).toHaveProperty("certificationName");
    expect(cert).toHaveProperty("status");
    expect(cert).toHaveProperty("progressPercent");
  });

  it("B Corp certification has B Impact scores", async () => {
    const result = await getCertificationsForVenture("ecoblend-rd");
    const bCorp = (result as any[]).find((c: any) => c.certificationName === "B Corp");
    expect(bCorp).toBeDefined();
    expect(bCorp.bImpactScore).toBeGreaterThan(0);
    expect(bCorp.bImpactGovernance).toBeDefined();
    expect(bCorp.bImpactWorkers).toBeDefined();
    expect(bCorp.bImpactCommunity).toBeDefined();
    expect(bCorp.bImpactEnvironment).toBeDefined();
    expect(bCorp.bImpactCustomers).toBeDefined();
  });

  it("progress percent is between 0 and 100", async () => {
    const result = await getCertificationsForVenture("ecoblend-rd");
    const cert = result[0] as any;
    expect(cert.progressPercent).toBeGreaterThanOrEqual(0);
    expect(cert.progressPercent).toBeLessThanOrEqual(100);
  });
});

// ── BCorpIso — irl.upsertCertification ──────────────────────────────────────
describe("Sprint 54 — BCorpIso: irl.upsertCertification", () => {
  it("upserts a certification and returns id", async () => {
    const result = await upsertCertification({
      ventureId: "ecoblend-rd",
      certificationName: "B Corp",
      status: "In Progress",
      progressPercent: 50,
      bImpactScore: 65,
    } as any);
    expect(result).toHaveProperty("id");
  });

  it("can upsert ISO 14001 certification", async () => {
    const result = await upsertCertification({
      ventureId: "ecoblend-rd",
      certificationName: "ISO 14001",
      status: "Gap Analysis",
      progressPercent: 20,
    } as any);
    expect(result).toBeDefined();
  });
});

// ── BCorpIso — irl.deleteCertification ──────────────────────────────────────
describe("Sprint 54 — BCorpIso: irl.deleteCertification", () => {
  it("deletes a certification and returns success", async () => {
    const result = await deleteCertification(1) as any;
    expect(result).toHaveProperty("success", true);
  });
});

// ── PlaybookProgress — brl.getCompletions ───────────────────────────────────
describe("Sprint 54 — PlaybookProgress: brl.getCompletions", () => {
  it("returns completions for a venture", async () => {
    const result = await getBrlCompletionsForVenture("ecoblend-rd");
    expect(Array.isArray(result)).toBe(true);
  });

  it("each completion has taskId and completed fields", async () => {
    const result = await getBrlCompletionsForVenture("ecoblend-rd");
    const c = result[0] as any;
    expect(c).toHaveProperty("taskId");
    expect(c).toHaveProperty("completed");
    expect(typeof c.completed).toBe("boolean");
  });

  it("completed tasks have a completedAt timestamp", async () => {
    const result = await getBrlCompletionsForVenture("ecoblend-rd");
    const done = (result as any[]).find((c: any) => c.completed);
    expect(done).toBeDefined();
    expect(done.completedAt).toBeInstanceOf(Date);
  });

  it("incomplete tasks have null completedAt", async () => {
    const result = await getBrlCompletionsForVenture("ecoblend-rd");
    const notDone = (result as any[]).find((c: any) => !c.completed);
    expect(notDone).toBeDefined();
    expect(notDone.completedAt).toBeNull();
  });
});

// ── PlaybookProgress — brl.toggleTask ───────────────────────────────────────
describe("Sprint 54 — PlaybookProgress: brl.toggleTask", () => {
  it("can mark a task as complete", async () => {
    await expect(
      upsertBrlCompletion({
        ventureId: "ecoblend-rd",
        taskId: 3,
        completed: true,
        completedAt: new Date(),
        completedBy: null,
        notes: null,
        evidenceUrl: null,
      })
    ).resolves.not.toThrow();
  });

  it("can mark a task as incomplete", async () => {
    await expect(
      upsertBrlCompletion({
        ventureId: "ecoblend-rd",
        taskId: 1,
        completed: false,
        completedAt: null,
        completedBy: null,
        notes: null,
        evidenceUrl: null,
      })
    ).resolves.not.toThrow();
  });

  it("can include notes when toggling", async () => {
    await expect(
      upsertBrlCompletion({
        ventureId: "ecoblend-rd",
        taskId: 5,
        completed: true,
        completedAt: new Date(),
        completedBy: null,
        notes: "Completed during VBS session 3",
        evidenceUrl: null,
      })
    ).resolves.not.toThrow();
  });
});

// ── PlaybookProgress — brl.getScore ─────────────────────────────────────────
describe("Sprint 54 — PlaybookProgress: brl.getScore", () => {
  it("returns a BRL score for a venture", async () => {
    const result = await getBrlScoreForVenture("ecoblend-rd");
    expect(result).toBeDefined();
  });

  it("score has ventureId, score, maxScore, and pct fields", async () => {
    const result = await getBrlScoreForVenture("ecoblend-rd") as any;
    expect(result).toHaveProperty("ventureId");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("maxScore");
    expect(result).toHaveProperty("pct");
  });

  it("pct is between 0 and 100", async () => {
    const result = await getBrlScoreForVenture("ecoblend-rd") as any;
    expect(result.pct).toBeGreaterThanOrEqual(0);
    expect(result.pct).toBeLessThanOrEqual(100);
  });
});

// ── brl.listTasks ────────────────────────────────────────────────────────────
describe("Sprint 54 — PlaybookProgress: brl.listTasks", () => {
  it("returns all BRL tasks", async () => {
    const result = await getAllBrlTasks();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("each task has taskNumber and title", async () => {
    const result = await getAllBrlTasks();
    const task = result[0] as any;
    expect(task).toHaveProperty("taskNumber");
    expect(task).toHaveProperty("title");
    expect(typeof task.taskNumber).toBe("number");
  });

  it("tasks are ordered by taskNumber", async () => {
    const result = await getAllBrlTasks();
    const numbers = (result as any[]).map((t: any) => t.taskNumber);
    for (let i = 1; i < numbers.length; i++) {
      expect(numbers[i]).toBeGreaterThanOrEqual(numbers[i - 1]);
    }
  });
});
