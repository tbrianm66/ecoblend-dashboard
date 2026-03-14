/**
 * Knowledge Base Ingestion Pipeline — Vitest Tests
 * Tests chunking, BM25 scoring, and helper utilities
 * without requiring a live database connection.
 */
import { describe, it, expect } from "vitest";

// ── Chunking logic (extracted inline for unit testing) ────────────────────────

function chunkText(text: string, maxWords = 500, overlapWords = 50): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + maxWords, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end === words.length) break;
    start = end - overlapWords;
  }
  return chunks;
}

// ── BM25 scoring logic (extracted inline for unit testing) ────────────────────

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2);
}

function bm25Score(
  query: string,
  doc: string,
  avgDocLen: number,
  k1 = 1.5,
  b = 0.75
): number {
  const queryTerms = tokenise(query);
  const docTerms   = tokenise(doc);
  const docLen     = docTerms.length;

  const termFreq: Record<string, number> = {};
  for (const t of docTerms) termFreq[t] = (termFreq[t] ?? 0) + 1;

  let score = 0;
  for (const term of queryTerms) {
    const tf = termFreq[term] ?? 0;
    if (tf === 0) continue;
    const idf = Math.log(2); // simplified IDF (single doc)
    const numerator   = tf * (k1 + 1);
    const denominator = tf + k1 * (1 - b + b * (docLen / avgDocLen));
    score += idf * (numerator / denominator);
  }
  return score;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Knowledge Base — Text Chunking", () => {
  it("returns empty array for empty text", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   ")).toEqual([]);
  });

  it("returns a single chunk when text is shorter than maxWords", () => {
    const text = "The lean startup methodology emphasises validated learning through rapid experimentation.";
    const chunks = chunkText(text, 500);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it("splits text into multiple chunks when it exceeds maxWords", () => {
    const words = Array.from({ length: 1200 }, (_, i) => `word${i}`);
    const text = words.join(" ");
    const chunks = chunkText(text, 500, 50);
    expect(chunks.length).toBeGreaterThan(1);
    // Each chunk should be at most 500 words
    for (const chunk of chunks) {
      expect(chunk.split(/\s+/).length).toBeLessThanOrEqual(500);
    }
  });

  it("applies overlap between consecutive chunks", () => {
    const words = Array.from({ length: 600 }, (_, i) => `word${i}`);
    const text = words.join(" ");
    const chunks = chunkText(text, 500, 50);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    // The second chunk should start with words from the overlap region of the first chunk
    const firstChunkLastWords = chunks[0].split(/\s+/).slice(-50);
    const secondChunkFirstWords = chunks[1].split(/\s+/).slice(0, 50);
    expect(firstChunkLastWords).toEqual(secondChunkFirstWords);
  });

  it("handles text with exactly maxWords words as a single chunk", () => {
    const words = Array.from({ length: 500 }, (_, i) => `word${i}`);
    const chunks = chunkText(words.join(" "), 500, 50);
    expect(chunks).toHaveLength(1);
  });

  it("handles text with maxWords + 1 words as two chunks", () => {
    const words = Array.from({ length: 501 }, (_, i) => `word${i}`);
    const chunks = chunkText(words.join(" "), 500, 50);
    expect(chunks).toHaveLength(2);
  });
});

describe("Knowledge Base — Tokenisation", () => {
  it("lowercases and removes punctuation", () => {
    const tokens = tokenise("Disruptive Innovation! Value-Networks.");
    expect(tokens).toContain("disruptive");
    expect(tokens).toContain("innovation");
    expect(tokens).toContain("value");
    expect(tokens).toContain("networks");
  });

  it("filters out short words (\u2264 2 chars)", () => {
    // Only words with length > 2 are kept; "a", "an", "is", "it" are filtered; "the" (3 chars) is kept
    const tokens = tokenise("a an is it");
    expect(tokens).toHaveLength(0);
  });

  it("handles empty string", () => {
    expect(tokenise("")).toEqual([]);
  });

  it("handles numbers and mixed content", () => {
    const tokens = tokenise("TRL level 7 represents technology demonstration");
    expect(tokens).toContain("trl");
    expect(tokens).toContain("level");
    expect(tokens).toContain("represents");
    expect(tokens).toContain("technology");
    expect(tokens).toContain("demonstration");
  });
});

