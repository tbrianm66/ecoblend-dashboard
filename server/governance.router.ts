import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  auditLog,
  venturePermissions,
  governancePolicies,
  complianceChecks,
  riskRegister,
} from "../drizzle/schema";
import { eq, desc, and, like, or } from "drizzle-orm";

// ── Audit Log ─────────────────────────────────────────────────────────────────
const auditLogRouter = router({
  list: publicProcedure
    .input(z.object({
      module: z.string().optional(),
      userId: z.string().optional(),
      ventureId: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().default(100),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [];
      if (input.module) conditions.push(eq(auditLog.module, input.module));
      if (input.userId) conditions.push(eq(auditLog.userId, input.userId));
      if (input.ventureId) conditions.push(eq(auditLog.ventureId, input.ventureId));
      if (input.status) conditions.push(eq(auditLog.status, input.status));
      const rows = await db!.select().from(auditLog)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(auditLog.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      return rows;
    }),

  create: protectedProcedure
    .input(z.object({
      userId: z.string().optional(),
      userName: z.string().optional(),
      action: z.string(),
      module: z.string(),
      resourceType: z.string().optional(),
      resourceId: z.string().optional(),
      ventureId: z.string().optional(),
      before: z.string().optional(),
      after: z.string().optional(),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
      status: z.string().default("success"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [result] = await db!.insert(auditLog).values(input);
      return { id: (result as any).insertId };
    }),

  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    const rows = await db!.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(500);
    const total = rows.length;
    const failed = rows.filter(r => r.status === "failed").length;
    const blocked = rows.filter(r => r.status === "blocked").length;
    const modules = Array.from(new Set(rows.map(r => r.module)));
    const recentActivity = rows.slice(0, 10);
    return { total, failed, blocked, modules, recentActivity };
  }),
});

// ── Venture Permissions ───────────────────────────────────────────────────────
const permissionsRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db!.select().from(venturePermissions)
        .where(input.ventureId ? eq(venturePermissions.ventureId, input.ventureId) : undefined)
        .orderBy(desc(venturePermissions.createdAt));
      return rows;
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string(),
      userId: z.string(),
      role: z.enum(["owner", "editor", "viewer", "advisor", "investor"]).default("viewer"),
      grantedBy: z.string().optional(),
      notes: z.string().optional(),
      isActive: z.number().default(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (input.id) {
        await db!.update(venturePermissions).set({ ...input }).where(eq(venturePermissions.id, input.id));
        return { id: input.id };
      }
      const [result] = await db!.insert(venturePermissions).values(input);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.delete(venturePermissions).where(eq(venturePermissions.id, input.id));
      return { success: true };
    }),
});

