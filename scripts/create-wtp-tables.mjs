/**
 * Create WTP Assessment tables in TiDB
 * Run: node scripts/create-wtp-tables.mjs
 */
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const parsed = new URL(url.split("?")[0]);
const conn = await mysql.createConnection({
  host: parsed.hostname,
  port: parseInt(parsed.port) || 4000,
  user: parsed.username,
  password: parsed.password,
  database: parsed.pathname.slice(1),
  ssl: { rejectUnauthorized: true },
});

console.log("Connected to TiDB. Creating WTP Assessment tables...");

// ── 1. wtp_tests ─────────────────────────────────────────────────────────────
await conn.execute(`
  CREATE TABLE IF NOT EXISTS wtp_tests (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    venture_id VARCHAR(36) NOT NULL,
    hypothesis_id VARCHAR(36),
    customer_segment_id VARCHAR(36),
    customer_name VARCHAR(255),
    organisation VARCHAR(255),
    contact_role VARCHAR(255),
    buyer_role VARCHAR(255),
    economic_buyer VARCHAR(255),
    budget_owner_confirmed ENUM('confirmed','partially_known','unknown') DEFAULT 'unknown',
    budget_owner_name VARCHAR(255),
    budget_owner_role VARCHAR(255),
    current_spend DECIMAL(12,2),
    current_spend_currency VARCHAR(10) DEFAULT 'GBP',
    current_spend_period ENUM('monthly','quarterly','annually','one_off') DEFAULT 'annually',
    value_driver TEXT,
    pricing_model_tested ENUM(
      'paid_pilot','subscription','licence','consultancy_plus_platform',
      'product_sales','service_fee','success_fee','data_partnership',
      'co_development','venture_studio_equity','transaction_fee'
    ) DEFAULT 'paid_pilot',
    price_tested DECIMAL(12,2),
    price_currency VARCHAR(10) DEFAULT 'GBP',
    price_period ENUM('one_off','monthly','quarterly','annually','per_unit','per_transaction') DEFAULT 'annually',
    test_method ENUM(
      'pricing_interview','proposal_sent','paid_pilot_offer','loi_request',
      'procurement_conversation','budget_holder_meeting','landing_page_pricing_test',
      'concierge_offer','sales_call','tender_response'
    ) DEFAULT 'pricing_interview',
    response_summary TEXT,
    evidence_level TINYINT DEFAULT 1 COMMENT '1=interest 2=meeting 3=data 4=budget_intro 5=proposal 6=loi 7=paid',
    evidence_strength_score TINYINT DEFAULT 0 COMMENT '0-100',
    pricing_response ENUM('accepted','negotiating','needs_roi_proof','price_resistance','rejected') DEFAULT 'needs_roi_proof',
    procurement_pathway_status ENUM('unknown','mapped','blocked','feasible','high_friction','validated') DEFAULT 'unknown',
    procurement_pathway_notes TEXT,
    decision_process_notes TEXT,
    objections TEXT,
    objection_category ENUM(
      'price_too_high','unclear_roi','no_budget','wrong_budget_cycle',
      'procurement_barrier','trust_barrier','insufficient_proof','switching_cost',
      'data_sharing_concern','not_priority','competitor_preferred','timing_issue'
    ),
    recommended_pricing_model VARCHAR(100),
    next_commercial_action TEXT,
    next_action_due_date DATE,
    status ENUM(
      'planned','in_progress','completed','blocked','invalidated',
      'converted_to_pilot','converted_to_loi','converted_to_paid_customer'
    ) DEFAULT 'planned',
    wtp_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_wtp_venture (venture_id),
    INDEX idx_wtp_hypothesis (hypothesis_id),
    INDEX idx_wtp_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`);
console.log("✓ wtp_tests created");

// ── 2. wtp_commitments ────────────────────────────────────────────────────────
await conn.execute(`
  CREATE TABLE IF NOT EXISTS wtp_commitments (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    venture_id VARCHAR(36) NOT NULL,
    wtp_test_id VARCHAR(36),
    commitment_type ENUM(
      'verbal_interest','follow_up_meeting','data_sharing','budget_holder_intro',
      'proposal_request','loi_signed','pilot_agreed','paid_pilot',
      'purchase_order','co_development_agreement','partnership_mou'
    ) DEFAULT 'verbal_interest',
    commitment_description TEXT,
    commitment_value DECIMAL(12,2),
    commitment_currency VARCHAR(10) DEFAULT 'GBP',
    commitment_date DATE,
    evidence_reference TEXT,
    status ENUM('weak','moderate','strong','confirmed','withdrawn') DEFAULT 'weak',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_commit_venture (venture_id),
    INDEX idx_commit_wtp (wtp_test_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`);
