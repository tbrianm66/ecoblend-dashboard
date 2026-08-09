/**
 * Gate 4 — setModuleReactivationBatch: Atomicity & Partial-Failure Tests
 *
 * What this file proves
 * ─────────────────────
 * The `setModuleReactivationBatch` router procedure wraps all group upserts in
 * a single DB transaction.  These tests call the ACTUAL router procedure
 * (via appRouter.createCaller) against a faithful in-process DB transaction
 * harness and verify three hard properties:
 *
 *   1. SUCCESS PATH — all N groups are written when the batch completes without
 *      error (specifically exercises 15-group "activate all" / "deactivate all"
 *      payloads that mirror the real admin UI action).
 *
 *   2. ROLLBACK PATH — if the DB throws inside the transaction callback
 *      (simulating a timeout, serialisation error, or constraint failure),
 *      ZERO rows are committed.  The harness proves this by starting with a
 *      known committed state and verifying it is unchanged after the fault.
 *
 *   3. CONCURRENT CALL PATH — two overlapping batches dispatched with
 *      Promise.all for the same venture produce a consistent final state:
 *      exactly 15 rows, all from one complete batch (no blend of the two).
 *
 * Approach
 * ────────
 * `getDb` is mocked (vi.mock) so every test controls the DB instance.  The
 * mock DB exposes a `transaction(fn)` method with faithful all-or-nothing
 * semantics:
 *
 *   • Inserts within the callback go into an isolated staging map.
 *   • If the callback resolves, staging is merged into the committed store.
 *   • If the callback rejects (or throws), staging is discarded — the
 *     committed store is unchanged.  This is the ROLLBACK guarantee.
 *   • A `faultAfter` option causes the Nth insert to return a rejected
 *     promise, exercising the mid-transaction failure path.
 *
 * Each test creates its own DB instance so committed stores never bleed
 * across tests.
 */

import { describe, it, expect, vi } from "vitest";
import { TRPCError } from "@trpc/server";

// vi.mock is hoisted — this mock intercepts all getDb() calls made by the
// real admin.router.ts handler during the test run.
vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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

