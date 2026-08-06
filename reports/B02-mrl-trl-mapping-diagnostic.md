# B-02 Stage 1 — MRL/TRL Mapping Diagnostic Report
**EcoBlend OS · Read-Only Analysis · Generated: 2026-08-05**
**Status: DRAFT FOR REVIEW — No code changes made**

---

## Executive Summary

Three independent MRL scoring engines exist in the codebase. They were built
at different times, never reconciled, and are currently live on different code
paths. They produce **different MRL levels from the same venture data**, feed
**different VRL weights**, and contain **stale inline comments** that contradict
the current implementation. One engine (`mrl.engine.ts`) explicitly carries a
legacy `0.30` weight constant inside its INTEGRATION_MODEL export alongside a
dual-pathway fix comment — making the stale weight still importable by callers.

No database records currently exist for the two heaviest engines (Engine A and
the VRL assessments table), so live divergence is limited to 1 scoring session.
However, the architectural divergence is a latent correctness and governance risk
for every future assessment.

---

## 1. Annotated Extracts of MRL Mapping Functions

### 1.1 Engine A — `server/mrl.engine.ts`

**Origin:** Five-engine subsystem architecture (PDE · SCIE · CSM · QCE · SIL).
**Introduced:** Phase 4A/4C era (commit `00338c4`, Manus agent, 2026-05-22).
**MRL level formula:** `compositeScoreToMrlLevel`

```typescript
// server/mrl.engine.ts  line 299–331

/** Composite score: arithmetic mean of 5 subsystem scores (0–100 each). */
export function computeCompositeMrlScore(scores: {
  pde: number; scie: number; csm: number; qce: number; sil: number;
}): number {
  const { pde, scie, csm, qce, sil } = scores;
  return Math.round((pde + scie + csm + qce + sil) / 5);  // integer output
}

/** Derive MRL level (1–9) from composite score (0–100).
 *  Each level represents ~11 points of the 0–100 scale.
 *  ⚠ ANNOTATED: Uses Math.ceil(score / 11.11), clamped to [1, 9].
 *    This means compositeScore=0 → Math.ceil(0)=0 → clamped to 1.
 *    Boundary at each level: level N begins at (N-1)×11.11 + ε */
export function compositeScoreToMrlLevel(compositeScore: number): number {
  return Math.min(9, Math.max(1, Math.ceil(compositeScore / 11.11)));
}
```

**VRL contribution (Engine A):**
```typescript
// server/mrl.engine.ts  line 333–356  (post D6 fix comment)

/** ⚠ ANNOTATED: Header (line 7) still reads "VRL weight: MRL contributes 0.30 to VRL composite".
 *  This is STALE. The D6 fix changed the engine but did not update the file header.
 *  The INTEGRATION_MODEL object (line ~220) still exports mrl: 0.30 with
 *  a "legacy" comment — making it importable by callers who have not read the D6 note.
 *
 *  This function now returns 0–1 (normalised), NOT 0–30. */
export function computeVrlContribution(mrlLevel: number): number {
  const mrlScore = ((mrlLevel - 1) / 8) * 100;  // level (1–9) → score (0–100)
  return Math.round((mrlScore / 100) * 10000) / 10000; // → normalised 0–1 (4dp)
}
```

**Stale artefacts in Engine A (read-only observations):**

| Location | Stale content | Correct value |
|---|---|---|
| `mrl.engine.ts` line 7 (file header comment) | "VRL weight: MRL contributes **0.30** to VRL composite" | Dual-pathway: 0.35 (Product) + 0.40 (Execution) |
| `mrl.engine.ts` INTEGRATION_MODEL export | `mrl: 0.30, // legacy — see note above` | Weight is still exported and importable |
| `drizzle/schema.ts` line 5741–5742 | `// VRL contribution (MRL weight = **0.30** in VRL composite)` | Stale; dual-pathway superseded |
| `drizzle/schema.ts` line 5742 | `// MRL - **0.30** contribution to VRL` | Stale |

---

### 1.2 Engine B — `server/mrlScoring.ts`

**Origin:** BEBUS-MRL-SCORE-001 specification; weighted category scoring.
**Introduced:** Commit `345cbb3` (2026-06-16); earlier checkpoint `00338c4`.
**MRL level formula:** `getMRLLevel` (lookup from `MRL_THRESHOLDS`)

