// ── Data Management Router ─────────────────────────────────────────────────────
// Section 8: Data ingestion, validation, quality scoring, AI integration
// Section 9: RAG pipelines, fine-tuning, context engineering, feedback loops
import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { eq as eqOp, desc, and, sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { dispatchTrigger } from "./workflowEngine";
import {
  dmDataAssets,
  dmQualityScores,
  dmAiPipelines,
  dmPipelineRuns,
  dmRagPipelines,
  dmRagDocuments,
  dmFineTuningJobs,
  dmFineTuningDatasets,
  dmFeedbackEntries,
} from "../drizzle/schema";

// ── Data Assets ────────────────────────────────────────────────────────────────
export const dmAssetsRouter = router({
  list: publicProcedure
    .input(z.object({
      ventureId: z.string().optional(),
      assetType: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      let query = db.select().from(dmDataAssets).orderBy(desc(dmDataAssets.createdAt));
      const rows = await query;
      return rows.filter(r =>
        (!input.ventureId || r.ventureId === input.ventureId) &&
        (!input.assetType || r.assetType === input.assetType) &&
        (!input.status || r.status === input.status)
      );
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const [row] = await db.select().from(dmDataAssets).where(eqOp(dmDataAssets.id, input.id));
      return row ?? null;
    }),

  upsert: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      name: z.string().min(1),
      description: z.string().optional(),
      assetType: z.enum(["structured", "unstructured", "semi_structured", "time_series", "media"]).default("structured"),
      sourceType: z.enum(["manual_upload", "api_feed", "database_export", "web_scrape", "sensor", "survey", "interview"]).default("manual_upload"),
      format: z.enum(["csv", "json", "xlsx", "pdf", "docx", "mp3", "mp4", "image", "parquet", "other"]).default("csv"),
      sizeKb: z.number().optional(),
      rowCount: z.number().optional(),
      columnCount: z.number().optional(),
      storageUrl: z.string().optional(),
      storageKey: z.string().optional(),
      tags: z.string().optional(),
      schema: z.string().optional(),
      sampleData: z.string().optional(),
      status: z.enum(["draft", "ingested", "validated", "published", "archived", "error"]).default("draft"),
      linkedModule: z.string().optional(),
      linkedRecordId: z.number().optional(),
      ingestedBy: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const { id, ...data } = input;
      if (id) {
        await db.update(dmDataAssets).set({ ...data, updatedAt: new Date() }).where(eqOp(dmDataAssets.id, id));
        return { id };
      }
      const [result] = await db.insert(dmDataAssets).values(data);
      return { id: (result as any).insertId as number };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(dmDataAssets).where(eqOp(dmDataAssets.id, input.id));
      return { success: true };
    }),

  aiAssess: publicProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      assetType: z.string(),
      format: z.string(),
      rowCount: z.number().optional(),
      columnCount: z.number().optional(),
      sampleData: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a data quality expert. Analyse the described dataset and return a JSON quality assessment with: { completeness: number, accuracy: number, freshness: number, consistency: number, uniqueness: number, validity: number, overallScore: number, issues: [{field: string, type: string, severity: 'low'|'medium'|'high'}], recommendations: string[] }. All scores are 0-100.",
          },
          {
            role: "user",
            content: `Dataset: ${input.name}\nType: ${input.assetType}\nFormat: ${input.format}\nRows: ${input.rowCount ?? "unknown"}\nColumns: ${input.columnCount ?? "unknown"}\nDescription: ${input.description ?? "none"}\nSample: ${input.sampleData ?? "not provided"}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "quality_assessment",
            strict: true,
            schema: {
              type: "object",
              properties: {
                completeness: { type: "number" },
                accuracy: { type: "number" },
                freshness: { type: "number" },
                consistency: { type: "number" },
                uniqueness: { type: "number" },
                validity: { type: "number" },
                overallScore: { type: "number" },
                issues: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      field: { type: "string" },
                      type: { type: "string" },
                      severity: { type: "string" },
                    },
                    required: ["field", "type", "severity"],
                    additionalProperties: false,
                  },
                },
                recommendations: { type: "array", items: { type: "string" } },
              },
              required: ["completeness", "accuracy", "freshness", "consistency", "uniqueness", "validity", "overallScore", "issues", "recommendations"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0].message.content;
      return typeof content === "string" ? JSON.parse(content) : content;
    }),
});

// ── Quality Scores ─────────────────────────────────────────────────────────────
export const dmQualityRouter = router({
  listForAsset: publicProcedure
    .input(z.object({ assetId: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db.select().from(dmQualityScores)
        .where(eqOp(dmQualityScores.assetId, input.assetId))
        .orderBy(desc(dmQualityScores.createdAt));
    }),

  upsert: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      assetId: z.number(),
      completeness: z.number().min(0).max(100).optional(),
      accuracy: z.number().min(0).max(100).optional(),
      freshness: z.number().min(0).max(100).optional(),
      consistency: z.number().min(0).max(100).optional(),
      uniqueness: z.number().min(0).max(100).optional(),
      validity: z.number().min(0).max(100).optional(),
      issues: z.string().optional(),
      recommendations: z.string().optional(),
      assessedBy: z.enum(["manual", "ai", "automated"]).default("manual"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const { id, ...data } = input;
      // Compute overall score as weighted average of provided dimensions
      const dims = [data.completeness, data.accuracy, data.freshness, data.consistency, data.uniqueness, data.validity]
        .filter((v): v is number => v != null);
      const overallScore = dims.length > 0 ? Math.round(dims.reduce((a, b) => a + b, 0) / dims.length * 10) / 10 : undefined;
      const payload = { ...data, overallScore };

      if (id) {
        await db.update(dmQualityScores).set(payload).where(eqOp(dmQualityScores.id, id));
        // Update the asset's overall quality score
        if (overallScore !== undefined) {
          await db.update(dmDataAssets).set({ overallQuality: overallScore, lastValidated: new Date(), updatedAt: new Date() }).where(eqOp(dmDataAssets.id, data.assetId));
          // Fire data_quality_degraded trigger if score drops below 60
          if (overallScore < 60) {
            dispatchTrigger("data_quality_degraded", id).catch(() => {});
          }
        }
        return { id };
      }
      const [result] = await db.insert(dmQualityScores).values(payload);
      const newId = (result as any).insertId as number;
      if (overallScore !== undefined) {
        await db.update(dmDataAssets).set({ overallQuality: overallScore, lastValidated: new Date(), updatedAt: new Date() }).where(eqOp(dmDataAssets.id, data.assetId));
        // Fire data_quality_degraded trigger if score drops below 60
        if (overallScore < 60) {
          dispatchTrigger("data_quality_degraded", newId).catch(() => {});
        }
      }
      return { id: newId };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(dmQualityScores).where(eqOp(dmQualityScores.id, input.id));
      return { success: true };
    }),
});

// ── AI Pipelines ───────────────────────────────────────────────────────────────
export const dmPipelinesRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const rows = await db.select().from(dmAiPipelines).orderBy(desc(dmAiPipelines.updatedAt));
      return rows.filter(r =>
        (!input.ventureId || r.ventureId === input.ventureId) &&
        (!input.status || r.status === input.status)
      );
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const [row] = await db.select().from(dmAiPipelines).where(eqOp(dmAiPipelines.id, input.id));
      return row ?? null;
    }),

  upsert: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      name: z.string().min(1),
      description: z.string().optional(),
      pipelineType: z.enum(["classification", "extraction", "generation", "summarisation", "embedding", "scoring", "routing"]).default("generation"),
      model: z.string().optional(),
      promptTemplate: z.string().optional(),
      systemPrompt: z.string().optional(),
      inputSchema: z.string().optional(),
      outputSchema: z.string().optional(),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().optional(),
      topP: z.number().min(0).max(1).optional(),
      linkedAssetIds: z.string().optional(),
      linkedModule: z.string().optional(),
      status: z.enum(["draft", "active", "paused", "deprecated", "error"]).default("draft"),
      version: z.string().optional(),
      tags: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const { id, ...data } = input;
      if (id) {
        await db.update(dmAiPipelines).set({ ...data, updatedAt: new Date() }).where(eqOp(dmAiPipelines.id, id));
        return { id };
      }
      const [result] = await db.insert(dmAiPipelines).values(data);
      return { id: (result as any).insertId as number };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(dmAiPipelines).where(eqOp(dmAiPipelines.id, input.id));
      return { success: true };
    }),

  // Record a pipeline run
  recordRun: publicProcedure
    .input(z.object({
      pipelineId: z.number(),
      ventureId: z.string().optional(),
      status: z.enum(["running", "success", "failed", "cancelled", "timeout"]).default("success"),
      inputPayload: z.string().optional(),
      outputPayload: z.string().optional(),
      tokensUsed: z.number().optional(),
      latencyMs: z.number().optional(),
      costUsd: z.number().optional(),
      errorMessage: z.string().optional(),
      triggeredBy: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(dmPipelineRuns).values({
        ...input,
        completedAt: new Date(),
      });
      const runId = (result as any).insertId as number;
      // Update pipeline stats
      const runs = await db.select().from(dmPipelineRuns).where(eqOp(dmPipelineRuns.pipelineId, input.pipelineId));
      const successRuns = runs.filter(r => r.status === "success");
      const successRate = runs.length > 0 ? (successRuns.length / runs.length) * 100 : 0;
      const avgLatency = successRuns.length > 0 ? Math.round(successRuns.reduce((a, r) => a + (r.latencyMs ?? 0), 0) / successRuns.length) : undefined;
      const avgTokens = successRuns.length > 0 ? Math.round(successRuns.reduce((a, r) => a + (r.tokensUsed ?? 0), 0) / successRuns.length) : undefined;
      await db.update(dmAiPipelines).set({
        totalRuns: runs.length,
        successRate: Math.round(successRate * 10) / 10,
        avgLatencyMs: avgLatency,
        avgTokensUsed: avgTokens,
        updatedAt: new Date(),
      }).where(eqOp(dmAiPipelines.id, input.pipelineId));
      return { id: runId };
    }),

  listRuns: publicProcedure
    .input(z.object({ pipelineId: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db.select().from(dmPipelineRuns)
        .where(eqOp(dmPipelineRuns.pipelineId, input.pipelineId))
        .orderBy(desc(dmPipelineRuns.startedAt))
        .limit(50);
    }),

  // AI-assisted prompt template generation
  generatePromptTemplate: publicProcedure
    .input(z.object({
      pipelineType: z.string(),
      targetTask: z.string(),
      inputDescription: z.string(),
      outputDescription: z.string(),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are an expert prompt engineer. Generate a production-quality prompt template for the described AI pipeline. Return JSON: { systemPrompt: string, promptTemplate: string, inputSchema: string, outputSchema: string }. The promptTemplate should use {{variable}} placeholders for dynamic inputs.",
          },
          {
            role: "user",
            content: `Pipeline type: ${input.pipelineType}\nTask: ${input.targetTask}\nInput: ${input.inputDescription}\nExpected output: ${input.outputDescription}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "prompt_template",
            strict: true,
            schema: {
              type: "object",
              properties: {
                systemPrompt: { type: "string" },
                promptTemplate: { type: "string" },
                inputSchema: { type: "string" },
                outputSchema: { type: "string" },
              },
              required: ["systemPrompt", "promptTemplate", "inputSchema", "outputSchema"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0].message.content;
      return typeof content === "string" ? JSON.parse(content) : content;
    }),
});

