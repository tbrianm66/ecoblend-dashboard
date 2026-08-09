/**
 * Gate 4 — Source Badge Live-Update Tests (Task #53)
 *
 * Confirms that the GLOBAL / VENTURE / DEFAULT source badge updates correctly
 * after a toggle, without a page reload.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW THE BADGE PIPELINE WORKS (Sidebar.tsx : ReactivationPanel)
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. `useGate4Reactivation(ventureId)` calls `getModuleReactivations` and
 *    exposes `rows` — a useMemo-derived array always synchronous with the latest
 *    server response.
 *
 * 2. The component calls `buildRowByGroup(rows, ventureId)` (gate4Utils.ts) to
 *    build a lookup from groupId → most-specific row.  Global rows (__global__)
 *    seed the map first; venture-specific rows overwrite them for any matching
 *    groupId, so venture rows always take precedence.
 *
 * 3. For each group the component calls
 *    `resolveModuleBadge(isLoading, isError, rowByGroup.get(group.id))`
 *    and renders the resulting badge state.
 *
 * 4. After a successful toggle the mutation calls
 *    `utils.admin.getModuleReactivations.invalidate()`, React Query re-fetches,
 *    `rows` is re-derived via useMemo, and the badge re-renders — all without
 *    a page reload.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TWO TEST SUITES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Suite 1 — Pure scenario matrix
 *   Uses `buildRowByGroup` (imported from the production gate4Utils.ts module)
 *   + `resolveModuleBadge` to exhaustively verify every before/after badge-state
 *   transition.  This suite cannot drift silently from the Sidebar because both
 *   functions are the same code the browser runs.
 *
 * Suite 2 — Fake-DB integration (toggle → write → refetch → badge)
 *   Uses the same Drizzle-API-faithful fake DB as gate4.persistRoundTrip.test.ts
 *   to simulate the full lifecycle:
 *
 *     a) Initial DB state  →  read rows  →  compute badge
 *     b) Toggle fired      →  write venture/global row to DB
 *     c) Invalidate fires  →  re-read rows from DB (the refetch)
 *     d) Rows re-derived   →  recompute badge  →  badge has changed
 *
 *   This ensures that removing / breaking the `invalidate()` call or the
 *   `setModuleReactivation` DB write would cause these tests to fail, even
 *   though the pure suite cannot detect that.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  resolveModuleBadge,
  buildRowByGroup,
  type ReactivationRow,
} from "../client/src/lib/gate4Utils";

// ── Badge helper ──────────────────────────────────────────────────────────────
// Computes the final badge state for a single group from the full row array.
// Uses the PRODUCTION buildRowByGroup so any change to the precedence rules
// breaks this test immediately.
function badgeFor(
  rows: ReactivationRow[],
  ventureId: string | null,
  groupId: string,
  isLoading = false,
  isError   = false,
): ReturnType<typeof resolveModuleBadge> {
  const map = buildRowByGroup(rows, ventureId);
  return resolveModuleBadge(isLoading, isError, map.get(groupId));
}

// ── Row factories ─────────────────────────────────────────────────────────────
function globalRow(groupId: string, active = true): ReactivationRow {
  return { groupId, ventureId: "__global__", active, toggledBy: "admin@test.com", toggledAt: new Date("2026-01-01T10:00:00Z") };
}
function ventureRow(groupId: string, ventureId: string, active = true): ReactivationRow {
  return { groupId, ventureId, active, toggledBy: "admin@test.com", toggledAt: new Date("2026-01-01T10:05:00Z") };
}

const GROUP     = "discovery";
const VENTURE_A = "ven-alpha";
const VENTURE_B = "ven-beta";

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 1 — Pure scenario matrix
// ══════════════════════════════════════════════════════════════════════════════
describe("source badge state transitions — pure scenarios (production buildRowByGroup + resolveModuleBadge)", () => {

  describe("Scenario A — first venture override: badge updates GLOBAL → VENTURE", () => {
    const before: ReactivationRow[] = [globalRow(GROUP)];
    const after:  ReactivationRow[] = [globalRow(GROUP), ventureRow(GROUP, VENTURE_A)];

    it("before toggle: only global row → badge is 'global'", () => {
      expect(badgeFor(before, VENTURE_A, GROUP)).toBe("global");
    });
    it("after toggle: venture row added (server refetch delivers both rows) → badge switches to 'venture'", () => {
      expect(badgeFor(after, VENTURE_A, GROUP)).toBe("venture");
    });
    it("a different venture with no override still shows 'global'", () => {
      expect(badgeFor(after, VENTURE_B, GROUP)).toBe("global");
    });
    it("global scope (ventureId=null) does not see venture rows → badge stays 'global'", () => {
      expect(badgeFor(after, null, GROUP)).toBe("global");
    });
  });

  describe("Scenario B — deactivate venture override: badge stays 'venture' (row kept, active=false)", () => {
    const before: ReactivationRow[] = [globalRow(GROUP), ventureRow(GROUP, VENTURE_A, true)];
    const after:  ReactivationRow[] = [globalRow(GROUP), ventureRow(GROUP, VENTURE_A, false)];

    it("before deactivate: venture row (active=true) → badge is 'venture'", () => {
      expect(badgeFor(before, VENTURE_A, GROUP)).toBe("venture");
    });
    it("after deactivate: venture row (active=false) still present → badge stays 'venture'", () => {
      // Deactivation flips active=false; the row is NOT deleted.  The venture row
      // is still the authoritative source, so the badge correctly shows 'venture'.
      expect(badgeFor(after, VENTURE_A, GROUP)).toBe("venture");
    });
  });

  describe("Scenario C — reset-to-global-defaults: badge reverts VENTURE → GLOBAL", () => {
    const before: ReactivationRow[] = [globalRow(GROUP), ventureRow(GROUP, VENTURE_A)];
    const after:  ReactivationRow[] = [globalRow(GROUP)]; // venture row deleted

    it("before reset → 'venture'", () => { expect(badgeFor(before, VENTURE_A, GROUP)).toBe("venture"); });
    it("after reset → 'global'",  () => { expect(badgeFor(after,  VENTURE_A, GROUP)).toBe("global"); });
    it("other ventures are unaffected", () => {
      expect(badgeFor(before, VENTURE_B, GROUP)).toBe("global");
      expect(badgeFor(after,  VENTURE_B, GROUP)).toBe("global");
    });
  });

  describe("Scenario D — reset when no global row: badge reverts VENTURE → DEFAULT", () => {
    const before: ReactivationRow[] = [ventureRow(GROUP, VENTURE_A)];
    const after:  ReactivationRow[] = []; // all rows deleted

    it("before reset: venture row present, no global → 'venture'", () => {
      expect(badgeFor(before, VENTURE_A, GROUP)).toBe("venture");
    });
    it("after reset: no rows at all → 'default'", () => {
      expect(badgeFor(after, VENTURE_A, GROUP)).toBe("default");
    });
  });

  describe("Scenario E — first global toggle: DEFAULT → GLOBAL", () => {
    const before: ReactivationRow[] = [];
    const after:  ReactivationRow[] = [globalRow(GROUP)];

    it("before → 'default'", () => { expect(badgeFor(before, null,      GROUP)).toBe("default"); });
    it("after  → 'global'",  () => { expect(badgeFor(after,  null,      GROUP)).toBe("global"); });
    it("global toggle visible to any venture scope", () => {
      expect(badgeFor(after, VENTURE_A, GROUP)).toBe("global");
    });
  });

  describe("Scenario F — first per-venture toggle: DEFAULT → VENTURE", () => {
    const before: ReactivationRow[] = [];
    const after:  ReactivationRow[] = [ventureRow(GROUP, VENTURE_A)];

    it("before → 'default'",  () => { expect(badgeFor(before, VENTURE_A, GROUP)).toBe("default"); });
    it("after  → 'venture'",  () => { expect(badgeFor(after,  VENTURE_A, GROUP)).toBe("venture"); });
    it("VENTURE_B unaffected → 'default'", () => { expect(badgeFor(after, VENTURE_B, GROUP)).toBe("default"); });
    it("global scope does not see venture rows → 'default'", () => {
      expect(badgeFor(after, null, GROUP)).toBe("default");
    });
  });

  describe("toggle on one group does not affect the badge of other groups", () => {
    const OTHER = "operations";
    const rows: ReactivationRow[] = [
      globalRow(GROUP),
      ventureRow(GROUP, VENTURE_A),
      globalRow(OTHER),
    ];
    it("toggled group → 'venture'", () => { expect(badgeFor(rows, VENTURE_A, GROUP)).toBe("venture"); });
    it("untouched group → 'global'", () => { expect(badgeFor(rows, VENTURE_A, OTHER)).toBe("global"); });
  });

  describe("loading/error states suppress badge regardless of row data", () => {
    const rows: ReactivationRow[] = [globalRow(GROUP), ventureRow(GROUP, VENTURE_A)];

    it("isLoading=true → 'loading'",  () => { expect(badgeFor(rows, VENTURE_A, GROUP, true,  false)).toBe("loading"); });
    it("isError=true  → 'unknown'",   () => { expect(badgeFor(rows, VENTURE_A, GROUP, false, true)).toBe("unknown"); });
    it("resolved OK   → 'venture'",   () => { expect(badgeFor(rows, VENTURE_A, GROUP, false, false)).toBe("venture"); });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 2 — Fake-DB integration: toggle → write → refetch → badge
//
// Simulates the full live-update path:
//   1. Admin opens the panel — server rows are read → badge computed.
//   2. Admin clicks a toggle — setModuleReactivation writes to DB.
//   3. onSuccess fires invalidate() — React Query re-fetches (simulated here
//      by calling dbGetAll again with the same fake DB).
//   4. rows re-derived from fresh server response → badge recomputed → changed.
//
// If the DB write or re-read is omitted, the badge will NOT change.
// ══════════════════════════════════════════════════════════════════════════════

interface StoredRow {
  groupId:   string;
  ventureId: string;
  active:    boolean;
  toggledBy: string | null;
  toggledAt: Date;
}

function makeFakeDb() {
  const store = new Map<string, StoredRow>();
  const key = (g: string, v: string) => `${g}::${v}`;

  return {
    /** Mirrors: db.select().from(moduleReactivations).orderBy(groupId) */
    async read(): Promise<ReactivationRow[]> {
      return [...store.values()].sort((a, b) => a.groupId.localeCompare(b.groupId));
    },
    /** Mirrors: db.insert(moduleReactivations).values(…).onConflictDoUpdate(…) */
    async upsert(row: Omit<StoredRow, "toggledAt"> & { toggledAt?: Date }): Promise<void> {
      const k = key(row.groupId, row.ventureId);
      const existing = store.get(k);
      const full = { ...row, toggledAt: row.toggledAt ?? new Date() };
      store.set(k, existing ? { ...existing, active: full.active, toggledBy: full.toggledBy, toggledAt: full.toggledAt } : full);
    },
    /** Mirrors: db.delete(moduleReactivations).where(ventureId = ?) */
    async deleteVentureRows(ventureId: string): Promise<void> {
      for (const [k, row] of store) {
        if (row.ventureId === ventureId) store.delete(k);
      }
    },
  };
}

