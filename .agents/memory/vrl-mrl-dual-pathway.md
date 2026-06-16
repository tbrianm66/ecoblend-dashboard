---
name: VRL MRL dual-pathway
description: MRL feeds the VRL composite via two meta-domains; computeVrlContribution scale fix; vrl_feed field names after B-02.
---

## Rule
MRL enters the VRL composite (vrl.engine.ts) via **two** pathways — both intentional by design:
- **Product** meta-domain: `mrlScore × 0.35`
- **Execution** meta-domain: `mrlScore × 0.40`

Never collapse to a single weight or remove MRL from either meta-domain.

**Why:** User confirmed during WGM-002 that the dual pathway is correct spec. The old single-weight of 0.30 in `mrl.engine.ts` was a legacy artefact from an earlier design.

## How to apply
- `computeVrlContribution(level)` in `mrl.engine.ts` now returns **0–1 normalised** (was 0–30 — that was D6). It converts level(1–9) → mrlScore(0–100) → normalised(0–1).
- `mrlScoring.ts` `vrl_feed` exposes `mrl_weight_product: 0.35` and `mrl_weight_execution: 0.40`. The old `mrl_weight_in_vrl: 0.30` and `vrl_mrl_contribution` fields are gone.
- Any test or UI that referenced `vrl_mrl_contribution` or `mrl_weight_in_vrl` must be updated to the new field names.

## Evidence-link enforcement (B-03 / D7)
- `VrlInputs.evidenceLinks?: Partial<Record<VrlDimensionKey, string>>` — optional map of dimension → evidence record ID.
- `VrlResult.selfAssessedDimensions: string[]` + `hasUnverifiedInputs: boolean` — set by `computeVrl()`.
- Absent or empty-string link → dimension flagged self-assessed. **Not a hard rejection** — score still computes.
