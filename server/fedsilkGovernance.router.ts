import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  fedsilkSteps,
  fedsilkEvidence,
  fedsilkContractTriggers,
  fedsilkRiskFlags,
} from "../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_STEPS = [
  {
    stepKey: "F", stepName: "Founder Intent & Fiduciary Alignment", sortOrder: 1,
    purpose: "Confirm that founding intent, mission lock, and fiduciary duties are documented and legally binding across all entity layers.",
    governanceQuestion: "Is the founder's purpose, authority, and fiduciary responsibility clearly documented and legally enforceable at holding company and venture level?",
    requiredApproval: "Board of Directors — Holding Company",
    linkedContract: "Founder Agreement / Founder IP Assignment",
    riskIfIncomplete: "Founder dependency risk. Undocumented intent creates disputes at investment, exit, or succession. IP assignment gaps expose the venture to IP ownership ambiguity.",
    status: "in_progress", owner: "Brian (CEO/Founder)", dueDate: "2026-08-01",
    notes: "Founder agreement drafted. IP assignment pending legal review.",
  },
  {
    stepKey: "E", stepName: "Equity, ESOP & Economic Participation Rules", sortOrder: 2,
    purpose: "Establish fair, compliant, and transparent equity distribution, option pool, and economic participation rules for founders, team, and investors.",
    governanceQuestion: "Are equity ownership, dilution mechanics, ESOP terms, and economic participation rights formally approved and documented?",
    requiredApproval: "Board of Directors + Shareholder Resolution",
    linkedContract: "ESOP / Share Option Plan, SPV Shareholder Agreement",
    riskIfIncomplete: "Unclear equity creates team disputes, blocks SEIS/EIS qualifying status, and undermines investor confidence at Series A.",
    status: "not_started", owner: "Brian (CEO)", dueDate: "2026-09-01",
    notes: "ESOP framework under design. Legal counsel engaged.",
  },
  {
    stepKey: "D", stepName: "Decision Rights & Delegated Authority", sortOrder: 3,
    purpose: "Define and document who holds decision-making authority across holding company, studio, SPV, and venture layers — including reserved matters.",
    governanceQuestion: "Are decision rights, reserved matters, and delegation of authority formally approved, documented, and communicated to all relevant parties?",
    requiredApproval: "Board of Directors — all entity layers",
    linkedContract: "Board Reserved Matters Schedule, Studio-to-SPV Services Agreement",
    riskIfIncomplete: "Unclear decision authority exposes ventures to governance disputes, investor liability, and regulatory non-compliance.",
    status: "under_review", owner: "Brian (CEO)", dueDate: "2026-07-15",
    notes: "Reserved matters schedule drafted. Pending board ratification.",
  },
  {
    stepKey: "S", stepName: "Stewardship, Succession & Mission Protection", sortOrder: 4,
    purpose: "Ensure the organisation's mission, values, and strategic direction are protected against founder departure, ownership change, or mission drift.",
    governanceQuestion: "Is there a documented succession plan, mission-lock mechanism, and stewardship framework approved by the board?",
    requiredApproval: "Board of Directors — Holding Company + Charity/Foundation (if applicable)",
    linkedContract: "Succession Plan, Charity MoU, Constitutional Governance Document",
    riskIfIncomplete: "Mission drift risk. Founder departure without succession creates governance vacuum. Profit-donation obligations may not survive a change of control.",
    status: "not_started", owner: "Brian (CEO)", dueDate: "2026-10-01",
    notes: "Constitutional governance document in progress. Charity MoU not yet initiated.",
  },
  {
    stepKey: "I", stepName: "IP Ownership, Licensing & Field-of-Use Controls", sortOrder: 5,
    purpose: "Establish clear legal ownership, assignment, and licensing terms for all intellectual property created by or for the venture.",
    governanceQuestion: "Is all IP formally assigned, registered, and licensed under documented field-of-use controls with appropriate ownership by the correct entity?",
    requiredApproval: "Board of Directors + IP Counsel",
    linkedContract: "Founder IP Assignment, IP Licence, Field-of-Use Licence",
    riskIfIncomplete: "IP ownership ambiguity undermines valuation, blocks licensing revenue, and exposes the venture to competitor challenge. FEDSILK attribution gaps can invalidate data-sharing claims.",
    status: "in_progress", owner: "IP Counsel", dueDate: "2026-08-15",
    notes: "Patent GB2024/001234 filed. Field-of-use licence for BEBUS SPV pending.",
  },
  {
    stepKey: "L", stepName: "Legal Contracts & Constitutional Documents", sortOrder: 6,
    purpose: "Ensure all governance, commercial, and operational contracts are executed, current, and linked to the correct entity.",
    governanceQuestion: "Are all required legal contracts, constitutional documents, and regulatory filings completed, executed, and properly archived?",
    requiredApproval: "Legal Counsel + Board of Directors",
    linkedContract: "Investment MoU, Investor Term Sheet, Profit Donation Agreement",
    riskIfIncomplete: "Missing contracts create unenforceable obligations. Unsigned investment documents delay capital raises. Absent constitutional documents expose governance decisions to legal challenge.",
    status: "in_progress", owner: "Legal Counsel", dueDate: "2026-08-01",
    notes: "Contract tracker active in Legal Repository. 12 of 18 priority contracts executed.",
  },
  {
    stepKey: "K", stepName: "Knowledge Attribution, Audit Trail & Venture Memory", sortOrder: 7,
    purpose: "Maintain an immutable, verifiable record of governance decisions, knowledge contributions, IP attribution, and institutional memory.",
    governanceQuestion: "Is there a complete, tamper-evident audit trail of all material governance decisions, IP contributions, and attributable knowledge assets?",
    requiredApproval: "Board of Directors + Audit Committee",
    linkedContract: "Attribution Contract, Board Reserved Matters Schedule",
    riskIfIncomplete: "Incomplete audit trail creates regulatory compliance gaps, blocks GDPR compliance for data contributor rights, and undermines investor due diligence.",
    status: "not_started", owner: "Brian (CEO)", dueDate: "2026-11-01",
    notes: "FEDSILK Attribution Engine (M1–M5) provides the federated learning attribution layer. Governance decision log pending board formalisation.",
  },
];

