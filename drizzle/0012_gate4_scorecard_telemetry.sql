-- ============================================================
-- Migration 0012 — Gate 4: Scorecard Kill-Criteria Alert Log
-- FHV-EB-AUD-001 §4 — Actionable Metric Scorecard Telemetry
-- ============================================================

CREATE TABLE IF NOT EXISTS "scorecard_kill_alerts" (
  "id"                   varchar(64)   PRIMARY KEY,
  "hypothesis_id"        varchar(4)    NOT NULL,
  "hypothesis_name"      varchar(128)  NOT NULL,
  "breach_detail"        text          NOT NULL,
  "metric_at_breach"     varchar(64),
  "kill_criterion"       text          NOT NULL,
  "sample_size_at_breach" integer      DEFAULT 0,
  "resolved"             boolean       NOT NULL DEFAULT false,
  "resolved_by"          varchar(256),
  "resolved_at"          timestamp,
  "resolved_note"        text,
  "created_at"           timestamp     DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ska_hypothesis_idx"
  ON "scorecard_kill_alerts" ("hypothesis_id");

CREATE INDEX IF NOT EXISTS "ska_resolved_idx"
  ON "scorecard_kill_alerts" ("resolved");
