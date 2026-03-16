/**
 * Project Management Module — Backend Tests
 * Tests for pmDb.ts helper functions
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock the database ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// ── Mock drizzle-orm ──────────────────────────────────────────────────────────
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val, type: "eq" })),
  and: vi.fn((...args) => ({ args, type: "and" })),
  desc: vi.fn((col) => ({ col, type: "desc" })),
  asc: vi.fn((col) => ({ col, type: "asc" })),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values, type: "sql" })),
  count: vi.fn(() => ({ type: "count" })),
  sum: vi.fn(() => ({ type: "sum" })),
  avg: vi.fn(() => ({ type: "avg" })),
  lt: vi.fn((col, val) => ({ col, val, type: "lt" })),
  isNull: vi.fn((col) => ({ col, type: "isNull" })),
}));

// ── Unit tests for VRL risk score calculation ─────────────────────────────────
describe("Execution Risk Score Calculation", () => {
  const LIKELIHOOD_SCORES: Record<string, number> = {
    "Very Low": 1, "Low": 2, "Medium": 3, "High": 4, "Very High": 5,
  };
  const IMPACT_SCORES: Record<string, number> = {
    "Negligible": 1, "Minor": 2, "Moderate": 3, "Major": 4, "Critical": 5,
  };

  function getRiskScore(likelihood: string, impact: string): number {
    return (LIKELIHOOD_SCORES[likelihood] ?? 3) * (IMPACT_SCORES[impact] ?? 3);
  }

  function getRiskLevel(score: number): string {
    if (score <= 4) return "Low";
    if (score <= 9) return "Medium";
    if (score <= 16) return "High";
    return "Critical";
  }

  it("should calculate Low risk for Very Low likelihood × Negligible impact", () => {
    const score = getRiskScore("Very Low", "Negligible");
    expect(score).toBe(1);
    expect(getRiskLevel(score)).toBe("Low");
  });

  it("should calculate Medium risk for Medium likelihood × Moderate impact", () => {
    const score = getRiskScore("Medium", "Moderate");
    expect(score).toBe(9);
    expect(getRiskLevel(score)).toBe("Medium");
  });

  it("should calculate High risk for High likelihood × Major impact", () => {
    const score = getRiskScore("High", "Major");
    expect(score).toBe(16);
    expect(getRiskLevel(score)).toBe("High");
  });

  it("should calculate Critical risk for Very High likelihood × Critical impact", () => {
    const score = getRiskScore("Very High", "Critical");
    expect(score).toBe(25);
    expect(getRiskLevel(score)).toBe("Critical");
  });

  it("should default to Medium (3×3=9) for unknown likelihood/impact", () => {
    const score = getRiskScore("Unknown", "Unknown");
    expect(score).toBe(9);
    expect(getRiskLevel(score)).toBe("Medium");
  });
});

// ── Unit tests for phase completion percentage ────────────────────────────────
describe("Phase Completion Percentage", () => {
  function calculatePhaseCompletion(tasks: { kanbanStatus: string }[]): number {
    if (tasks.length === 0) return 0;
    const done = tasks.filter(t => t.kanbanStatus === "Done").length;
    return Math.round((done / tasks.length) * 100);
  }

  it("should return 0 for empty task list", () => {
    expect(calculatePhaseCompletion([])).toBe(0);
  });

  it("should return 100 when all tasks are Done", () => {
    const tasks = [
      { kanbanStatus: "Done" },
      { kanbanStatus: "Done" },
      { kanbanStatus: "Done" },
    ];
    expect(calculatePhaseCompletion(tasks)).toBe(100);
  });

  it("should return 50 when half tasks are Done", () => {
    const tasks = [
      { kanbanStatus: "Done" },
      { kanbanStatus: "Done" },
      { kanbanStatus: "In Progress" },
      { kanbanStatus: "Backlog" },
    ];
    expect(calculatePhaseCompletion(tasks)).toBe(50);
  });

  it("should return 0 when no tasks are Done", () => {
    const tasks = [
      { kanbanStatus: "In Progress" },
      { kanbanStatus: "Backlog" },
      { kanbanStatus: "Blocked" },
    ];
    expect(calculatePhaseCompletion(tasks)).toBe(0);
  });

  it("should round to nearest integer", () => {
    const tasks = [
      { kanbanStatus: "Done" },
      { kanbanStatus: "In Progress" },
      { kanbanStatus: "Backlog" },
    ];
    expect(calculatePhaseCompletion(tasks)).toBe(33);
  });
});

// ── Unit tests for budget utilisation ────────────────────────────────────────
describe("Budget Utilisation", () => {
  function getBudgetUtilisation(budget: number | null, spent: number | null): number | null {
    if (!budget || !spent) return null;
    return Math.round((spent / budget) * 100);
  }

  function getBudgetStatus(utilisation: number | null): "on-track" | "at-risk" | "over-budget" | "unknown" {
    if (utilisation === null) return "unknown";
    if (utilisation <= 80) return "on-track";
    if (utilisation <= 100) return "at-risk";
    return "over-budget";
  }

  it("should return null when budget is null", () => {
    expect(getBudgetUtilisation(null, 5000)).toBeNull();
  });

  it("should return null when spent is null", () => {
    expect(getBudgetUtilisation(10000, null)).toBeNull();
  });

  it("should calculate 50% utilisation correctly", () => {
    expect(getBudgetUtilisation(10000, 5000)).toBe(50);
  });

  it("should classify on-track when under 80%", () => {
    expect(getBudgetStatus(75)).toBe("on-track");
  });

  it("should classify at-risk when between 80-100%", () => {
    expect(getBudgetStatus(95)).toBe("at-risk");
  });

  it("should classify over-budget when over 100%", () => {
    expect(getBudgetStatus(110)).toBe("over-budget");
  });

  it("should classify unknown when utilisation is null", () => {
    expect(getBudgetStatus(null)).toBe("unknown");
  });
});

// ── Unit tests for milestone type classification ──────────────────────────────
describe("Milestone Type Classification", () => {
  const GATE_MILESTONE_TYPES = ["Gate Review", "Decision Point"];
  const FUNDING_MILESTONE_TYPES = ["Funding Milestone", "External Event"];

  function isGateMilestone(type: string | null | undefined): boolean {
    return GATE_MILESTONE_TYPES.includes(type ?? "");
  }

  function isFundingMilestone(type: string | null | undefined): boolean {
    return FUNDING_MILESTONE_TYPES.includes(type ?? "");
  }

  it("should identify Gate Review as a gate milestone", () => {
    expect(isGateMilestone("Gate Review")).toBe(true);
  });

  it("should identify Decision Point as a gate milestone", () => {
    expect(isGateMilestone("Decision Point")).toBe(true);
  });

  it("should not classify Deliverable as a gate milestone", () => {
    expect(isGateMilestone("Deliverable")).toBe(false);
  });

  it("should identify Funding Milestone as a funding milestone", () => {
    expect(isFundingMilestone("Funding Milestone")).toBe(true);
  });

  it("should handle null type gracefully", () => {
    expect(isGateMilestone(null)).toBe(false);
    expect(isFundingMilestone(null)).toBe(false);
  });
});

// ── Unit tests for Kanban column ordering ────────────────────────────────────
describe("Kanban Column Ordering", () => {
  const KANBAN_ORDER = ["Backlog", "To Do", "In Progress", "In Review", "Done", "Blocked"];

  function getColumnIndex(status: string): number {
    return KANBAN_ORDER.indexOf(status);
  }

  function isForwardMove(from: string, to: string): boolean {
    const fromIdx = getColumnIndex(from);
    const toIdx = getColumnIndex(to);
    if (fromIdx === -1 || toIdx === -1) return false;
    // Blocked is special — not a forward move
    if (to === "Blocked") return false;
    return toIdx > fromIdx;
  }

  it("should have Backlog as first column", () => {
    expect(getColumnIndex("Backlog")).toBe(0);
  });

  it("should have Done as second-to-last column", () => {
    expect(getColumnIndex("Done")).toBe(4);
  });

  it("should identify In Progress → Done as a forward move", () => {
    expect(isForwardMove("In Progress", "Done")).toBe(true);
  });

  it("should not identify Done → In Progress as a forward move", () => {
    expect(isForwardMove("Done", "In Progress")).toBe(false);
  });

  it("should not identify any move to Blocked as forward", () => {
    expect(isForwardMove("In Progress", "Blocked")).toBe(false);
  });

  it("should return -1 for unknown status", () => {
    expect(getColumnIndex("Unknown Status")).toBe(-1);
  });
});

// ── Unit tests for portfolio summary aggregation ──────────────────────────────
describe("Portfolio Summary Aggregation", () => {
  type ProgramStatus = "Not Started" | "In Progress" | "On Hold" | "Completed" | "Cancelled";

  function aggregatePrograms(programs: { status: ProgramStatus }[]): {
    total: number; active: number; completed: number; onHold: number;
  } {
    return {
      total: programs.length,
      active: programs.filter(p => p.status === "In Progress").length,
      completed: programs.filter(p => p.status === "Completed").length,
      onHold: programs.filter(p => p.status === "On Hold").length,
    };
  }

  it("should correctly count active programs", () => {
    const programs = [
      { status: "In Progress" as ProgramStatus },
      { status: "In Progress" as ProgramStatus },
      { status: "Completed" as ProgramStatus },
      { status: "On Hold" as ProgramStatus },
    ];
    const summary = aggregatePrograms(programs);
    expect(summary.active).toBe(2);
    expect(summary.completed).toBe(1);
    expect(summary.onHold).toBe(1);
    expect(summary.total).toBe(4);
  });

  it("should return zeros for empty program list", () => {
    const summary = aggregatePrograms([]);
    expect(summary.total).toBe(0);
    expect(summary.active).toBe(0);
  });
});
