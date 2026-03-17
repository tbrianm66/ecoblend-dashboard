/**
 * matchingDb.ts — Founder ↔ Opportunity Matching Engine
 *
 * Computes multi-dimensional compatibility scores between talent profiles
 * and product opportunities, then aggregates them into a composite match score.
 *
 * Score dimensions (each 0–100):
 *   1. Sector Alignment   — overlap between founder expertise and opportunity sector
 *   2. Capability Fit     — founder capability scores vs. opportunity requirements
 *   3. Availability       — founder hours/week vs. estimated demand
 *   4. PVF (Values Fit)   — personal values / ESG mission alignment
 *   5. Experience         — years of experience + previous ventures
 *   6. Network            — investor / customer / supplier network strength
 *
 * Composite = weighted average (weights sum to 1.0)
 */

import { eq, and, desc, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  talentProfiles,
  productOpportunities,
  founderMatchScores,
  coFounderCompatibility,
  spinoffConfigurations,
  spinoffExecutionPlans,
  type TalentProfile,
  type ProductOpportunity,
  type FounderMatchScore,
  type SpinoffConfiguration,
} from "../drizzle/schema";

// ── Scoring weights ────────────────────────────────────────────────────────────
const WEIGHTS = {
  sectorAlignment: 0.25,
  capabilityFit:   0.25,
  availability:    0.10,
  pvf:             0.15,
  experience:      0.15,
  network:         0.10,
};

// ── Sector tag mapping ─────────────────────────────────────────────────────────
const SECTOR_KEYWORDS: Record<string, string[]> = {
  "Sustainable Transport":        ["transport", "mobility", "automotive", "ev", "logistics", "supply chain"],
  "Entertainment / Creative Tech":["creative", "media", "entertainment", "music", "film", "fashion", "design"],
  "Sports / Performance Tech":    ["sports", "performance", "fitness", "health", "wearable", "outdoor"],
  "Deep Tech / Materials Science":["materials", "chemistry", "manufacturing", "engineering", "composites", "deep tech"],
  "Clean Energy":                 ["energy", "solar", "wind", "battery", "cleantech", "sustainability"],
  "AgriTech / FoodTech":          ["agriculture", "food", "farming", "biotech", "nutrition"],
  "HealthTech":                   ["health", "medical", "biotech", "pharma", "wellness", "diagnostics"],
  "EdTech":                       ["education", "learning", "training", "skills", "edtech"],
};

// ── Pure scoring functions ─────────────────────────────────────────────────────

function computeSectorAlignment(founder: TalentProfile, opportunity: ProductOpportunity): number {
  const sector = opportunity.sector ?? "";
  const expertise = (founder.industryExpertise ?? "").toLowerCase();
  const keywords = SECTOR_KEYWORDS[sector] ?? [sector.toLowerCase()];
  const matches = keywords.filter(kw => expertise.includes(kw)).length;
  if (matches === 0) return 20;
  if (matches === 1) return 55;
  if (matches === 2) return 75;
  return Math.min(100, 75 + (matches - 2) * 10);
}

function computeCapabilityFit(founder: TalentProfile, opportunity: ProductOpportunity): number {
  const sector = opportunity.sector ?? "";
  const isTech = ["Deep Tech / Materials Science", "Clean Energy", "HealthTech"].includes(sector);
  const isCommercial = ["Sustainable Transport", "Sports / Performance Tech", "AgriTech / FoodTech"].includes(sector);

  let weighted: number;
  if (isTech) {
    weighted = (
      (founder.capTechnical ?? 0) * 0.35 +
      (founder.capCommercial ?? 0) * 0.20 +
      (founder.capOperational ?? 0) * 0.20 +
      (founder.capFinancial ?? 0) * 0.15 +
      (founder.capMarketing ?? 0) * 0.10
    );
  } else if (isCommercial) {
    weighted = (
      (founder.capTechnical ?? 0) * 0.15 +
      (founder.capCommercial ?? 0) * 0.35 +
      (founder.capOperational ?? 0) * 0.20 +
      (founder.capFinancial ?? 0) * 0.15 +
      (founder.capMarketing ?? 0) * 0.15
    );
  } else {
    const caps = [
      founder.capTechnical ?? 0,
      founder.capCommercial ?? 0,
      founder.capOperational ?? 0,
      founder.capFinancial ?? 0,
      founder.capMarketing ?? 0,
    ];
    weighted = caps.reduce((a, b) => a + b, 0) / caps.length;
  }
  return Math.round((weighted / 10) * 100);
}

