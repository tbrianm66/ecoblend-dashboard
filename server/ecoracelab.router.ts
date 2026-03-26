/**
 * EcoRace Lab Router — Sprint 67
 * 8-Stage AI Engineering Workflow with 7 Specialised Agents
 *
 * Stages: Opportunity → Concept → Materials → Simulation →
 *         Prototype → Manufacturing → Validation → IP
 *
 * Agents:
 *   1. Opportunity Translator
 *   2. Concept Engineer
 *   3. Materials Scientist
 *   4. Simulation Engineer
 *   5. Manufacturing Planner
 *   6. Validation Engineer
 *   7. IP Generator
 */
import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import {
  erlProjects,
  erlStages,
  erlMaterials,
  erlSimulations,
  erlIpAssets,
  erlAgentRuns,
  erlValidationLogs,
  ventures,
} from "../drizzle/schema";
import { eq, desc, and, isNull } from "drizzle-orm";

// ─── Agent Definitions ────────────────────────────────────────────────────────

const AGENTS = {
  opportunity_translator: {
    id: "opportunity_translator",
    name: "Opportunity Translator",
    stage: "opportunity",
    description: "Translates validated problem statements into structured engineering briefs with market and technical requirements.",
  },
  concept_engineer: {
    id: "concept_engineer",
    name: "Concept Engineer",
    stage: "concept",
    description: "Generates engineering concepts, defines performance targets, and evaluates feasibility against constraints.",
  },
  materials_scientist: {
    id: "materials_scientist",
    name: "Materials Scientist",
    stage: "materials",
    description: "Designs ECOCOMP material formulations, optimises sustainability metrics, and recommends supplier options.",
  },
  simulation_engineer: {
    id: "simulation_engineer",
    name: "Simulation Engineer",
    stage: "simulation",
    description: "Plans FEA, thermal, and fatigue simulation strategies, interprets results, and drives iteration loops.",
  },
  manufacturing_planner: {
    id: "manufacturing_planner",
    name: "Manufacturing Planner",
    stage: "manufacturing",
    description: "Develops UK prototyping and China-scale production strategies with cost and feasibility analysis.",
  },
  validation_engineer: {
    id: "validation_engineer",
    name: "Validation Engineer",
    stage: "validation",
    description: "Defines testing protocols, compliance standards, and lifecycle analysis requirements.",
  },
  ip_generator: {
    id: "ip_generator",
    name: "IP Generator",
    stage: "ip",
    description: "Generates patent claims, prior art analysis, and technical IP documentation.",
  },
} as const;

const STAGE_ORDER = ["opportunity","concept","materials","simulation","prototype","manufacturing","validation","ip"] as const;

// ─── Agent Prompt Builder ─────────────────────────────────────────────────────

