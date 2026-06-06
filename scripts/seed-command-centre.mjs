/**
 * Command Centre Lean OS — Seed Script
 * Populates cc_ tables for BEBUS, ECOCOMP, REAL, TONE.
 * Run: node scripts/seed-command-centre.mjs
 * Idempotent: clears existing cc_ rows for these ventures then re-inserts.
 */
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const VENTURES = ["bebus", "ecocomp", "real", "tone"];

// ─── Seed data ──────────────────────────────────────────────────────────────

const HYPOTHESES = {
  bebus: [
    {
      hypothesisType: "problem",
      hypothesisStatement: "UK construction procurement managers struggle to find bio-based composite materials that meet BS EN ISO structural standards, leading to spec sheet rewrites and project delays.",
      assumptionRiskLevel: "high",
      status: "testing",
      confidenceScore: 45,
      evidenceSummary: "8 interviews with procurement managers confirm the standards gap.",
      moduleSource: "discovery_market",
    },
    {
      hypothesisType: "pricing",
      hypothesisStatement: "Structural architects will pay a 12–18 % premium for bio-sourced composites if a certified ISO compliance data pack is bundled at point of sale.",
      assumptionRiskLevel: "critical",
      status: "untested",
      confidenceScore: 20,
      evidenceSummary: null,
      moduleSource: "proposition_model",
    },
    {
      hypothesisType: "channel",
      hypothesisStatement: "Tier-2 builders merchants are the most efficient route to market, reducing customer acquisition cost below £45 per £1 K of GMV.",
      assumptionRiskLevel: "medium",
      status: "untested",
      confidenceScore: 10,
      evidenceSummary: null,
      moduleSource: "brand_gtm",
    },
  ],
  ecocomp: [
    {
      hypothesisType: "value_proposition",
      hypothesisStatement: "Enterprise procurement managers in motorsport and industrial sectors will pay a 15 % premium for bio-based composite materials that carry a full LCA (lifecycle assessment) certificate.",
      assumptionRiskLevel: "critical",
      status: "testing",
      confidenceScore: 62,
      evidenceSummary: "3 interviews completed — 2 buyers expressed strong interest conditional on ASTM safety certifications.",
      moduleSource: "discovery_market",
    },
    {
      hypothesisType: "solution",
      hypothesisStatement: "A drop-in bio-resin formulation can achieve 95 % of the tensile strength of standard epoxy at equivalent cure temperatures, validated by ISO 527 testing.",
      assumptionRiskLevel: "high",
      status: "testing",
      confidenceScore: 55,
      evidenceSummary: "First prototype batch shows 91 % tensile parity — additional cure-cycle optimisation required.",
      moduleSource: "rd_hub",
    },
    {
      hypothesisType: "customer_segment",
      hypothesisStatement: "Formula E and sustainable motorsport teams form the beachhead segment — they have sustainability mandates AND budget to pay for premium materials.",
      assumptionRiskLevel: "medium",
      status: "validated",
      confidenceScore: 78,
      evidenceSummary: "Two LOI-level commitments from Formula E teams; confirmed sustainability mandate in technical regulations.",
      moduleSource: "discovery_market",
    },
  ],
  real: [
    {
      hypothesisType: "problem",
      hypothesisStatement: "Independent fashion brands sourcing sustainable fabric face a 6–10 week lead time penalty vs conventional fabric, blocking seasonal collection timelines.",
      assumptionRiskLevel: "high",
      status: "validated",
      confidenceScore: 73,
      evidenceSummary: "12 interviews with indie brand founders confirm lead-time as the #1 pain point.",
      moduleSource: "discovery_market",
    },
    {
      hypothesisType: "business_model",
      hypothesisStatement: "A fabric-as-a-service subscription (min. 500m per drop) reduces buyer risk and creates predictable demand for our production planning.",
      assumptionRiskLevel: "high",
      status: "testing",
      confidenceScore: 38,
      evidenceSummary: "Pilot of 3 brands on subscription model — churn rate 33 % after first drop.",
      moduleSource: "proposition_model",
    },
  ],
  tone: [
    {
      hypothesisType: "problem",
      hypothesisStatement: "SME food brands cannot access compostable packaging that passes UK WRAP standards at under £0.08 per unit — forcing them to use conventional plastic.",
      assumptionRiskLevel: "critical",
      status: "untested",
      confidenceScore: 15,
      evidenceSummary: null,
      moduleSource: "venture_intake",
    },
    {
      hypothesisType: "customer_segment",
      hypothesisStatement: "Artisan bakeries (50–500 units/week) are the most price-tolerant segment for sustainable packaging because they can pass the cost on as a premium brand signal.",
      assumptionRiskLevel: "medium",
      status: "untested",
      confidenceScore: 8,
      evidenceSummary: null,
      moduleSource: "venture_intake",
    },
  ],
};

