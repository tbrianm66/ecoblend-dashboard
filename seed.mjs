// Seed script — run with: npx tsx seed.mjs
// (tsx handles TypeScript imports)
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  ventures as venturesTable,
  milestones as milestonesTable,
  risks as risksTable,
  ventureScores as scoresTable,
  opportunities as oppsTable,
  experiments as expsTable,
  financialSnapshots as finTable,
} from "./drizzle/schema.ts";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// ── Venture seed data ─────────────────────────────────────────────────────────
const ventureData = [
  { id: "ecoblend-rd", name: "EcoBlend R&D", tagline: "Central IP & Technology Engine", sector: "Deep Tech / Materials Science", channel: "B2B", status: "Active", vrl: 2, vrlPercent: 75, trl: 4, trlPercent: 60, nominatedCharity: "EcoRace Foundation", charityFocus: "Vulnerable children & adults through technology", founder: "Internal VBS Team", color: "#51AF37", investmentReady: false, isInternalLab: true, lifecycleStage: "Build", description: "The internal R&D laboratory and IP engine of EcoRace Studio.", bmc: "IP licensing fees from portfolio brands; R&D service contracts", mmc: "Technology access for social impact ventures; foundation-linked IP sharing" },
  { id: "ecoblend", name: "EcoBlend", tagline: "Advanced Materials Formulation & Distribution", sector: "Materials Science / Green Chemistry", channel: "B2B", status: "Active", vrl: 2, vrlPercent: 60, trl: 4, trlPercent: 70, nominatedCharity: "EcoRace Foundation", charityFocus: "Sustainable materials access for social enterprises", founder: "TBC — Founder Recruitment Open", color: "#51AF37", investmentReady: false, isInternalLab: false, lifecycleStage: "Validation", description: "EcoBlend is the materials formulation and distribution brand of EcoRace Studio.", bmc: "B2B material supply agreements; formulation licensing; technical consultancy for OEMs", mmc: "Sustainable materials access for social enterprises; circular economy enablement" },
  { id: "bebus", name: "BEBUS", tagline: "Eco-Transport Solutions", sector: "Sustainable Transport", channel: "B2B", status: "Active", vrl: 2, vrlPercent: 40, trl: 3, trlPercent: 80, nominatedCharity: "Clean Mobility Foundation", charityFocus: "Sustainable transport access for underserved communities", founder: "TBC — Founder Recruitment Open", color: "#3A97D3", investmentReady: false, isInternalLab: false, lifecycleStage: "Validation", description: "Tier 1 ingredient brand supplying eco-transport OEMs with advanced material formulations.", bmc: "B2B supply agreements with OEMs; material formulation licences; technical consultancy", mmc: "Clean mobility access for underserved communities; Scope 3 emissions reduction" },
  { id: "tone", name: "TONE", tagline: "Eco-Creative Industry Brand", sector: "Creative Industries / Sustainable Arts", channel: "D2C", status: "Active", vrl: 1, vrlPercent: 90, trl: 2, trlPercent: 50, nominatedCharity: "Arts Access Alliance", charityFocus: "Arts and cultural inclusion for disadvantaged youth", founder: "TBC — Founder Recruitment Open", color: "#F49C13", investmentReady: false, isInternalLab: false, lifecycleStage: "Opportunity", description: "TONE is an eco-creative industry brand delivering sustainable products to the creative sector.", bmc: "D2C product sales; creative subscription model; eco-certification licensing to creative studios", mmc: "Arts access for disadvantaged youth; cultural inclusion through sustainable creative tools" },
  { id: "real", name: "REAL", tagline: "Sports Protection — F1 Science for the Person", sector: "Sports Protection / Performance Tech", channel: "D2C", status: "Pre-Launch", vrl: 1, vrlPercent: 55, trl: 2, trlPercent: 20, nominatedCharity: "Sport for All Foundation", charityFocus: "Sport participation and youth wellbeing", founder: "TBC — Founder Recruitment Open", color: "#ef4444", investmentReady: false, isInternalLab: false, lifecycleStage: "Opportunity", description: "REAL applies Formula 1 materials science to protect the everyday athlete.", bmc: "D2C product sales; B2B supply to sports federations; licensing to sports equipment OEMs", mmc: "Sport participation for underserved youth; injury prevention and wellbeing" },
  { id: "pipe", name: "PIPE", tagline: "Eco-Water Sport & Performance Brand", sector: "Water Sports / Outdoor Performance", channel: "D2C", status: "Pre-Launch", vrl: 1, vrlPercent: 30, trl: 1, trlPercent: 70, nominatedCharity: "Ocean Conservation Trust", charityFocus: "Ocean health, coastal community access to water sports", founder: "TBC — Founder Recruitment Open", color: "#0ea5e9", investmentReady: false, isInternalLab: false, lifecycleStage: "Opportunity", description: "PIPE is an eco-water sport and performance brand for surfers, paddlers, and open-water athletes.", bmc: "D2C product sales; performance gear subscription; eco-certification; B2B supply to surf schools", mmc: "Ocean health and coastal community access; water sport participation for underserved youth" },
];

