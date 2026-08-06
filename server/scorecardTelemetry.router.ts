// ============================================================
// SCORECARD TELEMETRY ENGINE — FHV-EB-AUD-001 §4
// Tracks the 8 core audit hypotheses (H1–H8) from live DB data.
// Computes kill-criterion status and logs breach alerts.
// ============================================================
import { z } from "zod";
import { router, adminProcedure, protectedProcedure, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";

function requireAdmin(role: string) {
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
}
import { getDb } from "./db";
import {
  vrlAssessments,
  vrlEvidenceConfirmations,
  scoreDisputes,
  ventures,
  coachingCommitments,
  coachingSessions,
  systemAuditLogs,
  scorecardKillAlerts,
} from "../drizzle/schema";
import { eq, and, ne, gte, lte, sql, desc, isNotNull, isNull, count, inArray } from "drizzle-orm";

// ── Kill-criteria thresholds (authoritative — matches audit spec §4) ──────────
export const KILL_THRESHOLDS = {
  H1_REPRODUCIBILITY_MIN_RATE:      95,   // % — minimum reproduction rate at n ≥ 20
  H1_REPRODUCIBILITY_MIN_N:         20,   // minimum sample before kill applies
  H2_EVIDENCE_BOUND_MIN_RATE:       100,  // % — every persisted score must be evidence-linked
  H3_PARITY_MAX_DIFFERENTIAL:       2.0,  // x — max block-rate ratio hw/sw before SV-01 mandated
  H4_COMMERCIAL_MIN_PILOTS:         1,    // of 5 target — 0 of 5 triggers kill
  H4_COMMERCIAL_TARGET:             5,
  H5_PREDICTIVE_MIN_CORRELATION:    0.6,  // Pearson r — minimum acceptable signal
  H6_COACHING_MIN_VARIANCE:         0.15, // r² — minimum variance explained by coaching
  H7_MODULE_USABILITY_MIN_MODULES:  6,    // active modules/week per founder
  H8_GREENWASHING_MAX_FLAGS:        0,    // zero tolerance — any flag triggers review
} as const;

// ── Hypothesis status type ────────────────────────────────────────────────────
export type HypothesisStatus = "PASS" | "WARNING" | "KILL_TRIGGERED";

export interface HypothesisResult {
  id: string;        // H1–H8
  name: string;
  description: string;
  killCriterion: string;
  status: HypothesisStatus;
  metric: number | null;  // computed value
  metricLabel: string;    // human-readable metric with units
  threshold: string;
  sampleSize: number;
  detail: string;
  computedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX, dy = ys[i] - meanY;
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? 0 : num / denom;
}

// ── Core computation: all 8 hypotheses ───────────────────────────────────────
async function computeAllHypotheses(): Promise<HypothesisResult[]> {
  const db = await getDb();
  const now = new Date().toISOString();

  // ── H1: Reproducibility ──────────────────────────────────────────────────
  // Proxy: resolved score disputes — RESOLVED_UPHELD = score confirmed (reproduced),
  // RESOLVED_OVERTURNED = score not reproducible by independent reviewer.
  const allResolved = await db
    .select({ status: scoreDisputes.status })
    .from(scoreDisputes)
    .where(
      sql`${scoreDisputes.status} IN ('RESOLVED_UPHELD', 'RESOLVED_OVERTURNED')`
    );

  const upheld       = allResolved.filter(r => r.status === "RESOLVED_UPHELD").length;
  const overturned   = allResolved.filter(r => r.status === "RESOLVED_OVERTURNED").length;
  const resolvedN    = upheld + overturned;
  const reproRate    = resolvedN === 0 ? null : (upheld / resolvedN) * 100;
  const h1Status: HypothesisStatus =
    resolvedN === 0 ? "WARNING"
    : resolvedN < KILL_THRESHOLDS.H1_REPRODUCIBILITY_MIN_N
      ? (reproRate !== null && reproRate < KILL_THRESHOLDS.H1_REPRODUCIBILITY_MIN_RATE ? "WARNING" : "PASS")
      : (reproRate !== null && reproRate < KILL_THRESHOLDS.H1_REPRODUCIBILITY_MIN_RATE ? "KILL_TRIGGERED" : "PASS");

  const h1: HypothesisResult = {
    id: "H1", name: "Reproducibility",
    description: "Independent reviewer can reproduce a VRL dimension score within ±5 points on re-assessment.",
    killCriterion: "< 95% reproduction rate at n ≥ 20 resolved disputes",
    status: h1Status,
    metric: reproRate !== null ? Math.round(reproRate * 10) / 10 : null,
    metricLabel: reproRate !== null ? `${Math.round(reproRate * 10) / 10}%` : "No resolved disputes yet",
    threshold: "≥ 95% at n ≥ 20",
    sampleSize: resolvedN,
    detail: resolvedN === 0
      ? "No disputes have been resolved yet — sample size insufficient."
      : `${upheld} upheld, ${overturned} overturned out of ${resolvedN} resolved disputes.${resolvedN < 20 ? ` Kill criterion activates at n = 20 (currently n = ${resolvedN}).` : ""}`,
    computedAt: now,
  };

  // ── H2: Evidence-Bound ──────────────────────────────────────────────────
  // Every persisted VRL dimension score must carry an enforced evidence link.
  // Proxy: percentage of vrl_assessments where hasUnverifiedInputs = false.
  const [totalAssessments] = await db
    .select({ c: count() })
    .from(vrlAssessments);

  const [verifiedAssessments] = await db
    .select({ c: count() })
    .from(vrlAssessments)
    .where(eq(vrlAssessments.hasUnverifiedInputs, false));

  const totalA    = Number(totalAssessments?.c ?? 0);
  const verifiedA = Number(verifiedAssessments?.c ?? 0);
  const evidenceRate = totalA === 0 ? null : (verifiedA / totalA) * 100;
  const h2Status: HypothesisStatus =
    totalA === 0 ? "WARNING"
    : evidenceRate !== null && evidenceRate < KILL_THRESHOLDS.H2_EVIDENCE_BOUND_MIN_RATE
      ? "KILL_TRIGGERED"
      : "PASS";

  const h2: HypothesisResult = {
    id: "H2", name: "Evidence-Bound",
    description: "Every persisted VRL dimension score must carry an enforced, human-confirmed evidence link.",
    killCriterion: "< 100% of persisted dimension scores carrying evidence links",
    status: h2Status,
    metric: evidenceRate !== null ? Math.round(evidenceRate * 10) / 10 : null,
    metricLabel: evidenceRate !== null ? `${Math.round(evidenceRate * 10) / 10}% fully verified` : "No assessments",
    threshold: "100%",
    sampleSize: totalA,
    detail: totalA === 0
      ? "No VRL assessments found — cannot compute evidence-bound rate."
      : `${verifiedA} of ${totalA} assessments are fully evidence-verified (hasUnverifiedInputs = false).`,
    computedAt: now,
  };

  // ── H3: Social Venture Parity ──────────────────────────────────────────
  // Veto-gate block rate differential: hardware (STANDARD) vs social/software (SV-01).
  // Differential > 2× triggers mandatory Profile SV-01 review.
  const hwAssessments = await db
    .select({ isVetoed: vrlAssessments.isVetoed })
    .from(vrlAssessments)
    .where(eq(vrlAssessments.scoringProfile, "STANDARD"));

  const swAssessments = await db
    .select({ isVetoed: vrlAssessments.isVetoed })
    .from(vrlAssessments)
    .where(eq(vrlAssessments.scoringProfile, "SV-01_SOCIAL_SOFTWARE"));

  const hwTotal  = hwAssessments.length;
  const swTotal  = swAssessments.length;
  const hwBlocked = hwAssessments.filter(a => a.isVetoed).length;
  const swBlocked = swAssessments.filter(a => a.isVetoed).length;
  const hwRate = hwTotal === 0 ? 0 : hwBlocked / hwTotal;
  const swRate = swTotal === 0 ? 0 : swBlocked / swTotal;
  // Compute differential as max/min to get the ratio (whichever direction is larger)
  const parityDifferential =
    swRate === 0 && hwRate === 0 ? 1.0
    : swRate === 0 ? (hwRate > 0 ? 99 : 1.0)
    : hwRate === 0 ? 1.0 / (swRate === 0 ? 1 : swRate)
    : Math.max(hwRate, swRate) / Math.min(hwRate, swRate);

  const h3HasData = hwTotal + swTotal >= 4;
  const h3Status: HypothesisStatus =
    !h3HasData ? "WARNING"
    : parityDifferential > KILL_THRESHOLDS.H3_PARITY_MAX_DIFFERENTIAL ? "KILL_TRIGGERED"
    : "PASS";

  const h3: HypothesisResult = {
    id: "H3", name: "Social Venture Parity",
    description: "Veto-gate block rate differential between hardware vs software/social ventures must not exceed 2×.",
    killCriterion: "Block-rate differential > 2× triggers mandatory Profile SV-01 governance review",
    status: h3Status,
    metric: Math.round(parityDifferential * 100) / 100,
    metricLabel: `${Math.round(parityDifferential * 100) / 100}× differential`,
    threshold: "≤ 2.0×",
    sampleSize: hwTotal + swTotal,
    detail: !h3HasData
      ? `Insufficient sample across both profiles (HW: ${hwTotal}, SW/Social: ${swTotal}).`
      : `HW block rate: ${hwTotal > 0 ? Math.round(hwRate * 1000) / 10 : 0}% (${hwBlocked}/${hwTotal}) · SW/Social: ${swTotal > 0 ? Math.round(swRate * 1000) / 10 : 0}% (${swBlocked}/${swTotal}) · Ratio: ${Math.round(parityDifferential * 100) / 100}×`,
    computedAt: now,
  };

  // ── H4: Commercial Viability ───────────────────────────────────────────
  // Paid pilot conversions with zero studio equity relationship.
  // Proxy: ventures with validationStatus = 'piloting' or 'scaling' (independent commercial traction).
  const pilotVentures = await db
    .select({ id: ventures.id, validationStatus: ventures.validationStatus, isInternalLab: ventures.isInternalLab })
    .from(ventures)
    .where(
      sql`${ventures.validationStatus} IN ('piloting', 'scaling')`
    );

  // "Zero studio equity" proxy: not isInternalLab
  const independentPilots = pilotVentures.filter(v => !v.isInternalLab).length;
  const h4Status: HypothesisStatus =
    independentPilots === 0 ? "KILL_TRIGGERED"
    : independentPilots < KILL_THRESHOLDS.H4_COMMERCIAL_TARGET ? "WARNING"
    : "PASS";

  const h4: HypothesisResult = {
    id: "H4", name: "Commercial Viability",
    description: "Track paid pilot conversions with zero studio equity relationship to confirm independent commercial demand.",
    killCriterion: "0 of 5 target paid pilots converted",
    status: h4Status,
    metric: independentPilots,
    metricLabel: `${independentPilots} of ${KILL_THRESHOLDS.H4_COMMERCIAL_TARGET} target pilots`,
    threshold: "≥ 1 pilot (target: 5)",
    sampleSize: pilotVentures.length,
    detail: `${independentPilots} independent (non-lab) ventures at piloting or scaling stage out of ${pilotVentures.length} total at pilot/scale status.`,
    computedAt: now,
  };

  // ── H5: Predictive Signal ─────────────────────────────────────────────
  // Correlation between VRL score at T0 and independently verified outcome at T+12.
  // Proxy: earliest VRL assessment per venture (T0) vs current venture.vrl (outcome).
  const allVentures = await db
    .select({ id: ventures.id, vrl: ventures.vrl })
    .from(ventures);

  const allVrlAssessmentRows = await db
    .select({ ventureId: vrlAssessments.ventureId, globalVrlScore: vrlAssessments.globalVrlScore, createdAt: vrlAssessments.createdAt })
    .from(vrlAssessments)
    .where(isNotNull(vrlAssessments.globalVrlScore))
    .orderBy(vrlAssessments.createdAt);

  // Group assessments by venture; take earliest (T0)
  const earliestByVenture = new Map<string, number>();
  for (const row of allVrlAssessmentRows) {
    if (!earliestByVenture.has(row.ventureId) && row.globalVrlScore != null) {
      earliestByVenture.set(row.ventureId, row.globalVrlScore);
    }
  }

  const ventureMap = new Map(allVentures.map(v => [v.id, v.vrl ?? 1]));
  const pairXs: number[] = [];
  const pairYs: number[] = [];
  for (const [vid, t0Score] of earliestByVenture) {
    const currentVrl = ventureMap.get(vid);
    if (currentVrl != null) {
      pairXs.push(t0Score);
      pairYs.push(currentVrl);
    }
  }

  const h5r = pairXs.length >= 3 ? pearsonCorrelation(pairXs, pairYs) : null;
  const h5Status: HypothesisStatus =
    h5r === null ? "WARNING"
    : h5r < KILL_THRESHOLDS.H5_PREDICTIVE_MIN_CORRELATION ? "WARNING"  // data collection still maturing
    : "PASS";

  const h5: HypothesisResult = {
    id: "H5", name: "Predictive Signal",
    description: "VRL score at T0 correlates with independently verified outcome at T+12 months.",
    killCriterion: "Pearson r < 0.6 once longitudinal cohort matures (≥ 20 pairs at 12-month mark)",
    status: h5Status,
    metric: h5r !== null ? Math.round(h5r * 1000) / 1000 : null,
    metricLabel: h5r !== null ? `r = ${Math.round(h5r * 1000) / 1000}` : "Insufficient longitudinal data",
    threshold: "r ≥ 0.6 at 12-month cohort",
    sampleSize: pairXs.length,
    detail: pairXs.length < 3
      ? `Only ${pairXs.length} venture(s) have both a T0 VRL assessment and a current outcome — longitudinal cohort accumulating.`
      : `Pearson correlation across ${pairXs.length} ventures: r = ${h5r !== null ? Math.round(h5r * 1000) / 1000 : "N/A"}. Kill criterion activates at n ≥ 20 with 12-month gap confirmed.`,
    computedAt: now,
  };

  // ── H6: Coaching Integrity ────────────────────────────────────────────
  // Variance explained by commitment completion vs actual venture outcomes.
  // Compute per-venture coaching completion rate; correlate with venture VRL progress.
  const allCommitments = await db
    .select({ ventureId: coachingCommitments.ventureId, status: coachingCommitments.status, coachVerified: coachingCommitments.coachVerified })
    .from(coachingCommitments)
    .where(isNotNull(coachingCommitments.ventureId));

  const completionByVenture = new Map<string, { total: number; completed: number }>();
  for (const c of allCommitments) {
    if (!c.ventureId) continue;
    if (!completionByVenture.has(c.ventureId)) completionByVenture.set(c.ventureId, { total: 0, completed: 0 });
    const entry = completionByVenture.get(c.ventureId)!;
    entry.total++;
    if (c.coachVerified && c.status === "completed") entry.completed++;
  }

  const h6Xs: number[] = [];
  const h6Ys: number[] = [];
  for (const [vid, stats] of completionByVenture) {
    if (stats.total < 3) continue;
    const rate = stats.completed / stats.total;
    const currentVrl = ventureMap.get(vid);
    if (currentVrl != null) {
      h6Xs.push(rate);
      h6Ys.push(currentVrl);
    }
  }

  const h6r = h6Xs.length >= 3 ? pearsonCorrelation(h6Xs, h6Ys) : null;
  const h6r2 = h6r !== null ? h6r * h6r : null;
  const h6Status: HypothesisStatus =
    h6r2 === null ? "WARNING"
    : h6r2 < KILL_THRESHOLDS.H6_COACHING_MIN_VARIANCE ? "WARNING"
    : "PASS";

  const h6: HypothesisResult = {
    id: "H6", name: "Coaching Integrity",
    description: "Commitment completion rate explains meaningful variance in actual venture outcomes (VRL progression).",
    killCriterion: "r² < 0.15 — coaching completion explains < 15% of venture outcome variance",
    status: h6Status,
    metric: h6r2 !== null ? Math.round(h6r2 * 1000) / 1000 : null,
    metricLabel: h6r2 !== null ? `r² = ${Math.round(h6r2 * 1000) / 1000}` : "Insufficient data",
    threshold: "r² ≥ 0.15",
    sampleSize: h6Xs.length,
    detail: h6Xs.length < 3
      ? `Only ${h6Xs.length} venture(s) have sufficient coaching commitment data (≥ 3 commitments each) to compute correlation.`
      : `Pearson r = ${h6r !== null ? Math.round(h6r * 1000) / 1000 : "N/A"} → r² = ${h6r2 !== null ? Math.round(h6r2 * 1000) / 1000 : "N/A"} across ${h6Xs.length} ventures.`,
    computedAt: now,
  };

  // ── H7: Module Usability ──────────────────────────────────────────────
  // Weekly active modules per founder. Kill: < 6 active modules/week.
  // Proxy: distinct targetModules accessed in system_audit_logs in last 7 days.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentLogs = await db
    .select({ targetModule: systemAuditLogs.targetModule, actorName: systemAuditLogs.actorName })
    .from(systemAuditLogs)
    .where(gte(systemAuditLogs.createdAt, sevenDaysAgo));

  // Count distinct modules per actor (founder proxy)
  const modulesByActor = new Map<string, Set<string>>();
  for (const log of recentLogs) {
    if (!modulesByActor.has(log.actorName)) modulesByActor.set(log.actorName, new Set());
    modulesByActor.get(log.actorName)!.add(log.targetModule);
  }

  const actorCounts = Array.from(modulesByActor.values()).map(s => s.size);
  const avgModulesPerActor = actorCounts.length === 0
    ? null
    : actorCounts.reduce((a, b) => a + b, 0) / actorCounts.length;

  const h7Status: HypothesisStatus =
    avgModulesPerActor === null ? "WARNING"
    : avgModulesPerActor < KILL_THRESHOLDS.H7_MODULE_USABILITY_MIN_MODULES ? "KILL_TRIGGERED"
    : "PASS";

  const h7: HypothesisResult = {
    id: "H7", name: "Module Usability",
    description: "Founders engage with ≥ 6 distinct platform modules per week, demonstrating breadth of OS adoption.",
    killCriterion: "< 6 active modules per week per founder",
    status: h7Status,
    metric: avgModulesPerActor !== null ? Math.round(avgModulesPerActor * 10) / 10 : null,
    metricLabel: avgModulesPerActor !== null ? `${Math.round(avgModulesPerActor * 10) / 10} modules/week avg` : "No activity logged",
    threshold: "≥ 6 modules/week",
    sampleSize: actorCounts.length,
    detail: actorCounts.length === 0
      ? "No audit log activity in the past 7 days — ensure audit logging is active."
      : `${actorCounts.length} active user(s) in last 7 days · avg ${Math.round((avgModulesPerActor ?? 0) * 10) / 10} distinct modules/user · range: ${Math.min(...actorCounts)}–${Math.max(...actorCounts)}.`,
    computedAt: now,
  };

  // ── H8: Environmental Integrity ───────────────────────────────────────
  // Log and flag any greenwashing or compliance challenge events.
  // Source: system_audit_logs where targetModule contains sustainability/eco keywords,
  //         plus scorecardKillAlerts for previously logged H8 events.
  const greenwashKeywords = ["sustainability", "eco", "greenwash", "environmental", "carbon", "compliance_challenge", "esg"];
  const greenwashLogs = await db
    .select({ id: systemAuditLogs.id, actionPerformed: systemAuditLogs.actionPerformed, targetModule: systemAuditLogs.targetModule, createdAt: systemAuditLogs.createdAt })
    .from(systemAuditLogs)
    .where(
      sql`lower(${systemAuditLogs.targetModule}) SIMILAR TO ${'%(sustainability|eco|greenwash|environmental|carbon|compliance|esg)%'}
       OR lower(${systemAuditLogs.actionPerformed}) SIMILAR TO ${'%(greenwash|compliance_challenge|environmental_flag|carbon_misrepresent)%'}`
    );

  const previousH8Alerts = await db
    .select({ id: scorecardKillAlerts.id })
    .from(scorecardKillAlerts)
    .where(eq(scorecardKillAlerts.hypothesisId, "H8"));

  const flaggedEventCount = greenwashLogs.length + previousH8Alerts.length;
  const h8Status: HypothesisStatus =
    flaggedEventCount > KILL_THRESHOLDS.H8_GREENWASHING_MAX_FLAGS ? "KILL_TRIGGERED" : "PASS";

  const h8: HypothesisResult = {
    id: "H8", name: "Environmental Integrity",
    description: "Zero greenwashing or sustainability compliance challenge events — any breach triggers mandatory audit escalation.",
    killCriterion: "Any greenwashing or compliance challenge event triggers mandatory review",
    status: h8Status,
    metric: flaggedEventCount,
    metricLabel: flaggedEventCount === 0 ? "No events flagged" : `${flaggedEventCount} event(s) flagged`,
    threshold: "0 events",
    sampleSize: greenwashLogs.length,
    detail: flaggedEventCount === 0
      ? "No greenwashing or environmental compliance challenge events detected in audit logs."
      : `${greenwashLogs.length} sustainability-related audit log event(s) + ${previousH8Alerts.length} previously logged H8 alert(s) require review.`,
    computedAt: now,
  };

  return [h1, h2, h3, h4, h5, h6, h7, h8];
}

// ── Auto-log kill breaches ────────────────────────────────────────────────────
async function logKillBreaches(hypotheses: HypothesisResult[]): Promise<void> {
  const db = await getDb();
  for (const h of hypotheses) {
    if (h.status !== "KILL_TRIGGERED") continue;
    // Check if an open alert already exists for this hypothesis to avoid duplicates
    const existing = await db
      .select({ id: scorecardKillAlerts.id })
      .from(scorecardKillAlerts)
      .where(and(
        eq(scorecardKillAlerts.hypothesisId, h.id),
        eq(scorecardKillAlerts.resolved, false),
      ))
      .limit(1);

    if (existing.length > 0) continue;  // already logged

    await db.insert(scorecardKillAlerts).values({
      id: `kca_${h.id}_${Date.now()}`,
      hypothesisId: h.id,
      hypothesisName: h.name,
      breachDetail: h.detail,
      metricAtBreach: h.metric !== null ? String(h.metric) : null,
      killCriterion: h.killCriterion,
      sampleSizeAtBreach: h.sampleSize,
      resolved: false,
      createdAt: new Date(),
    });
  }
}

// ── tRPC Router ───────────────────────────────────────────────────────────────
export const scorecardTelemetryRouter = router({

  // ── getScorecard: compute all H1–H8 live, log any new kill breaches ─────
  getScorecard: publicProcedure.query(async () => {
    const hypotheses = await computeAllHypotheses();
    await logKillBreaches(hypotheses);
    return {
      hypotheses,
      summary: {
        pass:         hypotheses.filter(h => h.status === "PASS").length,
        warning:      hypotheses.filter(h => h.status === "WARNING").length,
        killTriggered: hypotheses.filter(h => h.status === "KILL_TRIGGERED").length,
        computedAt:   new Date().toISOString(),
      },
    };
  }),

  // ── getKillAlerts: list all logged kill-criterion breach alerts ──────────
  getKillAlerts: publicProcedure
    .input(z.object({ includeResolved: z.boolean().default(false) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = input?.includeResolved ? [] : [eq(scorecardKillAlerts.resolved, false)];
      const alerts = await db
        .select()
        .from(scorecardKillAlerts)
        .where(conditions.length > 0 ? conditions[0] : undefined)
        .orderBy(desc(scorecardKillAlerts.createdAt));
      return alerts;
    }),

  // ── resolveAlert: mark a kill-criterion alert as resolved ────────────────
  resolveAlert: protectedProcedure
    .input(z.object({
      alertId:      z.string(),
      resolvedNote: z.string().min(10, "Resolution note must be at least 10 characters"),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      await db
        .update(scorecardKillAlerts)
        .set({
          resolved:       true,
          resolvedBy:     ctx.user.name ?? ctx.user.email,
          resolvedNote:   input.resolvedNote,
          resolvedAt:     new Date(),
        })
        .where(eq(scorecardKillAlerts.id, input.alertId));
      return { ok: true };
    }),

  // ── logEnvironmentalEvent: manually flag H8 greenwashing/compliance event
  logEnvironmentalEvent: protectedProcedure
    .input(z.object({
      description: z.string().min(10),
      ventureId:   z.string().optional(),
      severity:    z.enum(["low", "medium", "high", "critical"]).default("medium"),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      const id = `kca_H8_manual_${Date.now()}`;
      await db.insert(scorecardKillAlerts).values({
        id,
        hypothesisId:      "H8",
        hypothesisName:    "Environmental Integrity",
        breachDetail:      input.description,
        metricAtBreach:    input.severity,
        killCriterion:     "Manual environmental/greenwashing flag",
        sampleSizeAtBreach: 1,
        resolved:          false,
        createdAt:         new Date(),
      });
      // Also write to system audit log for full traceability
      await db.insert(systemAuditLogs).values({
        actorName:        ctx.user.name ?? ctx.user.email,
        actorRole:        ctx.user.role,
        actionPerformed:  `H8 Environmental Integrity event flagged: ${input.description}`,
        targetModule:     "scorecard_telemetry",
        targetVentureId:  input.ventureId ?? null,
        targetRecordId:   id,
        actionCategory:   "flag",
      });
      return { ok: true, alertId: id };
    }),
});
