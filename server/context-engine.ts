/**
 * Context Engine — Server-side Playbook Recommendation Service
 *
 * Evaluates the current venture context against active PlaybookContextRules
 * and returns ranked playbook lists per widget type.
 *
 * Scoring formula (max 100):
 *   Module Match:              30  (exact=30, same category=10)
 *   Workflow Stage Match:      20  (exact=20, adjacent=8)
 *   User Role Match:           15  (exact=15, general=10)
 *   Venture Stage Match:       10  (exact=10, adjacent=5)
 *   Missing Evidence Match:    10  (3 per overlap, max 10)
 *   Risk Category Match:        8  (2 per overlap, max 8)
 *   Scoring Framework Match:    5  (2 per match, max 5)
 *   Approval Requirement Match: 5  (binary)
 *   Admin Priority Flag:        5  (High=5, Medium=2, Low=0)
 *   Recency:                    2  (updated within 90 days)
 */

import { getDb } from "./db";
import { sql } from "drizzle-orm";

// ─── Types ───

export interface VentureContext {
  ventureId: string | null;
  module: string;
  page: string;
  workflowStage: string;
  userId: string;
  userRole: string;
  // Populated from DB queries
  ventureStage?: string;
  ventureType?: string;
  spvBrand?: string;
  missingEvidence?: string[];
  readinessScores?: Record<string, number>;
  highRiskCategories?: string[];
  approvalStatus?: string;
  rdStage?: string;
  investmentPackStatus?: string;
}

interface ContextRule {
  id: string;
  playbook_id: string;
  module: string;
  page: string;
  workflow_stage: string;
  venture_stage: string;
  venture_type: string;
  spv_brand: string;
  user_roles: string | null;
  risk_categories: string | null;
  scoring_frameworks: string | null;
  evidence_types: string | null;
  approval_gate: string | null;
  rd_stage: string | null;
  investment_pack_status: string | null;
  priority: string;
}

interface PlaybookRecord {
  id: string;
  title: string;
  category: string;
  relatedModule: string | null;
  relatedWorkflowStage: string | null;
  userRole: string | null;
  purpose: string | null;
  whenToUse: string | null;
  stepByStepGuidance: string | null;
  requiredInputs: string | null;
  requiredOutputs: string | null;
  linkedTemplates: string | null;
  linkedScoringFrameworks: string | null;
  linkedRiskCategories: string | null;
  evidenceRequired: string | null;
  completionChecklist: string | null;
  approvalRequired: number | null;
  accessLevel: string | null;
  status: string;
  version: number;
  updatedAt: number;
}

export interface ScoredPlaybook {
  playbook: PlaybookRecord;
  score: number;
  reason: string;
  ruleId: string;
  widgetTypes: string[];
}

export interface WidgetConfig {
  id: string;
  widget_type: string;
  module: string;
  enabled: boolean;
  max_items: number;
  display_mode: string;
  min_recommendation_score: number;
}

export interface ContextualPayload {
  [widgetType: string]: ScoredPlaybook[];
}

// ─── Module Category Mapping (for partial match scoring) ───
const MODULE_CATEGORIES: Record<string, string> = {
  "Command Centre": "Portfolio",
  "Venture Intake": "Intake",
  "Discovery & Market": "Validation",
  "Proposition & Business Model": "Validation",
  "R&D Hub": "Technical",
  "Operational & Manufacturing": "Technical",
  "Brand & GTM": "Commercial",
  "Sustainability & Impact": "Impact",
  "Risk Intelligence": "Risk",
  "Readiness Scoring": "Scoring",
  "Investment Readiness": "Investment",
  "Execution Planning": "Execution",
  "Coaching": "People",
  "Collaboration": "People",
  "Governance": "Governance",
  "Admin": "Admin",
};

// ─── Venture Stage Adjacency ───
const STAGE_ORDER = ["Idea", "Validation", "MVP", "Market Entry", "Scale"];

