/**
 * Institutional Memory, Governance Compliance Framework, and Advanced Stakeholder Management Router
 * Phase 5 Long-Term (Weeks 17+)
 */
import { z } from "zod";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { sql } from "drizzle-orm";

// ─── Institutional Memory Router ─────────────────────────────────────────────

export const institutionalMemoryRouter = router({
  list: publicProcedure
    .input(z.object({
      ventureId: z.string().optional(),
      category: z.string().optional(),
      isFounderLegacy: z.boolean().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      // Build query based on filters
      const ventureId = input?.ventureId;
      const category = input?.category;
      const isFounderLegacy = input?.isFounderLegacy;
      const search = input?.search ? `%${input.search}%` : null;

      let rows: any;
      if (ventureId && category && isFounderLegacy !== undefined && search) {
        rows = await db.execute(sql`SELECT * FROM institutional_memory WHERE (venture_id = ${ventureId} OR venture_id = 'portfolio') AND category = ${category} AND is_founder_legacy = ${isFounderLegacy ? 1 : 0} AND (title LIKE ${search} OR content LIKE ${search} OR tags LIKE ${search}) ORDER BY importance DESC, created_at DESC LIMIT 100`);
      } else if (ventureId && category && isFounderLegacy !== undefined) {
        rows = await db.execute(sql`SELECT * FROM institutional_memory WHERE (venture_id = ${ventureId} OR venture_id = 'portfolio') AND category = ${category} AND is_founder_legacy = ${isFounderLegacy ? 1 : 0} ORDER BY importance DESC, created_at DESC LIMIT 100`);
      } else if (ventureId && category && search) {
        rows = await db.execute(sql`SELECT * FROM institutional_memory WHERE (venture_id = ${ventureId} OR venture_id = 'portfolio') AND category = ${category} AND (title LIKE ${search} OR content LIKE ${search} OR tags LIKE ${search}) ORDER BY importance DESC, created_at DESC LIMIT 100`);
      } else if (ventureId && isFounderLegacy !== undefined && search) {
        rows = await db.execute(sql`SELECT * FROM institutional_memory WHERE (venture_id = ${ventureId} OR venture_id = 'portfolio') AND is_founder_legacy = ${isFounderLegacy ? 1 : 0} AND (title LIKE ${search} OR content LIKE ${search} OR tags LIKE ${search}) ORDER BY importance DESC, created_at DESC LIMIT 100`);
      } else if (category && isFounderLegacy !== undefined && search) {
        rows = await db.execute(sql`SELECT * FROM institutional_memory WHERE category = ${category} AND is_founder_legacy = ${isFounderLegacy ? 1 : 0} AND (title LIKE ${search} OR content LIKE ${search} OR tags LIKE ${search}) ORDER BY importance DESC, created_at DESC LIMIT 100`);
      } else if (ventureId && category) {
        rows = await db.execute(sql`SELECT * FROM institutional_memory WHERE (venture_id = ${ventureId} OR venture_id = 'portfolio') AND category = ${category} ORDER BY importance DESC, created_at DESC LIMIT 100`);
      } else if (ventureId && isFounderLegacy !== undefined) {
        rows = await db.execute(sql`SELECT * FROM institutional_memory WHERE (venture_id = ${ventureId} OR venture_id = 'portfolio') AND is_founder_legacy = ${isFounderLegacy ? 1 : 0} ORDER BY importance DESC, created_at DESC LIMIT 100`);
      } else if (ventureId && search) {
        rows = await db.execute(sql`SELECT * FROM institutional_memory WHERE (venture_id = ${ventureId} OR venture_id = 'portfolio') AND (title LIKE ${search} OR content LIKE ${search} OR tags LIKE ${search}) ORDER BY importance DESC, created_at DESC LIMIT 100`);
      } else if (category && isFounderLegacy !== undefined) {
        rows = await db.execute(sql`SELECT * FROM institutional_memory WHERE category = ${category} AND is_founder_legacy = ${isFounderLegacy ? 1 : 0} ORDER BY importance DESC, created_at DESC LIMIT 100`);
      } else if (category && search) {
        rows = await db.execute(sql`SELECT * FROM institutional_memory WHERE category = ${category} AND (title LIKE ${search} OR content LIKE ${search} OR tags LIKE ${search}) ORDER BY importance DESC, created_at DESC LIMIT 100`);
      } else if (isFounderLegacy !== undefined && search) {
        rows = await db.execute(sql`SELECT * FROM institutional_memory WHERE is_founder_legacy = ${isFounderLegacy ? 1 : 0} AND (title LIKE ${search} OR content LIKE ${search} OR tags LIKE ${search}) ORDER BY importance DESC, created_at DESC LIMIT 100`);
      } else if (ventureId) {
        rows = await db.execute(sql`SELECT * FROM institutional_memory WHERE (venture_id = ${ventureId} OR venture_id = 'portfolio') ORDER BY importance DESC, created_at DESC LIMIT 100`);
      } else if (category) {
        rows = await db.execute(sql`SELECT * FROM institutional_memory WHERE category = ${category} ORDER BY importance DESC, created_at DESC LIMIT 100`);
      } else if (isFounderLegacy !== undefined) {
        rows = await db.execute(sql`SELECT * FROM institutional_memory WHERE is_founder_legacy = ${isFounderLegacy ? 1 : 0} ORDER BY importance DESC, created_at DESC LIMIT 100`);
      } else if (search) {
        rows = await db.execute(sql`SELECT * FROM institutional_memory WHERE (title LIKE ${search} OR content LIKE ${search} OR tags LIKE ${search}) ORDER BY importance DESC, created_at DESC LIMIT 100`);
      } else {
        rows = await db.execute(sql`SELECT * FROM institutional_memory ORDER BY importance DESC, created_at DESC LIMIT 100`);
      }
      return (rows as any).rows ?? rows ?? [];
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.execute(sql`SELECT * FROM institutional_memory WHERE id = ${input.id} LIMIT 1`);
      const data = (rows as any).rows ?? rows ?? [];
      await db.execute(sql`UPDATE institutional_memory SET view_count = view_count + 1 WHERE id = ${input.id}`);
      return data[0] ?? null;
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().default("portfolio"),
      title: z.string().min(1),
      category: z.enum(["Mission","Process","Decision","Lesson","Principle","Vision","Non-Negotiable","Cultural"]),
      content: z.string().min(1),
      tags: z.string().default(""),
      author: z.string().default("Founder"),
      importance: z.enum(["Critical","High","Medium","Low"]).default("Medium"),
      isFounderLegacy: z.boolean().default(false),
      isPublic: z.boolean().default(true),
      linkedDecisionId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const now = Date.now();
      if (input.id) {
        await db.execute(sql`UPDATE institutional_memory SET venture_id = ${input.ventureId}, title = ${input.title}, category = ${input.category}, content = ${input.content}, tags = ${input.tags}, author = ${input.author}, importance = ${input.importance}, is_founder_legacy = ${input.isFounderLegacy ? 1 : 0}, is_public = ${input.isPublic ? 1 : 0}, linked_decision_id = ${input.linkedDecisionId ?? null}, updated_at = ${now} WHERE id = ${input.id}`);
        return { id: input.id };
      } else {
        const result = await db.execute(sql`INSERT INTO institutional_memory (venture_id, title, category, content, tags, author, importance, is_founder_legacy, is_public, linked_decision_id, created_at, updated_at) VALUES (${input.ventureId}, ${input.title}, ${input.category}, ${input.content}, ${input.tags}, ${input.author}, ${input.importance}, ${input.isFounderLegacy ? 1 : 0}, ${input.isPublic ? 1 : 0}, ${input.linkedDecisionId ?? null}, ${now}, ${now})`);
        return { id: (result as any).insertId ?? 0 };
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.execute(sql`DELETE FROM institutional_memory WHERE id = ${input.id}`);
      return { success: true };
    }),

  getFounderLegacy: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { vision: [], nonNegotiables: [], principles: [], cultural: [] };
      const rows = input?.ventureId
        ? await db.execute(sql`SELECT * FROM institutional_memory WHERE is_founder_legacy = 1 AND (venture_id = ${input.ventureId} OR venture_id = 'portfolio') ORDER BY importance DESC, created_at DESC`)
        : await db.execute(sql`SELECT * FROM institutional_memory WHERE is_founder_legacy = 1 ORDER BY importance DESC, created_at DESC`);
      const entries = (rows as any).rows ?? rows ?? [];
      return {
        vision: entries.filter((e: any) => e.category === "Vision"),
        nonNegotiables: entries.filter((e: any) => e.category === "Non-Negotiable"),
        principles: entries.filter((e: any) => e.category === "Principle"),
        cultural: entries.filter((e: any) => e.category === "Cultural"),
      };
    }),

  getStats: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return { total: 0, byCategory: {}, founderLegacyCount: 0, criticalCount: 0 };
      const rows = await db.execute(sql`SELECT category, importance, is_founder_legacy, COUNT(*) as count FROM institutional_memory GROUP BY category, importance, is_founder_legacy`);
      const data = (rows as any).rows ?? rows ?? [];
      const byCategory: Record<string, number> = {};
      let total = 0, founderLegacyCount = 0, criticalCount = 0;
      for (const row of data) {
        const cat = row.category as string;
        const cnt = Number(row.count);
        byCategory[cat] = (byCategory[cat] ?? 0) + cnt;
        total += cnt;
        if (row.is_founder_legacy) founderLegacyCount += cnt;
        if (row.importance === "Critical") criticalCount += cnt;
      }
      return { total, byCategory, founderLegacyCount, criticalCount };
    }),
});

