// Architecture v2 Migration — Creates all new tables for the 16-module workflow
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const SQL_STATEMENTS = [
  // Module 2: Venture Intake
  `CREATE TABLE IF NOT EXISTS problem_statements (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    statement TEXT NOT NULL,
    customer_segment VARCHAR(255),
    context TEXT,
    evidence_criteria TEXT,
    sample_size INT,
    status ENUM('draft','validated','invalidated') DEFAULT 'draft',
    confidence_score DECIMAL(3,1),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS hypothesis_register (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    problem_statement_id VARCHAR(36),
    hypothesis TEXT NOT NULL,
    type ENUM('desirability','feasibility','viability') DEFAULT 'desirability',
    status ENUM('untested','testing','validated','invalidated') DEFAULT 'untested',
    evidence_count INT DEFAULT 0,
    confidence_score DECIMAL(3,1),
    test_method TEXT,
    success_criteria TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Module 3: Discovery & Market Validation
  `CREATE TABLE IF NOT EXISTS market_evidence (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    type ENUM('interview','survey','observation','secondary','experiment') NOT NULL,
    source VARCHAR(255),
    summary TEXT,
    confidence_rating INT DEFAULT 3,
    hypothesis_id VARCHAR(36),
    tags TEXT,
    evidence_file_url TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS demand_signals (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    signal_type ENUM('search_volume','waitlist','loi','pre_order','partnership_interest','other') NOT NULL,
    description TEXT,
    strength ENUM('weak','moderate','strong','very_strong') DEFAULT 'moderate',
    source VARCHAR(255),
    quantitative_value DECIMAL(12,2),
    date_observed DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS wtp_assessments (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    segment VARCHAR(255),
    method ENUM('van_westendorp','conjoint','direct_ask','auction','other') DEFAULT 'direct_ask',
    price_floor DECIMAL(10,2),
    price_ceiling DECIMAL(10,2),
    optimal_price DECIMAL(10,2),
    sample_size INT,
    confidence_rating INT DEFAULT 3,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Module 4: Proposition & Business Model
  `CREATE TABLE IF NOT EXISTS value_propositions (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    customer_segment VARCHAR(255),
    jobs_to_be_done TEXT,
    pains TEXT,
    gains TEXT,
    pain_relievers TEXT,
    gain_creators TEXT,
    unique_value_statement TEXT,
    version INT DEFAULT 1,
    status ENUM('draft','testing','validated') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS business_models (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    canvas_data JSON,
    revenue_model ENUM('subscription','transactional','licensing','freemium','marketplace','advertising','other'),
    pricing_strategy TEXT,
    version INT DEFAULT 1,
    status ENUM('draft','testing','validated') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS unit_economics (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    cac DECIMAL(10,2),
    ltv DECIMAL(10,2),
    ltv_cac_ratio DECIMAL(5,2),
    gross_margin_pct DECIMAL(5,2),
    payback_months INT,
    arpu DECIMAL(10,2),
    churn_rate_pct DECIMAL(5,2),
    assumptions TEXT,
    confidence_rating INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Module 5: R&D Hub
  `CREATE TABLE IF NOT EXISTS rd_projects (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    classification ENUM('iterative','adjacent','moonshot') DEFAULT 'iterative',
    stage ENUM('concept','simulation','prototyping','integration') DEFAULT 'concept',
    stage_status ENUM('in_progress','gate_pending','gate_passed','blocked') DEFAULT 'in_progress',
    domain VARCHAR(255),
    technical_lead VARCHAR(255),
    ip_status ENUM('trade_secret','defensive_publication','patent_pending','clean_room') DEFAULT 'trade_secret',
    budget_allocated DECIMAL(12,2),
    budget_spent DECIMAL(12,2) DEFAULT 0,
    start_date DATE,
    target_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS technical_kpis (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    kpi_name VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    target_value DECIMAL(12,4),
    actual_value DECIMAL(12,4),
    measurement_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS rd_prototypes (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    version INT DEFAULT 1,
    specs TEXT,
    test_protocol TEXT,
    test_results TEXT,
    status ENUM('planned','in_build','testing','complete','failed') DEFAULT 'planned',
    evidence_file_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Module 6: Operations & Manufacturing
  `CREATE TABLE IF NOT EXISTS operating_models (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    model_type ENUM('in_house','outsourced','hybrid','platform') DEFAULT 'hybrid',
    description TEXT,
    key_processes TEXT,
    key_resources TEXT,
    cost_structure TEXT,
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS supplier_assessments (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    location VARCHAR(255),
    quality_score INT,
    reliability_score INT,
    cost_score INT,
    sustainability_score INT,
    overall_score DECIMAL(3,1),
    status ENUM('prospective','approved','active','on_hold','terminated') DEFAULT 'prospective',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS manufacturing_plans (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    process_type VARCHAR(255),
    target_volume INT,
    cycle_time_hours DECIMAL(8,2),
    unit_cost DECIMAL(10,2),
    tooling_cost DECIMAL(12,2),
    lead_time_weeks INT,
    quality_standard VARCHAR(255),
    status ENUM('concept','planning','pilot','production') DEFAULT 'concept',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Module 7: Brand & GTM
  `CREATE TABLE IF NOT EXISTS brand_positioning (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    brand_name VARCHAR(255),
    positioning_statement TEXT,
    target_audience TEXT,
    brand_values TEXT,
    tone_of_voice TEXT,
    visual_identity_url TEXT,
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS messaging_tests (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    message_variant VARCHAR(255),
    channel ENUM('email','social','landing_page','ad','direct','other') DEFAULT 'other',
    audience_segment VARCHAR(255),
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    conversions INT DEFAULT 0,
    ctr_pct DECIMAL(5,2),
    winner BOOLEAN DEFAULT FALSE,
    test_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS campaign_experiments (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    campaign_name VARCHAR(255) NOT NULL,
    channel VARCHAR(255),
    hypothesis TEXT,
    budget DECIMAL(10,2),
    spend DECIMAL(10,2) DEFAULT 0,
    target_metric VARCHAR(255),
    target_value DECIMAL(12,2),
    actual_value DECIMAL(12,2),
    status ENUM('planned','live','paused','complete') DEFAULT 'planned',
    start_date DATE,
    end_date DATE,
    learnings TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Module 8: Sustainability & Impact
  `CREATE TABLE IF NOT EXISTS sustainability_evidence (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    category ENUM('lca','carbon','water','waste','circularity','biodiversity','social','governance') NOT NULL,
    description TEXT,
    quantitative_value DECIMAL(12,4),
    unit VARCHAR(50),
    methodology VARCHAR(255),
    source VARCHAR(255),
    confidence_rating INT DEFAULT 3,
    evidence_file_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS impact_metrics (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    category ENUM('environmental','social','economic','governance') NOT NULL,
    baseline_value DECIMAL(12,4),
    current_value DECIMAL(12,4),
    target_value DECIMAL(12,4),
    unit VARCHAR(50),
    measurement_period VARCHAR(50),
    sdg_alignment VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS lca_inputs (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    lifecycle_stage ENUM('raw_materials','manufacturing','distribution','use','end_of_life') NOT NULL,
    material VARCHAR(255),
    quantity DECIMAL(12,4),
    unit VARCHAR(50),
    carbon_factor DECIMAL(10,6),
    carbon_kg DECIMAL(12,4),
    data_quality ENUM('primary','secondary','estimated') DEFAULT 'estimated',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS circularity_assessments (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    material_input_pct_recycled DECIMAL(5,2),
    material_input_pct_renewable DECIMAL(5,2),
    product_lifetime_years DECIMAL(5,1),
    recyclability_pct DECIMAL(5,2),
    reuse_potential ENUM('none','low','medium','high') DEFAULT 'none',
    circularity_score DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Module 9: Risk Intelligence
  `CREATE TABLE IF NOT EXISTS risk_register (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    risk_type ENUM('market','technical','business_model','financial','operational','people','ip_legal','supply_chain','sustainability','reputational') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity INT NOT NULL DEFAULT 3,
    probability INT NOT NULL DEFAULT 3,
    detectability INT NOT NULL DEFAULT 3,
    rpn INT GENERATED ALWAYS AS (severity * probability * detectability) STORED,
    risk_band ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
    status ENUM('open','mitigating','mitigated','accepted','closed') DEFAULT 'open',
    owner VARCHAR(255),
    source_module VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS risk_mitigations (
    id VARCHAR(36) PRIMARY KEY,
    risk_id VARCHAR(36) NOT NULL,
    action_description TEXT NOT NULL,
    responsible VARCHAR(255),
    due_date DATE,
    status ENUM('planned','in_progress','complete','overdue') DEFAULT 'planned',
    effectiveness_rating INT,
    revised_probability INT,
    revised_detectability INT,
    residual_rpn INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Module 10: Readiness Scoring
  `CREATE TABLE IF NOT EXISTS readiness_scores (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    dimension ENUM('vrl','trl','brl','mrl','srl','irl','prl') NOT NULL,
    score DECIMAL(3,1) NOT NULL,
    evidence_count INT DEFAULT 0,
    confidence_score DECIMAL(3,1),
    scoring_date DATE NOT NULL,
    scored_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS evidence_confidence (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    dimension ENUM('vrl','trl','brl','mrl','srl','irl','prl') NOT NULL,
    evidence_id VARCHAR(36),
    evidence_type VARCHAR(255),
    weight DECIMAL(3,2) DEFAULT 1.00,
    confidence_rating INT NOT NULL DEFAULT 3,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Module 11: Investment Readiness
  `CREATE TABLE IF NOT EXISTS investment_packs (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    investment_thesis TEXT,
    use_of_funds TEXT,
    valuation_logic TEXT,
    target_raise DECIMAL(12,2),
    seis_eligible BOOLEAN DEFAULT FALSE,
    eis_eligible BOOLEAN DEFAULT FALSE,
    pack_status ENUM('incomplete','ready','exported','shared') DEFAULT 'incomplete',
    gate_passed BOOLEAN DEFAULT FALSE,
    gate_checked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Module 12: Execution Planning
  `CREATE TABLE IF NOT EXISTS execution_roadmaps (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    phase_name VARCHAR(255) NOT NULL,
    phase_order INT NOT NULL,
    start_date DATE,
    end_date DATE,
    status ENUM('not_started','in_progress','complete','blocked') DEFAULT 'not_started',
    key_deliverables TEXT,
    dependencies TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS budget_plans (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    category VARCHAR(255) NOT NULL,
    planned_amount DECIMAL(12,2) NOT NULL,
    actual_amount DECIMAL(12,2) DEFAULT 0,
    variance DECIMAL(12,2) GENERATED ALWAYS AS (actual_amount - planned_amount) STORED,
    period VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Module 15: Governance
  `CREATE TABLE IF NOT EXISTS governance_decisions (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    stage INT NOT NULL,
    decision_type ENUM('approve','conditional_approve','reject','escalate') NOT NULL,
    rationale TEXT,
    conditions TEXT,
    decided_by VARCHAR(255) NOT NULL,
    decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS stage_gate_approvals (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL,
    stage INT NOT NULL,
    gate_name VARCHAR(255),
    exit_criteria JSON,
    criteria_met BOOLEAN DEFAULT FALSE,
    approver VARCHAR(255),
    status ENUM('pending','approved','rejected','escalated') DEFAULT 'pending',
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS audit_log (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    action ENUM('create','update','delete','approve','reject','export','login','logout') NOT NULL,
    entity_type VARCHAR(255) NOT NULL,
    entity_id VARCHAR(36),
    before_value JSON,
    after_value JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Venture stage extension (add columns if not exist)
  `ALTER TABLE ventures ADD COLUMN IF NOT EXISTS current_stage INT DEFAULT 1`,
  `ALTER TABLE ventures ADD COLUMN IF NOT EXISTS stage_status ENUM('not_started','in_progress','gate_pending','gate_passed','blocked') DEFAULT 'not_started'`,
  `ALTER TABLE ventures ADD COLUMN IF NOT EXISTS composite_score DECIMAL(3,1)`,
  `ALTER TABLE ventures ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,1)`,
  `ALTER TABLE ventures ADD COLUMN IF NOT EXISTS recommendation ENUM('proceed','pause','pivot','terminate')`,
  `ALTER TABLE ventures ADD COLUMN IF NOT EXISTS risk_band ENUM('low','medium','high','critical')`,
  `ALTER TABLE ventures ADD COLUMN IF NOT EXISTS progress_pct DECIMAL(5,2) DEFAULT 0`,
];

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  let success = 0;
  let failed = 0;

  for (const sql of SQL_STATEMENTS) {
    try {
      await conn.query(sql);
      success++;
      const tableName = sql.match(/(?:CREATE TABLE IF NOT EXISTS|ALTER TABLE)\s+(\w+)/i);
      if (tableName) process.stdout.write(`  ✓ ${tableName[1]}\n`);
    } catch (err) {
      failed++;
      const tableName = sql.match(/(?:CREATE TABLE IF NOT EXISTS|ALTER TABLE)\s+(\w+)/i);
      process.stdout.write(`  ✗ ${tableName ? tableName[1] : 'unknown'}: ${err.message}\n`);
    }
  }

  console.log(`\nDone: ${success} succeeded, ${failed} failed`);
  await conn.end();
}

main().catch(console.error);
