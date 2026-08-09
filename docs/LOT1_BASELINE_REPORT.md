# ECOBLEND OS — Technical Discovery & Baseline Report
**Date:** 2026-08-09 | **Basis:** Runtime observation only (no documentation assumed authoritative)

---

## 1. Sources of Truth (T-03)

### 1.1 Active Repositories

| Remote | URL | Branch model |
|---|---|---|
| **origin** (primary) | `https://github.com/tbrianm66/ecoblend-dashboard` | `main` is the deployed branch |
| **gitsafe-backup** | `git://gitsafe:5418/backup.git` | Replit-internal checkpoint mirror |
| **subrepl-*** (×8) | `git+ssh://git@ssh.worf.replit.dev:/home/runner/workspace` | Replit agent task environment remotes; all point to same workspace |

**Local branches present beyond `main`:**

| Branch | Status |
|---|---|
| `remediation/b02-d6-diagnostic` | Local + pushed to origin |
| `remediation/b03-d7-evidence-enforcement` | Local + pushed to origin |
| `remediation/d6-remediation-implementation` | Local + pushed to origin |
| `v2` | Local + pushed to origin |
| `replit-agent` | Local only |
| `subrepl-*` (×8) | Local only; remnants of previous agent task environments |

> **Observation:** Eight `subrepl-*` branches exist locally from prior agent task environments. They point to the same workspace, carry no divergent code, and may be safely pruned.

### 1.2 Environment Configurations