// ─── Governance Compliance Framework Router ───────────────────────────────────

const DEFAULT_FRAMEWORKS = [
  { id: 1, name: "B Corp Certification", short_name: "B Corp", category: "Social", description: "Comprehensive social and environmental performance standard", total_requirements: 80, is_active: 1 },
  { id: 2, name: "ISO 14001 Environmental Management", short_name: "ISO 14001", category: "Environmental", description: "International standard for environmental management systems", total_requirements: 45, is_active: 1 },
  { id: 3, name: "GRI Sustainability Reporting", short_name: "GRI", category: "Environmental", description: "Global Reporting Initiative sustainability disclosure standards", total_requirements: 36, is_active: 1 },
  { id: 4, name: "UN Sustainable Development Goals", short_name: "SDGs", category: "Social", description: "17 SDGs with 169 targets for sustainable development", total_requirements: 17, is_active: 1 },
  { id: 5, name: "Community Interest Company Articles", short_name: "CIC Articles", category: "Legal", description: "UK CIC regulatory compliance requirements", total_requirements: 12, is_active: 1 },
  { id: 6, name: "UK Corporate Governance Code", short_name: "UK CGC", category: "Governance", description: "FRC governance principles for UK companies", total_requirements: 28, is_active: 1 },
];

export const governanceComplianceRouter = router({
  getFrameworks: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return DEFAULT_FRAMEWORKS;
      const rows = await db.execute(sql`SELECT * FROM compliance_frameworks WHERE is_active = 1 ORDER BY category, name`);
      const data = (rows as any).rows ?? rows ?? [];
      return data.length === 0 ? DEFAULT_FRAMEWORKS : data;
    }),

  getRequirements: publicProcedure
    .input(z.object({
      frameworkId: z.number().optional(),
      ventureId: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const { frameworkId, ventureId, status } = input;
      let rows: any;
      if (frameworkId && ventureId && status) {
        rows = await db.execute(sql`SELECT * FROM compliance_requirements WHERE framework_id = ${frameworkId} AND (venture_id = ${ventureId} OR venture_id = 'portfolio') AND status = ${status} ORDER BY priority DESC, created_at DESC`);
      } else if (frameworkId && ventureId) {
        rows = await db.execute(sql`SELECT * FROM compliance_requirements WHERE framework_id = ${frameworkId} AND (venture_id = ${ventureId} OR venture_id = 'portfolio') ORDER BY priority DESC, created_at DESC`);
      } else if (frameworkId && status) {
        rows = await db.execute(sql`SELECT * FROM compliance_requirements WHERE framework_id = ${frameworkId} AND status = ${status} ORDER BY priority DESC, created_at DESC`);
      } else if (ventureId && status) {
        rows = await db.execute(sql`SELECT * FROM compliance_requirements WHERE (venture_id = ${ventureId} OR venture_id = 'portfolio') AND status = ${status} ORDER BY priority DESC, created_at DESC`);
      } else if (frameworkId) {
        rows = await db.execute(sql`SELECT * FROM compliance_requirements WHERE framework_id = ${frameworkId} ORDER BY priority DESC, created_at DESC`);
      } else if (ventureId) {
        rows = await db.execute(sql`SELECT * FROM compliance_requirements WHERE (venture_id = ${ventureId} OR venture_id = 'portfolio') ORDER BY priority DESC, created_at DESC`);
      } else if (status) {
        rows = await db.execute(sql`SELECT * FROM compliance_requirements WHERE status = ${status} ORDER BY priority DESC, created_at DESC`);
      } else {
        rows = await db.execute(sql`SELECT * FROM compliance_requirements ORDER BY priority DESC, created_at DESC LIMIT 100`);
      }
      return (rows as any).rows ?? rows ?? [];
    }),

  upsertRequirement: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      frameworkId: z.number(),
      ventureId: z.string().default("portfolio"),
      requirementCode: z.string(),
      title: z.string(),
      description: z.string().optional(),
      priority: z.enum(["Critical","High","Medium","Low"]).default("Medium"),
      status: z.enum(["Not Started","In Progress","Compliant","Non-Compliant","Exempt","Under Review"]).default("Not Started"),
      evidence: z.string().optional(),
      dueDate: z.number().optional(),
      owner: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const now = Date.now();
      const completedAt = input.status === "Compliant" ? now : null;
      if (input.id) {
        await db.execute(sql`UPDATE compliance_requirements SET framework_id = ${input.frameworkId}, venture_id = ${input.ventureId}, requirement_code = ${input.requirementCode}, title = ${input.title}, description = ${input.description ?? null}, priority = ${input.priority}, status = ${input.status}, evidence = ${input.evidence ?? null}, due_date = ${input.dueDate ?? null}, completed_at = ${completedAt}, owner = ${input.owner ?? null}, notes = ${input.notes ?? null}, updated_at = ${now} WHERE id = ${input.id}`);
        return { id: input.id };
      } else {
        const result = await db.execute(sql`INSERT INTO compliance_requirements (framework_id, venture_id, requirement_code, title, description, priority, status, evidence, due_date, completed_at, owner, notes, created_at, updated_at) VALUES (${input.frameworkId}, ${input.ventureId}, ${input.requirementCode}, ${input.title}, ${input.description ?? null}, ${input.priority}, ${input.status}, ${input.evidence ?? null}, ${input.dueDate ?? null}, ${completedAt}, ${input.owner ?? null}, ${input.notes ?? null}, ${now}, ${now})`);
        return { id: (result as any).insertId ?? 0 };
      }
    }),

  getComplianceScore: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { overallScore: 0, byFramework: [], gapCount: 0, criticalGaps: 0 };
      const rows = input?.ventureId
        ? await db.execute(sql`SELECT cr.framework_id, cf.name as framework_name, cf.short_name, COUNT(*) as total, SUM(CASE WHEN cr.status = 'Compliant' THEN 1 ELSE 0 END) as compliant, SUM(CASE WHEN cr.status = 'Non-Compliant' AND cr.priority = 'Critical' THEN 1 ELSE 0 END) as critical_gaps FROM compliance_requirements cr LEFT JOIN compliance_frameworks cf ON cr.framework_id = cf.id WHERE (cr.venture_id = ${input.ventureId} OR cr.venture_id = 'portfolio') GROUP BY cr.framework_id, cf.name, cf.short_name`)
        : await db.execute(sql`SELECT cr.framework_id, cf.name as framework_name, cf.short_name, COUNT(*) as total, SUM(CASE WHEN cr.status = 'Compliant' THEN 1 ELSE 0 END) as compliant, SUM(CASE WHEN cr.status = 'Non-Compliant' AND cr.priority = 'Critical' THEN 1 ELSE 0 END) as critical_gaps FROM compliance_requirements cr LEFT JOIN compliance_frameworks cf ON cr.framework_id = cf.id GROUP BY cr.framework_id, cf.name, cf.short_name`);
      const data = (rows as any).rows ?? rows ?? [];
      const byFramework = data.map((row: any) => ({
        frameworkId: row.framework_id,
        frameworkName: row.framework_name ?? "Unknown",
        shortName: row.short_name ?? "?",
        total: Number(row.total),
        compliant: Number(row.compliant),
        score: row.total > 0 ? Math.round((Number(row.compliant) / Number(row.total)) * 100) : 0,
        criticalGaps: Number(row.critical_gaps),
      }));
      const totalReqs = byFramework.reduce((s: number, f: any) => s + f.total, 0);
      const totalCompliant = byFramework.reduce((s: number, f: any) => s + f.compliant, 0);
      const overallScore = totalReqs > 0 ? Math.round((totalCompliant / totalReqs) * 100) : 0;
      const gapCount = totalReqs - totalCompliant;
      const criticalGaps = byFramework.reduce((s: number, f: any) => s + f.criticalGaps, 0);
      return { overallScore, byFramework, gapCount, criticalGaps };
    }),

  getGapAnalysis: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = input?.ventureId
        ? await db.execute(sql`SELECT cr.*, cf.name as framework_name, cf.short_name FROM compliance_requirements cr LEFT JOIN compliance_frameworks cf ON cr.framework_id = cf.id WHERE cr.status IN ('Not Started', 'Non-Compliant') AND (cr.venture_id = ${input.ventureId} OR cr.venture_id = 'portfolio') ORDER BY CASE cr.priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END, cr.due_date ASC LIMIT 50`)
        : await db.execute(sql`SELECT cr.*, cf.name as framework_name, cf.short_name FROM compliance_requirements cr LEFT JOIN compliance_frameworks cf ON cr.framework_id = cf.id WHERE cr.status IN ('Not Started', 'Non-Compliant') ORDER BY CASE cr.priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END, cr.due_date ASC LIMIT 50`);
      return (rows as any).rows ?? rows ?? [];
    }),
});

