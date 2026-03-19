
// ─── COMMERCIAL CRM ───────────────────────────────────────────────────────────

export const crmPipelines = mysqlTable("crmPipelines", {
  id:          varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  ventureId:   varchar("ventureId", { length: 36 }),
  name:        varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isDefault:   boolean("isDefault").default(false),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CrmPipeline = typeof crmPipelines.$inferSelect;
export type InsertCrmPipeline = typeof crmPipelines.$inferInsert;

export const crmPipelineStages = mysqlTable("crmPipelineStages", {
  id:           varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
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
  id:              varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
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
  id:              varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
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
  id:              varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
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
  id:          varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
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
  id:               varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
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
  id:              varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
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
  id:                varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
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
  id:               varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
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
  id:           varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
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
  id:           varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
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