const EXPERIMENTS = {
  bebus: [
    {
      experimentName: "Procurement Manager Pain Interview — Round 1",
      experimentType: "customer_interview",
      experimentStatus: "completed",
      method: "30-min structured interviews with 10 procurement managers at Tier-1 UK contractors.",
      successThreshold: "7/10 confirm standards-gap as a blocking pain point.",
      result: "8/10 confirmed; 3 mentioned BREEAM certification as linked requirement.",
      learningSummary: "Standards gap is real and blocking. BREEAM angle is an unanticipated opportunity.",
      decisionRecommendation: "Continue testing",
      moduleSource: "discovery_market",
      startDate: "2026-02-01",
      dueDate: "2026-02-28",
    },
    {
      experimentName: "ISO Bundle Pricing Test — Conjoint Survey",
      experimentType: "pricing_test",
      experimentStatus: "running",
      method: "Online conjoint survey (n=80) presenting 5 pricing bundles with/without ISO data pack.",
      successThreshold: "≥50 % of respondents choose bundle with ISO pack at 15 % premium.",
      result: null,
      learningSummary: null,
      decisionRecommendation: null,
      moduleSource: "proposition_model",
      startDate: "2026-04-01",
      dueDate: "2026-06-15",
    },
  ],
  ecocomp: [
    {
      experimentName: "Formula E Procurement LOI Test",
      experimentType: "loi_test",
      experimentStatus: "completed",
      method: "Present bio-composite spec sheet + LCA certificate to 5 Formula E teams and request non-binding LOI.",
      successThreshold: "2 of 5 teams sign LOI.",
      result: "2 LOIs received; 1 conditional on ASTM F3502-21 certification by Q3 2026.",
      learningSummary: "Demand validated in beachhead. ASTM certification is the next gate.",
      decisionRecommendation: "Advance to ASTM certification sprint.",
      moduleSource: "discovery_market",
      startDate: "2026-01-15",
      dueDate: "2026-02-28",
    },
    {
      experimentName: "ISO 527 Tensile Strength Lab Test — Batch 2",
      experimentType: "manufacturing_test",
      experimentStatus: "running",
      method: "Run 3 cure-cycle variants through ISO 527 tensile testing at Cardiff University composite lab.",
      successThreshold: "At least 1 variant achieves ≥95 % tensile parity with standard epoxy.",
      result: null,
      learningSummary: null,
      decisionRecommendation: null,
      moduleSource: "rd_hub",
      startDate: "2026-05-01",
      dueDate: "2026-07-31",
    },
    {
      experimentName: "Industrial Sector Cold Outreach — Aerospace MRO",
      experimentType: "channel_test",
      experimentStatus: "proposed",
      method: "Cold outreach to 20 aerospace MRO procurement contacts with a 1-page LCA summary.",
      successThreshold: "≥3 replies requesting a follow-up call.",
      result: null,
      learningSummary: null,
      decisionRecommendation: null,
      moduleSource: "brand_gtm",
      startDate: "2026-07-01",
      dueDate: "2026-07-31",
    },
  ],
  real: [
    {
      experimentName: "Fabric Lead-Time Discovery Sprint",
      experimentType: "customer_interview",
      experimentStatus: "completed",
      method: "12 structured interviews with indie fashion brands (< 500 units/season).",
      successThreshold: "8/12 cite lead time as #1 or #2 supplier pain.",
      result: "11/12 cited lead time as primary pain; 6 mentioned sustainability credential as secondary value driver.",
      learningSummary: "Problem strongly validated. Sustainability + speed is the core value proposition.",
      decisionRecommendation: "Advance to subscription model experiment.",
      moduleSource: "discovery_market",
      startDate: "2026-01-10",
      dueDate: "2026-02-10",
    },
    {
      experimentName: "FaaS Subscription Pilot — 3 Brands",
      experimentType: "paid_pilot",
      experimentStatus: "running",
      method: "Enrol 3 indie brands on a 3-drop subscription at 500 m minimum per drop.",
      successThreshold: "All 3 brands renew after drop 1; churn ≤ 10 %.",
      result: null,
      learningSummary: null,
      decisionRecommendation: null,
      moduleSource: "proposition_model",
      startDate: "2026-03-01",
      dueDate: "2026-08-31",
    },
  ],
  tone: [
    {
      experimentName: "Bakery Pain Discovery — 5 Artisan Bakeries",
      experimentType: "customer_interview",
      experimentStatus: "proposed",
      method: "5 in-person interviews at artisan bakeries in London to surface packaging cost and compliance pain.",
      successThreshold: "4/5 confirm price-per-unit as primary barrier to sustainable packaging adoption.",
      result: null,
      learningSummary: null,
      decisionRecommendation: null,
      moduleSource: "venture_intake",
      startDate: "2026-06-10",
      dueDate: "2026-06-30",
    },
    {
      experimentName: "WRAP-Compliant Compostable Unit Cost Benchmark",
      experimentType: "supplier_test",
      experimentStatus: "proposed",
      method: "RFQ to 3 compostable packaging suppliers for WRAP-certified pouches at 500-unit MOQ.",
      successThreshold: "At least 1 supplier quotes ≤ £0.10 per unit at 500-unit MOQ.",
      result: null,
      learningSummary: null,
      decisionRecommendation: null,
      moduleSource: "operations_mfg",
      startDate: "2026-06-15",
      dueDate: "2026-07-15",
    },
  ],
};

