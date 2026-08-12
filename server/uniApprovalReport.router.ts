/**
 * Sprint 62 — University Approval Report Router
 * Formal approval documents linking offering-level research, validation evidence,
 * and academic partnerships for university/lecturer sign-off.
 * Implements the H4 Lean Methodology dual-risk model:
 *   - Product Risk: managed by founders (technology, engineering)
 *   - Business Risk: managed by university (market, strategy, commercialisation)
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  uniApprovalReports,
  uniResearchProjects,
  uniPartners,
  uniTalentRoles,
  uniGovernanceDocs,
  offerings,
  portfolios,
  ventures,
  experiments,
  milestones,
  risks,
} from "../drizzle/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

// ── Input Schemas ─────────────────────────────────────────────────────────────
const reportTypeEnum = z.enum([
  "syllabus_approval",
  "research_validation",
  "industry_engagement",
  "ethics_clearance",
  "ip_disclosure",
  "commercialisation_approval",
]);

const statusEnum = z.enum([
  "draft",
  "under_review",
  "approved",
  "rejected",
  "revision_requested",
  "archived",
]);

const h4StageEnum = z.enum([
  "problem_definition",
  "research_discovery",
  "hypothesis_development",
  "validation",
  "commercialisation",
]);

const upsertInput = z.object({
  id: z.number().optional(),
  ventureId: z.string(),
  offeringId: z.string().optional(),
  portfolioId: z.string().optional(),
  title: z.string().min(1).max(255),
  reportType: reportTypeEnum.default("syllabus_approval"),
  status: statusEnum.default("draft"),
  productRiskOwner: z.string().optional(),
  businessRiskOwner: z.string().optional(),
  executiveSummary: z.string().optional(),
  problemStatement: z.string().optional(),
  researchObjectives: z.string().optional(),
  methodology: z.string().optional(),
  validationEvidence: z.string().optional(),
  academicContribution: z.string().optional(),
  commercialPotential: z.string().optional(),
  ethicsStatement: z.string().optional(),
  ipStatement: z.string().optional(),
  recommendations: z.string().optional(),
  reviewNotes: z.string().optional(),
  linkedResearchIds: z.string().optional(),
  linkedPartnerIds: z.string().optional(),
  linkedTalentIds: z.string().optional(),
  linkedGovernanceIds: z.string().optional(),
  h4Stage: h4StageEnum.optional(),
  vrlStage: z.number().int().min(1).max(9).optional(),
  trlLevel: z.number().int().min(1).max(9).optional(),
  brlScore: z.number().int().min(0).max(100).optional(),
  submittedBy: z.string().optional(),
  reviewedBy: z.string().optional(),
  approvedBy: z.string().optional(),
});

// ── Router ────────────────────────────────────────────────────────────────────
export const uniApprovalReportRouter = router({
  // List all reports for a venture (optionally filtered by offering or portfolio)
  list: publicProcedure
    .input(z.object({
      ventureId: z.string(),
      offeringId: z.string().optional(),
      portfolioId: z.string().optional(),
      status: statusEnum.optional(),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      let query = db
        .select()
        .from(uniApprovalReports)
        .where(eq(uniApprovalReports.ventureId, input.ventureId))
        .orderBy(desc(uniApprovalReports.updatedAt))
        .$dynamic();

      const rows = await query;
      // Filter in JS for optional fields (simpler than dynamic where chaining)
      return rows.filter(r => {
        if (input.offeringId && r.offeringId !== input.offeringId) return false;
        if (input.portfolioId && r.portfolioId !== input.portfolioId) return false;
        if (input.status && r.status !== input.status) return false;
        return true;
      });
    }),

  // Get a single report by ID with full linked entity details
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const rows = await db
        .select()
        .from(uniApprovalReports)
        .where(eq(uniApprovalReports.id, input.id));
      const report = rows[0] ?? null;
      if (!report) return null;

      // Fetch linked entities for display
      const researchIds = report.linkedResearchIds
        ? report.linkedResearchIds.split(",").map(Number).filter(Boolean)
        : [];
      const partnerIds = report.linkedPartnerIds
        ? report.linkedPartnerIds.split(",").map(Number).filter(Boolean)
        : [];

      const [linkedResearch, linkedPartners, offeringData, portfolioData] = await Promise.all([
        researchIds.length > 0
          ? db.select().from(uniResearchProjects).where(inArray(uniResearchProjects.id, researchIds))
          : Promise.resolve([]),
        partnerIds.length > 0
          ? db.select().from(uniPartners).where(inArray(uniPartners.id, partnerIds))
          : Promise.resolve([]),
        report.offeringId
          ? db.select().from(offerings).where(eq(offerings.id, report.offeringId)).then(r => r[0] ?? null)
          : Promise.resolve(null),
        report.portfolioId
          ? db.select().from(portfolios).where(eq(portfolios.id, report.portfolioId)).then(r => r[0] ?? null)
          : Promise.resolve(null),
      ]);

      return { ...report, linkedResearch, linkedPartners, offeringData, portfolioData };
    }),

  // Create or update a report
  upsert: protectedProcedure
    .input(upsertInput)
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const { id, ...data } = input;
      if (id) {
        await db
          .update(uniApprovalReports)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(uniApprovalReports.id, id));
        return { id };
      }
      const [result] = await db.insert(uniApprovalReports).values(data);
      return { id: result.insertId };
    }),

  // Update status (submit for review, approve, reject, etc.)
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: statusEnum,
      reviewedBy: z.string().optional(),
      approvedBy: z.string().optional(),
      reviewNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const now = Date.now();
      const updates: Record<string, any> = {
        status: input.status,
        updatedAt: new Date(),
      };
      if (input.reviewedBy) updates.reviewedBy = input.reviewedBy;
      if (input.approvedBy) updates.approvedBy = input.approvedBy;
      if (input.reviewNotes) updates.reviewNotes = input.reviewNotes;
      if (input.status === "under_review") updates.submittedAt = now;
      if (input.status === "approved") updates.approvedAt = now;
      if (input.status === "under_review" || input.status === "revision_requested") updates.reviewedAt = now;

      await db
        .update(uniApprovalReports)
        .set(updates)
        .where(eq(uniApprovalReports.id, input.id));
      return { success: true };
    }),

  // Delete a report
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(uniApprovalReports).where(eq(uniApprovalReports.id, input.id));
      return { success: true };
    }),

  // AI-generate a full approval report using offering context, research, and validation data
  generateAI: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      offeringId: z.string().optional(),
      portfolioId: z.string().optional(),
      reportType: reportTypeEnum.default("syllabus_approval"),
      h4Stage: h4StageEnum.default("problem_definition"),
      linkedResearchIds: z.string().optional(),
      linkedPartnerIds: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;

      // Gather context: venture, offering, research projects, partners, experiments, milestones
      const [ventureRows, offeringRows, portfolioRows] = await Promise.all([
        db.select().from(ventures).where(eq(ventures.id, input.ventureId)),
        input.offeringId
          ? db.select().from(offerings).where(eq(offerings.id, input.offeringId))
          : Promise.resolve([]),
        input.portfolioId
          ? db.select().from(portfolios).where(eq(portfolios.id, input.portfolioId))
          : Promise.resolve([]),
      ]);
      const venture = ventureRows[0];
      const offering = offeringRows[0] ?? null;
      const portfolio = portfolioRows[0] ?? null;

      // Fetch linked research and partners
      const researchIds = input.linkedResearchIds
        ? input.linkedResearchIds.split(",").map(Number).filter(Boolean)
        : [];
      const partnerIds = input.linkedPartnerIds
        ? input.linkedPartnerIds.split(",").map(Number).filter(Boolean)
        : [];

      const [researchProjects, partners, ventureExperiments, ventureMilestones] = await Promise.all([
        researchIds.length > 0
          ? db.select().from(uniResearchProjects).where(inArray(uniResearchProjects.id, researchIds))
          : db.select().from(uniResearchProjects).where(eq(uniResearchProjects.ventureId, input.ventureId)).limit(5),
        partnerIds.length > 0
          ? db.select().from(uniPartners).where(inArray(uniPartners.id, partnerIds))
          : db.select().from(uniPartners).where(eq(uniPartners.ventureId, input.ventureId)).limit(3),
        db.select().from(experiments).where(eq(experiments.ventureId, input.ventureId)).limit(8),
        db.select().from(milestones).where(eq(milestones.ventureId, input.ventureId)).limit(10),
      ]);

      // Build context string
      const ventureCtx = venture
        ? `Venture: ${venture.name} (${venture.sector ?? "Sustainable Technology"})\nDescription: ${venture.description ?? ""}\nTRL: ${venture.trl}/9 | VRL: ${venture.vrl}/9`
        : `Venture ID: ${input.ventureId}`;
      const offeringCtx = offering
        ? `\nOffering: ${offering.name} (${offering.offeringType ?? "Product/Service"})\nDescription: ${offering.description ?? ""}\nRevenue Model: ${offering.revenueModel ?? ""}\nTarget Segment: ${offering.targetSegment ?? ""}`
        : "";
      const portfolioCtx = portfolio ? `\nPortfolio: ${portfolio.name} (${portfolio.portfolioType ?? ""})` : "";
      const researchCtx = researchProjects.length > 0
        ? `\n\nResearch Projects:\n${researchProjects.map(r => `- ${r.title} (${r.researchType}, ${r.status}): ${r.objective ?? r.description ?? ""}`).join("\n")}`
        : "";
      const partnerCtx = partners.length > 0
        ? `\n\nUniversity Partners:\n${partners.map(p => `- ${p.name} (${p.type ?? "University"}): ${p.partnershipType ?? ""}`).join("\n")}`
        : "";
      const experimentCtx = ventureExperiments.length > 0
        ? `\n\nValidation Experiments:\n${ventureExperiments.map(e => `- ${e.title}: ${e.outcome ?? "Pending"} — ${e.result ?? ""}`).join("\n")}`
        : "";
      const milestoneCtx = ventureMilestones.length > 0
        ? `\n\nKey Milestones:\n${ventureMilestones.map(m => `- ${m.label}: ${m.completed ? "✓ Complete" : "Pending"}`).join("\n")}`
        : "";

      const reportTypeLabel: Record<string, string> = {
        syllabus_approval: "Syllabus Approval Report",
        research_validation: "Research Validation Report",
        industry_engagement: "Industry Engagement Report",
        ethics_clearance: "Ethics Clearance Report",
        ip_disclosure: "IP Disclosure Report",
        commercialisation_approval: "Commercialisation Approval Report",
      };
      const h4StageLabel: Record<string, string> = {
        problem_definition: "Stage 1: Problem Definition",
        research_discovery: "Stage 2: Research & Discovery",
        hypothesis_development: "Stage 3: Hypothesis Development",
        validation: "Stage 4: Validation",
        commercialisation: "Stage 5: Commercialisation",
      };

      const systemPrompt = `You are an academic venture creation specialist writing formal university approval reports for the EcoBlend Venture Building Studio (VBS). 
You follow the H4 Lean Methodology dual-risk model:
- Product Risk: managed by founders (technology, engineering, product development)
- Business Risk: managed by the university (market strategy, commercialisation, academic validation)

Write a professional, structured ${reportTypeLabel[input.reportType]} for ${h4StageLabel[input.h4Stage]}.
Use British English. Be specific, evidence-based, and academically rigorous.
Format the output as a structured markdown document with clear section headings.

The report must include these sections:
1. Executive Summary (3-4 sentences)
2. Problem Statement & Opportunity
3. Research Objectives
4. Methodology (H4 Lean + Dual Risk Model)
5. Validation Evidence (from experiments and milestones)
6. Academic Contribution
7. Commercial Potential
8. Ethics Statement
9. IP & Commercialisation Statement
10. Recommendations for Approval

Keep each section concise (3-6 sentences). Emphasise the dual-risk model throughout.`;

      const userPrompt = `Generate a ${reportTypeLabel[input.reportType]} for the following venture/offering at H4 ${h4StageLabel[input.h4Stage]}:

${ventureCtx}${offeringCtx}${portfolioCtx}${researchCtx}${partnerCtx}${experimentCtx}${milestoneCtx}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const aiContent = String(response.choices[0]?.message?.content ?? "");

      // Parse sections from the markdown output
      const extractSection = (content: string, heading: string): string => {
        const regex = new RegExp(`(?:#{1,3}\\s*(?:\\d+\\.\\s*)?${heading}[^\\n]*)\\n([\\s\\S]*?)(?=\\n#{1,3}|$)`, "i");
        const match = content.match(regex);
        return match ? match[1].trim() : "";
      };

      const executiveSummary = extractSection(aiContent, "Executive Summary");
      const problemStatement = extractSection(aiContent, "Problem Statement");
      const researchObjectives = extractSection(aiContent, "Research Objectives");
      const methodology = extractSection(aiContent, "Methodology");
      const validationEvidence = extractSection(aiContent, "Validation Evidence");
      const academicContribution = extractSection(aiContent, "Academic Contribution");
      const commercialPotential = extractSection(aiContent, "Commercial Potential");
      const ethicsStatement = extractSection(aiContent, "Ethics");
      const ipStatement = extractSection(aiContent, "IP");
      const recommendations = extractSection(aiContent, "Recommendations");

      // Save to DB
      const title = `${offering?.name ?? venture?.name ?? input.ventureId} — ${reportTypeLabel[input.reportType]} (${h4StageLabel[input.h4Stage]})`;
      const [result] = await db.insert(uniApprovalReports).values({
        ventureId: input.ventureId,
        offeringId: input.offeringId,
        portfolioId: input.portfolioId,
        title,
        reportType: input.reportType,
        status: "draft",
        h4Stage: input.h4Stage,
        vrlStage: venture?.vrl,
        trlLevel: venture?.trl,
        aiGenerated: true,
        aiContent,
        confidenceScore: 78,
        executiveSummary,
        problemStatement,
        researchObjectives,
        methodology,
        validationEvidence,
        academicContribution,
        commercialPotential,
        ethicsStatement,
        ipStatement,
        recommendations,
        linkedResearchIds: input.linkedResearchIds,
        linkedPartnerIds: input.linkedPartnerIds,
        productRiskOwner: venture?.founder ?? "Founder",
        businessRiskOwner: partners[0]?.contactName ?? "University Partner",
      });

      return {
        id: result.insertId,
        title,
        aiContent,
        confidenceScore: 78,
        sections: {
          executiveSummary,
          problemStatement,
          researchObjectives,
          methodology,
          validationEvidence,
          academicContribution,
          commercialPotential,
          ethicsStatement,
          ipStatement,
          recommendations,
        },
      };
    }),

  // Get summary stats for a venture's approval reports
  getSummary: publicProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const reports = await db
        .select()
        .from(uniApprovalReports)
        .where(eq(uniApprovalReports.ventureId, input.ventureId));

      const byStatus = reports.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byType = reports.reduce((acc, r) => {
        acc[r.reportType] = (acc[r.reportType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total: reports.length,
        approved: byStatus["approved"] ?? 0,
        underReview: byStatus["under_review"] ?? 0,
        draft: byStatus["draft"] ?? 0,
        rejected: byStatus["rejected"] ?? 0,
        byStatus,
        byType,
        approvalRate: reports.length > 0
          ? Math.round(((byStatus["approved"] ?? 0) / reports.length) * 100)
          : 0,
      };
    }),
});
