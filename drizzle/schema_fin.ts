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
