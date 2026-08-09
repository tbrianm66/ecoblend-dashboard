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
// Resolution model:
//   • ventureId === null  → "Global" scope: read __global__ rows only.
//   • ventureId provided  → venture scope, with fallback:
//       1. If a venture-specific row exists for a group, use its active flag.
//       2. If no venture row exists, fall back to the __global__ row (if any).
//       3. If neither exists, the group is inactive.
//
// Venture rows always take precedence over global; global is the default that
// ventures inherit when no override has been written.  Deleting all venture
// rows (the "reset to global defaults" operation) therefore causes the venture
// to show exactly the global default state.
//
// Global scope never sees venture-specific rows.
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
    // Build lookup maps for global and venture rows.
    const globalActive = new Map<string, boolean>();
    rows
      .filter(r => r.ventureId === "__global__")
      .forEach(r => globalActive.set(r.groupId, r.active));

    const ventureActive = new Map<string, boolean>();
    rows
      .filter(r => r.ventureId === ventureId)
      .forEach(r => ventureActive.set(r.groupId, r.active));

    // Union of all known group IDs; resolve each with venture row taking precedence.
    const allGroupIds = new Set([...globalActive.keys(), ...ventureActive.keys()]);
    allGroupIds.forEach(groupId => {
      const active = ventureActive.has(groupId)
        ? ventureActive.get(groupId)!
        : (globalActive.get(groupId) ?? false);
      if (active) result.add(groupId);
    });
  }

  return result;
}

// ── resolveModuleBadge ────────────────────────────────────────────────────────
// Pure function: given the query state and the most-specific row for a module
// group, returns one of five badge states.
//
// "loading"  — query has not resolved yet; no badge should be rendered
//              (avoids falsely labelling every module DEFAULT while data is in-flight)
// "unknown"  — query resolved but with an error; state is genuinely unknown
//              (must not show DEFAULT — that would assert a successful empty response)
// "default"  — query resolved successfully but no DB row exists for this group
//              (module has never been explicitly toggled; factory default applies)
// "global"   — a __global__ row is the authoritative source
// "venture"  — a venture-specific row is the authoritative source
//
// Important: `rows` must be derived synchronously from `serverRows` (via useMemo,
// not setState+useEffect) so that isLoading/isError and the row lookup are always
// consistent within the same render cycle. An effect-based copy would create a
// one-render window where isLoading===false but rows still holds the stale empty
// array, causing every module to appear DEFAULT immediately after the query resolves.
//
// This function is framework-free so it can be used in both the browser and
// the Vitest Node test environment.
export type ModuleBadgeState = "loading" | "unknown" | "default" | "global" | "venture";

export function resolveModuleBadge(
  isLoading: boolean,
  isError: boolean,
  row: Pick<ReactivationRow, "ventureId"> | undefined,
): ModuleBadgeState {
  if (isLoading) return "loading";
  if (isError)   return "unknown";
  if (!row)      return "default";
  return row.ventureId === "__global__" ? "global" : "venture";
}
