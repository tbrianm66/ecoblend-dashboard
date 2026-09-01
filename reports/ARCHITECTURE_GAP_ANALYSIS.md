# EcoBlend OS Phase 1 — Venture Validation Engine

## Architecture Gap Analysis

**Institution:** Future Humanity Ventures Ltd  
**Review date:** 2026-09-01  
**Review type:** Read-only architecture audit  
**Scope:** Existing application and database architecture against the Phase 1 validation lifecycle  
**Status:** Baseline and recommendations complete — no Stage 1 implementation started

---

## 1. Executive summary

EcoBlend OS already contains substantial pieces of a venture validation platform:

- venture intake and onboarding;
- assumptions, hypotheses, interviews, evidence, and experiments;
- willingness-to-pay and commercial validation;
- multiple readiness and maturity scoring engines;
- human review, disputes, permissions, audit, risk, and governance foundations;
- reports, portfolio, and investor-facing surfaces.

The principal gap is not the absence of domain functionality. It is the absence of a
single, governed validation lifecycle that connects the existing pieces and gives a
venture one traceable path from an idea to an execution-ready handover.

The target Phase 1 lifecycle is:

```text
IDEA
  → HYPOTHESIS
  → EVIDENCE
  → SIMULATION
  → STRESS TEST
  → ITERATION
  → EXPERIMENT
  → VALIDATION GATE
  → HUMAN DECISION
  → EXECUTION-READY HANDOVER
```

Today, most stages exist as separate screens, routers, tables, or scoring engines.
They are not consistently connected by a shared lifecycle state, evidence contract,
artifact model, decision record, or orchestration service. The result is a platform
with broad capability but fragmented authority:

1. a legacy SPA and shell coexist with a separate `/v2` prototype;
2. client state is split across query caches, contexts, Zustand, localStorage, and
   mock V2 state;
3. validation records use several partially overlapping concepts and schemas;
4. MRL has duplicate active scoring paths, while TRL and BRL lack canonical
   standalone engines;
5. there is no cross-domain simulation and stress-test artifact;
6. reports and exports can use static or divergent data sources;
7. the final human decision and handover are not represented as one immutable,
   evidence-linked record.

The recommended approach is incremental. Do not rebuild the application or create a
new parallel product. First establish a thin Phase 1 validation spine around the
existing modules: canonical lifecycle states, a shared evidence reference,
versioned artifacts, explicit gate decisions, and an execution-ready handover
projection. Then adapt current routers and pages to write and read through that
spine while preserving existing functionality and data.

---

## 2. Audit scope, method, and constraints

### 2.1 Scope

The audit considered:

- frontend routing, shells, state management, forms, and event updates;
- Express, tRPC, authentication, permissions, routers, services, and AI calls;
- PostgreSQL, Drizzle schema generation, migrations, and core validation records;
- scoring engines and their downstream consumers;
- evidence, WTP, experiments, risks, reports, governance, and portfolio paths;
- local application startup, preview behavior, production build, TypeScript, and
  Vitest baseline behavior.

### 2.2 Explicit constraints followed

This review deliberately did **not**:

- rebuild or replace the application;
- remove working functionality;
- redesign the UI;
- make destructive database changes;
- start Stage 1 automatically;
- change application behavior or add a new lifecycle implementation.

The output is an architecture gap analysis and a safe implementation direction for
future work.

### 2.3 Evidence used

The findings are based on repository inspection, the existing diagnostic report
`reports/B02-mrl-trl-mapping-diagnostic.md`, the running development workflow, the
baseline preview, the production build, TypeScript compilation, and the full
Vitest baseline run.

---

## 3. Current architecture

### 3.1 Runtime and application shape

