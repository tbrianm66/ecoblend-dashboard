/**
 * Coaching Module — Sprint 92-94 Router
 *
 * Sprint 92: Founder Notification Centre
 *   - notifications.list          — list notifications for a founder/venture
 *   - notifications.markRead      — mark a single notification as read
 *   - notifications.markAllRead   — mark all notifications as read for a venture
 *   - notifications.create        — create a notification (internal/admin use)
 *   - notifications.unreadCount   — get count of unread notifications
 *
 * Sprint 93: Coach Workload Dashboard
 *   - workload.summary            — aggregate workload metrics per coach
 *   - workload.detail             — detailed breakdown for a single coach
 *
 * Sprint 94: PRL Goal Setting
 *   - goals.set                   — create or replace the active goal for a founder/venture
 *   - goals.get                   — get the active goal for a founder/venture
 *   - goals.list                  — list all goals (admin/coach view, filterable)
 *   - goals.update                — update goal fields (target score, date, notes)
 *   - goals.updateProgress        — sync currentScore and recompute progressPercent
 *   - goals.cancel                — cancel an active goal
 *   - goals.listByCoach           — list all goals for a coach's assigned founders
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  founderNotifications,
  frlGoals,
  coachingAssignments,
  coachingCoaches,
  coachingFrl,
  coachingCommitments,
  coachingSessions,
  coachingSessionRequests,
  founderSelfAssessments,
  ventures,
} from "../drizzle/schema";
import { eq, and, desc, asc, sql, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

// ── Sprint 92: Founder Notification Centre ───────────────────────────────────
export const notificationsRouter = router({
  /** List notifications for a founder/venture, newest first */
  list: protectedProcedure
    .input(z.object({
      ventureId:  z.string().min(1),
      founderId:  z.string().min(1),
      unreadOnly: z.boolean().optional().default(false),
      limit:      z.number().int().min(1).max(100).optional().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db
        .select()
        .from(founderNotifications)
        .where(
          and(
            eq(founderNotifications.ventureId, input.ventureId),
            eq(founderNotifications.founderId, input.founderId),
            ...(input.unreadOnly ? [eq(founderNotifications.isRead, false)] : []),
          )
        )
        .orderBy(desc(founderNotifications.createdAt))
        .limit(input.limit);
      return rows;
    }),

  /** Count unread notifications for a founder/venture */
  unreadCount: protectedProcedure
    .input(z.object({
      ventureId: z.string().min(1),
      founderId: z.string().min(1),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [row] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(founderNotifications)
        .where(
          and(
            eq(founderNotifications.ventureId, input.ventureId),
            eq(founderNotifications.founderId, input.founderId),
            eq(founderNotifications.isRead, false),
          )
        );
      return { count: Number(row?.count ?? 0) };
    }),

  /** Mark a single notification as read */
  markRead: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db
        .update(founderNotifications)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(founderNotifications.id, input.id));
      return { success: true };
    }),

  /** Mark all notifications as read for a founder/venture */
  markAllRead: protectedProcedure
    .input(z.object({
      ventureId: z.string().min(1),
      founderId: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db
        .update(founderNotifications)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(founderNotifications.ventureId, input.ventureId),
            eq(founderNotifications.founderId, input.founderId),
            eq(founderNotifications.isRead, false),
          )
        );
      return { success: true };
    }),

  /** Create a notification (admin/system use) */
  create: protectedProcedure
    .input(z.object({
      ventureId:   z.string().min(1),
      founderId:   z.string().min(1),
      type:        z.enum([
        "alert_acknowledged",
        "session_confirmed",
        "session_rescheduled",
        "session_declined",
        "self_assessment_approved",
        "self_assessment_rejected",
        "leaderboard_rank_change",
        "commitment_due",
        "frl_score_updated",
        "goal_updated",
        "general",
      ]).optional().default("general"),
      title:       z.string().min(1).max(255),
      body:        z.string().min(1),
      sourceId:    z.string().optional(),
      sourceType:  z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const id = randomUUID();
      await db.insert(founderNotifications).values({
        id,
        ventureId:  input.ventureId,
        founderId:  input.founderId,
        type:       input.type,
        title:      input.title,
        body:       input.body,
        isRead:     false,
        sourceId:   input.sourceId,
        sourceType: input.sourceType,
      });
      const [created] = await db
        .select()
        .from(founderNotifications)
        .where(eq(founderNotifications.id, id));
      return created;
    }),
});

