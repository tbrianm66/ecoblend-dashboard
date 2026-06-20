# FEDSILK Governance Workflow — Gap Report

**Prepared:** 20 June 2026  
**Scope:** Read-only audit of merged FEDSILK implementation in the Governance module.  
**No code changes made.**

---

## Executive Summary

FEDSILK is **not** a step-by-step governance workflow in the sense of F → E → D → S → I → L → K being seven sequential governance activities. It is a **proprietary federated-learning attribution engine** — a technology product with five technical mechanisms (M1–M5). Its name is a codename, not a governance acronym.

The merged implementation is technically sound as a technology demonstrator, but it has six significant gaps that prevent it from functioning as a usable governance tool for a non-technical audience:

1. The route `/governance/fedsilk` does not pre-select the FEDSILK tab — new visitors land on Stage Gates.
2. All state is in-memory with no database persistence.
3. The Governance Signals panel shows live-readiness labels (VRL/SRL/PRL/Compliance) but none are linked to real governance records.
4. The Legal Repository, IP Register, Board Reporting, Audit Trail, and Stage-Gate Approvals are structurally disconnected.
5. The terminology is technical and inaccessible to a governance or board audience.
6. FEDSILK's own audit ledger (M4) does not write to the platform's `auditLog` table.

---

## 1. What Each FEDSILK Step (Mechanism) Means

FEDSILK has five **mechanisms**, not sequential governance steps. Each mechanism is a property of a privacy-preserving federated learning system.

| ID | Name | What it does | Governance relevance |
|---|---|---|---|
| **M1** | Data Locality | Raw data never leaves individual participants. Only gradient updates (mathematical vectors) are shared with the aggregator. | Demonstrates privacy compliance — no participant exposes proprietary data to other participants or the platform operator. |
| **M2** | Gradient Validation Gate | Each incoming gradient is tested against a norm-based anomaly threshold (median × 2.5). Updates that are too large (potential data poisoning / adversarial attacks) are rejected and logged. | Shows Byzantine-resilience — the model cannot be corrupted by a single bad actor. Governance-relevant for consortia with untrusted participants. |
| **M3** | Contribution Scoring (Shapley) | Each participant's marginal contribution to model improvement is computed using a leave-one-out R² delta (standard Shapley approximation). Credits are allocated proportionally. | Provides a fair, verifiable basis for revenue sharing, licensing fees, or consortium membership weighting. |
| **M4** | Immutable Hash-Linked Audit Ledger | Every system event (round completions, rejections, credit changes, exits) is recorded in an append-only log where each entry seals the hash of the previous entry. Tamper-detection is O(n). | Structurally equivalent to a Hyperledger Fabric ledger. Provides the audit trail required for regulatory compliance and board accountability. |
| **M5** | Verifiable Unlearning Exit | A participant can exit the system. Their accumulated gradient contribution is reversed from the global model, and their credit balance is forfeited. The exit is recorded immutably in M4. | GDPR Article 17 ("right to be forgotten") compliance mechanism. Also governs IP repatriation when a consortium partner exits. |

**What FEDSILK does not include:**
- A sequential approval workflow (no concept of "step 1 → step 2 → approved")
- Document upload or evidence attachment
- Approval routing to named individuals
- Links to contracts, IP filings, or board resolutions

---

## 2. Where Each Step Appears in the UI

| Location | What the user sees | Navigation path |
|---|---|---|
| **Sidebar** | "FEDSILK Attribution" entry under Governance (Network icon) | Governance section → FEDSILK Attribution |
| **Route** | `/governance/fedsilk` loads `GovernanceHub` | **Gap:** the component defaults to the "Stage Gates" tab — the user does not land on the FEDSILK tab automatically |
| **GovernanceHub tab bar** | "FEDSILK Attribution" is the 11th of 12 tabs | Governance page → scroll right in tab bar → FEDSILK Attribution |
| **FedsilkPanel header** | Navy banner: "FEDSILK Attribution Engine · Federated contribution attribution · privacy-preserving · governance-verifiable" | Inside the tab |
| **M1** | Shown implicitly in the client table: "0 raw data shared" | Governance Signals panel, PRL row |
| **M2** | "Gate Validation — Accept/Reject" bar chart; "Round N — Gate Detail" per-client panel | Charts section, Last Round Detail card |
| **M3** | "Contribution Scores & Credit Balances" client table | Below charts |
| **M4** | "Hash-Linked Audit Ledger" scrolling log with hash truncations | Below client table |
| **M5** | "Verifiable Unlearning Events" section (only appears after an exit is triggered) | Bottom of panel, conditional |

