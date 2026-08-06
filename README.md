# Future Humanity Ventures — Venture Validation OS

**Institutional Author:** Future Humanity Ventures Ltd  
**Document Class:** Platform Overview  
**Version:** v2.0 (Gate 4 — Core Consolidation)  
**Status:** Production — Evidence-First Scoring Enforced

---

## Overview

The **Venture Validation OS** (VOS) is the operational platform for the EcoRace Venture Studio — a dual-readiness scoring system that tracks each portfolio venture against two interlocking scales:

- **VRL (Venture Readiness Level)** — a 10-axis composite (0–9 score) measuring commercial, mission, and structural readiness
- **TRL (Technology Readiness Level)** — a 1–9 hardware/software readiness scale aligned to the MRL (Manufacturing Readiness Level)

The platform enforces **evidence-first scoring** at the data layer. Every VRL dimension score must carry a human-confirmed evidence link before it is persisted. This is live and enforced as of Gate 1 (SOW-B02 and SOW-B03, fully merged).

---

## Institutional Authoring

All platform specifications, scoring frameworks, governance documents, and GTM materials associated with this system are attributed to:

> **Future Humanity Ventures Ltd — Institutional Authoring**

No individual is credited as compiler, author, or academic source for any platform specification, GTM appendix, or scoring framework document. Any historical internal drafts that carried individual compiler credits have been superseded by this institutional attribution as of Gate 0 (FHV-EB-AUD-001 §3).

---

## Platform Status — Gate Summary

| Gate | Title | Status |
|------|-------|--------|
| Gate 0 | Documentation, Attribution & Claims Governance | ✅ Complete |
| Gate 1 | SOW-B02 Evidence Enforcement + SOW-B03 Score Integrity | ✅ Complete — Live in Production |
| Gate 2 | MVL Dimension + Profile SV-01 (Social/Software parity) | ✅ Complete |
| Gate 3 | Score Disputes & Integrity Reviewer Governance | ✅ Complete |
| Gate 4 | Core Consolidation & Backlog Archiving | ✅ Complete |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | TypeScript · React · Vite · Tailwind CSS |
| Backend | Node.js · tRPC · Express |
| Database | PostgreSQL · Drizzle ORM |
| Auth | JWT sessions (SESSION_SECRET) · OAuth-ready |
| Package Manager | pnpm |
| Runtime | Node 20 · Replit (development) |

---

## Repository Structure

```
/client          Frontend — pages, components, lib, contexts
/server          Backend — tRPC routers, engines, services
/drizzle         Database schema and migrations
/shared          Shared TypeScript types (workflowStages, etc.)
/docs            Platform documentation and compliance logs
/scripts         Automation and utility scripts
```

---

## Core Modules (Gate 4 — Canonical Five)

These five modules are the authoritative path through the platform. All other modules are in the Extended Backlog or Deferred section (see Gate 4 configuration).

1. **Onboarding** — Founder intake and venture portfolio creation
2. **Experiment Log** — Lean hypothesis testing and invalidation record
3. **Interview Tracker** — Beneficiary discovery with validated signal capture
4. **Venture Model Canvas / VRL** — 10-axis readiness scoring with evidence enforcement
5. **Evidence Ledger** — Confirmed evidence record for all scored dimensions

---

## Scoring Architecture

### VRL (Venture Readiness Level)
- **Scale:** 0–9 (global composite score)
- **Axes:** TRL, MRL, BRL, EcoScore, PRL, IP, FRL, REG, SRL, MVL
- **Profile SV-01:** Governed N/A path for MRL — applies to software/social ventures
- **Evidence gate:** All scores require `evidenceStatus = 'fully_verified'` before confirmation
- **Dispute pathway:** `SCORING_INTEGRITY_REVIEWER` role governs score challenges

### MRL (Manufacturing Readiness Level)
- **Scale:** 1–9 (subsystem composite)
- **Feeds VRL:** Product domain × 0.35, Execution domain × 0.40
- **Profile SV-01 ventures:** MRL contribution governed N/A; does not block VRL

---

## Deferred Infrastructure (Gate 4)

The following speculative modules are **paused pending commercial validation** and are not accessible in the production navigation:

- FEDSILK Attribution Engine (Federated Learning)
- MCP Agent Fleets *(deferred — no live deployment; not claimed as an active feature)*
- Tokenisation Engine
- Growth-as-a-Service (GaaS)

These remain in the codebase for future activation under `reactivationHypothesis` governance.

---

## Compliance Reference

- Audit Document: **FHV-EB-AUD-001 v1.0**
- Gate 0 Compliance Log: `docs/GATE_0_COMPLIANCE_LOG.md`
- Financial Models: `docs/FINANCIAL_MODELS.md`
- User Manual: `docs/USER_MANUAL_V2.md`
- Technical Debt Register: `docs/TECHNICAL_DEBT.md`
