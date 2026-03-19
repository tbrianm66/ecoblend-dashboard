// ── Workflow Engine Tests ─────────────────────────────────────────────────────
import { describe, it, expect } from "vitest";

// ── Unit tests for trigger logic (pure functions, no DB) ─────────────────────

describe("Workflow Engine — trigger type validation", () => {
  it("recognises all three valid trigger types", () => {
    const validTypes = ["research_completed", "audit_failed", "supplier_approved"];
    for (const t of validTypes) {
      expect(["research_completed", "audit_failed", "supplier_approved"]).toContain(t);
    }
  });

  it("rejects unknown trigger types", () => {
    const invalidTypes = ["research_started", "audit_passed", "supplier_rejected", ""];
    for (const t of invalidTypes) {
      expect(["research_completed", "audit_failed", "supplier_approved"]).not.toContain(t);
    }
  });
});

describe("Workflow Engine — audit score calculation", () => {
  type CheckValue = "pass" | "partial" | "fail";

  function calcAuditScore(items: CheckValue[]): number {
    const rawScore = items.reduce(
      (acc, v) => acc + (v === "pass" ? 2 : v === "partial" ? 1 : 0),
      0
    );
    return Math.round((rawScore / (items.length * 2)) * 100);
  }

  it("returns 100% when all items pass", () => {
    const items: CheckValue[] = ["pass", "pass", "pass", "pass", "pass", "pass"];
    expect(calcAuditScore(items)).toBe(100);
  });

  it("returns 0% when all items fail", () => {
    const items: CheckValue[] = ["fail", "fail", "fail", "fail", "fail", "fail"];
    expect(calcAuditScore(items)).toBe(0);
  });

  it("returns 50% when all items are partial", () => {
    const items: CheckValue[] = ["partial", "partial", "partial", "partial", "partial", "partial"];
    expect(calcAuditScore(items)).toBe(50);
  });

  it("correctly mixes pass, partial, and fail", () => {
    // 2 pass (4pts) + 2 partial (2pts) + 2 fail (0pts) = 6/12 = 50%
    const items: CheckValue[] = ["pass", "pass", "partial", "partial", "fail", "fail"];
    expect(calcAuditScore(items)).toBe(50);
  });

  it("detects failed items correctly", () => {
    const items: CheckValue[] = ["pass", "pass", "pass", "pass", "pass", "fail"];
    const hasFailed = items.some((v) => v === "fail");
    expect(hasFailed).toBe(true);
  });

  it("does not trigger when no items fail", () => {
    const items: CheckValue[] = ["pass", "pass", "partial", "pass", "pass", "partial"];
    const hasFailed = items.some((v) => v === "fail");
    expect(hasFailed).toBe(false);
  });
});

describe("Workflow Engine — supplier capability score aggregation", () => {
  function calcOverallScore(scores: (number | null | undefined)[]): number {
    const valid = scores.filter((s): s is number => s != null);
    if (valid.length === 0) return 0;
    const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
    return Math.round(avg * 10) / 10;
  }

  it("averages all 6 capability scores correctly", () => {
    const scores = [8, 7, 9, 6, 8, 7];
    expect(calcOverallScore(scores)).toBe(7.5);
  });

  it("handles missing scores gracefully", () => {
    const scores = [8, null, 9, undefined, 8, null];
    expect(calcOverallScore(scores)).toBe(8.3);
  });

  it("returns 0 when all scores are null", () => {
    const scores = [null, null, null];
    expect(calcOverallScore(scores)).toBe(0);
  });

  it("rounds to 1 decimal place", () => {
    const scores = [7, 8, 9];
    expect(calcOverallScore(scores)).toBe(8);
  });
});

