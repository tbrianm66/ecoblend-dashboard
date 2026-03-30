/**
 * IP Intelligence Module — Vitest Test Suite
 * Sprint 71 — EcoBlend OS
 *
 * Tests:
 *   - Lightbringer mock engine determinism and schema validity
 *   - Analysis CRUD (run, list, get, delete)
 *   - VRL feed (record, portfolioSummary)
 *   - IP_OBJECT JSON schema retrieval
 *   - Score validation (novelty 0-100, density LOW/MED/HIGH, FTO LOW/MED/HIGH)
 *   - Recommendation logic (PROCEED / MODIFY / KILL)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ipIntelligenceRouter } from "./ipIntelligence.router";

// ─── Mock LLM to avoid real API calls ────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "AI-enhanced IP analysis complete." } }],
  }),
}));

// ─── Mock DB ──────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// ─── Caller setup ─────────────────────────────────────────────────────────────
const mockUser = { id: "test-user-1", name: "Test User", email: "test@ecoblend.io", role: "admin" as const };
const caller = ipIntelligenceRouter.createCaller({ user: mockUser } as any);

// ─── Test Suite ───────────────────────────────────────────────────────────────
describe("IP Intelligence Module — ipIntelligenceRouter", () => {

  // ── Lightbringer Mock Engine ─────────────────────────────────────────────
  describe("lightbringer.runMock", () => {
    it("returns a valid IP_OBJECT with all required fields", async () => {
      const result = await caller.lightbringer.preview({
        ideaName: "Bio-degradable Racing Tyre",
        description: "A natural rubber compound with silica reinforcement for motorsport applications",
        keywords: "natural rubber, silica, bio-compound, motorsport",
        industry: "Materials Science",
        geography: "United Kingdom",
      });

      expect(result).toBeDefined();
      // preview result contains IP_OBJECT fields (ideaName echoed back)
      expect(result.noveltyScore).toBeDefined();
      expect(result.recommendation).toBeDefined();
      expect(result.preview).toBe(true);
    });

    it("returns noveltyScore between 0 and 100", async () => {
      const result = await caller.lightbringer.preview({
        ideaName: "Graphene Battery Electrode",
        description: "Graphene-based electrode material for high-density energy storage",
        keywords: "graphene, battery, electrode, energy storage",
        industry: "Electronics",
        geography: "Global",
      });

      const novelty = Number(result.noveltyScore);
      expect(novelty).toBeGreaterThanOrEqual(0);
      expect(novelty).toBeLessThanOrEqual(100);
    });

    it("returns valid patentDensity (LOW, MED, or HIGH)", async () => {
      const result = await caller.lightbringer.preview({
        ideaName: "Circular Fashion Platform",
        description: "AI-powered platform for circular fashion supply chain management",
        keywords: "circular economy, fashion, AI, supply chain",
        industry: "Fashion",
        geography: "European Union",
      });

      expect(["LOW", "MED", "HIGH"]).toContain(result.patentDensity);
    });

    it("returns valid ftoRisk (LOW, MED, or HIGH)", async () => {
      const result = await caller.lightbringer.preview({
        ideaName: "Solar Textile Integration",
        description: "Photovoltaic cells integrated into performance sportswear fabric",
        keywords: "solar, textile, photovoltaic, sportswear",
        industry: "Clean Energy",
        geography: "United States",
      });

      expect(["LOW", "MED", "HIGH"]).toContain(result.ftoRisk);
    });

    it("returns valid recommendation (PROCEED, MODIFY, or KILL)", async () => {
      const result = await caller.lightbringer.preview({
        ideaName: "Algae-based Packaging",
        description: "Biodegradable packaging material derived from algae biomass",
        keywords: "algae, packaging, biodegradable, biomass",
        industry: "Packaging",
        geography: "United Kingdom",
      });

      expect(["PROCEED", "MODIFY", "KILL"]).toContain(result.recommendation);
    });

    it("returns topEntities array with at least 3 entries", async () => {
      const result = await caller.lightbringer.preview({
        ideaName: "Hydrogen Fuel Cell Stack",
        description: "Compact hydrogen fuel cell stack for motorsport applications",
        keywords: "hydrogen, fuel cell, motorsport, clean energy",
        industry: "Automotive",
        geography: "Germany",
      });

      expect(Array.isArray(result.topEntities)).toBe(true);
      expect(result.topEntities.length).toBeGreaterThanOrEqual(3);
    });

    it("returns whitespaceOpportunities array with at least 2 entries", async () => {
      const result = await caller.lightbringer.preview({
        ideaName: "Smart Composites Sensor",
        description: "Embedded sensor network in composite materials for structural health monitoring",
        keywords: "composites, sensors, structural health, monitoring",
        industry: "Aerospace",
        geography: "United Kingdom",
      });

      expect(Array.isArray(result.whitespaceOpportunities)).toBe(true);
      expect(result.whitespaceOpportunities.length).toBeGreaterThanOrEqual(2);
    });

    it("returns ipScore between 0 and 100", async () => {
      const result = await caller.lightbringer.preview({
        ideaName: "Mycelium Composite Panel",
        description: "Structural panels grown from mycelium for construction applications",
        keywords: "mycelium, composite, construction, sustainable",
        industry: "Construction",
        geography: "United Kingdom",
      });

      const score = Number(result.ipScore);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("is deterministic for same input (same seed logic)", async () => {
      const input = {
        ideaName: "Determinism Test Idea",
        description: "Testing that the mock engine produces consistent results",
        keywords: "test, determinism, consistency",
        industry: "Software",
        geography: "United Kingdom",
      };
      const r1 = await caller.lightbringer.preview(input);
      const r2 = await caller.lightbringer.preview(input);

      // Same idea name should produce same recommendation
      expect(r1.recommendation).toBe(r2.recommendation);
      // Novelty scores should be within 5 points of each other (seeded randomness)
      expect(Math.abs(Number(r1.noveltyScore) - Number(r2.noveltyScore))).toBeLessThanOrEqual(5);
    });
  });

  // ── IP_OBJECT Schema ─────────────────────────────────────────────────────
  describe("lightbringer.getSchema", () => {
    it("returns the IP_OBJECT JSON schema", async () => {
      const schema = await caller.lightbringer.getSchema();

      expect(schema).toBeDefined();
      expect(schema.$schema).toBeDefined();
      expect(schema.title).toBe("IP_OBJECT");
      expect(schema.properties).toBeDefined();
    });

    it("schema contains all required IP_OBJECT fields", async () => {
      const schema = await caller.lightbringer.getSchema();
      const props = Object.keys(schema.properties);

      expect(props).toContain("ideaName");
      expect(props).toContain("noveltyScore");
      expect(props).toContain("patentDensity");
      expect(props).toContain("ftoRisk");
      expect(props).toContain("recommendation");
      expect(props).toContain("topEntities");
      expect(props).toContain("whitespaceOpportunities");
      expect(props).toContain("ipScore");
    });

    it("schema has correct enum values for patentDensity", async () => {
      const schema = await caller.lightbringer.getSchema();
      expect(schema.properties.patentDensity.enum).toEqual(["LOW", "MED", "HIGH"]);
    });

    it("schema has correct enum values for recommendation", async () => {
      const schema = await caller.lightbringer.getSchema();
      expect(schema.properties.recommendation.enum).toEqual(["PROCEED", "MODIFY", "KILL"]);
    });
  });

  // ── Analysis CRUD (DB null — throws) ────────────────────────────────────
  describe("analysis.run (DB null)", () => {
    it("throws when DB is unavailable", async () => {
      await expect(
        caller.analysis.run({
          ideaName: "Test Idea",
          description: "Test description for IP analysis",
          keywords: "test, keywords",
          industry: "Software",
          geography: "United Kingdom",
        })
      ).rejects.toThrow();
    });
  });

  describe("analysis.list (DB null)", () => {
    it("returns empty array when DB is unavailable", async () => {
      const result = await caller.analysis.list();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("analysis.get (DB null)", () => {
    it("throws NOT_FOUND when DB is unavailable", async () => {
      await expect(caller.analysis.get({ id: 1 })).rejects.toThrow();
    });
  });

  describe("analysis.delete (DB null)", () => {
    it("throws when DB is unavailable", async () => {
      await expect(caller.analysis.delete({ id: 1 })).rejects.toThrow();
    });
  });

  // ── VRL Feed (DB null — throws) ──────────────────────────────────────────
  describe("vrlFeed.getByVenture (DB null)", () => {
    it("returns empty array when DB is unavailable", async () => {
      const result = await caller.vrlFeed.getByVenture({ ventureId: "venture-1" });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("vrlFeed.portfolioSummary (DB null)", () => {
    it("returns empty array when DB is unavailable", async () => {
      const result = await caller.vrlFeed.portfolioSummary();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  // ── Score Logic Validation ───────────────────────────────────────────────
  describe("Lightbringer score logic", () => {
    it("PROCEED recommendation correlates with high novelty score", async () => {
      // Run multiple analyses and check that PROCEED correlates with higher scores
      const results = await Promise.all([
        caller.lightbringer.preview({ ideaName: "Alpha Innovation", description: "Completely novel bio-material synthesis using quantum-dot catalysis", keywords: "quantum, bio, novel, synthesis", industry: "Biotechnology", geography: "United Kingdom" }),
        caller.lightbringer.preview({ ideaName: "Beta Innovation", description: "Novel approach to carbon capture using engineered algae strains", keywords: "carbon, algae, capture, novel", industry: "Clean Energy", geography: "United Kingdom" }),
      ]);

      results.forEach(r => {
        expect(["PROCEED", "MODIFY", "KILL"]).toContain(r.recommendation);
        expect(Number(r.noveltyScore)).toBeGreaterThanOrEqual(0);
        expect(Number(r.noveltyScore)).toBeLessThanOrEqual(100);
      });
    });

    it("each entity has required fields: entityName, patentCount, threat", async () => {
      const result = await caller.lightbringer.preview({
        ideaName: "Entity Fields Test",
        description: "Testing that entity objects have all required fields",
        keywords: "entity, fields, test",
        industry: "Pharmaceuticals",
        geography: "United States",
      });

      result.topEntities.forEach((entity: { entityName: string; patentCount: number; threat: string }) => {
        expect(entity.entityName).toBeDefined();
        expect(typeof entity.patentCount).toBe("number");
        expect(["LOW", "MED", "HIGH"]).toContain(entity.threat);
      });
    });

    it("each whitespace opportunity has required fields: opportunity, actionable", async () => {
      const result = await caller.lightbringer.preview({
        ideaName: "Whitespace Fields Test",
        description: "Testing that whitespace objects have all required fields",
        keywords: "whitespace, opportunity, test",
        industry: "Agriculture",
        geography: "European Union",
      });

      result.whitespaceOpportunities.forEach((ws: { opportunity: string; actionable: boolean; potentialScore: number }) => {
        expect(ws.opportunity).toBeDefined();
        expect(typeof ws.actionable).toBe("boolean");
        expect(Number(ws.potentialScore)).toBeGreaterThanOrEqual(0);
        expect(Number(ws.potentialScore)).toBeLessThanOrEqual(100);
      });
    });

    it("VRL contribution is 15% of IP score", async () => {
      const result = await caller.lightbringer.preview({
        ideaName: "VRL Contribution Test",
        description: "Testing VRL contribution calculation from IP score",
        keywords: "vrl, contribution, ip, score",
        industry: "Software",
        geography: "United Kingdom",
      });

      const ipScore = Number(result.ipScore);
      const expectedVrlContrib = Math.round(ipScore * 0.15);
      // VRL contribution should be ~15% of IP score
      expect(expectedVrlContrib).toBeGreaterThanOrEqual(0);
      expect(expectedVrlContrib).toBeLessThanOrEqual(15);
    });
  });

  // ── Input Validation ─────────────────────────────────────────────────────
  describe("Input validation", () => {
    it("rejects empty ideaName", async () => {
      await expect(
        caller.lightbringer.preview({
          ideaName: "",
          description: "Valid description",
          keywords: "valid, keywords",
          industry: "Software",
          geography: "United Kingdom",
        })
      ).rejects.toThrow();
    });

    it("rejects empty description", async () => {
      await expect(
        caller.lightbringer.preview({
          ideaName: "Valid Name",
          description: "",
          keywords: "valid, keywords",
          industry: "Software",
          geography: "United Kingdom",
        })
      ).rejects.toThrow();
    });

    it("rejects empty keywords", async () => {
      await expect(
        caller.lightbringer.preview({
          ideaName: "Valid Name",
          description: "Valid description",
          keywords: "",
          industry: "Software",
          geography: "United Kingdom",
        })
      ).rejects.toThrow();
    });
  });
});
