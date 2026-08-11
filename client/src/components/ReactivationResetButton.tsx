/**
 * ReactivationResetButton — production "Reset to global defaults" button.
 *
 * Extracted from ReactivationPanel (Sidebar.tsx) so the disabled-state predicate
 * can be tested by rendering the real production component rather than a test copy.
 *
 * Disabled-state rule:
 *   alreadyDefault = querySettled && ventureOverrideCount === 0
 *
 * This means the button stays enabled (retryable) when:
 *   - the query is still loading   (isLoading=true  → querySettled=false)
 *   - the query has errored        (isError=true    → querySettled=false)
 *   - the venture still has rows   (ventureOverrideCount > 0)
 */

import { RotateCcw, Loader2 } from "lucide-react";
import type { ReactivationRow } from "@/lib/gate4Utils";

export interface ReactivationResetButtonProps {
  ventureId: string;
  rows: ReactivationRow[];
  isLoading: boolean;
  isError: boolean;
  /**
   * True while the reset mutation itself is in-flight (server round-trip pending).
   * When true the button shows a spinner and is non-clickable so admins know the
   * request is being processed and cannot accidentally double-submit.
   */
  isPending?: boolean;
  /** Called when the admin clicks and the button is not already disabled. */
  onReset: () => void;
}

export function ReactivationResetButton({
  ventureId,
  rows,
  isLoading,
  isError,
  isPending = false,
  onReset,
}: ReactivationResetButtonProps) {
  // Only treat "no overrides" as authoritative once the query has successfully
  // loaded.  While loading or on error, rows is [] which is indistinguishable
  // from a venture with no overrides — so we must not disable in those states.
  const querySettled = !isLoading && !isError;
  const ventureOverrideCount = rows.filter(r => r.ventureId === ventureId).length;
  const alreadyDefault = querySettled && ventureOverrideCount === 0;

  // The button is non-interactive while the mutation is in-flight OR already default.
  const effectivelyDisabled = isPending || alreadyDefault;

  return (
    <button
      data-testid="reset-btn"
      onClick={() => { if (!effectivelyDisabled) onReset(); }}
      disabled={effectivelyDisabled}
      title={
        isPending
          ? "Resetting to global defaults…"
          : alreadyDefault
            ? "Already using global defaults"
            : undefined
      }
      className="w-full py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5"
      style={{
        background: effectivelyDisabled ? "rgba(255,255,255,0.03)" : "rgba(245,158,11,0.08)",
        color:      effectivelyDisabled ? "rgba(255,255,255,0.2)"  : "rgba(245,158,11,0.75)",
        border:     effectivelyDisabled ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(245,158,11,0.25)",
        fontSize: "0.7rem",
        cursor: effectivelyDisabled ? "not-allowed" : "pointer",
      }}
    >
      {isPending ? (
        <Loader2 size={10} className="animate-spin" data-testid="reset-spinner" />
      ) : (
        <RotateCcw size={10} />
      )}
      {isPending
        ? "Resetting…"
        : alreadyDefault
          ? "Already using global defaults"
          : "Reset to global defaults"}
    </button>
  );
}
