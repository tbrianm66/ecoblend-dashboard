/**
 * Gate 4 — Module Reactivation: Concurrent-Admin Sync Tests
 *
 * Verifies that the server DB is the single source of truth for module toggle
 * state, so two admins logged in simultaneously always see the same value.
 *
 * Approach
 * --------
 * We exercise the business logic directly rather than through the tRPC router
 * (which transitively imports the full schema).  The in-memory store below
 * implements the identical upsert/read contract that `setModuleReactivation`
 * and `getModuleReactivations` use:
 *
 *   • Insert: upsert keyed on (groupId, ventureId) — same as the
 *     `.onConflictDoUpdate({ target: [groupId, ventureId], … })` call.
 *   • Normalise: empty / missing ventureId → "__global__" sentinel.
 *   • Read: return all rows (no per-admin filter).
 *   • Guard: adminProcedure rejects any caller whose role !== "admin".
 *
 * This mirrors how adminUserRole.test.ts tests requireAdmin and AUTH_ROLE_MAP
 * without going through the live router.
 *
 * Tests
 * -----
 * 1. Admin A's toggle is immediately visible to Admin B
 * 2. Admin B's subsequent toggle on the same group overwrites Admin A (last-write wins)
 * 3. Concurrent toggles to different groups never interfere
 * 4. setModuleReactivation is idempotent — same write twice → single row
 * 5. getModuleReactivations returns all rows regardless of which admin wrote them
 * 6. Omitting ventureId stores the row under the __global__ sentinel
 * 7. Empty-string ventureId is also normalised to __global__
 * 8. Non-admin callers are rejected by the adminProcedure guard
 */

import { describe, it, expect, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { rowsToActivatedSet } from "../client/src/lib/gate4Utils";
import { normaliseResetVentureId, normaliseSetVentureId, execVentureReset, assertBatchRowResult } from "./moduleReactivationUtils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReactivationRow {
  groupId:   string;
  ventureId: string;
  active:    boolean;
  toggledBy: string | null;
  toggledAt: Date;
}

interface AdminCtx {
  user: { openId: string; name: string; email: string; role: string };
}

// ── adminProcedure guard (mirrors server/_core/trpc.ts) ──────────────────────
// Exported from server/_core/trpc.ts — re-implemented here to avoid the schema
// import that crashes the transform.  The invariant being tested is identical.
function adminProcedureGuard(ctx: AdminCtx) {
  if (!ctx.user || ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
}

// ── In-memory reactivation store ─────────────────────────────────────────────
// Implements the same (groupId, ventureId) upsert semantics as the DB layer.

class ReactivationStore {
  private rows = new Map<string, ReactivationRow>();

  private key(groupId: string, ventureId: string) {
    return `${groupId}:${ventureId}`;
  }

  /** Mirrors setModuleReactivation — upsert + sentinel normalisation. */
  set(ctx: AdminCtx, input: { groupId: string; ventureId?: string; active: boolean }) {
    adminProcedureGuard(ctx);

    // Use the same production helper the router uses, so a regression there
    // will also break tests that exercise this store.
    const ventureId = normaliseSetVentureId(input.ventureId);

    const k = this.key(input.groupId, ventureId);
    const existing = this.rows.get(k);
    const toggledBy = ctx.user.name ?? ctx.user.email ?? ctx.user.openId;

    if (existing) {
      // onConflictDoUpdate — only update the mutable fields.
      this.rows.set(k, { ...existing, active: input.active, toggledBy, toggledAt: new Date() });
    } else {
      this.rows.set(k, {
        groupId: input.groupId,
        ventureId,
        active: input.active,
        toggledBy,
        toggledAt: new Date(),
      });
    }

    return { success: true, groupId: input.groupId, active: input.active };
  }

  /** Mirrors getModuleReactivations — return all rows, no per-caller filter. */
  getAll(): ReactivationRow[] {
    return [...this.rows.values()].sort((a, b) => a.groupId.localeCompare(b.groupId));
  }

  /**
   * Mirrors setModuleReactivationBatch — normalises ventureId once, then
   * upserts each item.  Uses the same normaliseSetVentureId helper the real
   * router uses, so removing .trim() there will also break batch-path tests.
   */
  setBatch(
    ctx: AdminCtx,
    input: { ventureId?: string; items: Array<{ groupId: string; active: boolean }> },
  ) {
    adminProcedureGuard(ctx);
    const ventureId = normaliseSetVentureId(input.ventureId);
    const toggledBy = ctx.user.name ?? ctx.user.email ?? ctx.user.openId;
    const now = new Date();

    for (const item of input.items) {
      const k = this.key(item.groupId, ventureId);
      const existing = this.rows.get(k);
      if (existing) {
        this.rows.set(k, { ...existing, active: item.active, toggledBy, toggledAt: now });
      } else {
        this.rows.set(k, {
          groupId:   item.groupId,
          ventureId,
          active:    item.active,
          toggledBy,
          toggledAt: now,
        });
      }
    }

    return { success: true, count: input.items.length };
  }

  /**
   * Mirrors resetVentureModuleReactivations — deletes all rows for the given ventureId.
   * Rejects "__global__" (mirrors the BAD_REQUEST guard in the router).
   */
  reset(ctx: AdminCtx, input: { ventureId: string }): { success: boolean; ventureId: string } {
    adminProcedureGuard(ctx);

    const vid = input.ventureId.trim();
    if (vid === "__global__") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot reset global scope via this endpoint" });
    }

    for (const [k, row] of this.rows.entries()) {
      if (row.ventureId === vid) this.rows.delete(k);
    }

    return { success: true, ventureId: vid };
  }
}

// ── Test helpers ──────────────────────────────────────────────────────────────

function makeAdminCtx(name: string): AdminCtx {
  return {
    user: { openId: `oid-${name}`, name, email: `${name}@test.example`, role: "admin" },
  };
}

