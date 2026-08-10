/**
 * @vitest-environment happy-dom
 *
 * ExtendedBacklogSection — header source-badge rendering tests (Task #75)
 *
 * Verifies that the section header renders the correct badge pill (or no badge)
 * for each of the five possible badge states produced by resolveModuleBadge:
 *
 *   "loading"  → no badge element rendered while the query is in-flight
 *   "unknown"  → no badge element rendered when the query errored
 *   "default"  → grey  DEFAULT pill; aria-label "No override set; system default applies"
 *   "global"   → amber GLOBAL  pill; aria-label "Enabled by a global rule"
 *   "venture"  → green VENTURE pill; aria-label "Enabled by a venture-specific override"
 *
 * Strategy
 * --------
 * We render the real production ExtendedBacklogSection with explicit props so no
 * hook mocking is required.  The component is opened by supplying a `location` that
 * matches an item inside the activated group ("venture-intake" → "/intake"), which
 * causes `hasActiveItem=true` and therefore `open=true` on the initial render.
 *
 * The badge is passed as a prop from ExtendedBacklogSection to NavGroupSection,
 * which renders it inline in the group header.  We query by aria-label — the same
 * attribute the production component sets — so the assertions survive visual
 * refactors that change className or style without changing semantics.
 *
 * Colour tokens are verified via the inline `style` attribute rather than via
 * Tailwind class names, because the badge styling is applied inline (consistent
 * with the production component's approach).
 */

import React, { useState, useCallback } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { Router } from "wouter";

import { ExtendedBacklogSection, ReactivationPanel } from "./Sidebar";
import type { ReactivationRow } from "@/lib/gate4Utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Wrap in a Router so <Link> components inside NavGroupSection resolve correctly. */
function renderInRouter(ui: React.ReactElement) {
  return render(React.createElement(Router, { base: "" }, ui));
}

/** Row factories (mirrors the style used by gate4.moduleBadge.test.ts). */
function globalRow(groupId: string, active = true): ReactivationRow {
  return { groupId, ventureId: "__global__", active, toggledBy: null, toggledAt: new Date() };
}
function ventureRow(groupId: string, ventureId: string, active = true): ReactivationRow {
  return { groupId, ventureId, active, toggledBy: null, toggledAt: new Date() };
}

/**
 * The "venture-intake" group is the first backlog group. Its item hrefs include
 * "/intake", so passing location="/intake" with isActivated returning true for
 * "venture-intake" gives hasActiveItem=true, which initialises open=true and
 * renders the group header with its badge.
 */
const TARGET_GROUP = "venture-intake";
const TARGET_LOCATION = "/intake";
const VENTURE_ID = "ven-alpha";

/** isActivated stub: only the target group is active so only one header renders. */
const onlyTargetActive = (id: string) => id === TARGET_GROUP;

// ── Tests ─────────────────────────────────────────────────────────────────────

afterEach(() => {
  cleanup();
});

