/**
 * Gate 4 — gate4ToastUtils unit tests
 *
 * Covers showBatchErrorToast — the helper that extracts skipped group names
 * from a server error message and surfaces them in an error toast.
 *
 * Tests run in Node.js (no browser/React/sonner dependency) because all
 * helpers receive a plain ToastApi spy object.
 */

import { describe, it, expect, vi } from "vitest";
import { showBatchErrorToast, type ToastApi } from "./gate4ToastUtils";

function makeToast(): ToastApi & { calls: Record<string, string[]> } {
  const calls: Record<string, string[]> = { success: [], warning: [], error: [] };
  return {
    calls,
    success: (m) => calls.success.push(m),
    warning: (m) => calls.warning.push(m),
    error:   (m) => calls.error.push(m),
  };
}

describe("showBatchErrorToast", () => {
  it("surfaces the skipped group IDs when the error message contains them", () => {
    const toast = makeToast();
    const rawMessage =
      "Batch write incomplete: 13 of 15 group(s) confirmed by the DB. " +
      "Skipped group(s): backlog-team-growth, backlog-unit-economics";

    showBatchErrorToast(toast, ["backlog-team-growth", "backlog-unit-economics"], rawMessage);

    expect(toast.calls.error).toHaveLength(1);
    expect(toast.calls.error[0]).toContain("backlog-team-growth");
    expect(toast.calls.error[0]).toContain("backlog-unit-economics");
    expect(toast.calls.error[0]).toContain("Batch write incomplete");
  });

  it("shows a generic error message when the skippedGroups array is empty", () => {
    const toast = makeToast();
    const rawMessage = "DB unavailable";

    showBatchErrorToast(toast, [], rawMessage);

    expect(toast.calls.error).toHaveLength(1);
    expect(toast.calls.error[0]).toContain("DB unavailable");
    // Generic path: no "skipped group(s):" prefix
    expect(toast.calls.error[0]).not.toContain("skipped group(s):");
  });

  it("does not call success or warning when called", () => {
    const toast = makeToast();
    showBatchErrorToast(toast, ["g1"], "some error");

    expect(toast.calls.success).toHaveLength(0);
    expect(toast.calls.warning).toHaveLength(0);
  });

  it("lists multiple skipped groups separated by commas", () => {
    const toast = makeToast();
    showBatchErrorToast(toast, ["g1", "g2", "g3"], "any message");

    expect(toast.calls.error[0]).toContain("g1, g2, g3");
  });
});
