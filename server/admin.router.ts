// ============================================================
// ADMIN MODULE ROUTER
// Covers: Users & Roles, Permissions, Playbook Library,
//         Templates, Data Fields, Module Settings,
//         Integrations, API Settings, Audit Logs,
//         System Configuration
// Read queries: publicProcedure (no session required).
// Write/mutation procedures: protectedProcedure (auth required).
// Admin-only mutations additionally check ctx.user.role === "admin".
// ============================================================
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure, adminProcedure } from "./_core/trpc";
import { normaliseResetVentureId, normaliseSetVentureId, execVentureReset, assertBatchRowResult } from "./moduleReactivationUtils";
import { getDb } from "./db";
import {
  playbookLibrary, playbookVersions, adminTemplates, users,
  usersRoles, systemAuditLogs, ventures,
  systemDataFields, systemModuleStatus, systemConfiguration,
  systemWidgetAnalytics, systemIntegrations, systemApiKeys,
  moduleReactivations,
} from "../drizzle/schema";
import { eq, and, desc, asc, ilike, or } from "drizzle-orm";

// ── Helper: admin guard ───────────────────────────────────────────────────────
function requireAdmin(role: string) {
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
}

// ── Role mapping: display name → canonical auth role stored in users.role ─────
// Exported for unit testing.  The auth middleware (integrityReviewerProcedure,
// requireAdmin) reads users.role — these values must match exactly.
export const AUTH_ROLE_MAP: Record<string, string> = {
  "Studio Director":            "admin",
  "Platform Admin":             "admin",
  "Coach":                      "coach",
  "Founder":                    "founder",
  "Advisor":                    "advisor",
  "Investor":                   "investor",
  "Scoring Integrity Reviewer": "scoring_integrity_reviewer",
};

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
    list: publicProcedure
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
        const db = await getDb();
        if (!db) return { playbooks: [], total: 0 };
        const conditions: ReturnType<typeof eq>[] = [];
        if (input?.status)      conditions.push(eq(playbookLibrary.status, input.status));
        if (input?.category)    conditions.push(eq(playbookLibrary.category, input.category));
        if (input?.module)      conditions.push(eq(playbookLibrary.relatedModule, input.module));
        if (input?.accessLevel) conditions.push(eq(playbookLibrary.accessLevel, input.accessLevel));

        const rows = await db
          .select()
          .from(playbookLibrary)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(asc(playbookLibrary.playbookId))
          .limit(input?.limit ?? 50)
          .offset(input?.offset ?? 0);

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
    getById: publicProcedure
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
    getByPlaybookId: publicProcedure
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
    getByModule: publicProcedure
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

    // ── Playbook Library: Version history ────────────────────────────────────
    versions: publicProcedure
      .input(z.object({ playbookDbId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const rows = await db
          .select()
          .from(playbookVersions)
          .where(eq(playbookVersions.playbookDbId, input.playbookDbId))
          .orderBy(desc(playbookVersions.createdAt));
        return rows;
      }),

    // ── Playbook Library: Categories ─────────────────────────────────────────
    categories: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .selectDistinct({ category: playbookLibrary.category })
        .from(playbookLibrary)
        .orderBy(asc(playbookLibrary.category));
      return rows.map(r => r.category);
    }),

    // ── Playbook Library: Create ─────────────────────────────────────────────
    create: protectedProcedure
      .input(playbookInputSchema)
      .mutation(async ({ ctx, input }) => {
        requireAdmin(ctx.user.role);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

        const [last] = await db
          .select({ playbookId: playbookLibrary.playbookId })
          .from(playbookLibrary)
          .orderBy(desc(playbookLibrary.id))
          .limit(1);
        const nextNum = last
          ? parseInt(last.playbookId.replace("PB-", ""), 10) + 1
          : 1;
        const playbookId = `PB-${String(nextNum).padStart(3, "0")}`;

        await db.insert(playbookLibrary).values({
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
        return { playbookId };
      }),

    // ── Playbook Library: Update ─────────────────────────────────────────────
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: playbookInputSchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        requireAdmin(ctx.user.role);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

        const [existing] = await db
          .select()
          .from(playbookLibrary)
          .where(eq(playbookLibrary.id, input.id));
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Playbook not found" });

        await db.insert(playbookVersions).values({
          playbookDbId: existing.id,
          version:      existing.version,
          snapshot:     JSON.stringify(existing),
          changedBy:    ctx.user.name ?? ctx.user.openId,
          changeNote:   "Auto-snapshot before update",
        });

        const contentFields = ["purpose", "whenToUse", "stepByStepGuidance", "requiredInputs", "requiredOutputs"];
        const contentChanged = contentFields.some(f => (input.data as any)[f] !== undefined);
        let newVersion = existing.version;
        if (contentChanged) {
          const [major, minor] = (existing.version ?? "1.0").split(".").map(Number);
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
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
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
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
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
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
        await db
          .update(playbookLibrary)
          .set({ status: input.status, updatedBy: ctx.user.name ?? ctx.user.openId })
          .where(eq(playbookLibrary.id, input.id));
        return { success: true };
      }),
  },

  // ── Templates ─────────────────────────────────────────────────────────────
  templates: {
    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        fileType:  z.string().optional(),
        search:    z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const conditions: ReturnType<typeof eq>[] = [
          eq(adminTemplates.isActive, true),
        ];
        if (input?.category) conditions.push(eq(adminTemplates.category, input.category));
        if (input?.fileType)  conditions.push(eq(adminTemplates.fileType, input.fileType));
        const rows = await db
          .select()
          .from(adminTemplates)
          .where(and(...conditions))
          .orderBy(asc(adminTemplates.category), asc(adminTemplates.name));
        const search = input?.search?.toLowerCase();
        return search
          ? rows.filter(r =>
              r.name.toLowerCase().includes(search) ||
              (r.description ?? "").toLowerCase().includes(search) ||
              (r.category ?? "").toLowerCase().includes(search)
            )
          : rows;
      }),

    categories: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .selectDistinct({ category: adminTemplates.category })
        .from(adminTemplates)
        .where(eq(adminTemplates.isActive, true))
        .orderBy(asc(adminTemplates.category));
      return rows.map(r => r.category).filter(Boolean) as string[];
    }),
  },

  // ── Users & Roles ─────────────────────────────────────────────────────────
  users: {
    list: protectedProcedure.query(async ({ ctx }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(users).orderBy(asc(users.name));
      return rows;
    }),

    setRole: protectedProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["admin", "user"]) }))
      .mutation(async ({ ctx, input }) => {
        requireAdmin(ctx.user.role);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
        await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
        return { success: true };
      }),
  },

  // ── Update a user's system role ────────────────────────────────────────────
  // Updates BOTH the display table (users_roles.systemRole) AND the canonical
  // auth table (users.role) inside a single transaction, so that
  // integrityReviewerProcedure and requireAdmin see the new role on the user's
  // next authenticated request and the two tables can never diverge.
  updateUserRole: protectedProcedure
    .input(z.object({
      id:         z.number(),
      systemRole: z.enum([
        "Studio Director",
        "Platform Admin",
        "Coach",
        "Founder",
        "Advisor",
        "Investor",
        "Scoring Integrity Reviewer",
      ]),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const authRole = AUTH_ROLE_MAP[input.systemRole];

      await db.transaction(async tx => {
        // 1. Update the display/directory table and get the email for step 2.
        const [directoryRow] = await tx
          .update(usersRoles)
          .set({ systemRole: input.systemRole, updatedAt: new Date() })
          .where(eq(usersRoles.id, input.id))
          .returning({ email: usersRoles.email });

        if (!directoryRow) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User record not found in directory" });
        }

        // 2. Update the canonical auth table.  This MUST match at least one row
        //    because an unmatched update means the user has never signed in and
        //    the role assignment would have no effect on integrityReviewerProcedure.
        const authRows = await tx
          .update(users)
          .set({ role: authRole, updatedAt: new Date() })
          .where(eq(users.email, directoryRow.email))
          .returning({ id: users.id });

        if (authRows.length === 0) {
          // Roll back the directory update by throwing — the transaction aborts.
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              `No authenticated account found for ${directoryRow.email}. ` +
              "The user must sign in at least once before a role can be assigned.",
          });
        }
      });

      return { success: true };
    }),

  // ── Users & Roles (users_roles table) ─────────────────────────────────────
  // Admin-only: exposes PII (name, email) and role/venture data for all users.
  getUsersAndRoles: adminProcedure
    .input(z.object({
      search:     z.string().optional(),
      systemRole: z.string().optional(),
      ventureId:  z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select({
          id:                usersRoles.id,
          userName:          usersRoles.userName,
          email:             usersRoles.email,
          systemRole:        usersRoles.systemRole,
          assignedVentureId: usersRoles.assignedVentureId,
          isActive:          usersRoles.isActive,
          createdAt:         usersRoles.createdAt,
          ventureName:       ventures.name,
        })
        .from(usersRoles)
        .leftJoin(ventures, eq(usersRoles.assignedVentureId, ventures.id))
        .orderBy(asc(usersRoles.systemRole), asc(usersRoles.userName));

      let out = rows;
      if (input?.systemRole) out = out.filter(r => r.systemRole === input.systemRole);
      if (input?.ventureId)  out = out.filter(r => r.assignedVentureId === input.ventureId);
      if (input?.search) {
        const q = input.search.toLowerCase();
        out = out.filter(r =>
          r.userName.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.ventureName ?? "").toLowerCase().includes(q)
        );
      }
      return out;
    }),

  // ── Permissions Matrix (static definition) ────────────────────────────────
  getPermissionsLayout: publicProcedure.query(async () => {
    const ROLES = ["Studio Director", "Platform Admin", "Coach", "Founder"] as const;
    type Role = typeof ROLES[number];
    type Perms = { read: boolean; write: boolean; delete: boolean };

    const matrix: Array<{
      module: string;
      group: string;
      permissions: Record<Role, Perms>;
    }> = [
      {
        module: "Ventures — Create & Archive",
        group: "Core Operations",
        permissions: {
          "Studio Director": { read: true,  write: true,  delete: true  },
          "Platform Admin":  { read: true,  write: true,  delete: true  },
          "Coach":           { read: true,  write: false, delete: false },
          "Founder":         { read: true,  write: false, delete: false },
        },
      },
      {
        module: "Lean Canvas",
        group: "Core Operations",
        permissions: {
          "Studio Director": { read: true,  write: true,  delete: true  },
          "Platform Admin":  { read: true,  write: true,  delete: false },
          "Coach":           { read: true,  write: true,  delete: false },
          "Founder":         { read: true,  write: true,  delete: false },
        },
      },
      {
        module: "Hypothesis Register",
        group: "Validation",
        permissions: {
          "Studio Director": { read: true,  write: true,  delete: true  },
          "Platform Admin":  { read: true,  write: true,  delete: true  },
          "Coach":           { read: true,  write: true,  delete: false },
          "Founder":         { read: true,  write: true,  delete: false },
        },
      },
      {
        module: "Customer Interviews",
        group: "Validation",
        permissions: {
          "Studio Director": { read: true,  write: true,  delete: true  },
          "Platform Admin":  { read: true,  write: true,  delete: true  },
          "Coach":           { read: true,  write: true,  delete: false },
          "Founder":         { read: true,  write: true,  delete: false },
        },
      },
      {
        module: "VRL Scoring",
        group: "Scoring & Assessment",
        permissions: {
          "Studio Director": { read: true,  write: true,  delete: true  },
          "Platform Admin":  { read: true,  write: true,  delete: false },
          "Coach":           { read: true,  write: true,  delete: false },
          "Founder":         { read: true,  write: false, delete: false },
        },
      },
      {
        module: "TRL Assessment",
        group: "Scoring & Assessment",
        permissions: {
          "Studio Director": { read: true,  write: true,  delete: true  },
          "Platform Admin":  { read: true,  write: true,  delete: false },
          "Coach":           { read: true,  write: true,  delete: false },
          "Founder":         { read: true,  write: true,  delete: false },
        },
      },
      {
        module: "Stage-Gate Decisions",
        group: "Governance",
        permissions: {
          "Studio Director": { read: true,  write: true,  delete: true  },
          "Platform Admin":  { read: true,  write: true,  delete: false },
          "Coach":           { read: true,  write: false, delete: false },
          "Founder":         { read: true,  write: false, delete: false },
        },
      },
      {
        module: "Risk Register",
        group: "Governance",
        permissions: {
          "Studio Director": { read: true,  write: true,  delete: true  },
          "Platform Admin":  { read: true,  write: true,  delete: true  },
          "Coach":           { read: true,  write: true,  delete: false },
          "Founder":         { read: true,  write: true,  delete: false },
        },
      },
      {
        module: "Investment Pack & Data Room",
        group: "Investment",
        permissions: {
          "Studio Director": { read: true,  write: true,  delete: true  },
          "Platform Admin":  { read: true,  write: true,  delete: false },
          "Coach":           { read: true,  write: false, delete: false },
          "Founder":         { read: true,  write: true,  delete: false },
        },
      },
      {
        module: "R&D Hub / Prototypes",
        group: "Build",
        permissions: {
          "Studio Director": { read: true,  write: true,  delete: true  },
          "Platform Admin":  { read: true,  write: true,  delete: true  },
          "Coach":           { read: true,  write: true,  delete: false },
          "Founder":         { read: true,  write: true,  delete: false },
        },
      },
      {
        module: "Playbook Library",
        group: "Admin",
        permissions: {
          "Studio Director": { read: true,  write: true,  delete: true  },
          "Platform Admin":  { read: true,  write: true,  delete: true  },
          "Coach":           { read: true,  write: false, delete: false },
          "Founder":         { read: true,  write: false, delete: false },
        },
      },
      {
        module: "Users & Roles Management",
        group: "Admin",
        permissions: {
          "Studio Director": { read: true,  write: true,  delete: true  },
          "Platform Admin":  { read: true,  write: true,  delete: false },
          "Coach":           { read: false, write: false, delete: false },
          "Founder":         { read: false, write: false, delete: false },
        },
      },
      {
        module: "System Audit Logs",
        group: "Admin",
        permissions: {
          "Studio Director": { read: true,  write: false, delete: false },
          "Platform Admin":  { read: true,  write: false, delete: false },
          "Coach":           { read: false, write: false, delete: false },
          "Founder":         { read: false, write: false, delete: false },
        },
      },
      {
        module: "System Configuration",
        group: "Admin",
        permissions: {
          "Studio Director": { read: true,  write: true,  delete: false },
          "Platform Admin":  { read: true,  write: true,  delete: true  },
          "Coach":           { read: false, write: false, delete: false },
          "Founder":         { read: false, write: false, delete: false },
        },
      },
    ];
    return { roles: ROLES, matrix };
  }),

  // ── System Audit Logs ─────────────────────────────────────────────────────
  getSystemAuditLogs: publicProcedure
    .input(z.object({
      category:  z.string().optional(),
      module:    z.string().optional(),
      ventureId: z.string().optional(),
      limit:     z.number().min(1).max(200).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select({
          id:              systemAuditLogs.id,
          actorName:       systemAuditLogs.actorName,
          actorRole:       systemAuditLogs.actorRole,
          actionPerformed: systemAuditLogs.actionPerformed,
          targetModule:    systemAuditLogs.targetModule,
          targetVentureId: systemAuditLogs.targetVentureId,
          actionCategory:  systemAuditLogs.actionCategory,
          createdAt:       systemAuditLogs.createdAt,
          ventureName:     ventures.name,
        })
        .from(systemAuditLogs)
        .leftJoin(ventures, eq(systemAuditLogs.targetVentureId, ventures.id))
        .orderBy(desc(systemAuditLogs.createdAt))
        .limit(input?.limit ?? 100);

      let out = rows;
      if (input?.category) out = out.filter(r => r.actionCategory === input.category);
      if (input?.module)   out = out.filter(r => r.targetModule === input.module);
      if (input?.ventureId) out = out.filter(r => r.targetVentureId === input.ventureId);
      return out;
    }),

  // ── Data Field Definitions ────────────────────────────────────────────────
  getDataFieldsDefinitions: publicProcedure
    .input(z.object({
      fieldGroup: z.string().optional(),
      search:     z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(systemDataFields)
        .orderBy(asc(systemDataFields.fieldGroup), asc(systemDataFields.fieldKey));
      let out = rows;
      if (input?.fieldGroup) out = out.filter(r => r.fieldGroup === input.fieldGroup);
      if (input?.search) {
        const q = input.search.toLowerCase();
        out = out.filter(r =>
          r.fieldKey.toLowerCase().includes(q) ||
          r.fieldLabel.toLowerCase().includes(q) ||
          (r.description ?? "").toLowerCase().includes(q)
        );
      }
      return out;
    }),

  // ── Module Statuses ───────────────────────────────────────────────────────
  getModuleStatuses: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(systemModuleStatus)
      .orderBy(asc(systemModuleStatus.moduleNumber));
  }),

  toggleModuleStatus: publicProcedure
    .input(z.object({ moduleNumber: z.number(), isEnabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db
        .update(systemModuleStatus)
        .set({ isEnabled: input.isEnabled })
        .where(eq(systemModuleStatus.moduleNumber, input.moduleNumber));
      return { success: true, moduleNumber: input.moduleNumber, isEnabled: input.isEnabled };
    }),

  // ── System Configuration ──────────────────────────────────────────────────
  getSystemConfigVariables: publicProcedure
    .input(z.object({ configGroup: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(systemConfiguration)
        .orderBy(asc(systemConfiguration.configGroup), asc(systemConfiguration.configKey));
      return input?.configGroup
        ? rows.filter(r => r.configGroup === input.configGroup)
        : rows;
    }),

  updateSystemConfig: publicProcedure
    .input(z.object({ configKey: z.string(), configValue: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const row = await db
        .select({ isEditable: systemConfiguration.isEditable })
        .from(systemConfiguration)
        .where(eq(systemConfiguration.configKey, input.configKey))
        .limit(1);
      if (!row[0]?.isEditable) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This configuration key is read-only." });
      }
      await db
        .update(systemConfiguration)
        .set({ configValue: input.configValue, updatedAt: new Date() })
        .where(eq(systemConfiguration.configKey, input.configKey));
      return { success: true, configKey: input.configKey };
    }),

  // ── Widget Telemetry ──────────────────────────────────────────────────────
  getWidgetTelemetry: publicProcedure
    .input(z.object({ widgetGroup: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(systemWidgetAnalytics)
        .orderBy(desc(systemWidgetAnalytics.pageViews));
      return input?.widgetGroup
        ? rows.filter(r => r.widgetGroup === input.widgetGroup)
        : rows;
    }),

  // ── Integration Directory ─────────────────────────────────────────────────
  getIntegrationDirectory: publicProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(systemIntegrations)
        .orderBy(desc(systemIntegrations.isConnected), asc(systemIntegrations.serviceName));
      return input?.category
        ? rows.filter(r => r.category === input.category)
        : rows;
    }),

  toggleIntegrationStatus: publicProcedure
    .input(z.object({ serviceSlug: z.string(), isConnected: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db
        .update(systemIntegrations)
        .set({
          isConnected: input.isConnected,
          lastSyncTime: input.isConnected ? new Date() : null,
          syncStatus: input.isConnected ? "synced" : "idle",
        })
        .where(eq(systemIntegrations.serviceSlug, input.serviceSlug));
      return { success: true, serviceSlug: input.serviceSlug, isConnected: input.isConnected };
    }),

  // ── API Tokens ────────────────────────────────────────────────────────────
  getApiTokens: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(systemApiKeys)
      .orderBy(desc(systemApiKeys.createdAt));
  }),

  revokeApiKey: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db
        .update(systemApiKeys)
        .set({ status: "Revoked" })
        .where(eq(systemApiKeys.id, input.id));
      return { success: true };
    }),

  generateNewApiKey: publicProcedure
    .input(z.object({ keyName: z.string(), scopes: z.string().optional(), createdBy: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const suffix = Math.random().toString(36).slice(2, 6);
      const maskedToken = `sk_live_••••••••••••${suffix}`;
      const [row] = await db
        .insert(systemApiKeys)
        .values({
          keyName:     input.keyName,
          maskedToken,
          tokenPrefix: "sk_live",
          status:      "Active",
          scopes:      input.scopes ?? "read:ventures",
          createdBy:   input.createdBy ?? "Admin",
        })
        .returning();
      return row;
    }),

  // ── Gate 4: Module Reactivations ──────────────────────────────────────────
  // Returns all reactivation rows.  "__global__" is the sentinel for global scope.
  // publicProcedure intentionally: read-only, no sensitive data.
  getModuleReactivations: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(moduleReactivations)
        .orderBy(moduleReactivations.groupId);
      return rows;
    }),

  // Upsert a single group's activation state.
  // ventureId omitted / null → stored as "__global__" (global scope sentinel).
  // Admin-only: uses adminProcedure so non-admins receive a 403.
  setModuleReactivation: adminProcedure
    .input(z.object({
      groupId:   z.string().min(1).max(64),
      ventureId: z.string().optional(),   // omit or "" → global scope
      active:    z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Fallback to a clearly-labeled sentinel rather than null so the audit
      // line never goes blank.  adminProcedure already guarantees ctx.user is
      // present; this guards the unlikely case where all identity fields are
      // empty (e.g. auth middleware misconfiguration).
      const toggledBy =
        ctx.user.name ?? ctx.user.email ?? ctx.user.openId ?? "[anonymous admin]";
      // Normalise: empty / missing / whitespace-only → "__global__" sentinel
      const ventureId = normaliseSetVentureId(input.ventureId);

      const written = await db
        .insert(moduleReactivations)
        .values({
          groupId:   input.groupId,
          ventureId,
          active:    input.active,
          toggledBy,
          toggledAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [moduleReactivations.groupId, moduleReactivations.ventureId],
          set: {
            active:    input.active,
            toggledBy,
            toggledAt: new Date(),
          },
        })
        .returning({
          groupId:   moduleReactivations.groupId,
          ventureId: moduleReactivations.ventureId,
        });

      // Integrity check: the DB must confirm exactly one row whose composite key
      // (groupId, ventureId) matches what we submitted.
      // Zero rows means a silent skip (e.g. a partial-index DO-NOTHING variant).
      // More than one row means a trigger or schema change produced extra rows.
      // A mismatched groupId or ventureId means the conflict clause resolved against
      // a different record (e.g. same group in a different venture scope).
      if (written.length !== 1) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            `Single-toggle integrity error: expected 1 confirmed row from DB for ` +
            `groupId "${input.groupId}" / ventureId "${ventureId}", got ${written.length}.`,
        });
      }

      if (written[0].groupId !== input.groupId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            `Single-toggle integrity error: DB confirmed groupId "${written[0].groupId}" ` +
            `but expected "${input.groupId}". The returned row does not correspond to the submitted item.`,
        });
      }

      if (written[0].ventureId !== ventureId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            `Single-toggle integrity error: DB confirmed ventureId "${written[0].ventureId}" ` +
            `but expected "${ventureId}". The returned row does not correspond to the submitted item.`,
        });
      }

      return { success: true, groupId: input.groupId, active: input.active };
    }),

  // Batch upsert: accepts an array of { groupId, active } and a single ventureId,
  // processed atomically inside a DB transaction.  This prevents the race where 15
  // individual mutations from reactivateAll / deactivateAll interleave with a
  // concurrent admin doing the same operation on the same venture.
  setModuleReactivationBatch: adminProcedure
    .input(z.object({
      ventureId: z.string().optional(),   // omit or "" → global scope
      items: z.array(z.object({
        groupId: z.string().min(1).max(64).refine(s => s.trim().length > 0, {
          message: "groupId must not be blank or whitespace-only",
        }),
        active:  z.boolean(),
      })).min(1).max(50),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Same fallback as setModuleReactivation: never store null for toggledBy.
      const toggledBy =
        ctx.user.name ?? ctx.user.email ?? ctx.user.openId ?? "[anonymous admin]";
      // Normalise: empty / missing / whitespace-only → "__global__" sentinel
      const ventureId = normaliseSetVentureId(input.ventureId);
      const now = new Date();

      // Collect the groupId of every row the DB confirms it wrote.
      // Using .returning() means we get back the actual DB-confirmed record,
      // not just the input we handed in.  If a future code change silently
      // skips an item (e.g. a conditional guard, a violated partial-index
      // that suppresses the upsert without aborting the transaction), the
      // returned array will be shorter than input.items and we surface it.
      // Collect the groupId of every row the DB confirms it wrote via .returning().
      // This check runs INSIDE the transaction so that detecting fewer confirmed
      // rows than requested causes the transaction to roll back — no partial state
      // is committed and the admin UI will see a thrown error rather than a
      // misleadingly successful response with a low count.
      const upserted: string[] = [];

      await db.transaction(async tx => {
        for (const item of input.items) {
          const written = await tx
            .insert(moduleReactivations)
            .values({
              groupId:   item.groupId,
              ventureId,
              active:    item.active,
              toggledBy,
              toggledAt: now,
            })
            .onConflictDoUpdate({
              target: [moduleReactivations.groupId, moduleReactivations.ventureId],
              set: {
                active:    item.active,
                toggledBy,
                toggledAt: now,
              },
            })
            .returning({ groupId: moduleReactivations.groupId });

          // Per-row integrity: assertBatchRowResult throws INTERNAL_SERVER_ERROR
          // when .returning() yields zero rows (silent skip) or more than one
          // row (trigger producing extras), or when the confirmed groupId doesn't
          // match the submitted item.  Because this call is inside the transaction
          // callback, any throw causes Drizzle to roll back the entire batch.
          assertBatchRowResult(written, item.groupId);

          upserted.push(written[0].groupId);
        }

        // NOTE: An aggregate count check (upserted.length !== input.items.length)
        // was intentionally removed here.  The per-row check above (written.length !== 1)
        // already throws — and therefore aborts the transaction — whenever any single
        // item is silently skipped or produces an unexpected number of rows.  Because
        // each loop iteration either pushes exactly one entry onto `upserted` or throws,
        // `upserted.length` is always equal to `input.items.length` when this point is
        // reached, making a separate aggregate guard permanently unreachable dead code.
      });

      return { success: true, count: upserted.length, upserted };
    }),

  // Delete all venture-specific module_reactivations rows for a given venture,
  // causing that venture to fall back to global defaults.
  // Only meaningful for a real ventureId — passing "__global__" is rejected.
  resetVentureModuleReactivations: adminProcedure
    .input(z.object({
      ventureId: z.string().min(1).max(128),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // normaliseResetVentureId trims whitespace and rejects the __global__
      // sentinel with BAD_REQUEST.  Extracting this into a standalone function
      // allows it to be unit-tested without importing the full Drizzle schema.
      const vid = normaliseResetVentureId(input.ventureId);

      // execVentureReset is extracted so the delete predicate (ventureId-only,
      // no per-writer filter) can be unit-tested without importing the schema.
      // It now returns the number of rows the DB actually deleted so the caller
      // can detect a zero-row result (unknown ventureId) instead of silently
      // reporting success with no audit trace.
      const deletedCount = await execVentureReset(db, moduleReactivations, eq, moduleReactivations.ventureId, vid);

      return { success: true, ventureId: vid, deletedCount };
    }),
});

export type AdminRouter = typeof adminRouter;
