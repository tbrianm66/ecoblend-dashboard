-- ============================================================
-- Migration 0014: Phase 3 — Operations & Manufacturing Module
-- Tables: operating_models, suppliers, manufacturing_plans,
--         quality_compliance, mrl_evaluations
-- ============================================================

CREATE TABLE IF NOT EXISTS "operating_models" (
  "id"                      SERIAL PRIMARY KEY,
  "venture_id"              VARCHAR(64) NOT NULL,
  "model_type"              VARCHAR(50) NOT NULL DEFAULT 'in_house',
  "capacity_units_per_month" INTEGER,
  "unit_op_cost"            NUMERIC(14, 4),
  "facility_location"       TEXT,
  "status"                  VARCHAR(50) NOT NULL DEFAULT 'draft',
  "notes"                   TEXT,
  "created_at"              TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "suppliers" (
  "id"                 SERIAL PRIMARY KEY,
  "venture_id"         VARCHAR(64) NOT NULL,
  "supplier_name"      VARCHAR(255) NOT NULL,
  "component_supplied" TEXT,
  "lead_time_days"     INTEGER,
  "moq"                INTEGER,
  "unit_cost"          NUMERIC(14, 4),
  "risk_level"         VARCHAR(20) NOT NULL DEFAULT 'medium',
  "single_source"      BOOLEAN NOT NULL DEFAULT FALSE,
  "audit_status"       VARCHAR(50) NOT NULL DEFAULT 'not_audited',
  "notes"              TEXT,
  "created_at"         TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "manufacturing_plans" (
  "id"                       SERIAL PRIMARY KEY,
  "venture_id"               VARCHAR(64) NOT NULL,
  "phase_name"               VARCHAR(50) NOT NULL DEFAULT 'pilot',
  "target_yield_percentage"  NUMERIC(5, 2),
  "actual_yield_percentage"  NUMERIC(5, 2),
  "scrap_rate"               NUMERIC(5, 2),
  "planned_start_date"       DATE,
  "completion_date"          DATE,
  "notes"                    TEXT,
  "created_at"               TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"               TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "quality_compliance" (
  "id"                   SERIAL PRIMARY KEY,
  "venture_id"           VARCHAR(64) NOT NULL,
  "certification_name"   VARCHAR(255) NOT NULL,
  "standard_code"        VARCHAR(100),
  "status"               VARCHAR(50) NOT NULL DEFAULT 'not_started',
  "expiry_date"          DATE,
  "document_evidence_id" VARCHAR(255),
  "notes"                TEXT,
  "created_at"           TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "mrl_evaluations" (
  "id"               SERIAL PRIMARY KEY,
  "venture_id"       VARCHAR(64) NOT NULL,
  "mrl_level"        INTEGER NOT NULL CHECK ("mrl_level" BETWEEN 1 AND 9),
  "evaluation_notes" TEXT,
  "evidence_id"      VARCHAR(255),
  "status"           VARCHAR(50) NOT NULL DEFAULT 'draft',
  "created_at"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "operating_models_venture_id_idx" ON "operating_models" ("venture_id");
CREATE INDEX IF NOT EXISTS "suppliers_venture_id_idx" ON "suppliers" ("venture_id");
CREATE INDEX IF NOT EXISTS "manufacturing_plans_venture_id_idx" ON "manufacturing_plans" ("venture_id");
CREATE INDEX IF NOT EXISTS "quality_compliance_venture_id_idx" ON "quality_compliance" ("venture_id");
CREATE INDEX IF NOT EXISTS "mrl_evaluations_venture_id_idx" ON "mrl_evaluations" ("venture_id");
