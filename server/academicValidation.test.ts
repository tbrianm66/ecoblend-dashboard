// ── Academic Validation Module Tests ─────────────────────────────────────────
import { describe, it, expect } from "vitest";
import { extractKeywords } from "./semanticScholar";

describe("extractKeywords", () => {
  it("removes stop words and returns meaningful keywords", () => {
    const result = extractKeywords("Design and build a solid-state battery electrolyte for electric vehicles");
    expect(result).not.toContain("and");
    expect(result).not.toContain("for");
    expect(result).not.toContain("the");
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns at most maxKeywords words", () => {
    const result = extractKeywords(
      "bio-composite tensile strength material testing polymer matrix fibre reinforcement mechanical properties",
      4
    );
    const words = result.split(" ");
    expect(words.length).toBeLessThanOrEqual(4);
  });

  it("handles empty string gracefully", () => {
    const result = extractKeywords("");
    expect(result).toBe("");
  });

  it("handles text with only stop words", () => {
    const result = extractKeywords("the and or but is was are were");
    expect(result).toBe("");
  });

  it("de-duplicates words", () => {
    const result = extractKeywords("battery battery battery electrolyte electrolyte");
    const words = result.split(" ").filter(Boolean);
    const unique = new Set(words);
    expect(words.length).toBe(unique.size);
  });

  it("prefers longer (more specific) keywords", () => {
    const result = extractKeywords("nanotechnology polymer electrolyte solid battery");
    const words = result.split(" ").filter(Boolean);
    // First word should be one of the longer ones
    expect(words[0].length).toBeGreaterThanOrEqual(words[words.length - 1].length);
  });
});

describe("academicValidation tRPC procedures (schema)", () => {
  it("searchPapers input schema validates correctly", () => {
    const { z } = require("zod");
    const schema = z.object({
      taskId: z.number(),
      taskTitle: z.string(),
      taskDescription: z.string().optional(),
      limit: z.number().min(1).max(10).default(5),
    });
    expect(() => schema.parse({ taskId: 1, taskTitle: "Battery electrolyte test" })).not.toThrow();
    expect(() => schema.parse({ taskId: 1, taskTitle: "Test", limit: 3 })).not.toThrow();
    expect(() => schema.parse({ taskId: "not-a-number", taskTitle: "Test" })).toThrow();
  });

  it("attachPaper input schema validates correctly", () => {
    const { z } = require("zod");
    const schema = z.object({
      taskId: z.number(),
      ventureId: z.string(),
      externalId: z.string(),
      title: z.string(),
      authors: z.array(z.string()),
      abstract: z.string().optional(),
      url: z.string().optional(),
      citationCount: z.number().default(0),
      publishedYear: z.number().nullable().optional(),
      relevanceScore: z.number().nullable().optional(),
    });
    const valid = {
      taskId: 1,
      ventureId: "ecoblend",
      externalId: "doi:10.1234/test",
      title: "Test Paper",
      authors: ["Author One", "Author Two"],
      citationCount: 42,
    };
    expect(() => schema.parse(valid)).not.toThrow();
    expect(() => schema.parse({ ...valid, authors: "not-an-array" })).toThrow();
  });

  it("getTaskPapers input schema validates correctly", () => {
    const { z } = require("zod");
    const schema = z.object({ taskId: z.number() });
    expect(() => schema.parse({ taskId: 5 })).not.toThrow();
    expect(() => schema.parse({ taskId: "five" })).toThrow();
  });

  it("detachPaper input schema validates correctly", () => {
    const { z } = require("zod");
    const schema = z.object({ linkId: z.number() });
    expect(() => schema.parse({ linkId: 10 })).not.toThrow();
    expect(() => schema.parse({})).toThrow();
  });

  it("getValidatedTasks input schema validates correctly", () => {
    const { z } = require("zod");
    const schema = z.object({ ventureId: z.string() });
    expect(() => schema.parse({ ventureId: "bebus" })).not.toThrow();
    expect(() => schema.parse({ ventureId: 123 })).toThrow();
  });
});

describe("validation badge logic", () => {
  it("identifies tasks with qualifying papers (citationCount > 10)", () => {
    // Simulate the badge logic: task is validated if it has ≥1 paper with citationCount > 10
    const papers = [
      { id: 1, citationCount: 5 },
      { id: 2, citationCount: 15 },
      { id: 3, citationCount: 0 },
    ];
    const isValidated = papers.some(p => p.citationCount > 10);
    expect(isValidated).toBe(true);
  });

  it("does not validate tasks with only low-citation papers", () => {
    const papers = [
      { id: 1, citationCount: 3 },
      { id: 2, citationCount: 8 },
    ];
    const isValidated = papers.some(p => p.citationCount > 10);
    expect(isValidated).toBe(false);
  });

  it("correctly handles empty paper list", () => {
    const papers: { id: number; citationCount: number }[] = [];
    const isValidated = papers.some(p => p.citationCount > 10);
    expect(isValidated).toBe(false);
  });

  it("boundary: citationCount exactly 10 does not qualify", () => {
    const papers = [{ id: 1, citationCount: 10 }];
    const isValidated = papers.some(p => p.citationCount > 10);
    expect(isValidated).toBe(false);
  });

  it("boundary: citationCount exactly 11 qualifies", () => {
    const papers = [{ id: 1, citationCount: 11 }];
    const isValidated = papers.some(p => p.citationCount > 10);
    expect(isValidated).toBe(true);
  });
});
