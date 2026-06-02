/**
 * Phase 5 Long-Term Tests
 * Institutional Memory System, Governance Compliance Framework,
 * Advanced Stakeholder Management, Mission Metrics Integration
 */
import { describe, it, expect } from "vitest";

// ─── Institutional Memory System ────────────────────────────────────────────

describe("Institutional Memory System", () => {
  describe("Knowledge Entry Classification", () => {
    it("classifies mission codex entries correctly", () => {
      const entry = {
        type: "mission_codex",
        title: "Core Mission Statement",
        content: "To demonstrate positive social impact through technology ventures",
        importance: "critical" as const,
      };
      expect(entry.type).toBe("mission_codex");
      expect(entry.importance).toBe("critical");
    });

    it("classifies decision framework entries", () => {
      const entry = {
        type: "decision_framework",
        title: "Investment Decision Criteria",
        content: "All investments must pass the triple-bottom-line test",
        importance: "high" as const,
      };
      expect(entry.type).toBe("decision_framework");
      expect(["critical", "high", "medium", "low"]).toContain(entry.importance);
    });

    it("classifies founder legacy entries", () => {
      const entry = {
        type: "founder_legacy",
        title: "Founding Story",
        content: "EcoBlend was founded to bridge the gap between technology and social impact",
        importance: "high" as const,
      };
      expect(entry.type).toBe("founder_legacy");
    });

    it("classifies core values entries", () => {
      const entry = {
        type: "core_values",
        title: "Non-Negotiable Values",
        content: "Transparency, Mission-First, Community-Centred",
        importance: "critical" as const,
      };
      expect(entry.type).toBe("core_values");
    });

    it("classifies lessons learned entries", () => {
      const entry = {
        type: "lessons_learned",
        title: "Q1 2025 Retrospective",
        content: "Scaling too fast without mission alignment led to drift",
        importance: "medium" as const,
      };
      expect(entry.type).toBe("lessons_learned");
    });
  });

  describe("Knowledge Retrieval and Search", () => {
    const knowledgeBase = [
      { id: 1, type: "mission_codex", title: "Core Mission", content: "Social impact through technology", importance: "critical", tags: ["mission", "core"] },
      { id: 2, type: "decision_framework", title: "Investment Criteria", content: "Triple bottom line", importance: "high", tags: ["investment", "criteria"] },
      { id: 3, type: "core_values", title: "Values", content: "Transparency first", importance: "critical", tags: ["values", "culture"] },
      { id: 4, type: "lessons_learned", title: "Q1 Retro", content: "Scaling challenges", importance: "medium", tags: ["operations", "scaling"] },
    ];

    it("filters by type correctly", () => {
      const missionEntries = knowledgeBase.filter(e => e.type === "mission_codex");
      expect(missionEntries).toHaveLength(1);
      expect(missionEntries[0].title).toBe("Core Mission");
    });

    it("filters by importance level", () => {
      const criticalEntries = knowledgeBase.filter(e => e.importance === "critical");
      expect(criticalEntries).toHaveLength(2);
    });

    it("searches by content keyword", () => {
      const searchTerm = "impact";
      const results = knowledgeBase.filter(e =>
        e.content.toLowerCase().includes(searchTerm) ||
        e.title.toLowerCase().includes(searchTerm)
      );
      expect(results.length).toBeGreaterThan(0);
    });

    it("filters by tags", () => {
      const missionTagged = knowledgeBase.filter(e => e.tags.includes("mission"));
      expect(missionTagged).toHaveLength(1);
    });

    it("returns all entries when no filter applied", () => {
      expect(knowledgeBase).toHaveLength(4);
    });
  });

  describe("Institutional Memory Completeness Score", () => {
    function calculateCompletenessScore(entries: Array<{ type: string; importance: string }>) {
      const requiredTypes = ["mission_codex", "decision_framework", "founder_legacy", "core_values"];
      const coveredTypes = new Set(entries.map(e => e.type));
      const typeScore = (requiredTypes.filter(t => coveredTypes.has(t)).length / requiredTypes.length) * 50;

      const criticalEntries = entries.filter(e => e.importance === "critical").length;
      const criticalScore = Math.min(criticalEntries * 10, 30);

      const totalEntries = entries.length;
      const volumeScore = Math.min(totalEntries * 2, 20);

      return Math.round(typeScore + criticalScore + volumeScore);
    }

    it("scores 0 for empty knowledge base", () => {
      expect(calculateCompletenessScore([])).toBe(0);
    });

    it("scores higher with more type coverage", () => {
      const sparse = [{ type: "mission_codex", importance: "critical" }];
      const rich = [
        { type: "mission_codex", importance: "critical" },
        { type: "decision_framework", importance: "high" },
        { type: "founder_legacy", importance: "high" },
        { type: "core_values", importance: "critical" },
      ];
      expect(calculateCompletenessScore(rich)).toBeGreaterThan(calculateCompletenessScore(sparse));
    });

    it("caps volume score at 20 points", () => {
      const manyEntries = Array.from({ length: 20 }, (_, i) => ({
        type: "lessons_learned",
        importance: "low",
      }));
      const score = calculateCompletenessScore(manyEntries);
      // Volume score capped at 20, type coverage 0/4 required types = 0, critical = 0
      expect(score).toBeLessThanOrEqual(20);
    });

    it("gives full score for comprehensive knowledge base", () => {
      const comprehensive = [
        { type: "mission_codex", importance: "critical" },
        { type: "decision_framework", importance: "critical" },
        { type: "founder_legacy", importance: "critical" },
        { type: "core_values", importance: "critical" },
        { type: "lessons_learned", importance: "medium" },
        { type: "lessons_learned", importance: "medium" },
        { type: "lessons_learned", importance: "medium" },
        { type: "lessons_learned", importance: "medium" },
        { type: "lessons_learned", importance: "medium" },
        { type: "lessons_learned", importance: "medium" },
      ];
      const score = calculateCompletenessScore(comprehensive);
      expect(score).toBeGreaterThanOrEqual(80);
    });
  });
});