const milestoneData = [
  { ventureId: "ecoblend-rd", label: "R&D Lab Established", completed: true, targetDate: "Jan 2026", sortOrder: 1 },
  { ventureId: "ecoblend-rd", label: "First IP Asset Registered", completed: true, targetDate: "Feb 2026", sortOrder: 2 },
  { ventureId: "ecoblend-rd", label: "TRL 5 Validation", completed: false, targetDate: "Jun 2026", sortOrder: 3 },
  { ventureId: "ecoblend-rd", label: "First External Licence", completed: false, targetDate: "Sep 2026", sortOrder: 4 },
  { ventureId: "ecoblend", label: "Formulation Portfolio Defined", completed: true, targetDate: "Feb 2026", sortOrder: 1 },
  { ventureId: "ecoblend", label: "First OEM Technical Meeting", completed: true, targetDate: "Mar 2026", sortOrder: 2 },
  { ventureId: "ecoblend", label: "Lab Validation (TRL 5)", completed: false, targetDate: "Jun 2026", sortOrder: 3 },
  { ventureId: "ecoblend", label: "First Supply Agreement Signed", completed: false, targetDate: "Oct 2026", sortOrder: 4 },
  { ventureId: "bebus", label: "Market Research Complete", completed: true, targetDate: "Feb 2026", sortOrder: 1 },
  { ventureId: "bebus", label: "First OEM Interview", completed: true, targetDate: "Mar 2026", sortOrder: 2 },
  { ventureId: "bebus", label: "Proof of Concept (TRL 3)", completed: false, targetDate: "May 2026", sortOrder: 3 },
  { ventureId: "bebus", label: "OEM Pilot Agreement", completed: false, targetDate: "Sep 2026", sortOrder: 4 },
  { ventureId: "tone", label: "BMC / MMC Drafted", completed: true, targetDate: "Feb 2026", sortOrder: 1 },
  { ventureId: "tone", label: "50 Creative Industry Interviews", completed: false, targetDate: "Apr 2026", sortOrder: 2 },
  { ventureId: "tone", label: "Product MVP Launch", completed: false, targetDate: "Jul 2026", sortOrder: 3 },
  { ventureId: "tone", label: "First 100 Customers", completed: false, targetDate: "Sep 2026", sortOrder: 4 },
  { ventureId: "real", label: "Sector Research Complete", completed: true, targetDate: "Mar 2026", sortOrder: 1 },
  { ventureId: "real", label: "Athlete Interviews (25)", completed: false, targetDate: "May 2026", sortOrder: 2 },
  { ventureId: "real", label: "Material Prototype (TRL 3)", completed: false, targetDate: "Aug 2026", sortOrder: 3 },
  { ventureId: "real", label: "CE Certification Pathway Defined", completed: false, targetDate: "Oct 2026", sortOrder: 4 },
  { ventureId: "real", label: "Product MVP Launch", completed: false, targetDate: "Dec 2026", sortOrder: 5 },
  { ventureId: "pipe", label: "Brand Concept Defined", completed: true, targetDate: "Mar 2026", sortOrder: 1 },
  { ventureId: "pipe", label: "Water Sport Market Research", completed: false, targetDate: "Apr 2026", sortOrder: 2 },
  { ventureId: "pipe", label: "50 Athlete Interviews", completed: false, targetDate: "Jun 2026", sortOrder: 3 },
  { ventureId: "pipe", label: "Material Formulation (Water-Resistant TRL 3)", completed: false, targetDate: "Sep 2026", sortOrder: 4 },
  { ventureId: "pipe", label: "Product MVP Launch", completed: false, targetDate: "Feb 2027", sortOrder: 5 },
];

