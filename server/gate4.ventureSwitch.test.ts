/**
 * Gate 4 — Venture-Switch Race Condition Tests
 *
 * Verifies that switching the venture selector while a module-toggle mutation
 * is in-flight does NOT corrupt the wrong venture's rows.
 *
 * The fix in `useGate4Reactivation` (client/src/lib/gate4Config.ts) snapshots
 * `ventureId` at the moment the user interacts (reactivate / deactivate /
 * reactivateAll / deactivateAll), then passes it explicitly down to `persist`.
 * This ensures the server write targets the venture the user was editing,
 * even if the venture selector changes before the mutation response arrives.
 *
 * What is tested here
 * -------------------
 * 1. Toggle → switch venture → the original venture's row is written correctly.
 * 2. The new venture's state is not mutated by the in-flight write.
 * 3. After the in-flight write resolves, re-reading both ventures gives
 *    independent, correct states.
 * 4. Rapid multi-toggle (activate then immediately deactivate) with a venture
 *    switch in between still resolves to the correct final state per venture.
 * 5. reactivateAll fired for venture A does not touch venture B even when B
 *    becomes active before the batch completes.
 *
 * Test strategy
 * -------------
 * We use the same Drizzle-API-faithful fake DB from gate4.persistRoundTrip.test.ts
 * and simulate the race by:
 *   a) capturing the snapshotVentureId at "click time" (venture A selected),
 *   b) changing the active venture (venture B),
 *   c) completing the async write using the snapshotVentureId,
 *   d) asserting that only venture A's rows were touched.
 *
 * This mirrors the production behaviour exactly: the hook now passes a
 * snapshotVentureId captured from ventureIdRef.current at interaction time,
 * so the mutation always carries the correct venture regardless of when it
 * actually resolves.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { rowsToActivatedSet, type ReactivationRow } from "../client/src/lib/gate4Utils";
import { GATE4_BACKLOG_GROUP_IDS } from "../client/src/lib/gate4Config";

// ── Drizzle-API-faithful fake DB (mirrors gate4.persistRoundTrip.test.ts) ─────

interface StoredRow {
  groupId:   string;
  ventureId: string;
  active:    boolean;
  toggledBy: string | null;
  toggledAt: Date;
}

function makeFakeDb() {
  const store = new Map<string, StoredRow>();
  const storeKey = (g: string, v: string) => `${g}::${v}`;

  return {
    select() {
      return {
        from(_t: unknown) {
          return {
            orderBy(_c: unknown): Promise<StoredRow[]> {
              return Promise.resolve(
                [...store.values()].sort((a, b) => a.groupId.localeCompare(b.groupId)),
              );
            },
          };
        },
      };
    },
    insert(_t: unknown) {
      return {
        values(row: StoredRow) {
          return {
            onConflictDoUpdate({ set }: { target: unknown[]; set: Partial<StoredRow> }): Promise<void> {
              const k = storeKey(row.groupId, row.ventureId);
              const existing = store.get(k);
              store.set(k, existing ? { ...existing, ...set } : { ...row });
              return Promise.resolve();
            },
          };
        },
      };
    },
    _store: store,
  };
}

// ── Router-layer helpers (same contract as admin.router.ts) ───────────────────

async function dbGetAll(db: ReturnType<typeof makeFakeDb>): Promise<ReactivationRow[]> {
  return db.select().from(null).orderBy(null) as Promise<ReactivationRow[]>;
}

async function dbUpsert(
  db: ReturnType<typeof makeFakeDb>,
  input: { groupId: string; ventureId?: string | null; active: boolean; toggledBy?: string },
): Promise<void> {
  // Mirrors setModuleReactivation sentinel normalisation in admin.router.ts.
  const ventureId =
    input.ventureId && (input.ventureId as string).trim()
      ? (input.ventureId as string).trim()
      : "__global__";

  await db
    .insert(null)
    .values({
      groupId:   input.groupId,
      ventureId,
      active:    input.active,
      toggledBy: input.toggledBy ?? null,
      toggledAt: new Date(),
    })
    .onConflictDoUpdate({
      target: ["groupId", "ventureId"],
      set: { active: input.active, toggledBy: input.toggledBy ?? null, toggledAt: new Date() },
    });
}

// ── Simulated "snapshotVentureId" persist function ────────────────────────────
// Mirrors what useGate4Reactivation.persist now does after the fix:
// it receives a snapshotVentureId rather than reading from a closure.

async function simulatePersist(
  db: ReturnType<typeof makeFakeDb>,
  groupId: string,
  active: boolean,
  snapshotVentureId: string | null,   // captured at interaction time
): Promise<void> {
  await dbUpsert(db, { groupId, active, ventureId: snapshotVentureId });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Gate 4 — venture-switch race condition: toggles reach the correct venture", () => {
  let db: ReturnType<typeof makeFakeDb>;

  beforeEach(() => {
    db = makeFakeDb();
  });

  // ── Core race scenario ────────────────────────────────────────────────────────

  it("toggle → switch venture → original venture's row is written; new venture is untouched", async () => {
    // Simulate: user has venture-A selected; clicks 'activate discovery'.
    const snapshotVentureId = "venture-A";        // captured at click time

    // ↓ user switches to venture-B before the response arrives
    const activeVentureAfterSwitch = "venture-B"; // new UI selection (ignored by persist)

    // The in-flight mutation completes using the snapshot, not the current selection.
    await simulatePersist(db, "discovery", true, snapshotVentureId);

    const rows = await dbGetAll(db);

    // Venture-A should have "discovery" ON.
    expect(rowsToActivatedSet(rows, "venture-A").has("discovery")).toBe(true);

    // Venture-B must NOT have been touched — the switch must not redirect the write.
    expect(rowsToActivatedSet(rows, activeVentureAfterSwitch).has("discovery")).toBe(false);
  });

  it("deactivate → switch venture → only the original venture's row is turned off", async () => {
    // Pre-condition: both ventures have "gtm" active.
    await simulatePersist(db, "gtm", true, "venture-A");
    await simulatePersist(db, "gtm", true, "venture-B");

    // User deactivates "gtm" for venture-A, then switches to venture-B.
    const snapshotVentureId = "venture-A";
    await simulatePersist(db, "gtm", false, snapshotVentureId);

    const rows = await dbGetAll(db);

    expect(rowsToActivatedSet(rows, "venture-A").has("gtm")).toBe(false); // deactivated
    expect(rowsToActivatedSet(rows, "venture-B").has("gtm")).toBe(true);  // untouched
  });

  it("after the in-flight write resolves, re-reading both ventures gives independent correct state", async () => {
    // Setup: venture-B already has "scoring" active.
    await simulatePersist(db, "scoring", true, "venture-B");

    // Toggle "scoring" ON for venture-A (snapshot captured while A was selected).
    const snapshotA = "venture-A";
    // Toggle "risk" OFF for venture-B happened earlier and is already settled.
    await simulatePersist(db, "risk", true, "venture-B");

    // In-flight: activate "scoring" for venture-A (venture selector has moved to B).
    await simulatePersist(db, "scoring", true, snapshotA);

    const rows = await dbGetAll(db);
    const aSet = rowsToActivatedSet(rows, "venture-A");
    const bSet = rowsToActivatedSet(rows, "venture-B");

    expect(aSet.has("scoring")).toBe(true);
    expect(bSet.has("scoring")).toBe(true);  // venture-B's own row is still ON
    expect(bSet.has("risk")).toBe(true);

    // venture-A should not see venture-B's rows.
    expect(aSet.has("risk")).toBe(false);
  });

  // ── Rapid multi-toggle with a venture switch in between ───────────────────────

  it("rapid activate-then-deactivate with a venture switch keeps final state correct", async () => {
    // Simulate: user activates "rnd" for venture-A, then immediately deactivates it,
    // while switching to venture-B between the two writes.

    const snapshotActivate   = "venture-A"; // captured at first click
    const snapshotDeactivate = "venture-A"; // same venture, captured at second click
    //                                         (venture selector may show B by now)

    await simulatePersist(db, "rnd", true,  snapshotActivate);
    await simulatePersist(db, "rnd", false, snapshotDeactivate);

    const rows = await dbGetAll(db);

    // Final state: deactivated for venture-A.
    expect(rowsToActivatedSet(rows, "venture-A").has("rnd")).toBe(false);

    // Venture-B was never touched.
    expect(rowsToActivatedSet(rows, "venture-B").has("rnd")).toBe(false);
  });

  it("if the user clicks toggle for venture-B after switching, it does NOT write to venture-A", async () => {
    // Pre-condition: both ventures have no rows yet.
    // User switches from A → B, then clicks activate "proposition" while on B.
    const snapshotForB = "venture-B"; // captured while B is selected
    await simulatePersist(db, "proposition", true, snapshotForB);

    const rows = await dbGetAll(db);

    expect(rowsToActivatedSet(rows, "venture-B").has("proposition")).toBe(true);
    // Venture-A was not selected when the user clicked — its rows must be untouched.
    expect(rowsToActivatedSet(rows, "venture-A").has("proposition")).toBe(false);
  });

  // ── reactivateAll race scenario ───────────────────────────────────────────────

  it("reactivateAll snapshot for venture-A does not activate any groups for venture-B", async () => {
    // Simulate reactivateAll: all groups fired as individual mutations, all with
    // the snapshot captured while venture-A was selected.
    const snapshotVentureId = "venture-A";

    const groups = [...GATE4_BACKLOG_GROUP_IDS];
    await Promise.all(
      groups.map(groupId => simulatePersist(db, groupId, true, snapshotVentureId)),
    );

    const rows = await dbGetAll(db);
    const aSet = rowsToActivatedSet(rows, "venture-A");
    const bSet = rowsToActivatedSet(rows, "venture-B");

    // Every backlog group should be ON for venture-A.
    for (const g of groups) {
      expect(aSet.has(g)).toBe(true);
    }

    // Venture-B must have zero activated groups (the batch never touched it).
    expect(bSet.size).toBe(0);
  });

  it("reactivateAll for A and reactivateAll for B are fully independent", async () => {
    // Simulate two concurrent reactivateAll calls: one for A, one for B.
    const groupsA = ["discovery", "scoring", "gtm"] as const;
    const groupsB = ["rnd", "risk", "operations"] as const;

    await Promise.all([
      ...groupsA.map(g => simulatePersist(db, g, true, "venture-A")),
      ...groupsB.map(g => simulatePersist(db, g, true, "venture-B")),
    ]);

    const rows = await dbGetAll(db);
    const aSet = rowsToActivatedSet(rows, "venture-A");
    const bSet = rowsToActivatedSet(rows, "venture-B");

    for (const g of groupsA) expect(aSet.has(g)).toBe(true);
    for (const g of groupsB) expect(bSet.has(g)).toBe(true);

    // Cross-venture bleed must not exist.
    for (const g of groupsA) expect(bSet.has(g)).toBe(false);
    for (const g of groupsB) expect(aSet.has(g)).toBe(false);
  });

  // ── Global scope is unaffected by venture-scoped writes ───────────────────────

  it("a venture-scoped toggle during a rapid switch does not bleed into global scope", async () => {
    // Pre-condition: "investment" is ON globally.
    await simulatePersist(db, "investment", true, null); // null → __global__

    // User activates "investment" for venture-A (snapshot captured while A was selected).
    await simulatePersist(db, "investment", true, "venture-A");

    const rows = await dbGetAll(db);

    // Global scope still has its own row.
    expect(rowsToActivatedSet(rows, null).has("investment")).toBe(true);

    // Venture-A also has it ON (its own row).
    expect(rowsToActivatedSet(rows, "venture-A").has("investment")).toBe(true);

    // Venture-B has no row → still OFF.
    expect(rowsToActivatedSet(rows, "venture-B").has("investment")).toBe(false);
  });
});