```typescript
// server/mrlScoring.ts  line 104–116

/** Formula 7 — MRL level thresholds.
 *  ⚠ ANNOTATED: Boundaries use strict inequality on max (score < max),
 *    except level 9 which uses max: 100.001 to capture exactly 100.
 *    L1 begins at 0.0 (not 0.001), so score=0 maps to L1. */
export const MRL_THRESHOLDS = [
  { level: 1, min:  0.0, max: 11.0,    label: "Concept",      trl_alignment: "TRL 1–2" },
  { level: 2, min: 11.0, max: 22.0,    label: "Feasibility",  trl_alignment: "TRL 2–3" },
  { level: 3, min: 22.0, max: 33.0,    label: "Process Dev",  trl_alignment: "TRL 3–4" },
  { level: 4, min: 33.0, max: 44.0,    label: "Pilot Ready",  trl_alignment: "TRL 4–5" },
  { level: 5, min: 44.0, max: 55.0,    label: "Pilot Proven", trl_alignment: "TRL 5–6" },
  { level: 6, min: 55.0, max: 66.0,    label: "Pre-Series",   trl_alignment: "TRL 6–7" },
  { level: 7, min: 66.0, max: 77.0,    label: "Low-Rate",     trl_alignment: "TRL 7–8" },
  { level: 8, min: 77.0, max: 88.0,    label: "Scale-Up",     trl_alignment: "TRL 8–9" },
  { level: 9, min: 88.0, max: 100.001, label: "Industrial",   trl_alignment: "TRL 9"   },
];

/** ⚠ ANNOTATED: Master formula.
 *    MRL_score = [ Σ(w_i × S_i × M_i) / Σw_i ] × 10
 *    Range: 0–100 (subject to gate lock cap at 44.0)
 *    Gate lock cap = top of MRL 4 band → locked sessions can NEVER exceed L4. */
export function getMRLLevel(score: number): { level: number; label: string } {
  const threshold = MRL_THRESHOLDS.find(t => score >= t.min && score < t.max);
  if (threshold) return { level: threshold.level, label: threshold.label };
  return { level: 9, label: "Industrial" }; // edge: score exactly 100
}
```

**Category weights (Engine B only — no analogue in Engine A):**

| Category | Weight | Maturity range |
|---|---|---|
| Process | 0.28 | 0 (Assumed ×0.60) – 4 (Certified ×1.20) |
| Supply Chain | 0.22 | same |
| Cost | 0.20 | same |
| Quality | 0.18 | same |
| Sustainability | 0.12 | same |
| **Total** | **1.00** | |

**Gate lock (Engine B only):** 11 critical indicators with floor thresholds. Any
indicator below its floor caps `mrl_score` at 44.0 (top of MRL-4 band).

**VRL feed (Engine B):**
```typescript
vrl_feed: {
  mrl_score_normalised: mrl_score / 100,  // 0–1 canonical input for vrl.engine.ts
  mrl_weight_product:   0.35,             // Product meta-domain
  mrl_weight_execution: 0.40,             // Execution meta-domain
}
```

---

### 1.3 Engine C — `server/sync.engine.ts`

**Origin:** BEBUS-SYNC-SE-001 / TRL–MRL Synchronisation Engine.
**MRL input:** Integer level (1–9), NOT a 0–100 score.

```typescript
// server/sync.engine.ts  line 20–22

/** ⚠ ANNOTATED: VRL_WEIGHT_MRL = 0.30 — this is the OLD single-pathway weight.
 *  It predates the dual-pathway fix in vrl.engine.ts. It is used in a PENALTY
 *  formula that SUBTRACTS from a base VRL score, not in vrl.engine.ts's weighted
 *  sum. These are architecturally incompatible — they cannot both be "correct"
 *  for the same venture simultaneously. */
export const VRL_WEIGHT_MRL = 0.30;

// Formula 5: δ_VRL = (1 − η) × VRL_WEIGHT_MRL
// Adjusted_VRL = Base_VRL × (1 − δ_VRL)
```

---

### 1.4 Engine D — `server/crl.router.ts` (PRL composite path)

