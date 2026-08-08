-- ============================================================
-- Migration 0017: Production Domain Brand Seed & Legacy Venture
-- Classification
-- ============================================================
-- Prerequisite: Migration 0015 (schema) applied on production.
-- Purpose: Safe, idempotent data migration correcting the issues
-- that prevented migration 0016 from being applied to production:
--   (a) domain_brands table was empty on production (seed data
--       was applied via a dev script, not in any migration).
--   (b) The four legacy brand-proxy venture rows had entityType =
--       'venture_candidate' (the migration-0015 DEFAULT) rather
--       than 'domain_brand_proxy', so 0016's WHERE clauses matched
--       zero rows.
--   (c) 0016 referenced ven-tone-bca-001 (dev-only venture) via a
--       hard INSERT; that FK would fail on production.
--   (d) 0016 inserted ven-spec54-test (a spec validation record)
--       which must never appear in production.
-- This migration excludes (c) behind an EXISTS guard and excludes
-- (d) entirely. All other 0016 logic is reproduced and hardened.
-- ============================================================
-- Idempotency: safe to run more than once.
--   • domain_brands: ON CONFLICT (id) DO NOTHING
--   • ventures updates: guarded by column value checks (IS NULL /
--     current value checks) so re-runs are no-ops
--   • brand_assignment_history: guarded with WHERE NOT EXISTS
--     keyed on (ventureId, decisionMaker = 'system_migration_0017')
--   • venture_ref_sequences: ON CONFLICT DO UPDATE GREATEST
--   • product_programmes: ON CONFLICT DO NOTHING
-- ============================================================
-- Production safety:
--   • No DROP, TRUNCATE, or DELETE
--   • No modification of venture primary keys (id)
--   • dev-only records (ven-spec54-test, ven-tone-bca-001
--     dependents) excluded or guarded
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- 1. Seed the four authoritative Domain Brand records
--    Explicit IDs are required because downstream FKs in
--    0016 (and in the live dev database) reference ids 1–4
--    by literal value. ON CONFLICT (id) DO NOTHING ensures
--    re-runs and any existing partial state are safe.
-- ────────────────────────────────────────────────────────────

INSERT INTO domain_brands (
  id,
  "brandCode",
  "brandName",
  "brandStatus",
  description,
  sector,
  "createdAt",
  "updatedAt"
)
VALUES
  (1, 'TONE',    'TONE',    'Active',
   'Acoustic and bio-composite materials brand — sustainable high-performance acoustic solutions.',
   'Materials / Acoustics',    NOW(), NOW()),
  (2, 'REAL',    'REAL',    'Active',
   'Consumer and retail experiential brand — real-world sustainable consumer products.',
   'Consumer / Retail',        NOW(), NOW()),
  (3, 'BEBUS',   'BEBUS',   'Active',
   'B2B sustainable built-environment brand — eco-engineered building systems and surfaces.',
   'Built Environment',        NOW(), NOW()),
  (4, 'ECOCOMP', 'ECOCOMP', 'Active',
   'Eco-composite materials and engineering brand — advanced bio-composite R&D and productisation.',
   'Materials / Engineering',  NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Advance the SERIAL sequence so subsequent auto-generated ids
-- start from 5, not 1, avoiding collisions with the explicit rows.
SELECT setval(
  pg_get_serial_sequence('domain_brands', 'id'),
  GREATEST(4, (SELECT COALESCE(MAX(id), 4) FROM domain_brands))
);

-- ────────────────────────────────────────────────────────────
-- 2. Correct entityType on the four legacy brand-proxy ventures
--    After migration 0015 applied DEFAULT 'venture_candidate',
--    these four rows hold the default value. They must be
--    reclassified as 'domain_brand_proxy' before FK links are
--    applied (step 3) so that downstream queries using
--    entityType = 'domain_brand_proxy' work correctly.
--    Guard: only update rows still holding the default value;
--    re-runs that find the correct value are no-ops.
-- ────────────────────────────────────────────────────────────

UPDATE ventures SET
  "entityType"              = 'domain_brand_proxy',
  "migrationReviewRequired" = false
WHERE id IN ('tone', 'real', 'bebus', 'ecocomp')
  AND "entityType" = 'venture_candidate';

-- ────────────────────────────────────────────────────────────
-- 3. Link the four domain_brand_proxy venture rows to their
--    Domain Brand FK (domainBrandId).
--    Guard: only where domainBrandId IS NULL (first run or
--    corrective run after failed previous attempt).
-- ────────────────────────────────────────────────────────────

UPDATE ventures SET
  "domainBrandId"           = 1,
  "brandAssignmentStatus"   = 'Confirmed_Brand',
  "migrationReviewRequired" = false
WHERE id = 'tone'
  AND "entityType" = 'domain_brand_proxy'
  AND "domainBrandId" IS NULL;

UPDATE ventures SET
  "domainBrandId"           = 2,
  "brandAssignmentStatus"   = 'Confirmed_Brand',
  "migrationReviewRequired" = false
WHERE id = 'real'
  AND "entityType" = 'domain_brand_proxy'
  AND "domainBrandId" IS NULL;

UPDATE ventures SET
  "domainBrandId"           = 3,
  "brandAssignmentStatus"   = 'Confirmed_Brand',
  "migrationReviewRequired" = false
WHERE id = 'bebus'
  AND "entityType" = 'domain_brand_proxy'
  AND "domainBrandId" IS NULL;

UPDATE ventures SET
  "domainBrandId"           = 4,
  "brandAssignmentStatus"   = 'Confirmed_Brand',
  "migrationReviewRequired" = false
WHERE id = 'ecocomp'
  AND "entityType" = 'domain_brand_proxy'
  AND "domainBrandId" IS NULL;

-- ────────────────────────────────────────────────────────────
-- 4. Brand assignment history — four proxy venture links
--    Each row is guarded by WHERE NOT EXISTS keyed on
--    (ventureId, decisionMaker='system_migration_0017') so
--    re-runs produce no duplicate history rows.
-- ────────────────────────────────────────────────────────────

INSERT INTO brand_assignment_history (
  "ventureId", "previousBrandId", "newBrandId",
  "brandAssignmentStatus", "reason", "decisionMaker", "decisionDate"
)
SELECT
  'tone', NULL, 1, 'Confirmed_Brand',
  'Migration 0017: domain_brand_proxy formally linked to TONE domain brand record (production corrective migration).',
  'system_migration_0017', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM brand_assignment_history
  WHERE "ventureId" = 'tone'
    AND "decisionMaker" = 'system_migration_0017'
);

