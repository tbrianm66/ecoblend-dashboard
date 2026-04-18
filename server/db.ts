import { eq, desc, and, inArray, gt } from "drizzle-orm";
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
  InsertMarketAnalysis,
  InsertCompetitor,
  InsertOpportunityReport,
  InsertEngineeringRisk,
  InsertMitigationAction,
  InsertAcademicPaper,
  InsertTaskPaperLink,
  InsertVentureRisk,
  InsertBrlTaskCompletion,
  InsertVrlScoringParams,
  VrlScoringParams,
  BrlTask,
  BrlTaskCompletion,
  brlTasks,
  brlTaskCompletions,
  vrlScoringParams,
  ventureRisks,
  engineeringRisks,
  mitigationActions,
  marketAnalysis,
  competitors,
  opportunityReports,
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
  academicPapers,
  taskPaperLinks,
  mrlAssessments,
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
export async function getMilestonesForVenture(ventureId: string, offeringId?: string) {
  const db = await getDb();
  if (!db) return [];
  const condition = offeringId
    ? and(eq(milestones.ventureId, ventureId), eq(milestones.offeringId, offeringId))
    : eq(milestones.ventureId, ventureId);
  return db.select().from(milestones).where(condition).orderBy(milestones.sortOrder);
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
export async function getRisksForVenture(ventureId: string, offeringId?: string) {
  const db = await getDb();
  if (!db) return [];
  const condition = offeringId
    ? and(eq(risks.ventureId, ventureId), eq(risks.offeringId, offeringId))
    : eq(risks.ventureId, ventureId);
  return db.select().from(risks).where(condition);
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
export async function getExperimentsForVenture(ventureId: string, offeringId?: string) {
  const db = await getDb();
  if (!db) return [];
  const condition = offeringId
    ? and(eq(experiments.ventureId, ventureId), eq(experiments.offeringId, offeringId))
    : eq(experiments.ventureId, ventureId);
  return db.select().from(experiments).where(condition).orderBy(desc(experiments.createdAt));
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

// ── Market Analysis ───────────────────────────────────────────────────────────
export async function getMarketAnalysisForVenture(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(marketAnalysis).where(eq(marketAnalysis.ventureId, ventureId)).orderBy(desc(marketAnalysis.createdAt));
}
export async function getAllMarketAnalysis() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(marketAnalysis).orderBy(desc(marketAnalysis.createdAt));
}
export async function insertMarketAnalysis(data: InsertMarketAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(marketAnalysis).values(data);
}
export async function updateMarketAnalysis(id: number, data: Partial<InsertMarketAnalysis>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(marketAnalysis).set(data).where(eq(marketAnalysis.id, id));
}
export async function deleteMarketAnalysis(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(marketAnalysis).where(eq(marketAnalysis.id, id));
}

// ── Competitors ───────────────────────────────────────────────────────────────
export async function getCompetitorsForVenture(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(competitors).where(eq(competitors.ventureId, ventureId)).orderBy(desc(competitors.createdAt));
}
export async function getAllCompetitors() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(competitors).orderBy(desc(competitors.createdAt));
}
export async function insertCompetitor(data: InsertCompetitor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(competitors).values(data);
}
export async function updateCompetitor(id: number, data: Partial<InsertCompetitor>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(competitors).set(data).where(eq(competitors.id, id));
}
export async function deleteCompetitor(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(competitors).where(eq(competitors.id, id));
}

// ── Opportunity Reports ───────────────────────────────────────────────────────
export async function getReportsForOpportunity(opportunityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opportunityReports).where(eq(opportunityReports.opportunityId, opportunityId)).orderBy(desc(opportunityReports.generatedAt));
}
export async function getOpportunityReportById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(opportunityReports).where(eq(opportunityReports.id, id));
  return rows[0] ?? null;
}
export async function insertOpportunityReport(data: InsertOpportunityReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(opportunityReports).values(data);
}
export async function deleteOpportunityReport(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(opportunityReports).where(eq(opportunityReports.id, id));
}

// ── FMEA Engineering Risks ────────────────────────────────────────────────────
export async function getEngineeringRisksByVenture(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(engineeringRisks)
    .where(eq(engineeringRisks.ventureId, ventureId))
    .orderBy(engineeringRisks.initialRpn);
}

export async function getEngineeringRiskById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(engineeringRisks).where(eq(engineeringRisks.id, id));
  return rows[0] ?? null;
}

export async function insertEngineeringRisk(data: InsertEngineeringRisk) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Auto-calculate initialRpn
  const rpn = (data.severity ?? 5) * (data.occurrence ?? 5) * (data.detection ?? 5);
  return db.insert(engineeringRisks).values({ ...data, initialRpn: rpn });
}

export async function updateEngineeringRisk(id: number, data: Partial<InsertEngineeringRisk>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Recalculate RPN if any score changed
  const existing = await getEngineeringRiskById(id);
  const s = data.severity ?? existing?.severity ?? 5;
  const o = data.occurrence ?? existing?.occurrence ?? 5;
  const d = data.detection ?? existing?.detection ?? 5;
  return db.update(engineeringRisks).set({ ...data, initialRpn: s * o * d }).where(eq(engineeringRisks.id, id));
}