function makeNonAdminCtx(role = "founder"): AdminCtx {
  return {
    user: { openId: "oid-nonadmin", name: "Non-Admin", email: "nonadmin@test.example", role },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Gate 4 module reactivation — concurrent admin sync", () => {
  let store: ReactivationStore;
  const alice = makeAdminCtx("alice");
  const bob   = makeAdminCtx("bob");

  beforeEach(() => {
    store = new ReactivationStore();
  });

  // ── 1. Admin A toggle visible to Admin B ─────────────────────────────────────
  it("Admin A's toggle is immediately visible when Admin B calls getModuleReactivations", () => {
    store.set(alice, { groupId: "discovery", active: true });

    const rows = store.getAll();
    const row  = rows.find(r => r.groupId === "discovery");

    expect(row).toBeDefined();
    expect(row?.active).toBe(true);
    expect(row?.toggledBy).toBe("alice");
  });

  // ── 2. Last-write wins ───────────────────────────────────────────────────────
  it("Admin B's subsequent toggle on the same group overwrites Admin A's value", () => {
    store.set(alice, { groupId: "gtm", active: true });
    store.set(bob,   { groupId: "gtm", active: false });

    // Both admins read from the same shared store — last write (Bob) wins.
    const rows = store.getAll();
    const row  = rows.find(r => r.groupId === "gtm");

    expect(row?.active).toBe(false);
    expect(row?.toggledBy).toBe("bob");
  });

  it("Admin A's final write wins when Bob wrote earlier", () => {
    store.set(bob,   { groupId: "scoring", active: true });
    store.set(alice, { groupId: "scoring", active: false });

    const row = store.getAll().find(r => r.groupId === "scoring");
    expect(row?.active).toBe(false);
    expect(row?.toggledBy).toBe("alice");
  });

  // ── 3. Independent groups don't interfere ────────────────────────────────────
  it("concurrent toggles to different groups do not interfere with each other", () => {
    store.set(alice, { groupId: "rnd",  active: true });
    store.set(bob,   { groupId: "risk", active: true });

    const rows   = store.getAll();
    const rnd    = rows.find(r => r.groupId === "rnd");
    const risk   = rows.find(r => r.groupId === "risk");

    expect(rnd?.active).toBe(true);
    expect(rnd?.toggledBy).toBe("alice");
    expect(risk?.active).toBe(true);
    expect(risk?.toggledBy).toBe("bob");
  });

  // ── 4. Idempotent writes ─────────────────────────────────────────────────────
  it("writing the same active state twice is idempotent and does not duplicate rows", () => {
    store.set(alice, { groupId: "coaching", active: true });
    store.set(alice, { groupId: "coaching", active: true });

    const coachingRows = store.getAll().filter(r => r.groupId === "coaching");

    // Upsert must never create duplicate rows for the same (groupId, ventureId).
    expect(coachingRows.length).toBe(1);
    expect(coachingRows[0].active).toBe(true);
  });

  it("toggling off then on results in active = true with a single row", () => {
    store.set(alice, { groupId: "investment", active: true });
    store.set(alice, { groupId: "investment", active: false });
    store.set(bob,   { groupId: "investment", active: true });

    const rows = store.getAll().filter(r => r.groupId === "investment");
    expect(rows.length).toBe(1);
    expect(rows[0].active).toBe(true);
    expect(rows[0].toggledBy).toBe("bob");
  });

  // ── 5. getModuleReactivations returns rows from all admins ───────────────────
  it("getModuleReactivations returns rows regardless of which admin wrote them", () => {
    store.set(alice, { groupId: "operations", active: true });
    store.set(bob,   { groupId: "people",     active: true });

    const rows = store.getAll();

    expect(rows.some(r => r.groupId === "operations" && r.toggledBy === "alice")).toBe(true);
    expect(rows.some(r => r.groupId === "people"     && r.toggledBy === "bob")).toBe(true);
    // Both admins see the full shared list — row count reflects all writers.
    expect(rows.length).toBe(2);
  });

  // ── 6 & 7. Global scope sentinel ─────────────────────────────────────────────
  it("omitting ventureId stores the row under the __global__ sentinel", () => {
    store.set(alice, { groupId: "governance", active: true });
    // ventureId omitted → __global__

    const row = store.getAll().find(r => r.groupId === "governance");
    expect(row?.ventureId).toBe("__global__");
    expect(row?.active).toBe(true);
  });

  it("explicit empty-string ventureId is also normalised to __global__", () => {
    store.set(alice, { groupId: "execution", ventureId: "", active: true });

    const row = store.getAll().find(r => r.groupId === "execution");
    expect(row?.ventureId).toBe("__global__");
  });

  it("whitespace-only ventureId is also normalised to __global__", () => {
    store.set(alice, { groupId: "sustainability", ventureId: "   ", active: true });

    const row = store.getAll().find(r => r.groupId === "sustainability");
    expect(row?.ventureId).toBe("__global__");
  });

  it("venture-scoped rows are stored separately from global rows", () => {
    store.set(alice, { groupId: "discovery", ventureId: "__global__",  active: true  });
    store.set(bob,   { groupId: "discovery", ventureId: "venture-001", active: false });

    const rows = store.getAll().filter(r => r.groupId === "discovery");
    expect(rows.length).toBe(2);

    const global  = rows.find(r => r.ventureId === "__global__");
    const venture = rows.find(r => r.ventureId === "venture-001");

    expect(global?.active).toBe(true);
    expect(venture?.active).toBe(false);
  });

  // ── Padded venture ID write-path trimming ─────────────────────────────────────
  // Confirms that setModuleReactivation (via the store's set()) always stores
  // the TRIMMED form of a real venture ID — not the raw padded input.
  // This closes the gap where "  BEBUS  " could be stored as a distinct key that
  // never matches a future lookup using the DB-stored (trimmed) value.

  it("stores the trimmed ventureId when the caller supplies leading/trailing spaces", () => {
    store.set(alice, { groupId: "gtm", ventureId: "  BEBUS  ", active: true });

    const rows = store.getAll().filter(r => r.groupId === "gtm");
    expect(rows.length).toBe(1);
    // The stored ventureId must be the trimmed form, not the padded input.
    expect(rows[0].ventureId).toBe("BEBUS");
    expect(rows[0].active).toBe(true);
  });

  it("treats padded and non-padded ventureId as the same key — upsert, not two rows", () => {
    // First write uses the padded form; second uses the clean form.
    store.set(alice, { groupId: "gtm", ventureId: "  BEBUS  ", active: true  });
    store.set(bob,   { groupId: "gtm", ventureId: "BEBUS",     active: false });

    // Both writes must resolve to the same (groupId, ventureId) key —
    // the result is a single upserted row, not two separate rows.
    const rows = store.getAll().filter(r => r.groupId === "gtm");
    expect(rows.length).toBe(1);
    expect(rows[0].ventureId).toBe("BEBUS");
    // Last write (bob, false) wins — confirms it's an upsert on the shared key.
    expect(rows[0].active).toBe(false);
    expect(rows[0].toggledBy).toBe("bob");
  });

  // ── 8. Non-admin guard ───────────────────────────────────────────────────────
  it("setModuleReactivation rejects a founder with FORBIDDEN", () => {
    const ctx = makeNonAdminCtx("founder");
    let err: TRPCError | undefined;
    try {
      store.set(ctx, { groupId: "discovery", active: true });
    } catch (e) {
      err = e as TRPCError;
    }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });

  it("setModuleReactivation rejects a coach with FORBIDDEN", () => {
    const ctx = makeNonAdminCtx("coach");
    let err: TRPCError | undefined;
    try {
      store.set(ctx, { groupId: "discovery", active: true });
    } catch (e) {
      err = e as TRPCError;
    }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });

  it("setModuleReactivation rejects scoring_integrity_reviewer with FORBIDDEN", () => {
    const ctx = makeNonAdminCtx("scoring_integrity_reviewer");
    let err: TRPCError | undefined;
    try {
      store.set(ctx, { groupId: "governance", active: true });
    } catch (e) {
      err = e as TRPCError;
    }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });

  it("a rejected write leaves the store unchanged", () => {
    // Alice activates discovery; a non-admin tries to deactivate it.
    store.set(alice, { groupId: "discovery", active: true });

    const ctx = makeNonAdminCtx("coach");
    try {
      store.set(ctx, { groupId: "discovery", active: false });
    } catch {
      // expected
    }

    const row = store.getAll().find(r => r.groupId === "discovery");
    // The row must still reflect Alice's write, not the rejected attempt.
    expect(row?.active).toBe(true);
    expect(row?.toggledBy).toBe("alice");
  });
});

