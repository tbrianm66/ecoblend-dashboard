-- =============================================================================
-- Phase 5: Classify and migrate legacy venture rows into Domain Brand architecture
-- Spec §43–46 (classification), §53 (Multiple Programmes), §54 (Brand Reassignment)
-- Applied: 2026-08-08
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- §43–45: Link the 4 domain_brand_proxy rows to their domain_brands FK
-- These rows represent the brand itself; domainBrandId→self-referential link.
-- brandAssignmentStatus → 'Confirmed_Brand'; migrationReviewRequired → false.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE ventures SET
  "domainBrandId"           = 1,
  "brandAssignmentStatus"   = 'Confirmed_Brand',
  "migrationReviewRequired" = false
WHERE id = 'tone' AND "entityType" = 'domain_brand_proxy';

UPDATE ventures SET
  "domainBrandId"           = 2,
  "brandAssignmentStatus"   = 'Confirmed_Brand',
  "migrationReviewRequired" = false
WHERE id = 'real' AND "entityType" = 'domain_brand_proxy';

UPDATE ventures SET
  "domainBrandId"           = 3,
  "brandAssignmentStatus"   = 'Confirmed_Brand',
  "migrationReviewRequired" = false
WHERE id = 'bebus' AND "entityType" = 'domain_brand_proxy';

UPDATE ventures SET
  "domainBrandId"           = 4,
  "brandAssignmentStatus"   = 'Confirmed_Brand',
  "migrationReviewRequired" = false
WHERE id = 'ecocomp' AND "entityType" = 'domain_brand_proxy';

-- Write history rows for the 4 proxy links
-- previousBrandId=NULL (they had no prior FK), newBrandId = their domain brand
INSERT INTO brand_assignment_history (
  "ventureId", "previousBrandId", "newBrandId",
  "brandAssignmentStatus", "reason", "decisionMaker", "decisionDate"
)
VALUES
  ('tone',    NULL, 1, 'Confirmed_Brand',
   'Phase 5 migration: domain_brand_proxy formally linked to TONE domain brand record.',
   'system_migration_phase5', NOW()),
  ('real',    NULL, 2, 'Confirmed_Brand',
   'Phase 5 migration: domain_brand_proxy formally linked to REAL domain brand record.',
   'system_migration_phase5', NOW()),
  ('bebus',   NULL, 3, 'Confirmed_Brand',
   'Phase 5 migration: domain_brand_proxy formally linked to BEBUS domain brand record.',
   'system_migration_phase5', NOW()),
  ('ecocomp', NULL, 4, 'Confirmed_Brand',
   'Phase 5 migration: domain_brand_proxy formally linked to ECOCOMP domain brand record.',
   'system_migration_phase5', NOW());

-- ─────────────────────────────────────────────────────────────────────────────
-- §46: Reclassify ECOCOMP-002 (BioForm) as a genuine venture candidate
-- Parent brand: ECOCOMP (id=4). Assign VEN-ECOCOMP-0001.
-- ─────────────────────────────────────────────────────────────────────────────

-- Initialise (or advance) the ECOCOMP venture-ref sequence to 1
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
WHERE id = 'ECOCOMP-002';

INSERT INTO brand_assignment_history (
  "ventureId", "previousBrandId", "newBrandId",
  "brandAssignmentStatus", "reason", "decisionMaker", "decisionDate"
)
VALUES (
  'ECOCOMP-002', NULL, 4, 'Confirmed_Brand',
  'Phase 5 migration: ECOCOMP BioForm reclassified as venture_candidate under ECOCOMP; VEN-ECOCOMP-0001 assigned.',
  'system_migration_phase5', NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ECOSHIELD-001: already entityType='venture_candidate', migrationReviewRequired=false.
-- Status: Unassigned — pending board decision on brand home.
-- No structural changes required. History note only.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO brand_assignment_history (
  "ventureId", "previousBrandId", "newBrandId",
  "brandAssignmentStatus", "reason", "decisionMaker", "decisionDate"
)
VALUES (
  'ECOSHIELD-001', NULL, NULL, 'Unassigned',
  'Phase 5 migration review: EcoShield Materials Ltd classified as venture_candidate; brand home pending board decision. No domain brand created yet.',
  'system_migration_phase5', NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- §53: Multiple Programmes — second programme from VEN-TONE-0002
-- Proves: one venture → N independent product programmes.
-- VEN-TONE-0002 = Bio-Composite Studio Acoustic Materials (Productisation_Approved)
-- New programme: PRG-TONE-0002 — TONE Composite Surfaces
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE programme_ref_sequences
SET "currentSequence" = GREATEST("currentSequence", 2), "updatedAt" = NOW()
WHERE "prefixKey" = 'TONE';

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

-- ─────────────────────────────────────────────────────────────────────────────
-- §54: Brand Reassignment — create a test venture, assign to BEBUS, reassign to REAL.
-- Uses BEBUS (id=3) → REAL (id=2). VEN ref changes on reassignment (brand-scoped).
-- ─────────────────────────────────────────────────────────────────────────────

-- Initialise BEBUS and REAL sequences
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

-- Create test venture: initially under BEBUS
INSERT INTO ventures (id, name, "entityType", "domainBrandId", "ventureRef",
  "brandAssignmentStatus", "candidateStatus", "migrationReviewRequired",
  status, vrl, trl)
VALUES (
  'ven-spec54-test', 'Spec §54 Brand Reassignment Test Venture',
  'venture_candidate', 3, 'VEN-BEBUS-0001',
  'Confirmed_Brand', 'Active', false,
  'Pre-Launch', 1, 1
)
ON CONFLICT (id) DO NOTHING;

-- History row 1: initial assignment → BEBUS
INSERT INTO brand_assignment_history (
  "ventureId", "previousBrandId", "newBrandId",
  "brandAssignmentStatus", "reason", "decisionMaker", "decisionDate"
)
VALUES (
  'ven-spec54-test', NULL, 3, 'Confirmed_Brand',
  '§54 test: initial assignment to BEBUS.',
  'system_phase5_spec54', NOW()
)
ON CONFLICT DO NOTHING;

-- Reassign to REAL (simulates board decision)
UPDATE ventures SET
  "domainBrandId"         = 2,
  "ventureRef"            = 'VEN-REAL-0001',
  "brandAssignmentStatus" = 'Confirmed_Brand'
WHERE id = 'ven-spec54-test';

-- History row 2: reassignment BEBUS → REAL
INSERT INTO brand_assignment_history (
  "ventureId", "previousBrandId", "newBrandId",
  "brandAssignmentStatus", "reason", "decisionMaker", "decisionDate"
)
VALUES (
  'ven-spec54-test', 3, 2, 'Confirmed_Brand',
  '§54 test: board reassignment from BEBUS to REAL. VEN ref updated to VEN-REAL-0001.',
  'system_phase5_spec54', NOW()
);

COMMIT;
