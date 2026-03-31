# EcoBlend Dashboard TODO

## Completed
- [x] Initial dashboard scaffold with hub-and-spoke diagram
- [x] VRL/TRL dual readiness framework
- [x] Portfolio Overview page with KPI cards
- [x] Venture Detail drill-down pages
- [x] VRL Analytics page
- [x] TRL Analytics page (with Valley of Death chart)
- [x] Investment Readiness page
- [x] Risk Management page
- [x] Founder Onboarding wizard
- [x] B Corp & ISO tracker
- [x] Foundation Impact module
- [x] IP Management module
- [x] People & ESOP module (with stipend, not ZINC VC)
- [x] Marketing Strategy module
- [x] Financial Analytics module
- [x] Brand Readiness module
- [x] Customer Interview Tracker
- [x] EcoBlend Playbook Progress module
- [x] Real EcoBlend logo in sidebar
- [x] Playbook-to-VRL auto-advancement
- [x] Interview-to-hypothesis BMC/MMC linking
- [x] Canvas Evidence Summary on Venture Detail
- [x] VRL/TRL sync notification badge in sidebar
- [x] Legal Contracts module
- [x] Full-stack upgrade (db, server, user)

## In Progress
- [x] Document upload on Legal Contract cards (S3 storage)
- [x] Investor Pack PDF export (bundled readiness + legal summary)

## New Features (Mar 2026)
- [x] Correct venture brand identities: EcoBlend R&D → internal lab, EcoBlend → materials brand, TONE → eco-creative, REAL → sports protection
- [x] Add PIPE venture (eco-water sport and performance brand)
- [x] Add Brand Newsletter & PR module

## Sprint 3 (Mar 2026)
- [x] Link Investment Readiness to Financial Analytics (funding ask, gap, burn rate, runway per brand)
- [x] Specialist Services marketplace module (task tagging, directory, commission flow, status tracking)
- [x] Add Specialist Services to sidebar navigation

## Sprint 4 — EVIP Maturity Improvements (Mar 2026)
- [x] Migrate ventures, milestones, risks, venture_scores to database
- [x] Migrate customer interviews to database
- [x] Migrate financial snapshots to database
- [x] Build Opportunity Pipeline module (intake, scoring, stage advancement)
- [x] Stage gate enforcement — VRL advancement requires evidence
- [x] Experiment log per venture (TRL evidence tracking)
- [x] AI interview summarisation using built-in LLM
- [x] Founder profiles table and Founder Capability Score
- [x] Update all pages to read from database (replace static data.ts)
## Sprint 5 — UX/UI Redesign (Mar 2026) ✓OS Design Blueprint)
- [x] Update global design tokens (typography 34/28/20/16/12px, 8px grid, border radius, colour system)
- [x] Redesign sidebar with grouped navigation sections
- [x] Redesign Portfolio Overview (lifecycle indicator, funding status, Apple-style KPI tiles)
- [x] Apply design system to VRL, TRL, Investment Readiness, Venture Detail pages

## Sprint 6 — VOS Design System Full Rollout (Mar 2026) ✓
- [x] Apply VOS to Financial Analytics page
- [x] Apply VOS to Risk Management page
- [x] Apply VOS to Brand PR & Newsletter page
- [x] Apply VOS to Specialist Services page
- [x] Apply VOS to Opportunity Pipeline page
- [x] Apply VOS to Experiment Log page
- [x] Apply VOS to Founder Profiles page
- [x] Apply VOS to Interview Tracker page
- [x] Apply VOS to Legal Contracts page
- [x] Apply VOS to EcoBlend Playbook page
- [x] Apply VOS to Venture Detail page
- [x] Apply VOS to Onboarding page

## Sprint 7 — Brand Logos & Academic Research (Mar 2026)
- [ ] Upload BEBUS, TONE, EcoBlend, REAL, PIPE logos to CDN
- [ ] Integrate brand logos into venture cards (Portfolio Overview)
- [ ] Integrate brand logos into hub-spoke diagram nodes
- [ ] Integrate brand logos into Venture Detail header
- [x] Build Academic Research & Evidence module (citations, papers, researcher profiles, evidence mapping)
- [x] Add Academic Research to sidebar navigation
- [x] Database-backed Academic Research: research papers, fellow researchers, university partnerships, evidence claims
- [x] Full CRUD with add/delete dialogs for all four entities
- [x] Evidence map overview showing claim coverage per venture
- [x] Vitest coverage for all 8 academic procedures (94 tests total passing)

## Sprint 8 — Brand Logo Integration (Mar 2026)
- [x] Upload BEBUS, TONE, EcoBlend, REAL, PIPE logos to CDN (new high-res versions)
- [x] Integrate brand logos into Portfolio Overview venture cards (with logoBg for dark-bg logos)
- [x] Integrate brand logos into hub-spoke diagram nodes (SVG image element with clip-path)
- [x] Integrate brand logos into Venture Detail page header (16×16 rounded-2xl container)

## Sprint 9 — Market Intelligence & AI Research (Mar 2026)
- [x] Extend DB schema: marketAnalysis, competitors, opportunityReports tables (migration 0004 applied)
- [x] tRPC procedures: market analysis CRUD + AI generate, competitor CRUD + AI identify, opportunity report generate/list/delete
- [x] Market Intelligence page (/market-intelligence) with TAM/SAM/SOM funnel, competitor cards, AI generation buttons
- [x] Opportunity Pipeline: problem statement field with AI research prompt, AI Research button per card
- [x] AI Research Report: 10-section commercial report (market size, competitive landscape, ESG, TRL, business case, risks)
- [x] Report viewer dialog with markdown rendering, recommendation badge, confidence score
- [x] Vitest tests for market, competitor, and report procedures (106 tests total passing)

## Sprint 10 — FMEA Engineering Risk & Mitigation Module (Mar 2026)
- [x] Extend DB schema: engineering_risks and mitigation_actions tables (migration applied to live DB)
- [x] tRPC procedures: CRUD for risks and mitigations, auto-calculated RPN (S×O×D), TRL blocker query
- [x] FMEA Risk Register page: full data table with S/O/D/RPN columns, conditional colour formatting (Red >100, Yellow 50-100, Green <50)
- [x] Expandable rows: view/add/update mitigation actions per risk with revised RPN display and status dropdown
- [x] TRL Blocker integration: per-venture blocker panel in TRL Analytics showing unmitigated critical risks
- [x] Vitest tests for all FMEA procedures (15 tests, 121 total passing)

## Sprint 11 — Academic Research Validation Module (Mar 2026)
- [x] Extend DB schema: academic_papers and task_paper_links tables (migration 0006 applied)
- [x] Semantic Scholar API integration service (keyword extraction via stop-word removal + live paper search)
- [x] tRPC procedures: searchPapers, attachPaper, getTaskPapers, detachPaper, getValidatedTasks
- [x] Scientific Validation UI panel in Experiment Log task cards (Find Research, Attach, attached papers list, detach)
- [x] Scientifically Validated badge on TRL 1-2 tasks with citationCount > 10 paper attached
- [x] Scientific Validation Summary panel in TRL Analytics (per-venture validated task counts)
- [x] Vitest tests: 16 new tests for keyword extraction, schema validation, and badge logic (137 total passing)

## Sprint 12 — Venture Risk Management Module Upgrade (Mar 2026)
- [x] Extend DB schema: venture_risks table (6 categories, L×I scoring, VRL stage linkage, mitigation, owner, status, review date) — migration 0007
- [x] tRPC procedures: CRUD for venture risks, risk score auto-calc (L×I), VRL blocker check, adjusted VRI computation, portfolio summary
- [x] Rebuilt Risk Management page: 6-category register, L/I/Score columns, conditional colour formatting, edit/delete dialogs
- [x] Risk Heatmap: 5×5 Likelihood × Impact grid with colour-coded cells and risk counts
- [x] Risk by Category bar chart: distribution across 6 categories with venture-specific colour coding
- [x] VRL Stage Blocker panel: Critical open risks blocking VRL stage advancement shown as banner
- [x] Adjusted VRI: Base VRI minus risk penalty (Low=0%, Med=−5%, High=−10%, Critical=−20%) with formula breakdown
- [x] FMEA tab: integrated view of FMEA engineering failure modes alongside venture risks
- [x] 137 tests passing (no regressions)

## Sprint 13 — Business Readiness Level (BRL) — 100 Tasks Method (Mar 2026)
- [x] Designed 100 BRL tasks across 4 VRL stages (Tasks 1-25 Stage 1 Fundamentals, 26-50 Stage 2 Fundamentals, 51-75 Stage 3 Kick-off, 76-100 Stage 4 Execution Platform)
- [x] Extend DB schema: brl_tasks and brl_task_completions tables (migration 0008 applied)
- [x] Seeded all 100 BRL tasks into the live database via seed-brl.mjs
- [x] tRPC procedures: listTasks, toggleCompletion, getBrlScore, portfolioSummary
- [x] BRL Analytics page (/brl): 100-task register, stage grouping, Execution Platform badges, per-venture progress bars, BRL score
- [x] Portfolio Overview: Avg BRL Score KPI tile added (5-tile triple-matrix TRL/BRL/VRL layout)
- [x] Venture Detail: BRL triple-matrix summary bar with progress bar and link to BRL Analytics
- [x] Brand Readiness: BRL link panel explaining scope boundaries (Fundamentals/Kick-off/Execution Platform) with handoff indicator
- [x] Execution Platform handoff: Tasks 76-100 marked with purple Execution Platform badge and “coming soon” indicator
- [x] Vitest tests: 15 BRL tests (152 total passing)

