---
name: Gate 2 — MVL + Profile SV-01
description: Key invariants from FHV-EB-AUD-001 v1.0 Gate 2 implementation (10th VRL dimension + SV-01 governed N/A for MRL)
---

## Gate 2 formula invariants

**Market meta-domain (Gate 2):** `BRL×0.25 + PRL×0.25 + MVL×0.50`
- Prior formula was BRL×0.5 + PRL×0.5 (9 dimensions). Any test or display that shows the old formula is stale.

**Base average (Gate 2):** weighted sum — `product×0.175 + market×0.30 + execution×0.175 + structural×0.175 + sustainability×0.175`
- Prior formula was simple mean (each ×0.20). Market gets 0.30 because MVL canonical weight = 0.15 = market(0.30) × MVL-in-market(0.50).

**MVL canonical composite = exactly 15%** (verified by unit tests).

## Profile SV-01 — software/social/service ventures

When `profile = "SV-01_SOCIAL_SOFTWARE"` and `mrlIsUnscored = true`:
- **Product:** `TRL×(0.40/0.65) + BRL×(0.25/0.65)` — MRL excluded, weights renormalised to sum to 1.
- **Execution:** `FRL×1.00` — MRL excluded entirely.
- **Veto gate:** MRL is skipped; only the remaining 9 dimensions (TRL, BRL, ECO, PRL, IP, FRL, REG, SRL, MVL) can trigger the veto.
- **mrlIsGoverned flag:** propagated on VrlResult and stored as `mrl_is_unscored` in DB.

**Why:** Physical MRL is inapplicable for software/social/service ventures. SV-01 provides a governed N/A path that avoids hard-vetoing an otherwise healthy venture.

**How to apply:** Whenever adding a new test scenario that involves computeVrl/computeMetaDomains, always include `mvlScore`. All WGM test helpers (makeInputs, makeVrlInputs) include `mvlScore: base` as a default — preserve this pattern for new helpers.

## Sync points — files that share dimension count

`TOTAL_DIMS` and `ALL_DIM_KEYS` exist independently in two places. Both must be 10 after Gate 2:
- `server/vrl.router.ts` — `ALL_DIM_KEYS` (10 entries)
- `server/vrl.d7.helpers.ts` — `TOTAL_DIMS = 10` + `ALL_DIM_KEYS` (10 entries)

If a future gate adds a new dimension, update BOTH files and all test count assertions (selfAssessedDimensions lengths, etc.).

## DB schema (Gate 2 additions)

Migration `0010_gate2_mvl_profile_sv01.sql` adds to `vrl_assessments`:
- `mvl_score INTEGER NOT NULL DEFAULT 50`
- `scoring_profile VARCHAR(32) NOT NULL DEFAULT 'STANDARD'`
- `mrl_is_unscored BOOLEAN NOT NULL DEFAULT FALSE`

And to `ventures`:
- `scoring_profile VARCHAR(32) NOT NULL DEFAULT 'STANDARD'`

Pre-Gate-2 rows default to `mvlScore = 50` (neutral; formatAssessment uses `?? 50` for backward compat).
