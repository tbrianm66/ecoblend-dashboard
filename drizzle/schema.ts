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
