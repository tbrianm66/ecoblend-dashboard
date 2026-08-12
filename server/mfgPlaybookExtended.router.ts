// ── China Manufacturing Playbook Extended — tRPC Procedures ──────────────────
// Supplier Onboarding, Factory Audits, RFQ Templates, ASL, Contract Templates
// This file exports a sub-router to be merged into the mfgPlaybook router.

import { z } from "zod";
import { dispatchTrigger } from "./workflowEngine";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { eq as eqOp } from "drizzle-orm";

// ── Supplier Onboarding ───────────────────────────────────────────────────────
export const mfgOnboardingRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const { mfgSupplierOnboarding } = await import("../drizzle/schema");
      const db = (await getDb())!;
      return db.select().from(mfgSupplierOnboarding)
        .where(eqOp(mfgSupplierOnboarding.ventureId, input.ventureId))
        .orderBy(mfgSupplierOnboarding.createdAt);
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string(),
      companyName: z.string(),
      location: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      contactName: z.string().optional(),
      contactEmail: z.string().optional(),
      contactPhone: z.string().optional(),
      capabilities: z.string().optional(),
      certifications: z.string().optional(),
      productionCapacity: z.string().optional(),
      keyClients: z.string().optional(),
      financialStability: z.enum(["unknown", "poor", "fair", "good", "excellent"]).optional(),
      references: z.string().optional(),
      technicalCapability: z.number().min(0).max(5).optional(),
      qualitySystems: z.number().min(0).max(5).optional(),
      leadTimesScore: z.number().min(0).max(5).optional(),
      costCompetitiveness: z.number().min(0).max(5).optional(),
      communication: z.number().min(0).max(5).optional(),
      complianceStandards: z.number().min(0).max(5).optional(),
      status: z.enum(["pending", "under_review", "approved", "rejected", "on_hold"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { mfgSupplierOnboarding } = await import("../drizzle/schema");
      const { id, ...data } = input;
      // Compute overall score as average of 6 capability scores
      const scores = [
        data.technicalCapability ?? 0,
        data.qualitySystems ?? 0,
        data.leadTimesScore ?? 0,
        data.costCompetitiveness ?? 0,
        data.communication ?? 0,
        data.complianceStandards ?? 0,
      ];
      const overallScore = scores.reduce((a, b) => a + b, 0) / 6;
      const payload = { ...data, overallScore: parseFloat(overallScore.toFixed(2)) };
      if (id) {
        const db = (await getDb())!;
        await db.update(mfgSupplierOnboarding).set({ ...payload, updatedAt: new Date() })
          .where(eqOp(mfgSupplierOnboarding.id, id));
        if (data.status === "approved") dispatchTrigger("supplier_approved", id).catch(console.error);
        return { id };
      }
      const db = (await getDb())!;
      const result = await db.insert(mfgSupplierOnboarding).values(payload as any);
      const newSupplierId = (result as any).insertId as number;
      if (data.status === "approved") dispatchTrigger("supplier_approved", newSupplierId).catch(console.error);
      return { id: newSupplierId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { mfgSupplierOnboarding } = await import("../drizzle/schema");
      const db = (await getDb())!;
      await db.delete(mfgSupplierOnboarding).where(eqOp(mfgSupplierOnboarding.id, input.id));
      return { success: true };
    }),
});

