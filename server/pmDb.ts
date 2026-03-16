// ─────────────────────────────────────────────────────────────────────────────
// PROJECT MANAGEMENT MODULE — Database Helpers
// Covers: programs, phases, workstreams, milestones, tasks, resources,
//         dependencies, documents, execution risks
// ─────────────────────────────────────────────────────────────────────────────

import { getDb } from "./db";
import { eq, desc, asc } from "drizzle-orm";
import {
  venturePrograms,
  venturePhases,
  ventureWorkstreams,
  ventureMilestones,
  ventureTasks,
  ventureResources,
  ventureDocuments,
  executionRisks,
} from "../drizzle/schema";
import type {
  InsertVentureProgram,
  InsertVenturePhase,
  InsertVentureWorkstream,
  InsertVentureMilestone,
  InsertVentureTask,
  InsertVentureResource,
  InsertVentureDocument,
  InsertExecutionRisk,
} from "../drizzle/schema";

// ── Programs ──────────────────────────────────────────────────────────────────

export async function listPrograms(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(venturePrograms)
    .where(eq(venturePrograms.ventureId, ventureId))
    .orderBy(desc(venturePrograms.createdAt));
}

export async function getProgram(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(venturePrograms)
    .where(eq(venturePrograms.id, id));
  return rows[0] ?? null;
}

export async function createProgram(data: InsertVentureProgram) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(venturePrograms).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updateProgram(id: number, data: Partial<InsertVentureProgram>) {
  const db = await getDb();
  if (!db) return;
  await db.update(venturePrograms).set(data).where(eq(venturePrograms.id, id));
}

export async function deleteProgram(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(venturePrograms).where(eq(venturePrograms.id, id));
}

// ── Phases ────────────────────────────────────────────────────────────────────

export async function listPhases(programId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(venturePhases)
    .where(eq(venturePhases.programId, programId))
    .orderBy(asc(venturePhases.phaseNumber));
}

export async function getPhase(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(venturePhases).where(eq(venturePhases.id, id));
  return rows[0] ?? null;
}

export async function createPhase(data: InsertVenturePhase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(venturePhases).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updatePhase(id: number, data: Partial<InsertVenturePhase>) {
  const db = await getDb();
  if (!db) return;
  await db.update(venturePhases).set(data).where(eq(venturePhases.id, id));
}

export async function deletePhase(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(venturePhases).where(eq(venturePhases.id, id));
}

// ── Workstreams ───────────────────────────────────────────────────────────────

export async function listWorkstreams(phaseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(ventureWorkstreams)
    .where(eq(ventureWorkstreams.phaseId, phaseId))
    .orderBy(asc(ventureWorkstreams.createdAt));
}

export async function createWorkstream(data: InsertVentureWorkstream) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ventureWorkstreams).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updateWorkstream(id: number, data: Partial<InsertVentureWorkstream>) {
  const db = await getDb();
  if (!db) return;
  await db.update(ventureWorkstreams).set(data).where(eq(ventureWorkstreams.id, id));
}

export async function deleteWorkstream(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(ventureWorkstreams).where(eq(ventureWorkstreams.id, id));
}

// ── Milestones ────────────────────────────────────────────────────────────────

export async function listMilestones(workstreamId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(ventureMilestones)
    .where(eq(ventureMilestones.workstreamId, workstreamId))
    .orderBy(asc(ventureMilestones.sortOrder), asc(ventureMilestones.targetDate));
}

export async function listMilestonesByVenture(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(ventureMilestones)
    .where(eq(ventureMilestones.ventureId, ventureId))
    .orderBy(asc(ventureMilestones.targetDate));
}

export async function createMilestone(data: InsertVentureMilestone) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ventureMilestones).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updateMilestone(id: number, data: Partial<InsertVentureMilestone>) {
  const db = await getDb();
  if (!db) return;
  await db.update(ventureMilestones).set(data).where(eq(ventureMilestones.id, id));
}

