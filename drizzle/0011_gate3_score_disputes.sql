-- ============================================================
-- Migration 0011 — Gate 3: Score Dispute & Escalation Workflow
-- FHV-EB-AUD-001 v1.0 — Independent Verifier Governance
-- ============================================================

-- score_disputes: one row per dimension dispute raised against a VRL assessment.
-- Status machine: UNDER_DISPUTE → RESOLVED_UPHELD | RESOLVED_OVERTURNED
-- Constraints enforced at application layer (not DB-level) per Gate 3 spec:
--   1. explanation is mandatory (non-empty enforced by tRPC schema)
--   2. Resolution requires SCORING_INTEGRITY_REVIEWER or admin role
--   3. Assessment submitter cannot resolve their own dispute (builder–verifier sep)

CREATE TABLE IF NOT EXISTS score_disputes (
  id             VARCHAR(64)  PRIMARY KEY,
  assessment_id  VARCHAR(64)  NOT NULL,
  venture_id     VARCHAR(64)  NOT NULL,
  dimension_key  VARCHAR(32)  NOT NULL,
  raised_by      VARCHAR(256) NOT NULL,
  raised_by_id   VARCHAR(64)  NOT NULL,
  explanation    TEXT         NOT NULL,
  evidence_url   TEXT,
  status         VARCHAR(32)  NOT NULL DEFAULT 'UNDER_DISPUTE',
  resolved_by    VARCHAR(256),
  resolved_by_id VARCHAR(64),
  resolved_at    TIMESTAMP,
  resolved_note  TEXT,
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by assessment (used in resolveDispute + getDisputeStatus)
CREATE INDEX IF NOT EXISTS idx_score_disputes_assessment ON score_disputes (assessment_id);
-- Index for fast lookup by venture (used in listDisputes)
CREATE INDEX IF NOT EXISTS idx_score_disputes_venture ON score_disputes (venture_id);
-- Index for open disputes (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_score_disputes_status ON score_disputes (status) WHERE status = 'UNDER_DISPUTE';