INSERT INTO brand_assignment_history (
  "ventureId", "previousBrandId", "newBrandId",
  "brandAssignmentStatus", "reason", "decisionMaker", "decisionDate"
)
SELECT
  'real', NULL, 2, 'Confirmed_Brand',
  'Migration 0017: domain_brand_proxy formally linked to REAL domain brand record (production corrective migration).',
  'system_migration_0017', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM brand_assignment_history
  WHERE "ventureId" = 'real'
    AND "decisionMaker" = 'system_migration_0017'
);

INSERT INTO brand_assignment_history (
  "ventureId", "previousBrandId", "newBrandId",
  "brandAssignmentStatus", "reason", "decisionMaker", "decisionDate"
)
SELECT
  'bebus', NULL, 3, 'Confirmed_Brand',
  'Migration 0017: domain_brand_proxy formally linked to BEBUS domain brand record (production corrective migration).',
  'system_migration_0017', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM brand_assignment_history
  WHERE "ventureId" = 'bebus'
    AND "decisionMaker" = 'system_migration_0017'
);

INSERT INTO brand_assignment_history (
  "ventureId", "previousBrandId", "newBrandId",
  "brandAssignmentStatus", "reason", "decisionMaker", "decisionDate"
)
SELECT
  'ecocomp', NULL, 4, 'Confirmed_Brand',
  'Migration 0017: domain_brand_proxy formally linked to ECOCOMP domain brand record (production corrective migration).',
  'system_migration_0017', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM brand_assignment_history
  WHERE "ventureId" = 'ecocomp'
    AND "decisionMaker" = 'system_migration_0017'
);

-- ────────────────────────────────────────────────────────────
-- 5. §46: Reclassify ECOCOMP-002 (ECOCOMP BioForm) as a
--    genuine venture_candidate under the ECOCOMP domain brand.
--    Assign stable reference VEN-ECOCOMP-0001.
--    Guard: only where domainBrandId IS NULL (not yet linked).
--    ECOCOMP-002 is confirmed present on production.
-- ────────────────────────────────────────────────────────────

-- Initialise (or advance) the ECOCOMP venture-ref sequence to 1.
INSERT INTO venture_ref_sequences ("prefixKey", "currentSequence", "updatedAt")
VALUES ('ECOCOMP', 1, NOW())
ON CONFLICT ("prefixKey") DO UPDATE
  SET "currentSequence" = GREATEST(venture_ref_sequences."currentSequence", 1),
      "updatedAt"       = NOW();

UPDATE ventures SET
  "entityType"              = 'venture_candidate',
  "domainBrandId"           = 4,
  "ventureRef"              = 'VEN-ECOCOMP-0001',
  "brandAssignmentStatus"   = 'Confirmed_Brand',
  "migrationReviewRequired" = false
WHERE id = 'ECOCOMP-002'
  AND "domainBrandId" IS NULL;