// ── Factory Audits ────────────────────────────────────────────────────────────
export const mfgAuditRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const { mfgFactoryAudits } = await import("../drizzle/schema");
      const db = (await getDb())!;
      return db.select().from(mfgFactoryAudits)
        .where(eqOp(mfgFactoryAudits.ventureId, input.ventureId))
        .orderBy(mfgFactoryAudits.createdAt);
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string(),
      supplierId: z.number().optional(),
      supplierName: z.string(),
      auditDate: z.date().optional(),
      auditorName: z.string().optional(),
      facilityCondition: z.enum(["pass", "fail", "partial", "na"]).optional(),
      equipmentCapability: z.enum(["pass", "fail", "partial", "na"]).optional(),
      workforceSkills: z.enum(["pass", "fail", "partial", "na"]).optional(),
      qcProcesses: z.enum(["pass", "fail", "partial", "na"]).optional(),
      healthAndSafety: z.enum(["pass", "fail", "partial", "na"]).optional(),
      environmentalCompliance: z.enum(["pass", "fail", "partial", "na"]).optional(),
      overallResult: z.enum(["pass", "conditional_pass", "fail", "pending"]).optional(),
      findings: z.string().optional(),
      correctiveActions: z.string().optional(),
      followUpDate: z.date().optional(),
      status: z.enum(["scheduled", "in_progress", "complete", "follow_up_required"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { mfgFactoryAudits } = await import("../drizzle/schema");
      const { id, ...data } = input;
      // Compute audit score: each pass=2, partial=1, fail=0, na=0 → max 12 → scale to 100
      const checkItems = [
        data.facilityCondition, data.equipmentCapability, data.workforceSkills,
        data.qcProcesses, data.healthAndSafety, data.environmentalCompliance,
      ];
      const rawScore = checkItems.reduce((acc, v) => acc + (v === "pass" ? 2 : v === "partial" ? 1 : 0), 0);
      const auditScore = Math.round((rawScore / 12) * 100);
      const payload = { ...data, auditScore };
      const hasFailedItems = [
        data.facilityCondition, data.equipmentCapability, data.workforceSkills,
        data.qcProcesses, data.healthAndSafety, data.environmentalCompliance,
      ].some((v) => v === "fail");
      if (id) {
        const db = (await getDb())!;
        await db.update(mfgFactoryAudits).set({ ...payload, updatedAt: new Date() })
          .where(eqOp(mfgFactoryAudits.id, id));
        if (hasFailedItems) dispatchTrigger("audit_failed", id).catch(console.error);
        return { id };
      }
      const db = (await getDb())!;
      const result = await db.insert(mfgFactoryAudits).values(payload as any);
      const newAuditId = (result as any).insertId as number;
      if (hasFailedItems) dispatchTrigger("audit_failed", newAuditId).catch(console.error);
      return { id: newAuditId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { mfgFactoryAudits } = await import("../drizzle/schema");
      const db = (await getDb())!;
      await db.delete(mfgFactoryAudits).where(eqOp(mfgFactoryAudits.id, input.id));
      return { success: true };
    }),
});

// ── RFQ Templates ─────────────────────────────────────────────────────────────
export const mfgRfqRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const { mfgRfqTemplates } = await import("../drizzle/schema");
      const db = (await getDb())!;
      return db.select().from(mfgRfqTemplates)
        .where(eqOp(mfgRfqTemplates.ventureId, input.ventureId))
        .orderBy(mfgRfqTemplates.createdAt);
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string(),
      projectId: z.number().optional(),
      rfqRef: z.string().optional(),
      productName: z.string(),
      productSpecs: z.string().optional(),
      drawingsUrl: z.string().optional(),
      materials: z.string().optional(),
      targetVolumeMoq: z.number().optional(),
      targetVolumeAnnual: z.number().optional(),
      targetLeadTimeDays: z.number().optional(),
      targetUnitCostGbp: z.number().optional(),
      materialCostGbp: z.number().optional(),
      labourCostGbp: z.number().optional(),
      toolingCostGbp: z.number().optional(),
      overheadCostGbp: z.number().optional(),
      packagingCostGbp: z.number().optional(),
      sentToSuppliers: z.string().optional(),
      responseDeadline: z.date().optional(),
      status: z.enum(["draft", "sent", "responses_received", "evaluated", "awarded", "cancelled"]).optional(),
      awardedSupplier: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { mfgRfqTemplates } = await import("../drizzle/schema");
      const { id, ...data } = input;
      if (id) {
        const db = (await getDb())!;
      await db.update(mfgRfqTemplates).set({ ...data, updatedAt: new Date() })
          .where(eqOp(mfgRfqTemplates.id, id));
        return { id };
      }
      const db = (await getDb())!;
      const result = await db.insert(mfgRfqTemplates).values(data as any);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { mfgRfqTemplates } = await import("../drizzle/schema");
      const db = (await getDb())!;
      await db.delete(mfgRfqTemplates).where(eqOp(mfgRfqTemplates.id, input.id));
      return { success: true };
    }),
});

