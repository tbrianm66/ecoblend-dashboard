# EcoBlend OS — Risk Register

**Audit Reference:** FHV-EB-AUD-001 v1.0  
**Document Class:** Governance — Risk & Compliance  
**Institutional Author:** Future Humanity Ventures Ltd — Platform Engineering  
**Version:** 1.1  
**Last Updated:** 2026-08-06  
**Status:** ACTIVE — OPEN ITEMS TRACKED BELOW

---

## Overview

This register tracks all breach findings, resolution status, and residual risks identified under audit FHV-EB-AUD-001 v1.0. Each breach is assigned a severity, an owner, a resolution date, and a verification reference.

**Severity Scale:**

| Level | Definition |
|---|---|
| CRITICAL | Blocks investor, regulatory, or institutional use of the platform |
| HIGH | Materially misrepresents platform capabilities or governance |
| MEDIUM | Internal consistency or documentation quality issue |
| LOW | Minor hygiene; no external visibility risk |

---

## Part 1 — Audit Breach Log

### Breach A — Named Academic Compiler Attribution

| Field | Value |
|---|---|
| **Severity** | HIGH |
| **Description** | Institutional documents, GTM appendices, and platform specifications may have contained named individual compiler or academic author credits, creating a governance and misrepresentation risk if those individuals have not approved the attribution |
| **Root Cause** | Legacy README contained `"🤖 Built and maintained with the help of Manus AI"` — an unintended external tool credit in an institutional document. No academic attribution was found in committed documents. |
| **Status** | ✅ **RESOLVED** |
| **Resolution Date** | 2026-08-06 |
| **Resolution Action** | `README.md` builder credit line removed and replaced with FHV institutional authoring statement. Institutional Attribution Standard published in `README.md`, `docs/USER_MANUAL_V2.md`, `docs/FINANCIAL_MODELS.md`, and `docs/GATE_0_COMPLIANCE_LOG.md`. Full repository scan confirmed no named academic compiler credits exist in any committed institutional document. |
| **Verification Reference** | `docs/GATE_0_COMPLIANCE_LOG.md §1` |
| **Residual Risk** | LOW — If future GTM appendices are committed to the repository, the attribution standard in GATE_0_COMPLIANCE_LOG.md §2 must be applied before merge. |

---

### Breach B — Platform Capability Claims Misalignment

| Field | Value |
|---|---|
| **Severity** | CRITICAL |
| **Description** | Platform documentation and marketing materials referenced capabilities (MCP Agent Fleets, autonomous AI scoring, FEDSILK, Tokenisation, Growth-as-a-Service) without clearly distinguishing live enforced features from deferred or speculative features. Evidence-first scoring and verified score computation were described inconsistently across documents. |
| **Root Cause** | Early-stage capability descriptions were not updated as Gate 1 (SOW-B02 + SOW-B03) was completed. Deferred features were listed alongside live features without status qualifiers. |
| **Status** | ✅ **RESOLVED** |
| **Resolution Date** | 2026-08-06 |
| **Resolution Action** | `docs/USER_MANUAL_V2.md §1.2` created with canonical claims table: Evidence-first scoring and verified score computation marked LIVE AND ENFORCED (Gate 1 complete). MCP Agent Fleets, autonomous AI scoring, FEDSILK, Tokenisation, and GaaS explicitly marked as deferred or not implemented — not claimed. Gate 4 sidebar locks deferred modules with DEFERRED badge. |
| **Verification Reference** | `docs/GATE_0_COMPLIANCE_LOG.md §3`, `docs/USER_MANUAL_V2.md §1.2` |
| **Residual Risk** | LOW — Deferred features remain accessible in Gate 4 DEFERRED sidebar section. If any are reactivated, `USER_MANUAL_V2.md §1.2` must be updated before the feature is communicated externally. |

---

### Breach C — Financial Model Order-of-Magnitude Discrepancy

