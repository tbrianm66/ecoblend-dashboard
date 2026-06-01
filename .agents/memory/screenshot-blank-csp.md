---
name: Dev CSP must allow inline scripts (Vite React preamble)
description: A strict script-src CSP crashes the whole dev app with "can't detect preamble"; dev needs 'unsafe-inline'.
---

The Express server sets a Content-Security-Policy (in `server/_core/index.ts`). If `script-src` is strict (`'self'` with no `'unsafe-inline'`), the **entire app crashes in development** with the browser console error:
`@vitejs/plugin-react can't detect preamble. Something is wrong.` (thrown from the first React component module, e.g. `sonner.tsx`).

**Why:** Vite's `@vitejs/plugin-react` injects an **inline** preamble script for React Refresh, and HMR uses inline scripts. A strict CSP blocks them, so `window.__vite_plugin_react_preamble_installed__` is never set and React never mounts — the page renders fully blank (this also makes the `app_preview` screenshot tool return all-white).

**How to apply:** In `scriptSrc`, include `'unsafe-inline'` when `NODE_ENV !== "production"` only. Production serves a static bundle with no inline scripts, so it keeps the strict policy. Never add a nonce alongside `'unsafe-inline'` — browsers ignore `'unsafe-inline'` when a nonce/hash is present. A blank dev preview + "can't detect preamble" in console = check the CSP first, not your component code.
