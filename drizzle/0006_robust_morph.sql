-- D6 Engine Provenance — surgical migration
-- Adds engine version tracking to scoring_sessions and mrl_assessments,
-- then backfills the existing Engine B scoring session as superseded.
--
-- Safe to re-run: ADD COLUMN IF NOT EXISTS guards against duplicate application.

-- 1. Add engine provenance columns to scoring_sessions
ALTER TABLE "scoring_sessions"
  ADD COLUMN IF NOT EXISTS "engineVersion" varchar(32) NOT NULL DEFAULT 'unknown';
--> statement-breakpoint
ALTER TABLE "scoring_sessions"
  ADD COLUMN IF NOT EXISTS "supersededAt" timestamp;
--> statement-breakpoint

-- 2. Add engine provenance column to mrl_assessments
ALTER TABLE "mrl_assessments"
  ADD COLUMN IF NOT EXISTS "engineVersion" varchar(32) NOT NULL DEFAULT 'engine-a';
--> statement-breakpoint

-- 3. Backfill: mark all pre-D6 scoring_sessions rows as Engine B superseded.
--    Predicate targets only rows that were created before this migration ran
--    (engineVersion still at the just-added default 'unknown'), so re-runs are
--    a no-op for any rows already set to 'engine-b'.
UPDATE "scoring_sessions"
SET
  "engineVersion"  = 'engine-b',
  "supersededAt"   = NOW()
WHERE "engineVersion" = 'unknown';
