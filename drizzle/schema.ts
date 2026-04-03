import {
  bigint,
  boolean,
  date,
  decimal,
  float,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  tinyint,
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
  // ── Literature Audit: Innovator's Dilemma — Rec. 5 ──────────────────────────
  // Classifies each venture as sustaining or disruptive per Christensen's framework
  strategicClassification: mysqlEnum("strategicClassification", [
    "Sustaining",           // Improves performance on dimensions valued by current customers
    "Disruptive-NewMarket", // Creates new market by targeting non-consumers
    "Disruptive-LowEnd",    // Targets overserved customers with simpler/cheaper offering
  ]).default("Sustaining"),
  // ── Literature Audit: Lean Startup — Rec. 7 ─────────────────────────────────
  // Identifies which self-reinforcing growth mechanism the venture is pursuing
  engineOfGrowth: mysqlEnum("engineOfGrowth", [
    "Sticky",  // Retention-driven; primary metric: churn rate
    "Viral",   // Referral-driven; primary metric: viral coefficient
    "Paid",    // Acquisition-driven; primary metric: LTV/CAC ratio
  ]),
  // ── Literature Audit: Lean Startup — Rec. 8 ─────────────────────────────────
  // Product/market fit signal: whether the engine of growth is self-sustaining
  productMarketFitSignal: mysqlEnum("productMarketFitSignal", [
    "Not Yet",    // Engine not yet identified or not self-sustaining
    "Emerging",   // Early positive signals but not yet reliable
    "Achieved",   // Engine is reliably self-sustaining
  ]).default("Not Yet"),
  // ── Literature Audit: Lean Startup — Rec. 3 (Innovation Accounting) ─────────
  // Cached innovation accounting metrics (recomputed from experiments/interviews)
  experimentPassRate: float("experimentPassRate"),    // passing / completed experiments (%)
  learningVelocity: int("learningVelocity"),           // validated learning cycles last 30 days
  interviewInsightRate: float("interviewInsightRate"), // interviews with validated signal (%)
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
  offeringId: varchar("offeringId", { length: 36 }),
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
  offeringId: varchar("offeringId", { length: 36 }),
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
  offeringId: varchar("offeringId", { length: 36 }),
  conductedAt: timestamp("conductedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Experiment = typeof experiments.$inferSelect;;
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
  // ── Literature Audit: Lean Startup — Rec. 7 & 9 (Engine of Growth + Innovation Accounting) ──
  // Sticky engine metrics
  churnRate: float("churnRate"),              // % of customers lost per month
  retentionRate: float("retentionRate"),       // % of customers retained per month
  // Viral engine metrics
  viralCoefficient: float("viralCoefficient"), // avg new users each existing user generates
  referralRate: float("referralRate"),          // % of customers who refer others
  // Paid engine metrics
  customerAcquisitionCost: int("customerAcquisitionCost"), // CAC in currency units
  customerLifetimeValue: int("customerLifetimeValue"),     // LTV in currency units
  ltvCacRatio: float("ltvCacRatio"),           // LTV / CAC ratio (target >= 3)
  // Innovation accounting baseline (Rec. 9)
  baselineRevenueTarget: int("baselineRevenueTarget"), // MVP-stage revenue model target
  isBaseline: boolean("isBaseline").default(false),    // marks the initial MVP baseline snapshot
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

// ── Research Papers ───────────────────────────────────────────────────────────
export const researchPapers = mysqlTable("research_papers", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  authors: text("authors").notNull(),               // comma-separated author names
  journal: varchar("journal", { length: 255 }),
  year: int("year"),
  doi: varchar("doi", { length: 255 }),
  url: text("url"),
  abstract: text("abstract"),
  keywords: text("keywords"),                        // comma-separated
  category: mysqlEnum("category", [
    "VRL Framework", "TRL Framework", "Lean Methodology", "Social Enterprise",
    "Impact Investing", "Circular Economy", "Sports Technology", "Eco Materials",
    "Venture Building", "University Spin-out", "Other"
  ]).default("Other"),
  evidenceType: mysqlEnum("evidenceType", [
    "Peer Reviewed", "Conference Paper", "Thesis", "Industry Report",
    "Government Report", "Book Chapter", "Working Paper"
  ]).default("Peer Reviewed"),
  relevanceScore: int("relevanceScore").default(5),  // 1–10
  ventureIds: text("ventureIds"),                    // comma-separated venture IDs this paper supports
  trlLevelsSupported: text("trlLevelsSupported"),    // comma-separated TRL levels e.g. "3,4,5"
  vrlStagesSupported: text("vrlStagesSupported"),    // comma-separated VRL stages e.g. "1,2"
  notes: text("notes"),
  addedBy: varchar("addedBy", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResearchPaper = typeof researchPapers.$inferSelect;
export type InsertResearchPaper = typeof researchPapers.$inferInsert;

// ── Fellow Researchers ────────────────────────────────────────────────────────
export const fellowResearchers = mysqlTable("fellow_researchers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  title: varchar("title", { length: 255 }),          // academic title / role
  institution: varchar("institution", { length: 255 }),
  department: varchar("department", { length: 255 }),
  specialisation: text("specialisation"),
  email: varchar("email", { length: 320 }),
  linkedIn: varchar("linkedIn", { length: 255 }),
  orcid: varchar("orcid", { length: 64 }),           // ORCID researcher ID
  collaborationType: mysqlEnum("collaborationType", [
    "Academic Advisor", "Co-Researcher", "Industry Fellow",
    "Visiting Scholar", "PhD Supervisor", "Peer Reviewer", "Consultant"
  ]).default("Academic Advisor"),
  status: mysqlEnum("status", ["Active", "Prospective", "Past"]).default("Active"),
  ventureIds: text("ventureIds"),                    // ventures they support
  bio: text("bio"),
  publications: int("publications").default(0),      // count of relevant publications
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FellowResearcher = typeof fellowResearchers.$inferSelect;
export type InsertFellowResearcher = typeof fellowResearchers.$inferInsert;

// ── University Partnerships ───────────────────────────────────────────────────
export const universityPartnerships = mysqlTable("university_partnerships", {
  id: int("id").autoincrement().primaryKey(),
  universityName: varchar("universityName", { length: 255 }).notNull(),
  country: varchar("country", { length: 128 }),
  department: varchar("department", { length: 255 }),
  contactName: varchar("contactName", { length: 128 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  partnershipType: mysqlEnum("partnershipType", [
    "Research Collaboration", "Spin-out Support", "Knowledge Transfer",
    "Student Placement", "Grant Co-applicant", "Advisory Board", "MoU"
  ]).default("Research Collaboration"),
  status: mysqlEnum("status", ["Active", "Prospective", "Completed", "Paused"]).default("Prospective"),
  startDate: varchar("startDate", { length: 32 }),
  endDate: varchar("endDate", { length: 32 }),
  description: text("description"),
  ventureIds: text("ventureIds"),
  fundingLinked: boolean("fundingLinked").default(false),
  fundingAmount: int("fundingAmount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UniversityPartnership = typeof universityPartnerships.$inferSelect;
export type InsertUniversityPartnership = typeof universityPartnerships.$inferInsert;

// ── Evidence Claims ───────────────────────────────────────────────────────────
// Links research papers to specific VRL/TRL claims for a venture
export const evidenceClaims = mysqlTable("evidence_claims", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  paperId: int("paperId"),                           // FK to research_papers
  claimText: text("claimText").notNull(),            // the specific claim being evidenced
  claimType: mysqlEnum("claimType", [
    "Market Validation", "Technology Feasibility", "Social Impact",
    "Competitive Advantage", "Regulatory Compliance", "Financial Model",
    "Team Capability", "Methodology Support"
  ]).default("Market Validation"),
  trlLevel: int("trlLevel"),                         // TRL level this claim supports
  vrlStage: int("vrlStage"),                         // VRL stage this claim supports
  strength: mysqlEnum("strength", ["Strong", "Moderate", "Weak"]).default("Moderate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EvidenceClaim = typeof evidenceClaims.$inferSelect;
export type InsertEvidenceClaim = typeof evidenceClaims.$inferInsert;

// ── Market Analysis ───────────────────────────────────────────────────────────
// Stores market size estimates and TAM/SAM/SOM data per venture
export const marketAnalysis = mysqlTable("market_analysis", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  marketName: varchar("marketName", { length: 255 }).notNull(),   // e.g. "Global Eco-Materials Market"
  geography: varchar("geography", { length: 128 }).default("Global"),
  tamValue: int("tamValue").default(0),           // Total Addressable Market (£M)
  samValue: int("samValue").default(0),           // Serviceable Addressable Market (£M)
  somValue: int("somValue").default(0),           // Serviceable Obtainable Market (£M)
  tamUnit: varchar("tamUnit", { length: 32 }).default("£M"),
  cagr: float("cagr").default(0),                 // Compound Annual Growth Rate (%)
  marketYear: int("marketYear").default(2025),    // base year for the estimate
  forecastYear: int("forecastYear").default(2030),
  sourceUrl: text("sourceUrl"),
  sourceName: varchar("sourceName", { length: 255 }),
  keyDrivers: text("keyDrivers"),                 // comma-separated growth drivers
  keyBarriers: text("keyBarriers"),               // comma-separated barriers
  notes: text("notes"),
  aiGenerated: boolean("aiGenerated").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarketAnalysis = typeof marketAnalysis.$inferSelect;
export type InsertMarketAnalysis = typeof marketAnalysis.$inferInsert;

// ── Competitors ───────────────────────────────────────────────────────────────
export const competitors = mysqlTable("competitors", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  website: varchar("website", { length: 512 }),
  hq: varchar("hq", { length: 128 }),             // headquarters location
  founded: int("founded"),                          // year founded
  stage: mysqlEnum("stage", [
    "Startup", "Scale-up", "Established", "Enterprise", "Unknown"
  ]).default("Unknown"),
  competitorType: mysqlEnum("competitorType", [
    "Direct", "Indirect", "Substitute", "Potential"
  ]).default("Direct"),
  productDescription: text("productDescription"),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  differentiator: text("differentiator"),          // how our venture differs
  revenueEstimate: varchar("revenueEstimate", { length: 64 }), // e.g. "£5M–£20M"
  fundingRaised: varchar("fundingRaised", { length: 64 }),
  threatLevel: mysqlEnum("threatLevel", ["Low", "Medium", "High"]).default("Medium"),
  notes: text("notes"),
  aiGenerated: boolean("aiGenerated").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Competitor = typeof competitors.$inferSelect;
export type InsertCompetitor = typeof competitors.$inferInsert;

// ── Opportunity Research Reports ──────────────────────────────────────────────
// AI-generated research reports triggered from an opportunity's problem statement
export const opportunityReports = mysqlTable("opportunity_reports", {
  id: int("id").autoincrement().primaryKey(),
  opportunityId: int("opportunityId").notNull(),   // FK to opportunities
  title: varchar("title", { length: 512 }).notNull(),
  problemStatement: text("problemStatement").notNull(),
  reportContent: text("reportContent"),            // full markdown report from LLM
  marketSizeSummary: text("marketSizeSummary"),    // extracted market size section
  competitorSummary: text("competitorSummary"),    // extracted competitor section
  keyInsights: text("keyInsights"),                // bullet-point insights
  recommendedAction: mysqlEnum("recommendedAction", [
    "Pursue", "Investigate Further", "Park", "Reject"
  ]).default("Investigate Further"),
  confidenceScore: int("confidenceScore").default(5), // 1–10 AI confidence
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OpportunityReport = typeof opportunityReports.$inferSelect;
export type InsertOpportunityReport = typeof opportunityReports.$inferInsert;

// ── FMEA Engineering Risk Register ────────────────────────────────────────────
// Failure Mode & Effects Analysis risks linked to a venture and optional TRL stage
export const engineeringRisks = mysqlTable("engineering_risks", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  relatedTrlStage: int("relatedTrlStage"),                      // Optional: TRL level 1–9
  componentName: varchar("componentName", { length: 255 }).notNull(),
  failureMode: text("failureMode").notNull(),
  failureEffect: text("failureEffect").notNull(),
  severity: int("severity").notNull().default(5),               // 1–10
  occurrence: int("occurrence").notNull().default(5),           // 1–10
  detection: int("detection").notNull().default(5),             // 1–10
  initialRpn: int("initialRpn").notNull().default(125),         // Auto: S * O * D
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EngineeringRisk = typeof engineeringRisks.$inferSelect;
export type InsertEngineeringRisk = typeof engineeringRisks.$inferInsert;

// ── FMEA Mitigation Actions ────────────────────────────────────────────────────
// Mitigation actions linked to an engineering risk with revised RPN scores
export const mitigationActions = mysqlTable("mitigation_actions", {
  id: int("id").autoincrement().primaryKey(),
  riskId: int("riskId").notNull(),                              // FK to engineering_risks
  actionDescription: text("actionDescription").notNull(),
  owner: varchar("owner", { length: 128 }),
  status: mysqlEnum("status", [
    "Identified", "In Progress", "Implemented", "Verified"
  ]).default("Identified").notNull(),
  revisedSeverity: int("revisedSeverity").default(5),           // 1–10
  revisedOccurrence: int("revisedOccurrence").default(5),       // 1–10
  revisedDetection: int("revisedDetection").default(5),         // 1–10
  revisedRpn: int("revisedRpn").default(125),                   // Auto: rS * rO * rD
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MitigationAction = typeof mitigationActions.$inferSelect;
export type InsertMitigationAction = typeof mitigationActions.$inferInsert;

// ── Academic Papers ────────────────────────────────────────────────────────────
// Stores peer-reviewed papers retrieved from Semantic Scholar / Crossref
export const academicPapers = mysqlTable("academic_papers", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 255 }).notNull().unique(), // DOI or Semantic Scholar paperId
  title: varchar("title", { length: 512 }).notNull(),
  authors: text("authors").notNull(),                // JSON array of author name strings
  abstract: text("abstract"),
  url: varchar("url", { length: 512 }),
  citationCount: int("citationCount").default(0).notNull(),
  publishedYear: int("publishedYear"),
  source: varchar("source", { length: 64 }).default("semantic_scholar"), // 'semantic_scholar' | 'crossref'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AcademicPaper = typeof academicPapers.$inferSelect;
export type InsertAcademicPaper = typeof academicPapers.$inferInsert;

// ── Task Paper Links (join table) ─────────────────────────────────────────────
// Links an engineering task (experiment) to an academic paper
export const taskPaperLinks = mysqlTable("task_paper_links", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),                   // FK to experiments.id
  paperId: int("paperId").notNull(),                 // FK to academic_papers.id
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  relevanceScore: float("relevanceScore"),           // Optional: returned by search API
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TaskPaperLink = typeof taskPaperLinks.$inferSelect;
export type InsertTaskPaperLink = typeof taskPaperLinks.$inferInsert;

// ── Venture Risks (Business & Technical Risk Register) ────────────────────────
// Tracks 6-category risk register with Likelihood × Impact scoring and VRL linkage
export const ventureRisks = mysqlTable("venture_risks", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  riskCategory: mysqlEnum("riskCategory", [
    "Technical", "Market", "Commercial", "Financial", "Operational", "Strategic"
  ]).notNull(),
  riskTitle: varchar("riskTitle", { length: 255 }).notNull(),
  riskDescription: text("riskDescription"),
  likelihood: int("likelihood").notNull().default(3),   // 1–5
  impact: int("impact").notNull().default(3),           // 1–5
  riskScore: int("riskScore").notNull().default(9),     // likelihood × impact (auto-calculated)
  riskLevel: mysqlEnum("riskLevel", ["Low", "Medium", "High", "Critical"]).notNull().default("Medium"),
  vrlStageImpacted: int("vrlStageImpacted"),            // 1–6 VRL stage this risk blocks
  mitigationPlan: text("mitigationPlan"),
  riskOwner: varchar("riskOwner", { length: 128 }),
  status: mysqlEnum("status", ["Open", "In Progress", "Mitigated", "Accepted", "Closed"]).default("Open"),
  reviewDate: timestamp("reviewDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VentureRisk = typeof ventureRisks.$inferSelect;
export type InsertVentureRisk = typeof ventureRisks.$inferInsert;

// ── BRL Tasks (Business Readiness Level — 100 Tasks Method) ───────────────────
// Seed table: defines all 100 BRL tasks. Completions are per-venture.
export const brlTasks = mysqlTable("brl_tasks", {
  id: int("id").autoincrement().primaryKey(),
  taskNumber: int("taskNumber").notNull().unique(), // 1–100
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "Legal & Entity",
    "Intellectual Property",
    "Brand Identity",
    "Financial",
    "Technology & Product",
    "Market & Customer",
    "Partnerships & OEM",
    "Governance & Compliance",
    "People & Team",
    "Go-to-Market",
    "Scaling",
  ]).notNull(),
  vrlStage: int("vrlStage").notNull(), // 1=Idea, 2=Validation, 3=MVP/Kick-off, 4=Scale
  platformScope: mysqlEnum("platformScope", [
    "Fundamentals",   // Managed on this dashboard
    "Kick-off",       // Managed on this dashboard
    "Execution",      // Belongs to brand execution platform
  ]).notNull().default("Fundamentals"),
  linkedModule: varchar("linkedModule", { length: 128 }), // e.g. "brand", "legal", "academic"
  weight: float("weight").notNull().default(1.0), // contribution to BRL score
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BrlTask = typeof brlTasks.$inferSelect;
export type InsertBrlTask = typeof brlTasks.$inferInsert;

// ── BRL Task Completions (per-venture progress) ───────────────────────────────
export const brlTaskCompletions = mysqlTable("brl_task_completions", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  taskId: int("taskId").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completedAt"),
  completedBy: varchar("completedBy", { length: 128 }),
  notes: text("notes"),
  evidenceUrl: varchar("evidenceUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BrlTaskCompletion = typeof brlTaskCompletions.$inferSelect;
export type InsertBrlTaskCompletion = typeof brlTaskCompletions.$inferInsert;

// ── VRL Scoring Parameters (per-venture formula inputs) ──────────────────────
// Stores the configurable inputs for the VRL formula:
// VRL = (α × TRL + β × BRL) × (1 − Risk Index) × Confidence Score
export const vrlScoringParams = mysqlTable("vrl_scoring_params", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull().unique(),
  // Weighting factors (must sum to 1.0)
  alphaWeight: float("alphaWeight").notNull().default(0.45), // TRL weight
  betaWeight: float("betaWeight").notNull().default(0.55),   // BRL weight
  // Confidence Score (0.2–1.0) based on validation evidence strength
  confidenceScore: float("confidenceScore").notNull().default(0.5),
  confidenceRationale: text("confidenceRationale"),
  // Computed outputs (cached, recalculated on demand)
  computedVrlScore: float("computedVrlScore"),       // raw VRL score (0–9)
  computedVrlLevel: int("computedVrlLevel"),         // rounded VRL level (1–9)
  lastCalculatedAt: timestamp("lastCalculatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VrlScoringParams = typeof vrlScoringParams.$inferSelect;
export type InsertVrlScoringParams = typeof vrlScoringParams.$inferInsert;

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  LITERATURE AUDIT ADDITIONS — TIER 2                                        ║
// ║  The Lean Startup (Ries, 2011) + The Innovator's Dilemma (Christensen, 1997)║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ── Pivot Decision Log (Lean Startup — Rec. 1) ───────────────────────────────
// Records every structured pivot-or-persevere decision with full evidence trail.
// Ries: "A pivot is a structured course correction designed to test a new
// fundamental hypothesis about the product, business model, and engine of growth."
export const pivotDecisions = mysqlTable("pivot_decisions", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  // Decision metadata
  decisionDate: timestamp("decisionDate").notNull(),
  decision: mysqlEnum("decision", ["Pivot", "Persevere", "Pause"]).notNull(),
  // Ries's ten pivot types
  pivotType: mysqlEnum("pivotType", [
    "Zoom-In",            // Single feature becomes the whole product
    "Zoom-Out",           // Whole product becomes a single feature
    "Customer-Segment",   // Same problem, different customer
    "Customer-Need",      // Same customer, different problem
    "Platform",           // App to platform or vice versa
    "Business-Architecture", // High-margin/low-volume ↔ low-margin/high-volume
    "Value-Capture",      // Monetisation model change
    "Engine-of-Growth",   // Sticky → Viral → Paid switch
    "Channel",            // Distribution channel change
    "Technology",         // Same outcome, different technology
  ]),
  // Hypothesis being tested at time of decision
  hypothesisTested: text("hypothesisTested").notNull(),
  // Evidence reviewed (narrative + linked counts)
  evidenceSummary: text("evidenceSummary"),
  experimentsPassed: int("experimentsPassed").default(0),
  experimentsFailed: int("experimentsFailed").default(0),
  interviewsReviewed: int("interviewsReviewed").default(0),
  // VRL score at time of decision (snapshot)
  vrlScoreAtDecision: float("vrlScoreAtDecision"),
  // Outcome of the decision
  newHypothesis: text("newHypothesis"),  // what will be tested next
  rationale: text("rationale"),
  decidedBy: varchar("decidedBy", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PivotDecision = typeof pivotDecisions.$inferSelect;
export type InsertPivotDecision = typeof pivotDecisions.$inferInsert;

// ── Pivot Trigger Configuration (Lean Startup — Rec. 2) ──────────────────────
// Per-venture thresholds that generate a "pivot signal" alert when crossed.
// Operationalises Ries's "runway is the number of pivots it can still make."
export const pivotTriggerConfig = mysqlTable("pivot_trigger_config", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull().unique(),
  // Thresholds — alert fires when ALL active conditions are met
  minExperimentPassRatePct: float("minExperimentPassRatePct").default(30), // alert if pass rate < this
  maxRiskIndexPct: float("maxRiskIndexPct").default(60),                   // alert if risk index > this
  minVrlScore: float("minVrlScore").default(2.0),                          // alert if VRL score < this
  stagnationPeriodDays: int("stagnationPeriodDays").default(60),           // alert if no VRL progress for N days
  // Alert state
  alertActive: boolean("alertActive").default(false),
  alertTriggeredAt: timestamp("alertTriggeredAt"),
  alertDismissedAt: timestamp("alertDismissedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PivotTriggerConfig = typeof pivotTriggerConfig.$inferSelect;
export type InsertPivotTriggerConfig = typeof pivotTriggerConfig.$inferInsert;

// ── Value Network Mapping (Innovator's Dilemma — Rec. 6) ─────────────────────
// Captures the value network context for each venture per Christensen's framework.
// "A value network is the context within which a firm identifies and responds to
// customers' needs, solves problems, procures input, reacts to competitors,
// and strives for profit."
export const valueNetworks = mysqlTable("value_networks", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull().unique(),
  // Primary customer segment
  primaryCustomerSegment: text("primaryCustomerSegment"),
  customerPerformanceMetrics: text("customerPerformanceMetrics"), // what customers measure success by
  // Cost structure
  targetGrossMarginPct: float("targetGrossMarginPct"),  // % gross margin required to be viable
  costStructureNotes: text("costStructureNotes"),
  // Distribution
  primaryChannel: varchar("primaryChannel", { length: 128 }),
  channelNotes: text("channelNotes"),
  // Competitive alternatives (what customers use instead)
  competitiveAlternatives: text("competitiveAlternatives"),
  // Value network fit flag (Rec. 12)
  requiresDifferentCostStructure: boolean("requiresDifferentCostStructure").default(false),
  requiresDifferentChannel: boolean("requiresDifferentChannel").default(false),
  requiresDifferentCustomerRelationship: boolean("requiresDifferentCustomerRelationship").default(false),
  // If any of the above are true, recommend autonomous team
  autonomousTeamRecommended: boolean("autonomousTeamRecommended").default(false),
  autonomousTeamNotes: text("autonomousTeamNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ValueNetwork = typeof valueNetworks.$inferSelect;
export type InsertValueNetwork = typeof valueNetworks.$inferInsert;

// ── Hypothesis-Linked Onboarding Tasks (Lean Startup — Rec. 13) ──────────────
// Extends the onboarding wizard so each task is linked to a specific hypothesis
// and a validation criterion, transforming the checklist into a validated
// learning record. Ries: "the number of interviews is a vanity metric; what
// matters is the number of validated hypotheses."
export const onboardingHypotheses = mysqlTable("onboarding_hypotheses", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  // Onboarding task reference (maps to the wizard step)
  onboardingStep: int("onboardingStep").notNull(),  // 1–4 (wizard steps)
  taskLabel: varchar("taskLabel", { length: 255 }).notNull(),
  // Hypothesis structure (Lean Startup scientific method)
  hypothesis: text("hypothesis").notNull(),          // "We believe that X..."
  validationCriterion: text("validationCriterion").notNull(), // "We will know this is true when..."
  minimumSampleSize: int("minimumSampleSize"),        // e.g. minimum 20 interviews
  // Outcome
  outcome: mysqlEnum("outcome", ["Validated", "Invalidated", "Inconclusive", "Pending"]).default("Pending"),
  evidenceSummary: text("evidenceSummary"),
  validatedAt: timestamp("validatedAt"),
  // Links to experiments/interviews that provide evidence
  linkedExperimentIds: text("linkedExperimentIds"),  // JSON array of experiment IDs
  linkedInterviewIds: text("linkedInterviewIds"),    // JSON array of interview IDs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OnboardingHypothesis = typeof onboardingHypotheses.$inferSelect;
export type InsertOnboardingHypothesis = typeof onboardingHypotheses.$inferInsert;

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  LITERATURE AUDIT ADDITIONS — TIER 3                                        ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ── Disruptive Opportunity Scoring (Innovator's Dilemma — Rec. 11 & 12) ───────
// Extends the Opportunity Pipeline with a Disruption Potential score that
// inverts standard criteria. Christensen: "the most dangerous competitive threats
// come from opportunities that score poorly on standard criteria."
export const opportunityDisruptionScores = mysqlTable("opportunity_disruption_scores", {
  id: int("id").autoincrement().primaryKey(),
  opportunityId: int("opportunityId").notNull().unique(),
  // Disruption Potential scoring (inverted criteria — high score = more disruptive)
  // Each dimension scored 0–10
  initialMarketSmallness: int("initialMarketSmallness").default(0),
    // 10 = very small/niche market (disruptive signal); 0 = large established market
  nonConsumerTargeting: int("nonConsumerTargeting").default(0),
    // 10 = targets non-consumers or underserved; 0 = targets mainstream customers
  simplicityScore: int("simplicityScore").default(0),
    // 10 = simpler/more convenient than incumbents; 0 = more complex
  lowMarginViability: int("lowMarginViability").default(0),
    // 10 = viable at low margins (disruptive); 0 = requires high margins
  incumbentIgnoreScore: int("incumbentIgnoreScore").default(0),
    // 10 = incumbents would rationally ignore this; 0 = incumbents would respond immediately
  // Computed total (sum of above, max 50)
  disruptionPotentialScore: int("disruptionPotentialScore").default(0),
  // Value network fit assessment (Rec. 12)
  requiresDifferentCostStructure: boolean("requiresDifferentCostStructure").default(false),
  requiresDifferentChannel: boolean("requiresDifferentChannel").default(false),
  requiresDifferentCustomerRelationship: boolean("requiresDifferentCustomerRelationship").default(false),
  // If any above are true, flag for autonomous team recommendation
  autonomousTeamFlagged: boolean("autonomousTeamFlagged").default(false),
  assessmentNotes: text("assessmentNotes"),
  assessedBy: varchar("assessedBy", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OpportunityDisruptionScore = typeof opportunityDisruptionScores.$inferSelect;
export type InsertOpportunityDisruptionScore = typeof opportunityDisruptionScores.$inferInsert;

// ── Organisational Autonomy Health Check (Innovator's Dilemma — Rec. 14) ─────
// Assesses whether disruptive ventures have the organisational autonomy required
// to succeed. Christensen: "disruptive ventures fail when managed within the same
// organisational structure as sustaining ventures."
// Only relevant for ventures classified as Disruptive-NewMarket or Disruptive-LowEnd.
export const autonomyHealthChecks = mysqlTable("autonomy_health_checks", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  assessmentDate: timestamp("assessmentDate").notNull(),
  // Four autonomy dimensions (each scored 0–10)
  budgetProtectionScore: int("budgetProtectionScore").default(0),
    // 10 = budget fully ring-fenced; 0 = subject to portfolio reallocation
  decisionAutonomyScore: int("decisionAutonomyScore").default(0),
    // 10 = team makes all product/GTM decisions independently; 0 = requires approval
  metricsAppropriatenessScore: int("metricsAppropriatenessScore").default(0),
    // 10 = measured on stage-appropriate small wins; 0 = measured against portfolio scale
  valueNetworkEmbeddingScore: int("valueNetworkEmbeddingScore").default(0),
    // 10 = embedded in target customers' value network; 0 = serving existing portfolio customers
  // Computed total (sum of above, max 40)
  totalAutonomyScore: int("totalAutonomyScore").default(0),
  // Autonomy level classification
  autonomyLevel: mysqlEnum("autonomyLevel", [
    "Critical",  // 0–10: Severely constrained, high failure risk
    "Low",       // 11–20: Insufficient autonomy
    "Moderate",  // 21–30: Some autonomy but gaps remain
    "High",      // 31–40: Well-protected disruptive unit
  ]).default("Critical"),
  // Narrative assessment
  budgetNotes: text("budgetNotes"),
  decisionNotes: text("decisionNotes"),
  metricsNotes: text("metricsNotes"),
  valueNetworkNotes: text("valueNetworkNotes"),
  recommendedActions: text("recommendedActions"),
  assessedBy: varchar("assessedBy", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AutonomyHealthCheck = typeof autonomyHealthChecks.$inferSelect;
export type InsertAutonomyHealthCheck = typeof autonomyHealthChecks.$inferInsert;

// ── Technology Trajectory Snapshots (Innovator's Dilemma — Rec. 15) ──────────
// Records periodic TRL trajectory data points for plotting against market
// performance thresholds. Christensen: reveals when a disruptive technology is
// about to intersect with mainstream market requirements.
// Note: venture_scores already records historical TRL. This table adds the
// market threshold context needed for trajectory analysis.
export const technologyTrajectories = mysqlTable("technology_trajectories", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  // Market performance threshold (configurable per venture)
  // The TRL level at which the technology meets mainstream market requirements
  mainStreamMarketTrlThreshold: int("mainStreamMarketTrlThreshold").default(7),
  lowEndMarketTrlThreshold: int("lowEndMarketTrlThreshold").default(4),
  // Projected trajectory (simple linear extrapolation inputs)
  currentTrl: int("currentTrl").notNull(),
  trlGrowthRatePerQuarter: float("trlGrowthRatePerQuarter"), // avg TRL levels gained per quarter
  // Market entry window calculation
  quartersToMainstreamEntry: float("quartersToMainstreamEntry"), // computed: (threshold - current) / rate
  quartersToLowEndEntry: float("quartersToLowEndEntry"),
  // Alert: when entry window < alertHorizonQuarters, generate "market entry window" alert
  alertHorizonQuarters: int("alertHorizonQuarters").default(4),
  marketEntryAlertActive: boolean("marketEntryAlertActive").default(false),
  // Snapshot date
  snapshotDate: timestamp("snapshotDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TechnologyTrajectory = typeof technologyTrajectories.$inferSelect;
export type InsertTechnologyTrajectory = typeof technologyTrajectories.$inferInsert;

// ── Cohort Analysis Snapshots (Lean Startup — Rec. 4) ────────────────────────
// Groups ventures by founding quarter and tracks VRL progression over time.
// Ries: "use cohort analysis rather than cumulative totals to reveal whether
// the portfolio's readiness methodology is improving across successive cohorts."
export const cohortSnapshots = mysqlTable("cohort_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  // Cohort identifier (founding quarter, e.g. "2024-Q1")
  foundingCohort: varchar("foundingCohort", { length: 8 }).notNull(),
  // Snapshot data (taken at regular intervals)
  snapshotQuarter: varchar("snapshotQuarter", { length: 8 }).notNull(), // e.g. "2026-Q1"
  quartersElapsed: int("quartersElapsed").notNull(),  // quarters since founding
  vrlScore: float("vrlScore"),
  trlLevel: int("trlLevel"),
  experimentPassRate: float("experimentPassRate"),
  pivotCount: int("pivotCount").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CohortSnapshot = typeof cohortSnapshots.$inferSelect;
export type InsertCohortSnapshot = typeof cohortSnapshots.$inferInsert;

// ── Pivot Runway Calculator Inputs (Lean Startup — Rec. 10) ──────────────────
// Stores the inputs needed to estimate how many pivots a venture can still afford.
// Ries: "a startup's runway is the number of pivots it can still make."
export const pivotRunwayInputs = mysqlTable("pivot_runway_inputs", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull().unique(),
  // Cash position
  currentCashBalance: int("currentCashBalance").default(0),   // current cash in hand
  monthlyBurnRate: int("monthlyBurnRate").default(0),          // current monthly burn
  // Pivot cost estimate
  avgPivotCostEstimate: int("avgPivotCostEstimate").default(0), // estimated cost per pivot cycle
  avgPivotDurationWeeks: int("avgPivotDurationWeeks").default(8), // typical weeks per pivot
  // Computed outputs (cached)
  estimatedRunwayMonths: float("estimatedRunwayMonths"),        // currentCash / monthlyBurn
  estimatedPivotsRemaining: float("estimatedPivotsRemaining"),  // runwayMonths / (pivotDurationWeeks/4.3)
  runwayAlertThreshold: int("runwayAlertThreshold").default(2), // alert when pivots remaining < this
  runwayAlertActive: boolean("runwayAlertActive").default(false),
  lastCalculatedAt: timestamp("lastCalculatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PivotRunwayInputs = typeof pivotRunwayInputs.$inferSelect;
export type InsertPivotRunwayInputs = typeof pivotRunwayInputs.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// IMPACT GOVERNANCE ENGINE — IRL (Impact Readiness Level) Schema
// IRL = (ESG + LCA + PCF + CSR + Certification) / 5
// Total Venture Intelligence Score = VRL + IRL
// Brief: venture_intelligence_dashboard_update_prompt_brief.docx
// ═══════════════════════════════════════════════════════════════════════════════

// ── ESG Analytics ─────────────────────────────────────────────────────────────
export const esgMetrics = mysqlTable("esg_metrics", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull().unique(),
  // Environmental pillar (0–10 each)
  carbonEmissionsScore:       float("carbonEmissionsScore").default(0),
  energyEfficiencyScore:      float("energyEfficiencyScore").default(0),
  waterManagementScore:       float("waterManagementScore").default(0),
  wasteCircularityScore:      float("wasteCircularityScore").default(0),
  biodiversityScore:          float("biodiversityScore").default(0),
  environmentalScore:         float("environmentalScore").default(0),
  // Social pillar (0–10 each)
  workerWellbeingScore:       float("workerWellbeingScore").default(0),
  diversityInclusionScore:    float("diversityInclusionScore").default(0),
  communityEngagementScore:   float("communityEngagementScore").default(0),
  supplyChainEthicsScore:     float("supplyChainEthicsScore").default(0),
  socialScore:                float("socialScore").default(0),
  // Governance pillar (0–10 each)
  boardTransparencyScore:     float("boardTransparencyScore").default(0),
  ethicsAntiCorruptionScore:  float("ethicsAntiCorruptionScore").default(0),
  stakeholderEngagementScore: float("stakeholderEngagementScore").default(0),
  dataPrivacyScore:           float("dataPrivacyScore").default(0),
  governanceScore:            float("governanceScore").default(0),
  // Overall ESG score (0–10) — computed: (E + S + G) / 3
  esgScore:                   float("esgScore").default(0),
  esgFrameworkUsed:           varchar("esgFrameworkUsed", { length: 128 }),
  lastReviewedAt:             timestamp("lastReviewedAt"),
  notes:                      text("notes"),
  createdAt:                  timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                  timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EsgMetrics = typeof esgMetrics.$inferSelect;
export type InsertEsgMetrics = typeof esgMetrics.$inferInsert;

// ── Life Cycle Assessment (LCA) ───────────────────────────────────────────────
export const lcaAssessments = mysqlTable("lca_assessments", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  stage: mysqlEnum("stage", [
    "Raw Material Extraction",
    "Manufacturing",
    "Distribution & Logistics",
    "Use Phase",
    "End of Life",
  ]).notNull(),
  climateChangeImpact:      float("climateChangeImpact").default(0),
  acidificationImpact:      float("acidificationImpact").default(0),
  eutrophicationImpact:     float("eutrophicationImpact").default(0),
  waterUsageImpact:         float("waterUsageImpact").default(0),
  landUseImpact:            float("landUseImpact").default(0),
  resourceDepletionImpact:  float("resourceDepletionImpact").default(0),
  assessmentMaturityScore:  float("assessmentMaturityScore").default(0),
  improvementActions:       text("improvementActions"),
  targetReductionPercent:   float("targetReductionPercent"),
  baselineYear:             int("baselineYear"),
  assessedAt:               timestamp("assessedAt"),
  notes:                    text("notes"),
  createdAt:                timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LcaAssessment = typeof lcaAssessments.$inferSelect;
export type InsertLcaAssessment = typeof lcaAssessments.$inferInsert;

// ── Product Carbon Footprint (PCF) ────────────────────────────────────────────
export const pcfRecords = mysqlTable("pcf_records", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull().unique(),
  scope1Emissions:          float("scope1Emissions").default(0),
  scope2Emissions:          float("scope2Emissions").default(0),
  scope3Emissions:          float("scope3Emissions").default(0),
  totalEmissions:           float("totalEmissions").default(0),
  emissionIntensity:        float("emissionIntensity"),
  baselineYear:             int("baselineYear"),
  baselineEmissions:        float("baselineEmissions"),
  targetYear:               int("targetYear"),
  targetReductionPercent:   float("targetReductionPercent"),
  netZeroCommitment:        boolean("netZeroCommitment").default(false),
  scienceBasedTarget:       boolean("scienceBasedTarget").default(false),
  offsetsUsed:              float("offsetsUsed").default(0),
  offsetProvider:           varchar("offsetProvider", { length: 128 }),
  pcfScore:                 float("pcfScore").default(0),
  measurementStandard:      varchar("measurementStandard", { length: 128 }),
  lastMeasuredAt:           timestamp("lastMeasuredAt"),
  notes:                    text("notes"),
  createdAt:                timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PcfRecord = typeof pcfRecords.$inferSelect;
export type InsertPcfRecord = typeof pcfRecords.$inferInsert;

// ── CSR Metrics ───────────────────────────────────────────────────────────────
export const csrMetrics = mysqlTable("csr_metrics", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull().unique(),
  philanthropyScore:         float("philanthropyScore").default(0),
  ethicalSourcingScore:      float("ethicalSourcingScore").default(0),
  communityInvestmentScore:  float("communityInvestmentScore").default(0),
  employeeVolunteeringScore: float("employeeVolunteeringScore").default(0),
  transparencyReportingScore:float("transparencyReportingScore").default(0),
  csrScore:                  float("csrScore").default(0),
  csrReportPublished:        boolean("csrReportPublished").default(false),
  reportingFramework:        varchar("reportingFramework", { length: 128 }),
  sdgAlignments:             text("sdgAlignments"),
  lastReportedAt:            timestamp("lastReportedAt"),
  notes:                     text("notes"),
  createdAt:                 timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                 timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CsrMetrics = typeof csrMetrics.$inferSelect;
export type InsertCsrMetrics = typeof csrMetrics.$inferInsert;

// ── Certification & Compliance Tracking ──────────────────────────────────────
export const certificationTracking = mysqlTable("certification_tracking", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  certificationName: mysqlEnum("certificationName", [
    "B Corp",
    "ISO 14001",
    "ISO 26000",
    "ISO 50001",
    "ISO 9001",
    "ISO 45001",
    "GRI Standards",
    "UN Global Compact",
    "Science Based Targets (SBTi)",
    "Carbon Neutral Certified",
    "Other",
  ]).notNull(),
  status: mysqlEnum("status", [
    "Not Started",
    "Gap Analysis",
    "In Progress",
    "Under Review",
    "Certified",
    "Lapsed",
  ]).notNull().default("Not Started"),
  progressPercent:          int("progressPercent").default(0),
  certificationScore:       float("certificationScore").default(0),
  targetCertificationDate:  timestamp("targetCertificationDate"),
  certificationDate:        timestamp("certificationDate"),
  expiryDate:               timestamp("expiryDate"),
  lastAuditDate:            timestamp("lastAuditDate"),
  bImpactScore:             float("bImpactScore"),
  bImpactGovernance:        float("bImpactGovernance"),
  bImpactWorkers:           float("bImpactWorkers"),
  bImpactCommunity:         float("bImpactCommunity"),
  bImpactEnvironment:       float("bImpactEnvironment"),
  bImpactCustomers:         float("bImpactCustomers"),
  certifyingBody:           varchar("certifyingBody", { length: 128 }),
  certificateUrl:           varchar("certificateUrl", { length: 512 }),
  notes:                    text("notes"),
  createdAt:                timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CertificationTracking = typeof certificationTracking.$inferSelect;
export type InsertCertificationTracking = typeof certificationTracking.$inferInsert;

// ── IRL Score Cache ───────────────────────────────────────────────────────────
// IRL = (ESG + LCA + PCF + CSR + Certification) / 5
// Total Venture Intelligence Score = VRL + IRL (raw sum; normalise for display)
export const irlScores = mysqlTable("irl_scores", {
  id: int("id").autoincrement().primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull().unique(),
  esgScore:                      float("esgScore").default(0),
  lcaScore:                      float("lcaScore").default(0),
  pcfScore:                      float("pcfScore").default(0),
  csrScore:                      float("csrScore").default(0),
  certificationScore:            float("certificationScore").default(0),
  irlScore:                      float("irlScore").default(0),
  vrlScore:                      float("vrlScore").default(0),
  totalVentureIntelligenceScore: float("totalVentureIntelligenceScore").default(0),
  computedAt:                    timestamp("computedAt").defaultNow().notNull(),
  updatedAt:                     timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type IrlScore = typeof irlScores.$inferSelect;
export type InsertIrlScore = typeof irlScores.$inferInsert;

// ── Knowledge Base ────────────────────────────────────────────────────────────
// Stores ingested documents (PDFs, transcripts, URLs) for RAG-style retrieval
// Uses MySQL FULLTEXT index for BM25-style keyword search
export const knowledgeDocuments = mysqlTable("knowledge_documents", {
  id:           int("id").autoincrement().primaryKey(),
  title:        varchar("title", { length: 256 }).notNull(),
  sourceType:   mysqlEnum("sourceType", ["pdf", "transcript", "url", "text"]).notNull().default("pdf"),
  sourceUrl:    varchar("sourceUrl", { length: 1024 }),
  s3Key:        varchar("s3Key", { length: 512 }),
  domain:       mysqlEnum("domain", [
    "VRL", "TRL", "BRL", "IRL", "ESG", "Market", "Finance",
    "Legal", "People", "Brand", "Strategy", "General"
  ]).notNull().default("General"),
  tags:         varchar("tags", { length: 512 }),
  author:       varchar("author", { length: 256 }),
  publishedYear: int("publishedYear"),
  description:  text("description"),
  chunkCount:   int("chunkCount").default(0),
  wordCount:    int("wordCount").default(0),
  status:       mysqlEnum("status", ["pending", "processing", "ready", "error"]).notNull().default("pending"),
  errorMessage: text("errorMessage"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type InsertKnowledgeDocument = typeof knowledgeDocuments.$inferInsert;

// Each document is split into ~500-word chunks for retrieval
export const knowledgeChunks = mysqlTable("knowledge_chunks", {
  id:           int("id").autoincrement().primaryKey(),
  documentId:   int("documentId").notNull(),
  chunkIndex:   int("chunkIndex").notNull(),
  content:      text("content").notNull(),
  wordCount:    int("wordCount").default(0),
  pageNumber:   int("pageNumber"),
  section:      varchar("section", { length: 256 }),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;
export type InsertKnowledgeChunk = typeof knowledgeChunks.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// PEOPLE INTELLIGENCE MODULE
// Sprint 20 — Talent profiles, PVF scoring, team composition, gap analysis
// ═══════════════════════════════════════════════════════════════════════════

// ── Talent Profiles ──────────────────────────────────────────────────────────
export const talentProfiles = mysqlTable("talent_profiles", {
  id:                   int("id").autoincrement().primaryKey(),
  // Identity
  name:                 varchar("name", { length: 128 }).notNull(),
  email:                varchar("email", { length: 255 }),
  linkedIn:             varchar("linkedIn", { length: 255 }),
  location:             varchar("location", { length: 128 }),
  // Role classification
  profileType:          mysqlEnum("profileType", [
                          "Founder", "Operator", "Executive", "Technical Expert",
                          "Advisor", "Mentor", "Supplier", "Partner", "Investor"
                        ]).notNull().default("Operator"),
  currentRole:          varchar("currentRole", { length: 128 }),
  // Availability
  availability:         mysqlEnum("availability", [
                          "Immediately Available", "Available in 1 Month",
                          "Available in 3 Months", "Part-Time Only", "Advisory Only", "Not Available"
                        ]).default("Immediately Available"),
  availabilityHoursPerWeek: int("availabilityHoursPerWeek").default(0),
  // Experience
  yearsExperience:      int("yearsExperience").default(0),
  industryExpertise:    text("industryExpertise"),       // comma-separated sectors
  previousVentures:     int("previousVentures").default(0),
  previousExits:        int("previousExits").default(0),
  previousLeadershipRoles: int("previousLeadershipRoles").default(0),
  // Startup stage experience (0–10 each)
  stageIdea:            int("stageIdea").default(0),
  stageValidation:      int("stageValidation").default(0),
  stageBuild:           int("stageBuild").default(0),
  stageScale:           int("stageScale").default(0),
  // Functional capabilities (0–10 each)
  capTechnical:         int("capTechnical").default(0),
  capCommercial:        int("capCommercial").default(0),
  capOperational:       int("capOperational").default(0),
  capRegulatory:        int("capRegulatory").default(0),
  capManufacturing:     int("capManufacturing").default(0),
  capSupplyChain:       int("capSupplyChain").default(0),
  capFinancial:         int("capFinancial").default(0),
  capMarketing:         int("capMarketing").default(0),
  // Network strength (0–10 each)
  networkInvestors:     int("networkInvestors").default(0),
  networkCustomers:     int("networkCustomers").default(0),
  networkSuppliers:     int("networkSuppliers").default(0),
  networkRegulators:    int("networkRegulators").default(0),
  networkIndustry:      int("networkIndustry").default(0),
  // Behavioural attributes (0–10 each)
  attrLeadership:       int("attrLeadership").default(0),
  attrExecution:        int("attrExecution").default(0),
  attrCollaboration:    int("attrCollaboration").default(0),
  attrRiskTolerance:    int("attrRiskTolerance").default(0),
  attrResilience:       int("attrResilience").default(0),
  // Bio and notes
  bio:                  text("bio"),
  notes:                text("notes"),
  // Timestamps
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TalentProfile = typeof talentProfiles.$inferSelect;
export type InsertTalentProfile = typeof talentProfiles.$inferInsert;

// ── Venture Role Requirements ─────────────────────────────────────────────────
export const ventureRoleRequirements = mysqlTable("venture_role_requirements", {
  id:                   int("id").autoincrement().primaryKey(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  // Role definition
  roleTitle:            varchar("roleTitle", { length: 128 }).notNull(),
  functionalArea:       mysqlEnum("functionalArea", [
                          "Technical", "Commercial", "Operational", "Regulatory",
                          "Manufacturing", "Supply Chain", "Financial", "Marketing", "Leadership"
                        ]).notNull(),
  priority:             mysqlEnum("priority", ["Critical", "High", "Medium", "Low"]).default("High"),
  status:               mysqlEnum("status", ["Open", "Filled", "On Hold"]).default("Open"),
  // Requirements (0–10 minimum thresholds)
  minYearsExperience:   int("minYearsExperience").default(0),
  minCapScore:          int("minCapScore").default(5),
  minNetworkScore:      int("minNetworkScore").default(3),
  minStageExperience:   mysqlEnum("minStageExperience", ["Idea", "Validation", "Build", "Scale"]).default("Validation"),
  requiredSectors:      text("requiredSectors"),         // comma-separated
  // Engagement type
  engagementType:       mysqlEnum("engagementType", ["Full-Time", "Part-Time", "Advisory", "Contract"]).default("Full-Time"),
  description:          text("description"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VentureRoleRequirement = typeof ventureRoleRequirements.$inferSelect;
export type InsertVentureRoleRequirement = typeof ventureRoleRequirements.$inferInsert;

// ── People–Venture Fit Scores (PVF cache) ─────────────────────────────────────
export const peopleVentureFit = mysqlTable("people_venture_fit", {
  id:                   int("id").autoincrement().primaryKey(),
  talentProfileId:      int("talentProfileId").notNull(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  roleRequirementId:    int("roleRequirementId"),        // optional — fit against specific role
  // PVF component scores (0–10 each)
  skillsMatch:          float("skillsMatch").default(0),
  industryMatch:        float("industryMatch").default(0),
  stageMatch:           float("stageMatch").default(0),
  networkValue:         float("networkValue").default(0),
  availabilityFit:      float("availabilityFit").default(0),
  // Computed PVF = (skillsMatch + industryMatch + stageMatch + networkValue + availabilityFit) / 5
  pvfScore:             float("pvfScore").default(0),    // 0–10
  // Recommendation
  recommendation:       mysqlEnum("recommendation", ["Highly Recommended", "Recommended", "Possible", "Not Recommended"]).default("Possible"),
  notes:                text("notes"),
  computedAt:           timestamp("computedAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PeopleVentureFit = typeof peopleVentureFit.$inferSelect;
export type InsertPeopleVentureFit = typeof peopleVentureFit.$inferInsert;

// ── Team Compositions ─────────────────────────────────────────────────────────
export const teamCompositions = mysqlTable("team_compositions", {
  id:                   int("id").autoincrement().primaryKey(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  talentProfileId:      int("talentProfileId").notNull(),
  roleRequirementId:    int("roleRequirementId"),
  // Assignment details
  assignedRole:         varchar("assignedRole", { length: 128 }).notNull(),
  assignmentType:       mysqlEnum("assignmentType", ["Recommended", "Confirmed", "Proposed"]).default("Recommended"),
  engagementType:       mysqlEnum("engagementType", ["Full-Time", "Part-Time", "Advisory", "Contract"]).default("Full-Time"),
  pvfScore:             float("pvfScore").default(0),
  isFounder:            boolean("isFounder").default(false),
  notes:                text("notes"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TeamComposition = typeof teamCompositions.$inferSelect;
export type InsertTeamComposition = typeof teamCompositions.$inferInsert;

// ── Team Gap Analysis ─────────────────────────────────────────────────────────
export const teamGapAnalysis = mysqlTable("team_gap_analysis", {
  id:                   int("id").autoincrement().primaryKey(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  // Gap definition
  gapArea:              mysqlEnum("gapArea", [
                          "Technical", "Commercial", "Operational", "Regulatory",
                          "Manufacturing", "Supply Chain", "Financial", "Marketing",
                          "Leadership", "Network", "Stage Experience"
                        ]).notNull(),
  severity:             mysqlEnum("severity", ["Critical", "High", "Medium", "Low"]).default("Medium"),
  description:          text("description"),
  // Current vs required
  currentScore:         float("currentScore").default(0),   // 0–10 team average
  requiredScore:        float("requiredScore").default(7),   // 0–10 threshold
  gapScore:             float("gapScore").default(0),        // requiredScore - currentScore
  // Resolution
  status:               mysqlEnum("status", ["Open", "In Progress", "Resolved"]).default("Open"),
  resolutionNotes:      text("resolutionNotes"),
  computedAt:           timestamp("computedAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TeamGapAnalysis = typeof teamGapAnalysis.$inferSelect;
export type InsertTeamGapAnalysis = typeof teamGapAnalysis.$inferInsert;

// ── Founder Suitability Assessments ──────────────────────────────────────────
export const founderSuitabilityAssessments = mysqlTable("founder_suitability_assessments", {
  id:                   int("id").autoincrement().primaryKey(),
  talentProfileId:      int("talentProfileId").notNull(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  // Suitability dimensions (0–10 each)
  domainKnowledge:      int("domainKnowledge").default(0),
  executionCapability:  int("executionCapability").default(0),
  leadershipStrength:   int("leadershipStrength").default(0),
  networkRelevance:     int("networkRelevance").default(0),
  stageReadiness:       int("stageReadiness").default(0),
  riskProfile:          int("riskProfile").default(0),
  commitmentLevel:      int("commitmentLevel").default(0),
  // Computed overall suitability score (0–10)
  overallScore:         float("overallScore").default(0),
  // Recommendation
  recommendation:       mysqlEnum("recommendation", [
                          "Highly Suitable", "Suitable", "Conditionally Suitable", "Not Suitable"
                        ]).default("Conditionally Suitable"),
  readinessToExecute:   mysqlEnum("readinessToExecute", [
                          "Ready Now", "Ready in 3 Months", "Ready in 6 Months", "Not Ready"
                        ]).default("Ready in 3 Months"),
  assessmentNotes:      text("assessmentNotes"),
  assessedAt:           timestamp("assessedAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FounderSuitabilityAssessment = typeof founderSuitabilityAssessments.$inferSelect;
export type InsertFounderSuitabilityAssessment = typeof founderSuitabilityAssessments.$inferInsert;


// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT OPPORTUNITY INTELLIGENCE (POI) MODULE
// Brief: POI_module_prompt_brief.docx
// POS = (Cost + Performance + Quality + Sustainability) / 4  (each 1–5)
// ═══════════════════════════════════════════════════════════════════════════════

// ── Product Categories ────────────────────────────────────────────────────────
export const productCategories = mysqlTable("product_categories", {
  id:          int("id").autoincrement().primaryKey(),
  name:        varchar("name", { length: 128 }).notNull(),
  sector:      varchar("sector", { length: 128 }),
  description: text("description"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = typeof productCategories.$inferInsert;

// ── Product Opportunities ─────────────────────────────────────────────────────
// Core entity: a product/technology/system being evaluated before entering VRL
export const productOpportunities = mysqlTable("product_opportunities", {
  id:                  int("id").autoincrement().primaryKey(),
  name:                varchar("name", { length: 255 }).notNull(),
  description:         text("description"),
  categoryId:          int("categoryId"),               // FK → product_categories
  sector:              varchar("sector", { length: 128 }),
  targetMarket:        varchar("targetMarket", { length: 255 }),
  // Lifecycle stage of the product being evaluated
  productStage:        mysqlEnum("productStage", [
                         "Concept", "Prototype", "Pilot", "Commercial", "Mature"
                       ]).default("Concept"),
  // Pipeline status
  status:              mysqlEnum("status", [
                         "Identified", "Under Assessment", "Scored",
                         "Approved for VRL", "Rejected", "On Hold"
                       ]).default("Identified"),
  // Link to venture if converted
  convertedToVentureId: varchar("convertedToVentureId", { length: 64 }),
  submittedBy:         varchar("submittedBy", { length: 128 }),
  notes:               text("notes"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProductOpportunity = typeof productOpportunities.$inferSelect;
export type InsertProductOpportunity = typeof productOpportunities.$inferInsert;

// ── Product Baselines ─────────────────────────────────────────────────────────
// Captures the current-state benchmark for a product before gap analysis
export const productBaselines = mysqlTable("product_baselines", {
  id:                    int("id").autoincrement().primaryKey(),
  productOpportunityId:  int("productOpportunityId").notNull(),
  // Cost baseline
  manufacturingCost:     float("manufacturingCost"),       // £ per unit
  supplyChainCost:       float("supplyChainCost"),
  lifecycleCost:         float("lifecycleCost"),
  // Performance baseline
  technicalCapability:   text("technicalCapability"),
  efficiencyRating:      float("efficiencyRating"),        // % or index
  // Quality baseline
  reliabilityScore:      float("reliabilityScore"),        // 0–10
  durabilityYears:       float("durabilityYears"),
  // Sustainability baseline
  carbonFootprintKg:     float("carbonFootprintKg"),       // kg CO₂e per unit
  esgComplianceLevel:    mysqlEnum("esgComplianceLevel", [
                           "None", "Partial", "Compliant", "Certified"
                         ]).default("None"),
  circularityScore:      float("circularityScore"),        // 0–10
  // Meta
  baselineSource:        varchar("baselineSource", { length: 255 }),
  baselineDate:          varchar("baselineDate", { length: 32 }),
  notes:                 text("notes"),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProductBaseline = typeof productBaselines.$inferSelect;
export type InsertProductBaseline = typeof productBaselines.$inferInsert;

// ── Cost Assessments ──────────────────────────────────────────────────────────
export const costAssessments = mysqlTable("cost_assessments", {
  id:                    int("id").autoincrement().primaryKey(),
  productOpportunityId:  int("productOpportunityId").notNull(),
  // Dimension scores (1–5 per POI spec)
  manufacturingCostScore: int("manufacturingCostScore").default(1),   // 1=very high cost gap, 5=minimal gap
  supplyChainCostScore:   int("supplyChainCostScore").default(1),
  lifecycleCostScore:     int("lifecycleCostScore").default(1),
  // Computed average (1–5)
  costScore:             float("costScore").default(0),
  // Qualitative detail
  currentCostEstimate:   float("currentCostEstimate"),
  targetCostEstimate:    float("targetCostEstimate"),
  costReductionOpportunity: text("costReductionOpportunity"),
  assessedBy:            varchar("assessedBy", { length: 128 }),
  assessedAt:            timestamp("assessedAt"),
  notes:                 text("notes"),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CostAssessment = typeof costAssessments.$inferSelect;
export type InsertCostAssessment = typeof costAssessments.$inferInsert;

// ── Performance Assessments ───────────────────────────────────────────────────
export const performanceAssessments = mysqlTable("performance_assessments", {
  id:                    int("id").autoincrement().primaryKey(),
  productOpportunityId:  int("productOpportunityId").notNull(),
  // Dimension scores (1–5)
  technicalCapabilityScore: int("technicalCapabilityScore").default(1),
  efficiencyScore:          int("efficiencyScore").default(1),
  functionalityScore:       int("functionalityScore").default(1),
  // Computed average (1–5)
  performanceScore:      float("performanceScore").default(0),
  // Qualitative detail
  performanceGapDescription: text("performanceGapDescription"),
  innovationOpportunity:     text("innovationOpportunity"),
  assessedBy:            varchar("assessedBy", { length: 128 }),
  assessedAt:            timestamp("assessedAt"),
  notes:                 text("notes"),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PerformanceAssessment = typeof performanceAssessments.$inferSelect;
export type InsertPerformanceAssessment = typeof performanceAssessments.$inferInsert;

// ── Quality Assessments ───────────────────────────────────────────────────────
export const qualityAssessments = mysqlTable("quality_assessments", {
  id:                    int("id").autoincrement().primaryKey(),
  productOpportunityId:  int("productOpportunityId").notNull(),
  // Dimension scores (1–5)
  reliabilityScore:      int("reliabilityScore").default(1),
  durabilityScore:       int("durabilityScore").default(1),
  userExperienceScore:   int("userExperienceScore").default(1),
  // Computed average (1–5)
  qualityScore:          float("qualityScore").default(0),
  // Qualitative detail
  qualityGapDescription: text("qualityGapDescription"),
  improvementOpportunity: text("improvementOpportunity"),
  assessedBy:            varchar("assessedBy", { length: 128 }),
  assessedAt:            timestamp("assessedAt"),
  notes:                 text("notes"),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type QualityAssessment = typeof qualityAssessments.$inferSelect;
export type InsertQualityAssessment = typeof qualityAssessments.$inferInsert;

// ── Sustainability Assessments ────────────────────────────────────────────────
export const sustainabilityAssessments = mysqlTable("sustainability_assessments", {
  id:                    int("id").autoincrement().primaryKey(),
  productOpportunityId:  int("productOpportunityId").notNull(),
  // Dimension scores (1–5)
  carbonFootprintScore:  int("carbonFootprintScore").default(1),
  esgComplianceScore:    int("esgComplianceScore").default(1),
  circularityScore:      int("circularityScore").default(1),
  // Computed average (1–5)
  sustainabilityScore:   float("sustainabilityScore").default(0),
  // Qualitative detail
  sustainabilityGapDescription: text("sustainabilityGapDescription"),
  circularityOpportunity: text("circularityOpportunity"),
  assessedBy:            varchar("assessedBy", { length: 128 }),
  assessedAt:            timestamp("assessedAt"),
  notes:                 text("notes"),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SustainabilityAssessment = typeof sustainabilityAssessments.$inferSelect;
export type InsertSustainabilityAssessment = typeof sustainabilityAssessments.$inferInsert;

// ── Product Opportunity Scores (POS cache) ────────────────────────────────────
// POS = (Cost + Performance + Quality + Sustainability) / 4
export const productOpportunityScores = mysqlTable("product_opportunity_scores", {
  id:                    int("id").autoincrement().primaryKey(),
  productOpportunityId:  int("productOpportunityId").notNull().unique(),
  costScore:             float("costScore").default(0),           // 1–5
  performanceScore:      float("performanceScore").default(0),    // 1–5
  qualityScore:          float("qualityScore").default(0),        // 1–5
  sustainabilityScore:   float("sustainabilityScore").default(0), // 1–5
  // POS = average of above four (1–5)
  posScore:              float("posScore").default(0),
  // Classification band
  posClassification:     mysqlEnum("posClassification", [
                           "Low Opportunity",       // 1.0–2.0
                           "Moderate Opportunity",  // 2.1–3.0
                           "High Opportunity",      // 3.1–4.0
                           "Exceptional Opportunity" // 4.1–5.0
                         ]).default("Low Opportunity"),
  computedAt:            timestamp("computedAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProductOpportunityScore = typeof productOpportunityScores.$inferSelect;
export type InsertProductOpportunityScore = typeof productOpportunityScores.$inferInsert;

// ── Opportunity Reviews ───────────────────────────────────────────────────────
// Panel review decisions on scored product opportunities
export const opportunityReviews = mysqlTable("opportunity_reviews", {
  id:                    int("id").autoincrement().primaryKey(),
  productOpportunityId:  int("productOpportunityId").notNull(),
  reviewerName:          varchar("reviewerName", { length: 128 }).notNull(),
  reviewerRole:          varchar("reviewerRole", { length: 128 }),
  decision:              mysqlEnum("decision", [
                           "Approve for VRL", "Reject", "Defer", "Request More Data"
                         ]).notNull(),
  rationale:             text("rationale"),
  conditionsForApproval: text("conditionsForApproval"),
  reviewedAt:            timestamp("reviewedAt").defaultNow().notNull(),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
});
export type OpportunityReview = typeof opportunityReviews.$inferSelect;
export type InsertOpportunityReview = typeof opportunityReviews.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// VENTURE PROJECT MANAGEMENT MODULE
// Brief: project_management_module_prompt_brief.docx
// Hierarchy: Venture → Program → Phase (VRL Stage) → Workstream → Milestone → Task
// ═══════════════════════════════════════════════════════════════════════════════

// ── Venture Programs ──────────────────────────────────────────────────────────
// Top-level execution container for a venture (one or more programs per venture)
export const venturePrograms = mysqlTable("venture_programs", {
  id:           int("id").autoincrement().primaryKey(),
  ventureId:    varchar("ventureId", { length: 64 }).notNull(),
  name:         varchar("name", { length: 255 }).notNull(),
  description:  text("description"),
  status:       mysqlEnum("status", [
                  "Not Started", "In Progress", "On Hold", "Completed", "Cancelled"
                ]).default("Not Started"),
  startDate:    varchar("startDate", { length: 32 }),
  targetEndDate: varchar("targetEndDate", { length: 32 }),
  actualEndDate: varchar("actualEndDate", { length: 32 }),
  programManager: varchar("programManager", { length: 128 }),
  budget:       int("budget").default(0),                // £
  budgetSpent:  int("budgetSpent").default(0),
  notes:        text("notes"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VentureProgram = typeof venturePrograms.$inferSelect;
export type InsertVentureProgram = typeof venturePrograms.$inferInsert;

// ── Venture Phases ────────────────────────────────────────────────────────────
// Maps to a VRL stage within a program (e.g., Phase 1 = VRL Stage 1: Opportunity)
export const venturePhases = mysqlTable("venture_phases", {
  id:           int("id").autoincrement().primaryKey(),
  programId:    int("programId").notNull(),              // FK → venture_programs
  ventureId:    varchar("ventureId", { length: 64 }).notNull(),
  name:         varchar("name", { length: 255 }).notNull(),
  vrlStage:     int("vrlStage"),                         // 1–4 VRL stage this phase maps to
  phaseNumber:  int("phaseNumber").notNull(),             // sequence within program
  status:       mysqlEnum("status", [
                  "Not Started", "In Progress", "On Hold", "Completed", "Cancelled"
                ]).default("Not Started"),
  startDate:    varchar("startDate", { length: 32 }),
  targetEndDate: varchar("targetEndDate", { length: 32 }),
  actualEndDate: varchar("actualEndDate", { length: 32 }),
  completionPercent: int("completionPercent").default(0), // 0–100
  gateReviewPassed: boolean("gateReviewPassed").default(false),
  gateReviewDate:   varchar("gateReviewDate", { length: 32 }),
  gateReviewNotes:  text("gateReviewNotes"),
  notes:        text("notes"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VenturePhase = typeof venturePhases.$inferSelect;
export type InsertVenturePhase = typeof venturePhases.$inferInsert;

// ── Venture Workstreams ───────────────────────────────────────────────────────
// Parallel workstreams within a phase (e.g., Technical, Commercial, Legal)
export const ventureWorkstreams = mysqlTable("venture_workstreams", {
  id:           int("id").autoincrement().primaryKey(),
  phaseId:      int("phaseId").notNull(),                // FK → venture_phases
  ventureId:    varchar("ventureId", { length: 64 }).notNull(),
  name:         varchar("name", { length: 255 }).notNull(),
  functionalArea: mysqlEnum("functionalArea", [
                    "Technical", "Commercial", "Legal", "Financial",
                    "Marketing", "Operations", "People", "ESG", "Other"
                  ]).default("Other"),
  owner:        varchar("owner", { length: 128 }),
  status:       mysqlEnum("status", [
                  "Not Started", "In Progress", "On Hold", "Completed"
                ]).default("Not Started"),
  completionPercent: int("completionPercent").default(0),
  startDate:    varchar("startDate", { length: 32 }),
  targetEndDate: varchar("targetEndDate", { length: 32 }),
  notes:        text("notes"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VentureWorkstream = typeof ventureWorkstreams.$inferSelect;
export type InsertVentureWorkstream = typeof ventureWorkstreams.$inferInsert;

// ── Venture Milestones (PM module) ────────────────────────────────────────────
// Formal gate milestones within a workstream (distinct from the simpler
// `milestones` table which is used for the portfolio overview cards)
export const ventureMilestones = mysqlTable("venture_milestones", {
  id:              int("id").autoincrement().primaryKey(),
  workstreamId:    int("workstreamId").notNull(),         // FK → venture_workstreams
  phaseId:         int("phaseId").notNull(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  title:           varchar("title", { length: 255 }).notNull(),
  description:     text("description"),
  milestoneType:   mysqlEnum("milestoneType", [
                     "Gate Review", "Deliverable", "Decision Point",
                     "External Event", "Funding Milestone", "Launch"
                   ]).default("Deliverable"),
  status:          mysqlEnum("status", [
                     "Not Started", "In Progress", "Completed", "Overdue", "Cancelled"
                   ]).default("Not Started"),
  targetDate:      varchar("targetDate", { length: 32 }),
  completedAt:     timestamp("completedAt"),
  completionEvidence: text("completionEvidence"),
  sortOrder:       int("sortOrder").default(0),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VentureMilestone = typeof ventureMilestones.$inferSelect;
export type InsertVentureMilestone = typeof ventureMilestones.$inferInsert;

// ── Venture Tasks ─────────────────────────────────────────────────────────────
// Granular tasks within a workstream (supports Kanban and Gantt views)
export const ventureTasks = mysqlTable("venture_tasks", {
  id:              int("id").autoincrement().primaryKey(),
  workstreamId:    int("workstreamId").notNull(),         // FK → venture_workstreams
  milestoneId:     int("milestoneId"),                    // optional FK → venture_milestones
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  title:           varchar("title", { length: 255 }).notNull(),
  description:     text("description"),
  // Kanban status
  kanbanStatus:    mysqlEnum("kanbanStatus", [
                     "Backlog", "To Do", "In Progress", "In Review", "Done", "Blocked"
                   ]).default("Backlog"),
  priority:        mysqlEnum("priority", ["Critical", "High", "Medium", "Low"]).default("Medium"),
  assignee:        varchar("assignee", { length: 128 }),
  // Gantt scheduling
  startDate:       varchar("startDate", { length: 32 }),
  dueDate:         varchar("dueDate", { length: 32 }),
  completedAt:     timestamp("completedAt"),
  estimatedHours:  float("estimatedHours").default(0),
  actualHours:     float("actualHours").default(0),
  // Dependencies (comma-separated task IDs)
  dependsOnTaskIds: text("dependsOnTaskIds"),
  sortOrder:       int("sortOrder").default(0),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VentureTask = typeof ventureTasks.$inferSelect;
export type InsertVentureTask = typeof ventureTasks.$inferInsert;

// ── Venture Resources ─────────────────────────────────────────────────────────
// People and budget resources allocated to programs/phases
export const ventureResources = mysqlTable("venture_resources", {
  id:              int("id").autoincrement().primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  programId:       int("programId"),                     // FK → venture_programs
  phaseId:         int("phaseId"),                       // FK → venture_phases (optional)
  resourceType:    mysqlEnum("resourceType", [
                     "Person", "Budget", "Equipment", "External Service"
                   ]).default("Person"),
  name:            varchar("name", { length: 128 }).notNull(),
  role:            varchar("role", { length: 128 }),
  // Allocation
  allocationPercent: int("allocationPercent").default(100), // % of time allocated
  allocationHoursPerWeek: float("allocationHoursPerWeek"),
  startDate:       varchar("startDate", { length: 32 }),
  endDate:         varchar("endDate", { length: 32 }),
  // Cost
  dayRate:         int("dayRate").default(0),             // £ per day
  totalBudgeted:   int("totalBudgeted").default(0),
  totalActual:     int("totalActual").default(0),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VentureResource = typeof ventureResources.$inferSelect;
export type InsertVentureResource = typeof ventureResources.$inferInsert;

// ── Venture Dependencies ──────────────────────────────────────────────────────
// Explicit dependency links between tasks, milestones, or phases
export const ventureDependencies = mysqlTable("venture_dependencies", {
  id:              int("id").autoincrement().primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  // Source entity (the item that must be completed first)
  sourceType:      mysqlEnum("sourceType", ["task", "milestone", "phase"]).notNull(),
  sourceId:        int("sourceId").notNull(),
  // Target entity (the item that depends on the source)
  targetType:      mysqlEnum("targetType", ["task", "milestone", "phase"]).notNull(),
  targetId:        int("targetId").notNull(),
  dependencyType:  mysqlEnum("dependencyType", [
                     "Finish-to-Start",   // target cannot start until source finishes
                     "Start-to-Start",    // target cannot start until source starts
                     "Finish-to-Finish",  // target cannot finish until source finishes
                     "Start-to-Finish",   // target cannot finish until source starts
                   ]).default("Finish-to-Start"),
  lagDays:         int("lagDays").default(0),             // delay after dependency is met
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type VentureDependency = typeof ventureDependencies.$inferSelect;
export type InsertVentureDependency = typeof ventureDependencies.$inferInsert;

// ── Venture Documents ─────────────────────────────────────────────────────────
// Document repository linked to programs, phases, workstreams, or tasks
export const ventureDocuments = mysqlTable("venture_documents", {
  id:              int("id").autoincrement().primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  // Optional parent context
  programId:       int("programId"),
  phaseId:         int("phaseId"),
  workstreamId:    int("workstreamId"),
  taskId:          int("taskId"),
  milestoneId:     int("milestoneId"),
  // Document metadata
  title:           varchar("title", { length: 255 }).notNull(),
  documentType:    mysqlEnum("documentType", [
                     "Brief", "Report", "Contract", "Presentation", "Spreadsheet",
                     "Design", "Technical Spec", "Research", "Financial Model",
                     "Meeting Notes", "Other"
                   ]).default("Other"),
  version:         varchar("version", { length: 32 }).default("1.0"),
  status:          mysqlEnum("status", [
                     "Draft", "Under Review", "Approved", "Superseded", "Archived"
                   ]).default("Draft"),
  // Storage
  fileName:        varchar("fileName", { length: 255 }).notNull(),
  fileKey:         varchar("fileKey", { length: 512 }).notNull(),
  fileUrl:         text("fileUrl").notNull(),
  mimeType:        varchar("mimeType", { length: 128 }),
  fileSizeBytes:   int("fileSizeBytes").default(0),
  // Ownership
  uploadedBy:      varchar("uploadedBy", { length: 128 }),
  approvedBy:      varchar("approvedBy", { length: 128 }),
  approvedAt:      timestamp("approvedAt"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VentureDocument = typeof ventureDocuments.$inferSelect;
export type InsertVentureDocument = typeof ventureDocuments.$inferInsert;

// ── Execution Risk Register (PM module) ──────────────────────────────────────
// Execution-level risks tied to specific programs, phases, or workstreams
// (Distinct from the portfolio-level `risks` table which tracks venture-wide risks)
export const executionRisks = mysqlTable("execution_risks", {
  id:              int("id").autoincrement().primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  programId:       int("programId"),
  phaseId:         int("phaseId"),
  workstreamId:    int("workstreamId"),
  title:           varchar("title", { length: 255 }).notNull(),
  description:     text("description"),
  riskCategory:    mysqlEnum("riskCategory", [
                     "Schedule", "Budget", "Resource", "Technical", "Dependency",
                     "Regulatory", "Stakeholder", "Scope", "Quality"
                   ]).default("Schedule"),
  likelihood:      mysqlEnum("likelihood", ["Very Low", "Low", "Medium", "High", "Very High"]).default("Medium"),
  impact:          mysqlEnum("impact", ["Negligible", "Minor", "Moderate", "Major", "Critical"]).default("Moderate"),
  riskScore:       int("riskScore").default(0),            // likelihood × impact (1–25)
  riskLevel:       mysqlEnum("riskLevel", ["Low", "Medium", "High", "Critical"]).default("Medium"),
  mitigationPlan:  text("mitigationPlan"),
  contingencyPlan: text("contingencyPlan"),
  owner:           varchar("owner", { length: 128 }),
  status:          mysqlEnum("status", [
                     "Open", "Mitigated", "Accepted", "Closed", "Escalated"
                   ]).default("Open"),
  reviewDate:      varchar("reviewDate", { length: 32 }),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ExecutionRisk = typeof executionRisks.$inferSelect;
export type InsertExecutionRisk = typeof executionRisks.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND CENTRE DASHBOARD — AGGREGATION SUPPORT
// Brief: command_centre_dashboard_prompt_brief.docx
// Provides pre-computed summary rows for dashboard widgets to avoid
// expensive real-time aggregations across large venture portfolios.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Dashboard KPI Snapshots ───────────────────────────────────────────────────
// Cached portfolio-level KPIs refreshed on a scheduled basis
export const dashboardKpiSnapshots = mysqlTable("dashboard_kpi_snapshots", {
  id:                       int("id").autoincrement().primaryKey(),
  snapshotDate:             varchar("snapshotDate", { length: 32 }).notNull(), // "2026-03"
  // Venture ecosystem metrics
  totalVentures:            int("totalVentures").default(0),
  activeVentures:           int("activeVentures").default(0),
  prelaunchVentures:        int("prelaunchVentures").default(0),
  scalingVentures:          int("scalingVentures").default(0),
  pausedVentures:           int("pausedVentures").default(0),
  // VRL stage distribution
  vrlStage1Count:           int("vrlStage1Count").default(0),
  vrlStage2Count:           int("vrlStage2Count").default(0),
  vrlStage3Count:           int("vrlStage3Count").default(0),
  vrlStage4Count:           int("vrlStage4Count").default(0),
  avgVrlScore:              float("avgVrlScore").default(0),
  investmentReadyCount:     int("investmentReadyCount").default(0),
  // Project management metrics
  activeProjects:           int("activeProjects").default(0),
  totalMilestonesThisMonth: int("totalMilestonesThisMonth").default(0),
  milestonesCompletedThisMonth: int("milestonesCompletedThisMonth").default(0),
  overdueTasksCount:        int("overdueTasksCount").default(0),
  // Opportunity pipeline metrics
  opportunitiesIdentified:  int("opportunitiesIdentified").default(0),
  opportunitiesScored:      int("opportunitiesScored").default(0),
  opportunitiesApproved:    int("opportunitiesApproved").default(0),
  avgPosScore:              float("avgPosScore").default(0),
  // Financial metrics
  totalRevenueActual:       int("totalRevenueActual").default(0),    // £ across portfolio
  totalInvestmentRaised:    int("totalInvestmentRaised").default(0), // £ across portfolio
  portfolioRoi:             float("portfolioRoi").default(0),        // %
  // Impact / ESG metrics
  avgIrlScore:              float("avgIrlScore").default(0),
  avgEsgScore:              float("avgEsgScore").default(0),
  certifiedVenturesCount:   int("certifiedVenturesCount").default(0),
  computedAt:               timestamp("computedAt").defaultNow().notNull(),
});
export type DashboardKpiSnapshot = typeof dashboardKpiSnapshots.$inferSelect;
export type InsertDashboardKpiSnapshot = typeof dashboardKpiSnapshots.$inferInsert;

// ── Venture Ecosystem Map Nodes ───────────────────────────────────────────────
// Stores positioning and metadata for the venture ecosystem map widget
export const ecosystemMapNodes = mysqlTable("ecosystem_map_nodes", {
  id:              int("id").autoincrement().primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull().unique(),
  // Visual positioning (relative coordinates 0–100)
  posX:            float("posX").default(50),
  posY:            float("posY").default(50),
  // Node metadata for the map
  nodeSize:        int("nodeSize").default(40),              // pixel radius
  nodeColor:       varchar("nodeColor", { length: 32 }),
  // Relationship links (comma-separated venture IDs)
  linkedVentureIds: text("linkedVentureIds"),
  linkType:        mysqlEnum("linkType", [
                     "Technology Sharing", "Market Overlap", "Shared Founder",
                     "Supply Chain", "Co-Investment", "None"
                   ]).default("None"),
  // Display labels
  displayLabel:    varchar("displayLabel", { length: 64 }),
  tooltipText:     text("tooltipText"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EcosystemMapNode = typeof ecosystemMapNodes.$inferSelect;
export type InsertEcosystemMapNode = typeof ecosystemMapNodes.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// MATCHING ENGINE & SPIN-OFF OS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Founder Match Scores ──────────────────────────────────────────────────────
// Stores computed compatibility scores between a founder (talent_profile) and
// a product opportunity (product_opportunities). Recomputed on demand or on
// new founder onboarding.
export const founderMatchScores = mysqlTable("founder_match_scores", {
  id:                   int("id").autoincrement().primaryKey(),
  // The founder being evaluated (references talent_profiles.id)
  talentProfileId:      int("talentProfileId").notNull(),
  // The opportunity being matched against (references product_opportunities.id)
  productOpportunityId: int("productOpportunityId").notNull(),
  // Dimension scores (0–100 each)
  sectorAlignmentScore:     int("sectorAlignmentScore").default(0),   // sector tag overlap
  capabilityFitScore:       int("capabilityFitScore").default(0),     // capability vs opportunity requirements
  availabilityScore:        int("availabilityScore").default(0),      // hours/week vs estimated demand
  pvfScore:                 int("pvfScore").default(0),               // personal values fit (ESG/mission)
  experienceScore:          int("experienceScore").default(0),        // years + previous ventures
  networkScore:             int("networkScore").default(0),           // investor/customer/supplier network
  // Composite match score (weighted average, 0–100)
  overallMatchScore:        int("overallMatchScore").default(0),
  // Recommended role for this founder on this opportunity
  recommendedRole:          varchar("recommendedRole", { length: 128 }),
  // Narrative explanation (LLM-generated)
  matchRationale:           text("matchRationale"),
  // Status of this match
  status:                   mysqlEnum("status", [
                              "Suggested",    // auto-generated, not yet reviewed
                              "Reviewed",     // VBS team has reviewed
                              "Accepted",     // founder accepted the match
                              "Declined",     // founder declined
                              "Converted"     // match led to a spin-off
                            ]).default("Suggested"),
  computedAt:               timestamp("computedAt").defaultNow().notNull(),
  updatedAt:                timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FounderMatchScore = typeof founderMatchScores.$inferSelect;
export type InsertFounderMatchScore = typeof founderMatchScores.$inferInsert;

// ── Co-Founder Compatibility Scores ──────────────────────────────────────────
// Pairwise compatibility between two talent profiles for a given opportunity.
// Captures complementarity (different strengths) rather than similarity.
export const coFounderCompatibility = mysqlTable("co_founder_compatibility", {
  id:                   int("id").autoincrement().primaryKey(),
  talentProfileIdA:     int("talentProfileIdA").notNull(),
  talentProfileIdB:     int("talentProfileIdB").notNull(),
  productOpportunityId: int("productOpportunityId"),    // optional — context-specific
  // Complementarity dimensions (0–100)
  capabilityComplementScore: int("capabilityComplementScore").default(0), // different strengths
  valueAlignmentScore:       int("valueAlignmentScore").default(0),       // shared mission/values
  workingStyleScore:         int("workingStyleScore").default(0),         // collaboration fit
  networkComplementScore:    int("networkComplementScore").default(0),    // different networks
  // Composite
  overallCompatibilityScore: int("overallCompatibilityScore").default(0),
  compatibilityRationale:    text("compatibilityRationale"),
  computedAt:                timestamp("computedAt").defaultNow().notNull(),
});
export type CoFounderCompatibility = typeof coFounderCompatibility.$inferSelect;
export type InsertCoFounderCompatibility = typeof coFounderCompatibility.$inferInsert;

// ── Spin-Off Configurations ───────────────────────────────────────────────────
// The "operating system" record for a new spin-off. Aggregates all inputs:
// the opportunity, the founding team, the resource plan, and the VBS support
// structure. This is the single source of truth before a venture is created.
export const spinoffConfigurations = mysqlTable("spinoff_configurations", {
  id:                   int("id").autoincrement().primaryKey(),
  // Core linkages
  productOpportunityId: int("productOpportunityId").notNull(),
  // Founding team (comma-separated talent_profile IDs)
  founderProfileIds:    text("founderProfileIds").notNull(),
  // Venture identity
  proposedVentureName:  varchar("proposedVentureName", { length: 128 }),
  proposedTagline:      text("proposedTagline"),
  proposedSector:       varchar("proposedSector", { length: 128 }),
  proposedChannel:      mysqlEnum("proposedChannel", ["B2B", "D2C", "B2B2C"]).default("B2B"),
  proposedBrandColor:   varchar("proposedBrandColor", { length: 32 }).default("#22c55e"),
  // Strategic classification
  strategicClassification: mysqlEnum("strategicClassification", [
    "Sustaining", "Disruptive-NewMarket", "Disruptive-LowEnd"
  ]).default("Sustaining"),
  engineOfGrowth:       mysqlEnum("engineOfGrowth", ["Sticky", "Viral", "Paid"]),
  // Resource plan
  estimatedBurnRateMonthly: int("estimatedBurnRateMonthly").default(0),  // £/month
  estimatedRunwayMonths:    int("estimatedRunwayMonths").default(12),
  fundingAskAmount:         int("fundingAskAmount").default(0),           // £
  nominatedCharity:         varchar("nominatedCharity", { length: 255 }),
  // VBS support
  assignedMentor:           varchar("assignedMentor", { length: 128 }),
  vbsSupportLevel:          mysqlEnum("vbsSupportLevel", [
                              "Full Incubation",   // full studio support
                              "Accelerator",       // 3-month intensive
                              "Advisory Only"      // light-touch
                            ]).default("Full Incubation"),
  // Workflow status
  status:                   mysqlEnum("status", [
                              "Draft",
                              "Under Review",
                              "Approved",
                              "Rejected",
                              "Launched"          // venture record created
                            ]).default("Draft"),
  convertedToVentureId:     varchar("convertedToVentureId", { length: 64 }),
  // Timestamps
  createdAt:                timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SpinoffConfiguration = typeof spinoffConfigurations.$inferSelect;
export type InsertSpinoffConfiguration = typeof spinoffConfigurations.$inferInsert;

// ── Spin-Off Execution Plans ──────────────────────────────────────────────────
// The auto-generated 90-day execution plan for a spin-off. Contains structured
// milestones, resource assignments, and risk flags. Generated by the LLM from
// the spinoff_configuration inputs.
export const spinoffExecutionPlans = mysqlTable("spinoff_execution_plans", {
  id:                   int("id").autoincrement().primaryKey(),
  spinoffConfigId:      int("spinoffConfigId").notNull(),
  // Plan metadata
  planVersion:          int("planVersion").default(1),
  planTitle:            varchar("planTitle", { length: 255 }),
  executiveSummary:     text("executiveSummary"),
  // Full plan content (LLM-generated markdown)
  fullPlanMarkdown:     text("fullPlanMarkdown"),
  // Structured milestones (JSON array: [{week, title, owner, deliverable, kpi}])
  milestonesJson:       text("milestonesJson"),
  // Resource allocation (JSON: {founders: [], mentors: [], budget: {}})
  resourceAllocationJson: text("resourceAllocationJson"),
  // Risk register (JSON array: [{risk, likelihood, impact, mitigation}])
  risksJson:            text("risksJson"),
  // KPI framework (JSON: {primary: [], secondary: []})
  kpiFrameworkJson:     text("kpiFrameworkJson"),
  // Generation metadata
  generatedBy:          varchar("generatedBy", { length: 64 }).default("llm"),
  generatedAt:          timestamp("generatedAt").defaultNow().notNull(),
  // Review status
  reviewedBy:           varchar("reviewedBy", { length: 128 }),
  reviewedAt:           timestamp("reviewedAt"),
  status:               mysqlEnum("status", [
                          "Draft", "Under Review", "Approved", "Superseded"
                        ]).default("Draft"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SpinoffExecutionPlan = typeof spinoffExecutionPlans.$inferSelect;
export type InsertSpinoffExecutionPlan = typeof spinoffExecutionPlans.$inferInsert;

// ── Spin-Off Status History ───────────────────────────────────────────────────────────────────────────────
// Audit trail of every status transition on a spinoff_configuration.
// Written automatically by the advanceSpinoffStatus procedure.
export const spinoffStatusHistory = mysqlTable("spinoff_status_history", {
  id:               int("id").autoincrement().primaryKey(),
  spinoffConfigId:  int("spinoffConfigId").notNull(),
  fromStatus:       varchar("fromStatus", { length: 64 }),
  toStatus:         varchar("toStatus", { length: 64 }).notNull(),
  reviewedBy:       varchar("reviewedBy", { length: 128 }),
  reason:           text("reason"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type SpinoffStatusHistory = typeof spinoffStatusHistory.$inferSelect;
export type InsertSpinoffStatusHistory = typeof spinoffStatusHistory.$inferInsert;

// ── Contract Architecture Layers ─────────────────────────────────────────────
// Four-layer contract architecture from the Contract Architecture Map document.
export const contractLayers = mysqlTable("contract_layers", {
  id:          int("id").autoincrement().primaryKey(),
  layerKey:    varchar("layerKey", { length: 64 }).notNull().unique(),
  name:        varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  color:       varchar("color", { length: 16 }),
  sortOrder:   int("sortOrder").default(0),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type ContractLayer = typeof contractLayers.$inferSelect;
export type InsertContractLayer = typeof contractLayers.$inferInsert;

// ── Contract Type Registry ────────────────────────────────────────────────────
// Full 20-contract type registry from the Commercial Contracts Matrix document.
export const contractTypeRegistry = mysqlTable("contract_type_registry", {
  id:           int("id").autoincrement().primaryKey(),
  layerKey:     varchar("layerKey", { length: 64 }).notNull(),
  contractType: varchar("contractType", { length: 128 }).notNull(),
  useCase:      text("useCase").notNull(),
  riskLevel:    mysqlEnum("riskLevel", ["Low", "Medium", "High", "Critical"]).default("Medium"),
  status:       mysqlEnum("status", ["Active", "Draft", "Pending", "Not Required", "Expired"]).default("Draft"),
  owner:        varchar("owner", { length: 128 }),
  notes:        text("notes"),
  expiryDate:   date("expiryDate"),
  documentUrl:  text("documentUrl"),
  documentKey:  varchar("documentKey", { length: 512 }),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ContractTypeRegistry = typeof contractTypeRegistry.$inferSelect;
export type InsertContractTypeRegistry = typeof contractTypeRegistry.$inferInsert;

// ── Legal Risk Items ──────────────────────────────────────────────────────────
// Legal Risk Map: key risk areas, mitigations, and high-risk zones.
export const legalRiskItems = mysqlTable("legal_risk_items", {
  id:              int("id").autoincrement().primaryKey(),
  riskArea:        varchar("riskArea", { length: 128 }).notNull(),
  description:     text("description"),
  riskZone:        mysqlEnum("riskZone", ["High", "Medium", "Low"]).default("Medium"),
  mitigation:      text("mitigation"),
  linkedLayer:     varchar("linkedLayer", { length: 64 }),
  linkedContracts: text("linkedContracts"),
  status:          mysqlEnum("status", ["Open", "Mitigated", "Monitoring", "Closed"]).default("Open"),
  owner:           varchar("owner", { length: 128 }),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LegalRiskItem = typeof legalRiskItems.$inferSelect;
export type InsertLegalRiskItem = typeof legalRiskItems.$inferInsert;

// ── Legal Risk Escalations ────────────────────────────────────────────────────────────────────────────────
// Audit trail for escalated legal risks.
export const legalRiskEscalations = mysqlTable("legal_risk_escalations", {
  id:          int("id").autoincrement().primaryKey(),
  riskItemId:  int("riskItemId").notNull(),
  escalatedBy: varchar("escalatedBy", { length: 128 }).notNull(),
  reason:      text("reason"),
  notifiedAt:  timestamp("notifiedAt").defaultNow().notNull(),
  resolvedAt:  timestamp("resolvedAt"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type LegalRiskEscalation = typeof legalRiskEscalations.$inferSelect;
export type InsertLegalRiskEscalation = typeof legalRiskEscalations.$inferInsert;

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  DYNAMIC EQUITY ENGINE — Sprint 36                                          ║
// ║  Based on EcoBlend Dynamic Equity Model specification                       ║
// ║  Formula: Score = (0.4×VRL) + (0.3×Contribution) + (0.2×Capital) + (0.1×Perf)║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ── Equity Rules (configurable weighting per venture) ────────────────────────
// Stores the formula weights for each venture's equity engine.
// Defaults match the specification: VRL 40%, Contribution 30%, Capital 20%, Performance 10%.
export const equityRules = mysqlTable("equity_rules", {
  id:                  int("id").autoincrement().primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull().unique(),
  vrlWeight:           float("vrlWeight").notNull().default(0.4),
  contributionWeight:  float("contributionWeight").notNull().default(0.3),
  capitalWeight:       float("capitalWeight").notNull().default(0.2),
  performanceWeight:   float("performanceWeight").notNull().default(0.1),
  totalEquityPool:     float("totalEquityPool").notNull().default(20.0), // % of venture equity in ESOP pool
  notes:               text("notes"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EquityRule = typeof equityRules.$inferSelect;
export type InsertEquityRule = typeof equityRules.$inferInsert;

// ── Equity Allocations (per-member dynamic equity record) ────────────────────
// Tracks each team member's current equity allocation and computed dynamic score.
export const equityAllocations = mysqlTable("equity_allocations", {
  id:                  int("id").autoincrement().primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  memberName:          varchar("memberName", { length: 128 }).notNull(),
  memberRole:          mysqlEnum("memberRole", ["Founder","Co-Founder","Lead Engineer","VBS Mentor","Advisor","Operator","Investor"]).default("Founder"),
  // Static equity allocation (legal)
  equityPct:           float("equityPct").notNull().default(0),
  // Vesting schedule
  vestingMonths:       int("vestingMonths").default(48),
  cliffMonths:         int("cliffMonths").default(12),
  monthsIn:            int("monthsIn").default(0),
  vestingStatus:       mysqlEnum("vestingStatus", ["Not Started","Cliff","Vesting","Fully Vested"]).default("Not Started"),
  // Dynamic equity score components (0–10 scale each)
  vrlScore:            float("vrlScore").default(0),          // VRL contribution score
  contributionScore:   float("contributionScore").default(0), // Task/milestone effort score
  capitalInput:        float("capitalInput").default(0),      // Capital contributed (£k)
  performanceScore:    float("performanceScore").default(0),  // Revenue/traction KPIs
  // Computed dynamic equity score (formula result)
  dynamicEquityScore:  float("dynamicEquityScore").default(0), // 0–10
  dynamicEquityPct:    float("dynamicEquityPct").default(0),   // % of pool earned
  // Stipend
  stipendStatus:       mysqlEnum("stipendStatus", ["Active","Completed","Pending","Paused"]).default("Pending"),
  stipendMonthly:      float("stipendMonthly").default(0),
  stipendMonthsTotal:  int("stipendMonthsTotal").default(6),
  stipendMonthsUsed:   int("stipendMonthsUsed").default(0),
  // Legal conversion status
  legallyConverted:    boolean("legallyConverted").default(false),
  conversionDate:      timestamp("conversionDate"),
  shareClass:          varchar("shareClass", { length: 64 }),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EquityAllocation = typeof equityAllocations.$inferSelect;
export type InsertEquityAllocation = typeof equityAllocations.$inferInsert;

// ── Contribution Logs (event-level contribution tracking) ────────────────────
// Records every contribution event that feeds into the equity engine.
export const contributionLogs = mysqlTable("contribution_logs", {
  id:                  int("id").autoincrement().primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  allocationId:        int("allocationId").notNull(), // FK → equity_allocations.id
  memberName:          varchar("memberName", { length: 128 }).notNull(),
  contributionType:    mysqlEnum("contributionType", [
    "Task Completion",    // BRL/TRL task completed
    "Milestone Achieved", // Key venture milestone hit
    "Capital Injection",  // Cash/asset contribution
    "Commercial Traction",// Revenue, customer, or partnership win
    "VRL Progression",    // VRL level advancement
    "IP Filing",          // Patent, trademark, or design filing
    "Team Building",      // Key hire or partnership formed
    "Other",
  ]).notNull(),
  description:         text("description"),
  valueScore:          float("valueScore").notNull().default(0), // 0–10 impact score
  capitalAmount:       float("capitalAmount").default(0),        // £ if capital type
  evidenceUrl:         varchar("evidenceUrl", { length: 512 }),
  loggedAt:            timestamp("loggedAt").defaultNow().notNull(),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
});
export type ContributionLog = typeof contributionLogs.$inferSelect;
export type InsertContributionLog = typeof contributionLogs.$inferInsert;

// ── Equity Milestones (legal conversion trigger points) ──────────────────────
// Defines the milestones at which dynamic equity converts to legal equity.
// Per spec: End of Validation (VRL 5), Pre-Seed Funding, Series A.
export const equityMilestones = mysqlTable("equity_milestones", {
  id:                  int("id").autoincrement().primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  milestoneName:       varchar("milestoneName", { length: 128 }).notNull(),
  milestoneType:       mysqlEnum("milestoneType", [
    "VRL Gate",          // VRL level threshold reached
    "Pre-Seed Funding",  // First external funding round
    "Seed Funding",      // Seed round
    "Series A",          // Series A round
    "Revenue Target",    // Commercial traction milestone
    "Custom",
  ]).notNull(),
  triggerVrlLevel:     int("triggerVrlLevel"),          // VRL level that triggers conversion
  triggerRevenueGbp:   float("triggerRevenueGbp"),      // Revenue threshold (£)
  description:         text("description"),
  status:              mysqlEnum("status", ["Pending","Active","Triggered","Completed"]).default("Pending"),
  triggeredAt:         timestamp("triggeredAt"),
  legalStructure:      text("legalStructure"),          // Share class, option pool, vesting notes
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EquityMilestone = typeof equityMilestones.$inferSelect;
export type InsertEquityMilestone = typeof equityMilestones.$inferInsert;

// ── Venture Cap Table Snapshots (point-in-time cap table) ────────────────────
// Records the cap table state at each major milestone for evolution tracking.
export const ventureCapTableSnapshots = mysqlTable("venture_cap_table_snapshots", {
  id:                  int("id").autoincrement().primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  snapshotDate:        timestamp("snapshotDate").defaultNow().notNull(),
  triggerEvent:        varchar("triggerEvent", { length: 128 }), // e.g. "VRL 3 reached", "Pre-Seed £150k"
  // Aggregate cap table data (JSON-serialised array of {member, equityPct, dynamicScore})
  capTableJson:        text("capTableJson").notNull(),           // JSON string
  totalEquityAllocated: float("totalEquityAllocated").default(0), // sum of all equity %
  totalDynamicScore:   float("totalDynamicScore").default(0),    // sum of dynamic scores
  notes:               text("notes"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
});
export type VentureCapTableSnapshot = typeof ventureCapTableSnapshots.$inferSelect;
export type InsertVentureCapTableSnapshot = typeof ventureCapTableSnapshots.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// IP INTELLIGENCE MODULE — Sprint 37
// Unified IP asset registry covering Patents, Trademarks, Copyrights,
// Design Rights, and Trade Secrets, plus an AI Patent Workspace.
// ═══════════════════════════════════════════════════════════════════════════════

// ── IP Assets (unified registry for all 5 IP types) ─────────────────────────
export const ipAssets = mysqlTable("ip_assets", {
  id:                  int("id").autoincrement().primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  ventureName:         varchar("ventureName", { length: 128 }),
  ventureColor:        varchar("ventureColor", { length: 16 }).default("#22c55e"),
  ipType:              varchar("ipType", { length: 32 }).notNull(),
  title:               varchar("title", { length: 256 }).notNull(),
  reference:           varchar("reference", { length: 64 }),
  description:         text("description"),
  status:              varchar("status", { length: 32 }).notNull().default("Draft"),
  jurisdiction:        varchar("jurisdiction", { length: 64 }).default("UK"),
  filedDate:           varchar("filedDate", { length: 16 }),
  grantedDate:         varchar("grantedDate", { length: 16 }),
  expiryDate:          varchar("expiryDate", { length: 16 }),
  renewalDueDate:      varchar("renewalDueDate", { length: 16 }),
  commercialPotential: varchar("commercialPotential", { length: 16 }).default("Medium"),
  estimatedValue:      float("estimatedValue").default(0),
  trl:                 int("trl").default(1),
  claimsCount:         int("claimsCount").default(0),
  priorArtSummary:     text("priorArtSummary"),
  trademarkClass:      varchar("trademarkClass", { length: 64 }),
  trademarkType:       varchar("trademarkType", { length: 32 }),
  copyrightWork:       varchar("copyrightWork", { length: 64 }),
  author:              varchar("author", { length: 128 }),
  designType:          varchar("designType", { length: 32 }),
  secretCategory:      varchar("secretCategory", { length: 64 }),
  protectionMeasures:  text("protectionMeasures"),
  ownedBy:             varchar("ownedBy", { length: 128 }).default("EcoRace Ltd"),
  assignedTo:          varchar("assignedTo", { length: 128 }),
  notes:               text("notes"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type IpAsset = typeof ipAssets.$inferSelect;
export type InsertIpAsset = typeof ipAssets.$inferInsert;

// ── IP Licenses ──────────────────────────────────────────────────────────────
export const ipLicenses = mysqlTable("ip_licenses", {
  id:              int("id").autoincrement().primaryKey(),
  ipAssetId:       int("ipAssetId").notNull(),
  licensee:        varchar("licensee", { length: 128 }).notNull(),
  country:         varchar("country", { length: 64 }),
  region:          varchar("region", { length: 64 }),
  licenseType:     varchar("licenseType", { length: 32 }).notNull().default("Non-Exclusive"),
  status:          varchar("status", { length: 32 }).notNull().default("Negotiating"),
  annualValue:     float("annualValue").default(0),
  upfrontFee:      float("upfrontFee").default(0),
  royaltyRate:     float("royaltyRate").default(0),
  startDate:       varchar("startDate", { length: 16 }),
  endDate:         varchar("endDate", { length: 16 }),
  valuesAligned:   boolean("valuesAligned").default(true),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type IpLicense = typeof ipLicenses.$inferSelect;
export type InsertIpLicense = typeof ipLicenses.$inferInsert;

// ── Patent AI Workspace Projects ─────────────────────────────────────────────
export const patentProjects = mysqlTable("patent_projects", {
  id:                  int("id").autoincrement().primaryKey(),
  ipAssetId:           int("ipAssetId"),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  title:               varchar("title", { length: 256 }).notNull(),
  phase:               varchar("phase", { length: 32 }).notNull().default("Ingestion"),
  coreInventionNotes:  text("coreInventionNotes"),
  priorArtNotes:       text("priorArtNotes"),
  draftAbstract:       text("draftAbstract"),
  draftBackground:     text("draftBackground"),
  draftSummary:        text("draftSummary"),
  draftDetailedDesc:   text("draftDetailedDesc"),
  draftClaims:         text("draftClaims"),
  jurisdiction:        varchar("jurisdiction", { length: 64 }).default("UK/EPO"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PatentProject = typeof patentProjects.$inferSelect;
export type InsertPatentProject = typeof patentProjects.$inferInsert;

// ── Patent Hypotheses (AI-generated alternative embodiments) ─────────────────
export const patentHypotheses = mysqlTable("patent_hypotheses", {
  id:            int("id").autoincrement().primaryKey(),
  projectId:     int("projectId").notNull(),
  title:         varchar("title", { length: 256 }).notNull(),
  description:   text("description").notNull(),
  rationale:     text("rationale"),
  claimImpact:   text("claimImpact"),
  included:      boolean("included").default(false),
  sortOrder:     int("sortOrder").default(0),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
});
export type PatentHypothesis = typeof patentHypotheses.$inferSelect;
export type InsertPatentHypothesis = typeof patentHypotheses.$inferInsert;

// ── LCSSA: Environmental LCA (Planet) ────────────────────────────────────────
export const lcssaEnvironmental = mysqlTable("lcssa_environmental", {
  id:                  int("id").autoincrement().primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  // Carbon Footprint
  carbonFootprintKg:   float("carbonFootprintKg").default(0),
  carbonFootprintScope1: float("carbonFootprintScope1").default(0),
  carbonFootprintScope2: float("carbonFootprintScope2").default(0),
  carbonFootprintScope3: float("carbonFootprintScope3").default(0),
  carbonReductionTarget: float("carbonReductionTarget").default(0), // % target
  // Resource Use
  energyConsumptionKwh:  float("energyConsumptionKwh").default(0),
  waterUsageLitres:      float("waterUsageLitres").default(0),
  renewableEnergyPct:    float("renewableEnergyPct").default(0),
  materialEfficiencyPct: float("materialEfficiencyPct").default(0),
  // Pollution & Waste
  wasteGeneratedKg:      float("wasteGeneratedKg").default(0),
  wasteRecycledPct:      float("wasteRecycledPct").default(0),
  airPollutionIndex:     float("airPollutionIndex").default(0),
  waterPollutionIndex:   float("waterPollutionIndex").default(0),
  // Ecosystem Impact
  biodiversityScore:     float("biodiversityScore").default(0), // 0–10
  landUseHectares:       float("landUseHectares").default(0),
  ecosystemServicesScore: float("ecosystemServicesScore").default(0), // 0–10
  // Overall
  environmentalScore:    float("environmentalScore").default(0), // 0–100
  notes:                 text("notes"),
  assessmentDate:        timestamp("assessmentDate").defaultNow(),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LcssaEnvironmental = typeof lcssaEnvironmental.$inferSelect;
export type InsertLcssaEnvironmental = typeof lcssaEnvironmental.$inferInsert;

// ── LCSSA: Social LCA (People) ───────────────────────────────────────────────
export const lcssaSocial = mysqlTable("lcssa_social", {
  id:                  int("id").autoincrement().primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  // Labor Conditions
  livingWageCompliance: boolean("livingWageCompliance").default(false),
  avgWorkingHoursPerWeek: float("avgWorkingHoursPerWeek").default(0),
  employeeTurnoverPct:  float("employeeTurnoverPct").default(0),
  collectiveBargaining: boolean("collectiveBargaining").default(false),
  // Human Rights
  humanRightsDueDiligence: boolean("humanRightsDueDiligence").default(false),
  supplyChainAuditScore: float("supplyChainAuditScore").default(0), // 0–10
  childLaborRisk:       varchar("childLaborRisk", { length: 16 }).default("Low"), // Low/Medium/High
  forcedLaborRisk:      varchar("forcedLaborRisk", { length: 16 }).default("Low"),
  // Community Impact
  localHiringPct:       float("localHiringPct").default(0),
  communityInvestmentGbp: float("communityInvestmentGbp").default(0),
  communityEngagementScore: float("communityEngagementScore").default(0), // 0–10
  // Health & Safety
  ltifr:                float("ltifr").default(0), // Lost Time Injury Frequency Rate
  nearMissReports:      int("nearMissReports").default(0),
  safetyTrainingHours:  float("safetyTrainingHours").default(0),
  healthSafetyScore:    float("healthSafetyScore").default(0), // 0–10
  // Overall
  socialScore:          float("socialScore").default(0), // 0–100
  notes:                text("notes"),
  assessmentDate:       timestamp("assessmentDate").defaultNow(),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LcssaSocial = typeof lcssaSocial.$inferSelect;
export type InsertLcssaSocial = typeof lcssaSocial.$inferInsert;

// ── LCSSA: Life Cycle Costing (Profit) ───────────────────────────────────────
export const lcssaLifeCycleCost = mysqlTable("lcssa_life_cycle_cost", {
  id:                  int("id").autoincrement().primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  // Production Costs
  rawMaterialCostGbp:  float("rawMaterialCostGbp").default(0),
  manufacturingCostGbp: float("manufacturingCostGbp").default(0),
  labourCostGbp:       float("labourCostGbp").default(0),
  overheadCostGbp:     float("overheadCostGbp").default(0),
  // Logistics Costs
  inboundLogisticsCostGbp:  float("inboundLogisticsCostGbp").default(0),
  outboundLogisticsCostGbp: float("outboundLogisticsCostGbp").default(0),
  warehouseCostGbp:    float("warehouseCostGbp").default(0),
  // Maintenance
  plannedMaintenanceCostGbp:   float("plannedMaintenanceCostGbp").default(0),
  unplannedMaintenanceCostGbp: float("unplannedMaintenanceCostGbp").default(0),
  assetLifespanYears:  float("assetLifespanYears").default(0),
  // End-of-Life Costs
  disposalCostGbp:     float("disposalCostGbp").default(0),
  recyclingRevGbp:     float("recyclingRevGbp").default(0),
  remediationCostGbp:  float("remediationCostGbp").default(0),
  // Totals
  totalLccGbp:         float("totalLccGbp").default(0),
  lccScore:            float("lccScore").default(0), // 0–100 (efficiency score)
  currency:            varchar("currency", { length: 8 }).default("GBP"),
  notes:               text("notes"),
  assessmentDate:      timestamp("assessmentDate").defaultNow(),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LcssaLifeCycleCost = typeof lcssaLifeCycleCost.$inferSelect;
export type InsertLcssaLifeCycleCost = typeof lcssaLifeCycleCost.$inferInsert;

// ── LCSSA: Oversight & Governance (Policy & Standards + Data & Reporting) ────
export const lcssaOversight = mysqlTable("lcssa_oversight", {
  id:                  int("id").autoincrement().primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  // Policy & Standards
  iso14001Certified:   boolean("iso14001Certified").default(false),
  iso26000Adopted:     boolean("iso26000Adopted").default(false),
  griReportingLevel:   varchar("griReportingLevel", { length: 32 }).default("None"), // None/Core/Comprehensive
  sdgAlignmentCount:   int("sdgAlignmentCount").default(0), // number of SDGs addressed
  sdgHeatmap:          text("sdgHeatmap"), // JSON array of 17 booleans e.g. "[true,false,...]"
  policyDocumentUrl:   varchar("policyDocumentUrl", { length: 512 }),
  complianceScore:     float("complianceScore").default(0), // 0–100
  // Data & Reporting
  reportingFrequency:  varchar("reportingFrequency", { length: 32 }).default("Annual"), // Annual/Quarterly/Monthly
  lastReportDate:      timestamp("lastReportDate"),
  nextReportDate:      timestamp("nextReportDate"),
  dataQualityScore:    float("dataQualityScore").default(0), // 0–10
  thirdPartyVerified:  boolean("thirdPartyVerified").default(false),
  verifierName:        varchar("verifierName", { length: 128 }),
  reportUrl:           varchar("reportUrl", { length: 512 }),
  // Governance
  boardOversight:      boolean("boardOversight").default(false),
  sustainabilityCommittee: boolean("sustainabilityCommittee").default(false),
  stakeholderEngagementScore: float("stakeholderEngagementScore").default(0), // 0–10
  oversightScore:      float("oversightScore").default(0), // 0–100
  notes:               text("notes"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LcssaOversight = typeof lcssaOversight.$inferSelect;
export type InsertLcssaOversight = typeof lcssaOversight.$inferInsert;

// ── LCSSA: Sustainable Decision Log ──────────────────────────────────────────
export const lcssaDecisionLog = mysqlTable("lcssa_decision_log", {
  id:                  int("id").autoincrement().primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  decisionTitle:       varchar("decisionTitle", { length: 256 }).notNull(),
  decisionType:        mysqlEnum("decisionType", ["Environmental", "Social", "Economic", "Integrated"]).notNull().default("Integrated"),
  lcaDimension:        varchar("lcaDimension", { length: 64 }), // Environmental LCA / Social LCA / LCC
  rationale:           text("rationale"),
  environmentalImpact: varchar("environmentalImpact", { length: 16 }).default("Neutral"), // Positive/Neutral/Negative
  socialImpact:        varchar("socialImpact", { length: 16 }).default("Neutral"),
  economicImpact:      varchar("economicImpact", { length: 16 }).default("Neutral"),
  status:              mysqlEnum("status", ["Proposed", "Approved", "Implemented", "Reviewed"]).notNull().default("Proposed"),
  decisionDate:        timestamp("decisionDate").defaultNow(),
  reviewDate:          timestamp("reviewDate"),
  owner:               varchar("owner", { length: 128 }),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LcssaDecisionLog = typeof lcssaDecisionLog.$inferSelect;
export type InsertLcssaDecisionLog = typeof lcssaDecisionLog.$inferInsert;

// ── LCSSA: Monthly Snapshot (for trend chart) ─────────────────────────────────
export const lcssaSnapshot = mysqlTable("lcssa_snapshot", {
  id:                  int("id").autoincrement().primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  snapshotDate:        timestamp("snapshotDate").defaultNow().notNull(),
  environmentalScore:  float("environmentalScore").default(0),
  socialScore:         float("socialScore").default(0),
  lccScore:            float("lccScore").default(0),
  oversightScore:      float("oversightScore").default(0),
  lcssaScore:          float("lcssaScore").default(0),
  label:               varchar("label", { length: 64 }), // e.g. "Mar 2026"
  triggeredBy:         varchar("triggeredBy", { length: 64 }).default("manual"), // manual/auto
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
});
export type LcssaSnapshot = typeof lcssaSnapshot.$inferSelect;
export type InsertLcssaSnapshot = typeof lcssaSnapshot.$inferInsert;

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  DUAL RISK VENTURE CREATION SYSTEM                                           ║
// ║  Brief: Dual Risk Venture Creation System – Prompt Brief (Manus AI)          ║
// ║  Separates Business Risk (University) and Product Risk (Founder)             ║
// ║  Recombines into VRL Engine with Decision Outputs                            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ── Business Risk Inputs (University Ownership) ───────────────────────────────
export const businessRiskInputs = mysqlTable("business_risk_inputs", {
  id:                    int("id").autoincrement().primaryKey(),
  ventureId:             varchar("ventureId", { length: 64 }).notNull().unique(),
  // Input source
  sourceType:            mysqlEnum("sourceType", ["research_paper", "market_report", "ip_document", "academic_model", "manual"]).notNull().default("manual"),
  inputCategory:         mysqlEnum("inputCategory", ["University", "Founder", "Joint"]).notNull().default("University"),
  // Market Risk (0–100)
  marketRiskScore:       float("marketRiskScore").default(50),
  marketSizeScore:       float("marketSizeScore").default(50),       // TAM/SAM/SOM confidence
  competitorIntensity:   float("competitorIntensity").default(50),   // competitive landscape
  demandValidation:      float("demandValidation").default(50),      // customer validation strength
  // ESG Risk (0–100)
  esgRiskScore:          float("esgRiskScore").default(50),
  carbonFootprintRisk:   float("carbonFootprintRisk").default(50),
  socialLicenceRisk:     float("socialLicenceRisk").default(50),
  supplyChainEsgRisk:    float("supplyChainEsgRisk").default(50),
  // Regulatory Risk (0–100)
  regulatoryRiskScore:   float("regulatoryRiskScore").default(50),
  complianceComplexity:  float("complianceComplexity").default(50),
  certificationBarrier:  float("certificationBarrier").default(50),
  jurisdictionRisk:      float("jurisdictionRisk").default(50),
  // Commercial Viability (0–100, higher = more viable)
  commercialViabilityScore: float("commercialViabilityScore").default(50),
  revenueModelClarity:   float("revenueModelClarity").default(50),
  unitEconomicsScore:    float("unitEconomicsScore").default(50),
  partnershipReadiness:  float("partnershipReadiness").default(50),
  // Strategic Risk (0–100)
  strategicRiskScore:    float("strategicRiskScore").default(50),
  ipProtectionStrength:  float("ipProtectionStrength").default(50),
  teamCapabilityRisk:    float("teamCapabilityRisk").default(50),
  executionTrack:        mysqlEnum("executionTrack", ["BEBUS", "ECORACE", "Both"]).default("BEBUS"),
  // Computed aggregate
  businessRiskIndex:     float("businessRiskIndex").default(50),     // 0–100, lower = less risk
  notes:                 text("notes"),
  lastUpdatedBy:         varchar("lastUpdatedBy", { length: 128 }),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BusinessRiskInput = typeof businessRiskInputs.$inferSelect;
export type InsertBusinessRiskInput = typeof businessRiskInputs.$inferInsert;

// ── Product Risk Inputs (Founder Ownership) ───────────────────────────────────
export const productRiskInputs = mysqlTable("product_risk_inputs", {
  id:                    int("id").autoincrement().primaryKey(),
  ventureId:             varchar("ventureId", { length: 64 }).notNull().unique(),
  // Input source
  sourceType:            mysqlEnum("sourceType", ["problem_statement", "industry_pain_point", "product_idea", "performance_gap", "manual"]).notNull().default("manual"),
  inputCategory:         mysqlEnum("inputCategory", ["University", "Founder", "Joint"]).notNull().default("Founder"),
  // Technical Feasibility (0–100, higher = more feasible)
  technicalFeasibilityScore: float("technicalFeasibilityScore").default(50),
  prototypeMaturity:     float("prototypeMaturity").default(50),     // how advanced the prototype is
  technologyReadiness:   float("technologyReadiness").default(50),   // linked to TRL
  // Performance Risk (0–100)
  performanceRiskScore:  float("performanceRiskScore").default(50),
  benchmarkGap:          float("benchmarkGap").default(50),          // gap vs POI benchmark
  qualityRisk:           float("qualityRisk").default(50),
  reliabilityRisk:       float("reliabilityRisk").default(50),
  // Scalability Risk (0–100)
  scalabilityRiskScore:  float("scalabilityRiskScore").default(50),
  manufacturingRisk:     float("manufacturingRisk").default(50),
  supplyChainRisk:       float("supplyChainRisk").default(50),
  unitCostScalability:   float("unitCostScalability").default(50),
  // Engineering Complexity (0–100, higher = more complex)
  engineeringComplexity: float("engineeringComplexity").default(50),
  integrationRisk:       float("integrationRisk").default(50),
  dependencyRisk:        float("dependencyRisk").default(50),
  // R&D Maturity (0–100, higher = more mature)
  rdMaturityScore:       float("rdMaturityScore").default(50),
  labValidationScore:    float("labValidationScore").default(50),    // EcoRace lab results
  pilotTestScore:        float("pilotTestScore").default(50),
  executionTrack:        mysqlEnum("executionTrack", ["BEBUS", "ECORACE", "Both"]).default("ECORACE"),
  // Computed aggregate
  productRiskIndex:      float("productRiskIndex").default(50),      // 0–100, lower = less risk
  notes:                 text("notes"),
  lastUpdatedBy:         varchar("lastUpdatedBy", { length: 128 }),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProductRiskInput = typeof productRiskInputs.$inferSelect;
export type InsertProductRiskInput = typeof productRiskInputs.$inferInsert;

// ── Dual Risk Decisions (VRL Engine Output) ───────────────────────────────────
export const dualRiskDecisions = mysqlTable("dual_risk_decisions", {
  id:                    int("id").autoincrement().primaryKey(),
  ventureId:             varchar("ventureId", { length: 64 }).notNull(),
  // Inputs at time of decision
  businessRiskIndex:     float("businessRiskIndex").notNull(),
  productRiskIndex:      float("productRiskIndex").notNull(),
  trlScore:              float("trlScore").notNull(),
  brlScore:              float("brlScore").notNull(),
  esgScore:              float("esgScore").default(50),
  // VRL Engine outputs
  vrlScore:              float("vrlScore").notNull(),                 // 0–9 scale
  vrlLevel:              int("vrlLevel").notNull(),                   // 1–9
  confidenceScore:       float("confidenceScore").default(0.5),      // 0.2–1.0
  // Decision output
  decision:              mysqlEnum("decision", ["Build", "Validate", "Partner", "Reject"]).notNull(),
  decisionRationale:     text("decisionRationale"),
  // Execution routing
  executionTrack:        mysqlEnum("executionTrack", ["BEBUS", "ECORACE", "Both", "None"]).default("None"),
  // Feedback loop
  marketFeedback:        text("marketFeedback"),
  feedbackScore:         float("feedbackScore"),                      // 0–100 market response
  // Metadata
  decidedBy:             varchar("decidedBy", { length: 128 }),
  sourceType:            mysqlEnum("sourceType", ["University", "Founder", "Joint"]).default("Joint"),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DualRiskDecision = typeof dualRiskDecisions.$inferSelect;
export type InsertDualRiskDecision = typeof dualRiskDecisions.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPLY CHAIN & MANUFACTURING INTELLIGENCE MODULE (Sprint 42)
// ═══════════════════════════════════════════════════════════════════════════════

// ── SC Products ───────────────────────────────────────────────────────────────
export const scProducts = mysqlTable("sc_products", {
  id:                   int("id").autoincrement().primaryKey(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  name:                 varchar("name", { length: 256 }).notNull(),
  description:          text("description"),
  materialType:         mysqlEnum("materialType", [
    "carbon_fibre", "glass_fibre", "hybrid_composite", "aluminium", "steel",
    "polymer", "bio_composite", "ceramic", "other"
  ]).default("carbon_fibre"),
  manufacturingProcess: mysqlEnum("manufacturingProcess", [
    "composite_layup", "resin_transfer_moulding", "injection_moulding",
    "cnc_machining", "3d_printing", "casting", "forging", "assembly", "other"
  ]).default("composite_layup"),
  prototypeStatus:      mysqlEnum("prototypeStatus", [
    "concept", "design", "prototype_v1", "prototype_v2", "validated", "production_ready"
  ]).default("concept"),
  trlLevel:             int("trlLevel").default(1),                   // 1–9
  productionGeography:  mysqlEnum("productionGeography", ["UK", "China", "Both", "Other"]).default("UK"),
  targetMarket:         varchar("targetMarket", { length: 256 }),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ScProduct = typeof scProducts.$inferSelect;
export type InsertScProduct = typeof scProducts.$inferInsert;

// ── SC Prototypes (UK R&D Layer) ──────────────────────────────────────────────
export const scPrototypes = mysqlTable("sc_prototypes", {
  id:                   int("id").autoincrement().primaryKey(),
  productId:            int("productId").notNull(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  version:              varchar("version", { length: 32 }).default("v1"),
  // CAD/CAE status
  cadStatus:            mysqlEnum("cadStatus", ["not_started", "in_progress", "complete", "validated"]).default("not_started"),
  caeStatus:            mysqlEnum("caeStatus", ["not_started", "in_progress", "complete", "validated"]).default("not_started"),
  cadFileUrl:           varchar("cadFileUrl", { length: 512 }),
  // Lab validation
  labTestStatus:        mysqlEnum("labTestStatus", ["not_started", "in_progress", "passed", "failed"]).default("not_started"),
  testResults:          text("testResults"),                          // JSON blob of test metrics
  structuralIntegrity:  float("structuralIntegrity"),                 // 0–100 score
  weightGrams:          float("weightGrams"),
  dimensionsMm:         varchar("dimensionsMm", { length: 128 }),     // "L×W×H"
  // TRL progression
  trlAtStart:           int("trlAtStart").default(1),
  trlAtEnd:             int("trlAtEnd").default(1),
  // Early LCA
  lcaScore:             float("lcaScore"),                            // 0–100 (lower = better impact)
  carbonFootprintKg:    float("carbonFootprintKg"),                   // kg CO2e per unit prototype
  // Manufacturing requirements output
  manufacturingNotes:   text("manufacturingNotes"),
  prototypeImageUrl:    varchar("prototypeImageUrl", { length: 512 }),
  completedAt:          timestamp("completedAt"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ScPrototype = typeof scPrototypes.$inferSelect;
export type InsertScPrototype = typeof scPrototypes.$inferInsert;

// ── SC Manufacturing (Manufacturing Intelligence Layer) ───────────────────────
export const scManufacturing = mysqlTable("sc_manufacturing", {
  id:                      int("id").autoincrement().primaryKey(),
  productId:               int("productId").notNull(),
  ventureId:               varchar("ventureId", { length: 64 }).notNull(),
  // BOM
  bomJson:                 text("bomJson"),                           // JSON array of BOM line items
  bomVersion:              varchar("bomVersion", { length: 32 }).default("1.0"),
  // Cost modelling
  unitCostGbp:             float("unitCostGbp"),                      // £ per unit
  toolingCostGbp:          float("toolingCostGbp"),
  moq:                     int("moq").default(1),                     // minimum order quantity
  targetUnitCostGbp:       float("targetUnitCostGbp"),
  // Process selection
  primaryProcess:          mysqlEnum("primaryProcess", [
    "composite_layup", "resin_transfer_moulding", "injection_moulding",
    "cnc_machining", "3d_printing", "casting", "forging", "assembly", "other"
  ]).default("composite_layup"),
  processComplexityIndex:  int("processComplexityIndex").default(50), // 0–100
  // Production capacity
  productionCapacityPerMonth: int("productionCapacityPerMonth"),
  leadTimeDays:            int("leadTimeDays"),
  // Manufacturing readiness
  manufacturingReadinessScore: int("manufacturingReadinessScore").default(0), // 0–100
  readinessNotes:          text("readinessNotes"),
  // Tooling
  toolingStatus:           mysqlEnum("toolingStatus", ["not_started", "in_design", "ordered", "received", "validated"]).default("not_started"),
  createdAt:               timestamp("createdAt").defaultNow().notNull(),
  updatedAt:               timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ScManufacturing = typeof scManufacturing.$inferSelect;
export type InsertScManufacturing = typeof scManufacturing.$inferInsert;

// ── SC Suppliers ──────────────────────────────────────────────────────────────
export const scSuppliers = mysqlTable("sc_suppliers", {
  id:                   int("id").autoincrement().primaryKey(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  name:                 varchar("name", { length: 256 }).notNull(),
  supplierType:         mysqlEnum("supplierType", [
    "raw_material", "component", "sub_assembly", "contract_manufacturer",
    "tooling", "logistics", "testing_lab", "other"
  ]).default("contract_manufacturer"),
  geography:            mysqlEnum("geography", ["UK", "China", "EU", "USA", "India", "Other"]).default("China"),
  city:                 varchar("city", { length: 128 }),
  contactName:          varchar("contactName", { length: 128 }),
  contactEmail:         varchar("contactEmail", { length: 256 }),
  // Scoring
  riskScore:            int("riskScore").default(50),                 // 0–100 (lower = less risk)
  qualityScore:         int("qualityScore").default(50),              // 0–100
  leadTimeDays:         int("leadTimeDays"),
  unitCostIndex:        float("unitCostIndex"),                       // relative cost index
  // ESG
  esgComplianceStatus:  mysqlEnum("esgComplianceStatus", ["unknown", "non_compliant", "partial", "compliant", "certified"]).default("unknown"),
  ethicalSourcingScore: int("ethicalSourcingScore").default(50),      // 0–100
  // Geopolitical risk
  geopoliticalRiskFlag: boolean("geopoliticalRiskFlag").default(false),
  geopoliticalNotes:    text("geopoliticalNotes"),
  // Relationship
  contractStatus:       mysqlEnum("contractStatus", ["prospect", "negotiating", "active", "paused", "terminated"]).default("prospect"),
  certifications:       text("certifications"),                       // JSON array
  notes:                text("notes"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ScSupplier = typeof scSuppliers.$inferSelect;
export type InsertScSupplier = typeof scSuppliers.$inferInsert;

// ── SC Production Orders (Global Production Layer) ───────────────────────────
export const scProductionOrders = mysqlTable("sc_production_orders", {
  id:                   int("id").autoincrement().primaryKey(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  productId:            int("productId").notNull(),
  supplierId:           int("supplierId"),
  orderRef:             varchar("orderRef", { length: 64 }),
  orderType:            mysqlEnum("orderType", ["pilot", "scale", "repeat"]).default("pilot"),
  geography:            mysqlEnum("geography", ["UK", "China", "EU", "USA", "Other"]).default("China"),
  // Volumes & economics
  quantityOrdered:      int("quantityOrdered").notNull(),
  unitCostGbp:          float("unitCostGbp"),
  totalCostGbp:         float("totalCostGbp"),
  // Schedule
  orderDate:            timestamp("orderDate").defaultNow(),
  expectedDeliveryDate: timestamp("expectedDeliveryDate"),
  actualDeliveryDate:   timestamp("actualDeliveryDate"),
  leadTimeDays:         int("leadTimeDays"),
  // QA/QC
  qaStatus:             mysqlEnum("qaStatus", ["pending", "in_inspection", "passed", "failed", "rework"]).default("pending"),
  defectRate:           float("defectRate").default(0),               // % defect rate
  qualityNotes:         text("qualityNotes"),
  // Logistics
  shippingMethod:       mysqlEnum("shippingMethod", ["air", "sea", "road", "rail", "courier"]).default("sea"),
  trackingRef:          varchar("trackingRef", { length: 128 }),
  // Status
  status:               mysqlEnum("status", ["draft", "confirmed", "in_production", "shipped", "delivered", "cancelled"]).default("draft"),
  notes:                text("notes"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ScProductionOrder = typeof scProductionOrders.$inferSelect;
export type InsertScProductionOrder = typeof scProductionOrders.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// CHINESE MANUFACTURING PLAYBOOK TABLES
// ─────────────────────────────────────────────────────────────────────────────

// Master playbook project — one per venture/product combination
export const mfgPlaybookProjects = mysqlTable("mfgPlaybookProjects", {
  id:              int("id").primaryKey().autoincrement(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  productName:     varchar("productName", { length: 256 }).notNull(),
  description:     text("description"),
  phase:           mysqlEnum("phase", ["uk_prototype", "china_feasibility", "pilot_production", "scale_manufacturing"]).default("uk_prototype").notNull(),
  ukPrototypeDone:      tinyint("ukPrototypeDone").default(0),
  chinaFeasibilityDone: tinyint("chinaFeasibilityDone").default(0),
  pilotProductionDone:  tinyint("pilotProductionDone").default(0),
  scaleManufacturingDone: tinyint("scaleManufacturingDone").default(0),
  trlLevel:        int("trlLevel").default(1),
  prototypeStatus: mysqlEnum("prototypeStatus", ["not_started", "in_progress", "validated", "failed"]).default("not_started"),
  validationNotes: text("validationNotes"),
  rfqSent:         tinyint("rfqSent").default(0),
  dfmComplete:     tinyint("dfmComplete").default(0),
  toolingOwnershipAgreement: tinyint("toolingOwnershipAgreement").default(0),
  pilotVolume:     int("pilotVolume").default(0),
  scaleVolume:     int("scaleVolume").default(0),
  targetUnitCostGbp: float("targetUnitCostGbp"),
  materialCostGbp: float("materialCostGbp"),
  labourCostGbp:   float("labourCostGbp"),
  overheadCostGbp: float("overheadCostGbp"),
  logisticsCostGbp: float("logisticsCostGbp"),
  marginPercent:   float("marginPercent").default(30),
  iso9001:         tinyint("iso9001").default(0),
  iso14001:        tinyint("iso14001").default(0),
  ceCertified:     tinyint("ceCertified").default(0),
  ukcaCertified:   tinyint("ukcaCertified").default(0),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MfgPlaybookProject = typeof mfgPlaybookProjects.$inferSelect;
export type InsertMfgPlaybookProject = typeof mfgPlaybookProjects.$inferInsert;

// 4-tier supplier ecosystem
export const mfgSupplierTiers = mysqlTable("mfgSupplierTiers", {
  id:              int("id").primaryKey().autoincrement(),
  projectId:       int("projectId").notNull(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  supplierName:    varchar("supplierName", { length: 256 }).notNull(),
  tier:            mysqlEnum("tier", ["tier1_oem", "tier2_components", "tier3_raw_materials", "tier4_tooling"]).notNull(),
  country:         varchar("country", { length: 64 }).default("China"),
  city:            varchar("city", { length: 128 }),
  contactName:     varchar("contactName", { length: 128 }),
  contactEmail:    varchar("contactEmail", { length: 256 }),
  nnnAgreement:    mysqlEnum("nnnAgreement", ["none", "sent", "signed"]).default("none"),
  manufacturingContract: mysqlEnum("manufacturingContract", ["none", "draft", "signed"]).default("none"),
  toolingOwnership: mysqlEnum("toolingOwnership", ["none", "partial", "full"]).default("none"),
  blackBoxComponents: tinyint("blackBoxComponents").default(0),
  riskScore:       int("riskScore").default(50),
  auditScore:      int("auditScore").default(0),
  qualityScore:    int("qualityScore").default(0),
  isDualSource:    tinyint("isDualSource").default(0),
  primarySupplierId: int("primarySupplierId"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MfgSupplierTier = typeof mfgSupplierTiers.$inferSelect;
export type InsertMfgSupplierTier = typeof mfgSupplierTiers.$inferInsert;

// QC reports — pre-production, in-line, pre-shipment AQL
export const mfgQcReports = mysqlTable("mfgQcReports", {
  id:              int("id").primaryKey().autoincrement(),
  projectId:       int("projectId").notNull(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  reportType:      mysqlEnum("reportType", ["pre_production", "in_line", "pre_shipment_aql"]).notNull(),
  inspectionDate:  timestamp("inspectionDate"),
  inspector:       varchar("inspector", { length: 128 }),
  supplierId:      int("supplierId"),
  sampleSize:      int("sampleSize"),
  defectsFound:    int("defectsFound").default(0),
  aqlLevel:        varchar("aqlLevel", { length: 16 }).default("2.5"),
  result:          mysqlEnum("result", ["pass", "fail", "conditional_pass", "pending"]).default("pending"),
  iso9001Pass:     tinyint("iso9001Pass").default(0),
  iso14001Pass:    tinyint("iso14001Pass").default(0),
  cePass:          tinyint("cePass").default(0),
  ukcastPass:      tinyint("ukcastPass").default(0),
  findings:        text("findings"),
  correctiveActions: text("correctiveActions"),
  attachmentUrl:   varchar("attachmentUrl", { length: 512 }),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MfgQcReport = typeof mfgQcReports.$inferSelect;
export type InsertMfgQcReport = typeof mfgQcReports.$inferInsert;

// Logistics shipments
export const mfgLogisticsShipments = mysqlTable("mfgLogisticsShipments", {
  id:              int("id").primaryKey().autoincrement(),
  projectId:       int("projectId").notNull(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  shipmentRef:     varchar("shipmentRef", { length: 128 }),
  freightType:     mysqlEnum("freightType", ["sea", "air", "rail", "road"]).default("sea").notNull(),
  originPort:      mysqlEnum("originPort", ["shenzhen", "shanghai", "ningbo", "qingdao", "guangzhou", "tianjin", "other"]).default("shenzhen"),
  destinationPort: varchar("destinationPort", { length: 128 }).default("Felixstowe, UK"),
  volume:          int("volume"),
  weightKg:        float("weightKg"),
  freightCostGbp:  float("freightCostGbp"),
  dutiesGbp:       float("dutiesGbp"),
  insuranceGbp:    float("insuranceGbp"),
  leadTimeDays:    int("leadTimeDays"),
  departureDate:   timestamp("departureDate"),
  arrivalDate:     timestamp("arrivalDate"),
  status:          mysqlEnum("status", ["planned", "booked", "in_transit", "customs", "delivered", "delayed"]).default("planned"),
  trackingRef:     varchar("trackingRef", { length: 128 }),
  forwarder:       varchar("forwarder", { length: 128 }),
  incoterms:       mysqlEnum("incoterms", ["EXW", "FOB", "CIF", "DDP", "DAP"]).default("FOB"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MfgLogisticsShipment = typeof mfgLogisticsShipments.$inferSelect;
export type InsertMfgLogisticsShipment = typeof mfgLogisticsShipments.$inferInsert;

// ── China Manufacturing Playbook Extended Tables ──────────────────────────────

// Supplier Onboarding / Registration
export const mfgSupplierOnboarding = mysqlTable("mfgSupplierOnboarding", {
  id:                  int("id").primaryKey().autoincrement(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  companyName:         varchar("companyName", { length: 256 }).notNull(),
  location:            varchar("location", { length: 256 }),
  city:                varchar("city", { length: 128 }),
  country:             varchar("country", { length: 128 }).default("China"),
  contactName:         varchar("contactName", { length: 128 }),
  contactEmail:        varchar("contactEmail", { length: 256 }),
  contactPhone:        varchar("contactPhone", { length: 64 }),
  capabilities:        text("capabilities"),
  certifications:      text("certifications"),
  productionCapacity:  varchar("productionCapacity", { length: 256 }),
  keyClients:          text("keyClients"),
  financialStability:  mysqlEnum("financialStability", ["unknown", "poor", "fair", "good", "excellent"]).default("unknown"),
  references:          text("references"),
  technicalCapability: int("technicalCapability").default(0),
  qualitySystems:      int("qualitySystems").default(0),
  leadTimesScore:      int("leadTimesScore").default(0),
  costCompetitiveness: int("costCompetitiveness").default(0),
  communication:       int("communication").default(0),
  complianceStandards: int("complianceStandards").default(0),
  overallScore:        float("overallScore").default(0),
  status:              mysqlEnum("status", ["pending", "under_review", "approved", "rejected", "on_hold"]).default("pending"),
  notes:               text("notes"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MfgSupplierOnboarding = typeof mfgSupplierOnboarding.$inferSelect;
export type InsertMfgSupplierOnboarding = typeof mfgSupplierOnboarding.$inferInsert;

// Factory Audit Checklist
export const mfgFactoryAudits = mysqlTable("mfgFactoryAudits", {
  id:                    int("id").primaryKey().autoincrement(),
  ventureId:             varchar("ventureId", { length: 64 }).notNull(),
  supplierId:            int("supplierId"),
  supplierName:          varchar("supplierName", { length: 256 }).notNull(),
  auditDate:             timestamp("auditDate"),
  auditorName:           varchar("auditorName", { length: 128 }),
  facilityCondition:     mysqlEnum("facilityCondition", ["pass", "fail", "partial", "na"]).default("na"),
  equipmentCapability:   mysqlEnum("equipmentCapability", ["pass", "fail", "partial", "na"]).default("na"),
  workforceSkills:       mysqlEnum("workforceSkills", ["pass", "fail", "partial", "na"]).default("na"),
  qcProcesses:           mysqlEnum("qcProcesses", ["pass", "fail", "partial", "na"]).default("na"),
  healthAndSafety:       mysqlEnum("healthAndSafety", ["pass", "fail", "partial", "na"]).default("na"),
  environmentalCompliance: mysqlEnum("environmentalCompliance", ["pass", "fail", "partial", "na"]).default("na"),
  overallResult:         mysqlEnum("overallResult", ["pass", "conditional_pass", "fail", "pending"]).default("pending"),
  auditScore:            int("auditScore").default(0),
  findings:              text("findings"),
  correctiveActions:     text("correctiveActions"),
  followUpDate:          timestamp("followUpDate"),
  status:                mysqlEnum("status", ["scheduled", "in_progress", "complete", "follow_up_required"]).default("scheduled"),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MfgFactoryAudit = typeof mfgFactoryAudits.$inferSelect;
export type InsertMfgFactoryAudit = typeof mfgFactoryAudits.$inferInsert;

// RFQ Templates
export const mfgRfqTemplates = mysqlTable("mfgRfqTemplates", {
  id:                int("id").primaryKey().autoincrement(),
  ventureId:         varchar("ventureId", { length: 64 }).notNull(),
  projectId:         int("projectId"),
  rfqRef:            varchar("rfqRef", { length: 64 }),
  productName:       varchar("productName", { length: 256 }).notNull(),
  productSpecs:      text("productSpecs"),
  drawingsUrl:       varchar("drawingsUrl", { length: 512 }),
  materials:         text("materials"),
  targetVolumeMoq:   int("targetVolumeMoq"),
  targetVolumeAnnual: int("targetVolumeAnnual"),
  targetLeadTimeDays: int("targetLeadTimeDays"),
  targetUnitCostGbp: float("targetUnitCostGbp"),
  materialCostGbp:   float("materialCostGbp"),
  labourCostGbp:     float("labourCostGbp"),
  toolingCostGbp:    float("toolingCostGbp"),
  overheadCostGbp:   float("overheadCostGbp"),
  packagingCostGbp:  float("packagingCostGbp"),
  sentToSuppliers:   text("sentToSuppliers"),
  responseDeadline:  timestamp("responseDeadline"),
  status:            mysqlEnum("status", ["draft", "sent", "responses_received", "evaluated", "awarded", "cancelled"]).default("draft"),
  awardedSupplier:   varchar("awardedSupplier", { length: 256 }),
  notes:             text("notes"),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
  updatedAt:         timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MfgRfqTemplate = typeof mfgRfqTemplates.$inferSelect;
export type InsertMfgRfqTemplate = typeof mfgRfqTemplates.$inferInsert;

// Approved Supplier List (ASL)
export const mfgApprovedSuppliers = mysqlTable("mfgApprovedSuppliers", {
  id:               int("id").primaryKey().autoincrement(),
  ventureId:        varchar("ventureId", { length: 64 }).notNull(),
  supplierId:       varchar("supplierId", { length: 64 }),
  onboardingId:     int("onboardingId"),
  supplierName:     varchar("supplierName", { length: 256 }).notNull(),
  tierLevel:        mysqlEnum("tierLevel", ["oem", "components", "raw_materials", "tooling"]).default("components"),
  capabilities:     text("capabilities"),
  riskRating:       mysqlEnum("riskRating", ["low", "medium", "high", "critical"]).default("medium"),
  performanceScore: float("performanceScore").default(0),
  qualityScore:     float("qualityScore").default(0),
  deliveryScore:    float("deliveryScore").default(0),
  costScore:        float("costScore").default(0),
  lastAuditDate:    timestamp("lastAuditDate"),
  nextAuditDate:    timestamp("nextAuditDate"),
  approvalDate:     timestamp("approvalDate"),
  approvedBy:       varchar("approvedBy", { length: 128 }),
  status:           mysqlEnum("status", ["active", "probationary", "suspended", "delisted"]).default("active"),
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MfgApprovedSupplier = typeof mfgApprovedSuppliers.$inferSelect;
export type InsertMfgApprovedSupplier = typeof mfgApprovedSuppliers.$inferInsert;

// Contract Templates
export const mfgContractTemplates = mysqlTable("mfgContractTemplates", {
  id:               int("id").primaryKey().autoincrement(),
  ventureId:        varchar("ventureId", { length: 64 }).notNull(),
  supplierId:       int("supplierId"),
  supplierName:     varchar("supplierName", { length: 256 }),
  contractType:     mysqlEnum("contractType", ["nnn", "manufacturing", "tooling_ownership", "quality", "logistics_supply"]).notNull(),
  clauseChecklist:  text("clauseChecklist"),
  draftText:        text("draftText"),
  jurisdiction:     varchar("jurisdiction", { length: 128 }).default("China"),
  effectiveDate:    timestamp("effectiveDate"),
  expiryDate:       timestamp("expiryDate"),
  penaltyClause:    boolean("penaltyClause").default(false),
  ipOwnershipClause: boolean("ipOwnershipClause").default(false),
  incoterms:        mysqlEnum("incoterms", ["EXW", "FOB", "CIF", "DDP", "DAP"]).default("FOB"),
  status:           mysqlEnum("status", ["draft", "under_review", "signed", "expired", "terminated"]).default("draft"),
  signedDate:       timestamp("signedDate"),
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MfgContractTemplate = typeof mfgContractTemplates.$inferSelect;
export type InsertMfgContractTemplate = typeof mfgContractTemplates.$inferInsert;

// ── University Playbook Tables ──────────────────────────────────────────────────

// University Partners (universities, research institutions)
export const uniPartners = mysqlTable("uniPartners", {
  id:             int("id").primaryKey().autoincrement(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  name:           varchar("name", { length: 255 }).notNull(),
  type:           varchar("type", { length: 64 }).notNull().default("university"), // university | research_institute | polytechnic | industry_lab
  country:        varchar("country", { length: 100 }),
  department:     varchar("department", { length: 255 }),
  contactName:    varchar("contactName", { length: 255 }),
  contactEmail:   varchar("contactEmail", { length: 255 }),
  partnershipType: varchar("partnershipType", { length: 64 }).notNull().default("research"), // research | talent | commercialisation | sponsored | internship
  status:         varchar("status", { length: 32 }).notNull().default("active"), // active | inactive | pending | negotiating
  startDate:      bigint("startDate", { mode: "number" }),
  endDate:        bigint("endDate", { mode: "number" }),
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UniPartner = typeof uniPartners.$inferSelect;
export type InsertUniPartner = typeof uniPartners.$inferInsert;

// Research Projects (academic, technical, applied)
export const uniResearchProjects = mysqlTable("uniResearchProjects", {
  id:             int("id").primaryKey().autoincrement(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  partnerId:      int("partnerId"),
  title:          varchar("title", { length: 255 }).notNull(),
  researchType:   varchar("researchType", { length: 64 }).notNull().default("business"), // business | technical | applied
  description:    text("description"),
  objective:      text("objective"),
  methodology:    varchar("methodology", { length: 128 }),
  status:         varchar("status", { length: 32 }).notNull().default("planned"), // planned | active | completed | published | paused
  leadResearcher: varchar("leadResearcher", { length: 255 }),
  startDate:      bigint("startDate", { mode: "number" }),
  endDate:        bigint("endDate", { mode: "number" }),
  budget:         decimal("budget", { precision: 12, scale: 2 }),
  publicationUrl: varchar("publicationUrl", { length: 512 }),
  keyFindings:    text("keyFindings"),
  trlImpact:      int("trlImpact"), // which TRL level this research supports
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UniResearchProject = typeof uniResearchProjects.$inferSelect;
export type InsertUniResearchProject = typeof uniResearchProjects.$inferInsert;

// Talent Roles (students, academics, industry experts, venture leads)
export const uniTalentRoles = mysqlTable("uniTalentRoles", {
  id:             int("id").primaryKey().autoincrement(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  partnerId:      int("partnerId"),
  name:           varchar("name", { length: 255 }).notNull(),
  roleType:       varchar("roleType", { length: 64 }).notNull().default("student"), // student | academic | industry_expert | venture_lead
  institution:    varchar("institution", { length: 255 }),
  skills:         text("skills"), // comma-separated
  availability:   varchar("availability", { length: 64 }).default("part_time"), // full_time | part_time | advisory | internship
  assignedProject: varchar("assignedProject", { length: 255 }),
  stipend:        decimal("stipend", { precision: 10, scale: 2 }),
  startDate:      bigint("startDate", { mode: "number" }),
  endDate:        bigint("endDate", { mode: "number" }),
  status:         varchar("status", { length: 32 }).notNull().default("active"), // active | inactive | onboarding | completed
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UniTalentRole = typeof uniTalentRoles.$inferSelect;
export type InsertUniTalentRole = typeof uniTalentRoles.$inferInsert;

// Venture Workflow Stages (5-stage pipeline per project)
export const uniVentureWorkflows = mysqlTable("uniVentureWorkflows", {
  id:             int("id").primaryKey().autoincrement(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  projectName:    varchar("projectName", { length: 255 }).notNull(),
  stage:          varchar("stage", { length: 64 }).notNull().default("problem_definition"), // problem_definition | research_discovery | hypothesis_development | validation | commercialisation
  problemStatement: text("problemStatement"),
  researchFindings: text("researchFindings"),
  hypothesis:     text("hypothesis"),
  validationMethod: varchar("validationMethod", { length: 255 }),
  validationResult: varchar("validationResult", { length: 64 }), // confirmed | refuted | inconclusive | pending
  commercialisationPlan: text("commercialisationPlan"),
  linkedResearchId: int("linkedResearchId"),
  stageGatePassed: boolean("stageGatePassed").default(false),
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UniVentureWorkflow = typeof uniVentureWorkflows.$inferSelect;
export type InsertUniVentureWorkflow = typeof uniVentureWorkflows.$inferInsert;

// Industry Engagements (sponsored research, consulting, partnerships, internships)
export const uniIndustryEngagements = mysqlTable("uniIndustryEngagements", {
  id:             int("id").primaryKey().autoincrement(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  companyName:    varchar("companyName", { length: 255 }).notNull(),
  engagementType: varchar("engagementType", { length: 64 }).notNull().default("sponsored_research"), // sponsored_research | consulting | venture_partnership | internship_pipeline | joint_ip
  description:    text("description"),
  contactName:    varchar("contactName", { length: 255 }),
  contactEmail:   varchar("contactEmail", { length: 255 }),
  value:          decimal("value", { precision: 12, scale: 2 }), // financial value of engagement
  status:         varchar("status", { length: 32 }).notNull().default("active"), // active | completed | negotiating | paused | cancelled
  startDate:      bigint("startDate", { mode: "number" }),
  endDate:        bigint("endDate", { mode: "number" }),
  deliverables:   text("deliverables"),
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UniIndustryEngagement = typeof uniIndustryEngagements.$inferSelect;
export type InsertUniIndustryEngagement = typeof uniIndustryEngagements.$inferInsert;

// Governance Documents (student agreements, IP agreements, NDAs, ethics approvals)
export const uniGovernanceDocs = mysqlTable("uniGovernanceDocs", {
  id:             int("id").primaryKey().autoincrement(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  docType:        varchar("docType", { length: 64 }).notNull().default("student_agreement"), // student_agreement | ip_agreement | nda | ethics_approval | data_protection | collaboration_agreement
  title:          varchar("title", { length: 255 }).notNull(),
  parties:        text("parties"), // comma-separated names
  status:         varchar("status", { length: 32 }).notNull().default("draft"), // draft | under_review | signed | expired | rejected
  signedDate:     bigint("signedDate", { mode: "number" }),
  expiryDate:     bigint("expiryDate", { mode: "number" }),
  documentUrl:    varchar("documentUrl", { length: 512 }),
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UniGovernanceDoc = typeof uniGovernanceDocs.$inferSelect;
export type InsertUniGovernanceDoc = typeof uniGovernanceDocs.$inferInsert;

// Data Sources (hybrid data strategy: interviews, surveys, secondary, AI)
export const uniDataSources = mysqlTable("uniDataSources", {
  id:             int("id").primaryKey().autoincrement(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  sourceType:     varchar("sourceType", { length: 64 }).notNull().default("interview"), // interview | survey | secondary_research | ai_analysis | focus_group | observation
  title:          varchar("title", { length: 255 }).notNull(),
  description:    text("description"),
  sampleSize:     int("sampleSize"),
  collectionMethod: varchar("collectionMethod", { length: 255 }),
  status:         varchar("status", { length: 32 }).notNull().default("planned"), // planned | in_progress | completed | analysed
  dataUrl:        varchar("dataUrl", { length: 512 }),
  keyInsights:    text("keyInsights"),
  aiAnalysisDone: boolean("aiAnalysisDone").default(false),
  aiSummary:      text("aiSummary"),
  linkedHypothesis: varchar("linkedHypothesis", { length: 255 }),
  collectedAt:    bigint("collectedAt", { mode: "number" }),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UniDataSource = typeof uniDataSources.$inferSelect;
export type InsertUniDataSource = typeof uniDataSources.$inferInsert;

// Roadmap Milestones (3-phase implementation: setup, pilot, scale)
export const uniRoadmapMilestones = mysqlTable("uniRoadmapMilestones", {
  id:             int("id").primaryKey().autoincrement(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  phase:          varchar("phase", { length: 32 }).notNull().default("setup"), // setup | pilot | scale
  title:          varchar("title", { length: 255 }).notNull(),
  description:    text("description"),
  owner:          varchar("owner", { length: 255 }),
  targetDate:     bigint("targetDate", { mode: "number" }),
  completedDate:  bigint("completedDate", { mode: "number" }),
  status:         varchar("status", { length: 32 }).notNull().default("pending"), // pending | in_progress | completed | delayed | cancelled
  priority:       varchar("priority", { length: 16 }).notNull().default("medium"), // low | medium | high | critical
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UniRoadmapMilestone = typeof uniRoadmapMilestones.$inferSelect;
export type InsertUniRoadmapMilestone = typeof uniRoadmapMilestones.$inferInsert;

// ── Workflow Engine ────────────────────────────────────────────────────────────
// Immutable log of every cross-module trigger fired by the workflow engine.
// triggerType: research_completed | audit_failed | supplier_approved
// status: pending | success | failed | skipped
export const workflowTriggerLog = mysqlTable("workflowTriggerLog", {
  id:               int("id").primaryKey().autoincrement(),
  triggerType:      varchar("triggerType", { length: 64 }).notNull(),
  sourceModule:     varchar("sourceModule", { length: 64 }).notNull(),
  sourceRecordId:   int("sourceRecordId").notNull(),
  targetModule:     varchar("targetModule", { length: 64 }),
  targetRecordId:   int("targetRecordId"),
  ventureId:        varchar("ventureId", { length: 64 }),
  offeringId:       varchar("offeringId", { length: 36 }),
  status:           varchar("status", { length: 16 }).notNull().default("pending"),
  payload:          text("payload"),
  result:           text("result"),
  error:            text("error"),
  retriedFrom:      int("retriedFrom"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type WorkflowTriggerLog = typeof workflowTriggerLog.$inferSelect;
export type InsertWorkflowTriggerLog = typeof workflowTriggerLog.$inferInsert;

// ── Data Management Module ─────────────────────────────────────────────────────
// Section 8: Data ingestion, validation, quality scoring, AI integration
// Section 9: RAG pipelines, fine-tuning, context engineering, feedback loops

// ── Data Assets ───────────────────────────────────────────────────────────────
// Central catalogue of all data assets used across the platform.
// assetType: structured | unstructured | semi_structured | time_series | media
// sourceType: manual_upload | api_feed | database_export | web_scrape | sensor | survey | interview
// format: csv | json | xlsx | pdf | docx | mp3 | mp4 | image | parquet | other
// status: draft | ingested | validated | published | archived | error
export const dmDataAssets = mysqlTable("dmDataAssets", {
  id:             int("id").primaryKey().autoincrement(),
  ventureId:      varchar("ventureId", { length: 64 }),
  name:           varchar("name", { length: 255 }).notNull(),
  description:    text("description"),
  assetType:      varchar("assetType", { length: 32 }).notNull().default("structured"),
  sourceType:     varchar("sourceType", { length: 32 }).notNull().default("manual_upload"),
  format:         varchar("format", { length: 32 }).notNull().default("csv"),
  sizeKb:         int("sizeKb"),
  rowCount:       int("rowCount"),
  columnCount:    int("columnCount"),
  storageUrl:     text("storageUrl"),
  storageKey:     varchar("storageKey", { length: 512 }),
  tags:           text("tags"),                // JSON array of strings
  schema:         text("schema"),              // JSON describing columns/fields
  sampleData:     text("sampleData"),          // JSON preview rows
  status:         varchar("status", { length: 32 }).notNull().default("draft"),
  linkedModule:   varchar("linkedModule", { length: 64 }),  // e.g. "universityPlaybook", "chinaManufacturing"
  linkedRecordId: int("linkedRecordId"),
  overallQuality: float("overallQuality"),     // 0-100 computed score
  lastValidated:  timestamp("lastValidated"),
  ingestedBy:     varchar("ingestedBy", { length: 128 }),
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DmDataAsset = typeof dmDataAssets.$inferSelect;
export type InsertDmDataAsset = typeof dmDataAssets.$inferInsert;

// ── Quality Scores ─────────────────────────────────────────────────────────────
// Per-asset quality dimension scores and issue flags.
// Each row is one quality assessment snapshot for one asset.
export const dmQualityScores = mysqlTable("dmQualityScores", {
  id:               int("id").primaryKey().autoincrement(),
  assetId:          int("assetId").notNull(),
  completeness:     float("completeness"),     // 0-100: % non-null fields
  accuracy:         float("accuracy"),         // 0-100: validated against rules
  freshness:        float("freshness"),        // 0-100: recency score
  consistency:      float("consistency"),      // 0-100: cross-field consistency
  uniqueness:       float("uniqueness"),       // 0-100: deduplication score
  validity:         float("validity"),         // 0-100: format/type conformance
  overallScore:     float("overallScore"),     // weighted average
  issues:           text("issues"),            // JSON array of issue objects {field, type, count, severity}
  recommendations:  text("recommendations"),  // JSON array of fix suggestions
  assessedBy:       varchar("assessedBy", { length: 32 }).notNull().default("manual"), // manual | ai | automated
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type DmQualityScore = typeof dmQualityScores.$inferSelect;
export type InsertDmQualityScore = typeof dmQualityScores.$inferInsert;

// ── AI Pipelines ───────────────────────────────────────────────────────────────
// Configuration and metadata for AI processing pipelines.
// pipelineType: classification | extraction | generation | summarisation | embedding | scoring | routing
// status: draft | active | paused | deprecated | error
export const dmAiPipelines = mysqlTable("dmAiPipelines", {
  id:               int("id").primaryKey().autoincrement(),
  ventureId:        varchar("ventureId", { length: 64 }),
  name:             varchar("name", { length: 255 }).notNull(),
  description:      text("description"),
  pipelineType:     varchar("pipelineType", { length: 32 }).notNull().default("generation"),
  model:            varchar("model", { length: 128 }),
  promptTemplate:   text("promptTemplate"),
  systemPrompt:     text("systemPrompt"),
  inputSchema:      text("inputSchema"),       // JSON schema for expected inputs
  outputSchema:     text("outputSchema"),      // JSON schema for expected outputs
  temperature:      float("temperature"),
  maxTokens:        int("maxTokens"),
  topP:             float("topP"),
  linkedAssetIds:   text("linkedAssetIds"),    // JSON array of dmDataAssets.id
  linkedModule:     varchar("linkedModule", { length: 64 }),
  status:           varchar("status", { length: 32 }).notNull().default("draft"),
  totalRuns:        int("totalRuns").notNull().default(0),
  successRate:      float("successRate"),
  avgLatencyMs:     int("avgLatencyMs"),
  avgTokensUsed:    int("avgTokensUsed"),
  estimatedCostUsd: float("estimatedCostUsd"),
  version:          varchar("version", { length: 32 }).notNull().default("1.0"),
  tags:             text("tags"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DmAiPipeline = typeof dmAiPipelines.$inferSelect;
export type InsertDmAiPipeline = typeof dmAiPipelines.$inferInsert;

// ── Pipeline Runs ──────────────────────────────────────────────────────────────
// Immutable run history for each AI pipeline execution.
// status: running | success | failed | cancelled | timeout
export const dmPipelineRuns = mysqlTable("dmPipelineRuns", {
  id:             int("id").primaryKey().autoincrement(),
  pipelineId:     int("pipelineId").notNull(),
  ventureId:      varchar("ventureId", { length: 64 }),
  status:         varchar("status", { length: 16 }).notNull().default("running"),
  inputPayload:   text("inputPayload"),        // JSON
  outputPayload:  text("outputPayload"),       // JSON
  tokensUsed:     int("tokensUsed"),
  latencyMs:      int("latencyMs"),
  costUsd:        float("costUsd"),
  errorMessage:   text("errorMessage"),
  triggeredBy:    varchar("triggeredBy", { length: 64 }), // user | workflow | schedule | api
  triggeredById:  varchar("triggeredById", { length: 128 }),
  startedAt:      timestamp("startedAt").defaultNow().notNull(),
  completedAt:    timestamp("completedAt"),
});
export type DmPipelineRun = typeof dmPipelineRuns.$inferSelect;
export type InsertDmPipelineRun = typeof dmPipelineRuns.$inferInsert;

// ── RAG Pipelines ──────────────────────────────────────────────────────────────
// Retrieval-Augmented Generation pipeline configurations.
// retrievalStrategy: similarity | mmr | hybrid | keyword | rerank
// embeddingModel: text-embedding-3-small | text-embedding-3-large | ada-002
// status: draft | indexing | ready | error | stale
export const dmRagPipelines = mysqlTable("dmRagPipelines", {
  id:                 int("id").primaryKey().autoincrement(),
  ventureId:          varchar("ventureId", { length: 64 }),
  name:               varchar("name", { length: 255 }).notNull(),
  description:        text("description"),
  embeddingModel:     varchar("embeddingModel", { length: 128 }).notNull().default("text-embedding-3-small"),
  chunkSize:          int("chunkSize").notNull().default(512),
  chunkOverlap:       int("chunkOverlap").notNull().default(64),
  retrievalStrategy:  varchar("retrievalStrategy", { length: 32 }).notNull().default("similarity"),
  topK:               int("topK").notNull().default(5),
  similarityThreshold: float("similarityThreshold").default(0.7),
  systemPrompt:       text("systemPrompt"),
  contextTemplate:    text("contextTemplate"),  // How retrieved docs are injected into prompt
  rerankModel:        varchar("rerankModel", { length: 128 }),
  linkedAssetIds:     text("linkedAssetIds"),   // JSON array of dmDataAssets.id
  documentCount:      int("documentCount").notNull().default(0),
  chunkCount:         int("chunkCount").notNull().default(0),
  status:             varchar("status", { length: 16 }).notNull().default("draft"),
  lastIndexedAt:      timestamp("lastIndexedAt"),
  avgRetrievalMs:     int("avgRetrievalMs"),
  totalQueries:       int("totalQueries").notNull().default(0),
  avgRelevanceScore:  float("avgRelevanceScore"),
  tags:               text("tags"),
  notes:              text("notes"),
  createdAt:          timestamp("createdAt").defaultNow().notNull(),
  updatedAt:          timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DmRagPipeline = typeof dmRagPipelines.$inferSelect;
export type InsertDmRagPipeline = typeof dmRagPipelines.$inferInsert;

// ── RAG Documents ──────────────────────────────────────────────────────────────
// Individual documents registered in a RAG pipeline's document store.
// status: pending | indexed | failed | excluded
export const dmRagDocuments = mysqlTable("dmRagDocuments", {
  id:           int("id").primaryKey().autoincrement(),
  ragPipelineId: int("ragPipelineId").notNull(),
  assetId:      int("assetId"),               // optional link to dmDataAssets
  title:        varchar("title", { length: 255 }).notNull(),
  contentType:  varchar("contentType", { length: 32 }).notNull().default("text"), // text | pdf | docx | url | code
  storageUrl:   text("storageUrl"),
  storageKey:   varchar("storageKey", { length: 512 }),
  chunkCount:   int("chunkCount").notNull().default(0),
  sizeKb:       int("sizeKb"),
  status:       varchar("status", { length: 16 }).notNull().default("pending"),
  indexedAt:    timestamp("indexedAt"),
  metadata:     text("metadata"),             // JSON: author, date, source, tags
  notes:        text("notes"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type DmRagDocument = typeof dmRagDocuments.$inferSelect;
export type InsertDmRagDocument = typeof dmRagDocuments.$inferInsert;

// ── Fine-Tuning Jobs ───────────────────────────────────────────────────────────
// Tracks fine-tuning job lifecycle from dataset prep to model deployment.
// status: draft | preparing | training | evaluating | completed | failed | cancelled
export const dmFineTuningJobs = mysqlTable("dmFineTuningJobs", {
  id:               int("id").primaryKey().autoincrement(),
  ventureId:        varchar("ventureId", { length: 64 }),
  name:             varchar("name", { length: 255 }).notNull(),
  description:      text("description"),
  baseModel:        varchar("baseModel", { length: 128 }).notNull(),
  targetTask:       varchar("targetTask", { length: 128 }),  // e.g. "interview summarisation"
  datasetId:        int("datasetId"),
  trainingSamples:  int("trainingSamples"),
  validationSamples: int("validationSamples"),
  epochs:           int("epochs"),
  learningRate:     float("learningRate"),
  batchSize:        int("batchSize"),
  trainLoss:        float("trainLoss"),
  valLoss:          float("valLoss"),
  accuracy:         float("accuracy"),
  fineTunedModelId: varchar("fineTunedModelId", { length: 255 }), // provider model ID
  status:           varchar("status", { length: 16 }).notNull().default("draft"),
  startedAt:        timestamp("startedAt"),
  completedAt:      timestamp("completedAt"),
  estimatedCostUsd: float("estimatedCostUsd"),
  actualCostUsd:    float("actualCostUsd"),
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DmFineTuningJob = typeof dmFineTuningJobs.$inferSelect;
export type InsertDmFineTuningJob = typeof dmFineTuningJobs.$inferInsert;

// ── Fine-Tuning Datasets ───────────────────────────────────────────────────────
// Training data collections used for fine-tuning jobs.
// splitType: train_only | train_val | train_val_test
// status: draft | labelling | ready | archived
export const dmFineTuningDatasets = mysqlTable("dmFineTuningDatasets", {
  id:             int("id").primaryKey().autoincrement(),
  ventureId:      varchar("ventureId", { length: 64 }),
  name:           varchar("name", { length: 255 }).notNull(),
  description:    text("description"),
  taskType:       varchar("taskType", { length: 64 }),  // classification | generation | summarisation | extraction
  totalSamples:   int("totalSamples").notNull().default(0),
  labelledSamples: int("labelledSamples").notNull().default(0),
  trainSplit:     float("trainSplit").notNull().default(0.8),
  valSplit:       float("valSplit").notNull().default(0.1),
  testSplit:      float("testSplit").notNull().default(0.1),
  storageUrl:     text("storageUrl"),
  storageKey:     varchar("storageKey", { length: 512 }),
  format:         varchar("format", { length: 32 }).notNull().default("jsonl"), // jsonl | csv | parquet
  linkedAssetIds: text("linkedAssetIds"),
  status:         varchar("status", { length: 16 }).notNull().default("draft"),
  qualityScore:   float("qualityScore"),
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DmFineTuningDataset = typeof dmFineTuningDatasets.$inferSelect;
export type InsertDmFineTuningDataset = typeof dmFineTuningDatasets.$inferInsert;

// ── Feedback Entries ───────────────────────────────────────────────────────────
// User feedback on AI-generated outputs — powers the feedback loop for model improvement.
// feedbackType: thumbs_up | thumbs_down | rating | correction | flag
// status: open | reviewed | actioned | dismissed
export const dmFeedbackEntries = mysqlTable("dmFeedbackEntries", {
  id:               int("id").primaryKey().autoincrement(),
  pipelineId:       int("pipelineId"),         // optional link to dmAiPipelines
  runId:            int("runId"),              // optional link to dmPipelineRuns
  ragPipelineId:    int("ragPipelineId"),      // optional link to dmRagPipelines
  ventureId:        varchar("ventureId", { length: 64 }),
  feedbackType:     varchar("feedbackType", { length: 32 }).notNull().default("rating"),
  rating:           int("rating"),             // 1-5 stars
  thumbs:           varchar("thumbs", { length: 8 }),  // up | down
  originalOutput:   text("originalOutput"),    // The AI output being rated
  correctedOutput:  text("correctedOutput"),   // User's corrected version
  comment:          text("comment"),
  inputContext:     text("inputContext"),       // What was the input that produced this output
  issueCategory:    varchar("issueCategory", { length: 64 }), // factual_error | tone | format | missing_info | hallucination | other
  improvementAction: text("improvementAction"), // What was done to fix it
  status:           varchar("status", { length: 16 }).notNull().default("open"),
  submittedBy:      varchar("submittedBy", { length: 128 }),
  reviewedBy:       varchar("reviewedBy", { length: 128 }),
  reviewedAt:       timestamp("reviewedAt"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DmFeedbackEntry = typeof dmFeedbackEntries.$inferSelect;
export type InsertDmFeedbackEntry = typeof dmFeedbackEntries.$inferInsert;

// ─── COMMERCIAL CRM ───────────────────────────────────────────────────────────

export const crmPipelines = mysqlTable("crmPipelines", {
  id:          int("id").primaryKey().autoincrement(),
  ventureId:   varchar("ventureId", { length: 36 }),
  offeringId:  varchar("offeringId", { length: 36 }),
  name:        varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isDefault:   boolean("isDefault").default(false),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CrmPipeline = typeof crmPipelines.$inferSelect;
export type InsertCrmPipeline = typeof crmPipelines.$inferInsert;

export const crmPipelineStages = mysqlTable("crmPipelineStages", {
  id:          int("id").primaryKey().autoincrement(),
  pipelineId:   varchar("pipelineId", { length: 36 }).notNull(),
  name:         varchar("name", { length: 100 }).notNull(),
  order:        int("order").notNull().default(0),
  probability:  int("probability").default(0), // 0-100 win probability %
  color:        varchar("color", { length: 20 }).default("#6b7280"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type CrmPipelineStage = typeof crmPipelineStages.$inferSelect;
export type InsertCrmPipelineStage = typeof crmPipelineStages.$inferInsert;

export const crmContacts = mysqlTable("crmContacts", {
  id:          int("id").primaryKey().autoincrement(),
  ventureId:       varchar("ventureId", { length: 36 }),
  firstName:       varchar("firstName", { length: 100 }).notNull(),
  lastName:        varchar("lastName", { length: 100 }).notNull(),
  company:         varchar("company", { length: 255 }),
  jobTitle:        varchar("jobTitle", { length: 255 }),
  email:           varchar("email", { length: 255 }),
  phone:           varchar("phone", { length: 50 }),
  linkedinUrl:     varchar("linkedinUrl", { length: 500 }),
  contactType:     varchar("contactType", { length: 50 }).default("prospect"), // prospect | customer | partner | supplier | other
  status:          varchar("status", { length: 50 }).default("active"), // active | inactive | do_not_contact
  source:          varchar("source", { length: 100 }), // referral | linkedin | event | inbound | outbound | other
  tags:            text("tags"), // JSON array of tags
  notes:           text("notes"),
  lastContactedAt: bigint("lastContactedAt", { mode: "number" }),
  nextFollowUpAt:  bigint("nextFollowUpAt", { mode: "number" }),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CrmContact = typeof crmContacts.$inferSelect;
export type InsertCrmContact = typeof crmContacts.$inferInsert;

export const crmLeads = mysqlTable("crmLeads", {
  id:          int("id").primaryKey().autoincrement(),
  ventureId:       varchar("ventureId", { length: 36 }),
  contactId:       varchar("contactId", { length: 36 }),
  title:           varchar("title", { length: 255 }).notNull(),
  company:         varchar("company", { length: 255 }),
  source:          varchar("source", { length: 100 }), // referral | linkedin | event | inbound | cold_outreach | partner | other
  status:          varchar("status", { length: 50 }).default("new"), // new | contacted | qualified | unqualified | converted
  score:           int("score").default(0), // 0-100 lead score
  estimatedValue:  int("estimatedValue").default(0), // £
  assignedTo:      varchar("assignedTo", { length: 100 }),
  nextAction:      varchar("nextAction", { length: 255 }),
  nextActionDate:  bigint("nextActionDate", { mode: "number" }),
  notes:           text("notes"),
  convertedDealId: varchar("convertedDealId", { length: 36 }),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CrmLead = typeof crmLeads.$inferSelect;
export type InsertCrmLead = typeof crmLeads.$inferInsert;

export const crmDeals = mysqlTable("crmDeals", {
  id:          int("id").primaryKey().autoincrement(),
  ventureId:       varchar("ventureId", { length: 36 }),
  pipelineId:      varchar("pipelineId", { length: 36 }),
  stageId:         varchar("stageId", { length: 36 }),
  contactId:       varchar("contactId", { length: 36 }),
  title:           varchar("title", { length: 255 }).notNull(),
  company:         varchar("company", { length: 255 }),
  value:           int("value").default(0), // £
  currency:        varchar("currency", { length: 10 }).default("GBP"),
  probability:     int("probability").default(0), // 0-100 %
  expectedCloseAt: bigint("expectedCloseAt", { mode: "number" }),
  closedAt:        bigint("closedAt", { mode: "number" }),
  status:          varchar("status", { length: 50 }).default("open"), // open | won | lost | on_hold
  lostReason:      varchar("lostReason", { length: 255 }),
  assignedTo:      varchar("assignedTo", { length: 100 }),
  tags:            text("tags"), // JSON array
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CrmDeal = typeof crmDeals.$inferSelect;
export type InsertCrmDeal = typeof crmDeals.$inferInsert;

export const crmActivities = mysqlTable("crmActivities", {
  id:          int("id").primaryKey().autoincrement(),
  ventureId:   varchar("ventureId", { length: 36 }),
  contactId:   varchar("contactId", { length: 36 }),
  dealId:      varchar("dealId", { length: 36 }),
  leadId:      varchar("leadId", { length: 36 }),
  type:        varchar("type", { length: 50 }).notNull(), // call | email | meeting | demo | proposal | follow_up | note | task
  subject:     varchar("subject", { length: 255 }).notNull(),
  description: text("description"),
  outcome:     varchar("outcome", { length: 255 }),
  dueAt:       bigint("dueAt", { mode: "number" }),
  completedAt: bigint("completedAt", { mode: "number" }),
  status:      varchar("status", { length: 50 }).default("pending"), // pending | completed | cancelled
  assignedTo:  varchar("assignedTo", { length: 100 }),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CrmActivity = typeof crmActivities.$inferSelect;
export type InsertCrmActivity = typeof crmActivities.$inferInsert;

// ─── INVESTOR CRM ─────────────────────────────────────────────────────────────

export const invContacts = mysqlTable("invContacts", {
  id:          int("id").primaryKey().autoincrement(),
  ventureId:        varchar("ventureId", { length: 36 }),
  name:             varchar("name", { length: 255 }).notNull(),
  fund:             varchar("fund", { length: 255 }),
  role:             varchar("role", { length: 100 }), // Partner | Principal | Associate | Angel | Family Office | Corporate VC
  investorType:     varchar("investorType", { length: 50 }).default("vc"), // vc | angel | family_office | corporate | government | accelerator | crowdfunding
  email:            varchar("email", { length: 255 }),
  phone:            varchar("phone", { length: 50 }),
  linkedinUrl:      varchar("linkedinUrl", { length: 500 }),
  websiteUrl:       varchar("websiteUrl", { length: 500 }),
  portfolioFocus:   text("portfolioFocus"), // JSON array of sectors
  geographicFocus:  varchar("geographicFocus", { length: 255 }),
  minChequeSize:    int("minChequeSize").default(0), // £
  maxChequeSize:    int("maxChequeSize").default(0), // £
  preferredStage:   varchar("preferredStage", { length: 100 }), // pre-seed | seed | series-a | series-b | growth
  relationshipStatus: varchar("relationshipStatus", { length: 50 }).default("prospect"), // prospect | contacted | meeting_scheduled | term_sheet | invested | passed | on_hold
  warmIntro:        boolean("warmIntro").default(false),
  introSource:      varchar("introSource", { length: 255 }),
  lastContactedAt:  bigint("lastContactedAt", { mode: "number" }),
  nextFollowUpAt:   bigint("nextFollowUpAt", { mode: "number" }),
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InvContact = typeof invContacts.$inferSelect;
export type InsertInvContact = typeof invContacts.$inferInsert;

export const invFundingRounds = mysqlTable("invFundingRounds", {
  id:          int("id").primaryKey().autoincrement(),
  ventureId:       varchar("ventureId", { length: 36 }).notNull(),
  name:            varchar("name", { length: 255 }).notNull(), // e.g. "Pre-Seed Round", "Seed Round A"
  roundType:       varchar("roundType", { length: 50 }).notNull(), // pre_seed | seed | series_a | series_b | bridge | convertible_note | safe | grant | crowdfunding
  targetAmount:    int("targetAmount").default(0), // £
  raisedAmount:    int("raisedAmount").default(0), // £
  preMoneyVal:     int("preMoneyVal").default(0), // £
  postMoneyVal:    int("postMoneyVal").default(0), // £
  equityOffered:   int("equityOffered").default(0), // %
  status:          varchar("status", { length: 50 }).default("planning"), // planning | open | closing | closed | cancelled
  openedAt:        bigint("openedAt", { mode: "number" }),
  targetCloseAt:   bigint("targetCloseAt", { mode: "number" }),
  closedAt:        bigint("closedAt", { mode: "number" }),
  leadInvestor:    varchar("leadInvestor", { length: 255 }),
  useOfFunds:      text("useOfFunds"), // JSON breakdown
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InvFundingRound = typeof invFundingRounds.$inferSelect;
export type InsertInvFundingRound = typeof invFundingRounds.$inferInsert;

export const invTermSheets = mysqlTable("invTermSheets", {
  id:          int("id").primaryKey().autoincrement(),
  roundId:           varchar("roundId", { length: 36 }).notNull(),
  ventureId:         varchar("ventureId", { length: 36 }).notNull(),
  investorContactId: varchar("investorContactId", { length: 36 }),
  investorName:      varchar("investorName", { length: 255 }).notNull(),
  investmentAmount:  int("investmentAmount").default(0), // £
  preMoneyVal:       int("preMoneyVal").default(0), // £
  equityPercent:     int("equityPercent").default(0), // %
  instrumentType:    varchar("instrumentType", { length: 50 }).default("equity"), // equity | safe | convertible_note | revenue_share
  liquidationPref:   varchar("liquidationPref", { length: 100 }), // 1x non-participating | 1x participating | 2x non-participating
  antiDilution:      varchar("antiDilution", { length: 100 }), // none | broad_based_weighted_avg | narrow_based | full_ratchet
  boardSeat:         boolean("boardSeat").default(false),
  proRataRights:     boolean("proRataRights").default(false),
  informationRights: boolean("informationRights").default(true),
  dragAlong:         boolean("dragAlong").default(false),
  tagAlong:          boolean("tagAlong").default(false),
  vestingSchedule:   varchar("vestingSchedule", { length: 255 }),
  status:            varchar("status", { length: 50 }).default("draft"), // draft | sent | under_negotiation | signed | declined | expired
  receivedAt:        bigint("receivedAt", { mode: "number" }),
  expiresAt:         bigint("expiresAt", { mode: "number" }),
  signedAt:          bigint("signedAt", { mode: "number" }),
  documentUrl:       varchar("documentUrl", { length: 1000 }),
  notes:             text("notes"),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
  updatedAt:         timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InvTermSheet = typeof invTermSheets.$inferSelect;
export type InsertInvTermSheet = typeof invTermSheets.$inferInsert;

export const invCapTable = mysqlTable("invCapTable", {
  id:          int("id").primaryKey().autoincrement(),
  ventureId:        varchar("ventureId", { length: 36 }).notNull(),
  roundId:          varchar("roundId", { length: 36 }),
  shareholderName:  varchar("shareholderName", { length: 255 }).notNull(),
  shareholderType:  varchar("shareholderType", { length: 50 }).default("founder"), // founder | investor | employee | advisor | esop_pool | other
  shareClass:       varchar("shareClass", { length: 50 }).default("ordinary"), // ordinary | preference | seed | series_a | option | warrant
  numberOfShares:   int("numberOfShares").default(0),
  ownershipPercent: int("ownershipPercent").default(0), // stored as basis points (100 = 1%)
  pricePerShare:    int("pricePerShare").default(0), // pence
  investmentAmount: int("investmentAmount").default(0), // £
  vestingStart:     bigint("vestingStart", { mode: "number" }),
  vestingCliff:     int("vestingCliff").default(0), // months
  vestingPeriod:    int("vestingPeriod").default(0), // months
  fullyDiluted:     boolean("fullyDiluted").default(true),
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InvCapTableEntry = typeof invCapTable.$inferSelect;
export type InsertInvCapTableEntry = typeof invCapTable.$inferInsert;

export const invDueDiligence = mysqlTable("invDueDiligence", {
  id:          int("id").primaryKey().autoincrement(),
  roundId:      varchar("roundId", { length: 36 }).notNull(),
  ventureId:    varchar("ventureId", { length: 36 }).notNull(),
  category:     varchar("category", { length: 50 }).notNull(), // legal | financial | technical | commercial | team | ip | regulatory
  itemName:     varchar("itemName", { length: 255 }).notNull(),
  description:  text("description"),
  status:       varchar("status", { length: 50 }).default("pending"), // pending | in_progress | completed | waived | flagged
  priority:     varchar("priority", { length: 20 }).default("medium"), // low | medium | high | critical
  assignedTo:   varchar("assignedTo", { length: 100 }),
  documentUrl:  varchar("documentUrl", { length: 1000 }),
  dueAt:        bigint("dueAt", { mode: "number" }),
  completedAt:  bigint("completedAt", { mode: "number" }),
  notes:        text("notes"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InvDueDiligenceItem = typeof invDueDiligence.$inferSelect;
export type InsertInvDueDiligenceItem = typeof invDueDiligence.$inferInsert;

export const invUpdates = mysqlTable("invUpdates", {
  id:          int("id").primaryKey().autoincrement(),
  ventureId:    varchar("ventureId", { length: 36 }).notNull(),
  roundId:      varchar("roundId", { length: 36 }),
  title:        varchar("title", { length: 255 }).notNull(),
  updateType:   varchar("updateType", { length: 50 }).default("monthly"), // monthly | quarterly | milestone | ad_hoc | agm
  content:      text("content").notNull(), // markdown
  keyMetrics:   text("keyMetrics"), // JSON: { mrr, runway, headcount, trl, vrl }
  sentAt:       bigint("sentAt", { mode: "number" }),
  recipients:   text("recipients"), // JSON array of investor contact IDs
  status:       varchar("status", { length: 50 }).default("draft"), // draft | sent | archived
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InvUpdate = typeof invUpdates.$inferSelect;
export type InsertInvUpdate = typeof invUpdates.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// SPRINT 51 — GOVERNANCE & RBAC
// Tables: auditLog, venturePermissions, governancePolicies, complianceChecks, riskRegister
// ═══════════════════════════════════════════════════════════════════════════════

// ── Audit Log ─────────────────────────────────────────────────────────────────
export const auditLog = mysqlTable("auditLog", {
  id:           int("id").primaryKey().autoincrement(),
  userId:       varchar("userId", { length: 64 }),
  userName:     varchar("userName", { length: 255 }),
  action:       varchar("action", { length: 128 }).notNull(),
  module:       varchar("module", { length: 64 }).notNull(),
  resourceType: varchar("resourceType", { length: 64 }),
  resourceId:   varchar("resourceId", { length: 64 }),
  ventureId:    varchar("ventureId", { length: 64 }),
  before:       text("before"),
  after:        text("after"),
  ipAddress:    varchar("ipAddress", { length: 64 }),
  userAgent:    text("userAgent"),
  status:       varchar("status", { length: 32 }).default("success"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

// ── Venture Permissions ───────────────────────────────────────────────────────
export const venturePermissions = mysqlTable("venturePermissions", {
  id:        int("id").primaryKey().autoincrement(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  userId:    varchar("userId", { length: 64 }).notNull(),
  role:      mysqlEnum("role", ["owner", "editor", "viewer", "advisor", "investor"]).notNull().default("viewer"),
  grantedBy: varchar("grantedBy", { length: 64 }),
  expiresAt: timestamp("expiresAt"),
  notes:     text("notes"),
  isActive:  tinyint("isActive").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VenturePermission = typeof venturePermissions.$inferSelect;
export type InsertVenturePermission = typeof venturePermissions.$inferInsert;

// ── Governance Policies ───────────────────────────────────────────────────────
export const governancePolicies = mysqlTable("governancePolicies", {
  id:              int("id").primaryKey().autoincrement(),
  policyName:      varchar("policyName", { length: 255 }).notNull(),
  module:          varchar("module", { length: 64 }).notNull(),
  allowedRoles:    text("allowedRoles").notNull(),
  permissionLevel: mysqlEnum("permissionLevel", ["read", "write", "admin", "none"]).notNull().default("read"),
  description:     text("description"),
  isActive:        tinyint("isActive").default(1),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GovernancePolicy = typeof governancePolicies.$inferSelect;
export type InsertGovernancePolicy = typeof governancePolicies.$inferInsert;

// ── Compliance Checks ─────────────────────────────────────────────────────────
export const complianceChecks = mysqlTable("complianceChecks", {
  id:           int("id").primaryKey().autoincrement(),
  ventureId:    varchar("ventureId", { length: 64 }),
  framework:    varchar("framework", { length: 128 }).notNull(),
  requirement:  varchar("requirement", { length: 512 }).notNull(),
  status:       mysqlEnum("status", ["not_started","in_progress","compliant","non_compliant","exempt","under_review"]).default("not_started"),
  owner:        varchar("owner", { length: 255 }),
  dueDate:      varchar("dueDate", { length: 32 }),
  evidenceUrl:  text("evidenceUrl"),
  notes:        text("notes"),
  lastReviewed: timestamp("lastReviewed"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ComplianceCheck = typeof complianceChecks.$inferSelect;
export type InsertComplianceCheck = typeof complianceChecks.$inferInsert;

// ── Risk Register ─────────────────────────────────────────────────────────────
export const riskRegister = mysqlTable("riskRegister", {
  id:              int("id").primaryKey().autoincrement(),
  ventureId:       varchar("ventureId", { length: 64 }),
  title:           varchar("title", { length: 512 }).notNull(),
  category:        mysqlEnum("category", ["strategic","operational","financial","legal","technical","reputational","environmental"]).notNull().default("operational"),
  likelihood:      int("likelihood").default(3),
  impact:          int("impact").default(3),
  riskScore:       int("riskScore"),
  status:          mysqlEnum("status", ["open","mitigated","accepted","closed","escalated"]).default("open"),
  owner:           varchar("owner", { length: 255 }),
  mitigationPlan:  text("mitigationPlan"),
  residualRisk:    int("residualRisk"),
  reviewDate:      varchar("reviewDate", { length: 32 }),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RiskRegisterEntry = typeof riskRegister.$inferSelect;
export type InsertRiskRegisterEntry = typeof riskRegister.$inferInsert;
// Sprint 52 — Financial Model Builder schema additions
// Append to drizzle/schema.ts

// ── P&L Lines ─────────────────────────────────────────────────────────────────
export const finPlLines = mysqlTable("finPlLines", {
  id:          int("id").primaryKey().autoincrement(),
  ventureId:   varchar("ventureId", { length: 64 }),
  category:    mysqlEnum("category", ["revenue","cogs","gross_profit","opex","ebitda","depreciation","ebit","interest","tax","net_profit"]).notNull().default("revenue"),
  lineItem:    varchar("lineItem", { length: 255 }).notNull(),
  year1:       int("year1").default(0),
  year2:       int("year2").default(0),
  year3:       int("year3").default(0),
  year4:       int("year4").default(0),
  year5:       int("year5").default(0),
  unit:        varchar("unit", { length: 32 }).default("GBP"),
  notes:       text("notes"),
  sortOrder:   int("sortOrder").default(0),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FinPlLine = typeof finPlLines.$inferSelect;
export type InsertFinPlLine = typeof finPlLines.$inferInsert;

// ── Runway Scenarios ──────────────────────────────────────────────────────────
export const finRunwayScenarios = mysqlTable("finRunwayScenarios", {
  id:              int("id").primaryKey().autoincrement(),
  ventureId:       varchar("ventureId", { length: 64 }),
  name:            varchar("name", { length: 255 }).notNull(),
  cashBalance:     int("cashBalance").default(0),
  monthlyBurn:     int("monthlyBurn").default(0),
  monthlyRevenue:  int("monthlyRevenue").default(0),
  growthRate:      int("growthRate").default(0),
  runwayMonths:    int("runwayMonths"),
  breakEvenMonth:  int("breakEvenMonth"),
  scenario:        mysqlEnum("scenario", ["base","optimistic","pessimistic"]).default("base"),
  assumptions:     text("assumptions"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FinRunwayScenario = typeof finRunwayScenarios.$inferSelect;
export type InsertFinRunwayScenario = typeof finRunwayScenarios.$inferInsert;

// ── Exit Waterfall ────────────────────────────────────────────────────────────
export const finExitWaterfall = mysqlTable("finExitWaterfall", {
  id:                  int("id").primaryKey().autoincrement(),
  ventureId:           varchar("ventureId", { length: 64 }),
  exitValuation:       int("exitValuation").default(0),
  exitType:            mysqlEnum("exitType", ["acquisition","ipo","secondary","mbo","liquidation"]).default("acquisition"),
  preMoneyValuation:   int("preMoneyValuation").default(0),
  totalInvested:       int("totalInvested").default(0),
  liquidationPref:     mysqlEnum("liquidationPref", ["none","1x_non_participating","1x_participating","2x_non_participating"]).default("1x_non_participating"),
  antiDilution:        mysqlEnum("antiDilution", ["none","broad_based","narrow_based","full_ratchet"]).default("none"),
  notes:               text("notes"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FinExitWaterfall = typeof finExitWaterfall.$inferSelect;
export type InsertFinExitWaterfall = typeof finExitWaterfall.$inferInsert;

// ── Waterfall Tranches ────────────────────────────────────────────────────────
export const finWaterfallTranches = mysqlTable("finWaterfallTranches", {
  id:            int("id").primaryKey().autoincrement(),
  waterfallId:   int("waterfallId").notNull(),
  investorName:  varchar("investorName", { length: 255 }).notNull(),
  investorType:  mysqlEnum("investorType", ["founder","angel","seed","series_a","series_b","employee","option_pool"]).default("angel"),
  shares:        int("shares").default(0),
  ownershipPct:  int("ownershipPct").default(0),
  invested:      int("invested").default(0),
  pref:          mysqlEnum("pref", ["common","preferred"]).default("common"),
  sortOrder:     int("sortOrder").default(0),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
});
export type FinWaterfallTranche = typeof finWaterfallTranches.$inferSelect;
export type InsertFinWaterfallTranche = typeof finWaterfallTranches.$inferInsert;

// ── Investor Report Packs ─────────────────────────────────────────────────────
export const finInvestorReports = mysqlTable("finInvestorReports", {
  id:           int("id").primaryKey().autoincrement(),
  ventureId:    varchar("ventureId", { length: 64 }),
  title:        varchar("title", { length: 255 }).notNull(),
  period:       varchar("period", { length: 64 }),
  reportType:   mysqlEnum("reportType", ["monthly","quarterly","annual","ad_hoc"]).default("monthly"),
  status:       mysqlEnum("status", ["draft","review","sent","archived"]).default("draft"),
  highlights:   text("highlights"),
  challenges:   text("challenges"),
  nextSteps:    text("nextSteps"),
  kpiSnapshot:  text("kpiSnapshot"),
  generatedBy:  varchar("generatedBy", { length: 255 }),
  sentAt:       timestamp("sentAt"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FinInvestorReport = typeof finInvestorReports.$inferSelect;
export type InsertFinInvestorReport = typeof finInvestorReports.$inferInsert;

// ── Unit Economics ────────────────────────────────────────────────────────────
export const finUnitEconomics = mysqlTable("finUnitEconomics", {
  id:              int("id").primaryKey().autoincrement(),
  ventureId:       varchar("ventureId", { length: 64 }),
  period:          varchar("period", { length: 32 }),
  cac:             int("cac").default(0),
  ltv:             int("ltv").default(0),
  arpu:            int("arpu").default(0),
  churnRate:       int("churnRate").default(0),
  grossMargin:     int("grossMargin").default(0),
  paybackMonths:   int("paybackMonths"),
  ltvCacRatio:     int("ltvCacRatio"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FinUnitEconomics = typeof finUnitEconomics.$inferSelect;
export type InsertFinUnitEconomics = typeof finUnitEconomics.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// SPRINT 56 — Marketing Strategy, Brand Readiness & PR/Newsletter
// ═══════════════════════════════════════════════════════════════════════════════

// ── Marketing Campaigns ───────────────────────────────────────────────────────
export const marketingCampaigns = mysqlTable("marketingCampaigns", {
  id:              int("id").primaryKey().autoincrement(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  name:            varchar("name", { length: 255 }).notNull(),
  channel:         varchar("channel", { length: 64 }).notNull(),
  status:          varchar("status", { length: 32 }).notNull().default("Planned"),
  budget:          int("budget").default(0),
  spent:           int("spent").default(0),
  leads:           int("leads").default(0),
  conversions:     int("conversions").default(0),
  startDate:       varchar("startDate", { length: 32 }),
  endDate:         varchar("endDate", { length: 32 }),
  objective:       text("objective"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type InsertMarketingCampaign = typeof marketingCampaigns.$inferInsert;

// ── Marketing Channel Scores ──────────────────────────────────────────────────
export const marketingChannelScores = mysqlTable("marketingChannelScores", {
  id:              int("id").primaryKey().autoincrement(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  channel:         varchar("channel", { length: 64 }).notNull(),
  score:           int("score").default(0),
  period:          varchar("period", { length: 32 }),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MarketingChannelScore = typeof marketingChannelScores.$inferSelect;
export type InsertMarketingChannelScore = typeof marketingChannelScores.$inferInsert;

// ── Brand Readiness Scores ────────────────────────────────────────────────────
export const brandReadinessScores = mysqlTable("brandReadinessScores", {
  id:              int("id").primaryKey().autoincrement(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  dimension:       varchar("dimension", { length: 64 }).notNull(),
  score:           int("score").default(0),
  notes:           text("notes"),
  assessedAt:      timestamp("assessedAt").defaultNow(),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BrandReadinessScore = typeof brandReadinessScores.$inferSelect;
export type InsertBrandReadinessScore = typeof brandReadinessScores.$inferInsert;

// ── Brand Checklist Items ─────────────────────────────────────────────────────
export const brandChecklistItems = mysqlTable("brandChecklistItems", {
  id:              int("id").primaryKey().autoincrement(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  category:        varchar("category", { length: 64 }).notNull(),
  item:            varchar("item", { length: 255 }).notNull(),
  completed:       tinyint("completed").default(0),
  completedAt:     timestamp("completedAt"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BrandChecklistItem = typeof brandChecklistItems.$inferSelect;
export type InsertBrandChecklistItem = typeof brandChecklistItems.$inferInsert;

// ── Press Releases ────────────────────────────────────────────────────────────
export const pressReleases = mysqlTable("pressReleases", {
  id:              int("id").primaryKey().autoincrement(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  title:           varchar("title", { length: 255 }).notNull(),
  summary:         text("summary"),
  status:          varchar("status", { length: 32 }).notNull().default("Draft"),
  publishedAt:     timestamp("publishedAt"),
  mediaOutlets:    text("mediaOutlets"),
  coverageLinks:   text("coverageLinks"),
  reach:           int("reach").default(0),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PressRelease = typeof pressReleases.$inferSelect;
export type InsertPressRelease = typeof pressReleases.$inferInsert;

// ── Newsletter Campaigns ──────────────────────────────────────────────────────
export const newsletterCampaigns = mysqlTable("newsletterCampaigns", {
  id:              int("id").primaryKey().autoincrement(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  subject:         varchar("subject", { length: 255 }).notNull(),
  previewText:     varchar("previewText", { length: 255 }),
  status:          varchar("status", { length: 32 }).notNull().default("Draft"),
  scheduledAt:     timestamp("scheduledAt"),
  sentAt:          timestamp("sentAt"),
  recipients:      int("recipients").default(0),
  openRate:        int("openRate").default(0),
  clickRate:       int("clickRate").default(0),
  unsubscribes:    int("unsubscribes").default(0),
  contentUrl:      varchar("contentUrl", { length: 512 }),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type NewsletterCampaign = typeof newsletterCampaigns.$inferSelect;
export type InsertNewsletterCampaign = typeof newsletterCampaigns.$inferInsert;

// ── Media Coverage ────────────────────────────────────────────────────────────
export const mediaCoverage = mysqlTable("mediaCoverage", {
  id:              int("id").primaryKey().autoincrement(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  outlet:          varchar("outlet", { length: 255 }).notNull(),
  headline:        varchar("headline", { length: 512 }).notNull(),
  url:             varchar("url", { length: 512 }),
  sentiment:       varchar("sentiment", { length: 32 }).default("neutral"),
  reach:           int("reach").default(0),
  publishedAt:     timestamp("publishedAt"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MediaCoverage = typeof mediaCoverage.$inferSelect;
export type InsertMediaCoverage = typeof mediaCoverage.$inferInsert;

// ── Sprint 57: Specialist Services ───────────────────────────────────────────
export const specialists = mysqlTable("specialists", {
  id:            int("id").primaryKey().autoincrement(),
  name:          varchar("name", { length: 255 }).notNull(),
  role:          varchar("role", { length: 255 }).notNull(),
  category:      varchar("category", { length: 128 }).notNull(),
  rate:          varchar("rate", { length: 64 }).notNull().default("TBD"),
  availability:  varchar("availability", { length: 32 }).notNull().default("Available"),
  rating:        decimal("rating", { precision: 3, scale: 1 }).default("5.0"),
  completedJobs: int("completedJobs").default(0),
  bio:           text("bio"),
  skills:        text("skills"),        // JSON array of strings
  portfolioUrl:  varchar("portfolioUrl", { length: 512 }),
  linkedinUrl:   varchar("linkedinUrl", { length: 512 }),
  isVerified:    boolean("isVerified").default(false),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Specialist = typeof specialists.$inferSelect;
export type InsertSpecialist = typeof specialists.$inferInsert;

export const specialistCommissions = mysqlTable("specialistCommissions", {
  id:            int("id").primaryKey().autoincrement(),
  ventureId:     varchar("ventureId", { length: 64 }).notNull(),
  specialistId:  int("specialistId").notNull(),
  serviceTaskId: int("serviceTaskId"),
  title:         varchar("title", { length: 255 }).notNull(),
  brief:         text("brief"),
  status:        varchar("status", { length: 32 }).notNull().default("Open"),
  budget:        decimal("budget", { precision: 10, scale: 2 }),
  agreedFee:     decimal("agreedFee", { precision: 10, scale: 2 }),
  platformFee:   decimal("platformFee", { precision: 10, scale: 2 }),
  startDate:     timestamp("startDate"),
  dueDate:       timestamp("dueDate"),
  completedAt:   timestamp("completedAt"),
  notes:         text("notes"),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SpecialistCommission = typeof specialistCommissions.$inferSelect;
export type InsertSpecialistCommission = typeof specialistCommissions.$inferInsert;

export const specialistServiceTasks = mysqlTable("specialistServiceTasks", {
  id:           int("id").primaryKey().autoincrement(),
  ventureId:    varchar("ventureId", { length: 64 }).notNull(),
  title:        varchar("title", { length: 255 }).notNull(),
  description:  text("description"),
  category:     varchar("category", { length: 128 }).notNull(),
  priority:     varchar("priority", { length: 32 }).notNull().default("Medium"),
  status:       varchar("status", { length: 32 }).notNull().default("Open"),
  brlStage:     int("brlStage").default(1),
  estimatedHrs: decimal("estimatedHrs", { precision: 6, scale: 1 }),
  assignedTo:   int("assignedTo"),    // FK to specialists.id
  dueDate:      timestamp("dueDate"),
  completedAt:  timestamp("completedAt"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SpecialistServiceTask = typeof specialistServiceTasks.$inferSelect;
export type InsertSpecialistServiceTask = typeof specialistServiceTasks.$inferInsert;

// ── Sprint 60: Founder Onboarding Submissions ──────────────────────────────
export const founderOnboardingSubmissions = mysqlTable("founderOnboardingSubmissions", {
  id:                int("id").primaryKey().autoincrement(),
  // Venture details (Step 1)
  ventureName:       varchar("ventureName", { length: 255 }).notNull(),
  tagline:           varchar("tagline", { length: 255 }),
  sector:            varchar("sector", { length: 128 }).notNull(),
  channel:           varchar("channel", { length: 8 }).notNull(),
  nominatedCharity:  varchar("nominatedCharity", { length: 255 }),
  brandColor:        varchar("brandColor", { length: 16 }),
  // Canvas (Step 2)
  bmc:               text("bmc"),
  mmc:               text("mmc"),
  // Founder profile (Step 4)
  founderName:       varchar("founderName", { length: 255 }).notNull(),
  founderEmail:      varchar("founderEmail", { length: 255 }),
  // Task checklist snapshot (JSON string)
  checkedTasks:      text("checkedTasks"),
  checkedCount:      int("checkedCount").default(0),
  totalTasks:        int("totalTasks").default(26),
  // Linked records created on completion
  talentProfileId:   int("talentProfileId"),
  ventureId:         varchar("ventureId", { length: 64 }),
  // Status
  status:            varchar("status", { length: 32 }).notNull().default("Completed"),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
  updatedAt:         timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FounderOnboardingSubmission = typeof founderOnboardingSubmissions.$inferSelect;
export type InsertFounderOnboardingSubmission = typeof founderOnboardingSubmissions.$inferInsert;

// ── Sprint 61: Venture → Portfolio → Offering Architecture ───────────────────

export const portfolios = mysqlTable("portfolios", {
  id:            varchar("id", { length: 64 }).primaryKey(),
  ventureId:     varchar("ventureId", { length: 64 }).notNull(),
  name:          varchar("name", { length: 128 }).notNull(),
  description:   text("description"),
  portfolioType: mysqlEnum("portfolioType", [
    "Product", "Service", "Licensing", "Platform", "Mixed",
  ]).default("Mixed"),
  status:        mysqlEnum("portfolioStatus", ["Active", "Pre-Launch", "Archived"]).default("Pre-Launch"),
  color:         varchar("color", { length: 32 }).default("#51AF37"),
  sortOrder:     int("sortOrder").default(0),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;

export const offerings = mysqlTable("offerings", {
  id:             varchar("id", { length: 64 }).primaryKey(),
  portfolioId:    varchar("portfolioId", { length: 64 }).notNull(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  name:           varchar("name", { length: 128 }).notNull(),
  description:    text("description"),
  offeringType:   mysqlEnum("offeringType", [
    "Physical Product", "Digital Product", "Service", "SaaS",
    "Subscription", "Marketplace",
  ]).default("Physical Product"),
  offeringStatus: mysqlEnum("offeringStatus", [
    "Concept", "Development", "Pilot", "Live", "Scaling", "Sunset",
  ]).default("Concept"),
  trl:            int("trl").default(1),
  brlScore:       int("brlScore").default(0),
  revenueModel:   mysqlEnum("revenueModel", [
    "B2B", "D2C", "B2B2C", "Marketplace", "Licensing", "Freemium",
  ]).default("B2B"),
  targetSegment:  text("targetSegment"),
  pricePoint:     decimal("pricePoint", { precision: 12, scale: 2 }),
  currency:       varchar("currency", { length: 8 }).default("GBP"),
  launchDate:     date("launchDate"),
  color:          varchar("color", { length: 32 }).default("#3A97D3"),
  logoUrl:        text("logoUrl"),
  tags:           text("tags"),
  sortOrder:      int("sortOrder").default(0),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Offering = typeof offerings.$inferSelect;
export type InsertOffering = typeof offerings.$inferInsert;

// ── Offering-level KPI snapshots ──────────────────────────────────────────────
export const offeringKpiSnapshots = mysqlTable("offeringKpiSnapshots", {
  id:              int("id").primaryKey().autoincrement(),
  offeringId:      varchar("offeringId", { length: 64 }).notNull(),
  snapshotDate:    date("snapshotDate").notNull(),
  revenue:         decimal("revenue", { precision: 14, scale: 2 }),
  cogs:            decimal("cogs", { precision: 14, scale: 2 }),
  grossMargin:     float("grossMargin"),
  unitsSold:       int("unitsSold"),
  activeCustomers: int("activeCustomers"),
  cac:             decimal("cac", { precision: 10, scale: 2 }),
  ltv:             decimal("ltv", { precision: 10, scale: 2 }),
  nps:             int("nps"),
  trlAtSnapshot:   int("trlAtSnapshot"),
  brlAtSnapshot:   int("brlAtSnapshot"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type OfferingKpiSnapshot = typeof offeringKpiSnapshots.$inferSelect;

// ── Offering-level financial model ───────────────────────────────────────────
export const offeringFinancialModels = mysqlTable("offeringFinancialModels", {
  id:              int("id").primaryKey().autoincrement(),
  offeringId:      varchar("offeringId", { length: 64 }).notNull(),
  modelName:       varchar("modelName", { length: 128 }).notNull().default("Base Case"),
  revenueYear1:    decimal("revenueYear1", { precision: 14, scale: 2 }),
  revenueYear2:    decimal("revenueYear2", { precision: 14, scale: 2 }),
  revenueYear3:    decimal("revenueYear3", { precision: 14, scale: 2 }),
  cogsPercent:     float("cogsPercent"),
  opexMonthly:     decimal("opexMonthly", { precision: 12, scale: 2 }),
  breakEvenMonth:  int("breakEvenMonth"),
  fundingRequired: decimal("fundingRequired", { precision: 14, scale: 2 }),
  assumptions:     text("assumptions"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OfferingFinancialModel = typeof offeringFinancialModels.$inferSelect;

// ── Offering execution linkage tables (additive — no existing tables modified) ─
export const offeringWorkflowLinks = mysqlTable("offeringWorkflowLinks", {
  id:           int("id").primaryKey().autoincrement(),
  offeringId:   varchar("offeringId", { length: 64 }).notNull(),
  triggerLogId: int("triggerLogId").notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});

export const offeringRevenueLinks = mysqlTable("offeringRevenueLinks", {
  id:           int("id").primaryKey().autoincrement(),
  offeringId:   varchar("offeringId", { length: 64 }).notNull(),
  snapshotId:   int("snapshotId").notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});

export const offeringSupplyChainLinks = mysqlTable("offeringSupplyChainLinks", {
  id:           int("id").primaryKey().autoincrement(),
  offeringId:   varchar("offeringId", { length: 64 }).notNull(),
  projectId:    int("projectId").notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});

export const offeringExperimentLinks = mysqlTable("offeringExperimentLinks", {
  id:           int("id").primaryKey().autoincrement(),
  offeringId:   varchar("offeringId", { length: 64 }).notNull(),
  experimentId: int("experimentId").notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});

export const offeringRiskLinks = mysqlTable("offeringRiskLinks", {
  id:           int("id").primaryKey().autoincrement(),
  offeringId:   varchar("offeringId", { length: 64 }).notNull(),
  riskId:       int("riskId").notNull(),
  riskType:     mysqlEnum("offeringRiskType", ["venture", "engineering", "execution"]).default("venture"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});

export const offeringMilestoneLinks = mysqlTable("offeringMilestoneLinks", {
  id:           int("id").primaryKey().autoincrement(),
  offeringId:   varchar("offeringId", { length: 64 }).notNull(),
  milestoneId:  int("milestoneId").notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});

export const offeringCrmLinks = mysqlTable("offeringCrmLinks", {
  id:           int("id").primaryKey().autoincrement(),
  offeringId:   varchar("offeringId", { length: 64 }).notNull(),
  pipelineId:   int("pipelineId"),
  dealId:       int("dealId"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});

export const offeringAnalyticsLinks = mysqlTable("offeringAnalyticsLinks", {
  id:               int("id").primaryKey().autoincrement(),
  offeringId:       varchar("offeringId", { length: 64 }).notNull(),
  marketAnalysisId: int("marketAnalysisId"),
  reportId:         int("reportId"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});

// ── University Approval Reports (Sprint 62) ───────────────────────────────────
// Formal approval documents linking offering-level research, validation evidence,
// and academic partnerships for university/lecturer sign-off.
export const uniApprovalReports = mysqlTable("uniApprovalReports", {
  id:                   int("id").primaryKey().autoincrement(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  offeringId:           varchar("offeringId", { length: 64 }),
  portfolioId:          varchar("portfolioId", { length: 64 }),
  title:                varchar("title", { length: 255 }).notNull(),
  reportType:           mysqlEnum("uniApprovalReportType", [
    "syllabus_approval",
    "research_validation",
    "industry_engagement",
    "ethics_clearance",
    "ip_disclosure",
    "commercialisation_approval",
  ]).notNull().default("syllabus_approval"),
  status:               mysqlEnum("uniApprovalStatus", [
    "draft",
    "under_review",
    "approved",
    "rejected",
    "revision_requested",
    "archived",
  ]).notNull().default("draft"),
  productRiskOwner:     varchar("productRiskOwner", { length: 255 }),
  businessRiskOwner:    varchar("businessRiskOwner", { length: 255 }),
  executiveSummary:     text("executiveSummary"),
  problemStatement:     text("problemStatement"),
  researchObjectives:   text("researchObjectives"),
  methodology:          text("methodology"),
  validationEvidence:   text("validationEvidence"),
  academicContribution: text("academicContribution"),
  commercialPotential:  text("commercialPotential"),
  ethicsStatement:      text("ethicsStatement"),
  ipStatement:          text("ipStatement"),
  recommendations:      text("recommendations"),
  aiGenerated:          boolean("aiGenerated").default(false),
  aiContent:            text("aiContent"),
  confidenceScore:      int("confidenceScore"),
  submittedBy:          varchar("submittedBy", { length: 255 }),
  reviewedBy:           varchar("reviewedBy", { length: 255 }),
  approvedBy:           varchar("approvedBy", { length: 255 }),
  submittedAt:          bigint("submittedAt", { mode: "number" }),
  reviewedAt:           bigint("reviewedAt", { mode: "number" }),
  approvedAt:           bigint("approvedAt", { mode: "number" }),
  reviewNotes:          text("reviewNotes"),
  linkedResearchIds:    text("linkedResearchIds"),
  linkedPartnerIds:     text("linkedPartnerIds"),
  linkedTalentIds:      text("linkedTalentIds"),
  linkedGovernanceIds:  text("linkedGovernanceIds"),
  h4Stage:              mysqlEnum("h4Stage", [
    "problem_definition",
    "research_discovery",
    "hypothesis_development",
    "validation",
    "commercialisation",
  ]).default("problem_definition"),
  vrlStage:             int("vrlStage"),
  trlLevel:             int("trlLevel"),
  brlScore:             int("brlScore"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UniApprovalReport = typeof uniApprovalReports.$inferSelect;
export type InsertUniApprovalReport = typeof uniApprovalReports.$inferInsert;

// ── Offering Research Links (Sprint 62) ───────────────────────────────────────
export const offeringResearchLinks = mysqlTable("offeringResearchLinks", {
  id:                int("id").primaryKey().autoincrement(),
  offeringId:        varchar("offeringId", { length: 64 }).notNull(),
  researchProjectId: int("researchProjectId").notNull(),
  linkType:          mysqlEnum("offeringResearchLinkType", [
    "primary",
    "supporting",
    "validation",
    "market",
  ]).default("supporting"),
  notes:             text("notes"),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
});
export type OfferingResearchLink = typeof offeringResearchLinks.$inferSelect;
export type InsertOfferingResearchLink = typeof offeringResearchLinks.$inferInsert;

// ── Spin-Out Blueprints (Sprint 63) ───────────────────────────────────────────
// A Blueprint is created for a specific Offering (POI) and aggregates readiness
// signals from all Venture OS libraries. It gates the path to Execution Platform.
export const spinoutBlueprints = mysqlTable("spinoutBlueprints", {
  id:               int("id").primaryKey().autoincrement(),
  offeringId:       varchar("offeringId", { length: 64 }).notNull(),
  portfolioId:      varchar("portfolioId", { length: 64 }).notNull(),
  ventureId:        varchar("ventureId", { length: 64 }).notNull(),
  title:            varchar("title", { length: 255 }).notNull(),
  talentScore:      int("talentScore").default(0),
  supplyChainScore: int("supplyChainScore").default(0),
  financeScore:     int("financeScore").default(0),
  marketScore:      int("marketScore").default(0),
  technologyScore:  int("technologyScore").default(0),
  governanceScore:  int("governanceScore").default(0),
  overallScore:     int("overallScore").default(0),
  gateStatus:       mysqlEnum("blueprintGateStatus", [
    "not_ready",
    "approaching",
    "ready_to_review",
    "approved",
    "launched",
  ]).default("not_ready"),
  spinoffConfigId:  int("spinoffConfigId"),
  blueprintMarkdown:    text("blueprintMarkdown"),
  executionRoadmap:     text("executionRoadmap"),
  gapAnalysis:          text("gapAnalysis"),
  reviewedBy:       varchar("reviewedBy", { length: 128 }),
  reviewedAt:       timestamp("reviewedAt"),
  reviewNotes:      text("reviewNotes"),
  createdBy:        varchar("createdBy", { length: 128 }),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SpinoutBlueprint = typeof spinoutBlueprints.$inferSelect;
export type InsertSpinoutBlueprint = typeof spinoutBlueprints.$inferInsert;

// ── Blueprint Library Links (Sprint 63) ──────────────────────────────────────
// Explicit links from a Blueprint to individual records in each Venture OS library.
export const blueprintLibraryLinks = mysqlTable("blueprintLibraryLinks", {
  id:             int("id").primaryKey().autoincrement(),
  blueprintId:    int("blueprintId").notNull(),
  domain:         mysqlEnum("blueprintLinkDomain", [
    "talent",
    "supply_chain",
    "university",
    "research",
    "finance",
    "market",
    "ip",
    "legal",
    "crm",
    "specialist",
  ]).notNull(),
  linkedRecordId: varchar("linkedRecordId", { length: 64 }).notNull(),
  linkedRecordLabel: varchar("linkedRecordLabel", { length: 255 }),
  readinessWeight: int("readinessWeight").default(10),
  linkStatus:     mysqlEnum("blueprintLinkStatus", [
    "proposed",
    "confirmed",
    "contracted",
    "unavailable",
  ]).default("proposed"),
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BlueprintLibraryLink = typeof blueprintLibraryLinks.$inferSelect;
export type InsertBlueprintLibraryLink = typeof blueprintLibraryLinks.$inferInsert;

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  CULTURAL READINESS LEVEL (CRL) MODULE                                       ║
// ║  Wasserman (2012): 65% of high-potential startups fail due to co-founder     ║
// ║  conflict. CRL provides systematic, AI-powered cultural alignment assessment. ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ── CRL Assessments ───────────────────────────────────────────────────────────
export const crlAssessments = mysqlTable("crl_assessments", {
  id:             int("id").autoincrement().primaryKey(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  assessmentType: mysqlEnum("crlAssessmentType", ["initial", "periodic", "triggered"]).notNull().default("initial"),
  status:         mysqlEnum("crlAssessmentStatus", ["initiated", "in_progress", "completed"]).notNull().default("initiated"),
  h4Stage:        mysqlEnum("crlH4Stage", ["H4.1_ideation", "H4.2_build_launch", "H4.3_validation", "H4.4_grow_scale"]).notNull().default("H4.1_ideation"),
  overallAlignmentScore: float("overallAlignmentScore"),
  visionScore:           float("visionScore"),
  operationalScore:      float("operationalScore"),
  conflictScore:         float("conflictScore"),
  crlScore:              float("crlScore"),
  crlLevel:              int("crlLevel"),
  readinessLevel:        mysqlEnum("crlReadinessLevel", ["high", "moderate", "low"]),
  confidenceScore:       float("confidenceScore"),
  aiSummary:             text("aiSummary"),
  criticalMisalignments: text("criticalMisalignments"),
  actionPlan:            text("actionPlan"),
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
  updatedAt:  timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CrlAssessment = typeof crlAssessments.$inferSelect;
export type InsertCrlAssessment = typeof crlAssessments.$inferInsert;

// ── CRL Founder Responses ─────────────────────────────────────────────────────
export const crlFounderResponses = mysqlTable("crl_founder_responses", {
  id:             int("id").autoincrement().primaryKey(),
  assessmentId:   int("assessmentId").notNull(),
  founderId:      int("founderId").notNull(),
  founderName:    varchar("founderName", { length: 128 }).notNull(),
  questionId:     varchar("questionId", { length: 16 }).notNull(),
  questionPhase:  mysqlEnum("crlQuestionPhase", ["vision", "operational", "conflict"]).notNull(),
  responseText:   text("responseText").notNull(),
  responseOption: varchar("responseOption", { length: 64 }),
  confidenceLevel: int("confidenceLevel").default(3),
  submittedAt:    timestamp("submittedAt").defaultNow().notNull(),
});
export type CrlFounderResponse = typeof crlFounderResponses.$inferSelect;
export type InsertCrlFounderResponse = typeof crlFounderResponses.$inferInsert;

// ── CRL Interventions ─────────────────────────────────────────────────────────
export const crlInterventions = mysqlTable("crl_interventions", {
  id:               int("id").autoincrement().primaryKey(),
  ventureId:        varchar("ventureId", { length: 64 }).notNull(),
  assessmentId:     int("assessmentId"),
  triggeredBy:      mysqlEnum("crlTriggerReason", [
    "low_crl", "misalignment_detected", "founder_request", "scheduled_review", "drift_detected"
  ]).notNull(),
  interventionType: mysqlEnum("crlInterventionType", [
    "mediation", "founders_agreement", "coaching", "conflict_resolution", "check_in"
  ]).notNull(),
  status:           mysqlEnum("crlInterventionStatus", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
  participatingFounderIds: text("participatingFounderIds"),
  conversationLog:  text("conversationLog"),
  resolutionAchieved: boolean("resolutionAchieved").default(false),
  agreementsDocumented: text("agreementsDocumented"),
  followUpRequired: boolean("followUpRequired").default(false),
  followUpDate:     timestamp("followUpDate"),
  postInterventionCrl: float("postInterventionCrl"),
  crlImprovement:      float("crlImprovement"),
  founderSatisfactionScore: int("founderSatisfactionScore"),
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
  updatedAt:  timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CrlIntervention = typeof crlInterventions.$inferSelect;
export type InsertCrlIntervention = typeof crlInterventions.$inferInsert;

// ── CRL Monitoring Records ────────────────────────────────────────────────────
export const crlMonitoringRecords = mysqlTable("crl_monitoring_records", {
  id:             int("id").autoincrement().primaryKey(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  assessmentId:   int("assessmentId"),
  checkInDate:    timestamp("checkInDate").defaultNow().notNull(),
  frequency:      mysqlEnum("crlMonitoringFrequency", ["biweekly", "monthly", "quarterly"]).default("monthly"),
  crlScoreCurrent:  float("crlScoreCurrent"),
  crlScorePrevious: float("crlScorePrevious"),
  driftScore:       float("driftScore"),
  driftLevel:       mysqlEnum("crlDriftLevel", ["none", "minor", "moderate", "critical"]).default("none"),
  questionsChecked: text("questionsChecked"),
  driftDetected:    boolean("driftDetected").default(false),
  escalationTriggered: boolean("escalationTriggered").default(false),
  aiReport:         text("aiReport"),
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
});
export type CrlMonitoringRecord = typeof crlMonitoringRecords.$inferSelect;
export type InsertCrlMonitoringRecord = typeof crlMonitoringRecords.$inferInsert;

// ── VRL Dynamic Weight Configs ────────────────────────────────────────────────
export const vrlDynamicWeights = mysqlTable("vrl_dynamic_weights", {
  id:           int("id").autoincrement().primaryKey(),
  ventureId:    varchar("ventureId", { length: 64 }).notNull().unique(),
  h4Stage:      mysqlEnum("vrlDynH4Stage", ["H4.1_ideation", "H4.2_build_launch", "H4.3_validation", "H4.4_grow_scale"]).notNull().default("H4.1_ideation"),
  alphaWeight:  float("alphaWeight").notNull().default(0.225),
  betaWeight:   float("betaWeight").notNull().default(0.325),
  gammaWeight:  float("gammaWeight").notNull().default(0.450),
  trlNormalized: float("trlNormalized"),
  brlNormalized: float("brlNormalized"),
  crlNormalized: float("crlNormalized"),
  riskIndex:     float("riskIndex").default(0.3),
  confidenceScore: float("confidenceScore").default(0.7),
  computedVrl:   float("computedVrl"),
  trlContribution: float("trlContribution"),
  brlContribution: float("brlContribution"),
  crlContribution: float("crlContribution"),
  lastCalculatedAt: timestamp("lastCalculatedAt"),
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
  updatedAt:  timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VrlDynamicWeight = typeof vrlDynamicWeights.$inferSelect;
export type InsertVrlDynamicWeight = typeof vrlDynamicWeights.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// INVESTMENT MODULE — Sprint 66
// Tables: invReadinessScores, invOutputs, invTargets, invKpis, invFundraisingRounds
// ═══════════════════════════════════════════════════════════════════════════════

// ── Investment Readiness Scores ───────────────────────────────────────────────
export const invReadinessScores = mysqlTable("invReadinessScores", {
  id:                 int("id").autoincrement().primaryKey(),
  offeringId:         int("offeringId"),
  ventureId:          varchar("ventureId", { length: 64 }),
  commercialScore:    float("commercialScore").default(0),
  technicalScore:     float("technicalScore").default(0),
  validationScore:    float("validationScore").default(0),
  supplyChainScore:   float("supplyChainScore").default(0),
  impactScore:        float("impactScore").default(0),
  investmentAttractiveness: float("investmentAttractiveness").default(0),
  compositeScore:     float("compositeScore").default(0),
  h4Stage:            varchar("h4Stage", { length: 32 }),
  vrlScore:           float("vrlScore"),
  trlScore:           float("trlScore"),
  brlScore:           float("brlScore"),
  crlScore:           float("crlScore"),
  riskIndex:          float("riskIndex"),
  scoreSummary:       text("scoreSummary"),
  strengthsJson:      text("strengthsJson"),
  weaknessesJson:     text("weaknessesJson"),
  gapsJson:           text("gapsJson"),
  calculatedBy:       varchar("calculatedBy", { length: 64 }),
  createdAt:          timestamp("createdAt").defaultNow().notNull(),
  updatedAt:          timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InvReadinessScore = typeof invReadinessScores.$inferSelect;
export type InsertInvReadinessScore = typeof invReadinessScores.$inferInsert;

// ── Investment Outputs (Pitch Deck, Business Plan, Execution Plan) ─────────────
export const invOutputs = mysqlTable("invOutputs", {
  id:             int("id").autoincrement().primaryKey(),
  offeringId:     int("offeringId"),
  ventureId:      varchar("ventureId", { length: 64 }),
  scoreId:        int("scoreId"),
  outputType:     mysqlEnum("invOutputType", ["pitch_deck", "business_plan", "execution_plan", "investor_summary"]).notNull(),
  title:          varchar("title", { length: 256 }).notNull(),
  status:         mysqlEnum("invOutputStatus", ["draft", "in_review", "approved", "sent", "archived"]).default("draft"),
  contentJson:    text("contentJson"),
  aiNarrative:    text("aiNarrative"),
  problemSection:     text("problemSection"),
  opportunitySection: text("opportunitySection"),
  solutionSection:    text("solutionSection"),
  marketSection:      text("marketSection"),
  tractionSection:    text("tractionSection"),
  businessModelSection: text("businessModelSection"),
  supplyChainSection: text("supplyChainSection"),
  teamSection:        text("teamSection"),
  financialsSection:  text("financialsSection"),
  askSection:         text("askSection"),
  executiveSummarySection: text("executiveSummarySection"),
  marketAnalysisSection:   text("marketAnalysisSection"),
  productServiceSection:   text("productServiceSection"),
  commercialStrategySection: text("commercialStrategySection"),
  financialProjectionsSection: text("financialProjectionsSection"),
  riskAnalysisSection:     text("riskAnalysisSection"),
  roadmap90DaySection:     text("roadmap90DaySection"),
  productDevSection:       text("productDevSection"),
  supplyChainPlanSection:  text("supplyChainPlanSection"),
  teamPlanSection:         text("teamPlanSection"),
  budgetSection:           text("budgetSection"),
  milestonesSection:       text("milestonesSection"),
  generatedAt:    timestamp("generatedAt"),
  version:        int("version").default(1),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InvOutput = typeof invOutputs.$inferSelect;
export type InsertInvOutput = typeof invOutputs.$inferInsert;

// ── Investor Targets (Matching & Outreach) ─────────────────────────────────────
export const invTargets = mysqlTable("invTargets", {
  id:                 int("id").autoincrement().primaryKey(),
  offeringId:         int("offeringId"),
  ventureId:          varchar("ventureId", { length: 64 }),
  investorName:       varchar("investorName", { length: 256 }).notNull(),
  fund:               varchar("fund", { length: 256 }),
  investorType:       mysqlEnum("invTargetType", ["angel", "vc", "family_office", "corporate_vc", "impact_fund", "grant", "crowdfunding", "debt"]).default("vc"),
  geographicFocus:    varchar("geographicFocus", { length: 128 }),
  stageFocus:         varchar("stageFocus", { length: 128 }),
  sectorFocus:        varchar("sectorFocus", { length: 256 }),
  minCheque:          int("minCheque"),
  maxCheque:          int("maxCheque"),
  impactFocused:      boolean("impactFocused").default(false),
  matchScore:         float("matchScore").default(0),
  matchRationale:     text("matchRationale"),
  outreachStatus:     mysqlEnum("invTargetStatus", ["identified", "researching", "warm_intro", "contacted", "meeting_booked", "dd_requested", "term_sheet", "closed", "passed"]).default("identified"),
  contactEmail:       varchar("contactEmail", { length: 256 }),
  linkedinUrl:        varchar("linkedinUrl", { length: 512 }),
  warmIntroSource:    varchar("warmIntroSource", { length: 256 }),
  lastContactedAt:    timestamp("lastContactedAt"),
  nextFollowUpAt:     timestamp("nextFollowUpAt"),
  notes:              text("notes"),
  outputSentId:       int("outputSentId"),
  createdAt:          timestamp("createdAt").defaultNow().notNull(),
  updatedAt:          timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InvTarget = typeof invTargets.$inferSelect;
export type InsertInvTarget = typeof invTargets.$inferInsert;

// ── Investment KPIs ────────────────────────────────────────────────────────────
export const invKpis = mysqlTable("invKpis", {
  id:             int("id").autoincrement().primaryKey(),
  offeringId:     int("offeringId"),
  ventureId:      varchar("ventureId", { length: 64 }),
  askAmount:      int("askAmount"),
  preMoneyVal:    int("preMoneyVal"),
  useOfFunds:     text("useOfFunds"),
  revenueYear1:   int("revenueYear1"),
  revenueYear3:   int("revenueYear3"),
  revenueYear5:   int("revenueYear5"),
  ebitdaYear3:    int("ebitdaYear3"),
  ebitdaYear5:    int("ebitdaYear5"),
  burnRate:       int("burnRate"),
  runway:         int("runway"),
  customersCount: int("customersCount"),
  revenueActual:  int("revenueActual"),
  growthRate:     float("growthRate"),
  nps:            float("nps"),
  cac:            int("cac"),
  ltv:            int("ltv"),
  socialImpactMetric: varchar("socialImpactMetric", { length: 256 }),
  impactValue:    varchar("impactValue", { length: 128 }),
  sdgAlignment:   varchar("sdgAlignment", { length: 256 }),
  periodLabel:    varchar("periodLabel", { length: 64 }),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InvKpi = typeof invKpis.$inferSelect;
export type InsertInvKpi = typeof invKpis.$inferInsert;

// ── Fundraising Rounds ─────────────────────────────────────────────────────────
export const invFundraisingRounds = mysqlTable("invFundraisingRounds", {
  id:                 int("id").autoincrement().primaryKey(),
  offeringId:         int("offeringId"),
  ventureId:          varchar("ventureId", { length: 64 }),
  roundName:          varchar("roundName", { length: 128 }).notNull(),
  roundType:          mysqlEnum("invRoundType", ["pre_seed", "seed", "series_a", "series_b", "bridge", "grant", "convertible_note"]).default("seed"),
  targetAmount:       int("targetAmount"),
  raisedAmount:       int("raisedAmount").default(0),
  status:             mysqlEnum("invRoundStatus", ["planning", "open", "closing", "closed", "cancelled"]).default("planning"),
  openDate:           timestamp("openDate"),
  closeDate:          timestamp("closeDate"),
  leadInvestor:       varchar("leadInvestor", { length: 256 }),
  pitchDeckId:        int("pitchDeckId"),
  businessPlanId:     int("businessPlanId"),
  executionPlanId:    int("executionPlanId"),
  notes:              text("notes"),
  createdAt:          timestamp("createdAt").defaultNow().notNull(),
  updatedAt:          timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InvFundraisingRound = typeof invFundraisingRounds.$inferSelect;
export type InsertInvFundraisingRound = typeof invFundraisingRounds.$inferInsert;


// ─────────────────────────────────────────────────────────────────────────────
// ECORACE LAB — 8-Stage Engineering Workflow (Sprint 67)
// Tables: erl_projects, erl_stages, erl_materials, erl_simulations,
//         erl_ip_assets, erl_agent_runs, erl_validation_logs
// ─────────────────────────────────────────────────────────────────────────────

export const erlProjects = mysqlTable("erl_projects", {
  id:               int("id").autoincrement().primaryKey(),
  ventureId:        varchar("ventureId", { length: 64 }),
  offeringId:       int("offeringId"),
  title:            varchar("title", { length: 256 }).notNull(),
  description:      text("description"),
  problemStatement: text("problemStatement"),
  marketReqs:       text("marketReqs"),
  technicalReqs:    text("technicalReqs"),
  status:           mysqlEnum("erlProjectStatus", ["draft","active","on_hold","completed","archived"]).default("draft"),
  currentStage:     mysqlEnum("erlCurrentStage", ["opportunity","concept","materials","simulation","prototype","manufacturing","validation","ip"]).default("opportunity"),
  priority:         mysqlEnum("erlPriority", ["low","medium","high","critical"]).default("medium"),
  targetCompletionDate: timestamp("targetCompletionDate"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ErlProject = typeof erlProjects.$inferSelect;
export type InsertErlProject = typeof erlProjects.$inferInsert;

export const erlStages = mysqlTable("erl_stages", {
  id:               int("id").autoincrement().primaryKey(),
  projectId:        int("projectId").notNull(),
  stage:            mysqlEnum("erlStageType", ["opportunity","concept","materials","simulation","prototype","manufacturing","validation","ip"]).notNull(),
  status:           mysqlEnum("erlStageStatus", ["pending","in_progress","human_review","completed","blocked"]).default("pending"),
  agentId:          varchar("agentId", { length: 64 }),
  inputData:        text("inputData"),
  outputData:       text("outputData"),
  aiNarrative:      text("aiNarrative"),
  performanceTargets: text("performanceTargets"),
  validationCriteria: text("validationCriteria"),
  humanApproved:    boolean("humanApproved").default(false),
  humanNotes:       text("humanNotes"),
  iterationCount:   int("iterationCount").default(0),
  completedAt:      timestamp("completedAt"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ErlStage = typeof erlStages.$inferSelect;
export type InsertErlStage = typeof erlStages.$inferInsert;

export const erlMaterials = mysqlTable("erl_materials", {
  id:               int("id").autoincrement().primaryKey(),
  projectId:        int("projectId"),
  name:             varchar("name", { length: 256 }).notNull(),
  category:         mysqlEnum("erlMaterialCategory", ["polymer","composite","metal","ceramic","bio_based","recycled","nano","hybrid"]).default("composite"),
  formulation:      text("formulation"),
  sustainabilityScore: int("sustainabilityScore").default(0),
  recycledContent:  int("recycledContent").default(0),
  carbonFootprint:  varchar("carbonFootprint", { length: 64 }),
  tensileStrength:  varchar("tensileStrength", { length: 64 }),
  density:          varchar("density", { length: 64 }),
  thermalRating:    varchar("thermalRating", { length: 64 }),
  costPerKg:        int("costPerKg"),
  supplier:         varchar("supplier", { length: 256 }),
  certifications:   text("certifications"),
  aiGenerated:      boolean("aiGenerated").default(false),
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ErlMaterial = typeof erlMaterials.$inferSelect;
export type InsertErlMaterial = typeof erlMaterials.$inferInsert;

export const erlSimulations = mysqlTable("erl_simulations", {
  id:               int("id").autoincrement().primaryKey(),
  projectId:        int("projectId").notNull(),
  stageId:          int("stageId"),
  simType:          mysqlEnum("erlSimType", ["fea","thermal","fatigue","cfd","impact","vibration","lifecycle"]).notNull(),
  title:            varchar("title", { length: 256 }).notNull(),
  softwareTool:     varchar("softwareTool", { length: 128 }),
  inputParams:      text("inputParams"),
  results:          text("results"),
  aiAnalysis:       text("aiAnalysis"),
  passedValidation: boolean("passedValidation").default(false),
  safetyFactor:     varchar("safetyFactor", { length: 32 }),
  iterationNumber:  int("iterationNumber").default(1),
  status:           mysqlEnum("erlSimStatus", ["queued","running","completed","failed","needs_iteration"]).default("queued"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ErlSimulation = typeof erlSimulations.$inferSelect;
export type InsertErlSimulation = typeof erlSimulations.$inferInsert;

export const erlIpAssets = mysqlTable("erl_ip_assets", {
  id:               int("id").autoincrement().primaryKey(),
  projectId:        int("projectId").notNull(),
  title:            varchar("title", { length: 256 }).notNull(),
  ipType:           mysqlEnum("erlIpType", ["patent","trade_secret","design_right","copyright","trademark","know_how"]).default("patent"),
  claimsJson:       text("claimsJson"),
  technicalSummary: text("technicalSummary"),
  noveltyStatement: text("noveltyStatement"),
  priorArtSearch:   text("priorArtSearch"),
  draftClaims:      text("draftClaims"),
  filingStatus:     mysqlEnum("erlFilingStatus", ["draft","review","filed","granted","rejected","abandoned"]).default("draft"),
  filingDate:       timestamp("filingDate"),
  grantDate:        timestamp("grantDate"),
  jurisdiction:     varchar("jurisdiction", { length: 128 }),
  aiGenerated:      boolean("aiGenerated").default(false),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ErlIpAsset = typeof erlIpAssets.$inferSelect;
export type InsertErlIpAsset = typeof erlIpAssets.$inferInsert;

export const erlAgentRuns = mysqlTable("erl_agent_runs", {
  id:               int("id").autoincrement().primaryKey(),
  projectId:        int("projectId").notNull(),
  stageId:          int("stageId"),
  agentId:          varchar("agentId", { length: 64 }).notNull(),
  agentName:        varchar("agentName", { length: 128 }).notNull(),
  promptUsed:       text("promptUsed"),
  inputContext:     text("inputContext"),
  outputJson:       text("outputJson"),
  tokensUsed:       int("tokensUsed"),
  durationMs:       int("durationMs"),
  status:           mysqlEnum("erlAgentStatus", ["queued","running","completed","failed","retrying"]).default("queued"),
  errorMessage:     text("errorMessage"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type ErlAgentRun = typeof erlAgentRuns.$inferSelect;
export type InsertErlAgentRun = typeof erlAgentRuns.$inferInsert;

export const erlValidationLogs = mysqlTable("erl_validation_logs", {
  id:               int("id").autoincrement().primaryKey(),
  projectId:        int("projectId").notNull(),
  stageId:          int("stageId"),
  validationType:   mysqlEnum("erlValidationType", ["performance","compliance","lifecycle","safety","market","technical"]).notNull(),
  title:            varchar("title", { length: 256 }).notNull(),
  standard:         varchar("standard", { length: 256 }),
  testMethod:       text("testMethod"),
  results:          text("results"),
  passed:           boolean("passed").default(false),
  score:            int("score"),
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ErlValidationLog = typeof erlValidationLogs.$inferSelect;
export type InsertErlValidationLog = typeof erlValidationLogs.$inferInsert;

// ─────────────────────────────────────────────────────────────
// INVESTOR DATA ROOM MODULE — 10 tables (migration 0044)
// ─────────────────────────────────────────────────────────────

// 1. Data Room Rooms
export const drRooms = mysqlTable("dr_rooms", {
  id:               int("id").autoincrement().primaryKey(),
  ventureId:        int("ventureId").notNull(),
  name:             varchar("name", { length: 256 }).notNull(),
  description:      text("description"),
  roomType:         mysqlEnum("drRoomType", ["teaser","full","due_diligence","custom"]).notNull().default("teaser"),
  status:           mysqlEnum("drRoomStatus", ["draft","internal_review","approved","published","expired","archived"]).notNull().default("draft"),
  visibilityTier:   mysqlEnum("drVisibilityTier", ["teaser","full","due_diligence"]).notNull().default("teaser"),
  fundingRound:     varchar("fundingRound", { length: 128 }),
  fundingTarget:    varchar("fundingTarget", { length: 128 }),
  expiresAt:        timestamp("expiresAt"),
  publishedAt:      timestamp("publishedAt"),
  ownerId:          int("ownerId"),
  watermarkEnabled: boolean("watermarkEnabled").default(true),
  downloadEnabled:  boolean("downloadEnabled").default(false),
  ndaRequired:      boolean("ndaRequired").default(false),
  accessCode:       varchar("accessCode", { length: 64 }),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DrRoom = typeof drRooms.$inferSelect;
export type InsertDrRoom = typeof drRooms.$inferInsert;

// 2. Data Room Assets
export const drAssets = mysqlTable("dr_assets", {
  id:              int("id").autoincrement().primaryKey(),
  roomId:          int("roomId").notNull(),
  ventureId:       int("ventureId").notNull(),
  folder:          mysqlEnum("drFolder", [
    "01_Overview","02_Problem_Market","03_Product_Technology",
    "04_Business_Model_Financials","05_Execution_Operations",
    "06_Impact_Compliance","07_Legal_Corporate",
    "08_Due_Diligence_QA","09_Access_Logs_Archive"
  ]).notNull().default("01_Overview"),
  name:            varchar("name", { length: 256 }).notNull(),
  description:     text("description"),
  fileUrl:         text("fileUrl"),
  fileKey:         varchar("fileKey", { length: 512 }),
  mimeType:        varchar("mimeType", { length: 128 }),
  fileSizeBytes:   int("fileSizeBytes"),
  assetType:       mysqlEnum("drAssetType", [
    "pitch_deck","one_pager","financial_summary","technical_dossier",
    "impact_summary","seis_eis_pack","business_plan","exec_plan",
    "legal_doc","cap_table","market_research","product_demo",
    "dd_index","qa_log","other"
  ]).notNull().default("other"),
  status:          mysqlEnum("drAssetStatus", ["draft","internal_review","approved","superseded","archived"]).notNull().default("draft"),
  version:         int("version").default(1),
  isAiGenerated:   boolean("isAiGenerated").default(false),
  sourceDataRef:   text("sourceDataRef"),
  approvedById:    int("approvedById"),
  approvedAt:      timestamp("approvedAt"),
  visibilityTier:  mysqlEnum("drAssetTier", ["teaser","full","due_diligence"]).notNull().default("teaser"),
  downloadAllowed: boolean("downloadAllowed").default(false),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DrAsset = typeof drAssets.$inferSelect;
export type InsertDrAsset = typeof drAssets.$inferInsert;

// 3. Readiness Checks
export const drReadinessChecks = mysqlTable("dr_readiness_checks", {
  id:            int("id").autoincrement().primaryKey(),
  roomId:        int("roomId").notNull(),
  ventureId:     int("ventureId").notNull(),
  category:      mysqlEnum("drCheckCategory", [
    "overview","market","product","financials","legal","compliance","team","ip","governance"
  ]).notNull(),
  title:         varchar("title", { length: 256 }).notNull(),
  description:   text("description"),
  severity:      mysqlEnum("drSeverity", ["critical","high","medium","low"]).notNull().default("medium"),
  status:        mysqlEnum("drCheckStatus", ["pending","in_progress","resolved","waived"]).notNull().default("pending"),
  blocksPublish: boolean("blocksPublish").default(false),
  ownerId:       int("ownerId"),
  dueDate:       timestamp("dueDate"),
  resolvedAt:    timestamp("resolvedAt"),
  notes:         text("notes"),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DrReadinessCheck = typeof drReadinessChecks.$inferSelect;
export type InsertDrReadinessCheck = typeof drReadinessChecks.$inferInsert;

// 4. Investors
export const drInvestors = mysqlTable("dr_investors", {
  id:           int("id").autoincrement().primaryKey(),
  ventureId:    int("ventureId").notNull(),
  name:         varchar("name", { length: 256 }).notNull(),
  organisation: varchar("organisation", { length: 256 }),
  email:        varchar("email", { length: 256 }),
  phone:        varchar("phone", { length: 64 }),
  investorType: mysqlEnum("drInvestorType", ["angel","vc","family_office","corporate","accelerator","grant","other"]).notNull().default("vc"),
  thesisFit:    mysqlEnum("drThesisFit", ["strong","moderate","weak","unknown"]).notNull().default("unknown"),
  stage:        mysqlEnum("drInvestorStage", ["identified","contacted","nda_signed","room_invited","active_review","meeting_booked","term_sheet","closed","passed"]).notNull().default("identified"),
  ndaSigned:    boolean("ndaSigned").default(false),
  ndaSignedAt:  timestamp("ndaSignedAt"),
  notes:        text("notes"),
  linkedinUrl:  varchar("linkedinUrl", { length: 512 }),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DrInvestor = typeof drInvestors.$inferSelect;
export type InsertDrInvestor = typeof drInvestors.$inferInsert;

// 5. Room Permissions
export const drPermissions = mysqlTable("dr_permissions", {
  id:          int("id").autoincrement().primaryKey(),
  roomId:      int("roomId").notNull(),
  investorId:  int("investorId").notNull(),
  accessLevel: mysqlEnum("drAccessLevel", ["teaser","full","due_diligence"]).notNull().default("teaser"),
  invitedAt:   timestamp("invitedAt").defaultNow().notNull(),
  acceptedAt:  timestamp("acceptedAt"),
  expiresAt:   timestamp("expiresAt"),
  revokedAt:   timestamp("revokedAt"),
  inviteToken: varchar("inviteToken", { length: 128 }),
  isActive:    boolean("isActive").default(true),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type DrPermission = typeof drPermissions.$inferSelect;
export type InsertDrPermission = typeof drPermissions.$inferInsert;

// 6. Engagement Events
export const drEngagementEvents = mysqlTable("dr_engagement_events", {
  id:              int("id").autoincrement().primaryKey(),
  roomId:          int("roomId").notNull(),
  assetId:         int("assetId"),
  investorId:      int("investorId"),
  eventType:       mysqlEnum("drEventType", [
    "room_opened","room_viewed","asset_opened","asset_viewed",
    "asset_downloaded","question_submitted","nda_signed",
    "meeting_requested","room_shared","access_revoked"
  ]).notNull(),
  durationSeconds: int("durationSeconds"),
  ipAddress:       varchar("ipAddress", { length: 64 }),
  userAgent:       text("userAgent"),
  metadata:        text("metadata"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type DrEngagementEvent = typeof drEngagementEvents.$inferSelect;
export type InsertDrEngagementEvent = typeof drEngagementEvents.$inferInsert;

// 7. Q&A Requests
export const drQaRequests = mysqlTable("dr_qa_requests", {
  id:              int("id").autoincrement().primaryKey(),
  roomId:          int("roomId").notNull(),
  investorId:      int("investorId").notNull(),
  assetId:         int("assetId"),
  question:        text("question").notNull(),
  category:        mysqlEnum("drQaCategory", ["financial","legal","technical","market","team","product","compliance","other"]).notNull().default("other"),
  priority:        mysqlEnum("drQaPriority", ["urgent","high","normal","low"]).notNull().default("normal"),
  status:          mysqlEnum("drQaStatus", ["open","in_progress","answered","closed"]).notNull().default("open"),
  responseOwnerId: int("responseOwnerId"),
  response:        text("response"),
  respondedAt:     timestamp("respondedAt"),
  dueDate:         timestamp("dueDate"),
  isPublic:        boolean("isPublic").default(false),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DrQaRequest = typeof drQaRequests.$inferSelect;
export type InsertDrQaRequest = typeof drQaRequests.$inferInsert;

// 8. Asset Generation Templates
export const drTemplates = mysqlTable("dr_templates", {
  id:              int("id").autoincrement().primaryKey(),
  name:            varchar("name", { length: 256 }).notNull(),
  outputType:      mysqlEnum("drTemplateOutput", [
    "one_pager","pitch_deck","financial_summary","technical_dossier",
    "impact_summary","seis_eis_pack","dd_index","business_plan"
  ]).notNull(),
  promptTemplate:  text("promptTemplate").notNull(),
  mandatoryInputs: text("mandatoryInputs"),
  optionalInputs:  text("optionalInputs"),
  visibilityTier:  mysqlEnum("drTemplateTier", ["teaser","full","due_diligence"]).notNull().default("full"),
  isActive:        boolean("isActive").default(true),
  version:         int("version").default(1),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DrTemplate = typeof drTemplates.$inferSelect;
export type InsertDrTemplate = typeof drTemplates.$inferInsert;

// 9. Asset Approvals
export const drApprovals = mysqlTable("dr_approvals", {
  id:           int("id").autoincrement().primaryKey(),
  assetId:      int("assetId").notNull(),
  roomId:       int("roomId").notNull(),
  reviewerRole: mysqlEnum("drReviewerRole", ["venture_lead","finance_reviewer","legal_reviewer","technical_reviewer","impact_reviewer","platform_admin"]).notNull(),
  status:       mysqlEnum("drApprovalStatus", ["pending","approved","rejected","changes_requested"]).notNull().default("pending"),
  reviewerId:   int("reviewerId"),
  comments:     text("comments"),
  reviewedAt:   timestamp("reviewedAt"),
  dueDate:      timestamp("dueDate"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DrApproval = typeof drApprovals.$inferSelect;
export type InsertDrApproval = typeof drApprovals.$inferInsert;

// 10. AI Generation Log
export const drAiGenerations = mysqlTable("dr_ai_generations", {
  id:               int("id").autoincrement().primaryKey(),
  roomId:           int("roomId").notNull(),
  ventureId:        int("ventureId").notNull(),
  templateId:       int("templateId"),
  outputType:       varchar("outputType", { length: 128 }).notNull(),
  inputSummary:     text("inputSummary"),
  generatedContent: text("generatedContent"),
  status:           mysqlEnum("drGenStatus", ["generating","completed","failed","approved","archived"]).notNull().default("generating"),
  approvedById:     int("approvedById"),
  approvedAt:       timestamp("approvedAt"),
  tokensUsed:       int("tokensUsed"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DrAiGeneration = typeof drAiGenerations.$inferSelect;
export type InsertDrAiGeneration = typeof drAiGenerations.$inferInsert;


// ─────────────────────────────────────────────────────────────────────────────
// LEARNING ENGINE MODULE (Sprint 69)
// Tables: le_problems, le_insights, le_input_weights, le_vrl_metrics,
//         le_learning_patterns, le_recommendations, le_knowledge_graph_nodes,
//         le_knowledge_graph_edges
// ─────────────────────────────────────────────────────────────────────────────

export const leProblems = mysqlTable("le_problems", {
  id:              int("id").primaryKey().autoincrement(),
  description:     text("description").notNull(),
  sector:          varchar("sector", { length: 100 }).notNull(),
  frequencyScore:  int("frequencyScore"),
  severityScore:   int("severityScore"),
  customerSegment: varchar("customerSegment", { length: 200 }),
  context:         text("context"),
  status:          mysqlEnum("leProblemStatus", ["active","validated","invalidated","archived"]).notNull().default("active"),
  ventureId:       int("ventureId"),
  tags:            text("tags"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LeProblem = typeof leProblems.$inferSelect;
export type InsertLeProblem = typeof leProblems.$inferInsert;

export const leInsights = mysqlTable("le_insights", {
  id:              int("id").primaryKey().autoincrement(),
  problemId:       int("problemId"),
  ventureId:       int("ventureId"),
  sourceType:      mysqlEnum("leInsightSource", ["interview","research","experiment","market_data","book","expert_input"]).notNull(),
  sourceId:        int("sourceId"),
  content:         text("content").notNull(),
  evidenceStrength: int("evidenceStrength"),
  confidenceScore: decimal("confidenceScore", { precision: 3, scale: 2 }),
  tags:            text("tags"),
  ipSensitive:     boolean("ipSensitive").default(false),
  extractedAt:     timestamp("extractedAt").defaultNow().notNull(),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type LeInsight = typeof leInsights.$inferSelect;
export type InsertLeInsight = typeof leInsights.$inferInsert;

export const leInputWeights = mysqlTable("le_input_weights", {
  id:         int("id").primaryKey().autoincrement(),
  sourceType: varchar("sourceType", { length: 64 }).notNull().unique(),
  weight:     decimal("weight", { precision: 3, scale: 2 }).notNull(),
  updatedAt:  timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LeInputWeight = typeof leInputWeights.$inferSelect;

export const leVrlMetrics = mysqlTable("le_vrl_metrics", {
  id:                int("id").primaryKey().autoincrement(),
  ventureId:         int("ventureId").notNull(),
  trlScore:          decimal("trlScore", { precision: 4, scale: 2 }),
  brlScore:          decimal("brlScore", { precision: 4, scale: 2 }),
  alpha:             decimal("alpha", { precision: 3, scale: 2 }).default("0.50"),
  beta:              decimal("beta", { precision: 3, scale: 2 }).default("0.50"),
  riskIndex:         decimal("riskIndex", { precision: 3, scale: 2 }),
  confidenceScore:   decimal("confidenceScore", { precision: 3, scale: 2 }),
  vrlScore:          decimal("vrlScore", { precision: 5, scale: 2 }),
  stage:             mysqlEnum("leVrlStage", ["idea","validation","mvp","scale_ready","investment_ready"]).default("idea"),
  riskBreakdown:     text("riskBreakdown"),
  calculationMethod: varchar("calculationMethod", { length: 100 }).default("multiplicative_dual_risk"),
  notes:             text("notes"),
  calculatedAt:      timestamp("calculatedAt").defaultNow().notNull(),
});
export type LeVrlMetric = typeof leVrlMetrics.$inferSelect;
export type InsertLeVrlMetric = typeof leVrlMetrics.$inferInsert;

export const leLearningPatterns = mysqlTable("le_learning_patterns", {
  id:              int("id").primaryKey().autoincrement(),
  patternType:     mysqlEnum("lePatternType", ["problem_cluster","success_indicator","failure_signal","pivot_trigger","sector_trend"]).notNull(),
  sector:          varchar("sector", { length: 100 }),
  title:           varchar("title", { length: 256 }).notNull(),
  description:     text("description"),
  frequency:       int("frequency").default(1),
  confidenceScore: decimal("confidenceScore", { precision: 3, scale: 2 }),
  supportingData:  text("supportingData"),
  isActive:        boolean("isActive").default(true),
  detectedAt:      timestamp("detectedAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LeLearningPattern = typeof leLearningPatterns.$inferSelect;
export type InsertLeLearningPattern = typeof leLearningPatterns.$inferInsert;

export const leRecommendations = mysqlTable("le_recommendations", {
  id:          int("id").primaryKey().autoincrement(),
  ventureId:   int("ventureId").notNull(),
  type:        mysqlEnum("leRecType", ["next_interview","missing_validation","technical_risk","pivot_signal","go_no_go"]).notNull(),
  priority:    mysqlEnum("leRecPriority", ["low","medium","high","critical"]).notNull().default("medium"),
  title:       varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  actionItems: text("actionItems"),
  confidence:  decimal("confidence", { precision: 3, scale: 2 }),
  status:      mysqlEnum("leRecStatus", ["active","dismissed","completed"]).notNull().default("active"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LeRecommendation = typeof leRecommendations.$inferSelect;
export type InsertLeRecommendation = typeof leRecommendations.$inferInsert;

export const leKnowledgeGraphNodes = mysqlTable("le_kg_nodes", {
  id:         int("id").primaryKey().autoincrement(),
  nodeType:   mysqlEnum("leNodeType", ["problem","solution","technology","market","person","organization"]).notNull(),
  label:      varchar("label", { length: 256 }).notNull(),
  ventureId:  int("ventureId"),
  properties: text("properties"),
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
});
export type LeKgNode = typeof leKnowledgeGraphNodes.$inferSelect;
export type InsertLeKgNode = typeof leKnowledgeGraphNodes.$inferInsert;

export const leKnowledgeGraphEdges = mysqlTable("le_kg_edges", {
  id:           int("id").primaryKey().autoincrement(),
  fromNodeId:   int("fromNodeId").notNull(),
  toNodeId:     int("toNodeId").notNull(),
  relationship: mysqlEnum("leEdgeRel", ["solves","requires","competes_with","serves","collaborates","invented_by"]).notNull(),
  weight:       decimal("weight", { precision: 3, scale: 2 }).default("0.50"),
  metadata:     text("metadata"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type LeKgEdge = typeof leKnowledgeGraphEdges.$inferSelect;
export type InsertLeKgEdge = typeof leKnowledgeGraphEdges.$inferInsert;


// ─────────────────────────────────────────────────────────────────────────────
// PLAYBOOK MODULE — Sprint 70
// Tables: pb_playbooks, pb_steps, pb_runs, pb_run_steps, pb_kpi_entries, pb_linked_assets
// ─────────────────────────────────────────────────────────────────────────────

export const pbPlaybooks = mysqlTable("pb_playbooks", {
  id:                int("id").autoincrement().primaryKey(),
  playbookId:        varchar("playbookId", { length: 20 }).notNull().unique(),
  title:             varchar("title", { length: 200 }).notNull(),
  subFolder:         mysqlEnum("subFolder", [
    "avoid_catch22",
    "democratize_quality",
    "embed_operations",
    "adapt_ai_genai",
    "scale_governance"
  ]).notNull(),
  version:           varchar("version", { length: 20 }).notNull().default("1.0.0"),
  ownerRole:         varchar("ownerRole", { length: 100 }),
  strategicPrinciple: text("strategicPrinciple"),
  triggerConditions: text("triggerConditions"),
  kpis:              text("kpis"),
  status:            mysqlEnum("pbStatus", ["draft", "active", "deprecated"]).notNull().default("draft"),
  lastRun:           timestamp("lastRun"),
  runCount:          int("runCount").notNull().default(0),
  linkedAssetIds:    text("linkedAssetIds"),
  ventureId:         varchar("ventureId", { length: 100 }),
  createdBy:         varchar("createdBy", { length: 255 }),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
  updatedAt:         timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PbPlaybook = typeof pbPlaybooks.$inferSelect;
export type InsertPbPlaybook = typeof pbPlaybooks.$inferInsert;

export const pbSteps = mysqlTable("pb_steps", {
  id:          int("id").autoincrement().primaryKey(),
  playbookId:  int("playbookId").notNull(),
  stepNumber:  int("stepNumber").notNull(),
  title:       varchar("title", { length: 200 }).notNull(),
  action:      text("action").notNull(),
  assigneeRole: varchar("assigneeRole", { length: 100 }),
  slaDays:     int("slaDays"),
  toolsRequired: text("toolsRequired"),
  outputArtifact: varchar("outputArtifact", { length: 200 }),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type PbStep = typeof pbSteps.$inferSelect;
export type InsertPbStep = typeof pbSteps.$inferInsert;

export const pbRuns = mysqlTable("pb_runs", {
  id:           int("id").autoincrement().primaryKey(),
  playbookId:   int("playbookId").notNull(),
  ventureId:    varchar("ventureId", { length: 100 }),
  triggeredBy:  varchar("triggeredBy", { length: 255 }),
  triggerReason: varchar("triggerReason", { length: 500 }),
  status:       mysqlEnum("pbRunStatus", ["pending", "in_progress", "completed", "failed", "cancelled"]).notNull().default("pending"),
  currentStep:  int("currentStep").notNull().default(1),
  totalSteps:   int("totalSteps").notNull().default(0),
  startedAt:    timestamp("startedAt").defaultNow().notNull(),
  completedAt:  timestamp("completedAt"),
  notes:        text("notes"),
  aiSummary:    text("aiSummary"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PbRun = typeof pbRuns.$inferSelect;
export type InsertPbRun = typeof pbRuns.$inferInsert;

export const pbRunSteps = mysqlTable("pb_run_steps", {
  id:           int("id").autoincrement().primaryKey(),
  runId:        int("runId").notNull(),
  stepId:       int("stepId").notNull(),
  stepNumber:   int("stepNumber").notNull(),
  status:       mysqlEnum("pbRunStepStatus", ["pending", "in_progress", "completed", "skipped", "blocked"]).notNull().default("pending"),
  assignedTo:   varchar("assignedTo", { length: 255 }),
  startedAt:    timestamp("startedAt"),
  completedAt:  timestamp("completedAt"),
  notes:        text("notes"),
  evidence:     text("evidence"),
  blockerReason: text("blockerReason"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PbRunStep = typeof pbRunSteps.$inferSelect;
export type InsertPbRunStep = typeof pbRunSteps.$inferInsert;

export const pbKpiEntries = mysqlTable("pb_kpi_entries", {
  id:           int("id").autoincrement().primaryKey(),
  playbookId:   int("playbookId").notNull(),
  runId:        int("runId"),
  kpiLabel:     varchar("kpiLabel", { length: 300 }).notNull(),
  targetValue:  varchar("targetValue", { length: 100 }),
  actualValue:  varchar("actualValue", { length: 100 }),
  unit:         varchar("unit", { length: 50 }),
  achieved:     boolean("achieved"),
  measuredAt:   timestamp("measuredAt").defaultNow().notNull(),
  notes:        text("notes"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type PbKpiEntry = typeof pbKpiEntries.$inferSelect;
export type InsertPbKpiEntry = typeof pbKpiEntries.$inferInsert;

export const pbLinkedAssets = mysqlTable("pb_linked_assets", {
  id:           int("id").autoincrement().primaryKey(),
  playbookId:   int("playbookId").notNull(),
  assetName:    varchar("assetName", { length: 200 }).notNull(),
  assetType:    mysqlEnum("pbAssetType", ["data_asset", "venture", "document", "system", "api"]).notNull(),
  assetRef:     varchar("assetRef", { length: 500 }),
  domain:       varchar("domain", { length: 100 }),
  classification: mysqlEnum("pbClassification", ["PII", "Confidential", "Internal", "Public"]),
  zone:         mysqlEnum("pbZone", ["Bronze", "Silver", "Gold", "Platinum"]),
  dqsCurrent:   decimal("dqsCurrent", { precision: 5, scale: 2 }),
  notes:        text("notes"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type PbLinkedAsset = typeof pbLinkedAssets.$inferSelect;
export type InsertPbLinkedAsset = typeof pbLinkedAssets.$inferInsert;


// ─────────────────────────────────────────────────────────────────────────────
// IP INTELLIGENCE MODULE — IP_OBJECT Schema (Sprint 71)
// Tables: ip_analyses, ip_entities, ip_whitespace, ip_vrl_feed
// Lightbringer-style mock analysis engine with VRL integration
// ─────────────────────────────────────────────────────────────────────────────

export const ipAnalyses = mysqlTable("ip_analyses", {
  id:              int("id").autoincrement().primaryKey(),
  ventureId:       varchar("ventureId", { length: 50 }),
  ideaName:        varchar("ideaName", { length: 200 }).notNull(),
  description:     text("description").notNull(),
  keywords:        text("keywords").notNull(),            // comma-separated
  industry:        varchar("industry", { length: 100 }).notNull(),
  geography:       varchar("geography", { length: 100 }).notNull(),
  // Lightbringer API response fields
  noveltyScore:    decimal("noveltyScore", { precision: 5, scale: 2 }).notNull().default("0"),
  patentDensity:   mysqlEnum("patentDensity", ["LOW", "MED", "HIGH"]).notNull().default("LOW"),
  ftoRisk:         mysqlEnum("ftoRisk", ["LOW", "MED", "HIGH"]).notNull().default("LOW"),
  recommendation:  mysqlEnum("recommendation", ["PROCEED", "MODIFY", "KILL"]).notNull().default("PROCEED"),
  ipScore:         decimal("ipScore", { precision: 5, scale: 2 }).notNull().default("0"),  // 0-100, fed to VRL
  rawResponse:     json("rawResponse"),                  // full mock Lightbringer JSON
  apiProvider:     varchar("apiProvider", { length: 50 }).notNull().default("lightbringer_mock"),
  apiVersion:      varchar("apiVersion", { length: 20 }).notNull().default("v1.0"),
  status:          mysqlEnum("ipAnalysisStatus", ["pending", "complete", "error"]).notNull().default("pending"),
  analysedBy:      varchar("analysedBy", { length: 100 }),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type IpAnalysis = typeof ipAnalyses.$inferSelect;
export type InsertIpAnalysis = typeof ipAnalyses.$inferInsert;

export const ipEntities = mysqlTable("ip_entities", {
  id:              int("id").autoincrement().primaryKey(),
  analysisId:      int("analysisId").notNull(),
  entityName:      varchar("entityName", { length: 200 }).notNull(),
  entityType:      mysqlEnum("ipEntityType", ["corporation", "university", "startup", "individual", "government"]).notNull(),
  patentCount:     int("patentCount").notNull().default(0),
  relevanceScore:  decimal("relevanceScore", { precision: 5, scale: 2 }).notNull().default("0"),
  country:         varchar("country", { length: 100 }),
  threat:          mysqlEnum("ipEntityThreat", ["LOW", "MED", "HIGH"]).notNull().default("LOW"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type IpEntity = typeof ipEntities.$inferSelect;
export type InsertIpEntity = typeof ipEntities.$inferInsert;

export const ipWhitespace = mysqlTable("ip_whitespace", {
  id:              int("id").autoincrement().primaryKey(),
  analysisId:      int("analysisId").notNull(),
  opportunity:     varchar("opportunity", { length: 500 }).notNull(),
  category:        mysqlEnum("ipWhitespaceCategory", ["technology", "geography", "application", "combination"]).notNull(),
  potentialScore:  decimal("potentialScore", { precision: 5, scale: 2 }).notNull().default("0"),
  actionable:      boolean("actionable").notNull().default(true),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type IpWhitespace = typeof ipWhitespace.$inferSelect;
export type InsertIpWhitespace = typeof ipWhitespace.$inferInsert;

export const ipVrlFeed = mysqlTable("ip_vrl_feed", {
  id:              int("id").autoincrement().primaryKey(),
  ventureId:       varchar("ventureId", { length: 50 }).notNull(),
  analysisId:      int("analysisId").notNull(),
  ipScore:         decimal("ipScore", { precision: 5, scale: 2 }).notNull(),
  vrlContribution: decimal("vrlContribution", { precision: 5, scale: 2 }).notNull().default("0"),  // weighted contribution to VRL
  appliedAt:       timestamp("appliedAt").defaultNow().notNull(),
  appliedBy:       varchar("appliedBy", { length: 100 }),
  notes:           text("notes"),
});
export type IpVrlFeed = typeof ipVrlFeed.$inferSelect;
export type InsertIpVrlFeed = typeof ipVrlFeed.$inferInsert;

// ── Sprint 72: G Drive Workspace Automation ───────────────────────────────────
export const gdWorkspaces = mysqlTable("gd_workspaces", {
  id:             int("id").autoincrement().primaryKey(),
  ventureId:      varchar("ventureId", { length: 50 }).notNull(),
  ventureCode:    varchar("ventureCode", { length: 20 }).notNull(),
  ventureName:    varchar("ventureName", { length: 200 }).notNull(),
  driveId:        varchar("driveId", { length: 200 }),
  driveUrl:       varchar("driveUrl", { length: 500 }),
  status:         mysqlEnum("gdWorkspaceStatus", ["pending","creating","active","archived"]).default("pending").notNull(),
  totalFolders:   int("totalFolders").default(0),
  totalDocs:      int("totalDocs").default(0),
  createdBy:      varchar("createdBy", { length: 100 }),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  lastSyncAt:     timestamp("lastSyncAt"),
});
export type GdWorkspace = typeof gdWorkspaces.$inferSelect;
export type InsertGdWorkspace = typeof gdWorkspaces.$inferInsert;

export const gdFolders = mysqlTable("gd_folders", {
  id:             int("id").autoincrement().primaryKey(),
  workspaceId:    int("workspaceId").notNull(),
  ventureId:      varchar("ventureId", { length: 50 }).notNull(),
  moduleNumber:   varchar("moduleNumber", { length: 5 }).notNull(),
  folderName:     varchar("folderName", { length: 300 }).notNull(),
  folderId:       varchar("folderId", { length: 200 }),
  driveUrl:       varchar("driveUrl", { length: 500 }),
  parentFolderId: int("parentFolderId"),
  docCount:       int("docCount").default(0).notNull(),
  approvedCount:  int("approvedCount").default(0).notNull(),
  permissions:    json("permissions"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
});
export type GdFolder = typeof gdFolders.$inferSelect;
export type InsertGdFolder = typeof gdFolders.$inferInsert;

export const gdPermissions = mysqlTable("gd_permissions", {
  id:             int("id").autoincrement().primaryKey(),
  workspaceId:    int("workspaceId").notNull(),
  ventureId:      varchar("ventureId", { length: 50 }).notNull(),
  role:           varchar("role", { length: 100 }).notNull(),
  email:          varchar("email", { length: 320 }),
  accessLevel:    mysqlEnum("gdAccessLevel", ["owner","editor","commenter","viewer","no_access"]).notNull(),
  moduleScope:    json("moduleScope"),
  grantedAt:      timestamp("grantedAt").defaultNow().notNull(),
  grantedBy:      varchar("grantedBy", { length: 100 }),
  revokedAt:      timestamp("revokedAt"),
});
export type GdPermission = typeof gdPermissions.$inferSelect;
export type InsertGdPermission = typeof gdPermissions.$inferInsert;

// ── Sprint 73: VRL Dashboard V4 ──────────────────────────────────────────────
export const vrlStageGates = mysqlTable("vrl_stage_gates", {
  id:              int("id").autoincrement().primaryKey(),
  ventureId:       varchar("ventureId", { length: 50 }).notNull(),
  stage:           mysqlEnum("vrlStage", ["discover","define","build","launch","spinout"]).notNull(),
  status:          mysqlEnum("vrlGateStatus", ["not_started","in_progress","complete","blocked"]).default("not_started").notNull(),
  evidenceDocUrl:  varchar("evidenceDocUrl", { length: 500 }),
  evidenceDocName: varchar("evidenceDocName", { length: 300 }),
  leadName:        varchar("leadName", { length: 100 }),
  score:           decimal("score", { precision: 5, scale: 2 }).default("0"),
  lastUpdated:     timestamp("lastUpdated").defaultNow().notNull(),
  notes:           text("notes"),
});
export type VrlStageGate = typeof vrlStageGates.$inferSelect;
export type InsertVrlStageGate = typeof vrlStageGates.$inferInsert;

export const vrlSpinoutChecklist = mysqlTable("vrl_spinout_checklist", {
  id:               int("id").autoincrement().primaryKey(),
  ventureId:        varchar("ventureId", { length: 50 }).notNull(),
  gateKey:          varchar("gateKey", { length: 100 }).notNull(),
  gateLabel:        varchar("gateLabel", { length: 300 }).notNull(),
  minThreshold:     varchar("minThreshold", { length: 300 }),
  evidenceRequired: varchar("evidenceRequired", { length: 500 }),
  approver:         varchar("approver", { length: 100 }),
  met:              boolean("met").default(false).notNull(),
  evidenceUrl:      varchar("evidenceUrl", { length: 500 }),
  metAt:            timestamp("metAt"),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type VrlSpinoutChecklist = typeof vrlSpinoutChecklist.$inferSelect;
export type InsertVrlSpinoutChecklist = typeof vrlSpinoutChecklist.$inferInsert;

export const vrlActionsLog = mysqlTable("vrl_actions_log", {
  id:           int("id").autoincrement().primaryKey(),
  ventureId:    varchar("ventureId", { length: 50 }).notNull(),
  action:       text("action").notNull(),
  owner:        varchar("owner", { length: 100 }),
  status:       mysqlEnum("vrlActionStatus", ["pending","in_progress","complete","cancelled"]).default("pending").notNull(),
  linkedModule: varchar("linkedModule", { length: 10 }),
  completedAt:  timestamp("completedAt"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type VrlActionsLog = typeof vrlActionsLog.$inferSelect;
export type InsertVrlActionsLog = typeof vrlActionsLog.$inferInsert;

// ── Sprint 74: Spin-Off Sequence Automation ───────────────────────────────────
export const spinoffSequences = mysqlTable("spinoff_sequences", {
  id:               int("id").autoincrement().primaryKey(),
  ventureId:        varchar("ventureId", { length: 50 }).notNull(),
  ventureCode:      varchar("ventureCode", { length: 20 }).notNull(),
  ventureName:      varchar("ventureName", { length: 200 }).notNull(),
  triggerVrlScore:  decimal("triggerVrlScore", { precision: 5, scale: 2 }).notNull(),
  approvedDate:     varchar("approvedDate", { length: 30 }).notNull(),
  founderName:      varchar("founderName", { length: 200 }),
  founderEmail:     varchar("founderEmail", { length: 320 }),
  leadInvestorName: varchar("leadInvestorName", { length: 200 }),
  status:           mysqlEnum("spinoffSeqStatus", ["pending","drive_created","assets_migrated","handover_generated","data_room_ready","completed","failed"]).default("pending").notNull(),
  currentStep:      int("currentStep").default(1).notNull(),
  spinoffDriveUrl:  varchar("spinoffDriveUrl", { length: 500 }),
  dataRoomUrl:      varchar("dataRoomUrl", { length: 500 }),
  completedAt:      timestamp("completedAt"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type SpinoffSequence = typeof spinoffSequences.$inferSelect;
export type InsertSpinoffSequence = typeof spinoffSequences.$inferInsert;

export const spinoffAssets = mysqlTable("spinoff_assets", {
  id:           int("id").autoincrement().primaryKey(),
  sequenceId:   int("sequenceId").notNull(),
  assetType:    mysqlEnum("spinoffAssetType", ["business_plan","financial_model","pitch_deck","cap_table","entity_structure","ip_map","operator_playbook","handover_pack"]).notNull(),
  sourceModule: varchar("sourceModule", { length: 300 }),
  destPath:     varchar("destPath", { length: 300 }),
  status:       mysqlEnum("spinoffAssetStatus", ["pending","copied","locked","missing","failed"]).default("pending").notNull(),
  driveUrl:     varchar("driveUrl", { length: 500 }),
  notes:        text("notes"),
  migratedAt:   timestamp("migratedAt"),
});
export type SpinoffAsset = typeof spinoffAssets.$inferSelect;
export type InsertSpinoffAsset = typeof spinoffAssets.$inferInsert;

export const spinoffHandoverPacks = mysqlTable("spinoff_handover_packs", {
  id:              int("id").autoincrement().primaryKey(),
  sequenceId:      int("sequenceId").notNull(),
  ventureId:       varchar("ventureId", { length: 50 }).notNull(),
  executiveSummary: text("executiveSummary"),
  operatorPlaybook: text("operatorPlaybook"),
  ninetyDayPlan:   text("ninetyDayPlan"),
  openRisks:       text("openRisks"),
  keyContacts:     json("keyContacts"),
  assetLinks:      json("assetLinks"),
  generatedAt:     timestamp("generatedAt").defaultNow().notNull(),
  approvedAt:      timestamp("approvedAt"),
  driveUrl:        varchar("driveUrl", { length: 500 }),
});
export type SpinoffHandoverPack = typeof spinoffHandoverPacks.$inferSelect;
export type InsertSpinoffHandoverPack = typeof spinoffHandoverPacks.$inferInsert;

// ── Sprint 75: Brand Data Pipeline ───────────────────────────────────────────
export const brandAssets = mysqlTable("brand_assets", {
  id:             int("id").autoincrement().primaryKey(),
  ventureId:      varchar("ventureId", { length: 50 }).notNull(),
  assetType:      mysqlEnum("brandAssetType", ["name_tagline","logo","colour_palette","typography","messaging_house","icp_definition","brand_voice"]).notNull(),
  assetName:      varchar("assetName", { length: 200 }),
  masterLocation: varchar("masterLocation", { length: 500 }),
  status:         mysqlEnum("brandAssetStatus", ["missing","draft","pending","approved"]).default("missing").notNull(),
  version:        varchar("version", { length: 20 }).default("V1"),
  content:        text("content"),
  driveUrl:       varchar("driveUrl", { length: 500 }),
  owner:          varchar("owner", { length: 100 }),
  approvedAt:     timestamp("approvedAt"),
  lastUpdated:    timestamp("lastUpdated").defaultNow().notNull(),
});
export type BrandAsset = typeof brandAssets.$inferSelect;
export type InsertBrandAsset = typeof brandAssets.$inferInsert;

export const brandLinks = mysqlTable("brand_links", {
  id:               int("id").autoincrement().primaryKey(),
  ventureId:        varchar("ventureId", { length: 50 }).notNull(),
  assetId:          int("assetId").notNull(),
  linkedModule:     varchar("linkedModule", { length: 10 }).notNull(),
  linkedModuleName: varchar("linkedModuleName", { length: 200 }),
  linkUrl:          varchar("linkUrl", { length: 500 }),
  linkType:         mysqlEnum("brandLinkType", ["reference","embed","auto_push"]).default("reference").notNull(),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type BrandLink = typeof brandLinks.$inferSelect;
export type InsertBrandLink = typeof brandLinks.$inferInsert;

export const brandUpdateLog = mysqlTable("brand_update_log", {
  id:               int("id").autoincrement().primaryKey(),
  ventureId:        varchar("ventureId", { length: 50 }).notNull(),
  assetId:          int("assetId").notNull(),
  assetType:        varchar("assetType", { length: 100 }).notNull(),
  previousStatus:   varchar("previousStatus", { length: 50 }).notNull(),
  newStatus:        varchar("newStatus", { length: 50 }).notNull(),
  changedBy:        varchar("changedBy", { length: 100 }),
  notifiedLeads:    json("notifiedLeads"),
  downstreamFlags:  json("downstreamFlags"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type BrandUpdateLog = typeof brandUpdateLog.$inferSelect;
export type InsertBrandUpdateLog = typeof brandUpdateLog.$inferInsert;

// ── Sprint 76: Interview-to-Insight & Stage Gate Review ──────────────────────
export const insightTriggers = mysqlTable("insight_triggers", {
  id:          int("id").autoincrement().primaryKey(),
  ventureId:   varchar("ventureId", { length: 50 }).notNull(),
  fileName:    varchar("fileName", { length: 300 }).notNull(),
  fileType:    mysqlEnum("insightFileType", ["docx","txt","pdf","mp4","mp3"]).notNull(),
  fileUrl:     varchar("fileUrl", { length: 500 }),
  status:      mysqlEnum("insightTriggerStatus", ["pending","processing","complete","failed"]).default("pending").notNull(),
  processedAt: timestamp("processedAt"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type InsightTrigger = typeof insightTriggers.$inferSelect;
export type InsertInsightTrigger = typeof insightTriggers.$inferInsert;

export const insightSummaries = mysqlTable("insight_summaries", {
  id:                   int("id").autoincrement().primaryKey(),
  triggerId:            int("triggerId").notNull(),
  ventureId:            varchar("ventureId", { length: 50 }).notNull(),
  intervieweeType:      varchar("intervieweeType", { length: 100 }),
  painPoints:           json("painPoints"),
  jobsToBeDone:         json("jobsToBeDone"),
  emotionalSignals:     json("emotionalSignals"),
  functionalSignals:    json("functionalSignals"),
  opportunityScore:     decimal("opportunityScore", { precision: 4, scale: 2 }),
  opportunityRationale: text("opportunityRationale"),
  hypothesesToTest:     json("hypothesesToTest"),
  contradictionFlags:   json("contradictionFlags"),
  rawSummary:           text("rawSummary"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
});
export type InsightSummary = typeof insightSummaries.$inferSelect;
export type InsertInsightSummary = typeof insightSummaries.$inferInsert;

export const stageGateReviews = mysqlTable("stage_gate_reviews", {
  id:              int("id").autoincrement().primaryKey(),
  ventureId:       varchar("ventureId", { length: 50 }).notNull(),
  targetStage:     mysqlEnum("sgTargetStage", ["discover","define","build","launch","spinout"]).notNull(),
  status:          mysqlEnum("sgReviewStatus", ["submitted","in_review","approved","rejected"]).default("submitted").notNull(),
  recommendation:  mysqlEnum("sgRecommendation", ["advance","pause","requires_action"]),
  narrativeMemo:   text("narrativeMemo"),
  evidenceAudit:   json("evidenceAudit"),
  gapList:         json("gapList"),
  submittedBy:     varchar("submittedBy", { length: 100 }),
  approvedBy:      varchar("approvedBy", { length: 100 }),
  approvedAt:      timestamp("approvedAt"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type StageGateReview = typeof stageGateReviews.$inferSelect;
export type InsertStageGateReview = typeof stageGateReviews.$inferInsert;

export const stageGateEvidence = mysqlTable("stage_gate_evidence", {
  id:           int("id").autoincrement().primaryKey(),
  reviewId:     int("reviewId").notNull(),
  moduleNumber: varchar("moduleNumber", { length: 5 }).notNull(),
  docName:      varchar("docName", { length: 300 }).notNull(),
  docUrl:       varchar("docUrl", { length: 500 }),
  docStatus:    mysqlEnum("sgEvidenceStatus", ["present","missing","needs_approval"]).default("missing").notNull(),
  notes:        text("notes"),
});
export type StageGateEvidence = typeof stageGateEvidence.$inferSelect;
export type InsertStageGateEvidence = typeof stageGateEvidence.$inferInsert;


// ══════════════════════════════════════════════════════════════════════════════
// SRL MODULE — SUSTAINABILITY READINESS LEVEL DATA MODEL
// Reference: BEBUS-SRL-DMS-001 v1.0 | April 2026
// 11 entities covering the full SRL scoring lifecycle.
//
// Compatibility notes:
//   - ventureId columns use VARCHAR(64) to match ventures.id PK
//   - All timestamps use MySQL TIMESTAMP (not TIMESTAMPTZ — MySQL dialect)
//   - UUIDs stored as VARCHAR(36) — MySQL has no native UUID type
//   - JSONB → JSON (MySQL dialect)
//   - DATERANGE not supported in MySQL; replaced with periodStart + periodEnd DATE pair
// ══════════════════════════════════════════════════════════════════════════════

// ── SRL Portfolio ─────────────────────────────────────────────────────────────
// Master container for a set of ventures under common ownership or fund management.
export const srlPortfolios = mysqlTable("srl_portfolios", {
  id:            varchar("id", { length: 36 }).primaryKey(),
  portfolioName: varchar("portfolioName", { length: 200 }).notNull(),
  fundManager:   varchar("fundManager", { length: 200 }),
  configProfile: json("configProfile").notNull().default({}),
  currencyCode:  varchar("currencyCode", { length: 3 }).notNull().default("GBP"),
  isActive:      boolean("isActive").notNull().default(true),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SrlPortfolio = typeof srlPortfolios.$inferSelect;
export type InsertSrlPortfolio = typeof srlPortfolios.$inferInsert;

// ── SRL Venture Profile ───────────────────────────────────────────────────────
// 1:1 companion to the existing ventures table — adds SRL-specific metadata
// without altering the core ventures schema.
export const srlVentureProfiles = mysqlTable("srl_venture_profiles", {
  ventureId:           varchar("ventureId", { length: 64 }).primaryKey(),
  portfolioId:         varchar("portfolioId", { length: 36 }),
  sectorCode:          varchar("sectorCode", { length: 50 }).notNull().default("GENERAL"),
  subSector:           varchar("subSector", { length: 100 }),
  currentStage:        mysqlEnum("srlCurrentStage", ["S0","S1","S2","S3","S4"]).notNull().default("S0"),
  srlCurrentLevel:     tinyint("srlCurrentLevel").default(0),
  srlCurrentScore:     decimal("srlCurrentScore", { precision: 5, scale: 2 }).default("0.00"),
  countryCode:         varchar("countryCode", { length: 2 }).notNull().default("GB"),
  incorporatedDate:    date("incorporatedDate"),
  sustainabilityWatch: boolean("sustainabilityWatch").notNull().default(false),
  watchActivatedAt:    timestamp("watchActivatedAt"),
  watchLiftedAt:       timestamp("watchLiftedAt"),
  isActive:            boolean("isActive").notNull().default(true),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SrlVentureProfile = typeof srlVentureProfiles.$inferSelect;
export type InsertSrlVentureProfile = typeof srlVentureProfiles.$inferInsert;

// ── SRL Dimension Definition ──────────────────────────────────────────────────
// Master reference for the 5 scoring dimensions: ENV, LCA, SMF, SOC, ESG.
// Seeded once; change-controlled thereafter.
export const srlDimensionDefinitions = mysqlTable("srl_dimension_definitions", {
  id:            varchar("id", { length: 36 }).primaryKey(),
  dimensionCode: mysqlEnum("srlDimDefCode", ["ENV","LCA","SMF","SOC","ESG"]).notNull().unique(),
  dimensionName: varchar("dimensionName", { length: 100 }).notNull(),
  description:   text("description"),
  defaultWeight: decimal("defaultWeight", { precision: 5, scale: 4 }).notNull(),
  sortOrder:     tinyint("sortOrder").notNull(),
  isActive:      boolean("isActive").notNull().default(true),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SrlDimensionDefinition = typeof srlDimensionDefinitions.$inferSelect;
export type InsertSrlDimensionDefinition = typeof srlDimensionDefinitions.$inferInsert;

// ── SRL KPI Definition ────────────────────────────────────────────────────────
// Master library of all 44 KPI metrics with normalisation rules and reporting tags.
export const srlKpiDefinitions = mysqlTable("srl_kpi_definitions", {
  id:                  varchar("id", { length: 36 }).primaryKey(),
  dimensionId:         varchar("dimensionId", { length: 36 }).notNull(),
  kpiCode:             varchar("kpiCode", { length: 20 }).notNull().unique(),
  kpiName:             varchar("kpiName", { length: 200 }).notNull(),
  description:         text("description"),
  dataType:            mysqlEnum("srlKpiDataType", ["NUMERIC","PERCENT","BOOLEAN","INDEX","ORDINAL"]).notNull(),
  unit:                varchar("unit", { length: 50 }).notNull(),
  normalisationMethod: mysqlEnum("srlNormMethod", ["MIN_MAX","TARGET_BASED","THRESHOLD","BINARY"]).notNull(),
  normTarget:          decimal("normTarget", { precision: 18, scale: 4 }),
  normMin:             decimal("normMin", { precision: 18, scale: 4 }),
  normMax:             decimal("normMax", { precision: 18, scale: 4 }),
  thresholdValue:      decimal("thresholdValue", { precision: 18, scale: 4 }),
  thresholdDirection:  mysqlEnum("srlThreshDir", ["GTE","LTE","EQ"]),
  isMandatory:         boolean("isMandatory").notNull().default(false),
  higherIsBetter:      boolean("higherIsBetter").notNull().default(true),
  sdgTag:              varchar("sdgTag", { length: 50 }),
  griTag:              varchar("griTag", { length: 50 }),
  tcfdTag:             varchar("tcfdTag", { length: 50 }),
  sasbTag:             varchar("sasbTag", { length: 50 }),
  activatedByTrlLevel: tinyint("activatedByTrlLevel"),
  activatedByMrlLevel: tinyint("activatedByMrlLevel"),
  effectiveFrom:       date("effectiveFrom").notNull(),
  effectiveTo:         date("effectiveTo"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SrlKpiDefinition = typeof srlKpiDefinitions.$inferSelect;
export type InsertSrlKpiDefinition = typeof srlKpiDefinitions.$inferInsert;

// ── SRL Data Source ───────────────────────────────────────────────────────────
// Registry of all data sources feeding KPI values.
export const srlDataSources = mysqlTable("srl_data_sources", {
  id:          varchar("id", { length: 36 }).primaryKey(),
  sourceName:  varchar("sourceName", { length: 200 }).notNull(),
  sourceType:  mysqlEnum("srlSrcType", ["MANUAL","API","FILE_UPLOAD","SURVEY","SYSTEM"]).notNull(),
  endpointUrl: varchar("endpointUrl", { length: 500 }),
  frequency:   varchar("frequency", { length: 30 }),
  dataOwner:   varchar("dataOwner", { length: 200 }),
  isActive:    boolean("isActive").notNull().default(true),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SrlDataSource = typeof srlDataSources.$inferSelect;
export type InsertSrlDataSource = typeof srlDataSources.$inferInsert;

// ── SRL Weight Configuration ──────────────────────────────────────────────────
// Stage-aware and sector-aware weight configuration matrix.
// Default weights per BEBUS-SRL-DMS-001 §6 — seeded by migration.
export const srlWeightConfigs = mysqlTable("srl_weight_configs", {
  id:             varchar("id", { length: 36 }).primaryKey(),
  dimensionCode:  mysqlEnum("srlWcDimCode", ["ENV","LCA","SMF","SOC","ESG"]).notNull(),
  lifecycleStage: mysqlEnum("srlWcStage", ["S0","S1","S2","S3","S4"]).notNull(),
  sectorCode:     varchar("sectorCode", { length: 64 }).notNull().default("default"),
  weightValue:    decimal("weightValue", { precision: 5, scale: 4 }).notNull(),
  effectiveFrom:  date("effectiveFrom").notNull(),
  effectiveTo:    date("effectiveTo"),
  createdBy:      varchar("createdBy", { length: 128 }).notNull().default("system"),
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
});
export type SrlWeightConfig = typeof srlWeightConfigs.$inferSelect;
export type InsertSrlWeightConfig = typeof srlWeightConfigs.$inferInsert;

// ── SRL Gate Configuration ────────────────────────────────────────────────────
// Framework constants defining composite floor and block type for each gate (G1–G5).
export const srlGateConfigs = mysqlTable("srl_gate_configs", {
  id:                      varchar("id", { length: 36 }).primaryKey(),
  gateCode:                mysqlEnum("srlGcCode", ["G1","G2","G3","G4","G5"]).notNull().unique(),
  compositeFloor:          decimal("compositeFloor", { precision: 5, scale: 2 }).notNull(),
  blockType:               mysqlEnum("srlBlockType", ["advisory","soft","hard"]).notNull(),
  remediationWindowDays:   int("remediationWindowDays").notNull(),
  effectiveFrom:           date("effectiveFrom").notNull(),
  effectiveTo:             date("effectiveTo"),
  createdAt:               timestamp("createdAt").defaultNow().notNull(),
});
export type SrlGateConfig = typeof srlGateConfigs.$inferSelect;
export type InsertSrlGateConfig = typeof srlGateConfigs.$inferInsert;

// ── SRL Gate Dimension Floors ─────────────────────────────────────────────────
// Per-dimension minimum scores required at each gate.
export const srlGateDimensionFloors = mysqlTable("srl_gate_dimension_floors", {
  id:            varchar("id", { length: 36 }).primaryKey(),
  gateConfigId:  varchar("gateConfigId", { length: 36 }).notNull(),
  dimensionCode: mysqlEnum("srlGdfDimCode", ["ENV","LCA","SMF","SOC","ESG"]).notNull(),
  floorValue:    decimal("floorValue", { precision: 5, scale: 2 }).notNull(),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
});
export type SrlGateDimensionFloor = typeof srlGateDimensionFloors.$inferSelect;
export type InsertSrlGateDimensionFloor = typeof srlGateDimensionFloors.$inferInsert;

// ── SRL Assessment ────────────────────────────────────────────────────────────
// Immutable scored assessment event for a venture at a point in time.
// is_locked = TRUE once committed; amendments create a new version row.
export const srlAssessments = mysqlTable("srl_assessments", {
  id:                   varchar("id", { length: 36 }).primaryKey(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  assessmentDate:       date("assessmentDate").notNull(),
  stageAtAssessment:    mysqlEnum("srlStageAtAssmt", ["S0","S1","S2","S3","S4"]).notNull(),
  compositeScore:       decimal("compositeScore", { precision: 5, scale: 2 }).notNull(),
  srlLevel:             tinyint("srlLevel").notNull(),
  scoreDelta:           decimal("scoreDelta", { precision: 5, scale: 2 }),
  gateRef:              varchar("gateRef", { length: 10 }),
  gateStatus:           mysqlEnum("srlGateStatus", ["PASS","FAIL","PENDING","NA"]),
  sustainabilityWatch:  boolean("sustainabilityWatch").notNull().default(false),
  trajectoryBonus:      decimal("trajectoryBonus", { precision: 5, scale: 2 }).default("0.00"),
  weightConfigSnapshot: json("weightConfigSnapshot").notNull(),
  assessedBy:           varchar("assessedBy", { length: 200 }).notNull(),
  isLocked:             boolean("isLocked").notNull().default(false),
  versionNo:            tinyint("versionNo").notNull().default(1),
  notes:                text("notes"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
});
export type SrlAssessment = typeof srlAssessments.$inferSelect;
export type InsertSrlAssessment = typeof srlAssessments.$inferInsert;

// ── SRL Dimension Score ───────────────────────────────────────────────────────
// Per-dimension weighted score within a given assessment (5 rows per assessment).
export const srlDimensionScores = mysqlTable("srl_dimension_scores", {
  id:             varchar("id", { length: 36 }).primaryKey(),
  assessmentId:   varchar("assessmentId", { length: 36 }).notNull(),
  dimensionId:    varchar("dimensionId", { length: 36 }).notNull(),
  dimensionCode:  mysqlEnum("srlDimScoreCode", ["ENV","LCA","SMF","SOC","ESG"]).notNull(),
  rawScore:       decimal("rawScore", { precision: 5, scale: 2 }).notNull(),
  weightedScore:  decimal("weightedScore", { precision: 5, scale: 2 }).notNull(),
  weightApplied:  decimal("weightApplied", { precision: 5, scale: 4 }).notNull(),
  kpiCoveragePct: decimal("kpiCoveragePct", { precision: 5, scale: 2 }),
  gatePass:       boolean("gatePass"),
  gateFloorValue: decimal("gateFloorValue", { precision: 5, scale: 2 }),
  gapFlags:       json("gapFlags"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
});
export type SrlDimensionScore = typeof srlDimensionScores.$inferSelect;
export type InsertSrlDimensionScore = typeof srlDimensionScores.$inferInsert;

// ── SRL KPI Value ─────────────────────────────────────────────────────────────
// Individual KPI metric observation feeding a dimension score.
export const srlKpiValues = mysqlTable("srl_kpi_values", {
  id:               varchar("id", { length: 36 }).primaryKey(),
  dimScoreId:       varchar("dimScoreId", { length: 36 }).notNull(),
  kpiDefId:         varchar("kpiDefId", { length: 36 }).notNull(),
  kpiCode:          varchar("kpiCode", { length: 20 }).notNull(),
  sourceId:         varchar("sourceId", { length: 36 }).notNull(),
  rawValue:         decimal("rawValue", { precision: 18, scale: 4 }),
  unit:             varchar("unit", { length: 50 }).notNull(),
  normalisedValue:  decimal("normalisedValue", { precision: 5, scale: 2 }),
  periodStart:      date("periodStart"),
  periodEnd:        date("periodEnd"),
  submittedBy:      varchar("submittedBy", { length: 200 }).notNull(),
  submittedAt:      timestamp("submittedAt").defaultNow().notNull(),
  evidenceRef:      varchar("evidenceRef", { length: 500 }),
  isVerified:       boolean("isVerified").notNull().default(false),
  verifier:         varchar("verifier", { length: 200 }),
  verificationDate: date("verificationDate"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type SrlKpiValue = typeof srlKpiValues.$inferSelect;
export type InsertSrlKpiValue = typeof srlKpiValues.$inferInsert;

// ── SRL Gate Holding Status ───────────────────────────────────────────────────
// Tracks the compounding gate state machine per venture per gate.
// REMEDIATION → HOLDING → CLEARED (or ESCALATED after 2 restarts).
export const srlGateHoldingStatus = mysqlTable("srl_gate_holding_status", {
  id:                    varchar("id", { length: 36 }).primaryKey(),
  ventureId:             varchar("ventureId", { length: 64 }).notNull(),
  gateCode:              mysqlEnum("srlGhsGate", ["G1","G2","G3","G4","G5"]).notNull(),
  status:                mysqlEnum("srlGhsStatus", ["REMEDIATION","HOLDING","CLEARED","ESCALATED"]).notNull(),
  firstFailAssessmentId: varchar("firstFailAssessmentId", { length: 36 }),
  clearanceAssessmentId: varchar("clearanceAssessmentId", { length: 36 }),
  remediationStartDate:  date("remediationStartDate"),
  holdingStartDate:      date("holdingStartDate"),
  clearanceDate:         date("clearanceDate"),
  restartCount:          tinyint("restartCount").notNull().default(0),
  updatedAt:             timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
});
export type SrlGateHoldingStatus = typeof srlGateHoldingStatus.$inferSelect;
export type InsertSrlGateHoldingStatus = typeof srlGateHoldingStatus.$inferInsert;

// ── SRL Reporting Output ──────────────────────────────────────────────────────
// Persisted report artefacts generated from assessment data.
export const srlReportingOutputs = mysqlTable("srl_reporting_outputs", {
  id:             varchar("id", { length: 36 }).primaryKey(),
  assessmentId:   varchar("assessmentId", { length: 36 }).notNull(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  reportType:     mysqlEnum("srlReportType", ["SCORECARD","GATE_PACK","ESG_SUMMARY","EVIDENCE_BUNDLE","VRL_CONTRIBUTION","SDG_MAP"]).notNull(),
  reportFormat:   mysqlEnum("srlReportFormat", ["PDF","DOCX","XLSX","JSON","HTML"]).notNull(),
  reportStandard: mysqlEnum("srlReportStandard", ["GRI","TCFD","SASB","SDG","INTERNAL"]),
  fileRef:        varchar("fileRef", { length: 500 }),
  generatedBy:    varchar("generatedBy", { length: 200 }).notNull(),
  generatedAt:    timestamp("generatedAt").defaultNow().notNull(),
  periodStart:    date("periodStart"),
  periodEnd:      date("periodEnd"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
});
export type SrlReportingOutput = typeof srlReportingOutputs.$inferSelect;
export type InsertSrlReportingOutput = typeof srlReportingOutputs.$inferInsert;

// ── SRL Audit Log ─────────────────────────────────────────────────────────────
// Append-only, immutable audit record for all SRL scoring events and config changes.
// payloadHash is SHA-256 of the submitted payload for tamper detection.
export const srlAuditLog = mysqlTable("srl_audit_log", {
  id:             bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  eventType:      mysqlEnum("srlAuditEvtType", ["assessment","config_change","data_submission","gate_change","watch_flag","report_generated"]).notNull(),
  ventureId:      varchar("ventureId", { length: 64 }),
  actorId:        varchar("actorId", { length: 128 }).notNull(),
  actorRole:      varchar("actorRole", { length: 64 }),
  eventTimestamp: timestamp("eventTimestamp").defaultNow().notNull(),
  payloadHash:    varchar("payloadHash", { length: 64 }).notNull(),
  referenceId:    varchar("referenceId", { length: 36 }),
  notes:          text("notes"),
});
export type SrlAuditLogEntry = typeof srlAuditLog.$inferSelect;
export type InsertSrlAuditLogEntry = typeof srlAuditLog.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// MRL MODULE — Manufacturing Readiness Level Intelligence System v1.0
// Five-engine architecture: PDE · SCIE · CSM · QCE · SIL
// ═══════════════════════════════════════════════════════════════════════════════

// ── MRL Assessments ───────────────────────────────────────────────────────────
// Top-level assessment record capturing composite MRL level and subsystem scores.
export const mrlAssessments = mysqlTable("mrl_assessments", {
  id:              varchar("id", { length: 36 }).primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  mrlLevel:        int("mrlLevel").notNull(),           // 1–9
  mrlLabel:        varchar("mrlLabel", { length: 64 }).notNull(), // e.g. "Pilot Proven"
  trlLevel:        int("trlLevel"),                     // TRL at time of assessment
  // Subsystem scores (0–100 each)
  pdeScore:        int("pdeScore"),                     // Process Design Engine
  scieScore:       int("scieScore"),                    // Supply Chain Intelligence Engine
  csmScore:        int("csmScore"),                     // Cost & Scale Model
  qceScore:        int("qceScore"),                     // Quality & Compliance Engine
  silScore:        int("silScore"),                     // Sustainability Integration Layer
  compositeScore:  int("compositeScore"),               // weighted composite (0–100)
  // VRL contribution (MRL weight = 0.30 in VRL composite)
  vrlContribution: float("vrlContribution"),            // MRL × 0.30 contribution to VRL
  // Risk summary
  riskScoreOverall: int("riskScoreOverall"),            // 0–100 RAG aggregate
  riskRag:         mysqlEnum("mrlRiskRag", ["GREEN","AMBER","RED"]).default("AMBER"),
  // Integration model
  mrlRegion: mysqlEnum("mrlRegion", ["CN","UK","HYBRID"]).default("HYBRID"),
  notes:           text("notes"),
  assessedBy:      varchar("assessedBy", { length: 128 }),
  assessedAt:      timestamp("assessedAt").defaultNow().notNull(),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MrlAssessment = typeof mrlAssessments.$inferSelect;
export type InsertMrlAssessment = typeof mrlAssessments.$inferInsert;

// ── MRL Process Routes (Process Design Engine — PDE) ─────────────────────────
// Directed-graph process route: each record is a single operation node.
export const mrlProcessRoutes = mysqlTable("mrl_process_routes", {
  id:              varchar("id", { length: 36 }).primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  assessmentId:    varchar("assessmentId", { length: 36 }),
  routeName:       varchar("routeName", { length: 255 }).notNull(),
  // Operations stored as JSON array: [{id, label, type, cycleTimeSec, isBottleneck}]
  operations:      json("operations").notNull(),
  // Tooling requirements: [{tool, leadTimeWeeks, costGbp, isCustom}]
  toolingSpecs:    json("toolingSpecs"),
  bottleneckNodes: json("bottleneckNodes"),              // operation IDs flagged as bottlenecks
  targetVolumePerYear: int("targetVolumePerYear"),
  cycleTimeModelSec:   int("cycleTimeModelSec"),         // theoretical cycle time (seconds)
  pdeScore:        int("pdeScore"),                      // 0–100
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MrlProcessRoute = typeof mrlProcessRoutes.$inferSelect;
export type InsertMrlProcessRoute = typeof mrlProcessRoutes.$inferInsert;

// ── MRL Suppliers (Supply Chain Intelligence Engine — SCIE) ──────────────────
// Supplier records linked to ventures via BOM tier.
export const mrlSuppliers = mysqlTable("mrl_suppliers", {
  id:              varchar("id", { length: 36 }).primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  name:            varchar("name", { length: 255 }).notNull(),
  tier:            mysqlEnum("mrlSupplierTier", ["T1","T2","T3"]).default("T1"),
  country:         varchar("country", { length: 64 }).notNull(),
  region:          mysqlEnum("mrlSupplierRegion", ["CN","UK","EU","US","ROW"]).default("CN"),
  category:        varchar("category", { length: 128 }),  // e.g. "Electronics", "Plastics"
  // BOM components supplied: [{partNo, description, moq, leadTimeWeeks}]
  bomComponents:   json("bomComponents"),
  // Risk scoring
  riskScore:       int("riskScore").default(0),           // 0–100 (RAG × P × I)
  riskRag:         mysqlEnum("mrlScieRag", ["GREEN","AMBER","RED"]).default("AMBER"),
  isSingleSource:  boolean("isSingleSource").default(false),
  hasDualSource:   boolean("hasDualSource").default(false),
  leadTimeWeeks:   int("leadTimeWeeks"),
  moqUnits:        int("moqUnits"),
  fxExposure:      mysqlEnum("mrlFxExposure", ["LOW","MED","HIGH"]).default("MED"),
  geopoliticalRisk: mysqlEnum("mrlGeoRisk", ["LOW","MED","HIGH"]).default("LOW"),
  auditStatus:     mysqlEnum("mrlAuditStatus", ["Not Audited","Pending","Passed","Failed"]).default("Not Audited"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MrlSupplier = typeof mrlSuppliers.$inferSelect;
export type InsertMrlSupplier = typeof mrlSuppliers.$inferInsert;

// ── MRL Cost Models (Cost & Scale Model — CSM) ───────────────────────────────
// Parametric cost model with volume scenarios and unit economics.
export const mrlCostModels = mysqlTable("mrl_cost_models", {
  id:              varchar("id", { length: 36 }).primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  assessmentId:    varchar("assessmentId", { length: 36 }),
  modelName:       varchar("modelName", { length: 255 }).notNull(),
  region:          mysqlEnum("mrlCostRegion", ["CN","UK","HYBRID"]).default("HYBRID"),
  // Volume scenarios: [{volume, unitCostGbp, marginPct, breakEvenVol}]
  volumeScenarios: json("volumeScenarios").notNull(),
  // Unit economics at target volume
  targetVolume:    int("targetVolume"),
  unitCostGbp:     float("unitCostGbp"),
  unitPriceGbp:    float("unitPriceGbp"),
  grossMarginPct:  float("grossMarginPct"),
  breakEvenVolume: int("breakEvenVolume"),
  // CapEx / OpEx split
  capexGbp:        float("capexGbp"),
  opexAnnualGbp:   float("opexAnnualGbp"),
  capexOpexRatio:  float("capexOpexRatio"),
  // Labour rates by region: [{region, roleType, hourlyRateGbp}]
  labourRates:     json("labourRates"),
  // Sensitivity: [{driver, lowImpact, highImpact}]
  sensitivityFactors: json("sensitivityFactors"),
  csmScore:        int("csmScore"),                      // 0–100
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MrlCostModel = typeof mrlCostModels.$inferSelect;
export type InsertMrlCostModel = typeof mrlCostModels.$inferInsert;

// ── MRL Compliance Records (Quality & Compliance Engine — QCE) ───────────────
// Per-standard compliance tracking with certification roadmap.
export const mrlComplianceRecords = mysqlTable("mrl_compliance_records", {
  id:              varchar("id", { length: 36 }).primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  assessmentId:    varchar("assessmentId", { length: 36 }),
  standard:        varchar("standard", { length: 128 }).notNull(), // e.g. "ISO 9001", "CE", "UKCA"
  market:          varchar("market", { length: 64 }).notNull(),     // e.g. "UK", "EU", "US"
  category:        mysqlEnum("mrlComplianceCat", [
    "Quality Management",
    "Product Safety",
    "Environmental",
    "Materials",
    "Process",
    "Social"
  ]).default("Quality Management"),
  status:          mysqlEnum("mrlComplianceStatus", [
    "Not Started",
    "Gap Analysis",
    "In Progress",
    "Submitted",
    "Certified",
    "Expired"
  ]).default("Not Started"),
  gapSummary:      text("gapSummary"),
  certificationBody: varchar("certificationBody", { length: 255 }),
  targetCertDate:  date("targetCertDate"),
  actualCertDate:  date("actualCertDate"),
  expiryDate:      date("expiryDate"),
  estimatedCostGbp: float("estimatedCostGbp"),
  estimatedWeeks:  int("estimatedWeeks"),
  isOnCriticalPath: boolean("isOnCriticalPath").default(false),
  // Quality KPIs: [{kpi, target, current, unit}]
  qualityKpis:     json("qualityKpis"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MrlComplianceRecord = typeof mrlComplianceRecords.$inferSelect;
export type InsertMrlComplianceRecord = typeof mrlComplianceRecords.$inferInsert;

// ── MRL LCSA Records (Sustainability Integration Layer — SIL) ─────────────────
// Lifecycle and Social Assessment records aligned to ISO 14040/44 + SA8000.
export const mrlLcsaRecords = mysqlTable("mrl_lcsa_records", {
  id:              varchar("id", { length: 36 }).primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  assessmentId:    varchar("assessmentId", { length: 36 }),
  // Carbon intensity
  carbonScope1:    float("carbonScope1"),                // kgCO2e — direct emissions
  carbonScope2:    float("carbonScope2"),                // kgCO2e — energy indirect
  carbonScope3:    float("carbonScope3"),                // kgCO2e — value chain
  carbonIntensityPerUnit: float("carbonIntensityPerUnit"), // kgCO2e per unit produced
  // LCSA composite
  lcsaScore:       int("lcsaScore"),                     // 0–100
  circularityIndex: float("circularityIndex"),           // 0–1 (1 = fully circular)
  // Social risk
  socialRiskIndex: float("socialRiskIndex"),             // 0–100 (higher = more risk)
  // Facility energy mix: [{facility, energyMixPct: {renewable, grid, fossil}}]
  facilityEnergyMix: json("facilityEnergyMix"),
  // CBAM exposure
  cbamExposure:    mysqlEnum("mrlCbamExposure", ["None","Low","Medium","High"]).default("None"),
  cbamEstimatedCostGbp: float("cbamEstimatedCostGbp"),
  // Benchmark vs sector
  sectorBenchmarkScore: int("sectorBenchmarkScore"),
  silScore:        int("silScore"),                      // 0–100
  notes:           text("notes"),
  recordedAt:      timestamp("recordedAt").defaultNow().notNull(),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MrlLcsaRecord = typeof mrlLcsaRecords.$inferSelect;
export type InsertMrlLcsaRecord = typeof mrlLcsaRecords.$inferInsert;

// ── MRL Risk Register ─────────────────────────────────────────────────────────
// Per-assessment risk register using RAG × Probability × Impact formula.
export const mrlRiskRegister = mysqlTable("mrl_risk_register", {
  id:              varchar("id", { length: 36 }).primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  assessmentId:    varchar("assessmentId", { length: 36 }),
  category:        mysqlEnum("mrlRiskCat", [
    "Technical",
    "Supply Chain",
    "Cost",
    "Compliance",
    "Sustainability"
  ]).notNull(),
  description:     text("description").notNull(),
  // RAG × Probability × Impact = Risk Score (0–100)
  rag:             mysqlEnum("mrlRag", ["G","A","R"]).notNull(), // 1=G / 2=A / 3=R
  probability:     int("probability").notNull(),                 // 0–100
  impact:          int("impact").notNull(),                      // 0–100
  riskScore:       int("riskScore").notNull(),                   // computed: rag×P×I / 300
  priority:        mysqlEnum("mrlRiskPriority", ["LOW","MED","HIGH"]).default("MED"),
  mitigationAction: text("mitigationAction"),
  mitigationOwner: varchar("mitigationOwner", { length: 128 }),
  targetResolutionDate: date("targetResolutionDate"),
  status:          mysqlEnum("mrlRiskStatus", ["Open","In Progress","Mitigated","Accepted","Closed"]).default("Open"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MrlRiskItem = typeof mrlRiskRegister.$inferSelect;
export type InsertMrlRiskItem = typeof mrlRiskRegister.$inferInsert;

// ── MRL Level Definitions (reference / seed data) ────────────────────────────
// Canonical MRL level definitions aligned to the ECOBLEND MRL framework v1.0.
export const mrlLevelDefs = mysqlTable("mrl_level_defs", {
  level:           int("level").primaryKey(),            // 1–9
  label:           varchar("label", { length: 64 }).notNull(),  // e.g. "Pilot Proven"
  trlAlignment:    varchar("trlAlignment", { length: 16 }),     // e.g. "5-6"
  description:     text("description").notNull(),
  keyActivities:   json("keyActivities"),                // string[]
  exitCriteria:    json("exitCriteria"),                 // string[]
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type MrlLevelDef = typeof mrlLevelDefs.$inferSelect;
export type InsertMrlLevelDef = typeof mrlLevelDefs.$inferInsert;

// ── TRL/MRL Sync Engine Tables ────────────────────────────────────────────────
// Three tables only. ventures table already exists from MRL module.
// Spec: BEBUS-SYNC-SE-001 / trlmrlsyncengine.pdf

// sync_assessments — insert-only, one row per computeSync() call
export const syncAssessments = mysqlTable("sync_assessments", {
  syncId:           varchar("syncId", { length: 36 }).primaryKey(),
  ventureId:        varchar("ventureId", { length: 36 }).notNull(),
  trl:              int("trl").notNull(),
  mrl:              int("mrl").notNull(),
  delta:            int("delta").notNull(),
  psi:              decimal("psi", { precision: 8, scale: 4 }).notNull(),
  rho:              decimal("rho", { precision: 8, scale: 4 }).notNull(),
  eta:              decimal("eta", { precision: 6, scale: 4 }).notNull(),
  vrlPenalty:       decimal("vrlPenalty", { precision: 6, scale: 4 }).notNull(),
  adjustedVrl:      decimal("adjustedVrl", { precision: 5, scale: 2 }),
  wStage:           decimal("wStage", { precision: 5, scale: 3 }).notNull(),
  wVelocity:        decimal("wVelocity", { precision: 6, scale: 4 }).notNull(),
  severity:         mysqlEnum("syncSeverity", ["OK", "WATCH", "AMBER", "RED"]).notNull(),
  primaryPath:      varchar("primaryPath", { length: 40 }).notNull(),
  domainSupply:     decimal("domainSupply", { precision: 4, scale: 3 }).notNull().default("0.500"),
  domainCost:       decimal("domainCost", { precision: 4, scale: 3 }).notNull().default("0.500"),
  domainCompliance: decimal("domainCompliance", { precision: 4, scale: 3 }).notNull().default("0.500"),
  actions:          json("actions").notNull(),
  historySnapshot:  json("historySnapshot"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type SyncAssessment = typeof syncAssessments.$inferSelect;
export type InsertSyncAssessment = typeof syncAssessments.$inferInsert;

// sync_history — append-only, one row per TRL or MRL change
export const syncHistory = mysqlTable("sync_history", {
  historyId:   varchar("historyId", { length: 36 }).primaryKey(),
  ventureId:   varchar("ventureId", { length: 36 }).notNull(),
  trl:         int("trl").notNull(),
  mrl:         int("mrl").notNull(),
  delta:       int("delta").notNull(),
  recordedAt:  timestamp("recordedAt").defaultNow().notNull(),
});
export type SyncHistoryRow = typeof syncHistory.$inferSelect;
export type InsertSyncHistoryRow = typeof syncHistory.$inferInsert;

// sync_scenarios — 5 seeded demo scenarios (isDemo = true)
export const syncScenarios = mysqlTable("sync_scenarios", {
  scenarioId:        varchar("scenarioId", { length: 36 }).primaryKey(),
  name:              varchar("name", { length: 80 }).notNull(),
  sector:            varchar("sector", { length: 80 }).notNull(),
  trl:               int("trl").notNull(),
  mrl:               int("mrl").notNull(),
  domainSupply:      decimal("domainSupply", { precision: 4, scale: 3 }).notNull(),
  domainCost:        decimal("domainCost", { precision: 4, scale: 3 }).notNull(),
  domainCompliance:  decimal("domainCompliance", { precision: 4, scale: 3 }).notNull(),
  history:           json("history").notNull(),
  isDemo:            boolean("isDemo").notNull().default(true),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
});
export type SyncScenario = typeof syncScenarios.$inferSelect;
export type InsertSyncScenario = typeof syncScenarios.$inferInsert;

// ============================================================
// MRL SCORING SYSTEM — BEBUS-MRL-SCORE-001
// Tables: scoring_sessions, scoring_category_results, scoring_datasets
// Do NOT recreate: ventures, mrl_assessments (already exist)
// ============================================================

// scoring_sessions — insert-only audit log of every MRL score run
export const scoringSessions = mysqlTable("scoring_sessions", {
  sessionId:       varchar("sessionId", { length: 36 }).primaryKey(),
  ventureId:       varchar("ventureId", { length: 36 }),
  ventureName:     varchar("ventureName", { length: 120 }),
  mrlScore:        decimal("mrlScore", { precision: 5, scale: 1 }).notNull(),
  mrlScoreRaw:     decimal("mrlScoreRaw", { precision: 5, scale: 1 }).notNull(),
  mrlLevel:        int("mrlLevel").notNull(),
  mrlLabel:        varchar("mrlLabel", { length: 40 }).notNull(),
  confidenceBand:  decimal("confidenceBand", { precision: 5, scale: 2 }).notNull(),
  gateLocked:      boolean("gateLocked").notNull().default(false),
  gateReason:      text("gateReason"),
  schemaVersion:   varchar("schemaVersion", { length: 20 }).notNull().default("1.0.0"),
  scoredBy:        varchar("scoredBy", { length: 36 }),
  assessmentType:  varchar("assessmentType", { length: 20 }).notNull().default("manual"),
  snapshotHash:    varchar("snapshotHash", { length: 64 }).notNull(),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type ScoringSession = typeof scoringSessions.$inferSelect;
export type InsertScoringSession = typeof scoringSessions.$inferInsert;

// scoring_category_results — one row per category per session (5 rows per session)
export const scoringCategoryResults = mysqlTable("scoring_category_results", {
  resultId:        varchar("resultId", { length: 36 }).primaryKey(),
  sessionId:       varchar("sessionId", { length: 36 }).notNull(),
  category:        varchar("category", { length: 30 }).notNull(),
  scoreS:          decimal("scoreS", { precision: 6, scale: 4 }).notNull(),
  maturityM:       decimal("maturityM", { precision: 4, scale: 2 }).notNull(),
  weightW:         decimal("weightW", { precision: 4, scale: 2 }).notNull(),
  contribution:    decimal("contribution", { precision: 8, scale: 4 }).notNull(),
  maturityLabel:   varchar("maturityLabel", { length: 20 }).notNull(),
  indicatorScores: json("indicatorScores").notNull(),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type ScoringCategoryResult = typeof scoringCategoryResults.$inferSelect;
export type InsertScoringCategoryResult = typeof scoringCategoryResults.$inferInsert;

// scoring_datasets — seeded demo datasets (4 canonical examples)
export const scoringDatasets = mysqlTable("scoring_datasets", {
  datasetId:           varchar("datasetId", { length: 36 }).primaryKey(),
  name:                varchar("name", { length: 80 }).notNull(),
  sector:              varchar("sector", { length: 80 }).notNull(),
  description:         text("description"),
  indicatorScores:     json("indicatorScores").notNull(),
  maturityScores:      json("maturityScores").notNull(),
  isDemo:              boolean("isDemo").notNull().default(true),
  expectedMrlLevel:    int("expectedMrlLevel"),
  expectedGateLocked:  boolean("expectedGateLocked"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
});
export type ScoringDataset = typeof scoringDatasets.$inferSelect;
export type InsertScoringDataset = typeof scoringDatasets.$inferInsert;
