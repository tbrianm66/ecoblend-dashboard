---
name: Gate 4 batch conflict detection and test harness pattern
description: Optimistic locking guard in setModuleReactivationBatch; how the in-process DB harness is structured for conflict + reset tests
---

## Optimistic locking in setModuleReactivationBatch
`lastKnownMaxToggledAt` (ISO datetime, optional) is sent by the client with every Enable All / Disable All batch call. The server checks for rows modified by a **different** admin (`ne(toggledBy, currentAdmin)`) after that cutoff (`gt(toggledAt, cutoff)`) before entering the transaction. Throws `TRPCError({ code: "CONFLICT" })` with the affected group IDs and editor names so the client can surface a targeted toast.

**Why:** Silent overwrite of concurrent edits was the risk; the guard is opt-in so older clients continue to work without it.

**How to apply:** Client computes `max(row.toggledAt)` across `serverRows` before calling `reactivateAll`/`deactivateAll`, sends as `lastKnownMaxToggledAt`. The `onError` handler in `gate4Config.ts` detects `"Concurrent modification detected"` prefix and routes to `onError([], rawMessage)` rather than the skipped-groups path.

## Test harness helpers (admin.batchReactivation.test.ts)
- `makeHarnessDb(opts?)` — builds an in-process DB mock for the batch transaction; tracks committed rows via `committedFor(db, ventureId)`.
- `makeConflictOnlyMock(conflictRows)` — satisfies only the SELECT chain for the pre-transaction conflict check; for tests that expect CONFLICT thrown before the transaction.
- `makeConflictAwareHarnessDb(conflictRows, harnessOpts?)` — wraps `makeHarnessDb` with an additional `select` chain; for tests where conflict check passes and batch proceeds.
- `makeResetDb(deletedRows?)` — satisfies the DELETE chain for `resetVentureModuleReactivations` tests.
- `activateAllItems(active?)` — returns all 15 backlog group items for full-batch tests.

## Gate4 client hook return values
`useGate4Reactivation` returns `isBatchPending` (from `setBatchMutation.isPending`) alongside `resetIsPending`. Both are exposed so the venue selector can be disabled during in-flight mutations.

## normaliseResetVentureId guards
In `moduleReactivationUtils.ts`: whitespace-only is rejected BEFORE the `__global__` sentinel check so `"   "` throws BAD_REQUEST ("must not be blank") rather than being silently normalised. Both whitespace-only and `__global__` throw before any DB write.

## Toast functions added
- `showConcurrentModificationToast(toast, rawMessage)` — parses count from server message, warns with singular/plural phrasing + reload instruction.
- `showResetZeroRowsToast(toast)` — warns "Nothing to reset — already uses global defaults" for zero-row delete result.

## Pre-existing test failures (not introduced by gate4 work)
- `server/contextual.phase3c.test.ts`, `server/contextual.phase3d.test.ts`
- `server/discoveryMarket.router.test.ts`, `server/financialModel.test.ts`
- `server/investmentModule.test.ts`, `server/mrl.canonical.test.ts`, `server/sse.test.ts`
All fail on main before any gate4 changes. Do not try to fix them as part of gate4 work.