```typescript
// server/crl.router.ts  line 243–249

/** ⚠ ANNOTATED: MRL feeds VRL indirectly via PRL.
 *  PRL (Product Readiness Level) = (0.5 × TRL_norm) + (0.5 × MRL_norm)
 *  where MRL_norm = mrlLevel / 9  (level-to-fraction, NOT score/100)
 *  Falls back to pure TRL when no MRL assessment exists. */
const mrlNorm = params.mrlLevel != null
  ? Math.min(9, Math.max(0, params.mrlLevel)) / 9
  : trlNorm;
const prlNorm = params.mrlLevel != null
  ? (0.5 * trlNorm) + (0.5 * mrlNorm)
  : trlNorm;
```

---

## 2. Call Graph — MRL/TRL Mapping Invocation Tree

```
User / tRPC client
│
├── trpc.mrl.createAssessment                     [mrl.router.ts]
│     └── computeCompositeMrlScore(5 subsystems)  [mrl.engine.ts]  ← ENGINE A
│         └── compositeScoreToMrlLevel(composite) [mrl.engine.ts]
│             └── computeVrlContribution(level)   [mrl.engine.ts]
│                 └─ persists to mrl_assessments.vrlContribution
│                    ⚠ comment says "0.30 weight" (stale)
│
├── trpc.mrl.simulateFromTrl                      [mrl.router.ts]
│     └── trlToMrlAlignment(trlLevel)             [mrl.engine.ts]
│         └── computeVrlContribution(recommendedMrl)
│             └─ returns to client (never persisted)
│
├── trpc.mrlScoring.computeAdHoc                  [mrlScoring.router.ts]
│     └── computeMRLScore(categoryInputs)         [mrlScoring.ts]  ← ENGINE B
│         ├── getMRLLevel(score)                  [mrlScoring.ts]
│         ├── checkGateLock(indicators)           [mrlScoring.ts]
│         └─ returns vrl_feed {normalised, 0.35, 0.40}
│
├── trpc.mrlScoring.computeAndSave                [mrlScoring.router.ts]
│     └── computeMRLScore(categoryInputs)         [mrlScoring.ts]  ← ENGINE B
│         └─ persists to scoring_sessions + scoring_category_results
│
├── trpc.sync.compute                             [sync.router.ts]
│     └── computeSync({trl, mrl, ...})            [sync.engine.ts] ← ENGINE C
│         └── VRL_WEIGHT_MRL = 0.30 (penalty)
│             └─ returns adjustedVRL (not persisted to vrl_assessments)
│
├── trpc.crl.getFullProfile / getDashboard        [crl.router.ts]  ← ENGINE D
│     ├── mrlAssessments lookup (latest by venture)
│     └── computeVrlWithCrl({trlLevel, mrlLevel})
│         └── PRL = 0.5×TRL_norm + 0.5×(mrlLevel/9)
│             └─ feeds α·PRL into CRL-based VRL formula
│
├── trpc.vrl.*                                    [vrl.router.ts]
│     └── computeVrl({mrlScore, ...})             [vrl.engine.ts]
│         ├── productScore = TRL×0.40 + mrlScore×0.35 + BRL×0.25
│         └── executionScore = FRL×0.60 + mrlScore×0.40
│             └─ persists to vrl_assessments (currently 0 rows)
│
└── client exportPortfolioPdf()                   [client/src/lib/exportPdf.ts]
      └── v.vrl, v.trl  ← STATIC MOCK DATA from lib/data.ts
          ⚠ NOT sourced from any scoring engine; hardcoded Venture objects
```

**Key observation:** Engines A, B, C, and D are never called in sequence for
the same venture. Each lives on a separate tRPC route. There is no orchestration
layer that reconciles their outputs.

---

## 3. Git History — How Both Mappings Came to Exist

| Date | Commit | Author | Change |
|---|---|---|---|
| 2026-05-22 | `00338c4` | Manus agent | Phase 4A–4C: 12 DB tables, failure risk engine. **mrl.engine.ts** introduced with `computeCompositeMrlScore`, `compositeScoreToMrlLevel`, and VRL weight comment `0.30`. |
| 2026-05-22 | `00338c4` | Manus agent | `mrlScoring.ts` (Engine B) also introduced in same checkpoint. Both engines created simultaneously — no migration story documented. |
| 2026-06-16 | `345cbb3` | Replit Agent | "Update VRL scoring to use dual-pathway MRL weighting." Updated `vrl.engine.ts` to dual-pathway (0.35 Product + 0.40 Execution). Updated `computeVrlContribution` in `mrl.engine.ts` to return 0–1 (not 0–30). Added D6 fix comment. **Did not remove stale `0.30` from file header or INTEGRATION_MODEL export.** |
| 2026-06-16 | `345cbb3` | Replit Agent | `mrlScoring.ts` updated to add `vrl_feed` block with dual-pathway weights. `mrlScoring.test.ts` updated. |
| 2026-06-16 | `7bea8d3` | Replit Agent | Paired commit (duplicate checkpoint entry for same change). |