**Navigation gap (confirmed):** The sidebar link `/governance/fedsilk` renders `GovernanceHub` with no prop or URL param to pre-select the `fedsilk` tab. The component initialises with `useState` defaulting to `"gates"`. A user following the sidebar link sees the Stage Gates tab, not FEDSILK.

---

## 3. Which Database Table or Data Structure Stores Each Step

**None.** FEDSILK is entirely client-side and in-memory.

| Data element | Where it lives | Persistence |
|---|---|---|
| `FedEngineState` (clients, global model, round history) | React `useState` | Lost on page refresh / tab change |
| `LedgerEntry[]` (M4 audit chain) | In-memory array within `FedEngineState` | Not persisted. Not written to `auditLog` or any PostgreSQL table |
| Contribution history, credit balances | In-memory within `FedClient[]` | Not persisted |
| Unlearning events (M5) | In-memory within `FedEngineState.unlearningEvents` | Not persisted |

**No database tables are used.** The README explicitly notes this as a future swap: *"Add a `server/fedsilk.router.ts` tRPC router that stores `FedEngineState` in PostgreSQL."*

The closest existing tables that FEDSILK data **should** eventually write to:

| FEDSILK element | Appropriate existing table | Current linkage |
|---|---|---|
| Ledger entries (M4) | `auditLog` | None |
| Participant/client records | `crmContacts` or a new `fedsilk_participants` table | None |
| Round results | A new `fedsilk_rounds` table (no equivalent exists) | None |
| Credit balances | `contribution_logs` (equity module) | None |
| Exit/unlearning events | `venture_archive` or a new `fedsilk_exits` table | None |

---

## 4. Which Evidence, Documents, Approvals, Contracts, and Risk Flags Are Attached to Each Step

**None are attached.** FEDSILK currently has no connections to any other module.

| Governance asset | Expected attachment point | Current status |
|---|---|---|
| IP filings (patent, copyright) | M1 data locality proof and M5 IP repatriation at exit | **Not linked.** `ip_assets`, `ip_licenses` tables exist but are unused by FEDSILK. |
| Contract documents | Consortium participation agreement, IP licensing | **Not linked.** `contract_documents`, `legal_contract_records` exist but are unused. |
| Risk flags | M2 rejection events (poisoning attacks, anomalous participants) | **Not linked.** `venture_risks`, `mrl_risk_register` exist but FEDSILK rejection events do not write to them. |
| Stage-gate approvals | Model validation gate (M2) pass/fail as a readiness criterion | **Not linked.** `cc_stage_gate_reviews`, `vrl_stage_gates` exist but FEDSILK does not submit a gate event. |
| Evidence claims | Contribution scores (M3) as evidence of model quality | **Not linked.** `cc_evidence`, `evidence_claims` exist but FEDSILK does not write evidence records. |
| Audit trail | Ledger (M4) events | **Not linked.** The platform's `auditLog` table is separate; FEDSILK's in-memory hash chain does not write to it. |
| Board reports | Model accuracy, contributor summary | **Not linked.** The Board Reports tab has a "Generate Q2 Board Report" placeholder button but FEDSILK data is not included in any report payload. |

**The Governance Signals panel** (visible in the FEDSILK tab) shows four signal boxes labelled VRL/MRL, SRL, PRL, and Compliance with green/red indicators. These look like cross-module readiness links but are **entirely self-contained** — they read from the simulation state, not from the live VRL/SRL/PRL scores in the database. A user could have a red VRL flag in the real scoring engine and a green indicator in FEDSILK's panel simultaneously with no reconciliation.

