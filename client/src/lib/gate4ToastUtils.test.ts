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
  showResetToast,
  showBatchErrorToast,
  showToggleToast,
  showBatchToast,
  showToggleErrorToast,
  buildResetOnSuccess,
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

  it("falls back to currentVId when currentVName is undefined in the drift branch (nowScope fallback)", () => {
    // drift: snapshotVId="ven-alpha", currentVId="ven-beta", currentVName=undefined
    // nowScope = currentVId ? (currentVName ?? currentVId) : "all ventures (global)"
    //          = "ven-beta" ? (undefined ?? "ven-beta") = "ven-beta"
    const toast = makeToast();
    showToggleToast(toast, "ven-beta", undefined, "Discovery", true, "ven-alpha", "Venture Alpha");

    expect(toast.calls.warning).toHaveLength(1);
    // The raw currentVId must appear since no currentVName was available.
    expect(toast.calls.warning[0]).toContain("ven-beta");
    // The snapshot name still appears (it is defined).
    expect(toast.calls.warning[0]).toContain("Venture Alpha");
  });

  // ── snapshotVId=undefined: runtime edge case ──────────────────────────────
  // TypeScript declares snapshotVId as `string | null` (not `| undefined`).
  // At runtime, `undefined` CAN be passed (e.g. before a ref is first set).
  // Because `undefined !== null`, the `drifted` check fires: a call with
  // snapshotVId=undefined and currentVId=null produces a SPURIOUS drift warning
  // even though both sides represent the global scope (both falsy).
  //
  // This test documents that existing runtime behaviour.  If the function is
  // ever updated to treat undefined the same as null, this test will signal
  // the contract change.
  it("snapshotVId=undefined with currentVId=null produces a drift warning (null !== undefined runtime edge case)", () => {
    // Both sides are global-scope falsy, but `undefined !== null` → drifted=true.
    const toast = makeToast();
    showToggleToast(toast, null, undefined, "Coaching", true, undefined as any, undefined);

    // A drift warning fires because `undefined !== null`.
    expect(toast.calls.warning).toHaveLength(1);
    // Both scopeName and nowScope resolve to "all ventures (global)" (both falsy).
    expect(toast.calls.warning[0]).toContain("all ventures (global)");
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

  // #191: batch warning toast names both ventures correctly when Enable All lands on the wrong venture
  it("drift warning for allActivated=false also names both ventures (#191)", () => {
    const toast = makeToast();
    showBatchToast(toast, "ven-beta", "Venture Beta", false, "ven-alpha", "Venture Alpha");

    expect(toast.calls.warning).toHaveLength(1);
    expect(toast.calls.warning[0]).toContain("Venture Alpha");
    expect(toast.calls.warning[0]).toContain("Venture Beta");
  });

  it("falls back to snapshotVId when snapshotVName is undefined (drift path)", () => {
    const toast = makeToast();
    showBatchToast(toast, "ven-beta", "Venture Beta", true, "ven-alpha", undefined);

    // snapshotVName=undefined → scopeName = snapshotVId ?? snapshotVId = "ven-alpha"
    expect(toast.calls.warning).toHaveLength(1);
    expect(toast.calls.warning[0]).toContain("ven-alpha");
  });

  it("falls back to currentVId when currentVName is undefined in the drift branch (nowScope fallback)", () => {
    // drift: snapshot="ven-alpha", current="ven-beta", currentVName=undefined
    // nowScope = currentVId ? (currentVName ?? currentVId) : global = "ven-beta"
    const toast = makeToast();
    showBatchToast(toast, "ven-beta", undefined, true, "ven-alpha", "Venture Alpha");

    expect(toast.calls.warning).toHaveLength(1);
    expect(toast.calls.warning[0]).toContain("ven-beta");
    expect(toast.calls.warning[0]).toContain("Venture Alpha");
  });
});

// ── showResetToast ────────────────────────────────────────────────────────────
// Confirms the "Reset to global defaults" success/warning toast correctly names
// the venture that was reset (snapshot) and detects drift when the selector
// changed between click and server response.