const EVIDENCE = {
  bebus: [
    {
      evidenceType: "interview",
      evidenceTitle: "10 Procurement Manager Interviews — Standards Gap Confirmed",
      evidenceSummary: "8 of 10 UK Tier-1 contractor procurement managers identified the absence of BS EN ISO compliant bio-composite datasheets as a recurring specification barrier. Average project delay attributed: 3.2 weeks.",
      evidenceStrengthScore: 4,
      evidenceRelevanceScore: 5,
      evidenceRecencyScore: 5,
      evidenceConfidenceScore: 75,
      contradictsHypothesis: false,
      sourceReference: "Interview batch BEB-INT-001 to BEB-INT-010, Feb 2026",
      moduleSource: "discovery_market",
    },
    {
      evidenceType: "demand_signal",
      evidenceSummary: "Three contractors added BEBUS to their approved supplier list pending ISO data pack delivery.",
      evidenceTitle: "3 Contractors Added to Approved Supplier List",
      evidenceStrengthScore: 3,
      evidenceRelevanceScore: 4,
      evidenceRecencyScore: 4,
      evidenceConfidenceScore: 58,
      contradictsHypothesis: false,
      sourceReference: "ASL confirmations, Mar 2026",
      moduleSource: "discovery_market",
    },
    {
      evidenceType: "competitor_signal",
      evidenceTitle: "Competitor Analysis: No UK Supplier Offers ISO Bundle",
      evidenceSummary: "Desk research across 12 UK bio-composite suppliers shows none currently bundle an ISO compliance data pack with purchase. BEBUS has a 6–12 month first-mover window.",
      evidenceStrengthScore: 3,
      evidenceRelevanceScore: 4,
      evidenceRecencyScore: 3,
      evidenceConfidenceScore: 52,
      contradictsHypothesis: false,
      sourceReference: "Competitor mapping, Mar 2026",
      moduleSource: "discovery_market",
    },
  ],
  ecocomp: [
    {
      evidenceType: "customer_commitment",
      evidenceTitle: "2 Formula E Teams — Non-Binding LOI Signed",
      evidenceSummary: "Team Envision and Mahindra Racing signed non-binding LOIs for bio-composite trial kits at the stated 15 % premium. Both conditional on ASTM F3502-21 certification by Q3 2026.",
      evidenceStrengthScore: 4,
      evidenceRelevanceScore: 5,
      evidenceRecencyScore: 5,
      evidenceConfidenceScore: 80,
      contradictsHypothesis: false,
      sourceReference: "LOI-ECOCOMP-001 and LOI-ECOCOMP-002, Feb 2026",
      moduleSource: "discovery_market",
    },
    {
      evidenceType: "prototype_result",
      evidenceTitle: "ISO 527 Batch 1 Test: 91 % Tensile Parity Achieved",
      evidenceSummary: "Cardiff University composite lab ran ISO 527 tensile testing on Batch 1. Result: 91 % parity with standard epoxy at 120 °C cure. Target 95 % not yet met — 2 further cure-cycle variants under test.",
      evidenceStrengthScore: 4,
      evidenceRelevanceScore: 5,
      evidenceRecencyScore: 4,
      evidenceConfidenceScore: 70,
      contradictsHypothesis: false,
      sourceReference: "Cardiff University test report CU-ISO527-EC-001, Apr 2026",
      moduleSource: "rd_hub",
    },
    {
      evidenceType: "interview",
      evidenceTitle: "Industrial Aerospace MRO Buyer — No Immediate Demand",
      evidenceSummary: "Preliminary discussion with a Tier-2 aerospace MRO buyer indicated bio-composite adoption blocked by AS9100D supply-chain audit requirement. Price premium irrelevant until certification achieved.",
      evidenceStrengthScore: 2,
      evidenceRelevanceScore: 3,
      evidenceRecencyScore: 4,
      evidenceConfidenceScore: 35,
      contradictsHypothesis: true,
      sourceReference: "Exploratory call, May 2026",
      moduleSource: "discovery_market",
    },
  ],
  real: [
    {
      evidenceType: "interview",
      evidenceTitle: "12 Indie Brand Interviews — Lead-Time Pain Confirmed",
      evidenceSummary: "11 of 12 indie fashion brand founders cited sustainable fabric lead time (6–10 weeks) as their primary supplier pain. 6 cited sustainability credentials as a secondary value driver. Strong problem-solution fit signal.",
      evidenceStrengthScore: 5,
      evidenceRelevanceScore: 5,
      evidenceRecencyScore: 5,
      evidenceConfidenceScore: 88,
      contradictsHypothesis: false,
      sourceReference: "Interview batch REAL-INT-001 to REAL-INT-012, Jan–Feb 2026",
      moduleSource: "discovery_market",
    },
    {
      evidenceType: "pilot_result",
      evidenceTitle: "FaaS Pilot Drop 1 — 33 % Churn After First Delivery",
      evidenceSummary: "Of the 3 pilot brands, 1 churned after Drop 1 citing minimum order quantity (500 m) as too high for their seasonal volume. The 2 remaining brands rated quality 4.5/5 and lead time as met.",
      evidenceStrengthScore: 3,
      evidenceRelevanceScore: 4,
      evidenceRecencyScore: 5,
      evidenceConfidenceScore: 55,
      contradictsHypothesis: true,
      sourceReference: "FaaS Pilot Report DROP-1-REAL, May 2026",
      moduleSource: "proposition_model",
    },
  ],
  tone: [
    {
      evidenceType: "academic_research",
      evidenceTitle: "WRAP 2025 Report: SME Food Packaging Compostable Costs",
      evidenceSummary: "WRAP 2025 market report shows average unit cost for UK WRAP-certified compostable pouches is £0.12–0.18 at sub-1000 unit MOQ. TONE's £0.08 target requires a 33–55 % cost reduction — achievable only at 5000+ unit volumes.",
      evidenceStrengthScore: 4,
      evidenceRelevanceScore: 5,
      evidenceRecencyScore: 5,
      evidenceConfidenceScore: 72,
      contradictsHypothesis: true,
      sourceReference: "WRAP Sustainable Packaging Market Report 2025, Mar 2026",
      moduleSource: "venture_intake",
    },
    {
      evidenceType: "demand_signal",
      evidenceTitle: "3 Bakeries Express Interest in Sustainable Packaging Switch",
      evidenceSummary: "3 of 5 artisan bakeries surveyed at a London food market expressed interest in switching to compostable packaging if price was within 20 % of current spend. None aware of WRAP certification requirement.",
      evidenceStrengthScore: 2,
      evidenceRelevanceScore: 3,
      evidenceRecencyScore: 5,
      evidenceConfidenceScore: 32,
      contradictsHypothesis: false,
      sourceReference: "Borough Market intercept survey, Jun 2026",
      moduleSource: "venture_intake",
    },
  ],
};

