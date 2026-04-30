// ============================================================
// ADMIN MODULE ROUTER
// Covers: Users & Roles, Permissions, Playbook Library,
//         Templates, Data Fields, Module Settings,
//         Integrations, API Settings, Audit Logs,
//         System Configuration
// All procedures are protectedProcedure (auth required).
// Admin-only procedures check ctx.user.role === "admin".
// ============================================================
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { playbookLibrary, playbookVersions, users } from "../drizzle/schema";
import { eq, like, or, and, desc, asc } from "drizzle-orm";

// ── Helper: admin guard ───────────────────────────────────────────────────────
function requireAdmin(role: string) {
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
}

// ── Playbook status and access level enums ────────────────────────────────────
const PLAYBOOK_STATUSES = ["Draft", "Under Review", "Approved", "Published", "Archived", "Superseded"] as const;
const ACCESS_LEVELS = [
  "Admin Only",
  "Internal Team",
  "Venture Team",
  "Advisor Access",
  "Academic Partner Access",
  "Investor View",
  "Public / Exportable",
] as const;

const playbookInputSchema = z.object({
  title:                   z.string().min(1).max(255),
  category:                z.string().min(1).max(128),
  relatedModule:           z.string().max(128).optional(),
  relatedWorkflowStage:    z.string().max(128).optional(),
  userRole:                z.string().max(255).optional(),
  purpose:                 z.string().optional(),
  whenToUse:               z.string().optional(),
  stepByStepGuidance:      z.string().optional(), // JSON string
  requiredInputs:          z.string().optional(), // JSON string
  requiredOutputs:         z.string().optional(), // JSON string
  linkedTemplates:         z.string().optional(), // JSON string
  linkedScoringFrameworks: z.string().optional(), // JSON string
  linkedRiskCategories:    z.string().optional(), // JSON string
  evidenceRequired:        z.string().optional(), // JSON string
  completionChecklist:     z.string().optional(), // JSON string
  approvalRequired:        z.boolean().optional(),
  accessLevel:             z.enum(ACCESS_LEVELS).optional(),
  status:                  z.enum(PLAYBOOK_STATUSES).optional(),
  owner:                   z.string().max(128).optional(),
  reviewDate:              z.string().max(32).optional(),
});