## Sprint 14 — VRL Mathematical Framework Update (Mar 2026)
- [x] Audit current VRL data model (4-stage) and upgrade to 9-level scale per specification
- [x] Update VRL stage descriptions in data.ts and schema to match the 9-level framework
- [x] Add confidence score and weighting (alpha/beta) fields to ventures table; push migration
- [x] Build VRL Scoring Engine: tRPC procedure implementing VRL = (α×TRL + β×BRL) × (1 − Risk Index) × Confidence
- [x] Build VRL Scoring Engine page: live formula calculator with inputs, computed score, stage interpretation
- [x] Update VRL Analytics page with 9-level stage descriptions and computed VRL score display
- [x] Update Portfolio Overview and Venture Detail to show computed VRL score alongside TRL/BRL
- [ ] Upload VRL architecture infographic to CDN and embed in VRL Scoring Engine page
- [x] Vitest tests for VRL scoring formula

## Sprint 15 — Literature Audit Database Implementation (Mar 2026)

### Tier 1 — Venture-Level Strategic Fields
- [x] Add strategicClassification to ventures (Sustaining / Disruptive-NewMarket / Disruptive-LowEnd) — Christensen Rec. 5
- [x] Add engineOfGrowth to ventures (Sticky / Viral / Paid) — Ries Rec. 7
- [x] Add productMarketFitSignal to ventures (Not Yet / Emerging / Achieved) — Ries Rec. 8
- [x] Add innovation accounting cache fields to ventures (experimentPassRate, learningVelocity, interviewInsightRate) — Ries Rec. 3
- [x] Add engine-of-growth metrics to financial_snapshots (churnRate, retentionRate, viralCoefficient, referralRate, CAC, LTV, LTV:CAC, baselineRevenueTarget, isBaseline) — Ries Rec. 4

### Tier 2 — New Tables
- [x] Create pivot_decisions table (10 Ries pivot types, hypothesis, evidence counts, VRL snapshot) — Ries Rec. 1
- [x] Create pivot_trigger_config table (per-venture alert thresholds for pass rate, risk index, VRL stagnation) — Ries Rec. 2
- [x] Create pivot_runway_inputs table (cash, burn, pivot cost, computed runway months and pivots remaining) — Ries Rec. 10
- [x] Create value_networks table (customer segment, cost structure, channel, competitive alternatives, autonomous team flag) — Christensen Rec. 6
- [x] Create onboarding_hypotheses table (hypothesis + validation criterion per wizard step, outcome tracking) — Ries Rec. 13

### Tier 3 — New Tables
- [x] Create opportunity_disruption_scores table (5-dimension inverted scoring: market smallness, non-consumer, simplicity, low-margin, incumbent-ignore) — Christensen Rec. 11
- [x] Create autonomy_health_checks table (4-dimension: budget, decision, metrics, value-network; Critical/Low/Moderate/High classification) — Christensen Rec. 14
- [x] Create technology_trajectories table (TRL growth rate, quarters-to-mainstream/low-end entry, market entry window alert) — Christensen Rec. 15
- [x] Create cohort_snapshots table (founding cohort, VRL/TRL/pass-rate per quarter elapsed) — Ries Rec. 4

### Backend Procedures
- [x] tRPC pivots router (list, add, delete, getTriggerConfig, upsertTriggerConfig, getRunwayInputs, upsertRunwayInputs)
- [x] tRPC valueNetworks router (get, upsert with auto-autonomy-recommendation)
- [x] tRPC leanMetrics router (updateClassification, recomputeMetrics, portfolioSummary)
- [x] tRPC onboardingHypotheses router (list, upsert, delete)
- [x] tRPC disruptionScoring router (get, upsert with auto-score, listAll)
- [x] tRPC autonomyChecks router (list, add with auto-level-classification)
- [x] tRPC technologyTrajectory router (list, addSnapshot with computed entry windows)
- [x] tRPC cohortAnalysis router (list, addSnapshot)
- [x] Push migration 0010_chief_medusa.sql — 35 tables, all changes applied successfully
- [x] TypeScript check passes — 0 errors
- [x] 31 new vitest tests for all new scoring algorithms (226 total tests passing)

## Sprint 16 — Literature Audit Feature UIs (Mar 2026)

- [x] Pivot Decision Log UI: "Pivot or Persevere" tab on Venture Detail with 10 Ries pivot types, experiment pass rate, VRL snapshot
- [x] Innovation Accounting KPIs: replace Milestones tile with Experiment Pass Rate tile on Portfolio Overview
- [x] Engine of Growth badges on each venture card (Sticky / Viral / Paid)
- [x] Disruption Radar: 5-dimension radar chart on Opportunity Pipeline cards
- [x] Disruption score CRUD: score each dimension (1–10) per opportunity card
- [x] Vitest tests for new procedures (252 total passing)

## Sprint 17 — Impact Governance Engine (IRL) (Mar 2026)

- [x] Audit existing schema for IRL-related tables and fields
- [x] Add 6 new IRL tables: esg_scores, lca_stages, product_carbon_footprints, csr_metrics, certifications, irl_scores (migration 0011)
- [x] Add IRL tRPC router: getEsg, upsertEsg, getLca, upsertLcaStage, getPcf, upsertPcf, getCsr, upsertCsr, getCertifications, upsertCertification, deleteCertification, getIrlScore, computeIrl, portfolioIrlSummary
- [x] Build Impact Governance Engine page (ImpactGovernance.tsx) with 5 tabbed modules: ESG Analytics, LCA, PCF, CSR, Certifications
- [x] IRL Score gauge with 5-component breakdown and Total Venture Intelligence Score (VRL + IRL)
- [x] Add Avg IRL Score KPI tile to Portfolio Overview (6-tile layout)
- [x] Add Impact Governance Engine to Sidebar (Governance group) and App.tsx routes
- [x] Vitest tests for IRL scoring engine (277 total passing, 0 TypeScript errors)

## Sprint 18 — Knowledge Base Ingestion Module (Mar 2026)

- [ ] Add knowledge_documents and knowledge_chunks tables to schema (migration 0012)
- [ ] Build server-side ingestion pipeline: PDF text extraction, chunking, BM25 keyword indexing
- [ ] Add knowledgeBase tRPC router: uploadDocument, listDocuments, deleteDocument, searchKnowledge, getDocumentChunks, getStats
- [ ] Build Knowledge Base admin page with document upload, domain tagging, ingestion status, and search preview
- [ ] Wire knowledge retrieval into market intelligence AI generate procedure
- [ ] Wire knowledge retrieval into interview summariser procedure
- [ ] Wire knowledge retrieval into opportunity report generate procedure
- [ ] Add Knowledge Base to sidebar navigation (Research group)
- [ ] Vitest tests for knowledge base procedures

## Sprint 18 — Knowledge Base Ingestion Module / RAG Engine (Mar 2026)

- [x] Add knowledge_documents and knowledge_chunks tables to schema, push migration 0012_steady_wolfpack.sql (43 tables total)
- [x] Build server-side ingestion pipeline: PDF text extraction (pdf-parse), 500-word chunking with 50-word overlap, BM25 keyword search helper (server/knowledgeBase.ts)
- [x] Add tRPC knowledgeBase router: createDocument, uploadAndIngest, listDocuments, deleteDocument, search, getChunks, getStats
- [x] Build Knowledge Base admin page (/knowledge): document upload (PDF/transcript/text/URL), domain tagging (VRL/TRL/IRL/Market/ESG/Legal/Finance/Strategy/General), ingestion status, chunk preview, live search panel
- [x] Wire knowledge base retrieval into interview summariser (top-4 relevant chunks injected as context)
- [x] Wire knowledge base retrieval into market analysis AI generator (top-4 chunks by sector query)
- [x] Wire knowledge base retrieval into opportunity report generator (parallel search across strategy/market/ESG domains, deduplicated, top-6 chunks with author/year citations)
- [x] Add Knowledge Base to sidebar under new "Intelligence" group (Database icon, /knowledge route)
- [x] Vitest tests: chunking, BM25 scoring, tokenisation, domain filtering (297 total passing, 0 TypeScript errors)

## Sprint 20 — People Intelligence Module

- [ ] Add talent_profiles table (name, role, location, availability, expertise, stage experience, functional capabilities, network strength, behavioural attributes)
- [ ] Add venture_role_requirements table (required skills, experience level, stage, functional area, priority)
- [ ] Add people_venture_fit table (PVF score cache: skills match, industry match, stage match, network value, availability fit)
- [ ] Add team_compositions table (recommended team structure per venture)
- [ ] Add team_gap_analysis table (missing capabilities per venture)
- [ ] Add talent_venture_assignments table (assigned people to ventures with role)
- [ ] Push migration 0013
- [ ] Add tRPC procedures: talent CRUD, computePVF, getTeamComposition, getTeamGaps, getRoleRankings, getFounderSuitability
- [ ] Build People Intelligence dashboard page (6 components: talent pool, top rankings, role matrix, team composition, gap heatmap, founder scorecard)
- [ ] Add People Intelligence to sidebar under Intelligence section
- [ ] Wire route in App.tsx
- [ ] Vitest tests for PVF scoring engine

## Sprint 21 — Product Opportunity Intelligence (POI) Module (Mar 2026)

- [x] Add 9 POI tables to schema: product_categories, product_opportunities, product_baselines, cost_assessments, performance_assessments, quality_assessments, sustainability_assessments, product_opportunity_scores, opportunity_reviews (migration 0014 applied)
- [x] Build server/poiDb.ts: all CRUD helpers plus auto-recompute POS = (Cost + Performance + Quality + Sustainability) / 4 on each assessment save
- [x] Add tRPC poi router to routers.ts: listCategories, addCategory, listOpportunities, getOpportunity, addOpportunity, updateOpportunity, deleteOpportunity, getBaseline, upsertBaseline, getCostAssessment, upsertCostAssessment, getPerformanceAssessment, upsertPerformanceAssessment, getQualityAssessment, upsertQualityAssessment, getSustainabilityAssessment, upsertSustainabilityAssessment, getPosScore, getReviews, addReview
- [x] Build ProductOpportunityIntelligence.tsx: pipeline list with KPI tiles, POS gauges, dimension score bars, status filter, search
- [x] Opportunity detail view: Overview tab (description, status management, POS breakdown), Assess tab (4-dimension scoring with 1-5 sub-scores), Review tab (panel decision workflow)
- [x] Add "Product Opportunity" to Sidebar Intelligence group (Package icon, /poi route)
- [x] Register /poi route in App.tsx
- [x] Vitest tests: 14 tests covering POS formula, classification boundaries, dimension scoring, pipeline scenarios (338 total passing, 0 TypeScript errors)