// ── Governance Policies ───────────────────────────────────────────────────────
const policiesRouter = router({
  list: publicProcedure
    .input(z.object({ module: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db!.select().from(governancePolicies)
        .where(input.module ? eq(governancePolicies.module, input.module) : undefined)
        .orderBy(governancePolicies.module);
      return rows;
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      policyName: z.string(),
      module: z.string(),
      allowedRoles: z.string(),
      permissionLevel: z.enum(["read", "write", "admin", "none"]).default("read"),
      description: z.string().optional(),
      isActive: z.number().default(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (input.id) {
        await db!.update(governancePolicies).set({ ...input }).where(eq(governancePolicies.id, input.id));
        return { id: input.id };
      }
      const [result] = await db!.insert(governancePolicies).values(input);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.delete(governancePolicies).where(eq(governancePolicies.id, input.id));
      return { success: true };
    }),
});

// ── Compliance Checks ─────────────────────────────────────────────────────────
const complianceRouter = router({
  list: publicProcedure
    .input(z.object({
      ventureId: z.string().optional(),
      framework: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [];
      if (input.ventureId) conditions.push(eq(complianceChecks.ventureId, input.ventureId));
      if (input.framework) conditions.push(eq(complianceChecks.framework, input.framework));
      if (input.status) conditions.push(eq(complianceChecks.status, input.status as any));
      const rows = await db!.select().from(complianceChecks)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(complianceChecks.framework);
      return rows;
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      framework: z.string(),
      requirement: z.string(),
      status: z.enum(["not_started","in_progress","compliant","non_compliant","exempt","under_review"]).default("not_started"),
      owner: z.string().optional(),
      dueDate: z.string().optional(),
      evidenceUrl: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (input.id) {
        await db!.update(complianceChecks).set({ ...input }).where(eq(complianceChecks.id, input.id));
        return { id: input.id };
      }
      const [result] = await db!.insert(complianceChecks).values(input);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.delete(complianceChecks).where(eq(complianceChecks.id, input.id));
      return { success: true };
    }),

  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    const rows = await db!.select().from(complianceChecks);
    const total = rows.length;
    const compliant = rows.filter(r => r.status === "compliant").length;
    const nonCompliant = rows.filter(r => r.status === "non_compliant").length;
    const inProgress = rows.filter(r => r.status === "in_progress").length;
    const frameworks = Array.from(new Set(rows.map(r => r.framework)));
    const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;
    return { total, compliant, nonCompliant, inProgress, frameworks, complianceRate };
  }),
});

// ── Risk Register ─────────────────────────────────────────────────────────────
const riskRegisterRouter = router({
  list: publicProcedure
    .input(z.object({
      ventureId: z.string().optional(),
      category: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [];
      if (input.ventureId) conditions.push(eq(riskRegister.ventureId, input.ventureId));
      if (input.category) conditions.push(eq(riskRegister.category, input.category as any));
      if (input.status) conditions.push(eq(riskRegister.status, input.status as any));
      const rows = await db!.select().from(riskRegister)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(riskRegister.createdAt));
      return rows;
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      title: z.string(),
      category: z.enum(["strategic","operational","financial","legal","technical","reputational","environmental"]).default("operational"),
      likelihood: z.number().min(1).max(5).default(3),
      impact: z.number().min(1).max(5).default(3),
      status: z.enum(["open","mitigated","accepted","closed","escalated"]).default("open"),
      owner: z.string().optional(),
      mitigationPlan: z.string().optional(),
      residualRisk: z.number().optional(),
      reviewDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const riskScore = input.likelihood * input.impact;
      const data = { ...input, riskScore };
      if (input.id) {
        await db!.update(riskRegister).set(data).where(eq(riskRegister.id, input.id));
        return { id: input.id };
      }
      const [result] = await db!.insert(riskRegister).values(data);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.delete(riskRegister).where(eq(riskRegister.id, input.id));
      return { success: true };
    }),

  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    const rows = await db!.select().from(riskRegister);
    const total = rows.length;
    const open = rows.filter(r => r.status === "open").length;
    const escalated = rows.filter(r => r.status === "escalated").length;
    const mitigated = rows.filter(r => r.status === "mitigated").length;
    const highRisk = rows.filter(r => (r.riskScore ?? 0) >= 15).length;
    const avgScore = total > 0 ? Math.round(rows.reduce((s, r) => s + (r.riskScore ?? 0), 0) / total) : 0;
    return { total, open, escalated, mitigated, highRisk, avgScore };
  }),
});

// ── Summary ───────────────────────────────────────────────────────────────────
const governanceSummaryRouter = router({
  get: publicProcedure.query(async () => {
    const db = await getDb();
    const [auditRows, permRows, policyRows, compRows, riskRows] = await Promise.all([
      db!.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(200),
      db!.select().from(venturePermissions).where(eq(venturePermissions.isActive, 1)),
      db!.select().from(governancePolicies).where(eq(governancePolicies.isActive, 1)),
      db!.select().from(complianceChecks),
      db!.select().from(riskRegister),
    ]);
    return {
      auditEvents: auditRows.length,
      activePermissions: permRows.length,
      activePolicies: policyRows.length,
      complianceRate: compRows.length > 0
        ? Math.round((compRows.filter(r => r.status === "compliant").length / compRows.length) * 100)
        : 0,
      openRisks: riskRows.filter(r => r.status === "open").length,
      highRisks: riskRows.filter(r => (r.riskScore ?? 0) >= 15).length,
      recentAuditEvents: auditRows.slice(0, 5),
    };
  }),
});

// ── Export ────────────────────────────────────────────────────────────────────
export const governanceRouter = router({
  auditLog: auditLogRouter,
  permissions: permissionsRouter,
  policies: policiesRouter,
  compliance: complianceRouter,
  riskRegister: riskRegisterRouter,
  summary: governanceSummaryRouter,
});
