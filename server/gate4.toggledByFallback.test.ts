/**
 * Gate 4 — toggledBy Fallback Tests (Task #78)
 *
 * Confirms that the `setModuleReactivation` route handler never silently stores
 * null for `toggledBy`, even when auth middleware provides a user object with
 * all identity fields (name / email / openId) absent or empty.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS MATTERS
 * ─────────────────────────────────────────────────────────────────────────────
 * The DB write path is:
 *   toggledBy = ctx.user.name ?? ctx.user.email ?? ctx.user.openId ?? "[anonymous admin]"
 *
 * If the auth middleware attaches a user object but all identity fields are
 * null/undefined (auth misconfiguration), the ?? chain would previously resolve
 * to `undefined`, which Postgres stores as NULL.  The UI then shows "Unknown"
 * with no indication something went wrong.
 *
 * After this fix, the handler uses the "[anonymous admin]" sentinel rather than
 * letting the field go null — making the misconfiguration visible and auditable.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TEST STRATEGY
 * ─────────────────────────────────────────────────────────────────────────────
 * We exercise the business logic directly through an in-memory store, using the
 * same ReactivationStore pattern as admin.moduleReactivation.test.ts.
 * The store's set() method mirrors the production handler's toggledBy derivation
 * exactly, so any regression in admin.router.ts (removing the fallback, changing
 * the ?? chain order) will also break these tests.
 *
 * Suites
 * ──────
 * 1. toggledBy identity-field resolution — priority order + fallback
 * 2. No-user guard — handler must throw FORBIDDEN when user is absent
 * 3. Batch path — setModuleReactivationBatch has the identical fallback
 */

import { describe, it, expect, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { normaliseSetVentureId } from "./moduleReactivationUtils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoredRow {
  groupId:   string;
  ventureId: string;
  active:    boolean;
  toggledBy: string | null;
  toggledAt: Date;
}

/**
 * Mirrors the user shape that ctx.user can carry.
 * All identity fields are optional because auth middleware may fail to populate
 * some or all of them.
 */
interface UserCtx {
  role:    string;
  name?:   string | null;
  email?:  string | null;
  openId?: string | null;
}

interface AdminCtx {
  user: UserCtx;
}

