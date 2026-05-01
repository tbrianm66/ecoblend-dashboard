// Contextual Playbook Widget System — Phase 1 Seed Data
// Seeds PlaybookWidgetConfig (enabled widgets per module) and PlaybookContextRules (20 MVP playbooks)

import mysql from "mysql2/promise";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const uuid = () => crypto.randomUUID();
const now = Date.now();
const SYSTEM = "system";

// ─── Widget Types ───
const WT = {
  REC: "RecommendedPlaybooks",
  NEXT: "NextStepGuidance",
  EVID: "EvidenceRequirements",
  MISS: "MissingEvidence",
  RISK: "RiskLinked",
  SCORE: "ScoreImprovement",
  GATE: "StageGateReadiness",
  RD: "RDStage",
  INV: "InvestmentPackReadiness",
  GOV: "GovernanceDecision",
};

// ─── Module IDs ───
const MODULES = [
  "Command Centre",
  "Venture Intake",
  "Discovery & Market",
  "Proposition & Business Model",
  "R&D Hub",
  "Operational & Manufacturing",
  "Brand & GTM",
  "Sustainability & Impact",
  "Risk Intelligence",
  "Readiness Scoring",
  "Investment Readiness",
  "Execution Planning",
  "Coaching",
  "Collaboration",
  "Governance",
  "Admin",
];

// ─── MVP-enabled widgets per module ───
const MODULE_WIDGETS = {
  "Command Centre":               [WT.REC],
  "Venture Intake":               [WT.REC, WT.EVID],
  "Discovery & Market":           [WT.REC, WT.MISS, WT.SCORE],
  "Proposition & Business Model": [WT.REC, WT.EVID, WT.SCORE],
  "R&D Hub":                      [WT.RD, WT.REC, WT.EVID, WT.SCORE],
  "Operational & Manufacturing":  [WT.REC, WT.EVID, WT.SCORE],
  "Brand & GTM":                  [WT.REC, WT.MISS],
  "Sustainability & Impact":      [WT.REC, WT.EVID, WT.SCORE],
  "Risk Intelligence":            [WT.REC, WT.MISS, WT.SCORE],
  "Readiness Scoring":            [WT.SCORE, WT.EVID, WT.MISS, WT.REC],
  "Investment Readiness":         [WT.INV, WT.MISS, WT.REC, WT.SCORE],
  "Execution Planning":           [WT.REC],
  "Coaching":                     [WT.REC, WT.SCORE],
  "Collaboration":                [WT.REC],
  "Governance":                   [WT.REC],
  "Admin":                        [WT.REC],
};

const ALL_WIDGET_TYPES = Object.values(WT);

// Build widget config records
function buildWidgetConfigs() {
  const records = [];
  for (const mod of MODULES) {
    const enabled = MODULE_WIDGETS[mod] || [];
    for (const wt of ALL_WIDGET_TYPES) {
      records.push({
        id: uuid(),
        widget_type: wt,
        module: mod,
        page: "ALL",
        placement: "RightPanel",
        enabled: enabled.includes(wt),
        max_items: 5,
        display_mode: "Standard",
        show_completion_status: true,
        show_evidence_links: true,
        show_score_impact: false,
        show_risk_impact: false,
        role_visibility: null,
        min_recommendation_score: 30,
        created_by: SYSTEM,
        updated_by: SYSTEM,
        created_at: now,
        updated_at: now,
      });
    }
  }
  return records;
}

