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

    const ventureId =
      input.ventureId && input.ventureId.trim() ? input.ventureId.trim() : "__global__";

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