function computeAvailabilityScore(founder: TalentProfile): number {
  const avail = founder.availability ?? "Not Available";
  const hours = founder.availabilityHoursPerWeek ?? 0;
  if (avail === "Not Available") return 0;
  if (avail === "Advisory Only") return 20;
  if (avail === "Part-Time Only") return Math.min(60, Math.round((hours / 20) * 60));
  if (avail === "Available in 3 Months") return 55;
  if (avail === "Available in 1 Month") return 75;
  return Math.min(100, 75 + Math.round((hours / 40) * 25));
}

function computePvfScore(founder: TalentProfile): number {
  const avg = (
    (founder.attrLeadership ?? 0) +
    (founder.attrResilience ?? 0) +
    (founder.attrCollaboration ?? 0) +
    (founder.attrRiskTolerance ?? 0)
  ) / 4;
  return Math.round((avg / 10) * 100);
}

function computeExperienceScore(founder: TalentProfile): number {
  const years    = Math.min(founder.yearsExperience ?? 0, 20);
  const ventures = Math.min(founder.previousVentures ?? 0, 5);
  const exits    = Math.min(founder.previousExits ?? 0, 3);
  const leadership = Math.min(founder.previousLeadershipRoles ?? 0, 5);
  return Math.round((years / 20) * 40 + (ventures / 5) * 30 + (exits / 3) * 20 + (leadership / 5) * 10);
}

function computeNetworkScore(founder: TalentProfile): number {
  const avg = (
    (founder.networkInvestors ?? 0) +
    (founder.networkCustomers ?? 0) +
    (founder.networkSuppliers ?? 0) +
    (founder.networkRegulators ?? 0) +
    (founder.networkIndustry ?? 0)
  ) / 5;
  return Math.round((avg / 10) * 100);
}

function computeOverallScore(d: {
  sectorAlignment: number;
  capability: number;
  availability: number;
  pvf: number;
  experience: number;
  network: number;
}): number {
  return Math.round(
    d.sectorAlignment * WEIGHTS.sectorAlignment +
    d.capability      * WEIGHTS.capabilityFit +
    d.availability    * WEIGHTS.availability +
    d.pvf             * WEIGHTS.pvf +
    d.experience      * WEIGHTS.experience +
    d.network         * WEIGHTS.network
  );
}

