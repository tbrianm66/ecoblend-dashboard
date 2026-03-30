/**
 * Playbook Module Router — Sprint 70
 * Sub-routers: playbooks (CRUD), steps, runs (execution engine), kpis, assets, ai
 * Spec: EcoBlend Architecture Briefs Section 10 — 5 strategic playbooks PB-01 to PB-05
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, asc } from "drizzle-orm";
import {
  pbPlaybooks,
  pbSteps,
  pbRuns,
  pbRunSteps,
  pbKpiEntries,
  pbLinkedAssets,
} from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";

// ─── Seed data: 5 canonical playbooks with 2 variants each ───────────────────
const CANONICAL_PLAYBOOKS = [
  {
    playbookId: "PB-01-v1",
    title: "Avoid the Catch-22 — Baseline",
    subFolder: "avoid_catch22" as const,
    version: "1.0.0",
    ownerRole: "Data Quality Lead",
    strategicPrinciple:
      "Improve data quality through active usage, not by waiting for perfect data before enabling use. Break the Catch-22 by instrumenting usage and feeding signals back as quality improvements.",
    triggerConditions: JSON.stringify([
      "DQS below 60 for any Silver Zone asset",
      "Consumer adoption rate stagnant for 30+ days",
      "New data domain onboarding initiated",
    ]),
    kpis: JSON.stringify([
      "Average DQS improves by 10+ points per sprint cycle",
      "Consumer adoption rate increases month-over-month",
      "Issue resolution time decreases as stewardship matures",
    ]),
    status: "active" as const,
    steps: [
      { stepNumber: 1, title: "Baseline Audit", action: "Profile all data assets. Record DQS, null rates, schema version.", assigneeRole: "Data Steward", slaDays: 5, outputArtifact: "Baseline Audit Report" },
      { stepNumber: 2, title: "Activate Consumers", action: "Enable low-risk analytics consumers on Silver Zone data with quality scores exposed.", assigneeRole: "Domain Owner", slaDays: 3, outputArtifact: "Consumer Activation Log" },
      { stepNumber: 3, title: "Instrument Feedback", action: "Collect consumer feedback signals: query errors, null collisions, stale data reports.", assigneeRole: "Data Engineer", slaDays: 7, outputArtifact: "Feedback Signal Dashboard" },
      { stepNumber: 4, title: "Quality Sprint", action: "Run 2-week quality sprints targeting issues raised by active consumers.", assigneeRole: "Data Quality Lead", slaDays: 14, outputArtifact: "Sprint Retrospective" },
      { stepNumber: 5, title: "Re-Score & Promote", action: "Re-score assets, promote qualifying assets to Gold Zone.", assigneeRole: "Data Steward", slaDays: 3, outputArtifact: "Promotion Certificates" },
      { stepNumber: 6, title: "Expand Access", action: "Gradually expand consumer base as quality improves, maintaining feedback instrumentation.", assigneeRole: "Domain Owner", slaDays: 7, outputArtifact: "Access Expansion Report" },
    ],
  },
  {
    playbookId: "PB-01-v2",
    title: "Avoid the Catch-22 — Incremental Improvement",
    subFolder: "avoid_catch22" as const,
    version: "1.0.0",
    ownerRole: "Data Quality Lead",
    strategicPrinciple:
      "Incremental improvement mode: apply micro-sprints of 1 week instead of 2-week cycles, enabling faster iteration and lower risk per improvement cycle.",
    triggerConditions: JSON.stringify([
      "Team capacity limited to part-time stewardship",
      "Asset count below 20 in domain",
      "Pilot programme or early-stage venture",
    ]),
    kpis: JSON.stringify([
      "DQS improves by 5+ points per 1-week micro-sprint",
      "At least 1 asset promoted per month",
      "Consumer feedback response time under 48 hours",
    ]),
    status: "active" as const,
    steps: [
      { stepNumber: 1, title: "Quick Audit", action: "Profile top 5 highest-priority data assets. Record DQS and top 3 issues each.", assigneeRole: "Data Steward", slaDays: 2, outputArtifact: "Quick Audit Summary" },
      { stepNumber: 2, title: "Micro-Sprint Planning", action: "Select 3 issues to fix this week. Assign owners and set daily check-ins.", assigneeRole: "Data Quality Lead", slaDays: 1, outputArtifact: "Sprint Backlog" },
      { stepNumber: 3, title: "Fix & Validate", action: "Implement fixes. Validate with automated DQS re-run.", assigneeRole: "Data Engineer", slaDays: 5, outputArtifact: "Fix Validation Report" },
      { stepNumber: 4, title: "Consumer Check-In", action: "Brief 1:1 with key consumer to validate improvement is felt.", assigneeRole: "Domain Owner", slaDays: 1, outputArtifact: "Consumer Feedback Note" },
      { stepNumber: 5, title: "Promote & Repeat", action: "Promote any assets crossing Gold threshold. Start next micro-sprint.", assigneeRole: "Data Steward", slaDays: 1, outputArtifact: "Promotion Log" },
    ],
  },
  {
    playbookId: "PB-02-v1",
    title: "Democratize Data Quality — Standard Stewardship Rollout",
    subFolder: "democratize_quality" as const,
    version: "1.0.0",
    ownerRole: "Chief Data Officer",
    strategicPrinciple:
      "Data quality cannot be owned solely by a central IT team. Establish distributed stewardship across every business domain, giving teams the tools and authority to own and improve their data.",
    triggerConditions: JSON.stringify([
      "Organisation has 3+ distinct data domains",
      "Central IT team is bottleneck for data quality issues",
      "New data governance initiative launched",
    ]),
    kpis: JSON.stringify([
      "100% of data assets have a named owner within 90 days",
      "Stewardship portal weekly active usage >80% of named stewards",
      "Issue resolution time <48 hours for P1 quality issues",
    ]),
    status: "active" as const,
    steps: [
      { stepNumber: 1, title: "Map Domains", action: "Identify all business data domains (Sales, Finance, Operations, Product, HR).", assigneeRole: "CDO", slaDays: 5, outputArtifact: "Domain Map" },
      { stepNumber: 2, title: "Assign Owners", action: "Nominate a Domain Owner and at least one Data Steward per domain.", assigneeRole: "CDO", slaDays: 7, outputArtifact: "Ownership Register" },
      { stepNumber: 3, title: "Provision Dashboards", action: "Enable Stewardship Portal for each domain, scoped to their assets.", assigneeRole: "Data Engineer", slaDays: 5, outputArtifact: "Portal Access Confirmation" },
      { stepNumber: 4, title: "Define SLAs", action: "Co-author data quality SLAs with each domain team (DQS floor, freshness SLA).", assigneeRole: "Domain Owner", slaDays: 10, outputArtifact: "SLA Agreement Documents" },
      { stepNumber: 5, title: "Train & Enable", action: "Run onboarding workshops, provide self-service tooling documentation.", assigneeRole: "Data Quality Lead", slaDays: 14, outputArtifact: "Training Completion Records" },
      { stepNumber: 6, title: "Review Cadence", action: "Establish monthly domain quality reviews with automated report delivery.", assigneeRole: "CDO", slaDays: 5, outputArtifact: "Review Calendar & Templates" },
    ],
  },
  {
    playbookId: "PB-02-v2",
    title: "Democratize Data Quality — Self-Service for Small Teams",
    subFolder: "democratize_quality" as const,
    version: "1.0.0",
    ownerRole: "Domain Owner",
    strategicPrinciple:
      "Self-service mode for small teams: a single Domain Owner can run the full stewardship cycle without a dedicated Data Steward, using automated tooling to compensate for reduced headcount.",
    triggerConditions: JSON.stringify([
      "Team size under 10 people",
      "Single data domain with under 30 assets",
      "No dedicated data engineering resource",
    ]),
    kpis: JSON.stringify([
      "Domain Owner completes weekly DQS review in under 30 minutes",
      "All P1 issues auto-assigned and resolved within 72 hours",
      "Self-service documentation satisfaction score >4/5",
    ]),
    status: "active" as const,
    steps: [
      { stepNumber: 1, title: "Self-Assessment", action: "Domain Owner completes 15-minute data quality self-assessment questionnaire.", assigneeRole: "Domain Owner", slaDays: 1, outputArtifact: "Self-Assessment Report" },
      { stepNumber: 2, title: "Asset Inventory", action: "List all data assets owned by the team. Tag with classification and zone.", assigneeRole: "Domain Owner", slaDays: 3, outputArtifact: "Asset Inventory" },
      { stepNumber: 3, title: "Enable Automations", action: "Turn on automated DQS monitoring, alert thresholds, and weekly digest emails.", assigneeRole: "Domain Owner", slaDays: 2, outputArtifact: "Automation Config" },
      { stepNumber: 4, title: "Set Personal SLAs", action: "Define personal response SLAs for P1/P2/P3 issues.", assigneeRole: "Domain Owner", slaDays: 1, outputArtifact: "Personal SLA Card" },
      { stepNumber: 5, title: "Monthly Review", action: "Run monthly 30-minute self-review using automated report. Escalate blockers.", assigneeRole: "Domain Owner", slaDays: 1, outputArtifact: "Monthly Review Note" },
    ],
  },
  {
    playbookId: "PB-03-v1",
    title: "Embed Across Operations — CRM/ERP Integration",
    subFolder: "embed_operations" as const,
    version: "1.0.0",
    ownerRole: "Integration Architect",
    strategicPrinciple:
      "Data quality checks must be invisible to the end user — embedded into the tools and workflows they already use, not added as a separate step.",
    triggerConditions: JSON.stringify([
      "CRM or ERP system identified as primary data entry point",
      "Quality violation rate at source above 15%",
      "New system integration being planned",
    ]),
    kpis: JSON.stringify([
      "95%+ of operational data flows have embedded quality checks within 6 months",
      "Quality violation rate at source reduces by 40% within 3 months of hard blocks",
      "Zero manual re-keying incidents for high-priority data assets",
    ]),
    status: "active" as const,
    steps: [
      { stepNumber: 1, title: "Workflow Audit", action: "Map all operational workflows that produce or consume data (CRM, ERP, BI, etc.).", assigneeRole: "Integration Architect", slaDays: 7, outputArtifact: "Workflow Map" },
      { stepNumber: 2, title: "Integration Points", action: "Identify pre-save, post-save, and export hooks in each system.", assigneeRole: "Data Engineer", slaDays: 5, outputArtifact: "Hook Inventory" },
      { stepNumber: 3, title: "Rule Deployment", action: "Deploy validation rules as inline checks at integration points via SDK.", assigneeRole: "Data Engineer", slaDays: 10, outputArtifact: "Rule Deployment Log" },
      { stepNumber: 4, title: "Soft Warnings", action: "Initial rollout: warn users of quality issues without blocking saves.", assigneeRole: "Integration Architect", slaDays: 14, outputArtifact: "Warning Rate Dashboard" },
      { stepNumber: 5, title: "Hard Blocks", action: "After 30-day baseline, enforce blocks on critical quality violations.", assigneeRole: "Integration Architect", slaDays: 30, outputArtifact: "Block Policy Document" },
      { stepNumber: 6, title: "Monitor Adoption", action: "Track rule trigger rates, bypass rates, and quality improvement correlation.", assigneeRole: "Data Quality Lead", slaDays: 30, outputArtifact: "Adoption Analytics Report" },
    ],
  },
  {
    playbookId: "PB-03-v2",
    title: "Embed Across Operations — BI & Analytics Pipeline",
    subFolder: "embed_operations" as const,
    version: "1.0.0",
    ownerRole: "Analytics Lead",
    strategicPrinciple:
      "BI and analytics pipeline embedding: quality gates are inserted at every transformation layer so that downstream reports and dashboards only surface validated, Gold-zone data.",
    triggerConditions: JSON.stringify([
      "BI platform identified as primary consumer of data assets",
      "Report accuracy complaints received from stakeholders",
      "New analytics pipeline being built",
    ]),
    kpis: JSON.stringify([
      "100% of BI reports sourced from Gold or Platinum zone assets",
      "Stale data incidents in dashboards reduced to zero within 60 days",
      "Pipeline quality gate pass rate >95% within 90 days",
    ]),
    status: "active" as const,
    steps: [
      { stepNumber: 1, title: "Pipeline Audit", action: "Map all BI/analytics pipelines and identify data sources for each report.", assigneeRole: "Analytics Lead", slaDays: 5, outputArtifact: "Pipeline Source Map" },
      { stepNumber: 2, title: "Quality Gate Design", action: "Define quality gate rules for each pipeline stage (ingestion, transform, publish).", assigneeRole: "Data Engineer", slaDays: 7, outputArtifact: "Quality Gate Spec" },
      { stepNumber: 3, title: "Gate Implementation", action: "Implement quality gates in pipeline code. Add DQS metadata to output datasets.", assigneeRole: "Data Engineer", slaDays: 10, outputArtifact: "Gate Implementation PR" },
      { stepNumber: 4, title: "Report Certification", action: "Certify each report as sourced from Gold+ data. Add quality badge to dashboards.", assigneeRole: "Analytics Lead", slaDays: 7, outputArtifact: "Report Certification Register" },
      { stepNumber: 5, title: "Freshness Monitoring", action: "Set up automated freshness alerts for all certified pipelines.", assigneeRole: "Data Engineer", slaDays: 3, outputArtifact: "Freshness Alert Config" },
    ],
  },
  {
    playbookId: "PB-04-v1",
    title: "Adapt for AI/GenAI — RAG Data Preparation",
    subFolder: "adapt_ai_genai" as const,
    version: "1.0.0",
    ownerRole: "AI/ML Lead",
    strategicPrinciple:
      "AI and GenAI systems require data that is not just accurate, but contextually enriched, appropriately chunked, and quality-gated. This playbook governs the preparation of all AI-ready data assets.",
    triggerConditions: JSON.stringify([
      "New RAG or LLM application being built",
      "AI hallucination rate above acceptable threshold",
      "Data assets being considered for AI training",
    ]),
    kpis: JSON.stringify([
      "RAG retrieval precision >85% for all production use cases",
      "Fine-tuning dataset DQS >90% before any training run",
      "AI hallucination rate decreases quarter-over-quarter as data quality improves",
    ]),
    status: "active" as const,
    steps: [
      { stepNumber: 1, title: "AI Use-Case Register", action: "Document every AI/GenAI use case and its data dependencies.", assigneeRole: "AI/ML Lead", slaDays: 5, outputArtifact: "AI Use-Case Register" },
      { stepNumber: 2, title: "Quality Gate Definition", action: "Define per-use-case DQS minimums for RAG indexing and fine-tuning.", assigneeRole: "Data Quality Lead", slaDays: 3, outputArtifact: "AI Quality Gate Spec" },
      { stepNumber: 3, title: "Platinum Zone Prep", action: "Run enrichment pipelines: metadata tagging, semantic chunking, embedding generation.", assigneeRole: "Data Engineer", slaDays: 14, outputArtifact: "Platinum Zone Assets" },
      { stepNumber: 4, title: "RAG Index Build", action: "Load qualifying assets into vector store, validate retrieval quality with test queries.", assigneeRole: "AI/ML Lead", slaDays: 7, outputArtifact: "RAG Index Validation Report" },
      { stepNumber: 5, title: "Fine-Tuning Curation", action: "Select and version high-quality datasets for model fine-tuning pipelines.", assigneeRole: "Data Engineer", slaDays: 10, outputArtifact: "Fine-Tuning Dataset v1" },
      { stepNumber: 6, title: "Feedback Loop", action: "Instrument AI output quality, feed failure signals back to quality engine.", assigneeRole: "AI/ML Lead", slaDays: 14, outputArtifact: "AI Feedback Dashboard" },
    ],
  },
  {
    playbookId: "PB-04-v2",
    title: "Adapt for AI/GenAI — Fine-Tuning Dataset Curation",
    subFolder: "adapt_ai_genai" as const,
    version: "1.0.0",
    ownerRole: "AI/ML Lead",
    strategicPrinciple:
      "Fine-tuning dataset curation: a focused variant for teams building custom model fine-tuning pipelines, with emphasis on dataset versioning, quality gating, and training run governance.",
    triggerConditions: JSON.stringify([
      "Custom model fine-tuning project initiated",
      "Existing fine-tuning datasets have DQS below 85",
      "Model performance degradation detected post-training",
    ]),
    kpis: JSON.stringify([
      "All fine-tuning datasets achieve DQS >90 before training run",
      "Dataset version history maintained for all training runs",
      "Model performance improves by >5% after quality-gated fine-tuning",
    ]),
    status: "active" as const,
    steps: [
      { stepNumber: 1, title: "Dataset Inventory", action: "Catalogue all existing fine-tuning datasets with current DQS and version.", assigneeRole: "Data Engineer", slaDays: 3, outputArtifact: "Dataset Inventory" },
      { stepNumber: 2, title: "Quality Assessment", action: "Run automated DQS assessment on all datasets. Flag those below 85.", assigneeRole: "Data Quality Lead", slaDays: 2, outputArtifact: "Quality Assessment Report" },
      { stepNumber: 3, title: "Curation Sprint", action: "Fix quality issues in flagged datasets. Remove duplicates, fix labels, enrich context.", assigneeRole: "Data Engineer", slaDays: 14, outputArtifact: "Curated Dataset v2" },
      { stepNumber: 4, title: "Version & Gate", action: "Version the curated dataset. Apply DQS quality gate before training run approval.", assigneeRole: "AI/ML Lead", slaDays: 2, outputArtifact: "Dataset Version Certificate" },
      { stepNumber: 5, title: "Training Run Governance", action: "Log training run with dataset version, DQS score, and model performance metrics.", assigneeRole: "AI/ML Lead", slaDays: 1, outputArtifact: "Training Run Log" },
    ],
  },
  {
    playbookId: "PB-05-v1",
    title: "Scale Across Governance — Enterprise Rollout",
    subFolder: "scale_governance" as const,
    version: "1.0.0",
    ownerRole: "Chief Data Officer",
    strategicPrinciple:
      "Data quality must be anchored to enterprise governance frameworks, compliance requirements, and cross-system policy enforcement to scale beyond individual teams.",
    triggerConditions: JSON.stringify([
      "Organisation scaling beyond 5 data domains",
      "Regulatory audit or compliance review upcoming",
      "Enterprise data governance programme initiated",
    ]),
    kpis: JSON.stringify([
      "100% of PII fields classified and tagged within 60 days",
      "GDPR data subject requests fulfilled within 30-day statutory deadline",
      "Zero unplanned compliance violations flagged in quarterly audit",
    ]),
    status: "active" as const,
    steps: [
      { stepNumber: 1, title: "Policy Inventory", action: "Catalogue all existing data policies (retention, PII handling, access control).", assigneeRole: "CDO", slaDays: 7, outputArtifact: "Policy Inventory" },
      { stepNumber: 2, title: "Policy as Code", action: "Encode policies into the Policy Engine as versioned YAML definitions.", assigneeRole: "Data Engineer", slaDays: 14, outputArtifact: "Policy YAML Repository" },
      { stepNumber: 3, title: "Classification Rollout", action: "Apply data classification tags (PII/Confidential/Internal/Public) to all assets.", assigneeRole: "Data Steward", slaDays: 21, outputArtifact: "Classification Completion Report" },
      { stepNumber: 4, title: "GDPR Tooling Activation", action: "Enable right-to-erasure workflows, consent log, and data subject request tracker.", assigneeRole: "DPO", slaDays: 10, outputArtifact: "GDPR Tooling Sign-Off" },
      { stepNumber: 5, title: "Compliance Reporting", action: "Configure automated compliance reports for DPO and Legal teams.", assigneeRole: "Data Engineer", slaDays: 7, outputArtifact: "Compliance Report Templates" },
      { stepNumber: 6, title: "Governance Review Cycle", action: "Establish quarterly governance review with all Domain Owners and Compliance.", assigneeRole: "CDO", slaDays: 5, outputArtifact: "Governance Calendar" },
    ],
  },
  {
    playbookId: "PB-05-v2",
    title: "Scale Across Governance — Compliance-First Regulated Industries",
    subFolder: "scale_governance" as const,
    version: "1.0.0",
    ownerRole: "Chief Compliance Officer",
    strategicPrinciple:
      "Compliance-first variant for regulated industries (financial services, healthcare, energy): compliance requirements drive the governance architecture, with data quality as a derivative outcome.",
    triggerConditions: JSON.stringify([
      "Organisation operates in regulated industry (FS, healthcare, energy)",
      "Regulatory examination or audit scheduled",
      "New compliance requirement (GDPR, SOX, HIPAA) being implemented",
    ]),
    kpis: JSON.stringify([
      "Zero regulatory findings related to data quality in next audit",
      "100% of regulatory data submissions pass automated quality gate",
      "Compliance report generation time reduced from days to hours",
    ]),
    status: "active" as const,
    steps: [
      { stepNumber: 1, title: "Regulatory Mapping", action: "Map all applicable regulations to specific data assets and quality requirements.", assigneeRole: "CCO", slaDays: 10, outputArtifact: "Regulatory Requirement Matrix" },
      { stepNumber: 2, title: "Control Implementation", action: "Implement data quality controls mapped to each regulatory requirement.", assigneeRole: "Data Engineer", slaDays: 21, outputArtifact: "Control Implementation Log" },
      { stepNumber: 3, title: "Evidence Collection", action: "Set up automated evidence collection for all quality controls (audit trail).", assigneeRole: "Data Engineer", slaDays: 7, outputArtifact: "Evidence Collection Config" },
      { stepNumber: 4, title: "Regulatory Reporting", action: "Configure automated regulatory data quality reports with control attestation.", assigneeRole: "CCO", slaDays: 7, outputArtifact: "Regulatory Report Templates" },
      { stepNumber: 5, title: "Mock Audit", action: "Run internal mock audit using regulatory framework. Identify and close gaps.", assigneeRole: "CCO", slaDays: 14, outputArtifact: "Mock Audit Report" },
      { stepNumber: 6, title: "Continuous Compliance", action: "Establish continuous compliance monitoring with real-time alerting for violations.", assigneeRole: "Data Engineer", slaDays: 7, outputArtifact: "Compliance Monitoring Dashboard" },
    ],
  },
];

// ─── Sub-router: playbooks (CRUD + seed) ─────────────────────────────────────
const playbooksRouter = router({
  list: protectedProcedure
    .input(z.object({
      subFolder: z.enum(["avoid_catch22", "democratize_quality", "embed_operations", "adapt_ai_genai", "scale_governance"]).optional(),
      status: z.enum(["draft", "active", "deprecated"]).optional(),
      ventureId: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [];
      if (input?.subFolder) conditions.push(eq(pbPlaybooks.subFolder, input.subFolder));
      if (input?.status) conditions.push(eq(pbPlaybooks.status, input.status));
      if (input?.ventureId) conditions.push(eq(pbPlaybooks.ventureId, input.ventureId));
      const rows = conditions.length > 0
        ? await db.select().from(pbPlaybooks).where(and(...conditions)).orderBy(asc(pbPlaybooks.playbookId))
        : await db.select().from(pbPlaybooks).orderBy(asc(pbPlaybooks.playbookId));
      return rows;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [row] = await db.select().from(pbPlaybooks).where(eq(pbPlaybooks.id, input.id));
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Playbook not found" });
      const steps = await db.select().from(pbSteps).where(eq(pbSteps.playbookId, input.id)).orderBy(asc(pbSteps.stepNumber));
      const runs = await db.select().from(pbRuns).where(eq(pbRuns.playbookId, input.id)).orderBy(desc(pbRuns.createdAt)).limit(10);
      const kpis = await db.select().from(pbKpiEntries).where(eq(pbKpiEntries.playbookId, input.id)).orderBy(desc(pbKpiEntries.measuredAt)).limit(20);
      const assets = await db.select().from(pbLinkedAssets).where(eq(pbLinkedAssets.playbookId, input.id));
      return { ...row, steps, runs, kpis, assets };
    }),

  create: protectedProcedure
    .input(z.object({
      playbookId: z.string().min(1),
      title: z.string().min(1),
      subFolder: z.enum(["avoid_catch22", "democratize_quality", "embed_operations", "adapt_ai_genai", "scale_governance"]),
      version: z.string().default("1.0.0"),
      ownerRole: z.string().optional(),
      strategicPrinciple: z.string().optional(),
      triggerConditions: z.array(z.string()).optional(),
      kpis: z.array(z.string()).optional(),
      status: z.enum(["draft", "active", "deprecated"]).default("draft"),
      ventureId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [result] = await db.insert(pbPlaybooks).values({
        playbookId: input.playbookId,
        title: input.title,
        subFolder: input.subFolder,
        version: input.version,
        ownerRole: input.ownerRole,
        strategicPrinciple: input.strategicPrinciple,
        triggerConditions: input.triggerConditions ? JSON.stringify(input.triggerConditions) : undefined,
        kpis: input.kpis ? JSON.stringify(input.kpis) : undefined,
        status: input.status,
        ventureId: input.ventureId,
        createdBy: ctx.user.openId,
      });
      return { id: (result as any).insertId };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      status: z.enum(["draft", "active", "deprecated"]).optional(),
      ownerRole: z.string().optional(),
      strategicPrinciple: z.string().optional(),
      triggerConditions: z.array(z.string()).optional(),
      kpis: z.array(z.string()).optional(),
      ventureId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { id, triggerConditions, kpis, ...rest } = input;
      await db.update(pbPlaybooks).set({
        ...rest,
        ...(triggerConditions !== undefined ? { triggerConditions: JSON.stringify(triggerConditions) } : {}),
        ...(kpis !== undefined ? { kpis: JSON.stringify(kpis) } : {}),
      }).where(eq(pbPlaybooks.id, id));
      return { success: true };
    }),

  seed: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      let seeded = 0;
      for (const pb of CANONICAL_PLAYBOOKS) {
        const existing = await db.select({ id: pbPlaybooks.id }).from(pbPlaybooks).where(eq(pbPlaybooks.playbookId, pb.playbookId));
        if (existing.length > 0) continue;
        const { steps, ...pbData } = pb;
        const [result] = await db.insert(pbPlaybooks).values({
          ...pbData,
          triggerConditions: pbData.triggerConditions,
          kpis: pbData.kpis,
          createdBy: ctx.user.openId,
        });
        const newId = (result as any).insertId;
        for (const step of steps) {
          await db.insert(pbSteps).values({ ...step, playbookId: newId });
        }
        seeded++;
      }
      return { seeded, total: CANONICAL_PLAYBOOKS.length };
    }),

  getFolderSummary: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      const all = await db.select().from(pbPlaybooks).orderBy(asc(pbPlaybooks.subFolder));
      const folders: Record<string, { count: number; active: number; lastRun: Date | null }> = {};
      for (const pb of all) {
        if (!folders[pb.subFolder]) folders[pb.subFolder] = { count: 0, active: 0, lastRun: null };
        folders[pb.subFolder].count++;
        if (pb.status === "active") folders[pb.subFolder].active++;
        if (pb.lastRun && (!folders[pb.subFolder].lastRun || pb.lastRun > folders[pb.subFolder].lastRun!)) {
          folders[pb.subFolder].lastRun = pb.lastRun;
        }
      }
      return Object.entries(folders).map(([folder, stats]) => ({ folder, ...stats }));
    }),
});

// ─── Sub-router: steps ────────────────────────────────────────────────────────
const stepsRouter = router({
  list: protectedProcedure
    .input(z.object({ playbookId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(pbSteps).where(eq(pbSteps.playbookId, input.playbookId)).orderBy(asc(pbSteps.stepNumber));
    }),

  create: protectedProcedure
    .input(z.object({
      playbookId: z.number(),
      stepNumber: z.number(),
      title: z.string().min(1),
      action: z.string().min(1),
      assigneeRole: z.string().optional(),
      slaDays: z.number().optional(),
      toolsRequired: z.array(z.string()).optional(),
      outputArtifact: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { toolsRequired, ...rest } = input;
      const [result] = await db.insert(pbSteps).values({
        ...rest,
        toolsRequired: toolsRequired ? JSON.stringify(toolsRequired) : undefined,
      });
      return { id: (result as any).insertId };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      action: z.string().optional(),
      assigneeRole: z.string().optional(),
      slaDays: z.number().optional(),
      outputArtifact: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { id, ...rest } = input;
      await db.update(pbSteps).set(rest).where(eq(pbSteps.id, id));
      return { success: true };
    }),
});

// ─── Sub-router: runs (execution engine) ─────────────────────────────────────
const runsRouter = router({
  list: protectedProcedure
    .input(z.object({
      playbookId: z.number().optional(),
      ventureId: z.string().optional(),
      status: z.enum(["pending", "in_progress", "completed", "failed", "cancelled"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [];
      if (input?.playbookId) conditions.push(eq(pbRuns.playbookId, input.playbookId));
      if (input?.ventureId) conditions.push(eq(pbRuns.ventureId, input.ventureId));
      if (input?.status) conditions.push(eq(pbRuns.status, input.status));
      const rows = conditions.length > 0
        ? await db.select().from(pbRuns).where(and(...conditions)).orderBy(desc(pbRuns.createdAt))
        : await db.select().from(pbRuns).orderBy(desc(pbRuns.createdAt)).limit(50);
      return rows;
    }),

  start: protectedProcedure
    .input(z.object({
      playbookId: z.number(),
      ventureId: z.string().optional(),
      triggerReason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const steps = await db.select().from(pbSteps).where(eq(pbSteps.playbookId, input.playbookId)).orderBy(asc(pbSteps.stepNumber));
      if (steps.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Playbook has no steps" });
      const [result] = await db.insert(pbRuns).values({
        playbookId: input.playbookId,
        ventureId: input.ventureId,
        triggeredBy: ctx.user.openId,
        triggerReason: input.triggerReason,
        status: "in_progress",
        currentStep: 1,
        totalSteps: steps.length,
      });
      const runId = (result as any).insertId;
      for (const step of steps) {
        await db.insert(pbRunSteps).values({
          runId,
          stepId: step.id,
          stepNumber: step.stepNumber,
          status: step.stepNumber === 1 ? "in_progress" : "pending",
        });
      }
      await db.update(pbPlaybooks).set({ lastRun: new Date(), runCount: (await db.select({ runCount: pbPlaybooks.runCount }).from(pbPlaybooks).where(eq(pbPlaybooks.id, input.playbookId)))[0]?.runCount + 1 || 1 }).where(eq(pbPlaybooks.id, input.playbookId));
      return { runId };
    }),

  getRunDetail: protectedProcedure
    .input(z.object({ runId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [run] = await db.select().from(pbRuns).where(eq(pbRuns.id, input.runId));
      if (!run) throw new TRPCError({ code: "NOT_FOUND", message: "Run not found" });
      const runSteps = await db.select().from(pbRunSteps).where(eq(pbRunSteps.runId, input.runId)).orderBy(asc(pbRunSteps.stepNumber));
      const stepDetails = await db.select().from(pbSteps).where(eq(pbSteps.playbookId, run.playbookId)).orderBy(asc(pbSteps.stepNumber));
      return { run, runSteps, stepDetails };
    }),

  advanceStep: protectedProcedure
    .input(z.object({
      runId: z.number(),
      stepId: z.number(),
      notes: z.string().optional(),
      evidence: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(pbRunSteps).set({
        status: "completed",
        completedAt: new Date(),
        notes: input.notes,
        evidence: input.evidence ? JSON.stringify(input.evidence) : undefined,
      }).where(and(eq(pbRunSteps.runId, input.runId), eq(pbRunSteps.stepId, input.stepId)));
      const [run] = await db.select().from(pbRuns).where(eq(pbRuns.id, input.runId));
      if (!run) throw new TRPCError({ code: "NOT_FOUND", message: "Run not found" });
      const nextStep = run.currentStep + 1;
      if (nextStep > run.totalSteps) {
        await db.update(pbRuns).set({ status: "completed", completedAt: new Date(), currentStep: nextStep }).where(eq(pbRuns.id, input.runId));
      } else {
        await db.update(pbRuns).set({ currentStep: nextStep }).where(eq(pbRuns.id, input.runId));
        const nextRunStep = await db.select().from(pbRunSteps).where(and(eq(pbRunSteps.runId, input.runId), eq(pbRunSteps.stepNumber, nextStep)));
        if (nextRunStep.length > 0) {
          await db.update(pbRunSteps).set({ status: "in_progress", startedAt: new Date() }).where(eq(pbRunSteps.id, nextRunStep[0].id));
        }
      }
      return { success: true, completed: nextStep > run.totalSteps };
    }),

  blockStep: protectedProcedure
    .input(z.object({
      runId: z.number(),
      stepId: z.number(),
      blockerReason: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(pbRunSteps).set({ status: "blocked", blockerReason: input.blockerReason }).where(and(eq(pbRunSteps.runId, input.runId), eq(pbRunSteps.stepId, input.stepId)));
      return { success: true };
    }),

  cancel: protectedProcedure
    .input(z.object({ runId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(pbRuns).set({ status: "cancelled", notes: input.reason, completedAt: new Date() }).where(eq(pbRuns.id, input.runId));
      return { success: true };
    }),
});

// ─── Sub-router: kpis ─────────────────────────────────────────────────────────
const kpisRouter = router({
  list: protectedProcedure
    .input(z.object({ playbookId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(pbKpiEntries).where(eq(pbKpiEntries.playbookId, input.playbookId)).orderBy(desc(pbKpiEntries.measuredAt));
    }),

  record: protectedProcedure
    .input(z.object({
      playbookId: z.number(),
      runId: z.number().optional(),
      kpiLabel: z.string().min(1),
      targetValue: z.string().optional(),
      actualValue: z.string().optional(),
      unit: z.string().optional(),
      achieved: z.boolean().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [result] = await db.insert(pbKpiEntries).values(input);
      return { id: (result as any).insertId };
    }),
});

// ─── Sub-router: assets ───────────────────────────────────────────────────────
const assetsRouter = router({
  list: protectedProcedure
    .input(z.object({ playbookId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(pbLinkedAssets).where(eq(pbLinkedAssets.playbookId, input.playbookId));
    }),

  link: protectedProcedure
    .input(z.object({
      playbookId: z.number(),
      assetName: z.string().min(1),
      assetType: z.enum(["data_asset", "venture", "document", "system", "api"]),
      assetRef: z.string().optional(),
      domain: z.string().optional(),
      classification: z.enum(["PII", "Confidential", "Internal", "Public"]).optional(),
      zone: z.enum(["Bronze", "Silver", "Gold", "Platinum"]).optional(),
      dqsCurrent: z.number().min(0).max(100).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [result] = await db.insert(pbLinkedAssets).values({
        ...input,
        dqsCurrent: input.dqsCurrent?.toString(),
      });
      return { id: (result as any).insertId };
    }),

  unlink: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(pbLinkedAssets).where(eq(pbLinkedAssets.id, input.id));
      return { success: true };
    }),
});

// ─── Sub-router: ai ───────────────────────────────────────────────────────────
const aiRouter = router({
  generatePlaybook: protectedProcedure
    .input(z.object({
      subFolder: z.enum(["avoid_catch22", "democratize_quality", "embed_operations", "adapt_ai_genai", "scale_governance"]),
      ventureContext: z.string().optional(),
      specificChallenge: z.string().optional(),
      teamSize: z.string().optional(),
      industry: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const folderLabels: Record<string, string> = {
        avoid_catch22: "Avoid the Catch-22 (improve data quality through active usage)",
        democratize_quality: "Democratize Data Quality (distributed stewardship)",
        embed_operations: "Embed Across Operations (invisible quality checks in workflows)",
        adapt_ai_genai: "Adapt for AI/GenAI (quality-gated AI-ready data preparation)",
        scale_governance: "Scale Across Governance (enterprise compliance and policy enforcement)",
      };
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert data quality and governance consultant specialising in the EcoBlend VBS methodology. Generate a custom playbook variant based on the strategic principle provided. Return a JSON object with: title, strategicPrinciple, triggerConditions (array of 3 strings), kpis (array of 3 strings), steps (array of objects with stepNumber, title, action, assigneeRole, slaDays, outputArtifact).`,
          },
          {
            role: "user",
            content: `Generate a custom playbook variant for the "${folderLabels[input.subFolder]}" category.
${input.ventureContext ? `Venture context: ${input.ventureContext}` : ""}
${input.specificChallenge ? `Specific challenge: ${input.specificChallenge}` : ""}
${input.teamSize ? `Team size: ${input.teamSize}` : ""}
${input.industry ? `Industry: ${input.industry}` : ""}

Create a practical, actionable playbook with 5-6 steps tailored to this context.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "playbook_generation",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                strategicPrinciple: { type: "string" },
                triggerConditions: { type: "array", items: { type: "string" } },
                kpis: { type: "array", items: { type: "string" } },
                steps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      stepNumber: { type: "integer" },
                      title: { type: "string" },
                      action: { type: "string" },
                      assigneeRole: { type: "string" },
                      slaDays: { type: "integer" },
                      outputArtifact: { type: "string" },
                    },
                    required: ["stepNumber", "title", "action", "assigneeRole", "slaDays", "outputArtifact"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["title", "strategicPrinciple", "triggerConditions", "kpis", "steps"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0]?.message?.content as string | undefined;
      if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI generation failed" });
      return JSON.parse(content);
    }),

  generateRunSummary: protectedProcedure
    .input(z.object({
      runId: z.number(),
      playbookTitle: z.string(),
      completedSteps: z.array(z.object({ title: z.string(), notes: z.string().optional() })),
      kpisAchieved: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are an expert data governance consultant. Generate a concise executive summary of a completed playbook run, highlighting key achievements, lessons learned, and recommended next actions.",
          },
          {
            role: "user",
            content: `Playbook: ${input.playbookTitle}
Completed steps: ${input.completedSteps.map((s) => `${s.title}${s.notes ? `: ${s.notes}` : ""}`).join("; ")}
KPIs achieved: ${input.kpisAchieved?.join(", ") || "Not yet measured"}

Write a 3-paragraph executive summary: (1) What was accomplished, (2) Key outcomes and metrics, (3) Recommended next actions.`,
          },
        ],
      });
      const summary = (response.choices[0]?.message?.content as string) || "";
      const db = await getDb();
      if (db) {
        await db.update(pbRuns).set({ aiSummary: summary }).where(eq(pbRuns.id, input.runId));
      }
      return { summary };
    }),

  analysePlaybookHealth: protectedProcedure
    .input(z.object({
      playbookId: z.number(),
      playbookTitle: z.string(),
      runCount: z.number(),
      avgCompletionDays: z.number().optional(),
      kpiAchievementRate: z.number().optional(),
      blockedStepCount: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are an expert data quality programme manager. Analyse the health of a playbook based on its execution metrics and provide actionable improvement recommendations.",
          },
          {
            role: "user",
            content: `Playbook: ${input.playbookTitle}
Run count: ${input.runCount}
Average completion time: ${input.avgCompletionDays ? `${input.avgCompletionDays} days` : "Unknown"}
KPI achievement rate: ${input.kpiAchievementRate !== undefined ? `${(input.kpiAchievementRate * 100).toFixed(0)}%` : "Not measured"}
Blocked steps encountered: ${input.blockedStepCount || 0}

Provide: (1) Health score 0-100, (2) Top 3 strengths, (3) Top 3 improvement areas, (4) 2 specific recommendations.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "playbook_health",
            strict: true,
            schema: {
              type: "object",
              properties: {
                healthScore: { type: "integer" },
                strengths: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } },
              },
              required: ["healthScore", "strengths", "improvements", "recommendations"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0]?.message?.content as string | undefined;
      if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI analysis failed" });
      return JSON.parse(content);
    }),
});

// ─── Root router ──────────────────────────────────────────────────────────────
export const playbookRouter = router({
  playbooks: playbooksRouter,
  steps: stepsRouter,
  runs: runsRouter,
  kpis: kpisRouter,
  assets: assetsRouter,
  ai: aiRouter,
});