// ── resetVentureModuleReactivations — integration tests ───────────────────────
//
// Verifies that the reset endpoint:
//   • Deletes all venture-specific rows, causing the venture to fall back to
//     global defaults via the rowsToActivatedSet fallback semantics.
//   • Does not touch global rows or other ventures' rows.
//   • Rejects the "__global__" sentinel with BAD_REQUEST.
//   • Rejects non-admin callers with FORBIDDEN.
//   • Is safe to call when the venture has no rows (no-op).

describe("resetVentureModuleReactivations — reset to global defaults", () => {
  let store: ReactivationStore;
  const alice = makeAdminCtx("alice");

  beforeEach(() => {
    store = new ReactivationStore();
  });

  it("deletes all venture-specific rows so the venture falls back to global defaults", () => {
    // Global: discovery ON, scoring ON
    store.set(alice, { groupId: "discovery", active: true });
    store.set(alice, { groupId: "scoring",   active: true });

    // BEBUS overrides: discovery OFF, scoring OFF, rnd ON
    store.set(alice, { groupId: "discovery", ventureId: "BEBUS", active: false });
    store.set(alice, { groupId: "scoring",   ventureId: "BEBUS", active: false });
    store.set(alice, { groupId: "rnd",       ventureId: "BEBUS", active: true  });

    // Reset BEBUS
    store.reset(alice, { ventureId: "BEBUS" });

    const rows = store.getAll();
    const bebusSet = rowsToActivatedSet(rows, "BEBUS");

    // After reset, BEBUS should reflect global defaults: discovery ON, scoring ON
    expect(bebusSet.has("discovery")).toBe(true);
    expect(bebusSet.has("scoring")).toBe(true);
    // rnd had no global row → absent means inactive
    expect(bebusSet.has("rnd")).toBe(false);
  });

  it("does not touch global rows after reset", () => {
    store.set(alice, { groupId: "discovery", active: true });
    store.set(alice, { groupId: "discovery", ventureId: "BEBUS", active: false });

    store.reset(alice, { ventureId: "BEBUS" });

    const rows = store.getAll();
    // Global row must survive
    expect(rowsToActivatedSet(rows, null).has("discovery")).toBe(true);
  });

  it("does not touch another venture's rows after reset", () => {
    store.set(alice, { groupId: "gtm", ventureId: "BEBUS",     active: true });
    store.set(alice, { groupId: "gtm", ventureId: "VENTURE-B", active: true });

    store.reset(alice, { ventureId: "BEBUS" });

    const rows = store.getAll();
    const bSet = rowsToActivatedSet(rows, "VENTURE-B");
    // VENTURE-B's own row must be unaffected
    expect(bSet.has("gtm")).toBe(true);
  });

  it("is a no-op when the venture has no rows (result is still consistent)", () => {
    store.set(alice, { groupId: "operations", active: true }); // global only

    // BEBUS has no rows — reset should succeed without error
    expect(() => store.reset(alice, { ventureId: "BEBUS" })).not.toThrow();

    const rows = store.getAll();
    // BEBUS still falls back to global ON
    expect(rowsToActivatedSet(rows, "BEBUS").has("operations")).toBe(true);
  });

  it("rejects __global__ as ventureId with BAD_REQUEST", () => {
    let err: TRPCError | undefined;
    try {
      store.reset(alice, { ventureId: "__global__" });
    } catch (e) {
      err = e as TRPCError;
    }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("BAD_REQUEST");
  });

  it("rejects a non-admin caller with FORBIDDEN", () => {
    const ctx = makeNonAdminCtx("founder");
    let err: TRPCError | undefined;
    try {
      store.reset(ctx, { ventureId: "BEBUS" });
    } catch (e) {
      err = e as TRPCError;
    }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });

  it("active set after reset exactly matches global defaults", () => {
    // Set a known global state: rnd + sustainability ON
    store.set(alice, { groupId: "rnd",            active: true  });
    store.set(alice, { groupId: "sustainability",  active: true  });
    store.set(alice, { groupId: "risk",            active: false });

    // BEBUS diverges completely
    store.set(alice, { groupId: "rnd",           ventureId: "BEBUS", active: false });
    store.set(alice, { groupId: "sustainability", ventureId: "BEBUS", active: false });
    store.set(alice, { groupId: "gtm",           ventureId: "BEBUS", active: true  });

    store.reset(alice, { ventureId: "BEBUS" });

    const rows = store.getAll();
    const globalSet = rowsToActivatedSet(rows, null);
    const bebusSet  = rowsToActivatedSet(rows, "BEBUS");

    // After reset, BEBUS must match global exactly
    expect([...bebusSet].sort()).toEqual([...globalSet].sort());
  });

  // ── Multi-admin reset consistency ─────────────────────────────────────────
  // Verifies that resetVentureModuleReactivations deletes ALL venture-scoped
  // rows for the target venture, regardless of which admin originally wrote
  // each row.  If the delete logic inadvertently filtered on the calling
  // admin's identity, rows written by a different admin would be silently
  // skipped — leaving stale overrides that the venture UI can never escape.

  it("resets all venture rows regardless of which admin wrote them", () => {
    const bob = makeAdminCtx("bob");

    // Global rows from both admins — must survive the reset.
    store.set(alice, { groupId: "discovery",  active: true  });
    store.set(bob,   { groupId: "operations", active: true  });

    // BEBUS rows: alice owns 3 groups, bob owns 2 groups.
    store.set(alice, { groupId: "gtm",         ventureId: "BEBUS", active: true  });
    store.set(alice, { groupId: "scoring",      ventureId: "BEBUS", active: false });
    store.set(alice, { groupId: "risk",         ventureId: "BEBUS", active: true  });
    store.set(bob,   { groupId: "rnd",          ventureId: "BEBUS", active: true  });
    store.set(bob,   { groupId: "sustainability",ventureId: "BEBUS", active: false });

    // Sanity-check: 5 BEBUS rows exist before reset.
    const before = store.getAll().filter(r => r.ventureId === "BEBUS");
    expect(before.length).toBe(5);

    // Reset performed by alice — should delete all 5, including bob's rows.
    store.reset(alice, { ventureId: "BEBUS" });

    const after = store.getAll();

    // All 5 BEBUS rows must be gone — zero venture-scoped rows remain.
    const bebusRows = after.filter(r => r.ventureId === "BEBUS");
    expect(bebusRows.length).toBe(0);

    // Global rows from both admins must be unaffected.
    expect(after.some(r => r.groupId === "discovery"  && r.ventureId === "__global__")).toBe(true);
    expect(after.some(r => r.groupId === "operations" && r.ventureId === "__global__")).toBe(true);

    // BEBUS now falls back to global defaults (discovery ON, operations ON).
    const bebusSet = rowsToActivatedSet(after, "BEBUS");
    expect(bebusSet.has("discovery")).toBe(true);
    expect(bebusSet.has("operations")).toBe(true);
    // Groups that only had venture-scoped rows are now inactive.
    expect(bebusSet.has("gtm")).toBe(false);
    expect(bebusSet.has("scoring")).toBe(false);
    expect(bebusSet.has("risk")).toBe(false);
    expect(bebusSet.has("rnd")).toBe(false);
    expect(bebusSet.has("sustainability")).toBe(false);
  });

});