| Source | Mechanism | Contents |
|---|---|---|
| `.replit [userenv.shared]` | Committed to repo — applies to all environments | `PORT=5000`, `APP_URL=www.ecoblend.io`, `OAUTH_SERVER_URL=https://www.ecoblend.io` |
| Replit Secrets (platform-managed) | Injected at runtime; not in repo | `SESSION_SECRET` (confirmed present) |
| Replit Managed DB env | Injected at runtime | `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` |
| Replit Platform env | Injected at runtime | `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `REPLIT_DB_URL`, `REPL_IDENTITY`, `REPL_IDENTITY_KEY`, `REPL_PUBKEYS` |
| Potentially unset | Referenced in `env.ts` but absent from observed env | `VITE_APP_ID`, `OWNER_OPEN_ID`, `JWT_SECRET` — code defaults these to `""` via `?? ""` |

### 1.3 Active Datastores

| Store | Technology | Write pattern |
|---|---|---|
| **Primary database** | PostgreSQL 16 via Replit Managed Postgres (Neon serverless in production) | Actively written by all tRPC mutation routes via Drizzle ORM (`pg` driver) |
| **Replit KV store** | `REPLIT_DB_URL` present in env | No import of `@replit/database` found in `package.json` or source; **not actively used by application code** |
| **File / object storage** | `@aws-sdk/client-s3` present in `package.json`; `server/storage.ts` proxies uploads through a URL built from `BUILT_IN_FORGE_API_URL` | Writes to Replit-managed storage proxy; no direct AWS credential usage observed |
| **In-memory** | SSE client registry (`Map<string, SSEClient>`) in `server/sse.ts` | Written on connect/disconnect; not persisted; reset on process restart |

**Schema source of truth:** `drizzle/schema.ts` (single file; ~300+ tables defined). Migrations tracked in `drizzle/` directory (0000–0017). `drizzle-kit push --force` is executed by `scripts/post-merge.sh` on every Replit agent task merge.

---

## 2. Secret Custody Scan (T-04)

> **Priority: Review Required — two items flagged; no exposed plaintext secrets found**

### 2.1 Hardcoded Credential Scan — Result: CLEAN

No plaintext API keys, tokens, passwords, or connection strings were found embedded in source files, configuration files, or git history.

**False positives investigated and cleared:**

| File | Pattern matched | Actual content | Verdict |
|---|---|---|---|
| `drizzle/schema.ts` | `sk_live` | Column default value `"sk_live"` in schema definition — a string template, not a key | ✅ Not a secret |
| `server/admin.router.ts` | `sk_live` | Display mask string `sk_live_••••••••••••{suffix}` for redacted token display in UI | ✅ Not a secret |
| `client/public/__manus__/debug-collector.js` | `password`, `token`, `key`, `secret` | These are field names in the collector's **masking allowlist** — it actively suppresses these values from telemetry | ✅ Not a secret |

### 2.2 Environment Variable Credential Surface

All credentials are runtime-injected env vars. None appear in committed code. However:

| Variable | Scope | Concern level |
|---|---|---|
| `PGPASSWORD` | Full plaintext password in shell environment | 🟡 **Medium** — visible to any process in this container; standard for Replit managed DB but worth noting |
| `REPL_IDENTITY_KEY` | Replit cryptographic identity key | 🟡 **Medium** — this is a Replit platform-internal signing credential; should never leave the container |
| `REPL_PUBKEYS` | Replit public key set | 🟢 Low — public keys only |
| `BUILT_IN_FORGE_API_KEY` | LLM / image / voice / maps API credential | 🟡 **Medium** — platform-managed but actively used for external API calls; not user-visible |
| `SESSION_SECRET` | JWT session signing | 🟡 **Medium** — single signing key for all sessions; no rotation mechanism observed in code |

### ⚠️ 2.3 Flagged Item 1: `PGPASSWORD` as process-visible plaintext

`PGPASSWORD` is present in the shell environment (confirmed by `printenv`). Any child process spawned by the application server inherits it. This is a Replit platform injection and cannot be avoided in this environment, but any debug output or error logging that dumps environment variables would expose it.

**Recommendation (not remediated):** Audit all error handlers and logging paths for `process.env` dumps.

### ⚠️ 2.4 Flagged Item 2: `SESSION_SECRET` single-key with no observed rotation

The application uses `SESSION_SECRET` as the sole signing key for all JWTs (`server/_core/sdk.ts` via `jose`). There is no key rotation, key versioning, or secondary key configuration observed in the codebase. Compromise of this single secret invalidates all sessions only after a key rotation is performed.

**Recommendation (not remediated):** Implement a versioned key pair or short-lived JWT `exp` with refresh token pattern.

### 2.5 Git History Scan — CLEAN

Scan of all commits in history for credential value patterns (`sk_live*`, `AKIA*`, `ghp_`, PEM headers, bearer tokens) returned zero matches.

### 2.6 `.env` Files — CLEAN

No `.env` files are present in the working directory. `.gitignore` correctly excludes `.env`, `.env.local`, `.env.*.local`.

---

## 3. Current-State Technical Baseline (T-05)

### 3.1 Host Environment

| Property | Value |
|---|---|
| OS | Ubuntu 24.04.4 LTS (Noble Numbat) |
| Kernel | Linux 6.18.43 #Replit-Linux (x86_64) |
| Container type | Replit microVM (`REPLIT_IN_MICROVM=1`) |
| Runtime user | `runner` |
| Node.js | v20.20.0 (dev runtime) / v24.12.0 (some platform tooling) |
| pnpm | 10.4.1 |
| PostgreSQL client | psql 16.10 |
| Package manager lockfile | `pnpm-lock.yaml` (committed; frozen in CI via post-merge) |

### 3.2 Application Runtime

| Mode | Command | Entry point | Port |
|---|---|---|---|
| Development | `pnpm dev` → `NODE_ENV=development tsx watch server/_core/index.ts` | `server/_core/index.ts` | 5000 |
| Production | `node dist/index.js` | `dist/index.js` (esbuild bundle) | 5000 |
| Build | `vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist` | — | — |

### 3.3 Active Dependencies (Production)

**Runtime dependencies:**

| Package | Version | Purpose |
|---|---|---|
| `react` / `react-dom` | ^19.2.1 | UI framework |
| `express` | ^4.21.2 | HTTP server |
| `@trpc/server` / `@trpc/client` / `@trpc/react-query` | ^11.6.0 | Type-safe API layer |
| `@tanstack/react-query` | ^5.90.2 | Client-side data fetching/caching |
| `drizzle-orm` | ^0.45.2 | ORM / query builder |
| `pg` | ^8.21.0 | PostgreSQL driver (node-postgres) |
| `jose` | 6.1.0 | JWT signing/verification |
| `zod` | ^4.1.12 | Runtime schema validation |
| `zustand` | ^5.0.12 | Client state management |
| `wouter` | ^3.3.5 | Client-side routing (patched) |
| `@aws-sdk/client-s3` + `s3-request-presigner` | ^3.693.0 | S3-compatible storage client |
| `axios` | ^1.17.0 | HTTP client |
| `dotenv` | ^17.2.2 | Env var loading |
| `nanoid` | ^5.1.6 | ID generation |
| `uuid` | ^14.0.0 | UUID generation |
| `pdf-parse` | ^2.4.5 | PDF text extraction |
| `cookie` | ^1.0.2 | Cookie parsing |
| `superjson` | ^1.13.3 | tRPC serialisation |
| `framer-motion` | ^12.23.22 | UI animation |
| `recharts` / `chart.js` / `react-chartjs-2` | various | Data visualisation |
| `date-fns` | ^4.1.0 | Date utilities |
| `lucide-react` | ^0.453.0 | Icon set |
| `next-themes` | ^0.4.6 | Dark/light mode |
| `sonner` | ^2.0.7 | Toast notifications |
| `react-hook-form` + `@hookform/resolvers` | various | Form management |
| All `@radix-ui/react-*` | various | Headless UI primitives (accordion, dialog, select, tabs, etc.) |
| `embla-carousel-react` | ^8.6.0 | Carousel component |
| `react-day-picker` | ^9.11.1 | Date picker |
| `react-resizable-panels` | ^3.0.6 | Resizable layout panels |
| `cmdk` | ^1.1.1 | Command palette |
| `vaul` | ^1.1.2 | Drawer component |
| `input-otp` | ^1.4.2 | OTP input |
| `streamdown` | ^1.4.0 | Markdown streaming renderer |
| `pngjs` | ^7.0.0 | PNG processing |
| `class-variance-authority` + `clsx` + `tailwind-merge` | various | CSS utility composition |
| `tailwindcss-animate` | ^1.0.7 | Animation utilities |

**Dev dependencies:**

| Package | Version | Purpose |
|---|---|---|
| `vite` | ^7.3.5 | Frontend bundler |
| `esbuild` | ^0.28.0 | Server bundler |
| `tsx` | ^4.19.1 | TypeScript execution (dev) |
| `typescript` | 5.9.3 | Type checking |
| `drizzle-kit` | ^0.31.10 | DB schema migration tool |
| `vitest` | ^4.1.8 | Unit test runner |
| `prettier` | ^3.6.2 | Code formatting |
| `tailwindcss` | ^4.1.14 | Utility CSS |
| `@tailwindcss/vite` | ^4.1.3 | Vite integration |
| `@tailwindcss/typography` | ^0.5.15 | Prose typography plugin |
| `@vitejs/plugin-react` | ^5.0.4 | Vite React plugin |
| `autoprefixer` | ^10.4.20 | CSS autoprefixer |
| `postcss` | ^8.5.15 | CSS post-processing |
| `@builder.io/vite-plugin-jsx-loc` | ^0.1.1 | JSX source location plugin |
| `vite-plugin-manus-runtime` | ^0.0.57 | Replit/Manus platform plugin |

### 3.4 Dependency Overrides / Security Patches

The following packages are overridden in `pnpm.overrides` — all are security-motivated version pins:

| Package | Pinned to |
|---|---|
| `tar` | ≥7.5.16 |
| `rollup` | ≥4.61.1 |
| `path-to-regexp` | 0.1.13 |
| `picomatch` | ≥4.0.4 |
| `dompurify` | ≥3.4.8 |
| `fast-xml-parser` | ≥5.8.0 |
| `fast-xml-builder` | ≥1.1.7 |
| `qs` | ≥6.15.2 |
| `follow-redirects` | ≥1.16.0 |
| `uuid` | ≥11.1.1 |
| `esbuild` | ≥0.25.0 |
| `lodash` / `lodash-es` | ≥4.18.1 |
| `postcss` | ≥8.5.15 |
| `vite` | ≥7.3.2 |
| `mermaid` | ≥11.15.0 |
| `mdast-util-to-hast` | ≥13.2.1 |
| `tailwindcss > nanoid` | 3.3.7 |

---

## 4. Programmatic Principal Register (T-06)

| Principal | Type | Credential source | Access scope | Write access to venture data? |
|---|---|---|---|---|
| **Replit OAuth identity service** (`https://www.ecoblend.io`) | External auth authority | `OAUTH_SERVER_URL` (env); user session issued as JWT signed by `SESSION_SECRET` | Issues user identity tokens for all authenticated sessions | No — authenticates; doesn't write |
| **Replit Forge API** | Platform LLM/AI service | `BUILT_IN_FORGE_API_KEY` + `BUILT_IN_FORGE_API_URL` (platform-injected env) | LLM inference, image generation, voice transcription, Google Maps proxy | No direct DB access — returns data to server routes which may then write |
| **Replit Forge Storage proxy** | Platform file storage | Same `BUILT_IN_FORGE_API_URL` credential | Read/write to Replit-managed object storage via `server/storage.ts` | Write to file store; no direct PostgreSQL access |
| **Application API token system** | Application-level developer tokens | `sk_live_*` prefix tokens stored in database; generated via Admin UI (`AdminApiSettings`) | Defined per token — grants programmatic access to tRPC routes that accept token auth | Yes — any route reachable by the token |
| **Replit platform identity** (`REPL_IDENTITY` / `REPL_IDENTITY_KEY`) | Replit container identity | Platform-injected; used for inter-service calls within Replit infrastructure | Internal Replit service mesh | No |
| **`DATABASE_URL` / `PGPASSWORD`** | Direct DB credential | Platform-injected env | Full read/write access to the application PostgreSQL database | Yes — full access |
| **`SESSION_SECRET`** | JWT signing key | Replit Secret (user-managed) | Signs all user session tokens | Indirect — controls session trust |

