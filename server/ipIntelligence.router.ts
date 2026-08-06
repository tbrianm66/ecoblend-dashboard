/**
 * IP Intelligence Module — tRPC Router
 * Sprint 71 — EcoBlend OS
 *
 * Architecture:
 *   - analysisRouter    : run analysis, list, get, delete
 *   - lightbringerRouter: mock Lightbringer API engine (swap for real API later)
 *   - vrlFeedRouter     : apply IP score to VRL calculation
 *   - schemaRouter      : return IP_OBJECT JSON schema for external integrations
 *
 * Lightbringer Mock Engine:
 *   Deterministic scoring based on input keywords, industry, geography.
 *   Designed for easy swap to real Lightbringer API — just replace
 *   `runLightbringerMock()` with a real HTTP call in `lightbringerRouter.run`.
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";
import { eq, desc, and } from "drizzle-orm";
import {
  ipAnalyses,
  ipEntities,
  ipWhitespace,
  ipVrlFeed,
  ventures,
} from "../drizzle/schema";

// ─── IP_OBJECT JSON Schema (canonical) ───────────────────────────────────────
export const IP_OBJECT_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://ecoblend.io/schemas/ip_object/v1.0",
  title: "IP_OBJECT",
  description: "EcoBlend OS — IP Intelligence Analysis Object (Lightbringer-compatible)",
  type: "object",
  required: [
    "id", "ideaName", "description", "keywords", "industry", "geography",
    "noveltyScore", "patentDensity", "ftoRisk", "recommendation", "ipScore",
    "topEntities", "whitespaceOpportunities", "apiProvider", "apiVersion", "status",
  ],
  properties: {
    id:                    { type: "integer", description: "Unique analysis ID" },
    ventureId:             { type: ["string", "null"], description: "Linked venture ID" },
    ideaName:              { type: "string", maxLength: 200 },
    description:           { type: "string" },
    keywords:              { type: "string", description: "Comma-separated keywords" },
    industry:              { type: "string", maxLength: 100 },
    geography:             { type: "string", maxLength: 100 },
    noveltyScore:          { type: "number", minimum: 0, maximum: 100, description: "0–100 novelty score" },
    patentDensity:         { type: "string", enum: ["LOW", "MED", "HIGH"] },
    ftoRisk:               { type: "string", enum: ["LOW", "MED", "HIGH"], description: "Freedom-to-Operate risk" },
    recommendation:        { type: "string", enum: ["PROCEED", "MODIFY", "KILL"] },
    ipScore:               { type: "number", minimum: 0, maximum: 100, description: "Composite IP score fed to VRL" },
    topEntities: {
      type: "array",
      items: {
        type: "object",
        required: ["entityName", "entityType", "patentCount", "relevanceScore", "threat"],
        properties: {
          entityName:     { type: "string" },
          entityType:     { type: "string", enum: ["corporation", "university", "startup", "individual", "government"] },
          patentCount:    { type: "integer" },
          relevanceScore: { type: "number", minimum: 0, maximum: 100 },
          country:        { type: ["string", "null"] },
          threat:         { type: "string", enum: ["LOW", "MED", "HIGH"] },
        },
      },
    },
    whitespaceOpportunities: {
      type: "array",
      items: {
        type: "object",
        required: ["opportunity", "category", "potentialScore", "actionable"],
        properties: {
          opportunity:    { type: "string" },
          category:       { type: "string", enum: ["technology", "geography", "application", "combination"] },
          potentialScore: { type: "number", minimum: 0, maximum: 100 },
          actionable:     { type: "boolean" },
        },
      },
    },
    rawResponse:  { type: ["object", "null"], description: "Full Lightbringer API response" },
    apiProvider:  { type: "string", description: "API provider identifier" },
    apiVersion:   { type: "string" },
    status:       { type: "string", enum: ["pending", "complete", "error"] },
    analysedBy:   { type: ["string", "null"] },
    notes:        { type: ["string", "null"] },
    createdAt:    { type: "string", format: "date-time" },
    updatedAt:    { type: "string", format: "date-time" },
  },
};

// ─── Lightbringer Mock Engine ─────────────────────────────────────────────────
// Deterministic scoring based on keyword density, industry, geography.
// Replace `runLightbringerMock()` with a real HTTP call to enable live API.

type LightbringerInput = {
  ideaName: string;
  description: string;
  keywords: string;
  industry: string;
  geography: string;
};

type LightbringerEntity = {
  entityName: string;
  entityType: "corporation" | "university" | "startup" | "individual" | "government";
  patentCount: number;
  relevanceScore: number;
  country: string;
  threat: "LOW" | "MED" | "HIGH";
};

type LightbringerWhitespace = {
  opportunity: string;
  category: "technology" | "geography" | "application" | "combination";
  potentialScore: number;
  actionable: boolean;
};

type LightbringerResponse = {
  noveltyScore: number;
  patentDensity: "LOW" | "MED" | "HIGH";
  ftoRisk: "LOW" | "MED" | "HIGH";
  recommendation: "PROCEED" | "MODIFY" | "KILL";
  ipScore: number;
  topEntities: LightbringerEntity[];
  whitespaceOpportunities: LightbringerWhitespace[];
  rawResponse: Record<string, unknown>;
};

// Industry-specific patent density baselines
const INDUSTRY_DENSITY: Record<string, "LOW" | "MED" | "HIGH"> = {
  "Pharmaceuticals": "HIGH",
  "Biotechnology": "HIGH",
  "Semiconductors": "HIGH",
  "Software": "HIGH",
  "Electronics": "HIGH",
  "Automotive": "MED",
  "Aerospace": "MED",
  "Medical Devices": "HIGH",
  "Clean Energy": "MED",
  "Materials Science": "MED",
  "Food & Beverage": "LOW",
  "Fashion": "LOW",
  "Sports": "LOW",
  "Agriculture": "LOW",
  "Construction": "LOW",
};

// Geography-based FTO risk modifiers
const GEO_FTO_MODIFIER: Record<string, number> = {
  "United States": 15,
  "US": 15,
  "USA": 15,
  "European Union": 10,
  "EU": 10,
  "China": 12,
  "Japan": 10,
  "Germany": 8,
  "United Kingdom": 6,
  "UK": 6,
  "Global": 20,
  "Worldwide": 20,
};

function deterministicHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function runLightbringerMock(input: LightbringerInput): LightbringerResponse {
  const keywordList = input.keywords.toLowerCase().split(",").map(k => k.trim()).filter(Boolean);
  const keywordCount = keywordList.length;
  const seed = deterministicHash(input.ideaName + input.keywords + input.industry);

  // --- Novelty Score (0–100) ---
  // Higher with more specific keywords, penalised by common terms
  const commonTerms = ["system", "method", "process", "device", "apparatus", "product", "solution"];
  const commonCount = keywordList.filter(k => commonTerms.some(c => k.includes(c))).length;
  const baseNovelty = 45 + (seed % 35);
  const keywordBonus = Math.min(keywordCount * 3, 15);
  const commonPenalty = commonCount * 5;
  const noveltyScore = Math.min(100, Math.max(10, baseNovelty + keywordBonus - commonPenalty));

  // --- Patent Density ---
  const industryDensity = INDUSTRY_DENSITY[input.industry] ?? "MED";
  const patentDensity = industryDensity;

  // --- FTO Risk ---
  const geoModifier = GEO_FTO_MODIFIER[input.geography] ?? 5;
  const densityRiskMap: Record<string, number> = { "LOW": 15, "MED": 35, "HIGH": 55 };
  const ftoBase = densityRiskMap[patentDensity] + geoModifier + (seed % 15);
  const ftoRisk: "LOW" | "MED" | "HIGH" = ftoBase < 30 ? "LOW" : ftoBase < 55 ? "MED" : "HIGH";

  // --- Recommendation ---
  let recommendation: "PROCEED" | "MODIFY" | "KILL";
  if (noveltyScore >= 65 && ftoRisk === "LOW") {
    recommendation = "PROCEED";
  } else if (noveltyScore >= 40 || ftoRisk !== "HIGH") {
    recommendation = "MODIFY";
  } else {
    recommendation = "KILL";
  }

  // --- IP Score (composite, 0–100, fed to VRL) ---
  const ftoScoreMap: Record<string, number> = { "LOW": 30, "MED": 15, "HIGH": 0 };
  const densityScoreMap: Record<string, number> = { "LOW": 20, "MED": 10, "HIGH": 5 };
  const ipScore = Math.min(100, Math.round(
    (noveltyScore * 0.5) + ftoScoreMap[ftoRisk] + densityScoreMap[patentDensity]
  ));

  // --- Top Entities (mock, industry-specific) ---
  const entityTemplates: Record<string, LightbringerEntity[]> = {
    "Materials Science": [
      { entityName: "BASF SE", entityType: "corporation", patentCount: 1840 + (seed % 200), relevanceScore: 82, country: "Germany", threat: "MED" },
      { entityName: "Dow Chemical", entityType: "corporation", patentCount: 1240 + (seed % 150), relevanceScore: 74, country: "United States", threat: "MED" },
      { entityName: "MIT Materials Lab", entityType: "university", patentCount: 340 + (seed % 80), relevanceScore: 65, country: "United States", threat: "LOW" },
      { entityName: "Toray Industries", entityType: "corporation", patentCount: 920 + (seed % 100), relevanceScore: 58, country: "Japan", threat: "LOW" },
      { entityName: "Solvay SA", entityType: "corporation", patentCount: 680 + (seed % 90), relevanceScore: 51, country: "Belgium", threat: "LOW" },
    ],
    "Clean Energy": [
      { entityName: "Tesla Inc.", entityType: "corporation", patentCount: 2100 + (seed % 300), relevanceScore: 88, country: "United States", threat: "HIGH" },
      { entityName: "Siemens Energy", entityType: "corporation", patentCount: 1560 + (seed % 200), relevanceScore: 76, country: "Germany", threat: "MED" },
      { entityName: "NREL", entityType: "government", patentCount: 480 + (seed % 100), relevanceScore: 62, country: "United States", threat: "LOW" },
      { entityName: "Vestas Wind Systems", entityType: "corporation", patentCount: 890 + (seed % 120), relevanceScore: 55, country: "Denmark", threat: "LOW" },
      { entityName: "Fraunhofer ISE", entityType: "university", patentCount: 340 + (seed % 80), relevanceScore: 48, country: "Germany", threat: "LOW" },
    ],
    "Sports": [
      { entityName: "Nike Inc.", entityType: "corporation", patentCount: 1200 + (seed % 200), relevanceScore: 85, country: "United States", threat: "HIGH" },
      { entityName: "Adidas AG", entityType: "corporation", patentCount: 980 + (seed % 150), relevanceScore: 78, country: "Germany", threat: "HIGH" },
      { entityName: "Under Armour", entityType: "corporation", patentCount: 560 + (seed % 100), relevanceScore: 65, country: "United States", threat: "MED" },
      { entityName: "Decathlon SA", entityType: "corporation", patentCount: 420 + (seed % 80), relevanceScore: 52, country: "France", threat: "MED" },
      { entityName: "MIT Sport Lab", entityType: "university", patentCount: 120 + (seed % 40), relevanceScore: 38, country: "United States", threat: "LOW" },
    ],
  };

  const defaultEntities: LightbringerEntity[] = [
    { entityName: "3M Company", entityType: "corporation", patentCount: 1800 + (seed % 400), relevanceScore: 75, country: "United States", threat: "MED" },
    { entityName: "General Electric", entityType: "corporation", patentCount: 1400 + (seed % 300), relevanceScore: 68, country: "United States", threat: "MED" },
    { entityName: "Stanford University", entityType: "university", patentCount: 520 + (seed % 100), relevanceScore: 58, country: "United States", threat: "LOW" },
    { entityName: "Bosch GmbH", entityType: "corporation", patentCount: 1100 + (seed % 200), relevanceScore: 52, country: "Germany", threat: "LOW" },
    { entityName: "Samsung Electronics", entityType: "corporation", patentCount: 2200 + (seed % 500), relevanceScore: 45, country: "South Korea", threat: "LOW" },
  ];

  const topEntities = (entityTemplates[input.industry] ?? defaultEntities).slice(0, 5);

  // --- Whitespace Opportunities ---
  const whitespacePool: LightbringerWhitespace[] = [
    {
      opportunity: `Novel ${keywordList[0] ?? "material"} formulation for ${input.geography} market with bio-based feedstocks`,
      category: "technology",
      potentialScore: 70 + (seed % 20),
      actionable: true,
    },
    {
      opportunity: `Application of ${keywordList[1] ?? input.industry.toLowerCase()} technology in emerging markets (Southeast Asia, Africa)`,
      category: "geography",
      potentialScore: 60 + (seed % 25),
      actionable: true,
    },
    {
      opportunity: `Cross-industry application: combining ${keywordList[0] ?? "core"} IP with circular economy principles`,
      category: "application",
      potentialScore: 55 + (seed % 30),
      actionable: noveltyScore > 50,
    },
    {
      opportunity: `Combination patent opportunity: ${keywordList[0] ?? "method"} + ${keywordList[1] ?? "process"} hybrid approach`,
      category: "combination",
      potentialScore: 50 + (seed % 25),
      actionable: ftoRisk !== "HIGH",
    },
    {
      opportunity: `Design-around strategy: ${input.industry} application targeting underserved SME segment`,
      category: "application",
      potentialScore: 45 + (seed % 20),
      actionable: true,
    },
  ];

  const rawResponse = {
    provider: "lightbringer_mock",
    version: "v1.0",
    timestamp: new Date().toISOString(),
    input: { ...input },
    scores: {
      novelty: noveltyScore,
      fto: ftoBase,
      patentDensityIndex: patentDensity,
      composite: ipScore,
    },
    metadata: {
      keywordsAnalysed: keywordCount,
      geographyModifier: geoModifier,
      industryBaseline: patentDensity,
      deterministicSeed: seed,
    },
    note: "Mock response — replace runLightbringerMock() with real Lightbringer HTTP call to enable live analysis.",
  };

  return {
    noveltyScore,
    patentDensity,
    ftoRisk,
    recommendation,
    ipScore,
    topEntities,
    whitespaceOpportunities: whitespacePool,
    rawResponse,
  };
}

// ─── Input Schemas ────────────────────────────────────────────────────────────
const analysisInputSchema = z.object({
  ventureId:   z.string().optional(),
  ideaName:    z.string().min(2).max(200),
  description: z.string().min(10),
  keywords:    z.string().min(2),
  industry:    z.string().min(2).max(100),
  geography:   z.string().min(2).max(100),
  notes:       z.string().optional(),
});

// ─── Sub-routers ──────────────────────────────────────────────────────────────

/** Analysis CRUD router */
const analysisRouter = router({
  /** Run a new IP analysis (calls Lightbringer mock engine) */
  run: protectedProcedure
    .input(analysisInputSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // 1. Insert pending record
      const [inserted] = await db.insert(ipAnalyses).values({
        ventureId:    input.ventureId ?? null,
        ideaName:     input.ideaName,
        description:  input.description,
        keywords:     input.keywords,
        industry:     input.industry,
        geography:    input.geography,
        noveltyScore: "0",
        patentDensity: "LOW",
        ftoRisk:      "LOW",
        recommendation: "PROCEED",
        ipScore:      "0",
        status:       "pending",
        analysedBy:   ctx.user.name ?? ctx.user.email ?? "unknown",
        notes:        input.notes ?? null,
      });

      const analysisId = (inserted as unknown as { insertId: number }).insertId;

      try {
        // 2. Run Lightbringer mock engine
        const result = runLightbringerMock({
          ideaName:    input.ideaName,
          description: input.description,
          keywords:    input.keywords,
          industry:    input.industry,
          geography:   input.geography,
        });

        // 3. Update analysis record with results
        await db.update(ipAnalyses)
          .set({
            noveltyScore:   String(result.noveltyScore),
            patentDensity:  result.patentDensity,
            ftoRisk:        result.ftoRisk,
            recommendation: result.recommendation,
            ipScore:        String(result.ipScore),
            rawResponse:    result.rawResponse,
            status:         "complete",
          })
          .where(eq(ipAnalyses.id, analysisId));

        // 4. Insert top entities
        if (result.topEntities.length > 0) {
          await db.insert(ipEntities).values(
            result.topEntities.map(e => ({
              analysisId,
              entityName:     e.entityName,
              entityType:     e.entityType,
              patentCount:    e.patentCount,
              relevanceScore: String(e.relevanceScore),
              country:        e.country,
              threat:         e.threat,
            }))
          );
        }

        // 5. Insert whitespace opportunities
        if (result.whitespaceOpportunities.length > 0) {
          await db.insert(ipWhitespace).values(
            result.whitespaceOpportunities.map(w => ({
              analysisId,
              opportunity:    w.opportunity,
              category:       w.category,
              potentialScore: String(w.potentialScore),
              actionable:     w.actionable,
            }))
          );
        }

        // 6. If ventureId provided, write VRL feed record
        if (input.ventureId) {
          const vrlContribution = Math.round(result.ipScore * 0.15); // IP = 15% of VRL
          await db.insert(ipVrlFeed).values({
            ventureId:       input.ventureId,
            analysisId,
            ipScore:         String(result.ipScore),
            vrlContribution: String(vrlContribution),
            appliedBy:       ctx.user.name ?? ctx.user.email ?? "unknown",
          });
        }

        return { success: true, analysisId, ipScore: result.ipScore, recommendation: result.recommendation };
      } catch (err) {
        await db.update(ipAnalyses)
          .set({ status: "error" })
          .where(eq(ipAnalyses.id, analysisId));
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Analysis engine failed" });
      }
    }),

  /** List all analyses (with optional venture filter) */
  list: protectedProcedure
    .input(z.object({ ventureId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const rows = await db
        .select()
        .from(ipAnalyses)
        .orderBy(desc(ipAnalyses.createdAt));

      if (input?.ventureId) {
        return rows.filter(r => r.ventureId === input.ventureId);
      }
      return rows;
    }),

  /** Get a single analysis with entities and whitespace */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "NOT_FOUND", message: "Analysis not found" });

      const [analysis] = await db
        .select()
        .from(ipAnalyses)
        .where(eq(ipAnalyses.id, input.id));

      if (!analysis) throw new TRPCError({ code: "NOT_FOUND", message: "Analysis not found" });

      const entities = await db
        .select()
        .from(ipEntities)
        .where(eq(ipEntities.analysisId, input.id))
        .orderBy(desc(ipEntities.relevanceScore));

      const whitespaceItems = await db
        .select()
        .from(ipWhitespace)
        .where(eq(ipWhitespace.analysisId, input.id))
        .orderBy(desc(ipWhitespace.potentialScore));

      return { ...analysis, entities, whitespace: whitespaceItems };
    }),

  /** Delete an analysis and its related records */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      await db.delete(ipEntities).where(eq(ipEntities.analysisId, input.id));
      await db.delete(ipWhitespace).where(eq(ipWhitespace.analysisId, input.id));
      await db.delete(ipVrlFeed).where(eq(ipVrlFeed.analysisId, input.id));
      await db.delete(ipAnalyses).where(eq(ipAnalyses.id, input.id));

      return { success: true };
    }),

  /** Update notes on an existing analysis */
  updateNotes: protectedProcedure
    .input(z.object({ id: z.number(), notes: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      await db.update(ipAnalyses)
        .set({ notes: input.notes })
        .where(eq(ipAnalyses.id, input.id));

      return { success: true };
    }),
});

