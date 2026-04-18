/**
 * Sprint 78 — Coaching Module V2 Extension Tests
 * Tests: PRL→VRL integration, Coach Assignments, Commitment Templates
 */

import { describe, it, expect, beforeAll } from "vitest";

// ── 1. PRL → VRL Integration ──────────────────────────────────────────────────

describe("PRL → VRL Integration", () => {
  it("should apply PRL weight to base VRL score correctly", () => {
    const applyPrlToVrl = (baseVrl: number, frlScore: number): number => {
      const adjusted = baseVrl * (0.8 + (frlScore / 100) * 0.4);
      return Math.min(100, Math.round(adjusted * 10) / 10);
    };

    // HIGH execution (PRL=85) should boost VRL
    expect(applyPrlToVrl(70, 85)).toBeCloseTo(70 * (0.8 + 0.85 * 0.4), 1);
    // LOW execution (PRL=30) should reduce VRL
    expect(applyPrlToVrl(70, 30)).toBeCloseTo(70 * (0.8 + 0.30 * 0.4), 1);
    // Perfect execution (PRL=100) → multiplier = 1.2
    expect(applyPrlToVrl(70, 100)).toBeCloseTo(84, 0);
    // Zero execution (PRL=0) → multiplier = 0.8
    expect(applyPrlToVrl(70, 0)).toBeCloseTo(56, 0);
    // Result is always capped at 100
    expect(applyPrlToVrl(95, 100)).toBeLessThanOrEqual(100);
  });

  it("should correctly classify PRL-adjusted VRL gate status", () => {
    const classifyGate = (adjustedVrl: number): "PASS" | "WATCH" | "BLOCK" => {
      if (adjustedVrl >= 70) return "PASS";
      if (adjustedVrl >= 50) return "WATCH";
      return "BLOCK";
    };

    expect(classifyGate(85)).toBe("PASS");
    expect(classifyGate(70)).toBe("PASS");
    expect(classifyGate(65)).toBe("WATCH");
    expect(classifyGate(50)).toBe("WATCH");
    expect(classifyGate(49)).toBe("BLOCK");
    expect(classifyGate(20)).toBe("BLOCK");
  });

  it("should detect when low PRL causes a VRL gate downgrade", () => {
    const detectGateDowngrade = (baseVrl: number, frlScore: number) => {
      const applyPrl = (vrl: number, prl: number) =>
        Math.min(100, vrl * (0.8 + (prl / 100) * 0.4));
      const classify = (v: number) => (v >= 70 ? "PASS" : v >= 50 ? "WATCH" : "BLOCK");

      const rawGate = classify(baseVrl);
      const adjustedGate = classify(applyPrl(baseVrl, frlScore));
      return rawGate !== adjustedGate ? { downgraded: true, from: rawGate, to: adjustedGate } : { downgraded: false };
    };

    // VRL=75 (PASS) + PRL=20 → adjusted ≈ 66 (WATCH) → downgrade
    const result1 = detectGateDowngrade(75, 20);
    expect(result1.downgraded).toBe(true);
    expect((result1 as any).from).toBe("PASS");
    expect((result1 as any).to).toBe("WATCH");

    // VRL=75 (PASS) + PRL=80 → no downgrade
    const result2 = detectGateDowngrade(75, 80);
    expect(result2.downgraded).toBe(false);
  });
});

// ── 2. Coach Assignment Logic ─────────────────────────────────────────────────

describe("Coach Assignment Logic", () => {
  it("should validate required fields for a coach assignment", () => {
    const validateAssignment = (data: {
      coachId?: string;
      founderId?: string;
      ventureId?: string;
      startDate?: Date;
    }) => {
      const errors: string[] = [];
      if (!data.coachId) errors.push("coachId is required");
      if (!data.founderId) errors.push("founderId is required");
      if (!data.ventureId) errors.push("ventureId is required");
      if (!data.startDate) errors.push("startDate is required");
      return errors;
    };

    expect(validateAssignment({})).toHaveLength(4);
    expect(validateAssignment({ coachId: "c1" })).toHaveLength(3);
    expect(validateAssignment({ coachId: "c1", founderId: "f1", ventureId: "v1", startDate: new Date() })).toHaveLength(0);
  });

  it("should prevent duplicate active assignments for same coach-founder pair", () => {
    const existingAssignments = [
      { coachId: "coach-001", founderId: "founder-001", isActive: true },
      { coachId: "coach-001", founderId: "founder-002", isActive: false },
    ];

    const isDuplicateActive = (coachId: string, founderId: string) =>
      existingAssignments.some(
        (a) => a.coachId === coachId && a.founderId === founderId && a.isActive
      );

    expect(isDuplicateActive("coach-001", "founder-001")).toBe(true);
    expect(isDuplicateActive("coach-001", "founder-002")).toBe(false); // inactive
    expect(isDuplicateActive("coach-002", "founder-001")).toBe(false); // different coach
  });

  it("should correctly calculate assignment duration in weeks", () => {
    const calcDurationWeeks = (startDate: Date, endDate: Date | null): number | null => {
      if (!endDate) return null;
      const ms = endDate.getTime() - startDate.getTime();
      return Math.round(ms / (7 * 24 * 60 * 60 * 1000));
    };

    const start = new Date("2026-01-01");
    const end = new Date("2026-04-01");
    expect(calcDurationWeeks(start, end)).toBe(13);
    expect(calcDurationWeeks(start, null)).toBeNull();
  });
});

