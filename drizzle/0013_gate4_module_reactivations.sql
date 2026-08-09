-- ============================================================
-- Migration 0013 — Gate 4: Server-side Module Reactivation State
-- Replaces per-browser localStorage with a shared DB table so all
-- admins see the same module activation state regardless of device.
--
-- ventureId uses "__global__" as the sentinel for global scope
-- (avoids Postgres NULL != NULL uniqueness issue).
-- ============================================================

CREATE TABLE IF NOT EXISTS "module_reactivations" (
  "id"          serial          PRIMARY KEY,
  "group_id"    varchar(64)     NOT NULL,
  "venture_id"  varchar(64)     NOT NULL DEFAULT '__global__',
  "active"      boolean         NOT NULL DEFAULT false,
  "toggled_by"  varchar(255),
  "toggled_at"  timestamp       NOT NULL DEFAULT now(),
  "created_at"  timestamp       NOT NULL DEFAULT now(),

  CONSTRAINT "module_reactivations_group_venture_unique"
    UNIQUE ("group_id", "venture_id")
);

CREATE INDEX IF NOT EXISTS "mr_venture_idx"
  ON "module_reactivations" ("venture_id");

CREATE INDEX IF NOT EXISTS "mr_active_idx"
  ON "module_reactivations" ("active");
