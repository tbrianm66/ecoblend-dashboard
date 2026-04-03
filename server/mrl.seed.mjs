// ============================================================
// ECOBLEND OS — MRL SEED SCRIPT
// Populates mrl_level_defs and sample MRL data for existing ventures
// Run: node server/mrl.seed.mjs
// ============================================================

import mysql from "mysql2/promise";
import { randomUUID } from "crypto";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ── MRL Level Definitions ─────────────────────────────────────────────────────
const MRL_LEVELS = [
  {
    level: 1, label: "Concept", trlAlignment: "1-2",
    description: "Manufacturing concepts identified. Basic manufacturing implications understood.",
    keyActivities: ["Identify manufacturing concepts", "Assess basic material availability", "Map initial process options"],
    exitCriteria: ["Manufacturing feasibility confirmed at concept level", "No show-stopper material constraints identified"],
  },
  {
    level: 2, label: "Feasibility", trlAlignment: "2-3",
    description: "Manufacturing concepts defined. Feasibility of manufacturing process established.",
    keyActivities: ["Define manufacturing process concept", "Identify key suppliers", "Estimate rough-order-of-magnitude costs"],
    exitCriteria: ["Process concept documented", "Supplier landscape mapped", "ROM cost estimate produced"],
  },
  {
    level: 3, label: "Process Dev", trlAlignment: "3-4",
    description: "Manufacturing process in development. Key process parameters identified.",
    keyActivities: ["Develop process route", "Identify critical process parameters", "Begin tooling design", "Engage T1 suppliers"],
    exitCriteria: ["Process route documented", "Critical parameters identified and controlled", "T1 supplier shortlist confirmed"],
  },
  {
    level: 4, label: "Pilot Ready", trlAlignment: "4-5",
    description: "Capability to produce prototype in laboratory environment demonstrated.",
    keyActivities: ["Produce prototype units in lab", "Validate process against spec", "Develop quality plan", "Confirm compliance requirements"],
    exitCriteria: ["Prototype units produced to spec", "Process validated in lab", "Quality plan in place"],
  },
  {
    level: 5, label: "Pilot Proven", trlAlignment: "5-6",
    description: "Capability demonstrated in pilot environment. Process validated at small scale.",
    keyActivities: ["Pilot production run completed", "Process capability (Cpk) measured", "Supply chain risk assessment completed", "Cost model validated against actuals"],
    exitCriteria: ["Pilot run completed with yield ≥ 85%", "Cpk ≥ 1.33 on critical parameters", "Supply chain risk score < 60"],
  },
  {
    level: 6, label: "Pre-Series", trlAlignment: "6-7",
    description: "Pre-production units produced. Process demonstrated in production-representative environment.",
    keyActivities: ["Pre-series production run", "PPAP / FMEA completed", "Dual-source suppliers confirmed", "Compliance certifications initiated"],
    exitCriteria: ["Pre-series units meet all specifications", "PPAP approved", "Dual-source strategy in place for T1 components"],
  },
  {
    level: 7, label: "Low-Rate", trlAlignment: "7-8",
    description: "Low-rate initial production (LRIP) demonstrated. Process stable at low volume.",
    keyActivities: ["LRIP production line operational", "OEE measurement established", "Compliance certifications achieved", "Cost model aligned to LRIP actuals"],
    exitCriteria: ["LRIP yield ≥ 92%", "OEE ≥ 65%", "All required certifications achieved"],
  },
  {
    level: 8, label: "Scale-Up", trlAlignment: "8-9",
    description: "Pilot production line operating at target volume. Scale-up to full production underway.",
    keyActivities: ["Scale production line to target volume", "Continuous improvement programme active", "Full supply chain contracted", "LCSA baseline established"],
    exitCriteria: ["Production at ≥ 70% of target volume", "OEE ≥ 75%", "LCSA baseline documented"],
  },
  {
    level: 9, label: "Industrial", trlAlignment: "9",
    description: "Full industrial-scale production achieved. Process mature, stable, and continuously improving.",
    keyActivities: ["Full-rate production at target volume", "Lean/Six Sigma programme active", "Carbon intensity target achieved", "Supply chain fully resilient"],
    exitCriteria: ["Production at 100% of target volume", "OEE ≥ 85%", "Carbon intensity target met", "Zero critical single-source dependencies"],
  },
];

// ── Seed Level Definitions ────────────────────────────────────────────────────
console.log("Seeding mrl_level_defs...");
for (const def of MRL_LEVELS) {
  await conn.execute(
    `INSERT INTO mrl_level_defs (level, label, trlAlignment, description, keyActivities, exitCriteria, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       label = VALUES(label),
       trlAlignment = VALUES(trlAlignment),
       description = VALUES(description),
       keyActivities = VALUES(keyActivities),
       exitCriteria = VALUES(exitCriteria)`,
    [def.level, def.label, def.trlAlignment, def.description, JSON.stringify(def.keyActivities), JSON.stringify(def.exitCriteria)]
  );
}
console.log(`  ✓ ${MRL_LEVELS.length} MRL level definitions seeded`);

// ── Get existing ventures ─────────────────────────────────────────────────────
const [ventures] = await conn.execute("SELECT id, name, trl FROM ventures LIMIT 20");
if (!ventures.length) {
  console.log("No ventures found — skipping sample MRL assessment seeding.");
  await conn.end();
  process.exit(0);
}

