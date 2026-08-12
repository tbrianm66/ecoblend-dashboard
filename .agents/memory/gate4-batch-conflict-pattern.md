---
name: Gate 4 batch conflict detection and test harness
description: Optimistic locking, DB-unavailable guards, and test helpers for the Gate 4 module reactivation procedures.
---

## Conflict detection
`setModuleReactivationBatch` accepts an optional `lastKnownMaxToggledAt` timestamp.  
If any row for that venture has a `toggledAt` newer than the cutoff, the procedure throws `CONFLICT` with the offending `groupId`s and `modifiedBy` names.  
Client reads this and shows `showConcurrentModificationToast`.

## DB-unavailable guards
All four procedures (`getModuleReactivations`, `setModuleReactivation`, `setModuleReactivationBatch`, `resetVentureModuleReactivations`) call `getDb()` and check for null/undefined.  
- `getModuleReactivations` returns `[]` gracefully (no throw).  
- All three mutations throw `INTERNAL_SERVER_ERROR` with message containing "DB unavailable".  
These guard paths are now explicitly covered by tests in `admin.batchReactivation.test.ts` (four `describe` blocks at the bottom of the file).

## Test helpers in admin.batchReactivation.test.ts
- `makeConflictOnlyMock(conflictRows)` — DB stub that returns conflict rows on the guard query, prevents any writes.
- `makeConflictAwareHarnessDb(conflictRows)` — full transaction harness with conflict detection; supports `.insert`, `.onConflictDoUpdate`, `.set`, `.returning`, `.select`, `.from`, `.where`, `.orderBy`.  Has no `.delete` method.
- `makeResetDb(deletedRows)` — minimal DB stub that satisfies `execVentureReset` (has `.delete`). Use this for positive-control reset tests, NOT `makeConflictAwareHarnessDb`.
- `committedFor(db, ventureId)` — reads committed rows from the harness.
- `activateAllItems(db, ventureId)` — pre-loads all 15 backlog groups as active.
- `makeHarnessDb(opts)` — basic harness without conflict detection.

**Why:** `makeConflictAwareHarnessDb` does not have `.delete`; attempting to use it for reset positive-control tests throws "db.delete is not a function".

## Pre-existing failing test files (do not touch)
`server/contextual.phase3c.test.ts`, `server/contextual.phase3d.test.ts`, `server/discoveryMarket.router.test.ts`, `server/financialModel.test.ts`, `server/investmentModule.test.ts`, `server/mrl.canonical.test.ts`, `server/sse.test.ts`

## Explicit task numbers confirmed covered
#40, #53, #62, #74, #75, #78, #90, #98, #99, #101, #106, #121, #131, #133, #134, #135, #137, #138, #140, #142, #146, #147, #148, #150, #151, #152, #153, #155, #156, #162, #165, #166, #171, #174, #181, #188, #191, #193, #195, #198, #200
