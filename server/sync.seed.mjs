/**
 * TRL/MRL Sync Engine — Seed Script
 * Seeds the 5 canonical demo scenarios from BEBUS-SYNC-SE-001 spec.
 * Run: node server/sync.seed.mjs
 */

import mysql from "mysql2/promise";
import { randomUUID } from "crypto";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const scenarios = [
  {
    scenarioId:       randomUUID(),
    name:             "Deep Tech Leap",
    sector:           "CleanTech Hardware",
    trl:              7,
    mrl:              4,
    domainSupply:     "0.800",
    domainCost:       "0.700",
    domainCompliance: "0.600",
    history:          JSON.stringify([{ trl: 5, mrl: 4 }, { trl: 6, mrl: 4 }, { trl: 7, mrl: 4 }]),
    isDemo:           true,
  },
  {
    scenarioId:       randomUUID(),
    name:             "Supplier Crisis",
    sector:           "Biotech Device",
    trl:              6,
    mrl:              5,
    domainSupply:     "0.950",
    domainCost:       "0.400",
    domainCompliance: "0.900",
    history:          JSON.stringify([{ trl: 6, mrl: 6 }, { trl: 6, mrl: 5 }, { trl: 6, mrl: 5 }]),
    isDemo:           true,
  },
  {
    scenarioId:       randomUUID(),
    name:             "Aligned Scale-Up",
    sector:           "Advanced Materials",
    trl:              8,
    mrl:              8,
    domainSupply:     "0.300",
    domainCost:       "0.500",
    domainCompliance: "0.400",
    history:          JSON.stringify([{ trl: 7, mrl: 7 }, { trl: 7, mrl: 8 }, { trl: 8, mrl: 8 }]),
    isDemo:           true,
  },
  {
    scenarioId:       randomUUID(),
    name:             "Manufacturing Overshoot",
    sector:           "AgriTech Robotics",
    trl:              4,
    mrl:              7,
    domainSupply:     "0.500",
    domainCost:       "0.850",
    domainCompliance: "0.300",
    history:          JSON.stringify([{ trl: 3, mrl: 5 }, { trl: 4, mrl: 6 }, { trl: 4, mrl: 7 }]),
    isDemo:           true,
  },
  {
    scenarioId:       randomUUID(),
    name:             "Regulatory Pinch",
    sector:           "MedTech Wearable",
    trl:              5,
    mrl:              5,
    domainSupply:     "0.400",
    domainCost:       "0.300",
    domainCompliance: "0.950",
    history:          JSON.stringify([{ trl: 5, mrl: 5 }, { trl: 5, mrl: 5 }, { trl: 5, mrl: 5 }]),
    isDemo:           true,
  },
];

console.log("Seeding sync_scenarios...");

for (const s of scenarios) {
  try {
    await conn.execute(
      `INSERT INTO sync_scenarios
         (scenarioId, name, sector, trl, mrl, domainSupply, domainCost, domainCompliance, history, isDemo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = name`,
      [s.scenarioId, s.name, s.sector, s.trl, s.mrl,
       s.domainSupply, s.domainCost, s.domainCompliance, s.history, s.isDemo]
    );
    console.log(`  ✓ ${s.name} (TRL ${s.trl} / MRL ${s.mrl})`);
  } catch (e) {
    console.error(`  ✗ ${s.name}:`, e.message);
  }
}

await conn.end();
console.log("Done.");