export async function deleteEngineeringRisk(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete mitigations first
  await db.delete(mitigationActions).where(eq(mitigationActions.riskId, id));
  return db.delete(engineeringRisks).where(eq(engineeringRisks.id, id));
}

// Returns true if venture has any unmitigated high-RPN risk (blocker check)
export async function getVentureTrlBlockers(ventureId: string) {
  const db = await getDb();
  if (!db) return { hasBlocker: false, blockerCount: 0, risks: [] };
  const allRisks = await db.select().from(engineeringRisks)
    .where(eq(engineeringRisks.ventureId, ventureId));
  const highRpnRisks = allRisks.filter(r => r.initialRpn > 100);
  if (highRpnRisks.length === 0) return { hasBlocker: false, blockerCount: 0, risks: [] };
  // Check if each high-RPN risk has at least one Implemented or Verified mitigation
  const blockers = [];
  for (const risk of highRpnRisks) {
    const mitigations = await db.select().from(mitigationActions)
      .where(eq(mitigationActions.riskId, risk.id));
    const hasMitigation = mitigations.some(m => m.status === "Implemented" || m.status === "Verified");
    if (!hasMitigation) blockers.push(risk);
  }
  return { hasBlocker: blockers.length > 0, blockerCount: blockers.length, risks: blockers };
}

// ── FMEA Mitigation Actions ───────────────────────────────────────────────────
export async function getMitigationsByRisk(riskId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mitigationActions)
    .where(eq(mitigationActions.riskId, riskId))
    .orderBy(mitigationActions.createdAt);
}

export async function insertMitigationAction(data: InsertMitigationAction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rS = data.revisedSeverity ?? 5;
  const rO = data.revisedOccurrence ?? 5;
  const rD = data.revisedDetection ?? 5;
  return db.insert(mitigationActions).values({ ...data, revisedRpn: rS * rO * rD });
}

export async function updateMitigationAction(id: number, data: Partial<InsertMitigationAction>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(mitigationActions).where(eq(mitigationActions.id, id));
  const existing = rows[0];
  const rS = data.revisedSeverity ?? existing?.revisedSeverity ?? 5;
  const rO = data.revisedOccurrence ?? existing?.revisedOccurrence ?? 5;
  const rD = data.revisedDetection ?? existing?.revisedDetection ?? 5;
  return db.update(mitigationActions).set({ ...data, revisedRpn: rS * rO * rD }).where(eq(mitigationActions.id, id));
}

export async function deleteMitigationAction(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(mitigationActions).where(eq(mitigationActions.id, id));
}

// ── Academic Papers ───────────────────────────────────────────────────────────
export async function upsertAcademicPaper(data: InsertAcademicPaper) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Check if paper already exists by externalId
  const existing = await db.select().from(academicPapers)
    .where(eq(academicPapers.externalId, data.externalId)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(academicPapers).values(data);
  const inserted = await db.select().from(academicPapers)
    .where(eq(academicPapers.externalId, data.externalId)).limit(1);
  return inserted[0];
}

export async function getAcademicPaperById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(academicPapers).where(eq(academicPapers.id, id)).limit(1);
  return rows[0] ?? null;
}

// ── Task Paper Links ──────────────────────────────────────────────────────────
export async function linkPaperToTask(data: InsertTaskPaperLink) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Prevent duplicate links
  const existing = await db.select().from(taskPaperLinks)
    .where(and(eq(taskPaperLinks.taskId, data.taskId), eq(taskPaperLinks.paperId, data.paperId))).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(taskPaperLinks).values(data);
  const inserted = await db.select().from(taskPaperLinks)
    .where(and(eq(taskPaperLinks.taskId, data.taskId), eq(taskPaperLinks.paperId, data.paperId))).limit(1);
  return inserted[0];
}

export async function getPapersForTask(taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Join task_paper_links with academic_papers
  const links = await db.select().from(taskPaperLinks)
    .where(eq(taskPaperLinks.taskId, taskId));
  if (links.length === 0) return [];
  const paperIds = links.map(l => l.paperId);
  const papers = await db.select().from(academicPapers)
    .where(inArray(academicPapers.id, paperIds));
  return papers.map(paper => {
    const link = links.find(l => l.paperId === paper.id);
    return { ...paper, relevanceScore: link?.relevanceScore ?? null, linkId: link?.id };
  });
}

export async function unlinkPaperFromTask(linkId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(taskPaperLinks).where(eq(taskPaperLinks.id, linkId));
}

export async function getValidatedTaskIds(ventureId: string): Promise<number[]> {
  // Returns task IDs that have at least one paper with citationCount > 10
  const db = await getDb();
  if (!db) return [];
  const links = await db.select().from(taskPaperLinks)
    .where(eq(taskPaperLinks.ventureId, ventureId));
  if (links.length === 0) return [];
  const paperIds = links.map(l => l.paperId);
  const qualifyingPapers = await db.select().from(academicPapers)
    .where(and(inArray(academicPapers.id, paperIds), gt(academicPapers.citationCount, 10)));
  const qualifyingPaperIds = new Set(qualifyingPapers.map(p => p.id));
  const validatedTaskIds = Array.from(new Set(
    links.filter(l => qualifyingPaperIds.has(l.paperId)).map(l => l.taskId)
  ));
  return validatedTaskIds;
}

// ── Venture Risk helpers ──────────────────────────────────────────────────────

