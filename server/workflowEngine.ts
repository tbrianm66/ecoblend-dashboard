// ── Workflow Engine ────────────────────────────────────────────────────────────
// Cross-module trigger dispatcher for the EcoBlend Venture OS.
//
// Three automated triggers:
//   1. research_completed  → create TRL evidence experiment in Experiment Log
//   2. audit_failed        → create CAPA task in Venture Project Management
//   3. supplier_approved   → pre-populate Approved Supplier List entry
//
// Each trigger is idempotent: it checks whether a target record already exists
// (via the workflowTriggerLog) before creating anything, so re-running is safe.

import { getDb } from "./db";
import { eq, and } from "drizzle-orm";
import {
  workflowTriggerLog,
  experiments,
  ventureTasks,
  ventureWorkstreams,
  mfgApprovedSuppliers,
  uniResearchProjects,
  mfgFactoryAudits,
  mfgSupplierOnboarding,
} from "../drizzle/schema";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TriggerType =
  | "research_completed"
  | "audit_failed"
  | "supplier_approved";

export interface TriggerResult {
  success: boolean;
  logId: number;
  targetRecordId?: number;
  message: string;
}

// ── Helper: log a trigger event ───────────────────────────────────────────────

async function logTrigger(params: {
  triggerType: TriggerType;
  sourceModule: string;
  sourceRecordId: number;
  ventureId: string;
  payload: object;
  status: "success" | "failed" | "skipped";
  result?: object;
  error?: string;
  targetModule?: string;
  targetRecordId?: number;
  retriedFrom?: number;
}): Promise<number> {
  const db = (await getDb())!;
  const [inserted] = await db.insert(workflowTriggerLog).values({
    triggerType: params.triggerType,
    sourceModule: params.sourceModule,
    sourceRecordId: params.sourceRecordId,
    ventureId: params.ventureId,
    status: params.status,
    payload: JSON.stringify(params.payload),
    result: params.result ? JSON.stringify(params.result) : null,
    error: params.error ?? null,
    targetModule: params.targetModule ?? null,
    targetRecordId: params.targetRecordId ?? null,
    retriedFrom: params.retriedFrom ?? null,
  });
  return (inserted as any).insertId as number;
}

// ── Helper: check idempotency ─────────────────────────────────────────────────
// Returns true if a successful trigger of this type for this source record
// already exists (so we skip re-running).

async function alreadyFired(
  triggerType: TriggerType,
  sourceRecordId: number
): Promise<boolean> {
  const db = (await getDb())!;
  const existing = await db
    .select({ id: workflowTriggerLog.id })
    .from(workflowTriggerLog)
    .where(
      and(
        eq(workflowTriggerLog.triggerType, triggerType),
        eq(workflowTriggerLog.sourceRecordId, sourceRecordId),
        eq(workflowTriggerLog.status, "success")
      )
    )
    .limit(1);
  return existing.length > 0;
}

// ── Trigger 1: research_completed → TRL evidence experiment ──────────────────
// When a university research project is marked "completed", automatically
// create an experiment in the Experiment Log with the research's trlImpact
// as the TRL level justified and the key findings as the result.

export async function triggerResearchCompleted(
  researchId: number,
  opts?: { retriedFrom?: number }
): Promise<TriggerResult> {
  const db = (await getDb())!;

  // Fetch the research project
  const [research] = await db
    .select()
    .from(uniResearchProjects)
    .where(eq(uniResearchProjects.id, researchId))
    .limit(1);

  if (!research) {
    return { success: false, logId: 0, message: "Research project not found" };
  }

  // Idempotency check
  if (!opts?.retriedFrom && (await alreadyFired("research_completed", researchId))) {
    return {
      success: true,
      logId: 0,
      message: "Trigger already fired for this research project — skipped",
    };
  }

  try {
    // Create a TRL evidence experiment
    const [inserted] = await db.insert(experiments).values({
      ventureId: research.ventureId,
      title: `[Auto] TRL Evidence: ${research.title}`,
      hypothesis: `Research project "${research.title}" supports TRL ${research.trlImpact ?? "?"}`,
      method: research.methodology ?? "University research",
      result: research.keyFindings ?? "See research project for full findings.",
      outcome: "Pass",
      trlLevelJustified: research.trlImpact ?? null,
    });
    const experimentId = (inserted as any).insertId as number;

    const logId = await logTrigger({
      triggerType: "research_completed",
      sourceModule: "universityPlaybook",
      sourceRecordId: researchId,
      ventureId: research.ventureId,
      payload: { researchId, title: research.title, trlImpact: research.trlImpact },
      status: "success",
      result: { experimentId, message: "TRL evidence experiment created" },
      targetModule: "experimentLog",
      targetRecordId: experimentId,
      retriedFrom: opts?.retriedFrom,
    });

    return {
      success: true,
      logId,
      targetRecordId: experimentId,
      message: `Created TRL evidence experiment #${experimentId} for research "${research.title}"`,
    };
  } catch (err: any) {
    const logId = await logTrigger({
      triggerType: "research_completed",
      sourceModule: "universityPlaybook",
      sourceRecordId: researchId,
      ventureId: research.ventureId,
      payload: { researchId },
      status: "failed",
      error: err?.message ?? String(err),
      retriedFrom: opts?.retriedFrom,
    });
    return { success: false, logId, message: err?.message ?? "Unknown error" };
  }
}

