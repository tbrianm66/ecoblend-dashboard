import {
  boolean,
  date,
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
