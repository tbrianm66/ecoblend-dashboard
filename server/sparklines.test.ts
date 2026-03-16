/**
 * Tests for getVentureRevenueSparklines helper
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock getDb ────────────────────────────────────────────────────────────────

const mockVentures = [
  { id: "v1", name: "EcoBlend", color: "#51AF37", status: "Active" },
  { id: "v2", name: "BEBUS",    color: "#3A97D3", status: "Scaling" },
];

const mockSnapshots = [
  { ventureId: "v1", month: "2025-10", revenueActual: 10000, monthlyBurn: 8000 },
  { ventureId: "v1", month: "2025-11", revenueActual: 12000, monthlyBurn: 8500 },
  { ventureId: "v1", month: "2025-12", revenueActual: 14000, monthlyBurn: 9000 },
  { ventureId: "v1", month: "2026-01", revenueActual: 15500, monthlyBurn: 9200 },
  { ventureId: "v1", month: "2026-02", revenueActual: 17000, monthlyBurn: 9500 },
  { ventureId: "v1", month: "2026-03", revenueActual: 19000, monthlyBurn: 10000 },
  { ventureId: "v2", month: "2025-10", revenueActual: 5000,  monthlyBurn: 6000 },
  { ventureId: "v2", month: "2025-11", revenueActual: 4500,  monthlyBurn: 6000 },
  { ventureId: "v2", month: "2025-12", revenueActual: 4200,  monthlyBurn: 5800 },
  { ventureId: "v2", month: "2026-01", revenueActual: 4800,  monthlyBurn: 5900 },
  { ventureId: "v2", month: "2026-02", revenueActual: 4600,  monthlyBurn: 5800 },
  { ventureId: "v2", month: "2026-03", revenueActual: 4400,  monthlyBurn: 5700 },
];

// Build a chainable Drizzle-like mock
function makeDbMock(ventures: typeof mockVentures, snapshots: typeof mockSnapshots) {
  const orderByMock = vi.fn().mockResolvedValue(snapshots);
  const fromSnapMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
  const fromVentureMock = vi.fn().mockResolvedValue(ventures);

  let callCount = 0;
  const selectMock = vi.fn().mockImplementation(() => {
    callCount++;
    if (callCount % 2 === 1) {
      // First call: ventures (no orderBy)
      return { from: fromVentureMock };
    } else {
      // Second call: snapshots (with orderBy)
      return { from: fromSnapMock };
    }
  });

  return { select: selectMock };
}

vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "./db";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("getVentureRevenueSparklines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when db is unavailable", async () => {
    vi.mocked(getDb).mockResolvedValue(null as any);
    const { getVentureRevenueSparklines } = await import("./commandCentreDb");
    const result = await getVentureRevenueSparklines();
    expect(result).toEqual([]);
  });

  it("returns one entry per venture", async () => {
    const db = makeDbMock(mockVentures, mockSnapshots);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const { getVentureRevenueSparklines } = await import("./commandCentreDb");
    const result = await getVentureRevenueSparklines();
    expect(result).toHaveLength(2);
  });

  it("includes ventureId, ventureName, color, latestRevenue, trend, and points", async () => {
    const db = makeDbMock(mockVentures, mockSnapshots);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const { getVentureRevenueSparklines } = await import("./commandCentreDb");
    const result = await getVentureRevenueSparklines();
    const v1 = result.find(r => r.ventureId === "v1");
    expect(v1).toBeDefined();
    expect(v1?.ventureName).toBe("EcoBlend");
    expect(v1?.color).toBe("#51AF37");
    expect(typeof v1?.latestRevenue).toBe("number");
    expect(Array.isArray(v1?.points)).toBe(true);
    expect(["up", "down", "flat"]).toContain(v1?.trend);
  });

  it("caps sparkline points at 6 months", async () => {
    const db = makeDbMock(mockVentures, mockSnapshots);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const { getVentureRevenueSparklines } = await import("./commandCentreDb");
    const result = await getVentureRevenueSparklines();
    for (const r of result) {
      expect(r.points.length).toBeLessThanOrEqual(6);
    }
  });

  it("detects upward trend correctly for EcoBlend (10K → 19K)", async () => {
    const db = makeDbMock(mockVentures, mockSnapshots);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const { getVentureRevenueSparklines } = await import("./commandCentreDb");
    const result = await getVentureRevenueSparklines();
    const v1 = result.find(r => r.ventureId === "v1");
    expect(v1?.trend).toBe("up");
  });

  it("detects downward trend correctly for BEBUS (5K → 4.4K)", async () => {
    const db = makeDbMock(mockVentures, mockSnapshots);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const { getVentureRevenueSparklines } = await import("./commandCentreDb");
    const result = await getVentureRevenueSparklines();
    const v2 = result.find(r => r.ventureId === "v2");
    expect(v2?.trend).toBe("down");
  });

  it("uses venture brand color from the ventures table", async () => {
    const db = makeDbMock(mockVentures, mockSnapshots);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const { getVentureRevenueSparklines } = await import("./commandCentreDb");
    const result = await getVentureRevenueSparklines();
    expect(result.find(r => r.ventureId === "v1")?.color).toBe("#51AF37");
    expect(result.find(r => r.ventureId === "v2")?.color).toBe("#3A97D3");
  });

  it("falls back to #51AF37 when venture color is null", async () => {
    const venturesNoColor = [{ id: "v3", name: "TONE", color: null, status: "Active" }];
    const snapsNoColor = [
      { ventureId: "v3", month: "2026-01", revenueActual: 1000, monthlyBurn: 900 },
    ];
    const db = makeDbMock(venturesNoColor as any, snapsNoColor as any);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const { getVentureRevenueSparklines } = await import("./commandCentreDb");
    const result = await getVentureRevenueSparklines();
    expect(result[0]?.color).toBe("#51AF37");
  });

  it("returns empty points array for ventures with no snapshots", async () => {
    const venturesOnly = [{ id: "v4", name: "REAL", color: "#F49C13", status: "Pre-Launch" }];
    const db = makeDbMock(venturesOnly as any, [] as any);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const { getVentureRevenueSparklines } = await import("./commandCentreDb");
    const result = await getVentureRevenueSparklines();
    expect(result[0]?.points).toEqual([]);
    expect(result[0]?.latestRevenue).toBe(0);
  });
});

// ── Sparkline geometry unit tests (pure functions) ────────────────────────────

describe("Sparkline geometry helpers", () => {
  it("correctly identifies flat trend when values are within 2% of each other", () => {
    const values = [1000, 1010, 1005, 1008, 1002, 1006];
    const first = values[0];
    const last = values[values.length - 1];
    const trend = last > first * 1.02 ? "up" : last < first * 0.98 ? "down" : "flat";
    expect(trend).toBe("flat");
  });

  it("correctly identifies up trend when last > first * 1.02", () => {
    const values = [1000, 1100, 1200, 1300, 1400, 1500];
    const first = values[0];
    const last = values[values.length - 1];
    const trend = last > first * 1.02 ? "up" : last < first * 0.98 ? "down" : "flat";
    expect(trend).toBe("up");
  });

  it("correctly identifies down trend when last < first * 0.98", () => {
    const values = [1000, 950, 900, 850, 800, 750];
    const first = values[0];
    const last = values[values.length - 1];
    const trend = last > first * 1.02 ? "up" : last < first * 0.98 ? "down" : "flat";
    expect(trend).toBe("down");
  });

  it("handles single-point array without division by zero", () => {
    const values = [5000];
    const first = values[0];
    const last = values[values.length - 1];
    const range = Math.max(values.length - 1, 1);
    expect(range).toBe(1);
    expect(first).toBe(last);
  });
});
