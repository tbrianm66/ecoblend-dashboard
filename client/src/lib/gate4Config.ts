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

import { useState, useCallback, useEffect, useRef } from "react";
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
  const [rows, setRows] = useState<ReactivationRow[]>([]);

  // tRPC query — fetch all rows once, keep them up-to-date.
  const { data: serverRows, isLoading } = trpc.admin.getModuleReactivations.useQuery(
    undefined,
    { staleTime: 30_000, refetchOnWindowFocus: true },
  );

  // tRPC mutation.
  const setMutation = trpc.admin.setModuleReactivation.useMutation();
  const utils = trpc.useUtils();

  // Recompute activated state whenever server data arrives or the venture scope changes.
  // serverRows is a stable React Query reference that only changes on a fresh fetch, so
  // running the effect on ventureId changes without an identity guard is safe and necessary:
  // the prior guard (serverRows === serverRowsRef.current) would suppress a scope change
  // when the user switches ventures before a new fetch completes.
  const serverRowsRef = useRef<typeof serverRows>(undefined);
  useEffect(() => {
    if (!serverRows) return;
    serverRowsRef.current = serverRows;

    const typed = serverRows as ReactivationRow[];
    setRows(typed);
    const serverSet = rowsToActivatedSet(typed, ventureId);
    setActivated(serverSet);
    writeLsCache(serverSet);
  }, [serverRows, ventureId]);

  // Optimistic toggle helper.
  const persist = useCallback((groupId: string, active: boolean, next: Set<string>) => {
    setActivated(next);
    writeLsCache(next);

    // Write to server; on success invalidate the cache so all panels refresh.
    const vId = ventureId ?? undefined;
    setMutation.mutate(
      { groupId, ventureId: vId, active },
      {
        onSuccess: () => {
          utils.admin.getModuleReactivations.invalidate();
        },
      },
    );
  }, [ventureId, setMutation, utils]);

  const isActivated = useCallback(
    (groupId: string) => activated.has(groupId),
    [activated],
  );

  const reactivate = useCallback((groupId: string) => {
    const next = new Set([...activated, groupId]);
    persist(groupId, true, next);
  }, [activated, persist]);

  const deactivate = useCallback((groupId: string) => {
    const next = new Set(activated);
    next.delete(groupId);
    persist(groupId, false, next);
  }, [activated, persist]);

  const reactivateAll = useCallback(() => {
    const all = new Set([...GATE4_BACKLOG_GROUP_IDS]);
    setActivated(all);
    writeLsCache(all);
    // Batch: fire one mutation per group.
    const vId = ventureId ?? undefined;
    GATE4_BACKLOG_GROUP_IDS.forEach(groupId => {
      setMutation.mutate({ groupId, ventureId: vId, active: true });
    });
    // Invalidate once after all mutations are queued.
    setTimeout(() => utils.admin.getModuleReactivations.invalidate(), 500);
  }, [ventureId, setMutation, utils]);

  const deactivateAll = useCallback(() => {
    const empty = new Set<string>();
    setActivated(empty);
    writeLsCache(empty);
    const vId = ventureId ?? undefined;
    GATE4_BACKLOG_GROUP_IDS.forEach(groupId => {
      setMutation.mutate({ groupId, ventureId: vId, active: false });
    });
    setTimeout(() => utils.admin.getModuleReactivations.invalidate(), 500);
  }, [ventureId, setMutation, utils]);

  return {
    activatedGroups: activated,
    isActivated,
    reactivate,
    deactivate,
    reactivateAll,
    deactivateAll,
    rows,
    isLoading,
  };
}
