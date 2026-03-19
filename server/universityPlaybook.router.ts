// ── University Playbook Router ─────────────────────────────────────────────────
// Covers: partners, research projects, talent roles, venture workflows,
//         industry engagements, governance docs, data sources, roadmap milestones

import { dispatchTrigger } from "./workflowEngine";
import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { eq as eqOp, and, desc } from "drizzle-orm";
import {
  uniPartners,
  uniResearchProjects,
  uniTalentRoles,
  uniVentureWorkflows,
  uniIndustryEngagements,
  uniGovernanceDocs,
  uniDataSources,
  uniRoadmapMilestones,
} from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";

// ── Partners ──────────────────────────────────────────────────────────────────
export const uniPartnersRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db.select().from(uniPartners).where(eqOp(uniPartners.ventureId, input.ventureId)).orderBy(desc(uniPartners.createdAt));
    }),

  upsert: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string(),
      name: z.string().min(1),
      type: z.enum(["university", "research_institute", "polytechnic", "industry_lab"]).default("university"),
      country: z.string().optional(),
      department: z.string().optional(),
      contactName: z.string().optional(),
      contactEmail: z.string().optional(),
      partnershipType: z.enum(["research", "talent", "commercialisation", "sponsored", "internship"]).default("research"),
      status: z.enum(["active", "inactive", "pending", "negotiating"]).default("active"),
      startDate: z.number().optional(),
      endDate: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const { id, ...data } = input;
      if (id) {
        await db.update(uniPartners).set({ ...data, updatedAt: new Date() }).where(eqOp(uniPartners.id, id));
        return { id };
      }
      const [result] = await db.insert(uniPartners).values(data);
      return { id: result.insertId };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(uniPartners).where(eqOp(uniPartners.id, input.id));
      return { success: true };
    }),
});