const DECISIONS = {
  bebus: {
    decisionType: "persevere",
    decisionTitle: "Persevere: Advance ISO Bundle Concept to Pricing Test",
    decisionSummary: "Evidence from 8 procurement interviews confirms the standards-gap pain point. ISO bundle concept validated directionally. Move to conjoint pricing survey to confirm willingness-to-pay before product investment.",
    evidenceConfidenceScore: 65,
    riskScore: 35,
    recommendedAction: "Run conjoint pricing survey (n=80) to validate the 12–18 % premium hypothesis.",
    decisionStatus: "approved",
    reviewerNotes: "Approved at VRL Gate Review 2. Pricing test must complete by end of Q2 2026.",
    approvedBy: "EcoRace Studio Review Board",
    decisionDate: "2026-03-15",
    nextReviewDate: "2026-07-01",
  },
  ecocomp: {
    decisionType: "persevere",
    decisionTitle: "Persevere: Accelerate ASTM Certification Sprint",
    decisionSummary: "2 LOIs from Formula E teams confirm WTP at the 15 % premium, conditional on ASTM F3502-21. ISO 527 batch 1 at 91 % tensile parity — near target. Aerospace route blocked by AS9100D. Focus on motorsport beachhead and deliver ASTM cert by Q3.",
    evidenceConfidenceScore: 72,
    riskScore: 28,
    recommendedAction: "Prioritise ASTM F3502-21 certification sprint; de-prioritise aerospace outreach until Formula E beachhead is secured.",
    decisionStatus: "implemented",
    reviewerNotes: "Certification sprint approved. Budget of £35 K allocated. Aerospace deferred to Q4.",
    approvedBy: "EcoRace Studio Review Board",
    decisionDate: "2026-04-01",
    nextReviewDate: "2026-09-01",
  },
  real: {
    decisionType: "pivot",
    decisionTitle: "Pivot: Reduce Subscription MOQ from 500 m to 200 m",
    decisionSummary: "FaaS pilot churn of 33 % after Drop 1 attributed to MOQ being too high for small brands. Problem validation is strong (11/12 interviews), but the business model requires adjustment. Reduce MOQ to 200 m to re-qualify churned brand and broaden addressable segment.",
    evidenceConfidenceScore: 60,
    riskScore: 45,
    recommendedAction: "Reduce minimum subscription drop to 200 m. Model impact on unit economics. Requalify churned pilot brand.",
    decisionStatus: "pending_approval",
    reviewerNotes: "Needs finance sign-off to confirm gross margin at 200 m MOQ.",
    approvedBy: null,
    decisionDate: "2026-06-01",
    nextReviewDate: "2026-07-15",
  },
  tone: {
    decisionType: "request_more_evidence",
    decisionTitle: "Hold: Run Discovery Sprint Before Any Product Investment",
    decisionSummary: "WRAP report shows current unit-cost target (£0.08) only reachable at 5000+ units — far above current demand signals. Customer validation is nascent. No product investment until 10 interviews confirm WTP and realistic volume.",
    evidenceConfidenceScore: 22,
    riskScore: 75,
    recommendedAction: "Complete 10 bakery interviews and 3 supplier RFQs before any further commitment.",
    decisionStatus: "recommended",
    reviewerNotes: "Venture too early for major investment. Discovery sprint is the right next move.",
    approvedBy: null,
    decisionDate: "2026-06-05",
    nextReviewDate: "2026-08-01",
  },
};

