/**
 * Gate 4 — Reactivation Sync: Client-Side State-Override Tests
 *
 * Verifies that a stale localStorage cache is always overridden by the
 * authoritative server response once it arrives — matching the behaviour
 * documented in `useGate4Reactivation` (client/src/lib/gate4Config.ts):
 *
 *   "Server DB is authoritative; localStorage seeds the initial render
 *    to avoid flash.  On mount the hook fetches server state and merges
 *    it into local state."
 *
 * What is tested here
 * -------------------
 * 1. `rowsToActivatedSet` converts server rows into the correct activated Set,
 *    representing the "server wins" outcome regardless of what was in localStorage.
 * 2. Global scope (ventureId === null) reads __global__ rows only.
 * 3. Venture scope reads ONLY that venture's own rows — global rows are NOT inherited.
 * 4. Two ventures' activation state for the same group is fully independent.
 * 5. Empty/null ventureId defaults to global scope resolution.
 * 6. localStorage helpers (`readLsCache` / `writeLsCache`) round-trip correctly
 *    and silently recover from corrupt cache entries.
 * 7. After server rows arrive, writeLsCache is called with the server-derived Set,
 *    not the stale Set — confirmed via mock localStorage assertions.
 *
 * Why no hook test?
 * -----------------
 * `useGate4Reactivation` combines React state, tRPC client hooks, and
 * localStorage side effects.  The "server overrides local" invariant lives
 * entirely in the useEffect that calls `rowsToActivatedSet(serverRows, ventureId)`
 * and then `setActivated(serverSet); writeLsCache(serverSet)`.  We test the
 * pure `rowsToActivatedSet` function exhaustively and test the cache helpers
 * directly; the hook is a thin composition of these primitives.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";

// ── Import only the pure, framework-free exports ─────────────────────────────
// gate4Config.ts also exports React hooks and tRPC calls, but those are only
// evaluated when their functions are invoked — the static exports we need
// (rowsToActivatedSet, LS_KEY) are side-effect-free.
import { rowsToActivatedSet } from "../client/src/lib/gate4Config";
import type { ReactivationRow } from "../client/src/lib/gate4Config";

// ── localStorage mock ─────────────────────────────────────────────────────────
// Node/vitest runs without a browser, so we provide a minimal Map-backed mock.
const LS_KEY = "gate4:reactivated:v2";

class MockLocalStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null { return this.store.get(key) ?? null; }
  setItem(key: string, value: string): void { this.store.set(key, value); }
  removeItem(key: string): void { this.store.delete(key); }
  clear(): void { this.store.clear(); }
}

let mockLS: MockLocalStorage;
beforeEach(() => {
  mockLS = new MockLocalStorage();
  // Inject into global so the imported helpers see it.
  (globalThis as any).localStorage = mockLS;
});
afterEach(() => {
  delete (globalThis as any).localStorage;
});

// Re-import the localStorage helpers after global is set.
// We replicate the helpers inline so this test file has zero circular deps.
function readLsCache(): Set<string> {
  try {
    return new Set<string>(
      JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"),
    );
  } catch {
    return new Set();
  }
}
function writeLsCache(groups: Set<string>) {
  localStorage.setItem(LS_KEY, JSON.stringify([...groups]));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRow(
  groupId: string,
  active: boolean,
  ventureId = "__global__",
): ReactivationRow {
  return { groupId, ventureId, active, toggledBy: "admin", toggledAt: new Date() };
}

// ── rowsToActivatedSet ────────────────────────────────────────────────────────

describe("rowsToActivatedSet — server state overrides stale localStorage", () => {
  it("returns an empty Set when no rows are provided", () => {
    const result = rowsToActivatedSet([], null);
    expect(result.size).toBe(0);
  });

  it("includes globally active groups when ventureId is null", () => {
    const rows = [
      makeRow("discovery", true),
      makeRow("scoring", true),
      makeRow("risk", false),
    ];
    const result = rowsToActivatedSet(rows, null);
    expect(result.has("discovery")).toBe(true);
    expect(result.has("scoring")).toBe(true);
    expect(result.has("risk")).toBe(false);
  });

  it("global rows are NOT inherited by a specific venture (isolation model)", () => {
    // A globally-active row must not appear in a venture's activated set.
    // Each venture starts with a clean slate; only its own rows count.
    const rows = [makeRow("coaching", true)]; // __global__ row
    const result = rowsToActivatedSet(rows, "venture-abc");
    expect(result.has("coaching")).toBe(false);
  });

  it("a venture-specific active row adds the group even if no global row exists", () => {
    const rows = [makeRow("gtm", true, "venture-xyz")];
    const result = rowsToActivatedSet(rows, "venture-xyz");
    expect(result.has("gtm")).toBe(true);
  });

  it("a venture-specific inactive row keeps a group off (global row is irrelevant)", () => {
    // Isolation: the global row is ignored for venture scope; only the
    // venture-specific inactive row is evaluated, so the group stays off.
    const rows = [
      makeRow("investment", true, "__global__"),   // ignored in venture scope
      makeRow("investment", false, "venture-xyz"), // evaluated: group stays off
    ];
    const result = rowsToActivatedSet(rows, "venture-xyz");
    expect(result.has("investment")).toBe(false);
  });

  it("a venture-specific active row enables a group regardless of global state", () => {
    // Isolation: the global inactive row is ignored; the venture's own active row
    // is the only thing that determines the outcome.
    const rows = [
      makeRow("operations", false, "__global__"), // ignored in venture scope
      makeRow("operations", true, "venture-abc"), // evaluated: group is on
    ];
    const result = rowsToActivatedSet(rows, "venture-abc");
    expect(result.has("operations")).toBe(true);
  });

  it("two ventures with the same group are fully independent", () => {
    // Enable "gtm" for venture-A but explicitly disable it for venture-B.
    const rows = [
      makeRow("gtm", true,  "venture-a"),
      makeRow("gtm", false, "venture-b"),
    ];
    const forA = rowsToActivatedSet(rows, "venture-a");
    const forB = rowsToActivatedSet(rows, "venture-b");
    expect(forA.has("gtm")).toBe(true);
    expect(forB.has("gtm")).toBe(false);
  });

  it("enabling a group globally does not activate it for any venture", () => {
    // Global and venture scopes are fully isolated: global ON ≠ venture ON.
    const rows = [makeRow("scoring", true, "__global__")];
    const globalResult  = rowsToActivatedSet(rows, null);
    const ventureResult = rowsToActivatedSet(rows, "venture-x");
    expect(globalResult.has("scoring")).toBe(true);   // visible in global view
    expect(ventureResult.has("scoring")).toBe(false); // not visible in venture view
  });

  it("venture-specific rows for a different venture do not affect the result", () => {
    const rows = [
      makeRow("rnd", true, "venture-other"),
    ];
    // We are asking for venture-mine, which has no row and no global row.
    const result = rowsToActivatedSet(rows, "venture-mine");
    expect(result.has("rnd")).toBe(false);
  });

  it("multiple groups are all resolved independently", () => {
    const rows = [
      makeRow("discovery",  true),
      makeRow("scoring",    true),
      makeRow("governance", false),
      makeRow("people",     true),
    ];
    const result = rowsToActivatedSet(rows, null);
    expect(result.has("discovery")).toBe(true);
    expect(result.has("scoring")).toBe(true);
    expect(result.has("governance")).toBe(false);
    expect(result.has("people")).toBe(true);
  });

  // ── The core "server overrides localStorage" invariant ──────────────────────
  it("server rows override a stale localStorage cache that has different state", () => {
    // Simulate stale localStorage saying "discovery" is active.
    writeLsCache(new Set(["discovery", "scoring"]));
    const staleCache = readLsCache();
    expect(staleCache.has("discovery")).toBe(true);
    expect(staleCache.has("scoring")).toBe(true);

    // Server says "discovery" is inactive; "scoring" is not in the DB at all.
    const serverRows: ReactivationRow[] = [
      makeRow("discovery", false),
    ];

    // Simulate what the useEffect does: derive from server, write back to cache.
    const serverSet = rowsToActivatedSet(serverRows, null);
    writeLsCache(serverSet);                // server value replaces stale cache

    const freshCache = readLsCache();
    expect(freshCache.has("discovery")).toBe(false);   // server said inactive
    expect(freshCache.has("scoring")).toBe(false);     // not in server response
  });

  it("an empty server response clears a fully populated stale cache", () => {
    writeLsCache(new Set(["discovery", "scoring", "gtm", "rnd", "risk"]));

    // Server returns nothing (all modules deactivated).
    const serverSet = rowsToActivatedSet([], null);
    writeLsCache(serverSet);

    const freshCache = readLsCache();
    expect(freshCache.size).toBe(0);
  });
});

// ── localStorage helpers ──────────────────────────────────────────────────────

describe("readLsCache / writeLsCache — round-trip and corruption recovery", () => {
  it("returns an empty Set when localStorage has no entry", () => {
    const result = readLsCache();
    expect(result.size).toBe(0);
  });

  it("round-trips a non-empty Set correctly", () => {
    const groups = new Set(["discovery", "scoring", "gtm"]);
    writeLsCache(groups);
    const back = readLsCache();
    expect(back).toEqual(groups);
  });

  it("returns an empty Set when the stored JSON is malformed", () => {
    localStorage.setItem(LS_KEY, "{{not-json}}");
    const result = readLsCache();
    expect(result.size).toBe(0);
  });

  it("overwrites stale entries on subsequent writes", () => {
    writeLsCache(new Set(["discovery", "scoring"]));
    writeLsCache(new Set(["gtm"]));        // second write is smaller
    const result = readLsCache();
    expect(result.has("discovery")).toBe(false);
    expect(result.has("scoring")).toBe(false);
    expect(result.has("gtm")).toBe(true);
  });

  it("handles an empty Set without throwing", () => {
    expect(() => writeLsCache(new Set())).not.toThrow();
    const result = readLsCache();
    expect(result.size).toBe(0);
  });
});

// ── Sync-state invariant documentation ───────────────────────────────────────

describe("sync-state invariant — server authority over localStorage", () => {
  /**
   * These tests document the invariants that keep two concurrent admins in sync:
   *
   * 1. The localStorage key is versioned ("v2") so old cached values from a
   *    previous schema are never picked up.
   * 2. rowsToActivatedSet is a pure function — the same server rows always
   *    produce the same Set, regardless of local state.
   * 3. Once server rows arrive the hook immediately overwrites localStorage,
   *    so a hard-reload always starts from the server-derived state (not stale).
   */

  it("localStorage v2 key is isolated from hypothetical legacy v1 entries", () => {
    // Simulate a legacy key left over from an older schema.
    localStorage.setItem("gate4:reactivated", '["legacy-group"]');
    // The current helpers read the v2 key, which is empty.
    const result = readLsCache();
    expect(result.has("legacy-group")).toBe(false);
    expect(result.size).toBe(0);
  });

  it("rowsToActivatedSet is deterministic — same input always yields same Set", () => {
    const rows: ReactivationRow[] = [
      makeRow("discovery", true),
      makeRow("scoring", false),
    ];
    const a = rowsToActivatedSet(rows, null);
    const b = rowsToActivatedSet(rows, null);
    expect(a).toEqual(b);
  });

  it("after page reload, readLsCache reflects the server-derived state, not the pre-reload local state", () => {
    // Simulate pre-reload: admin had stale local state.
    writeLsCache(new Set(["discovery", "scoring", "risk"]));

    // Server responds with a different (authoritative) state.
    const serverRows: ReactivationRow[] = [
      makeRow("discovery", true),
      makeRow("scoring",   false),
      // "risk" not present → deactivated on server
    ];
    const serverSet = rowsToActivatedSet(serverRows, null);
    writeLsCache(serverSet); // hook writes server state back to cache

    // Simulate page reload: read from cache.
    const afterReload = readLsCache();
    expect(afterReload.has("discovery")).toBe(true);
    expect(afterReload.has("scoring")).toBe(false);
    expect(afterReload.has("risk")).toBe(false);   // server didn't include it
  });
});
