# Stage 1.5 — Pre-Stage-2 Hardening and Operator Pilot

## Scope completed

- Protected the legacy Decision Gate venture reads with authentication and explicit venture authorization.
- Restricted the portfolio-wide archive list and Command Centre aggregate boards to administrators.
- Protected workflow-stage and advancement-readiness probes with authentication and venture authorization.
- Added an explicit, allowlisted, optimistic-locking lifecycle transition mutation.
- Audited every successful transition with prior state, new state, rationale, actor, timestamp, and an explicit human-action trigger.
- Added a compact Canonical Validation Spine operator panel to the existing Command Centre between Mission Protection and Financial content.
- Reused the Stage 1 lifecycle, hypothesis, evidence, experiment, result, recommendation, and human-decision records.
- Kept system recommendations visibly advisory and separate from human decisions.

## Stage 2 boundaries retained

- No execution handover was added.
- No score-, evidence-, experiment-, recommendation-, or AI-driven lifecycle transition exists.
- No parallel validation model or second dashboard was introduced.
- No production schema or production data was changed.

## Verification

- Stage 1 validation-spine integration suite: 8/8 passing.
- Transition coverage includes a successful allowlisted transition, audit provenance, and rejection of stale prior-state input.
- Focused TypeScript diagnostics for the changed server/client files produced no errors.
- The development application workflow was restarted after the changes.
- Anonymous browser smoke test confirmed the Command Centre shell still renders and the newly protected requests return HTTP 401. Interactive pilot verification requires an authenticated operator session.

## Migration-baseline review — completed 1 September 2026

### Evidence

- The development database is reachable.
- The development migration ledger contains four records:
  - `0000_puzzling_scorpion` by exact SHA-256 match.
  - `0001_chunky_miracleman` by exact SHA-256 match.
  - one recorded hash (`0933ba7f...`) that has no matching SQL file in the current repository.
  - `0008_funny_marrow` by exact SHA-256 match.
- The repository contains 22 numbered SQL files but the journal contains 16 entries.
- Duplicate numeric prefixes exist for `0001`, `0002`, and `0013`.
- `0001_early_thunderbird`, `0002_same_weapon_omega`, `0013_gate4_module_reactivations`, `0015_phase2_domain_brand_architecture`, `0016_phase5_legacy_migration`, and `0017_production_domain_brand_seed` are not represented in the journal.
- Journal timestamps for `0010` through `0014` precede later-numbered entries, so migration number is not a reliable chronology.
- The standard `pnpm db:push` command runs `drizzle-kit generate && drizzle-kit migrate`. With the current ledger and journal, it is not a safe reconciliation mechanism: the first journal entry newer than the latest recorded migration is the unrelated `0009_hybrid_venture_model_canvas` migration.
- The Stage 1 development schema itself is present:
  - `validation_lifecycles` exists with its venture foreign key and venture/version uniqueness constraint.
  - lifecycle linkage foreign keys exist on `cc_hypotheses`, `cc_evidence`, `cc_experiments`, and `cc_decisions`.
  - Stage 1 lifecycle/provenance/decision columns exist on the reused Command Centre tables.
- No validation lifecycle rows currently exist. Existing legacy Command Centre rows remain unlinked: 19 hypotheses, 10 evidence records, 9 experiments, and 7 decisions.

### Reviewed baseline decision

The current **development schema**, not the incomplete Drizzle ledger or non-linear repository journal, is the reviewed Stage 1.5 baseline. Preserve the existing ledger exactly and do not attempt to make it claim that every historical SQL file ran. Do not run `pnpm db:push`, `drizzle-kit migrate`, or manually replay any numbered historical migration as part of Stage 1.5.

Any future schema work must start from a newly generated additive migration based on a schema diff against this reviewed development baseline. That future migration must receive separate review before execution and must not include historical DDL or data operations from `0009` or any other earlier file.

This review did not rewrite migration metadata, execute migration SQL, alter development schema/data, or read or modify production schema/data.

## Stage 2 recommendation

**GO WITH CONDITIONS**

Proceed to Stage 2 only after:

1. an authenticated browser pass confirms lifecycle inspection, transition, and decision recording in the operator pilot; and
2. the remaining pre-existing global TypeScript and `module_reactivations` failures are tracked separately from this package.

## Authenticated operator-pilot browser test — prepared

Use an authenticated administrator or venture member who is already authorised for the selected venture. The browser pass must:

1. Open the Command Centre and select an authorised venture.
2. Confirm the Canonical Validation Spine panel appears between Mission Protection and Financial content.
3. If the venture has no lifecycle, create one in `DISCOVERY`.
4. Link or create one hypothesis, one experiment, and one evidence/result record through the authenticated validation-spine API before testing the decision control; the compact pilot intentionally exposes only lifecycle transition and decision controls.
5. Inspect the lifecycle counts and evidence relationship display.
6. Apply one explicit allowlisted human transition with a rationale of at least ten characters.
7. Confirm the new lifecycle state appears after refresh.
8. Record a human decision against linked evidence, intentionally choosing a recommendation and human decision that can be distinguished.
9. Confirm the decision displays the system recommendation separately from the human decision.
10. Verify the development audit records contain the authenticated actor, venture, prior state, new state, rationale, timestamp, and `explicit_human_action` trigger.

The pass is not complete until it is performed in an authenticated browser session. No test credentials, session cookie, or programmatic login bypass should be created for this verification.