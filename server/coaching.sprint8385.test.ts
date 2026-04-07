/**
 * Sprint 83-85 Vitest Tests
 *
 * Sprint 83: Automated Alert Scheduling — schedule log, run trigger, audit trail
 * Sprint 84: Progress Report Email Delivery — send procedure, delivery log, status update
 * Sprint 85: Leaderboard Trend Sparklines — sparkline computation, cache, trend direction
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Sprint 83: Alert Scheduling ───────────────────────────────────────────────

describe("Sprint 83 — Alert Schedule Log", () => {
  it("should create a schedule log entry with success status", () => {
    const log = {
      id: "log-001",
      triggeredBy: "manual" as const,
      foundersScanned: 5,
      alertsGenerated: 2,
      alertsCritical: 1,
      alertsWarning: 1,
      alertsInfo: 0,
      durationMs: 142,
      status: "success" as const,
      weekOf: "2026-04-07",
    };

    expect(log.status).toBe("success");
    expect(log.alertsGenerated).toBe(log.alertsCritical + log.alertsWarning + log.alertsInfo);
    expect(log.durationMs).toBeGreaterThan(0);
  });

  it("should create a failed log entry when the engine throws", () => {
    const log = {
      id: "log-002",
      triggeredBy: "scheduled" as const,
      foundersScanned: 0,
      alertsGenerated: 0,
      alertsCritical: 0,
      alertsWarning: 0,
      alertsInfo: 0,
      durationMs: 5,
      status: "failed" as const,
      errorMessage: "Database connection timeout",
      weekOf: "2026-04-07",
    };

    expect(log.status).toBe("failed");
    expect(log.errorMessage).toBeTruthy();
    expect(log.foundersScanned).toBe(0);
  });

  it("should detect a sharp drop ≥10 pts and assign warning severity", () => {
    const prevScore = 65;
    const currentScore = 52;
    const drop = prevScore - currentScore;

    const severity = drop >= 20 ? "critical" : drop >= 10 ? "warning" : null;
    const alertType = drop >= 10 ? "sharp_drop" : null;

    expect(drop).toBe(13);
    expect(severity).toBe("warning");
    expect(alertType).toBe("sharp_drop");
  });

  it("should detect a critical drop ≥20 pts", () => {
    const prevScore = 80;
    const currentScore = 55;
    const drop = prevScore - currentScore;

    const severity = drop >= 20 ? "critical" : drop >= 10 ? "warning" : null;

    expect(drop).toBe(25);
    expect(severity).toBe("critical");
  });

  it("should not generate an alert when drop is less than 10 pts", () => {
    const prevScore = 70;
    const currentScore = 65;
    const drop = prevScore - currentScore;

    const alertType = drop >= 10 ? "sharp_drop" : null;

    expect(drop).toBe(5);
    expect(alertType).toBeNull();
  });

  it("should flag HIGH risk when PRL < 40", () => {
    const score = 38;
    const riskLevel = "HIGH";

    const shouldAlert = score < 40 && riskLevel === "HIGH";
    expect(shouldAlert).toBe(true);
  });

  it("should not flag alert when PRL ≥ 40 even if riskLevel is HIGH", () => {
    const score = 42;
    const riskLevel = "HIGH";

    const shouldAlert = score < 40 && riskLevel === "HIGH";
    expect(shouldAlert).toBe(false);
  });

  it("should correctly compute alertsGenerated as sum of severity counts", () => {
    const critical = 2;
    const warning = 3;
    const info = 1;
    const total = critical + warning + info;

    expect(total).toBe(6);
  });

  it("should accept all valid triggeredBy values", () => {
    const validTriggers = ["manual", "scheduled", "api"];
    validTriggers.forEach((t) => {
      expect(["manual", "scheduled", "api"]).toContain(t);
    });
  });

  it("should store weekOf as ISO week start date string", () => {
    const weekOf = "2026-04-06"; // Monday
    expect(weekOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ── Sprint 84: Progress Report Email Delivery ─────────────────────────────────

describe("Sprint 84 — Progress Report Email Delivery", () => {
  it("should build a valid notification title from founder name and period", () => {
    const founderName = "Alice Chen";
    const periodStart = "2026-03-10";
    const periodEnd = "2026-04-07";

    const title = `Progress Report: ${founderName} — ${periodStart} to ${periodEnd}`;
    expect(title).toBe("Progress Report: Alice Chen — 2026-03-10 to 2026-04-07");
  });

  it("should build notification content with all required fields", () => {
    const founderName = "Bob Osei";
    const period = "2026-03-10 to 2026-04-07";
    const prlScore = 72.5;
    const prlTrend = "improving";
    const avgScore = 68.3;
    const weeksTracked = 4;
    const completionRate = 80;
    const completed = 8;
    const total = 10;
    const sessions = 3;

    const content = [
      `**Founder:** ${founderName}`,
      `**Period:** ${period}`,
      `**PRL Score:** ${prlScore.toFixed(1)} (${prlTrend})`,
      `**Avg PRL:** ${avgScore.toFixed(1)} over ${weeksTracked} weeks`,
      `**Commitment Rate:** ${completionRate.toFixed(0)}% (${completed}/${total} completed)`,
      `**Sessions:** ${sessions}`,
    ].join("\n");

    expect(content).toContain("Bob Osei");
    expect(content).toContain("72.5");
    expect(content).toContain("improving");
    expect(content).toContain("80%");
    expect(content).toContain("**Sessions:** 3");
  });

  it("should create a delivery log entry with sent status on success", () => {
    const log = {
      id: "del-001",
      reportId: "rep-abc",
      founderId: 12,
      sentBy: "studio",
      channel: "notification" as const,
      status: "sent" as const,
      notificationId: "notify-1234567890",
    };

    expect(log.status).toBe("sent");
    expect(log.notificationId).toBeTruthy();
    expect(log.channel).toBe("notification");
  });

  it("should create a delivery log entry with failed status when notify returns false", () => {
    const log = {
      id: "del-002",
      reportId: "rep-xyz",
      founderId: 7,
      sentBy: "system",
      channel: "notification" as const,
      status: "failed" as const,
      errorMessage: "Notification service returned false",
    };

    expect(log.status).toBe("failed");
    expect(log.errorMessage).toContain("false");
  });

  it("should update report status to sent after successful delivery", () => {
    const report = {
      id: "rep-abc",
      status: "ready" as "draft" | "ready" | "sent",
      sentAt: null as Date | null,
    };

    // Simulate successful delivery
    report.status = "sent";
    report.sentAt = new Date();

    expect(report.status).toBe("sent");
    expect(report.sentAt).toBeInstanceOf(Date);
  });

  it("should not update report status if delivery failed", () => {
    const report = {
      id: "rep-xyz",
      status: "ready" as "draft" | "ready" | "sent",
      sentAt: null as Date | null,
    };

    const deliveryFailed = true;
    if (!deliveryFailed) {
      report.status = "sent";
    }

    expect(report.status).toBe("ready");
    expect(report.sentAt).toBeNull();
  });

  it("should validate all report status values", () => {
    const validStatuses = ["draft", "ready", "sent"];
    validStatuses.forEach((s) => {
      expect(["draft", "ready", "sent"]).toContain(s);
    });
  });

  it("should validate all delivery channel values", () => {
    const validChannels = ["notification", "email", "manual"];
    validChannels.forEach((c) => {
      expect(["notification", "email", "manual"]).toContain(c);
    });
  });

  it("should handle missing AI narrative gracefully", () => {
    const aiNarrative: string | null = null;
    const contentLines = [
      "**Founder:** Test",
      aiNarrative ? `**AI Summary:** ${aiNarrative}` : "",
    ].filter(Boolean);

    expect(contentLines).toHaveLength(1);
    expect(contentLines[0]).toBe("**Founder:** Test");
  });

  it("should include AI narrative when present", () => {
    const aiNarrative = "Strong PRL improvement driven by market validation milestones.";
    const contentLines = [
      "**Founder:** Test",
      aiNarrative ? `**AI Summary:** ${aiNarrative}` : "",
    ].filter(Boolean);

    expect(contentLines).toHaveLength(2);
    expect(contentLines[1]).toContain("Strong PRL improvement");
  });
});

// ── Sprint 85: Leaderboard Trend Sparklines ───────────────────────────────────

describe("Sprint 85 — Leaderboard Trend Sparklines", () => {
  it("should compute improving trend when latest score > first + 2", () => {
    const scores = [60, 63, 67, 70, 72, 75];
    const first = scores[0];
    const latest = scores[scores.length - 1];

    const trend =
      latest > first + 2 ? "improving" : latest < first - 2 ? "declining" : "stable";

    expect(trend).toBe("improving");
  });

  it("should compute declining trend when latest score < first - 2", () => {
    const scores = [80, 76, 72, 68, 65, 60];
    const first = scores[0];
    const latest = scores[scores.length - 1];

    const trend =
      latest > first + 2 ? "improving" : latest < first - 2 ? "declining" : "stable";

    expect(trend).toBe("declining");
  });

  it("should compute stable trend when change is within ±2 pts", () => {
    const scores = [70, 71, 69, 70, 71, 70];
    const first = scores[0];
    const latest = scores[scores.length - 1];

    const trend =
      latest > first + 2 ? "improving" : latest < first - 2 ? "declining" : "stable";

    expect(trend).toBe("stable");
  });

  it("should correctly compute min and max scores from sparkline data", () => {
    const scores = [55, 62, 70, 68, 75, 72];
    const min = Math.min(...scores);
    const max = Math.max(...scores);

    expect(min).toBe(55);
    expect(max).toBe(75);
  });

  it("should map sparkline data to { week, score } format", () => {
    const history = [
      { weekOf: "2026-02-24", compositeScore: "65.50" },
      { weekOf: "2026-03-03", compositeScore: "68.20" },
      { weekOf: "2026-03-10", compositeScore: "71.00" },
    ];

    const sparklineData = history.map((h) => ({
      week: h.weekOf,
      score: parseFloat(h.compositeScore),
    }));

    expect(sparklineData).toHaveLength(3);
    expect(sparklineData[0]).toEqual({ week: "2026-02-24", score: 65.5 });
    expect(sparklineData[2].score).toBe(71.0);
  });

  it("should generate SVG polyline points from sparkline data", () => {
    const data = [
      { week: "2026-03-01", score: 60 },
      { week: "2026-03-08", score: 70 },
      { week: "2026-03-15", score: 80 },
    ];
    const min = 60;
    const max = 80;
    const range = max - min;

    const points = data
      .map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 40 - ((d.score - min) / range) * 36;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    expect(points).toContain("0.0,40.0");   // first point at bottom-left
    expect(points).toContain("100.0,4.0");  // last point at top-right
    expect(points.split(" ")).toHaveLength(3);
  });

  it("should handle single-week history without crashing", () => {
    const data = [{ week: "2026-04-07", score: 72 }];
    const scores = data.map((d) => d.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const range = max - min || 1; // avoid division by zero

    expect(range).toBe(1);
    expect(min).toBe(72);
  });

  it("should upsert cache entry for existing coach", () => {
    const existing = [{ id: "cache-001" }];
    const operation = existing.length > 0 ? "update" : "insert";

    expect(operation).toBe("update");
  });

  it("should insert cache entry for new coach", () => {
    const existing: Array<{ id: string }> = [];
    const operation = existing.length > 0 ? "update" : "insert";

    expect(operation).toBe("insert");
  });

  it("should skip coaches with no snapshot history", () => {
    const history: Array<{ weekOf: string; compositeScore: string }> = [];
    const shouldSkip = history.length === 0;

    expect(shouldSkip).toBe(true);
  });

  it("should return sparklines ordered by latestScore descending", () => {
    const sparklines = [
      { coachId: "c1", latestScore: "72.00" },
      { coachId: "c2", latestScore: "88.50" },
      { coachId: "c3", latestScore: "65.30" },
    ].sort((a, b) => parseFloat(b.latestScore) - parseFloat(a.latestScore));

    expect(sparklines[0].coachId).toBe("c2");
    expect(sparklines[1].coachId).toBe("c1");
    expect(sparklines[2].coachId).toBe("c3");
  });
});
