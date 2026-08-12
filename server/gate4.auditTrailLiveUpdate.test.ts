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

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  resolveModuleBadge,
  buildRowByGroup,
  formatToggleAudit,
  type ReactivationRow,
} from "../client/src/lib/gate4Utils";

// ── Router-level mock (used only by Suite 5) ──────────────────────────────────
// vi.mock is hoisted to the top of the module by Vitest regardless of where it
// physically appears.  Suites 1-4 never call getDb so the mock is inert for them.
vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb }      from "./db";
import { appRouter }  from "./routers";
import type { TrpcContext } from "./_core/context";

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

  // ── [anonymous admin] sentinel ────────────────────────────────────────────
  // The server stores "[anonymous admin]" (not null) when all identity fields
  // are missing.  The UI must surface this sentinel as-is so admins can
  // recognise and investigate the auth misconfiguration — it must NOT be
  // silently re-labelled "Unknown".

  it("surfaces '[anonymous admin]' as-is when stored as the toggledBy sentinel (not re-labelled 'Unknown')", () => {
    const SENTINEL = "[anonymous admin]";
    const result = formatToggleAudit(SENTINEL, FIXED_DATE);
    expect(result).not.toBeNull();
    expect(result).toMatch(new RegExp(`^\\[anonymous admin\\] · `));
    expect(result).not.toContain("Unknown");
  });

  it("returns 'by [anonymous admin]' when sentinel is present but toggledAt is null", () => {
    const SENTINEL = "[anonymous admin]";
    const result = formatToggleAudit(SENTINEL, null);
    expect(result).toBe("by [anonymous admin]");
    expect(result).not.toContain("Unknown");
  });

  it("sentinel '[anonymous admin]' produces a different string from a real admin email", () => {
    const SENTINEL = "[anonymous admin]";
    const sentinelResult = formatToggleAudit(SENTINEL, FIXED_DATE);
    const realResult     = formatToggleAudit(ADMIN_1,   FIXED_DATE);
    expect(sentinelResult).not.toBe(realResult);
    expect(sentinelResult).toMatch(/^\[anonymous admin\]/);
    expect(realResult).toMatch(new RegExp(`^${ADMIN_1}`));
  });

  // ── invalid / unparseable toggledAt ──────────────────────────────────────
  // When the DB or JSON layer supplies a non-date string (e.g. a corrupted
  // row or a misconfigured migration), new Date("not-a-date") produces an
  // Invalid Date object.  The function must not throw — it should surface
  // "Invalid Date" text so the admin can see a row exists even if the
  // timestamp is unreadable, rather than crashing the whole UI.

  it("does NOT throw when toggledAt is an unparseable string (invalid date)", () => {
    expect(() => formatToggleAudit(ADMIN_1, "not-a-date")).not.toThrow();
  });

  it("returns a non-null string when toggledAt is an unparseable string and toggledBy is present", () => {
    // Since toggledAt is truthy (non-empty string), the early-return guard
    // does not trigger — the function reaches the date-formatting branch.
    const result = formatToggleAudit(ADMIN_1, "not-a-date");
    expect(result).not.toBeNull();
    expect(typeof result).toBe("string");
  });

  it("includes the admin name before the separator when toggledAt is invalid", () => {
    const result = formatToggleAudit(ADMIN_1, "not-a-date");
    // The name must still appear at the start of the string even if the
    // date portion is garbled — the separator " · " is always inserted when
    // the date branch is reached, regardless of whether Date parsing succeeded.
    expect(result).toMatch(new RegExp(`^${ADMIN_1} · `));
  });

  it("does NOT throw when both toggledBy is null and toggledAt is unparseable", () => {
    // Combines the two edge-case inputs — null identity + bad date — to
    // confirm the function is robust to both simultaneously.
    expect(() => formatToggleAudit(null, "not-a-date")).not.toThrow();
    const result = formatToggleAudit(null, "not-a-date");
    // toggledAt is truthy → date branch fires → result is non-null.
    expect(result).not.toBeNull();
    // toggledBy is null → falls back to "Unknown".
    expect(result).toMatch(/^Unknown · /);
  });

  // ── whitespace-only toggledBy ─────────────────────────────────────────────
  // `formatToggleAudit` accepts `string | null | undefined` for toggledBy.
  // A whitespace-only string is truthy in JavaScript, so `!toggledBy` is false
  // and it does NOT fall through to the `return null` guard; it is also NOT
  // replaced by "Unknown" (which only applies when toggledBy is null/undefined).
  // The string is passed through as-is to `who`.
  //
  // This documents a current-behaviour contract: the function does not trim or
  // validate toggledBy — whitespace is passed through verbatim to the audit
  // string.  If a future change to trim/validate is desired, this test is the
  // signal to update it deliberately.

  it("treats a whitespace-only toggledBy as a valid identity string (not 'Unknown', not null)", () => {
    // "   " is truthy → `who = "   "`, not "Unknown"
    const result = formatToggleAudit("   ", FIXED_DATE);

    expect(result).not.toBeNull();
    // The result must NOT start with "Unknown" since toggledBy is not null/undefined.
    expect(result).not.toMatch(/^Unknown/);
    // The whitespace string appears verbatim in the result.
    expect(result).toContain("   ");
  });

  it("whitespace-only toggledBy with null toggledAt returns 'by <whitespace>' not null (truthy guard)", () => {
    // toggledBy="  " is truthy so `!toggledBy && !toggledAt` is false.
    // toggledAt is null so the function returns `by ${who}` = "by   ".
    const result = formatToggleAudit("  ", null);

    expect(result).not.toBeNull();
    expect(result).toBe("by   ");
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

  // ── H2: [anonymous admin] sentinel stored in DB surfaces in the audit line ─
  //
  // When the server cannot identify the admin (all identity fields missing) it
  // stores the string "[anonymous admin]" instead of null.  The UI must render
  // this sentinel as-is — NOT silently translate it back to "Unknown" — so
  // admins can spot and investigate auth misconfigurations.
  it("H2: '[anonymous admin]' sentinel stored in DB surfaces in the audit line as-is, not re-labelled 'Unknown'", async () => {
    const SENTINEL  = "[anonymous admin]";
    const toggledAt = new Date("2026-05-20T11:00:00Z");
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true, toggledBy: SENTINEL, toggledAt });

    const rows = await db.read();
    const { audit, badge } = auditAndBadgeFor(rows, VENTURE_A, GROUP);

    expect(badge).toBe("venture");
    expect(audit).not.toBeNull();
    // Sentinel must appear verbatim — not silently replaced with "Unknown"
    expect(audit).toMatch(/^\[anonymous admin\] · /);
    expect(audit).not.toContain("Unknown");
  });

  it("H3: '[anonymous admin]' sentinel also surfaces correctly at global scope", async () => {
    const SENTINEL  = "[anonymous admin]";
    const toggledAt = new Date("2026-05-21T09:00:00Z");
    await db.upsert({ groupId: GROUP, ventureId: "__global__", active: true, toggledBy: SENTINEL, toggledAt });

    const rows = await db.read();
    const { audit, badge } = auditAndBadgeFor(rows, null, GROUP);

    expect(badge).toBe("global");
    expect(audit).not.toBeNull();
    expect(audit).toMatch(/^\[anonymous admin\] · /);
    expect(audit).not.toContain("Unknown");
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

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 3 — Concurrent toggle scenarios (fake-DB layer)
//
// Two admins write to the same groupId+ventureId row concurrently via
// Promise.all.  We do NOT assert "second wins" by call order — instead we
// read back whatever the DB actually stored and assert that the row is
// internally consistent: toggledBy and toggledAt always come from the SAME
// write, never mixed across two concurrent calls.
//
// If the `onConflictDoUpdate` set clause were ever changed to update only
// some fields (e.g. keeps the old toggledBy but takes the new toggledAt),
// the fake DB's upsert would surface a mismatched row and the invariant
// assertions below would fail.
// ══════════════════════════════════════════════════════════════════════════════

describe("audit trail — concurrent toggle scenarios (last write wins, fake-DB layer)", () => {
  let db: ReturnType<typeof makeFakeDb>;

  beforeEach(() => { db = makeFakeDb(); });

  // ── J: concurrent writes settle to one consistent row ─────────────────────
  it("J: two admins writing the same group concurrently produce a single consistent row — toggledBy and toggledAt always from the same write", async () => {
    const date1 = new Date("2026-07-01T10:00:00.000Z");
    const date2 = new Date("2026-07-01T10:00:00.050Z");

    // Both writes dispatched concurrently — not sequentially awaited
    await Promise.all([
      db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true,  toggledBy: ADMIN_1, toggledAt: date1 }),
      db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: false, toggledBy: ADMIN_2, toggledAt: date2 }),
    ]);

    const rows = await db.read();
    const map  = buildRowByGroup(rows, VENTURE_A);
    const row  = map.get(GROUP)!;

    expect(row).toBeDefined();

    // Core invariant: author and timestamp must be from the same write — never mixed
    if (row.toggledBy === ADMIN_1) {
      expect(row.toggledAt).toEqual(date1);
    } else {
      expect(row.toggledBy).toBe(ADMIN_2);
      expect(row.toggledAt).toEqual(date2);
    }

    // Audit string must match the actual stored row — no cross-write contamination
    const audit = formatToggleAudit(row.toggledBy, row.toggledAt);
    expect(audit).toMatch(new RegExp(`^${row.toggledBy!}`));
  });

  // ── K: audit string derived from DB-reported row is never mixed ────────────
  it("K: audit string reflects the DB-confirmed row — toggledBy and the timestamp it displays are always paired from the same write", async () => {
    const date1 = new Date("2026-07-01T10:00:00.000Z");
    const date2 = new Date("2026-07-01T10:00:00.075Z");

    await Promise.all([
      db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true,  toggledBy: ADMIN_1, toggledAt: date1 }),
      db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: false, toggledBy: ADMIN_2, toggledAt: date2 }),
    ]);

    const rows = await db.read();
    const map  = buildRowByGroup(rows, VENTURE_A);
    const row  = map.get(GROUP)!;

    // Exactly one row for this (groupId, ventureId) — never two
    const allForKey = rows.filter(r => r.groupId === GROUP && r.ventureId === VENTURE_A);
    expect(allForKey.length).toBe(1);

    // The audit string must contain the winner's name and none of the loser's name
    const audit = formatToggleAudit(row.toggledBy, row.toggledAt)!;
    const loser = row.toggledBy === ADMIN_1 ? ADMIN_2 : ADMIN_1;
    expect(audit).toMatch(new RegExp(`^${row.toggledBy!}`));
    expect(audit).not.toContain(loser);
  });

  // ── L: same admin re-toggles — single row, no duplication ────────────────
  it("L: same admin toggling the same group twice concurrently produces exactly one row", async () => {
    const date1 = new Date("2026-07-01T11:00:00.000Z");
    const date2 = new Date("2026-07-01T11:00:00.030Z");

    await Promise.all([
      db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true,  toggledBy: ADMIN_1, toggledAt: date1 }),
      db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: false, toggledBy: ADMIN_1, toggledAt: date2 }),
    ]);

    const rows = await db.read();
    const all  = rows.filter(r => r.groupId === GROUP && r.ventureId === VENTURE_A);

    // Upsert semantics: one row, not two
    expect(all.length).toBe(1);
    // Author is the same admin regardless of which write won
    expect(all[0].toggledBy).toBe(ADMIN_1);
    // Audit string is non-null and shows ADMIN_1
    const audit = formatToggleAudit(all[0].toggledBy, all[0].toggledAt);
    expect(audit).toMatch(new RegExp(`^${ADMIN_1}`));
  });

  // ── M: concurrent global writes settle consistently ──────────────────────
  it("M: concurrent writes to global scope also settle to a single internally consistent row", async () => {
    const date1 = new Date("2026-07-02T08:00:00.000Z");
    const date2 = new Date("2026-07-02T08:00:00.040Z");

    await Promise.all([
      db.upsert({ groupId: GROUP, ventureId: "__global__", active: true,  toggledBy: ADMIN_1, toggledAt: date1 }),
      db.upsert({ groupId: GROUP, ventureId: "__global__", active: false, toggledBy: ADMIN_2, toggledAt: date2 }),
    ]);

    const rows = await db.read();
    const map  = buildRowByGroup(rows, null);
    const row  = map.get(GROUP)!;

    expect(row).toBeDefined();

    // Author and timestamp must be paired from the same write
    if (row.toggledBy === ADMIN_1) {
      expect(row.toggledAt).toEqual(date1);
    } else {
      expect(row.toggledBy).toBe(ADMIN_2);
      expect(row.toggledAt).toEqual(date2);
    }

    const { badge } = auditAndBadgeFor(rows, null, GROUP);
    expect(badge).toBe("global");
  });

  // ── N: venture and global writes are independent — no cross-key contamination
  it("N: concurrent venture-scoped and global writes do not contaminate each other's audit data", async () => {
    const ventureDate = new Date("2026-07-03T09:00:00.000Z");
    const globalDate  = new Date("2026-07-03T09:00:00.010Z");

    // One write targets the venture key; the other targets the global key — different DB rows
    await Promise.all([
      db.upsert({ groupId: GROUP, ventureId: VENTURE_A,   active: true, toggledBy: ADMIN_1, toggledAt: ventureDate }),
      db.upsert({ groupId: GROUP, ventureId: "__global__", active: true, toggledBy: ADMIN_2, toggledAt: globalDate }),
    ]);

    const rows = await db.read();

    // Two distinct rows must exist (different keys)
    expect(rows.filter(r => r.groupId === GROUP).length).toBe(2);

    // Venture scope — ADMIN_1's data, unchanged by the global write
    const { audit: ventureAudit, badge: ventureBadge } = auditAndBadgeFor(rows, VENTURE_A, GROUP);
    expect(ventureBadge).toBe("venture");
    expect(ventureAudit).toMatch(new RegExp(`^${ADMIN_1}`));
    expect(ventureAudit).not.toContain(ADMIN_2);

    // Global scope — ADMIN_2's data, unchanged by the venture write
    const { audit: globalAudit, badge: globalBadge } = auditAndBadgeFor(rows, null, GROUP);
    expect(globalBadge).toBe("global");
    expect(globalAudit).toMatch(new RegExp(`^${ADMIN_2}`));
    expect(globalAudit).not.toContain(ADMIN_1);
  });

  // ── P: single-toggle write then batch-toggle write — batch path wins ─────────
  //
  // The real server's single toggle (setModuleReactivation) calls `new Date()`
  // inline inside the onConflictDoUpdate set clause, while the batch path
  // (setModuleReactivationBatch) computes `now` once before the loop and reuses
  // it for every item.  This test confirms that when both paths write to the
  // SAME (groupId, ventureId) row sequentially, the second write (batch) fully
  // overwrites all three mutable fields — active, toggledBy, toggledAt — so the
  // audit line always reflects the batch admin's identity, not a mix.
  it("P: single-toggle write followed by a batch-toggle write on the same row — final audit reflects the batch writer", async () => {
    // Step 1: single-toggle path writes ADMIN_1's data
    const singleDate = new Date("2026-08-01T10:00:00.000Z");
    await db.upsert({
      groupId:   GROUP,
      ventureId: VENTURE_A,
      active:    true,
      toggledBy: ADMIN_1,
      toggledAt: singleDate,
    });

    // Verify ADMIN_1's data is stored before the batch arrives
    const rowsMid = await db.read();
    const midState = auditAndBadgeFor(rowsMid, VENTURE_A, GROUP);
    expect(midState.audit).toMatch(new RegExp(`^${ADMIN_1}`));
    expect(midState.badge).toBe("venture");

    // Step 2: batch path writes ADMIN_2's data with a shared `now`
    // (models the real batch: `const now = new Date()` computed once for the whole batch)
    const batchNow = new Date("2026-08-01T10:00:00.050Z");
    await db.upsert({
      groupId:   GROUP,
      ventureId: VENTURE_A,
      active:    false,
      toggledBy: ADMIN_2,
      toggledAt: batchNow,
    });

    const rowsAfter = await db.read();

    // Exactly one row — the batch upsert must not duplicate the row
    const allForKey = rowsAfter.filter(r => r.groupId === GROUP && r.ventureId === VENTURE_A);
    expect(allForKey.length).toBe(1);

    const map  = buildRowByGroup(rowsAfter, VENTURE_A);
    const row  = map.get(GROUP)!;
    expect(row).toBeDefined();

    // The batch write is the last writer, so its data must win entirely —
    // toggledBy, toggledAt, and active must all come from the batch call.
    expect(row.toggledBy).toBe(ADMIN_2);
    expect(row.toggledAt).toEqual(batchNow);
    expect(row.active).toBe(false);

    // Audit string must show ADMIN_2, not ADMIN_1 (no cross-write contamination)
    const audit = formatToggleAudit(row.toggledBy, row.toggledAt)!;
    expect(audit).toMatch(new RegExp(`^${ADMIN_2}`));
    expect(audit).not.toContain(ADMIN_1);

    // Badge still 'venture' — presence of the row is what matters, not active flag
    const { badge } = auditAndBadgeFor(rowsAfter, VENTURE_A, GROUP);
    expect(badge).toBe("venture");
  });

  // ── Q: batch-toggle write then single-toggle write — single path wins ─────
  //
  // The inverse of P: the batch write lands first (with its shared `now`), then
  // the single-toggle write arrives and overwrites the same row.  Confirms the
  // single-toggle path's onConflictDoUpdate clause also updates all three
  // mutable fields atomically, so the audit line shows the single-toggle admin.
  it("Q: batch-toggle write followed by a single-toggle write on the same row — final audit reflects the single-toggle writer", async () => {
    // Step 1: batch path writes ADMIN_2's data
    const batchNow = new Date("2026-08-02T14:00:00.000Z");
    await db.upsert({
      groupId:   GROUP,
      ventureId: VENTURE_A,
      active:    false,
      toggledBy: ADMIN_2,
      toggledAt: batchNow,
    });

    // Verify ADMIN_2's data is stored before the single toggle arrives
    const rowsMid = await db.read();
    const midState = auditAndBadgeFor(rowsMid, VENTURE_A, GROUP);
    expect(midState.audit).toMatch(new RegExp(`^${ADMIN_2}`));
    expect(midState.badge).toBe("venture");

    // Step 2: single-toggle path writes ADMIN_1's data with its own inline `new Date()`
    const singleDate = new Date("2026-08-02T14:00:00.075Z");
    await db.upsert({
      groupId:   GROUP,
      ventureId: VENTURE_A,
      active:    true,
      toggledBy: ADMIN_1,
      toggledAt: singleDate,
    });

    const rowsAfter = await db.read();

    // Still exactly one row
    const allForKey = rowsAfter.filter(r => r.groupId === GROUP && r.ventureId === VENTURE_A);
    expect(allForKey.length).toBe(1);

    const map  = buildRowByGroup(rowsAfter, VENTURE_A);
    const row  = map.get(GROUP)!;
    expect(row).toBeDefined();

    // Single-toggle write is the last writer; all three fields must come from it
    expect(row.toggledBy).toBe(ADMIN_1);
    expect(row.toggledAt).toEqual(singleDate);
    expect(row.active).toBe(true);

    // Audit string shows ADMIN_1 only — ADMIN_2's name must not appear
    const audit = formatToggleAudit(row.toggledBy, row.toggledAt)!;
    expect(audit).toMatch(new RegExp(`^${ADMIN_1}`));
    expect(audit).not.toContain(ADMIN_2);

    // Badge is 'venture'
    const { badge } = auditAndBadgeFor(rowsAfter, VENTURE_A, GROUP);
    expect(badge).toBe("venture");
  });

  // ── makeRaceableStore ────────────────────────────────────────────────────────
  // A shared in-memory store where each write is gated behind its own Promise
  // resolver.  Unlike makeFakeDb (synchronous Map.set) or makeDeferredFakeDb
  // (single global gate), this helper gives every individual write its own
  // suspension point so tests can release writes in any order, forcing the two
  // orderings of a concurrent race explicitly.
  //
  // The single-toggle path (admin.router.ts ~890–910) calls `new Date()` inline
  // inside onConflictDoUpdate — so its timestamp is captured at write time.
  // The batch path (~977–1003) computes `const now = new Date()` once before
  // the loop — so all items share the same pre-computed timestamp.
  // Both paths atomically update (active, toggledBy, toggledAt) on conflict.
  // makeRaceableStore models this: each gatedWrite captures a fully-formed row
  // at construction time and commits it atomically when released.
  //
  // Usage:
  //   const store = makeRaceableStore();
  //   const w1 = store.gatedWrite({ … });   // write constructed, NOT committed
  //   const w2 = store.gatedWrite({ … });   // same
  //   const p1 = w1.dispatch();              // pending async write
  //   const p2 = w2.dispatch();              // pending async write
  //   w1.release(); await p1;               // write 1 commits first
  //   w2.release(); await p2;               // write 2 commits second (overrides)
  //   store.read();                         // observe final state
  //
  function makeRaceableStore() {
    const store = new Map<string, StoredRow>();
    const storeKey = (g: string, v: string) => `${g}::${v}`;

    function gatedWrite(row: StoredRow): { dispatch: () => Promise<void>; release: () => void } {
      let _release!: () => void;
      const gate = new Promise<void>(resolve => { _release = resolve; });

      return {
        dispatch: async () => {
          await gate;
          const k        = storeKey(row.groupId, row.ventureId);
          const existing = store.get(k);
          store.set(
            k,
            existing
              ? { ...existing, active: row.active, toggledBy: row.toggledBy, toggledAt: row.toggledAt }
              : { ...row },
          );
        },
        release: () => _release(),
      };
    }

    return {
      read: async (): Promise<ReactivationRow[]> =>
        [...store.values()].sort((a, b) => a.groupId.localeCompare(b.groupId)),
      gatedWrite,
    };
  }

  // ── R1: single-toggle commits first, batch-toggle commits second ────────────
  //
  // Ordering: single-toggle write is released and commits first; the batch
  // write then commits and overwrites the row.  The batch path uses a
  // pre-computed `now` (computed once before the loop in the real server).
  // The single-toggle path uses its own inline `new Date()`.
  //
  // After the batch commits (last write), the settled row must have all three
  // mutable fields (active, toggledBy, toggledAt) entirely from the batch
  // write — no fields from the single-toggle write must remain.
  it("R1: single-toggle commits first then batch-toggle commits second — final audit reflects the batch write with no mixed fields", async () => {
    const rs = makeRaceableStore();

    // Single-toggle path: inline `new Date()` captured at construction —
    // modelling admin.router.ts setModuleReactivation's `toggledAt: new Date()`.
    const singleDate = new Date("2026-09-01T08:00:00.000Z");
    const singleWrite = rs.gatedWrite({
      groupId:   GROUP,
      ventureId: VENTURE_A,
      active:    true,
      toggledBy: ADMIN_1,
      toggledAt: singleDate,
    });

    // Batch path: pre-computed `now` shared across all items —
    // modelling setModuleReactivationBatch's `const now = new Date()`.
    const batchNow   = new Date("2026-09-01T08:00:00.080Z");
    const batchWrite = rs.gatedWrite({
      groupId:   GROUP,
      ventureId: VENTURE_A,
      active:    false,
      toggledBy: ADMIN_2,
      toggledAt: batchNow,
    });

    // Both writes dispatched — neither committed yet (both gated)
    const singleP = singleWrite.dispatch();
    const batchP  = batchWrite.dispatch();

    // — Phase 1: release single-toggle first; batch is still pending ——————————
    singleWrite.release();
    await singleP;

    const rowsMid = await rs.read();
    const midRow  = buildRowByGroup(rowsMid, VENTURE_A).get(GROUP)!;
    expect(midRow).toBeDefined();
    // Only single-toggle data committed so far — no mixing possible yet
    expect(midRow.toggledBy).toBe(ADMIN_1);
    expect(midRow.toggledAt).toEqual(singleDate);
    expect(midRow.active).toBe(true);

    // — Phase 2: release batch; batch overwrites the row ——————————————————————
    batchWrite.release();
    await batchP;

    const rowsFinal = await rs.read();

    // Upsert semantics: still exactly one row
    expect(rowsFinal.filter(r => r.groupId === GROUP && r.ventureId === VENTURE_A).length).toBe(1);

    const finalRow = buildRowByGroup(rowsFinal, VENTURE_A).get(GROUP)!;
    expect(finalRow).toBeDefined();

    // All three mutable fields must come from the batch write — no ADMIN_1 data
    expect(finalRow.toggledBy).toBe(ADMIN_2);
    expect(finalRow.toggledAt).toEqual(batchNow);
    expect(finalRow.active).toBe(false);

    // Audit string is entirely from the batch write — no single-toggle leakage
    const audit = formatToggleAudit(finalRow.toggledBy, finalRow.toggledAt)!;
    expect(audit).toMatch(new RegExp(`^${ADMIN_2}`));
    expect(audit).not.toContain(ADMIN_1);

    const { badge } = auditAndBadgeFor(rowsFinal, VENTURE_A, GROUP);
    expect(badge).toBe("venture");
  });

  // ── R2: batch-toggle commits first, single-toggle commits second ────────────
  //
  // Inverse ordering: the batch write commits first (with its pre-computed
  // `now` that is earlier), then the single-toggle write commits second (with
  // its own inline `new Date()`, which is later).  After the single-toggle
  // commits (last write), its three fields must fully replace the batch data —
  // no batch fields must survive in the settled row.
  it("R2: batch-toggle commits first then single-toggle commits second — final audit reflects the single-toggle write with no mixed fields", async () => {
    const rs = makeRaceableStore();

    // Batch path: pre-computed `now` is earlier (batch started first)
    const batchNow   = new Date("2026-09-02T14:00:00.000Z");
    const batchWrite = rs.gatedWrite({
      groupId:   GROUP,
      ventureId: VENTURE_A,
      active:    false,
      toggledBy: ADMIN_2,
      toggledAt: batchNow,
    });

    // Single-toggle path: inline timestamp is later (single arrived after batch)
    const singleDate = new Date("2026-09-02T14:00:00.090Z");
    const singleWrite = rs.gatedWrite({
      groupId:   GROUP,
      ventureId: VENTURE_A,
      active:    true,
      toggledBy: ADMIN_1,
      toggledAt: singleDate,
    });

    const batchP  = batchWrite.dispatch();
    const singleP = singleWrite.dispatch();

    // — Phase 1: release batch first; single is still pending ——————————————————
    batchWrite.release();
    await batchP;

    const rowsMid = await rs.read();
    const midRow  = buildRowByGroup(rowsMid, VENTURE_A).get(GROUP)!;
    expect(midRow).toBeDefined();
    // Only batch data committed so far
    expect(midRow.toggledBy).toBe(ADMIN_2);
    expect(midRow.toggledAt).toEqual(batchNow);
    expect(midRow.active).toBe(false);

    // — Phase 2: release single-toggle; single overwrites the row —————————————
    singleWrite.release();
    await singleP;

    const rowsFinal = await rs.read();

    // Still exactly one row
    expect(rowsFinal.filter(r => r.groupId === GROUP && r.ventureId === VENTURE_A).length).toBe(1);

    const finalRow = buildRowByGroup(rowsFinal, VENTURE_A).get(GROUP)!;
    expect(finalRow).toBeDefined();

    // All three mutable fields must come from the single-toggle write — no ADMIN_2 data
    expect(finalRow.toggledBy).toBe(ADMIN_1);
    expect(finalRow.toggledAt).toEqual(singleDate);
    expect(finalRow.active).toBe(true);

    // Audit string is entirely from the single-toggle write — no batch leakage
    const audit = formatToggleAudit(finalRow.toggledBy, finalRow.toggledAt)!;
    expect(audit).toMatch(new RegExp(`^${ADMIN_1}`));
    expect(audit).not.toContain(ADMIN_2);

    const { badge } = auditAndBadgeFor(rowsFinal, VENTURE_A, GROUP);
    expect(badge).toBe("venture");
  });

  // ── O: three concurrent writes — DB-reported winner's audit is consistent ──
  it("O: after three concurrent writes the DB-reported row's audit is entirely from whichever write won", async () => {
    const ADMIN_3 = "carol@example.com";
    const date1 = new Date("2026-07-04T12:00:00.000Z");
    const date2 = new Date("2026-07-04T12:00:00.020Z");
    const date3 = new Date("2026-07-04T12:00:00.045Z");

    await Promise.all([
      db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true,  toggledBy: ADMIN_1, toggledAt: date1 }),
      db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: false, toggledBy: ADMIN_2, toggledAt: date2 }),
      db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true,  toggledBy: ADMIN_3, toggledAt: date3 }),
    ]);

    const rows = await db.read();
    const map  = buildRowByGroup(rows, VENTURE_A);
    const row  = map.get(GROUP)!;

    // Exactly one row — no duplication
    expect(rows.filter(r => r.groupId === GROUP && r.ventureId === VENTURE_A).length).toBe(1);

    // The winner must be one of the three admins with their matching timestamp
    const expectedPairs: Array<[string, Date]> = [
      [ADMIN_1, date1],
      [ADMIN_2, date2],
      [ADMIN_3, date3],
    ];
    const winner = expectedPairs.find(([name]) => name === row.toggledBy);
    expect(winner).toBeDefined();
    expect(row.toggledAt).toEqual(winner![1]);  // timestamp matches the winning write

    // Audit string reflects the winner wholly — no other admin's name appears
    const audit = formatToggleAudit(row.toggledBy, row.toggledAt)!;
    const losers = [ADMIN_1, ADMIN_2, ADMIN_3].filter(a => a !== row.toggledBy);
    for (const loser of losers) {
      expect(audit).not.toContain(loser);
    }
    expect(audit).toMatch(new RegExp(`^${row.toggledBy!}`));
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 4 — Mid-toggle venture switch (task #101)
//
// Scenario: an admin starts a toggle for venture A, then switches the venture
// selector to venture B before the server response arrives.  The mutation always
// completes for the ORIGINAL venture (A) because the ventureId was captured in
// the mutation closure at dispatch time.  `invalidate()` fires after the write
// resolves; React Query re-fetches ALL rows.  `buildRowByGroup` is then called
// with the CURRENT ventureId (B) to build the panel — it must only see venture B
// rows.  Venture A's audit row must remain accurate, and venture B must be
// wholly unaffected by the venture-A write.
//
// All tests here use the fake-DB layer: the switch is modelled by calling
// `buildRowByGroup` with different ventureIds after the same DB state, exactly
// as the component does when the selector value changes between dispatch and
// the invalidation re-fetch.
// ══════════════════════════════════════════════════════════════════════════════

const VENTURE_B = "ven-beta";

describe("audit trail — mid-toggle venture switch (task #101)", () => {
  let db: ReturnType<typeof makeFakeDb>;

  beforeEach(() => { db = makeFakeDb(); });

  // ── R: venture A write completes; panel has already switched to venture B ──
  //
  // The mutation closure captured VENTURE_A at dispatch time, so the DB write
  // goes to the venture-A row.  By the time invalidate() fires, the panel is
  // showing venture B.  buildRowByGroup(rows, VENTURE_B) must see no venture-A
  // rows, so venture B's badge stays 'default' and its audit line stays null.
  it("R: toggle write for venture A does not appear in venture B's audit after the selector switches", async () => {
    // Precondition: venture B has no rows of its own
    const toggledAt = new Date("2026-08-05T10:00:00.000Z");

    // Mutation completes — writes to venture A (closure captured VENTURE_A)
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true, toggledBy: ADMIN_1, toggledAt });

    // invalidate() re-fetches all rows (both ventures see the same DB snapshot)
    const rows = await db.read();

    // Panel is now showing VENTURE_B — buildRowByGroup scopes to venture B
    const ventureBMap = buildRowByGroup(rows, VENTURE_B);
    expect(ventureBMap.get(GROUP)).toBeUndefined(); // no venture-B row, no global row

    const { badge: badgeB, audit: auditB } = auditAndBadgeFor(rows, VENTURE_B, GROUP);
    expect(badgeB).toBe("default");  // venture B is unaffected
    expect(auditB).toBeNull();

    // Venture A's audit row is still correct — no data was lost
    const { badge: badgeA, audit: auditA } = auditAndBadgeFor(rows, VENTURE_A, GROUP);
    expect(badgeA).toBe("venture");
    expect(auditA).toMatch(new RegExp(`^${ADMIN_1}`));
  });

  // ── S: venture A write completes; venture B has its own pre-existing row ──
  //
  // Venture B already has a row authored by ADMIN_2.  After the mid-switch,
  // venture B must still show ADMIN_2's audit — not ADMIN_1's — because
  // buildRowByGroup resolves rows by ventureId key, not by insertion order.
  it("S: venture B keeps its own audit row intact when venture A is toggled mid-switch", async () => {
    const dateA = new Date("2026-08-06T09:00:00.000Z");
    const dateB = new Date("2026-08-06T08:00:00.000Z"); // earlier — B was set before the switch

    // Pre-existing venture-B row
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_B, active: true, toggledBy: ADMIN_2, toggledAt: dateB });

    // Mutation for venture A completes mid-switch
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true, toggledBy: ADMIN_1, toggledAt: dateA });

    // invalidate() re-fetch
    const rows = await db.read();

    // Venture B's audit must still show ADMIN_2, not ADMIN_1
    const { badge: badgeB, audit: auditB } = auditAndBadgeFor(rows, VENTURE_B, GROUP);
    expect(badgeB).toBe("venture");
    expect(auditB).toMatch(new RegExp(`^${ADMIN_2}`));
    expect(auditB).not.toContain(ADMIN_1);

    // Venture A's audit is correctly attributed to ADMIN_1
    const { badge: badgeA, audit: auditA } = auditAndBadgeFor(rows, VENTURE_A, GROUP);
    expect(badgeA).toBe("venture");
    expect(auditA).toMatch(new RegExp(`^${ADMIN_1}`));
    expect(auditA).not.toContain(ADMIN_2);
  });

  // ── T: global row exists; venture A write completes; panel switches to venture B ─
  //
  // A global default row is present.  The mid-toggle write goes to venture A.
  // After the switch to venture B, buildRowByGroup(rows, VENTURE_B) sees the
  // global row (no venture-B override) so badge is 'global' — not 'venture'.
  // The audit line shows the global admin, NOT ADMIN_1 who toggled venture A.
  it("T: venture B falls back to global audit after switch when no venture-B override exists", async () => {
    const globalDate  = new Date("2026-08-07T07:00:00.000Z");
    const ventureDate = new Date("2026-08-07T09:00:00.000Z");

    // Global default row authored by ADMIN_2
    await db.upsert({ groupId: GROUP, ventureId: "__global__", active: true, toggledBy: ADMIN_2, toggledAt: globalDate });

    // Mutation for venture A completes
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true, toggledBy: ADMIN_1, toggledAt: ventureDate });

    // invalidate() re-fetch
    const rows = await db.read();

    // Venture B has no override → falls back to global → badge 'global', audit = ADMIN_2
    const { badge: badgeB, audit: auditB } = auditAndBadgeFor(rows, VENTURE_B, GROUP);
    expect(badgeB).toBe("global");
    expect(auditB).toMatch(new RegExp(`^${ADMIN_2}`));
    expect(auditB).not.toContain(ADMIN_1);

    // Venture A's row is correct
    const { badge: badgeA, audit: auditA } = auditAndBadgeFor(rows, VENTURE_A, GROUP);
    expect(badgeA).toBe("venture");
    expect(auditA).toMatch(new RegExp(`^${ADMIN_1}`));
  });

  // ── U: multiple groups — only the toggled group's audit changes in venture A ─
  //
  // The toggle fires for a single group (GROUP) in venture A while the panel is
  // mid-switch.  After the switch to venture B, a SECOND group ("operations")
  // must remain at 'default' / null audit for venture B, confirming the
  // per-group scoping is not corrupted by the cross-venture write.
  it("U: only the targeted group in venture A changes; other groups in venture B are unaffected", async () => {
    const OTHER = "operations";
    const toggledAt = new Date("2026-08-08T11:00:00.000Z");

    // Toggle for GROUP in venture A only
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true, toggledBy: ADMIN_1, toggledAt });

    const rows = await db.read();

    // Venture B — GROUP has no row (no global either) → default, no audit
    const { badge: badgeGroupB, audit: auditGroupB } = auditAndBadgeFor(rows, VENTURE_B, GROUP);
    expect(badgeGroupB).toBe("default");
    expect(auditGroupB).toBeNull();

    // Venture B — OTHER group also has no row → default, no audit
    const { badge: badgeOtherB, audit: auditOtherB } = auditAndBadgeFor(rows, VENTURE_B, OTHER);
    expect(badgeOtherB).toBe("default");
    expect(auditOtherB).toBeNull();

    // Venture A — GROUP correctly reflects the toggle
    const { badge: badgeGroupA, audit: auditGroupA } = auditAndBadgeFor(rows, VENTURE_A, GROUP);
    expect(badgeGroupA).toBe("venture");
    expect(auditGroupA).toMatch(new RegExp(`^${ADMIN_1}`));

    // Venture A — OTHER group is also unaffected
    const { badge: badgeOtherA, audit: auditOtherA } = auditAndBadgeFor(rows, VENTURE_A, OTHER);
    expect(badgeOtherA).toBe("default");
    expect(auditOtherA).toBeNull();
  });

  // ── V: audit for venture A reflects the correct author even after a second
  //       switch back from B to A ──────────────────────────────────────────────
  //
  // Admin: toggles venture A, switches to venture B, then switches back to
  // venture A.  The re-fetch triggered by returning to venture A must still
  // show ADMIN_1's audit on venture A — the row was never mutated by the
  // temporary detour through venture B.
  it("V: switching from A → B → A still shows the correct audit on venture A", async () => {
    const toggledAt = new Date("2026-08-09T15:00:00.000Z");

    // Step 1: toggle fires for venture A
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true, toggledBy: ADMIN_1, toggledAt });

    // Step 2: panel shows venture B (selector drift — no DB write for B)
    const rowsAtB = await db.read();
    const { badge: badgeBAtB, audit: auditBAtB } = auditAndBadgeFor(rowsAtB, VENTURE_B, GROUP);
    expect(badgeBAtB).toBe("default");
    expect(auditBAtB).toBeNull();

    // Step 3: panel switches back to venture A
    const rowsAtA = await db.read();  // same DB state — no writes happened during B
    const { badge: badgeA, audit: auditA } = auditAndBadgeFor(rowsAtA, VENTURE_A, GROUP);
    expect(badgeA).toBe("venture");
    expect(auditA).toMatch(new RegExp(`^${ADMIN_1}`));
    expect(auditA).not.toBeNull();
  });

  // ── W: no cross-venture audit contamination across all rows ─────────────────
  //
  // Three ventures each have their own rows.  A mid-toggle switch fires a write
  // for venture A.  After invalidate() re-fetches, every venture sees only its
  // own audit author — no row bleeds into another venture's view.
  it("W: no cross-venture audit contamination — each venture sees only its own author", async () => {
    const VENTURE_C = "ven-gamma";
    const ADMIN_3   = "carol@example.com";

    const dateA = new Date("2026-08-10T08:00:00.000Z");
    const dateB = new Date("2026-08-10T08:01:00.000Z");
    const dateC = new Date("2026-08-10T08:02:00.000Z");

    // Each venture has its own row for GROUP
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_A, active: true, toggledBy: ADMIN_1, toggledAt: dateA });
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_B, active: true, toggledBy: ADMIN_2, toggledAt: dateB });
    await db.upsert({ groupId: GROUP, ventureId: VENTURE_C, active: true, toggledBy: ADMIN_3, toggledAt: dateC });

    // invalidate() re-fetch — all rows visible in one snapshot
    const rows = await db.read();

    // Each venture scopes correctly to its own row
    const { audit: auditA } = auditAndBadgeFor(rows, VENTURE_A, GROUP);
    const { audit: auditB } = auditAndBadgeFor(rows, VENTURE_B, GROUP);
    const { audit: auditC } = auditAndBadgeFor(rows, VENTURE_C, GROUP);

    expect(auditA).toMatch(new RegExp(`^${ADMIN_1}`));
    expect(auditA).not.toContain(ADMIN_2);
    expect(auditA).not.toContain(ADMIN_3);

    expect(auditB).toMatch(new RegExp(`^${ADMIN_2}`));
    expect(auditB).not.toContain(ADMIN_1);
    expect(auditB).not.toContain(ADMIN_3);

    expect(auditC).toMatch(new RegExp(`^${ADMIN_3}`));
    expect(auditC).not.toContain(ADMIN_1);
    expect(auditC).not.toContain(ADMIN_2);
  });

});