const STAGE_GATE_REVIEWS = {
  bebus: {
    fromStage: "problem_validation",
    toStage: "market_validation",
    reviewStatus: "conditional_approval",
    evidenceScore: 65,
    marketScore: 58,
    commercialScore: 40,
    technicalScore: 55,
    operationalScore: 45,
    riskScore: 55,
    investmentReadinessScore: 38,
    reviewerNotes: "Problem validation is solid. Market validation score below 60 threshold. Pricing test must be completed and WTP confirmed before full progression.",
    approvalDecision: "request_more_evidence",
    requiredActions: "Complete conjoint pricing survey; achieve >60 % WTP confirmation at ≥12 % premium; resubmit for market validation gate.",
    reviewDate: "2026-03-15",
    nextReviewDate: "2026-07-15",
  },
  ecocomp: {
    fromStage: "market_validation",
    toStage: "commercial_validation",
    reviewStatus: "approved",
    evidenceScore: 78,
    marketScore: 75,
    commercialScore: 68,
    technicalScore: 62,
    operationalScore: 55,
    riskScore: 60,
    investmentReadinessScore: 58,
    reviewerNotes: "Strong evidence base. LOIs validate market demand. ASTM certification progress is on track. Approved to advance to commercial validation stage with ASTM cert as a condition of stage close.",
    approvalDecision: "approve_progression",
    requiredActions: "Deliver ASTM F3502-21 certification by 30 Sep 2026.",
    reviewDate: "2026-04-15",
    nextReviewDate: "2026-10-01",
  },
  real: {
    fromStage: "market_validation",
    toStage: "commercial_validation",
    reviewStatus: "under_review",
    evidenceScore: 80,
    marketScore: 82,
    commercialScore: 50,
    technicalScore: 70,
    operationalScore: 60,
    riskScore: 52,
    investmentReadinessScore: 45,
    reviewerNotes: "Problem-solution fit is strongly validated. Business model pivot underway — commercial score will be re-assessed once new MOQ pricing is modelled. Review on hold pending pivot outcome.",
    approvalDecision: null,
    requiredActions: "Complete business model pivot (MOQ reduction); remodel unit economics; resubmit commercial score.",
    reviewDate: "2026-06-01",
    nextReviewDate: "2026-08-01",
  },
  tone: {
    fromStage: "intake",
    toStage: "problem_validation",
    reviewStatus: "not_started",
    evidenceScore: 15,
    marketScore: 12,
    commercialScore: 5,
    technicalScore: 10,
    operationalScore: 5,
    riskScore: 20,
    investmentReadinessScore: 5,
    reviewerNotes: "Venture is at intake stage. Minimum evidence threshold not met. Stage-gate review will be scheduled once 10 discovery interviews and supplier RFQ benchmark are complete.",
    approvalDecision: null,
    requiredActions: "Complete 10 bakery discovery interviews; complete 3 supplier RFQs; return with evidence pack.",
    reviewDate: null,
    nextReviewDate: "2026-09-01",
  },
};

