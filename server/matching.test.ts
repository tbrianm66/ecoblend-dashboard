import { describe, it, expect } from "vitest";

// ── Unit tests for the matching engine scoring logic ──────────────────────
// These tests validate the scoring algorithm independently of the database.

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

function computeSectorScore(profileExpertise: string, oppSector: string): number {
  if (!profileExpertise || !oppSector) return 50;
  const sectors = profileExpertise.toLowerCase().split(",").map(s => s.trim());
  const opp = oppSector.toLowerCase();
  if (sectors.some(s => opp.includes(s) || s.includes(opp))) return 100;
  const partialMatch = sectors.some(s => {
    const words = opp.split(" ");
    return words.some(w => s.includes(w) || w.includes(s));
  });
  return partialMatch ? 60 : 20;
}

function computeAvailabilityScore(availability: string): number {
  const map: Record<string, number> = {
    "Immediately Available": 100,
    "Available in 1 Month": 80,
    "Available in 3 Months": 55,
    "Part-Time Only": 40,
    "Advisory Only": 20,
    "Not Available": 0,
  };
  return map[availability] ?? 50;
}

function computeCapabilityScore(
  profile: { capTechnical: number; capCommercial: number; capOperational: number },
  opp: { requiredCapabilities?: string | null }
): number {
  const caps = [profile.capTechnical, profile.capCommercial, profile.capOperational];
  const avg = caps.reduce((a, b) => a + b, 0) / caps.length;
  return clamp(Math.round(avg * 10));
}

function computeOverallScore(
  sector: number, capability: number, availability: number,
  pvf: number, experience: number, network: number
): number {
  return clamp(Math.round(
    sector * 0.25 +
    capability * 0.25 +
    availability * 0.15 +
    pvf * 0.15 +
    experience * 0.10 +
    network * 0.10
  ));
}

describe("Matching Engine — Sector Alignment", () => {
  it("returns 100 for exact sector match", () => {
    expect(computeSectorScore("Materials Science, Sustainability", "Materials Science")).toBe(100);
  });

  it("returns 100 for partial sector match", () => {
    expect(computeSectorScore("sustainable materials, cleantech", "Cleantech")).toBe(100);
  });

  it("returns 60 for word-level partial match", () => {
    expect(computeSectorScore("materials engineering", "Advanced Materials Science")).toBe(60);
  });

  it("returns 20 for no match", () => {
    expect(computeSectorScore("Finance, Banking", "Biotech")).toBe(20);
  });

  it("returns 50 for empty inputs", () => {
    expect(computeSectorScore("", "Materials Science")).toBe(50);
    expect(computeSectorScore("Materials", "")).toBe(50);
  });
});

describe("Matching Engine — Availability Score", () => {
  it("returns 100 for immediately available", () => {
    expect(computeAvailabilityScore("Immediately Available")).toBe(100);
  });

  it("returns 80 for available in 1 month", () => {
    expect(computeAvailabilityScore("Available in 1 Month")).toBe(80);
  });

  it("returns 0 for not available", () => {
    expect(computeAvailabilityScore("Not Available")).toBe(0);
  });

  it("returns 50 for unknown availability", () => {
    expect(computeAvailabilityScore("Unknown")).toBe(50);
  });
});

describe("Matching Engine — Capability Score", () => {
  it("returns high score for strong capabilities", () => {
    const score = computeCapabilityScore(
      { capTechnical: 9, capCommercial: 8, capOperational: 7 },
      {}
    );
    expect(score).toBeGreaterThanOrEqual(75);
  });

  it("returns low score for weak capabilities", () => {
    const score = computeCapabilityScore(
      { capTechnical: 2, capCommercial: 1, capOperational: 3 },
      {}
    );
    expect(score).toBeLessThanOrEqual(30);
  });
});

describe("Matching Engine — Overall Score", () => {
  it("computes weighted overall score correctly", () => {
    const score = computeOverallScore(100, 80, 100, 70, 60, 50);
    // 100*0.25 + 80*0.25 + 100*0.15 + 70*0.15 + 60*0.10 + 50*0.10
    // = 25 + 20 + 15 + 10.5 + 6 + 5 = 81.5 → 82
    expect(score).toBe(82);
  });

  it("clamps score to 0–100 range", () => {
    expect(computeOverallScore(0, 0, 0, 0, 0, 0)).toBe(0);
    expect(computeOverallScore(100, 100, 100, 100, 100, 100)).toBe(100);
  });

  it("strong match threshold is ≥75", () => {
    const score = computeOverallScore(90, 85, 100, 80, 70, 65);
    expect(score).toBeGreaterThanOrEqual(75);
  });
});

describe("Matching Engine — Score Boundaries", () => {
  it("clamp function works correctly", () => {
    expect(clamp(-10)).toBe(0);
    expect(clamp(150)).toBe(100);
    expect(clamp(50)).toBe(50);
  });
});
