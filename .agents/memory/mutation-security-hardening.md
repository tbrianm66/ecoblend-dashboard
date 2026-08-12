---
name: Mutation Security Hardening
description: Summary of publicProcedure → protectedProcedure/adminProcedure hardening work across all tRPC routers
---

## Rule
All tRPC `.mutation()` procedures must use `protectedProcedure` (or `adminProcedure`) — never `publicProcedure`. The only intentional exception is `logout: publicProcedure.mutation` so users can log out with expired sessions.

## Why
Any `publicProcedure.mutation` allows unauthenticated writes to the database. This was identified as task #210 (prevent unauthenticated data writes).

## How to Apply
After any bulk code generation or adding new router procedures:
1. Run the Python scan to detect any new violations:
```python
import re, os
for f in os.listdir('server'):
    if f.endswith('.ts') and not f.endswith('.test.ts'):
        path = f'server/{f}'
        with open(path) as fh:
            lines = fh.readlines()
        i = 0
        while i < len(lines):
            m = re.match(r'\s+(\w+):\s*publicProcedure\b', lines[i])
            if m and m.group(1) != 'logout':
                block = ''.join(lines[i:i+10])
                q, mt = block.find('.query('), block.find('.mutation(')
                if mt != -1 and (q == -1 or mt < q):
                    print(f'{path}:{i+1}: {m.group(1)}')
            i += 1
```
2. System-admin operations (toggleModuleStatus, updateSystemConfig, etc.) → `adminProcedure`
3. All other mutations → `protectedProcedure`

## Admin-Only Mutations (use adminProcedure)
In `admin.router.ts`: `toggleModuleStatus`, `updateSystemConfig`, `toggleIntegrationStatus`, `revokeApiKey`, `generateNewApiKey`
In `contextual.router.ts`: `adminGetWidgetSettings`, `adminGetContextDiagnostics`, `adminExportAnalyticsCsv`, `adminFullAnalytics`

## Test Fixes Required When Protecting Mutations
When test files use `appRouter.createCaller({ user: null })` or `appRouter.createCaller({})` to call mutations, they must be updated to provide an authenticated user:
```ts
const callerAuth = appRouter.createCaller({
  user: { id: 1, role: "admin", openId: "test", email: "admin@test.io", name: "Test Admin",
          loginMethod: "manus", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
});
```

## Completed — All Mutations Protected
Two-pass scan (15-line + 60-line lookahead) + 2000-char comprehensive scan all return CLEAN.
Total procedures protected: 321+ across all server/*.router.ts and server/routers.ts.

## Test Fixes Required Pattern
When protecting mutations, tests with `createCaller({} as any)` or `createCaller({ user: null })` need auth ctx.
Pattern to add at top of test file:
```ts
const AUTH_CTX = { user: { id: 1, role: "admin" as const, openId: "test-admin", email: "t@test.io", name: "T" } };
const callerAuth = appRouter.createCaller(AUTH_CTX as any);
```

## pg Driver Pattern (always use for pg, never MySQL patterns)
- Insert returning ID: `const [result] = await db.insert(table).values({...}).returning({ id: table.id })`
- Do NOT use: `.$returningId()` (MySQL only) or `const [result] = await db.insert(...)` without `.returning()`
- Do NOT use: `const [rows] = db.execute()` — pg returns `{ rows: [] }` not `[[rows], fields]`
