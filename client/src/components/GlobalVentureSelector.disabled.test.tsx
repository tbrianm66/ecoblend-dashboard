/**
 * @vitest-environment happy-dom
 *
 * GlobalVentureSelector — disabled prop (#142)
 *
 * When isBatchPending=true, Sidebar passes disabled={true} to
 * GlobalVentureSelector so the venture picker cannot be operated while a
 * batch write is in-flight.  These tests confirm:
 *
 *   1. disabled=true renders the trigger button with the HTML `disabled` attribute.
 *   2. disabled=true sets opacity:0.5 on the trigger button.
 *   3. disabled=true sets cursor:not-allowed on the trigger button.
 *   4. disabled=true sets a descriptive `title` attribute so the user knows why
 *      the control is locked.
 *   5. disabled=false (default) does NOT apply the above styles or attributes.
 *   6. The dropdown does NOT open when disabled=true and the trigger is clicked.
 *   7. The dropdown DOES open when disabled=false and the trigger is clicked.
 */

import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

// ── Mock useSelectedVenture so the component renders without a Provider ────────
vi.mock("@/contexts/SelectedVentureContext", () => ({
  useSelectedVenture: () => ({
    selectedVenture: { id: "ven-alpha", name: "Alpha Ventures", color: "#56A837", status: "Active" },
    availableVentures: [
      { id: "ven-alpha", name: "Alpha Ventures", color: "#56A837", status: "Active" },
      { id: "ven-beta",  name: "Beta Corp",      color: "#3B85BA", status: "Scaling" },
    ],
    setSelectedVentureId: vi.fn(),
    loading: false,
  }),
}));

// ── Lazy import (after mocks are registered) ──────────────────────────────────
import GlobalVentureSelector from "./GlobalVentureSelector";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTrigger() {
  // The trigger is the first (and only top-level) button rendered by the component.
  return screen.getAllByRole("button")[0];
}

afterEach(cleanup);

// ── 1. disabled=true: HTML disabled attribute ─────────────────────────────────
describe("GlobalVentureSelector — disabled prop (#142)", () => {
  it("trigger button has the HTML disabled attribute when disabled=true", () => {
    render(React.createElement(GlobalVentureSelector, { disabled: true }));
    expect((getTrigger() as HTMLButtonElement).disabled).toBe(true);
  });

  // ── 2. disabled=true: opacity ─────────────────────────────────────────────
  it("trigger button has opacity 0.5 when disabled=true", () => {
    render(React.createElement(GlobalVentureSelector, { disabled: true }));
    const style = (getTrigger() as HTMLElement).style;
    // Inline style carries "0.5"; getPropertyValue normalises to the set value.
    expect(style.opacity).toBe("0.5");
  });

  // ── 3. disabled=true: cursor ──────────────────────────────────────────────
  it("trigger button has cursor:not-allowed when disabled=true", () => {
    render(React.createElement(GlobalVentureSelector, { disabled: true }));
    const style = (getTrigger() as HTMLElement).style;
    expect(style.cursor).toBe("not-allowed");
  });

  // ── 4. disabled=true: title tooltip ──────────────────────────────────────
  it("trigger button title explains the lock reason when disabled=true", () => {
    render(React.createElement(GlobalVentureSelector, { disabled: true }));
    const title = getTrigger().getAttribute("title") ?? "";
    // The tooltip must mention the batch write context so admins understand
    // why the control is locked.
    expect(title).toMatch(/batch/i);
  });

  // ── 5. disabled=false (default): no lock styles ───────────────────────────
  it("trigger button does NOT have disabled attribute when disabled=false", () => {
    render(React.createElement(GlobalVentureSelector, { disabled: false }));
    expect((getTrigger() as HTMLButtonElement).disabled).toBe(false);
  });

  it("trigger button has opacity 1 when disabled=false", () => {
    render(React.createElement(GlobalVentureSelector, { disabled: false }));
    const style = (getTrigger() as HTMLElement).style;
    expect(style.opacity).toBe("1");
  });

  it("trigger button has cursor:pointer when disabled=false", () => {
    render(React.createElement(GlobalVentureSelector, { disabled: false }));
    const style = (getTrigger() as HTMLElement).style;
    expect(style.cursor).toBe("pointer");
  });

  // ── 6. disabled=true: dropdown stays closed on click ─────────────────────
  it("dropdown does NOT open when disabled=true and trigger is clicked", () => {
    render(React.createElement(GlobalVentureSelector, { disabled: true }));

    // Clicking a disabled button does not fire onClick in browsers; React's
    // fireEvent bypasses that but our onClick guard (`!disabled && setOpen(...)`)
    // prevents state change.
    fireEvent.click(getTrigger());

    // The venture items in the dropdown should not appear.
    expect(screen.queryByText("Beta Corp")).toBeNull();
  });

  // ── 7. disabled=false: dropdown opens on click ────────────────────────────
  it("dropdown DOES open when disabled=false and trigger is clicked", () => {
    render(React.createElement(GlobalVentureSelector, { disabled: false }));

    fireEvent.click(getTrigger());

    // "Beta Corp" only appears in the dropdown (it is NOT the selected venture
    // shown in the trigger).  Finding it confirms the dropdown rendered.
    expect(screen.getByText("Beta Corp")).toBeTruthy();
  });
});
