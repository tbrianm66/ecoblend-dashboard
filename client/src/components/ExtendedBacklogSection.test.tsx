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

      const badge = screen.getByLabelText("No override set; system default applies");
      expect(badge).toBeDefined();
      expect(badge.textContent).toBe("DEFAULT");
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

      const badge = screen.getByLabelText("No override set; system default applies");
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

    it("does not render DEFAULT or VENTURE badges when state is global", () => {
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

      expect(screen.queryByLabelText("No override set; system default applies")).toBeNull();
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

    it("does not render DEFAULT or GLOBAL badges when state is venture", () => {
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

      expect(screen.queryByLabelText("No override set; system default applies")).toBeNull();
      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();
    });
  });

  // ── locked (OFF) groups — no badge ever ───────────────────────────────────
  /**
   * Task #97
   *
   * When isActivated(id) === false the component renders the locked/greyed OFF
   * row directly — it never delegates to NavGroupSection and therefore never
   * receives a badge prop.  Even when the DB has rows for that group, no badge
   * element should appear beside the OFF row.
   *
   * We verify this with two groups in the same render:
   *   - TARGET_GROUP (venture-intake)   → activated   → badge IS rendered
   *   - LOCKED_GROUP (discovery)        → NOT activated → no badge, "OFF" shown
   */
  describe("locked (OFF) groups never render a source badge", () => {
    const LOCKED_GROUP = "discovery";

    /** isActivated: only TARGET_GROUP is active; LOCKED_GROUP stays OFF. */
    const oneActiveOneLocked = (id: string) => id === TARGET_GROUP;

    it("renders no badge aria-label on the locked OFF row even when a global DB row exists for it", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: oneActiveOneLocked,
          // DB rows exist for BOTH groups; only TARGET_GROUP is activated
          rows:        [globalRow(TARGET_GROUP), globalRow(LOCKED_GROUP)],
          isLoading:   false,
          isError:     false,
          ventureId:   null,
        }),
      );

      // The activated group should have a badge …
      expect(screen.getByLabelText("Enabled by a global rule")).toBeDefined();

      // … but the locked group must have NONE of the three badge aria-labels
      // We can't query "by group" directly, so we assert none of the three
      // labels appears more than once (only the active group owns it).
      const globalBadges = screen.getAllByLabelText("Enabled by a global rule");
      expect(globalBadges).toHaveLength(1);

      expect(screen.queryByLabelText("No override set; system default applies")).toBeNull();
      expect(screen.queryByLabelText("Enabled by a venture-specific override")).toBeNull();
    });

    it("renders no badge aria-label on the locked OFF row even when a venture DB row exists for it", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: oneActiveOneLocked,
          rows:        [ventureRow(TARGET_GROUP, VENTURE_ID), ventureRow(LOCKED_GROUP, VENTURE_ID)],
          isLoading:   false,
          isError:     false,
          ventureId:   VENTURE_ID,
        }),
      );

      // One VENTURE badge for the active group only
      const ventureBadges = screen.getAllByLabelText("Enabled by a venture-specific override");
      expect(ventureBadges).toHaveLength(1);

      expect(screen.queryByLabelText("No override set; system default applies")).toBeNull();
      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();
    });

    it("still shows the OFF text on the locked row", () => {
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    TARGET_LOCATION,
          isActivated: oneActiveOneLocked,
          rows:        [globalRow(TARGET_GROUP), globalRow(LOCKED_GROUP)],
          isLoading:   false,
          isError:     false,
          ventureId:   null,
        }),
      );

      // The "OFF" label must be present on the locked row (multiple groups are
      // locked in this render, so there are several OFF spans — just confirm ≥1)
      const offLabels = screen.getAllByText("OFF");
      expect(offLabels.length).toBeGreaterThan(0);
    });

    it("renders no badge on ANY non-activated group regardless of badge state (default/global/venture)", () => {
      // All groups locked — none activated
      renderInRouter(
        React.createElement(ExtendedBacklogSection, {
          location:    "/nowhere-matching",  // no active item → section may close but rows still evaluated
          isActivated: () => false,           // nothing is activated
          rows:        [globalRow(TARGET_GROUP), ventureRow(LOCKED_GROUP, VENTURE_ID)],
          isLoading:   false,
          isError:     false,
          ventureId:   VENTURE_ID,
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
    it("header badge goes from DEFAULT to no-badge to GLOBAL as the group is toggled OFF then ON", () => {
      // Start: TARGET_GROUP activated, no rows → DEFAULT badge visible in the
      // open section header.
      renderInRouter(React.createElement(TestHarness, { ventureId: null }));

      expect(screen.getByLabelText("No override set; system default applies").textContent).toBe("DEFAULT");

      const toggleBtn = screen.getByTestId(`toggle-${TARGET_GROUP}`);

      // First click — the panel button shows "On", so clicking calls deactivate.
      // The group becomes OFF; the section stays open (open is local state).
      // No badge is rendered for an OFF row.
      fireEvent.click(toggleBtn);
      expect(screen.queryByLabelText("No override set; system default applies")).toBeNull();
      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();

      // Second click — group is now OFF so the button shows "Off"; clicking calls
      // reactivate.  A synthetic global row is injected → GLOBAL badge.
      fireEvent.click(toggleBtn);
      expect(screen.getByLabelText("Enabled by a global rule").textContent).toBe("GLOBAL");
      expect(screen.queryByLabelText("No override set; system default applies")).toBeNull();
    });

    it("header badge disappears when an ON group with a GLOBAL row is toggled OFF", () => {
      // Start: TARGET_GROUP activated + pre-existing global row → GLOBAL badge.
      renderInRouter(
        React.createElement(TestHarness, {
          ventureId:   null,
          initialRows: [globalRow(TARGET_GROUP)],
        }),
      );

      expect(screen.getByLabelText("Enabled by a global rule").textContent).toBe("GLOBAL");

      // Toggle OFF.
      fireEvent.click(screen.getByTestId(`toggle-${TARGET_GROUP}`));

      // Group is now OFF → ExtendedBacklogSection renders the locked OFF row,
      // which never shows a source badge.
      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();
      expect(screen.queryByLabelText("No override set; system default applies")).toBeNull();
      expect(screen.queryByLabelText("Enabled by a venture-specific override")).toBeNull();
    });

    it("GLOBAL badge returns after a second ON toggle cycle (badge survives round-trip through OFF)", () => {
      // Start: TARGET_GROUP activated, no rows → DEFAULT.
      renderInRouter(React.createElement(TestHarness, { ventureId: null }));

      const btn = screen.getByTestId(`toggle-${TARGET_GROUP}`);

      // OFF → ON: row injected, badge = GLOBAL.
      fireEvent.click(btn); // deactivate (currently ON)
      fireEvent.click(btn); // reactivate (now OFF)
      expect(screen.getByLabelText("Enabled by a global rule").textContent).toBe("GLOBAL");

      // ON → OFF: badge disappears.
      fireEvent.click(btn); // deactivate again
      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();

      // OFF → ON: row re-injected, GLOBAL badge returns.
      fireEvent.click(btn); // reactivate
      expect(screen.getByLabelText("Enabled by a global rule").textContent).toBe("GLOBAL");
    });
  });

  // ── venture scope (ventureId = VENTURE_ID) ────────────────────────────────

  describe("venture scope (a venture is selected)", () => {
    it("header badge switches from DEFAULT to VENTURE after an OFF→ON toggle in venture scope", () => {
      // Start: TARGET_GROUP activated, no rows → DEFAULT badge.
      renderInRouter(React.createElement(TestHarness, { ventureId: VENTURE_ID }));

      expect(screen.getByLabelText("No override set; system default applies").textContent).toBe("DEFAULT");

      const btn = screen.getByTestId(`toggle-${TARGET_GROUP}`);

      // Deactivate (ON → OFF): badge disappears.
      fireEvent.click(btn);
      expect(screen.queryByLabelText("No override set; system default applies")).toBeNull();

      // Reactivate (OFF → ON): synthetic row with ventureId = VENTURE_ID injected → VENTURE badge.
      fireEvent.click(btn);
      expect(screen.getByLabelText("Enabled by a venture-specific override").textContent).toBe("VENTURE");
      // GLOBAL badge must NOT appear — the venture row takes precedence.
      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();
    });

    it("header badge switches from GLOBAL to VENTURE when a global-only group is toggled OFF then ON in venture scope", () => {
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

      // Deactivate (ON → OFF): group becomes OFF, section stays open.
      fireEvent.click(btn);
      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();

      // Reactivate (OFF → ON): venture-scoped synthetic row injected.
      // The venture row overrides the global row → badge must read VENTURE.
      fireEvent.click(btn);
      expect(screen.getByLabelText("Enabled by a venture-specific override").textContent).toBe("VENTURE");
    });

    it("header badge disappears when an ON group with a VENTURE row is toggled OFF", () => {
      renderInRouter(
        React.createElement(TestHarness, {
          ventureId:   VENTURE_ID,
          initialRows: [ventureRow(TARGET_GROUP, VENTURE_ID)],
        }),
      );

      expect(screen.getByLabelText("Enabled by a venture-specific override").textContent).toBe("VENTURE");

      fireEvent.click(screen.getByTestId(`toggle-${TARGET_GROUP}`));

      // Group is OFF → locked row, no badge.
      expect(screen.queryByLabelText("Enabled by a venture-specific override")).toBeNull();
      expect(screen.queryByLabelText("Enabled by a global rule")).toBeNull();
      expect(screen.queryByLabelText("No override set; system default applies")).toBeNull();
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

      // Confirm DEFAULT badge is present initially.
      expect(screen.getByLabelText("No override set; system default applies").textContent).toBe("DEFAULT");

      // Click 1 — deactivate (currently ON): section stays open, no badge.
      fireEvent.click(screen.getByTestId(`toggle-${TARGET_GROUP}`));
      // Click 2 — reactivate: row injected synchronously → GLOBAL badge.
      fireEvent.click(screen.getByTestId(`toggle-${TARGET_GROUP}`));

      // Assertion is synchronous — no waitFor, no findBy*, no await.
      expect(screen.getByLabelText("Enabled by a global rule").textContent).toBe("GLOBAL");
    });
  });
});
