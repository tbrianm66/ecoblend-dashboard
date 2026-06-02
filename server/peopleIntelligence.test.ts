/**
 * Sprint 20 — People Intelligence Module
 * Vitest unit tests for the PVF scoring engine
 *
 * Tests import the real exported helper functions from the production router,
 * ensuring tests validate actual production logic.
 *
 * Tests cover:
 *  - computePvfScore: weighted formula (30/20/20/15/15)
 *  - pvfGrade: grade thresholds (A+/A/B/C/D)
 *  - gapSeverity: severity classification (Critical/High/Medium/Low)
 *  - calcAvailabilityFit: availability mapping
 *  - calcSkillsMatch: capability score normalisation
 *  - calcIndustryMatch: sector overlap detection
 *  - calcStageMatch: VRL-to-stage mapping
 *  - calcNetworkValue: network score normalisation
 *  - End-to-end PVF scenario tests
 */

import { describe, it, expect } from "vitest";
import {
  computePvfScore,
  pvfGrade,
  gapSeverity,
  calcAvailabilityFit,
  calcSkillsMatch,
  calcIndustryMatch,
  calcStageMatch,
  calcNetworkValue,
} from "./peopleIntelligence.router";

// ── computePvfScore ────────────────────────────────────────────────────────────

describe("PVF Scoring Engine — computePvfScore", () => {
  it("returns 100 when all components are 100", () => {
    expect(computePvfScore({
      skillsMatch: 100,
      industryMatch: 100,
      stageMatch: 100,
      networkValue: 100,
      availabilityFit: 100,
    })).toBe(100);
  });

  it("returns 0 when all components are 0", () => {
    expect(computePvfScore({
      skillsMatch: 0,
      industryMatch: 0,
      stageMatch: 0,
      networkValue: 0,
      availabilityFit: 0,
    })).toBe(0);
  });

  it("weights skills at 30%", () => {
    expect(computePvfScore({
      skillsMatch: 100,
      industryMatch: 0,
      stageMatch: 0,
      networkValue: 0,
      availabilityFit: 0,
    })).toBe(30);
  });

  it("weights industry at 20%", () => {
    expect(computePvfScore({
      skillsMatch: 0,
      industryMatch: 100,
      stageMatch: 0,
      networkValue: 0,
      availabilityFit: 0,
    })).toBe(20);
  });

  it("weights stage at 20%", () => {
    expect(computePvfScore({
      skillsMatch: 0,
      industryMatch: 0,
      stageMatch: 100,
      networkValue: 0,
      availabilityFit: 0,
    })).toBe(20);
  });

  it("weights network at 15%", () => {
    expect(computePvfScore({
      skillsMatch: 0,
      industryMatch: 0,
      stageMatch: 0,
      networkValue: 100,
      availabilityFit: 0,
    })).toBe(15);
  });

  it("weights availability at 15%", () => {
    expect(computePvfScore({
      skillsMatch: 0,
      industryMatch: 0,
      stageMatch: 0,
      networkValue: 0,
      availabilityFit: 100,
    })).toBe(15);
  });

  it("computes a realistic mid-range score correctly", () => {
    // 70*0.30 + 80*0.20 + 60*0.20 + 50*0.15 + 100*0.15
    // = 21 + 16 + 12 + 7.5 + 15 = 71.5 → rounds to 72
    expect(computePvfScore({
      skillsMatch: 70,
      industryMatch: 80,
      stageMatch: 60,
      networkValue: 50,
      availabilityFit: 100,
    })).toBe(72);
  });

  it("weights sum to 100% (all 100 → 100)", () => {
    const score = computePvfScore({
      skillsMatch: 100,
      industryMatch: 100,
      stageMatch: 100,
      networkValue: 100,
      availabilityFit: 100,
    });
    expect(score).toBe(100);
  });
});

// ── pvfGrade ──────────────────────────────────────────────────────────────────

describe("PVF Grade Thresholds", () => {
  it("assigns A+ for score >= 85", () => {
    expect(pvfGrade(85)).toBe("A+");
    expect(pvfGrade(100)).toBe("A+");
    expect(pvfGrade(90)).toBe("A+");
  });

  it("assigns A for score 75-84", () => {
    expect(pvfGrade(75)).toBe("A");
    expect(pvfGrade(80)).toBe("A");
    expect(pvfGrade(84)).toBe("A");
  });

  it("assigns B for score 65-74", () => {
    expect(pvfGrade(65)).toBe("B");
    expect(pvfGrade(70)).toBe("B");
    expect(pvfGrade(74)).toBe("B");
  });

  it("assigns C for score 50-64", () => {
    expect(pvfGrade(50)).toBe("C");
    expect(pvfGrade(60)).toBe("C");
    expect(pvfGrade(64)).toBe("C");
  });

  it("assigns D for score < 50", () => {
    expect(pvfGrade(0)).toBe("D");
    expect(pvfGrade(49)).toBe("D");
    expect(pvfGrade(25)).toBe("D");
  });
});

