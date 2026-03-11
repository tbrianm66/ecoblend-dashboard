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
