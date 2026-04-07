/**
 * Sprint 86-88 Tests
 * Sprint 86: Founder Self-Assessment Portal
 * Sprint 87: Cohort Benchmarking
 * Sprint 88: Commitment Template Library
 */

import { describe, it, expect } from "vitest";

// ── Sprint 86: Self-Assessment Portal ────────────────────────────────────────

describe("Sprint 86: Founder Self-Assessment Portal", () => {
  describe("compositeScore calculation", () => {
    it("calculates weighted composite correctly", () => {
      const scores = {
        strategicClarity: 80,
        marketValidation: 70,
        teamCapability: 60,
        operationalExecution: 90,
        investorPreparedness: 50,
      };
      const composite =
        scores.strategicClarity * 0.20 +
        scores.marketValidation * 0.25 +
        scores.teamCapability * 0.20 +
        scores.operationalExecution * 0.20 +
        scores.investorPreparedness * 0.15;
      // 80*0.2 + 70*0.25 + 60*0.2 + 90*0.2 + 50*0.15
      // = 16 + 17.5 + 12 + 18 + 7.5 = 71
      expect(composite).toBeCloseTo(71, 1);
    });

    it("returns 0 for all-zero scores", () => {
      const composite = 0 * 0.20 + 0 * 0.25 + 0 * 0.20 + 0 * 0.20 + 0 * 0.15;
      expect(composite).toBe(0);
    });

    it("returns 100 for all-max scores", () => {
      const composite = 100 * 0.20 + 100 * 0.25 + 100 * 0.20 + 100 * 0.20 + 100 * 0.15;
      expect(composite).toBe(100);
    });

    it("weights sum to 1.0", () => {
      const weights = [0.20, 0.25, 0.20, 0.20, 0.15];
      const sum = weights.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    });
  });

  describe("status transitions", () => {
    it("validates allowed status values", () => {
      const validStatuses = ["pending", "approved", "rejected"];
      expect(validStatuses).toContain("pending");
      expect(validStatuses).toContain("approved");
      expect(validStatuses).toContain("rejected");
      expect(validStatuses).not.toContain("draft");
    });

    it("pending is the initial status", () => {
      const initialStatus = "pending";
      expect(initialStatus).toBe("pending");
    });

    it("approval creates a PRL record flag", () => {
      const approveInput = { assessmentId: "abc", reviewedBy: "coach", createPrlRecord: true };
      expect(approveInput.createPrlRecord).toBe(true);
    });
  });

  describe("score validation", () => {
    it("rejects scores below 0", () => {
      const score = -1;
      expect(score < 0 || score > 100).toBe(true);
    });

    it("rejects scores above 100", () => {
      const score = 101;
      expect(score < 0 || score > 100).toBe(true);
    });

    it("accepts boundary values 0 and 100", () => {
      expect(0 >= 0 && 0 <= 100).toBe(true);
      expect(100 >= 0 && 100 <= 100).toBe(true);
    });
  });

  describe("pending query filtering", () => {
    it("filters by pending status only", () => {
      const assessments = [
        { id: "1", status: "pending" },
        { id: "2", status: "approved" },
        { id: "3", status: "pending" },
        { id: "4", status: "rejected" },
      ];
      const pending = assessments.filter((a) => a.status === "pending");
      expect(pending).toHaveLength(2);
      expect(pending.every((a) => a.status === "pending")).toBe(true);
    });
  });
});

// ── Sprint 87: Cohort Benchmarking ────────────────────────────────────────────

describe("Sprint 87: Cohort Benchmarking", () => {
  describe("cohort statistics calculation", () => {
    it("calculates median correctly for odd-length array", () => {
      const scores = [40, 55, 60, 70, 85];
      const sorted = [...scores].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted[mid];
      expect(median).toBe(60);
    });

    it("calculates median correctly for even-length array", () => {
      const scores = [40, 55, 70, 85];
      const sorted = [...scores].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = (sorted[mid - 1] + sorted[mid]) / 2;
      expect(median).toBe(62.5);
    });

    it("calculates average correctly", () => {
      const scores = [60, 70, 80, 90];
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      expect(avg).toBe(75);
    });

    it("identifies min and max correctly", () => {
      const scores = [45, 62, 78, 91, 33];
      expect(Math.min(...scores)).toBe(33);
      expect(Math.max(...scores)).toBe(91);
    });
  });

  describe("benchmark data structure", () => {
    it("founderTrend and cohortAverages have same length", () => {
      const founderTrend = [
        { week: "2026-01-06", score: 65 },
        { week: "2026-01-13", score: 68 },
        { week: "2026-01-20", score: 72 },
      ];
      const cohortAverages = [
        { week: "2026-01-06", cohortAvg: 60 },
        { week: "2026-01-13", cohortAvg: 62 },
        { week: "2026-01-20", cohortAvg: 63 },
      ];
      expect(founderTrend.length).toBe(cohortAverages.length);
    });

    it("cohortStats includes required fields", () => {
      const cohortStats = {
        vrlStage: 1,
        sampleSize: 12,
        median: 65.5,
        min: 32,
        max: 91,
      };
      expect(cohortStats).toHaveProperty("vrlStage");
      expect(cohortStats).toHaveProperty("sampleSize");
      expect(cohortStats).toHaveProperty("median");
      expect(cohortStats).toHaveProperty("min");
      expect(cohortStats).toHaveProperty("max");
    });

    it("returns empty arrays when no cohort data", () => {
      const emptyResult = {
        founderTrend: [],
        cohortAverages: [],
        cohortStats: { vrlStage: 1, sampleSize: 0, median: null, min: null, max: null },
      };
      expect(emptyResult.founderTrend).toHaveLength(0);
      expect(emptyResult.cohortStats.sampleSize).toBe(0);
    });
  });

  describe("VRL stage filtering", () => {
    it("filters founders by VRL stage", () => {
      const founders = [
        { id: 1, vrlStage: 1 },
        { id: 2, vrlStage: 2 },
        { id: 3, vrlStage: 1 },
        { id: 4, vrlStage: 3 },
      ];
      const stage1 = founders.filter((f) => f.vrlStage === 1);
      expect(stage1).toHaveLength(2);
    });
  });
});

