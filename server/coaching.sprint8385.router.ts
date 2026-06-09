/**
 * COACHING MODULE V2 — Sprint 83-85 Router Extensions
 *
 * Sprint 83: Automated Alert Scheduling — schedule log, manual trigger with audit trail
 * Sprint 84: Progress Report Email Delivery — send to founder via notifyOwner, delivery log
 * Sprint 85: Leaderboard Trend Sparklines — 6-week composite score history, sparkline cache
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  alertScheduleLog,
  reportDeliveryLog,
  coachTrendCache,
  coachPerformanceSnapshots,
  founderProgressReports,
  founders,
  coachingCoaches,
  prlTrendAlerts,
} from "../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { notifyOwner } from "./_core/notification";
import { format, startOfWeek, subWeeks } from "date-fns";

// ── Sprint 83: Alert Scheduling ───────────────────────────────────────────────

export const alertSchedulingRouter = router({
  /**
   * Run the alert engine and log the execution to alert_schedule_log.
   * This is the same engine as alerts.generate but with a persistent audit trail.
   */
  runScheduled: protectedProcedure
    .input(z.object({
      triggeredBy: z.enum(["manual", "scheduled", "api"]).default("manual"),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const startTime = Date.now();
      const weekOf = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const logId = randomUUID();

      try {
        // Scan all founders with PRL data in the last 2 weeks
        const recentPrl = await db.execute(sql`
          SELECT
            p.founderId,
            p.score,
            p.riskLevel,
            p.week,
            LAG(p.score) OVER (PARTITION BY p.founderId ORDER BY p.week) AS prevScore
          FROM coaching_prl p
          WHERE p.week >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
          ORDER BY p.founderId, p.week DESC
        `);

        const rows = recentPrl[0] as Array<{
          founderId: number;
          score: string;
          riskLevel: string;
          week: string;
          prevScore: string | null;
        }>;

        // Deduplicate to latest per founder
        const latestByFounder = new Map<number, typeof rows[0]>();
        for (const row of rows) {
          if (!latestByFounder.has(row.founderId)) {
            latestByFounder.set(row.founderId, row);
          }
        }

        let generated = 0;
        let critical = 0;
        let warning = 0;
        let info = 0;

        for (const [, row] of latestByFounder) {
          const current = parseFloat(row.score);
          const prev = row.prevScore ? parseFloat(row.prevScore) : null;
          const drop = prev !== null ? prev - current : 0;

          let alertType: "sharp_drop" | "first_high_risk" | "sustained_high" | null = null;
          let severity: "critical" | "warning" | "info" = "info";
          let message = "";

          if (drop >= 20) {
            alertType = "sharp_drop";
            severity = "critical";
            message = `Founder #${row.founderId} PRL dropped ${drop.toFixed(1)} pts to ${current.toFixed(1)} — CRITICAL intervention required`;
            critical++;
          } else if (drop >= 10) {
            alertType = "sharp_drop";
            severity = "warning";
            message = `Founder #${row.founderId} PRL dropped ${drop.toFixed(1)} pts to ${current.toFixed(1)} — coach review recommended`;
            warning++;
          } else if (current < 40 && row.riskLevel === "HIGH") {
            alertType = "first_high_risk";
            severity = "warning";
            message = `Founder #${row.founderId} is in HIGH RISK zone (PRL: ${current.toFixed(1)}) — immediate coaching action needed`;
            warning++;
          }

          if (alertType) {
            // Check for duplicate alert this week
            const existing = await db
              .select({ id: prlTrendAlerts.id })
              .from(prlTrendAlerts)
              .where(
                and(
                  eq(prlTrendAlerts.founderId, row.founderId),
                  eq(prlTrendAlerts.weekOf, weekOf),
                  eq(prlTrendAlerts.alertType, alertType)
                )
              )
              .limit(1);

            if (existing.length === 0) {
              await db.insert(prlTrendAlerts).values({
                id: randomUUID(),
                founderId: row.founderId,
                alertType,
                severity,
                message,
                weekOf,
                frlScore: current.toFixed(2),
                prlDelta: (-drop).toFixed(2),
                acknowledged: false,
                createdAt: new Date(),
              });
              generated++;
            }
          }
        }

        const durationMs = Date.now() - startTime;

        // Log the run
        await db.insert(alertScheduleLog).values({
          id: logId,
          triggeredBy: input.triggeredBy,
          foundersScanned: latestByFounder.size,
          alertsGenerated: generated,
          alertsCritical: critical,
          alertsWarning: warning,
          alertsInfo: info,
          durationMs,
          status: "success",
          weekOf,
        });

        return {
          logId,
          foundersScanned: latestByFounder.size,
          alertsGenerated: generated,
          critical,
          warning,
          info,
          durationMs,
          weekOf,
        };
      } catch (err) {
        // Log the failure
        await db.insert(alertScheduleLog).values({
          id: logId,
          triggeredBy: input.triggeredBy,
          foundersScanned: 0,
          alertsGenerated: 0,
          alertsCritical: 0,
          alertsWarning: 0,
          alertsInfo: 0,
          durationMs: Date.now() - startTime,
          status: "failed",
          errorMessage: err instanceof Error ? err.message : String(err),
          weekOf,
        });
        throw err;
      }
    }),

  /** Return the last N schedule run logs */
  getLog: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db
        .select()
        .from(alertScheduleLog)
        .orderBy(desc(alertScheduleLog.triggeredAt))
        .limit(input.limit);
    }),
});