function buildAgentPrompt(agentId: keyof typeof AGENTS, project: any, stageData: any): string {
  const agent = AGENTS[agentId];
  const baseContext = `
You are the ${agent.name} agent in the EcoRace Lab engineering workflow system.
EcoRace Lab is an advanced materials and engineering innovation lab focused on sustainable, high-performance products for eco-sport and performance markets.

PROJECT CONTEXT:
- Project: ${project.title}
- Description: ${project.description || "N/A"}
- Problem Statement: ${project.problemStatement || "N/A"}
- Market Requirements: ${project.marketReqs || "N/A"}
- Technical Requirements: ${project.technicalReqs || "N/A"}
- Current Stage: ${project.currentStage}
- Priority: ${project.priority}
`;

  const prompts: Record<string, string> = {
    opportunity_translator: `${baseContext}

OBJECTIVE: Translate the problem statement and requirements into a structured engineering brief.

OUTPUT FORMAT (JSON):
{
  "engineeringBrief": {
    "coreProblem": "...",
    "targetUsers": "...",
    "performanceRequirements": ["..."],
    "sustainabilityRequirements": ["..."],
    "regulatoryConstraints": ["..."],
    "marketOpportunitySize": "...",
    "competitiveLandscape": "...",
    "successCriteria": ["..."]
  },
  "technicalFeasibility": {
    "score": 0-10,
    "rationale": "...",
    "keyRisks": ["..."],
    "enablers": ["..."]
  },
  "recommendedApproach": "...",
  "nextStageInputs": "..."
}`,

    concept_engineer: `${baseContext}

STAGE INPUT: ${JSON.stringify(stageData || {})}

OBJECTIVE: Generate 3 engineering concepts with performance targets and feasibility assessment.

OUTPUT FORMAT (JSON):
{
  "concepts": [
    {
      "id": "C1",
      "name": "...",
      "description": "...",
      "workingPrinciple": "...",
      "performanceTargets": {
        "strength": "...",
        "weight": "...",
        "durability": "...",
        "sustainability": "..."
      },
      "feasibilityScore": 0-10,
      "trlLevel": 1-9,
      "pros": ["..."],
      "cons": ["..."],
      "estimatedDevelopmentTime": "..."
    }
  ],
  "recommendedConcept": "C1|C2|C3",
  "rationale": "...",
  "nextStageInputs": "..."
}`,

    materials_scientist: `${baseContext}

STAGE INPUT: ${JSON.stringify(stageData || {})}

OBJECTIVE: Design ECOCOMP material formulations with sustainability optimisation for eco-sport applications.

OUTPUT FORMAT (JSON):
{
  "primaryFormulation": {
    "name": "...",
    "category": "composite|polymer|bio_based|recycled|hybrid",
    "composition": "...",
    "sustainabilityScore": 0-100,
    "recycledContentPct": 0-100,
    "carbonFootprint": "kg CO2e/kg",
    "mechanicalProperties": {
      "tensileStrength": "MPa",
      "density": "g/cm3",
      "thermalRating": "°C"
    },
    "processingMethod": "...",
    "estimatedCostPerKg": "£...",
    "recommendedSuppliers": ["..."]
  },
  "alternativeFormulations": [
    { "name": "...", "tradeoffs": "..." }
  ],
  "certifications": ["..."],
  "sustainabilityOptimisationNotes": "...",
  "nextStageInputs": "..."
}`,

    simulation_engineer: `${baseContext}

STAGE INPUT: ${JSON.stringify(stageData || {})}

OBJECTIVE: Define simulation strategy and interpret results for FEA, thermal, and fatigue analysis.

OUTPUT FORMAT (JSON):
{
  "simulationPlan": [
    {
      "type": "fea|thermal|fatigue|cfd|impact|vibration|lifecycle",
      "title": "...",
      "objective": "...",
      "softwareTool": "ANSYS|Abaqus|SolidWorks|OpenFOAM",
      "inputParameters": "...",
      "expectedResults": "...",
      "passThreshold": "...",
      "safetyFactor": "..."
    }
  ],
  "iterationStrategy": "...",
  "criticalLoadCases": ["..."],
  "validationApproach": "...",
  "nextStageInputs": "..."
}`,

    manufacturing_planner: `${baseContext}

STAGE INPUT: ${JSON.stringify(stageData || {})}

OBJECTIVE: Develop UK prototyping and China-scale production strategy.

OUTPUT FORMAT (JSON):
{
  "ukPrototyping": {
    "facility": "...",
    "process": "...",
    "timeline": "...",
    "costEstimate": "£...",
    "toolingRequired": ["..."],
    "qualityChecks": ["..."]
  },
  "chinaScaleProduction": {
    "recommendedRegion": "...",
    "process": "...",
    "moq": "...",
    "unitCostTarget": "£...",
    "leadTime": "...",
    "certifications": ["..."],
    "riskMitigation": ["..."]
  },
  "supplyChainStrategy": "...",
  "manufacturingFeasibilityScore": 0-10,
  "nextStageInputs": "..."
}`,

    validation_engineer: `${baseContext}

STAGE INPUT: ${JSON.stringify(stageData || {})}

OBJECTIVE: Define testing protocols, compliance standards, and lifecycle analysis.

OUTPUT FORMAT (JSON):
{
  "testingProtocols": [
    {
      "type": "performance|compliance|lifecycle|safety|market|technical",
      "title": "...",
      "standard": "ISO|EN|ASTM|BS...",
      "method": "...",
      "passThreshold": "...",
      "priority": "critical|high|medium|low"
    }
  ],
  "complianceRequirements": ["..."],
  "lifecycleAnalysis": {
    "expectedLifespan": "...",
    "endOfLifeStrategy": "...",
    "recyclabilityScore": 0-100
  },
  "validationRoadmap": "...",
  "nextStageInputs": "..."
}`,

    ip_generator: `${baseContext}

STAGE INPUT: ${JSON.stringify(stageData || {})}

OBJECTIVE: Generate patent claims, prior art analysis, and IP documentation for the innovation.

OUTPUT FORMAT (JSON):
{
  "ipStrategy": {
    "primaryIpType": "patent|trade_secret|design_right",
    "noveltyStatement": "...",
    "inventiveStep": "...",
    "industrialApplicability": "..."
  },
  "patentClaims": {
    "independentClaim1": "...",
    "independentClaim2": "...",
    "dependentClaims": ["..."]
  },
  "priorArtSearch": {
    "relevantPatents": ["..."],
    "differentiators": ["..."],
    "freedomToOperate": "clear|risk|blocked"
  },
  "technicalDocumentation": "...",
  "recommendedJurisdictions": ["UK","EU","US","CN"],
  "filingTimeline": "..."
}`,
  };

  return prompts[agentId] || baseContext;
}