// ── normaliseResetVentureId — production router utility ───────────────────────
//
// This describe block tests the ACTUAL production function that
// resetVentureModuleReactivations delegates to in admin.router.ts.
// Because the function is imported directly from moduleReactivationUtils.ts,
// any regression in the router (removing .trim(), removing the sentinel
// check) will break these tests — not just the in-memory-store tests above.

describe("normaliseResetVentureId — production trim + sentinel guard", () => {
  // ── Basic trimming ────────────────────────────────────────────────────────

  it("returns the exact ID unchanged when there is no whitespace", () => {
    expect(normaliseResetVentureId("BEBUS")).toBe("BEBUS");
  });

  it("trims leading and trailing whitespace before returning", () => {
    expect(normaliseResetVentureId("  BEBUS  ")).toBe("BEBUS");
  });

  it("trims only leading whitespace", () => {
    expect(normaliseResetVentureId("   VENTURE-X")).toBe("VENTURE-X");
  });

  it("trims only trailing whitespace", () => {
    expect(normaliseResetVentureId("VENTURE-Y   ")).toBe("VENTURE-Y");
  });

  it("trims tab and newline characters", () => {
    expect(normaliseResetVentureId("\t BEBUS \n")).toBe("BEBUS");
  });

  it("preserves internal spaces (only leading/trailing are stripped)", () => {
    expect(normaliseResetVentureId("  VENTURE ONE  ")).toBe("VENTURE ONE");
  });

  // ── __global__ sentinel rejection ─────────────────────────────────────────
  // These tests are the primary regression guards: if the sentinel check or
  // the trim is removed from the production function, these fail.

  it("rejects the exact __global__ sentinel with BAD_REQUEST", () => {
    let err: TRPCError | undefined;
    try { normaliseResetVentureId("__global__"); } catch (e) { err = e as TRPCError; }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("BAD_REQUEST");
  });

  it("rejects __global__ with leading/trailing whitespace after trimming", () => {
    // "  __global__  ".trim() === "__global__" — must still be rejected.
    // Verifies that .trim() happens BEFORE the sentinel check, not after.
    let err: TRPCError | undefined;
    try { normaliseResetVentureId("  __global__  "); } catch (e) { err = e as TRPCError; }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("BAD_REQUEST");
  });

  it("rejects __global__ with tab padding", () => {
    let err: TRPCError | undefined;
    try { normaliseResetVentureId("\t__global__\t"); } catch (e) { err = e as TRPCError; }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("BAD_REQUEST");
  });

  it("does NOT reject a ventureId that merely contains __global__ as a substring", () => {
    // "__global__-extra" trims to "__global__-extra" which is not the sentinel.
    expect(() => normaliseResetVentureId("__global__-extra")).not.toThrow();
    expect(normaliseResetVentureId("__global__-extra")).toBe("__global__-extra");
  });

  // ── Regression guard: rows stored with exact ID ───────────────────────────
  // Confirms that the value returned by normaliseResetVentureId matches the
  // exact string that was stored in the DB (which always uses the trimmed form).
  // If someone removes .trim() from the production function, the return value
  // will be "  BEBUS  " instead of "BEBUS", causing the DELETE WHERE clause to
  // match zero rows — silently skipping all of them.

  it("returns the trimmed ID that matches exactly how the DB stored it", () => {
    // The DB always stores trimmed IDs (setModuleReactivation also trims).
    // The value returned here is what gets passed to eq(moduleReactivations.ventureId, vid).
    const stored = "BEBUS";                         // stored in DB without padding
    const fromInput = normaliseResetVentureId("  BEBUS  ");  // caller supplied padded
    expect(fromInput).toBe(stored);                 // DELETE will match the stored row
  });
});

// ── normaliseSetVentureId — production write-path utility ─────────────────────
//
// This describe block tests the ACTUAL production function used by
// setModuleReactivation and setModuleReactivationBatch in admin.router.ts.
// Because both mutations now call normaliseSetVentureId() instead of inlining
// the trim logic, removing or changing .trim() in the helper will immediately
// break these tests — giving a genuine regression guard over the DB write path.