// ── Approved Supplier List (ASL) ──────────────────────────────────────────────
export const mfgAslRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const { mfgApprovedSuppliers } = await import("../drizzle/schema");
      const db = (await getDb())!;
      return db.select().from(mfgApprovedSuppliers)
        .where(eqOp(mfgApprovedSuppliers.ventureId, input.ventureId))
        .orderBy(mfgApprovedSuppliers.createdAt);
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string(),
      supplierId: z.string().optional(),
      onboardingId: z.number().optional(),
      supplierName: z.string(),
      tierLevel: z.enum(["oem", "components", "raw_materials", "tooling"]).optional(),
      capabilities: z.string().optional(),
      riskRating: z.enum(["low", "medium", "high", "critical"]).optional(),
      performanceScore: z.number().min(0).max(100).optional(),
      qualityScore: z.number().min(0).max(100).optional(),
      deliveryScore: z.number().min(0).max(100).optional(),
      costScore: z.number().min(0).max(100).optional(),
      lastAuditDate: z.date().optional(),
      nextAuditDate: z.date().optional(),
      approvalDate: z.date().optional(),
      approvedBy: z.string().optional(),
      status: z.enum(["active", "probationary", "suspended", "delisted"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { mfgApprovedSuppliers } = await import("../drizzle/schema");
      const { id, ...data } = input;
      // Compute composite performance score
      const scores = [data.qualityScore ?? 0, data.deliveryScore ?? 0, data.costScore ?? 0];
      const performanceScore = scores.reduce((a, b) => a + b, 0) / 3;
      const payload = { ...data, performanceScore: parseFloat(performanceScore.toFixed(1)) };
      if (id) {
        const db = (await getDb())!;
      await db.update(mfgApprovedSuppliers).set({ ...payload, updatedAt: new Date() })
          .where(eqOp(mfgApprovedSuppliers.id, id));
        return { id };
      }
      const db = (await getDb())!;
      const result = await db.insert(mfgApprovedSuppliers).values(payload as any);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { mfgApprovedSuppliers } = await import("../drizzle/schema");
      const db = (await getDb())!;
      await db.delete(mfgApprovedSuppliers).where(eqOp(mfgApprovedSuppliers.id, input.id));
      return { success: true };
    }),
});

// ── Contract Templates ────────────────────────────────────────────────────────
const CONTRACT_CLAUSES: Record<string, string[]> = {
  nnn: ["Non-disclosure", "Non-use", "Non-circumvention", "Jurisdiction in China"],
  manufacturing: ["Scope of work", "Quality standards", "Pricing", "Delivery terms", "Penalties", "Termination", "IP ownership"],
  tooling_ownership: ["Ownership of molds/tools", "Storage", "Maintenance", "Transfer rights"],
  quality: ["Inspection standards", "Defect thresholds", "Corrective actions", "Reporting requirements"],
  logistics_supply: ["Incoterms", "Shipping responsibilities", "Insurance", "Customs compliance"],
};

