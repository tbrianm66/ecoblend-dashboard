/**
 * Gate 4 — gate4ToastUtils unit tests
 *
 * Covers:
 *   - showResetErrorToast — error toast fired when the server rejects a
 *     "Reset to global defaults" action (the path that was silent before
 *     the onError callback was wired in ReactivationPanel).
 *   - showBatchErrorToast — the helper that extracts skipped group names
 *     from a server error message and surfaces them in an error toast.
 *
 * Tests run in Node.js (no browser/React/sonner dependency) because all
 * helpers receive a plain ToastApi spy object.
 */

import { describe, it, expect } from "vitest";
import {
  showResetErrorToast,
  showBatchErrorToast,
  showToggleToast,
  showBatchToast,
  showToggleErrorToast,
  type ToastApi,
} from "./gate4ToastUtils";

function makeToast(): ToastApi & { calls: Record<string, string[]> } {
  const calls: Record<string, string[]> = { success: [], warning: [], error: [] };
  return {
    calls,
    success: (m) => calls.success.push(m),
    warning: (m) => calls.warning.push(m),
    error:   (m) => calls.error.push(m),
  };
}

// ── showResetErrorToast ───────────────────────────────────────────────────────
// Confirms the helper that fires when the server rejects a
// "Reset to global defaults" action actually calls toast.error with the raw
// server message — the path that was silently swallowed before the onError
// callback was wired in ReactivationPanel.

describe("showResetErrorToast", () => {
  it("fires toast.error with the raw server message", () => {
    const toast = makeToast();
    showResetErrorToast(toast, "Permission denied: venture overrides cannot be reset");

    expect(toast.calls.error).toHaveLength(1);
    expect(toast.calls.error[0]).toContain("Permission denied: venture overrides cannot be reset");
  });

  it("prefixes the message with 'Reset failed:'", () => {
    const toast = makeToast();
    showResetErrorToast(toast, "DB write failed");

    expect(toast.calls.error[0]).toMatch(/^Reset failed:/);
  });

  it("does not call success or warning", () => {
    const toast = makeToast();
    showResetErrorToast(toast, "some error");

    expect(toast.calls.success).toHaveLength(0);
    expect(toast.calls.warning).toHaveLength(0);
  });

  it("includes the full raw message in the error toast text", () => {
    const toast = makeToast();
    const rawMessage = "TRPC_INTERNAL_SERVER_ERROR: venture not found";
    showResetErrorToast(toast, rawMessage);

    expect(toast.calls.error[0]).toContain(rawMessage);
  });

  it("handles an empty error message without throwing", () => {
    const toast = makeToast();
    showResetErrorToast(toast, "");

    expect(toast.calls.error).toHaveLength(1);
    // Should still fire — empty message is valid (server gave no detail)
  });
});

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

// ── showToggleToast ───────────────────────────────────────────────────────────
// Confirms the helper that surfaces the per-row toggle result toast correctly
// distinguishes between the "same venture" (success) and "different venture"
// (warning with drift notice) paths.

describe("showToggleToast", () => {
  it("fires toast.success when snapshotVId matches currentVId (no drift)", () => {
    const toast = makeToast();
    showToggleToast(toast, "ven-alpha", "Venture Alpha", "Discovery", true, "ven-alpha", "Venture Alpha");

    expect(toast.calls.success).toHaveLength(1);
    expect(toast.calls.warning).toHaveLength(0);
    expect(toast.calls.error).toHaveLength(0);
  });

  it("success message contains the group label and the venture name", () => {
    const toast = makeToast();
    showToggleToast(toast, "ven-alpha", "Venture Alpha", "Discovery", true, "ven-alpha", "Venture Alpha");

    expect(toast.calls.success[0]).toContain("Discovery");
    expect(toast.calls.success[0]).toContain("Venture Alpha");
    expect(toast.calls.success[0]).toContain("activated");
  });

  it("success message says 'deactivated' when activated=false", () => {
    const toast = makeToast();
    showToggleToast(toast, "ven-alpha", "Venture Alpha", "Proposition", false, "ven-alpha", "Venture Alpha");

    expect(toast.calls.success[0]).toContain("deactivated");
    expect(toast.calls.success[0]).toContain("Proposition");
  });

  it("fires toast.warning when snapshotVId differs from currentVId (drift)", () => {
    const toast = makeToast();
    showToggleToast(
      toast,
      /* currentVId   */ "ven-beta",
      /* currentVName */ "Venture Beta",
      /* label        */ "Discovery",
      /* activated    */ true,
      /* snapshotVId  */ "ven-alpha",
      /* snapshotVName*/ "Venture Alpha",
    );

    expect(toast.calls.warning).toHaveLength(1);
    expect(toast.calls.success).toHaveLength(0);
    expect(toast.calls.error).toHaveLength(0);
  });

  it("drift warning message names the snapshot venture (where toggle landed)", () => {
    const toast = makeToast();
    showToggleToast(toast, "ven-beta", "Venture Beta", "Discovery", true, "ven-alpha", "Venture Alpha");

    expect(toast.calls.warning[0]).toContain("Venture Alpha");
  });

  it("drift warning message names the current venture (where admin is now looking)", () => {
    const toast = makeToast();
    showToggleToast(toast, "ven-beta", "Venture Beta", "Discovery", true, "ven-alpha", "Venture Alpha");

    expect(toast.calls.warning[0]).toContain("Venture Beta");
  });

  it("drift warning message contains the group label", () => {
    const toast = makeToast();
    showToggleToast(toast, "ven-beta", "Venture Beta", "R&D Hub", true, "ven-alpha", "Venture Alpha");

    expect(toast.calls.warning[0]).toContain("R&D Hub");
  });

  it("drift warning message contains the action word (activated / deactivated)", () => {
    const toast = makeToast();
    showToggleToast(toast, "ven-beta", "Venture Beta", "Discovery", true, "ven-alpha", "Venture Alpha");
    expect(toast.calls.warning[0]).toContain("activated");

    const toast2 = makeToast();
    showToggleToast(toast2, "ven-beta", "Venture Beta", "Discovery", false, "ven-alpha", "Venture Alpha");
    expect(toast2.calls.warning[0]).toContain("deactivated");
  });

  it("falls back to snapshotVId when snapshotVName is undefined (drift path)", () => {
    const toast = makeToast();
    showToggleToast(toast, "ven-beta", "Venture Beta", "Discovery", true, "ven-alpha", undefined);

    // The raw ID must appear in the warning since no name was available.
    expect(toast.calls.warning[0]).toContain("ven-alpha");
  });

  it("fires toast.success with 'all ventures (global)' scope when both VIds are null (no drift)", () => {
    const toast = makeToast();
    showToggleToast(toast, null, undefined, "Coaching", true, null, undefined);

    expect(toast.calls.success).toHaveLength(1);
    expect(toast.calls.success[0]).toContain("all ventures (global)");
  });

  it("fires toast.warning when snapshot was global but current is a venture (drift)", () => {
    const toast = makeToast();
    showToggleToast(toast, "ven-beta", "Venture Beta", "Coaching", true, null, undefined);

    expect(toast.calls.warning).toHaveLength(1);
    expect(toast.calls.warning[0]).toContain("all ventures (global)");
    expect(toast.calls.warning[0]).toContain("Venture Beta");
  });
});