describe("ExtendedBacklogSection — header source badge", () => {
  // ── loading state ──────────────────────────────────────────────────────────
  describe("when the query is still loading (isLoading=true)", () => {
    it("renders no badge element — must not falsely label the header DEFAULT while data is in-flight", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: onlyTargetActive,
          rows:        [],
          isLoading:   true,
          isError:     false,
          ventureId:   null,
        }),
      );

      // None of the badge aria-labels should be present
      expect(screen.queryByLabelText("No override set; system default applies")).toBeNull();
      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();
      expect(screen.queryByLabelText("Enabled by a venture-specific override")).toBeNull();
    });

    it("renders no badge when a global row is present but query is still loading (data may be stale cache)", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: onlyTargetActive,
          rows:        [globalRow(TARGET_GROUP)],
          isLoading:   true,
          isError:     false,
          ventureId:   VENTURE_ID,
        }),
      );

      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();
      expect(screen.queryByLabelText("No override set; system default applies")).toBeNull();
    });
  });

  // ── unknown / error state ──────────────────────────────────────────────────
  describe("when the query resolved with an error (isError=true)", () => {
    it("renders no badge element — must not assert DEFAULT when the server is unreachable", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: onlyTargetActive,
          rows:        [],
          isLoading:   false,
          isError:     true,
          ventureId:   null,
        }),
      );

      expect(screen.queryByLabelText("No override set; system default applies")).toBeNull();
      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();
      expect(screen.queryByLabelText("Enabled by a venture-specific override")).toBeNull();
    });

    it("renders no badge when rows are present but the query also has an error flag", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: onlyTargetActive,
          rows:        [globalRow(TARGET_GROUP)],
          isLoading:   false,
          isError:     true,
          ventureId:   VENTURE_ID,
        }),
      );

      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();
    });
  });

  // ── default state ──────────────────────────────────────────────────────────
  describe("when the query settled successfully but no DB row exists (default state)", () => {
    it("renders a DEFAULT pill with the correct aria-label", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: onlyTargetActive,
          rows:        [],          // no rows at all → resolveModuleBadge → "default"
          isLoading:   false,
          isError:     false,
          ventureId:   null,
        }),
      );

      // With no rows, both ON and OFF groups show DEFAULT.  Use getAllByLabelText
      // and verify at least one badge is present with the correct text.
      const badges = screen.getAllByLabelText("No override set; system default applies");
      expect(badges.length).toBeGreaterThan(0);
      expect(badges[0].textContent).toBe("DEFAULT");
    });

    it("DEFAULT badge uses the grey colour tokens (rgba white palette, not amber or green)", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: onlyTargetActive,
          rows:        [],
          isLoading:   false,
          isError:     false,
          ventureId:   null,
        }),
      );

      // Multiple DEFAULT badges are present (ON and OFF groups with no rows all show DEFAULT).
      const badge = screen.getAllByLabelText("No override set; system default applies")[0];
      const style = (badge as HTMLElement).getAttribute("style") ?? "";

      // Must contain a neutral white-based colour (not amber 245,158,11 or green 86,168,55).
      // The browser normalises rgba() to include spaces after commas.
      expect(style).toContain("rgba(255, 255, 255, 0.06)");  // background
      expect(style).toContain("rgba(255, 255, 255, 0.28)");  // color
      expect(style).toContain("rgba(255, 255, 255, 0.1)");   // border
    });

    it("does not render GLOBAL or VENTURE badges when state is default", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: onlyTargetActive,
          rows:        [],
          isLoading:   false,
          isError:     false,
          ventureId:   null,
        }),
      );

      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();
      expect(screen.queryByLabelText("Enabled by a venture-specific override")).toBeNull();
    });
  });

  // ── global state ───────────────────────────────────────────────────────────
  describe("when the most-specific row is a __global__ row", () => {
    it("renders a GLOBAL pill with the correct aria-label", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: onlyTargetActive,
          rows:        [globalRow(TARGET_GROUP)],
          isLoading:   false,
          isError:     false,
          ventureId:   null,          // global scope: no venture selected
        }),
      );

      const badge = screen.getByLabelText("Enabled by a global rule");
      expect(badge).toBeDefined();
      expect(badge.textContent).toBe("GLOBAL");
    });

    it("GLOBAL badge uses the amber colour tokens", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: onlyTargetActive,
          rows:        [globalRow(TARGET_GROUP)],
          isLoading:   false,
          isError:     false,
          ventureId:   null,
        }),
      );

      const badge = screen.getByLabelText("Enabled by a global rule");
      const style = (badge as HTMLElement).getAttribute("style") ?? "";

      // Amber palette: 245,158,11 — browser normalises to space-after-comma form.
      expect(style).toContain("rgba(245, 158, 11, 0.15)");  // background
      expect(style).toContain("rgba(245, 158, 11, 0.8)");   // color
      expect(style).toContain("rgba(245, 158, 11, 0.3)");   // border
    });

    it("renders GLOBAL (not VENTURE) when viewing a venture that has no venture-specific override", () => {
      // When a venture is selected but has no per-venture row, the global row is still
      // the most-specific source and the header badge must read GLOBAL, not VENTURE.
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: onlyTargetActive,
          rows:        [globalRow(TARGET_GROUP)],  // no venture row
          isLoading:   false,
          isError:     false,
          ventureId:   VENTURE_ID,
        }),
      );

      expect(screen.getByLabelText("Enabled by a global rule").textContent).toBe("GLOBAL");
      expect(screen.queryByLabelText("Enabled by a venture-specific override")).toBeNull();
    });

    it("does not render a VENTURE badge when state is global", () => {
      // With onlyTargetActive, other groups are OFF with no rows → they show DEFAULT.
      // The meaningful assertion is that no VENTURE badge appears, since TARGET_GROUP's
      // most-specific row is a global rule (not venture-specific).
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: onlyTargetActive,
          rows:        [globalRow(TARGET_GROUP)],
          isLoading:   false,
          isError:     false,
          ventureId:   null,
        }),
      );

      expect(screen.queryByLabelText("Enabled by a venture-specific override")).toBeNull();
    });
  });

  // ── venture state ──────────────────────────────────────────────────────────
  describe("when the most-specific row is a venture-specific row", () => {
    it("renders a VENTURE pill with the correct aria-label", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: onlyTargetActive,
          rows:        [ventureRow(TARGET_GROUP, VENTURE_ID)],
          isLoading:   false,
          isError:     false,
          ventureId:   VENTURE_ID,
        }),
      );

      const badge = screen.getByLabelText("Enabled by a venture-specific override");
      expect(badge).toBeDefined();
      expect(badge.textContent).toBe("VENTURE");
    });

    it("VENTURE badge uses the green colour tokens", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: onlyTargetActive,
          rows:        [ventureRow(TARGET_GROUP, VENTURE_ID)],
          isLoading:   false,
          isError:     false,
          ventureId:   VENTURE_ID,
        }),
      );

      const badge = screen.getByLabelText("Enabled by a venture-specific override");
      const style = (badge as HTMLElement).getAttribute("style") ?? "";

      // Green palette: 86,168,55 — browser normalises to space-after-comma form.
      expect(style).toContain("rgba(86, 168, 55, 0.13)");   // background
      expect(style).toContain("rgba(86, 168, 55, 0.85)");   // color
      expect(style).toContain("rgba(86, 168, 55, 0.25)");   // border
    });

    it("renders VENTURE (not GLOBAL) even when a global row is also present — venture row takes precedence", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: onlyTargetActive,
          // Both rows present; venture must win per the precedence rule in buildRowByGroup
          rows:        [globalRow(TARGET_GROUP), ventureRow(TARGET_GROUP, VENTURE_ID)],
          isLoading:   false,
          isError:     false,
          ventureId:   VENTURE_ID,
        }),
      );

      expect(screen.getByLabelText("Enabled by a venture-specific override").textContent).toBe("VENTURE");
      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();
    });

    it("does not render a GLOBAL badge when state is venture", () => {
      // With onlyTargetActive, other groups are OFF with no rows → they show DEFAULT.
      // The meaningful assertion is that no GLOBAL badge appears, since TARGET_GROUP's
      // most-specific row is a venture override (not a global rule).
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: onlyTargetActive,
          rows:        [ventureRow(TARGET_GROUP, VENTURE_ID)],
          isLoading:   false,
          isError:     false,
          ventureId:   VENTURE_ID,
        }),
      );

      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();
    });
  });

  // ── locked (OFF) groups — source badge visible ────────────────────────────
  /**
   * Task #99
   *
   * When isActivated(id) === false the component renders a locked/greyed OFF
   * row.  Admins need to know WHY a group is OFF — was it never touched
   * (DEFAULT) or was it explicitly disabled by a global or venture-level
   * override (GLOBAL / VENTURE)?  The same resolveModuleBadge logic that
   * drives ON-group headers is now also applied to OFF rows.
   *
   * The source badge is shown beside the OFF pill using identical colour
   * tokens to the active-group badge so the visual language is consistent.
   *
   * We verify this with two groups in the same render:
   *   - TARGET_GROUP (venture-intake)   → activated   → badge rendered by NavGroupSection
   *   - LOCKED_GROUP (discovery)        → NOT activated → badge rendered inline in the locked row
   */
  describe("locked (OFF) groups show the source badge from the DB row", () => {
    const LOCKED_GROUP = "discovery";

    /**
     * isActivated: ALL groups active EXCEPT LOCKED_GROUP.
     *
     * Using (id) => id !== LOCKED_GROUP (rather than id === TARGET_GROUP)
     * makes LOCKED_GROUP the *only* OFF group in the render.  This lets us
     * use `getByLabelText` (singular) for badge types that only LOCKED_GROUP
     * should carry, without false positives from other OFF groups.
     */
    const allExceptLocked = (id: string) => id !== LOCKED_GROUP;

    it("shows a GLOBAL badge on a locked OFF row when a global DB row exists for it", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: allExceptLocked,
          // LOCKED_GROUP is the only OFF group and has a global row.
          // TARGET_GROUP and other ON groups have no rows → DEFAULT badges.
          rows:        [globalRow(LOCKED_GROUP)],
          isLoading:   false,
          isError:     false,
          ventureId:   null,
        }),
      );

      // Exactly one GLOBAL badge: LOCKED_GROUP's locked OFF row.
      const globalBadge = screen.getByLabelText("Enabled by a global rule");
      expect(globalBadge).toBeDefined();
      expect(globalBadge.textContent).toBe("GLOBAL");

      // No VENTURE badge — only a global row was provided for LOCKED_GROUP.
      expect(screen.queryByLabelText("Enabled by a venture-specific override")).toBeNull();
    });

    it("shows a VENTURE badge on a locked OFF row when a venture DB row exists for it", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: allExceptLocked,
          // LOCKED_GROUP is the only OFF group and has a venture row.
          rows:        [ventureRow(LOCKED_GROUP, VENTURE_ID)],
          isLoading:   false,
          isError:     false,
          ventureId:   VENTURE_ID,
        }),
      );

      // Exactly one VENTURE badge: LOCKED_GROUP's locked OFF row.
      const ventureBadge = screen.getByLabelText("Enabled by a venture-specific override");
      expect(ventureBadge).toBeDefined();
      expect(ventureBadge.textContent).toBe("VENTURE");

      // No GLOBAL badge — the venture row is the only row provided.
      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();
    });

    it("shows a DEFAULT badge on a locked OFF row when no DB row exists for it", () => {
      // Provide global rows for every group except LOCKED_GROUP so that
      // all ON-group badges are GLOBAL and only LOCKED_GROUP shows DEFAULT.
      // This isolates the DEFAULT badge on the locked OFF row.
      const rowsForOthers = [
        globalRow(TARGET_GROUP),
        // Other ON groups also get a global row to avoid their DEFAULT badges
        // polluting the DEFAULT count.  We only need the known BACKLOG groups;
        // the rows for non-backlog IDs are silently ignored by buildRowByGroup.
        globalRow("proposition"), globalRow("rnd"), globalRow("operations"),
        globalRow("gtm"), globalRow("sustainability"), globalRow("risk"),
        globalRow("scoring"), globalRow("investment"), globalRow("execution"),
        globalRow("coaching"), globalRow("collaboration"), globalRow("governance"),
        globalRow("people"),
      ];

      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: allExceptLocked,
          rows:        rowsForOthers,   // LOCKED_GROUP deliberately has no row
          isLoading:   false,
          isError:     false,
          ventureId:   null,
        }),
      );

      // Exactly one DEFAULT badge: LOCKED_GROUP's locked OFF row.
      const defaultBadge = screen.getByLabelText("No override set; system default applies");
      expect(defaultBadge).toBeDefined();
      expect(defaultBadge.textContent).toBe("DEFAULT");

      // No VENTURE badge — no venture rows were provided.
      expect(screen.queryByLabelText("Enabled by a venture-specific override")).toBeNull();
    });

    it("venture row takes precedence over global row for a locked OFF group", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: allExceptLocked,
          // LOCKED_GROUP has both a global and a venture row; venture must win.
          // TARGET_GROUP has only a global row (no venture row) → GLOBAL badge.
          rows:        [
            globalRow(TARGET_GROUP),
            globalRow(LOCKED_GROUP),
            ventureRow(LOCKED_GROUP, VENTURE_ID),
          ],
          isLoading:   false,
          isError:     false,
          ventureId:   VENTURE_ID,
        }),
      );

      // TARGET_GROUP (ON) → GLOBAL badge (from NavGroupSection, via global row)
      // LOCKED_GROUP (OFF) → venture row overwrites global → VENTURE badge on locked row
      expect(screen.getByLabelText("Enabled by a global rule").textContent).toBe("GLOBAL");
      expect(screen.getByLabelText("Enabled by a venture-specific override").textContent).toBe("VENTURE");
    });

    it("still shows the OFF text label on the locked row", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: allExceptLocked,
          rows:        [globalRow(LOCKED_GROUP)],
          isLoading:   false,
          isError:     false,
          ventureId:   null,
        }),
      );

      // LOCKED_GROUP is the only OFF group → exactly one OFF label.
      const offLabels = screen.getAllByText("OFF");
      expect(offLabels).toHaveLength(1);
    });

    it("shows no badge on a locked OFF row while the query is loading (isLoading=true)", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: allExceptLocked,
          rows:        [globalRow(LOCKED_GROUP)],
          isLoading:   true,   // indeterminate — must not show any badge
          isError:     false,
          ventureId:   null,
        }),
      );

      expect(screen.queryByLabelText("No override set; system default applies")).toBeNull();
      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();
      expect(screen.queryByLabelText("Enabled by a venture-specific override")).toBeNull();
    });

    it("shows no badge on a locked OFF row when the query errored (isError=true)", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: allExceptLocked,
          rows:        [globalRow(LOCKED_GROUP)],
          isLoading:   false,
          isError:     true,   // indeterminate — must not assert DEFAULT
          ventureId:   null,
        }),
      );

      expect(screen.queryByLabelText("No override set; system default applies")).toBeNull();
      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();
      expect(screen.queryByLabelText("Enabled by a venture-specific override")).toBeNull();
    });
  });

  // ── cross-state: no badge for indeterminate states ────────────────────────
  describe("badge presence invariant across all non-settled states", () => {
    it("neither loading nor error ever produces any badge pill element", () => {
      const states = [
        { isLoading: true,  isError: false },
        { isLoading: false, isError: true  },
        { isLoading: true,  isError: true  },
      ];

      for (const { isLoading, isError } of states) {
        const { unmount } = renderInRouter(
          React.createElement(ExtendedBacklogSection, {
            location:    TARGET_LOCATION,
            isActivated: onlyTargetActive,
            rows:        [globalRow(TARGET_GROUP), ventureRow(TARGET_GROUP, VENTURE_ID)],
            isLoading,
            isError,
            ventureId:   VENTURE_ID,
          }),
        );

        expect(screen.queryByLabelText("No override set; system default applies")).toBeNull();
        expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();
        expect(screen.queryByLabelText("Enabled by a venture-specific override")).toBeNull();

        unmount();
      }
    });
  });
});

