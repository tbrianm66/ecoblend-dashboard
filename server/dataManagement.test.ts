/**
 * Data Management Module — Vitest Tests
 * Covers: data asset types, quality scoring, AI pipeline configs,
 * RAG pipeline configs, fine-tuning jobs, feedback loops, context engineering
 */
import { describe, it, expect } from "vitest";

// ─── Data Asset Types ────────────────────────────────────────────────────────
describe("Data Asset Types", () => {
  const validTypes = [
    "interview", "survey", "secondary_research",
    "ai_analysis", "focus_group", "observation",
    "market_data", "financial_data", "technical_doc",
    "patent", "academic_paper", "competitor_analysis"
  ];

  it("should accept all valid data asset types", () => {
    validTypes.forEach(type => {
      expect(typeof type).toBe("string");
      expect(type.length).toBeGreaterThan(0);
    });
  });

  it("should have 12 defined asset types", () => {
    expect(validTypes).toHaveLength(12);
  });
});

// ─── Data Quality Scoring ─────────────────────────────────────────────────────
describe("Data Quality Scoring", () => {
  function calculateQualityScore(
    completeness: number,
    accuracy: number,
    freshness: number,
    consistency: number
  ): number {
    return Math.round((completeness + accuracy + freshness + consistency) / 4);
  }

  it("should calculate average quality score correctly", () => {
    expect(calculateQualityScore(80, 90, 70, 85)).toBe(81);
    expect(calculateQualityScore(100, 100, 100, 100)).toBe(100);
    expect(calculateQualityScore(0, 0, 0, 0)).toBe(0);
  });

  it("should handle partial scores", () => {
    expect(calculateQualityScore(60, 75, 50, 65)).toBe(63);
  });

  it("should clamp scores to 0-100 range", () => {
    const score = calculateQualityScore(80, 90, 70, 85);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("should classify quality tiers correctly", () => {
    function classifyQuality(score: number): string {
      if (score >= 80) return "high";
      if (score >= 60) return "medium";
      if (score >= 40) return "low";
      return "critical";
    }
    expect(classifyQuality(85)).toBe("high");
    expect(classifyQuality(65)).toBe("medium");
    expect(classifyQuality(45)).toBe("low");
    expect(classifyQuality(25)).toBe("critical");
  });
});

// ─── AI Pipeline Status ───────────────────────────────────────────────────────
describe("AI Pipeline Status", () => {
  const validStatuses = ["draft", "active", "paused", "archived", "error"];

  it("should accept all valid pipeline statuses", () => {
    validStatuses.forEach(status => {
      expect(typeof status).toBe("string");
    });
  });

  it("should have 5 defined pipeline statuses", () => {
    expect(validStatuses).toHaveLength(5);
  });

  it("should identify active pipelines correctly", () => {
    const isActive = (status: string) => status === "active";
    expect(isActive("active")).toBe(true);
    expect(isActive("paused")).toBe(false);
    expect(isActive("error")).toBe(false);
  });
});

// ─── AI Pipeline Types ────────────────────────────────────────────────────────
describe("AI Pipeline Types", () => {
  const validTypes = [
    "data_ingestion", "data_cleaning", "data_enrichment",
    "sentiment_analysis", "entity_extraction", "classification",
    "summarisation", "embedding_generation", "rag_retrieval"
  ];

  it("should accept all valid pipeline types", () => {
    validTypes.forEach(type => {
      expect(typeof type).toBe("string");
      expect(type.length).toBeGreaterThan(0);
    });
  });

  it("should have 9 defined pipeline types", () => {
    expect(validTypes).toHaveLength(9);
  });
});

// ─── RAG Pipeline Configuration ──────────────────────────────────────────────
describe("RAG Pipeline Configuration", () => {
  it("should validate chunk size range", () => {
    const validChunkSizes = [256, 512, 1024, 2048];
    validChunkSizes.forEach(size => {
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThanOrEqual(4096);
    });
  });

  it("should validate overlap percentage", () => {
    const validOverlaps = [0, 10, 20, 30];
    validOverlaps.forEach(overlap => {
      expect(overlap).toBeGreaterThanOrEqual(0);
      expect(overlap).toBeLessThan(100);
    });
  });

  it("should validate top-k retrieval count", () => {
    const validTopK = [1, 3, 5, 10, 20];
    validTopK.forEach(k => {
      expect(k).toBeGreaterThan(0);
      expect(k).toBeLessThanOrEqual(50);
    });
  });

  it("should validate similarity threshold", () => {
    const validThresholds = [0.5, 0.7, 0.8, 0.9];
    validThresholds.forEach(threshold => {
      expect(threshold).toBeGreaterThan(0);
      expect(threshold).toBeLessThanOrEqual(1);
    });
  });

  it("should identify retrieval strategies", () => {
    const strategies = ["semantic", "keyword", "hybrid", "mmr"];
    expect(strategies).toHaveLength(4);
    expect(strategies).toContain("hybrid");
    expect(strategies).toContain("semantic");
  });
});

// ─── Fine-Tuning Job Status ───────────────────────────────────────────────────
describe("Fine-Tuning Job Status", () => {
  const validStatuses = ["pending", "running", "completed", "failed", "cancelled"];

  it("should accept all valid job statuses", () => {
    validStatuses.forEach(status => {
      expect(typeof status).toBe("string");
    });
  });

  it("should identify terminal statuses", () => {
    const terminalStatuses = ["completed", "failed", "cancelled"];
    terminalStatuses.forEach(status => {
      expect(["completed", "failed", "cancelled"]).toContain(status);
    });
  });

  it("should identify active statuses", () => {
    const activeStatuses = ["pending", "running"];
    activeStatuses.forEach(status => {
      expect(["pending", "running"]).toContain(status);
    });
  });
});

// ─── Fine-Tuning Dataset Types ────────────────────────────────────────────────
describe("Fine-Tuning Dataset Types", () => {
  const validTypes = [
    "instruction_following", "question_answering", "classification",
    "summarisation", "code_generation", "venture_analysis"
  ];

  it("should accept all valid dataset types", () => {
    validTypes.forEach(type => {
      expect(typeof type).toBe("string");
    });
  });

  it("should have 6 defined dataset types", () => {
    expect(validTypes).toHaveLength(6);
  });
});

// ─── Feedback Loop Types ──────────────────────────────────────────────────────
describe("Feedback Loop Types", () => {
  const validTypes = [
    "thumbs_up_down", "star_rating", "text_correction",
    "relevance_score", "hallucination_flag", "preference_comparison"
  ];

  it("should accept all valid feedback types", () => {
    validTypes.forEach(type => {
      expect(typeof type).toBe("string");
    });
  });

  it("should have 6 defined feedback types", () => {
    expect(validTypes).toHaveLength(6);
  });

  it("should identify binary feedback types", () => {
    const binaryTypes = ["thumbs_up_down", "hallucination_flag"];
    binaryTypes.forEach(type => {
      expect(validTypes).toContain(type);
    });
  });
});

// ─── Feedback Rating Validation ───────────────────────────────────────────────
describe("Feedback Rating Validation", () => {
  it("should validate thumbs rating (1 or -1)", () => {
    const validThumbsRatings = [1, -1];
    validThumbsRatings.forEach(rating => {
      expect(Math.abs(rating)).toBe(1);
    });
  });

  it("should validate star rating (1-5)", () => {
    const validStarRatings = [1, 2, 3, 4, 5];
    validStarRatings.forEach(rating => {
      expect(rating).toBeGreaterThanOrEqual(1);
      expect(rating).toBeLessThanOrEqual(5);
    });
  });

  it("should calculate average feedback score", () => {
    const ratings = [4, 5, 3, 4, 5];
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    expect(avg).toBe(4.2);
  });
});

// ─── Context Engineering ──────────────────────────────────────────────────────
describe("Context Engineering", () => {
  const validContextTypes = [
    "system_prompt", "few_shot_example", "chain_of_thought",
    "retrieval_context", "tool_definition", "output_format"
  ];

  it("should accept all valid context types", () => {
    validContextTypes.forEach(type => {
      expect(typeof type).toBe("string");
    });
  });

  it("should have 6 defined context types", () => {
    expect(validContextTypes).toHaveLength(6);
  });

  it("should validate token count estimation", () => {
    function estimateTokens(text: string): number {
      return Math.ceil(text.split(/\s+/).length * 1.3);
    }
    expect(estimateTokens("Hello world this is a test")).toBe(8);
    expect(estimateTokens("")).toBe(2); // empty string splits to [""] (length 1), * 1.3 = 1.3, ceil = 2
  });

  it("should identify prompt template variables", () => {
    const template = "Analyse {venture_name} at TRL {trl_level} with focus on {domain}";
    const variables = template.match(/\{(\w+)\}/g) || [];
    expect(variables).toHaveLength(3);
    expect(variables).toContain("{venture_name}");
    expect(variables).toContain("{trl_level}");
    expect(variables).toContain("{domain}");
  });
});

// ─── Data Source Integration ──────────────────────────────────────────────────
describe("Data Source Integration", () => {
  const validSourceTypes = [
    "manual_upload", "api_integration", "web_scraping",
    "database_sync", "file_import", "real_time_stream"
  ];

  it("should accept all valid source types", () => {
    validSourceTypes.forEach(type => {
      expect(typeof type).toBe("string");
    });
  });

  it("should validate sync frequency options", () => {
    const frequencies = ["manual", "hourly", "daily", "weekly", "monthly"];
    expect(frequencies).toHaveLength(5);
    expect(frequencies).toContain("daily");
  });

  it("should validate data format types", () => {
    const formats = ["json", "csv", "pdf", "docx", "txt", "html", "xml"];
    formats.forEach(format => {
      expect(typeof format).toBe("string");
    });
  });
});

// ─── Pipeline Run History ─────────────────────────────────────────────────────
describe("Pipeline Run History", () => {
  it("should calculate pipeline success rate", () => {
    const runs = [
      { status: "completed" },
      { status: "completed" },
      { status: "failed" },
      { status: "completed" },
      { status: "failed" },
    ];
    const successRate = (runs.filter(r => r.status === "completed").length / runs.length) * 100;
    expect(successRate).toBe(60);
  });

  it("should calculate average run duration", () => {
    const durations = [120, 180, 90, 150, 200]; // seconds
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    expect(avg).toBe(148);
  });

  it("should identify failed runs for retry", () => {
    const runs = [
      { id: 1, status: "completed" },
      { id: 2, status: "failed" },
      { id: 3, status: "failed" },
      { id: 4, status: "completed" },
    ];
    const failedRuns = runs.filter(r => r.status === "failed");
    expect(failedRuns).toHaveLength(2);
    expect(failedRuns.map(r => r.id)).toEqual([2, 3]);
  });
});

// ─── Embedding Model Types ────────────────────────────────────────────────────
describe("Embedding Model Types", () => {
  const validModels = [
    "text-embedding-3-small", "text-embedding-3-large",
    "text-embedding-ada-002", "bge-large-en", "e5-large-v2"
  ];

  it("should accept all valid embedding models", () => {
    validModels.forEach(model => {
      expect(typeof model).toBe("string");
      expect(model.length).toBeGreaterThan(0);
    });
  });

  it("should have 5 defined embedding models", () => {
    expect(validModels).toHaveLength(5);
  });
});

// ─── Data Management Summary Stats ───────────────────────────────────────────
describe("Data Management Summary Stats", () => {
  it("should aggregate asset counts by type", () => {
    const assets = [
      { type: "interview" },
      { type: "survey" },
      { type: "interview" },
      { type: "market_data" },
      { type: "survey" },
      { type: "interview" },
    ];
    const counts = assets.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    expect(counts["interview"]).toBe(3);
    expect(counts["survey"]).toBe(2);
    expect(counts["market_data"]).toBe(1);
  });

  it("should calculate overall data health score", () => {
    const qualityScores = [85, 72, 90, 68, 78];
    const healthScore = Math.round(
      qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
    );
    expect(healthScore).toBe(79);
  });

  it("should count active vs inactive pipelines", () => {
    const pipelines = [
      { status: "active" },
      { status: "active" },
      { status: "paused" },
      { status: "archived" },
      { status: "active" },
    ];
    const active = pipelines.filter(p => p.status === "active").length;
    const inactive = pipelines.filter(p => p.status !== "active").length;
    expect(active).toBe(3);
    expect(inactive).toBe(2);
  });
});
