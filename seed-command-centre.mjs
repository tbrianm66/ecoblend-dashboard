/**
 * seed-command-centre.mjs
 * Seeds the Command Centre dashboard with realistic live data across all five
 * data sources: financial snapshots, ESG metrics, IRL scores, experiments,
 * POI pipeline, and PM programs.
 *
 * Run: node seed-command-centre.mjs
 */

import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const VENTURES = [
  { id: "ecoblend",    name: "EcoBlend",      status: "Active",      vrl: 2, trl: 4 },
  { id: "ecoblend-rd", name: "EcoBlend R&D",  status: "Active",      vrl: 2, trl: 4 },
  { id: "bebus",       name: "BEBUS",         status: "Active",      vrl: 2, trl: 3 },
  { id: "tone",        name: "TONE",          status: "Active",      vrl: 1, trl: 2 },
  { id: "real",        name: "REAL",          status: "Pre-Launch",  vrl: 1, trl: 2 },
  { id: "pipe",        name: "PIPE",          status: "Pre-Launch",  vrl: 1, trl: 1 },
];

// Realistic financial profiles per venture
const FINANCIAL_PROFILES = {
  "ecoblend":    { baseRevenue: 28000, burnRate: 18000, investment: 250000, runway: 14, revenueGrowth: 0.12 },
  "ecoblend-rd": { baseRevenue: 5000,  burnRate: 22000, investment: 180000, runway: 8,  revenueGrowth: 0.05 },
  "bebus":       { baseRevenue: 12000, burnRate: 9000,  investment: 95000,  runway: 11, revenueGrowth: 0.18 },
  "tone":        { baseRevenue: 8500,  burnRate: 7500,  investment: 60000,  runway: 8,  revenueGrowth: 0.22 },
  "real":        { baseRevenue: 3200,  burnRate: 5500,  investment: 40000,  runway: 7,  revenueGrowth: 0.08 },
  "pipe":        { baseRevenue: 1200,  burnRate: 4000,  investment: 25000,  runway: 6,  revenueGrowth: 0.04 },
};

// ESG profiles per venture
const ESG_PROFILES = {
  "ecoblend":    { env: 7.8, soc: 7.2, gov: 8.1, framework: "GRI Standards + B Corp" },
  "ecoblend-rd": { env: 8.5, soc: 6.8, gov: 7.5, framework: "ISO 14040 LCA + GRI" },
  "bebus":       { env: 7.2, soc: 8.0, gov: 7.8, framework: "B Corp + UN SDGs" },
  "tone":        { env: 6.9, soc: 7.5, gov: 7.0, framework: "GRI Standards" },
  "real":        { env: 6.5, soc: 7.0, gov: 6.8, framework: "UN SDGs" },
  "pipe":        { env: 7.0, soc: 6.5, gov: 6.2, framework: "GRI Standards" },
};

