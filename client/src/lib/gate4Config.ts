/**
 * Gate 4 — Core Consolidation & Backlog Archiving
 * FHV-EB-AUD-001 v1.0 — Section 3
 *
 * This module governs:
 *   1. Which modules are "canonical core" (always active in workflow)
 *   2. Which modules are "extended backlog" (require reactivationHypothesis)
 *   3. Which modules are "deferred speculative infrastructure" (Gate 4 pending validation)
 *   4. The reactivationHypothesis toggle — admin-only, per-venture, persisted server-side
 *
 * Reactivation governance rule (§3):
 *   An admin must set the `reactivationHypothesis` flag for a specific venture + module
 *   before that backlogged module appears in the active workflow navigation.
 *   Server DB is authoritative; localStorage is used as an optimistic cache only.
 *   Global scope uses "__global__" as the ventureId sentinel.
 */

// ── 5 Canonical Core Modules (FHV-EB-AUD-001 §3.1) ───────────────────────────
export const GATE4_CORE_MODULES = [
  {
    id: "core-onboarding",
    label: "Onboarding",
    icon: "Rocket",
    href: "/onboarding",
    description: "Founder onboarding and venture initialisation",
  },
  {
    id: "core-experiment-log",
    label: "Experiment Log",
    icon: "FlaskConical",
    href: "/discovery/experiments",
    description: "Evidence-based experiment tracking and hypothesis validation",
  },
  {
    id: "core-interview-tracker",
    label: "Interview Tracker",
    icon: "MessageSquare",
    href: "/interviews",
    description: "Customer discovery interviews and insight capture",
  },
  {
    id: "core-venture-canvas",
    label: "Venture Model Canvas / VRL",
    icon: "LayoutTemplate",
    href: "/proposition/venture-model-canvas",
    description: "Venture Model Canvas and VRL assessment engine",
    secondaryHref: "/vrl-results",
  },
  {
    id: "core-evidence-ledger",
    label: "Evidence Ledger",
    icon: "BookOpenCheck",
    href: "/v2/evidence",
    description: "Immutable evidence library and audit chain",
  },
] as const;

// ── Deferred Speculative Infrastructure (FHV-EB-AUD-001 §3.2) ────────────────
// These modules are in "Deferred (Gate 4 Pending Validation)" status.
// They must NOT appear in the production active workflow until un-deferred by admin.
export const GATE4_DEFERRED_MODULES = [
  {
    id: "deferred-fedsilk",
    label: "FEDSILK Attribution",
    icon: "Network",
    href: "/governance/fedsilk",
    category: "Federated Learning",
    deferralReason: "Federated governance protocol requires independent validation before production use.",
  },
  {
    id: "deferred-mcp-agents",
    label: "MCP Agent Fleets",
    icon: "Brain",
    href: "/v2/agents",
    category: "MCP Agent Fleets",
    deferralReason: "Agentic infrastructure deployment requires architecture review and security assessment.",
  },
  {
    id: "deferred-tokenisation",
    label: "Tokenisation Engine",
    icon: "Layers",
    href: "#deferred",
    category: "Tokenisation",
    deferralReason: "Token issuance and management requires regulatory compliance review.",
  },
  {
    id: "deferred-gaas",
    label: "Growth-as-a-Service (GaaS)",
    icon: "TrendingUp",
    href: "#deferred",
    category: "GaaS",
    deferralReason: "Growth-as-a-Service architecture requires product-market fit validation.",
  },
] as const;

// ── Backlog group IDs (groups that require reactivationHypothesis) ─────────────
// "command-centre" and "admin" are always visible.
// All other groups are backlogged and require per-venture activation.
export const GATE4_ALWAYS_VISIBLE_GROUP_IDS = [
  "command-centre",
  "admin",
] as const;

export const GATE4_BACKLOG_GROUP_IDS = [
  "venture-intake",
  "discovery",
  "proposition",
  "rnd",
  "operations",
  "gtm",
  "sustainability",
  "risk",
  "scoring",
  "investment",
  "execution",
  "coaching",
  "collaboration",
  "governance",
  "people",
] as const;

export type BacklogGroupId = typeof GATE4_BACKLOG_GROUP_IDS[number];

// ── Module reactivation server row type & rowsToActivatedSet ─────────────────
// Defined in gate4Utils.ts (dependency-free) so Node.js / Vitest test contexts
// can import the production implementation without pulling in React / tRPC.
// Imported locally for use within this file AND re-exported for consumers.
import { type ReactivationRow, rowsToActivatedSet } from "./gate4Utils";
export type { ReactivationRow };
export { rowsToActivatedSet };