## Sprint 22 — Project Management Module (Mar 2026)

- [x] Build server/pmDb.ts: CRUD helpers for programs, phases, workstreams, milestones, tasks, resources, dependencies, documents, execution risks
- [x] Add tRPC pm router to routers.ts: full CRUD + summary procedures
- [x] Build VentureProjectManagement.tsx: program/phase/workstream/task hierarchy with Kanban board, Gantt timeline, milestone tracker, resource allocation, execution risk register, document repository
- [x] Add "Project Management" to Sidebar (Intelligence group) with ClipboardList icon, /project-management route
- [x] Register /project-management route in App.tsx
- [x] Vitest tests for PM scoring and status logic (30 new tests, 368 total passing)

## Sprint 23 — Command Centre Dashboard (Mar 2026)

- [x] Build server/commandCentreDb.ts: live aggregation helpers (portfolio summary, VRL distribution, POI funnel, PM health, financial performance, ESG/impact)
- [x] Add tRPC commandCentre router: getLiveMetrics, getVrlDistribution, getOpportunityFunnel, getPmHealth, getFinancialPerformance, getEsgMetrics, getEcosystemNodes, upsertEcosystemNode
- [x] Build CommandCentre.tsx: full dashboard with 7 widget panels
- [x] Add "Command Centre" to Sidebar (Dashboard group, top position) with Zap icon, /command-centre route
- [x] Register /command-centre route in App.tsx
- [x] Vitest tests for Command Centre aggregation logic (45 tests, 413 total passing)

## Sprint 24 — Command Centre Auto-Refresh (Mar 2026)

- [x] Add 60-second refetchInterval to all 8 Command Centre tRPC queries
- [x] Add live "Last updated" timestamp indicator to Command Centre header
- [x] Add animated pulse indicator showing auto-refresh is active

## Sprint 25 — Command Centre Live Data Seed (Mar 2026)

- [x] Seed financial_snapshots: 6 months of revenue, burn, investment, runway per venture (36 rows)
- [x] Seed esg_metrics: environment, social, governance scores per venture (6 rows)
- [x] Seed experiments: 14 pass/fail/inconclusive results across all ventures
- [x] Seed product_opportunities + assessments: 8 opportunities, 4 scored with full CPQS assessments
- [x] Seed venture_programs + phases + tasks: 4 programs, 10 phases, 4 workstreams, 18 tasks
- [x] Seed irl_scores: 6 venture IRL profiles (5.5–7.14/10 range)
- [x] Verify all Command Centre widgets show real numbers — all 10 seeded tables confirmed

## Sprint 26 — POI → VRL Conversion Flow (Mar 2026)

- [x] Add `poi.approveForVrl` tRPC procedure: create venture from opportunity data, update review status, link convertedToVentureId
- [x] Pre-populate Founder Onboarding wizard with opportunity name, sector, target market, and description (via ?ventureId= query param)
- [x] Wire "Approve for VRL" button in POI Review tab to trigger conversion mutation + redirect to /onboarding?ventureId=
- [x] Show success toast with venture name and redirect after 800ms
- [x] Show 'already converted' banner when convertedToVentureId is set; button hidden when status is Approved for VRL or Rejected
- [x] Vitest tests for approveForVrl procedure (poiApprove.test.ts — 8 tests, 421 total passing)

## Sprint 27 — Command Centre Revenue Sparklines (Mar 2026)

- [x] Add getVentureRevenueSparklines() helper in commandCentreDb.ts: last 6 months of revenue per venture
- [x] Add commandCentre.getRevenueSparklines tRPC procedure
- [x] Add SVG sparkline component to CommandCentre.tsx (inline, no external chart library)
- [x] Render sparkline + trend arrow (up/down/flat) on each venture's financial KPI tile
- [x] Colour-code sparkline: venture brand colour with gradient fill; trend icon (TrendingUp/TrendingDown/—)
- [x] Vitest tests for sparkline data helper (sparklines.test.ts — 13 tests, 434 total passing)

## Sprint 28 — Venture Renames (Mar 2026)

- [x] Rename "EcoBlend" (materials formulation) → "EcoComp" in database
- [x] Rename "EcoBlend R&D" → "EcoRace" in database
- [x] Update all hardcoded name references in frontend source files
- [x] Verify all pages display updated names correctly

## Sprint 29 — Founder Matching Engine & Spin-Off OS (Mar 2026)
- [x] Add DB schema: founder_match_scores, spinoff_configurations, spinoff_execution_plans tables
- [x] Build matchingDb.ts: compute founder↔opportunity compatibility scores (sector, capability, availability, PVF)
- [x] Build spinoffDb.ts: aggregate all inputs (founder, POI, talent gaps, resources) into a spin-off configuration
- [x] Add tRPC matching router: getFounderMatches, getOpportunityMatches, createSpinoffConfig, generateExecutionPlan (LLM)
- [x] Build FounderMatching.tsx page: match cards with compatibility scores, co-founder pairing, problem-statement ranking
- [x] Build SpinoffOS.tsx page: input mapping wizard (5 steps), venture configuration panel, AI-generated execution report
- [x] Wire Founder Onboarding completion → auto-trigger matching engine → redirect to match results
- [x] Add "Matching Engine" and "Spin-Off OS" to Sidebar Intelligence group
- [x] Vitest tests for matching algorithm and spinoff configuration logic

## Sprint 30 — Matching Engine Enhancements (Mar 2026)
- [x] Auto-trigger computeAndSaveMatchScores after founder onboarding save (background scoring)
- [x] Show "Matches computed" toast and badge count on redirect to Matching Engine
- [x] Spin-Off status workflow: Draft → Under Review → Approved → Launched transitions
- [x] Owner notification sent at each spin-off stage transition
- [x] Status action buttons in Spin-Off OS detail view (advance/reject with reason)
- [x] Co-founder compatibility matrix: select two founders, side-by-side radar chart across 6 dimensions
- [x] Compatibility verdict badge (Strong / Moderate / Weak pairing) with recommended roles
- [x] Add Co-Founder Matrix to Sidebar Intelligence group

## Sprint 31 — Matching & Spin-Off Polish (Mar 2026)
- [x] Add spinoff_status_history DB table (id, spinoffConfigId, fromStatus, toStatus, reviewedBy, reason, createdAt)
- [x] Add tRPC procedure: matching.getSpinoffStatusHistory
- [x] Build SpinoffStatusTimeline component and embed in Spin-Off OS detail view
- [x] Add tRPC procedure: matching.batchComputeAllMatches (re-score all talent profiles vs all open opportunities)
- [x] Add "Run Matching for All Founders" button in Matching Engine header with progress toast
- [x] Add tRPC procedure: matching.getCoFounderMatrixPdf (returns HTML report via S3)
- [x] Add "Download Report" button on Co-Founder Compatibility Matrix page
- [x] Vitest tests passing (449 tests, 0 failures)

## Sprint 31 — Matching & Spin-Off Polish (Mar 2026)
- [x] Add spinoff_status_history DB table (id, spinoffConfigId, fromStatus, toStatus, reviewedBy, reason, createdAt)
- [x] Add tRPC procedure: matching.getSpinoffStatusHistory
- [x] Build SpinoffStatusTimeline component and embed in Spin-Off OS detail view
- [x] Add tRPC procedure: matching.batchComputeAllMatches (re-score all talent profiles vs all open opportunities)
- [x] Add "Run Matching for All Founders" button in Matching Engine header with progress toast
- [x] Add tRPC procedure: matching.getCoFounderMatrixPdf (returns HTML report via S3)
- [x] Add "Download Report" button on Co-Founder Compatibility Matrix page
- [x] Vitest tests passing (449 tests, 0 failures)

## Sprint 32 — Pipeline Intelligence (Mar 2026)
- [x] Wire advanceSpinoffStatus "Launched" → auto-create venture and show "View Venture" CTA in Spin-Off OS
- [x] Add stale badge (>30 days) to match cards in FounderMatching.tsx (uses existing computedAt field)
- [x] Add "Pipeline Map" tab to OpportunityPipeline.tsx — Kanban board with 5 columns: Identified → Matched → Spin-Off Configured → Approved → Launched
- [x] Pipeline progress bar showing distribution across all 5 stages
- [x] Card click navigates to relevant module (venture/spinoff/matching/poi)
- [x] getPipelineView tRPC procedure: enriches opportunities with match count and spinoff config status
- [x] 449 tests passing, 0 TypeScript errors

## Sprint 33 — Legal Module Architecture Update (Mar 2026)
- [x] Read current LegalContracts.tsx and legal-related DB schema/procedures
- [x] Add contract_layers, contract_type_registry, and legal_risk_items tables to schema (migration 0017)
- [x] Seed 4 layers, 20 contract types, and Legal Risk Map data via seed-legal.mjs
- [x] Add tRPC procedures: contracts.getLayers, contracts.getContractRegistry, contracts.getLegalRiskMap, contracts.updateContractStatus, contracts.updateRiskStatus
- [x] Rebuild LegalContracts.tsx: three-tab layout (Contracts | Architecture Map | Legal Risk Map)
- [x] Architecture Map: four-layer accordion with 20 contract types, risk levels, status badges, inline edit
- [x] Legal Risk Map: risk zone callout, mitigation strategies, linked contracts, inline status/owner edit
- [x] 449 tests passing, 0 TypeScript errors

## Sprint 34 — Legal Module Enhancements (Mar 2026)
- [ ] Add expiryDate and architectureLayer fields to legal_contracts table (db:push)
- [ ] Add tRPC procedures: contracts.getExpiring (within 60 days), contracts.renewContract (set status to Under Review)
- [ ] Add "Expiring Soon" banner to Contracts tab listing contracts expiring within 60 days with Renew CTA
- [ ] Add architectureLayer tag selector to contract add/edit dialog
- [ ] Architecture Map: clicking a layer filters the Contracts tab to show only contracts in that layer
- [ ] Add Risk Owners summary panel at top of Legal Risk Map tab (owner name, assigned count, open/mitigated split)
- [ ] Vitest tests for expiry alert and layer filter procedures