---

## 5. Whether the Workflow Is Understandable to a New User Without Prior Explanation

**No.** The panel presents without context as a technical simulation tool.

Specific issues for a governance or board audience:

| Problem | Detail |
|---|---|
| No introductory context | The header subtitle reads "Federated contribution attribution · privacy-preserving · governance-verifiable." This explains nothing to a non-technical user. There is no description of why FEDSILK exists in the governance module or what governance problem it solves. |
| Control labels are technical | "Inject Poison", "Gradient Norm ‖g‖", "FedAvg aggregation", "Leave-one-out Shapley", "djb2 hash chain" are meaningless to governance audiences. |
| Simulation is not labelled as simulation | A new user seeing "Run Round", "Run 5×", and a live-updating chart will not know whether this is real production data or a demo. The README clarifies it is a simulation but the README is not user-facing. |
| "Inject Poison" is alarming | This control is shown in red and labelled with a ⚡ icon. Without context, a governance user is likely to avoid it, or click it by mistake and not understand the consequence. |
| M5 "Exit + Unlearn" | Triggering this in the UI deactivates a participant and reverses gradient contributions. No confirmation dialog, no explanation, no undo. |
| Mechanism badges are unexplained | M1–M5 badges appear on cards with no legend. |
| Governance Signals mislead | The VRL/SRL/PRL/Compliance signal boxes appear to reflect the platform's live scoring but do not. |

---

## 6. Should FEDSILK Remain Merged Into Governance or Have Its Own Dedicated Submodule?

**Recommendation: Give FEDSILK a dedicated submodule page within Governance, with a governance-oriented shell wrapped around the existing simulation.**

### Arguments for a dedicated page

| Reason | Detail |
|---|---|
| Conceptual mismatch | GovernanceHub is currently a 12-tab page covering Stage Gates, Audit Trail, Board Reports, Constitutional Governance, Succession Planning, Stakeholder Alignment, Board Decisions, Institutional Memory, Compliance, Advanced Stakeholders, FEDSILK, and Contracts. FEDSILK sits alongside compliance checklists and board reports as if it were the same category of governance tool. It is not — it is a proprietary technology module with its own lifecycle. |
| Discoverability | The sidebar entry `/governance/fedsilk` already creates a dedicated navigation path but the route doesn't activate the correct tab. A dedicated page would fix this and allow deep-linking. |
| Future persistence | When FEDSILK gains database persistence and a tRPC router, it will need venture-scoped routing (`/governance/fedsilk/:ventureId`). A standalone page makes this straightforward; the current tab embed would require rethinking. |
| Audience | The rest of GovernanceHub serves a board/legal governance audience. FEDSILK serves a technical/commercial audience (consortium managers, IP counsel, commercial directors). Separate pages allow separate access controls. |

### Arguments for keeping it merged

| Reason | Detail |
|---|---|
| Low phase-2 footprint | For a demo it is sufficient; the tab works when manually clicked. |
| No IP risk yet | Since FEDSILK is a simulation with no real data, there is no harm in it sharing space with other governance tools temporarily. |

### Verdict

Keep the tab for the immediate Phase 2 demo, but:
1. Fix the routing so `/governance/fedsilk` pre-selects the correct tab.
2. Add a plain-language governance context panel at the top of FedsilkPanel explaining what FEDSILK is and why it is in Governance.
3. Plan a dedicated `/governance/fedsilk` page for Phase 3 once database persistence is added.

---

## 7. Are the Legal Repository, IP Register, Board Reporting, Audit Trail, and Stage-Gate Approvals Correctly Linked to FEDSILK?

**No.** None of the five governance assets are currently linked to FEDSILK.

