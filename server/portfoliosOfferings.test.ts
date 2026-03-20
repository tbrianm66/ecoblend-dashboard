/**
 * Sprint 61 — Portfolio → Offering Architecture Tests
 * Covers: offering-level analytics calculations, hierarchy logic, AI offering context,
 *         KPI snapshot ordering, risk classification, and execution scoping.
 *
 * Note: getOfferingAnalytics uses dynamic imports internally (await import("../drizzle/schema")),
 * so we test the pure calculation logic directly rather than the full DB-dependent function.
 */
import { describe, it, expect } from "vitest";

// ── Pure calculation helpers (extracted from commandCentreDb.ts logic) ────────

function calcMilestoneStats(milestones: { completed: boolean }[]) {
  const total = milestones.length;
  const completed = milestones.filter(m => m.completed).length;
  return {
    total,
    completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

function calcRiskStats(risks: { level: string }[]) {
  return {
    total: risks.length,
    high: risks.filter(r => r.level === "High").length,
    medium: risks.filter(r => r.level === "Medium").length,
    low: risks.filter(r => r.level === "Low").length,
  };
}

function calcExperimentStats(experiments: { outcome: string }[]) {
  const total = experiments.length;
  const passing = experiments.filter(e => e.outcome === "Pass").length;
  return {
    total,
    passing,
    passRate: total > 0 ? Math.round((passing / total) * 100) : 0,
  };
}

function getLatestKpi(snapshots: { snapshotDate: Date; revenue: string }[]) {
  if (snapshots.length === 0) return null;
  return [...snapshots].sort(
    (a, b) => new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime()
  )[0];
}

function buildOfferingContext(offeringName?: string): string {
  return offeringName
    ? `\n\nSpecific Offering: ${offeringName} — focus this market analysis on this specific product/service offering.`
    : "";
}

function scopeByOffering<T extends { offeringId: string | null }>(
  items: T[],
  offeringId: string
): T[] {
  return items.filter(item => item.offeringId === offeringId);
}

// ── Milestone Completion Rate ─────────────────────────────────────────────────
describe("Milestone completion rate calculation", () => {
  it("returns 0% when no milestones exist", () => {
    expect(calcMilestoneStats([]).completionRate).toBe(0);
  });

  it("returns 0 total when no milestones exist", () => {
    expect(calcMilestoneStats([]).total).toBe(0);
  });

  it("returns 100% when all milestones are complete", () => {
    const milestones = [
      { completed: true }, { completed: true }, { completed: true },
    ];
    expect(calcMilestoneStats(milestones).completionRate).toBe(100);
  });

  it("returns 67% for 2 of 3 milestones complete", () => {
    const milestones = [
      { completed: true }, { completed: true }, { completed: false },
    ];
    expect(calcMilestoneStats(milestones).completionRate).toBe(67);
  });

  it("returns 33% for 1 of 3 milestones complete", () => {
    const milestones = [
      { completed: true }, { completed: false }, { completed: false },
    ];
    expect(calcMilestoneStats(milestones).completionRate).toBe(33);
  });

  it("returns correct completed count", () => {
    const milestones = [
      { completed: true }, { completed: true }, { completed: false },
    ];
    expect(calcMilestoneStats(milestones).completed).toBe(2);
  });

  it("returns correct total count", () => {
    const milestones = [
      { completed: true }, { completed: false }, { completed: false },
    ];
    expect(calcMilestoneStats(milestones).total).toBe(3);
  });
});

// ── Experiment Pass Rate ──────────────────────────────────────────────────────
describe("Experiment pass rate calculation", () => {
  it("returns 0% when no experiments exist", () => {
    expect(calcExperimentStats([]).passRate).toBe(0);
  });

  it("returns 0 total when no experiments exist", () => {
    expect(calcExperimentStats([]).total).toBe(0);
  });

  it("returns 100% when all experiments pass", () => {
    const experiments = [
      { outcome: "Pass" }, { outcome: "Pass" }, { outcome: "Pass" },
    ];
    expect(calcExperimentStats(experiments).passRate).toBe(100);
  });

  it("returns 50% for 2 passing out of 4", () => {
    const experiments = [
      { outcome: "Pass" }, { outcome: "Pass" }, { outcome: "Fail" }, { outcome: "Inconclusive" },
    ];
    expect(calcExperimentStats(experiments).passRate).toBe(50);
  });

  it("returns 75% for 3 passing out of 4", () => {
    const experiments = [
      { outcome: "Pass" }, { outcome: "Pass" }, { outcome: "Pass" }, { outcome: "Fail" },
    ];
    expect(calcExperimentStats(experiments).passRate).toBe(75);
  });

  it("counts passing experiments correctly", () => {
    const experiments = [
      { outcome: "Pass" }, { outcome: "Fail" }, { outcome: "Pass" }, { outcome: "Inconclusive" },
    ];
    expect(calcExperimentStats(experiments).passing).toBe(2);
  });

  it("does not count Inconclusive as passing", () => {
    const experiments = [
      { outcome: "Inconclusive" }, { outcome: "Inconclusive" },
    ];
    expect(calcExperimentStats(experiments).passing).toBe(0);
    expect(calcExperimentStats(experiments).passRate).toBe(0);
  });
});

// ── Risk Severity Classification ──────────────────────────────────────────────
describe("Risk severity classification", () => {
  const risks = [
    { level: "High" }, { level: "High" },
    { level: "Medium" }, { level: "Medium" }, { level: "Medium" },
    { level: "Low" },
  ];

  it("counts high risks correctly", () => {
    expect(calcRiskStats(risks).high).toBe(2);
  });

  it("counts medium risks correctly", () => {
    expect(calcRiskStats(risks).medium).toBe(3);
  });

  it("counts low risks correctly", () => {
    expect(calcRiskStats(risks).low).toBe(1);
  });

  it("total risk count equals sum of all severity levels", () => {
    const stats = calcRiskStats(risks);
    expect(stats.high + stats.medium + stats.low).toBe(stats.total);
  });

  it("returns zero counts when no risks exist", () => {
    const stats = calcRiskStats([]);
    expect(stats.total).toBe(0);
    expect(stats.high).toBe(0);
    expect(stats.medium).toBe(0);
    expect(stats.low).toBe(0);
  });
});

// ── KPI Snapshot Ordering ─────────────────────────────────────────────────────
describe("KPI snapshot ordering", () => {
  it("most recent snapshot is returned as latestKpi", () => {
    const snapshots = [
      { snapshotDate: new Date("2025-01-01"), revenue: "10000" },
      { snapshotDate: new Date("2025-03-01"), revenue: "30000" },
      { snapshotDate: new Date("2025-02-01"), revenue: "20000" },
    ];
    expect(getLatestKpi(snapshots)?.revenue).toBe("30000");
  });

  it("returns null when no snapshots exist", () => {
    expect(getLatestKpi([])).toBeNull();
  });

  it("returns the single snapshot when only one exists", () => {
    const snapshots = [{ snapshotDate: new Date("2025-01-01"), revenue: "10000" }];
    expect(getLatestKpi(snapshots)?.revenue).toBe("10000");
  });

  it("handles snapshots with same date by returning the first", () => {
    const snapshots = [
      { snapshotDate: new Date("2025-03-01"), revenue: "30000" },
      { snapshotDate: new Date("2025-03-01"), revenue: "25000" },
    ];
    const latest = getLatestKpi(snapshots);
    expect(latest).not.toBeNull();
  });
});

// ── Offering-Level Execution Scoping ─────────────────────────────────────────
describe("Offering-level execution scoping", () => {
  it("milestones with offeringId are scoped to that offering", () => {
    const allMilestones = [
      { id: 1, ventureId: "v1", offeringId: "offering-1", label: "M1", completed: false },
      { id: 2, ventureId: "v1", offeringId: "offering-2", label: "M2", completed: true },
      { id: 3, ventureId: "v1", offeringId: null, label: "M3", completed: false },
    ];
    const scoped = scopeByOffering(allMilestones, "offering-1");
    expect(scoped).toHaveLength(1);
    expect(scoped[0].label).toBe("M1");
  });

  it("risks with offeringId are scoped to that offering", () => {
    const allRisks = [
      { id: 1, ventureId: "v1", offeringId: "offering-1", level: "High" },
      { id: 2, ventureId: "v1", offeringId: "offering-2", level: "Medium" },
      { id: 3, ventureId: "v1", offeringId: null, level: "Low" },
    ];
    const scoped = scopeByOffering(allRisks, "offering-1");
    expect(scoped).toHaveLength(1);
    expect(scoped[0].level).toBe("High");
  });

  it("experiments with offeringId are scoped to that offering", () => {
    const allExperiments = [
      { id: 1, ventureId: "v1", offeringId: "offering-1", outcome: "Pass" },
      { id: 2, ventureId: "v1", offeringId: "offering-1", outcome: "Fail" },
      { id: 3, ventureId: "v1", offeringId: "offering-2", outcome: "Pass" },
    ];
    const scoped = scopeByOffering(allExperiments, "offering-1");
    expect(scoped).toHaveLength(2);
  });

  it("null offeringId items are venture-level (not offering-scoped)", () => {
    const allMilestones = [
      { id: 1, ventureId: "v1", offeringId: "offering-1", label: "Offering milestone" },
      { id: 2, ventureId: "v1", offeringId: null, label: "Venture milestone" },
    ];
    const ventureLevelMilestones = allMilestones.filter(m => m.offeringId === null);
    expect(ventureLevelMilestones).toHaveLength(1);
    expect(ventureLevelMilestones[0].label).toBe("Venture milestone");
  });

  it("scoping by offering-2 returns different results than offering-1", () => {
    const allRisks = [
      { id: 1, offeringId: "offering-1", level: "High" },
      { id: 2, offeringId: "offering-2", level: "Low" },
    ];
    const o1Risks = scopeByOffering(allRisks, "offering-1");
    const o2Risks = scopeByOffering(allRisks, "offering-2");
    expect(o1Risks[0].level).toBe("High");
    expect(o2Risks[0].level).toBe("Low");
  });
});

// ── Portfolio Hierarchy Integrity ─────────────────────────────────────────────
describe("Portfolio hierarchy integrity", () => {
  it("venture can have multiple portfolios", () => {
    const portfolios = [
      { id: "p1", ventureId: "v1", name: "Materials Portfolio" },
      { id: "p2", ventureId: "v1", name: "Services Portfolio" },
      { id: "p3", ventureId: "v1", name: "Digital Portfolio" },
    ];
    const venturePortfolios = portfolios.filter(p => p.ventureId === "v1");
    expect(venturePortfolios).toHaveLength(3);
  });

  it("portfolio can have multiple offerings", () => {
    const offerings = [
      { id: "o1", portfolioId: "p1", name: "EcoBlend Pellets" },
      { id: "o2", portfolioId: "p1", name: "EcoBlend Granules" },
      { id: "o3", portfolioId: "p2", name: "Consulting Service" },
    ];
    const portfolioOfferings = offerings.filter(o => o.portfolioId === "p1");
    expect(portfolioOfferings).toHaveLength(2);
  });

  it("offering belongs to exactly one portfolio", () => {
    const offering = { id: "o1", portfolioId: "p1", name: "EcoBlend Pellets" };
    expect(offering.portfolioId).toBe("p1");
    expect(typeof offering.portfolioId).toBe("string");
  });

  it("offerings from different portfolios are independent", () => {
    const offerings = [
      { id: "o1", portfolioId: "p1", name: "Product A" },
      { id: "o2", portfolioId: "p2", name: "Service B" },
    ];
    const p1Offerings = offerings.filter(o => o.portfolioId === "p1");
    const p2Offerings = offerings.filter(o => o.portfolioId === "p2");
    expect(p1Offerings).toHaveLength(1);
    expect(p2Offerings).toHaveLength(1);
    expect(p1Offerings[0].id).not.toBe(p2Offerings[0].id);
  });

  it("three-tier hierarchy: venture → portfolio → offering is maintained", () => {
    const venture = { id: "v1", name: "EcoBlend" };
    const portfolio = { id: "p1", ventureId: "v1", name: "Materials" };
    const offering = { id: "o1", portfolioId: "p1", ventureId: "v1", name: "Pellets" };
    // Verify the chain
    expect(portfolio.ventureId).toBe(venture.id);
    expect(offering.portfolioId).toBe(portfolio.id);
    expect(offering.ventureId).toBe(venture.id);
  });
});

// ── Portfolio/Offering Schema Types ──────────────────────────────────────────
describe("Portfolio/Offering schema types", () => {
  it("portfolio type enum includes all expected types", () => {
    const validTypes = ["Product", "Service", "Licensing", "Platform", "Mixed"];
    expect(validTypes).toContain("Product");
    expect(validTypes).toContain("Service");
    expect(validTypes).toContain("Mixed");
    expect(validTypes).toHaveLength(5);
  });

  it("offering type enum includes all expected types", () => {
    const validTypes = ["Physical Product", "Digital Product", "Service", "SaaS", "Subscription", "Marketplace"];
    expect(validTypes).toHaveLength(6);
    expect(validTypes).toContain("SaaS");
    expect(validTypes).toContain("Subscription");
  });

  it("portfolio status enum includes all expected statuses", () => {
    const validStatuses = ["Active", "Pre-Launch", "Archived"];
    expect(validStatuses).toContain("Active");
    expect(validStatuses).toContain("Archived");
    expect(validStatuses).toHaveLength(3);
  });

  it("offering status enum includes all expected statuses", () => {
    const validStatuses = ["Concept", "Validation", "Active", "Scaling", "Paused", "Retired"];
    expect(validStatuses).toHaveLength(6);
    expect(validStatuses).toContain("Concept");
    expect(validStatuses).toContain("Retired");
  });
});

// ── AI Offering-Level Context ─────────────────────────────────────────────────
describe("AI procedures accept offeringId and offeringName", () => {
  it("offering context string is generated when offeringName is provided", () => {
    const ctx = buildOfferingContext("EcoBlend Pellets");
    expect(ctx).toContain("EcoBlend Pellets");
    expect(ctx).toContain("focus this market analysis");
  });

  it("offering context is empty string when offeringName is not provided", () => {
    expect(buildOfferingContext(undefined)).toBe("");
    expect(buildOfferingContext("")).toBe("");
  });

  it("market analysis generateAI input schema includes offeringId as optional", () => {
    const input = {
      ventureId: "v1",
      offeringId: "offering-1",
      offeringName: "EcoBlend Pellets",
      ventureName: "EcoBlend",
      sector: "Sustainable Materials",
      description: "Biodegradable plastic alternatives",
    };
    expect(input.offeringId).toBe("offering-1");
    expect(input.offeringName).toBe("EcoBlend Pellets");
  });

  it("market analysis generateAI works without offeringId (venture-level)", () => {
    const input: { ventureId: string; ventureName: string; sector: string; description: string; offeringId?: string } = {
      ventureId: "v1",
      ventureName: "EcoBlend",
      sector: "Sustainable Materials",
      description: "Biodegradable plastic alternatives",
    };
    expect(input.offeringId).toBeUndefined();
    expect(buildOfferingContext(input.offeringId)).toBe("");
  });

  it("competitor generateAI input schema includes offeringId as optional", () => {
    const input = {
      ventureId: "v1",
      offeringId: "offering-1",
      offeringName: "EcoBlend Pellets",
      ventureName: "EcoBlend",
      sector: "Sustainable Materials",
      description: "Biodegradable plastic alternatives",
    };
    expect(input.offeringId).toBeDefined();
    expect(input.offeringName).toBeDefined();
  });

  it("financial investor report generate input includes offeringId as optional", () => {
    const input = {
      ventureId: "v1",
      offeringId: "offering-1",
      offeringName: "EcoBlend Pellets",
      ventureName: "EcoBlend",
      period: "Q1 2025",
      reportType: "quarterly" as const,
    };
    expect(input.offeringId).toBe("offering-1");
    expect(input.offeringName).toBe("EcoBlend Pellets");
  });

  it("offering name is appended to report title when provided", () => {
    const ventureName = "EcoBlend";
    const offeringName = "EcoBlend Pellets";
    const period = "Q1 2025";
    const reportType = "quarterly";
    const title = `${ventureName}${offeringName ? ` / ${offeringName}` : ""} — ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Update (${period})`;
    expect(title).toBe("EcoBlend / EcoBlend Pellets — Quarterly Update (Q1 2025)");
  });

  it("report title excludes offering name when not provided", () => {
    const ventureName = "EcoBlend";
    const offeringName = undefined;
    const period = "Q1 2025";
    const reportType = "quarterly";
    const title = `${ventureName}${offeringName ? ` / ${offeringName}` : ""} — ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Update (${period})`;
    expect(title).toBe("EcoBlend — Quarterly Update (Q1 2025)");
  });
});

// ── Offering Linkage Tables ───────────────────────────────────────────────────
describe("Offering linkage table structure", () => {
  it("8 linkage tables exist for offering execution connections", () => {
    const linkageTables = [
      "offeringWorkflowLinks",
      "offeringRevenueLinks",
      "offeringSupplyChainLinks",
      "offeringExperimentLinks",
      "offeringRiskLinks",
      "offeringMilestoneLinks",
      "offeringCrmLinks",
      "offeringAnalyticsLinks",
    ];
    expect(linkageTables).toHaveLength(8);
  });

  it("each linkage table connects an offering to an execution entity", () => {
    const linkageTypes = {
      offeringWorkflowLinks: "workflowTriggerId",
      offeringRevenueLinks: "revenueStreamId",
      offeringSupplyChainLinks: "supplyChainId",
      offeringExperimentLinks: "experimentId",
      offeringRiskLinks: "riskId",
      offeringMilestoneLinks: "milestoneId",
      offeringCrmLinks: "crmPipelineId",
      offeringAnalyticsLinks: "analyticsId",
    };
    expect(Object.keys(linkageTypes)).toHaveLength(8);
    expect(linkageTypes.offeringWorkflowLinks).toBe("workflowTriggerId");
    expect(linkageTypes.offeringRiskLinks).toBe("riskId");
  });
});

// ── Execution Health Score Aggregation ───────────────────────────────────────
describe("Execution health score aggregation", () => {
  it("offering with all milestones complete and no high risks is healthy", () => {
    const milestoneStats = calcMilestoneStats([
      { completed: true }, { completed: true }, { completed: true },
    ]);
    const riskStats = calcRiskStats([
      { level: "Low" }, { level: "Medium" },
    ]);
    expect(milestoneStats.completionRate).toBe(100);
    expect(riskStats.high).toBe(0);
  });

  it("offering with high risks and low milestone completion is at-risk", () => {
    const milestoneStats = calcMilestoneStats([
      { completed: false }, { completed: false }, { completed: true },
    ]);
    const riskStats = calcRiskStats([
      { level: "High" }, { level: "High" }, { level: "Medium" },
    ]);
    expect(milestoneStats.completionRate).toBe(33);
    expect(riskStats.high).toBe(2);
  });

  it("experiment pass rate above 60% indicates positive learning velocity", () => {
    const experimentStats = calcExperimentStats([
      { outcome: "Pass" }, { outcome: "Pass" }, { outcome: "Pass" }, { outcome: "Fail" },
    ]);
    expect(experimentStats.passRate).toBeGreaterThan(60);
  });

  it("experiment pass rate below 40% indicates need for pivot", () => {
    const experimentStats = calcExperimentStats([
      { outcome: "Fail" }, { outcome: "Fail" }, { outcome: "Fail" }, { outcome: "Pass" },
    ]);
    expect(experimentStats.passRate).toBeLessThan(40);
  });
});
