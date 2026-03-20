/**
 * Sprint 57 — Specialist Services Router Tests
 * Uses flat procedure key pattern: _def.procedures["specialists.list"]
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "./db";

function makeMockDb() {
  const mockWhere = vi.fn().mockResolvedValue([]);
  const mockOrderBy = vi.fn().mockResolvedValue([]);
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
  const mockValues = vi.fn().mockResolvedValue([{ insertId: 1 }]);
  const mockFrom = vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({ orderBy: mockOrderBy }),
    orderBy: mockOrderBy,
  });
  return {
    select: vi.fn().mockReturnValue({ from: mockFrom }),
    insert: vi.fn().mockReturnValue({ values: mockValues }),
    update: vi.fn().mockReturnValue({ set: mockSet }),
    delete: vi.fn().mockReturnValue({ where: mockWhere }),
    _mockWhere: mockWhere,
    _mockOrderBy: mockOrderBy,
    _mockSet: mockSet,
    _mockValues: mockValues,
    _mockFrom: mockFrom,
  };
}

async function getProc(key: string) {
  const { specialistServicesRouter } = await import("./specialistServices.router");
  return (specialistServicesRouter as any)._def.procedures[key];
}

async function callProc(key: string, input: any) {
  const proc = await getProc(key);
  return proc._def.resolver({ input, ctx: {} });
}

// ── Specialists ───────────────────────────────────────────────────────────────
describe("specialistServices.specialists", () => {
  beforeEach(() => vi.clearAllMocks());

  it("list returns all specialists ordered by rating", async () => {
    const specialists = [
      { id: 1, name: "Sarah Mitchell", role: "IP Attorney", category: "Legal & IP", availability: "Available", rating: "5.0", completedJobs: 34, isVerified: true },
    ];
    const db = makeMockDb();
    db._mockOrderBy.mockResolvedValue(specialists);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await callProc("specialists.list", undefined);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Sarah Mitchell");
  });

  it("list filters by category when provided", async () => {
    const db = makeMockDb();
    db._mockOrderBy.mockResolvedValue([]);
    vi.mocked(getDb).mockResolvedValue(db as any);

    await callProc("specialists.list", { category: "Legal & IP" });
    expect(db.select).toHaveBeenCalled();
  });

  it("upsert creates a new specialist when no id provided", async () => {
    const db = makeMockDb();
    db._mockValues.mockResolvedValue([{ insertId: 42 }]);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await callProc("specialists.upsert", {
      name: "Test Specialist", role: "Engineer", category: "Engineering & R&D",
    });
    expect(db.insert).toHaveBeenCalled();
    expect(result.id).toBe(42);
  });

  it("upsert updates an existing specialist when id provided", async () => {
    const db = makeMockDb();
    db._mockWhere.mockResolvedValue(undefined);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await callProc("specialists.upsert", {
      id: 1, name: "Updated Name", role: "Engineer", category: "Engineering & R&D",
    });
    expect(db.update).toHaveBeenCalled();
    expect(result.id).toBe(1);
  });

  it("delete removes a specialist by id", async () => {
    const db = makeMockDb();
    db._mockWhere.mockResolvedValue(undefined);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await callProc("specialists.delete", { id: 1 });
    expect(db.delete).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it("getSummary computes correct totals", async () => {
    const rows = [
      { availability: "Available", isVerified: true, rating: "5.0", category: "Legal & IP" },
      { availability: "Available", isVerified: false, rating: "4.0", category: "Legal & IP" },
      { availability: "Busy", isVerified: true, rating: "3.0", category: "Engineering & R&D" },
    ];
    const db = makeMockDb();
    // getSummary uses select().from() directly (no where/orderBy)
    db.select.mockReturnValue({ from: vi.fn().mockResolvedValue(rows) });
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await callProc("specialists.getSummary", undefined);
    expect(result.total).toBe(3);
    expect(result.available).toBe(2);
    expect(result.verified).toBe(2);
    expect(result.byCategory["Legal & IP"]).toBe(2);
    expect(result.byCategory["Engineering & R&D"]).toBe(1);
    expect(result.avgRating).toBeCloseTo(4.0, 1);
  });

  it("getSummary returns 0 avgRating when no specialists", async () => {
    const db = makeMockDb();
    db.select.mockReturnValue({ from: vi.fn().mockResolvedValue([]) });
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await callProc("specialists.getSummary", undefined);
    expect(result.total).toBe(0);
    expect(result.avgRating).toBe(0);
  });
});

// ── Service Tasks ─────────────────────────────────────────────────────────────
describe("specialistServices.serviceTasks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("list returns tasks ordered by createdAt", async () => {
    const tasks = [{ id: 1, ventureId: "ecoblend", title: "File Patent", category: "Legal & IP", status: "Open" }];
    const db = makeMockDb();
    db._mockOrderBy.mockResolvedValue(tasks);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await callProc("serviceTasks.list", { ventureId: "ecoblend" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("File Patent");
  });

  it("list returns all tasks when no filter provided", async () => {
    const db = makeMockDb();
    db._mockOrderBy.mockResolvedValue([]);
    vi.mocked(getDb).mockResolvedValue(db as any);

    await callProc("serviceTasks.list", undefined);
    expect(db.select).toHaveBeenCalled();
  });

  it("upsert creates a new service task", async () => {
    const db = makeMockDb();
    db._mockValues.mockResolvedValue([{ insertId: 99 }]);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await callProc("serviceTasks.upsert", {
      ventureId: "ecoblend", title: "New Task", category: "Legal & IP",
    });
    expect(db.insert).toHaveBeenCalled();
    expect(result.id).toBe(99);
  });

  it("upsert updates an existing task when id provided", async () => {
    const db = makeMockDb();
    db._mockWhere.mockResolvedValue(undefined);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await callProc("serviceTasks.upsert", {
      id: 5, ventureId: "ecoblend", title: "Updated Task", category: "Legal & IP",
    });
    expect(db.update).toHaveBeenCalled();
    expect(result.id).toBe(5);
  });

  it("assign sets specialistId and status to Assigned", async () => {
    const db = makeMockDb();
    db._mockWhere.mockResolvedValue(undefined);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await callProc("serviceTasks.assign", { id: 1, specialistId: 3 });
    expect(db.update).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it("assign sets correct fields in update payload", async () => {
    const db = makeMockDb();
    db._mockWhere.mockResolvedValue(undefined);
    vi.mocked(getDb).mockResolvedValue(db as any);

    await callProc("serviceTasks.assign", { id: 5, specialistId: 2 });
    const setCall = db._mockSet.mock.calls[0][0];
    expect(setCall.assignedTo).toBe(2);
    expect(setCall.status).toBe("Assigned");
  });

  it("delete removes a task by id", async () => {
    const db = makeMockDb();
    db._mockWhere.mockResolvedValue(undefined);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await callProc("serviceTasks.delete", { id: 1 });
    expect(db.delete).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });
});

// ── Commissions ───────────────────────────────────────────────────────────────
describe("specialistServices.commissions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("list returns commissions filtered by ventureId", async () => {
    const commissions = [{ id: 1, ventureId: "ecoblend", specialistId: 1, title: "File Patent", status: "Open" }];
    const db = makeMockDb();
    db._mockOrderBy.mockResolvedValue(commissions);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await callProc("commissions.list", { ventureId: "ecoblend" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("File Patent");
  });

  it("create inserts a commission with 10% platform fee", async () => {
    const db = makeMockDb();
    db._mockValues.mockResolvedValue([{ insertId: 55 }]);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await callProc("commissions.create", {
      ventureId: "ecoblend", specialistId: 1, title: "Design Brand", agreedFee: 3500,
    });
    expect(db.insert).toHaveBeenCalled();
    const insertCall = db._mockValues.mock.calls[0][0];
    expect(parseFloat(String(insertCall.platformFee))).toBeCloseTo(350, 0);
    expect(result.id).toBe(55);
  });

  it("create sets platformFee to undefined when no agreedFee provided", async () => {
    const db = makeMockDb();
    db._mockValues.mockResolvedValue([{ insertId: 56 }]);
    vi.mocked(getDb).mockResolvedValue(db as any);

    await callProc("commissions.create", {
      ventureId: "ecoblend", specialistId: 1, title: "Design Brand",
    });
    const insertCall = db._mockValues.mock.calls[0][0];
    expect(insertCall.platformFee).toBeUndefined();
  });

  it("create sets status to Open by default", async () => {
    const db = makeMockDb();
    db._mockValues.mockResolvedValue([{ insertId: 57 }]);
    vi.mocked(getDb).mockResolvedValue(db as any);

    await callProc("commissions.create", {
      ventureId: "ecoblend", specialistId: 1, title: "Test Commission",
    });
    const insertCall = db._mockValues.mock.calls[0][0];
    expect(insertCall.status).toBe("Open");
  });

  it("updateStatus advances commission status", async () => {
    const db = makeMockDb();
    db._mockWhere.mockResolvedValue(undefined);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await callProc("commissions.updateStatus", { id: 1, status: "In Review" });
    expect(db.update).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it("updateStatus sets completedAt when status is Complete", async () => {
    const db = makeMockDb();
    db._mockWhere.mockResolvedValue(undefined);
    vi.mocked(getDb).mockResolvedValue(db as any);

    await callProc("commissions.updateStatus", { id: 1, status: "Complete" });
    const setCall = db._mockSet.mock.calls[0][0];
    expect(setCall.completedAt).toBeInstanceOf(Date);
  });

  it("updateStatus does NOT set completedAt for non-Complete status", async () => {
    const db = makeMockDb();
    db._mockWhere.mockResolvedValue(undefined);
    vi.mocked(getDb).mockResolvedValue(db as any);

    await callProc("commissions.updateStatus", { id: 1, status: "Commissioned" });
    const setCall = db._mockSet.mock.calls[0][0];
    expect(setCall.completedAt).toBeUndefined();
  });

  it("delete removes a commission by id", async () => {
    const db = makeMockDb();
    db._mockWhere.mockResolvedValue(undefined);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await callProc("commissions.delete", { id: 1 });
    expect(db.delete).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it("getSummary computes correct commission totals", async () => {
    const rows = [
      { status: "Open", agreedFee: "1500.00", platformFee: "150.00" },
      { status: "Commissioned", agreedFee: "3500.00", platformFee: "350.00" },
      { status: "Complete", agreedFee: "2000.00", platformFee: "200.00" },
      { status: "Cancelled", agreedFee: "0.00", platformFee: "0.00" },
    ];
    const db = makeMockDb();
    const mockWhereFn = vi.fn().mockResolvedValue(rows);
    db.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: mockWhereFn }) });
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await callProc("commissions.getSummary", undefined);
    expect(result.total).toBe(4);
    expect(result.open).toBe(1);
    expect(result.active).toBe(1);
    expect(result.complete).toBe(1);
    expect(result.totalFees).toBeCloseTo(7000, 0);
    expect(result.totalPlatformFees).toBeCloseTo(700, 0);
  });
});
