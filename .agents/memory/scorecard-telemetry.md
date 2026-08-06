---
name: Scorecard Telemetry Engine
description: H1–H8 kill-criteria monitor (FHV-EB-AUD-001 §4); publicProcedure for reads, protectedProcedure+requireAdmin for mutations.
---

## Architecture

- **Backend**: `server/scorecardTelemetry.router.ts` — computes all 8 hypotheses live from DB; auto-logs kill breaches to `scorecard_kill_alerts`
- **Admin page**: `client/src/pages/AdminScorecardTelemetry.tsx` — route `/admin/scorecard-telemetry`
- **Schema table**: `scorecardKillAlerts` in `drizzle/schema.ts`; migration `0012_gate4_scorecard_telemetry.sql`
- **Hub card**: Added to `AdminHub.tsx` under "System Integrity & Scorecard"

## Procedure pattern (critical)

Reads use `publicProcedure` (consistent with admin.router.ts pattern — no session required).
Mutations use `protectedProcedure` + explicit `requireAdmin(ctx.user.role)` call.
`adminProcedure` alone causes 403 in dev-mode bypass context for reads.

## H1–H8 Data Sources

| Hypothesis | DB source | Kill threshold |
|---|---|---|
| H1 Reproducibility | `score_disputes` — UPHELD/OVERTURNED ratio | < 95% at n ≥ 20 |
| H2 Evidence-Bound | `vrl_assessments.hasUnverifiedInputs` | < 100% |
| H3 Social Venture Parity | `vrl_assessments.scoringProfile` + `isVetoed` | block rate diff > 2× |
| H4 Commercial Viability | `ventures.validationStatus` IN (piloting, scaling), not isInternalLab | 0 of 5 |
| H5 Predictive Signal | First assessment per venture vs current `ventures.vrl` (Pearson r) | r < 0.6 at n ≥ 20 |
| H6 Coaching Integrity | `coaching_commitments` completion rate vs venture vrl (r²) | r² < 0.15 |
| H7 Module Usability | `system_audit_logs` distinct modules per actor in 7-day window | < 6 avg |
| H8 Environmental | `system_audit_logs` SIMILAR TO sustainability keywords + manual flag | any event |

## Kill alert lifecycle

Auto-logged on each `getScorecard` call when threshold breached and no open alert exists for that hypothesis.
Resolved by admin with mandatory resolution note (≥ 10 chars) via `resolveAlert` mutation.