// ─── Projects Sub-Router ──────────────────────────────────────────────────────

const projectsRouter = router({
  list: protectedProcedure
    .input(z.object({ ventureId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const q = db.select().from(erlProjects).orderBy(desc(erlProjects.updatedAt));
      if (input?.ventureId) {
        return await db.select().from(erlProjects)
          .where(eq(erlProjects.ventureId, input.ventureId))
          .orderBy(desc(erlProjects.updatedAt));
      }
      return await q;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [project] = await db.select().from(erlProjects)
        .where(eq(erlProjects.id, input.id)).limit(1);
      return project ?? null;
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      offeringId: z.number().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      problemStatement: z.string().optional(),
      marketReqs: z.string().optional(),
      technicalReqs: z.string().optional(),
      status: z.enum(["draft","active","on_hold","completed","archived"]).optional(),
      currentStage: z.enum(["opportunity","concept","materials","simulation","prototype","manufacturing","validation","ip"]).optional(),
      priority: z.enum(["low","medium","high","critical"]).optional(),
      targetCompletionDate: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...data } = input;
      if (id) {
        await db.update(erlProjects).set(data).where(eq(erlProjects.id, id));
        const [updated] = await db.select().from(erlProjects).where(eq(erlProjects.id, id)).limit(1);
        return updated;
      }
      const [result] = await db.insert(erlProjects).values(data as any);
      const [created] = await db.select().from(erlProjects).where(eq(erlProjects.id, (result as any).insertId)).limit(1);
      return created;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(erlProjects).where(eq(erlProjects.id, input.id));
      return { success: true };
    }),

  summary: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return { total: 0, active: 0, completed: 0, byStage: {}, byPriority: {} };
      const projects = await db.select().from(erlProjects);
      const total = projects.length;
      const active = projects.filter(p => p.status === "active").length;
      const completed = projects.filter(p => p.status === "completed").length;
      const byStage = STAGE_ORDER.reduce((acc, s) => {
        acc[s] = projects.filter(p => p.currentStage === s).length;
        return acc;
      }, {} as Record<string, number>);
      const byPriority = ["low","medium","high","critical"].reduce((acc, p) => {
        acc[p] = projects.filter(proj => proj.priority === p).length;
        return acc;
      }, {} as Record<string, number>);
      return { total, active, completed, byStage, byPriority };
    }),
});

