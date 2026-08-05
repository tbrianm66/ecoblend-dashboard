import {
  boolean,
  date,
  doublePrecision,
  integer,
  json,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

// -- Users ---------------------------------------------------------------------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// -- Ventures ------------------------------------------------------------------
export const ventures = pgTable("ventures", {
  id: varchar("id", { length: 64 }).primaryKey(), // e.g. "ecoblend", "tone"
  name: varchar("name", { length: 128 }).notNull(),
  tagline: text("tagline"),
  sector: varchar("sector", { length: 128 }),
  channel: text("channel").default("B2B"),
  status: text("status").default("Pre-Launch"),
  vrl: integer("vrl").default(1).notNull(),           // 1-4
  vrlPercent: integer("vrlPercent").default(0),        // % through current VRL stage
  trl: integer("trl").default(1).notNull(),            // 1-9
  trlPercent: integer("trlPercent").default(0),        // % through current TRL level
  nominatedCharity: varchar("nominatedCharity", { length: 255 }),
  charityFocus: text("charityFocus"),
  founder: varchar("founder", { length: 255 }),
  color: varchar("color", { length: 32 }).default("#51AF37"),
  investmentReady: boolean("investmentReady").default(false),
  isInternalLab: boolean("isInternalLab").default(false),
  description: text("description"),
  bmc: text("bmc"),
  mmc: text("mmc"),
  lifecycleStage: text("lifecycleStage").default("Opportunity"),
  // -- Literature Audit: Innovator's Dilemma - Rec. 5 --------------------------
  // Classifies each venture as sustaining or disruptive per Christensen's framework
  strategicClassification: text("strategicClassification").default("Sustaining"),
  // -- Literature Audit: Lean Startup - Rec. 7 ---------------------------------
  // Identifies which self-reinforcing growth mechanism the venture is pursuing
  engineOfGrowth: text("engineOfGrowth"),
  // -- Literature Audit: Lean Startup - Rec. 8 ---------------------------------
  // Product/market fit signal: whether the engine of growth is self-sustaining
  productMarketFitSignal: text("productMarketFitSignal").default("Not Yet"),
  // -- Literature Audit: Lean Startup - Rec. 3 (Innovation Accounting) ---------
  // Cached innovation accounting metrics (recomputed from experiments/interviews)
  experimentPassRate: doublePrecision("experimentPassRate"),    // passing / completed experiments (%)
  learningVelocity: integer("learningVelocity"),           // validated learning cycles last 30 days
  interviewInsightRate: doublePrecision("interviewInsightRate"), // interviews with validated signal (%)
  // -- Command Centre (Lean OS) extensions — all nullable, additive only ------
  currentStage: text("currentStage"),         // intake|problem_validation|...|investment_ready
  validationStatus: text("validationStatus"), // idea|validating|building|piloting|scaling|paused|pivoting|killed|archived
  ventureType: text("ventureType"),
  owner: varchar("owner", { length: 255 }),
  // -- Lean Startup Workflow State Machine (WorkflowStateService) --------------
  // workflowStage is the authoritative stage in the sequential lean OS workflow.
  // Allowed values are enforced at the API layer via LEAN_STAGES enum (see
  // shared/workflowStages.ts). Never update this column directly — use
  // WorkflowStateService.advance() or WorkflowStateService.triggerPivot().
  workflowStage: text("workflowStage"),       // LEAN_STAGE enum: venture_intake → decision_gate
  pivotRequired: boolean("pivotRequired").default(false),
  pivotReason: text("pivotReason"),
  // -- Lean Canvas versioning — tracks latest persisted version number ----------
  canvasVersion: integer("canvasVersion").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Venture = typeof ventures.$inferSelect;
export type InsertVenture = typeof ventures.$inferInsert;

// -- Venture members (access control) -----------------------------------------
// Maps users to the ventures they may edit. Venture-scoped write operations
// authorise the caller against this table (admins bypass it). A venture with no
// members is "unclaimed" — the first authenticated editor claims it (see the
// server auth model in discoveryMarket.router.ts).
export const ventureMembers = pgTable("venture_members", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull().references(() => ventures.id),
  userId: integer("userId").notNull().references(() => users.id),
  role: text("role").default("editor").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  ventureUserUnique: unique("venture_members_venture_user_unique").on(t.ventureId, t.userId),
}));

export type VentureMember = typeof ventureMembers.$inferSelect;
export type InsertVentureMember = typeof ventureMembers.$inferInsert;

// -- Milestones ----------------------------------------------------------------
export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  completed: boolean("completed").default(false),
  targetDate: varchar("targetDate", { length: 32 }),
  completedAt: timestamp("completedAt"),
   sortOrder: integer("sortOrder").default(0),
  offeringId: varchar("offeringId", { length: 36 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = typeof milestones.$inferInsert;

// -- Risks ---------------------------------------------------------------------
export const risks = pgTable("risks", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  domain: varchar("domain", { length: 64 }).notNull(),
  level: text("level").default("Medium"),
   mitigation: text("mitigation"),
  offeringId: varchar("offeringId", { length: 36 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Risk = typeof risks.$inferSelect;
export type InsertRisk = typeof risks.$inferInsert;

// -- Venture Scores (history) --------------------------------------------------
export const ventureScores = pgTable("venture_scores", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  vrl: integer("vrl").notNull(),
  vrlPercent: integer("vrlPercent").notNull(),
  trl: integer("trl").notNull(),
  trlPercent: integer("trlPercent").notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  notes: text("notes"),
  // -- Human review gate (see server/_core/trpc.ts reviewedScoreProcedure) ----
  // AI-generated scores must not be persisted without a human reviewer.
  // The reviewedScoreProcedure middleware blocks writes where aiGenerated=true
  // but humanReviewedBy / humanReviewedAt are absent.
  humanReviewedBy: varchar("humanReviewedBy", { length: 255 }),
  humanReviewedAt: timestamp("humanReviewedAt"),
  aiGenerated: boolean("aiGenerated").default(false),
});

export type VentureScore = typeof ventureScores.$inferSelect;
export type InsertVentureScore = typeof ventureScores.$inferInsert;

// -- Founders ------------------------------------------------------------------
export const founders = pgTable("founders", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  role: varchar("role", { length: 128 }),
  background: text("background"),
  domainExpertiseScore: integer("domainExpertiseScore").default(0), // 0-10
  experienceScore: integer("experienceScore").default(0),           // 0-10
  commitmentScore: integer("commitmentScore").default(0),           // 0-10
  equityPct: doublePrecision("equityPct").default(0),
  esopAllocated: boolean("esopAllocated").default(false),
  linkedIn: varchar("linkedIn", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Founder = typeof founders.$inferSelect;
export type InsertFounder = typeof founders.$inferInsert;

// -- Opportunities (pipeline) --------------------------------------------------
export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  problemStatement: text("problemStatement"),
  sector: varchar("sector", { length: 128 }),
  marketSizeScore: integer("marketSizeScore").default(0),     // 0-10
  strategicFitScore: integer("strategicFitScore").default(0), // 0-10
  esgAlignmentScore: integer("esgAlignmentScore").default(0), // 0-10
  founderAvailScore: integer("founderAvailScore").default(0), // 0-10
  totalScore: integer("totalScore").default(0),               // computed sum
  status: text("status").default("Identified"),
  convertedToVentureId: varchar("convertedToVentureId", { length: 64 }),
  submittedBy: varchar("submittedBy", { length: 128 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = typeof opportunities.$inferInsert;

// -- Experiments (TRL evidence log) -------------------------------------------
export const experiments = pgTable("experiments", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  hypothesis: text("hypothesis"),
  method: text("method"),
  result: text("result"),
  outcome: text("outcome").default("Pending"),
  // ── Step-3 enforcement fields ──────────────────────────────────────────────
  // confidence_level: 1-10 integer, mandatory. Router blocks NULL/missing.
  confidenceLevel: integer("confidenceLevel").default(5).notNull(),
  // evidence_uri: required when outcome is validated/Pass (router warns if absent)
  evidenceUri: text("evidenceUri"),
  // opportunityId: optional FK to opportunities.id — used to mark assumption as
  // invalidated when the experiment outcome is "invalidated" or "Fail"
  opportunityId: integer("opportunityId"),
  // ── end Step-3 enforcement fields ─────────────────────────────────────────
  trlLevelJustified: integer("trlLevelJustified"),  // TRL level this experiment supports
  offeringId: varchar("offeringId", { length: 36 }),
  conductedAt: timestamp("conductedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Experiment = typeof experiments.$inferSelect;;
export type InsertExperiment = typeof experiments.$inferInsert;

// -- Customer Interviews -------------------------------------------------------
export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  intervieweeName: varchar("intervieweeName", { length: 128 }),
  intervieweeRole: varchar("intervieweeRole", { length: 128 }),
  intervieweeOrg: varchar("intervieweeOrg", { length: 128 }),
  date: varchar("date", { length: 32 }),
  channel: text("channel").default("Video"),
  keyInsights: text("keyInsights"),
  painPoints: text("painPoints"),
  validationSignals: text("validationSignals"),
  aiSummary: text("aiSummary"),          // populated by LLM summarisation
  rawTranscript: text("rawTranscript"),  // optional paste of full transcript
  vrlStageRelevant: integer("vrlStageRelevant"), // which VRL stage this validates
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = typeof interviews.$inferInsert;

// -- Financial Snapshots -------------------------------------------------------
export const financialSnapshots = pgTable("financial_snapshots", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // "2026-03"
  revenueActual: integer("revenueActual").default(0),
  revenueTarget: integer("revenueTarget").default(0),
  monthlyBurn: integer("monthlyBurn").default(0),
  cashRunway: integer("cashRunway").default(0),         // months
  investmentRaised: integer("investmentRaised").default(0),
  investmentTarget: integer("investmentTarget").default(0),
  notes: text("notes"),
  // -- Literature Audit: Lean Startup - Rec. 7 & 9 (Engine of Growth + Innovation Accounting) --
  // Sticky engine metrics
  churnRate: doublePrecision("churnRate"),              // % of customers lost per month
  retentionRate: doublePrecision("retentionRate"),       // % of customers retained per month
  // Viral engine metrics
  viralCoefficient: doublePrecision("viralCoefficient"), // avg new users each existing user generates
  referralRate: doublePrecision("referralRate"),          // % of customers who refer others
  // Paid engine metrics
  customerAcquisitionCost: integer("customerAcquisitionCost"), // CAC in currency units
  customerLifetimeValue: integer("customerLifetimeValue"),     // LTV in currency units
  ltvCacRatio: doublePrecision("ltvCacRatio"),           // LTV / CAC ratio (target >= 3)
  // Innovation accounting baseline (Rec. 9)
  baselineRevenueTarget: integer("baselineRevenueTarget"), // MVP-stage revenue model target
  isBaseline: boolean("isBaseline").default(false),    // marks the initial MVP baseline snapshot
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FinancialSnapshot = typeof financialSnapshots.$inferSelect;
export type InsertFinancialSnapshot = typeof financialSnapshots.$inferInsert;

// -- Contract Documents --------------------------------------------------------
export const contractDocuments = pgTable("contract_documents", {
  id: serial("id").primaryKey(),
  contractId: varchar("contractId", { length: 64 }).notNull(),
  contractTitle: varchar("contractTitle", { length: 255 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  fileSizeBytes: integer("fileSizeBytes").notNull(),
  uploadedBy: varchar("uploadedBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContractDocument = typeof contractDocuments.$inferSelect;
export type InsertContractDocument = typeof contractDocuments.$inferInsert;

// -- Research Papers -----------------------------------------------------------
export const researchPapers = pgTable("research_papers", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  authors: text("authors").notNull(),               // comma-separated author names
  journal: varchar("journal", { length: 255 }),
  year: integer("year"),
  doi: varchar("doi", { length: 255 }),
  url: text("url"),
  abstract: text("abstract"),
  keywords: text("keywords"),                        // comma-separated
  category: text("category").default("Other"),
  evidenceType: text("evidenceType").default("Peer Reviewed"),
  relevanceScore: integer("relevanceScore").default(5),  // 1-10
  ventureIds: text("ventureIds"),                    // comma-separated venture IDs this paper supports
  trlLevelsSupported: text("trlLevelsSupported"),    // comma-separated TRL levels e.g. "3,4,5"
  vrlStagesSupported: text("vrlStagesSupported"),    // comma-separated VRL stages e.g. "1,2"
  notes: text("notes"),
  addedBy: varchar("addedBy", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ResearchPaper = typeof researchPapers.$inferSelect;
export type InsertResearchPaper = typeof researchPapers.$inferInsert;

// -- Fellow Researchers --------------------------------------------------------
export const fellowResearchers = pgTable("fellow_researchers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  title: varchar("title", { length: 255 }),          // academic title / role
  institution: varchar("institution", { length: 255 }),
  department: varchar("department", { length: 255 }),
  specialisation: text("specialisation"),
  email: varchar("email", { length: 320 }),
  linkedIn: varchar("linkedIn", { length: 255 }),
  orcid: varchar("orcid", { length: 64 }),           // ORCID researcher ID
  collaborationType: text("collaborationType").default("Academic Advisor"),
  status: text("status").default("Active"),
  ventureIds: text("ventureIds"),                    // ventures they support
  bio: text("bio"),
  publications: integer("publications").default(0),      // count of relevant publications
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FellowResearcher = typeof fellowResearchers.$inferSelect;
export type InsertFellowResearcher = typeof fellowResearchers.$inferInsert;

// -- University Partnerships ---------------------------------------------------
export const universityPartnerships = pgTable("university_partnerships", {
  id: serial("id").primaryKey(),
  universityName: varchar("universityName", { length: 255 }).notNull(),
  country: varchar("country", { length: 128 }),
  department: varchar("department", { length: 255 }),
  contactName: varchar("contactName", { length: 128 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  partnershipType: text("partnershipType").default("Research Collaboration"),
  status: text("status").default("Prospective"),
  startDate: varchar("startDate", { length: 32 }),
  endDate: varchar("endDate", { length: 32 }),
  description: text("description"),
  ventureIds: text("ventureIds"),
  fundingLinked: boolean("fundingLinked").default(false),
  fundingAmount: integer("fundingAmount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UniversityPartnership = typeof universityPartnerships.$inferSelect;
export type InsertUniversityPartnership = typeof universityPartnerships.$inferInsert;

// -- Evidence Claims -----------------------------------------------------------
// Links research papers to specific VRL/TRL claims for a venture
export const evidenceClaims = pgTable("evidence_claims", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  paperId: integer("paperId"),                           // FK to research_papers
  claimText: text("claimText").notNull(),            // the specific claim being evidenced
  claimType: text("claimType").default("Market Validation"),
  trlLevel: integer("trlLevel"),                         // TRL level this claim supports
  vrlStage: integer("vrlStage"),                         // VRL stage this claim supports
  strength: text("strength").default("Moderate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EvidenceClaim = typeof evidenceClaims.$inferSelect;
export type InsertEvidenceClaim = typeof evidenceClaims.$inferInsert;

// -- Market Analysis -----------------------------------------------------------
// Stores market size estimates and TAM/SAM/SOM data per venture
export const marketAnalysis = pgTable("market_analysis", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  marketName: varchar("marketName", { length: 255 }).notNull(),   // e.g. "Global Eco-Materials Market"
  geography: varchar("geography", { length: 128 }).default("Global"),
  tamValue: integer("tamValue").default(0),           // Total Addressable Market (-M)
  samValue: integer("samValue").default(0),           // Serviceable Addressable Market (-M)
  somValue: integer("somValue").default(0),           // Serviceable Obtainable Market (-M)
  tamUnit: varchar("tamUnit", { length: 32 }).default("-M"),
  cagr: doublePrecision("cagr").default(0),                 // Compound Annual Growth Rate (%)
  marketYear: integer("marketYear").default(2025),    // base year for the estimate
  forecastYear: integer("forecastYear").default(2030),
  sourceUrl: text("sourceUrl"),
  sourceName: varchar("sourceName", { length: 255 }),
  keyDrivers: text("keyDrivers"),                 // comma-separated growth drivers
  keyBarriers: text("keyBarriers"),               // comma-separated barriers
  notes: text("notes"),
  aiGenerated: boolean("aiGenerated").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type MarketAnalysis = typeof marketAnalysis.$inferSelect;
export type InsertMarketAnalysis = typeof marketAnalysis.$inferInsert;

// -- Competitors ---------------------------------------------------------------
export const competitors = pgTable("competitors", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  website: varchar("website", { length: 512 }),
  hq: varchar("hq", { length: 128 }),             // headquarters location
  founded: integer("founded"),                          // year founded
  stage: text("stage").default("Unknown"),
  competitorType: text("competitorType").default("Direct"),
  productDescription: text("productDescription"),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  differentiator: text("differentiator"),          // how our venture differs
  revenueEstimate: varchar("revenueEstimate", { length: 64 }), // e.g. "-5M--20M"
  fundingRaised: varchar("fundingRaised", { length: 64 }),
  threatLevel: text("threatLevel").default("Medium"),
  notes: text("notes"),
  aiGenerated: boolean("aiGenerated").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Competitor = typeof competitors.$inferSelect;
export type InsertCompetitor = typeof competitors.$inferInsert;

// -- Opportunity Research Reports ----------------------------------------------
// AI-generated research reports triggered from an opportunity's problem statement
export const opportunityReports = pgTable("opportunity_reports", {
  id: serial("id").primaryKey(),
  opportunityId: integer("opportunityId").notNull(),   // FK to opportunities
  title: varchar("title", { length: 512 }).notNull(),
  problemStatement: text("problemStatement").notNull(),
  reportContent: text("reportContent"),            // full markdown report from LLM
  marketSizeSummary: text("marketSizeSummary"),    // extracted market size section
  competitorSummary: text("competitorSummary"),    // extracted competitor section
  keyInsights: text("keyInsights"),                // bullet-point insights
  recommendedAction: text("recommendedAction").default("Investigate Further"),
  confidenceScore: integer("confidenceScore").default(5), // 1-10 AI confidence
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OpportunityReport = typeof opportunityReports.$inferSelect;
export type InsertOpportunityReport = typeof opportunityReports.$inferInsert;

// -- FMEA Engineering Risk Register --------------------------------------------
// Failure Mode & Effects Analysis risks linked to a venture and optional TRL stage
export const engineeringRisks = pgTable("engineering_risks", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  relatedTrlStage: integer("relatedTrlStage"),                      // Optional: TRL level 1-9
  componentName: varchar("componentName", { length: 255 }).notNull(),
  failureMode: text("failureMode").notNull(),
  failureEffect: text("failureEffect").notNull(),
  severity: integer("severity").notNull().default(5),               // 1-10
  occurrence: integer("occurrence").notNull().default(5),           // 1-10
  detection: integer("detection").notNull().default(5),             // 1-10
  initialRpn: integer("initialRpn").notNull().default(125),         // Auto: S * O * D
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type EngineeringRisk = typeof engineeringRisks.$inferSelect;
export type InsertEngineeringRisk = typeof engineeringRisks.$inferInsert;

// -- FMEA Mitigation Actions ----------------------------------------------------
// Mitigation actions linked to an engineering risk with revised RPN scores
export const mitigationActions = pgTable("mitigation_actions", {
  id: serial("id").primaryKey(),
  riskId: integer("riskId").notNull(),                              // FK to engineering_risks
  actionDescription: text("actionDescription").notNull(),
  owner: varchar("owner", { length: 128 }),
  status: text("status").default("Identified").notNull(),
  revisedSeverity: integer("revisedSeverity").default(5),           // 1-10
  revisedOccurrence: integer("revisedOccurrence").default(5),       // 1-10
  revisedDetection: integer("revisedDetection").default(5),         // 1-10
  revisedRpn: integer("revisedRpn").default(125),                   // Auto: rS * rO * rD
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type MitigationAction = typeof mitigationActions.$inferSelect;
export type InsertMitigationAction = typeof mitigationActions.$inferInsert;

// -- Academic Papers ------------------------------------------------------------
// Stores peer-reviewed papers retrieved from Semantic Scholar / Crossref
export const academicPapers = pgTable("academic_papers", {
  id: serial("id").primaryKey(),
  externalId: varchar("externalId", { length: 255 }).notNull().unique(), // DOI or Semantic Scholar paperId
  title: varchar("title", { length: 512 }).notNull(),
  authors: text("authors").notNull(),                // JSON array of author name strings
  abstract: text("abstract"),
  url: varchar("url", { length: 512 }),
  citationCount: integer("citationCount").default(0).notNull(),
  publishedYear: integer("publishedYear"),
  source: varchar("source", { length: 64 }).default("semantic_scholar"), // 'semantic_scholar' | 'crossref'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AcademicPaper = typeof academicPapers.$inferSelect;
export type InsertAcademicPaper = typeof academicPapers.$inferInsert;

// -- Task Paper Links (join table) ---------------------------------------------
// Links an engineering task (experiment) to an academic paper
export const taskPaperLinks = pgTable("task_paper_links", {
  id: serial("id").primaryKey(),
  taskId: integer("taskId").notNull(),                   // FK to experiments.id
  paperId: integer("paperId").notNull(),                 // FK to academic_papers.id
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  relevanceScore: doublePrecision("relevanceScore"),           // Optional: returned by search API
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TaskPaperLink = typeof taskPaperLinks.$inferSelect;
export type InsertTaskPaperLink = typeof taskPaperLinks.$inferInsert;

// -- Venture Risks (Business & Technical Risk Register) ------------------------
// Tracks 6-category risk register with Likelihood - Impact scoring and VRL linkage
export const ventureRisks = pgTable("venture_risks", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  riskCategory: text("riskCategory").notNull(),
  riskTitle: varchar("riskTitle", { length: 255 }).notNull(),
  riskDescription: text("riskDescription"),
  likelihood: integer("likelihood").notNull().default(3),   // 1-5
  impact: integer("impact").notNull().default(3),           // 1-5
  riskScore: integer("riskScore").notNull().default(9),     // likelihood - impact (auto-calculated)
  riskLevel: text("riskLevel").notNull().default("Medium"),
  vrlStageImpacted: integer("vrlStageImpacted"),            // 1-6 VRL stage this risk blocks
  mitigationPlan: text("mitigationPlan"),
  riskOwner: varchar("riskOwner", { length: 128 }),
  status: text("status").default("Open"),
  reviewDate: timestamp("reviewDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type VentureRisk = typeof ventureRisks.$inferSelect;
export type InsertVentureRisk = typeof ventureRisks.$inferInsert;

// -- BRL Tasks (Business Readiness Level - 100 Tasks Method) -------------------
// Seed table: defines all 100 BRL tasks. Completions are per-venture.
export const brlTasks = pgTable("brl_tasks", {
  id: serial("id").primaryKey(),
  taskNumber: integer("taskNumber").notNull().unique(), // 1-100
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  category: text("category").notNull(),
  vrlStage: integer("vrlStage").notNull(), // 1=Idea, 2=Validation, 3=MVP/Kick-off, 4=Scale
  platformScope: text("platformScope").notNull().default("Fundamentals"),
  linkedModule: varchar("linkedModule", { length: 128 }), // e.g. "brand", "legal", "academic"
  weight: doublePrecision("weight").notNull().default(1.0), // contribution to BRL score
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BrlTask = typeof brlTasks.$inferSelect;
export type InsertBrlTask = typeof brlTasks.$inferInsert;

// -- BRL Task Completions (per-venture progress) -------------------------------
export const brlTaskCompletions = pgTable("brl_task_completions", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  taskId: integer("taskId").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completedAt"),
  completedBy: varchar("completedBy", { length: 128 }),
  notes: text("notes"),
  evidenceUrl: varchar("evidenceUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type BrlTaskCompletion = typeof brlTaskCompletions.$inferSelect;
export type InsertBrlTaskCompletion = typeof brlTaskCompletions.$inferInsert;

// -- VRL Scoring Parameters (per-venture formula inputs) ----------------------
// Stores the configurable inputs for the VRL formula:
// VRL = (- - TRL + - - BRL) - (1 - Risk Index) - Confidence Score
export const vrlScoringParams = pgTable("vrl_scoring_params", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull().unique(),
  // Weighting factors (must sum to 1.0)
  alphaWeight: doublePrecision("alphaWeight").notNull().default(0.45), // TRL weight
  betaWeight: doublePrecision("betaWeight").notNull().default(0.55),   // BRL weight
  // Confidence Score (0.2-1.0) based on validation evidence strength
  confidenceScore: doublePrecision("confidenceScore").notNull().default(0.5),
  confidenceRationale: text("confidenceRationale"),
  // Computed outputs (cached, recalculated on demand)
  computedVrlScore: doublePrecision("computedVrlScore"),       // raw VRL score (0-9)
  computedVrlLevel: integer("computedVrlLevel"),         // rounded VRL level (1-9)
  lastCalculatedAt: timestamp("lastCalculatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type VrlScoringParams = typeof vrlScoringParams.$inferSelect;
export type InsertVrlScoringParams = typeof vrlScoringParams.$inferInsert;

// --------------------------------------------------------------------------------
// -  LITERATURE AUDIT ADDITIONS - TIER 2                                        -
// -  The Lean Startup (Ries, 2011) + The Innovator's Dilemma (Christensen, 1997)-
// --------------------------------------------------------------------------------

// -- Pivot Decision Log (Lean Startup - Rec. 1) -------------------------------
// Records every structured pivot-or-persevere decision with full evidence trail.
// Ries: "A pivot is a structured course correction designed to test a new
// fundamental hypothesis about the product, business model, and engine of growth."
export const pivotDecisions = pgTable("pivot_decisions", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  // Decision metadata
  decisionDate: timestamp("decisionDate").notNull(),
  decision: text("decision").notNull(),
  // Ries's ten pivot types
  pivotType: text("pivotType"),
  // Hypothesis being tested at time of decision
  hypothesisTested: text("hypothesisTested").notNull(),
  // Evidence reviewed (narrative + linked counts)
  evidenceSummary: text("evidenceSummary"),
  experimentsPassed: integer("experimentsPassed").default(0),
  experimentsFailed: integer("experimentsFailed").default(0),
  interviewsReviewed: integer("interviewsReviewed").default(0),
  // VRL score at time of decision (snapshot)
  vrlScoreAtDecision: doublePrecision("vrlScoreAtDecision"),
  // Outcome of the decision
  newHypothesis: text("newHypothesis"),  // what will be tested next
  rationale: text("rationale"),
  decidedBy: varchar("decidedBy", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type PivotDecision = typeof pivotDecisions.$inferSelect;
export type InsertPivotDecision = typeof pivotDecisions.$inferInsert;

// -- Pivot Trigger Configuration (Lean Startup - Rec. 2) ----------------------
// Per-venture thresholds that generate a "pivot signal" alert when crossed.
// Operationalises Ries's "runway is the number of pivots it can still make."
export const pivotTriggerConfig = pgTable("pivot_trigger_config", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull().unique(),
  // Thresholds - alert fires when ALL active conditions are met
  minExperimentPassRatePct: doublePrecision("minExperimentPassRatePct").default(30), // alert if pass rate < this
  maxRiskIndexPct: doublePrecision("maxRiskIndexPct").default(60),                   // alert if risk index > this
  minVrlScore: doublePrecision("minVrlScore").default(2.0),                          // alert if VRL score < this
  stagnationPeriodDays: integer("stagnationPeriodDays").default(60),           // alert if no VRL progress for N days
  // Alert state
  alertActive: boolean("alertActive").default(false),
  alertTriggeredAt: timestamp("alertTriggeredAt"),
  alertDismissedAt: timestamp("alertDismissedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type PivotTriggerConfig = typeof pivotTriggerConfig.$inferSelect;
export type InsertPivotTriggerConfig = typeof pivotTriggerConfig.$inferInsert;

// -- Value Network Mapping (Innovator's Dilemma - Rec. 6) ---------------------
// Captures the value network context for each venture per Christensen's framework.
// "A value network is the context within which a firm identifies and responds to
// customers' needs, solves problems, procures input, reacts to competitors,
// and strives for profit."
export const valueNetworks = pgTable("value_networks", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull().unique(),
  // Primary customer segment
  primaryCustomerSegment: text("primaryCustomerSegment"),
  customerPerformanceMetrics: text("customerPerformanceMetrics"), // what customers measure success by
  // Cost structure
  targetGrossMarginPct: doublePrecision("targetGrossMarginPct"),  // % gross margin required to be viable
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type ValueNetwork = typeof valueNetworks.$inferSelect;
export type InsertValueNetwork = typeof valueNetworks.$inferInsert;

// -- Hypothesis-Linked Onboarding Tasks (Lean Startup - Rec. 13) --------------
// Extends the onboarding wizard so each task is linked to a specific hypothesis
// and a validation criterion, transforming the checklist into a validated
// learning record. Ries: "the number of interviews is a vanity metric; what
// matters is the number of validated hypotheses."
export const onboardingHypotheses = pgTable("onboarding_hypotheses", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  // Onboarding task reference (maps to the wizard step)
  onboardingStep: integer("onboardingStep").notNull(),  // 1-4 (wizard steps)
  taskLabel: varchar("taskLabel", { length: 255 }).notNull(),
  // Hypothesis structure (Lean Startup scientific method)
  hypothesis: text("hypothesis").notNull(),          // "We believe that X..."
  validationCriterion: text("validationCriterion").notNull(), // "We will know this is true when..."
  minimumSampleSize: integer("minimumSampleSize"),        // e.g. minimum 20 interviews
  // Outcome
  outcome: text("outcome").default("Pending"),
  evidenceSummary: text("evidenceSummary"),
  validatedAt: timestamp("validatedAt"),
  // Links to experiments/interviews that provide evidence
  linkedExperimentIds: text("linkedExperimentIds"),  // JSON array of experiment IDs
  linkedInterviewIds: text("linkedInterviewIds"),    // JSON array of interview IDs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type OnboardingHypothesis = typeof onboardingHypotheses.$inferSelect;
export type InsertOnboardingHypothesis = typeof onboardingHypotheses.$inferInsert;

// --------------------------------------------------------------------------------
// -  LITERATURE AUDIT ADDITIONS - TIER 3                                        -
// --------------------------------------------------------------------------------

// -- Disruptive Opportunity Scoring (Innovator's Dilemma - Rec. 11 & 12) -------
// Extends the Opportunity Pipeline with a Disruption Potential score that
// inverts standard criteria. Christensen: "the most dangerous competitive threats
// come from opportunities that score poorly on standard criteria."
export const opportunityDisruptionScores = pgTable("opportunity_disruption_scores", {
  id: serial("id").primaryKey(),
  opportunityId: integer("opportunityId").notNull().unique(),
  // Disruption Potential scoring (inverted criteria - high score = more disruptive)
  // Each dimension scored 0-10
  initialMarketSmallness: integer("initialMarketSmallness").default(0),
    // 10 = very small/niche market (disruptive signal); 0 = large established market
  nonConsumerTargeting: integer("nonConsumerTargeting").default(0),
    // 10 = targets non-consumers or underserved; 0 = targets mainstream customers
  simplicityScore: integer("simplicityScore").default(0),
    // 10 = simpler/more convenient than incumbents; 0 = more complex
  lowMarginViability: integer("lowMarginViability").default(0),
    // 10 = viable at low margins (disruptive); 0 = requires high margins
  incumbentIgnoreScore: integer("incumbentIgnoreScore").default(0),
    // 10 = incumbents would rationally ignore this; 0 = incumbents would respond immediately
  // Computed total (sum of above, max 50)
  disruptionPotentialScore: integer("disruptionPotentialScore").default(0),
  // Value network fit assessment (Rec. 12)
  requiresDifferentCostStructure: boolean("requiresDifferentCostStructure").default(false),
  requiresDifferentChannel: boolean("requiresDifferentChannel").default(false),
  requiresDifferentCustomerRelationship: boolean("requiresDifferentCustomerRelationship").default(false),
  // If any above are true, flag for autonomous team recommendation
  autonomousTeamFlagged: boolean("autonomousTeamFlagged").default(false),
  assessmentNotes: text("assessmentNotes"),
  assessedBy: varchar("assessedBy", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type OpportunityDisruptionScore = typeof opportunityDisruptionScores.$inferSelect;
export type InsertOpportunityDisruptionScore = typeof opportunityDisruptionScores.$inferInsert;

// -- Organisational Autonomy Health Check (Innovator's Dilemma - Rec. 14) -----
// Assesses whether disruptive ventures have the organisational autonomy required
// to succeed. Christensen: "disruptive ventures fail when managed within the same
// organisational structure as sustaining ventures."
// Only relevant for ventures classified as Disruptive-NewMarket or Disruptive-LowEnd.
export const autonomyHealthChecks = pgTable("autonomy_health_checks", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  assessmentDate: timestamp("assessmentDate").notNull(),
  // Four autonomy dimensions (each scored 0-10)
  budgetProtectionScore: integer("budgetProtectionScore").default(0),
    // 10 = budget fully ring-fenced; 0 = subject to portfolio reallocation
  decisionAutonomyScore: integer("decisionAutonomyScore").default(0),
    // 10 = team makes all product/GTM decisions independently; 0 = requires approval
  metricsAppropriatenessScore: integer("metricsAppropriatenessScore").default(0),
    // 10 = measured on stage-appropriate small wins; 0 = measured against portfolio scale
  valueNetworkEmbeddingScore: integer("valueNetworkEmbeddingScore").default(0),
    // 10 = embedded in target customers' value network; 0 = serving existing portfolio customers
  // Computed total (sum of above, max 40)
  totalAutonomyScore: integer("totalAutonomyScore").default(0),
  // Autonomy level classification
  autonomyLevel: text("autonomyLevel").default("Critical"),
  // Narrative assessment
  budgetNotes: text("budgetNotes"),
  decisionNotes: text("decisionNotes"),
  metricsNotes: text("metricsNotes"),
  valueNetworkNotes: text("valueNetworkNotes"),
  recommendedActions: text("recommendedActions"),
  assessedBy: varchar("assessedBy", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type AutonomyHealthCheck = typeof autonomyHealthChecks.$inferSelect;
export type InsertAutonomyHealthCheck = typeof autonomyHealthChecks.$inferInsert;

// -- Technology Trajectory Snapshots (Innovator's Dilemma - Rec. 15) ----------
// Records periodic TRL trajectory data points for plotting against market
// performance thresholds. Christensen: reveals when a disruptive technology is
// about to intersect with mainstream market requirements.
// Note: venture_scores already records historical TRL. This table adds the
// market threshold context needed for trajectory analysis.
export const technologyTrajectories = pgTable("technology_trajectories", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  // Market performance threshold (configurable per venture)
  // The TRL level at which the technology meets mainstream market requirements
  mainStreamMarketTrlThreshold: integer("mainStreamMarketTrlThreshold").default(7),
  lowEndMarketTrlThreshold: integer("lowEndMarketTrlThreshold").default(4),
  // Projected trajectory (simple linear extrapolation inputs)
  currentTrl: integer("currentTrl").notNull(),
  trlGrowthRatePerQuarter: doublePrecision("trlGrowthRatePerQuarter"), // avg TRL levels gained per quarter
  // Market entry window calculation
  quartersToMainstreamEntry: doublePrecision("quartersToMainstreamEntry"), // computed: (threshold - current) / rate
  quartersToLowEndEntry: doublePrecision("quartersToLowEndEntry"),
  // Alert: when entry window < alertHorizonQuarters, generate "market entry window" alert
  alertHorizonQuarters: integer("alertHorizonQuarters").default(4),
  marketEntryAlertActive: boolean("marketEntryAlertActive").default(false),
  // Snapshot date
  snapshotDate: timestamp("snapshotDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TechnologyTrajectory = typeof technologyTrajectories.$inferSelect;
export type InsertTechnologyTrajectory = typeof technologyTrajectories.$inferInsert;

// -- Cohort Analysis Snapshots (Lean Startup - Rec. 4) ------------------------
// Groups ventures by founding quarter and tracks VRL progression over time.
// Ries: "use cohort analysis rather than cumulative totals to reveal whether
// the portfolio's readiness methodology is improving across successive cohorts."
export const cohortSnapshots = pgTable("cohort_snapshots", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  // Cohort identifier (founding quarter, e.g. "2024-Q1")
  foundingCohort: varchar("foundingCohort", { length: 8 }).notNull(),
  // Snapshot data (taken at regular intervals)
  snapshotQuarter: varchar("snapshotQuarter", { length: 8 }).notNull(), // e.g. "2026-Q1"
  quartersElapsed: integer("quartersElapsed").notNull(),  // quarters since founding
  vrlScore: doublePrecision("vrlScore"),
  trlLevel: integer("trlLevel"),
  experimentPassRate: doublePrecision("experimentPassRate"),
  pivotCount: integer("pivotCount").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CohortSnapshot = typeof cohortSnapshots.$inferSelect;
export type InsertCohortSnapshot = typeof cohortSnapshots.$inferInsert;

// -- Pivot Runway Calculator Inputs (Lean Startup - Rec. 10) ------------------
// Stores the inputs needed to estimate how many pivots a venture can still afford.
// Ries: "a startup's runway is the number of pivots it can still make."
export const pivotRunwayInputs = pgTable("pivot_runway_inputs", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull().unique(),
  // Cash position
  currentCashBalance: integer("currentCashBalance").default(0),   // current cash in hand
  monthlyBurnRate: integer("monthlyBurnRate").default(0),          // current monthly burn
  // Pivot cost estimate
  avgPivotCostEstimate: integer("avgPivotCostEstimate").default(0), // estimated cost per pivot cycle
  avgPivotDurationWeeks: integer("avgPivotDurationWeeks").default(8), // typical weeks per pivot
  // Computed outputs (cached)
  estimatedRunwayMonths: doublePrecision("estimatedRunwayMonths"),        // currentCash / monthlyBurn
  estimatedPivotsRemaining: doublePrecision("estimatedPivotsRemaining"),  // runwayMonths / (pivotDurationWeeks/4.3)
  runwayAlertThreshold: integer("runwayAlertThreshold").default(2), // alert when pivots remaining < this
  runwayAlertActive: boolean("runwayAlertActive").default(false),
  lastCalculatedAt: timestamp("lastCalculatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type PivotRunwayInputs = typeof pivotRunwayInputs.$inferSelect;
export type InsertPivotRunwayInputs = typeof pivotRunwayInputs.$inferInsert;

// -------------------------------------------------------------------------------
// IMPACT GOVERNANCE ENGINE - IRL (Impact Readiness Level) Schema
// IRL = (ESG + LCA + PCF + CSR + Certification) / 5
// Total Venture Intelligence Score = VRL + IRL
// Brief: venture_intelligence_dashboard_update_prompt_brief.docx
// -------------------------------------------------------------------------------

// -- ESG Analytics -------------------------------------------------------------
export const esgMetrics = pgTable("esg_metrics", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull().unique(),
  // Environmental pillar (0-10 each)
  carbonEmissionsScore:       doublePrecision("carbonEmissionsScore").default(0),
  energyEfficiencyScore:      doublePrecision("energyEfficiencyScore").default(0),
  waterManagementScore:       doublePrecision("waterManagementScore").default(0),
  wasteCircularityScore:      doublePrecision("wasteCircularityScore").default(0),
  biodiversityScore:          doublePrecision("biodiversityScore").default(0),
  environmentalScore:         doublePrecision("environmentalScore").default(0),
  // Social pillar (0-10 each)
  workerWellbeingScore:       doublePrecision("workerWellbeingScore").default(0),
  diversityInclusionScore:    doublePrecision("diversityInclusionScore").default(0),
  communityEngagementScore:   doublePrecision("communityEngagementScore").default(0),
  supplyChainEthicsScore:     doublePrecision("supplyChainEthicsScore").default(0),
  socialScore:                doublePrecision("socialScore").default(0),
  // Governance pillar (0-10 each)
  boardTransparencyScore:     doublePrecision("boardTransparencyScore").default(0),
  ethicsAntiCorruptionScore:  doublePrecision("ethicsAntiCorruptionScore").default(0),
  stakeholderEngagementScore: doublePrecision("stakeholderEngagementScore").default(0),
  dataPrivacyScore:           doublePrecision("dataPrivacyScore").default(0),
  governanceScore:            doublePrecision("governanceScore").default(0),
  // Overall ESG score (0-10) - computed: (E + S + G) / 3
  esgScore:                   doublePrecision("esgScore").default(0),
  esgFrameworkUsed:           varchar("esgFrameworkUsed", { length: 128 }),
  lastReviewedAt:             timestamp("lastReviewedAt"),
  notes:                      text("notes"),
  createdAt:                  timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                  timestamp("updatedAt").defaultNow().notNull(),
});
export type EsgMetrics = typeof esgMetrics.$inferSelect;
export type InsertEsgMetrics = typeof esgMetrics.$inferInsert;

// -- Life Cycle Assessment (LCA) -----------------------------------------------
export const lcaAssessments = pgTable("lca_assessments", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  stage: text("stage").notNull(),
  climateChangeImpact:      doublePrecision("climateChangeImpact").default(0),
  acidificationImpact:      doublePrecision("acidificationImpact").default(0),
  eutrophicationImpact:     doublePrecision("eutrophicationImpact").default(0),
  waterUsageImpact:         doublePrecision("waterUsageImpact").default(0),
  landUseImpact:            doublePrecision("landUseImpact").default(0),
  resourceDepletionImpact:  doublePrecision("resourceDepletionImpact").default(0),
  assessmentMaturityScore:  doublePrecision("assessmentMaturityScore").default(0),
  improvementActions:       text("improvementActions"),
  targetReductionPercent:   doublePrecision("targetReductionPercent"),
  baselineYear:             integer("baselineYear"),
  assessedAt:               timestamp("assessedAt"),
  notes:                    text("notes"),
  createdAt:                timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                timestamp("updatedAt").defaultNow().notNull(),
});
export type LcaAssessment = typeof lcaAssessments.$inferSelect;
export type InsertLcaAssessment = typeof lcaAssessments.$inferInsert;

// -- Product Carbon Footprint (PCF) --------------------------------------------
export const pcfRecords = pgTable("pcf_records", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull().unique(),
  scope1Emissions:          doublePrecision("scope1Emissions").default(0),
  scope2Emissions:          doublePrecision("scope2Emissions").default(0),
  scope3Emissions:          doublePrecision("scope3Emissions").default(0),
  totalEmissions:           doublePrecision("totalEmissions").default(0),
  emissionIntensity:        doublePrecision("emissionIntensity"),
  baselineYear:             integer("baselineYear"),
  baselineEmissions:        doublePrecision("baselineEmissions"),
  targetYear:               integer("targetYear"),
  targetReductionPercent:   doublePrecision("targetReductionPercent"),
  netZeroCommitment:        boolean("netZeroCommitment").default(false),
  scienceBasedTarget:       boolean("scienceBasedTarget").default(false),
  offsetsUsed:              doublePrecision("offsetsUsed").default(0),
  offsetProvider:           varchar("offsetProvider", { length: 128 }),
  pcfScore:                 doublePrecision("pcfScore").default(0),
  measurementStandard:      varchar("measurementStandard", { length: 128 }),
  lastMeasuredAt:           timestamp("lastMeasuredAt"),
  notes:                    text("notes"),
  createdAt:                timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                timestamp("updatedAt").defaultNow().notNull(),
});
export type PcfRecord = typeof pcfRecords.$inferSelect;
export type InsertPcfRecord = typeof pcfRecords.$inferInsert;

// -- CSR Metrics ---------------------------------------------------------------
export const csrMetrics = pgTable("csr_metrics", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull().unique(),
  philanthropyScore:         doublePrecision("philanthropyScore").default(0),
  ethicalSourcingScore:      doublePrecision("ethicalSourcingScore").default(0),
  communityInvestmentScore:  doublePrecision("communityInvestmentScore").default(0),
  employeeVolunteeringScore: doublePrecision("employeeVolunteeringScore").default(0),
  transparencyReportingScore:doublePrecision("transparencyReportingScore").default(0),
  csrScore:                  doublePrecision("csrScore").default(0),
  csrReportPublished:        boolean("csrReportPublished").default(false),
  reportingFramework:        varchar("reportingFramework", { length: 128 }),
  sdgAlignments:             text("sdgAlignments"),
  lastReportedAt:            timestamp("lastReportedAt"),
  notes:                     text("notes"),
  createdAt:                 timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                 timestamp("updatedAt").defaultNow().notNull(),
});
export type CsrMetrics = typeof csrMetrics.$inferSelect;
export type InsertCsrMetrics = typeof csrMetrics.$inferInsert;

// -- Certification & Compliance Tracking --------------------------------------
export const certificationTracking = pgTable("certification_tracking", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  certificationName: text("certificationName").notNull(),
  status: text("status").notNull().default("Not Started"),
  progressPercent:          integer("progressPercent").default(0),
  certificationScore:       doublePrecision("certificationScore").default(0),
  targetCertificationDate:  timestamp("targetCertificationDate"),
  certificationDate:        timestamp("certificationDate"),
  expiryDate:               timestamp("expiryDate"),
  lastAuditDate:            timestamp("lastAuditDate"),
  bImpactScore:             doublePrecision("bImpactScore"),
  bImpactGovernance:        doublePrecision("bImpactGovernance"),
  bImpactWorkers:           doublePrecision("bImpactWorkers"),
  bImpactCommunity:         doublePrecision("bImpactCommunity"),
  bImpactEnvironment:       doublePrecision("bImpactEnvironment"),
  bImpactCustomers:         doublePrecision("bImpactCustomers"),
  certifyingBody:           varchar("certifyingBody", { length: 128 }),
  certificateUrl:           varchar("certificateUrl", { length: 512 }),
  notes:                    text("notes"),
  createdAt:                timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                timestamp("updatedAt").defaultNow().notNull(),
});
export type CertificationTracking = typeof certificationTracking.$inferSelect;
export type InsertCertificationTracking = typeof certificationTracking.$inferInsert;

// -- IRL Score Cache -----------------------------------------------------------
// IRL = (ESG + LCA + PCF + CSR + Certification) / 5
// Total Venture Intelligence Score = VRL + IRL (raw sum; normalise for display)
export const irlScores = pgTable("irl_scores", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull().unique(),
  esgScore:                      doublePrecision("esgScore").default(0),
  lcaScore:                      doublePrecision("lcaScore").default(0),
  pcfScore:                      doublePrecision("pcfScore").default(0),
  csrScore:                      doublePrecision("csrScore").default(0),
  certificationScore:            doublePrecision("certificationScore").default(0),
  irlScore:                      doublePrecision("irlScore").default(0),
  vrlScore:                      doublePrecision("vrlScore").default(0),
  totalVentureIntelligenceScore: doublePrecision("totalVentureIntelligenceScore").default(0),
  computedAt:                    timestamp("computedAt").defaultNow().notNull(),
  updatedAt:                     timestamp("updatedAt").defaultNow().notNull(),
});
export type IrlScore = typeof irlScores.$inferSelect;
export type InsertIrlScore = typeof irlScores.$inferInsert;

// -- Knowledge Base ------------------------------------------------------------
// Stores ingested documents (PDFs, transcripts, URLs) for RAG-style retrieval
// Uses MySQL FULLTEXT index for BM25-style keyword search
export const knowledgeDocuments = pgTable("knowledge_documents", {
  id:           serial("id").primaryKey(),
  title:        varchar("title", { length: 256 }).notNull(),
  sourceType:   text("sourceType").notNull().default("pdf"),
  sourceUrl:    varchar("sourceUrl", { length: 1024 }),
  s3Key:        varchar("s3Key", { length: 512 }),
  domain:       text("domain").notNull().default("General"),
  tags:         varchar("tags", { length: 512 }),
  author:       varchar("author", { length: 256 }),
  publishedYear: integer("publishedYear"),
  description:  text("description"),
  chunkCount:   integer("chunkCount").default(0),
  wordCount:    integer("wordCount").default(0),
  status:       text("status").notNull().default("pending"),
  errorMessage: text("errorMessage"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});
export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type InsertKnowledgeDocument = typeof knowledgeDocuments.$inferInsert;

// Each document is split into ~500-word chunks for retrieval
export const knowledgeChunks = pgTable("knowledge_chunks", {
  id:           serial("id").primaryKey(),
  documentId:   integer("documentId").notNull(),
  chunkIndex:   integer("chunkIndex").notNull(),
  content:      text("content").notNull(),
  wordCount:    integer("wordCount").default(0),
  pageNumber:   integer("pageNumber"),
  section:      varchar("section", { length: 256 }),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;
export type InsertKnowledgeChunk = typeof knowledgeChunks.$inferInsert;

// ---------------------------------------------------------------------------
// PEOPLE INTELLIGENCE MODULE
// Sprint 20 - Talent profiles, PVF scoring, team composition, gap analysis
// ---------------------------------------------------------------------------

// -- Talent Profiles ----------------------------------------------------------
export const talentProfiles = pgTable("talent_profiles", {
  id:                   serial("id").primaryKey(),
  // Identity
  name:                 varchar("name", { length: 128 }).notNull(),
  email:                varchar("email", { length: 255 }),
  linkedIn:             varchar("linkedIn", { length: 255 }),
  location:             varchar("location", { length: 128 }),
  // Role classification
  profileType:          text("profileType").notNull().default("Operator"),
  currentRole:          varchar("currentRole", { length: 128 }),
  // Availability
  availability:         text("availability").default("Immediately Available"),
  availabilityHoursPerWeek: integer("availabilityHoursPerWeek").default(0),
  // Experience
  yearsExperience:      integer("yearsExperience").default(0),
  industryExpertise:    text("industryExpertise"),       // comma-separated sectors
  previousVentures:     integer("previousVentures").default(0),
  previousExits:        integer("previousExits").default(0),
  previousLeadershipRoles: integer("previousLeadershipRoles").default(0),
  // Startup stage experience (0-10 each)
  stageIdea:            integer("stageIdea").default(0),
  stageValidation:      integer("stageValidation").default(0),
  stageBuild:           integer("stageBuild").default(0),
  stageScale:           integer("stageScale").default(0),
  // Functional capabilities (0-10 each)
  capTechnical:         integer("capTechnical").default(0),
  capCommercial:        integer("capCommercial").default(0),
  capOperational:       integer("capOperational").default(0),
  capRegulatory:        integer("capRegulatory").default(0),
  capManufacturing:     integer("capManufacturing").default(0),
  capSupplyChain:       integer("capSupplyChain").default(0),
  capFinancial:         integer("capFinancial").default(0),
  capMarketing:         integer("capMarketing").default(0),
  // Network strength (0-10 each)
  networkInvestors:     integer("networkInvestors").default(0),
  networkCustomers:     integer("networkCustomers").default(0),
  networkSuppliers:     integer("networkSuppliers").default(0),
  networkRegulators:    integer("networkRegulators").default(0),
  networkIndustry:      integer("networkIndustry").default(0),
  // Behavioural attributes (0-10 each)
  attrLeadership:       integer("attrLeadership").default(0),
  attrExecution:        integer("attrExecution").default(0),
  attrCollaboration:    integer("attrCollaboration").default(0),
  attrRiskTolerance:    integer("attrRiskTolerance").default(0),
  attrResilience:       integer("attrResilience").default(0),
  // Bio and notes
  bio:                  text("bio"),
  notes:                text("notes"),
  // Timestamps
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().notNull(),
});
export type TalentProfile = typeof talentProfiles.$inferSelect;
export type InsertTalentProfile = typeof talentProfiles.$inferInsert;

// -- Venture Role Requirements -------------------------------------------------
export const ventureRoleRequirements = pgTable("venture_role_requirements", {
  id:                   serial("id").primaryKey(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  // Role definition
  roleTitle:            varchar("roleTitle", { length: 128 }).notNull(),
  functionalArea:       text("functionalArea").notNull(),
  priority:             text("priority").default("High"),
  status:               text("status").default("Open"),
  // Requirements (0-10 minimum thresholds)
  minYearsExperience:   integer("minYearsExperience").default(0),
  minCapScore:          integer("minCapScore").default(5),
  minNetworkScore:      integer("minNetworkScore").default(3),
  minStageExperience:   text("minStageExperience").default("Validation"),
  requiredSectors:      text("requiredSectors"),         // comma-separated
  // Engagement type
  engagementType:       text("engagementType").default("Full-Time"),
  description:          text("description"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().notNull(),
});
export type VentureRoleRequirement = typeof ventureRoleRequirements.$inferSelect;
export type InsertVentureRoleRequirement = typeof ventureRoleRequirements.$inferInsert;

// -- People-Venture Fit Scores (PVF cache) -------------------------------------
export const peopleVentureFit = pgTable("people_venture_fit", {
  id:                   serial("id").primaryKey(),
  talentProfileId:      integer("talentProfileId").notNull(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  roleRequirementId:    integer("roleRequirementId"),        // optional - fit against specific role
  // PVF component scores (0-10 each)
  skillsMatch:          doublePrecision("skillsMatch").default(0),
  industryMatch:        doublePrecision("industryMatch").default(0),
  stageMatch:           doublePrecision("stageMatch").default(0),
  networkValue:         doublePrecision("networkValue").default(0),
  availabilityFit:      doublePrecision("availabilityFit").default(0),
  // Computed PVF = (skillsMatch + industryMatch + stageMatch + networkValue + availabilityFit) / 5
  pvfScore:             doublePrecision("pvfScore").default(0),    // 0-10
  // Recommendation
  recommendation:       text("recommendation").default("Possible"),
  notes:                text("notes"),
  computedAt:           timestamp("computedAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().notNull(),
});
export type PeopleVentureFit = typeof peopleVentureFit.$inferSelect;
export type InsertPeopleVentureFit = typeof peopleVentureFit.$inferInsert;

// -- Team Compositions ---------------------------------------------------------
export const teamCompositions = pgTable("team_compositions", {
  id:                   serial("id").primaryKey(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  talentProfileId:      integer("talentProfileId").notNull(),
  roleRequirementId:    integer("roleRequirementId"),
  // Assignment details
  assignedRole:         varchar("assignedRole", { length: 128 }).notNull(),
  assignmentType:       text("assignmentType").default("Recommended"),
  engagementType:       text("engagementType").default("Full-Time"),
  pvfScore:             doublePrecision("pvfScore").default(0),
  isFounder:            boolean("isFounder").default(false),
  notes:                text("notes"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().notNull(),
});
export type TeamComposition = typeof teamCompositions.$inferSelect;
export type InsertTeamComposition = typeof teamCompositions.$inferInsert;

// -- Team Gap Analysis ---------------------------------------------------------
export const teamGapAnalysis = pgTable("team_gap_analysis", {
  id:                   serial("id").primaryKey(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  // Gap definition
  gapArea:              text("gapArea").notNull(),
  severity:             text("severity").default("Medium"),
  description:          text("description"),
  // Current vs required
  currentScore:         doublePrecision("currentScore").default(0),   // 0-10 team average
  requiredScore:        doublePrecision("requiredScore").default(7),   // 0-10 threshold
  gapScore:             doublePrecision("gapScore").default(0),        // requiredScore - currentScore
  // Resolution
  status:               text("status").default("Open"),
  resolutionNotes:      text("resolutionNotes"),
  computedAt:           timestamp("computedAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().notNull(),
});
export type TeamGapAnalysis = typeof teamGapAnalysis.$inferSelect;
export type InsertTeamGapAnalysis = typeof teamGapAnalysis.$inferInsert;

// -- Founder Suitability Assessments ------------------------------------------
export const founderSuitabilityAssessments = pgTable("founder_suitability_assessments", {
  id:                   serial("id").primaryKey(),
  talentProfileId:      integer("talentProfileId").notNull(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  // Suitability dimensions (0-10 each)
  domainKnowledge:      integer("domainKnowledge").default(0),
  executionCapability:  integer("executionCapability").default(0),
  leadershipStrength:   integer("leadershipStrength").default(0),
  networkRelevance:     integer("networkRelevance").default(0),
  stageReadiness:       integer("stageReadiness").default(0),
  riskProfile:          integer("riskProfile").default(0),
  commitmentLevel:      integer("commitmentLevel").default(0),
  // Computed overall suitability score (0-10)
  overallScore:         doublePrecision("overallScore").default(0),
  // Recommendation
  recommendation:       text("recommendation").default("Conditionally Suitable"),
  readinessToExecute:   text("readinessToExecute").default("Ready in 3 Months"),
  assessmentNotes:      text("assessmentNotes"),
  assessedAt:           timestamp("assessedAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().notNull(),
});
export type FounderSuitabilityAssessment = typeof founderSuitabilityAssessments.$inferSelect;
export type InsertFounderSuitabilityAssessment = typeof founderSuitabilityAssessments.$inferInsert;


// -------------------------------------------------------------------------------
// PRODUCT OPPORTUNITY INTELLIGENCE (POI) MODULE
// Brief: POI_module_prompt_brief.docx
// POS = (Cost + Performance + Quality + Sustainability) / 4  (each 1-5)
// -------------------------------------------------------------------------------

// -- Product Categories --------------------------------------------------------
export const productCategories = pgTable("product_categories", {
  id:          serial("id").primaryKey(),
  name:        varchar("name", { length: 128 }).notNull(),
  sector:      varchar("sector", { length: 128 }),
  description: text("description"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().notNull(),
});
export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = typeof productCategories.$inferInsert;

// -- Product Opportunities -----------------------------------------------------
// Core entity: a product/technology/system being evaluated before entering VRL
export const productOpportunities = pgTable("product_opportunities", {
  id:                  serial("id").primaryKey(),
  name:                varchar("name", { length: 255 }).notNull(),
  description:         text("description"),
  categoryId:          integer("categoryId"),               // FK - product_categories
  sector:              varchar("sector", { length: 128 }),
  targetMarket:        varchar("targetMarket", { length: 255 }),
  // Lifecycle stage of the product being evaluated
  productStage:        text("productStage").default("Concept"),
  // Pipeline status
  status:              text("status").default("Identified"),
  // Link to venture if converted
  convertedToVentureId: varchar("convertedToVentureId", { length: 64 }),
  submittedBy:         varchar("submittedBy", { length: 128 }),
  notes:               text("notes"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().notNull(),
});
export type ProductOpportunity = typeof productOpportunities.$inferSelect;
export type InsertProductOpportunity = typeof productOpportunities.$inferInsert;

// -- Product Baselines ---------------------------------------------------------
// Captures the current-state benchmark for a product before gap analysis
export const productBaselines = pgTable("product_baselines", {
  id:                    serial("id").primaryKey(),
  productOpportunityId:  integer("productOpportunityId").notNull(),
  // Cost baseline
  manufacturingCost:     doublePrecision("manufacturingCost"),       // - per unit
  supplyChainCost:       doublePrecision("supplyChainCost"),
  lifecycleCost:         doublePrecision("lifecycleCost"),
  // Performance baseline
  technicalCapability:   text("technicalCapability"),
  efficiencyRating:      doublePrecision("efficiencyRating"),        // % or index
  // Quality baseline
  reliabilityScore:      doublePrecision("reliabilityScore"),        // 0-10
  durabilityYears:       doublePrecision("durabilityYears"),
  // Sustainability baseline
  carbonFootprintKg:     doublePrecision("carbonFootprintKg"),       // kg CO-e per unit
  esgComplianceLevel:    text("esgComplianceLevel").default("None"),
  circularityScore:      doublePrecision("circularityScore"),        // 0-10
  // Meta
  baselineSource:        varchar("baselineSource", { length: 255 }),
  baselineDate:          varchar("baselineDate", { length: 32 }),
  notes:                 text("notes"),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type ProductBaseline = typeof productBaselines.$inferSelect;
export type InsertProductBaseline = typeof productBaselines.$inferInsert;

// -- Cost Assessments ----------------------------------------------------------
export const costAssessments = pgTable("cost_assessments", {
  id:                    serial("id").primaryKey(),
  productOpportunityId:  integer("productOpportunityId").notNull(),
  // Dimension scores (1-5 per POI spec)
  manufacturingCostScore: integer("manufacturingCostScore").default(1),   // 1=very high cost gap, 5=minimal gap
  supplyChainCostScore:   integer("supplyChainCostScore").default(1),
  lifecycleCostScore:     integer("lifecycleCostScore").default(1),
  // Computed average (1-5)
  costScore:             doublePrecision("costScore").default(0),
  // Qualitative detail
  currentCostEstimate:   doublePrecision("currentCostEstimate"),
  targetCostEstimate:    doublePrecision("targetCostEstimate"),
  costReductionOpportunity: text("costReductionOpportunity"),
  assessedBy:            varchar("assessedBy", { length: 128 }),
  assessedAt:            timestamp("assessedAt"),
  notes:                 text("notes"),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type CostAssessment = typeof costAssessments.$inferSelect;
export type InsertCostAssessment = typeof costAssessments.$inferInsert;

// -- Performance Assessments ---------------------------------------------------
export const performanceAssessments = pgTable("performance_assessments", {
  id:                    serial("id").primaryKey(),
  productOpportunityId:  integer("productOpportunityId").notNull(),
  // Dimension scores (1-5)
  technicalCapabilityScore: integer("technicalCapabilityScore").default(1),
  efficiencyScore:          integer("efficiencyScore").default(1),
  functionalityScore:       integer("functionalityScore").default(1),
  // Computed average (1-5)
  performanceScore:      doublePrecision("performanceScore").default(0),
  // Qualitative detail
  performanceGapDescription: text("performanceGapDescription"),
  innovationOpportunity:     text("innovationOpportunity"),
  assessedBy:            varchar("assessedBy", { length: 128 }),
  assessedAt:            timestamp("assessedAt"),
  notes:                 text("notes"),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type PerformanceAssessment = typeof performanceAssessments.$inferSelect;
export type InsertPerformanceAssessment = typeof performanceAssessments.$inferInsert;

// -- Quality Assessments -------------------------------------------------------
export const qualityAssessments = pgTable("quality_assessments", {
  id:                    serial("id").primaryKey(),
  productOpportunityId:  integer("productOpportunityId").notNull(),
  // Dimension scores (1-5)
  reliabilityScore:      integer("reliabilityScore").default(1),
  durabilityScore:       integer("durabilityScore").default(1),
  userExperienceScore:   integer("userExperienceScore").default(1),
  // Computed average (1-5)
  qualityScore:          doublePrecision("qualityScore").default(0),
  // Qualitative detail
  qualityGapDescription: text("qualityGapDescription"),
  improvementOpportunity: text("improvementOpportunity"),
  assessedBy:            varchar("assessedBy", { length: 128 }),
  assessedAt:            timestamp("assessedAt"),
  notes:                 text("notes"),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type QualityAssessment = typeof qualityAssessments.$inferSelect;
export type InsertQualityAssessment = typeof qualityAssessments.$inferInsert;

// -- Sustainability Assessments ------------------------------------------------
export const sustainabilityAssessments = pgTable("sustainability_assessments", {
  id:                    serial("id").primaryKey(),
  productOpportunityId:  integer("productOpportunityId").notNull(),
  // Dimension scores (1-5)
  carbonFootprintScore:  integer("carbonFootprintScore").default(1),
  esgComplianceScore:    integer("esgComplianceScore").default(1),
  circularityScore:      integer("circularityScore").default(1),
  // Computed average (1-5)
  sustainabilityScore:   doublePrecision("sustainabilityScore").default(0),
  // Qualitative detail
  sustainabilityGapDescription: text("sustainabilityGapDescription"),
  circularityOpportunity: text("circularityOpportunity"),
  assessedBy:            varchar("assessedBy", { length: 128 }),
  assessedAt:            timestamp("assessedAt"),
  notes:                 text("notes"),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type SustainabilityAssessment = typeof sustainabilityAssessments.$inferSelect;
export type InsertSustainabilityAssessment = typeof sustainabilityAssessments.$inferInsert;

// -- Product Opportunity Scores (POS cache) ------------------------------------
// POS = (Cost + Performance + Quality + Sustainability) / 4
export const productOpportunityScores = pgTable("product_opportunity_scores", {
  id:                    serial("id").primaryKey(),
  productOpportunityId:  integer("productOpportunityId").notNull().unique(),
  costScore:             doublePrecision("costScore").default(0),           // 1-5
  performanceScore:      doublePrecision("performanceScore").default(0),    // 1-5
  qualityScore:          doublePrecision("qualityScore").default(0),        // 1-5
  sustainabilityScore:   doublePrecision("sustainabilityScore").default(0), // 1-5
  // POS = average of above four (1-5)
  posScore:              doublePrecision("posScore").default(0),
  // Classification band
  posClassification:     text("posClassification").default("Low Opportunity"),
  computedAt:            timestamp("computedAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type ProductOpportunityScore = typeof productOpportunityScores.$inferSelect;
export type InsertProductOpportunityScore = typeof productOpportunityScores.$inferInsert;

// -- Opportunity Reviews -------------------------------------------------------
// Panel review decisions on scored product opportunities
export const opportunityReviews = pgTable("opportunity_reviews", {
  id:                    serial("id").primaryKey(),
  productOpportunityId:  integer("productOpportunityId").notNull(),
  reviewerName:          varchar("reviewerName", { length: 128 }).notNull(),
  reviewerRole:          varchar("reviewerRole", { length: 128 }),
  decision:              text("decision").notNull(),
  rationale:             text("rationale"),
  conditionsForApproval: text("conditionsForApproval"),
  reviewedAt:            timestamp("reviewedAt").defaultNow().notNull(),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
});
export type OpportunityReview = typeof opportunityReviews.$inferSelect;
export type InsertOpportunityReview = typeof opportunityReviews.$inferInsert;

// -------------------------------------------------------------------------------
// VENTURE PROJECT MANAGEMENT MODULE
// Brief: project_management_module_prompt_brief.docx
// Hierarchy: Venture - Program - Phase (VRL Stage) - Workstream - Milestone - Task
// -------------------------------------------------------------------------------

// -- Venture Programs ----------------------------------------------------------
// Top-level execution container for a venture (one or more programs per venture)
export const venturePrograms = pgTable("venture_programs", {
  id:           serial("id").primaryKey(),
  ventureId:    varchar("ventureId", { length: 64 }).notNull(),
  name:         varchar("name", { length: 255 }).notNull(),
  description:  text("description"),
  status:       text("status").default("Not Started"),
  startDate:    varchar("startDate", { length: 32 }),
  targetEndDate: varchar("targetEndDate", { length: 32 }),
  actualEndDate: varchar("actualEndDate", { length: 32 }),
  programManager: varchar("programManager", { length: 128 }),
  budget:       integer("budget").default(0),                // -
  budgetSpent:  integer("budgetSpent").default(0),
  notes:        text("notes"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});
export type VentureProgram = typeof venturePrograms.$inferSelect;
export type InsertVentureProgram = typeof venturePrograms.$inferInsert;

// -- Venture Phases ------------------------------------------------------------
// Maps to a VRL stage within a program (e.g., Phase 1 = VRL Stage 1: Opportunity)
export const venturePhases = pgTable("venture_phases", {
  id:           serial("id").primaryKey(),
  programId:    integer("programId").notNull(),              // FK - venture_programs
  ventureId:    varchar("ventureId", { length: 64 }).notNull(),
  name:         varchar("name", { length: 255 }).notNull(),
  vrlStage:     integer("vrlStage"),                         // 1-4 VRL stage this phase maps to
  phaseNumber:  integer("phaseNumber").notNull(),             // sequence within program
  status:       text("status").default("Not Started"),
  startDate:    varchar("startDate", { length: 32 }),
  targetEndDate: varchar("targetEndDate", { length: 32 }),
  actualEndDate: varchar("actualEndDate", { length: 32 }),
  completionPercent: integer("completionPercent").default(0), // 0-100
  gateReviewPassed: boolean("gateReviewPassed").default(false),
  gateReviewDate:   varchar("gateReviewDate", { length: 32 }),
  gateReviewNotes:  text("gateReviewNotes"),
  notes:        text("notes"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});
export type VenturePhase = typeof venturePhases.$inferSelect;
export type InsertVenturePhase = typeof venturePhases.$inferInsert;

// -- Venture Workstreams -------------------------------------------------------
// Parallel workstreams within a phase (e.g., Technical, Commercial, Legal)
export const ventureWorkstreams = pgTable("venture_workstreams", {
  id:           serial("id").primaryKey(),
  phaseId:      integer("phaseId").notNull(),                // FK - venture_phases
  ventureId:    varchar("ventureId", { length: 64 }).notNull(),
  name:         varchar("name", { length: 255 }).notNull(),
  functionalArea: text("functionalArea").default("Other"),
  owner:        varchar("owner", { length: 128 }),
  status:       text("status").default("Not Started"),
  completionPercent: integer("completionPercent").default(0),
  startDate:    varchar("startDate", { length: 32 }),
  targetEndDate: varchar("targetEndDate", { length: 32 }),
  notes:        text("notes"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});
export type VentureWorkstream = typeof ventureWorkstreams.$inferSelect;
export type InsertVentureWorkstream = typeof ventureWorkstreams.$inferInsert;

// -- Venture Milestones (PM module) --------------------------------------------
// Formal gate milestones within a workstream (distinct from the simpler
// `milestones` table which is used for the portfolio overview cards)
export const ventureMilestones = pgTable("venture_milestones", {
  id:              serial("id").primaryKey(),
  workstreamId:    integer("workstreamId").notNull(),         // FK - venture_workstreams
  phaseId:         integer("phaseId").notNull(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  title:           varchar("title", { length: 255 }).notNull(),
  description:     text("description"),
  milestoneType:   text("milestoneType").default("Deliverable"),
  status:          text("status").default("Not Started"),
  targetDate:      varchar("targetDate", { length: 32 }),
  completedAt:     timestamp("completedAt"),
  completionEvidence: text("completionEvidence"),
  sortOrder:       integer("sortOrder").default(0),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type VentureMilestone = typeof ventureMilestones.$inferSelect;
export type InsertVentureMilestone = typeof ventureMilestones.$inferInsert;

// -- Venture Tasks -------------------------------------------------------------
// Granular tasks within a workstream (supports Kanban and Gantt views)
export const ventureTasks = pgTable("venture_tasks", {
  id:              serial("id").primaryKey(),
  workstreamId:    integer("workstreamId").notNull(),         // FK - venture_workstreams
  milestoneId:     integer("milestoneId"),                    // optional FK - venture_milestones
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  title:           varchar("title", { length: 255 }).notNull(),
  description:     text("description"),
  // Kanban status
  kanbanStatus:    text("kanbanStatus").default("Backlog"),
  priority:        text("priority").default("Medium"),
  assignee:        varchar("assignee", { length: 128 }),
  // Gantt scheduling
  startDate:       varchar("startDate", { length: 32 }),
  dueDate:         varchar("dueDate", { length: 32 }),
  completedAt:     timestamp("completedAt"),
  estimatedHours:  doublePrecision("estimatedHours").default(0),
  actualHours:     doublePrecision("actualHours").default(0),
  // Dependencies (comma-separated task IDs)
  dependsOnTaskIds: text("dependsOnTaskIds"),
  sortOrder:       integer("sortOrder").default(0),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type VentureTask = typeof ventureTasks.$inferSelect;
export type InsertVentureTask = typeof ventureTasks.$inferInsert;

// -- Venture Resources ---------------------------------------------------------
// People and budget resources allocated to programs/phases
export const ventureResources = pgTable("venture_resources", {
  id:              serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  programId:       integer("programId"),                     // FK - venture_programs
  phaseId:         integer("phaseId"),                       // FK - venture_phases (optional)
  resourceType:    text("resourceType").default("Person"),
  name:            varchar("name", { length: 128 }).notNull(),
  role:            varchar("role", { length: 128 }),
  // Allocation
  allocationPercent: integer("allocationPercent").default(100), // % of time allocated
  allocationHoursPerWeek: doublePrecision("allocationHoursPerWeek"),
  startDate:       varchar("startDate", { length: 32 }),
  endDate:         varchar("endDate", { length: 32 }),
  // Cost
  dayRate:         integer("dayRate").default(0),             // - per day
  totalBudgeted:   integer("totalBudgeted").default(0),
  totalActual:     integer("totalActual").default(0),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type VentureResource = typeof ventureResources.$inferSelect;
export type InsertVentureResource = typeof ventureResources.$inferInsert;

// -- Venture Dependencies ------------------------------------------------------
// Explicit dependency links between tasks, milestones, or phases
export const ventureDependencies = pgTable("venture_dependencies", {
  id:              serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  // Source entity (the item that must be completed first)
  sourceType:      text("sourceType").notNull(),
  sourceId:        integer("sourceId").notNull(),
  // Target entity (the item that depends on the source)
  targetType:      text("targetType").notNull(),
  targetId:        integer("targetId").notNull(),
  dependencyType:  text("dependencyType").default("Finish-to-Start"),
  lagDays:         integer("lagDays").default(0),             // delay after dependency is met
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type VentureDependency = typeof ventureDependencies.$inferSelect;
export type InsertVentureDependency = typeof ventureDependencies.$inferInsert;

// -- Venture Documents ---------------------------------------------------------
// Document repository linked to programs, phases, workstreams, or tasks
export const ventureDocuments = pgTable("venture_documents", {
  id:              serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  // Optional parent context
  programId:       integer("programId"),
  phaseId:         integer("phaseId"),
  workstreamId:    integer("workstreamId"),
  taskId:          integer("taskId"),
  milestoneId:     integer("milestoneId"),
  // Document metadata
  title:           varchar("title", { length: 255 }).notNull(),
  documentType:    text("documentType").default("Other"),
  version:         varchar("version", { length: 32 }).default("1.0"),
  status:          text("status").default("Draft"),
  // Storage
  fileName:        varchar("fileName", { length: 255 }).notNull(),
  fileKey:         varchar("fileKey", { length: 512 }).notNull(),
  fileUrl:         text("fileUrl").notNull(),
  mimeType:        varchar("mimeType", { length: 128 }),
  fileSizeBytes:   integer("fileSizeBytes").default(0),
  // Ownership
  uploadedBy:      varchar("uploadedBy", { length: 128 }),
  approvedBy:      varchar("approvedBy", { length: 128 }),
  approvedAt:      timestamp("approvedAt"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type VentureDocument = typeof ventureDocuments.$inferSelect;
export type InsertVentureDocument = typeof ventureDocuments.$inferInsert;

// -- Execution Risk Register (PM module) --------------------------------------
// Execution-level risks tied to specific programs, phases, or workstreams
// (Distinct from the portfolio-level `risks` table which tracks venture-wide risks)
export const executionRisks = pgTable("execution_risks", {
  id:              serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  programId:       integer("programId"),
  phaseId:         integer("phaseId"),
  workstreamId:    integer("workstreamId"),
  title:           varchar("title", { length: 255 }).notNull(),
  description:     text("description"),
  riskCategory:    text("riskCategory").default("Schedule"),
  likelihood:      text("likelihood").default("Medium"),
  impact:          text("impact").default("Moderate"),
  riskScore:       integer("riskScore").default(0),            // likelihood - impact (1-25)
  riskLevel:       text("riskLevel").default("Medium"),
  mitigationPlan:  text("mitigationPlan"),
  contingencyPlan: text("contingencyPlan"),
  owner:           varchar("owner", { length: 128 }),
  status:          text("status").default("Open"),
  reviewDate:      varchar("reviewDate", { length: 32 }),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type ExecutionRisk = typeof executionRisks.$inferSelect;
export type InsertExecutionRisk = typeof executionRisks.$inferInsert;

// -------------------------------------------------------------------------------
// COMMAND CENTRE DASHBOARD - AGGREGATION SUPPORT
// Brief: command_centre_dashboard_prompt_brief.docx
// Provides pre-computed summary rows for dashboard widgets to avoid
// expensive real-time aggregations across large venture portfolios.
// -------------------------------------------------------------------------------

// -- Dashboard KPI Snapshots ---------------------------------------------------
// Cached portfolio-level KPIs refreshed on a scheduled basis
export const dashboardKpiSnapshots = pgTable("dashboard_kpi_snapshots", {
  id:                       serial("id").primaryKey(),
  snapshotDate:             varchar("snapshotDate", { length: 32 }).notNull(), // "2026-03"
  // Venture ecosystem metrics
  totalVentures:            integer("totalVentures").default(0),
  activeVentures:           integer("activeVentures").default(0),
  prelaunchVentures:        integer("prelaunchVentures").default(0),
  scalingVentures:          integer("scalingVentures").default(0),
  pausedVentures:           integer("pausedVentures").default(0),
  // VRL stage distribution
  vrlStage1Count:           integer("vrlStage1Count").default(0),
  vrlStage2Count:           integer("vrlStage2Count").default(0),
  vrlStage3Count:           integer("vrlStage3Count").default(0),
  vrlStage4Count:           integer("vrlStage4Count").default(0),
  avgVrlScore:              doublePrecision("avgVrlScore").default(0),
  investmentReadyCount:     integer("investmentReadyCount").default(0),
  // Project management metrics
  activeProjects:           integer("activeProjects").default(0),
  totalMilestonesThisMonth: integer("totalMilestonesThisMonth").default(0),
  milestonesCompletedThisMonth: integer("milestonesCompletedThisMonth").default(0),
  overdueTasksCount:        integer("overdueTasksCount").default(0),
  // Opportunity pipeline metrics
  opportunitiesIdentified:  integer("opportunitiesIdentified").default(0),
  opportunitiesScored:      integer("opportunitiesScored").default(0),
  opportunitiesApproved:    integer("opportunitiesApproved").default(0),
  avgPosScore:              doublePrecision("avgPosScore").default(0),
  // Financial metrics
  totalRevenueActual:       integer("totalRevenueActual").default(0),    // - across portfolio
  totalInvestmentRaised:    integer("totalInvestmentRaised").default(0), // - across portfolio
  portfolioRoi:             doublePrecision("portfolioRoi").default(0),        // %
  // Impact / ESG metrics
  avgIrlScore:              doublePrecision("avgIrlScore").default(0),
  avgEsgScore:              doublePrecision("avgEsgScore").default(0),
  certifiedVenturesCount:   integer("certifiedVenturesCount").default(0),
  computedAt:               timestamp("computedAt").defaultNow().notNull(),
});
export type DashboardKpiSnapshot = typeof dashboardKpiSnapshots.$inferSelect;
export type InsertDashboardKpiSnapshot = typeof dashboardKpiSnapshots.$inferInsert;

// -- Venture Ecosystem Map Nodes -----------------------------------------------
// Stores positioning and metadata for the venture ecosystem map widget
export const ecosystemMapNodes = pgTable("ecosystem_map_nodes", {
  id:              serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull().unique(),
  // Visual positioning (relative coordinates 0-100)
  posX:            doublePrecision("posX").default(50),
  posY:            doublePrecision("posY").default(50),
  // Node metadata for the map
  nodeSize:        integer("nodeSize").default(40),              // pixel radius
  nodeColor:       varchar("nodeColor", { length: 32 }),
  // Relationship links (comma-separated venture IDs)
  linkedVentureIds: text("linkedVentureIds"),
  linkType:        text("linkType").default("None"),
  // Display labels
  displayLabel:    varchar("displayLabel", { length: 64 }),
  tooltipText:     text("tooltipText"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type EcosystemMapNode = typeof ecosystemMapNodes.$inferSelect;
export type InsertEcosystemMapNode = typeof ecosystemMapNodes.$inferInsert;

// -------------------------------------------------------------------------------
// MATCHING ENGINE & SPIN-OFF OS
// -------------------------------------------------------------------------------

// -- Founder Match Scores ------------------------------------------------------
// Stores computed compatibility scores between a founder (talent_profile) and
// a product opportunity (product_opportunities). Recomputed on demand or on
// new founder onboarding.
export const founderMatchScores = pgTable("founder_match_scores", {
  id:                   serial("id").primaryKey(),
  // The founder being evaluated (references talent_profiles.id)
  talentProfileId:      integer("talentProfileId").notNull(),
  // The opportunity being matched against (references product_opportunities.id)
  productOpportunityId: integer("productOpportunityId").notNull(),
  // Dimension scores (0-100 each)
  sectorAlignmentScore:     integer("sectorAlignmentScore").default(0),   // sector tag overlap
  capabilityFitScore:       integer("capabilityFitScore").default(0),     // capability vs opportunity requirements
  availabilityScore:        integer("availabilityScore").default(0),      // hours/week vs estimated demand
  pvfScore:                 integer("pvfScore").default(0),               // personal values fit (ESG/mission)
  experienceScore:          integer("experienceScore").default(0),        // years + previous ventures
  networkScore:             integer("networkScore").default(0),           // investor/customer/supplier network
  // Composite match score (weighted average, 0-100)
  overallMatchScore:        integer("overallMatchScore").default(0),
  // Recommended role for this founder on this opportunity
  recommendedRole:          varchar("recommendedRole", { length: 128 }),
  // Narrative explanation (LLM-generated)
  matchRationale:           text("matchRationale"),
  // Status of this match
  status:                   text("status").default("Suggested"),
  computedAt:               timestamp("computedAt").defaultNow().notNull(),
  updatedAt:                timestamp("updatedAt").defaultNow().notNull(),
});
export type FounderMatchScore = typeof founderMatchScores.$inferSelect;
export type InsertFounderMatchScore = typeof founderMatchScores.$inferInsert;

// -- Co-Founder Compatibility Scores ------------------------------------------
// Pairwise compatibility between two talent profiles for a given opportunity.
// Captures complementarity (different strengths) rather than similarity.
export const coFounderCompatibility = pgTable("co_founder_compatibility", {
  id:                   serial("id").primaryKey(),
  talentProfileIdA:     integer("talentProfileIdA").notNull(),
  talentProfileIdB:     integer("talentProfileIdB").notNull(),
  productOpportunityId: integer("productOpportunityId"),    // optional - context-specific
  // Complementarity dimensions (0-100)
  capabilityComplementScore: integer("capabilityComplementScore").default(0), // different strengths
  valueAlignmentScore:       integer("valueAlignmentScore").default(0),       // shared mission/values
  workingStyleScore:         integer("workingStyleScore").default(0),         // collaboration fit
  networkComplementScore:    integer("networkComplementScore").default(0),    // different networks
  // Composite
  overallCompatibilityScore: integer("overallCompatibilityScore").default(0),
  compatibilityRationale:    text("compatibilityRationale"),
  computedAt:                timestamp("computedAt").defaultNow().notNull(),
});
export type CoFounderCompatibility = typeof coFounderCompatibility.$inferSelect;
export type InsertCoFounderCompatibility = typeof coFounderCompatibility.$inferInsert;

// -- Spin-Off Configurations ---------------------------------------------------
// The "operating system" record for a new spin-off. Aggregates all inputs:
// the opportunity, the founding team, the resource plan, and the VBS support
// structure. This is the single source of truth before a venture is created.
export const spinoffConfigurations = pgTable("spinoff_configurations", {
  id:                   serial("id").primaryKey(),
  // Core linkages
  productOpportunityId: integer("productOpportunityId").notNull(),
  // Founding team (comma-separated talent_profile IDs)
  founderProfileIds:    text("founderProfileIds").notNull(),
  // Venture identity
  proposedVentureName:  varchar("proposedVentureName", { length: 128 }),
  proposedTagline:      text("proposedTagline"),
  proposedSector:       varchar("proposedSector", { length: 128 }),
  proposedChannel:      text("proposedChannel").default("B2B"),
  proposedBrandColor:   varchar("proposedBrandColor", { length: 32 }).default("#22c55e"),
  // Strategic classification
  strategicClassification: text("strategicClassification").default("Sustaining"),
  engineOfGrowth:       text("engineOfGrowth"),
  // Resource plan
  estimatedBurnRateMonthly: integer("estimatedBurnRateMonthly").default(0),  // -/month
  estimatedRunwayMonths:    integer("estimatedRunwayMonths").default(12),
  fundingAskAmount:         integer("fundingAskAmount").default(0),           // -
  nominatedCharity:         varchar("nominatedCharity", { length: 255 }),
  // VBS support
  assignedMentor:           varchar("assignedMentor", { length: 128 }),
  vbsSupportLevel:          text("vbsSupportLevel").default("Full Incubation"),
  // Workflow status
  status:                   text("status").default("Draft"),
  convertedToVentureId:     varchar("convertedToVentureId", { length: 64 }),
  // Timestamps
  createdAt:                timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                timestamp("updatedAt").defaultNow().notNull(),
});
export type SpinoffConfiguration = typeof spinoffConfigurations.$inferSelect;
export type InsertSpinoffConfiguration = typeof spinoffConfigurations.$inferInsert;

// -- Spin-Off Execution Plans --------------------------------------------------
// The auto-generated 90-day execution plan for a spin-off. Contains structured
// milestones, resource assignments, and risk flags. Generated by the LLM from
// the spinoff_configuration inputs.
export const spinoffExecutionPlans = pgTable("spinoff_execution_plans", {
  id:                   serial("id").primaryKey(),
  spinoffConfigId:      integer("spinoffConfigId").notNull(),
  // Plan metadata
  planVersion:          integer("planVersion").default(1),
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
  status:               text("status").default("Draft"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().notNull(),
});
export type SpinoffExecutionPlan = typeof spinoffExecutionPlans.$inferSelect;
export type InsertSpinoffExecutionPlan = typeof spinoffExecutionPlans.$inferInsert;

// -- Spin-Off Status History -------------------------------------------------------------------------------
// Audit trail of every status transition on a spinoff_configuration.
// Written automatically by the advanceSpinoffStatus procedure.
export const spinoffStatusHistory = pgTable("spinoff_status_history", {
  id:               serial("id").primaryKey(),
  spinoffConfigId:  integer("spinoffConfigId").notNull(),
  fromStatus:       varchar("fromStatus", { length: 64 }),
  toStatus:         varchar("toStatus", { length: 64 }).notNull(),
  reviewedBy:       varchar("reviewedBy", { length: 128 }),
  reason:           text("reason"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type SpinoffStatusHistory = typeof spinoffStatusHistory.$inferSelect;
export type InsertSpinoffStatusHistory = typeof spinoffStatusHistory.$inferInsert;

// -- Contract Architecture Layers ---------------------------------------------
// Four-layer contract architecture from the Contract Architecture Map document.
export const contractLayers = pgTable("contract_layers", {
  id:          serial("id").primaryKey(),
  layerKey:    varchar("layerKey", { length: 64 }).notNull().unique(),
  name:        varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  color:       varchar("color", { length: 16 }),
  sortOrder:   integer("sortOrder").default(0),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type ContractLayer = typeof contractLayers.$inferSelect;
export type InsertContractLayer = typeof contractLayers.$inferInsert;

// -- Contract Type Registry ----------------------------------------------------
// Full 20-contract type registry from the Commercial Contracts Matrix document.
export const contractTypeRegistry = pgTable("contract_type_registry", {
  id:           serial("id").primaryKey(),
  layerKey:     varchar("layerKey", { length: 64 }).notNull(),
  contractType: varchar("contractType", { length: 128 }).notNull(),
  useCase:      text("useCase").notNull(),
  riskLevel:    text("riskLevel").default("Medium"),
  status:       text("status").default("Draft"),
  owner:        varchar("owner", { length: 128 }),
  notes:        text("notes"),
  expiryDate:   date("expiryDate"),
  documentUrl:  text("documentUrl"),
  documentKey:  varchar("documentKey", { length: 512 }),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});
export type ContractTypeRegistry = typeof contractTypeRegistry.$inferSelect;
export type InsertContractTypeRegistry = typeof contractTypeRegistry.$inferInsert;

// -- Legal Risk Items ----------------------------------------------------------
// Legal Risk Map: key risk areas, mitigations, and high-risk zones.
export const legalRiskItems = pgTable("legal_risk_items", {
  id:              serial("id").primaryKey(),
  riskArea:        varchar("riskArea", { length: 128 }).notNull(),
  description:     text("description"),
  riskZone:        text("riskZone").default("Medium"),
  mitigation:      text("mitigation"),
  linkedLayer:     varchar("linkedLayer", { length: 64 }),
  linkedContracts: text("linkedContracts"),
  status:          text("status").default("Open"),
  owner:           varchar("owner", { length: 128 }),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type LegalRiskItem = typeof legalRiskItems.$inferSelect;
export type InsertLegalRiskItem = typeof legalRiskItems.$inferInsert;

// -- Legal Risk Escalations --------------------------------------------------------------------------------
// Audit trail for escalated legal risks.
export const legalRiskEscalations = pgTable("legal_risk_escalations", {
  id:          serial("id").primaryKey(),
  riskItemId:  integer("riskItemId").notNull(),
  escalatedBy: varchar("escalatedBy", { length: 128 }).notNull(),
  reason:      text("reason"),
  notifiedAt:  timestamp("notifiedAt").defaultNow().notNull(),
  resolvedAt:  timestamp("resolvedAt"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type LegalRiskEscalation = typeof legalRiskEscalations.$inferSelect;
export type InsertLegalRiskEscalation = typeof legalRiskEscalations.$inferInsert;

// --------------------------------------------------------------------------------
// -  DYNAMIC EQUITY ENGINE - Sprint 36                                          -
// -  Based on EcoBlend Dynamic Equity Model specification                       -
// -  Formula: Score = (0.4-VRL) + (0.3-Contribution) + (0.2-Capital) + (0.1-Perf)-
// --------------------------------------------------------------------------------

// -- Equity Rules (configurable weighting per venture) ------------------------
// Stores the formula weights for each venture's equity engine.
// Defaults match the specification: VRL 40%, Contribution 30%, Capital 20%, Performance 10%.
export const equityRules = pgTable("equity_rules", {
  id:                  serial("id").primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull().unique(),
  vrlWeight:           doublePrecision("vrlWeight").notNull().default(0.4),
  contributionWeight:  doublePrecision("contributionWeight").notNull().default(0.3),
  capitalWeight:       doublePrecision("capitalWeight").notNull().default(0.2),
  performanceWeight:   doublePrecision("performanceWeight").notNull().default(0.1),
  totalEquityPool:     doublePrecision("totalEquityPool").notNull().default(20.0), // % of venture equity in ESOP pool
  notes:               text("notes"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().notNull(),
});
export type EquityRule = typeof equityRules.$inferSelect;
export type InsertEquityRule = typeof equityRules.$inferInsert;

// -- Equity Allocations (per-member dynamic equity record) --------------------
// Tracks each team member's current equity allocation and computed dynamic score.
export const equityAllocations = pgTable("equity_allocations", {
  id:                  serial("id").primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  memberName:          varchar("memberName", { length: 128 }).notNull(),
  memberRole:          text("memberRole").default("Founder"),
  // Static equity allocation (legal)
  equityPct:           doublePrecision("equityPct").notNull().default(0),
  // Vesting schedule
  vestingMonths:       integer("vestingMonths").default(48),
  cliffMonths:         integer("cliffMonths").default(12),
  monthsIn:            integer("monthsIn").default(0),
  vestingStatus:       text("vestingStatus").default("Not Started"),
  // Dynamic equity score components (0-10 scale each)
  vrlScore:            doublePrecision("vrlScore").default(0),          // VRL contribution score
  contributionScore:   doublePrecision("contributionScore").default(0), // Task/milestone effort score
  capitalInput:        doublePrecision("capitalInput").default(0),      // Capital contributed (-k)
  performanceScore:    doublePrecision("performanceScore").default(0),  // Revenue/traction KPIs
  // Computed dynamic equity score (formula result)
  dynamicEquityScore:  doublePrecision("dynamicEquityScore").default(0), // 0-10
  dynamicEquityPct:    doublePrecision("dynamicEquityPct").default(0),   // % of pool earned
  // Stipend
  stipendStatus:       text("stipendStatus").default("Pending"),
  stipendMonthly:      doublePrecision("stipendMonthly").default(0),
  stipendMonthsTotal:  integer("stipendMonthsTotal").default(6),
  stipendMonthsUsed:   integer("stipendMonthsUsed").default(0),
  // Legal conversion status
  legallyConverted:    boolean("legallyConverted").default(false),
  conversionDate:      timestamp("conversionDate"),
  shareClass:          varchar("shareClass", { length: 64 }),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().notNull(),
});
export type EquityAllocation = typeof equityAllocations.$inferSelect;
export type InsertEquityAllocation = typeof equityAllocations.$inferInsert;

// -- Contribution Logs (event-level contribution tracking) --------------------
// Records every contribution event that feeds into the equity engine.
export const contributionLogs = pgTable("contribution_logs", {
  id:                  serial("id").primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  allocationId:        integer("allocationId").notNull(), // FK - equity_allocations.id
  memberName:          varchar("memberName", { length: 128 }).notNull(),
  contributionType:    text("contributionType").notNull(),
  description:         text("description"),
  valueScore:          doublePrecision("valueScore").notNull().default(0), // 0-10 impact score
  capitalAmount:       doublePrecision("capitalAmount").default(0),        // - if capital type
  evidenceUrl:         varchar("evidenceUrl", { length: 512 }),
  loggedAt:            timestamp("loggedAt").defaultNow().notNull(),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
});
export type ContributionLog = typeof contributionLogs.$inferSelect;
export type InsertContributionLog = typeof contributionLogs.$inferInsert;

// -- Equity Milestones (legal conversion trigger points) ----------------------
// Defines the milestones at which dynamic equity converts to legal equity.
// Per spec: End of Validation (VRL 5), Pre-Seed Funding, Series A.
export const equityMilestones = pgTable("equity_milestones", {
  id:                  serial("id").primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  milestoneName:       varchar("milestoneName", { length: 128 }).notNull(),
  milestoneType:       text("milestoneType").notNull(),
  triggerVrlLevel:     integer("triggerVrlLevel"),          // VRL level that triggers conversion
  triggerRevenueGbp:   doublePrecision("triggerRevenueGbp"),      // Revenue threshold (-)
  description:         text("description"),
  status:              text("status").default("Pending"),
  triggeredAt:         timestamp("triggeredAt"),
  legalStructure:      text("legalStructure"),          // Share class, option pool, vesting notes
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().notNull(),
});
export type EquityMilestone = typeof equityMilestones.$inferSelect;
export type InsertEquityMilestone = typeof equityMilestones.$inferInsert;

// -- Venture Cap Table Snapshots (point-in-time cap table) --------------------
// Records the cap table state at each major milestone for evolution tracking.
export const ventureCapTableSnapshots = pgTable("venture_cap_table_snapshots", {
  id:                  serial("id").primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  snapshotDate:        timestamp("snapshotDate").defaultNow().notNull(),
  triggerEvent:        varchar("triggerEvent", { length: 128 }), // e.g. "VRL 3 reached", "Pre-Seed -150k"
  // Aggregate cap table data (JSON-serialised array of {member, equityPct, dynamicScore})
  capTableJson:        text("capTableJson").notNull(),           // JSON string
  totalEquityAllocated: doublePrecision("totalEquityAllocated").default(0), // sum of all equity %
  totalDynamicScore:   doublePrecision("totalDynamicScore").default(0),    // sum of dynamic scores
  notes:               text("notes"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
});
export type VentureCapTableSnapshot = typeof ventureCapTableSnapshots.$inferSelect;
export type InsertVentureCapTableSnapshot = typeof ventureCapTableSnapshots.$inferInsert;

// -------------------------------------------------------------------------------
// IP INTELLIGENCE MODULE - Sprint 37
// Unified IP asset registry covering Patents, Trademarks, Copyrights,
// Design Rights, and Trade Secrets, plus an AI Patent Workspace.
// -------------------------------------------------------------------------------

// -- IP Assets (unified registry for all 5 IP types) -------------------------
export const ipAssets = pgTable("ip_assets", {
  id:                  serial("id").primaryKey(),
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
  estimatedValue:      doublePrecision("estimatedValue").default(0),
  trl:                 integer("trl").default(1),
  claimsCount:         integer("claimsCount").default(0),
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
  updatedAt:           timestamp("updatedAt").defaultNow().notNull(),
});
export type IpAsset = typeof ipAssets.$inferSelect;
export type InsertIpAsset = typeof ipAssets.$inferInsert;

// -- IP Licenses --------------------------------------------------------------
export const ipLicenses = pgTable("ip_licenses", {
  id:              serial("id").primaryKey(),
  ipAssetId:       integer("ipAssetId").notNull(),
  licensee:        varchar("licensee", { length: 128 }).notNull(),
  country:         varchar("country", { length: 64 }),
  region:          varchar("region", { length: 64 }),
  licenseType:     varchar("licenseType", { length: 32 }).notNull().default("Non-Exclusive"),
  status:          varchar("status", { length: 32 }).notNull().default("Negotiating"),
  annualValue:     doublePrecision("annualValue").default(0),
  upfrontFee:      doublePrecision("upfrontFee").default(0),
  royaltyRate:     doublePrecision("royaltyRate").default(0),
  startDate:       varchar("startDate", { length: 16 }),
  endDate:         varchar("endDate", { length: 16 }),
  valuesAligned:   boolean("valuesAligned").default(true),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type IpLicense = typeof ipLicenses.$inferSelect;
export type InsertIpLicense = typeof ipLicenses.$inferInsert;

// -- Patent AI Workspace Projects ---------------------------------------------
export const patentProjects = pgTable("patent_projects", {
  id:                  serial("id").primaryKey(),
  ipAssetId:           integer("ipAssetId"),
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
  updatedAt:           timestamp("updatedAt").defaultNow().notNull(),
});
export type PatentProject = typeof patentProjects.$inferSelect;
export type InsertPatentProject = typeof patentProjects.$inferInsert;

// -- Patent Hypotheses (AI-generated alternative embodiments) -----------------
export const patentHypotheses = pgTable("patent_hypotheses", {
  id:            serial("id").primaryKey(),
  projectId:     integer("projectId").notNull(),
  title:         varchar("title", { length: 256 }).notNull(),
  description:   text("description").notNull(),
  rationale:     text("rationale"),
  claimImpact:   text("claimImpact"),
  included:      boolean("included").default(false),
  sortOrder:     integer("sortOrder").default(0),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
});
export type PatentHypothesis = typeof patentHypotheses.$inferSelect;
export type InsertPatentHypothesis = typeof patentHypotheses.$inferInsert;

// -- LCSSA: Environmental LCA (Planet) ----------------------------------------
export const lcssaEnvironmental = pgTable("lcssa_environmental", {
  id:                  serial("id").primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  // Carbon Footprint
  carbonFootprintKg:   doublePrecision("carbonFootprintKg").default(0),
  carbonFootprintScope1: doublePrecision("carbonFootprintScope1").default(0),
  carbonFootprintScope2: doublePrecision("carbonFootprintScope2").default(0),
  carbonFootprintScope3: doublePrecision("carbonFootprintScope3").default(0),
  carbonReductionTarget: doublePrecision("carbonReductionTarget").default(0), // % target
  // Resource Use
  energyConsumptionKwh:  doublePrecision("energyConsumptionKwh").default(0),
  waterUsageLitres:      doublePrecision("waterUsageLitres").default(0),
  renewableEnergyPct:    doublePrecision("renewableEnergyPct").default(0),
  materialEfficiencyPct: doublePrecision("materialEfficiencyPct").default(0),
  // Pollution & Waste
  wasteGeneratedKg:      doublePrecision("wasteGeneratedKg").default(0),
  wasteRecycledPct:      doublePrecision("wasteRecycledPct").default(0),
  airPollutionIndex:     doublePrecision("airPollutionIndex").default(0),
  waterPollutionIndex:   doublePrecision("waterPollutionIndex").default(0),
  // Ecosystem Impact
  biodiversityScore:     doublePrecision("biodiversityScore").default(0), // 0-10
  landUseHectares:       doublePrecision("landUseHectares").default(0),
  ecosystemServicesScore: doublePrecision("ecosystemServicesScore").default(0), // 0-10
  // Overall
  environmentalScore:    doublePrecision("environmentalScore").default(0), // 0-100
  notes:                 text("notes"),
  assessmentDate:        timestamp("assessmentDate").defaultNow(),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type LcssaEnvironmental = typeof lcssaEnvironmental.$inferSelect;
export type InsertLcssaEnvironmental = typeof lcssaEnvironmental.$inferInsert;

// -- LCSSA: Social LCA (People) -----------------------------------------------
export const lcssaSocial = pgTable("lcssa_social", {
  id:                  serial("id").primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  // Labor Conditions
  livingWageCompliance: boolean("livingWageCompliance").default(false),
  avgWorkingHoursPerWeek: doublePrecision("avgWorkingHoursPerWeek").default(0),
  employeeTurnoverPct:  doublePrecision("employeeTurnoverPct").default(0),
  collectiveBargaining: boolean("collectiveBargaining").default(false),
  // Human Rights
  humanRightsDueDiligence: boolean("humanRightsDueDiligence").default(false),
  supplyChainAuditScore: doublePrecision("supplyChainAuditScore").default(0), // 0-10
  childLaborRisk:       varchar("childLaborRisk", { length: 16 }).default("Low"), // Low/Medium/High
  forcedLaborRisk:      varchar("forcedLaborRisk", { length: 16 }).default("Low"),
  // Community Impact
  localHiringPct:       doublePrecision("localHiringPct").default(0),
  communityInvestmentGbp: doublePrecision("communityInvestmentGbp").default(0),
  communityEngagementScore: doublePrecision("communityEngagementScore").default(0), // 0-10
  // Health & Safety
  ltifr:                doublePrecision("ltifr").default(0), // Lost Time Injury Frequency Rate
  nearMissReports:      integer("nearMissReports").default(0),
  safetyTrainingHours:  doublePrecision("safetyTrainingHours").default(0),
  healthSafetyScore:    doublePrecision("healthSafetyScore").default(0), // 0-10
  // Overall
  socialScore:          doublePrecision("socialScore").default(0), // 0-100
  notes:                text("notes"),
  assessmentDate:       timestamp("assessmentDate").defaultNow(),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().notNull(),
});
export type LcssaSocial = typeof lcssaSocial.$inferSelect;
export type InsertLcssaSocial = typeof lcssaSocial.$inferInsert;

// -- LCSSA: Life Cycle Costing (Profit) ---------------------------------------
export const lcssaLifeCycleCost = pgTable("lcssa_life_cycle_cost", {
  id:                  serial("id").primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  // Production Costs
  rawMaterialCostGbp:  doublePrecision("rawMaterialCostGbp").default(0),
  manufacturingCostGbp: doublePrecision("manufacturingCostGbp").default(0),
  labourCostGbp:       doublePrecision("labourCostGbp").default(0),
  overheadCostGbp:     doublePrecision("overheadCostGbp").default(0),
  // Logistics Costs
  inboundLogisticsCostGbp:  doublePrecision("inboundLogisticsCostGbp").default(0),
  outboundLogisticsCostGbp: doublePrecision("outboundLogisticsCostGbp").default(0),
  warehouseCostGbp:    doublePrecision("warehouseCostGbp").default(0),
  // Maintenance
  plannedMaintenanceCostGbp:   doublePrecision("plannedMaintenanceCostGbp").default(0),
  unplannedMaintenanceCostGbp: doublePrecision("unplannedMaintenanceCostGbp").default(0),
  assetLifespanYears:  doublePrecision("assetLifespanYears").default(0),
  // End-of-Life Costs
  disposalCostGbp:     doublePrecision("disposalCostGbp").default(0),
  recyclingRevGbp:     doublePrecision("recyclingRevGbp").default(0),
  remediationCostGbp:  doublePrecision("remediationCostGbp").default(0),
  // Totals
  totalLccGbp:         doublePrecision("totalLccGbp").default(0),
  lccScore:            doublePrecision("lccScore").default(0), // 0-100 (efficiency score)
  currency:            varchar("currency", { length: 8 }).default("GBP"),
  notes:               text("notes"),
  assessmentDate:      timestamp("assessmentDate").defaultNow(),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().notNull(),
});
export type LcssaLifeCycleCost = typeof lcssaLifeCycleCost.$inferSelect;
export type InsertLcssaLifeCycleCost = typeof lcssaLifeCycleCost.$inferInsert;

// -- LCSSA: Oversight & Governance (Policy & Standards + Data & Reporting) ----
export const lcssaOversight = pgTable("lcssa_oversight", {
  id:                  serial("id").primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  // Policy & Standards
  iso14001Certified:   boolean("iso14001Certified").default(false),
  iso26000Adopted:     boolean("iso26000Adopted").default(false),
  griReportingLevel:   varchar("griReportingLevel", { length: 32 }).default("None"), // None/Core/Comprehensive
  sdgAlignmentCount:   integer("sdgAlignmentCount").default(0), // number of SDGs addressed
  sdgHeatmap:          text("sdgHeatmap"), // JSON array of 17 booleans e.g. "[true,false,...]"
  policyDocumentUrl:   varchar("policyDocumentUrl", { length: 512 }),
  complianceScore:     doublePrecision("complianceScore").default(0), // 0-100
  // Data & Reporting
  reportingFrequency:  varchar("reportingFrequency", { length: 32 }).default("Annual"), // Annual/Quarterly/Monthly
  lastReportDate:      timestamp("lastReportDate"),
  nextReportDate:      timestamp("nextReportDate"),
  dataQualityScore:    doublePrecision("dataQualityScore").default(0), // 0-10
  thirdPartyVerified:  boolean("thirdPartyVerified").default(false),
  verifierName:        varchar("verifierName", { length: 128 }),
  reportUrl:           varchar("reportUrl", { length: 512 }),
  // Governance
  boardOversight:      boolean("boardOversight").default(false),
  sustainabilityCommittee: boolean("sustainabilityCommittee").default(false),
  stakeholderEngagementScore: doublePrecision("stakeholderEngagementScore").default(0), // 0-10
  oversightScore:      doublePrecision("oversightScore").default(0), // 0-100
  notes:               text("notes"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().notNull(),
});
export type LcssaOversight = typeof lcssaOversight.$inferSelect;
export type InsertLcssaOversight = typeof lcssaOversight.$inferInsert;

// -- LCSSA: Sustainable Decision Log ------------------------------------------
export const lcssaDecisionLog = pgTable("lcssa_decision_log", {
  id:                  serial("id").primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  decisionTitle:       varchar("decisionTitle", { length: 256 }).notNull(),
  decisionType:        text("decisionType").notNull().default("Integrated"),
  lcaDimension:        varchar("lcaDimension", { length: 64 }), // Environmental LCA / Social LCA / LCC
  rationale:           text("rationale"),
  environmentalImpact: varchar("environmentalImpact", { length: 16 }).default("Neutral"), // Positive/Neutral/Negative
  socialImpact:        varchar("socialImpact", { length: 16 }).default("Neutral"),
  economicImpact:      varchar("economicImpact", { length: 16 }).default("Neutral"),
  status:              text("status").notNull().default("Proposed"),
  decisionDate:        timestamp("decisionDate").defaultNow(),
  reviewDate:          timestamp("reviewDate"),
  owner:               varchar("owner", { length: 128 }),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().notNull(),
});
export type LcssaDecisionLog = typeof lcssaDecisionLog.$inferSelect;
export type InsertLcssaDecisionLog = typeof lcssaDecisionLog.$inferInsert;

// -- LCSSA: Monthly Snapshot (for trend chart) ---------------------------------
export const lcssaSnapshot = pgTable("lcssa_snapshot", {
  id:                  serial("id").primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  snapshotDate:        timestamp("snapshotDate").defaultNow().notNull(),
  environmentalScore:  doublePrecision("environmentalScore").default(0),
  socialScore:         doublePrecision("socialScore").default(0),
  lccScore:            doublePrecision("lccScore").default(0),
  oversightScore:      doublePrecision("oversightScore").default(0),
  lcssaScore:          doublePrecision("lcssaScore").default(0),
  label:               varchar("label", { length: 64 }), // e.g. "Mar 2026"
  triggeredBy:         varchar("triggeredBy", { length: 64 }).default("manual"), // manual/auto
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
});
export type LcssaSnapshot = typeof lcssaSnapshot.$inferSelect;
export type InsertLcssaSnapshot = typeof lcssaSnapshot.$inferInsert;

// --------------------------------------------------------------------------------
// -  DUAL RISK VENTURE CREATION SYSTEM                                           -
// -  Brief: Dual Risk Venture Creation System - Prompt Brief (Manus AI)          -
// -  Separates Business Risk (University) and Product Risk (Founder)             -
// -  Recombines into VRL Engine with Decision Outputs                            -
// --------------------------------------------------------------------------------

// -- Business Risk Inputs (University Ownership) -------------------------------
export const businessRiskInputs = pgTable("business_risk_inputs", {
  id:                    serial("id").primaryKey(),
  ventureId:             varchar("ventureId", { length: 64 }).notNull().unique(),
  // Input source
  sourceType:            text("sourceType").notNull().default("manual"),
  inputCategory:         text("inputCategory").notNull().default("University"),
  // Market Risk (0-100)
  marketRiskScore:       doublePrecision("marketRiskScore").default(50),
  marketSizeScore:       doublePrecision("marketSizeScore").default(50),       // TAM/SAM/SOM confidence
  competitorIntensity:   doublePrecision("competitorIntensity").default(50),   // competitive landscape
  demandValidation:      doublePrecision("demandValidation").default(50),      // customer validation strength
  // ESG Risk (0-100)
  esgRiskScore:          doublePrecision("esgRiskScore").default(50),
  carbonFootprintRisk:   doublePrecision("carbonFootprintRisk").default(50),
  socialLicenceRisk:     doublePrecision("socialLicenceRisk").default(50),
  supplyChainEsgRisk:    doublePrecision("supplyChainEsgRisk").default(50),
  // Regulatory Risk (0-100)
  regulatoryRiskScore:   doublePrecision("regulatoryRiskScore").default(50),
  complianceComplexity:  doublePrecision("complianceComplexity").default(50),
  certificationBarrier:  doublePrecision("certificationBarrier").default(50),
  jurisdictionRisk:      doublePrecision("jurisdictionRisk").default(50),
  // Commercial Viability (0-100, higher = more viable)
  commercialViabilityScore: doublePrecision("commercialViabilityScore").default(50),
  revenueModelClarity:   doublePrecision("revenueModelClarity").default(50),
  unitEconomicsScore:    doublePrecision("unitEconomicsScore").default(50),
  partnershipReadiness:  doublePrecision("partnershipReadiness").default(50),
  // Strategic Risk (0-100)
  strategicRiskScore:    doublePrecision("strategicRiskScore").default(50),
  ipProtectionStrength:  doublePrecision("ipProtectionStrength").default(50),
  teamCapabilityRisk:    doublePrecision("teamCapabilityRisk").default(50),
  executionTrack:        text("executionTrack").default("BEBUS"),
  // Computed aggregate
  businessRiskIndex:     doublePrecision("businessRiskIndex").default(50),     // 0-100, lower = less risk
  notes:                 text("notes"),
  lastUpdatedBy:         varchar("lastUpdatedBy", { length: 128 }),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type BusinessRiskInput = typeof businessRiskInputs.$inferSelect;
export type InsertBusinessRiskInput = typeof businessRiskInputs.$inferInsert;

// -- Product Risk Inputs (Founder Ownership) -----------------------------------
export const productRiskInputs = pgTable("product_risk_inputs", {
  id:                    serial("id").primaryKey(),
  ventureId:             varchar("ventureId", { length: 64 }).notNull().unique(),
  // Input source
  sourceType:            text("sourceType").notNull().default("manual"),
  inputCategory:         text("inputCategory").notNull().default("Founder"),
  // Technical Feasibility (0-100, higher = more feasible)
  technicalFeasibilityScore: doublePrecision("technicalFeasibilityScore").default(50),
  prototypeMaturity:     doublePrecision("prototypeMaturity").default(50),     // how advanced the prototype is
  technologyReadiness:   doublePrecision("technologyReadiness").default(50),   // linked to TRL
  // Performance Risk (0-100)
  performanceRiskScore:  doublePrecision("performanceRiskScore").default(50),
  benchmarkGap:          doublePrecision("benchmarkGap").default(50),          // gap vs POI benchmark
  qualityRisk:           doublePrecision("qualityRisk").default(50),
  reliabilityRisk:       doublePrecision("reliabilityRisk").default(50),
  // Scalability Risk (0-100)
  scalabilityRiskScore:  doublePrecision("scalabilityRiskScore").default(50),
  manufacturingRisk:     doublePrecision("manufacturingRisk").default(50),
  supplyChainRisk:       doublePrecision("supplyChainRisk").default(50),
  unitCostScalability:   doublePrecision("unitCostScalability").default(50),
  // Engineering Complexity (0-100, higher = more complex)
  engineeringComplexity: doublePrecision("engineeringComplexity").default(50),
  integrationRisk:       doublePrecision("integrationRisk").default(50),
  dependencyRisk:        doublePrecision("dependencyRisk").default(50),
  // R&D Maturity (0-100, higher = more mature)
  rdMaturityScore:       doublePrecision("rdMaturityScore").default(50),
  labValidationScore:    doublePrecision("labValidationScore").default(50),    // EcoRace lab results
  pilotTestScore:        doublePrecision("pilotTestScore").default(50),
  executionTrack:        text("executionTrack").default("ECORACE"),
  // Computed aggregate
  productRiskIndex:      doublePrecision("productRiskIndex").default(50),      // 0-100, lower = less risk
  notes:                 text("notes"),
  lastUpdatedBy:         varchar("lastUpdatedBy", { length: 128 }),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type ProductRiskInput = typeof productRiskInputs.$inferSelect;
export type InsertProductRiskInput = typeof productRiskInputs.$inferInsert;

// -- Dual Risk Decisions (VRL Engine Output) -----------------------------------
export const dualRiskDecisions = pgTable("dual_risk_decisions", {
  id:                    serial("id").primaryKey(),
  ventureId:             varchar("ventureId", { length: 64 }).notNull(),
  // Inputs at time of decision
  businessRiskIndex:     doublePrecision("businessRiskIndex").notNull(),
  productRiskIndex:      doublePrecision("productRiskIndex").notNull(),
  trlScore:              doublePrecision("trlScore").notNull(),
  brlScore:              doublePrecision("brlScore").notNull(),
  esgScore:              doublePrecision("esgScore").default(50),
  // VRL Engine outputs
  vrlScore:              doublePrecision("vrlScore").notNull(),                 // 0-9 scale
  vrlLevel:              integer("vrlLevel").notNull(),                   // 1-9
  confidenceScore:       doublePrecision("confidenceScore").default(0.5),      // 0.2-1.0
  // Decision output
  decision:              text("decision").notNull(),
  decisionRationale:     text("decisionRationale"),
  // Execution routing
  executionTrack:        text("executionTrack").default("None"),
  // Feedback loop
  marketFeedback:        text("marketFeedback"),
  feedbackScore:         doublePrecision("feedbackScore"),                      // 0-100 market response
  // Metadata
  decidedBy:             varchar("decidedBy", { length: 128 }),
  sourceType:            text("sourceType").default("Joint"),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type DualRiskDecision = typeof dualRiskDecisions.$inferSelect;
export type InsertDualRiskDecision = typeof dualRiskDecisions.$inferInsert;

// -------------------------------------------------------------------------------
// SUPPLY CHAIN & MANUFACTURING INTELLIGENCE MODULE (Sprint 42)
// -------------------------------------------------------------------------------

// -- SC Products ---------------------------------------------------------------
export const scProducts = pgTable("sc_products", {
  id:                   serial("id").primaryKey(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  name:                 varchar("name", { length: 256 }).notNull(),
  description:          text("description"),
  materialType:         text("materialType").default("carbon_fibre"),
  manufacturingProcess: text("manufacturingProcess").default("composite_layup"),
  prototypeStatus:      text("prototypeStatus").default("concept"),
  trlLevel:             integer("trlLevel").default(1),                   // 1-9
  productionGeography:  text("productionGeography").default("UK"),
  targetMarket:         varchar("targetMarket", { length: 256 }),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().notNull(),
});
export type ScProduct = typeof scProducts.$inferSelect;
export type InsertScProduct = typeof scProducts.$inferInsert;

// -- SC Prototypes (UK R&D Layer) ----------------------------------------------
export const scPrototypes = pgTable("sc_prototypes", {
  id:                   serial("id").primaryKey(),
  productId:            integer("productId").notNull(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  version:              varchar("version", { length: 32 }).default("v1"),
  // CAD/CAE status
  cadStatus:            text("cadStatus").default("not_started"),
  caeStatus:            text("caeStatus").default("not_started"),
  cadFileUrl:           varchar("cadFileUrl", { length: 512 }),
  // Lab validation
  labTestStatus:        text("labTestStatus").default("not_started"),
  testResults:          text("testResults"),                          // JSON blob of test metrics
  structuralIntegrity:  doublePrecision("structuralIntegrity"),                 // 0-100 score
  weightGrams:          doublePrecision("weightGrams"),
  dimensionsMm:         varchar("dimensionsMm", { length: 128 }),     // "L-W-H"
  // TRL progression
  trlAtStart:           integer("trlAtStart").default(1),
  trlAtEnd:             integer("trlAtEnd").default(1),
  // Early LCA
  lcaScore:             doublePrecision("lcaScore"),                            // 0-100 (lower = better impact)
  carbonFootprintKg:    doublePrecision("carbonFootprintKg"),                   // kg CO2e per unit prototype
  // Manufacturing requirements output
  manufacturingNotes:   text("manufacturingNotes"),
  prototypeImageUrl:    varchar("prototypeImageUrl", { length: 512 }),
  completedAt:          timestamp("completedAt"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().notNull(),
});
export type ScPrototype = typeof scPrototypes.$inferSelect;
export type InsertScPrototype = typeof scPrototypes.$inferInsert;

// -- SC Manufacturing (Manufacturing Intelligence Layer) -----------------------
export const scManufacturing = pgTable("sc_manufacturing", {
  id:                      serial("id").primaryKey(),
  productId:               integer("productId").notNull(),
  ventureId:               varchar("ventureId", { length: 64 }).notNull(),
  // BOM
  bomJson:                 text("bomJson"),                           // JSON array of BOM line items
  bomVersion:              varchar("bomVersion", { length: 32 }).default("1.0"),
  // Cost modelling
  unitCostGbp:             doublePrecision("unitCostGbp"),                      // - per unit
  toolingCostGbp:          doublePrecision("toolingCostGbp"),
  moq:                     integer("moq").default(1),                     // minimum order quantity
  targetUnitCostGbp:       doublePrecision("targetUnitCostGbp"),
  // Process selection
  primaryProcess:          text("primaryProcess").default("composite_layup"),
  processComplexityIndex:  integer("processComplexityIndex").default(50), // 0-100
  // Production capacity
  productionCapacityPerMonth: integer("productionCapacityPerMonth"),
  leadTimeDays:            integer("leadTimeDays"),
  // Manufacturing readiness
  manufacturingReadinessScore: integer("manufacturingReadinessScore").default(0), // 0-100
  readinessNotes:          text("readinessNotes"),
  // Tooling
  toolingStatus:           text("toolingStatus").default("not_started"),
  createdAt:               timestamp("createdAt").defaultNow().notNull(),
  updatedAt:               timestamp("updatedAt").defaultNow().notNull(),
});
export type ScManufacturing = typeof scManufacturing.$inferSelect;
export type InsertScManufacturing = typeof scManufacturing.$inferInsert;

// -- SC Suppliers --------------------------------------------------------------
export const scSuppliers = pgTable("sc_suppliers", {
  id:                   serial("id").primaryKey(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  name:                 varchar("name", { length: 256 }).notNull(),
  supplierType:         text("supplierType").default("contract_manufacturer"),
  geography:            text("geography").default("China"),
  city:                 varchar("city", { length: 128 }),
  contactName:          varchar("contactName", { length: 128 }),
  contactEmail:         varchar("contactEmail", { length: 256 }),
  // Scoring
  riskScore:            integer("riskScore").default(50),                 // 0-100 (lower = less risk)
  qualityScore:         integer("qualityScore").default(50),              // 0-100
  leadTimeDays:         integer("leadTimeDays"),
  unitCostIndex:        doublePrecision("unitCostIndex"),                       // relative cost index
  // ESG
  esgComplianceStatus:  text("esgComplianceStatus").default("unknown"),
  ethicalSourcingScore: integer("ethicalSourcingScore").default(50),      // 0-100
  // Geopolitical risk
  geopoliticalRiskFlag: boolean("geopoliticalRiskFlag").default(false),
  geopoliticalNotes:    text("geopoliticalNotes"),
  // Relationship
  contractStatus:       text("contractStatus").default("prospect"),
  certifications:       text("certifications"),                       // JSON array
  notes:                text("notes"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().notNull(),
});
export type ScSupplier = typeof scSuppliers.$inferSelect;
export type InsertScSupplier = typeof scSuppliers.$inferInsert;

// -- SC Production Orders (Global Production Layer) ---------------------------
export const scProductionOrders = pgTable("sc_production_orders", {
  id:                   serial("id").primaryKey(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  productId:            integer("productId").notNull(),
  supplierId:           integer("supplierId"),
  orderRef:             varchar("orderRef", { length: 64 }),
  orderType:            text("orderType").default("pilot"),
  geography:            text("geography").default("China"),
  // Volumes & economics
  quantityOrdered:      integer("quantityOrdered").notNull(),
  unitCostGbp:          doublePrecision("unitCostGbp"),
  totalCostGbp:         doublePrecision("totalCostGbp"),
  // Schedule
  orderDate:            timestamp("orderDate").defaultNow(),
  expectedDeliveryDate: timestamp("expectedDeliveryDate"),
  actualDeliveryDate:   timestamp("actualDeliveryDate"),
  leadTimeDays:         integer("leadTimeDays"),
  // QA/QC
  qaStatus:             text("qaStatus").default("pending"),
  defectRate:           doublePrecision("defectRate").default(0),               // % defect rate
  qualityNotes:         text("qualityNotes"),
  // Logistics
  shippingMethod:       text("shippingMethod").default("sea"),
  trackingRef:          varchar("trackingRef", { length: 128 }),
  // Status
  status:               text("status").default("draft"),
  notes:                text("notes"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().notNull(),
});
export type ScProductionOrder = typeof scProductionOrders.$inferSelect;
export type InsertScProductionOrder = typeof scProductionOrders.$inferInsert;

// -----------------------------------------------------------------------------
// CHINESE MANUFACTURING PLAYBOOK TABLES
// -----------------------------------------------------------------------------

// Master playbook project - one per venture/product combination
export const mfgPlaybookProjects = pgTable("mfgPlaybookProjects", {
  id:              serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  productName:     varchar("productName", { length: 256 }).notNull(),
  description:     text("description"),
  phase:           text("phase").default("uk_prototype").notNull(),
  ukPrototypeDone:      integer("ukPrototypeDone").default(0),
  chinaFeasibilityDone: integer("chinaFeasibilityDone").default(0),
  pilotProductionDone:  integer("pilotProductionDone").default(0),
  scaleManufacturingDone: integer("scaleManufacturingDone").default(0),
  trlLevel:        integer("trlLevel").default(1),
  prototypeStatus: text("prototypeStatus").default("not_started"),
  validationNotes: text("validationNotes"),
  rfqSent:         integer("rfqSent").default(0),
  dfmComplete:     integer("dfmComplete").default(0),
  toolingOwnershipAgreement: integer("toolingOwnershipAgreement").default(0),
  pilotVolume:     integer("pilotVolume").default(0),
  scaleVolume:     integer("scaleVolume").default(0),
  targetUnitCostGbp: doublePrecision("targetUnitCostGbp"),
  materialCostGbp: doublePrecision("materialCostGbp"),
  labourCostGbp:   doublePrecision("labourCostGbp"),
  overheadCostGbp: doublePrecision("overheadCostGbp"),
  logisticsCostGbp: doublePrecision("logisticsCostGbp"),
  marginPercent:   doublePrecision("marginPercent").default(30),
  iso9001:         integer("iso9001").default(0),
  iso14001:        integer("iso14001").default(0),
  ceCertified:     integer("ceCertified").default(0),
  ukcaCertified:   integer("ukcaCertified").default(0),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type MfgPlaybookProject = typeof mfgPlaybookProjects.$inferSelect;
export type InsertMfgPlaybookProject = typeof mfgPlaybookProjects.$inferInsert;

// 4-tier supplier ecosystem
export const mfgSupplierTiers = pgTable("mfgSupplierTiers", {
  id:              serial("id").primaryKey(),
  projectId:       integer("projectId").notNull(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  supplierName:    varchar("supplierName", { length: 256 }).notNull(),
  tier:            text("tier").notNull(),
  country:         varchar("country", { length: 64 }).default("China"),
  city:            varchar("city", { length: 128 }),
  contactName:     varchar("contactName", { length: 128 }),
  contactEmail:    varchar("contactEmail", { length: 256 }),
  nnnAgreement:    text("nnnAgreement").default("none"),
  manufacturingContract: text("manufacturingContract").default("none"),
  toolingOwnership: text("toolingOwnership").default("none"),
  blackBoxComponents: integer("blackBoxComponents").default(0),
  riskScore:       integer("riskScore").default(50),
  auditScore:      integer("auditScore").default(0),
  qualityScore:    integer("qualityScore").default(0),
  isDualSource:    integer("isDualSource").default(0),
  primarySupplierId: integer("primarySupplierId"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type MfgSupplierTier = typeof mfgSupplierTiers.$inferSelect;
export type InsertMfgSupplierTier = typeof mfgSupplierTiers.$inferInsert;

// QC reports - pre-production, in-line, pre-shipment AQL
export const mfgQcReports = pgTable("mfgQcReports", {
  id:              serial("id").primaryKey(),
  projectId:       integer("projectId").notNull(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  reportType:      text("reportType").notNull(),
  inspectionDate:  timestamp("inspectionDate"),
  inspector:       varchar("inspector", { length: 128 }),
  supplierId:      integer("supplierId"),
  sampleSize:      integer("sampleSize"),
  defectsFound:    integer("defectsFound").default(0),
  aqlLevel:        varchar("aqlLevel", { length: 16 }).default("2.5"),
  result:          text("result").default("pending"),
  iso9001Pass:     integer("iso9001Pass").default(0),
  iso14001Pass:    integer("iso14001Pass").default(0),
  cePass:          integer("cePass").default(0),
  ukcastPass:      integer("ukcastPass").default(0),
  findings:        text("findings"),
  correctiveActions: text("correctiveActions"),
  attachmentUrl:   varchar("attachmentUrl", { length: 512 }),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type MfgQcReport = typeof mfgQcReports.$inferSelect;
export type InsertMfgQcReport = typeof mfgQcReports.$inferInsert;

// Logistics shipments
export const mfgLogisticsShipments = pgTable("mfgLogisticsShipments", {
  id:              serial("id").primaryKey(),
  projectId:       integer("projectId").notNull(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  shipmentRef:     varchar("shipmentRef", { length: 128 }),
  freightType:     text("freightType").default("sea").notNull(),
  originPort:      text("originPort").default("shenzhen"),
  destinationPort: varchar("destinationPort", { length: 128 }).default("Felixstowe, UK"),
  volume:          integer("volume"),
  weightKg:        doublePrecision("weightKg"),
  freightCostGbp:  doublePrecision("freightCostGbp"),
  dutiesGbp:       doublePrecision("dutiesGbp"),
  insuranceGbp:    doublePrecision("insuranceGbp"),
  leadTimeDays:    integer("leadTimeDays"),
  departureDate:   timestamp("departureDate"),
  arrivalDate:     timestamp("arrivalDate"),
  status:          text("status").default("planned"),
  trackingRef:     varchar("trackingRef", { length: 128 }),
  forwarder:       varchar("forwarder", { length: 128 }),
  incoterms:       text("incoterms").default("FOB"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type MfgLogisticsShipment = typeof mfgLogisticsShipments.$inferSelect;
export type InsertMfgLogisticsShipment = typeof mfgLogisticsShipments.$inferInsert;

// -- China Manufacturing Playbook Extended Tables ------------------------------

// Supplier Onboarding / Registration
export const mfgSupplierOnboarding = pgTable("mfgSupplierOnboarding", {
  id:                  serial("id").primaryKey(),
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
  financialStability:  text("financialStability").default("unknown"),
  references:          text("references"),
  technicalCapability: integer("technicalCapability").default(0),
  qualitySystems:      integer("qualitySystems").default(0),
  leadTimesScore:      integer("leadTimesScore").default(0),
  costCompetitiveness: integer("costCompetitiveness").default(0),
  communication:       integer("communication").default(0),
  complianceStandards: integer("complianceStandards").default(0),
  overallScore:        doublePrecision("overallScore").default(0),
  status:              text("status").default("pending"),
  notes:               text("notes"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().notNull(),
});
export type MfgSupplierOnboarding = typeof mfgSupplierOnboarding.$inferSelect;
export type InsertMfgSupplierOnboarding = typeof mfgSupplierOnboarding.$inferInsert;

// Factory Audit Checklist
export const mfgFactoryAudits = pgTable("mfgFactoryAudits", {
  id:                    serial("id").primaryKey(),
  ventureId:             varchar("ventureId", { length: 64 }).notNull(),
  supplierId:            integer("supplierId"),
  supplierName:          varchar("supplierName", { length: 256 }).notNull(),
  auditDate:             timestamp("auditDate"),
  auditorName:           varchar("auditorName", { length: 128 }),
  facilityCondition:     text("facilityCondition").default("na"),
  equipmentCapability:   text("equipmentCapability").default("na"),
  workforceSkills:       text("workforceSkills").default("na"),
  qcProcesses:           text("qcProcesses").default("na"),
  healthAndSafety:       text("healthAndSafety").default("na"),
  environmentalCompliance: text("environmentalCompliance").default("na"),
  overallResult:         text("overallResult").default("pending"),
  auditScore:            integer("auditScore").default(0),
  findings:              text("findings"),
  correctiveActions:     text("correctiveActions"),
  followUpDate:          timestamp("followUpDate"),
  status:                text("status").default("scheduled"),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type MfgFactoryAudit = typeof mfgFactoryAudits.$inferSelect;
export type InsertMfgFactoryAudit = typeof mfgFactoryAudits.$inferInsert;

// RFQ Templates
export const mfgRfqTemplates = pgTable("mfgRfqTemplates", {
  id:                serial("id").primaryKey(),
  ventureId:         varchar("ventureId", { length: 64 }).notNull(),
  projectId:         integer("projectId"),
  rfqRef:            varchar("rfqRef", { length: 64 }),
  productName:       varchar("productName", { length: 256 }).notNull(),
  productSpecs:      text("productSpecs"),
  drawingsUrl:       varchar("drawingsUrl", { length: 512 }),
  materials:         text("materials"),
  targetVolumeMoq:   integer("targetVolumeMoq"),
  targetVolumeAnnual: integer("targetVolumeAnnual"),
  targetLeadTimeDays: integer("targetLeadTimeDays"),
  targetUnitCostGbp: doublePrecision("targetUnitCostGbp"),
  materialCostGbp:   doublePrecision("materialCostGbp"),
  labourCostGbp:     doublePrecision("labourCostGbp"),
  toolingCostGbp:    doublePrecision("toolingCostGbp"),
  overheadCostGbp:   doublePrecision("overheadCostGbp"),
  packagingCostGbp:  doublePrecision("packagingCostGbp"),
  sentToSuppliers:   text("sentToSuppliers"),
  responseDeadline:  timestamp("responseDeadline"),
  status:            text("status").default("draft"),
  awardedSupplier:   varchar("awardedSupplier", { length: 256 }),
  notes:             text("notes"),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
  updatedAt:         timestamp("updatedAt").defaultNow().notNull(),
});
export type MfgRfqTemplate = typeof mfgRfqTemplates.$inferSelect;
export type InsertMfgRfqTemplate = typeof mfgRfqTemplates.$inferInsert;

// Approved Supplier List (ASL)
export const mfgApprovedSuppliers = pgTable("mfgApprovedSuppliers", {
  id:               serial("id").primaryKey(),
  ventureId:        varchar("ventureId", { length: 64 }).notNull(),
  supplierId:       varchar("supplierId", { length: 64 }),
  onboardingId:     integer("onboardingId"),
  supplierName:     varchar("supplierName", { length: 256 }).notNull(),
  tierLevel:        text("tierLevel").default("components"),
  capabilities:     text("capabilities"),
  riskRating:       text("riskRating").default("medium"),
  performanceScore: doublePrecision("performanceScore").default(0),
  qualityScore:     doublePrecision("qualityScore").default(0),
  deliveryScore:    doublePrecision("deliveryScore").default(0),
  costScore:        doublePrecision("costScore").default(0),
  lastAuditDate:    timestamp("lastAuditDate"),
  nextAuditDate:    timestamp("nextAuditDate"),
  approvalDate:     timestamp("approvalDate"),
  approvedBy:       varchar("approvedBy", { length: 128 }),
  status:           text("status").default("active"),
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type MfgApprovedSupplier = typeof mfgApprovedSuppliers.$inferSelect;
export type InsertMfgApprovedSupplier = typeof mfgApprovedSuppliers.$inferInsert;

// Contract Templates
export const mfgContractTemplates = pgTable("mfgContractTemplates", {
  id:               serial("id").primaryKey(),
  ventureId:        varchar("ventureId", { length: 64 }).notNull(),
  supplierId:       integer("supplierId"),
  supplierName:     varchar("supplierName", { length: 256 }),
  contractType:     text("contractType").notNull(),
  clauseChecklist:  text("clauseChecklist"),
  draftText:        text("draftText"),
  jurisdiction:     varchar("jurisdiction", { length: 128 }).default("China"),
  effectiveDate:    timestamp("effectiveDate"),
  expiryDate:       timestamp("expiryDate"),
  penaltyClause:    boolean("penaltyClause").default(false),
  ipOwnershipClause: boolean("ipOwnershipClause").default(false),
  incoterms:        text("incoterms").default("FOB"),
  status:           text("status").default("draft"),
  signedDate:       timestamp("signedDate"),
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type MfgContractTemplate = typeof mfgContractTemplates.$inferSelect;
export type InsertMfgContractTemplate = typeof mfgContractTemplates.$inferInsert;

// -- University Playbook Tables --------------------------------------------------

// University Partners (universities, research institutions)
export const uniPartners = pgTable("uniPartners", {
  id:             serial("id").primaryKey(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  name:           varchar("name", { length: 255 }).notNull(),
  type:           varchar("type", { length: 64 }).notNull().default("university"), // university | research_institute | polytechnic | industry_lab
  country:        varchar("country", { length: 100 }),
  department:     varchar("department", { length: 255 }),
  contactName:    varchar("contactName", { length: 255 }),
  contactEmail:   varchar("contactEmail", { length: 255 }),
  partnershipType: varchar("partnershipType", { length: 64 }).notNull().default("research"), // research | talent | commercialisation | sponsored | internship
  status:         varchar("status", { length: 32 }).notNull().default("active"), // active | inactive | pending | negotiating
  startDate:      integer("startDate"),
  endDate:        integer("endDate"),
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().notNull(),
});
export type UniPartner = typeof uniPartners.$inferSelect;
export type InsertUniPartner = typeof uniPartners.$inferInsert;

// Research Projects (academic, technical, applied)
export const uniResearchProjects = pgTable("uniResearchProjects", {
  id:             serial("id").primaryKey(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  partnerId:      integer("partnerId"),
  title:          varchar("title", { length: 255 }).notNull(),
  researchType:   varchar("researchType", { length: 64 }).notNull().default("business"), // business | technical | applied
  description:    text("description"),
  objective:      text("objective"),
  methodology:    varchar("methodology", { length: 128 }),
  status:         varchar("status", { length: 32 }).notNull().default("planned"), // planned | active | completed | published | paused
  leadResearcher: varchar("leadResearcher", { length: 255 }),
  startDate:      integer("startDate"),
  endDate:        integer("endDate"),
  budget:         numeric("budget", { precision: 12, scale: 2 }),
  publicationUrl: varchar("publicationUrl", { length: 512 }),
  keyFindings:    text("keyFindings"),
  trlImpact:      integer("trlImpact"), // which TRL level this research supports
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().notNull(),
});
export type UniResearchProject = typeof uniResearchProjects.$inferSelect;
export type InsertUniResearchProject = typeof uniResearchProjects.$inferInsert;

// Talent Roles (students, academics, industry experts, venture leads)
export const uniTalentRoles = pgTable("uniTalentRoles", {
  id:             serial("id").primaryKey(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  partnerId:      integer("partnerId"),
  name:           varchar("name", { length: 255 }).notNull(),
  roleType:       varchar("roleType", { length: 64 }).notNull().default("student"), // student | academic | industry_expert | venture_lead
  institution:    varchar("institution", { length: 255 }),
  skills:         text("skills"), // comma-separated
  availability:   varchar("availability", { length: 64 }).default("part_time"), // full_time | part_time | advisory | internship
  assignedProject: varchar("assignedProject", { length: 255 }),
  stipend:        numeric("stipend", { precision: 10, scale: 2 }),
  startDate:      integer("startDate"),
  endDate:        integer("endDate"),
  status:         varchar("status", { length: 32 }).notNull().default("active"), // active | inactive | onboarding | completed
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().notNull(),
});
export type UniTalentRole = typeof uniTalentRoles.$inferSelect;
export type InsertUniTalentRole = typeof uniTalentRoles.$inferInsert;

// Venture Workflow Stages (5-stage pipeline per project)
export const uniVentureWorkflows = pgTable("uniVentureWorkflows", {
  id:             serial("id").primaryKey(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  projectName:    varchar("projectName", { length: 255 }).notNull(),
  stage:          varchar("stage", { length: 64 }).notNull().default("problem_definition"), // problem_definition | research_discovery | hypothesis_development | validation | commercialisation
  problemStatement: text("problemStatement"),
  researchFindings: text("researchFindings"),
  hypothesis:     text("hypothesis"),
  validationMethod: varchar("validationMethod", { length: 255 }),
  validationResult: varchar("validationResult", { length: 64 }), // confirmed | refuted | inconclusive | pending
  commercialisationPlan: text("commercialisationPlan"),
  linkedResearchId: integer("linkedResearchId"),
  stageGatePassed: boolean("stageGatePassed").default(false),
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().notNull(),
});
export type UniVentureWorkflow = typeof uniVentureWorkflows.$inferSelect;
export type InsertUniVentureWorkflow = typeof uniVentureWorkflows.$inferInsert;

// Industry Engagements (sponsored research, consulting, partnerships, internships)
export const uniIndustryEngagements = pgTable("uniIndustryEngagements", {
  id:             serial("id").primaryKey(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  companyName:    varchar("companyName", { length: 255 }).notNull(),
  engagementType: varchar("engagementType", { length: 64 }).notNull().default("sponsored_research"), // sponsored_research | consulting | venture_partnership | internship_pipeline | joint_ip
  description:    text("description"),
  contactName:    varchar("contactName", { length: 255 }),
  contactEmail:   varchar("contactEmail", { length: 255 }),
  value:          numeric("value", { precision: 12, scale: 2 }), // financial value of engagement
  status:         varchar("status", { length: 32 }).notNull().default("active"), // active | completed | negotiating | paused | cancelled
  startDate:      integer("startDate"),
  endDate:        integer("endDate"),
  deliverables:   text("deliverables"),
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().notNull(),
});
export type UniIndustryEngagement = typeof uniIndustryEngagements.$inferSelect;
export type InsertUniIndustryEngagement = typeof uniIndustryEngagements.$inferInsert;

// Governance Documents (student agreements, IP agreements, NDAs, ethics approvals)
export const uniGovernanceDocs = pgTable("uniGovernanceDocs", {
  id:             serial("id").primaryKey(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  docType:        varchar("docType", { length: 64 }).notNull().default("student_agreement"), // student_agreement | ip_agreement | nda | ethics_approval | data_protection | collaboration_agreement
  title:          varchar("title", { length: 255 }).notNull(),
  parties:        text("parties"), // comma-separated names
  status:         varchar("status", { length: 32 }).notNull().default("draft"), // draft | under_review | signed | expired | rejected
  signedDate:     integer("signedDate"),
  expiryDate:     integer("expiryDate"),
  documentUrl:    varchar("documentUrl", { length: 512 }),
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().notNull(),
});
export type UniGovernanceDoc = typeof uniGovernanceDocs.$inferSelect;
export type InsertUniGovernanceDoc = typeof uniGovernanceDocs.$inferInsert;

// Data Sources (hybrid data strategy: interviews, surveys, secondary, AI)
export const uniDataSources = pgTable("uniDataSources", {
  id:             serial("id").primaryKey(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  sourceType:     varchar("sourceType", { length: 64 }).notNull().default("interview"), // interview | survey | secondary_research | ai_analysis | focus_group | observation
  title:          varchar("title", { length: 255 }).notNull(),
  description:    text("description"),
  sampleSize:     integer("sampleSize"),
  collectionMethod: varchar("collectionMethod", { length: 255 }),
  status:         varchar("status", { length: 32 }).notNull().default("planned"), // planned | in_progress | completed | analysed
  dataUrl:        varchar("dataUrl", { length: 512 }),
  keyInsights:    text("keyInsights"),
  aiAnalysisDone: boolean("aiAnalysisDone").default(false),
  aiSummary:      text("aiSummary"),
  linkedHypothesis: varchar("linkedHypothesis", { length: 255 }),
  collectedAt:    integer("collectedAt"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().notNull(),
});
export type UniDataSource = typeof uniDataSources.$inferSelect;
export type InsertUniDataSource = typeof uniDataSources.$inferInsert;

// Roadmap Milestones (3-phase implementation: setup, pilot, scale)
export const uniRoadmapMilestones = pgTable("uniRoadmapMilestones", {
  id:             serial("id").primaryKey(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  phase:          varchar("phase", { length: 32 }).notNull().default("setup"), // setup | pilot | scale
  title:          varchar("title", { length: 255 }).notNull(),
  description:    text("description"),
  owner:          varchar("owner", { length: 255 }),
  targetDate:     integer("targetDate"),
  completedDate:  integer("completedDate"),
  status:         varchar("status", { length: 32 }).notNull().default("pending"), // pending | in_progress | completed | delayed | cancelled
  priority:       varchar("priority", { length: 16 }).notNull().default("medium"), // low | medium | high | critical
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().notNull(),
});
export type UniRoadmapMilestone = typeof uniRoadmapMilestones.$inferSelect;
export type InsertUniRoadmapMilestone = typeof uniRoadmapMilestones.$inferInsert;

// -- Workflow Engine ------------------------------------------------------------
// Immutable log of every cross-module trigger fired by the workflow engine.
// triggerType: research_completed | audit_failed | supplier_approved
// status: pending | success | failed | skipped
export const workflowTriggerLog = pgTable("workflowTriggerLog", {
  id:               serial("id").primaryKey(),
  triggerType:      varchar("triggerType", { length: 64 }).notNull(),
  sourceModule:     varchar("sourceModule", { length: 64 }).notNull(),
  sourceRecordId:   integer("sourceRecordId").notNull(),
  targetModule:     varchar("targetModule", { length: 64 }),
  targetRecordId:   integer("targetRecordId"),
  ventureId:        varchar("ventureId", { length: 64 }),
  offeringId:       varchar("offeringId", { length: 36 }),
  status:           varchar("status", { length: 16 }).notNull().default("pending"),
  payload:          text("payload"),
  result:           text("result"),
  error:            text("error"),
  retriedFrom:      integer("retriedFrom"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type WorkflowTriggerLog = typeof workflowTriggerLog.$inferSelect;
export type InsertWorkflowTriggerLog = typeof workflowTriggerLog.$inferInsert;

// -- Data Management Module -----------------------------------------------------
// Section 8: Data ingestion, validation, quality scoring, AI integration
// Section 9: RAG pipelines, fine-tuning, context engineering, feedback loops

// -- Data Assets ---------------------------------------------------------------
// Central catalogue of all data assets used across the platform.
// assetType: structured | unstructured | semi_structured | time_series | media
// sourceType: manual_upload | api_feed | database_export | web_scrape | sensor | survey | interview
// format: csv | json | xlsx | pdf | docx | mp3 | mp4 | image | parquet | other
// status: draft | ingested | validated | published | archived | error
export const dmDataAssets = pgTable("dmDataAssets", {
  id:             serial("id").primaryKey(),
  ventureId:      varchar("ventureId", { length: 64 }),
  name:           varchar("name", { length: 255 }).notNull(),
  description:    text("description"),
  assetType:      varchar("assetType", { length: 32 }).notNull().default("structured"),
  sourceType:     varchar("sourceType", { length: 32 }).notNull().default("manual_upload"),
  format:         varchar("format", { length: 32 }).notNull().default("csv"),
  sizeKb:         integer("sizeKb"),
  rowCount:       integer("rowCount"),
  columnCount:    integer("columnCount"),
  storageUrl:     text("storageUrl"),
  storageKey:     varchar("storageKey", { length: 512 }),
  tags:           text("tags"),                // JSON array of strings
  schema:         text("schema"),              // JSON describing columns/fields
  sampleData:     text("sampleData"),          // JSON preview rows
  status:         varchar("status", { length: 32 }).notNull().default("draft"),
  linkedModule:   varchar("linkedModule", { length: 64 }),  // e.g. "universityPlaybook", "chinaManufacturing"
  linkedRecordId: integer("linkedRecordId"),
  overallQuality: doublePrecision("overallQuality"),     // 0-100 computed score
  lastValidated:  timestamp("lastValidated"),
  ingestedBy:     varchar("ingestedBy", { length: 128 }),
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().notNull(),
});
export type DmDataAsset = typeof dmDataAssets.$inferSelect;
export type InsertDmDataAsset = typeof dmDataAssets.$inferInsert;

// -- Quality Scores -------------------------------------------------------------
// Per-asset quality dimension scores and issue flags.
// Each row is one quality assessment snapshot for one asset.
export const dmQualityScores = pgTable("dmQualityScores", {
  id:               serial("id").primaryKey(),
  assetId:          integer("assetId").notNull(),
  completeness:     doublePrecision("completeness"),     // 0-100: % non-null fields
  accuracy:         doublePrecision("accuracy"),         // 0-100: validated against rules
  freshness:        doublePrecision("freshness"),        // 0-100: recency score
  consistency:      doublePrecision("consistency"),      // 0-100: cross-field consistency
  uniqueness:       doublePrecision("uniqueness"),       // 0-100: deduplication score
  validity:         doublePrecision("validity"),         // 0-100: format/type conformance
  overallScore:     doublePrecision("overallScore"),     // weighted average
  issues:           text("issues"),            // JSON array of issue objects {field, type, count, severity}
  recommendations:  text("recommendations"),  // JSON array of fix suggestions
  assessedBy:       varchar("assessedBy", { length: 32 }).notNull().default("manual"), // manual | ai | automated
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type DmQualityScore = typeof dmQualityScores.$inferSelect;
export type InsertDmQualityScore = typeof dmQualityScores.$inferInsert;

// -- AI Pipelines ---------------------------------------------------------------
// Configuration and metadata for AI processing pipelines.
// pipelineType: classification | extraction | generation | summarisation | embedding | scoring | routing
// status: draft | active | paused | deprecated | error
export const dmAiPipelines = pgTable("dmAiPipelines", {
  id:               serial("id").primaryKey(),
  ventureId:        varchar("ventureId", { length: 64 }),
  name:             varchar("name", { length: 255 }).notNull(),
  description:      text("description"),
  pipelineType:     varchar("pipelineType", { length: 32 }).notNull().default("generation"),
  model:            varchar("model", { length: 128 }),
  promptTemplate:   text("promptTemplate"),
  systemPrompt:     text("systemPrompt"),
  inputSchema:      text("inputSchema"),       // JSON schema for expected inputs
  outputSchema:     text("outputSchema"),      // JSON schema for expected outputs
  temperature:      doublePrecision("temperature"),
  maxTokens:        integer("maxTokens"),
  topP:             doublePrecision("topP"),
  linkedAssetIds:   text("linkedAssetIds"),    // JSON array of dmDataAssets.id
  linkedModule:     varchar("linkedModule", { length: 64 }),
  status:           varchar("status", { length: 32 }).notNull().default("draft"),
  totalRuns:        integer("totalRuns").notNull().default(0),
  successRate:      doublePrecision("successRate"),
  avgLatencyMs:     integer("avgLatencyMs"),
  avgTokensUsed:    integer("avgTokensUsed"),
  estimatedCostUsd: doublePrecision("estimatedCostUsd"),
  version:          varchar("version", { length: 32 }).notNull().default("1.0"),
  tags:             text("tags"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type DmAiPipeline = typeof dmAiPipelines.$inferSelect;
export type InsertDmAiPipeline = typeof dmAiPipelines.$inferInsert;

// -- Pipeline Runs --------------------------------------------------------------
// Immutable run history for each AI pipeline execution.
// status: running | success | failed | cancelled | timeout
export const dmPipelineRuns = pgTable("dmPipelineRuns", {
  id:             serial("id").primaryKey(),
  pipelineId:     integer("pipelineId").notNull(),
  ventureId:      varchar("ventureId", { length: 64 }),
  status:         varchar("status", { length: 16 }).notNull().default("running"),
  inputPayload:   text("inputPayload"),        // JSON
  outputPayload:  text("outputPayload"),       // JSON
  tokensUsed:     integer("tokensUsed"),
  latencyMs:      integer("latencyMs"),
  costUsd:        doublePrecision("costUsd"),
  errorMessage:   text("errorMessage"),
  triggeredBy:    varchar("triggeredBy", { length: 64 }), // user | workflow | schedule | api
  triggeredById:  varchar("triggeredById", { length: 128 }),
  startedAt:      timestamp("startedAt").defaultNow().notNull(),
  completedAt:    timestamp("completedAt"),
});
export type DmPipelineRun = typeof dmPipelineRuns.$inferSelect;
export type InsertDmPipelineRun = typeof dmPipelineRuns.$inferInsert;

// -- RAG Pipelines --------------------------------------------------------------
// Retrieval-Augmented Generation pipeline configurations.
// retrievalStrategy: similarity | mmr | hybrid | keyword | rerank
// embeddingModel: text-embedding-3-small | text-embedding-3-large | ada-002
// status: draft | indexing | ready | error | stale
export const dmRagPipelines = pgTable("dmRagPipelines", {
  id:                 serial("id").primaryKey(),
  ventureId:          varchar("ventureId", { length: 64 }),
  name:               varchar("name", { length: 255 }).notNull(),
  description:        text("description"),
  embeddingModel:     varchar("embeddingModel", { length: 128 }).notNull().default("text-embedding-3-small"),
  chunkSize:          integer("chunkSize").notNull().default(512),
  chunkOverlap:       integer("chunkOverlap").notNull().default(64),
  retrievalStrategy:  varchar("retrievalStrategy", { length: 32 }).notNull().default("similarity"),
  topK:               integer("topK").notNull().default(5),
  similarityThreshold: doublePrecision("similarityThreshold").default(0.7),
  systemPrompt:       text("systemPrompt"),
  contextTemplate:    text("contextTemplate"),  // How retrieved docs are injected into prompt
  rerankModel:        varchar("rerankModel", { length: 128 }),
  linkedAssetIds:     text("linkedAssetIds"),   // JSON array of dmDataAssets.id
  documentCount:      integer("documentCount").notNull().default(0),
  chunkCount:         integer("chunkCount").notNull().default(0),
  status:             varchar("status", { length: 16 }).notNull().default("draft"),
  lastIndexedAt:      timestamp("lastIndexedAt"),
  avgRetrievalMs:     integer("avgRetrievalMs"),
  totalQueries:       integer("totalQueries").notNull().default(0),
  avgRelevanceScore:  doublePrecision("avgRelevanceScore"),
  tags:               text("tags"),
  notes:              text("notes"),
  createdAt:          timestamp("createdAt").defaultNow().notNull(),
  updatedAt:          timestamp("updatedAt").defaultNow().notNull(),
});
export type DmRagPipeline = typeof dmRagPipelines.$inferSelect;
export type InsertDmRagPipeline = typeof dmRagPipelines.$inferInsert;

// -- RAG Documents --------------------------------------------------------------
// Individual documents registered in a RAG pipeline's document store.
// status: pending | indexed | failed | excluded
export const dmRagDocuments = pgTable("dmRagDocuments", {
  id:           serial("id").primaryKey(),
  ragPipelineId: integer("ragPipelineId").notNull(),
  assetId:      integer("assetId"),               // optional link to dmDataAssets
  title:        varchar("title", { length: 255 }).notNull(),
  contentType:  varchar("contentType", { length: 32 }).notNull().default("text"), // text | pdf | docx | url | code
  storageUrl:   text("storageUrl"),
  storageKey:   varchar("storageKey", { length: 512 }),
  chunkCount:   integer("chunkCount").notNull().default(0),
  sizeKb:       integer("sizeKb"),
  status:       varchar("status", { length: 16 }).notNull().default("pending"),
  indexedAt:    timestamp("indexedAt"),
  metadata:     text("metadata"),             // JSON: author, date, source, tags
  notes:        text("notes"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type DmRagDocument = typeof dmRagDocuments.$inferSelect;
export type InsertDmRagDocument = typeof dmRagDocuments.$inferInsert;

// -- Fine-Tuning Jobs -----------------------------------------------------------
// Tracks fine-tuning job lifecycle from dataset prep to model deployment.
// status: draft | preparing | training | evaluating | completed | failed | cancelled
export const dmFineTuningJobs = pgTable("dmFineTuningJobs", {
  id:               serial("id").primaryKey(),
  ventureId:        varchar("ventureId", { length: 64 }),
  name:             varchar("name", { length: 255 }).notNull(),
  description:      text("description"),
  baseModel:        varchar("baseModel", { length: 128 }).notNull(),
  targetTask:       varchar("targetTask", { length: 128 }),  // e.g. "interview summarisation"
  datasetId:        integer("datasetId"),
  trainingSamples:  integer("trainingSamples"),
  validationSamples: integer("validationSamples"),
  epochs:           integer("epochs"),
  learningRate:     doublePrecision("learningRate"),
  batchSize:        integer("batchSize"),
  trainLoss:        doublePrecision("trainLoss"),
  valLoss:          doublePrecision("valLoss"),
  accuracy:         doublePrecision("accuracy"),
  fineTunedModelId: varchar("fineTunedModelId", { length: 255 }), // provider model ID
  status:           varchar("status", { length: 16 }).notNull().default("draft"),
  startedAt:        timestamp("startedAt"),
  completedAt:      timestamp("completedAt"),
  estimatedCostUsd: doublePrecision("estimatedCostUsd"),
  actualCostUsd:    doublePrecision("actualCostUsd"),
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type DmFineTuningJob = typeof dmFineTuningJobs.$inferSelect;
export type InsertDmFineTuningJob = typeof dmFineTuningJobs.$inferInsert;

// -- Fine-Tuning Datasets -------------------------------------------------------
// Training data collections used for fine-tuning jobs.
// splitType: train_only | train_val | train_val_test
// status: draft | labelling | ready | archived
export const dmFineTuningDatasets = pgTable("dmFineTuningDatasets", {
  id:             serial("id").primaryKey(),
  ventureId:      varchar("ventureId", { length: 64 }),
  name:           varchar("name", { length: 255 }).notNull(),
  description:    text("description"),
  taskType:       varchar("taskType", { length: 64 }),  // classification | generation | summarisation | extraction
  totalSamples:   integer("totalSamples").notNull().default(0),
  labelledSamples: integer("labelledSamples").notNull().default(0),
  trainSplit:     doublePrecision("trainSplit").notNull().default(0.8),
  valSplit:       doublePrecision("valSplit").notNull().default(0.1),
  testSplit:      doublePrecision("testSplit").notNull().default(0.1),
  storageUrl:     text("storageUrl"),
  storageKey:     varchar("storageKey", { length: 512 }),
  format:         varchar("format", { length: 32 }).notNull().default("jsonl"), // jsonl | csv | parquet
  linkedAssetIds: text("linkedAssetIds"),
  status:         varchar("status", { length: 16 }).notNull().default("draft"),
  qualityScore:   doublePrecision("qualityScore"),
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().notNull(),
});
export type DmFineTuningDataset = typeof dmFineTuningDatasets.$inferSelect;
export type InsertDmFineTuningDataset = typeof dmFineTuningDatasets.$inferInsert;

// -- Feedback Entries -----------------------------------------------------------
// User feedback on AI-generated outputs - powers the feedback loop for model improvement.
// feedbackType: thumbs_up | thumbs_down | rating | correction | flag
// status: open | reviewed | actioned | dismissed
export const dmFeedbackEntries = pgTable("dmFeedbackEntries", {
  id:               serial("id").primaryKey(),
  pipelineId:       integer("pipelineId"),         // optional link to dmAiPipelines
  runId:            integer("runId"),              // optional link to dmPipelineRuns
  ragPipelineId:    integer("ragPipelineId"),      // optional link to dmRagPipelines
  ventureId:        varchar("ventureId", { length: 64 }),
  feedbackType:     varchar("feedbackType", { length: 32 }).notNull().default("rating"),
  rating:           integer("rating"),             // 1-5 stars
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
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type DmFeedbackEntry = typeof dmFeedbackEntries.$inferSelect;
export type InsertDmFeedbackEntry = typeof dmFeedbackEntries.$inferInsert;

// --- COMMERCIAL CRM -----------------------------------------------------------

export const crmPipelines = pgTable("crmPipelines", {
  id:          serial("id").primaryKey(),
  ventureId:   varchar("ventureId", { length: 36 }),
  offeringId:  varchar("offeringId", { length: 36 }),
  name:        varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isDefault:   boolean("isDefault").default(false),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().notNull(),
});
export type CrmPipeline = typeof crmPipelines.$inferSelect;
export type InsertCrmPipeline = typeof crmPipelines.$inferInsert;

export const crmPipelineStages = pgTable("crmPipelineStages", {
  id:          serial("id").primaryKey(),
  pipelineId:   varchar("pipelineId", { length: 36 }).notNull(),
  name:         varchar("name", { length: 100 }).notNull(),
  order:        integer("order").notNull().default(0),
  probability:  integer("probability").default(0), // 0-100 win probability %
  color:        varchar("color", { length: 20 }).default("#6b7280"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type CrmPipelineStage = typeof crmPipelineStages.$inferSelect;
export type InsertCrmPipelineStage = typeof crmPipelineStages.$inferInsert;

export const crmContacts = pgTable("crmContacts", {
  id:          serial("id").primaryKey(),
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
  lastContactedAt: integer("lastContactedAt"),
  nextFollowUpAt:  integer("nextFollowUpAt"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type CrmContact = typeof crmContacts.$inferSelect;
export type InsertCrmContact = typeof crmContacts.$inferInsert;

export const crmLeads = pgTable("crmLeads", {
  id:          serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 36 }),
  contactId:       varchar("contactId", { length: 36 }),
  title:           varchar("title", { length: 255 }).notNull(),
  company:         varchar("company", { length: 255 }),
  source:          varchar("source", { length: 100 }), // referral | linkedin | event | inbound | cold_outreach | partner | other
  status:          varchar("status", { length: 50 }).default("new"), // new | contacted | qualified | unqualified | converted
  score:           integer("score").default(0), // 0-100 lead score
  estimatedValue:  integer("estimatedValue").default(0), // -
  assignedTo:      varchar("assignedTo", { length: 100 }),
  nextAction:      varchar("nextAction", { length: 255 }),
  nextActionDate:  integer("nextActionDate"),
  notes:           text("notes"),
  convertedDealId: varchar("convertedDealId", { length: 36 }),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type CrmLead = typeof crmLeads.$inferSelect;
export type InsertCrmLead = typeof crmLeads.$inferInsert;

export const crmDeals = pgTable("crmDeals", {
  id:          serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 36 }),
  pipelineId:      varchar("pipelineId", { length: 36 }),
  stageId:         varchar("stageId", { length: 36 }),
  contactId:       varchar("contactId", { length: 36 }),
  title:           varchar("title", { length: 255 }).notNull(),
  company:         varchar("company", { length: 255 }),
  value:           integer("value").default(0), // -
  currency:        varchar("currency", { length: 10 }).default("GBP"),
  probability:     integer("probability").default(0), // 0-100 %
  expectedCloseAt: integer("expectedCloseAt"),
  closedAt:        integer("closedAt"),
  status:          varchar("status", { length: 50 }).default("open"), // open | won | lost | on_hold
  lostReason:      varchar("lostReason", { length: 255 }),
  assignedTo:      varchar("assignedTo", { length: 100 }),
  tags:            text("tags"), // JSON array
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type CrmDeal = typeof crmDeals.$inferSelect;
export type InsertCrmDeal = typeof crmDeals.$inferInsert;

export const crmActivities = pgTable("crmActivities", {
  id:          serial("id").primaryKey(),
  ventureId:   varchar("ventureId", { length: 36 }),
  contactId:   varchar("contactId", { length: 36 }),
  dealId:      varchar("dealId", { length: 36 }),
  leadId:      varchar("leadId", { length: 36 }),
  type:        varchar("type", { length: 50 }).notNull(), // call | email | meeting | demo | proposal | follow_up | note | task
  subject:     varchar("subject", { length: 255 }).notNull(),
  description: text("description"),
  outcome:     varchar("outcome", { length: 255 }),
  dueAt:       integer("dueAt"),
  completedAt: integer("completedAt"),
  status:      varchar("status", { length: 50 }).default("pending"), // pending | completed | cancelled
  assignedTo:  varchar("assignedTo", { length: 100 }),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().notNull(),
});
export type CrmActivity = typeof crmActivities.$inferSelect;
export type InsertCrmActivity = typeof crmActivities.$inferInsert;

// --- INVESTOR CRM -------------------------------------------------------------

export const invContacts = pgTable("invContacts", {
  id:          serial("id").primaryKey(),
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
  minChequeSize:    integer("minChequeSize").default(0), // -
  maxChequeSize:    integer("maxChequeSize").default(0), // -
  preferredStage:   varchar("preferredStage", { length: 100 }), // pre-seed | seed | series-a | series-b | growth
  relationshipStatus: varchar("relationshipStatus", { length: 50 }).default("prospect"), // prospect | contacted | meeting_scheduled | term_sheet | invested | passed | on_hold
  warmIntro:        boolean("warmIntro").default(false),
  introSource:      varchar("introSource", { length: 255 }),
  lastContactedAt:  integer("lastContactedAt"),
  nextFollowUpAt:   integer("nextFollowUpAt"),
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type InvContact = typeof invContacts.$inferSelect;
export type InsertInvContact = typeof invContacts.$inferInsert;

export const invFundingRounds = pgTable("invFundingRounds", {
  id:          serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 36 }).notNull(),
  name:            varchar("name", { length: 255 }).notNull(), // e.g. "Pre-Seed Round", "Seed Round A"
  roundType:       varchar("roundType", { length: 50 }).notNull(), // pre_seed | seed | series_a | series_b | bridge | convertible_note | safe | grant | crowdfunding
  targetAmount:    integer("targetAmount").default(0), // -
  raisedAmount:    integer("raisedAmount").default(0), // -
  preMoneyVal:     integer("preMoneyVal").default(0), // -
  postMoneyVal:    integer("postMoneyVal").default(0), // -
  equityOffered:   integer("equityOffered").default(0), // %
  status:          varchar("status", { length: 50 }).default("planning"), // planning | open | closing | closed | cancelled
  openedAt:        integer("openedAt"),
  targetCloseAt:   integer("targetCloseAt"),
  closedAt:        integer("closedAt"),
  leadInvestor:    varchar("leadInvestor", { length: 255 }),
  useOfFunds:      text("useOfFunds"), // JSON breakdown
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type InvFundingRound = typeof invFundingRounds.$inferSelect;
export type InsertInvFundingRound = typeof invFundingRounds.$inferInsert;

export const invTermSheets = pgTable("invTermSheets", {
  id:          serial("id").primaryKey(),
  roundId:           varchar("roundId", { length: 36 }).notNull(),
  ventureId:         varchar("ventureId", { length: 36 }).notNull(),
  investorContactId: varchar("investorContactId", { length: 36 }),
  investorName:      varchar("investorName", { length: 255 }).notNull(),
  investmentAmount:  integer("investmentAmount").default(0), // -
  preMoneyVal:       integer("preMoneyVal").default(0), // -
  equityPercent:     integer("equityPercent").default(0), // %
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
  receivedAt:        integer("receivedAt"),
  expiresAt:         integer("expiresAt"),
  signedAt:          integer("signedAt"),
  documentUrl:       varchar("documentUrl", { length: 1000 }),
  notes:             text("notes"),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
  updatedAt:         timestamp("updatedAt").defaultNow().notNull(),
});
export type InvTermSheet = typeof invTermSheets.$inferSelect;
export type InsertInvTermSheet = typeof invTermSheets.$inferInsert;

export const invCapTable = pgTable("invCapTable", {
  id:          serial("id").primaryKey(),
  ventureId:        varchar("ventureId", { length: 36 }).notNull(),
  roundId:          varchar("roundId", { length: 36 }),
  shareholderName:  varchar("shareholderName", { length: 255 }).notNull(),
  shareholderType:  varchar("shareholderType", { length: 50 }).default("founder"), // founder | investor | employee | advisor | esop_pool | other
  shareClass:       varchar("shareClass", { length: 50 }).default("ordinary"), // ordinary | preference | seed | series_a | option | warrant
  numberOfShares:   integer("numberOfShares").default(0),
  ownershipPercent: integer("ownershipPercent").default(0), // stored as basis points (100 = 1%)
  pricePerShare:    integer("pricePerShare").default(0), // pence
  investmentAmount: integer("investmentAmount").default(0), // -
  vestingStart:     integer("vestingStart"),
  vestingCliff:     integer("vestingCliff").default(0), // months
  vestingPeriod:    integer("vestingPeriod").default(0), // months
  fullyDiluted:     boolean("fullyDiluted").default(true),
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type InvCapTableEntry = typeof invCapTable.$inferSelect;
export type InsertInvCapTableEntry = typeof invCapTable.$inferInsert;

export const invDueDiligence = pgTable("invDueDiligence", {
  id:          serial("id").primaryKey(),
  roundId:      varchar("roundId", { length: 36 }).notNull(),
  ventureId:    varchar("ventureId", { length: 36 }).notNull(),
  category:     varchar("category", { length: 50 }).notNull(), // legal | financial | technical | commercial | team | ip | regulatory
  itemName:     varchar("itemName", { length: 255 }).notNull(),
  description:  text("description"),
  status:       varchar("status", { length: 50 }).default("pending"), // pending | in_progress | completed | waived | flagged
  priority:     varchar("priority", { length: 20 }).default("medium"), // low | medium | high | critical
  assignedTo:   varchar("assignedTo", { length: 100 }),
  documentUrl:  varchar("documentUrl", { length: 1000 }),
  dueAt:        integer("dueAt"),
  completedAt:  integer("completedAt"),
  notes:        text("notes"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});
export type InvDueDiligenceItem = typeof invDueDiligence.$inferSelect;
export type InsertInvDueDiligenceItem = typeof invDueDiligence.$inferInsert;

export const invUpdates = pgTable("invUpdates", {
  id:          serial("id").primaryKey(),
  ventureId:    varchar("ventureId", { length: 36 }).notNull(),
  roundId:      varchar("roundId", { length: 36 }),
  title:        varchar("title", { length: 255 }).notNull(),
  updateType:   varchar("updateType", { length: 50 }).default("monthly"), // monthly | quarterly | milestone | ad_hoc | agm
  content:      text("content").notNull(), // markdown
  keyMetrics:   text("keyMetrics"), // JSON: { mrr, runway, headcount, trl, vrl }
  sentAt:       integer("sentAt"),
  recipients:   text("recipients"), // JSON array of investor contact IDs
  status:       varchar("status", { length: 50 }).default("draft"), // draft | sent | archived
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});
export type InvUpdate = typeof invUpdates.$inferSelect;
export type InsertInvUpdate = typeof invUpdates.$inferInsert;

// -------------------------------------------------------------------------------
// SPRINT 51 - GOVERNANCE & RBAC
// Tables: auditLog, venturePermissions, governancePolicies, complianceChecks, riskRegister
// -------------------------------------------------------------------------------

// -- Audit Log -----------------------------------------------------------------
export const auditLog = pgTable("auditLog", {
  id:           serial("id").primaryKey(),
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

// -- Venture Permissions -------------------------------------------------------
export const venturePermissions = pgTable("venturePermissions", {
  id:        serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  userId:    varchar("userId", { length: 64 }).notNull(),
  role:      text("role").notNull().default("viewer"),
  grantedBy: varchar("grantedBy", { length: 64 }),
  expiresAt: timestamp("expiresAt"),
  notes:     text("notes"),
  isActive:  integer("isActive").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type VenturePermission = typeof venturePermissions.$inferSelect;
export type InsertVenturePermission = typeof venturePermissions.$inferInsert;

// -- Governance Policies -------------------------------------------------------
export const governancePolicies = pgTable("governancePolicies", {
  id:              serial("id").primaryKey(),
  policyName:      varchar("policyName", { length: 255 }).notNull(),
  module:          varchar("module", { length: 64 }).notNull(),
  allowedRoles:    text("allowedRoles").notNull(),
  permissionLevel: text("permissionLevel").notNull().default("read"),
  description:     text("description"),
  isActive:        integer("isActive").default(1),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type GovernancePolicy = typeof governancePolicies.$inferSelect;
export type InsertGovernancePolicy = typeof governancePolicies.$inferInsert;

// -- Compliance Checks ---------------------------------------------------------
export const complianceChecks = pgTable("complianceChecks", {
  id:           serial("id").primaryKey(),
  ventureId:    varchar("ventureId", { length: 64 }),
  framework:    varchar("framework", { length: 128 }).notNull(),
  requirement:  varchar("requirement", { length: 512 }).notNull(),
  status:       text("status").default("not_started"),
  owner:        varchar("owner", { length: 255 }),
  dueDate:      varchar("dueDate", { length: 32 }),
  evidenceUrl:  text("evidenceUrl"),
  notes:        text("notes"),
  lastReviewed: timestamp("lastReviewed"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});
export type ComplianceCheck = typeof complianceChecks.$inferSelect;
export type InsertComplianceCheck = typeof complianceChecks.$inferInsert;

// -- Risk Register -------------------------------------------------------------
export const riskRegister = pgTable("riskRegister", {
  id:              serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }),
  title:           varchar("title", { length: 512 }).notNull(),
  category:        text("category").notNull().default("operational"),
  likelihood:      integer("likelihood").default(3),
  impact:          integer("impact").default(3),
  riskScore:       integer("riskScore"),
  status:          text("status").default("open"),
  owner:           varchar("owner", { length: 255 }),
  mitigationPlan:  text("mitigationPlan"),
  residualRisk:    integer("residualRisk"),
  reviewDate:      varchar("reviewDate", { length: 32 }),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type RiskRegisterEntry = typeof riskRegister.$inferSelect;
export type InsertRiskRegisterEntry = typeof riskRegister.$inferInsert;
// Sprint 52 - Financial Model Builder schema additions
// Append to drizzle/schema.ts

// -- P&L Lines -----------------------------------------------------------------
export const finPlLines = pgTable("finPlLines", {
  id:          serial("id").primaryKey(),
  ventureId:   varchar("ventureId", { length: 64 }),
  category:    text("category").notNull().default("revenue"),
  lineItem:    varchar("lineItem", { length: 255 }).notNull(),
  year1:       integer("year1").default(0),
  year2:       integer("year2").default(0),
  year3:       integer("year3").default(0),
  year4:       integer("year4").default(0),
  year5:       integer("year5").default(0),
  unit:        varchar("unit", { length: 32 }).default("GBP"),
  notes:       text("notes"),
  sortOrder:   integer("sortOrder").default(0),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().notNull(),
});
export type FinPlLine = typeof finPlLines.$inferSelect;
export type InsertFinPlLine = typeof finPlLines.$inferInsert;

// -- Runway Scenarios ----------------------------------------------------------
export const finRunwayScenarios = pgTable("finRunwayScenarios", {
  id:              serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }),
  name:            varchar("name", { length: 255 }).notNull(),
  cashBalance:     integer("cashBalance").default(0),
  monthlyBurn:     integer("monthlyBurn").default(0),
  monthlyRevenue:  integer("monthlyRevenue").default(0),
  growthRate:      integer("growthRate").default(0),
  runwayMonths:    integer("runwayMonths"),
  breakEvenMonth:  integer("breakEvenMonth"),
  scenario:        text("scenario").default("base"),
  assumptions:     text("assumptions"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type FinRunwayScenario = typeof finRunwayScenarios.$inferSelect;
export type InsertFinRunwayScenario = typeof finRunwayScenarios.$inferInsert;

// -- Exit Waterfall ------------------------------------------------------------
export const finExitWaterfall = pgTable("finExitWaterfall", {
  id:                  serial("id").primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }),
  exitValuation:       integer("exitValuation").default(0),
  exitType:            text("exitType").default("acquisition"),
  preMoneyValuation:   integer("preMoneyValuation").default(0),
  totalInvested:       integer("totalInvested").default(0),
  liquidationPref:     text("liquidationPref").default("1x_non_participating"),
  antiDilution:        text("antiDilution").default("none"),
  notes:               text("notes"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().notNull(),
});
export type FinExitWaterfall = typeof finExitWaterfall.$inferSelect;
export type InsertFinExitWaterfall = typeof finExitWaterfall.$inferInsert;

// -- Waterfall Tranches --------------------------------------------------------
export const finWaterfallTranches = pgTable("finWaterfallTranches", {
  id:            serial("id").primaryKey(),
  waterfallId:   integer("waterfallId").notNull(),
  investorName:  varchar("investorName", { length: 255 }).notNull(),
  investorType:  text("investorType").default("angel"),
  shares:        integer("shares").default(0),
  ownershipPct:  integer("ownershipPct").default(0),
  invested:      integer("invested").default(0),
  pref:          text("pref").default("common"),
  sortOrder:     integer("sortOrder").default(0),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
});
export type FinWaterfallTranche = typeof finWaterfallTranches.$inferSelect;
export type InsertFinWaterfallTranche = typeof finWaterfallTranches.$inferInsert;

// -- Investor Report Packs -----------------------------------------------------
export const finInvestorReports = pgTable("finInvestorReports", {
  id:           serial("id").primaryKey(),
  ventureId:    varchar("ventureId", { length: 64 }),
  title:        varchar("title", { length: 255 }).notNull(),
  period:       varchar("period", { length: 64 }),
  reportType:   text("reportType").default("monthly"),
  status:       text("status").default("draft"),
  highlights:   text("highlights"),
  challenges:   text("challenges"),
  nextSteps:    text("nextSteps"),
  kpiSnapshot:  text("kpiSnapshot"),
  generatedBy:  varchar("generatedBy", { length: 255 }),
  sentAt:       timestamp("sentAt"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});
export type FinInvestorReport = typeof finInvestorReports.$inferSelect;
export type InsertFinInvestorReport = typeof finInvestorReports.$inferInsert;

// -- Unit Economics ------------------------------------------------------------
export const finUnitEconomics = pgTable("finUnitEconomics", {
  id:              serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }),
  period:          varchar("period", { length: 32 }),
  cac:             integer("cac").default(0),
  ltv:             integer("ltv").default(0),
  arpu:            integer("arpu").default(0),
  churnRate:       integer("churnRate").default(0),
  grossMargin:     integer("grossMargin").default(0),
  paybackMonths:   integer("paybackMonths"),
  ltvCacRatio:     integer("ltvCacRatio"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type FinUnitEconomics = typeof finUnitEconomics.$inferSelect;
export type InsertFinUnitEconomics = typeof finUnitEconomics.$inferInsert;

// -------------------------------------------------------------------------------
// SPRINT 56 - Marketing Strategy, Brand Readiness & PR/Newsletter
// -------------------------------------------------------------------------------

// -- Marketing Campaigns -------------------------------------------------------
export const marketingCampaigns = pgTable("marketingCampaigns", {
  id:              serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  name:            varchar("name", { length: 255 }).notNull(),
  channel:         varchar("channel", { length: 64 }).notNull(),
  status:          varchar("status", { length: 32 }).notNull().default("Planned"),
  budget:          integer("budget").default(0),
  spent:           integer("spent").default(0),
  leads:           integer("leads").default(0),
  conversions:     integer("conversions").default(0),
  startDate:       varchar("startDate", { length: 32 }),
  endDate:         varchar("endDate", { length: 32 }),
  objective:       text("objective"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type InsertMarketingCampaign = typeof marketingCampaigns.$inferInsert;

// -- Marketing Channel Scores --------------------------------------------------
export const marketingChannelScores = pgTable("marketingChannelScores", {
  id:              serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  channel:         varchar("channel", { length: 64 }).notNull(),
  score:           integer("score").default(0),
  period:          varchar("period", { length: 32 }),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type MarketingChannelScore = typeof marketingChannelScores.$inferSelect;
export type InsertMarketingChannelScore = typeof marketingChannelScores.$inferInsert;

// -- Brand Readiness Scores ----------------------------------------------------
export const brandReadinessScores = pgTable("brandReadinessScores", {
  id:              serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  dimension:       varchar("dimension", { length: 64 }).notNull(),
  score:           integer("score").default(0),
  notes:           text("notes"),
  assessedAt:      timestamp("assessedAt").defaultNow(),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type BrandReadinessScore = typeof brandReadinessScores.$inferSelect;
export type InsertBrandReadinessScore = typeof brandReadinessScores.$inferInsert;

// -- Brand Checklist Items -----------------------------------------------------
export const brandChecklistItems = pgTable("brandChecklistItems", {
  id:              serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  category:        varchar("category", { length: 64 }).notNull(),
  item:            varchar("item", { length: 255 }).notNull(),
  completed:       integer("completed").default(0),
  completedAt:     timestamp("completedAt"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type BrandChecklistItem = typeof brandChecklistItems.$inferSelect;
export type InsertBrandChecklistItem = typeof brandChecklistItems.$inferInsert;

// -- Press Releases ------------------------------------------------------------
export const pressReleases = pgTable("pressReleases", {
  id:              serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  title:           varchar("title", { length: 255 }).notNull(),
  summary:         text("summary"),
  status:          varchar("status", { length: 32 }).notNull().default("Draft"),
  publishedAt:     timestamp("publishedAt"),
  mediaOutlets:    text("mediaOutlets"),
  coverageLinks:   text("coverageLinks"),
  reach:           integer("reach").default(0),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type PressRelease = typeof pressReleases.$inferSelect;
export type InsertPressRelease = typeof pressReleases.$inferInsert;

// -- Newsletter Campaigns ------------------------------------------------------
export const newsletterCampaigns = pgTable("newsletterCampaigns", {
  id:              serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  subject:         varchar("subject", { length: 255 }).notNull(),
  previewText:     varchar("previewText", { length: 255 }),
  status:          varchar("status", { length: 32 }).notNull().default("Draft"),
  scheduledAt:     timestamp("scheduledAt"),
  sentAt:          timestamp("sentAt"),
  recipients:      integer("recipients").default(0),
  openRate:        integer("openRate").default(0),
  clickRate:       integer("clickRate").default(0),
  unsubscribes:    integer("unsubscribes").default(0),
  contentUrl:      varchar("contentUrl", { length: 512 }),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type NewsletterCampaign = typeof newsletterCampaigns.$inferSelect;
export type InsertNewsletterCampaign = typeof newsletterCampaigns.$inferInsert;

// -- Media Coverage ------------------------------------------------------------
export const mediaCoverage = pgTable("mediaCoverage", {
  id:              serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  outlet:          varchar("outlet", { length: 255 }).notNull(),
  headline:        varchar("headline", { length: 512 }).notNull(),
  url:             varchar("url", { length: 512 }),
  sentiment:       varchar("sentiment", { length: 32 }).default("neutral"),
  reach:           integer("reach").default(0),
  publishedAt:     timestamp("publishedAt"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type MediaCoverage = typeof mediaCoverage.$inferSelect;
export type InsertMediaCoverage = typeof mediaCoverage.$inferInsert;

// -- Sprint 57: Specialist Services -------------------------------------------
export const specialists = pgTable("specialists", {
  id:            serial("id").primaryKey(),
  name:          varchar("name", { length: 255 }).notNull(),
  role:          varchar("role", { length: 255 }).notNull(),
  category:      varchar("category", { length: 128 }).notNull(),
  rate:          varchar("rate", { length: 64 }).notNull().default("TBD"),
  availability:  varchar("availability", { length: 32 }).notNull().default("Available"),
  rating:        numeric("rating", { precision: 3, scale: 1 }).default("5.0"),
  completedJobs: integer("completedJobs").default(0),
  bio:           text("bio"),
  skills:        text("skills"),        // JSON array of strings
  portfolioUrl:  varchar("portfolioUrl", { length: 512 }),
  linkedinUrl:   varchar("linkedinUrl", { length: 512 }),
  isVerified:    boolean("isVerified").default(false),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().notNull(),
});
export type Specialist = typeof specialists.$inferSelect;
export type InsertSpecialist = typeof specialists.$inferInsert;

export const specialistCommissions = pgTable("specialistCommissions", {
  id:            serial("id").primaryKey(),
  ventureId:     varchar("ventureId", { length: 64 }).notNull(),
  specialistId:  integer("specialistId").notNull(),
  serviceTaskId: integer("serviceTaskId"),
  title:         varchar("title", { length: 255 }).notNull(),
  brief:         text("brief"),
  status:        varchar("status", { length: 32 }).notNull().default("Open"),
  budget:        numeric("budget", { precision: 10, scale: 2 }),
  agreedFee:     numeric("agreedFee", { precision: 10, scale: 2 }),
  platformFee:   numeric("platformFee", { precision: 10, scale: 2 }),
  startDate:     timestamp("startDate"),
  dueDate:       timestamp("dueDate"),
  completedAt:   timestamp("completedAt"),
  notes:         text("notes"),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().notNull(),
});
export type SpecialistCommission = typeof specialistCommissions.$inferSelect;
export type InsertSpecialistCommission = typeof specialistCommissions.$inferInsert;

export const specialistServiceTasks = pgTable("specialistServiceTasks", {
  id:           serial("id").primaryKey(),
  ventureId:    varchar("ventureId", { length: 64 }).notNull(),
  title:        varchar("title", { length: 255 }).notNull(),
  description:  text("description"),
  category:     varchar("category", { length: 128 }).notNull(),
  priority:     varchar("priority", { length: 32 }).notNull().default("Medium"),
  status:       varchar("status", { length: 32 }).notNull().default("Open"),
  brlStage:     integer("brlStage").default(1),
  estimatedHrs: numeric("estimatedHrs", { precision: 6, scale: 1 }),
  assignedTo:   integer("assignedTo"),    // FK to specialists.id
  dueDate:      timestamp("dueDate"),
  completedAt:  timestamp("completedAt"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});
export type SpecialistServiceTask = typeof specialistServiceTasks.$inferSelect;
export type InsertSpecialistServiceTask = typeof specialistServiceTasks.$inferInsert;

// -- Sprint 60: Founder Onboarding Submissions ------------------------------
export const founderOnboardingSubmissions = pgTable("founderOnboardingSubmissions", {
  id:                serial("id").primaryKey(),
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
  checkedCount:      integer("checkedCount").default(0),
  totalTasks:        integer("totalTasks").default(26),
  // Linked records created on completion
  talentProfileId:   integer("talentProfileId"),
  ventureId:         varchar("ventureId", { length: 64 }),
  // Status
  status:            varchar("status", { length: 32 }).notNull().default("Completed"),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
  updatedAt:         timestamp("updatedAt").defaultNow().notNull(),
});
export type FounderOnboardingSubmission = typeof founderOnboardingSubmissions.$inferSelect;
export type InsertFounderOnboardingSubmission = typeof founderOnboardingSubmissions.$inferInsert;

// -- Sprint 61: Venture - Portfolio - Offering Architecture -------------------

export const portfolios = pgTable("portfolios", {
  id:            varchar("id", { length: 64 }).primaryKey(),
  ventureId:     varchar("ventureId", { length: 64 }).notNull(),
  name:          varchar("name", { length: 128 }).notNull(),
  description:   text("description"),
  portfolioType: text("portfolioType").default("Mixed"),
  status:        text("portfolioStatus").default("Pre-Launch"),
  color:         varchar("color", { length: 32 }).default("#51AF37"),
  sortOrder:     integer("sortOrder").default(0),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().notNull(),
});
export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;

export const offerings = pgTable("offerings", {
  id:             varchar("id", { length: 64 }).primaryKey(),
  portfolioId:    varchar("portfolioId", { length: 64 }).notNull(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  name:           varchar("name", { length: 128 }).notNull(),
  description:    text("description"),
  offeringType:   text("offeringType").default("Physical Product"),
  offeringStatus: text("offeringStatus").default("Concept"),
  trl:            integer("trl").default(1),
  brlScore:       integer("brlScore").default(0),
  revenueModel:   text("revenueModel").default("B2B"),
  targetSegment:  text("targetSegment"),
  pricePoint:     numeric("pricePoint", { precision: 12, scale: 2 }),
  currency:       varchar("currency", { length: 8 }).default("GBP"),
  launchDate:     date("launchDate"),
  color:          varchar("color", { length: 32 }).default("#3A97D3"),
  logoUrl:        text("logoUrl"),
  tags:           text("tags"),
  sortOrder:      integer("sortOrder").default(0),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().notNull(),
});
export type Offering = typeof offerings.$inferSelect;
export type InsertOffering = typeof offerings.$inferInsert;

// -- Offering-level KPI snapshots ----------------------------------------------
export const offeringKpiSnapshots = pgTable("offeringKpiSnapshots", {
  id:              serial("id").primaryKey(),
  offeringId:      varchar("offeringId", { length: 64 }).notNull(),
  snapshotDate:    date("snapshotDate").notNull(),
  revenue:         numeric("revenue", { precision: 14, scale: 2 }),
  cogs:            numeric("cogs", { precision: 14, scale: 2 }),
  grossMargin:     doublePrecision("grossMargin"),
  unitsSold:       integer("unitsSold"),
  activeCustomers: integer("activeCustomers"),
  cac:             numeric("cac", { precision: 10, scale: 2 }),
  ltv:             numeric("ltv", { precision: 10, scale: 2 }),
  nps:             integer("nps"),
  trlAtSnapshot:   integer("trlAtSnapshot"),
  brlAtSnapshot:   integer("brlAtSnapshot"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type OfferingKpiSnapshot = typeof offeringKpiSnapshots.$inferSelect;

// -- Offering-level financial model -------------------------------------------
export const offeringFinancialModels = pgTable("offeringFinancialModels", {
  id:              serial("id").primaryKey(),
  offeringId:      varchar("offeringId", { length: 64 }).notNull(),
  modelName:       varchar("modelName", { length: 128 }).notNull().default("Base Case"),
  revenueYear1:    numeric("revenueYear1", { precision: 14, scale: 2 }),
  revenueYear2:    numeric("revenueYear2", { precision: 14, scale: 2 }),
  revenueYear3:    numeric("revenueYear3", { precision: 14, scale: 2 }),
  cogsPercent:     doublePrecision("cogsPercent"),
  opexMonthly:     numeric("opexMonthly", { precision: 12, scale: 2 }),
  breakEvenMonth:  integer("breakEvenMonth"),
  fundingRequired: numeric("fundingRequired", { precision: 14, scale: 2 }),
  assumptions:     text("assumptions"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type OfferingFinancialModel = typeof offeringFinancialModels.$inferSelect;

// -- Offering execution linkage tables (additive - no existing tables modified) -
export const offeringWorkflowLinks = pgTable("offeringWorkflowLinks", {
  id:           serial("id").primaryKey(),
  offeringId:   varchar("offeringId", { length: 64 }).notNull(),
  triggerLogId: integer("triggerLogId").notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});

export const offeringRevenueLinks = pgTable("offeringRevenueLinks", {
  id:           serial("id").primaryKey(),
  offeringId:   varchar("offeringId", { length: 64 }).notNull(),
  snapshotId:   integer("snapshotId").notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});

export const offeringSupplyChainLinks = pgTable("offeringSupplyChainLinks", {
  id:           serial("id").primaryKey(),
  offeringId:   varchar("offeringId", { length: 64 }).notNull(),
  projectId:    integer("projectId").notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});

export const offeringExperimentLinks = pgTable("offeringExperimentLinks", {
  id:           serial("id").primaryKey(),
  offeringId:   varchar("offeringId", { length: 64 }).notNull(),
  experimentId: integer("experimentId").notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});

export const offeringRiskLinks = pgTable("offeringRiskLinks", {
  id:           serial("id").primaryKey(),
  offeringId:   varchar("offeringId", { length: 64 }).notNull(),
  riskId:       integer("riskId").notNull(),
  riskType:     text("offeringRiskType").default("venture"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});

export const offeringMilestoneLinks = pgTable("offeringMilestoneLinks", {
  id:           serial("id").primaryKey(),
  offeringId:   varchar("offeringId", { length: 64 }).notNull(),
  milestoneId:  integer("milestoneId").notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});

export const offeringCrmLinks = pgTable("offeringCrmLinks", {
  id:           serial("id").primaryKey(),
  offeringId:   varchar("offeringId", { length: 64 }).notNull(),
  pipelineId:   integer("pipelineId"),
  dealId:       integer("dealId"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});

export const offeringAnalyticsLinks = pgTable("offeringAnalyticsLinks", {
  id:               serial("id").primaryKey(),
  offeringId:       varchar("offeringId", { length: 64 }).notNull(),
  marketAnalysisId: integer("marketAnalysisId"),
  reportId:         integer("reportId"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});

// -- University Approval Reports (Sprint 62) -----------------------------------
// Formal approval documents linking offering-level research, validation evidence,
// and academic partnerships for university/lecturer sign-off.
export const uniApprovalReports = pgTable("uniApprovalReports", {
  id:                   serial("id").primaryKey(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  offeringId:           varchar("offeringId", { length: 64 }),
  portfolioId:          varchar("portfolioId", { length: 64 }),
  title:                varchar("title", { length: 255 }).notNull(),
  reportType:           text("uniApprovalReportType").notNull().default("syllabus_approval"),
  status:               text("uniApprovalStatus").notNull().default("draft"),
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
  confidenceScore:      integer("confidenceScore"),
  submittedBy:          varchar("submittedBy", { length: 255 }),
  reviewedBy:           varchar("reviewedBy", { length: 255 }),
  approvedBy:           varchar("approvedBy", { length: 255 }),
  submittedAt:          integer("submittedAt"),
  reviewedAt:           integer("reviewedAt"),
  approvedAt:           integer("approvedAt"),
  reviewNotes:          text("reviewNotes"),
  linkedResearchIds:    text("linkedResearchIds"),
  linkedPartnerIds:     text("linkedPartnerIds"),
  linkedTalentIds:      text("linkedTalentIds"),
  linkedGovernanceIds:  text("linkedGovernanceIds"),
  h4Stage:              text("h4Stage").default("problem_definition"),
  vrlStage:             integer("vrlStage"),
  trlLevel:             integer("trlLevel"),
  brlScore:             integer("brlScore"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().notNull(),
});
export type UniApprovalReport = typeof uniApprovalReports.$inferSelect;
export type InsertUniApprovalReport = typeof uniApprovalReports.$inferInsert;

// -- Offering Research Links (Sprint 62) ---------------------------------------
export const offeringResearchLinks = pgTable("offeringResearchLinks", {
  id:                serial("id").primaryKey(),
  offeringId:        varchar("offeringId", { length: 64 }).notNull(),
  researchProjectId: integer("researchProjectId").notNull(),
  linkType:          text("offeringResearchLinkType").default("supporting"),
  notes:             text("notes"),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
});
export type OfferingResearchLink = typeof offeringResearchLinks.$inferSelect;
export type InsertOfferingResearchLink = typeof offeringResearchLinks.$inferInsert;

// -- Spin-Out Blueprints (Sprint 63) -------------------------------------------
// A Blueprint is created for a specific Offering (POI) and aggregates readiness
// signals from all Venture OS libraries. It gates the path to Execution Platform.
export const spinoutBlueprints = pgTable("spinoutBlueprints", {
  id:               serial("id").primaryKey(),
  offeringId:       varchar("offeringId", { length: 64 }).notNull(),
  portfolioId:      varchar("portfolioId", { length: 64 }).notNull(),
  ventureId:        varchar("ventureId", { length: 64 }).notNull(),
  title:            varchar("title", { length: 255 }).notNull(),
  talentScore:      integer("talentScore").default(0),
  supplyChainScore: integer("supplyChainScore").default(0),
  financeScore:     integer("financeScore").default(0),
  marketScore:      integer("marketScore").default(0),
  technologyScore:  integer("technologyScore").default(0),
  governanceScore:  integer("governanceScore").default(0),
  overallScore:     integer("overallScore").default(0),
  gateStatus:       text("blueprintGateStatus").default("not_ready"),
  spinoffConfigId:  integer("spinoffConfigId"),
  blueprintMarkdown:    text("blueprintMarkdown"),
  executionRoadmap:     text("executionRoadmap"),
  gapAnalysis:          text("gapAnalysis"),
  reviewedBy:       varchar("reviewedBy", { length: 128 }),
  reviewedAt:       timestamp("reviewedAt"),
  reviewNotes:      text("reviewNotes"),
  createdBy:        varchar("createdBy", { length: 128 }),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type SpinoutBlueprint = typeof spinoutBlueprints.$inferSelect;
export type InsertSpinoutBlueprint = typeof spinoutBlueprints.$inferInsert;

// -- Blueprint Library Links (Sprint 63) --------------------------------------
// Explicit links from a Blueprint to individual records in each Venture OS library.
export const blueprintLibraryLinks = pgTable("blueprintLibraryLinks", {
  id:             serial("id").primaryKey(),
  blueprintId:    integer("blueprintId").notNull(),
  domain:         text("blueprintLinkDomain").notNull(),
  linkedRecordId: varchar("linkedRecordId", { length: 64 }).notNull(),
  linkedRecordLabel: varchar("linkedRecordLabel", { length: 255 }),
  readinessWeight: integer("readinessWeight").default(10),
  linkStatus:     text("blueprintLinkStatus").default("proposed"),
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().notNull(),
});
export type BlueprintLibraryLink = typeof blueprintLibraryLinks.$inferSelect;
export type InsertBlueprintLibraryLink = typeof blueprintLibraryLinks.$inferInsert;

// --------------------------------------------------------------------------------
// -  CULTURAL READINESS LEVEL (CRL) MODULE                                       -
// -  Wasserman (2012): 65% of high-potential startups fail due to co-founder     -
// -  conflict. CRL provides systematic, AI-powered cultural alignment assessment. -
// --------------------------------------------------------------------------------

// -- CRL Assessments -----------------------------------------------------------
export const crlAssessments = pgTable("crl_assessments", {
  id:             serial("id").primaryKey(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  assessmentType: text("crlAssessmentType").notNull().default("initial"),
  status:         text("crlAssessmentStatus").notNull().default("initiated"),
  h4Stage:        text("crlH4Stage").notNull().default("H4.1_ideation"),
  overallAlignmentScore: doublePrecision("overallAlignmentScore"),
  visionScore:           doublePrecision("visionScore"),
  operationalScore:      doublePrecision("operationalScore"),
  conflictScore:         doublePrecision("conflictScore"),
  crlScore:              doublePrecision("crlScore"),
  crlLevel:              integer("crlLevel"),
  readinessLevel:        text("crlReadinessLevel"),
  confidenceScore:       doublePrecision("confidenceScore"),
  aiSummary:             text("aiSummary"),
  criticalMisalignments: text("criticalMisalignments"),
  actionPlan:            text("actionPlan"),
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
  updatedAt:  timestamp("updatedAt").defaultNow().notNull(),
});
export type CrlAssessment = typeof crlAssessments.$inferSelect;
export type InsertCrlAssessment = typeof crlAssessments.$inferInsert;

// -- CRL Founder Responses -----------------------------------------------------
export const crlFounderResponses = pgTable("crl_founder_responses", {
  id:             serial("id").primaryKey(),
  assessmentId:   integer("assessmentId").notNull(),
  founderId:      integer("founderId").notNull(),
  founderName:    varchar("founderName", { length: 128 }).notNull(),
  questionId:     varchar("questionId", { length: 16 }).notNull(),
  questionPhase:  text("crlQuestionPhase").notNull(),
  responseText:   text("responseText").notNull(),
  responseOption: varchar("responseOption", { length: 64 }),
  confidenceLevel: integer("confidenceLevel").default(3),
  submittedAt:    timestamp("submittedAt").defaultNow().notNull(),
});
export type CrlFounderResponse = typeof crlFounderResponses.$inferSelect;
export type InsertCrlFounderResponse = typeof crlFounderResponses.$inferInsert;

// -- CRL Interventions ---------------------------------------------------------
export const crlInterventions = pgTable("crl_interventions", {
  id:               serial("id").primaryKey(),
  ventureId:        varchar("ventureId", { length: 64 }).notNull(),
  assessmentId:     integer("assessmentId"),
  triggeredBy:      text("crlTriggerReason").notNull(),
  interventionType: text("crlInterventionType").notNull(),
  status:           text("crlInterventionStatus").default("scheduled"),
  participatingFounderIds: text("participatingFounderIds"),
  conversationLog:  text("conversationLog"),
  resolutionAchieved: boolean("resolutionAchieved").default(false),
  agreementsDocumented: text("agreementsDocumented"),
  followUpRequired: boolean("followUpRequired").default(false),
  followUpDate:     timestamp("followUpDate"),
  postInterventionCrl: doublePrecision("postInterventionCrl"),
  crlImprovement:      doublePrecision("crlImprovement"),
  founderSatisfactionScore: integer("founderSatisfactionScore"),
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
  updatedAt:  timestamp("updatedAt").defaultNow().notNull(),
});
export type CrlIntervention = typeof crlInterventions.$inferSelect;
export type InsertCrlIntervention = typeof crlInterventions.$inferInsert;

// -- CRL Monitoring Records ----------------------------------------------------
export const crlMonitoringRecords = pgTable("crl_monitoring_records", {
  id:             serial("id").primaryKey(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  assessmentId:   integer("assessmentId"),
  checkInDate:    timestamp("checkInDate").defaultNow().notNull(),
  frequency:      text("crlMonitoringFrequency").default("monthly"),
  crlScoreCurrent:  doublePrecision("crlScoreCurrent"),
  crlScorePrevious: doublePrecision("crlScorePrevious"),
  driftScore:       doublePrecision("driftScore"),
  driftLevel:       text("crlDriftLevel").default("none"),
  questionsChecked: text("questionsChecked"),
  driftDetected:    boolean("driftDetected").default(false),
  escalationTriggered: boolean("escalationTriggered").default(false),
  aiReport:         text("aiReport"),
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
});
export type CrlMonitoringRecord = typeof crlMonitoringRecords.$inferSelect;
export type InsertCrlMonitoringRecord = typeof crlMonitoringRecords.$inferInsert;

// -- VRL Dynamic Weight Configs ------------------------------------------------
export const vrlDynamicWeights = pgTable("vrl_dynamic_weights", {
  id:           serial("id").primaryKey(),
  ventureId:    varchar("ventureId", { length: 64 }).notNull().unique(),
  h4Stage:      text("vrlDynH4Stage").notNull().default("H4.1_ideation"),
  alphaWeight:  doublePrecision("alphaWeight").notNull().default(0.225),
  betaWeight:   doublePrecision("betaWeight").notNull().default(0.325),
  gammaWeight:  doublePrecision("gammaWeight").notNull().default(0.450),
  trlNormalized: doublePrecision("trlNormalized"),
  brlNormalized: doublePrecision("brlNormalized"),
  crlNormalized: doublePrecision("crlNormalized"),
  riskIndex:     doublePrecision("riskIndex").default(0.3),
  confidenceScore: doublePrecision("confidenceScore").default(0.7),
  computedVrl:   doublePrecision("computedVrl"),
  trlContribution: doublePrecision("trlContribution"),
  brlContribution: doublePrecision("brlContribution"),
  crlContribution: doublePrecision("crlContribution"),
  lastCalculatedAt: timestamp("lastCalculatedAt"),
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
  updatedAt:  timestamp("updatedAt").defaultNow().notNull(),
});
export type VrlDynamicWeight = typeof vrlDynamicWeights.$inferSelect;
export type InsertVrlDynamicWeight = typeof vrlDynamicWeights.$inferInsert;

// -------------------------------------------------------------------------------
// INVESTMENT MODULE - Sprint 66
// Tables: invReadinessScores, invOutputs, invTargets, invKpis, invFundraisingRounds
// -------------------------------------------------------------------------------

// -- Investment Readiness Scores -----------------------------------------------
export const invReadinessScores = pgTable("invReadinessScores", {
  id:                 serial("id").primaryKey(),
  offeringId:         integer("offeringId"),
  ventureId:          varchar("ventureId", { length: 64 }),
  commercialScore:    doublePrecision("commercialScore").default(0),
  technicalScore:     doublePrecision("technicalScore").default(0),
  validationScore:    doublePrecision("validationScore").default(0),
  supplyChainScore:   doublePrecision("supplyChainScore").default(0),
  impactScore:        doublePrecision("impactScore").default(0),
  investmentAttractiveness: doublePrecision("investmentAttractiveness").default(0),
  compositeScore:     doublePrecision("compositeScore").default(0),
  h4Stage:            varchar("h4Stage", { length: 32 }),
  vrlScore:           doublePrecision("vrlScore"),
  trlScore:           doublePrecision("trlScore"),
  brlScore:           doublePrecision("brlScore"),
  crlScore:           doublePrecision("crlScore"),
  riskIndex:          doublePrecision("riskIndex"),
  scoreSummary:       text("scoreSummary"),
  strengthsJson:      text("strengthsJson"),
  weaknessesJson:     text("weaknessesJson"),
  gapsJson:           text("gapsJson"),
  calculatedBy:       varchar("calculatedBy", { length: 64 }),
  createdAt:          timestamp("createdAt").defaultNow().notNull(),
  updatedAt:          timestamp("updatedAt").defaultNow().notNull(),
});
export type InvReadinessScore = typeof invReadinessScores.$inferSelect;
export type InsertInvReadinessScore = typeof invReadinessScores.$inferInsert;

// -- Investment Outputs (Pitch Deck, Business Plan, Execution Plan) -------------
export const invOutputs = pgTable("invOutputs", {
  id:             serial("id").primaryKey(),
  offeringId:     integer("offeringId"),
  ventureId:      varchar("ventureId", { length: 64 }),
  scoreId:        integer("scoreId"),
  outputType:     text("invOutputType").notNull(),
  title:          varchar("title", { length: 256 }).notNull(),
  status:         text("invOutputStatus").default("draft"),
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
  version:        integer("version").default(1),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().notNull(),
});
export type InvOutput = typeof invOutputs.$inferSelect;
export type InsertInvOutput = typeof invOutputs.$inferInsert;

// -- Investor Targets (Matching & Outreach) -------------------------------------
export const invTargets = pgTable("invTargets", {
  id:                 serial("id").primaryKey(),
  offeringId:         integer("offeringId"),
  ventureId:          varchar("ventureId", { length: 64 }),
  investorName:       varchar("investorName", { length: 256 }).notNull(),
  fund:               varchar("fund", { length: 256 }),
  investorType:       text("invTargetType").default("vc"),
  geographicFocus:    varchar("geographicFocus", { length: 128 }),
  stageFocus:         varchar("stageFocus", { length: 128 }),
  sectorFocus:        varchar("sectorFocus", { length: 256 }),
  minCheque:          integer("minCheque"),
  maxCheque:          integer("maxCheque"),
  impactFocused:      boolean("impactFocused").default(false),
  matchScore:         doublePrecision("matchScore").default(0),
  matchRationale:     text("matchRationale"),
  outreachStatus:     text("invTargetStatus").default("identified"),
  contactEmail:       varchar("contactEmail", { length: 256 }),
  linkedinUrl:        varchar("linkedinUrl", { length: 512 }),
  warmIntroSource:    varchar("warmIntroSource", { length: 256 }),
  lastContactedAt:    timestamp("lastContactedAt"),
  nextFollowUpAt:     timestamp("nextFollowUpAt"),
  notes:              text("notes"),
  outputSentId:       integer("outputSentId"),
  createdAt:          timestamp("createdAt").defaultNow().notNull(),
  updatedAt:          timestamp("updatedAt").defaultNow().notNull(),
});
export type InvTarget = typeof invTargets.$inferSelect;
export type InsertInvTarget = typeof invTargets.$inferInsert;

// -- Investment KPIs ------------------------------------------------------------
export const invKpis = pgTable("invKpis", {
  id:             serial("id").primaryKey(),
  offeringId:     integer("offeringId"),
  ventureId:      varchar("ventureId", { length: 64 }),
  askAmount:      integer("askAmount"),
  preMoneyVal:    integer("preMoneyVal"),
  useOfFunds:     text("useOfFunds"),
  revenueYear1:   integer("revenueYear1"),
  revenueYear3:   integer("revenueYear3"),
  revenueYear5:   integer("revenueYear5"),
  ebitdaYear3:    integer("ebitdaYear3"),
  ebitdaYear5:    integer("ebitdaYear5"),
  burnRate:       integer("burnRate"),
  runway:         integer("runway"),
  customersCount: integer("customersCount"),
  revenueActual:  integer("revenueActual"),
  growthRate:     doublePrecision("growthRate"),
  nps:            doublePrecision("nps"),
  cac:            integer("cac"),
  ltv:            integer("ltv"),
  socialImpactMetric: varchar("socialImpactMetric", { length: 256 }),
  impactValue:    varchar("impactValue", { length: 128 }),
  sdgAlignment:   varchar("sdgAlignment", { length: 256 }),
  periodLabel:    varchar("periodLabel", { length: 64 }),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().notNull(),
});
export type InvKpi = typeof invKpis.$inferSelect;
export type InsertInvKpi = typeof invKpis.$inferInsert;

// -- Fundraising Rounds ---------------------------------------------------------
export const invFundraisingRounds = pgTable("invFundraisingRounds", {
  id:                 serial("id").primaryKey(),
  offeringId:         integer("offeringId"),
  ventureId:          varchar("ventureId", { length: 64 }),
  roundName:          varchar("roundName", { length: 128 }).notNull(),
  roundType:          text("invRoundType").default("seed"),
  targetAmount:       integer("targetAmount"),
  raisedAmount:       integer("raisedAmount").default(0),
  status:             text("invRoundStatus").default("planning"),
  openDate:           timestamp("openDate"),
  closeDate:          timestamp("closeDate"),
  leadInvestor:       varchar("leadInvestor", { length: 256 }),
  pitchDeckId:        integer("pitchDeckId"),
  businessPlanId:     integer("businessPlanId"),
  executionPlanId:    integer("executionPlanId"),
  notes:              text("notes"),
  createdAt:          timestamp("createdAt").defaultNow().notNull(),
  updatedAt:          timestamp("updatedAt").defaultNow().notNull(),
});
export type InvFundraisingRound = typeof invFundraisingRounds.$inferSelect;
export type InsertInvFundraisingRound = typeof invFundraisingRounds.$inferInsert;


// -----------------------------------------------------------------------------
// ECORACE LAB - 8-Stage Engineering Workflow (Sprint 67)
// Tables: erl_projects, erl_stages, erl_materials, erl_simulations,
//         erl_ip_assets, erl_agent_runs, erl_validation_logs
// -----------------------------------------------------------------------------

export const erlProjects = pgTable("erl_projects", {
  id:               serial("id").primaryKey(),
  ventureId:        varchar("ventureId", { length: 64 }),
  offeringId:       integer("offeringId"),
  title:            varchar("title", { length: 256 }).notNull(),
  description:      text("description"),
  problemStatement: text("problemStatement"),
  marketReqs:       text("marketReqs"),
  technicalReqs:    text("technicalReqs"),
  status:           text("erlProjectStatus").default("draft"),
  currentStage:     text("erlCurrentStage").default("opportunity"),
  priority:         text("erlPriority").default("medium"),
  targetCompletionDate: timestamp("targetCompletionDate"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type ErlProject = typeof erlProjects.$inferSelect;
export type InsertErlProject = typeof erlProjects.$inferInsert;

export const erlStages = pgTable("erl_stages", {
  id:               serial("id").primaryKey(),
  projectId:        integer("projectId").notNull(),
  stage:            text("erlStageType").notNull(),
  status:           text("erlStageStatus").default("pending"),
  agentId:          varchar("agentId", { length: 64 }),
  inputData:        text("inputData"),
  outputData:       text("outputData"),
  aiNarrative:      text("aiNarrative"),
  performanceTargets: text("performanceTargets"),
  validationCriteria: text("validationCriteria"),
  humanApproved:    boolean("humanApproved").default(false),
  humanNotes:       text("humanNotes"),
  iterationCount:   integer("iterationCount").default(0),
  completedAt:      timestamp("completedAt"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type ErlStage = typeof erlStages.$inferSelect;
export type InsertErlStage = typeof erlStages.$inferInsert;

export const erlMaterials = pgTable("erl_materials", {
  id:               serial("id").primaryKey(),
  projectId:        integer("projectId"),
  name:             varchar("name", { length: 256 }).notNull(),
  category:         text("erlMaterialCategory").default("composite"),
  formulation:      text("formulation"),
  sustainabilityScore: integer("sustainabilityScore").default(0),
  recycledContent:  integer("recycledContent").default(0),
  carbonFootprint:  varchar("carbonFootprint", { length: 64 }),
  tensileStrength:  varchar("tensileStrength", { length: 64 }),
  density:          varchar("density", { length: 64 }),
  thermalRating:    varchar("thermalRating", { length: 64 }),
  costPerKg:        integer("costPerKg"),
  supplier:         varchar("supplier", { length: 256 }),
  certifications:   text("certifications"),
  aiGenerated:      boolean("aiGenerated").default(false),
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type ErlMaterial = typeof erlMaterials.$inferSelect;
export type InsertErlMaterial = typeof erlMaterials.$inferInsert;

export const erlSimulations = pgTable("erl_simulations", {
  id:               serial("id").primaryKey(),
  projectId:        integer("projectId").notNull(),
  stageId:          integer("stageId"),
  simType:          text("erlSimType").notNull(),
  title:            varchar("title", { length: 256 }).notNull(),
  softwareTool:     varchar("softwareTool", { length: 128 }),
  inputParams:      text("inputParams"),
  results:          text("results"),
  aiAnalysis:       text("aiAnalysis"),
  passedValidation: boolean("passedValidation").default(false),
  safetyFactor:     varchar("safetyFactor", { length: 32 }),
  iterationNumber:  integer("iterationNumber").default(1),
  status:           text("erlSimStatus").default("queued"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type ErlSimulation = typeof erlSimulations.$inferSelect;
export type InsertErlSimulation = typeof erlSimulations.$inferInsert;

export const erlIpAssets = pgTable("erl_ip_assets", {
  id:               serial("id").primaryKey(),
  projectId:        integer("projectId").notNull(),
  title:            varchar("title", { length: 256 }).notNull(),
  ipType:           text("erlIpType").default("patent"),
  claimsJson:       text("claimsJson"),
  technicalSummary: text("technicalSummary"),
  noveltyStatement: text("noveltyStatement"),
  priorArtSearch:   text("priorArtSearch"),
  draftClaims:      text("draftClaims"),
  filingStatus:     text("erlFilingStatus").default("draft"),
  filingDate:       timestamp("filingDate"),
  grantDate:        timestamp("grantDate"),
  jurisdiction:     varchar("jurisdiction", { length: 128 }),
  aiGenerated:      boolean("aiGenerated").default(false),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type ErlIpAsset = typeof erlIpAssets.$inferSelect;
export type InsertErlIpAsset = typeof erlIpAssets.$inferInsert;

export const erlAgentRuns = pgTable("erl_agent_runs", {
  id:               serial("id").primaryKey(),
  projectId:        integer("projectId").notNull(),
  stageId:          integer("stageId"),
  agentId:          varchar("agentId", { length: 64 }).notNull(),
  agentName:        varchar("agentName", { length: 128 }).notNull(),
  promptUsed:       text("promptUsed"),
  inputContext:     text("inputContext"),
  outputJson:       text("outputJson"),
  tokensUsed:       integer("tokensUsed"),
  durationMs:       integer("durationMs"),
  status:           text("erlAgentStatus").default("queued"),
  errorMessage:     text("errorMessage"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type ErlAgentRun = typeof erlAgentRuns.$inferSelect;
export type InsertErlAgentRun = typeof erlAgentRuns.$inferInsert;

export const erlValidationLogs = pgTable("erl_validation_logs", {
  id:               serial("id").primaryKey(),
  projectId:        integer("projectId").notNull(),
  stageId:          integer("stageId"),
  validationType:   text("erlValidationType").notNull(),
  title:            varchar("title", { length: 256 }).notNull(),
  standard:         varchar("standard", { length: 256 }),
  testMethod:       text("testMethod"),
  results:          text("results"),
  passed:           boolean("passed").default(false),
  score:            integer("score"),
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type ErlValidationLog = typeof erlValidationLogs.$inferSelect;
export type InsertErlValidationLog = typeof erlValidationLogs.$inferInsert;

// -------------------------------------------------------------
// INVESTOR DATA ROOM MODULE - 10 tables (migration 0044)
// -------------------------------------------------------------

// 1. Data Room Rooms
export const drRooms = pgTable("dr_rooms", {
  id:               serial("id").primaryKey(),
  ventureId:        integer("ventureId").notNull(),
  name:             varchar("name", { length: 256 }).notNull(),
  description:      text("description"),
  roomType:         text("drRoomType").notNull().default("teaser"),
  status:           text("drRoomStatus").notNull().default("draft"),
  visibilityTier:   text("drVisibilityTier").notNull().default("teaser"),
  fundingRound:     varchar("fundingRound", { length: 128 }),
  fundingTarget:    varchar("fundingTarget", { length: 128 }),
  expiresAt:        timestamp("expiresAt"),
  publishedAt:      timestamp("publishedAt"),
  ownerId:          integer("ownerId"),
  watermarkEnabled: boolean("watermarkEnabled").default(true),
  downloadEnabled:  boolean("downloadEnabled").default(false),
  ndaRequired:      boolean("ndaRequired").default(false),
  accessCode:       varchar("accessCode", { length: 64 }),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type DrRoom = typeof drRooms.$inferSelect;
export type InsertDrRoom = typeof drRooms.$inferInsert;

// 2. Data Room Assets
export const drAssets = pgTable("dr_assets", {
  id:              serial("id").primaryKey(),
  roomId:          integer("roomId").notNull(),
  ventureId:       integer("ventureId").notNull(),
  folder:          text("drFolder").notNull().default("01_Overview"),
  name:            varchar("name", { length: 256 }).notNull(),
  description:     text("description"),
  fileUrl:         text("fileUrl"),
  fileKey:         varchar("fileKey", { length: 512 }),
  mimeType:        varchar("mimeType", { length: 128 }),
  fileSizeBytes:   integer("fileSizeBytes"),
  assetType:       text("drAssetType").notNull().default("other"),
  status:          text("drAssetStatus").notNull().default("draft"),
  version:         integer("version").default(1),
  isAiGenerated:   boolean("isAiGenerated").default(false),
  sourceDataRef:   text("sourceDataRef"),
  approvedById:    integer("approvedById"),
  approvedAt:      timestamp("approvedAt"),
  visibilityTier:  text("drAssetTier").notNull().default("teaser"),
  downloadAllowed: boolean("downloadAllowed").default(false),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type DrAsset = typeof drAssets.$inferSelect;
export type InsertDrAsset = typeof drAssets.$inferInsert;

// 3. Readiness Checks
export const drReadinessChecks = pgTable("dr_readiness_checks", {
  id:            serial("id").primaryKey(),
  roomId:        integer("roomId").notNull(),
  ventureId:     integer("ventureId").notNull(),
  category:      text("drCheckCategory").notNull(),
  title:         varchar("title", { length: 256 }).notNull(),
  description:   text("description"),
  severity:      text("drSeverity").notNull().default("medium"),
  status:        text("drCheckStatus").notNull().default("pending"),
  blocksPublish: boolean("blocksPublish").default(false),
  ownerId:       integer("ownerId"),
  dueDate:       timestamp("dueDate"),
  resolvedAt:    timestamp("resolvedAt"),
  notes:         text("notes"),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().notNull(),
});
export type DrReadinessCheck = typeof drReadinessChecks.$inferSelect;
export type InsertDrReadinessCheck = typeof drReadinessChecks.$inferInsert;

// 4. Investors
export const drInvestors = pgTable("dr_investors", {
  id:           serial("id").primaryKey(),
  ventureId:    integer("ventureId").notNull(),
  name:         varchar("name", { length: 256 }).notNull(),
  organisation: varchar("organisation", { length: 256 }),
  email:        varchar("email", { length: 256 }),
  phone:        varchar("phone", { length: 64 }),
  investorType: text("drInvestorType").notNull().default("vc"),
  thesisFit:    text("drThesisFit").notNull().default("unknown"),
  stage:        text("drInvestorStage").notNull().default("identified"),
  ndaSigned:    boolean("ndaSigned").default(false),
  ndaSignedAt:  timestamp("ndaSignedAt"),
  notes:        text("notes"),
  linkedinUrl:  varchar("linkedinUrl", { length: 512 }),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});
export type DrInvestor = typeof drInvestors.$inferSelect;
export type InsertDrInvestor = typeof drInvestors.$inferInsert;

// 5. Room Permissions
export const drPermissions = pgTable("dr_permissions", {
  id:          serial("id").primaryKey(),
  roomId:      integer("roomId").notNull(),
  investorId:  integer("investorId").notNull(),
  accessLevel: text("drAccessLevel").notNull().default("teaser"),
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
export const drEngagementEvents = pgTable("dr_engagement_events", {
  id:              serial("id").primaryKey(),
  roomId:          integer("roomId").notNull(),
  assetId:         integer("assetId"),
  investorId:      integer("investorId"),
  eventType:       text("drEventType").notNull(),
  durationSeconds: integer("durationSeconds"),
  ipAddress:       varchar("ipAddress", { length: 64 }),
  userAgent:       text("userAgent"),
  metadata:        text("metadata"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type DrEngagementEvent = typeof drEngagementEvents.$inferSelect;
export type InsertDrEngagementEvent = typeof drEngagementEvents.$inferInsert;

// 7. Q&A Requests
export const drQaRequests = pgTable("dr_qa_requests", {
  id:              serial("id").primaryKey(),
  roomId:          integer("roomId").notNull(),
  investorId:      integer("investorId").notNull(),
  assetId:         integer("assetId"),
  question:        text("question").notNull(),
  category:        text("drQaCategory").notNull().default("other"),
  priority:        text("drQaPriority").notNull().default("normal"),
  status:          text("drQaStatus").notNull().default("open"),
  responseOwnerId: integer("responseOwnerId"),
  response:        text("response"),
  respondedAt:     timestamp("respondedAt"),
  dueDate:         timestamp("dueDate"),
  isPublic:        boolean("isPublic").default(false),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type DrQaRequest = typeof drQaRequests.$inferSelect;
export type InsertDrQaRequest = typeof drQaRequests.$inferInsert;

// 8. Asset Generation Templates
export const drTemplates = pgTable("dr_templates", {
  id:              serial("id").primaryKey(),
  name:            varchar("name", { length: 256 }).notNull(),
  outputType:      text("drTemplateOutput").notNull(),
  promptTemplate:  text("promptTemplate").notNull(),
  mandatoryInputs: text("mandatoryInputs"),
  optionalInputs:  text("optionalInputs"),
  visibilityTier:  text("drTemplateTier").notNull().default("full"),
  isActive:        boolean("isActive").default(true),
  version:         integer("version").default(1),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type DrTemplate = typeof drTemplates.$inferSelect;
export type InsertDrTemplate = typeof drTemplates.$inferInsert;

// 9. Asset Approvals
export const drApprovals = pgTable("dr_approvals", {
  id:           serial("id").primaryKey(),
  assetId:      integer("assetId").notNull(),
  roomId:       integer("roomId").notNull(),
  reviewerRole: text("drReviewerRole").notNull(),
  status:       text("drApprovalStatus").notNull().default("pending"),
  reviewerId:   integer("reviewerId"),
  comments:     text("comments"),
  reviewedAt:   timestamp("reviewedAt"),
  dueDate:      timestamp("dueDate"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});
export type DrApproval = typeof drApprovals.$inferSelect;
export type InsertDrApproval = typeof drApprovals.$inferInsert;

// 10. AI Generation Log
export const drAiGenerations = pgTable("dr_ai_generations", {
  id:               serial("id").primaryKey(),
  roomId:           integer("roomId").notNull(),
  ventureId:        integer("ventureId").notNull(),
  templateId:       integer("templateId"),
  outputType:       varchar("outputType", { length: 128 }).notNull(),
  inputSummary:     text("inputSummary"),
  generatedContent: text("generatedContent"),
  status:           text("drGenStatus").notNull().default("generating"),
  approvedById:     integer("approvedById"),
  approvedAt:       timestamp("approvedAt"),
  tokensUsed:       integer("tokensUsed"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type DrAiGeneration = typeof drAiGenerations.$inferSelect;
export type InsertDrAiGeneration = typeof drAiGenerations.$inferInsert;


// -----------------------------------------------------------------------------
// LEARNING ENGINE MODULE (Sprint 69)
// Tables: le_problems, le_insights, le_input_weights, le_vrl_metrics,
//         le_learning_patterns, le_recommendations, le_knowledge_graph_nodes,
//         le_knowledge_graph_edges
// -----------------------------------------------------------------------------

export const leProblems = pgTable("le_problems", {
  id:              serial("id").primaryKey(),
  description:     text("description").notNull(),
  sector:          varchar("sector", { length: 100 }).notNull(),
  frequencyScore:  integer("frequencyScore"),
  severityScore:   integer("severityScore"),
  customerSegment: varchar("customerSegment", { length: 200 }),
  context:         text("context"),
  status:          text("leProblemStatus").notNull().default("active"),
  ventureId:       integer("ventureId"),
  tags:            text("tags"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type LeProblem = typeof leProblems.$inferSelect;
export type InsertLeProblem = typeof leProblems.$inferInsert;

export const leInsights = pgTable("le_insights", {
  id:              serial("id").primaryKey(),
  problemId:       integer("problemId"),
  ventureId:       integer("ventureId"),
  sourceType:      text("leInsightSource").notNull(),
  sourceId:        integer("sourceId"),
  content:         text("content").notNull(),
  evidenceStrength: integer("evidenceStrength"),
  confidenceScore: numeric("confidenceScore", { precision: 3, scale: 2 }),
  tags:            text("tags"),
  ipSensitive:     boolean("ipSensitive").default(false),
  extractedAt:     timestamp("extractedAt").defaultNow().notNull(),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type LeInsight = typeof leInsights.$inferSelect;
export type InsertLeInsight = typeof leInsights.$inferInsert;

export const leInputWeights = pgTable("le_input_weights", {
  id:         serial("id").primaryKey(),
  sourceType: varchar("sourceType", { length: 64 }).notNull().unique(),
  weight:     numeric("weight", { precision: 3, scale: 2 }).notNull(),
  updatedAt:  timestamp("updatedAt").defaultNow().notNull(),
});
export type LeInputWeight = typeof leInputWeights.$inferSelect;

export const leVrlMetrics = pgTable("le_vrl_metrics", {
  id:                serial("id").primaryKey(),
  ventureId:         integer("ventureId").notNull(),
  trlScore:          numeric("trlScore", { precision: 4, scale: 2 }),
  brlScore:          numeric("brlScore", { precision: 4, scale: 2 }),
  alpha:             numeric("alpha", { precision: 3, scale: 2 }).default("0.50"),
  beta:              numeric("beta", { precision: 3, scale: 2 }).default("0.50"),
  riskIndex:         numeric("riskIndex", { precision: 3, scale: 2 }),
  confidenceScore:   numeric("confidenceScore", { precision: 3, scale: 2 }),
  vrlScore:          numeric("vrlScore", { precision: 5, scale: 2 }),
  stage:             text("leVrlStage").default("idea"),
  riskBreakdown:     text("riskBreakdown"),
  calculationMethod: varchar("calculationMethod", { length: 100 }).default("multiplicative_dual_risk"),
  notes:             text("notes"),
  calculatedAt:      timestamp("calculatedAt").defaultNow().notNull(),
});
export type LeVrlMetric = typeof leVrlMetrics.$inferSelect;
export type InsertLeVrlMetric = typeof leVrlMetrics.$inferInsert;

export const leLearningPatterns = pgTable("le_learning_patterns", {
  id:              serial("id").primaryKey(),
  patternType:     text("lePatternType").notNull(),
  sector:          varchar("sector", { length: 100 }),
  title:           varchar("title", { length: 256 }).notNull(),
  description:     text("description"),
  frequency:       integer("frequency").default(1),
  confidenceScore: numeric("confidenceScore", { precision: 3, scale: 2 }),
  supportingData:  text("supportingData"),
  isActive:        boolean("isActive").default(true),
  detectedAt:      timestamp("detectedAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type LeLearningPattern = typeof leLearningPatterns.$inferSelect;
export type InsertLeLearningPattern = typeof leLearningPatterns.$inferInsert;

export const leRecommendations = pgTable("le_recommendations", {
  id:          serial("id").primaryKey(),
  ventureId:   integer("ventureId").notNull(),
  type:        text("leRecType").notNull(),
  priority:    text("leRecPriority").notNull().default("medium"),
  title:       varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  actionItems: text("actionItems"),
  confidence:  numeric("confidence", { precision: 3, scale: 2 }),
  status:      text("leRecStatus").notNull().default("active"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().notNull(),
});
export type LeRecommendation = typeof leRecommendations.$inferSelect;
export type InsertLeRecommendation = typeof leRecommendations.$inferInsert;

export const leKnowledgeGraphNodes = pgTable("le_kg_nodes", {
  id:         serial("id").primaryKey(),
  nodeType:   text("leNodeType").notNull(),
  label:      varchar("label", { length: 256 }).notNull(),
  ventureId:  integer("ventureId"),
  properties: text("properties"),
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
});
export type LeKgNode = typeof leKnowledgeGraphNodes.$inferSelect;
export type InsertLeKgNode = typeof leKnowledgeGraphNodes.$inferInsert;

export const leKnowledgeGraphEdges = pgTable("le_kg_edges", {
  id:           serial("id").primaryKey(),
  fromNodeId:   integer("fromNodeId").notNull(),
  toNodeId:     integer("toNodeId").notNull(),
  relationship: text("leEdgeRel").notNull(),
  weight:       numeric("weight", { precision: 3, scale: 2 }).default("0.50"),
  metadata:     text("metadata"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type LeKgEdge = typeof leKnowledgeGraphEdges.$inferSelect;
export type InsertLeKgEdge = typeof leKnowledgeGraphEdges.$inferInsert;


// -----------------------------------------------------------------------------
// PLAYBOOK MODULE - Sprint 70
// Tables: pb_playbooks, pb_steps, pb_runs, pb_run_steps, pb_kpi_entries, pb_linked_assets
// -----------------------------------------------------------------------------

export const pbPlaybooks = pgTable("pb_playbooks", {
  id:                serial("id").primaryKey(),
  playbookId:        varchar("playbookId", { length: 20 }).notNull().unique(),
  title:             varchar("title", { length: 200 }).notNull(),
  subFolder:         text("subFolder").notNull(),
  version:           varchar("version", { length: 20 }).notNull().default("1.0.0"),
  ownerRole:         varchar("ownerRole", { length: 100 }),
  strategicPrinciple: text("strategicPrinciple"),
  triggerConditions: text("triggerConditions"),
  kpis:              text("kpis"),
  status:            text("pbStatus").notNull().default("draft"),
  lastRun:           timestamp("lastRun"),
  runCount:          integer("runCount").notNull().default(0),
  linkedAssetIds:    text("linkedAssetIds"),
  ventureId:         varchar("ventureId", { length: 100 }),
  createdBy:         varchar("createdBy", { length: 255 }),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
  updatedAt:         timestamp("updatedAt").defaultNow().notNull(),
});
export type PbPlaybook = typeof pbPlaybooks.$inferSelect;
export type InsertPbPlaybook = typeof pbPlaybooks.$inferInsert;

export const pbSteps = pgTable("pb_steps", {
  id:          serial("id").primaryKey(),
  playbookId:  integer("playbookId").notNull(),
  stepNumber:  integer("stepNumber").notNull(),
  title:       varchar("title", { length: 200 }).notNull(),
  action:      text("action").notNull(),
  assigneeRole: varchar("assigneeRole", { length: 100 }),
  slaDays:     integer("slaDays"),
  toolsRequired: text("toolsRequired"),
  outputArtifact: varchar("outputArtifact", { length: 200 }),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type PbStep = typeof pbSteps.$inferSelect;
export type InsertPbStep = typeof pbSteps.$inferInsert;

export const pbRuns = pgTable("pb_runs", {
  id:           serial("id").primaryKey(),
  playbookId:   integer("playbookId").notNull(),
  ventureId:    varchar("ventureId", { length: 100 }),
  triggeredBy:  varchar("triggeredBy", { length: 255 }),
  triggerReason: varchar("triggerReason", { length: 500 }),
  status:       text("pbRunStatus").notNull().default("pending"),
  currentStep:  integer("currentStep").notNull().default(1),
  totalSteps:   integer("totalSteps").notNull().default(0),
  startedAt:    timestamp("startedAt").defaultNow().notNull(),
  completedAt:  timestamp("completedAt"),
  notes:        text("notes"),
  aiSummary:    text("aiSummary"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});
export type PbRun = typeof pbRuns.$inferSelect;
export type InsertPbRun = typeof pbRuns.$inferInsert;

export const pbRunSteps = pgTable("pb_run_steps", {
  id:           serial("id").primaryKey(),
  runId:        integer("runId").notNull(),
  stepId:       integer("stepId").notNull(),
  stepNumber:   integer("stepNumber").notNull(),
  status:       text("pbRunStepStatus").notNull().default("pending"),
  assignedTo:   varchar("assignedTo", { length: 255 }),
  startedAt:    timestamp("startedAt"),
  completedAt:  timestamp("completedAt"),
  notes:        text("notes"),
  evidence:     text("evidence"),
  blockerReason: text("blockerReason"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});
export type PbRunStep = typeof pbRunSteps.$inferSelect;
export type InsertPbRunStep = typeof pbRunSteps.$inferInsert;

export const pbKpiEntries = pgTable("pb_kpi_entries", {
  id:           serial("id").primaryKey(),
  playbookId:   integer("playbookId").notNull(),
  runId:        integer("runId"),
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

export const pbLinkedAssets = pgTable("pb_linked_assets", {
  id:           serial("id").primaryKey(),
  playbookId:   integer("playbookId").notNull(),
  assetName:    varchar("assetName", { length: 200 }).notNull(),
  assetType:    text("pbAssetType").notNull(),
  assetRef:     varchar("assetRef", { length: 500 }),
  domain:       varchar("domain", { length: 100 }),
  classification: text("pbClassification"),
  zone:         text("pbZone"),
  dqsCurrent:   numeric("dqsCurrent", { precision: 5, scale: 2 }),
  notes:        text("notes"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type PbLinkedAsset = typeof pbLinkedAssets.$inferSelect;
export type InsertPbLinkedAsset = typeof pbLinkedAssets.$inferInsert;


// -----------------------------------------------------------------------------
// IP INTELLIGENCE MODULE - IP_OBJECT Schema (Sprint 71)
// Tables: ip_analyses, ip_entities, ip_whitespace, ip_vrl_feed
// Lightbringer-style mock analysis engine with VRL integration
// -----------------------------------------------------------------------------

export const ipAnalyses = pgTable("ip_analyses", {
  id:              serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 50 }),
  ideaName:        varchar("ideaName", { length: 200 }).notNull(),
  description:     text("description").notNull(),
  keywords:        text("keywords").notNull(),            // comma-separated
  industry:        varchar("industry", { length: 100 }).notNull(),
  geography:       varchar("geography", { length: 100 }).notNull(),
  // Lightbringer API response fields
  noveltyScore:    numeric("noveltyScore", { precision: 5, scale: 2 }).notNull().default("0"),
  patentDensity:   text("patentDensity").notNull().default("LOW"),
  ftoRisk:         text("ftoRisk").notNull().default("LOW"),
  recommendation:  text("recommendation").notNull().default("PROCEED"),
  ipScore:         numeric("ipScore", { precision: 5, scale: 2 }).notNull().default("0"),  // 0-100, fed to VRL
  rawResponse:     json("rawResponse"),                  // full mock Lightbringer JSON
  apiProvider:     varchar("apiProvider", { length: 50 }).notNull().default("lightbringer_mock"),
  apiVersion:      varchar("apiVersion", { length: 20 }).notNull().default("v1.0"),
  status:          text("ipAnalysisStatus").notNull().default("pending"),
  analysedBy:      varchar("analysedBy", { length: 100 }),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type IpAnalysis = typeof ipAnalyses.$inferSelect;
export type InsertIpAnalysis = typeof ipAnalyses.$inferInsert;

export const ipEntities = pgTable("ip_entities", {
  id:              serial("id").primaryKey(),
  analysisId:      integer("analysisId").notNull(),
  entityName:      varchar("entityName", { length: 200 }).notNull(),
  entityType:      text("ipEntityType").notNull(),
  patentCount:     integer("patentCount").notNull().default(0),
  relevanceScore:  numeric("relevanceScore", { precision: 5, scale: 2 }).notNull().default("0"),
  country:         varchar("country", { length: 100 }),
  threat:          text("ipEntityThreat").notNull().default("LOW"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type IpEntity = typeof ipEntities.$inferSelect;
export type InsertIpEntity = typeof ipEntities.$inferInsert;

export const ipWhitespace = pgTable("ip_whitespace", {
  id:              serial("id").primaryKey(),
  analysisId:      integer("analysisId").notNull(),
  opportunity:     varchar("opportunity", { length: 500 }).notNull(),
  category:        text("ipWhitespaceCategory").notNull(),
  potentialScore:  numeric("potentialScore", { precision: 5, scale: 2 }).notNull().default("0"),
  actionable:      boolean("actionable").notNull().default(true),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type IpWhitespace = typeof ipWhitespace.$inferSelect;
export type InsertIpWhitespace = typeof ipWhitespace.$inferInsert;

export const ipVrlFeed = pgTable("ip_vrl_feed", {
  id:              serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 50 }).notNull(),
  analysisId:      integer("analysisId").notNull(),
  ipScore:         numeric("ipScore", { precision: 5, scale: 2 }).notNull(),
  vrlContribution: numeric("vrlContribution", { precision: 5, scale: 2 }).notNull().default("0"),  // weighted contribution to VRL
  appliedAt:       timestamp("appliedAt").defaultNow().notNull(),
  appliedBy:       varchar("appliedBy", { length: 100 }),
  notes:           text("notes"),
});
export type IpVrlFeed = typeof ipVrlFeed.$inferSelect;
export type InsertIpVrlFeed = typeof ipVrlFeed.$inferInsert;

// -- Sprint 72: G Drive Workspace Automation -----------------------------------
export const gdWorkspaces = pgTable("gd_workspaces", {
  id:             serial("id").primaryKey(),
  ventureId:      varchar("ventureId", { length: 50 }).notNull(),
  ventureCode:    varchar("ventureCode", { length: 20 }).notNull(),
  ventureName:    varchar("ventureName", { length: 200 }).notNull(),
  driveId:        varchar("driveId", { length: 200 }),
  driveUrl:       varchar("driveUrl", { length: 500 }),
  status:         text("gdWorkspaceStatus").default("pending").notNull(),
  totalFolders:   integer("totalFolders").default(0),
  totalDocs:      integer("totalDocs").default(0),
  createdBy:      varchar("createdBy", { length: 100 }),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  lastSyncAt:     timestamp("lastSyncAt"),
});
export type GdWorkspace = typeof gdWorkspaces.$inferSelect;
export type InsertGdWorkspace = typeof gdWorkspaces.$inferInsert;

export const gdFolders = pgTable("gd_folders", {
  id:             serial("id").primaryKey(),
  workspaceId:    integer("workspaceId").notNull(),
  ventureId:      varchar("ventureId", { length: 50 }).notNull(),
  moduleNumber:   varchar("moduleNumber", { length: 5 }).notNull(),
  folderName:     varchar("folderName", { length: 300 }).notNull(),
  folderId:       varchar("folderId", { length: 200 }),
  driveUrl:       varchar("driveUrl", { length: 500 }),
  parentFolderId: integer("parentFolderId"),
  docCount:       integer("docCount").default(0).notNull(),
  approvedCount:  integer("approvedCount").default(0).notNull(),
  permissions:    json("permissions"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
});
export type GdFolder = typeof gdFolders.$inferSelect;
export type InsertGdFolder = typeof gdFolders.$inferInsert;

export const gdPermissions = pgTable("gd_permissions", {
  id:             serial("id").primaryKey(),
  workspaceId:    integer("workspaceId").notNull(),
  ventureId:      varchar("ventureId", { length: 50 }).notNull(),
  role:           varchar("role", { length: 100 }).notNull(),
  email:          varchar("email", { length: 320 }),
  accessLevel:    text("gdAccessLevel").notNull(),
  moduleScope:    json("moduleScope"),
  grantedAt:      timestamp("grantedAt").defaultNow().notNull(),
  grantedBy:      varchar("grantedBy", { length: 100 }),
  revokedAt:      timestamp("revokedAt"),
});
export type GdPermission = typeof gdPermissions.$inferSelect;
export type InsertGdPermission = typeof gdPermissions.$inferInsert;

// -- Sprint 73: VRL Dashboard V4 ----------------------------------------------
export const vrlStageGates = pgTable("vrl_stage_gates", {
  id:              serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 50 }).notNull(),
  stage:           text("vrlStage").notNull(),
  status:          text("vrlGateStatus").default("not_started").notNull(),
  evidenceDocUrl:  varchar("evidenceDocUrl", { length: 500 }),
  evidenceDocName: varchar("evidenceDocName", { length: 300 }),
  leadName:        varchar("leadName", { length: 100 }),
  score:           numeric("score", { precision: 5, scale: 2 }).default("0"),
  lastUpdated:     timestamp("lastUpdated").defaultNow().notNull(),
  notes:           text("notes"),
});
export type VrlStageGate = typeof vrlStageGates.$inferSelect;
export type InsertVrlStageGate = typeof vrlStageGates.$inferInsert;

export const vrlSpinoutChecklist = pgTable("vrl_spinout_checklist", {
  id:               serial("id").primaryKey(),
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

export const vrlActionsLog = pgTable("vrl_actions_log", {
  id:           serial("id").primaryKey(),
  ventureId:    varchar("ventureId", { length: 50 }).notNull(),
  action:       text("action").notNull(),
  owner:        varchar("owner", { length: 100 }),
  status:       text("vrlActionStatus").default("pending").notNull(),
  linkedModule: varchar("linkedModule", { length: 10 }),
  completedAt:  timestamp("completedAt"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type VrlActionsLog = typeof vrlActionsLog.$inferSelect;
export type InsertVrlActionsLog = typeof vrlActionsLog.$inferInsert;

// -- Sprint 74: Spin-Off Sequence Automation -----------------------------------
export const spinoffSequences = pgTable("spinoff_sequences", {
  id:               serial("id").primaryKey(),
  ventureId:        varchar("ventureId", { length: 50 }).notNull(),
  ventureCode:      varchar("ventureCode", { length: 20 }).notNull(),
  ventureName:      varchar("ventureName", { length: 200 }).notNull(),
  triggerVrlScore:  numeric("triggerVrlScore", { precision: 5, scale: 2 }).notNull(),
  approvedDate:     varchar("approvedDate", { length: 30 }).notNull(),
  founderName:      varchar("founderName", { length: 200 }),
  founderEmail:     varchar("founderEmail", { length: 320 }),
  leadInvestorName: varchar("leadInvestorName", { length: 200 }),
  status:           text("spinoffSeqStatus").default("pending").notNull(),
  currentStep:      integer("currentStep").default(1).notNull(),
  spinoffDriveUrl:  varchar("spinoffDriveUrl", { length: 500 }),
  dataRoomUrl:      varchar("dataRoomUrl", { length: 500 }),
  completedAt:      timestamp("completedAt"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type SpinoffSequence = typeof spinoffSequences.$inferSelect;
export type InsertSpinoffSequence = typeof spinoffSequences.$inferInsert;

export const spinoffAssets = pgTable("spinoff_assets", {
  id:           serial("id").primaryKey(),
  sequenceId:   integer("sequenceId").notNull(),
  assetType:    text("spinoffAssetType").notNull(),
  sourceModule: varchar("sourceModule", { length: 300 }),
  destPath:     varchar("destPath", { length: 300 }),
  status:       text("spinoffAssetStatus").default("pending").notNull(),
  driveUrl:     varchar("driveUrl", { length: 500 }),
  notes:        text("notes"),
  migratedAt:   timestamp("migratedAt"),
});
export type SpinoffAsset = typeof spinoffAssets.$inferSelect;
export type InsertSpinoffAsset = typeof spinoffAssets.$inferInsert;

export const spinoffHandoverPacks = pgTable("spinoff_handover_packs", {
  id:              serial("id").primaryKey(),
  sequenceId:      integer("sequenceId").notNull(),
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

// -- Sprint 75: Brand Data Pipeline -------------------------------------------
export const brandAssets = pgTable("brand_assets", {
  id:             serial("id").primaryKey(),
  ventureId:      varchar("ventureId", { length: 50 }).notNull(),
  assetType:      text("brandAssetType").notNull(),
  assetName:      varchar("assetName", { length: 200 }),
  masterLocation: varchar("masterLocation", { length: 500 }),
  status:         text("brandAssetStatus").default("missing").notNull(),
  version:        varchar("version", { length: 20 }).default("V1"),
  content:        text("content"),
  driveUrl:       varchar("driveUrl", { length: 500 }),
  owner:          varchar("owner", { length: 100 }),
  approvedAt:     timestamp("approvedAt"),
  lastUpdated:    timestamp("lastUpdated").defaultNow().notNull(),
});
export type BrandAsset = typeof brandAssets.$inferSelect;
export type InsertBrandAsset = typeof brandAssets.$inferInsert;

export const brandLinks = pgTable("brand_links", {
  id:               serial("id").primaryKey(),
  ventureId:        varchar("ventureId", { length: 50 }).notNull(),
  assetId:          integer("assetId").notNull(),
  linkedModule:     varchar("linkedModule", { length: 10 }).notNull(),
  linkedModuleName: varchar("linkedModuleName", { length: 200 }),
  linkUrl:          varchar("linkUrl", { length: 500 }),
  linkType:         text("brandLinkType").default("reference").notNull(),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type BrandLink = typeof brandLinks.$inferSelect;
export type InsertBrandLink = typeof brandLinks.$inferInsert;

export const brandUpdateLog = pgTable("brand_update_log", {
  id:               serial("id").primaryKey(),
  ventureId:        varchar("ventureId", { length: 50 }).notNull(),
  assetId:          integer("assetId").notNull(),
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

// -- Sprint 76: Interview-to-Insight & Stage Gate Review ----------------------
export const insightTriggers = pgTable("insight_triggers", {
  id:          serial("id").primaryKey(),
  ventureId:   varchar("ventureId", { length: 50 }).notNull(),
  fileName:    varchar("fileName", { length: 300 }).notNull(),
  fileType:    text("insightFileType").notNull(),
  fileUrl:     varchar("fileUrl", { length: 500 }),
  status:      text("insightTriggerStatus").default("pending").notNull(),
  processedAt: timestamp("processedAt"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type InsightTrigger = typeof insightTriggers.$inferSelect;
export type InsertInsightTrigger = typeof insightTriggers.$inferInsert;

export const insightSummaries = pgTable("insight_summaries", {
  id:                   serial("id").primaryKey(),
  triggerId:            integer("triggerId").notNull(),
  ventureId:            varchar("ventureId", { length: 50 }).notNull(),
  intervieweeType:      varchar("intervieweeType", { length: 100 }),
  painPoints:           json("painPoints"),
  jobsToBeDone:         json("jobsToBeDone"),
  emotionalSignals:     json("emotionalSignals"),
  functionalSignals:    json("functionalSignals"),
  opportunityScore:     numeric("opportunityScore", { precision: 4, scale: 2 }),
  opportunityRationale: text("opportunityRationale"),
  hypothesesToTest:     json("hypothesesToTest"),
  contradictionFlags:   json("contradictionFlags"),
  rawSummary:           text("rawSummary"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
});
export type InsightSummary = typeof insightSummaries.$inferSelect;
export type InsertInsightSummary = typeof insightSummaries.$inferInsert;

export const stageGateReviews = pgTable("stage_gate_reviews", {
  id:              serial("id").primaryKey(),
  ventureId:       varchar("ventureId", { length: 50 }).notNull(),
  targetStage:     text("sgTargetStage").notNull(),
  status:          text("sgReviewStatus").default("submitted").notNull(),
  recommendation:  text("sgRecommendation"),
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

export const stageGateEvidence = pgTable("stage_gate_evidence", {
  id:           serial("id").primaryKey(),
  reviewId:     integer("reviewId").notNull(),
  moduleNumber: varchar("moduleNumber", { length: 5 }).notNull(),
  docName:      varchar("docName", { length: 300 }).notNull(),
  docUrl:       varchar("docUrl", { length: 500 }),
  docStatus:    text("sgEvidenceStatus").default("missing").notNull(),
  notes:        text("notes"),
});
export type StageGateEvidence = typeof stageGateEvidence.$inferSelect;
export type InsertStageGateEvidence = typeof stageGateEvidence.$inferInsert;


// ------------------------------------------------------------------------------
// SRL MODULE - SUSTAINABILITY READINESS LEVEL DATA MODEL
// Reference: BEBUS-SRL-DMS-001 v1.0 | April 2026
// 11 entities covering the full SRL scoring lifecycle.
//
// Compatibility notes:
//   - ventureId columns use VARCHAR(64) to match ventures.id PK
//   - All timestamps use MySQL TIMESTAMP (not TIMESTAMPTZ - MySQL dialect)
//   - UUIDs stored as VARCHAR(36) - MySQL has no native UUID type
//   - JSONB - JSON (MySQL dialect)
//   - DATERANGE not supported in MySQL; replaced with periodStart + periodEnd DATE pair
// ------------------------------------------------------------------------------

// -- SRL Portfolio -------------------------------------------------------------
// Master container for a set of ventures under common ownership or fund management.
export const srlPortfolios = pgTable("srl_portfolios", {
  id:            varchar("id", { length: 36 }).primaryKey(),
  portfolioName: varchar("portfolioName", { length: 200 }).notNull(),
  fundManager:   varchar("fundManager", { length: 200 }),
  configProfile: json("configProfile").notNull().default({}),
  currencyCode:  varchar("currencyCode", { length: 3 }).notNull().default("GBP"),
  isActive:      boolean("isActive").notNull().default(true),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().notNull(),
});
export type SrlPortfolio = typeof srlPortfolios.$inferSelect;
export type InsertSrlPortfolio = typeof srlPortfolios.$inferInsert;

// -- SRL Venture Profile -------------------------------------------------------
// 1:1 companion to the existing ventures table - adds SRL-specific metadata
// without altering the core ventures schema.
export const srlVentureProfiles = pgTable("srl_venture_profiles", {
  ventureId:           varchar("ventureId", { length: 64 }).primaryKey(),
  portfolioId:         varchar("portfolioId", { length: 36 }),
  sectorCode:          varchar("sectorCode", { length: 50 }).notNull().default("GENERAL"),
  subSector:           varchar("subSector", { length: 100 }),
  currentStage:        text("srlCurrentStage").notNull().default("S0"),
  srlCurrentLevel:     integer("srlCurrentLevel").default(0),
  srlCurrentScore:     numeric("srlCurrentScore", { precision: 5, scale: 2 }).default("0.00"),
  countryCode:         varchar("countryCode", { length: 2 }).notNull().default("GB"),
  incorporatedDate:    date("incorporatedDate"),
  sustainabilityWatch: boolean("sustainabilityWatch").notNull().default(false),
  watchActivatedAt:    timestamp("watchActivatedAt"),
  watchLiftedAt:       timestamp("watchLiftedAt"),
  isActive:            boolean("isActive").notNull().default(true),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().notNull(),
});
export type SrlVentureProfile = typeof srlVentureProfiles.$inferSelect;
export type InsertSrlVentureProfile = typeof srlVentureProfiles.$inferInsert;

// -- SRL Dimension Definition --------------------------------------------------
// Master reference for the 5 scoring dimensions: ENV, LCA, SMF, SOC, ESG.
// Seeded once; change-controlled thereafter.
export const srlDimensionDefinitions = pgTable("srl_dimension_definitions", {
  id:            varchar("id", { length: 36 }).primaryKey(),
  dimensionCode: text("srlDimDefCode").notNull().unique(),
  dimensionName: varchar("dimensionName", { length: 100 }).notNull(),
  description:   text("description"),
  defaultWeight: numeric("defaultWeight", { precision: 5, scale: 4 }).notNull(),
  sortOrder:     integer("sortOrder").notNull(),
  isActive:      boolean("isActive").notNull().default(true),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().notNull(),
});
export type SrlDimensionDefinition = typeof srlDimensionDefinitions.$inferSelect;
export type InsertSrlDimensionDefinition = typeof srlDimensionDefinitions.$inferInsert;

// -- SRL KPI Definition --------------------------------------------------------
// Master library of all 44 KPI metrics with normalisation rules and reporting tags.
export const srlKpiDefinitions = pgTable("srl_kpi_definitions", {
  id:                  varchar("id", { length: 36 }).primaryKey(),
  dimensionId:         varchar("dimensionId", { length: 36 }).notNull(),
  kpiCode:             varchar("kpiCode", { length: 20 }).notNull().unique(),
  kpiName:             varchar("kpiName", { length: 200 }).notNull(),
  description:         text("description"),
  dataType:            text("srlKpiDataType").notNull(),
  unit:                varchar("unit", { length: 50 }).notNull(),
  normalisationMethod: text("srlNormMethod").notNull(),
  normTarget:          numeric("normTarget", { precision: 18, scale: 4 }),
  normMin:             numeric("normMin", { precision: 18, scale: 4 }),
  normMax:             numeric("normMax", { precision: 18, scale: 4 }),
  thresholdValue:      numeric("thresholdValue", { precision: 18, scale: 4 }),
  thresholdDirection:  text("srlThreshDir"),
  isMandatory:         boolean("isMandatory").notNull().default(false),
  higherIsBetter:      boolean("higherIsBetter").notNull().default(true),
  sdgTag:              varchar("sdgTag", { length: 50 }),
  griTag:              varchar("griTag", { length: 50 }),
  tcfdTag:             varchar("tcfdTag", { length: 50 }),
  sasbTag:             varchar("sasbTag", { length: 50 }),
  activatedByTrlLevel: integer("activatedByTrlLevel"),
  activatedByMrlLevel: integer("activatedByMrlLevel"),
  effectiveFrom:       date("effectiveFrom").notNull(),
  effectiveTo:         date("effectiveTo"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().notNull(),
});
export type SrlKpiDefinition = typeof srlKpiDefinitions.$inferSelect;
export type InsertSrlKpiDefinition = typeof srlKpiDefinitions.$inferInsert;

// -- SRL Data Source -----------------------------------------------------------
// Registry of all data sources feeding KPI values.
export const srlDataSources = pgTable("srl_data_sources", {
  id:          varchar("id", { length: 36 }).primaryKey(),
  sourceName:  varchar("sourceName", { length: 200 }).notNull(),
  sourceType:  text("srlSrcType").notNull(),
  endpointUrl: varchar("endpointUrl", { length: 500 }),
  frequency:   varchar("frequency", { length: 30 }),
  dataOwner:   varchar("dataOwner", { length: 200 }),
  isActive:    boolean("isActive").notNull().default(true),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().notNull(),
});
export type SrlDataSource = typeof srlDataSources.$inferSelect;
export type InsertSrlDataSource = typeof srlDataSources.$inferInsert;

// -- SRL Weight Configuration --------------------------------------------------
// Stage-aware and sector-aware weight configuration matrix.
// Default weights per BEBUS-SRL-DMS-001 -6 - seeded by migration.
export const srlWeightConfigs = pgTable("srl_weight_configs", {
  id:             varchar("id", { length: 36 }).primaryKey(),
  dimensionCode:  text("srlWcDimCode").notNull(),
  lifecycleStage: text("srlWcStage").notNull(),
  sectorCode:     varchar("sectorCode", { length: 64 }).notNull().default("default"),
  weightValue:    numeric("weightValue", { precision: 5, scale: 4 }).notNull(),
  effectiveFrom:  date("effectiveFrom").notNull(),
  effectiveTo:    date("effectiveTo"),
  createdBy:      varchar("createdBy", { length: 128 }).notNull().default("system"),
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
});
export type SrlWeightConfig = typeof srlWeightConfigs.$inferSelect;
export type InsertSrlWeightConfig = typeof srlWeightConfigs.$inferInsert;

// -- SRL Gate Configuration ----------------------------------------------------
// Framework constants defining composite floor and block type for each gate (G1-G5).
export const srlGateConfigs = pgTable("srl_gate_configs", {
  id:                      varchar("id", { length: 36 }).primaryKey(),
  gateCode:                text("srlGcCode").notNull().unique(),
  compositeFloor:          numeric("compositeFloor", { precision: 5, scale: 2 }).notNull(),
  blockType:               text("srlBlockType").notNull(),
  remediationWindowDays:   integer("remediationWindowDays").notNull(),
  effectiveFrom:           date("effectiveFrom").notNull(),
  effectiveTo:             date("effectiveTo"),
  createdAt:               timestamp("createdAt").defaultNow().notNull(),
});
export type SrlGateConfig = typeof srlGateConfigs.$inferSelect;
export type InsertSrlGateConfig = typeof srlGateConfigs.$inferInsert;

// -- SRL Gate Dimension Floors -------------------------------------------------
// Per-dimension minimum scores required at each gate.
export const srlGateDimensionFloors = pgTable("srl_gate_dimension_floors", {
  id:            varchar("id", { length: 36 }).primaryKey(),
  gateConfigId:  varchar("gateConfigId", { length: 36 }).notNull(),
  dimensionCode: text("srlGdfDimCode").notNull(),
  floorValue:    numeric("floorValue", { precision: 5, scale: 2 }).notNull(),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
});
export type SrlGateDimensionFloor = typeof srlGateDimensionFloors.$inferSelect;
export type InsertSrlGateDimensionFloor = typeof srlGateDimensionFloors.$inferInsert;

// -- SRL Assessment ------------------------------------------------------------
// Immutable scored assessment event for a venture at a point in time.
// is_locked = TRUE once committed; amendments create a new version row.
export const srlAssessments = pgTable("srl_assessments", {
  id:                   varchar("id", { length: 36 }).primaryKey(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  assessmentDate:       date("assessmentDate").notNull(),
  stageAtAssessment:    text("srlStageAtAssmt").notNull(),
  compositeScore:       numeric("compositeScore", { precision: 5, scale: 2 }).notNull(),
  srlLevel:             integer("srlLevel").notNull(),
  scoreDelta:           numeric("scoreDelta", { precision: 5, scale: 2 }),
  gateRef:              varchar("gateRef", { length: 10 }),
  gateStatus:           text("srlGateStatus"),
  sustainabilityWatch:  boolean("sustainabilityWatch").notNull().default(false),
  trajectoryBonus:      numeric("trajectoryBonus", { precision: 5, scale: 2 }).default("0.00"),
  weightConfigSnapshot: json("weightConfigSnapshot").notNull(),
  assessedBy:           varchar("assessedBy", { length: 200 }).notNull(),
  isLocked:             boolean("isLocked").notNull().default(false),
  versionNo:            integer("versionNo").notNull().default(1),
  notes:                text("notes"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
});
export type SrlAssessment = typeof srlAssessments.$inferSelect;
export type InsertSrlAssessment = typeof srlAssessments.$inferInsert;

// -- SRL Dimension Score -------------------------------------------------------
// Per-dimension weighted score within a given assessment (5 rows per assessment).
export const srlDimensionScores = pgTable("srl_dimension_scores", {
  id:             varchar("id", { length: 36 }).primaryKey(),
  assessmentId:   varchar("assessmentId", { length: 36 }).notNull(),
  dimensionId:    varchar("dimensionId", { length: 36 }).notNull(),
  dimensionCode:  text("srlDimScoreCode").notNull(),
  rawScore:       numeric("rawScore", { precision: 5, scale: 2 }).notNull(),
  weightedScore:  numeric("weightedScore", { precision: 5, scale: 2 }).notNull(),
  weightApplied:  numeric("weightApplied", { precision: 5, scale: 4 }).notNull(),
  kpiCoveragePct: numeric("kpiCoveragePct", { precision: 5, scale: 2 }),
  gatePass:       boolean("gatePass"),
  gateFloorValue: numeric("gateFloorValue", { precision: 5, scale: 2 }),
  gapFlags:       json("gapFlags"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
});
export type SrlDimensionScore = typeof srlDimensionScores.$inferSelect;
export type InsertSrlDimensionScore = typeof srlDimensionScores.$inferInsert;

// -- SRL KPI Value -------------------------------------------------------------
// Individual KPI metric observation feeding a dimension score.
export const srlKpiValues = pgTable("srl_kpi_values", {
  id:               varchar("id", { length: 36 }).primaryKey(),
  dimScoreId:       varchar("dimScoreId", { length: 36 }).notNull(),
  kpiDefId:         varchar("kpiDefId", { length: 36 }).notNull(),
  kpiCode:          varchar("kpiCode", { length: 20 }).notNull(),
  sourceId:         varchar("sourceId", { length: 36 }).notNull(),
  rawValue:         numeric("rawValue", { precision: 18, scale: 4 }),
  unit:             varchar("unit", { length: 50 }).notNull(),
  normalisedValue:  numeric("normalisedValue", { precision: 5, scale: 2 }),
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

// -- SRL Gate Holding Status ---------------------------------------------------
// Tracks the compounding gate state machine per venture per gate.
// REMEDIATION - HOLDING - CLEARED (or ESCALATED after 2 restarts).
export const srlGateHoldingStatus = pgTable("srl_gate_holding_status", {
  id:                    varchar("id", { length: 36 }).primaryKey(),
  ventureId:             varchar("ventureId", { length: 64 }).notNull(),
  gateCode:              text("srlGhsGate").notNull(),
  status:                text("srlGhsStatus").notNull(),
  firstFailAssessmentId: varchar("firstFailAssessmentId", { length: 36 }),
  clearanceAssessmentId: varchar("clearanceAssessmentId", { length: 36 }),
  remediationStartDate:  date("remediationStartDate"),
  holdingStartDate:      date("holdingStartDate"),
  clearanceDate:         date("clearanceDate"),
  restartCount:          integer("restartCount").notNull().default(0),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
});
export type SrlGateHoldingStatus = typeof srlGateHoldingStatus.$inferSelect;
export type InsertSrlGateHoldingStatus = typeof srlGateHoldingStatus.$inferInsert;

// -- SRL Reporting Output ------------------------------------------------------
// Persisted report artefacts generated from assessment data.
export const srlReportingOutputs = pgTable("srl_reporting_outputs", {
  id:             varchar("id", { length: 36 }).primaryKey(),
  assessmentId:   varchar("assessmentId", { length: 36 }).notNull(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  reportType:     text("srlReportType").notNull(),
  reportFormat:   text("srlReportFormat").notNull(),
  reportStandard: text("srlReportStandard"),
  fileRef:        varchar("fileRef", { length: 500 }),
  generatedBy:    varchar("generatedBy", { length: 200 }).notNull(),
  generatedAt:    timestamp("generatedAt").defaultNow().notNull(),
  periodStart:    date("periodStart"),
  periodEnd:      date("periodEnd"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
});
export type SrlReportingOutput = typeof srlReportingOutputs.$inferSelect;
export type InsertSrlReportingOutput = typeof srlReportingOutputs.$inferInsert;

// -- SRL Audit Log -------------------------------------------------------------
// Append-only, immutable audit record for all SRL scoring events and config changes.
// payloadHash is SHA-256 of the submitted payload for tamper detection.
export const srlAuditLog = pgTable("srl_audit_log", {
  id:             integer("id").primaryKey(),
  eventType:      text("srlAuditEvtType").notNull(),
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

// -------------------------------------------------------------------------------
// MRL MODULE - Manufacturing Readiness Level Intelligence System v1.0
// Five-engine architecture: PDE - SCIE - CSM - QCE - SIL
// -------------------------------------------------------------------------------

// -- MRL Assessments -----------------------------------------------------------
// Top-level assessment record capturing composite MRL level and subsystem scores.
export const mrlAssessments = pgTable("mrl_assessments", {
  id:              varchar("id", { length: 36 }).primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  mrlLevel:        integer("mrlLevel").notNull(),           // 1-9
  mrlLabel:        varchar("mrlLabel", { length: 64 }).notNull(), // e.g. "Pilot Proven"
  trlLevel:        integer("trlLevel"),                     // TRL at time of assessment
  // Subsystem scores (0-100 each)
  pdeScore:        integer("pdeScore"),                     // Process Design Engine
  scieScore:       integer("scieScore"),                    // Supply Chain Intelligence Engine
  csmScore:        integer("csmScore"),                     // Cost & Scale Model
  qceScore:        integer("qceScore"),                     // Quality & Compliance Engine
  silScore:        integer("silScore"),                     // Sustainability Integration Layer
  compositeScore:  integer("compositeScore"),               // weighted composite (0-100)
  // Engine A normalised MRL contribution (0–1); dual-pathway: 0.35 Product + 0.40 Execution in vrl.engine.ts
  vrlContribution: doublePrecision("vrlContribution"),            // Engine A normalised (mrlLevel−1)/8 → 0–1
  // Risk summary
  riskScoreOverall: integer("riskScoreOverall"),            // 0-100 RAG aggregate
  riskRag:         text("mrlRiskRag").default("AMBER"),
  // Integration model
  mrlRegion: text("mrlRegion").default("HYBRID"),
  notes:           text("notes"),
  assessedBy:      varchar("assessedBy", { length: 128 }),
  // D6 provenance column — identifies the scoring engine that produced this row
  engineVersion:   varchar("engineVersion", { length: 32 }).notNull().default("engine-a"),
  assessedAt:      timestamp("assessedAt").defaultNow().notNull(),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type MrlAssessment = typeof mrlAssessments.$inferSelect;
export type InsertMrlAssessment = typeof mrlAssessments.$inferInsert;

// -- MRL Process Routes (Process Design Engine - PDE) -------------------------
// Directed-graph process route: each record is a single operation node.
export const mrlProcessRoutes = pgTable("mrl_process_routes", {
  id:              varchar("id", { length: 36 }).primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  assessmentId:    varchar("assessmentId", { length: 36 }),
  routeName:       varchar("routeName", { length: 255 }).notNull(),
  // Operations stored as JSON array: [{id, label, type, cycleTimeSec, isBottleneck}]
  operations:      json("operations").notNull(),
  // Tooling requirements: [{tool, leadTimeWeeks, costGbp, isCustom}]
  toolingSpecs:    json("toolingSpecs"),
  bottleneckNodes: json("bottleneckNodes"),              // operation IDs flagged as bottlenecks
  targetVolumePerYear: integer("targetVolumePerYear"),
  cycleTimeModelSec:   integer("cycleTimeModelSec"),         // theoretical cycle time (seconds)
  pdeScore:        integer("pdeScore"),                      // 0-100
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type MrlProcessRoute = typeof mrlProcessRoutes.$inferSelect;
export type InsertMrlProcessRoute = typeof mrlProcessRoutes.$inferInsert;

// -- MRL Suppliers (Supply Chain Intelligence Engine - SCIE) ------------------
// Supplier records linked to ventures via BOM tier.
export const mrlSuppliers = pgTable("mrl_suppliers", {
  id:              varchar("id", { length: 36 }).primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  name:            varchar("name", { length: 255 }).notNull(),
  tier:            text("mrlSupplierTier").default("T1"),
  country:         varchar("country", { length: 64 }).notNull(),
  region:          text("mrlSupplierRegion").default("CN"),
  category:        varchar("category", { length: 128 }),  // e.g. "Electronics", "Plastics"
  // BOM components supplied: [{partNo, description, moq, leadTimeWeeks}]
  bomComponents:   json("bomComponents"),
  // Risk scoring
  riskScore:       integer("riskScore").default(0),           // 0-100 (RAG - P - I)
  riskRag:         text("mrlScieRag").default("AMBER"),
  isSingleSource:  boolean("isSingleSource").default(false),
  hasDualSource:   boolean("hasDualSource").default(false),
  leadTimeWeeks:   integer("leadTimeWeeks"),
  moqUnits:        integer("moqUnits"),
  fxExposure:      text("mrlFxExposure").default("MED"),
  geopoliticalRisk: text("mrlGeoRisk").default("LOW"),
  auditStatus:     text("mrlAuditStatus").default("Not Audited"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type MrlSupplier = typeof mrlSuppliers.$inferSelect;
export type InsertMrlSupplier = typeof mrlSuppliers.$inferInsert;

// -- MRL Cost Models (Cost & Scale Model - CSM) -------------------------------
// Parametric cost model with volume scenarios and unit economics.
export const mrlCostModels = pgTable("mrl_cost_models", {
  id:              varchar("id", { length: 36 }).primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  assessmentId:    varchar("assessmentId", { length: 36 }),
  modelName:       varchar("modelName", { length: 255 }).notNull(),
  region:          text("mrlCostRegion").default("HYBRID"),
  // Volume scenarios: [{volume, unitCostGbp, marginPct, breakEvenVol}]
  volumeScenarios: json("volumeScenarios").notNull(),
  // Unit economics at target volume
  targetVolume:    integer("targetVolume"),
  unitCostGbp:     doublePrecision("unitCostGbp"),
  unitPriceGbp:    doublePrecision("unitPriceGbp"),
  grossMarginPct:  doublePrecision("grossMarginPct"),
  breakEvenVolume: integer("breakEvenVolume"),
  // CapEx / OpEx split
  capexGbp:        doublePrecision("capexGbp"),
  opexAnnualGbp:   doublePrecision("opexAnnualGbp"),
  capexOpexRatio:  doublePrecision("capexOpexRatio"),
  // Labour rates by region: [{region, roleType, hourlyRateGbp}]
  labourRates:     json("labourRates"),
  // Sensitivity: [{driver, lowImpact, highImpact}]
  sensitivityFactors: json("sensitivityFactors"),
  csmScore:        integer("csmScore"),                      // 0-100
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type MrlCostModel = typeof mrlCostModels.$inferSelect;
export type InsertMrlCostModel = typeof mrlCostModels.$inferInsert;

// -- MRL Compliance Records (Quality & Compliance Engine - QCE) ---------------
// Per-standard compliance tracking with certification roadmap.
export const mrlComplianceRecords = pgTable("mrl_compliance_records", {
  id:              varchar("id", { length: 36 }).primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  assessmentId:    varchar("assessmentId", { length: 36 }),
  standard:        varchar("standard", { length: 128 }).notNull(), // e.g. "ISO 9001", "CE", "UKCA"
  market:          varchar("market", { length: 64 }).notNull(),     // e.g. "UK", "EU", "US"
  category:        text("mrlComplianceCat").default("Quality Management"),
  status:          text("mrlComplianceStatus").default("Not Started"),
  gapSummary:      text("gapSummary"),
  certificationBody: varchar("certificationBody", { length: 255 }),
  targetCertDate:  date("targetCertDate"),
  actualCertDate:  date("actualCertDate"),
  expiryDate:      date("expiryDate"),
  estimatedCostGbp: doublePrecision("estimatedCostGbp"),
  estimatedWeeks:  integer("estimatedWeeks"),
  isOnCriticalPath: boolean("isOnCriticalPath").default(false),
  // Quality KPIs: [{kpi, target, current, unit}]
  qualityKpis:     json("qualityKpis"),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type MrlComplianceRecord = typeof mrlComplianceRecords.$inferSelect;
export type InsertMrlComplianceRecord = typeof mrlComplianceRecords.$inferInsert;

// -- MRL LCSA Records (Sustainability Integration Layer - SIL) -----------------
// Lifecycle and Social Assessment records aligned to ISO 14040/44 + SA8000.
export const mrlLcsaRecords = pgTable("mrl_lcsa_records", {
  id:              varchar("id", { length: 36 }).primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  assessmentId:    varchar("assessmentId", { length: 36 }),
  // Carbon intensity
  carbonScope1:    doublePrecision("carbonScope1"),                // kgCO2e - direct emissions
  carbonScope2:    doublePrecision("carbonScope2"),                // kgCO2e - energy indirect
  carbonScope3:    doublePrecision("carbonScope3"),                // kgCO2e - value chain
  carbonIntensityPerUnit: doublePrecision("carbonIntensityPerUnit"), // kgCO2e per unit produced
  // LCSA composite
  lcsaScore:       integer("lcsaScore"),                     // 0-100
  circularityIndex: doublePrecision("circularityIndex"),           // 0-1 (1 = fully circular)
  // Social risk
  socialRiskIndex: doublePrecision("socialRiskIndex"),             // 0-100 (higher = more risk)
  // Facility energy mix: [{facility, energyMixPct: {renewable, grid, fossil}}]
  facilityEnergyMix: json("facilityEnergyMix"),
  // CBAM exposure
  cbamExposure:    text("mrlCbamExposure").default("None"),
  cbamEstimatedCostGbp: doublePrecision("cbamEstimatedCostGbp"),
  // Benchmark vs sector
  sectorBenchmarkScore: integer("sectorBenchmarkScore"),
  silScore:        integer("silScore"),                      // 0-100
  notes:           text("notes"),
  recordedAt:      timestamp("recordedAt").defaultNow().notNull(),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type MrlLcsaRecord = typeof mrlLcsaRecords.$inferSelect;
export type InsertMrlLcsaRecord = typeof mrlLcsaRecords.$inferInsert;

// -- MRL Risk Register ---------------------------------------------------------
// Per-assessment risk register using RAG - Probability - Impact formula.
export const mrlRiskRegister = pgTable("mrl_risk_register", {
  id:              varchar("id", { length: 36 }).primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  assessmentId:    varchar("assessmentId", { length: 36 }),
  category:        text("mrlRiskCat").notNull(),
  description:     text("description").notNull(),
  // RAG - Probability - Impact = Risk Score (0-100)
  rag:             text("mrlRag").notNull(), // 1=G / 2=A / 3=R
  probability:     integer("probability").notNull(),                 // 0-100
  impact:          integer("impact").notNull(),                      // 0-100
  riskScore:       integer("riskScore").notNull(),                   // computed: rag-P-I / 300
  priority:        text("mrlRiskPriority").default("MED"),
  mitigationAction: text("mitigationAction"),
  mitigationOwner: varchar("mitigationOwner", { length: 128 }),
  targetResolutionDate: date("targetResolutionDate"),
  status:          text("mrlRiskStatus").default("Open"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type MrlRiskItem = typeof mrlRiskRegister.$inferSelect;
export type InsertMrlRiskItem = typeof mrlRiskRegister.$inferInsert;

// -- MRL Level Definitions (reference / seed data) ----------------------------
// Canonical MRL level definitions aligned to the ECOBLEND MRL framework v1.0.
export const mrlLevelDefs = pgTable("mrl_level_defs", {
  level:           integer("level").primaryKey(),            // 1-9
  label:           varchar("label", { length: 64 }).notNull(),  // e.g. "Pilot Proven"
  trlAlignment:    varchar("trlAlignment", { length: 16 }),     // e.g. "5-6"
  description:     text("description").notNull(),
  keyActivities:   json("keyActivities"),                // string[]
  exitCriteria:    json("exitCriteria"),                 // string[]
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type MrlLevelDef = typeof mrlLevelDefs.$inferSelect;
export type InsertMrlLevelDef = typeof mrlLevelDefs.$inferInsert;

// -- TRL/MRL Sync Engine Tables ------------------------------------------------
// Three tables only. ventures table already exists from MRL module.
// Spec: BEBUS-SYNC-SE-001 / trlmrlsyncengine.pdf

// sync_assessments - insert-only, one row per computeSync() call
export const syncAssessments = pgTable("sync_assessments", {
  syncId:           varchar("syncId", { length: 36 }).primaryKey(),
  ventureId:        varchar("ventureId", { length: 36 }).notNull(),
  trl:              integer("trl").notNull(),
  mrl:              integer("mrl").notNull(),
  delta:            integer("delta").notNull(),
  psi:              numeric("psi", { precision: 8, scale: 4 }).notNull(),
  rho:              numeric("rho", { precision: 8, scale: 4 }).notNull(),
  eta:              numeric("eta", { precision: 6, scale: 4 }).notNull(),
  vrlPenalty:       numeric("vrlPenalty", { precision: 6, scale: 4 }).notNull(),
  adjustedVrl:      numeric("adjustedVrl", { precision: 5, scale: 2 }),
  wStage:           numeric("wStage", { precision: 5, scale: 3 }).notNull(),
  wVelocity:        numeric("wVelocity", { precision: 6, scale: 4 }).notNull(),
  severity:         text("syncSeverity").notNull(),
  primaryPath:      varchar("primaryPath", { length: 40 }).notNull(),
  domainSupply:     numeric("domainSupply", { precision: 4, scale: 3 }).notNull().default("0.500"),
  domainCost:       numeric("domainCost", { precision: 4, scale: 3 }).notNull().default("0.500"),
  domainCompliance: numeric("domainCompliance", { precision: 4, scale: 3 }).notNull().default("0.500"),
  actions:          json("actions").notNull(),
  historySnapshot:  json("historySnapshot"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type SyncAssessment = typeof syncAssessments.$inferSelect;
export type InsertSyncAssessment = typeof syncAssessments.$inferInsert;

// sync_history - append-only, one row per TRL or MRL change
export const syncHistory = pgTable("sync_history", {
  historyId:   varchar("historyId", { length: 36 }).primaryKey(),
  ventureId:   varchar("ventureId", { length: 36 }).notNull(),
  trl:         integer("trl").notNull(),
  mrl:         integer("mrl").notNull(),
  delta:       integer("delta").notNull(),
  recordedAt:  timestamp("recordedAt").defaultNow().notNull(),
});
export type SyncHistoryRow = typeof syncHistory.$inferSelect;
export type InsertSyncHistoryRow = typeof syncHistory.$inferInsert;

// sync_scenarios - 5 seeded demo scenarios (isDemo = true)
export const syncScenarios = pgTable("sync_scenarios", {
  scenarioId:        varchar("scenarioId", { length: 36 }).primaryKey(),
  name:              varchar("name", { length: 80 }).notNull(),
  sector:            varchar("sector", { length: 80 }).notNull(),
  trl:               integer("trl").notNull(),
  mrl:               integer("mrl").notNull(),
  domainSupply:      numeric("domainSupply", { precision: 4, scale: 3 }).notNull(),
  domainCost:        numeric("domainCost", { precision: 4, scale: 3 }).notNull(),
  domainCompliance:  numeric("domainCompliance", { precision: 4, scale: 3 }).notNull(),
  history:           json("history").notNull(),
  isDemo:            boolean("isDemo").notNull().default(true),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
});
export type SyncScenario = typeof syncScenarios.$inferSelect;
export type InsertSyncScenario = typeof syncScenarios.$inferInsert;

// ============================================================
// MRL SCORING SYSTEM - BEBUS-MRL-SCORE-001
// Tables: scoring_sessions, scoring_category_results, scoring_datasets
// Do NOT recreate: ventures, mrl_assessments (already exist)
// ============================================================

// scoring_sessions - insert-only audit log of every MRL score run
export const scoringSessions = pgTable("scoring_sessions", {
  sessionId:       varchar("sessionId", { length: 36 }).primaryKey(),
  ventureId:       varchar("ventureId", { length: 36 }),
  ventureName:     varchar("ventureName", { length: 120 }),
  mrlScore:        numeric("mrlScore", { precision: 5, scale: 1 }).notNull(),
  mrlScoreRaw:     numeric("mrlScoreRaw", { precision: 5, scale: 1 }).notNull(),
  mrlLevel:        integer("mrlLevel").notNull(),
  mrlLabel:        varchar("mrlLabel", { length: 40 }).notNull(),
  confidenceBand:  numeric("confidenceBand", { precision: 5, scale: 2 }).notNull(),
  gateLocked:      boolean("gateLocked").notNull().default(false),
  gateReason:      text("gateReason"),
  schemaVersion:   varchar("schemaVersion", { length: 20 }).notNull().default("1.0.0"),
  scoredBy:        varchar("scoredBy", { length: 36 }),
  assessmentType:  varchar("assessmentType", { length: 20 }).notNull().default("manual"),
  snapshotHash:    varchar("snapshotHash", { length: 64 }).notNull(),
  // D6 provenance columns — added via migration d6-engine-provenance
  engineVersion:   varchar("engineVersion", { length: 32 }).notNull().default("unknown"),
  supersededAt:    timestamp("supersededAt"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type ScoringSession = typeof scoringSessions.$inferSelect;
export type InsertScoringSession = typeof scoringSessions.$inferInsert;

// scoring_category_results - one row per category per session (5 rows per session)
export const scoringCategoryResults = pgTable("scoring_category_results", {
  resultId:        varchar("resultId", { length: 36 }).primaryKey(),
  sessionId:       varchar("sessionId", { length: 36 }).notNull(),
  category:        varchar("category", { length: 30 }).notNull(),
  scoreS:          numeric("scoreS", { precision: 6, scale: 4 }).notNull(),
  maturityM:       numeric("maturityM", { precision: 4, scale: 2 }).notNull(),
  weightW:         numeric("weightW", { precision: 4, scale: 2 }).notNull(),
  contribution:    numeric("contribution", { precision: 8, scale: 4 }).notNull(),
  maturityLabel:   varchar("maturityLabel", { length: 20 }).notNull(),
  indicatorScores: json("indicatorScores").notNull(),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type ScoringCategoryResult = typeof scoringCategoryResults.$inferSelect;
export type InsertScoringCategoryResult = typeof scoringCategoryResults.$inferInsert;

// scoring_datasets - seeded demo datasets (4 canonical examples)
export const scoringDatasets = pgTable("scoring_datasets", {
  datasetId:           varchar("datasetId", { length: 36 }).primaryKey(),
  name:                varchar("name", { length: 80 }).notNull(),
  sector:              varchar("sector", { length: 80 }).notNull(),
  description:         text("description"),
  indicatorScores:     json("indicatorScores").notNull(),
  maturityScores:      json("maturityScores").notNull(),
  isDemo:              boolean("isDemo").notNull().default(true),
  expectedMrlLevel:    integer("expectedMrlLevel"),
  expectedGateLocked:  boolean("expectedGateLocked"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
});
export type ScoringDataset = typeof scoringDatasets.$inferSelect;
export type InsertScoringDataset = typeof scoringDatasets.$inferInsert;

// -------------------------------------------------------------------------------
// VRL WEIGHTED GATING MODEL - 9-Vector Assessment (BEBUS-VRL-UPDATE-001)
// Spec: EcoBlendVRLUpdateManusPrompt.pdf - Changes 1-6
// -------------------------------------------------------------------------------
// vrl_assessments - one row per scored assessment, insert-only audit trail
export const vrlAssessments = pgTable("vrl_assessments", {
  id:                   varchar("id", { length: 64 }).primaryKey(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  // -- 9 raw input scores (0-100) ----------------------------------------------
  trlScore:             integer("trl_score").notNull(),
  mrlScore:             integer("mrl_score").notNull(),
  brlScore:             integer("brl_score").notNull(),
  ecoScore:             integer("eco_score").notNull(),
  prlScore:             integer("prl_score").notNull(),
  ipScore:              integer("ip_score").notNull(),
  frlScore:             integer("frl_score").notNull(),
  regScore:             integer("reg_score").notNull(),
  srlScore:             integer("srl_score").notNull(),
  // -- 5 computed meta-domain scores ------------------------------------------
  productScore:         numeric("product_score",      { precision: 5, scale: 2 }),
  marketScore:          numeric("market_score",       { precision: 5, scale: 2 }),
  executionScore:       numeric("execution_score",    { precision: 5, scale: 2 }),
  structuralScore:      numeric("structural_score",   { precision: 5, scale: 2 }),
  sustainabilityScore:  numeric("sustainability_score", { precision: 5, scale: 2 }),
  // -- VRL output -------------------------------------------------------------
  baseAverage:          numeric("base_average",       { precision: 5, scale: 2 }),
  isVetoed:             boolean("is_vetoed").default(false).notNull(),
  globalVrlScore:       integer("global_vrl_score"),
  bandLabel:            varchar("band_label", { length: 64 }),
  // -- Metadata ---------------------------------------------------------------
  submittedBy:          varchar("submitted_by", { length: 128 }),
});
export type VrlAssessment = typeof vrlAssessments.$inferSelect;
export type InsertVrlAssessment = typeof vrlAssessments.$inferInsert;

// -------------------------------------------------------------------------------
// COACHING MODULE V2 - Execution Discipline Engine (BEBUS-COACH-V2-001)
// Architecture Pack: EcoBlendCoachingV2ManusArchitecturePack.docx
// Tables created in FK dependency order per Section 2.2
// -------------------------------------------------------------------------------

// coaching_coaches - coach profiles and availability
export const coachingCoaches = pgTable("coaching_coaches", {
  id:           varchar("id", { length: 64 }).primaryKey(),
  name:         varchar("name", { length: 128 }).notNull(),
  email:        varchar("email", { length: 320 }),
  type:         text("type").notNull().default("execution"),
  rating:       numeric("rating", { precision: 3, scale: 2 }).default("0.00"), // 0.00 to 5.00
  availability: json("availability"),  // schedule slots JSON
  bio:          text("bio"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});
export type CoachingCoach = typeof coachingCoaches.$inferSelect;
export type InsertCoachingCoach = typeof coachingCoaches.$inferInsert;

// coaching_commitments - weekly founder commitments with measurable success indicators
export const coachingCommitments = pgTable("coaching_commitments", {
  id:          varchar("id", { length: 64 }).primaryKey(),
  founderId:   integer("founderId").notNull(),  // FK - founders.id
  ventureId:   varchar("ventureId", { length: 64 }),  // FK - ventures.id
  week:        date("week").notNull(),  // ISO week start date (Monday)
  task:        text("task").notNull(),
  metric:      text("metric"),  // measurable success indicator
  status:      text("status").notNull().default("pending"),
  coachVerified: boolean("coachVerified").default(false),  // coach must verify before counting as complete
  evidenceNote: text("evidenceNote"),  // evidence submitted by founder
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().notNull(),
});
export type CoachingCommitment = typeof coachingCommitments.$inferSelect;
export type InsertCoachingCommitment = typeof coachingCommitments.$inferInsert;

// coaching_sessions - logged coaching sessions with structured action items
export const coachingSessions = pgTable("coaching_sessions", {
  id:          varchar("id", { length: 64 }).primaryKey(),
  coachId:     varchar("coachId", { length: 64 }).notNull(),  // FK - coaching_coaches.id
  founderId:   integer("founderId").notNull(),  // FK - founders.id
  ventureId:   varchar("ventureId", { length: 64 }),
  sessionDate: date("sessionDate").notNull(),
  focusArea:     text("focusArea"),
  coachName:     text("coach_name"),   // denormalised display name
  durationHours: numeric("duration_hours", { precision: 5, scale: 2 }),
  notes:         text("notes"),
  actions:       json("actions"),  // array of { id, text, done }
  sessionType: text("sessionType").default("check_in"),
  durationMins: integer("durationMins").default(60),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().notNull(),
});
export type CoachingSession = typeof coachingSessions.$inferSelect;
export type InsertCoachingSession = typeof coachingSessions.$inferInsert;

// coaching_behaviour_metrics - weekly behavioural metrics per founder
export const coachingBehaviourMetrics = pgTable("coaching_behaviour_metrics", {
  id:                 varchar("id", { length: 64 }).primaryKey(),
  founderId:          integer("founderId").notNull(),  // FK - founders.id
  ventureId:          varchar("ventureId", { length: 64 }),
  week:               date("week").notNull(),  // ISO week start date
  completionRate:     numeric("completionRate", { precision: 5, scale: 2 }).default("0.00"),  // 0.00 to 100.00
  focusHours:         numeric("focusHours", { precision: 4, scale: 1 }).default("0.0"),  // hours per week
  delayTime:          numeric("delayTime", { precision: 4, scale: 1 }).default("0.0"),  // avg days task delayed
  missedCommitments:  integer("missedCommitments").default(0),
  totalCommitments:   integer("totalCommitments").default(0),
  completedCommitments: integer("completedCommitments").default(0),
  calculatedAt:       timestamp("calculatedAt").defaultNow().notNull(),
});
export type CoachingBehaviourMetric = typeof coachingBehaviourMetrics.$inferSelect;
export type InsertCoachingBehaviourMetric = typeof coachingBehaviourMetrics.$inferInsert;

// coaching_frl - Founder Readiness Level scores per founder per week
// FRL = (0.4 - completion_rate) + (0.2 - focus_hours) - (0.2 - delay_time) - (0.2 - missed_commitments)
export const coachingFrl = pgTable("coaching_frl", {
  id:           varchar("id", { length: 64 }).primaryKey(),
  founderId:    integer("founderId").notNull(),  // FK - founders.id
  ventureId:    varchar("ventureId", { length: 64 }),
  week:         date("week").notNull(),
  score:        numeric("score", { precision: 5, scale: 2 }).notNull().default("0.00"),  // 0.00 to 100.00
  trend:        text("trend").notNull().default("stable"),
  riskLevel:    text("riskLevel").notNull().default("MEDIUM"),
  // component scores for audit trail
  completionComponent:  numeric("completionComponent", { precision: 5, scale: 2 }),
  focusComponent:       numeric("focusComponent", { precision: 5, scale: 2 }),
  delayPenalty:         numeric("delayPenalty", { precision: 5, scale: 2 }),
  missedPenalty:        numeric("missedPenalty", { precision: 5, scale: 2 }),
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
});
export type CoachingFrl = typeof coachingFrl.$inferSelect;
export type InsertCoachingFrl = typeof coachingFrl.$inferInsert;

// coaching_vrl_link - FRL-adjusted VRL execution score per venture
// execution_score = FRL.score - frl_weight; adjusted_vrl = base_vrl + execution_score (capped at 100)
export const coachingVrlLink = pgTable("coaching_vrl_link", {
  id:             varchar("id", { length: 64 }).primaryKey(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull().unique(),  // FK - ventures.id
  frlWeight:      numeric("frlWeight", { precision: 3, scale: 2 }).notNull().default("0.25"),  // configurable per venture, default 0.25
  executionScore: numeric("executionScore", { precision: 5, scale: 2 }).default("0.00"),  // PRL-adjusted execution input
  baseVrl:        numeric("baseVrl", { precision: 5, scale: 2 }).default("0.00"),  // base VRL before PRL adjustment
  adjustedVrl:    numeric("adjustedVrl", { precision: 5, scale: 2 }).default("0.00"),  // resultant VRL score (capped at 100)
  riskFlagged:    boolean("riskFlagged").default(false),  // true when PRL risk level is HIGH
  updatedAt:      timestamp("updatedAt").defaultNow().notNull(),
});
export type CoachingVrlLink = typeof coachingVrlLink.$inferSelect;
export type InsertCoachingVrlLink = typeof coachingVrlLink.$inferInsert;

// coaching_insights - AI-generated behavioural analysis per founder per week
// Populated by LLM integration; stores structured risks, patterns, recommendations
export const coachingInsights = pgTable("coaching_insights", {
  id:              varchar("id", { length: 64 }).primaryKey(),
  founderId:       integer("founderId").notNull(),  // FK - founders.id
  ventureId:       varchar("ventureId", { length: 64 }),
  week:            date("week").notNull(),
  prlScoreAtTime:  numeric("prlScoreAtTime", { precision: 5, scale: 2 }),
  prlTrendAtTime:  varchar("prlTrendAtTime", { length: 20 }),
  risks:           json("risks"),           // array of risk strings
  patterns:        json("patterns"),        // array of pattern strings
  recommendations: json("recommendations"), // array of recommendation strings
  rawPayload:      json("rawPayload"),       // full input payload sent to LLM
  rawResponse:     json("rawResponse"),     // full LLM response
  generatedAt:     timestamp("generatedAt").defaultNow().notNull(),
  retryCount:      integer("retryCount").default(0),
  status:          text("status").default("pending"),
});
export type CoachingInsight = typeof coachingInsights.$inferSelect;
export type InsertCoachingInsight = typeof coachingInsights.$inferInsert;

// -------------------------------------------------------------------------------
// Sprint 78 - Coach Assignment & Commitment Templates
// -------------------------------------------------------------------------------

// coaching_assignments - links coaches to founders/ventures
export const coachingAssignments = pgTable("coaching_assignments", {
  id:          varchar("id", { length: 64 }).primaryKey(),
  coachId:     varchar("coachId", { length: 64 }).notNull(),   // FK - coaching_coaches.id
  founderId:   integer("founderId").notNull(),                      // FK - founders.id
  ventureId:   varchar("ventureId", { length: 64 }),            // FK - ventures.id (optional)
  role:        text("role").notNull().default("primary"),
  startDate:   date("startDate").notNull(),
  endDate:     date("endDate"),                                  // null = active
  notes:       text("notes"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().notNull(),
});
export type CoachingAssignment = typeof coachingAssignments.$inferSelect;
export type InsertCoachingAssignment = typeof coachingAssignments.$inferInsert;

// coaching_commitment_templates - pre-built commitment sets per VRL stage
export const coachingCommitmentTemplates = pgTable("coaching_commitment_templates", {
  id:                  varchar("id", { length: 64 }).primaryKey(),
  vrlStage:            integer("vrlStage").notNull(),                // 1-4 (maps to VRL stages)
  title:               varchar("title", { length: 256 }).notNull(),
  description:         text("description"),
  category:            text("category").notNull().default("execution"),
  defaultDueOffsetDays: integer("defaultDueOffsetDays").notNull().default(7), // days from week start
  metric:              text("metric"),                           // measurable success indicator
  priority:            text("priority").notNull().default("medium"),
  isActive:            boolean("isActive").notNull().default(true),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
});
export type CoachingCommitmentTemplate = typeof coachingCommitmentTemplates.$inferSelect;
export type InsertCoachingCommitmentTemplate = typeof coachingCommitmentTemplates.$inferInsert;

// -- Sprint 79: Coaching Onboarding State -------------------------------------
export const coachingOnboardingState = pgTable("coaching_onboarding_state", {
  id: serial("id").primaryKey(),
  founderId: varchar("founder_id", { length: 255 }).notNull().unique(),
  currentVrlStage: integer("current_vrl_stage").notNull().default(1),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  templateApplied: boolean("template_applied").notNull().default(false),
  completedAt: integer("completed_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
export type CoachingOnboardingState = typeof coachingOnboardingState.$inferSelect;
export type InsertCoachingOnboardingState = typeof coachingOnboardingState.$inferInsert;

// -------------------------------------------------------------------------------
// Sprint 80 - PRL Trend Alerts
// -------------------------------------------------------------------------------
// prl_trend_alerts - auto-generated alerts when PRL drops or risk escalates
export const prlTrendAlerts = pgTable("prl_trend_alerts", {
  id:           varchar("id", { length: 64 }).primaryKey(),
  founderId:    integer("founderId").notNull(),          // FK - founders.id
  ventureId:    varchar("ventureId", { length: 64 }), // FK - ventures.id
  alertType:    text("alertType").notNull(),
  severity:     text("severity").notNull().default("warning"),
  message:      text("message").notNull(),           // human-readable alert message
  weekOf:       date("weekOf").notNull(),             // ISO week start date
  prlScore:     numeric("prlScore", { precision: 5, scale: 2 }), // PRL score at time of alert
  prlDelta:     numeric("prlDelta", { precision: 5, scale: 2 }), // WoW change (negative = drop)
  acknowledged: boolean("acknowledged").notNull().default(false),
  acknowledgedAt: timestamp("acknowledgedAt"),
  acknowledgedBy: varchar("acknowledgedBy", { length: 128 }), // coach/studio user
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type PrlTrendAlert = typeof prlTrendAlerts.$inferSelect;
export type InsertPrlTrendAlert = typeof prlTrendAlerts.$inferInsert;

// -------------------------------------------------------------------------------
// Sprint 81 - Founder Progress Reports
// -------------------------------------------------------------------------------
// founder_progress_reports - AI-generated progress reports per founder
export const founderProgressReports = pgTable("founder_progress_reports", {
  id:           varchar("id", { length: 64 }).primaryKey(),
  founderId:    integer("founderId").notNull(),          // FK - founders.id
  ventureId:    varchar("ventureId", { length: 64 }), // FK - ventures.id
  reportHtml:   text("reportHtml").notNull(),    // rendered HTML content
  aiNarrative:  text("aiNarrative"),                 // AI-generated executive summary
  prlSummary:   json("prlSummary"),                  // { current, trend, weeksTracked, avgScore }
  commitmentStats: json("commitmentStats"),           // { total, completed, missed, completionRate }
  sessionCount: integer("sessionCount").notNull().default(0),
  periodStart:  date("periodStart").notNull(),        // report covers from this date
  periodEnd:    date("periodEnd").notNull(),           // report covers to this date
  generatedAt:  timestamp("generatedAt").defaultNow().notNull(),
  sentAt:       timestamp("sentAt"),                  // null = not yet sent
  status:       text("status").notNull().default("draft"),
});
export type FounderProgressReport = typeof founderProgressReports.$inferSelect;
export type InsertFounderProgressReport = typeof founderProgressReports.$inferInsert;

// -------------------------------------------------------------------------------
// Sprint 82 - Coach Performance Leaderboard
// -------------------------------------------------------------------------------
// coach_performance_snapshots - weekly computed performance metrics per coach
export const coachPerformanceSnapshots = pgTable("coach_performance_snapshots", {
  id:                       varchar("id", { length: 64 }).primaryKey(),
  coachId:                  varchar("coachId", { length: 64 }).notNull(), // FK - coaching_coaches.id
  weekOf:                   date("weekOf").notNull(),                      // ISO week start date
  foundersAssigned:         integer("foundersAssigned").notNull().default(0),
  sessionCount:             integer("sessionCount").notNull().default(0),
  avgPrlImprovement:        numeric("avgPrlImprovement", { precision: 6, scale: 2 }).notNull().default("0.00"), // avg WoW PRL delta across founders
  commitmentCompletionRate: numeric("commitmentCompletionRate", { precision: 5, scale: 2 }).notNull().default("0.00"), // % of commitments completed
  highRiskFounders:         integer("highRiskFounders").notNull().default(0),  // founders in HIGH risk this week
  recoveredFounders:        integer("recoveredFounders").notNull().default(0), // founders moved out of HIGH risk
  compositeScore:           numeric("compositeScore", { precision: 5, scale: 2 }).notNull().default("0.00"), // 0-100 leaderboard score
  rank:                     integer("rank"),                                    // rank among all coaches this week
  computedAt:               timestamp("computedAt").defaultNow().notNull(),
});
export type CoachPerformanceSnapshot = typeof coachPerformanceSnapshots.$inferSelect;
export type InsertCoachPerformanceSnapshot = typeof coachPerformanceSnapshots.$inferInsert;

// -------------------------------------------------------------------------------
// Sprint 83 - Automated Alert Scheduling
// -------------------------------------------------------------------------------
export const alertScheduleLog = pgTable("alert_schedule_log", {
  id:               varchar("id", { length: 64 }).primaryKey(),
  triggeredAt:      timestamp("triggeredAt").defaultNow().notNull(),
  triggeredBy:      text("triggeredBy").notNull().default("manual"),
  foundersScanned:  integer("foundersScanned").notNull().default(0),
  alertsGenerated:  integer("alertsGenerated").notNull().default(0),
  alertsCritical:   integer("alertsCritical").notNull().default(0),
  alertsWarning:    integer("alertsWarning").notNull().default(0),
  alertsInfo:       integer("alertsInfo").notNull().default(0),
  durationMs:       integer("durationMs"),
  status:           text("status").notNull().default("success"),
  errorMessage:     text("errorMessage"),
  weekOf:           date("weekOf").notNull(),
});
export type AlertScheduleLog = typeof alertScheduleLog.$inferSelect;
export type InsertAlertScheduleLog = typeof alertScheduleLog.$inferInsert;

// -------------------------------------------------------------------------------
// Sprint 84 - Progress Report Email Delivery Log
// -------------------------------------------------------------------------------
export const reportDeliveryLog = pgTable("report_delivery_log", {
  id:             varchar("id", { length: 64 }).primaryKey(),
  reportId:       varchar("reportId", { length: 64 }).notNull(),
  founderId:      integer("founderId").notNull(),
  sentAt:         timestamp("sentAt").defaultNow().notNull(),
  sentBy:         varchar("sentBy", { length: 128 }),
  channel:        text("channel").notNull().default("notification"),
  status:         text("status").notNull().default("sent"),
  errorMessage:   text("errorMessage"),
  notificationId: varchar("notificationId", { length: 128 }),
});
export type ReportDeliveryLog = typeof reportDeliveryLog.$inferSelect;
export type InsertReportDeliveryLog = typeof reportDeliveryLog.$inferInsert;

// -------------------------------------------------------------------------------
// Sprint 85 - Coach Trend Cache (sparkline data for leaderboard)
// -------------------------------------------------------------------------------
export const coachTrendCache = pgTable("coach_trend_cache", {
  id:             varchar("id", { length: 64 }).primaryKey(),
  coachId:        varchar("coachId", { length: 64 }).notNull(),
  coachName:      varchar("coachName", { length: 256 }).notNull(),
  sparklineData:  json("sparklineData").notNull(),
  lastUpdated:    timestamp("lastUpdated").defaultNow().notNull(),
  weekCount:      integer("weekCount").notNull().default(0),
  minScore:       numeric("minScore", { precision: 5, scale: 2 }),
  maxScore:       numeric("maxScore", { precision: 5, scale: 2 }),
  latestScore:    numeric("latestScore", { precision: 5, scale: 2 }),
  trendDirection: text("trendDirection").notNull().default("stable"),
});
export type CoachTrendCache = typeof coachTrendCache.$inferSelect;
export type InsertCoachTrendCache = typeof coachTrendCache.$inferInsert;

// -------------------------------------------------------------------------------
// Sprint 86 - Founder Self-Assessment Portal
// -------------------------------------------------------------------------------
export const founderSelfAssessments = pgTable("founder_self_assessments", {
  id:                    varchar("id", { length: 64 }).primaryKey(),
  founderId:             integer("founderId").notNull(),
  weekOf:                date("weekOf").notNull(),
  // Five PRL sub-dimension self-scores (0-100 each)
  strategicClarity:      integer("strategicClarity").notNull().default(0),
  marketValidation:      integer("marketValidation").notNull().default(0),
  teamCapability:        integer("teamCapability").notNull().default(0),
  operationalExecution:  integer("operationalExecution").notNull().default(0),
  investorPreparedness:  integer("investorPreparedness").notNull().default(0),
  // Computed composite self-score
  compositeScore:        numeric("compositeScore", { precision: 5, scale: 2 }),
  founderNotes:          text("founderNotes"),
  status:                text("status").notNull().default("pending"),
  reviewedBy:            varchar("reviewedBy", { length: 128 }),
  reviewedAt:            timestamp("reviewedAt"),
  reviewNotes:           text("reviewNotes"),
  // If approved, optionally create a PRL record from this self-assessment
  prlRecordId:           varchar("prlRecordId", { length: 64 }),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type FounderSelfAssessment = typeof founderSelfAssessments.$inferSelect;
export type InsertFounderSelfAssessment = typeof founderSelfAssessments.$inferInsert;

// -------------------------------------------------------------------------------
// Sprint 88 - Commitment Template Library
// -------------------------------------------------------------------------------
export const commitmentTemplates = pgTable("commitment_templates", {
  id:           varchar("id", { length: 64 }).primaryKey(),
  title:        varchar("title", { length: 256 }).notNull(),
  description:  text("description"),
  vrlStage:     integer("vrlStage").notNull().default(1),   // 1-9
  category:     varchar("category", { length: 128 }),   // e.g. "market_validation", "team", "product"
  priority:     text("priority").notNull().default("medium"),
  durationDays: integer("durationDays").notNull().default(7),
  tags:         json("tags"),                           // string[]
  isDefault:    boolean("isDefault").notNull().default(false),
  createdBy:    varchar("createdBy", { length: 128 }),
  usageCount:   integer("usageCount").notNull().default(0),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});
export type CommitmentTemplate = typeof commitmentTemplates.$inferSelect;
export type InsertCommitmentTemplate = typeof commitmentTemplates.$inferInsert;

// -------------------------------------------------------------------------------
// Sprint 89 - Founder Leaderboard
// -------------------------------------------------------------------------------
export const founderLeaderboardSnapshots = pgTable("founder_leaderboard_snapshots", {
  id:             varchar("id", { length: 64 }).primaryKey(),
  founderId:      varchar("founderId", { length: 128 }).notNull(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull(),
  vrlStage:       integer("vrlStage").notNull().default(1),
  weekOf:         date("weekOf").notNull(),
  prlScore:       numeric("prlScore", { precision: 5, scale: 2 }),
  rankInCohort:   integer("rankInCohort"),
  cohortSize:     integer("cohortSize"),
  percentile:     numeric("percentile", { precision: 5, scale: 2 }),
  deltaFromPrev:  numeric("deltaFromPrev", { precision: 5, scale: 2 }),
  isOptedIn:      boolean("isOptedIn").notNull().default(false),
  displayAlias:   varchar("displayAlias", { length: 64 }),   // anonymised name
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().notNull(),
});
export type FounderLeaderboardSnapshot = typeof founderLeaderboardSnapshots.$inferSelect;
export type InsertFounderLeaderboardSnapshot = typeof founderLeaderboardSnapshots.$inferInsert;

// -------------------------------------------------------------------------------
// Sprint 90 - Coach Session Scheduler
// -------------------------------------------------------------------------------
export const coachingSessionRequests = pgTable("coaching_session_requests", {
  id:               varchar("id", { length: 64 }).primaryKey(),
  founderId:        varchar("founderId", { length: 128 }).notNull(),
  coachId:          varchar("coachId", { length: 64 }).notNull(),
  ventureId:        varchar("ventureId", { length: 64 }).notNull(),
  requestedAt:      timestamp("requestedAt").defaultNow().notNull(),
  preferredDate:    timestamp("preferredDate"),
  alternateDate:    timestamp("alternateDate"),
  sessionType:      text("sessionType").notNull().default("prl_review"),
  founderNotes:     text("founderNotes"),
  status:           text("status").notNull().default("pending"),
  confirmedDate:    timestamp("confirmedDate"),
  coachNotes:       text("coachNotes"),
  meetingLink:      varchar("meetingLink", { length: 512 }),
  sessionId:        varchar("sessionId", { length: 64 }),   // links to coachingSessions once completed
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type CoachingSessionRequest = typeof coachingSessionRequests.$inferSelect;
export type InsertCoachingSessionRequest = typeof coachingSessionRequests.$inferInsert;

// -------------------------------------------------------------------------------
// Sprint 91 - Template Effectiveness Analytics
// -------------------------------------------------------------------------------
export const templateEffectivenessCache = pgTable("template_effectiveness_cache", {
  id:                    varchar("id", { length: 64 }).primaryKey(),
  templateId:            varchar("templateId", { length: 64 }).notNull(),
  computedAt:            timestamp("computedAt").defaultNow().notNull(),
  totalAssigned:         integer("totalAssigned").notNull().default(0),
  totalCompleted:        integer("totalCompleted").notNull().default(0),
  completionRate:        numeric("completionRate", { precision: 5, scale: 2 }),
  avgPrlUplift:          numeric("avgPrlUplift", { precision: 5, scale: 2 }),  // avg PRL delta in the week after completion
  avgDaysToComplete:     numeric("avgDaysToComplete", { precision: 5, scale: 2 }),
  effectivenessScore:    numeric("effectivenessScore", { precision: 5, scale: 2 }),  // composite: 60% completion + 40% PRL uplift
  rank:                  integer("rank"),   // global rank among all templates
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type TemplateEffectivenessCache = typeof templateEffectivenessCache.$inferSelect;
export type InsertTemplateEffectivenessCache = typeof templateEffectivenessCache.$inferInsert;

// -------------------------------------------------------------------------------
// Sprint 92 - Founder Notification Centre
// -------------------------------------------------------------------------------
export const founderNotifications = pgTable("founder_notifications", {
  id:           varchar("id", { length: 64 }).primaryKey(),
  ventureId:    varchar("ventureId", { length: 64 }).notNull(),
  founderId:    varchar("founderId", { length: 64 }).notNull(),
  type:         text("type").notNull().default("general"),
  title:        varchar("title", { length: 255 }).notNull(),
  body:         text("body").notNull(),
  isRead:       boolean("isRead").notNull().default(false),
  readAt:       timestamp("readAt"),
  sourceId:     varchar("sourceId", { length: 64 }),
  sourceType:   varchar("sourceType", { length: 64 }),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});
export type FounderNotification = typeof founderNotifications.$inferSelect;
export type InsertFounderNotification = typeof founderNotifications.$inferInsert;

// -------------------------------------------------------------------------------
// Sprint 94 - PRL Goal Setting
// -------------------------------------------------------------------------------
export const frlGoals = pgTable("frl_goals", {
  id:               varchar("id", { length: 64 }).primaryKey(),
  ventureId:        varchar("ventureId", { length: 64 }).notNull(),
  founderId:        varchar("founderId", { length: 64 }).notNull(),
  coachId:          varchar("coachId", { length: 64 }).notNull(),
  targetScore:      integer("targetScore").notNull(),
  targetDate:       date("targetDate").notNull(),
  startScore:       integer("startScore").notNull(),
  currentScore:     integer("currentScore").notNull(),
  status:           text("status").notNull().default("active"),
  notes:            text("notes"),
  achievedAt:       timestamp("achievedAt"),
  progressPercent:  numeric("progressPercent", { precision: 5, scale: 2 }),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type FrlGoal = typeof frlGoals.$inferSelect;
export type InsertFrlGoal = typeof frlGoals.$inferInsert;

// -- Sprint 95 - Flower Metrics Export Log -------------------------------------
export const flowerExportLog = pgTable("flower_export_log", {
  id: serial("id").primaryKey(),
  ventureId: varchar("ventureId", { length: 64 }).notNull(),
  ventureName: varchar("ventureName", { length: 255 }).notNull(),
  exportedBy: varchar("exportedBy", { length: 255 }).notNull(),
  rowCount: integer("rowCount").notNull().default(0),         // number of KPI rows in the CSV
  snapshotMonth: varchar("snapshotMonth", { length: 7 }), // "2026-03" - latest month exported
  includesFinancials: boolean("includesFinancials").default(true),
  includesReadiness: boolean("includesReadiness").default(true),
  includesGrowthMetrics: boolean("includesGrowthMetrics").default(true),
  status: text("status").default("Success"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FlowerExportLog = typeof flowerExportLog.$inferSelect;
export type InsertFlowerExportLog = typeof flowerExportLog.$inferInsert;

// -- product_readiness_levels - PRL Composite (TRL - MRL) per venture ---------
// PRL = (trlWeight - TRL_norm) + (mrlWeight - MRL_norm)
// Replaces TRL as the technology/product dimension in the VRL formula.
// Default weights: TRL 50%, MRL 50% (equal parallel tracks).
// Stage-specific weights can override via trlWeight / mrlWeight fields.
export const productReadinessLevels = pgTable("product_readiness_levels", {
  id:              varchar("id", { length: 36 }).primaryKey(),
  ventureId:       varchar("ventureId", { length: 64 }).notNull(),
  // Source inputs
  trlLevel:        integer("trlLevel").notNull(),            // 1-9 from ventures.trl
  mrlLevel:        integer("mrlLevel").notNull(),            // 1-9 from mrlAssessments.mrlLevel
  mrlComposite:    integer("mrlComposite"),                  // 0-100 from mrlAssessments.compositeScore
  // Weights (sum must equal 1.0)
  trlWeight:       doublePrecision("trlWeight").default(0.5).notNull(),
  mrlWeight:       doublePrecision("mrlWeight").default(0.5).notNull(),
  // PRL output
  prlScore:        doublePrecision("prlScore").notNull(),          // 0-9 composite score
  prlLevel:        integer("prlLevel").notNull(),            // 1-9 discrete level (round(prlScore))
  prlLabel:        varchar("prlLabel", { length: 64 }),  // e.g. "Product-Market Fit"
  // VRL contribution
  vrlContribution: doublePrecision("vrlContribution"),             // PRL - alpha_weight contribution to VRL
  // Metadata
  computedAt:      timestamp("computedAt").defaultNow().notNull(),
  computedBy:      varchar("computedBy", { length: 128 }),
  notes:           text("notes"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().notNull(),
});
export type ProductReadinessLevel = typeof productReadinessLevels.$inferSelect;
export type InsertProductReadinessLevel = typeof productReadinessLevels.$inferInsert;

// -- Playbook Library (Admin Module) --
// Full-featured playbook management system for EcoBlend OS Admin module.
// Playbooks are guidance documents linked to modules, workflow stages, roles,
// templates, scoring frameworks, risk categories, and evidence requirements.
export const playbookLibrary = pgTable("playbook_library", {
  id:                    serial("id").primaryKey(),
  playbookId:            varchar("playbookId", { length: 64 }).notNull().unique(),
  title:                 varchar("title", { length: 255 }).notNull(),
  category:              varchar("category", { length: 128 }).notNull(),
  relatedModule:         varchar("relatedModule", { length: 128 }),
  relatedWorkflowStage:  varchar("relatedWorkflowStage", { length: 128 }),
  userRole:              varchar("userRole", { length: 255 }),
  purpose:               text("purpose"),
  whenToUse:             text("whenToUse"),
  stepByStepGuidance:    text("stepByStepGuidance"),
  requiredInputs:        text("requiredInputs"),
  requiredOutputs:       text("requiredOutputs"),
  linkedTemplates:       text("linkedTemplates"),
  linkedScoringFrameworks: text("linkedScoringFrameworks"),
  linkedRiskCategories:  text("linkedRiskCategories"),
  evidenceRequired:      text("evidenceRequired"),
  completionChecklist:   text("completionChecklist"),
  approvalRequired:      boolean("approvalRequired").default(false),
  accessLevel:           text("playbookAccessLevel").notNull().default("Internal Team"),
  version:               varchar("version", { length: 16 }).notNull().default("1.0"),
  status:                text("playbookStatus").notNull().default("Draft"),
  owner:                 varchar("owner", { length: 128 }),
  reviewDate:            varchar("reviewDate", { length: 32 }),
  createdBy:             varchar("createdBy", { length: 128 }),
  updatedBy:             varchar("updatedBy", { length: 128 }),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type PlaybookLibraryRecord = typeof playbookLibrary.$inferSelect;
export type InsertPlaybookLibraryRecord = typeof playbookLibrary.$inferInsert;

// -- Playbook Version History --
export const playbookVersions = pgTable("playbook_versions", {
  id:          serial("id").primaryKey(),
  playbookDbId: integer("playbookDbId").notNull(),
  version:     varchar("version", { length: 16 }).notNull(),
  snapshot:    text("snapshot").notNull(),
  changedBy:   varchar("changedBy", { length: 128 }),
  changeNote:  text("changeNote"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type PlaybookVersion = typeof playbookVersions.$inferSelect;
export type InsertPlaybookVersion = typeof playbookVersions.$inferInsert;

// -- Admin Templates (downloadable resources) ----------------------------------------
export const adminTemplates = pgTable("admin_templates", {
  id:                 serial("id").primaryKey(),
  name:               varchar("name", { length: 255 }).notNull(),
  description:        text("description"),
  category:           varchar("category", { length: 128 }),
  fileType:           varchar("fileType", { length: 32 }),
  downloadUrl:        text("downloadUrl"),
  linkedModule:       varchar("linkedModule", { length: 128 }),
  linkedPlaybookId:   varchar("linkedPlaybookId", { length: 64 }),
  version:            varchar("version", { length: 16 }).default("1.0"),
  accessLevel:        text("accessLevel").default("Internal Team"),
  isActive:           boolean("isActive").default(true),
  createdAt:          timestamp("createdAt").defaultNow().notNull(),
  updatedAt:          timestamp("updatedAt").defaultNow().notNull(),
});
export type AdminTemplate = typeof adminTemplates.$inferSelect;
export type InsertAdminTemplate = typeof adminTemplates.$inferInsert;

// ============================================================
// PHASE 3C — Contextual Playbook Widget System: Production Hardening
// Tables: playbook_context_rules, playbook_widget_configs,
//         playbook_usage_events, playbook_completions,
//         widget_global_settings, widget_module_settings,
//         widget_threshold_settings, widget_role_settings
// ============================================================

// -- Playbook Context Rules ---------------------------------------------------
export const playbookContextRules = pgTable("playbook_context_rules", {
  id:                       serial("id").primaryKey(),
  ruleName:                 varchar("ruleName", { length: 128 }).notNull(),
  description:              text("description"),
  playbookId:               varchar("playbookId", { length: 64 }).notNull(),
  module:                   varchar("module", { length: 128 }),
  page:                     varchar("page", { length: 128 }),
  workflowStage:            varchar("workflowStage", { length: 64 }),
  rdStage:                  varchar("rdStage", { length: 64 }),
  scoringFramework:         varchar("scoringFramework", { length: 64 }),
  missingEvidenceTrigger:   boolean("missingEvidenceTrigger").default(false),
  highRiskTrigger:          boolean("highRiskTrigger").default(false),
  lowScoreTrigger:          boolean("lowScoreTrigger").default(false),
  stageGateTrigger:         boolean("stageGateTrigger").default(false),
  investorWarningTrigger:   boolean("investorWarningTrigger").default(false),
  allowedRoles:             text("allowedRoles"),          // JSON array of role strings
  priority:                 integer("priority").default(50),
  adminPriority:            integer("adminPriority").default(50),
  suppressIfCompleted:      boolean("suppressIfCompleted").default(true),
  allowRepeatRecommendation:boolean("allowRepeatRecommendation").default(false),
  minimumRecommendationScore: integer("minimumRecommendationScore").default(0),
  isActive:                 boolean("isActive").default(true),
  updatedBy:                varchar("updatedBy", { length: 128 }),
  createdAt:                timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                timestamp("updatedAt").defaultNow().notNull(),
});
export type PlaybookContextRule = typeof playbookContextRules.$inferSelect;
export type InsertPlaybookContextRule = typeof playbookContextRules.$inferInsert;

// -- Playbook Widget Configs --------------------------------------------------
export const playbookWidgetConfigs = pgTable("playbook_widget_configs", {
  id:           serial("id").primaryKey(),
  module:       varchar("module", { length: 128 }).notNull(),
  widgetType:   varchar("widgetType", { length: 64 }).notNull(),
  isEnabled:    boolean("isEnabled").default(true),
  maxPlaybooks: integer("maxPlaybooks").default(3),
  threshold:    integer("threshold").default(40),
  position:     text("position").default("sidebar"),
  updatedBy:    varchar("updatedBy", { length: 128 }),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});
export type PlaybookWidgetConfig = typeof playbookWidgetConfigs.$inferSelect;
export type InsertPlaybookWidgetConfig = typeof playbookWidgetConfigs.$inferInsert;

// -- Playbook Usage Events ----------------------------------------------------
export const playbookUsageEvents = pgTable("playbook_usage_events", {
  id:                  varchar("id", { length: 64 }).primaryKey(),
  eventType:           varchar("eventType", { length: 64 }).notNull(),
  playbookId:          varchar("playbookId", { length: 64 }),
  widgetType:          varchar("widgetType", { length: 64 }),
  userId:              integer("userId"),
  ventureId:           varchar("ventureId", { length: 64 }),
  module:              varchar("module", { length: 128 }),
  page:                varchar("page", { length: 128 }),
  contextRuleId:       integer("contextRuleId"),
  recommendationScore: integer("recommendationScore"),
  actionType:          varchar("actionType", { length: 64 }),
  contextSnapshot:     text("contextSnapshot"),
  outcome:             varchar("outcome", { length: 128 }),
  dismissedReason:     text("dismissedReason"),
  createdAt:           integer("createdAt").notNull(),
});
export type PlaybookUsageEvent = typeof playbookUsageEvents.$inferSelect;
export type InsertPlaybookUsageEvent = typeof playbookUsageEvents.$inferInsert;

// -- Playbook Completions -----------------------------------------------------
export const playbookCompletions = pgTable("playbook_completions", {
  id:               varchar("id", { length: 64 }).primaryKey(),
  playbookId:       varchar("playbookId", { length: 64 }).notNull(),
  userId:           integer("userId").notNull(),
  ventureId:        varchar("ventureId", { length: 64 }),
  module:           varchar("module", { length: 128 }),
  workflowStage:    varchar("workflowStage", { length: 64 }),
  completionStatus: text("completionStatus").default("Not Started"),
  completedSteps:   text("completedSteps"),   // JSON array
  evidenceLinks:    text("evidenceLinks"),     // JSON array
  completedAt:      integer("completedAt"),
  reviewedBy:       varchar("reviewedBy", { length: 128 }),
  reviewStatus:     text("reviewStatus").default("Not Required"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type PlaybookCompletion = typeof playbookCompletions.$inferSelect;
export type InsertPlaybookCompletion = typeof playbookCompletions.$inferInsert;

// -- Widget Global Settings ---------------------------------------------------
export const widgetGlobalSettings = pgTable("widget_global_settings", {
  id:                          serial("id").primaryKey(),
  enableWidgetsGlobally:       boolean("enableWidgetsGlobally").default(true),
  showAsSidePanel:             boolean("showAsSidePanel").default(true),
  showInline:                  boolean("showInline").default(false),
  maxRecommendedPlaybooks:     integer("maxRecommendedPlaybooks").default(3),
  defaultRecommendationThreshold: integer("defaultRecommendationThreshold").default(40),
  enableUsageTracking:         boolean("enableUsageTracking").default(true),
  enableDismissalReasons:      boolean("enableDismissalReasons").default(true),
  enableCompletionTracking:    boolean("enableCompletionTracking").default(true),
  enableInvestorWarningGates:  boolean("enableInvestorWarningGates").default(true),
  enableStageGateWarningGates: boolean("enableStageGateWarningGates").default(true),
  updatedBy:                   varchar("updatedBy", { length: 128 }),
  updatedAt:                   timestamp("updatedAt").defaultNow().notNull(),
});
export type WidgetGlobalSettings = typeof widgetGlobalSettings.$inferSelect;

// -- Widget Threshold Settings ------------------------------------------------
export const widgetThresholdSettings = pgTable("widget_threshold_settings", {
  id:                              serial("id").primaryKey(),
  evidenceConfidenceWarning:       integer("evidenceConfidenceWarning").default(50),
  readinessScoreWarning:           integer("readinessScoreWarning").default(40),
  highRiskThreshold:               integer("highRiskThreshold").default(3),
  investorPackWarning:             integer("investorPackWarning").default(60),
  stageGateMinEvidence:            integer("stageGateMinEvidence").default(3),
  maxUnresolvedHighRisks:          integer("maxUnresolvedHighRisks").default(2),
  updatedBy:                       varchar("updatedBy", { length: 128 }),
  updatedAt:                       timestamp("updatedAt").defaultNow().notNull(),
});
export type WidgetThresholdSettings = typeof widgetThresholdSettings.$inferSelect;

// -- Widget Role Visibility Settings ------------------------------------------
export const widgetRoleSettings = pgTable("widget_role_settings", {
  id:         serial("id").primaryKey(),
  role:       varchar("role", { length: 64 }).notNull(),
  widgetType: varchar("widgetType", { length: 64 }).notNull(),
  isVisible:  boolean("isVisible").default(true),
  updatedBy:  varchar("updatedBy", { length: 128 }),
  updatedAt:  timestamp("updatedAt").defaultNow().notNull(),
});
export type WidgetRoleSetting = typeof widgetRoleSettings.$inferSelect;

// -- Contextual Guidance Events -----------------------------------------------
export const contextualGuidanceEvents = pgTable("contextual_guidance_events", {
  id:          varchar("id", { length: 64 }).primaryKey(),
  ventureId:   varchar("ventureId", { length: 64 }).notNull(),
  module:      varchar("module", { length: 128 }),
  eventType:   varchar("eventType", { length: 64 }),
  payload:     text("payload"),
  status:      text("status").default("Active"),
  resolvedAt:  integer("resolvedAt"),
  createdAt:   integer("createdAt").notNull(),
});
export type ContextualGuidanceEvent = typeof contextualGuidanceEvents.$inferSelect;


// ============================================================================
// PHASE 4: STARTUP FAILURE EARLY WARNING SYSTEM
// ============================================================================

// -- Startup Failure Risk Scores (Main aggregated score table) ---------------
export const startupFailureRiskScores = pgTable("startup_failure_risk_scores", {
  id:                       varchar("id", { length: 64 }).primaryKey(),
  ventureId:                varchar("ventureId", { length: 64 }).notNull(),
  overallFailureRiskScore:  integer("overallFailureRiskScore").default(0),    // 0-100
  cashRunwayRisk:           integer("cashRunwayRisk").default(0),             // 0-100
  customerValidationRisk:   integer("customerValidationRisk").default(0),     // 0-100
  revenueModelRisk:         integer("revenueModelRisk").default(0),           // 0-100
  executionVelocityRisk:    integer("executionVelocityRisk").default(0),      // 0-100
  teamCompetencyRisk:       integer("teamCompetencyRisk").default(0),         // 0-100
  flexibilityRisk:          integer("flexibilityRisk").default(0),            // 0-100
  fundingProgressionRisk:   integer("fundingProgressionRisk").default(0),     // 0-100
  marketTimingRisk:         integer("marketTimingRisk").default(0),           // 0-100
  strategicRoadmapRisk:     integer("strategicRoadmapRisk").default(0),       // 0-100
  riskBand:                 text("riskBand").default("Green"),
  calculatedAt:             timestamp("calculatedAt").defaultNow().notNull(),
  updatedAt:                timestamp("updatedAt").defaultNow().notNull(),
});
export type StartupFailureRiskScore = typeof startupFailureRiskScores.$inferSelect;
export type InsertStartupFailureRiskScore = typeof startupFailureRiskScores.$inferInsert;

// -- Burn Rate Metrics -------------------------------------------------------
export const burnRateMetrics = pgTable("burn_rate_metrics", {
  id:                   varchar("id", { length: 64 }).primaryKey(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  monthlyBurnRate:      numeric("monthlyBurnRate", { precision: 12, scale: 2 }),
  cashBalance:          numeric("cashBalance", { precision: 12, scale: 2 }),
  monthlyRevenue:       numeric("monthlyRevenue", { precision: 12, scale: 2 }),
  netBurn:              numeric("netBurn", { precision: 12, scale: 2 }),
  runwayMonths:         doublePrecision("runwayMonths"),
  previousRunwayMonths: doublePrecision("previousRunwayMonths"),
  runwayTrend:          text("runwayTrend").default("Stable"),
  alertStatus:          text("alertStatus").default("Green"),
  reportingPeriod:      varchar("reportingPeriod", { length: 32 }),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
});
export type BurnRateMetric = typeof burnRateMetrics.$inferSelect;
export type InsertBurnRateMetric = typeof burnRateMetrics.$inferInsert;

// -- Customer Validation Evidence --------------------------------------------
export const customerValidationEvidence = pgTable("customer_validation_evidence", {
  id:                      varchar("id", { length: 64 }).primaryKey(),
  ventureId:               varchar("ventureId", { length: 64 }).notNull(),
  customerSegment:         varchar("customerSegment", { length: 255 }),
  interviewCount:          integer("interviewCount").default(0),
  validatedProblem:        boolean("validatedProblem").default(false),
  painIntensityScore:      integer("painIntensityScore"),                    // 0-100
  willingnessToPayScore:   integer("willingnessToPayScore"),                 // 0-100
  evidenceQualityScore:    integer("evidenceQualityScore"),                  // 0-100
  problemSolutionFitScore: integer("problemSolutionFitScore"),               // 0-100
  evidenceSource:          varchar("evidenceSource", { length: 255 }),
  dateCollected:           timestamp("dateCollected"),
  createdAt:               timestamp("createdAt").defaultNow().notNull(),
});
export type CustomerValidationEvidence = typeof customerValidationEvidence.$inferSelect;
export type InsertCustomerValidationEvidence = typeof customerValidationEvidence.$inferInsert;

// -- Revenue Model Assessments -----------------------------------------------
export const revenueModelAssessments = pgTable("revenue_model_assessments", {
  id:                    varchar("id", { length: 64 }).primaryKey(),
  ventureId:             varchar("ventureId", { length: 64 }).notNull(),
  revenueModelType:      varchar("revenueModelType", { length: 128 }),   // Direct, Subscription, Licensing, Platform, etc.
  pricingValidated:      boolean("pricingValidated").default(false),
  grossMarginAssumption: integer("grossMarginAssumption"),                   // %
  unitEconomicsScore:    integer("unitEconomicsScore"),                      // 0-100
  repeatabilityScore:    integer("repeatabilityScore"),                      // 0-100
  scalabilityScore:      integer("scalabilityScore"),                        // 0-100
  revenueConfidenceScore: integer("revenueConfidenceScore"),                 // 0-100
  riskScore:             integer("riskScore"),                               // 0-100
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
});
export type RevenueModelAssessment = typeof revenueModelAssessments.$inferSelect;
export type InsertRevenueModelAssessment = typeof revenueModelAssessments.$inferInsert;

// -- Execution Velocity Metrics ----------------------------------------------
export const executionVelocityMetrics = pgTable("execution_velocity_metrics", {
  id:                      varchar("id", { length: 64 }).primaryKey(),
  ventureId:               varchar("ventureId", { length: 64 }).notNull(),
  sprintName:              varchar("sprintName", { length: 255 }),
  plannedMilestones:       integer("plannedMilestones").default(0),
  completedMilestones:     integer("completedMilestones").default(0),
  overdueMilestones:       integer("overdueMilestones").default(0),
  velocityScore:           integer("velocityScore"),                         // 0-100
  deliveryConfidenceScore: integer("deliveryConfidenceScore"),               // 0-100
  stageGateSlippageDays:   integer("stageGateSlippageDays").default(0),
  riskScore:               integer("riskScore"),                             // 0-100
  createdAt:               timestamp("createdAt").defaultNow().notNull(),
});
export type ExecutionVelocityMetric = typeof executionVelocityMetrics.$inferSelect;
export type InsertExecutionVelocityMetric = typeof executionVelocityMetrics.$inferInsert;

// -- Team Competency Assessments ---------------------------------------------
export const teamCompetencyAssessments = pgTable("team_competency_assessments", {
  id:                      varchar("id", { length: 64 }).primaryKey(),
  ventureId:               varchar("ventureId", { length: 64 }).notNull(),
  founderCapabilityScore:  integer("founderCapabilityScore"),                // 0-100
  technicalExpertiseScore: integer("technicalExpertiseScore"),               // 0-100
  commercialExpertiseScore: integer("commercialExpertiseScore"),             // 0-100
  financialExpertiseScore: integer("financialExpertiseScore"),               // 0-100
  leadershipScore:         integer("leadershipScore"),                       // 0-100
  domainExpertiseScore:    integer("domainExpertiseScore"),                  // 0-100
  missingRoles:            text("missingRoles"),                         // JSON array of missing role names
  aggregateTeamScore:      integer("aggregateTeamScore"),                    // 0-100
  competencyRiskScore:     integer("competencyRiskScore"),                   // 0-100
  createdAt:               timestamp("createdAt").defaultNow().notNull(),
});
export type TeamCompetencyAssessment = typeof teamCompetencyAssessments.$inferSelect;
export type InsertTeamCompetencyAssessment = typeof teamCompetencyAssessments.$inferInsert;

// -- Flexibility & Pivot Logs ------------------------------------------------
export const flexibilityPivotLogs = pgTable("flexibility_pivot_logs", {
  id:                      varchar("id", { length: 64 }).primaryKey(),
  ventureId:               varchar("ventureId", { length: 64 }).notNull(),
  pivotEvent:              varchar("pivotEvent", { length: 255 }),
  pivotReason:             text("pivotReason"),
  evidenceBasedBoolean:    boolean("evidenceBasedBoolean").default(false),
  recommendationsOverridden: integer("recommendationsOverridden").default(0),
  playbookDismissals:      integer("playbookDismissals").default(0),
  dismissalReason:         varchar("dismissalReason", { length: 255 }),
  adaptabilityScore:       integer("adaptabilityScore"),                     // 0-100
  flexibilityRiskScore:    integer("flexibilityRiskScore"),                  // 0-100
  loggedAt:                timestamp("loggedAt").defaultNow().notNull(),
});
export type FlexibilityPivotLog = typeof flexibilityPivotLogs.$inferSelect;
export type InsertFlexibilityPivotLog = typeof flexibilityPivotLogs.$inferInsert;

// -- Funding Progression Metrics ---------------------------------------------
export const fundingProgressionMetrics = pgTable("funding_progression_metrics", {
  id:                      varchar("id", { length: 64 }).primaryKey(),
  ventureId:               varchar("ventureId", { length: 64 }).notNull(),
  currentFundingStage:     varchar("currentFundingStage", { length: 64 }),
  capitalRequired:         numeric("capitalRequired", { precision: 12, scale: 2 }),
  capitalSecured:          numeric("capitalSecured", { precision: 12, scale: 2 }),
  fundingGap:              numeric("fundingGap", { precision: 12, scale: 2 }),
  monthsToNextRaise:       integer("monthsToNextRaise"),
  investorReadinessScore:  integer("investorReadinessScore"),                // 0-100
  pitchDeckReadyBoolean:   boolean("pitchDeckReadyBoolean").default(false),
  businessPlanReadyBoolean: boolean("businessPlanReadyBoolean").default(false),
  dataRoomReadyBoolean:    boolean("dataRoomReadyBoolean").default(false),
  fundingRiskScore:        integer("fundingRiskScore"),                      // 0-100
  createdAt:               timestamp("createdAt").defaultNow().notNull(),
});
export type FundingProgressionMetric = typeof fundingProgressionMetrics.$inferSelect;
export type InsertFundingProgressionMetric = typeof fundingProgressionMetrics.$inferInsert;

// -- Market Timing Signals ---------------------------------------------------
export const marketTimingSignals = pgTable("market_timing_signals", {
  id:                      varchar("id", { length: 64 }).primaryKey(),
  ventureId:               varchar("ventureId", { length: 64 }).notNull(),
  marketGrowthScore:       integer("marketGrowthScore"),                     // 0-100
  competitorActivityScore: integer("competitorActivityScore"),               // 0-100
  regulatoryRiskScore:     integer("regulatoryRiskScore"),                   // 0-100
  adoptionReadinessScore:  integer("adoptionReadinessScore"),                // 0-100
  externalShockRiskScore:  integer("externalShockRiskScore"),                // 0-100
  marketSignalSource:      varchar("marketSignalSource", { length: 255 }),
  marketTimingRiskScore:   integer("marketTimingRiskScore"),                 // 0-100
  collectedAt:             timestamp("collectedAt").defaultNow().notNull(),
});
export type MarketTimingSignal = typeof marketTimingSignals.$inferSelect;
export type InsertMarketTimingSignal = typeof marketTimingSignals.$inferInsert;

// -- Strategic Roadmap Assessments -------------------------------------------
export const strategicRoadmapAssessments = pgTable("strategic_roadmap_assessments", {
  id:                         varchar("id", { length: 64 }).primaryKey(),
  ventureId:                  varchar("ventureId", { length: 64 }).notNull(),
  roadmapExistsBoolean:       boolean("roadmapExistsBoolean").default(false),
  milestoneQualityScore:      integer("milestoneQualityScore"),               // 0-100
  dependencyRiskScore:        integer("dependencyRiskScore"),                 // 0-100
  stageGateClarityScore:      integer("stageGateClarityScore"),               // 0-100
  executionPlanCompletenessScore: integer("executionPlanCompletenessScore"), // 0-100
  roadmapRiskScore:           integer("roadmapRiskScore"),                    // 0-100
  createdAt:                  timestamp("createdAt").defaultNow().notNull(),
});
export type StrategicRoadmapAssessment = typeof strategicRoadmapAssessments.$inferSelect;
export type InsertStrategicRoadmapAssessment = typeof strategicRoadmapAssessments.$inferInsert;

// -- Failure Risk Alerts (Auto-triggered alerts) ----------------------------
export const failureRiskAlerts = pgTable("failure_risk_alerts", {
  id:                varchar("id", { length: 64 }).primaryKey(),
  ventureId:         varchar("ventureId", { length: 64 }).notNull(),
  alertType:         varchar("alertType", { length: 128 }),              // BurnRate, CustomerValidation, Revenue, Execution, Team, Flexibility, Funding, Market, Roadmap
  alertSeverity:     text("alertSeverity").default("Amber"),
  alertMessage:      text("alertMessage"),
  linkedModule:      varchar("linkedModule", { length: 128 }),
  recommendedAction: text("recommendedAction"),
  status:            text("status").default("Active"),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
  resolvedAt:        timestamp("resolvedAt"),
});
export type FailureRiskAlert = typeof failureRiskAlerts.$inferSelect;
export type InsertFailureRiskAlert = typeof failureRiskAlerts.$inferInsert;

// -- Contingency Playbooks (Pre-built response playbooks) -------------------
export const contingencyPlaybooks = pgTable("contingency_playbooks", {
  id:                varchar("id", { length: 64 }).primaryKey(),
  riskType:          varchar("riskType", { length: 128 }).notNull(),
  triggerCondition:  text("triggerCondition"),
  recommendedResponse: text("recommendedResponse"),
  linkedPlaybook:    varchar("linkedPlaybook", { length: 255 }),
  responsibleRole:   varchar("responsibleRole", { length: 128 }),
  escalationPath:    text("escalationPath"),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
  updatedAt:         timestamp("updatedAt").defaultNow().notNull(),
});
export type ContingencyPlaybook = typeof contingencyPlaybooks.$inferSelect;
export type InsertContingencyPlaybook = typeof contingencyPlaybooks.$inferInsert;

// ============================================================================
// MODULE 3 — DISCOVERY & MARKET (Lean Startup Evidence Engine)
// ============================================================================

// -- Customer Segments ---------------------------------------------------------
export const customerSegments = pgTable("customer_segments", {
  id:                serial("id").primaryKey(),
  ventureId:         varchar("ventureId", { length: 64 }).notNull(),
  segmentName:       varchar("segmentName", { length: 255 }).notNull(),
  buyerRole:         varchar("buyerRole", { length: 255 }),
  userRole:          varchar("userRole", { length: 255 }),
  influencerRole:    varchar("influencerRole", { length: 255 }),
  decisionMakerRole: varchar("decisionMakerRole", { length: 255 }),
  problemArea:       text("problemArea"),
  currentAlternative: text("currentAlternative"),
  segmentNotes:      text("segmentNotes"),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
  updatedAt:         timestamp("updatedAt").defaultNow().notNull(),
});
export type CustomerSegment = typeof customerSegments.$inferSelect;
export type InsertCustomerSegment = typeof customerSegments.$inferInsert;

// -- Problem Hypotheses --------------------------------------------------------
export const problemHypotheses = pgTable("problem_hypotheses", {
  id:                  serial("id").primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  customerSegmentId:   integer("customerSegmentId"),
  hypothesisStatement: text("hypothesisStatement").notNull(),
  problemType:         varchar("problemType", { length: 128 }),
  targetCustomer:      varchar("targetCustomer", { length: 255 }),
  assumedPain:         text("assumedPain"),
  assumedFrequency:    text("assumedFrequency"),
  assumedUrgency:      text("assumedUrgency"),
  assumedBudgetOwner:  text("assumedBudgetOwner"),
  status:              text("status").default("untested").notNull(),
  confidenceScore:     integer("confidenceScore").default(0),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().notNull(),
});
export type ProblemHypothesis = typeof problemHypotheses.$inferSelect;
export type InsertProblemHypothesis = typeof problemHypotheses.$inferInsert;

// -- Customer Interviews -------------------------------------------------------
export const customerInterviews = pgTable("customer_interviews", {
  id:                        serial("id").primaryKey(),
  ventureId:                 varchar("ventureId", { length: 64 }).notNull(),
  customerSegmentId:         integer("customerSegmentId"),
  problemHypothesisId:       integer("problemHypothesisId"),
  contactName:               varchar("contactName", { length: 255 }),
  organisation:              varchar("organisation", { length: 255 }),
  roleTitle:                 varchar("roleTitle", { length: 255 }),
  interviewDate:             varchar("interviewDate", { length: 32 }),
  interviewType:             varchar("interviewType", { length: 128 }),
  status:                    text("status").default("logged"),
  problemMentionedUnprompted: boolean("problemMentionedUnprompted").default(false),
  currentWorkaround:         text("currentWorkaround"),
  painScore:                 integer("painScore").default(0),
  urgencyScore:              integer("urgencyScore").default(0),
  frequencyScore:            integer("frequencyScore").default(0),
  budgetSignalScore:         integer("budgetSignalScore").default(0),
  decisionMakerAccessScore:  integer("decisionMakerAccessScore").default(0),
  willingnessToTrial:        boolean("willingnessToTrial").default(false),
  willingnessToPaySignal:    text("willingnessToPaySignal").default("none"),
  discoveryScore:            integer("discoveryScore").default(0),
  keyQuote:                  text("keyQuote"),
  evidenceNotes:             text("evidenceNotes"),
  contradictionNotes:        text("contradictionNotes"),
  recommendedDecision:       text("recommendedDecision"),
  nextAction:                text("nextAction"),
  createdAt:                 timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                 timestamp("updatedAt").defaultNow().notNull(),
});
export type CustomerInterview = typeof customerInterviews.$inferSelect;
export type InsertCustomerInterview = typeof customerInterviews.$inferInsert;

// -- Competitors (Discovery & Market) -----------------------------------------
export const dmCompetitors = pgTable("dm_competitors", {
  id:                      serial("id").primaryKey(),
  ventureId:               varchar("ventureId", { length: 64 }).notNull(),
  problemHypothesisId:     integer("problemHypothesisId"),
  competitorName:          varchar("competitorName", { length: 255 }).notNull(),
  competitorType:          text("competitorType").default("direct"),
  customerSegment:         varchar("customerSegment", { length: 255 }),
  problemSolved:           text("problemSolved"),
  strengths:               text("strengths"),
  weaknesses:              text("weaknesses"),
  pricingModel:            varchar("pricingModel", { length: 255 }),
  customerSatisfactionScore: integer("customerSatisfactionScore").default(0),
  switchingDifficultyScore:  integer("switchingDifficultyScore").default(0),
  differentiationScore:    integer("differentiationScore").default(0),
  threatScore:             integer("threatScore").default(0),
  competitiveRiskScore:    integer("competitiveRiskScore").default(0),
  notes:                   text("notes"),
  createdAt:               timestamp("createdAt").defaultNow().notNull(),
  updatedAt:               timestamp("updatedAt").defaultNow().notNull(),
});
export type DmCompetitor = typeof dmCompetitors.$inferSelect;
export type InsertDmCompetitor = typeof dmCompetitors.$inferInsert;

// -- Demand Signals ------------------------------------------------------------
export const demandSignals = pgTable("demand_signals", {
  id:                    serial("id").primaryKey(),
  ventureId:             varchar("ventureId", { length: 64 }).notNull(),
  problemHypothesisId:   integer("problemHypothesisId"),
  signalName:            varchar("signalName", { length: 255 }).notNull(),
  signalType:            text("signalType").default("customer_pull"),
  sourceName:            varchar("sourceName", { length: 255 }),
  sourceUrl:             varchar("sourceUrl", { length: 512 }),
  signalDate:            varchar("signalDate", { length: 32 }),
  relevanceScore:        integer("relevanceScore").default(0),
  evidenceStrengthScore: integer("evidenceStrengthScore").default(0),
  recencyScore:          integer("recencyScore").default(0),
  commercialImpactScore: integer("commercialImpactScore").default(0),
  repeatabilityScore:    integer("repeatabilityScore").default(0),
  demandSignalScore:     integer("demandSignalScore").default(0),
  evidenceSummary:       text("evidenceSummary"),
  linkedExperiment:      text("linkedExperiment"),
  successThreshold:      text("successThreshold"),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type DemandSignal = typeof demandSignals.$inferSelect;
export type InsertDemandSignal = typeof demandSignals.$inferInsert;

// -- WTP Tests -----------------------------------------------------------------
export const wtpTests = pgTable("wtp_tests", {
  id:                    serial("id").primaryKey(),
  ventureId:             varchar("ventureId", { length: 64 }).notNull(),
  problemHypothesisId:   integer("problemHypothesisId"),
  customerSegmentId:     integer("customerSegmentId"),
  customerName:          varchar("customerName", { length: 255 }),
  organisation:          varchar("organisation", { length: 255 }),
  contactRole:           varchar("contactRole", { length: 255 }),
  buyerRole:             varchar("buyerRole", { length: 255 }),
  economicBuyer:         boolean("economicBuyer").default(false),
  budgetOwnerConfirmed:  boolean("budgetOwnerConfirmed").default(false),
  budgetOwnerStatus:     text("budgetOwnerStatus").default("unknown"),   // unknown|partial|confirmed
  budgetOwnerName:       varchar("budgetOwnerName", { length: 255 }),
  budgetOwnerRole:       varchar("budgetOwnerRole", { length: 255 }),
  currentSpend:          varchar("currentSpend", { length: 255 }),
  currentSpendCurrency:  varchar("currentSpendCurrency", { length: 8 }).default("GBP"),
  currentSpendPeriod:    varchar("currentSpendPeriod", { length: 32 }),
  valueDriver:           text("valueDriver"),
  pricingModelTested:    varchar("pricingModelTested", { length: 255 }),
  priceTested:           varchar("priceTested", { length: 255 }),
  priceCurrency:         varchar("priceCurrency", { length: 8 }).default("GBP"),
  pricePeriod:           varchar("pricePeriod", { length: 32 }),
  testMethod:            text("testMethod").default("pricing_interview"),
  responseSummary:       text("responseSummary"),
  evidenceLevel:         integer("evidenceLevel").default(1),
  evidenceStrengthScore: integer("evidenceStrengthScore").default(0),
  pricingResponse:       text("pricingResponse").default("none"),         // accepted|negotiating|needs_roi_proof|price_resistance|rejected|none
  procurementPathway:    text("procurementPathway"),
  procurementPathwayStatus: text("procurementPathwayStatus").default("unknown"), // unknown|mapped|blocked|feasible|high_friction|validated
  procurementPathwayNotes: text("procurementPathwayNotes"),
  decisionProcessNotes:  text("decisionProcessNotes"),
  objections:            text("objections"),
  objectionCategory:     text("objectionCategory"),
  wtpScore:              integer("wtpScore").default(0),
  recommendedPricingModel: varchar("recommendedPricingModel", { length: 255 }),
  nextCommercialAction:  text("nextCommercialAction"),
  nextActionDueDate:     varchar("nextActionDueDate", { length: 32 }),
  status:                text("status").default("planned"),               // planned|in_progress|completed|blocked|invalidated|converted_to_pilot|converted_to_loi|converted_to_paid_customer
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type WtpTest = typeof wtpTests.$inferSelect;
export type InsertWtpTest = typeof wtpTests.$inferInsert;

// -- Market Risks --------------------------------------------------------------
export const marketRisks = pgTable("market_risks", {
  id:                    serial("id").primaryKey(),
  ventureId:             varchar("ventureId", { length: 64 }).notNull(),
  linkedModule:          varchar("linkedModule", { length: 128 }),
  linkedRecordId:        integer("linkedRecordId"),
  riskTitle:             varchar("riskTitle", { length: 255 }).notNull(),
  riskCategory:          text("riskCategory").default("problem_risk"),
  riskDescription:       text("riskDescription"),
  probabilityScore:      integer("probabilityScore").default(1),
  severityScore:         integer("severityScore").default(1),
  evidenceConfidenceScore: integer("evidenceConfidenceScore").default(1),
  marketRiskScore:       integer("marketRiskScore").default(1),
  evidenceSummary:       text("evidenceSummary"),
  mitigationPlan:        text("mitigationPlan"),
  requiredExperiment:    text("requiredExperiment"),
  owner:                 varchar("owner", { length: 255 }),
  reviewDate:            varchar("reviewDate", { length: 32 }),
  status:                text("status").default("open").notNull(),
  autoGenerated:         boolean("autoGenerated").default(false),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type MarketRisk = typeof marketRisks.$inferSelect;
export type InsertMarketRisk = typeof marketRisks.$inferInsert;

// -- Lean Experiments ----------------------------------------------------------
export const leanExperiments = pgTable("lean_experiments", {
  id:                  serial("id").primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  problemHypothesisId: integer("problemHypothesisId"),
  experimentName:      varchar("experimentName", { length: 255 }).notNull(),
  experimentType:      text("experimentType").default("interview"),
  hypothesisTested:    text("hypothesisTested"),
  method:              text("method"),
  successThreshold:    text("successThreshold"),
  result:             text("result"),
  learningSummary:     text("learningSummary"),
  decision:            text("decision"),
  nextStep:            text("nextStep"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().notNull(),
});
export type LeanExperiment = typeof leanExperiments.$inferSelect;
export type InsertLeanExperiment = typeof leanExperiments.$inferInsert;

// -- Lean Canvas (append-only versioning) --------------------------------------
// Each save inserts a new row with version = max(version)+1 for that venture.
// The current active version is tracked in ventures.canvasVersion.
export const leanCanvases = pgTable("lean_canvases", {
  id:               serial("id").primaryKey(),
  ventureId:        varchar("ventureId", { length: 64 }).notNull(),
  version:          integer("version").notNull().default(1),
  // Nine Lean Canvas blocks
  problem:          text("problem"),
  solution:         text("solution"),
  uniqueValueProp:  text("uniqueValueProp"),
  customerSegments: text("customerSegments"),
  channels:         text("channels"),
  revenueStreams:   text("revenueStreams"),
  costStructure:    text("costStructure"),
  keyMetrics:       text("keyMetrics"),
  unfairAdvantage:  text("unfairAdvantage"),
  // Two additional blocks (11-block spec)
  existingAlternatives: text("existingAlternatives"),
  highLevelConcept:     text("highLevelConcept"),
  // R&D linkage
  mvpFormat:        text("mvpFormat"),          // concierge|wizard_of_oz|smoke_test|landing_page|prototype
  hypothesisTested: text("hypothesisTested"),
  successCriteria:  text("successCriteria"),
  notes:            text("notes"),
  status:           text("status").default("draft"),   // draft|active|archived
  // Canvas-level metadata
  canvasTitle:        varchar("canvasTitle", { length: 255 }),
  overallStatus:      text("overallStatus").default("draft"),  // draft|assumption_led|testing|partially_validated|validated|pivot_required|archived
  versionLabel:       varchar("versionLabel", { length: 255 }),
  changeSummary:      text("changeSummary"),
  reasonForChange:    text("reasonForChange"),   // new_canvas|discovery_learning|wtp_learning|competitor_learning|demand_signal_learning|pricing_learning|unit_economics_learning|mvp_learning|gtm_learning|pivot|stage_gate_review
  evidenceTrigger:    text("evidenceTrigger"),
  createdBy:        varchar("createdBy", { length: 255 }),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});
export type LeanCanvas = typeof leanCanvases.$inferSelect;
export type InsertLeanCanvas = typeof leanCanvases.$inferInsert;

// -- Lean Canvas Blocks (per-block metadata overlay, keyed by canvasId + blockType) ---
export const leanCanvasBlocks = pgTable("lean_canvas_blocks", {
  id:                   serial("id").primaryKey(),
  canvasId:             integer("canvasId").notNull(),   // FK → lean_canvases.id
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  blockType:            text("blockType").notNull(),     // customer_segments|problem|existing_alternatives|unique_value_proposition|solution|channels|revenue_streams|cost_structure|key_metrics|unfair_advantage|high_level_concept
  blockStatus:          text("blockStatus").default("assumption"), // assumption|testing|validated|invalidated|pivoted|incomplete
  evidenceStatus:       text("evidenceStatus").default("no_evidence"), // no_evidence|weak_evidence|moderate_evidence|strong_evidence|contradicted
  confidenceScore:      integer("confidenceScore").default(0),  // 0–100
  linkedHypothesisId:   varchar("linkedHypothesisId", { length: 128 }), // free ref to any hypothesis record
  contradictionSummary: text("contradictionSummary"),
  blockNotes:           text("blockNotes"),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().notNull(),
});
export type LeanCanvasBlock = typeof leanCanvasBlocks.$inferSelect;
export type InsertLeanCanvasBlock = typeof leanCanvasBlocks.$inferInsert;

// -- Lean Canvas Block Evidence Links (polymorphic evidence refs per block) -------
export const leanCanvasBlockEvidenceLinks = pgTable("lean_canvas_block_evidence_links", {
  id:                    serial("id").primaryKey(),
  canvasBlockId:         integer("canvasBlockId").notNull(), // FK → lean_canvas_blocks.id
  ventureId:             varchar("ventureId", { length: 64 }).notNull(),
  evidenceSourceType:    text("evidenceSourceType").notNull(), // customer_interview|wtp_test|demand_signal|competitor|pricing_experiment|lean_experiment|evidence_claim|other
  evidenceSourceId:      integer("evidenceSourceId"),         // id in the referenced table (nullable for 'other')
  evidenceSourceLabel:   varchar("evidenceSourceLabel", { length: 255 }), // human-readable label
  evidenceRelationship:  text("evidenceRelationship").default("supports"), // supports|contradicts|partially_supports|inconclusive
  evidenceStrengthScore: integer("evidenceStrengthScore").default(50), // 0–100
  notes:                 text("notes"),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type LeanCanvasBlockEvidenceLink = typeof leanCanvasBlockEvidenceLinks.$inferSelect;
export type InsertLeanCanvasBlockEvidenceLink = typeof leanCanvasBlockEvidenceLinks.$inferInsert;

// -- Product Milestones (R&D prototype & MVP build tracking) -------------------
export const productMilestones = pgTable("product_milestones", {
  id:                   serial("id").primaryKey(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull(),
  milestoneTitle:       varchar("milestoneTitle", { length: 255 }).notNull(),
  milestoneType:        text("milestoneType").default("prototype"),  // concierge_mvp|wizard_of_oz|smoke_test|prototype|pilot|production|other
  mvpFormat:            text("mvpFormat"),          // concierge|wizard_of_oz|smoke_test|landing_page|prototype
  stage:                text("stage"),              // lean stage slug or free text
  description:          text("description"),
  hypothesisTested:     text("hypothesisTested"),
  successCriteria:      text("successCriteria"),
  // User testing evidence
  userTestCount:        integer("userTestCount").default(0),
  userResponseCaptured: boolean("userResponseCaptured").default(false),
  participants:         integer("participants").default(0),
  validated:            integer("validated").default(0),
  invalidated:          integer("invalidated").default(0),
  validationRate:       doublePrecision("validationRate"),
  outcome:              text("outcome"),            // validated|invalidated|inconclusive
  keyLearning:          text("keyLearning"),
  // Scheduling
  targetDate:           varchar("targetDate", { length: 32 }),
  completedDate:        varchar("completedDate", { length: 32 }),
  status:               text("status").default("planned").notNull(), // planned|in_progress|completed|blocked
  evidenceUrl:          text("evidenceUrl"),
  assignedTo:           varchar("assignedTo", { length: 255 }),
  // MVP linkage fields (added for test-case Step 2 compliance)
  failureCriteria:         text("failureCriteria"),
  leanCanvasVersionAtMvp:  integer("leanCanvasVersionAtMvp"),
  linkedMvpDefinitionId:   integer("linkedMvpDefinitionId"),   // self-referential FK enforced at DB level
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().notNull(),
});
export type ProductMilestone = typeof productMilestones.$inferSelect;
export type InsertProductMilestone = typeof productMilestones.$inferInsert;

// -- Venture Archive — written when a kill decision is recorded or a venture is manually archived
export const ventureArchive = pgTable("venture_archive", {
  id:            serial("id").primaryKey(),
  ventureId:     varchar("ventureId", { length: 64 }).notNull(),
  decisionId:    integer("decisionId"),          // FK to cc_decisions.id
  archiveReason: text("archiveReason"),
  finalStage:    text("finalStage"),
  archivedBy:    varchar("archivedBy", { length: 255 }),
  notes:         text("notes"),
  status:        text("status").default("archived").notNull(), // archived|restored
  restoredBy:    varchar("restoredBy", { length: 255 }),
  restoredAt:    timestamp("restoredAt"),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
});
export type VentureArchive = typeof ventureArchive.$inferSelect;
export type InsertVentureArchive = typeof ventureArchive.$inferInsert;

// -- Pivot Log — append-only record of every hypothesis pivot across all canvas fields ---
export const pivotLog = pgTable("pivot_log", {
  id:                  serial("id").primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull(),
  pivotType:           text("pivotType").notNull(), // customer_segment|problem|solution|revenue|channels|…
  previousHypothesis:  text("previousHypothesis"),
  newHypothesis:       text("newHypothesis"),
  triggerEvent:        text("triggerEvent"),
  loggedBy:            varchar("loggedBy", { length: 255 }),
  canvasVersion:       integer("canvasVersion"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
});
export type PivotLog = typeof pivotLog.$inferSelect;
export type InsertPivotLog = typeof pivotLog.$inferInsert;

// -- Command Centre (Lean OS) tables -------------------------------------------
export * from "./schema_cc";

// -- WTP Assessment (commercial validation) tables -----------------------------
export * from "./schema_wtp";

// ── Purpose-Locked Governance Workflow tables ──────────────────────────────────

export const purposeCharters = pgTable("purpose_charters", {
  id:                          serial("id").primaryKey(),
  ventureId:                   text("ventureId").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  protectedPurposeStatement:   text("protectedPurposeStatement").notNull(),
  founderIntentStatement:      text("founderIntentStatement"),
  beneficialPurpose:           text("beneficialPurpose"),
  stakeholderCommitments:      text("stakeholderCommitments"),   // JSON array
  nonNegotiablePrinciples:     text("nonNegotiablePrinciples"),  // JSON array
  versionNumber:               integer("versionNumber").notNull().default(1),
  approvalStatus:              text("approvalStatus").notNull().default("draft"),
  approvedBy:                  text("approvedBy"),
  approvedAt:                  timestamp("approvedAt", { withTimezone: true }),
  reviewDueDate:               date("reviewDueDate"),
  createdBy:                   text("createdBy"),
  createdAt:                   timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:                   timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});
export type PurposeCharter = typeof purposeCharters.$inferSelect;
export type InsertPurposeCharter = typeof purposeCharters.$inferInsert;

export const missionLocks = pgTable("mission_locks", {
  id:                   serial("id").primaryKey(),
  ventureId:            text("ventureId").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  lockType:             text("lockType").notNull(),
  lockDescription:      text("lockDescription").notNull(),
  legalStatus:          text("legalStatus"),
  implementationStatus: text("implementationStatus").notNull().default("not_started"),
  responsibleOwner:     text("responsibleOwner"),
  evidenceDocumentUrl:  text("evidenceDocumentUrl"),
  reviewDate:           date("reviewDate"),
  createdAt:            timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:            timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});
export type MissionLock = typeof missionLocks.$inferSelect;
export type InsertMissionLock = typeof missionLocks.$inferInsert;

export const governanceStructures = pgTable("governance_structures", {
  id:                   serial("id").primaryKey(),
  ventureId:            text("ventureId").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  structureType:        text("structureType").notNull(),
  rationale:            text("rationale"),
  risks:                text("risks"),
  controls:             text("controls"),
  implementationStatus: text("implementationStatus").notNull().default("not_started"),
  createdAt:            timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:            timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});
export type GovernanceStructure = typeof governanceStructures.$inferSelect;

export const governanceDirectors = pgTable("governance_directors", {
  id:                        serial("id").primaryKey(),
  ventureId:                 text("ventureId").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  userId:                    integer("userId").references(() => users.id),
  fullName:                  text("fullName").notNull(),
  role:                      text("role").notNull().default("non_executive_director"),
  appointmentDate:           date("appointmentDate"),
  missionAlignmentScore:     integer("missionAlignmentScore"),
  conflictOfInterestStatus:  text("conflictOfInterestStatus").notNull().default("none"),
  votingRights:              boolean("votingRights").notNull().default(true),
  removalProtection:         boolean("removalProtection").notNull().default(false),
  pledgeSigned:              boolean("pledgeSigned").notNull().default(false),
  notes:                     text("notes"),
  createdAt:                 timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:                 timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});
export type GovernanceDirector = typeof governanceDirectors.$inferSelect;
export type InsertGovernanceDirector = typeof governanceDirectors.$inferInsert;

export const boardPledges = pgTable("board_pledges", {
  id:                 serial("id").primaryKey(),
  ventureId:          text("ventureId").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  directorId:         integer("directorId").references(() => governanceDirectors.id),
  pledgeText:         text("pledgeText").notNull(),
  signedStatus:       text("signedStatus").notNull().default("pending"),
  signedAt:           timestamp("signedAt", { withTimezone: true }),
  expiryOrReviewDate: date("expiryOrReviewDate"),
  breachStatus:       text("breachStatus").notNull().default("none"),
  createdAt:          timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});
export type BoardPledge = typeof boardPledges.$inferSelect;
export type InsertBoardPledge = typeof boardPledges.$inferInsert;

export const reservedMatters = pgTable("reserved_matters", {
  id:                  serial("id").primaryKey(),
  ventureId:           text("ventureId").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  matterCategory:      text("matterCategory").notNull(),
  matterTitle:         text("matterTitle").notNull(),
  matterDescription:   text("matterDescription"),
  approvalThreshold:   text("approvalThreshold"),
  requiredApprovers:   text("requiredApprovers"),  // JSON array
  escalationPath:      text("escalationPath"),
  status:              text("status").notNull().default("active"),
  createdAt:           timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});
export type ReservedMatter = typeof reservedMatters.$inferSelect;
export type InsertReservedMatter = typeof reservedMatters.$inferInsert;

export const investorAlignment = pgTable("investor_alignment", {
  id:                        serial("id").primaryKey(),
  ventureId:                 text("ventureId").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  invContactId:              integer("invContactId"),
  investorName:              text("investorName").notNull(),
  investorType:              text("investorType"),
  capitalAmount:             numeric("capitalAmount", { precision: 15, scale: 2 }),
  timeHorizon:               text("timeHorizon"),
  exitExpectation:           text("exitExpectation"),
  controlRightsRequested:    text("controlRightsRequested"),  // JSON array
  liquidationPreference:     text("liquidationPreference"),
  boardSeatRequested:        boolean("boardSeatRequested").notNull().default(false),
  missionAlignmentScore:     integer("missionAlignmentScore"),
  controlRiskRating:         text("controlRiskRating"),
  capitalPressureIndicator:  text("capitalPressureIndicator"),
  missionDriftRisk:          text("missionDriftRisk"),
  recommendedDecision:       text("recommendedDecision"),
  requiredActions:           text("requiredActions"),  // JSON array
  approvalStatus:            text("approvalStatus").notNull().default("under_review"),
  rejectionReason:           text("rejectionReason"),
  createdAt:                 timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:                 timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});
export type InvestorAlignment = typeof investorAlignment.$inferSelect;
export type InsertInvestorAlignment = typeof investorAlignment.$inferInsert;

export const capitalDecisionLog = pgTable("capital_decision_log", {
  id:                           serial("id").primaryKey(),
  ventureId:                    text("ventureId").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  investorAlignmentId:          integer("investorAlignmentId").references(() => investorAlignment.id),
  decisionType:                 text("decisionType").notNull(),
  decisionSummary:              text("decisionSummary").notNull(),
  purposeAlignmentAssessment:   text("purposeAlignmentAssessment"),
  financialImpact:              text("financialImpact"),
  governanceImpact:             text("governanceImpact"),
  approvedBy:                   text("approvedBy"),
  decisionDate:                 date("decisionDate").notNull(),
  conditionsAttached:           text("conditionsAttached"),
  decisionStatus:               text("decisionStatus").notNull().default("pending"),
  createdAt:                    timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:                    timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});
export type CapitalDecisionLog = typeof capitalDecisionLog.$inferSelect;
export type InsertCapitalDecisionLog = typeof capitalDecisionLog.$inferInsert;

export const governanceReviewCycles = pgTable("governance_review_cycles", {
  id:                          serial("id").primaryKey(),
  ventureId:                   text("ventureId").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  reviewType:                  text("reviewType").notNull(),
  reviewPeriod:                text("reviewPeriod").notNull(),
  reviewer:                    text("reviewer"),
  findings:                    text("findings"),
  redFlags:                    text("redFlags"),
  correctiveActionsRequired:   text("correctiveActionsRequired"),
  reviewStatus:                text("reviewStatus").notNull().default("scheduled"),
  nextReviewDate:              date("nextReviewDate"),
  completedAt:                 timestamp("completedAt", { withTimezone: true }),
  createdAt:                   timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:                   timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});
export type GovernanceReviewCycle = typeof governanceReviewCycles.$inferSelect;
export type InsertGovernanceReviewCycle = typeof governanceReviewCycles.$inferInsert;

export const purposeMetrics = pgTable("purpose_metrics", {
  id:                  serial("id").primaryKey(),
  ventureId:           text("ventureId").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  metricName:          text("metricName").notNull(),
  metricCategory:      text("metricCategory").notNull(),
  targetValue:         numeric("targetValue"),
  currentValue:        numeric("currentValue"),
  unit:                text("unit"),
  trend:               text("trend"),
  riskThreshold:       numeric("riskThreshold"),
  dataSource:          text("dataSource"),
  reportingFrequency:  text("reportingFrequency"),
  lastUpdatedAt:       timestamp("lastUpdatedAt", { withTimezone: true }),
  createdAt:           timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});
export type PurposeMetric = typeof purposeMetrics.$inferSelect;
export type InsertPurposeMetric = typeof purposeMetrics.$inferInsert;

export const purposeDriftDetections = pgTable("purpose_drift_detections", {
  id:             serial("id").primaryKey(),
  ventureId:      text("ventureId").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  triggerSource:  text("triggerSource").notNull(),
  driftCategory:  text("driftCategory").notNull(),
  severity:       text("severity").notNull(),
  evidence:       text("evidence"),
  detectedAt:     timestamp("detectedAt", { withTimezone: true }).notNull().defaultNow(),
  assignedTo:     text("assignedTo"),
  status:         text("status").notNull().default("open"),
  resolvedAt:     timestamp("resolvedAt", { withTimezone: true }),
  createdAt:      timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});
export type PurposeDriftDetection = typeof purposeDriftDetections.$inferSelect;
export type InsertPurposeDriftDetection = typeof purposeDriftDetections.$inferInsert;

export const correctiveGovernanceActions = pgTable("corrective_governance_actions", {
  id:                     serial("id").primaryKey(),
  ventureId:              text("ventureId").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  driftId:                integer("driftId").references(() => purposeDriftDetections.id),
  actionType:             text("actionType").notNull(),
  actionDescription:      text("actionDescription").notNull(),
  owner:                  text("owner").notNull(),
  deadline:               date("deadline"),
  boardApprovalRequired:  boolean("boardApprovalRequired").notNull().default(false),
  boardApprovedAt:        timestamp("boardApprovedAt", { withTimezone: true }),
  status:                 text("status").notNull().default("open"),
  completionEvidence:     text("completionEvidence"),
  completedAt:            timestamp("completedAt", { withTimezone: true }),
  createdAt:              timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:              timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});
export type CorrectiveGovernanceAction = typeof correctiveGovernanceActions.$inferSelect;
export type InsertCorrectiveGovernanceAction = typeof correctiveGovernanceActions.$inferInsert;

export const governanceDocuments = pgTable("governance_documents", {
  id:                  serial("id").primaryKey(),
  ventureId:           text("ventureId").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  documentType:        text("documentType").notNull(),
  documentTitle:       text("documentTitle").notNull(),
  version:             integer("version").notNull().default(1),
  status:              text("status").notNull().default("draft"),
  fileUrl:             text("fileUrl"),
  approvalDate:        date("approvalDate"),
  expiryOrReviewDate:  date("expiryOrReviewDate"),
  uploadedBy:          text("uploadedBy"),
  createdAt:           timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});
export type GovernanceDocument = typeof governanceDocuments.$inferSelect;
export type InsertGovernanceDocument = typeof governanceDocuments.$inferInsert;

export const governanceMaturityScores = pgTable("governance_maturity_scores", {
  id:                      serial("id").primaryKey(),
  ventureId:               text("ventureId").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  scoreDate:               date("scoreDate").notNull(),
  charterScore:            integer("charterScore").notNull().default(0),
  missionLockScore:        integer("missionLockScore").notNull().default(0),
  articlesScore:           integer("articlesScore").notNull().default(0),
  boardPledgeScore:        integer("boardPledgeScore").notNull().default(0),
  reservedMattersScore:    integer("reservedMattersScore").notNull().default(0),
  investorPolicyScore:     integer("investorPolicyScore").notNull().default(0),
  purposeMetricsScore:     integer("purposeMetricsScore").notNull().default(0),
  reviewCycleScore:        integer("reviewCycleScore").notNull().default(0),
  correctiveActionScore:   integer("correctiveActionScore").notNull().default(0),
  totalScore:              integer("totalScore").notNull().default(0),
  maturityBand:            text("maturityBand"),
  status:                  text("status"),
  recommendation:          text("recommendation"),
  computedAt:              timestamp("computedAt", { withTimezone: true }).notNull().defaultNow(),
  createdAt:               timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
});
export type GovernanceMaturityScore = typeof governanceMaturityScores.$inferSelect;

// ── Mission Protection Framework Tables ──────────────────────────────────────

export const missionIntegrityScores = pgTable("mission_integrity_scores", {
  id:                          text("id").primaryKey(),
  ventureId:                   text("ventureId").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  overallScore:                integer("overallScore").notNull().default(0),
  financialVsMissionDrift:     integer("financialVsMissionDrift").notNull().default(0),
  stakeholderAlignmentScore:   integer("stakeholderAlignmentScore").notNull().default(0),
  governanceStrengthScore:     integer("governanceStrengthScore").notNull().default(0),
  leadershipContinuityScore:   integer("leadershipContinuityScore").notNull().default(0),
  missionDriftTrend:           text("missionDriftTrend").notNull().default("Stable"),
  lastAssessmentAt:            timestamp("lastAssessmentAt", { withTimezone: true }),
  createdAt:                   timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:                   timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});
export type MissionIntegrityScore = typeof missionIntegrityScores.$inferSelect;

export const missionDriftAlerts = pgTable("mission_drift_alerts", {
  id:                text("id").primaryKey(),
  ventureId:         text("ventureId").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  alertType:         text("alertType").notNull(),
  severity:          text("severity").notNull().default("Medium"),
  description:       text("description"),
  evidence:          text("evidence"),
  recommendedAction: text("recommendedAction"),
  status:            text("status").notNull().default("Active"),
  resolvedAt:        timestamp("resolvedAt", { withTimezone: true }),
  resolvedBy:        text("resolvedBy"),
  createdAt:         timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});
export type MissionDriftAlert = typeof missionDriftAlerts.$inferSelect;

export const successionPlans = pgTable("succession_plans", {
  id:                         text("id").primaryKey(),
  ventureId:                  text("ventureId").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  potentialSuccessors:        json("potentialSuccessors"),
  founderIntentDocumented:    boolean("founderIntentDocumented").notNull().default(false),
  founderIntentSummary:       text("founderIntentSummary"),
  institutionalMemorySystem:  boolean("institutionalMemorySystem").notNull().default(false),
  missionCodexDocument:       text("missionCodexDocument"),
  keyDecisionFrameworks:      text("keyDecisionFrameworks"),
  coreValuesDocumented:       text("coreValuesDocumented"),
  successionReadinessScore:   integer("successionReadinessScore").notNull().default(0),
  lastUpdatedAt:              timestamp("lastUpdatedAt", { withTimezone: true }),
  createdAt:                  timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:                  timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});
export type SuccessionPlan = typeof successionPlans.$inferSelect;

export const stakeholderProfiles = pgTable("stakeholder_profiles", {
  id:                   text("id").primaryKey(),
  ventureId:            text("ventureId").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  stakeholderType:      text("stakeholderType").notNull().default("Employee"),
  name:                 text("name").notNull(),
  role:                 text("role"),
  primaryIncentive:     text("primaryIncentive"),
  missionAlignment:     integer("missionAlignment"),
  financialAlignment:   integer("financialAlignment"),
  feedbackScore:        integer("feedbackScore"),
  conflictRisk:         text("conflictRisk").notNull().default("Low"),
  conflictDescription:  text("conflictDescription"),
  createdAt:            timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:            timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});
export type StakeholderProfile = typeof stakeholderProfiles.$inferSelect;

// ============================================================================
// VENTURE INTAKE — Lean hypothesis-capture layer (Module 2)
// New tables: vi_ideas, vi_assumptions, vi_riskiest, vi_decisions
// Reuses: ventures, cc_hypotheses (moduleSource='venture_intake'), lean_canvases
// ============================================================================

// -- Venture Ideas -------------------------------------------------------------
export const viIdeas = pgTable("vi_ideas", {
  id:                       serial("id").primaryKey(),
  ventureId:                varchar("ventureId", { length: 64 }).notNull().references(() => ventures.id, { onDelete: "cascade" }),
  ideaTitle:                varchar("ideaTitle", { length: 255 }).notNull(),
  ideaSummary:              text("ideaSummary"),
  originSource:             varchar("originSource", { length: 64 }),
  targetSector:             varchar("targetSector", { length: 128 }),
  targetCustomer:           text("targetCustomer"),
  problemArea:              text("problemArea"),
  proposedSolution:         text("proposedSolution"),
  whyNow:                   text("whyNow"),
  strategicRelevance:       text("strategicRelevance"),
  sustainabilityRelevance:  text("sustainabilityRelevance"),
  dataMoatPotential:        text("dataMoatPotential"),
  founderNotes:             text("founderNotes"),
  createdAt:                timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                timestamp("updatedAt").defaultNow().notNull(),
});
export type ViIdea = typeof viIdeas.$inferSelect;
export type InsertViIdea = typeof viIdeas.$inferInsert;

// -- Founder Assumptions -------------------------------------------------------
export const viAssumptions = pgTable("vi_assumptions", {
  id:                   serial("id").primaryKey(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull().references(() => ventures.id, { onDelete: "cascade" }),
  assumptionTitle:      varchar("assumptionTitle", { length: 255 }).notNull(),
  assumptionStatement:  text("assumptionStatement").notNull(),
  assumptionCategory:   varchar("assumptionCategory", { length: 64 }),
  importanceScore:      integer("importanceScore").default(3),     // 1-5
  uncertaintyScore:     integer("uncertaintyScore").default(3),    // 1-5
  evidenceExists:       boolean("evidenceExists").default(false),
  evidenceSummary:      text("evidenceSummary"),
  riskLevel:            varchar("riskLevel", { length: 16 }),      // low|medium|high|critical
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().notNull(),
});
export type ViAssumption = typeof viAssumptions.$inferSelect;
export type InsertViAssumption = typeof viAssumptions.$inferInsert;

// -- Riskiest Assumptions ------------------------------------------------------
export const viRiskiest = pgTable("vi_riskiest", {
  id:                          serial("id").primaryKey(),
  ventureId:                   varchar("ventureId", { length: 64 }).notNull().references(() => ventures.id, { onDelete: "cascade" }),
  assumptionId:                integer("assumptionId"),
  hypothesisId:                integer("hypothesisId"),
  assumptionStatement:         text("assumptionStatement").notNull(),
  reasonItIsRisky:             text("reasonItIsRisky"),
  impactIfFalse:               text("impactIfFalse"),
  evidenceRequired:            text("evidenceRequired"),
  proposedTest:                text("proposedTest"),
  testPriorityScore:           integer("testPriorityScore").default(0),  // 0-100
  recommendedFirstExperiment:  text("recommendedFirstExperiment"),
  createdAt:                   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                   timestamp("updatedAt").defaultNow().notNull(),
});
export type ViRiskiest = typeof viRiskiest.$inferSelect;
export type InsertViRiskiest = typeof viRiskiest.$inferInsert;

// -- Intake Decisions ----------------------------------------------------------
export const viDecisions = pgTable("vi_decisions", {
  id:                          serial("id").primaryKey(),
  ventureId:                   varchar("ventureId", { length: 64 }).notNull().references(() => ventures.id, { onDelete: "cascade" }),
  decisionType:                varchar("decisionType", { length: 64 }),
  decisionSummary:             text("decisionSummary"),
  readinessScore:              integer("readinessScore").default(0),       // 0-100
  assumptionRiskScore:         integer("assumptionRiskScore").default(0),  // 0-100
  strategicFitScore:           integer("strategicFitScore").default(0),    // 0-100
  evidenceGapSummary:          text("evidenceGapSummary"),
  recommendedNextModule:       varchar("recommendedNextModule", { length: 64 }),
  recommendedFirstExperiment:  text("recommendedFirstExperiment"),
  decisionStatus:              varchar("decisionStatus", { length: 32 }).default("pending_review"),
  reviewerNotes:               text("reviewerNotes"),
  createdAt:                   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                   timestamp("updatedAt").defaultNow().notNull(),
});
export type ViDecision = typeof viDecisions.$inferSelect;
export type InsertViDecision = typeof viDecisions.$inferInsert;

// ============================================================================
// PROPOSITION & MODEL — Lean evidence layer (Module 4)
// Tables: pm_value_propositions, pm_jtbd, pm_bm_hypotheses,
//         pm_revenue_tests, pm_unit_economics, pm_risks
// Reuses: ventures, pivot_log, cc_hypotheses, lean_canvases, wtp tables
// ============================================================================

// -- Value Propositions -------------------------------------------------------
export const pmValuePropositions = pgTable("pm_value_propositions", {
  id:                          serial("id").primaryKey(),
  ventureId:                   varchar("ventureId", { length: 64 }).notNull().references(() => ventures.id, { onDelete: "cascade" }),
  segmentHypothesisId:         integer("segmentHypothesisId"),
  problemHypothesisId:         integer("problemHypothesisId"),
  title:                       varchar("title", { length: 255 }).notNull(),
  statement:                   text("statement").notNull(),
  customerJob:                 text("customerJob"),
  painsRelieved:               text("painsRelieved"),
  gainsCreated:                text("gainsCreated"),
  measurableOutcome:           text("measurableOutcome"),
  differentiationClaim:        text("differentiationClaim"),
  evidenceRequired:            text("evidenceRequired"),
  productsServices:            text("productsServices"),
  currentAlternatives:         text("currentAlternatives"),
  buyingTriggers:              text("buyingTriggers"),
  adoptionBarriers:            text("adoptionBarriers"),
  status:                      varchar("status", { length: 32 }).default("draft"),
  confidenceScore:             integer("confidenceScore").default(0),
  createdAt:                   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                   timestamp("updatedAt").defaultNow().notNull(),
});
export type PmValueProposition = typeof pmValuePropositions.$inferSelect;
export type InsertPmVP = typeof pmValuePropositions.$inferInsert;

// -- Jobs-to-be-Done ----------------------------------------------------------
export const pmJtbd = pgTable("pm_jtbd", {
  id:                      serial("id").primaryKey(),
  ventureId:               varchar("ventureId", { length: 64 }).notNull().references(() => ventures.id, { onDelete: "cascade" }),
  jobTitle:                varchar("jobTitle", { length: 255 }).notNull(),
  jobStatement:            text("jobStatement").notNull(),
  functionalJob:           text("functionalJob"),
  emotionalJob:            text("emotionalJob"),
  socialJob:               text("socialJob"),
  currentSolution:         text("currentSolution"),
  desiredOutcome:          text("desiredOutcome"),
  outcomeMetric:           text("outcomeMetric"),
  importanceScore:         integer("importanceScore").default(3),   // 1-5
  satisfactionScore:       integer("satisfactionScore").default(3), // 1-5
  opportunityScore:        integer("opportunityScore").default(0),  // 0-100
  evidenceSummary:         text("evidenceSummary"),
  status:                  varchar("status", { length: 32 }).default("untested"),
  createdAt:               timestamp("createdAt").defaultNow().notNull(),
  updatedAt:               timestamp("updatedAt").defaultNow().notNull(),
});
export type PmJtbd = typeof pmJtbd.$inferSelect;
export type InsertPmJtbd = typeof pmJtbd.$inferInsert;

// -- Business Model Hypotheses ------------------------------------------------
export const pmBmHypotheses = pgTable("pm_bm_hypotheses", {
  id:                       serial("id").primaryKey(),
  ventureId:                varchar("ventureId", { length: 64 }).notNull().references(() => ventures.id, { onDelete: "cascade" }),
  valuePropositionId:       integer("valuePropositionId"),
  revenueModel:             varchar("revenueModel", { length: 64 }),
  pricingAssumption:        text("pricingAssumption"),
  deliveryModel:            text("deliveryModel"),
  salesChannel:             text("salesChannel"),
  costDrivers:              text("costDrivers"),
  keyPartners:              text("keyPartners"),
  scalabilityAssumption:    text("scalabilityAssumption"),
  unfairAdvantage:          text("unfairAdvantage"),
  dataMoatAssumption:       text("dataMoatAssumption"),
  sustainabilityAssumption: text("sustainabilityAssumption"),
  evidenceRequired:         text("evidenceRequired"),
  testMethod:               text("testMethod"),
  successMetric:            text("successMetric"),
  status:                   varchar("status", { length: 32 }).default("draft"),
  confidenceScore:          integer("confidenceScore").default(0),
  createdAt:                timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                timestamp("updatedAt").defaultNow().notNull(),
});
export type PmBmHypothesis = typeof pmBmHypotheses.$inferSelect;
export type InsertPmBm = typeof pmBmHypotheses.$inferInsert;

// -- Revenue Model Tests ------------------------------------------------------
export const pmRevenueTests = pgTable("pm_revenue_tests", {
  id:                    serial("id").primaryKey(),
  ventureId:             varchar("ventureId", { length: 64 }).notNull().references(() => ventures.id, { onDelete: "cascade" }),
  bmHypothesisId:        integer("bmHypothesisId"),
  revenueModelTested:    varchar("revenueModelTested", { length: 64 }),
  testMethod:            varchar("testMethod", { length: 64 }),
  targetSegment:         text("targetSegment"),
  pricePointTested:      text("pricePointTested"),
  valueMetric:           text("valueMetric"),
  expectedBehaviour:     text("expectedBehaviour"),
  sampleSize:            integer("sampleSize").default(0),
  positiveResponses:     integer("positiveResponses").default(0),
  negativeResponses:     integer("negativeResponses").default(0),
  conversionRate:        integer("conversionRate").default(0),   // 0-100
  revenueSignalScore:    integer("revenueSignalScore").default(0), // 0-100
  learningSummary:       text("learningSummary"),
  recommendedNextTest:   text("recommendedNextTest"),
  status:                varchar("status", { length: 32 }).default("planned"),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type PmRevenueTest = typeof pmRevenueTests.$inferSelect;
export type InsertPmRevenueTest = typeof pmRevenueTests.$inferInsert;

// -- Unit Economics Models ----------------------------------------------------
export const pmUnitEconomics = pgTable("pm_unit_economics", {
  id:                       serial("id").primaryKey(),
  ventureId:                varchar("ventureId", { length: 64 }).notNull().references(() => ventures.id, { onDelete: "cascade" }),
  bmHypothesisId:           integer("bmHypothesisId"),
  modelName:                varchar("modelName", { length: 255 }).notNull(),
  customerAcquisitionCost:  integer("customerAcquisitionCost"),  // £
  lifetimeValue:            integer("lifetimeValue"),             // £
  grossMarginPct:           integer("grossMarginPct"),            // %
  contributionMargin:       integer("contributionMargin"),        // £
  deliveryCost:             integer("deliveryCost"),              // £
  supportCost:              integer("supportCost"),               // £
  setupCost:                integer("setupCost"),                 // £
  expectedPaybackMonths:    integer("expectedPaybackMonths"),
  averageContractValue:     integer("averageContractValue"),      // £
  expectedChurnRate:        integer("expectedChurnRate"),         // %
  repeatPurchaseRate:       integer("repeatPurchaseRate"),        // %
  assumptionsSummary:       text("assumptionsSummary"),
  confidenceLevel:          varchar("confidenceLevel", { length: 32 }).default("assumption_only"),
  createdAt:                timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                timestamp("updatedAt").defaultNow().notNull(),
});
export type PmUnitEconomics = typeof pmUnitEconomics.$inferSelect;
export type InsertPmUE = typeof pmUnitEconomics.$inferInsert;

// -- Proposition Risks --------------------------------------------------------
export const pmRisks = pgTable("pm_risks", {
  id:                      serial("id").primaryKey(),
  ventureId:               varchar("ventureId", { length: 64 }).notNull().references(() => ventures.id, { onDelete: "cascade" }),
  linkedRecordType:        varchar("linkedRecordType", { length: 64 }),
  linkedRecordId:          integer("linkedRecordId"),
  riskTitle:               varchar("riskTitle", { length: 255 }).notNull(),
  riskCategory:            varchar("riskCategory", { length: 64 }),
  riskDescription:         text("riskDescription"),
  probabilityScore:        integer("probabilityScore").default(3),        // 1-5
  severityScore:           integer("severityScore").default(3),           // 1-5
  evidenceConfidenceScore: integer("evidenceConfidenceScore").default(3), // 1-5
  riskScore:               integer("riskScore").default(27),              // P*S*E (1-125)
  mitigationPlan:          text("mitigationPlan"),
  requiredExperiment:      text("requiredExperiment"),
  owner:                   varchar("owner", { length: 255 }),
  reviewDate:              varchar("reviewDate", { length: 32 }),
  status:                  varchar("status", { length: 32 }).default("open"),
  createdAt:               timestamp("createdAt").defaultNow().notNull(),
  updatedAt:               timestamp("updatedAt").defaultNow().notNull(),
});
export type PmRisk = typeof pmRisks.$inferSelect;
export type InsertPmRisk = typeof pmRisks.$inferInsert;

// ── Module 8: Sustainability Hub ─────────────────────────────────────────────
export const sustainabilityHub = pgTable("sustainability_hub", {
  id:                serial("id").primaryKey(),
  ventureId:         varchar("ventureId", { length: 64 }).notNull().unique().references(() => ventures.id, { onDelete: "cascade" }),
  overallScore:      integer("overallScore").default(0),
  primaryImpactType: varchar("primaryImpactType", { length: 128 }).default("carbon_reduction"),
  lcaStatus:         varchar("lcaStatus", { length: 32 }).default("not_started"),
  carbonStatus:      varchar("carbonStatus", { length: 32 }).default("not_started"),
  circularityStatus: varchar("circularityStatus", { length: 32 }).default("not_started"),
  esgStatus:         varchar("esgStatus", { length: 32 }).default("not_started"),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
  updatedAt:         timestamp("updatedAt").defaultNow().notNull(),
});
export type SustainabilityHub = typeof sustainabilityHub.$inferSelect;
export type InsertSustainabilityHub = typeof sustainabilityHub.$inferInsert;

// ── Module 8 Stage 2: Impact Metrics (IRL) ───────────────────────────────────
export const impactMetrics = pgTable("impact_metrics", {
  id:           serial("id").primaryKey(),
  ventureId:    varchar("ventureId", { length: 64 }).notNull().references(() => ventures.id, { onDelete: "cascade" }),
  metricName:   varchar("metricName", { length: 255 }).notNull(),
  category:     varchar("category", { length: 64 }).notNull().default("Environmental"),
  targetValue:  numeric("targetValue", { precision: 12, scale: 3 }).notNull().default("0"),
  actualValue:  numeric("actualValue", { precision: 12, scale: 3 }).notNull().default("0"),
  unit:         varchar("unit", { length: 64 }).notNull().default("units"),
  irlLevel:     integer("irlLevel").notNull().default(0),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});
export type ImpactMetric = typeof impactMetrics.$inferSelect;
export type InsertImpactMetric = typeof impactMetrics.$inferInsert;

// ── Module 8 Stage 3: LCA / Carbon ───────────────────────────────────────────
export const lcaCarbon = pgTable("lca_carbon", {
  id:                  serial("id").primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull().unique().references(() => ventures.id, { onDelete: "cascade" }),
  totalFootprint:      numeric("totalFootprint",      { precision: 12, scale: 3 }).notNull().default("0"),
  scope1Direct:        numeric("scope1Direct",        { precision: 12, scale: 3 }).notNull().default("0"),
  scope2Indirect:      numeric("scope2Indirect",      { precision: 12, scale: 3 }).notNull().default("0"),
  scope3SupplyChain:   numeric("scope3SupplyChain",   { precision: 12, scale: 3 }).notNull().default("0"),
  phaseMaterials:      numeric("phaseMaterials",      { precision: 12, scale: 3 }).notNull().default("0"),
  phaseManufacturing:  numeric("phaseManufacturing",  { precision: 12, scale: 3 }).notNull().default("0"),
  phaseDistribution:   numeric("phaseDistribution",   { precision: 12, scale: 3 }).notNull().default("0"),
  phaseUse:            numeric("phaseUse",            { precision: 12, scale: 3 }).notNull().default("0"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().notNull(),
});
export type LcaCarbon = typeof lcaCarbon.$inferSelect;
export type InsertLcaCarbon = typeof lcaCarbon.$inferInsert;

// ── Module 8 Stage 4: Circularity Metrics ────────────────────────────────────
export const circularityMetrics = pgTable("circularity_metrics", {
  id:                  serial("id").primaryKey(),
  ventureId:           varchar("ventureId", { length: 64 }).notNull().unique().references(() => ventures.id, { onDelete: "cascade" }),
  globalMciScore:      numeric("globalMciScore",      { precision: 8, scale: 3 }).notNull().default("0"),
  circularInflowPct:   numeric("circularInflowPct",   { precision: 8, scale: 3 }).notNull().default("0"),
  virginInflowPct:     numeric("virginInflowPct",     { precision: 8, scale: 3 }).notNull().default("0"),
  landfillDiversionPct:numeric("landfillDiversionPct",{ precision: 8, scale: 3 }).notNull().default("0"),
  recoveryPotentialPct:numeric("recoveryPotentialPct",{ precision: 8, scale: 3 }).notNull().default("0"),
  waterRecycledPct:    numeric("waterRecycledPct",    { precision: 8, scale: 3 }).notNull().default("0"),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().notNull(),
});
export type CircularityMetric = typeof circularityMetrics.$inferSelect;
export type InsertCircularityMetric = typeof circularityMetrics.$inferInsert;

// ── Module 8 Stage 5: B Corp & ESG ───────────────────────────────────────────
export const esgBcorpMetrics = pgTable("esg_bcorp_metrics", {
  id:                   serial("id").primaryKey(),
  ventureId:            varchar("ventureId", { length: 64 }).notNull().unique().references(() => ventures.id, { onDelete: "cascade" }),
  totalBScore:          numeric("totalBScore",          { precision: 6, scale: 2 }).notNull().default("0"),
  bGovernance:          numeric("bGovernance",          { precision: 6, scale: 2 }).notNull().default("0"),
  bWorkers:             numeric("bWorkers",             { precision: 6, scale: 2 }).notNull().default("0"),
  bCommunity:           numeric("bCommunity",           { precision: 6, scale: 2 }).notNull().default("0"),
  bEnvironment:         numeric("bEnvironment",         { precision: 6, scale: 2 }).notNull().default("0"),
  bCustomers:           numeric("bCustomers",           { precision: 6, scale: 2 }).notNull().default("0"),
  esgEnvironmentalPct:  integer("esgEnvironmentalPct").notNull().default(0),
  esgSocialPct:         integer("esgSocialPct").notNull().default(0),
  esgGovernancePct:     integer("esgGovernancePct").notNull().default(0),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().notNull(),
});
export type EsgBcorpMetric = typeof esgBcorpMetrics.$inferSelect;
export type InsertEsgBcorpMetric = typeof esgBcorpMetrics.$inferInsert;

// ── Module 14 Stage 1: Team Workspace ────────────────────────────────────────
export const collaborationTasks = pgTable("collaboration_tasks", {
  id:             serial("id").primaryKey(),
  ventureId:      varchar("ventureId", { length: 64 }).notNull().references(() => ventures.id, { onDelete: "cascade" }),
  taskTitle:      varchar("taskTitle", { length: 255 }).notNull(),
  pillarCategory: varchar("pillarCategory", { length: 128 }).notNull(),
  assignedRole:   varchar("assignedRole", { length: 128 }).notNull(),
  priority:       varchar("priority", { length: 32 }).notNull().default("Medium"),
  status:         varchar("status", { length: 32 }).notNull().default("Todo"),
  dueDate:        timestamp("dueDate"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().notNull(),
});
export type CollaborationTask = typeof collaborationTasks.$inferSelect;
export type InsertCollaborationTask = typeof collaborationTasks.$inferInsert;

// ── Module 14 Stage 2: Advisory Function ─────────────────────────────────────
export const advisoryReviews = pgTable("advisory_reviews", {
  id:               serial("id").primaryKey(),
  ventureId:        varchar("ventureId", { length: 64 }).notNull().references(() => ventures.id, { onDelete: "cascade" }),
  advisorName:      varchar("advisorName", { length: 128 }).notNull(),
  advisorRole:      varchar("advisorRole", { length: 128 }).notNull(),
  feedbackNotes:    text("feedbackNotes").notNull(),
  validationRating: integer("validationRating").notNull().default(0),
  signOffStatus:    varchar("signOffStatus", { length: 32 }).notNull().default("Pending"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type AdvisoryReview = typeof advisoryReviews.$inferSelect;
export type InsertAdvisoryReview = typeof advisoryReviews.$inferInsert;

// ── Admin: Users & Roles ──────────────────────────────────────────────────────
export const usersRoles = pgTable("users_roles", {
  id:                 serial("id").primaryKey(),
  userName:           varchar("userName", { length: 128 }).notNull(),
  email:              varchar("email", { length: 255 }).notNull().unique(),
  systemRole:         text("systemRole").notNull().default("Founder"),
  assignedVentureId:  varchar("assignedVentureId", { length: 64 })
                        .references(() => ventures.id, { onDelete: "set null" }),
  isActive:           boolean("isActive").notNull().default(true),
  createdAt:          timestamp("createdAt").defaultNow().notNull(),
  updatedAt:          timestamp("updatedAt").defaultNow().notNull(),
});
export type UserRole = typeof usersRoles.$inferSelect;
export type InsertUserRole = typeof usersRoles.$inferInsert;

// ── Admin: System Audit Logs ──────────────────────────────────────────────────
export const systemAuditLogs = pgTable("system_audit_logs", {
  id:               serial("id").primaryKey(),
  actorName:        varchar("actorName", { length: 255 }).notNull(),
  actorRole:        varchar("actorRole", { length: 128 }),
  actionPerformed:  text("actionPerformed").notNull(),
  targetModule:     varchar("targetModule", { length: 128 }).notNull(),
  targetVentureId:  varchar("targetVentureId", { length: 64 }),
  targetRecordId:   varchar("targetRecordId", { length: 128 }),
  actionCategory:   varchar("actionCategory", { length: 64 }).default("update"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type SystemAuditLog = typeof systemAuditLogs.$inferSelect;
export type InsertSystemAuditLog = typeof systemAuditLogs.$inferInsert;

// ── Admin: System Data Fields ─────────────────────────────────────────────────
export const systemDataFields = pgTable("system_data_fields", {
  id:              serial("id").primaryKey(),
  fieldKey:        varchar("fieldKey", { length: 64 }).notNull().unique(),
  fieldLabel:      varchar("fieldLabel", { length: 128 }).notNull(),
  dataType:        varchar("dataType", { length: 32 }).notNull().default("string"),
  validationRange: varchar("validationRange", { length: 128 }),
  fieldGroup:      varchar("fieldGroup", { length: 64 }),
  description:     text("description"),
  isCore:          boolean("isCore").notNull().default(true),
  isEditable:      boolean("isEditable").notNull().default(false),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type SystemDataField = typeof systemDataFields.$inferSelect;
export type InsertSystemDataField = typeof systemDataFields.$inferInsert;

// ── Admin: System Module Status ───────────────────────────────────────────────
export const systemModuleStatus = pgTable("system_module_status", {
  id:           serial("id").primaryKey(),
  moduleNumber: integer("moduleNumber").notNull().unique(),
  moduleName:   varchar("moduleName", { length: 128 }).notNull(),
  moduleSlug:   varchar("moduleSlug", { length: 64 }),
  routePath:    varchar("routePath", { length: 128 }),
  isEnabled:    boolean("isEnabled").notNull().default(true),
  isCore:       boolean("isCore").notNull().default(false),
  moduleGroup:  varchar("moduleGroup", { length: 64 }),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type SystemModule = typeof systemModuleStatus.$inferSelect;
export type InsertSystemModule = typeof systemModuleStatus.$inferInsert;

// ── Admin: System Configuration ───────────────────────────────────────────────
export const systemConfiguration = pgTable("system_configuration", {
  id:           serial("id").primaryKey(),
  configKey:    varchar("configKey", { length: 64 }).notNull().unique(),
  configValue:  text("configValue").notNull(),
  configGroup:  varchar("configGroup", { length: 64 }).default("General"),
  description:  text("description"),
  isEditable:   boolean("isEditable").notNull().default(true),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type SystemConfig = typeof systemConfiguration.$inferSelect;
export type InsertSystemConfig = typeof systemConfiguration.$inferInsert;

// ── Admin: Widget Analytics ───────────────────────────────────────────────────
export const systemWidgetAnalytics = pgTable("system_widget_analytics", {
  id:              serial("id").primaryKey(),
  widgetId:        varchar("widgetId", { length: 64 }).notNull().unique(),
  widgetLabel:     varchar("widgetLabel", { length: 128 }).notNull(),
  widgetPage:      varchar("widgetPage", { length: 128 }),
  pageViews:       integer("pageViews").notNull().default(0),
  uniqueUsers:     integer("uniqueUsers").notNull().default(0),
  interactionRate: numeric("interactionRate", { precision: 5, scale: 2 }).notNull().default("0"),
  avgDwellSecs:    integer("avgDwellSecs").notNull().default(0),
  lastActive:      timestamp("lastActive").defaultNow().notNull(),
  widgetGroup:     varchar("widgetGroup", { length: 64 }),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type SystemWidgetAnalytic = typeof systemWidgetAnalytics.$inferSelect;
export type InsertSystemWidgetAnalytic = typeof systemWidgetAnalytics.$inferInsert;

// ── Admin: Integrations ───────────────────────────────────────────────────────
export const systemIntegrations = pgTable("system_integrations", {
  id:           serial("id").primaryKey(),
  serviceName:  varchar("serviceName", { length: 128 }).notNull(),
  serviceSlug:  varchar("serviceSlug", { length: 64 }).notNull().unique(),
  category:     varchar("category", { length: 64 }),
  logoEmoji:    varchar("logoEmoji", { length: 16 }),
  isConnected:  boolean("isConnected").notNull().default(false),
  lastSyncTime: timestamp("lastSyncTime"),
  syncStatus:   varchar("syncStatus", { length: 32 }).default("idle"),
  description:  text("description"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type SystemIntegration = typeof systemIntegrations.$inferSelect;
export type InsertSystemIntegration = typeof systemIntegrations.$inferInsert;

// ── Admin: API Keys ───────────────────────────────────────────────────────────
export const systemApiKeys = pgTable("system_api_keys", {
  id:           serial("id").primaryKey(),
  keyName:      varchar("keyName", { length: 128 }).notNull(),
  maskedToken:  varchar("maskedToken", { length: 64 }).notNull(),
  tokenPrefix:  varchar("tokenPrefix", { length: 16 }).notNull().default("sk_live"),
  status:       varchar("status", { length: 32 }).notNull().default("Active"),
  scopes:       varchar("scopes", { length: 256 }),
  createdBy:    varchar("createdBy", { length: 128 }),
  lastUsed:     timestamp("lastUsed"),
  expiresAt:    timestamp("expiresAt"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type SystemApiKey = typeof systemApiKeys.$inferSelect;
export type InsertSystemApiKey = typeof systemApiKeys.$inferInsert;

// ── Legal Contract Requirements (governance taxonomy) ─────────────────────────
// Canonical library of ~80 contract types across 7 business layers.
export const legalContractRequirements = pgTable("legal_contract_requirements", {
  id:                     serial("id").primaryKey(),
  name:                   varchar("name", { length: 255 }).notNull(),
  description:            text("description"),
  businessLayer:          varchar("business_layer", { length: 64 }).notNull(),
  category:               varchar("category", { length: 4 }).notNull(),
  categoryLabel:          varchar("category_label", { length: 128 }),
  priorityStage:          varchar("priority_stage", { length: 16 }).notNull(),
  required:               boolean("required").default(true),
  defaultRiskRating:      varchar("default_risk_rating", { length: 16 }).default("medium"),
  missionLockRelevance:   boolean("mission_lock_relevance").default(false),
  ipRelevance:            boolean("ip_relevance").default(false),
  dataRelevance:          boolean("data_relevance").default(false),
  seisEisRelevance:       boolean("seis_eis_relevance").default(false),
  charityRelevance:       boolean("charity_relevance").default(false),
  defaultReviewFrequency: varchar("default_review_frequency", { length: 32 }).default("annual"),
  sortOrder:              integer("sort_order").default(0),
  createdAt:              timestamp("created_at").defaultNow(),
  updatedAt:              timestamp("updated_at").defaultNow(),
});
export type LegalContractRequirement = typeof legalContractRequirements.$inferSelect;
export type InsertLegalContractRequirement = typeof legalContractRequirements.$inferInsert;

// ── Legal Contract Records (per-entity tracking instances) ────────────────────
export const legalContractRecords = pgTable("legal_contract_records", {
  id:                    serial("id").primaryKey(),
  requirementId:         integer("requirement_id").references(() => legalContractRequirements.id),
  ventureId:             varchar("venture_id", { length: 64 }),
  entityName:            varchar("entity_name", { length: 128 }),
  counterpartyName:      varchar("counterparty_name", { length: 255 }),
  legalAdviser:          varchar("legal_adviser", { length: 255 }),
  owner:                 varchar("owner", { length: 128 }),
  approvalAuthority:     varchar("approval_authority", { length: 128 }),
  status:                varchar("status", { length: 32 }).default("not_started"),
  riskRating:            varchar("risk_rating", { length: 16 }).default("medium"),
  priority:              varchar("priority", { length: 32 }).default("immediate"),
  executionDate:         date("execution_date"),
  renewalDate:           date("renewal_date"),
  expiryDate:            date("expiry_date"),
  reviewDate:            date("review_date"),
  documentUrl:           text("document_url"),
  notes:                 text("notes"),
  nextAction:            text("next_action"),
  reservedMatterTrigger: boolean("reserved_matter_trigger").default(false),
  solicitorReviewStatus: varchar("solicitor_review_status", { length: 64 }),
  createdAt:             timestamp("created_at").defaultNow(),
  updatedAt:             timestamp("updated_at").defaultNow(),
});
export type LegalContractRecord = typeof legalContractRecords.$inferSelect;
export type InsertLegalContractRecord = typeof legalContractRecords.$inferInsert;

// ── Legal Contract Dependencies ───────────────────────────────────────────────
export const legalContractDependencies = pgTable("legal_contract_dependencies", {
  id:                     serial("id").primaryKey(),
  requirementId:          integer("requirement_id").notNull(),
  dependsOnId:            integer("depends_on_id").notNull(),
  dependencyType:         varchar("dependency_type", { length: 32 }).default("requires"),
  notes:                  text("notes"),
});

// ── Charity Partnerships ──────────────────────────────────────────────────────
export const charityPartnerships = pgTable("charity_partnerships", {
  id:                        serial("id").primaryKey(),
  ventureId:                 varchar("venture_id", { length: 64 }),
  charityName:               varchar("charity_name", { length: 255 }).notNull(),
  charityRegistrationNumber: varchar("charity_registration_number", { length: 64 }),
  contactName:               varchar("contact_name", { length: 128 }),
  contactEmail:              varchar("contact_email", { length: 255 }),
  partnershipStatus:         varchar("partnership_status", { length: 32 }).default("prospective"),
  donationFormula:           text("donation_formula"),
  profitDefinition:          text("profit_definition"),
  boardApprovalStatus:       varchar("board_approval_status", { length: 32 }).default("not_started"),
  logoPermissionStatus:      varchar("logo_permission_status", { length: 32 }).default("not_granted"),
  publicClaimApprovalStatus: varchar("public_claim_approval_status", { length: 32 }).default("not_approved"),
  impactReportingStatus:     varchar("impact_reporting_status", { length: 32 }).default("not_started"),
  nextReviewDate:            date("next_review_date"),
  notes:                     text("notes"),
  createdAt:                 timestamp("created_at").defaultNow(),
  updatedAt:                 timestamp("updated_at").defaultNow(),
});
export type CharityPartnership = typeof charityPartnerships.$inferSelect;
export type InsertCharityPartnership = typeof charityPartnerships.$inferInsert;

// ── FEDSILK Governance Steps ───────────────────────────────────────────────────
// The 7-step (F-E-D-S-I-L-K) board-level governance workflow.
// Each step tracks status, owner, evidence requirements, and approval state.
export const fedsilkSteps = pgTable("fedsilk_steps", {
  id:                  serial("id").primaryKey(),
  ventureId:           varchar("venture_id", { length: 64 }),
  stepKey:             varchar("step_key", { length: 1 }).notNull(),   // F | E | D | S | I | L | K
  stepName:            varchar("step_name", { length: 255 }).notNull(),
  purpose:             text("purpose"),
  governanceQuestion:  text("governance_question"),
  requiredApproval:    varchar("required_approval", { length: 255 }),
  linkedContract:      varchar("linked_contract", { length: 255 }),
  riskIfIncomplete:    text("risk_if_incomplete"),
  status:              varchar("status", { length: 32 }).default("not_started"),
  owner:               varchar("owner", { length: 128 }),
  dueDate:             date("due_date"),
  notes:               text("notes"),
  sortOrder:           integer("sort_order").default(0),
  createdAt:           timestamp("created_at").defaultNow(),
  updatedAt:           timestamp("updated_at").defaultNow(),
});
export type FedsilkStep = typeof fedsilkSteps.$inferSelect;
export type InsertFedsilkStep = typeof fedsilkSteps.$inferInsert;

// ── FEDSILK Governance Evidence ────────────────────────────────────────────────
export const fedsilkEvidence = pgTable("fedsilk_evidence", {
  id:           serial("id").primaryKey(),
  stepKey:      varchar("step_key", { length: 1 }).notNull(),
  ventureId:    varchar("venture_id", { length: 64 }),
  title:        varchar("title", { length: 255 }).notNull(),
  entityLevel:  varchar("entity_level", { length: 64 }),      // holding_co | studio | spv | charity | venture
  evidenceType: varchar("evidence_type", { length: 64 }),     // board_minute | contract | policy | register | decision_log | approval | risk_assessment | attribution_note
  required:     boolean("required").default(true),
  status:       varchar("status", { length: 32 }).default("not_started"),
  owner:        varchar("owner", { length: 128 }),
  dueDate:      date("due_date"),
  documentUrl:  text("document_url"),
  notes:        text("notes"),
  createdAt:    timestamp("created_at").defaultNow(),
  updatedAt:    timestamp("updated_at").defaultNow(),
});
export type FedsilkEvidence = typeof fedsilkEvidence.$inferSelect;
export type InsertFedsilkEvidence = typeof fedsilkEvidence.$inferInsert;

// ── FEDSILK Contract Triggers ──────────────────────────────────────────────────
export const fedsilkContractTriggers = pgTable("fedsilk_contract_triggers", {
  id:              serial("id").primaryKey(),
  stepKey:         varchar("step_key", { length: 1 }).notNull(),
  ventureId:       varchar("venture_id", { length: 64 }),
  contractName:    varchar("contract_name", { length: 255 }).notNull(),
  entityLevel:     varchar("entity_level", { length: 64 }),
  status:          varchar("status", { length: 32 }).default("not_started"),
  priority:        varchar("priority", { length: 32 }).default("medium"),
  riskLevel:       varchar("risk_level", { length: 16 }).default("medium"),
  legalRecordId:   integer("legal_record_id"),
  notes:           text("notes"),
  createdAt:       timestamp("created_at").defaultNow(),
  updatedAt:       timestamp("updated_at").defaultNow(),
});
export type FedsilkContractTrigger = typeof fedsilkContractTriggers.$inferSelect;
export type InsertFedsilkContractTrigger = typeof fedsilkContractTriggers.$inferInsert;

// ── FEDSILK Risk Flags ─────────────────────────────────────────────────────────
export const fedsilkRiskFlags = pgTable("fedsilk_risk_flags", {
  id:                serial("id").primaryKey(),
  stepKey:           varchar("step_key", { length: 1 }).notNull(),
  ventureId:         varchar("venture_id", { length: 64 }),
  riskName:          varchar("risk_name", { length: 255 }).notNull(),
  category:          varchar("category", { length: 128 }),
  severity:          varchar("severity", { length: 16 }).default("medium"),   // low | medium | high | critical
  status:            varchar("status", { length: 32 }).default("open"),       // open | mitigated | accepted | escalated
  recommendedAction: text("recommended_action"),
  linkedDocument:    varchar("linked_document", { length: 255 }),
  owner:             varchar("owner", { length: 128 }),
  dueDate:           date("due_date"),
  notes:             text("notes"),
  createdAt:         timestamp("created_at").defaultNow(),
  updatedAt:         timestamp("updated_at").defaultNow(),
});
export type FedsilkRiskFlag = typeof fedsilkRiskFlags.$inferSelect;
export type InsertFedsilkRiskFlag = typeof fedsilkRiskFlags.$inferInsert;