**Summary:** Both Engine A and Engine B were created at the same time by the same
agent in a large checkpoint commit. No design decision document or migration plan
separates them. Engine B is the BEBUS-MRL-SCORE-001 specification engine;
Engine A is the five-subsystem architecture engine. They coexist without a
canonical "which engine is authoritative" declaration in code or documentation.

---

## 4. MRL 1–9 Divergence Table

The two engines have different input domains and scoring formulas.
To compare them on the same scale, we map MRL level (1–9) to the
**normalised 0–1 score** that each engine would produce for a venture
at exactly that MRL level, and to the **VRL contribution** each engine passes downstream.

### 4.1 Score-to-Level Boundary Comparison

| MRL Level | Label | Engine A boundary (compositeScore / 11.11) | Engine B boundary (MRL_THRESHOLDS score) | Delta (A upper − B upper) |
|---|---|---|---|---|
| 1 | Concept | 0 – 11.11 | 0.0 – <11.0 | +0.11 (Engine A extends 0.11 pts higher) |
| 2 | Feasibility | 11.12 – 22.22 | 11.0 – <22.0 | +0.22 |
| 3 | Process Dev | 22.23 – 33.33 | 22.0 – <33.0 | +0.33 |
| 4 | Pilot Ready | 33.34 – 44.44 | 33.0 – <44.0 | +0.44 |
| 5 | Pilot Proven | 44.45 – 55.55 | 44.0 – <55.0 | +0.55 |
| 6 | Pre-Series | 55.56 – 66.66 | 55.0 – <66.0 | +0.66 |
| 7 | Low-Rate | 66.67 – 77.77 | 66.0 – <77.0 | +0.77 |
| 8 | Scale-Up | 77.78 – 88.88 | 77.0 – <88.0 | +0.88 |
| 9 | Industrial | 88.89 – 100 | 88.0 – 100 | +0.89 |

**Impact:** A venture scoring between 11.0 and 11.11 on Engine A's 0–100 composite
scale is **MRL-1** under Engine B but **MRL-1** under Engine A (boundary coincides
within rounding). However a venture at composite=11.10 is still L1 under Engine A
(`Math.ceil(11.10/11.11) = Math.ceil(0.9991) = 1`) while Engine B maps 11.0–<22.0
to L2. **Critical divergence zone: composite scores 11.0–11.11.**

### 4.2 VRL Contribution Divergence by MRL Level

For a venture at each MRL level (1–9):

| MRL Level | Engine A `computeVrlContribution` (0–1) | Engine B `mrl_score_normalised` at band midpoint (0–1) | Δ (A − B) | Engine C VRL penalty at this level (δ_VRL = 0.30 × (1−η)) |
|---|---|---|---|---|
| 1 | 0.0000 | 0.0550 (midpt 5.5/100) | −0.0550 | 0.30 × (1 − 0) = 0.300 (worst case: no sync) |
| 2 | 0.1250 | 0.1650 (midpt 16.5/100) | −0.0400 | — |
| 3 | 0.2500 | 0.2750 (midpt 27.5/100) | −0.0250 | — |
| 4 | 0.3750 | 0.3850 (midpt 38.5/100) | −0.0100 | — |
| 5 | 0.5000 | 0.4950 (midpt 49.5/100) | +0.0050 | — |
| 6 | 0.6250 | 0.6050 (midpt 60.5/100) | +0.0200 | — |
| 7 | 0.7500 | 0.7150 (midpt 71.5/100) | +0.0350 | — |
| 8 | 0.8750 | 0.8250 (midpt 82.5/100) | +0.0500 | — |
| 9 | 1.0000 | 0.9400 (midpt 94.0/100) | +0.0600 | — |

**Direction of divergence:** Engine A **underestimates** MRL contribution at low
levels (L1–L4) relative to Engine B, and **overestimates** at high levels (L6–L9).
The crossover point is between L4 and L5.

### 4.3 VRL Impact Calculation