// ─── Stages Sub-Router ────────────────────────────────────────────────────────

const stagesRouter = router({
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(erlStages)
        .where(eq(erlStages.projectId, input.projectId))
        .orderBy(erlStages.stage);
    }),

  get: protectedProcedure
    .input(z.object({ projectId: z.number(), stage: z.enum(["opportunity","concept","materials","simulation","prototype","manufacturing","validation","ip"]) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [s] = await db.select().from(erlStages)
        .where(and(eq(erlStages.projectId, input.projectId), eq(erlStages.stage, input.stage)))
        .limit(1);
      return s ?? null;
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending","in_progress","human_review","completed","blocked"]),
      humanApproved: z.boolean().optional(),
      humanNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...data } = input;
      const completedAt = data.status === "completed" ? new Date() : undefined;
      await db.update(erlStages).set({ ...data, ...(completedAt ? { completedAt } : {}) }).where(eq(erlStages.id, id));
      const [updated] = await db.select().from(erlStages).where(eq(erlStages.id, id)).limit(1);
      return updated;
    }),

  runAgent: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      stage: z.enum(["opportunity","concept","materials","simulation","prototype","manufacturing","validation","ip"]),
      additionalContext: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Load project
      const [project] = await db.select().from(erlProjects)
        .where(eq(erlProjects.id, input.projectId)).limit(1);
      if (!project) throw new Error("Project not found");

      // Load previous stage output for context
      const stageIdx = STAGE_ORDER.indexOf(input.stage as any);
      let prevStageData: any = null;
      if (stageIdx > 0) {
        const prevStage = STAGE_ORDER[stageIdx - 1];
        const [prev] = await db.select().from(erlStages)
          .where(and(eq(erlStages.projectId, input.projectId), eq(erlStages.stage, prevStage)))
          .limit(1);
        if (prev?.outputData) {
          try { prevStageData = JSON.parse(prev.outputData); } catch {}
        }
      }

      // Map stage to agent
      const agentMap: Record<string, keyof typeof AGENTS> = {
        opportunity: "opportunity_translator",
        concept: "concept_engineer",
        materials: "materials_scientist",
        simulation: "simulation_engineer",
        prototype: "concept_engineer", // reuse concept engineer for prototype
        manufacturing: "manufacturing_planner",
        validation: "validation_engineer",
        ip: "ip_generator",
      };
      const agentId = agentMap[input.stage];
      const agent = AGENTS[agentId];
      const prompt = buildAgentPrompt(agentId, project, prevStageData);
      const fullPrompt = input.additionalContext
        ? `${prompt}\n\nADDITIONAL CONTEXT: ${input.additionalContext}`
        : prompt;

      const startTime = Date.now();

      // Upsert the stage record to in_progress
      const [existingStage] = await db.select().from(erlStages)
        .where(and(eq(erlStages.projectId, input.projectId), eq(erlStages.stage, input.stage)))
        .limit(1);

      let stageId: number;
      if (existingStage) {
        await db.update(erlStages).set({
          status: "in_progress",
          agentId: agent.id,
          iterationCount: (existingStage.iterationCount ?? 0) + 1,
        }).where(eq(erlStages.id, existingStage.id));
        stageId = existingStage.id;
      } else {
        const [ins] = await db.insert(erlStages).values({
          projectId: input.projectId,
          stage: input.stage,
          status: "in_progress",
          agentId: agent.id,
          iterationCount: 1,
        } as any);
        stageId = (ins as any).insertId;
      }

      // Run AI agent
      let outputJson = "";
      let aiNarrative = "";
      let agentStatus: "completed" | "failed" = "completed";
      let errorMessage = "";

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a specialist engineering AI agent for EcoRace Lab. Always respond with valid JSON matching the requested output format. Be specific, technical, and actionable." },
            { role: "user", content: fullPrompt },
          ],
        });
        outputJson = String(response.choices?.[0]?.message?.content ?? "{}");
        // Extract a human-readable narrative from the JSON
        try {
          const parsed = JSON.parse(outputJson);
          aiNarrative = parsed.recommendedApproach || parsed.rationale || parsed.sustainabilityOptimisationNotes || parsed.supplyChainStrategy || parsed.validationRoadmap || parsed.ipStrategy?.noveltyStatement || "Analysis complete.";
        } catch {
          aiNarrative = outputJson.slice(0, 500);
        }
      } catch (err: any) {
        agentStatus = "failed";
        errorMessage = err?.message ?? "Unknown error";
        outputJson = JSON.stringify({ error: errorMessage });
      }

      const durationMs = Date.now() - startTime;

      // Update stage with output
      await db.update(erlStages).set({
        status: agentStatus === "completed" ? "human_review" : "blocked",
        outputData: outputJson,
        aiNarrative,
      }).where(eq(erlStages.id, stageId));

      // Log agent run
      await db.insert(erlAgentRuns).values({
        projectId: input.projectId,
        stageId,
        agentId: agent.id,
        agentName: agent.name,
        promptUsed: fullPrompt.slice(0, 4000),
        inputContext: JSON.stringify(prevStageData ?? {}).slice(0, 2000),
        outputJson: outputJson.slice(0, 8000),
        durationMs,
        status: agentStatus,
        errorMessage: errorMessage || undefined,
      } as any);

      // Update project current stage if advancing
      await db.update(erlProjects).set({ currentStage: input.stage }).where(eq(erlProjects.id, input.projectId));

      const [updatedStage] = await db.select().from(erlStages).where(eq(erlStages.id, stageId)).limit(1);
      return { stage: updatedStage, agentStatus, durationMs };
    }),
});

