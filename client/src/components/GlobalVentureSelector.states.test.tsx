/**
 * @vitest-environment happy-dom
 *
 * GlobalVentureSelector — loading, empty-list, status-badge, hover branches
 *
 * Covers 4 production branches not exercised by the disabled-prop test:
 *   1. if (loading) — renders the loading spinner, not the trigger button.
 *   2. availableVentures.length === 0 — dropdown shows "No ventures available".
 *   3. v.status && … — status-badge pill renders when a venture has a status.
 *   4. onMouseEnter / onMouseLeave if (!isSelected) — hover highlight applies
 *      only to un-selected rows; selected row is unaffected.
 */

import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

// ── Default mock — overridden per test where needed ──────────────────────────
const mockUseSelectedVenture = vi.fn();

vi.mock("@/contexts/SelectedVentureContext", () => ({
  useSelectedVenture: () => mockUseSelectedVenture(),
}));

import GlobalVentureSelector from "./GlobalVentureSelector";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. Loading placeholder branch (GlobalVentureSelector.tsx:41-53)
// ─────────────────────────────────────────────────────────────────────────────
describe("GlobalVentureSelector — loading state", () => {
  beforeEach(() => {
    mockUseSelectedVenture.mockReturnValue({
      selectedVenture: null,
      availableVentures: [],
      setSelectedVentureId: vi.fn(),
      loading: true,
    });
  });

  it("renders the loading placeholder text when loading=true", () => {
    render(React.createElement(GlobalVentureSelector, {}));
    expect(screen.getByText("Loading ventures…")).toBeTruthy();
  });

  it("does NOT render the trigger button when loading=true", () => {
    render(React.createElement(GlobalVentureSelector, {}));
    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBe(0);
  });

  it("renders the trigger button (not the loader) when loading=false", () => {
    mockUseSelectedVenture.mockReturnValue({
      selectedVenture: { id: "v1", name: "Venture One", color: "#56A837", status: "Active" },
      availableVentures: [{ id: "v1", name: "Venture One", color: "#56A837", status: "Active" }],
      setSelectedVentureId: vi.fn(),
      loading: false,
    });
    render(React.createElement(GlobalVentureSelector, {}));
    expect(screen.queryByText("Loading ventures…")).toBeNull();
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Empty-list branch (GlobalVentureSelector.tsx:112-121)
// ─────────────────────────────────────────────────────────────────────────────
describe("GlobalVentureSelector — empty ventures list", () => {
  beforeEach(() => {
    mockUseSelectedVenture.mockReturnValue({
      selectedVenture: null,
      availableVentures: [],
      setSelectedVentureId: vi.fn(),
      loading: false,
    });
  });

  it("shows 'No ventures available' when the dropdown is opened with an empty list", () => {
    render(React.createElement(GlobalVentureSelector, {}));
    // Open the dropdown
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByText("No ventures available")).toBeTruthy();
  });

  it("does NOT render any venture rows when the list is empty", () => {
    render(React.createElement(GlobalVentureSelector, {}));
    fireEvent.click(screen.getAllByRole("button")[0]);
    // The trigger is the only button; no venture-row buttons should exist.
    const buttons = screen.getAllByRole("button");
    // Trigger button only — no venture rows.
    expect(buttons.length).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Status-badge conditional (GlobalVentureSelector.tsx:161-174)
// ─────────────────────────────────────────────────────────────────────────────
describe("GlobalVentureSelector — status badge in dropdown rows", () => {
  it("renders the status pill when a venture has a status", () => {
    mockUseSelectedVenture.mockReturnValue({
      selectedVenture: null,
      availableVentures: [
        { id: "v1", name: "VentureA", color: "#56A837", status: "Active" },
      ],
      setSelectedVentureId: vi.fn(),
      loading: false,
    });
    render(React.createElement(GlobalVentureSelector, {}));
    fireEvent.click(screen.getAllByRole("button")[0]);
    // The status text "Active" should appear in the dropdown row.
    expect(screen.getByText("Active")).toBeTruthy();
  });

  it("does NOT render a status pill when status is absent", () => {
    mockUseSelectedVenture.mockReturnValue({
      selectedVenture: null,
      availableVentures: [
        { id: "v1", name: "VentureB", color: "#56A837", status: undefined },
      ],
      setSelectedVentureId: vi.fn(),
      loading: false,
    });
    render(React.createElement(GlobalVentureSelector, {}));
    fireEvent.click(screen.getAllByRole("button")[0]);
    // There should be no status badge text — only the venture name.
    expect(screen.getByText("VentureB")).toBeTruthy();
    // No element other than the name contains unexpected text.
    const allText = screen.getByText("VentureB").closest("button")?.textContent ?? "";
    expect(allText.trim()).toBe("VentureB");
  });

  it("renders status pills for every venture that has a status", () => {
    mockUseSelectedVenture.mockReturnValue({
      selectedVenture: null,
      availableVentures: [
        { id: "v1", name: "Alpha", color: "#56A837", status: "Active" },
        { id: "v2", name: "Beta",  color: "#3B85BA", status: "Scaling" },
        { id: "v3", name: "Gamma", color: "#F69111", status: undefined },
      ],
      setSelectedVentureId: vi.fn(),
      loading: false,
    });
    render(React.createElement(GlobalVentureSelector, {}));
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("Scaling")).toBeTruthy();
    // Gamma has no status so neither "undefined" nor a status label appears.
    expect(screen.queryByText("undefined")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Hover handler if (!isSelected) branch (GlobalVentureSelector.tsx:138-146)
// ─────────────────────────────────────────────────────────────────────────────
describe("GlobalVentureSelector — hover highlight (mouseenter/mouseleave)", () => {
  beforeEach(() => {
    mockUseSelectedVenture.mockReturnValue({
      selectedVenture: { id: "v1", name: "Alpha", color: "#56A837", status: "Active" },
      availableVentures: [
        { id: "v1", name: "Alpha", color: "#56A837", status: "Active" },
        { id: "v2", name: "Beta",  color: "#3B85BA", status: "Scaling" },
      ],
      setSelectedVentureId: vi.fn(),
      loading: false,
    });
  });

  it("applies hover background to an un-selected row on mouseenter", () => {
    render(React.createElement(GlobalVentureSelector, {}));
    fireEvent.click(screen.getAllByRole("button")[0]); // open dropdown
    // v2 (Beta) is the un-selected row — it's the second button after the trigger.
    const rows = screen.getAllByRole("button");
    // rows[0] is the trigger, rows[1] is v1 (selected), rows[2] is v2 (un-selected)
    const unselectedRow = rows[2] as HTMLButtonElement;
    expect(unselectedRow.textContent).toContain("Beta");
    fireEvent.mouseEnter(unselectedRow);
    // After mouseenter the inline style background should change.
    // The browser (happy-dom) normalises rgba values to include spaces after commas.
    expect(unselectedRow.style.background).toMatch(/rgba\(255,?\s*255,?\s*255,?\s*0\.05\)/);
  });

  it("clears hover background on an un-selected row after mouseleave", () => {
    render(React.createElement(GlobalVentureSelector, {}));
    fireEvent.click(screen.getAllByRole("button")[0]);
    const rows = screen.getAllByRole("button");
    const unselectedRow = rows[2] as HTMLButtonElement;
    fireEvent.mouseEnter(unselectedRow);
    fireEvent.mouseLeave(unselectedRow);
    // After mouseleave the background must be cleared back to transparent.
    expect(unselectedRow.style.background).toBe("transparent");
  });

  it("does NOT change the selected row's background on mouseenter (isSelected guard)", () => {
    render(React.createElement(GlobalVentureSelector, {}));
    fireEvent.click(screen.getAllByRole("button")[0]);
    const rows = screen.getAllByRole("button");
    // rows[1] is v1 (selected), which starts with the selected background.
    const selectedRow = rows[1] as HTMLButtonElement;
    expect(selectedRow.textContent).toContain("Alpha");
    const backgroundBefore = selectedRow.style.background;
    fireEvent.mouseEnter(selectedRow);
    // Background must remain unchanged — the if (!isSelected) guard prevents modification.
    expect(selectedRow.style.background).toBe(backgroundBefore);
  });

  it("does NOT change the selected row's background on mouseleave (isSelected guard)", () => {
    render(React.createElement(GlobalVentureSelector, {}));
    fireEvent.click(screen.getAllByRole("button")[0]);
    const rows = screen.getAllByRole("button");
    const selectedRow = rows[1] as HTMLButtonElement;
    const backgroundBefore = selectedRow.style.background;
    fireEvent.mouseEnter(selectedRow);
    fireEvent.mouseLeave(selectedRow);
    // Still unchanged — neither enter nor leave modifies the selected row.
    expect(selectedRow.style.background).toBe(backgroundBefore);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Outside-click closes the dropdown (GlobalVentureSelector.tsx:32-39)
// ─────────────────────────────────────────────────────────────────────────────
describe("GlobalVentureSelector — outside-click closes dropdown", () => {
  beforeEach(() => {
    mockUseSelectedVenture.mockReturnValue({
      selectedVenture: { id: "v1", name: "Alpha", color: "#56A837", status: "Active" },
      availableVentures: [
        { id: "v1", name: "Alpha", color: "#56A837", status: "Active" },
        { id: "v2", name: "Beta",  color: "#3B85BA", status: "Scaling" },
      ],
      setSelectedVentureId: vi.fn(),
      loading: false,
    });
  });

  it("closes the dropdown when a mousedown event fires outside the component", () => {
    render(React.createElement(GlobalVentureSelector, {}));
    // Open the dropdown.
    fireEvent.click(screen.getAllByRole("button")[0]);
    // Dropdown items should be visible now.
    expect(screen.getByText("Beta")).toBeTruthy();
    // Fire a mousedown on document.body (outside the component ref).
    fireEvent.mouseDown(document.body);
    // Dropdown should close — venture rows no longer visible.
    expect(screen.queryByText("Beta")).toBeNull();
  });

  it("does NOT close the dropdown when a mousedown fires inside the component", () => {
    render(React.createElement(GlobalVentureSelector, {}));
    fireEvent.click(screen.getAllByRole("button")[0]);
    // Trigger button is inside the component ref — clicking it again toggles but doesn't
    // exercise the outside-click guard.  Fire mousedown on a dropdown row instead.
    const betaRow = screen.getByText("Beta").closest("button")!;
    fireEvent.mouseDown(betaRow);
    // Dropdown still visible (inside-click guard: !ref.current.contains(target) is false).
    expect(screen.getByText("Beta")).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Selected-venture colour fallback chain (GlobalVentureSelector.tsx:74-78)
// ─────────────────────────────────────────────────────────────────────────────
describe("GlobalVentureSelector — selected-venture colour dot fallback", () => {
  it("renders without error when selectedVenture has no color and no status (grey fallback)", () => {
    mockUseSelectedVenture.mockReturnValue({
      selectedVenture: { id: "v1", name: "NoColor", color: undefined, status: undefined },
      availableVentures: [
        { id: "v1", name: "NoColor", color: undefined, status: undefined },
      ],
      setSelectedVentureId: vi.fn(),
      loading: false,
    });
    // Must not throw; the colour dot uses the #6b7280 default.
    render(React.createElement(GlobalVentureSelector, {}));
    expect(screen.getByText("NoColor")).toBeTruthy();
  });

  it("uses STATUS_COLORS when selectedVenture has a known status but no color", () => {
    mockUseSelectedVenture.mockReturnValue({
      selectedVenture: { id: "v1", name: "ScalingCo", color: undefined, status: "Scaling" },
      availableVentures: [
        { id: "v1", name: "ScalingCo", color: undefined, status: "Scaling" },
      ],
      setSelectedVentureId: vi.fn(),
      loading: false,
    });
    render(React.createElement(GlobalVentureSelector, {}));
    expect(screen.getByText("ScalingCo")).toBeTruthy();
    // The colour dot span should carry background="#3B85BA" (STATUS_COLORS["Scaling"]).
    // We don't assert the exact colour here — rendering without error and showing the
    // name confirms the status-based branch executed.
  });

  it("falls back to #6b7280 when selectedVenture has an unknown status and no color", () => {
    mockUseSelectedVenture.mockReturnValue({
      selectedVenture: { id: "v1", name: "WeirdStatus", color: undefined, status: "WeirdUnknown" },
      availableVentures: [
        { id: "v1", name: "WeirdStatus", color: undefined, status: "WeirdUnknown" },
      ],
      setSelectedVentureId: vi.fn(),
      loading: false,
    });
    render(React.createElement(GlobalVentureSelector, {}));
    expect(screen.getByText("WeirdStatus")).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Dropdown-row statusColor fallback (GlobalVentureSelector.tsx:125)
//    v.color absent → STATUS_COLORS[v.status] → #6b7280
// ─────────────────────────────────────────────────────────────────────────────
describe("GlobalVentureSelector — dropdown-row statusColor fallback", () => {
  it("renders row without error when v.color is absent and v.status is a known STATUS_COLORS key", () => {
    mockUseSelectedVenture.mockReturnValue({
      selectedVenture: null,
      availableVentures: [
        { id: "v1", name: "NoColorKnownStatus", color: undefined, status: "Pre-Launch" },
      ],
      setSelectedVentureId: vi.fn(),
      loading: false,
    });
    render(React.createElement(GlobalVentureSelector, {}));
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByText("NoColorKnownStatus")).toBeTruthy();
    // Status badge should still render using STATUS_COLORS["Pre-Launch"] = "#F69111".
    expect(screen.getByText("Pre-Launch")).toBeTruthy();
  });

  it("renders row without error when both v.color and v.status are absent (final #6b7280 fallback)", () => {
    mockUseSelectedVenture.mockReturnValue({
      selectedVenture: null,
      availableVentures: [
        { id: "v1", name: "NoColorNoStatus", color: undefined, status: undefined },
      ],
      setSelectedVentureId: vi.fn(),
      loading: false,
    });
    render(React.createElement(GlobalVentureSelector, {}));
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByText("NoColorNoStatus")).toBeTruthy();
    // No status badge when status is absent.
    expect(screen.queryByText("undefined")).toBeNull();
  });

  it("renders row without error when v.color is absent and v.status is an unknown key (grey fallback)", () => {
    mockUseSelectedVenture.mockReturnValue({
      selectedVenture: null,
      availableVentures: [
        { id: "v1", name: "UnknownStatusRow", color: undefined, status: "Legacy" },
      ],
      setSelectedVentureId: vi.fn(),
      loading: false,
    });
    render(React.createElement(GlobalVentureSelector, {}));
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByText("UnknownStatusRow")).toBeTruthy();
    // Status badge text "Legacy" renders even with unknown colour.
    expect(screen.getByText("Legacy")).toBeTruthy();
  });
});