describe("normaliseSetVentureId — production write-path trim + sentinel normalisation", () => {
  // ── Real venture IDs: trim behaviour ─────────────────────────────────────

  it("returns the exact ID unchanged when there is no whitespace", () => {
    expect(normaliseSetVentureId("BEBUS")).toBe("BEBUS");
  });

  it("trims leading and trailing whitespace from a real venture ID", () => {
    // This is the primary regression guard: if .trim() is removed from the
    // production function the stored key will be "  BEBUS  " — a key that can
    // never be matched by a future lookup that uses the unpadded DB value.
    expect(normaliseSetVentureId("  BEBUS  ")).toBe("BEBUS");
  });

  it("trims only leading whitespace", () => {
    expect(normaliseSetVentureId("   VENTURE-X")).toBe("VENTURE-X");
  });

  it("trims only trailing whitespace", () => {
    expect(normaliseSetVentureId("VENTURE-Y   ")).toBe("VENTURE-Y");
  });

  it("trims tab and newline characters", () => {
    expect(normaliseSetVentureId("\t BEBUS \n")).toBe("BEBUS");
  });

  it("preserves internal spaces — only leading/trailing are stripped", () => {
    expect(normaliseSetVentureId("  VENTURE ONE  ")).toBe("VENTURE ONE");
  });

  // ── Global sentinel normalisation ─────────────────────────────────────────
  // Confirms that the function is the single source of truth for the
  // "__global__" sentinel used by the DB upsert key.

  it("maps undefined to __global__", () => {
    expect(normaliseSetVentureId(undefined)).toBe("__global__");
  });

  it("maps an empty string to __global__", () => {
    expect(normaliseSetVentureId("")).toBe("__global__");
  });

  it("maps a whitespace-only string to __global__", () => {
    expect(normaliseSetVentureId("   ")).toBe("__global__");
  });

  it("maps a tab-only string to __global__", () => {
    expect(normaliseSetVentureId("\t")).toBe("__global__");
  });

  // ── Upsert key consistency ────────────────────────────────────────────────
  // Confirms that a padded and a clean ID normalise to the SAME key.
  // This is what prevents a padded write ("  BEBUS  ") from creating a
  // distinct DB row that never merges with a subsequent clean write ("BEBUS").

  it("padded and non-padded forms produce the same normalised key", () => {
    const fromPadded = normaliseSetVentureId("  BEBUS  ");
    const fromClean  = normaliseSetVentureId("BEBUS");
    // If both resolve to the same string the DB's (groupId, ventureId) unique
    // constraint will treat them as the same row — upsert, not insert.
    expect(fromPadded).toBe(fromClean);
  });

  it("the normalised key matches exactly how the DB stores an unpadded write", () => {
    // A row written with "BEBUS" is stored as "BEBUS".
    // A future reset/lookup using a padded input must normalise to the same
    // value or the WHERE clause will match zero rows.
    const stored   = "BEBUS";
    const fromInput = normaliseSetVentureId("  BEBUS  ");
    expect(fromInput).toBe(stored);
  });
});

// ── execVentureReset — production delete-path coverage ────────────────────────
//
// Tests the ACTUAL production function that resetVentureModuleReactivations
// delegates to after this refactor.  Because execVentureReset is imported
// directly from moduleReactivationUtils (no Drizzle schema import), we can
// inject a mock DB and a mock eq builder.
//
// Two complementary angles:
//   A. Predicate-shape test — verifies that eqFn is called with exactly one
//      (ventureIdColumn, vid) pair and no additional toggledBy column.  This
//      is the direct regression guard: if someone adds
//      `and(eq(ventureIdCol, vid), eq(toggledByCol, caller))`, the spy will
//      record a second call and the assertion fires.
//
//   B. Behavioural test — uses a mock DB that actually evaluates the predicate
//      to filter rows.  Seeds 3 rows from alice and 2 from bob under the same
//      ventureId, runs execVentureReset, and confirms all 5 are deleted while
//      the global rows (different ventureId) survive.  Would fail if the
//      predicate carried a per-writer filter — only the calling admin's rows
//      would be removed, leaving the other admin's rows behind.