// ── Trigger 2: audit_failed → CAPA task in Venture Project Management ─────────
// When a factory audit has one or more "fail" items, automatically create a
// CAPA (Corrective and Preventive Action) task in the venture's project
// management workstream. The task is placed in the first available "Operations"
// workstream for the venture, or a new one is created if none exists.

export async function triggerAuditFailed(
  auditId: number,
  opts?: { retriedFrom?: number }
): Promise<TriggerResult> {
  const db = (await getDb())!;

  const [audit] = await db
    .select()
    .from(mfgFactoryAudits)
    .where(eq(mfgFactoryAudits.id, auditId))
    .limit(1);

  if (!audit) {
    return { success: false, logId: 0, message: "Factory audit not found" };
  }

  // Check if any item is "fail"
  const failedItems = [
    audit.facilityCondition,
    audit.equipmentCapability,
    audit.workforceSkills,
    audit.qcProcesses,
    audit.healthAndSafety,
    audit.environmentalCompliance,
  ].filter((v) => v === "fail");

  if (failedItems.length === 0) {
    return {
      success: true,
      logId: 0,
      message: "No failed audit items — trigger skipped",
    };
  }

  // Idempotency check
  if (!opts?.retriedFrom && (await alreadyFired("audit_failed", auditId))) {
    return {
      success: true,
      logId: 0,
      message: "Trigger already fired for this audit — skipped",
    };
  }

  try {
    // Find or create an Operations workstream for this venture
    let workstreamId: number;
    const existing = await db
      .select({ id: ventureWorkstreams.id })
      .from(ventureWorkstreams)
      .where(
        and(
          eq(ventureWorkstreams.ventureId, audit.ventureId),
          eq(ventureWorkstreams.functionalArea, "Operations")
        )
      )
      .limit(1);

    if (existing.length > 0) {
      workstreamId = existing[0].id;
    } else {
      // We need a phaseId — use 1 as a safe default (first phase)
      const [ws] = await db.insert(ventureWorkstreams).values({
        phaseId: 1,
        ventureId: audit.ventureId,
        name: "Manufacturing Operations",
        functionalArea: "Operations",
        owner: audit.auditorName ?? "Manufacturing Team",
        status: "In Progress",
      });
      workstreamId = (ws as any).insertId as number;
    }

    // Build CAPA task description
    const failedLabels: Record<string, string> = {
      facilityCondition: "Facility Condition",
      equipmentCapability: "Equipment Capability",
      workforceSkills: "Workforce Skills",
      qcProcesses: "QC Processes",
      healthAndSafety: "Health & Safety",
      environmentalCompliance: "Environmental Compliance",
    };
    const failedNames = Object.entries({
      facilityCondition: audit.facilityCondition,
      equipmentCapability: audit.equipmentCapability,
      workforceSkills: audit.workforceSkills,
      qcProcesses: audit.qcProcesses,
      healthAndSafety: audit.healthAndSafety,
      environmentalCompliance: audit.environmentalCompliance,
    })
      .filter(([, v]) => v === "fail")
      .map(([k]) => failedLabels[k])
      .join(", ");

    const [inserted] = await db.insert(ventureTasks).values({
      workstreamId,
      ventureId: audit.ventureId,
      title: `[CAPA] Factory Audit #${auditId} — ${audit.supplierName}`,
      description: `Corrective and Preventive Action required for factory audit at ${audit.supplierName}.\n\nFailed items: ${failedNames}\n\nFindings: ${audit.findings ?? "See audit record."}\n\nRequired actions: ${audit.correctiveActions ?? "Define corrective actions."}`,
      kanbanStatus: "To Do",
      priority: "High",
      assignee: audit.auditorName ?? undefined,
      notes: `Auto-created by Workflow Engine from Factory Audit #${auditId}`,
    });
    const taskId = (inserted as any).insertId as number;

    const logId = await logTrigger({
      triggerType: "audit_failed",
      sourceModule: "chinaManufacturingPlaybook",
      sourceRecordId: auditId,
      ventureId: audit.ventureId,
      payload: { auditId, supplierName: audit.supplierName, failedItems: failedNames },
      status: "success",
      result: { taskId, workstreamId, message: "CAPA task created" },
      targetModule: "ventureProjectManagement",
      targetRecordId: taskId,
      retriedFrom: opts?.retriedFrom,
    });

    return {
      success: true,
      logId,
      targetRecordId: taskId,
      message: `Created CAPA task #${taskId} for audit at "${audit.supplierName}" (failed: ${failedNames})`,
    };
  } catch (err: any) {
    const logId = await logTrigger({
      triggerType: "audit_failed",
      sourceModule: "chinaManufacturingPlaybook",
      sourceRecordId: auditId,
      ventureId: audit.ventureId,
      payload: { auditId },
      status: "failed",
      error: err?.message ?? String(err),
      retriedFrom: opts?.retriedFrom,
    });
    return { success: false, logId, message: err?.message ?? "Unknown error" };
  }
}