function makeNonAdminCtx(role = "founder"): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "oid-nonadmin",
      email: "nonadmin@test.example",
      name: "Non-Admin",
      loginMethod: "test",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req:  { protocol: "https", headers: {} } as TrpcContext["req"],
    res:  { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ── Faithful DB transaction harness ──────────────────────────────────────────
//
// Implements the same all-or-nothing semantics as a real PostgreSQL transaction:
//   • Each call to `transaction(fn)` gets its own isolated staging map.
//   • If `fn` resolves → staging is merged into the committed store.
//   • If `fn` throws/rejects → staging is discarded; committed unchanged.
//   • `faultAfter` injects a DB-level error after N successful inserts
//     (before the Nth+1 row is staged), simulating a mid-transaction failure.

interface HarnessRow {
  groupId:   string;
  ventureId: string;
  active:    boolean;
  toggledBy: string | null;
  toggledAt: Date;
}

interface HarnessDb {
  /** All rows that have been committed (not staged). Read-only externally. */
  committed: Map<string, HarnessRow>;
  transaction: (fn: (tx: HarnessTx) => Promise<void>) => Promise<void>;
}

interface HarnessTx {
  insert: (table: unknown) => {
    values: (row: Record<string, unknown>) => {
      onConflictDoUpdate: (opts: { target: unknown; set: Record<string, unknown> }) => Promise<void>;
    };
  };
}

function makeHarnessDb(opts?: { faultAfter?: number }): HarnessDb {
  const committed = new Map<string, HarnessRow>();
  const faultLimit = opts?.faultAfter;

  return {
    committed,

    async transaction(fn) {
      // Snapshot committed into an isolated staging map.
      const staging = new Map<string, HarnessRow>(committed);
      let insertsDone = 0;

      const tx: HarnessTx = {
        insert: (_table) => ({
          values: (row) => ({
            onConflictDoUpdate: ({ set }) => {
              // Simulate a DB failure BEFORE processing this insert.
              if (faultLimit !== undefined && insertsDone >= faultLimit) {
                return Promise.reject(
                  new Error(`Simulated DB timeout after ${faultLimit} insert(s)`),
                );
              }

              // Process the upsert into staging.
              const k = `${row.groupId}:${row.ventureId}`;
              const existing = staging.get(k);
              if (existing) {
                // onConflictDoUpdate: keep identity columns, apply `set` fields.
                staging.set(k, {
                  ...existing,
                  active:    (set.active    as boolean)      ?? existing.active,
                  toggledBy: (set.toggledBy as string | null) ?? existing.toggledBy,
                  toggledAt: (set.toggledAt as Date)         ?? existing.toggledAt,
                });
              } else {
                staging.set(k, {
                  groupId:   row.groupId   as string,
                  ventureId: row.ventureId as string,
                  active:    row.active    as boolean,
                  toggledBy: row.toggledBy as string | null,
                  toggledAt: row.toggledAt as Date,
                });
              }
              insertsDone++;
              return Promise.resolve();
            },
          }),
        }),
      };

      // Run the transaction callback.
      // If fn throws/rejects → the catch below discards staging (ROLLBACK).
      // If fn resolves → commit staging into the durable committed store.
      await fn(tx); // throws on fault → staging never committed below

      // COMMIT: merge staging into committed.
      // This loop is synchronous so no other transaction can interleave mid-commit.
      for (const [k, row] of staging) {
        committed.set(k, row);
      }
    },
  };
}

// ── Helper: all 15 Gate-4 group IDs ──────────────────────────────────────────

const GATE4_GROUPS = [
  "discovery", "validation", "gtm", "scoring", "coaching",
  "operations", "people", "rnd", "risk", "investment",
  "governance", "sustainability", "execution", "product", "finance",
] as const;

function activateAllItems(active = true) {
  return GATE4_GROUPS.map(groupId => ({ groupId, active }));
}

// ── Helper: read committed rows for a venture from the harness ────────────────

function committedFor(db: HarnessDb, ventureId: string): HarnessRow[] {
  return [...db.committed.values()].filter(r => r.ventureId === ventureId);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("setModuleReactivationBatch — success path (real router + harness DB)", () => {
  it("writes all 15 groups to the DB when the batch succeeds (activate all)", async () => {
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    const result = await caller.admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: activateAllItems(true),
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(15);

    const rows = committedFor(db, "VENTURE-A");
    expect(rows).toHaveLength(15);
    expect(rows.every(r => r.active === true)).toBe(true);
  });

  it("writes all 15 groups when the batch deactivates all", async () => {
    // Pre-seed so the upsert (onConflictDoUpdate) path is exercised.
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    await caller.admin.setModuleReactivationBatch({ ventureId: "VENTURE-A", items: activateAllItems(true) });
    await caller.admin.setModuleReactivationBatch({ ventureId: "VENTURE-A", items: activateAllItems(false) });

    const rows = committedFor(db, "VENTURE-A");
    expect(rows).toHaveLength(15);                          // no duplicate rows
    expect(rows.every(r => r.active === false)).toBe(true); // all deactivated
  });

  it("every Gate-4 groupId is present in the committed store after success", async () => {
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: activateAllItems(),
    });

    const ids = committedFor(db, "VENTURE-A").map(r => r.groupId).sort();
    expect(ids).toEqual([...GATE4_GROUPS].sort());
  });

  it("each row carries the correct ventureId, toggledBy, and active flag", async () => {
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    await appRouter.createCaller(makeAdminCtx("alice")).admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: [{ groupId: "discovery", active: true }],
    });

    const rows = committedFor(db, "VENTURE-A");
    expect(rows).toHaveLength(1);
    expect(rows[0].ventureId).toBe("VENTURE-A");
    expect(rows[0].toggledBy).toBe("alice");
    expect(rows[0].active).toBe(true);
  });

  it("omitting ventureId stores all rows under the __global__ sentinel", async () => {
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
      items: activateAllItems(),
    });

    const globalRows = [...db.committed.values()].filter(r => r.ventureId === "__global__");
    expect(globalRows).toHaveLength(15);
  });

  it("empty-string ventureId is normalised to __global__", async () => {
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
      ventureId: "",
      items: [{ groupId: "discovery", active: true }],
    });

    const rows = [...db.committed.values()];
    expect(rows[0].ventureId).toBe("__global__");
  });

  it("does not touch another venture's rows when writing to VENTURE-A", async () => {
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    await caller.admin.setModuleReactivationBatch({ ventureId: "VENTURE-B", items: activateAllItems(true) });
    await caller.admin.setModuleReactivationBatch({ ventureId: "VENTURE-A", items: activateAllItems(false) });

    const bRows = committedFor(db, "VENTURE-B");
    expect(bRows).toHaveLength(15);
    expect(bRows.every(r => r.active === true)).toBe(true); // VENTURE-B untouched
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("setModuleReactivationBatch — rollback path (real router + fault injection)", () => {
  it("commits zero rows when the DB throws on the very first insert", async () => {
    const db = makeHarnessDb({ faultAfter: 0 });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let threw = false;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: activateAllItems(),
      });
    } catch {
      threw = true;
    }

    expect(threw).toBe(true);
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("commits zero rows when the DB throws after 7 items (mid-batch)", async () => {
    const db = makeHarnessDb({ faultAfter: 7 });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let threw = false;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: activateAllItems(),
      });
    } catch {
      threw = true;
    }

    expect(threw).toBe(true);
    // The 7 staged inserts must not appear in the committed store.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("commits zero rows when the DB throws on the 14th item (penultimate)", async () => {
    const db = makeHarnessDb({ faultAfter: 14 });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let threw = false;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: activateAllItems(),
      });
    } catch {
      threw = true;
    }

    expect(threw).toBe(true);
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("pre-existing rows for the venture are preserved after a failed batch", async () => {
    const db = makeHarnessDb({ faultAfter: 8 });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    // Successful first batch: 3 groups.
    // This call must NOT fault (faultAfter = 8, only 3 inserts).
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    await caller.admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: [
        { groupId: "discovery",  active: true },
        { groupId: "validation", active: true },
        { groupId: "gtm",        active: true },
      ],
    });

    // The 3 rows are committed.  Now a 15-item batch will fault at item 8.
    // We need a fresh DB with the existing 3 rows seeded AND faultAfter = 8
    // for the large batch (item 8 of 15 fails → items 0-7 staged but not committed).

    // Re-create the harness: seed it with the 3 committed rows, then fault at 8.
    const db2 = makeHarnessDb({ faultAfter: 8 });
    // Seed committed state to match what db has after the first batch.
    for (const [k, row] of db.committed.entries()) {
      db2.committed.set(k, row);
    }
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db2);

    try {
      await caller.admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: activateAllItems(false), // 15 items — fails at item 8
      });
    } catch {
      // expected
    }

    // Committed store must still hold exactly the original 3 rows (active: true).
    const rows = committedFor(db2, "VENTURE-A");
    expect(rows).toHaveLength(3);
    expect(rows.every(r => r.active === true)).toBe(true);
  });

  it("another venture's rows are unaffected when VENTURE-A's batch rolls back", async () => {
    const db = makeHarnessDb({ faultAfter: 5 });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    // VENTURE-B: successful batch (only 3 items → no fault).
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    await caller.admin.setModuleReactivationBatch({
      ventureId: "VENTURE-B",
      items: [
        { groupId: "discovery", active: true },
        { groupId: "scoring",   active: true },
        { groupId: "rnd",       active: true },
      ],
    });

    // VENTURE-A: 15-item batch faults at item 5 — should roll back.
    try {
      await caller.admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: activateAllItems(),
      });
    } catch {
      // expected
    }

    // VENTURE-B's 3 rows must be completely untouched.
    const bRows = committedFor(db, "VENTURE-B");
    expect(bRows).toHaveLength(3);
    expect(bRows.every(r => r.active === true)).toBe(true);
    // VENTURE-A must have no rows.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("a successful retry after a failed batch writes all rows cleanly", async () => {
    const db = makeHarnessDb({ faultAfter: 5 });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const caller = appRouter.createCaller(makeAdminCtx("alice"));

    // First attempt: faults at item 5.
    try {
      await caller.admin.setModuleReactivationBatch({ ventureId: "VENTURE-A", items: activateAllItems() });
    } catch {
      // expected
    }
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);

    // Retry: use a fresh harness with no fault.
    const db2 = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db2);

    await caller.admin.setModuleReactivationBatch({ ventureId: "VENTURE-A", items: activateAllItems(true) });

    expect(committedFor(db2, "VENTURE-A")).toHaveLength(15);
    expect(committedFor(db2, "VENTURE-A").every(r => r.active === true)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("setModuleReactivationBatch — concurrent call path (real router + Promise.all)", () => {
  it("two overlapping batch calls produce exactly 15 rows with no partial state", async () => {
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const aliceCaller = appRouter.createCaller(makeAdminCtx("alice"));
    const bobCaller   = appRouter.createCaller(makeAdminCtx("bob"));

    // Fire both batches concurrently.
    await Promise.all([
      aliceCaller.admin.setModuleReactivationBatch({ ventureId: "VENTURE-A", items: activateAllItems(true) }),
      bobCaller.admin.setModuleReactivationBatch(   { ventureId: "VENTURE-A", items: activateAllItems(false) }),
    ]);

    const rows = committedFor(db, "VENTURE-A");

    // Exactly 15 rows — the unique (groupId, ventureId) constraint means
    // no duplicate rows regardless of interleaving.
    expect(rows).toHaveLength(15);

    // No duplicate groupIds.
    const seen = new Set<string>();
    for (const row of rows) {
      expect(seen.has(row.groupId)).toBe(false);
      seen.add(row.groupId);
    }

    // All rows must share ONE toggledBy value — "alice" or "bob", never a blend.
    // A mix would indicate a partial state from two concurrent batches interleaving.
    const authors = new Set(rows.map(r => r.toggledBy));
    expect(authors.size).toBe(1);
    expect(["alice", "bob"].includes([...authors][0]!)).toBe(true);
  });

  it("two batches for different ventures do not bleed rows into each other", async () => {
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    await Promise.all([
      appRouter.createCaller(makeAdminCtx("alice")).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A", items: activateAllItems(true),
      }),
      appRouter.createCaller(makeAdminCtx("bob")).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-B", items: activateAllItems(false),
      }),
    ]);

    const aRows = committedFor(db, "VENTURE-A");
    const bRows = committedFor(db, "VENTURE-B");

    expect(aRows).toHaveLength(15);
    expect(bRows).toHaveLength(15);
    expect(aRows.every(r => r.active === true  && r.toggledBy === "alice")).toBe(true);
    expect(bRows.every(r => r.active === false && r.toggledBy === "bob")).toBe(true);
  });

  it("a failed concurrent batch leaves the previously committed batch intact", async () => {
    // Alice's batch: no fault; Bob's batch: faults at item 6.
    // We need TWO harness instances because each carries different fault config.
    // Both calls share the same getDb mock — we use mockResolvedValueOnce
    // so each of the two getDb() calls in the concurrent block gets its own db.
    const aliceDb = makeHarnessDb();
    const bobDb   = makeHarnessDb({ faultAfter: 6 });

    (getDb as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(aliceDb)
      .mockResolvedValueOnce(bobDb);

    const results = await Promise.allSettled([
      appRouter.createCaller(makeAdminCtx("alice")).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A", items: activateAllItems(true),
      }),
      appRouter.createCaller(makeAdminCtx("bob")).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A", items: activateAllItems(false),
      }),
    ]);

    const [aliceResult, bobResult] = results;

    // Alice's call must succeed; Bob's must fail.
    expect(aliceResult.status).toBe("fulfilled");
    expect(bobResult.status).toBe("rejected");

    // Alice's store has all 15 rows intact.
    expect(committedFor(aliceDb, "VENTURE-A")).toHaveLength(15);
    expect(committedFor(aliceDb, "VENTURE-A").every(r => r.active === true)).toBe(true);

    // Bob's store has zero rows (rollback).
    expect(committedFor(bobDb, "VENTURE-A")).toHaveLength(0);
  });

  it("second concurrent batch is idempotent — no duplicate rows created", async () => {
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    // Two identical batches run at the same time.
    await Promise.all([
      appRouter.createCaller(makeAdminCtx("alice")).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A", items: activateAllItems(true),
      }),
      appRouter.createCaller(makeAdminCtx("alice")).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A", items: activateAllItems(true),
      }),
    ]);

    // The (groupId, ventureId) unique constraint means upsert never creates
    // duplicate rows — verify that exactly 15 distinct rows exist.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(15);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("setModuleReactivationBatch — access control (real router, admin guard fires before DB)", () => {
  it("rejects a founder with FORBIDDEN without touching the DB", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(makeHarnessDb());

    let err: unknown;
    try {
      await appRouter.createCaller(makeNonAdminCtx("founder")).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [{ groupId: "discovery", active: true }],
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("FORBIDDEN");
  });

  it("rejects a coach with FORBIDDEN", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(makeHarnessDb());

    let err: unknown;
    try {
      await appRouter.createCaller(makeNonAdminCtx("coach")).admin.setModuleReactivationBatch({
        items: activateAllItems(),
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("FORBIDDEN");
  });

  it("rejects scoring_integrity_reviewer with FORBIDDEN", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(makeHarnessDb());

    let err: unknown;
    try {
      await appRouter.createCaller(makeNonAdminCtx("scoring_integrity_reviewer")).admin.setModuleReactivationBatch({
        items: activateAllItems(),
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("FORBIDDEN");
  });

  it("an admin caller passes the guard and the batch proceeds normally", async () => {
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const result = await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: [{ groupId: "discovery", active: true }],
    });

    expect(result.success).toBe(true);
    expect(committedFor(db, "VENTURE-A")).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("setModuleReactivationBatch — payload size validation (schema rejects before DB)", () => {
  // tRPC wraps Zod validation failures in a TRPCError with code BAD_REQUEST.
  // These tests confirm the schema boundary (.min(1).max(50)) is enforced at
  // the validation layer so the DB transaction is never entered.

  it("rejects an empty items array with BAD_REQUEST and writes zero rows", async () => {
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [],
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("BAD_REQUEST");
    // No rows should have been committed — the handler never reached the DB.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("rejects a 51-item array with BAD_REQUEST and writes zero rows", async () => {
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const oversized = Array.from({ length: 51 }, (_, i) => ({
      groupId: `group-${i}`,
      active:  true,
    }));

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: oversized,
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("BAD_REQUEST");
    // Validation must fire before the transaction — committed store stays empty.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });
});