// ── gapSeverity ───────────────────────────────────────────────────────────────

describe("Gap Severity Classification", () => {
  it("classifies Critical for gap >= 40", () => {
    expect(gapSeverity(40)).toBe("Critical");
    expect(gapSeverity(60)).toBe("Critical");
    expect(gapSeverity(100)).toBe("Critical");
  });

  it("classifies High for gap 25-39", () => {
    expect(gapSeverity(25)).toBe("High");
    expect(gapSeverity(30)).toBe("High");
    expect(gapSeverity(39)).toBe("High");
  });

  it("classifies Medium for gap 10-24", () => {
    expect(gapSeverity(10)).toBe("Medium");
    expect(gapSeverity(15)).toBe("Medium");
    expect(gapSeverity(24)).toBe("Medium");
  });

  it("classifies Low for gap < 10", () => {
    expect(gapSeverity(0)).toBe("Low");
    expect(gapSeverity(5)).toBe("Low");
    expect(gapSeverity(9)).toBe("Low");
  });
});

// ── calcAvailabilityFit ───────────────────────────────────────────────────────

describe("Availability Fit Mapping", () => {
  it("returns 100 for Available", () => {
    expect(calcAvailabilityFit("Available")).toBe(100);
  });

  it("returns 60 for Part-Time", () => {
    expect(calcAvailabilityFit("Part-Time")).toBe(60);
  });

  it("returns 20 for Committed", () => {
    expect(calcAvailabilityFit("Committed")).toBe(20);
  });

  it("returns 0 for Unavailable", () => {
    expect(calcAvailabilityFit("Unavailable")).toBe(0);
  });

  it("returns 50 for unknown availability", () => {
    expect(calcAvailabilityFit("On Leave")).toBe(50);
    expect(calcAvailabilityFit("")).toBe(50);
  });
});

// ── calcSkillsMatch ───────────────────────────────────────────────────────────

describe("Skills Match Calculation", () => {
  const talent = {
    capTechnical: 80,
    capCommercial: 70,
    capOperational: 60,
    capFinancial: 50,
    capMarketing: 40,
  };

  it("returns average cap when minCapScore is 0", () => {
    // avg = (80+70+60+50+40)/5 = 60
    expect(calcSkillsMatch(talent, 0)).toBe(60);
  });

  it("normalises against minCapScore when provided", () => {
    // avg = 60, minCapScore = 50 → (60/50)*100 = 120 → capped at 100
    expect(calcSkillsMatch(talent, 50)).toBe(100);
  });

  it("returns below 100 when talent is below required", () => {
    // avg = 60, minCapScore = 80 → (60/80)*100 = 75
    expect(calcSkillsMatch(talent, 80)).toBe(75);
  });

  it("handles missing capability fields as 0", () => {
    expect(calcSkillsMatch({}, 0)).toBe(0);
  });
});

// ── calcIndustryMatch ─────────────────────────────────────────────────────────

describe("Industry Match Calculation", () => {
  it("returns 90 when talent industry overlaps venture sector", () => {
    expect(calcIndustryMatch(["CleanTech", "Biotech"], "cleantech")).toBe(90);
  });

  it("returns 40 when no overlap", () => {
    expect(calcIndustryMatch(["Finance", "Banking"], "cleantech")).toBe(40);
  });

  it("returns 50 when talent has no industries listed", () => {
    expect(calcIndustryMatch([], "cleantech")).toBe(50);
  });

  it("is case-insensitive", () => {
    expect(calcIndustryMatch(["CLEANTECH"], "CleanTech")).toBe(90);
  });
});

// ── calcStageMatch ────────────────────────────────────────────────────────────

