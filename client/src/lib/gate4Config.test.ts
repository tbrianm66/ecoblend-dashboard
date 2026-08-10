/**
 * @vitest-environment happy-dom
 *
 * Gate 4 — useGate4Reactivation hook integration test (Task #53)
 *
 * Verifies the live-update path that drives the GLOBAL/VENTURE/DEFAULT
 * source badge in the ReactivationPanel:
 *
 *   1. Calling reactivate() fires utils.admin.getModuleReactivations.invalidate()
 *      → This test FAILS if that invalidate() call is removed from the hook.
 *
 *   2. When the query refetch delivers new rows (venture row added), the hook's
 *      `rows` updates and the badge computed from it transitions GLOBAL → VENTURE.
 *
 *   3. When the query refetch removes venture rows (reset), the badge reverts
 *      VENTURE → GLOBAL without a page reload.
 *
 * Strategy
 * --------
 * We use `renderHook` from @testing-library/react to mount the real production
 * `useGate4Reactivation` hook in a happy-dom environment, with tRPC mocked at the
 * module boundary.  The mock for `useMutation` calls its `onSuccess` callback
 * synchronously, so we can assert on the invalidate spy immediately after act().
 * The "refetch" is simulated by updating the mocked query data and calling
 * rerender() — the hook re-reads from the mock on every render cycle, exactly
 * as React Query would deliver fresh data after a cache invalidation.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderHook, render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react";

// ── Mock tRPC before importing anything that depends on it ────────────────────
// vi.mock is hoisted automatically by Vitest, so this takes effect before the
// import of gate4Config below.
vi.mock("@/lib/trpc", () => ({
  trpc: {
    admin: {
      getModuleReactivations:         { useQuery: vi.fn() },
      setModuleReactivation:          { useMutation: vi.fn() },
      setModuleReactivationBatch:     { useMutation: vi.fn() },
      resetVentureModuleReactivations:{ useMutation: vi.fn() },
    },
    useUtils: vi.fn(),
  },
}));

// ── Production imports (resolved after mock is registered) ────────────────────
import { trpc } from "@/lib/trpc";
import { useGate4Reactivation } from "./gate4Config";
import { buildRowByGroup, resolveModuleBadge, type ReactivationRow } from "./gate4Utils";

// ── Row factories ─────────────────────────────────────────────────────────────
function globalRow(groupId: string, active = true): ReactivationRow {
  return { groupId, ventureId: "__global__", active, toggledBy: null, toggledAt: new Date() };
}
function ventureRow(groupId: string, ventureId: string, active = true): ReactivationRow {
  return { groupId, ventureId, active, toggledBy: null, toggledAt: new Date() };
}

// ── Badge helper (uses the same production functions as the component) ─────────
function badgeFrom(rows: ReactivationRow[], ventureId: string, groupId: string) {
  return resolveModuleBadge(false, false, buildRowByGroup(rows, ventureId).get(groupId));
}

const GROUP   = "discovery";
const VENTURE = "ven-alpha";

// ── Test suite ────────────────────────────────────────────────────────────────
describe("useGate4Reactivation — live source-badge update after toggle", () => {
  // Shared mutable query data — the mock reads this reference on every render,
  // so reassigning it before rerender() simulates a React Query refetch.
  let currentRows: ReactivationRow[];
  let mockInvalidate: ReturnType<typeof vi.fn>;
  let mockMutate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();   // prevent readLsCache from seeding stale state

    // Initial server state: only a global row (no per-venture override yet)
    currentRows = [globalRow(GROUP)];

    mockInvalidate = vi.fn();

    // mutate() calls onSuccess synchronously so assertions can run immediately
    mockMutate = vi.fn(
      (_input: unknown, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
      },
    );

    // useQuery — returns whatever `currentRows` holds at render time
    vi.mocked(trpc.admin.getModuleReactivations.useQuery).mockImplementation(() => ({
      data: currentRows,
      isLoading: false,
      isError: false,
    }));

    // useMutation mocks
    vi.mocked(trpc.admin.setModuleReactivation.useMutation).mockReturnValue(
      { mutate: mockMutate } as any,
    );
    vi.mocked(trpc.admin.setModuleReactivationBatch.useMutation).mockReturnValue(
      { mutate: vi.fn() } as any,
    );
    vi.mocked(trpc.admin.resetVentureModuleReactivations.useMutation).mockReturnValue(
      { mutate: vi.fn() } as any,
    );

    // useUtils() returns the invalidate spy
    vi.mocked(trpc.useUtils).mockReturnValue({
      admin: { getModuleReactivations: { invalidate: mockInvalidate } },
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Core contract: invalidate() fires after a toggle ────────────────────────
  it("calls utils.admin.getModuleReactivations.invalidate() after reactivate() succeeds", async () => {
    const { result } = renderHook(() => useGate4Reactivation(VENTURE));

    await act(async () => {
      result.current.reactivate(GROUP);
    });

    // THIS assertion fails if the invalidate() call is removed from the hook's
    // persist() function — the exact behaviour the task requires to be confirmed.
    expect(mockInvalidate).toHaveBeenCalledOnce();
  });

  it("calls invalidate() with the mutation targeting the correct group and active=true", async () => {
    const { result } = renderHook(() => useGate4Reactivation(VENTURE));

    await act(async () => {
      result.current.reactivate(GROUP);
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ groupId: GROUP, active: true }),
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(mockInvalidate).toHaveBeenCalledOnce();
  });

  it("calls invalidate() after deactivate() succeeds", async () => {
    // Start with the group already active so we can deactivate it
    const { result } = renderHook(() => useGate4Reactivation(VENTURE));

    await act(async () => {
      result.current.reactivate(GROUP);   // turn on
    });

    mockInvalidate.mockClear();            // reset spy for the deactivate check

    await act(async () => {
      result.current.deactivate(GROUP);   // turn off
    });

    expect(mockInvalidate).toHaveBeenCalledOnce();
  });

  // ── Badge transition: GLOBAL → VENTURE ─────────────────────────────────────
  it("badge transitions GLOBAL → VENTURE after toggle + simulated refetch", async () => {
    const { result, rerender } = renderHook(() => useGate4Reactivation(VENTURE));

    // Initial: only the global row → badge is "global"
    expect(result.current.rows).toHaveLength(1);
    expect(badgeFrom(result.current.rows, VENTURE, GROUP)).toBe("global");

    // Admin clicks toggle → mutation fires → invalidate() called
    await act(async () => {
      result.current.reactivate(GROUP);
    });
    expect(mockInvalidate).toHaveBeenCalledOnce();

    // React Query re-fetches (simulated: update the mock data + rerender)
    currentRows = [globalRow(GROUP), ventureRow(GROUP, VENTURE)];
    await act(async () => { rerender(); });

    // Hook's `rows` now includes the venture row
    expect(result.current.rows).toHaveLength(2);

    // Badge computed from the updated rows → "venture"
    expect(badgeFrom(result.current.rows, VENTURE, GROUP)).toBe("venture");
  });

  // ── Badge transition: VENTURE → GLOBAL (reset) ─────────────────────────────
  it("badge reverts VENTURE → GLOBAL after reset + simulated refetch (venture rows deleted)", async () => {
    // Setup: start with both rows already in place (venture override active)
    currentRows = [globalRow(GROUP), ventureRow(GROUP, VENTURE)];

    const { result, rerender } = renderHook(() => useGate4Reactivation(VENTURE));

    expect(result.current.rows).toHaveLength(2);
    expect(badgeFrom(result.current.rows, VENTURE, GROUP)).toBe("venture");

    // Reset fires — venture rows deleted on the server;
    // React Query refetch delivers global-only rows
    currentRows = [globalRow(GROUP)];
    await act(async () => { rerender(); });

    expect(result.current.rows).toHaveLength(1);
    expect(badgeFrom(result.current.rows, VENTURE, GROUP)).toBe("global");
  });

  // ── Badge transition: VENTURE → DEFAULT (reset with no global row) ──────────
  it("badge reverts VENTURE → DEFAULT after reset when no global row exists", async () => {
    currentRows = [ventureRow(GROUP, VENTURE)];

    const { result, rerender } = renderHook(() => useGate4Reactivation(VENTURE));

    expect(badgeFrom(result.current.rows, VENTURE, GROUP)).toBe("venture");

    // All rows deleted
    currentRows = [];
    await act(async () => { rerender(); });

    expect(result.current.rows).toHaveLength(0);
    expect(badgeFrom(result.current.rows, VENTURE, GROUP)).toBe("default");
  });

  // ── DEFAULT → GLOBAL (first-ever global toggle) ─────────────────────────────
  it("badge transitions DEFAULT → GLOBAL on the very first global toggle + simulated refetch", async () => {
    currentRows = [];   // no rows at all

    const { result, rerender } = renderHook(() => useGate4Reactivation(null));

    expect(result.current.rows).toHaveLength(0);
    expect(badgeFrom(result.current.rows, null, GROUP)).toBe("default");

    await act(async () => { result.current.reactivate(GROUP); });
    expect(mockInvalidate).toHaveBeenCalledOnce();

    currentRows = [globalRow(GROUP)];
    await act(async () => { rerender(); });

    expect(badgeFrom(result.current.rows, null, GROUP)).toBe("global");
  });

  // ── Badge flips immediately on first toggle (no refetch required) ─────────────
  it("badge flips DEFAULT → GLOBAL immediately after the first toggle, without a simulated refetch", async () => {
    currentRows = [];   // no rows → every group starts DEFAULT

    const { result } = renderHook(() => useGate4Reactivation(null));

    // Before toggle: no server row → DEFAULT
    expect(badgeFrom(result.current.rows, null, GROUP)).toBe("default");

    // Admin clicks the first toggle — no refetch, no rerender
    await act(async () => { result.current.reactivate(GROUP); });

    // Badge must already read "global" via the optimistic overlay, WITHOUT a
    // simulated refetch (i.e. we do NOT call rerender() or update currentRows here).
    // This is the core invariant introduced to prevent the stale-DEFAULT problem.
    expect(badgeFrom(result.current.rows, null, GROUP)).toBe("global");
  });

  it("badge flips DEFAULT → VENTURE immediately when the first venture toggle fires", async () => {
    currentRows = [];   // no rows at all

    const { result } = renderHook(() => useGate4Reactivation(VENTURE));

    expect(badgeFrom(result.current.rows, VENTURE, GROUP)).toBe("default");

    await act(async () => { result.current.reactivate(GROUP); });

    // The synthetic row is venture-scoped; badge should read "venture" immediately.
    expect(badgeFrom(result.current.rows, VENTURE, GROUP)).toBe("venture");
  });

  it("badge remains non-DEFAULT after toggle OFF (second toggle stays GLOBAL)", async () => {
    // Start with a global row already in place (badge starts "global")
    currentRows = [globalRow(GROUP)];

    const { result } = renderHook(() => useGate4Reactivation(null));

    expect(badgeFrom(result.current.rows, null, GROUP)).toBe("global");

    // Toggle OFF — optimistic row written with active: false; badge stays "global"
    await act(async () => { result.current.deactivate(GROUP); });

    // Should still be "global" (row exists, just with active=false) — never reverts to DEFAULT
    expect(badgeFrom(result.current.rows, null, GROUP)).toBe("global");
  });

  // ── reactivateAll also triggers invalidate ───────────────────────────────────
  it("reactivateAll() triggers invalidate() via the batch mutation onSuccess", async () => {
    const batchMutate = vi.fn(
      (_input: unknown, options?: { onSuccess?: (data: { success: boolean; count: number; upserted: string[] }) => void }) => {
        options?.onSuccess?.({ success: true, count: 0, upserted: [] });
      },
    );
    vi.mocked(trpc.admin.setModuleReactivationBatch.useMutation).mockReturnValue(
      { mutate: batchMutate } as any,
    );

    const { result } = renderHook(() => useGate4Reactivation(VENTURE));

    await act(async () => { result.current.reactivateAll(); });

    expect(mockInvalidate).toHaveBeenCalledOnce();
    expect(batchMutate).toHaveBeenCalledWith(
      expect.objectContaining({ ventureId: VENTURE }),
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  // ── reactivateAll onError: skipped group names passed to the callback ─────────
  it("reactivateAll() parses skipped group IDs from the error message and passes them to onError", async () => {
    const skippedIds = ["backlog-team-growth", "backlog-unit-economics"];
    const errorMessage =
      `Batch write incomplete: 13 of 15 group(s) confirmed by the DB. ` +
      `Skipped group(s): ${skippedIds.join(", ")}`;

    const batchMutate = vi.fn(
      (_input: unknown, options?: { onError?: (err: Error) => void }) => {
        options?.onError?.(new Error(errorMessage));
      },
    );
    vi.mocked(trpc.admin.setModuleReactivationBatch.useMutation).mockReturnValue(
      { mutate: batchMutate } as any,
    );

    const { result } = renderHook(() => useGate4Reactivation(VENTURE));

    const receivedSkipped: string[] = [];
    let receivedRaw = "";

    await act(async () => {
      result.current.reactivateAll(
        undefined,
        (skippedGroups, rawMessage) => {
          receivedSkipped.push(...skippedGroups);
          receivedRaw = rawMessage;
        },
      );
    });

    expect(receivedSkipped).toEqual(skippedIds);
    expect(receivedRaw).toContain("Batch write incomplete");
  });

  // ── reactivateAll onError: empty skippedGroups when message cannot be parsed ──
  it("reactivateAll() passes empty skippedGroups array when the error message has no 'Skipped group(s):' section", async () => {
    const batchMutate = vi.fn(
      (_input: unknown, options?: { onError?: (err: Error) => void }) => {
        options?.onError?.(new Error("DB unavailable"));
      },
    );
    vi.mocked(trpc.admin.setModuleReactivationBatch.useMutation).mockReturnValue(
      { mutate: batchMutate } as any,
    );

    const { result } = renderHook(() => useGate4Reactivation(VENTURE));

    const receivedSkipped: string[] = [];

    await act(async () => {
      result.current.reactivateAll(
        undefined,
        (skippedGroups) => { receivedSkipped.push(...skippedGroups); },
      );
    });

    expect(receivedSkipped).toHaveLength(0);
  });
});

// ── Import the real production reset button ───────────────────────────────────
// ReactivationResetButton owns the disabled-state predicate in production.
// Tests import it directly so any change to the real component's disabled logic
// (adding an in-flight pending state, changing the predicate, etc.) will break
// these tests — not a copy of the logic isolated in a test wrapper.
import { ReactivationResetButton } from "@/components/ReactivationResetButton";

// ── Prop-controlled reset-button tests ────────────────────────────────────────
// Render the real ReactivationResetButton with explicit props so the
// disabled-state predicate is exercised without needing tRPC mocks.
describe("ReactivationResetButton — disabled-state predicate (prop-controlled)", () => {
  afterEach(() => {
    cleanup(); // prevent test-id accumulation across renders
  });

  it("button is enabled when venture-specific overrides exist", () => {
    const rows: ReactivationRow[] = [
      globalRow(GROUP),
      ventureRow(GROUP, VENTURE),
      ventureRow("proposition", VENTURE),
    ];
    render(React.createElement(ReactivationResetButton, {
      ventureId: VENTURE,
      rows,
      isLoading: false,
      isError: false,
      onReset: () => {},
    }));
    expect((screen.getByTestId("reset-btn") as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByTestId("reset-btn").textContent).toContain("Reset to global defaults");
  });

  it("button is disabled when no venture-specific rows exist (query settled, no overrides)", () => {
    const rows: ReactivationRow[] = [globalRow(GROUP)]; // global row only
    render(React.createElement(ReactivationResetButton, {
      ventureId: VENTURE,
      rows,
      isLoading: false,
      isError: false,
      onReset: () => {},
    }));
    expect((screen.getByTestId("reset-btn") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId("reset-btn").textContent).toContain("Already using global defaults");
  });

  it("button stays enabled when isLoading=true and rows=[] (querySettled=false)", () => {
    render(React.createElement(ReactivationResetButton, {
      ventureId: VENTURE,
      rows: [],
      isLoading: true,
      isError: false,
      onReset: () => {},
    }));
    // querySettled=false → alreadyDefault=false even though rows is empty
    expect((screen.getByTestId("reset-btn") as HTMLButtonElement).disabled).toBe(false);
  });

  it("button stays enabled when isError=true and rows=[] (querySettled=false)", () => {
    render(React.createElement(ReactivationResetButton, {
      ventureId: VENTURE,
      rows: [],
      isLoading: false,
      isError: true,
      onReset: () => {},
    }));
    // querySettled=false → alreadyDefault=false even though rows is empty
    expect((screen.getByTestId("reset-btn") as HTMLButtonElement).disabled).toBe(false);
  });

  it("onReset callback is NOT called when button is already disabled", () => {
    const onReset = vi.fn();
    render(React.createElement(ReactivationResetButton, {
      ventureId: VENTURE,
      rows: [], // no overrides → alreadyDefault=true
      isLoading: false,
      isError: false,
      onReset,
    }));
    fireEvent.click(screen.getByTestId("reset-btn"));
    expect(onReset).not.toHaveBeenCalled();
  });

  it("onReset callback IS called when button is enabled and clicked", () => {
    const onReset = vi.fn();
    render(React.createElement(ReactivationResetButton, {
      ventureId: VENTURE,
      rows: [ventureRow(GROUP, VENTURE)], // override exists → enabled
      isLoading: false,
      isError: false,
      onReset,
    }));
    fireEvent.click(screen.getByTestId("reset-btn"));
    expect(onReset).toHaveBeenCalledOnce();
  });
});

// ── Mid-flight venture selector changes ──────────────────────────────────────
// These tests cover the scenario where the admin switches the venture selector
// while a toggle mutation is still in-flight, ensuring the optimistic overlay
// keyed by "groupId:ventureId" cannot cause the badge to show the wrong scope.
describe("useGate4Reactivation — mid-flight venture selector changes", () => {
  const VENTURE_A = "ven-alpha";
  const VENTURE_B = "ven-beta";

  let currentRows: ReactivationRow[];
  let mockInvalidate: ReturnType<typeof vi.fn>;
  let mockMutate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    currentRows = [globalRow(GROUP)];
    mockInvalidate = vi.fn();
    mockMutate = vi.fn(
      (_input: unknown, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
      },
    );
    vi.mocked(trpc.admin.getModuleReactivations.useQuery).mockImplementation(() => ({
      data: currentRows,
      isLoading: false,
      isError: false,
    }));
    vi.mocked(trpc.admin.setModuleReactivation.useMutation).mockReturnValue(
      { mutate: mockMutate } as any,
    );
    vi.mocked(trpc.admin.setModuleReactivationBatch.useMutation).mockReturnValue(
      { mutate: vi.fn() } as any,
    );
    vi.mocked(trpc.admin.resetVentureModuleReactivations.useMutation).mockReturnValue(
      { mutate: vi.fn() } as any,
    );
    vi.mocked(trpc.useUtils).mockReturnValue({
      admin: { getModuleReactivations: { invalidate: mockInvalidate } },
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Test 1: stale optimistic entry for venture A must not leak into venture-B scope ──
  it("stale optimistic entry for venture A does not appear in venture-B scope after the selector switches mid-flight", async () => {
    const { result, rerender } = renderHook(
      ({ ventureId }: { ventureId: string }) => useGate4Reactivation(ventureId),
      { initialProps: { ventureId: VENTURE_A } },
    );

    // Toggle while viewing venture A → synthetic row keyed `GROUP:VENTURE_A` injected
    await act(async () => {
      result.current.reactivate(GROUP);
    });

    // Optimistic overlay is active: badge for venture A reads "venture"
    expect(badgeFrom(result.current.rows, VENTURE_A, GROUP)).toBe("venture");

    // Admin switches the venture selector to B before the server refetch arrives
    await act(async () => {
      rerender({ ventureId: VENTURE_B });
    });

    // The stale venture-A optimistic entry must NOT affect the venture-B badge.
    // Venture B has no server overrides → badge must be "global" (from the global row),
    // never "venture" (which would mean the wrong scope leaked through).
    expect(badgeFrom(result.current.rows, VENTURE_B, GROUP)).toBe("global");
  });

  // ── Test 2: server refetch clears the overlay regardless of current venture ──
  it("optimistic overlay is cleared when the server refetch lands, regardless of which venture is active", async () => {
    const { result, rerender } = renderHook(
      ({ ventureId }: { ventureId: string }) => useGate4Reactivation(ventureId),
      { initialProps: { ventureId: VENTURE_A } },
    );

    // Toggle while viewing venture A → optimistic overlay active
    await act(async () => {
      result.current.reactivate(GROUP);
    });

    // Switch to venture B mid-flight (mutation for venture A is still in-flight)
    await act(async () => {
      rerender({ ventureId: VENTURE_B });
    });

    // Toggle again while viewing venture B → new optimistic entry keyed `GROUP:VENTURE_B`
    await act(async () => {
      result.current.reactivate(GROUP);
    });

    // Optimistic overlay now has a venture-B entry; badge shows "venture"
    expect(badgeFrom(result.current.rows, VENTURE_B, GROUP)).toBe("venture");

    // Server refetch lands — delivers only the global row (no venture overrides confirmed yet)
    // This simulates React Query re-fetching and returning fresh authoritative server data.
    currentRows = [globalRow(GROUP)];
    await act(async () => { rerender({ ventureId: VENTURE_B }); });

    // Overlay must be cleared: the server is authoritative, so the badge reverts to "global"
    expect(badgeFrom(result.current.rows, VENTURE_B, GROUP)).toBe("global");
    // No synthetic/optimistic rows remain — only the single server-confirmed global row
    expect(result.current.rows).toHaveLength(1);
  });
});

// ── Hook + ReactivationResetButton integration tests ─────────────────────────
// A small driver component wires useGate4Reactivation → ReactivationResetButton
// (exactly as ReactivationPanel does in production) so we exercise the full
// mutation pipeline and assert the real button's disabled property.
//
// Driver wires hook → button without duplicating the disabled predicate.
function HookDriverWithResetButton({ ventureId, onError }: {
  ventureId: string;
  onError?: (msg: string) => void;
}) {
  const { resetToGlobalDefaults, rows, isLoading, isError } = useGate4Reactivation(ventureId);
  return React.createElement(ReactivationResetButton, {
    ventureId,
    rows,
    isLoading,
    isError,
    onReset: () => resetToGlobalDefaults(undefined, onError),
  });
}

describe("Reset button — re-enables correctly when reset fails mid-flight (hook integration)", () => {
  let currentRows: ReactivationRow[];
  let currentIsLoading: boolean;
  let currentIsError: boolean;
  let mockInvalidate: ReturnType<typeof vi.fn>;
  let mockResetMutate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();

    // Baseline: venture has its own overrides → button should start enabled.
    currentRows = [
      globalRow(GROUP),
      ventureRow(GROUP, VENTURE),
      ventureRow("proposition", VENTURE),
    ];
    currentIsLoading = false;
    currentIsError = false;

    mockInvalidate = vi.fn();
    mockResetMutate = vi.fn(); // no-op by default; overridden per test

    vi.mocked(trpc.admin.getModuleReactivations.useQuery).mockImplementation(() => ({
      data: currentRows,
      isLoading: currentIsLoading,
      isError: currentIsError,
    }));
    vi.mocked(trpc.admin.setModuleReactivation.useMutation).mockReturnValue(
      { mutate: vi.fn() } as any,
    );
    vi.mocked(trpc.admin.setModuleReactivationBatch.useMutation).mockReturnValue(
      { mutate: vi.fn() } as any,
    );
    vi.mocked(trpc.admin.resetVentureModuleReactivations.useMutation).mockReturnValue(
      { mutate: mockResetMutate } as any,
    );
    vi.mocked(trpc.useUtils).mockReturnValue({
      admin: { getModuleReactivations: { invalidate: mockInvalidate } },
    } as any);
  });

  afterEach(() => {
    cleanup(); // unmount all renders so test-ids don't accumulate
    vi.clearAllMocks();
  });

  // ── Core invariant: button re-enables after async reset failure ───────────
  it("button is NOT disabled after the reset mutation rejects asynchronously (admin can retry)", async () => {
    // Track when onError has actually fired — this is the event we must wait for,
    // not just the synchronous call to mutate().
    let onErrorFired = false;
    mockResetMutate.mockImplementation(
      (_input: unknown, options?: { onError?: (err: Error) => void }) => {
        // Async failure: error arrives after a microtask, modelling a real network roundtrip.
        Promise.resolve().then(() => {
          options?.onError?.(new Error("DB write failed"));
          onErrorFired = true;
        });
      },
    );

    render(React.createElement(HookDriverWithResetButton, { ventureId: VENTURE }));
    const btn = screen.getByTestId("reset-btn") as HTMLButtonElement;

    // Pre-click: overrides exist → button must be enabled.
    expect(btn.disabled).toBe(false);

    // Admin clicks "Reset to global defaults".
    fireEvent.click(btn);

    // Properly wait for the async onError path to have completed — not merely
    // for mutate() to have been called (which happens synchronously on click).
    await waitFor(() => expect(onErrorFired).toBe(true));

    // Post-failure: the DB delete was rejected, so server rows are unchanged.
    // The hook's `rows` still contains venture overrides → button must stay enabled.
    expect((screen.getByTestId("reset-btn") as HTMLButtonElement).disabled).toBe(false);
  });

  // ── onError callback receives the raw server error message ────────────────
  it("onError fires with the raw server message after an async reset failure", async () => {
    const errorMessage = "Permission denied: venture overrides cannot be reset";
    mockResetMutate.mockImplementation(
      (_input: unknown, options?: { onError?: (err: Error) => void }) => {
        Promise.resolve().then(() => options?.onError?.(new Error(errorMessage)));
      },
    );

    let capturedError = "";
    render(React.createElement(HookDriverWithResetButton, {
      ventureId: VENTURE,
      onError: (msg) => { capturedError = msg; },
    }));

    fireEvent.click(screen.getByTestId("reset-btn"));

    await waitFor(() => expect(capturedError).toBe(errorMessage));

    // Button must remain enabled — error path does not clear overrides.
    expect((screen.getByTestId("reset-btn") as HTMLButtonElement).disabled).toBe(false);
  });

  // ── invalidate() must NOT fire on reset failure ───────────────────────────
  it("invalidate() is NOT called when the reset mutation fails", async () => {
    let onErrorFired = false;
    mockResetMutate.mockImplementation(
      (_input: unknown, options?: { onError?: (err: Error) => void }) => {
        Promise.resolve().then(() => {
          options?.onError?.(new Error("server error"));
          onErrorFired = true;
        });
      },
    );

    render(React.createElement(HookDriverWithResetButton, { ventureId: VENTURE }));
    fireEvent.click(screen.getByTestId("reset-btn"));

    await waitFor(() => expect(onErrorFired).toBe(true));

    // invalidate() must not fire on failure — a spurious refetch could momentarily
    // return an empty rows list and incorrectly flip the button to disabled.
    expect(mockInvalidate).not.toHaveBeenCalled();
  });

  // ── rows are not wiped optimistically on reset failure ────────────────────
  it("hook rows still contain venture overrides after a failed reset (no optimistic wipe)", async () => {
    // Async rejection mirrors a real server error path.
    mockResetMutate.mockImplementation(
      (_input: unknown, options?: { onError?: (err: Error) => void }) => {
        Promise.resolve().then(() => options?.onError?.(new Error("DB write failed")));
      },
    );

    const { result } = renderHook(() => useGate4Reactivation(VENTURE));

    // Await the async rejection so the hook has processed the error path.
    await act(async () => {
      result.current.resetToGlobalDefaults();
      await Promise.resolve(); // flush microtask so onError fires inside act
    });

    // Venture-specific rows must still be present — the failed mutation must not
    // wipe them optimistically.
    expect(
      result.current.rows.filter((r: ReactivationRow) => r.ventureId === VENTURE).length
    ).toBeGreaterThan(0);
  });
});