console.log("✓ wtp_commitments created");

// ── 3. pricing_experiments ────────────────────────────────────────────────────
await conn.execute(`
  CREATE TABLE IF NOT EXISTS pricing_experiments (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    venture_id VARCHAR(36) NOT NULL,
    hypothesis_id VARCHAR(36),
    pricing_model ENUM(
      'paid_pilot','subscription','licence','consultancy_plus_platform',
      'product_sales','service_fee','success_fee','data_partnership',
      'co_development','venture_studio_equity','transaction_fee'
    ) DEFAULT 'subscription',
    price_point DECIMAL(12,2),
    currency VARCHAR(10) DEFAULT 'GBP',
    billing_period ENUM('one_off','monthly','quarterly','annually','per_unit','per_transaction') DEFAULT 'annually',
    target_customer_segment VARCHAR(255),
    value_metric TEXT COMMENT 'What the price is tied to (e.g. per bus, per seat)',
    buying_trigger TEXT,
    current_spend_replaced TEXT,
    cost_reduced TEXT,
    risk_removed TEXT,
    outcome_improved TEXT,
    test_method ENUM(
      'pricing_interview','proposal_sent','paid_pilot_offer','loi_request',
      'procurement_conversation','budget_holder_meeting','landing_page_pricing_test',
      'concierge_offer','sales_call','tender_response'
    ) DEFAULT 'pricing_interview',
    test_sample_size INT DEFAULT 0,
    positive_responses INT DEFAULT 0,
    negative_responses INT DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    learning_summary TEXT,
    recommended_price_range VARCHAR(255),
    recommended_next_test TEXT,
    status ENUM('proposed','running','completed','inconclusive','invalidated') DEFAULT 'proposed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_pricing_venture (venture_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`);
console.log("✓ pricing_experiments created");

// ── 4. budget_validations ─────────────────────────────────────────────────────
await conn.execute(`
  CREATE TABLE IF NOT EXISTS budget_validations (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    venture_id VARCHAR(36) NOT NULL,
    wtp_test_id VARCHAR(36),
    organisation VARCHAR(255),
    budget_owner_known BOOLEAN DEFAULT FALSE,
    budget_owner_role VARCHAR(255),
    budget_category ENUM(
      'innovation','operations','engineering','sustainability','procurement',
      'digital_transformation','compliance','training','capex','opex','research_and_development'
    ) DEFAULT 'innovation',
    budget_cycle ENUM('monthly','quarterly','annually','biennial','unknown') DEFAULT 'annually',
    current_budget_available DECIMAL(12,2),
    estimated_budget_range VARCHAR(255),
    approval_required BOOLEAN DEFAULT TRUE,
    approval_stakeholders TEXT,
    financial_decision_criteria TEXT,
    notes TEXT,
    validation_status ENUM('unknown','partially_validated','validated','blocked','invalidated') DEFAULT 'unknown',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_budget_venture (venture_id),
    INDEX idx_budget_wtp (wtp_test_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`);
console.log("✓ budget_validations created");

// ── 5. procurement_pathways ───────────────────────────────────────────────────
await conn.execute(`
  CREATE TABLE IF NOT EXISTS procurement_pathways (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    venture_id VARCHAR(36) NOT NULL,
    wtp_test_id VARCHAR(36),
    organisation VARCHAR(255),
    procurement_route ENUM(
      'direct_purchase','innovation_pilot','framework_agreement','tender',
      'supplier_onboarding','partner_channel','university_or_research_route',
      'internal_sponsor','unknown'
    ) DEFAULT 'unknown',
    procurement_complexity_score TINYINT DEFAULT 3 COMMENT '1=simple 5=complex',
    expected_sales_cycle_days INT DEFAULT 90,
    required_documents TEXT,
    compliance_requirements TEXT,
    legal_review_required BOOLEAN DEFAULT FALSE,
    data_security_review_required BOOLEAN DEFAULT FALSE,
    pilot_possible_without_full_procurement BOOLEAN DEFAULT TRUE,
    procurement_risks TEXT,
    next_procurement_step TEXT,
    status ENUM('unknown','mapped','blocked','feasible','high_friction','validated') DEFAULT 'unknown',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_proc_venture (venture_id),
    INDEX idx_proc_wtp (wtp_test_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`);
console.log("✓ procurement_pathways created");

await conn.end();
console.log("\n✅ All 5 WTP Assessment tables created successfully.");