/** Compute risk level from score */
export function getRiskLevel(score: number): "Low" | "Medium" | "High" | "Critical" {
  if (score <= 5) return "Low";
  if (score <= 10) return "Medium";
  if (score <= 15) return "High";
  return "Critical";
}

/** Risk penalty for Adjusted VRI calculation */
export function getRiskPenalty(level: "Low" | "Medium" | "High" | "Critical"): number {
  const penalties = { Low: 0, Medium: -5, High: -10, Critical: -20 };
  return penalties[level];
}

export async function listVentureRisks(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(ventureRisks)
    .where(eq(ventureRisks.ventureId, ventureId))
    .orderBy(desc(ventureRisks.riskScore));
}

export async function addVentureRisk(data: InsertVentureRisk) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(ventureRisks).values(data);
  return result;
}

export async function updateVentureRisk(id: number, data: Partial<InsertVentureRisk>) {
  const db = await getDb();
  if (!db) return;
  await db.update(ventureRisks).set(data).where(eq(ventureRisks.id, id));
}

export async function deleteVentureRisk(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(ventureRisks).where(eq(ventureRisks.id, id));
}

export async function getVentureRiskById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(ventureRisks).where(eq(ventureRisks.id, id));
  return row ?? null;
}

/** Returns all open/in-progress High/Critical risks for a venture (VRL blockers) */
export async function getVrlBlockers(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(ventureRisks)
    .where(
      and(
        eq(ventureRisks.ventureId, ventureId),
        inArray(ventureRisks.status, ["Open", "In Progress"]),
        inArray(ventureRisks.riskLevel, ["High", "Critical"])
      )
    )
    .orderBy(desc(ventureRisks.riskScore));
}

/** Compute adjusted VRI for a venture based on its open risks */
export async function computeAdjustedVri(
  ventureId: string,
  baseVrl: number,
  baseVrlPercent: number
): Promise<{ adjustedVrl: number; adjustedPercent: number; totalPenalty: number; riskCount: number }> {
  const db = await getDb();
  if (!db) return { adjustedVrl: baseVrl, adjustedPercent: baseVrlPercent, totalPenalty: 0, riskCount: 0 };

  const openRisks = await db
    .select({ riskLevel: ventureRisks.riskLevel })
    .from(ventureRisks)
    .where(
      and(
        eq(ventureRisks.ventureId, ventureId),
        inArray(ventureRisks.status, ["Open", "In Progress"])
      )
    );

  const totalPenalty = openRisks.reduce(
    (sum, r) => sum + getRiskPenalty(r.riskLevel as "Low" | "Medium" | "High" | "Critical"),
    0
  );

  const adjustedPercent = Math.max(0, Math.min(100, baseVrlPercent + totalPenalty));

  return {
    adjustedVrl: baseVrl,
    adjustedPercent,
    totalPenalty,
    riskCount: openRisks.length,
  };
}

/** Portfolio-wide risk summary */
export async function getPortfolioRiskSummary() {
  const db = await getDb();
  if (!db) return { total: 0, byCategory: {}, byLevel: { Low: 0, Medium: 0, High: 0, Critical: 0 } };
  const allRisks = await db.select().from(ventureRisks);
  const byCategory: Record<string, number> = {};
  const byLevel: Record<string, number> = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  for (const r of allRisks) {
    byCategory[r.riskCategory] = (byCategory[r.riskCategory] ?? 0) + 1;
    byLevel[r.riskLevel] = (byLevel[r.riskLevel] ?? 0) + 1;
  }
  return { total: allRisks.length, byCategory, byLevel };
}

// ── BRL Tasks (Business Readiness Level) ─────────────────────────────────────
export async function getAllBrlTasks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(brlTasks).orderBy(brlTasks.taskNumber);
}

export async function getBrlTasksByStage(vrlStage: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(brlTasks).where(eq(brlTasks.vrlStage, vrlStage)).orderBy(brlTasks.taskNumber);
}

export async function getBrlCompletionsForVenture(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(brlTaskCompletions).where(eq(brlTaskCompletions.ventureId, ventureId));
}

export async function upsertBrlCompletion(data: InsertBrlTaskCompletion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Check if completion record exists
  const existing = await db.select().from(brlTaskCompletions)
    .where(and(eq(brlTaskCompletions.ventureId, data.ventureId), eq(brlTaskCompletions.taskId, data.taskId)))
    .limit(1);
  if (existing.length > 0) {
    return db.update(brlTaskCompletions)
      .set({ completed: data.completed, completedAt: data.completedAt, completedBy: data.completedBy, notes: data.notes, evidenceUrl: data.evidenceUrl })
      .where(and(eq(brlTaskCompletions.ventureId, data.ventureId), eq(brlTaskCompletions.taskId, data.taskId)));
  }
  return db.insert(brlTaskCompletions).values(data);
}

export async function deleteBrlCompletion(ventureId: string, taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(brlTaskCompletions)
    .where(and(eq(brlTaskCompletions.ventureId, ventureId), eq(brlTaskCompletions.taskId, taskId)));
}