const SEED_EVIDENCE = [
  // F — Founder Intent
  { stepKey: "F", title: "Founder Agreement (executed)", entityLevel: "holding_co", evidenceType: "contract", required: true, status: "in_progress", owner: "Brian (CEO)", notes: "Drafted. Awaiting solicitor sign-off." },
  { stepKey: "F", title: "Founder IP Assignment (all pre-company inventions)", entityLevel: "holding_co", evidenceType: "contract", required: true, status: "not_started", owner: "IP Counsel" },
  { stepKey: "F", title: "Board Minute — Founder Authority & Mission Lock Resolution", entityLevel: "holding_co", evidenceType: "board_minute", required: true, status: "not_started", owner: "Brian (CEO)" },
  { stepKey: "F", title: "Fiduciary Duty Disclosure Declaration", entityLevel: "holding_co", evidenceType: "policy", required: true, status: "not_started", owner: "Brian (CEO)" },
  // E — Equity / ESOP
  { stepKey: "E", title: "ESOP Scheme Rules (EMI or Unapproved)", entityLevel: "holding_co", evidenceType: "contract", required: true, status: "not_started", owner: "Legal Counsel", notes: "EMI scheme preferred for UK tax efficiency." },
  { stepKey: "E", title: "Cap Table Register (fully diluted)", entityLevel: "holding_co", evidenceType: "register", required: true, status: "not_started", owner: "Brian (CEO)" },
  { stepKey: "E", title: "SPV Shareholder Agreement (BEBUS)", entityLevel: "spv", evidenceType: "contract", required: true, status: "not_started", owner: "Legal Counsel" },
  { stepKey: "E", title: "Board Minute — ESOP Approval Resolution", entityLevel: "holding_co", evidenceType: "board_minute", required: true, status: "not_started", owner: "Brian (CEO)" },
  { stepKey: "E", title: "SEIS/EIS Compliance Checklist", entityLevel: "spv", evidenceType: "policy", required: false, status: "not_started", owner: "Finance Director" },
  // D — Decision Rights
  { stepKey: "D", title: "Board Reserved Matters Schedule (v1.0)", entityLevel: "holding_co", evidenceType: "policy", required: true, status: "in_progress", owner: "Brian (CEO)", notes: "Draft v0.2 under legal review." },
  { stepKey: "D", title: "Delegation of Authority Matrix", entityLevel: "studio", evidenceType: "policy", required: true, status: "not_started", owner: "Brian (CEO)" },
  { stepKey: "D", title: "Studio-to-SPV Services Agreement", entityLevel: "spv", evidenceType: "contract", required: true, status: "not_started", owner: "Legal Counsel" },
  { stepKey: "D", title: "Board Minute — Reserved Matters Adoption", entityLevel: "holding_co", evidenceType: "board_minute", required: true, status: "not_started", owner: "Brian (CEO)" },
  // S — Stewardship
  { stepKey: "S", title: "Succession Plan (Founder + Key Person)", entityLevel: "holding_co", evidenceType: "policy", required: true, status: "not_started", owner: "Brian (CEO)" },
  { stepKey: "S", title: "Constitutional Governance Document (Mission Lock Clause)", entityLevel: "holding_co", evidenceType: "contract", required: true, status: "in_progress", owner: "Legal Counsel" },
  { stepKey: "S", title: "Charity / Foundation MoU", entityLevel: "charity", evidenceType: "contract", required: false, status: "not_started", owner: "Brian (CEO)", notes: "Required if nominated charity relationship is formal." },
  { stepKey: "S", title: "Profit Donation Agreement", entityLevel: "charity", evidenceType: "contract", required: false, status: "not_started", owner: "Finance Director" },
  { stepKey: "S", title: "Board Minute — Mission Lock Resolution", entityLevel: "holding_co", evidenceType: "board_minute", required: true, status: "not_started", owner: "Brian (CEO)" },
  // I — IP
  { stepKey: "I", title: "IP Ownership Register (all assets)", entityLevel: "holding_co", evidenceType: "register", required: true, status: "in_progress", owner: "IP Counsel", notes: "12 assets registered. 3 pending." },
  { stepKey: "I", title: "Patent Filing Confirmation (GB2024/001234)", entityLevel: "holding_co", evidenceType: "approval", required: true, status: "approved", owner: "IP Counsel" },
  { stepKey: "I", title: "IP Licence Agreement (Studio → SPV)", entityLevel: "spv", evidenceType: "contract", required: true, status: "not_started", owner: "Legal Counsel" },
  { stepKey: "I", title: "Field-of-Use Licence (BEBUS SPV)", entityLevel: "spv", evidenceType: "contract", required: true, status: "not_started", owner: "Legal Counsel" },
  { stepKey: "I", title: "FEDSILK Attribution Contract (data contributors)", entityLevel: "venture", evidenceType: "attribution_note", required: false, status: "not_started", owner: "Brian (CEO)", notes: "Required if external data partners are involved." },
  // L — Legal
  { stepKey: "L", title: "Investment MoU (seed round)", entityLevel: "spv", evidenceType: "contract", required: true, status: "in_progress", owner: "Legal Counsel" },
  { stepKey: "L", title: "Investor Term Sheet", entityLevel: "spv", evidenceType: "contract", required: true, status: "not_started", owner: "Legal Counsel" },
  { stepKey: "L", title: "Company Constitution / Articles of Association", entityLevel: "holding_co", evidenceType: "contract", required: true, status: "approved", owner: "Legal Counsel" },
  { stepKey: "L", title: "GDPR Data Processing Agreement", entityLevel: "holding_co", evidenceType: "policy", required: true, status: "not_started", owner: "Data Protection Officer" },
  // K — Knowledge / Audit
  { stepKey: "K", title: "Governance Decision Log (board-approved entries)", entityLevel: "holding_co", evidenceType: "decision_log", required: true, status: "not_started", owner: "Brian (CEO)" },
  { stepKey: "K", title: "Attribution Contract (knowledge contributors)", entityLevel: "venture", evidenceType: "attribution_note", required: false, status: "not_started", owner: "Brian (CEO)" },
  { stepKey: "K", title: "FEDSILK Audit Ledger Integrity Report (M4)", entityLevel: "venture", evidenceType: "risk_assessment", required: true, status: "not_started", owner: "Brian (CEO)" },
  { stepKey: "K", title: "GDPR Article 17 Unlearning Protocol (M5)", entityLevel: "venture", evidenceType: "policy", required: true, status: "not_started", owner: "Data Protection Officer" },
];

