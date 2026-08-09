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
import { showToggleToast, showBatchToast, showResetToast } from "../client/src/lib/gate4ToastUtils";

// ── Fake toast spy ────────────────────────────────────────────────────────────

interface ToastCall {
  variant: "success" | "warning";
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