## Sprint 34 — Legal Module Enhancements (Mar 2026)
- [x] Add expiryDate column to contractTypeRegistry table (migration 0018)
- [x] Add tRPC procedures: contracts.getExpiring (days param), contracts.renewContract, contracts.updateExpiryDate
- [x] Add "Expiring Soon" banner to Contracts tab (contracts expiring within 60 days, with Renew button)
- [x] Add "Filter Contracts" button to each Architecture Map layer header (navigates to Contracts tab with layer filter active)
- [x] Add layer filter active banner in Contracts tab with Clear button
- [x] Add Risk Owner Assignments summary panel to Legal Risk Map tab (grouped by owner, open/monitoring/mitigated counts, progress bar)
- [x] 449 tests passing, 0 TypeScript errors

## Sprint 35 — Legal Module Document & Escalation Features (Mar 2026)
- [x] Add documentUrl and documentKey columns to contractTypeRegistry table (migration 0019)
- [x] Add tRPC procedures: uploadRegistryDocument, removeRegistryDocument (S3 upload/delete, saves url/key to DB)
- [x] Add file upload button and document viewer link to each Architecture Map contract row
- [x] Add inline date picker to Architecture Map contract type rows (updateExpiryDate procedure)
- [x] Add legalRiskEscalations table: id, riskItemId, escalatedBy, reason, status, createdAt (migration 0019)
- [x] Add tRPC procedures: escalateRisk (inserts escalation row, sends owner notification), getEscalations, getAllEscalations
- [x] Add Escalate button to High/Medium Open risk items in Legal Risk Map tab (with note input)
- [x] Show escalation history (escalated by, reason, date) on each risk item card (collapsible)
- [x] Escalation count badge on risk items with prior escalations
- [x] 449 tests passing, 0 TypeScript errors

## Sprint 36 — Dynamic Equity Engine (People & ESOP Upgrade)

- [ ] Add equity_allocations table
- [ ] Add contribution_logs table
- [ ] Add equity_milestones table
- [ ] Add equity_rules table
- [ ] Add venture_cap_table_snapshots table
- [ ] Run pnpm db:push migration
- [ ] Backend equity engine procedures
- [ ] Rebuild PeopleEsop.tsx with 5-tab UI
- [ ] Write vitest tests (15+)
- [ ] Save checkpoint

## Sprint 36 — Dynamic Equity Engine

- [x] DB schema: equityAllocations, equityRules, contributionLogs, equityMilestones, ventureCapTableSnapshots
- [x] Migration 0020 applied to database
- [x] Backend: equity router with 12 procedures
- [x] Core formula: Score = (0.4xVRL) + (0.3xContribution) + (0.2xCapital) + (0.1xPerformance)
- [x] UI: PeopleEsop.tsx rebuilt with 5-tab Dynamic Equity Engine dashboard
- [x] UI Tab 1 — Overview: KPI cards, equity donut, leaderboard, portfolio summary, formula guide
- [x] UI Tab 2 — Equity Register: member cards with vesting bars, score gauges, quick-edit
- [x] UI Tab 3 — Contributions: log table + dialog
- [x] UI Tab 4 — Cap Table: current table + snapshot history
- [x] UI Tab 5 — Legal Conversion: milestones + trigger conversion + legal info panel
- [x] Vitest: 24 equity engine tests (473 total, 23 files, all passing)
- [x] TypeScript: 0 errors

## Sprint 37 — IP Intelligence Upgrade

- [ ] DB schema: ipAssets (unified registry: Patent/Trademark/Copyright/DesignRight/TradeSec)
- [ ] DB schema: ipLicenses table
- [ ] DB schema: patentProjects (AI workspace)
- [ ] DB schema: patentHypotheses
- [ ] Migration applied
- [ ] Backend: ip router — listAssets, upsertAsset, deleteAsset
- [ ] Backend: ip router — listLicenses, upsertLicense, deleteLicense
- [ ] Backend: ip router — listPatentProjects, createPatentProject, updatePatentProject
- [ ] Backend: ip router — hypothesize (Patent Strategist LLM)
- [ ] Backend: ip router — draftSection (Patent Attorney LLM, per-section)
- [ ] Backend: ip router — getPortfolioSummary
- [ ] UI: IpManagement.tsx rebuilt with 5 tabs
- [ ] UI Tab 1 — Overview: KPIs, IP type breakdown, pipeline
- [ ] UI Tab 2 — IP Registry: all 5 asset types, filterable, add/edit/delete
- [ ] UI Tab 3 — Patent AI Workspace: Ingestion → Hypothesis Board → Patent Editor
- [ ] UI Tab 4 — Licensing: license table with CRUD
- [ ] UI Tab 5 — Governance: principles + legal disclaimer
- [ ] Vitest: IP engine tests
- [ ] All tests passing, 0 TypeScript errors

## Sprint 37 — IP Intelligence Upgrade
- [x] Add 4 new IP DB tables (ipAssets, ipLicenses, patentProjects, patentHypotheses)
- [x] Run migration 0021
- [x] Build ip tRPC router (listAssets, upsertAsset, deleteAsset, listLicenses, upsertLicense, deleteLicense, listPatentProjects, createPatentProject, updatePatentProject, deletePatentProject, listHypotheses, toggleHypothesis, hypothesize, draftSection, getPortfolioSummary)
- [x] AI Patent Strategist (hypothesize procedure using LLM JSON schema)
- [x] AI Patent Attorney (draftSection procedure, section-by-section)
- [x] Rebuild IpManagement.tsx — 5 tabs: Overview, IP Registry, Patent AI Workspace, Licensing, Governance
- [x] IP Registry covers all 5 types: Patent, Trademark, Copyright, DesignRight, TradeSecret
- [x] Patent AI Workspace: 3-phase workflow (Ingestion → Hypothesis Board → Patent Editor)
- [x] Governance tab: UK/EU legal framework reference for all 5 IP types
- [x] Write ip.engine.test.ts (28 tests)
- [x] All 501 tests passing

## Sprint 38 — IP Module Upgrades
- [x] Renewal alert system: 90-day expiry KPI card + alert panel in Overview tab
- [x] notifyRenewalAlerts procedure: owner notification with urgency tiers (Critical/High/Medium)
- [x] getRenewalAlerts backend procedure: filters assets due within 90 days
- [x] IP–Venture linking: listAssetsByVenture procedure with licenseCount join
- [x] VentureIpAssets component in VentureDetail.tsx: shows IP assets per venture
- [x] exportPatentDraft backend procedure: assembles full Markdown draft
- [x] Export Draft button in Patent Editor header (visible when sections > 0)
- [x] 15 new vitest tests for all 3 upgrade features (516 total, all passing)

## Sprint 39 — LCSSA Governance Upgrade
- [x] Add 5 LCSSA DB tables (lcssaEnvironmental, lcssaSocial, lcssaLcc, lcssaOversight, lcssaDecisions)
- [x] Build lcssa tRPC router (14 procedures: get/upsert for each pillar, addDecision, updateDecisionStatus, deleteDecision, listDecisions, getLcssaSummary)
- [x] Add LCSSA section to ImpactGovernance.tsx (6 sub-tabs: Overview, Environmental LCA, Social LCA, LCC, Oversight, Decision Log)
- [x] Environmental LCA: Carbon Footprint (Scope 1/2/3), Resource Use, Pollution & Waste, Ecosystem Impact
- [x] Social LCA: Labor Conditions, Human Rights, Community Impact, Health & Safety
- [x] Life Cycle Costing: Production, Logistics, Maintenance, End-of-Life with live cost bar
- [x] LCSA Oversight: Policy & Standards (ISO 14001/26000, GRI, SDGs), Data & Reporting
- [x] Sustainable Decision Making: decision log with type, LCA dimension, triple-impact assessment, status workflow
- [x] LCSSA Overview: integrated score banner, 4-pillar KPI cards, formula guide
- [x] Fix null vs undefined TypeScript errors in all 4 LCSSA upsert components
- [x] Write 28 vitest tests for LCSSA scoring engine (lcssa.test.ts)

## Sprint 40 — LCSSA Enhancements
- [x] Add lcssaSnapshot DB table (migration 0023)
- [x] Add sdgHeatmap JSON field to lcssaOversight table
- [x] Backend: takeSnapshot procedure (compute & store LCSSA snapshot)
- [x] Backend: listSnapshots procedure (trend data)
- [x] Backend: deleteSnapshot procedure
- [x] Backend: updateSdgHeatmap procedure (17-goal toggle, auto-save)
- [x] Backend: exportReport procedure (full Markdown LCSSA report)
- [x] Frontend: LCSSA trend chart in Overview sub-tab (LineChart with 5 lines)
- [x] Frontend: Snapshot button in score banner
- [x] Frontend: Export Report button (downloads .md file)
- [x] Frontend: 17-SDG heatmap grid in Oversight sub-tab (colour-coded, auto-save)
- [x] Vitest: 22 new tests for SDG heatmap, snapshot scoring, report export
- [x] All 563 tests passing, 0 TypeScript errors

## Sprint 41 — Dual Risk Venture Creation System
- [x] DB tables: businessRiskInputs, productRiskInputs, dualRiskDecisions (migration 0024)
- [x] dualRisk tRPC router: getBusinessRisk, upsertBusinessRisk, getProductRisk, upsertProductRisk, computeVrl, listDecisions, updateFeedback, deleteDecision, getDualRiskSummary
- [x] DualRiskEngine.tsx: 5-tab UI (Overview, Business Risk, Product Risk, VRL Engine, Decision Log)
- [x] Route /dual-risk registered in App.tsx
- [x] Sidebar entry added to Analytics section
- [x] Vitest tests: 25 tests covering VRL formula, BRI/PRI computation, decision thresholds, ESG bonus, execution routing, feedback loop
- [x] 588 tests passing, 0 TypeScript errors