| Area | Current state | Phase 1 implication |
|---|---|---|
| Frontend | React 19, TypeScript, Vite 7, Tailwind v4, Radix/shadcn-style components, Wouter | The UI foundation is usable; lifecycle integration should be added to existing pages rather than introducing a second frontend |
| Backend | Express with tRPC routers and services | A cross-domain orchestration/service layer can be added without replacing the existing router model |
| Database | PostgreSQL, Drizzle ORM, `pg`/node-postgres | Existing records can support a validation spine, but schema ownership and migration discipline need clarification |
| Auth | JWT session cookie using `SESSION_SECRET`; OAuth when configured; development bypass when OAuth is absent | Identity is available for decisions and audit, but caller-supplied identities must be removed from authoritative writes |
| Events | Authenticated venture-scoped SSE | Events need explicit query-cache invalidation or reconciliation semantics |
| Package/runtime | pnpm, Node 20, Vitest | Existing build and test tools are sufficient for incremental work |

The active runtime is `server/_core/index.ts`. It mounts health, OAuth,
authenticated SSE, tRPC, and Vite/static serving. `server/index.ts` appears to be a
second obsolete bootstrap and should remain documented as technical debt until its
usage is conclusively ruled out.

### 3.2 Frontend structure

`client/src/App.tsx` is a large route registry with approximately 187 route
declarations, including aliases and placeholder routes. The legacy routes render
inside the `Sidebar` shell. The `/v2` area uses an independent full-screen shell and
separate mock role/data state.

State is currently distributed across:

- tRPC and TanStack Query;
- `VentureContext`;
- `SelectedVentureContext`;
- Zustand stores;
- localStorage;
- local component state;
- V2 mock state.

This distribution is workable for individual modules, but it makes a venture-wide
lifecycle difficult to reason about. A gate can update one store while a report,
sidebar, or V2 surface reads another source. `useLiveEvents.ts` consumes SSE, but
there is no clear universal rule that an event invalidates or reconciles the
relevant tRPC queries.

Forms also use inconsistent validation patterns. Some use shared Zod schemas and
React Hook Form, while others manage bespoke local state and validation. This
increases the chance that a hypothesis, experiment, or decision can be submitted
with a shape that differs between UI and server.

### 3.3 Backend structure

`server/routers.ts` composes approximately 98 routers and is itself very large.
`server/db.ts` is approximately 1,566 lines and mixes repository and service
responsibilities. These files are functional foundations, but they make it harder
to identify a canonical write path or enforce a single lifecycle transaction.

The tRPC procedure layers currently include:

- `publicProcedure` for intentionally public reads and logout;
- `protectedProcedure` for authenticated operations;
- `adminProcedure` for administrator-only operations;
- `reviewedScoreProcedure` for human-reviewed score writes;
- `integrityReviewerProcedure` for scoring-integrity review.

Mutation security has been materially hardened: mutations use protected or admin
procedures, with logout remaining intentionally public. The remaining Phase 1
authorization risk is primarily object-level consistency, especially on public
reads and some numeric-ID/report paths.

### 3.4 Database structure

`drizzle/schema.ts` is approximately 8,964 lines with about 408 `pgTable`
declarations. There are 21 SQL files in the migration directory. The database
contains useful Phase 1 primitives, including:

- `users`, `ventures`, and `venture_members`;
- `venture_scores`;
- `founders`;
- `milestones`, `risks`, and `experiments`;
- `interviews`;
- `evidence_claims`;
- `customer_segments`;
- `problem_hypotheses`;
- `customer_interviews`;
- `demand_signals`;
- `lean_experiments`;
- `customer_validation_evidence`;
- `wtp_tests` and expanded WTP tables;
- governance, risk, scoring, audit, portfolio, report, and data-room records.

The database is therefore capable of storing most Phase 1 inputs. It does not yet
provide one clearly authoritative model for:

- a lifecycle instance and its current state;
- a versioned validation artifact;
- a cross-domain simulation run;
- a stress-test result and unresolved failure conditions;
- a gate decision with its evidence snapshot;
- the final human decision;
- an execution-ready handover package.