const CONTRACT_DRAFT_TEMPLATES: Record<string, string> = {
  nnn: `# Non-Disclosure, Non-Use & Non-Circumvention Agreement (NNN)

**Parties:** [Company Name] ("Disclosing Party") and [Supplier Name] ("Receiving Party")
**Jurisdiction:** People's Republic of China
**Governing Law:** PRC Contract Law

## 1. Non-Disclosure
The Receiving Party agrees to keep all Confidential Information strictly confidential and shall not disclose it to any third party without prior written consent from the Disclosing Party.

## 2. Non-Use
The Receiving Party shall not use the Confidential Information for any purpose other than evaluating or fulfilling the manufacturing relationship described herein.

## 3. Non-Circumvention
The Receiving Party shall not circumvent, avoid, bypass, or obviate the Disclosing Party's interest in any transaction or relationship established or contemplated herein.

## 4. Duration
This Agreement shall remain in effect for [3] years from the date of signing.

## 5. Remedies
Breach of this Agreement shall entitle the Disclosing Party to seek injunctive relief and damages in PRC courts.`,

  manufacturing: `# Manufacturing Agreement

**Parties:** [Company Name] ("Buyer") and [Supplier Name] ("Manufacturer")

## 1. Scope of Work
The Manufacturer agrees to produce [Product Name] in accordance with the specifications attached as Exhibit A.

## 2. Quality Standards
All products must meet the quality standards defined in the Quality Agreement (Exhibit B), including ISO 9001 requirements.

## 3. Pricing
Unit price: £[X] per unit at MOQ of [Y] units. Pricing valid for [12] months subject to material cost review.

## 4. Delivery Terms
Incoterms: FOB [Port]. Lead time: [X] weeks from purchase order confirmation.

## 5. Penalties
Late delivery penalty: [0.5%] of order value per week of delay, up to [5%] maximum.

## 6. Termination
Either party may terminate with [90] days written notice. Immediate termination for material breach.

## 7. IP Ownership
All tooling, moulds, and product designs remain the exclusive property of the Buyer.`,

  tooling_ownership: `# Tooling Ownership Agreement

**Parties:** [Company Name] ("Owner") and [Supplier Name] ("Custodian")

## 1. Ownership of Moulds and Tools
All moulds, dies, jigs, fixtures, and tooling ("Tooling") listed in Schedule A are and shall remain the exclusive property of the Owner.

## 2. Storage
The Custodian shall store the Tooling in a secure, climate-controlled facility at no cost to the Owner.

## 3. Maintenance
The Custodian shall maintain the Tooling in good working order. Major repairs (>£[500]) require Owner approval.

## 4. Transfer Rights
Upon request, the Owner may transfer the Tooling to another manufacturer within [30] days. The Custodian shall cooperate fully with such transfer.

## 5. Return
Upon termination of the manufacturing relationship, all Tooling shall be returned to the Owner within [14] days.`,

  quality: `# Quality Agreement

**Parties:** [Company Name] ("Buyer") and [Supplier Name] ("Supplier")

## 1. Inspection Standards
All products shall be inspected per AQL Level II sampling plan. Pre-production samples (3 units) required before mass production.

## 2. Defect Thresholds
Critical defects: 0% acceptable. Major defects: AQL 1.0%. Minor defects: AQL 2.5%.

## 3. Corrective Actions
Any batch failing inspection shall be quarantined. Supplier must provide 8D corrective action report within [5] business days.

## 4. Reporting Requirements
Monthly quality reports including: defect rates, corrective actions, process capability indices (Cpk ≥ 1.33).

## 5. Right of Audit
Buyer reserves the right to conduct factory audits with [48] hours notice.`,

  logistics_supply: `# Logistics & Supply Agreement

**Parties:** [Company Name] ("Buyer") and [Supplier Name] ("Supplier")

## 1. Incoterms
All shipments shall be made on FOB [Port of Origin] terms unless otherwise agreed in writing.

## 2. Shipping Responsibilities
Supplier is responsible for all costs and risks until goods are loaded on vessel at origin port. Buyer arranges freight from origin port.

## 3. Insurance
Buyer shall maintain cargo insurance for minimum 110% of CIF value. Supplier to provide packing list and commercial invoice within [24] hours of shipment.

## 4. Customs Compliance
Supplier shall provide accurate HS codes, country of origin certificates, and all documentation required for UK customs clearance.

## 5. Lead Times
Standard lead time: [X] weeks. Expedited shipment available at Buyer's cost with [72] hours notice.`,
};