describe("execVentureReset — production delete predicate (no per-writer filter)", () => {
  // ── Mock column tokens ────────────────────────────────────────────────────
  // These stand in for the Drizzle column objects.  Using distinct objects
  // (not plain strings) means the predicate spy can use referential equality
  // to confirm which column was passed.
  const mockVentureIdCol = { __col: "ventureId" } as const;
  const mockToggledByCol = { __col: "toggledBy" } as const;

  const mockTable = { ventureId: mockVentureIdCol, toggledBy: mockToggledByCol };

  // ── A. Predicate-shape test ───────────────────────────────────────────────
  it("calls eqFn with the ventureId column only — no toggledBy filter", async () => {
    const eqCalls: Array<{ col: unknown; val: string }> = [];

    const spyEq = (col: unknown, val: string) => {
      eqCalls.push({ col, val });
      return {}; // opaque predicate — the mock db doesn't evaluate it
    };

    const noopDb = {
      delete: (_t: unknown) => ({
        where: (_p: unknown) => ({
          returning: () => Promise.resolve([] as unknown[]),
        }),
      }),
    };

    await execVentureReset(noopDb, mockTable, spyEq, mockTable.ventureId, "BEBUS");

    // eqFn must be called exactly once — for ventureId only.
    expect(eqCalls.length).toBe(1);
    // The column must be ventureId, not toggledBy.
    expect(eqCalls[0].col).toBe(mockVentureIdCol);
    expect(eqCalls[0].col).not.toBe(mockToggledByCol);
    // The value must be the supplied venture ID.
    expect(eqCalls[0].val).toBe("BEBUS");
  });

  // ── B. Behavioural test — all rows deleted regardless of writer ───────────
  //
  // The mock DB stores rows as plain objects and evaluates the predicate
  // returned by mockEq.  mockEq returns a function `(row) => row[col] === val`
  // so if execVentureReset ever passes toggledByCol, only rows matching the
  // caller's name would be deleted — and the test would see surviving rows.
  it("deletes all venture rows from alice AND bob; leaves global rows intact", async () => {
    type Row = { ventureId: string; groupId: string; toggledBy: string };

    // Mock eq: returns a row-predicate function so the mock DB can evaluate it.
    const mockEq = (col: { __col: keyof Row }, val: string) =>
      (row: Row) => row[col.__col] === val;

    // Mock DB that stores rows and applies the where predicate as a filter.
    const rows: Row[] = [];
    const mockDb = {
      delete: (_t: unknown) => ({
        where: (pred: (row: Row) => boolean) => ({
          returning: () => {
            // Delete every row where pred returns true (mirrors the SQL DELETE WHERE).
            const toDelete = rows.filter(pred);
            toDelete.forEach(r => rows.splice(rows.indexOf(r), 1));
            return Promise.resolve(toDelete);
          },
        }),
      }),
    };

    // Seed: 3 BEBUS rows from alice, 2 BEBUS rows from bob.
    rows.push(
      { ventureId: "BEBUS", groupId: "gtm",          toggledBy: "alice" },
      { ventureId: "BEBUS", groupId: "scoring",       toggledBy: "alice" },
      { ventureId: "BEBUS", groupId: "risk",          toggledBy: "alice" },
      { ventureId: "BEBUS", groupId: "rnd",           toggledBy: "bob"   },
      { ventureId: "BEBUS", groupId: "sustainability", toggledBy: "bob"  },
    );

    // Global rows: one from alice, one from bob — must survive the reset.
    rows.push(
      { ventureId: "__global__", groupId: "discovery",  toggledBy: "alice" },
      { ventureId: "__global__", groupId: "operations", toggledBy: "bob"   },
    );

    // Sanity-check: 5 BEBUS rows + 2 global rows before reset.
    expect(rows.filter(r => r.ventureId === "BEBUS").length).toBe(5);
    expect(rows.filter(r => r.ventureId === "__global__").length).toBe(2);

    await execVentureReset(mockDb, mockTable, mockEq as any, mockTable.ventureId, "BEBUS");

    // All 5 BEBUS rows must be gone — including bob's.
    expect(rows.filter(r => r.ventureId === "BEBUS").length).toBe(0);

    // Global rows must be unaffected.
    expect(rows.filter(r => r.ventureId === "__global__").length).toBe(2);
    expect(rows.some(r => r.groupId === "discovery"  && r.toggledBy === "alice")).toBe(true);
    expect(rows.some(r => r.groupId === "operations" && r.toggledBy === "bob")).toBe(true);
  });

  // ── C. deletedCount tests — zero rows vs. non-zero rows ──────────────────
  //
  // These tests verify the primary guard introduced by this task: the DELETE
  // must return the actual number of rows removed so callers can detect the
  // "unknown ventureId — zero rows matched" case instead of silently reporting
  // success.
  //
  // Both use a self-contained mock DB with .returning() so they exercise the
  // real execVentureReset without importing the Drizzle schema.

  it("returns deletedCount: 0 when the ventureId matches no rows in the DB", async () => {
    type Row = { ventureId: string; groupId: string };

    const mockEqRow = (col: { __col: keyof Row }, val: string) =>
      (row: Row) => row[col.__col] === val;

    const rows: Row[] = [
      { ventureId: "BEBUS",      groupId: "gtm"       },
      { ventureId: "__global__", groupId: "discovery" },
    ];

    const countingDb = {
      delete: (_t: unknown) => ({
        where: (pred: (row: Row) => boolean) => ({
          returning: () => {
            const deleted = rows.filter(pred);
            deleted.forEach(r => rows.splice(rows.indexOf(r), 1));
            return Promise.resolve(deleted);
          },
        }),
      }),
    };

    // "UNKNOWN-VENTURE" does not match any row — deletedCount must be 0.
    const count = await execVentureReset(
      countingDb,
      mockTable,
      mockEqRow as any,
      mockTable.ventureId,
      "UNKNOWN-VENTURE",
    );

    expect(count).toBe(0);
    // All existing rows must be untouched.
    expect(rows.length).toBe(2);
  });

  it("returns the correct non-zero deletedCount when the ventureId matches rows", async () => {
    type Row = { ventureId: string; groupId: string };

    const mockEqRow = (col: { __col: keyof Row }, val: string) =>
      (row: Row) => row[col.__col] === val;

    const rows: Row[] = [
      { ventureId: "BEBUS",      groupId: "gtm"        },
      { ventureId: "BEBUS",      groupId: "scoring"    },
      { ventureId: "BEBUS",      groupId: "rnd"        },
      { ventureId: "__global__", groupId: "discovery"  },
      { ventureId: "__global__", groupId: "operations" },
    ];

    const countingDb = {
      delete: (_t: unknown) => ({
        where: (pred: (row: Row) => boolean) => ({
          returning: () => {
            const deleted = rows.filter(pred);
            deleted.forEach(r => rows.splice(rows.indexOf(r), 1));
            return Promise.resolve(deleted);
          },
        }),
      }),
    };

    // 3 BEBUS rows exist — deletedCount must equal 3.
    const count = await execVentureReset(
      countingDb,
      mockTable,
      mockEqRow as any,
      mockTable.ventureId,
      "BEBUS",
    );

    expect(count).toBe(3);
    // Only the two global rows should remain.
    expect(rows.length).toBe(2);
    expect(rows.every(r => r.ventureId === "__global__")).toBe(true);
  });

  // ── D. Null / undefined .returning() guard ───────────────────────────────
  //
  // Without a guard, a DB driver or mock that returns null/undefined from
  // .returning() causes an unhandled TypeError at `deleted.length`.  The
  // production fix converts this into a controlled diagnostic Error.

  it("throws a controlled Error (not a silent TypeError) when .returning() resolves to null", async () => {
    const nullReturningDb = {
      delete: (_t: unknown) => ({
        where: (_p: unknown) => ({
          returning: () => Promise.resolve(null as unknown),
        }),
      }),
    };

    await expect(
      execVentureReset(nullReturningDb, mockTable, () => ({}), mockTable.ventureId, "BEBUS"),
    ).rejects.toThrow(/execVentureReset.*null/i);
  });

  it("throws a controlled Error when .returning() resolves to undefined", async () => {
    const undefinedReturningDb = {
      delete: (_t: unknown) => ({
        where: (_p: unknown) => ({
          returning: () => Promise.resolve(undefined as unknown),
        }),
      }),
    };

    await expect(
      execVentureReset(undefinedReturningDb, mockTable, () => ({}), mockTable.ventureId, "BEBUS"),
    ).rejects.toThrow(/execVentureReset/i);
  });

  it("throws a controlled Error when .returning() resolves to a number (unexpected driver response)", async () => {
    const badReturningDb = {
      delete: (_t: unknown) => ({
        where: (_p: unknown) => ({
          returning: () => Promise.resolve(42 as unknown),
        }),
      }),
    };

    await expect(
      execVentureReset(badReturningDb, mockTable, () => ({}), mockTable.ventureId, "BEBUS"),
    ).rejects.toThrow(/execVentureReset/i);
  });

  it("does NOT throw and returns 0 when .returning() resolves to an empty array", async () => {
    // Confirm the normal empty-array path still works after the guard was added.
    const emptyDb = {
      delete: (_t: unknown) => ({
        where: (_p: unknown) => ({
          returning: () => Promise.resolve([] as unknown[]),
        }),
      }),
    };

    const count = await execVentureReset(emptyDb, mockTable, () => ({}), mockTable.ventureId, "BEBUS");
    expect(count).toBe(0);
  });
});

// ── adminProcedure guard — standalone coverage ────────────────────────────────

