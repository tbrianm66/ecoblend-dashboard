/**
 * Sprint 76 — Interview-to-Insight & Stage Gate Review Automation Router
 * EcoBlend V4 Architecture Brief — Section 3.5 & 3.6
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  insightTriggers,
  insightSummaries,
  stageGateReviews,
  stageGateEvidence,
  vrlActionsLog,
  vrlStageGates,
} from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

const STAGE_EVIDENCE_REQUIREMENTS: Record<string, Array<{ module: string; docName: string }>> = {
  discover: [
    { module: "01", docName: "Problem Statement (APPROVED)" },
    { module: "01", docName: "Interview Transcripts (min 10)" },
    { module: "01", docName: "Hypothesis Tracker" },
    { module: "05", docName: "Insight Board Summary" },
  ],
  define: [
    { module: "02", docName: "MVP Brief (APPROVED)" },
    { module: "03", docName: "Market Sizing (TAM/SAM/SOM)" },
    { module: "03", docName: "ICP Definition (APPROVED)" },
    { module: "06", docName: "Messaging House (DRAFT)" },
  ],
  build: [
    { module: "02", docName: "Prototype / Test Results" },
    { module: "04", docName: "Sprint Plan" },
    { module: "04", docName: "Supplier DB" },
    { module: "05", docName: "Data Dashboard" },
  ],
  launch: [
    { module: "03", docName: "GTM Plan (APPROVED)" },
    { module: "06", docName: "Brand Launch Pack" },
    { module: "07", docName: "Financial Model (APPROVED)" },
    { module: "07", docName: "Investor List" },
  ],
  spinout: [
    { module: "07", docName: "Pitch Deck (APPROVED)" },
    { module: "07", docName: "Cap Table (APPROVED)" },
    { module: "08", docName: "Entity Structure (APPROVED)" },
    { module: "09", docName: "Operator Playbook (APPROVED)" },
    { module: "09", docName: "Business Plan (APPROVED)" },
    { module: "09", docName: "Handover Pack" },
  ],
};

export const insightAutomationRouter = router({
  processTranscript: protectedProcedure
    .input(z.object({
      ventureId:           z.string(),
      fileName:            z.string(),
      fileType:            z.enum(["docx","txt","pdf","mp4","mp3"]),
      fileUrl:             z.string().optional(),
      transcriptText:      z.string(),
      intervieweeType:     z.string().optional(),
      currentStage:        z.string().optional(),
      existingHypotheses:  z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [trigRow] = await db.insert(insightTriggers).values({
        ventureId: input.ventureId, fileName: input.fileName,
        fileType: input.fileType, fileUrl: input.fileUrl, status: "processing",
      });
      const triggerId = (trigRow as any).insertId as number;
      const contextHeader = `Venture: ${input.ventureId} | Stage: ${input.currentStage ?? "Unknown"}\nExisting hypotheses: ${input.existingHypotheses?.join("; ") ?? "None yet"}`;
      const res = await invokeLLM({
        messages: [
          { role: "system", content: "You are an EcoBlend V4 Intelligence Lead. Synthesise interview transcripts into structured venture insights. Return valid JSON only." },
          { role: "user", content: `${contextHeader}\n\nConvert this interview transcript into the following structured JSON:\n{\n  "painPoints": [{"point": "...", "quote": "verbatim quote"}],\n  "jobsToBeDone": ["..."],\n  "emotionalSignals": ["..."],\n  "functionalSignals": ["..."],\n  "opportunityScore": 7.5,\n  "opportunityRationale": "...",\n  "hypothesesToTest": [{"hypothesis": "...", "priority": 1}],\n  "contradictionFlags": ["..."]\n}\n\nRules:\n- painPoints: top 3-5 with verbatim evidence quotes\n- opportunityScore: 1-10 with rationale\n- hypothesesToTest: ranked by priority (1=highest)\n- contradictionFlags: flag if insight conflicts with existing hypotheses\n\nTRANSCRIPT:\n${input.transcriptText}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "insight_synthesis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                painPoints:           { type: "array", items: { type: "object", properties: { point: { type: "string" }, quote: { type: "string" } }, required: ["point","quote"], additionalProperties: false } },
                jobsToBeDone:         { type: "array", items: { type: "string" } },
                emotionalSignals:     { type: "array", items: { type: "string" } },
                functionalSignals:    { type: "array", items: { type: "string" } },
                opportunityScore:     { type: "number" },
                opportunityRationale: { type: "string" },
                hypothesesToTest:     { type: "array", items: { type: "object", properties: { hypothesis: { type: "string" }, priority: { type: "number" } }, required: ["hypothesis","priority"], additionalProperties: false } },
                contradictionFlags:   { type: "array", items: { type: "string" } },
              },
              required: ["painPoints","jobsToBeDone","emotionalSignals","functionalSignals","opportunityScore","opportunityRationale","hypothesesToTest","contradictionFlags"],
              additionalProperties: false,
            },
          },
        },
      });
      const rawContent = res.choices[0].message.content;
      const parsed = typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;
      await db.insert(insightSummaries).values({
        triggerId, ventureId: input.ventureId, intervieweeType: input.intervieweeType,
        painPoints: parsed.painPoints, jobsToBeDone: parsed.jobsToBeDone,
        emotionalSignals: parsed.emotionalSignals, functionalSignals: parsed.functionalSignals,
        opportunityScore: parsed.opportunityScore?.toString(),
        opportunityRationale: parsed.opportunityRationale,
        hypothesesToTest: parsed.hypothesesToTest, contradictionFlags: parsed.contradictionFlags,
        rawSummary: typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent),
      });
      await db.update(insightTriggers).set({ status: "complete", processedAt: new Date() }).where(eq(insightTriggers.id, triggerId));
      await db.insert(vrlActionsLog).values({
        ventureId: input.ventureId,
        action: `Interview transcript processed: ${input.fileName} — Opportunity score: ${parsed.opportunityScore}/10`,
        owner: "Intelligence Lead", status: "complete", linkedModule: "01",
      });
      return { triggerId, summary: parsed };
    }),

  getInsightBoard: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const summaries = await db.select().from(insightSummaries)
        .where(eq(insightSummaries.ventureId, input.ventureId))
        .orderBy(desc(insightSummaries.createdAt));
      const painClusters: Record<string, number> = {};
      const hypothesisCounts: Record<string, number> = {};
      for (const s of summaries) {
        const pains = (s.painPoints as Array<{ point: string; quote: string }>) ?? [];
        for (const p of pains) { const key = p.point.substring(0, 50); painClusters[key] = (painClusters[key] ?? 0) + 1; }
        const hyps = (s.hypothesesToTest as Array<{ hypothesis: string; priority: number }>) ?? [];
        for (const h of hyps) { const key = h.hypothesis.substring(0, 80); hypothesisCounts[key] = (hypothesisCounts[key] ?? 0) + 1; }
      }
      const validatedHypotheses = Object.entries(hypothesisCounts).filter(([, count]) => count >= 3).map(([hypothesis, count]) => ({ hypothesis, count, validated: true }));
      return {
        boardCards: summaries.map(s => ({
          id: s.id, date: s.createdAt, intervieweeType: s.intervieweeType,
          topPain: ((s.painPoints as Array<{ point: string }>) ?? [])[0]?.point ?? "N/A",
          opportunityScore: s.opportunityScore,
          contradictions: ((s.contradictionFlags as string[]) ?? []).length,
        })),
        painClusters:        Object.entries(painClusters).sort((a, b) => b[1] - a[1]).slice(0, 10),
        validatedHypotheses,
        totalInterviews:     summaries.length,
        avgOpportunityScore: summaries.length > 0
          ? (summaries.reduce((sum, s) => sum + parseFloat(s.opportunityScore as string || "0"), 0) / summaries.length).toFixed(1)
          : "0",
      };
    }),

  getInsightSummary: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [summary] = await db.select().from(insightSummaries).where(eq(insightSummaries.id, input.id));
      return summary ?? null;
    }),

  initiateStageGateReview: protectedProcedure
    .input(z.object({
      ventureId:    z.string(),
      ventureName:  z.string(),
      targetStage:  z.enum(["discover","define","build","launch","spinout"]),
      submittedBy:  z.string(),
      evidenceList: z.array(z.object({
        module:    z.string(),
        docName:   z.string(),
        docUrl:    z.string().optional(),
        docStatus: z.enum(["present","missing","needs_approval"]),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const requirements = STAGE_EVIDENCE_REQUIREMENTS[input.targetStage] ?? [];
      const gapList = requirements.map(req => {
        const provided = input.evidenceList?.find(e => e.module === req.module && e.docName === req.docName);
        return { module: req.module, docName: req.docName, status: provided?.docStatus ?? "missing", docUrl: provided?.docUrl };
      });
      const presentCount = gapList.filter(g => g.status === "present").length;
      const missingCount = gapList.filter(g => g.status === "missing").length;
      const narrativeRes = await invokeLLM({
        messages: [
          { role: "system", content: "You are an EcoBlend V4 Venture OS specialist. Draft a Stage Gate Review memo. Be concise, evidence-led, and give a clear recommendation." },
          { role: "user", content: `Draft a Stage Gate Review memo for venture ${input.ventureName}.\nTarget stage: ${input.targetStage.toUpperCase()}\nEvidence present: ${presentCount}/${requirements.length} items\nMissing: ${missingCount} items\nGap list: ${gapList.map(g => `${g.module}: ${g.docName} [${g.status.toUpperCase()}]`).join(", ")}\n\nInclude:\n1. Stage objectives and whether they are met\n2. Evidence summary (by module)\n3. Key risks and mitigants\n4. Recommendation: ADVANCE / PAUSE / REQUIRES ACTION\n5. Next stage priorities (top 5 actions)\n\nFormat as a formal memo. Be direct and evidence-based.` },
        ],
      });
      const narrativeMemo = narrativeRes.choices[0].message.content;
      const narrativeStr  = typeof narrativeMemo === "string" ? narrativeMemo : String(narrativeMemo);
      const recommendation = narrativeStr.includes("ADVANCE") ? "advance" : narrativeStr.includes("PAUSE") ? "pause" : "requires_action";
      const [reviewRow] = await db.insert(stageGateReviews).values({
        ventureId: input.ventureId, targetStage: input.targetStage, status: "submitted",
        recommendation: recommendation as any, narrativeMemo: narrativeStr,
        evidenceAudit: gapList, gapList, submittedBy: input.submittedBy,
      });
      const reviewId = (reviewRow as any).insertId as number;
      for (const item of gapList) {
        await db.insert(stageGateEvidence).values({
          reviewId, moduleNumber: item.module, docName: item.docName,
          docUrl: item.docUrl, docStatus: item.status as any,
        });
      }
      await db.insert(vrlActionsLog).values({
        ventureId: input.ventureId,
        action: `Stage Gate Review submitted for ${input.targetStage.toUpperCase()} — Recommendation: ${recommendation.toUpperCase()}`,
        owner: input.submittedBy, status: "in_progress", linkedModule: "00",
      });
      return { reviewId, recommendation, narrativeMemo: narrativeStr, gapList, presentCount, missingCount };
    }),

  listStageGateReviews: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      return db.select().from(stageGateReviews).where(eq(stageGateReviews.ventureId, input.ventureId)).orderBy(desc(stageGateReviews.createdAt));
    }),

  getStageGateReview: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [review] = await db.select().from(stageGateReviews).where(eq(stageGateReviews.id, input.id));
      if (!review) throw new Error("Review not found");
      const evidence = await db.select().from(stageGateEvidence).where(eq(stageGateEvidence.reviewId, input.id));
      return { review, evidence };
    }),

  approveStageGateReview: protectedProcedure
    .input(z.object({ reviewId: z.number(), approvedBy: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [review] = await db.select().from(stageGateReviews).where(eq(stageGateReviews.id, input.reviewId));
      if (!review) throw new Error("Review not found");
      await db.update(stageGateReviews).set({ status: "approved", approvedBy: input.approvedBy, approvedAt: new Date() }).where(eq(stageGateReviews.id, input.reviewId));
      if (review.recommendation === "advance") {
        await db.update(vrlStageGates).set({ status: "complete", lastUpdated: new Date() })
          .where(and(eq(vrlStageGates.ventureId, review.ventureId), eq(vrlStageGates.stage, review.targetStage)));
      }
      await db.insert(vrlActionsLog).values({
        ventureId: review.ventureId,
        action: `Stage Gate Review APPROVED for ${review.targetStage.toUpperCase()} by ${input.approvedBy}`,
        owner: input.approvedBy, status: "complete", linkedModule: "00",
      });
      return { success: true };
    }),

  getStageEvidenceRequirements: protectedProcedure.query(() => STAGE_EVIDENCE_REQUIREMENTS),
});
