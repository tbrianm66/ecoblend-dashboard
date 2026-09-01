---
name: Migration baseline
description: Safe migration posture for the non-linear repository journal and incomplete development ledger.
---

Treat the verified development schema as the migration baseline. Preserve the existing migration
ledger exactly; do not rewrite it to claim historical migrations ran, and do not replay numbered
historical migrations to reconcile repository metadata.

**Why:** The repository journal is non-linear and incomplete, duplicate migration numbers exist,
and the development ledger includes a hash with no matching current SQL file. The normal migration
command can select unrelated historical DDL even though the intended schema already exists.

**How to apply:** Before future schema work, diff the intended schema against the verified
development schema and review one new additive migration containing only that change. Keep
production untouched until the normal publish review is explicitly approved.