// ── Research Projects ─────────────────────────────────────────────────────────
export const uniResearchRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db.select().from(uniResearchProjects).where(eqOp(uniResearchProjects.ventureId, input.ventureId)).orderBy(desc(uniResearchProjects.createdAt));
    }),

  upsert: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string(),
      partnerId: z.number().optional(),
      title: z.string().min(1),
      researchType: z.enum(["business", "technical", "applied"]).default("business"),
      description: z.string().optional(),
      objective: z.string().optional(),
      methodology: z.string().optional(),
      status: z.enum(["planned", "active", "completed", "published", "paused"]).default("planned"),
      leadResearcher: z.string().optional(),
      startDate: z.number().optional(),
      endDate: z.number().optional(),
      budget: z.string().optional(),
      publicationUrl: z.string().optional(),
      keyFindings: z.string().optional(),
      trlImpact: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const { id, ...data } = input;
      if (id) {
        await db.update(uniResearchProjects).set({ ...data, updatedAt: new Date() }).where(eqOp(uniResearchProjects.id, id));
        // Fire workflow trigger if research is completed or published
        if (data.status === 'completed' || data.status === 'published') {
          dispatchTrigger('research_completed', id).catch(console.error);
        }
        return { id };
      }
      const [result] = await db.insert(uniResearchProjects).values(data);
      const newId = result.insertId as number;
      if (data.status === 'completed' || data.status === 'published') {
        dispatchTrigger('research_completed', newId).catch(console.error);
      }
      return { id: newId };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(uniResearchProjects).where(eqOp(uniResearchProjects.id, input.id));
      return { success: true };
    }),

  generateSummary: publicProcedure
    .input(z.object({ title: z.string(), objective: z.string(), researchType: z.string() }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an academic research assistant. Generate a concise 3-4 sentence research summary and list 3 key expected findings. Return as JSON: { summary: string, keyFindings: string[] }" },
          { role: "user", content: `Research title: ${input.title}\nType: ${input.researchType}\nObjective: ${input.objective}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "research_summary",
            strict: true,
            schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                keyFindings: { type: "array", items: { type: "string" } },
              },
              required: ["summary", "keyFindings"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0].message.content;
      return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
    }),
});

// ── Talent Roles ──────────────────────────────────────────────────────────────
export const uniTalentRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db.select().from(uniTalentRoles).where(eqOp(uniTalentRoles.ventureId, input.ventureId)).orderBy(desc(uniTalentRoles.createdAt));
    }),

  upsert: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string(),
      partnerId: z.number().optional(),
      name: z.string().min(1),
      roleType: z.enum(["student", "academic", "industry_expert", "venture_lead"]).default("student"),
      institution: z.string().optional(),
      skills: z.string().optional(),
      availability: z.enum(["full_time", "part_time", "advisory", "internship"]).optional(),
      assignedProject: z.string().optional(),
      stipend: z.string().optional(),
      startDate: z.number().optional(),
      endDate: z.number().optional(),
      status: z.enum(["active", "inactive", "onboarding", "completed"]).default("active"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const { id, ...data } = input;
      if (id) {
        await db.update(uniTalentRoles).set({ ...data, updatedAt: new Date() }).where(eqOp(uniTalentRoles.id, id));
        return { id };
      }
      const [result] = await db.insert(uniTalentRoles).values(data);
      return { id: result.insertId };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(uniTalentRoles).where(eqOp(uniTalentRoles.id, input.id));
      return { success: true };
    }),
});

// ── Venture Workflows ─────────────────────────────────────────────────────────
export const uniWorkflowRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db.select().from(uniVentureWorkflows).where(eqOp(uniVentureWorkflows.ventureId, input.ventureId)).orderBy(desc(uniVentureWorkflows.createdAt));
    }),

  upsert: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string(),
      projectName: z.string().min(1),
      stage: z.enum(["problem_definition", "research_discovery", "hypothesis_development", "validation", "commercialisation"]).default("problem_definition"),
      problemStatement: z.string().optional(),
      researchFindings: z.string().optional(),
      hypothesis: z.string().optional(),
      validationMethod: z.string().optional(),
      validationResult: z.enum(["confirmed", "refuted", "inconclusive", "pending"]).optional(),
      commercialisationPlan: z.string().optional(),
      linkedResearchId: z.number().optional(),
      stageGatePassed: z.boolean().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const { id, ...data } = input;
      if (id) {
        await db.update(uniVentureWorkflows).set({ ...data, updatedAt: new Date() }).where(eqOp(uniVentureWorkflows.id, id));
        return { id };
      }
      const [result] = await db.insert(uniVentureWorkflows).values(data);
      return { id: result.insertId };
    }),

  advanceStage: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const stages = ["problem_definition", "research_discovery", "hypothesis_development", "validation", "commercialisation"] as const;
      const [workflow] = await db.select().from(uniVentureWorkflows).where(eqOp(uniVentureWorkflows.id, input.id));
      if (!workflow) throw new Error("Workflow not found");
      const currentIndex = stages.indexOf(workflow.stage as typeof stages[number]);
      if (currentIndex < stages.length - 1) {
        const nextStage = stages[currentIndex + 1];
        await db.update(uniVentureWorkflows).set({ stage: nextStage, stageGatePassed: true, updatedAt: new Date() }).where(eqOp(uniVentureWorkflows.id, input.id));
      }
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(uniVentureWorkflows).where(eqOp(uniVentureWorkflows.id, input.id));
      return { success: true };
    }),
});

// ── Industry Engagements ──────────────────────────────────────────────────────
export const uniIndustryRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db.select().from(uniIndustryEngagements).where(eqOp(uniIndustryEngagements.ventureId, input.ventureId)).orderBy(desc(uniIndustryEngagements.createdAt));
    }),

  upsert: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string(),
      companyName: z.string().min(1),
      engagementType: z.enum(["sponsored_research", "consulting", "venture_partnership", "internship_pipeline", "joint_ip"]).default("sponsored_research"),
      description: z.string().optional(),
      contactName: z.string().optional(),
      contactEmail: z.string().optional(),
      value: z.string().optional(),
      status: z.enum(["active", "completed", "negotiating", "paused", "cancelled"]).default("active"),
      startDate: z.number().optional(),
      endDate: z.number().optional(),
      deliverables: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const { id, ...data } = input;
      if (id) {
        await db.update(uniIndustryEngagements).set({ ...data, updatedAt: new Date() }).where(eqOp(uniIndustryEngagements.id, id));
        return { id };
      }
      const [result] = await db.insert(uniIndustryEngagements).values(data);
      return { id: result.insertId };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(uniIndustryEngagements).where(eqOp(uniIndustryEngagements.id, input.id));
      return { success: true };
    }),
});

// ── Governance Documents ──────────────────────────────────────────────────────
export const uniGovernanceRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db.select().from(uniGovernanceDocs).where(eqOp(uniGovernanceDocs.ventureId, input.ventureId)).orderBy(desc(uniGovernanceDocs.createdAt));
    }),

  upsert: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string(),
      docType: z.enum(["student_agreement", "ip_agreement", "nda", "ethics_approval", "data_protection", "collaboration_agreement"]).default("student_agreement"),
      title: z.string().min(1),
      parties: z.string().optional(),
      status: z.enum(["draft", "under_review", "signed", "expired", "rejected"]).default("draft"),
      signedDate: z.number().optional(),
      expiryDate: z.number().optional(),
      documentUrl: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const { id, ...data } = input;
      if (id) {
        await db.update(uniGovernanceDocs).set({ ...data, updatedAt: new Date() }).where(eqOp(uniGovernanceDocs.id, id));
        return { id };
      }
      const [result] = await db.insert(uniGovernanceDocs).values(data);
      return { id: result.insertId };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(uniGovernanceDocs).where(eqOp(uniGovernanceDocs.id, input.id));
      return { success: true };
    }),
});

// ── Data Sources ──────────────────────────────────────────────────────────────
export const uniDataRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db.select().from(uniDataSources).where(eqOp(uniDataSources.ventureId, input.ventureId)).orderBy(desc(uniDataSources.createdAt));
    }),

  upsert: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string(),
      sourceType: z.enum(["interview", "survey", "secondary_research", "ai_analysis", "focus_group", "observation"]).default("interview"),
      title: z.string().min(1),
      description: z.string().optional(),
      sampleSize: z.number().optional(),
      collectionMethod: z.string().optional(),
      status: z.enum(["planned", "in_progress", "completed", "analysed"]).default("planned"),
      dataUrl: z.string().optional(),
      keyInsights: z.string().optional(),
      aiAnalysisDone: z.boolean().optional(),
      linkedHypothesis: z.string().optional(),
      collectedAt: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const { id, ...data } = input;
      if (id) {
        await db.update(uniDataSources).set({ ...data, updatedAt: new Date() }).where(eqOp(uniDataSources.id, id));
        return { id };
      }
      const [result] = await db.insert(uniDataSources).values(data);
      return { id: result.insertId };
    }),

  analyseWithAI: publicProcedure
    .input(z.object({ id: z.number(), title: z.string(), description: z.string(), sourceType: z.string(), keyInsights: z.string().optional() }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a data analysis assistant. Analyse the provided research data source and generate a concise AI summary with 3-5 key insights. Return JSON: { aiSummary: string, insights: string[] }" },
          { role: "user", content: `Data source: ${input.title}\nType: ${input.sourceType}\nDescription: ${input.description}\nExisting insights: ${input.keyInsights || "None"}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "data_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                aiSummary: { type: "string" },
                insights: { type: "array", items: { type: "string" } },
              },
              required: ["aiSummary", "insights"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0].message.content;
      const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
      const db = (await getDb())!;
      await db.update(uniDataSources).set({ aiSummary: parsed.aiSummary, aiAnalysisDone: true, updatedAt: new Date() }).where(eqOp(uniDataSources.id, input.id));
      return parsed;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(uniDataSources).where(eqOp(uniDataSources.id, input.id));
      return { success: true };
    }),
});

