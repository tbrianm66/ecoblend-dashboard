/**
 * Sprint 20 — People Intelligence Module
 * PVF Scoring Engine + tRPC Router
 *
 * Procedures:
 *  talent.list           — paginated talent pool
 *  talent.get            — single profile
 *  talent.create         — add new talent
 *  talent.update         — update profile
 *  talent.delete         — remove profile
 *  talent.topRankings    — top N by overall score
 *
 *  roles.list            — venture role requirements
 *  roles.create          — add role requirement
 *  roles.update          — update role
 *  roles.delete          — delete role
 *
 *  pvf.calculate         — compute PVF score for talent × venture
 *  pvf.listForVenture    — all PVF scores for a venture
 *  pvf.topMatches        — top talent matches for a venture
 *
 *  team.getComposition   — team composition for a venture
 *  team.assign           — assign talent to venture
 *  team.unassign         — remove talent from venture
 *
 *  gaps.list             — gap analysis for a venture
 *  gaps.compute          — (re)compute gaps for a venture
 *  gaps.resolve          — mark gap as resolved
 *
 *  dashboard.summary     — portfolio-wide people intelligence summary
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * PVF Scoring Engine
 * Weights: skills 30%, industry 20%, stage 20%, network 15%, availability 15%
 */
export function computePvfScore(params: {
  skillsMatch: number;
  industryMatch: number;
  stageMatch: number;
  networkValue: number;
  availabilityFit: number;
}): number {
  const { skillsMatch, industryMatch, stageMatch, networkValue, availabilityFit } = params;
  return Math.round(
    skillsMatch * 0.30 +
    industryMatch * 0.20 +
    stageMatch * 0.20 +
    networkValue * 0.15 +
    availabilityFit * 0.15
  );
}

/**
 * Calculate skills match between talent capabilities and role requirements
 */
export function calcSkillsMatch(talent: Record<string, number>, minCapScore: number): number {
  const avgCap = Math.round(
    ((talent.capTechnical ?? 0) +
     (talent.capCommercial ?? 0) +
     (talent.capOperational ?? 0) +
     (talent.capFinancial ?? 0) +
     (talent.capMarketing ?? 0)) / 5
  );
  if (minCapScore === 0) return avgCap;
  return Math.min(100, Math.round((avgCap / Math.max(minCapScore, 1)) * 100));
}

/**
 * Calculate industry match based on sector overlap
 */
export function calcIndustryMatch(
  talentIndustries: string[],
  ventureSector: string
): number {
  if (!talentIndustries.length) return 50;
  const sectorLower = ventureSector.toLowerCase();
  const match = talentIndustries.some(
    (i) => i.toLowerCase().includes(sectorLower) || sectorLower.includes(i.toLowerCase())
  );
  return match ? 90 : 40;
}

/**
 * Calculate stage match based on venture VRL and talent stage experience
 */
export function calcStageMatch(
  talent: Record<string, boolean | number>,
  ventureVrl: number
): number {
  // VRL 1-2 = Idea/Validation, VRL 3 = Build, VRL 4 = Scale
  if (ventureVrl <= 2) return talent.stageIdea || talent.stageValidation ? 90 : 40;
  if (ventureVrl === 3) return talent.stageBuild ? 90 : 50;
  return talent.stageScale ? 90 : 50;
}

/**
 * Calculate network value relative to venture needs
 */
export function calcNetworkValue(talent: Record<string, number>, minNetworkScore: number): number {
  const avgNetwork = Math.round(
    ((talent.networkInvestors ?? 0) +
     (talent.networkCustomers ?? 0) +
     (talent.networkIndustry ?? 0)) / 3
  );
  if (minNetworkScore === 0) return avgNetwork;
  return Math.min(100, Math.round((avgNetwork / Math.max(minNetworkScore, 1)) * 100));
}

/**
 * Calculate availability fit
 */
export function calcAvailabilityFit(availability: string): number {
  const map: Record<string, number> = {
    Available: 100,
    "Part-Time": 60,
    Committed: 20,
    Unavailable: 0,
  };
  return map[availability] ?? 50;
}

/**
 * Derive PVF grade from score
 */
export function pvfGrade(score: number): string {
  if (score >= 85) return "A+";
  if (score >= 75) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
}

/**
 * Compute gap severity from gap size
 */