function stageDistance(a: string, b: string): number {
  const ia = STAGE_ORDER.indexOf(a);
  const ib = STAGE_ORDER.indexOf(b);
  if (ia === -1 || ib === -1) return 99;
  return Math.abs(ia - ib);
}

// ─── Widget Type Derivation ───
function deriveWidgetTypes(rule: ContextRule, playbook: PlaybookRecord): string[] {
  const types: string[] = ["RecommendedPlaybooks"];

  // Evidence-related
  if (rule.evidence_types) types.push("EvidenceRequirements", "MissingEvidence");

  // Risk-related
  if (rule.risk_categories) types.push("RiskLinked");

  // Score-related
  if (rule.scoring_frameworks) types.push("ScoreImprovement");

  // R&D stage
  if (rule.rd_stage && rule.rd_stage !== "ALL") types.push("RDStage");

  // Investment pack
  if (rule.investment_pack_status) types.push("InvestmentPackReadiness");

  // Approval gate
  if (rule.approval_gate) types.push("StageGateReadiness", "GovernanceDecision");

  return [...new Set(types)];
}

// ─── Safe JSON Parse ───
function safeJsonArray(val: string | null): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Try comma-separated fallback
    return val.split(",").map(s => s.trim()).filter(Boolean);
  }
}

// ─── Scoring ───

export function scorePlaybook(
  rule: ContextRule,
  playbook: PlaybookRecord,
  context: VentureContext
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // 1. Module Match (max 30)
  if (rule.module === context.module || rule.module === "ALL") {
    score += 30;
    reasons.push("Module match");
  } else if (MODULE_CATEGORIES[rule.module] === MODULE_CATEGORIES[context.module]) {
    score += 10;
    reasons.push("Same category");
  }

  // 2. Workflow Stage Match (max 20)
  if (rule.workflow_stage === "ALL" || rule.workflow_stage === context.workflowStage) {
    score += 20;
    reasons.push("Workflow stage match");
  } else if (context.workflowStage && rule.workflow_stage) {
    score += 8;
    reasons.push("Adjacent workflow stage");
  }

  // 3. User Role Match (max 15)
  const ruleRoles = safeJsonArray(rule.user_roles);
  if (ruleRoles.length === 0 || ruleRoles.includes(context.userRole)) {
    score += 15;
    reasons.push("Role match");
  } else if (ruleRoles.includes("ALL")) {
    score += 10;
    reasons.push("General role");
  }

  // 4. Venture Stage Match (max 10)
  if (rule.venture_stage === "ALL") {
    score += 10;
    reasons.push("All stages");
  } else if (context.ventureStage) {
    const ruleStages = rule.venture_stage.split(",").map(s => s.trim());
    if (ruleStages.includes(context.ventureStage)) {
      score += 10;
      reasons.push("Venture stage match");
    } else {
      const minDist = Math.min(...ruleStages.map(s => stageDistance(s, context.ventureStage!)));
      if (minDist === 1) {
        score += 5;
        reasons.push("Adjacent venture stage");
      }
    }
  }

  // 5. Missing Evidence Match (max 10, 3 per overlap)
  const ruleEvidence = safeJsonArray(rule.evidence_types);
  if (ruleEvidence.length > 0 && context.missingEvidence && context.missingEvidence.length > 0) {
    const overlap = ruleEvidence.filter(e => context.missingEvidence!.includes(e)).length;
    const evidenceScore = Math.min(overlap * 3, 10);
    score += evidenceScore;
    if (overlap > 0) reasons.push(`Missing ${overlap} evidence type(s)`);
  }

  // 6. Risk Category Match (max 8, 2 per overlap)
  const ruleRisks = safeJsonArray(rule.risk_categories);
  if (ruleRisks.length > 0 && context.highRiskCategories && context.highRiskCategories.length > 0) {
    const overlap = ruleRisks.filter(r => context.highRiskCategories!.includes(r)).length;
    const riskScore = Math.min(overlap * 2, 8);
    score += riskScore;
    if (overlap > 0) reasons.push(`${overlap} high risk(s) detected`);
  }

  // 7. Scoring Framework Match (max 5, 2 per match)
  const ruleFrameworks = safeJsonArray(rule.scoring_frameworks);
  if (ruleFrameworks.length > 0 && context.readinessScores) {
    const lowScores = Object.entries(context.readinessScores)
      .filter(([, v]) => v < 5.0)
      .map(([k]) => k);
    const overlap = ruleFrameworks.filter(f => lowScores.includes(f)).length;
    const fwScore = Math.min(overlap * 2, 5);
    score += fwScore;
    if (overlap > 0) reasons.push(`${overlap} low score dimension(s)`);
  }

  // 8. Approval Requirement Match (max 5, binary)
  if (rule.approval_gate && context.approvalStatus === "Pending") {
    score += 5;
    reasons.push("Pending approval gate");
  }

  // 9. Admin Priority Flag (max 5)
  if (rule.priority === "High") {
    score += 5;
    reasons.push("High priority");
  } else if (rule.priority === "Medium") {
    score += 2;
  }

  // 10. Recency (max 2)
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  if (playbook.updatedAt && (Date.now() - playbook.updatedAt) < ninetyDaysMs) {
    score += 2;
    reasons.push("Recently updated");
  }

  return { score, reason: reasons.join("; ") };
}