// Experiments per venture
const EXPERIMENTS_DATA = {
  "ecoblend": [
    { title: "Bio-polymer blend tensile strength test", hypothesis: "EcoBlend formulation X-7 achieves ≥85% tensile strength of virgin plastic at 30% lower cost", method: "ASTM D638 tensile testing on 50 samples across 3 formulations", result: "Formulation X-7 achieved 91% tensile strength at 28% lower material cost", outcome: "Pass", trl: 4 },
    { title: "Retail packaging customer acceptance trial", hypothesis: "Eco-packaging increases purchase intent by ≥15% among target demographic", method: "A/B test with 200 participants at Bristol Farmers Market over 4 weeks", result: "Purchase intent increased 22% with eco-packaging; price sensitivity decreased", outcome: "Pass", trl: 4 },
    { title: "Industrial compostability certification test", hypothesis: "EcoBlend material meets EN 13432 industrial compostability standard", method: "60-day composting trial at certified facility with mass loss measurement", result: "87% mass loss at 60 days; EN 13432 threshold is 90% — narrowly failed", outcome: "Fail", trl: 3 },
  ],
  "ecoblend-rd": [
    { title: "Mycelium composite structural integrity", hypothesis: "Mycelium-hemp composite achieves 40 MPa compressive strength", method: "Compression testing on 30 samples grown under controlled humidity", result: "Average 44.2 MPa compressive strength achieved across all samples", outcome: "Pass", trl: 4 },
    { title: "Algae-based bioplastic UV degradation rate", hypothesis: "Algae bioplastic degrades 60% faster than PLA under UV exposure", method: "UV weatherometer test at 1000W/m² for 500 hours with mass measurement", result: "68% faster degradation confirmed; colour stability also superior to PLA", outcome: "Pass", trl: 3 },
    { title: "Scale-up fermentation yield consistency", hypothesis: "Pilot fermentation batch (500L) achieves ≥90% yield consistency vs lab (5L)", method: "3 × 500L fermentation runs with HPLC yield analysis", result: "Yield consistency 78% — below target; temperature gradient identified as cause", outcome: "Fail", trl: 4 },
  ],
  "bebus": [
    { title: "Electric cargo bike range under load", hypothesis: "BEBUS cargo bike achieves 60km range at 80kg payload in urban conditions", method: "GPS-tracked test rides across 5 Bristol routes with standardised payload", result: "Average 67km range achieved; battery thermal management performing above spec", outcome: "Pass", trl: 3 },
    { title: "Fleet operator pricing model validation", hypothesis: "Fleet operators will commit to ≥5 unit trial at £3,200/unit/year lease", method: "10 structured interviews with logistics managers + 3 LOI requests", result: "7/10 expressed strong interest; 2 signed LOIs at £3,400/unit/year", outcome: "Pass", trl: 3 },
    { title: "Regenerative braking efficiency in hilly terrain", hypothesis: "Regenerative braking recovers ≥15% of energy on Bristol's gradient profile", method: "Instrumented test rides on 8 routes with elevation gain >50m", result: "12.3% energy recovery — below 15% target on steepest routes", outcome: "Inconclusive", trl: 3 },
  ],
  "tone": [
    { title: "Eco-creative brief client conversion rate", hypothesis: "TONE's sustainability-first creative brief increases client conversion by 20%", method: "Pilot with 15 SME clients comparing standard vs eco-brief onboarding", result: "28% higher conversion rate; average project value also 15% higher", outcome: "Pass", trl: 2 },
    { title: "Carbon-neutral print production feasibility", hypothesis: "Carbon-neutral print production is achievable at <10% cost premium", method: "Quotes from 6 certified printers + lifecycle carbon calculation", result: "8.2% average cost premium confirmed; 3 supplier partnerships established", outcome: "Pass", trl: 2 },
  ],
  "real": [
    { title: "Bio-foam impact absorption vs EPS benchmark", hypothesis: "REAL bio-foam achieves ≥95% impact absorption of EPS at equal density", method: "EN 1621-1 impact testing on 20 samples vs EPS control", result: "97.4% impact absorption achieved; weight 8% lighter than EPS equivalent", outcome: "Pass", trl: 2 },
    { title: "Athletes' perception of bio-material protection", hypothesis: "Athletes rate bio-foam protection ≥8/10 after 4-week trial", method: "Blind trial with 12 amateur cyclists; weekly perception surveys", result: "Average protection rating 7.6/10; comfort rated 9.1/10", outcome: "Inconclusive", trl: 2 },
  ],
  "pipe": [
    { title: "Recycled ocean plastic board blank structural test", hypothesis: "PIPE board blank from 100% recycled ocean plastic meets ISO 18776 flex standard", method: "3-point bend test on 10 blanks vs virgin EPS control", result: "Flex index 94% of control; delamination risk identified at fin box junction", outcome: "Inconclusive", trl: 1 },
  ],
};

// POI pipeline data
const POI_CATEGORIES = [
  { name: "Bio-Materials", sector: "Materials Science", description: "Sustainable and bio-derived material innovations" },
  { name: "Clean Mobility", sector: "Transportation", description: "Electric and human-powered transport solutions" },
  { name: "Circular Design", sector: "Product Design", description: "Products designed for end-of-life recovery" },
  { name: "Impact Branding", sector: "Creative Services", description: "Sustainability-led brand and communication services" },
];

