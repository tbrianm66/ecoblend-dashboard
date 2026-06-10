# BEBUS-VRL-WGM-001 — D3 Defect Audit Report

**Audit basis:** Phase 0 static analysis + live engine test suite (`vrl.wgm.phase1–4.test.ts`, 121 tests, all passing)
**Engines audited:** `server/vrl.engine.ts`, `server/mrlScoring.ts`, `server/mrl.engine.ts`, `server/sync.engine.ts`
**Date:** 10 June 2026

---

## D3 — Scale & Table Mismatch Audit

### (a) VRL Composite Scale

The live engine (`vrl.engine.ts`, BEBUS-VRL-UPDATE-001) computes on a **0–100 scale**.
All 9 input dimensions (`trlScore`, `mrlScore`, `brlScore`, `ecoScore`, `prlScore`, `ipScore`, `frlScore`, `regScore`, `srlScore`) are 0–100. The composite is the mean of 5 meta-domain scores, also 0–100.

The WGM spec prompt implies a **0–10 scale** via per-dimension floor values (e.g. ENV ≥ 2.0, SMF ≥ 3.0). **This formula is NOT implemented in the codebase.**

A separate legacy formula in `db.ts` uses a **0–9 scale** (`VRL = (α·TRL + β·BRL) × (1−Risk) × Confidence`). That is tested in `vrl.scoring.test.ts` and is **not** the WGM model.

### (b) Stage Threshold Discrepancies

| Stage | Live engine | WGM spec prompt | Verdict |
|---|---|---|---|
| VRL-2 Developing | ≥ 40 | ≥ 40 | ✅ matches |
| VRL-3 Established | ≥ **55** | ≥ **60** | ❌ **5-point gap** |
| VRL-4 Advanced | ≥ 70 | ≥ 70 | ✅ matches |
| VRL-5 Exemplary | ≥ 85 | ≥ 85 | ✅ matches |

### (c) Dimension Name / Formula Disagreements

| Prompt dimension | Live engine equivalent | Status |
|---|---|---|
| ENV | `ecoScore` (ECO) | Approximate match |
| MRL | `mrlScore` | ✅ Present |
| SMF (Surface/Manufacturing Fitness?) | **No counterpart** | ❌ Missing |
| SOC | `prlScore` (PRL/People — proxy only) | ⚠️ Proxy, not same |
| ESG | Split across ECO + SRL | ⚠️ Decomposed |
| IP | `ipScore` | ✅ Present |
| CRL | No counterpart | ❌ Missing |
| BRL | `brlScore` | ✅ Present |
| FIN | `frlScore` (FRL — financial readiness) | ⚠️ Approximate |
| TRL | `trlScore` | ⚠️ **Present in live engine, absent from prompt WGM formula** (see D1) |

**Prompt formula:** single 9-weight column vector across ENV/MRL/SMF/SOC/ESG/IP/CRL/BRL/FIN.
**Live formula:** no single weight vector — 5 meta-domain intermediates each with their own constituent weights.

### (d) Missing Database Tables

The following tables are referenced in the WGM spec but **do not exist in the Drizzle schema**:

- `vrl_wgm_scores`
- `vrl_dimension_scores`
- `vrl_gate_history`
- `trl_mrl_sync_log`
- `sync_alerts`

---

## D1 — TRL Direct Path into VRL Composite

**Severity: Spec Violation**

The WGM spec formula **excludes TRL** from the VRL composite. The live engine includes `trlScore` directly in the Product meta-domain with a weight of 0.40:

```
productScore = trlScore×0.40 + mrlScore×0.35 + brlScore×0.25
```

**Proven behaviour (T8):** Advancing `trlScore` from 40 → 70 with `mrlScore` held constant at 40 increases `globalVrlScore`. Per spec, the composite should be unchanged.

```
before: trlScore=40, mrlScore=40 → productScore changes ↑
after:  trlScore=70, mrlScore=40 → globalVrlScore > before.globalVrlScore  ✗
```

---

## D6 — Dual MRL → VRL Contribution Functions (100× Scale Mismatch)

**Severity: Integration Bug**

Two separate functions compute the MRL contribution to VRL and they are **incompatible by a factor of 100**:

| Source | Function | Output scale | Value at level 5 |
|---|---|---|---|
| `mrl.engine.ts` | `computeVrlContribution(level)` | 0–30 | **15.0** |
| `mrlScoring.ts` | `vrl_feed.vrl_mrl_contribution` | 0–0.30 | **~0.15** |

Formula details:

- `mrl.engine.ts`: `normalised = (level−1)/8 × 100` → returns `normalised × 0.30`
- `mrlScoring.ts`: `mrl_score / 100 × 0.30`

At level 5: `computeVrlContribution(5) = 15.0` vs `vrl_feed ≈ 0.15` — the ratio is **~100×**.
No single canonical mapping from MRL level → VRL dimension score exists.

---

## D7 — Evidence-Link Enforcement Absent

**Severity: Missing Control**