// ─── Access Level Filtering ───
const ROLE_ACCESS_MAP: Record<string, string[]> = {
  admin:    ["Admin Only", "Internal Team", "Venture Team", "Advisor Access", "Academic Partner Access", "Investor View", "Public / Exportable"],
  owner:    ["Admin Only", "Internal Team", "Venture Team", "Advisor Access", "Academic Partner Access", "Investor View", "Public / Exportable"],
  user:     ["Internal Team", "Venture Team", "Advisor Access", "Academic Partner Access", "Investor View", "Public / Exportable"],
  advisor:  ["Advisor Access", "Academic Partner Access", "Investor View", "Public / Exportable"],
  investor: ["Investor View", "Public / Exportable"],
  academic: ["Academic Partner Access", "Public / Exportable"],
  public:   ["Public / Exportable"],
};

function canAccessPlaybook(userRole: string, accessLevel: string | null): boolean {
  if (!accessLevel) return true;
  const allowed = ROLE_ACCESS_MAP[userRole] || ROLE_ACCESS_MAP["user"];
  return allowed.includes(accessLevel);
}

// ─── Main Orchestrator ───

export async function collectContext(
  ventureId: string | null,
  module: string,
  page: string,
  workflowStage: string,
  userId: string,
  userRole: string
): Promise<VentureContext> {
  const context: VentureContext = {
    ventureId,
    module,
    page: page || "ALL",
    workflowStage: workflowStage || "ALL",
    userId,
    userRole: userRole || "user",
  };

  if (!ventureId) return context;

  const db = await getDb();

  // Get venture details
  try {
    const [ventures] = await db.execute(
      sql`SELECT stage, venture_type, spv_brand FROM ventures WHERE id = ${ventureId} LIMIT 1`
    );
    const v = (ventures as any[])[0];
    if (v) {
      context.ventureStage = v.stage || "Validation";
      context.ventureType = v.venture_type || "ALL";
      context.spvBrand = v.spv_brand || "ALL";
    }
  } catch { /* venture may not exist */ }

  // Get high risk categories
  try {
    const [risks] = await db.execute(
      sql`SELECT DISTINCT category FROM venture_risks WHERE venture_id = ${ventureId} AND risk_score >= 12 AND status = 'Open'`
    );
    context.highRiskCategories = (risks as any[]).map(r => r.category);
  } catch { context.highRiskCategories = []; }

  return context;
}

