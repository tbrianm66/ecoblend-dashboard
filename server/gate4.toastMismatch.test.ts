/**
 * Gate 4 — Venture-Mismatch Toast Tests
 *
 * Verifies that the exported `showToggleToast` and `showBatchToast` helpers
 * (client/src/lib/gate4ToastUtils.ts) — the same functions called by
 * Sidebar.tsx:ReactivationPanel — emit the correct toast variant when the
 * venture selector drifts between the moment the user clicks a toggle and the
 * moment the server response arrives.
 *
 * These tests import and exercise the PRODUCTION functions directly; they do
 * NOT duplicate or reimplement the logic.  Any regression in the real decision
 * logic (wrong variant, wrong message, wrong duration) will cause failures here.
 *
 * Scenario under test
 * -------------------
 * 1. Admin has venture-A selected and clicks a module toggle.
 *    snapshotVId = "venture-A" is captured at click time.
 * 2. While the request is in-flight the admin switches the venture selector
 *    to venture-B; ventureIdRef.current is updated to "venture-B".
 * 3. onSuccess fires, passing snapshotVentureId = "venture-A" to the toast helper.
 * 4. showToggleToast compares snapshot ("venture-A") vs current ("venture-B"),
 *    detects drift, and fires toast.warning with both venture names.
 *
 * Test strategy
 * -------------
 * The `ToastApi` interface accepted by both helpers lets us inject a plain spy
 * object (no mocking framework, no browser, no sonner import required).  In
 * production, Sidebar.tsx passes sonner's `toast`; here we pass the spy.
 *
 * The `currentVId` / `currentVName` arguments simulate ventureIdRef.current /
 * ventureNameRef.current at the moment the onSuccess callback fires — i.e.
 * AFTER the venture selector may have changed.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { showToggleToast, showBatchToast, showResetToast, showResetErrorToast, buildResetOnSuccess } from "../client/src/lib/gate4ToastUtils";
import type { ToastApi } from "../client/src/lib/gate4ToastUtils";

// ── Fake toast spy ────────────────────────────────────────────────────────────

interface ToastCall {
  variant: "success" | "warning" | "error";
  message: string;
  options?: { duration?: number };
}

function makeToastSpy() {
  const calls: ToastCall[] = [];
  return {
    success(message: string) {
      calls.push({ variant: "success", message });
    },
    warning(message: string, options?: { duration?: number }) {
      calls.push({ variant: "warning", message, options });
    },
    error(message: string, options?: { duration?: number }) {
      calls.push({ variant: "error", message, options });
    },
    calls,
    reset() { calls.length = 0; },
    lastCall(): ToastCall | undefined { return calls[calls.length - 1]; },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Gate 4 — venture-mismatch toast (production helpers)", () => {
  let toast: ReturnType<typeof makeToastSpy>;

  beforeEach(() => {
    toast = makeToastSpy();
  });

  // ── showToggleToast ──────────────────────────────────────────────────────────

  describe("showToggleToast", () => {
    it("fires WARNING when the venture selector changed between click and response", () => {
      // Sequence:
      //   1. Admin selects venture-A and clicks the "Discovery" toggle.
      //   2. snapshotVId = "venture-A" captured at click time.
      //   3. Admin switches to venture-B while the request is in-flight.
      //   4. Server responds; currentVId now reflects venture-B.
      showToggleToast(
        toast,
        /* currentVId   */ "venture-B",
        /* currentVName */ "Beta Ltd",
        /* label        */ "Discovery",
        /* activated    */ true,
        /* snapshotVId  */ "venture-A",
        /* snapshotVName*/ "Alpha Corp",
      );

      const call = toast.lastCall()!;
      expect(call.variant).toBe("warning");
      // Must name the venture the write actually targeted.
      expect(call.message).toContain("Alpha Corp");
      // Must name the venture currently visible in the UI.
      expect(call.message).toContain("Beta Ltd");
      expect(call.message).toContain("activated");
      expect(call.message).toContain("Discovery");
      // Warning toasts carry a longer duration so admins have time to read them.
      expect(call.options?.duration).toBe(6000);
    });

    it("fires SUCCESS when the venture selector has NOT changed", () => {
      showToggleToast(
        toast,
        "venture-A", "Alpha Corp",
        "Discovery", true,
        "venture-A", "Alpha Corp",
      );

      const call = toast.lastCall()!;
      expect(call.variant).toBe("success");
      expect(call.message).toContain("Alpha Corp");
      expect(call.message).toContain("activated");
      expect(call.message).toContain("Discovery");
      // Success toasts do not carry a custom duration.
      expect(call.options).toBeUndefined();
    });

    it("fires WARNING for deactivation when the venture drifted", () => {
      showToggleToast(
        toast,
        "venture-B", "Beta Ltd",
        "Risk Intelligence", false,
        "venture-A", "Alpha Corp",
      );

      const call = toast.lastCall()!;
      expect(call.variant).toBe("warning");
      expect(call.message).toContain("deactivated");
      expect(call.message).toContain("Risk Intelligence");
      expect(call.message).toContain("Alpha Corp");
      expect(call.message).toContain("Beta Ltd");
    });

    it("fires SUCCESS for deactivation when the venture has not changed", () => {
      showToggleToast(
        toast,
        "venture-A", "Alpha Corp",
        "Risk Intelligence", false,
        "venture-A", "Alpha Corp",
      );

      const call = toast.lastCall()!;
      expect(call.variant).toBe("success");
      expect(call.message).toContain("deactivated");
      expect(call.message).toContain("Alpha Corp");
    });

    it("falls back to snapshotVId in the message when snapshotVName is undefined", () => {
      // Edge case: ventures list hasn't resolved; name is unavailable.
      showToggleToast(toast, "venture-B", "Beta Ltd", "Scoring", true, "venture-A", undefined);

      const call = toast.lastCall()!;
      expect(call.variant).toBe("warning");
      // Must show the raw ID rather than an empty string.
      expect(call.message).toContain("venture-A");
    });

    it("reports global scope correctly when snapshot was null and current has changed", () => {
      // Admin was on global scope (null), then switched to a specific venture
      // before the response arrived.
      showToggleToast(toast, "venture-A", "Alpha Corp", "Governance", true, null, undefined);

      const call = toast.lastCall()!;
      expect(call.variant).toBe("warning");
      expect(call.message).toContain("all ventures (global)");
      expect(call.message).toContain("Alpha Corp");
    });

    it("reports SUCCESS for global scope when no drift occurred (both null)", () => {
      showToggleToast(toast, null, undefined, "Governance", true, null, undefined);

      const call = toast.lastCall()!;
      expect(call.variant).toBe("success");
      expect(call.message).toContain("all ventures (global)");
    });
  });

  // ── showBatchToast ───────────────────────────────────────────────────────────

  describe("showBatchToast", () => {
    it("fires WARNING for Enable-All when the venture selector drifted", () => {
      // reactivateAll clicked while venture-A was selected;
      // venture selector changed to venture-B before the batch response arrived.
      showBatchToast(
        toast,
        "venture-B", "Beta Ltd",
        /* allActivated */ true,
        "venture-A", "Alpha Corp",
      );

      const call = toast.lastCall()!;
      expect(call.variant).toBe("warning");
      expect(call.message).toContain("All modules enabled");
      expect(call.message).toContain("Alpha Corp");
      expect(call.message).toContain("Beta Ltd");
      expect(call.options?.duration).toBe(6000);
    });

    it("fires SUCCESS for Enable-All when no venture drift occurred", () => {
      showBatchToast(toast, "venture-A", "Alpha Corp", true, "venture-A", "Alpha Corp");

      const call = toast.lastCall()!;
      expect(call.variant).toBe("success");
      expect(call.message).toContain("All modules enabled");
      expect(call.message).toContain("Alpha Corp");
    });

    it("fires WARNING for Disable-All when the venture selector drifted", () => {
      showBatchToast(toast, "venture-B", "Beta Ltd", false, "venture-A", "Alpha Corp");

      const call = toast.lastCall()!;
      expect(call.variant).toBe("warning");
      expect(call.message).toContain("All modules disabled");
      expect(call.message).toContain("Alpha Corp");
      expect(call.message).toContain("Beta Ltd");
    });

    it("fires SUCCESS for Disable-All when no venture drift occurred", () => {
      showBatchToast(toast, "venture-A", "Alpha Corp", false, "venture-A", "Alpha Corp");

      const call = toast.lastCall()!;
      expect(call.variant).toBe("success");
      expect(call.message).toContain("All modules disabled");
      expect(call.message).toContain("Alpha Corp");
    });

    it("falls back to snapshotVId when snapshotVName is undefined in batch warning", () => {
      showBatchToast(toast, "venture-B", "Beta Ltd", true, "venture-A", undefined);

      const call = toast.lastCall()!;
      expect(call.variant).toBe("warning");
      expect(call.message).toContain("venture-A");
    });
  });

  // ── showResetToast ───────────────────────────────────────────────────────────

  describe("showResetToast", () => {
    it("fires WARNING when the venture selector changed between click and response", () => {
      // Sequence:
      //   1. Admin has venture-A selected and clicks "Reset to global defaults".
      //   2. snapshotVId = "venture-A" captured at click time.
      //   3. Admin switches to venture-B while the request is in-flight.
      //   4. Server responds; currentVId now reflects venture-B.
      showResetToast(
        toast,
        /* currentVId   */ "venture-B",
        /* currentVName */ "Beta Ltd",
        /* snapshotVId  */ "venture-A",
        /* snapshotVName*/ "Alpha Corp",
      );

      const call = toast.lastCall()!;
      expect(call.variant).toBe("warning");
      // Must name the venture whose settings were actually reset.
      expect(call.message).toContain("Alpha Corp");
      // Must name the venture now visible in the selector.
      expect(call.message).toContain("Beta Ltd");
      expect(call.message).toContain("reset to global defaults");
      // Warning toasts carry a longer duration so admins have time to read them.
      expect(call.options?.duration).toBe(6000);
    });

    it("fires SUCCESS when no venture drift occurred", () => {
      showResetToast(
        toast,
        "venture-A", "Alpha Corp",
        "venture-A", "Alpha Corp",
      );

      const call = toast.lastCall()!;
      expect(call.variant).toBe("success");
      expect(call.message).toContain("Alpha Corp");
      expect(call.message).toContain("reset to global defaults");
      // Success toasts do not carry a custom duration.
      expect(call.options).toBeUndefined();
    });

    it("falls back to snapshotVId in the message when snapshotVName is undefined", () => {
      // Edge case: ventures list hasn't resolved; snapshot name is unavailable.
      showResetToast(toast, "venture-B", "Beta Ltd", "venture-A", undefined);

      const call = toast.lastCall()!;
      expect(call.variant).toBe("warning");
      // Must show the raw ID rather than an empty string.
      expect(call.message).toContain("venture-A");
      expect(call.message).toContain("Beta Ltd");
    });

    it("reports global scope when snapshotVId is null and currentVId has changed", () => {
      // Unusual path: snapshot was null (global), now a specific venture is selected.
      showResetToast(toast, "venture-A", "Alpha Corp", null, undefined);

      const call = toast.lastCall()!;
      expect(call.variant).toBe("warning");
      expect(call.message).toContain("all ventures (global)");
      expect(call.message).toContain("Alpha Corp");
    });

    it("fires SUCCESS for global scope when no drift occurred (both null)", () => {
      showResetToast(toast, null, undefined, null, undefined);

      const call = toast.lastCall()!;
      expect(call.variant).toBe("success");
      expect(call.message).toContain("all ventures (global)");
    });
  });

  // ── showResetErrorToast ──────────────────────────────────────────────────────

  describe("showResetErrorToast", () => {
    it("fires ERROR (not success) when the server rejects the reset", () => {
      showResetErrorToast(toast, "Permission denied");

      const call = toast.lastCall()!;
      expect(call.variant).toBe("error");
    });

    it("does NOT fire a success toast when the mutation fails", () => {
      showResetErrorToast(toast, "Unexpected DB error");

      // Only one toast must have been fired, and it must not be success.
      expect(toast.calls).toHaveLength(1);
      expect(toast.calls[0].variant).not.toBe("success");
    });

    it("includes the raw server error message in the error toast", () => {
      showResetErrorToast(toast, "Network request failed");

      const call = toast.lastCall()!;
      expect(call.message).toContain("Network request failed");
    });

    it("carries a duration so the admin has time to read the error", () => {
      showResetErrorToast(toast, "Internal server error");

      const call = toast.lastCall()!;
      expect(call.options?.duration).toBeGreaterThan(0);
    });

    it("includes a human-readable prefix in the error message", () => {
      showResetErrorToast(toast, "UNAUTHORIZED");

      const call = toast.lastCall()!;
      // Message must be more than just the raw error code.
      expect(call.message).toMatch(/reset failed/i);
    });
  });

  // ── Reset onError integration ────────────────────────────────────────────────
  //
  // These tests exercise the full callback chain that Sidebar.tsx wires:
  //   mutation.onError  →  onError(rawMessage)  →  showResetErrorToast(toast, rawMessage)
  // They confirm:
  //   (a) an error toast fires when the server rejects the reset, and
  //   (b) no success toast fires on that path.
  //
  // The parallel success-path test confirms showResetToast never emits an error
  // toast, so the two paths are mutually exclusive.

  describe("reset mutation onError → showResetErrorToast integration", () => {
    it("fires an ERROR toast and NO success toast when the mutation onError callback is invoked", () => {
      // Reproduce the exact chain in gate4Config.ts:resetToGlobalDefaults onError
      // and Sidebar.tsx's onError handler:
      //   err → rawMessage → showResetErrorToast(toast, rawMessage)
      const simulatedError = new Error("Permission denied");
      const rawMessage = simulatedError instanceof Error ? simulatedError.message : String(simulatedError);

      // This is exactly what Sidebar.tsx's onError callback calls:
      showResetErrorToast(toast, rawMessage);

      expect(toast.calls.filter(c => c.variant === "success")).toHaveLength(0);
      expect(toast.calls.filter(c => c.variant === "error")).toHaveLength(1);
      expect(toast.lastCall()!.message).toContain("Permission denied");
    });

    it("fires an ERROR toast and NO success toast for a network failure", () => {
      showResetErrorToast(toast, "Network request failed");

      expect(toast.calls.filter(c => c.variant === "success")).toHaveLength(0);
      expect(toast.calls.filter(c => c.variant === "error")).toHaveLength(1);
    });

    it("fires an ERROR toast and NO success toast for a permission error", () => {
      showResetErrorToast(toast, "UNAUTHORIZED");

      expect(toast.calls.filter(c => c.variant === "success")).toHaveLength(0);
      expect(toast.calls.filter(c => c.variant === "error")).toHaveLength(1);
    });

    it("does NOT fire an error toast on the success path (showResetToast)", () => {
      // Confirms the success path (mutation.onSuccess → showResetToast) never
      // emits an error toast — the two paths are mutually exclusive.
      showResetToast(toast, "venture-A", "Alpha Corp", "venture-A", "Alpha Corp");

      expect(toast.calls.filter(c => c.variant === "error")).toHaveLength(0);
      expect(toast.calls.filter(c => c.variant === "success")).toHaveLength(1);
    });
  });

  // ── Full out-of-order sequence ───────────────────────────────────────────────

  describe("full out-of-order sequence", () => {
    it("two toggles land in reverse order: mismatch one fires WARNING, aligned one fires SUCCESS", () => {
      // Toggle 1: fired for venture-A, lands while selector shows venture-B → warning.
      showToggleToast(toast, "venture-B", "Beta Ltd", "Scoring", true, "venture-A", "Alpha Corp");
      // Toggle 2: fired for venture-B (now current), lands while still on B → success.
      showToggleToast(toast, "venture-B", "Beta Ltd", "Risk Intelligence", true, "venture-B", "Beta Ltd");

      expect(toast.calls).toHaveLength(2);
      expect(toast.calls[0].variant).toBe("warning");
      expect(toast.calls[0].message).toContain("Alpha Corp");  // wrote to A
      expect(toast.calls[0].message).toContain("Beta Ltd");    // now on B
      expect(toast.calls[1].variant).toBe("success");
      expect(toast.calls[1].message).toContain("Beta Ltd");    // correct venture
    });

    it("batch Enable-All for A fires WARNING, then a per-toggle for B fires SUCCESS", () => {
      // Batch for venture-A completes while the selector now shows venture-B.
      showBatchToast(toast, "venture-B", "Beta Ltd", true, "venture-A", "Alpha Corp");
      // Subsequent single toggle for venture-B completes with no drift.
      showToggleToast(toast, "venture-B", "Beta Ltd", "Governance", true, "venture-B", "Beta Ltd");

      expect(toast.calls).toHaveLength(2);
      expect(toast.calls[0].variant).toBe("warning");
      expect(toast.calls[1].variant).toBe("success");
    });
  });
});

