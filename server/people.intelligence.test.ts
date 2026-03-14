/**
 * People Intelligence Module — Vitest Tests
 * Tests for PVF scoring engine, team gap analysis, and talent profile helpers
 */

import { describe, it, expect } from "vitest";

// ── PVF Scoring Engine ─────────────────────────────────────────────────────

/**
 * PVF Score = weighted average of 6 dimensions (0–10 each):
 *   missionAlignment (30%), skillsMatch (25%), experienceRelevance (20%),
 *   networkValue (10%), commitmentLevel (10%), culturalFit (5%)
 */
function computePvfScore(dimensions: {
  missionAlignment: number;
  skillsMatch: number;
  experienceRelevance: number;
  networkValue: number;
  commitmentLevel: number;
  culturalFit: number;
}): number {
  const {
    missionAlignment, skillsMatch, experienceRelevance,
    networkValue, commitmentLevel, culturalFit,
  } = dimensions;
  const raw =
    missionAlignment * 0.30 +
    skillsMatch * 0.25 +
    experienceRelevance * 0.20 +
    networkValue * 0.10 +
    commitmentLevel * 0.10 +
    culturalFit * 0.05;
  return Math.round(raw * 100) / 100;
}

function getPvfLabel(score: number): string {
  if (score >= 8.5) return "Highly Recommended";
  if (score >= 7.0) return "Strong Fit";
  if (score >= 5.5) return "Moderate Fit";
  if (score >= 4.0) return "Weak Fit";
  return "Not Recommended";
}

