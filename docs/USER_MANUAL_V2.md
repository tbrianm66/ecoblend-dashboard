# Venture Validation OS — User Manual v2

**Institutional Author:** Future Humanity Ventures Ltd  
**Version:** 2.0  
**Gate:** Gate 0 Compliance Update (FHV-EB-AUD-001 §3)  
**Applies to:** All founders, coaches, advisors, and administrators using the EcoBlend VOS

---

## §1 Platform Overview

### §1.1 Purpose

The Venture Validation OS (VOS) is the operational system for the EcoRace Venture Studio. It provides:

- **Dual readiness scoring** (VRL 0–9 and TRL 1–9) for every portfolio venture
- **Evidence-enforced assessment** — scores are not persisted without confirmed evidence links
- **Coaching and commitment tracking** — weekly accountability cycles against venture outcomes
- **Governance and dispute resolution** — independent score review via `SCORING_INTEGRITY_REVIEWER` role
- **Portfolio intelligence** — experiment logs, interview data, canvas versioning, and commercial pipeline

The system is designed for venture studios operating under a social enterprise / B-Corp aligned model where every commercial venture carries a nominated charity mission thread.

---

### §1.2 Platform Claims — Verified Status (Gate 1 Complete)

> **This section reflects the verified and enforced state of the platform as of Gate 1 (SOW-B02 and SOW-B03, fully merged and confirmed).**

#### Evidence-First Readiness Scoring — LIVE AND ENFORCED

The following capabilities are **fully live and enforced at the data layer**:

| Capability | Status | Enforcement Layer |
|---|---|---|
| VRL dimension scoring with evidence links | ✅ Live | `vrl_assessments.submittedEvidenceLinks` — required at submission |
| Human confirmation gate before score persistence | ✅ Live | `vrlScoring.confirmEvidence` — reviewer must confirm each dimension |
| `evidenceStatus` tracking per assessment | ✅ Live | `unverified` → `partially_verified` → `fully_verified` pipeline |
| Builder–verifier separation | ✅ Live | `submittedById` prevents self-confirmation |
| Unverified inputs flag | ✅ Live | `hasUnverifiedInputs` — true until all dimensions confirmed |

#### Verified Score Computation — LIVE AND ENFORCED

| Capability | Status | Enforcement Layer |
|---|---|---|
| Score dispute pathway | ✅ Live | `score_disputes` table + `SCORING_INTEGRITY_REVIEWER` role |
| `RESOLVED_UPHELD` / `RESOLVED_OVERTURNED` state machine | ✅ Live | `scoreDispute.raiseDispute` / `scoreDispute.resolveDispute` |
| `updateScores` gated to integrity reviewer | ✅ Live | `integrityReviewerProcedure` middleware |
| Profile SV-01 (software/social MRL N/A path) | ✅ Live | `scoringProfile = 'SV-01_SOCIAL_SOFTWARE'` on venture + assessment |

#### Features That Are Deferred (Not Live — Do Not Claim)

The following are **not live** and must not be described as current capabilities in any founder-facing, investor-facing, or institutional communication:

| Feature | Status | Reason |
|---|---|---|
| MCP Agent Fleets | ⏸ Deferred (Gate 4) | Speculative infrastructure — no live deployment |
| Autonomous AI intelligence scoring | ⏸ Deferred | Not implemented; not claimed |
| FEDSILK Attribution (Federated Learning) | ⏸ Deferred (Gate 4) | Pending commercial validation |
| Tokenisation Engine | ⏸ Deferred | Speculative; not implemented |
| Growth-as-a-Service (GaaS) | ⏸ Deferred | Speculative; not implemented |

---

### §1.3 Who Uses the Platform

| Role | Primary Modules | Access Level |
|---|---|---|
| **Founder** | Onboarding, Experiment Log, Interview Tracker, VRL, Evidence Ledger | Venture-scoped write |
| **Coach** | Coaching Studio, Commitment Tracker, Session Logger | Assigned venture read/write |
| **Advisor** | Advisory Function, Data Room (read), Portfolio Overview | Read + advisory comment |
| **Investor** | Investor Data Room (permissioned), Readiness Dashboard | Room-restricted read |
| **Admin** | All modules + Admin Command Centre | Full platform |
| **Scoring Integrity Reviewer** | Score Disputes, VRL Results (disputes tab) | Dispute resolution only |

---

