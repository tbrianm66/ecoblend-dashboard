/**
 * WTP Assessment (Commercial Validation) — Seed Script
 * Populates wtp_tests + wtp_commitments / pricing_experiments /
 * budget_validations / procurement_pathways for BEBUS, ECOCOMP, REAL, TONE
 * per the WTP spec §19 worked examples.
 * Run: node scripts/seed-wtp.mjs
 * Idempotent: clears existing WTP rows (incl. linkedModule='wtp' risks/alerts)
 * for these ventures, then re-inserts.
 */
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const VENTURES = ["bebus", "ecocomp", "real", "tone"];

// ─── Scoring (mirror of shared/wtp.ts) ──────────────────────────────────────────
const EVIDENCE = { 1: 10, 2: 25, 3: 40, 4: 55, 5: 70, 6: 85, 7: 100 };
const budgetScore = (s) => (s === "confirmed" ? 100 : s === "partial" ? 50 : 0);
const procScore = (s) => ({ validated: 100, feasible: 75, mapped: 60, high_friction: 40, blocked: 0 }[s] ?? 25);
const priceScore = (s) => ({ accepted: 100, negotiating: 75, needs_roi_proof: 50, price_resistance: 25, rejected: 0 }[s] ?? 0);
const clamp100 = (v) => Math.max(0, Math.min(100, Math.round(v)));
function wtpScoreOf(t) {
  return clamp100(
    (EVIDENCE[t.evidenceLevel] ?? 10) * 0.5 +
      budgetScore(t.budgetOwnerStatus) * 0.2 +
      procScore(t.procurementPathwayStatus) * 0.15 +
      priceScore(t.pricingResponse) * 0.15,
  );
}

