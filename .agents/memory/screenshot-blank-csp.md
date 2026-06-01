---
name: Blank app_preview screenshots in this repl
description: Why the screenshot tool returns an all-white image even when the app works, and how to actually verify.
---

The `app_preview` screenshot tool returns a fully blank/white image for **every** route in this repl (legacy `/` and `/v2` alike), while the browser console still shows React loading (`Download React DevTools`) and `[vite] connected`.

**Why:** The page's CSP (`script-src 'self' https://forge.butterfly-effect.dev https://maps.googleapis.com`) refuses inline scripts, and the headless capture used by the tool does not paint the React tree through the proxy. The user's real preview pane renders fine. This is an environment/tooling artifact, not an application bug.

**How to apply:** Do NOT treat a blank screenshot here as a code defect. Verify the app another way: run `npx vite build` (clean build = code compiles), curl `http://localhost:5000/<route>` for a 200, and curl a module path (e.g. `/src/v2/V2App.tsx`) to confirm Vite transforms it. Only suspect real breakage if the build fails or module transform 500s.