## Sprint 42 — Supply Chain & Manufacturing Intelligence Module
- [ ] DB tables: scProducts, scPrototypes, scManufacturing, scSuppliers, scProductionOrders (migration 0025)
- [ ] supplyChain tRPC router: full CRUD + manufacturing readiness score + ESG integration procedures
- [ ] SupplyChain.tsx: 6-tab UI (Overview/Control Tower, R&D Prototyping, Manufacturing Intelligence, Global Production, Supply Chain Risk, ESG Integration)
- [ ] Route /supply-chain registered in App.tsx
- [ ] Sidebar entry added to Operations section
- [ ] Vitest tests for supply chain engine
- [ ] All tests passing, 0 TypeScript errors

## Sprint 42 — Supply Chain & Manufacturing Intelligence
- [x] 5 new DB tables: scProducts, scPrototypes, scManufacturing, scSuppliers, scProductionOrders (migration 0025)
- [x] supplyChain tRPC router: 17 procedures (CRUD + manufacturing readiness score + ESG integration)
- [x] SupplyChain.tsx: 6-tab UI (Overview/Control Tower, R&D Prototyping, Manufacturing Intelligence, Global Production, Supply Chain Risk, ESG Integration)
- [x] Route registered: /supply-chain
- [x] Sidebar entry added: Analytics → Supply Chain (Truck icon)
- [x] Vitest tests: supply.chain.test.ts (28 tests)
- [x] All 616 tests passing, 0 TypeScript errors

## Sprint 42b — BOM Cost Breakdown Chart
- [x] Added CartesianGrid and ReferenceLine to recharts imports in SupplyChain.tsx
- [x] BOM Cost Breakdown stacked bar chart added to Manufacturing Intelligence tab
- [x] 5 volume scenarios: MOQ, 2x, 5x, 10x, 20x
- [x] 4 cost stacks: Material (BOM-derived or 60%), Labour (25%), Tooling Amortisation (toolingCost/vol), Overhead (15%)
- [x] Red dashed ReferenceLine for target unit cost
- [x] Summary table below chart with vs-target delta column
- [x] 616 tests passing, 0 TypeScript errors

## Sprint 43 — Manufacturing Intelligence Enhancements
- [ ] Replace BOM JSON textarea with structured row editor (add/remove rows with fields: name, material, qty, unit, unit cost, supplier)
- [ ] Add break-even volume vertical ReferenceLine to BOM cost breakdown chart
- [ ] Add Export BOM as CSV button above BOM table

## Sprint 43 — Manufacturing Intelligence Enhancements (COMPLETE)
- [x] Replaced BOM JSON textarea with structured row editor (add/remove rows: name, material, qty, unit, unit cost, supplier)
- [x] BOM total line shown below row editor
- [x] Break-even volume vertical ReferenceLine added to BOM cost breakdown chart
- [x] Export BOM as CSV button added to BOM table header
- [x] 616 tests passing, 0 TypeScript errors

## Sprint 44 — China Manufacturing Playbook (COMPLETE)
- [x] DB tables: mfgPlaybookProjects, mfgSupplierTiers, mfgQcReports, mfgLogisticsShipments (migration 0026)
- [x] mfgPlaybook tRPC router: 20 procedures (project CRUD + advancePhase, supplier CRUD, QC report CRUD, shipment CRUD, getPlaybookSummary)
- [x] ChinaManufacturingPlaybook.tsx: 6-tab UI (Overview Pipeline, UK Prototype, China Feasibility, Pilot & Scale, IP Protection, QC & Logistics)
- [x] Overview: 4 KPI cards, phase pipeline with project counts, project list with phase dots + Advance button, IP/NNN summary
- [x] UK Prototype tab: project create/edit/delete dialog, TRL progress bar, 6-item checklist (RFQ, DFM, tooling, ISO 9001/14001, CE)
- [x] China Feasibility tab: project selector, supplier ecosystem by tier (4 tiers), supplier add/edit/delete with NNN/contract/tooling fields
- [x] Pilot & Scale tab: project selector, 4 KPI tiles, cost & revenue stacked bar chart by production volume
- [x] IP Protection tab: 6-metric IP status cards, supplier IP status matrix table
- [x] QC & Logistics tab: QC report CRUD (pre-production/in-line/AQL), shipment CRUD (sea/air/rail/road), pass rate and cost KPIs
- [x] Route /china-manufacturing registered in App.tsx
- [x] Sidebar entry added: Analytics → China Mfg Playbook (Factory icon)
- [x] Vitest tests: mfgPlaybook.test.ts (34 tests covering phase progression, cost modelling, supplier IP risk, QC pass rate, logistics cost, active shipments, phase breakdown, TRL progression)
- [x] 650 tests passing, 0 TypeScript errors

## Sprint 45 — China Manufacturing Playbook Extended (COMPLETE)
- [x] DB tables: mfgSupplierOnboarding, mfgFactoryAudits, mfgRfqTemplates, mfgApprovedSuppliers, mfgContractTemplates (migration 0027)
- [x] mfgPlaybook router: procedures for supplier onboarding CRUD, factory audit CRUD, RFQ CRUD, ASL CRUD, contract template generation
- [x] ChinaManufacturingPlaybook.tsx: add 5 new tabs — Supplier Onboarding, Factory Audit, RFQ Manager, Approved Supplier List, Contract Templates
- [x] Supplier Onboarding: registration form (company, location, contacts, capabilities, certifications, capacity, clients, financials, references)
- [x] Supplier Capability Assessment: 6-criteria scoring (technical, quality, lead times, cost, communication, compliance)
- [x] Factory Audit Checklist: 6-item checklist (facility, equipment, workforce, QC, H&S, environmental) with pass/fail/partial per item
- [x] RFQ Template: product specs, drawings link, materials, volumes, lead times, pricing breakdown
- [x] Approved Supplier List (ASL): supplier ID, tier, capabilities, risk rating, performance score, status
- [x] Contract Templates: NNN Agreement, Manufacturing Agreement, Tooling Ownership, Quality Agreement, Logistics & Supply — each with clause checklist and AI-generated draft text
- [x] Vitest tests for new procedures (35 new tests)
- [x] 685 tests passing, 0 TypeScript errors

## Sprint 46 — University Playbook (COMPLETE)
- [x] DB tables: uniPartners, uniResearchProjects, uniTalentRoles, uniVentureWorkflows, uniIndustryEngagements, uniGovernanceDocs, uniDataSources, uniRoadmapMilestones (migration 0028)
- [x] tRPC router: universityPlaybook procedures (CRUD for all 8 tables + summary stats) — 9 sub-routers
- [x] UniversityPlaybook.tsx: 8-tab page (Overview, Research, Talent, Venture Workflow, Industry, Governance, Data Strategy, Roadmap)
- [x] Overview: dual risk model (Business Risk = University, Product Risk = Founders), strategic objectives, KPI tiles (partners, research, talent, engagements)
- [x] Research tab: academic/technical/applied research projects CRUD with TRL impact, budget, methodology, key findings
- [x] Talent tab: student/academic/industry_expert/venture_lead roles with skills, availability, stipend, and assignment to ventures
- [x] Venture Workflow tab: 5-stage pipeline (Problem → Discovery → Hypothesis → Validation → Commercialisation) with stage gate tracking and validation result
- [x] Industry Engagement tab: sponsored_research/consulting/venture_partnership/internship_pipeline/joint_ip with value tracking
- [x] Governance tab: student agreements, IP agreements, NDAs, ethics approvals, data protection, collaboration agreements — each with status and document URL
- [x] Data Strategy tab: hybrid data sources (interview/survey/secondary_research/ai_analysis/focus_group/observation) with sample size and key insights
- [x] Roadmap tab: 3-phase implementation timeline (setup/pilot/scale) with priority levels and milestone completion tracking
- [x] Route /university-playbook registered in App.tsx
- [x] Sidebar entry added under Research section (BookMarked icon)
- [x] Vitest tests: universityPlaybook.test.ts (32 tests covering dual risk model, stage progression, partner types, talent roles, governance docs, data strategy, roadmap, industry engagements, summary aggregation)
- [x] 717 tests passing, 0 TypeScript errors

## Sprint 47 — Cross-Module Workflow Engine (COMPLETE)
- [x] DB table: workflowTriggerLog (migration 0029 applied)
- [x] server/workflowEngine.ts: dispatchTrigger(), three handlers (triggerResearchCompleted, triggerAuditFailed, triggerSupplierApproved)
- [x] tRPC router: workflowEngine sub-router (listTriggerLog, getTriggerLog, rerunTrigger, getTriggerStats, fireTrigger)
- [x] Trigger 1: research project status → completed/published → creates Experiment Log entry with TRL impact as evidence
- [x] Trigger 2: factory audit item marked fail → creates CAPA task in Venture Project Management (Operations workstream)
- [x] Trigger 3: supplier onboarding status → approved → pre-populates Approved Supplier List entry with capability scores
- [x] Wire Trigger 1 into universityPlaybook.router upsertResearch mutation
- [x] Wire Trigger 2 into mfgPlaybookExtended.router upsertAudit mutation
- [x] Wire Trigger 3 into mfgPlaybookExtended.router upsertOnboarding mutation
- [x] WorkflowEngine.tsx: KPI cards, trigger type summary cards, trigger log table with filters/pagination, manual fire dialog, log detail dialog with re-run button
- [x] Route /workflow-engine registered in App.tsx
- [x] Sidebar entry added under Analytics section (Zap icon)
- [x] Vitest tests: workflowEngine.test.ts (30 tests covering trigger type validation, audit score calculation, capability score aggregation, trigger conditions, idempotency, cross-module target mapping)
- [x] 747 tests passing, 0 TypeScript errors

