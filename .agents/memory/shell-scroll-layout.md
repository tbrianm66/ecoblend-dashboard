---
name: App shell scroll layout
description: How the sidebar + main content scroll model works, and the safe way to add sticky/tab pages
---

# App shell scroll layout

The legacy shell wrapped pages in a `min-h-screen` flex row that let the whole
document scroll (sidebar scrolled away on long pages). Most pages give themselves
a `flex-1 overflow-y-auto` root, so they appear to scroll internally, but a few
pages (e.g. dashboards using `minHeight: 100vh` roots, NotFound, ComponentShowcase)
have no scroll container of their own.

**Rule:** The shell uses a fixed-height layout — outer `flex h-screen overflow-hidden`,
sidebar `h-screen`, and the main content column `flex-1 flex flex-col min-h-0 overflow-y-auto`.

**Why:** Pages with their own `flex-1 overflow-y-auto` still scroll internally
(sidebar stays fixed). Pages WITHOUT one (the handful of outliers) scroll via the
column's own `overflow-y-auto` fallback instead of being clipped. This keeps the
sidebar fixed everywhere while never clipping any page.

**How to apply:** When adding a page that needs a sticky header / tab bar that stays
pinned while content scrolls, make the page root a bounded scroll container
(`flex-1 overflow-y-auto`) and put the sticky element as a child with
`sticky top-0`. Do NOT change the column back to `overflow-hidden` — that clips the
outlier pages. Do NOT use a second nested `overflow` scroll region inside a page
that already has one, or the sticky element pins to the wrong container.