export async function getBrlScoreForVenture(ventureId: string): Promise<{ score: number; completedWeight: number; totalWeight: number; completedCount: number; totalCount: number }> {
  const db = await getDb();
  if (!db) return { score: 0, completedWeight: 0, totalWeight: 0, completedCount: 0, totalCount: 0 };
  const allTasks = await db.select().from(brlTasks).orderBy(brlTasks.taskNumber);
  const completions = await db.select().from(brlTaskCompletions).where(eq(brlTaskCompletions.ventureId, ventureId));
  const completedIds = new Set(completions.filter(c => c.completed).map(c => c.taskId));
  const totalWeight = allTasks.reduce((sum, t) => sum + (t.weight ?? 1), 0);
  const completedWeight = allTasks.filter(t => completedIds.has(t.id)).reduce((sum, t) => sum + (t.weight ?? 1), 0);
  const score = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  return { score, completedWeight, totalWeight, completedCount: completedIds.size, totalCount: allTasks.length };
}


export async function getPortfolioBrlSummary() {
  const db = await getDb();
  if (!db) return [];
  const allVentures = await db.select().from(ventures);
  const allTasks = await db.select().from(brlTasks);
  const allCompletions = await db.select().from(brlTaskCompletions);
  const totalWeight = allTasks.reduce((sum, t) => sum + (t.weight ?? 1), 0);
  return allVentures.map(v => {
    const completedIds = new Set(allCompletions.filter(c => c.ventureId === v.id && c.completed).map(c => c.taskId));
    const completedWeight = allTasks.filter(t => completedIds.has(t.id)).reduce((sum, t) => sum + (t.weight ?? 1), 0);
    const score = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
    return { ventureId: v.id, ventureName: v.name, score, completedCount: completedIds.size, totalCount: allTasks.length };
  });
}

// ── VRL Scoring Engine ────────────────────────────────────────────────────────
export async function getVrlScoringParams(ventureId: string): Promise<VrlScoringParams | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(vrlScoringParams).where(eq(vrlScoringParams.ventureId, ventureId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertVrlScoringParams(data: InsertVrlScoringParams) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(vrlScoringParams).values(data).onDuplicateKeyUpdate({ set: data });
}

export async function getAllVrlScoringParams() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vrlScoringParams);
}

// ── VRL Scoring Engine — Calculation Helpers ─────────────────────────────────

/**
 * VRL Level labels (9-level scale)
 */
export const VRL_LEVEL_LABELS: Record<number, string> = {
  1: "Opportunity Discovery",
  2: "Concept",
  3: "Validation",
  4: "Prototype",
  5: "Market Validation",
  6: "Product-Market Fit",
  7: "Market Entry",
  8: "Scaling",
  9: "Market Leadership",
};

/**
 * Map a raw VRL score (0–9 float) to a discrete VRL level (1–9)
 */
export function getVrlLevel(score: number): number {
  if (score <= 0) return 1;
  if (score >= 9) return 9;
  return Math.max(1, Math.min(9, Math.round(score)));
}

/**
 * Compute the Risk Index (0–1) from venture risks.
 * Risk Index = average of normalised scores across 5 categories:
 * Technical, Market, Financial, Operational, Regulatory
 * Each category score = avg(riskScore) in that category / 25 (max L×I = 5×5)
 */
export async function computeVrlRiskIndex(ventureId: string): Promise<{
  riskIndex: number;
  byCategory: Record<string, number>;
}> {
  const db = await getDb();
  if (!db) return { riskIndex: 0, byCategory: {} };

  const risks = await db.select().from(ventureRisks).where(eq(ventureRisks.ventureId, ventureId));

  const CATEGORIES = ["Technical", "Market", "Financial", "Operational", "Regulatory"];
  const byCategory: Record<string, number> = {};

  for (const cat of CATEGORIES) {
    const catRisks = risks.filter(r => r.riskCategory === cat);
    if (catRisks.length === 0) {
      byCategory[cat] = 0;
    } else {
      const avgScore = catRisks.reduce((sum, r) => sum + (r.riskScore ?? 0), 0) / catRisks.length;
      byCategory[cat] = Math.min(1, avgScore / 25);
    }
  }

  const values = Object.values(byCategory);
  const riskIndex = values.length > 0
    ? Math.min(1, values.reduce((s, v) => s + v, 0) / values.length)
    : 0;

  return { riskIndex: Math.round(riskIndex * 1000) / 1000, byCategory };
}

/**
 * Compute the full VRL score for a venture using the updated formula:
 * VRL = (α × PRL_normalised + β × BRL_normalised) × (1 − Risk Index) × Confidence
 *
 * PRL (Product Readiness Level) = (0.5 × TRL_norm) + (0.5 × MRL_norm)
 *   — TRL and MRL run as parallel tracks; their composite replaces raw TRL.
 *   — Falls back to raw TRL if no MRL assessment exists for the venture.
 * BRL_normalised = brlScore / 100 × 9  (mapped to 0–9 scale)
 * Result is on 0–9 scale.
 */