const POI_OPPORTUNITIES = [
  { name: "Hemp-Fibre Insulation Panel", category: 0, sector: "Construction Materials", market: "UK residential retrofit market", stage: "Prototype", status: "Scored", cost: 4, perf: 4, qual: 3, sust: 5 },
  { name: "Seaweed-Based Food Packaging", category: 0, sector: "Food & Beverage Packaging", market: "UK supermarket own-label", stage: "Pilot", status: "Approved for VRL", cost: 3, perf: 4, qual: 4, sust: 5 },
  { name: "Cargo Trike Last-Mile Delivery", category: 1, sector: "Urban Logistics", market: "Bristol & Bath city centres", stage: "Prototype", status: "Under Assessment", cost: 3, perf: 4, qual: 4, sust: 4 },
  { name: "Mycelium Acoustic Panels", category: 0, sector: "Interior Design", market: "Commercial office fit-out", stage: "Concept", status: "Identified", cost: 3, perf: 3, qual: 3, sust: 5 },
  { name: "Upcycled Textile Sports Gear", category: 2, sector: "Sportswear", market: "UK outdoor sports retail", stage: "Pilot", status: "Scored", cost: 4, perf: 3, qual: 4, sust: 4 },
  { name: "Solar-Integrated Garden Furniture", category: 2, sector: "Garden & Outdoor", market: "UK garden retail", stage: "Concept", status: "Identified", cost: 2, perf: 3, qual: 3, sust: 4 },
  { name: "Bamboo Bicycle Frame", category: 1, sector: "Cycling", market: "UK premium cycling market", stage: "Prototype", status: "Under Assessment", cost: 3, perf: 4, qual: 4, sust: 5 },
  { name: "Eco-Packaging Design Service", category: 3, sector: "Creative Services", market: "UK SME brands", stage: "Commercial", status: "Approved for VRL", cost: 5, perf: 4, qual: 5, sust: 4 },
];

