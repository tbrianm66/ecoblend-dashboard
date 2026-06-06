# Threat Model

## Project Overview

Ecoblend Dashboard is a full-stack TypeScript venture-management platform with a React/Vite frontend and an Express + tRPC backend backed by Drizzle-managed relational storage. It tracks venture, founder, interview, financial, governance, AI-pipeline, and operational data, and it also integrates with OAuth-based sign-in, storage services, and LLM-backed workflows. The production deployment is public, so any server route exposed without authentication or per-venture authorization is internet reachable.

## Assets

- **User accounts and sessions** — session cookies and authenticated user identities control access to venture operations and admin features.
- **Venture and portfolio data** — venture records, milestones, risks, interviews, financials, research, contracts, investor information, and internal operating decisions are business-sensitive.
- **Personal data** — founder, investor, partner, and contact records include names, emails, LinkedIn URLs, transcripts, and uploaded document metadata.
- **AI and knowledge assets** — prompt templates, system prompts, sample datasets, RAG documents, pipeline run inputs/outputs, and generated analyses can contain proprietary logic and sensitive source material.
- **Application secrets and service credentials** — database URL, JWT signing secret, storage proxy credentials, OAuth service configuration, and LLM API credentials enable privileged backend operations.

## Trust Boundaries

- **Browser to API** — all client traffic crosses into `/api/trpc`, `/api/oauth/callback`, and `/api/events`; the browser is untrusted and frontend login screens do not provide security by themselves.
- **API to database** — the backend can read and mutate the full application dataset; broken access control or injection here exposes the entire portfolio.
- **API to external services** — the backend calls OAuth, storage, and LLM services using server-held credentials, so untrusted input reaching those integrations can leak data or misuse privileged capabilities.
- **Unauthenticated to authenticated/admin** — some routes are intended to be public, but most venture-management and AI-management features should require a valid session, and admin actions must remain role-gated.
- **Cross-venture boundary** — authenticated users should only access ventures they are authorized to manage; venture IDs and record IDs must not be sufficient to read or modify another venture’s data.
- **Dev-only to production** — test files, seed scripts, and local-only tooling are out of scope unless they are mounted or reachable through production entry points.

## Scan Anchors

- Production server entry: `server/_core/index.ts`
- Highest-risk API surfaces: `server/routers.ts`, `server/dataManagement.router.ts`, `server/workflowEngine.router.ts`
- Auth/session code: `server/_core/context.ts`, `server/_core/trpc.ts`, `server/_core/oauth.ts`, `server/_core/sdk.ts`, `server/_core/cookies.ts`
- Realtime/public endpoint: `server/sse.ts` mounted at `/api/events`
- Raw-SQL hotspot: `server/contextual.router.ts`, `server/context-engine.ts`
- Known scoped access-control seam: `server/discoveryMarket.router.ts` (`assertVentureAccess` + `ventureProcedure`)
- Usually dev-only: `server/*.test.ts`, `scripts/`, root seed scripts, `attached_assets/`, `.manus-logs/`

## Threat Categories

### Spoofing

Users authenticate through an OAuth-backed session cookie. The application must reject unauthenticated requests to non-public business functions and must validate session tokens on every protected request. Any endpoint that relies on the UI showing a login screen instead of enforcing auth server-side is vulnerable to spoofed access from direct API calls.

### Tampering

This system exposes extensive CRUD operations over venture, financial, governance, and AI-management data. Server-side mutations must require an authenticated, authorized caller and must scope updates/deletes to the correct venture or record owner. Public write procedures would let an attacker alter portfolio data, poison AI pipelines, or delete records.

### Information Disclosure

The app stores business-sensitive portfolio data, transcripts, emails, investor details, prompts, sample datasets, and pipeline run payloads. API responses, event streams, and generated download URLs must be limited to authorized users and ventures. Public read procedures or broadcast channels could leak the entire portfolio to internet users.

### Denial of Service

Publicly reachable routes include JSON bodies up to 50 MB, SSE connections, and LLM-backed actions. The application must ensure unauthenticated users cannot trigger expensive processing or hold open unbounded connections in ways that degrade service availability.

### Elevation of Privilege

The main elevation risk is broken function-level and object-level authorization across the tRPC surface. Venture IDs, numeric record IDs, or hidden UI controls must not grant access to other ventures’ records or to management features reserved for authenticated or admin users. All privileged functionality must be enforced server-side, not by client routing alone.