export async function computeVrlScore(ventureId: string): Promise<{
  vrlScore: number;
  vrlLevel: number;
  vrlLevelLabel: string;
  prlNorm: number;    // Product Readiness Level composite (TRL × MRL)
  trlNorm: number;   // raw TRL component
  mrlNorm: number;   // raw MRL component (0 if no MRL assessment)
  brlNorm: number;
  riskIndex: number;
  riskByCategory: Record<string, number>;
  confidenceScore: number;
  alphaWeight: number;
  betaWeight: number;
  baseReadiness: number;
}> {
  const fallback = {
    vrlScore: 0, vrlLevel: 1, vrlLevelLabel: VRL_LEVEL_LABELS[1],
    prlNorm: 0, trlNorm: 0, mrlNorm: 0, brlNorm: 0, riskIndex: 0, riskByCategory: {},
    confidenceScore: 0.5, alphaWeight: 0.45, betaWeight: 0.55, baseReadiness: 0,
  };
  const db = await getDb();
  if (!db) return fallback;

  // 1. Get venture TRL and MRL to compute PRL (Product Readiness Level)
  const ventureRows = await db.select().from(ventures).where(eq(ventures.id, ventureId)).limit(1);
  if (!ventureRows[0]) return fallback;
  const venture = ventureRows[0];
  const trlNorm = Math.min(9, Math.max(0, venture.trl ?? 1));

  // Get latest MRL assessment for this venture (if available)
  const mrlRows = await db.select().from(mrlAssessments)
    .where(eq(mrlAssessments.ventureId, ventureId))
    .orderBy(desc(mrlAssessments.assessedAt)).limit(1);
  const mrlRaw = mrlRows[0]?.mrlLevel ?? null;
  const mrlNorm = mrlRaw !== null ? Math.min(9, Math.max(0, mrlRaw)) : 0;

  // PRL = (0.5 × TRL_norm) + (0.5 × MRL_norm) when MRL exists; else pure TRL
  const prlNorm = mrlRaw !== null
    ? (0.5 * trlNorm) + (0.5 * mrlNorm)
    : trlNorm;

  // 2. Get BRL score (0–100) and normalise to 0–9
  const brlResult = await getBrlScoreForVenture(ventureId);
  const brlNorm = (brlResult.score / 100) * 9;

  // 3. Get scoring params (weights, confidence)
  const params = await getVrlScoringParams(ventureId);
  const alpha = params?.alphaWeight ?? 0.45;
  const beta = params?.betaWeight ?? 0.55;
  const confidence = params?.confidenceScore ?? 0.5;

  // 4. Compute risk index
  const { riskIndex, byCategory } = await computeVrlRiskIndex(ventureId);

  // 5. Apply updated formula: VRL = (α×PRL + β×BRL) × (1 − RiskIndex) × Confidence
  //    α now weights the PRL composite (TRL × MRL parallel tracks)
  const baseReadiness = alpha * prlNorm + beta * brlNorm;
  const vrlScore = Math.min(9, Math.max(0, baseReadiness * (1 - riskIndex) * confidence));
  const vrlLevel = getVrlLevel(vrlScore);

  return {
    vrlScore: Math.round(vrlScore * 100) / 100,
    vrlLevel,
    vrlLevelLabel: VRL_LEVEL_LABELS[vrlLevel],
    prlNorm: Math.round(prlNorm * 100) / 100,
    trlNorm,
    mrlNorm: Math.round(mrlNorm * 100) / 100,
    brlNorm: Math.round(brlNorm * 100) / 100,
    riskIndex,
    riskByCategory: byCategory,
    confidenceScore: confidence,
    alphaWeight: alpha,
    betaWeight: beta,
    baseReadiness: Math.round(baseReadiness * 100) / 100,
  };
}

/**
 * Compute VRL scores for all ventures (portfolio summary)
 */
export async function computePortfolioVrlScores(): Promise<Array<{
  ventureId: string;
  ventureName: string;
  vrlScore: number;
  vrlLevel: number;
  vrlLevelLabel: string;
}>> {
  const db = await getDb();
  if (!db) return [];
  const allVentures = await db.select().from(ventures);
  const results = await Promise.all(
    allVentures.map(async v => {
      const score = await computeVrlScore(v.id);
      return {
        ventureId: v.id,
        ventureName: v.name,
        vrlScore: score.vrlScore,
        vrlLevel: score.vrlLevel,
        vrlLevelLabel: score.vrlLevelLabel,
      };
    })
  );
  return results;
}

// ══════════════════════════════════════════════════════════════════════════════
// SRL MODULE — DB HELPERS (BEBUS-SRL-DMS-001)
// ══════════════════════════════════════════════════════════════════════════════
import {
  srlPortfolios,
  srlVentureProfiles,
  srlDimensionDefinitions,
  srlKpiDefinitions,
  srlDataSources,
  srlWeightConfigs,
  srlGateConfigs,
  srlGateDimensionFloors,
  srlAssessments,
  srlDimensionScores,
  srlKpiValues,
  srlGateHoldingStatus,
  srlReportingOutputs,
  srlAuditLog,
  InsertSrlPortfolio,
  InsertSrlVentureProfile,
  InsertSrlAssessment,
  InsertSrlDimensionScore,
  InsertSrlKpiValue,
  InsertSrlWeightConfig,
  InsertSrlGateConfig,
  InsertSrlGateDimensionFloor,
  InsertSrlGateHoldingStatus,
  InsertSrlReportingOutput,
  InsertSrlAuditLogEntry,
  InsertSrlDimensionDefinition,
  InsertSrlKpiDefinition,
  InsertSrlDataSource,
  SrlAssessment,
  SrlDimensionScore,
  SrlKpiValue,
  SrlWeightConfig,
  SrlGateConfig,
  SrlVentureProfile,
} from "../drizzle/schema";

