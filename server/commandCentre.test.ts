/**
 * Command Centre — unit tests
 * Tests the aggregation and data-shape contracts for all Command Centre helpers.
 * Uses mocked DB responses that correctly simulate Drizzle's thenable query chain.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock getDb ────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({ getDb: vi.fn() }));
import { getDb } from "./db";

import {
  getPortfolioSummary,
  getVrlDistribution,
  getOpportunityFunnel,
  getPmHealth,
  getLearningVelocity,
  getEcosystemNodes,
} from "./commandCentreDb";

// ── Drizzle mock factory ──────────────────────────────────────────────────────
// Drizzle queries are thenables: db.select().from(table) resolves to an array.
// We simulate this by making each chained method return a thenable that resolves
// to the provided data array.
function makeQueryChain(resolveWith: unknown[]) {
  const thenable = {
    then: (resolve: (v: unknown) => void) => resolve(resolveWith),
    where: () => thenable,
    leftJoin: () => thenable,
    orderBy: () => thenable,
    limit: () => thenable,
    groupBy: () => thenable,
  };
  return thenable;
}

function makeDb(responses: unknown[][]) {
  let callIndex = 0;
  const db = {
    select: vi.fn(() => ({
      from: vi.fn(() => {
        const chain = makeQueryChain(responses[callIndex] ?? []);
        callIndex++;
        return chain;
      }),
    })),
  };
  return db;
}

// ── Portfolio Summary ─────────────────────────────────────────────────────────
describe("getPortfolioSummary", () => {
  const mockVentures = [
    { id: "v1", name: "EcoFuel",  status: "Active",     vrl: 3, trl: 6, color: "#51AF37", investmentReady: true,  isInternalLab: false },
    { id: "v2", name: "AquaLoop", status: "Scaling",    vrl: 4, trl: 8, color: "#3A97D3", investmentReady: true,  isInternalLab: false },
    { id: "v3", name: "SoilSync", status: "Pre-Launch", vrl: 1, trl: 2, color: "#F49C13", investmentReady: false, isInternalLab: false },
    { id: "v4", name: "BioCarb",  status: "Paused",     vrl: 2, trl: 4, color: "#9B59B6", investmentReady: false, isInternalLab: true  },
  ];

  beforeEach(() => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(makeDb([mockVentures]));
  });

  it("counts total ventures correctly", async () => {
    expect((await getPortfolioSummary())?.total).toBe(4);
  });

  it("counts active ventures correctly", async () => {
    expect((await getPortfolioSummary())?.active).toBe(1);
  });

  it("counts scaling ventures correctly", async () => {
    expect((await getPortfolioSummary())?.scaling).toBe(1);
  });

  it("counts pre-launch ventures correctly", async () => {
    expect((await getPortfolioSummary())?.prelaunch).toBe(1);
  });

  it("counts paused ventures correctly", async () => {
    expect((await getPortfolioSummary())?.paused).toBe(1);
  });

  it("counts investment-ready ventures correctly", async () => {
    expect((await getPortfolioSummary())?.investmentReady).toBe(2);
  });

  it("calculates average VRL correctly", async () => {
    // (3+4+1+2)/4 = 2.5
    expect((await getPortfolioSummary())?.avgVrl).toBe(2.5);
  });

  it("calculates average TRL correctly", async () => {
    // (6+8+2+4)/4 = 5
    expect((await getPortfolioSummary())?.avgTrl).toBe(5);
  });

  it("returns ventures array with correct length", async () => {
    expect((await getPortfolioSummary())?.ventures).toHaveLength(4);
  });

  it("returns null when db is unavailable", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    expect(await getPortfolioSummary()).toBeNull();
  });

  it("returns zero averages when no ventures", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(makeDb([[]]));
    const result = await getPortfolioSummary();
    expect(result?.total).toBe(0);
    expect(result?.avgVrl).toBe(0);
    expect(result?.avgTrl).toBe(0);
  });
});

// ── VRL Distribution ──────────────────────────────────────────────────────────
describe("getVrlDistribution", () => {
  beforeEach(() => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(makeDb([[
      { id: "v1", vrl: 1 }, { id: "v2", vrl: 1 },
      { id: "v3", vrl: 2 }, { id: "v4", vrl: 3 },
    ]]));
  });

  it("returns distribution with exactly 9 stages", async () => {
    expect((await getVrlDistribution())?.distribution).toHaveLength(9);
  });

  it("counts stage 1 correctly", async () => {
    const dist = (await getVrlDistribution())?.distribution;
    expect(dist?.find(d => d.stage === 1)?.count).toBe(2);
  });

  it("counts stage 2 correctly", async () => {
    const dist = (await getVrlDistribution())?.distribution;
    expect(dist?.find(d => d.stage === 2)?.count).toBe(1);
  });

  it("counts stage 4 as 0 when no ventures at that stage", async () => {
    const dist = (await getVrlDistribution())?.distribution;
    expect(dist?.find(d => d.stage === 4)?.count).toBe(0);
  });

  it("returns correct ventures array length", async () => {
    expect((await getVrlDistribution())?.ventures).toHaveLength(4);
  });

  it("returns null when db is unavailable", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    expect(await getVrlDistribution()).toBeNull();
  });
});

// ── Opportunity Funnel ────────────────────────────────────────────────────────
describe("getOpportunityFunnel", () => {
  beforeEach(() => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(makeDb([
      // All opportunities
      [
        { id: 1, status: "Under Assessment" },
        { id: 2, status: "Under Assessment" },
        { id: 3, status: "Approved for VRL" },
        { id: 4, status: "Rejected" },
        { id: 5, status: "Deferred" },
      ],
      // POS scores
      [
        { opportunityId: 1, posScore: "3.5", posClassification: "Good" },
        { opportunityId: 2, posScore: "4.2", posClassification: "Excellent" },
        { opportunityId: 3, posScore: "4.8", posClassification: "Exceptional" },
      ],
      // Reviews
      [
        { decision: "Approve for VRL" },
        { decision: "Reject" },
        { decision: "Defer" },
      ],
    ]));
  });

  it("counts identified opportunities correctly", async () => {
    expect((await getOpportunityFunnel())?.identified).toBe(5);
  });

  it("counts scored opportunities correctly", async () => {
    expect((await getOpportunityFunnel())?.scored).toBe(3);
  });

  it("counts approved correctly", async () => {
    expect((await getOpportunityFunnel())?.approved).toBe(1);
  });

  it("counts rejected correctly", async () => {
    expect((await getOpportunityFunnel())?.rejected).toBe(1);
  });

  it("calculates conversion rate as 20% (1/5)", async () => {
    expect((await getOpportunityFunnel())?.conversionRate).toBe(20);
  });

  it("returns zero conversion rate when no opportunities", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(makeDb([[], [], []]));
    expect((await getOpportunityFunnel())?.conversionRate).toBe(0);
  });

  it("returns null when db is unavailable", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    expect(await getOpportunityFunnel()).toBeNull();
  });
});

// ── PM Health ─────────────────────────────────────────────────────────────────
describe("getPmHealth", () => {
  beforeEach(() => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(makeDb([
      // Programs
      [
        { id: 1, status: "In Progress", budget: 50000, budgetSpent: 25000 },
        { id: 2, status: "Completed",   budget: 30000, budgetSpent: 30000 },
        { id: 3, status: "Planning",    budget: 20000, budgetSpent: 0     },
      ],
      // Tasks
      [
        { id: 1, kanbanStatus: "Done",        dueDate: "2024-01-01", priority: "Medium" },
        { id: 2, kanbanStatus: "Done",        dueDate: "2024-01-01", priority: "Medium" },
        { id: 3, kanbanStatus: "In Progress", dueDate: "2025-01-01", priority: "High"   },
        { id: 4, kanbanStatus: "In Progress", dueDate: "2020-01-01", priority: "High"   },
        { id: 5, kanbanStatus: "In Progress", dueDate: "2020-01-01", priority: "High"   },
      ],
      // Milestones
      [],
      // Execution risks
      [
        { id: 1, riskLevel: "Critical", status: "Open" },
        { id: 2, riskLevel: "High",     status: "Open" },
        { id: 3, riskLevel: "Medium",   status: "Open" },
      ],
    ]));
  });

  it("counts total programs correctly", async () => {
    expect((await getPmHealth())?.totalPrograms).toBe(3);
  });

  it("counts active (In Progress) programs correctly", async () => {
    expect((await getPmHealth())?.activePrograms).toBe(1);
  });

  it("counts completed programs correctly", async () => {
    expect((await getPmHealth())?.completedPrograms).toBe(1);
  });

  it("counts total tasks correctly", async () => {
    expect((await getPmHealth())?.totalTasks).toBe(5);
  });

  it("counts overdue tasks correctly (past dueDate, not Done)", async () => {
    // Tasks 3, 4, 5 all have dueDate in the past and kanbanStatus !== 'Done'
    expect((await getPmHealth())?.overdueTasks).toBe(3);
  });

  it("calculates task completion rate as 40% (2 done / 5 total)", async () => {
    expect((await getPmHealth())?.taskCompletionRate).toBe(40);
  });

  it("calculates budget utilisation as 55% (55000/100000)", async () => {
    expect((await getPmHealth())?.budgetUtilisation).toBe(55);
  });

  it("returns 0 budget utilisation when no programs", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(makeDb([[], [], [], []]));
    expect((await getPmHealth())?.budgetUtilisation).toBe(0);
  });

  it("returns null when db is unavailable", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    expect(await getPmHealth()).toBeNull();
  });
});

// ── Learning Velocity ─────────────────────────────────────────────────────────
describe("getLearningVelocity", () => {
  beforeEach(() => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(makeDb([[
      { ventureId: "v1", outcome: "Pass" },
      { ventureId: "v1", outcome: "Pass" },
      { ventureId: "v1", outcome: "Fail" },
      { ventureId: "v2", outcome: "Pass" },
      { ventureId: "v2", outcome: "Inconclusive" },
    ]]));
  });

  it("counts total experiments correctly", async () => {
    expect((await getLearningVelocity())?.totalExperiments).toBe(5);
  });

  it("calculates portfolio pass rate as 60% (3/5)", async () => {
    expect((await getLearningVelocity())?.portfolioPassRate).toBe(60);
  });

  it("calculates v1 pass rate as 67% (2/3)", async () => {
    const result = await getLearningVelocity();
    const v1 = result?.byVenture.find(v => v.ventureId === "v1");
    expect(v1?.passRate).toBe(67);
  });

  it("calculates v2 pass rate as 50% (1/2)", async () => {
    const result = await getLearningVelocity();
    const v2 = result?.byVenture.find(v => v.ventureId === "v2");
    expect(v2?.passRate).toBe(50);
  });

  it("returns 0 pass rate when no experiments", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(makeDb([[]]));
    const result = await getLearningVelocity();
    expect(result?.portfolioPassRate).toBe(0);
    expect(result?.totalExperiments).toBe(0);
  });

  it("returns null when db is unavailable", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    expect(await getLearningVelocity()).toBeNull();
  });
});

// ── Ecosystem Nodes ───────────────────────────────────────────────────────────
describe("getEcosystemNodes", () => {
  beforeEach(() => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(makeDb([
      // Ecosystem map nodes
      [
        { ventureId: "v1", posX: "25", posY: "30", nodeSize: "40", nodeColor: null,      linkedVentureIds: null, linkType: "None",               displayLabel: null, tooltipText: null },
        { ventureId: "v2", posX: "70", posY: "60", nodeSize: "50", nodeColor: "#3A97D3", linkedVentureIds: "v1", linkType: "Technology Sharing", displayLabel: null, tooltipText: null },
      ],
      // Ventures for merge
      [
        { id: "v1", name: "EcoFuel",  color: "#51AF37", vrl: 3, trl: 6, status: "Active"  },
        { id: "v2", name: "AquaLoop", color: "#3A97D3", vrl: 4, trl: 8, status: "Scaling" },
      ],
    ]));
  });

  it("returns nodes with merged venture data", async () => {
    expect(await getEcosystemNodes()).toHaveLength(2);
  });

  it("merges venture name onto node", async () => {
    const result = await getEcosystemNodes();
    expect(result?.find(n => n.ventureId === "v1")?.name).toBe("EcoFuel");
  });

  it("uses venture colour when nodeColor is null", async () => {
    const result = await getEcosystemNodes();
    expect(result?.find(n => n.ventureId === "v1")?.color).toBe("#51AF37");
  });

  it("uses nodeColor override when set", async () => {
    const result = await getEcosystemNodes();
    expect(result?.find(n => n.ventureId === "v2")?.color).toBe("#3A97D3");
  });

  it("returns empty array when no nodes exist", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(makeDb([[], []]));
    expect(await getEcosystemNodes()).toHaveLength(0);
  });

  it("returns empty array when db is unavailable", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    expect(await getEcosystemNodes()).toEqual([]);
  });
});
