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
import { renderHook, act } from "@testing-library/react";

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

  // ── reactivateAll also triggers invalidate ───────────────────────────────────
  it("reactivateAll() triggers invalidate() via the batch mutation onSuccess", async () => {
    const batchMutate = vi.fn(
      (_input: unknown, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
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
});