Schema risks include inconsistent foreign-key coverage, mixed identifier types,
duplicate audit/permission/WTP/portfolio/risk concepts, structured data stored as
JSON/text or comma-separated IDs, and duplicate or orphan-looking migration files.
`drizzle.config.ts` points only to `drizzle/schema.ts`; component schemas imported
by code are not direct Drizzle generation inputs. Schema push and deployment
behavior therefore require careful review before any structural migration.

---

## 4. IDEA-to-handover coverage map

The following map distinguishes between **present capability** and **connected
Phase 1 capability**. A module can be strong in isolation and still be incomplete
as part of the lifecycle.

| Phase 1 stage | Existing coverage | Current gap | Recommended disposition |
|---|---|---|---|
| **IDEA** | Onboarding, intake, venture creation, proposition, venture model canvas | Idea origin, framing, owner, and initial scope are not consistently represented as one lifecycle record | Keep and connect to a validation instance |
| **HYPOTHESIS** | Assumptions, problem hypotheses, hypothesis register, proposition, customer segments | No universal hypothesis identity/version/status contract across all modules | Keep; adapt around a canonical hypothesis reference |
| **EVIDENCE** | Evidence ledger, evidence claims, interviews, customer validation evidence, demand signals, WTP evidence | Evidence types, verification state, provenance, and links are not uniformly consumed by every score or decision | Keep; adapt into a shared evidence ledger contract |
| **SIMULATION** | Financial models, readiness calculations, scenario-like scoring, ad hoc scoring routes | No cross-domain simulation orchestrator; outputs are not consistently versioned as artifacts | Adapt; introduce read-only, versioned simulation runs |
| **STRESS TEST** | Risks, market risks, manufacturing risks, startup-failure risks, SRL risk logic, governance risk | No common stress-test input/output model or unresolved-risk gate across domains | Adapt; unify risk scenarios and failure conditions |
| **ITERATION** | Experiment updates, proposition/canvas changes, venture workspaces, coaching/collaboration paths | No explicit link from a failed result or stress condition to the next hypothesis/version | Adapt; preserve history and link revisions to findings |
| **EXPERIMENT** | Discovery experiments, lean experiments, interviews, WTP tests, demand signals | Several experiment concepts and routes coexist without one lifecycle-facing experiment record | Keep; map existing records into a common experiment projection |
| **VALIDATION GATE** | VRL gates, MRL gate lock, governance gates, reviewed score procedures, Gate 4 governance | Gates are domain-specific; no single Phase 1 gate contract says what evidence and unresolved risks are required | Adapt; add explicit gate evaluation and snapshot |
| **HUMAN DECISION** | Score disputes, integrity reviewer, reviewed score writes, governance maturity | No universal decision record for proceed, iterate, pause, or stop with accountable actor and rationale | Keep governance foundations; add decision record |
| **EXECUTION-READY HANDOVER** | Reports, investment pack, data room, portfolio and readiness views | Reports may use static/mock sources or overlapping sources of truth; no canonical handover package | Adapt; create a projection from validated records, not a new parallel workflow |

### Main conclusion

Coverage is broad through **experiment** and partial at **validation gate**. The
largest architectural break is between evidence-producing work and the final
human-governed outcome. The platform needs a traceable chain:

```text
hypothesis version
  → evidence references
  → experiment/simulation/stress artifacts
  → gate evaluation snapshot
  → human decision
  → handover package
```

---

## 5. Module classification

The classification below is an architectural disposition, not a request to
delete, hide, or immediately rewrite any module.

### 5.1 A — Keep, Phase 1

These modules directly support the validation lifecycle and should remain
authoritative inputs or workflow surfaces.

