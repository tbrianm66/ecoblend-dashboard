/**
 * Coaching Module — Sprint 89-91 Router
 *
 * Sprint 89: Founder Leaderboard
 *   - leaderboard.optIn           — founder opts in with an anonymised alias
 *   - leaderboard.optOut          — founder opts out of the leaderboard
 *   - leaderboard.compute         — compute/refresh this week's leaderboard for a VRL stage
 *   - leaderboard.get             — get the leaderboard for a given VRL stage
 *   - leaderboard.myRank          — get the current founder's rank and percentile
 *
 * Sprint 90: Coach Session Scheduler
 *   - sessionRequests.create      — founder requests a coaching session
 *   - sessionRequests.list        — list session requests (founder or coach view)
 *   - sessionRequests.confirm     — coach confirms with a date and optional meeting link
 *   - sessionRequests.reschedule  — coach proposes a new date
 *   - sessionRequests.cancel      — founder or coach cancels
 *   - sessionRequests.complete    — coach marks session as completed and links to session record
 *
 * Sprint 91: Template Effectiveness Analytics
 *   - templateEffectiveness.compute   — compute effectiveness scores for all templates
 *   - templateEffectiveness.top       — get top N templates by effectiveness score
 *   - templateEffectiveness.forTemplate — get effectiveness data for a single template
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  founderLeaderboardSnapshots,
  coachingSessionRequests,
  templateEffectivenessCache,
  commitmentTemplates,
  coachingCommitments,
  coachingPrl,
  founders,
} from "../drizzle/schema";
import { eq, and, desc, asc, sql, gte, lte, isNotNull } from "drizzle-orm";
import { randomUUID } from "crypto";

// ── Sprint 89: Founder Leaderboard ───────────────────────────────────────────

export const leaderboardRouter = router({
  /** Founder opts in to the leaderboard with an anonymised alias */
  optIn: protectedProcedure
    .input(z.object({
      ventureId:    z.string().min(1),
      displayAlias: z.string().min(2).max(64),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.openId;

      // Mark all existing snapshots for this founder as opted in
      await db
        .update(founderLeaderboardSnapshots)
        .set({ isOptedIn: true, displayAlias: input.displayAlias, updatedAt: new Date() })
        .where(and(
          eq(founderLeaderboardSnapshots.founderId, userId),
          eq(founderLeaderboardSnapshots.ventureId, input.ventureId),
        ));

      return { success: true, alias: input.displayAlias };
    }),

  /** Founder opts out — anonymises their data */
  optOut: protectedProcedure
    .input(z.object({ ventureId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      await db
        .update(founderLeaderboardSnapshots)
        .set({ isOptedIn: false, displayAlias: null, updatedAt: new Date() })
        .where(and(
          eq(founderLeaderboardSnapshots.founderId, ctx.user.openId),
          eq(founderLeaderboardSnapshots.ventureId, input.ventureId),
        ));
      return { success: true };
    }),

  /** Compute/refresh this week's leaderboard for a given VRL stage */
  compute: protectedProcedure
    .input(z.object({ vrlStage: z.number().int().min(1).max(9) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const weekOf = getWeekStart();

      // Get all opted-in founders at this VRL stage with a PRL score this week
      const prlData = await db
        .select({
          founderId: coachingPrl.founderId,
          ventureId: coachingPrl.ventureId,
          prlScore:  coachingPrl.compositeScore,
        })
        .from(coachingPrl)
        .where(and(
          eq(coachingPrl.vrlStage, input.vrlStage),
          isNotNull(coachingPrl.compositeScore),
        ))
        .orderBy(desc(coachingPrl.createdAt));

      // Deduplicate to latest score per founder
      const latestByFounder = new Map<string, { founderId: string; ventureId: string; prlScore: number }>();
      for (const row of prlData) {
        if (!latestByFounder.has(row.founderId)) {
          latestByFounder.set(row.founderId, {
            founderId: row.founderId,
            ventureId: row.ventureId,
            prlScore:  parseFloat(row.prlScore as unknown as string) || 0,
          });
        }
      }

      const ranked = [...latestByFounder.values()].sort((a, b) => b.prlScore - a.prlScore);
      const cohortSize = ranked.length;

      // Get previous week snapshots for delta
      const prevWeek = getPrevWeekStart();
      const prevSnaps = await db
        .select({ founderId: founderLeaderboardSnapshots.founderId, prlScore: founderLeaderboardSnapshots.prlScore })
        .from(founderLeaderboardSnapshots)
        .where(eq(founderLeaderboardSnapshots.weekOf, prevWeek));
      const prevScoreMap = new Map(prevSnaps.map((s) => [s.founderId, parseFloat(s.prlScore as unknown as string) || 0]));

      // Get opt-in status
      const optIns = await db
        .select({ founderId: founderLeaderboardSnapshots.founderId, isOptedIn: founderLeaderboardSnapshots.isOptedIn, displayAlias: founderLeaderboardSnapshots.displayAlias })
        .from(founderLeaderboardSnapshots)
        .where(eq(founderLeaderboardSnapshots.vrlStage, input.vrlStage));
      const optInMap = new Map(optIns.map((o) => [o.founderId, { isOptedIn: o.isOptedIn, alias: o.displayAlias }]));

      let inserted = 0;
      for (let i = 0; i < ranked.length; i++) {
        const entry = ranked[i];
        const rank = i + 1;
        const percentile = cohortSize > 1 ? ((cohortSize - rank) / (cohortSize - 1)) * 100 : 100;
        const prevScore = prevScoreMap.get(entry.founderId) ?? null;
        const delta = prevScore !== null ? entry.prlScore - prevScore : null;
        const optIn = optInMap.get(entry.founderId);

        await db.insert(founderLeaderboardSnapshots).values({
          id:            randomUUID(),
          founderId:     entry.founderId,
          ventureId:     entry.ventureId,
          vrlStage:      input.vrlStage,
          weekOf:        weekOf as unknown as Date,
          prlScore:      entry.prlScore as unknown as any,
          rankInCohort:  rank,
          cohortSize,
          percentile:    percentile as unknown as any,
          deltaFromPrev: delta as unknown as any,
          isOptedIn:     optIn?.isOptedIn ?? false,
          displayAlias:  optIn?.alias ?? null,
        }).onDuplicateKeyUpdate({
          set: {
            prlScore:     entry.prlScore as unknown as any,
            rankInCohort: rank,
            cohortSize,
            percentile:   percentile as unknown as any,
            deltaFromPrev: delta as unknown as any,
            updatedAt:    new Date(),
          },
        });
        inserted++;
      }

      return { computed: inserted, cohortSize, vrlStage: input.vrlStage, weekOf };
    }),

  /** Get the leaderboard for a given VRL stage (only opted-in entries are named) */
  get: protectedProcedure
    .input(z.object({
      vrlStage: z.number().int().min(1).max(9),
      limit:    z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const weekOf = getWeekStart();

      const rows = await db
        .select()
        .from(founderLeaderboardSnapshots)
        .where(and(
          eq(founderLeaderboardSnapshots.vrlStage, input.vrlStage),
          eq(founderLeaderboardSnapshots.weekOf, weekOf as unknown as Date),
        ))
        .orderBy(asc(founderLeaderboardSnapshots.rankInCohort))
        .limit(input.limit);

      return rows.map((r) => ({
        rank:         r.rankInCohort,
        displayName:  r.isOptedIn ? (r.displayAlias ?? `Founder #${r.rankInCohort}`) : `Anonymous`,
        prlScore:     r.isOptedIn ? parseFloat(r.prlScore as unknown as string) : null,
        percentile:   parseFloat(r.percentile as unknown as string),
        deltaFromPrev: r.deltaFromPrev !== null ? parseFloat(r.deltaFromPrev as unknown as string) : null,
        isOptedIn:    r.isOptedIn,
        cohortSize:   r.cohortSize,
      }));
    }),

  /** Get the current founder's own rank and percentile */
  myRank: protectedProcedure
    .input(z.object({ ventureId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const weekOf = getWeekStart();

      const rows = await db
        .select()
        .from(founderLeaderboardSnapshots)
        .where(and(
          eq(founderLeaderboardSnapshots.founderId, ctx.user.openId),
          eq(founderLeaderboardSnapshots.ventureId, input.ventureId),
          eq(founderLeaderboardSnapshots.weekOf, weekOf as unknown as Date),
        ))
        .limit(1);

      if (rows.length === 0) return null;
      const r = rows[0];
      return {
        rank:         r.rankInCohort,
        cohortSize:   r.cohortSize,
        percentile:   parseFloat(r.percentile as unknown as string),
        prlScore:     parseFloat(r.prlScore as unknown as string),
        deltaFromPrev: r.deltaFromPrev !== null ? parseFloat(r.deltaFromPrev as unknown as string) : null,
        isOptedIn:    r.isOptedIn,
        displayAlias: r.displayAlias,
        vrlStage:     r.vrlStage,
      };
    }),
});

// ── Sprint 90: Coach Session Scheduler ───────────────────────────────────────

export const sessionRequestsRouter = router({
  /** Founder requests a coaching session */
  create: protectedProcedure
    .input(z.object({
      coachId:       z.string().min(1),
      ventureId:     z.string().min(1),
      sessionType:   z.enum(["prl_review", "commitment_check", "strategy", "wellbeing", "ad_hoc"]).default("prl_review"),
      preferredDate: z.string().optional(),   // ISO string
      alternateDate: z.string().optional(),
      founderNotes:  z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const id = randomUUID();

      await db.insert(coachingSessionRequests).values({
        id,
        founderId:     ctx.user.openId,
        coachId:       input.coachId,
        ventureId:     input.ventureId,
        sessionType:   input.sessionType,
        preferredDate: input.preferredDate ? new Date(input.preferredDate) : null,
        alternateDate: input.alternateDate ? new Date(input.alternateDate) : null,
        founderNotes:  input.founderNotes ?? null,
        status:        "pending",
      });

      return { id, status: "pending" };
    }),

  /** List session requests — founders see their own, coaches see all pending */
  list: protectedProcedure
    .input(z.object({
      role:      z.enum(["founder", "coach"]).default("founder"),
      coachId:   z.string().optional(),
      status:    z.enum(["pending", "confirmed", "rescheduled", "cancelled", "completed"]).optional(),
      limit:     z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const conditions = [];

      if (input.role === "founder") {
        conditions.push(eq(coachingSessionRequests.founderId, ctx.user.openId));
      } else if (input.coachId) {
        conditions.push(eq(coachingSessionRequests.coachId, input.coachId));
      }

      if (input.status) {
        conditions.push(eq(coachingSessionRequests.status, input.status));
      }

      const rows = await db
        .select()
        .from(coachingSessionRequests)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(coachingSessionRequests.requestedAt))
        .limit(input.limit);

      return rows;
    }),

  /** Coach confirms the session with a date and optional meeting link */
  confirm: protectedProcedure
    .input(z.object({
      requestId:     z.string().min(1),
      confirmedDate: z.string(),   // ISO string
      meetingLink:   z.string().url().optional(),
      coachNotes:    z.string().max(1000).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db
        .update(coachingSessionRequests)
        .set({
          status:        "confirmed",
          confirmedDate: new Date(input.confirmedDate),
          meetingLink:   input.meetingLink ?? null,
          coachNotes:    input.coachNotes ?? null,
          updatedAt:     new Date(),
        })
        .where(eq(coachingSessionRequests.id, input.requestId));
      return { success: true, status: "confirmed" };
    }),

  /** Coach proposes a new date (reschedule) */
  reschedule: protectedProcedure
    .input(z.object({
      requestId:    z.string().min(1),
      newDate:      z.string(),
      coachNotes:   z.string().max(1000).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db
        .update(coachingSessionRequests)
        .set({
          status:        "rescheduled",
          confirmedDate: new Date(input.newDate),
          coachNotes:    input.coachNotes ?? null,
          updatedAt:     new Date(),
        })
        .where(eq(coachingSessionRequests.id, input.requestId));
      return { success: true, status: "rescheduled" };
    }),

  /** Cancel a session request */
  cancel: protectedProcedure
    .input(z.object({
      requestId: z.string().min(1),
      reason:    z.string().max(500).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db
        .update(coachingSessionRequests)
        .set({
          status:    "cancelled",
          coachNotes: input.reason ?? null,
          updatedAt: new Date(),
        })
        .where(eq(coachingSessionRequests.id, input.requestId));
      return { success: true, status: "cancelled" };
    }),

  /** Mark a session request as completed and optionally link to a session record */
  complete: protectedProcedure
    .input(z.object({
      requestId:  z.string().min(1),
      sessionId:  z.string().optional(),
      coachNotes: z.string().max(1000).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db
        .update(coachingSessionRequests)
        .set({
          status:    "completed",
          sessionId: input.sessionId ?? null,
          coachNotes: input.coachNotes ?? null,
          updatedAt: new Date(),
        })
        .where(eq(coachingSessionRequests.id, input.requestId));
      return { success: true, status: "completed" };
    }),
});

// ── Sprint 91: Template Effectiveness Analytics ───────────────────────────────

export const templateEffectivenessRouter = router({
  /** Compute effectiveness scores for all templates */
  compute: protectedProcedure
    .mutation(async () => {
      const db = await getDb();

      // Get all templates
      const templates = await db.select().from(commitmentTemplates);
      if (templates.length === 0) return { computed: 0, message: "No templates found" };

      // For each template, compute stats from commitments
      const results: Array<{
        templateId: string;
        totalAssigned: number;
        totalCompleted: number;
        completionRate: number;
        avgDaysToComplete: number | null;
        avgPrlUplift: number | null;
        effectivenessScore: number;
      }> = [];

      for (const tmpl of templates) {
        const commitments = await db
          .select()
          .from(coachingCommitments)
          .where(eq(coachingCommitments.title, tmpl.title));

        const totalAssigned = commitments.length;
        const completed = commitments.filter((c) => c.status === "completed");
        const totalCompleted = completed.length;
        const completionRate = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;

        // Average days to complete
        let avgDaysToComplete: number | null = null;
        if (completed.length > 0) {
          const daysArr = completed
            .filter((c) => c.completedAt && c.createdAt)
            .map((c) => {
              const ms = new Date(c.completedAt!).getTime() - new Date(c.createdAt).getTime();
              return ms / (1000 * 60 * 60 * 24);
            });
          if (daysArr.length > 0) {
            avgDaysToComplete = daysArr.reduce((a, b) => a + b, 0) / daysArr.length;
          }
        }

        // Effectiveness score: 60% completion rate + 40% normalised speed bonus (max 14 days = 100%)
        const speedBonus = avgDaysToComplete !== null
          ? Math.max(0, 100 - (avgDaysToComplete / 14) * 100)
          : 0;
        const effectivenessScore = completionRate * 0.6 + speedBonus * 0.4;

        results.push({
          templateId: tmpl.id,
          totalAssigned,
          totalCompleted,
          completionRate,
          avgDaysToComplete,
          avgPrlUplift: null,   // requires PRL correlation — placeholder for future sprint
          effectivenessScore,
        });
      }

      // Rank by effectiveness score
      results.sort((a, b) => b.effectivenessScore - a.effectivenessScore);
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        await db.insert(templateEffectivenessCache).values({
          id:                 randomUUID(),
          templateId:         r.templateId,
          totalAssigned:      r.totalAssigned,
          totalCompleted:     r.totalCompleted,
          completionRate:     r.completionRate as unknown as any,
          avgPrlUplift:       r.avgPrlUplift as unknown as any,
          avgDaysToComplete:  r.avgDaysToComplete as unknown as any,
          effectivenessScore: r.effectivenessScore as unknown as any,
          rank:               i + 1,
        }).onDuplicateKeyUpdate({
          set: {
            totalAssigned:      r.totalAssigned,
            totalCompleted:     r.totalCompleted,
            completionRate:     r.completionRate as unknown as any,
            avgDaysToComplete:  r.avgDaysToComplete as unknown as any,
            effectivenessScore: r.effectivenessScore as unknown as any,
            rank:               i + 1,
            computedAt:         new Date(),
            updatedAt:          new Date(),
          },
        });
      }

      return { computed: results.length, message: `Effectiveness scores computed for ${results.length} templates` };
    }),

  /** Get top N templates by effectiveness score */
  top: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(5) }))
    .query(async ({ input }) => {
      const db = await getDb();

      const rows = await db
        .select({
          id:                 templateEffectivenessCache.id,
          templateId:         templateEffectivenessCache.templateId,
          rank:               templateEffectivenessCache.rank,
          totalAssigned:      templateEffectivenessCache.totalAssigned,
          totalCompleted:     templateEffectivenessCache.totalCompleted,
          completionRate:     templateEffectivenessCache.completionRate,
          avgPrlUplift:       templateEffectivenessCache.avgPrlUplift,
          avgDaysToComplete:  templateEffectivenessCache.avgDaysToComplete,
          effectivenessScore: templateEffectivenessCache.effectivenessScore,
          computedAt:         templateEffectivenessCache.computedAt,
          // Template fields
          title:              commitmentTemplates.title,
          vrlStage:           commitmentTemplates.vrlStage,
          priority:           commitmentTemplates.priority,
          category:           commitmentTemplates.category,
        })
        .from(templateEffectivenessCache)
        .innerJoin(commitmentTemplates, eq(templateEffectivenessCache.templateId, commitmentTemplates.id))
        .orderBy(asc(templateEffectivenessCache.rank))
        .limit(input.limit);

      return rows.map((r) => ({
        ...r,
        completionRate:     parseFloat(r.completionRate as unknown as string),
        avgPrlUplift:       r.avgPrlUplift !== null ? parseFloat(r.avgPrlUplift as unknown as string) : null,
        avgDaysToComplete:  r.avgDaysToComplete !== null ? parseFloat(r.avgDaysToComplete as unknown as string) : null,
        effectivenessScore: parseFloat(r.effectivenessScore as unknown as string),
      }));
    }),

  /** Get effectiveness data for a single template */
  forTemplate: protectedProcedure
    .input(z.object({ templateId: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db
        .select()
        .from(templateEffectivenessCache)
        .where(eq(templateEffectivenessCache.templateId, input.templateId))
        .orderBy(desc(templateEffectivenessCache.computedAt))
        .limit(1);

      if (rows.length === 0) return null;
      const r = rows[0];
      return {
        ...r,
        completionRate:     parseFloat(r.completionRate as unknown as string),
        avgPrlUplift:       r.avgPrlUplift !== null ? parseFloat(r.avgPrlUplift as unknown as string) : null,
        avgDaysToComplete:  r.avgDaysToComplete !== null ? parseFloat(r.avgDaysToComplete as unknown as string) : null,
        effectivenessScore: parseFloat(r.effectivenessScore as unknown as string),
      };
    }),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

function getPrevWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
  const prevMonday = new Date(now.setDate(diff));
  return prevMonday.toISOString().split("T")[0];
}