function recommendRole(founder: TalentProfile): string {
  const caps: Record<string, number> = {
    Technical:   founder.capTechnical ?? 0,
    Commercial:  founder.capCommercial ?? 0,
    Operational: founder.capOperational ?? 0,
    Financial:   founder.capFinancial ?? 0,
    Marketing:   founder.capMarketing ?? 0,
  };
  const top = Object.entries(caps).sort((a, b) => b[1] - a[1])[0][0];
  const roleMap: Record<string, string> = {
    Technical:   "CTO / Technical Co-Founder",
    Commercial:  "CEO / Commercial Lead",
    Operational: "COO / Operations Lead",
    Financial:   "CFO / Finance Lead",
    Marketing:   "CMO / Marketing Lead",
  };
  return roleMap[top] ?? "Co-Founder";
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function computeAndSaveMatchScore(
  talentProfileId: number,
  productOpportunityId: number
): Promise<FounderMatchScore | null> {
  const db = await getDb();
  if (!db) return null;

  const [founder] = await db.select().from(talentProfiles).where(eq(talentProfiles.id, talentProfileId));
  const [opportunity] = await db.select().from(productOpportunities).where(eq(productOpportunities.id, productOpportunityId));
  if (!founder || !opportunity) return null;

  const sectorAlignmentScore = computeSectorAlignment(founder, opportunity);
  const capabilityFitScore   = computeCapabilityFit(founder, opportunity);
  const availabilityScore    = computeAvailabilityScore(founder);
  const pvfScore             = computePvfScore(founder);
  const experienceScore      = computeExperienceScore(founder);
  const networkScore         = computeNetworkScore(founder);
  const overallMatchScore    = computeOverallScore({
    sectorAlignment: sectorAlignmentScore,
    capability:      capabilityFitScore,
    availability:    availabilityScore,
    pvf:             pvfScore,
    experience:      experienceScore,
    network:         networkScore,
  });
  const role = recommendRole(founder);

  await db.delete(founderMatchScores).where(
    and(
      eq(founderMatchScores.talentProfileId, talentProfileId),
      eq(founderMatchScores.productOpportunityId, productOpportunityId)
    )
  );

  await db.insert(founderMatchScores).values({
    talentProfileId,
    productOpportunityId,
    sectorAlignmentScore,
    capabilityFitScore,
    availabilityScore,
    pvfScore,
    experienceScore,
    networkScore,
    overallMatchScore,
    recommendedRole: role,
    status: "Suggested",
  });

  const [result] = await db.select().from(founderMatchScores).where(
    and(
      eq(founderMatchScores.talentProfileId, talentProfileId),
      eq(founderMatchScores.productOpportunityId, productOpportunityId)
    )
  );
  return result ?? null;
}

export async function getTopMatchesForOpportunity(
  productOpportunityId: number,
  limit = 10
) {
  const db = await getDb();
  if (!db) return [];

  const matches = await db
    .select()
    .from(founderMatchScores)
    .where(eq(founderMatchScores.productOpportunityId, productOpportunityId))
    .orderBy(desc(founderMatchScores.overallMatchScore))
    .limit(limit);

  const profileIds = matches.map((m: FounderMatchScore) => m.talentProfileId);
  if (profileIds.length === 0) return [];

  const profiles = await db.select().from(talentProfiles).where(inArray(talentProfiles.id, profileIds));
  const profileMap = new Map(profiles.map((p: TalentProfile) => [p.id, p]));

  return matches.map((m: FounderMatchScore) => ({
    ...m,
    founderName: profileMap.get(m.talentProfileId)?.name ?? "Unknown",
    founderRole: profileMap.get(m.talentProfileId)?.currentRole ?? "",
    availability: profileMap.get(m.talentProfileId)?.availability ?? "Unknown",
    bio: profileMap.get(m.talentProfileId)?.bio ?? "",
    industryExpertise: profileMap.get(m.talentProfileId)?.industryExpertise ?? "",
  }));
}

export async function getTopMatchesForFounder(
  talentProfileId: number,
  limit = 10
) {
  const db = await getDb();
  if (!db) return [];

  const matches = await db
    .select()
    .from(founderMatchScores)
    .where(eq(founderMatchScores.talentProfileId, talentProfileId))
    .orderBy(desc(founderMatchScores.overallMatchScore))
    .limit(limit);

  const oppIds = matches.map((m: FounderMatchScore) => m.productOpportunityId);
  if (oppIds.length === 0) return [];

  const opps = await db.select().from(productOpportunities).where(inArray(productOpportunities.id, oppIds));
  const oppMap = new Map(opps.map((o: ProductOpportunity) => [o.id, o]));

  return matches.map((m: FounderMatchScore) => ({
    ...m,
    opportunityName: oppMap.get(m.productOpportunityId)?.name ?? "Unknown",
    sector: oppMap.get(m.productOpportunityId)?.sector ?? "",
    status: oppMap.get(m.productOpportunityId)?.status ?? "",
    description: oppMap.get(m.productOpportunityId)?.description ?? "",
  }));
}

export async function computeAllMatchesForOpportunity(productOpportunityId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const allFounders = await db.select().from(talentProfiles);
  let count = 0;
  for (const founder of allFounders) {
    await computeAndSaveMatchScore(founder.id, productOpportunityId);
    count++;
  }
  return count;
}

export async function computeAllMatchesForFounder(talentProfileId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const allOpps = await db.select().from(productOpportunities);
  let count = 0;
  for (const opp of allOpps) {
    await computeAndSaveMatchScore(talentProfileId, opp.id);
    count++;
  }
  return count;
}

// ── Co-founder compatibility ───────────────────────────────────────────────────

export async function computeCoFounderCompatibility(
  profileIdA: number,
  profileIdB: number,
  opportunityId?: number
) {
  const db = await getDb();
  if (!db) return null;

  const [a] = await db.select().from(talentProfiles).where(eq(talentProfiles.id, profileIdA));
  const [b] = await db.select().from(talentProfiles).where(eq(talentProfiles.id, profileIdB));
  if (!a || !b) return null;

  const capsA = [a.capTechnical ?? 0, a.capCommercial ?? 0, a.capOperational ?? 0, a.capFinancial ?? 0, a.capMarketing ?? 0];
  const capsB = [b.capTechnical ?? 0, b.capCommercial ?? 0, b.capOperational ?? 0, b.capFinancial ?? 0, b.capMarketing ?? 0];
  const capDiff = capsA.reduce((sum, ca, i) => sum + Math.abs(ca - (capsB[i] ?? 0)), 0);
  const capComplement = Math.round(Math.min(100, (capDiff / 50) * 100));

  const attrDiff =
    Math.abs((a.attrLeadership ?? 0) - (b.attrLeadership ?? 0)) +
    Math.abs((a.attrResilience ?? 0) - (b.attrResilience ?? 0)) +
    Math.abs((a.attrCollaboration ?? 0) - (b.attrCollaboration ?? 0));
  const valueAlignment = Math.round(100 - Math.min(100, (attrDiff / 30) * 100));

  const styleScore = Math.round(
    100 - Math.min(100, (
      Math.abs((a.attrCollaboration ?? 0) - (b.attrCollaboration ?? 0)) +
      Math.abs((a.attrExecution ?? 0) - (b.attrExecution ?? 0))
    ) / 20 * 100)
  );

  const netsA = [a.networkInvestors ?? 0, a.networkCustomers ?? 0, a.networkSuppliers ?? 0];
  const netsB = [b.networkInvestors ?? 0, b.networkCustomers ?? 0, b.networkSuppliers ?? 0];
  const netDiff = netsA.reduce((sum, na, i) => sum + Math.abs(na - (netsB[i] ?? 0)), 0);
  const netComplement = Math.round(Math.min(100, (netDiff / 30) * 100));

  const overall = Math.round(
    capComplement * 0.35 + valueAlignment * 0.30 + styleScore * 0.20 + netComplement * 0.15
  );

  await db.delete(coFounderCompatibility).where(
    and(
      eq(coFounderCompatibility.talentProfileIdA, profileIdA),
      eq(coFounderCompatibility.talentProfileIdB, profileIdB)
    )
  );

  await db.insert(coFounderCompatibility).values({
    talentProfileIdA: profileIdA,
    talentProfileIdB: profileIdB,
    productOpportunityId: opportunityId ?? null,
    capabilityComplementScore: capComplement,
    valueAlignmentScore: valueAlignment,
    workingStyleScore: styleScore,
    networkComplementScore: netComplement,
    overallCompatibilityScore: overall,
  });

  return { capComplement, valueAlignment, styleScore, netComplement, overall, nameA: a.name, nameB: b.name };
}

export async function getAllTalentProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(talentProfiles).orderBy(desc(talentProfiles.createdAt));
}

