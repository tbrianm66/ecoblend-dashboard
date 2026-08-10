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

import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Router } from "wouter";

import { ExtendedBacklogSection } from "./Sidebar";
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
