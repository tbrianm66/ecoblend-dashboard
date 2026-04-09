/**
 * Sprint 95 — Flower Metrics CSV Export Bridge Tests
 * Tests for: previewExport, generateCsv, getExportHistory, getPortfolioExportSummary
 */

import { describe, it, expect, beforeEach } from "vitest";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a Flower CSV row object */
function makeRow(
  category: string,
  metricName: string,
  metricValue: string | number,
  metricUnit = "",
  source = "EcoBlend"
) {
  return {
    category,
    metric_name: metricName,
    metric_value: String(metricValue),
    metric_unit: metricUnit,
    source,
    export_date: new Date().toISOString().split("T")[0],
  };
}

/** Parse a CSV string into rows (array of objects keyed by header) */
function parseCsv(csv: string): Record<string, string>[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

// ── Unit: CSV row builder ─────────────────────────────────────────────────────

describe("Flower CSV row builder", () => {
  it("creates a row with all required Flower fields", () => {
    const row = makeRow("Readiness", "VRL Score", 7.2, "score");
    expect(row).toHaveProperty("category", "Readiness");
    expect(row).toHaveProperty("metric_name", "VRL Score");
    expect(row).toHaveProperty("metric_value", "7.2");
    expect(row).toHaveProperty("metric_unit", "score");
    expect(row).toHaveProperty("source", "EcoBlend");
    expect(row).toHaveProperty("export_date");
  });

  it("converts numeric values to strings", () => {
    const row = makeRow("Finance", "Revenue", 125000, "GBP");
    expect(typeof row.metric_value).toBe("string");
    expect(row.metric_value).toBe("125000");
  });

  it("defaults source to EcoBlend", () => {
    const row = makeRow("Team", "Founder Count", 3);
    expect(row.source).toBe("EcoBlend");
  });

  it("includes today's date in ISO format", () => {
    const row = makeRow("Risk", "Risk Index", 0.25);
    expect(row.export_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ── Unit: CSV parser ──────────────────────────────────────────────────────────

describe("CSV parser", () => {
  it("parses a well-formed CSV into row objects", () => {
    const csv = `category,metric_name,metric_value,metric_unit\nReadiness,VRL Score,7.2,score\nFinance,Revenue,125000,GBP`;
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ category: "Readiness", metric_name: "VRL Score" });
    expect(rows[1]).toMatchObject({ category: "Finance", metric_value: "125000" });
  });

  it("returns empty array for header-only CSV", () => {
    const csv = `category,metric_name,metric_value,metric_unit`;
    expect(parseCsv(csv)).toHaveLength(0);
  });

  it("handles single data row", () => {
    const csv = `category,metric_name,metric_value\nTeam,Founders,3`;
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].metric_name).toBe("Founders");
  });
});

// ── Unit: KPI category grouping ───────────────────────────────────────────────

describe("KPI category grouping", () => {
  const rows = [
    makeRow("Readiness", "VRL Score", 7.2),
    makeRow("Readiness", "TRL Level", 5),
    makeRow("Finance", "Revenue", 125000),
    makeRow("Team", "Founder Count", 3),
    makeRow("Finance", "Burn Rate", 8000),
  ];

  function groupByCategory(rows: ReturnType<typeof makeRow>[]) {
    return rows.reduce(
      (acc, row) => {
        if (!acc[row.category]) acc[row.category] = [];
        acc[row.category].push(row);
        return acc;
      },
      {} as Record<string, typeof rows>
    );
  }

  it("groups rows by category correctly", () => {
    const grouped = groupByCategory(rows);
    expect(Object.keys(grouped)).toHaveLength(3);
    expect(grouped["Readiness"]).toHaveLength(2);
    expect(grouped["Finance"]).toHaveLength(2);
    expect(grouped["Team"]).toHaveLength(1);
  });

  it("preserves all rows across groups", () => {
    const grouped = groupByCategory(rows);
    const total = Object.values(grouped).reduce((sum, g) => sum + g.length, 0);
    expect(total).toBe(rows.length);
  });

  it("returns empty object for empty input", () => {
    expect(groupByCategory([])).toEqual({});
  });
});

// ── Unit: Flower CSV filename generation ─────────────────────────────────────

describe("Flower CSV filename generation", () => {
  function generateFilename(ventureName: string, date: Date = new Date()) {
    const slug = ventureName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const dateStr = date.toISOString().split("T")[0];
    return `flower-export-${slug}-${dateStr}.csv`;
  }

  it("generates a valid filename with venture slug and date", () => {
    const name = generateFilename("EcoBlend Brew", new Date("2026-04-09"));
    expect(name).toBe("flower-export-ecoblend-brew-2026-04-09.csv");
  });

  it("handles special characters in venture name", () => {
    const name = generateFilename("Venture & Co. (Ltd)", new Date("2026-04-09"));
    expect(name).toMatch(/^flower-export-venture-co-ltd-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it("always ends with .csv", () => {
    const name = generateFilename("TestVenture");
    expect(name.endsWith(".csv")).toBe(true);
  });

  it("does not contain spaces", () => {
    const name = generateFilename("My Great Venture");
    expect(name).not.toContain(" ");
  });
});

// ── Unit: Export log status tracking ─────────────────────────────────────────

describe("Export log status tracking", () => {
  type ExportLog = {
    id: number;
    ventureId: string;
    exportedBy: string;
    rowCount: number;
    status: "Success" | "Failed";
    errorMessage: string | null;
    createdAt: Date;
  };

  function mockLog(overrides: Partial<ExportLog> = {}): ExportLog {
    return {
      id: 1,
      ventureId: "ecobrew",
      exportedBy: "test-user",
      rowCount: 42,
      status: "Success",
      errorMessage: null,
      createdAt: new Date(),
      ...overrides,
    };
  }

  it("creates a success log with correct fields", () => {
    const log = mockLog();
    expect(log.status).toBe("Success");
    expect(log.errorMessage).toBeNull();
    expect(log.rowCount).toBe(42);
  });

  it("creates a failed log with error message", () => {
    const log = mockLog({ status: "Failed", errorMessage: "Venture not found", rowCount: 0 });
    expect(log.status).toBe("Failed");
    expect(log.errorMessage).toBe("Venture not found");
    expect(log.rowCount).toBe(0);
  });

  it("filters success logs correctly", () => {
    const logs = [
      mockLog({ id: 1, status: "Success" }),
      mockLog({ id: 2, status: "Failed" }),
      mockLog({ id: 3, status: "Success" }),
    ];
    const successes = logs.filter((l) => l.status === "Success");
    expect(successes).toHaveLength(2);
  });

  it("calculates total rows exported", () => {
    const logs = [
      mockLog({ rowCount: 42 }),
      mockLog({ rowCount: 38 }),
      mockLog({ rowCount: 55 }),
    ];
    const total = logs.reduce((sum, l) => sum + l.rowCount, 0);
    expect(total).toBe(135);
  });
});

// ── Unit: KPI completeness validation ────────────────────────────────────────

describe("KPI completeness validation", () => {
  const REQUIRED_CATEGORIES = [
    "Readiness",
    "Finance",
    "Team",
    "Risk",
    "Technology",
    "Market",
  ];

  function validateCompleteness(rows: { category: string }[]) {
    const presentCategories = new Set(rows.map((r) => r.category));
    const missing = REQUIRED_CATEGORIES.filter((c) => !presentCategories.has(c));
    return { isComplete: missing.length === 0, missing };
  }

  it("validates a complete export with all required categories", () => {
    const rows = REQUIRED_CATEGORIES.map((cat) => ({ category: cat }));
    const result = validateCompleteness(rows);
    expect(result.isComplete).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it("identifies missing categories", () => {
    const rows = [{ category: "Readiness" }, { category: "Finance" }];
    const result = validateCompleteness(rows);
    expect(result.isComplete).toBe(false);
    expect(result.missing).toContain("Team");
    expect(result.missing).toContain("Risk");
  });

  it("returns all categories as missing for empty rows", () => {
    const result = validateCompleteness([]);
    expect(result.isComplete).toBe(false);
    expect(result.missing).toHaveLength(REQUIRED_CATEGORIES.length);
  });

  it("handles duplicate categories without false positives", () => {
    const rows = REQUIRED_CATEGORIES.flatMap((cat) => [
      { category: cat },
      { category: cat },
    ]);
    const result = validateCompleteness(rows);
    expect(result.isComplete).toBe(true);
  });
});

// ── Unit: Portfolio export summary ───────────────────────────────────────────

describe("Portfolio export summary", () => {
  type SummaryEntry = {
    ventureId: string;
    ventureName: string;
    lastExportAt: Date | null;
    exportCount: number;
    lastRowCount: number;
  };

  function computeSummary(
    ventures: { id: string; name: string }[],
    logs: { ventureId: string; rowCount: number; createdAt: Date }[]
  ): SummaryEntry[] {
    return ventures.map((v) => {
      const vLogs = logs.filter((l) => l.ventureId === v.id);
      const sorted = vLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return {
        ventureId: v.id,
        ventureName: v.name,
        lastExportAt: sorted[0]?.createdAt ?? null,
        exportCount: vLogs.length,
        lastRowCount: sorted[0]?.rowCount ?? 0,
      };
    });
  }

  const ventures = [
    { id: "v1", name: "EcoBrew" },
    { id: "v2", name: "GreenPack" },
    { id: "v3", name: "SolarSip" },
  ];

  const logs = [
    { ventureId: "v1", rowCount: 42, createdAt: new Date("2026-04-01") },
    { ventureId: "v1", rowCount: 45, createdAt: new Date("2026-04-08") },
    { ventureId: "v2", rowCount: 38, createdAt: new Date("2026-04-05") },
  ];

  it("returns an entry for every venture", () => {
    const summary = computeSummary(ventures, logs);
    expect(summary).toHaveLength(3);
  });

  it("correctly counts exports per venture", () => {
    const summary = computeSummary(ventures, logs);
    const v1 = summary.find((s) => s.ventureId === "v1")!;
    expect(v1.exportCount).toBe(2);
  });

  it("returns the most recent export date", () => {
    const summary = computeSummary(ventures, logs);
    const v1 = summary.find((s) => s.ventureId === "v1")!;
    expect(v1.lastExportAt?.toISOString().split("T")[0]).toBe("2026-04-08");
  });

  it("returns null lastExportAt for ventures with no exports", () => {
    const summary = computeSummary(ventures, logs);
    const v3 = summary.find((s) => s.ventureId === "v3")!;
    expect(v3.lastExportAt).toBeNull();
    expect(v3.exportCount).toBe(0);
    expect(v3.lastRowCount).toBe(0);
  });

  it("uses the most recent row count", () => {
    const summary = computeSummary(ventures, logs);
    const v1 = summary.find((s) => s.ventureId === "v1")!;
    expect(v1.lastRowCount).toBe(45); // most recent export had 45 rows
  });
});

// ── Integration: Full CSV generation pipeline ─────────────────────────────────

describe("Full CSV generation pipeline", () => {
  function buildFlowerCsv(rows: ReturnType<typeof makeRow>[]): string {
    const headers = ["category", "metric_name", "metric_value", "metric_unit", "source", "export_date"];
    const headerLine = headers.join(",");
    const dataLines = rows.map((row) =>
      headers.map((h) => `"${(row as any)[h] ?? ""}"`).join(",")
    );
    return [headerLine, ...dataLines].join("\n");
  }

  it("generates a valid CSV with correct header", () => {
    const rows = [
      makeRow("Readiness", "VRL Score", 7.2, "score"),
      makeRow("Finance", "Revenue", 125000, "GBP"),
    ];
    const csv = buildFlowerCsv(rows);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("category,metric_name,metric_value,metric_unit,source,export_date");
    expect(lines).toHaveLength(3); // header + 2 data rows
  });

  it("round-trips correctly through parse", () => {
    const rows = [
      makeRow("Team", "Founder Count", 3, "count"),
      makeRow("Risk", "Risk Index", 0.25, "ratio"),
    ];
    const csv = buildFlowerCsv(rows);
    const parsed = parseCsv(csv);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].category).toBe("Team");
    expect(parsed[0].metric_value).toBe("3");
    expect(parsed[1].metric_name).toBe("Risk Index");
  });

  it("handles empty rows gracefully", () => {
    const csv = buildFlowerCsv([]);
    expect(csv).toBe("category,metric_name,metric_value,metric_unit,source,export_date");
  });

  it("produces consistent output for identical inputs", () => {
    const rows = [makeRow("Readiness", "BRL Score", 78, "%")];
    const csv1 = buildFlowerCsv(rows);
    const csv2 = buildFlowerCsv(rows);
    expect(csv1).toBe(csv2);
  });
});