| Field | Value |
|---|---|
| **Severity** | HIGH |
| **Description** | Two prior internal documents contained contradictory yield figures: "20–30× per successful portfolio company" (Studio Brief, 2025) and "2–3× on capital deployed" (Budget Planning Note, 2025). The apparent order-of-magnitude discrepancy created investor trust and due diligence risk. |
| **Root Cause** | Both figures were computed from the same financial model but applied to different measurement frames (per-venture gross multiple on top-quartile successes vs. blended portfolio MOIC across all ventures). The discrepancy was a labelling error, not a modelling error. |
| **Status** | ✅ **RESOLVED** |
| **Resolution Date** | 2026-08-06 |
| **Resolution Action** | `docs/FINANCIAL_MODELS.md` created. Root cause documented and both figures shown to be internally consistent under their respective frames. Six canonical labelled metrics established (`gross_moic_portfolio`, `net_moic_portfolio`, `irr_portfolio_5yr`, `irr_portfolio_7yr`, `ev_per_venture`, `gross_moic_per_venture`). All future financial communications must use one of these labelled metrics — unlabelled yield figures are prohibited. |
| **Verification Reference** | `docs/GATE_0_COMPLIANCE_LOG.md §4`, `docs/FINANCIAL_MODELS.md §3.2` |
| **Residual Risk** | LOW — Risk is fully mitigated by metric naming convention. The convention must be applied to any new financial model outputs before external communication. |

---

### Breach D — Canonical Domain and Vendor Specification Non-Compliance

Breach D comprised multiple sub-items. Each is tracked separately below.

#### D1–D5 — Non-Canonical Domain References in Codebase

| Field | Value |
|---|---|
| **Severity** | MEDIUM |
| **Description** | Internal codebase contained references to non-canonical domain variants (`ecoblend.studio`, `ecoblend.com`) in schema IDs, test fixtures, and mock data. The canonical institutional domain is `ecoblend.io`. |
| **Root Cause** | Schema identifiers and test fixtures were authored before canonical domain standardisation was established. No automated lint rule enforced domain consistency. |
| **Status** | ✅ **RESOLVED** |
| **Resolution Date** | 2026-08-06 |
| **Resolution Action** | All non-.io domain references in the committed codebase have been updated: (1) JSON Schema `$id` in `server/ipIntelligence.router.ts` updated from `ecoblend.studio` to `ecoblend.io`; (2) Test fixture emails in `server/sprint55.test.ts` updated from `ecoblend.com` to `ecoblend.io`; (3) Test fixture CDN URL in `server/sprint55.test.ts` updated from `cdn.ecoblend.com` to `cdn.ecoblend.io`; (4) Mock context email in `server/investmentModule.test.ts` updated from `ecoblend.studio` to `ecoblend.io`. References in `attached_assets/` (pasted external snapshots, not live code) are not normalised — they are read-only historical artefacts. |
| **Verification Reference** | FHV-EB-AUD-001 v1.0 §2.3 Breach D Cleanup |
| **Note on Redirects** | DNS/router-layer aliases and redirects from `ecoblend.studio` remain in place as required by the audit specification. These are managed at the infrastructure layer and must not be removed. They do not appear in the application codebase. |
| **Residual Risk** | LOW — No remaining non-.io references in active code paths. Future test fixtures and schema identifiers should use `ecoblend.io` by default. |

#### D6 — Stale VRL Weight Comment in MRL Engine

| Field | Value |
|---|---|
| **Severity** | MEDIUM |
| **Description** | Following the dual-pathway MRL weighting fix (Product×0.35 + Execution×0.40), the file header comment in `server/mrl.engine.ts` and the `INTEGRATION_MODEL` export retained a stale `0.30` VRL contribution weight, creating a documentation divergence from the live engine behaviour. |
| **Root Cause** | The VRL dual-pathway fix (commit `345cbb3`) updated the computation logic and added a D6 fix note but did not update the file header or exported constant, leaving documentation out of sync with the live code. |
| **Status** | ✅ **RESOLVED** |
| **Resolution Date** | 2026-06-16 (computation fix); documented 2026-08-06 |
| **Resolution Action** | Engine behaviour was corrected in commit `345cbb3` — `computeVrlContribution` returns 0–1 normalised (not 0–30). The diagnostic report `reports/B02-mrl-trl-mapping-diagnostic.md` documents the full dual-engine provenance, the stale comment locations, and the correct post-fix behaviour. The stale comment is flagged in the diagnostic as a residual documentation divergence (MEDIUM severity, not behavioural). The `mrl_assessments.vrlContribution` schema comment ("MRL - 0.30 contribution to VRL") remains stale as a documentation item only — field behaviour is correct. |
| **Verification Reference** | `reports/B02-mrl-trl-mapping-diagnostic.md §2, §3` |
| **Residual Risk** | LOW — Behaviour is correct. Stale `0.30` comment in file header and schema column comment may mislead future developers. Recommend updating these in the next scheduled maintenance pass. |

