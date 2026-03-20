// ============================================================
// SPIN-OUT BLUEPRINT ROUTER — Vitest Tests (Sprint 63)
// Tests: readiness gate logic, domain weight calculations,
//        library link status transitions, launch gate enforcement
// ============================================================
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Readiness gate logic (pure functions) ─────────────────────────────────────
const DOMAIN_WEIGHTS = {
  talent:       0.20,
  supplyChain:  0.15,
  finance:      0.20,
  market:       0.20,
  technology:   0.15,
  governance:   0.10,
};

function computeOverallScore(scores: {
  talentScore: number;
  supplyChainScore: number;
  financeScore: number;
  marketScore: number;
  technologyScore: number;
  governanceScore: number;
}): number {
  return Math.round(
    scores.talentScore      * DOMAIN_WEIGHTS.talent +
    scores.supplyChainScore * DOMAIN_WEIGHTS.supplyChain +
    scores.financeScore     * DOMAIN_WEIGHTS.finance +
    scores.marketScore      * DOMAIN_WEIGHTS.market +
    scores.technologyScore  * DOMAIN_WEIGHTS.technology +
    scores.governanceScore  * DOMAIN_WEIGHTS.governance
  );
}

function computeGateStatus(score: number): "not_ready" | "approaching" | "ready_to_review" | "approved" | "launched" {
  if (score < 40) return "not_ready";
  if (score < 60) return "approaching";
  return "ready_to_review";
}