| Module | Reason to keep |
|---|---|
| Idea capture and venture intake | Establishes the venture and initial problem/opportunity context |
| Assumptions and hypothesis register | Provides the starting point for testable claims |
| Customer discovery and interviews | Produces direct beneficiary/customer evidence |
| Evidence ledger/library | Provides the evidence-first basis for scores and decisions |
| Discovery experiments | Converts hypotheses into observable tests |
| WTP and commercial validation | Supplies procurement, budget-owner, pricing, and demand evidence |
| Decision gates and human review | Provides governance and accountability for score and outcome decisions |
| Core audit and permissions foundations | Protects venture scope, reviewer authority, and traceability |

### 5.2 B — Adapt, Phase 1

These modules are valuable but need canonical contracts, lifecycle links, or
source-of-truth boundaries.

| Module | Adaptation required |
|---|---|
| Proposition and venture model canvas | Version changes and link them to hypotheses and decisions |
| Market intelligence and competitor mapping | Make claims and competitor observations evidence-linked |
| VRL, MRL, TRL, BRL, PRL, SRL scoring | Designate canonical engines and persist input/evidence snapshots |
| MVL | Combine market, interview, demand, experiment, and WTP evidence into one validation view |
| Risk and stress-test functionality | Add common scenarios, severity, mitigation, residual risk, and gate impact |
| AI insight automation | Add provenance, prompt/version metadata, redaction, limits, and human-review status |
| Workflow and command centre | Become a lifecycle projection rather than a second task/source-of-truth system |
| Governance gate logic | Expose explicit requirements and decision outcomes in the validation record |
| Reports and handover outputs | Read from validated snapshots and publish provenance |
| Portfolio overview | Present the validation pipeline and current gate, not a competing score source |

### 5.3 C — Preserve, Phase 2

These modules should remain available and protected, but they are downstream of
Phase 1 validation and should not determine the initial validation spine.

| Module group | Phase 2 role |
|---|---|
| Operations and manufacturing execution | Execute after validation and handover |
| Supply chain | Support execution readiness and scale-up |
| R&D execution and manufacturing evidence | Provide later-stage technical and production evidence |
| Investment readiness and investor CRM | Consume validated readiness and handover outputs |
| Execution planning | Turn an approved handover into delivery work |
| Coaching and collaboration execution layers | Support venture teams after or alongside validated decisions |
| Product, brand, and domain-brand architecture | Preserve as execution/scale capabilities |

### 5.4 D — Deprecate later

Deprecation should occur only after replacement paths are live, data is mapped,
and compatibility requirements are understood.

| Module | Reason for later deprecation |
|---|---|
| Placeholder module routes | Create the appearance of coverage without functional lifecycle behavior |
| Obsolete or duplicate bootstrap code | Increases uncertainty about the actual runtime entrypoint |
| Legacy dual-risk implementation | Conflicts with the governed risk/stress-test direction |
| Mock V2 data and state | Must be replaced by production validation surfaces before V2 becomes authoritative |
| Duplicate legacy routes | Remove only after migration compatibility and usage are established |

### 5.5 E — Requires investigation

These areas are blockers to confidently declaring a canonical Phase 1 architecture.

| Investigation area | Why it matters |
|---|---|
| Duplicate MRL engines and score semantics | The same venture can receive different levels and downstream VRL contributions |
| Public read endpoints and cross-venture IDOR exposure | A validation record must not be visible outside its venture scope |
| Contextual router raw SQL/MySQL remnants | PostgreSQL compatibility and query correctness are uncertain |
| Schema component export and migration consistency | Schema changes may not be generated or applied from one authoritative input |
| Portfolio/report source-of-truth boundaries | Published outputs may not represent the live assessment state |
| AI provenance and human-review enforcement | AI-derived claims must not be mistaken for verified evidence or human decisions |
| Production/development database isolation | Audit and migration safety cannot be assumed without explicit environment boundaries |
| TypeScript error volume and build-time architecture | Approximately 1,100 errors limit confidence in broad refactoring |

---

## 6. Service and database areas affected

### 6.1 Service areas

The Phase 1 spine will eventually cross the following existing areas:

