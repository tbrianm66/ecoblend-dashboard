/**
 * Gate 4 — Module Badge State Tests
 *
 * Verifies that `resolveModuleBadge` (client/src/lib/gate4Utils.ts) correctly
 * determines the source badge for a module row given the query loading/error
 * state and the presence / absence of a DB row.
 *
 * The five states that admins see in the ReactivationPanel:
 *
 *   "loading"  — query still in-flight; badge must NOT render (prevents every
 *                module being labelled DEFAULT while data is being fetched)
 *   "unknown"  — query resolved but with an error; state is genuinely unknown
 *                (must not show DEFAULT — that would assert a successful empty response)
 *   "default"  — query resolved successfully but no DB row exists for this group
 *                (factory default; module has never been explicitly toggled)
 *   "global"   — a __global__ row is the authoritative source
 *   "venture"  — a venture-specific row is the authoritative source
 *
 * Why the synchronous derivation of `rows` matters (architectural note):
 *   The original hook used useState+useEffect to copy serverRows into local rows.
 *   React Query sets isLoading→false in the render that delivers serverRows, but
 *   the useEffect fires only after the render commits — creating a one-render window
 *   where isLoading===false but rows was still the stale empty array, so every module
 *   appeared DEFAULT immediately after the query resolved.
 *
 *   The fix replaces the state copy with useMemo so rows is always derived
 *   synchronously from serverRows. After this change, isLoading, isError, and rows
 *   are all consistent within the same render cycle, and these utility tests are
 *   sufficient to verify the badge logic exhaustively — there is no longer a timing
 *   gap that can only be caught at the hook/component level.
 */

import { describe, it, expect } from "vitest";
import { resolveModuleBadge, type ReactivationRow } from "../client/src/lib/gate4Utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRow(ventureId: string): ReactivationRow {
  return {
    groupId:   "discovery",
    ventureId,
    active:    true,
    toggledBy: "admin@test.com",
    toggledAt: new Date("2026-01-01T10:00:00Z"),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("resolveModuleBadge", () => {
  // ── Loading state (isLoading=true) ─────────────────────────────────────────
  describe("when the query is still loading (isLoading=true)", () => {
    it("returns 'loading' with no row — must not be mistaken for DEFAULT", () => {
      expect(resolveModuleBadge(true, false, undefined)).toBe("loading");
    });

    it("returns 'loading' even when a global row is present (data may be stale cache)", () => {
      expect(resolveModuleBadge(true, false, makeRow("__global__"))).toBe("loading");
    });

    it("returns 'loading' even when a venture row is present", () => {
      expect(resolveModuleBadge(true, false, makeRow("venture-abc"))).toBe("loading");
    });
  });

  // ── Error state (isError=true) ─────────────────────────────────────────────
  describe("when the query resolved with an error (isError=true)", () => {
    it("returns 'unknown' with no row — must not render DEFAULT for an unavailable response", () => {
      expect(resolveModuleBadge(false, true, undefined)).toBe("unknown");
    });

    it("returns 'unknown' even when a row is present (stale data; cannot assert source)", () => {
      expect(resolveModuleBadge(false, true, makeRow("__global__"))).toBe("unknown");
    });

    it("returns 'unknown' not 'loading' (query has resolved, just errored)", () => {
      const result = resolveModuleBadge(false, true, undefined);
      expect(result).not.toBe("loading");
      expect(result).toBe("unknown");
    });
  });

  // ── Empty successful response ───────────────────────────────────────────────
  describe("when the query resolved successfully and returned no row (isLoading=false, isError=false, row=undefined)", () => {
    it("returns 'default' — factory default applies, never explicitly toggled", () => {
      expect(resolveModuleBadge(false, false, undefined)).toBe("default");
    });

    it("is 'default' not 'loading' or 'unknown'", () => {
      const result = resolveModuleBadge(false, false, undefined);
      expect(result).not.toBe("loading");
      expect(result).not.toBe("unknown");
      expect(result).toBe("default");
    });
  });

  // ── Response contains toggle records ───────────────────────────────────────
  describe("when the query resolved and returned a row for this group", () => {
    it("returns 'global' for a __global__ row", () => {
      expect(resolveModuleBadge(false, false, makeRow("__global__"))).toBe("global");
    });

    it("returns 'venture' for a venture-specific row", () => {
      expect(resolveModuleBadge(false, false, makeRow("venture-xyz"))).toBe("venture");
    });

    it("returns 'venture' regardless of the venture ID value", () => {
      expect(resolveModuleBadge(false, false, makeRow("ven-001"))).toBe("venture");
      expect(resolveModuleBadge(false, false, makeRow("ven-999"))).toBe("venture");
    });
  });

  // ── isLoading takes priority over isError ──────────────────────────────────
  describe("priority: isLoading wins over isError", () => {
    it("returns 'loading' when both isLoading and isError are true", () => {
      expect(resolveModuleBadge(true, true, undefined)).toBe("loading");
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("distinguishes __global__ sentinel from visually similar strings", () => {
      // Only the exact sentinel "__global__" maps to "global"
      expect(resolveModuleBadge(false, false, makeRow("global"))).toBe("venture");
      expect(resolveModuleBadge(false, false, makeRow("__GLOBAL__"))).toBe("venture");
      expect(resolveModuleBadge(false, false, makeRow("__global__"))).toBe("global");
    });

    it("isLoading=false + isError=false + undefined row → 'default', never 'loading'", () => {
      const result = resolveModuleBadge(false, false, undefined);
      expect(result).not.toBe("loading");
      expect(result).toBe("default");
    });

    it("isLoading=true + isError=false + undefined row → 'loading', never 'default'", () => {
      const result = resolveModuleBadge(true, false, undefined);
      expect(result).not.toBe("default");
      expect(result).toBe("loading");
    });

    it("isLoading=false + isError=true + undefined row → 'unknown', never 'default'", () => {
      // Critically: an errored query must NOT claim the module has a DEFAULT (factory) state.
      const result = resolveModuleBadge(false, true, undefined);
      expect(result).not.toBe("default");
      expect(result).toBe("unknown");
    });
  });
});