## Sprint 48 — Data Management Module (COMPLETE)
- [x] DB tables: dmDataAssets, dmQualityScores, dmAiPipelines, dmPipelineRuns, dmRagPipelines, dmRagDocuments, dmFineTuningJobs, dmFineTuningDatasets, dmFeedbackEntries (migration 0030 applied)
- [x] tRPC router: dataManagement sub-routers (assets, quality, pipelines, pipelineRuns, rag, ragDocuments, fineTuning, fineTuningDatasets, feedback, contextEngineering, summary)
- [x] DataManagement.tsx: 7-tab page (Overview, Data Assets, Quality Scoring, AI Pipelines, RAG Pipelines, Fine-Tuning, Feedback Loops)
- [x] Overview: data quality score gauge, pipeline health KPIs, asset count by type/source, recent activity feed
- [x] Data Assets tab: ingest/register data assets (name, type, source, format, size, venture linkage, tags, description, S3 url, quality score)
- [x] Quality Scoring tab: per-asset quality dimensions (completeness, accuracy, freshness, consistency, uniqueness) with auto-computed overall score and issue flags
- [x] AI Pipelines tab: pipeline CRUD (name, type, model, prompt template, input/output schema, status), pipeline run history with latency/token/cost tracking
- [x] RAG Pipelines tab: RAG config (document store, embedding model, chunk size, overlap, retrieval strategy, top-k), document upload/register, context engineering notes
- [x] Fine-Tuning tab: dataset management (upload, label, split), fine-tuning job tracking (base model, epochs, loss, status), model registry with version notes
- [x] Feedback Loops tab: user feedback on AI outputs (thumbs up/down, rating, correction text, pipeline linkage), improvement action tracking
- [x] Route /data-management registered in App.tsx
- [x] Sidebar entry added under Analytics section (Database icon)
- [x] Vitest tests: dataManagement.test.ts (42 tests covering asset types, quality scoring, pipeline statuses, RAG config validation, fine-tuning job states, feedback rating validation, context engineering, data source integration, pipeline run history, embedding models, summary stats)
- [x] 789 tests passing, 0 TypeScript errors

## Sprint 49 — Commercial CRM + Investor CRM (COMPLETE)
- [x] DB tables: crmContacts, crmLeads, crmDeals, crmActivities, crmPipelines, crmPipelineStages (migration 0031 applied)
- [x] DB tables: invContacts, invFundingRounds, invTermSheets, invCapTable, invDueDiligence, invUpdates (migration 0031 applied)
- [x] tRPC router: commercialCrm sub-routers (contacts, leads, deals, activities, pipelines, pipelineStages, summary)
- [x] tRPC router: investorCrm sub-routers (contacts, rounds, termSheets, capTable, dueDiligence, updates, summary)
- [x] CommercialCRM.tsx: 6-tab page (Overview, Contacts, Leads, Deal Pipeline, Activities, Pipeline Config)
- [x] InvestorCRM.tsx: 6-tab page (Overview, Investors, Funding Rounds, Term Sheets, Cap Table, Due Diligence)
- [x] Commercial Overview: weighted pipeline funnel, win rate, avg deal size, activity KPIs, lead source breakdown
- [x] Contacts tab: B2B contact CRUD (name, company, role, email, phone, venture linkage, tags, last contact date)
- [x] Leads tab: lead register (source, stage, score, assigned to, next action, estimated value, notes)
- [x] Deal Pipeline: stage-grouped deal board (Discovery → Proposal → Negotiation → Contract → Closed Won/Lost) with probability %
- [x] Activities tab: call/email/meeting/demo/follow_up log with outcome, duration, follow-up date
- [x] Investor Overview: total raised vs target, investor pipeline funnel, funding summary, cap table equity split
- [x] Investors tab: investor contact CRUD (name, fund, type, cheque size, portfolio focus, relationship status, last contact)
- [x] Funding Rounds tab: round CRUD (name, type, target, raised, valuation, status, lead investor, close date)
- [x] Term Sheets tab: term sheet tracker (investor, round, pre-money val, equity %, key terms, expiry, status)
- [x] Cap Table tab: shareholder register (name, type, shares, ownership %, investment amount, round, vesting schedule)
- [x] Due Diligence tab: DD checklist (legal, financial, technical, commercial, team) with document links and status
- [x] Route /commercial-crm and /investor-crm registered in App.tsx
- [x] Sidebar entries added under Analytics section (Briefcase + HandCoins icons)
- [x] Vitest tests: crm.test.ts (44 tests covering lead scoring, deal probability, weighted pipeline, activity/contact validation, deal value formatting, conversion rate, funding progress, valuation/equity, dilution, round/status validation, cap table, term sheet expiry, investor pipeline scoring)
- [x] 831 tests passing, 0 TypeScript errors

## Sprint 50 — Workflow Engine Expansion
- [ ] Add 4 new trigger handlers: triggerDealClosedWon, triggerFundingRoundClosed, triggerMilestoneOverdue, triggerDataQualityDegraded
- [ ] Wire triggerDealClosedWon into commercialCrm.router upsertDeal mutation (status → closed_won)
- [ ] Wire triggerFundingRoundClosed into investorCrm.router upsertRound mutation (status → closed)
- [ ] Wire triggerMilestoneOverdue into pm router milestone check (overdue detection on list query)
- [ ] Wire triggerDataQualityDegraded into dataManagement.router upsertQualityScore mutation (score < 60)
- [ ] Add notifyOwner() call inside all 7 trigger handlers
- [ ] Add trigger history count badge to CRM deal cards, investor round cards, audit cards, supplier onboarding cards
- [ ] Update WorkflowEngine.tsx to show all 7 trigger types in the summary cards
- [ ] Vitest tests for 4 new trigger handlers

## Sprint 51 — Governance & RBAC
- [ ] DB table: auditLog (id, userId, userEmail, action, entityType, entityId, entityName, oldValue, newValue, ipAddress, createdAt)
- [ ] DB table: venturePermissions (id, userId, ventureId, role: owner|editor|viewer, grantedBy, createdAt)
- [ ] Add logAudit() helper to server/auditLog.ts
- [ ] Wire logAudit() into key mutation handlers (venture upsert, founder add, deal upsert, round upsert, task upsert)
- [ ] tRPC router: admin sub-router (listUsers, updateUserRole, listAuditLog, getAuditStats, listVenturePermissions, grantVenturePermission, revokeVenturePermission)
- [ ] AdminPanel.tsx: 3-tab page (Users & Roles, Venture Permissions, Audit Log)
- [ ] Users & Roles tab: user list with role badge, promote/demote to admin button (admin only)
- [ ] Venture Permissions tab: per-venture permission matrix (owner/editor/viewer per user)
- [ ] Audit Log tab: filterable log table (entity type, action, user, date range) with diff viewer
- [ ] Route /admin registered in App.tsx (admin-only guard)
- [ ] Sidebar entry under Settings section
- [ ] Vitest tests for admin procedures and audit log

## Sprint 52 — Financial Model Builder
- [ ] DB tables: finPnlModels, finPnlLineItems, finRunwayModels, finWaterfallScenarios, finWaterfallShareClasses, finInvestorReports
- [ ] tRPC router: financialModel sub-router (pnl CRUD, runway CRUD, waterfall CRUD, report generation)
- [ ] FinancialModelBuilder.tsx: 5-tab page (Overview, P&L Builder, Runway Calculator, Exit Waterfall, Investor Report)
- [ ] Overview: model health KPIs, months runway, break-even month, exit return multiple
- [ ] P&L Builder: revenue/cost line item CRUD with monthly projections, auto-computed gross margin, EBITDA, net profit
- [ ] Runway Calculator: burn rate inputs (fixed/variable costs), revenue growth assumptions, cash balance over time chart
- [ ] Exit Waterfall: share class CRUD (ordinary, preference, convertible), exit proceeds input, waterfall distribution table and chart
- [ ] Investor Report: AI-generated report combining VRL/TRL scores, financial snapshot, milestone progress, risk summary
- [ ] Route /financial-model registered in App.tsx
- [ ] Sidebar entry under Investment section
- [ ] Vitest tests for financial model procedures

## Sprint 53 — Real-Time Infrastructure (SSE)
- [x] SSE server module (server/sse.ts): broadcastSSEEvent, emitWorkflowTrigger, emitMilestoneUpdate, emitRiskAlert, emitDataQualityAlert, getSSEStats, handleSSEConnection
- [x] Register /api/events SSE endpoint in Express server
- [x] Integrate emitWorkflowTrigger into dispatchTrigger (all 7 trigger types broadcast SSE events)
- [x] useLiveEvents React hook (client/src/hooks/useLiveEvents.ts): EventSource connection, auto-reconnect, filter support
- [x] LiveEventFeed component (client/src/components/LiveEventFeed.tsx): scrollable live event panel with type icons, severity colours, timestamps
- [x] Command Centre: Live Operational Event Stream panel (Row 7)
- [x] Workflow Engine: Live Workflow Event Stream panel (filtered to workflow_trigger events)
- [x] Vitest tests: 21 SSE tests (881 total passing, 0 TypeScript errors)

## Sprint 54 — Governance & RBAC (Admin Panel)
- [ ] DB tables: auditLog (id, userId, userEmail, action, entityType, entityId, entityName, oldValue, newValue, ipAddress, createdAt)
- [ ] DB tables: venturePermissions (id, userId, ventureId, role: owner|editor|viewer, grantedBy, createdAt)
- [ ] Add logAudit() helper to server/auditLog.ts
- [ ] Wire logAudit() into key mutation handlers (venture upsert, founder add, deal upsert, round upsert, task upsert)
- [ ] tRPC router: admin sub-router (listUsers, updateUserRole, listAuditLog, getAuditStats, listVenturePermissions, grantVenturePermission, revokeVenturePermission)
- [ ] AdminPanel.tsx: 3-tab page (Users & Roles, Venture Permissions, Audit Log)
- [ ] Route /admin registered in App.tsx (admin-only guard)
- [ ] Sidebar entry under Settings section
- [ ] Vitest tests for admin procedures and audit log