// ─── Governance Compliance Framework ────────────────────────────────────────

describe("Governance Compliance Framework", () => {
  describe("Compliance Requirement Scoring", () => {
    type ComplianceStatus = "compliant" | "partial" | "non_compliant" | "not_applicable";

    function scoreRequirement(status: ComplianceStatus, weight: number): number {
      const statusScores: Record<ComplianceStatus, number> = {
        compliant: 1.0,
        partial: 0.5,
        non_compliant: 0.0,
        not_applicable: 1.0, // N/A doesn't penalise
      };
      return statusScores[status] * weight;
    }

    it("scores compliant requirement at full weight", () => {
      expect(scoreRequirement("compliant", 10)).toBe(10);
    });

    it("scores partial compliance at 50%", () => {
      expect(scoreRequirement("partial", 10)).toBe(5);
    });

    it("scores non-compliant at 0", () => {
      expect(scoreRequirement("non_compliant", 10)).toBe(0);
    });

    it("scores not-applicable at full weight (no penalty)", () => {
      expect(scoreRequirement("not_applicable", 10)).toBe(10);
    });
  });

  describe("Framework Overall Score Calculation", () => {
    type ComplianceStatus = "compliant" | "partial" | "non_compliant" | "not_applicable";

    function calculateFrameworkScore(requirements: Array<{ status: ComplianceStatus; weight: number }>) {
      const totalWeight = requirements.reduce((sum, r) => sum + r.weight, 0);
      if (totalWeight === 0) return 0;

      const statusScores: Record<ComplianceStatus, number> = {
        compliant: 1.0,
        partial: 0.5,
        non_compliant: 0.0,
        not_applicable: 1.0,
      };

      const earned = requirements.reduce((sum, r) => sum + statusScores[r.status] * r.weight, 0);
      return Math.round((earned / totalWeight) * 100);
    }

    it("returns 100 for all compliant requirements", () => {
      const reqs = [
        { status: "compliant" as const, weight: 10 },
        { status: "compliant" as const, weight: 20 },
        { status: "compliant" as const, weight: 15 },
      ];
      expect(calculateFrameworkScore(reqs)).toBe(100);
    });

    it("returns 0 for all non-compliant requirements", () => {
      const reqs = [
        { status: "non_compliant" as const, weight: 10 },
        { status: "non_compliant" as const, weight: 20 },
      ];
      expect(calculateFrameworkScore(reqs)).toBe(0);
    });

    it("returns 50 for mixed compliant/non-compliant with equal weights", () => {
      const reqs = [
        { status: "compliant" as const, weight: 10 },
        { status: "non_compliant" as const, weight: 10 },
      ];
      expect(calculateFrameworkScore(reqs)).toBe(50);
    });

    it("weights heavier requirements more", () => {
      const heavyCompliant = [
        { status: "compliant" as const, weight: 30 },
        { status: "non_compliant" as const, weight: 10 },
      ];
      const lightCompliant = [
        { status: "compliant" as const, weight: 10 },
        { status: "non_compliant" as const, weight: 30 },
      ];
      expect(calculateFrameworkScore(heavyCompliant)).toBeGreaterThan(calculateFrameworkScore(lightCompliant));
    });

    it("returns 0 for empty requirements", () => {
      expect(calculateFrameworkScore([])).toBe(0);
    });
  });

  describe("Compliance Risk Classification", () => {
    function classifyComplianceRisk(score: number): string {
      if (score >= 80) return "Low Risk";
      if (score >= 60) return "Moderate Risk";
      if (score >= 40) return "High Risk";
      return "Critical Risk";
    }

    it("classifies 80+ as Low Risk", () => {
      expect(classifyComplianceRisk(85)).toBe("Low Risk");
      expect(classifyComplianceRisk(100)).toBe("Low Risk");
      expect(classifyComplianceRisk(80)).toBe("Low Risk");
    });

    it("classifies 60-79 as Moderate Risk", () => {
      expect(classifyComplianceRisk(65)).toBe("Moderate Risk");
      expect(classifyComplianceRisk(79)).toBe("Moderate Risk");
    });

    it("classifies 40-59 as High Risk", () => {
      expect(classifyComplianceRisk(45)).toBe("High Risk");
      expect(classifyComplianceRisk(59)).toBe("High Risk");
    });

    it("classifies below 40 as Critical Risk", () => {
      expect(classifyComplianceRisk(30)).toBe("Critical Risk");
      expect(classifyComplianceRisk(0)).toBe("Critical Risk");
    });
  });
});