/** Lightbringer API router — mock engine + schema */
const lightbringerRouter = router({
  /** Preview a Lightbringer analysis without saving to DB */
  preview: protectedProcedure
    .input(analysisInputSchema)
    .mutation(async ({ input }) => {
      const result = runLightbringerMock({
        ideaName:    input.ideaName,
        description: input.description,
        keywords:    input.keywords,
        industry:    input.industry,
        geography:   input.geography,
      });
      return { ...result, preview: true };
    }),

  /** Return the IP_OBJECT JSON schema for external integrations */
  getSchema: protectedProcedure
    .query(() => IP_OBJECT_SCHEMA),

  /** Return available industries and geographies for form dropdowns */
  getOptions: protectedProcedure
    .query(() => ({
      industries: [
        "Materials Science", "Clean Energy", "Sports", "Fashion", "Food & Beverage",
        "Pharmaceuticals", "Biotechnology", "Semiconductors", "Software", "Electronics",
        "Automotive", "Aerospace", "Medical Devices", "Agriculture", "Construction",
        "Chemicals", "Packaging", "Textiles", "Consumer Goods", "Industrial Equipment",
      ].sort(),
      geographies: [
        "United Kingdom", "European Union", "United States", "Global", "China",
        "Japan", "Germany", "France", "Canada", "Australia", "India",
        "South Korea", "Brazil", "Singapore", "Netherlands", "Switzerland",
      ].sort(),
      apiProviders: [
        { id: "lightbringer_mock", label: "Lightbringer Mock (v1.0)", status: "active" },
        { id: "lightbringer_live", label: "Lightbringer Live API", status: "coming_soon" },
        { id: "lens_api", label: "Lens.org Patent API", status: "coming_soon" },
        { id: "epo_ops", label: "EPO Open Patent Services", status: "coming_soon" },
      ],
    })),
});