export async function getSrlPortfolios() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(srlPortfolios).orderBy(srlPortfolios.portfolioName);
}

export async function createSrlPortfolio(data: InsertSrlPortfolio) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(srlPortfolios).values(data);
  return data;
}

export async function getSrlVentureProfile(ventureId: string): Promise<SrlVentureProfile | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(srlVentureProfiles).where(eq(srlVentureProfiles.ventureId, ventureId));
  return rows[0] ?? null;
}

export async function upsertSrlVentureProfile(data: InsertSrlVentureProfile) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await getSrlVentureProfile(data.ventureId);
  if (existing) {
    await db.update(srlVentureProfiles).set(data).where(eq(srlVentureProfiles.ventureId, data.ventureId));
  } else {
    await db.insert(srlVentureProfiles).values(data);
  }
  return data;
}

export async function getAllSrlVentureProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(srlVentureProfiles).orderBy(srlVentureProfiles.ventureId);
}

export async function getSrlDimensionDefinitions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(srlDimensionDefinitions).where(eq(srlDimensionDefinitions.isActive, true)).orderBy(srlDimensionDefinitions.sortOrder);
}

export async function seedSrlDimensionDefinitions(defs: InsertSrlDimensionDefinition[]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  for (const def of defs) {
    const existing = await db.select().from(srlDimensionDefinitions).where(eq(srlDimensionDefinitions.dimensionCode, def.dimensionCode));
    if (existing.length === 0) {
      await db.insert(srlDimensionDefinitions).values(def);
    }
  }
}

export async function getSrlKpiDefinitions(dimensionCode?: string) {
  const db = await getDb();
  if (!db) return [];
  if (dimensionCode) {
    const dimRows = await db.select().from(srlDimensionDefinitions).where(eq(srlDimensionDefinitions.dimensionCode, dimensionCode as any));
    if (!dimRows[0]) return [];
    return db.select().from(srlKpiDefinitions).where(eq(srlKpiDefinitions.dimensionId, dimRows[0].id));
  }
  return db.select().from(srlKpiDefinitions).orderBy(srlKpiDefinitions.kpiCode);
}

export async function getSrlKpiDefinitionByCode(kpiCode: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(srlKpiDefinitions).where(eq(srlKpiDefinitions.kpiCode, kpiCode));
  return rows[0] ?? null;
}

export async function seedSrlKpiDefinitions(kpis: InsertSrlKpiDefinition[]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  for (const kpi of kpis) {
    const existing = await db.select().from(srlKpiDefinitions).where(eq(srlKpiDefinitions.kpiCode, kpi.kpiCode));
    if (existing.length === 0) {
      await db.insert(srlKpiDefinitions).values(kpi);
    }
  }
}

export async function getSrlWeightConfig(stage: string, sectorCode = "default"): Promise<SrlWeightConfig[]> {
  const db = await getDb();
  if (!db) return [];
  const sectorRows = await db.select().from(srlWeightConfigs).where(
    and(eq(srlWeightConfigs.lifecycleStage, stage as any), eq(srlWeightConfigs.sectorCode, sectorCode))
  );
  if (sectorRows.length === 5) return sectorRows;
  return db.select().from(srlWeightConfigs).where(
    and(eq(srlWeightConfigs.lifecycleStage, stage as any), eq(srlWeightConfigs.sectorCode, "default"))
  );
}

export async function seedSrlWeightConfigs(configs: InsertSrlWeightConfig[]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  for (const cfg of configs) {
    const existing = await db.select().from(srlWeightConfigs).where(
      and(eq(srlWeightConfigs.dimensionCode, cfg.dimensionCode), eq(srlWeightConfigs.lifecycleStage, cfg.lifecycleStage), eq(srlWeightConfigs.sectorCode, cfg.sectorCode ?? "default"))
    );
    if (existing.length === 0) {
      await db.insert(srlWeightConfigs).values(cfg);
    }
  }
}

export async function getSrlGateConfigs(): Promise<SrlGateConfig[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(srlGateConfigs).orderBy(srlGateConfigs.gateCode);
}

export async function getSrlGateConfig(gateCode: string): Promise<SrlGateConfig | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(srlGateConfigs).where(eq(srlGateConfigs.gateCode, gateCode as any));
  return rows[0] ?? null;
}

export async function seedSrlGateConfigs(configs: InsertSrlGateConfig[]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  for (const cfg of configs) {
    const existing = await db.select().from(srlGateConfigs).where(eq(srlGateConfigs.gateCode, cfg.gateCode));
    if (existing.length === 0) {
      await db.insert(srlGateConfigs).values(cfg);
    }
  }
}

export async function seedSrlGateDimensionFloors(floors: InsertSrlGateDimensionFloor[]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  for (const floor of floors) {
    const existing = await db.select().from(srlGateDimensionFloors).where(
      and(eq(srlGateDimensionFloors.gateConfigId, floor.gateConfigId), eq(srlGateDimensionFloors.dimensionCode, floor.dimensionCode))
    );
    if (existing.length === 0) {
      await db.insert(srlGateDimensionFloors).values(floor);
    }
  }
}

export async function getSrlAssessments(ventureId: string): Promise<SrlAssessment[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(srlAssessments).where(eq(srlAssessments.ventureId, ventureId)).orderBy(desc(srlAssessments.assessmentDate));
}

