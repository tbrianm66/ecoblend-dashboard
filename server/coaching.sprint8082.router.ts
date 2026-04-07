/**
 * COACHING MODULE V2 — Sprint 80, 81, 82 Extensions
 * Sprint 80: PRL Trend Alerts
 * Sprint 81: Founder Progress Reports
 * Sprint 82: Coach Performance Leaderboard
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  coachingCoaches,
  coachingCommitments,
  coachingSessions,
  coachingPrl,
  coachingAssignments,
  founders,
} from "../drizzle/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { randomUUID } from "crypto";

// ── Sprint 80: PRL Trend Alert Engine ────────────────────────────────────────
export const alertsRouter = router({
  generate: protectedProcedure
    .input(z.object({ founderId: z.number().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { prlTrendAlerts } = await import("../drizzle/schema");
      const allFounders = input.founderId
        ? await db.select().from(founders).where(eq(founders.id, input.founderId))
        : await db.select().from(founders);

      let generated = 0;
      for (const f of allFounders) {
        const prlRows = await db
          .select()
          .from(coachingPrl)
          .where(eq(coachingPrl.founderId, f.id))
          .orderBy(desc(coachingPrl.week))
          .limit(4);

        if (prlRows.length === 0) continue;
        const latest = prlRows[0];
        const prev = prlRows[1];
        const latestScore = parseFloat(latest.score as unknown as string);
        const weekOf = latest.week;

        const existingAlerts = await db
          .select()
          .from(prlTrendAlerts)
          .where(and(eq(prlTrendAlerts.founderId, f.id), eq(prlTrendAlerts.weekOf, weekOf)));
        const existingTypes = new Set(existingAlerts.map((a) => a.alertType));

        type AlertInsert = {
          id: string; founderId: number; ventureId: string | null;
          alertType: "sharp_drop" | "sustained_high" | "first_high_risk" | "recovery";
          severity: "critical" | "warning" | "info";
          message: string; weekOf: Date; prlScore: string; prlDelta: string | null;
        };
        const newAlerts: AlertInsert[] = [];

        // Rule 1: Sharp drop (>10pt WoW decline)
        if (prev && !existingTypes.has("sharp_drop")) {
          const prevScore = parseFloat(prev.score as unknown as string);
          const delta = latestScore - prevScore;
          if (delta <= -10) {
            newAlerts.push({
              id: randomUUID(), founderId: f.id, ventureId: f.ventureId || null,
              alertType: "sharp_drop",
              severity: delta <= -20 ? "critical" : "warning",
              message: `${f.name}'s PRL dropped ${Math.abs(delta).toFixed(1)} points this week (${prevScore.toFixed(0)} → ${latestScore.toFixed(0)}). Immediate coach intervention recommended.`,
              weekOf: weekOf as unknown as Date, prlScore: latestScore.toFixed(2), prlDelta: delta.toFixed(2),
            });
          }
        }

        // Rule 2: Sustained HIGH risk (3+ consecutive weeks)
        if (!existingTypes.has("sustained_high") && prlRows.length >= 3) {
          const last3High = prlRows.slice(0, 3).every((r) => r.riskLevel === "HIGH");
          if (last3High) {
            newAlerts.push({
              id: randomUUID(), founderId: f.id, ventureId: f.ventureId || null,
              alertType: "sustained_high", severity: "critical",
              message: `${f.name} has been in HIGH risk for 3+ consecutive weeks. Escalated coaching review required.`,
              weekOf: weekOf as unknown as Date, prlScore: latestScore.toFixed(2), prlDelta: null,
            });
          }
        }

        // Rule 3: First-time HIGH risk
        if (!existingTypes.has("first_high_risk") && latest.riskLevel === "HIGH" && prlRows.length >= 2) {
          if (prlRows[1].riskLevel !== "HIGH") {
            newAlerts.push({
              id: randomUUID(), founderId: f.id, ventureId: f.ventureId || null,
              alertType: "first_high_risk", severity: "warning",
              message: `${f.name} has entered HIGH risk territory for the first time (PRL: ${latestScore.toFixed(0)}). Schedule a check-in session.`,
              weekOf: weekOf as unknown as Date, prlScore: latestScore.toFixed(2),
              prlDelta: prev ? (latestScore - parseFloat(prev.score as unknown as string)).toFixed(2) : null,
            });
          }
        }

        // Rule 4: Recovery (moved out of HIGH risk)
        if (!existingTypes.has("recovery") && latest.riskLevel !== "HIGH" && prlRows.length >= 2) {
          if (prlRows[1].riskLevel === "HIGH") {
            newAlerts.push({
              id: randomUUID(), founderId: f.id, ventureId: f.ventureId || null,
              alertType: "recovery", severity: "info",
              message: `${f.name} has recovered from HIGH risk to ${latest.riskLevel} (PRL: ${latestScore.toFixed(0)}). Keep momentum going.`,
              weekOf: weekOf as unknown as Date, prlScore: latestScore.toFixed(2),
              prlDelta: prev ? (latestScore - parseFloat(prev.score as unknown as string)).toFixed(2) : null,
            });
          }
        }

        if (newAlerts.length > 0) {
          await db.insert(prlTrendAlerts).values(newAlerts as any);
          generated += newAlerts.length;
        }
      }
      return { generated, foundersScanned: allFounders.length };
    }),

  list: protectedProcedure
    .input(z.object({
      founderId: z.number().optional(),
      unacknowledgedOnly: z.boolean().default(false),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const { prlTrendAlerts } = await import("../drizzle/schema");
      const conditions: ReturnType<typeof eq>[] = [];
      if (input.founderId) conditions.push(eq(prlTrendAlerts.founderId, input.founderId));
      if (input.unacknowledgedOnly) conditions.push(eq(prlTrendAlerts.acknowledged, false));
      return db
        .select()
        .from(prlTrendAlerts)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(prlTrendAlerts.createdAt))
        .limit(input.limit);
    }),

  acknowledge: protectedProcedure
    .input(z.object({ id: z.string(), acknowledgedBy: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { prlTrendAlerts } = await import("../drizzle/schema");
      await db
        .update(prlTrendAlerts)
        .set({ acknowledged: true, acknowledgedAt: new Date(), acknowledgedBy: input.acknowledgedBy || null })
        .where(eq(prlTrendAlerts.id, input.id));
      return { success: true };
    }),

  summary: protectedProcedure.query(async () => {
    const db = getDb();
    const { prlTrendAlerts } = await import("../drizzle/schema");
    const rows = await db
      .select()
      .from(prlTrendAlerts)
      .where(eq(prlTrendAlerts.acknowledged, false))
      .orderBy(desc(prlTrendAlerts.createdAt));
    return {
      total: rows.length,
      critical: rows.filter((r) => r.severity === "critical").length,
      warning: rows.filter((r) => r.severity === "warning").length,
      info: rows.filter((r) => r.severity === "info").length,
      alerts: rows.slice(0, 20),
    };
  }),
});

// ── Sprint 81: Founder Progress Report Router ─────────────────────────────────
export const progressReportsRouter = router({
  generate: protectedProcedure
    .input(z.object({ founderId: z.number(), periodWeeks: z.number().min(1).max(52).default(4) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { founderProgressReports } = await import("../drizzle/schema");

      const [founder] = await db.select().from(founders).where(eq(founders.id, input.founderId)).limit(1);
      if (!founder) throw new Error("Founder not found");

      const periodEnd = new Date();
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - input.periodWeeks * 7);

      const prlHistory = await db
        .select().from(coachingPrl)
        .where(eq(coachingPrl.founderId, input.founderId))
        .orderBy(desc(coachingPrl.week)).limit(input.periodWeeks);

      const commitments = await db.select().from(coachingCommitments)
        .where(eq(coachingCommitments.founderId, input.founderId));
      const totalCommitments = commitments.length;
      const completedCommitments = commitments.filter((c) => c.status === "complete").length;
      const missedCommitments = commitments.filter((c) => c.status === "missed").length;
      const completionRate = totalCommitments > 0 ? (completedCommitments / totalCommitments) * 100 : 0;

      const sessions = await db.select().from(coachingSessions)
        .where(eq(coachingSessions.founderId, input.founderId));
      const sessionCount = sessions.length;

      const currentPrl = prlHistory[0];
      const prlSummary = {
        current: currentPrl ? parseFloat(currentPrl.score as unknown as string) : 0,
        trend: currentPrl?.trend || "stable",
        riskLevel: currentPrl?.riskLevel || "MEDIUM",
        weeksTracked: prlHistory.length,
        avgScore: prlHistory.length > 0
          ? (prlHistory.reduce((sum, r) => sum + parseFloat(r.score as unknown as string), 0) / prlHistory.length).toFixed(1)
          : "0.0",
      };
      const commitmentStats = {
        total: totalCommitments, completed: completedCommitments,
        missed: missedCommitments, completionRate: completionRate.toFixed(1),
      };

      const aiPrompt = `You are an executive coach writing a progress report for a founder in a venture studio.

Founder: ${founder.name} | Venture: ${founder.ventureId}
PRL Score: ${prlSummary.current} (${prlSummary.riskLevel} risk, ${prlSummary.trend} trend)
Avg PRL over ${prlSummary.weeksTracked} weeks: ${prlSummary.avgScore}
Commitments: ${completedCommitments}/${totalCommitments} completed (${completionRate.toFixed(0)}%), ${missedCommitments} missed
Coaching sessions: ${sessionCount}

Write a concise 3-paragraph executive summary covering: (1) overall performance assessment, (2) key strengths and areas of concern, (3) recommended next steps. Be specific, data-driven, and constructive.`;

      let aiNarrative = "";
      try {
        const aiResp = await invokeLLM({ messages: [{ role: "user", content: aiPrompt }] });
        aiNarrative = aiResp.choices?.[0]?.message?.content || "";
      } catch {
        aiNarrative = "AI narrative generation unavailable.";
      }

      const reportHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Progress Report — ${founder.name}</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;color:#1a2332;line-height:1.6}
h1{color:#1a2332;border-bottom:3px solid #51AF37;padding-bottom:8px}h2{color:#3A97D3;margin-top:32px}
.kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:24px 0}
.kpi{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center}
.kpi-value{font-size:2rem;font-weight:700;color:#51AF37}.kpi-label{font-size:0.75rem;text-transform:uppercase;color:#6b7280;letter-spacing:0.05em}
.risk-HIGH{color:#ef4444}.risk-MEDIUM{color:#f59e0b}.risk-LOW{color:#22c55e}
.narrative{background:#f0fdf4;border-left:4px solid #51AF37;padding:20px;border-radius:0 8px 8px 0;margin:24px 0}
.footer{margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:0.75rem;color:#9ca3af}
</style></head><body>
<h1>Founder Progress Report</h1>
<p><strong>Founder:</strong> ${founder.name} &nbsp;|&nbsp; <strong>Venture:</strong> ${founder.ventureId} &nbsp;|&nbsp; <strong>Period:</strong> ${periodStart.toLocaleDateString("en-GB")} – ${periodEnd.toLocaleDateString("en-GB")}</p>
<div class="kpi-grid">
  <div class="kpi"><div class="kpi-value">${prlSummary.current.toFixed(0)}</div><div class="kpi-label">PRL Score</div></div>
  <div class="kpi"><div class="kpi-value" style="color:#3A97D3">${completionRate.toFixed(0)}%</div><div class="kpi-label">Commitment Rate</div></div>
  <div class="kpi"><div class="kpi-value" style="color:#F49C13">${sessionCount}</div><div class="kpi-label">Sessions</div></div>
</div>
<h2>Risk Status</h2>
<p>Current risk level: <strong class="risk-${prlSummary.riskLevel}">${prlSummary.riskLevel}</strong> &nbsp;|&nbsp; Trend: <strong>${prlSummary.trend}</strong> &nbsp;|&nbsp; Avg PRL: <strong>${prlSummary.avgScore}</strong> over ${prlSummary.weeksTracked} weeks</p>
<h2>Commitment Performance</h2>
<p>${completedCommitments} of ${totalCommitments} commitments completed (${completionRate.toFixed(0)}%). ${missedCommitments} missed. ${sessionCount} coaching sessions logged.</p>
<h2>Executive Summary</h2>
<div class="narrative">${aiNarrative.replace(/\n/g, "<br>")}</div>
<div class="footer">Generated by EcoBlend Venture Intelligence OS &nbsp;|&nbsp; ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</div>
</body></html>`;

      const id = randomUUID();
      await db.insert(founderProgressReports).values({
        id, founderId: input.founderId, ventureId: founder.ventureId || null,
        reportHtml, aiNarrative, prlSummary, commitmentStats, sessionCount,
        periodStart: periodStart as unknown as Date,
        periodEnd: periodEnd as unknown as Date,
        status: "ready",
      } as any);

      return { id, founderId: input.founderId, founderName: founder.name, status: "ready", prlSummary, commitmentStats, sessionCount };
    }),

  list: protectedProcedure
    .input(z.object({ founderId: z.number().optional(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = getDb();
      const { founderProgressReports } = await import("../drizzle/schema");
      return db
        .select().from(founderProgressReports)
        .where(input.founderId ? eq(founderProgressReports.founderId, input.founderId) : undefined)
        .orderBy(desc(founderProgressReports.generatedAt)).limit(input.limit);
    }),

  getHtml: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const { founderProgressReports } = await import("../drizzle/schema");
      const [row] = await db.select().from(founderProgressReports)
        .where(eq(founderProgressReports.id, input.id)).limit(1);
      return row || null;
    }),

  markSent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { founderProgressReports } = await import("../drizzle/schema");
      await db.update(founderProgressReports)
        .set({ sentAt: new Date(), status: "sent" })
        .where(eq(founderProgressReports.id, input.id));
      return { success: true };
    }),
});

// ── Sprint 82: Coach Performance Leaderboard Router ───────────────────────────
export const leaderboardRouter = router({
  compute: protectedProcedure
    .input(z.object({ weekOf: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { coachPerformanceSnapshots } = await import("../drizzle/schema");

      const weekDate = input.weekOf ? new Date(input.weekOf) : (() => {
        const d = new Date(); d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - d.getDay() + 1); return d;
      })();

      const allCoaches = await db.select().from(coachingCoaches)
        .where(eq(coachingCoaches.isActive, true));
      const snapshots: Array<typeof coachPerformanceSnapshots.$inferInsert> = [];

      for (const coach of allCoaches) {
        const assignments = await db
          .select().from(coachingAssignments)
          .where(and(
            eq(coachingAssignments.coachId, coach.id),
            sql`${coachingAssignments.endDate} IS NULL`
          ));

        const founderIds = assignments.map((a) => a.founderId);
        const foundersAssigned = founderIds.length;
        if (foundersAssigned === 0) continue;

        const weekStr = weekDate.toISOString().slice(0, 10);
        const sessions = await db.select().from(coachingSessions)
          .where(eq(coachingSessions.coachId, coach.id));
        const sessionCount = sessions.filter((s) => {
          const sd = typeof s.sessionDate === "string"
            ? s.sessionDate
            : (s.sessionDate as Date).toISOString().slice(0, 10);
          return sd >= weekStr;
        }).length;

        let totalDelta = 0; let deltaCount = 0;
        let highRiskFounders = 0; let recoveredFounders = 0;
        let totalCompleted = 0; let totalCommitmentsCount = 0;

        for (const fid of founderIds) {
          const prlRows = await db.select().from(coachingPrl)
            .where(eq(coachingPrl.founderId, fid))
            .orderBy(desc(coachingPrl.week)).limit(2);
          if (prlRows.length >= 2) {
            totalDelta += parseFloat(prlRows[0].score as unknown as string) - parseFloat(prlRows[1].score as unknown as string);
            deltaCount++;
          }
          if (prlRows[0]?.riskLevel === "HIGH") highRiskFounders++;
          if (prlRows.length >= 2 && prlRows[0]?.riskLevel !== "HIGH" && prlRows[1]?.riskLevel === "HIGH") recoveredFounders++;

          const fCommitments = await db.select().from(coachingCommitments)
            .where(eq(coachingCommitments.founderId, fid));
          totalCommitmentsCount += fCommitments.length;
          totalCompleted += fCommitments.filter((c) => c.status === "complete").length;
        }

        const avgPrlImprovement = deltaCount > 0 ? totalDelta / deltaCount : 0;
        const commitmentCompletionRate = totalCommitmentsCount > 0
          ? (totalCompleted / totalCommitmentsCount) * 100 : 0;
        const prlComponent = Math.min(100, Math.max(0, 50 + avgPrlImprovement * 5));
        const sessionComponent = Math.min(100, sessionCount * 25);
        const compositeScore = (prlComponent * 0.40) + (commitmentCompletionRate * 0.35) + (sessionComponent * 0.25);

        snapshots.push({
          id: randomUUID(), coachId: coach.id, weekOf: weekDate as unknown as Date,
          foundersAssigned, sessionCount,
          avgPrlImprovement: avgPrlImprovement.toFixed(2) as unknown as number,
          commitmentCompletionRate: commitmentCompletionRate.toFixed(2) as unknown as number,
          highRiskFounders, recoveredFounders,
          compositeScore: compositeScore.toFixed(2) as unknown as number,
        });
      }

      snapshots.sort((a, b) =>
        parseFloat(b.compositeScore as unknown as string) - parseFloat(a.compositeScore as unknown as string)
      );
      snapshots.forEach((s, i) => { s.rank = i + 1; });

      if (snapshots.length > 0) {
        await db.insert(coachPerformanceSnapshots).values(snapshots as any);
      }
      return { computed: snapshots.length, weekOf: weekDate.toISOString().slice(0, 10) };
    }),

  get: protectedProcedure
    .input(z.object({ weekOf: z.string().optional(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = getDb();
      const { coachPerformanceSnapshots } = await import("../drizzle/schema");
      const rows = await db
        .select().from(coachPerformanceSnapshots)
        .orderBy(asc(coachPerformanceSnapshots.rank), desc(coachPerformanceSnapshots.weekOf))
        .limit(input.limit);
      const coaches = await db.select().from(coachingCoaches);
      return rows.map((r) => ({
        ...r,
        coachName: coaches.find((c) => c.id === r.coachId)?.name ?? "Unknown",
        coachType: coaches.find((c) => c.id === r.coachId)?.type ?? "execution",
      }));
    }),

  trend: protectedProcedure
    .input(z.object({ coachId: z.string(), weeks: z.number().min(1).max(26).default(8) }))
    .query(async ({ input }) => {
      const db = getDb();
      const { coachPerformanceSnapshots } = await import("../drizzle/schema");
      const rows = await db
        .select().from(coachPerformanceSnapshots)
        .where(eq(coachPerformanceSnapshots.coachId, input.coachId))
        .orderBy(desc(coachPerformanceSnapshots.weekOf)).limit(input.weeks);
      return rows.reverse().map((r) => ({
        week: typeof r.weekOf === "string" ? r.weekOf : (r.weekOf as Date).toISOString().slice(0, 10),
        score: parseFloat(r.compositeScore as unknown as string),
        prlImprovement: parseFloat(r.avgPrlImprovement as unknown as string),
        completionRate: parseFloat(r.commitmentCompletionRate as unknown as string),
        rank: r.rank,
      }));
    }),
});