// ─── Context Rules for 20 MVP Playbooks ───
// We'll look up playbook IDs from the database, then create rules
const PLAYBOOK_RULES = [
  { title: "Getting Started with ECOBLEND OS",        modules: ["Command Centre", "ALL"], priority: "High", ventureStage: "ALL" },
  { title: "New Venture Intake Playbook",              modules: ["Venture Intake"],        priority: "High", ventureStage: "Idea" },
  { title: "Problem Statement Playbook",               modules: ["Venture Intake"],        priority: "Medium", ventureStage: "Idea" },
  { title: "Customer Discovery Interview Playbook",    modules: ["Discovery & Market"],    priority: "High", ventureStage: "Validation" },
  { title: "Market Validation Playbook",               modules: ["Discovery & Market"],    priority: "High", ventureStage: "Validation" },
  { title: "Value Proposition Playbook",               modules: ["Proposition & Business Model"], priority: "High", ventureStage: "Validation" },
  { title: "Business Model Canvas Playbook",           modules: ["Proposition & Business Model"], priority: "High", ventureStage: "Validation" },
  { title: "R&D Project Setup Playbook",               modules: ["R&D Hub"],               priority: "High", ventureStage: "Idea" },
  { title: "Concept to Simulation Playbook",           modules: ["R&D Hub"],               priority: "Medium", ventureStage: "Validation" },
  { title: "Prototype Testing Playbook",               modules: ["R&D Hub"],               priority: "Medium", ventureStage: "MVP" },
  { title: "Risk Assessment Playbook",                 modules: ["Risk Intelligence"],     priority: "High", ventureStage: "ALL" },
  { title: "Mitigation Planning Playbook",             modules: ["Risk Intelligence"],     priority: "Medium", ventureStage: "ALL" },
  { title: "VRL Scoring Playbook",                     modules: ["Readiness Scoring"],     priority: "High", ventureStage: "ALL" },
  { title: "TRL Scoring Playbook",                     modules: ["Readiness Scoring", "R&D Hub"], priority: "High", ventureStage: "ALL" },
  { title: "BRL Scoring Playbook",                     modules: ["Readiness Scoring", "Proposition & Business Model"], priority: "High", ventureStage: "ALL" },
  { title: "Evidence Confidence Playbook",             modules: ["Readiness Scoring"],     priority: "Medium", ventureStage: "ALL" },
  { title: "Pitch Deck Preparation Playbook",          modules: ["Investment Readiness"],  priority: "High", ventureStage: "MVP" },
  { title: "Investor Data Room Playbook",              modules: ["Investment Readiness"],  priority: "High", ventureStage: "MVP" },
  { title: "Execution Roadmap Playbook",               modules: ["Execution Planning"],    priority: "High", ventureStage: "MVP" },
  { title: "Stage-Gate Approval Playbook",             modules: ["Governance"],            priority: "High", ventureStage: "ALL" },
];

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // ─── Seed Widget Configs ───
  const configs = buildWidgetConfigs();
  console.log(`Seeding ${configs.length} widget configs...`);
  
  // Clear existing configs first
  await conn.execute("DELETE FROM playbook_widget_configs");
  
  const configSql = `INSERT INTO playbook_widget_configs 
    (id, widget_type, module, page, placement, enabled, max_items, display_mode, 
     show_completion_status, show_evidence_links, show_score_impact, show_risk_impact,
     role_visibility, min_recommendation_score, created_by, updated_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  for (const c of configs) {
    await conn.execute(configSql, [
      c.id, c.widget_type, c.module, c.page, c.placement, c.enabled, c.max_items,
      c.display_mode, c.show_completion_status, c.show_evidence_links, c.show_score_impact,
      c.show_risk_impact, c.role_visibility, c.min_recommendation_score,
      c.created_by, c.updated_by, c.created_at, c.updated_at,
    ]);
  }
  console.log(`[OK] ${configs.length} widget configs seeded (${MODULES.length} modules x ${ALL_WIDGET_TYPES.length} widget types)`);

  // ─── Seed Context Rules ───
  // Look up playbook IDs
  const [playbooks] = await conn.query("SELECT id, title FROM playbook_library");
  const pbMap = new Map(playbooks.map(p => [p.title, p.id]));

  // Clear existing rules
  await conn.execute("DELETE FROM playbook_context_rules");

  const ruleSql = `INSERT INTO playbook_context_rules
    (id, playbook_id, module, page, workflow_stage, venture_stage, venture_type, spv_brand,
     user_roles, risk_categories, scoring_frameworks, evidence_types, approval_gate, rd_stage,
     investment_pack_status, priority, active, created_by, updated_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  let ruleCount = 0;
  for (const pr of PLAYBOOK_RULES) {
    const pbId = pbMap.get(pr.title);
    if (!pbId) {
      console.warn(`[WARN] Playbook not found: "${pr.title}" — skipping`);
      continue;
    }
    for (const mod of pr.modules) {
      await conn.execute(ruleSql, [
        uuid(), pbId, mod, "ALL", "ALL", pr.ventureStage, "ALL", "ALL",
        null, null, null, null, null, null, null,
        pr.priority, true, SYSTEM, SYSTEM, now, now,
      ]);
      ruleCount++;
    }
  }
  console.log(`[OK] ${ruleCount} context rules seeded for ${PLAYBOOK_RULES.length} playbooks`);

  // Verify
  const [cfgCount] = await conn.query("SELECT COUNT(*) as cnt FROM playbook_widget_configs");
  const [ruleCountResult] = await conn.query("SELECT COUNT(*) as cnt FROM playbook_context_rules");
  console.log(`\n[VERIFY] Widget configs: ${cfgCount[0].cnt}, Context rules: ${ruleCountResult[0].cnt}`);

  await conn.end();
}

run().catch(console.error);