export const adminRouter = router({
  // ── Playbook Library: List ─────────────────────────────────────────────────
  playbooks: {
    list: protectedProcedure
      .input(z.object({
        search:   z.string().optional(),
        category: z.string().optional(),
        status:   z.enum(PLAYBOOK_STATUSES).optional(),
        module:   z.string().optional(),
        role:     z.string().optional(),
        accessLevel: z.enum(ACCESS_LEVELS).optional(),
        limit:    z.number().min(1).max(100).default(50),
        offset:   z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => {
        const conditions: ReturnType<typeof eq>[] = [];
        if (input?.status)      conditions.push(eq(playbookLibrary.status, input.status));
        if (input?.category)    conditions.push(eq(playbookLibrary.category, input.category));
        if (input?.module)      conditions.push(eq(playbookLibrary.relatedModule, input.module));
        if (input?.accessLevel) conditions.push(eq(playbookLibrary.accessLevel, input.accessLevel));

        const db = await getDb();
        if (!db) return { playbooks: [], total: 0 };
        const rows = await db
          .select()
          .from(playbookLibrary)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(asc(playbookLibrary.playbookId))
          .limit(input?.limit ?? 50)
          .offset(input?.offset ?? 0);

        // Apply search filter in memory (title, category, purpose)
        const search = input?.search?.toLowerCase();
        const filtered = search
          ? rows.filter(r =>
              r.title.toLowerCase().includes(search) ||
              r.category.toLowerCase().includes(search) ||
              (r.purpose ?? "").toLowerCase().includes(search) ||
              (r.relatedModule ?? "").toLowerCase().includes(search)
            )
          : rows;

        return { playbooks: filtered, total: filtered.length };
      }),

    // ── Playbook Library: Get by ID ──────────────────────────────────────────
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
        const [row] = await db
          .select()
          .from(playbookLibrary)
          .where(eq(playbookLibrary.id, input.id));
        if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Playbook not found" });
        return row;
      }),

    // ── Playbook Library: Get by playbookId string ───────────────────────────
    getByPlaybookId: protectedProcedure
      .input(z.object({ playbookId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
        const [row] = await db
          .select()
          .from(playbookLibrary)
          .where(eq(playbookLibrary.playbookId, input.playbookId));
        if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Playbook not found" });
        return row;
      }),

    // ── Playbook Library: Get by module (contextual display) ─────────────────
    getByModule: protectedProcedure
      .input(z.object({ module: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const rows = await db
          .select()
          .from(playbookLibrary)
          .where(
            and(
              eq(playbookLibrary.relatedModule, input.module),
              eq(playbookLibrary.status, "Published"),
            )
          )
          .orderBy(asc(playbookLibrary.playbookId));
        return rows;
      }),

    // ── Playbook Library: Create ─────────────────────────────────────────────
    create: protectedProcedure
      .input(playbookInputSchema)
      .mutation(async ({ ctx, input }) => {
        requireAdmin(ctx.user.role);
        // Generate next playbookId
        const [last] = await db
          .select({ playbookId: playbookLibrary.playbookId })
          .from(playbookLibrary)
          .orderBy(desc(playbookLibrary.id))
          .limit(1);
        const nextNum = last
          ? parseInt(last.playbookId.replace("PB-", ""), 10) + 1
          : 1;
        const playbookId = `PB-${String(nextNum).padStart(3, "0")}`;

        const [result] = await db.insert(playbookLibrary).values({
          playbookId,
          title:                   input.title,
          category:                input.category,
          relatedModule:           input.relatedModule,
          relatedWorkflowStage:    input.relatedWorkflowStage,
          userRole:                input.userRole,
          purpose:                 input.purpose,
          whenToUse:               input.whenToUse,
          stepByStepGuidance:      input.stepByStepGuidance,
          requiredInputs:          input.requiredInputs,
          requiredOutputs:         input.requiredOutputs,
          linkedTemplates:         input.linkedTemplates,
          linkedScoringFrameworks: input.linkedScoringFrameworks,
          linkedRiskCategories:    input.linkedRiskCategories,
          evidenceRequired:        input.evidenceRequired,
          completionChecklist:     input.completionChecklist,
          approvalRequired:        input.approvalRequired ?? false,
          accessLevel:             input.accessLevel ?? "Internal Team",
          version:                 "1.0",
          status:                  input.status ?? "Draft",
          owner:                   input.owner,
          reviewDate:              input.reviewDate,
          createdBy:               ctx.user.name ?? ctx.user.openId,
          updatedBy:               ctx.user.name ?? ctx.user.openId,
        });
        return { playbookId, insertId: (result as any).insertId };
      }),

    // ── Playbook Library: Update ─────────────────────────────────────────────
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: playbookInputSchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        requireAdmin(ctx.user.role);
        const [existing] = await db
          .select()
          .from(playbookLibrary)
          .where(eq(playbookLibrary.id, input.id));
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Playbook not found" });

        // Save version snapshot before update
        await db.insert(playbookVersions).values({
          playbookDbId: existing.id,
          version:      existing.version,
          snapshot:     JSON.stringify(existing),
          changedBy:    ctx.user.name ?? ctx.user.openId,
          changeNote:   "Auto-snapshot before update",
        });

        // Bump version if content fields changed
        const contentFields = ["purpose", "whenToUse", "stepByStepGuidance", "requiredInputs", "requiredOutputs"];
        const contentChanged = contentFields.some(f => (input.data as any)[f] !== undefined);
        let newVersion = existing.version;
        if (contentChanged) {
          const [major, minor] = existing.version.split(".").map(Number);
          newVersion = `${major}.${(minor ?? 0) + 1}`;
        }

        await db
          .update(playbookLibrary)
          .set({
            ...input.data,
            version:   newVersion,
            updatedBy: ctx.user.name ?? ctx.user.openId,
          })
          .where(eq(playbookLibrary.id, input.id));

        return { success: true, newVersion };
      }),

    // ── Playbook Library: Publish ────────────────────────────────────────────
    publish: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        requireAdmin(ctx.user.role);
        await db
          .update(playbookLibrary)
          .set({ status: "Published", updatedBy: ctx.user.name ?? ctx.user.openId })
          .where(eq(playbookLibrary.id, input.id));
        return { success: true };
      }),

    // ── Playbook Library: Archive ────────────────────────────────────────────
    archive: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        requireAdmin(ctx.user.role);
        await db
          .update(playbookLibrary)
          .set({ status: "Archived", updatedBy: ctx.user.name ?? ctx.user.openId })
          .where(eq(playbookLibrary.id, input.id));
        return { success: true };
      }),

    // ── Playbook Library: Change status ─────────────────────────────────────
    setStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(PLAYBOOK_STATUSES) }))
      .mutation(async ({ ctx, input }) => {
        requireAdmin(ctx.user.role);
        await db
          .update(playbookLibrary)
          .set({ status: input.status, updatedBy: ctx.user.name ?? ctx.user.openId })
          .where(eq(playbookLibrary.id, input.id));
        return { success: true };
      }),

    // ── Playbook Library: Version history ────────────────────────────────────
    versions: protectedProcedure
      .input(z.object({ playbookDbId: z.number() }))
      .query(async ({ input }) => {
        const rows = await db
          .select()
          .from(playbookVersions)
          .where(eq(playbookVersions.playbookDbId, input.playbookDbId))
          .orderBy(desc(playbookVersions.createdAt));
        return rows;
      }),

    // ── Playbook Library: Categories ─────────────────────────────────────────
    categories: protectedProcedure.query(async () => {
      const rows = await db
        .selectDistinct({ category: playbookLibrary.category })
        .from(playbookLibrary)
        .orderBy(asc(playbookLibrary.category));
      return rows.map(r => r.category);
    }),
  },

  // ── Users & Roles ─────────────────────────────────────────────────────────
  users: {
    list: protectedProcedure.query(async ({ ctx }) => {
      requireAdmin(ctx.user.role);
      const rows = await db.select().from(users).orderBy(asc(users.name));
      return rows;
    }),

    setRole: protectedProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["admin", "user"]) }))
      .mutation(async ({ ctx, input }) => {
        requireAdmin(ctx.user.role);
        await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
        return { success: true };
      }),
  },
});

export type AdminRouter = typeof adminRouter;
