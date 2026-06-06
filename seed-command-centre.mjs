// Seed script for Module 1 — Command Centre (Lean OS).
// Upserts 4 ventures (BEBUS, ECOCOMP, REAL, TONE) with stage/status + the full
// Lean cockpit dataset: hypotheses, experiments, evidence, decisions, pivot logs,
// stage-gate reviews and a baseline alert each. Discovery data is left intact.
// Run: npx tsx seed-command-centre.mjs
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import {
  ventures, ccHypotheses, ccExperiments, ccEvidence, ccDecisions,
  ccPivotLogs, ccStageGateReviews, ccAlerts,
} from "./drizzle/schema.ts";
import { calculateEvidenceConfidenceScore } from "./shared/commandCentre.ts";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const today = () => new Date().toISOString().slice(0, 10);
const daysFromNow = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const VENTURES = [
  { id: "bebus", name: "BEBUS", tagline: "Bus fleet reliability intelligence", sector: "Mobility", color: "#3B85BA",
    currentStage: "market_validation", validationStatus: "validating", ventureType: "B2B SaaS", owner: "A. Okafor" },
  { id: "ecocomp", name: "ECOCOMP", tagline: "Sustainable composite formulations", sector: "Advanced Materials", color: "#56A837",
    currentStage: "commercial_validation", validationStatus: "building", ventureType: "Deep Tech", owner: "L. Nguyen" },
  { id: "real", name: "REAL", tagline: "Sustainable combat-sports equipment", sector: "Consumer / Materials", color: "#F69111",
    currentStage: "mvp_validation", validationStatus: "piloting", ventureType: "Consumer Brand", owner: "M. Rossi" },
  { id: "tone", name: "TONE", tagline: "Modular sustainable creative equipment", sector: "Creative Industries", color: "#8B5CF6",
    currentStage: "problem_validation", validationStatus: "validating", ventureType: "Hardware / Rental", owner: "S. Patel" },
];

const ev = (s, r, rec, rest) => ({
  evidenceStrengthScore: s, evidenceRelevanceScore: r, evidenceRecencyScore: rec,
  evidenceConfidenceScore: calculateEvidenceConfidenceScore({ evidenceStrengthScore: s, evidenceRelevanceScore: r, evidenceRecencyScore: rec }),
  ...rest,
});