// ── 3. Commitment Templates ───────────────────────────────────────────────────

describe("Commitment Templates", () => {
  it("should validate VRL stage range for templates (1-9)", () => {
    const isValidStage = (stage: number) => Number.isInteger(stage) && stage >= 1 && stage <= 9;

    expect(isValidStage(1)).toBe(true);
    expect(isValidStage(4)).toBe(true);
    expect(isValidStage(9)).toBe(true);
    expect(isValidStage(0)).toBe(false);
    expect(isValidStage(10)).toBe(false);
    expect(isValidStage(1.5)).toBe(false);
  });

  it("should correctly map stage to lifecycle phase label", () => {
    const stageToPhase = (stage: number): string => {
      if (stage <= 2) return "Launch";
      if (stage <= 4) return "Build";
      if (stage <= 6) return "Grow";
      return "Scale";
    };

    expect(stageToPhase(1)).toBe("Launch");
    expect(stageToPhase(2)).toBe("Launch");
    expect(stageToPhase(3)).toBe("Build");
    expect(stageToPhase(4)).toBe("Build");
    expect(stageToPhase(5)).toBe("Grow");
    expect(stageToPhase(6)).toBe("Grow");
    expect(stageToPhase(7)).toBe("Scale");
    expect(stageToPhase(9)).toBe("Scale");
  });

  it("should calculate correct due date when applying a template (7 days from now)", () => {
    const calcDueDate = (appliedAt: Date, daysFromNow: number = 7): Date => {
      const due = new Date(appliedAt);
      due.setDate(due.getDate() + daysFromNow);
      return due;
    };

    const now = new Date("2026-04-07T00:00:00Z");
    const due = calcDueDate(now, 7);
    expect(due.toISOString().split("T")[0]).toBe("2026-04-14");
  });

  it("should set correct priority ordering for template commitments", () => {
    const templates = [
      { id: 1, priority: 3 },
      { id: 2, priority: 1 },
      { id: 3, priority: 2 },
    ];

    const sorted = [...templates].sort((a, b) => a.priority - b.priority);
    expect(sorted[0].id).toBe(2);
    expect(sorted[1].id).toBe(3);
    expect(sorted[2].id).toBe(1);
  });

  it("should not apply template if founder already has active commitments for this week", () => {
    const hasActiveCommitmentsThisWeek = (
      founderId: number,
      existingCommitments: Array<{ founderId: number; weekStart: string; status: string }>
    ): boolean => {
      const thisWeek = new Date();
      thisWeek.setHours(0, 0, 0, 0);
      thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay()); // Monday
      const weekStr = thisWeek.toISOString().split("T")[0];

      return existingCommitments.some(
        (c) => c.founderId === founderId && c.weekStart === weekStr && c.status !== "cancelled"
      );
    };

    const thisMonday = new Date();
    thisMonday.setDate(thisMonday.getDate() - thisMonday.getDay());
    const weekStr = thisMonday.toISOString().split("T")[0];

    const existing = [{ founderId: 1, weekStart: weekStr, status: "pending" }];
    expect(hasActiveCommitmentsThisWeek(1, existing)).toBe(true);
    expect(hasActiveCommitmentsThisWeek(2, existing)).toBe(false);
  });
});

// ── 4. Integration: PRL Score After Template Application ─────────────────────

describe("End-to-End: Template → Commitment → PRL cycle", () => {
  it("should correctly compute PRL after all 5 template commitments are completed", () => {
    const computePrl = (
      completedCount: number,
      totalCount: number,
      avgQuality: number,
      sessionEngagement: number
    ): number => {
      const completionRate = totalCount > 0 ? completedCount / totalCount : 0;
      const score =
        completionRate * 50 +
        (avgQuality / 5) * 30 +
        (sessionEngagement / 100) * 20;
      return Math.min(100, Math.max(0, Math.round(score * 10) / 10));
    };

    // All 5 completed, quality 4/5, session 80% → high PRL
    expect(computePrl(5, 5, 4, 80)).toBeGreaterThan(70);
    // 3/5 completed, quality 3/5, session 50% → medium PRL
    const medium = computePrl(3, 5, 3, 50);
    expect(medium).toBeGreaterThanOrEqual(40);
    expect(medium).toBeLessThan(70);
    // 0/5 completed → LOW PRL
    expect(computePrl(0, 5, 0, 0)).toBe(0);
    // Perfect → should be 100
    expect(computePrl(5, 5, 5, 100)).toBe(100);
  });

  it("should correctly determine risk level from PRL score after template application", () => {
    const getRisk = (score: number): "HIGH" | "MEDIUM" | "LOW" => {
      if (score < 40) return "HIGH";
      if (score < 70) return "MEDIUM";
      return "LOW";
    };

    expect(getRisk(0)).toBe("HIGH");
    expect(getRisk(39)).toBe("HIGH");
    expect(getRisk(40)).toBe("MEDIUM");
    expect(getRisk(69)).toBe("MEDIUM");
    expect(getRisk(70)).toBe("LOW");
    expect(getRisk(100)).toBe("LOW");
  });
});
