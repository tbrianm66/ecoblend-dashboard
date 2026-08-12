/**
 * @vitest-environment happy-dom
 *
 * ReactivationPanel — batch error and reset toast routing tests
 *
 * #153: Enable All concurrent-modification error routes to showConcurrentModificationToast
 *       (toast.warning with actionable "reload and retry" copy) rather than the generic
 *       skipped-groups error toast when the server rejects the batch due to a concurrent
 *       write by another admin.
 *
 * #148 (client): Reset-to-global-defaults zero-row result routes to showResetZeroRowsToast
 *       (toast.warning) so the admin is not left with a silent no-op when the venture
 *       already uses global defaults.
 *
 * Strategy
 * --------
 * We mount the real production ReactivationPanel with mocked hook props so we can
 * intercept the callbacks the component builds and passes to reactivateAll /
 * resetToGlobalDefaults.  After rendering:
 *
 *   #153: Click "Enable All" → capture the onError closure → invoke it with
 *         skippedGroups=[] and a "Concurrent modification detected" message →
 *         assert toast.warning is called with the actionable copy.
 *
 *   #148: Provide a resetToGlobalDefaults spy that captures onZeroRows →
 *         click the "Reset" button → invoke capturedOnZeroRows() → assert
 *         toast.warning is called with "Nothing to reset" copy.
 *
 * sonner's toast is mocked so we can inspect calls without a real browser
 * notification system.  ReactivationResetButton is mocked to expose the
 * onReset prop as a <button data-testid="reset-btn"> so tests can click it.
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

// ── Mock ReactivationResetButton to expose the onReset prop ──────────────────
// The real component has its own loading/disabled logic.  For routing tests we
// only need to invoke the onReset callback; wrapping it in a simple button keeps
// the test surface minimal and avoids pulling in deep component deps.
vi.mock("@/components/ReactivationResetButton", () => ({
  ReactivationResetButton: ({ onReset }: { onReset?: () => void }) =>
    React.createElement("button", { "data-testid": "reset-btn", onClick: onReset }),
}));

// ── Production imports (resolved after mocks) ─────────────────────────────────
import { toast } from "sonner";
import { ReactivationPanel, type ReactivationPanelProps } from "./Sidebar";
import type { ReactivationRow } from "@/lib/gate4Utils";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the minimum ReactivationPanel props for a selected venture (so the
 * Reset button and Enable All / Disable All buttons are all enabled).
 */
function makeBaseProps(overrides: Partial<ReactivationPanelProps>): ReactivationPanelProps {
  return {
    onClose:               vi.fn(),
    ventureId:             "ven-test",
    ventureName:           "Test Venture",   // non-empty → actionsDisabled=false
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
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.warning).mockClear();
});

// ─────────────────────────────────────────────────────────────────────────────
// #153 — Enable All concurrent-modification error routes to the right toast
// ─────────────────────────────────────────────────────────────────────────────