## §2 Core Workflow — The Five Canonical Modules

Gate 4 consolidated the platform to five evidence-first modules that form the canonical founder journey:

### Step 1 — Onboarding (`/onboarding`)
Complete the 4-step founder wizard: venture fundamentals, problem/solution, go-to-market, and founder profile. On completion, your venture is added to the portfolio at VRL Stage 1.

### Step 2 — Experiment Log (`/discovery/experiments`)
Create and track lean hypotheses. Each experiment must have a falsifiable success criterion and a recorded outcome (pass/fail/pivot). Passed experiments with ≥ 60% confidence provide evidence for BRL scoring.

### Step 3 — Interview Tracker (`/interviews`)
Log beneficiary discovery interviews. Minimum 20 interviews required before moving to VRL Stage 2. Interviews with validated insight signal contribute to PRL (People Readiness Level) scoring.

### Step 4 — Venture Model Canvas / VRL (`/proposition/venture-model-canvas`)
Score your venture across 10 readiness axes. Every score requires an evidence URL and independent confirmation by a reviewer. The 10-axis composite produces your global VRL score (0–9).

### Step 5 — Evidence Ledger (`/v2/evidence`)
The canonical record of all confirmed evidence across every scored dimension. This is the audit-ready output used in investor data rooms and governance reviews.

---

## §3 Readiness Scoring — How It Works

### §3.1 VRL Axes (10 dimensions)

| Axis | Key | Domain | Weight |
|---|---|---|---|
| Technology Readiness | TRL | Product | 0.35 |
| Manufacturing Readiness | MRL | Execution | 0.40 |
| Business Readiness | BRL | Market | 0.25 |
| Ecological Score | EcoScore | Structural | — |
| People Readiness | PRL | Execution | — |
| IP Readiness | IP | Product | — |
| Financial Readiness | FRL | Structural | — |
| Regulatory Readiness | REG | Structural | — |
| Social Return | SRL | Structural | — |
| Market Validation | MVL | Market | 0.50 (Gate 2) |

### §3.2 Evidence Requirements

Each scored dimension requires:
1. **Evidence URL** — a link to the primary evidence artefact (patent application, customer contract, test report, etc.)
2. **Reviewer confirmation** — a `SCORING_INTEGRITY_REVIEWER` or admin confirms the evidence is genuine and relevant
3. **Builder–verifier separation** — the person who submitted the score cannot confirm their own evidence

### §3.3 Score Dispute Process

If a founder or stakeholder believes a score is incorrect:
1. Raise a dispute via the **Disputes** tab on the VRL Results page
2. Provide a written explanation (mandatory) and optional supporting evidence URL
3. A `SCORING_INTEGRITY_REVIEWER` investigates and resolves:
   - `RESOLVED_UPHELD` — original score confirmed; dispute rejected
   - `RESOLVED_OVERTURNED` — score reconsidered; a new assessment must be submitted through the standard flow

---

## §4 Module Reactivation (Extended Backlog)

Gate 4 archived 15 non-core module groups into the Extended Backlog. These are visible in the sidebar under "Extended Backlog" with a locked/greyed treatment.

To reactivate a module group for your venture:
1. An admin opens the **Module Reactivation** panel (gear icon in the sidebar footer)
2. Toggle the relevant module group ON
3. The module becomes navigable for that session

Reactivation state is persisted in the admin's browser and survives page refresh. Server-side persistence is a future upgrade.

---

## §5 Governance Roles

| Role Value | Capability |
|---|---|
| `admin` | Full platform access including user management, score updates, and dispute resolution |
| `scoring_integrity_reviewer` | Score dispute resolution only; cannot update scores directly |
| `coach` | Coaching sessions, commitments, and founder performance tracking |
| `founder` | Venture-scoped access; cannot confirm own evidence |
| `advisor` | Read access to assigned ventures and data rooms |
| `investor` | Permissioned data room access only |

---

## §6 Audit Trail

All significant platform actions are logged in `system_audit_logs`:
- Actor name and role
- Action performed
- Target module and venture
- Timestamp

Score disputes have their own dedicated audit trail in `score_disputes` with full state-machine history.

Environmental integrity events are logged in `scorecard_kill_alerts` and immediately trigger an H8 kill-criteria alert in the Scorecard Telemetry Monitor.

---

*Document maintained by Future Humanity Ventures Ltd. For platform queries, contact the studio admin.*
