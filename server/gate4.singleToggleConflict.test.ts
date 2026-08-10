/**
 * Gate 4 — setModuleReactivation: onConflictDoUpdate payload validation
 *
 * WHAT & WHY
 * ──────────
 * The fake-DB suite in gate4.auditTrailLiveUpdate.test.ts verifies that the
 * UI-layer pipeline (buildRowByGroup → formatToggleAudit) derives a consistent
 * audit string from whatever the DB stores.  But that suite's fake upsert
 * hard-codes the correct atomic update, so a regression in the ROUTER's own
 * `onConflictDoUpdate` set clause (e.g. dropping `toggledBy` from the set)
 * would leave that suite green.
 *
 * This file closes the gap by calling the ACTUAL `setModuleReactivation`
 * mutation through `appRouter.createCaller()` with a mocked DB that intercepts
 * the Drizzle insert chain.  The spy captures:
 *
 *   • The `values({...})` payload  — what would be written on INSERT
 *   • The `set:{...}` payload      — what would be applied on CONFLICT UPDATE
 *
 * Tests assert that BOTH payloads include `toggledBy` AND `toggledAt`, so a
 * future edit that removes either field from the conflict-update clause will
 * immediately fail here.
 *
 * Tests also model two concurrent calls (Promise.all) and confirm the DB-
 * reported row is internally consistent: the stored author and the stored
 * timestamp always come from the same write.
 *
 * APPROACH
 * ────────
 * Mirrors admin.batchReactivation.test.ts:
 *   • vi.mock("./db") intercepts getDb() before the router module is imported.
 *   • A lightweight insert-chain spy (no transaction needed for single toggles)
 *     captures the conflict-update payload and stores the resulting row.
 *   • appRouter.createCaller(makeAdminCtx()) calls the real mutation handler.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock getDb BEFORE importing the router ────────────────────────────────────
vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  buildRowByGroup,
  formatToggleAudit,
  type ReactivationRow,
} from "../client/src/lib/gate4Utils";

// ── Context factories ─────────────────────────────────────────────────────────

function makeAdminCtx(name = "alice"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: `oid-${name}`,
      email: `${name}@test.example`,
      name,
      loginMethod: "test",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req:  { protocol: "https", headers: {} } as TrpcContext["req"],
    res:  { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ── Single-toggle DB spy harness ──────────────────────────────────────────────
//
// The `setModuleReactivation` mutation calls:
//   db.insert(table).values({...}).onConflictDoUpdate({ target, set })
//
// This spy intercepts that chain, records the `values` and `set` payloads,
// and applies the ON CONFLICT UPDATE semantics faithfully so tests can
// read back the final committed row.

interface SpyPayload {
  values: Record<string, unknown>;
  conflictSet: Record<string, unknown>;
}

interface HarnessRow {
  groupId:   string;
  ventureId: string;
  active:    boolean;
  toggledBy: string | null;
  toggledAt: Date;
}

function makeToggleSpy() {
  const committed = new Map<string, HarnessRow>();
  const captured:  SpyPayload[] = [];

  const spy = {
    /** All rows committed to the spy store — equivalent to a DB read. */
    committed,
    /** All (values, conflictSet) payloads captured from onConflictDoUpdate calls. */
    captured,

    /** Read all rows, sorted by groupId — mirrors getModuleReactivations. */
    readRows(): ReactivationRow[] {
      return [...committed.values()].sort((a, b) => a.groupId.localeCompare(b.groupId));
    },

    /**
     * Returns a mock DB object whose insert() chain faithfully applies
     * onConflictDoUpdate semantics and records every payload.
     *
     * The returned object also mocks the minimal select/delete surface so the
     * router's other module paths don't crash if incidentally triggered.
     */
    makeDb() {
      return {
        // Minimal select mock (used by getModuleReactivations — not exercised here)
        select: () => ({
          from: () => Promise.resolve([] as HarnessRow[]),
        }),

        // insert().values().onConflictDoUpdate() chain
        insert: (_table: unknown) => ({
          values: (row: Record<string, unknown>) => ({
            onConflictDoUpdate: (opts: { target: unknown; set: Record<string, unknown> }) => {
              const k        = `${row.groupId}:${row.ventureId}`;
              const existing = committed.get(k);

              // Record the full payload for assertion
              captured.push({ values: row, conflictSet: opts.set });

              if (existing) {
                // Apply conflict-update: only the fields in `set` are updated.
                // This is the faithful mirror of PostgreSQL ON CONFLICT DO UPDATE SET.
                committed.set(k, {
                  ...existing,
                  active:    (opts.set.active    as boolean)      ?? existing.active,
                  toggledBy: (opts.set.toggledBy as string | null) ?? existing.toggledBy,
                  toggledAt: (opts.set.toggledAt as Date)         ?? existing.toggledAt,
                });
              } else {
                committed.set(k, {
                  groupId:   row.groupId   as string,
                  ventureId: row.ventureId as string,
                  active:    row.active    as boolean,
                  toggledBy: row.toggledBy as string | null,
                  toggledAt: row.toggledAt as Date,
                });
              }

              // Return an object that supports both:
              //   • .returning()  — called by the updated handler for integrity validation
              //     (returns both groupId and ventureId so the composite-key check passes)
              //   • direct await  — thenable fallback for any other code path
              const confirmedGroupId   = row.groupId   as string;
              const confirmedVentureId = row.ventureId as string;
              const voidResolved = Promise.resolve(undefined);
              return {
                returning: (_shape: unknown) =>
                  Promise.resolve([{ groupId: confirmedGroupId, ventureId: confirmedVentureId }]),
                then:    voidResolved.then.bind(voidResolved),
                catch:   voidResolved.catch.bind(voidResolved),
                finally: voidResolved.finally.bind(voidResolved),
              };
            },
          }),
        }),
      };
    },
  };

  return spy;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GROUP     = "discovery";