// ─── Advanced Stakeholder Management Router ───────────────────────────────────

export const advancedStakeholderRouter = router({
  listInteractions: publicProcedure
    .input(z.object({
      stakeholderId: z.number().optional(),
      ventureId: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const { stakeholderId, ventureId, limit } = input;
      let rows: any;
      if (stakeholderId && ventureId) {
        rows = await db.execute(sql`SELECT * FROM stakeholder_interactions WHERE stakeholder_id = ${stakeholderId} AND (venture_id = ${ventureId} OR venture_id = 'portfolio') ORDER BY date DESC LIMIT ${limit}`);
      } else if (stakeholderId) {
        rows = await db.execute(sql`SELECT * FROM stakeholder_interactions WHERE stakeholder_id = ${stakeholderId} ORDER BY date DESC LIMIT ${limit}`);
      } else if (ventureId) {
        rows = await db.execute(sql`SELECT * FROM stakeholder_interactions WHERE (venture_id = ${ventureId} OR venture_id = 'portfolio') ORDER BY date DESC LIMIT ${limit}`);
      } else {
        rows = await db.execute(sql`SELECT * FROM stakeholder_interactions ORDER BY date DESC LIMIT ${limit}`);
      }
      return (rows as any).rows ?? rows ?? [];
    }),

  addInteraction: protectedProcedure
    .input(z.object({
      stakeholderId: z.number(),
      ventureId: z.string().default("portfolio"),
      interactionType: z.enum(["Meeting","Email","Call","Presentation","Workshop","Negotiation","Conflict","Resolution","Other"]),
      date: z.number(),
      summary: z.string().min(1),
      sentiment: z.enum(["Very Positive","Positive","Neutral","Negative","Very Negative"]).default("Neutral"),
      commitments: z.string().optional(),
      followUpActions: z.string().optional(),
      followUpDue: z.number().optional(),
      missionAlignmentImpact: z.enum(["Strengthened","Neutral","Weakened"]).default("Neutral"),
      recordedBy: z.string().default("Founder"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const result = await db.execute(sql`INSERT INTO stakeholder_interactions (stakeholder_id, venture_id, interaction_type, date, summary, sentiment, commitments, follow_up_actions, follow_up_due, mission_alignment_impact, recorded_by, created_at) VALUES (${input.stakeholderId}, ${input.ventureId}, ${input.interactionType}, ${input.date}, ${input.summary}, ${input.sentiment}, ${input.commitments ?? null}, ${input.followUpActions ?? null}, ${input.followUpDue ?? null}, ${input.missionAlignmentImpact}, ${input.recordedBy}, ${Date.now()})`);
      return { id: (result as any).insertId ?? 0 };
    }),

  getEngagementScore: publicProcedure
    .input(z.object({ stakeholderId: z.number(), ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { score: 0, trend: "Stable", interactionCount: 0, lastInteraction: null };
      const rows = input.ventureId
        ? await db.execute(sql`SELECT COUNT(*) as total, MAX(date) as last_date, SUM(CASE WHEN sentiment IN ('Very Positive','Positive') THEN 1 ELSE 0 END) as positive, SUM(CASE WHEN sentiment IN ('Negative','Very Negative') THEN 1 ELSE 0 END) as negative, SUM(CASE WHEN mission_alignment_impact = 'Strengthened' THEN 2 WHEN mission_alignment_impact = 'Weakened' THEN -2 ELSE 0 END) as alignment_delta FROM stakeholder_interactions WHERE stakeholder_id = ${input.stakeholderId} AND (venture_id = ${input.ventureId} OR venture_id = 'portfolio')`)
        : await db.execute(sql`SELECT COUNT(*) as total, MAX(date) as last_date, SUM(CASE WHEN sentiment IN ('Very Positive','Positive') THEN 1 ELSE 0 END) as positive, SUM(CASE WHEN sentiment IN ('Negative','Very Negative') THEN 1 ELSE 0 END) as negative, SUM(CASE WHEN mission_alignment_impact = 'Strengthened' THEN 2 WHEN mission_alignment_impact = 'Weakened' THEN -2 ELSE 0 END) as alignment_delta FROM stakeholder_interactions WHERE stakeholder_id = ${input.stakeholderId}`);
      const data = ((rows as any).rows ?? rows ?? [])[0];
      if (!data || !data.total) return { score: 0, trend: "Stable", interactionCount: 0, lastInteraction: null };
      const total = Number(data.total);
      const positive = Number(data.positive);
      const negative = Number(data.negative);
      const alignmentDelta = Number(data.alignment_delta);
      const sentimentRatio = total > 0 ? (positive - negative) / total : 0;
      const score = Math.min(100, Math.max(0, Math.round(50 + sentimentRatio * 30 + alignmentDelta * 2 + Math.min(total * 2, 20))));
      const trend = score >= 70 ? "Improving" : score >= 40 ? "Stable" : "Declining";
      return { score, trend, interactionCount: total, lastInteraction: data.last_date };
    }),

  getInfluenceMatrix: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = input?.ventureId
        ? await db.execute(sql`SELECT sp.*, COUNT(si.id) as interaction_count, MAX(si.date) as last_interaction, AVG(CASE WHEN si.sentiment = 'Very Positive' THEN 5 WHEN si.sentiment = 'Positive' THEN 4 WHEN si.sentiment = 'Neutral' THEN 3 WHEN si.sentiment = 'Negative' THEN 2 WHEN si.sentiment = 'Very Negative' THEN 1 ELSE 3 END) as avg_sentiment FROM stakeholder_profiles sp LEFT JOIN stakeholder_interactions si ON sp.id = si.stakeholder_id WHERE (sp.ventureId = ${input.ventureId} OR sp.ventureId = 'portfolio') GROUP BY sp.id ORDER BY sp.influenceLevel DESC`)
        : await db.execute(sql`SELECT sp.*, COUNT(si.id) as interaction_count, MAX(si.date) as last_interaction, AVG(CASE WHEN si.sentiment = 'Very Positive' THEN 5 WHEN si.sentiment = 'Positive' THEN 4 WHEN si.sentiment = 'Neutral' THEN 3 WHEN si.sentiment = 'Negative' THEN 2 WHEN si.sentiment = 'Very Negative' THEN 1 ELSE 3 END) as avg_sentiment FROM stakeholder_profiles sp LEFT JOIN stakeholder_interactions si ON sp.id = si.stakeholder_id GROUP BY sp.id ORDER BY sp.influenceLevel DESC`);
      return (rows as any).rows ?? rows ?? [];
    }),

  getFollowUps: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const rows = await db.execute(sql`SELECT si.*, sp.name as stakeholder_name, sp.category as stakeholder_category FROM stakeholder_interactions si LEFT JOIN stakeholder_profiles sp ON si.stakeholder_id = sp.id WHERE si.follow_up_due IS NOT NULL AND si.follow_up_actions IS NOT NULL AND si.follow_up_due > ${cutoff} ORDER BY si.follow_up_due ASC LIMIT 20`);
      return (rows as any).rows ?? rows ?? [];
    }),

  getMissionAlignmentTrend: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { strengthened: 0, neutral: 0, weakened: 0, netScore: 0 };
      const rows = input?.ventureId
        ? await db.execute(sql`SELECT mission_alignment_impact, COUNT(*) as count FROM stakeholder_interactions WHERE (venture_id = ${input.ventureId} OR venture_id = 'portfolio') GROUP BY mission_alignment_impact`)
        : await db.execute(sql`SELECT mission_alignment_impact, COUNT(*) as count FROM stakeholder_interactions GROUP BY mission_alignment_impact`);
      const data = (rows as any).rows ?? rows ?? [];
      let strengthened = 0, neutral = 0, weakened = 0;
      for (const row of data) {
        if (row.mission_alignment_impact === "Strengthened") strengthened = Number(row.count);
        else if (row.mission_alignment_impact === "Neutral") neutral = Number(row.count);
        else if (row.mission_alignment_impact === "Weakened") weakened = Number(row.count);
      }
      const total = strengthened + neutral + weakened;
      const netScore = total > 0 ? Math.round(((strengthened - weakened) / total) * 100) : 0;
      return { strengthened, neutral, weakened, netScore };
    }),
});