describe("Knowledge Base — BM25 Scoring", () => {
  const avgDocLen = 100;

  it("returns 0 for a query with no matching terms", () => {
    const score = bm25Score("quantum physics", "the lean startup build measure learn", avgDocLen);
    expect(score).toBe(0);
  });

  it("returns a positive score when query terms appear in the document", () => {
    const score = bm25Score(
      "disruptive innovation",
      "disruptive innovation changes the competitive landscape by targeting non-consumers",
      avgDocLen
    );
    expect(score).toBeGreaterThan(0);
  });

  it("scores a more relevant document higher than a less relevant one", () => {
    const query = "lean startup validated learning";
    const highRelevance = "lean startup methodology uses validated learning through build measure learn cycles to reduce waste";
    const lowRelevance  = "traditional waterfall project management follows sequential phases of design and implementation";
    const avgLen = 15;

    const highScore = bm25Score(query, highRelevance, avgLen);
    const lowScore  = bm25Score(query, lowRelevance, avgLen);
    expect(highScore).toBeGreaterThan(lowScore);
  });

  it("scores higher for documents with more query term occurrences (up to saturation)", () => {
    const query = "pivot";
    const oneOccurrence  = "a pivot is a structured course correction";
    const manyOccurrences = "pivot pivot pivot pivot pivot is a structured course correction";
    const avgLen = 8;

    const score1 = bm25Score(query, oneOccurrence, avgLen);
    const scoreN = bm25Score(query, manyOccurrences, avgLen);
    // BM25 saturates — many occurrences should score higher but not proportionally
    expect(scoreN).toBeGreaterThan(score1);
  });

  it("penalises longer documents relative to average length", () => {
    const query = "disruptive innovation";
    const shortDoc = "disruptive innovation targets non-consumers";
    const longDoc  = Array.from({ length: 200 }, (_, i) =>
      i < 3 ? ["disruptive", "innovation", "targets"][i] : `filler${i}`
    ).join(" ");
    const avgLen = 50;

    const shortScore = bm25Score(query, shortDoc, avgLen);
    const longScore  = bm25Score(query, longDoc, avgLen);
    expect(shortScore).toBeGreaterThan(longScore);
  });
});

describe("Knowledge Base — Domain Filtering Logic", () => {
  const documents = [
    { id: 1, domain: "VRL",    content: "venture readiness level scoring engine alpha beta weights" },
    { id: 2, domain: "Market", content: "total addressable market size growth drivers competitive landscape" },
    { id: 3, domain: "ESG",    content: "environmental social governance sustainability reporting framework" },
    { id: 4, domain: "Market", content: "customer segmentation target market beachhead strategy" },
  ];

  function filterByDomain(docs: typeof documents, domain?: string) {
    if (!domain) return docs;
    return docs.filter(d => d.domain === domain);
  }

  it("returns all documents when no domain filter is specified", () => {
    expect(filterByDomain(documents)).toHaveLength(4);
  });

  it("returns only documents matching the specified domain", () => {
    const market = filterByDomain(documents, "Market");
    expect(market).toHaveLength(2);
    expect(market.every(d => d.domain === "Market")).toBe(true);
  });

  it("returns empty array when no documents match the domain", () => {
    expect(filterByDomain(documents, "Finance")).toHaveLength(0);
  });
});

describe("Knowledge Base — Chunk Word Count", () => {
  it("counts words correctly for a typical academic paragraph", () => {
    const text = "The Lean Startup by Eric Ries explains how validated learning through build measure learn cycles reduces waste in early stage ventures.";
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    expect(wordCount).toBe(21);
  });

  it("handles multiple spaces and newlines in word count", () => {
    const text = "lean  startup\n\nbuild  measure  learn";
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    expect(wordCount).toBe(5);
  });
});