const riskData = [
  { ventureId: "ecoblend-rd", domain: "Technical", level: "Medium", mitigation: "Staged TRL gate reviews with EcoBlend R&D team" },
  { ventureId: "ecoblend-rd", domain: "IP", level: "Low", mitigation: "Centralised IP registry with field-of-use licence agreements" },
  { ventureId: "ecoblend-rd", domain: "People", level: "Medium", mitigation: "Stipend + ESOP for key R&D talent" },
  { ventureId: "ecoblend", domain: "Technical", level: "Medium", mitigation: "R&D lab TRL gating before commercial release" },
  { ventureId: "ecoblend", domain: "Business", level: "Medium", mitigation: "Pilot supply agreement with one OEM before scale" },
  { ventureId: "ecoblend", domain: "Financial", level: "Low", mitigation: "Licensing revenue bridges to first supply contract" },
  { ventureId: "bebus", domain: "Business", level: "Medium", mitigation: "Pilot agreement with one OEM before full commercial launch" },
  { ventureId: "bebus", domain: "Technical", level: "High", mitigation: "EcoBlend R&D to reach TRL 6 before OEM pilot" },
  { ventureId: "bebus", domain: "Financial", level: "Medium", mitigation: "VBS stipend bridges founder to first revenue" },
  { ventureId: "bebus", domain: "Marketing", level: "Low", mitigation: "VBS ingredient brand strategy; OEM co-branding" },
  { ventureId: "tone", domain: "Business", level: "Medium", mitigation: "D2C validation via 50 creative industry interviews before product launch" },
  { ventureId: "tone", domain: "Marketing", level: "High", mitigation: "VBS brand strategy; influencer and creative community seeding" },
  { ventureId: "tone", domain: "Investment", level: "Medium", mitigation: "VBS stipend; B Corp accreditation for ESG investors" },
  { ventureId: "real", domain: "Technical", level: "High", mitigation: "EcoBlend R&D to validate material performance at TRL 5 before launch" },
  { ventureId: "real", domain: "Regulatory", level: "High", mitigation: "CE/EN safety certification pathway mapped from TRL 4 onwards" },
  { ventureId: "real", domain: "Business", level: "Medium", mitigation: "D2C validation via athlete focus groups and sports federation pilots" },
  { ventureId: "real", domain: "People", level: "Low", mitigation: "VBS stipend for founder; ESOP for early team" },
  { ventureId: "pipe", domain: "Technical", level: "Medium", mitigation: "EcoBlend R&D to validate water-resistant and UV-stable formulations at TRL 4" },
  { ventureId: "pipe", domain: "Business", level: "High", mitigation: "D2C validation via 50 water sport athlete interviews before product development" },
  { ventureId: "pipe", domain: "Environmental", level: "Low", mitigation: "Full lifecycle assessment from materials sourcing to end-of-life recycling" },
  { ventureId: "pipe", domain: "Marketing", level: "Medium", mitigation: "Surf and water sport community seeding; ambassador programme with pro athletes" },
];