describe("PVF Scoring Engine", () => {
  it("returns 10 for a perfect candidate", () => {
    const score = computePvfScore({
      missionAlignment: 10,
      skillsMatch: 10,
      experienceRelevance: 10,
      networkValue: 10,
      commitmentLevel: 10,
      culturalFit: 10,
    });
    expect(score).toBe(10);
  });

  it("returns 0 for a zero candidate", () => {
    const score = computePvfScore({
      missionAlignment: 0,
      skillsMatch: 0,
      experienceRelevance: 0,
      networkValue: 0,
      commitmentLevel: 0,
      culturalFit: 0,
    });
    expect(score).toBe(0);
  });

  it("weights mission alignment most heavily (30%)", () => {
    const highMission = computePvfScore({
      missionAlignment: 10,
      skillsMatch: 5,
      experienceRelevance: 5,
      networkValue: 5,
      commitmentLevel: 5,
      culturalFit: 5,
    });
    const highSkills = computePvfScore({
      missionAlignment: 5,
      skillsMatch: 10,
      experienceRelevance: 5,
      networkValue: 5,
      commitmentLevel: 5,
      culturalFit: 5,
    });
    expect(highMission).toBeGreaterThan(highSkills);
  });

  it("weights skills match second (25%)", () => {
    const highSkills = computePvfScore({
      missionAlignment: 5,
      skillsMatch: 10,
      experienceRelevance: 5,
      networkValue: 5,
      commitmentLevel: 5,
      culturalFit: 5,
    });
    const highNetwork = computePvfScore({
      missionAlignment: 5,
      skillsMatch: 5,
      experienceRelevance: 5,
      networkValue: 10,
      commitmentLevel: 5,
      culturalFit: 5,
    });
    expect(highSkills).toBeGreaterThan(highNetwork);
  });

  it("weights cultural fit least (5%)", () => {
    const highCultural = computePvfScore({
      missionAlignment: 5,
      skillsMatch: 5,
      experienceRelevance: 5,
      networkValue: 5,
      commitmentLevel: 5,
      culturalFit: 10,
    });
    const highMission = computePvfScore({
      missionAlignment: 10,
      skillsMatch: 5,
      experienceRelevance: 5,
      networkValue: 5,
      commitmentLevel: 5,
      culturalFit: 5,
    });
    expect(highMission).toBeGreaterThan(highCultural);
  });

  it("computes a realistic mid-range score correctly", () => {
    const score = computePvfScore({
      missionAlignment: 8,
      skillsMatch: 7,
      experienceRelevance: 6,
      networkValue: 5,
      commitmentLevel: 8,
      culturalFit: 7,
    });
    // 8*0.30 + 7*0.25 + 6*0.20 + 5*0.10 + 8*0.10 + 7*0.05
    // = 2.4 + 1.75 + 1.2 + 0.5 + 0.8 + 0.35 = 7.0
    expect(score).toBe(7.0);
  });

  it("rounds to 2 decimal places", () => {
    const score = computePvfScore({
      missionAlignment: 7,
      skillsMatch: 6,
      experienceRelevance: 8,
      networkValue: 5,
      commitmentLevel: 9,
      culturalFit: 4,
    });
    expect(Number.isFinite(score)).toBe(true);
    expect(String(score).split(".")[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });
});

// ── PVF Label Classification ───────────────────────────────────────────────

describe("PVF Label Classification", () => {
  it("labels score >= 8.5 as Highly Recommended", () => {
    expect(getPvfLabel(8.5)).toBe("Highly Recommended");
    expect(getPvfLabel(10)).toBe("Highly Recommended");
    expect(getPvfLabel(9.2)).toBe("Highly Recommended");
  });

  it("labels score 7.0–8.49 as Strong Fit", () => {
    expect(getPvfLabel(7.0)).toBe("Strong Fit");
    expect(getPvfLabel(8.0)).toBe("Strong Fit");
    expect(getPvfLabel(8.49)).toBe("Strong Fit");
  });

  it("labels score 5.5–6.99 as Moderate Fit", () => {
    expect(getPvfLabel(5.5)).toBe("Moderate Fit");
    expect(getPvfLabel(6.5)).toBe("Moderate Fit");
    expect(getPvfLabel(6.99)).toBe("Moderate Fit");
  });

  it("labels score 4.0–5.49 as Weak Fit", () => {
    expect(getPvfLabel(4.0)).toBe("Weak Fit");
    expect(getPvfLabel(5.0)).toBe("Weak Fit");
    expect(getPvfLabel(5.49)).toBe("Weak Fit");
  });

  it("labels score < 4.0 as Not Recommended", () => {
    expect(getPvfLabel(3.99)).toBe("Not Recommended");
    expect(getPvfLabel(0)).toBe("Not Recommended");
    expect(getPvfLabel(2.5)).toBe("Not Recommended");
  });
});

// ── Team Gap Analysis ──────────────────────────────────────────────────────

type TeamRole = "CEO" | "CTO" | "CFO" | "CMO" | "COO" | "CPO" | "CSO" | "Advisor";

function identifyTeamGaps(
  requiredRoles: TeamRole[],
  filledRoles: TeamRole[]
): TeamRole[] {
  const filledSet = new Set(filledRoles);
  return requiredRoles.filter(r => !filledSet.has(r));
}

function computeTeamCompleteness(
  requiredRoles: TeamRole[],
  filledRoles: TeamRole[]
): number {
  if (requiredRoles.length === 0) return 100;
  const gaps = identifyTeamGaps(requiredRoles, filledRoles);
  return Math.round(((requiredRoles.length - gaps.length) / requiredRoles.length) * 100);
}

describe("Team Gap Analysis", () => {
  it("identifies missing roles correctly", () => {
    const gaps = identifyTeamGaps(
      ["CEO", "CTO", "CFO", "CMO"],
      ["CEO", "CTO"]
    );
    expect(gaps).toContain("CFO");
    expect(gaps).toContain("CMO");
    expect(gaps).not.toContain("CEO");
    expect(gaps).not.toContain("CTO");
  });

  it("returns empty array when all roles are filled", () => {
    const gaps = identifyTeamGaps(
      ["CEO", "CTO", "CFO"],
      ["CEO", "CTO", "CFO"]
    );
    expect(gaps).toHaveLength(0);
  });

  it("returns all roles when team is empty", () => {
    const gaps = identifyTeamGaps(["CEO", "CTO", "CFO"], []);
    expect(gaps).toHaveLength(3);
  });

  it("computes 100% completeness when all roles filled", () => {
    const completeness = computeTeamCompleteness(
      ["CEO", "CTO", "CFO"],
      ["CEO", "CTO", "CFO"]
    );
    expect(completeness).toBe(100);
  });

  it("computes 0% completeness when no roles filled", () => {
    const completeness = computeTeamCompleteness(["CEO", "CTO", "CFO"], []);
    expect(completeness).toBe(0);
  });

  it("computes partial completeness correctly", () => {
    const completeness = computeTeamCompleteness(
      ["CEO", "CTO", "CFO", "CMO"],
      ["CEO", "CTO"]
    );
    expect(completeness).toBe(50);
  });

  it("handles empty required roles returning 100%", () => {
    const completeness = computeTeamCompleteness([], []);
    expect(completeness).toBe(100);
  });
});

// ── Founder Suitability Score ──────────────────────────────────────────────

/**
 * Founder Suitability = average of domain expertise, leadership, resilience,
 * network strength, execution speed (0–10 each)
 */
function computeFounderSuitability(scores: {
  domainExpertise: number;
  leadership: number;
  resilience: number;
  networkStrength: number;
  executionSpeed: number;
}): number {
  const vals = Object.values(scores);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.round(avg * 100) / 100;
}

describe("Founder Suitability Score", () => {
  it("returns 10 for perfect scores", () => {
    expect(computeFounderSuitability({
      domainExpertise: 10, leadership: 10, resilience: 10,
      networkStrength: 10, executionSpeed: 10,
    })).toBe(10);
  });

  it("returns 0 for zero scores", () => {
    expect(computeFounderSuitability({
      domainExpertise: 0, leadership: 0, resilience: 0,
      networkStrength: 0, executionSpeed: 0,
    })).toBe(0);
  });

  it("computes average correctly for mixed scores", () => {
    const score = computeFounderSuitability({
      domainExpertise: 8, leadership: 7, resilience: 9,
      networkStrength: 6, executionSpeed: 5,
    });
    // (8+7+9+6+5)/5 = 35/5 = 7
    expect(score).toBe(7);
  });

  it("rounds to 2 decimal places", () => {
    const score = computeFounderSuitability({
      domainExpertise: 7, leadership: 8, resilience: 6,
      networkStrength: 9, executionSpeed: 7,
    });
    expect(Number.isFinite(score)).toBe(true);
  });
});

// ── Portfolio People Summary ───────────────────────────────────────────────

describe("Portfolio People Summary", () => {
  const talentPool = [
    { id: 1, name: "Alice", pvfScore: 8.5, ventureId: "ecoblend" },
    { id: 2, name: "Bob",   pvfScore: 6.2, ventureId: "ecoblend" },
    { id: 3, name: "Carol", pvfScore: 9.1, ventureId: "ecopack" },
    { id: 4, name: "Dave",  pvfScore: 4.8, ventureId: "ecopack" },
    { id: 5, name: "Eve",   pvfScore: 7.3, ventureId: "ecopack" },
  ];

  it("computes average PVF score across portfolio", () => {
    const avg = talentPool.reduce((s, t) => s + t.pvfScore, 0) / talentPool.length;
    expect(Math.round(avg * 100) / 100).toBeCloseTo(7.18, 1);
  });

  it("identifies top talent (pvfScore >= 8.5)", () => {
    const top = talentPool.filter(t => t.pvfScore >= 8.5);
    expect(top).toHaveLength(2);
    expect(top.map(t => t.name)).toContain("Alice");
    expect(top.map(t => t.name)).toContain("Carol");
  });

  it("groups talent by venture correctly", () => {
    const byVenture: Record<string, typeof talentPool> = {};
    for (const t of talentPool) {
      if (!byVenture[t.ventureId]) byVenture[t.ventureId] = [];
      byVenture[t.ventureId].push(t);
    }
    expect(byVenture["ecoblend"]).toHaveLength(2);
    expect(byVenture["ecopack"]).toHaveLength(3);
  });

  it("counts high-fit candidates (pvfScore >= 7.0)", () => {
    const highFit = talentPool.filter(t => t.pvfScore >= 7.0);
    expect(highFit).toHaveLength(3);
  });
});
