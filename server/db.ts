import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  InsertContractDocument,
  InsertVenture,
  InsertMilestone,
  InsertRisk,
  InsertVentureScore,
  InsertFounder,
  InsertOpportunity,
  InsertExperiment,
  InsertInterview,
  InsertFinancialSnapshot,
  InsertResearchPaper,
  InsertFellowResearcher,
  InsertUniversityPartnership,
  InsertEvidenceClaim,
  contractDocuments,
  users,
  ventures,
  milestones,
  risks,
  ventureScores,
  founders,
  opportunities,
  experiments,
  interviews,
  financialSnapshots,
  researchPapers,
  fellowResearchers,
  universityPartnerships,
  evidenceClaims,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── Users ─────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Contract Documents ────────────────────────────────────────────────────────
export async function insertContractDocument(doc: InsertContractDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(contractDocuments).values(doc);
}

export async function getContractDocuments(contractId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contractDocuments).where(eq(contractDocuments.contractId, contractId));
}

export async function deleteContractDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contractDocuments).where(eq(contractDocuments.id, id));
}

// ── Ventures ──────────────────────────────────────────────────────────────────
export async function getAllVentures() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ventures).orderBy(ventures.createdAt);
}

export async function getVentureById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(ventures).where(eq(ventures.id, id));
  return rows[0] ?? null;
}

export async function upsertVenture(data: InsertVenture) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(ventures).values(data).onDuplicateKeyUpdate({ set: data });
}

export async function updateVenture(id: string, data: Partial<InsertVenture>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(ventures).set(data).where(eq(ventures.id, id));
}

// ── Milestones ────────────────────────────────────────────────────────────────
export async function getMilestonesForVenture(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(milestones).where(eq(milestones.ventureId, ventureId)).orderBy(milestones.sortOrder);
}

export async function insertMilestone(data: InsertMilestone) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(milestones).values(data);
}

export async function updateMilestone(id: number, data: Partial<InsertMilestone>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(milestones).set(data).where(eq(milestones.id, id));
}

export async function deleteMilestone(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(milestones).where(eq(milestones.id, id));
}

// ── Risks ─────────────────────────────────────────────────────────────────────
export async function getRisksForVenture(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(risks).where(eq(risks.ventureId, ventureId));
}

export async function insertRisk(data: InsertRisk) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(risks).values(data);
}

export async function updateRisk(id: number, data: Partial<InsertRisk>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(risks).set(data).where(eq(risks.id, id));
}

export async function deleteRisk(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(risks).where(eq(risks.id, id));
}

// ── Venture Scores ────────────────────────────────────────────────────────────
export async function getScoreHistoryForVenture(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ventureScores).where(eq(ventureScores.ventureId, ventureId)).orderBy(desc(ventureScores.recordedAt));
}

export async function insertVentureScore(data: InsertVentureScore) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(ventureScores).values(data);
}

// ── Founders ──────────────────────────────────────────────────────────────────
export async function getFoundersForVenture(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(founders).where(eq(founders.ventureId, ventureId));
}

export async function getAllFounders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(founders);
}

export async function insertFounder(data: InsertFounder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(founders).values(data);
}

export async function updateFounder(id: number, data: Partial<InsertFounder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(founders).set(data).where(eq(founders.id, id));
}

export async function deleteFounder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(founders).where(eq(founders.id, id));
}

// ── Opportunities ─────────────────────────────────────────────────────────────
export async function getAllOpportunities() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opportunities).orderBy(desc(opportunities.createdAt));
}

export async function getOpportunityById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(opportunities).where(eq(opportunities.id, id));
  return rows[0] ?? null;
}

export async function insertOpportunity(data: InsertOpportunity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(opportunities).values(data);
}

export async function updateOpportunity(id: number, data: Partial<InsertOpportunity>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(opportunities).set(data).where(eq(opportunities.id, id));
}

// ── Experiments ───────────────────────────────────────────────────────────────
export async function getExperimentsForVenture(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(experiments).where(eq(experiments.ventureId, ventureId)).orderBy(desc(experiments.createdAt));
}

export async function insertExperiment(data: InsertExperiment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(experiments).values(data);
}

export async function updateExperiment(id: number, data: Partial<InsertExperiment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(experiments).set(data).where(eq(experiments.id, id));
}

