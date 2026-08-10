/**
 * Gate 4 — Toast decision helpers for the venture-mismatch warning system.
 *
 * Extracted from Sidebar.tsx:ReactivationPanel so these functions can be
 * imported and exercised in Node.js / Vitest test contexts with NO React,
 * browser, or sonner dependencies.
 *
 * The caller supplies a `ToastApi` — in production this is `toast` from
 * "sonner"; in tests it is a spy object with the same interface.
 *
 * Keep this file dependency-free (no React, no tRPC, no sonner imports).
 */

// ── Minimal toast API surface used by these helpers ───────────────────────────
// This lets the production caller pass sonner's `toast` directly and the test
// caller pass a plain spy object — no mocking framework required.
export interface ToastApi {
  success(message: string): void;
  warning(message: string, options?: { duration?: number }): void;
  error(message: string, options?: { duration?: number }): void;
}

/**
 * Show a toast confirming which venture the toggle was written to.
 *
 * When the venture selector changed between click and server response
 * (i.e. snapshotVId !== currentVId), a WARNING toast fires with both
 * venture names so the admin knows the write landed on a different venture.
 * Otherwise a plain SUCCESS toast is shown.
 *
 * Mirrors the inline logic of `showToggleToast` in Sidebar.tsx:ReactivationPanel.
 *
 * @param toast          The toast API to call (sonner in production, spy in tests).
 * @param currentVId     ventureId currently shown in the selector (ventureIdRef.current).
 * @param currentVName   ventureName currently shown in the selector (ventureNameRef.current).
 * @param label          Module group label, e.g. "Discovery".
 * @param activated      true = module was turned on, false = turned off.
 * @param snapshotVId    ventureId captured at the moment the user clicked.
 * @param snapshotVName  ventureName captured at the moment the user clicked.
 */
export function showToggleToast(
  toast: ToastApi,
  currentVId: string | null,
  currentVName: string | undefined,
  label: string,
  activated: boolean,
  snapshotVId: string | null,
  snapshotVName: string | undefined,
): void {
  const action    = activated ? "activated" : "deactivated";
  const scopeName = snapshotVId ? (snapshotVName ?? snapshotVId) : "all ventures (global)";
  const drifted   = snapshotVId !== currentVId;

  if (drifted) {
    const nowScope = currentVId ? (currentVName ?? currentVId) : "all ventures (global)";
    toast.warning(
      `"${label}" ${action} for ${scopeName} — not the currently selected venture (${nowScope})`,
      { duration: 6000 },
    );
  } else {
    toast.success(`"${label}" ${action} for ${scopeName}`);
  }
}

/**
 * Show a toast confirming which venture the "Reset to global defaults" action
 * was performed on.
 *
 * Same mismatch-detection logic as showToggleToast: when the venture selector
 * changed between click and server response, a WARNING toast fires naming both
 * the venture that was reset (snapshot) and the venture currently visible (now).
 *
 * @param toast          The toast API to call (sonner in production, spy in tests).
 * @param currentVId     ventureId currently shown in the selector (ventureIdRef.current).
 * @param currentVName   ventureName currently shown in the selector (ventureNameRef.current).
 * @param snapshotVId    ventureId captured at the moment the user clicked.
 * @param snapshotVName  ventureName captured at the moment the user clicked.
 */
export function showResetToast(
  toast: ToastApi,
  currentVId: string | null,
  currentVName: string | undefined,
  snapshotVId: string | null,
  snapshotVName: string | undefined,
): void {
  const scopeName = snapshotVId ? (snapshotVName ?? snapshotVId) : "all ventures (global)";
  const drifted   = snapshotVId !== currentVId;

  if (drifted) {
    const nowScope = currentVId ? (currentVName ?? currentVId) : "all ventures (global)";
    toast.warning(
      `Module settings reset to global defaults for ${scopeName} — not the currently selected venture (${nowScope})`,
      { duration: 6000 },
    );
  } else {
    toast.success(`Module settings reset to global defaults for ${scopeName}`);
  }
}

/**
 * Show an error toast when a batch reactivation write fails.
 *
 * When the server error message contains "Skipped group(s): X, Y" the skipped
 * IDs are parsed out and displayed explicitly so the admin can see exactly
 * which groups were not written.  When the message cannot be parsed a generic
 * error toast is shown instead.
 *
 * @param toast         The toast API to call (sonner in production, spy in tests).
 * @param skippedGroups Array of groupId strings parsed from the error message.
 * @param rawMessage    The raw error message from the TRPC response.
 * @param labelMap      Optional map of groupId → human-readable label.
 *                      When provided each skipped ID is resolved to its display
 *                      name (e.g. "discovery" → "Discovery & Market").
 *                      Unknown IDs fall back to the raw ID string.
 *                      Pass GATE4_BACKLOG_GROUP_LABEL_MAP from gate4Config.ts in
 *                      production; omit (or pass undefined) in tests that only
 *                      care about the raw-ID path.
 */
export function showBatchErrorToast(
  toast: ToastApi,
  skippedGroups: string[],
  rawMessage: string,
  labelMap?: Readonly<Record<string, string>>,
): void {
  if (skippedGroups.length > 0) {
    const labels = labelMap
      ? skippedGroups.map(id => labelMap[id] ?? id)
      : skippedGroups;
    toast.error(
      `Batch write incomplete — skipped group(s): ${labels.join(", ")}`,
      { duration: 8000 },
    );
  } else {
    toast.error(`Batch write failed: ${rawMessage}`, { duration: 6000 });
  }
}

/**
 * Show an error toast when a "Reset to global defaults" write fails.
 *
 * Fired from the `onError` callback of the `resetVentureModuleReactivations`
 * mutation so admins receive explicit feedback instead of a silent no-op.
 *
 * @param toast      The toast API to call (sonner in production, spy in tests).
 * @param rawMessage The raw error message from the tRPC response.
 */
export function showResetErrorToast(
  toast: ToastApi,
  rawMessage: string,
): void {
  toast.error(`Reset failed: ${rawMessage}`, { duration: 6000 });
}

/**
 * Show a toast for a bulk Enable-All / Disable-All batch action.
 *
 * Same mismatch-detection logic as showToggleToast.
 *
 * Mirrors the inline logic of `showBatchToast` in Sidebar.tsx:ReactivationPanel.
 */
export function showBatchToast(
  toast: ToastApi,
  currentVId: string | null,
  currentVName: string | undefined,
  allActivated: boolean,
  snapshotVId: string | null,
  snapshotVName: string | undefined,
): void {
  const action    = allActivated ? "All modules enabled" : "All modules disabled";
  const scopeName = snapshotVId ? (snapshotVName ?? snapshotVId) : "all ventures (global)";
  const drifted   = snapshotVId !== currentVId;

  if (drifted) {
    const nowScope = currentVId ? (currentVName ?? currentVId) : "all ventures (global)";
    toast.warning(
      `${action} for ${scopeName} — not the currently selected venture (${nowScope})`,
      { duration: 6000 },
    );
  } else {
    toast.success(`${action} for ${scopeName}`);
  }
}