const financialData = [
  { ventureId: "ecoblend", month: "2026-03", revenueActual: 73000, revenueTarget: 120000, monthlyBurn: 18000, cashRunway: 14, investmentRaised: 280000, investmentTarget: 500000 },
  { ventureId: "bebus",    month: "2026-03", revenueActual: 0,     revenueTarget: 80000,  monthlyBurn: 12000, cashRunway: 8,  investmentRaised: 120000, investmentTarget: 400000 },
  { ventureId: "tone",     month: "2026-03", revenueActual: 2500,  revenueTarget: 60000,  monthlyBurn: 8000,  cashRunway: 5,  investmentRaised: 50000,  investmentTarget: 300000 },
  { ventureId: "real",     month: "2026-03", revenueActual: 14200, revenueTarget: 75000,  monthlyBurn: 9500,  cashRunway: 10, investmentRaised: 95000,  investmentTarget: 350000 },
  { ventureId: "pipe",     month: "2026-03", revenueActual: 0,     revenueTarget: 50000,  monthlyBurn: 5000,  cashRunway: 6,  investmentRaised: 0,      investmentTarget: 250000 },
  { ventureId: "ecoblend-rd", month: "2026-03", revenueActual: 0,  revenueTarget: 0,      monthlyBurn: 22000, cashRunway: 18, investmentRaised: 0,      investmentTarget: 0 },
];

const opportunityData = [
  { title: "Sustainable Packaging for FMCG", problemStatement: "FMCG brands face regulatory pressure to eliminate single-use plastics by 2027. No scalable bio-based alternative exists at competitive price points.", sector: "Packaging / FMCG", marketSizeScore: 9, strategicFitScore: 8, esgAlignmentScore: 9, founderAvailScore: 5, totalScore: 31, status: "Scoring", submittedBy: "EcoRace Studio", notes: "Potential to leverage EcoBlend bio-composite formulations. Requires founder with FMCG supply chain experience." },
  { title: "Eco-Helmet for Cycling & Micro-Mobility", problemStatement: "Cycling helmet market dominated by petroleum-based EPS foam. No premium eco-alternative with equivalent CE certification exists.", sector: "Sports Protection / Micro-Mobility", marketSizeScore: 7, strategicFitScore: 9, esgAlignmentScore: 8, founderAvailScore: 6, totalScore: 30, status: "Approved", submittedBy: "EcoRace Studio", notes: "Strong strategic fit with REAL brand. Could be a sub-brand or product line extension." },
  { title: "Ocean Plastic Reclaim Supply Chain", problemStatement: "Brands want ocean-reclaimed plastic content but supply chain is fragmented and unverified. No certified B2B supply chain exists at scale.", sector: "Circular Economy / Materials", marketSizeScore: 8, strategicFitScore: 7, esgAlignmentScore: 10, founderAvailScore: 4, totalScore: 29, status: "Identified", submittedBy: "EcoRace Studio", notes: "Aligns with PIPE and EcoBlend. Requires partnerships with ocean cleanup organisations." },
];

