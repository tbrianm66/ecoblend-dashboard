---
name: VRL dual-scale on the dashboard
description: Two distinct VRL scales coexist on the Portfolio Overview; which one the Hypothesis Register drives.
---

# VRL has two separate scales — do not conflate them

On the EcoBlend Portfolio Overview (`client/src/pages/Home.tsx`) a venture card shows VRL in two unrelated metrics:

1. **1–4 playbook level** — `venture.vrl` indexes `VRL_STAGES` in `client/src/lib/data.ts` (Fundamentals → Kickoff → Go-to-Market → Scaling). Playbook-progression driven.
2. **0–9 VRL score** — the "AVG VRL SCORE" widget and each card's "Score: X/9" badge. This is what tRPC `vrlScoring.portfolioScores` computes (often empty in dev → "--").

**Decision:** the Lean Startup Hypothesis Register (`/intake/hypotheses`) drives the **0–9 score**, NOT the 1–4 level. Rule values (1.0 / 2.0 / 4.0 / 6.0) are 0–9-scale points. The engine lives in `client/src/stores/hypothesisStore.ts` (`computeVentureVrl` / `selectVrlByVenture`).

**Why:** the requirement's numbers and the "AVG VRL SCORE" widget are both on the 0–9 scale; forcing a 6.0 into the 1–4 `VRL_STAGES` index is a category error.

**How to apply:** when a venture has hypotheses, the card's *primary* "VRL N — label" + progress bar should also switch to the engine's 0–9 value (bar width = score/9) so the whole card moves together; ventures without hypotheses keep the 1–4 playbook display + server score. Reactivity is via a shared Zustand store both the register page and Home subscribe to.