// ─── Materials Sub-Router ─────────────────────────────────────────────────────

const materialsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      if (input?.projectId) {
        return await db.select().from(erlMaterials)
          .where(eq(erlMaterials.projectId, input.projectId))
          .orderBy(desc(erlMaterials.sustainabilityScore));
      }
      return await db.select().from(erlMaterials).orderBy(desc(erlMaterials.createdAt));
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      projectId: z.number().optional(),
      name: z.string().min(1),
      category: z.enum(["polymer","composite","metal","ceramic","bio_based","recycled","nano","hybrid"]).optional(),
      formulation: z.string().optional(),
      sustainabilityScore: z.number().min(0).max(100).optional(),
      recycledContent: z.number().min(0).max(100).optional(),
      carbonFootprint: z.string().optional(),
      tensileStrength: z.string().optional(),
      density: z.string().optional(),
      thermalRating: z.string().optional(),
      costPerKg: z.number().optional(),
      supplier: z.string().optional(),
      certifications: z.string().optional(),
      aiGenerated: z.boolean().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...data } = input;
      if (id) {
        await db.update(erlMaterials).set(data).where(eq(erlMaterials.id, id));
        const [u] = await db.select().from(erlMaterials).where(eq(erlMaterials.id, id)).limit(1);
        return u;
      }
      const [r] = await db.insert(erlMaterials).values(data as any);
      const [c] = await db.select().from(erlMaterials).where(eq(erlMaterials.id, (r as any).insertId)).limit(1);
      return c;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(erlMaterials).where(eq(erlMaterials.id, input.id));
      return { success: true };
    }),

  generateFromStage: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Get the materials stage output
      const [matStage] = await db.select().from(erlStages)
        .where(and(eq(erlStages.projectId, input.projectId), eq(erlStages.stage, "materials")))
        .limit(1);
      if (!matStage?.outputData) throw new Error("Run the Materials Scientist agent first");

      let parsed: any = {};
      try { parsed = JSON.parse(matStage.outputData); } catch {}

      const pf = parsed.primaryFormulation;
      if (!pf) throw new Error("No primary formulation found in stage output");

      const [r] = await db.insert(erlMaterials).values({
        projectId: input.projectId,
        name: pf.name ?? "AI Generated Material",
        category: pf.category ?? "composite",
        formulation: pf.composition,
        sustainabilityScore: pf.sustainabilityScore ?? 0,
        recycledContent: pf.recycledContentPct ?? 0,
        carbonFootprint: pf.carbonFootprint,
        tensileStrength: pf.mechanicalProperties?.tensileStrength,
        density: pf.mechanicalProperties?.density,
        thermalRating: pf.mechanicalProperties?.thermalRating,
        supplier: (pf.recommendedSuppliers ?? []).join(", "),
        certifications: (parsed.certifications ?? []).join(", "),
        aiGenerated: true,
        notes: parsed.sustainabilityOptimisationNotes,
      } as any);

      const [created] = await db.select().from(erlMaterials).where(eq(erlMaterials.id, (r as any).insertId)).limit(1);
      return created;
    }),
});

