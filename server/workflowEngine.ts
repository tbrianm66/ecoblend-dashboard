// ── Workflow Engine ────────────────────────────────────────────────────────────
// Cross-module trigger dispatcher for the EcoBlend Venture OS.
//
// Seven automated triggers:
//   1. research_completed    → create TRL evidence experiment in Experiment Log
//   2. audit_failed          → create CAPA task in Venture Project Management
//   3. supplier_approved     → pre-populate Approved Supplier List entry
//   4. deal_closed_won       → create Customer Onboarding task in PM
//   5. funding_round_closed  → create Cap Table Update task in PM
//   6. milestone_overdue     → escalation notification + High-priority task
//   7. data_quality_degraded → create Data Review task in PM + owner notification
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
  crmDeals,
  invFundingRounds,
  ventureMilestones,
  dmDataAssets,
  dmQualityScores,
} from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TriggerType =
  | "research_completed"
  | "audit_failed"
  | "supplier_approved"
  | "deal_closed_won"
  | "funding_round_closed"
  | "milestone_overdue"
  | "data_quality_degraded";

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

// ── Helper: find or create Operations workstream ──────────────────────────────

async function getOrCreateOpsWorkstream(ventureId: string, ownerName?: string): Promise<number> {
  const db = (await getDb())!;
  const existing = await db
    .select({ id: ventureWorkstreams.id })
    .from(ventureWorkstreams)
    .where(
      and(
        eq(ventureWorkstreams.ventureId, ventureId),
        eq(ventureWorkstreams.functionalArea, "Operations")
      )
    )
    .limit(1);

  if (existing.length > 0) return existing[0].id;

  const [ws] = await db.insert(ventureWorkstreams).values({
    phaseId: 1,
    ventureId,
    name: "Operations",
    functionalArea: "Operations",
    owner: ownerName ?? "Workflow Engine",
    status: "In Progress",
  });
  return (ws as any).insertId as number;
}

// ── Trigger 1: research_completed → TRL evidence experiment ──────────────────