- `routers.ts` and the composed tRPC router;
- intake, discovery, interviews, proposition, lean canvas, and experiment routers;
- WTP and customer validation routes;
- evidence and institutional memory routes;
- VRL, MRL, MRL scoring, SRL, CRL/PRL, and readiness routes;
- risk, governance, and command-centre routes;
- reports, portfolio, investment pack, and data-room routes;
- authenticated event delivery and client cache reconciliation;
- authentication context and venture-access checks.

The architectural recommendation is not to make all of these routers call one
another directly. Cross-domain coordination should live in a dedicated service
boundary that:

1. accepts a venture-scoped validation command;
2. resolves current authorized records;
3. creates immutable or versioned artifacts;
4. evaluates explicit gate criteria;
5. records human decisions separately from computed results;
6. returns a stable lifecycle projection for the UI and reports.

### 6.2 Database areas

Existing tables likely to participate as inputs include:

- ventures, venture members, founders, and users;
- problem hypotheses, customer segments, interviews, and customer interviews;
- demand signals, lean experiments, WTP tests, and customer validation evidence;
- evidence claims and evidence-ledger records;
- milestones, risks, market risks, and other risk registers;
- scoring sessions, category results, MRL assessments, and VRL assessments;
- governance, audit, dispute, report, portfolio, and data-room records.

Missing or unclear concepts that should be resolved before implementation:

| Required concept | Current issue | Safe direction |
|---|---|---|
| Validation lifecycle instance | No single record clearly owns the Phase 1 run | Add a non-destructive, venture-scoped lifecycle projection or equivalent |
| Hypothesis version | Hypothesis concepts exist in multiple places | Use stable IDs plus explicit versions/statuses; do not overwrite prior claims |
| Evidence reference | Evidence is present but not uniformly linked to outputs | Reference existing evidence records rather than duplicating their content |
| Simulation artifact | Scoring and financial calculations are not one versioned run | Persist inputs, engine identity, version, output, and timestamp |
| Stress-test artifact | Risk is distributed across several implementations | Store scenario, assumptions, failure condition, mitigation, and result |
| Gate snapshot | Domain gates do not form one Phase 1 decision boundary | Record evaluated criteria and the evidence/artifact IDs used |
| Human decision | Reviewed score writes are not a universal outcome decision | Separate computed recommendation from accountable human outcome |
| Handover package | Reports/data-room outputs have overlapping sources | Generate a projection from immutable snapshots with provenance |

No destructive conversion should be attempted as part of this audit. Existing
records should be mapped in place or through additive compatibility projections
after a migration plan and rollback path are approved.

---

## 7. Scoring and validation engine gaps

### 7.1 MRL is not yet canonical

The existing diagnostic found multiple active MRL paths:

- Engine A in `server/mrl.engine.ts`, based on five subsystem scores;
- Engine B in `server/mrlScoring.ts`, based on weighted categories and gate locks;
- Engine C in `server/sync.engine.ts`, using a legacy 0.30 MRL penalty;
- an indirect Engine D path in `server/crl.router.ts`, where PRL uses an MRL level
  normalized by 9.

These engines accept different inputs, use different formulas, and are not called
as one sequence for the same venture. Engine A and Engine B can produce different
levels near boundaries; Engine C produces a qualitatively different penalty; and
Engine D uses a different normalization convention.

The current dual-pathway direction is that MRL feeds VRL at:

- Product × 0.35;
- Execution × 0.40.

That decision is documented in project guidance, but legacy constants and stale
comments remain in active code paths. Before Phase 1 scores can be used as gate
evidence, the platform needs a written canonical-engine decision and a migration
policy for existing records.

### 7.2 Other scoring engines

- `server/vrl.engine.ts` is the canonical Gate 2 VRL engine with ten dimensions,
  meta-domains, veto logic, and governed MRL handling.
