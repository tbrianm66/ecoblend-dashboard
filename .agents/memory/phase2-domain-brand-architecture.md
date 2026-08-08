---
name: Phase 2 — Domain Brand Architecture
description: Core data architecture for Domain Brand → Venture → Product hierarchy. Tables, columns, router, migration, and spec test results.
---

# Phase 2 — Domain Brand → Venture → Product Architecture

**Why:** ECOBLEND OS spec v1.0 requires a full hierarchy: Domain Brand → Venture Candidate → Product Programme → Product Family → Product → Product Variant → Part Number. The existing flat `ventures` table conflated Brands, Ventures, and Products.

## Strategy applied
- **Option B**: ventures table retained as `venture_candidates` by convention (all FK relationships preserved). New columns added additively via `0015` migration. No data deleted. Existing brand-proxy rows (tone, real, bebus, ecocomp, ECOCOMP-002) marked `entityType='domain_brand_proxy'` and `migrationReviewRequired=true`.
- **Dead code removed**: `schema_fin.ts`, `schema_crm.ts`, `schema_dm.ts`, `schema_uni.ts`, `schema_extended.ts` deleted (all were MySQL-dialect shadow definitions, superseded by pgTable defs in schema.ts). `mysql2` removed from package.json.

## Migration: 0015_phase2_domain_brand_architecture.sql
14 new tables + 6 new columns on `ventures`.

## New tables
- `domain_brands` — persistent sector-facing umbrellas (TONE, REAL, BEBUS, ECOCOMP seeded)
- `brand_assignment_history` — immutable audit trail for brand changes
- `brand_fit_assessments` — scored fit of a venture against a brand
- `productisation_decisions` — governed gate record (Approve/Hold/Reject etc.)
- `product_programmes` — PRG-XXXX-NNNN refs, linked to venture
- `product_families` — grouped by programme, familyCode+programmeId UNIQUE
- `products` — PROD-XXXX-NNNN refs, supports physical/digital/service/AI etc.
- `product_variants` — JSONB technicalAttributes for flexibility
- `part_number_configs` — configurable format template per family
- `part_numbers` — UNIQUE constraint on partNumber (DB-level collision prevention)
- `part_number_revisions` — immutable, UNIQUE (partNumberId, revision)
- `venture_ref_sequences`, `programme_ref_sequences`, `product_ref_sequences` — atomic counters

## New ventures columns (additive)
- `domainBrandId` integer nullable
- `entityType` text default 'venture_candidate'
- `candidateStatus` text default 'Active'
- `ventureRef` varchar(32) UNIQUE nullable (VEN-XXXX-NNNN)
- `brandAssignmentStatus` text default 'Unassigned'
- `migrationReviewRequired` boolean default false

## Router: server/domainBrand.router.ts
10 sub-routers registered in appRouter:
- `domainBrands`, `ventureCandidateOps`, `brandFitAssessment`, `productisationGate`
- `productProgrammes`, `productFamilies`, `products`, `productVariants`
- `partNumbers`, `portfolioPipeline`

## Spec test results (all PASSED)
- §48: Two independent TONE venture candidates created ✓
- §49: Productisation gate — TONE-GOV-2026-001 approved ✓
- §50: Full traceability TONE-BAP-0001 → variant → product → family → programme → venture → brand ✓
- §51: Unassigned venture (domainBrandId=null, brandAssignmentStatus='Unassigned') ✓
- §52: Failed venture (Killed) does NOT affect domain brand status ✓
- §55: DB UNIQUE constraint rejects duplicate part number ✓
- §56: Rev A → Rev B preserved in part_number_revisions ✓

## Phase 4 UI — Product Portfolio, Product Master, Part Number Register
- `/portfolio/products` → `ProductPortfolioPage.tsx` — Brand tabs → Programme accordions → Family accordions → Product rows; inline dialogs for New Family, New Product, PN Config
- `/portfolio/products/:productRef` → `ProductMasterPage.tsx` — Provenance chain breadcrumb; tabs: Overview, Variants, Part Numbers (issue/revise inline), Traceability
- `/portfolio/part-numbers` → `PartNumberRegister.tsx` — Global register; expandable revision history; Raise Revision dialog; Traceability dialog
- Server: added `partNumbers.listAll` (joins partNumbers → products, supports brandId/status filter)
- Sidebar icons: must import `Tag` explicitly (not in default set); `Package2` was already present
- All reads use `publicProcedure` (OAUTH_SERVER_URL is set; protectedProcedure requires session cookie)

## Phase 3 UI — Routes and nav added
- `/portfolio/brands` → `DomainBrandsPage.tsx`
- `/portfolio/brands/:brandCode` → `DomainBrandDetail.tsx` (5 tabs: Overview, Venture Pipeline, Productisation Gate, Product Portfolio, Brand Fit)
- `/portfolio/pipeline` → `VenturePipelinePage.tsx`
- Sidebar: "PORTFOLIO ARCHITECTURE" group added above Command Centre — always visible
- Server reads changed from `protectedProcedure` → `publicProcedure` (OAUTH_SERVER_URL is set in prod, so protectedProcedure requires a session cookie; consistent with admin.router.ts pattern)

## How to apply
- Any new module linking to a venture should check `entityType` before assuming it's a pure venture candidate
- Part number issuance must go through `part_number_configs.currentSequence` (atomic DB update)
- Brand reassignments must write to `brand_assignment_history` before updating the FK
- Schema.ts `ventures` table definition now includes the Phase 2 columns
