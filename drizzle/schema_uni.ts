
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
