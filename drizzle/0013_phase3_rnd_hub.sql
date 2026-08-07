-- ============================================================
-- Migration 0013 — Phase 3: R&D Hub & IP Tracker
-- Section 5 — rnd_projects, technical_kpis, prototype_tests
-- Note: ip_assets already exists; adding venture index only.
-- ============================================================

-- Add venture lookup index to existing ip_assets (uses camelCase column name)
CREATE INDEX IF NOT EXISTS "ip_assets_venture_idx"
  ON "ip_assets" ("ventureId");

CREATE TABLE IF NOT EXISTS "rnd_projects" (
  "id"                    serial        PRIMARY KEY,
  "venture_id"            varchar(64)   NOT NULL,
  "project_name"          varchar(256)  NOT NULL,
  "description"           text,
  "classification"        varchar(32)   NOT NULL DEFAULT 'iterative',
  "current_stage"         varchar(32)   NOT NULL DEFAULT 'concept',
  "stage_status"          varchar(32)   NOT NULL DEFAULT 'in_progress',
  "target_trl"            integer       NOT NULL DEFAULT 4,
  "completion_percentage" integer       NOT NULL DEFAULT 0,
  "technical_lead"        varchar(256),
  "domain"                varchar(256),
  "budget_allocated"      integer       DEFAULT 0,
  "budget_spent"          integer       DEFAULT 0,
  "ip_status"             varchar(128),
  "gate_checklist"        jsonb         DEFAULT '{}',
  "created_at"            timestamp     DEFAULT now() NOT NULL,
  "updated_at"            timestamp     DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "rnd_projects_venture_idx" ON "rnd_projects" ("venture_id");
CREATE INDEX IF NOT EXISTS "rnd_projects_stage_idx"   ON "rnd_projects" ("current_stage");

CREATE TABLE IF NOT EXISTS "technical_kpis" (
  "id"             serial        PRIMARY KEY,
  "venture_id"     varchar(64)   NOT NULL,
  "project_id"     integer,
  "metric_name"    varchar(256)  NOT NULL,
  "target_value"   varchar(256)  NOT NULL,
  "actual_value"   varchar(256),
  "unit"           varchar(64),
  "status"         varchar(32)   NOT NULL DEFAULT 'on_track',
  "notes"          text,
  "created_at"     timestamp     DEFAULT now() NOT NULL,
  "updated_at"     timestamp     DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "technical_kpis_venture_idx" ON "technical_kpis" ("venture_id");
CREATE INDEX IF NOT EXISTS "technical_kpis_project_idx" ON "technical_kpis" ("project_id");

CREATE TABLE IF NOT EXISTS "prototype_tests" (
  "id"                  serial        PRIMARY KEY,
  "venture_id"          varchar(64)   NOT NULL,
  "project_id"          integer,
  "prototype_version"   varchar(64)   NOT NULL,
  "test_name"           varchar(256)  NOT NULL,
  "pass_fail_status"    varchar(16)   NOT NULL DEFAULT 'pending',
  "test_date"           timestamp,
  "test_results_notes"  text,
  "evidence_id"         varchar(128),
  "evidence_url"        text,
  "created_at"          timestamp     DEFAULT now() NOT NULL,
  "updated_at"          timestamp     DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "prototype_tests_venture_idx" ON "prototype_tests" ("venture_id");
CREATE INDEX IF NOT EXISTS "prototype_tests_project_idx" ON "prototype_tests" ("project_id");