const VENTURE_A = "ven-alpha";

// ══════════════════════════════════════════════════════════════════════════════
// SUITE — Router conflict-update payload validation
// ══════════════════════════════════════════════════════════════════════════════

describe("setModuleReactivation — onConflictDoUpdate set-clause validation (router layer)", () => {
  let spy: ReturnType<typeof makeToggleSpy>;

  beforeEach(() => {
    spy = makeToggleSpy();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(spy.makeDb());
  });

  // ── 1. Conflict set always includes toggledBy ─────────────────────────────
  it("the onConflictDoUpdate set clause always includes toggledBy", async () => {
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    await caller.admin.setModuleReactivation({
      groupId:   GROUP,
      ventureId: VENTURE_A,
      active:    true,
    });

    expect(spy.captured.length).toBe(1);
    const { conflictSet } = spy.captured[0];
    expect(conflictSet).toHaveProperty("toggledBy");
    // Must be a non-empty string — not null/undefined
    expect(typeof conflictSet.toggledBy).toBe("string");
    expect((conflictSet.toggledBy as string).length).toBeGreaterThan(0);
  });

  // ── 2. Conflict set always includes toggledAt ─────────────────────────────
  it("the onConflictDoUpdate set clause always includes toggledAt", async () => {
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    await caller.admin.setModuleReactivation({
      groupId:   GROUP,
      ventureId: VENTURE_A,
      active:    true,
    });

    expect(spy.captured.length).toBe(1);
    const { conflictSet } = spy.captured[0];
    expect(conflictSet).toHaveProperty("toggledAt");
    expect(conflictSet.toggledAt).toBeInstanceOf(Date);
  });

  // ── 3. Conflict set includes active ──────────────────────────────────────
  it("the onConflictDoUpdate set clause includes active (the toggle state)", async () => {
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    await caller.admin.setModuleReactivation({
      groupId:   GROUP,
      ventureId: VENTURE_A,
      active:    false,
    });

    const { conflictSet } = spy.captured[0];
    expect(conflictSet).toHaveProperty("active");
    expect(conflictSet.active).toBe(false);
  });

  // ── 4. Conflict set has all three fields together ─────────────────────────
  it("the onConflictDoUpdate set clause updates active, toggledBy, AND toggledAt atomically", async () => {
    const caller = appRouter.createCaller(makeAdminCtx("bob"));
    await caller.admin.setModuleReactivation({
      groupId:   GROUP,
      ventureId: VENTURE_A,
      active:    true,
    });

    const { conflictSet } = spy.captured[0];
    const keys = Object.keys(conflictSet);
    expect(keys).toContain("active");
    expect(keys).toContain("toggledBy");
    expect(keys).toContain("toggledAt");
  });

  // ── 5. toggledBy in set matches the calling admin ─────────────────────────
  it("the toggledBy in the conflict set reflects the calling admin's name", async () => {
    const caller = appRouter.createCaller(makeAdminCtx("carol"));
    await caller.admin.setModuleReactivation({
      groupId:   GROUP,
      ventureId: VENTURE_A,
      active:    true,
    });

    const { conflictSet } = spy.captured[0];
    expect(conflictSet.toggledBy).toBe("carol");
  });

  // ── 6. values payload also contains toggledBy + toggledAt ─────────────────
  it("the INSERT values payload also includes toggledBy and toggledAt (not just the conflict set)", async () => {
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    await caller.admin.setModuleReactivation({
      groupId:   GROUP,
      ventureId: VENTURE_A,
      active:    true,
    });

    const { values } = spy.captured[0];
    expect(values).toHaveProperty("toggledBy");
    expect(values).toHaveProperty("toggledAt");
    expect(typeof values.toggledBy).toBe("string");
    expect(values.toggledAt).toBeInstanceOf(Date);
  });

  // ── 7. Conflict semantics: second write updates all three fields ───────────
  it("a second toggle call on the same key updates active, toggledBy, and toggledAt in the stored row", async () => {
    const alice = appRouter.createCaller(makeAdminCtx("alice"));
    const bob   = appRouter.createCaller(makeAdminCtx("bob"));

    // Alice writes first; bob overwrites
    await alice.admin.setModuleReactivation({ groupId: GROUP, ventureId: VENTURE_A, active: true  });
    await bob.admin.setModuleReactivation(  { groupId: GROUP, ventureId: VENTURE_A, active: false });

    expect(spy.captured.length).toBe(2);

    // Second call's conflictSet must carry bob's identity and a fresh timestamp
    const { conflictSet: set2 } = spy.captured[1];
    expect(set2.toggledBy).toBe("bob");
    expect(set2.toggledAt).toBeInstanceOf(Date);
    expect(set2.active).toBe(false);
  });

  // ── 8. Concurrent writes: DB-confirmed row is internally consistent ────────
  it("concurrent calls via Promise.all produce a single consistent row — toggledBy and toggledAt always from the same write", async () => {
    const alice = appRouter.createCaller(makeAdminCtx("alice"));
    const bob   = appRouter.createCaller(makeAdminCtx("bob"));

    // Dispatch both concurrently — do NOT assert which one settled last
    await Promise.all([
      alice.admin.setModuleReactivation({ groupId: GROUP, ventureId: VENTURE_A, active: true  }),
      bob.admin.setModuleReactivation(  { groupId: GROUP, ventureId: VENTURE_A, active: false }),
    ]);

    // Exactly one row for this (groupId, ventureId)
    const rows = spy.readRows();
    const forKey = rows.filter(r => r.groupId === GROUP && r.ventureId === VENTURE_A);
    expect(forKey.length).toBe(1);

    const row = forKey[0];

    // The captured conflict-set payloads let us identify alice's and bob's writes
    const alicePayload = spy.captured.find(p => p.conflictSet.toggledBy === "alice");
    const bobPayload   = spy.captured.find(p => p.conflictSet.toggledBy === "bob");
    expect(alicePayload).toBeDefined();
    expect(bobPayload).toBeDefined();

    // The stored row's author must have a timestamp that matches that author's conflict set
    if (row.toggledBy === "alice") {
      // alice's timestamp must come from alice's own write — not bob's
      expect(row.toggledAt).toEqual(alicePayload!.conflictSet.toggledAt);
    } else {
      expect(row.toggledBy).toBe("bob");
      expect(row.toggledAt).toEqual(bobPayload!.conflictSet.toggledAt);
    }
  });

  // ── 9. Concurrent writes: audit string from DB row is never mixed ─────────
  it("audit string derived from the DB-stored row after concurrent writes is never a cross-write mix", async () => {
    const alice = appRouter.createCaller(makeAdminCtx("alice"));
    const bob   = appRouter.createCaller(makeAdminCtx("bob"));

    await Promise.all([
      alice.admin.setModuleReactivation({ groupId: GROUP, ventureId: VENTURE_A, active: true  }),
      bob.admin.setModuleReactivation(  { groupId: GROUP, ventureId: VENTURE_A, active: false }),
    ]);

    const rows = spy.readRows();
    const map  = buildRowByGroup(rows, VENTURE_A);
    const row  = map.get(GROUP)!;

    // Audit string must start with the winner's name and contain no other admin's name
    const audit = formatToggleAudit(row.toggledBy, row.toggledAt)!;
    const winner = row.toggledBy!;
    const loser  = winner === "alice" ? "bob" : "alice";

    expect(audit).toMatch(new RegExp(`^${winner}`));
    expect(audit).not.toContain(loser);
  });

  // ── 10. Global scope: conflict set still carries both audit fields ─────────
  it("global-scope toggle (ventureId omitted) still includes toggledBy and toggledAt in the conflict set", async () => {
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    await caller.admin.setModuleReactivation({
      groupId: GROUP,
      // ventureId omitted → normalised to __global__ by the router
      active: true,
    });

    expect(spy.captured.length).toBe(1);
    const { conflictSet } = spy.captured[0];
    expect(conflictSet).toHaveProperty("toggledBy");
    expect(conflictSet).toHaveProperty("toggledAt");
    expect(conflictSet.toggledBy).toBe("alice");

    // Confirm the row is stored under the __global__ sentinel
    const rows = spy.readRows();
    const globalRow = rows.find(r => r.groupId === GROUP && r.ventureId === "__global__");
    expect(globalRow).toBeDefined();
    expect(globalRow!.toggledBy).toBe("alice");
  });
});
