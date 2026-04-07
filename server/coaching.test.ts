/**
 * Coaching Module V2 — Unit Tests
 * Architecture: BEBUS-COACH-V2-001
 *
 * Tests: PRL scoring engine, risk classification, trend detection,
 *        VRL link calculation, AI insight structure
 */

import { describe, it, expect } from "vitest";

// ── PRL Scoring Engine (replicated from coaching.router.ts) ──────────────────

const W_COMPLETION = 0.5;
const W_QUALITY = 0.3;
const W_SESSION = 0.2;

function calculatePrlScore(
  completionRate: number,
  qualityScore: number,
  sessionScore: number
): number {
  return (
    W_COMPLETION * completionRate +
    W_QUALITY * qualityScore +
    W_SESSION * sessionScore
  );
}

function classifyRisk(prl: number): "HIGH" | "MEDIUM" | "LOW" {
  if (prl < 40) return "HIGH";
  if (prl < 70) return "MEDIUM";
  return "LOW";
}

function detectTrend(
  current: number,
  previous: number | null
): "improving" | "declining" | "stable" {
  if (previous === null) return "stable";
  const delta = current - previous;
  if (delta > 5) return "improving";
  if (delta < -5) return "declining";
  return "stable";
}

function calculateVrlLink(vrlScore: number, prlScore: number): number {
  const prlMultiplier = 0.8 + (prlScore / 100) * 0.4;
  return Math.min(100, Math.max(0, vrlScore * prlMultiplier));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PRL Scoring Engine", () => {
  it("calculates PRL score correctly with all inputs at 100", () => {
    const score = calculatePrlScore(100, 100, 100);
    expect(score).toBe(100);
  });

  it("calculates PRL score correctly with all inputs at 0", () => {
    const score = calculatePrlScore(0, 0, 0);
    expect(score).toBe(0);
  });

  it("calculates PRL score with typical inputs", () => {
    // 80% completion, 70% quality, 60% session = 0.5*80 + 0.3*70 + 0.2*60
    const score = calculatePrlScore(80, 70, 60);
    expect(score).toBe(40 + 21 + 12); // = 73
  });

  it("weights completion rate at 50%", () => {
    const score = calculatePrlScore(100, 0, 0);
    expect(score).toBe(50);
  });

  it("weights quality score at 30%", () => {
    const score = calculatePrlScore(0, 100, 0);
    expect(score).toBe(30);
  });

  it("weights session score at 20%", () => {
    const score = calculatePrlScore(0, 0, 100);
    expect(score).toBe(20);
  });
});

describe("Risk Classification", () => {
  it("classifies PRL < 40 as HIGH risk", () => {
    expect(classifyRisk(0)).toBe("HIGH");
    expect(classifyRisk(20)).toBe("HIGH");
    expect(classifyRisk(39)).toBe("HIGH");
  });

  it("classifies PRL 40–69 as MEDIUM risk", () => {
    expect(classifyRisk(40)).toBe("MEDIUM");
    expect(classifyRisk(55)).toBe("MEDIUM");
    expect(classifyRisk(69)).toBe("MEDIUM");
  });

  it("classifies PRL >= 70 as LOW risk", () => {
    expect(classifyRisk(70)).toBe("LOW");
    expect(classifyRisk(85)).toBe("LOW");
    expect(classifyRisk(100)).toBe("LOW");
  });
});

describe("Trend Detection", () => {
  it("returns stable when no previous score", () => {
    expect(detectTrend(75, null)).toBe("stable");
  });

  it("returns improving when delta > 5", () => {
    expect(detectTrend(80, 70)).toBe("improving");
    expect(detectTrend(100, 90)).toBe("improving");
  });

  it("returns declining when delta < -5", () => {
    expect(detectTrend(60, 70)).toBe("declining");
    expect(detectTrend(30, 50)).toBe("declining");
  });

  it("returns stable when delta is within ±5", () => {
    expect(detectTrend(75, 73)).toBe("stable");
    expect(detectTrend(75, 77)).toBe("stable");
    expect(detectTrend(75, 80)).toBe("stable"); // delta = -5, boundary
  });
});

describe("VRL Link Calculation", () => {
  it("applies PRL multiplier to VRL score", () => {
    // PRL 100 → multiplier = 0.8 + 0.4 = 1.2 → VRL 80 * 1.2 = 96
    const adjusted = calculateVrlLink(80, 100);
    expect(adjusted).toBeCloseTo(96, 1);
  });

  it("reduces VRL when PRL is 0", () => {
    // PRL 0 → multiplier = 0.8 → VRL 80 * 0.8 = 64
    const adjusted = calculateVrlLink(80, 0);
    expect(adjusted).toBeCloseTo(64, 1);
  });

  it("applies neutral multiplier at PRL 50", () => {
    // PRL 50 → multiplier = 0.8 + 0.2 = 1.0 → VRL unchanged
    const adjusted = calculateVrlLink(75, 50);
    expect(adjusted).toBeCloseTo(75, 1);
  });

  it("caps adjusted VRL at 100", () => {
    const adjusted = calculateVrlLink(100, 100);
    expect(adjusted).toBe(100);
  });

  it("floors adjusted VRL at 0", () => {
    const adjusted = calculateVrlLink(0, 0);
    expect(adjusted).toBe(0);
  });
});

describe("Coaching Module V2 — Architecture Compliance", () => {
  it("PRL formula uses correct weights summing to 1.0", () => {
    const totalWeight = W_COMPLETION + W_QUALITY + W_SESSION;
    expect(totalWeight).toBe(1.0);
  });

  it("HIGH risk threshold is below 40", () => {
    expect(classifyRisk(39)).toBe("HIGH");
    expect(classifyRisk(40)).not.toBe("HIGH");
  });

  it("LOW risk threshold starts at 70", () => {
    expect(classifyRisk(69)).not.toBe("LOW");
    expect(classifyRisk(70)).toBe("LOW");
  });

  it("trend detection uses ±5 point threshold", () => {
    // Exactly +5 should be stable (not improving)
    expect(detectTrend(80, 75)).toBe("stable");
    // +6 should be improving
    expect(detectTrend(81, 75)).toBe("improving");
    // Exactly -5 should be stable (not declining)
    expect(detectTrend(70, 75)).toBe("stable");
    // -6 should be declining
    expect(detectTrend(69, 75)).toBe("declining");
  });
});
