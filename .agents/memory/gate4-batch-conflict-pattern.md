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
These guard paths are explicitly covered in `admin.batchReactivation.test.ts`.

## Test helpers in admin.batchReactivation.test.ts
- `makeConflictOnlyMock(conflictRows)` — DB stub returning conflict rows on the guard query; no writes; **no `.delete` method**.
- `makeConflictAwareHarnessDb(conflictRows)` — full transaction harness with conflict detection; **no `.delete` method**.
- `makeResetDb(deletedRows)` — minimal DB stub with `.delete`; use for reset positive-control tests, NOT `makeConflictAwareHarnessDb`.
- `committedFor(db, ventureId)` — returns `HarnessRow[]` (array, NOT a Map) — use `.find(r => r.groupId === x)` not `.get(x)`.
- `activateAllItems(db, ventureId)` — pre-loads all 15 backlog groups as active.
- `makeHarnessDb(opts)` — basic harness without conflict detection.

**Why:** `makeConflictAwareHarnessDb` does not have `.delete`; attempting to use it for reset positive-control tests throws "db.delete is not a function".

## Pre-existing failing test files (do not touch)
`server/contextual.phase3c.test.ts`, `server/contextual.phase3d.test.ts`, `server/discoveryMarket.router.test.ts`, `server/financialModel.test.ts`, `server/investmentModule.test.ts`, `server/mrl.canonical.test.ts`, `server/sse.test.ts`

## Single-toggle integrity checks
- `setModuleReactivation` — `written.length !== 1` (silent skip), `groupId` mismatch, `ventureId` mismatch, global scope, 2-row return — all throw `INTERNAL_SERVER_ERROR`.

## execVentureReset null-guard
Production code guards against null/undefined/non-array from `.returning()` with a controlled diagnostic Error (not a silent TypeError). Covered in `admin.moduleReactivation.test.ts`.

## Key behavioral invariants (all tested)
- `showConcurrentModificationToast` count=0 is falsy → generic fallback message.
- Duplicate groupId in batch: last write wins (upsert semantics); only 1 row per key.
- `formatToggleAudit` with invalid date: does not throw; returns non-null string.
- `rowsToActivatedSet("")`: enters venture-fallback branch, returns same result as null when no venture rows exist.
- `getModuleReactivations`: returns rows in ascending groupId order.
- `ventureId: null` in batch: rejected by `z.string().optional()` with BAD_REQUEST.
- `[anonymous admin]` fallback in batch: stored when all ctx.user identity fields are null.
- `normaliseResetVentureId("")`, `"   "`, `"\t\t"`: throws BAD_REQUEST "blank or whitespace-only".
- `normaliseSetVentureId("__global__")`: passes through unchanged (truthy, non-blank).
- `showToggleToast`/`showBatchToast`/`showResetToast` drift with `currentVName=undefined`: nowScope falls back to raw `currentVId`.
- `!serverRows` early-return (gate4Config.ts:275): no localStorage write, activatedGroups stays empty, rows stays [].
- `formatToggleAudit` whitespace-only `toggledBy`: treated as identity (truthy, passed verbatim — NOT replaced by "Unknown").
- `rowsToActivatedSet` duplicate global rows: OR semantics (filter+add, not Map); group active if ANY duplicate is active.
- `rowsToActivatedSet` duplicate venture rows: Map last-wins semantics; second row overwrites first.
- `setModuleReactivation` uses `z.string().min(1)` (no whitespace refine), batch uses `.refine(trim().length > 0)` — documented asymmetry.
- `getModuleReactivations` has no try/catch around `db.select()`; DB query errors propagate to tRPC (no silent fallback to []).
- Task refs #133/#134/#135/#137/#140/#152 are covered implicitly (no comment markers needed; tests exist in ExtendedBacklogSection.test.tsx, EnableAll.batch.test.tsx, admin.batchReactivation.test.ts).

## All targeted test suites — final pass counts (3153 total passing)
- `admin.batchReactivation.test.ts`: 101 tests
- `admin.moduleReactivation.test.ts`: 83 tests (+5: Zod schema asymmetry, DB propagation contract)
- `gate4.auditTrailLiveUpdate.test.ts`: 49 tests (+2: whitespace-only toggledBy passes through verbatim)
- `gate4.moduleBadge.test.ts`: 16 tests
- `gate4.persistRoundTrip.test.ts`: 26 tests (+ ordering + empty-string ventureId + duplicate row resolution)
- `gate4ReactivationSync.test.ts`: 20 tests
- `gate4.singleToggleConflict.test.ts`: 11 tests
- `gate4.sourceBadgeLiveUpdate.test.ts`: 31 tests
- `gate4.toastMismatch.test.ts`: 52 tests
- `gate4.toggledByFallback.test.ts`: 32 tests
- `gate4.ventureSwitch.test.ts`: 8 tests
- `schema.export.integrity.test.ts`: 8 tests
- `gate4Config.test.ts` (client): 146 tests (+3: !serverRows early-return guard)
- `gate4ToastUtils.test.ts` (client): 67 tests (+4: currentVName=undefined nowScope fallback in all 3 toast fns)
- `ExtendedBacklogSection.test.tsx` (client): 61 tests
- `EnableAll.batch.test.tsx` (client): 6 tests
- `Sidebar.rapidToggle.test.tsx` (client): 6 tests
- `Sidebar.gearButton.test.tsx` (client): 6 tests
- `Sidebar.wiring.test.tsx` (client): 18 tests (NEW — isBatchPending wiring, X close, global scope)
- `GlobalVentureSelector.disabled.test.tsx` (client): 9 tests
- `GlobalVentureSelector.states.test.tsx` (client): 20 tests (NEW — loading, empty, hover, fallbacks)
Total targeted: ~766 tests, all passing.

## Explicit task numbers confirmed covered
#40, #53, #62, #74, #75, #78, #90, #98, #99, #101, #106, #121, #131, #133, #134, #135, #137, #138, #140, #142, #146, #147, #148, #150, #151, #152, #153, #155, #156, #162, #165, #166, #171, #174, #181, #188, #191, #193, #195, #198, #200

## Comprehensive final sweep verdict
**No truly uncovered user-observable branch remains** in Gate 4 production code. Remaining untested branches are general sidebar navigation (NavGroupSection collapse/expand, active styling) — out of scope.