// ─── Seed data (spec §19) ───────────────────────────────────────────────────────
const TESTS = {
  bebus: {
    customerName: "Procurement Lead — Tier-1 Contractor",
    organisation: "Mace Group",
    contactRole: "Senior Procurement Manager",
    buyerRole: "Procurement",
    economicBuyer: false,
    budgetOwnerStatus: "partial",
    budgetOwnerName: "Head of Sustainability",
    budgetOwnerRole: "Sustainability Director",
    currentSpend: "180,000",
    currentSpendCurrency: "GBP",
    currentSpendPeriod: "year",
    valueDriver: "Avoid spec-sheet rewrites and ISO compliance delays on bio-composite materials.",
    pricingModelTested: "paid_pilot",
    priceTested: "25,000",
    priceCurrency: "GBP",
    pricePeriod: "pilot",
    testMethod: "proposal_sent",
    responseSummary: "Requested a formal proposal after reviewing the ISO data pack. Wants to share project data for a scoped pilot.",
    evidenceLevel: 5,
    pricingResponse: "negotiating",
    procurementPathway: "Innovation pilot budget under £50k, direct PO",
    procurementPathwayStatus: "feasible",
    procurementPathwayNotes: "Pilot can run under innovation budget without full tender.",
    decisionProcessNotes: "Sustainability sign-off then procurement PO.",
    objections: "Will share project data but cautious about data-sharing terms before committing budget.",
    objectionCategory: "data_sharing_concern",
    recommendedPricingModel: "paid_pilot",
    nextCommercialAction: "Send scoped paid-pilot proposal with data-sharing agreement",
    nextActionDueDate: "2026-05-20",
    status: "in_progress",
  },
  ecocomp: {
    customerName: "Innovation Buyer — Motorsport OEM",
    organisation: "McLaren Applied",
    contactRole: "Head of Materials Innovation",
    buyerRole: "Engineering",
    economicBuyer: false,
    budgetOwnerStatus: "partial",
    budgetOwnerName: "VP Engineering",
    budgetOwnerRole: "VP Engineering",
    currentSpend: "120,000",
    currentSpendCurrency: "GBP",
    currentSpendPeriod: "year",
    valueDriver: "Lifecycle-assessed bio-composites that pass ASTM safety certification.",
    pricingModelTested: "co_development",
    priceTested: "15% premium",
    priceCurrency: "GBP",
    pricePeriod: "unit",
    testMethod: "budget_holder_meeting",
    responseSummary: "Introduced us to the budget holder; conditional on independent performance proof.",
    evidenceLevel: 4,
    pricingResponse: "needs_roi_proof",
    procurementPathway: "Supplier onboarding + framework",
    procurementPathwayStatus: "mapped",
    procurementPathwayNotes: "Supplier onboarding required before framework agreement.",
    decisionProcessNotes: "Engineering proof → VP approval → supplier onboarding.",
    objections: "Wants ASTM performance proof before approving spend.",
    objectionCategory: "insufficient_proof",
    recommendedPricingModel: "co_development",
    nextCommercialAction: "Run independent ASTM performance test and share results",
    nextActionDueDate: "2026-06-01",
    status: "in_progress",
  },
  real: {
    customerName: "Operations Manager — Recycling Plant",
    organisation: "Veolia UK",
    contactRole: "Operations Manager",
    buyerRole: "Operations",
    economicBuyer: false,
    budgetOwnerStatus: "unknown",
    currentSpend: "60,000",
    currentSpendCurrency: "GBP",
    currentSpendPeriod: "year",
    valueDriver: "Improve sorting yield with measurable performance uplift.",
    pricingModelTested: "subscription",
    priceTested: "1,200",
    priceCurrency: "GBP",
    pricePeriod: "month",
    testMethod: "pricing_interview",
    responseSummary: "Shared operational data for analysis but has not identified who controls the budget.",
    evidenceLevel: 3,
    pricingResponse: "needs_roi_proof",
    procurementPathway: "Direct purchase, unclear authority",
    procurementPathwayStatus: "mapped",
    procurementPathwayNotes: "Route mapped but budget authority unconfirmed.",
    decisionProcessNotes: "Needs performance proof before escalating internally.",
    objections: "Data shared, but wants performance proof and unsure of budget owner.",
    objectionCategory: "insufficient_proof",
    recommendedPricingModel: "subscription",
    nextCommercialAction: "Identify the budget owner and present a performance proof pack",
    nextActionDueDate: "2026-05-10",
    status: "in_progress",
  },
  tone: {
    customerName: "Sustainability Lead — SME Manufacturer",
    organisation: "ToneWorks Ltd",
    contactRole: "Sustainability Lead",
    buyerRole: "Sustainability",
    economicBuyer: false,
    budgetOwnerStatus: "unknown",
    currentSpend: "",
    currentSpendCurrency: "GBP",
    valueDriver: "Lower-cost route to carbon reporting compliance.",
    pricingModelTested: "subscription",
    priceTested: "450",
    priceCurrency: "GBP",
    pricePeriod: "month",
    testMethod: "sales_call",
    responseSummary: "Agreed to a follow-up meeting but flagged timing and unclear ROI; no budget owner identified.",
    evidenceLevel: 2,
    pricingResponse: "price_resistance",
    procurementPathway: "",
    procurementPathwayStatus: "unknown",
    procurementPathwayNotes: "",
    decisionProcessNotes: "No budget owner identified yet.",
    objections: "Interested but timing is wrong this quarter and ROI is unclear.",
    objectionCategory: "timing_issue",
    recommendedPricingModel: "subscription",
    nextCommercialAction: "Schedule follow-up after Q3 budgeting and quantify ROI",
    nextActionDueDate: "2026-07-15",
    status: "planned",
  },
};

const COMMITMENTS = {
  bebus: [
    { commitmentType: "proposal_request", commitmentDescription: "Requested formal paid-pilot proposal", commitmentValue: "25,000", commitmentDate: "2026-04-28", status: "strong", evidenceReference: "Email from procurement lead 28/04" },
    { commitmentType: "data_sharing", commitmentDescription: "Agreed to share project spec data for pilot scoping", commitmentDate: "2026-04-20", status: "moderate" },
  ],
  ecocomp: [
    { commitmentType: "budget_holder_intro", commitmentDescription: "Introduced VP Engineering as budget holder", commitmentDate: "2026-04-15", status: "moderate" },
  ],
  real: [
    { commitmentType: "data_sharing", commitmentDescription: "Shared 6 months of sorting throughput data", commitmentDate: "2026-04-02", status: "moderate" },
  ],
  tone: [
    { commitmentType: "follow_up_meeting", commitmentDescription: "Agreed to a follow-up after Q3 budgeting", commitmentDate: "2026-04-25", status: "weak" },
  ],
};

