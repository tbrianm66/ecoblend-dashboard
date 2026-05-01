/**
 * Contextual Playbook Widget Router
 *
 * 12 contextual procedures (fetching recommendations, completions, usage)
 * 7 admin procedures (managing context rules, widget configs, analytics)
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { sql } from "drizzle-orm";
import {
  getContextualPlaybooks,
  collectContext,
  evaluateRules,
  rankByWidgetType,
} from "./context-engine";
import crypto from "crypto";

const uuid = () => crypto.randomUUID();

// ─── Contextual Procedures (12) ───

export const contextualRouter = router({
  // 1. getRecommendations — main entry point for the widget panel
  getRecommendations: protectedProcedure
    .input(
      z.object({
        ventureId: z.string().nullable(),
        module: z.string(),
        page: z.string().optional().default("ALL"),
        workflowStage: z.string().optional().default("ALL"),
      })
    )
    .query(async ({ ctx, input }) => {
      return getContextualPlaybooks(
        input.ventureId,
        input.module,
        input.page,
        input.workflowStage,
        ctx.user.id,
        ctx.user.role || "user"
      );
    }),

  // 2. getPlaybookDetail — full playbook content for the drawer
  getPlaybookDetail: protectedProcedure
    .input(z.object({ playbookId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [rows] = await db.execute(
        sql.raw(`SELECT * FROM playbook_library WHERE id = '${input.playbookId}' LIMIT 1`)
      );
      const playbook = (rows as any[])[0];
      if (!playbook) throw new TRPCError({ code: "NOT_FOUND", message: "Playbook not found" });
      return playbook;
    }),

  // 3. getCompletionStatus — check if user has completed a playbook for a venture
  getCompletionStatus: protectedProcedure
    .input(
      z.object({
        playbookId: z.string(),
        ventureId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const [rows] = await db.execute(
        sql.raw(`SELECT * FROM playbook_completions WHERE playbook_id = '${input.playbookId}' AND venture_id = '${input.ventureId}' AND user_id = '${ctx.user.id}' ORDER BY updated_at DESC LIMIT 1`)
      );
      return (rows as any[])[0] || null;
    }),

  // 4. startCompletion — create a new completion record
  startCompletion: protectedProcedure
    .input(
      z.object({
        playbookId: z.string(),
        ventureId: z.string(),
        module: z.string(),
        workflowStage: z.string().optional().default("ALL"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const id = uuid();
      const now = Date.now();
      await db.execute(
        sql.raw(`INSERT INTO playbook_completions (id, playbook_id, user_id, venture_id, module, workflow_stage, completion_status, completed_steps, evidence_links, created_at, updated_at) VALUES ('${id}', '${input.playbookId}', '${ctx.user.id}', '${input.ventureId}', '${input.module}', '${input.workflowStage}', 'In_Progress', '[]', '[]', ${now}, ${now})`)
      );
      return { id, status: "In_Progress" };
    }),

  // 5. updateCompletion — update completed steps and evidence
  updateCompletion: protectedProcedure
    .input(
      z.object({
        completionId: z.string(),
        completedSteps: z.array(z.string()).optional(),
        evidenceLinks: z.array(z.string()).optional(),
        completionStatus: z.enum(["Not_Started", "In_Progress", "Completed", "Reviewed"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const now = Date.now();
      const sets: string[] = [`updated_at = ${now}`];
      if (input.completedSteps) sets.push(`completed_steps = '${JSON.stringify(input.completedSteps)}'`);
      if (input.evidenceLinks) sets.push(`evidence_links = '${JSON.stringify(input.evidenceLinks)}'`);
      if (input.completionStatus) {
        sets.push(`completion_status = '${input.completionStatus}'`);
        if (input.completionStatus === "Completed") sets.push(`completed_at = ${now}`);
      }
      await db.execute(
        sql.raw(`UPDATE playbook_completions SET ${sets.join(", ")} WHERE id = '${input.completionId}'`)
      );
      return { success: true };
    }),

  // 6. getVentureCompletions — all completions for a venture
  getVentureCompletions: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [rows] = await db.execute(
        sql.raw(`SELECT pc.*, pl.title, pl.category FROM playbook_completions pc JOIN playbook_library pl ON pc.playbook_id = pl.id WHERE pc.venture_id = '${input.ventureId}' ORDER BY pc.updated_at DESC`)
      );
      return rows as any[];
    }),

  // 7. logUsageEvent — track playbook interactions
  logUsageEvent: protectedProcedure
    .input(
      z.object({
        playbookId: z.string(),
        ventureId: z.string().nullable(),
        module: z.string(),
        page: z.string().optional(),
        widgetType: z.string(),
        actionType: z.enum(["View", "Open", "Start", "Complete", "Dismiss", "Search", "Filter"]),
        contextSnapshot: z.string().optional(),
        outcome: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const id = uuid();
      const now = Date.now();
      await db.execute(
        sql.raw(`INSERT INTO playbook_usage_events (id, playbook_id, user_id, venture_id, module, page, widget_type, action_type, context_snapshot, outcome, created_at) VALUES ('${id}', '${input.playbookId}', '${ctx.user.id}', ${input.ventureId ? `'${input.ventureId}'` : "NULL"}, '${input.module}', ${input.page ? `'${input.page}'` : "NULL"}, '${input.widgetType}', '${input.actionType}', ${input.contextSnapshot ? `'${input.contextSnapshot}'` : "NULL"}, ${input.outcome ? `'${input.outcome}'` : "NULL"}, ${now})`)
      );
      return { id };
    }),

  // 8. searchPlaybooks — full-text search across all published playbooks
  searchPlaybooks: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2),
        module: z.string().optional(),
        category: z.string().optional(),
        limit: z.number().optional().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [`status = 'Published'`, `(title LIKE '%${input.query}%' OR purpose LIKE '%${input.query}%' OR step_by_step_guidance LIKE '%${input.query}%' OR category LIKE '%${input.query}%')`];
      if (input.module) conditions.push(`related_module = '${input.module}'`);
      if (input.category) conditions.push(`category = '${input.category}'`);
      const [rows] = await db.execute(
        sql.raw(`SELECT id, title, category, related_module, purpose, when_to_use, access_level, status FROM playbook_library WHERE ${conditions.join(" AND ")} ORDER BY title LIMIT ${input.limit}`)
      );
      return rows as any[];
    }),

  // 9. getModuleWidgetConfigs — widget configs for a specific module
  getModuleWidgetConfigs: protectedProcedure
    .input(z.object({ module: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [rows] = await db.execute(
        sql.raw(`SELECT * FROM playbook_widget_configs WHERE module = '${input.module}' ORDER BY widget_type`)
      );
      return rows as any[];
    }),

  // 10. getGuidanceEvents — active guidance events for a venture
  getGuidanceEvents: protectedProcedure
    .input(
      z.object({
        ventureId: z.string(),
        module: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [`venture_id = '${input.ventureId}'`, `status = 'Active'`];
      if (input.module) conditions.push(`module = '${input.module}'`);
      const [rows] = await db.execute(
        sql.raw(`SELECT * FROM contextual_guidance_events WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC LIMIT 20`)
      );
      return rows as any[];
    }),

  // 11. resolveGuidanceEvent — mark a guidance event as resolved
  resolveGuidanceEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.execute(
        sql.raw(`UPDATE contextual_guidance_events SET status = 'Resolved', resolved_at = ${Date.now()} WHERE id = '${input.eventId}'`)
      );
      return { success: true };
    }),

  // 12. getPlaybookCategories — list all categories with counts
  getPlaybookCategories: protectedProcedure.query(async () => {
    const db = await getDb();
    const [rows] = await db.execute(
      sql.raw(`SELECT category, COUNT(*) as count FROM playbook_library WHERE status = 'Published' GROUP BY category ORDER BY category`)
    );
    return rows as any[];
  }),

  // ─── Specialised Widget Data Endpoints (7) ───

  // W1. getMissingEvidence — evidence gaps for current module/venture
  getMissingEvidence: protectedProcedure
    .input(
      z.object({
        ventureId: z.string(),
        module: z.string(),
        scoreType: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      // Fetch evidence items for this venture
      const [evidenceRows] = await db.execute(
        sql.raw(`SELECT id, evidence_type, title, status, confidence_score, module FROM evidence_items WHERE venture_id = '${input.ventureId}' ORDER BY created_at DESC LIMIT 50`)
      ).catch(() => [[]]);
      const evidence = evidenceRows as any[];

      // Fetch recommended playbooks for missing evidence context
      const playbooks = await getContextualPlaybooks(
        input.ventureId, input.module, "ALL", "ALL", ctx.user.id, ctx.user.role || "user"
      );

      // Determine missing evidence based on module
      const moduleEvidenceMap: Record<string, string[]> = {
        "Venture Intake": ["Problem Statement", "Target Customer Profile", "Initial Hypothesis"],
        "Discovery & Market": ["Customer Interview Records", "Market Size Data", "Competitor Matrix", "Pricing Evidence", "Demand Validation"],
        "Research & Technical Validation": ["Technical Specification", "Simulation Report", "Prototype Test Evidence", "Technical KPI Records", "IP Assessment"],
        "Risk Intelligence": ["Risk Register", "Mitigation Plans", "Residual Risk Assessment"],
        "Readiness Scoring": ["VRL Evidence", "TRL Evidence", "BRL Evidence", "MRL Evidence"],
        "Investment Readiness": ["Financial Model", "Market Validation Report", "Investor Deck", "Data Room Documents"],
        "Governance": ["Stage-Gate Checklist", "Decision Log", "Approval Records"],
      };

      const required = moduleEvidenceMap[input.module] || [];
      const completedTypes = evidence.filter(e => e.status === "Approved" || e.status === "Verified").map(e => e.evidence_type);
      const missing = required.filter(r => !completedTypes.some(c => c?.toLowerCase().includes(r.toLowerCase())));
      const total = required.length;
      const completed = total - missing.length;
      const confidenceScore = total > 0 ? Math.round((completed / total) * 100) : 100;

      return {
        missing,
        completed,
        total,
        confidenceScore,
        evidenceItems: evidence.slice(0, 10),
        recommendedPlaybooks: playbooks.slice(0, 3),
        isEmpty: missing.length === 0,
      };
    }),

  // W2. getScoreImprovement — score blockers and improvement guidance
  getScoreImprovement: protectedProcedure
    .input(
      z.object({
        ventureId: z.string(),
        scoreType: z.string().optional().default("VRL"),
        threshold: z.number().optional().default(60),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      // Fetch latest VRL score
      const [scoreRows] = await db.execute(
        sql.raw(`SELECT * FROM vrl_scores WHERE venture_id = '${input.ventureId}' ORDER BY created_at DESC LIMIT 1`)
      ).catch(() => [[]]);
      const latestScore = (scoreRows as any[])[0];

      // Fetch risk count
      const [riskRows] = await db.execute(
        sql.raw(`SELECT COUNT(*) as cnt FROM risk_register WHERE venture_id = '${input.ventureId}' AND risk_level IN ('High','Critical') AND status = 'Open'`)
      ).catch(() => [[{ cnt: 0 }]]);
      const highRisks = (riskRows as any[])[0]?.cnt || 0;

      // Fetch evidence confidence
      const [evRows] = await db.execute(
        sql.raw(`SELECT COUNT(*) as total, SUM(CASE WHEN status IN ('Approved','Verified') THEN 1 ELSE 0 END) as approved FROM evidence_items WHERE venture_id = '${input.ventureId}'`)
      ).catch(() => [[{ total: 0, approved: 0 }]]);
      const evData = (evRows as any[])[0];
      const evidenceConfidence = evData?.total > 0 ? Math.round((evData.approved / evData.total) * 100) : 0;

      const currentScore = latestScore?.composite_score || latestScore?.vrl_score || 0;
      const blockers: string[] = [];
      if (currentScore < input.threshold) blockers.push(`${input.scoreType} score (${currentScore}) is below threshold (${input.threshold})`);
      if (highRisks > 0) blockers.push(`${highRisks} unresolved high/critical risk${highRisks > 1 ? 's' : ''} limiting score`);
      if (evidenceConfidence < 60) blockers.push(`Evidence confidence low (${evidenceConfidence}%) — add more verified evidence`);
      if (!latestScore) blockers.push("No score recorded yet — complete the scoring assessment");

      const playbooks = await getContextualPlaybooks(
        input.ventureId, "Readiness Scoring", "ALL", "ALL", ctx.user.id, ctx.user.role || "user"
      );

      return {
        scoreType: input.scoreType,
        currentScore,
        targetScore: input.threshold,
        blockers,
        highRisks,
        evidenceConfidence,
        recommendedPlaybooks: playbooks.slice(0, 3),
        isEmpty: blockers.length === 0,
      };
    }),

  // W3. getRDStageGuidance — R&D stage requirements and playbooks
  getRDStageGuidance: protectedProcedure
    .input(
      z.object({
        ventureId: z.string(),
        rdProjectId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      // Fetch latest R&D project
      const [projectRows] = await db.execute(
        sql.raw(`SELECT * FROM rd_projects WHERE venture_id = '${input.ventureId}' ORDER BY created_at DESC LIMIT 1`)
      ).catch(() => [[]]);
      const project = (projectRows as any[])[0];
      const currentStage = project?.current_stage || project?.trl_stage || "Concept";

      const stageRequirements: Record<string, string[]> = {
        "Concept": ["Problem definition document", "Initial technical hypothesis", "Literature review", "IP landscape search"],
        "Simulation": ["Simulation model setup", "Simulation report uploaded", "Technical KPI baseline", "Technical risk review"],
        "Prototyping": ["Prototype build plan", "Prototype test evidence", "Performance KPI records", "Safety assessment"],
        "Track / Platform Integration": ["Integration test evidence", "Platform validation report", "Final IP assessment", "Funding gate approval"],
      };

      const required = stageRequirements[currentStage] || stageRequirements["Concept"];
      // Check evidence for this stage
      const [evRows] = await db.execute(
        sql.raw(`SELECT evidence_type, status FROM evidence_items WHERE venture_id = '${input.ventureId}' AND module = 'Research & Technical Validation'`)
      ).catch(() => [[]]);
      const evidence = evRows as any[];
      const completedEv = evidence.filter(e => e.status === "Approved" || e.status === "Verified").map(e => e.evidence_type);
      const missing = required.filter(r => !completedEv.some(c => c?.toLowerCase().includes(r.toLowerCase().split(" ")[0])));

      const playbooks = await getContextualPlaybooks(
        input.ventureId, "Research & Technical Validation", "ALL", "ALL", ctx.user.id, ctx.user.role || "user"
      );

      return {
        currentStage,
        projectTitle: project?.title || "R&D Project",
        requiredEvidence: required,
        missingEvidence: missing,
        completedCount: required.length - missing.length,
        totalCount: required.length,
        recommendedPlaybooks: playbooks.slice(0, 3),
        isEmpty: missing.length === 0,
      };
    }),

  // W4. getInvestmentPackReadiness — investor pack readiness status
  getInvestmentPackReadiness: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      // Fetch VRL score
      const [scoreRows] = await db.execute(
        sql.raw(`SELECT composite_score, vrl_score, brl_score FROM vrl_scores WHERE venture_id = '${input.ventureId}' ORDER BY created_at DESC LIMIT 1`)
      ).catch(() => [[]]);
      const score = (scoreRows as any[])[0];

      // Fetch high risks
      const [riskRows] = await db.execute(
        sql.raw(`SELECT COUNT(*) as cnt FROM risk_register WHERE venture_id = '${input.ventureId}' AND risk_level IN ('High','Critical') AND status = 'Open'`)
      ).catch(() => [[{ cnt: 0 }]]);
      const highRisks = (riskRows as any[])[0]?.cnt || 0;

      // Fetch evidence confidence
      const [evRows] = await db.execute(
        sql.raw(`SELECT COUNT(*) as total, SUM(CASE WHEN status IN ('Approved','Verified') THEN 1 ELSE 0 END) as approved FROM evidence_items WHERE venture_id = '${input.ventureId}'`)
      ).catch(() => [[{ total: 0, approved: 0 }]]);
      const evData = (evRows as any[])[0];
      const evidenceConfidence = evData?.total > 0 ? Math.round((evData.approved / evData.total) * 100) : 0;

      const blockers: string[] = [];
      const warnings: string[] = [];
      const brlScore = score?.brl_score || 0;
      const compositeScore = score?.composite_score || score?.vrl_score || 0;

      if (!score) blockers.push("No readiness score recorded — complete scoring assessment first");
      if (brlScore < 60) blockers.push(`BRL score (${brlScore}) below minimum threshold of 60`);
      if (highRisks > 0) blockers.push(`${highRisks} unresolved high/critical risk${highRisks > 1 ? 's' : ''}`);
      if (evidenceConfidence < 50) blockers.push(`Evidence confidence critically low (${evidenceConfidence}%)`);
      else if (evidenceConfidence < 70) warnings.push(`Evidence confidence below recommended level (${evidenceConfidence}%)`);
      if (compositeScore < 50) warnings.push(`Overall readiness score (${compositeScore}) is below investor-ready threshold`);

      let status: "Ready" | "Ready with Warnings" | "Not Ready" = "Ready";
      if (blockers.length > 0) status = "Not Ready";
      else if (warnings.length > 0) status = "Ready with Warnings";

      const playbooks = await getContextualPlaybooks(
        input.ventureId, "Investment Readiness", "ALL", "ALL", ctx.user.id, ctx.user.role || "user"
      );

      return {
        status,
        blockers,
        warnings,
        brlScore,
        compositeScore,
        highRisks,
        evidenceConfidence,
        canGenerateDraft: blockers.length === 0 || warnings.length > 0,
        recommendedPlaybooks: playbooks.slice(0, 3),
        isEmpty: blockers.length === 0 && warnings.length === 0,
      };
    }),

  // W5. getRiskMitigation — high risk items and mitigation guidance
  getRiskMitigation: protectedProcedure
    .input(
      z.object({
        ventureId: z.string(),
        module: z.string().optional().default("Risk Intelligence"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const [riskRows] = await db.execute(
        sql.raw(`SELECT id, risk_category, risk_title, risk_level, status, mitigation_status, risk_score, owner FROM risk_register WHERE venture_id = '${input.ventureId}' AND risk_level IN ('High','Critical') AND status IN ('Open','Escalated') ORDER BY risk_score DESC LIMIT 10`)
      ).catch(() => [[]]);
      const risks = riskRows as any[];

      const playbooks = await getContextualPlaybooks(
        input.ventureId, "Risk Intelligence", "ALL", "ALL", ctx.user.id, ctx.user.role || "user"
      );

      const topCategory = risks[0]?.risk_category || null;
      const totalHighRisks = risks.length;
      const missingMitigation = risks.filter(r => !r.mitigation_status || r.mitigation_status === "Not Started");

      return {
        topRiskCategory: topCategory,
        totalHighRisks,
        risks: risks.slice(0, 5),
        missingMitigationCount: missingMitigation.length,
        recommendedPlaybooks: playbooks.slice(0, 3),
        isEmpty: risks.length === 0,
      };
    }),

  // W6. getStageGate — stage-gate blockers and approval readiness
  getStageGate: protectedProcedure
    .input(
      z.object({
        ventureId: z.string(),
        currentStage: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      // Fetch venture stage info
      const [ventureRows] = await db.execute(
        sql.raw(`SELECT id, name, status, vrl_stage FROM ventures WHERE id = '${input.ventureId}' LIMIT 1`)
      ).catch(() => [[]]);
      const venture = (ventureRows as any[])[0];
      const currentStage = input.currentStage || venture?.vrl_stage || "Validation";

      // Fetch pending approvals
      const [approvalRows] = await db.execute(
        sql.raw(`SELECT id, gate_name, status, decision, blockers FROM stage_gate_decisions WHERE venture_id = '${input.ventureId}' AND status IN ('Pending','Blocked') ORDER BY created_at DESC LIMIT 5`)
      ).catch(() => [[]]);
      const pendingApprovals = approvalRows as any[];

      // Stage gate requirements map
      const gateRequirements: Record<string, { target: string; conditions: string[] }> = {
        "Ideation": { target: "Validation", conditions: ["Problem statement documented", "Initial hypothesis formed", "Target customer defined"] },
        "Validation": { target: "MVP", conditions: ["Market validation evidence", "Customer discovery complete", "Risk mitigation reviewed", "BRL score ≥ 50"] },
        "MVP": { target: "Growth", conditions: ["MVP tested with customers", "Product-market fit signal", "Financial model complete", "VRL score ≥ 60"] },
        "Growth": { target: "Scale", conditions: ["Revenue evidence", "Unit economics validated", "Investment readiness confirmed", "VRL score ≥ 75"] },
      };

      const gateInfo = gateRequirements[currentStage] || gateRequirements["Validation"];
      const blockers: string[] = pendingApprovals.flatMap(a => {
        try { return JSON.parse(a.blockers || "[]"); } catch { return []; }
      });

      const playbooks = await getContextualPlaybooks(
        input.ventureId, "Governance", "ALL", "ALL", ctx.user.id, ctx.user.role || "user"
      );

      return {
        currentStage,
        targetStage: gateInfo.target,
        requiredConditions: gateInfo.conditions,
        blockers: blockers.length > 0 ? blockers : (pendingApprovals.length > 0 ? ["Approval pending review"] : []),
        pendingApprovals: pendingApprovals.slice(0, 3),
        recommendedPlaybooks: playbooks.slice(0, 3),
        isEmpty: pendingApprovals.length === 0 && blockers.length === 0,
      };
    }),

  // W7. getWidgetContext — combined context for ContextualWidgetPanel
  getWidgetContext: protectedProcedure
    .input(
      z.object({
        ventureId: z.string().nullable(),
        module: z.string(),
        widgetTypes: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const playbooks = await getContextualPlaybooks(
        input.ventureId, input.module, "ALL", "ALL", ctx.user.id, ctx.user.role || "user"
      );
      return {
        module: input.module,
        ventureId: input.ventureId,
        recommendedPlaybooks: playbooks,
        userRole: ctx.user.role || "user",
      };
    }),

  // ─── Admin Procedures (7) ───

  // A1. listContextRules — all context rules with playbook titles
  adminListRules: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    const [rows] = await db.execute(
      sql.raw(`SELECT pcr.*, pl.title as playbook_title FROM playbook_context_rules pcr LEFT JOIN playbook_library pl ON pcr.playbook_id = pl.id ORDER BY pcr.module, pcr.priority DESC`)
    );
    return rows as any[];
  }),

  // A2. createContextRule
  adminCreateRule: protectedProcedure
    .input(
      z.object({
        ruleName: z.string().min(1),
        description: z.string().optional().default(""),
        playbookId: z.string(),
        module: z.string(),
        page: z.string().optional().default("ALL"),
        workflowStage: z.string().optional().default("ALL"),
        ventureStage: z.string().optional().default("ALL"),
        ventureType: z.string().optional().default("ALL"),
        spvBrand: z.string().optional().default("ALL"),
        userRoles: z.string().nullable().optional(),
        riskCategories: z.string().nullable().optional(),
        scoringFrameworks: z.string().nullable().optional(),
        evidenceTypes: z.string().nullable().optional(),
        approvalGate: z.string().nullable().optional(),
        rdStage: z.string().nullable().optional(),
        investmentPackStatus: z.string().nullable().optional(),
        missingEvidenceTrigger: z.string().nullable().optional(),
        scoreThresholdTrigger: z.string().nullable().optional(),
        riskThresholdTrigger: z.string().nullable().optional(),
        approvalGateTrigger: z.string().nullable().optional(),
        rdStageTrigger: z.string().nullable().optional(),
        investmentPackStatusTrigger: z.string().nullable().optional(),
        priority: z.enum(["High", "Medium", "Low"]).optional().default("Medium"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      const id = uuid();
      const now = Date.now();
      const esc = (v: string | null | undefined) => v ? `'${v.replace(/'/g, "''")}'` : "NULL";
      await db.execute(
        sql.raw(`INSERT INTO playbook_context_rules (id, rule_name, description, playbook_id, module, page, workflow_stage, venture_stage, venture_type, spv_brand, user_roles, risk_categories, scoring_frameworks, evidence_types, approval_gate, rd_stage, investment_pack_status, missing_evidence_trigger, score_threshold_trigger, risk_threshold_trigger, approval_gate_trigger, rd_stage_trigger, investment_pack_status_trigger, priority, active, created_by, updated_by, created_at, updated_at) VALUES ('${id}', ${esc(input.ruleName)}, ${esc(input.description)}, '${input.playbookId}', '${input.module}', '${input.page}', '${input.workflowStage}', '${input.ventureStage}', '${input.ventureType}', '${input.spvBrand}', ${esc(input.userRoles)}, ${esc(input.riskCategories)}, ${esc(input.scoringFrameworks)}, ${esc(input.evidenceTypes)}, ${esc(input.approvalGate)}, ${esc(input.rdStage)}, ${esc(input.investmentPackStatus)}, ${esc(input.missingEvidenceTrigger)}, ${esc(input.scoreThresholdTrigger)}, ${esc(input.riskThresholdTrigger)}, ${esc(input.approvalGateTrigger)}, ${esc(input.rdStageTrigger)}, ${esc(input.investmentPackStatusTrigger)}, '${input.priority}', 1, '${ctx.user.id}', '${ctx.user.id}', ${now}, ${now})`)
      );
      return { id };
    }),

  // A3. updateContextRule
  adminUpdateRule: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        ruleName: z.string().optional(),
        description: z.string().optional(),
        playbookId: z.string().optional(),
        module: z.string().optional(),
        page: z.string().optional(),
        workflowStage: z.string().optional(),
        ventureStage: z.string().optional(),
        ventureType: z.string().optional(),
        spvBrand: z.string().optional(),
        userRoles: z.string().nullable().optional(),
        riskCategories: z.string().nullable().optional(),
        scoringFrameworks: z.string().nullable().optional(),
        evidenceTypes: z.string().nullable().optional(),
        approvalGate: z.string().nullable().optional(),
        rdStage: z.string().nullable().optional(),
        investmentPackStatus: z.string().nullable().optional(),
        missingEvidenceTrigger: z.string().nullable().optional(),
        scoreThresholdTrigger: z.string().nullable().optional(),
        riskThresholdTrigger: z.string().nullable().optional(),
        approvalGateTrigger: z.string().nullable().optional(),
        rdStageTrigger: z.string().nullable().optional(),
        investmentPackStatusTrigger: z.string().nullable().optional(),
        priority: z.enum(["High", "Medium", "Low"]).optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      const now = Date.now();
      const esc = (v: string) => v.replace(/'/g, "''");
      const sets: string[] = [`updated_by = '${ctx.user.id}'`, `updated_at = ${now}`];
      if (input.ruleName !== undefined) sets.push(`rule_name = '${esc(input.ruleName)}'`);
      if (input.description !== undefined) sets.push(`description = '${esc(input.description)}'`);
      if (input.playbookId !== undefined) sets.push(`playbook_id = '${input.playbookId}'`);
      if (input.module !== undefined) sets.push(`module = '${input.module}'`);
      if (input.page !== undefined) sets.push(`page = '${input.page}'`);
      if (input.workflowStage !== undefined) sets.push(`workflow_stage = '${esc(input.workflowStage)}'`);
      if (input.ventureStage !== undefined) sets.push(`venture_stage = '${esc(input.ventureStage)}'`);
      if (input.ventureType !== undefined) sets.push(`venture_type = '${esc(input.ventureType)}'`);
      if (input.spvBrand !== undefined) sets.push(`spv_brand = '${esc(input.spvBrand)}'`);
      if (input.userRoles !== undefined) sets.push(input.userRoles ? `user_roles = '${esc(input.userRoles)}'` : `user_roles = NULL`);
      if (input.riskCategories !== undefined) sets.push(input.riskCategories ? `risk_categories = '${esc(input.riskCategories)}'` : `risk_categories = NULL`);
      if (input.scoringFrameworks !== undefined) sets.push(input.scoringFrameworks ? `scoring_frameworks = '${esc(input.scoringFrameworks)}'` : `scoring_frameworks = NULL`);
      if (input.evidenceTypes !== undefined) sets.push(input.evidenceTypes ? `evidence_types = '${esc(input.evidenceTypes)}'` : `evidence_types = NULL`);
      if (input.approvalGate !== undefined) sets.push(input.approvalGate ? `approval_gate = '${esc(input.approvalGate)}'` : `approval_gate = NULL`);
      if (input.rdStage !== undefined) sets.push(input.rdStage ? `rd_stage = '${esc(input.rdStage)}'` : `rd_stage = NULL`);
      if (input.investmentPackStatus !== undefined) sets.push(input.investmentPackStatus ? `investment_pack_status = '${esc(input.investmentPackStatus)}'` : `investment_pack_status = NULL`);
      if (input.missingEvidenceTrigger !== undefined) sets.push(input.missingEvidenceTrigger ? `missing_evidence_trigger = '${esc(input.missingEvidenceTrigger)}'` : `missing_evidence_trigger = NULL`);
      if (input.scoreThresholdTrigger !== undefined) sets.push(input.scoreThresholdTrigger ? `score_threshold_trigger = '${esc(input.scoreThresholdTrigger)}'` : `score_threshold_trigger = NULL`);
      if (input.riskThresholdTrigger !== undefined) sets.push(input.riskThresholdTrigger ? `risk_threshold_trigger = '${esc(input.riskThresholdTrigger)}'` : `risk_threshold_trigger = NULL`);
      if (input.approvalGateTrigger !== undefined) sets.push(input.approvalGateTrigger ? `approval_gate_trigger = '${esc(input.approvalGateTrigger)}'` : `approval_gate_trigger = NULL`);
      if (input.rdStageTrigger !== undefined) sets.push(input.rdStageTrigger ? `rd_stage_trigger = '${esc(input.rdStageTrigger)}'` : `rd_stage_trigger = NULL`);
      if (input.investmentPackStatusTrigger !== undefined) sets.push(input.investmentPackStatusTrigger ? `investment_pack_status_trigger = '${esc(input.investmentPackStatusTrigger)}'` : `investment_pack_status_trigger = NULL`);
      if (input.priority !== undefined) sets.push(`priority = '${input.priority}'`);
      if (input.active !== undefined) sets.push(`active = ${input.active ? 1 : 0}`);
      await db.execute(
        sql.raw(`UPDATE playbook_context_rules SET ${sets.join(", ")} WHERE id = '${input.id}'`)
      );
      return { success: true };
    }),

  // A4. deleteContextRule
  adminDeleteRule: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      await db.execute(sql.raw(`DELETE FROM playbook_context_rules WHERE id = '${input.id}'`));
      return { success: true };
    }),

  // A5. updateWidgetConfig
  adminUpdateWidgetConfig: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        enabled: z.boolean().optional(),
        maxItems: z.number().optional(),
        displayMode: z.string().optional(),
        minRecommendationScore: z.number().optional(),
        showCompletionStatus: z.boolean().optional(),
        showEvidenceLinks: z.boolean().optional(),
        showScoreImpact: z.boolean().optional(),
        showRiskImpact: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      const now = Date.now();
      const sets: string[] = [`updated_by = '${ctx.user.id}'`, `updated_at = ${now}`];
      if (input.enabled !== undefined) sets.push(`enabled = ${input.enabled ? 1 : 0}`);
      if (input.maxItems !== undefined) sets.push(`max_items = ${input.maxItems}`);
      if (input.displayMode !== undefined) sets.push(`display_mode = '${input.displayMode}'`);
      if (input.minRecommendationScore !== undefined) sets.push(`min_recommendation_score = ${input.minRecommendationScore}`);
      if (input.showCompletionStatus !== undefined) sets.push(`show_completion_status = ${input.showCompletionStatus ? 1 : 0}`);
      if (input.showEvidenceLinks !== undefined) sets.push(`show_evidence_links = ${input.showEvidenceLinks ? 1 : 0}`);
      if (input.showScoreImpact !== undefined) sets.push(`show_score_impact = ${input.showScoreImpact ? 1 : 0}`);
      if (input.showRiskImpact !== undefined) sets.push(`show_risk_impact = ${input.showRiskImpact ? 1 : 0}`);
      await db.execute(
        sql.raw(`UPDATE playbook_widget_configs SET ${sets.join(", ")} WHERE id = '${input.id}'`)
      );
      return { success: true };
    }),

  // A6. getWidgetConfigs — all widget configs (admin view)
  adminListWidgetConfigs: protectedProcedure
    .input(z.object({ module: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      const where = input.module ? `WHERE module = '${input.module}'` : "";
      const [rows] = await db.execute(
        sql.raw(`SELECT * FROM playbook_widget_configs ${where} ORDER BY module, widget_type`)
      );
      return rows as any[];
    }),

  // A7. getUsageAnalytics — usage event aggregation
  adminUsageAnalytics: protectedProcedure
    .input(
      z.object({
        days: z.number().optional().default(30),
        module: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      const cutoff = Date.now() - input.days * 24 * 60 * 60 * 1000;
      const moduleFilter = input.module ? ` AND module = '${input.module}'` : "";

      // Total events
      const [totalRows] = await db.execute(
        sql.raw(`SELECT COUNT(*) as total FROM playbook_usage_events WHERE created_at >= ${cutoff}${moduleFilter}`)
      );

      // By action type
      const [byAction] = await db.execute(
        sql.raw(`SELECT action_type, COUNT(*) as count FROM playbook_usage_events WHERE created_at >= ${cutoff}${moduleFilter} GROUP BY action_type ORDER BY count DESC`)
      );

      // Top playbooks
      const [topPlaybooks] = await db.execute(
        sql.raw(`SELECT pue.playbook_id, pl.title, COUNT(*) as views FROM playbook_usage_events pue JOIN playbook_library pl ON pue.playbook_id = pl.id WHERE pue.created_at >= ${cutoff}${moduleFilter} GROUP BY pue.playbook_id, pl.title ORDER BY views DESC LIMIT 10`)
      );

      // By module
      const [byModule] = await db.execute(
        sql.raw(`SELECT module, COUNT(*) as count FROM playbook_usage_events WHERE created_at >= ${cutoff} GROUP BY module ORDER BY count DESC`)
      );

      // Completion rate
      const [completions] = await db.execute(
        sql.raw(`SELECT completion_status, COUNT(*) as count FROM playbook_completions WHERE created_at >= ${cutoff} GROUP BY completion_status`)
      );

      return {
        totalEvents: (totalRows as any[])[0]?.total || 0,
        byAction: byAction as any[],
        topPlaybooks: topPlaybooks as any[],
        byModule: byModule as any[],
        completionBreakdown: completions as any[],
      };
    }),
});

export type ContextualRouter = typeof contextualRouter;
