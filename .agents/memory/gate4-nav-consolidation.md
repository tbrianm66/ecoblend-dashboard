---
name: Gate 4 — Core Consolidation & Backlog Archiving
description: Sidebar restructured into 5 sections; 5 core modules pinned; backlog requires reactivationHypothesis; speculative infrastructure deferred.
---

## Sidebar Sections (client/src/components/Sidebar.tsx)

Post-Gate 4 structure — 5 sections in order:
1. **★ CORE WORKFLOW** — 5 canonical modules, always visible, green left-border styling
2. **Command Centre** — Group 1 (dashboard hub), always visible
3. **Extended Backlog** — 15 groups, collapsed by default; each group shown locked unless `isActivated(groupId)` returns true
4. **Deferred (Gate 4)** — FEDSILK, MCP Agent Fleets, Tokenisation, GaaS — locked with strikethrough + DEFERRED badge
5. **Admin** — always visible at bottom

Footer gear icon (⚙) opens the `ReactivationPanel` — admin toggle for `reactivationHypothesis`.

## 5 Canonical Core Modules

Defined in `client/src/lib/gate4Config.ts` as `GATE4_CORE_MODULES`:
1. Onboarding → `/onboarding`
2. Experiment Log → `/discovery/experiments`
3. Interview Tracker → `/interviews`
4. Venture Model Canvas / VRL → `/proposition/venture-model-canvas`
5. Evidence Ledger → `/v2/evidence`

## 4 Deferred Speculative Modules

`GATE4_DEFERRED_MODULES` in gate4Config.ts:
- FEDSILK Attribution → `/governance/fedsilk` (removed from Governance nav group)
- MCP Agent Fleets → `/v2/agents`
- Tokenisation Engine → `#deferred` (not yet implemented)
- Growth-as-a-Service → `#deferred` (not yet implemented)

**Routes are preserved** — only nav visibility is gated.

## reactivationHypothesis

Hook: `useGate4Reactivation(ventureId | null)` from `gate4Config.ts`
Storage: localStorage keys:
- Per-venture: `gate4:reactivated:${ventureId}` → JSON array of groupIds
- Global: `gate4:reactivated:global` → JSON array of groupIds

Backlog groups: `GATE4_BACKLOG_GROUP_IDS` (15 group IDs).

**How to apply:** Only expose the ReactivationPanel to admin users (currently not role-gated in UI — add role check if needed).

## FEDSILK in Sidebar

FEDSILK was item `gov-fedsilk` in the Governance group. It has been **removed from the governance group items** in the new Sidebar.tsx BACKLOG_GROUPS. It now appears only in the DEFERRED section.
