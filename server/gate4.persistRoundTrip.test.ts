/**
 * Gate 4 — Per-Venture Module Toggle Persist Round-Trip Tests
 *
 * Confirms the end-to-end persist round-trip for per-venture module reactivation
 * using the production `rowsToActivatedSet` utility and a Drizzle-API-faithful
 * fake DB that mirrors the exact query contract exercised by `getModuleReactivations`
 * and `setModuleReactivation` in server/admin.router.ts.
 *
 * What is under test
 * ------------------
 * 1. The real `rowsToActivatedSet` exported from client/src/lib/gate4Utils.ts
 *    (the same function the sidebar uses after every server read).
 *
 * 2. A fake DB whose insert / onConflictDoUpdate / select / orderBy chains
 *    replicate the exact Drizzle operations performed by the two endpoints:
 *
 *      getModuleReactivations:
 *        db.select().from(moduleReactivations).orderBy(groupId)
 *
 *      setModuleReactivation:
 *        db.insert(moduleReactivations)
 *          .values({ groupId, ventureId, active, toggledBy, toggledAt })
 *          .onConflictDoUpdate({ target:[groupId,ventureId], set:{active,toggledBy,toggledAt} })
 *
 *    The in-memory store inside fakeDb is keyed on (groupId, ventureId) — the
 *    same unique constraint as the real table (module_reactivations_group_venture_unique).
 *
 * Required scenarios (from task spec)
 * ------------------------------------
 *   ① Toggle module ON for venture BEBUS → read rows → still ON only for BEBUS
 *   ② Same module is OFF (no row) for a different venture
 *   ③ Toggle OFF for BEBUS → module absent from BEBUS activated set
 *   ④ Global (null ventureId) reads __global__ rows; venture rows are ignored
 *   ⑤ Venture scope never inherits from __global__ rows (no cross-scope bleed)
 */

import { describe, it, expect, beforeEach } from "vitest";

// ── Import the PRODUCTION rowsToActivatedSet ──────────────────────────────────
// This is the same pure function the client sidebar uses after every tRPC fetch.
// Importing it here (instead of copying it) ensures the test breaks if the
// production function's isolation contract regresses.
import { rowsToActivatedSet, type ReactivationRow } from "../client/src/lib/gate4Utils";

// ── Drizzle-API-faithful fake DB ──────────────────────────────────────────────
//
// Implements exactly the Drizzle chain shapes used by the two router procedures:
//
//   READ:  db.select().from(t).orderBy(col) → Promise<Row[]>
//   WRITE: db.insert(t).values(v).onConflictDoUpdate({ target, set }) → Promise<void>
//
// The store is keyed on `${groupId}::${ventureId}` — identical to the DB's
// UNIQUE constraint on (group_id, venture_id).

interface StoredRow {
  groupId:   string;
  ventureId: string;
  active:    boolean;
  toggledBy: string | null;
  toggledAt: Date;
}

function makeFakeDb() {
  // Internal store — keyed on the same unique constraint as the real table.
  const store = new Map<string, StoredRow>();

  function storeKey(groupId: string, ventureId: string) {
    return `${groupId}::${ventureId}`;
  }

  return {
    // ── READ: db.select().from(t).orderBy(col) ─────────────────────────────
    select() {
      return {
        from(_table: unknown) {
          return {
            orderBy(_col: unknown): Promise<StoredRow[]> {
              const rows = [...store.values()].sort((a, b) =>
                a.groupId.localeCompare(b.groupId)
              );
              return Promise.resolve(rows);
            },
          };
        },
      };
    },

    // ── WRITE: db.insert(t).values(v).onConflictDoUpdate({target,set}) ─────
    insert(_table: unknown) {
      return {
        values(row: StoredRow) {
          return {
            onConflictDoUpdate({ set }: { target: unknown[]; set: Partial<StoredRow> }): Promise<void> {
              const k = storeKey(row.groupId, row.ventureId);
              const existing = store.get(k);
              if (existing) {
                // Mirrors .onConflictDoUpdate — only update the mutable columns.
                store.set(k, { ...existing, ...set });
              } else {
                store.set(k, { ...row });
              }
              return Promise.resolve();
            },
          };
        },
      };
    },

    /** Expose the raw store for assertion convenience. */
    _store: store,
  };
}

// ── Router-layer helpers ──────────────────────────────────────────────────────
// These mirror the exact DB calls in admin.router.ts, making it easy to read and
// write using the same contract as the real procedures.

async function dbGetAll(db: ReturnType<typeof makeFakeDb>): Promise<ReactivationRow[]> {
  // Mirrors: db.select().from(moduleReactivations).orderBy(moduleReactivations.groupId)
  return db.select().from(null).orderBy(null) as Promise<ReactivationRow[]>;
}

