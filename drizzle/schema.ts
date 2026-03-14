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