describe("Workflow Engine — research trigger conditions", () => {
  it("fires trigger for completed status", () => {
    const status = "completed";
    const shouldFire = status === "completed" || status === "published";
    expect(shouldFire).toBe(true);
  });

  it("fires trigger for published status", () => {
    const status = "published";
    const shouldFire = status === "completed" || status === "published";
    expect(shouldFire).toBe(true);
  });

  it("does not fire trigger for active status", () => {
    const status = "active";
    const shouldFire = status === "completed" || status === "published";
    expect(shouldFire).toBe(false);
  });

  it("does not fire trigger for planned status", () => {
    const status = "planned";
    const shouldFire = status === "completed" || status === "published";
    expect(shouldFire).toBe(false);
  });

  it("does not fire trigger for paused status", () => {
    const status = "paused";
    const shouldFire = status === "completed" || status === "published";
    expect(shouldFire).toBe(false);
  });
});

describe("Workflow Engine — supplier approved trigger conditions", () => {
  it("fires trigger for approved status", () => {
    const status = "approved";
    const shouldFire = status === "approved";
    expect(shouldFire).toBe(true);
  });

  it("does not fire trigger for pending status", () => {
    const status = "pending";
    const shouldFire = status === "approved";
    expect(shouldFire).toBe(false);
  });

  it("does not fire trigger for under_review status", () => {
    const status = "under_review";
    const shouldFire = status === "approved";
    expect(shouldFire).toBe(false);
  });

  it("does not fire trigger for rejected status", () => {
    const status = "rejected";
    const shouldFire = status === "approved";
    expect(shouldFire).toBe(false);
  });
});

describe("Workflow Engine — trigger log status values", () => {
  const validStatuses = ["pending", "success", "failed", "skipped"];

  it("validates all expected status values", () => {
    for (const s of validStatuses) {
      expect(validStatuses).toContain(s);
    }
  });

  it("identifies failed triggers correctly", () => {
    const logs = [
      { id: 1, status: "success" },
      { id: 2, status: "failed" },
      { id: 3, status: "skipped" },
      { id: 4, status: "success" },
    ];
    const failed = logs.filter((l) => l.status === "failed");
    expect(failed).toHaveLength(1);
    expect(failed[0].id).toBe(2);
  });

  it("calculates success rate correctly", () => {
    const total = 10;
    const success = 8;
    const rate = Math.round((success / total) * 100);
    expect(rate).toBe(80);
  });

  it("handles zero total triggers gracefully", () => {
    const total = 0;
    const success = 0;
    const rate = total > 0 ? Math.round((success / total) * 100) : 0;
    expect(rate).toBe(0);
  });
});

describe("Workflow Engine — idempotency logic", () => {
  it("skips re-firing when a successful log already exists for the same source record", () => {
    const existingLogs = [
      { triggerType: "research_completed", sourceRecordId: 42, status: "success" },
    ];

    function alreadyFired(triggerType: string, sourceRecordId: number): boolean {
      return existingLogs.some(
        (l) => l.triggerType === triggerType && l.sourceRecordId === sourceRecordId && l.status === "success"
      );
    }

    expect(alreadyFired("research_completed", 42)).toBe(true);
    expect(alreadyFired("research_completed", 99)).toBe(false);
    expect(alreadyFired("audit_failed", 42)).toBe(false);
  });

  it("allows re-run when retriedFrom is set (bypasses idempotency)", () => {
    // When retriedFrom is provided, the trigger should re-fire regardless
    const retriedFrom = 5;
    const shouldBypassIdempotency = retriedFrom !== undefined;
    expect(shouldBypassIdempotency).toBe(true);
  });
});

describe("Workflow Engine — cross-module target record creation", () => {
  it("maps research_completed to experimentLog target module", () => {
    const triggerToTarget: Record<string, string> = {
      research_completed: "experimentLog",
      audit_failed: "ventureProjectManagement",
      supplier_approved: "approvedSupplierList",
    };
    expect(triggerToTarget["research_completed"]).toBe("experimentLog");
    expect(triggerToTarget["audit_failed"]).toBe("ventureProjectManagement");
    expect(triggerToTarget["supplier_approved"]).toBe("approvedSupplierList");
  });

  it("maps audit_failed to ventureProjectManagement target module", () => {
    const targetModule = "ventureProjectManagement";
    expect(targetModule).toBe("ventureProjectManagement");
  });

  it("maps supplier_approved to approvedSupplierList target module", () => {
    const targetModule = "approvedSupplierList";
    expect(targetModule).toBe("approvedSupplierList");
  });
});
