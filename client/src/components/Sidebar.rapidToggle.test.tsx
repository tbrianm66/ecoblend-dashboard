/**
 * @vitest-environment happy-dom
 *
 * ReactivationPanel — rapid overlapping toggle error toast closure isolation
 *
 * When an admin clicks two different row toggle buttons before either server
 * response arrives, the panel builds a separate onError closure for each row
 * at click time (Sidebar.tsx lines 793–802).  Each closure captures its own
 * `group.label` via the .map() iteration variable — a different `const` per
 * row.  This test exercises that exact production wiring end-to-end:
 *
 *   1. Render the real ReactivationPanel with a mock `reactivate` prop that
 *      captures the onError callbacks passed from each row's onClick handler.
 *   2. Click two different row buttons — simulating rapid back-to-back clicks
 *      before either server response arrives.
 *   3. Resolve both captured onError callbacks (out of order) to simulate the
 *      server rejecting both mutations asynchronously.
 *   4. Assert that each toast names its originating group, not the other.
 *
 * sonner's `toast` is mocked so we can inspect toast.error calls in Node
 * without a real browser notification system.
 */

import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";

// ── Mock sonner BEFORE Sidebar.tsx is imported ────────────────────────────────
// vi.mock factories are hoisted to the top of the compiled output, so the
// factory must NOT reference variables defined with const/let in the outer
// scope (they are in the temporal dead zone at hoist time).  Instead we use
// vi.fn() directly inside the factory and retrieve the spies later via
// vi.mocked(toast).
vi.mock("sonner", () => ({
  toast: {
    error:   vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

// ── Production imports (after mock is registered) ─────────────────────────────
import { toast } from "sonner";
import { ReactivationPanel, type ReactivationPanelProps } from "./Sidebar";
import { GATE4_BACKLOG_GROUPS } from "@/lib/gate4Config";
import type { ReactivationRow } from "@/lib/gate4Utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Capture record for a single reactivate / deactivate call. */
interface CapturedCall {
  groupId:   string;
  onSuccess: ((snapshotVId: string | null) => void) | undefined;
  onError:   ((groupId: string, rawMessage: string) => void) | undefined;
}

/**
 * Build the minimum set of ReactivationPanel props needed to render the panel
 * in an "all-inactive" state with a valid venture selected (so actionsDisabled
 * is false and all toggle buttons are enabled).
 *
 * `reactivate` and `deactivate` are replaced by caller-supplied stubs so tests
 * can intercept the onError closures passed from each row's onClick handler.
 */
function makeProps(
  overrides: Partial<ReactivationPanelProps> & {
    reactivate: ReactivationPanelProps["reactivate"];
    deactivate: ReactivationPanelProps["deactivate"];
  },
): ReactivationPanelProps {
  return {
    onClose:              vi.fn(),
    ventureId:            "ven-alpha",
    ventureName:          "Venture Alpha",       // Must be non-empty so actionsDisabled=false
    ventureColor:         "#56A837",
    venturesLoading:      false,
    rows:                 [] as ReactivationRow[],
    isLoading:            false,
    isError:              false,
    isActivated:          () => false,           // All groups inactive → clicks call reactivate
    reactivateAll:        vi.fn(),
    deactivateAll:        vi.fn(),
    resetToGlobalDefaults: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.warning).mockClear();
});

// ── Identify the first two backlog groups from the canonical source ────────────
// These are the groups whose toggle buttons we click in the rapid-click tests.
// We read from the same GATE4_BACKLOG_GROUPS that Sidebar.tsx uses so the
// labels in our assertions are always in sync with the production config.
const GROUP_A = GATE4_BACKLOG_GROUPS[0]; // { id: "venture-intake", label: "Venture Intake" }
const GROUP_B = GATE4_BACKLOG_GROUPS[1]; // { id: "discovery",      label: "Discovery & Market" }

// ── Tests ─────────────────────────────────────────────────────────────────────

// #162: closure built inside the per-row callback — group label cannot leak between rows
// #165: error toast names the correct group when two toggles fail in rapid succession
describe("ReactivationPanel — rapid overlapping toggle error toast closure isolation", () => {
  it("first click produces an onError closure that names the first group", () => {
    const capturedCalls: CapturedCall[] = [];

    const reactivate: ReactivationPanelProps["reactivate"] = (groupId, onSuccess, onError) => {
      capturedCalls.push({ groupId, onSuccess, onError });
    };

    render(
      React.createElement(ReactivationPanel, makeProps({ reactivate, deactivate: vi.fn() })),
    );

    // Click the first row button — this builds and passes its onError closure to `reactivate`.
    fireEvent.click(screen.getByTestId(`toggle-${GROUP_A.id}`));
    expect(capturedCalls).toHaveLength(1);
    expect(capturedCalls[0].groupId).toBe(GROUP_A.id);

    // Resolve the first mutation with an error.
    act(() => {
      capturedCalls[0].onError?.(GROUP_A.id, "DB timeout: write rejected");
    });

    expect(vi.mocked(toast.error)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(toast.error).mock.calls[0][0]).toContain(GROUP_A.label);
    expect(vi.mocked(toast.error).mock.calls[0][0]).not.toContain(GROUP_B.label);
  });

  it("second click produces an onError closure that names the second group, independent of the first", () => {
    const capturedCalls: CapturedCall[] = [];

    const reactivate: ReactivationPanelProps["reactivate"] = (groupId, onSuccess, onError) => {
      capturedCalls.push({ groupId, onSuccess, onError });
    };

    render(
      React.createElement(ReactivationPanel, makeProps({ reactivate, deactivate: vi.fn() })),
    );

    // Click both buttons before either response arrives (rapid overlapping clicks).
    fireEvent.click(screen.getByTestId(`toggle-${GROUP_A.id}`));
    fireEvent.click(screen.getByTestId(`toggle-${GROUP_B.id}`));
    expect(capturedCalls).toHaveLength(2);

    // Resolve only the second mutation with an error.
    act(() => {
      capturedCalls[1].onError?.(GROUP_B.id, "Integrity check failed: row count mismatch");
    });

    expect(vi.mocked(toast.error)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(toast.error).mock.calls[0][0]).toContain(GROUP_B.label);
    expect(vi.mocked(toast.error).mock.calls[0][0]).not.toContain(GROUP_A.label);
  });

  it("each closure names its own group when both mutations reject (in-order resolution)", () => {
    const capturedCalls: CapturedCall[] = [];

    const reactivate: ReactivationPanelProps["reactivate"] = (groupId, onSuccess, onError) => {
      capturedCalls.push({ groupId, onSuccess, onError });
    };

    render(
      React.createElement(ReactivationPanel, makeProps({ reactivate, deactivate: vi.fn() })),
    );

    // Both buttons clicked before either server response arrives.
    fireEvent.click(screen.getByTestId(`toggle-${GROUP_A.id}`));
    fireEvent.click(screen.getByTestId(`toggle-${GROUP_B.id}`));

    // Both mutations reject — resolve in the same order as clicks.
    act(() => {
      capturedCalls[0].onError?.(GROUP_A.id, "Server error 500");
      capturedCalls[1].onError?.(GROUP_B.id, "Server error 503");
    });

    expect(vi.mocked(toast.error)).toHaveBeenCalledTimes(2);

    // First toast must name the first group.
    expect(vi.mocked(toast.error).mock.calls[0][0]).toContain(GROUP_A.label);
    expect(vi.mocked(toast.error).mock.calls[0][0]).not.toContain(GROUP_B.label);

    // Second toast must name the second group.
    expect(vi.mocked(toast.error).mock.calls[1][0]).toContain(GROUP_B.label);
    expect(vi.mocked(toast.error).mock.calls[1][0]).not.toContain(GROUP_A.label);
  });

  it("each closure names its own group when both mutations reject (out-of-order resolution)", () => {
    const capturedCalls: CapturedCall[] = [];

    const reactivate: ReactivationPanelProps["reactivate"] = (groupId, onSuccess, onError) => {
      capturedCalls.push({ groupId, onSuccess, onError });
    };

    render(
      React.createElement(ReactivationPanel, makeProps({ reactivate, deactivate: vi.fn() })),
    );

    fireEvent.click(screen.getByTestId(`toggle-${GROUP_A.id}`));
    fireEvent.click(screen.getByTestId(`toggle-${GROUP_B.id}`));

    // Resolve second mutation BEFORE first — out-of-order server responses.
    act(() => {
      capturedCalls[1].onError?.(GROUP_B.id, "Timeout on second request");
      capturedCalls[0].onError?.(GROUP_A.id, "Timeout on first request");
    });

    expect(vi.mocked(toast.error)).toHaveBeenCalledTimes(2);

    // First toast fired (second click resolved first) must name Group B.
    expect(vi.mocked(toast.error).mock.calls[0][0]).toContain(GROUP_B.label);
    expect(vi.mocked(toast.error).mock.calls[0][0]).not.toContain(GROUP_A.label);

    // Second toast fired (first click resolved second) must name Group A.
    expect(vi.mocked(toast.error).mock.calls[1][0]).toContain(GROUP_A.label);
    expect(vi.mocked(toast.error).mock.calls[1][0]).not.toContain(GROUP_B.label);
  });

  it("each toast also carries the correct raw server error message for its own request", () => {
    const capturedCalls: CapturedCall[] = [];

    const reactivate: ReactivationPanelProps["reactivate"] = (groupId, onSuccess, onError) => {
      capturedCalls.push({ groupId, onSuccess, onError });
    };

    render(
      React.createElement(ReactivationPanel, makeProps({ reactivate, deactivate: vi.fn() })),
    );

    fireEvent.click(screen.getByTestId(`toggle-${GROUP_A.id}`));
    fireEvent.click(screen.getByTestId(`toggle-${GROUP_B.id}`));

    const messageA = "Permission denied for venture ven-alpha (row A)";
    const messageB = "Permission denied for venture ven-alpha (row B)";

    act(() => {
      capturedCalls[0].onError?.(GROUP_A.id, messageA);
      capturedCalls[1].onError?.(GROUP_B.id, messageB);
    });

    expect(vi.mocked(toast.error).mock.calls[0][0]).toContain(messageA);
    expect(vi.mocked(toast.error).mock.calls[0][0]).not.toContain(messageB);

    expect(vi.mocked(toast.error).mock.calls[1][0]).toContain(messageB);
    expect(vi.mocked(toast.error).mock.calls[1][0]).not.toContain(messageA);
  });

  it("does not fire success or warning toasts when onError is invoked", () => {
    const capturedCalls: CapturedCall[] = [];

    const reactivate: ReactivationPanelProps["reactivate"] = (groupId, onSuccess, onError) => {
      capturedCalls.push({ groupId, onSuccess, onError });
    };

    render(
      React.createElement(ReactivationPanel, makeProps({ reactivate, deactivate: vi.fn() })),
    );

    fireEvent.click(screen.getByTestId(`toggle-${GROUP_A.id}`));
    fireEvent.click(screen.getByTestId(`toggle-${GROUP_B.id}`));

    act(() => {
      capturedCalls[0].onError?.(GROUP_A.id, "error A");
      capturedCalls[1].onError?.(GROUP_B.id, "error B");
    });

    expect(vi.mocked(toast.success)).not.toHaveBeenCalled();
    expect(vi.mocked(toast.warning)).not.toHaveBeenCalled();
    expect(vi.mocked(toast.error)).toHaveBeenCalledTimes(2);
  });
});