export function gapSeverity(gapSize: number): string {
  if (gapSize >= 40) return "Critical";
  if (gapSize >= 25) return "High";
  if (gapSize >= 10) return "Medium";
  return "Low";
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const peopleIntelligenceRouter = router({

  // ── Talent Pool ─────────────────────────────────────────────────────────────

  "talent.list": protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      availability: z.string().optional(),
      profileType: z.string().optional(),
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const { search, availability, profileType, limit, offset } = input;

      let rows: Record<string, unknown>[];
      if (search && availability && profileType) {
        const like = `%${search}%`;
        rows = (await db.execute(sql`
          SELECT * FROM talent_profiles
          WHERE (name LIKE ${like} OR currentRole LIKE ${like} OR bio LIKE ${like})
            AND availability = ${availability}
            AND profileType = ${profileType}
          ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${offset}
        `)) as Record<string, unknown>[];
      } else if (search && availability) {
        const like = `%${search}%`;
        rows = (await db.execute(sql`
          SELECT * FROM talent_profiles
          WHERE (name LIKE ${like} OR currentRole LIKE ${like} OR bio LIKE ${like})
            AND availability = ${availability}
          ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${offset}
        `)) as Record<string, unknown>[];
      } else if (search && profileType) {
        const like = `%${search}%`;
        rows = (await db.execute(sql`
          SELECT * FROM talent_profiles
          WHERE (name LIKE ${like} OR currentRole LIKE ${like} OR bio LIKE ${like})
            AND profileType = ${profileType}
          ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${offset}
        `)) as Record<string, unknown>[];
      } else if (availability && profileType) {
        rows = (await db.execute(sql`
          SELECT * FROM talent_profiles
          WHERE availability = ${availability} AND profileType = ${profileType}
          ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${offset}
        `)) as Record<string, unknown>[];
      } else if (search) {
        const like = `%${search}%`;
        rows = (await db.execute(sql`
          SELECT * FROM talent_profiles
          WHERE name LIKE ${like} OR currentRole LIKE ${like} OR bio LIKE ${like}
          ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${offset}
        `)) as Record<string, unknown>[];
      } else if (availability) {
        rows = (await db.execute(sql`
          SELECT * FROM talent_profiles WHERE availability = ${availability}
          ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${offset}
        `)) as Record<string, unknown>[];
      } else if (profileType) {
        rows = (await db.execute(sql`
          SELECT * FROM talent_profiles WHERE profileType = ${profileType}
          ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${offset}
        `)) as Record<string, unknown>[];
      } else {
        rows = (await db.execute(sql`
          SELECT * FROM talent_profiles ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${offset}
        `)) as Record<string, unknown>[];
      }

      const [countRow] = (await db.execute(sql`SELECT COUNT(*) as total FROM talent_profiles`)) as Record<string, unknown>[];
      return { items: rows, total: Number((countRow as { total: number }).total) };
    }),

  "talent.get": protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = (await db.execute(sql`SELECT * FROM talent_profiles WHERE id = ${input.id} LIMIT 1`)) as Record<string, unknown>[];
      return rows[0] ?? null;
    }),

  "talent.create": protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email().optional(),
      linkedIn: z.string().optional(),
      location: z.string().optional(),
      profileType: z.string().default("Operator"),
      currentRole: z.string().optional(),
      availability: z.string().default("Available"),
      availabilityHoursPerWeek: z.number().default(0),
      yearsExperience: z.number().default(0),
      industryExpertise: z.string().optional(),
      previousVentures: z.number().default(0),
      previousExits: z.number().default(0),
      previousLeadershipRoles: z.number().default(0),
      stageIdea: z.boolean().default(false),
      stageValidation: z.boolean().default(false),
      stageBuild: z.boolean().default(false),
      stageScale: z.boolean().default(false),
      capTechnical: z.number().min(0).max(100).default(0),
      capCommercial: z.number().min(0).max(100).default(0),
      capOperational: z.number().min(0).max(100).default(0),
      capRegulatory: z.number().min(0).max(100).default(0),
      capManufacturing: z.number().min(0).max(100).default(0),
      capSupplyChain: z.number().min(0).max(100).default(0),
      capFinancial: z.number().min(0).max(100).default(0),
      capMarketing: z.number().min(0).max(100).default(0),
      networkInvestors: z.number().min(0).max(100).default(0),
      networkCustomers: z.number().min(0).max(100).default(0),
      networkSuppliers: z.number().min(0).max(100).default(0),
      networkRegulators: z.number().min(0).max(100).default(0),
      networkIndustry: z.number().min(0).max(100).default(0),
      attrLeadership: z.number().min(0).max(100).default(0),
      attrExecution: z.number().min(0).max(100).default(0),
      attrCollaboration: z.number().min(0).max(100).default(0),
      attrRiskTolerance: z.number().min(0).max(100).default(0),
      attrResilience: z.number().min(0).max(100).default(0),
      bio: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const id = generateId("talent");
      const now = new Date();
      await db.execute(sql`
        INSERT INTO talent_profiles (
          id, name, email, linkedIn, location, profileType, currentRole, availability,
          availabilityHoursPerWeek, yearsExperience, industryExpertise,
          previousVentures, previousExits, previousLeadershipRoles,
          stageIdea, stageValidation, stageBuild, stageScale,
          capTechnical, capCommercial, capOperational, capRegulatory, capManufacturing,
          capSupplyChain, capFinancial, capMarketing,
          networkInvestors, networkCustomers, networkSuppliers, networkRegulators, networkIndustry,
          attrLeadership, attrExecution, attrCollaboration, attrRiskTolerance, attrResilience,
          bio, notes, createdAt, updatedAt
        ) VALUES (
          ${id}, ${input.name}, ${input.email ?? null}, ${input.linkedIn ?? null},
          ${input.location ?? null}, ${input.profileType}, ${input.currentRole ?? null},
          ${input.availability}, ${input.availabilityHoursPerWeek}, ${input.yearsExperience},
          ${input.industryExpertise ?? null}, ${input.previousVentures}, ${input.previousExits},
          ${input.previousLeadershipRoles},
          ${input.stageIdea ? 1 : 0}, ${input.stageValidation ? 1 : 0},
          ${input.stageBuild ? 1 : 0}, ${input.stageScale ? 1 : 0},
          ${input.capTechnical}, ${input.capCommercial}, ${input.capOperational},
          ${input.capRegulatory}, ${input.capManufacturing}, ${input.capSupplyChain},
          ${input.capFinancial}, ${input.capMarketing},
          ${input.networkInvestors}, ${input.networkCustomers}, ${input.networkSuppliers},
          ${input.networkRegulators}, ${input.networkIndustry},
          ${input.attrLeadership}, ${input.attrExecution}, ${input.attrCollaboration},
          ${input.attrRiskTolerance}, ${input.attrResilience},
          ${input.bio ?? null}, ${input.notes ?? null}, ${now}, ${now}
        )
      `);
      return { id };
    }),

  "talent.update": protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      email: z.string().optional(),
      linkedIn: z.string().optional(),
      location: z.string().optional(),
      profileType: z.string().optional(),
      currentRole: z.string().optional(),
      availability: z.string().optional(),
      availabilityHoursPerWeek: z.number().optional(),
      yearsExperience: z.number().optional(),
      industryExpertise: z.string().optional(),
      previousVentures: z.number().optional(),
      previousExits: z.number().optional(),
      previousLeadershipRoles: z.number().optional(),
      stageIdea: z.boolean().optional(),
      stageValidation: z.boolean().optional(),
      stageBuild: z.boolean().optional(),
      stageScale: z.boolean().optional(),
      capTechnical: z.number().min(0).max(100).optional(),
      capCommercial: z.number().min(0).max(100).optional(),
      capOperational: z.number().min(0).max(100).optional(),
      capRegulatory: z.number().min(0).max(100).optional(),
      capManufacturing: z.number().min(0).max(100).optional(),
      capSupplyChain: z.number().min(0).max(100).optional(),
      capFinancial: z.number().min(0).max(100).optional(),
      capMarketing: z.number().min(0).max(100).optional(),
      networkInvestors: z.number().min(0).max(100).optional(),
      networkCustomers: z.number().min(0).max(100).optional(),
      networkSuppliers: z.number().min(0).max(100).optional(),
      networkRegulators: z.number().min(0).max(100).optional(),
      networkIndustry: z.number().min(0).max(100).optional(),
      attrLeadership: z.number().min(0).max(100).optional(),
      attrExecution: z.number().min(0).max(100).optional(),
      attrCollaboration: z.number().min(0).max(100).optional(),
      attrRiskTolerance: z.number().min(0).max(100).optional(),
      attrResilience: z.number().min(0).max(100).optional(),
      bio: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...fields } = input;
      const now = new Date();
      await db.execute(sql`
        UPDATE talent_profiles SET
          name = COALESCE(${fields.name ?? null}, name),
          email = COALESCE(${fields.email ?? null}, email),
          linkedIn = COALESCE(${fields.linkedIn ?? null}, linkedIn),
          location = COALESCE(${fields.location ?? null}, location),
          profileType = COALESCE(${fields.profileType ?? null}, profileType),
          currentRole = COALESCE(${fields.currentRole ?? null}, currentRole),
          availability = COALESCE(${fields.availability ?? null}, availability),
          availabilityHoursPerWeek = COALESCE(${fields.availabilityHoursPerWeek ?? null}, availabilityHoursPerWeek),
          yearsExperience = COALESCE(${fields.yearsExperience ?? null}, yearsExperience),
          industryExpertise = COALESCE(${fields.industryExpertise ?? null}, industryExpertise),
          previousVentures = COALESCE(${fields.previousVentures ?? null}, previousVentures),
          previousExits = COALESCE(${fields.previousExits ?? null}, previousExits),
          previousLeadershipRoles = COALESCE(${fields.previousLeadershipRoles ?? null}, previousLeadershipRoles),
          stageIdea = COALESCE(${fields.stageIdea !== undefined ? (fields.stageIdea ? 1 : 0) : null}, stageIdea),
          stageValidation = COALESCE(${fields.stageValidation !== undefined ? (fields.stageValidation ? 1 : 0) : null}, stageValidation),
          stageBuild = COALESCE(${fields.stageBuild !== undefined ? (fields.stageBuild ? 1 : 0) : null}, stageBuild),
          stageScale = COALESCE(${fields.stageScale !== undefined ? (fields.stageScale ? 1 : 0) : null}, stageScale),
          capTechnical = COALESCE(${fields.capTechnical ?? null}, capTechnical),
          capCommercial = COALESCE(${fields.capCommercial ?? null}, capCommercial),
          capOperational = COALESCE(${fields.capOperational ?? null}, capOperational),
          capRegulatory = COALESCE(${fields.capRegulatory ?? null}, capRegulatory),
          capManufacturing = COALESCE(${fields.capManufacturing ?? null}, capManufacturing),
          capSupplyChain = COALESCE(${fields.capSupplyChain ?? null}, capSupplyChain),
          capFinancial = COALESCE(${fields.capFinancial ?? null}, capFinancial),
          capMarketing = COALESCE(${fields.capMarketing ?? null}, capMarketing),
          networkInvestors = COALESCE(${fields.networkInvestors ?? null}, networkInvestors),
          networkCustomers = COALESCE(${fields.networkCustomers ?? null}, networkCustomers),
          networkSuppliers = COALESCE(${fields.networkSuppliers ?? null}, networkSuppliers),
          networkRegulators = COALESCE(${fields.networkRegulators ?? null}, networkRegulators),
          networkIndustry = COALESCE(${fields.networkIndustry ?? null}, networkIndustry),
          attrLeadership = COALESCE(${fields.attrLeadership ?? null}, attrLeadership),
          attrExecution = COALESCE(${fields.attrExecution ?? null}, attrExecution),
          attrCollaboration = COALESCE(${fields.attrCollaboration ?? null}, attrCollaboration),
          attrRiskTolerance = COALESCE(${fields.attrRiskTolerance ?? null}, attrRiskTolerance),
          attrResilience = COALESCE(${fields.attrResilience ?? null}, attrResilience),
          bio = COALESCE(${fields.bio ?? null}, bio),
          notes = COALESCE(${fields.notes ?? null}, notes),
          updatedAt = ${now}
        WHERE id = ${id}
      `);
      return { success: true };
    }),

  "talent.delete": protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.execute(sql`DELETE FROM talent_profiles WHERE id = ${input.id}`);
      return { success: true };
    }),

  "talent.topRankings": protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = (await db.execute(sql`
        SELECT id, name, currentRole, profileType, availability,
          (capTechnical + capCommercial + capOperational + capFinancial + capMarketing) / 5 AS avgCapScore,
          (networkInvestors + networkCustomers + networkIndustry) / 3 AS avgNetworkScore,
          (attrLeadership + attrExecution + attrResilience) / 3 AS avgAttrScore,
          yearsExperience, previousExits
        FROM talent_profiles
        ORDER BY (capTechnical + capCommercial + capOperational + capFinancial + capMarketing +
                  networkInvestors + networkCustomers + networkIndustry +
                  attrLeadership + attrExecution + attrResilience) DESC
        LIMIT ${input.limit}
      `)) as Record<string, unknown>[];
      return rows;
    }),

  // ── Role Requirements ────────────────────────────────────────────────────────

  "roles.list": protectedProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (input.ventureId) {
        return (await db.execute(sql`
          SELECT * FROM venture_role_requirements WHERE ventureId = ${input.ventureId}
          ORDER BY priority DESC, createdAt DESC
        `)) as Record<string, unknown>[];
      }
      return (await db.execute(sql`
        SELECT * FROM venture_role_requirements ORDER BY priority DESC, createdAt DESC
      `)) as Record<string, unknown>[];
    }),

  "roles.create": protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      roleTitle: z.string().min(1),
      functionalArea: z.string(),
      priority: z.string().default("High"),
      status: z.string().default("Open"),
      minYearsExperience: z.number().default(0),
      minCapScore: z.number().default(0),
      minNetworkScore: z.number().default(0),
      minStageExperience: z.string().optional(),
      requiredSectors: z.string().optional(),
      engagementType: z.string().default("Full-Time"),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const id = generateId("role");
      const now = new Date();
      await db.execute(sql`
        INSERT INTO venture_role_requirements (
          id, ventureId, roleTitle, functionalArea, priority, status,
          minYearsExperience, minCapScore, minNetworkScore, minStageExperience,
          requiredSectors, engagementType, description, createdAt, updatedAt
        ) VALUES (
          ${id}, ${input.ventureId}, ${input.roleTitle}, ${input.functionalArea},
          ${input.priority}, ${input.status}, ${input.minYearsExperience},
          ${input.minCapScore}, ${input.minNetworkScore},
          ${input.minStageExperience ?? null}, ${input.requiredSectors ?? null},
          ${input.engagementType}, ${input.description ?? null}, ${now}, ${now}
        )
      `);
      return { id };
    }),

  "roles.update": protectedProcedure
    .input(z.object({
      id: z.string(),
      roleTitle: z.string().optional(),
      functionalArea: z.string().optional(),
      priority: z.string().optional(),
      status: z.string().optional(),
      minYearsExperience: z.number().optional(),
      minCapScore: z.number().optional(),
      minNetworkScore: z.number().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const now = new Date();
      await db.execute(sql`
        UPDATE venture_role_requirements SET
          roleTitle = COALESCE(${input.roleTitle ?? null}, roleTitle),
          functionalArea = COALESCE(${input.functionalArea ?? null}, functionalArea),
          priority = COALESCE(${input.priority ?? null}, priority),
          status = COALESCE(${input.status ?? null}, status),
          minYearsExperience = COALESCE(${input.minYearsExperience ?? null}, minYearsExperience),
          minCapScore = COALESCE(${input.minCapScore ?? null}, minCapScore),
          minNetworkScore = COALESCE(${input.minNetworkScore ?? null}, minNetworkScore),
          description = COALESCE(${input.description ?? null}, description),
          updatedAt = ${now}
        WHERE id = ${input.id}
      `);
      return { success: true };
    }),

  "roles.delete": protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.execute(sql`DELETE FROM venture_role_requirements WHERE id = ${input.id}`);
      return { success: true };
    }),

  // ── PVF Engine ───────────────────────────────────────────────────────────────

  "pvf.calculate": protectedProcedure
    .input(z.object({
      talentProfileId: z.string(),
      ventureId: z.string(),
      roleRequirementId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();

      // Load talent
      const talentRows = (await db.execute(sql`
        SELECT * FROM talent_profiles WHERE id = ${input.talentProfileId} LIMIT 1
      `)) as Record<string, unknown>[];
      if (!talentRows.length) throw new Error("Talent not found");
      const talent = talentRows[0] as Record<string, unknown>;

      // Load venture
      const ventureRows = (await db.execute(sql`
        SELECT id, sector, vrl FROM ventures WHERE id = ${input.ventureId} LIMIT 1
      `)) as Record<string, unknown>[];
      if (!ventureRows.length) throw new Error("Venture not found");
      const venture = ventureRows[0] as Record<string, unknown>;

      // Load role requirement (optional)
      let minCapScore = 0;
      let minNetworkScore = 0;
      if (input.roleRequirementId) {
        const roleRows = (await db.execute(sql`
          SELECT * FROM venture_role_requirements WHERE id = ${input.roleRequirementId} LIMIT 1
        `)) as Record<string, unknown>[];
        if (roleRows.length) {
          minCapScore = Number((roleRows[0] as Record<string, unknown>).minCapScore) || 0;
          minNetworkScore = Number((roleRows[0] as Record<string, unknown>).minNetworkScore) || 0;
        }
      }

      // Compute component scores
      const industries: string[] = JSON.parse(String(talent.industryExpertise || "[]"));
      const skillsMatch = calcSkillsMatch(talent as Record<string, number>, minCapScore);
      const industryMatch = calcIndustryMatch(industries, String(venture.sector || ""));
      const stageMatch = calcStageMatch(talent as Record<string, boolean | number>, Number(venture.vrl || 1));
      const networkValue = calcNetworkValue(talent as Record<string, number>, minNetworkScore);
      const availabilityFit = calcAvailabilityFit(String(talent.availability || "Available"));

      const pvfScore = computePvfScore({ skillsMatch, industryMatch, stageMatch, networkValue, availabilityFit });
      const grade = pvfGrade(pvfScore);

      const recommendation = pvfScore >= 75
        ? `Strong match — recommend for ${input.roleRequirementId ? "this role" : "a core team role"}`
        : pvfScore >= 50
        ? "Moderate fit — consider for advisory or part-time engagement"
        : "Low fit — not recommended at this stage";

      // Upsert PVF record
      const existingRows = (await db.execute(sql`
        SELECT id FROM people_venture_fit
        WHERE talentProfileId = ${input.talentProfileId} AND ventureId = ${input.ventureId}
        LIMIT 1
      `)) as Record<string, unknown>[];

      const now = new Date();
      if (existingRows.length) {
        const existingId = (existingRows[0] as { id: string }).id;
        await db.execute(sql`
          UPDATE people_venture_fit SET
            roleRequirementId = ${input.roleRequirementId ?? null},
            skillsMatch = ${skillsMatch}, industryMatch = ${industryMatch},
            stageMatch = ${stageMatch}, networkValue = ${networkValue},
            availabilityFit = ${availabilityFit}, pvfScore = ${pvfScore},
            recommendation = ${recommendation}, updatedAt = ${now}
          WHERE id = ${existingId}
        `);
        return { id: existingId, pvfScore, grade, skillsMatch, industryMatch, stageMatch, networkValue, availabilityFit, recommendation };
      } else {
        const id = generateId("pvf");
        await db.execute(sql`
          INSERT INTO people_venture_fit (
            id, talentProfileId, ventureId, roleRequirementId,
            skillsMatch, industryMatch, stageMatch, networkValue, availabilityFit,
            pvfScore, recommendation, computedAt, updatedAt
          ) VALUES (
            ${id}, ${input.talentProfileId}, ${input.ventureId},
            ${input.roleRequirementId ?? null},
            ${skillsMatch}, ${industryMatch}, ${stageMatch}, ${networkValue}, ${availabilityFit},
            ${pvfScore}, ${recommendation}, ${now}, ${now}
          )
        `);
        return { id, pvfScore, grade, skillsMatch, industryMatch, stageMatch, networkValue, availabilityFit, recommendation };
      }
    }),

  "pvf.listForVenture": protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return (await db.execute(sql`
        SELECT pvf.*, tp.name AS talentName, tp.currentRole, tp.profileType, tp.availability
        FROM people_venture_fit pvf
        JOIN talent_profiles tp ON pvf.talentProfileId = tp.id
        WHERE pvf.ventureId = ${input.ventureId}
        ORDER BY pvf.pvfScore DESC
      `)) as Record<string, unknown>[];
    }),

  "pvf.topMatches": protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      limit: z.number().min(1).max(20).default(5),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      return (await db.execute(sql`
        SELECT pvf.*, tp.name AS talentName, tp.currentRole, tp.profileType, tp.availability,
          tp.capTechnical, tp.capCommercial, tp.capOperational, tp.capFinancial,
          tp.networkInvestors, tp.networkCustomers, tp.networkIndustry
        FROM people_venture_fit pvf
        JOIN talent_profiles tp ON pvf.talentProfileId = tp.id
        WHERE pvf.ventureId = ${input.ventureId}
        ORDER BY pvf.pvfScore DESC
        LIMIT ${input.limit}
      `)) as Record<string, unknown>[];
    }),

  // ── Team Composition ─────────────────────────────────────────────────────────

  "team.getComposition": protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return (await db.execute(sql`
        SELECT tc.*, tp.name AS talentName, tp.currentRole, tp.profileType,
          tp.availability, tp.capTechnical, tp.capCommercial, tp.capOperational,
          tp.capFinancial, tp.attrLeadership, tp.attrExecution
        FROM team_compositions tc
        JOIN talent_profiles tp ON tc.talentProfileId = tp.id
        WHERE tc.ventureId = ${input.ventureId}
        ORDER BY tc.isFounder DESC, tc.pvfScore DESC
      `)) as Record<string, unknown>[];
    }),

  "team.assign": protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      talentProfileId: z.string(),
      roleRequirementId: z.string().optional(),
      assignedRole: z.string().optional(),
      assignmentType: z.string().default("Core"),
      engagementType: z.string().default("Full-Time"),
      pvfScore: z.number().default(0),
      isFounder: z.boolean().default(false),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const id = generateId("tc");
      const now = new Date();
      await db.execute(sql`
        INSERT INTO team_compositions (
          id, ventureId, talentProfileId, roleRequirementId, assignedRole,
          assignmentType, engagementType, pvfScore, isFounder, notes, createdAt, updatedAt
        ) VALUES (
          ${id}, ${input.ventureId}, ${input.talentProfileId},
          ${input.roleRequirementId ?? null}, ${input.assignedRole ?? null},
          ${input.assignmentType}, ${input.engagementType}, ${input.pvfScore},
          ${input.isFounder ? 1 : 0}, ${input.notes ?? null}, ${now}, ${now}
        )
      `);
      return { id };
    }),

  "team.unassign": protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.execute(sql`DELETE FROM team_compositions WHERE id = ${input.id}`);
      return { success: true };
    }),

  // ── Gap Analysis ─────────────────────────────────────────────────────────────

  "gaps.list": protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return (await db.execute(sql`
        SELECT * FROM team_gap_analysis WHERE ventureId = ${input.ventureId}
        ORDER BY gapScore DESC, computedAt DESC
      `)) as Record<string, unknown>[];
    }),

  "gaps.compute": protectedProcedure
    .input(z.object({ ventureId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();

      // Load venture VRL for stage-based required scores
      const ventureRows = (await db.execute(sql`
        SELECT vrl FROM ventures WHERE id = ${input.ventureId} LIMIT 1
      `)) as Record<string, unknown>[];
      const vrl = ventureRows.length ? Number((ventureRows[0] as { vrl: number }).vrl) : 1;

      // Required scores per area based on VRL stage
      const stageMultiplier = Math.min(1, vrl / 4);
      const baseRequired = Math.round(40 + stageMultiplier * 40); // 40-80 range

      // Load team capabilities for this venture
      const teamRows = (await db.execute(sql`
        SELECT tp.capTechnical, tp.capCommercial, tp.capOperational, tp.capFinancial,
          tp.capMarketing, tp.networkInvestors, tp.networkCustomers, tp.networkIndustry,
          tp.attrLeadership, tp.attrExecution
        FROM team_compositions tc
        JOIN talent_profiles tp ON tc.talentProfileId = tp.id
        WHERE tc.ventureId = ${input.ventureId}
      `)) as Record<string, number>[];

      // Compute average team scores per area
      const avg = (field: keyof typeof teamRows[0]) =>
        teamRows.length
          ? Math.round(teamRows.reduce((s, r) => s + (Number(r[field]) || 0), 0) / teamRows.length)
          : 0;

      const areas = [
        { area: "Technical", current: avg("capTechnical"), required: baseRequired },
        { area: "Commercial", current: avg("capCommercial"), required: baseRequired },
        { area: "Operations", current: avg("capOperational"), required: Math.round(baseRequired * 0.9) },
        { area: "Finance", current: avg("capFinancial"), required: Math.round(baseRequired * 0.85) },
        { area: "Marketing", current: avg("capMarketing"), required: Math.round(baseRequired * 0.85) },
        { area: "Network", current: avg("networkInvestors"), required: Math.round(baseRequired * 0.8) },
        { area: "Leadership", current: avg("attrLeadership"), required: baseRequired },
        { area: "Execution", current: avg("attrExecution"), required: baseRequired },
      ];

      const now = new Date();
      const gaps = [];

      for (const { area, current, required } of areas) {
        const gapScore = Math.max(0, required - current);
        const severity = gapSeverity(gapScore);

        // Upsert gap record
        const existingRows = (await db.execute(sql`
          SELECT id FROM team_gap_analysis
          WHERE ventureId = ${input.ventureId} AND gapArea = ${area} LIMIT 1
        `)) as Record<string, unknown>[];

        if (existingRows.length) {
          const existingId = (existingRows[0] as { id: string }).id;
          await db.execute(sql`
            UPDATE team_gap_analysis SET
              severity = ${severity}, currentScore = ${current},
              requiredScore = ${required}, gapScore = ${gapScore},
              computedAt = ${now}, updatedAt = ${now}
            WHERE id = ${existingId}
          `);
          gaps.push({ id: existingId, area, current, required, gapScore, severity });
        } else {
          const id = generateId("gap");
          await db.execute(sql`
            INSERT INTO team_gap_analysis (
              id, ventureId, gapArea, severity, currentScore, requiredScore,
              gapScore, status, computedAt, updatedAt
            ) VALUES (
              ${id}, ${input.ventureId}, ${area}, ${severity},
              ${current}, ${required}, ${gapScore}, 'Open', ${now}, ${now}
            )
          `);
          gaps.push({ id, area, current, required, gapScore, severity });
        }
      }

      return { gaps, computedAt: now };
    }),

  "gaps.resolve": protectedProcedure
    .input(z.object({
      id: z.string(),
      resolutionNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const now = new Date();
      await db.execute(sql`
        UPDATE team_gap_analysis SET
          status = 'Resolved', resolutionNotes = ${input.resolutionNotes ?? null},
          updatedAt = ${now}
        WHERE id = ${input.id}
      `);
      return { success: true };
    }),

  // ── Dashboard Summary ────────────────────────────────────────────────────────

  "dashboard.summary": protectedProcedure
    .query(async () => {
      const db = await getDb();

      const [talentCount] = (await db.execute(sql`SELECT COUNT(*) as c FROM talent_profiles`)) as Record<string, unknown>[];
      const [availableCount] = (await db.execute(sql`SELECT COUNT(*) as c FROM talent_profiles WHERE availability = 'Available'`)) as Record<string, unknown>[];
      const [openRolesCount] = (await db.execute(sql`SELECT COUNT(*) as c FROM venture_role_requirements WHERE status = 'Open'`)) as Record<string, unknown>[];
      const [criticalGapsCount] = (await db.execute(sql`SELECT COUNT(*) as c FROM team_gap_analysis WHERE severity = 'Critical' AND status = 'Open'`)) as Record<string, unknown>[];
      const [pvfAvg] = (await db.execute(sql`SELECT AVG(pvfScore) as avg FROM people_venture_fit`)) as Record<string, unknown>[];

      // Top 5 talent by composite capability
      const topTalent = (await db.execute(sql`
        SELECT id, name, currentRole, profileType, availability,
          ROUND((capTechnical + capCommercial + capOperational + capFinancial + capMarketing) / 5) AS avgCap
        FROM talent_profiles
        ORDER BY (capTechnical + capCommercial + capOperational + capFinancial + capMarketing) DESC
        LIMIT 5
      `)) as Record<string, unknown>[];

      // Role matrix: open roles per venture
      const roleMatrix = (await db.execute(sql`
        SELECT ventureId, COUNT(*) as openRoles
        FROM venture_role_requirements WHERE status = 'Open'
        GROUP BY ventureId
      `)) as Record<string, unknown>[];

      // Critical gaps per venture
      const criticalGaps = (await db.execute(sql`
        SELECT ventureId, gapArea, severity, gapScore
        FROM team_gap_analysis
        WHERE severity IN ('Critical', 'High') AND status = 'Open'
        ORDER BY gapScore DESC
        LIMIT 20
      `)) as Record<string, unknown>[];

      return {
        totalTalent: Number((talentCount as { c: number }).c),
        availableTalent: Number((availableCount as { c: number }).c),
        openRoles: Number((openRolesCount as { c: number }).c),
        criticalGaps: Number((criticalGapsCount as { c: number }).c),
        avgPvfScore: Math.round(Number((pvfAvg as { avg: number }).avg) || 0),
        topTalent,
        roleMatrix,
        criticalGapsDetail: criticalGaps,
      };
    }),
});
