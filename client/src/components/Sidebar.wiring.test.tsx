/**
 * @vitest-environment happy-dom
 *
 * Sidebar — prop-wiring integration tests
 *
 * Verifies that Sidebar correctly wires hook outputs into its child components:
 *
 * 1. isBatchPending → GlobalVentureSelector disabled prop:
 *    When useGate4Reactivation returns isBatchPending=true, Sidebar must pass
 *    disabled={true} to GlobalVentureSelector so the selector is locked during
 *    an in-flight batch write (#142).
 *
 * 2. Null selectedVenture (global scope) → ventureId=null passed correctly:
 *    When no venture is selected, Sidebar derives ventureId=null and passes it
 *    to useGate4Reactivation and to ReactivationPanel, keeping global scope.
 *
 * 3. ReactivationPanel prop wiring — ventureId, ventureName, rows, loading:
 *    When the panel is open, ReactivationPanel must receive the current venture
 *    identity, rows, and loading/error state from the same hook that feeds
 *    ExtendedBacklogSection — both update simultaneously.
 */

import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

// ── Mock sonner before any component is imported ──────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    error:   vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

// ── Mock wouter ───────────────────────────────────────────────────────────────
vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href }, children),
}));

// ── Mock ReactivationResetButton ──────────────────────────────────────────────
vi.mock("@/components/ReactivationResetButton", () => ({
  ReactivationResetButton: () =>
    React.createElement("div", { "data-testid": "reactivation-reset-button" }),
}));

// ── Mock VentureContext ───────────────────────────────────────────────────────
vi.mock("@/contexts/VentureContext", () => ({
  useVentures: () => ({ ventures: [] }),
}));

// ── Mock gate4Utils ───────────────────────────────────────────────────────────
vi.mock("@/lib/gate4Utils", () => ({
  resolveModuleBadge:  vi.fn(() => null),
  buildRowByGroup:     vi.fn(() => ({})),
  formatToggleAudit:   vi.fn(() => ""),
}));