// ─── Simulations Sub-Router ───────────────────────────────────────────────────

const simulationsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(erlSimulations)
        .where(eq(erlSimulations.projectId, input.projectId))
        .orderBy(desc(erlSimulations.createdAt));
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      projectId: z.number(),
      stageId: z.number().optional(),
      simType: z.enum(["fea","thermal","fatigue","cfd","impact","vibration","lifecycle"]),
      title: z.string().min(1),
      softwareTool: z.string().optional(),
      inputParams: z.string().optional(),
      results: z.string().optional(),
      aiAnalysis: z.string().optional(),
      passedValidation: z.boolean().optional(),
      safetyFactor: z.string().optional(),
      iterationNumber: z.number().optional(),
      status: z.enum(["queued","running","completed","failed","needs_iteration"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...data } = input;
      if (id) {
        await db.update(erlSimulations).set(data).where(eq(erlSimulations.id, id));
        const [u] = await db.select().from(erlSimulations).where(eq(erlSimulations.id, id)).limit(1);
        return u;
      }
      const [r] = await db.insert(erlSimulations).values(data as any);
      const [c] = await db.select().from(erlSimulations).where(eq(erlSimulations.id, (r as any).insertId)).limit(1);
      return c;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(erlSimulations).where(eq(erlSimulations.id, input.id));
      return { success: true };
    }),

  generatePlan: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const [simStage] = await db.select().from(erlStages)
        .where(and(eq(erlStages.projectId, input.projectId), eq(erlStages.stage, "simulation")))
        .limit(1);
      if (!simStage?.outputData) throw new Error("Run the Simulation Engineer agent first");

      let parsed: any = {};
      try { parsed = JSON.parse(simStage.outputData); } catch {}

      const plan = parsed.simulationPlan ?? [];
      const created = [];
      for (const sim of plan) {
        const [r] = await db.insert(erlSimulations).values({
          projectId: input.projectId,
          stageId: simStage.id,
          simType: sim.type ?? "fea",
          title: sim.title ?? "Simulation",
          softwareTool: sim.softwareTool,
          inputParams: sim.inputParameters,
          aiAnalysis: sim.objective,
          safetyFactor: sim.safetyFactor,
          status: "queued",
        } as any);
        const [c] = await db.select().from(erlSimulations).where(eq(erlSimulations.id, (r as any).insertId)).limit(1);
        created.push(c);
      }
      return created;
    }),
});

// ─── IP Assets Sub-Router ─────────────────────────────────────────────────────

const ipRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(erlIpAssets)
        .where(eq(erlIpAssets.projectId, input.projectId))
        .orderBy(desc(erlIpAssets.createdAt));
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      projectId: z.number(),
      title: z.string().min(1),
      ipType: z.enum(["patent","trade_secret","design_right","copyright","trademark","know_how"]).optional(),
      claimsJson: z.string().optional(),
      technicalSummary: z.string().optional(),
      noveltyStatement: z.string().optional(),
      priorArtSearch: z.string().optional(),
      draftClaims: z.string().optional(),
      filingStatus: z.enum(["draft","review","filed","granted","rejected","abandoned"]).optional(),
      filingDate: z.date().optional(),
      grantDate: z.date().optional(),
      jurisdiction: z.string().optional(),
      aiGenerated: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...data } = input;
      if (id) {
        await db.update(erlIpAssets).set(data).where(eq(erlIpAssets.id, id));
        const [u] = await db.select().from(erlIpAssets).where(eq(erlIpAssets.id, id)).limit(1);
        return u;
      }
      const [r] = await db.insert(erlIpAssets).values(data as any);
      const [c] = await db.select().from(erlIpAssets).where(eq(erlIpAssets.id, (r as any).insertId)).limit(1);
      return c;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(erlIpAssets).where(eq(erlIpAssets.id, input.id));
      return { success: true };
    }),

  generateFromStage: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const [ipStage] = await db.select().from(erlStages)
        .where(and(eq(erlStages.projectId, input.projectId), eq(erlStages.stage, "ip")))
        .limit(1);
      if (!ipStage?.outputData) throw new Error("Run the IP Generator agent first");

      let parsed: any = {};
      try { parsed = JSON.parse(ipStage.outputData); } catch {}

      const [project] = await db.select().from(erlProjects)
        .where(eq(erlProjects.id, input.projectId)).limit(1);

      const [r] = await db.insert(erlIpAssets).values({
        projectId: input.projectId,
        title: `Patent: ${project?.title ?? "Innovation"}`,
        ipType: parsed.ipStrategy?.primaryIpType ?? "patent",
        claimsJson: JSON.stringify(parsed.patentClaims ?? {}),
        technicalSummary: parsed.technicalDocumentation,
        noveltyStatement: parsed.ipStrategy?.noveltyStatement,
        priorArtSearch: JSON.stringify(parsed.priorArtSearch ?? {}),
        draftClaims: parsed.patentClaims?.independentClaim1,
        filingStatus: "draft",
        jurisdiction: (parsed.recommendedJurisdictions ?? ["UK"]).join(", "),
        aiGenerated: true,
      } as any);

      const [created] = await db.select().from(erlIpAssets).where(eq(erlIpAssets.id, (r as any).insertId)).limit(1);
      return created;
    }),
});

// ─── Validation Logs Sub-Router ───────────────────────────────────────────────

const validationRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(erlValidationLogs)
        .where(eq(erlValidationLogs.projectId, input.projectId))
        .orderBy(desc(erlValidationLogs.createdAt));
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      projectId: z.number(),
      stageId: z.number().optional(),
      validationType: z.enum(["performance","compliance","lifecycle","safety","market","technical"]),
      title: z.string().min(1),
      standard: z.string().optional(),
      testMethod: z.string().optional(),
      results: z.string().optional(),
      passed: z.boolean().optional(),
      score: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...data } = input;
      if (id) {
        await db.update(erlValidationLogs).set(data).where(eq(erlValidationLogs.id, id));
        const [u] = await db.select().from(erlValidationLogs).where(eq(erlValidationLogs.id, id)).limit(1);
        return u;
      }
      const [r] = await db.insert(erlValidationLogs).values(data as any);
      const [c] = await db.select().from(erlValidationLogs).where(eq(erlValidationLogs.id, (r as any).insertId)).limit(1);
      return c;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(erlValidationLogs).where(eq(erlValidationLogs.id, input.id));
      return { success: true };
    }),

  generateFromStage: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const [valStage] = await db.select().from(erlStages)
        .where(and(eq(erlStages.projectId, input.projectId), eq(erlStages.stage, "validation")))
        .limit(1);
      if (!valStage?.outputData) throw new Error("Run the Validation Engineer agent first");

      let parsed: any = {};
      try { parsed = JSON.parse(valStage.outputData); } catch {}

      const protocols = parsed.testingProtocols ?? [];
      const created = [];
      for (const p of protocols) {
        const [r] = await db.insert(erlValidationLogs).values({
          projectId: input.projectId,
          stageId: valStage.id,
          validationType: p.type ?? "technical",
          title: p.title ?? "Validation Test",
          standard: p.standard,
          testMethod: p.method,
          notes: p.priority,
        } as any);
        const [c] = await db.select().from(erlValidationLogs).where(eq(erlValidationLogs.id, (r as any).insertId)).limit(1);
        created.push(c);
      }
      return created;
    }),
});