// ── Seed Sample MRL Assessments ───────────────────────────────────────────────
console.log(`\nSeeding sample MRL assessments for ${ventures.length} ventures...`);

for (const venture of ventures) {
  // Check if assessment already exists
  const [existing] = await conn.execute(
    "SELECT id FROM mrl_assessments WHERE ventureId = ? LIMIT 1",
    [venture.id]
  );
  if (existing.length > 0) {
    console.log(`  ↷ ${venture.name}: assessment already exists, skipping`);
    continue;
  }

  const trl = venture.trl || 3;
  // Derive MRL level from TRL (MRL typically lags TRL by 1–2 levels)
  const mrlLevel = Math.max(1, Math.min(9, trl - 1));
  const mrlDef = MRL_LEVELS[mrlLevel - 1];

  // Subsystem scores — vary by MRL level
  const base = mrlLevel * 10;
  const pdeScore = Math.min(100, base + Math.floor(Math.random() * 10));
  const scieScore = Math.min(100, base - 5 + Math.floor(Math.random() * 15));
  const csmScore = Math.min(100, base + Math.floor(Math.random() * 12));
  const qceScore = Math.min(100, base - 3 + Math.floor(Math.random() * 10));
  const silScore = Math.min(100, base - 8 + Math.floor(Math.random() * 12));
  const compositeScore = Math.round((pdeScore + scieScore + csmScore + qceScore + silScore) / 5);

  const vrlContribution = parseFloat((((mrlLevel - 1) / 8) * 100 * 0.30).toFixed(2));
  const riskScore = mrlLevel <= 3 ? 65 : mrlLevel <= 5 ? 45 : 25;
  const riskRag = riskScore > 60 ? "RED" : riskScore > 30 ? "AMBER" : "GREEN";
  const region = mrlLevel <= 2 ? "UK" : mrlLevel <= 5 ? "HYBRID" : "CN";

  const assessmentId = randomUUID();

  await conn.execute(
    `INSERT INTO mrl_assessments
      (id, ventureId, mrlLevel, mrlLabel, trlLevel, pdeScore, scieScore, csmScore, qceScore, silScore,
       compositeScore, vrlContribution, riskScoreOverall, mrlRiskRag, mrlRegion, assessedBy, assessedAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
    [assessmentId, venture.id, mrlLevel, mrlDef.label, trl,
     pdeScore, scieScore, csmScore, qceScore, silScore,
     compositeScore, vrlContribution, riskScore, riskRag, region, "System Seed"]
  );

  // ── Seed a sample supplier ────────────────────────────────────────────────
  await conn.execute(
    `INSERT INTO mrl_suppliers
      (id, ventureId, name, mrlSupplierTier, country, mrlSupplierRegion, category, riskScore, mrlScieRag, isSingleSource, hasDualSource,
       leadTimeWeeks, moqUnits, mrlFxExposure, mrlGeoRisk, mrlAuditStatus, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [randomUUID(), venture.id, "Shenzhen EcoTech Components Ltd", "T1", "China", "CN",
     "Electronics", 55, "AMBER", true, false, 10, 500, "MED", "MED", "Not Audited"]
  );

  // ── Seed a sample compliance record ──────────────────────────────────────
  await conn.execute(
    `INSERT INTO mrl_compliance_records
      (id, ventureId, assessmentId, standard, market, mrlComplianceCat, mrlComplianceStatus, estimatedCostGbp, estimatedWeeks, isOnCriticalPath, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [randomUUID(), venture.id, assessmentId, "CE Marking", "EU", "Product Safety", "Not Started", 8500, 24, true]
  );

  // ── Seed a sample LCSA record ─────────────────────────────────────────────
  const carbonPerUnit = parseFloat((12.5 - mrlLevel * 0.8 + Math.random() * 2).toFixed(2));
  await conn.execute(
    `INSERT INTO mrl_lcsa_records
      (id, ventureId, assessmentId, carbonScope1, carbonScope2, carbonScope3, carbonIntensityPerUnit,
       lcsaScore, circularityIndex, socialRiskIndex, mrlCbamExposure, silScore, recordedAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
    [randomUUID(), venture.id, assessmentId, 2.1, 4.3, carbonPerUnit,
     carbonPerUnit, silScore, parseFloat((mrlLevel * 0.08).toFixed(2)),
     mrlLevel <= 4 ? 65 : 35, mrlLevel >= 5 ? "Medium" : "None", silScore]
  );

  // ── Seed a sample risk register entry ────────────────────────────────────
  const ragVal = mrlLevel <= 3 ? "R" : "A";
  const prob = mrlLevel <= 3 ? 70 : 45;
  const impact = 80;
  const riskItemScore = Math.min(100, Math.round(((ragVal === "R" ? 3 : 2) * prob * impact) / 300));
  await conn.execute(
    `INSERT INTO mrl_risk_register
      (id, ventureId, assessmentId, mrlRiskCat, description, mrlRag, probability, impact, riskScore, mrlRiskPriority, mitigationAction, mrlRiskStatus, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [randomUUID(), venture.id, assessmentId, "Supply Chain",
     "Single-source CN supplier dependency for critical BOM components",
     ragVal, prob, impact, riskItemScore, "HIGH",
     "Identify and qualify dual-source supplier within 90 days", "Open"]
  );

  console.log(`  ✓ ${venture.name}: MRL ${mrlLevel} (${mrlDef.label}), composite ${compositeScore}, region ${region}`);
}

console.log("\nMRL seed complete.");
await conn.end();