Engine B feeds `mrl_score_normalised` into **two** VRL pathways:
- **Product**: contribution = `mrl_score_normalised × 0.35`
- **Execution**: contribution = `mrl_score_normalised × 0.40`

Engine A only computes a single 0–1 value via `computeVrlContribution` and
persists it to `mrl_assessments.vrlContribution`. No downstream code in
`vrl.router.ts` reads `mrlAssessments.vrlContribution` — the VRL router
takes `mrlScore` directly as a user-supplied integer (0–100).

**Divergence plot data (for charting):**

```
MRL Level | Eng-A normalised | Eng-B normalised | Eng-B VRL_product | Eng-B VRL_execution | Eng-A VRL_product | Eng-A VRL_execution
1         | 0.0000           | 0.0550           | 0.0193            | 0.0220              | 0.0000            | 0.0000
2         | 0.1250           | 0.1650           | 0.0578            | 0.0660              | 0.0438            | 0.0500
3         | 0.2500           | 0.2750           | 0.0963            | 0.1100              | 0.0875            | 0.1000
4         | 0.3750           | 0.3850           | 0.1348            | 0.1540              | 0.1313            | 0.1500
5         | 0.5000           | 0.4950           | 0.1733            | 0.1980              | 0.1750            | 0.2000
6         | 0.6250           | 0.6050           | 0.2118            | 0.2420              | 0.2188            | 0.2500
7         | 0.7500           | 0.7150           | 0.2503            | 0.2860              | 0.2625            | 0.3000
8         | 0.8750           | 0.8250           | 0.2888            | 0.3300              | 0.3063            | 0.3500
9         | 1.0000           | 0.9400           | 0.3290            | 0.3760              | 0.3500            | 0.4000
```

*(Eng-B VRL contributions = normalised × weight; Eng-A contributions use Engine A normalised × same weights for comparison.)*

---

## 5. Affected-Record Inventory

### 5.1 Live Database Record Counts (as of 2026-08-05)

| Table | Engine | Row count | Notes |
|---|---|---|---|
| `scoring_sessions` | Engine B (`mrlScoring.ts`) | **1** | 1 live session with `mrl_score`, `mrl_level`, `gate_locked` |
| `scoring_category_results` | Engine B | Unknown (linked to sessions) | Sub-category results per session |
| `mrl_assessments` | Engine A (`mrl.engine.ts`) | **0** | No assessments created via UI yet |
| `vrl_assessments` | `vrl.engine.ts` | **0** | No VRL assessments persisted yet |
| `mrl_risk_register` | Engine A (seeded on assessment creation) | 0 (no assessments exist) | |
| `mrl_suppliers` | Engine A | 0 | |
| `mrl_cost_models` | Engine A | 0 | |
| `mrl_compliance_records` | Engine A | 0 | |

### 5.2 The Single Live `scoring_sessions` Record

Schema fields confirmed live: `sessionId`, `ventureId`, `ventureName`,
`mrlScore`, `mrlScoreRaw`, `mrlLevel`, `mrlLabel`, `confidenceBand`,
`gateLocked`, `gateReason`, `snapshotHash`, `createdAt`.

**Divergence exposure of this record:** This session was scored under Engine B.
If re-scored through Engine A with the same venture's subsystem scores, the
`mrl_level` output could differ by ±1 level depending on where the composite
score falls near an 11-point boundary (see §4.1). The `vrlContribution` stored
in any hypothetical Engine A `mrl_assessments` row would differ from the `vrl_feed`
block computed by Engine B.

### 5.3 Schema-Level Stale Fields

| Table | Field | Schema comment | Actual state |
|---|---|---|---|
| `mrl_assessments` | `vrlContribution` | "MRL - 0.30 contribution to VRL" | Comment is stale; D6 fix changed this to 0–1 normalised |
| `mrl_assessments` | `mrlLevel` | "1–9 from mrlAssessments.mrlLevel" | Populated by Engine A (`compositeScoreToMrlLevel`) |
| `scoring_sessions` | `mrlScore` | numeric(5,1) | Populated by Engine B (`computeMRLScore`) |

---

## 6. Veto-Gate Sensitivity Analysis

### 6.1 `vrl.engine.ts` Veto Gate

**Rule:** Any single dimension score < 20 → `isVetoed = true` → `globalVrlScore = 0`.