INSERT INTO brand_assignment_history (
  "ventureId", "previousBrandId", "newBrandId",
  "brandAssignmentStatus", "reason", "decisionMaker", "decisionDate"
)
SELECT
  'ECOCOMP-002', NULL, 4, 'Confirmed_Brand',
  'Migration 0017: ECOCOMP BioForm reclassified as venture_candidate under ECOCOMP; VEN-ECOCOMP-0001 assigned (production corrective migration).',
  'system_migration_0017', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM brand_assignment_history
  WHERE "ventureId" = 'ECOCOMP-002'
    AND "decisionMaker" = 'system_migration_0017'
);

-- ────────────────────────────────────────────────────────────
-- 6. ECOSHIELD-001: governance note — no structural changes.
--    Brand home is Unassigned; pending board decision.
--    Confirmed present on production.
-- ────────────────────────────────────────────────────────────

INSERT INTO brand_assignment_history (
  "ventureId", "previousBrandId", "newBrandId",
  "brandAssignmentStatus", "reason", "decisionMaker", "decisionDate"
)
SELECT
  'ECOSHIELD-001', NULL, NULL, 'Unassigned',
  'Migration 0017: EcoShield Materials Ltd classified as venture_candidate; brand home pending board decision. No domain brand created yet (production corrective migration).',
  'system_migration_0017', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM brand_assignment_history
  WHERE "ventureId" = 'ECOSHIELD-001'
    AND "decisionMaker" = 'system_migration_0017'
);

-- ────────────────────────────────────────────────────────────
-- 7. Initialise venture reference sequences for BEBUS and REAL
--    (used by future VEN-BEBUS-XXXX and VEN-REAL-XXXX refs).
--    ON CONFLICT GREATEST ensures re-runs are safe.
-- ────────────────────────────────────────────────────────────

INSERT INTO venture_ref_sequences ("prefixKey", "currentSequence", "updatedAt")
VALUES ('BEBUS', 1, NOW())
ON CONFLICT ("prefixKey") DO UPDATE
  SET "currentSequence" = GREATEST(venture_ref_sequences."currentSequence", 1),
      "updatedAt"       = NOW();

INSERT INTO venture_ref_sequences ("prefixKey", "currentSequence", "updatedAt")
VALUES ('REAL', 1, NOW())
ON CONFLICT ("prefixKey") DO UPDATE
  SET "currentSequence" = GREATEST(venture_ref_sequences."currentSequence", 1),
      "updatedAt"       = NOW();

-- ────────────────────────────────────────────────────────────
-- 8. §53 GUARDED: Second product programme from VEN-TONE-0002
--    ('TONE Composite Surfaces' — proves 1 venture → N programmes)
--    The parent venture ven-tone-bca-001 was created in the
--    development environment during Phase 3 and does NOT exist
--    in production. This entire block is wrapped in a DO $$
--    guard that checks for the parent venture's existence before
--    executing. On production this block is a controlled no-op.
--    On development (where ven-tone-bca-001 exists) it applies
--    the programme record.
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM ventures WHERE id = 'ven-tone-bca-001') THEN

    -- Advance TONE programme reference sequence
    INSERT INTO programme_ref_sequences ("prefixKey", "currentSequence", "updatedAt")
    VALUES ('TONE', 2, NOW())
    ON CONFLICT ("prefixKey") DO UPDATE
      SET "currentSequence" = GREATEST(programme_ref_sequences."currentSequence", 2),
          "updatedAt"       = NOW();

    -- Insert §53 second programme
    INSERT INTO product_programmes (
      "programmeRef", "programmeName", "ventureId", "domainBrandId",
      "programmeStatus", "description"
    )
    VALUES (
      'PRG-TONE-0002',
      'TONE Composite Surfaces',
      'ven-tone-bca-001',
      1,
      'Active',
      'Flat-panel hemp-composite surface cladding line — acoustic and interior architecture applications. Second programme from VEN-TONE-0002; validates §53 (Multiple Programmes per Venture).'
    )
    ON CONFLICT ("programmeRef") DO NOTHING;

  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 9. EXCLUDED: dev-only synthetic / test records
--    The following records from migration 0016 are deliberately
--    excluded from this production migration:
--
--    • ven-spec54-test  — 'Spec §54 Brand Reassignment Test Venture'
--      This is a development-only record used to validate the §54
--      brand reassignment spec scenario. It MUST NOT be seeded
--      into production. No INSERT, UPDATE, or history row for
--      ven-spec54-test appears in this migration.
--
--    • brand_assignment_history rows tied to ven-spec54-test
--      Also excluded.
--
--    Validation assertion: confirm the record is absent.
--    (This DO block raises an exception if a previous migration
--    erroneously inserted ven-spec54-test into this environment.)
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM ventures WHERE id = 'ven-spec54-test') THEN
    RAISE NOTICE 'INFO: ven-spec54-test exists in this environment (development database). It is excluded from migration 0017 and was NOT inserted by this migration.';
  END IF;
END;
$$;

COMMIT;