- `server/mrl.engine.ts` and `server/mrlScoring.ts` overlap and need reconciliation.
- `server/srl.engine.ts` provides a formal stage-aware sustainability engine with
  KPI coverage, gates, regression, and risk controls.
- PRL is embedded in coaching logic rather than exposed as one reusable engine.
- TRL and BRL do not currently have canonical standalone scoring engines.
- MVL is an input to VRL but is not yet a complete independent market-validation
  engine.

### 7.3 WTP and market validation

`shared/wtp.ts` is the strongest reusable validation-domain implementation. It
contains an evidence ladder, budget-owner scoring, procurement pathway scoring,
pricing response scoring, venture WTP status, warnings, recommendations, and
commercial stage-gate logic.

Discovery, competitor, demand-signal, market-risk, experiment, and WTP pages and
routers are already substantial. The missing layer is a canonical MVL/market
validation engine that combines these evidence sources without duplicating or
silently replacing them.

---

## 8. Governance, security, and data integrity gaps

### 8.1 Strengths to preserve

- Mutation procedures have been hardened to protected or admin access.
- Venture-scoped writes use `assertVentureAccess`, including admin bypass,
  membership checks, and first-touch claiming for legacy unclaimed ventures.
- Human review is required for score writes through reviewed-score middleware.
- Integrity reviewer access is restricted to administrators and the
  `scoring_integrity_reviewer` role.
- SSE is authenticated and venture-scoped for non-admins.
- Gate 4 batch reactivation includes transaction handling, optimistic conflict
  detection, audit grouping, shared timestamps, and DB-confirmed `persistedAt`.

These are foundations for the Phase 1 decision record and should not be replaced.

### 8.2 Gaps to resolve

- Public reads do not consistently enforce object-level venture membership.
- Some numeric-ID and report endpoints need explicit IDOR review.
- Some AI/report operations accept reviewer or identity fields from the caller
  instead of deriving them from authenticated context.
- AI calls lack one visible policy for prompt/version provenance, timeout, retry,
  budget, rate limit, transcript redaction, and size controls.
- Direct JSON parsing in some AI routes makes malformed or untrusted output harder
  to govern.
- Audit concepts and relationship fields are duplicated in places, including
  comma-separated IDs in report relationships.
- A computed score, an AI suggestion, a verified evidence item, and a human
  decision are not universally distinguished in the data model.

The Phase 1 lifecycle must treat identity, evidence verification, computed
recommendation, and human outcome as separate facts.

---

## 9. Reports, portfolio, and handover risks

The application contains report, investor data-room, portfolio, SRL, and
investment-pack infrastructure. These surfaces are useful consumers of a Phase 1
handover, but they are not currently one consistent output path.

Known risks include:

- V2 `ReportsDataRoom.tsx` uses mock reports and its export action is not wired;
- the portfolio PDF export reads static `Venture` values from
  `client/src/lib/data.ts`, not live scoring engines;
- `InvestmentPack.tsx` also references static readiness values;
- portfolio, offerings, readiness scores, and reports have overlapping sources of
  truth;
- report relationship identifiers are sometimes stored as comma-separated IDs;
- a generated report is not consistently traceable to a hypothesis, evidence
  snapshot, gate evaluation, and human decision.

The handover should therefore be a read model or projection over validated,
versioned records. It should not become another mutable score store. Every
published number or conclusion should be able to identify:

```text
source record
source version
calculation/engine version
evidence references
review status
decision owner
decision timestamp
```

---

## 10. Technical and migration risk register

