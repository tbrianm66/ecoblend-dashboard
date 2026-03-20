// ============================================================
// SPIN-OUT BLUEPRINT ROUTER (Sprint 63)
// Procedures:
//   create, get, list, update, delete
//   computeReadiness  — scores all 6 domains from live library data
//   addLibraryLink, removeLibraryLink, listLibraryLinks, updateLinkStatus
//   generateBlueprint — AI-powered full blueprint markdown
//   launchToSpinoffOS — creates a SpinoffOS config from the blueprint
// ============================================================
import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import {
  spinoutBlueprints,
  blueprintLibraryLinks,
  offerings,
  portfolios,
  ventures,
  talentProfiles,
  mfgApprovedSuppliers,
  uniPartners,
  uniResearchProjects,
  offeringFinancialModels,
  marketAnalysis,
  specialists,
  experiments,
  milestones,
  risks,
  spinoffConfigurations,
} from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// ── Domain weight configuration ──────────────────────────────────────────────
// Each domain contributes a weighted % to the overall readiness score.
const DOMAIN_WEIGHTS = {
  talent:       0.20,
  supplyChain:  0.15,
  finance:      0.20,
  market:       0.20,
  technology:   0.15,
  governance:   0.10,
};

// ── Gate thresholds ───────────────────────────────────────────────────────────
function computeGateStatus(score: number): "not_ready" | "approaching" | "ready_to_review" | "approved" | "launched" {
  if (score < 40) return "not_ready";
  if (score < 60) return "approaching";
  return "ready_to_review";
}

// ── Readiness computation helpers ─────────────────────────────────────────────
async function computeDomainScores(offeringId: string, ventureId: string, blueprintId: number) {
  const db = (await getDb())!;
  // Get library links for this blueprint
  const links = await db.select().from(blueprintLibraryLinks).where(eq(blueprintLibraryLinks.blueprintId, blueprintId));

  const confirmedLinks = (domain: string) =>
    links.filter(l => l.domain === domain && (l.linkStatus === "confirmed" || l.linkStatus === "contracted")).length;
  const proposedLinks = (domain: string) =>
    links.filter(l => l.domain === domain).length;

  // Talent score: based on confirmed talent links + experiments pass rate
  const talentLinks = confirmedLinks("talent");
  const talentTotal = Math.max(proposedLinks("talent"), 1);
  const talentBase = Math.min(100, (talentLinks / talentTotal) * 100);

  // Supply chain score: confirmed supplier links
  const scLinks = confirmedLinks("supply_chain");
  const scTotal = Math.max(proposedLinks("supply_chain"), 1);
  const supplyChainBase = Math.min(100, (scLinks / scTotal) * 100);

  // Finance score: offering financial model exists + confirmed finance links
  const [finModel] = await db.select().from(offeringFinancialModels).where(eq(offeringFinancialModels.offeringId, offeringId)).limit(1);
  const finLinks = confirmedLinks("finance");
  const financeBase = finModel
    ? Math.min(100, 50 + finLinks * 10)
    : Math.min(100, finLinks * 15);

  // Market score: market analysis + competitor links
      const [mktAnalysisRow] = await db.select().from(marketAnalysis).where(eq(marketAnalysis.ventureId, ventureId)).limit(1);
  const mktLinks = confirmedLinks("market");
  const marketBase = mktAnalysisRow
    ? Math.min(100, 50 + mktLinks * 10)
    : Math.min(100, mktLinks * 15);

  // Technology score: TRL-linked experiments + offering TRL
  const [offering] = await db.select().from(offerings).where(eq(offerings.id, offeringId)).limit(1);
  const passedExperiments = await db.select().from(experiments)
    .where(and(eq(experiments.offeringId, offeringId), eq(experiments.outcome, "Pass")));
  const trlScore = offering ? Math.min(100, ((offering.trl ?? 1) / 9) * 100) : 0;
  const expBonus = Math.min(30, passedExperiments.length * 5);
  const technologyBase = Math.min(100, trlScore * 0.7 + expBonus);

  // Governance score: legal + IP + specialist links + milestones completed
  const govLinks = confirmedLinks("legal") + confirmedLinks("ip") + confirmedLinks("specialist");
  const completedMilestones = await db.select().from(milestones)
    .where(and(eq(milestones.offeringId, offeringId), eq(milestones.completed, true)));
  const govBase = Math.min(100, govLinks * 15 + completedMilestones.length * 5);

  return {
    talentScore:      Math.round(talentBase),
    supplyChainScore: Math.round(supplyChainBase),
    financeScore:     Math.round(financeBase),
    marketScore:      Math.round(marketBase),
    technologyScore:  Math.round(technologyBase),
    governanceScore:  Math.round(govBase),
    overallScore:     Math.round(
      talentBase      * DOMAIN_WEIGHTS.talent +
      supplyChainBase * DOMAIN_WEIGHTS.supplyChain +
      financeBase     * DOMAIN_WEIGHTS.finance +
      marketBase      * DOMAIN_WEIGHTS.market +
      technologyBase  * DOMAIN_WEIGHTS.technology +
      govBase         * DOMAIN_WEIGHTS.governance
    ),
  };
}

