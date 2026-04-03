/**
 * SRL Module Seed Script — BEBUS-SRL-DMS-001
 * Seeds: 5 dimension definitions, 44 KPI definitions, weight matrix (5 stages × 5 dims),
 *        5 gate configurations, and per-gate dimension floors.
 *
 * Run: node server/srl.seed.mjs
 */
import mysql from "mysql2/promise";
import { randomUUID } from "crypto";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) throw new Error("DATABASE_URL is required");

const conn = await mysql.createConnection(DB_URL);

// ── 1. Dimension Definitions ──────────────────────────────────────────────────
// Actual columns: id, srlDimDefCode, dimensionName, description, defaultWeight, sortOrder, isActive
console.log("Seeding dimension definitions...");
const DIMENSIONS = [
  { id: randomUUID(), srlDimDefCode: "ENV", dimensionName: "Environmental Impact", description: "Direct and indirect environmental impacts including GHG emissions, energy use, water, and waste.", defaultWeight: 0.22, sortOrder: 1, isActive: true },
  { id: randomUUID(), srlDimDefCode: "LCA", dimensionName: "Lifecycle and Circular Economy Alignment", description: "Product lifecycle assessment, material circularity, and end-of-life management.", defaultWeight: 0.18, sortOrder: 2, isActive: true },
  { id: randomUUID(), srlDimDefCode: "SMF", dimensionName: "Sustainable Manufacturing", description: "Operational sustainability of manufacturing processes and supply chain footprint.", defaultWeight: 0.20, sortOrder: 3, isActive: true },
  { id: randomUUID(), srlDimDefCode: "SOC", dimensionName: "Social Value and Impact", description: "Social impact, labour practices, community engagement, and governance structures.", defaultWeight: 0.20, sortOrder: 4, isActive: true },
  { id: randomUUID(), srlDimDefCode: "ESG", dimensionName: "ESG Governance and Compliance", description: "Formal ESG reporting alignment, certifications, and regulatory compliance.", defaultWeight: 0.20, sortOrder: 5, isActive: true },
];

const dimIdMap = {};
for (const dim of DIMENSIONS) {
  const [existing] = await conn.query("SELECT id FROM srl_dimension_definitions WHERE srlDimDefCode = ?", [dim.srlDimDefCode]);
  if (existing.length > 0) {
    dimIdMap[dim.srlDimDefCode] = existing[0].id;
    console.log(`  ↩ ${dim.srlDimDefCode} already exists`);
  } else {
    await conn.query(
      "INSERT INTO srl_dimension_definitions (id, srlDimDefCode, dimensionName, description, defaultWeight, sortOrder, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [dim.id, dim.srlDimDefCode, dim.dimensionName, dim.description, dim.defaultWeight, dim.sortOrder, dim.isActive ? 1 : 0]
    );
    dimIdMap[dim.srlDimDefCode] = dim.id;
    console.log(`  ✓ ${dim.srlDimDefCode} — ${dim.dimensionName}`);
  }
}