## Sprint 55 — Workflow Engine Expansion (Triggers 4-7)
- [ ] Add 4 new trigger handlers: triggerDealClosedWon, triggerFundingRoundClosed, triggerMilestoneOverdue, triggerDataQualityDegraded
- [ ] Wire triggerDealClosedWon into commercialCrm.router upsertDeal mutation (status → closed_won)
- [ ] Wire triggerFundingRoundClosed into investorCrm.router upsertRound mutation (status → closed)
- [ ] Wire triggerMilestoneOverdue into pm router milestone check (overdue detection on list query)
- [ ] Wire triggerDataQualityDegraded into dataManagement.router upsertQualityScore mutation (score < 60)
- [ ] Update WorkflowEngine.tsx to show all 7 trigger types in the summary cards
- [ ] Vitest tests for 4 new trigger handlers

## Sprint 54 — DB-Connect Static Pages
- [x] Reconnect InvestmentReadiness.tsx to trpc.irl.* (IRL score, ESG, CSR, certifications)
- [x] Reconnect FinancialAnalytics.tsx to trpc.financial.* and trpc.finPl.*
- [x] Reconnect BCorpIso.tsx to trpc.irl.getCertifications / upsertCertification
- [x] Reconnect PlaybookProgress.tsx to trpc.brl.* (tasks, completions)
- [x] Write vitest tests for Sprint 54 reconnections

## Sprint 55 — Governance RBAC + Milestone Trigger
- [x] Add vitest coverage for governance router (auditLog, permissions, policies, compliance)
- [x] Wire milestone_overdue trigger into PM milestones updateMilestone mutation
- [x] Add user role management UI to Governance page (promote/demote users)

## Sprint 56 — Marketing & Brand DB Layer
- [x] Add DB schema for marketing campaigns, channel splits, brand scores
- [x] Add DB schema for press releases, newsletter sends
- [x] Build tRPC routers for marketing, brand PR, brand readiness
- [x] Reconnect MarketingStrategy.tsx to new router
- [x] Reconnect BrandPR.tsx to new router
- [x] Reconnect BrandReadiness.tsx to new router
- [x] Write vitest tests for Sprint 56

## Sprint 57 — Specialist Services DB Layer
- [x] Add DB schema for specialists, engagements, commissions, task assignments
- [x] Build tRPC router for specialist services
- [x] Reconnect SpecialistServices.tsx to new router
- [x] Write vitest tests for Sprint 57

## Sprint 60 — Founder Onboarding Persistence

- [x] Audit FounderOnboarding.tsx and founders router for gaps
- [x] Add founderOnboardingSubmissions schema table and run db:push
- [x] Write trpc.onboardingSubmissions.submit mutation
- [x] Write trpc.onboardingSubmissions.list and getById queries
- [x] Reconnect FounderOnboarding.tsx form to DB (persist submissions)
- [x] Add submission history/review panel to FounderOnboarding page
- [x] Write Sprint 60 vitest tests (13 tests)

## Sprint 61 — Venture → Portfolio → Offering Architecture

- [x] Add portfolios and offerings schema tables (migration)
- [x] Build portfolios + offerings tRPC CRUD router
- [x] Build Portfolio Manager page (/portfolios)
- [x] Build Offering Detail page (/offerings/:offeringId)
- [x] Add offeringId FK to P1 execution tables (financial_snapshots, finPlLines, mfg*, workflowTriggerLog)
- [x] Add offeringId FK to P2 execution tables (milestones, experiments, ventureRisks, crmPipelines, crmDeals)
- [x] Add offeringId FK to P3 analytics tables (dmDataAssets, marketAnalysis, competitors)
- [x] Add Offering Scope Selector to Portfolio Overview, Financial Analytics, Supply Chain pages
- [x] Update Market Intelligence and Financial Model Builder to operate at offering level
- [x] Write vitest tests for portfolios + offerings router (51 tests)
- [x] Run full test suite and save checkpoint (1059 tests passing)

## Sprint 62 — University Approval Report Module (Build Pack v2)

- [x] Review EcoBlend Build Pack v2 brief and audit DB schema for gaps
- [x] Add uniApprovalReports table (6 report types, 6 statuses, H4 stage, offering/portfolio FK, dual risk owner fields)
- [x] Add offeringResearchLinks table (links reports to research projects with evidence strength and link type)
- [x] Run migration 0039 — both tables live in production DB
- [x] Build uniApprovalReport tRPC router (list, get, upsert, updateStatus, delete, generateAI, getSummary)
- [x] AI generateAI: scoped to offering, pulls research projects, partners, experiments automatically, generates H4-structured report
- [x] Build UniApprovalReportTab component (summary KPIs, filter toolbar, report cards, view dialog, create dialog, AI generate dialog)
- [x] Add "Approval Reports" tab to University Playbook page (10th tab)
- [x] TypeScript check: 0 errors
- [x] Write vitest tests for approval report module (38 tests: schema validation, status transitions, summary calcs, AI context, offering linkage)
- [x] Full test suite: 1097 tests passing across 44 test files

## Sprint 63 — Spin-Out Blueprint Module

- [x] Design Blueprint data model: spinoutBlueprints, blueprintLibraryLinks tables
- [x] Add schema tables and run migration (0040 — spinoutBlueprints + blueprintLibraryLinks)
- [x] Build spinoutBlueprint tRPC router (create, get, list, update, delete, computeReadiness, addLibraryLink, updateLinkStatus, removeLibraryLink, listLibraryLinks, getLibraryOptions, generateBlueprint, launchToSpinoffOS)
- [x] Build SpinOutBlueprint UI page (/spinout-blueprint) with offering selector, 6-domain readiness radar, library linkage panels, AI blueprint viewer, launch flow
- [x] Upgrade SpinoffOS wizard: accept configId URL param, pre-populate from Blueprint launch
- [x] Add "Spin-Out Blueprint" to sidebar navigation (Intelligence group)
- [x] Write 41 vitest tests (domain weights, readiness scoring, gate logic, library links, journey stages, pre-population)
- [x] Full test suite: 1138 tests passing across 45 test files

## Sprint 64 — Blueprint Dashboard Widget (Command Centre)

- [x] Read Command Centre page and spinoutBlueprint router structure
- [x] Fix: spinoutBlueprintRouter was imported but not registered in appRouter — now fixed
- [x] Fix: spinoutBlueprint.router.ts used `import { db }` instead of `getDb()` — all procedures fixed
- [x] Add getPipelineSummary tRPC procedure (top 5 blueprints by readiness, gate proximity, library link counts, summary stats)
- [x] Build SpinoutPipelineWidget component (summary KPI row, per-blueprint readiness bars with 40% gate marker, domain mini-bars, launch CTA, empty state)
- [x] Integrate widget as Row 7 in Command Centre page (between Venture Readiness Table and Live Event Stream)
- [x] Write 12 vitest tests for pipeline summary sorting, stats, gate proximity, null handling, widget display logic
- [x] Full test suite: 1150 tests passing across 45 test files

## Sprint 65 — Co-founder Readiness Level (CRL) Module

- [x] Review CRL Module Architecture Documentation and design specification
- [x] Add 5 DB tables: crl_assessments, crl_founder_responses, crl_interventions, crl_monitoring_records, vrl_dynamic_weights (migration 0041)
- [x] Build crlRouter tRPC with scoring engine (5 dimensions: Alignment, Capability, Commitment, Conflict Resolution, Adaptability)
- [x] Build 4 AI conversation modes: Assessment (initial scoring), Results Review (interpret scores), Conflict Mediation (resolve team issues), Continuous Monitoring (track trends)
- [x] Add dynamic VRL weighting by H4 stage (Stage 1: 60% VRL, Stage 2: 50% VRL, Stage 3: 40% VRL, Stage 4: 30% VRL)
- [x] Build CofounderReadiness.tsx UI page with 4 tabs: Assessment, Results, Interventions, Monitoring
- [x] Assessment tab: founder selector, 5-dimension questionnaire, AI scoring engine, score history
- [x] Results tab: CRL score display, risk alerts, trend chart, comparison to portfolio average
- [x] Interventions tab: intervention CRUD, status tracking, owner assignment, effectiveness tracking
- [x] Monitoring tab: monitoring records, trend analysis, early warning system, action plan generation
- [x] Add "Co-founder Readiness" to sidebar navigation (Intelligence group)
- [x] Fix TypeScript errors: ReactNode type issues in CulturalReadiness.tsx (Boolean() wrapping for unknown types)
- [x] Fix undefined reference errors: venturesQuery and trpc.vrl references corrected
- [x] Full test suite: 1150 tests passing across 45 test files, 0 TypeScript errors

## Sprint 66 — Investment Module

- [x] Read Investment_Module_System_Pack.docx and plan architecture
- [x] Database schema: 5 new tables (invReadinessScores, invOutputs, invTargets, invKpis, invFundraisingRounds) — migration 0042
- [x] Investment Module tRPC router (server/investmentModule.router.ts) with 6 sub-routers
- [x] Composite readiness scoring engine (6 dimensions: commercial, technical, validation, supply chain, impact, attractiveness)
- [x] AI Pitch Deck generation (10 narrative sections: problem, opportunity, solution, market, traction, business model, supply chain, team, financials, ask)
- [x] AI Business Plan generation (6 sections: executive summary, market analysis, product, commercial strategy, financials, risk)
- [x] AI Execution Plan generation (6 sections: 90-day roadmap, product dev, supply chain, team, budget, milestones)
- [x] AI Investor Summary generation
- [x] AI Investor Matching (aiMatch procedure — identifies aligned investors from venture profile)
- [x] Investor Targets CRUD with 9-stage outreach pipeline (identified → closed/passed)
- [x] Investment KPIs management (ask amount, pre-money valuation, burn rate, runway, 3-year revenue projections)
- [x] Fundraising Rounds management with progress bars and status tracking
- [x] Portfolio readiness summary (avgComposite, readyCount, byVenture breakdown)
- [x] InvestmentModule.tsx UI page with 6 tabs (Readiness Score, Pitch Deck, Business Plan, Execution Plan, Investor Matching, Fundraising)
- [x] Readiness tab: composite score ring chart, 6 dimension score rings, strengths/weaknesses/gaps panels
- [x] Pitch Deck / Business Plan / Execution Plan tabs: list/detail layout with status management and delete
- [x] Investor Matching tab: table with match score bars, outreach status inline selector, AI Match button, manual add dialog
- [x] Fundraising tab: KPI summary cards, round cards with progress bars, Edit KPIs dialog, New Round dialog
- [x] Sidebar nav entry: "Investment Module" under Analytics section (href: /investment-module)
- [x] Route registered in App.tsx: /investment-module
- [x] Vitest test suite: 26 tests covering all 6 sub-routers (server/investmentModule.test.ts)
- [x] Full test suite: 1176 tests passing across 46 test files, 0 TypeScript errors

