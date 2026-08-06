-- ============================================================================
-- 0009 — Hybrid Venture Model Canvas (10-block mission-locked schema)
-- Adds 8 new columns to lean_canvases for the Hybrid VMC.
-- Backfills legacy field data into the new columns where applicable.
-- All columns are nullable — no data loss for existing canvas records.
-- ============================================================================

ALTER TABLE lean_canvases
  ADD COLUMN IF NOT EXISTS "keyPartners"          TEXT,
  ADD COLUMN IF NOT EXISTS "keyActivities"        TEXT,
  ADD COLUMN IF NOT EXISTS "keyResources"         TEXT,
  ADD COLUMN IF NOT EXISTS "commercialValueProp"  TEXT,
  ADD COLUMN IF NOT EXISTS "missionValueProp"     TEXT,
  ADD COLUMN IF NOT EXISTS "beneficiarySegments"  TEXT,
  ADD COLUMN IF NOT EXISTS "missionGovernance"    TEXT,
  ADD COLUMN IF NOT EXISTS "impactMetrics"        TEXT;

-- ── Legacy field backfill ─────────────────────────────────────────────────────
-- Populate new hybrid blocks from the closest legacy equivalents
-- so that existing canvas records surface coherently in the new UI.

-- uniqueValueProp → commercialValueProp
UPDATE lean_canvases
  SET "commercialValueProp" = "uniqueValueProp"
  WHERE "commercialValueProp" IS NULL
    AND "uniqueValueProp"  IS NOT NULL
    AND "uniqueValueProp"  <> '';

-- keyMetrics → impactMetrics
UPDATE lean_canvases
  SET "impactMetrics" = "keyMetrics"
  WHERE "impactMetrics" IS NULL
    AND "keyMetrics"   IS NOT NULL
    AND "keyMetrics"   <> '';

-- unfairAdvantage → keyResources
UPDATE lean_canvases
  SET "keyResources"   = "unfairAdvantage"
  WHERE "keyResources" IS NULL
    AND "unfairAdvantage" IS NOT NULL
    AND "unfairAdvantage" <> '';

-- solution → keyActivities
UPDATE lean_canvases
  SET "keyActivities" = solution
  WHERE "keyActivities" IS NULL
    AND solution        IS NOT NULL
    AND solution        <> '';
