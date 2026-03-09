import {
  boolean,
  float,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Ventures ──────────────────────────────────────────────────────────────────
export const ventures = mysqlTable("ventures", {
  id: varchar("id", { length: 64 }).primaryKey(), // e.g. "ecoblend", "tone"
  name: varchar("name", { length: 128 }).notNull(),
  tagline: text("tagline"),
  sector: varchar("sector", { length: 128 }),
  channel: mysqlEnum("channel", ["B2B", "D2C", "B2B2C"]).default("B2B"),
  status: mysqlEnum("status", ["Active", "Pre-Launch", "Scaling", "Paused"]).default("Pre-Launch"),
  vrl: int("vrl").default(1).notNull(),           // 1–4
  vrlPercent: int("vrlPercent").default(0),        // % through current VRL stage
  trl: int("trl").default(1).notNull(),            // 1–9
  trlPercent: int("trlPercent").default(0),        // % through current TRL level
  nominatedCharity: varchar("nominatedCharity", { length: 255 }),
  charityFocus: text("charityFocus"),
  founder: varchar("founder", { length: 255 }),
  color: varchar("color", { length: 32 }).default("#51AF37"),
  investmentReady: boolean("investmentReady").default(false),
  isInternalLab: boolean("isInternalLab").default(false),
  description: text("description"),
  bmc: text("bmc"),
  mmc: text("mmc"),
  lifecycleStage: mysqlEnum("lifecycleStage", ["Opportunity", "Validation", "Build", "Launch", "Scale"]).default("Opportunity"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Venture = typeof ventures.$inferSelect;
export type InsertVenture = typeof ventures.$inferInsert;

// ── Milestones ────────────────────────────────────────────────────────────────
export const milestones = mysqlTable("milestones", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  completed: boolean("completed").default(false),
  targetDate: varchar("targetDate", { length: 32 }),
  completedAt: timestamp("completedAt"),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = typeof milestones.$inferInsert;

// ── Risks ─────────────────────────────────────────────────────────────────────
export const risks = mysqlTable("risks", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  domain: varchar("domain", { length: 64 }).notNull(),
  level: mysqlEnum("level", ["Low", "Medium", "High"]).default("Medium"),
  mitigation: text("mitigation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Risk = typeof risks.$inferSelect;
export type InsertRisk = typeof risks.$inferInsert;

// ── Venture Scores (history) ──────────────────────────────────────────────────
export const ventureScores = mysqlTable("venture_scores", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  vrl: int("vrl").notNull(),
  vrlPercent: int("vrlPercent").notNull(),
  trl: int("trl").notNull(),
  trlPercent: int("trlPercent").notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  notes: text("notes"),
});

export type VentureScore = typeof ventureScores.$inferSelect;
export type InsertVentureScore = typeof ventureScores.$inferInsert;

// ── Founders ──────────────────────────────────────────────────────────────────
export const founders = mysqlTable("founders", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  role: varchar("role", { length: 128 }),
  background: text("background"),
  domainExpertiseScore: int("domainExpertiseScore").default(0), // 0–10
  experienceScore: int("experienceScore").default(0),           // 0–10
  commitmentScore: int("commitmentScore").default(0),           // 0–10
  equityPct: float("equityPct").default(0),
  esopAllocated: boolean("esopAllocated").default(false),
  linkedIn: varchar("linkedIn", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Founder = typeof founders.$inferSelect;
export type InsertFounder = typeof founders.$inferInsert;

// ── Opportunities (pipeline) ──────────────────────────────────────────────────
export const opportunities = mysqlTable("opportunities", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  problemStatement: text("problemStatement"),
  sector: varchar("sector", { length: 128 }),
  marketSizeScore: int("marketSizeScore").default(0),     // 0–10
  strategicFitScore: int("strategicFitScore").default(0), // 0–10
  esgAlignmentScore: int("esgAlignmentScore").default(0), // 0–10
  founderAvailScore: int("founderAvailScore").default(0), // 0–10
  totalScore: int("totalScore").default(0),               // computed sum
  status: mysqlEnum("status", ["Identified", "Scoring", "Approved", "Rejected", "Converted"]).default("Identified"),
  convertedToVentureId: varchar("convertedToVentureId", { length: 64 }),
  submittedBy: varchar("submittedBy", { length: 128 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = typeof opportunities.$inferInsert;

// ── Experiments (TRL evidence log) ───────────────────────────────────────────
export const experiments = mysqlTable("experiments", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  hypothesis: text("hypothesis"),
  method: text("method"),
  result: text("result"),
  outcome: mysqlEnum("outcome", ["Pass", "Fail", "Inconclusive", "Pending"]).default("Pending"),
  trlLevelJustified: int("trlLevelJustified"),  // TRL level this experiment supports
  conductedAt: timestamp("conductedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Experiment = typeof experiments.$inferSelect;
export type InsertExperiment = typeof experiments.$inferInsert;

// ── Customer Interviews ───────────────────────────────────────────────────────
export const interviews = mysqlTable("interviews", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  intervieweeName: varchar("intervieweeName", { length: 128 }),
  intervieweeRole: varchar("intervieweeRole", { length: 128 }),
  intervieweeOrg: varchar("intervieweeOrg", { length: 128 }),
  date: varchar("date", { length: 32 }),
  channel: mysqlEnum("channel", ["In-Person", "Video", "Phone", "Survey"]).default("Video"),
  keyInsights: text("keyInsights"),
  painPoints: text("painPoints"),
  validationSignals: text("validationSignals"),
  aiSummary: text("aiSummary"),          // populated by LLM summarisation
  rawTranscript: text("rawTranscript"),  // optional paste of full transcript
  vrlStageRelevant: int("vrlStageRelevant"), // which VRL stage this validates
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = typeof interviews.$inferInsert;

// ── Financial Snapshots ───────────────────────────────────────────────────────
export const financialSnapshots = mysqlTable("financial_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // "2026-03"
  revenueActual: int("revenueActual").default(0),
  revenueTarget: int("revenueTarget").default(0),
  monthlyBurn: int("monthlyBurn").default(0),
  cashRunway: int("cashRunway").default(0),         // months
  investmentRaised: int("investmentRaised").default(0),
  investmentTarget: int("investmentTarget").default(0),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FinancialSnapshot = typeof financialSnapshots.$inferSelect;
export type InsertFinancialSnapshot = typeof financialSnapshots.$inferInsert;

// ── Contract Documents ────────────────────────────────────────────────────────
export const contractDocuments = mysqlTable("contract_documents", {
  id: int("id").autoincrement().primaryKey(),
  contractId: varchar("contractId", { length: 64 }).notNull(),
  contractTitle: varchar("contractTitle", { length: 255 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  fileSizeBytes: int("fileSizeBytes").notNull(),
  uploadedBy: varchar("uploadedBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContractDocument = typeof contractDocuments.$inferSelect;
export type InsertContractDocument = typeof contractDocuments.$inferInsert;