export async function getLatestSrlAssessment(ventureId: string): Promise<SrlAssessment | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(srlAssessments)
    .where(and(eq(srlAssessments.ventureId, ventureId), eq(srlAssessments.isLocked, true)))
    .orderBy(desc(srlAssessments.assessmentDate))
    .limit(1);
  return rows[0] ?? null;
}

export async function getSrlAssessmentById(assessmentId: string): Promise<SrlAssessment | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(srlAssessments).where(eq(srlAssessments.id, assessmentId));
  return rows[0] ?? null;
}

export async function createSrlAssessment(data: InsertSrlAssessment): Promise<InsertSrlAssessment> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(srlAssessments).values(data);
  return data;
}

export async function lockSrlAssessment(assessmentId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(srlAssessments).set({ isLocked: true }).where(eq(srlAssessments.id, assessmentId));
}

export async function getSrlDimensionScores(assessmentId: string): Promise<SrlDimensionScore[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(srlDimensionScores).where(eq(srlDimensionScores.assessmentId, assessmentId));
}

export async function createSrlDimensionScore(data: InsertSrlDimensionScore): Promise<InsertSrlDimensionScore> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(srlDimensionScores).values(data);
  return data;
}

export async function getSrlKpiValues(dimScoreId: string): Promise<SrlKpiValue[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(srlKpiValues).where(eq(srlKpiValues.dimScoreId, dimScoreId));
}

export async function createSrlKpiValue(data: InsertSrlKpiValue): Promise<InsertSrlKpiValue> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(srlKpiValues).values(data);
  return data;
}

export async function getSrlGateHoldingStatus(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(srlGateHoldingStatus).where(eq(srlGateHoldingStatus.ventureId, ventureId));
}

export async function upsertSrlGateHoldingStatus(data: InsertSrlGateHoldingStatus) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select().from(srlGateHoldingStatus).where(
    and(eq(srlGateHoldingStatus.ventureId, data.ventureId), eq(srlGateHoldingStatus.gateCode, data.gateCode))
  );
  if (existing.length > 0) {
    await db.update(srlGateHoldingStatus).set(data).where(
      and(eq(srlGateHoldingStatus.ventureId, data.ventureId), eq(srlGateHoldingStatus.gateCode, data.gateCode))
    );
  } else {
    await db.insert(srlGateHoldingStatus).values(data);
  }
}

export async function getSrlReportingOutputs(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(srlReportingOutputs).where(eq(srlReportingOutputs.ventureId, ventureId)).orderBy(desc(srlReportingOutputs.generatedAt));
}

export async function createSrlReportingOutput(data: InsertSrlReportingOutput) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(srlReportingOutputs).values(data);
  return data;
}

export async function appendSrlAuditLog(data: InsertSrlAuditLogEntry) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(srlAuditLog).values(data);
}

export async function getSrlAuditLog(ventureId?: string) {
  const db = await getDb();
  if (!db) return [];
  if (ventureId) {
    return db.select().from(srlAuditLog).where(eq(srlAuditLog.ventureId, ventureId)).orderBy(desc(srlAuditLog.eventTimestamp)).limit(100);
  }
  return db.select().from(srlAuditLog).orderBy(desc(srlAuditLog.eventTimestamp)).limit(200);
}

// ── SRL Scoring Engine ────────────────────────────────────────────────────────
export type SrlDimCode = "ENV" | "LCA" | "SMF" | "SOC" | "ESG";

const SRL_LEVEL_THRESHOLDS = [
  { level: 0, min: 0,  max: 19.99,  label: "SRL-0: Pre-Sustainability" },
  { level: 1, min: 20, max: 34.99,  label: "SRL-1: Sustainability Awareness" },
  { level: 2, min: 35, max: 49.99,  label: "SRL-2: Sustainability Commitment" },
  { level: 3, min: 50, max: 64.99,  label: "SRL-3: Sustainability Integration" },
  { level: 4, min: 65, max: 79.99,  label: "SRL-4: Sustainability Leadership" },
  { level: 5, min: 80, max: 100,    label: "SRL-5: Sustainability Excellence" },
];

export function determineSrlLevel(compositeScore: number): { level: number; label: string } {
  const entry = SRL_LEVEL_THRESHOLDS.find(t => compositeScore >= t.min && compositeScore <= t.max);
  return entry ? { level: entry.level, label: entry.label } : { level: 0, label: "SRL-0: Pre-Sustainability" };
}

export type NormalisedKpiInput = {
  kpiCode: string;
  rawValue: number;
  normalisationMethod: "MIN_MAX" | "TARGET_BASED" | "THRESHOLD" | "BINARY";
  normMin?: number;
  normMax?: number;
  normTarget?: number;
  thresholdValue?: number;
  thresholdDirection?: "GTE" | "LTE" | "EQ";
  higherIsBetter: boolean;
};