// ── 2. KPI Definitions (44 KPIs) ─────────────────────────────────────────────
// Actual columns: id, dimensionId, kpiCode, kpiName, description, srlKpiDataType, unit,
//   srlNormMethod, normTarget, normMin, normMax, thresholdValue, srlThreshDir,
//   isMandatory, higherIsBetter, sdgTag, griTag, tcfdTag, sasbTag,
//   activatedByTrlLevel, activatedByMrlLevel, effectiveFrom, effectiveTo
console.log("\nSeeding KPI definitions...");
const KPIS = [
  // ENV — Environmental Impact (10 KPIs)
  { kpiCode: "ENV-001", dimCode: "ENV", kpiName: "Scope 1 GHG Emissions", srlKpiDataType: "NUMERIC", unit: "tCO2e/year", isMandatory: true, srlNormMethod: "TARGET_BASED", higherIsBetter: false, griTag: "GRI-305-1", sdgTag: "SDG-13", tcfdTag: "Metrics" },
  { kpiCode: "ENV-002", dimCode: "ENV", kpiName: "Scope 2 GHG Emissions", srlKpiDataType: "NUMERIC", unit: "tCO2e/year", isMandatory: true, srlNormMethod: "TARGET_BASED", higherIsBetter: false, griTag: "GRI-305-2", sdgTag: "SDG-13", tcfdTag: "Metrics" },
  { kpiCode: "ENV-003", dimCode: "ENV", kpiName: "Scope 3 GHG Emissions", srlKpiDataType: "NUMERIC", unit: "tCO2e/year", isMandatory: false, srlNormMethod: "TARGET_BASED", higherIsBetter: false, griTag: "GRI-305-3", sdgTag: "SDG-13", tcfdTag: "Metrics" },
  { kpiCode: "ENV-004", dimCode: "ENV", kpiName: "Renewable Energy Share", srlKpiDataType: "NUMERIC", unit: "%", isMandatory: true, srlNormMethod: "MIN_MAX", normMin: 0, normMax: 100, higherIsBetter: true, griTag: "GRI-302-1", sdgTag: "SDG-7" },
  { kpiCode: "ENV-005", dimCode: "ENV", kpiName: "Total Energy Consumption", srlKpiDataType: "NUMERIC", unit: "MWh/year", isMandatory: true, srlNormMethod: "TARGET_BASED", higherIsBetter: false, griTag: "GRI-302-1", sdgTag: "SDG-7" },
  { kpiCode: "ENV-006", dimCode: "ENV", kpiName: "Water Withdrawal", srlKpiDataType: "NUMERIC", unit: "m³/year", isMandatory: false, srlNormMethod: "TARGET_BASED", higherIsBetter: false, griTag: "GRI-303-1", sdgTag: "SDG-6" },
  { kpiCode: "ENV-007", dimCode: "ENV", kpiName: "Total Waste Generated", srlKpiDataType: "NUMERIC", unit: "tonnes/year", isMandatory: false, srlNormMethod: "TARGET_BASED", higherIsBetter: false, griTag: "GRI-306-3", sdgTag: "SDG-12" },
  { kpiCode: "ENV-008", dimCode: "ENV", kpiName: "Hazardous Waste Diverted", srlKpiDataType: "NUMERIC", unit: "%", isMandatory: false, srlNormMethod: "MIN_MAX", normMin: 0, normMax: 100, higherIsBetter: true, griTag: "GRI-306-4" },
  { kpiCode: "ENV-009", dimCode: "ENV", kpiName: "Land Use & Biodiversity Impact", srlKpiDataType: "NUMERIC", unit: "hectares affected", isMandatory: false, srlNormMethod: "TARGET_BASED", higherIsBetter: false, griTag: "GRI-304-1", sdgTag: "SDG-15" },
  { kpiCode: "ENV-010", dimCode: "ENV", kpiName: "Net Zero Target Committed", srlKpiDataType: "BOOLEAN", unit: "Y/N", isMandatory: true, srlNormMethod: "BINARY", higherIsBetter: true, sdgTag: "SDG-13", tcfdTag: "Strategy" },

  // LCA — Lifecycle and Circular Economy Alignment (9 KPIs)
  { kpiCode: "LCA-001", dimCode: "LCA", kpiName: "Product Carbon Footprint (PCF)", srlKpiDataType: "NUMERIC", unit: "kgCO2e/unit", isMandatory: true, srlNormMethod: "TARGET_BASED", higherIsBetter: false, griTag: "GRI-305-1", sdgTag: "SDG-12" },
  { kpiCode: "LCA-002", dimCode: "LCA", kpiName: "Recycled Material Content", srlKpiDataType: "NUMERIC", unit: "%", isMandatory: true, srlNormMethod: "MIN_MAX", normMin: 0, normMax: 100, higherIsBetter: true, griTag: "GRI-301-2", sdgTag: "SDG-12" },
  { kpiCode: "LCA-003", dimCode: "LCA", kpiName: "Product End-of-Life Recovery Rate", srlKpiDataType: "NUMERIC", unit: "%", isMandatory: true, srlNormMethod: "MIN_MAX", normMin: 0, normMax: 100, higherIsBetter: true, griTag: "GRI-306-2", sdgTag: "SDG-12" },
  { kpiCode: "LCA-004", dimCode: "LCA", kpiName: "Circular Design Score", srlKpiDataType: "NUMERIC", unit: "score 0-100", isMandatory: false, srlNormMethod: "MIN_MAX", normMin: 0, normMax: 100, higherIsBetter: true, sdgTag: "SDG-12" },
  { kpiCode: "LCA-005", dimCode: "LCA", kpiName: "Packaging Recyclability", srlKpiDataType: "NUMERIC", unit: "%", isMandatory: false, srlNormMethod: "MIN_MAX", normMin: 0, normMax: 100, higherIsBetter: true, griTag: "GRI-301-1", sdgTag: "SDG-12" },
  { kpiCode: "LCA-006", dimCode: "LCA", kpiName: "LCA Study Completed", srlKpiDataType: "BOOLEAN", unit: "Y/N", isMandatory: true, srlNormMethod: "BINARY", higherIsBetter: true, sdgTag: "SDG-12" },
  { kpiCode: "LCA-007", dimCode: "LCA", kpiName: "Material Efficiency Ratio", srlKpiDataType: "NUMERIC", unit: "output/input", isMandatory: false, srlNormMethod: "MIN_MAX", normMin: 0, normMax: 2, higherIsBetter: true, sdgTag: "SDG-12" },
  { kpiCode: "LCA-008", dimCode: "LCA", kpiName: "Supplier Sustainability Assessment", srlKpiDataType: "NUMERIC", unit: "% suppliers assessed", isMandatory: false, srlNormMethod: "MIN_MAX", normMin: 0, normMax: 100, higherIsBetter: true, griTag: "GRI-308-1", sdgTag: "SDG-12" },
  { kpiCode: "LCA-009", dimCode: "LCA", kpiName: "Circular Revenue Share", srlKpiDataType: "NUMERIC", unit: "% revenue from circular models", isMandatory: false, srlNormMethod: "MIN_MAX", normMin: 0, normMax: 100, higherIsBetter: true, sdgTag: "SDG-12" },

  // SMF — Sustainable Manufacturing (9 KPIs)
  { kpiCode: "SMF-001", dimCode: "SMF", kpiName: "Manufacturing Energy Intensity", srlKpiDataType: "NUMERIC", unit: "kWh/unit produced", isMandatory: true, srlNormMethod: "TARGET_BASED", higherIsBetter: false, griTag: "GRI-302-3", sdgTag: "SDG-9" },
  { kpiCode: "SMF-002", dimCode: "SMF", kpiName: "Process Waste Rate", srlKpiDataType: "NUMERIC", unit: "%", isMandatory: true, srlNormMethod: "MIN_MAX", normMin: 0, normMax: 100, higherIsBetter: false, griTag: "GRI-306-3", sdgTag: "SDG-12" },
  { kpiCode: "SMF-003", dimCode: "SMF", kpiName: "Supply Chain Emissions (Scope 3 Cat 1)", srlKpiDataType: "NUMERIC", unit: "tCO2e/year", isMandatory: false, srlNormMethod: "TARGET_BASED", higherIsBetter: false, griTag: "GRI-305-3", sdgTag: "SDG-13" },
  { kpiCode: "SMF-004", dimCode: "SMF", kpiName: "Local Sourcing Ratio", srlKpiDataType: "NUMERIC", unit: "% spend local", isMandatory: false, srlNormMethod: "MIN_MAX", normMin: 0, normMax: 100, higherIsBetter: true, griTag: "GRI-204-1", sdgTag: "SDG-8" },
  { kpiCode: "SMF-005", dimCode: "SMF", kpiName: "ISO 14001 Certification", srlKpiDataType: "BOOLEAN", unit: "Y/N", isMandatory: false, srlNormMethod: "BINARY", higherIsBetter: true, sasbTag: "ISO-14001" },
  { kpiCode: "SMF-006", dimCode: "SMF", kpiName: "Water Recycling Rate", srlKpiDataType: "NUMERIC", unit: "%", isMandatory: false, srlNormMethod: "MIN_MAX", normMin: 0, normMax: 100, higherIsBetter: true, griTag: "GRI-303-3", sdgTag: "SDG-6" },
  { kpiCode: "SMF-007", dimCode: "SMF", kpiName: "Emissions Reduction Target Set", srlKpiDataType: "BOOLEAN", unit: "Y/N", isMandatory: true, srlNormMethod: "BINARY", higherIsBetter: true, sdgTag: "SDG-13", tcfdTag: "Strategy" },
  { kpiCode: "SMF-008", dimCode: "SMF", kpiName: "SBTi Target Validated", srlKpiDataType: "BOOLEAN", unit: "Y/N", isMandatory: false, srlNormMethod: "BINARY", higherIsBetter: true, sdgTag: "SDG-13" },
  { kpiCode: "SMF-009", dimCode: "SMF", kpiName: "Operational Carbon Intensity", srlKpiDataType: "NUMERIC", unit: "tCO2e/£M revenue", isMandatory: false, srlNormMethod: "TARGET_BASED", higherIsBetter: false, griTag: "GRI-305-4", sdgTag: "SDG-13" },

  // SOC — Social Value and Impact (8 KPIs)
  { kpiCode: "SOC-001", dimCode: "SOC", kpiName: "Gender Pay Gap", srlKpiDataType: "NUMERIC", unit: "%", isMandatory: true, srlNormMethod: "THRESHOLD", thresholdValue: 5, srlThreshDir: "LTE", higherIsBetter: false, griTag: "GRI-405-2", sdgTag: "SDG-5" },
  { kpiCode: "SOC-002", dimCode: "SOC", kpiName: "Board Diversity (Gender)", srlKpiDataType: "NUMERIC", unit: "% women on board", isMandatory: true, srlNormMethod: "THRESHOLD", thresholdValue: 40, srlThreshDir: "GTE", higherIsBetter: true, griTag: "GRI-405-1", sdgTag: "SDG-5" },
  { kpiCode: "SOC-003", dimCode: "SOC", kpiName: "Employee Health & Safety Incidents", srlKpiDataType: "NUMERIC", unit: "incidents/100 FTE", isMandatory: true, srlNormMethod: "THRESHOLD", thresholdValue: 0, srlThreshDir: "EQ", higherIsBetter: false, griTag: "GRI-403-9", sdgTag: "SDG-8" },
  { kpiCode: "SOC-004", dimCode: "SOC", kpiName: "Living Wage Compliance", srlKpiDataType: "BOOLEAN", unit: "Y/N", isMandatory: true, srlNormMethod: "BINARY", higherIsBetter: true, griTag: "GRI-202-1", sdgTag: "SDG-8" },
  { kpiCode: "SOC-005", dimCode: "SOC", kpiName: "Community Investment", srlKpiDataType: "NUMERIC", unit: "£ per year", isMandatory: false, srlNormMethod: "TARGET_BASED", higherIsBetter: true, griTag: "GRI-413-1", sdgTag: "SDG-11" },
  { kpiCode: "SOC-006", dimCode: "SOC", kpiName: "Employee Turnover Rate", srlKpiDataType: "NUMERIC", unit: "%", isMandatory: false, srlNormMethod: "THRESHOLD", thresholdValue: 15, srlThreshDir: "LTE", higherIsBetter: false, griTag: "GRI-401-1", sdgTag: "SDG-8" },
  { kpiCode: "SOC-007", dimCode: "SOC", kpiName: "Training Hours per Employee", srlKpiDataType: "NUMERIC", unit: "hours/year", isMandatory: false, srlNormMethod: "THRESHOLD", thresholdValue: 20, srlThreshDir: "GTE", higherIsBetter: true, griTag: "GRI-404-1", sdgTag: "SDG-4" },
  { kpiCode: "SOC-008", dimCode: "SOC", kpiName: "Whistleblower Policy Active", srlKpiDataType: "BOOLEAN", unit: "Y/N", isMandatory: false, srlNormMethod: "BINARY", higherIsBetter: true, griTag: "GRI-205-1" },

  // ESG — ESG Governance and Compliance (8 KPIs)
  { kpiCode: "ESG-001", dimCode: "ESG", kpiName: "ESG Report Published", srlKpiDataType: "BOOLEAN", unit: "Y/N", isMandatory: true, srlNormMethod: "BINARY", higherIsBetter: true, griTag: "GRI-2-14" },
  { kpiCode: "ESG-002", dimCode: "ESG", kpiName: "GRI Standards Aligned", srlKpiDataType: "BOOLEAN", unit: "Y/N", isMandatory: true, srlNormMethod: "BINARY", higherIsBetter: true, griTag: "GRI-2-14" },
  { kpiCode: "ESG-003", dimCode: "ESG", kpiName: "TCFD Disclosure Completed", srlKpiDataType: "BOOLEAN", unit: "Y/N", isMandatory: false, srlNormMethod: "BINARY", higherIsBetter: true, tcfdTag: "Governance" },
  { kpiCode: "ESG-004", dimCode: "ESG", kpiName: "B Corp Score", srlKpiDataType: "NUMERIC", unit: "score 0-200", isMandatory: false, srlNormMethod: "MIN_MAX", normMin: 0, normMax: 200, higherIsBetter: true },
  { kpiCode: "ESG-005", dimCode: "ESG", kpiName: "Third-Party ESG Audit", srlKpiDataType: "BOOLEAN", unit: "Y/N", isMandatory: false, srlNormMethod: "BINARY", higherIsBetter: true },
  { kpiCode: "ESG-006", dimCode: "ESG", kpiName: "SDG Alignment Count", srlKpiDataType: "NUMERIC", unit: "count of SDGs addressed", isMandatory: false, srlNormMethod: "MIN_MAX", normMin: 0, normMax: 17, higherIsBetter: true, sdgTag: "Multiple" },
  { kpiCode: "ESG-007", dimCode: "ESG", kpiName: "SASB Sector Standard Adopted", srlKpiDataType: "BOOLEAN", unit: "Y/N", isMandatory: false, srlNormMethod: "BINARY", higherIsBetter: true, sasbTag: "SASB" },
  { kpiCode: "ESG-008", dimCode: "ESG", kpiName: "Regulatory Compliance Breaches", srlKpiDataType: "NUMERIC", unit: "count", isMandatory: true, srlNormMethod: "THRESHOLD", thresholdValue: 0, srlThreshDir: "EQ", higherIsBetter: false, griTag: "GRI-2-27" },
];

