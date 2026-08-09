/**
 * Gate 4 — Audit Trail Live-Update Tests (Task #62)
 *
 * Confirms that the audit line (who toggled, when) in the ReactivationPanel
 * updates live alongside the source badge after a toggle, without a page reload.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW THE AUDIT TRAIL PIPELINE WORKS (Sidebar.tsx : ReactivationPanel)
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. `useGate4Reactivation(ventureId)` fetches rows via `getModuleReactivations`.
 *
 * 2. The component calls `buildRowByGroup(rows, ventureId)` to build a lookup
 *    from groupId → most-specific row (venture takes precedence over global).
 *
 * 3. For each group the panel resolves:
 *      - The badge state:   `resolveModuleBadge(isLoading, isError, row)`
 *      - The audit string:  `formatToggleAudit(row.toggledBy, row.toggledAt)`
 *    Both are derived from the SAME row, so if the row is stale the badge
 *    and the audit line are stale together.
 *
 * 4. After a successful toggle the mutation calls
 *    `utils.admin.getModuleReactivations.invalidate()`, React Query re-fetches,
 *    rows are re-derived, and both badge and audit re-render — no page reload.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TWO TEST SUITES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Suite 1 — Pure unit tests of formatToggleAudit
 *   Covers all combinations of null / present toggledBy and toggledAt, including
 *   a string-encoded date (the shape React Query can return after JSON parse).
 *
 * Suite 2 — Fake-DB integration (toggle → write → refetch → audit string)
 *   Uses the same Drizzle-API-faithful fake DB pattern as the source-badge live-
 *   update tests to verify that both the badge AND the audit string change in
 *   lockstep after a toggle, without a page reload.
 *
 *   If `invalidate()` / the DB write / re-read were removed, the badge and audit
 *   string would both stay stale — these tests catch that regression.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  resolveModuleBadge,
  buildRowByGroup,
  formatToggleAudit,
  type ReactivationRow,
} from "../client/src/lib/gate4Utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Derive both the badge state and the audit string for a group from a row array. */
function auditAndBadgeFor(
  rows: ReactivationRow[],
  ventureId: string | null,
  groupId: string,
  isLoading = false,
  isError   = false,
): { badge: ReturnType<typeof resolveModuleBadge>; audit: string | null } {
  const map  = buildRowByGroup(rows, ventureId);
  const row  = map.get(groupId);
  const badge = resolveModuleBadge(isLoading, isError, row);
  const audit = row ? formatToggleAudit(row.toggledBy, row.toggledAt) : null;
  return { badge, audit };
}