// ── Router ────────────────────────────────────────────────────────────────────
export const spinoutBlueprintRouter = router({

  // Create a new blueprint for an offering
  create: protectedProcedure
    .input(z.object({
      offeringId: z.string(),
      title: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const [offering] = await db.select().from(offerings).where(eq(offerings.id, input.offeringId)).limit(1);
      if (!offering) throw new Error("Offering not found");
      const title = input.title ?? `${offering.name} — Spin-Out Blueprint`;
      const [result] = await db.insert(spinoutBlueprints).values({
        offeringId: input.offeringId,
        portfolioId: offering.portfolioId,
        ventureId: offering.ventureId,
        title,
        createdBy: ctx.user.name ?? ctx.user.openId,
      });
      const id = (result as { insertId: number }).insertId;
      return db.select().from(spinoutBlueprints).where(eq(spinoutBlueprints.id, id)).limit(1).then(r => r[0]);
    }),

  // Get a single blueprint with its library links
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const [blueprint] = await db.select().from(spinoutBlueprints).where(eq(spinoutBlueprints.id, input.id)).limit(1);
      if (!blueprint) return null;
      const links = await db.select().from(blueprintLibraryLinks).where(eq(blueprintLibraryLinks.blueprintId, input.id));
      const [offering] = await db.select().from(offerings).where(eq(offerings.id, blueprint.offeringId)).limit(1);
      const [portfolio] = await db.select().from(portfolios).where(eq(portfolios.id, blueprint.portfolioId)).limit(1);
      const [venture] = await db.select().from(ventures).where(eq(ventures.id, blueprint.ventureId)).limit(1);
      return { ...blueprint, links, offering, portfolio, venture };
    }),

  // List all blueprints, optionally filtered by venture or offering
  list: protectedProcedure
    .input(z.object({
      ventureId: z.string().optional(),
      offeringId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const rows = await db.select().from(spinoutBlueprints).orderBy(desc(spinoutBlueprints.updatedAt));
      return rows.filter(b =>
        (!input.ventureId || b.ventureId === input.ventureId) &&
        (!input.offeringId || b.offeringId === input.offeringId)
      );
    }),

  // Update blueprint metadata / status
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      gateStatus: z.enum(["not_ready", "approaching", "ready_to_review", "approved", "launched"]).optional(),
      reviewedBy: z.string().optional(),
      reviewNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const { id, ...rest } = input;
      await db.update(spinoutBlueprints).set({ ...rest, updatedAt: new Date() }).where(eq(spinoutBlueprints.id, id));
      return db.select().from(spinoutBlueprints).where(eq(spinoutBlueprints.id, id)).limit(1).then(r => r[0]);
    }),

  // Delete a blueprint and all its library links
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(blueprintLibraryLinks).where(eq(blueprintLibraryLinks.blueprintId, input.id));
      await db.delete(spinoutBlueprints).where(eq(spinoutBlueprints.id, input.id));
      return { success: true };
    }),

  // Compute and persist readiness scores for a blueprint
  computeReadiness: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const [blueprint] = await db.select().from(spinoutBlueprints).where(eq(spinoutBlueprints.id, input.id)).limit(1);
      if (!blueprint) throw new Error("Blueprint not found");
      const scores = await computeDomainScores(blueprint.offeringId, blueprint.ventureId, input.id);
      const gateStatus = blueprint.gateStatus === "approved" || blueprint.gateStatus === "launched"
        ? blueprint.gateStatus
        : computeGateStatus(scores.overallScore);
      await db.update(spinoutBlueprints).set({ ...scores, gateStatus, updatedAt: new Date() }).where(eq(spinoutBlueprints.id, input.id));
      return { ...scores, gateStatus };
    }),

  // Add a library link to a blueprint
  addLibraryLink: protectedProcedure
    .input(z.object({
      blueprintId: z.number(),
      domain: z.enum(["talent", "supply_chain", "university", "research", "finance", "market", "ip", "legal", "crm", "specialist"]),
      linkedRecordId: z.string(),
      linkedRecordLabel: z.string().optional(),
      readinessWeight: z.number().min(0).max(100).optional(),
      linkStatus: z.enum(["proposed", "confirmed", "contracted", "unavailable"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(blueprintLibraryLinks).values({
        blueprintId: input.blueprintId,
        domain: input.domain,
        linkedRecordId: input.linkedRecordId,
        linkedRecordLabel: input.linkedRecordLabel,
        readinessWeight: input.readinessWeight ?? 10,
        linkStatus: input.linkStatus ?? "proposed",
        notes: input.notes,
      });
      const id = (result as { insertId: number }).insertId;
      return db.select().from(blueprintLibraryLinks).where(eq(blueprintLibraryLinks.id, id)).limit(1).then(r => r[0]);
    }),

  // Update the status of a library link
  updateLinkStatus: protectedProcedure
    .input(z.object({
      linkId: z.number(),
      linkStatus: z.enum(["proposed", "confirmed", "contracted", "unavailable"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.update(blueprintLibraryLinks)
        .set({ linkStatus: input.linkStatus, notes: input.notes, updatedAt: new Date() })
        .where(eq(blueprintLibraryLinks.id, input.linkId));
      return { success: true };
    }),

  // Remove a library link
  removeLibraryLink: protectedProcedure
    .input(z.object({ linkId: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(blueprintLibraryLinks).where(eq(blueprintLibraryLinks.id, input.linkId));
      return { success: true };
    }),

  // List all library links for a blueprint
  listLibraryLinks: protectedProcedure
    .input(z.object({ blueprintId: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db.select().from(blueprintLibraryLinks).where(eq(blueprintLibraryLinks.blueprintId, input.blueprintId));
    }),

  // Get available library records for a given domain and venture/offering
  getLibraryOptions: protectedProcedure
    .input(z.object({
      domain: z.enum(["talent", "supply_chain", "university", "research", "finance", "market", "ip", "legal", "crm", "specialist"]),
      ventureId: z.string().optional(),
      offeringId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      switch (input.domain) {
        case "talent": {
          const rows = await db.select({
            id: talentProfiles.id,
            name: talentProfiles.name,
            role: talentProfiles.currentRole,
            expertise: talentProfiles.industryExpertise,
          }).from(talentProfiles);
          return rows.map(r => ({ id: String(r.id), label: `${r.name} — ${r.role ?? "Founder"}`, meta: r.expertise }));
        }
        case "supply_chain": {
          const rows = await db.select({
            id: mfgApprovedSuppliers.id,
            name: mfgApprovedSuppliers.supplierName,
            category: mfgApprovedSuppliers.tierLevel,
          }).from(mfgApprovedSuppliers);
          return rows.map(r => ({ id: String(r.id), label: `${r.name} — ${r.category ?? "Supplier"}`, meta: null }));
        }
        case "university": {
          const rows = await db.select({
            id: uniPartners.id,
            name: uniPartners.name,
            type: uniPartners.partnershipType,
          }).from(uniPartners);
          return rows.map(r => ({ id: String(r.id), label: `${r.name} — ${r.type ?? "Partner"}`, meta: null }));
        }
        case "research": {
          const rows = await db.select({
            id: uniResearchProjects.id,
            title: uniResearchProjects.title,
            status: uniResearchProjects.status,
          }).from(uniResearchProjects);
          return rows.map(r => ({ id: String(r.id), label: `${r.title} (${r.status ?? "Active"})`, meta: null }));
        }
        case "finance": {
          if (!input.offeringId) return [];
          const rows = await db.select({
            id: offeringFinancialModels.id,
            name: offeringFinancialModels.modelName,
          }).from(offeringFinancialModels).where(eq(offeringFinancialModels.offeringId, input.offeringId));
          return rows.map(r => ({ id: String(r.id), label: r.name, meta: null }));
        }
        case "market": {
          if (!input.ventureId) return [];
          const rows = await db.select({
            id: marketAnalysis.id,
            title: marketAnalysis.marketName,
          }).from(marketAnalysis).where(eq(marketAnalysis.ventureId, input.ventureId));
          return rows.map(r => ({ id: String(r.id), label: r.title ?? "Market Analysis", meta: null }));
        }
        case "specialist": {
          const rows = await db.select({
            id: specialists.id,
            name: specialists.name,
            expertise: specialists.category,
          }).from(specialists);
          return rows.map(r => ({ id: String(r.id), label: `${r.name} — ${r.expertise ?? "Specialist"}`, meta: null }));
        }
        default:
          return [];
      }
    }),

  // AI: Generate the full Spin-Out Blueprint markdown
  generateBlueprint: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const [blueprint] = await db.select().from(spinoutBlueprints).where(eq(spinoutBlueprints.id, input.id)).limit(1);
      if (!blueprint) throw new Error("Blueprint not found");

      const links = await db.select().from(blueprintLibraryLinks).where(eq(blueprintLibraryLinks.blueprintId, input.id));
      const [offering] = await db.select().from(offerings).where(eq(offerings.id, blueprint.offeringId)).limit(1);
      const [venture] = await db.select().from(ventures).where(eq(ventures.id, blueprint.ventureId)).limit(1);
      const [portfolio] = await db.select().from(portfolios).where(eq(portfolios.id, blueprint.portfolioId)).limit(1);

      // Gather library summaries
      const talentLinks = links.filter(l => l.domain === "talent");
      const supplyLinks = links.filter(l => l.domain === "supply_chain");
      const uniLinks    = links.filter(l => l.domain === "university");
      const resLinks    = links.filter(l => l.domain === "research");
      const finLinks    = links.filter(l => l.domain === "finance");
      const mktLinks    = links.filter(l => l.domain === "market");
      const ipLinks     = links.filter(l => l.domain === "ip");
      const legalLinks  = links.filter(l => l.domain === "legal");
      const crmLinks    = links.filter(l => l.domain === "crm");
      const specLinks   = links.filter(l => l.domain === "specialist");

      const linkSummary = (arr: typeof links) =>
        arr.length > 0
          ? arr.map(l => `  • ${l.linkedRecordLabel ?? l.linkedRecordId} [${l.linkStatus}]`).join("\n")
          : "  (none linked yet)";

      const prompt = `You are an expert venture studio strategist at EcoRace VBS, specialising in spinning out university-backed ventures into execution platforms.

Generate a comprehensive Spin-Out Blueprint for the following offering. This blueprint will be used by a founder or industrial partner to understand exactly what readiness steps are required before launching the venture as an independent execution platform.

## Offering Details
Name: ${offering?.name ?? "Unknown"}
Type: ${offering?.offeringType ?? "Product/Service"}
Status: ${offering?.offeringStatus ?? "Concept"}
TRL Level: ${offering?.trl ?? 1}/9
Revenue Model: ${offering?.revenueModel ?? "B2B"}
Target Segment: ${offering?.targetSegment ?? "TBD"}
Price Point: ${offering?.pricePoint ? `£${offering.pricePoint}` : "TBD"}

## Parent Venture
${venture?.name ?? "Unknown"} — ${venture?.tagline ?? ""}
VRL: ${venture?.vrl ?? 1}/4 | TRL: ${venture?.trl ?? 1}/9
Strategic Classification: ${venture?.strategicClassification ?? "Sustaining"}
Engine of Growth: ${venture?.engineOfGrowth ?? "TBD"}

## Portfolio
${portfolio?.name ?? "Unknown"} — ${portfolio?.description ?? ""}

## Readiness Scores
- Talent: ${blueprint.talentScore}%
- Supply Chain: ${blueprint.supplyChainScore}%
- Finance: ${blueprint.financeScore}%
- Market: ${blueprint.marketScore}%
- Technology: ${blueprint.technologyScore}%
- Governance: ${blueprint.governanceScore}%
- **Overall: ${blueprint.overallScore}%** (Gate: ${blueprint.gateStatus?.replace(/_/g, " ").toUpperCase()})

## Linked Library Resources

### Talent
${linkSummary(talentLinks)}

### Supply Chain
${linkSummary(supplyLinks)}

### University Partners
${linkSummary(uniLinks)}

### Research Projects
${linkSummary(resLinks)}

### Financial Models
${linkSummary(finLinks)}

### Market Intelligence
${linkSummary(mktLinks)}

### IP Assets
${linkSummary(ipLinks)}

### Legal / Contracts
${linkSummary(legalLinks)}

### CRM / Pipeline
${linkSummary(crmLinks)}

### Specialist Services
${linkSummary(specLinks)}

---

Generate the Spin-Out Blueprint in Markdown with the following sections:

# 1. Executive Summary
A 2–3 paragraph strategic narrative explaining the offering's spin-out thesis, market opportunity, and readiness position.

# 2. Spin-Out Readiness Assessment
A domain-by-domain analysis of the 6 readiness domains (Talent, Supply Chain, Finance, Market, Technology, Governance). For each domain, state: current score, key strengths, critical gaps, and recommended actions to reach 80%+.

# 3. Execution Platform Blueprint
Describe the target execution platform structure: legal entity type, operational model, revenue architecture, team structure, and technology stack required.

# 4. 90-Day Activation Roadmap
A phased roadmap (Days 1–30, 31–60, 61–90) with specific milestones, owners, and success criteria for each phase.

# 5. Resource & Capital Requirements
Detailed resource plan: founding team roles, key hires, supply chain commitments, capital required (pre-seed/seed), and funding sources.

# 6. Risk Register & Mitigation
Top 6 risks across the 6 domains with likelihood, impact, and specific mitigation strategies.

# 7. University & Research Integration
How the academic partnerships and research projects will be leveraged in the execution platform (IP licensing, talent pipeline, co-development agreements).

# 8. Go-to-Market Strategy
Target customer profile, value proposition, first 3 sales channels, and 6-month revenue target.

# 9. Governance & Legal Framework
Legal entity structure, IP ownership, equity framework, compliance requirements, and B-Corp pathway.

# 10. Success Metrics & KPI Framework
5 primary KPIs with targets, measurement cadence, and the milestone that triggers the "Approved for Launch" gate.

Be specific, actionable, and grounded in the H4 Lean Methodology and EcoRace VBS framework. Use the linked library resources as evidence throughout.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an expert venture studio strategist specialising in university spin-outs and execution platform design. Generate precise, actionable blueprints in Markdown format." },
          { role: "user", content: prompt },
        ],
      });

      const rawContent = response.choices[0]?.message?.content;
      const blueprintMarkdown = typeof rawContent === "string" ? rawContent : "Blueprint generation failed.";

      // Extract execution roadmap (section 4) and gap analysis (section 2) for quick access
      const roadmapMatch = blueprintMarkdown.match(/# 4\. 90-Day Activation Roadmap([\s\S]*?)(?=# 5\.)/);
      const gapMatch = blueprintMarkdown.match(/# 2\. Spin-Out Readiness Assessment([\s\S]*?)(?=# 3\.)/);

      await db.update(spinoutBlueprints).set({
        blueprintMarkdown,
        executionRoadmap: roadmapMatch?.[1]?.trim() ?? null,
        gapAnalysis: gapMatch?.[1]?.trim() ?? null,
        updatedAt: new Date(),
      }).where(eq(spinoutBlueprints.id, input.id));

      return { blueprintMarkdown, success: true };
    }),

  // Launch: create a SpinoffOS config from this blueprint
  launchToSpinoffOS: protectedProcedure
    .input(z.object({
      id: z.number(),
      founderProfileIds: z.array(z.number()),
      productOpportunityId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const [blueprint] = await db.select().from(spinoutBlueprints).where(eq(spinoutBlueprints.id, input.id)).limit(1);
      if (!blueprint) throw new Error("Blueprint not found");
      if ((blueprint.overallScore ?? 0) < 40) throw new Error("Blueprint readiness score is below 40% — not ready to launch");

      const [offering] = await db.select().from(offerings).where(eq(offerings.id, blueprint.offeringId)).limit(1);
      const [venture] = await db.select().from(ventures).where(eq(ventures.id, blueprint.ventureId)).limit(1);

      const [result] = await db.insert(spinoffConfigurations).values({
        productOpportunityId: input.productOpportunityId ?? 0,
        founderProfileIds: input.founderProfileIds.join(","),
        proposedVentureName: offering?.name ?? venture?.name ?? "Spin-Out Venture",
        proposedTagline: offering?.description?.slice(0, 200) ?? venture?.tagline ?? "",
        proposedSector: venture?.sector ?? "Technology",
        proposedChannel: (offering?.revenueModel === "D2C" ? "D2C" : offering?.revenueModel === "B2B2C" ? "B2B2C" : "B2B") as "B2B" | "D2C" | "B2B2C",
        proposedBrandColor: offering?.color ?? venture?.color ?? "#51AF37",
        strategicClassification: (venture?.strategicClassification ?? "Sustaining") as "Sustaining" | "Disruptive-NewMarket" | "Disruptive-LowEnd",
        engineOfGrowth: venture?.engineOfGrowth ?? null,
        estimatedBurnRateMonthly: 15000,
        estimatedRunwayMonths: 12,
        fundingAskAmount: 150000,
        vbsSupportLevel: "Full Incubation",
        status: "Draft",
      });

      const spinoffConfigId = (result as { insertId: number }).insertId;

      // Link the blueprint to the spinoff config and mark as launched
      await db.update(spinoutBlueprints).set({
        spinoffConfigId,
        gateStatus: "launched",
        updatedAt: new Date(),
      }).where(eq(spinoutBlueprints.id, input.id));

      return { spinoffConfigId, success: true };
    }),

  // ── Dashboard: Spin-Out Pipeline Summary ─────────────────────────────────
  // Returns top offerings sorted by readiness score (closest to 40% gate first),
  // with domain breakdown and gate status for the Command Centre widget.
  getPipelineSummary: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(20).default(5),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      // Get all blueprints with their offering and venture info
      const allBlueprints = await db.select({
        id: spinoutBlueprints.id,
        title: spinoutBlueprints.title,
        offeringId: spinoutBlueprints.offeringId,
        ventureId: spinoutBlueprints.ventureId,
        overallScore: spinoutBlueprints.overallScore,
        talentScore: spinoutBlueprints.talentScore,
        supplyChainScore: spinoutBlueprints.supplyChainScore,
        financeScore: spinoutBlueprints.financeScore,
        marketScore: spinoutBlueprints.marketScore,
        technologyScore: spinoutBlueprints.technologyScore,
        governanceScore: spinoutBlueprints.governanceScore,
        gateStatus: spinoutBlueprints.gateStatus,
        blueprintMarkdown: spinoutBlueprints.blueprintMarkdown,
        spinoffConfigId: spinoutBlueprints.spinoffConfigId,
        updatedAt: spinoutBlueprints.updatedAt,
      }).from(spinoutBlueprints)
        .orderBy(desc(spinoutBlueprints.overallScore))
        .limit(input.limit);

      // Enrich with offering and venture names
      const enriched = await Promise.all(allBlueprints.map(async (bp) => {
        const [offering] = await db.select({ name: offerings.name, color: offerings.color, revenueModel: offerings.revenueModel })
          .from(offerings).where(eq(offerings.id, bp.offeringId)).limit(1);
        const [venture] = await db.select({ name: ventures.name, color: ventures.color })
          .from(ventures).where(eq(ventures.id, bp.ventureId)).limit(1);
        // Count library links
        const links = await db.select({ linkStatus: blueprintLibraryLinks.linkStatus, domain: blueprintLibraryLinks.domain })
          .from(blueprintLibraryLinks).where(eq(blueprintLibraryLinks.blueprintId, bp.id));
        const confirmedLinks = links.filter(l => l.linkStatus === "confirmed" || l.linkStatus === "contracted").length;
        const totalLinks = links.length;
        // Compute proximity to 40% gate (distance from gate)
        const gateProximity = (bp.overallScore ?? 0) >= 40 ? 0 : 40 - (bp.overallScore ?? 0);
        return {
          ...bp,
          offeringName: offering?.name ?? "Unknown Offering",
          offeringColor: offering?.color ?? venture?.color ?? "#51AF37",
          offeringType: offering?.revenueModel ?? "Product",
          ventureName: venture?.name ?? "Unknown Venture",
          ventureColor: venture?.color ?? "#51AF37",
          confirmedLinks,
          totalLinks,
          gateProximity,
          hasBlueprint: !!bp.blueprintMarkdown,
          isLaunched: bp.gateStatus === "launched",
        };
      }));

      // Sort: launched last, then by score descending (closest to 40% gate at top for not_ready/approaching)
      const sorted = enriched.sort((a, b) => {
        if (a.isLaunched && !b.isLaunched) return 1;
        if (!a.isLaunched && b.isLaunched) return -1;
        return (b.overallScore ?? 0) - (a.overallScore ?? 0);
      });

      // Compute summary stats
      const total = sorted.length;
      const readyToReview = sorted.filter(b => b.gateStatus === "ready_to_review" || b.gateStatus === "approved").length;
      const approaching = sorted.filter(b => b.gateStatus === "approaching").length;
      const launched = sorted.filter(b => b.gateStatus === "launched").length;
      const avgScore = total > 0 ? Math.round(sorted.reduce((s, b) => s + (b.overallScore ?? 0), 0) / total) : 0;

      return {
        blueprints: sorted,
        summary: { total, readyToReview, approaching, launched, avgScore },
      };
    }),
});