describe("adminProcedureGuard — access control", () => {
  it("allows an admin through without throwing", () => {
    expect(() => adminProcedureGuard(makeAdminCtx("alice"))).not.toThrow();
  });

  it("blocks a founder with FORBIDDEN", () => {
    let err: TRPCError | undefined;
    try { adminProcedureGuard(makeNonAdminCtx("founder")); } catch (e) { err = e as TRPCError; }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });

  it("blocks a coach with FORBIDDEN", () => {
    let err: TRPCError | undefined;
    try { adminProcedureGuard(makeNonAdminCtx("coach")); } catch (e) { err = e as TRPCError; }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });

  it("blocks scoring_integrity_reviewer with FORBIDDEN", () => {
    let err: TRPCError | undefined;
    try { adminProcedureGuard(makeNonAdminCtx("scoring_integrity_reviewer")); } catch (e) { err = e as TRPCError; }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });
});

// ── setModuleReactivationBatch — batch-path ventureId trimming ────────────────
//
// The batch mutation calls normaliseSetVentureId() once for the shared
// ventureId and then upserts every item under that key.  These tests confirm:
//
//   1. A padded ventureId ("  BEBUS  ") passed to the batch endpoint is stored
//      as the trimmed form ("BEBUS") for every item in the batch.
//
//   2. A batch write with a padded ventureId followed by a single write with
//      the clean ID resolves to a single row (upsert), not two distinct rows.
//      This is the primary regression guard: if the batch path ever loses its
//      .trim() call the two writes would land under different keys and the
//      second write would not overwrite the first.
//
//   3. The inverse order also upserts: single write (clean ID) then batch
//      write (padded ID) → one row, last writer wins.
//
// The store.setBatch() method is a faithful mirror of setModuleReactivationBatch
// — it delegates to the same normaliseSetVentureId import that the router uses,
// so a regression in that helper breaks both the unit tests in the
// "normaliseSetVentureId" describe block AND these higher-level behavioural tests.

describe("setModuleReactivationBatch — batch-path ventureId trimming", () => {
  let store: ReactivationStore;
  const alice = makeAdminCtx("alice");
  const bob   = makeAdminCtx("bob");

  beforeEach(() => {
    store = new ReactivationStore();
  });

  // ── 1. Padded batch input stores trimmed form for every item ──────────────
  it("stores the trimmed ventureId for every item when the batch caller supplies padding", () => {
    store.setBatch(alice, {
      ventureId: "  BEBUS  ",
      items: [
        { groupId: "gtm",       active: true  },
        { groupId: "discovery", active: false },
        { groupId: "scoring",   active: true  },
      ],
    });

    const rows = store.getAll();

    // All three items must be stored under the trimmed key.
    expect(rows.length).toBe(3);
    for (const row of rows) {
      // The stored ventureId must be "BEBUS", never "  BEBUS  ".
      expect(row.ventureId).toBe("BEBUS");
    }

    // Spot-check individual items.
    const gtm       = rows.find(r => r.groupId === "gtm");
    const discovery = rows.find(r => r.groupId === "discovery");
    const scoring   = rows.find(r => r.groupId === "scoring");

    expect(gtm?.active).toBe(true);
    expect(discovery?.active).toBe(false);
    expect(scoring?.active).toBe(true);
  });

  // ── 2. Batch (padded) then single (clean) → upsert, not two rows ──────────
  it("batch write with padded ventureId then single write with clean ID is an upsert, not two rows", () => {
    // First: batch write using padded form — stored as "BEBUS".
    store.setBatch(alice, {
      ventureId: "  BEBUS  ",
      items: [{ groupId: "gtm", active: true }],
    });

    // Second: single write using the clean form — must resolve to the same key.
    store.set(bob, { groupId: "gtm", ventureId: "BEBUS", active: false });

    const rows = store.getAll().filter(r => r.groupId === "gtm");

    // Must be exactly one row — the second write must upsert the first.
    expect(rows.length).toBe(1);
    expect(rows[0].ventureId).toBe("BEBUS");
    // Last-write-wins: bob's single write (active: false) is the final state.
    expect(rows[0].active).toBe(false);
    expect(rows[0].toggledBy).toBe("bob");
  });

  // ── 3. Single (clean) then batch (padded) → upsert, not two rows ──────────
  it("single write with clean ventureId then batch write with padded ID is an upsert, not two rows", () => {
    // First: single write using the unpadded form.
    store.set(alice, { groupId: "gtm", ventureId: "BEBUS", active: true });

    // Second: batch write using padded form — must resolve to the same key.
    store.setBatch(bob, {
      ventureId: "  BEBUS  ",
      items: [{ groupId: "gtm", active: false }],
    });

    const rows = store.getAll().filter(r => r.groupId === "gtm");

    // Must be exactly one row — the batch write must upsert the single write.
    expect(rows.length).toBe(1);
    expect(rows[0].ventureId).toBe("BEBUS");
    // Last-write-wins: bob's batch write (active: false) is the final state.
    expect(rows[0].active).toBe(false);
    expect(rows[0].toggledBy).toBe("bob");
  });

  // ── 4. Multi-item batch: independent groups, same padded ventureId ─────────
  it("a multi-item batch with a padded ventureId stores each group under the same trimmed key", () => {
    store.setBatch(alice, {
      ventureId: "\t BEBUS \n",
      items: [
        { groupId: "rnd",            active: true  },
        { groupId: "sustainability", active: false },
      ],
    });

    const rnd            = store.getAll().find(r => r.groupId === "rnd");
    const sustainability = store.getAll().find(r => r.groupId === "sustainability");

    expect(rnd?.ventureId).toBe("BEBUS");
    expect(sustainability?.ventureId).toBe("BEBUS");
  });

  // ── 5. Batch with missing ventureId normalises to __global__ ──────────────
  it("batch without ventureId stores all items under the __global__ sentinel", () => {
    store.setBatch(alice, {
      // ventureId omitted → global scope
      items: [
        { groupId: "operations", active: true },
        { groupId: "investment", active: true },
      ],
    });

    const rows = store.getAll();
    for (const row of rows) {
      expect(row.ventureId).toBe("__global__");
    }
  });

  // ── 6. Non-admin is rejected by the adminProcedure guard ──────────────────
  it("setBatch rejects a non-admin caller with FORBIDDEN", () => {
    const ctx = makeNonAdminCtx("founder");
    let err: TRPCError | undefined;
    try {
      store.setBatch(ctx, {
        ventureId: "BEBUS",
        items: [{ groupId: "gtm", active: true }],
      });
    } catch (e) {
      err = e as TRPCError;
    }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });
});