// ── Spin-Off Configuration helpers ────────────────────────────────────────────

export async function createSpinoffConfig(data: {
  productOpportunityId: number;
  founderProfileIds: number[];
  proposedVentureName?: string;
  proposedTagline?: string;
  proposedSector?: string;
  proposedChannel?: "B2B" | "D2C" | "B2B2C";
  proposedBrandColor?: string;
  strategicClassification?: "Sustaining" | "Disruptive-NewMarket" | "Disruptive-LowEnd";
  engineOfGrowth?: "Sticky" | "Viral" | "Paid";
  estimatedBurnRateMonthly?: number;
  estimatedRunwayMonths?: number;
  fundingAskAmount?: number;
  nominatedCharity?: string;
  assignedMentor?: string;
  vbsSupportLevel?: "Full Incubation" | "Accelerator" | "Advisory Only";
}): Promise<SpinoffConfiguration | null> {
  const db = await getDb();
  if (!db) return null;

  const [opp] = await db.select().from(productOpportunities).where(eq(productOpportunities.id, data.productOpportunityId));

  await db.insert(spinoffConfigurations).values({
    productOpportunityId: data.productOpportunityId,
    founderProfileIds: data.founderProfileIds.join(","),
    proposedVentureName: data.proposedVentureName ?? opp?.name ?? "New Venture",
    proposedTagline: data.proposedTagline ?? opp?.description ?? "",
    proposedSector: data.proposedSector ?? opp?.sector ?? "",
    proposedChannel: data.proposedChannel ?? "B2B",
    proposedBrandColor: data.proposedBrandColor ?? "#22c55e",
    strategicClassification: data.strategicClassification ?? "Sustaining",
    engineOfGrowth: data.engineOfGrowth ?? "Sticky",
    estimatedBurnRateMonthly: data.estimatedBurnRateMonthly ?? 15000,
    estimatedRunwayMonths: data.estimatedRunwayMonths ?? 12,
    fundingAskAmount: data.fundingAskAmount ?? 150000,
    nominatedCharity: data.nominatedCharity ?? "",
    assignedMentor: data.assignedMentor ?? "",
    vbsSupportLevel: data.vbsSupportLevel ?? "Full Incubation",
    status: "Draft",
  });

  const [config] = await db.select().from(spinoffConfigurations).orderBy(desc(spinoffConfigurations.id)).limit(1);
  return config ?? null;
}

