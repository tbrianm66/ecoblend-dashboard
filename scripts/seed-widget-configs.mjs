/**
 * Phase 3D — Seed playbook_widget_configs
 * 7 priority modules × 6 widget types = 42 default rows
 *
 * Safe to run multiple times — uses INSERT IGNORE to avoid duplicates.
 * Unique key: (widget_type, module, page)
 */
import mysql from "mysql2/promise";
import { randomUUID } from "crypto";
import { config } from "dotenv";

config();

const SYSTEM_USER = "system-seed";
const NOW = Date.now();

// ── Module definitions ──────────────────────────────────────────────────────
const MODULES = [
  {
    module: "Venture Intake",
    page: "intake",
    enabled: {
      MissingEvidenceCard: true,
      StageGateApprovalCard: true,
      ScoreImprovementCard: false,
      RDStageGuidanceCard: false,
      InvestmentPackReadinessCard: false,
      RiskMitigationCard: false,
    },
    roleVisibility: {
      MissingEvidenceCard: ["Platform Admin", "Studio Director", "Venture Lead"],
      StageGateApprovalCard: ["Platform Admin", "Studio Director", "Governance"],
      ScoreImprovementCard: ["Platform Admin", "Studio Director", "Venture Lead"],
      RDStageGuidanceCard: ["Platform Admin", "Studio Director", "Technical Lead", "R&D Lead"],
      InvestmentPackReadinessCard: ["Platform Admin", "Studio Director", "Finance Lead"],
      RiskMitigationCard: ["Platform Admin", "Studio Director", "Venture Lead"],
    },
  },
  {
    module: "Discovery & Market Validation",
    page: "discovery",
    enabled: {
      MissingEvidenceCard: true,
      ScoreImprovementCard: true,
      RiskMitigationCard: true,
      RDStageGuidanceCard: false,
      InvestmentPackReadinessCard: false,
      StageGateApprovalCard: false,
    },
    roleVisibility: {
      MissingEvidenceCard: ["Platform Admin", "Studio Director", "Venture Lead"],
      ScoreImprovementCard: ["Platform Admin", "Studio Director", "Venture Lead"],
      RiskMitigationCard: ["Platform Admin", "Studio Director", "Venture Lead"],
      RDStageGuidanceCard: ["Platform Admin", "Studio Director", "Technical Lead", "R&D Lead"],
      InvestmentPackReadinessCard: ["Platform Admin", "Studio Director", "Finance Lead"],
      StageGateApprovalCard: ["Platform Admin", "Studio Director", "Governance"],
    },
  },
  {
    module: "Research & Technical Validation",
    page: "rnd",
    enabled: {
      MissingEvidenceCard: true,
      ScoreImprovementCard: true,
      RDStageGuidanceCard: true,
      RiskMitigationCard: true,
      StageGateApprovalCard: true,
      InvestmentPackReadinessCard: false,
    },
    roleVisibility: {
      MissingEvidenceCard: ["Platform Admin", "Studio Director", "Venture Lead"],
      ScoreImprovementCard: ["Platform Admin", "Studio Director", "Venture Lead"],
      RDStageGuidanceCard: ["Platform Admin", "Studio Director", "Technical Lead", "R&D Lead"],
      RiskMitigationCard: ["Platform Admin", "Studio Director", "Venture Lead"],
      StageGateApprovalCard: ["Platform Admin", "Studio Director", "Governance"],
      InvestmentPackReadinessCard: ["Platform Admin", "Studio Director", "Finance Lead"],
    },
  },
  {
    module: "Risk Intelligence",
    page: "risk",
    enabled: {
      RiskMitigationCard: true,
      MissingEvidenceCard: true,
      ScoreImprovementCard: true,
      RDStageGuidanceCard: false,
      InvestmentPackReadinessCard: false,
      StageGateApprovalCard: false,
    },
    roleVisibility: {
      RiskMitigationCard: ["Platform Admin", "Studio Director", "Venture Lead"],
      MissingEvidenceCard: ["Platform Admin", "Studio Director", "Venture Lead"],
      ScoreImprovementCard: ["Platform Admin", "Studio Director", "Venture Lead"],
      RDStageGuidanceCard: ["Platform Admin", "Studio Director", "Technical Lead", "R&D Lead"],
      InvestmentPackReadinessCard: ["Platform Admin", "Studio Director", "Finance Lead"],
      StageGateApprovalCard: ["Platform Admin", "Studio Director", "Governance"],
    },
  },
  {
    module: "Readiness Scoring",
    page: "scoring",
    enabled: {
      ScoreImprovementCard: true,
      MissingEvidenceCard: true,
      RiskMitigationCard: true,
      RDStageGuidanceCard: false,
      InvestmentPackReadinessCard: false,
      StageGateApprovalCard: false,
    },
    roleVisibility: {
      ScoreImprovementCard: ["Platform Admin", "Studio Director", "Venture Lead"],
      MissingEvidenceCard: ["Platform Admin", "Studio Director", "Venture Lead"],
      RiskMitigationCard: ["Platform Admin", "Studio Director", "Venture Lead"],
      RDStageGuidanceCard: ["Platform Admin", "Studio Director", "Technical Lead", "R&D Lead"],
      InvestmentPackReadinessCard: ["Platform Admin", "Studio Director", "Finance Lead"],
      StageGateApprovalCard: ["Platform Admin", "Studio Director", "Governance"],
    },
  },
  {
    module: "Investment Readiness",
    page: "investment",
    enabled: {
      InvestmentPackReadinessCard: true,
      MissingEvidenceCard: true,
      ScoreImprovementCard: true,
      RiskMitigationCard: true,
      StageGateApprovalCard: true,
      RDStageGuidanceCard: false,
    },
    roleVisibility: {
      InvestmentPackReadinessCard: ["Platform Admin", "Studio Director", "Finance Lead"],
      MissingEvidenceCard: ["Platform Admin", "Studio Director", "Venture Lead"],
      ScoreImprovementCard: ["Platform Admin", "Studio Director", "Venture Lead"],
      RiskMitigationCard: ["Platform Admin", "Studio Director", "Venture Lead"],
      StageGateApprovalCard: ["Platform Admin", "Studio Director", "Governance"],
      RDStageGuidanceCard: ["Platform Admin", "Studio Director", "Technical Lead", "R&D Lead"],
    },
  },
  {
    module: "Governance",
    page: "governance",
    enabled: {
      StageGateApprovalCard: true,
      RiskMitigationCard: true,
      MissingEvidenceCard: true,
      ScoreImprovementCard: true,
      RDStageGuidanceCard: false,
      InvestmentPackReadinessCard: false,
    },
    roleVisibility: {
      StageGateApprovalCard: ["Platform Admin", "Studio Director", "Governance"],
      RiskMitigationCard: ["Platform Admin", "Studio Director", "Venture Lead"],
      MissingEvidenceCard: ["Platform Admin", "Studio Director", "Venture Lead"],
      ScoreImprovementCard: ["Platform Admin", "Studio Director", "Venture Lead"],
      RDStageGuidanceCard: ["Platform Admin", "Studio Director", "Technical Lead", "R&D Lead"],
      InvestmentPackReadinessCard: ["Platform Admin", "Studio Director", "Finance Lead"],
    },
  },
];

