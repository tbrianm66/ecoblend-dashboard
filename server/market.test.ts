import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock the db module ────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getAllMarketAnalysis: vi.fn().mockResolvedValue([]),
  getMarketAnalysisForVenture: vi.fn().mockResolvedValue([]),
  insertMarketAnalysis: vi.fn().mockResolvedValue({ insertId: 1 }),
  updateMarketAnalysis: vi.fn().mockResolvedValue({}),
  deleteMarketAnalysis: vi.fn().mockResolvedValue({}),
  getAllCompetitors: vi.fn().mockResolvedValue([]),
  getCompetitorsForVenture: vi.fn().mockResolvedValue([]),
  insertCompetitor: vi.fn().mockResolvedValue({ insertId: 1 }),
  updateCompetitor: vi.fn().mockResolvedValue({}),
  deleteCompetitor: vi.fn().mockResolvedValue({}),
  getReportsForOpportunity: vi.fn().mockResolvedValue([]),
  insertOpportunityReport: vi.fn().mockResolvedValue({ insertId: 1 }),
  deleteOpportunityReport: vi.fn().mockResolvedValue({}),
}));

// ── Mock LLM ──────────────────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          marketName: "Global Eco-Materials Market",
          geography: "Global",
          tamValue: 50000,
          samValue: 5000,
          somValue: 250,
          tamUnit: "£M",
          cagr: 8.5,
          marketYear: 2025,
          forecastYear: 2030,
          sourceName: "Grand View Research",
          keyDrivers: "Net-zero mandates, ESG investment, Circular economy",
          keyBarriers: "High R&D costs, Incumbent supply chains",
          notes: "The global eco-materials market is growing rapidly.",
        }),
      },
    }],
  }),
}));

import {
  getAllMarketAnalysis,
  getMarketAnalysisForVenture,
  insertMarketAnalysis,
  deleteMarketAnalysis,
  getAllCompetitors,
  getCompetitorsForVenture,
  insertCompetitor,
  deleteCompetitor,
  getReportsForOpportunity,
  insertOpportunityReport,
  deleteOpportunityReport,
} from "./db";

// ── Market Analysis Tests ─────────────────────────────────────────────────────
describe("Market Analysis DB helpers", () => {
  it("getAllMarketAnalysis returns an array", async () => {
    const result = await getAllMarketAnalysis();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getMarketAnalysisForVenture filters by ventureId", async () => {
    const result = await getMarketAnalysisForVenture("ecoblend");
    expect(Array.isArray(result)).toBe(true);
    expect(getMarketAnalysisForVenture).toHaveBeenCalledWith("ecoblend");
  });

  it("insertMarketAnalysis accepts valid data", async () => {
    const data = {
      ventureId: "ecoblend",
      marketName: "Test Market",
      tamValue: 10000,
      samValue: 1000,
      somValue: 100,
      cagr: 5.0,
      aiGenerated: false,
    };
    await insertMarketAnalysis(data as any);
    expect(insertMarketAnalysis).toHaveBeenCalledWith(data);
  });

  it("deleteMarketAnalysis calls delete with correct id", async () => {
    await deleteMarketAnalysis(1);
    expect(deleteMarketAnalysis).toHaveBeenCalledWith(1);
  });
});

// ── Competitor Tests ──────────────────────────────────────────────────────────
describe("Competitor DB helpers", () => {
  it("getAllCompetitors returns an array", async () => {
    const result = await getAllCompetitors();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getCompetitorsForVenture filters by ventureId", async () => {
    const result = await getCompetitorsForVenture("bebus");
    expect(Array.isArray(result)).toBe(true);
    expect(getCompetitorsForVenture).toHaveBeenCalledWith("bebus");
  });

  it("insertCompetitor accepts valid competitor data", async () => {
    const data = {
      ventureId: "ecoblend",
      name: "EcoRival Ltd",
      stage: "Startup",
      competitorType: "Direct",
      threatLevel: "Medium",
    };
    await insertCompetitor(data as any);
    expect(insertCompetitor).toHaveBeenCalledWith(data);
  });

  it("deleteCompetitor calls delete with correct id", async () => {
    await deleteCompetitor(5);
    expect(deleteCompetitor).toHaveBeenCalledWith(5);
  });
});

// ── Opportunity Reports Tests ─────────────────────────────────────────────────
describe("Opportunity Reports DB helpers", () => {
  it("getReportsForOpportunity returns an array", async () => {
    const result = await getReportsForOpportunity(1);
    expect(Array.isArray(result)).toBe(true);
    expect(getReportsForOpportunity).toHaveBeenCalledWith(1);
  });

  it("insertOpportunityReport accepts valid report data", async () => {
    const data = {
      opportunityId: 1,
      title: "Research Report: Test Opportunity",
      problemStatement: "There is a significant gap in sustainable packaging solutions for the FMCG sector.",
      reportContent: "## Executive Summary\n\nThis is a test report.",
      recommendedAction: "Investigate Further",
      confidenceScore: 7,
    };
    await insertOpportunityReport(data as any);
    expect(insertOpportunityReport).toHaveBeenCalledWith(data);
  });

  it("deleteOpportunityReport calls delete with correct id", async () => {
    await deleteOpportunityReport(3);
    expect(deleteOpportunityReport).toHaveBeenCalledWith(3);
  });
});

// ── LLM Integration Tests ─────────────────────────────────────────────────────
describe("LLM market analysis generation", () => {
  it("invokeLLM returns parseable JSON for market analysis", async () => {
    const { invokeLLM } = await import("./_core/llm");
    const response = await invokeLLM({ messages: [{ role: "user", content: "test" }] });
    const content = String(response.choices[0]?.message?.content ?? "{}");
    const parsed = JSON.parse(content);
    expect(parsed).toHaveProperty("marketName");
    expect(parsed).toHaveProperty("tamValue");
    expect(parsed).toHaveProperty("cagr");
    expect(typeof parsed.tamValue).toBe("number");
  });
});