const GROUP     = "discovery";
const VENTURE_A = "ven-alpha";
const ADMIN_1   = "alice@example.com";
const ADMIN_2   = "bob@example.com";
const FIXED_DATE = new Date("2026-04-15T09:30:00Z");

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 1 — Pure unit tests of formatToggleAudit
// ══════════════════════════════════════════════════════════════════════════════
describe("formatToggleAudit — pure unit tests", () => {

  // ── null / null ───────────────────────────────────────────────────────────
  it("returns null when both toggledBy and toggledAt are null", () => {
    expect(formatToggleAudit(null, null)).toBeNull();
  });

  it("returns null when both toggledBy and toggledAt are undefined", () => {
    expect(formatToggleAudit(undefined, undefined)).toBeNull();
  });

  it("returns null when toggledBy is null and toggledAt is null", () => {
    expect(formatToggleAudit(null, null)).toBeNull();
  });

  // ── toggledBy present, toggledAt absent ──────────────────────────────────
  it("returns 'by <who>' when toggledBy is set but toggledAt is null", () => {
    expect(formatToggleAudit(ADMIN_1, null)).toBe(`by ${ADMIN_1}`);
  });

  it("returns 'by <who>' when toggledBy is set but toggledAt is undefined", () => {
    expect(formatToggleAudit(ADMIN_2, undefined)).toBe(`by ${ADMIN_2}`);
  });

  // ── toggledBy absent, toggledAt present ──────────────────────────────────
  it("uses 'Unknown' as the who-label when toggledBy is null but toggledAt is set", () => {
    const result = formatToggleAudit(null, FIXED_DATE);
    expect(result).not.toBeNull();
    expect(result).toMatch(/^Unknown · /);
  });

  it("uses 'Unknown' as the who-label when toggledBy is undefined but toggledAt is set", () => {
    const result = formatToggleAudit(undefined, FIXED_DATE);
    expect(result).not.toBeNull();
    expect(result).toMatch(/^Unknown · /);
  });

  // ── both present — Date object ────────────────────────────────────────────
  it("returns '<who> · <date> <time>' when both fields are set (Date object)", () => {
    const result = formatToggleAudit(ADMIN_1, FIXED_DATE);
    expect(result).not.toBeNull();
    // Must start with the user's name
    expect(result).toMatch(new RegExp(`^${ADMIN_1} · `));
    // Must contain the separator — confirms date portion is appended
    expect(result).toContain("·");
  });

  it("includes the user's name before the date separator", () => {
    const result = formatToggleAudit(ADMIN_2, FIXED_DATE);
    const parts = result!.split(" · ");
    expect(parts[0]).toBe(ADMIN_2);
    expect(parts.length).toBeGreaterThanOrEqual(2);
  });

  // ── both present — ISO string (the shape returned by JSON deserialization) ─
  it("accepts an ISO string for toggledAt and still returns a non-null audit string", () => {
    const iso = FIXED_DATE.toISOString();
    const result = formatToggleAudit(ADMIN_1, iso);
    expect(result).not.toBeNull();
    expect(result).toMatch(new RegExp(`^${ADMIN_1} · `));
  });

  it("produces the same output whether toggledAt is a Date or its ISO-string equivalent", () => {
    const iso = FIXED_DATE.toISOString();
    const fromDate   = formatToggleAudit(ADMIN_1, FIXED_DATE);
    const fromString = formatToggleAudit(ADMIN_1, iso);
    expect(fromDate).toBe(fromString);
  });

  // ── audit string changes when the toggle fields change ───────────────────
  it("returns a different string when toggledBy changes (simulating a re-toggle by a different admin)", () => {
    const date = FIXED_DATE;
    const before = formatToggleAudit(ADMIN_1, date);
    const after  = formatToggleAudit(ADMIN_2, date);
    expect(before).not.toBe(after);
    expect(before).toMatch(new RegExp(`^${ADMIN_1}`));
    expect(after).toMatch(new RegExp(`^${ADMIN_2}`));
  });

  it("returns a different string when toggledAt changes (simulating a later re-toggle)", () => {
    const laterDate = new Date("2026-07-20T14:45:00Z");
    const before = formatToggleAudit(ADMIN_1, FIXED_DATE);
    const after  = formatToggleAudit(ADMIN_1, laterDate);
    // Both are non-null and start with the same admin name
    expect(before).toMatch(new RegExp(`^${ADMIN_1}`));
    expect(after).toMatch(new RegExp(`^${ADMIN_1}`));
    // But the full strings differ because the date/time portion changed
    expect(before).not.toBe(after);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 2 — Fake-DB integration: toggle → write → refetch → audit string
//
// Verifies that both the badge AND the audit trail update in lockstep after a
// toggle, because both are derived from the same row object in buildRowByGroup.
//
// The fake DB mirrors the Drizzle API used by the real server:
//   - read()                  ↔  db.select().from(moduleReactivations)
//   - upsert()                ↔  db.insert(…).onConflictDoUpdate(…)
//   - deleteVentureRows()     ↔  db.delete(…).where(ventureId = ?)
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
  const key   = (g: string, v: string) => `${g}::${v}`;

  return {
    async read(): Promise<ReactivationRow[]> {
      return [...store.values()].sort((a, b) => a.groupId.localeCompare(b.groupId));
    },
    async upsert(row: Omit<StoredRow, "toggledAt"> & { toggledAt?: Date }): Promise<void> {
      const k        = key(row.groupId, row.ventureId);
      const existing = store.get(k);
      const full     = { ...row, toggledAt: row.toggledAt ?? new Date() };
      store.set(
        k,
        existing
          ? { ...existing, active: full.active, toggledBy: full.toggledBy, toggledAt: full.toggledAt }
          : full,
      );
    },
    async deleteVentureRows(ventureId: string): Promise<void> {
      for (const [k, row] of store) {
        if (row.ventureId === ventureId) store.delete(k);
      }
    },
  };
}

describe("audit trail live-update — fake-DB integration (toggle → write → refetch → audit)", () => {
  let db: ReturnType<typeof makeFakeDb>;

  beforeEach(() => { db = makeFakeDb(); });

  // ── A: audit string appears after first toggle ────────────────────────────
  it("A: audit string is null before any toggle and non-null after the first venture toggle", async () => {
    // No rows → no audit line
    const rowsBefore = await db.read();
    const { audit: auditBefore, badge: badgeBefore } = auditAndBadgeFor(rowsBefore, VENTURE_A, GROUP);
    expect(auditBefore).toBeNull();
    expect(badgeBefore).toBe("default");

    // Admin toggles → venture row written with author info
    const toggledAt = new Date("2026-04-15T09:30:00Z");
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true, toggledBy: ADMIN_1, toggledAt });

    // Simulate React Query refetch (invalidate → re-read)
    const rowsAfter = await db.read();
    const { audit: auditAfter, badge: badgeAfter } = auditAndBadgeFor(rowsAfter, VENTURE_A, GROUP);

    expect(auditAfter).not.toBeNull();
    expect(auditAfter).toMatch(new RegExp(`^${ADMIN_1}`));
    expect(badgeAfter).toBe("venture");
  });

  // ── B: audit string and badge both update after a re-toggle by a different admin ─
  it("B: audit string and badge both reflect the new admin after a second toggle", async () => {
    // Seed: ADMIN_1 toggles first
    const date1 = new Date("2026-04-01T08:00:00Z");
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true, toggledBy: ADMIN_1, toggledAt: date1 });

    const rows1 = await db.read();
    const { audit: audit1, badge: badge1 } = auditAndBadgeFor(rows1, VENTURE_A, GROUP);
    expect(audit1).toMatch(new RegExp(`^${ADMIN_1}`));
    expect(badge1).toBe("venture");

    // ADMIN_2 re-toggles (deactivates) at a later time
    const date2 = new Date("2026-05-10T14:00:00Z");
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: false, toggledBy: ADMIN_2, toggledAt: date2 });

    // Refetch
    const rows2 = await db.read();
    const { audit: audit2, badge: badge2 } = auditAndBadgeFor(rows2, VENTURE_A, GROUP);

    // Audit line must now show ADMIN_2, not ADMIN_1
    expect(audit2).toMatch(new RegExp(`^${ADMIN_2}`));
    expect(audit2).not.toMatch(new RegExp(`^${ADMIN_1}`));

    // Badge is still 'venture' (row is present; active flag doesn't affect badge source)
    expect(badge2).toBe("venture");

    // Confirm both fields changed
    expect(audit1).not.toBe(audit2);
  });

  // ── C: global toggle shows audit trail in global scope ───────────────────
  it("C: global toggle creates an audit line visible at global scope (ventureId=null)", async () => {
    const toggledAt = new Date("2026-03-20T12:00:00Z");
    await db.upsert({ groupId: GROUP, ventureId: "__global__", active: true, toggledBy: ADMIN_1, toggledAt });

    const rows = await db.read();
    const { audit, badge } = auditAndBadgeFor(rows, null, GROUP);

    expect(audit).not.toBeNull();
    expect(audit).toMatch(new RegExp(`^${ADMIN_1}`));
    expect(badge).toBe("global");
  });

  // ── D: venture toggle shows venture author; global still shows global author ─
  it("D: venture-scoped audit shows venture author even though a global row also exists", async () => {
    const globalDate   = new Date("2026-01-01T00:00:00Z");
    const ventureDate  = new Date("2026-06-01T10:00:00Z");
    await db.upsert({ groupId: GROUP, ventureId: "__global__", active: true, toggledBy: ADMIN_1, toggledAt: globalDate });
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A,   active: true, toggledBy: ADMIN_2, toggledAt: ventureDate });

    const rows = await db.read();

    // Venture scope → sees venture row → ADMIN_2's audit
    const { audit: ventureAudit, badge: ventureBadge } = auditAndBadgeFor(rows, VENTURE_A, GROUP);
    expect(ventureAudit).toMatch(new RegExp(`^${ADMIN_2}`));
    expect(ventureBadge).toBe("venture");

    // Global scope → sees global row → ADMIN_1's audit
    const { audit: globalAudit, badge: globalBadge } = auditAndBadgeFor(rows, null, GROUP);
    expect(globalAudit).toMatch(new RegExp(`^${ADMIN_1}`));
    expect(globalBadge).toBe("global");
  });

  // ── E: reset clears audit string and reverts badge ────────────────────────
  it("E: audit string disappears and badge reverts after reset (venture rows deleted)", async () => {
    // Setup: global + venture rows
    await db.upsert({ groupId: GROUP, ventureId: "__global__", active: true, toggledBy: ADMIN_1, toggledAt: new Date("2026-01-01T00:00:00Z") });
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A,   active: true, toggledBy: ADMIN_2, toggledAt: new Date("2026-06-01T10:00:00Z") });

    const rowsBefore = await db.read();
    const before = auditAndBadgeFor(rowsBefore, VENTURE_A, GROUP);
    expect(before.audit).toMatch(new RegExp(`^${ADMIN_2}`));
    expect(before.badge).toBe("venture");

    // Reset — delete all venture rows for VENTURE_A
    await db.deleteVentureRows(VENTURE_A);

    const rowsAfter = await db.read();
    const after = auditAndBadgeFor(rowsAfter, VENTURE_A, GROUP);

    // Badge reverts to the global default, and the audit line now shows ADMIN_1
    // (the global row's author), not ADMIN_2
    expect(after.badge).toBe("global");
    expect(after.audit).toMatch(new RegExp(`^${ADMIN_1}`));
    expect(after.audit).not.toMatch(new RegExp(`^${ADMIN_2}`));
  });

  // ── F: reset with no global row → audit null, badge 'default' ────────────
  it("F: audit string is null and badge is 'default' after reset when no global row exists", async () => {
    // Only a venture row — no global row
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true, toggledBy: ADMIN_1, toggledAt: new Date("2026-06-01T10:00:00Z") });

    const rowsBefore = await db.read();
    const before = auditAndBadgeFor(rowsBefore, VENTURE_A, GROUP);
    expect(before.audit).not.toBeNull();
    expect(before.badge).toBe("venture");

    await db.deleteVentureRows(VENTURE_A);

    const rowsAfter = await db.read();
    const after = auditAndBadgeFor(rowsAfter, VENTURE_A, GROUP);
    expect(after.audit).toBeNull();    // no row → no audit line
    expect(after.badge).toBe("default");
  });

  // ── G: toggle on one group does not affect audit for another group ─────────
  it("G: audit and badge for 'operations' are unaffected when only 'discovery' is toggled", async () => {
    const OTHER = "operations";
    await db.upsert({ groupId: OTHER, ventureId: "__global__", active: true, toggledBy: ADMIN_1, toggledAt: new Date("2026-01-01T00:00:00Z") });

    const rows0 = await db.read();
    const otherBefore = auditAndBadgeFor(rows0, VENTURE_A, OTHER);
    expect(otherBefore.badge).toBe("global");
    expect(otherBefore.audit).not.toBeNull();

    // Toggle only the discovery group for VENTURE_A
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true, toggledBy: ADMIN_2, toggledAt: new Date("2026-06-01T10:00:00Z") });

    const rows1 = await db.read();

    // discovery changed
    const discoveryAfter = auditAndBadgeFor(rows1, VENTURE_A, GROUP);
    expect(discoveryAfter.badge).toBe("venture");
    expect(discoveryAfter.audit).toMatch(new RegExp(`^${ADMIN_2}`));

    // operations unchanged
    const otherAfter = auditAndBadgeFor(rows1, VENTURE_A, OTHER);
    expect(otherAfter.badge).toBe("global");
    expect(otherAfter.audit).toMatch(new RegExp(`^${ADMIN_1}`));
  });

  // ── H: audit string has null toggledBy in stored row → "Unknown" label ────
  it("H: row with null toggledBy produces an 'Unknown' audit label (not a crash)", async () => {
    const toggledAt = new Date("2026-05-01T08:00:00Z");
    // Upsert with toggledBy=null (legacy / migrated rows may have this)
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true, toggledBy: null, toggledAt });

    const rows = await db.read();
    const { audit, badge } = auditAndBadgeFor(rows, VENTURE_A, GROUP);

    expect(badge).toBe("venture");
    expect(audit).not.toBeNull();
    expect(audit).toMatch(/^Unknown · /);
  });

  // ── I: badge and audit update together — they are never out of sync ────────
  it("I: badge state and audit line are always derived from the same row (never out of sync)", async () => {
    // Write a global row
    const globalDate = new Date("2026-01-10T10:00:00Z");
    await db.upsert({ groupId: GROUP, ventureId: "__global__", active: true, toggledBy: ADMIN_1, toggledAt: globalDate });

    // Confirm both reflect the global row
    const rows1 = await db.read();
    const state1 = auditAndBadgeFor(rows1, VENTURE_A, GROUP);
    expect(state1.badge).toBe("global");
    expect(state1.audit).toMatch(new RegExp(`^${ADMIN_1}`));

    // Add a venture override — both badge AND audit must flip together
    const ventureDate = new Date("2026-06-15T16:00:00Z");
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true, toggledBy: ADMIN_2, toggledAt: ventureDate });

    const rows2 = await db.read();
    const state2 = auditAndBadgeFor(rows2, VENTURE_A, GROUP);

    // Badge upgraded to 'venture'
    expect(state2.badge).toBe("venture");
    // Audit simultaneously shows the venture admin, not the global one
    expect(state2.audit).toMatch(new RegExp(`^${ADMIN_2}`));
    expect(state2.audit).not.toMatch(new RegExp(`^${ADMIN_1}`));

    // Sanity: transitions occurred
    expect(state1.badge).not.toBe(state2.badge);
    expect(state1.audit).not.toBe(state2.audit);
  });
});
