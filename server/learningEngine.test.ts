/**
 * Learning Engine Router — Vitest Tests
 * Sprint 69 — EcoBlend VBS Platform
 *
 * Tests cover:
 *   - Structuring Engine: processInput, listInsights, listProblems, updateProblemStatus
 *   - VRL Engine: calculate, history, scenarioAnalysis, portfolioSummary
 *   - Pattern Detection: detect, list, predictSuccess
 *   - Recommendation Engine: generate, list, updateStatus
 *   - Knowledge Graph: build, getGraph, portfolioStats
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { learningEngineRouter } from "./learningEngine.router";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn(() => null),
}));

// ─── Mock LLM ─────────────────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(() =>
    Promise.resolve({
      choices: [
        {
          message: {
            content: JSON.stringify({
              keyInsight: "Customers struggle with manual reporting",
              problemStatement: "Manual data entry causes 3-hour weekly overhead",
              sector: "SaaS",
              customerSegment: "SME Operations Teams",
              context: "Discovered in 12 customer interviews",
              tags: ["automation", "reporting", "efficiency"],
              evidenceStrength: 4,
              ipSensitive: false,
              frequencyIndicator: "high",
              severityScore: 4,
            }),
          },
        },
      ],
    })
  ),
}));

// ─── Mock caller with user context ───────────────────────────────────────────
const mockUser = {
  id: "user-test-001",
  name: "Test User",
  email: "test@ecoblend.io",
  role: "admin" as const,
  openId: "open-id-001",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const caller = learningEngineRouter.createCaller({ user: mockUser } as any);

// ─────────────────────────────────────────────────────────────────────────────
// STRUCTURING ENGINE
// ─────────────────────────────────────────────────────────────────────────────
describe("Structuring Engine", () => {
  describe("processInput", () => {
    it("throws when DB is unavailable", async () => {
      await expect(
        caller.structuring.processInput({
          rawInput: "Customers are spending 3 hours per week on manual data entry and reporting tasks. This was validated across 12 interviews in the SME sector.",
          sourceType: "interview",
          ventureId: "venture-001",
        })
      ).rejects.toThrow();
    });

    it("throws when rawInput is too short", async () => {
      await expect(
        caller.structuring.processInput({
          rawInput: "short",
          sourceType: "research",
          ventureId: "venture-001",
        })
      ).rejects.toThrow();
    });

    it("rejects invalid sourceType values", async () => {
      await expect(
        caller.structuring.processInput({
          rawInput: "Detailed research note about customer pain points in the logistics sector with strong evidence from 20 data points.",
          sourceType: "invalid_type" as any,
          ventureId: "venture-001",
        })
      ).rejects.toThrow();
    });
  });

  describe("listInsights", () => {
    it("returns empty array when DB is unavailable", async () => {
      const result = await caller.structuring.listInsights({
        ventureId: "venture-001",
      });
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it("accepts optional sourceType filter", async () => {
      const result = await caller.structuring.listInsights({
        ventureId: "venture-001",
        sourceType: "interview",
      });
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts limit parameter", async () => {
      const result = await caller.structuring.listInsights({
        ventureId: "venture-001",
        limit: 10,
      });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("listProblems", () => {
    it("returns empty array when DB is unavailable", async () => {
      const result = await caller.structuring.listProblems({});
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts ventureId filter", async () => {
      const result = await caller.structuring.listProblems({ ventureId: "venture-001" });
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts sector filter", async () => {
      const result = await caller.structuring.listProblems({ sector: "SaaS" });
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts status filter", async () => {
      const result = await caller.structuring.listProblems({ status: "active" });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("updateProblemStatus", () => {
    it("throws when DB is unavailable", async () => {
      await expect(
        caller.structuring.updateProblemStatus({ id: 1, status: "validated" })
      ).rejects.toThrow();
    });

    it("rejects invalid status values", async () => {
      await expect(
        caller.structuring.updateProblemStatus({ id: 1, status: "invalid" as any })
      ).rejects.toThrow();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// VRL ENGINE
// ─────────────────────────────────────────────────────────────────────────────
describe("VRL Engine", () => {
  describe("calculate", () => {
    it("throws when DB is unavailable", async () => {
      await expect(
        caller.vrlEngine.calculate({
          ventureId: "venture-001",
          alpha: 0.5,
          beta: 0.5,
        })
      ).rejects.toThrow();
    });

    it("rejects alpha out of range", async () => {
      await expect(
        caller.vrlEngine.calculate({
          ventureId: "venture-001",
          alpha: 1.5,
          beta: 0.5,
        })
      ).rejects.toThrow();
    });

    it("rejects beta out of range", async () => {
      await expect(
        caller.vrlEngine.calculate({
          ventureId: "venture-001",
          alpha: 0.5,
          beta: -0.1,
        })
      ).rejects.toThrow();
    });

    it("accepts valid alpha/beta defaults", async () => {
      await expect(
        caller.vrlEngine.calculate({
          ventureId: "venture-001",
          alpha: 0.5,
          beta: 0.5,
        })
      ).rejects.toThrow(); // DB null, but input is valid
    });
  });

  describe("history", () => {
    it("returns empty result when DB is unavailable", async () => {
      const result = await caller.vrlEngine.history({
        ventureId: "venture-001",
        limit: 10,
      });
      expect(result).toBeDefined();
    });

    it("accepts default limit", async () => {
      const result = await caller.vrlEngine.history({ ventureId: "venture-001" });
      expect(result).toBeDefined();
    });
  });

  describe("scenarioAnalysis", () => {
    it("returns empty array when DB is unavailable", async () => {
      const result = await caller.vrlEngine.scenarioAnalysis({
        ventureId: "venture-001",
        scenarios: [
          { name: "Tech-Heavy", alpha: 0.7, beta: 0.3 },
          { name: "Balanced", alpha: 0.5, beta: 0.5 },
        ],
      });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("portfolioSummary", () => {
    it("returns empty array when DB is unavailable", async () => {
      const result = await caller.vrlEngine.portfolioSummary();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATTERN DETECTION
// ─────────────────────────────────────────────────────────────────────────────
describe("Pattern Detection", () => {
  describe("detect", () => {
    it("throws when DB is unavailable", async () => {
      await expect(
        caller.patterns.detect({})
      ).rejects.toThrow();
    });

    it("throws with optional ventureId when DB is unavailable", async () => {
      await expect(
        caller.patterns.detect({ ventureId: "venture-001" })
      ).rejects.toThrow();
    });
  });

  describe("list", () => {
    it("returns empty array when DB is unavailable", async () => {
      const result = await caller.patterns.list({});
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts activeOnly filter", async () => {
      const result = await caller.patterns.list({ activeOnly: true });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("predictSuccess", () => {
    it("returns null when DB is unavailable", async () => {
      const result = await caller.patterns.predictSuccess({ ventureId: "venture-001" });
      expect(result).toBeNull();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RECOMMENDATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────
describe("Recommendation Engine", () => {
  describe("generate", () => {
    it("throws when DB is unavailable", async () => {
      await expect(
        caller.recommendations.generate({ ventureId: "venture-001" })
      ).rejects.toThrow("DB unavailable");
    });
  });

  describe("list", () => {
    it("returns empty array when DB is unavailable", async () => {
      const result = await caller.recommendations.list({ ventureId: "venture-001" });
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts status filter", async () => {
      const result = await caller.recommendations.list({
        ventureId: "venture-001",
        status: "active",
      });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("updateStatus", () => {
    it("throws when DB is unavailable", async () => {
      await expect(
        caller.recommendations.updateStatus({ id: 1, status: "completed" })
      ).rejects.toThrow("DB unavailable");
    });

    it("rejects invalid status", async () => {
      await expect(
        caller.recommendations.updateStatus({ id: 1, status: "invalid" as any })
      ).rejects.toThrow();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// KNOWLEDGE GRAPH
// ─────────────────────────────────────────────────────────────────────────────
describe("Knowledge Graph", () => {
  describe("build", () => {
    it("throws when DB is unavailable", async () => {
      await expect(
        caller.knowledgeGraph.build({ ventureId: "venture-001" })
      ).rejects.toThrow();
    });
  });

  describe("getGraph", () => {
    it("returns empty graph when DB is unavailable", async () => {
      const result = await caller.knowledgeGraph.getGraph({ ventureId: "venture-001" });
      expect(result).toBeDefined();
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(Array.isArray(result.edges)).toBe(true);
    });
  });

  describe("portfolioStats", () => {
    it("returns null or object when DB is unavailable", async () => {
      const result = await caller.knowledgeGraph.portfolioStats();
      // When DB is null, result may be null or a zero-stats object
      if (result !== null) {
        expect(result.totalNodes).toBeDefined();
        expect(result.totalEdges).toBeDefined();
      } else {
        expect(result).toBeNull();
      }
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTER STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────
describe("Router Structure", () => {
  it("exports learningEngineRouter with all 5 sub-routers", () => {
    expect(learningEngineRouter).toBeDefined();
    const routerDef = (learningEngineRouter as any)._def;
    expect(routerDef).toBeDefined();
    expect(routerDef.procedures).toBeDefined();
  });

  it("has structuring sub-router with processInput procedure", () => {
    const procedures = (learningEngineRouter as any)._def.procedures;
    expect(procedures["structuring.processInput"]).toBeDefined();
  });

  it("has vrlEngine sub-router with calculate procedure", () => {
    const procedures = (learningEngineRouter as any)._def.procedures;
    expect(procedures["vrlEngine.calculate"]).toBeDefined();
  });

  it("has patterns sub-router with detect procedure", () => {
    const procedures = (learningEngineRouter as any)._def.procedures;
    expect(procedures["patterns.detect"]).toBeDefined();
  });

  it("has recommendations sub-router with generate procedure", () => {
    const procedures = (learningEngineRouter as any)._def.procedures;
    expect(procedures["recommendations.generate"]).toBeDefined();
  });

  it("has knowledgeGraph sub-router with build procedure", () => {
    const procedures = (learningEngineRouter as any)._def.procedures;
    expect(procedures["knowledgeGraph.build"]).toBeDefined();
  });
});