const ALERTS = {
  bebus: [
    {
      alertType: "overdue_experiment",
      alertTitle: "Pricing Survey Approaching Deadline",
      alertDescription: "ISO Bundle Pricing Test (conjoint survey) is due 15 Jun 2026. Completion rate currently at 47 % (38/80 responses). At current pace, target n=80 will not be reached in time.",
      severity: "medium",
      linkedModule: "proposition_model",
      recommendedAction: "Boost survey distribution via LinkedIn outreach to procurement contacts. Consider extending deadline by 2 weeks if needed.",
      status: "acknowledged",
      owner: "BEBUS Growth Lead",
      dueDate: "2026-06-15",
      autoGenerated: true,
      dedupeKey: "bebus_overdue_exp_pricing_survey",
    },
    {
      alertType: "weak_evidence",
      alertTitle: "Commercial Validation Evidence Insufficient for Stage Gate",
      alertDescription: "Commercial score (40/100) is below the 60-point threshold required to progress from Problem Validation to Market Validation. No WTP evidence captured yet.",
      severity: "high",
      linkedModule: "proposition_model",
      recommendedAction: "Complete conjoint pricing survey and capture at least 2 customer commitment signals (LOI or paid deposit) before next gate review.",
      status: "open",
      owner: null,
      dueDate: "2026-07-15",
      autoGenerated: true,
      dedupeKey: "bebus_weak_evidence_commercial",
    },
  ],
  ecocomp: [
    {
      alertType: "stage_gate_required",
      alertTitle: "ASTM Cert Condition Approaching — Stage Gate Close Due",
      alertDescription: "Commercial validation stage gate has a condition: ASTM F3502-21 certification by 30 Sep 2026. Current certification sprint is on track but any delay will trigger a stage regression.",
      severity: "high",
      linkedModule: "rd_hub",
      recommendedAction: "Confirm certification lab schedule. Ensure Batch 2 lab tests are completed by end of July to allow re-test time if needed.",
      status: "in_progress",
      owner: "ECOCOMP CTO",
      dueDate: "2026-09-30",
      autoGenerated: true,
      dedupeKey: "ecocomp_stagegate_astm_condition",
    },
    {
      alertType: "high_technical_risk",
      alertTitle: "ISO 527 Batch 1 Below 95 % Target — Re-test Required",
      alertDescription: "Batch 1 tensile test result was 91 % parity, 4 % below the 95 % target. Two additional cure-cycle variants are under test. If Batch 2 also misses target, a formulation pivot will be required.",
      severity: "medium",
      linkedModule: "rd_hub",
      recommendedAction: "Accelerate Batch 2 test cycle. Engage Cardiff University for priority slot. Prepare contingency formulation if 95 % not achieved.",
      status: "acknowledged",
      owner: "ECOCOMP Lab Lead",
      dueDate: "2026-07-31",
      autoGenerated: true,
      dedupeKey: "ecocomp_tech_risk_iso527",
    },
  ],
  real: [
    {
      alertType: "pivot_recommended",
      alertTitle: "Subscription Business Model Pivot — Approval Required",
      alertDescription: "MOQ pivot decision is pending finance sign-off. Pilot churn is 33 % and the churned brand has expressed willingness to re-engage at 200 m MOQ. Decision must be formalised before Drop 2 planning begins.",
      severity: "high",
      linkedModule: "proposition_model",
      recommendedAction: "Prioritise finance sign-off on 200 m MOQ unit economics. Resolve within 2 weeks to avoid Drop 2 delay.",
      status: "open",
      owner: "REAL CFO",
      dueDate: "2026-06-20",
      autoGenerated: true,
      dedupeKey: "real_pivot_moq_decision",
    },
    {
      alertType: "approval_required",
      alertTitle: "Stage Gate Review On Hold — Pivot Outcome Required First",
      alertDescription: "Market → Commercial stage gate review is suspended until business model pivot is resolved. Commercial score cannot be finalised until revised MOQ unit economics are available.",
      severity: "medium",
      linkedModule: "command_centre",
      recommendedAction: "Complete MOQ pivot and remodel unit economics. Then request stage gate review resumption.",
      status: "acknowledged",
      owner: null,
      dueDate: "2026-08-01",
      autoGenerated: true,
      dedupeKey: "real_approval_stage_gate_hold",
    },
  ],
  tone: [
    {
      alertType: "weak_evidence",
      alertTitle: "Insufficient Evidence to Proceed Past Intake",
      alertDescription: "TONE has 0 completed experiments and 2 pieces of early-stage evidence. The minimum threshold for intake → problem validation (≥5 evidence items, ≥1 completed experiment) is not met.",
      severity: "critical",
      linkedModule: "venture_intake",
      recommendedAction: "Complete 10 bakery discovery interviews and 3 supplier RFQs. Capture evidence in the Evidence Dashboard before applying for stage gate review.",
      status: "open",
      owner: "TONE Founder",
      dueDate: "2026-08-01",
      autoGenerated: true,
      dedupeKey: "tone_weak_evidence_intake",
    },
    {
      alertType: "stage_gate_required",
      alertTitle: "Stage Gate Review Not Yet Scheduled",
      alertDescription: "TONE has not yet scheduled its Intake → Problem Validation gate review. No review can proceed without the minimum evidence pack (interviews + supplier benchmark).",
      severity: "medium",
      linkedModule: "command_centre",
      recommendedAction: "Complete discovery sprint, then schedule stage gate review for September 2026.",
      status: "open",
      owner: null,
      dueDate: "2026-09-01",
      autoGenerated: false,
      dedupeKey: "tone_no_stage_gate_scheduled",
    },
  ],
};

