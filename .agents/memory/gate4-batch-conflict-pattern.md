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

## Single-toggle integrity checks (admin.batchReactivation.test.ts)
- `setModuleReactivation` — `written.length !== 1` (silent skip), `groupId` mismatch, `ventureId` mismatch, global scope confirmed under different ventureId, 2-row return — all throw `INTERNAL_SERVER_ERROR` and confirmed covered at lines 1665–1930.

## All targeted test suites — final pass counts (all clean)
- `admin.batchReactivation.test.ts`: 95 tests
- `admin.moduleReactivation.test.ts`: 69 tests
- `gate4.auditTrailLiveUpdate.test.ts`: 43 tests
- `gate4.moduleBadge.test.ts`: 16 tests
- `gate4.persistRoundTrip.test.ts`: 19 tests
- `gate4ReactivationSync.test.ts`: 20 tests
- `gate4.singleToggleConflict.test.ts`: 11 tests
- `gate4.sourceBadgeLiveUpdate.test.ts`: 31 tests
- `gate4.toastMismatch.test.ts`: 52 tests
- `gate4.toggledByFallback.test.ts`: 32 tests
- `gate4.ventureSwitch.test.ts`: 8 tests
- `schema.export.integrity.test.ts`: 8 tests
- `gate4Config.test.ts` (client): 143 tests
- `gate4ToastUtils.test.ts` (client): 62 tests
- `ExtendedBacklogSection.test.tsx` (client): 61 tests
- `EnableAll.batch.test.tsx` (client): 6 tests
- `Sidebar.rapidToggle.test.tsx` (client): 6 tests
- `Sidebar.gearButton.test.tsx` (client): 6 tests
- `GlobalVentureSelector.disabled.test.tsx` (client): 9 tests
Total: 683 targeted tests, all passing.

## Explicit task numbers confirmed covered
#40, #53, #62, #74, #75, #78, #90, #98, #99, #101, #106, #121, #131, #133, #134, #135, #137, #138, #140, #142, #146, #147, #148, #150, #151, #152, #153, #155, #156, #162, #165, #166, #171, #174, #181, #188, #191, #193, #195, #198, #200