// ── Integration: toggle in ReactivationPanel → badge in ExtendedBacklogSection ──
/**
 * Task #98
 *
 * These tests verify the end-to-end optimistic update path:
 *
 *   1. ReactivationPanel and ExtendedBacklogSection share the same rows /
 *      isActivated / reactivate / deactivate props (mirroring the production
 *      Sidebar, which derives all of these from a single useGate4Reactivation
 *      call).
 *
 *   2. Clicking a toggle button inside ReactivationPanel fires the shared
 *      reactivate / deactivate callback synchronously — no tRPC call, no
 *      server round-trip.
 *
 *   3. Because the shared rows and isActivated state updates in the same
 *      React render, ExtendedBacklogSection immediately reflects the new
 *      badge without a page reload.
 *
 * Design note — why groups start activated:
 * ─────────────────────────────────────────
 * ExtendedBacklogSection initialises its internal `open` flag once at mount
 * from `hasActiveItem` (a derived value that checks whether the current
 * location falls inside an activated group).  If the group starts OFF the
 * section is collapsed and the badge area is never rendered — assertions on
 * badge changes would always fail.
 *
 * To keep tests readable, groups start activated (section open, DEFAULT badge
 * visible) and we exercise badge TYPE changes caused by toggle clicks:
 *
 *   • DEFAULT → (section still open) → no badge  [after deactivate]
 *   • no badge → (section still open) → GLOBAL   [after re-activate, row injected]
 *   • GLOBAL   → VENTURE                          [after venture-scope re-activate]
 *   • VENTURE  → no badge                         [after deactivate]
 *
 * The TestHarness component plays the role of Sidebar: it owns the shared
 * state and wires both child components to it.  The toggle callbacks inject
 * a synthetic ReactivationRow (exactly as the production persist() helper
 * does) so the optimistic overlay mechanics are exercised.
 */