**No service accounts, IAM roles, external webhook receivers, or third-party SaaS integrations (Stripe, Twilio, SendGrid, etc.) are actively configured.** Fields for such integrations exist in the schema and UI but are not wired to live credentials.

**No scheduled/cron-based principals exist** — see Section 5.

---

## 5. Autonomous Agent & Scheduled Behavior Map (T-08)

### 5.1 Scheduled / Recurring Components

| Component | Location | Trigger type | Interval | Data custody | Notes |
|---|---|---|---|---|---|
| **SSE heartbeat** | `server/sse.ts:135` | `setInterval` | Per-connection (configured at connection time) | In-memory only — sends `"heartbeat"` event to connected SSE clients; no DB reads or writes | Bounded by `MAX_CONNECTIONS=100`, `MAX_CONNECTIONS_PER_USER=5`; reset on process restart |
| **Client SSE reconnect timer** | `client/src/hooks/useLiveEvents.ts:94` | `setTimeout` | 5 000 ms after disconnect | Client-side only; no server state | Reconnects to `/api/sse` on drop |
| **Client WebSocket reconnect** | `client/src/hooks/useDashboardWebSocket.ts:82` | `setTimeout` | Exponential back-off (variable) | Client-side only | Dashboard-specific WS reconnection |
| **Replit/Manus debug collector** | `client/public/__manus__/debug-collector.js:757` | `setInterval(reportLogs, CONFIG.reportInterval)` | Platform-defined interval | Browser DOM events only — masks sensitive fields before reporting; transmits to Replit platform endpoint | **This is Replit platform telemetry, not application code.** Runs in end-user browser only. |

