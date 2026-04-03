/**
 * MRL Scoring Seed — BEBUS-MRL-SCORE-001
 * Inserts 4 canonical demo datasets into scoring_datasets.
 * Idempotent: skips rows that already exist.
 */
import mysql from "mysql2/promise";
import { randomUUID } from "crypto";

const DATASETS = [
  {
    datasetId: "ds-nova-battery",
    name: "NovaBattery",
    sector: "CleanTech",
    description: "Solid-state battery cell for EV applications. Process route defined, dual-source supply partially in place.",
    indicatorScores: { p1:7, p2:6, p3:5, p4:6, p5:4, p6:3, s1:5, s2:3, s3:6, s4:4, s5:2, s6:3, c1:7, c2:5, c3:5, c4:6, c5:4, c6:2, q1:6, q2:7, q3:5, q4:4, q5:5, q6:3, e1:6, e2:5, e3:3, e4:4, e5:3, e6:2 },
    maturityScores: { process:2, supply_chain:1, cost:2, quality:2, sustainability:1 },
    isDemo: true,
    expectedMrlLevel: 4,
    expectedGateLocked: false,
  },
  {
    datasetId: "ds-agrobot-x3",
    name: "AgroBot X3",
    sector: "AgriTech",
    description: "Autonomous weeding robot for smallholder farms. Early-stage; BOM not fully costed, GM% below threshold.",
    indicatorScores: { p1:4, p2:4, p3:2, p4:3, p5:3, p6:2, s1:3, s2:2, s3:4, s4:3, s5:1, s6:2, c1:4, c2:2, c3:3, c4:3, c5:2, c6:1, q1:3, q2:4, q3:2, q4:2, q5:3, q6:2, e1:3, e2:2, e3:1, e4:2, e5:2, e6:1 },
    maturityScores: { process:1, supply_chain:1, cost:0, quality:1, sustainability:0 },
    isDemo: true,
    expectedMrlLevel: 2,
    expectedGateLocked: true,
  },
  {
    datasetId: "ds-medpatch-pro",
    name: "MedPatch Pro",
    sector: "MedTech",
    description: "Transdermal drug delivery patch. ISO 13485 QMS in place, validated supply chain, certified quality evidence.",
    indicatorScores: { p1:8, p2:8, p3:7, p4:7, p5:6, p6:7, s1:8, s2:7, s3:7, s4:8, s5:7, s6:8, c1:7, c2:7, c3:8, c4:7, c5:7, c6:6, q1:9, q2:9, q3:8, q4:7, q5:9, q6:8, e1:6, e2:7, e3:5, e4:5, e5:7, e6:6 },
    maturityScores: { process:3, supply_chain:3, cost:3, quality:4, sustainability:2 },
    isDemo: true,
    expectedMrlLevel: 8,
    expectedGateLocked: false,
  },
  {
    datasetId: "ds-ocean-plastic",
    name: "OceanPlastic",
    sector: "CircularEcon",
    description: "Recycled ocean-plastic composite for consumer packaging. Industrial-scale process, certified supply chain and quality.",
    indicatorScores: { p1:9, p2:9, p3:8, p4:9, p5:8, p6:9, s1:9, s2:9, s3:8, s4:9, s5:8, s6:9, c1:9, c2:8, c3:9, c4:8, c5:8, c6:7, q1:8, q2:9, q3:9, q4:8, q5:9, q6:8, e1:9, e2:9, e3:8, e4:9, e5:8, e6:9 },
    maturityScores: { process:4, supply_chain:4, cost:3, quality:4, sustainability:4 },
    isDemo: true,
    expectedMrlLevel: 9,
    expectedGateLocked: false,
  },
];

async function seed() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  let inserted = 0;
  let skipped = 0;

  for (const ds of DATASETS) {
    const [rows] = await conn.execute(
      "SELECT datasetId FROM scoring_datasets WHERE datasetId = ?",
      [ds.datasetId]
    );
    if (rows.length > 0) {
      console.log(`SKIP (exists): ${ds.name}`);
      skipped++;
      continue;
    }
    await conn.execute(
      `INSERT INTO scoring_datasets
        (datasetId, name, sector, description, indicatorScores, maturityScores, isDemo, expectedMrlLevel, expectedGateLocked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ds.datasetId,
        ds.name,
        ds.sector,
        ds.description,
        JSON.stringify(ds.indicatorScores),
        JSON.stringify(ds.maturityScores),
        ds.isDemo ? 1 : 0,
        ds.expectedMrlLevel,
        ds.expectedGateLocked ? 1 : 0,
      ]
    );
    console.log(`INSERT: ${ds.name} (${ds.sector})`);
    inserted++;
  }

  await conn.end();
  console.log(`\nDone — ${inserted} inserted, ${skipped} skipped.`);
}

seed().catch(err => { console.error(err); process.exit(1); });