// ── Load-guarding — raw-ID fallback cannot fire on the happy path ─────────────
//
// Background
// ----------
// showToggleToast / showBatchToast contain a raw-ID fallback:
//   const scopeName = snapshotVId ? (snapshotVName ?? snapshotVId) : "all ventures (global)";
// When snapshotVName is undefined the venture ID is shown instead of the name.
//
// Production guard (ReactivationPanel in Sidebar.tsx)
// ---------------------------------------------------
// Every toggle / batch button is disabled when:
//   actionsDisabled = venturesLoading || (!!ventureId && !ventureName)
//
// The compound condition covers three failure modes:
//   (a) venturesLoading=true:  query in-flight, no data yet.
//   (b) ventureId set, ventureName undefined, venturesLoading=false:
//       query errored (availableVentures=[]) or transient window between
//       isLoading→false and the fallback-selection effect completing with a
//       stored/URL ID that doesn't match any loaded venture.
//   (c) Actions are enabled only when ventureId is null (global scope, no name
//       needed) OR when both ventureId and ventureName are defined (fully resolved).
//
// These tests model the guard formula and verify that when actionsDisabled is
// false the snapshot can never contain an undefined ventureName alongside a
// non-null ventureId.

describe("Gate 4 — load-guarding (actionsDisabled guard) prevents raw-ID fallback", () => {

  // ── Mirror of the production guard formula ───────────────────────────────────
  //
  // Mirrors: const actionsDisabled = venturesLoading || (!!ventureId && !ventureName);
  // Used in the simulate* helpers below to gate whether the click handler fires.

  function computeActionsDisabled(
    venturesLoading: boolean,
    ventureId: string | null,
    ventureName: string | undefined,
  ): boolean {
    return venturesLoading || (!!ventureId && !ventureName);
  }

  /** Models a toggle-button click with the production guard; returns true if the handler ran. */
  function simulateToggleClick(
    venturesLoading: boolean,
    ventureId: string | null,
    ventureName: string | undefined,
    handler: (snapshotVId: string | null, snapshotVName: string | undefined) => void,
  ): boolean {
    if (computeActionsDisabled(venturesLoading, ventureId, ventureName)) return false;
    handler(ventureId, ventureName); // snapshot captured at click time
    return true;
  }

  /** Models a batch-button click with the production guard; returns true if the handler ran. */
  function simulateBatchClick(
    venturesLoading: boolean,
    ventureId: string | null,
    ventureName: string | undefined,
    handler: (snapshotVId: string | null, snapshotVName: string | undefined) => void,
  ): boolean {
    if (computeActionsDisabled(venturesLoading, ventureId, ventureName)) return false;
    handler(ventureId, ventureName);
    return true;
  }

  let toast: ReturnType<typeof makeToastSpy>;

  beforeEach(() => {
    toast = makeToastSpy();
  });

  // ── actionsDisabled formula ──────────────────────────────────────────────────

  it("actionsDisabled is true when venturesLoading is true (query in-flight)", () => {
    expect(computeActionsDisabled(true, null,        undefined   )).toBe(true);
    expect(computeActionsDisabled(true, "venture-A", "Alpha Corp")).toBe(true);
    expect(computeActionsDisabled(true, "venture-A", undefined   )).toBe(true);
  });

  it("actionsDisabled is true when ventureId is set but ventureName has not resolved (error / transient state)", () => {
    // This covers: query errored (ventures=[]) or transient between isLoading→false
    // and the fallback-selection effect completing.
    expect(computeActionsDisabled(false, "venture-A", undefined)).toBe(true);
    expect(computeActionsDisabled(false, "venture-B", undefined)).toBe(true);
  });

  it("actionsDisabled is false when fully resolved — ventureId and ventureName both defined", () => {
    expect(computeActionsDisabled(false, "venture-A", "Alpha Corp")).toBe(false);
  });

  it("actionsDisabled is false for global scope — ventureId null, ventureName undefined", () => {
    // Global scope: no venture selected. ventureName is undefined but there is no
    // ventureId to fall back to, so showToggleToast will show "all ventures (global)".
    expect(computeActionsDisabled(false, null, undefined)).toBe(false);
  });

  // ── Guard: no click handler fires while disabled ─────────────────────────────

  it("toggle click does NOT fire while venturesLoading is true", () => {
    let fired = false;
    const ran = simulateToggleClick(true, "venture-A", "Alpha Corp", () => { fired = true; });
    expect(ran).toBe(false);
    expect(fired).toBe(false);
  });

  it("toggle click does NOT fire when ventureId is set but ventureName is unresolved (error/transient)", () => {
    // Models the query-error and transient-selection states the reviewer identified.
    let fired = false;
    const ran = simulateToggleClick(false, "venture-A", undefined, () => { fired = true; });
    expect(ran).toBe(false);
    expect(fired).toBe(false);
  });

  it("batch click does NOT fire while venturesLoading is true", () => {
    let fired = false;
    const ran = simulateBatchClick(true, "venture-A", "Alpha Corp", () => { fired = true; });
    expect(ran).toBe(false);
    expect(fired).toBe(false);
  });

  it("batch click does NOT fire when ventureId is set but ventureName is unresolved (error/transient)", () => {
    let fired = false;
    const ran = simulateBatchClick(false, "venture-A", undefined, () => { fired = true; });
    expect(ran).toBe(false);
    expect(fired).toBe(false);
  });

  // ── Guard allows clicks only in safe states ──────────────────────────────────

  it("toggle click fires when fully resolved (ventureId + ventureName both defined)", () => {
    let snapId: string | null = null;
    let snapName: string | undefined;

    const ran = simulateToggleClick(false, "venture-A", "Alpha Corp", (id, name) => {
      snapId = id; snapName = name;
    });

    expect(ran).toBe(true);
    expect(snapId).toBe("venture-A");
    expect(snapName).toBe("Alpha Corp");
    expect(typeof snapName).toBe("string");
  });

  it("toggle click fires for global scope (ventureId null, ventureName undefined)", () => {
    // Global scope is always safe: snapshotVId=null means showToggleToast uses
    // "all ventures (global)" — the raw-ID fallback branch is unreachable.
    let snapId: string | null = "SENTINEL" as any;
    let snapName: string | undefined = "SENTINEL";

    const ran = simulateToggleClick(false, null, undefined, (id, name) => {
      snapId = id; snapName = name;
    });

    expect(ran).toBe(true);
    expect(snapId).toBeNull();  // global scope
    expect(snapName).toBeUndefined();
  });

  it("batch click fires when fully resolved (ventureId + ventureName both defined)", () => {
    let snapId: string | null = null;
    let snapName: string | undefined;

    const ran = simulateBatchClick(false, "venture-A", "Alpha Corp", (id, name) => {
      snapId = id; snapName = name;
    });

    expect(ran).toBe(true);
    expect(snapId).toBe("venture-A");
    expect(snapName).toBe("Alpha Corp");
  });

  // ── Full loading → error → resolved sequence ─────────────────────────────────

  it("toggle: blocked during load, blocked during error/transient, fires only after full resolution", () => {
    let fired = false;
    let snapName: string | undefined;

    // Phase 1: isLoading=true (query in-flight).
    simulateToggleClick(true, "venture-A", undefined, (_, n) => { fired = true; snapName = n; });
    expect(fired).toBe(false);

    // Phase 2: isLoading=false, but ventures query errored — ventureName still undefined.
    simulateToggleClick(false, "venture-A", undefined, (_, n) => { fired = true; snapName = n; });
    expect(fired).toBe(false);

    // Phase 3: fully resolved — both ventureId and ventureName are defined.
    simulateToggleClick(false, "venture-A", "Alpha Corp", (_, n) => { fired = true; snapName = n; });
    expect(fired).toBe(true);
    expect(snapName).toBe("Alpha Corp");
    expect(typeof snapName).toBe("string");
  });

  it("batch: blocked during load, blocked during error/transient, fires only after full resolution", () => {
    let fired = false;
    let snapName: string | undefined;

    simulateBatchClick(true,  "venture-A", undefined,    (_, n) => { fired = true; snapName = n; });
    expect(fired).toBe(false);

    simulateBatchClick(false, "venture-A", undefined,    (_, n) => { fired = true; snapName = n; });
    expect(fired).toBe(false);

    simulateBatchClick(false, "venture-A", "Alpha Corp", (_, n) => { fired = true; snapName = n; });
    expect(fired).toBe(true);
    expect(snapName).toBe("Alpha Corp");
  });

  // ── End-to-end: guarded snapshot flows into toast helpers ────────────────────

  it("showToggleToast never uses raw ID when snapshotVName comes from a fully-resolved guard", () => {
    let snapId: string | null = null;
    let snapName: string | undefined;

    simulateToggleClick(false, "venture-A", "Alpha Corp", (id, name) => {
      snapId = id; snapName = name;
    });

    showToggleToast(
      toast,
      /* currentVId   */ "venture-A",
      /* currentVName */ "Alpha Corp",
      /* label        */ "Discovery",
      /* activated    */ true,
      snapId,
      snapName,
    );

    const call = toast.lastCall()!;
    expect(call.variant).toBe("success");
    expect(call.message).toContain("Alpha Corp");
    // Raw ID must not appear as the scope name (would indicate the fallback fired).
    expect(call.message).not.toMatch(/for venture-A[^:]/); // "for venture-A" without a colon
  });

  it("showBatchToast never uses raw ID when snapshotVName comes from a fully-resolved guard", () => {
    let snapId: string | null = null;
    let snapName: string | undefined;

    simulateBatchClick(false, "venture-A", "Alpha Corp", (id, name) => {
      snapId = id; snapName = name;
    });

    showBatchToast(
      toast,
      /* currentVId   */ "venture-A",
      /* currentVName */ "Alpha Corp",
      /* allActivated */ true,
      snapId,
      snapName,
    );

    const call = toast.lastCall()!;
    expect(call.variant).toBe("success");
    expect(call.message).toContain("Alpha Corp");
    expect(call.message).not.toMatch(/for venture-A[^:]/);
  });

  it("showToggleToast with drift shows human-readable name (not raw ID) on warning path when guard passed", () => {
    // Admin clicks while venture-A is fully resolved, then switches to venture-B.
    // Even in the WARNING path, the snapshot name is always a string because the
    // guard only passes when both ventureId and ventureName are defined.
    let snapId: string | null = null;
    let snapName: string | undefined;

    simulateToggleClick(false, "venture-A", "Alpha Corp", (id, name) => {
      snapId = id; snapName = name;
    });

    showToggleToast(
      toast,
      /* currentVId   */ "venture-B",  // selector drifted after click
      /* currentVName */ "Beta Ltd",
      /* label        */ "Risk Intelligence",
      /* activated    */ false,
      snapId,
      snapName,
    );

    const call = toast.lastCall()!;
    expect(call.variant).toBe("warning");
    expect(call.message).toContain("Alpha Corp"); // snapshot name — not raw ID
    expect(call.message).toContain("Beta Ltd");   // current venture name
    expect(call.message).not.toMatch(/for venture-A[^:]/);
  });

  it("showToggleToast for global scope shows 'all ventures (global)' — not a raw ID", () => {
    // Global scope is allowed through the guard with ventureId=null.
    // snapshotVId=null causes showToggleToast to produce "all ventures (global)".
    let snapId: string | null = null;
    let snapName: string | undefined;

    simulateToggleClick(false, null, undefined, (id, name) => {
      snapId = id; snapName = name;
    });

    showToggleToast(
      toast,
      /* currentVId   */ null,
      /* currentVName */ undefined,
      /* label        */ "Governance",
      /* activated    */ true,
      snapId,
      snapName,
    );

    const call = toast.lastCall()!;
    expect(call.variant).toBe("success");
    expect(call.message).toContain("all ventures (global)");
  });

  // ── Full loading → resolved sequence for null/global scope ──────────────────

  it("global scope (null ventureId): blocked while loading, fires after load, showToggleToast shows 'all ventures (global)'", () => {
    // Walks the full loading→resolved transition for the null/global path.
    //
    // Phase 1: venturesLoading=true, ventureId=null — guard blocks the click
    //   even though ventureId is null (the loading flag alone is enough to block).
    let fired = false;
    let snapId: string | null = "SENTINEL" as any;
    let snapName: string | undefined = "SENTINEL";

    const blockedDuringLoad = simulateToggleClick(
      true,       // venturesLoading — still in-flight
      null,       // ventureId — global scope
      undefined,  // ventureName — undefined for global scope
      (id, name) => { fired = true; snapId = id; snapName = name; },
    );
    expect(blockedDuringLoad).toBe(false);
    expect(fired).toBe(false);

    // Phase 2: venturesLoading=false, ventureId=null — global scope is now
    //   fully resolved. The guard must allow the click because null ventureId
    //   means there is no raw ID that could leak into the toast.
    const ranAfterLoad = simulateToggleClick(
      false,      // venturesLoading — query complete
      null,       // ventureId — global scope
      undefined,  // ventureName — always undefined for global scope
      (id, name) => { fired = true; snapId = id; snapName = name; },
    );
    expect(ranAfterLoad).toBe(true);
    expect(fired).toBe(true);
    expect(snapId).toBeNull();       // global scope
    expect(snapName).toBeUndefined(); // no name for global scope — safe

    // Phase 3: the captured snapshot (null, undefined) flows into showToggleToast.
    //   Because snapshotVId is null the helper MUST produce "all ventures (global)"
    //   and must NOT fall back to a raw ID (there is none).
    showToggleToast(
      toast,
      /* currentVId   */ null,
      /* currentVName */ undefined,
      /* label        */ "Governance",
      /* activated    */ true,
      snapId,
      snapName,
    );

    const call = toast.lastCall()!;
    expect(call.variant).toBe("success");
    expect(call.message).toContain("all ventures (global)");
    // Confirm a raw ID string did not slip into the message.
    expect(call.message).not.toMatch(/null/);
    expect(call.message).not.toMatch(/undefined/);
  });

  it("global scope (null ventureId): blocked while loading, fires after load, showBatchToast shows 'all ventures (global)'", () => {
    // Same full loading→resolved transition exercised for the batch action path.
    //
    // Phase 1: venturesLoading=true, ventureId=null — guard blocks the click.
    let fired = false;
    let snapId: string | null = "SENTINEL" as any;
    let snapName: string | undefined = "SENTINEL";

    const blockedDuringLoad = simulateBatchClick(
      true,       // venturesLoading — still in-flight
      null,       // ventureId — global scope
      undefined,  // ventureName — undefined for global scope
      (id, name) => { fired = true; snapId = id; snapName = name; },
    );
    expect(blockedDuringLoad).toBe(false);
    expect(fired).toBe(false);

    // Phase 2: venturesLoading=false, ventureId=null — guard allows the click.
    const ranAfterLoad = simulateBatchClick(
      false,      // venturesLoading — query complete
      null,       // ventureId — global scope
      undefined,  // ventureName — always undefined for global scope
      (id, name) => { fired = true; snapId = id; snapName = name; },
    );
    expect(ranAfterLoad).toBe(true);
    expect(fired).toBe(true);
    expect(snapId).toBeNull();
    expect(snapName).toBeUndefined();

    // Phase 3: the captured snapshot (null, undefined) flows into showBatchToast.
    //   snapshotVId=null → "all ventures (global)" must appear, never a raw ID.
    showBatchToast(
      toast,
      /* currentVId   */ null,
      /* currentVName */ undefined,
      /* allActivated */ true,
      snapId,
      snapName,
    );

    const call = toast.lastCall()!;
    expect(call.variant).toBe("success");
    expect(call.message).toContain("all ventures (global)");
    expect(call.message).not.toMatch(/null/);
    expect(call.message).not.toMatch(/undefined/);
  });

  // ── Reset button load-guard path (buildResetOnSuccess production factory) ────
  //
  // The "Reset to global defaults" button in ReactivationPanel uses a
  // CONDITIONAL-RENDER guard:
  //
  //   {ventureId && ventureName && (
  //     <ReactivationResetButton ... onReset={() => {
  //       resetToGlobalDefaults(
  //         buildResetOnSuccess(toast, ventureId, ventureName, ...),
  //         ...
  //       );
  //     }} />
  //   )}
  //
  // buildResetOnSuccess is the extracted production factory tested below.
  // It accepts ventureNameAtClick as `string | undefined` — matching the
  // production type — so these tests can exercise BOTH the safe path (guard
  // passed, name is defined) AND the unsafe path (guard absent, name is
  // undefined → raw-ID fallback fires), proving the guard is load-bearing.

  // ── Raw-ID fallback fires when ventureName is undefined at click time ──────

  it("buildResetOnSuccess: raw-ID fallback fires when ventureName is undefined at click time (guard absent)", () => {
    // This proves the conditional-render guard is NECESSARY.
    // If the button were clickable while ventureName=undefined, the toast
    // would show the raw venture ID instead of a human-readable name.
    const onSuccess = buildResetOnSuccess(
      toast,
      /* ventureIdAtClick   */ "venture-A",
      /* ventureNameAtClick */ undefined,        // loading / unresolved — no name yet
      () => "venture-A",
      () => undefined,
    );
    onSuccess();

    const call = toast.lastCall()!;
    expect(call.variant).toBe("success");
    // Raw ID appears because ventureName was undefined at click time.
    expect(call.message).toContain("venture-A");
    expect(call.message).not.toContain("Alpha Corp");
  });

  // ── Name is preserved when fully resolved at click time ───────────────────

  it("buildResetOnSuccess: shows human-readable name (not raw ID) when ventureName is defined at click time", () => {
    // Mirrors the normal production path: guard passes (ventureId && ventureName),
    // so ventureName is a defined string when the factory is called.
    const onSuccess = buildResetOnSuccess(
      toast,
      /* ventureIdAtClick   */ "venture-A",
      /* ventureNameAtClick */ "Alpha Corp",     // fully resolved — guard has passed
      () => "venture-A",
      () => "Alpha Corp",
    );
    onSuccess();

    const call = toast.lastCall()!;
    expect(call.variant).toBe("success");
    expect(call.message).toContain("Alpha Corp");
    expect(call.message).not.toMatch(/venture-A[^:]/);
  });

  // ── Snapshot is captured at factory-call time, not callback-invocation time ─

  it("buildResetOnSuccess: snapshot captured at click time survives a selector drift", () => {
    // Admin clicks reset while venture-A is fully resolved (guard passes),
    // then selector switches to venture-B before the mutation resolves.
    // The onSuccess callback must still reference the snapshotted venture-A name.
    let currentVId   = "venture-A";
    let currentVName: string | undefined = "Alpha Corp";

    const onSuccess = buildResetOnSuccess(
      toast,
      /* ventureIdAtClick   */ "venture-A",
      /* ventureNameAtClick */ "Alpha Corp",
      () => currentVId,
      () => currentVName,
    );

    // Selector changes mid-flight.
    currentVId   = "venture-B";
    currentVName = "Beta Ltd";

    onSuccess();

    const call = toast.lastCall()!;
    expect(call.variant).toBe("warning");
    expect(call.message).toContain("Alpha Corp"); // snapshot name — not raw ID
    expect(call.message).toContain("Beta Ltd");   // current venture name
    expect(call.message).not.toMatch(/venture-A[^:]/);
    expect(call.message).toMatch(/reset to global defaults/i);
  });

  // ── Full loading → error → resolved sequence ─────────────────────────────

  it("buildResetOnSuccess: snapshot from resolved state always uses name; snapshot from unresolved state uses raw ID", () => {
    // Phase 1: factory called while ventures still loading — ventureName undefined.
    //          The onSuccess closure captures undefined as the snapshot name.
    const callbackUnresolved = buildResetOnSuccess(
      toast,
      "venture-A",
      undefined,       // loading — name not yet available
      () => "venture-A",
      () => "Alpha Corp",
    );
    callbackUnresolved();
    const unresolved = toast.lastCall()!;
    expect(unresolved.variant).toBe("success");
    expect(unresolved.message).toContain("venture-A"); // raw ID (fallback)
    expect(unresolved.message).not.toContain("Alpha Corp");

    toast.reset();

    // Phase 2: factory called after full resolution — ventureName is defined.
    //          The onSuccess closure captures "Alpha Corp" as the snapshot name.
    const callbackResolved = buildResetOnSuccess(
      toast,
      "venture-A",
      "Alpha Corp",    // fully resolved — guard has passed
      () => "venture-A",
      () => "Alpha Corp",
    );
    callbackResolved();
    const resolved = toast.lastCall()!;
    expect(resolved.variant).toBe("success");
    expect(resolved.message).toContain("Alpha Corp"); // human-readable name
    expect(resolved.message).not.toMatch(/venture-A[^:]/);
  });

  it("buildResetOnSuccess: message contains 'reset to global defaults' on both success and warning paths", () => {
    // ── Success path ──────────────────────────────────────────────────────────
    buildResetOnSuccess(
      toast,
      "venture-A", "Alpha Corp",
      () => "venture-A", () => "Alpha Corp",
    )();
    const successCall = toast.lastCall()!;
    expect(successCall.variant).toBe("success");
    expect(successCall.message).toMatch(/reset to global defaults/i);

    // ── Warning (drift) path ──────────────────────────────────────────────────
    toast.reset();
    buildResetOnSuccess(
      toast,
      "venture-A", "Alpha Corp",
      () => "venture-B", () => "Beta Ltd",
    )();
    const warnCall = toast.lastCall()!;
    expect(warnCall.variant).toBe("warning");
    expect(warnCall.message).toMatch(/reset to global defaults/i);
  });
});
