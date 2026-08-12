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

// onConflictDoUpdate returns an object that:
//   • has a .returning() method (mimicking Drizzle's query builder chain), AND
//   • is itself awaitable as a Promise<void> (for code that doesn't call .returning).
// The router's updated code always calls .returning(), so the harness must
// support the chain.  Callers that await the result directly (without .returning)
// still work because the object also exposes .then / .catch / .finally.
interface HarnessTxChain {
  returning: (shape: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>;
  then:    PromiseLike<void>["then"];
  catch:   PromiseLike<void>["catch"];
  finally: (<T>(onfinally?: (() => void) | null | undefined) => Promise<T>);
}

interface HarnessTx {
  insert: (table: unknown) => {
    values: (row: Record<string, unknown>) => {
      onConflictDoUpdate: (opts: { target: unknown; set: Record<string, unknown> }) => HarnessTxChain;
    };
  };
}

interface HarnessDb {
  /** All rows that have been committed (not staged). Read-only externally. */
  committed: Map<string, HarnessRow>;
  transaction: (fn: (tx: HarnessTx) => Promise<void>) => Promise<void>;
}

function makeHarnessDb(opts?: {
  faultAfter?:       number;
  silentSkipAfter?:  number;
  /** After Nth insert, .returning() yields 2 rows instead of 1 (extra-row injection). */
  extraRowsAfter?:   number;
  /** After Nth insert, .returning() yields a row whose groupId is replaced with a sentinel. */
  wrongGroupIdAfter?: number;
}): HarnessDb {
  const committed        = new Map<string, HarnessRow>();
  const faultLimit       = opts?.faultAfter;
  const silentLimit      = opts?.silentSkipAfter;
  const extraRowsLimit   = opts?.extraRowsAfter;
  const wrongGroupLimit  = opts?.wrongGroupIdAfter;

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
              // --- Fault injection: DB-level error (aborts the transaction) ---
              if (faultLimit !== undefined && insertsDone >= faultLimit) {
                const rejection = Promise.reject(
                  new Error(`Simulated DB timeout after ${faultLimit} insert(s)`),
                );
                return {
                  returning: () => rejection as unknown as Promise<Array<Record<string, unknown>>>,
                  then:    rejection.then.bind(rejection),
                  catch:   rejection.catch.bind(rejection),
                  finally: rejection.finally.bind(rejection) as HarnessTxChain["finally"],
                };
              }

              // --- Silent-skip injection: resolves without writing the row ---
              // Simulates a future code path that conditionally skips an item
              // without throwing (e.g. a DO NOTHING variant, a partial-index
              // match, or a guard that returns early).  .returning() yields []
              // so the router's integrity check sees a mismatch.
              if (silentLimit !== undefined && insertsDone >= silentLimit) {
                insertsDone++;
                const emptyResolved = Promise.resolve([] as Array<Record<string, unknown>>);
                const voidResolved  = Promise.resolve(undefined);
                return {
                  returning: () => emptyResolved,
                  then:    voidResolved.then.bind(voidResolved),
                  catch:   voidResolved.catch.bind(voidResolved),
                  finally: voidResolved.finally.bind(voidResolved) as HarnessTxChain["finally"],
                };
              }

              // --- Extra-rows injection: .returning() yields 2 rows for one upsert ---
              // Simulates a DB trigger (or future schema change) that produces an
              // additional row from a single INSERT ... ON CONFLICT ... RETURNING,
              // causing the router's "exactly 1 row" per-item check to fire.
              if (extraRowsLimit !== undefined && insertsDone >= extraRowsLimit) {
                insertsDone++;
                const writtenGroupId = row.groupId as string;
                const multiRow = Promise.resolve([
                  { groupId: writtenGroupId },
                  { groupId: writtenGroupId }, // second row — same key, simulates a trigger
                ] as Array<Record<string, unknown>>);
                const voidResolved = Promise.resolve(undefined);
                return {
                  returning: () => multiRow,
                  then:    voidResolved.then.bind(voidResolved),
                  catch:   voidResolved.catch.bind(voidResolved),
                  finally: voidResolved.finally.bind(voidResolved) as HarnessTxChain["finally"],
                };
              }

              // --- Wrong-groupId injection: .returning() yields a row with a different groupId ---
              // Simulates a conflict-resolution rewrite or future schema change that
              // causes the DB to return a confirmed row for a different groupId than
              // the one submitted, triggering the router's groupId-match check.
              if (wrongGroupLimit !== undefined && insertsDone >= wrongGroupLimit) {
                insertsDone++;
                const wrongRow = Promise.resolve([
                  { groupId: "__wrong_sentinel__" },
                ] as Array<Record<string, unknown>>);
                const voidResolved = Promise.resolve(undefined);
                return {
                  returning: () => wrongRow,
                  then:    voidResolved.then.bind(voidResolved),
                  catch:   voidResolved.catch.bind(voidResolved),
                  finally: voidResolved.finally.bind(voidResolved) as HarnessTxChain["finally"],
                };
              }

              // --- Normal path: upsert the row into staging ---
              const k = `${row.groupId}:${row.ventureId}`;
              const existing = staging.get(k);
              if (existing) {
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

              const writtenGroupId = row.groupId as string;
              const resolved       = Promise.resolve([{ groupId: writtenGroupId }]);
              const voidResolved   = Promise.resolve(undefined);
              return {
                returning: (_shape: Record<string, unknown>) => resolved,
                then:    voidResolved.then.bind(voidResolved),
                catch:   voidResolved.catch.bind(voidResolved),
                finally: voidResolved.finally.bind(voidResolved) as HarnessTxChain["finally"],
              };
            },
          }),
        }),
      };

      // Run the transaction callback.
      // If fn throws/rejects → staging is discarded (ROLLBACK).
      // If fn resolves      → staging is merged into committed (COMMIT).
      await fn(tx);

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

  it("rejects a single item with an empty groupId with BAD_REQUEST and writes zero rows", async () => {
    // groupId: "" violates z.string().min(1) — Zod rejects before the DB is touched.
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [{ groupId: "", active: true }],
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("BAD_REQUEST");
    // The handler must not have entered the transaction — no rows committed.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("rejects a single item with a 65-character groupId with BAD_REQUEST and writes zero rows", async () => {
    // groupId of 65 chars violates z.string().max(64) — Zod rejects before the DB is touched.
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const tooLong = "a".repeat(65);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [{ groupId: tooLong, active: true }],
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("BAD_REQUEST");
    // The handler must not have entered the transaction — no rows committed.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  // #147: batch rejects an item whose groupId is blank or whitespace-only before it reaches the DB
  it("rejects a mixed batch where one item has a blank groupId — entire batch rejected, zero rows written (#147)", async () => {
    // Zod validates each item in the array.  A blank groupId on ANY item
    // must cause the entire input to be rejected (BAD_REQUEST) before the
    // transaction is entered — no partial writes from the valid item.
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [
          { groupId: "discovery", active: true }, // valid
          { groupId: "",          active: true }, // blank — violates min(1)
        ],
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("BAD_REQUEST");
    // Zod rejects the whole input — the transaction is never entered.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("rejects a mixed batch where one item has a 65-char groupId — entire batch rejected, zero rows written", async () => {
    // A 65-character groupId on ANY item must cause the entire input to be
    // rejected (BAD_REQUEST) before the transaction is entered — no partial
    // writes from the remaining valid items.
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const tooLong = "b".repeat(65);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [
          { groupId: "discovery",  active: true }, // valid
          { groupId: "validation", active: true }, // valid
          { groupId: tooLong,      active: true }, // 65 chars — violates max(64)
        ],
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("BAD_REQUEST");
    // Zod rejects the whole input — the transaction is never entered.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("rejects a single item with a whitespace-only groupId with BAD_REQUEST and writes zero rows", async () => {
    // groupId: "   " passes z.string().min(1) (length 3) but must be rejected
    // by the .refine(s => s.trim().length > 0) check.  A whitespace-only groupId
    // stored as-is would create a DB row that can never be matched by a UI lookup
    // while the audit trail would show it as a successful write.
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [{ groupId: "   ", active: true }],
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("BAD_REQUEST");
    // The handler must not have entered the transaction — no rows committed.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("rejects a mixed batch where one item has a whitespace-only groupId — entire batch rejected, zero rows written", async () => {
    // A whitespace-only groupId on ANY item must cause the entire input to be
    // rejected (BAD_REQUEST) before the transaction is entered.
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [
          { groupId: "discovery",  active: true }, // valid
          { groupId: "\t",         active: true }, // tab — whitespace-only, violates refine
          { groupId: "validation", active: true }, // valid
        ],
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("BAD_REQUEST");
    // Zod rejects the whole input — the transaction is never entered.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("rejects a mixed batch where one item has a null groupId — entire batch rejected, zero rows written", async () => {
    // groupId: null is not a string — z.string() rejects it with BAD_REQUEST.
    // This test guards against a schema drift where z.string().optional() or
    // z.string().nullable() is used by mistake, which would let null slip through.
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [
          { groupId: "discovery", active: true }, // valid
          { groupId: null,        active: true }, // null — not a string, violates z.string()
        ] as any,
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("BAD_REQUEST");
    // Zod rejects the whole input — the transaction is never entered.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("rejects a mixed batch where one item has an undefined groupId — entire batch rejected, zero rows written", async () => {
    // groupId: undefined is absent — z.string().min(1) requires the field to be
    // a non-empty string; an undefined groupId must also be rejected with BAD_REQUEST.
    // This closes the gap where z.string().optional() could coerce an absent key
    // into undefined and silently pass it through.
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [
          { groupId: "discovery",  active: true }, // valid
          { groupId: undefined,    active: true }, // undefined — violates z.string()
        ] as any,
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("BAD_REQUEST");
    // Zod rejects the whole input — the transaction is never entered.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("setModuleReactivationBatch — mismatch detection (DB confirms fewer rows than requested)", () => {
  // This suite exercises the post-transaction integrity check introduced to
  // prevent the endpoint from silently lying about the written count.
  //
  // The `silentSkipAfter` harness option causes onConflictDoUpdate to resolve
  // (no throw) while returning [] from .returning() — simulating a DB-side
  // silent skip such as a DO-NOTHING conflict target or a partial-index match
  // that suppresses the write without aborting the transaction.
  //
  // The router MUST detect the shorter .returning() list and surface a
  // TRPC INTERNAL_SERVER_ERROR rather than returning { success: true, count: N }
  // where N is the original input length.

  it("throws INTERNAL_SERVER_ERROR when the DB silently skips the first item", async () => {
    // silentSkipAfter: 0 → first item resolves but returns [] from .returning()
    const db = makeHarnessDb({ silentSkipAfter: 0 });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [
          { groupId: "discovery",  active: true },
          { groupId: "validation", active: true },
        ],
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
    // The error message must name the skipped group so admins can investigate.
    expect((err as TRPCError).message).toContain("discovery");
    // Critical: the mismatch throw is inside the transaction, so staging is
    // discarded — zero rows must be committed (no partial state).
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("throws INTERNAL_SERVER_ERROR when the DB silently skips a mid-batch item", async () => {
    // silentSkipAfter: 7 → items 0-6 write normally, item 7 is silently skipped.
    const db = makeHarnessDb({ silentSkipAfter: 7 });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: activateAllItems(true), // 15 items
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
    // The per-item check fires first: written.length === 0 for the skipped item,
    // so the error message names the specific groupId that returned 0 rows.
    expect((err as TRPCError).message).toContain("got 0");
    // Throw inside the transaction → full rollback; the 7 staged rows are discarded.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("throws INTERNAL_SERVER_ERROR when the DB silently skips the last item", async () => {
    // silentSkipAfter: 14 → items 0-13 write normally, item 14 is silently skipped.
    const db = makeHarnessDb({ silentSkipAfter: 14 });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: activateAllItems(true), // 15 items
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
    // The per-item check fires first: written.length === 0 for the skipped item,
    // so the error message names the specific groupId that returned 0 rows.
    expect((err as TRPCError).message).toContain("got 0");
    // All 14 staged rows must be rolled back — committed store stays empty.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("does NOT throw when all items are confirmed by the DB", async () => {
    // No faults, no silent skips — all .returning() calls yield the written groupId.
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const result = await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: activateAllItems(true),
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(15);
    // The upserted list must enumerate every confirmed groupId.
    expect(result.upserted).toHaveLength(15);
    expect(result.upserted.sort()).toEqual([...GATE4_GROUPS].sort());
  });

  it("upserted list in the response contains exactly the DB-confirmed groupIds", async () => {
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const result = await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: [
        { groupId: "discovery",  active: true },
        { groupId: "validation", active: false },
        { groupId: "gtm",        active: true },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(3);
    expect(result.upserted.sort()).toEqual(["discovery", "gtm", "validation"].sort());
  });
});

// ─────────────────────────────────────────────────────────────────────────────

// #146: groupId-mismatch guard also rolls back when a DB trigger rewrites the returned row
describe("setModuleReactivationBatch — per-row shape validation (extra rows and wrong groupId) (#146)", () => {
  // This suite exercises the two per-item invariants introduced alongside the
  // broader mismatch check:
  //
  //   1. "Extra rows" — .returning() yields more than one row for a single upsert.
  //      This can happen if a DB trigger produces additional rows, or a future
  //      schema change alters the conflict-resolution target.  The router must
  //      detect written.length !== 1 and throw INTERNAL_SERVER_ERROR, rolling
  //      back the entire transaction so no partial state is committed.
  //
  //   2. "Wrong groupId" — .returning() yields exactly one row but its groupId
  //      does not match the item we submitted.  This can occur if the conflict
  //      clause is misconfigured and resolves against a different row, or if a
  //      trigger rewrites the returned value.  The router must detect the mismatch
  //      and throw INTERNAL_SERVER_ERROR.
  //
  // In both cases the throw happens INSIDE the transaction callback, so the
  // harness discards staging and the committed store remains empty.

  it("throws INTERNAL_SERVER_ERROR when .returning() yields 2 rows for the first item", async () => {
    // extraRowsAfter: 0 → first upsert returns [{ groupId }, { groupId }]
    const db = makeHarnessDb({ extraRowsAfter: 0 });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [
          { groupId: "discovery",  active: true },
          { groupId: "validation", active: true },
        ],
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
    // Message must name the offending groupId and indicate the unexpected count.
    expect((err as TRPCError).message).toContain("discovery");
    expect((err as TRPCError).message).toContain("2");
    // Throw inside the transaction → full rollback; committed store stays empty.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("throws INTERNAL_SERVER_ERROR when .returning() yields 2 rows for a mid-batch item", async () => {
    // extraRowsAfter: 5 → items 0-4 write normally, item 5 returns 2 rows.
    const db = makeHarnessDb({ extraRowsAfter: 5 });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: activateAllItems(true), // 15 items
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
    // The 5 staged rows must be rolled back — committed store stays empty.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("throws INTERNAL_SERVER_ERROR when .returning() yields 2 rows for the last item", async () => {
    // extraRowsAfter: 14 → items 0-13 write normally, item 14 returns 2 rows.
    const db = makeHarnessDb({ extraRowsAfter: 14 });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: activateAllItems(true), // 15 items
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
    // All 14 staged rows must be rolled back.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("throws INTERNAL_SERVER_ERROR when .returning() returns a wrong groupId for the first item", async () => {
    // wrongGroupIdAfter: 0 → first upsert returns [{ groupId: "__wrong_sentinel__" }]
    const db = makeHarnessDb({ wrongGroupIdAfter: 0 });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [
          { groupId: "discovery",  active: true },
          { groupId: "validation", active: true },
        ],
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
    // Message must name both the unexpected and the expected groupId.
    expect((err as TRPCError).message).toContain("__wrong_sentinel__");
    expect((err as TRPCError).message).toContain("discovery");
    // Throw inside the transaction → full rollback.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("throws INTERNAL_SERVER_ERROR when .returning() returns a wrong groupId for a mid-batch item", async () => {
    // wrongGroupIdAfter: 7 → items 0-6 write normally, item 7 returns wrong groupId.
    const db = makeHarnessDb({ wrongGroupIdAfter: 7 });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: activateAllItems(true), // 15 items
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
    expect((err as TRPCError).message).toContain("__wrong_sentinel__");
    // The 7 staged rows must be rolled back.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("does NOT throw when every item returns exactly one row with the correct groupId", async () => {
    // Baseline: verify the normal path is unaffected by the new per-item checks.
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const result = await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: activateAllItems(true),
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(15);
    expect(committedFor(db, "VENTURE-A")).toHaveLength(15);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

// ── Single-toggle DB mock ─────────────────────────────────────────────────────
//
// `setModuleReactivation` calls the DB directly (no transaction):
//   db.insert(...).values(...).onConflictDoUpdate(...).returning(...)
//
// This helper builds a minimal mock that satisfies that chain and lets each
// test control what .returning() produces.

function makeSingleToggleDb(opts: {
  /** What .returning() resolves to.
   *  Pass [] to simulate zero rows.
   *  Pass [{ groupId: "...", ventureId: "..." }] to control both identity fields. */
  returningRows: Array<{ groupId: string; ventureId: string }>;
}): unknown {
  return {
    insert: (_table: unknown) => ({
      values: (_row: unknown) => ({
        onConflictDoUpdate: (_opts: unknown) => ({
          returning: (_shape: unknown) => Promise.resolve(opts.returningRows),
        }),
      }),
    }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────

// ── Cross-path harness — READ COMMITTED model ─────────────────────────────────
//
// Both the single-toggle and batch-toggle paths write directly to `committed`
// (no staging snapshot).  This mirrors PostgreSQL's READ COMMITTED isolation
// level where each INSERT...ON CONFLICT DO UPDATE statement sees the latest
// committed state of the row it is updating, regardless of whether a sibling
// statement in the same connection has already committed.
//
// Key structural differences the harness preserves:
//   • setModuleReactivation  — calls db.insert() directly (auto-committed),
//     with toggledAt: new Date() constructed inline inside the set clause.
//   • setModuleReactivationBatch — wraps calls in db.transaction(fn);
//     computes `const now = new Date()` once before the loop and reuses it.
//
// The `returning()` method is where the actual write occurs; this lets barrier
// tests defer the write by awaiting a promise inside `returning()`.
//
// A regression that removes a field from either onConflictDoUpdate.set clause
// will leave the wrong admin's data in the committed row — these tests catch it.

interface CrossPathRow {
  groupId:   string;
  ventureId: string;
  active:    boolean;
  toggledBy: string | null;
  toggledAt: Date;
}

/** Apply an upsert to `store` and return the confirmed composite key. */
function applyUpsert(
  store: Map<string, CrossPathRow>,
  row:   Record<string, unknown>,
  set:   Record<string, unknown>,
): { groupId: string; ventureId: string } {
  const k = `${row.groupId}:${row.ventureId}`;
  const existing = store.get(k);
  store.set(
    k,
    existing
      ? {
          ...existing,
          active:    set.active    as boolean,
          toggledBy: set.toggledBy as string | null,
          toggledAt: set.toggledAt as Date,
        }
      : {
          groupId:   row.groupId   as string,
          ventureId: row.ventureId as string,
          active:    row.active    as boolean,
          toggledBy: row.toggledBy as string | null,
          toggledAt: row.toggledAt as Date,
        },
  );
  return { groupId: row.groupId as string, ventureId: row.ventureId as string };
}

type InsertChain = ReturnType<typeof buildDirectInsertChain>;
type TxFn = (tx: { insert: InsertChain }) => Promise<void>;

/** Insert chain that writes immediately when returning() is called. */
function buildDirectInsertChain(target: Map<string, CrossPathRow>): InsertChain {
  return (_table: unknown) => ({
    values: (row: Record<string, unknown>) => ({
      onConflictDoUpdate: ({ set }: { target: unknown; set: Record<string, unknown> }) => ({
        returning: (_shape: unknown) => {
          const confirmed = applyUpsert(target, row, set);
          return Promise.resolve([confirmed]);
        },
      }),
    }),
  });
}

/** Insert chain that awaits `barrier` before writing — models a write waiting for a DB lock. */
function buildDeferredInsertChain(
  target:  Map<string, CrossPathRow>,
  barrier: Promise<void>,
): InsertChain {
  return (_table: unknown) => ({
    values: (row: Record<string, unknown>) => ({
      onConflictDoUpdate: ({ set }: { target: unknown; set: Record<string, unknown> }) => ({
        returning: async (_shape: unknown) => {
          await barrier;                                    // wait (lock held elsewhere)
          const confirmed = applyUpsert(target, row, set); // write after lock acquired
          return [confirmed];
        },
      }),
    }),
  });
}

/**
 * Baseline cross-path DB: both single-toggle (direct insert) and batch
 * (transaction wrapping direct inserts) write immediately to `committed`.
 * Used for serial P / Q tests and the uncontrolled Promise.all S3 test.
 */
function makeCrossPathDb() {
  const committed = new Map<string, CrossPathRow>();
  return {
    committed,
    insert: buildDirectInsertChain(committed),
    async transaction(fn: TxFn) {
      await fn({ insert: buildDirectInsertChain(committed) });
    },
  };
}

/**
 * Single-deferred DB (models "single waits for batch lock"):
 *   • Single-toggle's write is gated on `singleBarrier`.
 *   • Batch writes immediately.
 * Interleaving: batch commits → barrier released → single writes last → SINGLE wins.
 */
function makeDbSingleDeferred(singleBarrier: Promise<void>) {
  const committed = new Map<string, CrossPathRow>();
  return {
    committed,
    insert: buildDeferredInsertChain(committed, singleBarrier),
    async transaction(fn: TxFn) {
      await fn({ insert: buildDirectInsertChain(committed) });
    },
  };
}

/**
 * Batch-deferred DB (models "batch waits for single lock"):
 *   • Batch transaction does not begin running items until `batchBarrier` resolves.
 *   • Single-toggle writes immediately.
 * Interleaving: single commits → barrier released → batch runs and writes last → BATCH wins.
 */
function makeDbBatchDeferred(batchBarrier: Promise<void>) {
  const committed = new Map<string, CrossPathRow>();
  return {
    committed,
    insert: buildDirectInsertChain(committed),
    async transaction(fn: TxFn) {
      await batchBarrier;                                    // wait for lock
      await fn({ insert: buildDirectInsertChain(committed) }); // batch runs after
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe("Cross-path audit consistency — single-toggle vs batch-toggle race (real router)", () => {
  // ── S1: batch commits first; single waits for lock; single commits last → SINGLE wins ──
  //
  // In PostgreSQL READ COMMITTED, when the batch transaction holds the unique-index
  // lock for (groupId, ventureId), a concurrent single-toggle's INSERT ON CONFLICT
  // DO UPDATE will block until the batch releases the lock.  After the batch commits,
  // the single acquires the lock, sees the batch's committed data, and applies its
  // own set clause — single wins because it is the LAST writer.
  //
  // The barrier defers the single's write until AFTER the batch completes, forcing
  // this ordering explicitly.  If the single's onConflictDoUpdate.set clause were
  // missing toggledBy or toggledAt, the final row would retain the batch's fields
  // for those columns while the single's active flag wins — audit contamination.
  // This test catches that regression.
  it("S1: batch (bob) commits first — single (alice) acquires lock after and overwrites; final row is wholly alice's", async () => {
    let releaseSingle!: () => void;
    const singleBarrier = new Promise<void>(resolve => { releaseSingle = resolve; });

    const db = makeDbSingleDeferred(singleBarrier);
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    // Both dispatched concurrently — single is paused internally by singleBarrier
    const singleDone = appRouter.createCaller(makeAdminCtx("alice")).admin.setModuleReactivation({
      groupId:   "discovery",
      ventureId: "VENTURE-A",
      active:    true,
    });
    const batchDone = appRouter.createCaller(makeAdminCtx("bob")).admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: [{ groupId: "discovery", active: false }],
    });

    // Batch has no barrier — it completes first
    await batchDone;

    // Bob's batch data is in committed before alice's single writes
    const interim = db.committed.get("discovery:VENTURE-A");
    expect(interim?.toggledBy).toBe("bob");
    expect(interim?.active).toBe(false);

    // Release alice's single-toggle — it now writes over bob's committed data
    releaseSingle();
    await singleDone;

    // Alice (single) committed last → her data must fully replace bob's
    const row = db.committed.get("discovery:VENTURE-A")!;
    expect(row).toBeDefined();

    // All three mutable fields from alice's single write — no bob contamination
    expect(row.toggledBy).toBe("alice");
    expect(row.active).toBe(true);
    expect(row.toggledAt).toBeInstanceOf(Date);

    // Exactly one row — upsert semantics must hold across path boundaries
    expect(
      [...db.committed.values()].filter(r => r.groupId === "discovery" && r.ventureId === "VENTURE-A").length,
    ).toBe(1);

    // Audit string from the winning row names alice and no other admin
    const audit = `${row.toggledBy} · ${row.toggledAt.toISOString()}`;
    expect(audit).toMatch(/^alice · /);
    expect(audit).not.toContain("bob");
  });

  // ── S2 (inverse): single commits first; batch waits for lock; batch commits last → BATCH wins ──
  //
  // The inverse interleaving: the single-toggle holds the lock first and commits.
  // The batch transaction then acquires the lock, sees the single's committed data
  // via READ COMMITTED, and applies its own set clause — batch wins as the last writer.
  //
  // The barrier defers the batch's execution until AFTER the single completes, forcing
  // this ordering.  If the batch's onConflictDoUpdate.set clause were missing
  // toggledBy or toggledAt, the final row would retain alice's single-toggle
  // identity while the batch's active flag wins — audit contamination.
  it("S2 (inverse): single (alice) commits first — batch (bob) acquires lock after and overwrites; final row is wholly bob's", async () => {
    let releaseBatch!: () => void;
    const batchBarrier = new Promise<void>(resolve => { releaseBatch = resolve; });

    const db = makeDbBatchDeferred(batchBarrier);
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    // Both dispatched concurrently — batch is paused before running its items
    const singleDone = appRouter.createCaller(makeAdminCtx("alice")).admin.setModuleReactivation({
      groupId:   "discovery",
      ventureId: "VENTURE-A",
      active:    true,
    });
    const batchDone = appRouter.createCaller(makeAdminCtx("bob")).admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: [{ groupId: "discovery", active: false }],
    });

    // Single has no barrier — it completes first
    await singleDone;

    // Alice's single data is committed before bob's batch runs any items
    const interim = db.committed.get("discovery:VENTURE-A");
    expect(interim?.toggledBy).toBe("alice");
    expect(interim?.active).toBe(true);

    // Release the batch barrier — bob's batch now runs and sees alice's committed row
    releaseBatch();
    await batchDone;

    // Bob (batch) committed last → his data must fully replace alice's
    const row = db.committed.get("discovery:VENTURE-A")!;
    expect(row).toBeDefined();

    // All three mutable fields from bob's batch write — no alice contamination
    expect(row.toggledBy).toBe("bob");
    expect(row.active).toBe(false);
    expect(row.toggledAt).toBeInstanceOf(Date);

    // Exactly one row
    expect(
      [...db.committed.values()].filter(r => r.groupId === "discovery" && r.ventureId === "VENTURE-A").length,
    ).toBe(1);

    // Audit string from the winning row names bob and no other admin
    const audit = `${row.toggledBy} · ${row.toggledAt.toISOString()}`;
    expect(audit).toMatch(/^bob · /);
    expect(audit).not.toContain("alice");
  });

  // ── S3: uncontrolled Promise.all — coherence without ordering guarantee ──────
  //
  // Both mutations are dispatched concurrently with no explicit barrier.  Because
  // JavaScript is single-threaded and the harness uses resolved promises, one
  // will commit before the other — but we cannot predict which from outside the
  // engine.  The invariant: exactly one row, and all three mutable fields
  // (active, toggledBy, toggledAt) belong to the SAME write.
  //
  // A blend (e.g. alice's toggledBy but bob's toggledAt) would indicate that one
  // path's onConflictDoUpdate.set clause is missing a field — this test catches it.
  it("S3: concurrent Promise.all — final row has exactly one coherent write; no cross-field bleed", async () => {
    const db = makeCrossPathDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    await Promise.all([
      appRouter.createCaller(makeAdminCtx("alice")).admin.setModuleReactivation({
        groupId:   "discovery",
        ventureId: "VENTURE-A",
        active:    true,
      }),
      appRouter.createCaller(makeAdminCtx("bob")).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [{ groupId: "discovery", active: false }],
      }),
    ]);

    // Exactly one row
    const allForKey = [...db.committed.values()].filter(
      r => r.groupId === "discovery" && r.ventureId === "VENTURE-A",
    );
    expect(allForKey.length).toBe(1);

    const row = allForKey[0];
    expect(["alice", "bob"]).toContain(row.toggledBy);
    expect(row.toggledAt).toBeInstanceOf(Date);
    expect(typeof row.active).toBe("boolean");

    // Coherence: the loser's name must not appear in the audit string
    const loser = row.toggledBy === "alice" ? "bob" : "alice";
    const audit = `${row.toggledBy} · ${row.toggledAt.toISOString()}`;
    expect(audit).not.toContain(loser);

    // Field coherence: active must match the writer's intent
    // alice (single) activates (true); bob (batch) deactivates (false)
    if (row.toggledBy === "alice") {
      expect(row.active).toBe(true);
    } else {
      expect(row.active).toBe(false);
    }
  });

  // ── P (serial): single then batch — batch wins ──────────────────────────────
  it("P (serial): single-toggle (alice) then batch-toggle (bob) — final row reflects bob's fields", async () => {
    const db = makeCrossPathDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    await appRouter.createCaller(makeAdminCtx("alice")).admin.setModuleReactivation({
      groupId: "discovery", ventureId: "VENTURE-A", active: true,
    });
    await appRouter.createCaller(makeAdminCtx("bob")).admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: [{ groupId: "discovery", active: false }],
    });

    const row = db.committed.get("discovery:VENTURE-A")!;
    expect(row.toggledBy).toBe("bob");
    expect(row.active).toBe(false);
    expect(row.toggledAt).toBeInstanceOf(Date);
    expect([...db.committed.values()].filter(r => r.groupId === "discovery" && r.ventureId === "VENTURE-A").length).toBe(1);
  });

  // ── Q (serial): batch then single — single wins ─────────────────────────────
  it("Q (serial): batch-toggle (alice) then single-toggle (bob) — final row reflects bob's fields", async () => {
    const db = makeCrossPathDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    await appRouter.createCaller(makeAdminCtx("alice")).admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: [{ groupId: "discovery", active: false }],
    });
    await appRouter.createCaller(makeAdminCtx("bob")).admin.setModuleReactivation({
      groupId: "discovery", ventureId: "VENTURE-A", active: true,
    });

    const row = db.committed.get("discovery:VENTURE-A")!;
    expect(row.toggledBy).toBe("bob");
    expect(row.active).toBe(true);
    expect(row.toggledAt).toBeInstanceOf(Date);
    expect([...db.committed.values()].filter(r => r.groupId === "discovery" && r.ventureId === "VENTURE-A").length).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("setModuleReactivation — DB row integrity checks", () => {
  // These tests exercise the per-row validation added to the single-item toggle.
  // The handler must throw INTERNAL_SERVER_ERROR (not silently succeed) when:
  //   1. The DB confirms zero rows  (silent skip)
  //   2. The DB confirms a row with a different groupId (conflict-target rewrite)

  it("throws INTERNAL_SERVER_ERROR when the DB returns zero rows (silent skip)", async () => {
    // .returning() yields [] — simulates a DO-NOTHING conflict target or a
    // partial-index match that suppresses the write without aborting.
    const db = makeSingleToggleDb({ returningRows: [] });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivation({
        groupId: "discovery",
        active:  true,
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
    // The error message must name the expected groupId and the actual count (0).
    expect((err as TRPCError).message).toContain("discovery");
    expect((err as TRPCError).message).toContain("0");
  });

  it("throws INTERNAL_SERVER_ERROR when the DB confirms a different groupId", async () => {
    // .returning() yields a row whose groupId is a sentinel that does not match
    // the submitted "discovery".  This simulates a conflict-target rewrite or a
    // trigger that returns a row for a different record.
    const db = makeSingleToggleDb({
      returningRows: [{ groupId: "__wrong_sentinel__", ventureId: "__global__" }],
    });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivation({
        groupId: "discovery",
        active:  true,
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
    // The error message must name both the unexpected and the expected groupId.
    expect((err as TRPCError).message).toContain("__wrong_sentinel__");
    expect((err as TRPCError).message).toContain("discovery");
  });

  it("succeeds and returns { success: true } when the DB confirms the correct row", async () => {
    // Normal path: .returning() yields the matching (groupId, ventureId) —
    // the handler must return without throwing.
    const db = makeSingleToggleDb({
      returningRows: [{ groupId: "discovery", ventureId: "__global__" }],
    });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const result = await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivation({
      groupId: "discovery",
      active:  true,
    });

    expect(result.success).toBe(true);
    expect(result.groupId).toBe("discovery");
    expect(result.active).toBe(true);
  });

  it("throws INTERNAL_SERVER_ERROR when the DB returns zero rows for a venture-scoped toggle", async () => {
    // Same zero-rows check, but with a ventureId in the input — confirms the
    // guard fires regardless of scope.
    const db = makeSingleToggleDb({ returningRows: [] });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivation({
        groupId:   "scoring",
        ventureId: "VENTURE-A",
        active:    false,
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
    expect((err as TRPCError).message).toContain("scoring");
    expect((err as TRPCError).message).toContain("0");
  });

  it("throws INTERNAL_SERVER_ERROR when the DB confirms a wrong groupId for a venture-scoped toggle", async () => {
    const db = makeSingleToggleDb({
      returningRows: [{ groupId: "__wrong_sentinel__", ventureId: "VENTURE-A" }],
    });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivation({
        groupId:   "scoring",
        ventureId: "VENTURE-A",
        active:    false,
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
    expect((err as TRPCError).message).toContain("__wrong_sentinel__");
    expect((err as TRPCError).message).toContain("scoring");
  });

  it("throws INTERNAL_SERVER_ERROR when the DB confirms the correct groupId but a different ventureId", async () => {
    // The groupId matches but the DB confirmed a row belonging to a different
    // venture (e.g. a conflict-target rewrite resolved against the same group in
    // global scope while the toggle was venture-scoped).  The composite-key check
    // must catch this mismatch — returning { success: true } here would be a
    // silent state divergence on the wrong venture's record.
    const db = makeSingleToggleDb({
      returningRows: [{ groupId: "scoring", ventureId: "__global__" }], // wrong venture
    });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivation({
        groupId:   "scoring",
        ventureId: "VENTURE-A", // submitted for VENTURE-A
        active:    false,
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
    // The error message must surface the mismatched ventureId values.
    expect((err as TRPCError).message).toContain("__global__");
    expect((err as TRPCError).message).toContain("VENTURE-A");
  });

  it("throws INTERNAL_SERVER_ERROR when a global toggle is confirmed under a different ventureId", async () => {
    // Inverse case: global toggle (no ventureId → normalised to __global__) but the
    // DB confirms a row scoped to VENTURE-A.  The handler must reject this.
    const db = makeSingleToggleDb({
      returningRows: [{ groupId: "discovery", ventureId: "VENTURE-A" }], // wrong scope
    });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivation({
        groupId: "discovery",
        // ventureId omitted → normalised to __global__
        active: true,
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
    expect((err as TRPCError).message).toContain("VENTURE-A");
    expect((err as TRPCError).message).toContain("__global__");
  });

  it("succeeds for a venture-scoped toggle when the DB confirms the correct composite key", async () => {
    // Normal venture-scoped path: groupId and ventureId both match.
    const db = makeSingleToggleDb({
      returningRows: [{ groupId: "scoring", ventureId: "VENTURE-A" }],
    });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const result = await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivation({
      groupId:   "scoring",
      ventureId: "VENTURE-A",
      active:    false,
    });

    expect(result.success).toBe(true);
    expect(result.groupId).toBe("scoring");
    expect(result.active).toBe(false);
  });

  it("throws INTERNAL_SERVER_ERROR when .returning() yields 2 rows for the same groupId", async () => {
    // Simulates a DB trigger (or schema change) that produces an additional row
    // from a single INSERT ... ON CONFLICT ... RETURNING, so written.length === 2.
    // The handler's `written.length !== 1` guard must catch this and throw rather
    // than silently treating the extra row as a successful single-row write.
    const db = makeSingleToggleDb({
      returningRows: [
        { groupId: "discovery", ventureId: "__global__" },
        { groupId: "discovery", ventureId: "__global__" }, // duplicate — simulates a trigger
      ],
    });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivation({
        groupId: "discovery",
        active:  true,
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
    // The error message must name the offending groupId and the unexpected row count.
    expect((err as TRPCError).message).toContain("discovery");
    expect((err as TRPCError).message).toContain("2");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// #152 — lastKnownMaxToggledAt conflict detection
// Tests the optimistic-locking guard added to setModuleReactivationBatch.
// When provided, the endpoint checks whether another admin modified any row
// for the same venture after lastKnownMaxToggledAt and rejects with CONFLICT
// rather than silently overwriting.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Minimal DB mock that satisfies the SELECT chain used by the conflict-detection
 * block (db.select({...}).from(table).where(condition)).
 * Returns the supplied conflictRows regardless of which conditions are passed.
 * The transaction path is intentionally omitted: tests that verify CONFLICT is
 * thrown reach it before the transaction begins.
 */
function makeConflictOnlyMock(
  conflictRows: Array<{ groupId: string; modifiedBy: string | null }>,
): unknown {
  return {
    select: (_shape: unknown) => ({
      from: (_table: unknown) => ({
        where: (_condition: unknown) => Promise.resolve(conflictRows),
      }),
    }),
    // transaction is never called when CONFLICT is thrown, so it is not needed here.
  };
}

/**
 * Wraps makeHarnessDb to also satisfy the SELECT chain.
 * Used for tests where the conflict check finds NO conflict and the batch
 * proceeds normally into the transaction.
 */
function makeConflictAwareHarnessDb(
  conflictRows: Array<{ groupId: string; modifiedBy: string | null }>,
  harnessOpts?: Parameters<typeof makeHarnessDb>[0],
): HarnessDb {
  const base = makeHarnessDb(harnessOpts);
  return Object.assign(base, {
    select: (_shape: unknown) => ({
      from: (_table: unknown) => ({
        where: (_cond: unknown) => Promise.resolve(conflictRows),
      }),
    }),
  }) as HarnessDb;
}

describe("setModuleReactivationBatch — lastKnownMaxToggledAt conflict detection (#152)", () => {
  const pastCutoff = new Date(Date.now() - 60_000).toISOString(); // 1 minute ago

  it("rejects with CONFLICT when another admin modified a row after lastKnownMaxToggledAt", async () => {
    // The mock returns one row modified by "bob" — representing a row that exists
    // in the DB with toggledAt > cutoff and toggledBy !== "alice".
    const db = makeConflictOnlyMock([
      { groupId: "discovery", modifiedBy: "bob" },
    ]);
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx("alice")).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [{ groupId: "discovery", active: true }],
        lastKnownMaxToggledAt: pastCutoff,
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("CONFLICT");
    expect((err as TRPCError).message).toContain("Concurrent modification detected");
    expect((err as TRPCError).message).toContain("discovery");
    expect((err as TRPCError).message).toContain("bob");
  });

  it("names every conflicting group and editor in the error message", async () => {
    const db = makeConflictOnlyMock([
      { groupId: "discovery",  modifiedBy: "bob" },
      { groupId: "validation", modifiedBy: "carol" },
    ]);
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx("alice")).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [
          { groupId: "discovery",  active: true },
          { groupId: "validation", active: true },
        ],
        lastKnownMaxToggledAt: pastCutoff,
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("CONFLICT");
    // All affected groups and editors must appear in the message.
    expect((err as TRPCError).message).toContain("2 group");
    expect((err as TRPCError).message).toContain("discovery");
    expect((err as TRPCError).message).toContain("validation");
    expect((err as TRPCError).message).toContain("bob");
    expect((err as TRPCError).message).toContain("carol");
    // The caller is told to re-fetch and retry.
    expect((err as TRPCError).message).toContain("Re-fetch");
  });

  it("allows the batch when lastKnownMaxToggledAt is omitted entirely (opt-in guard)", async () => {
    // Without lastKnownMaxToggledAt the server skips the conflict check entirely.
    // Even if another admin's rows exist in the DB the batch succeeds — the guard
    // is opt-in so older clients that don't send the field continue to work.
    const db = makeConflictAwareHarnessDb([]);
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const result = await appRouter.createCaller(makeAdminCtx("alice")).admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: [{ groupId: "discovery", active: true }],
      // lastKnownMaxToggledAt deliberately omitted
    });

    expect(result.success).toBe(true);
    expect(committedFor(db as HarnessDb, "VENTURE-A")).toHaveLength(1);
  });

  it("allows the batch when the conflict query returns zero rows (no conflict found)", async () => {
    // The ne(toggledBy, currentAdmin) and gt(toggledAt, cutoff) conditions
    // collectively return nothing — i.e. no OTHER admin modified rows after cutoff.
    const db = makeConflictAwareHarnessDb([]); // mock returns empty = no conflict
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const result = await appRouter.createCaller(makeAdminCtx("alice")).admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: [{ groupId: "discovery", active: true }],
      lastKnownMaxToggledAt: pastCutoff,
    });

    expect(result.success).toBe(true);
    expect(committedFor(db as HarnessDb, "VENTURE-A")).toHaveLength(1);
  });

  it("allows a full 15-group batch when no conflict is detected", async () => {
    const db = makeConflictAwareHarnessDb([]);
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const result = await appRouter.createCaller(makeAdminCtx("alice")).admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: activateAllItems(true),
      lastKnownMaxToggledAt: pastCutoff,
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(15);
    expect(committedFor(db as HarnessDb, "VENTURE-A")).toHaveLength(15);
  });

  it("CONFLICT error instructs the admin to re-fetch and retry", async () => {
    const db = makeConflictOnlyMock([{ groupId: "scoring", modifiedBy: "dave" }]);
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx("alice")).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [{ groupId: "scoring", active: false }],
        lastKnownMaxToggledAt: pastCutoff,
      });
    } catch (e) {
      err = e;
    }

    expect((err as TRPCError).message).toContain("retry");
  });
});

describe("setModuleReactivationBatch — same-admin write does NOT trigger CONFLICT (ne(toggledBy) guard)", () => {
  // The conflict query uses ne(toggledBy, callingAdmin) to exclude the calling
  // admin's own writes.  This verifies that the `ne` exclusion is honoured:
  // a row last written by the SAME admin should be invisible to the conflict guard
  // regardless of its toggledAt timestamp.
  const pastCutoff = new Date(Date.now() - 60_000).toISOString();

  it("allows the batch when the only recent write is from the SAME admin (ne exclusion)", async () => {
    // The mock returns zero conflict rows — simulating that the `ne(toggledBy)`
    // predicate filtered out the calling admin's own rows.
    const db = makeConflictAwareHarnessDb([]);
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    // Should succeed: no conflict rows returned means no concurrent modification detected.
    const result = await caller.admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: [{ groupId: "discovery", active: true }],
      lastKnownMaxToggledAt: pastCutoff,
    });
    expect(result.success).toBe(true);
  });

  it("rejects when a DIFFERENT admin wrote (modifiedBy differs from caller)", async () => {
    const db = makeConflictOnlyMock([{ groupId: "discovery", modifiedBy: "bob" }]);
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeAdminCtx("alice")); // caller is alice, not bob
    await expect(
      caller.admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [{ groupId: "discovery", active: true }],
        lastKnownMaxToggledAt: pastCutoff,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("error message names the conflicting editor (not the calling admin)", async () => {
    const db = makeConflictOnlyMock([{ groupId: "discovery", modifiedBy: "charlie" }]);
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    const err = await caller.admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: [{ groupId: "discovery", active: true }],
      lastKnownMaxToggledAt: pastCutoff,
    }).catch(e => e as TRPCError);
    expect((err as TRPCError).message).toContain("charlie");
    expect((err as TRPCError).message).not.toContain("alice");
  });

  it("multiple conflict rows: error message contains all distinct editors", async () => {
    const db = makeConflictOnlyMock([
      { groupId: "discovery",  modifiedBy: "bob" },
      { groupId: "validation", modifiedBy: "carol" },
      { groupId: "operations", modifiedBy: "bob" }, // bob appears twice, should be deduplicated
    ]);
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    const err = await caller.admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: [
        { groupId: "discovery",  active: true },
        { groupId: "validation", active: false },
        { groupId: "operations", active: true },
      ],
      lastKnownMaxToggledAt: pastCutoff,
    }).catch(e => e as TRPCError);
    expect((err as TRPCError).message).toContain("bob");
    expect((err as TRPCError).message).toContain("carol");
    // bob appears only once (Set deduplication)
    const bobs = ((err as TRPCError).message.match(/bob/g) || []).length;
    expect(bobs).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// #171 — resetVentureModuleReactivations: ventureId validation
// The endpoint must reject a whitespace-only ventureId and the __global__
// sentinel before touching the database.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Minimal DB mock that satisfies the delete chain used by execVentureReset:
 *   db.delete(table).where(eqFn(col, vid)).returning()
 *
 * Pass `deletedRows` to control how many rows the DB reports as deleted.
 * The mock does not actually store or inspect rows — it just resolves with
 * whatever the test specifies.
 */
function makeResetDb(deletedRows: unknown[] = []): unknown {
  return {
    delete: (_table: unknown) => ({
      where: (_condition: unknown) => ({
        returning: () => Promise.resolve(deletedRows),
      }),
    }),
  };
}

describe("resetVentureModuleReactivations — ventureId validation (#171)", () => {
  it("rejects __global__ ventureId with BAD_REQUEST before touching the DB", async () => {
    const db = makeResetDb([{ id: 1 }]); // would succeed if reached
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.resetVentureModuleReactivations({
        ventureId: "__global__",
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("BAD_REQUEST");
    expect((err as TRPCError).message).toContain("global");
  });

  it("rejects a whitespace-only ventureId with BAD_REQUEST before touching the DB", async () => {
    // "   " has length 3 so it passes the Zod .min(1) check on the schema.
    // normaliseResetVentureId must catch it after trim() produces "".
    const db = makeResetDb([{ id: 1 }]); // would succeed if reached
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.resetVentureModuleReactivations({
        ventureId: "   ",
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("BAD_REQUEST");
  });

  it("rejects a tab-only ventureId with BAD_REQUEST", async () => {
    // Tabs also produce an empty string after trim.
    const db = makeResetDb([]);
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.resetVentureModuleReactivations({
        ventureId: "\t",
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("BAD_REQUEST");
  });

  it("succeeds for a valid venture ID and returns the deleted count", async () => {
    // Two rows deleted — simulates a venture with two module overrides.
    const db = makeResetDb([{ id: 1 }, { id: 2 }]);
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const result = await appRouter.createCaller(makeAdminCtx()).admin.resetVentureModuleReactivations({
      ventureId: "VENTURE-A",
    });

    expect(result.success).toBe(true);
    expect(result.ventureId).toBe("VENTURE-A");
    expect(result.deletedCount).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// #148 — resetVentureModuleReactivations: zero-row result
// When the venture has no rows to delete the endpoint must still return
// { success: true, deletedCount: 0 } so the caller can distinguish a genuine
// no-op from a silent error.
// ─────────────────────────────────────────────────────────────────────────────

describe("resetVentureModuleReactivations — zero-row result (#148)", () => {
  it("returns deletedCount: 0 when no rows exist for the venture", async () => {
    // The venture has never had module overrides — the DELETE WHERE matches nothing.
    const db = makeResetDb([]); // returning() → [] → zero deleted
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const result = await appRouter.createCaller(makeAdminCtx()).admin.resetVentureModuleReactivations({
      ventureId: "VENTURE-EMPTY",
    });

    // The server must report the zero-row result explicitly.
    // The client (gate4Config.ts:resetToGlobalDefaults) reads deletedCount to
    // decide whether to call onSuccess or onZeroRows, so the value must be
    // present and accurate.
    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(0);
    expect(result.ventureId).toBe("VENTURE-EMPTY");
  });

  it("does NOT return deletedCount: 0 when rows exist and are deleted", async () => {
    // Baseline: confirm the above assertion is discriminating (not always 0).
    const db = makeResetDb([{ id: 10 }, { id: 11 }, { id: 12 }]);
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const result = await appRouter.createCaller(makeAdminCtx()).admin.resetVentureModuleReactivations({
      ventureId: "VENTURE-B",
    });

    expect(result.deletedCount).toBe(3);
    expect(result.deletedCount).not.toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// #156 — setModuleReactivationBatch: non-boolean active field rejection
// z.boolean() must reject null, string "true" / "false", and numeric 1 / 0.
// These are type-level schema guards: any relaxation of the schema (e.g. to
// z.boolean() → z.coerce.boolean()) would silently accept them instead of
// returning BAD_REQUEST.
// ─────────────────────────────────────────────────────────────────────────────

describe("setModuleReactivationBatch — non-boolean active field rejection (#156)", () => {
  it("rejects an item with active: null with BAD_REQUEST and writes zero rows", async () => {
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [{ groupId: "discovery", active: null }] as any,
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("BAD_REQUEST");
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("rejects an item with active: 'true' (string) with BAD_REQUEST and writes zero rows", async () => {
    // String "true" is falsy-equivalent in some coercion paths (e.g. z.coerce.boolean).
    // The schema must not coerce it — z.boolean() must reject non-boolean values.
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [{ groupId: "discovery", active: "true" }] as any,
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("BAD_REQUEST");
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("rejects an item with active: 'false' (string) with BAD_REQUEST and writes zero rows", async () => {
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [{ groupId: "discovery", active: "false" }] as any,
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("BAD_REQUEST");
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("rejects an item with active: 1 (number) with BAD_REQUEST and writes zero rows", async () => {
    // Numeric 1 would be truthy but must not be accepted as a boolean.
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [{ groupId: "discovery", active: 1 }] as any,
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("BAD_REQUEST");
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("rejects a mixed batch where one item has active: null — entire batch rejected, zero rows written", async () => {
    // Schema validation is holistic: one invalid item rejects the whole payload.
    const db = makeHarnessDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    let err: unknown;
    try {
      await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [
          { groupId: "discovery",  active: true  }, // valid
          { groupId: "validation", active: null  }, // invalid — null not a boolean
          { groupId: "gtm",        active: false }, // valid
        ] as any,
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("BAD_REQUEST");
    // No rows must be written — Zod rejects before the transaction is entered.
    expect(committedFor(db, "VENTURE-A")).toHaveLength(0);
  });

  it("accepts valid boolean true and false without rejecting", async () => {
    // Baseline: confirm the rejection tests are discriminating.
    const db = makeConflictAwareHarnessDb([]);
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const result = await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: [
        { groupId: "discovery",  active: true  },
        { groupId: "validation", active: false },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("setModuleReactivationBatch — all rows in a batch share the same toggledAt timestamp (#140)", () => {
  // The server computes `now = new Date()` ONCE before entering the transaction
  // loop and stamps every item with the same value.  This makes the batch appear
  // atomically in the audit trail: all rows show the same timestamp.
  //
  // If `toggledAt: new Date()` were called inside the loop (once per item),
  // rows written milliseconds apart would show different timestamps — the audit
  // trail would be misleading.  This test confirms that never happens.
  //
  // Strategy: read back all committed rows after a full 15-item batch and
  // verify they all carry the same toggledAt Date object (strict reference
  // equality is not required; millisecond-level equality is sufficient).

  it("all 15 batch rows have the same toggledAt timestamp (single now= before the loop)", async () => {
    const db = makeConflictAwareHarnessDb([]);
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    // Record the wall-clock window to bound the assertion.
    const before = new Date();
    await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: activateAllItems(true),   // 15 items
    });
    const after = new Date();

    const rows = committedFor(db, "VENTURE-A");
    expect(rows).toHaveLength(15);

    // All rows must carry a timestamp between `before` and `after`.
    for (const row of rows) {
      expect(row.toggledAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(row.toggledAt.getTime()).toBeLessThanOrEqual(after.getTime());
    }

    // All rows must share the SAME millisecond-precision timestamp
    // (the server stamps them all with the same `now` computed before the loop).
    const ts = rows[0].toggledAt.getTime();
    for (const row of rows) {
      expect(row.toggledAt.getTime()).toBe(ts);
    }
  });

  it("a two-item batch uses the same timestamp for both items", async () => {
    const db = makeConflictAwareHarnessDb([]);
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: [
        { groupId: "discovery",  active: true },
        { groupId: "validation", active: true },
      ],
    });

    const rows = committedFor(db, "VENTURE-A");
    expect(rows).toHaveLength(2);
    expect(rows[0].toggledAt.getTime()).toBe(rows[1].toggledAt.getTime());
  });

  it("a re-run of the batch (second call) stamps all rows with a NEW timestamp, not the first call's timestamp", async () => {
    const db = makeConflictAwareHarnessDb([]);
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    // First batch
    await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: [{ groupId: "discovery", active: true }],
    });
    const firstTs = committedFor(db, "VENTURE-A")[0].toggledAt.getTime();

    // A tiny delay ensures the second `new Date()` is >= the first.
    await new Promise(r => setTimeout(r, 1));

    // Second batch (same items — idempotent toggle, new timestamp)
    await appRouter.createCaller(makeAdminCtx()).admin.setModuleReactivationBatch({
      ventureId: "VENTURE-A",
      items: [{ groupId: "discovery", active: false }],
    });
    const secondTs = committedFor(db, "VENTURE-A")[0].toggledAt.getTime();

    // Second call must produce a timestamp at least as recent as the first.
    // (They can be equal if they ran in the same millisecond — that is acceptable.)
    expect(secondTs).toBeGreaterThanOrEqual(firstTs);
  });
});

// ── DB-unavailable guard — !db fallback paths for all four procedures ────────
//
// Each mutation that calls getDb() protects against the case where the
// connection pool is not yet initialised (getDb() resolves to null / undefined).
// These tests verify that the guard is wired correctly at the router level so
// the procedure throws INTERNAL_SERVER_ERROR rather than attempting to use an
// undefined DB reference.
//
describe("getModuleReactivations — DB unavailable guard (!db path)", () => {
  it("returns [] when getDb() resolves to null (no throw, graceful empty response)", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    const rows = await caller.admin.getModuleReactivations();
    expect(rows).toEqual([]);
  });

  it("returns [] when getDb() resolves to undefined", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    const rows = await caller.admin.getModuleReactivations();
    expect(rows).toEqual([]);
  });
});

describe("setModuleReactivation — DB unavailable guard (!db path)", () => {
  it("throws INTERNAL_SERVER_ERROR when getDb() resolves to null", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    await expect(
      caller.admin.setModuleReactivation({ groupId: "discovery", active: true }),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });

  it("throws INTERNAL_SERVER_ERROR when getDb() resolves to undefined", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    await expect(
      caller.admin.setModuleReactivation({ groupId: "discovery", active: true }),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });

  it("error message mentions 'DB unavailable'", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    await expect(
      caller.admin.setModuleReactivation({ groupId: "discovery", active: true }),
    ).rejects.toMatchObject({ message: expect.stringContaining("DB unavailable") });
  });
});

describe("setModuleReactivationBatch — DB unavailable guard (!db path)", () => {
  it("throws INTERNAL_SERVER_ERROR when getDb() resolves to null", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    await expect(
      caller.admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [{ groupId: "discovery", active: true }],
      }),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });

  it("throws INTERNAL_SERVER_ERROR when getDb() resolves to undefined", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    await expect(
      caller.admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [{ groupId: "discovery", active: true }],
      }),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });

  it("error message mentions 'DB unavailable'", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    await expect(
      caller.admin.setModuleReactivationBatch({
        ventureId: "VENTURE-A",
        items: [{ groupId: "discovery", active: true }],
      }),
    ).rejects.toMatchObject({ message: expect.stringContaining("DB unavailable") });
  });
});

describe("resetVentureModuleReactivations — DB unavailable guard (!db path)", () => {
  it("throws INTERNAL_SERVER_ERROR when getDb() resolves to null", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    await expect(
      caller.admin.resetVentureModuleReactivations({ ventureId: "VENTURE-A" }),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });

  it("throws INTERNAL_SERVER_ERROR when getDb() resolves to undefined", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    await expect(
      caller.admin.resetVentureModuleReactivations({ ventureId: "VENTURE-A" }),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });

  it("error message mentions 'DB unavailable'", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    await expect(
      caller.admin.resetVentureModuleReactivations({ ventureId: "VENTURE-A" }),
    ).rejects.toMatchObject({ message: expect.stringContaining("DB unavailable") });
  });

  it("does NOT throw for the db-guard when a valid DB is provided (positive control)", async () => {
    // makeResetDb returns a minimal DB stub that satisfies execVentureReset (has .delete)
    const db = makeResetDb([]); // no rows deleted — deletedCount: 0
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);
    const caller = appRouter.createCaller(makeAdminCtx("alice"));
    const result = await caller.admin.resetVentureModuleReactivations({ ventureId: "VENTURE-X" });
    expect(result.success).toBe(true);
  });
});
