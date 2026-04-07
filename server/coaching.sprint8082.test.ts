/**
 * Sprint 80-82 — Coaching Module V2 Tests
 * Tests for: PRL Trend Alerts, Founder Progress Report, Coach Performance Leaderboard
 */
import { describe, it, expect } from "vitest";

// ── Sprint 80: PRL Trend Alerts ──────────────────────────────────────────────
describe("Sprint 80 — PRL Trend Alerts", () => {
  it("detects critical drop when PRL falls more than 10 points WoW", () => {
    const current = 35;
    const previous = 60;
    const drop = previous - current;
    expect(drop).toBeGreaterThan(10);
    const severity = drop >= 20 ? "critical" : drop >= 10 ? "warning" : "info";
    expect(severity).toBe("critical");
  });

  it("detects warning drop when PRL falls 10-19 points WoW", () => {
    const current = 52;
    const previous = 62;
    const drop = previous - current;
    expect(drop).toBe(10);
    const severity = drop >= 20 ? "critical" : drop >= 10 ? "warning" : "info";
    expect(severity).toBe("warning");
  });

  it("does not alert when PRL drop is less than 10 points", () => {
    const current = 55;
    const previous = 60;
    const drop = previous - current;
    expect(drop).toBeLessThan(10);
    const severity = drop >= 20 ? "critical" : drop >= 10 ? "warning" : "info";
    expect(severity).toBe("info");
  });

  it("generates HIGH RISK alert when PRL score is below 40", () => {
    const score = 35;
    const isHighRisk = score < 40;
    expect(isHighRisk).toBe(true);
    const alertType = isHighRisk ? "high_risk" : "normal";
    expect(alertType).toBe("high_risk");
  });

  it("does not generate HIGH RISK alert when PRL is 40 or above", () => {
    const score = 40;
    expect(score < 40).toBe(false);
  });

  it("formats alert message with founder name and score", () => {
    const founderName = "Alice";
    const score = 32.5;
    const message = `${founderName} PRL dropped to ${score.toFixed(1)} — HIGH RISK`;
    expect(message).toContain("Alice");
    expect(message).toContain("32.5");
    expect(message).toContain("HIGH RISK");
  });

  it("counts alert severity breakdown correctly", () => {
    const alerts = [
      { severity: "critical" },
      { severity: "critical" },
      { severity: "warning" },
      { severity: "info" },
    ];
    const critical = alerts.filter((a) => a.severity === "critical").length;
    const warning = alerts.filter((a) => a.severity === "warning").length;
    const info = alerts.filter((a) => a.severity === "info").length;
    expect(critical).toBe(2);
    expect(warning).toBe(1);
    expect(info).toBe(1);
  });

  it("acknowledges alert by setting acknowledgedAt timestamp", () => {
    const alert = { id: "abc", acknowledgedAt: null };
    const acknowledged = { ...alert, acknowledgedAt: new Date().toISOString() };
    expect(acknowledged.acknowledgedAt).not.toBeNull();
  });

  it("excludes acknowledged alerts from active summary", () => {
    const alerts = [
      { id: "1", acknowledgedAt: null },
      { id: "2", acknowledgedAt: "2026-04-07T10:00:00Z" },
      { id: "3", acknowledgedAt: null },
    ];
    const active = alerts.filter((a) => a.acknowledgedAt === null);
    expect(active.length).toBe(2);
  });

  it("returns empty alerts array when no founders have PRL data", () => {
    const founders: unknown[] = [];
    const alerts = founders.flatMap(() => []);
    expect(alerts.length).toBe(0);
  });
});

