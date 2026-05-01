// Contextual Playbook Widget System — Phase 1 Data Foundation
// Creates 5 new tables: playbook_context_rules, playbook_widget_configs,
// playbook_usage_events, playbook_completions, contextual_guidance_events

import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DDL = [
  // 1. playbook_context_rules
  `CREATE TABLE IF NOT EXISTS playbook_context_rules (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    playbook_id VARCHAR(36) NOT NULL,
    module VARCHAR(128) NOT NULL DEFAULT 'ALL',
    page VARCHAR(128) DEFAULT 'ALL',
    workflow_stage VARCHAR(128) DEFAULT 'ALL',
    venture_stage VARCHAR(64) DEFAULT 'ALL',
    venture_type VARCHAR(64) DEFAULT 'ALL',
    spv_brand VARCHAR(64) DEFAULT 'ALL',
    user_roles TEXT,
    risk_categories TEXT,
    scoring_frameworks TEXT,
    evidence_types TEXT,
    approval_gate VARCHAR(128),
    rd_stage VARCHAR(64),
    investment_pack_status VARCHAR(64),
    priority VARCHAR(16) NOT NULL DEFAULT 'Medium',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    INDEX idx_pcr_module_active (module, active, playbook_id),
    INDEX idx_pcr_playbook (playbook_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 2. playbook_widget_configs
  `CREATE TABLE IF NOT EXISTS playbook_widget_configs (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    widget_type VARCHAR(64) NOT NULL,
    module VARCHAR(128) NOT NULL,
    page VARCHAR(128) DEFAULT 'ALL',
    placement VARCHAR(32) NOT NULL DEFAULT 'RightPanel',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    max_items INT NOT NULL DEFAULT 5,
    display_mode VARCHAR(32) NOT NULL DEFAULT 'Standard',
    show_completion_status BOOLEAN NOT NULL DEFAULT TRUE,
    show_evidence_links BOOLEAN NOT NULL DEFAULT TRUE,
    show_score_impact BOOLEAN NOT NULL DEFAULT FALSE,
    show_risk_impact BOOLEAN NOT NULL DEFAULT FALSE,
    role_visibility TEXT,
    min_recommendation_score INT NOT NULL DEFAULT 30,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    UNIQUE KEY uq_pwc_widget_module_page (widget_type, module, page)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 3. playbook_usage_events (append-only audit log)
  `CREATE TABLE IF NOT EXISTS playbook_usage_events (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    playbook_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    venture_id VARCHAR(36),
    module VARCHAR(128) NOT NULL,
    page VARCHAR(128),
    widget_type VARCHAR(64) NOT NULL,
    action_type VARCHAR(32) NOT NULL,
    context_snapshot TEXT,
    outcome VARCHAR(128),
    created_at BIGINT NOT NULL,
    INDEX idx_pue_playbook_module (playbook_id, module, created_at),
    INDEX idx_pue_venture (venture_id, module)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 4. playbook_completions
  `CREATE TABLE IF NOT EXISTS playbook_completions (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    playbook_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    venture_id VARCHAR(36) NOT NULL,
    module VARCHAR(128) NOT NULL,
    workflow_stage VARCHAR(128),
    completion_status VARCHAR(32) NOT NULL DEFAULT 'Not_Started',
    completed_steps TEXT,
    evidence_links TEXT,
    completed_at BIGINT,
    reviewed_by VARCHAR(36),
    review_status VARCHAR(32) DEFAULT 'Pending',
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    INDEX idx_pc_playbook_venture (playbook_id, venture_id, workflow_stage),
    INDEX idx_pc_status (completion_status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 5. contextual_guidance_events
  `CREATE TABLE IF NOT EXISTS contextual_guidance_events (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    module VARCHAR(128) NOT NULL,
    page VARCHAR(128),
    guidance_type VARCHAR(64) NOT NULL,
    trigger_reason TEXT NOT NULL,
    recommended_action TEXT,
    related_playbook_id VARCHAR(36),
    status VARCHAR(32) NOT NULL DEFAULT 'Active',
    created_at BIGINT NOT NULL,
    resolved_at BIGINT,
    INDEX idx_cge_venture_status (venture_id, status, guidance_type)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  for (const sql of DDL) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
    try {
      await conn.execute(sql);
      console.log(`[OK] Created table: ${tableName}`);
    } catch (err) {
      console.error(`[ERR] ${tableName}: ${err.message}`);
    }
  }
  // Verify
  const [rows] = await conn.query(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('playbook_context_rules','playbook_widget_configs','playbook_usage_events','playbook_completions','contextual_guidance_events')"
  );
  console.log(`\n[VERIFY] ${rows.length}/5 tables exist:`, rows.map(r => r.TABLE_NAME).join(", "));
  await conn.end();
}

run().catch(console.error);
