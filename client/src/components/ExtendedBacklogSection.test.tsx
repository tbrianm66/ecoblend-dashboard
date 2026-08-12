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
      const globalBadge = screen.getByLabelText("Disabled by a global rule");
      expect(globalBadge).toBeDefined();
      expect(globalBadge.textContent).toBe("GLOBAL");

      // No VENTURE badge — only a global row was provided for LOCKED_GROUP.
      expect(screen.queryByLabelText("Disabled by a venture-specific override")).toBeNull();
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
      const ventureBadge = screen.getByLabelText("Disabled by a venture-specific override");
      expect(ventureBadge).toBeDefined();
      expect(ventureBadge.textContent).toBe("VENTURE");

      // No GLOBAL badge — the venture row is the only row provided.
      expect(screen.queryByLabelText("Disabled by a global rule")).toBeNull();
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
      expect(screen.getByLabelText("Disabled by a venture-specific override").textContent).toBe("VENTURE");
    });

    // #193: aria-label on the OFF badge is read correctly by screen readers on the locked row
    it("still shows the OFF text label on the locked row (#193)", () => {
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
      // Query by aria-label so the assertion survives visual refactors that
      // move or hide the text (tooltip, icon replacement, etc.).
      const offLabels = screen.getAllByLabelText("Module disabled");
      expect(offLabels).toHaveLength(1);
      // Also confirm the visible "OFF" text is still rendered inside the badge
      // element, so a refactor that replaces the text with an icon (leaving the
      // aria-label on an empty element) is still caught.
      expect(offLabels[0].textContent).toBe("OFF");
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

    /**
     * Task #133 — structural guard: locked OFF row must NOT render via NavGroupSection.
     *
     * NavGroupSection always renders a collapsible <button> as its section header
     * (the element users click to expand/collapse the group).  The locked OFF row
     * is intentionally a plain <div> — no interactivity, no expansion, no badge
     * prop passed through NavGroupSection.
     *
     * This test verifies that:
     *   1. No <button> in the rendered tree contains the locked group's label text
     *      ("Discovery & Market"), so a future refactor that accidentally delegates
     *      the locked row to NavGroupSection is caught immediately.
     *   2. The activated group (TARGET_GROUP / "Venture Intake") DOES render its
     *      NavGroupSection header <button>, confirming that the control group is
     *      working and that the assertion above is meaningful rather than vacuously
     *      true because no buttons exist at all.
     *
     * The LOCKED_GROUP label ("Discovery & Market") comes from GATE4_BACKLOG_GROUPS;
     * the TARGET_GROUP label ("Venture Intake") comes from the same source.
     */
    it("does not render a NavGroupSection header button for the locked OFF row, but does for the activated group", () => {
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

      // All <button> elements in the tree come from NavGroupSection headers
      // (one per activated group).  The locked OFF row is a plain <div>.
      const allButtons = document.querySelectorAll("button");

      // 1. No button should contain the locked group's label text.
      //    If NavGroupSection were accidentally used for the locked row, a button
      //    labelled "Discovery & Market" would appear here.
      const lockedGroupLabel = "Discovery & Market";
      const buttonWithLockedLabel = Array.from(allButtons).find(btn =>
        btn.textContent?.includes(lockedGroupLabel),
      );
      expect(buttonWithLockedLabel).toBeUndefined();

      // 2. The activated group (TARGET_GROUP) must have a NavGroupSection header
      //    button, confirming the section renders normally for active groups and
      //    that the absence above is meaningful (not just "no buttons exist at all").
      const activatedGroupLabel = "Venture Intake";
      const buttonWithActiveLabel = Array.from(allButtons).find(btn =>
        btn.textContent?.includes(activatedGroupLabel),
      );
      expect(buttonWithActiveLabel).toBeDefined();
    });

    // ── audit hint on locked OFF rows (Task #137) ─────────────────────────
    /**
     * When a locked OFF row has a GLOBAL or VENTURE badge, a compact audit
     * hint ("who · date time") is shown below the group label so admins can
     * see who disabled the group without opening the Reactivation Panel.
     *
     * The hint is surfaced via aria-label="Toggle audit hint" so the assertion
     * survives visual refactors and is accessible to screen readers.
     *
     * Rules:
     *   – GLOBAL or VENTURE row with toggledBy/toggledAt → hint shown
     *   – Row present but both audit fields null → no hint (formatToggleAudit returns null)
     *   – DEFAULT state (no row) → no hint
     *   – Loading state → no hint
     *   – Error state → no hint
     */
    describe("audit hint on locked OFF rows", () => {
      const LOCKED_GROUP = "discovery";
      const allExceptLocked = (id: string) => id !== LOCKED_GROUP;

      // Fixed audit timestamps so we can assert formatted output deterministically.
      const GLOBAL_TOGGLED_AT  = new Date("2026-01-05T10:30:00Z");
      const VENTURE_TOGGLED_AT = new Date("2026-03-12T14:00:00Z");

      /** Row factories with explicit audit data. */
      function globalRowWithAudit(groupId: string, toggledBy = "admin@example.com"): ReactivationRow {
        return {
          groupId,
          ventureId: "__global__",
          active: false,
          toggledBy,
          toggledAt: GLOBAL_TOGGLED_AT,
        };
      }
      function ventureRowWithAudit(groupId: string, ventureId: string, toggledBy = "ops@example.com"): ReactivationRow {
        return {
          groupId,
          ventureId,
          active: false,
          toggledBy,
          toggledAt: VENTURE_TOGGLED_AT,
        };
      }

      /**
       * The aria-label on the hint span IS the audit string (e.g.
       * "admin@example.com · Jan 5 10:30 AM"), so we can locate the element
       * by testing for the presence of a label that contains the email.
       * We use getAllByRole + filter to avoid coupling to the exact formatted
       * date-time string, which is locale-dependent.
       */
      function getHintSpan(): HTMLElement | null {
        // Any element whose aria-label contains "·" (the separator formatToggleAudit uses)
        // is the hint span.  This is locale-independent and won't match the OFF pill or badges.
        const all = document.querySelectorAll("[aria-label]");
        for (const el of all) {
          if ((el.getAttribute("aria-label") ?? "").includes("·")) {
            return el as HTMLElement;
          }
        }
        return null;
      }

      it("shows the audit hint when a global row has toggledBy and toggledAt", () => {
        renderInRouter(
          React.createElement(ExtendedBacklogSection, {
            location:    TARGET_LOCATION,
            isActivated: allExceptLocked,
            rows:        [globalRowWithAudit(LOCKED_GROUP)],
            isLoading:   false,
            isError:     false,
            ventureId:   null,
          }),
        );

        const hint = getHintSpan();
        expect(hint).not.toBeNull();
        // textContent must include both the identity and the separator "·"
        expect(hint!.textContent).toContain("admin@example.com");
        expect(hint!.textContent).toContain("·");
        // The aria-label (= the full audit string) also carries identity + separator
        const label = hint!.getAttribute("aria-label") ?? "";
        expect(label).toContain("admin@example.com");
        expect(label).toContain("·");
      });

      it("aria-label on the hint span IS the full audit string — not a generic placeholder", () => {
        // Verifies that AT rejects the prior "Toggle audit hint" generic label
        // and that the label includes the actual actor + timestamp separator.
        renderInRouter(
          React.createElement(ExtendedBacklogSection, {
            location:    TARGET_LOCATION,
            isActivated: allExceptLocked,
            rows:        [globalRowWithAudit(LOCKED_GROUP)],
            isLoading:   false,
            isError:     false,
            ventureId:   null,
          }),
        );

        const hint = getHintSpan();
        expect(hint).not.toBeNull();
        const label = hint!.getAttribute("aria-label") ?? "";
        // Must NOT be the generic placeholder that was previously rejected.
        expect(label).not.toBe("Toggle audit hint");
        // Must contain the actor identity so AT can announce who disabled the group.
        expect(label).toContain("admin@example.com");
      });

      it("title attribute on the hint span equals the full audit string (tooltip fallback for truncation)", () => {
        renderInRouter(
          React.createElement(ExtendedBacklogSection, {
            location:    TARGET_LOCATION,
            isActivated: allExceptLocked,
            rows:        [globalRowWithAudit(LOCKED_GROUP)],
            isLoading:   false,
            isError:     false,
            ventureId:   null,
          }),
        );

        const hint = getHintSpan();
        expect(hint).not.toBeNull();
        const title = hint!.getAttribute("title") ?? "";
        expect(title).toContain("admin@example.com");
        expect(title).toContain("·");
      });

      it("shows the audit hint when a venture row has toggledBy and toggledAt", () => {
        renderInRouter(
          React.createElement(ExtendedBacklogSection, {
            location:    TARGET_LOCATION,
            isActivated: allExceptLocked,
            rows:        [ventureRowWithAudit(LOCKED_GROUP, VENTURE_ID)],
            isLoading:   false,
            isError:     false,
            ventureId:   VENTURE_ID,
          }),
        );

        const hint = getHintSpan();
        expect(hint).not.toBeNull();
        expect(hint!.textContent).toContain("ops@example.com");
        expect(hint!.textContent).toContain("·");
      });

      it("long email addresses are not silently clipped — textContent and aria-label contain the full string", () => {
        // A 60-char email that would be ellipsized by CSS truncation.
        const longEmail = "very-long-admin-account@very-long-domain-example.org";
        renderInRouter(
          React.createElement(ExtendedBacklogSection, {
            location:    TARGET_LOCATION,
            isActivated: allExceptLocked,
            rows:        [globalRowWithAudit(LOCKED_GROUP, longEmail)],
            isLoading:   false,
            isError:     false,
            ventureId:   null,
          }),
        );

        const hint = getHintSpan();
        expect(hint).not.toBeNull();
        // textContent must carry the full string (no JS truncation applied).
        expect(hint!.textContent).toContain(longEmail);
        // aria-label must also carry the full string for AT.
        expect(hint!.getAttribute("aria-label")).toContain(longEmail);
        // title tooltip must carry the full string as a disclosure fallback.
        expect(hint!.getAttribute("title")).toContain(longEmail);
      });

      it("shows no audit hint when the row has no audit data (toggledBy and toggledAt both null)", () => {
        // Craft a row where both fields are null so formatToggleAudit returns null.
        const noAuditRow: ReactivationRow = {
          groupId: LOCKED_GROUP,
          ventureId: "__global__",
          active: false,
          toggledBy: null,
          toggledAt: null as unknown as Date,
        };

        renderInRouter(
          React.createElement(ExtendedBacklogSection, {
            location:    TARGET_LOCATION,
            isActivated: allExceptLocked,
            rows:        [noAuditRow],
            isLoading:   false,
            isError:     false,
            ventureId:   null,
          }),
        );

        expect(getHintSpan()).toBeNull();
      });

      it("shows no audit hint on a DEFAULT locked OFF row (no DB row exists)", () => {
        renderInRouter(
          React.createElement(ExtendedBacklogSection, {
            location:    TARGET_LOCATION,
            isActivated: allExceptLocked,
            rows:        [],   // no row → DEFAULT badge state → no hint
            isLoading:   false,
            isError:     false,
            ventureId:   null,
          }),
        );

        expect(getHintSpan()).toBeNull();
      });

      it("shows no audit hint while the query is loading (isLoading=true)", () => {
        renderInRouter(
          React.createElement(ExtendedBacklogSection, {
            location:    TARGET_LOCATION,
            isActivated: allExceptLocked,
            rows:        [globalRowWithAudit(LOCKED_GROUP)],
            isLoading:   true,
            isError:     false,
            ventureId:   null,
          }),
        );

        expect(getHintSpan()).toBeNull();
      });

      it("shows no audit hint when the query errored (isError=true)", () => {
        renderInRouter(
          React.createElement(ExtendedBacklogSection, {
            location:    TARGET_LOCATION,
            isActivated: allExceptLocked,
            rows:        [globalRowWithAudit(LOCKED_GROUP)],
            isLoading:   false,
            isError:     true,
            ventureId:   null,
          }),
        );

        expect(getHintSpan()).toBeNull();
      });

      it("audit hint is absent on activated (ON) groups — only shown on locked OFF rows", () => {
        // TARGET_GROUP is ON; LOCKED_GROUP is OFF with audit data.
        // The hint must appear only on the OFF row, not on any ON group.
        renderInRouter(
          React.createElement(ExtendedBacklogSection, {
            location:    TARGET_LOCATION,
            isActivated: allExceptLocked,
            rows:        [globalRowWithAudit(LOCKED_GROUP), globalRowWithAudit(TARGET_GROUP)],
            isLoading:   false,
            isError:     false,
            ventureId:   null,
          }),
        );

        // Exactly one audit hint: LOCKED_GROUP's locked OFF row.
        const allWithSeparator = Array.from(document.querySelectorAll("[aria-label]"))
          .filter(el => (el.getAttribute("aria-label") ?? "").includes("·"));
        expect(allWithSeparator).toHaveLength(1);
        expect(allWithSeparator[0].textContent).toContain("admin@example.com");
      });

      // ── #200: audit hint updates immediately after a toggle, without a page reload ─
      //
      // When the admin toggles a group and the server refetch delivers new rows,
      // the audit hint on the locked OFF row must reflect the new author
      // IMMEDIATELY on the next render — no page reload required.
      //
      // Strategy: mount with no audit data, then rerender with fresh rows that
      // carry audit data.  The hint must appear after rerender without any
      // navigation or page reload.
      it("audit hint appears immediately when fresh rows arrive after a toggle — no page reload required (#200)", () => {
        const { rerender } = renderInRouter(
          React.createElement(ExtendedBacklogSection, {
            location:    TARGET_LOCATION,
            isActivated: allExceptLocked,
            // Initially no audit data: toggledBy and toggledAt are null.
            rows:        [{ groupId: LOCKED_GROUP, ventureId: "__global__", active: false, toggledBy: null, toggledAt: null }],
            isLoading:   false,
            isError:     false,
            ventureId:   null,
          }),
        );

        // Before re-render: no audit hint because toggledBy is null.
        expect(getHintSpan()).toBeNull();

        // Simulate a server refetch delivering a new row with audit data
        // (the admin toggled the group and the server responded).
        rerender(
          React.createElement(Router, { base: "" },
            React.createElement(ExtendedBacklogSection, {
              location:    TARGET_LOCATION,
              isActivated: allExceptLocked,
              rows:        [globalRowWithAudit(LOCKED_GROUP, "alice@example.com")],
              isLoading:   false,
              isError:     false,
              ventureId:   null,
            }),
          ),
        );

        // After re-render: hint must appear immediately — no reload needed.
        const hint = getHintSpan();
        expect(hint).not.toBeNull();
        expect(hint!.textContent).toContain("alice@example.com");
      });

      it("audit hint disappears immediately when a reset removes the OFF row data — no page reload (#200 negative)", () => {
        // Start: audit data present.
        const { rerender } = renderInRouter(
          React.createElement(ExtendedBacklogSection, {
            location:    TARGET_LOCATION,
            isActivated: allExceptLocked,
            rows:        [globalRowWithAudit(LOCKED_GROUP)],
            isLoading:   false,
            isError:     false,
            ventureId:   null,
          }),
        );

        // Initially: hint is visible.
        expect(getHintSpan()).not.toBeNull();

        // Simulate a reset: server delivers no row for LOCKED_GROUP.
        rerender(
          React.createElement(Router, { base: "" },
            React.createElement(ExtendedBacklogSection, {
              location:    TARGET_LOCATION,
              isActivated: allExceptLocked,
              rows:        [],  // no rows — DEFAULT state
              isLoading:   false,
              isError:     false,
              ventureId:   null,
            }),
          ),
        );

        // Hint must disappear immediately (DEFAULT state has no audit row).
        expect(getHintSpan()).toBeNull();
      });
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
      expect(screen.getByLabelText("Disabled by a global rule").textContent).toBe("GLOBAL");
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
      expect(screen.getByLabelText("Disabled by a global rule").textContent).toBe("GLOBAL");
      expect(screen.queryByLabelText("Enabled by a venture-specific override")).toBeNull();
    });

    it("GLOBAL badge is present in both OFF and ON states across a full toggle round-trip", () => {
      // Start: TARGET_GROUP activated, no rows → DEFAULT.
      renderInRouter(React.createElement(TestHarness, { ventureId: null }));

      const btn = screen.getByTestId(`toggle-${TARGET_GROUP}`);

      // ON → OFF: deactivate() injects global row (active=false) → GLOBAL on OFF row.
      fireEvent.click(btn);
      expect(screen.getByLabelText("Disabled by a global rule").textContent).toBe("GLOBAL");

      // OFF → ON: reactivate() injects global row (active=true) → GLOBAL on ON row.
      fireEvent.click(btn);
      expect(screen.getByLabelText("Enabled by a global rule").textContent).toBe("GLOBAL");

      // ON → OFF again: GLOBAL persists on the OFF row.
      fireEvent.click(btn);
      expect(screen.getByLabelText("Disabled by a global rule").textContent).toBe("GLOBAL");

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
      expect(screen.getByLabelText("Disabled by a venture-specific override").textContent).toBe("VENTURE");
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
      expect(screen.getByLabelText("Disabled by a venture-specific override").textContent).toBe("VENTURE");
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
      expect(screen.getByLabelText("Disabled by a venture-specific override").textContent).toBe("VENTURE");
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

  // ── section stays open after a group is reactivated mid-session (Task #134) ─
  /**
   * Task #134
   *
   * ExtendedBacklogSection initialises its `open` flag once at mount from
   * `hasActiveItem`.  The tests below verify that toggling groups in
   * ReactivationPanel does NOT accidentally collapse an already-open section.
   *
   * The primary risk being guarded against:
   *   A future refactor passes new props/state in a way that triggers a
   *   component remount or resets the `open` local state, which would collapse
   *   the section and force the admin to re-expand it to see the group they
   *   just reactivated.
   *
   * TestHarness (defined above) already pre-seeds TARGET_GROUP as activated so
   * `hasActiveItem` is true at mount and the section opens immediately.
   */
  describe("section stays open after a group is reactivated mid-session (Task #134)", () => {
    it("section remains open after reactivating a second group that was previously OFF", () => {
      // Start: TARGET_GROUP activated → hasActiveItem=true → section opens.
      // All other groups are OFF and render their locked rows inside {open && ...}.
      renderInRouter(React.createElement(TestHarness, { ventureId: null }));

      // Section is open — OFF group rows are rendered.
      const offRowsBefore = screen.getAllByLabelText("Module disabled");
      const countBefore = offRowsBefore.length;
      expect(countBefore).toBeGreaterThan(0);

      // Reactivate a second group (currently OFF) via the panel.
      // "discovery" is one of the OFF groups; its toggle fires reactivate().
      const SECOND_GROUP = "discovery";
      fireEvent.click(screen.getByTestId(`toggle-${SECOND_GROUP}`));

      // The section must still be open — {open && ...} content is still rendered.
      // SECOND_GROUP is now activated → it moves from a locked OFF row to a
      // NavGroupSection header, so the OFF label count drops by exactly 1.
      const offRowsAfter = screen.getAllByLabelText("Module disabled");
      expect(offRowsAfter.length).toBe(countBefore - 1);

      // The section header button is still present, confirming the section exists.
      const allButtons = document.querySelectorAll("button");
      const sectionHeader = Array.from(allButtons).find(btn =>
        btn.textContent?.includes("Launch Phase"),
      );
      expect(sectionHeader).toBeDefined();
    });

    it("section remains open after TARGET_GROUP is deactivated then reactivated", () => {
      // Start: TARGET_GROUP activated, section open.
      renderInRouter(React.createElement(TestHarness, { ventureId: null }));

      // Section is open — confirm by finding OFF group rows inside {open && ...}.
      expect(screen.getAllByLabelText("Module disabled").length).toBeGreaterThan(0);

      const btn = screen.getByTestId(`toggle-${TARGET_GROUP}`);

      // Deactivate (ON → OFF): section must stay open.
      fireEvent.click(btn);
      // TARGET_GROUP is now a locked OFF row — one more "Module disabled" label exists.
      expect(screen.getAllByLabelText("Module disabled").length).toBeGreaterThan(0);

      // Reactivate (OFF → ON): section must still stay open.
      fireEvent.click(btn);
      // TARGET_GROUP is active again — OFF label count back to the pre-deactivation level.
      expect(screen.getAllByLabelText("Module disabled").length).toBeGreaterThan(0);
    });

    it("section remains open across multiple rapid toggle cycles", () => {
      // Stress-test: four full toggle round-trips on TARGET_GROUP.
      // After every click the {open && ...} content must still be rendered.
      renderInRouter(React.createElement(TestHarness, { ventureId: null }));

      const btn = screen.getByTestId(`toggle-${TARGET_GROUP}`);

      for (let i = 0; i < 4; i++) {
        fireEvent.click(btn);
        // Regardless of the current activation state, other OFF groups
        // (or TARGET_GROUP itself when deactivated) always produce at least
        // one "Module disabled" label, confirming the section is still open.
        expect(screen.getAllByLabelText("Module disabled").length).toBeGreaterThan(0);
      }
    });
  });

  // ── supplementary: auto-expand on first activation (#195) ────────────────
  /**
   * Previously documented as a "known limitation": when all groups started OFF
   * and the section was collapsed, reactivating a group via the panel would NOT
   * auto-expand the section.  Task #195 removes this limitation by adding a
   * useEffect in ExtendedBacklogSection that watches `activeCount` and calls
   * setOpen(true) whenever it increases.
   *
   * These tests now verify the IMPROVED behaviour:
   *   - Section starts collapsed when all groups are OFF.
   *   - After reactivate() is called the section auto-expands so the activated
   *     item is immediately visible without requiring a manual header click.
   */
  describe("supplementary: auto-expand when activeCount increases after reactivation (#195)", () => {
    /**
     * A harness where ALL groups begin OFF so the section starts collapsed.
     */
    function AllOffHarness() {
      const [rows, setRows]           = useState<ReactivationRow[]>([]);
      const [activated, setActivated] = useState<Set<string>>(new Set());

      const isActivated = useCallback((id: string) => activated.has(id), [activated]);

      const reactivate = useCallback((groupId: string) => {
        setActivated(prev => new Set([...prev, groupId]));
        setRows(prev => {
          const filtered = prev.filter(
            r => !(r.groupId === groupId && r.ventureId === "__global__"),
          );
          return [
            ...filtered,
            { groupId, ventureId: "__global__", active: true, toggledBy: null, toggledAt: new Date() },
          ];
        });
      }, []);

      const deactivate = useCallback((groupId: string) => {
        setActivated(prev => { const s = new Set(prev); s.delete(groupId); return s; });
        setRows(prev => {
          const filtered = prev.filter(
            r => !(r.groupId === groupId && r.ventureId === "__global__"),
          );
          return [
            ...filtered,
            { groupId, ventureId: "__global__", active: false, toggledBy: null, toggledAt: new Date() },
          ];
        });
      }, []);

      const noop = useCallback(() => {}, []);

      return React.createElement(
        React.Fragment,
        null,
        React.createElement(ReactivationPanel, {
          onClose:               noop,
          ventureId:             null,
          ventureName:           undefined,
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
          // "/nonexistent" matches no item in any group → hasActiveItem=false at
          // mount → open initialises to false regardless of future activations.
          location:    "/nonexistent",
          isActivated,
          rows,
          isLoading:   false,
          isError:     false,
          ventureId:   null,
        }),
      );
    }

    it("section content is not rendered when all groups start OFF", () => {
      renderInRouter(React.createElement(AllOffHarness, null));

      // All group rows are inside {open && ...}.  When open=false, nothing renders.
      expect(screen.queryByLabelText("Module disabled")).toBeNull();

      // Section header button is always rendered (outside the {open && ...} block).
      const allButtons = document.querySelectorAll("button");
      const sectionHeader = Array.from(allButtons).find(btn =>
        btn.textContent?.includes("Launch Phase"),
      );
      expect(sectionHeader).toBeDefined();
    });

    it("section auto-expands after reactivate() — admin no longer needs to click the header manually (#195)", () => {
      // Previously this was a known limitation: open was initialised once by
      // useState(hasActiveItem) and never updated.  Task #195 adds a useEffect
      // that calls setOpen(true) whenever activeCount increases, so the section
      // automatically expands when the first group is activated from the panel.
      renderInRouter(React.createElement(AllOffHarness, null));

      // Initially collapsed — no OFF badges visible inside the section body.
      expect(screen.queryByLabelText("Module disabled")).toBeNull();

      // Reactivate via the panel — activeCount goes from 0 → 1.
      fireEvent.click(screen.getByTestId(`toggle-${TARGET_GROUP}`));

      // The useEffect fires synchronously in happy-dom, so the section is now
      // expanded and the reactivated group should show a GLOBAL badge.
      // Previously this assertion required a manual fireEvent.click(sectionHeader).
      expect(screen.getByLabelText("Enabled by a global rule").textContent).toBe("GLOBAL");
    });

    it("section header is still present after reactivation (not replaced by the auto-expand effect)", () => {
      // Regression guard: setOpen(true) must not destroy the header button.
      renderInRouter(React.createElement(AllOffHarness, null));
      fireEvent.click(screen.getByTestId(`toggle-${TARGET_GROUP}`));

      const allButtons = document.querySelectorAll("button");
      const sectionHeader = Array.from(allButtons).find(btn =>
        btn.textContent?.includes("Launch Phase"),
      );
      expect(sectionHeader).toBeDefined();
    });
  });
});
