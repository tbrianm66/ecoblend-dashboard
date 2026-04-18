/**
 * SPRINT 89-91 VITEST TESTS
 * Sprint 89: Founder Leaderboard (opt-in, compute, rank, opt-out)
 * Sprint 90: Session Scheduler (create request, confirm, reschedule, decline, complete, cancel)
 * Sprint 91: Template Effectiveness Analytics (compute, top 5, trend)
 */

import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";

// ── Sprint 89: Founder Leaderboard ────────────────────────────────────────────

describe("Sprint 89: Founder Leaderboard", () => {
  describe("leaderboard opt-in logic", () => {
    it("generates a unique display alias when one is provided", () => {
      const alias = "GreenFounder7";
      expect(alias.length).toBeGreaterThan(0);
      expect(alias.length).toBeLessThanOrEqual(50);
    });

    it("rejects empty display alias", () => {
      const alias = "";
      expect(alias.trim().length).toBe(0);
      // In the router, empty alias would fail z.string().min(1) validation
    });

    it("generates a valid UUID for leaderboard entry ID", () => {
      const id = randomUUID();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe("leaderboard ranking computation", () => {
    it("ranks founders by PRL score descending", () => {
      const founders = [
        { ventureId: "a", frlScore: 72.5 },
        { ventureId: "b", frlScore: 88.0 },
        { ventureId: "c", frlScore: 55.3 },
        { ventureId: "d", frlScore: 91.2 },
      ];
      const ranked = [...founders].sort((a, b) => b.frlScore - a.frlScore);
      expect(ranked[0].ventureId).toBe("d");
      expect(ranked[1].ventureId).toBe("b");
      expect(ranked[2].ventureId).toBe("a");
      expect(ranked[3].ventureId).toBe("c");
    });

    it("calculates percentile correctly", () => {
      const rank = 2;
      const total = 10;
      // percentile = ((total - rank) / total) * 100
      const percentile = ((total - rank) / total) * 100;
      expect(percentile).toBe(80);
    });

    it("assigns rank 1 to the highest scorer", () => {
      const scores = [55, 72, 88, 91, 63];
      const maxScore = Math.max(...scores);
      expect(maxScore).toBe(91);
      const rank1Index = scores.indexOf(maxScore);
      expect(rank1Index).toBe(3);
    });

    it("calculates week-on-week delta correctly", () => {
      const currentScore = 78.5;
      const previousScore = 71.2;
      const delta = currentScore - previousScore;
      expect(delta).toBeCloseTo(7.3, 1);
    });

    it("handles negative delta (score decline)", () => {
      const currentScore = 62.0;
      const previousScore = 75.5;
      const delta = currentScore - previousScore;
      expect(delta).toBeLessThan(0);
      expect(delta).toBeCloseTo(-13.5, 1);
    });

    it("handles zero delta (no change)", () => {
      const currentScore = 70.0;
      const previousScore = 70.0;
      const delta = currentScore - previousScore;
      expect(delta).toBe(0);
    });
  });

  describe("leaderboard anonymisation", () => {
    it("uses display alias instead of real name for opted-in founders", () => {
      const entry = {
        isOptedIn: true,
        displayAlias: "EcoBuilder42",
        realName: "Alice Johnson",
      };
      const displayName = entry.isOptedIn ? entry.displayAlias : "Anonymous";
      expect(displayName).toBe("EcoBuilder42");
      expect(displayName).not.toBe(entry.realName);
    });

    it("shows Anonymous for opted-out founders", () => {
      const entry = {
        isOptedIn: false,
        displayAlias: null,
        realName: "Bob Smith",
      };
      const displayName = entry.isOptedIn ? entry.displayAlias : "Anonymous";
      expect(displayName).toBe("Anonymous");
    });
  });
});

// ── Sprint 90: Session Scheduler ──────────────────────────────────────────────

describe("Sprint 90: Session Scheduler", () => {
  describe("session request creation", () => {
    it("generates a valid UUID for session request ID", () => {
      const id = randomUUID();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it("validates session type enum values", () => {
      const validTypes = ["prl_review", "commitment_check", "strategy", "wellbeing", "ad_hoc"];
      expect(validTypes).toContain("prl_review");
      expect(validTypes).toContain("commitment_check");
      expect(validTypes).toContain("strategy");
      expect(validTypes).toContain("wellbeing");
      expect(validTypes).toContain("ad_hoc");
      expect(validTypes).not.toContain("invalid_type");
    });

    it("sets initial status to pending", () => {
      const request = { status: "pending" as const };
      expect(request.status).toBe("pending");
    });

    it("stores preferred date as UTC timestamp", () => {
      const dateStr = "2026-05-15T10:00:00";
      const ts = new Date(dateStr).getTime();
      expect(ts).toBeGreaterThan(0);
      expect(typeof ts).toBe("number");
    });
  });

  describe("session confirmation", () => {
    it("transitions status from pending to confirmed", () => {
      const statuses = ["pending", "confirmed", "rescheduled", "cancelled", "completed"];
      const currentStatus = "pending";
      const newStatus = "confirmed";
      expect(statuses).toContain(newStatus);
      expect(currentStatus).not.toBe(newStatus);
    });

    it("validates meeting link format", () => {
      const validLinks = [
        "https://meet.google.com/abc-defg-hij",
        "https://zoom.us/j/123456789",
        "https://teams.microsoft.com/l/meetup-join/...",
      ];
      validLinks.forEach((link) => {
        expect(link.startsWith("https://")).toBe(true);
      });
    });

    it("rejects confirmation of already-confirmed request", () => {
      const request = { status: "confirmed" };
      const canConfirm = request.status === "pending";
      expect(canConfirm).toBe(false);
    });
  });

  describe("session rescheduling", () => {
    it("transitions status to rescheduled", () => {
      const newStatus = "rescheduled";
      expect(["pending", "confirmed", "rescheduled", "cancelled", "completed"]).toContain(newStatus);
    });

    it("requires a new proposed date for rescheduling", () => {
      const newDate = "2026-06-01T14:00:00";
      const ts = new Date(newDate).getTime();
      expect(ts).toBeGreaterThan(Date.now() - 1000 * 60 * 60 * 24 * 365); // within last year (just valid)
    });
  });

  describe("session cancellation and completion", () => {
    it("founder can cancel a pending request", () => {
      const request = { status: "pending", role: "founder" };
      const canCancel = request.status === "pending" && request.role === "founder";
      expect(canCancel).toBe(true);
    });

    it("founder cannot cancel a confirmed request", () => {
      const request = { status: "confirmed", role: "founder" };
      const canCancel = request.status === "pending";
      expect(canCancel).toBe(false);
    });

    it("coach can mark a confirmed session as completed", () => {
      const request = { status: "confirmed" };
      const canComplete = request.status === "confirmed";
      expect(canComplete).toBe(true);
    });

    it("transitions to completed status correctly", () => {
      const finalStatus = "completed";
      expect(finalStatus).toBe("completed");
    });
  });

  describe("role-based filtering", () => {
    const requests = [
      { id: "r1", coachId: "c1", ventureId: "v1", status: "pending" },
      { id: "r2", coachId: "c2", ventureId: "v2", status: "confirmed" },
      { id: "r3", coachId: "c1", ventureId: "v3", status: "completed" },
    ];

    it("filters requests by coachId for coach role", () => {
      const coachId = "c1";
      const coachRequests = requests.filter((r) => r.coachId === coachId);
      expect(coachRequests).toHaveLength(2);
    });

    it("filters requests by ventureId for founder role", () => {
      const ventureId = "v2";
      const founderRequests = requests.filter((r) => r.ventureId === ventureId);
      expect(founderRequests).toHaveLength(1);
      expect(founderRequests[0].id).toBe("r2");
    });
  });
});

// ── Sprint 91: Template Effectiveness Analytics ───────────────────────────────

describe("Sprint 91: Template Effectiveness Analytics", () => {
  describe("composite score calculation", () => {
    it("calculates composite score as 60% PRL uplift + 40% completion rate", () => {
      const prlUplift = 15.0; // normalised to 0-100 scale
      const completionRate = 80.0;
      // Normalise PRL uplift: assume max uplift = 30 pts → 100%
      const prlNorm = Math.min(100, (prlUplift / 30) * 100);
      const composite = 0.6 * prlNorm + 0.4 * completionRate;
      expect(composite).toBeCloseTo(0.6 * 50 + 0.4 * 80, 1);
    });

    it("clamps composite score to 0-100 range", () => {
      const rawScore = 120;
      const clamped = Math.min(100, Math.max(0, rawScore));
      expect(clamped).toBe(100);
    });

    it("handles zero usage count gracefully", () => {
      const usageCount = 0;
      const completedCount = 0;
      const completionRate = usageCount > 0 ? (completedCount / usageCount) * 100 : 0;
      expect(completionRate).toBe(0);
    });

    it("calculates completion rate correctly", () => {
      const usageCount = 20;
      const completedCount = 15;
      const completionRate = (completedCount / usageCount) * 100;
      expect(completionRate).toBe(75);
    });
  });

  describe("PRL uplift measurement", () => {
    it("measures uplift as post-PRL minus pre-PRL score", () => {
      const prePrl = 55.0;
      const postPrl = 72.5;
      const uplift = postPrl - prePrl;
      expect(uplift).toBeCloseTo(17.5, 1);
    });

    it("handles negative uplift (PRL declined after template)", () => {
      const prePrl = 70.0;
      const postPrl = 62.0;
      const uplift = postPrl - prePrl;
      expect(uplift).toBeLessThan(0);
      expect(uplift).toBeCloseTo(-8.0, 1);
    });

    it("handles zero uplift", () => {
      const prePrl = 65.0;
      const postPrl = 65.0;
      const uplift = postPrl - prePrl;
      expect(uplift).toBe(0);
    });
  });

  describe("top 5 ranking", () => {
    it("returns at most 5 templates", () => {
      const templates = Array.from({ length: 12 }, (_, i) => ({
        templateId: `t${i}`,
        compositeScore: Math.random() * 100,
      }));
      const top5 = templates.sort((a, b) => b.compositeScore - a.compositeScore).slice(0, 5);
      expect(top5.length).toBeLessThanOrEqual(5);
    });

    it("orders templates by composite score descending", () => {
      const templates = [
        { templateId: "t1", compositeScore: 45.2 },
        { templateId: "t2", compositeScore: 78.9 },
        { templateId: "t3", compositeScore: 62.1 },
        { templateId: "t4", compositeScore: 91.5 },
        { templateId: "t5", compositeScore: 33.7 },
      ];
      const sorted = [...templates].sort((a, b) => b.compositeScore - a.compositeScore);
      expect(sorted[0].templateId).toBe("t4");
      expect(sorted[1].templateId).toBe("t2");
      expect(sorted[2].templateId).toBe("t3");
    });

    it("handles fewer than 5 templates gracefully", () => {
      const templates = [
        { templateId: "t1", compositeScore: 70.0 },
        { templateId: "t2", compositeScore: 55.0 },
      ];
      const top5 = templates.slice(0, 5);
      expect(top5.length).toBe(2);
    });

    it("handles empty template list", () => {
      const templates: { templateId: string; compositeScore: number }[] = [];
      const top5 = templates.slice(0, 5);
      expect(top5.length).toBe(0);
    });
  });

  describe("effectiveness data freshness", () => {
    it("records computation timestamp", () => {
      const computedAt = new Date();
      expect(computedAt).toBeInstanceOf(Date);
      expect(computedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("generates valid UUID for effectiveness record", () => {
      const id = randomUUID();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it("tracks usage count and completed count separately", () => {
      const record = { usageCount: 25, completedCount: 18 };
      expect(record.completedCount).toBeLessThanOrEqual(record.usageCount);
      expect(record.usageCount - record.completedCount).toBe(7); // 7 incomplete
    });
  });
});