/** VRL Feed router — apply IP scores to venture VRL */
const vrlFeedRouter = router({
  /** Get all VRL feed records for a venture */
  getByVenture: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(ipVrlFeed)
        .where(eq(ipVrlFeed.ventureId, input.ventureId))
        .orderBy(desc(ipVrlFeed.appliedAt));
    }),

  /** Get the latest IP score for a venture (for VRL formula) */
  getLatestScore: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ipScore: 0, vrlContribution: 0, hasData: false };

      const [latest] = await db
        .select()
        .from(ipVrlFeed)
        .where(eq(ipVrlFeed.ventureId, input.ventureId))
        .orderBy(desc(ipVrlFeed.appliedAt))
        .limit(1);

      if (!latest) return { ipScore: 0, vrlContribution: 0, hasData: false };

      return {
        ipScore: Number(latest.ipScore),
        vrlContribution: Number(latest.vrlContribution),
        hasData: true,
        analysisId: latest.analysisId,
        appliedAt: latest.appliedAt,
      };
    }),

  /** Portfolio IP summary — latest IP score per venture */
  portfolioSummary: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];

      const ventureList = await db.select().from(ventures);
      const results = [];

      for (const v of ventureList) {
        const [latest] = await db
          .select()
          .from(ipVrlFeed)
          .where(eq(ipVrlFeed.ventureId, v.id))
          .orderBy(desc(ipVrlFeed.appliedAt))
          .limit(1);

        const analysisCount = await db
          .select()
          .from(ipAnalyses)
          .where(eq(ipAnalyses.ventureId, v.id));

        results.push({
          ventureId:       v.id,
          ventureName:     v.name,
          ventureColor:    v.color,
          ipScore:         latest ? Number(latest.ipScore) : null,
          vrlContribution: latest ? Number(latest.vrlContribution) : 0,
          analysisCount:   analysisCount.length,
          lastAnalysedAt:  latest?.appliedAt ?? null,
        });
      }

      return results;
    }),
});

// ─── Root IP Intelligence Router ─────────────────────────────────────────────
export const ipIntelligenceRouter = router({
  analysis:     analysisRouter,
  lightbringer: lightbringerRouter,
  vrlFeed:      vrlFeedRouter,
});
