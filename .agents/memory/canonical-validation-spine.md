---
name: Canonical validation spine
description: Durable Stage 1 model and boundaries for future validation-engine work.
---

Use the existing Command Centre hypothesis, evidence, experiment and decision records as the
canonical validation chain, owned by one additive versioned validation lifecycle per venture.
Evidence must continue to use the existing evidence record rather than introducing another model,
and system recommendations must remain separate from human decisions.

**Why:** The application already had several overlapping validation capabilities. Reusing the
closest connected record family preserves historical compatibility and avoids another parallel
workflow while making the human decision boundary explicit.

**How to apply:** New validation work must be venture-authorized, link through the lifecycle,
preserve audit provenance and leave legacy venture workflow/scoring state unchanged. Keep
`EXECUTION_READY` reserved until a later human-controlled transition and handover contract is
explicitly approved; never infer or automate progression from evidence or scores.

Portfolio-wide validation and decision aggregates require administrator authorization. Legacy
single-venture reads must authenticate and authorize the requested venture with first-touch
claiming disabled.

**Why:** A portfolio aggregate exposes multiple ventures and cannot safely inherit a
single-venture membership rule; legacy public probes made validation state enumerable.

**How to apply:** Keep portfolio reads admin-only. For a venture-ID input, authorize that venture
before querying any validation, decision, archive, lifecycle, or progression-readiness data.