## Sprint 67 — EcoRace Lab Module

- [x] DB schema: 7 new tables (erl_projects, erl_stages, erl_materials, erl_simulations, erl_ip_assets, erl_agent_runs, erl_validation_logs) — migration 0043
- [x] tRPC router: ecoracelab.router.ts with 8 sub-routers (projects, stages, materials, simulations, ip, validation, agentRuns, dashboard)
- [x] 7 AI agents: Opportunity Translator, Concept Engineer, Materials Scientist, Simulation Engineer, Manufacturing Planner, Validation Engineer, IP Generator
- [x] 8-stage workflow engine: opportunity → concept → materials → simulation → prototype → manufacturing → validation → ip
- [x] Stage agent runner with human review/approve/reject flow and iteration tracking
- [x] Materials library with AI generation from stage output and sustainability scoring
- [x] Simulations register with FEA/thermal/fatigue/CFD/impact/vibration/lifecycle types
- [x] IP assets with patent claims, prior art search, and filing status tracking
- [x] Validation log with compliance standards and pass/fail tracking
- [x] Agent run log with duration, status, and error tracking
- [x] EcoraceLab.tsx UI page with 6 tabs: Workflow, Materials, Simulations, IP Assets, Validation, Agent Log
- [x] 8-stage visual pipeline with status indicators and stage navigation
- [x] Project sidebar with priority and status indicators
- [x] New project dialog with venture linking
- [x] Route /ecorace-lab registered in App.tsx
- [x] Sidebar nav item added under Analytics section
- [x] 58 vitest tests — all passing
- [x] Full test suite: 1,234 tests passing (47 test files)
- [x] 0 TypeScript errors

## Sprint 68 — Investor Data Room Module

- [x] 10 new DB tables: dr_rooms, dr_assets, dr_readiness_checklist, dr_investors, dr_permissions, dr_engagement_events, dr_qa_requests, dr_asset_generation_log, dr_approvals (migration 0044)
- [x] tRPC router with 9 sub-routers: rooms, assets, readiness, investors, permissions, engagement, qa, assetFactory, approvals
- [x] Readiness scoring engine with 5-category checklist (overview, market, financials, legal, compliance)
- [x] AI Asset Factory: generateOnePager, generatePitchDeck, generateFinancialSummary, generateDdIndex
- [x] Investor pipeline with 9 stages: identified → contacted → meeting_scheduled → nda_signed → room_invited → reviewing → term_sheet → closed_won → closed_lost
- [x] Permissions system with role-based access: viewer, reviewer, lead_investor, co_investor
- [x] Engagement analytics: per-room event log, portfolio-level analytics
- [x] Q&A module with AI-assisted response generation
- [x] Approvals workflow: request, review, approve/reject
- [x] InvestorDataRoom.tsx UI with 6 tabs: Portfolio Rooms, Room Dashboard, Asset Manager, Investor Portal, Analytics, Admin
- [x] Sidebar nav item added (FolderLock icon, Analytics section)
- [x] Route /investor-data-room registered in App.tsx
- [x] 45 vitest tests — all passing
- [x] Full test suite: 1,279 tests passing (48 test files)

## Sprint 69 — Learning Engine Module (Mar 29, 2026)

- [x] 8 new DB tables: le_raw_inputs, le_structured_insights, le_problem_statements, le_vrl_scores, le_patterns, le_recommendations, le_knowledge_nodes, le_knowledge_edges
- [x] Migration 0045 applied successfully
- [x] learningEngine.router.ts — 5 sub-routers: structuring, vrlEngine, patterns, recommendations, knowledgeGraph
- [x] Structuring Engine: processInput (AI-powered), listInsights, listProblems, updateProblemStatus
- [x] VRL Engine: calculate (formula-based TRL/BRL/Risk/Confidence), history, scenarioAnalysis, portfolioSummary
- [x] Pattern Detection: detect (portfolio-wide AI analysis), list, predictSuccess
- [x] Recommendation Engine: generate (AI-powered), list, updateStatus
- [x] Knowledge Graph: build, getGraph, portfolioStats
- [x] LearningEngine.tsx UI page — 5 tabs: Structuring Engine, VRL Dashboard, Pattern Detection, Recommendations, Knowledge Graph
- [x] Route /learning-engine registered in App.tsx
- [x] Brain icon added to Sidebar.tsx under Analytics section
- [x] learningEngine.test.ts — 39 vitest tests, all passing
- [x] Full test suite: 1,318 tests passing across 49 test files (0 failures)
- [x] TypeScript: 0 errors

## Sprint 70 — Playbook Stewardship Portal

- [x] 6 new DB tables: pb_playbooks, pb_steps, pb_step_runs, pb_runs, pb_kpi_entries, pb_linked_assets (migration 0046)
- [x] playbookRouter with 6 sub-routers: playbooks (CRUD + seed), steps, runs (execution engine), kpis, assets, ai
- [x] 10 pre-seeded playbooks across 5 strategic folders (PB-01 to PB-05, 2 variants each)
- [x] AI playbook generator and portfolio pattern analyser
- [x] Step-by-step execution engine with advance/block/cancel/summary
- [x] KPI tracking and recording per playbook
- [x] Linked asset management (pitch_deck, business_plan, etc.)
- [x] PlaybookPortal.tsx UI with 5 tabs: Folder Browser, Playbook Viewer, Step Runner, KPI Dashboard, AI Generator
- [x] Route /playbook-portal registered in App.tsx
- [x] Sidebar nav item added (BookMarked icon) under Analytics section
- [x] 38 vitest tests — all passing
- [x] Full suite: 1,356 tests passing across 50 test files

## Sprint 71 — IP Intelligence Module (Mar 30, 2026)
- [x] 4 IP_OBJECT tables: ip_analyses, ip_entities, ip_whitespace, ip_vrl_feed (migration 0047)
- [x] Lightbringer mock engine: deterministic novelty scoring, patent density, FTO risk, recommendation
- [x] IP_OBJECT JSON schema (getSchema endpoint for future API integration)
- [x] Analysis CRUD: run, list, get, delete, updateNotes
- [x] VRL Feed: getByVenture, getLatestScore, portfolioSummary — 15% IP score contribution to VRL
- [x] lightbringerRouter: preview (no DB save), getSchema, getOptions (industries/geographies/apiProviders)
- [x] IpIntelligence.tsx UI: input form, IP Intelligence Card, entity table, whitespace opportunities, portfolio overview
- [x] Route /ip-intelligence registered in App.tsx
- [x] Sidebar nav item added (ShieldCheck icon) under Analytics section
- [x] 26 vitest tests — all passing
- [x] Full suite: 1,382 tests passing across 51 test files

## Sprint 72-76 — V4 Architecture Brief (completed 2026-03-31)

- [x] Sprint 72: G Drive Workspace Automation — 11-folder taxonomy, permission matrix, workspace provisioning
- [x] Sprint 72: gdriveWorkspace.router.ts — listWorkspaces, getWorkspace, createWorkspace, getModuleTaxonomy, getPermissionMatrix, getPermissions
- [x] Sprint 72: GDriveWorkspace.tsx UI — Overview / Folders / Permissions tabs
- [x] Sprint 73: VRL Dashboard V4 — Stage gate tracking, Spin-Out Readiness Panel, Actions Log
- [x] Sprint 73: vrlDashboardV4.router.ts — getDashboardSummary, getStageGates, upsertStageGate, getSpinoutChecklist, updateSpinoutGate, addAction, updateActionStatus
- [x] Sprint 73: VrlDashboardV4.tsx UI — Stage Gates / Spin-Out Readiness / Actions Log tabs
- [x] Sprint 74: Spin-Off Sequence Automation — 5-step workflow, asset migration, AI handover pack, data room setup
- [x] Sprint 74: spinoffSequence.router.ts — triggerSpinoff, createSpinoffDrive, migrateAssets, generateHandoverPack, setupDataRoom, completeSequence
- [x] Sprint 74: SpinoffSequenceOS.tsx UI — Stepper, asset migration, handover pack tabs
- [x] Sprint 75: Brand Data Pipeline — Brand Asset Register, module auto-linking, AI document header generator
- [x] Sprint 75: brandPipeline.router.ts — getAssetRegister, upsertAsset, getBrandPanel, autoLinkAllModules, generateDocumentHeader, getUpdateLog
- [x] Sprint 75: BrandPipeline.tsx UI — Asset Register / Module Links / Update Log tabs
- [x] Sprint 76: Interview-to-Insight Automation — AI transcript processing, insight board, Stage Gate Review pack
- [x] Sprint 76: insightAutomation.router.ts — processTranscript, getInsightBoard, getInsightSummary, initiateStageGateReview, approveStageGateReview, listStageGateReviews
- [x] Sprint 76: InsightAutomation.tsx UI — Process Transcript / Insight Board / Stage Gate Reviews tabs
- [x] All 18 DB tables migrated (migration 0048)
- [x] All 5 routers registered in routers.ts
- [x] All 5 pages registered in App.tsx routes
- [x] All 5 nav items added to Sidebar.tsx (Analytics section)
- [x] Full test suite: 51 files, 1382 tests — all passing