const WIDGET_TYPES = [
  "MissingEvidenceCard",
  "ScoreImprovementCard",
  "RDStageGuidanceCard",
  "InvestmentPackReadinessCard",
  "RiskMitigationCard",
  "StageGateApprovalCard",
];

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  let inserted = 0;
  let skipped = 0;

  for (const mod of MODULES) {
    for (const widgetType of WIDGET_TYPES) {
      const enabled = mod.enabled[widgetType] ? 1 : 0;
      const roleVisibility = JSON.stringify(mod.roleVisibility[widgetType] || [
        "Platform Admin",
        "Studio Director",
        "Venture Lead",
      ]);

      try {
        await conn.execute(
          `INSERT IGNORE INTO playbook_widget_configs
            (id, widget_type, module, page, placement, enabled, max_items, display_mode,
             show_completion_status, show_evidence_links, show_score_impact, show_risk_impact,
             role_visibility, min_recommendation_score, created_by, updated_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            randomUUID(),
            widgetType,
            mod.module,
            mod.page,
            "right_side_panel",
            enabled,
            3,             // max_items
            "compact",     // display_mode
            1,             // show_completion_status
            1,             // show_evidence_links
            1,             // show_score_impact
            1,             // show_risk_impact
            roleVisibility,
            50,            // min_recommendation_score
            SYSTEM_USER,
            SYSTEM_USER,
            NOW,
            NOW,
          ]
        );
        inserted++;
      } catch (err) {
        // Unique constraint violation = already seeded
        if (err.code === "ER_DUP_ENTRY") {
          skipped++;
        } else {
          throw err;
        }
      }
    }
  }

  console.log(`✅ Seed complete: ${inserted} rows inserted, ${skipped} already existed.`);
  await conn.end();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
