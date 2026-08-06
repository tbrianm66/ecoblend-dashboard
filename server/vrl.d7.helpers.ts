/**
 * VRL D7 Evidence Enforcement — Extracted Pure Logic
 *
 * Pure functions extracted from vrl.router.ts so they can be unit-tested
 * without a DB connection or tRPC context.
 *
 * These are imported by vrl.router.ts as well as the test file.
 */

const TOTAL_DIMS = 10; // Gate 2 adds mvlScore

const ALL_DIM_KEYS = [
  "trlScore","mrlScore","brlScore","ecoScore",
  "prlScore","ipScore","frlScore","regScore","srlScore","mvlScore",
] as const;

type DimKey = typeof ALL_DIM_KEYS[number];

// ─────────────────────────────────────────────────────────────────────────────
// deriveEvidenceStatus
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive evidenceStatus from the number of unverified dimensions.
 *
 * SUBMISSION vs CONFIRMATION semantics:
 *   - "submission": capped at partially_verified; only confirmEvidence can yield
 *     fully_verified (two-party rule prevents self-certification).
 *   - "confirmation": all three statuses are reachable.
 */
export function deriveEvidenceStatus(
  unverifiedCount: number,
  context: "submission" | "confirmation" = "confirmation",
): "unverified" | "partially_verified" | "fully_verified" {
  if (unverifiedCount >= TOTAL_DIMS) return "unverified";
  if (unverifiedCount === 0) {
    return context === "confirmation" ? "fully_verified" : "partially_verified";
  }
  return "partially_verified";
}

// ─────────────────────────────────────────────────────────────────────────────
// selfAssessedKeys
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return the dimension keys that have NO non-empty evidence URL in the provided map.
 * Any key absent from the map, or present with an empty/whitespace string, is self-assessed.
 */
export function selfAssessedKeys(
  evidenceLinks?: Partial<Record<string, string>>,
): string[] {
  if (!evidenceLinks) return ALL_DIM_KEYS.slice() as string[];
  return ALL_DIM_KEYS.filter(
    k => !evidenceLinks[k] || evidenceLinks[k]!.trim() === ""
  ) as string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// confirmEvidence authorization guard
// ─────────────────────────────────────────────────────────────────────────────

export interface ConfirmEvidenceGuardInput {
  callerRole:    "admin" | "member" | string;
  callerId:      string;
  callerName?:   string;
  submittedById: string | null;
}

/**
 * Authorization guard for confirmEvidence.
 * Throws with a descriptive message on violation; returns confirmedBy on pass.
 *
 * Rules enforced:
 *   1. Caller must be admin.
 *   2. Caller must NOT be the original submitter (self-confirmation blocked).
 *   3. confirmedBy is session-derived — callers cannot supply their own identity.
 */
export function buildConfirmEvidenceGuard(
  input: ConfirmEvidenceGuardInput,
): { confirmedBy: string } {
  // Rule 1: admin role required
  if (input.callerRole !== "admin") {
    throw new Error(
      "Forbidden: confirmEvidence requires admin role. " +
      `Caller role was '${input.callerRole}'.`
    );
  }

  // Rule 2: self-confirmation blocked
  if (input.submittedById && input.submittedById === input.callerId) {
    throw new Error(
      "Self-confirmation is not permitted. " +
      "A different admin must confirm evidence for assessments you submitted."
    );
  }

  // Rule 3: identity is session-derived
  const confirmedBy = input.callerName ?? input.callerId;
  return { confirmedBy };
}

// ─────────────────────────────────────────────────────────────────────────────
// simulateEvidenceProgression
// ─────────────────────────────────────────────────────────────────────────────

interface ConfirmationRecord {
  dimensionKey: string;
  evidenceUrl:  string;
}

interface EvidenceState {
  evidenceStatus:          "unverified" | "partially_verified" | "fully_verified";
  selfAssessedDimensions:  string[];
  hasUnverifiedInputs:     boolean;
  confirmedDimensions:     string[];
}

/**
 * Pure simulation of the confirmEvidence transaction logic.
 * Accepts a list of confirmation records (mimicking the DB upsert behaviour)
 * and returns the resulting evidence state without needing a real DB.
 */
export function simulateEvidenceProgression(
  confirmations: ConfirmationRecord[],
): EvidenceState {
  // Last confirmation per dimension wins (upsert semantics: delete+insert per dim)
  const confirmedMap = new Map<string, string>();
  for (const c of confirmations) {
    confirmedMap.set(c.dimensionKey, c.evidenceUrl);
  }

  const confirmedKeys  = Array.from(confirmedMap.keys());
  const confirmedSet   = new Set(confirmedKeys);
  const remaining      = ALL_DIM_KEYS.filter(k => !confirmedSet.has(k)) as string[];
  const unverifiedCount = remaining.length;
  const evidenceStatus = deriveEvidenceStatus(unverifiedCount, "confirmation");

  return {
    evidenceStatus,
    selfAssessedDimensions: remaining,
    hasUnverifiedInputs:    remaining.length > 0,
    confirmedDimensions:    confirmedKeys,
  };
}
