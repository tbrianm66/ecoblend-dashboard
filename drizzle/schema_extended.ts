
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
