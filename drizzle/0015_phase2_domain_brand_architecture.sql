-- ============================================================
-- Migration 0015: Phase 2 — Domain Brand → Venture → Product
-- Architecture (Option B — additive only, ventures table kept
-- as venture_candidates by convention; existing rows untouched)
-- ============================================================

-- ── 1. Domain Brands ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "domain_brands" (
  "id"                  SERIAL PRIMARY KEY,
  "brandCode"           VARCHAR(16)  NOT NULL UNIQUE,   -- e.g. "TONE"
  "brandName"           VARCHAR(128) NOT NULL,
  "description"         TEXT,
  "sector"              VARCHAR(128),
  "subSector"           VARCHAR(128),
  "brandThesis"         TEXT,
  "mission"             TEXT,
  "targetMarkets"       TEXT,
  "targetCustomers"     TEXT,
  "targetUsers"         TEXT,
  "coreCapabilities"    TEXT,
  "technologyDomains"   TEXT,
  "ipDomains"           TEXT,
  "commercialChannels"  TEXT,
  "legalOwner"          VARCHAR(255),
  "brandStatus"         TEXT         NOT NULL DEFAULT 'Active',
  -- lifecycle: Concept | Reserved | Active | Dormant | Retired
  "websiteUrl"          VARCHAR(512),
  "logoUrl"             VARCHAR(512),
  "createdBy"           VARCHAR(128),
  "createdAt"           TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "domain_brands_status_idx" ON "domain_brands" ("brandStatus");

-- ── 2. Extend ventures table (additive only — zero data change) ──
ALTER TABLE "ventures"
  ADD COLUMN IF NOT EXISTS "domainBrandId"          INTEGER,
  ADD COLUMN IF NOT EXISTS "entityType"             TEXT    NOT NULL DEFAULT 'venture_candidate',
  -- venture_candidate | domain_brand_proxy | unknown
  ADD COLUMN IF NOT EXISTS "candidateStatus"        TEXT             DEFAULT 'Active',
  -- Active | Hold | Killed | Rejected | Merged | Transferred | Licensed | Partnered
  -- Research_Programme | Productisation_Approved | Spin-Out_Candidate | Archived
  ADD COLUMN IF NOT EXISTS "ventureRef"             VARCHAR(32)      UNIQUE,
  -- stable generated ref: VEN-TONE-0027 | VEN-UNASSIGNED-0041
  ADD COLUMN IF NOT EXISTS "brandAssignmentStatus"  TEXT             DEFAULT 'Unassigned',
  -- Unassigned | Candidate_Brand | Confirmed_Brand | Reassignment_Under_Review | Potential_New_Domain_Brand
  ADD COLUMN IF NOT EXISTS "migrationReviewRequired" BOOLEAN         DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS "ventures_domain_brand_idx"   ON "ventures" ("domainBrandId");
CREATE INDEX IF NOT EXISTS "ventures_candidate_status_idx" ON "ventures" ("candidateStatus");
CREATE INDEX IF NOT EXISTS "ventures_entity_type_idx"    ON "ventures" ("entityType");

-- ── 3. Brand Assignment History ──────────────────────────────
CREATE TABLE IF NOT EXISTS "brand_assignment_history" (
  "id"                    SERIAL PRIMARY KEY,
  "ventureId"             VARCHAR(64)  NOT NULL REFERENCES "ventures" ("id"),
  "previousBrandId"       INTEGER,     -- nullable — first assignment has no previous
  "newBrandId"            INTEGER,     -- nullable — unassigning also recorded
  "brandAssignmentStatus" TEXT         NOT NULL,
  "reason"                TEXT,
  "supportingEvidence"    TEXT,
  "decisionMaker"         VARCHAR(128),
  "decisionDate"          TIMESTAMP,
  "createdAt"             TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "brand_assignment_history_venture_idx" ON "brand_assignment_history" ("ventureId");
CREATE INDEX IF NOT EXISTS "brand_assignment_history_brand_idx"   ON "brand_assignment_history" ("newBrandId");

-- ── 4. Brand Fit Assessments ─────────────────────────────────
CREATE TABLE IF NOT EXISTS "brand_fit_assessments" (
  "id"                        SERIAL PRIMARY KEY,
  "ventureId"                 VARCHAR(64)   NOT NULL REFERENCES "ventures" ("id"),
  "assessedBrandId"           INTEGER,
  -- fit dimensions: 0–10
  "strategicFit"              INTEGER       DEFAULT 0,
  "sectorFit"                 INTEGER       DEFAULT 0,
  "customerFit"               INTEGER       DEFAULT 0,
  "userFit"                   INTEGER       DEFAULT 0,
  "technologyFit"             INTEGER       DEFAULT 0,
  "ipFit"                     INTEGER       DEFAULT 0,
  "commercialChannelFit"      INTEGER       DEFAULT 0,
  "missionAlignment"          INTEGER       DEFAULT 0,
  "capabilityFit"             INTEGER       DEFAULT 0,
  "supplyChainFit"            INTEGER       DEFAULT 0,
  "portfolioSynergy"          INTEGER       DEFAULT 0,
  "cannibalisationRisk"       INTEGER       DEFAULT 0,
  "brandDilutionRisk"         INTEGER       DEFAULT 0,
  "crossBrandPotential"       INTEGER       DEFAULT 0,
  -- computed outputs
  "fitScore"                  DOUBLE PRECISION  DEFAULT 0,
  "confidence"                TEXT          DEFAULT 'Low',
  "recommendedBrandId"        INTEGER,
  "alternativeBrandId"        INTEGER,
  "potentialNewBrandRequired" BOOLEAN       DEFAULT FALSE,
  "governanceReviewRequired"  BOOLEAN       DEFAULT FALSE,
  "rationale"                 TEXT,
  "aiAssisted"                BOOLEAN       DEFAULT FALSE,
  "assessedBy"                VARCHAR(128),
  "assessedAt"                TIMESTAMP     NOT NULL DEFAULT NOW(),
  "createdAt"                 TIMESTAMP     NOT NULL DEFAULT NOW(),
  "updatedAt"                 TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "brand_fit_assessments_venture_idx" ON "brand_fit_assessments" ("ventureId");

-- ── 5. Productisation Decisions ──────────────────────────────
CREATE TABLE IF NOT EXISTS "productisation_decisions" (
  "id"                 SERIAL PRIMARY KEY,
  "ventureId"          VARCHAR(64)  NOT NULL REFERENCES "ventures" ("id"),
  "decision"           TEXT         NOT NULL,
  -- Approve | Hold | Reject | Return_for_Evidence | Alternative_Commercialisation_Route
  "decisionDate"       TIMESTAMP    NOT NULL,
  "decisionMaker"      VARCHAR(128),
  "evidenceSnapshot"   JSONB,   -- readiness scores (VRL/TRL/BRL/MRL/SRL) at decision point
  "readinessSnapshot"  JSONB,
  "rationale"          TEXT,
  "conditions"         TEXT,
  "approvalReference"  VARCHAR(128),
  "createdAt"          TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "productisation_decisions_venture_idx"  ON "productisation_decisions" ("ventureId");
CREATE INDEX IF NOT EXISTS "productisation_decisions_decision_idx" ON "productisation_decisions" ("decision");

-- ── 6. Product Programmes ────────────────────────────────────
-- One venture → many product programmes (1:N enforced here)
CREATE TABLE IF NOT EXISTS "product_programmes" (
  "id"                        SERIAL PRIMARY KEY,
  "programmeRef"              VARCHAR(32)  NOT NULL UNIQUE, -- e.g. PRG-TONE-0008
  "ventureId"                 VARCHAR(64)  NOT NULL REFERENCES "ventures" ("id"),
  "domainBrandId"             INTEGER      REFERENCES "domain_brands" ("id"),
  "productisationDecisionId"  INTEGER      REFERENCES "productisation_decisions" ("id"),
  "programmeName"             VARCHAR(255) NOT NULL,
  "description"               TEXT,
  "programmeOwner"            VARCHAR(128),
  "approvalDate"              TIMESTAMP,
  "technicalStrategy"         TEXT,
  "commercialStrategy"        TEXT,
  "currentOwnerEntity"        VARCHAR(255),
  "originatingEntity"         VARCHAR(255),
  "programmeStatus"           TEXT         NOT NULL DEFAULT 'Approved',
  -- Approved | Concept_Development | Prototype_Development | Engineering_Development
  -- Pre-Production | Launch_Preparation | Active | Paused | Cancelled | Transferred | Retired
  "createdAt"                 TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updatedAt"                 TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "product_programmes_venture_idx"      ON "product_programmes" ("ventureId");
CREATE INDEX IF NOT EXISTS "product_programmes_brand_idx"        ON "product_programmes" ("domainBrandId");
CREATE INDEX IF NOT EXISTS "product_programmes_status_idx"       ON "product_programmes" ("programmeStatus");

-- ── 7. Product Families ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "product_families" (
  "id"                 SERIAL PRIMARY KEY,
  "familyCode"         VARCHAR(16)  NOT NULL, -- e.g. BAP
  "familyName"         VARCHAR(255) NOT NULL,
  "productProgrammeId" INTEGER      NOT NULL REFERENCES "product_programmes" ("id"),
  "domainBrandId"      INTEGER      REFERENCES "domain_brands" ("id"),
  "description"        TEXT,
  "productCategory"    VARCHAR(128),
  "customerSegment"    VARCHAR(255),
  "technicalPlatform"  TEXT,
  "status"             TEXT         NOT NULL DEFAULT 'Active',
  "createdAt"          TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updatedAt"          TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT "product_families_code_programme_unique" UNIQUE ("familyCode", "productProgrammeId")
);

CREATE INDEX IF NOT EXISTS "product_families_programme_idx" ON "product_families" ("productProgrammeId");
CREATE INDEX IF NOT EXISTS "product_families_brand_idx"     ON "product_families" ("domainBrandId");

-- ── 8. Products ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "products" (
  "id"                  SERIAL PRIMARY KEY,
  "productRef"          VARCHAR(32)  NOT NULL UNIQUE, -- e.g. PROD-TONE-0012
  "productCode"         VARCHAR(64),
  "productName"         VARCHAR(255) NOT NULL,
  "commercialName"      VARCHAR(255),
  "productFamilyId"     INTEGER      NOT NULL REFERENCES "product_families" ("id"),
  "productProgrammeId"  INTEGER      REFERENCES "product_programmes" ("id"),
  "domainBrandId"       INTEGER      REFERENCES "domain_brands" ("id"),
  "description"         TEXT,
  "productType"         TEXT         NOT NULL DEFAULT 'physical',
  -- physical | digital | software | service | platform_service | licensing | data_product | ai_agent | hybrid
  "technicalDescription" TEXT,
  "lifecycleStatus"     TEXT         NOT NULL DEFAULT 'Concept',
  -- Concept | Prototype | Engineering | Validation | Pre-Production | Released | Active | End-of-Life | Archived
  "releaseStatus"       TEXT                  DEFAULT 'Unreleased',
  "productOwner"        VARCHAR(128),
  "currentOwnerEntity"  VARCHAR(255),
  "originatingEntity"   VARCHAR(255),
  "createdAt"           TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "products_family_idx"     ON "products" ("productFamilyId");
CREATE INDEX IF NOT EXISTS "products_programme_idx"  ON "products" ("productProgrammeId");
CREATE INDEX IF NOT EXISTS "products_brand_idx"      ON "products" ("domainBrandId");
CREATE INDEX IF NOT EXISTS "products_lifecycle_idx"  ON "products" ("lifecycleStatus");

-- ── 9. Product Variants ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "product_variants" (
  "id"                    SERIAL PRIMARY KEY,
  "variantCode"           VARCHAR(32),
  "productId"             INTEGER      NOT NULL REFERENCES "products" ("id"),
  "variantName"           VARCHAR(255) NOT NULL,
  "description"           TEXT,
  -- Physical attributes — nullable for digital / service products
  "material"              VARCHAR(255),
  "dimensions"            VARCHAR(255),
  "weight"                VARCHAR(64),
  "finish"                VARCHAR(128),
  "performanceClass"      VARCHAR(128),
  "manufacturingLocation" VARCHAR(255),
  "supplier"              VARCHAR(255),
  "releaseRevision"       VARCHAR(8)   DEFAULT 'A',
  -- Extended attributes as JSON for non-hardware flexibility
  "technicalAttributes"   JSONB,
  "status"                TEXT         NOT NULL DEFAULT 'Active',
  "createdAt"             TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "product_variants_product_idx" ON "product_variants" ("productId");

-- ── 10. Part Number Configs ──────────────────────────────────
-- Configurable numbering rules per product family — format is not hard-coded
CREATE TABLE IF NOT EXISTS "part_number_configs" (
  "id"               SERIAL PRIMARY KEY,
  "productFamilyId"  INTEGER      NOT NULL UNIQUE REFERENCES "product_families" ("id"),
  "formatTemplate"   VARCHAR(128) NOT NULL DEFAULT '{BRAND}-{FAMILY}-{SEQ}',
  "brandCode"        VARCHAR(16)  NOT NULL,
  "familyCode"       VARCHAR(16)  NOT NULL,
  "sequenceLength"   INTEGER      NOT NULL DEFAULT 4, -- zero-padded
  "currentSequence"  INTEGER      NOT NULL DEFAULT 0,
  "prefix"           VARCHAR(32),
  "notes"            TEXT,
  "createdAt"        TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── 11. Part Numbers ─────────────────────────────────────────
-- UNIQUE constraint at DB level prevents collisions (§55 collision test)
CREATE TABLE IF NOT EXISTS "part_numbers" (
  "id"               SERIAL PRIMARY KEY,
  "partNumber"       VARCHAR(64)  NOT NULL UNIQUE, -- e.g. TONE-BAP-0001
  "productId"        INTEGER      REFERENCES "products" ("id"),
  "productVariantId" INTEGER      REFERENCES "product_variants" ("id"),
  "configId"         INTEGER      REFERENCES "part_number_configs" ("id"),
  "status"           TEXT         NOT NULL DEFAULT 'active',
  -- active | superseded | obsolete | retired
  "currentRevision"  VARCHAR(8)   NOT NULL DEFAULT 'A',
  "issuedBy"         VARCHAR(128),
  "issuedAt"         TIMESTAMP    NOT NULL DEFAULT NOW(),
  "retiredAt"        TIMESTAMP,
  "retiredBy"        VARCHAR(128),
  "retiredReason"    TEXT,
  "notes"            TEXT,
  "createdAt"        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "part_numbers_product_idx"  ON "part_numbers" ("productId");
CREATE INDEX IF NOT EXISTS "part_numbers_variant_idx"  ON "part_numbers" ("productVariantId");
CREATE INDEX IF NOT EXISTS "part_numbers_status_idx"   ON "part_numbers" ("status");

-- ── 12. Part Number Revisions ────────────────────────────────
-- Full revision history; revisions are immutable — new row per change
-- DB unique constraint prevents duplicate revision letters per part number
CREATE TABLE IF NOT EXISTS "part_number_revisions" (
  "id"                   SERIAL PRIMARY KEY,
  "partNumberId"         INTEGER      NOT NULL REFERENCES "part_numbers" ("id"),
  "revision"             VARCHAR(8)   NOT NULL,   -- A, B, C …
  "changeDescription"    TEXT,
  "changedBy"            VARCHAR(128),
  "changedAt"            TIMESTAMP    NOT NULL DEFAULT NOW(),
  "snapshotJson"         JSONB,  -- variant attribute snapshot at this revision
  "supersededByRevision" VARCHAR(8),
  "createdAt"            TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT "part_number_revisions_unique" UNIQUE ("partNumberId", "revision")
);

CREATE INDEX IF NOT EXISTS "part_number_revisions_pn_idx" ON "part_number_revisions" ("partNumberId");

-- ── 13. Venture Reference Sequence ──────────────────────────
-- Global counter per brand_code prefix for generating VEN-XXXX-NNNN refs
CREATE TABLE IF NOT EXISTS "venture_ref_sequences" (
  "id"              SERIAL PRIMARY KEY,
  "prefixKey"       VARCHAR(32)  NOT NULL UNIQUE,  -- e.g. "TONE" | "UNASSIGNED"
  "currentSequence" INTEGER      NOT NULL DEFAULT 0,
  "updatedAt"       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── 14. Programme Reference Sequence ────────────────────────
CREATE TABLE IF NOT EXISTS "programme_ref_sequences" (
  "id"              SERIAL PRIMARY KEY,
  "prefixKey"       VARCHAR(32)  NOT NULL UNIQUE,  -- e.g. "TONE"
  "currentSequence" INTEGER      NOT NULL DEFAULT 0,
  "updatedAt"       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── 15. Product Reference Sequence ──────────────────────────
CREATE TABLE IF NOT EXISTS "product_ref_sequences" (
  "id"              SERIAL PRIMARY KEY,
  "prefixKey"       VARCHAR(32)  NOT NULL UNIQUE,  -- e.g. "TONE"
  "currentSequence" INTEGER      NOT NULL DEFAULT 0,
  "updatedAt"       TIMESTAMP    NOT NULL DEFAULT NOW()
);