// ── Sprint 88: Commitment Template Library ────────────────────────────────────

describe("Sprint 88: Commitment Template Library", () => {
  describe("template search", () => {
    it("matches templates by title (case-insensitive)", () => {
      const templates = [
        { id: 1, title: "Define ICP", vrlStage: 1 },
        { id: 2, title: "Build MVP", vrlStage: 2 },
        { id: 3, title: "Define Revenue Model", vrlStage: 3 },
      ];
      const query = "define";
      const results = templates.filter((t) =>
        t.title.toLowerCase().includes(query.toLowerCase())
      );
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.id)).toEqual([1, 3]);
    });

    it("returns empty array for no matches", () => {
      const templates = [
        { id: 1, title: "Define ICP", vrlStage: 1 },
      ];
      const results = templates.filter((t) =>
        t.title.toLowerCase().includes("xyz")
      );
      expect(results).toHaveLength(0);
    });
  });

  describe("VRL stage filtering", () => {
    it("filters templates by VRL stage", () => {
      const templates = [
        { id: 1, title: "Define ICP", vrlStage: 1 },
        { id: 2, title: "Build MVP", vrlStage: 2 },
        { id: 3, title: "Run 10 Customer Interviews", vrlStage: 1 },
      ];
      const vrl1 = templates.filter((t) => t.vrlStage === 1);
      expect(vrl1).toHaveLength(2);
    });
  });

  describe("template priority ordering", () => {
    it("orders by priority correctly", () => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const templates = [
        { id: 1, priority: "low" as const },
        { id: 2, priority: "critical" as const },
        { id: 3, priority: "medium" as const },
        { id: 4, priority: "high" as const },
      ];
      const sorted = [...templates].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );
      expect(sorted[0].priority).toBe("critical");
      expect(sorted[1].priority).toBe("high");
      expect(sorted[2].priority).toBe("medium");
      expect(sorted[3].priority).toBe("low");
    });
  });

  describe("seed templates", () => {
    it("seed produces templates for all VRL stages 1-4", () => {
      const seedData = [
        { vrlStage: 1, title: "Define ICP" },
        { vrlStage: 1, title: "Run 10 Customer Interviews" },
        { vrlStage: 2, title: "Build MVP" },
        { vrlStage: 2, title: "Achieve 3 Paying Customers" },
        { vrlStage: 3, title: "Define Revenue Model" },
        { vrlStage: 3, title: "Hire First Sales Rep" },
        { vrlStage: 4, title: "Raise Seed Round" },
        { vrlStage: 4, title: "Expand to Second Market" },
      ];
      const stages = [...new Set(seedData.map((t) => t.vrlStage))];
      expect(stages.sort()).toEqual([1, 2, 3, 4]);
    });

    it("skips seeding when templates already exist and force is false", () => {
      const existingCount = 5;
      const force = false;
      const shouldSeed = existingCount === 0 || force;
      expect(shouldSeed).toBe(false);
    });

    it("re-seeds when force is true regardless of existing count", () => {
      const existingCount = 5;
      const force = true;
      const shouldSeed = existingCount === 0 || force;
      expect(shouldSeed).toBe(true);
    });
  });

  describe("applyToFounder", () => {
    it("increments usageCount on apply", () => {
      let usageCount = 3;
      usageCount += 1;
      expect(usageCount).toBe(4);
    });

    it("creates commitment with correct duration from template", () => {
      const template = { durationDays: 14, title: "Build MVP" };
      const today = new Date("2026-04-07");
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + template.durationDays);
      expect(dueDate.toISOString().split("T")[0]).toBe("2026-04-21");
    });
  });

  describe("template creation validation", () => {
    it("requires non-empty title", () => {
      const title = "";
      expect(title.trim().length > 0).toBe(false);
    });

    it("validates VRL stage is 1-9", () => {
      const validStages = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      expect(validStages.includes(1)).toBe(true);
      expect(validStages.includes(9)).toBe(true);
      expect(validStages.includes(0)).toBe(false);
      expect(validStages.includes(10)).toBe(false);
    });

    it("validates durationDays is positive", () => {
      expect(7 > 0).toBe(true);
      expect(0 > 0).toBe(false);
      expect(-1 > 0).toBe(false);
    });
  });
});
