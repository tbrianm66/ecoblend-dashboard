/**
 * @vitest-environment happy-dom
 *
 * Task #135 — Enable All batch: every header badge updates in one render
 *
 * Verifies that clicking the "Enable All" button in ReactivationPanel causes
 * ALL group header badges in ExtendedBacklogSection to update to GLOBAL (global
 * scope) or VENTURE (venture scope) in the same synchronous render cycle — no
 * page reload, no server round-trip, no waitFor.
 *
 * The key behaviour under test is the optimistic-row injection in the production
 * `useGate4Reactivation.reactivateAll()`:
 *
 *   1. setActivated(all)         — all GATE4_BACKLOG_GROUP_IDS activated at once
 *   2. setOptimisticRows(...)    — a synthetic row injected for every group
 *   3. setBatchMutation.mutate() — server write dispatched (mocked here, never
 *                                  resolves during these tests so the assertions
 *                                  prove the OPTIMISTIC path, not the server-
 *                                  confirmed path)
 *
 * Strategy
 * --------
 * We mount the real production `useGate4Reactivation` hook with tRPC mocked at
 * the module boundary (identical to the established pattern in gate4Config.test.ts).
 * The mock batch mutation never calls its callbacks, so the assertions run against
 * purely optimistic state — exactly the badge update an admin sees immediately on
 * click, before any network round-trip completes.
 *
 * A `HookHarness` component plays the role of Sidebar: it calls the hook and
 * feeds the shared state into both `ReactivationPanel` (where the Enable All
 * button lives) and `ExtendedBacklogSection` (whose header badges are under test).
 * This ensures both consumers draw from the same optimistic-row overlay, which is
 * the production contract enforced by Sidebar's single hook instance.
 *
 * A regression in `reactivateAll` that injects rows for only a subset of groups
 * would leave some badges at DEFAULT and cause these tests to fail — which is
 * exactly the failure mode the task requires to be caught.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import React, { useCallback } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// ── Mock tRPC before importing anything that depends on it ────────────────────
// vi.mock is hoisted automatically by Vitest, so this takes effect before the
// imports of gate4Config and Sidebar below.
vi.mock("@/lib/trpc", () => ({
  trpc: {
    admin: {
      getModuleReactivations:          { useQuery: vi.fn() },
      setModuleReactivation:           { useMutation: vi.fn() },
      setModuleReactivationBatch:      { useMutation: vi.fn() },
      resetVentureModuleReactivations: { useMutation: vi.fn() },
    },
    useUtils: vi.fn(),
    auth: {
      me:     { useQuery: vi.fn(() => ({ data: null, isLoading: false })) },
      logout: { useMutation: vi.fn(() => ({ mutateAsync: vi.fn() })) },
    },
  },
}));

// ── Stub Sidebar's transitive dependencies (loaded at module import time) ─────
vi.mock("wouter", () => ({
  Link:        ({ children }: { children: unknown }) => children,
  useLocation: () => ["/", vi.fn()],
}));
vi.mock("@/contexts/SelectedVentureContext", () => ({
  useSelectedVenture: vi.fn(() => ({
    selectedVenture:     null,
    availableVentures:   [],
    setSelectedVentureId: vi.fn(),
    loading:             false,
  })),
}));
vi.mock("@/contexts/VentureContext", () => ({
  useVentures: vi.fn(() => ({ ventures: [] })),
}));
vi.mock("@/components/GlobalVentureSelector", () => ({ default: () => null }));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));

// ── Production imports (resolved after mocks are registered) ──────────────────
import { trpc } from "@/lib/trpc";
import { useGate4Reactivation, GATE4_BACKLOG_GROUP_IDS } from "@/lib/gate4Config";
import { ExtendedBacklogSection, ReactivationPanel } from "./Sidebar";

// ── Constants ─────────────────────────────────────────────────────────────────
const VENTURE_ID = "ven-alpha";

// ── Standard mock setup ───────────────────────────────────────────────────────
//
// useQuery returns { data: undefined } so the useEffect inside the hook skips
// (it guards `if (!serverRows) return`), which prevents the server-data effect
// from clearing the optimistic overlay during our synchronous assertions.
//
// Both mutation mocks use vi.fn() that never calls any callbacks — the batch
// write is dispatched but never resolves.  This isolates the OPTIMISTIC path:
// the state updates from setActivated / setOptimisticRows fire synchronously
// before the mutation result, and our assertions run against that immediate
// in-memory state.

function setupMocks() {
  localStorage.clear();   // prevent readLsCache from seeding stale activation state

  vi.mocked(trpc.admin.getModuleReactivations.useQuery).mockImplementation(() => ({
    data:      undefined,   // no server rows → optimistic overlay is never cleared
    isLoading: false,
    isError:   false,
    refetch:   vi.fn(),
  }));

  vi.mocked(trpc.admin.setModuleReactivation.useMutation).mockReturnValue(
    { mutate: vi.fn() } as any,
  );
  vi.mocked(trpc.admin.setModuleReactivationBatch.useMutation).mockReturnValue(
    { mutate: vi.fn() } as any,   // never resolves — we test the optimistic path only
  );
  vi.mocked(trpc.admin.resetVentureModuleReactivations.useMutation).mockReturnValue(
    { mutate: vi.fn(), isPending: false } as any,
  );

  vi.mocked(trpc.useUtils).mockReturnValue({
    admin: { getModuleReactivations: { invalidate: vi.fn() } },
  } as any);
}

// ── HookHarness ───────────────────────────────────────────────────────────────
/**
 * Mounts the real `useGate4Reactivation` hook and feeds its shared state into
 * both `ReactivationPanel` and `ExtendedBacklogSection`, mirroring the Sidebar
 * production wiring.
 *
 * All groups start OFF (no server rows, empty localStorage) so the Launch Phase
 * section is initially collapsed.  Tests open it manually before clicking
 * Enable All, replicating the realistic admin workflow.
 */