// ─── Agent Runs Sub-Router ────────────────────────────────────────────────────

const agentRunsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const runs = await db.select().from(erlAgentRuns)
        .where(eq(erlAgentRuns.projectId, input.projectId))
        .orderBy(desc(erlAgentRuns.createdAt))
        .limit(input.limit ?? 50);
      return runs;
    }),

  getAgentDefinitions: protectedProcedure
    .query(() => {
      return Object.values(AGENTS);
    }),
});

// ─── Dashboard Sub-Router ─────────────────────────────────────────────────────

const dashboardRouter = router({
  get: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [project] = await db.select().from(erlProjects)
        .where(eq(erlProjects.id, input.projectId)).limit(1);
      if (!project) return null;

      const stages = await db.select().from(erlStages)
        .where(eq(erlStages.projectId, input.projectId));
      const materials = await db.select().from(erlMaterials)
        .where(eq(erlMaterials.projectId, input.projectId));
      const simulations = await db.select().from(erlSimulations)
        .where(eq(erlSimulations.projectId, input.projectId));
      const ipAssets = await db.select().from(erlIpAssets)
        .where(eq(erlIpAssets.projectId, input.projectId));
      const validations = await db.select().from(erlValidationLogs)
        .where(eq(erlValidationLogs.projectId, input.projectId));
      const agentRuns = await db.select().from(erlAgentRuns)
        .where(eq(erlAgentRuns.projectId, input.projectId))
        .orderBy(desc(erlAgentRuns.createdAt)).limit(10);

      const stageProgress = STAGE_ORDER.map(s => {
        const stageRecord = stages.find(st => st.stage === s);
        return {
          stage: s,
          status: stageRecord?.status ?? "pending",
          humanApproved: stageRecord?.humanApproved ?? false,
          iterationCount: stageRecord?.iterationCount ?? 0,
          hasOutput: Boolean(stageRecord?.outputData),
        };
      });

      const completedStages = stageProgress.filter(s => s.status === "completed").length;
      const progressPct = Math.round((completedStages / STAGE_ORDER.length) * 100);

      return {
        project,
        stageProgress,
        progressPct,
        completedStages,
        totalStages: STAGE_ORDER.length,
        materials,
        simulations,
        ipAssets,
        validations,
        recentAgentRuns: agentRuns,
        stats: {
          materialsCount: materials.length,
          simulationsCount: simulations.length,
          simulationsPassedCount: simulations.filter(s => s.passedValidation).length,
          ipAssetsCount: ipAssets.length,
          validationsCount: validations.length,
          validationsPassedCount: validations.filter(v => v.passed).length,
          agentRunsCount: agentRuns.length,
        },
      };
    }),
});

// ─── Main Export ──────────────────────────────────────────────────────────────

export const ecoraceLab = router({
  projects: projectsRouter,
  stages: stagesRouter,
  materials: materialsRouter,
  simulations: simulationsRouter,
  ip: ipRouter,
  validation: validationRouter,
  agentRuns: agentRunsRouter,
  dashboard: dashboardRouter,
});