#### D7 — MRL Dual-Engine Architecture Without Documented Migration Path

| Field | Value |
|---|---|
| **Severity** | MEDIUM |
| **Description** | Two MRL scoring engines (`server/mrl.engine.ts` and `server/mrlScoring.ts`) were introduced simultaneously at Phase 4A/4C without a documented rationale for their coexistence, divergence in scoring approach, or migration path to a single engine. This created architectural ambiguity and an undocumented scoring split that was not visible to downstream consumers. |
| **Root Cause** | Both engines were committed in the same Phase 4A/4C checkpoint. No architectural decision record explained why two engines existed or which one was authoritative for which pathway. |
| **Status** | ✅ **RESOLVED** |
| **Resolution Date** | 2026-08-06 |
| **Resolution Action** | `reports/B02-mrl-trl-mapping-diagnostic.md` produced a full diagnostic covering: (1) provenance of both engines with commit references; (2) functional comparison of Engine A (`computeCompositeMrlScore`) vs Engine B (`vrl_feed` block in `mrlScoring.ts`); (3) correct post-D6 weight mapping (Product×0.35, Execution×0.40, sum to ≤0.75 of VRL); (4) identification of all stale weight references. The dual-engine architecture is now documented. Consolidation into a single engine is a future engineering concern and is tracked separately. |
| **Verification Reference** | `reports/B02-mrl-trl-mapping-diagnostic.md` |
| **Residual Risk** | MEDIUM — Two engines remain in the codebase. Divergence risk reappears any time one engine is updated without the other. A consolidation task should be scheduled before the platform reaches production scale. |

---

## Part 2 — Key-Person Dependency Risk

### KPD-01 — Scoring Governance Single-Point-of-Failure

| Field | Value |
|---|---|
| **Severity** | HIGH (prior) → MEDIUM (current) |
| **Description** | Prior state: score integrity, dispute resolution, and VRL overrides were accessible only to platform engineers with direct database access. No in-platform governance control separated scoring administrators from regular admins. Any departure of the single engineer with DB access would have left the dispute workflow unresolvable. |
| **Prior Status** | HIGH — Single operator dependency for all score governance functions |
| **Current Status** | ⚠️ **PARTIALLY MITIGATED** |
| **Controls Implemented** | (1) `SCORING_INTEGRITY_REVIEWER` role created in platform RBAC — separate from `admin`, with access only to score dispute review and VRL override sign-off via `integrityReviewerProcedure` middleware; (2) `score_disputes` table + full dispute state machine (`open → under_review → upheld/overturned/dismissed`) implemented and live; (3) `updateScores` procedure gated behind `integrityReviewerProcedure` — raw DB access is no longer required to resolve disputes; (4) H1 kill-criterion in Scorecard Telemetry monitors dispute uphold/overturn ratio (kill threshold <95% with n≥20). |
| **Residual Gap** | `SCORING_INTEGRITY_REVIEWER` role can currently only be assigned via raw SQL — no in-platform admin UI exists. If the only assigned reviewer is unavailable and a dispute requires resolution, a DB engineer must manually assign a replacement reviewer. This is tracked as Task #30. |
| **Resolution Condition** | Task #30 — Admin UI for role assignment deployed. Once an admin can assign/revoke the `SCORING_INTEGRITY_REVIEWER` role through the Users & Roles page without DB access, this item can be downgraded to LOW. |
| **Verification Reference** | `docs/GATE_0_COMPLIANCE_LOG.md §3.2`, `server/_core/trpc.ts` (`integrityReviewerProcedure`), `drizzle/0011_gate3_score_disputes.sql` |