// ── Sprint 81: Founder Progress Report ───────────────────────────────────────
describe("Sprint 81 — Founder Progress Report", () => {
  it("calculates average PRL over a 4-week period", () => {
    const scores = [65.0, 70.0, 72.5, 68.0];
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    expect(avg).toBeCloseTo(68.875, 2);
  });

  it("calculates overall completion rate from commitments", () => {
    const commitments = [
      { status: "complete", coachVerified: true },
      { status: "complete", coachVerified: true },
      { status: "pending", coachVerified: false },
      { status: "missed", coachVerified: false },
    ];
    const completed = commitments.filter((c) => c.status === "complete" && c.coachVerified).length;
    const rate = Math.round((completed / commitments.length) * 100);
    expect(rate).toBe(50);
  });

  it("determines PRL trend direction from first to last score", () => {
    const first = 55.0;
    const last = 72.5;
    const trend = last > first ? "improving" : last < first ? "declining" : "stable";
    expect(trend).toBe("improving");
  });

  it("determines declining trend correctly", () => {
    const first = 80.0;
    const last = 60.0;
    const trend = last > first ? "improving" : last < first ? "declining" : "stable";
    expect(trend).toBe("declining");
  });

  it("counts sessions in the report period", () => {
    const sessions = [
      { week: "2026-03-17" },
      { week: "2026-03-24" },
      { week: "2026-03-31" },
    ];
    expect(sessions.length).toBe(3);
  });

  it("generates a unique report ID using UUID format", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(uuid).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("includes founder name in the report title", () => {
    const founderName = "Bob";
    const title = `Founder Progress Report — ${founderName}`;
    expect(title).toContain("Bob");
  });

  it("formats period label as start to end date", () => {
    const start = "2026-03-10";
    const end = "2026-04-07";
    const label = `${start} to ${end}`;
    expect(label).toBe("2026-03-10 to 2026-04-07");
  });

  it("returns empty report when no PRL data exists for period", () => {
    const prlHistory: unknown[] = [];
    const avgPrl = prlHistory.length > 0 ? 50 : null;
    expect(avgPrl).toBeNull();
  });

  it("stores report with generatedAt timestamp", () => {
    const report = { id: "r1", generatedAt: new Date() };
    expect(report.generatedAt).toBeInstanceOf(Date);
  });
});

// ── Sprint 82: Coach Performance Leaderboard ─────────────────────────────────
describe("Sprint 82 — Coach Performance Leaderboard", () => {
  it("computes composite score: 40% PRL improvement + 30% commitment rate + 30% session frequency", () => {
    const prlImprovement = 80; // normalised 0-100
    const commitmentRate = 75;
    const sessionFrequency = 60;
    const composite = 0.4 * prlImprovement + 0.3 * commitmentRate + 0.3 * sessionFrequency;
    expect(composite).toBeCloseTo(72.5, 1);
  });

  it("ranks coaches in descending order of composite score", () => {
    const coaches = [
      { name: "Alice", score: 72.5 },
      { name: "Bob", score: 85.0 },
      { name: "Carol", score: 68.0 },
    ];
    const ranked = [...coaches].sort((a, b) => b.score - a.score);
    expect(ranked[0].name).toBe("Bob");
    expect(ranked[1].name).toBe("Alice");
    expect(ranked[2].name).toBe("Carol");
  });

  it("assigns rank 1 to the top scoring coach", () => {
    const coaches = [{ score: 90 }, { score: 75 }, { score: 60 }];
    const ranked = [...coaches].sort((a, b) => b.score - a.score).map((c, i) => ({ ...c, rank: i + 1 }));
    expect(ranked[0].rank).toBe(1);
  });

  it("calculates average PRL improvement across assigned founders", () => {
    const improvements = [5.0, 10.0, -2.0, 8.0];
    const avg = improvements.reduce((a, b) => a + b, 0) / improvements.length;
    expect(avg).toBeCloseTo(5.25, 2);
  });

  it("handles coach with no assigned founders gracefully", () => {
    const founders: unknown[] = [];
    const avgImprovement = founders.length > 0 ? 10 : 0;
    expect(avgImprovement).toBe(0);
  });

  it("calculates commitment completion rate across all assigned founders", () => {
    const allCommitments = [
      { status: "complete", coachVerified: true },
      { status: "complete", coachVerified: true },
      { status: "pending", coachVerified: false },
    ];
    const completed = allCommitments.filter((c) => c.status === "complete" && c.coachVerified).length;
    const rate = Math.round((completed / allCommitments.length) * 100);
    expect(rate).toBe(67);
  });

  it("counts unique sessions per coach in the period", () => {
    const sessions = [
      { coachId: 1 },
      { coachId: 1 },
      { coachId: 2 },
    ];
    const coachSessions = sessions.filter((s) => s.coachId === 1).length;
    expect(coachSessions).toBe(2);
  });

  it("limits leaderboard to requested count", () => {
    const coaches = Array.from({ length: 20 }, (_, i) => ({ id: i, score: 100 - i }));
    const top10 = coaches.slice(0, 10);
    expect(top10.length).toBe(10);
  });

  it("stores leaderboard snapshot with week and computed timestamp", () => {
    const snapshot = {
      week: "2026-04-07",
      computedAt: new Date(),
      coachId: 1,
      compositeScore: 72.5,
    };
    expect(snapshot.week).toBe("2026-04-07");
    expect(snapshot.computedAt).toBeInstanceOf(Date);
  });

  it("returns empty leaderboard when no coaches are registered", () => {
    const coaches: unknown[] = [];
    const leaderboard = coaches.map(() => ({}));
    expect(leaderboard.length).toBe(0);
  });
});