| Risk | Severity | Why it matters | Mitigation direction |
|---|---|---|---|
| No unified Phase 1 state machine | Critical | The application cannot reliably answer where a venture is in validation or what is blocking progression | Add an additive lifecycle projection and explicit transition rules |
| Duplicate MRL and readiness semantics | High | Scores and gates can vary by route | Canonicalize engines before binding them to new gates |
| Missing evidence/artifact provenance | High | Decisions cannot be reproduced or defended | Link every gate and handover output to immutable/versioned inputs |
| Fragmented frontend state | High | Screens can show stale or contradictory lifecycle state | Define one lifecycle query/projection and reconcile SSE events |
| Static/mock reporting paths | High | External outputs may not represent live venture state | Make report generation consume validated projections |
| Distributed risk implementations | High | Stress tests cannot consistently block or inform a gate | Introduce a common stress-test artifact without deleting existing risk data |
| Inconsistent object-level authorization | High | Cross-venture data exposure is possible | Audit every read by venture scope and derive actor identity server-side |
| Large schema with duplicate concepts | High | Additive migrations may create more competing sources of truth | Establish ownership and mapping before adding tables |
| Raw MySQL syntax/SQL remnants | High | PostgreSQL runtime behavior may diverge or fail | Isolate and reconcile affected query paths before lifecycle integration |
| TypeScript error volume | High | Broad changes are difficult to validate safely | Reduce errors by bounded domain, starting with new lifecycle contracts |
| Duplicate/obsolete bootstrap code | Medium | Runtime assumptions may be wrong | Document the active entrypoint and remove only after usage verification |
| AI output and prompt governance | Medium/High | AI suggestions can be mistaken for verified evidence | Store provenance and require explicit human confirmation |
| Unclear environment isolation | High | Development operations could affect production data | Verify database URLs, migration procedure, and deployment environment boundaries |

---

## 11. Baseline verification

The baseline was established before this report and the application remained
unchanged during the audit.

### 11.1 Application and preview

- Workflow: `pnpm dev`
- Workflow status: running
- Root preview: renders successfully
- Visible surface: legacy EcoBlend analytics dashboard and sidebar shell
- Seeded venture data: visible
- Login redirect: not observed
- Screenshot: `reports/architecture-baseline-home.jpg`

Browser observations were mostly healthy. A dedicated smoke test reported no
failed requests. Screenshot capture did observe one HTTP 500 resource response;
the discrepancy should be investigated before relying on browser-level validation
for future lifecycle work.

### 11.2 Build and type check

- Production build: succeeds
- Build warnings: missing analytics placeholders
- Client bundle: very large; primary generated client chunk is approximately 7.2 MB
- Initial TypeScript check: hit the Node heap limit
- Rerun with a larger heap: completed with exit code 2 and approximately 1,100
  TypeScript errors

The TypeScript debt is an architecture and validation risk, not a reason to
rewrite the application during Phase 1.

### 11.3 Tests

Observed full Vitest baseline:

- 3,254 tests passing;
- 13 failing tests in `contextual.phase3c.test.ts`;
- `contextual.phase3d.test.ts` fails to load because it imports missing
  `mysql2/promise`;
- one worker reached the JavaScript heap limit.

These failures were pre-existing audit findings. They should remain documented
and should not be silently “fixed” as part of the architecture report. The
project guidance also contains an older historical baseline of 3,190 passing and
55 failing tests; the observed audit run is the more recent measurement.

---

## 12. Safe checkpoint

The safe checkpoint for future structural work is:

```text
Commit: 9b2b1c3
Branch: main
Relation to origin/main: ahead by one commit
Repository state at audit start: clean
```

The only untracked item produced during the audit is the baseline screenshot:

```text
reports/architecture-baseline-home.jpg
```

Future implementation should begin from the checkpoint above, preserve the
working Gate 4/security changes, and use additive migrations with a tested
rollback path. No destructive schema operation is authorized by this report.

---

## 13. Recommended Stage 1 approach

Stage 1 should be a narrow architectural foundation, not a UI rewrite and not a
replacement of existing domain modules.

### 13.1 Establish the canonical vocabulary

Agree and document the meaning of:

- lifecycle stage;
- hypothesis and hypothesis version;
- evidence item, evidence claim, and verification status;
- simulation artifact;
- stress-test scenario and result;
- experiment and result;
- validation gate;
- human decision;
- execution-ready handover.

