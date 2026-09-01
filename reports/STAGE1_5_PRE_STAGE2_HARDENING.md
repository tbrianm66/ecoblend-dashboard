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

## Migration consistency finding

The Stage 1 schema is present in development and the Stage 1 focused tests pass against it. The repository migration directory is not a canonical linear history: it contains duplicate numeric prefixes, entries missing from the journal, and timestamps that are not ordered by migration number. Forcing the development migration metadata to match that repository history could cause unrelated historical migrations to replay.

No migration metadata was rewritten and no unrelated historical migration was replayed. Before Stage 2 schema work, the repository needs a separately reviewed baseline/reconciliation plan that inventories the live development schema against the intended migration set. Production migration remains explicitly out of scope.

## Stage 2 recommendation

**GO WITH CONDITIONS**

Proceed to Stage 2 only after:

1. the migration history has a reviewed safe baseline that does not replay unrelated DDL; and
2. an authenticated browser pass confirms lifecycle inspection, transition, and decision recording in the operator pilot; and
3. the remaining pre-existing global TypeScript and `module_reactivations` failures are tracked separately from this package.