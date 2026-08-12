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
- `committedFor(db, ventureId)` — returns `HarnessRow[]` (array, NOT a Map) — use `.find(r => r.groupId === x)` not `.get(x)`.
- `activateAllItems(db, ventureId)` — pre-loads all 15 backlog groups as active.
- `makeHarnessDb(opts)` — basic harness without conflict detection.

**Why:** `makeConflictAwareHarnessDb` does not have `.delete`; attempting to use it for reset positive-control tests throws "db.delete is not a function".

## Pre-existing failing test files (do not touch)
`server/contextual.phase3c.test.ts`, `server/contextual.phase3d.test.ts`, `server/discoveryMarket.router.test.ts`, `server/financialModel.test.ts`, `server/investmentModule.test.ts`, `server/mrl.canonical.test.ts`, `server/sse.test.ts`

## Single-toggle integrity checks (admin.batchReactivation.test.ts)
- `setModuleReactivation` — `written.length !== 1` (silent skip), `groupId` mismatch, `ventureId` mismatch, global scope confirmed under different ventureId, 2-row return — all throw `INTERNAL_SERVER_ERROR` and confirmed covered at lines 1665–1930.

## execVentureReset null-guard (moduleReactivationUtils.ts)
Production code now guards against null/undefined/non-array from `.returning()` with a controlled diagnostic Error (not a silent TypeError). Tests at `admin.moduleReactivation.test.ts` in the `execVentureReset` describe block.

## showConcurrentModificationToast count=0 behaviour
`count = parseInt("0", 10) = 0` is falsy → falls to generic "Another admin changed module settings" copy. Documented in `gate4ToastUtils.test.ts` as intentional behaviour.

## duplicate groupId in batch
Zod schema does NOT reject duplicate groupIds. The second write overwrites the first (upsert semantics). `committedFor` shows only 1 row (the last write wins). `result.upserted` will contain the groupId twice. Documented in `admin.batchReactivation.test.ts`.

## formatToggleAudit with invalid date
`formatToggleAudit(who, "not-a-date")` does not throw — `new Date("not-a-date")` produces an Invalid Date; `toLocaleDateString`/`toLocaleTimeString` return "Invalid Date" strings. Returns non-null string. Documented in `gate4.auditTrailLiveUpdate.test.ts`.

## rowsToActivatedSet empty-string ventureId
`""` is not null → enters venture-fallback branch; no rows match `ventureId=""` → returns only global rows. Same final set as `null` when no venture rows exist, but different code path. Documented in `gate4.persistRoundTrip.test.ts`.

## GlobalVentureSelector branch coverage
All branches covered by two test files:
- `GlobalVentureSelector.disabled.test.tsx` (9 tests): disabled prop, dropdown open/close.
- `GlobalVentureSelector.states.test.tsx` (20 tests): loading spinner, empty-list, status badge, hover mouseenter/leave, outside-click close, colour fallback chain, statusColor fallback.

## Sidebar wiring coverage
`Sidebar.wiring.test.tsx` (18 tests) covers:
- `isBatchPending` → `GlobalVentureSelector disabled` prop (#142)
- global scope (null venture): renders, gear button works, panel opens
- `ReactivationPanel` panel lifecycle: open/close, selector stays mounted
- X close button at line 701 fires `onClose` and closes the panel
- Global scope panel shows "global defaults" copy, not venture-name copy

## All targeted test suites — final pass counts (all clean, 3126 total passing)
- `admin.batchReactivation.test.ts`: 98 tests (+ duplicate-groupId tests)
- `admin.moduleReactivation.test.ts`: 73 tests (+ null-returning guard)
- `gate4.auditTrailLiveUpdate.test.ts`: 47 tests (+ invalid-date tests)
- `gate4.moduleBadge.test.ts`: 16 tests
- `gate4.persistRoundTrip.test.ts`: 21 tests (+ empty-string ventureId)
- `gate4ReactivationSync.test.ts`: 20 tests
- `gate4.singleToggleConflict.test.ts`: 11 tests
- `gate4.sourceBadgeLiveUpdate.test.ts`: 31 tests
- `gate4.toastMismatch.test.ts`: 52 tests
- `gate4.toggledByFallback.test.ts`: 32 tests
- `gate4.ventureSwitch.test.ts`: 8 tests
- `schema.export.integrity.test.ts`: 8 tests
- `gate4Config.test.ts` (client): 143 tests
- `gate4ToastUtils.test.ts` (client): 63 tests (+ zero-count test)
- `ExtendedBacklogSection.test.tsx` (client): 61 tests
- `EnableAll.batch.test.tsx` (client): 6 tests
- `Sidebar.rapidToggle.test.tsx` (client): 6 tests
- `Sidebar.gearButton.test.tsx` (client): 6 tests
- `Sidebar.wiring.test.tsx` (client): 18 tests (NEW)
- `GlobalVentureSelector.disabled.test.tsx` (client): 9 tests
- `GlobalVentureSelector.states.test.tsx` (client): 20 tests (NEW)
Total targeted: ~749 tests, all passing.

## Explicit task numbers confirmed covered
#40, #53, #62, #74, #75, #78, #90, #98, #99, #101, #106, #121, #131, #133, #134, #135, #137, #138, #140, #142, #146, #147, #148, #150, #151, #152, #153, #155, #156, #162, #165, #166, #171, #174, #181, #188, #191, #193, #195, #198, #200

## Remaining untested branches (intentionally left)
NavGroupSection collapse/expand, nested-path active matching, root-route special case — all general sidebar navigation, NOT Gate 4 reactivation. Out of scope.