// ── RAG Pipelines ──────────────────────────────────────────────────────────────
export const dmRagRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const rows = await db.select().from(dmRagPipelines).orderBy(desc(dmRagPipelines.updatedAt));
      return rows.filter(r => !input.ventureId || r.ventureId === input.ventureId);
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const [row] = await db.select().from(dmRagPipelines).where(eqOp(dmRagPipelines.id, input.id));
      return row ?? null;
    }),

  upsert: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      name: z.string().min(1),
      description: z.string().optional(),
      embeddingModel: z.string().default("text-embedding-3-small"),
      chunkSize: z.number().default(512),
      chunkOverlap: z.number().default(64),
      retrievalStrategy: z.enum(["similarity", "mmr", "hybrid", "keyword", "rerank"]).default("similarity"),
      topK: z.number().default(5),
      similarityThreshold: z.number().min(0).max(1).optional(),
      systemPrompt: z.string().optional(),
      contextTemplate: z.string().optional(),
      rerankModel: z.string().optional(),
      linkedAssetIds: z.string().optional(),
      status: z.enum(["draft", "indexing", "ready", "error", "stale"]).default("draft"),
      tags: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const { id, ...data } = input;
      if (id) {
        await db.update(dmRagPipelines).set({ ...data, updatedAt: new Date() }).where(eqOp(dmRagPipelines.id, id));
        return { id };
      }
      const [result] = await db.insert(dmRagPipelines).values(data);
      return { id: (result as any).insertId as number };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(dmRagPipelines).where(eqOp(dmRagPipelines.id, input.id));
      return { success: true };
    }),

  // Documents within a RAG pipeline
  listDocuments: publicProcedure
    .input(z.object({ ragPipelineId: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db.select().from(dmRagDocuments)
        .where(eqOp(dmRagDocuments.ragPipelineId, input.ragPipelineId))
        .orderBy(desc(dmRagDocuments.createdAt));
    }),

  addDocument: publicProcedure
    .input(z.object({
      ragPipelineId: z.number(),
      assetId: z.number().optional(),
      title: z.string().min(1),
      contentType: z.enum(["text", "pdf", "docx", "url", "code"]).default("text"),
      storageUrl: z.string().optional(),
      storageKey: z.string().optional(),
      sizeKb: z.number().optional(),
      metadata: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(dmRagDocuments).values({ ...input, status: "pending" });
      const newId = (result as any).insertId as number;
      // Update document count on the pipeline
      const docs = await db.select().from(dmRagDocuments).where(eqOp(dmRagDocuments.ragPipelineId, input.ragPipelineId));
      await db.update(dmRagPipelines).set({ documentCount: docs.length, updatedAt: new Date() }).where(eqOp(dmRagPipelines.id, input.ragPipelineId));
      return { id: newId };
    }),

  removeDocument: publicProcedure
    .input(z.object({ id: z.number(), ragPipelineId: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(dmRagDocuments).where(eqOp(dmRagDocuments.id, input.id));
      const docs = await db.select().from(dmRagDocuments).where(eqOp(dmRagDocuments.ragPipelineId, input.ragPipelineId));
      await db.update(dmRagPipelines).set({ documentCount: docs.length, updatedAt: new Date() }).where(eqOp(dmRagPipelines.id, input.ragPipelineId));
      return { success: true };
    }),

  markDocumentIndexed: publicProcedure
    .input(z.object({ id: z.number(), chunkCount: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.update(dmRagDocuments).set({ status: "indexed", chunkCount: input.chunkCount, indexedAt: new Date() }).where(eqOp(dmRagDocuments.id, input.id));
      return { success: true };
    }),

  // AI-assisted context template generation
  generateContextTemplate: publicProcedure
    .input(z.object({
      pipelineName: z.string(),
      retrievalStrategy: z.string(),
      topK: z.number(),
      useCase: z.string(),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a RAG system architect. Generate an optimal context injection template for the described RAG pipeline. Return JSON: { contextTemplate: string, systemPrompt: string, notes: string }. The contextTemplate should show how retrieved documents are formatted and injected into the prompt.",
          },
          {
            role: "user",
            content: `Pipeline: ${input.pipelineName}\nRetrieval: ${input.retrievalStrategy} top-${input.topK}\nUse case: ${input.useCase}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "context_template",
            strict: true,
            schema: {
              type: "object",
              properties: {
                contextTemplate: { type: "string" },
                systemPrompt: { type: "string" },
                notes: { type: "string" },
              },
              required: ["contextTemplate", "systemPrompt", "notes"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0].message.content;
      return typeof content === "string" ? JSON.parse(content) : content;
    }),
});

// ── Fine-Tuning ────────────────────────────────────────────────────────────────
export const dmFineTuningRouter = router({
  // Datasets
  listDatasets: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const rows = await db.select().from(dmFineTuningDatasets).orderBy(desc(dmFineTuningDatasets.updatedAt));
      return rows.filter(r => !input.ventureId || r.ventureId === input.ventureId);
    }),

  upsertDataset: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      name: z.string().min(1),
      description: z.string().optional(),
      taskType: z.string().optional(),
      totalSamples: z.number().default(0),
      labelledSamples: z.number().default(0),
      trainSplit: z.number().min(0).max(1).default(0.8),
      valSplit: z.number().min(0).max(1).default(0.1),
      testSplit: z.number().min(0).max(1).default(0.1),
      storageUrl: z.string().optional(),
      storageKey: z.string().optional(),
      format: z.enum(["jsonl", "csv", "parquet"]).default("jsonl"),
      linkedAssetIds: z.string().optional(),
      status: z.enum(["draft", "labelling", "ready", "archived"]).default("draft"),
      qualityScore: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const { id, ...data } = input;
      if (id) {
        await db.update(dmFineTuningDatasets).set({ ...data, updatedAt: new Date() }).where(eqOp(dmFineTuningDatasets.id, id));
        return { id };
      }
      const [result] = await db.insert(dmFineTuningDatasets).values(data);
      return { id: (result as any).insertId as number };
    }),

  deleteDataset: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(dmFineTuningDatasets).where(eqOp(dmFineTuningDatasets.id, input.id));
      return { success: true };
    }),

  // Jobs
  listJobs: publicProcedure
    .input(z.object({ ventureId: z.string().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const rows = await db.select().from(dmFineTuningJobs).orderBy(desc(dmFineTuningJobs.updatedAt));
      return rows.filter(r =>
        (!input.ventureId || r.ventureId === input.ventureId) &&
        (!input.status || r.status === input.status)
      );
    }),

  upsertJob: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      name: z.string().min(1),
      description: z.string().optional(),
      baseModel: z.string().min(1),
      targetTask: z.string().optional(),
      datasetId: z.number().optional(),
      trainingSamples: z.number().optional(),
      validationSamples: z.number().optional(),
      epochs: z.number().optional(),
      learningRate: z.number().optional(),
      batchSize: z.number().optional(),
      trainLoss: z.number().optional(),
      valLoss: z.number().optional(),
      accuracy: z.number().optional(),
      fineTunedModelId: z.string().optional(),
      status: z.enum(["draft", "preparing", "training", "evaluating", "completed", "failed", "cancelled"]).default("draft"),
      estimatedCostUsd: z.number().optional(),
      actualCostUsd: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const { id, ...data } = input;
      if (id) {
        await db.update(dmFineTuningJobs).set({ ...data, updatedAt: new Date() }).where(eqOp(dmFineTuningJobs.id, id));
        return { id };
      }
      const [result] = await db.insert(dmFineTuningJobs).values(data);
      return { id: (result as any).insertId as number };
    }),

  deleteJob: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(dmFineTuningJobs).where(eqOp(dmFineTuningJobs.id, input.id));
      return { success: true };
    }),
});

// ── Feedback Loops ─────────────────────────────────────────────────────────────
export const dmFeedbackRouter = router({
  list: publicProcedure
    .input(z.object({
      ventureId: z.string().optional(),
      pipelineId: z.number().optional(),
      status: z.string().optional(),
      feedbackType: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const rows = await db.select().from(dmFeedbackEntries).orderBy(desc(dmFeedbackEntries.createdAt));
      return rows.filter(r =>
        (!input.ventureId || r.ventureId === input.ventureId) &&
        (!input.pipelineId || r.pipelineId === input.pipelineId) &&
        (!input.status || r.status === input.status) &&
        (!input.feedbackType || r.feedbackType === input.feedbackType)
      );
    }),

  submit: publicProcedure
    .input(z.object({
      pipelineId: z.number().optional(),
      runId: z.number().optional(),
      ragPipelineId: z.number().optional(),
      ventureId: z.string().optional(),
      feedbackType: z.enum(["thumbs_up", "thumbs_down", "rating", "correction", "flag"]).default("rating"),
      rating: z.number().min(1).max(5).optional(),
      thumbs: z.enum(["up", "down"]).optional(),
      originalOutput: z.string().optional(),
      correctedOutput: z.string().optional(),
      comment: z.string().optional(),
      inputContext: z.string().optional(),
      issueCategory: z.string().optional(),
      submittedBy: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(dmFeedbackEntries).values({ ...input, status: "open" });
      return { id: (result as any).insertId as number };
    }),

  review: publicProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["open", "reviewed", "actioned", "dismissed"]),
      improvementAction: z.string().optional(),
      reviewedBy: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.update(dmFeedbackEntries).set({
        status: input.status,
        improvementAction: input.improvementAction,
        reviewedBy: input.reviewedBy,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      }).where(eqOp(dmFeedbackEntries.id, input.id));
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(dmFeedbackEntries).where(eqOp(dmFeedbackEntries.id, input.id));
      return { success: true };
    }),

  // AI-assisted improvement suggestion based on feedback patterns
  generateImprovementPlan: publicProcedure
    .input(z.object({
      pipelineId: z.number(),
      pipelineName: z.string(),
      feedbackSummary: z.string(),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are an AI systems improvement expert. Based on user feedback patterns, generate a concrete improvement plan. Return JSON: { rootCauses: string[], immediateActions: string[], promptImprovements: string[], dataImprovements: string[], estimatedImpact: string }",
          },
          {
            role: "user",
            content: `Pipeline: ${input.pipelineName}\nFeedback summary:\n${input.feedbackSummary}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "improvement_plan",
            strict: true,
            schema: {
              type: "object",
              properties: {
                rootCauses: { type: "array", items: { type: "string" } },
                immediateActions: { type: "array", items: { type: "string" } },
                promptImprovements: { type: "array", items: { type: "string" } },
                dataImprovements: { type: "array", items: { type: "string" } },
                estimatedImpact: { type: "string" },
              },
              required: ["rootCauses", "immediateActions", "promptImprovements", "dataImprovements", "estimatedImpact"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0].message.content;
      return typeof content === "string" ? JSON.parse(content) : content;
    }),
});

// ── Summary / Overview ─────────────────────────────────────────────────────────
export const dmSummaryRouter = router({
  overview: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const [assets, pipelines, ragPipelines, fineTuningJobs, feedback] = await Promise.all([
        db.select().from(dmDataAssets),
        db.select().from(dmAiPipelines),
        db.select().from(dmRagPipelines),
        db.select().from(dmFineTuningJobs),
        db.select().from(dmFeedbackEntries),
      ]);

      const filteredAssets = assets.filter(a => !input.ventureId || a.ventureId === input.ventureId);
      const filteredPipelines = pipelines.filter(p => !input.ventureId || p.ventureId === input.ventureId);
      const filteredRag = ragPipelines.filter(r => !input.ventureId || r.ventureId === input.ventureId);
      const filteredJobs = fineTuningJobs.filter(j => !input.ventureId || j.ventureId === input.ventureId);
      const filteredFeedback = feedback.filter(f => !input.ventureId || f.ventureId === input.ventureId);

      const avgQuality = filteredAssets.length > 0
        ? Math.round(filteredAssets.reduce((a, r) => a + (r.overallQuality ?? 0), 0) / filteredAssets.length * 10) / 10
        : 0;

      const activePipelines = filteredPipelines.filter(p => p.status === "active").length;
      const readyRag = filteredRag.filter(r => r.status === "ready").length;
      const openFeedback = filteredFeedback.filter(f => f.status === "open").length;
      const positiveFeedback = filteredFeedback.filter(f => f.thumbs === "up" || (f.rating ?? 0) >= 4).length;
      const feedbackSatisfaction = filteredFeedback.length > 0
        ? Math.round((positiveFeedback / filteredFeedback.length) * 100)
        : 0;

      const assetsByType = filteredAssets.reduce((acc, a) => {
        acc[a.assetType] = (acc[a.assetType] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const assetsByStatus = filteredAssets.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalAssets: filteredAssets.length,
        avgDataQuality: avgQuality,
        activePipelines,
        totalPipelines: filteredPipelines.length,
        readyRagPipelines: readyRag,
        totalRagPipelines: filteredRag.length,
        activeFineTuningJobs: filteredJobs.filter(j => j.status === "training" || j.status === "evaluating").length,
        completedFineTuningJobs: filteredJobs.filter(j => j.status === "completed").length,
        openFeedback,
        feedbackSatisfaction,
        totalFeedback: filteredFeedback.length,
        assetsByType,
        assetsByStatus,
        totalRuns: filteredPipelines.reduce((a, p) => a + (p.totalRuns ?? 0), 0),
        totalDocuments: filteredRag.reduce((a, r) => a + (r.documentCount ?? 0), 0),
      };
    }),
});