export function normaliseSrlKpi(kpi: NormalisedKpiInput): number {
  const { rawValue, normalisationMethod, normMin, normMax, normTarget, thresholdValue, thresholdDirection, higherIsBetter } = kpi;
  let score = 0;
  switch (normalisationMethod) {
    case "MIN_MAX": {
      const min = normMin ?? 0;
      const max = normMax ?? 100;
      if (max === min) { score = 50; break; }
      const raw = (rawValue - min) / (max - min) * 100;
      score = higherIsBetter ? Math.min(100, Math.max(0, raw)) : Math.min(100, Math.max(0, 100 - raw));
      break;
    }
    case "TARGET_BASED": {
      const target = normTarget ?? 0;
      if (target === 0) { score = rawValue === 0 ? 100 : 0; break; }
      const ratio = rawValue / target;
      score = higherIsBetter ? Math.min(100, ratio * 100) : Math.min(100, (1 - Math.min(1, Math.abs(rawValue - target) / target)) * 100);
      break;
    }
    case "THRESHOLD": {
      const threshold = thresholdValue ?? 0;
      const dir = thresholdDirection ?? "GTE";
      let passes = dir === "GTE" ? rawValue >= threshold : dir === "LTE" ? rawValue <= threshold : rawValue === threshold;
      if (passes) { score = 100; } else {
        const ratio = dir === "GTE" ? rawValue / threshold : threshold / (rawValue || 1);
        score = Math.min(99, Math.max(0, ratio * 100));
      }
      break;
    }
    case "BINARY": { score = rawValue ? 100 : 0; break; }
  }
  return Math.round(score * 100) / 100;
}

export type SrlDimensionInput = {
  dimensionCode: SrlDimCode;
  kpiScores: Array<{ kpiCode: string; normalisedScore: number; isMandatory: boolean }>;
  weight: number;
  gateFloor?: number;
};

export function computeSrlDimensionScore(dim: SrlDimensionInput) {
  const { kpiScores, weight, gateFloor } = dim;
  if (kpiScores.length === 0) return { rawScore: 0, weightedScore: 0, kpiCoveragePct: 0, gatePass: false };
  const mandatoryKpis = kpiScores.filter(k => k.isMandatory);
  const submittedMandatory = mandatoryKpis.filter(k => k.normalisedScore !== null && k.normalisedScore !== undefined);
  const kpiCoveragePct = mandatoryKpis.length > 0 ? (submittedMandatory.length / mandatoryKpis.length) * 100 : 100;
  const rawScore = kpiScores.reduce((sum, k) => sum + k.normalisedScore, 0) / kpiScores.length;
  const weightedScore = rawScore * weight;
  const gatePass = gateFloor !== undefined ? rawScore >= gateFloor : true;
  return { rawScore: Math.round(rawScore * 100) / 100, weightedScore: Math.round(weightedScore * 100) / 100, kpiCoveragePct: Math.round(kpiCoveragePct * 100) / 100, gatePass };
}

export function computeSrlComposite(dimensions: SrlDimensionInput[], previousScore?: number) {
  const dimensionResults = dimensions.map(dim => ({ ...computeSrlDimensionScore(dim), dimensionCode: dim.dimensionCode, weight: dim.weight }));
  const baseComposite = dimensionResults.reduce((sum, d) => sum + d.weightedScore, 0);
  let trajectoryBonus = 0;
  if (previousScore !== undefined && previousScore !== null) {
    const delta = baseComposite - previousScore;
    if (delta >= 5) trajectoryBonus = 2;
    else if (delta >= 2) trajectoryBonus = 1;
  }
  const compositeScore = Math.min(100, Math.round((baseComposite + trajectoryBonus) * 100) / 100);
  const { level, label } = determineSrlLevel(compositeScore);
  return { compositeScore, srlLevel: level, srlLevelLabel: label, trajectoryBonus, dimensionResults };
}

export async function buildSrlVrlPayload(assessmentId: string): Promise<object | null> {
  const assessment = await getSrlAssessmentById(assessmentId);
  if (!assessment || !assessment.isLocked) return null;
  const dimScores = await getSrlDimensionScores(assessmentId);
  const dimensionScores: Record<string, object> = {};
  for (const ds of dimScores) {
    dimensionScores[ds.dimensionCode] = { raw_score: Number(ds.rawScore), weighted_score: Number(ds.weightedScore), gate_pass: ds.gatePass };
  }
  return {
    venture_id: assessment.ventureId,
    assessment_id: assessment.id,
    assessment_date: assessment.assessmentDate,
    stage_at_assessment: assessment.stageAtAssessment,
    composite_score: Number(assessment.compositeScore),
    srl_level: assessment.srlLevel,
    score_delta: assessment.scoreDelta !== null ? Number(assessment.scoreDelta) : null,
    dimension_scores: dimensionScores,
    gate_ref: assessment.gateRef,
    gate_status: assessment.gateStatus,
    weight_config_ref: assessment.weightConfigSnapshot,
  };
}

export async function getSrlPortfolioSummary(portfolioId?: string) {
  const db = await getDb();
  if (!db) return [];
  const profiles = portfolioId
    ? await db.select().from(srlVentureProfiles).where(eq(srlVentureProfiles.portfolioId, portfolioId))
    : await db.select().from(srlVentureProfiles);
  return profiles.map(p => ({
    ventureId: p.ventureId,
    sectorCode: p.sectorCode,
    currentStage: p.currentStage,
    srlCurrentLevel: p.srlCurrentLevel,
    srlCurrentScore: Number(p.srlCurrentScore),
    sustainabilityWatch: p.sustainabilityWatch,
  }));
}
