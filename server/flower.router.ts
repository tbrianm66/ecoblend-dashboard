/**
 * Sprint 95 — Flower Metrics CSV Export Bridge
 *
 * Generates a Flower-compatible CSV from EcoBlend venture data.
 * Flower's KPI template expects: metric_name, metric_value, metric_unit,
 * category, period, notes
 *
 * Flower docs: https://www.flowermetrics.xyz/documentation
 * Contact: bomi@leaftree.fund
 */

import { z } from "zod";
import { router as createTRPCRouter, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  ventures,
  financialSnapshots,
  founders,
  risks,
  milestones,
  experiments,
  ventureScores,
  flowerExportLog,
} from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

// ── Flower KPI row type ───────────────────────────────────────────────────────
interface FlowerKpiRow {
  metric_name: string;
  metric_value: string | number;
  metric_unit: string;
  category: string;
  period: string;
  notes: string;
}

// ── CSV serialiser ────────────────────────────────────────────────────────────
function escapeCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowsToCsv(rows: FlowerKpiRow[]): string {
  const header = "metric_name,metric_value,metric_unit,category,period,notes";
  const lines = rows.map((r) =>
    [
      escapeCell(r.metric_name),
      escapeCell(r.metric_value),
      escapeCell(r.metric_unit),
      escapeCell(r.category),
      escapeCell(r.period),
      escapeCell(r.notes),
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

// ── VRL level labels ──────────────────────────────────────────────────────────
const VRL_LABELS: Record<number, string> = {
  1: "Opportunity Discovery",
  2: "Concept",
  3: "Validation",
  4: "Prototype",
  5: "Market Validation",
  6: "Product-Market Fit",
  7: "Market Entry",
  8: "Scaling",
  9: "Market Leadership",
};

const TRL_LABELS: Record<number, string> = {
  1: "Basic Research",
  2: "Technology Concept",
  3: "Experimental Proof",
  4: "Lab Validation",
  5: "Relevant Environment",
  6: "Prototype Demo",
  7: "System Prototype",
  8: "System Complete",
  9: "Proven in Operations",
};

// ── Main export builder ───────────────────────────────────────────────────────
async function buildFlowerCsv(
  ventureId: string
): Promise<{ csv: string; rows: FlowerKpiRow[]; snapshotMonth: string | null; rowCount: number }> {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 7); // "2026-04"

  // 1. Load venture
  const [venture] = await db
    .select()
    .from(ventures)
    .where(eq(ventures.id, ventureId))
    .limit(1);

  if (!venture) throw new Error(`Venture ${ventureId} not found`);

  // 2. Load latest financial snapshot
  const [latestFinancial] = await db
    .select()
    .from(financialSnapshots)
    .where(eq(financialSnapshots.ventureId, ventureId))
    .orderBy(desc(financialSnapshots.month))
    .limit(1);

  // 3. Load founders
  const founderList = await db
    .select()
    .from(founders)
    .where(eq(founders.ventureId, ventureId));

  // 4. Load open risks
  const riskList = await db
    .select()
    .from(risks)
    .where(eq(risks.ventureId, ventureId));

  // 5. Load milestones
  const milestoneList = await db
    .select()
    .from(milestones)
    .where(eq(milestones.ventureId, ventureId));

  // 6. Load experiments
  const experimentList = await db
    .select()
    .from(experiments)
    .where(eq(experiments.ventureId, ventureId));

  // 7. Load latest VRL score
  const [latestScore] = await db
    .select()
    .from(ventureScores)
    .where(eq(ventureScores.ventureId, ventureId))
    .orderBy(desc(ventureScores.recordedAt))
    .limit(1);

  const period = latestFinancial?.month ?? today;
  const kpiRows: FlowerKpiRow[] = [];

  // ── SECTION A: Readiness Scores ───────────────────────────────────────────
  const vrlLevel = latestScore?.vrl ?? venture.vrl ?? 1;
  const trlLevel = latestScore?.trl ?? venture.trl ?? 1;
  const vrlPct = latestScore?.vrlPercent ?? venture.vrlPercent ?? 0;
  const trlPct = latestScore?.trlPercent ?? venture.trlPercent ?? 0;

  kpiRows.push({
    metric_name: "VRL Level",
    metric_value: vrlLevel,
    metric_unit: "level (1-9)",
    category: "Readiness",
    period,
    notes: VRL_LABELS[vrlLevel] ?? "",
  });
  kpiRows.push({
    metric_name: "VRL Stage Completion",
    metric_value: vrlPct,
    metric_unit: "%",
    category: "Readiness",
    period,
    notes: `${vrlPct}% through VRL ${vrlLevel} — ${VRL_LABELS[vrlLevel] ?? ""}`,
  });
  kpiRows.push({
    metric_name: "TRL Level",
    metric_value: trlLevel,
    metric_unit: "level (1-9)",
    category: "Readiness",
    period,
    notes: TRL_LABELS[trlLevel] ?? "",
  });
  kpiRows.push({
    metric_name: "TRL Stage Completion",
    metric_value: trlPct,
    metric_unit: "%",
    category: "Readiness",
    period,
    notes: `${trlPct}% through TRL ${trlLevel} — ${TRL_LABELS[trlLevel] ?? ""}`,
  });

  // Lifecycle stage
  kpiRows.push({
    metric_name: "Lifecycle Stage",
    metric_value: venture.lifecycleStage ?? "Opportunity",
    metric_unit: "stage",
    category: "Readiness",
    period,
    notes: "EcoBlend H4 Lean Methodology stage",
  });

  // Strategic classification
  kpiRows.push({
    metric_name: "Strategic Classification",
    metric_value: venture.strategicClassification ?? "Sustaining",
    metric_unit: "type",
    category: "Readiness",
    period,
    notes: "Christensen Innovator's Dilemma framework",
  });

  // Product-market fit signal
  kpiRows.push({
    metric_name: "Product-Market Fit Signal",
    metric_value: venture.productMarketFitSignal ?? "Not Yet",
    metric_unit: "signal",
    category: "Readiness",
    period,
    notes: "Lean Startup engine of growth assessment",
  });

  // ── SECTION B: Financial Metrics ──────────────────────────────────────────
  if (latestFinancial) {
    kpiRows.push({
      metric_name: "Monthly Revenue (Actual)",
      metric_value: latestFinancial.revenueActual ?? 0,
      metric_unit: "GBP",
      category: "Financials",
      period: latestFinancial.month,
      notes: "Actual monthly revenue",
    });
    kpiRows.push({
      metric_name: "Monthly Revenue (Target)",
      metric_value: latestFinancial.revenueTarget ?? 0,
      metric_unit: "GBP",
      category: "Financials",
      period: latestFinancial.month,
      notes: "Target monthly revenue",
    });
    kpiRows.push({
      metric_name: "Revenue Attainment",
      metric_value:
        latestFinancial.revenueTarget && latestFinancial.revenueTarget > 0
          ? Math.round(
              ((latestFinancial.revenueActual ?? 0) /
                latestFinancial.revenueTarget) *
                100
            )
          : 0,
      metric_unit: "%",
      category: "Financials",
      period: latestFinancial.month,
      notes: "Actual / Target revenue %",
    });
    kpiRows.push({
      metric_name: "Monthly Burn Rate",
      metric_value: latestFinancial.monthlyBurn ?? 0,
      metric_unit: "GBP",
      category: "Financials",
      period: latestFinancial.month,
      notes: "Monthly cash burn",
    });
    kpiRows.push({
      metric_name: "Cash Runway",
      metric_value: latestFinancial.cashRunway ?? 0,
      metric_unit: "months",
      category: "Financials",
      period: latestFinancial.month,
      notes: "Months of runway remaining",
    });
    kpiRows.push({
      metric_name: "Investment Raised",
      metric_value: latestFinancial.investmentRaised ?? 0,
      metric_unit: "GBP",
      category: "Financials",
      period: latestFinancial.month,
      notes: "Cumulative investment raised",
    });
    kpiRows.push({
      metric_name: "Investment Target",
      metric_value: latestFinancial.investmentTarget ?? 0,
      metric_unit: "GBP",
      category: "Financials",
      period: latestFinancial.month,
      notes: "Target raise amount",
    });
    kpiRows.push({
      metric_name: "Fundraising Progress",
      metric_value:
        latestFinancial.investmentTarget && latestFinancial.investmentTarget > 0
          ? Math.round(
              ((latestFinancial.investmentRaised ?? 0) /
                latestFinancial.investmentTarget) *
                100
            )
          : 0,
      metric_unit: "%",
      category: "Financials",
      period: latestFinancial.month,
      notes: "Raised / Target investment %",
    });
  }

  // ── SECTION C: Growth Engine Metrics ─────────────────────────────────────
  if (latestFinancial) {
    const engine = venture.engineOfGrowth ?? "Sticky";

    if (engine === "Sticky" || latestFinancial.churnRate != null) {
      kpiRows.push({
        metric_name: "Churn Rate",
        metric_value: latestFinancial.churnRate ?? 0,
        metric_unit: "%/month",
        category: "Growth Metrics",
        period: latestFinancial.month,
        notes: "Sticky engine — % customers lost per month",
      });
      kpiRows.push({
        metric_name: "Retention Rate",
        metric_value: latestFinancial.retentionRate ?? 0,
        metric_unit: "%/month",
        category: "Growth Metrics",
        period: latestFinancial.month,
        notes: "Sticky engine — % customers retained per month",
      });
    }

    if (engine === "Viral" || latestFinancial.viralCoefficient != null) {
      kpiRows.push({
        metric_name: "Viral Coefficient",
        metric_value: latestFinancial.viralCoefficient ?? 0,
        metric_unit: "k-factor",
        category: "Growth Metrics",
        period: latestFinancial.month,
        notes: "Viral engine — avg new users each existing user generates",
      });
      kpiRows.push({
        metric_name: "Referral Rate",
        metric_value: latestFinancial.referralRate ?? 0,
        metric_unit: "%",
        category: "Growth Metrics",
        period: latestFinancial.month,
        notes: "Viral engine — % customers who refer others",
      });
    }

    if (engine === "Paid" || latestFinancial.customerAcquisitionCost != null) {
      kpiRows.push({
        metric_name: "Customer Acquisition Cost (CAC)",
        metric_value: latestFinancial.customerAcquisitionCost ?? 0,
        metric_unit: "GBP",
        category: "Growth Metrics",
        period: latestFinancial.month,
        notes: "Paid engine — cost to acquire one customer",
      });
      kpiRows.push({
        metric_name: "Customer Lifetime Value (LTV)",
        metric_value: latestFinancial.customerLifetimeValue ?? 0,
        metric_unit: "GBP",
        category: "Growth Metrics",
        period: latestFinancial.month,
        notes: "Paid engine — expected revenue per customer",
      });
      kpiRows.push({
        metric_name: "LTV/CAC Ratio",
        metric_value: latestFinancial.ltvCacRatio ?? 0,
        metric_unit: "ratio",
        category: "Growth Metrics",
        period: latestFinancial.month,
        notes: "Paid engine — target >= 3.0",
      });
    }
  }

  // ── SECTION D: Innovation Accounting ─────────────────────────────────────
  const passedExperiments = experimentList.filter(
    (e) => e.outcome === "Pass"
  ).length;
  const completedExperiments = experimentList.filter(
    (e) => e.outcome !== "Pending"
  ).length;
  const experimentPassRate =
    completedExperiments > 0
      ? Math.round((passedExperiments / completedExperiments) * 100)
      : 0;

  kpiRows.push({
    metric_name: "Experiment Pass Rate",
    metric_value: experimentPassRate,
    metric_unit: "%",
    category: "Innovation Accounting",
    period,
    notes: `${passedExperiments} passed / ${completedExperiments} completed experiments`,
  });
  kpiRows.push({
    metric_name: "Total Experiments",
    metric_value: experimentList.length,
    metric_unit: "count",
    category: "Innovation Accounting",
    period,
    notes: "Cumulative experiment count",
  });
  kpiRows.push({
    metric_name: "Learning Velocity",
    metric_value: venture.learningVelocity ?? 0,
    metric_unit: "cycles/30d",
    category: "Innovation Accounting",
    period,
    notes: "Validated learning cycles in last 30 days",
  });
  kpiRows.push({
    metric_name: "Interview Insight Rate",
    metric_value: venture.interviewInsightRate ?? 0,
    metric_unit: "%",
    category: "Innovation Accounting",
    period,
    notes: "% customer interviews yielding validated signal",
  });

  // ── SECTION E: Team Metrics ───────────────────────────────────────────────
  kpiRows.push({
    metric_name: "Founder Count",
    metric_value: founderList.length,
    metric_unit: "count",
    category: "Team",
    period,
    notes: "Number of founders on the venture",
  });

  if (founderList.length > 0) {
    const avgDomainExpertise =
      founderList.reduce((s, f) => s + (f.domainExpertiseScore ?? 0), 0) /
      founderList.length;
    const avgExperience =
      founderList.reduce((s, f) => s + (f.experienceScore ?? 0), 0) /
      founderList.length;
    const avgCommitment =
      founderList.reduce((s, f) => s + (f.commitmentScore ?? 0), 0) /
      founderList.length;

    kpiRows.push({
      metric_name: "Avg Founder Domain Expertise",
      metric_value: Math.round(avgDomainExpertise * 10) / 10,
      metric_unit: "score (0-10)",
      category: "Team",
      period,
      notes: "Average domain expertise score across founders",
    });
    kpiRows.push({
      metric_name: "Avg Founder Experience",
      metric_value: Math.round(avgExperience * 10) / 10,
      metric_unit: "score (0-10)",
      category: "Team",
      period,
      notes: "Average experience score across founders",
    });
    kpiRows.push({
      metric_name: "Avg Founder Commitment",
      metric_value: Math.round(avgCommitment * 10) / 10,
      metric_unit: "score (0-10)",
      category: "Team",
      period,
      notes: "Average commitment score across founders",
    });
  }

  // ── SECTION F: Risk Profile ───────────────────────────────────────────────
  const highRisks = riskList.filter((r) => r.level === "High").length;
  const medRisks = riskList.filter((r) => r.level === "Medium").length;
  const lowRisks = riskList.filter((r) => r.level === "Low").length;

  kpiRows.push({
    metric_name: "Open Risks (Total)",
    metric_value: riskList.length,
    metric_unit: "count",
    category: "Risk",
    period,
    notes: `High: ${highRisks}, Medium: ${medRisks}, Low: ${lowRisks}`,
  });
  kpiRows.push({
    metric_name: "High-Severity Risks",
    metric_value: highRisks,
    metric_unit: "count",
    category: "Risk",
    period,
    notes: "Risks rated High severity",
  });

  // ── SECTION G: Milestone Progress ────────────────────────────────────────
  const completedMilestones = milestoneList.filter((m) => m.completed).length;
  const milestoneCompletionRate =
    milestoneList.length > 0
      ? Math.round((completedMilestones / milestoneList.length) * 100)
      : 0;

  kpiRows.push({
    metric_name: "Milestone Completion Rate",
    metric_value: milestoneCompletionRate,
    metric_unit: "%",
    category: "Execution",
    period,
    notes: `${completedMilestones} of ${milestoneList.length} milestones completed`,
  });
  kpiRows.push({
    metric_name: "Total Milestones",
    metric_value: milestoneList.length,
    metric_unit: "count",
    category: "Execution",
    period,
    notes: "Cumulative milestone count",
  });

  const csv = rowsToCsv(kpiRows);
  return {
    csv,
    rows: kpiRows,
    snapshotMonth: latestFinancial?.month ?? null,
    rowCount: kpiRows.length,
  };
}

// ── tRPC Router ───────────────────────────────────────────────────────────────
export const flowerRouter = createTRPCRouter({
  /**
   * Generate a Flower-compatible CSV for a venture and log the export.
   * Returns the CSV as a string for the client to trigger a download.
   */
  generateCsv: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Build the CSV
      const { csv, rows, snapshotMonth, rowCount } = await buildFlowerCsv(
        input.ventureId
      );

      // Load venture name for the log
      const [venture] = await db
        .select({ name: ventures.name })
        .from(ventures)
        .where(eq(ventures.id, input.ventureId))
        .limit(1);

      // Log the export
      await db.insert(flowerExportLog).values({
        ventureId: input.ventureId,
        ventureName: venture?.name ?? input.ventureId,
        exportedBy: ctx.user.name ?? ctx.user.openId,
        rowCount,
        snapshotMonth,
        includesFinancials: rows.some((r) => r.category === "Financials"),
        includesReadiness: rows.some((r) => r.category === "Readiness"),
        includesGrowthMetrics: rows.some((r) => r.category === "Growth Metrics"),
        status: "Success",
        notes: `${rowCount} KPI rows exported for ${venture?.name ?? input.ventureId}`,
      });

      return {
        csv,
        filename: `flower-export-${input.ventureId}-${snapshotMonth ?? new Date().toISOString().slice(0, 7)}.csv`,
        rowCount,
        snapshotMonth,
        categories: [...new Set(rows.map((r) => r.category))],
      };
    }),

  /**
   * Get export history — all ventures or a specific venture.
   */
  getExportHistory: protectedProcedure
    .input(z.object({ ventureId: z.string().optional(), limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ input }) => {
      const db = getDb();
      const query = db
        .select()
        .from(flowerExportLog)
        .orderBy(desc(flowerExportLog.createdAt))
        .limit(input.limit);

      const results = input.ventureId
        ? await db
            .select()
            .from(flowerExportLog)
            .where(eq(flowerExportLog.ventureId, input.ventureId))
            .orderBy(desc(flowerExportLog.createdAt))
            .limit(input.limit)
        : await query;

      return results;
    }),

  /**
   * Preview the KPI rows that would be exported (without writing to DB).
   * Used to show the user what data will be included before downloading.
   */
  previewExport: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const { rows, snapshotMonth, rowCount } = await buildFlowerCsv(
        input.ventureId
      );
      // Group by category for display
      const grouped: Record<string, typeof rows> = {};
      for (const row of rows) {
        if (!grouped[row.category]) grouped[row.category] = [];
        grouped[row.category].push(row);
      }
      return { grouped, snapshotMonth, rowCount };
    }),
});
