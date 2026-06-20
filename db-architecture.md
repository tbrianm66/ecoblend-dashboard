# EcoBlend IO — Database Architecture Summary

**Prepared:** 20 June 2026  
**Database engine:** PostgreSQL (Replit managed)  
**ORM:** Drizzle ORM v0.36 with `drizzle-orm/node-postgres` (Pool)  
**Primary schema file:** `drizzle/schema.ts` (8 280+ lines)  
**Total tables:** 378 (all `pgTable`, all PostgreSQL)  
**Scope:** Read-only audit. No code changes made.

---

## Contents

1. [Database Connection & Environment](#1-database-connection--environment)
2. [Migration History & Order](#2-migration-history--order)
3. [Tables by Module](#3-tables-by-module)
4. [Shadow Schema Files (mysqlTable)](#4-shadow-schema-files-mysqltable)
5. [Tables Added Outside Migration Journal](#5-tables-added-outside-migration-journal)
6. [Schema Risks & Missing Constraints](#6-schema-risks--missing-constraints)
7. [Phase 2 Recommendations](#7-phase-2-recommendations)

---

## 1. Database Connection & Environment

### Connection setup

`server/db.ts` imports `drizzle` from `drizzle-orm/node-postgres` and creates a single `Pool` using the `DATABASE_URL` environment variable:

```
Pool → drizzle(pool, { schema }) → exported as getDb()
```

There is **no `migrate()` call on startup**. The server boots directly against whatever schema is already in the database. Migration is handled externally by `scripts/post-merge.sh`, which runs:

```bash
pnpm exec drizzle-kit push --force
```

### Dev vs production databases

| Concern | Reality |
|---|---|
| Separate dev / prod databases | **No.** Both environments share the same Replit PostgreSQL instance via `DATABASE_URL`. |
| Production isolation | None at the schema level. A destructive migration applied during development takes effect in production immediately. |
| Seed guard | `seedProductionIfEmpty()` is called at startup; it checks for an existing record before inserting defaults, so re-seeding on a populated database is safe. |

**Risk:** Because there is only one database, an accidental `drizzle-kit push --force` during active development can corrupt live production data with no rollback path.

### drizzle.config.ts

```
dialect:  postgresql
schema:   ./drizzle/schema.ts
out:      ./drizzle
```

Drizzle reads only `drizzle/schema.ts` for generation and push. The component schema files (`schema_cc.ts`, `schema_wtp.ts`, etc.) are **not** referenced here.

---

## 2. Migration History & Order

Six canonical entries exist in `drizzle/meta/_journal.json`. Two additional SQL files sit in the `drizzle/` directory but are **not** in the journal and are never applied.

### Canonical migrations (applied in order)

| # | Tag | Date applied | Tables created | Columns / constraints added |
|---|---|---|---|---|
| 0 | `0000_puzzling_scorpion` | 31 May 2025 | **315** — the entire initial schema | None (no FK constraints in this migration) |
| 1 | `0001_chunky_miracleman` | 6 Jun 2025 | 8: `customer_interviews`, `customer_segments`, `demand_signals`, `dm_competitors`, `lean_experiments`, `market_risks`, `problem_hypotheses`, `wtp_tests` | — |
| 2 | `0002_yummy_prima` | 6 Jun 2025 | 7: `cc_alerts`, `cc_decisions`, `cc_evidence`, `cc_experiments`, `cc_hypotheses`, `cc_pivot_logs`, `cc_stage_gate_reviews` | — |
| 3 | `0003_rapid_molten_man` | 6 Jun 2025 | 1: `venture_members` | FK: `ventureId → ventures.id`, `userId → users.id`; UNIQUE `(ventureId, userId)` |
| 4 | `0004_majestic_big_bertha` | 6 Jun 2025 | 4: `budget_validations`, `pricing_experiments`, `procurement_pathways`, `wtp_commitments` | Columns added to `wtp_tests` |
| 5 | `0005_amazing_callisto` | 6 Jun 2025 | None | Columns added to `venture_scores` (`humanReviewedBy`, `humanReviewedAt`, `aiGenerated`); `ventures` (`workflowStage`, `pivotRequired`, `pivotReason`); `cc_stage_gate_reviews` (`gateType`, `humanReviewRequired`, `humanReviewedBy`, `humanReviewedAt`) |

**Total tables reached after migration 5:** 335 (315 + 8 + 7 + 1 + 4).

### Orphaned SQL files (not in journal, never applied)

| File | Contents |
|---|---|
| `0001_early_thunderbird.sql` | 2 836 bytes — appears to be a superseded draft of migration 1 |
| `0002_same_weapon_omega.sql` | 78 bytes — near-empty, likely a failed generation attempt |

These files are harmless as long as `drizzle-kit push` is used instead of `drizzle-kit migrate`. They will never be replayed.

---

## 3. Tables by Module

All 378 tables are defined in `drizzle/schema.ts` using `pgTable`. Modules are identified by prefix convention and confirmed against the router files.

---

### 3.1 Core identity & access (6 tables)

| Table (SQL name) | Stores | Features that depend on it |
|---|---|---|
| `users` | Platform accounts: `openId` (OAuth subject), `name`, `email`, `role` (`user`/`admin`), timestamps | Every authenticated action; JWT session; `venture_members` FK target |
| `ventures` | The central venture record: `id` (slug, PK), `name`, `tagline`, `vrl` (1–9), `trl` (1–9), `workflowStage`, `pivotRequired`, `pivotReason`, `canvasVersion`, timestamps | Root of every per-venture table; FK target for ~200 `ventureId` columns |
| `venture_members` | Venture–user membership: `ventureId`, `userId`, `role` (`editor`/`viewer`/`admin`), UNIQUE `(ventureId, userId)` | `assertVentureAccess` access-control guard; tRPC `ventureProcedure` |
| `venture_scores` | Scored snapshots per venture: dimension scores, AI/human flags, `humanReviewedBy`, `aiGenerated` | VRL dashboard, portfolio scoring, coaching VRL link |
| `venture_permissions` | Per-venture permission overrides: `ventureId`, `userId`, `permission`, `granted` | Fine-grained access control (currently supplementary to `venture_members`) |
| `users_roles` | Role assignment log: `userId`, `role`, timestamps | Admin role management |

---

### 3.2 VRL scoring engine (9 tables)

The Venture Readiness Level (VRL) is a 0–9 composite of PRL (Product Readiness) × BRL (Business Readiness), risk-adjusted.

| Table | Stores | Features |
|---|---|---|
| `vrl_scoring_params` | Per-venture VRL weight configuration: α (product), β (business), confidence | VRL score computation; `computeVrlScore()` |
| `vrl_assessments` | Historical VRL assessment snapshots with full scoring breakdown | VRL history charts, stage-gate triggers |
| `vrl_dynamic_weights` | Dynamically adjusted α/β weights based on venture stage | Weight adaptation engine |
| `vrl_stage_gates` | Stage-gate definitions: threshold, required evidence count, gate name | Stage-gate review workflow |
| `vrl_spinout_checklist` | Spinout readiness checklist items per venture | Spinout/spinoff feature |
| `vrl_actions_log` | Actions triggered by VRL level changes | VRL event history |
| `sync_assessments` | VRL×SRL×MRL synchronisation assessments | Multi-readiness cross-check |
| `sync_history` | Historical sync assessment records | Trend tracking |
| `sync_scenarios` | Modelled scenarios for sync trajectory planning | Scenario planning |

---

### 3.3 BRL — Business Readiness Level (2 tables)

| Table | Stores | Features |
|---|---|---|
| `brl_tasks` | Library of BRL tasks: `taskNumber`, `category`, `vrlStage`, `weight`, description | BRL checklist; `getBrlScoreForVenture()` |
| `brl_task_completions` | Per-venture task completion: `ventureId`, `taskId`, `completed`, `completedAt`, evidence URL | BRL score input to VRL formula |

---

### 3.4 MRL — Manufacturing Readiness Level (8 tables)

MRL feeds the VRL formula as the manufacturing track of PRL (alongside TRL).

| Table | Stores | Features |
|---|---|---|
| `mrl_assessments` | MRL assessments: `ventureId`, `mrlLevel` (1–9), `assessedAt` | VRL PRL computation; `computeVrlScore()` |
| `mrl_process_routes` | Manufacturing process route definitions and maturity | MRL assessment detail |
| `mrl_suppliers` | Supplier capability records linked to MRL | MRL supplier track |
| `mrl_cost_models` | Unit cost models at each MRL stage | MRL cost tracking |
| `mrl_compliance_records` | Manufacturing compliance evidence | MRL compliance track |
| `mrl_lcsa_records` | Life-cycle sustainability records tied to MRL stage | MRL × SRL integration |
| `mrl_risk_register` | Manufacturing-specific risk register | MRL risk track |
| `mrl_level_defs` | Canonical MRL level definitions (reference data) | MRL UI labels |

---

### 3.5 SRL — Sustainability Readiness Level (14 tables)

SRL scores ventures across five dimensions: ENV, LCA, SMF, SOC, ESG.

| Table | Stores | Features |
|---|---|---|
| `srl_portfolios` | Portfolio-level SRL configuration | SRL portfolio view |
| `srl_venture_profiles` | Per-venture SRL profile: sector, current stage, `srlCurrentLevel`, watch flags | SRL dashboard |
| `srl_dimension_definitions` | Canonical dimension definitions (ENV/LCA/SMF/SOC/ESG) | SRL configuration |
| `srl_kpi_definitions` | KPI definitions per dimension: normalisation method, thresholds, mandatory flag | SRL KPI scoring |
| `srl_data_sources` | Data source registry for SRL KPI values | SRL data lineage |
| `srl_weight_configs` | Weight configuration snapshots per gate | SRL weight management |
| `srl_gate_configs` | Gate pass/fail configuration per SRL level | Stage-gate integration |
| `srl_gate_dimension_floors` | Minimum dimension score floors per gate | Gate floor enforcement |
| `srl_assessments` | Locked assessment records: composite score, SRL level, `isLocked`, `scoreDeltas` | SRL scoring history |
| `srl_dimension_scores` | Dimension-level scores per assessment | SRL breakdown |
| `srl_kpi_values` | Individual KPI values per dimension score | SRL KPI drill-down |
| `srl_gate_holding_status` | Gate hold status per venture per gate | Gate hold workflow |
| `srl_reporting_outputs` | Generated SRL reports | SRL investor reporting |
| `srl_audit_log` | Audit trail for SRL events | SRL compliance |

---

### 3.6 CRL — Commercial Readiness Level (4 tables)

| Table | Stores | Features |
|---|---|---|
| `crl_assessments` | CRL assessments: commercial readiness score, evidence count | CRL module |
| `crl_founder_responses` | Founder self-assessment responses for CRL questions | CRL data input |
| `crl_interventions` | Recommended interventions per CRL dimension | CRL coaching |
| `crl_monitoring_records` | Ongoing CRL monitoring snapshots | CRL trend tracking |

---

### 3.7 Command Centre — cc_* (7 tables)

Command Centre is the lean startup evidence-and-decision hub. All tables are `pgTable` (in `schema_cc.ts` and duplicated in `schema.ts`).

| Table | Stores | Features |
|---|---|---|
| `cc_hypotheses` | Hypothesis register: `ventureId`, assumption text, status, confidence level | Hypothesis tracker; drives VRL 0–9 score |
| `cc_experiments` | Experiments linked to hypotheses: method, success criteria, results | Experiment pipeline |
| `cc_evidence` | Evidence items linked to hypotheses and experiments | Evidence library |
| `cc_decisions` | Persevere / pivot / stop decisions with evidence scores | Decision log |
| `cc_pivot_logs` | Pivot event log with before/after state | Pivot history |
| `cc_stage_gate_reviews` | Stage-gate review records: `gateType`, `humanReviewRequired`, reviewer metadata | Stage-gate workflow |
| `cc_alerts` | Auto-generated and manual alerts: severity, linked module, deduplication key | Alert system |

---

### 3.8 Market discovery & demand (7 tables)

| Table | Stores | Features |
|---|---|---|
| `customer_segments` | Buyer/user/influencer/decision-maker role definitions per venture | Discovery Market; customer interview planning |
| `customer_interviews` | Interview records: contact details, pain scores, budget signal, willingness-to-pay signal, evidence notes | Discovery Market; WTP scoring |
| `problem_hypotheses` | Problem statement hypotheses: severity, frequency, evidence threshold | Discovery Market; hypothesis seeding |
| `demand_signals` | External demand evidence: source, signal type, relevance/strength/recency scores | Demand Signal module |
| `dm_competitors` | Competitor records for discovery market analysis | Discovery Market competitor view |
| `market_risks` | Market-specific risks: category, likelihood, impact | Market risk register |
| `lean_experiments` | Lean validation experiments with hypothesis links | Lean experimentation module |

---

### 3.9 WTP — Willingness to Pay (4 tables)

| Table | Stores | Features |
|---|---|---|
| `wtp_tests` | WTP test records: pricing anchors, response counts, conversion rates | WTP test module |
| `wtp_commitments` | Firm and soft commitments from potential buyers: `commitmentType`, organisation | WTP commitment tracker |
| `pricing_experiments` | Pricing experiment records: model, conversion rate, revenue projections | Pricing experiment module |
| `budget_validations` | B2B budget validation records: organisation, budget range, validation status | B2B budget evidence |
| `procurement_pathways` | Procurement route mapping: route type, timeline, status | B2B procurement readiness |

---

### 3.10 Lean Canvas (3 tables — push-only, no migration file)

| Table | Stores | Features |
|---|---|---|
| `lean_canvases` | Versioned canvas snapshots: `ventureId`, `version` (auto-increment), JSON content, `isActive` | `/lean/canvas` page |
| `lean_canvas_blocks` | Individual block content per canvas version: block type (problem/solution/etc.), text, status | Lean Canvas block editor |
| `lean_canvas_block_evidence_links` | Links between canvas blocks and evidence records | Evidence-to-block traceability |

---

### 3.11 Product & prototypes (11 tables)

| Table | Stores | Features |
|---|---|---|
| `product_milestones` | Product milestone tracker: `ventureId`, title, description, status, target date, completion date | `/rnd/prototypes` page |
| `product_readiness_levels` | PRL assessments: TRL component, MRL component, composite | PRL scoring |
| `product_categories` | Product category reference data | Product classification |
| `product_opportunities` | Product opportunity records: opportunity type, market size estimate | Product opportunity module |
| `product_baselines` | Baseline product performance metrics | Product assessment |
| `cost_assessments` | Cost-based assessments per product | Cost model |
| `performance_assessments` | Performance-based assessments | Performance track |
| `quality_assessments` | Quality-based assessments | Quality track |
| `sustainability_assessments` | Sustainability-based assessments | Sustainability track |
| `product_opportunity_scores` | Aggregate opportunity scores across dimensions | Scoring |
| `opportunity_reviews` | Review records for product opportunities | Review workflow |

---

### 3.12 Founders & people (12 tables)

| Table | Stores | Features |
|---|---|---|
| `founders` | Founder records: `ventureId`, `name`, `equityPct`, LinkedIn, background | Founder profile; equity calculations |
| `talent_profiles` | External talent records: skills, experience, LinkedIn | Talent matching |
| `venture_role_requirements` | Required roles per venture: title, skills, priority | Talent gap analysis |
| `people_venture_fit` | Talent-to-venture fit scores | Fit scoring |
| `team_compositions` | Team composition snapshots | Team track |
| `team_gap_analysis` | Gap analysis records: missing competencies | Gap analysis |
| `founder_suitability_assessments` | Founder suitability scores per dimension | FRL input |
| `founder_match_scores` | Founder-to-venture match scores | Matching engine |
| `co_founder_compatibility` | Co-founder compatibility assessments | Co-founder track |
| `founder_onboarding_submissions` | Onboarding questionnaire submissions | Onboarding flow |
| `founderSelfAssessments` (`founder_self_assessments`) | Self-assessment responses: no `ventureId` column (joined via `founders`) | Coaching FRL |
| `founder_leaderboard_snapshots` | Leaderboard snapshots for founder progress | Leaderboard |

---

### 3.13 Coaching & FRL (18 tables)

FRL = Founder Readiness Level.

| Table | Stores | Features |
|---|---|---|
| `coaching_coaches` | Coach profiles: name, specialisms, availability | Coach registry |
| `coaching_assignments` | Coach-to-founder assignments: `ventureId`, `coachId`, `founderId` | Assignment management |
| `coaching_sessions` | Session records: date, duration, notes, outcomes | Session log |
| `coaching_commitments` | Commitments made in sessions: due date, status | Commitment tracker |
| `coaching_commitment_templates` | Reusable commitment templates | Template library |
| `commitment_templates` | Second commitment template store (system-level) | Admin template management |
| `coaching_behaviour_metrics` | Behaviour change metrics per founder | FRL behavioural track |
| `coaching_frl` | FRL scores per week (uses `.week`, not `.weekOf`) | FRL scoring; VRL input |
| `coaching_vrl_link` | VRL contributions from FRL: `frlScore`, `vrlWeight` | VRL FRL pathway |
| `coaching_insights` | AI-generated coaching insights | Insight generation |
| `coaching_onboarding_state` | Onboarding state machine per founder | Onboarding flow |
| `coaching_session_requests` | Session booking requests | Booking workflow |
| `prl_trend_alerts` | PRL trend alerts triggered by coaching data | Alert system |
| `founder_progress_reports` | Weekly/monthly progress reports | Reporting |
| `coach_performance_snapshots` | Coach effectiveness snapshots | Coach analytics |
| `coach_trend_cache` | Cached trend calculations for coaching dashboard | Performance cache |
| `frl_goals` | FRL goals per founder | Goal-setting |
| `flower_export_log` | Export log for Flower coach visualisation | Export tracking |
| `alert_schedule_log` | Scheduler run log: founders scanned, alerts generated | Alert scheduler audit |
| `report_delivery_log` | Report delivery audit log | Delivery audit |
| `template_effectiveness_cache` | Template effectiveness score cache | Analytics |
| `founder_notifications` | Notification records for founders | Notification system |

---

### 3.14 Engineering Research Lab — ERL (7 tables)

| Table | Stores | Features |
|---|---|---|
| `erl_projects` | ERL project records: `ventureId`, project type, status | ERL module |
| `erl_stages` | Research stage definitions per project | Stage tracking |
| `erl_materials` | Material records: composition, source | Materials tracking |
| `erl_simulations` | Simulation run records: parameters, outputs | Simulation log |
| `erl_ip_assets` | IP assets generated from research | IP linkage |
| `erl_agent_runs` | AI agent run records for ERL workflows | AI pipeline audit |
| `erl_validation_logs` | Validation test logs | Validation track |

---

### 3.15 IP & patents (8 tables)

| Table | Stores | Features |
|---|---|---|
| `ip_assets` | IP asset records: `ventureId`, type (patent/trademark/copyright), status, jurisdiction | IP module |
| `ip_licenses` | License agreements for IP assets | IP licensing |
| `patent_projects` | Patent project management records | Patent track |
| `patent_hypotheses` | Patent hypothesis records | Patent strategy |
| `ip_analyses` | IP landscape analyses | IP analysis |
| `ip_entities` | IP entity registry (assignees, licensees) | Entity management |
| `ip_whitespace` | IP whitespace mapping records | Whitespace analysis |
| `ip_vrl_feed` | VRL feed entries from IP readiness | VRL IP pathway |

---

### 3.16 Legal & governance (14 tables)

| Table | Stores | Features |
|---|---|---|
| `contract_documents` | Contract documents: title, type, status, venture link | Contract store |
| `contract_layers` | Contract layer definitions (reference data) | Contract classification |
| `contract_type_registry` | Registry of contract types with risk levels | Contract type management |
| `legal_risk_items` | Legal risk records: risk area, severity, status | Legal risk register |
| `legal_risk_escalations` | Escalation records for legal risks | Escalation workflow |
| `legal_contract_requirements` | Contract requirements per venture: requirement type, status | `/governance/contracts` |
| `legal_contract_records` | Executed contract records: counterparty, signed date, expiry | Contract tracker |
| `legal_contract_dependencies` | Dependency links between contracts | Dependency mapping |
| `governance_policies` | Policy records per venture | Governance module |
| `complianceChecks` (`compliance_checks`) | Compliance check records | Compliance track |
| `riskRegister` (`risk_register`) | General governance risk register | Risk management |
| `gd_workspaces` | Governance document workspaces | Governance doc management |
| `gd_folders` | Document folders within workspaces | File organisation |
| `gd_permissions` | Per-user permissions within workspaces | Workspace access control |

---

### 3.17 Purpose & mission governance (11 tables)

| Table | Stores | Features |
|---|---|---|
| `purpose_charters` | Mission and purpose charter text per venture | Purpose module |
| `mission_locks` | Locked mission statements with board approval status | Mission lock workflow |
| `governance_structures` | Board / advisory committee structure | Governance structure |
| `governance_directors` | Director records: name, role, independent flag | Board composition |
| `board_pledges` | Director pledges and undertakings | Pledge register |
| `reserved_matters` | Reserved matters list per venture | Reserved matter governance |
| `investor_alignment` | Investor alignment assessments | Investor governance |
| `capital_decision_log` | Capital decisions with board vote records | Capital governance |
| `governance_review_cycles` | Scheduled governance review cycles | Review scheduling |
| `governance_documents` | Governance document library | Document management |
| `governance_maturity_scores` | Governance maturity assessment scores | Maturity track |
| `purpose_metrics` | Purpose and impact metrics | Purpose measurement |
| `purpose_drift_detections` | Detected purpose drift events | Drift detection |
| `corrective_governance_actions` | Actions taken to correct drift | Corrective governance |
| `mission_integrity_scores` | Mission integrity scoring snapshots | Mission scoring |
| `mission_drift_alerts` | Alerts triggered by mission drift | Alert system |
| `succession_plans` | Succession planning records | Succession management |
| `stakeholder_profiles` | Stakeholder register: name, type, influence level | Stakeholder management |

---

### 3.18 Equity & cap table (5 tables)

| Table | Stores | Features |
|---|---|---|
| `equity_rules` | Equity vesting rules and cliff definitions | Equity management |
| `equity_allocations` | Equity allocations per holder: shares, %, vesting | Cap table |
| `contribution_logs` | Contribution tracking for equity justification | Contribution track |
| `equity_milestones` | Equity milestone triggers | Milestone-based vesting |
| `venture_cap_table_snapshots` | Cap table snapshots at a point in time | Cap table history |

---

### 3.19 Financial (10 tables)

| Table | Stores | Features |
|---|---|---|
| `financial_snapshots` | Financial KPI snapshots: ARR, MRR, burn, runway, cash | Financial dashboard |
| `finPlLines` | P&L line items: category, amount, period | Financial model |
| `finRunwayScenarios` | Runway scenario models: cash balance, monthly burn | Runway planning |
| `finExitWaterfall` | Exit waterfall configuration | Exit modelling |
| `finWaterfallTranches` | Waterfall distribution tranches | Exit modelling detail |
| `finInvestorReports` | Investor report records | Investor reporting |
| `finUnitEconomics` | Unit economics: CAC, LTV, payback period | Unit economics module |
| `burn_rate_metrics` | Burn rate tracking records | Burn rate monitoring |
| `funding_progression_metrics` | Funding round progress metrics | Fundraising tracking |
| `market_timing_signals` | Market timing indicator records | Market timing |

---

### 3.20 CRM & investor pipeline (17 tables)

All CRM and investor tables exist in `schema.ts` as `pgTable`. (The `schema_crm.ts` file duplicates these with `mysqlTable` — see section 4.)

| Table | Stores | Features |
|---|---|---|
| `crmPipelines` | Sales pipeline records: `ventureId`, name, stage | CRM module |
| `crmPipelineStages` | Pipeline stage definitions | CRM stage management |
| `crmContacts` | Contact records: name, email, organisation, role | Contact directory |
| `crmLeads` | Lead records: contact link, status, deal value | Lead management |
| `crmDeals` | Deal records: stage, value, close date | Deal management |
| `crmActivities` | Activity log: call, email, meeting records | Activity tracking |
| `invContacts` | Investor contact records: name, firm, type | Investor directory |
| `invFundingRounds` | Historical funding round records | Cap table history |
| `invTermSheets` | Term sheet records: valuation, conditions, status | Term sheet tracker |
| `invCapTable` | Cap table entries: holder, ownership %, instrument | Cap table |
| `invDueDiligence` | Due diligence item records | DD checklist |
| `invUpdates` | Investor update records: period, content, sent status | Investor relations |
| `invReadinessScores` | Investor readiness scoring records | Readiness assessment |
| `invOutputs` | Investment outputs and returns | Portfolio reporting |
| `invTargets` | Target investor records | Investor targeting |
| `invKpis` | KPI records for investor reporting | KPI tracking |
| `invFundraisingRounds` | Active fundraising round records | Fundraising management |

---

### 3.21 AI & data management (9 tables)

All DM tables exist in `schema.ts` as `pgTable`. (The `schema_dm.ts` file duplicates these with `mysqlTable` — see section 4.)

| Table | Stores | Features |
|---|---|---|
| `dmDataAssets` | Data asset registry: asset type, source, size | Data management |
| `dmQualityScores` | Data quality scores per asset | Quality monitoring |
| `dmAiPipelines` | AI pipeline definitions: type, model, status | AI pipeline management |
| `dmPipelineRuns` | Pipeline run records: inputs, outputs, duration | Run audit log |
| `dmRagPipelines` | RAG pipeline configurations: embedding model, chunk size | RAG management |
| `dmRagDocuments` | Documents indexed in RAG pipelines | RAG document store |
| `dmFineTuningJobs` | Fine-tuning job records: base model, dataset, status | Fine-tuning management |
| `dmFineTuningDatasets` | Training datasets for fine-tuning | Dataset management |
| `dmFeedbackEntries` | Human feedback entries: rating, label, comments | RLHF feedback |

---

### 3.22 Supply chain & manufacturing (13 tables)

The `mfg*` tables (in `schema.ts` as `pgTable`) cover China manufacturing playbook functionality. The `schema_extended.ts` file duplicates five of these with `mysqlTable` (see section 4).

| Table | Stores | Features |
|---|---|---|
| `sc_products` | Supply chain product records | SC module |
| `sc_prototypes` | Prototype records: version, material, status | Prototype tracking |
| `sc_manufacturing` | Manufacturing process records | Manufacturing track |
| `sc_suppliers` | Supplier records: name, country, tier | Supplier management |
| `sc_production_orders` | Production order records | Order management |
| `mfgPlaybookProjects` | Manufacturing playbook project records | Mfg playbook |
| `mfgSupplierTiers` | Supplier tier definitions | Supplier tiering |
| `mfgQcReports` | Quality control report records | QC management |
| `mfgLogisticsShipments` | Shipment records: origin, destination, status | Logistics tracking |
| `mfgSupplierOnboarding` | Supplier onboarding records | Supplier onboarding |
| `mfgFactoryAudits` | Factory audit records: score, findings | Factory audit |
| `mfgRfqTemplates` | RFQ template records | Sourcing |
| `mfgApprovedSuppliers` | Approved supplier list | Supplier approval |
| `mfgContractTemplates` | Manufacturing contract templates | Contract management |

---

### 3.23 University & research (14 tables)

The `uni*` tables in `schema.ts` are `pgTable`. The `schema_uni.ts` file duplicates eight of these with `mysqlTable` (see section 4).

| Table | Stores | Features |
|---|---|---|
| `research_papers` | Research paper records: `ventureId`, title, authors, DOI | Research module |
| `fellow_researchers` | Fellow researcher profiles linked to ventures | Research network |
| `university_partnerships` | University partnership records | Partnership management |
| `academic_papers` | Semantic Scholar–indexed papers: `externalId` (unique), citation count | Academic evidence; BRL validation |
| `task_paper_links` | Links between BRL tasks and academic papers | BRL academic validation |
| `knowledge_documents` | Internal knowledge document records | Knowledge base |
| `knowledge_chunks` | Chunked knowledge document content for RAG | RAG indexing |
| `irlScores` | Innovation Readiness Level score records | IRL module |
| `uniPartners` | University partner records | University module |
| `uniResearchProjects` | Research project records linked to partners | Research management |
| `uniTalentRoles` | Talent roles for university placements | Talent track |
| `uniVentureWorkflows` | University–venture workflow records | Workflow management |
| `uniIndustryEngagements` | Industry engagement records | Engagement tracking |
| `uniGovernanceDocs` | University governance documents | Governance |
| `uniDataSources` | University data source registry | Data lineage |
| `uniRoadmapMilestones` | University collaboration roadmap milestones | Roadmap |
| `uniApprovalReports` | University approval report records | Approval tracking |

---

### 3.24 Data Room (10 tables)

| Table | Stores | Features |
|---|---|---|
| `dr_rooms` | Data room definitions: `ventureId`, name, access level | Data room management |
| `dr_assets` | Asset records within data rooms: file type, url, metadata | Asset library |
| `dr_readiness_checks` | Readiness check records for data rooms | Readiness assessment |
| `dr_investors` | Investor access records for rooms | Investor access control |
| `dr_permissions` | Per-investor permission records | Permission management |
| `dr_engagement_events` | Investor engagement events: views, downloads | Engagement analytics |
| `dr_qa_requests` | Q&A request records from investors | Q&A management |
| `dr_templates` | Data room template records | Template library |
| `dr_approvals` | Approval records for data room content | Approval workflow |
| `dr_ai_generations` | AI-generated content records for data rooms | AI content generation |

---

### 3.25 Playbook & widget system (12 tables)

| Table | Stores | Features |
|---|---|---|
| `playbookLibrary` | Playbook definitions: name, category, VRL stage | Playbook library |
| `playbookVersions` | Versioned playbook content | Version management |
| `adminTemplates` | Admin-managed playbook templates | Admin control |
| `playbookContextRules` | Context rules for playbook display | Contextual guidance |
| `playbookWidgetConfigs` | Widget configuration per playbook | Widget system |
| `playbookUsageEvents` | Usage event records | Usage analytics |
| `playbookCompletions` | Playbook completion records per venture | Completion tracking |
| `widgetGlobalSettings` | Global widget threshold settings | Admin settings |
| `widgetThresholdSettings` | Warning threshold settings | Threshold management |
| `widgetRoleSettings` | Widget visibility by role | Role-based display |
| `contextualGuidanceEvents` | Contextual guidance trigger events | Guidance engine |
| `pbPlaybooks` | Secondary playbook run records | Playbook runner |
| `pbSteps` | Run step definitions | Step management |
| `pbRuns` | Playbook run instances | Run tracking |
| `pbRunSteps` | Step completion records per run | Run detail |
| `pbKpiEntries` | KPI entries captured during runs | KPI collection |
| `pbLinkedAssets` | Assets linked to playbook runs | Asset linkage |

---

### 3.26 Learning engine (8 tables)

| Table | Stores | Features |
|---|---|---|
| `le_problems` | Problem records for learning engine | Learning engine |
| `le_insights` | Generated insights | Insight store |
| `le_input_weights` | Input weight configurations | Weight management |
| `le_vrl_metrics` | VRL metrics consumed by learning engine | Metrics feed |
| `le_learning_patterns` | Identified learning patterns | Pattern recognition |
| `le_recommendations` | Recommendation records | Recommendation engine |
| `le_kg_nodes` | Knowledge graph nodes | Knowledge graph |
| `le_kg_edges` | Knowledge graph edges | Knowledge graph |

---

### 3.27 Sustainability & ESG (12 tables in addition to SRL)

| Table | Stores | Features |
|---|---|---|
| `esg_metrics` | ESG metric snapshots per venture | ESG tracking |
| `lca_assessments` | Life-cycle assessment records | LCA module |
| `pcf_records` | Product carbon footprint records | PCF tracking |
| `csr_metrics` | Corporate social responsibility metrics | CSR module |
| `certification_tracking` | Sustainability certification records (B Corp, ISO 14001, etc.) | Certification tracker |
| `lcssa_environmental` | LCSSA environmental dimension records | LCSSA framework |
| `lcssa_social` | LCSSA social dimension records | LCSSA framework |
| `lcssa_life_cycle_cost` | LCSSA life-cycle cost records | LCSSA framework |
| `lcssa_oversight` | LCSSA oversight records | LCSSA framework |
| `lcssa_decision_log` | LCSSA decision log entries | LCSSA framework |
| `lcssa_snapshot` | LCSSA composite snapshot records | LCSSA scoring |
| `sustainability_hub` | Central sustainability hub records per venture | Sustainability module |
| `impact_metrics` | Impact measurement records | Impact tracking |
| `lca_carbon` | Carbon accounting records | Carbon track |
| `circularity_metrics` | Circularity metric records | Circular economy |
| `esg_bcorp_metrics` | B Corp-specific metric records | B Corp track |

---

### 3.28 Spinoff & ecosystem (10 tables)

| Table | Stores | Features |
|---|---|---|
| `spinoff_configurations` | Spinoff configuration per venture | Spinoff module |
| `spinoff_execution_plans` | Spinoff execution plan records | Spinoff planning |
| `spinoff_status_history` | Spinoff status change history | Status tracking |
| `spinoff_sequences` | Spinoff sequence step records | Sequence management |
| `spinoff_assets` | Assets transferred in a spinoff | Asset transfer |
| `spinoff_handover_packs` | Handover pack records | Handover management |
| `spinoutBlueprints` | Spinout blueprint records | Blueprint library |
| `blueprintLibraryLinks` | Links between blueprints and domain records | Blueprint linkage |
| `ecosystemMapNodes` | Ecosystem map node records: type, position, links | Ecosystem mapping |
| `value_networks` | Value network records per venture | Value network |

---

### 3.29 Marketing, brand & PR (10 tables)

| Table | Stores | Features |
|---|---|---|
| `marketingCampaigns` | Campaign records: channel, budget, performance | Marketing module |
| `marketingChannelScores` | Channel effectiveness scores | Channel analytics |
| `brandReadinessScores` | Brand readiness assessment scores | Brand module |
| `brandChecklistItems` | Brand readiness checklist items | Brand checklist |
| `pressReleases` | Press release records | PR module |
| `newsletterCampaigns` | Newsletter campaign records | Communications |
| `mediaCoverage` | Media coverage tracking | PR tracking |
| `brand_assets` | Brand asset library: logo, colours, typography | Brand assets |
| `brand_links` | Links from brand assets to domain records | Asset linkage |
| `brand_update_log` | Brand update audit log | Brand governance |

---

### 3.30 Portfolio & offerings (12 tables)

| Table | Stores | Features |
|---|---|---|
| `portfolios` | Portfolio records: name, owner | Portfolio management |
| `offerings` | Offering records: `ventureId`, name, category, stage | Offering module |
| `offeringKpiSnapshots` | KPI snapshots per offering | KPI tracking |
| `offeringFinancialModels` | Financial models linked to offerings | Financial modelling |
| `offeringWorkflowLinks` | Workflow links for offerings | Workflow integration |
| `offeringRevenueLinks` | Revenue record links | Revenue association |
| `offeringSupplyChainLinks` | Supply chain record links | SC association |
| `offeringExperimentLinks` | Experiment record links | Experiment association |
| `offeringRiskLinks` | Risk record links | Risk association |
| `offeringMilestoneLinks` | Milestone record links | Milestone association |
| `offeringCrmLinks` | CRM record links | CRM association |
| `offeringAnalyticsLinks` | Analytics record links | Analytics association |
| `offeringResearchLinks` | Research record links | Research association |

---

### 3.31 Venture insight framework — VI & PM (10 tables)

| Table | Stores | Features |
|---|---|---|
| `vi_ideas` | Venture idea records | VI module |
| `vi_assumptions` | Assumption records per idea | Assumption tracking |
| `vi_riskiest` | Riskiest assumption identification records | Risk prioritisation |
| `vi_decisions` | Decision records for venture ideas | Decision log |
| `pm_value_propositions` | Value proposition records | PM module |
| `pm_jtbd` | Jobs-to-be-done records | JTBD framework |
| `pm_bm_hypotheses` | Business model hypothesis records | BM testing |
| `pm_revenue_tests` | Revenue model test records | Revenue validation |
| `pm_unit_economics` | Unit economics records | Unit economics |
| `pm_risks` | Product management risk records | PM risk register |

---

### 3.32 Venture programmes & workstreams (8 tables)

| Table | Stores | Features |
|---|---|---|
| `venture_programs` | Programme definitions per venture | Programme management |
| `venture_phases` | Phase definitions within programmes | Phase management |
| `venture_workstreams` | Workstream records per programme | Workstream management |
| `venture_milestones` | Programme milestone records | Milestone tracking |
| `venture_tasks` | Task records within workstreams | Task management |
| `venture_resources` | Resource allocation records | Resource management |
| `venture_dependencies` | Dependency records between tasks | Dependency mapping |
| `venture_documents` | Programme document records | Document management |

---

### 3.33 Risk registers (8 tables)

| Table | Stores | Features |
|---|---|---|
| `venture_risks` | Main venture risk register: category (Technical/Market/Financial/Operational/Regulatory), `riskScore` (Likelihood × Impact), `riskLevel` | VRL risk index; adjusted VRL calculation |
| `engineering_risks` | FMEA-style engineering risks: severity, occurrence, detection, RPN | Engineering risk module |
| `mitigation_actions` | Mitigation actions for engineering risks: `revisedRpn` computed column | Mitigation tracking |
| `risks` | General risks: `ventureId`, domain | Basic risk module |
| `execution_risks` | Execution-specific risk records | Execution risk track |
| `business_risk_inputs` | Business risk input records | Dual-risk framework |
| `product_risk_inputs` | Product risk input records | Dual-risk framework |
| `dual_risk_decisions` | Dual risk (business + product) decision records | Dual-risk decisions |
| `riskRegister` | Governance-level risk register | Governance risk |
| `mrl_risk_register` | Manufacturing-specific risk register | MRL risk track |

---

### 3.34 Startup failure risk (10 tables)

| Table | Stores | Features |
|---|---|---|
| `startup_failure_risk_scores` | Composite failure risk scores | Failure risk module |
| `customer_validation_evidence` | Customer validation evidence records | Failure risk input |
| `revenue_model_assessments` | Revenue model assessment records | Failure risk input |
| `execution_velocity_metrics` | Execution velocity metrics | Failure risk input |
| `team_competency_assessments` | Team competency assessment records | Failure risk input |
| `flexibility_pivot_logs` | Pivot flexibility log records | Failure risk input |
| `market_timing_signals` | Market timing signal records | Failure risk input |
| `strategic_roadmap_assessments` | Strategic roadmap assessment records | Failure risk input |
| `failure_risk_alerts` | Failure risk alert records | Alert generation |
| `contingency_playbooks` | Contingency playbook records | Contingency planning |

---

### 3.35 Stage gates & scoring sessions (8 tables)

| Table | Stores | Features |
|---|---|---|
| `stage_gate_reviews` | Stage-gate review records | Stage-gate workflow |
| `stage_gate_evidence` | Evidence items per stage-gate | Evidence collection |
| `scoring_sessions` | Multi-dimension scoring sessions | Scoring engine |
| `scoring_category_results` | Category scores per session | Scoring breakdown |
| `scoring_datasets` | Scoring dataset records (reference data for sessions) | Scoring data |
| `dashboard_kpi_snapshots` | KPI snapshot records for venture dashboard | Dashboard |
| `insight_triggers` | Insight trigger records | Insight engine |
| `insight_summaries` | AI-generated insight summaries | Insight delivery |

---

### 3.36 Pivot & archive (5 tables)

| Table | Stores | Features |
|---|---|---|
| `pivot_decisions` | Pivot decision records: trigger, rationale, new direction | Pivot workflow |
| `pivot_trigger_config` | Pivot trigger thresholds per venture | Trigger configuration |
| `pivot_runway_inputs` | Runway input data for pivot decisions | Runway modelling |
| `pivot_log` | Pivot event log with before/after state | Pivot history |
| `venture_archive` | Archived venture records | Archive management |

---

### 3.37 Specialists & collaboration (5 tables)

| Table | Stores | Features |
|---|---|---|
| `specialists` | Specialist profiles: domain, rate, availability | Specialist module |
| `specialistCommissions` | Commission records per specialist engagement | Commission tracking |
| `specialistServiceTasks` | Service task records for specialist work | Service delivery |
| `collaboration_tasks` | Cross-venture collaboration task records | Collaboration module |
| `advisory_reviews` | Advisory review records | Advisory board |

---

### 3.38 Trend & trajectory (5 tables)

| Table | Stores | Features |
|---|---|---|
| `technology_trajectories` | Technology trajectory records | Technology tracking |
| `cohort_snapshots` | Cohort snapshot records | Cohort analytics |
| `autonomy_health_checks` | Autonomy health check records: budget protection, decision autonomy scores | Autonomy monitoring |
| `opportunities` | Opportunity records: title, sector, status | Opportunity pipeline |
| `opportunity_disruption_scores` | Disruption scoring records | Disruption analysis |
| `opportunity_reports` | Opportunity report records | Reporting |

---

### 3.39 System & audit (10 tables)

| Table | Stores | Features |
|---|---|---|
| `auditLog` | Action audit log: `userId`, `action`, `module`, `resourceId`, `ventureId`, before/after JSON | Audit trail (primary) |
| `systemAuditLogs` (`system_audit_logs`) | Second system-level audit log | System audit |
| `systemDataFields` | System data field registry | Field management |
| `systemModuleStatus` | Module enable/disable status | Module management |
| `systemConfiguration` | Key-value system configuration store | Global configuration |
| `systemWidgetAnalytics` | Widget usage analytics | Widget analytics |
| `systemIntegrations` | External integration configuration records | Integration management |
| `systemApiKeys` | API key records (hashed; for external integrations) | API key management |
| `workflowTriggerLog` | Workflow trigger log: source, target, status, payload, result | Workflow audit |
| `charity_partnerships` | Charity partnership records (push-only, no migration) | Charity module |

---

## 4. Shadow Schema Files (mysqlTable)

Five of the seven component schema files define their tables using **`mysqlTable`** from `drizzle-orm/mysql-core`. The production database is PostgreSQL. These tables are **never applied to the database** because:

1. `drizzle.config.ts` points only at `drizzle/schema.ts`
2. `mysqlTable` generates MySQL DDL, which Drizzle would refuse to push to a PostgreSQL connection

**The same logical tables are re-defined in `schema.ts` using `pgTable` and are the live versions.**

| File | Table builder | Tables defined | Status |
|---|---|---|---|
| `schema_cc.ts` | `pgTable` | 7 (cc_hypotheses … cc_alerts) | Active (used by `schema.ts` imports) |
| `schema_wtp.ts` | `pgTable` | 4 (wtp_commitments … procurement_pathways) | Active — added in migration 4 |
| `schema_crm.ts` | `mysqlTable` | 9 (crmPipelines … invUpdates) | **Dead — MySQL shadow of live pgTable versions in schema.ts** |
| `schema_dm.ts` | `mysqlTable` | 9 (dmDataAssets … dmFeedbackEntries) | **Dead — MySQL shadow** |
| `schema_extended.ts` | `mysqlTable` | 5 (mfgSupplierOnboarding … mfgContractTemplates) | **Dead — MySQL shadow** |
| `schema_fin.ts` | `mysqlTable` | 6 (finPlLines … finUnitEconomics) | **Dead — MySQL shadow** |
| `schema_uni.ts` | `mysqlTable` | 8 (uniPartners … uniRoadmapMilestones) | **Dead — MySQL shadow** |

**Action required:** The five dead files should be deleted to eliminate confusion. There is no migration risk in doing so because they have never been applied.

---

## 5. Tables Added Outside Migration Journal

Eight tables were applied directly via `drizzle-kit push --force` after the last journalled migration. They exist in the live database but have **no SQL migration file** and no journal entry.

| Table | Added by | Feature |
|---|---|---|
| `lean_canvases` | push | Lean Canvas (`/lean/canvas`) |
| `lean_canvas_blocks` | push | Lean Canvas blocks |
| `lean_canvas_block_evidence_links` | push | Lean Canvas evidence links |
| `product_milestones` | push | Prototype Tracker (`/rnd/prototypes`) |
| `legal_contract_requirements` | push | Governance Contracts |
| `legal_contract_records` | push | Governance Contracts |
| `legal_contract_dependencies` | push | Governance Contracts |
| `charity_partnerships` | push | Charity module |

**Risk:** If the production database were ever reset or cloned to a fresh instance and migrations replayed in order, these eight tables would be missing. Any deployment relying on `drizzle-kit migrate` (rather than `push`) would break.

---

## 6. Schema Risks & Missing Constraints

### 6.1 No foreign key constraints on ~335 ventureId columns (Critical)

The initial migration (`0000`) was generated without any `REFERENCES` clauses. Of the approximately 340+ `ventureId` columns across all tables, **only those in `venture_members` (migration 3) and a handful of recently added governance tables have database-level FK constraints**. The remaining ~335 ventureId columns are plain `varchar(64)` strings.

**Consequence:** A deleted venture leaves orphaned rows across every module. Queries can silently return data for non-existent ventures. Cross-venture data leaks via ID-guessing are not caught at the database level.

**Confirmed tables with FK on ventureId:**
`venture_members` (migration 3), `purpose_charters`, `mission_locks`, `governance_structures`, `governance_directors`, `board_pledges`, `reserved_matters`, `investor_alignment`, `capital_decision_log`, `governance_review_cycles`, `purpose_metrics`, `purpose_drift_detections`, `corrective_governance_actions`, `governance_documents`, `governance_maturity_scores`, `mission_integrity_scores`, `mission_drift_alerts`, `succession_plans`, `stakeholder_profiles`, `vi_ideas`, `vi_assumptions`, `vi_riskiest`, `vi_decisions`, `pm_value_propositions`, `pm_jtbd`, `pm_bm_hypotheses`, `pm_revenue_tests`, `pm_unit_economics`, `pm_risks`.

All other tables: **no FK constraint**.

### 6.2 No FK constraints in the initial migration (High)

`0000_puzzling_scorpion.sql` creates 315 tables with zero `FOREIGN KEY` definitions. Drizzle's schema definition included `.references()` calls for only a small subset of columns at the time of generation. The migration file is the source of truth for what was actually applied to PostgreSQL.

### 6.3 Missing updatedAt timestamps (Medium)

Several high-activity tables lack an `updatedAt` column, making it impossible to determine when a record last changed:

| Table | Only has |
|---|---|
| `venture_members` | `createdAt` only |
| `venture_scores` | `recordedAt` only |
| `financial_snapshots` | `createdAt` only |
| `evidence_claims` | `createdAt` only |
| `crmPipelineStages` | `createdAt` only |
| `dmQualityScores` | `createdAt` only |
| `finWaterfallTranches` | `createdAt` only |
| `milestones` | `createdAt` only |

### 6.4 Nullable FK-like columns with no constraint (Medium)

Several columns store IDs that clearly reference parent rows but are nullable and carry no FK constraint:

| Table | Column | References (logical) |
|---|---|---|
| `cc_evidence` | `hypothesisId` | `cc_hypotheses.id` |
| `cc_experiments` | `hypothesisId` | `cc_hypotheses.id` |
| `customer_interviews` | `customerSegmentId`, `problemHypothesisId` | Respective parent tables |
| `demand_signals` | `problemHypothesisId` | `problem_hypotheses.id` |
| `dmPipelineRuns` | `pipelineId` | `dmAiPipelines.id` |
| `dmRagDocuments` | `ragPipelineId` | `dmRagPipelines.id` |
| `governance_directors` | `userId` | `users.id` |
| `capital_decision_log` | `investorAlignmentId` | `investor_alignment.id` |
| `corrective_governance_actions` | `driftId` | `purpose_drift_detections.id` |

### 6.5 founderSelfAssessments has no ventureId (Medium)

`founder_self_assessments` stores no `ventureId` column. Venture-scoped queries must join through the `founders` table. This makes direct venture-scoped filtering impossible without the join and is inconsistent with every other founder-related table.

### 6.6 Inconsistent ventureId column type (Low)

Approximately 80% of tables use `varchar(64)` for `ventureId`; approximately 20% use `text`. Both work in PostgreSQL but prevent the Drizzle type system from catching cross-table join mismatches at compile time.

### 6.7 auditLog.userId is varchar, users.id is serial integer (Low)

`auditLog.userId` is `varchar(64)`, storing the OAuth subject string. `users.id` is a serial integer. There is no FK constraint, and the column semantics differ. Application code that tries to look up `users.id` using `auditLog.userId` will find no match.

### 6.8 Single shared database for dev and production (High — operational)

There is no environment separation at the database level. A `drizzle-kit push --force` executed in a development shell against the shared `DATABASE_URL` modifies the production schema immediately, with no confirmation step or migration review.

### 6.9 Push-only tables have no reproducible migration path (High)

The eight tables added via `push` (section 5) have no corresponding SQL migration file. If the database is rebuilt from migrations (e.g., on a new Replit instance, staging environment, or disaster recovery), those tables will be absent and the application will crash on their routes.

---

## 7. Phase 2 Recommendations

The following changes are recommended before the Phase 2 demonstrator is shown to external stakeholders.

### Priority 1 — Immediate (before demo)

**R1.1 — Generate migration files for push-only tables**  
Run `drizzle-kit generate` after the current schema state to capture `lean_canvases`, `product_milestones`, and the six other push-only tables as a proper migration file. Commit and journal the result. This makes the schema reproducible.

**R1.2 — Delete the five dead mysqlTable files**  
Remove `schema_crm.ts`, `schema_dm.ts`, `schema_extended.ts`, `schema_fin.ts`, `schema_uni.ts`. They have never been applied and create a false impression that a MySQL database is in use. No migration is needed; the live pgTable equivalents in `schema.ts` remain untouched.

**R1.3 — Separate development and production databases**  
Create a second Replit PostgreSQL database for development. Set `DATABASE_URL` per environment (Replit environment variables support this). This prevents a development `push --force` from corrupting production data.

### Priority 2 — Before wider rollout

**R2.1 — Add ON DELETE CASCADE to venture_members and the governance FK chain**  
The existing governance tables already declare `{ onDelete: "cascade" }`. Extend this to `venture_members`, `milestones`, `risks`, `founders`, `experiments`, `interviews`, and the other high-volume per-venture tables. Write these as a single migration to keep the journal clean.

**R2.2 — Add ventureId FK to the highest-risk tables first**  
A complete retrofit of ~335 tables is impractical in one step. Prioritise the tables that carry the most sensitive data or are most likely to receive orphaned rows:

1. `financial_snapshots`
2. `venture_scores`
3. `evidence_claims`
4. `cc_hypotheses`, `cc_experiments`, `cc_evidence`
5. `customer_interviews`, `customer_segments`
6. `vrl_scoring_params`, `vrl_assessments`

Add as a single migration: `ALTER TABLE <name> ADD CONSTRAINT <name>_ventureId_fk FOREIGN KEY ("ventureId") REFERENCES ventures(id) ON DELETE CASCADE`.

**R2.3 — Add updatedAt to venture_members and financial_snapshots**  
These are the two most queried tables that lack an update timestamp. A simple `ALTER TABLE … ADD COLUMN "updatedAt" timestamp DEFAULT now()` suffices.

**R2.4 — Add ventureId to founderSelfAssessments**  
Add a nullable `ventureId varchar(64)` column with an FK to `ventures.id` to enable direct venture-scoped queries without requiring a join through `founders`.

### Priority 3 — Technical debt (post-demo)

**R3.1 — Normalise ventureId column type to varchar(64)**  
Change all `text` ventureId columns to `varchar(64)` for consistency. This is safe in PostgreSQL; no data truncation will occur since venture IDs are short slugs.

**R3.2 — Align auditLog.userId semantics**  
Either store the integer `users.id` in `auditLog.userId` (and change the type to integer with an FK), or rename the column to `auditLog.openId` to make clear it holds the OAuth subject, not the database user ID. Pick one and be consistent.

**R3.3 — Add indexes on high-frequency ventureId WHERE clauses**  
Most tRPC routers filter by `ventureId`. Without indexes, full table scans occur on every request. Add a B-tree index on `ventureId` for all per-venture tables with more than a few thousand expected rows:

```sql
CREATE INDEX CONCURRENTLY ON <table_name> ("ventureId");
```

`CONCURRENTLY` avoids locking the table during index creation on a live database.

**R3.4 — Replace drizzle-kit push with drizzle-kit migrate in post-merge.sh**  
`push --force` bypasses the migration journal and can silently drop columns. Replace with:
```bash
pnpm exec drizzle-kit generate
pnpm exec drizzle-kit migrate
```
This ensures every schema change is recorded, reviewable, and repeatable.

---

*End of report.*