### 5.2 LLM / AI Components

| Component | Location | Invocation pattern | Shared data primitives |
|---|---|---|---|
| **LLM inference wrapper** | `server/_core/llm.ts` | On-demand (called by tRPC route handlers) | Messages array passed by caller; no autonomous data retrieval |
| **Image generation** | `server/_core/imageGeneration.ts` | On-demand | Prompt passed by caller via `BUILT_IN_FORGE_API_KEY` |
| **Voice transcription** | `server/_core/voiceTranscription.ts` | On-demand | Audio blob passed by caller via `BUILT_IN_FORGE_API_KEY` |

All three are **passive responders** — they execute only when a user-authenticated tRPC call triggers them. They have no autonomous loop, no scheduled polling, and no independent write access to venture data.

### 5.3 Automation Triggered by Platform Events (not scheduled)

| Component | Trigger | Action |
|---|---|---|
| `scripts/post-merge.sh` | Replit agent task merge (via `.replit [postMerge]`) | Runs `pnpm install --frozen-lockfile=false && pnpm exec drizzle-kit push --force` — installs deps and pushes schema to **development** database |
| `server/_core/index.ts` `GET /health` | Cloud Run / Replit health check poll | Returns `{"status":"ok"}` — read-only, no DB call |

### 5.4 Summary: No Autonomous Agents Present

There are **no cron jobs, no background workers, no message queues (BullMQ, Bull, Agenda, pg-boss), no AI agent loops, and no autonomous polling processes** in this codebase. All mutations to venture data are exclusively user-initiated through authenticated tRPC calls. The SSE heartbeat is the only persistent server-side timer, and it holds no data custody beyond the in-memory connection registry.

---

*Report generated by observation of running code, environment variables (names only), git history, and process list. No documentation was used as a source of fact. No changes were made to the environment during this discovery.*
