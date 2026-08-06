---
name: Gate 3 — Score Dispute & Escalation Workflow
description: Builder–verifier separation, SCORING_INTEGRITY_REVIEWER role, PRL decoupling from coach leaderboard
---

## Core Rules

**Role system (users.role text field):**
- `"admin"` — existing admin role
- `"scoring_integrity_reviewer"` — Gate 3 new role; guards dispute resolution + updateScores
- `"coach"` / `"founder"` / `"user"` — domain labels, NOT RBAC-enforced system roles in DB

**Procedures (server/_core/trpc.ts):**
- `protectedProcedure` — authenticated only
- `adminProcedure` — admin role only
- `reviewedScoreProcedure` — requires humanReviewedBy + humanReviewedAt fields
- `integrityReviewerProcedure` — admin OR scoring_integrity_reviewer; Gate 3 new

**Why:** FHV-EB-AUD-001 §3 — builder–verifier separation requires independent role with no feedback loop.

## Score Dispute State Machine

```
UNDER_DISPUTE → RESOLVED_UPHELD | RESOLVED_OVERTURNED
```

- RESOLVED_OVERTURNED does NOT overwrite scores; signals a new submitAssessment should be filed
- One active UNDER_DISPUTE per assessment+dimension at a time (enforced in raiseDispute)

## Key Guards

`buildDisputeResolutionGuard` in `server/scoreDispute.router.ts`:
- Blocks non-admin/non-reviewer roles (FORBIDDEN)
- Blocks self-resolution: assessment submitter cannot resolve their own disputes (FORBIDDEN)
- Returns `{ resolvedBy }` from session — never from caller input

**How to apply:** Call before any mutation that finalises/resolves a dispute.

## Coach Leaderboard Formula (Gate 3 §1)

**OLD (removed — rater-is-rated loop):**
`prlComponent×0.40 + commitmentCompletionRate×0.35 + sessionComponent×0.25`

**NEW (objective engagement only):**
`sessionComponent×0.50 + capacityComponent×0.30 + volumeComponent×0.20`
- sessionComponent = min(100, sessionCount × 12)
- capacityComponent = min(100, foundersAssigned × 10)
- volumeComponent = min(100, totalCommitmentsCount × 4) — commitments SET, not completed

avgPrlImprovement and commitmentCompletionRate still stored in snapshot for audit; not in composite.

## Migration

`drizzle/0011_gate3_score_disputes.sql` — creates `score_disputes` table + 3 indexes.
Schema: `scoreDisputes` in drizzle/schema.ts (end of file).

## updateScores

Upgraded from `reviewedScoreProcedure` → `integrityReviewerProcedure`.
Coaches and founders can no longer call this endpoint. Accepts optional `disputeId` to cite authorising dispute.
