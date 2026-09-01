-- Stage 1: Canonical Validation Spine
-- Development-first, additive, non-destructive and backwards-compatible.
-- This migration adds one lifecycle owner and nullable linkage/provenance fields
-- to the existing Command Centre hypothesis, evidence, experiment and decision
-- records. It does not update venture state or historical rows.

BEGIN;

CREATE TABLE IF NOT EXISTS "validation_lifecycles" (
  "id" serial PRIMARY KEY NOT NULL,
  "ventureId" varchar(64) NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "lifecycleState" text DEFAULT 'DISCOVERY' NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "ownerUserId" integer NOT NULL,
  "createdByUserId" integer NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "validation_lifecycles_venture_version_unique" UNIQUE("ventureId", "version"),
  CONSTRAINT "validation_lifecycles_venture_fk"
    FOREIGN KEY ("ventureId") REFERENCES "public"."ventures"("id")
    ON DELETE RESTRICT ON UPDATE NO ACTION
);

ALTER TABLE "cc_hypotheses"
  ADD COLUMN IF NOT EXISTS "validationLifecycleId" integer,
  ADD COLUMN IF NOT EXISTS "hypothesisVersion" integer DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS "previousHypothesisId" integer,
  ADD COLUMN IF NOT EXISTS "validationCriteria" text;

ALTER TABLE "cc_experiments"
  ADD COLUMN IF NOT EXISTS "validationLifecycleId" integer;

ALTER TABLE "cc_evidence"
  ADD COLUMN IF NOT EXISTS "validationLifecycleId" integer,
  ADD COLUMN IF NOT EXISTS "evidenceRelationship" text,
  ADD COLUMN IF NOT EXISTS "provenance" text,
  ADD COLUMN IF NOT EXISTS "collectorUserId" integer,
  ADD COLUMN IF NOT EXISTS "collectedAt" timestamp,
  ADD COLUMN IF NOT EXISTS "reliability" integer,
  ADD COLUMN IF NOT EXISTS "independence" text;

ALTER TABLE "cc_decisions"
  ADD COLUMN IF NOT EXISTS "validationLifecycleId" integer,
  ADD COLUMN IF NOT EXISTS "hypothesisId" integer,
  ADD COLUMN IF NOT EXISTS "humanDecision" text,
  ADD COLUMN IF NOT EXISTS "decisionAuthorityUserId" integer,
  ADD COLUMN IF NOT EXISTS "decisionRationale" text,
  ADD COLUMN IF NOT EXISTS "evidenceReferences" text,
  ADD COLUMN IF NOT EXISTS "overrideReason" text,
  ADD COLUMN IF NOT EXISTS "decidedAt" timestamp;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cc_hypotheses_validation_lifecycle_fk') THEN
    ALTER TABLE "cc_hypotheses"
      ADD CONSTRAINT "cc_hypotheses_validation_lifecycle_fk"
      FOREIGN KEY ("validationLifecycleId") REFERENCES "validation_lifecycles"("id")
      ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cc_experiments_validation_lifecycle_fk') THEN
    ALTER TABLE "cc_experiments"
      ADD CONSTRAINT "cc_experiments_validation_lifecycle_fk"
      FOREIGN KEY ("validationLifecycleId") REFERENCES "validation_lifecycles"("id")
      ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cc_evidence_validation_lifecycle_fk') THEN
    ALTER TABLE "cc_evidence"
      ADD CONSTRAINT "cc_evidence_validation_lifecycle_fk"
      FOREIGN KEY ("validationLifecycleId") REFERENCES "validation_lifecycles"("id")
      ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cc_decisions_validation_lifecycle_fk') THEN
    ALTER TABLE "cc_decisions"
      ADD CONSTRAINT "cc_decisions_validation_lifecycle_fk"
      FOREIGN KEY ("validationLifecycleId") REFERENCES "validation_lifecycles"("id")
      ON DELETE RESTRICT;
  END IF;
END $$;

COMMIT;