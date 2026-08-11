/**
 * @vitest-environment happy-dom
 *
 * Sidebar — gear button loading-gate tests
 *
 * The Settings gear button in the Sidebar footer is disabled (reduced opacity,
 * not-allowed cursor, HTML `disabled` attribute) while `venturesLoading` is true.
 * These tests confirm:
 *
 *   1. When ventures are loading:
 *      - The button carries the `disabled` HTML attribute.
 *      - Clicking it produces no side-effect (the reactivation panel stays closed).
 *
 *   2. When ventures have resolved (loading: false):
 *      - The button does NOT carry the `disabled` attribute.
 *      - Clicking it opens the reactivation panel.
 *      - Clicking it again closes the panel (toggle behaviour).
 */

import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";

// ── Mock sonner before any component is imported ──────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    error:   vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

// ── Mock wouter — Sidebar uses useLocation and Link ───────────────────────────
vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href }, children),
}));

// ── Mock GlobalVentureSelector — heavy context-dependent component ─────────────
vi.mock("@/components/GlobalVentureSelector", () => ({
  default: () => React.createElement("div", { "data-testid": "global-venture-selector" }),
}));

// ── Mock ReactivationResetButton — heavy component ────────────────────────────
vi.mock("@/components/ReactivationResetButton", () => ({
  ReactivationResetButton: () =>
    React.createElement("div", { "data-testid": "reactivation-reset-button" }),
}));

// ── Mock VentureContext — used by the sync-alert banner ───────────────────────
vi.mock("@/contexts/VentureContext", () => ({
  useVentures: () => ({ ventures: [] }),
}));

// ── Mock gate4Config — supply enough shape for Sidebar to render ──────────────
vi.mock("@/lib/gate4Config", () => ({
  GATE4_CORE_MODULES:          [],
  GATE4_DEFERRED_MODULES:      [],
  GATE4_BACKLOG_GROUPS:        [],
  GATE4_BACKLOG_GROUP_IDS:     [],
  GATE4_BACKLOG_GROUP_LABEL_MAP: {},
  useGate4Reactivation: () => ({
    isActivated:           () => false,
    rows:                  [],
    isLoading:             false,
    isError:               false,
    reactivate:            vi.fn(),
    deactivate:            vi.fn(),
    reactivateAll:         vi.fn(),
    deactivateAll:         vi.fn(),
    resetToGlobalDefaults: vi.fn(),
    resetIsPending:        false,
  }),
}));

// ── Mock gate4Utils — helpers called during rendering ─────────────────────────
vi.mock("@/lib/gate4Utils", () => ({
  resolveModuleBadge:  vi.fn(() => null),
  buildRowByGroup:     vi.fn(() => ({})),
  formatToggleAudit:   vi.fn(() => ""),
}));

// ── Mock gate4ToastUtils — toast helpers called by ReactivationPanel ──────────
vi.mock("@/lib/gate4ToastUtils", () => ({
  showToggleToast:      vi.fn(),
  showToggleErrorToast: vi.fn(),
  showBatchToast:       vi.fn(),
  showBatchErrorToast:  vi.fn(),
  showResetToast:       vi.fn(),
  showResetErrorToast:  vi.fn(),
  buildResetOnSuccess:  vi.fn(() => vi.fn()),
}));

// ── SelectedVentureContext — the subject under test ───────────────────────────
// We control the `loading` flag through a module-level variable so each test
// can swap it without re-registering the mock.
let mockLoading = false;
let mockSelectedVenture: { id: string; name: string; color: string } | null = {
  id:    "ven-1",
  name:  "Test Venture",
  color: "#56A837",
};

vi.mock("@/contexts/SelectedVentureContext", () => ({
  useSelectedVenture: () => ({
    selectedVentureId:   mockSelectedVenture?.id ?? null,
    selectedVenture:     mockSelectedVenture,
    setSelectedVentureId: vi.fn(),
    availableVentures:   mockSelectedVenture ? [mockSelectedVenture] : [],
    loading:             mockLoading,
    error:               null,
  }),
}));

// ── Production import (after all mocks are registered) ───────────────────────
import Sidebar from "./Sidebar";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Render the full Sidebar and return the gear button element. */
function renderSidebar() {
  render(React.createElement(Sidebar));
  return screen.getByTestId("gear-button");
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

afterEach(() => {
  cleanup();
  // Reset to defaults so tests are isolated.
  mockLoading = false;
  mockSelectedVenture = { id: "ven-1", name: "Test Venture", color: "#56A837" };
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Sidebar — gear button loading gate", () => {

  describe("while ventures are loading (loading: true)", () => {
    beforeEach(() => {
      mockLoading = true;
    });

    it("renders the gear button with the disabled HTML attribute", () => {
      const button = renderSidebar() as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it("does not open the reactivation panel when clicked during loading", () => {
      const button = renderSidebar();

      // Disabled buttons do not fire click handlers, and the onClick guard
      // (`!venturesLoading && …`) adds a second layer of protection.
      fireEvent.click(button);

      expect(screen.queryByTestId("reactivation-panel")).toBeNull();
    });
  });

  describe("once ventures have resolved (loading: false)", () => {
    beforeEach(() => {
      mockLoading = false;
    });

    it("renders the gear button without the disabled attribute", () => {
      const button = renderSidebar() as HTMLButtonElement;
      expect(button.disabled).toBe(false);
    });

    it("opens the reactivation panel on the first click", () => {
      const button = renderSidebar();

      expect(screen.queryByTestId("reactivation-panel")).toBeNull();

      fireEvent.click(button);

      expect(screen.getByTestId("reactivation-panel")).toBeDefined();
    });

    it("closes the reactivation panel on the second click (toggle off)", () => {
      const button = renderSidebar();

      // Open the panel.
      fireEvent.click(button);
      expect(screen.getByTestId("reactivation-panel")).toBeDefined();

      // Toggle it closed.
      fireEvent.click(button);
      expect(screen.queryByTestId("reactivation-panel")).toBeNull();
    });
  });

  describe("transition from loading to resolved on the same mounted component", () => {
    it("unlocks the button and allows the panel to open after loading completes", () => {
      // ── Phase 1: mount while ventures are still loading ──────────────────────
      mockLoading = true;
      const { rerender } = render(React.createElement(Sidebar));

      const button = screen.getByTestId("gear-button") as HTMLButtonElement;
      expect(button.disabled).toBe(true);

      // Clicking while loading must not open the panel.
      fireEvent.click(button);
      expect(screen.queryByTestId("reactivation-panel")).toBeNull();

      // ── Phase 2: simulate ventures finishing loading ───────────────────────
      act(() => {
        mockLoading = false;
        rerender(React.createElement(Sidebar));
      });

      // Button must now be enabled.
      expect(button.disabled).toBe(false);

      // Clicking the now-enabled button must open the reactivation panel.
      fireEvent.click(button);
      expect(screen.getByTestId("reactivation-panel")).toBeDefined();
    });
  });
});