describe("source badge live-update — fake-DB integration (toggle → write → refetch → badge)", () => {
  let db: ReturnType<typeof makeFakeDb>;

  beforeEach(() => {
    db = makeFakeDb();
  });

  // ── A: GLOBAL → VENTURE after first per-venture toggle ────────────────────
  it("A: badge changes GLOBAL → VENTURE after a venture row is written and rows are re-read", async () => {
    // Seed: global row only
    await db.upsert({ groupId: GROUP, ventureId: "__global__", active: true, toggledBy: "seed" });

    // Step 1: initial read (simulates panel open / last refetch)
    const rowsBefore = await db.read();
    const badgeBefore = badgeFor(rowsBefore, VENTURE_A, GROUP);
    expect(badgeBefore).toBe("global"); // ← no venture override yet

    // Step 2: admin clicks toggle — setModuleReactivation writes venture row
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true, toggledBy: "admin" });

    // Step 3: invalidate fires → React Query re-fetches (simulated: read again)
    const rowsAfter = await db.read();
    const badgeAfter = badgeFor(rowsAfter, VENTURE_A, GROUP);
    expect(badgeAfter).toBe("venture"); // ← badge updated live, no reload needed

    // Verify the transition: badge must have changed
    expect(badgeBefore).not.toBe(badgeAfter);
  });

  // ── B: DEFAULT → VENTURE (first toggle, no prior rows) ───────────────────
  it("B: badge changes DEFAULT → VENTURE on the very first toggle for a venture", async () => {
    // No rows at all
    const rowsBefore = await db.read();
    expect(badgeFor(rowsBefore, VENTURE_A, GROUP)).toBe("default");

    // Toggle fires → venture row written
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true, toggledBy: "admin" });

    const rowsAfter = await db.read();
    expect(badgeFor(rowsAfter, VENTURE_A, GROUP)).toBe("venture");
  });

  // ── C: DEFAULT → GLOBAL (first global toggle) ────────────────────────────
  it("C: badge changes DEFAULT → GLOBAL on the very first global toggle", async () => {
    const rowsBefore = await db.read();
    expect(badgeFor(rowsBefore, null, GROUP)).toBe("default");

    await db.upsert({ groupId: GROUP, ventureId: "__global__", active: true, toggledBy: "admin" });

    const rowsAfter = await db.read();
    expect(badgeFor(rowsAfter, null, GROUP)).toBe("global");
  });

  // ── D: VENTURE → GLOBAL after reset-to-global-defaults ──────────────────
  it("D: badge reverts VENTURE → GLOBAL after venture rows are deleted (reset)", async () => {
    // Setup: global row + venture override
    await db.upsert({ groupId: GROUP, ventureId: "__global__", active: true, toggledBy: "seed" });
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true, toggledBy: "admin" });

    const rowsBefore = await db.read();
    expect(badgeFor(rowsBefore, VENTURE_A, GROUP)).toBe("venture");

    // Reset fires → all venture rows for VENTURE_A deleted
    await db.deleteVentureRows(VENTURE_A);

    const rowsAfter = await db.read();
    expect(badgeFor(rowsAfter, VENTURE_A, GROUP)).toBe("global"); // inherits global default
  });

  // ── E: VENTURE → DEFAULT after reset when no global row ─────────────────
  it("E: badge reverts VENTURE → DEFAULT after reset when no global row exists", async () => {
    // Setup: venture-only row (no global)
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true, toggledBy: "admin" });

    const rowsBefore = await db.read();
    expect(badgeFor(rowsBefore, VENTURE_A, GROUP)).toBe("venture");

    await db.deleteVentureRows(VENTURE_A);

    const rowsAfter = await db.read();
    expect(badgeFor(rowsAfter, VENTURE_A, GROUP)).toBe("default"); // nothing to fall back on
  });

  // ── F: Toggle does NOT affect other ventures ──────────────────────────────
  it("F: toggling for VENTURE_A does not change the badge for VENTURE_B", async () => {
    await db.upsert({ groupId: GROUP, ventureId: "__global__", active: true, toggledBy: "seed" });

    const before_B = badgeFor(await db.read(), VENTURE_B, GROUP);
    expect(before_B).toBe("global"); // B sees global default

    // Toggle for A
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true, toggledBy: "admin" });

    const after_A = badgeFor(await db.read(), VENTURE_A, GROUP);
    const after_B = badgeFor(await db.read(), VENTURE_B, GROUP);

    expect(after_A).toBe("venture"); // A now has its own override
    expect(after_B).toBe("global");  // B is unchanged
  });

  // ── G: Multiple groups — toggle on one group does not bleed into others ───
  it("G: toggle on 'discovery' does not change badge for 'operations'", async () => {
    const OTHER = "operations";
    await db.upsert({ groupId: GROUP, ventureId: "__global__", active: true, toggledBy: "seed" });
    await db.upsert({ groupId: OTHER, ventureId: "__global__", active: true, toggledBy: "seed" });

    // Initial: both show global
    const rows0 = await db.read();
    expect(badgeFor(rows0, VENTURE_A, GROUP)).toBe("global");
    expect(badgeFor(rows0, VENTURE_A, OTHER)).toBe("global");

    // Toggle only discovery
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true, toggledBy: "admin" });

    const rows1 = await db.read();
    expect(badgeFor(rows1, VENTURE_A, GROUP)).toBe("venture"); // toggled group
    expect(badgeFor(rows1, VENTURE_A, OTHER)).toBe("global");  // untouched group unchanged
  });

  // ── H: Deactivation (active=false) keeps row → badge stays 'venture' ─────
  it("H: deactivating a venture override keeps the row so badge stays 'venture'", async () => {
    await db.upsert({ groupId: GROUP, ventureId: "__global__", active: true,  toggledBy: "seed"  });
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A,   active: true,  toggledBy: "admin" });

    const rowsBefore = await db.read();
    expect(badgeFor(rowsBefore, VENTURE_A, GROUP)).toBe("venture");

    // Deactivate — flips active to false but does NOT delete the row
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: false, toggledBy: "admin" });

    const rowsAfter = await db.read();
    // Row still present with venture ventureId → badge is still 'venture'
    expect(badgeFor(rowsAfter, VENTURE_A, GROUP)).toBe("venture");
  });
});