// ── Roadmap Milestones ────────────────────────────────────────────────────────
export const uniRoadmapRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db.select().from(uniRoadmapMilestones).where(eqOp(uniRoadmapMilestones.ventureId, input.ventureId)).orderBy(uniRoadmapMilestones.targetDate);
    }),

  upsert: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string(),
      phase: z.enum(["setup", "pilot", "scale"]).default("setup"),
      title: z.string().min(1),
      description: z.string().optional(),
      owner: z.string().optional(),
      targetDate: z.number().optional(),
      completedDate: z.number().optional(),
      status: z.enum(["pending", "in_progress", "completed", "delayed", "cancelled"]).default("pending"),
      priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const { id, ...data } = input;
      if (id) {
        await db.update(uniRoadmapMilestones).set({ ...data, updatedAt: new Date() }).where(eqOp(uniRoadmapMilestones.id, id));
        return { id };
      }
      const [result] = await db.insert(uniRoadmapMilestones).values(data);
      return { id: result.insertId };
    }),

  complete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.update(uniRoadmapMilestones).set({ status: "completed", completedDate: Date.now(), updatedAt: new Date() }).where(eqOp(uniRoadmapMilestones.id, input.id));
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(uniRoadmapMilestones).where(eqOp(uniRoadmapMilestones.id, input.id));
      return { success: true };
    }),
});

