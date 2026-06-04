---
name: Venture access / auth model
description: How write authorization for venture-scoped data works in this app, and why.
---

# Venture write authorization

Reads of venture data are public. Venture-scoped writes (create/update/delete of
evidence, risks, etc.) require an authenticated user who is authorised for the
target venture via `assertVentureAccess(db, user, ventureId)` (exported from
`server/discoveryMarket.router.ts`).

Rule order: venture must exist (NOT_FOUND) → admins bypass → `venture_members`
row allowed → **unclaimed venture (zero members) is claimed by the first
authenticated editor** (auto-insert membership) → else FORBIDDEN. Writes are also
scoped by a combined `id + ventureId` predicate to prevent cross-venture IDOR.

**Why:** This codebase originally had **no ownership model at all** — `ventures`
has only a descriptive `founder` string, and even "protected" routers
(e.g. investorDataRoom) checked authentication but not venture membership. A
strict members-only rule would lock everyone out of legacy ventures (created
before access control, and the venture-create endpoint is still public). The
first-touch-claim keeps the app usable while still scoping access per user.

**How to apply:** Reuse `assertVentureAccess` as the single seam when extending
this to other routers. `venture_members` (ventureId, userId, role,
unique(ventureId,userId)) is the authorization table. There is still no UI to
manage members; admins (`user.role === "admin"`) are the escape hatch.
