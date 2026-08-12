/**
 * Contextual Playbook Widget Router
 *
 * 12 contextual procedures (fetching recommendations, completions, usage)
 * 7 admin procedures (managing context rules, widget configs, analytics)
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { sql, SQL } from "drizzle-orm";
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
  getRecommendations: publicProcedure
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
        ctx.user?.id ?? "anonymous",
        ctx.user?.role ?? "user"
      );
    }),

  // 2. getPlaybookDetail — full playbook content for the drawer
  getPlaybookDetail: publicProcedure
    .input(z.object({ playbookId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [rows] = await db.execute(
        sql`SELECT * FROM playbook_library WHERE id = ${input.playbookId} LIMIT 1`
      );
      const playbook = (rows as any[])[0];
      if (!playbook) throw new TRPCError({ code: "NOT_FOUND", message: "Playbook not found" });
      return playbook;
    }),

  // 3. getCompletionStatus — check if user has completed a playbook for a venture
  getCompletionStatus: publicProcedure
    .input(
      z.object({
        playbookId: z.string(),
        ventureId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) return null;
      const db = await getDb();
      const [rows] = await db.execute(
        sql`SELECT * FROM playbook_completions WHERE playbook_id = ${input.playbookId} AND venture_id = ${input.ventureId} AND user_id = ${ctx.user.id} ORDER BY updated_at DESC LIMIT 1`
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
        sql`INSERT INTO playbook_completions (id, playbook_id, user_id, venture_id, module, workflow_stage, completion_status, completed_steps, evidence_links, created_at, updated_at) VALUES (${id}, ${input.playbookId}, ${ctx.user.id}, ${input.ventureId}, ${input.module}, ${input.workflowStage}, 'In_Progress', '[]', '[]', ${now}, ${now})`
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
      const sets: SQL[] = [sql`updated_at = ${now}`];
      if (input.completedSteps) sets.push(sql`completed_steps = ${JSON.stringify(input.completedSteps)}`);
      if (input.evidenceLinks) sets.push(sql`evidence_links = ${JSON.stringify(input.evidenceLinks)}`);
      if (input.completionStatus) {
        sets.push(sql`completion_status = ${input.completionStatus}`);
        if (input.completionStatus === "Completed") sets.push(sql`completed_at = ${now}`);
      }
      await db.execute(
        sql`UPDATE playbook_completions SET ${sql.join(sets, sql.raw(", "))} WHERE id = ${input.completionId}`
      );
      return { success: true };
    }),

  // 6. getVentureCompletions — all completions for a venture
  getVentureCompletions: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [rows] = await db.execute(
        sql`SELECT pc.*, pl.title, pl.category FROM playbook_completions pc JOIN playbook_library pl ON pc.playbook_id = pl.id WHERE pc.venture_id = ${input.ventureId} ORDER BY pc.updated_at DESC`
      );
      return rows as any[];
    }),

  // 7. logUsageEvent — track playbook interactions (auth required; task #210 hardening)
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
      if (!ctx.user?.id) return { id: null };
      const db = await getDb();
      const id = uuid();
      const now = Date.now();
      await db.execute(
        sql`INSERT INTO playbook_usage_events (id, playbook_id, user_id, venture_id, module, page, widget_type, action_type, context_snapshot, outcome, created_at) VALUES (${id}, ${input.playbookId}, ${ctx.user.id}, ${input.ventureId ?? null}, ${input.module}, ${input.page ?? null}, ${input.widgetType}, ${input.actionType}, ${input.contextSnapshot ?? null}, ${input.outcome ?? null}, ${now})`
      );
      return { id };
    }),

  // 8. searchPlaybooks — full-text search across all published playbooks
  searchPlaybooks: publicProcedure
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
      const likeQuery = `%${input.query}%`;
      const conditions: SQL[] = [
        sql`status = 'Published'`,
        sql`(title LIKE ${likeQuery} OR purpose LIKE ${likeQuery} OR step_by_step_guidance LIKE ${likeQuery} OR category LIKE ${likeQuery})`,
      ];
      if (input.module) conditions.push(sql`related_module = ${input.module}`);
      if (input.category) conditions.push(sql`category = ${input.category}`);
      const whereClause = sql.join(conditions, sql.raw(" AND "));
      const [rows] = await db.execute(
        sql`SELECT id, title, category, related_module, purpose, when_to_use, access_level, status FROM playbook_library WHERE ${whereClause} ORDER BY title LIMIT ${input.limit}`
      );
      return rows as any[];
    }),

  // 9. getModuleWidgetConfigs — widget configs for a specific module
  getModuleWidgetConfigs: publicProcedure
    .input(z.object({ module: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [rows] = await db.execute(
        sql`SELECT * FROM playbook_widget_configs WHERE module = ${input.module} ORDER BY widget_type`
      );
      return rows as any[];
    }),

  // 10. getGuidanceEvents — active guidance events for a venture
  getGuidanceEvents: publicProcedure
    .input(
      z.object({
        ventureId: z.string(),
        module: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions: SQL[] = [sql`venture_id = ${input.ventureId}`, sql`status = 'Active'`];
      if (input.module) conditions.push(sql`module = ${input.module}`);
      const whereClause = sql.join(conditions, sql.raw(" AND "));
      const [rows] = await db.execute(
        sql`SELECT * FROM contextual_guidance_events WHERE ${whereClause} ORDER BY created_at DESC LIMIT 20`
      );
      return rows as any[];
    }),

  // 11. resolveGuidanceEvent — mark a guidance event as resolved
  resolveGuidanceEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.execute(
        sql`UPDATE contextual_guidance_events SET status = 'Resolved', resolved_at = ${Date.now()} WHERE id = ${input.eventId}`
      );
      return { success: true };
    }),

  // 12. getPlaybookCategories — list all categories with counts
  getPlaybookCategories: publicProcedure.query(async () => {
    const db = await getDb();
    const [rows] = await db.execute(
      sql.raw(`SELECT category, COUNT(*) as count FROM playbook_library WHERE status = 'Published' GROUP BY category ORDER BY category`)
    );
    return rows as any[];
  }),

  // ─── Specialised Widget Data Endpoints (7) ───

  // W1. getMissingEvidence — evidence gaps for current module/venture
  getMissingEvidence: publicProcedure
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
        sql`SELECT id, evidence_type, title, status, confidence_score, module FROM evidence_items WHERE venture_id = ${input.ventureId} ORDER BY created_at DESC LIMIT 50`
      ).catch(() => [[]]);
      const evidence = evidenceRows as any[];

      // Fetch recommended playbooks for missing evidence context
      const playbooks = await getContextualPlaybooks(
        input.ventureId, input.module, "ALL", "ALL", ctx.user?.id ?? "anonymous", ctx.user?.role ?? "user"
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
  getScoreImprovement: publicProcedure
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
        sql`SELECT * FROM vrl_scores WHERE venture_id = ${input.ventureId} ORDER BY created_at DESC LIMIT 1`
      ).catch(() => [[]]);
      const latestScore = (scoreRows as any[])[0];

      // Fetch risk count
      const [riskRows] = await db.execute(
        sql`SELECT COUNT(*) as cnt FROM risk_register WHERE venture_id = ${input.ventureId} AND risk_level IN ('High','Critical') AND status = 'Open'`
      ).catch(() => [[{ cnt: 0 }]]);
      const highRisks = (riskRows as any[])[0]?.cnt || 0;

      // Fetch evidence confidence
      const [evRows] = await db.execute(
        sql`SELECT COUNT(*) as total, SUM(CASE WHEN status IN ('Approved','Verified') THEN 1 ELSE 0 END) as approved FROM evidence_items WHERE venture_id = ${input.ventureId}`
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
        input.ventureId, "Readiness Scoring", "ALL", "ALL", ctx.user?.id ?? "anonymous", ctx.user?.role ?? "user"
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
  getRDStageGuidance: publicProcedure
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
        sql`SELECT * FROM rd_projects WHERE venture_id = ${input.ventureId} ORDER BY created_at DESC LIMIT 1`
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
        sql`SELECT evidence_type, status FROM evidence_items WHERE venture_id = ${input.ventureId} AND module = 'Research & Technical Validation'`
      ).catch(() => [[]]);
      const evidence = evRows as any[];
      const completedEv = evidence.filter(e => e.status === "Approved" || e.status === "Verified").map(e => e.evidence_type);
      const missing = required.filter(r => !completedEv.some(c => c?.toLowerCase().includes(r.toLowerCase().split(" ")[0])));

      const playbooks = await getContextualPlaybooks(
        input.ventureId, "Research & Technical Validation", "ALL", "ALL", ctx.user?.id ?? "anonymous", ctx.user?.role ?? "user"
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
  getInvestmentPackReadiness: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      // Fetch VRL score
      const [scoreRows] = await db.execute(
        sql`SELECT composite_score, vrl_score, brl_score FROM vrl_scores WHERE venture_id = ${input.ventureId} ORDER BY created_at DESC LIMIT 1`
      ).catch(() => [[]]);
      const score = (scoreRows as any[])[0];

      // Fetch high risks
      const [riskRows] = await db.execute(
        sql`SELECT COUNT(*) as cnt FROM risk_register WHERE venture_id = ${input.ventureId} AND risk_level IN ('High','Critical') AND status = 'Open'`
      ).catch(() => [[{ cnt: 0 }]]);
      const highRisks = (riskRows as any[])[0]?.cnt || 0;

      // Fetch evidence confidence
      const [evRows] = await db.execute(
        sql`SELECT COUNT(*) as total, SUM(CASE WHEN status IN ('Approved','Verified') THEN 1 ELSE 0 END) as approved FROM evidence_items WHERE venture_id = ${input.ventureId}`
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
        input.ventureId, "Investment Readiness", "ALL", "ALL", ctx.user?.id ?? "anonymous", ctx.user?.role ?? "user"
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
  getRiskMitigation: publicProcedure
    .input(
      z.object({
        ventureId: z.string(),
        module: z.string().optional().default("Risk Intelligence"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const [riskRows] = await db.execute(
        sql`SELECT id, risk_category, risk_title, risk_level, status, mitigation_status, risk_score, owner FROM risk_register WHERE venture_id = ${input.ventureId} AND risk_level IN ('High','Critical') AND status IN ('Open','Escalated') ORDER BY risk_score DESC LIMIT 10`
      ).catch(() => [[]]);
      const risks = riskRows as any[];

      const playbooks = await getContextualPlaybooks(
        input.ventureId, "Risk Intelligence", "ALL", "ALL", ctx.user?.id ?? "anonymous", ctx.user?.role ?? "user"
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
  getStageGate: publicProcedure
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
        sql`SELECT id, name, status, vrl_stage FROM ventures WHERE id = ${input.ventureId} LIMIT 1`
      ).catch(() => [[]]);
      const venture = (ventureRows as any[])[0];
      const currentStage = input.currentStage || venture?.vrl_stage || "Validation";

      // Fetch pending approvals
      const [approvalRows] = await db.execute(
        sql`SELECT id, gate_name, status, decision, blockers FROM stage_gate_decisions WHERE venture_id = ${input.ventureId} AND status IN ('Pending','Blocked') ORDER BY created_at DESC LIMIT 5`
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
        input.ventureId, "Governance", "ALL", "ALL", ctx.user?.id ?? "anonymous", ctx.user?.role ?? "user"
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
  getWidgetContext: publicProcedure
    .input(
      z.object({
        ventureId: z.string().nullable(),
        module: z.string(),
        widgetTypes: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const playbooks = await getContextualPlaybooks(
        input.ventureId, input.module, "ALL", "ALL", ctx.user?.id ?? "anonymous", ctx.user?.role ?? "user"
      );
      return {
        module: input.module,
        ventureId: input.ventureId,
        recommendedPlaybooks: playbooks,
        userRole: ctx.user?.role ?? "user",
      };
    }),

  // ─── Admin Procedures (7) ───

  // A1. listContextRules — all context rules with playbook titles
  adminListRules: publicProcedure.query(async () => {
    const db = await getDb();
    const [rows] = await db.execute(
      sql.raw(`SELECT pcr.*, pl.title as playbook_title FROM playbook_context_rules pcr LEFT JOIN playbook_library pl ON pcr.playbook_id = pl.id ORDER BY pcr.module, pcr.priority DESC`)
    ).catch(() => [[]]);
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
      await db.execute(
        sql`INSERT INTO playbook_context_rules (id, rule_name, description, playbook_id, module, page, workflow_stage, venture_stage, venture_type, spv_brand, user_roles, risk_categories, scoring_frameworks, evidence_types, approval_gate, rd_stage, investment_pack_status, missing_evidence_trigger, score_threshold_trigger, risk_threshold_trigger, approval_gate_trigger, rd_stage_trigger, investment_pack_status_trigger, priority, active, created_by, updated_by, created_at, updated_at) VALUES (${id}, ${input.ruleName}, ${input.description ?? null}, ${input.playbookId}, ${input.module}, ${input.page}, ${input.workflowStage}, ${input.ventureStage}, ${input.ventureType}, ${input.spvBrand}, ${input.userRoles ?? null}, ${input.riskCategories ?? null}, ${input.scoringFrameworks ?? null}, ${input.evidenceTypes ?? null}, ${input.approvalGate ?? null}, ${input.rdStage ?? null}, ${input.investmentPackStatus ?? null}, ${input.missingEvidenceTrigger ?? null}, ${input.scoreThresholdTrigger ?? null}, ${input.riskThresholdTrigger ?? null}, ${input.approvalGateTrigger ?? null}, ${input.rdStageTrigger ?? null}, ${input.investmentPackStatusTrigger ?? null}, ${input.priority}, 1, ${ctx.user.id}, ${ctx.user.id}, ${now}, ${now})`
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
      const sets: SQL[] = [sql`updated_by = ${ctx.user.id}`, sql`updated_at = ${now}`];
      if (input.ruleName !== undefined) sets.push(sql`rule_name = ${input.ruleName}`);
      if (input.description !== undefined) sets.push(sql`description = ${input.description}`);
      if (input.playbookId !== undefined) sets.push(sql`playbook_id = ${input.playbookId}`);
      if (input.module !== undefined) sets.push(sql`module = ${input.module}`);
      if (input.page !== undefined) sets.push(sql`page = ${input.page}`);
      if (input.workflowStage !== undefined) sets.push(sql`workflow_stage = ${input.workflowStage}`);
      if (input.ventureStage !== undefined) sets.push(sql`venture_stage = ${input.ventureStage}`);
      if (input.ventureType !== undefined) sets.push(sql`venture_type = ${input.ventureType}`);
      if (input.spvBrand !== undefined) sets.push(sql`spv_brand = ${input.spvBrand}`);
      if (input.userRoles !== undefined) sets.push(sql`user_roles = ${input.userRoles ?? null}`);
      if (input.riskCategories !== undefined) sets.push(sql`risk_categories = ${input.riskCategories ?? null}`);
      if (input.scoringFrameworks !== undefined) sets.push(sql`scoring_frameworks = ${input.scoringFrameworks ?? null}`);
      if (input.evidenceTypes !== undefined) sets.push(sql`evidence_types = ${input.evidenceTypes ?? null}`);
      if (input.approvalGate !== undefined) sets.push(sql`approval_gate = ${input.approvalGate ?? null}`);
      if (input.rdStage !== undefined) sets.push(sql`rd_stage = ${input.rdStage ?? null}`);
      if (input.investmentPackStatus !== undefined) sets.push(sql`investment_pack_status = ${input.investmentPackStatus ?? null}`);
      if (input.missingEvidenceTrigger !== undefined) sets.push(sql`missing_evidence_trigger = ${input.missingEvidenceTrigger ?? null}`);
      if (input.scoreThresholdTrigger !== undefined) sets.push(sql`score_threshold_trigger = ${input.scoreThresholdTrigger ?? null}`);
      if (input.riskThresholdTrigger !== undefined) sets.push(sql`risk_threshold_trigger = ${input.riskThresholdTrigger ?? null}`);
      if (input.approvalGateTrigger !== undefined) sets.push(sql`approval_gate_trigger = ${input.approvalGateTrigger ?? null}`);
      if (input.rdStageTrigger !== undefined) sets.push(sql`rd_stage_trigger = ${input.rdStageTrigger ?? null}`);
      if (input.investmentPackStatusTrigger !== undefined) sets.push(sql`investment_pack_status_trigger = ${input.investmentPackStatusTrigger ?? null}`);
      if (input.priority !== undefined) sets.push(sql`priority = ${input.priority}`);
      if (input.active !== undefined) sets.push(sql`active = ${input.active ? 1 : 0}`);
      await db.execute(
        sql`UPDATE playbook_context_rules SET ${sql.join(sets, sql.raw(", "))} WHERE id = ${input.id}`
      );
      return { success: true };
    }),

  // A4. deleteContextRule
  adminDeleteRule: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      await db.execute(sql`DELETE FROM playbook_context_rules WHERE id = ${input.id}`);
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
      const sets: SQL[] = [sql`updated_by = ${ctx.user.id}`, sql`updated_at = ${now}`];
      if (input.enabled !== undefined) sets.push(sql`enabled = ${input.enabled ? 1 : 0}`);
      if (input.maxItems !== undefined) sets.push(sql`max_items = ${input.maxItems}`);
      if (input.displayMode !== undefined) sets.push(sql`display_mode = ${input.displayMode}`);
      if (input.minRecommendationScore !== undefined) sets.push(sql`min_recommendation_score = ${input.minRecommendationScore}`);
      if (input.showCompletionStatus !== undefined) sets.push(sql`show_completion_status = ${input.showCompletionStatus ? 1 : 0}`);
      if (input.showEvidenceLinks !== undefined) sets.push(sql`show_evidence_links = ${input.showEvidenceLinks ? 1 : 0}`);
      if (input.showScoreImpact !== undefined) sets.push(sql`show_score_impact = ${input.showScoreImpact ? 1 : 0}`);
      if (input.showRiskImpact !== undefined) sets.push(sql`show_risk_impact = ${input.showRiskImpact ? 1 : 0}`);
      await db.execute(
        sql`UPDATE playbook_widget_configs SET ${sql.join(sets, sql.raw(", "))} WHERE id = ${input.id}`
      );
      return { success: true };
    }),

  // A6. getWidgetConfigs — all widget configs (admin view)
  adminListWidgetConfigs: publicProcedure
    .input(z.object({ module: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions: SQL[] = [];
      if (input.module) conditions.push(sql`module = ${input.module}`);
      const whereClause = conditions.length > 0
        ? sql`WHERE ${sql.join(conditions, sql.raw(" AND "))}`
        : sql.raw("");
      const [rows] = await db.execute(
        sql`SELECT * FROM playbook_widget_configs ${whereClause} ORDER BY module, widget_type`
      );
      return rows as any[];
    }),

  // A7. getUsageAnalytics — usage event aggregation
  adminUsageAnalytics: publicProcedure
    .input(
      z.object({
        days: z.number().optional().default(30),
        module: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      const cutoff = Date.now() - input.days * 24 * 60 * 60 * 1000;
      const baseConditions: SQL[] = [sql`created_at >= ${cutoff}`];
      if (input.module) baseConditions.push(sql`module = ${input.module}`);
      const whereClause = sql.join(baseConditions, sql.raw(" AND "));

      // Total events
      const [totalRows] = await db.execute(
        sql`SELECT COUNT(*) as total FROM playbook_usage_events WHERE ${whereClause}`
      );

      // By action type
      const [byAction] = await db.execute(
        sql`SELECT action_type, COUNT(*) as count FROM playbook_usage_events WHERE ${whereClause} GROUP BY action_type ORDER BY count DESC`
      );

      // Top playbooks
      const [topPlaybooks] = await db.execute(
        sql`SELECT pue.playbook_id, pl.title, COUNT(*) as views FROM playbook_usage_events pue JOIN playbook_library pl ON pue.playbook_id = pl.id WHERE ${whereClause} GROUP BY pue.playbook_id, pl.title ORDER BY views DESC LIMIT 10`
      );

      // By module (no module filter here — always show all modules)
      const cutoffOnly = sql`created_at >= ${cutoff}`;
      const [byModule] = await db.execute(
        sql`SELECT module, COUNT(*) as count FROM playbook_usage_events WHERE ${cutoffOnly} GROUP BY module ORDER BY count DESC`
      );

      // Completion rate
      const [completions] = await db.execute(
        sql`SELECT completion_status, COUNT(*) as count FROM playbook_completions WHERE ${cutoffOnly} GROUP BY completion_status`
      );

      return {
        totalEvents: (totalRows as any[])[0]?.total || 0,
        byAction: byAction as any[],
        topPlaybooks: topPlaybooks as any[],
        byModule: byModule as any[],
        completionBreakdown: completions as any[],
      };
    }),

  // A8. adminFullAnalytics — extended analytics for /admin/widget-analytics
  adminFullAnalytics: adminProcedure
    .input(
      z.object({
        days: z.number().optional().default(30),
        module: z.string().optional(),
        widgetType: z.string().optional(),
        ventureId: z.string().optional(),
        playbookId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      const cutoff = Date.now() - input.days * 24 * 60 * 60 * 1000;
      const filterParts: SQL[] = [sql`created_at >= ${cutoff}`];
      if (input.module) filterParts.push(sql`module = ${input.module}`);
      if (input.widgetType) filterParts.push(sql`widget_type = ${input.widgetType}`);
      if (input.ventureId) filterParts.push(sql`venture_id = ${input.ventureId}`);
      if (input.playbookId) filterParts.push(sql`playbook_id = ${input.playbookId}`);
      const where = sql.join(filterParts, sql.raw(" AND "));

      const [overview] = await db.execute(sql`
        SELECT
          COUNT(*) as totalViews,
          SUM(CASE WHEN action_type = 'PlaybookOpened' THEN 1 ELSE 0 END) as playbookOpens,
          SUM(CASE WHEN action_type = 'PlaybookCompleted' THEN 1 ELSE 0 END) as playbookCompletions,
          SUM(CASE WHEN action_type IN ('PlaybookDismissed','RecommendationDismissed') THEN 1 ELSE 0 END) as dismissals,
          SUM(CASE WHEN action_type = 'EvidenceLinked' THEN 1 ELSE 0 END) as evidenceLinked,
          SUM(CASE WHEN action_type = 'ApprovalGuidanceUsed' THEN 1 ELSE 0 END) as approvalsSupported,
          SUM(CASE WHEN action_type = 'InvestorWarningDisplayed' THEN 1 ELSE 0 END) as investorWarnings,
          SUM(CASE WHEN action_type = 'DraftInvestorPackGeneratedWithWarnings' THEN 1 ELSE 0 END) as draftPacksWithWarnings
        FROM playbook_usage_events WHERE ${where}
      `).catch(() => [[{}]]);

      const [byModule] = await db.execute(sql`
        SELECT module, COUNT(*) as views,
          SUM(CASE WHEN action_type = 'PlaybookOpened' THEN 1 ELSE 0 END) as opens,
          SUM(CASE WHEN action_type = 'PlaybookCompleted' THEN 1 ELSE 0 END) as completions
        FROM playbook_usage_events WHERE ${where}
        GROUP BY module ORDER BY views DESC
      `).catch(() => [[]]);

      const [byWidget] = await db.execute(sql`
        SELECT widget_type, COUNT(*) as views,
          SUM(CASE WHEN action_type = 'PlaybookOpened' THEN 1 ELSE 0 END) as opens
        FROM playbook_usage_events WHERE ${where}
        GROUP BY widget_type ORDER BY views DESC
      `).catch(() => [[]]);

      const [topPlaybooks] = await db.execute(sql`
        SELECT pue.playbook_id, pl.title, pl.category,
          COUNT(*) as views,
          SUM(CASE WHEN pue.action_type = 'PlaybookOpened' THEN 1 ELSE 0 END) as opens,
          SUM(CASE WHEN pue.action_type = 'PlaybookCompleted' THEN 1 ELSE 0 END) as completions,
          SUM(CASE WHEN pue.action_type IN ('PlaybookDismissed','RecommendationDismissed') THEN 1 ELSE 0 END) as dismissals
        FROM playbook_usage_events pue
        LEFT JOIN playbook_library pl ON pue.playbook_id = pl.id
        WHERE ${where}
        GROUP BY pue.playbook_id, pl.title, pl.category
        ORDER BY views DESC LIMIT 20
      `).catch(() => [[]]);

      const [recPerf] = await db.execute(sql`
        SELECT
          COUNT(*) as displayed,
          SUM(CASE WHEN action_type = 'PlaybookOpened' THEN 1 ELSE 0 END) as opened,
          SUM(CASE WHEN action_type = 'PlaybookCompleted' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN action_type IN ('PlaybookDismissed','RecommendationDismissed') THEN 1 ELSE 0 END) as dismissed,
          SUM(CASE WHEN action_type = 'EvidenceLinked' THEN 1 ELSE 0 END) as evidenceLinked
        FROM playbook_usage_events WHERE ${where}
      `).catch(() => [[{}]]);

      const [dismissReasons] = await db.execute(sql`
        SELECT dismissed_reason, COUNT(*) as count
        FROM playbook_usage_events
        WHERE ${where} AND dismissed_reason IS NOT NULL
        GROUP BY dismissed_reason ORDER BY count DESC
      `).catch(() => [[]]);

      const [orphanPlaybooks] = await db.execute(sql.raw(`
        SELECT pl.id, pl.title, pl.category, pl.status
        FROM playbook_library pl
        LEFT JOIN playbook_context_rules pcr ON pl.id = pcr.playbook_id AND pcr.is_active = 1
        WHERE pl.status = 'Published' AND pcr.id IS NULL
        LIMIT 20
      `)).catch(() => [[]]);

      return {
        overview: (overview as any[])[0] || {},
        byModule: byModule as any[],
        byWidget: byWidget as any[],
        topPlaybooks: topPlaybooks as any[],
        recPerf: (recPerf as any[])[0] || {},
        dismissReasons: dismissReasons as any[],
        orphanPlaybooks: orphanPlaybooks as any[],
      };
    }),

  // A9. adminGetWidgetSettings — fetch global + threshold + module + role settings
  adminGetWidgetSettings: adminProcedure.query(async () => {
    const toRows = (r: any): any[] => {
      if (!r) return [];
      if (Array.isArray(r)) return r;
      if (Array.isArray(r.rows)) return r.rows;
      return [];
    };
    try {
      const db = await getDb();
      if (!db) return { global: {}, thresholds: {}, roleSettings: [], moduleConfigs: [] };
      const globalRes   = await db.execute(sql.raw(`SELECT * FROM widget_global_settings WHERE id = 1`)).catch(() => ({ rows: [{}] }));
      const threshRes   = await db.execute(sql.raw(`SELECT * FROM widget_threshold_settings WHERE id = 1`)).catch(() => ({ rows: [{}] }));
      const roleRes     = await db.execute(sql.raw(`SELECT * FROM widget_role_settings ORDER BY role, widget_type`)).catch(() => ({ rows: [] }));
      const moduleRes   = await db.execute(sql.raw(`SELECT * FROM playbook_widget_configs ORDER BY module, widget_type`)).catch(() => ({ rows: [] }));
      return {
        global:       toRows(globalRes)[0]  || {},
        thresholds:   toRows(threshRes)[0]  || {},
        roleSettings: toRows(roleRes),
        moduleConfigs: toRows(moduleRes),
      };
    } catch {
      return { global: {}, thresholds: {}, roleSettings: [], moduleConfigs: [] };
    }
  }),

  // A10. adminUpdateWidgetGlobalSettings
  adminUpdateWidgetGlobalSettings: protectedProcedure
    .input(z.object({
      enableWidgetsGlobally: z.boolean().optional(),
      showAsSidePanel: z.boolean().optional(),
      showInline: z.boolean().optional(),
      maxRecommendedPlaybooks: z.number().optional(),
      defaultRecommendationThreshold: z.number().optional(),
      enableUsageTracking: z.boolean().optional(),
      enableDismissalReasons: z.boolean().optional(),
      enableCompletionTracking: z.boolean().optional(),
      enableInvestorWarningGates: z.boolean().optional(),
      enableStageGateWarningGates: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      const updater = ctx.user.name || ctx.user.openId;
      const sets: SQL[] = [sql`updatedBy = ${updater}`];
      if (input.enableWidgetsGlobally !== undefined) sets.push(sql`enableWidgetsGlobally = ${input.enableWidgetsGlobally ? 1 : 0}`);
      if (input.showAsSidePanel !== undefined) sets.push(sql`showAsSidePanel = ${input.showAsSidePanel ? 1 : 0}`);
      if (input.showInline !== undefined) sets.push(sql`showInline = ${input.showInline ? 1 : 0}`);
      if (input.maxRecommendedPlaybooks !== undefined) sets.push(sql`maxRecommendedPlaybooks = ${input.maxRecommendedPlaybooks}`);
      if (input.defaultRecommendationThreshold !== undefined) sets.push(sql`defaultRecommendationThreshold = ${input.defaultRecommendationThreshold}`);
      if (input.enableUsageTracking !== undefined) sets.push(sql`enableUsageTracking = ${input.enableUsageTracking ? 1 : 0}`);
      if (input.enableDismissalReasons !== undefined) sets.push(sql`enableDismissalReasons = ${input.enableDismissalReasons ? 1 : 0}`);
      if (input.enableCompletionTracking !== undefined) sets.push(sql`enableCompletionTracking = ${input.enableCompletionTracking ? 1 : 0}`);
      if (input.enableInvestorWarningGates !== undefined) sets.push(sql`enableInvestorWarningGates = ${input.enableInvestorWarningGates ? 1 : 0}`);
      if (input.enableStageGateWarningGates !== undefined) sets.push(sql`enableStageGateWarningGates = ${input.enableStageGateWarningGates ? 1 : 0}`);
      await db.execute(sql`INSERT INTO widget_global_settings (id) VALUES (1) ON DUPLICATE KEY UPDATE ${sql.join(sets, sql.raw(", "))}`);
      return { ok: true };
    }),

  // A11. adminUpdateWidgetThresholds
  adminUpdateWidgetThresholds: protectedProcedure
    .input(z.object({
      evidenceConfidenceWarning: z.number().optional(),
      readinessScoreWarning: z.number().optional(),
      highRiskThreshold: z.number().optional(),
      investorPackWarning: z.number().optional(),
      stageGateMinEvidence: z.number().optional(),
      maxUnresolvedHighRisks: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      const updater = ctx.user.name || ctx.user.openId;
      const sets: SQL[] = [sql`updatedBy = ${updater}`];
      if (input.evidenceConfidenceWarning !== undefined) sets.push(sql`evidenceConfidenceWarning = ${input.evidenceConfidenceWarning}`);
      if (input.readinessScoreWarning !== undefined) sets.push(sql`readinessScoreWarning = ${input.readinessScoreWarning}`);
      if (input.highRiskThreshold !== undefined) sets.push(sql`highRiskThreshold = ${input.highRiskThreshold}`);
      if (input.investorPackWarning !== undefined) sets.push(sql`investorPackWarning = ${input.investorPackWarning}`);
      if (input.stageGateMinEvidence !== undefined) sets.push(sql`stageGateMinEvidence = ${input.stageGateMinEvidence}`);
      if (input.maxUnresolvedHighRisks !== undefined) sets.push(sql`maxUnresolvedHighRisks = ${input.maxUnresolvedHighRisks}`);
      await db.execute(sql`INSERT INTO widget_threshold_settings (id) VALUES (1) ON DUPLICATE KEY UPDATE ${sql.join(sets, sql.raw(", "))}`);
      return { ok: true };
    }),

  // A12. adminUpdateModuleWidgetConfig
  adminUpdateModuleWidgetConfig: protectedProcedure
    .input(z.object({
      module: z.string(),
      widgetType: z.string(),
      isEnabled: z.boolean().optional(),
      maxPlaybooks: z.number().optional(),
      threshold: z.number().optional(),
      position: z.enum(["sidebar", "inline", "both"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      const updater = ctx.user.name || ctx.user.openId;
      const now = Date.now();
      const id = uuid();
      const sets: SQL[] = [sql`updated_by = ${updater}`, sql`updated_at = ${now}`];
      if (input.isEnabled !== undefined) sets.push(sql`enabled = ${input.isEnabled ? 1 : 0}`);
      if (input.maxPlaybooks !== undefined) sets.push(sql`max_items = ${input.maxPlaybooks}`);
      if (input.threshold !== undefined) sets.push(sql`min_recommendation_score = ${input.threshold}`);
      if (input.position !== undefined) sets.push(sql`placement = ${input.position}`);
      await db.execute(sql`
        INSERT INTO playbook_widget_configs
          (id, module, widget_type, page, placement, enabled, max_items, display_mode,
           show_completion_status, show_evidence_links, show_score_impact, show_risk_impact,
           min_recommendation_score, created_by, updated_by, created_at, updated_at)
        VALUES
          (${id}, ${input.module}, ${input.widgetType}, 'ALL', 'RightPanel', 1, 5, 'Standard',
           1, 1, 0, 0, 30, ${updater}, ${updater}, ${now}, ${now})
        ON DUPLICATE KEY UPDATE ${sql.join(sets, sql.raw(", "))}
      `);
      return { ok: true };
    }),

  // A13. adminUpdateRoleVisibility
  adminUpdateRoleVisibility: protectedProcedure
    .input(z.object({
      role: z.string(),
      widgetType: z.string(),
      isVisible: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      const updater = ctx.user.name || ctx.user.openId;
      await db.execute(sql`
        INSERT INTO widget_role_settings (role, widget_type, isVisible, updatedBy)
        VALUES (${input.role}, ${input.widgetType}, ${input.isVisible ? 1 : 0}, ${updater})
        ON DUPLICATE KEY UPDATE isVisible = ${input.isVisible ? 1 : 0}, updatedBy = ${updater}
      `);
      return { ok: true };
    }),

  // A14. adminGetContextDiagnostics — explain why recommendations appear
  adminGetContextDiagnostics: adminProcedure
    .input(z.object({
      ventureId: z.string().optional(),
      module: z.string(),
      page: z.string().optional(),
      workflowStage: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const allRules = (await db.execute(sql`
        SELECT pcr.*, pl.title as playbook_title, pl.status as playbook_status
        FROM playbook_context_rules pcr
        LEFT JOIN playbook_library pl ON pcr.playbook_id = pl.id
        WHERE pcr.module = ${input.module} OR pcr.module IS NULL
        ORDER BY pcr.priority DESC
      `).catch(() => ({ rows: [] }))).rows;
      let ventureInfo: any = null;
      if (input.ventureId) {
        const vRows = (await db.execute(sql`SELECT id, name, vrl, trl, status FROM ventures WHERE id = ${input.ventureId} LIMIT 1`).catch(() => ({ rows: [] }))).rows;
        ventureInfo = (vRows as any[])[0] || null;
      }
      const rules = allRules as any[];
      const matched: any[] = [];
      const excluded: any[] = [];
      for (const rule of rules) {
        const exclusions: string[] = [];
        if (rule.module && rule.module !== input.module) exclusions.push(`Module mismatch: rule requires '${rule.module}', current is '${input.module}'`);
        if (rule.playbook_status && rule.playbook_status !== 'Published') exclusions.push(`Playbook status is '${rule.playbook_status}' (not Published)`);
        if (!rule.is_active) exclusions.push('Rule is inactive');
        if (exclusions.length > 0) {
          excluded.push({ ...rule, exclusionReasons: exclusions });
        } else {
          const reasons: string[] = [];
          if (rule.module === input.module) reasons.push(`Module matched: ${input.module}`);
          if (rule.missing_evidence_trigger) reasons.push('Missing evidence trigger: enabled');
          if (rule.high_risk_trigger) reasons.push('High risk trigger: enabled');
          if (rule.low_score_trigger) reasons.push('Low score trigger: enabled');
          if (rule.stage_gate_trigger) reasons.push('Stage-gate trigger: enabled');
          if (rule.investor_warning_trigger) reasons.push('Investor warning trigger: enabled');
          matched.push({ ...rule, matchReasons: reasons });
        }
      }
      return {
        module: input.module,
        page: input.page || null,
        venture: ventureInfo,
        userRole: "admin",
        matchedRules: matched,
        excludedRules: excluded,
        totalRules: rules.length,
        matchedCount: matched.length,
        excludedCount: excluded.length,
      };
    }),

  // A15. adminExportAnalyticsCsv — export usage events as raw rows for CSV download
  adminExportAnalyticsCsv: adminProcedure
    .input(z.object({
      days: z.number().optional().default(30),
      module: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const cutoff = Date.now() - input.days * 24 * 60 * 60 * 1000;
      const conditions: SQL[] = [sql`created_at >= ${cutoff}`];
      if (input.module) conditions.push(sql`module = ${input.module}`);
      const whereClause = sql.join(conditions, sql.raw(" AND "));
      const rows = (await db.execute(sql`
        SELECT id, event_type, playbook_id, widget_type, user_id, venture_id, module, page,
               action_type, outcome, dismissed_reason, created_at
        FROM playbook_usage_events
        WHERE ${whereClause}
        ORDER BY created_at DESC LIMIT 5000
      `).catch(() => ({ rows: [] }))).rows;
      return { rows: rows as any[] };
    }),

  // ── Phase 3D: Recommendation Quality Loop ─────────────────────────────────

  // A16. adminQualityMetrics — aggregate quality metrics per playbook/widget
  adminQualityMetrics: publicProcedure
    .input(z.object({
      days: z.number().optional().default(30),
      module: z.string().optional(),
      widgetType: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const cutoff = Date.now() - input.days * 24 * 60 * 60 * 1000;
      const filterParts: SQL[] = [sql`pue.created_at >= ${cutoff}`];
      if (input.module) filterParts.push(sql`pue.module = ${input.module}`);
      if (input.widgetType) filterParts.push(sql`pue.widget_type = ${input.widgetType}`);
      const where = sql.join(filterParts, sql.raw(" AND "));

      const [playbookRows] = await db.execute(sql`
        SELECT
          pue.playbook_id,
          p.title AS playbook_title,
          pue.module,
          pue.widget_type,
          COUNT(*) AS total_events,
          SUM(CASE WHEN pue.action_type = 'View' THEN 1 ELSE 0 END) AS view_count,
          SUM(CASE WHEN pue.action_type = 'Open' THEN 1 ELSE 0 END) AS open_count,
          SUM(CASE WHEN pue.action_type = 'Dismiss' THEN 1 ELSE 0 END) AS dismiss_count,
          SUM(CASE WHEN pue.action_type = 'Complete' THEN 1 ELSE 0 END) AS complete_count,
          ROUND(100.0 * SUM(CASE WHEN pue.action_type = 'Open' THEN 1 ELSE 0 END) / NULLIF(SUM(CASE WHEN pue.action_type = 'View' THEN 1 ELSE 0 END), 0), 1) AS open_rate,
          ROUND(100.0 * SUM(CASE WHEN pue.action_type = 'Dismiss' THEN 1 ELSE 0 END) / NULLIF(SUM(CASE WHEN pue.action_type = 'View' THEN 1 ELSE 0 END), 0), 1) AS dismissal_rate,
          ROUND(100.0 * SUM(CASE WHEN pue.action_type = 'Complete' THEN 1 ELSE 0 END) / NULLIF(SUM(CASE WHEN pue.action_type = 'Open' THEN 1 ELSE 0 END), 0), 1) AS completion_rate
        FROM playbook_usage_events pue
        LEFT JOIN playbooks p ON p.id = pue.playbook_id
        WHERE ${where}
        GROUP BY pue.playbook_id, p.title, pue.module, pue.widget_type
        ORDER BY dismiss_count DESC, view_count DESC
        LIMIT 100
      `).catch(() => [[]]);

      const cutoffOnly = sql`created_at >= ${cutoff}`;
      const [dismissalReasons] = await db.execute(sql`
        SELECT dismissed_reason, COUNT(*) AS cnt, module, widget_type
        FROM playbook_usage_events
        WHERE action_type = 'Dismiss' AND dismissed_reason IS NOT NULL
          AND ${cutoffOnly}
        GROUP BY dismissed_reason, module, widget_type
        ORDER BY cnt DESC LIMIT 50
      `).catch(() => [[]]);

      const LOW_OPEN_THRESHOLD = 20;
      const HIGH_DISMISS_THRESHOLD = 40;
      const MIN_VIEWS = 5;
      const allPlaybooks = playbookRows as any[];
      const lowRelevancePlaybooks = allPlaybooks.filter(r =>
        r.view_count >= MIN_VIEWS &&
        (r.open_rate < LOW_OPEN_THRESHOLD || r.dismissal_rate > HIGH_DISMISS_THRESHOLD)
      );

      return {
        playbookMetrics: allPlaybooks,
        lowRelevancePlaybooks,
        dismissalReasons: dismissalReasons as any[],
        thresholds: { minViews: MIN_VIEWS, lowOpenRate: LOW_OPEN_THRESHOLD, highDismissalRate: HIGH_DISMISS_THRESHOLD },
      };
    }),

  // A17. adminQualityRuleMetrics — per context-rule quality metrics
  adminQualityRuleMetrics: publicProcedure
    .input(z.object({ days: z.number().optional().default(30) }))
    .query(async ({ input }) => {
      const db = await getDb();
      const cutoff = Date.now() - input.days * 24 * 60 * 60 * 1000;

      const [rules] = await db.execute(sql`
        SELECT
          pcr.id AS rule_id,
          pcr.rule_name,
          pcr.module,
          pcr.playbook_id,
          pcr.active,
          p.title AS playbook_title,
          COUNT(pue.id) AS total_events,
          SUM(CASE WHEN pue.action_type = 'View' THEN 1 ELSE 0 END) AS view_count,
          SUM(CASE WHEN pue.action_type = 'Open' THEN 1 ELSE 0 END) AS open_count,
          SUM(CASE WHEN pue.action_type = 'Dismiss' THEN 1 ELSE 0 END) AS dismiss_count,
          SUM(CASE WHEN pue.action_type = 'Complete' THEN 1 ELSE 0 END) AS complete_count,
          ROUND(100.0 * SUM(CASE WHEN pue.action_type = 'Open' THEN 1 ELSE 0 END) / NULLIF(SUM(CASE WHEN pue.action_type = 'View' THEN 1 ELSE 0 END), 0), 1) AS open_rate,
          ROUND(100.0 * SUM(CASE WHEN pue.action_type = 'Dismiss' THEN 1 ELSE 0 END) / NULLIF(SUM(CASE WHEN pue.action_type = 'View' THEN 1 ELSE 0 END), 0), 1) AS dismissal_rate,
          ROUND(100.0 * SUM(CASE WHEN pue.action_type = 'Complete' THEN 1 ELSE 0 END) / NULLIF(SUM(CASE WHEN pue.action_type = 'Open' THEN 1 ELSE 0 END), 0), 1) AS completion_rate
        FROM playbook_context_rules pcr
        LEFT JOIN playbooks p ON p.id = pcr.playbook_id
        LEFT JOIN playbook_usage_events pue ON pue.playbook_id = pcr.playbook_id AND pue.created_at >= ${cutoff}
        GROUP BY pcr.id, pcr.rule_name, pcr.module, pcr.playbook_id, pcr.active, p.title
        ORDER BY dismiss_count DESC, view_count DESC
      `).catch(() => [[]]);

      const allRules = rules as any[];
      const LOW_OPEN_THRESHOLD = 15;
      const HIGH_DISMISS_THRESHOLD = 50;
      const MIN_VIEWS = 3;
      const lowPerformingRules = allRules.filter(r =>
        r.active && r.view_count >= MIN_VIEWS &&
        (r.open_rate < LOW_OPEN_THRESHOLD || r.dismissal_rate > HIGH_DISMISS_THRESHOLD)
      );

      return {
        rules: allRules,
        lowPerformingRules,
        thresholds: { minViews: MIN_VIEWS, lowOpenRate: LOW_OPEN_THRESHOLD, highDismissalRate: HIGH_DISMISS_THRESHOLD },
      };
    }),

  // A18. adminArchiveContextRule — archive a low-performing context rule (admin only)
  adminArchiveContextRule: protectedProcedure
    .input(z.object({
      ruleId: z.string(),
      reason: z.string().optional().default("Archived due to low performance"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      const now = Date.now();

      const [ruleRows] = await db.execute(sql`
        SELECT id, rule_name, module, playbook_id, active FROM playbook_context_rules WHERE id = ${input.ruleId} LIMIT 1
      `).catch(() => [[]]);
      const rule = (ruleRows as any[])[0];
      if (!rule) throw new TRPCError({ code: "NOT_FOUND", message: "Context rule not found" });
      if (!rule.active) throw new TRPCError({ code: "BAD_REQUEST", message: "Rule is already archived" });

      await db.execute(sql`
        UPDATE playbook_context_rules SET active = 0, updated_by = ${ctx.user.id}, updated_at = ${now} WHERE id = ${input.ruleId}
      `);

      const auditId = uuid();
      await db.execute(sql`
        INSERT INTO audit_log (id, user_id, user_name, action, entity_type, entity_id, before_value, after_value, created_at)
        VALUES (${auditId}, ${ctx.user.id}, ${ctx.user.name || ctx.user.id},
                'ARCHIVE_CONTEXT_RULE', 'playbook_context_rules', ${input.ruleId},
                ${JSON.stringify({ active: true, rule_name: rule.rule_name })},
                ${JSON.stringify({ active: false, reason: input.reason })},
                ${now})
      `).catch(() => null);

      return { ok: true, ruleId: input.ruleId, ruleName: rule.rule_name };
    }),
});

export type ContextualRouter = typeof contextualRouter;
