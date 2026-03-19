
// ── Data Management Module ─────────────────────────────────────────────────────
// Section 8: Data ingestion, validation, quality scoring, AI integration
// Section 9: RAG pipelines, fine-tuning, context engineering, feedback loops

// ── Data Assets ───────────────────────────────────────────────────────────────
// Central catalogue of all data assets used across the platform.
// assetType: structured | unstructured | semi_structured | time_series | media
// sourceType: manual_upload | api_feed | database_export | web_scrape | sensor | survey | interview
// format: csv | json | xlsx | pdf | docx | mp3 | mp4 | image | parquet | other
// status: draft | ingested | validated | published | archived | error
export const dmDataAssets = mysqlTable("dmDataAssets", {
  id:             int("id").primaryKey().autoincrement(),
  ventureId:      varchar("ventureId", { length: 64 }),
  name:           varchar("name", { length: 255 }).notNull(),
  description:    text("description"),
  assetType:      varchar("assetType", { length: 32 }).notNull().default("structured"),
  sourceType:     varchar("sourceType", { length: 32 }).notNull().default("manual_upload"),
  format:         varchar("format", { length: 32 }).notNull().default("csv"),
  sizeKb:         int("sizeKb"),
  rowCount:       int("rowCount"),
  columnCount:    int("columnCount"),
  storageUrl:     text("storageUrl"),
  storageKey:     varchar("storageKey", { length: 512 }),
  tags:           text("tags"),                // JSON array of strings
  schema:         text("schema"),              // JSON describing columns/fields
  sampleData:     text("sampleData"),          // JSON preview rows
  status:         varchar("status", { length: 32 }).notNull().default("draft"),
  linkedModule:   varchar("linkedModule", { length: 64 }),  // e.g. "universityPlaybook", "chinaManufacturing"
  linkedRecordId: int("linkedRecordId"),
  overallQuality: float("overallQuality"),     // 0-100 computed score
  lastValidated:  timestamp("lastValidated"),
  ingestedBy:     varchar("ingestedBy", { length: 128 }),
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DmDataAsset = typeof dmDataAssets.$inferSelect;
export type InsertDmDataAsset = typeof dmDataAssets.$inferInsert;

// ── Quality Scores ─────────────────────────────────────────────────────────────
// Per-asset quality dimension scores and issue flags.
// Each row is one quality assessment snapshot for one asset.
export const dmQualityScores = mysqlTable("dmQualityScores", {
  id:               int("id").primaryKey().autoincrement(),
  assetId:          int("assetId").notNull(),
  completeness:     float("completeness"),     // 0-100: % non-null fields
  accuracy:         float("accuracy"),         // 0-100: validated against rules
  freshness:        float("freshness"),        // 0-100: recency score
  consistency:      float("consistency"),      // 0-100: cross-field consistency
  uniqueness:       float("uniqueness"),       // 0-100: deduplication score
  validity:         float("validity"),         // 0-100: format/type conformance
  overallScore:     float("overallScore"),     // weighted average
  issues:           text("issues"),            // JSON array of issue objects {field, type, count, severity}
  recommendations:  text("recommendations"),  // JSON array of fix suggestions
  assessedBy:       varchar("assessedBy", { length: 32 }).notNull().default("manual"), // manual | ai | automated
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type DmQualityScore = typeof dmQualityScores.$inferSelect;
export type InsertDmQualityScore = typeof dmQualityScores.$inferInsert;

// ── AI Pipelines ───────────────────────────────────────────────────────────────
// Configuration and metadata for AI processing pipelines.
// pipelineType: classification | extraction | generation | summarisation | embedding | scoring | routing
// status: draft | active | paused | deprecated | error
export const dmAiPipelines = mysqlTable("dmAiPipelines", {
  id:               int("id").primaryKey().autoincrement(),
  ventureId:        varchar("ventureId", { length: 64 }),
  name:             varchar("name", { length: 255 }).notNull(),
  description:      text("description"),
  pipelineType:     varchar("pipelineType", { length: 32 }).notNull().default("generation"),
  model:            varchar("model", { length: 128 }),
  promptTemplate:   text("promptTemplate"),
  systemPrompt:     text("systemPrompt"),
  inputSchema:      text("inputSchema"),       // JSON schema for expected inputs
  outputSchema:     text("outputSchema"),      // JSON schema for expected outputs
  temperature:      float("temperature"),
  maxTokens:        int("maxTokens"),
  topP:             float("topP"),
  linkedAssetIds:   text("linkedAssetIds"),    // JSON array of dmDataAssets.id
  linkedModule:     varchar("linkedModule", { length: 64 }),
  status:           varchar("status", { length: 32 }).notNull().default("draft"),
  totalRuns:        int("totalRuns").notNull().default(0),
  successRate:      float("successRate"),
  avgLatencyMs:     int("avgLatencyMs"),
  avgTokensUsed:    int("avgTokensUsed"),
  estimatedCostUsd: float("estimatedCostUsd"),
  version:          varchar("version", { length: 32 }).notNull().default("1.0"),
  tags:             text("tags"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DmAiPipeline = typeof dmAiPipelines.$inferSelect;
export type InsertDmAiPipeline = typeof dmAiPipelines.$inferInsert;

// ── Pipeline Runs ──────────────────────────────────────────────────────────────
// Immutable run history for each AI pipeline execution.
// status: running | success | failed | cancelled | timeout
export const dmPipelineRuns = mysqlTable("dmPipelineRuns", {
  id:             int("id").primaryKey().autoincrement(),
  pipelineId:     int("pipelineId").notNull(),
  ventureId:      varchar("ventureId", { length: 64 }),
  status:         varchar("status", { length: 16 }).notNull().default("running"),
  inputPayload:   text("inputPayload"),        // JSON
  outputPayload:  text("outputPayload"),       // JSON
  tokensUsed:     int("tokensUsed"),
  latencyMs:      int("latencyMs"),
  costUsd:        float("costUsd"),
  errorMessage:   text("errorMessage"),
  triggeredBy:    varchar("triggeredBy", { length: 64 }), // user | workflow | schedule | api
  triggeredById:  varchar("triggeredById", { length: 128 }),
  startedAt:      timestamp("startedAt").defaultNow().notNull(),
  completedAt:    timestamp("completedAt"),
});
export type DmPipelineRun = typeof dmPipelineRuns.$inferSelect;
export type InsertDmPipelineRun = typeof dmPipelineRuns.$inferInsert;

// ── RAG Pipelines ──────────────────────────────────────────────────────────────
// Retrieval-Augmented Generation pipeline configurations.
// retrievalStrategy: similarity | mmr | hybrid | keyword | rerank
// embeddingModel: text-embedding-3-small | text-embedding-3-large | ada-002
// status: draft | indexing | ready | error | stale
export const dmRagPipelines = mysqlTable("dmRagPipelines", {
  id:                 int("id").primaryKey().autoincrement(),
  ventureId:          varchar("ventureId", { length: 64 }),
  name:               varchar("name", { length: 255 }).notNull(),
  description:        text("description"),
  embeddingModel:     varchar("embeddingModel", { length: 128 }).notNull().default("text-embedding-3-small"),
  chunkSize:          int("chunkSize").notNull().default(512),
  chunkOverlap:       int("chunkOverlap").notNull().default(64),
  retrievalStrategy:  varchar("retrievalStrategy", { length: 32 }).notNull().default("similarity"),
  topK:               int("topK").notNull().default(5),
  similarityThreshold: float("similarityThreshold").default(0.7),
  systemPrompt:       text("systemPrompt"),
  contextTemplate:    text("contextTemplate"),  // How retrieved docs are injected into prompt
  rerankModel:        varchar("rerankModel", { length: 128 }),
  linkedAssetIds:     text("linkedAssetIds"),   // JSON array of dmDataAssets.id
  documentCount:      int("documentCount").notNull().default(0),
  chunkCount:         int("chunkCount").notNull().default(0),
  status:             varchar("status", { length: 16 }).notNull().default("draft"),
  lastIndexedAt:      timestamp("lastIndexedAt"),
  avgRetrievalMs:     int("avgRetrievalMs"),
  totalQueries:       int("totalQueries").notNull().default(0),
  avgRelevanceScore:  float("avgRelevanceScore"),
  tags:               text("tags"),
  notes:              text("notes"),
  createdAt:          timestamp("createdAt").defaultNow().notNull(),
  updatedAt:          timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DmRagPipeline = typeof dmRagPipelines.$inferSelect;
export type InsertDmRagPipeline = typeof dmRagPipelines.$inferInsert;

// ── RAG Documents ──────────────────────────────────────────────────────────────
// Individual documents registered in a RAG pipeline's document store.
// status: pending | indexed | failed | excluded
export const dmRagDocuments = mysqlTable("dmRagDocuments", {
  id:           int("id").primaryKey().autoincrement(),
  ragPipelineId: int("ragPipelineId").notNull(),
  assetId:      int("assetId"),               // optional link to dmDataAssets
  title:        varchar("title", { length: 255 }).notNull(),
  contentType:  varchar("contentType", { length: 32 }).notNull().default("text"), // text | pdf | docx | url | code
  storageUrl:   text("storageUrl"),
  storageKey:   varchar("storageKey", { length: 512 }),
  chunkCount:   int("chunkCount").notNull().default(0),
  sizeKb:       int("sizeKb"),
  status:       varchar("status", { length: 16 }).notNull().default("pending"),
  indexedAt:    timestamp("indexedAt"),
  metadata:     text("metadata"),             // JSON: author, date, source, tags
  notes:        text("notes"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type DmRagDocument = typeof dmRagDocuments.$inferSelect;
export type InsertDmRagDocument = typeof dmRagDocuments.$inferInsert;

// ── Fine-Tuning Jobs ───────────────────────────────────────────────────────────
// Tracks fine-tuning job lifecycle from dataset prep to model deployment.
// status: draft | preparing | training | evaluating | completed | failed | cancelled
export const dmFineTuningJobs = mysqlTable("dmFineTuningJobs", {
  id:               int("id").primaryKey().autoincrement(),
  ventureId:        varchar("ventureId", { length: 64 }),
  name:             varchar("name", { length: 255 }).notNull(),
  description:      text("description"),
  baseModel:        varchar("baseModel", { length: 128 }).notNull(),
  targetTask:       varchar("targetTask", { length: 128 }),  // e.g. "interview summarisation"
  datasetId:        int("datasetId"),
  trainingSamples:  int("trainingSamples"),
  validationSamples: int("validationSamples"),
  epochs:           int("epochs"),
  learningRate:     float("learningRate"),
  batchSize:        int("batchSize"),
  trainLoss:        float("trainLoss"),
  valLoss:          float("valLoss"),
  accuracy:         float("accuracy"),
  fineTunedModelId: varchar("fineTunedModelId", { length: 255 }), // provider model ID
  status:           varchar("status", { length: 16 }).notNull().default("draft"),
  startedAt:        timestamp("startedAt"),
  completedAt:      timestamp("completedAt"),
  estimatedCostUsd: float("estimatedCostUsd"),
  actualCostUsd:    float("actualCostUsd"),
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DmFineTuningJob = typeof dmFineTuningJobs.$inferSelect;
export type InsertDmFineTuningJob = typeof dmFineTuningJobs.$inferInsert;

// ── Fine-Tuning Datasets ───────────────────────────────────────────────────────
// Training data collections used for fine-tuning jobs.
// splitType: train_only | train_val | train_val_test
// status: draft | labelling | ready | archived
export const dmFineTuningDatasets = mysqlTable("dmFineTuningDatasets", {
  id:             int("id").primaryKey().autoincrement(),
  ventureId:      varchar("ventureId", { length: 64 }),
  name:           varchar("name", { length: 255 }).notNull(),
  description:    text("description"),
  taskType:       varchar("taskType", { length: 64 }),  // classification | generation | summarisation | extraction
  totalSamples:   int("totalSamples").notNull().default(0),
  labelledSamples: int("labelledSamples").notNull().default(0),
  trainSplit:     float("trainSplit").notNull().default(0.8),
  valSplit:       float("valSplit").notNull().default(0.1),
  testSplit:      float("testSplit").notNull().default(0.1),
  storageUrl:     text("storageUrl"),
  storageKey:     varchar("storageKey", { length: 512 }),
  format:         varchar("format", { length: 32 }).notNull().default("jsonl"), // jsonl | csv | parquet
  linkedAssetIds: text("linkedAssetIds"),
  status:         varchar("status", { length: 16 }).notNull().default("draft"),
  qualityScore:   float("qualityScore"),
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DmFineTuningDataset = typeof dmFineTuningDatasets.$inferSelect;
export type InsertDmFineTuningDataset = typeof dmFineTuningDatasets.$inferInsert;

// ── Feedback Entries ───────────────────────────────────────────────────────────
// User feedback on AI-generated outputs — powers the feedback loop for model improvement.
// feedbackType: thumbs_up | thumbs_down | rating | correction | flag
// status: open | reviewed | actioned | dismissed
export const dmFeedbackEntries = mysqlTable("dmFeedbackEntries", {
  id:               int("id").primaryKey().autoincrement(),
  pipelineId:       int("pipelineId"),         // optional link to dmAiPipelines
  runId:            int("runId"),              // optional link to dmPipelineRuns
  ragPipelineId:    int("ragPipelineId"),      // optional link to dmRagPipelines
  ventureId:        varchar("ventureId", { length: 64 }),
  feedbackType:     varchar("feedbackType", { length: 32 }).notNull().default("rating"),
  rating:           int("rating"),             // 1-5 stars
  thumbs:           varchar("thumbs", { length: 8 }),  // up | down
  originalOutput:   text("originalOutput"),    // The AI output being rated
  correctedOutput:  text("correctedOutput"),   // User's corrected version
  comment:          text("comment"),
  inputContext:     text("inputContext"),       // What was the input that produced this output
  issueCategory:    varchar("issueCategory", { length: 64 }), // factual_error | tone | format | missing_info | hallucination | other
  improvementAction: text("improvementAction"), // What was done to fix it
  status:           varchar("status", { length: 16 }).notNull().default("open"),
  submittedBy:      varchar("submittedBy", { length: 128 }),
  reviewedBy:       varchar("reviewedBy", { length: 128 }),
  reviewedAt:       timestamp("reviewedAt"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DmFeedbackEntry = typeof dmFeedbackEntries.$inferSelect;
export type InsertDmFeedbackEntry = typeof dmFeedbackEntries.$inferInsert;