// ── localStorage optimistic cache helpers ────────────────────────────────────
// localStorage is kept as a fast initial seed; server state overrides on load.
const LS_KEY = "gate4:reactivated:v2";   // v2 — new schema, different from old keys

function readLsCache(): Set<string> {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function writeLsCache(groups: Set<string>) {
  localStorage.setItem(LS_KEY, JSON.stringify([...groups]));
}

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { trpc } from "@/lib/trpc";

/**
 * useGate4Reactivation — admin-facing hook for the reactivationHypothesis toggle.
 *
 * Server DB is authoritative; localStorage seeds the initial render to avoid flash.
 * On mount the hook fetches server state and merges it into local state.
 * Each toggle writes optimistically to local state, then persists to the server.
 *
 * @param ventureId  The currently selected venture ID (or null for global scope).
 * @returns          { activatedGroups, isActivated, reactivate, deactivate,
 *                    reactivateAll, deactivateAll, rows, isLoading }
 *
 * GOVERNANCE RULE: Only admin users should be allowed to call reactivate/deactivate.
 * The sidebar enforces this by only rendering the reactivation panel for admin users.
 */
export function useGate4Reactivation(ventureId: string | null) {
  // Seed from localStorage so there's no flash on first render.
  const [activated, setActivated] = useState<Set<string>>(readLsCache);

  // tRPC query — fetch all rows once, keep them up-to-date.
  //
  // refetchInterval: 10_000 — poll every 10 s so that when a second admin
  //   removes venture overrides in another session, the reset button's disabled
  //   state corrects itself within 10 seconds even when both windows are focused.
  //   refetchOnWindowFocus covers the "return from another tab" case quickly;
  //   the interval covers the "both windows open simultaneously" case.
  // staleTime: 10_000 — matched to the interval so a background refetch is
  //   triggered each cycle rather than being skipped because data looks fresh.
  const { data: serverRows, isLoading, isError } = trpc.admin.getModuleReactivations.useQuery(
    undefined,
    { staleTime: 10_000, refetchOnWindowFocus: true, refetchInterval: 10_000 },
  );

  // Optimistic row overlay — keyed by "groupId:ventureId".
  // Entries are injected immediately when a toggle fires so the badge updates
  // from DEFAULT → GLOBAL/VENTURE before the server refetch resolves.
  // The overlay is cleared as soon as fresh serverRows arrive.
  const [optimisticRows, setOptimisticRows] = useState<Map<string, ReactivationRow>>(
    () => new Map(),
  );

  // Derive rows synchronously from serverRows so that `rows`, `isLoading`, and
  // `isError` are always consistent within the same render cycle.
  //
  // The previous approach used useState + useEffect to copy serverRows into local
  // state.  React Query sets isLoading→false in the render that delivers serverRows,
  // but the useEffect fires only after the render commits — creating a one-render
  // window where isLoading===false but rows was still the stale empty array.
  // useMemo eliminates this race: rows always reflects the current serverRows value.
  //
  // Optimistic overlay entries take precedence over server rows for the same key
  // so that badge changes (DEFAULT→GLOBAL/VENTURE) appear synchronously on toggle.
  const rows = useMemo<ReactivationRow[]>(() => {
    const base: ReactivationRow[] = serverRows ? (serverRows as ReactivationRow[]) : [];
    if (optimisticRows.size === 0) return base;
    // Merge: server rows seed the map; optimistic entries overwrite matching keys.
    const byKey = new Map<string, ReactivationRow>();
    base.forEach(r => byKey.set(`${r.groupId}:${r.ventureId}`, r));
    optimisticRows.forEach((r, key) => byKey.set(key, r));
    return [...byKey.values()];
  }, [serverRows, optimisticRows]);

  // tRPC mutations.
  const setMutation = trpc.admin.setModuleReactivation.useMutation();
  const setBatchMutation = trpc.admin.setModuleReactivationBatch.useMutation();
  const utils = trpc.useUtils();

  // Recompute activated state whenever server data arrives or the venture scope changes.
  // serverRows is a stable React Query reference that only changes on a fresh fetch, so
  // running the effect on ventureId changes without an identity guard is safe and necessary:
  // the prior guard (serverRows === serverRowsRef.current) would suppress a scope change
  // when the user switches ventures before a new fetch completes.
  //
  // Also clears the optimistic overlay so fresh server data takes over badge rendering.
  const serverRowsRef = useRef<typeof serverRows>(undefined);
  useEffect(() => {
    if (!serverRows) return;
    serverRowsRef.current = serverRows;

    const typed = serverRows as ReactivationRow[];
    const serverSet = rowsToActivatedSet(typed, ventureId);
    setActivated(serverSet);
    writeLsCache(serverSet);
    // Discard optimistic overlay — real server data has now arrived.
    setOptimisticRows(new Map());
  }, [serverRows, ventureId]);

  // Snapshot ref — always holds the ventureId that was current at the last render.
  // Reading from this ref inside callbacks ensures that even if React re-renders
  // with a new ventureId between the user's click and the closure executing, the
  // mutation is dispatched against the venture the user was actually editing, not
  // whichever venture happens to be selected when the callback runs.
  const ventureIdRef = useRef(ventureId);
  useEffect(() => {
    ventureIdRef.current = ventureId;
  });

  // Optimistic toggle helper.
  // snapshotVentureId is captured by the *caller* at the moment of interaction,
  // so the server write always targets the venture the user was editing — even if
  // the venture selector is changed before the mutation response arrives.
  //
  // onSuccess is an optional callback fired after the server confirms the write.
  // It receives the snapshotVentureId so callers can show a contextual toast
  // ("applied to Venture X") and detect selector drift.
  const persist = useCallback(
    (
      groupId: string,
      active: boolean,
      next: Set<string>,
      snapshotVentureId: string | null,
      onSuccess?: (snapshotVentureId: string | null) => void,
    ) => {
      setActivated(next);
      writeLsCache(next);

      // Inject a synthetic row immediately so the badge flips from DEFAULT →
      // GLOBAL/VENTURE in the same render as the toggle button change, without
      // waiting for the server refetch to complete.
      const syntheticVId = snapshotVentureId ?? "__global__";
      const syntheticRow: ReactivationRow = {
        groupId,
        ventureId: syntheticVId,
        active,
        toggledBy: null,
        toggledAt: new Date().toISOString(),
      };
      setOptimisticRows(prev => {
        const next = new Map(prev);
        next.set(`${groupId}:${syntheticVId}`, syntheticRow);
        return next;
      });

      // Write to server; on success invalidate the cache so all panels refresh.
      const vId = snapshotVentureId ?? undefined;
      setMutation.mutate(
        { groupId, ventureId: vId, active },
        {
          onSuccess: () => {
            utils.admin.getModuleReactivations.invalidate();
            onSuccess?.(snapshotVentureId);
          },
        },
      );
    },
    [setMutation, utils],
  );

  const isActivated = useCallback(
    (groupId: string) => activated.has(groupId),
    [activated],
  );

  const reactivate = useCallback(
    (groupId: string, onSuccess?: (snapshotVentureId: string | null) => void) => {
      // Snapshot ventureId at interaction time so a rapid venture-selector change
      // cannot redirect this write to the wrong venture.
      const snapshotVentureId = ventureIdRef.current;
      const next = new Set([...activated, groupId]);
      persist(groupId, true, next, snapshotVentureId, onSuccess);
    },
    [activated, persist],
  );

  const deactivate = useCallback(
    (groupId: string, onSuccess?: (snapshotVentureId: string | null) => void) => {
      const snapshotVentureId = ventureIdRef.current;
      const next = new Set(activated);
      next.delete(groupId);
      persist(groupId, false, next, snapshotVentureId, onSuccess);
    },
    [activated, persist],
  );

  const reactivateAll = useCallback(
    (
      onSuccess?: (snapshotVentureId: string | null) => void,
      onError?: (skippedGroups: string[], rawMessage: string) => void,
    ) => {
      const snapshotVentureId = ventureIdRef.current;
      const all = new Set([...GATE4_BACKLOG_GROUP_IDS]);
      setActivated(all);
      writeLsCache(all);

      // Optimistically inject rows for every group so badges flip immediately.
      const syntheticVId = snapshotVentureId ?? "__global__";
      const now = new Date().toISOString();
      setOptimisticRows(() => {
        const m = new Map<string, ReactivationRow>();
        GATE4_BACKLOG_GROUP_IDS.forEach(groupId => {
          m.set(`${groupId}:${syntheticVId}`, { groupId, ventureId: syntheticVId, active: true, toggledBy: null, toggledAt: now });
        });
        return m;
      });

      // Single atomic batch mutation — all 15 groups written in one DB transaction.
      const vId = snapshotVentureId ?? undefined;
      const requested = GATE4_BACKLOG_GROUP_IDS.length;
      setBatchMutation.mutate(
        {
          ventureId: vId,
          items: GATE4_BACKLOG_GROUP_IDS.map(groupId => ({ groupId, active: true })),
        },
        {
          onSuccess: (data) => {
            // Dev transparency: log confirmed vs requested so discrepancies are
            // visible in the browser console without needing a server round-trip.
            console.info(
              `[setModuleReactivationBatch] reactivateAll: ${data.upserted.length}/${requested} group(s) confirmed by DB`,
              data.upserted,
            );
            utils.admin.getModuleReactivations.invalidate();
            onSuccess?.(snapshotVentureId);
          },
          onError: (err) => {
            const rawMessage = err instanceof Error ? err.message : String(err);
            // Parse "Skipped group(s): X, Y, Z" from the server error message.
            const match = rawMessage.match(/Skipped group\(s\):\s*(.+)$/);
            const skippedGroups = match
              ? match[1].split(",").map(s => s.trim()).filter(Boolean)
              : [];
            onError?.(skippedGroups, rawMessage);
          },
        },
      );
    },
    [setBatchMutation, utils],
  );

  const deactivateAll = useCallback(
    (
      onSuccess?: (snapshotVentureId: string | null) => void,
      onError?: (skippedGroups: string[], rawMessage: string) => void,
    ) => {
      const snapshotVentureId = ventureIdRef.current;
      const empty = new Set<string>();
      setActivated(empty);
      writeLsCache(empty);

      // Optimistically inject rows for every group so badges flip immediately.
      const syntheticVId = snapshotVentureId ?? "__global__";
      const now = new Date().toISOString();
      setOptimisticRows(() => {
        const m = new Map<string, ReactivationRow>();
        GATE4_BACKLOG_GROUP_IDS.forEach(groupId => {
          m.set(`${groupId}:${syntheticVId}`, { groupId, ventureId: syntheticVId, active: false, toggledBy: null, toggledAt: now });
        });
        return m;
      });

      const vId = snapshotVentureId ?? undefined;
      const requested = GATE4_BACKLOG_GROUP_IDS.length;
      setBatchMutation.mutate(
        {
          ventureId: vId,
          items: GATE4_BACKLOG_GROUP_IDS.map(groupId => ({ groupId, active: false })),
        },
        {
          onSuccess: (data) => {
            // Dev transparency: log confirmed vs requested so discrepancies are
            // visible in the browser console without needing a server round-trip.
            console.info(
              `[setModuleReactivationBatch] deactivateAll: ${data.upserted.length}/${requested} group(s) confirmed by DB`,
              data.upserted,
            );
            utils.admin.getModuleReactivations.invalidate();
            onSuccess?.(snapshotVentureId);
          },
          onError: (err) => {
            const rawMessage = err instanceof Error ? err.message : String(err);
            // Parse "Skipped group(s): X, Y, Z" from the server error message.
            const match = rawMessage.match(/Skipped group\(s\):\s*(.+)$/);
            const skippedGroups = match
              ? match[1].split(",").map(s => s.trim()).filter(Boolean)
              : [];
            onError?.(skippedGroups, rawMessage);
          },
        },
      );
    },
    [setBatchMutation, utils],
  );

  // tRPC mutation for resetting venture-specific overrides.
  const resetMutation = trpc.admin.resetVentureModuleReactivations.useMutation();

  /**
   * resetToGlobalDefaults — deletes all venture-specific rows for the current
   * ventureId so the venture inherits global defaults.  No-op when ventureId is null.
   *
   * @param onSuccess  Called after server confirms the delete, with the snapshotVentureId.
   * @param onError    Called when the server rejects the reset, with the raw error message.
   *                   Callers should show an error toast so the admin is not left with
   *                   a silent no-op.
   */
  const resetToGlobalDefaults = useCallback(
    (
      onSuccess?: (snapshotVentureId: string | null) => void,
      onError?: (rawMessage: string) => void,
    ) => {
      const snapshotVentureId = ventureIdRef.current;
      if (!snapshotVentureId) return; // global scope has nothing to reset

      resetMutation.mutate(
        { ventureId: snapshotVentureId },
        {
          onSuccess: () => {
            // After deletion, invalidate so the query re-fetches the global defaults.
            utils.admin.getModuleReactivations.invalidate();
            onSuccess?.(snapshotVentureId);
          },
          onError: (err) => {
            const rawMessage = err instanceof Error ? err.message : String(err);
            onError?.(rawMessage);
          },
        },
      );
    },
    [resetMutation, utils],
  );

  return {
    activatedGroups: activated,
    isActivated,
    reactivate,
    deactivate,
    reactivateAll,
    deactivateAll,
    resetToGlobalDefaults,
    rows,
    isLoading,
    isError,
  };
}
