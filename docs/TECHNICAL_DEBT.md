# Technical Debt Register

This file tracks intentional debt decisions — architectural shortcuts, deferred migrations,
and naming inconsistencies that are documented here rather than fixed immediately.
Each entry records what was deferred, why, and the condition that should trigger resolution.

---

## DEBT-VMC-001: Venture Model Canvas Schema Renaming

| Field            | Value |
|------------------|-------|
| **Status**       | **Deferred** — Option A (UI/Route layer rename) is active |
| **Introduced**   | 2026-08-06 |
| **Owner**        | Platform / Data Engineering |
| **Priority**     | Low — no functional impact while Option A is active |

### Context

The canvas feature was originally built as "Lean Canvas" and all underlying database
tables, foreign keys, tRPC router names, and internal identifiers were named accordingly.
A product decision (Option A) renamed the user-facing product to **Venture Model Canvas**
at the display layer only — labels, page titles, routes, and export outputs — without
touching the database schema or backend router names.

### What Was Done (Option A — Active)

- Sidebar label under `2. Venture Intake` → **"Initial Venture Canvas"**
- Sidebar label under `4. Proposition & Model` → **"Venture Model Canvas"**
- Redundant `4b. Lean Canvas` sidebar group **removed**
- Canonical UI route added: `/proposition/venture-model-canvas` (old `/lean/canvas` kept as alias)
- Page titles, empty-state copy, breadcrumbs, and markdown export header updated
- `PropositionOverview` and `VentureIntake` section cards updated

### Target Action (Option B — Deferred)

When performing a full schema migration or major database overhaul, execute the following:

#### 1. Database table renames
```sql
ALTER TABLE lean_canvases              RENAME TO venture_model_canvases;
ALTER TABLE lean_canvas_blocks         RENAME TO venture_model_canvas_blocks;
ALTER TABLE lean_canvas_block_evidence RENAME TO venture_model_canvas_block_evidence;
```

#### 2. Foreign key column renames
```sql
-- In any table referencing lean_canvases:
ALTER TABLE lean_canvas_blocks         RENAME COLUMN lean_canvas_id TO venture_model_canvas_id;
ALTER TABLE lean_canvas_block_evidence RENAME COLUMN lean_canvas_block_id TO venture_model_canvas_block_id;
-- Audit all other tables with lean_canvas_id FK columns before running.
```

#### 3. Drizzle schema updates (`drizzle/schema.ts`)
- Rename `leanCanvases` → `ventureModelCanvases`
- Rename `leanCanvasBlocks` → `ventureModelCanvasBlocks`
- Rename `leanCanvasBlockEvidence` → `ventureModelCanvasBlockEvidence`
- Update all `references()` calls and relation definitions

#### 4. Backend router rename (`server/`)
- Rename `server/leanCanvas.router.ts` → `server/ventureModelCanvas.router.ts`
- Rename export `leanCanvasRouter` → `ventureModelCanvasRouter`
- Update `server/routers.ts` registration key from `leanCanvas` to `ventureModelCanvas`
- Update all `server/ventureIntake.router.ts` and `server/proposition.router.ts` references

#### 5. Client tRPC call-site updates (`client/src/`)
- Replace `trpc.leanCanvas.*` → `trpc.ventureModelCanvas.*` across all pages and components
- Remove the `/lean/canvas` backward-compat route alias from `client/src/App.tsx`
- Update `client/src/pages/lean/LeanCanvas.tsx` filename/path if desired

#### 6. Scoring and utility files
- Update any internal references in `client/src/lib/lean-canvas-scoring.ts`
  (filename can remain as-is or be renamed to `venture-model-canvas-scoring.ts`)

### Rebuild Condition

Execute **Option B** when:
- A full schema migration or database overhaul is already planned
- The team is regenerating Drizzle migrations from scratch
- A new major version of the platform is being released

Do **not** execute piecemeal in a running production database without a full migration plan
and backward-compatibility window for any external integrations reading these table names.