MRL is one of 9 dimensions. An `mrlScore` of 0–19 out of 100 triggers a full VRL
collapse to zero. This overrides all other dimension scores, regardless of their values.

**Threshold mapping for mrlScore veto:**

| mrlScore range | Engine B Level | VRL outcome |
|---|---|---|
| 0–19 | L1 (0–11) or low L2 | **VETOED** — globalVrlScore = 0, bandLabel = "Vetoed — Pre-Readiness" |
| 20–100 | L2–L9 | Not vetoed by MRL alone |

**Gate-lock interaction (Engine B only):** The gate lock caps `mrl_score` at 44.0
(MRL-4). A gate-locked session has `mrl_score` in range 0–44.0. If `mrl_score < 20`,
the downstream VRL veto triggers. Gate lock does not itself cause a veto but creates
conditions where a venture that would naturally score MRL-5+ appears at MRL-4 and
below, potentially crossing the veto threshold.

**Scenario:** A venture whose raw Engine B score is 52.0 (MRL-5 / Pilot Proven)
with one critical indicator at 1.9 (floor 2.0):
- Gate lock applies → effective score capped at 44.0 → mrl_level = 4
- If mrl_score_normalised × vrl feed is then passed to vrl.engine.ts with value 44,
  that clears the veto threshold (44 ≥ 20), so VRL is NOT vetoed
- **However**, if any other dimension also scores < 20 independently, the veto fires

**Engine C (sync.engine.ts) has no veto gate.** It applies a graded penalty:
```
η = max(0, min(1, 1 − (Ψ / 8)))
δ_VRL = (1 − η) × 0.30
Adjusted_VRL = Base_VRL × (1 − δ_VRL)
```
Maximum penalty (δ_VRL = 0.30) occurs when Ψ ≥ 8 (maximum misalignment).
At `Base_VRL = 72`, maximum penalty → `Adjusted_VRL = 72 × 0.70 = 50.4`.
The sync engine penalty is **bounded** (never zeros VRL); the vrl.engine.ts
veto is **unbounded** (can collapse VRL to zero). They are qualitatively different
gate models operating in parallel on divergent data.

### 6.2 Stage-Gate / VRL Band Effects

VRL band boundaries (from `vrl.engine.ts`):

| Band | Level | Score range | Stage gate relevance |
|---|---|---|---|
| Pre-Readiness | VRL-0 | 0–19 | Vetoed or very early |
| Emerging | VRL-1 | 20–39 | Below investment threshold |
| Developing | VRL-2 | 40–54 | Active development gate |
| Established | VRL-3 | 55–69 | Investment pack trigger |
| Advanced | VRL-4 | 70–84 | Scale-up gate |
| Exemplary | VRL-5 | 85–100 | Exit readiness |

The `InvestmentPack.tsx` page references `VRL ≥ Stage 3` as an investment
readiness gate. An MRL divergence that shifts the venture's effective mrlScore
by ≥ 5–10 points could move a venture's `globalVrlScore` across a band boundary
(e.g. 54→55 crosses Developing→Established), triggering or blocking investment
pack generation.

**Sensitivity at band boundaries for mrlScore changes:**

Using vrl.engine.ts formula with hypothetical mid-range inputs
(trl=60, brl=50, frl=55, other dims=50):
- Product = 60×0.40 + mrl×0.35 + 50×0.25 = 36.5 + 0.35×mrl
- Execution = 55×0.60 + mrl×0.40 = 33 + 0.40×mrl
- globalVrlScore ≈ mean(Product, Market, Execution, Structural, Sustainability)

Holding all other inputs constant, a 10-point shift in mrlScore moves
`globalVrlScore` by approximately 3–4 points. Near the VRL-2/3 boundary (54/55),
a mrlScore divergence of 10+ between Engine A and Engine B could determine
whether a venture is classified as investment-ready or not.

---

## 7. External-Artifact Disclosure Register

### 7.1 PDF Portfolio Export

**File:** `client/src/lib/exportPdf.ts`
**Function:** `exportPortfolioPdf(ventures: Venture[])`
**MRL/VRL data source:** `v.vrl` and `v.trl` from the `Venture` type imported
from `client/src/lib/data.ts`.