---

### KPD-02 — Module Activation State Consistency (Multi-Admin)

| Field | Value |
|---|---|
| **Severity** | MEDIUM |
| **Description** | Gate 4 module activation states are currently persisted in `localStorage` — meaning different admins on different devices see different module activation configurations. If the primary administrator is unavailable, a second admin may not see the same active/inactive module configuration, creating governance drift. |
| **Current Status** | ⚠️ **OPEN — IN QUEUE** |
| **Mitigation Required** | Module activation states must be persisted in the database and served from a single authoritative source. All admin sessions must reflect the same state. |
| **Resolution Condition** | Task #31 — Database-backed module activation deployed. |
| **Verification Reference** | Gate 4 nav architecture, `client/src/` Gate 4 sidebar component |

---

### KPD-03 — Role Change Auditability

| Field | Value |
|---|---|
| **Severity** | MEDIUM |
| **Description** | Role changes (assignment, revocation) are not currently logged with actor identity and timestamp. If a privileged role is mis-assigned or exploited, there is no audit trail to identify when the change was made or who authorised it. |
| **Current Status** | ⚠️ **OPEN — IN QUEUE** |
| **Mitigation Required** | All role assignment and revocation events must be written to the audit log with actor `userId`, target `userId`, `fromRole`, `toRole`, and `changedAt` timestamp. |
| **Resolution Condition** | Task #33 — Role change audit logging deployed. |
| **Verification Reference** | `drizzle/schema.ts` — `system_audit_logs` table; `server/admin.router.ts` — role update procedures |

---

## Part 3 — Open Risk Items

| ID | Risk | Severity | Status | Resolution Condition |
|---|---|---|---|---|
| KPD-01 | SCORING_INTEGRITY_REVIEWER assignable only via DB | MEDIUM | ⚠️ Open | Task #30 complete |
| KPD-02 | Module activation states in localStorage (multi-admin drift) | MEDIUM | ⚠️ Open | Task #31 complete |
| KPD-03 | No audit trail for role changes | MEDIUM | ⚠️ Open | Task #33 complete |
| D7-residual | MRL dual-engine not yet consolidated | MEDIUM | ⚠️ Open | Engineering consolidation task scheduled |
| D6-residual | Stale `0.30` weight comment in `mrl.engine.ts` header + schema column | LOW | ⚠️ Open | Next maintenance pass |
| Gate-4-PDF | Score dispute status not reflected in PDF export | LOW | ⚠️ Open | PDF export logic updated |

---

## Part 4 — Closed Breach Summary

| Breach | Title | Resolved | Reference |
|---|---|---|---|
| A | Named academic compiler attribution | 2026-08-06 | `docs/GATE_0_COMPLIANCE_LOG.md §1` |
| B | Platform capability claims misalignment | 2026-08-06 | `docs/GATE_0_COMPLIANCE_LOG.md §3`, `docs/USER_MANUAL_V2.md §1.2` |
| C | Financial model order-of-magnitude discrepancy | 2026-08-06 | `docs/GATE_0_COMPLIANCE_LOG.md §4`, `docs/FINANCIAL_MODELS.md §3.2` |
| D1–D5 | Non-canonical domain references in codebase | 2026-08-06 | FHV-EB-AUD-001 v1.0 §2.3 |
| D6 | Stale VRL weight comment in MRL engine | 2026-06-16 / 2026-08-06 | `reports/B02-mrl-trl-mapping-diagnostic.md` |
| D7 | MRL dual-engine architecture undocumented | 2026-08-06 | `reports/B02-mrl-trl-mapping-diagnostic.md` |

---

## Document History

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-08-06 | Future Humanity Ventures Ltd — Platform Engineering | Initial register created under FHV-EB-AUD-001 v1.0 Breach D Cleanup |
| 1.1 | 2026-08-06 | Future Humanity Ventures Ltd — Platform Engineering | Breach A, B, C, D6, D7 formally closed; KPD-01/02/03 governance controls documented |
