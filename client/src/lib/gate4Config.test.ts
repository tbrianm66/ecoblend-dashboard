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
    auth: { me: { useQuery: vi.fn(() => ({ data: null, isLoading: false })) }, logout: { useMutation: vi.fn(() => ({ mutateAsync: vi.fn() })) } },
  },
}));

// ── Stub Sidebar's transitive module-level dependencies ────────────────────────
// These modules are loaded when Sidebar.tsx is imported (for ReactivationPanel).
// The hooks and components they export are never CALLED during ReactivationPanel
// tests (the panel receives everything as props), but the modules must be
// importable to avoid module-resolution errors.
vi.mock("wouter", () => ({
  Link: ({ children }: { children: unknown }) => children,
  useLocation: () => ["/", vi.fn()],
}));
vi.mock("@/contexts/SelectedVentureContext", () => ({
  useSelectedVenture: vi.fn(() => ({
    selectedVenture: null,
    availableVentures: [],
    setSelectedVentureId: vi.fn(),
    loading: false,
  })),
}));
vi.mock("@/contexts/VentureContext", () => ({
  useVentures: vi.fn(() => ({ ventures: [] })),
}));
vi.mock("@/components/GlobalVentureSelector", () => ({ default: () => null }));

// ── Production imports (resolved after mock is registered) ────────────────────
import { trpc } from "@/lib/trpc";
import { useGate4Reactivation, GATE4_BACKLOG_GROUP_IDS } from "./gate4Config";
import { buildRowByGroup, resolveModuleBadge, type ReactivationRow } from "./gate4Utils";
import { showToggleToast, showBatchToast, type ToastApi } from "./gate4ToastUtils";
import { ReactivationPanel } from "@/components/Sidebar";

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

  // ── deactivateAll onError: skipped group names passed to the callback ─────────
  it("deactivateAll() parses skipped group IDs from the error message and passes them to onError", async () => {
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
      result.current.deactivateAll(
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

  // ── deactivateAll onError: empty skippedGroups when message cannot be parsed ──
  it("deactivateAll() passes empty skippedGroups array when the error message has no 'Skipped group(s):' section", async () => {
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
      result.current.deactivateAll(
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

// ── Header badges share the same rows as panel badges ────────────────────────
// Confirms Task #74: the Extended Backlog section-header badge path uses the
// same `rows` reference as the ReactivationPanel row badge path, so both
// update simultaneously when the optimistic overlay is applied.
//
// In production, Sidebar calls useGate4Reactivation() once and passes `rows`
// to both ExtendedBacklogSection (header badges) and ReactivationPanel (row
// badges).  This test verifies that a SINGLE hook instance's `rows` produces
// identical badge states when evaluated through the panel path and the header
// path — confirming they cannot diverge.
describe("useGate4Reactivation — header badges share rows with panel badges (Task #74)", () => {
  let currentRows: ReactivationRow[];
  let mockMutate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    currentRows = [];
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
      admin: { getModuleReactivations: { invalidate: vi.fn() } },
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("panel badge path and header badge path both read 'global' immediately after a global toggle (no refetch)", async () => {
    // Sidebar calls the hook once; both consumers receive the same `rows`.
    const { result } = renderHook(() => useGate4Reactivation(null));

    expect(badgeFrom(result.current.rows, null, GROUP)).toBe("default");

    // Toggle fires (admin clicks inside ReactivationPanel)
    await act(async () => { result.current.reactivate(GROUP); });

    // Panel badge path: buildRowByGroup(rows, ventureId) — used by ReactivationPanel
    const panelBadge = resolveModuleBadge(
      false, false,
      buildRowByGroup(result.current.rows, null).get(GROUP),
    );

    // Header badge path: buildRowByGroup(rows, ventureId) — used by ExtendedBacklogSection
    // Both call the same function with the same `rows`; they MUST agree.
    const headerBadge = resolveModuleBadge(
      false, false,
      buildRowByGroup(result.current.rows, null).get(GROUP),
    );

    expect(panelBadge).toBe("global");
    expect(headerBadge).toBe("global");
    // The two paths are literally identical — they cannot diverge when sharing rows.
    expect(panelBadge).toBe(headerBadge);
  });

  it("panel badge path and header badge path both read 'venture' immediately after a venture toggle (no refetch)", async () => {
    const { result } = renderHook(() => useGate4Reactivation(VENTURE));

    expect(badgeFrom(result.current.rows, VENTURE, GROUP)).toBe("default");

    await act(async () => { result.current.reactivate(GROUP); });

    const panelBadge  = resolveModuleBadge(false, false, buildRowByGroup(result.current.rows, VENTURE).get(GROUP));
    const headerBadge = resolveModuleBadge(false, false, buildRowByGroup(result.current.rows, VENTURE).get(GROUP));

    expect(panelBadge).toBe("venture");
    expect(headerBadge).toBe("venture");
    expect(panelBadge).toBe(headerBadge);
  });

  it("both paths still agree after deactivate() — both read 'venture' (row still present, active=false)", async () => {
    // Start with a venture row already active
    currentRows = [ventureRow(GROUP, VENTURE)];
    const { result } = renderHook(() => useGate4Reactivation(VENTURE));

    await act(async () => { result.current.deactivate(GROUP); });

    // The optimistic row is written with active=false; row still exists → badge is "venture"
    const panelBadge  = resolveModuleBadge(false, false, buildRowByGroup(result.current.rows, VENTURE).get(GROUP));
    const headerBadge = resolveModuleBadge(false, false, buildRowByGroup(result.current.rows, VENTURE).get(GROUP));

    expect(panelBadge).toBe("venture");
    expect(headerBadge).toBe("venture");
    expect(panelBadge).toBe(headerBadge);
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

  // ── Batch tests: reactivateAll / deactivateAll scope isolation ──────────────
  //
  // The batch paths build a map over ALL 15 backlog group IDs at once, keyed by
  // "groupId:ventureId".  The key invariant: optimistic rows injected for venture A
  // must never resolve as "venture" badge when evaluated under venture-B scope —
  // because buildRowByGroup(rows, VENTURE_B) filters for r.ventureId === VENTURE_B
  // or r.ventureId === "__global__", and the ":ven-alpha" keys match neither.
  //
  // IMPORTANT — why we do NOT switch ventures in these scope-isolation tests:
  // The hook's useEffect([serverRows, ventureId]) calls setOptimisticRows(new Map())
  // whenever ventureId changes, clearing the entire overlay before any assertion.
  // Scope isolation must therefore be verified while still on VENTURE_A by evaluating
  // the live rows through VENTURE_B's buildRowByGroup filter — this keeps the overlay
  // active and lets us confirm the ":ven-alpha" entries genuinely cannot reach VENTURE_B.
  //
  // The refetch test (overlay cleared by new serverRows) uses a same-venture rerender
  // after updating currentRows so the effect fires because serverRows changed, not
  // because ventureId changed — proving the two clearing paths are independent.

  // ── Test 3: reactivateAll batch overlay is correctly scoped to venture A ────
  it("reactivateAll(): batch-optimistic entries keyed to venture A do not resolve as 'venture' badge when evaluated under venture-B scope (overlay still live)", async () => {
    // Batch mutation is no-op (never resolves) so the optimistic overlay stays alive
    // for the duration of this test — we are probing the overlay while it is present.
    vi.mocked(trpc.admin.setModuleReactivationBatch.useMutation).mockReturnValue(
      { mutate: vi.fn() } as any,
    );

    // Mount on VENTURE_A; server has only the global seed row.
    const { result } = renderHook(() => useGate4Reactivation(VENTURE_A));

    // Batch-activate all groups while viewing venture A.
    // reactivateAll() synchronously injects optimistic rows keyed `groupId:ven-alpha`.
    await act(async () => {
      result.current.reactivateAll();
    });

    // Sanity: the overlay IS live — venture-A badges show "venture".
    expect(badgeFrom(result.current.rows, VENTURE_A, GROUP)).toBe("venture");

    // Core assertion: evaluate the SAME live rows under VENTURE_B scope.
    // buildRowByGroup(rows, VENTURE_B) only picks up rows where
    // r.ventureId === VENTURE_B or r.ventureId === "__global__".
    // The 15 optimistic entries (all keyed ":ven-alpha") match neither,
    // so every group must resolve to "global" (from the global seed row) — never "venture".
    expect(badgeFrom(result.current.rows, VENTURE_B, GROUP)).toBe("global");

    // Verify all 15 backlog groups: none bleeds a "venture" badge under VENTURE_B scope.
    for (const gid of GATE4_BACKLOG_GROUP_IDS) {
      expect(badgeFrom(result.current.rows, VENTURE_B, gid)).not.toBe("venture");
    }
  });

  // ── Test 4: reactivateAll overlay is cleared when server refetch lands ───────
  // Distinct from Test 3: here we confirm that a new serverRows value (simulating
  // a React Query poll delivering authoritative data) clears the batch overlay and
  // badges revert — without any venture switch.
  it("reactivateAll(): overlay is cleared and badges revert to server-authoritative state when a refetch lands on the same venture", async () => {
    // Batch mutation stays no-op; overlay persists until server refetch clears it.
    vi.mocked(trpc.admin.setModuleReactivationBatch.useMutation).mockReturnValue(
      { mutate: vi.fn() } as any,
    );

    // Mount on VENTURE_A; server has only the global seed row.
    const { result, rerender } = renderHook(() => useGate4Reactivation(VENTURE_A));

    // Batch-activate — overlay now contains 15 rows keyed ":ven-alpha", active:true.
    await act(async () => {
      result.current.reactivateAll();
    });

    // Intermediate assertion: overlay IS present — badge shows "venture" for A.
    expect(badgeFrom(result.current.rows, VENTURE_A, GROUP)).toBe("venture");

    // Simulate server refetch: React Query delivers a fresh (changed) rows reference.
    // We replace currentRows with a new array (same logical data, new JS reference)
    // so serverRows in the hook changes and the useEffect([serverRows, ventureId])
    // fires, calling setOptimisticRows(new Map()) — the authoritative clearing path.
    currentRows = [globalRow(GROUP)]; // new array reference → effect fires on rerender
    await act(async () => { rerender(); });

    // After the refetch, the overlay must be gone — server data is authoritative.
    // Badge reverts from "venture" to "global" (only the global seed row exists).
    expect(badgeFrom(result.current.rows, VENTURE_A, GROUP)).toBe("global");

    // Only the single server-confirmed global row remains; no synthetic rows.
    expect(result.current.rows).toHaveLength(1);
  });

  // ── Test 5: deactivateAll batch overlay is correctly scoped to venture A ─────
  it("deactivateAll(): batch-optimistic entries keyed to venture A do not resolve as 'venture' badge when evaluated under venture-B scope (overlay still live)", async () => {
    // Batch mutation is no-op so the overlay stays live for the duration.
    vi.mocked(trpc.admin.setModuleReactivationBatch.useMutation).mockReturnValue(
      { mutate: vi.fn() } as any,
    );

    // Mount on VENTURE_A; server has only the global seed row.
    const { result } = renderHook(() => useGate4Reactivation(VENTURE_A));

    // Batch-deactivate all groups while viewing venture A.
    // deactivateAll() injects optimistic rows with active:false keyed `groupId:ven-alpha`.
    await act(async () => {
      result.current.deactivateAll();
    });

    // Sanity: the overlay IS live — venture-A badges show "venture" (row exists, active=false).
    expect(badgeFrom(result.current.rows, VENTURE_A, GROUP)).toBe("venture");

    // Core assertion: evaluate the same live rows under VENTURE_B scope.
    // The deactivate overlay entries are keyed ":ven-alpha" and must not resolve
    // as "venture" for VENTURE_B — they are invisible to the venture-B filter.
    expect(badgeFrom(result.current.rows, VENTURE_B, GROUP)).toBe("global");

    // Verify all 15 backlog groups: none shows "venture" under VENTURE_B scope.
    for (const gid of GATE4_BACKLOG_GROUP_IDS) {
      expect(badgeFrom(result.current.rows, VENTURE_B, gid)).not.toBe("venture");
    }
  });

  // ── Test 6: reactivateAll — actual mid-flight venture switch ─────────────────
  // Exercises the real user-visible scenario: admin triggers Enable All on venture A,
  // then switches the selector to venture B before the server responds.
  // The hook must deliver clean venture-B state (no stale A-scoped entries).
  it("reactivateAll(): after switching from venture A to B while the batch is in-flight, venture-B scope shows only server-authoritative rows", async () => {
    // Batch mutation never resolves — models a pending server round-trip.
    vi.mocked(trpc.admin.setModuleReactivationBatch.useMutation).mockReturnValue(
      { mutate: vi.fn() } as any,
    );

    const { result, rerender } = renderHook(
      ({ ventureId }: { ventureId: string }) => useGate4Reactivation(ventureId),
      { initialProps: { ventureId: VENTURE_A } },
    );

    // Enable All on venture A — overlay now contains 15 rows keyed `:ven-alpha`.
    await act(async () => {
      result.current.reactivateAll();
    });

    // Sanity: overlay is active on A.
    expect(badgeFrom(result.current.rows, VENTURE_A, GROUP)).toBe("venture");

    // Admin switches the selector to venture B while the batch is still in-flight.
    // The hook's useEffect([serverRows, ventureId]) fires on the ventureId change
    // and calls setOptimisticRows(new Map()), clearing all stale A-scoped entries.
    await act(async () => {
      rerender({ ventureId: VENTURE_B });
    });

    // After the switch, venture B must show only server-authoritative data.
    // The global seed row gives "global"; no "venture" badge should appear for any group.
    expect(badgeFrom(result.current.rows, VENTURE_B, GROUP)).toBe("global");
    for (const gid of GATE4_BACKLOG_GROUP_IDS) {
      expect(badgeFrom(result.current.rows, VENTURE_B, gid)).not.toBe("venture");
    }
    // Only the server-confirmed global row remains — no synthetic overlay rows.
    expect(result.current.rows).toHaveLength(1);
  });

  // ── Test 7: deactivateAll — actual mid-flight venture switch ─────────────────
  it("deactivateAll(): after switching from venture A to B while the batch is in-flight, venture-B scope shows only server-authoritative rows", async () => {
    // Batch mutation never resolves — models a pending server round-trip.
    vi.mocked(trpc.admin.setModuleReactivationBatch.useMutation).mockReturnValue(
      { mutate: vi.fn() } as any,
    );

    const { result, rerender } = renderHook(
      ({ ventureId }: { ventureId: string }) => useGate4Reactivation(ventureId),
      { initialProps: { ventureId: VENTURE_A } },
    );

    // Disable All on venture A — overlay now contains 15 rows keyed `:ven-alpha`, active:false.
    await act(async () => {
      result.current.deactivateAll();
    });

    // Sanity: overlay is active on A (row exists with active:false → badge "venture").
    expect(badgeFrom(result.current.rows, VENTURE_A, GROUP)).toBe("venture");

    // Admin switches the selector to venture B while the batch is still in-flight.
    await act(async () => {
      rerender({ ventureId: VENTURE_B });
    });

    // After the switch, venture B must show only server-authoritative data.
    // No "venture" badges should appear — the global seed row gives "global".
    expect(badgeFrom(result.current.rows, VENTURE_B, GROUP)).toBe("global");
    for (const gid of GATE4_BACKLOG_GROUP_IDS) {
      expect(badgeFrom(result.current.rows, VENTURE_B, gid)).not.toBe("venture");
    }
    // Only the server-confirmed global row remains — no synthetic overlay rows.
    expect(result.current.rows).toHaveLength(1);
  });

  // ── Test 8: deactivateAll same-venture refetch clears overlay ────────────────
  // Complements Test 4 (reactivateAll refetch); both batch paths must clear the
  // overlay when authoritative server data arrives, regardless of direction.
  it("deactivateAll(): overlay is cleared and badges revert to server-authoritative state when a refetch lands on the same venture", async () => {
    // Batch mutation stays no-op; overlay persists until server refetch clears it.
    vi.mocked(trpc.admin.setModuleReactivationBatch.useMutation).mockReturnValue(
      { mutate: vi.fn() } as any,
    );

    // Mount on VENTURE_A; server has the global seed row.
    const { result, rerender } = renderHook(() => useGate4Reactivation(VENTURE_A));

    // Disable All — overlay contains 15 rows keyed `:ven-alpha`, active:false.
    await act(async () => {
      result.current.deactivateAll();
    });

    // Intermediate: overlay IS present — badge shows "venture" for A (row exists, active=false).
    expect(badgeFrom(result.current.rows, VENTURE_A, GROUP)).toBe("venture");

    // Simulate server refetch: replace currentRows with a new array reference so
    // serverRows in the hook changes on the next render → useEffect fires → overlay cleared.
    currentRows = [globalRow(GROUP)]; // new JS reference; same logical data
    await act(async () => { rerender(); });

    // After the refetch, overlay is gone — server data is authoritative.
    // Badge reverts from "venture" to "global" (only the global seed row exists).
    expect(badgeFrom(result.current.rows, VENTURE_A, GROUP)).toBe("global");

    // Only the server-confirmed global row remains; no synthetic overlay rows.
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

  // ── Global scope guard: mutation must never fire when ventureId is null ──────
  //
  // resetToGlobalDefaults() has an early-return guard: `if (!snapshotVentureId) return`.
  // This test pins that guard so a future refactor cannot silently remove it.
  // All four assertions run in a single renderHook call to keep memory overhead minimal.
  it("resetToGlobalDefaults() is a complete no-op (mutation + callbacks never fire) when ventureId is null (global scope guard)", async () => {
    const onSuccess = vi.fn();
    const onError   = vi.fn();

    // Reset mockResetMutate so it is a plain spy (no custom implementation).
    mockResetMutate.mockReset();

    const { result } = renderHook(() => useGate4Reactivation(null));

    await act(async () => {
      result.current.resetToGlobalDefaults(onSuccess, onError);
    });

    // The early-return guard fires before the mutation is called.
    expect(mockResetMutate).not.toHaveBeenCalled();
    // Neither callback fires — the function returned before reaching them.
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});

// ── Polling interval guarantee: reset button disables within 10 s ─────────────
//
// The hook sets refetchInterval: 10_000 (when panelOpen=true) so that when a
// second admin clears venture overrides in another browser session the reset
// button's disabled state corrects itself within one 10-second polling cycle.
//
// This suite verifies three things:
//   1. useQuery is configured with refetchInterval=10_000 / staleTime=10_000
//      when the panel is open — the timing guarantee cannot regress silently.
//   2. useQuery is NOT polling (refetchInterval=false) when the panel is closed.
//   3. When fake timers advance 10 s and the mock query data changes from
//      "has venture overrides" to "no overrides", the reset button flips from
//      enabled → disabled in the very next render cycle — confirming the
//      end-to-end update path works within the 10-second window.
//
// Why fake timers + data update?
// --------------------------------
// useQuery is mocked at the module boundary (see vi.mock at the top of this
// file).  The mock reads `currentRows` on every render but does not start a
// real React-Query timer.  Advancing fake timers therefore proves that the
// hook forwards the correct refetchInterval to useQuery (the configuration is
// visible in the useQuery call arguments), while the data-update + rerender
// step simulates what happens when that timer fires in production and the poll
// delivers fresh server data.
describe("useGate4Reactivation — reset button disables within 10 s after another admin clears overrides", () => {
  let currentRows: ReactivationRow[];

  beforeEach(() => {
    localStorage.clear();
    currentRows = [globalRow(GROUP), ventureRow(GROUP, VENTURE)];

    vi.mocked(trpc.admin.getModuleReactivations.useQuery).mockImplementation(() => ({
      data: currentRows,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }));
    vi.mocked(trpc.admin.setModuleReactivation.useMutation).mockReturnValue(
      { mutate: vi.fn() } as any,
    );
    vi.mocked(trpc.admin.setModuleReactivationBatch.useMutation).mockReturnValue(
      { mutate: vi.fn() } as any,
    );
    vi.mocked(trpc.admin.resetVentureModuleReactivations.useMutation).mockReturnValue(
      { mutate: vi.fn() } as any,
    );
    vi.mocked(trpc.useUtils).mockReturnValue({
      admin: { getModuleReactivations: { invalidate: vi.fn() } },
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    cleanup();
  });

  // ── 1. Polling configuration: refetchInterval must be 10 000 ms when open ──
  it("useQuery receives refetchInterval=10_000 and staleTime=10_000 when panelOpen=true", () => {
    renderHook(() => useGate4Reactivation(VENTURE, /* panelOpen */ true));

    expect(vi.mocked(trpc.admin.getModuleReactivations.useQuery)).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        refetchInterval: 10_000,
        staleTime: 10_000,
      }),
    );
  });

  // ── 2. Polling is OFF when the panel is closed ──────────────────────────────
  it("useQuery receives refetchInterval=false when panelOpen=false (no background polling)", () => {
    renderHook(() => useGate4Reactivation(VENTURE, /* panelOpen */ false));

    expect(vi.mocked(trpc.admin.getModuleReactivations.useQuery)).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ refetchInterval: false }),
    );
  });

  // ── 3. Button flips enabled → disabled after 10-second polling cycle ────────
  //
  // Scenario: Admin A has the panel open.  Admin B (in another browser window)
  // runs resetToGlobalDefaults(), which deletes all venture-specific rows from
  // the DB.  The next 10-second poll on Admin A's client delivers the updated
  // rows list (no venture overrides).  The reset button must become disabled
  // without a page reload.
  //
  // Step-by-step:
  //   t=0     hook mounts with panelOpen=true; server has venture overrides
  //           → button is ENABLED
  //   t=10 s  fake timers advance; Admin B's reset lands; mock data updated
  //           to return no venture rows; hook re-renders with fresh data
  //           → button is DISABLED
  //
  // Driver component — wires useGate4Reactivation → ReactivationResetButton
  // and re-reads from the mock on every render, so rerendering the driver is
  // equivalent to React Query delivering fresh data after a poll.
  it("reset button flips from enabled to disabled after 10 s when server rows no longer contain venture overrides", async () => {
    vi.useFakeTimers();

    // Driver component reads hook state and passes it straight to the button —
    // identical to how ReactivationPanel wires things in production.
    function PollingDriver({ panelOpen }: { panelOpen: boolean }) {
      const { rows, isLoading, isError } = useGate4Reactivation(VENTURE, panelOpen);
      return React.createElement(ReactivationResetButton, {
        ventureId: VENTURE,
        rows,
        isLoading,
        isError,
        onReset: () => {},
      });
    }

    // t=0: venture has overrides → button starts ENABLED.
    const { getByTestId, rerender: rerenderDriver } = render(
      React.createElement(PollingDriver, { panelOpen: true }),
    );

    expect((getByTestId("reset-btn") as HTMLButtonElement).disabled).toBe(false);

    // ── Simulate Admin B clearing overrides, then 10 s polling cycle fires ───
    // Admin B's reset removed all venture-specific rows from the DB.
    // When the 10 s poll fires, useQuery re-executes and delivers the updated list.
    currentRows = [globalRow(GROUP)]; // only global row remains; no venture rows

    // Advance fake timers by exactly 10 s — this is the maximum wait the spec
    // guarantees.  In production, React Query would fire the refetchInterval
    // callback here and call useQuery again, receiving the updated currentRows.
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });

    // Re-render the driver so it picks up the new currentRows from the mock
    // (simulates the React Query re-render that follows a successful poll).
    await act(async () => {
      rerenderDriver(React.createElement(PollingDriver, { panelOpen: true }));
    });

    // t=10 s: overrides are gone → button must now be DISABLED.
    expect((getByTestId("reset-btn") as HTMLButtonElement).disabled).toBe(true);
    expect(getByTestId("reset-btn").textContent).toContain("Already using global defaults");
  });
});

// ── Drift notice: toggle landed on a different venture ────────────────────────
//
// Scenario: the admin is viewing venture A, clicks a toggle, then switches to
// venture B before the server responds.  When onSuccess fires, snapshotVId is
// still "ven-alpha" but ventureIdRef.current is now "ven-beta".  The panel
// must surface a WARNING toast naming venture A (where the write landed) and
// venture B (where the admin is now looking) — never a plain SUCCESS toast.
//
// Strategy
// --------
// A small panel driver component wires useGate4Reactivation → reactivate(),
// passing a custom onSuccess that calls showToggleToast with a spy ToastApi.
// The mutation mock is deferred: it captures the onSuccess callback and exposes
// it so the test can:
//   1. call reactivate() on venture A (snapshot taken)
//   2. switch the hook to venture B via rerender()
//   3. manually resolve the deferred onSuccess
//   4. assert toast.warning was called with both venture names
//
// The driver uses a React ref for the toast spy so the captured onSuccess
// closure always calls the same stable reference regardless of renders.

describe("ReactivationPanel drift notice — mid-flight venture switch triggers warning toast", () => {
  const VENTURE_A    = "ven-alpha";
  const VENTURE_B    = "ven-beta";
  const VENTURE_A_NAME = "Venture Alpha";
  const VENTURE_B_NAME = "Venture Beta";
  const GROUP_ID     = "discovery";
  const GROUP_LABEL  = "Discovery & Market";

  // Deferred onSuccess handle — set by the mutation mock so the test can resolve it later.
  let deferredOnSuccess: (() => void) | null = null;

  // Panel driver: uses the real useGate4Reactivation hook and calls showToggleToast
  // in the per-row toggle's onSuccess, exactly as ReactivationPanel does in production.
  //
  // `toastRef` is a stable React ref to the toast spy so the captured onSuccess
  // closure picks up the same object even if the component re-renders.
  function PanelDriver({
    ventureId,
    ventureName,
    toastRef,
  }: {
    ventureId: string;
    ventureName: string;
    toastRef: React.MutableRefObject<ToastApi & { calls: Record<string, string[]> }>;
  }) {
    const { reactivate } = useGate4Reactivation(ventureId);
    // ventureNameRef tracks the latest ventureName so the onSuccess closure
    // sees the current value at resolution time (mirrors Sidebar.tsx behaviour).
    const ventureNameRef = React.useRef(ventureName);
    React.useEffect(() => { ventureNameRef.current = ventureName; });
    // ventureIdRef tracks the latest ventureId — same pattern as Sidebar.tsx.
    const ventureIdRef = React.useRef(ventureId);
    React.useEffect(() => { ventureIdRef.current = ventureId; });

    const handleClick = () => {
      const snapshotVId   = ventureId;
      const snapshotVName = ventureName;
      reactivate(GROUP_ID, (svid) => {
        showToggleToast(
          toastRef.current,
          ventureIdRef.current,
          ventureNameRef.current,
          GROUP_LABEL,
          true,
          svid,
          snapshotVName,
        );
      });
    };

    return React.createElement(
      "button",
      { "data-testid": "toggle-btn", onClick: handleClick },
      "Toggle",
    );
  }

  // Toast spy factory — mirrors the one in gate4ToastUtils.test.ts.
  function makeToast(): ToastApi & { calls: Record<string, string[]> } {
    const calls: Record<string, string[]> = { success: [], warning: [], error: [] };
    return {
      calls,
      success: (m) => calls.success.push(m),
      warning: (m) => calls.warning.push(m),
      error:   (m) => calls.error.push(m),
    };
  }

  beforeEach(() => {
    localStorage.clear();
    deferredOnSuccess = null;

    // Mutation mock captures onSuccess so the test controls when it resolves.
    const deferredMutate = vi.fn(
      (_input: unknown, options?: { onSuccess?: () => void }) => {
        deferredOnSuccess = options?.onSuccess ?? null;
      },
    );

    vi.mocked(trpc.admin.getModuleReactivations.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(trpc.admin.setModuleReactivation.useMutation).mockReturnValue(
      { mutate: deferredMutate } as any,
    );
    vi.mocked(trpc.admin.setModuleReactivationBatch.useMutation).mockReturnValue(
      { mutate: vi.fn() } as any,
    );
    vi.mocked(trpc.admin.resetVentureModuleReactivations.useMutation).mockReturnValue(
      { mutate: vi.fn() } as any,
    );
    vi.mocked(trpc.useUtils).mockReturnValue({
      admin: { getModuleReactivations: { invalidate: vi.fn() } },
    } as any);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ── Core contract: warning toast fires when venture drifts mid-toggle ──────
  it("fires toast.warning naming both ventures when the selector changes between click and server response", async () => {
    const toast    = makeToast();
    const toastRef = React.createRef<typeof toast>() as React.MutableRefObject<typeof toast>;
    toastRef.current = toast;

    const { rerender } = render(
      React.createElement(PanelDriver, {
        ventureId:   VENTURE_A,
        ventureName: VENTURE_A_NAME,
        toastRef,
      }),
    );

    // Step 1 — admin clicks the toggle while viewing venture A.
    // Mutation fires but onSuccess is deferred; snapshotVId is now "ven-alpha".
    await act(async () => {
      fireEvent.click(screen.getByTestId("toggle-btn"));
    });

    // Step 2 — admin switches the selector to venture B before the server responds.
    await act(async () => {
      rerender(
        React.createElement(PanelDriver, {
          ventureId:   VENTURE_B,
          ventureName: VENTURE_B_NAME,
          toastRef,
        }),
      );
    });

    // Step 3 — server responds; onSuccess fires with snapshotVId = "ven-alpha"
    // but ventureIdRef.current is now "ven-beta" → drift detected.
    await act(async () => {
      deferredOnSuccess?.();
    });

    // Step 4 — must be a WARNING, never a success toast.
    expect(toast.calls.warning).toHaveLength(1);
    expect(toast.calls.success).toHaveLength(0);
  });

  it("drift warning names the snapshot venture (where the write landed)", async () => {
    const toast    = makeToast();
    const toastRef = { current: toast } as React.MutableRefObject<typeof toast>;

    const { rerender } = render(
      React.createElement(PanelDriver, { ventureId: VENTURE_A, ventureName: VENTURE_A_NAME, toastRef }),
    );

    await act(async () => { fireEvent.click(screen.getByTestId("toggle-btn")); });
    await act(async () => {
      rerender(React.createElement(PanelDriver, { ventureId: VENTURE_B, ventureName: VENTURE_B_NAME, toastRef }));
    });
    await act(async () => { deferredOnSuccess?.(); });

    // The snapshot venture name must appear — this is where the write actually landed.
    expect(toast.calls.warning[0]).toContain(VENTURE_A_NAME);
  });

  it("drift warning names the current venture (where the admin is now looking)", async () => {
    const toast    = makeToast();
    const toastRef = { current: toast } as React.MutableRefObject<typeof toast>;

    const { rerender } = render(
      React.createElement(PanelDriver, { ventureId: VENTURE_A, ventureName: VENTURE_A_NAME, toastRef }),
    );

    await act(async () => { fireEvent.click(screen.getByTestId("toggle-btn")); });
    await act(async () => {
      rerender(React.createElement(PanelDriver, { ventureId: VENTURE_B, ventureName: VENTURE_B_NAME, toastRef }));
    });
    await act(async () => { deferredOnSuccess?.(); });

    // The current venture name must appear — this is where the admin is now looking.
    expect(toast.calls.warning[0]).toContain(VENTURE_B_NAME);
  });

  it("drift warning contains the group label", async () => {
    const toast    = makeToast();
    const toastRef = { current: toast } as React.MutableRefObject<typeof toast>;

    const { rerender } = render(
      React.createElement(PanelDriver, { ventureId: VENTURE_A, ventureName: VENTURE_A_NAME, toastRef }),
    );

    await act(async () => { fireEvent.click(screen.getByTestId("toggle-btn")); });
    await act(async () => {
      rerender(React.createElement(PanelDriver, { ventureId: VENTURE_B, ventureName: VENTURE_B_NAME, toastRef }));
    });
    await act(async () => { deferredOnSuccess?.(); });

    expect(toast.calls.warning[0]).toContain(GROUP_LABEL);
  });

  // ── No drift: success toast fires when venture does not change mid-toggle ──
  it("fires toast.success (no warning) when the venture selector does not change between click and response", async () => {
    const toast    = makeToast();
    const toastRef = { current: toast } as React.MutableRefObject<typeof toast>;

    render(
      React.createElement(PanelDriver, { ventureId: VENTURE_A, ventureName: VENTURE_A_NAME, toastRef }),
    );

    // Click then immediately resolve — no venture switch.
    await act(async () => { fireEvent.click(screen.getByTestId("toggle-btn")); });
    await act(async () => { deferredOnSuccess?.(); });

    expect(toast.calls.success).toHaveLength(1);
    expect(toast.calls.warning).toHaveLength(0);
    expect(toast.calls.success[0]).toContain(VENTURE_A_NAME);
  });
});

// ── ReactivationPanel props-refactor: injected callbacks fire correctly ────────
//
// Task #74 refactored ReactivationPanel from owning its own useGate4Reactivation
// call to receiving all hook values as props from Sidebar.  This removes the
// stale-rows bug but means every interactive button in the panel now depends on
// externally-injected callbacks.  These tests render the real exported
// ReactivationPanel component with spy callbacks and verify:
//
//   1. Clicking a row's toggle button calls reactivate(groupId, fn, fn) when OFF.
//   2. Clicking a row's toggle button calls deactivate(groupId, fn, fn) when ON.
//   3. Clicking "Enable All"  calls reactivateAll(fn, fn).
//   4. Clicking "Disable All" calls deactivateAll(fn, fn).
//   5. None of the above callbacks fire when venturesLoading=true.
//   6. None of the above callbacks fire when ventureId is set but ventureName is
//      absent (transient window between venture selection and name resolution).
//
// Strategy
// --------
// ReactivationPanel is now exported from Sidebar.tsx and rendered directly.
// If the prop interface changes, the component wiring changes, or a callback
// is dropped/misdirected, the relevant test will fail immediately.

describe("ReactivationPanel props-refactor — injected callbacks fire correctly", () => {
  // The first BACKLOG_GROUP — stable because the list is a static constant.
  const FIRST_GROUP_ID = "venture-intake";

  // Minimal base props shared across tests.  Overridden per-test as needed.
  function makeProps(overrides: Partial<React.ComponentProps<typeof ReactivationPanel>> = {}) {
    return {
      onClose:               vi.fn(),
      ventureId:             null as string | null,
      ventureName:           undefined as string | undefined,
      ventureColor:          undefined as string | undefined,
      venturesLoading:       false,
      rows:                  [] as ReactivationRow[],
      isLoading:             false,
      isError:               false,
      isActivated:           vi.fn().mockReturnValue(false),
      reactivate:            vi.fn(),
      deactivate:            vi.fn(),
      reactivateAll:         vi.fn(),
      deactivateAll:         vi.fn(),
      resetToGlobalDefaults: vi.fn(),
      ...overrides,
    };
  }

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ── 1. Toggle OFF → ON: reactivate(groupId, onSuccess, onError) fires ──────
  // The panel always calls reactivate with three arguments: the groupId, an
  // onSuccess closure (for the success toast), and an onError closure (for
  // showToggleErrorToast).  Verifying all three arguments confirms the
  // post-refactor wiring is intact.
  it("clicking the toggle button on an OFF group calls reactivate(groupId, fn, fn)", () => {
    const props = makeProps({ isActivated: vi.fn().mockReturnValue(false) });
    render(React.createElement(ReactivationPanel, props));

    fireEvent.click(screen.getByTestId(`toggle-${FIRST_GROUP_ID}`));

    expect(props.reactivate).toHaveBeenCalledOnce();
    expect(props.reactivate).toHaveBeenCalledWith(
      FIRST_GROUP_ID,
      expect.any(Function),   // onSuccess → handleToggleToast
      expect.any(Function),   // onError → showToggleErrorToast
    );
    expect(props.deactivate).not.toHaveBeenCalled();
  });

  // ── 2. Toggle ON → OFF: deactivate(groupId, onSuccess, onError) fires ──────
  it("clicking the toggle button on an ON group calls deactivate(groupId, fn, fn)", () => {
    // Make the first group active so its button reads "On".
    const isActivated = vi.fn((id: string) => id === FIRST_GROUP_ID);
    const props = makeProps({ isActivated });
    render(React.createElement(ReactivationPanel, props));

    fireEvent.click(screen.getByTestId(`toggle-${FIRST_GROUP_ID}`));

    expect(props.deactivate).toHaveBeenCalledOnce();
    expect(props.deactivate).toHaveBeenCalledWith(
      FIRST_GROUP_ID,
      expect.any(Function),   // onSuccess → handleToggleToast
      expect.any(Function),   // onError → showToggleErrorToast
    );
    expect(props.reactivate).not.toHaveBeenCalled();
  });

  // ── 3. Toggle routes to the correct groupId regardless of which row ──────────
  // Clicking a different row's button must pass THAT row's groupId, not a
  // hard-coded value.  We use the "discovery" group (second BACKLOG_GROUP).
  it("clicking a different row's toggle passes that row's groupId to reactivate", () => {
    const props = makeProps({ isActivated: vi.fn().mockReturnValue(false) });
    render(React.createElement(ReactivationPanel, props));

    fireEvent.click(screen.getByTestId("toggle-discovery"));

    expect(props.reactivate).toHaveBeenCalledWith(
      "discovery",
      expect.any(Function),
      expect.any(Function),
    );
  });

  // ── 4. Enable All: reactivateAll(onSuccess, onError) fires ──────────────────
  // Production code: reactivateAll(svid => handleBatchToast(...), (skipped, raw) => ...)
  it("clicking Enable All calls reactivateAll with success and error callbacks", () => {
    const props = makeProps();
    render(React.createElement(ReactivationPanel, props));

    fireEvent.click(screen.getByTestId("enable-all-btn"));

    expect(props.reactivateAll).toHaveBeenCalledOnce();
    expect(props.reactivateAll).toHaveBeenCalledWith(
      expect.any(Function),   // onSuccess → handleBatchToast(true, ...)
      expect.any(Function),   // onError   → handleBatchErrorToast(...)
    );
    expect(props.deactivateAll).not.toHaveBeenCalled();
  });

  // ── 5. Disable All: deactivateAll(onSuccess, onError) fires ─────────────────
  it("clicking Disable All calls deactivateAll with success and error callbacks", () => {
    const props = makeProps();
    render(React.createElement(ReactivationPanel, props));

    fireEvent.click(screen.getByTestId("disable-all-btn"));

    expect(props.deactivateAll).toHaveBeenCalledOnce();
    expect(props.deactivateAll).toHaveBeenCalledWith(
      expect.any(Function),   // onSuccess → handleBatchToast(false, ...)
      expect.any(Function),   // onError   → handleBatchErrorToast(...)
    );
    expect(props.reactivateAll).not.toHaveBeenCalled();
  });

  // ── 6. venturesLoading=true: all buttons disabled, no callbacks fired ────────
  // When the venture list is still loading, actionsDisabled=true.  The real
  // panel sets `disabled={actionsDisabled}` on every button; React will not
  // invoke onClick on a disabled button even when fireEvent.click is used.
  it("no callback fires on any button when venturesLoading=true (actionsDisabled guard)", () => {
    const props = makeProps({ venturesLoading: true });
    render(React.createElement(ReactivationPanel, props));

    // Buttons must be disabled.
    expect((screen.getByTestId(`toggle-${FIRST_GROUP_ID}`) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId("enable-all-btn")           as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId("disable-all-btn")          as HTMLButtonElement).disabled).toBe(true);

    // fireEvent.click should not reach onClick on a disabled button.
    fireEvent.click(screen.getByTestId(`toggle-${FIRST_GROUP_ID}`));
    fireEvent.click(screen.getByTestId("enable-all-btn"));
    fireEvent.click(screen.getByTestId("disable-all-btn"));

    expect(props.reactivate).not.toHaveBeenCalled();
    expect(props.deactivate).not.toHaveBeenCalled();
    expect(props.reactivateAll).not.toHaveBeenCalled();
    expect(props.deactivateAll).not.toHaveBeenCalled();
  });

  // ── 7. ventureId set but ventureName absent: all buttons disabled, no callbacks
  // Models the transient window where venture selection has changed but the name
  // hasn't resolved yet.  actionsDisabled = venturesLoading || (!!ventureId && !ventureName).
  it("no callback fires on any button when ventureId is set but ventureName is absent", () => {
    const props = makeProps({
      ventureId:       "ven-alpha",
      ventureName:     undefined,    // name not yet resolved
      venturesLoading: false,
    });
    render(React.createElement(ReactivationPanel, props));

    // All buttons must be disabled under the second actionsDisabled condition.
    expect((screen.getByTestId(`toggle-${FIRST_GROUP_ID}`) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId("enable-all-btn")           as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId("disable-all-btn")          as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByTestId(`toggle-${FIRST_GROUP_ID}`));
    fireEvent.click(screen.getByTestId("enable-all-btn"));
    fireEvent.click(screen.getByTestId("disable-all-btn"));

    expect(props.reactivate).not.toHaveBeenCalled();
    expect(props.deactivate).not.toHaveBeenCalled();
    expect(props.reactivateAll).not.toHaveBeenCalled();
    expect(props.deactivateAll).not.toHaveBeenCalled();
  });

  // ── 8. All buttons enabled when venturesLoading=false and ventureName present ─
  it("all buttons are enabled when venturesLoading=false and ventureName is resolved", () => {
    const props = makeProps({
      ventureId:       "ven-alpha",
      ventureName:     "Venture Alpha",
      venturesLoading: false,
    });
    render(React.createElement(ReactivationPanel, props));

    expect((screen.getByTestId(`toggle-${FIRST_GROUP_ID}`) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByTestId("enable-all-btn")           as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByTestId("disable-all-btn")          as HTMLButtonElement).disabled).toBe(false);
  });
});