describe("toggle in ReactivationPanel → header badge in ExtendedBacklogSection (integration)", () => {
  /**
   * Shared-state harness that mirrors the production Sidebar wiring.
   *
   * TARGET_GROUP is always included in initialActivated so that
   * ExtendedBacklogSection opens on mount and badge assertions are visible.
   *
   * @param ventureId   null = global scope; a string = venture-specific scope.
   * @param initialRows Rows already present before any toggle fires.
   */
  function TestHarness({
    ventureId,
    initialRows = [],
  }: {
    ventureId: string | null;
    initialRows?: ReactivationRow[];
  }) {
    // TARGET_GROUP starts activated so the section opens and badges are visible.
    const [rows, setRows]           = useState<ReactivationRow[]>(initialRows);
    const [activated, setActivated] = useState<Set<string>>(new Set([TARGET_GROUP]));

    const isActivated = useCallback((id: string) => activated.has(id), [activated]);

    // Mirrors the production persist() optimistic overlay:
    //   1. Update the activated set immediately (no server needed).
    //   2. Inject a synthetic row so the badge reflects the write before any
    //      server refetch.  The row's ventureId matches the current scope
    //      (ventureId ?? "__global__"), replicating what persist() does.
    // Note: no nested act() here — fireEvent.click already runs inside act.
    const reactivate = useCallback(
      (groupId: string) => {
        const syntheticVId = ventureId ?? "__global__";
        setActivated(prev => new Set([...prev, groupId]));
        setRows(prev => {
          const filtered = prev.filter(
            r => !(r.groupId === groupId && r.ventureId === syntheticVId),
          );
          return [
            ...filtered,
            { groupId, ventureId: syntheticVId, active: true, toggledBy: null, toggledAt: new Date() },
          ];
        });
      },
      [ventureId],
    );

    const deactivate = useCallback(
      (groupId: string) => {
        const syntheticVId = ventureId ?? "__global__";
        setActivated(prev => { const s = new Set(prev); s.delete(groupId); return s; });
        setRows(prev => {
          const filtered = prev.filter(
            r => !(r.groupId === groupId && r.ventureId === syntheticVId),
          );
          return [
            ...filtered,
            { groupId, ventureId: syntheticVId, active: false, toggledBy: null, toggledAt: new Date() },
          ];
        });
      },
      [ventureId],
    );

    const noop = useCallback(() => {}, []);

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(ReactivationPanel, {
        onClose:               noop,
        ventureId,
        ventureName:           ventureId ? "Test Venture" : undefined,
        ventureColor:          undefined,
        venturesLoading:       false,
        rows,
        isLoading:             false,
        isError:               false,
        isActivated,
        reactivate,
        deactivate,
        reactivateAll:         noop,
        deactivateAll:         noop,
        resetToGlobalDefaults: noop,
      }),
      React.createElement(ExtendedBacklogSection, {
        location:    TARGET_LOCATION,
        isActivated,
        rows,
        isLoading:   false,
        isError:     false,
        ventureId,
      }),
    );
  }

  // ── global scope (ventureId = null) ───────────────────────────────────────

  describe("global scope (no venture selected)", () => {
    it("header badge transitions from DEFAULT to GLOBAL when the group is toggled OFF (deactivate injects a global row)", () => {
      // Start: TARGET_GROUP activated, no rows → DEFAULT badge visible in the
      // open section header.  Other groups are OFF with no rows, so multiple
      // DEFAULT badges exist; we use getAllByLabelText and check at least one.
      renderInRouter(React.createElement(TestHarness, { ventureId: null }));

      const startBadges = screen.getAllByLabelText("No override set; system default applies");
      expect(startBadges.length).toBeGreaterThan(0);
      expect(startBadges[0].textContent).toBe("DEFAULT");

      const toggleBtn = screen.getByTestId(`toggle-${TARGET_GROUP}`);

      // First click — the panel button shows "On", so clicking calls deactivate.
      // deactivate() injects a synthetic global row (active=false) so TARGET_GROUP's
      // locked row now shows GLOBAL.  Other groups with no rows still show DEFAULT.
      fireEvent.click(toggleBtn);
      expect(screen.getByLabelText("Enabled by a global rule").textContent).toBe("GLOBAL");
      // (DEFAULT badges from other OFF groups are intentionally not asserted null here)

      // Second click — group is now OFF so the button shows "Off"; clicking calls
      // reactivate.  A synthetic global row (active=true) is injected → GLOBAL badge
      // now appears on the re-activated ON row (via NavGroupSection).
      fireEvent.click(toggleBtn);
      expect(screen.getByLabelText("Enabled by a global rule").textContent).toBe("GLOBAL");
    });

    it("GLOBAL badge stays visible on the locked OFF row when an ON group with a GLOBAL row is toggled OFF", () => {
      // Start: TARGET_GROUP activated + pre-existing global row → GLOBAL badge.
      renderInRouter(
        React.createElement(TestHarness, {
          ventureId:   null,
          initialRows: [globalRow(TARGET_GROUP)],
        }),
      );

      expect(screen.getByLabelText("Enabled by a global rule").textContent).toBe("GLOBAL");

      // Toggle OFF — deactivate() re-injects a global row (active=false).
      // resolveModuleBadge ignores the active flag; the OFF locked row keeps
      // the GLOBAL badge so admins can see the rule that drove the deactivation.
      fireEvent.click(screen.getByTestId(`toggle-${TARGET_GROUP}`));

      // Only TARGET_GROUP has a global row → exactly one GLOBAL badge on its
      // locked row.  Other OFF groups with no rows show DEFAULT — not asserted.
      expect(screen.getByLabelText("Enabled by a global rule").textContent).toBe("GLOBAL");
      expect(screen.queryByLabelText("Enabled by a venture-specific override")).toBeNull();
    });

    it("GLOBAL badge is present in both OFF and ON states across a full toggle round-trip", () => {
      // Start: TARGET_GROUP activated, no rows → DEFAULT.
      renderInRouter(React.createElement(TestHarness, { ventureId: null }));

      const btn = screen.getByTestId(`toggle-${TARGET_GROUP}`);

      // ON → OFF: deactivate() injects global row (active=false) → GLOBAL on OFF row.
      fireEvent.click(btn);
      expect(screen.getByLabelText("Enabled by a global rule").textContent).toBe("GLOBAL");

      // OFF → ON: reactivate() injects global row (active=true) → GLOBAL on ON row.
      fireEvent.click(btn);
      expect(screen.getByLabelText("Enabled by a global rule").textContent).toBe("GLOBAL");

      // ON → OFF again: GLOBAL persists on the OFF row.
      fireEvent.click(btn);
      expect(screen.getByLabelText("Enabled by a global rule").textContent).toBe("GLOBAL");

      // OFF → ON again: GLOBAL persists on the ON row.
      fireEvent.click(btn);
      expect(screen.getByLabelText("Enabled by a global rule").textContent).toBe("GLOBAL");
    });
  });

  // ── venture scope (ventureId = VENTURE_ID) ────────────────────────────────

  describe("venture scope (a venture is selected)", () => {
    it("header badge transitions from DEFAULT to VENTURE when toggled OFF (deactivate injects venture row)", () => {
      // Start: TARGET_GROUP activated, no rows → DEFAULT badge.
      // Other groups are OFF with no rows → they also show DEFAULT.
      renderInRouter(React.createElement(TestHarness, { ventureId: VENTURE_ID }));

      const startBadges = screen.getAllByLabelText("No override set; system default applies");
      expect(startBadges.length).toBeGreaterThan(0);
      expect(startBadges[0].textContent).toBe("DEFAULT");

      const btn = screen.getByTestId(`toggle-${TARGET_GROUP}`);

      // Deactivate (ON → OFF): deactivate() injects a venture-scoped row (active=false).
      // TARGET_GROUP's locked row now shows VENTURE.  Other OFF groups with no
      // rows still show DEFAULT — not asserted here since they're unrelated.
      fireEvent.click(btn);
      expect(screen.getByLabelText("Enabled by a venture-specific override").textContent).toBe("VENTURE");
      // Only TARGET_GROUP has a row, so no GLOBAL badge is present.
      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();

      // Reactivate (OFF → ON): venture-scoped row (active=true) injected → VENTURE on ON row.
      fireEvent.click(btn);
      expect(screen.getByLabelText("Enabled by a venture-specific override").textContent).toBe("VENTURE");
      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();
    });

    it("badge switches from GLOBAL to VENTURE when toggled OFF in venture scope (venture row overwrites global)", () => {
      // Start: TARGET_GROUP ON with only a global row → GLOBAL badge.
      renderInRouter(
        React.createElement(TestHarness, {
          ventureId:   VENTURE_ID,
          initialRows: [globalRow(TARGET_GROUP)],
        }),
      );

      expect(screen.getByLabelText("Enabled by a global rule").textContent).toBe("GLOBAL");
      expect(screen.queryByLabelText("Enabled by a venture-specific override")).toBeNull();

      const btn = screen.getByTestId(`toggle-${TARGET_GROUP}`);

      // Deactivate (ON → OFF): deactivate() injects a venture row (active=false).
      // buildRowByGroup: global row is seeded, then venture row overwrites it →
      // resolveModuleBadge returns "venture" → VENTURE badge on OFF locked row.
      fireEvent.click(btn);
      expect(screen.getByLabelText("Enabled by a venture-specific override").textContent).toBe("VENTURE");
      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();

      // Reactivate (OFF → ON): venture row (active=true) injected → VENTURE on ON row.
      fireEvent.click(btn);
      expect(screen.getByLabelText("Enabled by a venture-specific override").textContent).toBe("VENTURE");
    });

    it("VENTURE badge stays visible on the locked OFF row when an ON group with a VENTURE row is toggled OFF", () => {
      renderInRouter(
        React.createElement(TestHarness, {
          ventureId:   VENTURE_ID,
          initialRows: [ventureRow(TARGET_GROUP, VENTURE_ID)],
        }),
      );

      expect(screen.getByLabelText("Enabled by a venture-specific override").textContent).toBe("VENTURE");

      // Deactivate — deactivate() re-injects a venture row (active=false).
      // The OFF locked row keeps the VENTURE badge so admins see the override.
      fireEvent.click(screen.getByTestId(`toggle-${TARGET_GROUP}`));

      // Only TARGET_GROUP has a venture row → exactly one VENTURE badge.
      // Other OFF groups with no rows show DEFAULT — not asserted here.
      expect(screen.getByLabelText("Enabled by a venture-specific override").textContent).toBe("VENTURE");
      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();
    });
  });

  // ── no server round-trip guarantee ────────────────────────────────────────

  describe("optimistic update requires no server round-trip", () => {
    it("badge update is visible synchronously after fireEvent.click without awaiting any promise", () => {
      // This test is the structural proof of the optimistic update guarantee.
      //
      // If the badge update required a tRPC refetch or any async step, the
      // assertion immediately after the second fireEvent.click would fail (the
      // badge would still be absent or DEFAULT while the refetch was in-flight).
      // Because it passes synchronously we know the update is purely driven by
      // the in-memory optimistic row overlay — no server response needed.
      renderInRouter(React.createElement(TestHarness, { ventureId: null }));

      // Confirm DEFAULT badge is present initially.  Multiple DEFAULT badges
      // exist (other OFF groups with no rows also show DEFAULT); verify at least one.
      const initialBadges = screen.getAllByLabelText("No override set; system default applies");
      expect(initialBadges.length).toBeGreaterThan(0);
      expect(initialBadges[0].textContent).toBe("DEFAULT");

      // Click 1 — deactivate (currently ON): section stays open; deactivate()
      // injects a global row (active=false) → GLOBAL badge on the OFF locked row.
      fireEvent.click(screen.getByTestId(`toggle-${TARGET_GROUP}`));
      // Click 2 — reactivate: global row (active=true) injected synchronously → GLOBAL badge on ON row.
      fireEvent.click(screen.getByTestId(`toggle-${TARGET_GROUP}`));

      // Assertion is synchronous — no waitFor, no findBy*, no await.
      expect(screen.getByLabelText("Enabled by a global rule").textContent).toBe("GLOBAL");
    });
  });
});