for (const kpi of KPIS) {
  const [existing] = await conn.query("SELECT id FROM srl_kpi_definitions WHERE kpiCode = ?", [kpi.kpiCode]);
  if (existing.length > 0) { process.stdout.write("."); continue; }
  const dimId = dimIdMap[kpi.dimCode];
  if (!dimId) { console.warn(`\n  ⚠ No dimensionId for ${kpi.dimCode}`); continue; }
  await conn.query(
    `INSERT INTO srl_kpi_definitions 
     (id, dimensionId, kpiCode, kpiName, srlKpiDataType, unit, isMandatory, srlNormMethod, normMin, normMax, normTarget, thresholdValue, srlThreshDir, higherIsBetter, griTag, sdgTag, tcfdTag, sasbTag, effectiveFrom)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(), dimId, kpi.kpiCode, kpi.kpiName, kpi.srlKpiDataType, kpi.unit ?? null,
      kpi.isMandatory ? 1 : 0, kpi.srlNormMethod,
      kpi.normMin ?? null, kpi.normMax ?? null, kpi.normTarget ?? null,
      kpi.thresholdValue ?? null, kpi.srlThreshDir ?? null,
      kpi.higherIsBetter ? 1 : 0,
      kpi.griTag ?? null, kpi.sdgTag ?? null, kpi.tcfdTag ?? null, kpi.sasbTag ?? null,
      new Date(),
    ]
  );
  process.stdout.write("✓");
}
console.log(`\n  Done: ${KPIS.length} KPIs processed`);

// ── 3. Weight Matrix ──────────────────────────────────────────────────────────
// Actual columns: id, srlWcDimCode, srlWcStage, sectorCode, weightValue, createdBy
console.log("\nSeeding weight matrix...");
const WEIGHT_MATRIX = [
  ["S0", { ENV: 0.15, LCA: 0.10, SMF: 0.20, SOC: 0.30, ESG: 0.25 }],
  ["S1", { ENV: 0.18, LCA: 0.12, SMF: 0.20, SOC: 0.28, ESG: 0.22 }],
  ["S2", { ENV: 0.22, LCA: 0.18, SMF: 0.22, SOC: 0.20, ESG: 0.18 }],
  ["S3", { ENV: 0.25, LCA: 0.20, SMF: 0.22, SOC: 0.18, ESG: 0.15 }],
  ["S4", { ENV: 0.25, LCA: 0.22, SMF: 0.22, SOC: 0.16, ESG: 0.15 }],
];

for (const [stage, weights] of WEIGHT_MATRIX) {
  for (const [dimCode, weight] of Object.entries(weights)) {
    const [existing] = await conn.query(
      "SELECT id FROM srl_weight_configs WHERE srlWcDimCode = ? AND srlWcStage = ? AND sectorCode = 'default'",
      [dimCode, stage]
    );
    if (existing.length > 0) { process.stdout.write("."); continue; }
    await conn.query(
      "INSERT INTO srl_weight_configs (id, srlWcDimCode, srlWcStage, sectorCode, weightValue, createdBy, effectiveFrom) VALUES (?, ?, ?, 'default', ?, 'seed', NOW())",
      [randomUUID(), dimCode, stage, weight]
    );
    process.stdout.write("✓");
  }
}
console.log(`\n  Done: ${WEIGHT_MATRIX.length * 5} weight configs processed`);

// ── 4. Gate Configurations ────────────────────────────────────────────────────
// Actual columns: id, srlGcCode, compositeFloor, srlBlockType, remediationWindowDays
console.log("\nSeeding gate configurations...");
const GATES = [
  { srlGcCode: "G1", compositeFloor: 20.00, srlBlockType: "soft",  remediationWindowDays: 90  },
  { srlGcCode: "G2", compositeFloor: 35.00, srlBlockType: "soft",  remediationWindowDays: 90  },
  { srlGcCode: "G3", compositeFloor: 50.00, srlBlockType: "hard",  remediationWindowDays: 60  },
  { srlGcCode: "G4", compositeFloor: 65.00, srlBlockType: "hard",  remediationWindowDays: 60  },
  { srlGcCode: "G5", compositeFloor: 80.00, srlBlockType: "hard",  remediationWindowDays: 30  },
];

const gateIdMap = {};
for (const gate of GATES) {
  const [existing] = await conn.query("SELECT id FROM srl_gate_configs WHERE srlGcCode = ?", [gate.srlGcCode]);
  if (existing.length > 0) {
    gateIdMap[gate.srlGcCode] = existing[0].id;
    console.log(`  ↩ ${gate.srlGcCode} already exists`);
    continue;
  }
  const id = randomUUID();
  await conn.query(
    "INSERT INTO srl_gate_configs (id, srlGcCode, compositeFloor, srlBlockType, remediationWindowDays, effectiveFrom) VALUES (?, ?, ?, ?, ?, NOW())",
    [id, gate.srlGcCode, gate.compositeFloor, gate.srlBlockType, gate.remediationWindowDays]
  );
  gateIdMap[gate.srlGcCode] = id;
  console.log(`  ✓ ${gate.srlGcCode} — floor: ${gate.compositeFloor} (${gate.srlBlockType})`);
}

// ── 5. Gate Dimension Floors ──────────────────────────────────────────────────
// Actual columns: id, gateConfigId, srlGdfDimCode, floorValue
console.log("\nSeeding gate dimension floors...");
const GATE_FLOORS = [
  ["G1", { ENV: 10, LCA: 10, SMF: 10, SOC: 10, ESG: 10 }],
  ["G2", { ENV: 20, LCA: 15, SMF: 20, SOC: 20, ESG: 20 }],
  ["G3", { ENV: 35, LCA: 30, SMF: 35, SOC: 35, ESG: 35 }],
  ["G4", { ENV: 50, LCA: 45, SMF: 50, SOC: 50, ESG: 50 }],
  ["G5", { ENV: 65, LCA: 60, SMF: 65, SOC: 65, ESG: 65 }],
];

for (const [gateCode, floors] of GATE_FLOORS) {
  const gateConfigId = gateIdMap[gateCode];
  if (!gateConfigId) continue;
  for (const [dimCode, floor] of Object.entries(floors)) {
    const [existing] = await conn.query(
      "SELECT id FROM srl_gate_dimension_floors WHERE gateConfigId = ? AND srlGdfDimCode = ?",
      [gateConfigId, dimCode]
    );
    if (existing.length > 0) { process.stdout.write("."); continue; }
    await conn.query(
      "INSERT INTO srl_gate_dimension_floors (id, gateConfigId, srlGdfDimCode, floorValue) VALUES (?, ?, ?, ?)",
      [randomUUID(), gateConfigId, dimCode, floor]
    );
    process.stdout.write("✓");
  }
}
console.log(`\n  Done: ${GATE_FLOORS.length * 5} gate floors processed`);

await conn.end();
console.log("\n✅ SRL seed complete");