// ── showBatchToast ────────────────────────────────────────────────────────────
// Confirms the Enable All / Disable All batch toast helper surfaces drift
// correctly — same mismatch-detection logic as showToggleToast.

describe("showBatchToast", () => {
  it("fires toast.success when there is no drift (snapshot === current)", () => {
    const toast = makeToast();
    showBatchToast(toast, "ven-alpha", "Venture Alpha", true, "ven-alpha", "Venture Alpha");

    expect(toast.calls.success).toHaveLength(1);
    expect(toast.calls.warning).toHaveLength(0);
  });

  it("success message says 'All modules enabled' for allActivated=true", () => {
    const toast = makeToast();
    showBatchToast(toast, "ven-alpha", "Venture Alpha", true, "ven-alpha", "Venture Alpha");

    expect(toast.calls.success[0]).toContain("All modules enabled");
  });

  it("success message says 'All modules disabled' for allActivated=false", () => {
    const toast = makeToast();
    showBatchToast(toast, "ven-alpha", "Venture Alpha", false, "ven-alpha", "Venture Alpha");

    expect(toast.calls.success[0]).toContain("All modules disabled");
  });

  it("fires toast.warning when snapshotVId differs from currentVId (drift)", () => {
    const toast = makeToast();
    showBatchToast(toast, "ven-beta", "Venture Beta", true, "ven-alpha", "Venture Alpha");

    expect(toast.calls.warning).toHaveLength(1);
    expect(toast.calls.success).toHaveLength(0);
  });

  it("drift warning names the snapshot venture and the current venture", () => {
    const toast = makeToast();
    showBatchToast(toast, "ven-beta", "Venture Beta", true, "ven-alpha", "Venture Alpha");

    expect(toast.calls.warning[0]).toContain("Venture Alpha");  // where batch landed
    expect(toast.calls.warning[0]).toContain("Venture Beta");   // where admin is now
  });

  it("drift warning for allActivated=false also names both ventures", () => {
    const toast = makeToast();
    showBatchToast(toast, "ven-beta", "Venture Beta", false, "ven-alpha", "Venture Alpha");

    expect(toast.calls.warning).toHaveLength(1);
    expect(toast.calls.warning[0]).toContain("Venture Alpha");
    expect(toast.calls.warning[0]).toContain("Venture Beta");
  });
});

// ── showToggleErrorToast ──────────────────────────────────────────────────────
// Confirms the helper that fires when a single-group toggle write is rejected
// calls toast.error with the group label and the raw server message.

describe("showToggleErrorToast", () => {
  it("fires toast.error with the group label", () => {
    const toast = makeToast();
    showToggleErrorToast(toast, "Discovery & Market", "DB write failed");

    expect(toast.calls.error).toHaveLength(1);
    expect(toast.calls.error[0]).toContain("Discovery & Market");
  });

  it("fires toast.error with the raw server message", () => {
    const toast = makeToast();
    showToggleErrorToast(toast, "Discovery", "Permission denied: venture read-only");

    expect(toast.calls.error[0]).toContain("Permission denied: venture read-only");
  });

  it("does not call success or warning", () => {
    const toast = makeToast();
    showToggleErrorToast(toast, "Discovery", "some error");

    expect(toast.calls.success).toHaveLength(0);
    expect(toast.calls.warning).toHaveLength(0);
  });
});
