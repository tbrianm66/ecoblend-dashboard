/**
 * @vitest-environment happy-dom
 *
 * ReactivationPanel — buildResetOnSuccess receives current venture refs at callback time (#188)
 *
 * The component maintains two refs that track the live ventureId / ventureName:
 *
 *   const ventureIdRef   = useRef(ventureId);
 *   const ventureNameRef = useRef(ventureName);
 *   useEffect(() => { ventureIdRef.current = ventureId;   });
 *   useEffect(() => { ventureNameRef.current = ventureName; });
 *
 * When the admin clicks "Reset", the onReset handler calls:
 *
 *   buildResetOnSuccess(
 *     toast,
 *     ventureId,                   // snapshot at click time
 *     ventureName,                 // snapshot at click time
 *     () => ventureIdRef.current,  // lazy getter — reads current value at success time
 *     () => ventureNameRef.current,// lazy getter — reads current value at success time
 *   )
 *
 * This test confirms that the 4th and 5th arguments (the lazy getters) actually
 * return the LIVE ref value at the time they are called — not the snapshot from
 * click time.  This matters when the admin switches ventures between clicking
 * Reset and the server responding: the success toast must report which venture
 * the admin is NOW viewing so they can act on the right data.
 *
 * Strategy
 * --------
 * 1. Mock buildResetOnSuccess to capture every arg, including the getter functions.
 * 2. Mount ReactivationPanel for venture A.
 * 3. Click the mocked reset button → buildResetOnSuccess is called.
 * 4. Re-render with venture B (simulating the selector change before server response).
 * 5. Invoke the captured getter functions and verify they return venture B values.
 */

import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";

// ── Mock sonner BEFORE Sidebar.tsx is imported ────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    error:   vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

// ── Mock gate4ToastUtils — capture buildResetOnSuccess args ──────────────────
// The other toast helpers are no-ops for this test; we only need to inspect
// what buildResetOnSuccess is called with.
vi.mock("@/lib/gate4ToastUtils", () => ({
  showToggleToast:             vi.fn(),
  showToggleErrorToast:        vi.fn(),
  showBatchToast:              vi.fn(),
  showBatchErrorToast:         vi.fn(),
  showResetToast:              vi.fn(),
  showResetErrorToast:         vi.fn(),
  showResetZeroRowsToast:      vi.fn(),
  showConcurrentModificationToast: vi.fn(),
  // Return a no-op success callback so the component doesn't crash.
  buildResetOnSuccess:         vi.fn(() => vi.fn()),
}));

// ── Mock ReactivationResetButton to expose the onReset prop ──────────────────
vi.mock("@/components/ReactivationResetButton", () => ({
  ReactivationResetButton: ({ onReset }: { onReset?: () => void }) =>
    React.createElement("button", { "data-testid": "reset-btn", onClick: onReset }),
}));

// ── Production imports (after mocks) ─────────────────────────────────────────
import { ReactivationPanel, type ReactivationPanelProps } from "./Sidebar";
import { buildResetOnSuccess } from "@/lib/gate4ToastUtils";
import type { ReactivationRow } from "@/lib/gate4Utils";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeProps(overrides: Partial<ReactivationPanelProps> = {}): ReactivationPanelProps {
  return {
    onClose:               vi.fn(),
    ventureId:             "ven-a",
    ventureName:           "Venture A",
    ventureColor:          "#56A837",
    venturesLoading:       false,
    rows:                  [] as ReactivationRow[],
    isLoading:             false,
    isError:               false,
    isActivated:           () => false,
    reactivate:            vi.fn(),
    deactivate:            vi.fn(),
    reactivateAll:         vi.fn(),
    deactivateAll:         vi.fn(),
    resetToGlobalDefaults: vi.fn(),
    resetIsPending:        false,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.mocked(buildResetOnSuccess).mockClear();
});

// ─────────────────────────────────────────────────────────────────────────────
// #188 Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("ReactivationPanel — buildResetOnSuccess receives venture refs at callback time (#188)", () => {
  it("passes the snapshot ventureId and ventureName as the 2nd and 3rd args at click time", async () => {
    render(React.createElement(ReactivationPanel, makeProps({
      ventureId:   "ven-a",
      ventureName: "Venture A",
    })));

    fireEvent.click(screen.getByTestId("reset-btn"));

    expect(vi.mocked(buildResetOnSuccess)).toHaveBeenCalledTimes(1);
    const [, snapshotVId, snapshotVName] = vi.mocked(buildResetOnSuccess).mock.calls[0];
    // Snapshot args must reflect the venture at click time.
    expect(snapshotVId).toBe("ven-a");
    expect(snapshotVName).toBe("Venture A");
  });

  it("4th arg (getVentureId) returns the CURRENT ventureId after the selector changes", async () => {
    const { rerender } = render(React.createElement(ReactivationPanel, makeProps({
      ventureId:   "ven-a",
      ventureName: "Venture A",
    })));

    fireEvent.click(screen.getByTestId("reset-btn"));

    expect(vi.mocked(buildResetOnSuccess)).toHaveBeenCalledTimes(1);
    const [, , , getVentureId] = vi.mocked(buildResetOnSuccess).mock.calls[0] as [
      unknown, string | null, string | undefined,
      () => string | null, () => string | undefined,
    ];

    // Simulate venture selector changing before server responds.
    await act(async () => {
      rerender(React.createElement(ReactivationPanel, makeProps({
        ventureId:   "ven-b",
        ventureName: "Venture B",
      })));
    });

    // The lazy getter must return the CURRENT venture (ven-b), not the click-time snapshot (ven-a).
    expect(getVentureId()).toBe("ven-b");
  });

  it("5th arg (getVentureName) returns the CURRENT ventureName after the selector changes", async () => {
    const { rerender } = render(React.createElement(ReactivationPanel, makeProps({
      ventureId:   "ven-a",
      ventureName: "Venture A",
    })));

    fireEvent.click(screen.getByTestId("reset-btn"));

    expect(vi.mocked(buildResetOnSuccess)).toHaveBeenCalledTimes(1);
    const [, , , , getVentureName] = vi.mocked(buildResetOnSuccess).mock.calls[0] as [
      unknown, string | null, string | undefined,
      () => string | null, () => string | undefined,
    ];

    await act(async () => {
      rerender(React.createElement(ReactivationPanel, makeProps({
        ventureId:   "ven-b",
        ventureName: "Venture B",
      })));
    });

    expect(getVentureName()).toBe("Venture B");
  });

  it("snapshot ventureId stays at click-time value even after re-render (#188 discriminating)", async () => {
    const { rerender } = render(React.createElement(ReactivationPanel, makeProps({
      ventureId:   "ven-a",
      ventureName: "Venture A",
    })));

    fireEvent.click(screen.getByTestId("reset-btn"));

    const [, snapshotVId, , getVentureId] = vi.mocked(buildResetOnSuccess).mock.calls[0] as [
      unknown, string | null, string | undefined,
      () => string | null, () => string | undefined,
    ];

    await act(async () => {
      rerender(React.createElement(ReactivationPanel, makeProps({
        ventureId:   "ven-b",
        ventureName: "Venture B",
      })));
    });

    // Snapshot arg: still ven-a (captured at click time, not live).
    expect(snapshotVId).toBe("ven-a");
    // Lazy getter: now ven-b (reads current ref after useEffect ran).
    expect(getVentureId()).toBe("ven-b");

    // They must be different — confirming both behaviors in one test.
    expect(snapshotVId).not.toBe(getVentureId());
  });
});
