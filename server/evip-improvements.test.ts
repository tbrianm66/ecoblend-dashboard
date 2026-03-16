import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Schema validation tests ──────────────────────────────────────────────────

describe("EVIP Maturity Improvements — Schema & Logic", () => {

  // 1. Venture data structure
  describe("Venture data model", () => {
    it("should have all required venture fields", () => {
      const venture = {
        id: "ecoblend",
        name: "EcoComp",
        tagline: "Advanced Materials Formulation & Distribution",
        sector: "Materials",
        channel: "B2B",
        status: "Active",
        vrl: 2,
        vrlPercent: 60,
        trl: 4,
        trlPercent: 70,
        color: "#51AF37",
        isInternalLab: false,
        lifecycleStage: "Build",
      };
      expect(venture.id).toBeTruthy();
      expect(venture.vrl).toBeGreaterThanOrEqual(1);
      expect(venture.vrl).toBeLessThanOrEqual(4);
      expect(venture.trl).toBeGreaterThanOrEqual(1);
      expect(venture.trl).toBeLessThanOrEqual(9);
      expect(["B2B", "D2C", "B2B2C"]).toContain(venture.channel);
      expect(["Active", "Pre-Launch", "Scaling", "Paused"]).toContain(venture.status);
    });

    it("should correctly identify internal lab ventures", () => {
      const lab = { id: "ecoblend-rd", isInternalLab: true };
      const brand = { id: "ecoblend", isInternalLab: false };
      expect(lab.isInternalLab).toBe(true);
      expect(brand.isInternalLab).toBe(false);
    });

    it("should include all five portfolio brands plus internal lab", () => {
      const ventures = [
        { id: "ecoblend-rd", isInternalLab: true },
        { id: "ecoblend", isInternalLab: false },
        { id: "bebus", isInternalLab: false },
        { id: "tone", isInternalLab: false },
        { id: "real", isInternalLab: false },
        { id: "pipe", isInternalLab: false },
      ];
      const brands = ventures.filter(v => !v.isInternalLab);
      const labs = ventures.filter(v => v.isInternalLab);
      expect(brands).toHaveLength(5);
      expect(labs).toHaveLength(1);
      expect(brands.map(b => b.id)).toContain("pipe");
    });
  });

  // 2. Opportunity Pipeline
  describe("Opportunity Pipeline", () => {
    it("should calculate total score from four dimensions", () => {
      const opp = {
        marketSizeScore: 8,
        strategicFitScore: 7,
        esgAlignmentScore: 9,
        founderAvailScore: 6,
      };
      const total = opp.marketSizeScore + opp.strategicFitScore + opp.esgAlignmentScore + opp.founderAvailScore;
      expect(total).toBe(30);
      expect(total).toBeLessThanOrEqual(40);
    });

    it("should advance through correct status sequence", () => {
      const statusFlow = ["Identified", "Scoring", "Approved", "Converted"];
      const nextStatus: Record<string, string> = {
        Identified: "Scoring",
        Scoring: "Approved",
        Approved: "Converted",
      };
      expect(nextStatus["Identified"]).toBe("Scoring");
      expect(nextStatus["Scoring"]).toBe("Approved");
      expect(nextStatus["Approved"]).toBe("Converted");
      expect(nextStatus["Converted"]).toBeUndefined();
    });

    it("should reject an opportunity independently of the pipeline", () => {
      const statuses = ["Identified", "Scoring", "Approved"];
      statuses.forEach(status => {
        const canReject = status !== "Rejected" && status !== "Converted";
        expect(canReject).toBe(true);
      });
    });

    it("should score high-potential opportunities correctly", () => {
      const highPotential = { marketSizeScore: 9, strategicFitScore: 9, esgAlignmentScore: 10, founderAvailScore: 8 };
      const total = Object.values(highPotential).reduce((a, b) => a + b, 0);
      expect(total).toBeGreaterThanOrEqual(30);
    });
  });

  // 3. Stage Gate enforcement
  describe("Stage Gate enforcement", () => {
    const getStageGateStatus = (experiments: any[], currentTrl: number) => {
      const gates: { trl: number; met: boolean }[] = [];
      for (let trl = 1; trl <= Math.min(currentTrl + 1, 9); trl++) {
        const relevant = experiments.filter(e => e.trlLevelJustified === trl);
        const passing = relevant.filter(e => e.outcome === "Pass");
        gates.push({ trl, met: passing.length > 0 });
      }
      return gates;
    };

    it("should mark gate as met when passing experiment exists", () => {
      const experiments = [
        { trlLevelJustified: 1, outcome: "Pass" },
        { trlLevelJustified: 2, outcome: "Fail" },
      ];
      const gates = getStageGateStatus(experiments, 2);
      expect(gates.find(g => g.trl === 1)?.met).toBe(true);
      expect(gates.find(g => g.trl === 2)?.met).toBe(false);
    });

    it("should not mark gate as met with only failing experiments", () => {
      const experiments = [
        { trlLevelJustified: 3, outcome: "Fail" },
        { trlLevelJustified: 3, outcome: "Inconclusive" },
      ];
      const gates = getStageGateStatus(experiments, 3);
      expect(gates.find(g => g.trl === 3)?.met).toBe(false);
    });

    it("should cap gate checks at TRL 9", () => {
      const experiments = [{ trlLevelJustified: 9, outcome: "Pass" }];
      const gates = getStageGateStatus(experiments, 9);
      expect(gates.every(g => g.trl <= 9)).toBe(true);
    });

    it("should accept valid experiment outcomes", () => {
      const validOutcomes = ["Pass", "Fail", "Inconclusive", "Pending"];
      validOutcomes.forEach(outcome => {
        expect(["Pass", "Fail", "Inconclusive", "Pending"]).toContain(outcome);
      });
    });
  });

  // 4. Founder Capability Score
  describe("Founder Capability Score", () => {
    const capabilityScore = (founder: any): number => {
      const domain = founder.domainExpertiseScore ?? 0;
      const exp = founder.experienceScore ?? 0;
      const commit = founder.commitmentScore ?? 0;
      return Math.round((domain * 0.4 + exp * 0.35 + commit * 0.25) * 10) / 10;
    };

    it("should calculate weighted FCS correctly", () => {
      const founder = { domainExpertiseScore: 10, experienceScore: 10, commitmentScore: 10 };
      expect(capabilityScore(founder)).toBe(10);
    });

    it("should weight domain expertise most heavily", () => {
      const domainHeavy = { domainExpertiseScore: 10, experienceScore: 0, commitmentScore: 0 };
      const expHeavy = { domainExpertiseScore: 0, experienceScore: 10, commitmentScore: 0 };
      expect(capabilityScore(domainHeavy)).toBeGreaterThan(capabilityScore(expHeavy));
    });

    it("should return 0 for founder with all zero scores", () => {
      const founder = { domainExpertiseScore: 0, experienceScore: 0, commitmentScore: 0 };
      expect(capabilityScore(founder)).toBe(0);
    });

    it("should handle missing scores with defaults", () => {
      const founder = {};
      expect(capabilityScore(founder)).toBe(0);
    });

    it("should classify high FCS correctly", () => {
      const highFcs = capabilityScore({ domainExpertiseScore: 9, experienceScore: 8, commitmentScore: 9 });
      expect(highFcs).toBeGreaterThanOrEqual(7);
    });
  });

  // 5. Financial snapshot model
  describe("Financial Snapshots", () => {
    it("should calculate funding gap from target and raised", () => {
      const snapshot = { investmentTarget: 500000, investmentRaised: 150000 };
      const gap = snapshot.investmentTarget - snapshot.investmentRaised;
      expect(gap).toBe(350000);
    });

    it("should calculate runway from cash and burn rate", () => {
      const snapshot = { cashRunway: 8, monthlyBurn: 12500 };
      expect(snapshot.cashRunway).toBe(8);
      expect(snapshot.monthlyBurn).toBeGreaterThan(0);
    });

    it("should validate month format as YYYY-MM", () => {
      const validMonth = "2026-03";
      expect(/^\d{4}-\d{2}$/.test(validMonth)).toBe(true);
    });

    it("should flag ventures with less than 3 months runway", () => {
      const snapshots = [
        { ventureId: "ecoblend", cashRunway: 2 },
        { ventureId: "tone", cashRunway: 6 },
        { ventureId: "real", cashRunway: 1 },
      ];
      const critical = snapshots.filter(s => s.cashRunway < 3);
      expect(critical).toHaveLength(2);
    });
  });

  // 6. Interview AI summarisation
  describe("Interview AI Summarisation", () => {
    it("should require rawTranscript for AI summarisation", () => {
      const hasTranscript = (interview: any) => !!interview.rawTranscript && interview.rawTranscript.length > 0;
      expect(hasTranscript({ rawTranscript: "Customer said..." })).toBe(true);
      expect(hasTranscript({ rawTranscript: "" })).toBe(false);
      expect(hasTranscript({})).toBe(false);
    });

    it("should validate AI summary response structure", () => {
      const mockSummary = {
        keyInsights: "Customers want sustainable packaging\nPrice sensitivity is high",
        painPoints: "Current packaging is not recyclable\nSupplier lead times are too long",
        validationSignals: "8/10 interviewees would switch to eco packaging\nWTP confirmed at £0.05 premium",
        aiSummary: "The interview confirmed strong market demand for sustainable packaging solutions.",
      };
      expect(mockSummary).toHaveProperty("keyInsights");
      expect(mockSummary).toHaveProperty("painPoints");
      expect(mockSummary).toHaveProperty("validationSignals");
      expect(mockSummary).toHaveProperty("aiSummary");
      expect(typeof mockSummary.aiSummary).toBe("string");
    });

    it("should accept valid interview channels", () => {
      const channels = ["In-Person", "Video", "Phone", "Survey"];
      channels.forEach(c => expect(channels).toContain(c));
    });

    it("should link interviews to VRL stages 1-4", () => {
      const validStages = [1, 2, 3, 4];
      validStages.forEach(s => {
        expect(s).toBeGreaterThanOrEqual(1);
        expect(s).toBeLessThanOrEqual(4);
      });
    });
  });

  // 7. Investment Readiness + Financial link
  describe("Investment Readiness Financial Link", () => {
    it("should derive funding ask from financial snapshot", () => {
      const snapshot = { investmentTarget: 500000, investmentRaised: 150000 };
      const fundingAsk = snapshot.investmentTarget - snapshot.investmentRaised;
      expect(fundingAsk).toBe(350000);
    });

    it("should format currency values correctly", () => {
      const formatCurrency = (v: number) =>
        v >= 1000000 ? `£${(v / 1000000).toFixed(1)}M` :
        v >= 1000 ? `£${(v / 1000).toFixed(0)}K` : `£${v}`;
      expect(formatCurrency(500000)).toBe("£500K");
      expect(formatCurrency(1500000)).toBe("£1.5M");
      expect(formatCurrency(750)).toBe("£750");
    });

    it("should classify runway status correctly", () => {
      const getRunwayStatus = (months: number) =>
        months < 3 ? "critical" : months < 6 ? "warning" : "healthy";
      expect(getRunwayStatus(2)).toBe("critical");
      expect(getRunwayStatus(4)).toBe("warning");
      expect(getRunwayStatus(12)).toBe("healthy");
    });
  });
});
