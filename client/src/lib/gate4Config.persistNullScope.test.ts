/**
 * @vitest-environment happy-dom
 *
 * Gate 4 — persist() null/global scope optimistic rollback
 *
 * `persist()` in useGate4Reactivation injects a synthetic row to flip the badge
 * immediately.  When `snapshotVentureId` is `null` (global scope), the synthetic
 * row's `ventureId` is normalised to `"__global__"` via:
 *   const syntheticVId = snapshotVentureId ?? "__global__";
 *
 * On server rejection the row must be removed from optimisticRows so the badge
 * reverts.  The existing rollback tests in gate4Config.test.ts cover the non-null
 * venture path; this file covers the null/global path to ensure the
 * `?? "__global__"` branch of the key computation is exercised.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ── Mock tRPC before importing anything that depends on it ────────────────────
vi.mock("../../../client/src/lib/trpc", () => ({
  trpc: {
    admin: {
      getModuleReactivations:       { useQuery: vi.fn() },
      setModuleReactivation:        { useMutation: vi.fn() },
      setModuleReactivationBatch:   { useMutation: vi.fn() },
      resetVentureModuleReactivations: { useMutation: vi.fn() },
    },
    useUtils: vi.fn(),
  },
}));

import { trpc } from "../../../client/src/lib/trpc";
import { useGate4Reactivation } from "../../../client/src/lib/gate4Config";
import type { ReactivationRow } from "../../../client/src/lib/gate4Config";

// ── Test body ─────────────────────────────────────────────────────────────────
describe("useGate4Reactivation — persist() null/global scope rollback", () => {
  const GROUP = "operations";

  let mockInvalidate: ReturnType<typeof vi.fn>;

  function makeErrorMutate(err: Error) {
    return vi.fn(
      (_input: unknown, options?: { onError?: (err: Error) => void }) => {
        options?.onError?.(err);
      },
    );
  }

  beforeEach(() => {
    localStorage.clear();
    mockInvalidate = vi.fn();

    vi.mocked(trpc.admin.getModuleReactivations.useQuery).mockImplementation(() => ({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any));

    vi.mocked(trpc.admin.setModuleReactivationBatch.useMutation).mockReturnValue(
      { mutate: vi.fn(), isPending: false } as any,
    );
    vi.mocked(trpc.admin.resetVentureModuleReactivations.useMutation).mockReturnValue(
      { mutate: vi.fn(), isPending: false } as any,
    );
    vi.mocked(trpc.useUtils).mockReturnValue({
      admin: { getModuleReactivations: { invalidate: mockInvalidate } },
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("null/global scope reactivate(): synthetic __global__ row is removed after server rejection", async () => {
    // Hook rendered with null ventureId (global scope).
    vi.mocked(trpc.admin.setModuleReactivation.useMutation).mockReturnValue(
      { mutate: makeErrorMutate(new Error("DB error")) } as any,
    );

    const { result } = renderHook(() => useGate4Reactivation(null));

    // Baseline: no rows.
    expect(result.current.rows).toHaveLength(0);
    expect(result.current.isActivated(GROUP)).toBe(false);

    await act(async () => {
      result.current.reactivate(GROUP);
    });

    // After the synchronous onError rollback:
    //   a. activated Set must be empty again.
    expect(result.current.isActivated(GROUP)).toBe(false);
    //   b. Optimistic __global__ synthetic row must have been removed.
    //      The persist() key is `${groupId}:${syntheticVId}` = "operations:__global__".
    //      After rollback the Map is cleared for this key, so rows reverts to [].
    expect(result.current.rows.filter((r: ReactivationRow) => r.groupId === GROUP))
      .toHaveLength(0);
  });

  it("null/global scope reactivate(): activated reverts to empty Set after server rejection", async () => {
    vi.mocked(trpc.admin.setModuleReactivation.useMutation).mockReturnValue(
      { mutate: makeErrorMutate(new Error("Timeout")) } as any,
    );

    const { result } = renderHook(() => useGate4Reactivation(null));

    // Before: GROUP inactive.
    expect(result.current.isActivated(GROUP)).toBe(false);

    await act(async () => {
      // Optimistic: activated = {GROUP}.
      result.current.reactivate(GROUP);
    });

    // After rollback: GROUP must be inactive again.
    expect(result.current.isActivated(GROUP)).toBe(false);
  });
});