describe("showResetToast", () => {
  it("fires toast.success when snapshotVId matches currentVId (no drift)", () => {
    const toast = makeToast();
    showResetToast(toast, "ven-alpha", "Venture Alpha", "ven-alpha", "Venture Alpha");

    expect(toast.calls.success).toHaveLength(1);
    expect(toast.calls.warning).toHaveLength(0);
    expect(toast.calls.error).toHaveLength(0);
  });

  it("success message names the snapshot venture", () => {
    const toast = makeToast();
    showResetToast(toast, "ven-alpha", "Venture Alpha", "ven-alpha", "Venture Alpha");

    expect(toast.calls.success[0]).toContain("Venture Alpha");
  });

  it("success message mentions resetting to global defaults", () => {
    const toast = makeToast();
    showResetToast(toast, "ven-alpha", "Venture Alpha", "ven-alpha", "Venture Alpha");

    expect(toast.calls.success[0]).toContain("global defaults");
  });

  it("fires toast.success with 'all ventures (global)' when both VIds are null (no drift)", () => {
    const toast = makeToast();
    showResetToast(toast, null, undefined, null, undefined);

    expect(toast.calls.success).toHaveLength(1);
    expect(toast.calls.success[0]).toContain("all ventures (global)");
    expect(toast.calls.warning).toHaveLength(0);
    expect(toast.calls.error).toHaveLength(0);
  });

  it("fires toast.warning when snapshotVId differs from currentVId (drift)", () => {
    const toast = makeToast();
    showResetToast(toast, "ven-beta", "Venture Beta", "ven-alpha", "Venture Alpha");

    expect(toast.calls.warning).toHaveLength(1);
    expect(toast.calls.success).toHaveLength(0);
    expect(toast.calls.error).toHaveLength(0);
  });

  it("drift warning message names the snapshot venture (where reset landed)", () => {
    const toast = makeToast();
    showResetToast(toast, "ven-beta", "Venture Beta", "ven-alpha", "Venture Alpha");

    expect(toast.calls.warning[0]).toContain("Venture Alpha");
  });

  it("drift warning message names the current venture (where admin is now looking)", () => {
    const toast = makeToast();
    showResetToast(toast, "ven-beta", "Venture Beta", "ven-alpha", "Venture Alpha");

    expect(toast.calls.warning[0]).toContain("Venture Beta");
  });

  it("falls back to snapshotVId when snapshotVName is undefined (drift path)", () => {
    const toast = makeToast();
    showResetToast(toast, "ven-beta", "Venture Beta", "ven-alpha", undefined);

    // The raw ID must appear in the warning since no name was available.
    expect(toast.calls.warning[0]).toContain("ven-alpha");
  });

  it("fires toast.warning when snapshot was global but current is a venture (drift)", () => {
    const toast = makeToast();
    showResetToast(toast, "ven-beta", "Venture Beta", null, undefined);

    expect(toast.calls.warning).toHaveLength(1);
    expect(toast.calls.warning[0]).toContain("all ventures (global)");
    expect(toast.calls.warning[0]).toContain("Venture Beta");
  });

  it("does not call toast.error in either the success or drift path", () => {
    const toastSuccess = makeToast();
    showResetToast(toastSuccess, "ven-alpha", "Venture Alpha", "ven-alpha", "Venture Alpha");
    expect(toastSuccess.calls.error).toHaveLength(0);

    const toastDrift = makeToast();
    showResetToast(toastDrift, "ven-beta", "Venture Beta", "ven-alpha", "Venture Alpha");
    expect(toastDrift.calls.error).toHaveLength(0);
  });

  it("falls back to currentVId when currentVName is undefined in the drift branch (nowScope fallback)", () => {
    // drift: snapshot="ven-alpha", current="ven-beta", currentVName=undefined
    // nowScope = currentVId ? (currentVName ?? currentVId) : global = "ven-beta"
    const toast = makeToast();
    showResetToast(toast, "ven-beta", undefined, "ven-alpha", "Venture Alpha");

    expect(toast.calls.warning).toHaveLength(1);
    // Raw currentVId appears since no currentVName was available.
    expect(toast.calls.warning[0]).toContain("ven-beta");
    // Snapshot name still appears (it is defined).
    expect(toast.calls.warning[0]).toContain("Venture Alpha");
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

// ── showToggleErrorToast — overlapping rapid-click closure isolation ──────────
//
// When an admin clicks two different rows before the first server response
// arrives, each row's onClick handler captures its own `group.label` in a
// separate onError closure.  The two onError callbacks must each call
// showToggleErrorToast with their own label — not whichever label happens to
// be in scope when the response finally arrives.
//
// These tests simulate that scenario by building two independent onError
// closures (each closing over a different label string) and then resolving
// both "server responses" in sequence, verifying the toasts are scoped
// correctly.

describe("showToggleErrorToast — overlapping rapid-click closure isolation", () => {
  it("each closure names its own group when both resolve with errors", () => {
    const toast = makeToast();

    // Simulate Sidebar.tsx per-row onError closures:
    // The label is captured at click time, before any server response arrives.
    const labelA = "Discovery & Market";
    const labelB = "Operations & Manufacturing";

    // Both click handlers fire before either server response arrives.
    // Build the closures now (label captured at click time).
    const onErrorA = (rawMessage: string) =>
      showToggleErrorToast(toast, labelA, rawMessage);
    const onErrorB = (rawMessage: string) =>
      showToggleErrorToast(toast, labelB, rawMessage);

    // Server rejects both in sequence (simulating two overlapping in-flight mutations).
    onErrorA("DB timeout: write rejected");
    onErrorB("Integrity check failed: row count mismatch");

    expect(toast.calls.error).toHaveLength(2);

    // First error must name the first group, not the second.
    expect(toast.calls.error[0]).toContain(labelA);
    expect(toast.calls.error[0]).not.toContain(labelB);

    // Second error must name the second group, not the first.
    expect(toast.calls.error[1]).toContain(labelB);
    expect(toast.calls.error[1]).not.toContain(labelA);
  });

  it("each toast also carries the correct raw server message for its own request", () => {
    const toast = makeToast();

    const onErrorA = (msg: string) => showToggleErrorToast(toast, "R&D Hub", msg);
    const onErrorB = (msg: string) => showToggleErrorToast(toast, "Coaching", msg);

    onErrorA("Permission denied for venture ven-alpha");
    onErrorB("Permission denied for venture ven-beta");

    expect(toast.calls.error[0]).toContain("ven-alpha");
    expect(toast.calls.error[0]).not.toContain("ven-beta");

    expect(toast.calls.error[1]).toContain("ven-beta");
    expect(toast.calls.error[1]).not.toContain("ven-alpha");
  });

  it("closure label does not bleed across when second click happens before first response", () => {
    const toast = makeToast();

    // Simulate: admin clicks "Sustainability" row, then immediately clicks
    // "Governance" row.  Both requests are in-flight simultaneously.
    // The label each closure captured must survive until its own onError fires.
    let onErrorFirstClick!: (msg: string) => void;
    let onErrorSecondClick!: (msg: string) => void;

    // Closures built at click time (label frozen in closure scope).
    const buildOnError = (label: string) => (msg: string) =>
      showToggleErrorToast(toast, label, msg);

    onErrorFirstClick  = buildOnError("Sustainability");
    // Second click happens before first response arrives.
    onErrorSecondClick = buildOnError("Governance");

    // Responses arrive; second one resolves first (out-of-order is fine).
    onErrorSecondClick("Server error 500");
    onErrorFirstClick("Server error 503");

    // Two distinct toasts regardless of resolution order.
    expect(toast.calls.error).toHaveLength(2);
    expect(toast.calls.error[0]).toContain("Governance");
    expect(toast.calls.error[1]).toContain("Sustainability");
  });

  it("handles the same group label on both closures independently (no cross-contamination)", () => {
    // Edge case: same label on two rows (hypothetically duplicated config).
    const toast = makeToast();

    const onErrorA = (msg: string) => showToggleErrorToast(toast, "Risk Register", msg);
    const onErrorB = (msg: string) => showToggleErrorToast(toast, "Risk Register", msg);

    onErrorA("error from first row");
    onErrorB("error from second row");

    expect(toast.calls.error).toHaveLength(2);
    // Both toasts must carry the label; each carries its own server message.
    expect(toast.calls.error[0]).toContain("Risk Register");
    expect(toast.calls.error[0]).toContain("error from first row");
    expect(toast.calls.error[1]).toContain("Risk Register");
    expect(toast.calls.error[1]).toContain("error from second row");
  });
});

// ── buildResetOnSuccess — venture-drift detection via closure ─────────────────
//
// buildResetOnSuccess is called at click time and closes over the venture ID
// and name at that moment (the "snapshot").  When the returned onSuccess
// callback finally fires (after the server responds), it reads the CURRENT
// venture via the supplied getters.  If the admin switched ventures while the
// reset was in-flight, the callback must fire a WARNING toast naming both
// the venture that was reset and the venture now shown in the selector.
//
// These tests exercise that deferred-mutation pattern without React or a
// browser: two mutable ref objects stand in for ventureIdRef / ventureNameRef,
// and the returned callback is invoked manually to simulate the server response
// arriving.

describe("buildResetOnSuccess — venture-drift detection", () => {
  it("fires toast.success naming venture A when no drift occurs", () => {
    const toast = makeToast();

    // Simulate refs that hold the current venture.
    let currentVId:   string | null      = "ven-alpha";
    let currentVName: string | undefined = "Venture Alpha";

    // Admin clicks Reset for venture A — snapshot captured at click time.
    const onSuccess = buildResetOnSuccess(
      toast,
      "ven-alpha",        // ventureIdAtClick
      "Venture Alpha",    // ventureNameAtClick
      () => currentVId,   // getCurrentVId
      () => currentVName, // getCurrentVName
    );

    // Venture selector has NOT changed while the mutation was in-flight.
    // (refs still point to ven-alpha)

    // Server responds — onSuccess fires.
    onSuccess();

    expect(toast.calls.success).toHaveLength(1);
    expect(toast.calls.warning).toHaveLength(0);
    expect(toast.calls.error).toHaveLength(0);
    expect(toast.calls.success[0]).toContain("Venture Alpha");
    expect(toast.calls.success[0]).toContain("global defaults");
  });

  it("fires toast.warning naming both ventures when admin switches mid-reset", () => {
    const toast = makeToast();

    // Simulate refs that start on venture A.
    let currentVId:   string | null      = "ven-alpha";
    let currentVName: string | undefined = "Venture Alpha";

    // Admin clicks Reset for venture A — snapshot captured at click time.
    const onSuccess = buildResetOnSuccess(
      toast,
      "ven-alpha",
      "Venture Alpha",
      () => currentVId,
      () => currentVName,
    );

    // Admin switches to venture B while the reset mutation is in-flight.
    currentVId   = "ven-beta";
    currentVName = "Venture Beta";

    // Server responds — onSuccess fires with drifted refs.
    onSuccess();

    expect(toast.calls.warning).toHaveLength(1);
    expect(toast.calls.success).toHaveLength(0);
    expect(toast.calls.error).toHaveLength(0);
    // Warning must name the venture that was actually reset (snapshot).
    expect(toast.calls.warning[0]).toContain("Venture Alpha");
    // Warning must also name the venture the admin is now looking at.
    expect(toast.calls.warning[0]).toContain("Venture Beta");
  });

  it("snapshot is frozen at click time — later mutation of refs does not change the named venture", () => {
    const toast = makeToast();

    let currentVId:   string | null      = "ven-alpha";
    let currentVName: string | undefined = "Venture Alpha";

    const onSuccess = buildResetOnSuccess(
      toast,
      currentVId,
      currentVName,
      () => currentVId,
      () => currentVName,
    );

    // Refs change three times before the server responds — only the final
    // value matters for "current", but the snapshot must still be ven-alpha.
    currentVId   = "ven-gamma";
    currentVName = "Venture Gamma";
    currentVId   = "ven-delta";
    currentVName = "Venture Delta";
    currentVId   = "ven-beta";
    currentVName = "Venture Beta";

    onSuccess();

    // Warning must name the original snapshot venture, not any intermediate one.
    expect(toast.calls.warning[0]).toContain("Venture Alpha");
    expect(toast.calls.warning[0]).toContain("Venture Beta");
    expect(toast.calls.warning[0]).not.toContain("Venture Gamma");
    expect(toast.calls.warning[0]).not.toContain("Venture Delta");
  });

  it("fires toast.success when both snapshot and current are null (global scope, no drift)", () => {
    const toast = makeToast();

    let currentVId:   string | null      = null;
    let currentVName: string | undefined = undefined;

    const onSuccess = buildResetOnSuccess(
      toast,
      null,       // global scope at click time
      undefined,
      () => currentVId,
      () => currentVName,
    );

    // No drift — still on global scope.
    onSuccess();

    expect(toast.calls.success).toHaveLength(1);
    expect(toast.calls.success[0]).toContain("all ventures (global)");
    expect(toast.calls.warning).toHaveLength(0);
  });

  it("fires toast.warning when snapshot was a venture but admin is now on global scope", () => {
    const toast = makeToast();

    let currentVId:   string | null      = "ven-alpha";
    let currentVName: string | undefined = "Venture Alpha";

    const onSuccess = buildResetOnSuccess(
      toast,
      "ven-alpha",
      "Venture Alpha",
      () => currentVId,
      () => currentVName,
    );

    // Admin navigates away to the global (no-venture) view while reset is in-flight.
    currentVId   = null;
    currentVName = undefined;

    onSuccess();

    expect(toast.calls.warning).toHaveLength(1);
    expect(toast.calls.warning[0]).toContain("Venture Alpha");
    expect(toast.calls.warning[0]).toContain("all ventures (global)");
  });

  it("falls back to raw snapshotVId in the warning when snapshotVName is undefined", () => {
    const toast = makeToast();

    let currentVId:   string | null      = "ven-alpha";
    let currentVName: string | undefined = "Venture Alpha";

    // Simulate the guard failing: name was unavailable at click time.
    const onSuccess = buildResetOnSuccess(
      toast,
      "ven-alpha",
      undefined,          // name not available at click
      () => currentVId,
      () => currentVName,
    );

    // Admin switches ventures while in-flight.
    currentVId   = "ven-beta";
    currentVName = "Venture Beta";

    onSuccess();

    expect(toast.calls.warning).toHaveLength(1);
    // Raw ID must appear since no name was captured.
    expect(toast.calls.warning[0]).toContain("ven-alpha");
    expect(toast.calls.warning[0]).toContain("Venture Beta");
  });
});

// ── showConcurrentModificationToast ──────────────────────────────────────────
// Added with #40/#153 — surfaced when another admin modified module settings
// between this client's last refresh and the Enable All / Disable All batch.
// Must show a WARNING toast with clear "reload and retry" guidance.

import { showConcurrentModificationToast, showResetZeroRowsToast } from "./gate4ToastUtils";

describe("showConcurrentModificationToast", () => {
  it("fires toast.warning (not error) when a concurrent-modification conflict is detected", () => {
    const toast = makeToast();
    showConcurrentModificationToast(
      toast,
      "Concurrent modification detected: 2 group(s) were modified by another admin (bob) after your last refresh. Re-fetch the current state and retry. Affected groups: discovery, validation",
    );

    expect(toast.calls.warning).toHaveLength(1);
    expect(toast.calls.error).toHaveLength(0);
    expect(toast.calls.success).toHaveLength(0);
  });

  it("message tells the admin to reload the panel and retry", () => {
    const toast = makeToast();
    showConcurrentModificationToast(toast, "Concurrent modification detected: 1 group(s) were modified by another admin (alice).");

    expect(toast.calls.warning[0]).toContain("Reload");
    expect(toast.calls.warning[0]).toContain("try again");
  });

  it("message states changes were not applied", () => {
    const toast = makeToast();
    showConcurrentModificationToast(toast, "Concurrent modification detected: 3 group(s) were modified.");

    expect(toast.calls.warning[0]).toContain("not applied");
  });

  it("extracts count 1 from the server message and uses singular phrasing", () => {
    const toast = makeToast();
    showConcurrentModificationToast(toast, "Concurrent modification detected: 1 group(s) were modified by another admin (dave).");

    // Singular: "1 module setting was changed"
    expect(toast.calls.warning[0]).toMatch(/1 module setting was/);
  });

  it("extracts count 3 from the server message and uses plural phrasing", () => {
    const toast = makeToast();
    showConcurrentModificationToast(toast, "Concurrent modification detected: 3 group(s) were modified.");

    // Plural: "3 module settings were changed"
    expect(toast.calls.warning[0]).toMatch(/3 module settings were/);
  });

  it("handles a message with no count gracefully (generic fallback copy)", () => {
    const toast = makeToast();
    showConcurrentModificationToast(toast, "Concurrent modification detected: unknown error.");

    // No crash; still fires a warning
    expect(toast.calls.warning).toHaveLength(1);
    expect(toast.calls.warning[0]).toContain("not applied");
  });

  it("falls back to generic detail when count is 0 (zero is falsy — no specific count message)", () => {
    // "0 group(s)" matches the regex and parseInt gives 0, which is falsy.
    // The production code uses `if (count)` so 0 falls through to the generic fallback.
    // This test documents the current behaviour so any future change is deliberate.
    const toast = makeToast();
    showConcurrentModificationToast(
      toast,
      "Concurrent modification detected: 0 group(s) were modified by another admin.",
    );

    expect(toast.calls.warning).toHaveLength(1);
    // count=0 is falsy → generic message, NOT "0 module settings were changed"
    expect(toast.calls.warning[0]).toContain("Another admin changed module settings");
    expect(toast.calls.warning[0]).not.toContain("0 module settings");
  });
});

// ── showResetZeroRowsToast ────────────────────────────────────────────────────
// Added with #148 — surfaced when "Reset to global defaults" completes but
// deletes zero rows (the venture already uses global defaults).
// Must show a WARNING toast distinguishing the no-op from a true error.

describe("showResetZeroRowsToast", () => {
  it("fires toast.warning (not error or success) for the zero-row reset case", () => {
    const toast = makeToast();
    showResetZeroRowsToast(toast);

    expect(toast.calls.warning).toHaveLength(1);
    expect(toast.calls.error).toHaveLength(0);
    expect(toast.calls.success).toHaveLength(0);
  });

  it("message mentions global defaults so the admin understands why nothing changed", () => {
    const toast = makeToast();
    showResetZeroRowsToast(toast);

    expect(toast.calls.warning[0]).toContain("global defaults");
  });

  it("message conveys that nothing was reset (not a generic failure)", () => {
    const toast = makeToast();
    showResetZeroRowsToast(toast);

    // Should not say "failed" or "error" — it is a successful no-op, not a failure.
    expect(toast.calls.warning[0]).not.toMatch(/fail/i);
    expect(toast.calls.warning[0]).not.toMatch(/error/i);
  });

  it("message explains the reason (no venture-specific settings found)", () => {
    const toast = makeToast();
    showResetZeroRowsToast(toast);

    // The message should make it clear the venture already uses global defaults.
    expect(toast.calls.warning[0]).toMatch(/already uses global defaults|no venture-specific/i);
  });
});