// ── Per-venture dataset ────────────────────────────────────────────────────────
const DATA = {
  bebus: {
    hypotheses: [
      { hypothesisType: "problem", assumptionRiskLevel: "high", status: "validated", confidenceScore: 72,
        hypothesisStatement: "UK bus operators experience avoidable downtime because reliability data is fragmented across OEMs, suppliers, and maintenance teams.",
        moduleSource: "venture_intake", evidenceSummary: "12 depot interviews confirm fragmented data and reactive maintenance." },
      { hypothesisType: "value_proposition", assumptionRiskLevel: "high", status: "testing", confidenceScore: 48,
        hypothesisStatement: "A unified reliability dashboard reduces unplanned downtime by at least 15% within two quarters.",
        moduleSource: "discovery_market", evidenceSummary: "Two operators interested in a paid pilot pending ROI proof." },
      { hypothesisType: "pricing", assumptionRiskLevel: "medium", status: "untested", confidenceScore: 20,
        hypothesisStatement: "Operators will pay a per-vehicle annual subscription if downtime savings exceed the fee.",
        moduleSource: "proposition_model" },
    ],
    experiments: [
      { experimentName: "Depot maintenance interviews (wave 2)", experimentType: "customer_interview", experimentStatus: "completed",
        experimentOwner: "A. Okafor", method: "10 structured interviews with depot managers", successThreshold: "≥70% cite data fragmentation as top-3 problem",
        result: "validated — 8/10 cite fragmentation", learningSummary: "Strong problem confirmation; ROI proof now the blocker.",
        decisionRecommendation: "persevere", nextStep: "Design ROI pilot", startDate: daysFromNow(-40), dueDate: daysFromNow(-20), moduleSource: "discovery_market" },
      { experimentName: "Reliability dashboard paid pilot", experimentType: "paid_pilot", experimentStatus: "running",
        experimentOwner: "A. Okafor", method: "8-week pilot with two operators tracking downtime delta", successThreshold: "≥10% downtime reduction",
        startDate: daysFromNow(-15), dueDate: daysFromNow(25), moduleSource: "operations_mfg" },
      { experimentName: "Pricing willingness survey", experimentType: "pricing_test", experimentStatus: "overdue",
        experimentOwner: "Unassigned", method: "Van Westendorp survey to 30 operators", successThreshold: "Acceptable price ≥ £180/vehicle/yr",
        startDate: daysFromNow(-30), dueDate: daysFromNow(-5), moduleSource: "proposition_model" },
    ],
    evidence: [
      ev(4, 5, 5, { evidenceType: "interview", evidenceTitle: "8/10 depots cite fragmented reliability data", moduleSource: "discovery_market", contradictsHypothesis: false, evidenceSummary: "Recurring theme across operators of varying size." }),
      ev(3, 4, 4, { evidenceType: "demand_signal", evidenceTitle: "Two operators verbally committed to pilot", moduleSource: "discovery_market", contradictsHypothesis: false }),
      ev(2, 4, 3, { evidenceType: "budget_signal", evidenceTitle: "Budget owner unclear at one operator", moduleSource: "proposition_model", contradictsHypothesis: true, evidenceSummary: "Procurement and ops disagree on who owns the budget line." }),
    ],
    decisions: [
      { decisionType: "persevere", decisionStatus: "approved", decisionTitle: "Persevere into market validation",
        decisionSummary: "Problem strongly validated; proceed to ROI pilot to unlock commercial validation.",
        recommendedAction: "Run paid pilot and quantify downtime savings.", evidenceConfidenceScore: 64, riskScore: 45,
        approvedBy: "Investment Committee", decisionDate: daysFromNow(-18), nextReviewDate: daysFromNow(20) },
    ],
    reviews: [
      { fromStage: "problem_validation", toStage: "market_validation", reviewStatus: "approved", approvalDecision: "approve_progression",
        evidenceScore: 70, marketScore: 62, commercialScore: 40, technicalScore: 55, operationalScore: 50, riskScore: 45, investmentReadinessScore: 58,
        reviewerNotes: "Problem validated; advance with ROI pilot as the next gate.", reviewDate: daysFromNow(-18) },
    ],
    alerts: [
      { alertType: "overdue_experiment", severity: "high", alertTitle: "Pricing survey overdue", linkedModule: "command_centre",
        alertDescription: "Pricing willingness survey is past due and unassigned.", recommendedAction: "Assign an owner and relaunch the survey.", status: "open" },
    ],
  },

  ecocomp: {
    hypotheses: [
      { hypothesisType: "problem", assumptionRiskLevel: "high", status: "validated", confidenceScore: 78,
        hypothesisStatement: "Manufacturers need validated sustainable composite formulations that meet performance and compliance requirements without increasing production risk.",
        moduleSource: "venture_intake", evidenceSummary: "Procurement leads confirm sustainability mandates with no qualified supply." },
      { hypothesisType: "solution", assumptionRiskLevel: "high", status: "testing", confidenceScore: 55,
        hypothesisStatement: "Our bio-resin formulation matches incumbent flexural strength within 5% at comparable cost.",
        moduleSource: "rd_hub", evidenceSummary: "Lab samples within 8% — iterating on cure cycle." },
      { hypothesisType: "channel", assumptionRiskLevel: "medium", status: "untested", confidenceScore: 25,
        hypothesisStatement: "Tier-1 automotive suppliers are the fastest route to volume adoption.", moduleSource: "brand_gtm" },
    ],
    experiments: [
      { experimentName: "Mechanical performance bench test", experimentType: "prototype_test", experimentStatus: "completed",
        experimentOwner: "L. Nguyen", method: "ASTM flexural + tensile on 3 formulations", successThreshold: "Within 5% of incumbent",
        result: "partial — within 8%", learningSummary: "Promising but not yet at parity; cure cycle is the lever.",
        decisionRecommendation: "run_more_experiments", nextStep: "Iterate cure profile", startDate: daysFromNow(-50), dueDate: daysFromNow(-30), moduleSource: "rd_hub" },
      { experimentName: "Compliance pre-assessment with notified body", experimentType: "data_access_test", experimentStatus: "blocked",
        experimentOwner: "L. Nguyen", method: "Pre-review of REACH compliance pathway", successThreshold: "No blocking substances flagged",
        startDate: daysFromNow(-20), dueDate: daysFromNow(10), moduleSource: "operations_mfg" },
      { experimentName: "LOI test with Tier-1 supplier", experimentType: "loi_test", experimentStatus: "running",
        experimentOwner: "L. Nguyen", method: "Secure non-binding LOI contingent on parity", successThreshold: "≥1 signed LOI",
        startDate: daysFromNow(-10), dueDate: daysFromNow(30), moduleSource: "proposition_model" },
    ],
    evidence: [
      ev(5, 5, 4, { evidenceType: "academic_research", evidenceTitle: "Bio-resin parity feasible per peer-reviewed study", moduleSource: "rd_hub", contradictsHypothesis: false }),
      ev(3, 5, 5, { evidenceType: "prototype_result", evidenceTitle: "Bench test within 8% of incumbent strength", moduleSource: "rd_hub", contradictsHypothesis: false, evidenceSummary: "Not yet at the 5% threshold." }),
      ev(4, 4, 4, { evidenceType: "procurement_signal", evidenceTitle: "Two procurement leads confirm sustainability mandate", moduleSource: "discovery_market", contradictsHypothesis: false }),
    ],
    decisions: [
      { decisionType: "persevere", decisionStatus: "pending_approval", decisionTitle: "Continue R&D toward strength parity",
        decisionSummary: "Strong demand and feasibility; technical parity is the gating risk before commercial validation.",
        recommendedAction: "Iterate cure cycle and secure a contingent LOI.", evidenceConfidenceScore: 68, riskScore: 55,
        decisionDate: daysFromNow(-6), nextReviewDate: daysFromNow(24) },
    ],
    reviews: [
      { fromStage: "market_validation", toStage: "commercial_validation", reviewStatus: "under_review",
        evidenceScore: 68, marketScore: 65, commercialScore: 48, technicalScore: 60, operationalScore: 45, riskScore: 55, investmentReadinessScore: 56,
        reviewerNotes: "Demand clear; need parity + LOI before commercial gate approval.", reviewDate: daysFromNow(-6) },
    ],
    alerts: [
      { alertType: "high_technical_risk", severity: "high", alertTitle: "Strength parity not yet achieved", linkedModule: "rd_hub",
        alertDescription: "Formulation is within 8% but the success threshold is 5%.", recommendedAction: "Iterate the cure cycle and re-test.", status: "acknowledged", owner: "L. Nguyen" },
    ],
  },

  real: {
    hypotheses: [
      { hypothesisType: "problem", assumptionRiskLevel: "medium", status: "validated", confidenceScore: 70,
        hypothesisStatement: "Combat sports customers will pay for protective equipment made from sustainable materials if performance, durability, and brand credibility are not compromised.",
        moduleSource: "venture_intake" },
      { hypothesisType: "value_proposition", assumptionRiskLevel: "high", status: "invalidated", confidenceScore: 30,
        hypothesisStatement: "Customers will accept a 25% price premium purely for sustainability messaging.",
        moduleSource: "discovery_market", evidenceSummary: "Survey + pre-orders show premium tolerance only when durability is proven." },
      { hypothesisType: "solution", assumptionRiskLevel: "high", status: "testing", confidenceScore: 50,
        hypothesisStatement: "Recycled-composite shin guards match incumbent impact protection over a 12-month use cycle.",
        moduleSource: "rd_hub" },
    ],
    experiments: [
      { experimentName: "Sustainability price-premium survey", experimentType: "survey", experimentStatus: "completed",
        experimentOwner: "M. Rossi", method: "Conjoint survey to 120 athletes", successThreshold: "≥20% accept 25% premium",
        result: "fail — only 9% accept premium on messaging alone", learningSummary: "Premium requires proven durability, not just messaging.",
        decisionRecommendation: "pivot", nextStep: "Pivot value prop to durability-led", startDate: daysFromNow(-45), dueDate: daysFromNow(-25), moduleSource: "discovery_market" },
      { experimentName: "Concierge MVP pre-order drop", experimentType: "concierge_mvp", experimentStatus: "running",
        experimentOwner: "M. Rossi", method: "Limited pre-order run with durability guarantee", successThreshold: "≥50 pre-orders",
        startDate: daysFromNow(-12), dueDate: daysFromNow(18), moduleSource: "brand_gtm" },
      { experimentName: "12-month durability stress test", experimentType: "prototype_test", experimentStatus: "approved",
        experimentOwner: "R&D", method: "Accelerated impact cycling vs incumbent", successThreshold: "≥ incumbent impact retention",
        startDate: daysFromNow(2), dueDate: daysFromNow(60), moduleSource: "rd_hub" },
    ],
    evidence: [
      ev(4, 5, 5, { evidenceType: "survey", evidenceTitle: "Only 9% accept premium on messaging alone", moduleSource: "discovery_market", contradictsHypothesis: true, evidenceSummary: "Invalidates the messaging-led premium hypothesis." }),
      ev(3, 4, 5, { evidenceType: "customer_commitment", evidenceTitle: "38 pre-orders in first week of concierge drop", moduleSource: "brand_gtm", contradictsHypothesis: false }),
      ev(3, 5, 4, { evidenceType: "prototype_result", evidenceTitle: "Early impact tests match incumbent at 3 months", moduleSource: "rd_hub", contradictsHypothesis: false }),
    ],
    decisions: [
      { decisionType: "pivot", decisionStatus: "approved", decisionTitle: "Pivot to durability-led value proposition",
        decisionSummary: "Messaging-led premium invalidated; reposition around proven durability with sustainability as a secondary benefit.",
        recommendedAction: "Run durability stress test and lead marketing with the guarantee.", evidenceConfidenceScore: 58, riskScore: 50,
        approvedBy: "Founder + IC", decisionDate: daysFromNow(-20), nextReviewDate: daysFromNow(40) },
    ],
    reviews: [
      { fromStage: "mvp_validation", toStage: "delivery_validation", reviewStatus: "ready_for_review",
        evidenceScore: 58, marketScore: 60, commercialScore: 52, technicalScore: 50, operationalScore: 40, riskScore: 50, investmentReadinessScore: 51,
        reviewerNotes: "Pivot underway; gate pending durability evidence and pre-order conversion.", reviewDate: daysFromNow(-2) },
    ],
    pivots: [
      { pivotType: "value_proposition", reasonForPivot: "Sustainability-messaging premium rejected by target athletes.",
        previousHypothesis: "Customers will pay a 25% premium for sustainability messaging.",
        newHypothesis: "Customers will pay a premium for proven durability, with sustainability as a secondary benefit.",
        evidenceTrigger: "Conjoint survey: only 9% accept messaging-led premium.", dateLogged: daysFromNow(-20) },
    ],
    alerts: [
      { alertType: "pivot_recommended", severity: "high", alertTitle: "Value proposition invalidated", linkedModule: "discovery_market",
        alertDescription: "Messaging-led premium hypothesis invalidated by survey evidence.", recommendedAction: "Confirm the durability-led pivot in the pivot log.", status: "resolved" },
    ],
  },

  tone: {
    hypotheses: [
      { hypothesisType: "problem", assumptionRiskLevel: "high", status: "testing", confidenceScore: 40,
        hypothesisStatement: "Creative industry operators will adopt modular sustainable equipment systems if they reduce production cost, storage burden, and environmental impact.",
        moduleSource: "venture_intake" },
      { hypothesisType: "customer_segment", assumptionRiskLevel: "high", status: "untested", confidenceScore: 18,
        hypothesisStatement: "Independent film and event production companies are the highest-pain early adopters.",
        moduleSource: "discovery_market" },
    ],
    experiments: [
      { experimentName: "Production company discovery interviews", experimentType: "customer_interview", experimentStatus: "running",
        experimentOwner: "S. Patel", method: "15 interviews across film and event producers", successThreshold: "≥60% cite storage + cost as top pains",
        startDate: daysFromNow(-8), dueDate: daysFromNow(14), moduleSource: "discovery_market" },
      { experimentName: "Modular rental landing page test", experimentType: "landing_page", experimentStatus: "proposed",
        experimentOwner: "S. Patel", method: "Smoke test landing page measuring waitlist signups", successThreshold: "≥5% visitor-to-waitlist",
        moduleSource: "brand_gtm" },
    ],
    evidence: [
      ev(3, 4, 5, { evidenceType: "interview", evidenceTitle: "3 producers cite storage cost as a major burden", moduleSource: "discovery_market", contradictsHypothesis: false }),
      ev(2, 3, 4, { evidenceType: "demand_signal", evidenceTitle: "Mixed interest — some prefer ownership over rental", moduleSource: "discovery_market", contradictsHypothesis: true }),
    ],
    decisions: [
      { decisionType: "request_more_evidence", decisionStatus: "recommended", decisionTitle: "Gather more discovery evidence",
        decisionSummary: "Early signal is mixed; need stronger segment and demand evidence before committing.",
        recommendedAction: "Complete discovery interviews and launch the landing-page smoke test.", evidenceConfidenceScore: 32, riskScore: 60,
        decisionDate: daysFromNow(-3), nextReviewDate: daysFromNow(21) },
    ],
    reviews: [
      { fromStage: "intake", toStage: "problem_validation", reviewStatus: "under_review",
        evidenceScore: 32, marketScore: 30, commercialScore: 20, technicalScore: 25, operationalScore: 20, riskScore: 60, investmentReadinessScore: 28,
        reviewerNotes: "Problem hypothesis still forming; keep in discovery.", reviewDate: daysFromNow(-3) },
    ],
    alerts: [
      { alertType: "weak_evidence", severity: "high", alertTitle: "Evidence confidence below threshold", linkedModule: "command_centre",
        alertDescription: "Evidence confidence is low and the customer segment is untested.", recommendedAction: "Complete discovery interviews to strengthen evidence.", status: "open" },
    ],
  },
};

