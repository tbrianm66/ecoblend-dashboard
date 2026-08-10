/**
 * Gate 4 — gate4ToastUtils unit tests
 *
 * Covers showBatchErrorToast — the helper that extracts skipped group names
 * from a server error message and surfaces them in an error toast.
 *
 * Tests run in Node.js (no browser/React/sonner dependency) because all
 * helpers receive a plain ToastApi spy object.
 */

import { describe, it, expect } from "vitest";
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
  it("surfaces the skipped group IDs when the error message contains them (no labelMap)", () => {
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

  it("maps known groupIds to human-readable labels when a labelMap is provided", () => {
    const toast = makeToast();
    const labelMap: Record<string, string> = {
      "discovery":   "Discovery & Market",
      "operations":  "Operations & Mfg",
    };

    showBatchErrorToast(toast, ["discovery", "operations"], "any message", labelMap);

    expect(toast.calls.error).toHaveLength(1);
    expect(toast.calls.error[0]).toContain("Discovery & Market");
    expect(toast.calls.error[0]).toContain("Operations & Mfg");
    // Raw IDs should not appear when labels are available
    expect(toast.calls.error[0]).not.toContain(", discovery,");
    expect(toast.calls.error[0]).not.toContain(", operations");
  });

  it("falls back to the raw ID for unknown groupIds even when a labelMap is provided", () => {
    const toast = makeToast();
    const labelMap: Record<string, string> = {
      "discovery": "Discovery & Market",
    };

    showBatchErrorToast(toast, ["discovery", "unknown-group-xyz"], "any message", labelMap);

    expect(toast.calls.error[0]).toContain("Discovery & Market");
    expect(toast.calls.error[0]).toContain("unknown-group-xyz");
  });

  it("behaves identically when labelMap is undefined (no regression)", () => {
    const toast = makeToast();
    showBatchErrorToast(toast, ["risk", "scoring"], "any message", undefined);

    expect(toast.calls.error[0]).toContain("risk");
    expect(toast.calls.error[0]).toContain("scoring");
  });
});