export async function triggerResearchCompleted(
  researchId: number,
  opts?: { retriedFrom?: number }
): Promise<TriggerResult> {
  const db = (await getDb())!;

  const [research] = await db
    .select()
    .from(uniResearchProjects)
    .where(eq(uniResearchProjects.id, researchId))
    .limit(1);

  if (!research) {
    return { success: false, logId: 0, message: "Research project not found" };
  }

  if (!opts?.retriedFrom && (await alreadyFired("research_completed", researchId))) {
    return { success: true, logId: 0, message: "Trigger already fired — skipped" };
  }

  try {
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

    // Notify owner
    await notifyOwner({
      title: "Workflow Engine: TRL Evidence Created",
      content: `Research project "${research.title}" completed. TRL evidence experiment #${experimentId} auto-created for venture ${research.ventureId}.`,
    }).catch(() => {}); // non-blocking

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

// ── Trigger 2: audit_failed → CAPA task ──────────────────────────────────────

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

  const failedItems = [
    audit.facilityCondition,
    audit.equipmentCapability,
    audit.workforceSkills,
    audit.qcProcesses,
    audit.healthAndSafety,
    audit.environmentalCompliance,
  ].filter((v) => v === "fail");

  if (failedItems.length === 0) {
    return { success: true, logId: 0, message: "No failed audit items — trigger skipped" };
  }

  if (!opts?.retriedFrom && (await alreadyFired("audit_failed", auditId))) {
    return { success: true, logId: 0, message: "Trigger already fired — skipped" };
  }

  try {
    const workstreamId = await getOrCreateOpsWorkstream(audit.ventureId, audit.auditorName ?? undefined);

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
      description: `Corrective and Preventive Action required.\n\nFailed items: ${failedNames}\n\nFindings: ${audit.findings ?? "See audit record."}\n\nRequired actions: ${audit.correctiveActions ?? "Define corrective actions."}`,
      kanbanStatus: "To Do",
      priority: "High",
      assignee: audit.auditorName ?? undefined,
      notes: `Auto-created by Workflow Engine from Factory Audit #${auditId}`,
    });
    const taskId = (inserted as any).insertId as number;

    await notifyOwner({
      title: "Workflow Engine: CAPA Task Created",
      content: `Factory audit at ${audit.supplierName} has ${failedItems.length} failed item(s): ${failedNames}. CAPA task #${taskId} created in Venture Project Management.`,
    }).catch(() => {});

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

// ── Trigger 3: supplier_approved → pre-populate ASL ──────────────────────────

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
    return { success: true, logId: 0, message: `Supplier status is "${supplier.status}" — trigger only fires on "approved"` };
  }

  if (!opts?.retriedFrom && (await alreadyFired("supplier_approved", onboardingId))) {
    return { success: true, logId: 0, message: "Trigger already fired — skipped" };
  }

  const existingAsl = await db
    .select({ id: mfgApprovedSuppliers.id })
    .from(mfgApprovedSuppliers)
    .where(eq(mfgApprovedSuppliers.onboardingId, onboardingId))
    .limit(1);

  if (existingAsl.length > 0) {
    return { success: true, logId: 0, message: `ASL entry already exists for onboarding #${onboardingId} — skipped` };
  }

  try {
    const scores = [
      supplier.technicalCapability,
      supplier.qualitySystems,
      supplier.leadTimesScore,
      supplier.costCompetitiveness,
      supplier.communication,
      supplier.complianceStandards,
    ].filter((s) => s != null) as number[];
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

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

    await notifyOwner({
      title: "Workflow Engine: Supplier Added to ASL",
      content: `Supplier "${supplier.companyName}" approved. ASL entry #${aslId} auto-created with performance score ${Math.round(avgScore * 10) / 10}/10.`,
    }).catch(() => {});

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

// ── Trigger 4: deal_closed_won → Customer Onboarding task ────────────────────

export async function triggerDealClosedWon(
  dealId: number,
  opts?: { retriedFrom?: number }
): Promise<TriggerResult> {
  const db = (await getDb())!;

  const [deal] = await db
    .select()
    .from(crmDeals)
    .where(eq(crmDeals.id, dealId))
    .limit(1);

  if (!deal) {
    return { success: false, logId: 0, message: "Deal not found" };
  }

  if (deal.status !== "won") {
    return { success: true, logId: 0, message: `Deal status is "${deal.status}" — trigger only fires on "won"` };
  }

  if (!opts?.retriedFrom && (await alreadyFired("deal_closed_won", dealId))) {
    return { success: true, logId: 0, message: "Trigger already fired — skipped" };
  }

  const ventureId = deal.ventureId ?? "unknown";

  try {
    const workstreamId = await getOrCreateOpsWorkstream(ventureId, deal.assignedTo ?? undefined);

    const [inserted] = await db.insert(ventureTasks).values({
      workstreamId,
      ventureId,
      title: `[Onboarding] New Customer: ${deal.company ?? deal.title}`,
      description: `Deal "${deal.title}" closed won (value: £${(deal.value ?? 0).toLocaleString()}).\n\nInitiate customer onboarding process:\n- Send welcome pack\n- Schedule kickoff call\n- Set up access and accounts\n- Assign customer success owner`,
      kanbanStatus: "To Do",
      priority: "High",
      assignee: deal.assignedTo ?? undefined,
      notes: `Auto-created by Workflow Engine from CRM Deal #${dealId}`,
    });
    const taskId = (inserted as any).insertId as number;

    await notifyOwner({
      title: "🎉 Deal Closed Won!",
      content: `Deal "${deal.title}" with ${deal.company ?? "unknown company"} closed won (£${(deal.value ?? 0).toLocaleString()}). Customer onboarding task #${taskId} created in Venture Project Management.`,
    }).catch(() => {});

    const logId = await logTrigger({
      triggerType: "deal_closed_won",
      sourceModule: "commercialCrm",
      sourceRecordId: dealId,
      ventureId,
      payload: { dealId, title: deal.title, company: deal.company, value: deal.value },
      status: "success",
      result: { taskId, message: "Customer onboarding task created" },
      targetModule: "ventureProjectManagement",
      targetRecordId: taskId,
      retriedFrom: opts?.retriedFrom,
    });

    return {
      success: true,
      logId,
      targetRecordId: taskId,
      message: `Created customer onboarding task #${taskId} for deal "${deal.title}"`,
    };
  } catch (err: any) {
    const logId = await logTrigger({
      triggerType: "deal_closed_won",
      sourceModule: "commercialCrm",
      sourceRecordId: dealId,
      ventureId,
      payload: { dealId },
      status: "failed",
      error: err?.message ?? String(err),
      retriedFrom: opts?.retriedFrom,
    });
    return { success: false, logId, message: err?.message ?? "Unknown error" };
  }
}

// ── Trigger 5: funding_round_closed → Cap Table Update task ──────────────────

export async function triggerFundingRoundClosed(
  roundId: number,
  opts?: { retriedFrom?: number }
): Promise<TriggerResult> {
  const db = (await getDb())!;

  const [round] = await db
    .select()
    .from(invFundingRounds)
    .where(eq(invFundingRounds.id, roundId))
    .limit(1);

  if (!round) {
    return { success: false, logId: 0, message: "Funding round not found" };
  }

  if (round.status !== "closed") {
    return { success: true, logId: 0, message: `Round status is "${round.status}" — trigger only fires on "closed"` };
  }

  if (!opts?.retriedFrom && (await alreadyFired("funding_round_closed", roundId))) {
    return { success: true, logId: 0, message: "Trigger already fired — skipped" };
  }

  try {
    const workstreamId = await getOrCreateOpsWorkstream(round.ventureId);

    const [inserted] = await db.insert(ventureTasks).values({
      workstreamId,
      ventureId: round.ventureId,
      title: `[Finance] Update Cap Table — ${round.name}`,
      description: `Funding round "${round.name}" (${round.roundType}) closed.\n\nRaised: £${(round.raisedAmount ?? 0).toLocaleString()} of £${(round.targetAmount ?? 0).toLocaleString()} target.\nPost-money valuation: £${(round.postMoneyVal ?? 0).toLocaleString()}\nEquity offered: ${round.equityOffered ?? 0}%\nLead investor: ${round.leadInvestor ?? "TBC"}\n\nRequired actions:\n- Update cap table with new shareholders\n- Issue share certificates\n- File at Companies House\n- Update financial model`,
      kanbanStatus: "To Do",
      priority: "Critical",
      notes: `Auto-created by Workflow Engine from Funding Round #${roundId}`,
    });
    const taskId = (inserted as any).insertId as number;

    await notifyOwner({
      title: "Funding Round Closed",
      content: `Round "${round.name}" closed — £${(round.raisedAmount ?? 0).toLocaleString()} raised at £${(round.postMoneyVal ?? 0).toLocaleString()} post-money valuation. Cap table update task #${taskId} created.`,
    }).catch(() => {});

    const logId = await logTrigger({
      triggerType: "funding_round_closed",
      sourceModule: "investorCrm",
      sourceRecordId: roundId,
      ventureId: round.ventureId,
      payload: { roundId, name: round.name, raisedAmount: round.raisedAmount, postMoneyVal: round.postMoneyVal },
      status: "success",
      result: { taskId, message: "Cap table update task created" },
      targetModule: "ventureProjectManagement",
      targetRecordId: taskId,
      retriedFrom: opts?.retriedFrom,
    });

    return {
      success: true,
      logId,
      targetRecordId: taskId,
      message: `Created cap table update task #${taskId} for round "${round.name}"`,
    };
  } catch (err: any) {
    const logId = await logTrigger({
      triggerType: "funding_round_closed",
      sourceModule: "investorCrm",
      sourceRecordId: roundId,
      ventureId: round.ventureId,
      payload: { roundId },
      status: "failed",
      error: err?.message ?? String(err),
      retriedFrom: opts?.retriedFrom,
    });
    return { success: false, logId, message: err?.message ?? "Unknown error" };
  }
}

// ── Trigger 6: milestone_overdue → escalation notification + task ─────────────

export async function triggerMilestoneOverdue(
  milestoneId: number,
  opts?: { retriedFrom?: number }
): Promise<TriggerResult> {
  const db = (await getDb())!;

  const [milestone] = await db
    .select()
    .from(ventureMilestones)
    .where(eq(ventureMilestones.id, milestoneId))
    .limit(1);

  if (!milestone) {
    return { success: false, logId: 0, message: "Milestone not found" };
  }

  // Check if milestone is actually overdue
  const isOverdue =
    milestone.status === "Overdue" ||
    (milestone.status !== "Completed" &&
      milestone.status !== "Cancelled" &&
      milestone.targetDate != null &&
      new Date(milestone.targetDate) < new Date());

  if (!isOverdue) {
    return { success: true, logId: 0, message: "Milestone is not overdue — trigger skipped" };
  }

  if (!opts?.retriedFrom && (await alreadyFired("milestone_overdue", milestoneId))) {
    return { success: true, logId: 0, message: "Trigger already fired — skipped" };
  }

  try {
    const workstreamId = await getOrCreateOpsWorkstream(milestone.ventureId);

    const daysOverdue = milestone.targetDate
      ? Math.floor((Date.now() - new Date(milestone.targetDate).getTime()) / 86400000)
      : 0;

    const [inserted] = await db.insert(ventureTasks).values({
      workstreamId,
      ventureId: milestone.ventureId,
      title: `[Escalation] Overdue Milestone: ${milestone.title}`,
      description: `Milestone "${milestone.title}" is ${daysOverdue} day(s) overdue (target: ${milestone.targetDate ?? "unknown"}).\n\nMilestone type: ${milestone.milestoneType ?? "Deliverable"}\nCurrent status: ${milestone.status}\n\nRequired actions:\n- Review blockers and dependencies\n- Update milestone status or target date\n- Escalate to venture lead if blocked`,
      kanbanStatus: "To Do",
      priority: "Critical",
      notes: `Auto-created by Workflow Engine from Milestone #${milestoneId}`,
    });
    const taskId = (inserted as any).insertId as number;

    // Mark milestone as Overdue in the DB if not already
    if (milestone.status !== "Overdue") {
      await db.update(ventureMilestones)
        .set({ status: "Overdue", updatedAt: new Date() })
        .where(eq(ventureMilestones.id, milestoneId));
    }

    await notifyOwner({
      title: "⚠️ Milestone Overdue",
      content: `Milestone "${milestone.title}" is ${daysOverdue} day(s) overdue. Escalation task #${taskId} created in Venture Project Management.`,
    }).catch(() => {});

    const logId = await logTrigger({
      triggerType: "milestone_overdue",
      sourceModule: "ventureProjectManagement",
      sourceRecordId: milestoneId,
      ventureId: milestone.ventureId,
      payload: { milestoneId, title: milestone.title, targetDate: milestone.targetDate, daysOverdue },
      status: "success",
      result: { taskId, message: "Escalation task created" },
      targetModule: "ventureProjectManagement",
      targetRecordId: taskId,
      retriedFrom: opts?.retriedFrom,
    });

    return {
      success: true,
      logId,
      targetRecordId: taskId,
      message: `Created escalation task #${taskId} for overdue milestone "${milestone.title}" (${daysOverdue} days overdue)`,
    };
  } catch (err: any) {
    const logId = await logTrigger({
      triggerType: "milestone_overdue",
      sourceModule: "ventureProjectManagement",
      sourceRecordId: milestoneId,
      ventureId: milestone.ventureId,
      payload: { milestoneId },
      status: "failed",
      error: err?.message ?? String(err),
      retriedFrom: opts?.retriedFrom,
    });
    return { success: false, logId, message: err?.message ?? "Unknown error" };
  }
}

// ── Trigger 7: data_quality_degraded → Data Review task ──────────────────────

export async function triggerDataQualityDegraded(
  qualityScoreId: number,
  opts?: { retriedFrom?: number }
): Promise<TriggerResult> {
  const db = (await getDb())!;

  const [score] = await db
    .select()
    .from(dmQualityScores)
    .where(eq(dmQualityScores.id, qualityScoreId))
    .limit(1);

  if (!score) {
    return { success: false, logId: 0, message: "Quality score record not found" };
  }

  const threshold = 60;
  if ((score.overallScore ?? 100) >= threshold) {
    return { success: true, logId: 0, message: `Quality score ${score.overallScore} is above threshold ${threshold} — trigger skipped` };
  }

  if (!opts?.retriedFrom && (await alreadyFired("data_quality_degraded", qualityScoreId))) {
    return { success: true, logId: 0, message: "Trigger already fired — skipped" };
  }

  // Get the asset for context
  const [asset] = await db
    .select()
    .from(dmDataAssets)
    .where(eq(dmDataAssets.id, score.assetId))
    .limit(1);

  const assetName = asset?.name ?? `Asset #${score.assetId}`;
  const ventureId = asset?.ventureId ?? "unknown";

  try {
    const workstreamId = await getOrCreateOpsWorkstream(ventureId);

    const issues = score.issues ? JSON.parse(score.issues) : [];
    const issuesSummary = Array.isArray(issues) && issues.length > 0
      ? issues.slice(0, 3).map((i: any) => `• ${i.field ?? "?"}: ${i.type ?? "?"} (${i.severity ?? "?"})`).join("\n")
      : "See quality score record for details.";

    const [inserted] = await db.insert(ventureTasks).values({
      workstreamId,
      ventureId,
      title: `[Data Quality] Review Required: ${assetName}`,
      description: `Data asset "${assetName}" quality score has degraded to ${score.overallScore?.toFixed(1) ?? "?"}/100 (threshold: ${threshold}).\n\nDimension scores:\n- Completeness: ${score.completeness ?? "N/A"}\n- Accuracy: ${score.accuracy ?? "N/A"}\n- Freshness: ${score.freshness ?? "N/A"}\n- Consistency: ${score.consistency ?? "N/A"}\n- Uniqueness: ${score.uniqueness ?? "N/A"}\n\nTop issues:\n${issuesSummary}\n\nRequired actions:\n- Review and remediate data quality issues\n- Re-run quality assessment after fixes\n- Update data ingestion pipeline if needed`,
      kanbanStatus: "To Do",
      priority: "High",
      notes: `Auto-created by Workflow Engine from Quality Score #${qualityScoreId}`,
    });
    const taskId = (inserted as any).insertId as number;

    await notifyOwner({
      title: "⚠️ Data Quality Alert",
      content: `Data asset "${assetName}" quality score degraded to ${score.overallScore?.toFixed(1) ?? "?"}% (below ${threshold}% threshold). Data review task #${taskId} created.`,
    }).catch(() => {});

    const logId = await logTrigger({
      triggerType: "data_quality_degraded",
      sourceModule: "dataManagement",
      sourceRecordId: qualityScoreId,
      ventureId,
      payload: { qualityScoreId, assetName, overallScore: score.overallScore, threshold },
      status: "success",
      result: { taskId, message: "Data review task created" },
      targetModule: "ventureProjectManagement",
      targetRecordId: taskId,
      retriedFrom: opts?.retriedFrom,
    });

    return {
      success: true,
      logId,
      targetRecordId: taskId,
      message: `Created data review task #${taskId} for asset "${assetName}" (score: ${score.overallScore?.toFixed(1) ?? "?"})`,
    };
  } catch (err: any) {
    const logId = await logTrigger({
      triggerType: "data_quality_degraded",
      sourceModule: "dataManagement",
      sourceRecordId: qualityScoreId,
      ventureId,
      payload: { qualityScoreId },
      status: "failed",
      error: err?.message ?? String(err),
      retriedFrom: opts?.retriedFrom,
    });
    return { success: false, logId, message: err?.message ?? "Unknown error" };
  }
}

// ── Main dispatcher ───────────────────────────────────────────────────────────

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
    case "deal_closed_won":
      return triggerDealClosedWon(sourceRecordId, opts);
    case "funding_round_closed":
      return triggerFundingRoundClosed(sourceRecordId, opts);
    case "milestone_overdue":
      return triggerMilestoneOverdue(sourceRecordId, opts);
    case "data_quality_degraded":
      return triggerDataQualityDegraded(sourceRecordId, opts);
    default:
      return { success: false, logId: 0, message: `Unknown trigger type: ${triggerType}` };
  }
}
