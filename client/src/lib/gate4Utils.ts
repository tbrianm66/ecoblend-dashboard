/**
 * Gate 4 — Pure utility functions extracted from gate4Config.ts
 *
 * This module contains only side-effect-free logic with NO React or tRPC
 * imports so it can be safely used in Node.js / Vitest test contexts as well
 * as the browser.
 *
 * Keep all additions here dependency-free.
 */

// ── Module reactivation server row type ──────────────────────────────────────
export interface ReactivationRow {
  groupId:   string;
  ventureId: string;   // "__global__" means global scope
  active:    boolean;
  toggledBy: string | null;
  toggledAt: Date | string;
}

// ── rowsToActivatedSet ────────────────────────────────────────────────────────
// Convert server rows into an activated Set for the given scope.
//
// Isolation model:
//   • ventureId === null  → "Global" scope: read __global__ rows only.
//   • ventureId provided  → venture scope: read only rows for that venture;
//     default is INACTIVE for any group without an explicit row.
//     Global rows are NOT inherited so that each venture has a fully
//     independent enabled set.
//
// This means toggling modules in global mode never affects per-venture
// navigation and vice-versa.
export function rowsToActivatedSet(
  rows: ReactivationRow[],
  ventureId: string | null,
): Set<string> {
  const result = new Set<string>();

  if (ventureId === null) {
    // Global scope — only __global__ rows contribute.
    rows
      .filter(r => r.ventureId === "__global__" && r.active)
      .forEach(r => result.add(r.groupId));
  } else {
    // Venture scope — only rows explicitly belonging to this venture contribute.
    // No global inheritance; an absent row means inactive.
    rows
      .filter(r => r.ventureId === ventureId)
      .forEach(r => {
        if (r.active) result.add(r.groupId);
      });
  }

  return result;
}
