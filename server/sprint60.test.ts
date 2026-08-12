/**
 * Sprint 60 — Founder Onboarding Submissions
 * Tests for onboardingSubmissions router: submit, list, getById, delete
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock getDb ────────────────────────────────────────────────────────────────
vi.mock("./db", () => {
  const mockDb = {
    insert: vi.fn(),
    select: vi.fn(),
    delete: vi.fn(),
  };
  return { getDb: vi.fn().mockResolvedValue(mockDb) };
});

// ── Mock drizzle/schema ───────────────────────────────────────────────────────
vi.mock("../drizzle/schema", () => ({
  founderOnboardingSubmissions: { id: "id", createdAt: "createdAt" },
}));

// ── Mock drizzle-orm ──────────────────────────────────────────────────────────
vi.mock("drizzle-orm", () => ({
  eq:   vi.fn((col, val) => ({ col, val, type: "eq" })),
  desc: vi.fn((col) => ({ col, type: "desc" })),
  asc:  vi.fn((col) => ({ col, type: "asc" })),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getDb() {
  const { getDb: _getDb } = await import("./db");
  return (await _getDb()) as any;
}

const VALID_INPUT = {
  ventureName:  "TestVenture",
  sector:       "CleanTech",
  channel:      "B2B" as const,
  founderName:  "Alice Smith",
  checkedCount: 18,
  totalTasks:   26,
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("onboardingSubmissions.submit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts a row and returns the new id", async () => {
    const db = await getDb();
    const valuesChain = { values: vi.fn().mockResolvedValue([{ insertId: 42 }]) };
    db.insert.mockReturnValue({ values: valuesChain.values });

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({} as any);
    const result = await caller.onboardingSubmissions.submit(VALID_INPUT);

    expect(db.insert).toHaveBeenCalledOnce();
    expect(result).toEqual({ id: 42 });
  }, 15000);

  it("stores checkedTasks as a JSON string when provided", async () => {
    const db = await getDb();
    let capturedValues: any;
    db.insert.mockReturnValue({
      values: vi.fn().mockImplementation((v: any) => {
        capturedValues = v;
        return Promise.resolve([{ insertId: 1 }]);
      }),
    });

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({} as any);
    await caller.onboardingSubmissions.submit({
      ...VALID_INPUT,
      checkedTasks: { task_1: true, task_2: false },
    });

    expect(typeof capturedValues.checkedTasks).toBe("string");
    const parsed = JSON.parse(capturedValues.checkedTasks);
    expect(parsed.task_1).toBe(true);
    expect(parsed.task_2).toBe(false);
  }, 15000);

  it("sets status to 'Completed'", async () => {
    const db = await getDb();
    let capturedValues: any;
    db.insert.mockReturnValue({
      values: vi.fn().mockImplementation((v: any) => {
        capturedValues = v;
        return Promise.resolve([{ insertId: 2 }]);
      }),
    });

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({} as any);
    await caller.onboardingSubmissions.submit(VALID_INPUT);

    expect(capturedValues.status).toBe("Completed");
  });

  it("stores optional fields when provided", async () => {
    const db = await getDb();
    let capturedValues: any;
    db.insert.mockReturnValue({
      values: vi.fn().mockImplementation((v: any) => {
        capturedValues = v;
        return Promise.resolve([{ insertId: 3 }]);
      }),
    });

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({} as any);
    await caller.onboardingSubmissions.submit({
      ...VALID_INPUT,
      tagline:          "Clean future",
      nominatedCharity: "EcoFoundation",
      brandColor:       "#22c55e",
      founderEmail:     "alice@example.com",
      ventureId:        "ecoblend",
      talentProfileId:  7,
    });

    expect(capturedValues.tagline).toBe("Clean future");
    expect(capturedValues.nominatedCharity).toBe("EcoFoundation");
    expect(capturedValues.brandColor).toBe("#22c55e");
    expect(capturedValues.founderEmail).toBe("alice@example.com");
    expect(capturedValues.ventureId).toBe("ecoblend");
    expect(capturedValues.talentProfileId).toBe(7);
  });

  it("rejects ventureName shorter than 2 characters", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({} as any);
    await expect(
      caller.onboardingSubmissions.submit({ ...VALID_INPUT, ventureName: "X" })
    ).rejects.toThrow();
  });

  it("rejects an invalid email format", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({} as any);
    await expect(
      caller.onboardingSubmissions.submit({ ...VALID_INPUT, founderEmail: "not-an-email" })
    ).rejects.toThrow();
  });

  it("rejects an invalid channel value", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({} as any);
    await expect(
      caller.onboardingSubmissions.submit({ ...VALID_INPUT, channel: "B2G" as any })
    ).rejects.toThrow();
  });
});

describe("onboardingSubmissions.list", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all submissions ordered by createdAt desc", async () => {
    const db = await getDb();
    const mockRows = [
      { id: 2, ventureName: "Beta", createdAt: new Date("2026-03-20") },
      { id: 1, ventureName: "Alpha", createdAt: new Date("2026-03-19") },
    ];
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue(mockRows),
      }),
    });

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({} as any);
    const result = await caller.onboardingSubmissions.list();

    expect(result).toHaveLength(2);
    expect(result[0].ventureName).toBe("Beta");
    expect(result[1].ventureName).toBe("Alpha");
  });

  it("returns an empty array when no submissions exist", async () => {
    const db = await getDb();
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([]),
      }),
    });

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({} as any);
    const result = await caller.onboardingSubmissions.list();

    expect(result).toEqual([]);
  });
});

describe("onboardingSubmissions.getById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the submission when found", async () => {
    const db = await getDb();
    const mockRow = { id: 5, ventureName: "Gamma", founderName: "Bob" };
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockRow]),
      }),
    });

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({} as any);
    const result = await caller.onboardingSubmissions.getById({ id: 5 });

    expect(result).toEqual(mockRow);
  });

  it("returns null when not found", async () => {
    const db = await getDb();
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({} as any);
    const result = await caller.onboardingSubmissions.getById({ id: 999 });

    expect(result).toBeNull();
  });
});

describe("onboardingSubmissions.delete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes the submission and returns success: true", async () => {
    const db = await getDb();
    db.delete.mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({ user: { id: 1, role: "admin", openId: "test", email: "t@t.com", name: "T" } } as any);
    const result = await caller.onboardingSubmissions.delete({ id: 3 });

    expect(db.delete).toHaveBeenCalledOnce();
    expect(result).toEqual({ success: true });
  });

  it("calls delete with the correct id filter", async () => {
    const db = await getDb();
    const whereMock = vi.fn().mockResolvedValue(undefined);
    db.delete.mockReturnValue({ where: whereMock });

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({ user: { id: 1, role: "admin", openId: "test", email: "t@t.com", name: "T" } } as any);
    await caller.onboardingSubmissions.delete({ id: 7 });

    expect(whereMock).toHaveBeenCalledOnce();
    const filterArg = whereMock.mock.calls[0][0];
    expect(filterArg.val).toBe(7);
  });
});