// ── Trigger 3: supplier_approved → pre-populate Approved Supplier List ────────
// When a supplier onboarding record is approved, automatically create an
// Approved Supplier List entry pre-filled with the supplier's data.
// If an ASL entry already exists with the same onboardingId, it is skipped.

export async function triggerSupplierApproved(
  onboardingId: number,
  opts?: { retriedFrom?: number }
): Promise<TriggerResult> {
  const db = (await getDb())!;

  const [supplier] = await db
    .select()
    .from(mfgSupplierOnboarding)
    .where(eq(mfgSupplierOnboarding.id, onboardingId))
    .limit(1);

  if (!supplier) {
    return { success: false, logId: 0, message: "Supplier onboarding record not found" };
  }

  if (supplier.status !== "approved") {
    return {
      success: true,
      logId: 0,
      message: `Supplier status is "${supplier.status}" — trigger only fires on "approved"`,
    };
  }

  // Idempotency check
  if (!opts?.retriedFrom && (await alreadyFired("supplier_approved", onboardingId))) {
    return {
      success: true,
      logId: 0,
      message: "Trigger already fired for this supplier — skipped",
    };
  }

  // Also check if an ASL entry with this onboardingId already exists
  const existingAsl = await db
    .select({ id: mfgApprovedSuppliers.id })
    .from(mfgApprovedSuppliers)
    .where(eq(mfgApprovedSuppliers.onboardingId, onboardingId))
    .limit(1);

  if (existingAsl.length > 0) {
    return {
      success: true,
      logId: 0,
      message: `ASL entry already exists for onboarding #${onboardingId} — skipped`,
    };
  }

  try {
    // Compute overall performance score from capability scores
    const scores = [
      supplier.technicalCapability,
      supplier.qualitySystems,
      supplier.leadTimesScore,
      supplier.costCompetitiveness,
      supplier.communication,
      supplier.complianceStandards,
    ].filter((s) => s != null) as number[];
    const avgScore =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;

    const [inserted] = await db.insert(mfgApprovedSuppliers).values({
      ventureId: supplier.ventureId,
      onboardingId: supplier.id,
      supplierName: supplier.companyName,
      tierLevel: "components",
      capabilities: supplier.capabilities ?? null,
      riskRating: "medium",
      performanceScore: Math.round(avgScore * 10) / 10,
      qualityScore: supplier.qualitySystems ?? 0,
      deliveryScore: supplier.leadTimesScore ?? 0,
      costScore: supplier.costCompetitiveness ?? 0,
      approvalDate: new Date(),
      approvedBy: "Workflow Engine (auto)",
      status: "active",
      notes: `Auto-created from Supplier Onboarding #${supplier.id}. Review and update scores as needed.`,
    });
    const aslId = (inserted as any).insertId as number;

    const logId = await logTrigger({
      triggerType: "supplier_approved",
      sourceModule: "chinaManufacturingPlaybook",
      sourceRecordId: onboardingId,
      ventureId: supplier.ventureId,
      payload: { onboardingId, companyName: supplier.companyName, overallScore: supplier.overallScore },
      status: "success",
      result: { aslId, message: "ASL entry created" },
      targetModule: "approvedSupplierList",
      targetRecordId: aslId,
      retriedFrom: opts?.retriedFrom,
    });

    return {
      success: true,
      logId,
      targetRecordId: aslId,
      message: `Created ASL entry #${aslId} for supplier "${supplier.companyName}"`,
    };
  } catch (err: any) {
    const logId = await logTrigger({
      triggerType: "supplier_approved",
      sourceModule: "chinaManufacturingPlaybook",
      sourceRecordId: onboardingId,
      ventureId: supplier.ventureId,
      payload: { onboardingId },
      status: "failed",
      error: err?.message ?? String(err),
      retriedFrom: opts?.retriedFrom,
    });
    return { success: false, logId, message: err?.message ?? "Unknown error" };
  }
}

// ── Main dispatcher ───────────────────────────────────────────────────────────
// Call this from any tRPC mutation to fire the appropriate trigger.

export async function dispatchTrigger(
  triggerType: TriggerType,
  sourceRecordId: number,
  opts?: { retriedFrom?: number }
): Promise<TriggerResult> {
  switch (triggerType) {
    case "research_completed":
      return triggerResearchCompleted(sourceRecordId, opts);
    case "audit_failed":
      return triggerAuditFailed(sourceRecordId, opts);
    case "supplier_approved":
      return triggerSupplierApproved(sourceRecordId, opts);
    default:
      return { success: false, logId: 0, message: `Unknown trigger type: ${triggerType}` };
  }
}
