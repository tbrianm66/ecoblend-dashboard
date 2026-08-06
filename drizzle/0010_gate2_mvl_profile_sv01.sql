-- ============================================================
-- Migration 0010 — Gate 2: MVL Dimension + Profile SV-01
-- FHV-EB-AUD-001 v1.0 — Dimension Taxonomy Alignment
-- ============================================================

-- Part 1: Add MVL score column to VRL assessments
-- (Market Validation Level — Gate 2 10th VRL dimension, canonical 15% composite weight)
ALTER TABLE vrl_assessments
  ADD COLUMN IF NOT EXISTS mvl_score INTEGER NOT NULL DEFAULT 50;

-- Part 2: Add scoring profile columns to VRL assessments
-- (Profile SV-01: governed N/A path for MRL in software/social/service ventures)
ALTER TABLE vrl_assessments
  ADD COLUMN IF NOT EXISTS scoring_profile VARCHAR(32) NOT NULL DEFAULT 'STANDARD';

ALTER TABLE vrl_assessments
  ADD COLUMN IF NOT EXISTS mrl_is_unscored BOOLEAN NOT NULL DEFAULT FALSE;

-- Part 3: Add venture-level default scoring profile
-- (Carried from the venture record into each new assessment; overridable per submission)
ALTER TABLE ventures
  ADD COLUMN IF NOT EXISTS scoring_profile VARCHAR(32) NOT NULL DEFAULT 'STANDARD';

-- Part 4: Backfill — all existing VRL assessments default to STANDARD profile
UPDATE vrl_assessments SET scoring_profile = 'STANDARD' WHERE scoring_profile IS NULL;
UPDATE ventures         SET scoring_profile = 'STANDARD' WHERE scoring_profile IS NULL;