```typescript
// exportPdf.ts line ~18–22
const avgVrl = ventures.length
  ? (ventures.reduce((a, v) => a + v.vrl, 0) / ventures.length).toFixed(1)
  : "—";
const avgTrl = ventures.length
  ? (ventures.reduce((a, v) => a + v.trl, 0) / ventures.length).toFixed(1)
  : "—";
```

**⚠ CRITICAL FINDING:** The PDF export does **not** use Engine A, Engine B, or
`vrl.engine.ts`. It reads from the static `Venture` type in `lib/data.ts`.
This means exported LP-pack PDFs contain hardcoded/mock VRL and TRL scores,
not live computed readiness assessments. Any divergence between scoring engines
is irrelevant to this export — it is separately wrong by design (static data).

**Disposition:** This is an independent data integrity issue distinct from the
engine divergence problem. The PDF is effectively sourced from a static mock
data layer, not the live scoring engines.

### 7.2 SRL Report Generation (PDF)

**File:** `server/srl.router.ts` — `srl.generateReport` procedure
**Format:** PDF (`reportFormat: "PDF"`)
**MRL relevance:** SRL reporting does not directly include MRL scores; no
cross-reference to mrl_assessments or scoring_sessions found in SRL router.

### 7.3 UniApproval Report

**File:** `server/uniApprovalReport.router.ts`
**MRL relevance:** No direct MRL score inclusion found.

### 7.4 InvestmentPack Page

**File:** `client/src/pages/InvestmentPack.tsx`
**VRL gate:** Uses `VRL ≥ Stage 3` gate label from static data.
**MRL/TRL display:** References `v.trl` and `v.vrl` from the same static
`Venture` type as `exportPdf.ts`. Not sourced from live scoring engines.

### 7.5 API Endpoints Exposing MRL Data

| Endpoint | Engine | Exposure |
|---|---|---|
| `trpc.mrl.createAssessment` | Engine A | Returns `mrlLevel`, `vrlContribution` |
| `trpc.mrl.getAssessments` | Engine A | Returns all assessments per venture |
| `trpc.mrl.simulateFromTrl` | Engine A | Returns simulated MRL + `vrlContribution` |
| `trpc.mrlScoring.computeAdHoc` | Engine B | Returns full `ScoringResult` incl. `vrl_feed` |
| `trpc.mrlScoring.computeAndSave` | Engine B | Persists + returns session |
| `trpc.mrlScoring.getPortfolioStats` | Engine B | Aggregate stats from `scoring_sessions` |
| `trpc.sync.compute` | Engine C | Returns `adjustedVRL` using 0.30 penalty weight |
| `trpc.crl.*` | Engine D | Includes `mrlNormalized`, `prlNormalized` in response |

---

## 8. Findings Summary

| Finding | Severity | Impact |
|---|---|---|
| Three active MRL scoring engines with no canonical declaration | HIGH | Any venture assessed through different UI paths gets different MRL levels |
| Engine A file header comment still says "0.30 weight" (stale) | MEDIUM | Developer confusion; INTEGRATION_MODEL `mrl: 0.30` is importable |
| Schema comment `mrl_assessments.vrlContribution` says "0.30" (stale) | MEDIUM | Documentation divergence; field behaviour post-D6 is correct |
| Engine C (`sync.engine.ts`) still uses `VRL_WEIGHT_MRL = 0.30` | HIGH | Architecturally incompatible with dual-pathway vrl.engine.ts; produces a third VRL figure |
| No orchestration layer reconciles Engine A/B/C/D outputs | HIGH | No single "current MRL level" for a venture; each tRPC route returns a different answer |
| Portfolio PDF export sources VRL/TRL from static mock data | CRITICAL | LP-pack PDFs do not reflect any live scoring engine output |
| Gate lock in Engine B can expose ventures to veto risk in vrl.engine.ts | MEDIUM | Gate-locked ventures at true MRL 5+ appear as MRL 4; low scorers near veto threshold |
| Score boundary divergence of 0.11–0.89 points between engines | LOW-MEDIUM | Near-boundary ventures (score ≈ 11.0) could be L1 vs L2 depending on engine |
| CRL router PRL formula uses `mrlLevel / 9` (not score/100) | LOW | Different normalisation from Engine B's score/100; max ≈2% VRL point difference |

---

*Report generated by read-only diagnostic pass (Stage 1 — B-02).
No code, database, or configuration changes were made during this analysis.*
*Next stage recommendation: B-02 Stage 2 — Reconciliation and canonical engine designation.*
