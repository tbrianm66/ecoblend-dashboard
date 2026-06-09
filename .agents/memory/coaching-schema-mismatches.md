---
name: Coaching router schema mismatches
description: Known column name mismatches between Drizzle schema definitions and coaching sprint router code.
---

## coachingFrl — week vs weekOf

The `coaching_frl` DB table and Drizzle schema use `week` (not `weekOf`).
Sprint 8688 router (`cohortBenchmark.get`) originally referenced `coachingFrl.weekOf`
which is `undefined` → Drizzle throws "Cannot convert undefined or null to object".
Fix: replace all `coachingFrl.weekOf` → `coachingFrl.week`.

## founderSelfAssessments — no ventureId column

The `founder_self_assessments` table has no `ventureId` column (only `founderId`).
Sprint 9294 `workload.summary` tried to `groupBy(founderSelfAssessments.ventureId)`.
Fix: innerJoin with `founders` table and `groupBy(founders.ventureId)`.
Must import `founders` from drizzle/schema in sprint9294.router.ts.

**Why:** These procedures were written to match a planned schema but the DB was
created with slightly different column names. The bugs were hidden because the
procedures used protectedProcedure and the auth middleware threw 401 before the body ran.