const PRICING = {
  bebus: [
    { pricingModel: "paid_pilot", pricePoint: "25,000", currency: "GBP", billingPeriod: "pilot", targetCustomerSegment: "Tier-1 contractors", valueMetric: "per pilot project", testMethod: "proposal_sent", testSampleSize: 6, positiveResponses: 4, negativeResponses: 2, learningSummary: "4 of 6 contractors would fund a scoped pilot under £50k.", recommendedPriceRange: "20,000–30,000", recommendedNextTest: "Convert one proposal to a signed pilot", status: "completed" },
  ],
  ecocomp: [
    { pricingModel: "co_development", pricePoint: "15% premium", currency: "GBP", billingPeriod: "unit", targetCustomerSegment: "Motorsport OEMs", valueMetric: "per part", testMethod: "budget_holder_meeting", testSampleSize: 4, positiveResponses: 2, negativeResponses: 2, learningSummary: "Premium acceptable only with independent ASTM proof.", recommendedPriceRange: "10–15% premium", recommendedNextTest: "Provide ASTM proof then re-test premium", status: "running" },
  ],
  real: [
    { pricingModel: "subscription", pricePoint: "1,200", currency: "GBP", billingPeriod: "month", targetCustomerSegment: "Recycling operators", valueMetric: "per plant", testMethod: "pricing_interview", testSampleSize: 5, positiveResponses: 2, negativeResponses: 3, learningSummary: "Interest conditional on proven yield uplift.", recommendedPriceRange: "900–1,400", recommendedNextTest: "Run a value-proof pilot", status: "inconclusive" },
  ],
  tone: [
    { pricingModel: "subscription", pricePoint: "450", currency: "GBP", billingPeriod: "month", targetCustomerSegment: "SME manufacturers", valueMetric: "per site", testMethod: "sales_call", testSampleSize: 4, positiveResponses: 1, negativeResponses: 3, learningSummary: "Price resistance; ROI not yet compelling for SMEs.", recommendedPriceRange: "250–400", recommendedNextTest: "Quantify ROI and re-approach post-budget cycle", status: "inconclusive" },
  ],
};

const BUDGETS = {
  bebus: [
    { organisation: "Mace Group", budgetOwnerKnown: true, budgetOwnerRole: "Sustainability Director", budgetCategory: "innovation", budgetCycle: "FY26 Q2", currentBudgetAvailable: "Innovation pilot fund", estimatedBudgetRange: "20,000–50,000", approvalRequired: true, approvalStakeholders: "Sustainability Director, Procurement", financialDecisionCriteria: "ISO compliance + payback < 18 months", notes: "Pilot fund available this cycle.", validationStatus: "partially_validated" },
  ],
  ecocomp: [
    { organisation: "McLaren Applied", budgetOwnerKnown: true, budgetOwnerRole: "VP Engineering", budgetCategory: "research_and_development", budgetCycle: "FY26", currentBudgetAvailable: "R&D budget", estimatedBudgetRange: "50,000–120,000", approvalRequired: true, approvalStakeholders: "VP Engineering", financialDecisionCriteria: "Independent ASTM performance proof", notes: "Budget holder identified, spend conditional on proof.", validationStatus: "partially_validated" },
  ],
  real: [
    { organisation: "Veolia UK", budgetOwnerKnown: false, budgetCategory: "operations", budgetCycle: "Unknown", approvalRequired: true, financialDecisionCriteria: "Proven yield uplift", notes: "Budget owner not yet identified.", validationStatus: "unknown" },
  ],
  tone: [
    { organisation: "ToneWorks Ltd", budgetOwnerKnown: false, budgetCategory: "compliance", budgetCycle: "Q3 review", approvalRequired: true, financialDecisionCriteria: "Clear ROI within budget cycle", notes: "No budget owner; timing-dependent.", validationStatus: "unknown" },
  ],
};