describe("Stage Match Calculation", () => {
  it("returns 90 for VRL 1-2 when talent has idea/validation experience", () => {
    expect(calcStageMatch({ stageIdea: true }, 1)).toBe(90);
    expect(calcStageMatch({ stageValidation: true }, 2)).toBe(90);
  });

  it("returns 40 for VRL 1-2 when talent lacks early-stage experience", () => {
    expect(calcStageMatch({ stageBuild: true, stageScale: true }, 1)).toBe(40);
  });

  it("returns 90 for VRL 3 when talent has build experience", () => {
    expect(calcStageMatch({ stageBuild: true }, 3)).toBe(90);
  });

  it("returns 50 for VRL 3 when talent lacks build experience", () => {
    expect(calcStageMatch({ stageIdea: true }, 3)).toBe(50);
  });

  it("returns 90 for VRL 4 when talent has scale experience", () => {
    expect(calcStageMatch({ stageScale: true }, 4)).toBe(90);
  });

  it("returns 50 for VRL 4 when talent lacks scale experience", () => {
    expect(calcStageMatch({ stageIdea: true }, 4)).toBe(50);
  });
});

// ── calcNetworkValue ──────────────────────────────────────────────────────────

describe("Network Value Calculation", () => {
  const talent = {
    networkInvestors: 80,
    networkCustomers: 60,
    networkIndustry: 70,
  };

  it("returns average network when minNetworkScore is 0", () => {
    // avg = (80+60+70)/3 = 70
    expect(calcNetworkValue(talent, 0)).toBe(70);
  });

  it("normalises against minNetworkScore", () => {
    // avg = 70, minNetworkScore = 50 → (70/50)*100 = 140 → capped at 100
    expect(calcNetworkValue(talent, 50)).toBe(100);
  });

  it("returns below 100 when network is below required", () => {
    // avg = 70, minNetworkScore = 90 → (70/90)*100 = 78
    expect(calcNetworkValue(talent, 90)).toBe(78);
  });

  it("handles missing network fields as 0", () => {
    expect(calcNetworkValue({}, 0)).toBe(0);
  });
});

// ── End-to-End Scenario Tests ─────────────────────────────────────────────────

describe("PVF End-to-End Scenario Tests", () => {
  it("strong founder match scores A+", () => {
    const score = computePvfScore({
      skillsMatch: 90,
      industryMatch: 90,
      stageMatch: 90,
      networkValue: 85,
      availabilityFit: 100,
    });
    expect(score).toBeGreaterThanOrEqual(85);
    expect(pvfGrade(score)).toBe("A+");
  });

  it("weak match scores D", () => {
    const score = computePvfScore({
      skillsMatch: 20,
      industryMatch: 30,
      stageMatch: 20,
      networkValue: 10,
      availabilityFit: 0,
    });
    expect(score).toBeLessThan(50);
    expect(pvfGrade(score)).toBe("D");
  });

  it("unavailable talent scores 15 points lower than available talent", () => {
    const base = { skillsMatch: 80, industryMatch: 80, stageMatch: 80, networkValue: 70 };
    const available = computePvfScore({ ...base, availabilityFit: 100 });
    const unavailable = computePvfScore({ ...base, availabilityFit: 0 });
    expect(available).toBeGreaterThan(unavailable);
    expect(available - unavailable).toBe(15); // 15% weight × 100 difference
  });

  it("full pipeline: skills → grade → gap severity", () => {
    const talent = { capTechnical: 90, capCommercial: 85, capOperational: 80, capFinancial: 75, capMarketing: 70 };
    const skillsMatch = calcSkillsMatch(talent, 0);
    // avg = (90+85+80+75+70)/5 = 80
    expect(skillsMatch).toBe(80);

    const industryMatch = calcIndustryMatch(["CleanTech", "Materials"], "materials");
    expect(industryMatch).toBe(90);

    const stageMatch = calcStageMatch({ stageBuild: true, stageScale: true }, 4);
    expect(stageMatch).toBe(90);

    const networkValue = calcNetworkValue({ networkInvestors: 85, networkCustomers: 80, networkIndustry: 75 }, 0);
    // avg = (85+80+75)/3 = 80
    expect(networkValue).toBe(80);

    const availabilityFit = calcAvailabilityFit("Available");
    expect(availabilityFit).toBe(100);

    const pvfScore = computePvfScore({ skillsMatch, industryMatch, stageMatch, networkValue, availabilityFit });
    // 80*0.30 + 90*0.20 + 90*0.20 + 80*0.15 + 100*0.15
    // = 24 + 18 + 18 + 12 + 15 = 87
    expect(pvfScore).toBe(87);
    expect(pvfGrade(pvfScore)).toBe("A+");
  });

  it("gap severity correctly classifies critical talent gap", () => {
    // Required score 90, actual score 45 → gap = 45
    const gap = 90 - 45;
    expect(gapSeverity(gap)).toBe("Critical");
  });

  it("gap severity correctly classifies low talent gap", () => {
    // Required score 80, actual score 75 → gap = 5
    const gap = 80 - 75;
    expect(gapSeverity(gap)).toBe("Low");
  });
});
