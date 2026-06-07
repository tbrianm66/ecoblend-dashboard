---
name: DB driver and auth setup
description: Correct database driver, env var names, and dev-mode auth bypass for this project.
---

# DB Driver and Auth Setup

## Rule
`server/db.ts` must use `drizzle-orm/node-postgres` + `pg Pool` — NOT mysql2. The schema uses `pgTable` throughout and `DATABASE_URL` is a `postgresql://` URL.

**Why:** A previous version of db.ts used mysql2 driver against a PostgreSQL URL. The pool creation succeeded (no throw) but every query failed silently. `getDb()` returned null, causing all DB functions to return empty arrays or throw.

**How to apply:** Any time db.ts is regenerated or a new DB helper is created, verify:
```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);
```

## Env var names
- Cookie/JWT signing secret: `SESSION_SECRET` (Replit secret name) — code reads it via `process.env.SESSION_SECRET ?? process.env.JWT_SECRET ?? ""`
- OAuth server: `OAUTH_SERVER_URL` — NOT configured in the Replit dev environment
- App ID: `VITE_APP_ID` — NOT configured in dev

**Why:** The code originally read `JWT_SECRET` but the Replit secret is named `SESSION_SECRET`. Mismatch caused `ENV.cookieSecret = ""`, making JWT signing/verification broken.

## Dev-mode auth bypass
`server/_core/sdk.ts` → `SDKServer.authenticateRequest()` has a bypass:
```typescript
if (!ENV.oAuthServerUrl && !ENV.isProduction) {
  return this.getOrCreateDevUser();
}
```
- Creates user with `openId = "dev-local-admin"`, role `"admin"` on first call
- Only fires when `OAUTH_SERVER_URL` is unset AND `NODE_ENV !== "production"`
- Production is fully gated: `ENV.isProduction = process.env.NODE_ENV === "production"`

**Why:** No OAuth server is configured in the Replit dev environment, so `protectedProcedure` always returned 401 with no way to log in. The bypass lets the full app be used for development and testing.

**How to apply:** Do NOT remove or weaken this bypass for "cleanliness" — it is the only auth path in the dev environment. Do NOT add `OAUTH_SERVER_URL` unless setting up real OAuth. The bypass is inert in production.