// ── Summary ───────────────────────────────────────────────────────────────────
export const uniSummaryRouter = router({
  getSummary: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const [partners, research, talent, workflows, industry, governance, dataSources, milestones] = await Promise.all([
        db.select().from(uniPartners).where(eqOp(uniPartners.ventureId, input.ventureId)),
        db.select().from(uniResearchProjects).where(eqOp(uniResearchProjects.ventureId, input.ventureId)),
        db.select().from(uniTalentRoles).where(eqOp(uniTalentRoles.ventureId, input.ventureId)),
        db.select().from(uniVentureWorkflows).where(eqOp(uniVentureWorkflows.ventureId, input.ventureId)),
        db.select().from(uniIndustryEngagements).where(eqOp(uniIndustryEngagements.ventureId, input.ventureId)),
        db.select().from(uniGovernanceDocs).where(eqOp(uniGovernanceDocs.ventureId, input.ventureId)),
        db.select().from(uniDataSources).where(eqOp(uniDataSources.ventureId, input.ventureId)),
        db.select().from(uniRoadmapMilestones).where(eqOp(uniRoadmapMilestones.ventureId, input.ventureId)),
      ]);

      const activeResearch = research.filter(r => r.status === "active").length;
      const activePartners = partners.filter(p => p.status === "active").length;
      const activeTalent = talent.filter(t => t.status === "active").length;
      const signedDocs = governance.filter(g => g.status === "signed").length;
      const completedMilestones = milestones.filter(m => m.status === "completed").length;
      const totalMilestones = milestones.length;
      const industryValue = industry.reduce((sum, e) => sum + (parseFloat(String(e.value ?? "0")) || 0), 0);
      const workflowStages = workflows.reduce((acc, w) => {
        acc[w.stage] = (acc[w.stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalPartners: partners.length,
        activePartners,
        totalResearch: research.length,
        activeResearch,
        totalTalent: talent.length,
        activeTalent,
        totalWorkflows: workflows.length,
        workflowStages,
        totalIndustry: industry.length,
        industryValue,
        totalGovernance: governance.length,
        signedDocs,
        totalDataSources: dataSources.length,
        analysedDataSources: dataSources.filter(d => d.status === "analysed").length,
        completedMilestones,
        totalMilestones,
        roadmapProgress: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
      };
    }),
});