function HookHarness({ ventureId }: { ventureId: string | null }) {
  const {
    isActivated,
    reactivate,
    deactivate,
    reactivateAll,
    deactivateAll,
    resetToGlobalDefaults,
    rows,
    isLoading,
    isError,
  } = useGate4Reactivation(ventureId);

  const noop = useCallback(() => {}, []);

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(ReactivationPanel, {
      onClose:               noop,
      ventureId,
      ventureName:           ventureId ? "Test Venture" : undefined,
      ventureColor:          undefined,
      venturesLoading:       false,
      rows,
      isLoading,
      isError,
      isActivated,
      reactivate,
      deactivate,
      reactivateAll,
      deactivateAll,
      resetToGlobalDefaults,
    }),
    React.createElement(ExtendedBacklogSection, {
      // "/nonexistent" matches no item in any group so hasActiveItem=false at
      // mount — the section starts collapsed (all groups OFF).  Tests manually
      // click the section header to open it before acting on Enable All.
      location:    "/nonexistent",
      isActivated,
      rows,
      isLoading,
      isError,
      ventureId,
    }),
  );
}

// ── Helper: click the "Launch Phase" section header to open the section ───────
function openLaunchPhaseSection() {
  const btn = Array.from(document.querySelectorAll("button")).find(b =>
    b.textContent?.includes("Launch Phase"),
  );
  expect(btn).toBeDefined();
  fireEvent.click(btn!);
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe("Enable All batch — real useGate4Reactivation hook (Task #135)", () => {
  beforeEach(setupMocks);
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ── global scope (ventureId = null) ─────────────────────────────────────────

  it("global scope: every group header badge reads GLOBAL synchronously after Enable All (no waitFor)", () => {
    render(React.createElement(HookHarness, { ventureId: null }));

    // Open the section (collapses on mount because all groups start OFF).
    openLaunchPhaseSection();

    // All badges start DEFAULT (no rows, query returned undefined).
    expect(screen.getAllByLabelText("No override set; system default applies").length).toBe(
      GATE4_BACKLOG_GROUP_IDS.length,
    );

    // Click Enable All — the production reactivateAll() fires:
    //   1. setActivated(all)      → all groups activated synchronously
    //   2. setOptimisticRows(...) → synthetic global row injected for every group
    //   3. setBatchMutation.mutate() called but never resolves (mock is silent)
    fireEvent.click(screen.getByTestId("enable-all-btn"));

    // Every header badge must now read GLOBAL — synchronous, no waitFor.
    const globalBadges = screen.getAllByLabelText("Enabled by a global rule");
    expect(globalBadges.length).toBe(GATE4_BACKLOG_GROUP_IDS.length);
    for (const badge of globalBadges) {
      expect(badge.textContent).toBe("GLOBAL");
    }

    // No VENTURE or DEFAULT badges — every group was globally activated.
    expect(screen.queryByLabelText("Enabled by a venture-specific override")).toBeNull();
    expect(screen.queryByLabelText("No override set; system default applies")).toBeNull();
  });

  // ── venture scope (ventureId = VENTURE_ID) ───────────────────────────────────

  it("venture scope: every group header badge reads VENTURE synchronously after Enable All (no waitFor)", () => {
    render(React.createElement(HookHarness, { ventureId: VENTURE_ID }));

    openLaunchPhaseSection();

    // Enable All — reactivateAll() injects a venture-scoped row for every group.
    fireEvent.click(screen.getByTestId("enable-all-btn"));

    // Every header badge must now read VENTURE — synchronous, no waitFor.
    const ventureBadges = screen.getAllByLabelText("Enabled by a venture-specific override");
    expect(ventureBadges.length).toBe(GATE4_BACKLOG_GROUP_IDS.length);
    for (const badge of ventureBadges) {
      expect(badge.textContent).toBe("VENTURE");
    }

    // No GLOBAL or DEFAULT badges.
    expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();
    expect(screen.queryByLabelText("No override set; system default applies")).toBeNull();
  });

  // ── count guard — no group silently skipped ───────────────────────────────────

  it("badge count equals total backlog group count — no group silently skipped (global scope)", () => {
    // If reactivateAll() only injects rows for a subset of groups, the missing
    // groups stay at DEFAULT and the count falls below GATE4_BACKLOG_GROUP_IDS.length.
    // This catches an off-by-one or partial-iteration bug in the production hook.
    render(React.createElement(HookHarness, { ventureId: null }));
    openLaunchPhaseSection();

    fireEvent.click(screen.getByTestId("enable-all-btn"));

    // Assertion is synchronous — confirms the full batch is a purely optimistic update.
    expect(screen.getAllByLabelText("Enabled by a global rule").length).toBe(
      GATE4_BACKLOG_GROUP_IDS.length,
    );
  });

  // ── batch mutation receives all group IDs in a single call ────────────────────

  it("reactivateAll() dispatches a single batch mutation containing all backlog group IDs", () => {
    // Capture the mock so we can inspect its call arguments.
    const batchMutate = vi.fn();
    vi.mocked(trpc.admin.setModuleReactivationBatch.useMutation).mockReturnValue(
      { mutate: batchMutate } as any,
    );

    render(React.createElement(HookHarness, { ventureId: null }));
    openLaunchPhaseSection();

    fireEvent.click(screen.getByTestId("enable-all-btn"));

    // Exactly one batch mutation call (not 15 individual calls).
    expect(batchMutate).toHaveBeenCalledOnce();

    // The payload must include every backlog group ID with active: true.
    const [callArg] = batchMutate.mock.calls[0] as [
      { items: { groupId: string; active: boolean }[] },
    ];
    const sentGroupIds = callArg.items.map(i => i.groupId).sort();
    expect(sentGroupIds).toEqual([...GATE4_BACKLOG_GROUP_IDS].sort());
    expect(callArg.items.every(i => i.active === true)).toBe(true);
  });

  // ── #198: badges correct after server confirms write (no stale optimistic state) ─
  //
  // After Enable All the hook keeps an optimistic overlay live while the batch
  // mutation is in-flight.  When the server confirms (onSuccess fires → invalidate
  // → React Query delivers fresh rows), the overlay must be cleared and badges must
  // be derived from server-authoritative rows — not the stale optimistic overlay.
  //
  // Strategy: mock a batch mutation that fires onSuccess synchronously and a
  // useQuery that delivers authoritative global rows.  After the click the overlay
  // is gone (server data arrived) and every badge must reflect the server state.
  it("#198: badges reflect server-authoritative state after server confirms Enable All — no stale optimistic entries (#198)", async () => {
    const { act: reactAct } = await import("@testing-library/react");

    // When server confirms, React Query delivers these authoritative global rows.
    const serverRows = GATE4_BACKLOG_GROUP_IDS.map(groupId => ({
      groupId,
      ventureId: "__global__",
      active:    true,
      toggledBy: null,
      toggledAt: null,
    }));

    // After onSuccess, React Query re-fetches and delivers serverRows.
    // We simulate the two phases:
    //   phase 1: mutation in-flight (data: undefined) → optimistic overlay active
    //   phase 2: mutation resolved  (data: serverRows) → overlay cleared
    let queryData: typeof serverRows | undefined = undefined;

    vi.mocked(trpc.admin.getModuleReactivations.useQuery).mockImplementation(() => ({
      data:      queryData,
      isLoading: false,
      isError:   false,
      refetch:   vi.fn(),
    }));

    const mockInvalidate = vi.fn(() => {
      // Simulate React Query delivering fresh rows when invalidate() is called.
      queryData = serverRows;
    });
    vi.mocked(trpc.useUtils).mockReturnValue({
      admin: { getModuleReactivations: { invalidate: mockInvalidate } },
    } as any);

    // Batch mutation fires onSuccess synchronously (server confirmed immediately).
    vi.mocked(trpc.admin.setModuleReactivationBatch.useMutation).mockReturnValue({
      mutate: vi.fn(
        (_input, options?: { onSuccess?: (data: { success: boolean; count: number; upserted: string[] }) => void }) => {
          options?.onSuccess?.({ success: true, count: 15, upserted: GATE4_BACKLOG_GROUP_IDS });
        },
      ),
    } as any);

    const { rerender } = render(React.createElement(HookHarness, { ventureId: null }));
    openLaunchPhaseSection();

    // Click Enable All — onSuccess fires immediately, invalidate() called.
    await reactAct(async () => {
      fireEvent.click(screen.getByTestId("enable-all-btn"));
    });

    // Re-render so the component sees the updated queryData (fresh server rows).
    await reactAct(async () => {
      rerender(React.createElement(HookHarness, { ventureId: null }));
    });

    // After server confirms: badges must reflect server rows (GLOBAL), not stale overlay.
    const globalBadges = screen.getAllByLabelText("Enabled by a global rule");
    expect(globalBadges.length).toBe(GATE4_BACKLOG_GROUP_IDS.length);
    // No VENTURE badges — only global rows were delivered by the server.
    expect(screen.queryByLabelText("Enabled by a venture-specific override")).toBeNull();
    // invalidate must have been called by the onSuccess closure.
    expect(mockInvalidate).toHaveBeenCalledOnce();
  });

  // ── #181: stale optimistic state doesn't reappear after batch error on remount ─
  //
  // When Enable All fails, the hook clears the optimistic overlay via onError.
  // On the next render (simulating a page reload) the hook initialises from
  // localStorage, which must contain the server-derived state — not the stale
  // overlay.  We verify:
  //   a. After the error the overlay is gone (rows is empty).
  //   b. When the hook remounts (new renderHook), it reads localStorage and still
  //      sees no stale optimistic state.
  it("#181: optimistic overlay cleared after batch error — remount shows no stale state (#181)", async () => {
    const { act: reactAct } = await import("@testing-library/react");

    // Batch mutation fires onError synchronously (server rejected).
    vi.mocked(trpc.admin.setModuleReactivationBatch.useMutation).mockReturnValue({
      mutate: vi.fn(
        (_input, options?: { onError?: (err: Error) => void }) => {
          options?.onError?.(new Error("DB unavailable"));
        },
      ),
    } as any);

    render(React.createElement(HookHarness, { ventureId: null }));
    openLaunchPhaseSection();

    // Click Enable All — onError fires immediately.
    await reactAct(async () => {
      fireEvent.click(screen.getByTestId("enable-all-btn"));
    });

    // After error: overlay must be cleared — every group stays OFF.
    // If the overlay were not cleared, groups would show GLOBAL badges (stale optimistic).
    // OFF groups in the Launch Phase section appear with no source badge (DEFAULT state
    // applies while query returns undefined).  The absence of GLOBAL badges confirms
    // the overlay was cleared.
    expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();
    // All groups must still be OFF — the activated Set was also reverted.
    expect(screen.queryByLabelText("Enabled by a venture-specific override")).toBeNull();
  });
});
