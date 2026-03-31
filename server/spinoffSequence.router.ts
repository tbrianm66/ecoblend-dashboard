/**
 * Sprint 74 — Spin-Off Sequence Automation Router
 * EcoBlend V4 Architecture Brief — Section 2 & 3.3
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  spinoffSequences,
  spinoffAssets,
  spinoffHandoverPacks,
  vrlActionsLog,
  type InsertSpinoffHandoverPack,
} from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

const ASSET_MIGRATION_PLAN = [
  { assetType: "business_plan"    as const, sourceModule: "09_Spin_Out_Pack/Business_Plan",             destPath: "02_Founding_Docs/Business_Plan_APPROVED",  action: "Copy + lock" },
  { assetType: "financial_model"  as const, sourceModule: "07_Finance_and_Investment/Financial_Model",  destPath: "02_Founding_Docs/Financial_Model_APPROVED", action: "Copy + lock" },
  { assetType: "pitch_deck"       as const, sourceModule: "07_Finance_and_Investment/Pitch_Deck",       destPath: "03_Investor_Data_Room/Deck_and_Memo",       action: "Copy + lock" },
  { assetType: "cap_table"        as const, sourceModule: "07_Finance_and_Investment/Cap_Table",        destPath: "02_Founding_Docs/Cap_Table_APPROVED",       action: "Copy + lock" },
  { assetType: "entity_structure" as const, sourceModule: "08_Legal_and_Compliance/Entity_Structure",  destPath: "04_Board_and_Governance",                   action: "Copy + lock" },
  { assetType: "ip_map"           as const, sourceModule: "02_Product_and_IP/IP_Map",                  destPath: "02_Founding_Docs/IP_and_Patents",            action: "Copy + lock" },
  { assetType: "operator_playbook"as const, sourceModule: "09_Spin_Out_Pack/Operator_Playbook",        destPath: "01_Live_Operations",                        action: "Copy + activate" },
  { assetType: "handover_pack"    as const, sourceModule: "All modules 00–09",                         destPath: "05_Archive/EcoBlend_Handover",               action: "Zip + archive" },
];

export const spinoffSequenceRouter = router({
  triggerSpinoff: protectedProcedure
    .input(z.object({
      ventureId:        z.string(),
      ventureCode:      z.string(),
      ventureName:      z.string(),
      triggerVrlScore:  z.number().min(0).max(100),
      approvedDate:     z.string(),
      founderName:      z.string(),
      founderEmail:     z.string().email(),
      leadInvestorName: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (input.triggerVrlScore < 80) throw new Error(`Spin-off requires VRL score ≥ 80. Current: ${input.triggerVrlScore}`);
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [row] = await db.insert(spinoffSequences).values({
        ventureId: input.ventureId, ventureCode: input.ventureCode.toUpperCase(),
        ventureName: input.ventureName, triggerVrlScore: input.triggerVrlScore.toString(),
        approvedDate: input.approvedDate, founderName: input.founderName,
        founderEmail: input.founderEmail, leadInvestorName: input.leadInvestorName,
        status: "pending", currentStep: 1,
      });
      const sequenceId = (row as any).insertId as number;
      for (const asset of ASSET_MIGRATION_PLAN) {
        await db.insert(spinoffAssets).values({
          sequenceId, assetType: asset.assetType,
          sourceModule: asset.sourceModule, destPath: asset.destPath, status: "pending",
        });
      }
      await db.insert(vrlActionsLog).values({
        ventureId: input.ventureId,
        action: `Spin-off sequence triggered by ${ctx.user.name} — VRL score ${input.triggerVrlScore}`,
        owner: ctx.user.name, status: "in_progress", linkedModule: "09",
      });
      return { sequenceId, message: `Spin-off sequence initiated for ${input.ventureCode}` };
    }),

  createSpinoffDrive: protectedProcedure
    .input(z.object({ sequenceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [seq] = await db.select().from(spinoffSequences).where(eq(spinoffSequences.id, input.sequenceId));
      if (!seq) throw new Error("Sequence not found");
      const year = new Date().getFullYear();
      const mockDriveUrl = `https://drive.google.com/drive/folders/${seq.ventureCode.toLowerCase()}-spinout-${year}`;
      await db.update(spinoffSequences).set({ status: "drive_created", currentStep: 2, spinoffDriveUrl: mockDriveUrl }).where(eq(spinoffSequences.id, input.sequenceId));
      return { driveName: `${seq.ventureCode}_SpinOut_${year}`, driveUrl: mockDriveUrl, step: 1, complete: true };
    }),

  migrateAssets: protectedProcedure
    .input(z.object({ sequenceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const assets = await db.select().from(spinoffAssets).where(eq(spinoffAssets.sequenceId, input.sequenceId));
      for (const asset of assets.filter(a => a.status === "pending")) {
        await db.update(spinoffAssets).set({ status: "copied", migratedAt: new Date() }).where(eq(spinoffAssets.id, asset.id));
      }
      await db.update(spinoffSequences).set({ status: "assets_migrated", currentStep: 3 }).where(eq(spinoffSequences.id, input.sequenceId));
      return { migratedCount: assets.length, step: 2, complete: true };
    }),

  generateHandoverPack: protectedProcedure
    .input(z.object({
      sequenceId:     z.number(),
      ventureContext: z.string(),
      founderName:    z.string(),
      keyContacts:    z.array(z.object({ role: z.string(), name: z.string(), email: z.string() })).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [seq] = await db.select().from(spinoffSequences).where(eq(spinoffSequences.id, input.sequenceId));
      if (!seq) throw new Error("Sequence not found");
      const playbookRes = await invokeLLM({
        messages: [
          { role: "system", content: "You are an EcoBlend V4 Venture OS specialist. Generate a practical, action-oriented Operator Playbook for an incoming founder." },
          { role: "user", content: `Generate an Operator Playbook for venture ${seq.ventureCode} — ${seq.ventureName}.\nIncoming founder: ${input.founderName}\nContext: ${input.ventureContext}\n\nInclude:\n1. Venture summary: problem, solution, market, model\n2. Current status: what is built, what is live, what is pending\n3. Customer and partner contacts\n4. Key supplier relationships\n5. Open risks and mitigants\n6. 90-day operating priorities (week-by-week for weeks 1-4, then monthly)\n7. Governance: board structure, decision rights, reporting cadence\n8. Where to find everything (G Drive module map)\n\nTone: practical, direct, action-oriented.` },
        ],
      });
      const operatorPlaybook = playbookRes.choices[0].message.content;
      const planRes = await invokeLLM({
        messages: [
          { role: "system", content: "You are an EcoBlend V4 Venture OS specialist. Generate a concise 90-day operating plan." },
          { role: "user", content: `Generate a 90-day operating plan for ${seq.ventureName} (${seq.ventureCode}).\nFounder: ${input.founderName}. Context: ${input.ventureContext}\nFormat as week-by-week priorities for weeks 1-4, then monthly for months 2-3.` },
        ],
      });
      const ninetyDayPlan = planRes.choices[0].message.content;
      const packData: InsertSpinoffHandoverPack = {
        sequenceId:       input.sequenceId,
        ventureId:        seq.ventureId,
        executiveSummary: `${seq.ventureName} (${seq.ventureCode}) — Spin-Out Handover Pack. Approved: ${seq.approvedDate}. VRL Score: ${seq.triggerVrlScore}.`,
        operatorPlaybook: typeof operatorPlaybook === "string" ? operatorPlaybook : String(operatorPlaybook),
        ninetyDayPlan:    typeof ninetyDayPlan === "string" ? ninetyDayPlan : String(ninetyDayPlan),
        openRisks:        "See Risk Management module for full risk register.",
        keyContacts:      input.keyContacts ?? [],
        assetLinks:       ASSET_MIGRATION_PLAN.map(a => ({ assetType: a.assetType, destPath: a.destPath })),
      };
      await db.insert(spinoffHandoverPacks).values(packData);
      await db.update(spinoffSequences).set({ status: "handover_generated", currentStep: 4 }).where(eq(spinoffSequences.id, input.sequenceId));
      return { operatorPlaybook: packData.operatorPlaybook, ninetyDayPlan: packData.ninetyDayPlan, step: 3, complete: true };
    }),

  setupDataRoom: protectedProcedure
    .input(z.object({ sequenceId: z.number(), investorEmails: z.array(z.string().email()).optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [seq] = await db.select().from(spinoffSequences).where(eq(spinoffSequences.id, input.sequenceId));
      if (!seq) throw new Error("Sequence not found");
      const dataRoomUrl = `https://drive.google.com/drive/folders/${seq.ventureCode.toLowerCase()}-data-room`;
      await db.update(spinoffSequences).set({ status: "data_room_ready", currentStep: 5, dataRoomUrl }).where(eq(spinoffSequences.id, input.sequenceId));
      return { dataRoomUrl, investorCount: input.investorEmails?.length ?? 0, step: 4, complete: true };
    }),

  completeSequence: protectedProcedure
    .input(z.object({ sequenceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [seq] = await db.select().from(spinoffSequences).where(eq(spinoffSequences.id, input.sequenceId));
      if (!seq) throw new Error("Sequence not found");
      await db.update(spinoffSequences).set({ status: "completed", completedAt: new Date() }).where(eq(spinoffSequences.id, input.sequenceId));
      await db.insert(vrlActionsLog).values({
        ventureId: seq.ventureId,
        action: `Spin-off sequence COMPLETED for ${seq.ventureCode} — ${seq.ventureName}. Founder: ${seq.founderName}`,
        owner: seq.founderName ?? "System", status: "complete", linkedModule: "09",
      });
      return { success: true, message: `Spin-off complete for ${seq.ventureCode}`, step: 5 };
    }),

  listSequences: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      return db.select().from(spinoffSequences).orderBy(desc(spinoffSequences.createdAt));
    }),

  getSequence: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [seq] = await db.select().from(spinoffSequences).where(eq(spinoffSequences.id, input.id));
      if (!seq) throw new Error("Sequence not found");
      const assets = await db.select().from(spinoffAssets).where(eq(spinoffAssets.sequenceId, input.id));
      const packs  = await db.select().from(spinoffHandoverPacks).where(eq(spinoffHandoverPacks.sequenceId, input.id));
      return { sequence: seq, assets, handoverPack: packs[0] ?? null };
    }),

  getAssetMigrationPlan: protectedProcedure
    .query(() => ASSET_MIGRATION_PLAN),
});
