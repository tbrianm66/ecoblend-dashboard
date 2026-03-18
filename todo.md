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