async function upsertVenture(v) {
  const existing = await db.select().from(ventures).where(eq(ventures.id, v.id));
  const fields = { currentStage: v.currentStage, validationStatus: v.validationStatus, ventureType: v.ventureType, owner: v.owner, updatedAt: new Date() };
  if (existing.length) {
    await db.update(ventures).set(fields).where(eq(ventures.id, v.id));
  } else {
    await db.insert(ventures).values({ id: v.id, name: v.name, tagline: v.tagline, sector: v.sector, color: v.color, ...fields });
  }
}

async function clearCc(vid) {
  for (const t of [ccAlerts, ccPivotLogs, ccStageGateReviews, ccDecisions, ccEvidence, ccExperiments, ccHypotheses]) {
    await db.delete(t).where(eq(t.ventureId, vid));
  }
}

async function seed() {
  for (const v of VENTURES) {
    await upsertVenture(v);
    await clearCc(v.id);
    const d = DATA[v.id];

    const hypIds = [];
    for (const h of d.hypotheses) {
      const [row] = await db.insert(ccHypotheses).values({ ventureId: v.id, ...h }).returning();
      hypIds.push(row.id);
    }
    const expIds = [];
    for (let i = 0; i < d.experiments.length; i++) {
      const e = d.experiments[i];
      const [row] = await db.insert(ccExperiments).values({ ventureId: v.id, hypothesisId: hypIds[i % hypIds.length] ?? null, ...e }).returning();
      expIds.push(row.id);
    }
    for (let i = 0; i < d.evidence.length; i++) {
      const e = d.evidence[i];
      await db.insert(ccEvidence).values({ ventureId: v.id, hypothesisId: hypIds[i % hypIds.length] ?? null, experimentId: expIds[i % expIds.length] ?? null, ...e });
    }
    const decIds = [];
    for (const dec of d.decisions) {
      const [row] = await db.insert(ccDecisions).values({ ventureId: v.id, ...dec }).returning();
      decIds.push(row.id);
    }
    for (const p of d.pivots ?? []) {
      await db.insert(ccPivotLogs).values({ ventureId: v.id, decisionId: decIds[0] ?? null, hypothesisId: hypIds[1] ?? null, ...p });
    }
    for (const r of d.reviews) {
      await db.insert(ccStageGateReviews).values({ ventureId: v.id, ...r });
    }
    for (const a of d.alerts) {
      await db.insert(ccAlerts).values({ ventureId: v.id, autoGenerated: false, ...a });
    }
    console.log(`Seeded ${v.name}: ${hypIds.length} hyp, ${expIds.length} exp, ${d.evidence.length} ev, ${d.decisions.length} dec, ${d.reviews.length} review`);
  }
  await pool.end();
  console.log("Command Centre seed complete.");
}

seed().catch((e) => { console.error(e); process.exit(1); });