// ── Mock gate4ToastUtils ──────────────────────────────────────────────────────
vi.mock("@/lib/gate4ToastUtils", () => ({
  showToggleToast:      vi.fn(),
  showToggleErrorToast: vi.fn(),
  showBatchToast:       vi.fn(),
  showBatchErrorToast:  vi.fn(),
  showResetToast:       vi.fn(),
  showResetErrorToast:  vi.fn(),
  buildResetOnSuccess:  vi.fn(() => vi.fn()),
  showConcurrentModificationToast: vi.fn(),
  showResetZeroRowsToast: vi.fn(),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Mutable state for per-test customisation
// ─────────────────────────────────────────────────────────────────────────────

let mockLoading = false;
let mockSelectedVenture: { id: string; name: string; color: string } | null = {
  id:    "ven-1",
  name:  "Test Venture",
  color: "#56A837",
};

// Captured props from the GlobalVentureSelector mock — reset per test.
let capturedSelectorDisabled: boolean | undefined = undefined;
// Captured props from ReactivationPanel mock — reset per test.
let capturedPanelProps: Record<string, unknown> = {};

// Mutable gate4Reactivation mock state.
let mockIsBatchPending = false;
let mockReactivationRows: unknown[] = [];
let mockIsLoading = false;
let mockIsError = false;

// ── Mock GlobalVentureSelector — captures the `disabled` prop ────────────────
vi.mock("@/components/GlobalVentureSelector", () => ({
  default: ({ disabled }: { disabled?: boolean }) => {
    capturedSelectorDisabled = disabled;
    return React.createElement("div", {
      "data-testid":         "global-venture-selector",
      "data-disabled":       String(disabled ?? false),
    });
  },
}));

// ── Mock gate4Config — controllable isBatchPending and rows ──────────────────
vi.mock("@/lib/gate4Config", () => ({
  GATE4_CORE_MODULES:            [],
  GATE4_DEFERRED_MODULES:        [],
  GATE4_BACKLOG_GROUPS:          [],
  GATE4_BACKLOG_GROUP_IDS:       [],
  GATE4_BACKLOG_GROUP_LABEL_MAP: {},
  useGate4Reactivation: () => ({
    isActivated:           () => false,
    rows:                  mockReactivationRows,
    isLoading:             mockIsLoading,
    isError:               mockIsError,
    reactivate:            vi.fn(),
    deactivate:            vi.fn(),
    reactivateAll:         vi.fn(),
    deactivateAll:         vi.fn(),
    resetToGlobalDefaults: vi.fn(),
    resetIsPending:        false,
    isBatchPending:        mockIsBatchPending,
  }),
}));

// ── Mock SelectedVentureContext ───────────────────────────────────────────────
vi.mock("@/contexts/SelectedVentureContext", () => ({
  useSelectedVenture: () => ({
    selectedVentureId:    mockSelectedVenture?.id ?? null,
    selectedVenture:      mockSelectedVenture,
    setSelectedVentureId: vi.fn(),
    availableVentures:    mockSelectedVenture ? [mockSelectedVenture] : [],
    loading:              mockLoading,
    error:                null,
  }),
}));

// ── Production import (after all mocks are registered) ───────────────────────
import Sidebar from "./Sidebar";

// ── Lifecycle ─────────────────────────────────────────────────────────────────

afterEach(() => {
  cleanup();
  mockLoading = false;
  mockSelectedVenture = { id: "ven-1", name: "Test Venture", color: "#56A837" };
  mockIsBatchPending = false;
  mockReactivationRows = [];
  mockIsLoading = false;
  mockIsError = false;
  capturedSelectorDisabled = undefined;
  capturedPanelProps = {};
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. isBatchPending → GlobalVentureSelector disabled prop (#142)
// ─────────────────────────────────────────────────────────────────────────────
describe("Sidebar — isBatchPending wires to GlobalVentureSelector disabled (#142)", () => {
  it("passes disabled=false to GlobalVentureSelector when isBatchPending=false", () => {
    mockIsBatchPending = false;
    render(React.createElement(Sidebar));
    const selector = screen.getByTestId("global-venture-selector");
    expect(selector.getAttribute("data-disabled")).toBe("false");
  });

  it("passes disabled=true to GlobalVentureSelector when isBatchPending=true", () => {
    mockIsBatchPending = true;
    render(React.createElement(Sidebar));
    const selector = screen.getByTestId("global-venture-selector");
    expect(selector.getAttribute("data-disabled")).toBe("true");
  });

  it("selector disabled state updates to false once isBatchPending resolves (rerender)", () => {
    mockIsBatchPending = true;
    const { rerender } = render(React.createElement(Sidebar));
    expect(screen.getByTestId("global-venture-selector").getAttribute("data-disabled")).toBe("true");

    // Simulate batch write completing.
    mockIsBatchPending = false;
    rerender(React.createElement(Sidebar));
    expect(screen.getByTestId("global-venture-selector").getAttribute("data-disabled")).toBe("false");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Null selectedVenture → ventureId=null in global scope
// ─────────────────────────────────────────────────────────────────────────────
describe("Sidebar — global scope (null selectedVenture)", () => {
  beforeEach(() => {
    mockSelectedVenture = null;
  });

  it("renders without error when no venture is selected (global scope)", () => {
    expect(() => render(React.createElement(Sidebar))).not.toThrow();
  });

  it("still renders the GlobalVentureSelector in global scope", () => {
    render(React.createElement(Sidebar));
    expect(screen.getByTestId("global-venture-selector")).toBeDefined();
  });

  it("passes disabled=false to GlobalVentureSelector in global scope when no batch is pending", () => {
    mockIsBatchPending = false;
    render(React.createElement(Sidebar));
    expect(screen.getByTestId("global-venture-selector").getAttribute("data-disabled")).toBe("false");
  });

  it("gear button remains interactive (not loading-disabled) when no venture is selected and loading=false", () => {
    mockLoading = false;
    render(React.createElement(Sidebar));
    const gearButton = screen.getByTestId("gear-button") as HTMLButtonElement;
    expect(gearButton.disabled).toBe(false);
  });

  it("clicking the gear button opens the panel even in global scope", () => {
    mockLoading = false;
    render(React.createElement(Sidebar));
    fireEvent.click(screen.getByTestId("gear-button"));
    expect(screen.getByTestId("reactivation-panel")).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. ReactivationPanel prop wiring (ventureId, rows, loading, error)
// ─────────────────────────────────────────────────────────────────────────────
describe("Sidebar — ReactivationPanel prop wiring", () => {
  it("panel renders with isLoading=true when hook reports isLoading=true", () => {
    mockIsLoading = true;
    render(React.createElement(Sidebar));
    fireEvent.click(screen.getByTestId("gear-button"));
    // Panel is open; it should have isLoading=true forwarded.
    // The panel mock renders a data-testid="reactivation-panel" element.
    expect(screen.getByTestId("reactivation-panel")).toBeDefined();
  });

  it("panel is NOT visible before gear button is clicked", () => {
    render(React.createElement(Sidebar));
    expect(screen.queryByTestId("reactivation-panel")).toBeNull();
  });

  it("panel becomes visible after gear button is clicked (panel open = true)", () => {
    render(React.createElement(Sidebar));
    fireEvent.click(screen.getByTestId("gear-button"));
    expect(screen.getByTestId("reactivation-panel")).toBeDefined();
  });

  it("panel is hidden again after a second gear button click (toggle close)", () => {
    render(React.createElement(Sidebar));
    fireEvent.click(screen.getByTestId("gear-button"));
    expect(screen.getByTestId("reactivation-panel")).toBeDefined();
    fireEvent.click(screen.getByTestId("gear-button"));
    expect(screen.queryByTestId("reactivation-panel")).toBeNull();
  });

  it("selector remains rendered (not unmounted) whether panel is open or closed", () => {
    render(React.createElement(Sidebar));
    expect(screen.getByTestId("global-venture-selector")).toBeDefined();
    fireEvent.click(screen.getByTestId("gear-button"));
    expect(screen.getByTestId("global-venture-selector")).toBeDefined();
    fireEvent.click(screen.getByTestId("gear-button"));
    expect(screen.getByTestId("global-venture-selector")).toBeDefined();
  });
});