| Governance asset | Current link status | Gap |
|---|---|---|
| **Legal Repository** (`/governance/legal`, `LegalRequirements` component, `legal_contract_*` tables) | Not linked | FEDSILK consortium participation requires a governing contract. There is no mechanism to attach a contract record to a FEDSILK session or participant. |
| **IP Register** (`/governance/ip`, `ip_assets`, `ip_licenses` tables) | Not linked | M1 (data locality) and M5 (unlearning/exit) are directly IP-relevant. Data contributed by each participant under FEDSILK should map to an IP asset record. Exit events (M5) should trigger an IP repatriation step. Neither happens. |
| **Board Reporting** (Board Reports tab, `finInvestorReports` table) | Not linked | The Board Reports tab has a placeholder "Generate Q2 2026 Board Report" button that fires a toast. FEDSILK accuracy metrics, contribution rankings, and M5 exit history are not included in any report template. |
| **Audit Trail** (Audit Trail tab, `auditLog` table) | Not linked | FEDSILK has its own in-memory M4 ledger. Events do not write to the platform's `auditLog` table. A governance auditor checking the Audit Trail tab will see no FEDSILK activity. |
| **Stage-Gate Approvals** (Stage Gates tab, `cc_stage_gate_reviews`, `vrl_stage_gates` tables) | Not linked | FEDSILK's M2 validation gate (which accepts/rejects model updates) is conceptually a stage gate. It does not create a record in `cc_stage_gate_reviews`. The Governance Signals panel labels an M2 result as "VRL / MRL — Validation Integrity" but this is a display label only; no record is written. |

---

## Summary of Gaps

| # | Gap | Severity | Effort to fix |
|---|---|---|---|
| G1 | Sidebar link `/governance/fedsilk` does not activate the FEDSILK tab | High — causes failed navigation | Low — pass initial tab via URL param or route prop |
| G2 | All FEDSILK state is in-memory; none persisted to database | High — data lost on refresh | High — requires `server/fedsilk.router.ts`, new schema tables |
| G3 | Governance Signals panel reads from simulation, not live VRL/SRL/PRL scores | High — misleads governance users | Medium — wire signals to real tRPC readiness queries |
| G4 | M4 ledger events do not write to platform `auditLog` | Medium — governance audit trail is incomplete | Low–Medium — call `auditLog` insert on each ledger event |
| G5 | No legal contract or IP asset attachable to a FEDSILK session | Medium — breaks IP governance workflow | Medium — add `fedsilk_sessions` table with FK to `legal_contract_records` and `ip_assets` |
| G6 | No stage-gate record created when M2 passes or fails | Medium — stage-gate governance is blind to FEDSILK | Low — write a `cc_stage_gate_reviews` row on round completion |
| G7 | Panel is inaccessible to non-technical governance users | Medium — demo risk | Low — add a plain-language context banner, rename controls |
| G8 | No confirmation on M5 "Exit + Unlearn" action | Low — accidental data loss in demo | Low — add a confirmation dialog |
| G9 | Simulation is not labelled as simulation in the UI | Low — misleads users about data reality | Low — add a "Simulation mode" badge |

---

## Recommended Next Actions (in priority order)

1. **Fix the routing bug (G1)** — `/governance/fedsilk` must activate the FEDSILK tab. Add `?tab=fedsilk` parsing or pass `initialTab="fedsilk"` as a prop from the route. One hour of work.

2. **Add a governance context banner (G7, G9)** — Before the simulation controls, add a text block explaining: what FEDSILK is, that the current view is a simulation, what the five mechanisms protect against, and why this is in Governance. One to two hours.

3. **Write M4 ledger events to `auditLog` (G4)** — Each `appendLedger()` call that currently writes to the in-memory chain should also call the platform's `auditLog` tRPC mutation. This gives governance auditors a single audit trail. Two to four hours, once the route has a `ventureId` context.

4. **Wire Governance Signals to live readiness scores (G3)** — Replace the hardcoded simulation-derived labels in the Governance Signals panel with `trpc.venture.getScores` queries. Half a day.

5. **Create `fedsilk_sessions` and `fedsilk_rounds` tables (G2, G5)** — When the demonstration is ready for production, add database persistence and FK links to `legal_contract_records`, `ip_assets`, and `venture_members`. This is the Phase 3 scope item noted in the README.

---

*End of gap report.*