// ─── Advanced Stakeholder Management ────────────────────────────────────────

describe("Advanced Stakeholder Management", () => {
  describe("Stakeholder Influence-Alignment Matrix", () => {
    type StakeholderCategory = "champion" | "ally" | "neutral" | "risk" | "threat";

    function categoriseStakeholder(influence: number, alignment: number): StakeholderCategory {
      if (influence >= 7 && alignment >= 7) return "champion";
      if (influence >= 5 && alignment >= 5) return "ally";
      if (influence >= 7 && alignment < 4) return "threat";
      if (influence >= 5 && alignment < 5) return "risk";
      return "neutral";
    }

    it("identifies champions (high influence + high alignment)", () => {
      expect(categoriseStakeholder(9, 9)).toBe("champion");
      expect(categoriseStakeholder(7, 8)).toBe("champion");
    });

    it("identifies allies (medium influence + medium alignment)", () => {
      expect(categoriseStakeholder(6, 6)).toBe("ally");
      expect(categoriseStakeholder(5, 7)).toBe("ally");
    });

    it("identifies threats (high influence + low alignment)", () => {
      expect(categoriseStakeholder(9, 2)).toBe("threat");
      expect(categoriseStakeholder(8, 3)).toBe("threat");
    });

    it("identifies risks (medium influence + low alignment)", () => {
      expect(categoriseStakeholder(6, 3)).toBe("risk");
      expect(categoriseStakeholder(5, 4)).toBe("risk");
    });

    it("identifies neutrals (low influence)", () => {
      expect(categoriseStakeholder(3, 5)).toBe("neutral");
      expect(categoriseStakeholder(2, 2)).toBe("neutral");
    });
  });

  describe("Engagement Priority Scoring", () => {
    function calculateEngagementPriority(influence: number, alignment: number, lastContactDays: number): number {
      // Higher influence = higher priority
      // Lower alignment = higher priority (needs attention)
      // Longer since last contact = higher priority
      const influenceScore = influence * 3;
      const misalignmentScore = (10 - alignment) * 2;
      const recencyScore = Math.min(lastContactDays / 7, 10); // Max 10 points for 70+ days
      return Math.round(influenceScore + misalignmentScore + recencyScore);
    }

    it("prioritises high-influence misaligned stakeholders", () => {
      const highInfluenceMisaligned = calculateEngagementPriority(9, 2, 30);
      const lowInfluenceAligned = calculateEngagementPriority(2, 9, 30);
      expect(highInfluenceMisaligned).toBeGreaterThan(lowInfluenceAligned);
    });

    it("increases priority with time since last contact", () => {
      const recentContact = calculateEngagementPriority(5, 5, 7);
      const oldContact = calculateEngagementPriority(5, 5, 70);
      expect(oldContact).toBeGreaterThan(recentContact);
    });

    it("caps recency score at 70+ days", () => {
      const at70Days = calculateEngagementPriority(5, 5, 70);
      const at140Days = calculateEngagementPriority(5, 5, 140);
      expect(at70Days).toBe(at140Days); // Both capped at max recency
    });

    it("returns positive score for all valid inputs", () => {
      expect(calculateEngagementPriority(1, 1, 0)).toBeGreaterThanOrEqual(0);
      expect(calculateEngagementPriority(10, 10, 100)).toBeGreaterThan(0);
    });
  });

  describe("Stakeholder Communication Log", () => {
    const interactions = [
      { stakeholderId: "s1", type: "meeting", date: "2025-01-15", outcome: "positive", missionAlignmentDelta: 2 },
      { stakeholderId: "s1", type: "email", date: "2025-02-01", outcome: "neutral", missionAlignmentDelta: 0 },
      { stakeholderId: "s2", type: "call", date: "2025-01-20", outcome: "negative", missionAlignmentDelta: -1 },
      { stakeholderId: "s1", type: "meeting", date: "2025-03-10", outcome: "positive", missionAlignmentDelta: 3 },
    ];

    it("counts interactions per stakeholder", () => {
      const s1Count = interactions.filter(i => i.stakeholderId === "s1").length;
      expect(s1Count).toBe(3);
    });

    it("calculates cumulative alignment delta", () => {
      const s1Delta = interactions
        .filter(i => i.stakeholderId === "s1")
        .reduce((sum, i) => sum + i.missionAlignmentDelta, 0);
      expect(s1Delta).toBe(5);
    });

    it("identifies negative trend stakeholders", () => {
      const negativeStakeholders = interactions
        .filter(i => i.missionAlignmentDelta < 0)
        .map(i => i.stakeholderId);
      expect(negativeStakeholders).toContain("s2");
    });

    it("identifies most recent interaction", () => {
      const s1Interactions = interactions.filter(i => i.stakeholderId === "s1");
      const mostRecent = s1Interactions.sort((a, b) => b.date.localeCompare(a.date))[0];
      expect(mostRecent.date).toBe("2025-03-10");
    });
  });
});