const SEED_CONTRACTS = [
  { stepKey: "F", contractName: "Founder Agreement", entityLevel: "holding_co", status: "in_progress", priority: "immediate", riskLevel: "critical" },
  { stepKey: "F", contractName: "Founder IP Assignment", entityLevel: "holding_co", status: "not_started", priority: "immediate", riskLevel: "critical" },
  { stepKey: "E", contractName: "ESOP / Share Option Plan", entityLevel: "holding_co", status: "not_started", priority: "high", riskLevel: "high" },
  { stepKey: "E", contractName: "SPV Shareholder Agreement (BEBUS)", entityLevel: "spv", status: "not_started", priority: "high", riskLevel: "high" },
  { stepKey: "D", contractName: "Board Reserved Matters Schedule", entityLevel: "holding_co", status: "in_progress", priority: "immediate", riskLevel: "high" },
  { stepKey: "D", contractName: "Studio-to-SPV Services Agreement", entityLevel: "spv", status: "not_started", priority: "high", riskLevel: "medium" },
  { stepKey: "S", contractName: "Constitutional Governance Document", entityLevel: "holding_co", status: "in_progress", priority: "immediate", riskLevel: "critical" },
  { stepKey: "S", contractName: "Succession Plan", entityLevel: "holding_co", status: "not_started", priority: "medium", riskLevel: "high" },
  { stepKey: "S", contractName: "Charity MoU", entityLevel: "charity", status: "not_started", priority: "medium", riskLevel: "medium" },
  { stepKey: "S", contractName: "Profit Donation Agreement", entityLevel: "charity", status: "not_started", priority: "low", riskLevel: "medium" },
  { stepKey: "I", contractName: "IP Licence (Studio → SPV)", entityLevel: "spv", status: "not_started", priority: "immediate", riskLevel: "critical" },
  { stepKey: "I", contractName: "Field-of-Use Licence (BEBUS)", entityLevel: "spv", status: "not_started", priority: "immediate", riskLevel: "high" },
  { stepKey: "I", contractName: "FEDSILK Attribution Contract", entityLevel: "venture", status: "not_started", priority: "medium", riskLevel: "medium" },
  { stepKey: "L", contractName: "Investment MoU (Seed Round)", entityLevel: "spv", status: "in_progress", priority: "immediate", riskLevel: "high" },
  { stepKey: "L", contractName: "Investor Term Sheet", entityLevel: "spv", status: "not_started", priority: "immediate", riskLevel: "high" },
  { stepKey: "L", contractName: "GDPR Data Processing Agreement", entityLevel: "holding_co", status: "not_started", priority: "high", riskLevel: "high" },
  { stepKey: "K", contractName: "Attribution Contract (knowledge contributors)", entityLevel: "venture", status: "not_started", priority: "medium", riskLevel: "medium" },
];

