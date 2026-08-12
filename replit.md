# EcoBlend Venture OS

## Project overview

A full-stack web application that serves as the operating system for the EcoBlend startup ecosystem — managing ventures, scoring readiness levels (VRL/MRL/CRL/TRL/BRL/PRL/MVL), tracking Gate 4 module reactivations, governance, compliance, equity, and a live event stream (SSE).

**Stack:** TypeScript · tRPC · React · Vite · Drizzle ORM · PostgreSQL (node-postgres) · TailwindCSS · Vitest · Sonner toasts

**Architecture:**
- `server/` — Express + tRPC routers; `server/_core/` — auth, tRPC context, SSE mount
- `client/src/` — React SPA; pages in `client/src/pages/`, shared components in `client/src/components/`
- `shared/` — Zod schemas shared across client and server
- `db/` — Drizzle schema + migrations

**Auth:** JWT session via `SESSION_SECRET`; dev-mode bypass auto-auths when `OAUTH_SERVER_URL` is unset. OAuth server at `https://www.ecoblend.io` in production.

**Readiness scoring dimensions:** VRL is composite of TRL, BRL, CRL, MRL (product + execution), MVL. Two scales: playbook level (1–4) vs score (0–9). Hypothesis Register drives the 0–9 score, never the 1–4 level.

**Gate 4:** Extended Backlog of 15 groups with optimistic locking (`lastKnownMaxToggledAt`) to prevent concurrent-admin state divergence. Batch reactivation uses ON CONFLICT DO UPDATE so inserts and updates are idempotent and share a single `now` timestamp per batch.

**SSE:** Authenticated-only (`/api/events` returns 401 for unauthenticated connections). Members receive only their venture's events; admins receive all. Per-user connection cap = 5.

## User preferences

- Keep `publicProcedure.query` routes public for read-only access; only mutations need protection.
- `logout` mutation is intentionally `publicProcedure` (users must be able to log out with an expired session).
- Test files: 7 pre-existing failing test files — do NOT touch them (OOM / pre-existing failures).
- All audit log writes go **outside** the batch DB transaction, wrapped in try/catch — audit failure must never roll back a committed batch.
- Pre-existing test baseline: 3190 passing, 55 failing (pre-existing), 98 passed files.
- Never add `console.log` to production code paths without a NODE_ENV guard.
- `replit.md` is the authoritative project README and preferences file.