const experimentData = [
  { ventureId: "ecoblend-rd", title: "Bio-Composite Tensile Strength Test", hypothesis: "PLA/hemp fibre composite at 30% fibre loading will achieve tensile strength ≥ 45 MPa", method: "ISO 527-2 tensile testing on 5 specimens at 23°C, 50% RH", result: "Mean tensile strength 47.3 MPa (SD ±2.1). Hypothesis confirmed.", outcome: "Pass", trlLevelJustified: 4, conductedAt: new Date("2026-02-15") },
  { ventureId: "ecoblend", title: "OEM Material Compatibility Assessment", hypothesis: "EcoBlend bio-composite will meet OEM specification sheet requirements for Tier 1 automotive supplier", method: "Comparative analysis of EcoBlend formulation against OEM spec sheet; 3 OEM technical interviews", result: "2 of 3 OEMs confirmed material is within specification range. 1 OEM requires UV stability improvement.", outcome: "Pass", trlLevelJustified: 4, conductedAt: new Date("2026-03-01") },
  { ventureId: "bebus", title: "Bus Body Panel Weight Reduction Simulation", hypothesis: "Replacing steel body panels with EcoBlend composite reduces panel weight by ≥ 35%", method: "FEA simulation using Altair HyperWorks; material properties from TRL 4 test data", result: "Simulation shows 38% weight reduction. Structural integrity maintained under load case analysis.", outcome: "Pass", trlLevelJustified: 3, conductedAt: new Date("2026-02-28") },
  { ventureId: "pipe", title: "Water Resistance Baseline Test", hypothesis: "EcoBlend bio-composite maintains structural integrity after 72h saltwater immersion", method: "ASTM D570 water absorption test; saltwater immersion at 35g/L NaCl for 72h", result: "Pending — test scheduled for April 2026", outcome: "Pending", trlLevelJustified: 2, conductedAt: null },
];

const scoreHistoryData = [
  { ventureId: "ecoblend", vrl: 1, vrlPercent: 80, trl: 3, trlPercent: 50, notes: "Initial baseline — Jan 2026" },
  { ventureId: "ecoblend", vrl: 2, vrlPercent: 60, trl: 4, trlPercent: 70, notes: "OEM meeting completed — Mar 2026" },
  { ventureId: "bebus",    vrl: 1, vrlPercent: 60, trl: 2, trlPercent: 90, notes: "Initial baseline — Jan 2026" },
  { ventureId: "bebus",    vrl: 2, vrlPercent: 40, trl: 3, trlPercent: 80, notes: "First OEM interview — Mar 2026" },
  { ventureId: "tone",     vrl: 1, vrlPercent: 40, trl: 1, trlPercent: 80, notes: "Initial baseline — Jan 2026" },
  { ventureId: "tone",     vrl: 1, vrlPercent: 90, trl: 2, trlPercent: 50, notes: "BMC/MMC completed — Mar 2026" },
  { ventureId: "real",     vrl: 1, vrlPercent: 20, trl: 1, trlPercent: 50, notes: "Initial baseline — Feb 2026" },
  { ventureId: "real",     vrl: 1, vrlPercent: 55, trl: 2, trlPercent: 20, notes: "Sector research complete — Mar 2026" },
  { ventureId: "pipe",     vrl: 1, vrlPercent: 10, trl: 1, trlPercent: 30, notes: "Brand concept initiated — Mar 2026" },
  { ventureId: "pipe",     vrl: 1, vrlPercent: 30, trl: 1, trlPercent: 70, notes: "Brand concept defined — Mar 2026" },
];

console.log("🌱 Seeding EVIP database...");

console.log("  → Seeding ventures...");
for (const v of ventureData) {
  await db.insert(venturesTable).values(v).onDuplicateKeyUpdate({ set: v });
}

console.log("  → Seeding milestones...");
for (const m of milestoneData) {
  await db.insert(milestonesTable).values(m);
}

console.log("  → Seeding risks...");
for (const r of riskData) {
  await db.insert(risksTable).values(r);
}

console.log("  → Seeding financial snapshots...");
for (const f of financialData) {
  await db.insert(finTable).values(f).onDuplicateKeyUpdate({ set: f });
}

console.log("  → Seeding opportunities...");
for (const o of opportunityData) {
  await db.insert(oppsTable).values(o);
}

console.log("  → Seeding experiments...");
for (const e of experimentData) {
  await db.insert(expsTable).values(e);
}

console.log("  → Seeding venture score history...");
for (const s of scoreHistoryData) {
  await db.insert(scoresTable).values(s);
}

console.log("✅ Seed complete!");
await connection.end();