The vocabulary must distinguish:

1. observed evidence;
2. derived calculations;
3. AI-generated suggestions;
4. human-confirmed decisions.

### 13.2 Add a thin validation spine

Create an additive, venture-scoped orchestration boundary that can reference
existing records. It should:

- identify the validation run or lifecycle instance;
- expose the current stage and blockers;
- accept links to hypotheses, evidence, experiments, simulations, and stress tests;
- create versioned snapshots rather than overwriting prior conclusions;
- evaluate gate criteria;
- record a human decision with actor, rationale, timestamp, and referenced inputs;
- project an execution-ready handover without duplicating source data.

This spine should initially support reads and explicit commands for existing
records. It should not require every legacy module to migrate at once.

### 13.3 Canonicalize scoring before using it as a gate

Before introducing a new validation gate that depends on readiness scores:

1. designate the authoritative MRL engine;
2. document how existing Engine A/B/C/D records map to the canonical result;
3. remove or isolate stale constants and comments through a separately tested
   reconciliation change;
4. define score-version and input-snapshot semantics;
5. ensure reports and portfolio views consume the same result.

The same discipline should be applied to MVL, PRL, TRL, BRL, and SRL as those
domains become gate inputs.

### 13.4 Connect one vertical slice first

The safest first slice is:

```text
existing hypothesis
  → existing evidence/interview or experiment
  → evidence-linked evaluation
  → explicit human validation decision
  → handover preview
```

Use one existing venture and preserve all existing records. The slice should
prove the data contract, authorization, audit trail, cache invalidation, and
report provenance before expanding to every scoring and risk domain.

### 13.5 Add verification around behavior, not just types

For the first implementation slice, require:

- server-side venture authorization tests;
- transition and invalid-transition tests;
- evidence requirement tests;
- decision identity and audit tests;
- concurrent-write tests where lifecycle state can race;
- report provenance tests;
- one end-to-end browser pass through the existing UI surface;
- explicit handling of the known TypeScript, MySQL-import, and contextual test
  baseline issues.

### 13.6 Migration guardrails

- Do not rename or delete existing tables during the first slice.
- Prefer nullable/additive fields or compatibility projections.
- Backfill only from deterministic existing records.
- Keep old routes operational while the new projection is compared against them.
- Do not publish new readiness or investment outputs until their source is live
  and provenance is visible.
- Verify development/production database isolation before running migrations.

---

## 14. Prioritized next decisions

The following decisions should be made before Stage 1 coding begins:

1. **Lifecycle ownership:** Which record is the authoritative owner of a Phase 1
   validation run?
2. **Hypothesis identity:** Which existing hypothesis concept becomes canonical,
   and how are versions represented?
3. **Evidence contract:** What minimum evidence status is required at each gate?
4. **Scoring authority:** Which MRL and readiness engines are canonical, and how
   are legacy records interpreted?
5. **Stress-test semantics:** Which unresolved conditions block progression versus
   create a monitored risk?
6. **Decision authority:** Which roles can make, review, dispute, or overturn a
   human decision?
7. **Handover contents:** What is mandatory for execution readiness, and which
   reports are projections rather than sources of truth?
8. **Environment safety:** How are development, deployed, and production
   databases isolated and migrated?

Until these decisions are explicit, adding more screens or another score route
would increase surface area without closing the core architecture gap.

---

## 15. Final assessment

EcoBlend OS is not a blank platform. It is a substantial but federated collection
of validation, scoring, governance, risk, and execution capabilities. The correct
Phase 1 strategy is to connect and govern what already works:

```text
preserve existing domain capability
  + add one lifecycle spine
  + make evidence and artifacts versioned
  + separate computation from human decision
  + make handover a provenance-preserving projection
```

The application is suitable for incremental Stage 1 work after the canonical
vocabulary, scoring authority, lifecycle owner, and migration guardrails are
approved. Stage 1 has not been started by this audit.