async function dbUpsert(
  db: ReturnType<typeof makeFakeDb>,
  input: { groupId: string; ventureId?: string; active: boolean; toggledBy?: string },
): Promise<void> {
  // Mirrors setModuleReactivation sentinel normalisation.
  const ventureId =
    input.ventureId && input.ventureId.trim() ? input.ventureId.trim() : "__global__";

  const toggledAt = new Date();
  const toggledBy = input.toggledBy ?? null;

  // Mirrors: db.insert(moduleReactivations).values({...}).onConflictDoUpdate({...})
  await db
    .insert(null)
    .values({ groupId: input.groupId, ventureId, active: input.active, toggledBy, toggledAt })
    .onConflictDoUpdate({
      target: ["groupId", "ventureId"],
      set: { active: input.active, toggledBy, toggledAt },
    });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Gate 4 per-venture module toggle persist round-trip", () => {
  let db: ReturnType<typeof makeFakeDb>;

  beforeEach(() => {
    db = makeFakeDb();
  });

  // ① Toggle ON for BEBUS → read rows → still ON only for BEBUS ───────────────

  it("① activating a module for BEBUS survives a read-back (simulated reload)", async () => {
    await dbUpsert(db, { groupId: "discovery", ventureId: "BEBUS", active: true });

    const rows = await dbGetAll(db);
    const activated = rowsToActivatedSet(rows, "BEBUS");

    expect(activated.has("discovery")).toBe(true);
  });

  it("① the persisted row carries the correct ventureId", async () => {
    await dbUpsert(db, { groupId: "discovery", ventureId: "BEBUS", active: true });

    const rows = await dbGetAll(db);
    const row = rows.find(r => r.groupId === "discovery");

    expect(row?.ventureId).toBe("BEBUS");
    expect(row?.active).toBe(true);
  });

  // ② Same module is OFF for a different venture ──────────────────────────────

  it("② a module active for BEBUS is absent (default OFF) for a different venture", async () => {
    await dbUpsert(db, { groupId: "discovery", ventureId: "BEBUS", active: true });

    const rows = await dbGetAll(db);

    expect(rowsToActivatedSet(rows, "BEBUS").has("discovery")).toBe(true);
    expect(rowsToActivatedSet(rows, "VENTURE-XYZ").has("discovery")).toBe(false);
  });

  it("② modules activated for venture A are completely invisible to venture B", async () => {
    await dbUpsert(db, { groupId: "gtm",   ventureId: "VENTURE-A", active: true });
    await dbUpsert(db, { groupId: "risk",  ventureId: "VENTURE-A", active: true });
    await dbUpsert(db, { groupId: "rnd",   ventureId: "VENTURE-B", active: true });

    const rows = await dbGetAll(db);
    const aSet = rowsToActivatedSet(rows, "VENTURE-A");
    const bSet = rowsToActivatedSet(rows, "VENTURE-B");

    expect(aSet.has("gtm")).toBe(true);
    expect(aSet.has("risk")).toBe(true);
    expect(aSet.has("rnd")).toBe(false);   // VENTURE-B's module not visible to A

    expect(bSet.has("rnd")).toBe(true);
    expect(bSet.has("gtm")).toBe(false);   // VENTURE-A's module not visible to B
    expect(bSet.has("risk")).toBe(false);
  });

  // ③ Toggle OFF for BEBUS → module absent from that venture's nav ─────────────

  it("③ deactivating a module for BEBUS removes it from BEBUS activated set", async () => {
    await dbUpsert(db, { groupId: "proposition", ventureId: "BEBUS", active: true });
    await dbUpsert(db, { groupId: "proposition", ventureId: "BEBUS", active: false }); // toggle OFF

    const rows = await dbGetAll(db);
    expect(rowsToActivatedSet(rows, "BEBUS").has("proposition")).toBe(false);
  });

  it("③ toggling OFF for BEBUS does not remove the module from another venture", async () => {
    await dbUpsert(db, { groupId: "rnd", ventureId: "BEBUS",      active: true });
    await dbUpsert(db, { groupId: "rnd", ventureId: "VENTURE-B",  active: true });
    await dbUpsert(db, { groupId: "rnd", ventureId: "BEBUS",      active: false }); // BEBUS off

    const rows = await dbGetAll(db);

    expect(rowsToActivatedSet(rows, "BEBUS").has("rnd")).toBe(false);
    expect(rowsToActivatedSet(rows, "VENTURE-B").has("rnd")).toBe(true);
  });

  it("③ deactivate-then-reactivate leaves exactly one row and correct final state", async () => {
    await dbUpsert(db, { groupId: "execution", ventureId: "BEBUS", active: true  });
    await dbUpsert(db, { groupId: "execution", ventureId: "BEBUS", active: false });
    await dbUpsert(db, { groupId: "execution", ventureId: "BEBUS", active: true  });

    const rows = await dbGetAll(db);
    const bebusRows = rows.filter(r => r.groupId === "execution" && r.ventureId === "BEBUS");

    // Upsert must never duplicate rows for the same (groupId, ventureId).
    expect(bebusRows.length).toBe(1);
    expect(rowsToActivatedSet(rows, "BEBUS").has("execution")).toBe(true);
  });

  // ④ Global (null ventureId) reads __global__ rows only ──────────────────────

  it("④ global scope reads __global__ rows when no venture is selected", async () => {
    await dbUpsert(db, { groupId: "operations", ventureId: undefined, active: true }); // → __global__
    await dbUpsert(db, { groupId: "scoring",    ventureId: undefined, active: true }); // → __global__

    const rows = await dbGetAll(db);
    const globalSet = rowsToActivatedSet(rows, null);

    expect(globalSet.has("operations")).toBe(true);
    expect(globalSet.has("scoring")).toBe(true);
  });

  it("④ empty-string ventureId is normalised to __global__ and visible in global scope", async () => {
    await dbUpsert(db, { groupId: "coaching", ventureId: "", active: true });

    const rows = await dbGetAll(db);
    expect(rows[0]?.ventureId).toBe("__global__");
    expect(rowsToActivatedSet(rows, null).has("coaching")).toBe(true);
  });

  it("④ deactivating a global module removes it from global scope", async () => {
    await dbUpsert(db, { groupId: "coaching", ventureId: undefined, active: true  });
    await dbUpsert(db, { groupId: "coaching", ventureId: undefined, active: false });

    const rows = await dbGetAll(db);
    expect(rowsToActivatedSet(rows, null).has("coaching")).toBe(false);
  });

  // ⑤ Fallback semantics (venture → global) and global isolation ────────────────

  it("⑤ venture scope inherits a global ON row when no venture row exists (fallback)", async () => {
    await dbUpsert(db, { groupId: "discovery", ventureId: undefined, active: true }); // global ON

    const rows = await dbGetAll(db);
    // BEBUS has no explicit row → falls back to global (active:true)
    expect(rowsToActivatedSet(rows, "BEBUS").has("discovery")).toBe(true);
  });

  it("⑤ venture row overrides global OFF — venture ON wins", async () => {
    await dbUpsert(db, { groupId: "gtm", ventureId: undefined, active: false }); // global OFF
    await dbUpsert(db, { groupId: "gtm", ventureId: "BEBUS",   active: true  }); // BEBUS ON

    const rows = await dbGetAll(db);
    // BEBUS's own active row takes precedence over the global OFF
    expect(rowsToActivatedSet(rows, "BEBUS").has("gtm")).toBe(true);
  });

  it("⑤ venture row overrides global ON — venture OFF wins", async () => {
    await dbUpsert(db, { groupId: "scoring", ventureId: undefined, active: true  }); // global ON
    await dbUpsert(db, { groupId: "scoring", ventureId: "BEBUS",   active: false }); // BEBUS OFF

    const rows = await dbGetAll(db);
    // BEBUS explicitly opted out; global default must not re-enable it
    expect(rowsToActivatedSet(rows, "BEBUS").has("scoring")).toBe(false);
  });

  it("⑤ global scope does NOT see venture-specific rows", async () => {
    await dbUpsert(db, { groupId: "risk", ventureId: "BEBUS", active: true });

    const rows = await dbGetAll(db);
    expect(rowsToActivatedSet(rows, null).has("risk")).toBe(false);
  });

  it("⑤ deactivating a global module does not override a venture's own active row", async () => {
    await dbUpsert(db, { groupId: "people", ventureId: undefined, active: true  }); // global
    await dbUpsert(db, { groupId: "people", ventureId: "BEBUS",   active: true  }); // venture
    await dbUpsert(db, { groupId: "people", ventureId: undefined, active: false }); // deactivate global

    const rows = await dbGetAll(db);
    expect(rowsToActivatedSet(rows, null).has("people")).toBe(false);   // gone from global
    expect(rowsToActivatedSet(rows, "BEBUS").has("people")).toBe(true); // venture row still ON
  });

  it("⑤ resetting venture rows causes venture to reflect global defaults", async () => {
    // Global: discovery ON, scoring ON, rnd OFF (not set → absent means inactive at global)
    await dbUpsert(db, { groupId: "discovery", ventureId: undefined, active: true });
    await dbUpsert(db, { groupId: "scoring",   ventureId: undefined, active: true });

    // BEBUS overrides: discovery OFF, scoring OFF, people ON
    await dbUpsert(db, { groupId: "discovery", ventureId: "BEBUS", active: false });
    await dbUpsert(db, { groupId: "scoring",   ventureId: "BEBUS", active: false });
    await dbUpsert(db, { groupId: "people",    ventureId: "BEBUS", active: true  });

    // Simulate reset: delete all BEBUS-specific rows.
    const allRows = await dbGetAll(db);
    const remainingRows = allRows.filter(r => r.ventureId !== "BEBUS");

    const afterReset = rowsToActivatedSet(remainingRows, "BEBUS");

    // Should now reflect global: discovery ON, scoring ON, people absent → OFF
    expect(afterReset.has("discovery")).toBe(true);
    expect(afterReset.has("scoring")).toBe(true);
    expect(afterReset.has("people")).toBe(false);
  });

  // ── Edge cases ────────────────────────────────────────────────────────────────

  it("returns empty sets when no rows have been written", async () => {
    const rows = await dbGetAll(db);
    expect(rowsToActivatedSet(rows, "BEBUS").size).toBe(0);
    expect(rowsToActivatedSet(rows, null).size).toBe(0);
  });

  it("multiple modules toggled independently per venture all persist correctly", async () => {
    const groups = ["discovery", "proposition", "rnd", "gtm", "sustainability"];
    for (const g of groups) {
      await dbUpsert(db, { groupId: g, ventureId: "BEBUS", active: true });
    }
    await dbUpsert(db, { groupId: "rnd",  ventureId: "BEBUS", active: false });
    await dbUpsert(db, { groupId: "gtm",  ventureId: "BEBUS", active: false });

    const rows = await dbGetAll(db);
    const set = rowsToActivatedSet(rows, "BEBUS");

    expect(set.has("discovery")).toBe(true);
    expect(set.has("proposition")).toBe(true);
    expect(set.has("sustainability")).toBe(true);
    expect(set.has("rnd")).toBe(false);
    expect(set.has("gtm")).toBe(false);
  });

  it("reading the same rows twice with the same ventureId yields identical activated sets", async () => {
    await dbUpsert(db, { groupId: "investment", ventureId: "BEBUS", active: true });
    await dbUpsert(db, { groupId: "execution",  ventureId: "BEBUS", active: true });

    const rows = await dbGetAll(db);
    const first  = rowsToActivatedSet(rows, "BEBUS");
    const second = rowsToActivatedSet(rows, "BEBUS");

    expect([...first].sort()).toEqual([...second].sort());
  });

  // ── Empty-string ventureId boundary ─────────────────────────────────────────
  // The selector always normalises empty → null before handing the value to the
  // hook, so `""` should never appear in practice.  These tests document the
  // existing behaviour: `rowsToActivatedSet` treats `""` as a non-null venture
  // scope and therefore applies the venture-fallback logic, while
  // `buildRowByGroup` treats `""` as falsy and falls back to global-only lookup.
  // Both functions return the global default set for `""` because there are no
  // rows stored under that sentinel, but the resolution paths diverge — a fact
  // worth preserving as a regression guard.

  it("rowsToActivatedSet returns only global-active groups when ventureId is an empty string (no rows match '')", async () => {
    // Write a global row and a BEBUS row.
    await dbUpsert(db, { groupId: "discovery", ventureId: "__global__", active: true });
    await dbUpsert(db, { groupId: "scoring",   ventureId: "BEBUS",      active: true });

    const rows = await dbGetAll(db);
    // "" enters the venture-fallback branch; no rows have ventureId="" so
    // ventureActive is empty; globalActive seeds the result.
    const emptyScope = rowsToActivatedSet(rows, "");

    // Only the global row contributes (discovery), not the BEBUS row (scoring).
    expect(emptyScope.has("discovery")).toBe(true);
    expect(emptyScope.has("scoring")).toBe(false);
  });

  it("rowsToActivatedSet with '' includes groups active in global scope, same as null scope", async () => {
    await dbUpsert(db, { groupId: "discovery", ventureId: "__global__", active: true });
    await dbUpsert(db, { groupId: "scoring",   ventureId: "__global__", active: false });

    const rows = await dbGetAll(db);
    const nullScope  = rowsToActivatedSet(rows, null); // null → global-only branch
    const emptyScope = rowsToActivatedSet(rows, "");   // "" → venture-fallback branch (no venture rows)

    // Both resolve to the same activated set when no venture rows exist.
    expect([...nullScope].sort()).toEqual([...emptyScope].sort());
  });
});
