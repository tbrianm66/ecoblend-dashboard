/**
 * Gate 4 — Core Consolidation & Backlog Archiving
 * FHV-EB-AUD-001 v1.0 — Section 3
 *
 * This module governs:
 *   1. Which modules are "canonical core" (always active in workflow)
 *   2. Which modules are "extended backlog" (require reactivationHypothesis)
 *   3. Which modules are "deferred speculative infrastructure" (Gate 4 pending validation)
 *   4. The reactivationHypothesis toggle — admin-only, per-venture, persisted in localStorage
 *
 * Reactivation governance rule (§3):
 *   An admin must set the `reactivationHypothesis` flag for a specific venture + module
 *   before that backlogged module appears in the active workflow navigation.
 *   The flag is stored as: localStorage key `gate4:reactivated:${ventureId}` → JSON array of groupIds.
 *   A global (venture-agnostic) override key `gate4:reactivated:global` is available for
 *   cross-venture platform-wide reactivation.
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

// ── reactivationHypothesis hook ───────────────────────────────────────────────
// Reads and writes the per-venture reactivation state from localStorage.
// The presence of a groupId in the stored set means that module is
// "reactivated" for that venture and will appear in the active workflow.

const LS_KEY_FOR_VENTURE = (ventureId: string) =>
  `gate4:reactivated:${ventureId}`;
const LS_KEY_GLOBAL = "gate4:reactivated:global";

function readActivated(ventureId: string | null): Set<string> {
  try {
    const ventureSet = ventureId
      ? new Set<string>(JSON.parse(localStorage.getItem(LS_KEY_FOR_VENTURE(ventureId)) ?? "[]"))
      : new Set<string>();
    const globalSet = new Set<string>(JSON.parse(localStorage.getItem(LS_KEY_GLOBAL) ?? "[]"));
    return new Set([...ventureSet, ...globalSet]);
  } catch {
    return new Set();
  }
}

function writeActivated(ventureId: string | null, groups: Set<string>) {
  const arr = [...groups];
  if (ventureId) {
    localStorage.setItem(LS_KEY_FOR_VENTURE(ventureId), JSON.stringify(arr));
  } else {
    localStorage.setItem(LS_KEY_GLOBAL, JSON.stringify(arr));
  }
}

import { useState, useCallback } from "react";

/**
 * useGate4Reactivation — admin-facing hook for the reactivationHypothesis toggle.
 *
 * @param ventureId  The currently selected venture ID (or null for global scope).
 * @returns          { activatedGroups, isActivated, reactivate, deactivate, reactivateAll, deactivateAll }
 *
 * GOVERNANCE RULE: Only admin users should be allowed to call reactivate/deactivate.
 * The sidebar enforces this by only rendering the reactivation panel for admin users.
 */
export function useGate4Reactivation(ventureId: string | null) {
  const [activated, setActivated] = useState<Set<string>>(() =>
    readActivated(ventureId)
  );

  const persist = useCallback((next: Set<string>) => {
    setActivated(next);
    writeActivated(ventureId, next);
  }, [ventureId]);

  const isActivated = useCallback(
    (groupId: string) => activated.has(groupId),
    [activated],
  );

  const reactivate = useCallback((groupId: string) => {
    persist(new Set([...activated, groupId]));
  }, [activated, persist]);

  const deactivate = useCallback((groupId: string) => {
    const next = new Set(activated);
    next.delete(groupId);
    persist(next);
  }, [activated, persist]);

  const reactivateAll = useCallback(() => {
    persist(new Set(GATE4_BACKLOG_GROUP_IDS));
  }, [persist]);

  const deactivateAll = useCallback(() => {
    persist(new Set());
  }, [persist]);

  return {
    activatedGroups: activated,
    isActivated,
    reactivate,
    deactivate,
    reactivateAll,
    deactivateAll,
  };
}