// ── Sprint 93: Coach Workload Dashboard ──────────────────────────────────────
export const workloadRouter = router({
  /** Aggregate workload metrics per coach across the portfolio */
  summary: protectedProcedure
    .query(async () => {
      const db = await getDb();

      // Get all active assignments with coach details
      const assignments = await db
        .select({
          coachId:   coachingAssignments.coachId,
          coachName: coachingCoaches.name,
          coachType: coachingCoaches.type,
          ventureId: coachingAssignments.ventureId,
          founderId: coachingAssignments.founderId,
        })
        .from(coachingAssignments)
        .innerJoin(coachingCoaches, eq(coachingAssignments.coachId, coachingCoaches.id))
        .where(isNull(coachingAssignments.endDate));

      // Get pending session requests per coach
      const pendingRequests = await db
        .select({
          coachId: coachingSessionRequests.coachId,
          count:   sql<number>`COUNT(*)`,
        })
        .from(coachingSessionRequests)
        .where(eq(coachingSessionRequests.status, "pending"))
        .groupBy(coachingSessionRequests.coachId);

      // Get unreviewed self-assessments per coach (via assignments)
      const pendingAssessments = await db
        .select({
          ventureId: founderSelfAssessments.ventureId,
          count:     sql<number>`COUNT(*)`,
        })
        .from(founderSelfAssessments)
        .where(eq(founderSelfAssessments.status, "pending"))
        .groupBy(founderSelfAssessments.ventureId);

      // Get latest PRL per venture
      const latestFrl = await db
        .select({
          ventureId: coachingFrl.ventureId,
          score:     coachingFrl.score,
          riskLevel: coachingFrl.riskLevel,
        })
        .from(coachingFrl)
        .orderBy(desc(coachingFrl.week));

      // Build per-coach summary
      const coachMap = new Map<string, {
        coachId: string;
        coachName: string;
        coachType: string;
        activeFounderCount: number;
        ventureIds: string[];
        pendingSessionRequests: number;
        unreviewedAssessments: number;
        highRiskFounders: number;
        avgPrl: number;
      }>();

      for (const a of assignments) {
        if (!coachMap.has(a.coachId)) {
          coachMap.set(a.coachId, {
            coachId: a.coachId,
            coachName: a.coachName,
            coachType: a.coachType ?? "Unknown",
            activeFounderCount: 0,
            ventureIds: [],
            pendingSessionRequests: 0,
            unreviewedAssessments: 0,
            highRiskFounders: 0,
            avgPrl: 0,
          });
        }
        const entry = coachMap.get(a.coachId)!;
        entry.activeFounderCount += 1;
        entry.ventureIds.push(a.ventureId);
      }

      // Attach pending requests
      for (const pr of pendingRequests) {
        const entry = coachMap.get(pr.coachId);
        if (entry) entry.pendingSessionRequests = Number(pr.count);
      }

      // Attach unreviewed assessments (map via ventureId → coachId)
      const ventureToCoach = new Map<string, string>();
      for (const a of assignments) ventureToCoach.set(a.ventureId, a.coachId);
      for (const pa of pendingAssessments) {
        const coachId = ventureToCoach.get(pa.ventureId);
        if (coachId) {
          const entry = coachMap.get(coachId);
          if (entry) entry.unreviewedAssessments += Number(pa.count);
        }
      }

      // Attach PRL stats
      const ventureLatestPrl = new Map<string, { score: number; riskLevel: string }>();
      for (const p of latestFrl) {
        if (!ventureLatestPrl.has(p.ventureId)) {
          ventureLatestPrl.set(p.ventureId, { score: p.score, riskLevel: p.riskLevel ?? "UNKNOWN" });
        }
      }
      for (const [coachId, entry] of coachMap) {
        const frlScores = entry.ventureIds
          .map(vid => ventureLatestPrl.get(vid)?.score ?? 0)
          .filter(s => s > 0);
        entry.avgPrl = frlScores.length > 0
          ? Math.round(frlScores.reduce((a, b) => a + b, 0) / frlScores.length)
          : 0;
        entry.highRiskFounders = entry.ventureIds.filter(vid => {
          const prl = ventureLatestPrl.get(vid);
          return prl && (prl.riskLevel === "HIGH" || prl.score < 40);
        }).length;
      }

      return {
        coaches: Array.from(coachMap.values()).sort((a, b) => b.activeFounderCount - a.activeFounderCount),
        totals: {
          totalCoaches: coachMap.size,
          totalActiveAssignments: assignments.length,
          totalPendingRequests: pendingRequests.reduce((s, r) => s + Number(r.count), 0),
          totalUnreviewedAssessments: pendingAssessments.reduce((s, r) => s + Number(r.count), 0),
        },
      };
    }),

  /** Detailed breakdown for a single coach */
  detail: protectedProcedure
    .input(z.object({ coachId: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      const assignments = await db
        .select()
        .from(coachingAssignments)
        .where(
          and(
            eq(coachingAssignments.coachId, input.coachId),
            isNull(coachingAssignments.endDate),
          )
        );

      const sessions = await db
        .select()
        .from(coachingSessions)
        .where(eq(coachingSessions.coachId, input.coachId))
        .orderBy(desc(coachingSessions.sessionDate))
        .limit(10);

      const pendingRequests = await db
        .select()
        .from(coachingSessionRequests)
        .where(
          and(
            eq(coachingSessionRequests.coachId, input.coachId),
            eq(coachingSessionRequests.status, "pending"),
          )
        );

      return { assignments, recentSessions: sessions, pendingRequests };
    }),
});

// ── Sprint 94: PRL Goal Setting ───────────────────────────────────────────────
export const goalsRouter = router({
  /** Create or replace the active goal for a founder/venture */
  set: protectedProcedure
    .input(z.object({
      ventureId:   z.string().min(1),
      founderId:   z.string().min(1),
      coachId:     z.string().min(1),
      targetScore: z.number().int().min(1).max(100),
      targetDate:  z.string().min(1),  // ISO date string YYYY-MM-DD
      startScore:  z.number().int().min(0).max(100),
      notes:       z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      // Cancel any existing active goal
      await db
        .update(frlGoals)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(frlGoals.ventureId, input.ventureId),
            eq(frlGoals.founderId, input.founderId),
            eq(frlGoals.status, "active"),
          )
        );
      const id = randomUUID();
      const progressPercent = input.targetScore > input.startScore
        ? "0.00"
        : "100.00";
      await db.insert(frlGoals).values({
        id,
        ventureId:       input.ventureId,
        founderId:       input.founderId,
        coachId:         input.coachId,
        targetScore:     input.targetScore,
        targetDate:      input.targetDate as unknown as Date,
        startScore:      input.startScore,
        currentScore:    input.startScore,
        status:          "active",
        notes:           input.notes,
        progressPercent: progressPercent as unknown as string,
      });
      const [created] = await db.select().from(frlGoals).where(eq(frlGoals.id, id));
      return created;
    }),

  /** Get the active goal for a founder/venture */
  get: protectedProcedure
    .input(z.object({
      ventureId: z.string().min(1),
      founderId: z.string().min(1),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [goal] = await db
        .select()
        .from(frlGoals)
        .where(
          and(
            eq(frlGoals.ventureId, input.ventureId),
            eq(frlGoals.founderId, input.founderId),
            eq(frlGoals.status, "active"),
          )
        )
        .orderBy(desc(frlGoals.createdAt))
        .limit(1);
      return goal ?? null;
    }),

  /** List all goals — admin/coach view, filterable by status */
  list: protectedProcedure
    .input(z.object({
      status:    z.enum(["active", "achieved", "missed", "cancelled", "all"]).optional().default("all"),
      coachId:   z.string().optional(),
      ventureId: z.string().optional(),
      limit:     z.number().int().min(1).max(200).optional().default(100),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [];
      if (input.status !== "all") conditions.push(eq(frlGoals.status, input.status));
      if (input.coachId)   conditions.push(eq(frlGoals.coachId, input.coachId));
      if (input.ventureId) conditions.push(eq(frlGoals.ventureId, input.ventureId));

      const rows = await db
        .select()
        .from(frlGoals)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(frlGoals.createdAt))
        .limit(input.limit);
      return rows;
    }),

  /** Update goal fields */
  update: protectedProcedure
    .input(z.object({
      id:          z.string().min(1),
      targetScore: z.number().int().min(1).max(100).optional(),
      targetDate:  z.string().optional(),
      notes:       z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const updates: Record<string, unknown> = {};
      if (input.targetScore !== undefined) updates.targetScore = input.targetScore;
      if (input.targetDate  !== undefined) updates.targetDate  = input.targetDate;
      if (input.notes       !== undefined) updates.notes       = input.notes;
      await db.update(frlGoals).set(updates).where(eq(frlGoals.id, input.id));
      const [updated] = await db.select().from(frlGoals).where(eq(frlGoals.id, input.id));
      return updated;
    }),

  /** Sync currentScore and recompute progressPercent */
  updateProgress: protectedProcedure
    .input(z.object({
      id:           z.string().min(1),
      currentScore: z.number().int().min(0).max(100),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [goal] = await db.select().from(frlGoals).where(eq(frlGoals.id, input.id));
      if (!goal) throw new Error("Goal not found");

      const range = goal.targetScore - goal.startScore;
      const progress = range > 0
        ? Math.min(100, Math.max(0, ((input.currentScore - goal.startScore) / range) * 100))
        : 0;

      const isAchieved = input.currentScore >= goal.targetScore;
      const updates: Record<string, unknown> = {
        currentScore:    input.currentScore,
        progressPercent: progress.toFixed(2),
      };
      if (isAchieved && goal.status === "active") {
        updates.status    = "achieved";
        updates.achievedAt = new Date();
      }
      await db.update(frlGoals).set(updates).where(eq(frlGoals.id, input.id));
      const [updated] = await db.select().from(frlGoals).where(eq(frlGoals.id, input.id));
      return updated;
    }),

  /** Cancel an active goal */
  cancel: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db
        .update(frlGoals)
        .set({ status: "cancelled" })
        .where(eq(frlGoals.id, input.id));
      return { success: true };
    }),

  /** List all goals for a coach's assigned founders */
  listByCoach: protectedProcedure
    .input(z.object({
      coachId: z.string().min(1),
      status:  z.enum(["active", "achieved", "missed", "cancelled", "all"]).optional().default("active"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [eq(frlGoals.coachId, input.coachId)];
      if (input.status !== "all") conditions.push(eq(frlGoals.status, input.status));
      const rows = await db
        .select()
        .from(frlGoals)
        .where(and(...conditions))
        .orderBy(asc(frlGoals.targetDate));
      return rows;
    }),
});