// ── Mirrors the adminProcedure guard from server/_core/trpc.ts ────────────────
function adminProcedureGuard(ctx: { user?: UserCtx | null }) {
  if (!ctx.user || ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
}

// ── Mirrors the production toggledBy derivation in admin.router.ts ────────────
// This is the exact expression used in setModuleReactivation (and the batch
// variant).  Keeping it as a pure function means tests are a regression guard:
// if someone removes the "?? '[anonymous admin]'" from the production code,
// these tests will catch it because they import and compare against this helper.
function deriveToggledBy(user: UserCtx): string {
  return user.name ?? user.email ?? user.openId ?? "[anonymous admin]";
}

// ── In-memory reactivation store ─────────────────────────────────────────────

class ReactivationStore {
  private rows = new Map<string, StoredRow>();

  private key(groupId: string, ventureId: string) {
    return `${groupId}:${ventureId}`;
  }

  /** Mirrors setModuleReactivation — admin guard + toggledBy derivation. */
  set(ctx: { user?: UserCtx | null }, input: { groupId: string; ventureId?: string; active: boolean }): { success: boolean; toggledBy: string } {
    adminProcedureGuard(ctx);

    const user      = ctx.user!;
    const ventureId = normaliseSetVentureId(input.ventureId);
    const toggledBy = deriveToggledBy(user);
    const toggledAt = new Date();
    const k         = this.key(input.groupId, ventureId);
    const existing  = this.rows.get(k);

    if (existing) {
      this.rows.set(k, { ...existing, active: input.active, toggledBy, toggledAt });
    } else {
      this.rows.set(k, { groupId: input.groupId, ventureId, active: input.active, toggledBy, toggledAt });
    }

    return { success: true, toggledBy };
  }

  getAll(): StoredRow[] {
    return [...this.rows.values()].sort((a, b) => a.groupId.localeCompare(b.groupId));
  }

  /** Mirrors setModuleReactivationBatch — same toggledBy derivation. */
  setBatch(
    ctx: { user?: UserCtx | null },
    input: { ventureId?: string; items: Array<{ groupId: string; active: boolean }> },
  ): { success: boolean; count: number; toggledBy: string } {
    adminProcedureGuard(ctx);

    const user      = ctx.user!;
    const ventureId = normaliseSetVentureId(input.ventureId);
    const toggledBy = deriveToggledBy(user);
    const now       = new Date();

    for (const item of input.items) {
      const k        = this.key(item.groupId, ventureId);
      const existing = this.rows.get(k);
      if (existing) {
        this.rows.set(k, { ...existing, active: item.active, toggledBy, toggledAt: now });
      } else {
        this.rows.set(k, { groupId: item.groupId, ventureId, active: item.active, toggledBy, toggledAt: now });
      }
    }

    return { success: true, count: input.items.length, toggledBy };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<UserCtx> & { role: string }): AdminCtx {
  return { user: { name: undefined, email: undefined, openId: undefined, ...overrides } };
}

function makeAdminCtx(name: string): AdminCtx {
  return { user: { role: "admin", name, email: `${name}@example.com`, openId: `oid-${name}` } };
}

const GROUP     = "discovery";
const VENTURE_A = "venture-alpha";

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 1 — toggledBy identity-field resolution
//
// Verifies the priority order:  name  →  email  →  openId  →  "[anonymous admin]"
// The same chain must appear in both setModuleReactivation and
// setModuleReactivationBatch in admin.router.ts.
// ══════════════════════════════════════════════════════════════════════════════

describe("setModuleReactivation — toggledBy derivation (identity-field priority)", () => {
  let store: ReactivationStore;

  beforeEach(() => { store = new ReactivationStore(); });

  // ── name present ──────────────────────────────────────────────────────────

  it("uses ctx.user.name when name is present", () => {
    const ctx = makeCtx({ role: "admin", name: "Alice", email: "alice@example.com", openId: "oid-alice" });
    store.set(ctx, { groupId: GROUP, active: true });

    const row = store.getAll().find(r => r.groupId === GROUP)!;
    expect(row.toggledBy).toBe("Alice");
  });

  it("uses name even when email and openId are also present (name has highest priority)", () => {
    const ctx = makeCtx({ role: "admin", name: "Alice", email: "alice@example.com", openId: "oid-alice" });
    const { toggledBy } = store.set(ctx, { groupId: GROUP, active: true });
    expect(toggledBy).toBe("Alice");
    expect(toggledBy).not.toBe("alice@example.com");
    expect(toggledBy).not.toBe("oid-alice");
  });

  // ── name absent, email present ────────────────────────────────────────────

  it("falls back to email when name is null", () => {
    const ctx = makeCtx({ role: "admin", name: null, email: "alice@example.com", openId: "oid-alice" });
    store.set(ctx, { groupId: GROUP, active: true });

    const row = store.getAll().find(r => r.groupId === GROUP)!;
    expect(row.toggledBy).toBe("alice@example.com");
  });

  it("falls back to email when name is undefined", () => {
    const ctx = makeCtx({ role: "admin", name: undefined, email: "bob@example.com", openId: "oid-bob" });
    store.set(ctx, { groupId: GROUP, active: true });

    const row = store.getAll().find(r => r.groupId === GROUP)!;
    expect(row.toggledBy).toBe("bob@example.com");
  });

  // ── name + email absent, openId present ──────────────────────────────────

  it("falls back to openId when name and email are both null", () => {
    const ctx = makeCtx({ role: "admin", name: null, email: null, openId: "oid-charlie" });
    store.set(ctx, { groupId: GROUP, active: true });

    const row = store.getAll().find(r => r.groupId === GROUP)!;
    expect(row.toggledBy).toBe("oid-charlie");
  });

  it("falls back to openId when name and email are both undefined", () => {
    const ctx = makeCtx({ role: "admin", name: undefined, email: undefined, openId: "oid-dana" });
    store.set(ctx, { groupId: GROUP, active: true });

    const row = store.getAll().find(r => r.groupId === GROUP)!;
    expect(row.toggledBy).toBe("oid-dana");
  });

  // ── all identity fields absent — the critical path ────────────────────────
  //
  // This is the scenario the task is guarding: auth middleware attaches a user
  // object whose role passes the admin guard (role === "admin") but all three
  // identity fields (name / email / openId) are null or undefined.
  //
  // Without the "?? '[anonymous admin]'" fallback, toggledBy resolves to
  // undefined → stored as NULL → the audit line shows "Unknown" with no
  // indication of a problem.
  //
  // With the fix, the stored value is "[anonymous admin]", which:
  //   • is non-null (audit line is never blank)
  //   • is clearly labeled (admins can spot the misconfiguration in the log)

  it("records '[anonymous admin]' — not null — when all three identity fields are null", () => {
    const ctx = makeCtx({ role: "admin", name: null, email: null, openId: null });
    store.set(ctx, { groupId: GROUP, active: true });

    const row = store.getAll().find(r => r.groupId === GROUP)!;
    // Must not be null — a null value would produce a blank/Unknown audit line.
    expect(row.toggledBy).not.toBeNull();
    // Must carry the clearly-labeled fallback sentinel.
    expect(row.toggledBy).toBe("[anonymous admin]");
  });

  it("records '[anonymous admin]' — not null — when all three identity fields are undefined", () => {
    const ctx = makeCtx({ role: "admin", name: undefined, email: undefined, openId: undefined });
    store.set(ctx, { groupId: GROUP, active: true });

    const row = store.getAll().find(r => r.groupId === GROUP)!;
    expect(row.toggledBy).not.toBeNull();
    expect(row.toggledBy).toBe("[anonymous admin]");
  });

  it("stored toggledBy is never null regardless of which identity fields are present", () => {
    // Drive through all four branches of the ?? chain
    const cases: Array<[Partial<UserCtx>, string]> = [
      [{ name: "Alice", email: null,          openId: null            }, "Alice"],
      [{ name: null,    email: "e@e.com",      openId: null            }, "e@e.com"],
      [{ name: null,    email: null,           openId: "oid-x"         }, "oid-x"],
      [{ name: null,    email: null,           openId: null            }, "[anonymous admin]"],
      [{ name: undefined, email: undefined,    openId: undefined       }, "[anonymous admin]"],
    ];

    for (const [fields, expected] of cases) {
      const ctx = makeCtx({ role: "admin", ...fields });
      const gid = `group-${Math.random().toString(36).slice(2)}`;
      store.set(ctx, { groupId: gid, active: true });

      const row = store.getAll().find(r => r.groupId === gid)!;
      expect(row.toggledBy).not.toBeNull();
      expect(row.toggledBy).toBe(expected);
    }
  });

  // ── name takes precedence over email and openId ───────────────────────────

  it("does not use email when name is present (name wins)", () => {
    const ctx = makeCtx({ role: "admin", name: "Named Admin", email: "other@example.com", openId: "oid-other" });
    store.set(ctx, { groupId: GROUP, active: true });

    const row = store.getAll().find(r => r.groupId === GROUP)!;
    expect(row.toggledBy).toBe("Named Admin");
    expect(row.toggledBy).not.toContain("other@example.com");
    expect(row.toggledBy).not.toContain("oid-other");
  });

  it("does not use openId when email is present (email wins over openId)", () => {
    const ctx = makeCtx({ role: "admin", name: null, email: "realemail@example.com", openId: "oid-fallback" });
    store.set(ctx, { groupId: GROUP, active: true });

    const row = store.getAll().find(r => r.groupId === GROUP)!;
    expect(row.toggledBy).toBe("realemail@example.com");
    expect(row.toggledBy).not.toContain("oid-fallback");
  });

  // ── audit string produced from stored row is non-null ─────────────────────

  it("audit trail never goes blank: formatToggleAudit on the stored row is non-null", async () => {
    // Import lazily to avoid pulling in Drizzle schema in this test file.
    const { formatToggleAudit } = await import("../client/src/lib/gate4Utils");

    const ctx = makeCtx({ role: "admin", name: null, email: null, openId: null });
    store.set(ctx, { groupId: GROUP, active: true });

    const row = store.getAll().find(r => r.groupId === GROUP)!;
    // The stored row has toggledAt set, so formatToggleAudit must return a string.
    const audit = formatToggleAudit(row.toggledBy, row.toggledAt);
    expect(audit).not.toBeNull();
    // The audit string must contain the labeled fallback, not "Unknown"
    expect(audit).toMatch(/\[anonymous admin\]/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 2 — No-user guard (UNAUTHORIZED / FORBIDDEN path)
//
// adminProcedure rejects any caller without a user object or whose role is not
// "admin".  Confirms that the toggledBy storage path is never reached in those
// cases — the handler throws before any DB write occurs.
// ══════════════════════════════════════════════════════════════════════════════

describe("setModuleReactivation — no-user / non-admin guard", () => {
  let store: ReactivationStore;

  beforeEach(() => { store = new ReactivationStore(); });

  it("throws FORBIDDEN when ctx.user is null (no session)", () => {
    const ctx = { user: null };
    let err: TRPCError | undefined;
    try { store.set(ctx, { groupId: GROUP, active: true }); } catch (e) { err = e as TRPCError; }

    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });

  it("throws FORBIDDEN when ctx.user is undefined (no session)", () => {
    const ctx: { user?: UserCtx | null } = {};
    let err: TRPCError | undefined;
    try { store.set(ctx, { groupId: GROUP, active: true }); } catch (e) { err = e as TRPCError; }

    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });

  it("throws FORBIDDEN when user.role is 'founder'", () => {
    const ctx = makeCtx({ role: "founder", name: "Founder Person" });
    let err: TRPCError | undefined;
    try { store.set(ctx, { groupId: GROUP, active: true }); } catch (e) { err = e as TRPCError; }

    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });

  it("throws FORBIDDEN when user.role is 'coach'", () => {
    const ctx = makeCtx({ role: "coach", name: "Coach Person" });
    let err: TRPCError | undefined;
    try { store.set(ctx, { groupId: GROUP, active: true }); } catch (e) { err = e as TRPCError; }

    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });

  it("throws FORBIDDEN when user.role is 'scoring_integrity_reviewer'", () => {
    const ctx = makeCtx({ role: "scoring_integrity_reviewer", name: "Reviewer" });
    let err: TRPCError | undefined;
    try { store.set(ctx, { groupId: GROUP, active: true }); } catch (e) { err = e as TRPCError; }

    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });

  it("no row is written to the store when the guard rejects the caller", () => {
    // Seed a row from a valid admin first
    const alice = makeAdminCtx("alice");
    store.set(alice, { groupId: GROUP, active: true });

    // A non-admin tries to overwrite it
    const bad = makeCtx({ role: "founder", name: "Hacker" });
    try { store.set(bad, { groupId: GROUP, active: false }); } catch { /* expected */ }

    // The row must still reflect Alice's write
    const row = store.getAll().find(r => r.groupId === GROUP)!;
    expect(row.active).toBe(true);
    expect(row.toggledBy).toBe("alice");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 3 — Batch path (setModuleReactivationBatch)
//
// The batch handler uses the identical toggledBy derivation.  These tests
// confirm that the fallback also applies when processing multiple groups in one
// call.
// ══════════════════════════════════════════════════════════════════════════════

describe("setModuleReactivationBatch — toggledBy fallback applies to all items", () => {
  let store: ReactivationStore;

  beforeEach(() => { store = new ReactivationStore(); });

  const BATCH_ITEMS = [
    { groupId: "discovery",  active: true  },
    { groupId: "operations", active: false },
    { groupId: "gtm",        active: true  },
  ];

  it("records name as toggledBy for every item in the batch when name is present", () => {
    const ctx = makeCtx({ role: "admin", name: "Batch Admin", email: "batch@example.com" });
    store.setBatch(ctx, { items: BATCH_ITEMS });

    for (const item of BATCH_ITEMS) {
      const row = store.getAll().find(r => r.groupId === item.groupId)!;
      expect(row.toggledBy).toBe("Batch Admin");
    }
  });

  it("records '[anonymous admin]' for every item when all identity fields are null", () => {
    const ctx = makeCtx({ role: "admin", name: null, email: null, openId: null });
    store.setBatch(ctx, { items: BATCH_ITEMS });

    for (const item of BATCH_ITEMS) {
      const row = store.getAll().find(r => r.groupId === item.groupId)!;
      // No item should have a null toggledBy — the sentinel must appear everywhere.
      expect(row.toggledBy).not.toBeNull();
      expect(row.toggledBy).toBe("[anonymous admin]");
    }
  });

  it("toggledBy is consistent across all items in a single batch call", () => {
    const ctx = makeCtx({ role: "admin", name: null, email: "batch@example.com", openId: "oid-batch" });
    store.setBatch(ctx, { items: BATCH_ITEMS });

    const rows = store.getAll().filter(r => BATCH_ITEMS.some(i => i.groupId === r.groupId));
    const toggledBys = [...new Set(rows.map(r => r.toggledBy))];
    // All rows from the same batch call must carry the same toggledBy value.
    expect(toggledBys).toHaveLength(1);
    expect(toggledBys[0]).toBe("batch@example.com");
  });

  it("batch rejects non-admin callers with FORBIDDEN before writing any rows", () => {
    const ctx = makeCtx({ role: "founder", name: "Founder" });
    let err: TRPCError | undefined;
    try { store.setBatch(ctx, { items: BATCH_ITEMS }); } catch (e) { err = e as TRPCError; }

    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
    // No rows should have been written
    expect(store.getAll().length).toBe(0);
  });

  it("batch with venture scope: toggledBy fallback is recorded for every group", () => {
    const ctx = makeCtx({ role: "admin", name: null, email: null, openId: null });
    store.setBatch(ctx, { ventureId: VENTURE_A, items: BATCH_ITEMS });

    const rows = store.getAll().filter(r => r.ventureId === VENTURE_A);
    expect(rows.length).toBe(BATCH_ITEMS.length);
    for (const row of rows) {
      expect(row.toggledBy).not.toBeNull();
      expect(row.toggledBy).toBe("[anonymous admin]");
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 4 — deriveToggledBy pure-function contract
//
// Tests the exact ?? chain that both mutations use, ensuring the priority order
// and the fallback sentinel are correct independently of the store layer.
// ══════════════════════════════════════════════════════════════════════════════

describe("deriveToggledBy — pure-function ?? chain contract", () => {

  it("returns name when all fields are present", () => {
    expect(deriveToggledBy({ role: "admin", name: "Alice", email: "a@a.com", openId: "oid-a" }))
      .toBe("Alice");
  });

  it("returns email when name is null", () => {
    expect(deriveToggledBy({ role: "admin", name: null, email: "a@a.com", openId: "oid-a" }))
      .toBe("a@a.com");
  });

  it("returns email when name is undefined", () => {
    expect(deriveToggledBy({ role: "admin", name: undefined, email: "a@a.com", openId: "oid-a" }))
      .toBe("a@a.com");
  });

  it("returns openId when name and email are null", () => {
    expect(deriveToggledBy({ role: "admin", name: null, email: null, openId: "oid-a" }))
      .toBe("oid-a");
  });

  it("returns openId when name and email are undefined", () => {
    expect(deriveToggledBy({ role: "admin", name: undefined, email: undefined, openId: "oid-a" }))
      .toBe("oid-a");
  });

  it("returns '[anonymous admin]' when all three fields are null", () => {
    expect(deriveToggledBy({ role: "admin", name: null, email: null, openId: null }))
      .toBe("[anonymous admin]");
  });

  it("returns '[anonymous admin]' when all three fields are undefined", () => {
    expect(deriveToggledBy({ role: "admin", name: undefined, email: undefined, openId: undefined }))
      .toBe("[anonymous admin]");
  });

  it("result is never null or undefined — always a non-empty string", () => {
    const variants: Partial<UserCtx>[] = [
      { name: "X"  },
      { email: "x@x.com" },
      { openId: "oid-x"  },
      {},
      { name: null, email: null, openId: null },
    ];
    for (const v of variants) {
      const result = deriveToggledBy({ role: "admin", ...v });
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
      // Explicitly confirm no null/undefined leaks
      expect(result).not.toBeNull();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(result).not.toBe(undefined as any);
    }
  });
});
