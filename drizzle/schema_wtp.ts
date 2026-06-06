// ============================================================================
// WTP ASSESSMENT — Commercial validation tables (Module C: Discovery & Market)
// New wtp_-prefixed tables for customer commitments, pricing experiments,
// budget-owner validation, and procurement pathways. These reuse the existing
// ventures / problem_hypotheses / customer_segments / market_risks / cc_alerts
// tables (do NOT duplicate them). Enum-like text columns are constrained at the
// API layer via z.enum (see shared/wtp.ts).
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

// -- Customer Commitment Log ---------------------------------------------------
// One commitment per row, linked to a WTP test. Climbs from verbal interest to
// purchase order. status grades the strength (weak..confirmed|withdrawn).
export const wtpCommitments = pgTable("wtp_commitments", {
  id:                    serial("id").primaryKey(),
  ventureId:             varchar("ventureId", { length: 64 }).notNull(),
  wtpTestId:             integer("wtpTestId"),
  commitmentType:        text("commitmentType").default("verbal_interest").notNull(),
  commitmentDescription: text("commitmentDescription"),
  commitmentValue:       varchar("commitmentValue", { length: 255 }),
  commitmentCurrency:    varchar("commitmentCurrency", { length: 8 }).default("GBP"),
  commitmentDate:        varchar("commitmentDate", { length: 32 }),
  evidenceReference:     text("evidenceReference"),
  status:                text("status").default("weak").notNull(), // weak|moderate|strong|confirmed|withdrawn
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type WtpCommitment = typeof wtpCommitments.$inferSelect;
export type InsertWtpCommitment = typeof wtpCommitments.$inferInsert;

// -- Pricing Experiments -------------------------------------------------------
// A structured price test with sample size and response counts; conversionRate
// is the computed 0-100 value (positive / sample).
export const pricingExperiments = pgTable("pricing_experiments", {
  id:                    serial("id").primaryKey(),
  ventureId:             varchar("ventureId", { length: 64 }).notNull(),
  hypothesisId:          integer("hypothesisId"),
  pricingModel:          text("pricingModel").default("subscription").notNull(),
  pricePoint:            varchar("pricePoint", { length: 255 }),
  currency:              varchar("currency", { length: 8 }).default("GBP"),
  billingPeriod:         varchar("billingPeriod", { length: 32 }),
  targetCustomerSegment: varchar("targetCustomerSegment", { length: 255 }),
  valueMetric:           text("valueMetric"),
  testMethod:            text("testMethod").default("pricing_interview"),
  testSampleSize:        integer("testSampleSize").default(0),
  positiveResponses:     integer("positiveResponses").default(0),
  negativeResponses:     integer("negativeResponses").default(0),
  conversionRate:        integer("conversionRate").default(0), // 0-100 computed
  learningSummary:       text("learningSummary"),
  recommendedPriceRange: varchar("recommendedPriceRange", { length: 255 }),
  recommendedNextTest:   text("recommendedNextTest"),
  status:                text("status").default("proposed").notNull(), // proposed|running|completed|inconclusive|invalidated
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type PricingExperiment = typeof pricingExperiments.$inferSelect;
export type InsertPricingExperiment = typeof pricingExperiments.$inferInsert;

// -- Budget Owner Validation ---------------------------------------------------
export const budgetValidations = pgTable("budget_validations", {
  id:                       serial("id").primaryKey(),
  ventureId:                varchar("ventureId", { length: 64 }).notNull(),
  wtpTestId:                integer("wtpTestId"),
  organisation:             varchar("organisation", { length: 255 }),
  budgetOwnerKnown:         boolean("budgetOwnerKnown").default(false),
  budgetOwnerRole:          varchar("budgetOwnerRole", { length: 255 }),
  budgetCategory:           text("budgetCategory"),
  budgetCycle:              varchar("budgetCycle", { length: 128 }),
  currentBudgetAvailable:   varchar("currentBudgetAvailable", { length: 255 }),
  estimatedBudgetRange:     varchar("estimatedBudgetRange", { length: 255 }),
  approvalRequired:         boolean("approvalRequired").default(false),
  approvalStakeholders:     text("approvalStakeholders"),
  financialDecisionCriteria: text("financialDecisionCriteria"),
  notes:                    text("notes"),
  validationStatus:         text("validationStatus").default("unknown").notNull(), // unknown|partially_validated|validated|blocked|invalidated
  createdAt:                timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                timestamp("updatedAt").defaultNow().notNull(),
});
export type BudgetValidation = typeof budgetValidations.$inferSelect;
export type InsertBudgetValidation = typeof budgetValidations.$inferInsert;

// -- Procurement Pathways ------------------------------------------------------
export const procurementPathways = pgTable("procurement_pathways", {
  id:                          serial("id").primaryKey(),
  ventureId:                   varchar("ventureId", { length: 64 }).notNull(),
  wtpTestId:                   integer("wtpTestId"),
  organisation:                varchar("organisation", { length: 255 }),
  procurementRoute:            text("procurementRoute").default("unknown").notNull(), // direct_purchase|innovation_pilot|...
  procurementComplexityScore:  integer("procurementComplexityScore").default(1),       // 1-5
  expectedSalesCycleDays:      integer("expectedSalesCycleDays").default(0),
  requiredDocuments:           text("requiredDocuments"),
  complianceRequirements:      text("complianceRequirements"),
  legalReviewRequired:         boolean("legalReviewRequired").default(false),
  dataSecurityReviewRequired:  boolean("dataSecurityReviewRequired").default(false),
  pilotPossibleWithoutFullProcurement: boolean("pilotPossibleWithoutFullProcurement").default(false),
  procurementRisks:            text("procurementRisks"),
  nextProcurementStep:         text("nextProcurementStep"),
  status:                      text("status").default("unknown").notNull(), // unknown|mapped|blocked|feasible|high_friction|validated
  createdAt:                   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                   timestamp("updatedAt").defaultNow().notNull(),
});
export type ProcurementPathway = typeof procurementPathways.$inferSelect;
export type InsertProcurementPathway = typeof procurementPathways.$inferInsert;