export async function evaluateRules(context: VentureContext): Promise<ScoredPlaybook[]> {
  const db = await getDb();

  // Get all active rules
  const [rules] = await db.execute(
    sql.raw(`SELECT * FROM playbook_context_rules WHERE active = 1`)
  );

  // Get all published playbooks
  const [playbooks] = await db.execute(
    sql.raw(`SELECT id, title, category, related_module as relatedModule, related_workflow_stage as relatedWorkflowStage, user_role as userRole, purpose, when_to_use as whenToUse, step_by_step_guidance as stepByStepGuidance, required_inputs as requiredInputs, required_outputs as requiredOutputs, linked_templates as linkedTemplates, linked_scoring_frameworks as linkedScoringFrameworks, linked_risk_categories as linkedRiskCategories, evidence_required as evidenceRequired, completion_checklist as completionChecklist, approval_required as approvalRequired, access_level as accessLevel, status, version, updated_at as updatedAt FROM playbook_library WHERE status = 'Published'`)
  );

  const pbMap = new Map((playbooks as PlaybookRecord[]).map(p => [p.id, p]));
  const scored: ScoredPlaybook[] = [];

  for (const rule of rules as ContextRule[]) {
    const playbook = pbMap.get(rule.playbook_id);
    if (!playbook) continue;

    // Filter by access level
    if (!canAccessPlaybook(context.userRole, playbook.accessLevel)) continue;

    // Filter by module (rule must match current module or be ALL)
    if (rule.module !== "ALL" && rule.module !== context.module) continue;

    const { score, reason } = scorePlaybook(rule, playbook, context);
    const widgetTypes = deriveWidgetTypes(rule, playbook);

    scored.push({
      playbook,
      score,
      reason,
      ruleId: rule.id,
      widgetTypes,
    });
  }

  return scored;
}

export function rankByWidgetType(
  scoredPlaybooks: ScoredPlaybook[],
  widgetConfigs: WidgetConfig[]
): ContextualPayload {
  const payload: ContextualPayload = {};

  // Build config map
  const configMap = new Map(widgetConfigs.map(c => [c.widget_type, c]));

  // Collect all unique widget types
  const allWidgetTypes = new Set<string>();
  for (const sp of scoredPlaybooks) {
    for (const wt of sp.widgetTypes) allWidgetTypes.add(wt);
  }

  for (const widgetType of allWidgetTypes) {
    const config = configMap.get(widgetType);
    if (!config || !config.enabled) continue;

    // Get playbooks for this widget type
    let candidates = scoredPlaybooks
      .filter(sp => sp.widgetTypes.includes(widgetType))
      .filter(sp => sp.score >= config.min_recommendation_score);

    // Sort by score descending, then priority, then recency, then alphabetical
    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.playbook.updatedAt !== a.playbook.updatedAt) return b.playbook.updatedAt - a.playbook.updatedAt;
      return a.playbook.title.localeCompare(b.playbook.title);
    });

    // Diversity rule: max 2 from same category
    const categoryCounts: Record<string, number> = {};
    const diverse: ScoredPlaybook[] = [];
    for (const c of candidates) {
      const cat = c.playbook.category || "General";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      if (categoryCounts[cat] <= 2) diverse.push(c);
    }

    // Cap at max_items
    payload[widgetType] = diverse.slice(0, config.max_items);
  }

  return payload;
}

/**
 * Main entry point — returns contextual playbook payload for a given context.
 */
export async function getContextualPlaybooks(
  ventureId: string | null,
  module: string,
  page: string,
  workflowStage: string,
  userId: string,
  userRole: string
): Promise<ContextualPayload> {
  const context = await collectContext(ventureId, module, page, workflowStage, userId, userRole);
  const scored = await evaluateRules(context);

  // Get widget configs for this module
  const db = await getDb();
  const [configs] = await db.execute(
    sql`SELECT * FROM playbook_widget_configs WHERE module = ${module} AND enabled = 1`
  );

  return rankByWidgetType(scored, configs as WidgetConfig[]);
}