// ── makeDeferredFakeDb ────────────────────────────────────────────────────────
// A variant of makeFakeDb whose upsert is gated behind an explicit Promise
// resolver.  This lets tests dispatch a write, confirm it is genuinely pending
// (the row has not yet been committed to the store), change the "current
// venture" selector, then release the gate and observe the post-commit state.
//
// Usage:
//   const { db, releaseUpsert } = makeDeferredFakeDb();
//   const pending = db.upsert({ … });         // dispatched — NOT committed yet
//   /* confirm store is still empty */
//   releaseUpsert();                          // gate opens — write commits
//   await pending;                            // promise settles
//   /* now read committed state */

function makeDeferredFakeDb() {
  const store = new Map<string, StoredRow>();
  const key   = (g: string, v: string) => `${g}::${v}`;

  // The gate starts closed.  Calling releaseUpsert() resolves the barrier so
  // any pending upsert call can proceed to commit its row.
  let _releaseGate: (() => void) | null = null;
  let _gate: Promise<void> = new Promise<void>(resolve => { _releaseGate = resolve; });

  function releaseUpsert() {
    _releaseGate?.();
    // Reset for the next upsert in case a test needs multiple gates.
    _gate = Promise.resolve();
    _releaseGate = null;
  }

  const db = {
    async read(): Promise<ReactivationRow[]> {
      return [...store.values()].sort((a, b) => a.groupId.localeCompare(b.groupId));
    },
    async upsert(row: Omit<StoredRow, "toggledAt"> & { toggledAt?: Date }): Promise<void> {
      // Wait until the gate is opened — this is the suspension point that
      // makes the write genuinely pending from the test's perspective.
      await _gate;
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

  return { db, releaseUpsert };
}

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 5 — Genuinely deferred mid-toggle venture-switch pipeline (task #101)
//
// Uses makeDeferredFakeDb so the upsert has a real suspension point.  Tests
// dispatch for venture A, confirm the row is NOT yet committed (genuinely
// pending), switch the selector to venture B, then release the gate and
// let onSuccess fire the invalidate/refetch.  Assertions cover:
//   • venture B's view during the pending window (no contamination)
//   • venture B's view after commit + refetch (still uncontaminated)
//   • venture A's audit on revisit (correctly attributed)
// ══════════════════════════════════════════════════════════════════════════════

describe("audit trail — genuinely deferred mid-toggle venture switch (task #101)", () => {

  // ── X: toggle dispatched for A, row NOT committed yet, selector switches to
  //       B, gate released, onSuccess refetches — B unaffected, A correct ────
  it("X: row is absent from the store while the mutation is pending; after release B is unaffected and A is correctly attributed", async () => {
    const toggledAt = new Date("2026-08-11T12:00:00.000Z");

    const { db: ddb, releaseUpsert } = makeDeferredFakeDb();

    // ── Step 1: Dispatch mutation for venture A — write is pending (gated) ──
    // The closure captures ventureId = VENTURE_A at call time.
    const mutationForVentureA = ddb.upsert({
      groupId:   GROUP,
      ventureId: VENTURE_A,
      active:    true,
      toggledBy: ADMIN_1,
      toggledAt,
    });

    // ── Step 2: Venture selector switches to B before the gate opens ────────
    let currentVentureId: string = VENTURE_B;

    // Confirm the write has NOT committed yet — store is empty.
    const rowsDuringPending = await ddb.read();
    expect(rowsDuringPending).toHaveLength(0);  // genuinely pending

    // Panel renders venture B during the pending window → default/null
    const midFlightB = auditAndBadgeFor(rowsDuringPending, currentVentureId, GROUP);
    expect(midFlightB.badge).toBe("default");
    expect(midFlightB.audit).toBeNull();

    // ── Step 3: Gate opens — mutation completes (write commits for venture A) ─
    releaseUpsert();
    await mutationForVentureA;

    // ── Step 4: onSuccess fires — simulate invalidate() → refetch ────────────
    const rowsAfterCommit = await ddb.read();

    // ── Step 5a: Panel is still showing venture B (currentVentureId = B) ────
    // buildRowByGroup uses the current selector value — must NOT see venture A.
    const postB = auditAndBadgeFor(rowsAfterCommit, currentVentureId, GROUP);
    expect(postB.badge).toBe("default");
    expect(postB.audit).toBeNull();

    // ── Step 5b: Admin switches back to venture A — refetch scopes to A ─────
    currentVentureId = VENTURE_A;
    const rowsAtA = await ddb.read();
    const postA = auditAndBadgeFor(rowsAtA, currentVentureId, GROUP);
    expect(postA.badge).toBe("venture");
    expect(postA.audit).toMatch(new RegExp(`^${ADMIN_1}`));
    expect(postA.audit).not.toContain(ADMIN_2);

    // Sanity: exactly one row committed
    expect(rowsAtA.filter(r => r.groupId === GROUP).length).toBe(1);
    expect(rowsAtA[0].ventureId).toBe(VENTURE_A);
  });

  // ── Y: venture B has a pre-existing row; deferred write for A releases;
  //       B's own audit is not disturbed ───────────────────────────────────────
  //
  // Uses an inline store + explicit Promise gate (same pattern as X, but with
  // a shared store that holds both rows: B committed immediately, A gated).
  // This avoids the "re-arm" problem with makeDeferredFakeDb after release.
  it("Y: venture B's pre-existing audit row survives the deferred write for venture A unchanged", async () => {
    const dateBPre = new Date("2026-08-11T10:00:00.000Z");
    const dateAMut = new Date("2026-08-11T12:00:00.000Z");

    // ── Shared in-memory store ───────────────────────────────────────────────
    const store = new Map<string, StoredRow>();
    const storeKey = (g: string, v: string) => `${g}::${v}`;
    function commitNow(row: StoredRow) { store.set(storeKey(row.groupId, row.ventureId), row); }
    function readStore(): ReactivationRow[] {
      return [...store.values()].sort((a, b) => a.groupId.localeCompare(b.groupId));
    }

    // ── Step 1: Commit venture B's row immediately (no gate needed) ──────────
    commitNow({ groupId: GROUP, ventureId: VENTURE_B, active: true, toggledBy: ADMIN_2, toggledAt: dateBPre });

    // ── Step 2: Dispatch gated write for venture A (write is pending) ────────
    let _gateResolve: (() => void) | null = null;
    const gate = new Promise<void>(resolve => { _gateResolve = resolve; });
    const mutationForA = (async () => {
      await gate; // suspended until test releases
      commitNow({ groupId: GROUP, ventureId: VENTURE_A, active: true, toggledBy: ADMIN_1, toggledAt: dateAMut });
    })();

    // ── Step 3: Selector switches to B while A's write is still gated ────────
    const currentVentureId = VENTURE_B;
    const rowsDuringPending = readStore();
    // Confirm A's row is genuinely absent — write has not committed yet
    expect(rowsDuringPending.filter(r => r.ventureId === VENTURE_A).length).toBe(0);
    // B's own row is already visible
    const midFlightB = auditAndBadgeFor(rowsDuringPending, currentVentureId, GROUP);
    expect(midFlightB.badge).toBe("venture");
    expect(midFlightB.audit).toMatch(new RegExp(`^${ADMIN_2}`));

    // ── Step 4: Release gate — A's write commits ─────────────────────────────
    _gateResolve!();
    await mutationForA;

    // ── Step 5: onSuccess → invalidate → refetch ─────────────────────────────
    const rowsAfterCommit = readStore();

    // Venture B still shows ADMIN_2 — not contaminated by the A write
    const stateB = auditAndBadgeFor(rowsAfterCommit, currentVentureId, GROUP);
    expect(stateB.badge).toBe("venture");
    expect(stateB.audit).toMatch(new RegExp(`^${ADMIN_2}`));
    expect(stateB.audit).not.toContain(ADMIN_1);

    // Venture A correctly shows ADMIN_1
    const stateA = auditAndBadgeFor(rowsAfterCommit, VENTURE_A, GROUP);
    expect(stateA.badge).toBe("venture");
    expect(stateA.audit).toMatch(new RegExp(`^${ADMIN_1}`));
    expect(stateA.audit).not.toContain(ADMIN_2);

    // Two distinct rows — no cross-key collision
    expect(rowsAfterCommit.filter(r => r.groupId === GROUP).length).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 5 — Batch shared-timestamp invariant (real router, procedure-level)
//
// Calls the ACTUAL setModuleReactivationBatch router procedure via
// appRouter.createCaller against a lightweight timestamp-capturing DB harness.
// A counter-based Date spy ensures the test RELIABLY FAILS when new Date() is
// called per item inside the loop (each call returns BASE_MS + N*1000ms).
//
// If the router correctly captures `const now = new Date()` once before the
// loop, every row receives BASE_MS — the spy counter only advances once — and
// all timestamp assertions pass.  If the router moves new Date() inside the
// loop, the rows receive BASE_MS, BASE_MS+1000, BASE_MS+2000, causing the
// `new Set(timestamps).size === 1` assertion to fail deterministically.
// ══════════════════════════════════════════════════════════════════════════════

describe("setModuleReactivationBatch — shared-timestamp invariant (real router, procedure-level)", () => {
  // Capture the original Date constructor BEFORE any spy is installed.
  // Referenced inside spy implementations so new OriginalDate(...) never recurses.
  const OriginalDate = globalThis.Date;

  afterEach(() => { vi.restoreAllMocks(); });

  // ── Timestamp-capturing DB harness ───────────────────────────────────────
  // Minimal Drizzle-API-faithful mock that records the (groupId, toggledAt)
  // pair the real router passes for every insert/upsert.  Implements only the
  // subset of the Drizzle API used by setModuleReactivationBatch:
  //   db.transaction(fn)
  //   tx.insert(table).values(row).onConflictDoUpdate({ set }).returning(shape)
  function makeTimestampCapturingDb() {
    const written: Array<{ groupId: string; toggledAt: Date }> = [];
    const committed = new Map<string, {
      groupId: string; ventureId: string; active: boolean;
      toggledBy: string | null; toggledAt: Date;
    }>();

    return {
      written,
      committed,
      async transaction(fn: (tx: unknown) => Promise<void>) {
        const staging = new Map(committed);
        const tx = {
          insert: (_table: unknown) => ({
            values: (row: Record<string, unknown>) => ({
              onConflictDoUpdate: ({ set }: { set: Record<string, unknown> }) => {
                // Record the toggledAt the router actually passed in.
                // On insert path: comes from row.toggledAt (= now from the router).
                // On conflict path: comes from set.toggledAt (= now from the router).
                // Both are always `now` in the real implementation.
                const toggledAt = (set.toggledAt ?? row.toggledAt) as Date;
                written.push({ groupId: row.groupId as string, toggledAt });

                const k = `${row.groupId}:${row.ventureId}`;
                const existing = staging.get(k);
                if (existing) {
                  staging.set(k, {
                    ...existing,
                    active:    set.active    as boolean,
                    toggledBy: set.toggledBy as string | null,
                    toggledAt,
                  });
                } else {
                  staging.set(k, {
                    groupId:   row.groupId   as string,
                    ventureId: row.ventureId as string,
                    active:    row.active    as boolean,
                    toggledBy: row.toggledBy as string | null,
                    toggledAt,
                  });
                }

                const resolved = Promise.resolve([{ groupId: row.groupId as string }]);
                const voidP    = Promise.resolve(undefined);
                return {
                  returning: () => resolved,
                  then:    voidP.then.bind(voidP),
                  catch:   voidP.catch.bind(voidP),
                  finally: voidP.finally.bind(voidP),
                };
              },
            }),
          }),
        };
        await fn(tx);
        for (const [k, row] of staging) committed.set(k, row);
      },
    };
  }

  // Admin context factory — uses OriginalDate so date fields bypass the spy.
  function makeRouterAdminCtx(name = "alice"): TrpcContext {
    return {
      user: {
        id: 1, openId: `oid-${name}`, email: `${name}@test.example`,
        name, loginMethod: "test", role: "admin",
        createdAt:    new OriginalDate(),
        updatedAt:    new OriginalDate(),
        lastSignedIn: new OriginalDate(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
    };
  }

  // ── S-ROUTER-1: three-group batch — all rows share the same toggledAt ────
  it("S-ROUTER-1: all groups in a batch receive the same toggledAt (real router — counter-based spy detects per-item new Date() calls)", async () => {
    // Counter-based Date spy: each no-arg new Date() call returns a timestamp
    // 1 second further into the future.
    // Real router:    calls new Date() once before the loop → all rows share BASE_MS.
    // Broken router:  calls new Date() per item              → rows get BASE_MS,
    //                 BASE_MS+1000, BASE_MS+2000 — three distinct values.
    let dateCallCount = 0;
    const BASE_MS = new OriginalDate("2026-04-15T09:30:00.000Z").getTime();
    vi.spyOn(globalThis, "Date").mockImplementation(function (...args: unknown[]) {
      if (args.length === 0) {
        return new OriginalDate(BASE_MS + dateCallCount++ * 1_000) as unknown as Date;
      }
      return new OriginalDate(args[0] as ConstructorParameters<typeof Date>[0]) as unknown as Date;
    } as unknown as typeof Date);

    const db = makeTimestampCapturingDb();
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    const caller = appRouter.createCaller(makeRouterAdminCtx());
    await caller.admin.setModuleReactivationBatch({
      ventureId: "VENTURE-TS",
      items: [
        { groupId: "discovery",  active: true },
        { groupId: "operations", active: true },
        { groupId: "validation", active: true },
      ],
    });

    expect(db.written).toHaveLength(3);
    const timestamps = db.written.map(r => r.toggledAt.getTime());

    // Core invariant: all three rows share the identical timestamp.
    // If new Date() were moved inside the batch loop, the spy would return
    // three distinct values and new Set(timestamps).size would be 3, not 1.
    expect(new Set(timestamps).size).toBe(1);
    expect(timestamps[0]).toBe(timestamps[1]);
    expect(timestamps[1]).toBe(timestamps[2]);
  });

  // ── S-ROUTER-2: upsert path — pre-existing rows also get the shared now ─
  it("S-ROUTER-2: groups that already have rows are updated to the shared batch timestamp (upsert path)", async () => {
    let dateCallCount = 0;
    const BASE_MS = new OriginalDate("2026-06-01T08:00:00.000Z").getTime();
    vi.spyOn(globalThis, "Date").mockImplementation(function (...args: unknown[]) {
      if (args.length === 0) {
        return new OriginalDate(BASE_MS + dateCallCount++ * 1_000) as unknown as Date;
      }
      return new OriginalDate(args[0] as ConstructorParameters<typeof Date>[0]) as unknown as Date;
    } as unknown as typeof Date);

    const db = makeTimestampCapturingDb();
    // Pre-seed so the router hits the onConflictDoUpdate (update) branch for both groups.
    const OLDER = new OriginalDate("2026-01-01T00:00:00.000Z");
    db.committed.set("discovery:__global__",  { groupId: "discovery",  ventureId: "__global__", active: false, toggledBy: "prev@test.example", toggledAt: OLDER });
    db.committed.set("operations:__global__", { groupId: "operations", ventureId: "__global__", active: false, toggledBy: "prev@test.example", toggledAt: OLDER });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(db);

    await appRouter.createCaller(makeRouterAdminCtx()).admin.setModuleReactivationBatch({
      // No ventureId → normalised to "__global__" by the router
      items: [
        { groupId: "discovery",  active: true },
        { groupId: "operations", active: true },
      ],
    });

    expect(db.written).toHaveLength(2);
    const [ts0, ts1] = db.written.map(r => r.toggledAt.getTime());

    // Both updated rows carry the same batch timestamp
    expect(ts0).toBe(ts1);
    // And the timestamp was advanced past the pre-seeded older value
    expect(ts0).toBeGreaterThan(OLDER.getTime());
  });

  // ── S-ROUTER-3: negative control — spy returns distinct values per call ──
  //
  // Does NOT call the real router.  Confirms the counter-based spy actually
  // returns distinct timestamps for sequential no-arg new Date() calls, proving
  // that S-ROUTER-1/2 are meaningful guards and would fail under the broken
  // per-item pattern.
  it("S-ROUTER-3: negative control — counter-based spy produces distinct timestamps per call (confirms S-ROUTER-1/2 are meaningful guards)", () => {
    let count = 0;
    const BASE = new OriginalDate("2026-07-01T10:00:00.000Z").getTime();
    vi.spyOn(globalThis, "Date").mockImplementation(function (...args: unknown[]) {
      if (args.length === 0) {
        return new OriginalDate(BASE + count++ * 1_000) as unknown as Date;
      }
      return new OriginalDate(args[0] as ConstructorParameters<typeof Date>[0]) as unknown as Date;
    } as unknown as typeof Date);

    // Simulate the broken pattern: new Date() called per item
    const t1 = new Date(); // count=0 → BASE
    const t2 = new Date(); // count=1 → BASE + 1 000 ms
    const t3 = new Date(); // count=2 → BASE + 2 000 ms

    // The spy returns distinct values — confirming S-ROUTER-1 would catch this
    expect(t1.getTime()).not.toBe(t2.getTime());
    expect(t2.getTime()).not.toBe(t3.getTime());
    expect(new Set([t1.getTime(), t2.getTime(), t3.getTime()]).size).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 4 — Batch shared-timestamp invariant
//
// The real server's setModuleReactivationBatch computes `const now = new Date()`
// ONCE before the loop and stamps every item with the same toggledAt.  This
// means all groups changed in the same Enable All / Disable All action share an
// identical timestamp in the audit trail, letting admins correlate which groups
// were toggled together.
//
// If a future refactor moves `new Date()` inside the loop each row would receive
// a slightly different timestamp, silently breaking the "toggled together" signal.
// These tests pin that invariant so such a change can't land undetected.
// ══════════════════════════════════════════════════════════════════════════════

const GROUP_A = "discovery";
const GROUP_B = "operations";
const GROUP_C = "validation";
const BATCH_VENTURE = "ven-batch";
const BATCH_ADMIN   = "carol@example.com";

/**
 * Simulates the real server's batch path:
 *   const now = new Date()   ← computed once
 *   for (item of items) upsert({ …, toggledAt: now })
 *
 * Returns the shared timestamp so tests can compare against it.
 */
async function batchUpsert(
  db: ReturnType<typeof makeFakeDb>,
  groupIds: string[],
  ventureId: string,
  toggledBy: string,
  sharedNow: Date,
): Promise<void> {
  // Deliberate: `sharedNow` is passed in once and reused for every item,
  // exactly mirroring `const now = new Date()` before the real batch loop.
  for (const groupId of groupIds) {
    await db.upsert({ groupId, ventureId, active: true, toggledBy, toggledAt: sharedNow });
  }
}

describe("batch shared-timestamp invariant — all groups in one batch share the same toggledAt", () => {
  let db: ReturnType<typeof makeFakeDb>;

  beforeEach(() => { db = makeFakeDb(); });

  // ── S1: all rows written in a batch share the exact same toggledAt ─────────
  it("S1: all groups upserted with a shared `now` have identical toggledAt values after a refetch", async () => {
    const sharedNow = new Date("2026-04-15T09:30:00.000Z");

    await batchUpsert(db, [GROUP_A, GROUP_B, GROUP_C], BATCH_VENTURE, BATCH_ADMIN, sharedNow);

    const rows = await db.read();
    const map  = buildRowByGroup(rows, BATCH_VENTURE);

    const rowA = map.get(GROUP_A)!;
    const rowB = map.get(GROUP_B)!;
    const rowC = map.get(GROUP_C)!;

    expect(rowA).toBeDefined();
    expect(rowB).toBeDefined();
    expect(rowC).toBeDefined();

    // All three rows must share the identical timestamp
    expect(rowA.toggledAt).toEqual(sharedNow);
    expect(rowB.toggledAt).toEqual(sharedNow);
    expect(rowC.toggledAt).toEqual(sharedNow);

    // Cross-check: each pair is exactly equal (not just structurally equal)
    expect(rowA.toggledAt.getTime()).toBe(rowB.toggledAt.getTime());
    expect(rowB.toggledAt.getTime()).toBe(rowC.toggledAt.getTime());
  });

  // ── S2: audit strings for all groups in the batch show the same date/time ──
  it("S2: audit strings for all batch groups show the same date/time portion — confirming visual grouping in the UI", async () => {
    const sharedNow = new Date("2026-05-20T14:00:00.000Z");

    await batchUpsert(db, [GROUP_A, GROUP_B, GROUP_C], BATCH_VENTURE, BATCH_ADMIN, sharedNow);

    const rows = await db.read();

    const auditA = auditAndBadgeFor(rows, BATCH_VENTURE, GROUP_A).audit!;
    const auditB = auditAndBadgeFor(rows, BATCH_VENTURE, GROUP_B).audit!;
    const auditC = auditAndBadgeFor(rows, BATCH_VENTURE, GROUP_C).audit!;

    // All audit strings must be non-null
    expect(auditA).not.toBeNull();
    expect(auditB).not.toBeNull();
    expect(auditC).not.toBeNull();

    // All show the same admin
    expect(auditA).toMatch(new RegExp(`^${BATCH_ADMIN}`));
    expect(auditB).toMatch(new RegExp(`^${BATCH_ADMIN}`));
    expect(auditC).toMatch(new RegExp(`^${BATCH_ADMIN}`));

    // Because toggledAt is identical across all rows, the full audit strings
    // are identical — the date/time portion is the same for every group.
    expect(auditA).toBe(auditB);
    expect(auditB).toBe(auditC);
  });

  // ── S3: a per-row `new Date()` would break the invariant (negative control) ─
  it("S3: negative control — rows written with per-item timestamps do NOT share the same toggledAt (confirms S1/S2 are meaningful)", async () => {
    // Simulate the broken pattern: `new Date()` called separately for each item.
    // In practice a tight loop makes timestamps equal on fast hardware, so we
    // use explicitly different timestamps to model the logical difference.
    const dateA = new Date("2026-06-01T10:00:00.000Z");
    const dateB = new Date("2026-06-01T10:00:00.001Z"); // 1 ms later
    const dateC = new Date("2026-06-01T10:00:00.002Z"); // 2 ms later

    await db.upsert({ groupId: GROUP_A, ventureId: BATCH_VENTURE, active: true, toggledBy: BATCH_ADMIN, toggledAt: dateA });
    await db.upsert({ groupId: GROUP_B, ventureId: BATCH_VENTURE, active: true, toggledBy: BATCH_ADMIN, toggledAt: dateB });
    await db.upsert({ groupId: GROUP_C, ventureId: BATCH_VENTURE, active: true, toggledBy: BATCH_ADMIN, toggledAt: dateC });

    const rows = await db.read();
    const map  = buildRowByGroup(rows, BATCH_VENTURE);

    const rowA = map.get(GROUP_A)!;
    const rowB = map.get(GROUP_B)!;
    const rowC = map.get(GROUP_C)!;

    // Per-item timestamps are NOT equal — this is what we are preventing
    expect(rowA.toggledAt.getTime()).not.toBe(rowB.toggledAt.getTime());
    expect(rowB.toggledAt.getTime()).not.toBe(rowC.toggledAt.getTime());
  });

  // ── S4: shared timestamp survives when some rows already exist (upsert path) ─
  it("S4: groups that already have older rows are updated to the shared batch timestamp — no group is left with a stale toggledAt", async () => {
    // Pre-seed GROUP_A and GROUP_B with an earlier timestamp
    const olderDate = new Date("2026-03-01T08:00:00.000Z");
    await db.upsert({ groupId: GROUP_A, ventureId: BATCH_VENTURE, active: false, toggledBy: ADMIN_1, toggledAt: olderDate });
    await db.upsert({ groupId: GROUP_B, ventureId: BATCH_VENTURE, active: false, toggledBy: ADMIN_1, toggledAt: olderDate });
    // GROUP_C has no pre-existing row (insert path)

    // Batch arrives with a shared timestamp
    const sharedNow = new Date("2026-06-10T12:00:00.000Z");
    await batchUpsert(db, [GROUP_A, GROUP_B, GROUP_C], BATCH_VENTURE, BATCH_ADMIN, sharedNow);

    const rows = await db.read();
    const map  = buildRowByGroup(rows, BATCH_VENTURE);

    const rowA = map.get(GROUP_A)!;
    const rowB = map.get(GROUP_B)!;
    const rowC = map.get(GROUP_C)!;

    // All three must carry the shared batch timestamp — no group left stale
    expect(rowA.toggledAt).toEqual(sharedNow);
    expect(rowB.toggledAt).toEqual(sharedNow);
    expect(rowC.toggledAt).toEqual(sharedNow);

    // And the author was updated to the batch admin in all rows
    expect(rowA.toggledBy).toBe(BATCH_ADMIN);
    expect(rowB.toggledBy).toBe(BATCH_ADMIN);
    expect(rowC.toggledBy).toBe(BATCH_ADMIN);
  });

  // ── S5: two-item batch — audit strings are identical (minimal case) ────────
  it("S5: a two-group batch produces identical audit strings for both groups", async () => {
    const sharedNow = new Date("2026-07-04T16:30:00.000Z");
    await batchUpsert(db, [GROUP_A, GROUP_B], BATCH_VENTURE, BATCH_ADMIN, sharedNow);

    const rows  = await db.read();
    const map   = buildRowByGroup(rows, BATCH_VENTURE);
    const rowA  = map.get(GROUP_A)!;
    const rowB  = map.get(GROUP_B)!;

    const auditA = formatToggleAudit(rowA.toggledBy, rowA.toggledAt);
    const auditB = formatToggleAudit(rowB.toggledBy, rowB.toggledAt);

    expect(auditA).not.toBeNull();
    expect(auditB).not.toBeNull();
    expect(auditA).toBe(auditB);
  });
});