const PIVOT_LOGS = {
  real: {
    previousHypothesis: "A fabric-as-a-service subscription (min. 500m per drop) reduces buyer risk and creates predictable demand for our production planning.",
    newHypothesis: "A fabric-as-a-service subscription (min. 200m per drop) is the right entry point for indie brands with seasonal volumes under 1000 m/season, improving retention without critically damaging unit economics.",
    pivotType: "business_model",
    reasonForPivot: "33 % churn after FaaS Drop 1 attributed to minimum order quantity (500 m) exceeding typical indie brand seasonal volume. Reducing MOQ to 200 m requalifies churned segment.",
    evidenceTrigger: "FaaS Pilot Report DROP-1-REAL: 1 of 3 brands churned citing MOQ as sole barrier.",
    dateLogged: "2026-06-01",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function clearVentureData(client, ventureId) {
  const tables = [
    "cc_alerts", "cc_pivot_logs", "cc_stage_gate_reviews",
    "cc_decisions", "cc_evidence", "cc_experiments", "cc_hypotheses",
  ];
  for (const table of tables) {
    await client.query(`DELETE FROM "${table}" WHERE "ventureId" = $1`, [ventureId]);
  }
}

async function insertHypothesis(client, ventureId, h) {
  const res = await client.query(
    `INSERT INTO cc_hypotheses
      ("ventureId", "moduleSource", "hypothesisType", "hypothesisStatement",
       "assumptionRiskLevel", status, "confidenceScore", "evidenceSummary")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id`,
    [ventureId, h.moduleSource, h.hypothesisType, h.hypothesisStatement,
     h.assumptionRiskLevel, h.status, h.confidenceScore, h.evidenceSummary]
  );
  return res.rows[0].id;
}

async function insertExperiment(client, ventureId, e, hypothesisId) {
  const res = await client.query(
    `INSERT INTO cc_experiments
      ("ventureId", "hypothesisId", "experimentName", "experimentType", "moduleSource",
       "experimentStatus", method, "successThreshold", result, "learningSummary",
       "decisionRecommendation", "startDate", "dueDate")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING id`,
    [ventureId, hypothesisId, e.experimentName, e.experimentType, e.moduleSource,
     e.experimentStatus, e.method, e.successThreshold, e.result, e.learningSummary,
     e.decisionRecommendation, e.startDate, e.dueDate]
  );
  return res.rows[0].id;
}

async function insertEvidence(client, ventureId, ev, hypothesisId, experimentId) {
  const res = await client.query(
    `INSERT INTO cc_evidence
      ("ventureId", "hypothesisId", "experimentId", "moduleSource",
       "evidenceType", "evidenceTitle", "evidenceSummary",
       "evidenceStrengthScore", "evidenceRelevanceScore", "evidenceRecencyScore",
       "evidenceConfidenceScore", "contradictsHypothesis", "sourceReference")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING id`,
    [ventureId, hypothesisId, experimentId, ev.moduleSource,
     ev.evidenceType, ev.evidenceTitle, ev.evidenceSummary,
     ev.evidenceStrengthScore, ev.evidenceRelevanceScore, ev.evidenceRecencyScore,
     ev.evidenceConfidenceScore, ev.contradictsHypothesis, ev.sourceReference]
  );
  return res.rows[0].id;
}

async function insertDecision(client, ventureId, d) {
  const res = await client.query(
    `INSERT INTO cc_decisions
      ("ventureId", "decisionType", "decisionTitle", "decisionSummary",
       "evidenceConfidenceScore", "riskScore", "recommendedAction",
       "decisionStatus", "reviewerNotes", "approvedBy", "decisionDate", "nextReviewDate")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id`,
    [ventureId, d.decisionType, d.decisionTitle, d.decisionSummary,
     d.evidenceConfidenceScore, d.riskScore, d.recommendedAction,
     d.decisionStatus, d.reviewerNotes, d.approvedBy, d.decisionDate, d.nextReviewDate]
  );
  return res.rows[0].id;
}

async function insertStageGateReview(client, ventureId, r) {
  await client.query(
    `INSERT INTO cc_stage_gate_reviews
      ("ventureId", "fromStage", "toStage", "reviewStatus",
       "evidenceScore", "marketScore", "commercialScore", "technicalScore",
       "operationalScore", "riskScore", "investmentReadinessScore",
       "reviewerNotes", "approvalDecision", "requiredActions", "reviewDate", "nextReviewDate")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [ventureId, r.fromStage, r.toStage, r.reviewStatus,
     r.evidenceScore, r.marketScore, r.commercialScore, r.technicalScore,
     r.operationalScore, r.riskScore, r.investmentReadinessScore,
     r.reviewerNotes, r.approvalDecision, r.requiredActions, r.reviewDate, r.nextReviewDate]
  );
}

async function insertAlert(client, ventureId, a) {
  await client.query(
    `INSERT INTO cc_alerts
      ("ventureId", "alertType", "alertTitle", "alertDescription", severity,
       "linkedModule", "recommendedAction", status, owner, "dueDate",
       "autoGenerated", "dedupeKey")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [ventureId, a.alertType, a.alertTitle, a.alertDescription, a.severity,
     a.linkedModule, a.recommendedAction, a.status, a.owner, a.dueDate,
     a.autoGenerated, a.dedupeKey]
  );
}

async function insertPivotLog(client, ventureId, p, decisionId, hypothesisId) {
  await client.query(
    `INSERT INTO cc_pivot_logs
      ("ventureId", "previousHypothesis", "newHypothesis", "pivotType",
       "reasonForPivot", "evidenceTrigger", "decisionId", "hypothesisId", "dateLogged")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [ventureId, p.previousHypothesis, p.newHypothesis, p.pivotType,
     p.reasonForPivot, p.evidenceTrigger, decisionId, hypothesisId, p.dateLogged]
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  const client = await pool.connect();
  try {
    console.log("🌱 Command Centre Lean OS — Seed starting…\n");

    for (const ventureId of VENTURES) {
      console.log(`  ▶ Clearing existing cc_ data for ${ventureId.toUpperCase()}…`);
      await clearVentureData(client, ventureId);

      // Hypotheses
      const hyps = HYPOTHESES[ventureId] ?? [];
      const hypIds = [];
      for (const h of hyps) {
        const id = await insertHypothesis(client, ventureId, h);
        hypIds.push(id);
      }
      console.log(`    ✓ ${hyps.length} hypotheses`);

      // Experiments (link first experiment to first hypothesis)
      const exps = EXPERIMENTS[ventureId] ?? [];
      const expIds = [];
      for (let i = 0; i < exps.length; i++) {
        const hypId = hypIds[i] ?? hypIds[0] ?? null;
        const id = await insertExperiment(client, ventureId, exps[i], hypId);
        expIds.push(id);
      }
      console.log(`    ✓ ${exps.length} experiments`);

      // Evidence (link to first hypothesis + respective experiment)
      const evs = EVIDENCE[ventureId] ?? [];
      for (let i = 0; i < evs.length; i++) {
        const hypId = hypIds[i] ?? hypIds[0] ?? null;
        const expId = expIds[i] ?? null;
        await insertEvidence(client, ventureId, evs[i], hypId, expId);
      }
      console.log(`    ✓ ${evs.length} evidence records`);

      // Decision
      const dec = DECISIONS[ventureId];
      let decisionId = null;
      if (dec) {
        decisionId = await insertDecision(client, ventureId, dec);
        console.log(`    ✓ 1 decision`);
      }

      // Stage-gate review
      const rev = STAGE_GATE_REVIEWS[ventureId];
      if (rev) {
        await insertStageGateReview(client, ventureId, rev);
        console.log(`    ✓ 1 stage-gate review`);
      }

      // Alerts
      const alts = ALERTS[ventureId] ?? [];
      for (const a of alts) {
        await insertAlert(client, ventureId, a);
      }
      console.log(`    ✓ ${alts.length} alerts`);

      // Pivot logs (REAL only)
      const pivotData = PIVOT_LOGS[ventureId];
      if (pivotData) {
        const hypId = hypIds[1] ?? hypIds[0] ?? null; // business_model hypothesis
        await insertPivotLog(client, ventureId, pivotData, decisionId, hypId);
        console.log(`    ✓ 1 pivot log`);
      }

      console.log(`  ✅ ${ventureId.toUpperCase()} seeded\n`);
    }

    console.log("🎉 Command Centre seed complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