const SEED_RISKS = [
  { stepKey: "F", riskName: "Founder IP not formally assigned", category: "IP ownership ambiguity", severity: "critical", status: "open", recommendedAction: "Execute Founder IP Assignment before any investment pitch. Engage IP counsel." },
  { stepKey: "F", riskName: "Founder dependency — single point of failure", category: "Founder dependency risk", severity: "high", status: "open", recommendedAction: "Complete succession plan (Step S) and ensure key-person insurance is in place." },
  { stepKey: "E", riskName: "Equity structure undocumented at BEBUS SPV level", category: "SPV governance gap", severity: "high", status: "open", recommendedAction: "Execute SPV Shareholder Agreement. Confirm cap table with legal counsel." },
  { stepKey: "E", riskName: "ESOP scheme not formally approved by board", category: "Unclear ESOP or equity participation", severity: "high", status: "open", recommendedAction: "Table ESOP scheme for board resolution. Confirm EMI eligibility with HMRC." },
  { stepKey: "D", riskName: "Reserved matters schedule not ratified", category: "Unclear decision authority", severity: "high", status: "open", recommendedAction: "Schedule board meeting to ratify reserved matters schedule v1.0 by July 2026." },
  { stepKey: "D", riskName: "No formal delegation matrix between Studio and SPV", category: "Unclear decision authority", severity: "medium", status: "open", recommendedAction: "Draft delegation of authority matrix aligned to board reserved matters." },
  { stepKey: "S", riskName: "Mission drift risk — no constitutional lock", category: "Mission drift risk", severity: "critical", status: "open", recommendedAction: "Complete constitutional governance document with mission-lock clause. Seek board adoption." },
  { stepKey: "S", riskName: "Charity profit-donation ambiguity", category: "Charity/profit-donation ambiguity", severity: "medium", status: "open", recommendedAction: "Formalise charity MoU and define profit definition formula with finance director." },
  { stepKey: "I", riskName: "IP licence from Studio to BEBUS SPV absent", category: "IP ownership ambiguity", severity: "critical", status: "open", recommendedAction: "Execute IP licence and field-of-use licence before BEBUS commences commercial operations." },
  { stepKey: "I", riskName: "FEDSILK data attribution gaps in external consortium", category: "Incomplete attribution record", severity: "medium", status: "open", recommendedAction: "Execute attribution contracts for all external data contributors. Ensure M4 ledger covers all participants." },
  { stepKey: "L", riskName: "Investment MoU terms not board-approved", category: "Missing board approval", severity: "high", status: "open", recommendedAction: "Present investment MoU terms to board for reserved matter approval before signing." },
  { stepKey: "L", riskName: "GDPR data processing agreement absent", category: "Missing contract", severity: "high", status: "open", recommendedAction: "Engage data protection counsel to draft and execute DPA before any personal data processing." },
  { stepKey: "K", riskName: "No immutable governance decision log", category: "Incomplete attribution record", severity: "high", status: "open", recommendedAction: "Activate board decision log. Retroactively document material decisions from incorporation date." },
  { stepKey: "K", riskName: "GDPR Article 17 unlearning protocol not documented", category: "Missing contract", severity: "medium", status: "open", recommendedAction: "Document the M5 unlearning exit protocol as a board-approved GDPR compliance policy." },
];