export async function deleteExperiment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(experiments).where(eq(experiments.id, id));
}

// ── Interviews ────────────────────────────────────────────────────────────────
export async function getInterviewsForVenture(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interviews).where(eq(interviews.ventureId, ventureId)).orderBy(desc(interviews.createdAt));
}

export async function getAllInterviews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interviews).orderBy(desc(interviews.createdAt));
}

export async function insertInterview(data: InsertInterview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(interviews).values(data);
}

export async function updateInterview(id: number, data: Partial<InsertInterview>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(interviews).set(data).where(eq(interviews.id, id));
}

export async function deleteInterview(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(interviews).where(eq(interviews.id, id));
}

// ── Financial Snapshots ───────────────────────────────────────────────────────
export async function getFinancialSnapshotsForVenture(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(financialSnapshots).where(eq(financialSnapshots.ventureId, ventureId)).orderBy(desc(financialSnapshots.month));
}

export async function getLatestFinancialSnapshot(ventureId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(financialSnapshots)
    .where(eq(financialSnapshots.ventureId, ventureId))
    .orderBy(desc(financialSnapshots.month))
    .limit(1);
  return rows[0] ?? null;
}

export async function getAllLatestFinancialSnapshots() {
  const db = await getDb();
  if (!db) return [];
  const allSnapshots = await db.select().from(financialSnapshots).orderBy(desc(financialSnapshots.month));
  const seen = new Set<string>();
  return allSnapshots.filter(s => {
    if (seen.has(s.ventureId)) return false;
    seen.add(s.ventureId);
    return true;
  });
}

export async function upsertFinancialSnapshot(data: InsertFinancialSnapshot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(financialSnapshots).values(data).onDuplicateKeyUpdate({ set: data });
}

// ── Research Papers ───────────────────────────────────────────────────────────
export async function getAllResearchPapers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(researchPapers).orderBy(desc(researchPapers.year));
}

export async function getResearchPaperById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(researchPapers).where(eq(researchPapers.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function insertResearchPaper(data: InsertResearchPaper) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(researchPapers).values(data);
}

export async function updateResearchPaper(id: number, data: Partial<InsertResearchPaper>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(researchPapers).set(data).where(eq(researchPapers.id, id));
}

export async function deleteResearchPaper(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(researchPapers).where(eq(researchPapers.id, id));
}

// ── Fellow Researchers ────────────────────────────────────────────────────────
export async function getAllFellowResearchers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fellowResearchers).orderBy(fellowResearchers.name);
}

export async function insertFellowResearcher(data: InsertFellowResearcher) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(fellowResearchers).values(data);
}

export async function updateFellowResearcher(id: number, data: Partial<InsertFellowResearcher>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(fellowResearchers).set(data).where(eq(fellowResearchers.id, id));
}

export async function deleteFellowResearcher(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(fellowResearchers).where(eq(fellowResearchers.id, id));
}

// ── University Partnerships ───────────────────────────────────────────────────
export async function getAllUniversityPartnerships() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(universityPartnerships).orderBy(universityPartnerships.universityName);
}

export async function insertUniversityPartnership(data: InsertUniversityPartnership) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(universityPartnerships).values(data);
}

export async function updateUniversityPartnership(id: number, data: Partial<InsertUniversityPartnership>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(universityPartnerships).set(data).where(eq(universityPartnerships.id, id));
}

export async function deleteUniversityPartnership(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(universityPartnerships).where(eq(universityPartnerships.id, id));
}

// ── Evidence Claims ───────────────────────────────────────────────────────────
export async function getEvidenceClaimsForVenture(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evidenceClaims).where(eq(evidenceClaims.ventureId, ventureId)).orderBy(desc(evidenceClaims.createdAt));
}

export async function getAllEvidenceClaims() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evidenceClaims).orderBy(desc(evidenceClaims.createdAt));
}

export async function insertEvidenceClaim(data: InsertEvidenceClaim) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(evidenceClaims).values(data);
}

export async function updateEvidenceClaim(id: number, data: Partial<InsertEvidenceClaim>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(evidenceClaims).set(data).where(eq(evidenceClaims.id, id));
}

export async function deleteEvidenceClaim(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(evidenceClaims).where(eq(evidenceClaims.id, id));
}