const PROCUREMENT = {
  bebus: [
    { organisation: "Mace Group", procurementRoute: "innovation_pilot", procurementComplexityScore: 2, expectedSalesCycleDays: 60, requiredDocuments: "Pilot SOW, data-sharing agreement", complianceRequirements: "ISO data pack", legalReviewRequired: true, dataSecurityReviewRequired: true, pilotPossibleWithoutFullProcurement: true, procurementRisks: "Data-sharing terms could delay sign-off.", nextProcurementStep: "Agree data-sharing terms", status: "feasible" },
  ],
  ecocomp: [
    { organisation: "McLaren Applied", procurementRoute: "supplier_onboarding", procurementComplexityScore: 3, expectedSalesCycleDays: 120, requiredDocuments: "Supplier onboarding pack, ASTM cert", complianceRequirements: "ASTM safety certification", legalReviewRequired: true, dataSecurityReviewRequired: false, pilotPossibleWithoutFullProcurement: false, procurementRisks: "Onboarding gate before any spend.", nextProcurementStep: "Complete supplier onboarding", status: "mapped" },
  ],
  real: [
    { organisation: "Veolia UK", procurementRoute: "direct_purchase", procurementComplexityScore: 3, expectedSalesCycleDays: 90, requiredDocuments: "Unknown", complianceRequirements: "TBD", legalReviewRequired: false, dataSecurityReviewRequired: true, pilotPossibleWithoutFullProcurement: true, procurementRisks: "Authority to purchase unclear.", nextProcurementStep: "Identify purchasing authority", status: "mapped" },
  ],
  tone: [
    { organisation: "ToneWorks Ltd", procurementRoute: "unknown", procurementComplexityScore: 4, expectedSalesCycleDays: 180, requiredDocuments: "Unknown", complianceRequirements: "Unknown", legalReviewRequired: false, dataSecurityReviewRequired: false, pilotPossibleWithoutFullProcurement: false, procurementRisks: "No procurement route identified.", nextProcurementStep: "Map the buying process", status: "unknown" },
  ],
};

// ─── Insert helpers ─────────────────────────────────────────────────────────────
function cols(obj) {
  const keys = Object.keys(obj);
  const names = keys.map((k) => `"${k}"`).join(", ");
  const params = keys.map((_, i) => `$${i + 1}`).join(", ");
  return { names, params, values: keys.map((k) => obj[k]) };
}

async function insertRow(client, table, obj) {
  const { names, params, values } = cols(obj);
  const res = await client.query(
    `INSERT INTO "${table}" (${names}) VALUES (${params}) RETURNING id`,
    values,
  );
  return res.rows[0].id;
}

async function clearVenture(client, ventureId) {
  for (const t of ["wtp_commitments", "pricing_experiments", "budget_validations", "procurement_pathways"]) {
    await client.query(`DELETE FROM "${t}" WHERE "ventureId" = $1`, [ventureId]);
  }
  await client.query(
    `DELETE FROM market_risks WHERE "ventureId" = $1 AND "linkedModule" = 'wtp' AND "autoGenerated" = true`,
    [ventureId],
  );
  await client.query(
    `DELETE FROM cc_alerts WHERE "ventureId" = $1 AND "linkedModule" = 'wtp' AND "autoGenerated" = true`,
    [ventureId],
  );
  await client.query(`DELETE FROM wtp_tests WHERE "ventureId" = $1`, [ventureId]);
}

async function seed() {
  const client = await pool.connect();
  try {
    for (const ventureId of VENTURES) {
      console.log(`\n▸ Seeding ${ventureId.toUpperCase()}`);
      await clearVenture(client, ventureId);

      const t = TESTS[ventureId];
      const score = wtpScoreOf(t);
      const evidenceStrengthScore = EVIDENCE[t.evidenceLevel] ?? 10;
      const wtpTestId = await insertRow(client, "wtp_tests", {
        ventureId,
        ...t,
        wtpScore: score,
        evidenceStrengthScore,
      });
      console.log(`  ✓ wtp_test (score ${score})`);

      for (const c of COMMITMENTS[ventureId] ?? []) {
        await insertRow(client, "wtp_commitments", { ventureId, wtpTestId, commitmentCurrency: "GBP", ...c });
      }
      console.log(`  ✓ ${(COMMITMENTS[ventureId] ?? []).length} commitments`);

      for (const p of PRICING[ventureId] ?? []) {
        const denom = p.testSampleSize || (p.positiveResponses ?? 0) + (p.negativeResponses ?? 0);
        const conversionRate = denom > 0 ? clamp100(((p.positiveResponses ?? 0) / denom) * 100) : 0;
        await insertRow(client, "pricing_experiments", { ventureId, conversionRate, ...p });
      }
      console.log(`  ✓ ${(PRICING[ventureId] ?? []).length} pricing experiments`);

      for (const b of BUDGETS[ventureId] ?? []) {
        await insertRow(client, "budget_validations", { ventureId, wtpTestId, ...b });
      }
      console.log(`  ✓ ${(BUDGETS[ventureId] ?? []).length} budget validations`);

      for (const pr of PROCUREMENT[ventureId] ?? []) {
        await insertRow(client, "procurement_pathways", { ventureId, wtpTestId, ...pr });
      }
      console.log(`  ✓ ${(PROCUREMENT[ventureId] ?? []).length} procurement pathways`);
    }
    console.log("\n🎉 WTP seed complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
