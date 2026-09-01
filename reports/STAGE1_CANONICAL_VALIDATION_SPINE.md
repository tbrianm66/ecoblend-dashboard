# Stage 1 Completion Report — Canonical Validation Spine

Date: 1 September 2026

## Outcome

Stage 1 is complete as a controlled, additive server-side vertical slice:

`Venture → Validation Lifecycle → Hypothesis → Evidence → Experiment → Result → Human Decision`

The implementation does not replace the venture record, change historical venture state, alter
scoring/readiness calculations, introduce automatic progression, or implement Phase 2 handover.
`EXECUTION_READY` remains reserved and is not accepted by the Stage 1 API.

## Canonical, reused and new objects

### Existing objects retained as canonical

- **Venture:** existing `ventures` record remains the venture identity and legacy workflow owner.
- **Hypothesis:** existing `cc_hypotheses`.
- **Evidence:** existing `cc_evidence`; no second evidence model was created.
- **Experiment/result:** existing `cc_experiments`.
- **Decision:** existing `cc_decisions`.
- **Provenance:** existing `audit_log`.

### New object

- **Validation lifecycle:** `validation_lifecycles` owns a versioned validation journey for one
  venture. It records its human owner/creator and an inspection-only lifecycle state.

### Additive adapters

Nullable `validationLifecycleId` fields link existing Command Centre records to the lifecycle.
Additional nullable fields provide:

- hypothesis revision and validation-criteria metadata;
- evidence relationship, provenance, collector, collection time, reliability and independence;
- separate system recommendation, human decision, decision authority, rationale, evidence
  references and override reason.

Historical rows remain valid without lifecycle links. No backfill or destructive conversion ran.

## API and authorization

The new `validationSpine` tRPC router provides:

- lifecycle list/detail and creation;
- canonical hypothesis creation and existing-hypothesis linkage;
- supporting, contradicting and neutral evidence capture using `cc_evidence`;
- experiment creation/linkage;
- explicit human result capture, result-to-evidence conversion and caller-selected hypothesis state;
- human decision capture with recommendation and decision stored separately;
- lifecycle projection with provenance audit entries.

Every new query and mutation:

- uses an authenticated procedure;
- calls `assertVentureAccess` with first-touch claiming explicitly disabled;
- checks child records using combined venture, lifecycle and object predicates;
- derives collector, owner and decision-authority identities from the authenticated server context.

No endpoint mutates `ventures.currentStage`, `ventures.validationStatus`, `ventures.workflowStage`,
or any scoring/readiness field. No automatic lifecycle transition exists.

## Migration handling

- Added additive migration `0018_stage1_validation_spine.sql`.
- Applied the exact migration SQL to the **development** database only.
- Did not run production DDL, create a production migration script, or touch production data.
- Did not run a blanket development migrator because the development migration journal is already
  behind several hand-written repository migrations; doing so could replay unrelated historical SQL.
- Production schema application remains part of the normal Publish flow.

## Verification

- Focused integration suite: **7 passed, 0 failed**.
- Covered:
  - authenticated lifecycle creation;
  - unauthenticated rejection;
  - historical venture-state compatibility;
  - hypothesis linkage;
  - supporting and contradicting evidence;
  - experiment linkage and result-to-evidence conversion;
  - explicit hypothesis-state capture;
  - recommendation/human-decision separation;
  - audit/provenance persistence;
  - the absence of automatic progression and Phase 2 handover.
- The project-wide TypeScript check still reports its existing baseline of approximately 1,100
  errors; no diagnostic was reported in the new Stage 1 schema or router files.
- The development workflow restarted successfully and serves the existing dashboard.

## Disclosed baseline risks outside this slice

1. **Legacy read authorization:** pre-existing public venture-scoped routes, including legacy
   decision reads, can expose IDOR risk. The Stage 1 router does not use those paths.
2. **Migration journal drift:** the database journal and repository migration list are not fully
   reconciled. Stage 1 avoided replaying unrelated migrations.
3. **Project type-check baseline:** extensive pre-existing errors prevent a clean global type-check
   signal, although the new files introduce no reported diagnostic.
4. **Existing runtime query failure:** the dashboard browser console continues to report a 500 from
   the pre-existing `module_reactivations` query. It is unrelated to the validation spine.
5. **Lifecycle version creation concurrency:** the venture/version unique constraint prevents two
   rows from silently taking the same version, but a concurrent loser currently receives a conflict
   rather than an automatic retry.

## Stage 2 recommendation

**CONDITIONAL GO.**

Before adding Stage 2 behavior:

1. repair or retire legacy public venture-scoped reads;
2. reconcile the migration journal so controlled schema promotion is reproducible;
3. pilot the Stage 1 API through a minimal existing surface and collect operator feedback;
4. define a human-controlled lifecycle transition policy and the explicit approval contract for
   any future `EXECUTION_READY` state.

Only after those conditions should Stage 2 add formal transition governance or execution handover.
Do not introduce agents, simulations, automatic progression, next-best-experiment logic, portfolio
learning or external actions until the human-controlled spine has been observed in use.