export async function getSpinoffConfig(id: number): Promise<SpinoffConfiguration | null> {
  const db = await getDb();
  if (!db) return null;
  const [config] = await db.select().from(spinoffConfigurations).where(eq(spinoffConfigurations.id, id));
  return config ?? null;
}

export async function listSpinoffConfigs(): Promise<SpinoffConfiguration[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(spinoffConfigurations).orderBy(desc(spinoffConfigurations.createdAt));
}

export async function updateSpinoffConfig(
  id: number,
  data: Partial<{
    proposedVentureName: string;
    proposedTagline: string;
    proposedSector: string;
    proposedChannel: "B2B" | "D2C" | "B2B2C";
    proposedBrandColor: string;
    strategicClassification: "Sustaining" | "Disruptive-NewMarket" | "Disruptive-LowEnd";
    engineOfGrowth: "Sticky" | "Viral" | "Paid";
    estimatedBurnRateMonthly: number;
    estimatedRunwayMonths: number;
    fundingAskAmount: number;
    nominatedCharity: string;
    assignedMentor: string;
    vbsSupportLevel: "Full Incubation" | "Accelerator" | "Advisory Only";
    status: "Draft" | "Under Review" | "Approved" | "Rejected" | "Launched";
    convertedToVentureId: string;
  }>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(spinoffConfigurations).set(data).where(eq(spinoffConfigurations.id, id));
}

// ── Execution plan helpers ────────────────────────────────────────────────────

export async function saveExecutionPlan(data: {
  spinoffConfigId: number;
  planTitle: string;
  executiveSummary: string;
  fullPlanMarkdown: string;
  milestonesJson: string;
  resourceAllocationJson: string;
  risksJson: string;
  kpiFrameworkJson: string;
}) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(spinoffExecutionPlans).values({
    ...data,
    generatedBy: "llm",
    status: "Draft",
  });

  const [saved] = await db.select().from(spinoffExecutionPlans)
    .where(eq(spinoffExecutionPlans.spinoffConfigId, data.spinoffConfigId))
    .orderBy(desc(spinoffExecutionPlans.createdAt))
    .limit(1);
  return saved ?? null;
}

export async function getExecutionPlan(spinoffConfigId: number) {
  const db = await getDb();
  if (!db) return null;
  const [plan] = await db.select().from(spinoffExecutionPlans)
    .where(eq(spinoffExecutionPlans.spinoffConfigId, spinoffConfigId))
    .orderBy(desc(spinoffExecutionPlans.createdAt))
    .limit(1);
  return plan ?? null;
}

export async function updateExecutionPlanStatus(
  id: number,
  status: "Draft" | "Under Review" | "Approved" | "Superseded",
  reviewedBy?: string
) {
  const db = await getDb();
  if (!db) return;
  await db.update(spinoffExecutionPlans)
    .set({ status, ...(reviewedBy ? { reviewedBy, reviewedAt: new Date() } : {}) })
    .where(eq(spinoffExecutionPlans.id, id));
}

// ── Exported scoring utilities (for tests) ────────────────────────────────────
export {
  computeSectorAlignment,
  computeCapabilityFit,
  computeAvailabilityScore,
  computePvfScore,
  computeExperienceScore,
  computeNetworkScore,
  computeOverallScore,
  recommendRole,
  WEIGHTS,
};
