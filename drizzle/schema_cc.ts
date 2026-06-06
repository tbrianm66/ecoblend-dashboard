// ============================================================================
// COMMAND CENTRE — Lean Startup decision cockpit (Module 1)
// New cc_ tables aggregating hypotheses, experiments, evidence, decisions,
// pivots, stage-gate reviews and alerts across all portfolio ventures.
// Distinct from the thin Discovery `lean_experiments` table (do not collide).
// ============================================================================
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// -- Venture Hypotheses --------------------------------------------------------
// One testable assumption per row. hypothesisType / status / assumptionRiskLevel
// are constrained at the API layer via z.enum (see shared/commandCentre.ts).
export const ccHypotheses = pgTable("cc_hypotheses", {
  id:                  serial("id").primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  moduleSource:        varchar("moduleSource", { length: 64 }),
  hypothesisType:      text("hypothesisType").default("problem").notNull(),
  hypothesisStatement: text("hypothesisStatement").notNull(),
  assumptionRiskLevel: text("assumptionRiskLevel").default("medium"),  // low|medium|high|critical
  status:              text("status").default("untested").notNull(),
  confidenceScore:     integer("confidenceScore").default(0),          // 0-100
  evidenceSummary:     text("evidenceSummary"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().notNull(),
});
export type CcHypothesis = typeof ccHypotheses.$inferSelect;
export type InsertCcHypothesis = typeof ccHypotheses.$inferInsert;

// -- Lean Experiments (Command Centre) -----------------------------------------
export const ccExperiments = pgTable("cc_experiments", {
  id:                     serial("id").primaryKey(),
  ventureId:              varchar("ventureId", { length: 64 }).notNull(),
  hypothesisId:           integer("hypothesisId"),
  experimentName:         varchar("experimentName", { length: 255 }).notNull(),
  experimentType:         text("experimentType").default("customer_interview"),
  moduleSource:           varchar("moduleSource", { length: 64 }),
  experimentOwner:        varchar("experimentOwner", { length: 255 }),
  experimentStatus:       text("experimentStatus").default("proposed").notNull(),
  method:                 text("method"),
  successThreshold:       text("successThreshold"),
  startDate:              varchar("startDate", { length: 32 }),
  dueDate:                varchar("dueDate", { length: 32 }),
  result:                 text("result"),
  learningSummary:        text("learningSummary"),
  decisionRecommendation: text("decisionRecommendation"),
  nextStep:               text("nextStep"),
  createdAt:              timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type CcExperiment = typeof ccExperiments.$inferSelect;
export type InsertCcExperiment = typeof ccExperiments.$inferInsert;

// -- Evidence Records ----------------------------------------------------------
// Scores are captured 1-5; evidenceConfidenceScore is the computed 0-100 value.
export const ccEvidence = pgTable("cc_evidence", {
  id:                      serial("id").primaryKey(),
  ventureId:               varchar("ventureId", { length: 64 }).notNull(),
  hypothesisId:            integer("hypothesisId"),
  experimentId:            integer("experimentId"),
  moduleSource:            varchar("moduleSource", { length: 64 }),
  evidenceType:            text("evidenceType").default("interview"),
  evidenceTitle:           varchar("evidenceTitle", { length: 255 }).notNull(),
  evidenceSummary:         text("evidenceSummary"),
  evidenceStrengthScore:   integer("evidenceStrengthScore").default(1),   // 1-5
  evidenceRelevanceScore:  integer("evidenceRelevanceScore").default(1),  // 1-5
  evidenceRecencyScore:    integer("evidenceRecencyScore").default(1),    // 1-5
  evidenceConfidenceScore: integer("evidenceConfidenceScore").default(0), // 0-100 computed
  contradictsHypothesis:   boolean("contradictsHypothesis").default(false),
  sourceReference:         text("sourceReference"),
  createdAt:               timestamp("createdAt").defaultNow().notNull(),
  updatedAt:               timestamp("updatedAt").defaultNow().notNull(),
});
export type CcEvidence = typeof ccEvidence.$inferSelect;
export type InsertCcEvidence = typeof ccEvidence.$inferInsert;

// -- Lean Decisions ------------------------------------------------------------
export const ccDecisions = pgTable("cc_decisions", {
  id:                      serial("id").primaryKey(),
  ventureId:               varchar("ventureId", { length: 64 }).notNull(),
  decisionType:            text("decisionType").default("persevere"),
  decisionTitle:           varchar("decisionTitle", { length: 255 }).notNull(),
  decisionSummary:         text("decisionSummary"),
  evidenceConfidenceScore: integer("evidenceConfidenceScore").default(0),
  riskScore:               integer("riskScore").default(0),
  recommendedAction:       text("recommendedAction"),
  decisionStatus:          text("decisionStatus").default("recommended").notNull(),
  reviewerNotes:           text("reviewerNotes"),
  approvedBy:              varchar("approvedBy", { length: 255 }),
  decisionDate:            varchar("decisionDate", { length: 32 }),
  nextReviewDate:          varchar("nextReviewDate", { length: 32 }),
  createdAt:               timestamp("createdAt").defaultNow().notNull(),
  updatedAt:               timestamp("updatedAt").defaultNow().notNull(),
});
export type CcDecision = typeof ccDecisions.$inferSelect;
export type InsertCcDecision = typeof ccDecisions.$inferInsert;

// -- Pivot Logs ----------------------------------------------------------------
export const ccPivotLogs = pgTable("cc_pivot_logs", {
  id:                  serial("id").primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  previousHypothesis:  text("previousHypothesis"),
  newHypothesis:       text("newHypothesis"),
  pivotType:           text("pivotType").default("problem"),
  reasonForPivot:      text("reasonForPivot"),
  evidenceTrigger:     text("evidenceTrigger"),
  decisionId:          integer("decisionId"),
  hypothesisId:        integer("hypothesisId"),
  dateLogged:          varchar("dateLogged", { length: 32 }),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().notNull(),
});
export type CcPivotLog = typeof ccPivotLogs.$inferSelect;
export type InsertCcPivotLog = typeof ccPivotLogs.$inferInsert;

// -- Stage-Gate Reviews --------------------------------------------------------
export const ccStageGateReviews = pgTable("cc_stage_gate_reviews", {
  id:                       serial("id").primaryKey(),
  ventureId:                varchar("ventureId", { length: 64 }).notNull(),
  fromStage:                text("fromStage"),
  toStage:                  text("toStage"),
  reviewStatus:             text("reviewStatus").default("not_started").notNull(),
  evidenceScore:            integer("evidenceScore").default(0),
  marketScore:              integer("marketScore").default(0),
  commercialScore:          integer("commercialScore").default(0),
  technicalScore:           integer("technicalScore").default(0),
  operationalScore:         integer("operationalScore").default(0),
  riskScore:                integer("riskScore").default(0),
  investmentReadinessScore: integer("investmentReadinessScore").default(0),
  reviewerNotes:            text("reviewerNotes"),
  approvalDecision:         text("approvalDecision"),
  requiredActions:          text("requiredActions"),
  reviewDate:               varchar("reviewDate", { length: 32 }),
  nextReviewDate:           varchar("nextReviewDate", { length: 32 }),
  // -- Lean Startup Workflow gate-type + human review enforcement ---------------
  // gateType identifies which stage transition this review covers. The
  // WorkflowStateService.canAdvanceStage() checks that a matching gate with
  // approvalDecision='approved' AND humanReviewedAt IS NOT NULL exists before
  // allowing progression past any gate stage.
  gateType:             text("gateType"),          // problem_validated|wtp_validated|mvp_evidence_strong|investment_ready
  humanReviewRequired:  boolean("humanReviewRequired").default(true),
  humanReviewedBy:      varchar("humanReviewedBy", { length: 255 }),
  humanReviewedAt:      timestamp("humanReviewedAt"),
  createdAt:                timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                timestamp("updatedAt").defaultNow().notNull(),
});
export type CcStageGateReview = typeof ccStageGateReviews.$inferSelect;
export type InsertCcStageGateReview = typeof ccStageGateReviews.$inferInsert;

// -- Command Alerts ------------------------------------------------------------
export const ccAlerts = pgTable("cc_alerts", {
  id:                serial("id").primaryKey(),
  ventureId:         varchar("ventureId", { length: 64 }).notNull(),
  alertType:         text("alertType").default("weak_evidence"),
  alertTitle:        varchar("alertTitle", { length: 255 }).notNull(),
  alertDescription:  text("alertDescription"),
  severity:          text("severity").default("medium").notNull(),
  linkedModule:      varchar("linkedModule", { length: 64 }),
  linkedRecordId:    integer("linkedRecordId"),
  recommendedAction: text("recommendedAction"),
  status:            text("status").default("open").notNull(),
  owner:             varchar("owner", { length: 255 }),
  dueDate:           varchar("dueDate", { length: 32 }),
  autoGenerated:     boolean("autoGenerated").default(false),
  dedupeKey:         varchar("dedupeKey", { length: 255 }),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
  updatedAt:         timestamp("updatedAt").defaultNow().notNull(),
});
export type CcAlert = typeof ccAlerts.$inferSelect;
export type InsertCcAlert = typeof ccAlerts.$inferInsert;