The WGM spec requires that a SOC/dimension score submitted without a linked evidence record is either **rejected** or **flagged as self-assessed**.

`vrl.engine.ts` has no evidence-link enforcement mechanism. Any value for any of the 9 dimensions is accepted silently without an evidence record:

```typescript
// prlScore = 95 (SOC proxy), no evidence linked → accepted, no flag
computeVrl({ ...allAt60, prlScore: 95 })  // returns valid result, isVetoed: false
```

All nine dimensions accept zero-evidence self-assessed values.

---

## D_SYNC — Sync Engine Severity Label Mismatches

**Severity: Interface Mismatch**

The live `sync.engine.ts` severity labels do not match the state names in the BEBUS-SYNC-SE-001 prompt spec:

| Condition | Live label | Prompt label | Verdict |
|---|---|---|---|
| TRL=5, MRL=5 (delta=0) | `"OK"` | `"OPTIMAL"` | ❌ String mismatch |
| TRL=5, MRL=3 (delta=+2) | `"AMBER"` | `"MONITOR"` | ❌ Severity over-escalation |
| TRL=7, MRL=4 (delta=+3) | `"RED"` | `"WARNING"` | ❌ Severity over-escalation (Δ≥3 always RED) |
| TRL=7, MRL=2 (delta=+5) | `"RED"` | `"CRITICAL"` | ✅ Acceptable (both are worst state) |
| TRL=3, MRL=5 (delta=−2) | `"AMBER"` | `"BLOCKED"` | ❌ AMBER ≠ hard stop; no gate-block behaviour |

---

## D_SW — Software Ventures Permanently Gate-Blocked

**Severity: Product Gap**

A software-only venture (no physical manufacturing) cannot progress past MRL level 4/5. All manufacturing-related critical indicators (`p1`, `p2`, `p4`, `s1`, `s4`, `c1`, `c3`, `c5`, `q1`, `q2`, `q5`) have minimum floor requirements. Setting them to 0 (not applicable) triggers gate lock.

**Proven behaviour (T14):**

- `gate_locked = true` when all manufacturing indicators = 0
- `mrl_score` capped at 44.0 permanently
- Raising `sustainability` to a perfect score of 10.0 does **not** unlock the gate
- `gate_reason` names a manufacturing indicator, not a software indicator

**No N/A path exists.** There is no mechanism to mark indicators as "not applicable" and exempt a venture from the manufacturing gate.

---

## D_CAP — GATE_LOCK_CAP Boundary Off-By-One

**Severity: Minor / Documentation Bug**

```typescript
const GATE_LOCK_CAP = 44.0; // top of MRL 4 band   ← misleading comment
```

The comment says "top of MRL 4 band" but `getMRLLevel` uses an **exclusive upper bound**:

```
Level 4: min=33, max=44 → score=44: 44 < 44 = false → NOT level 4
Level 5: min=44, max=55 → score=44: 44 ≥ 44 = true  → level 5
```

A gate-locked venture with a raw score well above 44 will be capped at exactly 44.0 and display **MRL level 5**, not level 4 as the comment intends. The cap value would need to be 43.99 (or the threshold table boundary made inclusive) to honour the "top of MRL 4" intent.

---

## Not-Defect Confirmations

| ID | Verdict | Evidence |
|---|---|---|
| **D4** | ✅ **Not a defect** | `baseAverage` is stored and retrievable even when the veto gate blocks `globalVrlScore` to 0. Pre-gate average is always a positive, non-zero value. |
| **D5** | ✅ **Not triggered** | Cost evidence isolation is clean — cost sub-indicators (`c1–c6`) affect only the `cost` category contribution; no cross-contamination into other categories. |

---

## Summary Table

| ID | Description | Severity |
|---|---|---|
| D3 | 0–100 live vs 0–10 prompt scale; Stage 3 threshold 55 vs 60; missing SMF/CRL dimensions; 5 missing DB tables | Scale / Spec Mismatch |
| D1 | TRL has direct 0.40 weight in VRL Product meta-domain — spec excludes TRL from composite | Spec Violation |
| D6 | `computeVrlContribution` and `vrl_mrl_contribution` differ by 100× — no canonical MRL→VRL mapping | Integration Bug |
| D7 | No evidence-link enforcement — any dimension score accepted without linked evidence record | Missing Control |
| D_SYNC | Sync severity labels `OK`/`AMBER`/`RED` do not match spec `OPTIMAL`/`MONITOR`/`WARNING`/`BLOCKED` | Interface Mismatch |
| D_SW | Software ventures permanently gate-locked at MRL ≤ 5 with no N/A path for manufacturing indicators | Product Gap |
| D_CAP | `GATE_LOCK_CAP=44.0` resolves to MRL level 5 (not 4) due to exclusive upper-bound threshold table | Minor / Doc Bug |
| D4 | baseAverage retrievable under veto gate | ✅ Not a defect |
| D5 | Cost category isolation is clean | ✅ Not a defect |