// PM Programs per venture
const PM_PROGRAMS = {
  "ecoblend": {
    name: "EcoBlend Materials — Market Entry Programme",
    status: "In Progress",
    start: "2025-10-01", end: "2026-06-30",
    manager: "Sarah Chen", budget: 85000, spent: 42000,
    phases: [
      { name: "Phase 1: Formulation Validation", vrl: 2, num: 1, status: "Completed", pct: 100, start: "2025-10-01", end: "2026-01-31" },
      { name: "Phase 2: Pilot Production", vrl: 2, num: 2, status: "In Progress", pct: 65, start: "2026-02-01", end: "2026-04-30" },
      { name: "Phase 3: Commercial Launch", vrl: 3, num: 3, status: "Not Started", pct: 0, start: "2026-05-01", end: "2026-06-30" },
    ],
    tasks: [
      { title: "Complete EN 13432 re-test with revised formulation", status: "In Progress", priority: "Critical", due: "2026-03-28" },
      { title: "Finalise supplier agreement with GreenPack Ltd", status: "In Progress", priority: "High", due: "2026-04-05" },
      { title: "Submit B Corp certification application", status: "To Do", priority: "High", due: "2026-04-15" },
      { title: "Develop retail pricing model", status: "Done", priority: "Medium", due: "2026-02-28" },
      { title: "Complete market sizing analysis", status: "Done", priority: "Medium", due: "2026-02-15" },
      { title: "Design brand identity for retail packaging", status: "Done", priority: "Medium", due: "2026-03-01" },
    ],
  },
  "bebus": {
    name: "BEBUS Cargo Bike — Fleet Pilot Programme",
    status: "In Progress",
    start: "2025-11-01", end: "2026-08-31",
    manager: "Marcus Webb", budget: 55000, spent: 18500,
    phases: [
      { name: "Phase 1: Prototype Refinement", vrl: 2, num: 1, status: "Completed", pct: 100, start: "2025-11-01", end: "2026-01-31" },
      { name: "Phase 2: Fleet Operator Trials", vrl: 2, num: 2, status: "In Progress", pct: 40, start: "2026-02-01", end: "2026-05-31" },
      { name: "Phase 3: Commercial Fleet Launch", vrl: 3, num: 3, status: "Not Started", pct: 0, start: "2026-06-01", end: "2026-08-31" },
    ],
    tasks: [
      { title: "Deliver 3 units to Bristol City Council for trial", status: "In Progress", priority: "Critical", due: "2026-03-31" },
      { title: "Resolve regenerative braking efficiency on steep gradients", status: "In Progress", priority: "High", due: "2026-04-10" },
      { title: "Negotiate insurance framework with Aviva", status: "To Do", priority: "High", due: "2026-04-20" },
      { title: "Complete CE marking documentation", status: "Done", priority: "High", due: "2026-02-28" },
      { title: "Establish service & maintenance protocol", status: "In Progress", priority: "Medium", due: "2026-04-30" },
    ],
  },
  "tone": {
    name: "TONE Creative — Client Acquisition Sprint",
    status: "In Progress",
    start: "2026-01-01", end: "2026-06-30",
    manager: "Priya Nair", budget: 28000, spent: 9200,
    phases: [
      { name: "Phase 1: Brand Positioning", vrl: 1, num: 1, status: "Completed", pct: 100, start: "2026-01-01", end: "2026-02-28" },
      { name: "Phase 2: Client Pipeline Build", vrl: 1, num: 2, status: "In Progress", pct: 55, start: "2026-03-01", end: "2026-05-31" },
    ],
    tasks: [
      { title: "Launch TONE website with portfolio showcase", status: "In Progress", priority: "High", due: "2026-03-25" },
      { title: "Onboard 5 SME clients to eco-brief process", status: "In Progress", priority: "High", due: "2026-04-30" },
      { title: "Develop case study library (3 completed projects)", status: "To Do", priority: "Medium", due: "2026-05-15" },
      { title: "Finalise carbon-neutral print supplier agreements", status: "Done", priority: "Medium", due: "2026-02-20" },
    ],
  },
  "real": {
    name: "REAL Protection — Product Development Sprint",
    status: "In Progress",
    start: "2026-01-15", end: "2026-09-30",
    manager: "James Okafor", budget: 32000, spent: 7800,
    phases: [
      { name: "Phase 1: Material Testing & Validation", vrl: 1, num: 1, status: "In Progress", pct: 70, start: "2026-01-15", end: "2026-04-30" },
      { name: "Phase 2: Prototype Build", vrl: 2, num: 2, status: "Not Started", pct: 0, start: "2026-05-01", end: "2026-09-30" },
    ],
    tasks: [
      { title: "Complete athlete perception trial — second cohort", status: "In Progress", priority: "High", due: "2026-04-15" },
      { title: "Source bio-foam supplier with consistent batch quality", status: "In Progress", priority: "Critical", due: "2026-03-30" },
      { title: "File design patent for fin-box bio-foam junction", status: "To Do", priority: "High", due: "2026-05-01" },
    ],
  },
};