// ── Sprint 84: Progress Report Email Delivery ─────────────────────────────────

export const reportDeliveryRouter = router({
  /**
   * Send a generated progress report to the founder via the notification system.
   * Logs the delivery attempt to report_delivery_log.
   */
  sendToFounder: protectedProcedure
    .input(z.object({
      reportId: z.string(),
      sentBy: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const logId = randomUUID();

      // Fetch the report
      const [report] = await db
        .select()
        .from(founderProgressReports)
        .where(eq(founderProgressReports.id, input.reportId))
        .limit(1);

      if (!report) throw new Error("Report not found");

      // Fetch founder name
      const [founder] = await db
        .select({ name: founders.name, ventureId: founders.ventureId })
        .from(founders)
        .where(eq(founders.id, report.founderId))
        .limit(1);

      const founderName = founder?.name ?? `Founder #${report.founderId}`;
      const period = `${report.periodStart} to ${report.periodEnd}`;

      // Build notification content
      const prlSummary = report.prlSummary as {
        current?: number;
        trend?: string;
        avgScore?: number;
        weeksTracked?: number;
      } | null;

      const commitStats = report.commitmentStats as {
        total?: number;
        completed?: number;
        completionRate?: number;
      } | null;

      const notificationTitle = `Progress Report: ${founderName} — ${period}`;
      const notificationContent = [
        `**Founder:** ${founderName}`,
        `**Period:** ${period}`,
        `**PRL Score:** ${prlSummary?.current?.toFixed(1) ?? "N/A"} (${prlSummary?.trend ?? "no trend"})`,
        `**Avg PRL:** ${prlSummary?.avgScore?.toFixed(1) ?? "N/A"} over ${prlSummary?.weeksTracked ?? 0} weeks`,
        `**Commitment Rate:** ${commitStats?.completionRate?.toFixed(0) ?? "0"}% (${commitStats?.completed ?? 0}/${commitStats?.total ?? 0} completed)`,
        `**Sessions:** ${report.sessionCount}`,
        report.aiNarrative ? `\n**AI Summary:** ${report.aiNarrative}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      let notificationId: string | null = null;
      let status: "sent" | "failed" = "sent";
      let errorMessage: string | null = null;

      try {
        const sent = await notifyOwner({
          title: notificationTitle,
          content: notificationContent,
        });

        if (!sent) {
          status = "failed";
          errorMessage = "Notification service returned false";
        } else {
          notificationId = `notify-${Date.now()}`;
        }
      } catch (err) {
        status = "failed";
        errorMessage = err instanceof Error ? err.message : String(err);
      }

      // Log delivery attempt
      await db.insert(reportDeliveryLog).values({
        id: logId,
        reportId: input.reportId,
        founderId: report.founderId,
        sentBy: input.sentBy ?? "system",
        channel: "notification",
        status,
        errorMessage: errorMessage ?? undefined,
        notificationId: notificationId ?? undefined,
      });

      // Update report status if sent successfully
      if (status === "sent") {
        await db
          .update(founderProgressReports)
          .set({ sentAt: new Date(), status: "sent" })
          .where(eq(founderProgressReports.id, input.reportId));
      }

      return {
        logId,
        status,
        founderName,
        notificationId,
        errorMessage,
      };
    }),

  /** List delivery logs for a given report */
  getDeliveryLog: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(reportDeliveryLog)
        .where(eq(reportDeliveryLog.reportId, input.reportId))
        .orderBy(desc(reportDeliveryLog.sentAt));
    }),

  /** List all reports with their delivery status */
  listWithStatus: publicProcedure
    .input(z.object({
      founderId: z.number().optional(),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const query = db
        .select()
        .from(founderProgressReports)
        .orderBy(desc(founderProgressReports.generatedAt))
        .limit(input.limit);

      if (input.founderId) {
        return db
          .select()
          .from(founderProgressReports)
          .where(eq(founderProgressReports.founderId, input.founderId))
          .orderBy(desc(founderProgressReports.generatedAt))
          .limit(input.limit);
      }

      return query;
    }),
});

// ── Sprint 85: Leaderboard Trend Sparklines ───────────────────────────────────

export const leaderboardTrendRouter = router({
  /**
   * Compute and cache the 6-week sparkline data for all coaches.
   * Returns the updated cache entries.
   */
  computeSparklines: protectedProcedure
    .input(z.object({}))
    .mutation(async () => {
      const db = getDb();

      // Get all distinct coaches from snapshots
      const coaches = await db
        .selectDistinct({
          coachId: coachPerformanceSnapshots.coachId,
        })
        .from(coachPerformanceSnapshots);

      const sixWeeksAgo = format(subWeeks(new Date(), 6), "yyyy-MM-dd");
      let computed = 0;

      for (const { coachId } of coaches) {
        // Get coach name from coaching_coaches
        const [coachRow] = await db
          .select({ name: coachingCoaches.name, coachType: coachingCoaches.coachType })
          .from(coachingCoaches)
          .where(eq(coachingCoaches.id, coachId))
          .limit(1);

        const coachName = coachRow?.name ?? `Coach ${coachId}`;

        // Get last 6 weeks of snapshots
        const history = await db
          .select({
            weekOf: coachPerformanceSnapshots.weekOf,
            compositeScore: coachPerformanceSnapshots.compositeScore,
          })
          .from(coachPerformanceSnapshots)
          .where(
            and(
              eq(coachPerformanceSnapshots.coachId, coachId),
              sql`${coachPerformanceSnapshots.weekOf} >= ${sixWeeksAgo}`
            )
          )
          .orderBy(coachPerformanceSnapshots.weekOf);

        if (history.length === 0) continue;

        const sparklineData = history.map((h) => ({
          week: h.weekOf,
          score: parseFloat(h.compositeScore as unknown as string),
        }));

        const scores = sparklineData.map((d) => d.score);
        const minScore = Math.min(...scores);
        const maxScore = Math.max(...scores);
        const latestScore = scores[scores.length - 1];
        const firstScore = scores[0];
        const trendDirection =
          latestScore > firstScore + 2
            ? "improving"
            : latestScore < firstScore - 2
            ? "declining"
            : "stable";

        // Upsert cache entry
        const existing = await db
          .select({ id: coachTrendCache.id })
          .from(coachTrendCache)
          .where(eq(coachTrendCache.coachId, coachId))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(coachTrendCache)
            .set({
              coachName,
              sparklineData,
              lastUpdated: new Date(),
              weekCount: sparklineData.length,
              minScore: minScore.toFixed(2),
              maxScore: maxScore.toFixed(2),
              latestScore: latestScore.toFixed(2),
              trendDirection,
            })
            .where(eq(coachTrendCache.coachId, coachId));
        } else {
          await db.insert(coachTrendCache).values({
            id: randomUUID(),
            coachId,
            coachName,
            sparklineData,
            lastUpdated: new Date(),
            weekCount: sparklineData.length,
            minScore: minScore.toFixed(2),
            maxScore: maxScore.toFixed(2),
            latestScore: latestScore.toFixed(2),
            trendDirection,
          });
        }
        computed++;
      }

      return { computed, coachesProcessed: coaches.length };
    }),

  /** Get sparkline data for all coaches (or a specific coach) */
  getSparklines: publicProcedure
    .input(z.object({
      coachId: z.string().optional(),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();

      if (input.coachId) {
        return db
          .select()
          .from(coachTrendCache)
          .where(eq(coachTrendCache.coachId, input.coachId))
          .limit(1);
      }

      return db
        .select()
        .from(coachTrendCache)
        .orderBy(desc(coachTrendCache.latestScore))
        .limit(input.limit);
    }),

  /** Get raw 6-week history for a single coach (for detailed view) */
  getCoachHistory: protectedProcedure
    .input(z.object({ coachId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const sixWeeksAgo = format(subWeeks(new Date(), 6), "yyyy-MM-dd");

      return db
        .select()
        .from(coachPerformanceSnapshots)
        .where(
          and(
            eq(coachPerformanceSnapshots.coachId, input.coachId),
            sql`${coachPerformanceSnapshots.weekOf} >= ${sixWeeksAgo}`
          )
        )
        .orderBy(coachPerformanceSnapshots.weekOf);
    }),
});
