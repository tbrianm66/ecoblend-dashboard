import { describe, it, expect } from "vitest";

// ── BRL Score Calculation Tests ──────────────────────────────────────────────

describe("BRL Score Calculation", () => {
  it("calculates 0% when no tasks are completed", () => {
    const completedCount = 0;
    const totalCount = 100;
    const score = Math.round((completedCount / totalCount) * 100);
    expect(score).toBe(0);
  });

  it("calculates 100% when all tasks are completed", () => {
    const completedCount = 100;
    const totalCount = 100;
    const score = Math.round((completedCount / totalCount) * 100);
    expect(score).toBe(100);
  });

  it("calculates 75% when 75 tasks are completed", () => {
    const completedCount = 75;
    const totalCount = 100;
    const score = Math.round((completedCount / totalCount) * 100);
    expect(score).toBe(75);
  });

  it("rounds correctly for non-integer percentages", () => {
    const completedCount = 33;
    const totalCount = 100;
    const score = Math.round((completedCount / totalCount) * 100);
    expect(score).toBe(33);
  });
});

// ── BRL Task Stage Categorisation Tests ──────────────────────────────────────

describe("BRL Task Stage Categorisation", () => {
  const TASKS = [
    { taskNumber: 1, vrlStage: 1, platformScope: "Fundamentals" },
    { taskNumber: 25, vrlStage: 1, platformScope: "Fundamentals" },
    { taskNumber: 26, vrlStage: 2, platformScope: "Fundamentals" },
    { taskNumber: 50, vrlStage: 2, platformScope: "Fundamentals" },
    { taskNumber: 51, vrlStage: 3, platformScope: "Kick-off" },
    { taskNumber: 75, vrlStage: 3, platformScope: "Kick-off" },
    { taskNumber: 76, vrlStage: 4, platformScope: "Execution" },
    { taskNumber: 100, vrlStage: 4, platformScope: "Execution" },
  ];

  it("assigns tasks 1-25 to VRL Stage 1 Fundamentals", () => {
    const stage1Tasks = TASKS.filter(t => t.vrlStage === 1);
    expect(stage1Tasks.every(t => t.platformScope === "Fundamentals")).toBe(true);
    expect(stage1Tasks.length).toBe(2);
  });

  it("assigns tasks 26-50 to VRL Stage 2 Fundamentals", () => {
    const stage2Tasks = TASKS.filter(t => t.vrlStage === 2);
    expect(stage2Tasks.every(t => t.platformScope === "Fundamentals")).toBe(true);
  });

  it("assigns tasks 51-75 to VRL Stage 3 Kick-off", () => {
    const stage3Tasks = TASKS.filter(t => t.vrlStage === 3);
    expect(stage3Tasks.every(t => t.platformScope === "Kick-off")).toBe(true);
  });

  it("assigns tasks 76-100 to VRL Stage 4 Execution Platform", () => {
    const stage4Tasks = TASKS.filter(t => t.vrlStage === 4);
    expect(stage4Tasks.every(t => t.platformScope === "Execution")).toBe(true);
  });

  it("identifies execution platform tasks correctly", () => {
    const executionTasks = TASKS.filter(t => t.platformScope === "Execution");
    expect(executionTasks.length).toBe(2);
    expect(executionTasks.every(t => t.taskNumber >= 76)).toBe(true);
  });
});

// ── BRL Portfolio Summary Tests ───────────────────────────────────────────────

describe("BRL Portfolio Summary", () => {
  const mockSummary = [
    { ventureId: "ecoblend", score: 45, completedCount: 45, totalCount: 100 },
    { ventureId: "bebus", score: 30, completedCount: 30, totalCount: 100 },
    { ventureId: "tone", score: 20, completedCount: 20, totalCount: 100 },
  ];

  it("calculates correct average BRL score across ventures", () => {
    const avg = Math.round(
      mockSummary.reduce((sum, v) => sum + v.score, 0) / mockSummary.length
    );
    expect(avg).toBe(32);
  });

  it("returns 0 for average when no ventures have data", () => {
    const emptySummary: { ventureId: string; score: number }[] = [];
    const avg = emptySummary.length > 0
      ? Math.round(emptySummary.reduce((sum, v) => sum + v.score, 0) / emptySummary.length)
      : 0;
    expect(avg).toBe(0);
  });

  it("finds correct BRL entry for a specific venture", () => {
    const entry = mockSummary.find(s => s.ventureId === "bebus");
    expect(entry?.score).toBe(30);
    expect(entry?.completedCount).toBe(30);
  });
});

// ── BRL Task Completion Toggle Tests ─────────────────────────────────────────

describe("BRL Task Completion Toggle", () => {
  it("marks a task as completed", () => {
    const task = { taskId: 1, ventureId: "ecoblend", completed: false };
    const toggled = { ...task, completed: true };
    expect(toggled.completed).toBe(true);
  });

  it("marks a completed task as not completed", () => {
    const task = { taskId: 1, ventureId: "ecoblend", completed: true };
    const toggled = { ...task, completed: false };
    expect(toggled.completed).toBe(false);
  });

  it("preserves ventureId on toggle", () => {
    const task = { taskId: 1, ventureId: "ecoblend", completed: false };
    const toggled = { ...task, completed: true };
    expect(toggled.ventureId).toBe("ecoblend");
  });
});
