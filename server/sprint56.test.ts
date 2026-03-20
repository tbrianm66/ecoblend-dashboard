/**
 * Sprint 56 — Marketing, Brand PR & Brand Readiness Router Tests
 * Tests the marketingBrandRouter procedures.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks (hoisted) ───────────────────────────────────────────────────────────
vi.mock("../server/db", () => ({
  getDb: vi.fn(),
}));

vi.mock("../drizzle/schema", () => ({
  marketingCampaigns: { ventureId: "ventureId", status: "status", createdAt: "createdAt" },
  marketingChannelScores: { ventureId: "ventureId" },
  brandReadinessScores: { ventureId: "ventureId", id: "id", assessedAt: "assessedAt" },
  brandChecklistItems: { ventureId: "ventureId", id: "id", category: "category", completed: "completed", completedAt: "completedAt" },
  pressReleases: { ventureId: "ventureId", status: "status", id: "id", createdAt: "createdAt" },
  newsletterCampaigns: { ventureId: "ventureId", status: "status", id: "id", createdAt: "createdAt" },
  mediaCoverage: { ventureId: "ventureId", sentiment: "sentiment", id: "id", createdAt: "createdAt" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val, op: "eq" })),
  and: vi.fn((...args) => ({ args, op: "and" })),
  desc: vi.fn((col) => ({ col, op: "desc" })),
}));

import { getDb } from "../server/db";
import { marketingBrandRouter } from "../server/marketingBrand.router";

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeMockDb(overrides: Record<string, any> = {}) {
  const db: any = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([{ insertId: 42 }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    ...overrides,
  };
  (getDb as any).mockResolvedValue(db);
  return db;
}

async function callProcedure(path: string[], input: unknown) {
  let node: any = marketingBrandRouter;
  for (const part of path) {
    node = node._def?.record?.[part] ?? node[part];
  }
  const resolver = node?._def?.resolver ?? node?.resolver;
  if (!resolver) throw new Error(`Procedure not found: ${path.join(".")}`);
  return resolver({ input, ctx: {} } as any);
}

// ── Campaigns ─────────────────────────────────────────────────────────────────
describe("marketingBrand.campaigns", () => {
  beforeEach(() => { vi.clearAllMocks(); makeMockDb(); });

  it("list returns empty array when no campaigns", async () => {
    const result = await callProcedure(["campaigns", "list"], { ventureId: "ecoblend" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsert creates a new campaign and returns id", async () => {
    const result = await callProcedure(["campaigns", "upsert"], {
      ventureId: "ecoblend",
      name: "Q1 Launch",
      channel: "Email",
      status: "Active",
      budget: 5000,
      spend: 2000,
      leads: 150,
      conversions: 12,
    });
    expect(result).toHaveProperty("id", 42);
  });

  it("upsert updates an existing campaign", async () => {
    const db = makeMockDb();
    db.where.mockResolvedValue(undefined);
    const result = await callProcedure(["campaigns", "upsert"], {
      id: 1,
      ventureId: "ecoblend",
      name: "Q1 Launch Updated",
      channel: "Email",
      status: "Completed",
      budget: 5000,
      spend: 4800,
      leads: 200,
      conversions: 18,
    });
    expect(result).toHaveProperty("id", 1);
  });

  it("delete removes a campaign", async () => {
    const db = makeMockDb();
    db.where.mockResolvedValue(undefined);
    const result = await callProcedure(["campaigns", "delete"], { id: 1 });
    expect(result).toHaveProperty("success", true);
  });

  it("getSummary returns aggregated metrics", async () => {
    // getSummary uses select().from().where() chain (no orderBy)
    const db = makeMockDb();
    db.where.mockResolvedValue([
      { status: "Active", budget: 5000, spent: 2000, leads: 150, conversions: 12 },
      { status: "Completed", budget: 3000, spent: 3000, leads: 80, conversions: 8 },
    ]);
    const result = await callProcedure(["campaigns", "getSummary"], {});
    expect(result).toHaveProperty("total", 2);
    expect(result).toHaveProperty("totalBudget", 8000);
    expect(result).toHaveProperty("totalLeads", 230);
  });
});

// ── Channel Scores ────────────────────────────────────────────────────────────
describe("marketingBrand.channelScores", () => {
  beforeEach(() => { vi.clearAllMocks(); makeMockDb(); });

  it("list returns channel scores for a venture", async () => {
    // channelScores.list returns select().from().where() directly (no orderBy)
    const db = makeMockDb();
    db.where.mockResolvedValue([]);
    const result = await callProcedure(["channelScores", "list"], { ventureId: "ecoblend" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsert creates a new channel score", async () => {
    makeMockDb({ values: vi.fn().mockResolvedValue([{ insertId: 7 }]) });
    const result = await callProcedure(["channelScores", "upsert"], {
      ventureId: "ecoblend",
      channel: "LinkedIn",
      score: 78,
      notes: "Strong B2B presence",
    });
    expect(result).toHaveProperty("id", 7);
  });
});

// ── Brand Readiness ───────────────────────────────────────────────────────────
describe("marketingBrand.brandReadiness", () => {
  beforeEach(() => { vi.clearAllMocks(); makeMockDb({ values: vi.fn().mockResolvedValue([{ insertId: 99 }]) }); });

  it("getScores returns empty array for new venture", async () => {
    const result = await callProcedure(["brandReadiness", "getScores"], { ventureId: "ecoblend" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsertScore creates a new score", async () => {
    const result = await callProcedure(["brandReadiness", "upsertScore"], {
      ventureId: "ecoblend",
      dimension: "Visual Identity",
      score: 85,
      notes: "Strong logo system",
    });
    expect(result).toHaveProperty("id", 99);
  });

  it("upsertScore updates an existing score", async () => {
    const db = makeMockDb();
    db.where.mockResolvedValue(undefined);
    const result = await callProcedure(["brandReadiness", "upsertScore"], {
      id: 1,
      ventureId: "ecoblend",
      dimension: "Visual Identity",
      score: 90,
    });
    expect(result).toHaveProperty("id", 1);
  });

  it("getChecklist returns empty array for new venture", async () => {
    const result = await callProcedure(["brandReadiness", "getChecklist"], { ventureId: "ecoblend" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsertChecklistItem creates a new item", async () => {
    const result = await callProcedure(["brandReadiness", "upsertChecklistItem"], {
      ventureId: "ecoblend",
      category: "Identity",
      item: "Brand guidelines complete",
      completed: false,
    });
    expect(result).toHaveProperty("id", 99);
  });

  it("toggleChecklistItem marks item as completed", async () => {
    const db = makeMockDb();
    db.where.mockResolvedValue(undefined);
    const result = await callProcedure(["brandReadiness", "toggleChecklistItem"], { id: 1, completed: true });
    expect(result).toHaveProperty("success", true);
  });

  it("toggleChecklistItem marks item as incomplete", async () => {
    const db = makeMockDb();
    db.where.mockResolvedValue(undefined);
    const result = await callProcedure(["brandReadiness", "toggleChecklistItem"], { id: 1, completed: false });
    expect(result).toHaveProperty("success", true);
  });

  it("deleteChecklistItem removes an item", async () => {
    const db = makeMockDb();
    db.where.mockResolvedValue(undefined);
    const result = await callProcedure(["brandReadiness", "deleteChecklistItem"], { id: 1 });
    expect(result).toHaveProperty("success", true);
  });

  it("getOverallScore returns zero scores for empty venture", async () => {
    // getDb() is called once; db.where() is called twice (scores + checklist)
    const whereMock = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    (getDb as any).mockResolvedValue({
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: whereMock,
    });
    const result = await callProcedure(["brandReadiness", "getOverallScore"], { ventureId: "ecoblend" });
    expect(result).toHaveProperty("avgScore", 0);
    expect(result).toHaveProperty("checklistTotal", 0);
    expect(result).toHaveProperty("checklistPct", 0);
  });

  it("getOverallScore calculates correctly with data", async () => {
    // getDb() is called once; db.where() is called twice (scores first, then checklist)
    const whereMock = vi.fn()
      .mockResolvedValueOnce([{ score: 80, dimension: "Visual Identity" }, { score: 60, dimension: "Brand Messaging" }])
      .mockResolvedValueOnce([{ completed: 1 }, { completed: 0 }, { completed: 1 }]);
    (getDb as any).mockResolvedValue({
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: whereMock,
    });
    const result = await callProcedure(["brandReadiness", "getOverallScore"], { ventureId: "ecoblend" });
    expect(result.avgScore).toBe(70);
    expect(result.checklistTotal).toBe(3);
    expect(result.checklistDone).toBe(2);
    expect(result.checklistPct).toBe(67);
  });
});

// ── Press Releases ────────────────────────────────────────────────────────────
describe("marketingBrand.pressReleases", () => {
  beforeEach(() => { vi.clearAllMocks(); makeMockDb({ values: vi.fn().mockResolvedValue([{ insertId: 55 }]) }); });

  it("list returns empty array", async () => {
    const result = await callProcedure(["pressReleases", "list"], {});
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsert creates a press release", async () => {
    const result = await callProcedure(["pressReleases", "upsert"], {
      ventureId: "ecoblend",
      title: "EcoRace Secures Series A",
      status: "Draft",
    });
    expect(result).toHaveProperty("id", 55);
  });

  it("upsert updates a press release", async () => {
    const db = makeMockDb();
    db.where.mockResolvedValue(undefined);
    const result = await callProcedure(["pressReleases", "upsert"], {
      id: 1,
      ventureId: "ecoblend",
      title: "EcoRace Secures Series A — Updated",
      status: "Published",
    });
    expect(result).toHaveProperty("id", 1);
  });

  it("delete removes a press release", async () => {
    const db = makeMockDb();
    db.where.mockResolvedValue(undefined);
    const result = await callProcedure(["pressReleases", "delete"], { id: 1 });
    expect(result).toHaveProperty("success", true);
  });
});

// ── Newsletter ────────────────────────────────────────────────────────────────
describe("marketingBrand.newsletter", () => {
  beforeEach(() => { vi.clearAllMocks(); makeMockDb({ values: vi.fn().mockResolvedValue([{ insertId: 33 }]) }); });

  it("list returns empty array", async () => {
    const result = await callProcedure(["newsletter", "list"], {});
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsert creates a newsletter", async () => {
    const result = await callProcedure(["newsletter", "upsert"], {
      ventureId: "ecoblend",
      subject: "EcoRace Monthly Update — March 2026",
      status: "Draft",
    });
    expect(result).toHaveProperty("id", 33);
  });

  it("delete removes a newsletter", async () => {
    const db = makeMockDb();
    db.where.mockResolvedValue(undefined);
    const result = await callProcedure(["newsletter", "delete"], { id: 1 });
    expect(result).toHaveProperty("success", true);
  });

  it("getSummary returns zero metrics for empty data", async () => {
    // getSummary uses .where(undefined) which resolves to [] via the mock chain
    const db = makeMockDb();
    // where chain: select().from().where() → []
    db.where.mockResolvedValue([]);
    const result = await callProcedure(["newsletter", "getSummary"], {});
    expect(result).toHaveProperty("total", 0);
    expect(result).toHaveProperty("sent", 0);
    expect(result).toHaveProperty("avgOpenRate", 0);
  });

  it("getSummary calculates avg open rate for sent newsletters", async () => {
    const db = makeMockDb();
    db.where.mockResolvedValue([
      { status: "Sent", recipients: 1000, openRate: 40, clickRate: 8, unsubscribes: 5 },
      { status: "Sent", recipients: 800, openRate: 36, clickRate: 6, unsubscribes: 3 },
      { status: "Draft", recipients: 0, openRate: 0, clickRate: 0, unsubscribes: 0 },
    ]);
    const result = await callProcedure(["newsletter", "getSummary"], {});
    expect(result.total).toBe(3);
    expect(result.sent).toBe(2);
    expect(result.avgOpenRate).toBe(38);
  });
});

// ── Media Coverage ────────────────────────────────────────────────────────────
describe("marketingBrand.mediaCoverage", () => {
  beforeEach(() => { vi.clearAllMocks(); makeMockDb({ values: vi.fn().mockResolvedValue([{ insertId: 77 }]) }); });

  it("list returns empty array", async () => {
    const result = await callProcedure(["mediaCoverage", "list"], {});
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsert creates a media coverage entry", async () => {
    const result = await callProcedure(["mediaCoverage", "upsert"], {
      ventureId: "ecoblend",
      outlet: "TechCrunch",
      headline: "EcoRace raises £2M to scale sustainable fuel blend",
      sentiment: "positive",
      reach: 250000,
    });
    expect(result).toHaveProperty("id", 77);
  });

  it("delete removes a media coverage entry", async () => {
    const db = makeMockDb();
    db.where.mockResolvedValue(undefined);
    const result = await callProcedure(["mediaCoverage", "delete"], { id: 1 });
    expect(result).toHaveProperty("success", true);
  });

  it("getSummary returns sentiment breakdown", async () => {
    const db = makeMockDb();
    // getSummary uses select().from().where() chain
    db.where.mockResolvedValue([
      { sentiment: "positive", reach: 250000 },
      { sentiment: "positive", reach: 100000 },
      { sentiment: "neutral", reach: 50000 },
      { sentiment: "negative", reach: 20000 },
    ]);
    const result = await callProcedure(["mediaCoverage", "getSummary"], {});
    expect(result.total).toBe(4);
    expect(result.positive).toBe(2);
    expect(result.neutral).toBe(1);
    expect(result.negative).toBe(1);
    expect(result.totalReach).toBe(420000);
  });
});