describe("ReactivationPanel — concurrent-modification error toast routing (#153)", () => {
  it("calls toast.warning (not toast.error) when Enable All fails with Concurrent modification detected", async () => {
    // The onError callback passed to reactivateAll is captured by the mock.
    let capturedOnError: ((skippedGroups: string[], rawMessage: string) => void) | undefined;

    const reactivateAll = vi.fn((
      _onSuccess?: (svid: string | null) => void,
      onError?: (skippedGroups: string[], rawMessage: string) => void,
    ) => {
      capturedOnError = onError;
    });

    render(React.createElement(ReactivationPanel, makeBaseProps({ reactivateAll })));

    // Click "Enable All" → the component calls reactivateAll(..., onError).
    const enableBtn = screen.getByTestId("enable-all-btn");
    fireEvent.click(enableBtn);

    expect(capturedOnError).toBeDefined();

    // Simulate the server rejecting with a concurrent-modification CONFLICT.
    await act(async () => {
      capturedOnError!(
        [],                               // skippedGroups is empty for CONFLICT rejections
        "Concurrent modification detected: 2 group(s) were modified by another admin (Alice) after your last refresh.",
      );
    });

    // Must show a warning (not a generic error) — the copy guides the admin to reload.
    expect(vi.mocked(toast.warning)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(toast.warning)).toHaveBeenCalledWith(
      expect.stringMatching(/Changes not applied/),
      expect.anything(),
    );
    expect(vi.mocked(toast.warning)).toHaveBeenCalledWith(
      expect.stringMatching(/Reload the panel/),
      expect.anything(),
    );

    // toast.error must NOT be called — the generic batch error path would fire that.
    expect(vi.mocked(toast.error)).not.toHaveBeenCalled();
  });

  it("calls toast.error (generic batch path) when Enable All fails for a non-concurrent reason", async () => {
    let capturedOnError: ((skippedGroups: string[], rawMessage: string) => void) | undefined;

    const reactivateAll = vi.fn((
      _onSuccess?: (svid: string | null) => void,
      onError?: (skippedGroups: string[], rawMessage: string) => void,
    ) => {
      capturedOnError = onError;
    });

    render(React.createElement(ReactivationPanel, makeBaseProps({ reactivateAll })));
    fireEvent.click(screen.getByTestId("enable-all-btn"));

    expect(capturedOnError).toBeDefined();

    await act(async () => {
      capturedOnError!(
        ["discovery", "validation"],   // server named skipped groups → generic path
        "Batch write failed: DB timeout",
      );
    });

    // Generic batch error path uses toast.error.
    expect(vi.mocked(toast.error)).toHaveBeenCalledTimes(1);
    // Concurrent-modification toast must NOT fire (wrong path).
    const warningCalls = vi.mocked(toast.warning).mock.calls;
    const concurrentWarning = warningCalls.find(([msg]) =>
      typeof msg === "string" && msg.includes("Changes not applied"),
    );
    expect(concurrentWarning).toBeUndefined();
  });

  it("discriminates: concurrent-modification path fires toast.warning once per click", async () => {
    let capturedOnError: ((skippedGroups: string[], rawMessage: string) => void) | undefined;

    const reactivateAll = vi.fn((
      _onSuccess?: (svid: string | null) => void,
      onError?: (skippedGroups: string[], rawMessage: string) => void,
    ) => {
      capturedOnError = onError;
    });

    render(React.createElement(ReactivationPanel, makeBaseProps({ reactivateAll })));
    fireEvent.click(screen.getByTestId("enable-all-btn"));

    await act(async () => {
      capturedOnError!([], "Concurrent modification detected: 1 group(s) were modified by someone else.");
    });

    // Exactly one warning — no duplicate toasts.
    expect(vi.mocked(toast.warning)).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// #148 (client) — Reset zero-row result routes to showResetZeroRowsToast
// ─────────────────────────────────────────────────────────────────────────────

describe("ReactivationPanel — reset zero-row result toast routing (#148 client)", () => {
  it("calls toast.warning with 'Nothing to reset' when resetToGlobalDefaults invokes onZeroRows", async () => {
    // resetToGlobalDefaults spy captures the onZeroRows callback so we can invoke it.
    let capturedOnZeroRows: (() => void) | undefined;

    const resetToGlobalDefaults = vi.fn((
      _onSuccess?: (svid: string | null) => void,
      _onError?: (rawMessage: string) => void,
      onZeroRows?: () => void,
    ) => {
      capturedOnZeroRows = onZeroRows;
    });

    render(React.createElement(ReactivationPanel, makeBaseProps({ resetToGlobalDefaults })));

    // Click the reset button (mocked to call onReset directly).
    const resetBtn = screen.getByTestId("reset-btn");
    fireEvent.click(resetBtn);

    expect(capturedOnZeroRows).toBeDefined();

    // Simulate server returning deletedCount: 0.
    await act(async () => {
      capturedOnZeroRows!();
    });

    // Must show toast.warning with the "Nothing to reset" copy.
    expect(vi.mocked(toast.warning)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(toast.warning)).toHaveBeenCalledWith(
      expect.stringMatching(/Nothing to reset/),
      expect.anything(),
    );

    // No error toast — this is not a failure, just a no-op.
    expect(vi.mocked(toast.error)).not.toHaveBeenCalled();
  });

  it("does NOT call toast.warning when resetToGlobalDefaults succeeds normally", async () => {
    // onSuccess path: no warning should be shown — the success toast fires from onSuccess.
    let capturedOnSuccess: ((svid: string | null) => void) | undefined;

    const resetToGlobalDefaults = vi.fn((
      onSuccess?: (svid: string | null) => void,
    ) => {
      capturedOnSuccess = onSuccess;
    });

    render(React.createElement(ReactivationPanel, makeBaseProps({ resetToGlobalDefaults })));
    fireEvent.click(screen.getByTestId("reset-btn"));

    expect(capturedOnSuccess).toBeDefined();

    await act(async () => {
      capturedOnSuccess!("ven-test");
    });

    // onSuccess path invokes buildResetOnSuccess, which may call toast.success or toast.warning
    // (venture drift logic) — but the "Nothing to reset" warning path must NOT fire.
    const warningCalls = vi.mocked(toast.warning).mock.calls;
    const nothingToResetWarning = warningCalls.find(([msg]) =>
      typeof msg === "string" && msg.includes("Nothing to reset"),
    );
    expect(nothingToResetWarning).toBeUndefined();
  });
});
