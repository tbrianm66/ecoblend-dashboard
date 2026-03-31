/**
 * Sprint 72 — G Drive Workspace Automation Router
 * EcoBlend V4 Architecture Brief — Section 1
 *
 * 11-folder taxonomy per V4 spec:
 * 00_Venture_Control, 01_Problem_and_Insight, 02_Product_and_IP,
 * 03_Market_and_Commercial, 04_Build_and_Operations, 05_Data_and_Intelligence,
 * 06_Brand_and_Growth, 07_Finance_and_Investment, 08_Legal_and_Compliance,
 * 09_Spin_Out_Pack, 10_Archive
 *
 * Permission matrix: 6 roles × 11 modules
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  gdWorkspaces,
  gdFolders,
  gdPermissions,
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

// ── 11-folder taxonomy per V4 Architecture Brief Section 1.1 ─────────────────
const MODULE_TAXONOMY = [
  { number: "00", name: "Venture_Control",        subFolders: ["Vision_and_Strategy", "OKRs", "Board_Pack", "Meeting_Notes"] },
  { number: "01", name: "Problem_and_Insight",    subFolders: ["Interview_Transcripts", "Insight_Board", "Hypothesis_Tracker", "Problem_Statement_APPROVED"] },
  { number: "02", name: "Product_and_IP",         subFolders: ["MVP_Brief", "Prototype_Docs", "IP_Map", "Patent_Applications", "Test_Results"] },
  { number: "03", name: "Market_and_Commercial",  subFolders: ["Market_Sizing", "ICP_Sheet_APPROVED", "Competitor_Analysis", "GTM_Plan"] },
  { number: "04", name: "Build_and_Operations",   subFolders: ["Sprint_Plan", "Supplier_DB", "Logistics", "QC_Reports", "SOP_Library"] },
  { number: "05", name: "Data_and_Intelligence",  subFolders: ["Data_Dashboard", "Analytics_Reports", "KPI_Tracker", "Research_Papers"] },
  { number: "06", name: "Brand_and_Growth",       subFolders: ["Style_Guide", "Launch_Assets", "Messaging", "Positioning", "Campaign_Assets"] },
  { number: "07", name: "Finance_and_Investment", subFolders: ["Financial_Model", "Pitch_Deck", "Cap_Table", "Investor_List", "Term_Sheets"] },
  { number: "08", name: "Legal_and_Compliance",   subFolders: ["Entity_Structure", "Contracts", "IP_Registrations", "Compliance_Docs"] },
  { number: "09", name: "Spin_Out_Pack",          subFolders: ["Business_Plan", "Operator_Playbook", "Handover_Pack", "Investor_Data_Room"] },
  { number: "10", name: "Archive",                subFolders: ["Deprecated_Docs", "Version_History"] },
];

// ── Permission matrix per V4 Architecture Brief Section 1.3 ──────────────────
const PERMISSION_MATRIX: Record<string, Record<string, "owner"|"editor"|"commenter"|"viewer"|"no_access">> = {
  venture_lead:      { "00":"owner","01":"editor","02":"editor","03":"editor","04":"editor","05":"editor","06":"editor","07":"editor","08":"editor","09":"editor","10":"viewer" },
  intelligence_lead: { "00":"viewer","01":"owner","02":"commenter","03":"commenter","04":"commenter","05":"owner","06":"commenter","07":"viewer","08":"viewer","09":"commenter","10":"viewer" },
  product_lead:      { "00":"viewer","01":"editor","02":"owner","03":"commenter","04":"owner","05":"commenter","06":"commenter","07":"viewer","08":"viewer","09":"editor","10":"viewer" },
  growth_lead:       { "00":"viewer","01":"commenter","02":"commenter","03":"owner","04":"commenter","05":"commenter","06":"owner","07":"commenter","08":"viewer","09":"editor","10":"viewer" },
  finance_lead:      { "00":"viewer","01":"viewer","02":"commenter","03":"commenter","04":"viewer","05":"commenter","06":"viewer","07":"owner","08":"commenter","09":"editor","10":"viewer" },
  legal_lead:        { "00":"viewer","01":"viewer","02":"commenter","03":"viewer","04":"viewer","05":"viewer","06":"viewer","07":"commenter","08":"owner","09":"editor","10":"viewer" },
};

export const gdriveWorkspaceRouter = router({
  // ── Create Workspace ─────────────────────────────────────────────────────────
  createWorkspace: protectedProcedure
    .input(z.object({
      ventureId:   z.string(),
      ventureCode: z.string(),
      ventureName: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      // Check if workspace already exists
      const existing = await db.select().from(gdWorkspaces)
        .where(eq(gdWorkspaces.ventureId, input.ventureId));
      if (existing.length > 0) {
        return { workspaceId: existing[0].id, message: "Workspace already exists", existing: true };
      }
      const mockDriveUrl = `https://drive.google.com/drive/folders/${input.ventureCode.toLowerCase()}-workspace`;
      const [wsRow] = await db.insert(gdWorkspaces).values({
        ventureId:    input.ventureId,
        ventureCode:  input.ventureCode.toUpperCase(),
        ventureName:  input.ventureName,
        driveUrl:     mockDriveUrl,
        status:       "active",
        totalFolders: MODULE_TAXONOMY.length,
        createdBy:    ctx.user.name,
      });
      const workspaceId = (wsRow as any).insertId as number;
      // Create top-level module folders
      for (const mod of MODULE_TAXONOMY) {
        const folderName = `${mod.number}_${mod.name}`;
        const [folderRow] = await db.insert(gdFolders).values({
          workspaceId,
          ventureId:    input.ventureId,
          moduleNumber: mod.number,
          folderName,
          driveUrl:     `${mockDriveUrl}/${folderName}`,
          docCount:     0,
          approvedCount: 0,
        });
        const parentId = (folderRow as any).insertId as number;
        // Create sub-folders
        for (const sub of mod.subFolders) {
          await db.insert(gdFolders).values({
            workspaceId,
            ventureId:    input.ventureId,
            moduleNumber: mod.number,
            folderName:   sub,
            driveUrl:     `${mockDriveUrl}/${folderName}/${sub}`,
            parentFolderId: parentId,
            docCount:     0,
            approvedCount: 0,
          });
        }
      }
      // Apply permission matrix
      for (const [role, modules] of Object.entries(PERMISSION_MATRIX)) {
        for (const [moduleNum, accessLevel] of Object.entries(modules)) {
          await db.insert(gdPermissions).values({
            workspaceId,
            ventureId:   input.ventureId,
            role,
            accessLevel: accessLevel as any,
            moduleScope: [moduleNum],
            grantedBy:   ctx.user.name,
          });
        }
      }
      return { workspaceId, driveUrl: mockDriveUrl, foldersCreated: MODULE_TAXONOMY.length, message: "Workspace created" };
    }),

  // ── Get Workspace ────────────────────────────────────────────────────────────
  getWorkspace: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const workspaces = await db.select().from(gdWorkspaces)
        .where(eq(gdWorkspaces.ventureId, input.ventureId));
      if (workspaces.length === 0) return null;
      const ws = workspaces[0];
      const folders = await db.select().from(gdFolders)
        .where(and(eq(gdFolders.workspaceId, ws.id)));
      const topLevel = folders.filter(f => !f.parentFolderId);
      return { workspace: ws, topLevelFolders: topLevel, allFolders: folders };
    }),

  listWorkspaces: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      return db.select().from(gdWorkspaces).orderBy(desc(gdWorkspaces.createdAt));
    }),

  // ── Folder Management ────────────────────────────────────────────────────────
  updateFolderStats: protectedProcedure
    .input(z.object({
      folderId:     z.number(),
      docCount:     z.number().optional(),
      approvedCount: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(gdFolders)
        .set({
          docCount:     input.docCount,
          approvedCount: input.approvedCount,
        })
        .where(eq(gdFolders.id, input.folderId));
      return { success: true };
    }),

  // ── Permission Matrix ────────────────────────────────────────────────────────
  getPermissions: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const workspaces = await db.select().from(gdWorkspaces)
        .where(eq(gdWorkspaces.ventureId, input.ventureId));
      if (workspaces.length === 0) return { permissions: [], matrix: PERMISSION_MATRIX };
      const permissions = await db.select().from(gdPermissions)
        .where(eq(gdPermissions.workspaceId, workspaces[0].id));
      return { permissions, matrix: PERMISSION_MATRIX };
    }),

  updatePermission: protectedProcedure
    .input(z.object({
      ventureId:   z.string(),
      role:        z.string(),
      moduleScope: z.array(z.string()),
      accessLevel: z.enum(["owner","editor","commenter","viewer","no_access"]),
      email:       z.string().email().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const workspaces = await db.select().from(gdWorkspaces)
        .where(eq(gdWorkspaces.ventureId, input.ventureId));
      if (workspaces.length === 0) throw new Error("Workspace not found");
      await db.insert(gdPermissions).values({
        workspaceId:  workspaces[0].id,
        ventureId:    input.ventureId,
        role:         input.role,
        email:        input.email,
        accessLevel:  input.accessLevel,
        moduleScope:  input.moduleScope,
        grantedBy:    ctx.user.name,
      });
      return { success: true };
    }),

  revokePermission: protectedProcedure
    .input(z.object({ permissionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(gdPermissions)
        .set({ revokedAt: new Date() })
        .where(eq(gdPermissions.id, input.permissionId));
      return { success: true };
    }),

  // ── Module Taxonomy ──────────────────────────────────────────────────────────
  getModuleTaxonomy: protectedProcedure
    .query(() => MODULE_TAXONOMY),

  getPermissionMatrix: protectedProcedure
    .query(() => PERMISSION_MATRIX),

  // ── Portfolio Summary ─────────────────────────────────────────────────────────
  getPortfolioWorkspaces: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const workspaces = await db.select().from(gdWorkspaces)
        .orderBy(desc(gdWorkspaces.createdAt));
      return workspaces;
    }),
});