async function seedIfEmpty(db: any) {
  // Use onConflictDoNothing so concurrent requests can't race-insert duplicates.
  await db.insert(fedsilkSteps).values(
    SEED_STEPS.map(s => ({ ...s, dueDate: s.dueDate ? new Date(s.dueDate) : null }))
  ).onConflictDoNothing();
  await db.insert(fedsilkEvidence).values(
    SEED_EVIDENCE.map(e => ({ ...e, dueDate: null }))
  ).onConflictDoNothing();
  await db.insert(fedsilkContractTriggers).values(
    SEED_CONTRACTS.map(c => ({ ...c, legalRecordId: null }))
  ).onConflictDoNothing();
  await db.insert(fedsilkRiskFlags).values(
    SEED_RISKS.map(r => ({ ...r, owner: "Brian (CEO)", dueDate: null }))
  ).onConflictDoNothing();
  return { seeded: true };
}

// ─── Router ────────────────────────────────────────────────────────────────────

export const fedsilkGovernanceRouter = router({

  seed: publicProcedure.mutation(async () => {
    const db = await getDb();
    return seedIfEmpty(db!);
  }),

  getSteps: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      await seedIfEmpty(db!);
      const rows = await db!.select().from(fedsilkSteps)
        .orderBy(asc(fedsilkSteps.sortOrder));
      return rows;
    }),

  upsertStep: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      stepKey: z.string(),
      status: z.enum(["not_started", "in_progress", "under_review", "approved", "blocked"]),
      owner: z.string().optional(),
      dueDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      const payload = { ...data, dueDate: data.dueDate ? new Date(data.dueDate) : null, updatedAt: new Date() };
      if (id) {
        await db!.update(fedsilkSteps).set(payload).where(eq(fedsilkSteps.id, id));
        return { id };
      }
      const [r] = await db!.insert(fedsilkSteps).values(payload as any).returning();
      return { id: r.id };
    }),

  getEvidence: publicProcedure
    .input(z.object({ stepKey: z.string().optional(), ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db!.select().from(fedsilkEvidence)
        .where(input.stepKey ? eq(fedsilkEvidence.stepKey, input.stepKey) : undefined);
      return rows;
    }),

  updateEvidence: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.string(),
      owner: z.string().optional(),
      documentUrl: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      await db!.update(fedsilkEvidence).set({ ...data, updatedAt: new Date() }).where(eq(fedsilkEvidence.id, id));
      return { id };
    }),

  getContracts: publicProcedure
    .input(z.object({ stepKey: z.string().optional(), ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db!.select().from(fedsilkContractTriggers)
        .where(input.stepKey ? eq(fedsilkContractTriggers.stepKey, input.stepKey) : undefined);
      return rows;
    }),

  updateContract: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.string(),
      priority: z.string().optional(),
      riskLevel: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      await db!.update(fedsilkContractTriggers).set({ ...data, updatedAt: new Date() }).where(eq(fedsilkContractTriggers.id, id));
      return { id };
    }),

  getRisks: publicProcedure
    .input(z.object({ stepKey: z.string().optional(), ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db!.select().from(fedsilkRiskFlags)
        .where(input.stepKey ? eq(fedsilkRiskFlags.stepKey, input.stepKey) : undefined);
      return rows;
    }),

  updateRisk: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["open", "mitigated", "accepted", "escalated"]),
      severity: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      await db!.update(fedsilkRiskFlags).set({ ...data, updatedAt: new Date() }).where(eq(fedsilkRiskFlags.id, id));
      return { id };
    }),

  getSummary: publicProcedure.query(async () => {
    const db = await getDb();
    const [steps, evidence, contracts, risks] = await Promise.all([
      db!.select().from(fedsilkSteps),
      db!.select().from(fedsilkEvidence),
      db!.select().from(fedsilkContractTriggers),
      db!.select().from(fedsilkRiskFlags),
    ]);
    const stepsApproved = steps.filter(s => s.status === "approved").length;
    const evidenceComplete = evidence.filter(e => e.status === "approved" || e.status === "complete").length;
    const evidencePct = evidence.length > 0 ? Math.round((evidenceComplete / evidence.length) * 100) : 0;
    const openHighRisks = risks.filter(r => r.status === "open" && (r.severity === "critical" || r.severity === "high")).length;
    const missingContracts = contracts.filter(c => c.status === "not_started" && (c.priority === "immediate" || c.priority === "high")).length;
    const pendingApprovals = steps.filter(s => s.status === "under_review").length;
    const contractCoverage = contracts.length > 0
      ? Math.round((contracts.filter(c => c.status !== "not_started").length / contracts.length) * 100)
      : 0;
    const completionScore = Math.round(
      (stepsApproved / Math.max(steps.length, 1)) * 40 +
      (evidencePct / 100) * 40 +
      ((contracts.length - missingContracts) / Math.max(contracts.length, 1)) * 20
    );
    return {
      totalSteps: steps.length,
      stepsApproved,
      completionScore,
      evidencePct,
      openHighRisks,
      missingContracts,
      pendingApprovals,
      contractCoverage,
    };
  }),
});