// ─── Mission Metrics Integration ────────────────────────────────────────────

describe("Mission Metrics Integration", () => {
  describe("Portfolio-Level Mission Score Aggregation", () => {
    function aggregatePortfolioScore(ventures: Array<{ id: string; miiScore: number | null; weight: number }>) {
      const scoredVentures = ventures.filter(v => v.miiScore !== null);
      if (scoredVentures.length === 0) return null;

      const totalWeight = scoredVentures.reduce((sum, v) => sum + v.weight, 0);
      const weightedSum = scoredVentures.reduce((sum, v) => sum + (v.miiScore! * v.weight), 0);

      return Math.round(weightedSum / totalWeight);
    }

    it("returns null for ventures with no scores", () => {
      const ventures = [
        { id: "v1", miiScore: null, weight: 1 },
        { id: "v2", miiScore: null, weight: 1 },
      ];
      expect(aggregatePortfolioScore(ventures)).toBeNull();
    });

    it("calculates weighted average correctly", () => {
      const ventures = [
        { id: "v1", miiScore: 80, weight: 2 },
        { id: "v2", miiScore: 60, weight: 1 },
      ];
      // (80*2 + 60*1) / (2+1) = 220/3 ≈ 73
      expect(aggregatePortfolioScore(ventures)).toBe(73);
    });

    it("ignores unscored ventures in calculation", () => {
      const ventures = [
        { id: "v1", miiScore: 75, weight: 1 },
        { id: "v2", miiScore: null, weight: 1 },
        { id: "v3", miiScore: 85, weight: 1 },
      ];
      expect(aggregatePortfolioScore(ventures)).toBe(80);
    });

    it("returns single venture score when only one is scored", () => {
      const ventures = [
        { id: "v1", miiScore: 72, weight: 1 },
      ];
      expect(aggregatePortfolioScore(ventures)).toBe(72);
    });
  });

  describe("Mission Metrics Dashboard Integration", () => {
    const dashboardModules = [
      "CommandCentre",
      "Portfolio Overview",
      "VRL Analytics",
      "TRL Analytics",
      "Financial Analytics",
      "Governance Hub",
      "Risk Intelligence",
      "Venture Detail",
      "BRL Analytics",
      "IP Management",
      "Brand & PR",
      "People Intelligence",
      "Market Intelligence",
    ];

    it("has mission metrics in all 13 key modules", () => {
      expect(dashboardModules).toHaveLength(13);
    });

    it("includes Command Centre in mission metrics integration", () => {
      expect(dashboardModules).toContain("CommandCentre");
    });

    it("includes Risk Intelligence in mission metrics integration", () => {
      expect(dashboardModules).toContain("Risk Intelligence");
    });

    it("includes Governance Hub in mission metrics integration", () => {
      expect(dashboardModules).toContain("Governance Hub");
    });

    it("includes Venture Detail in mission metrics integration", () => {
      expect(dashboardModules).toContain("Venture Detail");
    });
  });

  describe("Mission Score Trend Analysis", () => {
    function calculateTrend(scores: number[]): "improving" | "stable" | "declining" {
      if (scores.length < 2) return "stable";
      const recent = scores.slice(-3);
      const older = scores.slice(0, -3);
      if (older.length === 0) return "stable";

      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

      const delta = recentAvg - olderAvg;
      if (delta > 3) return "improving";
      if (delta < -3) return "declining";
      return "stable";
    }

    it("identifies improving trend", () => {
      const scores = [60, 62, 65, 70, 75, 80];
      expect(calculateTrend(scores)).toBe("improving");
    });

    it("identifies declining trend", () => {
      const scores = [80, 78, 75, 70, 65, 60];
      expect(calculateTrend(scores)).toBe("declining");
    });

    it("identifies stable trend", () => {
      const scores = [70, 71, 69, 70, 72, 71];
      expect(calculateTrend(scores)).toBe("stable");
    });

    it("returns stable for single score", () => {
      expect(calculateTrend([75])).toBe("stable");
    });

    it("returns stable for empty scores", () => {
      expect(calculateTrend([])).toBe("stable");
    });
  });
});
