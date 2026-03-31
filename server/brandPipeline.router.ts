/**
 * Sprint 75 — Brand Data Pipeline Router
 * EcoBlend V4 Architecture Brief — Section 2.4 & 3.4
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { brandAssets, brandLinks, brandUpdateLog, vrlActionsLog } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

const BRAND_ASSET_TYPES = [
  { type: "name_tagline",    label: "Venture Name & Tagline",  module: "00", masterFolder: "00_Venture_Control/Vision" },
  { type: "logo",            label: "Logo Files",              module: "06", masterFolder: "06_Brand_and_Growth/Launch_Assets/Logos" },
  { type: "colour_palette",  label: "Colour Palette",          module: "06", masterFolder: "06_Brand_and_Growth/Style_Guide" },
  { type: "typography",      label: "Typography Guide",        module: "06", masterFolder: "06_Brand_and_Growth/Style_Guide" },
  { type: "messaging_house", label: "Messaging House",         module: "06", masterFolder: "06_Brand_and_Growth/Messaging" },
  { type: "icp_definition",  label: "ICP Definition",          module: "03", masterFolder: "03_Market_and_Commercial/ICP_Sheet_APPROVED" },
  { type: "brand_voice",     label: "Brand Voice Guidelines",  module: "06", masterFolder: "06_Brand_and_Growth/Positioning" },
];

const MODULE_LINK_TARGETS = [
  { module: "03", name: "Market & Commercial",   assets: ["icp_definition","messaging_house"] },
  { module: "06", name: "Brand & Growth",        assets: ["name_tagline","logo","colour_palette","typography","messaging_house","icp_definition","brand_voice"] },
  { module: "07", name: "Finance & Investment",  assets: ["name_tagline","logo"] },
  { module: "09", name: "Spin-Out Pack",         assets: ["name_tagline","logo","colour_palette","typography","messaging_house","icp_definition","brand_voice"] },
];

export const brandPipelineRouter = router({
  getAssetRegister: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const assets = await db.select().from(brandAssets).where(eq(brandAssets.ventureId, input.ventureId)).orderBy(brandAssets.assetType);
      if (assets.length === 0) {
        for (const at of BRAND_ASSET_TYPES) {
          await db.insert(brandAssets).values({
            ventureId: input.ventureId, assetType: at.type as any,
            assetName: at.label, masterLocation: at.masterFolder, status: "missing", version: "V1",
          });
        }
        return db.select().from(brandAssets).where(eq(brandAssets.ventureId, input.ventureId));
      }
      return assets;
    }),

  upsertAsset: protectedProcedure
    .input(z.object({
      ventureId:      z.string(),
      assetType:      z.enum(["name_tagline","logo","colour_palette","typography","messaging_house","icp_definition","brand_voice"]),
      assetName:      z.string().optional(),
      masterLocation: z.string().optional(),
      status:         z.enum(["missing","draft","pending","approved"]),
      version:        z.string().optional(),
      content:        z.string().optional(),
      driveUrl:       z.string().optional(),
      owner:          z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const existing = await db.select().from(brandAssets)
        .where(and(eq(brandAssets.ventureId, input.ventureId), eq(brandAssets.assetType, input.assetType)));
      const previousStatus = existing[0]?.status;
      if (existing.length > 0) {
        await db.update(brandAssets).set({
          status: input.status, content: input.content, driveUrl: input.driveUrl,
          owner: input.owner, version: input.version, lastUpdated: new Date(),
          approvedAt: input.status === "approved" ? new Date() : existing[0].approvedAt,
        }).where(and(eq(brandAssets.ventureId, input.ventureId), eq(brandAssets.assetType, input.assetType)));
      } else {
        await db.insert(brandAssets).values({
          ventureId: input.ventureId, assetType: input.assetType,
          assetName: input.assetName ?? input.assetType, masterLocation: input.masterLocation,
          status: input.status, version: input.version ?? "V1", content: input.content,
          driveUrl: input.driveUrl, owner: input.owner,
          approvedAt: input.status === "approved" ? new Date() : undefined,
        });
      }
      if (input.status === "approved" && previousStatus !== "approved") {
        const assetId = existing[0]?.id ?? 0;
        await db.insert(brandUpdateLog).values({
          ventureId: input.ventureId, assetId, assetType: input.assetType,
          previousStatus: previousStatus ?? "missing", newStatus: "approved",
          changedBy: ctx.user.name,
          notifiedLeads: ["intelligence_lead","product_lead","growth_lead","finance_lead","legal_lead"],
          downstreamFlags: MODULE_LINK_TARGETS.filter(m => m.assets.includes(input.assetType))
            .map(m => ({ module: m.module, name: m.name, action: "Review for updated brand asset" })),
        });
        await db.insert(vrlActionsLog).values({
          ventureId: input.ventureId,
          action: `Brand asset APPROVED: ${input.assetType} (${input.version ?? "V1"}) — all module leads notified`,
          owner: ctx.user.name, status: "complete", linkedModule: "06",
        });
      }
      return { success: true };
    }),

  getBrandPanel: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const assets = await db.select().from(brandAssets).where(eq(brandAssets.ventureId, input.ventureId));
      const approved = assets.filter(a => a.status === "approved");
      const pending  = assets.filter(a => a.status === "pending" || a.status === "draft");
      const missing  = assets.filter(a => a.status === "missing");
      return {
        overallStatus:  missing.length === 0 && pending.length === 0 ? "all_approved" : missing.length > 0 ? "missing" : "pending",
        approvedCount:  approved.length,
        pendingCount:   pending.length,
        missingCount:   missing.length,
        totalAssets:    assets.length,
        nameTagline:    assets.find(a => a.assetType === "name_tagline")?.content,
        logoUrl:        assets.find(a => a.assetType === "logo")?.driveUrl,
        colourPalette:  assets.find(a => a.assetType === "colour_palette")?.content,
        icpOneLiner:    assets.find(a => a.assetType === "icp_definition")?.content,
        messagingHouse: assets.find(a => a.assetType === "messaging_house")?.content,
        assets,
      };
    }),

  autoLinkAllModules: protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const assets = await db.select().from(brandAssets)
        .where(and(eq(brandAssets.ventureId, input.ventureId), eq(brandAssets.status, "approved")));
      let linkCount = 0;
      for (const asset of assets) {
        for (const target of MODULE_LINK_TARGETS) {
          if (target.assets.includes(asset.assetType)) {
            const existing = await db.select().from(brandLinks)
              .where(and(eq(brandLinks.ventureId, input.ventureId), eq(brandLinks.assetId, asset.id), eq(brandLinks.linkedModule, target.module)));
            if (existing.length === 0) {
              await db.insert(brandLinks).values({
                ventureId: input.ventureId, assetId: asset.id,
                linkedModule: target.module, linkedModuleName: target.name, linkType: "auto_push",
              });
              linkCount++;
            }
          }
        }
      }
      return { linkCount, message: `${linkCount} module links created` };
    }),

  getUpdateLog: protectedProcedure
    .input(z.object({ ventureId: z.string(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      return db.select().from(brandUpdateLog).where(eq(brandUpdateLog.ventureId, input.ventureId)).orderBy(desc(brandUpdateLog.createdAt)).limit(input.limit);
    }),

  generateDocumentHeader: protectedProcedure
    .input(z.object({
      ventureId:    z.string(),
      ventureCode:  z.string(),
      ventureName:  z.string(),
      ventureStage: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const assets    = await db.select().from(brandAssets).where(eq(brandAssets.ventureId, input.ventureId));
      const messaging = assets.find(a => a.assetType === "messaging_house");
      const icp       = assets.find(a => a.assetType === "icp_definition");
      const voice     = assets.find(a => a.assetType === "brand_voice");
      const res = await invokeLLM({
        messages: [
          { role: "system", content: "You are an EcoBlend V4 Venture OS specialist. Generate a standard document header block for Claude-drafted outputs." },
          { role: "user", content: `Generate a standard document header block for venture:\nName: ${input.ventureName}\nCode: ${input.ventureCode}\nStage: ${input.ventureStage}\nMessaging House: ${messaging?.content ?? "Not yet defined"}\nICP: ${icp?.content ?? "Not yet defined"}\nBrand Voice: ${voice?.content ?? "Not yet defined"}\n\nFormat:\nVenture: [NAME] | Code: [CODE] | Stage: [STAGE]\nBrand voice: [VOICE SUMMARY]\nICP: [ICP ONE-LINER]\n\nAlso include a brief brand context paragraph for AI outputs.` },
        ],
      });
      const header = res.choices[0].message.content;
      return { header: typeof header === "string" ? header : String(header) };
    }),

  getBrandAssetTypes: protectedProcedure.query(() => BRAND_ASSET_TYPES),
  getModuleLinkTargets: protectedProcedure.query(() => MODULE_LINK_TARGETS),
});