export async function deleteMilestone(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(ventureMilestones).where(eq(ventureMilestones.id, id));
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function listTasks(workstreamId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(ventureTasks)
    .where(eq(ventureTasks.workstreamId, workstreamId))
    .orderBy(asc(ventureTasks.sortOrder), asc(ventureTasks.dueDate));
}

export async function listTasksByVenture(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(ventureTasks)
    .where(eq(ventureTasks.ventureId, ventureId))
    .orderBy(asc(ventureTasks.dueDate));
}

export async function createTask(data: InsertVentureTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ventureTasks).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updateTask(id: number, data: Partial<InsertVentureTask>) {
  const db = await getDb();
  if (!db) return;
  await db.update(ventureTasks).set(data).where(eq(ventureTasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(ventureTasks).where(eq(ventureTasks.id, id));
}

// ── Resources ─────────────────────────────────────────────────────────────────

export async function listResources(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(ventureResources)
    .where(eq(ventureResources.ventureId, ventureId))
    .orderBy(asc(ventureResources.name));
}

export async function createResource(data: InsertVentureResource) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ventureResources).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updateResource(id: number, data: Partial<InsertVentureResource>) {
  const db = await getDb();
  if (!db) return;
  await db.update(ventureResources).set(data).where(eq(ventureResources.id, id));
}

export async function deleteResource(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(ventureResources).where(eq(ventureResources.id, id));
}

// ── Execution Risks ───────────────────────────────────────────────────────────

const LIKELIHOOD_SCORE: Record<string, number> = {
  "Very Low": 1, "Low": 2, "Medium": 3, "High": 4, "Very High": 5,
};
const IMPACT_SCORE: Record<string, number> = {
  "Negligible": 1, "Minor": 2, "Moderate": 3, "Major": 4, "Critical": 5,
};

export function computeRiskScore(likelihood: string, impact: string): number {
  return (LIKELIHOOD_SCORE[likelihood] ?? 3) * (IMPACT_SCORE[impact] ?? 3);
}

export function computeRiskLevel(score: number): "Low" | "Medium" | "High" | "Critical" {
  if (score >= 16) return "Critical";
  if (score >= 9)  return "High";
  if (score >= 4)  return "Medium";
  return "Low";
}

export async function listExecutionRisks(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(executionRisks)
    .where(eq(executionRisks.ventureId, ventureId))
    .orderBy(desc(executionRisks.riskScore));
}

export async function createExecutionRisk(data: InsertExecutionRisk) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const score = computeRiskScore(data.likelihood ?? "Medium", data.impact ?? "Moderate");
  const level = computeRiskLevel(score);
  const result = await db.insert(executionRisks).values({
    ...data,
    riskScore: score,
    riskLevel: level,
  });
  return (result[0] as { insertId: number }).insertId;
}

export async function updateExecutionRisk(id: number, data: Partial<InsertExecutionRisk>) {
  const db = await getDb();
  if (!db) return;
  const updates: Record<string, unknown> = { ...data };
  if (data.likelihood || data.impact) {
    const existing = await db.select().from(executionRisks).where(eq(executionRisks.id, id));
    const row = existing[0];
    if (row) {
      const l = (data.likelihood ?? row.likelihood ?? "Medium") as string;
      const i = (data.impact ?? row.impact ?? "Moderate") as string;
      const score = computeRiskScore(l, i);
      updates.riskScore = score;
      updates.riskLevel = computeRiskLevel(score);
    }
  }
  await db.update(executionRisks).set(updates as Partial<InsertExecutionRisk>).where(eq(executionRisks.id, id));
}

export async function deleteExecutionRisk(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(executionRisks).where(eq(executionRisks.id, id));
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function listDocuments(ventureId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(ventureDocuments)
    .where(eq(ventureDocuments.ventureId, ventureId))
    .orderBy(desc(ventureDocuments.createdAt));
}

export async function createDocument(data: InsertVentureDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ventureDocuments).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updateDocument(id: number, data: Partial<InsertVentureDocument>) {
  const db = await getDb();
  if (!db) return;
  await db.update(ventureDocuments).set(data).where(eq(ventureDocuments.id, id));
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(ventureDocuments).where(eq(ventureDocuments.id, id));
}

// ── Portfolio Summary ─────────────────────────────────────────────────────────

export async function getPmPortfolioSummary() {
  const db = await getDb();
  if (!db) return {
    totalPrograms: 0, activePrograms: 0, totalTasks: 0, overdueTasks: 0,
    totalMilestones: 0, completedMilestones: 0, milestoneCompletionRate: 0,
    totalRisks: 0, criticalRisks: 0,
  };

  const [programs, tasks, milestones, risks] = await Promise.all([
    db.select().from(venturePrograms),
    db.select().from(ventureTasks),
    db.select().from(ventureMilestones),
    db.select().from(executionRisks),
  ]);

  const activePrograms = programs.filter(p => p.status === "In Progress").length;
  const today = new Date().toISOString().slice(0, 10);
  const overdueTasks = tasks.filter(
    t => t.dueDate && t.dueDate < today && t.kanbanStatus !== "Done"
  ).length;
  const completedMilestones = milestones.filter(m => m.status === "Completed").length;
  const criticalRisks = risks.filter(r => r.riskLevel === "Critical" && r.status === "Open").length;

  return {
    totalPrograms: programs.length,
    activePrograms,
    totalTasks: tasks.length,
    overdueTasks,
    totalMilestones: milestones.length,
    completedMilestones,
    milestoneCompletionRate: milestones.length > 0
      ? Math.round((completedMilestones / milestones.length) * 100)
      : 0,
    totalRisks: risks.length,
    criticalRisks,
  };
}