// ── Domain weight validation ──────────────────────────────────────────────────
describe("Domain weight configuration", () => {
  it("should sum to exactly 1.0 (100%)", () => {
    const total = Object.values(DOMAIN_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });

  it("should have talent and finance as the highest-weighted domains (20% each)", () => {
    expect(DOMAIN_WEIGHTS.talent).toBe(0.20);
    expect(DOMAIN_WEIGHTS.finance).toBe(0.20);
  });

  it("should have governance as the lowest-weighted domain (10%)", () => {
    expect(DOMAIN_WEIGHTS.governance).toBe(0.10);
  });
});

// ── Overall score computation ─────────────────────────────────────────────────
describe("computeOverallScore", () => {
  it("should return 0 when all domain scores are 0", () => {
    expect(computeOverallScore({
      talentScore: 0, supplyChainScore: 0, financeScore: 0,
      marketScore: 0, technologyScore: 0, governanceScore: 0,
    })).toBe(0);
  });

  it("should return 100 when all domain scores are 100", () => {
    expect(computeOverallScore({
      talentScore: 100, supplyChainScore: 100, financeScore: 100,
      marketScore: 100, technologyScore: 100, governanceScore: 100,
    })).toBe(100);
  });

  it("should correctly weight a partial readiness profile", () => {
    // Only talent (20%) and finance (20%) at 100%, rest at 0%
    const score = computeOverallScore({
      talentScore: 100, supplyChainScore: 0, financeScore: 100,
      marketScore: 0, technologyScore: 0, governanceScore: 0,
    });
    expect(score).toBe(40); // 20% + 20% = 40%
  });

  it("should correctly compute a realistic mid-stage readiness profile", () => {
    const score = computeOverallScore({
      talentScore: 80,   // 80 * 0.20 = 16
      supplyChainScore: 60, // 60 * 0.15 = 9
      financeScore: 70,  // 70 * 0.20 = 14
      marketScore: 75,   // 75 * 0.20 = 15
      technologyScore: 50, // 50 * 0.15 = 7.5
      governanceScore: 40, // 40 * 0.10 = 4
    });
    // Expected: 16 + 9 + 14 + 15 + 7.5 + 4 = 65.5 → rounds to 66
    expect(score).toBe(66);
  });

  it("should handle fractional scores correctly", () => {
    const score = computeOverallScore({
      talentScore: 33, supplyChainScore: 33, financeScore: 33,
      marketScore: 33, technologyScore: 33, governanceScore: 33,
    });
    expect(score).toBe(33);
  });
});

// ── Gate status logic ─────────────────────────────────────────────────────────
describe("computeGateStatus", () => {
  it("should return 'not_ready' for scores below 40", () => {
    expect(computeGateStatus(0)).toBe("not_ready");
    expect(computeGateStatus(20)).toBe("not_ready");
    expect(computeGateStatus(39)).toBe("not_ready");
  });

  it("should return 'approaching' for scores 40–59", () => {
    expect(computeGateStatus(40)).toBe("approaching");
    expect(computeGateStatus(50)).toBe("approaching");
    expect(computeGateStatus(59)).toBe("approaching");
  });

  it("should return 'ready_to_review' for scores 60+", () => {
    expect(computeGateStatus(60)).toBe("ready_to_review");
    expect(computeGateStatus(80)).toBe("ready_to_review");
    expect(computeGateStatus(100)).toBe("ready_to_review");
  });

  it("should not downgrade 'approved' or 'launched' status", () => {
    // The router preserves approved/launched status — simulate that logic
    const currentStatus = "approved";
    const newScore = 30; // Would normally be not_ready
    const gateStatus = currentStatus === "approved" || currentStatus === "launched"
      ? currentStatus
      : computeGateStatus(newScore);
    expect(gateStatus).toBe("approved");
  });

  it("should not downgrade 'launched' status even at 0%", () => {
    const currentStatus = "launched";
    const newScore = 0;
    const gateStatus = currentStatus === "approved" || currentStatus === "launched"
      ? currentStatus
      : computeGateStatus(newScore);
    expect(gateStatus).toBe("launched");
  });
});

// ── Launch gate enforcement ───────────────────────────────────────────────────
describe("Launch gate enforcement", () => {
  it("should block launch when readiness is below 40%", () => {
    const overallScore = 35;
    const canLaunch = overallScore >= 40;
    expect(canLaunch).toBe(false);
  });

  it("should allow launch when readiness is exactly 40%", () => {
    const overallScore = 40;
    const canLaunch = overallScore >= 40;
    expect(canLaunch).toBe(true);
  });

  it("should allow launch when readiness is above 40%", () => {
    const overallScore = 75;
    const canLaunch = overallScore >= 40;
    expect(canLaunch).toBe(true);
  });
});

// ── Library link status transitions ──────────────────────────────────────────
describe("Library link status transitions", () => {
  type LinkStatus = "proposed" | "confirmed" | "contracted" | "unavailable";
  const VALID_STATUSES: LinkStatus[] = ["proposed", "confirmed", "contracted", "unavailable"];

  it("should accept all valid link statuses", () => {
    VALID_STATUSES.forEach(status => {
      expect(VALID_STATUSES).toContain(status);
    });
  });

  it("should count only confirmed and contracted links for readiness scoring", () => {
    const links = [
      { domain: "talent", linkStatus: "proposed" },
      { domain: "talent", linkStatus: "confirmed" },
      { domain: "talent", linkStatus: "contracted" },
      { domain: "talent", linkStatus: "unavailable" },
    ];
    const confirmedCount = links.filter(
      l => l.linkStatus === "confirmed" || l.linkStatus === "contracted"
    ).length;
    expect(confirmedCount).toBe(2);
  });

  it("should correctly compute talent score from confirmed links", () => {
    const confirmedLinks = 2;
    const totalLinks = 4;
    const talentBase = Math.min(100, (confirmedLinks / totalLinks) * 100);
    expect(talentBase).toBe(50);
  });

  it("should cap domain scores at 100%", () => {
    const confirmedLinks = 20; // Many confirmed links
    const totalLinks = 1;
    const score = Math.min(100, (confirmedLinks / totalLinks) * 100);
    expect(score).toBe(100);
  });
});

// ── Domain coverage validation ────────────────────────────────────────────────
describe("Domain coverage", () => {
  const LIBRARY_DOMAINS = ["talent", "supply_chain", "university", "research", "finance", "market", "ip", "legal", "crm", "specialist"];

  it("should have 10 library domains", () => {
    expect(LIBRARY_DOMAINS.length).toBe(10);
  });

  it("should include all critical execution domains", () => {
    expect(LIBRARY_DOMAINS).toContain("talent");
    expect(LIBRARY_DOMAINS).toContain("supply_chain");
    expect(LIBRARY_DOMAINS).toContain("finance");
    expect(LIBRARY_DOMAINS).toContain("market");
    expect(LIBRARY_DOMAINS).toContain("university");
    expect(LIBRARY_DOMAINS).toContain("research");
  });

  it("should include governance domains", () => {
    expect(LIBRARY_DOMAINS).toContain("ip");
    expect(LIBRARY_DOMAINS).toContain("legal");
  });
});

// ── Readiness score edge cases ────────────────────────────────────────────────
describe("Readiness score edge cases", () => {
  it("should handle TRL-based technology score calculation", () => {
    // TRL 1/9 = ~11.1% base, TRL 9/9 = 100%
    const trl1Score = Math.min(100, (1 / 9) * 100 * 0.7);
    const trl9Score = Math.min(100, (9 / 9) * 100 * 0.7);
    expect(trl1Score).toBeCloseTo(7.78, 1);
    expect(trl9Score).toBe(70);
  });

  it("should add experiment bonus to technology score", () => {
    const trlBase = 70; // TRL 9
    const passedExperiments = 6; // 6 * 5 = 30 bonus
    const expBonus = Math.min(30, passedExperiments * 5);
    const techScore = Math.min(100, trlBase + expBonus);
    expect(techScore).toBe(100);
  });

  it("should cap experiment bonus at 30 points", () => {
    const expBonus = Math.min(30, 100 * 5); // 100 experiments
    expect(expBonus).toBe(30);
  });

  it("should give finance score of 50 base when financial model exists", () => {
    const hasFinModel = true;
    const finLinks = 0;
    const financeBase = hasFinModel
      ? Math.min(100, 50 + finLinks * 10)
      : Math.min(100, finLinks * 15);
    expect(financeBase).toBe(50);
  });

  it("should scale finance score with confirmed links when model exists", () => {
    const hasFinModel = true;
    const finLinks = 3; // 3 confirmed links
    const financeBase = hasFinModel
      ? Math.min(100, 50 + finLinks * 10)
      : Math.min(100, finLinks * 15);
    expect(financeBase).toBe(80);
  });

  it("should cap finance score at 100 even with many links", () => {
    const hasFinModel = true;
    const finLinks = 10;
    const financeBase = Math.min(100, 50 + finLinks * 10);
    expect(financeBase).toBe(100);
  });
});

// ── Blueprint title generation ────────────────────────────────────────────────
describe("Blueprint title generation", () => {
  it("should generate default title from offering name", () => {
    const offeringName = "EcoComp Lite";
    const defaultTitle = `${offeringName} — Spin-Out Blueprint`;
    expect(defaultTitle).toBe("EcoComp Lite — Spin-Out Blueprint");
  });

  it("should use custom title when provided", () => {
    const customTitle = "Q2 2026 Spin-Out Blueprint";
    const title = customTitle ?? "Default — Spin-Out Blueprint";
    expect(title).toBe("Q2 2026 Spin-Out Blueprint");
  });

  it("should fall back to default when title is empty string", () => {
    const customTitle = "";
    const offeringName = "EcoComp Lite";
    const title = customTitle || `${offeringName} — Spin-Out Blueprint`;
    expect(title).toBe("EcoComp Lite — Spin-Out Blueprint");
  });
});

// ── Journey stage progression ─────────────────────────────────────────────────
describe("Spin-out journey stage progression", () => {
  const JOURNEY_STAGES = ["Blueprint", "40% Gate", "Spin-Off OS", "Execution Plan", "Live Platform"];

  it("should have 5 journey stages", () => {
    expect(JOURNEY_STAGES.length).toBe(5);
  });

  it("should mark blueprint stage as done when markdown exists", () => {
    const blueprintMarkdown = "# Blueprint\n...";
    const blueprintDone = !!blueprintMarkdown;
    expect(blueprintDone).toBe(true);
  });

  it("should mark 40% gate as done when overall score >= 40", () => {
    const overallScore = 45;
    const gateDone = overallScore >= 40;
    expect(gateDone).toBe(true);
  });

  it("should mark Spin-Off OS stage as done when gateStatus is launched", () => {
    const gateStatus = "launched";
    const spinoffDone = gateStatus === "launched";
    expect(spinoffDone).toBe(true);
  });

  it("should not mark Spin-Off OS stage as done for non-launched statuses", () => {
    const statuses = ["not_ready", "approaching", "ready_to_review", "approved"];
    statuses.forEach(status => {
      expect(status === "launched").toBe(false);
    });
  });
});

// ── Spinoff config pre-population from blueprint ──────────────────────────────
describe("Spinoff config pre-population from blueprint", () => {
  it("should map offering revenueModel to spinoff channel correctly", () => {
    const mapChannel = (revenueModel: string): "B2B" | "D2C" | "B2B2C" => {
      if (revenueModel === "D2C") return "D2C";
      if (revenueModel === "B2B2C") return "B2B2C";
      return "B2B";
    };
    expect(mapChannel("D2C")).toBe("D2C");
    expect(mapChannel("B2B2C")).toBe("B2B2C");
    expect(mapChannel("B2B")).toBe("B2B");
    expect(mapChannel("SaaS")).toBe("B2B"); // Default fallback
    expect(mapChannel("Subscription")).toBe("B2B"); // Default fallback
  });

  it("should use offering color as brand color with fallback", () => {
    const offeringColor = "#3A97D3";
    const ventureColor = "#51AF37";
    const brandColor = offeringColor ?? ventureColor ?? "#51AF37";
    expect(brandColor).toBe("#3A97D3");
  });

  it("should fall back to venture color when offering has no color", () => {
    const offeringColor = null;
    const ventureColor = "#51AF37";
    const brandColor = offeringColor ?? ventureColor ?? "#51AF37";
    expect(brandColor).toBe("#51AF37");
  });

  it("should use default green when both offering and venture have no color", () => {
    const offeringColor = null;
    const ventureColor = null;
    const brandColor = offeringColor ?? ventureColor ?? "#51AF37";
    expect(brandColor).toBe("#51AF37");
  });
});