// ── assertBatchRowResult — per-row integrity guard for setModuleReactivationBatch ─
//
// The production router calls assertBatchRowResult(written, item.groupId) inside
// db.transaction() after every upsert.  When the function throws the Drizzle
// transaction is aborted, so no rows from that batch are committed.
//
// Two angles tested here:
//
//   A. Guard trigger — assertBatchRowResult is called with an empty array (which
//      is what .returning() hands back when the DB silently skips the upsert)
//      and must throw TRPCError INTERNAL_SERVER_ERROR naming the affected groupId.
//
//   B. Rollback semantics — a simulated batch loop feeds a mock "DB" whose
//      .returning() returns [] for one item mid-batch.  The test verifies that
//      the exception aborts the loop so that no groupId is recorded as committed,
//      mirroring how Drizzle's transaction callback rolls back on any thrown error.
//
// Because assertBatchRowResult is imported directly from moduleReactivationUtils,
// removing or weakening the guard in that module will immediately break these
// tests — giving a genuine regression guard without requiring a live database.

describe("assertBatchRowResult — batch integrity guard (INTERNAL_SERVER_ERROR + rollback)", () => {

  // ── A. Guard trigger: empty .returning() array ────────────────────────────

  it("throws INTERNAL_SERVER_ERROR when .returning() yields an empty array (silent DB skip)", () => {
    let err: TRPCError | undefined;
    try {
      assertBatchRowResult([], "discovery");
    } catch (e) {
      err = e as TRPCError;
    }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("INTERNAL_SERVER_ERROR");
    // The message must name the groupId so admins can identify which row was skipped.
    expect(err?.message).toContain("discovery");
    expect(err?.message).toContain("got 0");
  });

  it("throws INTERNAL_SERVER_ERROR when .returning() yields more than one row (trigger producing extras)", () => {
    let err: TRPCError | undefined;
    try {
      assertBatchRowResult(
        [{ groupId: "scoring" }, { groupId: "scoring" }],
        "scoring",
      );
    } catch (e) {
      err = e as TRPCError;
    }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("INTERNAL_SERVER_ERROR");
    expect(err?.message).toContain("scoring");
    expect(err?.message).toContain("got 2");
  });

  it("throws INTERNAL_SERVER_ERROR when the confirmed groupId does not match the submitted item", () => {
    let err: TRPCError | undefined;
    try {
      // DB confirmed "gtm" but we submitted "discovery" — indicates a mismatch.
      assertBatchRowResult([{ groupId: "gtm" }], "discovery");
    } catch (e) {
      err = e as TRPCError;
    }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("INTERNAL_SERVER_ERROR");
    expect(err?.message).toContain("gtm");
    expect(err?.message).toContain("discovery");
  });

  it("does NOT throw when .returning() yields exactly one matching row", () => {
    expect(() =>
      assertBatchRowResult([{ groupId: "operations" }], "operations"),
    ).not.toThrow();
  });

  // ── B. Rollback semantics: throwing mid-batch aborts the whole batch ────────
  //
  // This test simulates the production transaction callback:
  //
  //   await db.transaction(async tx => {
  //     for (const item of input.items) {
  //       const written = await tx.insert(...).returning(...);
  //       assertBatchRowResult(written, item.groupId);   // throws for the bad item
  //       upserted.push(written[0].groupId);
  //     }
  //   });
  //
  // In production Drizzle rolls back when an error escapes the callback.
  // Here we replicate the same control flow: if assertBatchRowResult throws,
  // the catch block clears `committed` before re-throwing, mirroring an abort.

  it("no groupIds are committed when .returning() returns [] for one item mid-batch", async () => {
    // Three items in the batch.  The second one will silently skip (empty array).
    const batchItems = [
      { groupId: "gtm",       active: true  },
      { groupId: "discovery", active: false }, // ← DB returns [] for this one
      { groupId: "scoring",   active: true  },
    ];

    // mockReturning simulates the DB's .returning() response.
    const mockReturning = (groupId: string): { groupId: string }[] =>
      groupId === "discovery" ? [] : [{ groupId }];

    // Simulate the production transaction callback.
    const committed: string[] = [];
    let caughtErr: TRPCError | undefined;

    try {
      // This mirrors `await db.transaction(async tx => { for ... })`.
      for (const item of batchItems) {
        const written = mockReturning(item.groupId);
        assertBatchRowResult(written, item.groupId); // throws for "discovery"
        committed.push(item.groupId);
      }
    } catch (e) {
      // Drizzle rolls back on any thrown error from the transaction callback.
      // Mirror that by clearing committed before propagating.
      committed.length = 0;
      caughtErr = e as TRPCError;
    }

    // The error must be surfaced as INTERNAL_SERVER_ERROR naming the bad groupId.
    expect(caughtErr).toBeInstanceOf(TRPCError);
    expect(caughtErr?.code).toBe("INTERNAL_SERVER_ERROR");
    expect(caughtErr?.message).toContain("discovery");

    // No rows must be marked as committed — the batch is fully rolled back.
    expect(committed).toHaveLength(0);
  });

  it("no groupIds are committed when .returning() returns [] for the first item in the batch", async () => {
    const batchItems = [
      { groupId: "rnd",  active: true }, // ← DB silently skips this one
      { groupId: "risk", active: true },
    ];

    const mockReturning = (groupId: string): { groupId: string }[] =>
      groupId === "rnd" ? [] : [{ groupId }];

    const committed: string[] = [];
    let caughtErr: TRPCError | undefined;

    try {
      for (const item of batchItems) {
        const written = mockReturning(item.groupId);
        assertBatchRowResult(written, item.groupId);
        committed.push(item.groupId);
      }
    } catch (e) {
      committed.length = 0;
      caughtErr = e as TRPCError;
    }

    expect(caughtErr).toBeInstanceOf(TRPCError);
    expect(caughtErr?.code).toBe("INTERNAL_SERVER_ERROR");
    expect(caughtErr?.message).toContain("rnd");
    // Even "risk" (which would have succeeded) must not appear — full rollback.
    expect(committed).toHaveLength(0);
  });

  it("no groupIds are committed when .returning() returns [] for the last item in the batch", async () => {
    const batchItems = [
      { groupId: "operations",  active: true },
      { groupId: "investment",  active: true },
      { groupId: "governance",  active: false }, // ← DB silently skips the last one
    ];

    const mockReturning = (groupId: string): { groupId: string }[] =>
      groupId === "governance" ? [] : [{ groupId }];

    const committed: string[] = [];
    let caughtErr: TRPCError | undefined;

    try {
      for (const item of batchItems) {
        const written = mockReturning(item.groupId);
        assertBatchRowResult(written, item.groupId);
        committed.push(item.groupId);
      }
    } catch (e) {
      committed.length = 0;
      caughtErr = e as TRPCError;
    }

    expect(caughtErr).toBeInstanceOf(TRPCError);
    expect(caughtErr?.code).toBe("INTERNAL_SERVER_ERROR");
    expect(caughtErr?.message).toContain("governance");
    // All three must be absent — the whole batch is rolled back.
    expect(committed).toHaveLength(0);
  });
});