async function seed() {
  const conn = await createConnection(process.env.DATABASE_URL);
  console.log("✓ Connected to database");

  try {
    // ── 1. Financial Snapshots (6 months per venture) ──────────────────────────
    console.log("\n📊 Seeding financial snapshots...");
    const months = ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];

    for (const v of VENTURES) {
      const p = FINANCIAL_PROFILES[v.id];
      for (let i = 0; i < months.length; i++) {
        const growthFactor = Math.pow(1 + p.revenueGrowth / 12, i);
        const revenue = Math.round(p.baseRevenue * growthFactor);
        const target = Math.round(p.baseRevenue * Math.pow(1 + p.revenueGrowth / 12, i + 1));
        const burn = Math.round(p.burnRate * (0.95 + Math.random() * 0.1));
        const runway = Math.round(p.runway - i * 0.3 + Math.random() * 0.5);
        const cac = Math.round(800 + Math.random() * 400);
        const ltv = Math.round(cac * (2.5 + Math.random() * 1.5));

        await conn.execute(
          `INSERT INTO financial_snapshots
           (ventureId, month, revenueActual, revenueTarget, monthlyBurn, cashRunway,
            investmentRaised, investmentTarget, customerAcquisitionCost, customerLifetimeValue,
            ltvCacRatio, retentionRate, churnRate)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [v.id, months[i], revenue, target, burn, runway,
           p.investment, Math.round(p.investment * 1.5), cac, ltv,
           parseFloat((ltv / cac).toFixed(2)),
           parseFloat((0.72 + Math.random() * 0.18).toFixed(2)),
           parseFloat((0.05 + Math.random() * 0.1).toFixed(2))]
        );
      }
      console.log(`  ✓ ${v.name}: 6 months of financial data`);
    }

    // ── 2. ESG Metrics ─────────────────────────────────────────────────────────
    console.log("\n🌿 Seeding ESG metrics...");
    for (const v of VENTURES) {
      const e = ESG_PROFILES[v.id];
      const envScore = e.env;
      const socScore = e.soc;
      const govScore = e.gov;
      const esgScore = parseFloat(((envScore + socScore + govScore) / 3).toFixed(2));

      await conn.execute(
        `INSERT INTO esg_metrics
         (ventureId, carbonEmissionsScore, energyEfficiencyScore, waterManagementScore,
          wasteCircularityScore, biodiversityScore, environmentalScore,
          workerWellbeingScore, diversityInclusionScore, communityEngagementScore,
          supplyChainEthicsScore, socialScore,
          boardTransparencyScore, ethicsAntiCorruptionScore, stakeholderEngagementScore,
          dataPrivacyScore, governanceScore, esgScore, esgFrameworkUsed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          v.id,
          parseFloat((envScore * 0.9 + Math.random() * 0.5).toFixed(1)),
          parseFloat((envScore * 1.05 + Math.random() * 0.3).toFixed(1)),
          parseFloat((envScore * 0.95 + Math.random() * 0.4).toFixed(1)),
          parseFloat((envScore * 1.1 + Math.random() * 0.3).toFixed(1)),
          parseFloat((envScore * 0.85 + Math.random() * 0.5).toFixed(1)),
          envScore,
          parseFloat((socScore * 1.05 + Math.random() * 0.3).toFixed(1)),
          parseFloat((socScore * 0.95 + Math.random() * 0.4).toFixed(1)),
          parseFloat((socScore * 0.9 + Math.random() * 0.5).toFixed(1)),
          parseFloat((socScore * 1.0 + Math.random() * 0.3).toFixed(1)),
          socScore,
          parseFloat((govScore * 1.05 + Math.random() * 0.3).toFixed(1)),
          parseFloat((govScore * 0.95 + Math.random() * 0.4).toFixed(1)),
          parseFloat((govScore * 1.0 + Math.random() * 0.3).toFixed(1)),
          parseFloat((govScore * 0.9 + Math.random() * 0.4).toFixed(1)),
          govScore,
          esgScore,
          e.framework,
        ]
      );
      console.log(`  ✓ ${v.name}: ESG score ${esgScore}/10`);
    }

    // ── 3. IRL Scores ──────────────────────────────────────────────────────────
    console.log("\n🎯 Seeding IRL scores...");
    const IRL_PROFILES = {
      "ecoblend":    { esg: 7.7, lca: 7.2, pcf: 6.8, csr: 7.5, cert: 6.0 },
      "ecoblend-rd": { esg: 8.2, lca: 8.0, pcf: 7.5, csr: 6.5, cert: 5.5 },
      "bebus":       { esg: 7.5, lca: 6.8, pcf: 6.5, csr: 7.8, cert: 6.5 },
      "tone":        { esg: 7.0, lca: 5.5, pcf: 5.8, csr: 7.2, cert: 5.0 },
      "real":        { esg: 6.8, lca: 6.2, pcf: 5.5, csr: 6.5, cert: 4.5 },
      "pipe":        { esg: 6.5, lca: 5.8, pcf: 5.2, csr: 6.0, cert: 4.0 },
    };
    for (const v of VENTURES) {
      const p = IRL_PROFILES[v.id];
      const irl = parseFloat(((p.esg + p.lca + p.pcf + p.csr + p.cert) / 5).toFixed(2));
      const vrlScore = parseFloat((v.vrl * 0.8 + Math.random() * 0.5).toFixed(2));
      const tvis = parseFloat(((irl + vrlScore) / 2).toFixed(2));
      await conn.execute(
        `INSERT INTO irl_scores (ventureId, esgScore, lcaScore, pcfScore, csrScore, certificationScore, irlScore, vrlScore, totalVentureIntelligenceScore)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [v.id, p.esg, p.lca, p.pcf, p.csr, p.cert, irl, vrlScore, tvis]
      );
      console.log(`  ✓ ${v.name}: IRL ${irl}/10`);
    }

    // ── 4. Experiments ─────────────────────────────────────────────────────────
    console.log("\n🔬 Seeding experiments...");
    // Clear existing sparse experiments first
    await conn.execute("DELETE FROM experiments WHERE id > 0");
    for (const v of VENTURES) {
      const exps = EXPERIMENTS_DATA[v.id] || [];
      for (const exp of exps) {
        const conductedAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
        await conn.execute(
          `INSERT INTO experiments (ventureId, title, hypothesis, method, result, outcome, trlLevelJustified, conductedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [v.id, exp.title, exp.hypothesis, exp.method, exp.result, exp.outcome, exp.trl, conductedAt]
        );
      }
      console.log(`  ✓ ${v.name}: ${exps.length} experiments`);
    }

    // ── 5. POI Pipeline ────────────────────────────────────────────────────────
    console.log("\n📦 Seeding POI pipeline...");
    const catIds = [];
    for (const cat of POI_CATEGORIES) {
      const [res] = await conn.execute(
        `INSERT INTO product_categories (name, sector, description) VALUES (?, ?, ?)`,
        [cat.name, cat.sector, cat.description]
      );
      catIds.push(res.insertId);
    }
    console.log(`  ✓ ${catIds.length} product categories created`);

    for (const opp of POI_OPPORTUNITIES) {
      const catId = catIds[opp.category];
      const [oppRes] = await conn.execute(
        `INSERT INTO product_opportunities (name, categoryId, sector, targetMarket, productStage, status, submittedBy)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [opp.name, catId, opp.sector, opp.market, opp.stage, opp.status, "EcoBlend VBS Team"]
      );
      const oppId = oppRes.insertId;

      // Insert assessments if scored
      if (["Scored", "Approved for VRL"].includes(opp.status)) {
        await conn.execute(
          `INSERT INTO cost_assessments (productOpportunityId, manufacturingCostScore, supplyChainCostScore, lifecycleCostScore, costScore)
           VALUES (?, ?, ?, ?, ?)`,
          [oppId, opp.cost, Math.max(1, opp.cost - 1 + Math.round(Math.random())), opp.cost, opp.cost]
        );
        await conn.execute(
          `INSERT INTO performance_assessments (productOpportunityId, technicalCapabilityScore, efficiencyScore, functionalityScore, performanceScore)
           VALUES (?, ?, ?, ?, ?)`,
          [oppId, opp.perf, opp.perf, Math.max(1, opp.perf - 1 + Math.round(Math.random())), opp.perf]
        );
        await conn.execute(
          `INSERT INTO quality_assessments (productOpportunityId, reliabilityScore, durabilityScore, userExperienceScore, qualityScore)
           VALUES (?, ?, ?, ?, ?)`,
          [oppId, opp.qual, opp.qual, Math.max(1, opp.qual - 1 + Math.round(Math.random())), opp.qual]
        );
        await conn.execute(
          `INSERT INTO sustainability_assessments (productOpportunityId, carbonFootprintScore, esgComplianceScore, circularityScore, sustainabilityScore)
           VALUES (?, ?, ?, ?, ?)`,
          [oppId, opp.sust, opp.sust, Math.max(1, opp.sust - 1 + Math.round(Math.random())), opp.sust]
        );
        const pos = parseFloat(((opp.cost + opp.perf + opp.qual + opp.sust) / 4).toFixed(2));
        const band = pos >= 4.5 ? "Exceptional Opportunity" : pos >= 3.5 ? "High Opportunity" : pos >= 2.5 ? "Moderate Opportunity" : "Low Opportunity";
        await conn.execute(
          `INSERT INTO product_opportunity_scores (productOpportunityId, posScore, posClassification, costScore, performanceScore, qualityScore, sustainabilityScore)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [oppId, pos, band, opp.cost, opp.perf, opp.qual, opp.sust]
        );
      }
    }
    console.log(`  ✓ ${POI_OPPORTUNITIES.length} product opportunities seeded`);

    // ── 6. PM Programs ─────────────────────────────────────────────────────────
    console.log("\n📋 Seeding PM programs...");
    for (const [ventureId, prog] of Object.entries(PM_PROGRAMS)) {
      const [progRes] = await conn.execute(
        `INSERT INTO venture_programs (ventureId, name, status, startDate, targetEndDate, programManager, budget, budgetSpent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [ventureId, prog.name, prog.status, prog.start, prog.end, prog.manager, prog.budget, prog.spent]
      );
      const programId = progRes.insertId;

      let firstPhaseId = null;
      for (const phase of prog.phases) {
        const [phaseRes] = await conn.execute(
          `INSERT INTO venture_phases (programId, ventureId, name, vrlStage, phaseNumber, status, startDate, targetEndDate, completionPercent)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [programId, ventureId, phase.name, phase.vrl, phase.num, phase.status, phase.start, phase.end, phase.pct]
        );
        if (firstPhaseId === null) firstPhaseId = phaseRes.insertId;
      }

      // Create a default workstream for the first phase to hold tasks
      const firstPhaseIdToUse = firstPhaseId;
      const [wsRes] = await conn.execute(
        `INSERT INTO venture_workstreams (phaseId, ventureId, name, functionalArea, status, completionPercent)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [firstPhaseId, ventureId, "General Execution", "Operations", "In Progress", 50]
      );
      const workstreamId = wsRes.insertId;

      for (const task of prog.tasks) {
        await conn.execute(
          `INSERT INTO venture_tasks (workstreamId, ventureId, title, kanbanStatus, priority, dueDate)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [workstreamId, ventureId, task.title, task.status, task.priority, task.due]
        );
      }
      console.log(`  ✓ ${ventureId}: 1 program, ${prog.phases.length} phases, 1 workstream, ${prog.tasks.length} tasks`);
    }

    // ── Summary ────────────────────────────────────────────────────────────────
    console.log("\n✅ Seed complete! Command Centre is now populated with:");
    console.log(`  • Financial snapshots: ${VENTURES.length * 6} rows (6 months × ${VENTURES.length} ventures)`);
    console.log(`  • ESG metrics: ${VENTURES.length} venture profiles`);
    console.log(`  • IRL scores: ${VENTURES.length} venture profiles`);
    const totalExps = Object.values(EXPERIMENTS_DATA).reduce((s, e) => s + e.length, 0);
    console.log(`  • Experiments: ${totalExps} entries across all ventures`);
    console.log(`  • POI pipeline: ${POI_OPPORTUNITIES.length} opportunities (${POI_CATEGORIES.length} categories)`);
    console.log(`  • PM programs: ${Object.keys(PM_PROGRAMS).length} programs with phases and tasks`);

  } catch (err) {
    console.error("❌ Seed error:", err.message);
    throw err;
  } finally {
    await conn.end();
  }
}

seed().catch(e => { console.error(e); process.exit(1); });