export const mfgContractRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const { mfgContractTemplates } = await import("../drizzle/schema");
      const db = (await getDb())!;
      return db.select().from(mfgContractTemplates)
        .where(eqOp(mfgContractTemplates.ventureId, input.ventureId))
        .orderBy(mfgContractTemplates.createdAt);
    }),

  getDefaultClauses: publicProcedure
    .input(z.object({ contractType: z.enum(["nnn", "manufacturing", "tooling_ownership", "quality", "logistics_supply"]) }))
    .query(({ input }) => {
      return {
        clauses: CONTRACT_CLAUSES[input.contractType] ?? [],
        draftTemplate: CONTRACT_DRAFT_TEMPLATES[input.contractType] ?? "",
      };
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string(),
      supplierId: z.number().optional(),
      supplierName: z.string().optional(),
      contractType: z.enum(["nnn", "manufacturing", "tooling_ownership", "quality", "logistics_supply"]),
      clauseChecklist: z.string().optional(),
      draftText: z.string().optional(),
      jurisdiction: z.string().optional(),
      effectiveDate: z.date().optional(),
      expiryDate: z.date().optional(),
      penaltyClause: z.boolean().optional(),
      ipOwnershipClause: z.boolean().optional(),
      incoterms: z.enum(["EXW", "FOB", "CIF", "DDP", "DAP"]).optional(),
      status: z.enum(["draft", "under_review", "signed", "expired", "terminated"]).optional(),
      signedDate: z.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { mfgContractTemplates } = await import("../drizzle/schema");
      const { id, ...data } = input;
      // Auto-populate draft text from template if not provided
      if (!data.draftText) {
        data.draftText = CONTRACT_DRAFT_TEMPLATES[data.contractType] ?? "";
      }
      // Auto-populate clause checklist if not provided
      if (!data.clauseChecklist) {
        const clauses = CONTRACT_CLAUSES[data.contractType] ?? [];
        data.clauseChecklist = JSON.stringify(Object.fromEntries(clauses.map(c => [c, false])));
      }
      if (id) {
        const db = (await getDb())!;
      await db.update(mfgContractTemplates).set({ ...data, updatedAt: new Date() })
          .where(eqOp(mfgContractTemplates.id, id));
        return { id };
      }
      const db = (await getDb())!;
      const result = await db.insert(mfgContractTemplates).values(data as any);
      return { id: (result as any).insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { mfgContractTemplates } = await import("../drizzle/schema");
      const db = (await getDb())!;
      await db.delete(mfgContractTemplates).where(eqOp(mfgContractTemplates.id, input.id));
      return { success: true };
    }),

  generateDraft: protectedProcedure
    .input(z.object({
      contractType: z.enum(["nnn", "manufacturing", "tooling_ownership", "quality", "logistics_supply"]),
      supplierName: z.string(),
      ventureId: z.string(),
      additionalContext: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("./_core/llm");
      const baseTemplate = CONTRACT_DRAFT_TEMPLATES[input.contractType] ?? "";
      const contractNames: Record<string, string> = {
        nnn: "NNN (Non-Disclosure, Non-Use, Non-Circumvention) Agreement",
        manufacturing: "Manufacturing Agreement",
        tooling_ownership: "Tooling Ownership Agreement",
        quality: "Quality Agreement",
        logistics_supply: "Logistics & Supply Agreement",
      };
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert in China manufacturing contracts for UK SMEs. Generate a professional, legally-structured ${contractNames[input.contractType]} tailored for manufacturing in China. Use the template as a base and customise it for the specific supplier and venture context. Keep it concise but comprehensive. Format in Markdown.`,
          },
          {
            role: "user",
            content: `Generate a ${contractNames[input.contractType]} for:
- Venture/Company: ${input.ventureId}
- Supplier: ${input.supplierName}
${input.additionalContext ? `- Additional context: ${input.additionalContext}` : ""}

Base template:
${baseTemplate}

Please customise this template appropriately, filling in reasonable placeholder values and adding any relevant clauses for a UK-China manufacturing relationship.`,
          },
        ],
      });
      const draftText = response?.choices?.[0]?.message?.content ?? baseTemplate;
      return { draftText };
    }),
});
